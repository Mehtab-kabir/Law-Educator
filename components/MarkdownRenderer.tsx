import React from 'react';

// A lightweight markdown renderer to avoid heavy dependencies for this demo.
// Handles bold, headers, lists, and basic formatting.

const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  const processLine = (line: string, index: number) => {
    // Headers
    if (line.startsWith('### ')) return <h3 key={index} className="text-lg font-bold mt-4 mb-2 text-slate-800 serif">{line.substring(4)}</h3>;
    if (line.startsWith('## ')) return <h2 key={index} className="text-xl font-bold mt-5 mb-3 text-slate-800 serif">{line.substring(3)}</h2>;
    if (line.startsWith('# ')) return <h1 key={index} className="text-2xl font-bold mt-6 mb-4 text-slate-900 serif">{line.substring(2)}</h1>;

    // Bullet points
    if (line.trim().startsWith('- ')) {
       const text = line.trim().substring(2);
       return <li key={index} className="ml-4 list-disc text-slate-700 leading-relaxed mb-1">{parseInline(text)}</li>;
    }

    // Numbered lists (basic detection)
    if (/^\d+\.\s/.test(line.trim())) {
      const text = line.trim().replace(/^\d+\.\s/, '');
      return <li key={index} className="ml-4 list-decimal text-slate-700 leading-relaxed mb-1">{parseInline(text)}</li>;
    }

    // Empty lines
    if (!line.trim()) return <div key={index} className="h-2"></div>;

    // Standard paragraph
    return <p key={index} className="mb-2 text-slate-700 leading-relaxed">{parseInline(line)}</p>;
  };

  const parseInline = (text: string) => {
    // Simple bold parser: **text**
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="prose prose-slate max-w-none">
      {content.split('\n').map((line, i) => processLine(line, i))}
    </div>
  );
};

export default MarkdownRenderer;
