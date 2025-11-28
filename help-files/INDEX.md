# 📚 RangerPlex Command Documentation Index

Welcome to the RangerPlex command documentation hub! This index helps you navigate all available command references and guides.

---

## 🗂️ Command Categories

### 🔧 System Management
**File**: `SYSTEM_COMMANDS.md`

Control RangerPlex, manage updates, and access settings.

**Commands:**
- `/settings` - Open settings panel
- `/restart` - Restart proxy server
- `/check update` - Check for updates
- `/install update` - Auto-update from GitHub
- `/check wordpress` - WordPress status
- `/sys-info` - System diagnostics
- `/study` - Study Clock timer
- `/wordpress` - WordPress dashboard
- `/manual` - Open manual
- `/about` - About RangerPlex
- `/help` - Command help

**[→ View System Commands Documentation](./SYSTEM_COMMANDS.md)**

---

### 🔍 Diagnostics & Monitoring
**File**: `DIAGNOSTICS_COMMANDS.md`

Monitor system health, track errors, and manage updates.

**Commands:**
- `/sys-info` - Comprehensive system diagnostics
- Smart update notifications
- Automatic error logging

**Features:**
- Service status monitoring
- Database health checks
- Performance metrics
- Error tracking
- Update management

**[→ View Diagnostics Documentation](./DIAGNOSTICS_COMMANDS.md)**

---

### 🔍 Reconnaissance & OSINT
**File**: `RECONNAISSANCE_COMMANDS.md`

Gather information about domains, IPs, and network infrastructure.

**Domain Intel:**
- `/whois` - Domain registration info
- `/dns` - DNS records lookup
- `/subdomains` - Subdomain discovery
- `/certs` - SSL certificate enumeration
- `/reverse` - Reverse DNS lookup
- `/ssl` - SSL certificate inspector
- `/headers` - HTTP security headers
- `/reputation` - Malware/phishing check

**IP & Network:**
- `/geoip` - IP geolocation
- `/ipinfo` - Advanced IP intelligence
- `/myip` - Your public IP
- `/iprecon` - Threat intelligence (VPN/Proxy detection)
- `/trace` - Traceroute
- `/asn` - ASN lookup

**Ports & Services:**
- `/ports` - TCP port scanner
- `/nmap` - Full Nmap integration

**Hardware:**
- `/mac` - MAC address lookup

**Privacy:**
- `/privacy` - Privacy fingerprinting snapshot

**[→ View Reconnaissance Documentation](./RECONNAISSANCE_COMMANDS.md)**

---

### 🕵️ Intelligence Gathering
**File**: `INTELLIGENCE_COMMANDS.md`

OSINT and threat intelligence for people, organizations, and threats.

**People & Identity:**
- `/sherlock` - Username search (12+ platforms)
- `/breach` - Email breach check (HIBP)
- `/phone` - Phone number analysis
- `/email` - Email validation

**Organizations:**
- `/company` - Company registry lookup

**Threats:**
- `/shodan` - IP vulnerability scanner
- `/scan` - VirusTotal URL scanner
- `/hash` - VirusTotal hash lookup

**Evidence:**
- `/screenshot` - Website screenshot
- `/wayback` - Internet Archive search

**News:**
- `/news` - News article search
- `/weather` - Weather data

**[→ View Intelligence Documentation](./INTELLIGENCE_COMMANDS.md)**

---

### 🕵️ Digital Forensics
**File**: `forensics/COMMAND_REFERENCE.md`

Tools for digital forensics, incident response, and evidence handling.

**Hashing:**
- `/hash` - Calculate file hash
- `/hash-verify` - Verify file integrity
- `/hash-dir` - Hash directory contents

**Metadata:**
- `/metadata` - File metadata
- `/exif` - Image EXIF data
- `/timeline` - Timeline generation

**Analysis:**
- `/strings` - Extract strings
- `/grep` - Pattern search

**Chain of Custody:**
- `/custody-create` - Create CoC log
- `/custody-update` - Update CoC
- `/custody-verify` - Verify integrity

**[→ View Forensics Documentation](./forensics/COMMAND_REFERENCE.md)**

---

### 🦠 Malware Analysis
**File**: `malware/` (Coming Soon)

Tools for malware analysis and VM management.

**Analysis:**
- `/malware-hash` - Multi-hash report
- `/malware-fileinfo` - File structure analysis
- `/malware-strings` - Extract strings & IOCs
- `/malware-entropy` - Entropy calculation
- `/malware-hexdump` - Hex dump generation
- `/ioc-extract` - IOC extraction

**Management:**
- `/malware-quarantine` - Quarantine file
- `/malware-restore` - Restore file
- `/malware-test` - Test operation

**Binary Analysis:**
- `/malware-pe` - PE header analysis
- `/malware-elf` - ELF header analysis

**VM & Tools:**
- `/vm-*` - VM management
- `/msf` - Metasploit commands

**[→ View Malware Documentation](./malware/)** *(Coming Soon)*

---

### 💰 Cryptocurrency & Finance
**File**: `CRYPTO_FINANCIAL_COMMANDS.md`

Track crypto prices and analyze blockchain transactions.

**Market:**
- `/crypto` - Cryptocurrency prices

**Blockchain:**
- `/wallet` - Bitcoin wallet inspector

**[→ View Crypto/Financial Documentation](./CRYPTO_FINANCIAL_COMMANDS.md)**

---

### 🎭 Miscellaneous & Fun
**File**: `MISC_COMMANDS.md`

Entertainment, creative tools, and easter eggs.

**Fun:**
- `/chuck` - Chuck Norris facts
- `/joke` - Programming jokes
- `/bible` - Bible verses

**Creative:**
- `canvas` - Canvas drawing board

**Easter Eggs:**
- `/deathstar` - Death Star animation
- Special name triggers (David T Keane, Fazal, Sowmya, Michael, Win95)

**[→ View Miscellaneous Documentation](./MISC_COMMANDS.md)**

---

### 🎨 Canvas Board
**File**: `canvas/CANVAS_SHORTCUTS.md`

Digital sketching and drawing tools.

**Features:**
- Freehand drawing
- Shapes and colors
- Save/Export

**[→ View Canvas Documentation](./canvas/CANVAS_SHORTCUTS.md)**

---

## 🚀 Quick Start Guide

### For New Users

1. **Start with basics**: `/help`, `/about`, `/settings`
2. **Try a fun command**: `/chuck` or `/joke`
3. **Test your IP**: `/myip`
4. **Check crypto prices**: `/crypto btc`
5. **Open study timer**: `/study`

### For Security Professionals

1. **Domain recon**: `/whois`, `/dns`, `/subdomains`
2. **IP analysis**: `/geoip`, `/iprecon`, `/shodan`
3. **Port scanning**: `/nmap` (TryHackMe/CTF)
4. **Threat intel**: `/scan`, `/hash`, `/breach`
5. **Forensics**: `/hash`, `/metadata`, `/custody-create`

### For Researchers

1. **OSINT**: `/sherlock`, `/company`, `/phone`
2. **Evidence**: `/screenshot`, `/wayback`
3. **Verification**: `/breach`, `/reputation`
4. **Documentation**: Use Canvas for diagrams

---

## 📊 Command Statistics

**Total Commands**: 70+

**By Category:**
- System: 11 commands
- Diagnostics: 1 command (+ auto features)
- Reconnaissance: 20 commands
- Intelligence: 10 commands
- Forensics: 10 commands
- Malware: 15 commands
- Crypto: 2 commands
- Misc: 5+ commands
- Easter Eggs: 6+

**API Keys Required:** ~8 commands (most work without keys!)

---

## 🔍 Finding the Right Command

### By Goal

**"I want to investigate a domain"**
→ Reconnaissance: `/whois`, `/dns`, `/subdomains`, `/certs`

**"I need to check if a URL is safe"**
→ Intelligence: `/scan`, `/reputation`, `/screenshot`

**"I'm analyzing a suspicious file"**
→ Forensics: `/hash`, `/metadata`, `/strings`
→ Malware: `/malware-hash`, `/malware-strings`, `/ioc-extract`

**"I want to find information about a person"**
→ Intelligence: `/sherlock`, `/breach`, `/phone`

**"I need to track cryptocurrency"**
→ Crypto: `/crypto`, `/wallet`

**"I want to have fun"**
→ Misc: `/chuck`, `/joke`, `/bible`, `/deathstar`

**"I need to manage RangerPlex"**
→ System: `/settings`, `/restart`, `/check update`

---

## 💡 Pro Tips

1. **Type `/help` in chat** for interactive command list
2. **Use Tab key** for command auto-complete (coming soon)
3. **Chain commands** for comprehensive investigations
4. **Save findings** to Notes app
5. **Check requirements** before running (API keys, nmap installation, etc.)

---

## ⚠️ Important Notes

### Authorization Required
Commands like `/nmap`, `/ports`, `/shodan` require authorization:
- ✅ Your own infrastructure
- ✅ Authorized pen tests
- ✅ CTF/TryHackMe boxes
- ❌ Unauthorized third-party systems

### API Keys
Some commands require API keys (add in Settings → Providers):
- Shodan API
- VirusTotal API
- IPInfo token
- IPQualityScore API
- NumVerify API
- Google Safe Browsing API

### Privacy
- Bitcoin blockchain is public (all transactions visible)
- WHOIS may reveal registrant info
- Respect privacy laws (GDPR, CCPA)
- Use ethically and legally

---

## 📚 Additional Resources

### Built-in Help
- **Chat**: Type `/help` for full command list
- **Manual**: Type `/manual` for in-app guide
- **About**: Type `/about` for platform info

### External Resources
- **Main README**: `/Users/ranger/rangerplex-ai/README.md`
- **Changelog**: See README for version history
- **GitHub**: https://github.com/davidtkeane/rangerplex-ai

### Training Materials
- **OSINT Framework**: https://osintframework.com
- **TryHackMe**: Practice with `/nmap` on CTF boxes
- **Forensics Guide**: Read forensics COMMAND_REFERENCE.md

---

## 🎖️ Command Mastery Levels

### Beginner (0-10 commands used)
**Focus**: System, Fun, Basic OSINT
- `/help`, `/about`, `/settings`
- `/chuck`, `/joke`
- `/myip`, `/crypto`

### Intermediate (10-30 commands)
**Focus**: Reconnaissance, Intelligence
- `/whois`, `/dns`, `/subdomains`
- `/sherlock`, `/breach`
- `/scan`, `/screenshot`

### Advanced (30-50 commands)
**Focus**: Forensics, Malware, Advanced Recon
- `/nmap`, `/shodan`
- `/hash`, `/metadata`, `/custody-create`
- `/malware-*` commands

### Expert (50+ commands)
**Focus**: All categories, chaining, automation
- Full command mastery
- Command chaining workflows
- Custom investigations

---

## 🔄 Keeping Documentation Updated

**Last Updated**: November 28, 2024
**RangerPlex Version**: v2.7.6

**New commands added regularly!**
- Check `/help` for latest additions
- Star GitHub repo for update notifications
- Type `/check update` to see if new features available

---

## 💬 Feedback & Contributions

**Found a bug?** Report on GitHub
**Missing documentation?** Request via GitHub issues
**Want to contribute?** Submit pull requests
**Need help?** Ask in chat with `/help`

---

**Built with ❤️ by David Keane (IrishRanger) | iCanHelp Ltd**
*Transforming disabilities into superpowers - helping 1.3 billion people worldwide.*

🎖️ **Rangers lead the way!**
