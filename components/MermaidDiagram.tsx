import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidDiagramProps {
  code: string;
}

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ code }) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      securityLevel: 'loose',
      fontFamily: 'ui-sans-serif, system-ui, sans-serif',
      themeVariables: {
        primaryColor: '#0d9488', // Teal 600
        primaryTextColor: '#f4f4f5',
        primaryBorderColor: '#115e59',
        lineColor: '#52525b',
        secondaryColor: '#27272a',
        tertiaryColor: '#18181b',
      }
    });
  }, []);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!code) return;
      try {
        setError(false);
        const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
        const { svg } = await mermaid.render(id, code);
        setSvg(svg);
      } catch (err) {
        console.error("Mermaid render error:", err);
        setError(true);
      }
    };
    
    renderDiagram();
  }, [code]);

  if (error) {
    return (
      <div className="p-4 border border-red-900/50 bg-red-900/10 rounded-lg text-red-400 text-xs font-mono overflow-auto">
        Failed to render diagram
        <pre className="mt-2 text-zinc-500">{code}</pre>
      </div>
    );
  }

  return (
    <div className="my-6 overflow-x-auto bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex justify-center">
      <div 
        ref={elementRef}
        dangerouslySetInnerHTML={{ __html: svg }}
        className="mermaid-container"
      />
    </div>
  );
};

export default MermaidDiagram;