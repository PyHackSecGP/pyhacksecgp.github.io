---
layout: page
title: "P3 — AI Log Anomaly Detector"
description: "Auth log analysis with MITRE ATT&CK mapping, AbuseIPDB enrichment, confidence scores, email alerts"
img: assets/img/proj_logs.jpg
importance: 2
category: security tools
---

<div class="row">
  <div class="col-sm-12">
    <a href="https://github.com/PyHackSecGP/p3-log-anomaly-detector" class="btn btn-sm btn-outline-primary mb-3">
      <i class="fab fa-github"></i> View on GitHub
    </a>
  </div>
</div>

## Overview

An AI-powered Linux auth log analyzer that detects brute force attacks, privilege escalation, and credential stuffing — then maps each finding to MITRE ATT&CK, enriches IPs with AbuseIPDB reputation data, and fires email alerts.

## Detection Rules

| Rule | Method | MITRE |
|---|---|---|
| SSH Brute Force | Sliding window ≥5 failures/10min per IP | T1110 |
| Distributed Brute Force | >10 IPs with combined failures | T1110 |
| Credential Stuffing | Success after failures from same IP | T1110 |
| Sudo Failures | Repeated PAM auth failures | T1548 |
| su to root | Session opened as root via su | T1548 |
| New Account Created | useradd in log | T1136 |
| Direct Root Login | ROOT LOGIN event | T1078 |

## Pipeline

```
/var/log/auth.log  OR  journalctl -o json
         ↓
    Parser (auth log or journalctl JSON)
         ↓
    Allowlist filter (skip trusted IPs/users)
         ↓
    Rule-based detection
         ↓
    MITRE ATT&CK mapping + Confidence score
         ↓
    AbuseIPDB IP enrichment (optional)
         ↓
    AI analysis via Ollama (optional)
         ↓
    Terminal report + JSON + Email alert
```

## Confidence Scoring

Each anomaly gets a `0.0–1.0` confidence score based on evidence strength:
- Brute force: `min(1.0, count / 50)` — scales with attempt volume
- useradd / root login: `1.0` — deterministic, zero ambiguity
- su to root: `0.85` — high confidence, minimal false positive rate

## Stack

`Python 3.11+` · `Ollama hermes3:70b` · `AbuseIPDB API` · `smtplib` · `MITRE ATT&CK`
