---
layout: page
title: "P1 — SAST+DAST Triage Tool"
description: "Deduplicates Semgrep/Bandit/ZAP findings, CWE-based risk scoring, LLM false-positive filter, SARIF 2.1.0 export"
img: assets/img/proj_sast.jpg
importance: 1
category: security tools
---

<div class="row">
  <div class="col-sm-12">
    <a href="https://github.com/PyHackSecGP/p1-sast-dast-triage" class="btn btn-sm btn-outline-primary mb-3">
      <i class="fab fa-github"></i> View on GitHub
    </a>
  </div>
</div>

## Overview

A production-grade triage pipeline for SAST and DAST scanner output. Built because raw scanner output is noisy — the same SQLi at `app.py:42` shows up in Semgrep *and* Bandit as two separate findings. This tool collapses them into one and scores it.

## Problem It Solves

Running multiple scanners (Semgrep, Bandit, OWASP ZAP) produces hundreds of overlapping findings. Manual triage at scale is impossible. This pipeline:

1. **Deduplicates** — CWE + file + line as the dedup key; same vulnerability from two scanners = one finding
2. **Scores** — CWE-based heuristic risk score (0–10), not fake CVSS
3. **Filters** — Local LLM (hermes3:70b via Ollama) classifies each finding as `confirmed`, `needs_review`, or `likely_fp`
4. **Exports** — SARIF 2.1.0 for GitHub Code Scanning, Markdown for reports, JSON for automation

## Architecture

```
Scanner output (JSON/XML)
        ↓
   Parser layer          ← Semgrep | Bandit | ZAP parsers
        ↓
   Deduplication         ← CWE + file:line hash
        ↓
   Risk scoring          ← severity + CWE bump table
        ↓
   LLM filter (opt)      ← Ollama hermes3:70b via claw-core
        ↓
   Report output         ← SARIF | Markdown | JSON
```

## Key Technical Decisions

- **CWE-based dedup** — rule IDs differ across scanners (`python.lang.security.audit.sqli` vs `B608`) but CWE-89 is universal
- **Status field, not deletion** — findings tagged `likely_fp` are kept in the report with a suppression block in SARIF; never deleted
- **stdlib only** — no pip dependencies; runs on any Python 3.11+ install

## Stack

`Python 3.11+` · `Ollama hermes3:70b` · `SARIF 2.1.0` · `Semgrep` · `Bandit` · `OWASP ZAP`
