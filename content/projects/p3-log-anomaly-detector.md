---
title: "P3 — AI Log Anomaly Detector"
summary: "Parses Linux auth logs and journalctl JSON, detects 7 attack patterns mapped to MITRE ATT&CK with confidence scoring, enriches IPs via AbuseIPDB, and sends a local LLM threat assessment."
status: "shipped"
weight: 2
github: "https://github.com/PyHackSecGP/p3-log-anomaly-detector"
tags: ["python", "blue-team", "ai", "mitre", "logging", "siem"]
date: 2026-06-01
---

## Problem

`/var/log/auth.log` generates thousands of events. The signal is there — brute forces, privilege escalations, new user accounts — but drowning in noise. SOC tools cost $$$. This tool is free, local, and maps every finding to MITRE ATT&CK.

## Detection Rules

| Pattern | ATT&CK | Confidence Formula |
|---------|--------|-------------------|
| SSH brute force (≥10 failures/5 min, same IP) | T1110.001 | `min(count/50, 1.0)` |
| Distributed brute force (≥5 IPs, same user) | T1110.003 | `min(ips/30, 1.0)` |
| Credential stuffing (≥10 fails, ≥5 users) | T1110.004 | `min(failures/20, 1.0)` |
| sudo failures (≥3 in 10 min) | T1548.003 | `min(count/10, 1.0)` |
| su to root | T1548.003 | 0.85 |
| New user via useradd | T1136.001 | 1.0 |
| Root SSH login | T1078.003 | 1.0 |

## Pipeline

```
auth.log / journalctl JSON
  → parse (sliding-window event classifier)
  → detect (rule engine → Anomaly dataclass)
  → enrich (AbuseIPDB: abuse score, geo, report count)
  → analyze (local Ollama: threat narrative + response steps)
  → report (text + JSON + email alert on CRITICAL/HIGH)
```

## Confidence Scoring

Every anomaly gets a `confidence` float 0.0–1.0 based on evidence count. A single failed password is noise; 50 failures from the same IP in 5 minutes is confidence 1.0. Triage by `confidence × severity` instead of raw event counts.

## Usage

```bash
# Analyze live auth log with IP reputation
python main.py /var/log/auth.log --abuseipdb $KEY

# Analyze journalctl export
journalctl -o json > /tmp/j.json
python main.py /tmp/j.json --format journalctl --json report.json

# Skip AI, rule-based only
python main.py sample_auth.log --no-ai
```
