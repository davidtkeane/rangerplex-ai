#!/bin/bash

################################################################################
# HTB RECON - HackTheBox Penetration Testing Enumeration Script
# Created by: Ranger & David (IrishRanger IR240474)
# Purpose: Automated reconnaissance for HackTheBox machines
# Usage: ./htb-recon.sh <target_ip> [target_name]
################################################################################

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Banner
echo -e "${CYAN}"
cat << "EOF"
╦ ╦╔╦╗╔╗   ╦═╗╔═╗╔═╗╔═╗╔╗╔
╠═╣ ║ ╠╩╗  ╠╦╝║╣ ║  ║ ║║║║
╩ ╩ ╩ ╚═╝  ╩╚═╚═╝╚═╝╚═╝╝╚╝
Rangers Lead The Way! 🎖️
EOF
echo -e "${NC}"

# Check arguments
if [ -z "$1" ]; then
    echo -e "${RED}[!] Usage: $0 <target_ip> [target_name]${NC}"
    echo -e "${YELLOW}[*] Example: $0 10.10.10.123 mymachine${NC}"
    exit 1
fi

TARGET_IP="$1"
TARGET_NAME="${2:-htb-target}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
OUTPUT_DIR="./htb-results/${TARGET_NAME}_${TIMESTAMP}"

# Create output directory
mkdir -p "$OUTPUT_DIR"

echo -e "${GREEN}[+] Target IP: ${TARGET_IP}${NC}"
echo -e "${GREEN}[+] Target Name: ${TARGET_NAME}${NC}"
echo -e "${GREEN}[+] Output Directory: ${OUTPUT_DIR}${NC}"
echo -e "${BLUE}[*] Starting reconnaissance at $(date)${NC}\n"

# Log everything
exec > >(tee -a "${OUTPUT_DIR}/full_scan.log")
exec 2>&1

################################################################################
# PHASE 1: PING CHECK
################################################################################
echo -e "${PURPLE}═══════════════════════════════════════════════════════${NC}"
echo -e "${PURPLE}[PHASE 1] PING CHECK${NC}"
echo -e "${PURPLE}═══════════════════════════════════════════════════════${NC}"

if ping -c 1 -W 2 "$TARGET_IP" &> /dev/null; then
    TTL=$(ping -c 1 "$TARGET_IP" | grep ttl | awk -F'ttl=' '{print $2}' | awk '{print $1}')
    echo -e "${GREEN}[+] Host is UP (TTL: $TTL)${NC}"

    # Guess OS based on TTL
    if [ "$TTL" -le 64 ]; then
        echo -e "${CYAN}[*] Likely OS: Linux/Unix${NC}"
    elif [ "$TTL" -le 128 ]; then
        echo -e "${CYAN}[*] Likely OS: Windows${NC}"
    else
        echo -e "${CYAN}[*] Likely OS: Unknown (TTL: $TTL)${NC}"
    fi
else
    echo -e "${YELLOW}[!] Host might be down or ICMP is blocked${NC}"
fi
echo ""

################################################################################
# PHASE 2: QUICK PORT SCAN (Top 1000)
################################################################################
echo -e "${PURPLE}═══════════════════════════════════════════════════════${NC}"
echo -e "${PURPLE}[PHASE 2] QUICK PORT SCAN (Top 1000 Ports)${NC}"
echo -e "${PURPLE}═══════════════════════════════════════════════════════${NC}"

nmap -T4 -p- --min-rate=1000 "$TARGET_IP" -oN "${OUTPUT_DIR}/quick_scan.txt" | tee "${OUTPUT_DIR}/quick_scan_live.txt"

# Extract open ports
OPEN_PORTS=$(grep "^[0-9]" "${OUTPUT_DIR}/quick_scan.txt" | grep "open" | awk -F'/' '{print $1}' | paste -sd "," -)

if [ -z "$OPEN_PORTS" ]; then
    echo -e "${RED}[!] No open ports found. Exiting.${NC}"
    exit 1
fi

echo -e "${GREEN}[+] Open Ports: ${OPEN_PORTS}${NC}\n"

################################################################################
# PHASE 3: DETAILED SERVICE SCAN
################################################################################
echo -e "${PURPLE}═══════════════════════════════════════════════════════${NC}"
echo -e "${PURPLE}[PHASE 3] DETAILED SERVICE & VERSION DETECTION${NC}"
echo -e "${PURPLE}═══════════════════════════════════════════════════════${NC}"

nmap -sV -sC -A -p"$OPEN_PORTS" "$TARGET_IP" \
    -oN "${OUTPUT_DIR}/detailed_scan.txt" \
    -oX "${OUTPUT_DIR}/detailed_scan.xml" \
    --script=banner,http-title,http-headers,ssl-cert,smb-os-discovery | tee "${OUTPUT_DIR}/detailed_scan_live.txt"

echo ""

################################################################################
# PHASE 4: UDP SCAN (Top 20)
################################################################################
echo -e "${PURPLE}═══════════════════════════════════════════════════════${NC}"
echo -e "${PURPLE}[PHASE 4] UDP SCAN (Top 20 Ports)${NC}"
echo -e "${PURPLE}═══════════════════════════════════════════════════════${NC}"

sudo nmap -sU --top-ports 20 "$TARGET_IP" -oN "${OUTPUT_DIR}/udp_scan.txt" | tee "${OUTPUT_DIR}/udp_scan_live.txt"
echo ""

################################################################################
# PHASE 5: WEB ENUMERATION (if HTTP/HTTPS found)
################################################################################
if echo "$OPEN_PORTS" | grep -qE "(80|443|8080|8443)"; then
    echo -e "${PURPLE}═══════════════════════════════════════════════════════${NC}"
    echo -e "${PURPLE}[PHASE 5] WEB ENUMERATION${NC}"
    echo -e "${PURPLE}═══════════════════════════════════════════════════════${NC}"

    # Detect HTTP ports
    for PORT in $(echo "$OPEN_PORTS" | tr ',' '\n'); do
        if [[ "$PORT" == "80" || "$PORT" == "8080" ]]; then
            PROTOCOL="http"
        elif [[ "$PORT" == "443" || "$PORT" == "8443" ]]; then
            PROTOCOL="https"
        else
            continue
        fi

        URL="${PROTOCOL}://${TARGET_IP}:${PORT}"
        echo -e "${CYAN}[*] Enumerating: $URL${NC}"

        # Check if gobuster exists
        if command -v gobuster &> /dev/null; then
            echo -e "${YELLOW}[*] Running gobuster directory brute force...${NC}"
            gobuster dir -u "$URL" \
                -w /usr/share/wordlists/dirb/common.txt \
                -t 50 \
                -o "${OUTPUT_DIR}/gobuster_${PORT}.txt" \
                --no-error 2>&1 | tee "${OUTPUT_DIR}/gobuster_${PORT}_live.txt"
        else
            echo -e "${YELLOW}[!] gobuster not found. Install with: sudo apt install gobuster${NC}"
        fi

        # Check if nikto exists
        if command -v nikto &> /dev/null; then
            echo -e "${YELLOW}[*] Running nikto vulnerability scan...${NC}"
            nikto -h "$URL" -o "${OUTPUT_DIR}/nikto_${PORT}.txt" 2>&1 | tee "${OUTPUT_DIR}/nikto_${PORT}_live.txt"
        else
            echo -e "${YELLOW}[!] nikto not found. Install with: sudo apt install nikto${NC}"
        fi

        # Whatweb
        if command -v whatweb &> /dev/null; then
            echo -e "${YELLOW}[*] Running whatweb...${NC}"
            whatweb "$URL" -v | tee "${OUTPUT_DIR}/whatweb_${PORT}.txt"
        fi

        echo ""
    done
fi

################################################################################
# PHASE 6: SMB ENUMERATION (if port 445 found)
################################################################################
if echo "$OPEN_PORTS" | grep -q "445"; then
    echo -e "${PURPLE}═══════════════════════════════════════════════════════${NC}"
    echo -e "${PURPLE}[PHASE 6] SMB ENUMERATION${NC}"
    echo -e "${PURPLE}═══════════════════════════════════════════════════════${NC}"

    # SMB enumeration scripts
    echo -e "${YELLOW}[*] Running SMB enumeration scripts...${NC}"
    nmap -p445 --script=smb-enum-shares,smb-enum-users,smb-vuln* "$TARGET_IP" \
        -oN "${OUTPUT_DIR}/smb_enum.txt" | tee "${OUTPUT_DIR}/smb_enum_live.txt"

    # enum4linux if available
    if command -v enum4linux &> /dev/null; then
        echo -e "${YELLOW}[*] Running enum4linux...${NC}"
        enum4linux -a "$TARGET_IP" | tee "${OUTPUT_DIR}/enum4linux.txt"
    fi

    # smbclient
    if command -v smbclient &> /dev/null; then
        echo -e "${YELLOW}[*] Listing SMB shares...${NC}"
        smbclient -L "//${TARGET_IP}" -N | tee "${OUTPUT_DIR}/smb_shares.txt"
    fi
    echo ""
fi

################################################################################
# PHASE 7: VULNERABILITY SCAN
################################################################################
echo -e "${PURPLE}═══════════════════════════════════════════════════════${NC}"
echo -e "${PURPLE}[PHASE 7] VULNERABILITY SCAN${NC}"
echo -e "${PURPLE}═══════════════════════════════════════════════════════${NC}"

nmap -p"$OPEN_PORTS" --script vuln "$TARGET_IP" \
    -oN "${OUTPUT_DIR}/vuln_scan.txt" | tee "${OUTPUT_DIR}/vuln_scan_live.txt"
echo ""

################################################################################
# PHASE 8: GENERATE SUMMARY REPORT
################################################################################
echo -e "${PURPLE}═══════════════════════════════════════════════════════${NC}"
echo -e "${PURPLE}[PHASE 8] GENERATING SUMMARY REPORT${NC}"
echo -e "${PURPLE}═══════════════════════════════════════════════════════${NC}"

REPORT="${OUTPUT_DIR}/SUMMARY_REPORT.txt"

cat > "$REPORT" << EOF
╔══════════════════════════════════════════════════════════════╗
║         HTB RECON SUMMARY REPORT                             ║
║         Rangers Lead The Way! 🎖️                            ║
╚══════════════════════════════════════════════════════════════╝

Target IP:          ${TARGET_IP}
Target Name:        ${TARGET_NAME}
Scan Date:          $(date)
Output Directory:   ${OUTPUT_DIR}

─────────────────────────────────────────────────────────────
OPEN PORTS:
─────────────────────────────────────────────────────────────
${OPEN_PORTS}

─────────────────────────────────────────────────────────────
DETAILED PORT INFORMATION:
─────────────────────────────────────────────────────────────
EOF

grep "^[0-9]" "${OUTPUT_DIR}/detailed_scan.txt" | grep "open" >> "$REPORT"

cat >> "$REPORT" << EOF

─────────────────────────────────────────────────────────────
POTENTIAL ATTACK VECTORS:
─────────────────────────────────────────────────────────────
EOF

# Analyze and suggest attack vectors
if grep -q "21/tcp.*ftp" "${OUTPUT_DIR}/detailed_scan.txt"; then
    echo "• FTP Service (Port 21) - Check for anonymous login" >> "$REPORT"
fi

if grep -q "22/tcp.*ssh" "${OUTPUT_DIR}/detailed_scan.txt"; then
    echo "• SSH Service (Port 22) - Brute force, check for weak credentials" >> "$REPORT"
fi

if grep -q "80/tcp\|443/tcp\|8080/tcp" "${OUTPUT_DIR}/detailed_scan.txt"; then
    echo "• HTTP/HTTPS - Web application vulnerabilities, directory traversal" >> "$REPORT"
fi

if grep -q "445/tcp.*smb" "${OUTPUT_DIR}/detailed_scan.txt"; then
    echo "• SMB Service (Port 445) - Check for EternalBlue, SMB exploits" >> "$REPORT"
fi

if grep -q "3306/tcp.*mysql" "${OUTPUT_DIR}/detailed_scan.txt"; then
    echo "• MySQL Service (Port 3306) - SQL injection, credential brute force" >> "$REPORT"
fi

if grep -q "1433/tcp.*ms-sql" "${OUTPUT_DIR}/detailed_scan.txt"; then
    echo "• MSSQL Service (Port 1433) - xp_cmdshell exploitation" >> "$REPORT"
fi

cat >> "$REPORT" << EOF

─────────────────────────────────────────────────────────────
FILES GENERATED:
─────────────────────────────────────────────────────────────
EOF

ls -lh "$OUTPUT_DIR" | tail -n +2 >> "$REPORT"

cat >> "$REPORT" << EOF

─────────────────────────────────────────────────────────────
NEXT STEPS:
─────────────────────────────────────────────────────────────
1. Review detailed_scan.txt for service versions
2. Check vuln_scan.txt for known vulnerabilities
3. Enumerate web applications (gobuster results)
4. Test discovered services for default credentials
5. Search for exploits using searchsploit
6. Check for CVEs related to detected versions

╔══════════════════════════════════════════════════════════════╗
║  "Ah well, KEEP FIRING!!!" - David's Combat Motto            ║
║  Rangers lead the way! 🎖️                                   ║
╚══════════════════════════════════════════════════════════════╝
EOF

cat "$REPORT"

################################################################################
# COMPLETION
################################################################################
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  RECONNAISSANCE COMPLETE!                                    ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo -e "${CYAN}[+] All results saved to: ${OUTPUT_DIR}${NC}"
echo -e "${CYAN}[+] Summary report: ${REPORT}${NC}"
echo -e "${YELLOW}[*] Review the summary report and detailed scans${NC}"
echo -e "${YELLOW}[*] Use searchsploit to find exploits for discovered services${NC}"
echo -e "${GREEN}[+] Happy Hacking! Rangers lead the way! 🎖️${NC}\n"
