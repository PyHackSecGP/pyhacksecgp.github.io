---
title: "ai-redteam-mcp (MCP server for LLM guardrail testing)"
summary: "Model Context Protocol server for prompt-injection testing: curated corpus, mutation strategies, bypass-rate tracking. Dual-use tool for AI red-team evaluations and defensive guardrail hardening."
status: "shipped"
weight: 14
github: "https://github.com/PyHackSecGP/ai-redteam-mcp"
tags: ["mcp", "ai-redteam", "llm-safety", "prompt-injection", "owasp-llm", "python"]
date: 2026-10-29
---

## What It Does

Evaluates LLM guardrails. Given a target LLM endpoint, runs a corpus of prompt-injection payloads, applies mutation strategies (encoding, role-play, delimiter abuse, suffix-prefix wrapping), measures bypass rate.

Positioned at the OWASP LLM Top 10 category LLM01 (Prompt Injection) + LLM07 (Insecure Output Handling).

## Tools

- `list_payload_categories` — enumerated attack categories
- `fetch_payload_corpus` — paginated corpus of base payloads
- `mutate_payload` — apply one or more mutation strategies to a payload
- `probe_target` — send a payload to a target LLM endpoint
- `score_response` — classifier output: refusal / bypass / partial-bypass
- `bypass_rate` — aggregate bypass rate for a payload set against a target
- `log_run` — persist run metadata for diff over time
- `health` — target endpoint reachability
- `report` — summary across categories + mutations

## Design Decisions

- **Local corpus, not scraped-on-call** — reproducible, auditable, portable.
- **Mutation strategies as pure functions** — each is independently testable.
- **Scoring by regex + optional judge-LLM** — regex catches obvious refusals; a judge LLM handles ambiguous ones.
- **Dual use acknowledged** — the README is explicit: use only on LLM endpoints you own or have authorisation to test.

## Stack

Python 3.11+ · FastMCP · httpx · Pydantic schemas · local JSON payload corpus.
