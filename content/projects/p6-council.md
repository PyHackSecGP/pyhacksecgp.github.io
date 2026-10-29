---
title: "P6 — AI Council (5-Persona Briefing System)"
summary: "Twice-daily AI briefing with 5 distinct personas (voice + text) delivered at 07:00 + 19:00 Vancouver. Each persona has its own system prompt, tool belt, and output format. Running as systemd service on claw-core."
status: "shipped"
weight: 6
github: "https://github.com/PyHackSecGP/p6-council"
tags: ["python", "llm", "claude", "systemd", "automation", "accountability", "voice"]
date: 2026-08-16
---

## What It Does

Every day at 07:00 and 19:00 Vancouver, five AI personas each deliver a short briefing — voice + text — on what to focus on, what shifted since yesterday, what's at risk. One persona per role (strategist, security analyst, coach, finance, operations). Each has its own system prompt, context, and output structure.

Not a chatbot. A rhythm. The same five voices every morning + evening keep attention on things that would otherwise drift.

## Why Five

A single-persona briefing collapses into "generic daily digest" within a week. Five specialists stay distinct because:

1. **Strategist** — reads the mastery playbook + career memory, flags off-plan decisions.
2. **Security Analyst** — reads the week's commits, CVE feed, lab notes, surfaces skill gaps.
3. **Coach** — reads 75 Hard tracker + nudger logs, enforces accountability.
4. **Finance** — reads expense log + portfolio snapshots, flags burn-rate drift.
5. **Operations** — reads homelab status, backup verification, deploy queue.

Each persona is a `BaseCouncilAgent` subclass with its own system prompt + tool registry.

## Delivery

```
07:00 PDT  →  systemd timer fires p6-council.service
           →  each persona generates briefing in parallel
           →  text written to vault (CouchDB)
           →  voice synthesised (local TTS) + queued for playback
19:00 PDT  →  same loop, evening cadence
```

## Stack

Python 3.11+ · Anthropic Claude Haiku · systemd timers · local TTS · CouchDB vault write-through · Forgejo mirror.

## Engineering Highlights

- **Persona isolation** — each persona runs in its own asyncio task so one slow LLM call doesn't block the others.
- **Cache keys per persona** — ephemeral prompt cache keyed on persona + date, so repeated role prompts hit cache.
- **Vault write-through** — briefings persist to CouchDB (`30-sessions/YYYY-MM-DD/council/*.md`) so they stay searchable.
- **Degraded mode** — if Claude is unreachable, falls back to a local Ollama hermes profile with the same system prompts.

## Why This Was Built

External accountability beats internal willpower. Reading five distinct voices every morning + evening keeps me from drifting on the long-term plan. The specific target: senior AI red-team role at $200k CAD by Jul 2027. The council re-grounds that every 12 hours.
