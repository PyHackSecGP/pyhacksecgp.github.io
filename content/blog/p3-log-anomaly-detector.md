---
title: "AI Log Anomaly Detector: auth.log to MITRE ATT&CK in 30 Seconds"
date: 2026-06-01
description: "Rule-based detection engine with MITRE ATT&CK mapping, confidence scoring, AbuseIPDB enrichment, and local LLM threat assessment."
tags: ["security", "python", "blue-team", "ai", "mitre", "logging"]
---

## Why I Built This

`/var/log/auth.log` is full of signal. Brute forces, privilege escalations, new user accounts — all there. But finding them manually means `grep`-ing through thousands of lines. Enterprise SIEMs cost money. This tool is free, local, and takes 30 seconds.

## Detection Engine

The core is a sliding-window classifier that groups events by IP/user and fires rules when thresholds are crossed:

| Pattern | ATT&CK | Confidence |
|---------|--------|-----------|
| SSH brute force (≥10 failures/5 min) | T1110.001 | `min(count/50, 1.0)` |
| Distributed BF (≥5 IPs, same user) | T1110.003 | `min(ips/30, 1.0)` |
| Credential stuffing (≥10 fails, ≥5 users) | T1110.004 | `min(failures/20, 1.0)` |
| sudo failures (≥3 in 10 min) | T1548.003 | `min(count/10, 1.0)` |
| su to root | T1548.003 | 0.85 |
| useradd | T1136.001 | 1.0 |
| Root SSH login | T1078.003 | 1.0 |

## Confidence Scoring

Every anomaly gets a `confidence` float 0.0–1.0. A single failed password is 0.02 confidence. 50 failures from the same IP in 5 minutes is 1.0. Triage by `confidence × severity` instead of wading through event counts.

This matters: a CRITICAL anomaly at 0.1 confidence might be less urgent than a HIGH at 0.95.

## journalctl Support

Modern systemd systems export logs as JSON:

```bash
journalctl -o json > /tmp/journal.json
python main.py /tmp/journal.json --format journalctl
```

The parser handles `__REALTIME_TIMESTAMP` (microseconds since epoch) and reuses the same classification logic as the auth log parser.

## AbuseIPDB Enrichment

Source IPs get checked against AbuseIPDB (free tier, 1000 checks/day). The report shows:

```
IP: 185.234.219.48 [AbuseIPDB:97% RU]
```

Instant context: known scanner, first-seen attacker, or clean.

## Local LLM Assessment

The anomaly summary (structured findings, no raw logs) goes to hermes3:70b via Ollama. The model returns a threat narrative: attack chain hypothesis, response steps, priority ranking. All on-prem.

Sample output:
```
THREAT ASSESSMENT
─────────────────
Primary threat: Coordinated SSH brute force from 185.234.219.48 (AbuseIPDB 97%)
targeting 'root' and 'admin' — classic credential stuffing pattern.

Followed by: successful login for 'backup' from same /24 subnet suggests
possible VPN/proxy rotation.

Subsequent useradd(hacker, UID=1337) and su to root indicates likely
successful compromise.

RECOMMENDED ACTIONS:
1. Block 185.234.219.0/24 at firewall immediately
2. Audit 'backup' account — credential likely compromised
3. Investigate 'hacker' account — delete and audit for persistence
4. Check cron jobs and authorized_keys for backdoors
```

Source: [github.com/PyHackSecGP/p3-log-anomaly-detector](https://github.com/PyHackSecGP/p3-log-anomaly-detector)
