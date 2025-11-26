# 📟 Ranger Console: AI-Augmented Terminal Integration Plan

## 1. The Concept
We will build **"Ranger Console"**: a real, fully functional terminal embedded directly inside the RangerPlex UI, paired with an AI Copilot.

**The Vision:**
*   **Bottom Pane:** A real `zsh` or `bash` terminal running on your system (or inside the Docker container).
*   **Top/Side Pane:** The Ranger AI chat.
*   **The Link:** You encounter an error in the terminal -> You ask Ranger "What does this error mean?" -> Ranger analyzes it and suggests a fix -> You click "Run" to execute it.

## 2. The Architecture

The browser cannot run shell commands directly. We need a bridge.

```mermaid
graph TD
    A[User Browser] <-->|xterm.js UI| B(React Frontend)
    B <-->|WebSocket Connection| C(Node.js Backend)
    C <-->|node-pty| D[System Shell (zsh/bash)]
    D <-->|StdIO| E[OS / Docker Container]
```

### Key Technologies
1.  **Frontend (The Look):**
    *   **`xterm.js`**: The industry-standard library for web-based terminals (used by VS Code).
    *   **`xterm-addon-fit`**: To make it resize perfectly.
    *   **`xterm-addon-web-links`**: To make URLs clickable.

2.  **Backend (The Brain):**
    *   **`node-pty`**: A Node.js library that forks a process (like `zsh`) and lets us control it like a real terminal (handling colors, resizing, Ctrl+C, etc.).
    *   **`ws` (WebSocket)**: To stream keystrokes and output in real-time with low latency.

## 3. Implementation Steps

### Phase 1: Backend (The Engine)
1.  **Install Dependencies:**
    *   `npm install node-pty` (Note: This requires python/make to build, which can be tricky on some Windows setups, but works great on Mac/Linux/Docker).
2.  **Update `proxy_server.js`:**
    *   Set up a new WebSocket route (e.g., `wss://localhost:3010/terminal`).
    *   When a client connects:
        *   Spawn a shell (`process.env.SHELL` or `bash`).
        *   Pipe data: `socket.on('message')` -> `pty.write()`.
        *   Pipe data: `pty.on('data')` -> `socket.send()`.
    *   Handle resizing events (so the text wraps correctly).

### Phase 2: Frontend (The Interface)
1.  **Install Dependencies:**
    *   `npm install xterm xterm-addon-fit xterm-addon-web-links`
2.  **Create `components/Terminal/RangerTerminal.tsx`:**
    *   Initialize `xterm.js`.
    *   Connect to the WebSocket.
    *   Handle styling (Matrix theme, neon fonts).
3.  **Update `App.tsx`:**
    *   Add a toggle button (e.g., "Toggle Console" or `Cmd+J`).
    *   Create a collapsible bottom panel for the terminal.

### Phase 3: The "AI Link" (The Magic)
This is where we bring them together.
1.  **"Read Terminal" Context:**
    *   Add a button in Chat: "Analyze Terminal Output".
    *   When clicked, we grab the current buffer from `xterm` and feed it into the AI context.
    *   User prompt: "I'm getting this error, help!" -> AI sees the error text.
2.  **"Paste to Terminal" Action:**
    *   When the AI generates a code block (e.g., `npm install react`), add a "Run in Terminal" button next to the "Copy" button.
    *   Clicking it sends the text directly to the WebSocket.

## 4. Security Considerations 🔒
*   **Power:** This gives the web interface full control over the user's shell.
*   **Risk:** If the user exposes port 3010 to the internet, anyone could control their computer.
*   **Mitigation:**
    *   **Localhost Only:** Ensure the server binds to `127.0.0.1` by default unless explicitly overridden.
    *   **Docker Safety:** When running in Docker, the terminal is sandboxed inside the container. This is the safest way to use it!
    *   **Warning:** Display a "You are accessing the system shell" warning on first launch.

## 5. Docker vs. Local
*   **In Docker:** The terminal will be `root@container-id`. Great for managing the app, checking logs, or installing packages inside the container.
*   **On Host (Mac):** The terminal will be `user@macbook`. Great for general system tasks, but requires `node-pty` to compile correctly on the host.

## 6. Next Steps
1.  Verify `node-pty` compatibility with the current setup.
2.  Create the backend WebSocket handler.
3.  Build the frontend component.
4.  Link the AI context.

*Ready to build the Ranger Console?* 📟
