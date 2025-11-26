# 💜 PURPLE TEAM TOOLKIT - The Ultimate Hybrid
## "Best of Both Worlds" - Offense + Defense = Maximum Security

> **Purple Team Mission**: Bridge the gap between red and blue teams
>
> Use offensive skills to improve defensive capabilities

---

## 📋 TABLE OF CONTENTS

1. [What is Purple Team?](#what-is-purple-team)
2. [Purple Team Philosophy](#philosophy)
3. [The Purple Team Process](#the-process)
4. [Attack Simulation Framework](#attack-simulation)
5. [Detection Engineering](#detection-engineering)
6. [Threat Hunting](#threat-hunting)
7. [Purple Team Exercises](#exercises)
8. [Career Path](#career-path)
9. [RangerPlex Purple Team Features](#rangerplex-integration)

---

## 🎯 WHAT IS PURPLE TEAM?

### **The Colors Explained:**

```
🔴 RED TEAM (Offense)
├─ Finds vulnerabilities
├─ Exploits weaknesses
├─ Thinks like attackers
└─ Operates independently

🔵 BLUE TEAM (Defense)
├─ Monitors systems
├─ Responds to incidents
├─ Hardens infrastructure
└─ Operates reactively

💜 PURPLE TEAM (Collaboration)
├─ Combines both approaches
├─ Improves detection capabilities
├─ Tests defenses continuously
└─ Operates cooperatively
```

### **Purple Team is NOT:**
- ❌ A separate team
- ❌ Just red team + blue team
- ❌ A certification or role (yet)
- ❌ Only for large organizations

### **Purple Team IS:**
- ✅ A **collaborative approach**
- ✅ Red team testing + Blue team improving
- ✅ Continuous feedback loop
- ✅ Focus on **measurable improvement**

---

## 🎯 PHILOSOPHY

### **The Purple Team Mindset:**

**From Red Team Perspective:**
- "I found a vulnerability... let me help blue team detect it next time"
- "Here's exactly how I got in, so you can build defenses"
- "Let's test if your alerts actually work"

**From Blue Team Perspective:**
- "Show me how you'd attack this, so I can improve detection"
- "I built this rule, can you try to bypass it?"
- "Help me understand the attacker's perspective"

### **The Goal:**
Not to "win" against each other, but to **improve together**

**Success Metrics:**
- ✅ Reduced time to detect attacks
- ✅ Increased detection coverage
- ✅ Better incident response procedures
- ✅ Improved security posture

---

## 🔄 THE PURPLE TEAM PROCESS

### **Step 1: Plan the Attack**
Red team plans realistic attack scenario

**Example:**
```
Scenario: Phishing → Initial Access → Privilege Escalation → Data Exfiltration
Target: Finance department data
Technique: Spearphishing with malicious macro
```

---

### **Step 2: Execute the Attack**
Red team carries out the attack

**Execution:**
- Send phishing email
- User opens document
- Macro executes payload
- C2 beacon established
- Escalate privileges
- Access sensitive data
- Exfiltrate to external server

**Red Team Documents:**
- Every command executed
- Every tool used
- Timestamps of each action
- Network connections made
- Files created/modified

---

### **Step 3: Blue Team Response**
Did blue team detect it? How fast?

**Questions:**
- Was the email blocked?
- Did EDR catch the macro?
- Were alerts generated?
- How long until detection?
- Was the response appropriate?

---

### **Step 4: Analysis & Collaboration**
Red and blue team meet to discuss

**Red Team Shares:**
- Exact attack path
- Tools and techniques used
- What bypassed defenses
- Recommendations for detection

**Blue Team Shares:**
- What was detected (and when)
- What was missed (and why)
- Current detection capabilities
- Gaps identified

---

### **Step 5: Improve Defenses**
Build better detection and response

**Improvements:**
- New SIEM rules
- Updated EDR policies
- Enhanced email filtering
- Incident response playbook
- User training recommendations

---

### **Step 6: Validate Improvements**
Red team tests again

**Retest:**
- Does new detection work?
- Can attack still succeed?
- How much harder is it now?
- What's the detection time?

**Goal:** Continuous improvement loop!

---

## 🎯 ATTACK SIMULATION FRAMEWORK

### **MITRE ATT&CK Framework**
The language purple teams speak

**13 Tactics (The "Why"):**
1. Reconnaissance
2. Resource Development
3. Initial Access
4. Execution
5. Persistence
6. Privilege Escalation
7. Defense Evasion
8. Credential Access
9. Discovery
10. Lateral Movement
11. Collection
12. Command & Control
13. Exfiltration

**Techniques (The "How"):**
- 200+ specific techniques
- Each with detection strategies
- Real-world examples

**Using ATT&CK:**
```
1. Select technique to test (e.g., T1003 - Credential Dumping)
2. Red team executes technique
3. Blue team attempts detection
4. Map gaps in coverage
5. Build detection rules
6. Retest
```

---

### **Atomic Red Team**
Automated ATT&CK testing

**Install:**
```powershell
# Install Invoke-AtomicRedTeam
IEX (IWR 'https://raw.githubusercontent.com/redcanaryco/invoke-atomicredteam/master/install-atomicredteam.ps1' -UseBasicParsing);
Install-AtomicRedTeam -getAtomics
```

**Run Tests:**
```powershell
# List available tests for a technique
Invoke-AtomicTest T1003 -ShowDetailsBrief

# Run specific test
Invoke-AtomicTest T1003 -TestNumbers 1

# Run all tests for technique
Invoke-AtomicTest T1003

# Check what test would do (dry run)
Invoke-AtomicTest T1003 -TestNumbers 1 -ShowDetails
```

**Example Test - Credential Dumping:**
```powershell
# T1003.001 - LSASS Memory
Invoke-AtomicTest T1003.001

# Blue Team Question:
# Did our EDR detect this?
# Did SIEM alert on LSASS access?
# Was it blocked or just alerted?
```

---

### **Caldera (Automated Adversary Emulation)**
```bash
# Install Caldera
git clone https://github.com/mitre/caldera.git
cd caldera
pip3 install -r requirements.txt
python3 server.py

# Access: http://localhost:8888
# Deploy agents on test systems
# Run adversary profiles
# Review results
```

**Use Cases:**
- Automate multi-stage attacks
- Test detection across kill chain
- Measure blue team response time
- Generate realistic telemetry

---

## 🔍 DETECTION ENGINEERING

### **What is Detection Engineering?**
Creating rules/logic to identify malicious activity

**Process:**
```
1. Understand attack technique
2. Identify artifacts/indicators
3. Write detection logic
4. Test with real attacks
5. Tune to reduce false positives
6. Deploy to production
7. Monitor effectiveness
```

---

### **Example: Detecting Mimikatz**

**Red Team Attack:**
```powershell
# Run mimikatz to dump credentials
mimikatz.exe
sekurlsa::logonpasswords
```

**Blue Team Detection:**

**Sigma Rule (Universal Detection Language):**
```yaml
title: Mimikatz Credential Dumping
id: 3d6f1c2e-0c1a-4f3b-9e2d-1a2b3c4d5e6f
status: experimental
description: Detects mimikatz credential dumping activity
references:
    - https://attack.mitre.org/techniques/T1003/
logsource:
    product: windows
    service: security
detection:
    selection:
        EventID:
            - 4656  # Access to LSASS
            - 4663  # Access to LSASS
        ObjectName|contains: 'lsass.exe'
        AccessMask: '0x1410'
    condition: selection
falsepositives:
    - Legitimate security tools
level: high
tags:
    - attack.credential_access
    - attack.t1003
```

**Convert to Splunk:**
```spl
index=windows EventCode IN (4656, 4663) ObjectName="*lsass.exe*" AccessMask="0x1410"
| stats count by Computer, SubjectUserName
| where count > 0
```

**Test:**
```
1. Red team runs mimikatz
2. Check if SIEM alert fires
3. Verify alert contains useful info
4. Tune if needed (reduce FPs)
```

---

### **Example: Detecting Lateral Movement**

**Red Team Attack:**
```bash
# Use PsExec to move laterally
psexec.exe \\target-pc -u admin -p password cmd.exe
```

**Blue Team Detection:**

**Splunk Rule:**
```spl
index=windows EventCode=4624 LogonType=3
| where SourceNetworkAddress!="127.0.0.1"
| stats count by SourceNetworkAddress, TargetUserName, Computer
| where count > 5
```

**What to Look For:**
- Multiple login attempts
- Admin account used
- Service installation (EventID 7045)
- SMB connections on 445
- Named pipes created

---

## 🎯 THREAT HUNTING

### **Proactive vs Reactive:**

**Reactive (Traditional Blue Team):**
- Wait for alerts
- Respond to incidents
- Follow playbooks

**Proactive (Purple Team):**
- Hunt for hidden threats
- Look for anomalies
- Assume breach mindset

---

### **Hunt Process:**

**1. Hypothesis**
Form educated guess about threats

**Examples:**
- "Attackers might be using PowerShell for persistence"
- "There could be unauthorized admin accounts"
- "Suspicious outbound connections to rare countries"

**2. Investigate**
Search for evidence

```spl
# Hunt for encoded PowerShell
index=* powershell.exe "-enc" OR "-encodedcommand"
| stats count by Computer, User

# Hunt for new admin accounts
index=windows EventCode=4720 OR EventCode=4732
| where Group="Administrators"
| table _time, TargetUserName, Computer

# Hunt for unusual DNS queries
index=dns query_length > 50
| stats count by query, src_ip
| where count < 5
```

**3. Analyze**
Determine if threat is real

**Questions:**
- Is this behavior normal for this user/system?
- Has this been seen before?
- Does this match known attack patterns?

**4. Respond**
Take appropriate action

**If Malicious:**
- Contain the threat
- Collect evidence
- Eradicate
- Document findings

**If Benign:**
- Document as false positive
- Update detection rules
- Add to whitelist if needed

---

### **Hunt Scenarios:**

**Scenario 1: Hunt for C2 Beaconing**
```spl
# Regular network connections (potential beaconing)
index=network
| bin _time span=1h
| stats count by _time, dest_ip
| where count > 10
| timechart span=1h count by dest_ip
```

**Scenario 2: Hunt for Privilege Escalation**
```spl
# Users adding themselves to admin groups
index=windows EventCode=4732
| where Group="Administrators" AND SubjectUserName=TargetUserName
```

**Scenario 3: Hunt for Data Staging**
```spl
# Large file operations in unusual directories
index=* sourcetype=WinEventLog:Security EventCode=4663
| where ObjectName="C:\\\\Temp\\\\*" OR ObjectName="C:\\\\Users\\\\Public\\\\*"
| where AccessMask IN ("0x2", "0x4")
| stats sum(eval(FileSize)) as total_bytes by SubjectUserName, Computer
| where total_bytes > 1000000000
```

---

## 💻 PURPLE TEAM EXERCISES

### **Exercise 1: Phishing Test**

**Red Team:**
```
1. Create realistic phishing email
2. Send to test group
3. Track who clicked
4. Deploy safe payload (beacon)
5. Document everything
```

**Blue Team:**
```
1. Monitor email gateway
2. Check EDR alerts
3. Identify compromised users
4. Time to detection?
5. Incident response
```

**Collaboration:**
```
- How many users clicked? (Training gap)
- Did email filter catch it? (Technical gap)
- How fast was detection? (Process gap)
- What would improve defense?
```

---

### **Exercise 2: Ransomware Simulation**

**Red Team:**
```
1. Use ransomware simulator (NOT real ransomware!)
2. Encrypt test files
3. Create ransom note
4. Test file share propagation
5. Document indicators
```

**Tools:**
- RanSim (KnowBe4)
- Atomic Red Team T1486
- Safe custom scripts

**Blue Team:**
```
1. EDR behavioral detection?
2. File activity monitoring?
3. Backup systems triggered?
4. Isolation procedures?
5. Recovery time?
```

**Improvements:**
- Enable file screening on shares
- EDR anti-ransomware policies
- Regular backup testing
- Faster isolation procedures

---

### **Exercise 3: Active Directory Attack**

**Red Team Kill Chain:**
```
1. Initial Access: Phishing
2. Execution: PowerShell payload
3. Discovery: BloodHound enumeration
4. Lateral Movement: Pass-the-Hash
5. Privilege Escalation: Kerberoasting
6. Persistence: Golden Ticket
7. Exfiltration: Data theft
```

**Blue Team Detection Points:**
```
1. Email with suspicious attachment
2. PowerShell execution
3. LDAP queries (BloodHound)
4. NTLM authentication anomalies
5. Service ticket requests (TGS-REQ)
6. Kerberos anomalies (TGT requests)
7. Large data transfers
```

**Validation:**
```
For each step:
- Was it detected? (Yes/No)
- How long until detection? (Time)
- Was it blocked? (Yes/No)
- What alert fired? (Rule ID)
- What would improve detection?
```

---

## 💼 PURPLE TEAM CAREER PATH

### **How to Become Purple Team:**

**Option 1: Blue Team → Purple**
1. Start as SOC analyst
2. Learn offensive techniques
3. Understand attacker TTPs
4. Develop detection rules
5. Move to threat hunting
6. Lead purple team exercises

**Option 2: Red Team → Purple**
1. Start as penetration tester
2. Learn defensive tools (SIEM, EDR)
3. Understand detection logic
4. Help blue team improve
5. Move to detection engineering
6. Lead purple team exercises

---

### **Required Skills:**

**Technical:**
- ✅ Offensive tools (red team)
- ✅ Defensive tools (blue team)
- ✅ SIEM query languages
- ✅ Detection rule writing
- ✅ Threat intelligence
- ✅ Attack frameworks (MITRE ATT&CK)

**Soft Skills:**
- ✅ Communication (bridge red & blue)
- ✅ Collaboration (work with both sides)
- ✅ Teaching (educate teams)
- ✅ Metrics (measure improvement)

---

### **Career Progression:**

**Entry (2-3 years):**
- **Detection Engineer**: $80-100K
  - Write detection rules
  - Test with attack simulations
  - Tune for false positives

**Mid (3-5 years):**
- **Threat Hunter**: $100-130K
  - Proactive threat detection
  - Hypothesis-driven investigations
  - Hunt playbook development

**Senior (5+ years):**
- **Purple Team Lead**: $130-160K
  - Lead exercises
  - Manage red/blue collaboration
  - Strategic security improvements

- **Detection Engineering Manager**: $140-180K
  - Lead detection team
  - Set detection strategy
  - Vendor evaluation

---

## 🎖️ CERTIFICATIONS

**Offensive Security:**
- OSCP (red team foundation)
- CRTP (Active Directory)
- CRTE (Red Team Expert)

**Defensive Security:**
- GCIH (incident handling)
- GCFA (forensics)
- GCIA (intrusion analysis)

**Purple Team Specific:**
- PNPT (Practical Network Penetration Tester)
- GPEN + GCIA combo
- Purple Team Certified (coming soon?)

**Detection Engineering:**
- Splunk Certified (Power User, Architect)
- MITRE ATT&CK Training
- Detection-as-Code courses

---

## 🔗 RANGERPLEX PURPLE TEAM INTEGRATION

### **Features to Build:**

#### **1. Attack Simulator**
```
Input: MITRE ATT&CK Technique ID (e.g., T1003)
Output:
- Attack description
- Commands to execute (red team)
- Expected artifacts (blue team)
- Detection rules (Splunk, Sigma)
- Validation steps
```

#### **2. Detection Rule Generator**
```
Input: Attack scenario
Output:
- Sigma rule (universal)
- Splunk SPL query
- ELK/Kibana query
- Windows Event IDs to monitor
- Testing commands
```

#### **3. Purple Team Exercise Planner**
```
Input: Security objective
Output:
- Red team scenario
- Blue team checklist
- Success metrics
- Documentation template
- Improvement recommendations
```

#### **4. Threat Hunt Helper**
```
Input: Hypothesis
Output:
- Hunt queries (SIEM)
- What to look for
- Analysis guidance
- Response actions
- Documentation template
```

#### **5. Detection Coverage Map**
```
Input: Current security stack
Output:
- MITRE ATT&CK heatmap
- Coverage gaps
- Priority recommendations
- Testing plan
```

---

## 📚 PURPLE TEAM RESOURCES

### **Frameworks:**
- **MITRE ATT&CK**: attack.mitre.org
- **Atomic Red Team**: atomicredteam.io
- **MITRE Caldera**: caldera.mitre.org
- **Detection Lab**: detectionlab.network

### **Detection Rules:**
- **Sigma HQ**: github.com/SigmaHQ/sigma
- **Elastic Detection Rules**: github.com/elastic/detection-rules
- **Splunk Security Content**: github.com/splunk/security_content

### **Learning:**
- **MITRE ATT&CK Training**: attack.mitre.org/resources/training
- **Cyber Defenders**: cyberdefenders.org (purple team challenges)
- **Detection Engineering**: detectionengineering.net
- **Purple Team Con**: Videos on YouTube

### **Tools:**
- **VECTR**: Purple team collaboration platform
- **Attack Navigator**: ATT&CK technique mapping
- **BloodHound**: AD attack paths (red) + hardening (blue)
- **Sysmon**: Detailed Windows logging for detection

---

## 🎯 FOR DAVID: PURPLE TEAM SWEET SPOT

**Why Purple Team Might Be Perfect for You:**

### **Your Strengths:**
- ✅ **Blue team heart**: Defense is your passion
- ✅ **Red team knowledge**: You understand attacks (from YouTube!)
- ✅ **Practical mindset**: Focus on what actually works
- ✅ **System knowledge**: Deep understanding of your terrain

### **Purple Team Advantages:**
1. **Less tool chaos**: Focus on IMPROVING detection, not just attacking
2. **Blue team focus**: 80% defense, 20% offense knowledge
3. **Measurable impact**: See defenses improve
4. **Better pay**: Purple team roles are in high demand
5. **Collaborative**: Work WITH red team, don't have to BE red team

### **Your Path:**
```
1. Finish NCI (blue team focus) ✅
2. Get SOC analyst job (blue team) ✅
3. Learn detection rules (SIEM) ✅
4. Study MITRE ATT&CK (purple team) ✅
5. Practice detection engineering ✅
6. Move to purple team role 💜
```

**Purple Team = Defense + Attack Knowledge**
**Perfect for someone who:**
- Loves defense (you!)
- Understands offense (you!)
- Hates tool grinding (you!)
- Wants better pay (you!)

---

## 💡 THE ULTIMATE GOAL

**Purple Team Philosophy:**
> "We're not red vs blue. We're all on the SAME team fighting real attackers."

**Success Looks Like:**
- ✅ Faster detection times
- ✅ Better alert quality
- ✅ Improved response procedures
- ✅ Measurable security improvements
- ✅ Red and blue teams collaborating

**NOT:**
- ❌ Red team "pwning" blue team
- ❌ Blue team blocking every red team test
- ❌ Arguing about who's better
- ❌ Working in silos

---

**Rangers lead the way! 🎖️**
**Red team attacks. Blue team defends. Purple team makes BOTH better!**
