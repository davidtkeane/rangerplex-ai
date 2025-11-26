# 🛡️ BLUE TEAM TOOLKIT - Defensive Security
## "I Love Defending!" - David Keane (IrishRanger)

> **Blue Team Mission**: Detect, Respond, Defend, Harden
>
> Like defending yourself in a fight - you react when attacked, protect what's yours, and know your terrain!

---

## 📋 TABLE OF CONTENTS

1. [Philosophy](#philosophy)
2. [Core Responsibilities](#core-responsibilities)
3. [Essential Tools](#essential-tools)
4. [Key Skills](#key-skills)
5. [Real-World Scenarios](#real-world-scenarios)
6. [Learning Path](#learning-path)
7. [Career Opportunities](#career-opportunities)

---

## 🎯 PHILOSOPHY

### Blue Team Mindset:
- **Defense First**: Protect, monitor, respond
- **Know Your Systems**: Deep knowledge of YOUR infrastructure
- **Reactive & Proactive**: Fix breaches + prevent future ones
- **Sustainable**: Long-term career, not burnout
- **Team Player**: Work with IT, DevOps, management

### Why Blue Team?
- ✅ 95% of security jobs are defensive
- ✅ Stable, long-term career path
- ✅ Less tool chaos (focus on YOUR stack)
- ✅ Clear mission: Keep systems running safely
- ✅ Sleep better at night (you're the good guy!)

---

## 🛠️ CORE RESPONSIBILITIES

### 1. **Monitoring & Detection**
Watch systems for suspicious activity

**Tools:**
- SIEM (Splunk, ELK Stack, QRadar)
- IDS/IPS (Snort, Suricata, Zeek)
- EDR (CrowdStrike, Carbon Black, SentinelOne)
- Network monitoring (Wireshark, tcpdump)

**Daily Tasks:**
- Review SIEM alerts
- Analyze logs for anomalies
- Monitor network traffic
- Track threat intelligence feeds

---

### 2. **Incident Response**
React when shit hits the fan!

**Tools:**
- Forensics (Autopsy, Volatility, FTK)
- Memory analysis (Rekall, LiME)
- Disk imaging (dd, FTK Imager)
- Timeline analysis (Plaso, log2timeline)

**Response Steps:**
1. **Preparation**: Have playbooks ready
2. **Identification**: Confirm the breach
3. **Containment**: Isolate affected systems
4. **Eradication**: Remove threat
5. **Recovery**: Restore services
6. **Lessons Learned**: Document and improve

**Real Example:**
```
🚨 Alert: Suspicious PowerShell execution on DC01
→ Check logs (What happened?)
→ Isolate machine (Stop spread!)
→ Capture memory dump (Evidence!)
→ Kill malicious process
→ Review attack vector
→ Patch vulnerability
→ Document incident
```

---

### 3. **System Hardening**
Make systems harder to attack

**Tools:**
- CIS Benchmarks (Security baselines)
- SCAP scanners (OpenSCAP)
- Configuration management (Ansible, Puppet)
- Patch management (WSUS, apt, yum)

**Hardening Checklist:**
- [ ] Disable unnecessary services
- [ ] Apply security patches
- [ ] Configure firewalls
- [ ] Enable logging
- [ ] Strong password policies
- [ ] Remove default accounts
- [ ] Encrypt sensitive data
- [ ] Regular backups

---

### 4. **Vulnerability Management**
Find and fix weaknesses BEFORE attackers do

**Tools:**
- Vulnerability scanners (Nessus, OpenVAS, Qualys)
- Patch management (WSUS, SCCM)
- Asset inventory (Lansweeper, Spiceworks)
- Risk assessment frameworks

**Process:**
1. **Scan**: Run regular vulnerability scans
2. **Prioritize**: Focus on critical/high risk
3. **Patch**: Apply updates systematically
4. **Verify**: Rescan to confirm fix
5. **Report**: Document for compliance

---

### 5. **Threat Hunting**
Proactively search for hidden threats

**Tools:**
- SIEM queries (Splunk, ELK)
- Threat intelligence (MISP, ThreatConnect)
- Indicators of Compromise (IOCs)
- Behavioral analysis

**Hunt Ideas:**
- Unusual login times/locations
- Privilege escalation attempts
- Lateral movement patterns
- Data exfiltration signs
- Persistence mechanisms

---

## 🔧 ESSENTIAL BLUE TEAM TOOLS

### **Category 1: SIEM & Log Analysis**

#### **Splunk** (Industry Standard)
```bash
# Search for failed logins
index=windows EventCode=4625 | stats count by user

# Detect PowerShell attacks
index=* powershell.exe "-enc" OR "-encodedcommand"

# Find privilege escalation
index=* EventCode=4672 OR EventCode=4673
```

**Why Learn It:**
- Used by 80% of enterprises
- Powerful query language (SPL)
- Correlates data from everywhere
- Great for blue team analysts

---

#### **ELK Stack** (Open Source Alternative)
- **Elasticsearch**: Store and search logs
- **Logstash**: Collect and parse logs
- **Kibana**: Visualize and dashboard

```bash
# Setup ELK Stack (Docker)
docker-compose up -d elasticsearch logstash kibana

# Query failed SSH logins
GET /auth-logs/_search
{
  "query": {
    "match": { "message": "Failed password" }
  }
}
```

---

### **Category 2: Intrusion Detection (IDS)**

#### **Snort** (Classic IDS)
```bash
# Install Snort
sudo apt install snort

# Run Snort on interface
sudo snort -A console -q -c /etc/snort/snort.conf -i eth0

# Custom rule: Detect port scanning
alert tcp any any -> $HOME_NET any (msg:"Port Scan Detected"; flags:S; detection_filter:track by_src, count 20, seconds 60; sid:1000001;)
```

#### **Suricata** (Modern IDS/IPS)
```bash
# Install Suricata
sudo apt install suricata

# Run Suricata
sudo suricata -c /etc/suricata/suricata.yaml -i eth0

# Enable community rules
sudo suricata-update
```

**Detection Rules:**
```yaml
# Detect SQL injection attempts
alert http any any -> $HOME_NET any (msg:"SQL Injection Attempt"; flow:to_server; content:"UNION"; http_uri; content:"SELECT"; http_uri; sid:2000001;)

# Detect ransomware file extensions
alert smb any any -> $HOME_NET any (msg:"Possible Ransomware"; content:".encrypted"; sid:2000002;)
```

---

### **Category 3: Endpoint Detection & Response (EDR)**

**Open Source Options:**
- **Wazuh** (SIEM + EDR)
- **Osquery** (Endpoint visibility)
- **OSSEC** (Host intrusion detection)

#### **Wazuh Setup**
```bash
# Install Wazuh manager
curl -s https://packages.wazuh.com/key/GPG-KEY-WAZUH | apt-key add -
apt-get install wazuh-manager

# Install agent on endpoints
wget https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_4.3.0-1_amd64.deb
dpkg -i wazuh-agent_4.3.0-1_amd64.deb
```

**Detection Rules:**
```xml
<!-- Detect suspicious PowerShell -->
<rule id="100001" level="12">
  <if_sid>60106</if_sid>
  <match>powershell.exe -enc</match>
  <description>Encoded PowerShell Command Detected</description>
</rule>

<!-- Detect mimikatz -->
<rule id="100002" level="15">
  <if_sid>60000</if_sid>
  <match>mimikatz|sekurlsa|lsadump</match>
  <description>Possible Credential Dumping Attempt</description>
</rule>
```

---

### **Category 4: Network Analysis**

#### **Wireshark** (Packet Analysis)
```bash
# Capture on interface
wireshark -i eth0

# Filter examples:
http                    # All HTTP traffic
tcp.port == 445         # SMB traffic
ip.addr == 10.10.10.5   # Specific IP
dns                     # DNS queries
```

**Common Analysis:**
- Find cleartext passwords
- Detect port scans
- Analyze malware C2 traffic
- Investigate data exfiltration

---

#### **Zeek** (Network Security Monitor)
```bash
# Install Zeek
sudo apt install zeek

# Run Zeek
zeek -i eth0 local

# Analyze logs
cat conn.log | zeek-cut id.orig_h id.resp_h service
```

**Use Cases:**
- Baseline normal network behavior
- Detect anomalies automatically
- Extract files from traffic
- Generate connection metadata

---

### **Category 5: Forensics**

#### **Autopsy** (Disk Forensics)
```bash
# Install Autopsy
sudo apt install autopsy

# Create case and add evidence
autopsy &
# GUI: Create case → Add disk image → Analyze
```

**What to Look For:**
- Deleted files
- Browser history
- Registry artifacts (Windows)
- Timeline of events
- Malware artifacts

---

#### **Volatility** (Memory Forensics)
```bash
# Install Volatility
pip3 install volatility3

# List processes from memory dump
python3 vol.py -f memory.dmp windows.pslist

# Dump suspicious process
python3 vol.py -f memory.dmp windows.dumpfiles --pid 1234

# Check network connections
python3 vol.py -f memory.dmp windows.netscan

# Find injected code
python3 vol.py -f memory.dmp windows.malfind
```

**Memory Analysis Checklist:**
- [ ] Running processes
- [ ] Network connections
- [ ] Loaded DLLs
- [ ] Registry keys accessed
- [ ] Command line arguments
- [ ] Code injection signs

---

## 🎓 KEY BLUE TEAM SKILLS

### **1. Log Analysis**
Master reading and correlating logs:
- Windows Event Logs (Event Viewer)
- Linux logs (/var/log/)
- Firewall logs
- Web server logs
- Application logs

**Practice:**
```bash
# Find failed SSH attempts
grep "Failed password" /var/log/auth.log

# Count failed logins by IP
grep "Failed password" /var/log/auth.log | awk '{print $11}' | sort | uniq -c | sort -rn

# Find successful logins after failures (potential brute force success)
grep "Accepted password" /var/log/auth.log
```

---

### **2. Network Traffic Analysis**
Understand what's normal vs suspicious

**Skills:**
- TCP/IP fundamentals
- Common port numbers (80, 443, 22, 3389, 445)
- Protocol analysis (HTTP, DNS, SMB, RDP)
- Spotting anomalies

**Red Flags:**
- Traffic on unusual ports
- Encrypted traffic to unknown IPs
- Large data transfers
- DNS tunneling
- Beaconing patterns (C2)

---

### **3. Windows Security**
Deep knowledge of Windows environment

**Key Areas:**
- Active Directory security
- Group Policy hardening
- Windows Event IDs (4624, 4625, 4672, 4688, etc.)
- PowerShell logging
- LSASS protection
- Credential Guard

**Critical Event IDs:**
```
4624 - Successful login
4625 - Failed login
4672 - Admin privileges assigned
4688 - New process created
4698 - Scheduled task created
4719 - System audit policy changed
4720 - User account created
4732 - User added to security group
```

---

### **4. Linux Security**
Hardening and monitoring Linux systems

**Key Areas:**
- File permissions and ownership
- SELinux/AppArmor
- iptables/nftables firewalls
- SSH hardening
- Privilege escalation prevention
- Log monitoring

**Hardening Example:**
```bash
# Disable root SSH login
echo "PermitRootLogin no" >> /etc/ssh/sshd_config

# Setup firewall
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw enable

# Monitor for SUID binaries
find / -perm -4000 -type f 2>/dev/null > /var/log/suid_baseline.txt
```

---

### **5. Threat Intelligence**
Stay informed about current threats

**Resources:**
- MITRE ATT&CK Framework
- CISA alerts
- Vendor threat reports
- Security blogs
- Twitter #infosec

**Apply Intelligence:**
1. Read threat reports
2. Extract IOCs (IPs, domains, hashes)
3. Add to SIEM/IDS
4. Hunt in your environment
5. Update defenses

---

## 🚨 REAL-WORLD BLUE TEAM SCENARIOS

### **Scenario 1: Ransomware Detection**

**Alert:**
```
Multiple files renamed with .encrypted extension on file server
SMB traffic spike from workstation WS-042
```

**Your Response:**
1. **Immediate**: Isolate WS-042 from network
2. **Investigate**: Check process list for ransomware
3. **Contain**: Disable SMB on affected server
4. **Identify**: Find patient zero
5. **Restore**: Recover from backups
6. **Harden**: Update EDR rules to detect this variant

**Prevention:**
- Email filtering (block suspicious attachments)
- EDR on all endpoints
- Regular backups (3-2-1 rule)
- User training (phishing awareness)
- Disable macros by default

---

### **Scenario 2: Insider Threat**

**Alert:**
```
User jsmith accessed finance share at 2:00 AM
Large file transfer to external cloud storage
Access from unusual location
```

**Your Response:**
1. **Verify**: Check if legitimate (call user)
2. **Monitor**: Watch their activity
3. **Collect**: Gather evidence
4. **Alert**: Notify management/HR/legal
5. **Contain**: Disable account if confirmed
6. **Forensics**: Full investigation

**Prevention:**
- Data Loss Prevention (DLP)
- User behavior analytics (UBA)
- Principle of least privilege
- Audit file access regularly

---

### **Scenario 3: Phishing Attack**

**Alert:**
```
Multiple users reported suspicious email
Subject: "Urgent: Update your credentials"
Link points to fake Office 365 login page
```

**Your Response:**
1. **Identify**: Find all recipients
2. **Block**: Add sender to spam filter
3. **Check**: See who clicked the link
4. **Reset**: Force password reset for victims
5. **Educate**: Send security awareness reminder
6. **Analyze**: Extract IOCs from email

**Prevention:**
- Email gateway filtering
- DMARC/SPF/DKIM
- Security awareness training
- Multi-factor authentication (MFA)
- URL filtering

---

## 📚 BLUE TEAM LEARNING PATH

### **Phase 1: Foundations (3-6 months)**
Learn the basics of defense

**Skills to Master:**
- [ ] TCP/IP networking
- [ ] Windows & Linux fundamentals
- [ ] Basic log analysis
- [ ] Firewall concepts
- [ ] Antivirus/EDR basics

**Resources:**
- **Free**: CyberDefenders.org (Blue team CTFs)
- **Free**: TryHackMe SOC Level 1 path
- **Cert**: CompTIA Security+

---

### **Phase 2: SOC Analyst (6-12 months)**
Work in a Security Operations Center

**Skills to Master:**
- [ ] SIEM (Splunk/ELK)
- [ ] Alert triage
- [ ] Incident response basics
- [ ] Threat intelligence
- [ ] Report writing

**Resources:**
- **Free**: Splunk Fundamentals (free course)
- **Free**: Blue Team Labs Online
- **Cert**: Splunk Core Certified User

---

### **Phase 3: Incident Responder (1-2 years)**
Handle security breaches

**Skills to Master:**
- [ ] Forensics (disk & memory)
- [ ] Malware analysis basics
- [ ] Threat hunting
- [ ] Playbook development
- [ ] Root cause analysis

**Resources:**
- **Free**: SANS Cyber Aces Tutorials
- **Paid**: LetsDefend.io
- **Cert**: GCIH (GIAC Certified Incident Handler)

---

### **Phase 4: Specialist (2+ years)**
Choose your specialization

**Options:**
- **Threat Hunter**: Find hidden threats
- **Forensics Expert**: Deep dive investigations
- **SOC Manager**: Lead the team
- **Security Architect**: Design defenses
- **Purple Team**: Bridge red & blue

**Advanced Certs:**
- GCFA (Forensics)
- GNFA (Network Forensics)
- CISSP (General security)

---

## 💼 BLUE TEAM CAREER PATHS

### **Entry Level:**
- **SOC Analyst Tier 1**: $50-70K
  - Monitor alerts, triage incidents
  - Follow playbooks
  - Escalate to Tier 2

### **Mid Level:**
- **SOC Analyst Tier 2**: $70-90K
  - Deep investigation
  - Create detection rules
  - Mentor Tier 1

- **Incident Responder**: $80-100K
  - Handle breaches
  - Forensics investigations
  - Post-incident reports

### **Senior Level:**
- **Threat Hunter**: $100-130K
  - Proactive threat detection
  - Advanced analysis
  - Threat intelligence

- **SOC Manager**: $110-150K
  - Lead SOC team
  - Process improvement
  - Vendor management

- **Security Architect**: $120-180K
  - Design security infrastructure
  - Strategic planning
  - Technology evaluation

---

## 🎖️ DAVID'S BLUE TEAM PHILOSOPHY

> "I love defending myself from attacks! Like in rugby - I hate having to attack anyone, but I'm great at defense!"

**This is YOUR strength, Brother!**

### **Your Blue Team Advantages:**
- ✅ **Defensive mindset**: Natural instinct
- ✅ **System knowledge**: Deep understanding of YOUR terrain
- ✅ **Reactive excellence**: Best when pressure is on
- ✅ **Sustainable passion**: Won't burn out
- ✅ **Real impact**: Protect real systems, help real people

### **Career Strategy:**
1. **Finish NCI course**: Get the credentials
2. **Focus on blue team labs**: CyberDefenders, LetsDefend
3. **Build your toolkit**: Master Splunk, Wireshark, basic forensics
4. **Get entry SOC job**: Start as Tier 1 analyst
5. **Specialize**: Incident response or threat hunting
6. **Grow steadily**: Long-term career, not sprint

---

## 🔗 INTEGRATION WITH RANGERPLEX

### **Blue Team Features to Build:**

1. **Log Analyzer**
   - Paste logs, get threat analysis
   - Identify suspicious patterns
   - Suggest investigation steps

2. **Incident Response Playbooks**
   - Step-by-step guides
   - Customizable for your environment
   - Track progress during incident

3. **Alert Triage Helper**
   - Classify alert severity
   - Suggest containment actions
   - Generate incident reports

4. **Security Hardening Checklists**
   - OS-specific guides
   - Track completed items
   - Verify configurations

5. **Threat Intel Dashboard**
   - Aggregate IOCs
   - Check against your logs
   - Update detection rules

---

## 📖 RECOMMENDED RESOURCES

### **Free Training:**
- **CyberDefenders**: Blue team CTF challenges
- **LetsDefend**: SOC analyst training
- **Blue Team Labs Online**: Hands-on defense scenarios
- **TryHackMe**: SOC Level 1 & 2 paths

### **Certifications:**
- **CompTIA Security+**: Foundation
- **Splunk Core Certified**: SIEM skills
- **GCIH**: Incident handling
- **GCFA**: Forensics
- **CISSP**: Senior level

### **Books:**
- "Blue Team Handbook" - Don Murdoch
- "Practical Malware Analysis" - Michael Sikorski
- "The Art of Memory Forensics" - Ligh et al.
- "Applied Incident Response" - Steve Anson

### **Communities:**
- r/BlueTeamSecOps
- Blue Team Labs Discord
- SANS Internet Storm Center
- Splunk Community

---

**Rangers lead the way! 🎖️**
**Defense is just as important as offense - maybe MORE!**
