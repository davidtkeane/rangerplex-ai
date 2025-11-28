# 🕵️ Intelligence Gathering Command Reference

This document provides a comprehensive guide to OSINT (Open-Source Intelligence) and threat intelligence tools available in RangerPlex. These commands help you gather information about people, organizations, threats, and digital footprints.

---

## 👤 People & Identity Intelligence

### `/sherlock <username>`
Hunts for usernames across 12+ social platforms.
- **Platforms**: GitHub, Twitter, Instagram, Reddit, TikTok, YouTube, and more
- **No API Key Required**
- **Shows**: Profile URLs where username exists
- **False Positive Detection**: Identifies "entrapment" pages
- **Example**: `/sherlock john_doe`

**Platforms Checked:**
- GitHub, GitLab
- Twitter (X), Instagram, TikTok
- Reddit, Pinterest
- YouTube, Twitch
- Medium, Dev.to
- Patreon, Ko-fi

**Use Cases:**
- Social media footprint mapping
- Username availability check
- Account correlation
- OSINT investigations
- Digital identity verification

**Note**: Some platforms may return false positives (empty profiles designed to make you sign up). RangerPlex detects and flags these.

---

### `/breach <email>`
Checks if an email has been compromised in data breaches.
- **Source**: Have I Been Pwned (HIBP) API
- **No API Key Required** (uses anonymous API)
- **Shows**: Breached sites, breach dates, exposed data types
- **Example**: `/breach user@example.com`

**Data Types Shown:**
- Passwords (hashed or plaintext)
- Email addresses
- Names and addresses
- Phone numbers
- Credit card numbers
- Social Security numbers

**Use Cases:**
- Personal security audit
- Password change prioritization
- Identity theft awareness
- Account security assessment
- Breach notification

**Privacy**: This tool uses the anonymous HIBP API. Your email is never stored or logged.

---

### `/phone <number>`
Analyzes phone number details and carrier information.
- **Requires**: NumVerify API key (Settings → Providers)
- **Shows**: Country, carrier, line type (mobile/landline/VOIP)
- **Format**: International format (e.g., +1234567890)
- **Example**: `/phone +14155552671`

**Use Cases:**
- Phone number validation
- Carrier identification
- Line type detection (mobile vs landline)
- Country/region verification
- Fraud prevention

---

### `/email <address>`
Validates email addresses and checks deliverability.
- **Requires**: Email verification API key
- **Shows**: Validity, deliverability, disposable email detection
- **Example**: `/email user@example.com`

**Use Cases:**
- Email validation
- Disposable email detection
- Typo detection
- Spam prevention
- User verification

---

## 🏢 Organization Intelligence

### `/company <name|reg_number> [country]`
Looks up company registry data.
- **Default**: UK Companies House
- **International**: OpenCorporates (requires API key)
- **Shows**: Legal name, status, officers, registered address, filing history
- **Example**: `/company Microsoft` or `/company 09413826 UK`

**Data Returned:**
- Company legal name
- Registration number
- Current status (Active, Dissolved, etc.)
- Officers and directors
- Registered address
- Incorporation date
- Filing history

**Use Cases:**
- Business verification
- Corporate structure research
- Officer identification
- Due diligence
- Fraud prevention

**Supported Countries**: UK (default), US, EU, and 100+ via OpenCorporates

---

## 🛡️ Threat Intelligence

### `/shodan <ip>`
Scans IPs for open ports, vulnerabilities, and services.
- **Requires**: Shodan API key (Settings → Providers)
- **Shows**: Open ports, services, vulnerabilities, banners
- **Example**: `/shodan 8.8.8.8`

**Data Returned:**
- Open ports and services
- Service banners
- CVE vulnerabilities
- Geographic location
- Organization/ISP
- Historical data

**Use Cases:**
- Vulnerability assessment
- Attack surface mapping
- IoT device discovery
- Security research
- Threat hunting

**Note**: Shodan is a search engine for internet-connected devices. Use responsibly and only on authorized targets.

---

### `/scan <url>`
Checks URLs for malware and phishing via VirusTotal.
- **Requires**: VirusTotal API key (Settings → Providers)
- **Shows**: Detection ratio, malicious verdicts, clean verdicts
- **Example**: `/scan https://suspicious-site.com`

**Use Cases:**
- Phishing detection
- Malware URL identification
- Link safety verification
- Threat intelligence
- Incident response

**How It Works**:
1. Submits URL to VirusTotal
2. Scans with 70+ antivirus engines
3. Returns detection ratio (e.g., 5/72 engines flagged as malicious)

---

### `/hash <hash>`
VirusTotal hash intelligence for malware verdicts.
- **Requires**: VirusTotal API key (Settings → Providers)
- **Supports**: MD5, SHA1, SHA256, SHA512
- **Shows**: Malicious verdicts, file names, detection ratio
- **Example**: `/hash 44d88612fea8a8f36de82e1278abb02f`

**Use Cases:**
- Malware identification
- File reputation check
- IOC (Indicator of Compromise) lookup
- Incident response
- Threat intelligence

---

## 📸 Digital Evidence Collection

### `/screenshot <url>`
Captures live screenshots of websites.
- **Resolution**: 1920x1080 (high quality)
- **Engine**: Puppeteer (headless Chrome)
- **No API Key Required**
- **Example**: `/screenshot https://example.com`

**Use Cases:**
- Evidence collection
- Phishing documentation
- Change detection
- Website archiving
- Visual confirmation

**Features**:
- Full-page screenshots
- JavaScript execution
- Cookie handling
- Redirect following
- Timeout protection

---

### `/wayback <url>`
Queries Internet Archive for historical website snapshots.
- **Source**: archive.org Wayback Machine
- **Shows**: Available snapshot dates
- **No API Key Required**
- **Example**: `/wayback https://example.com`

**Use Cases:**
- Historical website viewing
- Deleted content recovery
- Change tracking
- Evidence preservation
- Research

**How to Use Results**:
1. Command shows available snapshot dates
2. Visit: `https://web.archive.org/web/[timestamp]/[url]`
3. Browse historical version

---

## 🗞️ News & Information

### `/news <query>`
Searches for recent news articles.
- **Source**: News aggregator API
- **Shows**: Headlines, sources, publication dates
- **Example**: `/news artificial intelligence`

**Use Cases:**
- Current events research
- Topic monitoring
- Source verification
- Fact-checking
- OSINT investigations

---

## 🌦️ Environmental Intelligence

### `/weather <location>`
Fetches current weather conditions and forecast.
- **Shows**: Temperature, conditions, humidity, wind
- **Example**: `/weather Dublin, Ireland`

**Use Cases:**
- Location verification (timezone, weather correlation)
- Timestamp verification
- Photo/video authentication
- Travel planning
- OSINT context

---

## 💡 Intelligence Methodology

### The Intelligence Cycle

1. **Planning & Direction**
   - Define objectives
   - Identify information requirements
   - Choose appropriate tools

2. **Collection**
   - Use RangerPlex commands to gather data
   - Document sources and timestamps
   - Maintain chain of custody

3. **Processing**
   - Organize collected data
   - Remove duplicates
   - Verify accuracy

4. **Analysis**
   - Identify patterns and connections
   - Cross-reference multiple sources
   - Generate insights

5. **Dissemination**
   - Present findings clearly
   - Protect sensitive information
   - Share with authorized parties

6. **Feedback**
   - Refine techniques
   - Identify gaps
   - Improve processes

---

## 🎯 OSINT Best Practices

### 1. **Source Verification**
- Cross-reference multiple sources
- Check publication dates
- Verify source credibility
- Look for primary sources

### 2. **Data Correlation**
- Link usernames across platforms
- Match email addresses to profiles
- Connect organizations to individuals
- Build relationship maps

### 3. **Operational Security (OPSEC)**
- Use VPN for anonymity
- Create sock puppet accounts (where legal)
- Avoid revealing investigation targets
- Protect source identities

### 4. **Legal Compliance**
- Respect privacy laws (GDPR, CCPA)
- Obtain proper authorization
- Document legal basis
- Follow ethical guidelines

### 5. **Documentation**
- Screenshot evidence immediately
- Save URLs and timestamps
- Record chain of custody
- Maintain investigation logs

---

## 🔒 Privacy & Ethics

### What's Legal:
- ✅ Publicly available information
- ✅ Search engines and social media
- ✅ Public records and databases
- ✅ Open-source tools
- ✅ Authorized investigations

### What's Illegal:
- ❌ Hacking or unauthorized access
- ❌ Social engineering for passwords
- ❌ Stalking or harassment
- ❌ Identity theft
- ❌ Violation of privacy laws

### Ethical Guidelines:
1. **Purpose**: Only investigate for legitimate reasons
2. **Proportionality**: Use appropriate methods for the goal
3. **Privacy**: Respect individual privacy rights
4. **Accuracy**: Verify information before acting
5. **Transparency**: Document methods and sources

---

## ⚠️ Legal Disclaimer

These tools are provided for:
- ✅ Authorized security research
- ✅ Personal security audits
- ✅ Lawful investigations
- ✅ Educational purposes
- ✅ OSINT training

**Unauthorized use may violate**:
- Computer Fraud and Abuse Act (CFAA)
- Wire Fraud statutes
- Privacy laws (GDPR, CCPA)
- Anti-stalking laws
- Harassment statutes

Always obtain proper authorization and comply with applicable laws.

---

## 🔍 Investigation Workflow Example

**Scenario**: Investigating a suspicious domain

```bash
# Step 1: Domain Intelligence
/whois suspicious-domain.com
/dns suspicious-domain.com
/reputation suspicious-domain.com

# Step 2: Subdomain Discovery
/subdomains suspicious-domain.com

# Step 3: SSL Analysis
/ssl suspicious-domain.com
/certs suspicious-domain.com

# Step 4: Screenshot Evidence
/screenshot https://suspicious-domain.com

# Step 5: Historical Analysis
/wayback https://suspicious-domain.com

# Step 6: IP Analysis
/reverse <ip from dns>
/geoip <ip from dns>
/shodan <ip from dns>

# Step 7: URL Scan
/scan https://suspicious-domain.com
```

---

## 📚 Related Documentation

- **System Commands**: See `help-files/SYSTEM_COMMANDS.md`
- **Reconnaissance**: See `help-files/RECONNAISSANCE_COMMANDS.md`
- **Forensics**: See `help-files/forensics/COMMAND_REFERENCE.md`
- **Main Manual**: Type `/manual` in chat

---

## 📖 Further Reading

**Recommended Resources**:
- OSINT Framework: https://osintframework.com
- Bellingcat Online Investigation Toolkit
- Trace Labs Search Party Training
- SANS OSINT Summit talks
- IntelTechniques.com OSINT tools

**Books**:
- "Open Source Intelligence Techniques" by Michael Bazzell
- "OSINT Handbook" by i-intelligence
- "Social Engineering" by Christopher Hadnagy

---

**Built with ❤️ by David Keane (IrishRanger) | iCanHelp Ltd**
*Transforming disabilities into superpowers - helping 1.3 billion people worldwide.*

🎖️ **Rangers lead the way!**
