---
title: "/now"
summary: "What I'm shipping this month. Updated frequently."
date: 2026-10-29
menu:
  main:
    name: "~/now"
    weight: 5
---

> This is a [/now page](https://sive.rs/nowff) — what I'm actively working on right now, not an archive. Updated as the week shifts.

**Last updated:** 2026-10-29

---

## Shipping this week

- **P5 ATLAS portfolio metrics** — just shipped `metrics.py` tracking flag capture, duration, MITRE technique histogram per run. `python -m metrics` prints solve rate + by-difficulty breakdown. Interview-visible proof-of-work.
- **P4 Mini-CRS auto daemon** — went live on claw-core: `p4-agent`, `p4-dashboard`, `p4-scheduler.timer`, `p4-watcher` all running under systemd user units with linger enabled. Flask dashboard on `127.0.0.1:5557`.
- **5 MCP servers** — cve-mcp, wazuh-mcp, tooling-mcp, ai-redteam-mcp, proxmox-mcp all shipped and registered in Claude Desktop. 42 tools total across the five.
- **29-repo README sweep** — rewrote every portfolio README as a 3-audience doc (novice → interviewer → technical). 500+ lines each average.

## In progress

- **P6 Council** — 5-persona AI briefing system running at 07:00 + 19:00 Pacific. Hardening the voice synthesis + vault write-through.
- **Nudger** — 5x/day Telegram accountability bot. Telegram topic support shipped (unified forum hub for all bots). Waiting on final token wiring.
- **AIxCC follow-up** — reading full DARPA AIxCC winners' postmortems, folding ideas into P4 Mini-CRS Phase 6 (coverage-biased patch validation).

## Learning this month

- **MCP protocol internals** — reading the Anthropic MCP spec in full. Pattern-mining what makes a good MCP server vs a poorly-abstracted one.
- **Agentic patterns beyond ReAct** — Reflexion, Chain-of-Verification, structured planning before execution. Applying to P5 ATLAS Planner.
- **HTB machines** — one rooted machine per week target, auto-written up via ATLAS pipeline and committed to [ctf-lab](https://github.com/PyHackSecGP/ctf-lab).

## Long-term target (anchors every decision)

**Senior AI Red Team Engineer at $200k CAD, remote, by July 2027.**

The thesis: LLMs collapse the cost of agentic security tooling. The window to build real portfolio evidence of agentic AI x security is now, not after certs.

## Homelab stack

- Proxmox 8 cluster on PVE host
- Tailscale mesh across all nodes (brain / claw-core / mediaserver / scanner / greenbone / pihole / adguard)
- Forgejo (Docker) for self-hosted git mirrors
- Wazuh + Greenbone + DefectDojo + Trivy + Falco + Cowrie for the full defensive pipeline
- ISP router handles LAN perimeter (OPNsense decommissioned 2026-10-28)

## Health

- 75 Hard challenge — ongoing
- Running — tracker lives at [75hard-tracker](https://github.com/PyHackSecGP/75hard-tracker)
- Target: marathon-ready weight by end of 2027

---

<sub>Inspired by Derek Sivers' /now movement. Last authored 2026-10-29.</sub>
