---
layout: post
title: "AI Log Anomaly Detector: From auth.log to MITRE ATT&CK in 30 Seconds"
date: 2026-06-01 09:00:00 -0700
description: "A Python tool that parses Linux auth logs and journalctl JSON, runs rule-based anomaly detection mapped to MITRE ATT&CK, scores confidence, enriches IPs via AbuseIPDB, and sends the whole thing to a local LLM for threat assessment."
tags: [security, python, blue-team, ai, logging, mitre]
categories: [projects]
related_posts: false
---

## What I Built

P3 is a blue-team tool for detecting attack patterns in Linux authentication logs — without sending data to the cloud.

It parses `/var/log/auth.log` or `journalctl -o json` output and detects:

| Pattern | MITRE ATT&CK | Confidence |
|---------|-------------|-----------|
| SSH brute force (≥10 failures/5 min from same IP) | T1110.001 | `min(count/50, 1.0)` |
| Distributed brute force (≥5 IPs, same user) | T1110.003 | `min(ips/30, 1.0)` |
| Credential stuffing (≥10 failures across ≥5 users) | T1110.004 | `min(failures/20, 1.0)` |
| sudo failures (≥3 in 10 min) | T1548.003 | `min(count/10, 1.0)` |
| su to root | T1548.003 | 0.85 |
| New user created via useradd | T1136.001 | 1.0 |
| Root login via SSH | T1078.003 | 1.0 |

## The Pipeline

```
auth.log / journalctl JSON
        ↓
    log_parser / journalctl_parser
        ↓
    anomaly_detector (rule engine + MITRE mapping + confidence)
        ↓
    abuseipdb (IP reputation enrichment)
        ↓
    ollama_client (local LLM threat assessment)
        ↓
    report_generator (text + JSON output)
        ↓
    email_alerts (SMTP on CRITICAL/HIGH)
```

## Confidence Scoring

Every anomaly gets a `confidence` float (0.0–1.0) based on evidence strength. A single failed password is noise; 50 failures from the same IP in 5 minutes is a brute force — confidence 1.0. This lets analysts triage by `confidence × severity` instead of wading through raw event counts.

## Local LLM Analysis

The anomaly summary (no raw log data, just structured findings) goes to hermes3:70b via Ollama at `http://100.126.22.55:11434`. The model returns a threat narrative: attack chain hypothesis, recommended response steps, and priority ranking. All on-prem — no data leaves the network.

## AbuseIPDB Integration

Source IPs on anomalies get checked against AbuseIPDB (free tier, 1000 checks/day). The report shows `[AbuseIPDB:95% US]` inline — instant context on whether you're looking at a known scanner.

## Usage

```bash
# Analyze live auth log
python main.py /var/log/auth.log --abuseipdb $ABUSEIPDB_API_KEY --email

# Analyze journalctl export
journalctl -o json > /tmp/journal.json
python main.py /tmp/journal.json --format journalctl --json report.json
```

Source: [github.com/PyHackSecGP/p3-log-anomaly-detector](https://github.com/PyHackSecGP/p3-log-anomaly-detector)
