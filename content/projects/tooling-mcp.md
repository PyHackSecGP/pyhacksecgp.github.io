---
title: "tooling-mcp (MCP wrappers for offensive-security CLIs)"
summary: "Model Context Protocol server exposing nmap, nuclei, gobuster, ffuf, httpx, semgrep, trivy as typed, argument-whitelisted tools. Lets Claude drive recon + SAST + container scanning from one chat."
status: "shipped"
weight: 13
github: "https://github.com/PyHackSecGP/tooling-mcp"
tags: ["mcp", "nmap", "nuclei", "ffuf", "gobuster", "semgrep", "trivy", "python", "pentesting"]
date: 2026-10-29
---

## What It Does

LLMs can't run CLI tools without wrappers. `tooling-mcp` exposes seven security CLIs as MCP tools with:

- **Subprocess isolation** — never `shell=True`
- **Argument whitelisting** — only flags on an allowlist pass through
- **Timeout per tool** — long-running scans get killed, not hung
- **Output parsing** — each tool's native output parsed into typed Pydantic models

## Tools

| Tool | What it wraps | Typical use |
|---|---|---|
| `nmap_scan` | nmap | Port + version scan with NSE scripts |
| `nuclei_scan` | nuclei | Template-based vuln detection |
| `gobuster_dir` | gobuster | Directory brute force |
| `ffuf_fuzz` | ffuf | Flexible fuzzer (dirs, params, vhosts) |
| `httpx_probe` | httpx | Live-host probing with metadata |
| `semgrep_scan` | semgrep | SAST on source code |
| `trivy_scan` | trivy | Container + filesystem CVE scan |

## Example (from Claude Desktop)

> "Scan this Dockerfile with Trivy, then run Semgrep over the Python code it builds."

Claude chains `trivy_scan` → reads result → `semgrep_scan` → correlates findings.

## Design Decisions

- **Subprocess not Python bindings** — one less failure mode (import drift, API shift).
- **Argument whitelist** — rejects shell metacharacters, path traversal, dangerous flags (`-oG /etc/passwd`).
- **Default-deny timeouts** — if a scan isn't done in `TIMEOUT_SEC`, kill it and return partial.
- **Scope-aware** — refuses targets outside configured allowlist (RFC1918, localhost, user-provided CIDR).

## Stack

Python 3.11+ · FastMCP · subprocess + asyncio · Pydantic schemas · each wrapped CLI installed separately.
