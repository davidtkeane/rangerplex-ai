import React, {
  CSSProperties,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import 'xterm/css/xterm.css';

export type RangerTerminalHandle = {
  writeToTerminal: (data: string) => void;
  sendToSocket: (data: string) => void;
  fit: () => void;
};

type RangerTerminalProps = {
  endpoint?: string;
  className?: string;
  onSocketReady?: (socket: WebSocket | null) => void;
  onOutput?: (data: string) => void;
};

const RangerTerminal = forwardRef<RangerTerminalHandle, RangerTerminalProps>(
  ({ endpoint, className, onSocketReady, onOutput }, ref) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const terminalRef = useRef<Terminal | null>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);
    const socketRef = useRef<WebSocket | null>(null);
    const lastSentSize = useRef<{ cols: number; rows: number } | null>(null);

    useImperativeHandle(ref, () => ({
      writeToTerminal: (data: string) => terminalRef.current?.write(data),
      sendToSocket: (data: string) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
          socketRef.current.send(data);
        }
      },
      fit: () => fitAddonRef.current?.fit(),
    }));

    useEffect(() => {
      const term = new Terminal({
        convertEol: true,
        cursorBlink: true,
        fontSize: 14,
        fontFamily: '"JetBrains Mono", "Fira Code", "SFMono-Regular", Menlo, monospace',
        theme: {
          background: '#050910',
          foreground: '#3ef5d0',
          cursor: '#3ef5d0',
          green: '#3ef5d0',
          black: '#000000',
        },
      });
      const fitAddon = new FitAddon();
      const linksAddon = new WebLinksAddon();

      terminalRef.current = term;
      fitAddonRef.current = fitAddon;

      term.loadAddon(fitAddon);
      term.loadAddon(linksAddon);

      const container = containerRef.current;
      if (container) {
        term.open(container);
        term.focus();
      }

      const socketUrl = (() => {
        if (endpoint) return endpoint;
        if (typeof window === 'undefined') return 'ws://localhost:3000/terminal';
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.hostname || 'localhost';
        return `${protocol}//${host}:3000/terminal`;
      })();

      const socket = new WebSocket(socketUrl);
      socketRef.current = socket;
      onSocketReady?.(socket);

      const resizeAndNotify = () => {
        if (!fitAddonRef.current || !terminalRef.current || !containerRef.current) return;

        // Safety check: Don't try to fit if container is hidden or has no size
        if (containerRef.current.clientWidth === 0 || containerRef.current.clientHeight === 0) return;

        try {
          fitAddonRef.current.fit();
        } catch (e) {
          console.warn('XTerm fit failed:', e);
          return;
        }

        const cols = terminalRef.current.cols;
        const rows = terminalRef.current.rows;
        if (!cols || !rows) return;

        const sizeChanged =
          !lastSentSize.current ||
          lastSentSize.current.cols !== cols ||
          lastSentSize.current.rows !== rows;

        if (sizeChanged) {
          lastSentSize.current = { cols, rows };
          if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({ type: 'resize', cols, rows }));
          }
        }
      };

      const dataDisposable = term.onData((data) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
          socketRef.current.send(data);
        }
      });

      socket.addEventListener('open', () => {
        term.writeln('\x1b[1;32m⚡ RANGER CONSOLE CONNECTED ⚡\x1b[0m');
        term.writeln('\x1b[2mType "exit" to close session.\x1b[0m\r\n');
        resizeAndNotify();
      });

      socket.addEventListener('message', (event) => {
        if (typeof event.data === 'string') {
          term.write(event.data);
          onOutput?.(event.data);
        } else if (event.data instanceof ArrayBuffer) {
          const text = new TextDecoder().decode(event.data);
          term.write(text);
          onOutput?.(text);
        }
      });

      socket.addEventListener('close', () => {
        term.writeln('\r\n\x1b[1;31m⚡ DISCONNECTED ⚡\x1b[0m');
        onSocketReady?.(null);
      });

      socket.addEventListener('error', () => {
        term.writeln('\r\n\x1b[1;31m[connection error]\x1b[0m');
      });

      const observer = new ResizeObserver(() => {
        // Debounce resize
        requestAnimationFrame(resizeAndNotify);
      });
      if (container) {
        observer.observe(container);
      }
      // Delay initial fit to allow layout to settle
      setTimeout(resizeAndNotify, 100);

      return () => {
        dataDisposable.dispose();
        observer.disconnect();
        socket.close();
        term.dispose();
        onSocketReady?.(null);
      };
    }, [endpoint, onSocketReady, onOutput]);

    const frameStyle: CSSProperties = {
      position: 'relative',
      height: '100%',
      width: '100%',
      background: 'linear-gradient(135deg, #04080f 0%, #07111c 100%)',
      border: '1px solid rgba(0, 255, 170, 0.35)',
      boxShadow:
        '0 0 18px rgba(0, 255, 170, 0.35), 0 0 60px rgba(0, 170, 255, 0.18), inset 0 0 20px rgba(0, 255, 255, 0.12)',
      borderRadius: '12px',
      overflow: 'hidden',
    };

    const gridOverlayStyle: CSSProperties = {
      position: 'absolute',
      inset: 0,
      background:
        'linear-gradient(90deg, rgba(0,255,170,0.08) 1px, transparent 1px), linear-gradient(0deg, rgba(0,170,255,0.08) 1px, transparent 1px)',
      backgroundSize: '40px 40px',
      mixBlendMode: 'screen',
      pointerEvents: 'none',
      opacity: 0.45,
      zIndex: 1,
    };

    const terminalSurfaceStyle: CSSProperties = {
      position: 'relative',
      zIndex: 2,
      height: '100%',
      width: '100%',
      padding: '12px',
      color: '#3ef5d0',
      background:
        'radial-gradient(circle at 20% 20%, rgba(0,255,170,0.08), transparent 30%), radial-gradient(circle at 80% 0%, rgba(0,180,255,0.08), transparent 25%)',
    };

    return (
      <div style={frameStyle} className={className}>
        <div style={gridOverlayStyle} aria-hidden />
        <div ref={containerRef} style={terminalSurfaceStyle} />
      </div>
    );
  }
);

RangerTerminal.displayName = 'RangerTerminal';

export default RangerTerminal;
