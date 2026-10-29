---
title: "wazuh-mcp (MCP server for Wazuh SIEM triage)"
summary: "Model Context Protocol server exposing Wazuh indexer + manager APIs to Claude Desktop. Natural-language SIEM triage: 'failed logins last hour', 'why is this agent disconnected', 'all alerts for IP X'."
status: "shipped"
weight: 12
github: "https://github.com/PyHackSecGP/wazuh-mcp"
tags: ["mcp", "wazuh", "siem", "soc", "python", "claude"]
date: 2026-10-29
---

## What It Does

Wazuh's web UI is powerful but slow for tier-1 triage. Natural language over MCP collapses the context-switch tax: ask a question in Claude Desktop, get a scoped SIEM query result with explanation.

## Tools

- `search_alerts` — Wazuh indexer DSL query (filtered + paginated)
- `list_agents` — agent inventory with status
- `get_agent_status` — single-agent details, last-seen, groups
- `agent_logs` — recent events for one agent
- `rule_lookup` — Wazuh rule metadata by rule_id
- `node_health` — manager + indexer health check
- `search_by_ip` — pivot on IP across all alerts
- `top_rules` — most-fired rules in a time window

## Design Decisions

- **Dual API (indexer + manager)** — search goes to the Elasticsearch/Opensearch indexer; agent control goes to the manager REST API. Different auth flows.
- **Auth token refresh** — manager tokens expire; MCP server refreshes transparently.
- **Pagination with truncation hints** — Claude gets "showing 50 of 2,431; narrow filter or ask for page 2" instead of a wall of JSON.

## Stack

Python 3.11+ · FastMCP · httpx (async) · Wazuh indexer DSL · Wazuh manager REST API · Pydantic schemas.
