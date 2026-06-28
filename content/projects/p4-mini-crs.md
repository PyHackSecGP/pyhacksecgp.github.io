---
title: "P4 — Mini-CRS (Cyber Reasoning System)"
summary: "Autonomous vulnerability discovery pipeline: AFL++ fuzzing → ASan/GDB triage → LLM root cause analysis → patch generation → validation. Inspired by DARPA AIxCC."
status: "shipped"
weight: 1
github: "https://github.com/PyHackSecGP/p4-mini-crs"
tags: ["python", "fuzzing", "afl++", "asan", "llm", "vulnerability-research", "c"]
date: 2026-06-28
---

## What It Does

Point it at a C source directory. Come back to a report with CWEs identified, patches generated, and patches validated — fully autonomous. No manual input required after launch.

## Pipeline

```
Target C source
      ↓
  Build         afl-clang-fast + AddressSanitizer instrumentation
      ↓
  Fuzz          AFL++ coverage-guided fuzzing → crash corpus
      ↓
  Triage        ASan output + GDB backtrace + stack hash dedup
      ↓
  Analyze       LLM → CWE ID, root cause, attack scenario, severity
      ↓
  Patch         LLM → unified diff → patch -p1 → recompile → validate
      ↓
  Report        Executive HTML + JSON with diffs and validation results
```

## Demo Results

Running against the built-in vulnerable C parser (120s fuzz):

| Finding | CWE | Crash Type | Patch |
|---|---|---|---|
| strcpy heap overflow | CWE-120 | Heap Buffer Overflow @ parse_name | ✓ Fixed |
| printf format string | CWE-134 | Format String @ log_record | ✓ Fixed |

**100% fix rate. Both patches compiled clean and passed crash-file validation.**

## LLM Providers

| Provider | Backend |
|---|---|
| `ollama` | Local Ollama — on-prem, no data egress |
| `claude` | Anthropic Messages API |
| `openai` | OpenAI Chat Completions |
| `openai-compat` | vLLM, LM Studio, any OpenAI-compatible endpoint |

## Engineering Details

**Binary-safe subprocess output** — AFL crash files contain raw binary. `text=True` in Python subprocess raises `UnicodeDecodeError`. Fixed with `text=False` + `decode('utf-8', errors='replace')` throughout the triage and validation pipeline.

**Hunk header auto-correction** — LLMs frequently emit incorrect `@@ -X,Y +X,Z @@` counts when generating unified diffs, especially when inserting multiple lines into a single hunk. The patcher recomputes all hunk counts from the actual diff content before applying.

**Source restore after validation** — The patcher applies each diff, compiles, runs the crash file against the patched binary, then restores the original source regardless of result. Patches are preserved in the `Patch.diff` field. Without this, re-runs build from patched code and crash files no longer trigger — making triage useless.

**Stack hash deduplication** — Extracts top-5 user-space frame names (skipping ASan/libc internals) and SHA-1 hashes them. Two AFL crash files that hit the same code path are reported once.

## Usage

```bash
# Full pipeline — 120s fuzz on demo target, Claude LLM
python crs.py --target targets/vulnerable_parser --fuzz-time 120 \
  --llm-provider claude --llm-model claude-haiku-4-5-20251001

# Local Ollama
python crs.py --target targets/vulnerable_parser --fuzz-time 60

# Skip fuzzing, use pre-made crash corpus
python crs.py --target targets/vulnerable_parser --no-fuzz \
  --crashes targets/vulnerable_parser/crashes/

# Your own C target
python crs.py --target /path/to/c/source/ --seeds /path/to/seeds/ \
  --fuzz-time 300 --llm-provider claude
```
