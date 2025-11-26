import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import 'xterm/css/xterm.css';

interface RangerTerminalProps {
  onOutput?: (data: string) => void;
}

export interface RangerTerminalRef {
  write: (data: string) => void;
  fit: () => void;
}

const RangerTerminal = forwardRef<RangerTerminalRef, RangerTerminalProps>(({ onOutput }, ref) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useImperativeHandle(ref, () => ({
    write: (data: string) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(data);
      }
    },
    fit: () => {
      fitAddonRef.current?.fit();
    }
  }));

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize xterm.js
    const term = new Terminal({
      cursorBlink: true,
      fontFamily: '"Fira Code", monospace',
      fontSize: 14,
      theme: {
        background: '#000000',
        foreground: '#00ff00', // Matrix Green
        cursor: '#00ff00',
        selectionBackground: 'rgba(0, 255, 0, 0.3)',
        black: '#000000',
        red: '#ff0000',
        green: '#00ff00',
        yellow: '#ffff00',
        blue: '#0000ff',
        magenta: '#ff00ff',
        cyan: '#00ffff',
        white: '#ffffff',
        brightBlack: '#808080',
        brightRed: '#ff0000',
        brightGreen: '#00ff00',
        brightYellow: '#ffff00',
        brightBlue: '#0000ff',
        brightMagenta: '#ff00ff',
        brightCyan: '#00ffff',
        brightWhite: '#ffffff'
      },
      allowProposedApi: true
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);
    term.open(terminalRef.current);

    // Initial fit
    setTimeout(() => fitAddon.fit(), 100);

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Connect to WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = 'localhost:3010'; // Hardcoded for now, should come from config
    const ws = new WebSocket(`${protocol}//${host}/terminal`);
    wsRef.current = ws;

    ws.onopen = () => {
      term.writeln('\x1b[1;32m⚡ RANGER CONSOLE CONNECTED ⚡\x1b[0m');
      term.writeln('\x1b[2mType "exit" to close session.\x1b[0m\r\n');

      // Send initial resize
      const dims = fitAddon.proposeDimensions();
      if (dims) {
        ws.send(JSON.stringify({
          type: 'resize',
          cols: dims.cols,
          rows: dims.rows
        }));
      }
    };

    ws.onmessage = (event) => {
      term.write(event.data);
      if (onOutput) onOutput(event.data);
    };

    ws.onclose = () => {
      term.writeln('\r\n\x1b[1;31m⚡ DISCONNECTED ⚡\x1b[0m');
    };

    ws.onerror = (err) => {
      term.writeln(`\r\n\x1b[1;31mError: ${err}\x1b[0m`);
    };

    // Terminal Input -> WebSocket
    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });

    // Handle Resize
    const handleResize = () => {
      if (!fitAddon) return;
      fitAddon.fit();
      const dims = fitAddon.proposeDimensions();
      if (dims && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'resize',
          cols: dims.cols,
          rows: dims.rows
        }));
      }
    };

    window.addEventListener('resize', handleResize);

    // Resize observer for the container
    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(terminalRef.current);

    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      ws.close();
      term.dispose();
    };
  }, []);

  return <div ref={terminalRef} className="w-full h-full" />;
});

RangerTerminal.displayName = 'RangerTerminal';

export default RangerTerminal;
