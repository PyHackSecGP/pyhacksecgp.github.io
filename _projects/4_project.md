---
layout: page
title: "Memory Safety Lab"
description: "Hands-on C exploitation — buffer overflows, heap corruption, use-after-free"
img: assets/img/proj_memory.jpg
importance: 4
category: offensive security
---

<div class="row">
  <div class="col-sm-12">
    <a href="https://github.com/PyHackSecGP/memory-safety-lab" class="btn btn-sm btn-outline-primary mb-3">
      <i class="fab fa-github"></i> View on GitHub
    </a>
  </div>
</div>

## Overview

Hands-on C exercises targeting memory safety vulnerabilities — the foundation of OSCP-level exploit development. Every exercise is intentionally vulnerable code with an accompanying exploit and explanation.

## Topics Covered

- **Stack buffer overflows** — overwriting return addresses, controlling EIP/RIP
- **Heap exploitation** — chunk corruption, tcache poisoning
- **Use-after-free** — dangling pointer abuse
- **Format string bugs** — arbitrary read/write via printf
- **ASLR/NX bypass basics** — ret2libc, ROP chains

## Tools

`GDB` · `pwndbg` · `pwntools` · `checksec` · `objdump` · `ltrace`

## Why

OSCP (2028 target) requires solid exploit dev fundamentals. Building this muscle now rather than cramming before the exam.
