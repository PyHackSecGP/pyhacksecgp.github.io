---
title: "P1 — SAST+DAST Triage Tool"
summary: "Deduplicates Semgrep/Bandit/ZAP findings by CWE+location, scores risk 0-10, runs a local LLM to filter false positives, and exports SARIF 2.1.0 for GitHub Code Scanning."
status: "shipped"
weight: 1
github: "https://github.com/PyHackSecGP/p1-sast-dast-triage"
tags: ["python", "sast", "dast", "ai", "sarif", "semgrep"]
date: 2026-05-01
---

## Problem

Raw scanner output is noisy. The same SQLi vulnerability at `app.py:42` shows up in Semgrep *and* Bandit as two separate findings. Security teams waste hours deduplicating and filtering before they can triage what matters.

## What It Does

1. **Normalize** — parse Semgrep JSON, Bandit JSON, and ZAP XML into one schema with `rule_id`, `cwe`, `file`, `line`, `severity`, `snippet`
2. **Deduplicate** — key on `{cwe}:{file}:{line}`. Same vulnerability, different scanner = one finding
3. **Score** — risk score 0–10 based on severity + finding source (dynamic findings boosted) + CWE weight (SQLi/XSS/path traversal get extra)
4. **Filter FPs** — local LLM (hermes3:70b on Ollama) reviews each finding with code context → `status: confirmed | needs_review | likely_fp`
5. **Export** — SARIF 2.1.0 with suppressions block for `likely_fp` findings → direct upload to GitHub Code Scanning

## Key Technical Decisions

**CWE-based dedup** over rule-name matching — scanners use inconsistent names but share a CWE taxonomy. `CWE-89:app.py:42` is the same issue regardless of which tool found it.

**Local LLM only** — all code stays on-prem. The model sees: rule, CWE, severity, file path, 10-line snippet. Returns structured JSON verdict. No cloud calls.

**SARIF suppressions** — `likely_fp` findings are preserved in the output but marked as dismissed. The GitHub dashboard stays clean; the data isn't lost.

## Results

On a test Django app (Semgrep + Bandit + ZAP): 400 raw findings → 180 deduplicated → 142 after FP filter. ~65% reduction in triage burden.
