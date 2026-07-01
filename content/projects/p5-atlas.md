---
title: "P5 — ATLAS (Autonomous Pentest Pipeline)"
summary: "Autonomous HTB/CTF pentest agent: recon → enumeration → web → exploit → report. Parallel tool execution via ThreadPoolExecutor. LLM-guided attack decisions at every stage."
status: "shipped"
weight: 1
github: "https://github.com/PyHackSecGP/p5-atlas"
tags: ["python", "pentesting", "htb", "llm", "automation", "nmap", "gobuster", "concurrent"]
date: 2026-07-01
---

## What It Does

Point ATLAS at an HTB/CTF machine IP. It runs a full pentest pipeline autonomously — scanning, enumerating every service, attacking the web layer, attempting exploitation, and generating a Markdown report. Human-in-the-loop checkpoints let you review and approve every action before it fires.

## Pipeline

```
Target IP
      ↓
  Recon         nmap fast → deep, parallel whatweb across all web ports
      ↓
  Enumerate     SMB + FTP + LDAP + SNMP — all approved tasks run in parallel
      ↓
  Web           nikto + gobuster run simultaneously per target, vhost ffuf
      ↓
  Exploit       LLM-guided: searchsploit, credential spray, shell catching
      ↓
  Report        Full Markdown pentest report: scope, chain, remediation
```

## Parallel Tool Execution

Every stage runs independent tools simultaneously using `concurrent.futures.ThreadPoolExecutor`:

| Stage | Tools | Sequential | Parallel |
|---|---|---|---|
| Recon | whatweb per port | 4 ports × 15s = 60s | 15s |
| Enumeration | enum4linux + ftp + ldapsearch + snmpwalk | 4 tools × avg 45s = 180s | 45s |
| Web | nikto + gobuster | 2 tools × avg 3m = 6m | 3m |

**Typical time saving: 60–70% reduction in tool execution time.**

## Human-in-the-Loop Checkpoints

Before every action ATLAS shows:
- What it found
- What it plans to run
- Why (attack reasoning)
- What to look for in the output
- Risk level

You approve, modify the command, or skip. All approvals are logged.

## LLM Providers

| Provider | Backend |
|---|---|
| `ollama` | Local claw-core — on-prem, no data egress |
| `claude` | Anthropic Messages API |

## Engineering Details

**Thread-safe output** — parallel tool runs suppress per-line streaming (interleaved output is unreadable). Each tool writes its full output to a log file; results are collected after `as_completed()`. A print lock serialises completion notices.

**Checkpoint-then-parallelize pattern** — EnumerationAgent shows all per-service checkpoints sequentially (preserving the interactive approval flow), collects approved tasks into a list, then fires them all in a single `run_parallel()` call. No checkpoint is skipped; parallelism only applies to approved tool execution.

**Stage resume** — session state is serialised after each stage. Pass `--stage web` to resume from any point without re-running prior stages.

## Usage

```bash
# Local Ollama (claw-core)
python atlas.py 10.10.11.100

# Claude API
python atlas.py 10.10.11.100 --provider claude --model claude-sonnet-4-6

# Resume from web stage
python atlas.py 10.10.11.100 --stage web

# Autonomous mode (skip all checkpoints)
python atlas.py 10.10.11.100 --auto
```

## Output

Each run produces `output/<target-ip>/`:
- `*.txt` — raw tool logs per command
- `report.md` — full pentest report
- `session.json` — credentials, ports, findings, attack chain
