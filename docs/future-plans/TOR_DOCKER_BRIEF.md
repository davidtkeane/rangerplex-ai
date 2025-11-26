# 🧅 Project Nightshade: Tor Hidden Service Integration Brief

**Date:** November 26, 2025
**Classification:** RANGER EYES ONLY
**Status:** PROPOSED

## 1. Objective
To provide RangerPlex users with the capability to host a Tor Hidden Service (Onion Site) directly from their local machine using Docker. This allows for secure, anonymous hosting of content (like the "ForgiveMe" site) without exposing the user's real IP address.

## 2. Architecture
We will utilize a "Sidecar" container pattern. The main application container (`rangerplex`) remains unchanged. A separate `tor` container is added to the network to handle the Tor protocol and route traffic to the application.

### Components:
1.  **Application Container**: The standard RangerPlex app (or any web server) running on port 5173/3010.
2.  **Tor Container**: Runs the Tor daemon, generates the `.onion` address, and proxies incoming traffic from the Tor network to the Application Container.

## 3. Implementation Plan

### A. Docker Compose Configuration
We will create a dedicated `docker-compose.tor.yml` (or add to the main compose file) to spin up the Tor service.

```yaml
version: '3'
services:
  # The Web Application
  rangerplex:
    image: rangerplex-ai:latest
    networks:
      - darknet
    restart: always

  # The Tor Sidecar
  tor:
    image: goldy/tor-hidden-service
    container_name: rangerplex-tor
    links:
      - rangerplex
    environment:
      # Map Onion Port 80 -> RangerPlex Port 5173 (Frontend)
      RANGERPLEX_TOR_SERVICE_HOSTS: "80:rangerplex:5173"
    volumes:
      # Persist keys to keep the same .onion address across restarts
      - ./tor-keys:/var/lib/tor/hidden_service/
    networks:
      - darknet
    depends_on:
      - rangerplex

networks:
  darknet:
```

### B. Key Management
*   **Persistence**: The `./tor-keys` directory will store the private key (`private_key`) and the hostname (`hostname`).
*   **Security**: This directory must be added to `.gitignore` to prevent leaking the private key to public repositories.

### C. Usage
1.  **Start the Service**:
    ```bash
    docker-compose -f docker-compose.tor.yml up -d
    ```
2.  **Retrieve Onion Address**:
    ```bash
    cat tor-keys/hostname
    ```
3.  **Access**: Open Tor Browser and navigate to the generated `.onion` address.

## 4. Security Considerations
*   **Root Privileges**: Ensure the application container runs as a non-root user if possible to minimize impact if compromised.
*   **Information Leakage**: The application should be audited to ensure it doesn't leak local IP addresses or timezones in headers/metadata.
*   **Firewall**: No inbound ports need to be opened on the host router. Tor works via outbound connections.

## 5. Next Steps
1.  Create `docker-compose.tor.yml`.
2.  Test connection with Tor Browser.
3.  Add a "Go Dark" button in the RangerPlex console to auto-deploy this stack.
