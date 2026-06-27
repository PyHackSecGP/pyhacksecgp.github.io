---
layout: post
title: "Building a SAST+DAST Triage Tool with AI False-Positive Filtering"
date: 2026-05-01 09:00:00 -0700
description: "How I built a Python tool that runs Semgrep and OWASP ZAP, deduplicates findings by CWE+location, scores risk, and uses a local LLM to filter false positives — with SARIF export for GitHub Code Scanning."
tags: [security, python, sast, dast, ai, tools]
categories: [projects]
related_posts: false
---

## What I Built

P1 is a command-line triage tool that automates the painful part of static and dynamic security testing: the flood of findings that are either duplicates or false positives.

It runs **Semgrep** (SAST) and **OWASP ZAP** (DAST), then:

1. **Deduplicates** by CWE + file + line — so CWE-89 reported by both Semgrep and Bandit at the same location becomes one finding
2. **Scores risk** 0–10 based on severity + source (dynamic findings get a bump, CWE-89/CWE-79/CWE-22 get extra weight)
3. **Filters false positives** using a local LLM (hermes3:70b on Ollama) — each finding gets a `status: confirmed | needs_review | likely_fp`
4. **Exports SARIF 2.1.0** for direct upload to GitHub Code Scanning (suppressions block auto-populated for `likely_fp` findings)

## Key Technical Decisions

**CWE-based dedup key** — rule names differ between tools (`python.lang.security.injection.tainted-sql-string` vs `bandit.B608`), but if they share a CWE and fire on the same file+line, they're the same issue. Using `{cwe}:{file}:{line}` as the canonical key reduced a 400-finding test run to 180 unique issues.

**Local LLM, not cloud** — all analysis runs on `http://100.126.22.55:11434` (claw-core). No source code leaves the machine. The model sees: rule ID, CWE, severity, file path, code snippet, and the surrounding 10 lines. It returns a JSON verdict.

**SARIF suppressions** — findings with `status: likely_fp` get a `suppressions` block in the SARIF output. GitHub Code Scanning treats these as dismissed, so the dashboard stays clean while the raw data is preserved.

## Usage

```bash
# Run full pipeline
python main.py --target http://localhost:8080 --source ./src --format sarif

# Output: findings.json, findings.md, findings.sarif
```

Source: [github.com/PyHackSecGP/p1-sast-dast-triage](https://github.com/PyHackSecGP/p1-sast-dast-triage)
