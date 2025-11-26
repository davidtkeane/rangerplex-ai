# 🕵️ RangerPlex OSINT & Recon Plan

## ✅ Phase 1: Domain Recon (Whois & DNS)
**Status:** Completed
*   **Tools:** `/whois`, `/dns`
*   **Tech:** Native Node.js `dns` & RDAP protocol.

## ✅ Phase 2: Infrastructure Intel (Shodan)
**Status:** Completed
*   **Tools:** `/shodan`
*   **Tech:** Shodan API (Host/IP lookup).

## ✅ Phase 3: Identity Defense (HIBP)
**Status:** Completed
*   **Tools:** `/breach`
*   **Tech:** Have I Been Pwned API.

## ✅ Phase 4: Site Auditor (SSL & Headers)
**Status:** Completed
*   **Tools:** `/ssl`, `/headers`
*   **Tech:** Native Node.js `https` & `tls`.

## ✅ Phase 5: The Profiler (Automated Agent)
**Status:** Completed
*   **Tools:** `/profile`
*   **Tech:** AI Agent (Gemini/Claude) + Multi-tool orchestration.

## ✅ Phase 6: Social Recon (Sherlock)
**Status:** Completed
*   **Tools:** `/sherlock`
*   **Tech:** Multi-platform username scanner with "Entrapment Filter" (False Positive detection).

---

## 🚀 Phase 7: Digital Forensics (Proposed)
**Objective:** Analyze files and hidden metadata.
*   **Tool:** **Metadata Extractor** (Auto-run on file upload)
*   **Command:** `/exif` or automatic.
*   **Logic:** Extract EXIF data (GPS, Camera Model, Software) from images and PDF metadata (Author, Creator) using client-side libraries.

## ✅ Phase 7: Financial Intelligence (Crypto)
**Status:** Completed
*   **Tools:** `/crypto`, `/wallet`
*   **Tech:** CoinGecko API & BlockCypher API.

---

## ✅ Phase 8: Digital Forensics
**Status:** Completed
*   **Tools:** `/exif`
*   **Tech:** `exif-parser` library for metadata extraction.

## ✅ Phase 9: Geolocation Intel
**Status:** Completed
*   **Tools:** `/geoip`
*   **Tech:** ip-api.com (Free, no API key required).

## ✅ Phase 10: Hardware Recon
**Status:** Completed
*   **Tools:** `/mac`, `/sys`
*   **Tech:** macvendors.com API + Node.js `os` module.

## ✅ Phase 11: Comms Intel
**Status:** Completed
*   **Tools:** `/phone`
*   **Tech:** NumVerify API with monthly counter (100 requests/month).

---

## ✅ Phase 12: Subdomain Enumeration
**Status:** Completed
*   **Tool:** **Subdomain Scanner**
*   **Command:** `/subdomains <domain>`
*   **Tech:** Certificate Transparency (crt.sh API)
*   **Value:** Discover hidden infrastructure (api.example.com, admin.example.com)
*   **Priority:** HIGH ⭐

## ✅ Phase 13: Reverse DNS
**Status:** Completed
*   **Tool:** **Reverse DNS Lookup**
*   **Command:** `/reverse <ip>`
*   **Tech:** HackerTarget Free API (no API key required)
*   **Value:** Find related sites on same infrastructure, identify shared/dedicated hosting

## ✅ Phase 14: Domain Reputation
**Status:** Completed
*   **Tool:** **Domain Reputation Checker**
*   **Command:** `/reputation <domain>`
*   **Tech:** Google Safe Browsing API v4
*   **Value:** Identify malicious/compromised domains (malware, phishing, unwanted software)
*   **Priority:** HIGH ⭐

## ✅ Phase 15: Email Intelligence
**Status:** Completed
*   **Tool:** **Email Validator**
*   **Command:** `/email <email>`
*   **Tech:** SMTP validation, disposable email detection
*   **Value:** Verify email existence, detect fake accounts
*   **Priority:** MEDIUM ⭐

## ✅ Phase 16: Wayback Machine
**Status:** Completed
*   **Tool:** **Internet Archive Lookup**
*   **Command:** `/wayback <url>`
*   **Tech:** Internet Archive Availability API + CDX API
*   **Value:** Find deleted content, old versions, evidence
*   **Priority:** HIGH ⭐

## ✅ Phase 17: Screenshot Capture
**Status:** Completed
*   **Tool:** **Screenshot Generator**
*   **Command:** `/screenshot <url>`
*   **Tech:** Puppeteer (headless Chrome)
*   **Value:** Documentation, evidence collection, visual reconnaissance
*   **Features:** 1920x1080 resolution, full-page or viewport capture, stealth mode with real browser user agent, page metadata extraction

## ✅ Phase 18: Certificate Transparency
**Status:** Completed
*   **Tool:** **Certificate Scanner**
*   **Command:** `/certs <domain>`
*   **Tech:** crt.sh, Certificate Transparency logs
*   **Value:** Discover hidden subdomains, track certificates

## ✅ Phase 19: Hash Lookup
**Status:** Completed
*   **Tool:** **Hash Analyzer**
*   **Command:** `/hash <hash>`
*   **Tech:** VirusTotal API
*   **Value:** Identify malware by signature

## ✅ Phase 20: Port Scanner
**Status:** Completed
*   **Tool:** **Port Scanner**
*   **Command:** `/ports <ip_or_host> [ports]`
*   **Tech:** Native Node.js `net` module, TCP connect scans
*   **Value:** Service identification, security audits, exposed service detection
*   **Features:** 40 default common ports, custom port lists (up to 100), service identification (28 services), security insights, latency measurement
*   **⚠️ WARNING:** Requires authorization - illegal without permission!

## 🚀 Phase 21: Pastebin Search (Planned)
**Objective:** Search paste sites for leaked data.
*   **Tool:** **Paste Searcher**
*   **Command:** `/paste <keyword>`
*   **Tech:** Pastebin API, PastebinArchive
*   **Value:** Find leaked credentials, exposed secrets

## 🚀 Phase 22: GitHub Recon (Planned)
**Objective:** Scan GitHub for exposed secrets.
*   **Tool:** **GitHub Scout**
*   **Command:** `/github <username>`
*   **Tech:** GitHub API, regex secret scanning
*   **Value:** Find repos, leaked API keys, contributions

## 🚀 Phase 23: Company Intelligence (Planned)
**Objective:** Lookup company registration data and officers.
*   **Tool:** **Company Lookup**
*   **Command:** `/company <name|reg_number> [country]`
*   **Tech:** Companies House API (UK) primary; OpenCorporates fallback for multi-country coverage
*   **Returns:** legal name, registration number, status (active/dissolved), incorporation date, registered address, SIC codes/industry tags, officers (active), people with significant control, last filing date
*   **Notes:** requires API key(s); cache responses for rate limits; normalize country input (e.g., `uk`, `us-de`, `ie`); clearly flag when data is partial or sourced from fallback
*   **Example:** `/company "Acme Widgets Ltd" uk` → Returns registration info, active officers, PSCs, address, and last filing date (labels fallback vs primary data)

## ✅ Phase 24: Traceroute
**Status:** Completed
*   **Tool:** **Network Tracer**
*   **Command:** `/trace <domain/ip>`
*   **Tech:** Native traceroute CLI (UDP/ICMP), 20-hop limit, single probe per hop
*   **Value:** Identify ISPs, routing path, filtered hops/timeouts
*   **Notes:** Mid-path timeouts are common; final hop may still respond

## ✅ Phase 25: ASN Lookup
**Status:** Completed
*   **Tool:** **ASN Scanner**
*   **Command:** `/asn <asn_number or ip>`
*   **Tech:** HackerTarget ASN Lookup API (free, no key required)
*   **Value:** Find IP ranges owned by organization, network research, infrastructure mapping
*   **Features:** Accepts ASN numbers (AS15169) or IP addresses, returns CIDR blocks, organization info, country/registry data, allocation dates

## ✅ Phase 26: Privacy Snapshot
**Status:** Completed
*   **Tool:** **Privacy Snapshot**
*   **Command:** `/privacy`
*   **Tech:** ipify (public IP), ip-api.com (ISP/ASN/geo), request header echo from proxy
*   **Returns:** Public IP, ISP/Org/ASN, country/region/city/zip/timezone, and request headers (User-Agent, Accept-Language, DNT, Referer, client hints, X-Forwarded-For)
*   **Value:** Shows what a site learns on first request; helpful for VPN/proxy validation and header/privacy hardening

---

## 🎯 IMPLEMENTATION PRIORITY

**Top 5 (Start Here):**
1. ⭐⭐⭐ Phase 21: `/paste` - Medium + High Value
2. ⭐⭐⭐ Phase 22: `/github` - Medium + High Value
3. ⭐⭐ Phase 23: `/company` - Medium + Medium Value
4. ⭐⭐ Phase 25: `/asn` - Medium + Medium Value

**Legal Considerations:**
- Phase 20 (`/ports`) requires authorization
- All tools should respect rate limits and ToS
- GDPR compliance for EU data collection

---

## 📊 OSINT ARSENAL STATUS

**Completed:** 22 tools
**Planned:** 4 tools
**Total Arsenal:** 26 OSINT tools 🎖️
**Completion Rate:** 85% 🎯

**✨ Latest Additions:**
- Phase 26: Privacy Snapshot (`/privacy`) - Deployed! 🔍
- Phase 25: ASN Lookup (`/asn`) - Deployed! 🌐
- Phase 24: Traceroute (`/trace`) - Deployed! 🛤️
