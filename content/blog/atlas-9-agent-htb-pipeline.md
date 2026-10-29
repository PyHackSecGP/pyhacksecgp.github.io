---
title: "Building a 9-Agent Autonomous HTB Pentester with Dynamic Routing and Portfolio Metrics"
date: 2026-10-29
description: "An honest build log of ATLAS — 9 specialist agents, dynamic stage routing, tiered Haiku/Sonnet, portfolio metrics tracking flag capture rate."
tags: ["aisecurity", "agenticai", "pentesting", "python"]
---

## 1. The honest hook

I got tired of HTB taking six hours per medium box. Not because the boxes were hard — because 70% of each session was the same mechanical loop: `nmap`, read output, pick a web port, `ffuf`, `nikto`, `searchsploit`, grep for versions, repeat. The thinking part — "that's a weird header, let me chain this LFI into an RCE" — was maybe 90 minutes. Everything else was data-entry pretending to be hacking.

So I built ATLAS: nine specialist agents that compress the mechanical scanning + lookup work to about twenty minutes and hand me back the strategic parts to actually enjoy. It is not a magic one-shot HTB solver. It is a mechanical labourer with human checkpoints that writes a MITRE-mapped writeup when it is done. Repo: [github.com/PyHackSecGP/p5-atlas](https://github.com/PyHackSecGP/p5-atlas).

This post is the build log — what worked, what I had to tear up, and the three design decisions that actually mattered.

## 2. The problem

Solo HTB practice has a shape: four to eight hours per medium box, maybe half of that genuinely instructive. The rest is boilerplate — `nmap -sV -sC`, service version lookup, directory busting, SMB enum, kicking off `linpeas`, waiting for `linpeas`, reading `linpeas`. All deterministic. All boring. All necessary.

The hard parts stay hard: deciding *which* vector is likely, adapting a public PoC to this specific target, spotting that a cron job is world-writable because the backup script `source`s a config file whose parent dir you own. Those are the moments worth your evening.

The design brief wrote itself: automate the mechanical 70% safely, keep the strategic 30% human. "Safely" is doing load-bearing work there — autonomous offensive tooling without supervision is a scope violation waiting for a lawyer.

## 3. Why nine agents, not one

The naive move is "wrap `nmap`, `gobuster`, `linpeas` in a single LLM harness and let it loop." I tried. It degrades badly. Context balloons, the model confuses its own prior tool output for new findings, and when something fails there is no clean place to retry. You get a 40k-token blob that is simultaneously doing recon and arguing with itself about privesc.

Specialist agents fix this. Each one has a narrow system prompt, a small tool belt, and writes its results back to a shared `HackSession` dataclass. Handoffs are typed. Each stage is independently debuggable, replayable, and cheap to re-run.

The nine:

- **ReconAgent** — `nmap -sV -sC`, `whatweb`, NSE scripts. Always first.
- **PlannerAgent** — LLM-only, reads recon metadata, emits a `MachineAttackPlan`.
- **EnumerationAgent** — SMB, LDAP, FTP, SNMP; `enum4linux`, `netexec`, `ldapsearch`; `hydra` as last resort.
- **WebAgent** — `gobuster`, `ffuf`, `nikto`, `nuclei`.
- **ExploitAgent** — `searchsploit`, LLM-adapted PoC, `sshpass` for pivot.
- **LootAnalyzerAgent** — parses downloaded files for keys and creds.
- **PrivEscAgent** — Linux and Windows paths over SSH / Evil-WinRM.
- **ReporterAgent** — markdown + MITRE map + git commit into `ctf-lab`.
- **BaseAgent** scaffold — `ask()`, `ask_json()`, `checkpoint()`, `run_tool_adaptive()`.

All nine inherit the same scaffold:

```python
class BaseAgent:
    NAME  = "Agent"
    STAGE = Stage.INIT

    def ask_json(self, prompt: str) -> dict:
        system = self.SYSTEM_PROMPT + "\nAlways respond with valid JSON."
        return self.llm.generate_json(system, f"{self.session.context_summary()}\n\n{prompt}")

    def checkpoint(self, what_found: str, plan: str, why: str,
                   what_to_look_for: str, command: str = "",
                   risk: str = "medium") -> cp.CheckpointResult:
        return cp.checkpoint(agent=self.NAME, what_found=what_found,
                             plan=plan, why=why, what_to_look_for=what_to_look_for,
                             command=command, risk=risk)
```

Every risky step routes through `self.checkpoint()` with a risk tier. Every LLM call carries the same shared `HackSession.context_summary()` so no agent has to re-derive what has already been found.

## 4. The novel bit: dynamic routing

Hardcoded pipelines (`recon → enum → web → exploit → privesc → report`) are wrong for most boxes. A Linux-only webapp has no SMB; running `enum4linux` burns three minutes for nothing. An AD-DC has no web; running `gobuster` is just noise. The fix: let a Planner agent decide the stage order *after* recon.

The Planner reads recon metadata and emits a `MachineAttackPlan`:

```python
plan_data = self.ask_json(f"""
Build a tactical attack plan for this HTB machine.

TARGET: {self.session.target_ip}
OS: {self.session.os_guess or 'unknown'}
Open ports: {', '.join(f"{p.number}/{p.service} {p.version}" for p in self.session.open_ports)}
Flags: web={has_web}, smb={has_smb}, ldap={has_ldap}, ssh={has_ssh}, winrm={has_winrm}

Rules:
- Skip "web" if no HTTP/HTTPS ports exist
- Skip "enumeration" if no SMB/LDAP/FTP/SNMP
- If a direct CVE is visible, put "exploit" before "enumeration"
- Always end with "report"
""")
```

The orchestrator honours the plan with a dynamic stage list and a hard-fact fallback:

```python
def _should_skip(session: HackSession, stage: Stage) -> bool:
    plan = session.attack_plan
    if plan and stage.value in plan.skip_stages:
        return True
    if stage == Stage.WEB and not session.web_ports:
        return True
    return False
```

Concrete example from a real run. Recon finds SSH on 22 and Request Tracker 4.4.4 on 80 — no SMB, no LDAP. The Planner emits `stage_order=["web", "exploit", "privesc", "report"]` with `skip_stages=["enumeration"]`. ATLAS goes straight to the webapp, finds the Request Tracker default `root:password`, pulls an SSH key out of a user profile notes field, pivots to a shell, and spots a world-writable backup cron owned by root. Total mechanical time: about twenty-two minutes. Enumeration stage never ran, because enumeration had nothing to enumerate.

The important bit is that it is a *plan*, not an edict. The orchestrator still vetoes impossible routes (`WEB` with no web ports gets skipped regardless of what the LLM said), and the Planner can be ignored entirely with `--stage` overrides. The LLM proposes; the state machine disposes.

## 5. Keeping it cheap: tiered LLM + prompt caching

Nine agents making five to ten API calls each adds up fast if every call hits Sonnet. The lazy fix is tiering: Haiku for routine parsing, Sonnet for actual reasoning.

```python
STAGE_MODEL_MAP: dict[str, str] = {
    "recon":       TIER_CHEAP,
    "enumeration": TIER_CHEAP,
    "planning":    TIER_CHEAP,
    "web":         TIER_SMART,
    "exploit":     TIER_SMART,
    "privesc":     TIER_SMART,
    "report":      TIER_SMART,
}
```

Recon and enumeration mostly diff tool output and classify services. Haiku handles that for pennies. Web, exploit, privesc need multi-step reasoning across tool outputs; Sonnet earns its token price there. Reporter stays on Sonnet because the writeup is the portfolio-visible artifact — quality matters.

The second lever is ephemeral prompt caching on the system block. Every call reuses the same system prompt, so the first call pays the write cost and the rest hit the cache:

```python
system_blocks = [{
    "type": "text",
    "text": system,
    "cache_control": {"type": "ephemeral"},
}]
```

Cache hits are counted per-call and reported at session end:

```python
def cost_summary(self) -> str:
    total = self.cache_hits + self.cache_misses
    if total == 0:
        return f"no LLM calls ({self.total_calls} total)"
    hit_rate = 100 * self.cache_hits / total
    return (f"cache: {self.cache_hits}/{total} hits ({hit_rate:.0f}%), "
            f"{self.total_calls} total API calls")
```

Target: under $0.50 per full easy/medium box. On real runs I see 70–85% cache hit rate and spend in that ballpark. Hard boxes with lots of exploit iteration can creep to $1–$2. If I don't want to pay anything I swap in `--provider ollama --model hermes3:70b` and run the whole pipeline against the homelab for free, at the cost of a quality drop on JSON-schema-heavy stages.

## 6. Keeping it safe: human checkpoints

Autonomous offensive tooling is a liability if it is actually autonomous. Every risky action in ATLAS pauses on a checkpoint — a four-field panel of what was found, the plan, why that plan, and what to watch for — plus a declared risk tier. `--auto` mode only auto-approves checkpoints up to a configurable risk ceiling (`--auto-risk medium` is the default; `high` and `critical` always prompt).

```python
resume = cp.checkpoint(
    agent="Orchestrator",
    what_found=f"{agent.NAME} crashed: {e}",
    plan="Skip to next stage",
    why="Agent failed — tool may not be installed or network issue",
    what_to_look_for="Check required tools are installed",
    risk="low",
)
```

Risk tiers map to blast radius: `low` is read-only scanning, `medium` is directory busting or default-cred login attempts, `high` is hydra brute force or dropping a webshell, `critical` is cron modification or a DCSync chain. In practice I run `--auto --auto-risk medium` on retired boxes and keep my eyes on anything that writes to disk.

The second safety rail is credential hygiene. The LLM never sees passwords. `HackSession.context_summary()` emits usernames only:

```python
if self.credentials:
    lines.append(f"Credentials: {len(self.credentials)}")
    users = list(dict.fromkeys(c.username for c in self.credentials if c.username))
    if users:
        lines.append(f"  Known users: {', '.join(users[:8])}")
```

Passwords and hashes stay in the local state object. The LLM reasons about *which* account to pivot through, not what the password string is.

## 7. Measuring it: portfolio metrics

Doing twelve HTB machines is worth more if you can prove it with a number. Every completed run appends one record to `~/.atlas/portfolio.json`:

```python
rec = {
    "target": getattr(session, "target_ip", ""),
    "machine": getattr(session, "machine_name", "") or getattr(session, "target_ip", ""),
    "difficulty": getattr(getattr(session, "attack_plan", None), "machine_difficulty", "") or "",
    "os": getattr(session, "os_guess", ""),
    "user_flag_captured": bool(getattr(session, "user_flag", "")),
    "root_flag_captured": bool(getattr(session, "root_flag", "")),
    "duration_sec": float(duration_sec) if duration_sec is not None else 0.0,
    "timestamp": int(time.time()),
    "agents_used": [ar.agent for ar in getattr(session, "agent_results", []) if hasattr(ar, "agent")],
    "mitre_techniques": sorted({tid for f in getattr(session, "findings", [])
                                for tid in [getattr(f, "mitre_id", "")] if tid}),
}
```

Append-only, trivially mergeable, no DB. `python -m metrics` aggregates and prints:

```
ATLAS Portfolio
===============
Total runs:        12
User flags:        10  (83.3%)
Root flags:        7   (58.3%)
Both flags:        7   (solve rate 58.3%)
Avg duration:      2103.4s

By difficulty:
  easy       4/4   (100% rooted)
  medium     3/6   (50% rooted)
  hard       0/2   (0% rooted)

Top MITRE techniques:
  T1190      8
  T1548      5
  T1136      3
```

This is the interview-visible proof-of-work. A hiring manager can run one command and see a solve-rate curve across difficulty tiers plus which techniques I am actually practising. That is a stronger signal than a CV bullet.

## 8. MITRE ATT&CK mapping

Every writeup gets an ATT&CK table so defenders can map detections to the attack path. `tools/mitre_mapper.py` holds a keyword-indexed table and iterates findings/results/notes to tag them:

```python
_TECHNIQUE_DB: list[tuple[list[str], AttackTechnique]] = [
    (["default password", "default cred", "admin:admin", "root:root"], AttackTechnique(
        "T1078.001", "Valid Accounts: Default Accounts", "Initial Access", "TA0001",
        "https://attack.mitre.org/techniques/T1078/001/")),
    (["cron", "crontab", "cronjob", "scheduled task"], AttackTechnique(
        "T1053.003", "Scheduled Task/Job: Cron", "Privilege Escalation", "TA0004",
        "https://attack.mitre.org/techniques/T1053/003/")),
]
```

Keyword indexing is dumb and works. The output lands in the writeup as a clean three-column table (technique, name, tactic + ID) with URLs to attack.mitre.org, so a blue-team reader can jump straight from the attack narrative to detection guidance.

## 9. What is next

Three directions I am prototyping:

- **Adaptive risk scoring per machine type.** `--auto-risk` is static; it should learn that AD-DC privesc chains deserve more scrutiny than Linux SUID lookups.
- **Persistent cache tier.** Ephemeral prompt caching dies in minutes; a semantic cache for common recon classifications would cut cost further.
- **HTB difficulty learning signal.** The Planner currently guesses `machine_difficulty` from vibes. Feeding the portfolio record back into the Planner's few-shot context would let it calibrate.

## 10. Closing

ATLAS is on GitHub at [github.com/PyHackSecGP/p5-atlas](https://github.com/PyHackSecGP/p5-atlas) — 194 passing tests, Claude or Ollama, retired HTB boxes and authorised labs only. If you break it on a weird box, open an issue with the `session.json`. The raw outputs are captured; the failure is reproducible.
