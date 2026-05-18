import { useEffect, useRef } from 'react';
import { ConsoleMessage } from '../types';
import { Trash2, Download } from 'lucide-react';

interface TerminalProps {
  messages: ConsoleMessage[];
  onClear: () => void;
}

function getTypeClass(type: ConsoleMessage['type']): string {
  switch (type) {
    case 'error': return 'error';
    case 'warn': return 'warning';
    case 'info': return 'info';
    case 'success': return 'success';
    case 'system': return 'info';
    default: return '';
  }
}

function getTypePrefix(type: ConsoleMessage['type']): string {
  switch (type) {
    case 'error': return '✗';
    case 'warn': return '⚠';
    case 'info': return 'ℹ';
    case 'success': return '✓';
    case 'system': return '⟩';
    default: return '›';
  }
}

export default function Terminal({ messages, onClear }: TerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  const exportLogs = () => {
    const text = messages.map(m => {
      const time = new Date(m.timestamp).toLocaleTimeString();
      return `[${time}] [${m.type.toUpperCase()}] ${m.content}`;
    }).join('\n');
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'console-log.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col bg-[#0a0a15]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/5 bg-[#0f0f1e]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Console</span>
          <span className="text-[10px] bg-white/10 text-gray-400 px-1.5 py-0.5 rounded-full">
            {messages.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={exportLogs}
            className="p-1 hover:bg-white/10 rounded text-gray-500 hover:text-gray-300 transition-colors"
            title="Export logs"
          >
            <Download size={13} />
          </button>
          <button
            onClick={onClear}
            className="p-1 hover:bg-white/10 rounded text-gray-500 hover:text-gray-300 transition-colors"
            title="Clear console"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={containerRef} className="flex-1 overflow-y-auto p-2 terminal-output">
        {messages.length === 0 ? (
          <div className="text-gray-600 text-sm flex items-center justify-center h-full">
            Console output will appear here...
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-2 py-0.5 px-1 rounded hover:bg-white/3 ${getTypeClass(msg.type)}`}
            >
              <span className="opacity-50 flex-shrink-0 w-4 text-center">
                {getTypePrefix(msg.type)}
              </span>
              <span className="whitespace-pre-wrap break-all">{msg.content}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
