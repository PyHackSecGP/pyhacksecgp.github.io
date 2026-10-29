---
title: "Mini-CRS: An AIxCC-Inspired Fuzz-to-Patch Loop That Fits on a Laptop"
date: 2026-10-29
description: "Build log of P4 Mini-CRS — AFL++ fuzz, ASan triage, Claude Haiku root cause + patch, verify, auto-rollback. Inspired by DARPA AIxCC."
tags: ["aisecurity", "fuzzing", "memorysafety", "python"]
---

The winning teams at DARPA's AI Cyber Challenge finals proved something uncomfortable for the AppSec industry: an LLM-glued pipeline, pointed at raw C source, can find real memory-corruption bugs, write a human-readable root cause, propose a patch, and prove the patch holds — all headless, no analyst in the loop. The prize pool was $29.5M. The architecture pattern is public. The winning CRSs ran on clusters with multi-GPU LLM ensembles and multi-fuzzer orchestration; the pattern itself does not require any of that.

**P4 Mini-CRS** ([github.com/PyHackSecGP/p4-mini-crs](https://github.com/PyHackSecGP/p4-mini-crs)) is my attempt to reproduce that loop at homelab scale. One laptop, one Python process (or four systemd user units if you want it continuous), one SQLite file as the queue. It is deliberately not a competition-grade CRS — no distributed fuzzing, no LLM ensemble, no symbolic execution. But it has found and auto-patched three distinct bug classes — heap-buffer-overflow, format-string, integer-overflow — in its demo `vulnerable_parser` target without me touching a keyboard between fuzz-start and SARIF-upload, and the SARIF lands in the GitHub Security tab next to CodeQL output. This is the build log.

## The AIxCC thesis

Memory-safety bugs still dominate the CVE top-25. Microsoft and Google have each said in public that roughly 70% of their critical security bugs trace back to C/C++ memory unsafety. Fuzzers like AFL++ and libFuzzer have been excellent at *finding* those bugs for a decade. The bottleneck has never been crash discovery — it's the **analyst-hours per crash** between "we have 300 crash files" and "here is a patch, verified, merged."

AIxCC's thesis is that a sufficiently good LLM, wired to deterministic ground truth (sanitizer output, patch-replay against the exact crash input, SARIF publication), can close that gap. The LLM is the scribe. The sanitizer is the judge. Chain them and you get an autonomous Cyber Reasoning System:

```
   source --> fuzz --> triage --> analyze --> patch --> verify --> report
                        ^                                  |
                        |__________ regression fuzz _______|
```

Nothing about this chain is new in isolation. AFL++ has been finding crashes since 2020. ASan has been printing stack traces since 2012. SARIF has been GitHub's code-scanning lingua franca since 2020. What's new is accepting that an LLM can own the English narration and the diff proposal, as long as a deterministic tool is allowed to reject both without appeal. Mini-CRS implements exactly that split: LLM explains, deterministic code decides. The LLM never gets to answer the question "does this bug exist?" or "did this patch work?" — those are AFL++'s and ASan's answers, and ASan's answer is a crash file hashed to twelve hex characters, not an English sentence.

## Stage walkthrough

**Fuzz.** AFL++ against an instrumented binary. The CLI defaults to 60s for the demo; the auto layer defaults to 10 minutes. One subprocess, one timer loop, crashes land in `output/afl_output/default/crashes/id:*`:

```python
cmd = ["afl-fuzz", "-i", seeds_dir, "-o", str(out), "-m", "none",
       "--", binary, "@@"]
proc = subprocess.Popen(cmd, env=env, ...)
while time.time() - start < timeout_seconds:
    time.sleep(5)
    crash_count = len(list(crashes_dir.glob("id:*")))
```

**Triage.** AFL emits dozens of crash files for the same underlying bug. `stages/triage.py` replays each through a second ASan-only binary, pulls the top 5 user-space frames (filtering ASan internals and libc), and SHA1s the function-name tuple into a 12-char `stack_hash`. Same hash = same bug = one `CrashInfo`:

```python
def _stack_hash(backtrace: str) -> str:
    all_frames = re.findall(r"#\d+\s+\S+\s+in\s+(\S+)", backtrace)
    user_frames = [f for f in all_frames if not _ASAN_INTERNAL.search(f)][:5]
    key = "|".join(user_frames) if user_frames else backtrace[:200]
    return hashlib.sha1(key.encode(), usedforsecurity=False).hexdigest()[:12]
```

**Analyze.** Claude Haiku 4.5 gets the ASan report plus a 40-line window of source around the top frame, and is asked for a strict JSON object: `cwe_id`, `cwe_name`, `vulnerability_type`, `vulnerable_function`, `vulnerable_lines`, `root_cause`, `attack_scenario`, `severity`, `exploitability`, `fix_approach`. The system block is frozen and tagged `cache_control: ephemeral`, so a second crash on the same target in the same session gets ~90% cache hits on the schema and drops per-decision cost from ~$0.015 to ~$0.003.

**Patch.** Same LLM, different prompt: given the `Analysis`, emit a unified diff. The pipeline then recomputes the `@@` hunk headers (LLMs get the line counts wrong constantly), applies the patch with `patch -p1 --dry-run`, applies for real on success, recompiles.

**Verify.** This is the hard rule: the LLM never gets to decide a patch works.

```python
patched_binary = build_patched(source_dir, output_dir)
result = subprocess.run([patched_binary, crash_file],
                        capture_output=True, timeout=10, env=env)
if result.returncode == 0 and "ERROR" not in run_out:
    return ValidationResult.FIXED, ...
return ValidationResult.FAILED, ...
```

Replay the exact crashing input. Clean exit → `Fixed`. Still crashes → `Failed`, bug still reported, patch flagged for human review. The original source is always restored from a `.orig` backup so the target stays vulnerable for the next run — the CRS does not get to silently "fix" its own benchmark corpus.

On the demo target this verification step catches hallucinated patches regularly. The LLM will cheerfully propose a diff that adds a `strlen()` check in the wrong branch, or caps `size` with the wrong bound, and the diff will apply cleanly and compile. The replay step is what rejects it: binary runs, ASan trips, patcher returns `Failed`. The guardrail is not optional.

## Design decisions

**Why AFL++ and not libFuzzer?** libFuzzer is faster per-exec, but needs a `LLVMFuzzerTestOneInput` harness per target — more code to add a new C program. AFL++ reads `argv[1]` or stdin out of the box. For a mini CRS the LLM analysis dominates wall-clock anyway; throughput per fuzz-exec is noise.

**Why Haiku 4.5 as the default?** The agent's job is 4-way classification over a short SARIF payload — pick one of `send_telegram`, `file_github_issue`, `requeue_longer_fuzz`, `mark_ignore`. That's a cheap task. Haiku at ~$1/MTok in, $5/MTok out, with prompt caching, is roughly ~$0.0015 per crash analysis. Sonnet is overkill for the triage decision. The internal analyzer and patcher stages are orthogonal — pass `--llm-model claude-sonnet-4-6` on `crs.py` if a target needs deeper root-cause reasoning. Mix cheap-agent + premium-analyzer freely.

**Why SQLite for the job queue, not Redis?** One process, hundreds of jobs/day, crash-recoverable. SQLite in WAL mode handles it with a `threading.Lock()` guard around the writer. The queue is a single file I can `sqlite3 jobq.db` into for admin. The Flask dashboard is a read-only cursor over the same file. On agent restart `resume_pending()` reverts orphaned `running` rows to `pending` and the loop picks up where it left off. If queue depth ever cleared 10k I'd swap in Redis — until then, zero extra daemons.

**Why ephemeral prompt cache?** Session-scoped, no persistent-cache cost, no cache invalidation story to maintain. The system prompt is big (~2–3k tokens of severity rubric + CWE examples + tool specs) and never changes between calls for the same target. Target-specific data lives in the user turn exclusively. Anthropic bills the cached read at ~10% of the input rate; that's the whole optimization. The one rule that keeps the hit rate up is unglamorous: never put per-job data in the system block, no matter how tempting. If it varies per crash, it belongs in the user turn.

**Why Ollama fallback, not Claude-only?** Hard requirement: run offline or air-gapped without an API key. `--llm-provider ollama` with Hermes 3 70B or Llama 3.1 does acceptable triage; patch quality drops noticeably, but the deterministic verification step catches it — a bad patch lands as `Failed`, the bug is still reported, nothing silently passes. Having a non-cloud path is also useful in CI where secret exposure is a real risk and nobody wants to budget per-PR Anthropic spend.

## The auto loop — turning CLI into daemon

`crs.py` is a batch tool. `auto/` is four long-running processes under `systemctl --user`:

- **watcher** (`auto/watcher.py`) — `watchdog`/inotify on each watchlist directory from `targets.yaml`. On create/modify of a `.c`/`.h` file, a 5-second debounce collapses editor-save bursts into one enqueue.
- **scheduler** (`auto/scheduler.py` + `p4-scheduler.timer`, `OnCalendar=*-*-* 03:00:00`) — daily poll of `targets.yaml` for GitHub repos (compare SHA against `state.json`, re-clone + enqueue on change) plus `auto/cve_poller.py` which pulls CISA KEV and NVD recent (7-day window) and re-queues watchlist targets whose product name substring-matches a new CVE, with `fuzz_time` doubled.
- **agent** (`auto/agent.py`) — the loop body. Pops one `pending` job via `jobq.pop_pending()`, runs `runner.sh` which wraps `crs.py`, feeds the resulting SARIF into Claude Haiku 4.5 via the Anthropic Agent SDK with four registered tools, executes the chosen tool, writes severity + stack_hash + action back to the job row.
- **dashboard** (`auto/dashboard.py`) — Flask on `127.0.0.1:5557`, read-only Jinja over `jobq.db`. Routes `GET /`, `GET /target/<path>`, `GET /findings`, `GET|POST /trigger`.

One systemd unit, as sample — the agent:

```ini
[Unit]
Description=P4 Mini-CRS auto-pipeline agent daemon
After=network-online.target

[Service]
Type=simple
WorkingDirectory=%h/projects/p4-mini-crs
EnvironmentFile=%h/projects/p4-mini-crs/auto/.env
ExecStart=/bin/bash -c 'source venv/bin/activate 2>/dev/null; exec python3 auto/agent.py'
Restart=on-failure
RestartSec=15s

[Install]
WantedBy=default.target
```

User-scope (no sudo), survives logout via `loginctl enable-linger`, picks up code changes on `systemctl --user restart p4-agent`. Zero container runtime, zero network namespace juggling, zero GID-mapping headaches for the SARIF file mount. Live on my `claw-core` box since 2026-10-29 and watching three target directories plus one GitHub repo. The queue is `auto/jobq.db`, which is also the admin interface — `sqlite3 auto/jobq.db 'SELECT target, severity, action FROM jobs WHERE status="done" ORDER BY finished_at DESC LIMIT 10'` is my daily "what did the robot find overnight" command.

## SARIF export + GitHub integration

Every finding becomes a SARIF 2.1.0 `result`, deduped across runs via `fingerprints.stackHash/v1`. The SARIF rules are per-CWE and include help markdown plus the MITRE CWE URL. In CI, one step:

```yaml
- name: Upload SARIF to GitHub Security tab
  uses: github/codeql-action/upload-sarif@v3
  with:
    sarif_file: output/vulnerable_parser_crs_report.sarif
    category: p4-mini-crs
```

Findings surface in **Security → Code scanning alerts**, same UI as CodeQL/Snyk/Trivy, with correct dedup across pushes. The CRS is now a CI stage, not a standalone tool — PRs that regress a previously-patched bug light up red next to the CodeQL output.

## What it can't do yet

No symbolic execution — can't reason about path constraints the fuzzer never explored. No coverage-guided reward signal fed back to the LLM, so when the patch stops the known crash but introduces a subtle condition the fuzzer doesn't re-hit, nothing catches it until next session's regression fuzz. CVE prioritization is substring product-name match, not CPE-to-repo mapping — fine for `openssl`/`curl`/`libxml2`, noisy on generic names. Phase 6 roadmap: coverage-biased sampling for patch validation so the regression fuzz exercises the patched region first, and a proper CPE map for the poller. (Phase 5a — CVE/NVD priority queueing — landed today.)

## Numbers

- 121 pytest tests passing, GitHub Actions CI green.
- 5 pipeline stages: build, fuzz, triage, analyze, patch (plus report fan-out to HTML/JSON/SARIF).
- 4 systemd user units + 1 timer: `p4-agent`, `p4-watcher`, `p4-dashboard`, `p4-scheduler.service`, `p4-scheduler.timer`.
- SQLite job queue, single file, crash-recoverable, dedup on `(target, status∈{pending,running})`.
- ~$0.0015 per crash analysis (Haiku 4.5, system-prompt cache hit).
- 4 LLM providers wired: Ollama (default, offline), Claude, OpenAI, any OpenAI-compatible endpoint.

## Closing

Repo: [github.com/PyHackSecGP/p4-mini-crs](https://github.com/PyHackSecGP/p4-mini-crs). Clone, `sudo apt install afl++ gdb clang`, `pip install -r requirements.txt`, then `python crs.py --target targets/vulnerable_parser --fuzz-time 60`. Pointed at your own C code? Add a `targets/<name>/` directory with `main.c`, `Makefile` honoring `$(CC)/$(CFLAGS)`, and a `seeds/` corpus. The LLM is the scribe; the sanitizer is the judge.
