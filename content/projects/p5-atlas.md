---
title: "P5 — ATLAS (Autonomous Pentest Pipeline)"
summary: "Autonomous HTB/CTF pentest agent: recon → enumeration → web → exploit → privesc → report. Tiered Claude with prompt caching. NSE vuln + hydra brute + SSH-based privesc. Human-in-the-loop checkpoints or full auto mode."
status: "shipped"
weight: 1
github: "https://github.com/PyHackSecGP/p5-atlas"
tags: ["python", "pentesting", "htb", "llm", "automation", "nmap", "hydra", "privesc", "claude", "prompt-caching"]
date: 2026-07-05
---

## What It Does

Point ATLAS at an HTB/CTF machine IP. It runs a six-stage pentest pipeline autonomously — scans ports, enumerates every service, attacks the web layer, exploits, escalates to root, and generates a Markdown writeup. Human-in-the-loop checkpoints let you review and approve every action, or run fully autonomous with `--auto`.

## Pipeline

```
Target IP
      ↓
  Recon         nmap fast → deep, NSE vuln scripts, parallel whatweb
      ↓
  Enumerate     SMB + FTP + LDAP + SNMP in parallel, hydra brute on found users
      ↓
  Web           nikto + gobuster simultaneously per target, vhost ffuf
      ↓
  Exploit       searchsploit + LLM plan → execute → shell + flag detection
      ↓
  PrivEsc       SSH exec: SUID, sudo, caps, cron, kernel, LinPEAS → root flag
      ↓
  Report        Full Markdown writeup, auto-commit to ctf-lab
```

## Elite Features

- **Tiered LLM** — Haiku for cheap recon/enum analysis, Sonnet for exploit/privesc planning. Reduces per-run API cost 60–80% versus Sonnet-only.
- **Prompt caching** — Claude system prompts cached across all six agents (~90% cost cut on repeated system context).
- **Retry + backoff** — exponential backoff on rate limits and 5xx errors. Cache hit-rate telemetry printed at session end.
- **NSE vuln scripts** — free CVE detection: EternalBlue (MS17-010), Shellshock, Heartbleed, MS08-067, `smb-vuln-*`.
- **Hydra brute-force** — auto-fires against SSH/FTP when usernames are enumerated. Top-500 rockyou passwords, `-f` stop-on-hit.
- **SSH-based PrivEsc** — `sshpass` runs 18 Linux enum commands (SUID, `sudo -l`, capabilities, cron, kernel, docker group, bash history). Optional LinPEAS via SSH pipe.
- **HTB flag auto-capture** — recognizes `HTB{...}` and 32-hex legacy flags. Reads `/root/root.txt` on `uid=0` detection.
- **Session portfolio** — `atlas.py --list-sessions` shows every past run with root/user checkmarks.

## Parallel Tool Execution

Every stage runs independent tools simultaneously via `concurrent.futures.ThreadPoolExecutor`:

| Stage | Tools | Sequential | Parallel |
|---|---|---|---|
| Recon | whatweb per port | 4 ports × 15s = 60s | 15s |
| Enumeration | enum4linux + ftp + ldapsearch + snmpwalk | 4 tools × 45s = 180s | 45s |
| Web | nikto + gobuster | 2 tools × 3m = 6m | 3m |

**Typical time saving: 60–70% reduction in tool execution.**

## Autonomy Dial

`--auto-risk` controls how much the agent handles itself before pausing:

| Level | Behaviour |
|---|---|
| `low` | Approves scans only. Every exploit still prompts. |
| `medium` (default) | + gobuster/nikto/hydra auto-approve. |
| `high` | + exploits auto-approve. Only critical prompts. |
| `critical` | Full autopilot. |

Even in auto mode, every checkpoint still renders FOUND / PLAN / WHY / LOOK-FOR / COMMAND — nothing is a black box.

## Human-in-the-Loop Checkpoints

Before every action ATLAS shows:

- **FOUND** — what was discovered
- **PLAN** — what will happen next
- **WHY** — attack reasoning
- **LOOK FOR** — what indicates success
- **COMMAND** — exact command that will run
- **RISK** — low/medium/high/critical

Choose: `a`=approve, `s`=skip, `m`=modify command, `q`=quit.

## LLM Providers

| Provider | Backend | Notes |
|---|---|---|
| `claude` | Anthropic API | Prompt caching + auto-tier |
| `ollama` | Local claw-core | On-prem, no data egress |

Auto-tier map: `recon`/`enumeration` → Haiku 4.5, `web`/`exploit`/`privesc`/`report` → Sonnet 4.6.

## Engineering Details

**Prompt caching architecture** — every agent extends `BaseAgent` with a shared `SYSTEM_PROMPT`. `ClaudeProvider` marks the system block with `cache_control: ephemeral`. Subsequent agent calls read from cache at ~10% the input price.

**Thread-safe parallel output** — parallel tool runs suppress per-line streaming (interleaved output is unreadable). Each tool writes its full output to a log file; results are collected after `as_completed()`. A print lock serialises completion notices.

**Checkpoint-then-parallelize pattern** — EnumerationAgent shows per-service checkpoints sequentially (preserving the interactive approval flow), collects approved tasks into a list, then fires them in a single `run_parallel()` call. No checkpoint is skipped; parallelism only applies to approved execution.

**Session resume** — full state (ports, credentials, findings, `AgentResult` list, LLM metadata) is persisted after each stage. `atlas.py --resume --stage privesc` picks up exactly where it left off with all context intact.

**Shell detection fix** — subprocess captures non-interactive output. The original regex looked for `$` and `#` prompts that never appear post-hoc. Rewritten to match concrete RCE evidence: `uid=N(user)`, `/etc/passwd` content, `uname -a` output, Windows version banner, meterpreter tags.

## Usage

```bash
# Interactive (default) — pause at every checkpoint
atlas.py 10.10.11.100

# Autonomous below high risk
atlas.py 10.10.11.100 --auto --auto-risk high

# Local claw-core instead of Claude
atlas.py 10.10.11.100 --provider ollama --model hermes3:70b

# Resume from privesc stage
atlas.py 10.10.11.100 --resume --stage privesc

# Portfolio view — every past run
atlas.py --list-sessions
```

## Output

Each run produces `~/atlas-sessions/<ip>/`:

- `*.txt` — raw tool logs per command
- `session.json` — full state: ports, creds, findings, agent results
- `writeup/<date>-<machine>.md` — HTB writeup, auto-committed to `ctf-lab`
- `atlas_privesc.sh` — enum script if no SSH creds (fallback path)

## Stack

Python 3.11+ · Anthropic SDK (caching enabled) · Ollama · rich · nmap · gobuster · nikto · ffuf · enum4linux-ng · smbclient · ldap-utils · snmp · hydra · sshpass · searchsploit
