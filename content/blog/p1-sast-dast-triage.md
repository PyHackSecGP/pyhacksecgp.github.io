---
title: "Building a SAST+DAST Triage Tool with AI False-Positive Filtering"
date: 2026-05-01
description: "CWE-based dedup, risk scoring, local LLM FP filter, and SARIF 2.1.0 export for GitHub Code Scanning."
tags: ["security", "python", "sast", "dast", "ai", "sarif"]
---

## The Problem with Raw Scanner Output

Run Semgrep and Bandit on the same Python repo and you'll get the same SQLi finding at `app.py:42` twice — different rule name, same vulnerability. Add OWASP ZAP for dynamic analysis and the noise multiplies further. Before you can triage what matters, you're deduplicating spreadsheets.

P1 solves this.

## Architecture

```
[Semgrep JSON] [Bandit JSON] [ZAP XML]
       ↓              ↓           ↓
    parsers/base.py (unified Finding schema)
              ↓
    core/dedup.py  ← key: {cwe}:{file}:{line}
              ↓
    core/scorer.py ← risk_score 0-10
              ↓
    core/llm.py    ← hermes3:70b false-positive filter
              ↓
    output/sarif_report.py ← SARIF 2.1.0
```

## CWE-Based Deduplication

Rule names are inconsistent across tools. `python.lang.security.injection.tainted-sql-string` (Semgrep) and `bandit.B608` (Bandit) both describe CWE-89 at the same location. Use the CWE as the canonical identifier:

```python
def _dedup_key(f: Finding) -> str:
    if f.cwe:
        return f"{f.cwe}:{f.file}:{f.line}"
    return f"{f.rule_id}:{f.file}:{f.line}"
```

On a test Django app: 400 raw findings → 180 unique issues.

## Risk Scoring

Each finding gets a `risk_score` 0–10:

```python
_SEVERITY_RISK = {"CRITICAL": 9.0, "HIGH": 7.0, "MEDIUM": 5.0, "LOW": 2.5, "INFO": 1.0}
_CWE_BUMP = {"CWE-89": 1.5, "CWE-79": 1.0, "CWE-22": 1.0}
_DYNAMIC_BUMP = 1.0  # ZAP findings confirmed exploitable
```

## Local LLM Filter

The model sees: rule ID, CWE, severity, file path, and 10 lines of code context. Returns:

```json
{"verdict": "false_positive", "reason": "input is sanitized at line 38"}
```

All on-prem via Ollama at `http://100.126.22.55:11434`. No source code leaves the machine.

## SARIF Export

```bash
python main.py --target http://localhost:8080 --source ./src --format sarif
# → findings.sarif (upload to GitHub Security tab)
```

`likely_fp` findings get a `suppressions` block in the SARIF — GitHub Code Scanning treats them as dismissed, keeping the dashboard clean.

Source: [github.com/PyHackSecGP/p1-sast-dast-triage](https://github.com/PyHackSecGP/p1-sast-dast-triage)
