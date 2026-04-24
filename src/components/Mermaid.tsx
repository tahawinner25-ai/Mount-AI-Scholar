import React, { useEffect, useState } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  fontFamily: 'Inter, ui-sans-serif, system-ui',
});

export default function Mermaid({ chart }: { chart: string }) {
  const [svgContent, setSvgContent] = useState<string>('');

  useEffect(() => {
    if (chart) {
      const renderChart = async () => {
        try {
          const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
          const result = await mermaid.render(id, chart);
          setSvgContent(result.svg);
        } catch (e) {
          console.error('Mermaid rendering error:', e);
          console.error('Raw chart was:', chart);
          setSvgContent(`<div class="text-red-500 font-mono text-sm border border-red-500/20 bg-red-500/10 p-4 rounded-xl whitespace-pre-wrap">Erreur de rendu Mermaid : Code invalide généré par l'IA.\n\n${chart}</div>`);
        }
      };
      
      renderChart();
    }
  }, [chart]);

  if (!svgContent) {
    return <div className="animate-pulse h-32 bg-slate-800/50 rounded-xl" />;
  }

  return (
    <div 
      className="mermaid flex justify-center w-full max-w-full overflow-x-auto" 
      dangerouslySetInnerHTML={{ __html: svgContent }} 
    />
  );
}
