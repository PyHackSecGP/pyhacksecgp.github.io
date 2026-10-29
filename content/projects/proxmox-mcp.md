---
title: "proxmox-mcp (MCP server for Proxmox VE API)"
summary: "Model Context Protocol server for homelab Proxmox ops: list nodes, VMs, LXCs, recent tasks; start / stop / restart VMs from Claude Desktop. Read + write tools cleanly separated with confirmation on write."
status: "shipped"
weight: 15
github: "https://github.com/PyHackSecGP/proxmox-mcp"
tags: ["mcp", "proxmox", "homelab", "virtualization", "python", "claude"]
date: 2026-10-29
---

## What It Does

Running `pct list` and `qm list` in SSH tabs is slow. Natural-language over MCP:

> "Which VMs are running on pve? How much CPU is node pve using? Restart the mediaserver LXC."

Server translates to Proxmox REST API calls, returns typed results, Claude explains.

## Tools

| Tool | Scope | What it does |
|---|---|---|
| `list_vms` | read | All VMs across all nodes with status + resources |
| `node_resources` | read | Per-node CPU, RAM, storage |
| `vm_status` | read | Single-VM detail including config |
| `recent_tasks` | read | Last N Proxmox task log entries |
| `vm_start` | write | Start a stopped VM |
| `vm_stop` | write | Graceful shutdown |
| `vm_restart` | write | Stop + start |
| `health` | read | API reachability check |

Snapshot and migrate are planned (`vm_snapshot`, `vm_migrate`).

## Design Decisions

- **Read / write split** — read tools are safe to call liberally; write tools render a confirmation summary in the Claude Desktop UI before executing (via MCP tool-use semantics).
- **Token auth, not password** — Proxmox API tokens with narrowly-scoped privileges, not the admin user.
- **SSL verify configurable** — homelab self-signed certs; `PROXMOX_SSL_VERIFY=false` for development.
- **No cluster-wide ops yet** — single-node scope keeps the auth model simple.

## Stack

Python 3.11+ · FastMCP · httpx (async) · Proxmox VE REST API · Pydantic schemas · token auth.
