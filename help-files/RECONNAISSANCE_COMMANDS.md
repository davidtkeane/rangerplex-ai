# 🔍 Reconnaissance Command Reference

This document provides a comprehensive guide to reconnaissance and OSINT (Open-Source Intelligence) tools available in RangerPlex. These commands help you gather information about domains, IPs, networks, and infrastructure.

---

## 📡 Domain Intelligence

### `/whois <domain>`
Retrieves WHOIS registration information for a domain.
- **Shows**: Registrar, creation date, expiry date, nameservers, registrant info
- **No API Key Required**
- **Example**: `/whois google.com`

**Use Cases:**
- Domain ownership verification
- Expiry date monitoring
- Registrar identification
- Historical ownership tracking

---

### `/dns <domain>`
Fetches DNS records for a domain.
- **Records**: A, AAAA, MX, NS, TXT, CNAME, SOA
- **No API Key Required**
- **Example**: `/dns anthropic.com`

**Use Cases:**
- Email server configuration (MX records)
- Nameserver identification (NS records)
- Domain verification (TXT records)
- IP address resolution (A/AAAA records)

---

### `/subdomains <domain>`
Discovers subdomains via Certificate Transparency logs.
- **Source**: crt.sh database
- **No API Key Required**
- **Shows**: All discovered subdomains
- **Example**: `/subdomains example.com`

**Use Cases:**
- Attack surface mapping
- Infrastructure discovery
- Hidden service identification
- Development/staging environment detection

---

### `/certs <domain>`
Enumerates SSL/TLS certificates via Certificate Transparency logs.
- **Shows**: Issuer, subject, valid dates, SANs (Subject Alternative Names)
- **No API Key Required**
- **Example**: `/certs github.com`

**Use Cases:**
- Certificate monitoring
- SSL/TLS configuration audit
- Hidden hostname discovery
- Certificate authority identification

---

### `/reverse <ip>`
Finds all domains hosted on an IP address (reverse DNS lookup).
- **No API Key Required**
- **Shows**: All domains pointing to the IP
- **Example**: `/reverse 8.8.8.8`

**Use Cases:**
- Shared vs dedicated hosting identification
- Co-hosted website discovery
- Virtual host enumeration
- Infrastructure mapping

---

### `/ssl <domain>`
Inspects SSL/TLS certificate for validity, issuer, and expiration.
- **Shows**: Issuer, subject, valid dates, expiry status
- **No API Key Required**
- **Example**: `/ssl www.anthropic.com`

**Use Cases:**
- Certificate expiry monitoring
- SSL configuration validation
- Certificate authority verification
- Security audit

---

### `/headers <url>`
Audits HTTP security headers for vulnerabilities.
- **Checks**: HSTS, CSP, X-Frame-Options, X-Content-Type-Options
- **No API Key Required**
- **Example**: `/headers https://example.com`

**Use Cases:**
- Security header audit
- Clickjacking protection check
- HTTPS enforcement verification
- XSS protection validation

---

### `/reputation <domain>`
Checks domains against Google Safe Browsing for malware/phishing threats.
- **Requires**: Google Safe Browsing API key (Settings → Providers)
- **Protects**: 5+ billion devices
- **Example**: `/reputation suspicious-site.com`

**Use Cases:**
- Malware detection
- Phishing site identification
- URL safety verification
- Threat intelligence

---

## 🌍 IP & Network Intelligence

### `/geoip <ip>`
Locates an IP address geographically.
- **Shows**: City, region, country, ISP, coordinates, timezone
- **No API Key Required**
- **Example**: `/geoip 8.8.8.8`

**Use Cases:**
- IP geolocation
- ISP identification
- Timezone detection
- Attack source tracking

---

### `/ipinfo <ip>`
Advanced IP intelligence with premium data (requires IPInfo token).
- **Shows**: Location, ISP, hostname, postal code
- **Free Fallback**: Uses ip-api.com if no token
- **Premium**: Requires IPInfo token (Settings → Providers)
- **Example**: `/ipinfo 1.1.1.1`

**Use Cases:**
- Detailed IP analysis
- Hostname resolution
- Postal code lookup
- Carrier detection

---

### `/myip`
Displays your public IP address and location.
- **Shows**: Your IP, location, ISP, coordinates
- **No API Key Required**
- **Example**: `/myip`

**Use Cases:**
- VPN/proxy verification
- Public IP detection
- ISP identification
- Location verification

---

### `/iprecon <ip>`
Threat intelligence for IP addresses (VPN/Proxy/Tor detection).
- **Shows**: Risk score, VPN detection, proxy detection, Tor exit node status
- **Requires**: IPQualityScore API key (Settings → Providers)
- **Example**: `/iprecon 192.0.2.1`

**Use Cases:**
- VPN detection
- Proxy identification
- Tor exit node detection
- Fraud prevention
- Bot detection

---

### `/trace <domain/ip>`
Maps network hops via traceroute.
- **Limit**: 20 hops, single probe per hop
- **No API Key Required**
- **Example**: `/trace google.com`

**Use Cases:**
- Network path visualization
- Latency analysis
- Routing troubleshooting
- Infrastructure mapping

---

### `/asn <asn_number or ip>`
Looks up Autonomous System Number (ASN) data.
- **Accepts**: ASN numbers (AS15169) or IP addresses
- **Shows**: All IP ranges owned by organization
- **No API Key Required**
- **Example**: `/asn AS15169` or `/asn 8.8.8.8`

**Use Cases:**
- IP range enumeration
- Organization network mapping
- BGP analysis
- Network ownership verification

---

## 🔌 Port Scanning & Services

### `/ports <ip_or_host> [ports]`
Scans TCP ports for service discovery and security audits.
- **Default**: 40 common ports
- **Custom**: Specify ports (e.g., `80,443,8080`)
- **Requires**: Authorization for target
- **Example**: `/ports 192.168.1.1 80,443,22`

**Common Ports Scanned:**
- 21 (FTP), 22 (SSH), 23 (Telnet), 25 (SMTP)
- 80 (HTTP), 443 (HTTPS), 3306 (MySQL), 3389 (RDP)
- 5432 (PostgreSQL), 6379 (Redis), 8080 (HTTP Alt)

**Use Cases:**
- Service discovery
- Security audit
- Firewall testing
- Open port detection

---

### `/nmap <target> [flags]`
Full-featured Nmap integration for comprehensive port scanning.
- **Requires**: nmap installed (`brew install nmap`)
- **Whitelisted Flags**: `-A`, `-sV`, `-sC`, `-p-`, `-p`, `-Pn`, `-T4`, `-v`
- **Example**: `/nmap 192.168.1.1 -sV -sC`

**Flag Guide:**
- `-A`: Aggressive scan (OS detection, version detection, script scanning)
- `-sV`: Service version detection
- `-sC`: Default script scan
- `-p-`: Scan all 65535 ports
- `-p 80,443`: Scan specific ports
- `-Pn`: Treat host as online (skip ping)
- `-T4`: Faster timing template
- `-v`: Verbose output

**Use Cases:**
- TryHackMe challenges
- CTF competitions
- Penetration testing
- Network auditing
- Service enumeration

**Authorization**: Only use on authorized targets (your network, CTF boxes, pen test engagements)

---

## 📟 Hardware & Device

### `/mac <address>`
Looks up MAC address manufacturer (OUI lookup).
- **Shows**: Manufacturer/vendor name
- **No API Key Required**
- **Example**: `/mac 00:1A:2B:3C:4D:5E`

**Use Cases:**
- Device manufacturer identification
- Network inventory
- Hardware vendor detection
- IoT device identification

---

## 🔍 Privacy & Fingerprinting

### `/privacy`
Shows what information a website can learn on first request.
- **Shows**: Public IP, ISP/ASN, coarse geolocation, timezone, request headers
- **Headers**: User-Agent, Accept-Language, DNT, Referer, Client Hints
- **No API Key Required**
- **Example**: `/privacy`

**Use Cases:**
- VPN/proxy validation
- Header hardening verification
- Fingerprinting awareness
- Privacy audit

**What Sites Can See:**
- Your public IP address
- Your ISP and ASN
- Approximate location (city/region)
- Browser type and version
- Operating system
- Language preferences
- Timezone
- Screen resolution (via JavaScript)
- Installed fonts (via JavaScript)

---

## 💡 Pro Tips

1. **Combine Commands**: Use multiple commands for comprehensive recon
   - Example: `/whois example.com` → `/dns example.com` → `/subdomains example.com`

2. **API Keys**: Add premium API keys in Settings for enhanced data
   - IPInfo: Better geolocation
   - IPQualityScore: Fraud detection
   - Google Safe Browsing: Threat intelligence

3. **Authorization**: Always get permission before scanning targets
   - Your own infrastructure: ✅ Authorized
   - Company network (with permission): ✅ Authorized
   - CTF/TryHackMe boxes: ✅ Authorized
   - Random internet hosts: ❌ Unauthorized

4. **Rate Limiting**: Some services have rate limits
   - Space out requests to avoid hitting limits
   - Use premium API keys for higher limits

5. **Save Results**: Copy important findings to Notes (`/notes`)

---

## ⚠️ Legal & Ethical Notice

**Authorization is REQUIRED**:
- ✅ Your own infrastructure
- ✅ Authorized penetration testing
- ✅ CTF competitions (TryHackMe, HackTheBox)
- ✅ Bug bounty programs (with scope permission)
- ❌ Unauthorized scanning of third-party systems

**Respect Privacy**:
- Don't abuse IP lookup tools for stalking
- Respect data protection laws (GDPR, CCPA)
- Use reconnaissance ethically

**Disclaimer**:
These tools are provided for educational, research, and authorized security testing purposes only. Unauthorized use may violate laws including the Computer Fraud and Abuse Act (CFAA) and similar legislation in other jurisdictions.

---

## 🔐 Security Best Practices

1. **Verify Targets**: Always confirm you have authorization
2. **Document Permission**: Keep written authorization for pen tests
3. **Use VPN**: Consider VPN for privacy during recon
4. **Rate Limiting**: Respect service rate limits
5. **Data Handling**: Securely store and dispose of collected data

---

## 📚 Related Documentation

- **System Commands**: See `help-files/SYSTEM_COMMANDS.md`
- **Forensics**: See `help-files/forensics/COMMAND_REFERENCE.md`
- **Intelligence**: See `help-files/INTELLIGENCE_COMMANDS.md`
- **Main Manual**: Type `/manual` in chat

---

**Built with ❤️ by David Keane (IrishRanger) | iCanHelp Ltd**
*Transforming disabilities into superpowers - helping 1.3 billion people worldwide.*

🎖️ **Rangers lead the way!**
