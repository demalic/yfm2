import { useEffect, useRef, useState } from 'react';
import { Terminal } from 'lucide-react';

function lineClassName(line: string): string {
  const lower = line.toLowerCase();
  if (line.startsWith('$ ')) return 'text-accent-cyan/80';
  if (lower.includes('error') || lower.includes('traceback') || lower.includes('exception')) {
    return 'text-red-400';
  }
  if (lower.includes('warning')) return 'text-amber-400';
  if (lower.includes('complete') || lower.includes('done') || line.includes('✅')) {
    return 'text-green-400';
  }
  return 'text-gray-300';
}

interface JobTerminalProps {
  lines: string[];
  isLive: boolean;
  error: string | null;
}

export function JobTerminal({ lines, isLive, error }: JobTerminalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [stickToBottom, setStickToBottom] = useState(true);

  useEffect(() => {
    if (!stickToBottom || !scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [lines, stickToBottom]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
    setStickToBottom(atBottom);
  };

  return (
    <section className="bg-dark-card border border-dark-border rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-dark-border bg-dark-hover/40">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-accent-cyan" />
          <h3 className="font-semibold text-white text-sm">Tower output</h3>
          {isLive && (
            <span className="text-[10px] font-medium uppercase tracking-wide text-accent-cyan bg-accent-cyan/10 px-2 py-0.5 rounded-full">
              Live
            </span>
          )}
        </div>
        <span className="text-xs text-gray-500">{lines.length.toLocaleString()} lines</span>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-72 overflow-y-auto bg-[#0b0f14] px-4 py-3 font-mono text-xs leading-relaxed"
      >
        {lines.length === 0 ? (
          <p className="text-gray-600">Waiting for tower output…</p>
        ) : (
          lines.map((line, index) => (
            <div key={`${index}-${line.slice(0, 24)}`} className={`whitespace-pre-wrap break-all ${lineClassName(line)}`}>
              {line}
            </div>
          ))
        )}
      </div>

      {error && (
        <p className="px-4 py-2 text-xs text-red-400 border-t border-dark-border bg-red-500/5">
          {error}
        </p>
      )}

      {!stickToBottom && lines.length > 0 && (
        <button
          type="button"
          onClick={() => {
            setStickToBottom(true);
            if (scrollRef.current) {
              scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
          }}
          className="w-full px-4 py-2 text-xs text-accent-cyan border-t border-dark-border hover:bg-dark-hover/40 transition-colors"
        >
          Jump to latest
        </button>
      )}
    </section>
  );
}
