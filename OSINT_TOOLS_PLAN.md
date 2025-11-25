# 🕵️ RangerPlex OSINT & Recon Plan

## Phase 1: Domain Recon (Whois & DNS)
**Objective:** Implement tools to gather domain ownership and infrastructure data without external paid APIs.

### 1. Backend (`proxy_server.js`)
We will add two new endpoints using built-in Node.js modules and open standards. No new npm packages required.

*   **Endpoint:** `/api/tools/dns`
    *   **Method:** `POST`
    *   **Input:** `{ domain: string }`
    *   **Logic:** Use Node.js native `dns` module to resolve:
        *   **A / AAAA**: IP Addresses
        *   **MX**: Mail Servers
        *   **TXT**: Verification records (SPF, etc.)
        *   **NS**: Name Servers
    *   **Output:** JSON object with records.

*   **Endpoint:** `/api/tools/whois`
    *   **Method:** `POST`
    *   **Input:** `{ domain: string }`
    *   **Logic:** Proxy request to **RDAP** (Registration Data Access Protocol), the modern JSON replacement for WHOIS.
    *   **Source:** `https://rdap.org/domain/<domain>` (Redirects to authoritative registrar).
    *   **Output:** Parsed JSON with Registrar, Dates (Created/Expires), and Status.

### 2. Frontend (`ChatInterface.tsx`)
Add slash commands to trigger these tools.

*   **Command:** `/dns <domain>`
    *   Fetches DNS records.
    *   Displays a technical table of IPs, Mail Servers, and TXT records.

*   **Command:** `/whois <domain>`
    *   Fetches Registration Data (RDAP).
    *   Displays "Identity Card" style output:
        *   🏢 **Registrar:** GoDaddy, Namecheap, etc.
        *   📅 **Age:** Creation Date & Expiry.
        *   🔒 **Status:** ClientTransferProhibited, etc.
        *   📧 **Abuse Contact:** Email for reporting issues.

### 3. Future Phases (To Be Decided)
*   **Phase 2:** Shodan Integration (`/shodan`) - Requires API Key.
*   **Phase 3:** Breach Check (`/breach`) - Requires HIBP API Key.
*   **Phase 4:** SSL/Headers Audit (`/audit`) - Custom Node.js logic.

## Execution Steps
1.  [ ] Update `proxy_server.js` with DNS and RDAP endpoints.
2.  [ ] Update `ChatInterface.tsx` with `/dns` and `/whois` commands.
3.  [ ] Test with `google.com` and `rangerplex.com`.
