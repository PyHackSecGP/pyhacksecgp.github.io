---
title: "P2 — Threat Model Generator"
summary: "AI-assisted STRIDE threat modelling tool that generates executive-quality HTML reports with MITRE ATT&CK mapping, compliance flagging (GDPR/PCI-DSS), and on-prem LLM narratives from YAML, OpenAPI, Dockerfile, or docker-compose inputs."
status: "shipped"
weight: 2
github: "https://github.com/PyHackSecGP/p2-threat-model-generator"
tags: ["python", "stride", "threat-modelling", "mitre", "ai", "appsec"]
date: 2026-06-28
---

## Problem

Threat modelling is done manually in spreadsheets or skipped entirely. When it does happen, the output is a raw list of threats that developers ignore and that executives can't read. Security teams need something they can hand to a CISO on Monday morning.

## What It Does

1. **Multi-input parsing** — auto-detects YAML/JSON descriptor, OpenAPI/Swagger spec, Dockerfile, docker-compose.yml, or runs an interactive CLI wizard
2. **STRIDE engine** — generates threats for every component (web app, API, database, cache, auth service, message queue) across all 6 STRIDE categories
3. **Risk scoring** — likelihood × impact × 4, auto-classified into Critical/High/Medium/Low with sprint priority
4. **Framework mapping** — every threat linked to MITRE ATT&CK technique IDs, OWASP 2021 categories, and NIST 800-53 controls
5. **Compliance flagging** — automatic GDPR, PCI-DSS, SOC2, HIPAA violation detection mapped to specific threats
6. **LLM narratives** — on-prem Ollama (hermes3:70b) enriches top threats with executive-language paragraphs. No data leaves the network
7. **Executive HTML report** — self-contained with Chart.js visualisations (STRIDE distribution, severity breakdown, top 5 risk bar), sprint remediation table, compliance exposure section, full threat inventory

## Sample Output

On a 7-component e-commerce platform (web app + API gateway + auth + payments + database + cache + order service):

- **35 threats** generated
- **Risk score: 100/100** (Critical risk)
- **2 Critical** — SQL injection on internet-facing components
- **15 High** — broken access control, identity spoofing, sensitive data exposure
- **Compliance:** GDPR Art. 32 + PCI-DSS v4.0 Req. 6 flagged

## Key Technical Decisions

**STRIDE per component type** — rules are specialised by component. A database gets data tampering and query exhaustion rules. An API gets injection, broken access control, and rate-limiting threats. Generic rules produce generic noise.

**Business-impact language** — every threat includes a `business_impact` field written for a non-technical audience: regulatory fine amounts, average breach costs, SLA consequences. This is what makes the report usable outside the security team.

**Local LLM only** — all application data stays on-prem. Ollama receives the threat metadata; no source code or production data is ever sent.

**Sprint prioritisation** — Critical/High threats are automatically assigned to Sprint 1. Medium to this quarter. Low to backlog. The remediation table is ready to paste into Jira.
