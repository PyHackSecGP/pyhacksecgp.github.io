---
title: "P7 — AutoPatch (Autonomous CVE Remediation)"
summary: "DefectDojo-driven patch pipeline: detect → classify → ZFS snapshot → apt/apk patch → systemctl + Trivy verify → auto-rollback on failure. Zero cloud deps. 40 tests."
status: "shipped"
weight: 7
github: "https://github.com/PyHackSecGP/p7-autopatch"
tags: ["python", "cve", "patching", "defectdojo", "zfs", "trivy", "systemd", "automation"]
date: 2026-09-15
---

## What It Does

Reads vulnerability findings from DefectDojo, snapshots the target host with ZFS, applies patches via apt/apk, restarts affected services, verifies with Trivy, and auto-rolls back on failure. The weakest point in most SMB security pipelines is patch Tuesday — this closes it with zero cloud dependency.

## Pipeline

```
DefectDojo API  →  classify by CVSS + KEV + EPSS
          ↓
   ZFS snapshot   (pre-patch rollback point)
          ↓
   apt / apk      (dry-run → real)
          ↓
   systemctl      (restart affected services)
          ↓
   Trivy          (verify fix landed; new findings = regression)
          ↓
   ┌───────────┬─────────────┐
   SUCCESS         FAILURE
     ↓               ↓
   log + alert    ZFS rollback + alert
```

## Design Decisions

- **ZFS not LVM** — ZFS snapshots are atomic, instant, and have cheap rollback. LVM snapshots degrade on write.
- **DefectDojo as truth source** — single UI for vulnerability triage across all homelab assets.
- **Trivy for verify** — same scanner, pre + post, so the comparison is apples-to-apples.
- **Auto-rollback threshold** — any new critical finding or any service that fails to restart = immediate rollback.

## Engineering Details

- **40 tests** covering pipeline stages, rollback paths, systemctl failure modes, Trivy diff parsing, DefectDojo API error handling.
- **Zero cloud deps** — all state local (SQLite job queue, filesystem logs, ZFS snapshots).
- **Dry-run first** — every pipeline starts with `apt-get -s install` (simulate) before the real patch.
- **systemd user service** — runs under non-root user with carefully scoped sudo rules.

## Stack

Python 3.11+ · DefectDojo REST API · ZFS · apt / apk · systemctl · Trivy · SQLite job queue · pytest.

## Why This Was Built

Patch Tuesday is a human-time sink. If an LLM-driven CVE triage can rank findings and a trusted script can apply fixes with safe rollback, patching stops being the weakest link. P7 is the operational side of the AIxCC thesis: not just finding vulnerabilities (P4 Mini-CRS does that) but closing them repeatably.
