import React, { useEffect, useState } from 'react';
import mermaid from 'mermaid';
import { Network, ArrowRight } from 'lucide-react';

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  fontFamily: 'Inter, ui-sans-serif, system-ui',
});

function cleanChart(raw: string): string {
  if (!raw) return '';
  let cleaned = raw.trim();
  if (cleaned.startsWith('```mermaid')) {
    cleaned = cleaned.replace(/^```mermaid\s*/i, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  cleaned = cleaned.trim();
  if (!cleaned.toLowerCase().startsWith('graph') && !cleaned.toLowerCase().startsWith('flowchart') && !cleaned.toLowerCase().startsWith('sequenceDiagram') && !cleaned.toLowerCase().startsWith('mindmap')) {
    cleaned = `graph TD\n${cleaned}`;
  }
  return cleaned;
}

function parseFallbackGraph(code: string) {
  const lines = code.split('\n');
  const nodes = new Map<string, string>();
  const connections: Array<{ from: string; to: string; label?: string }> = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('graph') || trimmed.startsWith('flowchart') || trimmed.startsWith('%%')) continue;

    // Match patterns like A["Label A"] -->|"Link"| B["Label B"]
    const connMatch = trimmed.match(/([A-Za-z0-9_]+)(?:\["?(.*?)"?\])?\s*-->(?:\|"?(.*?)"?\|)?\s*([A-Za-z0-9_]+)(?:\["?(.*?)"?\])?/);
    if (connMatch) {
      const [, fromId, fromLabel, connLabel, toId, toLabel] = connMatch;
      if (fromId) nodes.set(fromId, fromLabel || fromId);
      if (toId) nodes.set(toId, toLabel || toId);
      connections.push({ from: fromId, to: toId, label: connLabel });
    } else {
      const nodeMatch = trimmed.match(/([A-Za-z0-9_]+)\["?(.*?)"?\]/);
      if (nodeMatch) {
        nodes.set(nodeMatch[1], nodeMatch[2]);
      }
    }
  }

  return {
    nodes: Array.from(nodes.entries()).map(([id, label]) => ({ id, label })),
    connections
  };
}

export default function Mermaid({ chart }: { chart: string }) {
  const [svgContent, setSvgContent] = useState<string>('');
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    if (!chart) return;

    let isMounted = true;
    const sanitizedChart = cleanChart(chart);

    const renderChart = async (attempt = 1) => {
      setHasError(false);
      try {
        const id = `mermaid-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const result = await mermaid.render(id, sanitizedChart);
        if (isMounted) {
          setSvgContent(result.svg);
        }
      } catch (e) {
        console.warn(`Mermaid render attempt ${attempt} failed:`, e);
        if (attempt < 2) {
          setTimeout(() => {
            if (isMounted) renderChart(attempt + 1);
          }, 300);
        } else if (isMounted) {
          setHasError(true);
          setSvgContent('');
        }
      }
    };

    renderChart();

    return () => {
      isMounted = false;
    };
  }, [chart]);

  if (!svgContent && !hasError) {
    return <div className="animate-pulse h-32 bg-slate-800/50 rounded-xl" />;
  }

  if (hasError) {
    const fallbackData = parseFallbackGraph(cleanChart(chart));

    if (fallbackData.nodes.length > 0) {
      return (
        <div className="w-full bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest border-b border-slate-800 pb-2">
            <Network className="w-4 h-4" /> Visual Topology Map
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 py-2">
            {fallbackData.nodes.map((node, i) => (
              <React.Fragment key={node.id}>
                <div className="px-4 py-2 bg-slate-950 border border-emerald-500/30 rounded-xl text-xs font-bold text-white shadow-lg flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {node.label}
                </div>
                {i < fallbackData.nodes.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-slate-500 shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>

          {fallbackData.connections.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800/60 justify-center">
              {fallbackData.connections.map((c, idx) => (
                <span key={idx} className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg text-[10px] font-mono text-blue-300">
                  {c.from} → {c.to} {c.label ? `(${c.label})` : ''}
                </span>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl text-xs font-mono text-slate-400">
        <p className="font-bold text-blue-400 mb-1">Topology Diagram:</p>
        <pre className="whitespace-pre-wrap text-[11px] bg-slate-950 p-3 rounded-xl border border-slate-800 text-slate-300">{cleanChart(chart)}</pre>
      </div>
    );
  }

  return (
    <div 
      className="mermaid flex justify-center w-full max-w-full overflow-x-auto" 
      dangerouslySetInnerHTML={{ __html: svgContent }} 
    />
  );
}

