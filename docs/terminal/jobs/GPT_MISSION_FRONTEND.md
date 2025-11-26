# 🤖 Mission Brief: Operation Frontend Console
**Agent:** GPT-4 (or equivalent)
**Objective:** Build the React UI component for the Ranger Console.

## 1. Dependencies
*   Add `xterm`, `xterm-addon-fit`, `xterm-addon-web-links` to `package.json`.

## 2. Component: `components/Terminal/RangerTerminal.tsx`
Create a robust terminal component.

### Requirements:
1.  **UI Structure:**
    *   A container `div` that fills the available space.
    *   Styled with a "Matrix" or "Cyberpunk" aesthetic (black background, neon green/cyan text).
2.  **XTerm.js Setup:**
    *   Initialize `Terminal` instance.
    *   Load `FitAddon` and `WebLinksAddon`.
3.  **WebSocket Connection:**
    *   Connect to `ws://localhost:3010/terminal` (or appropriate host).
    *   **On Open:** Attach `xterm.onData` to send to socket.
    *   **On Message:** Write socket data to `xterm.write()`.
4.  **Resizing:**
    *   Use `ResizeObserver` on the container div.
    *   When size changes, call `fitAddon.fit()`.
    *   **Crucial:** Calculate new cols/rows and send `{"type": "resize", "cols": ..., "rows": ...}` to the backend.
5.  **Expose Ref:**
    *   Expose a method `writeToTerminal(cmd: string)` via `useImperativeHandle` or similar, so the AI Chat can programmatically paste commands.

## 3. Output
*   `components/Terminal/RangerTerminal.tsx`
*   Updated `package.json`

## Completion Notes (GPT-4)
* Dependencies added to `package.json`: `xterm`, `xterm-addon-fit`, `xterm-addon-web-links`.
* Implemented `components/Terminal/RangerTerminal.tsx` with Matrix/cyberpunk styling, XTerm + Fit/WebLinks addons, WebSocket bridge to `ws://<host>:3010/terminal`, ResizeObserver-driven fit + backend resize messages, and exposed `writeToTerminal(cmd)` ref method.
* No automated tests run; next step: `npm install` then `npm run dev`/`npm run build` to verify.
