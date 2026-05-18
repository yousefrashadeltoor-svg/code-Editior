import { useEffect, useRef, useState } from 'react';
import { RefreshCw, ExternalLink, Smartphone, Monitor, Tablet, Maximize2, Copy, X } from 'lucide-react';

interface PreviewProps {
  htmlContent: string;
  onConsoleMessage: (type: string, content: string) => void;
  isRunning: boolean;
}

type ViewMode = 'desktop' | 'tablet' | 'mobile';

export default function Preview({ htmlContent, onConsoleMessage, isRunning }: PreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('desktop');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!iframeRef.current || !htmlContent) return;
    
    const iframe = iframeRef.current;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    iframe.src = url;
    
    return () => URL.revokeObjectURL(url);
  }, [htmlContent]);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data && event.data.type === 'console') {
        onConsoleMessage(event.data.logType, event.data.content);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onConsoleMessage]);

  const refresh = () => {
    if (iframeRef.current && htmlContent) {
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      iframeRef.current.src = url;
    }
  };

  const openExternal = () => {
    if (htmlContent) {
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    }
  };

  const copySource = () => {
    navigator.clipboard.writeText(htmlContent);
  };

  const toggleFullscreen = () => {
    if (!isFullscreen && containerRef.current) {
      containerRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  const getViewWidth = () => {
    switch (viewMode) {
      case 'mobile': return 'max-w-[375px]';
      case 'tablet': return 'max-w-[768px]';
      default: return 'w-full';
    }
  };

  if (!htmlContent && !isRunning) {
    return (
      <div className="h-full flex items-center justify-center bg-[#0a0a15]">
        <div className="text-center">
          <div className="text-6xl mb-4">🚀</div>
          <p className="text-gray-500 text-lg">Click "Run" to see the preview</p>
          <p className="text-gray-600 text-sm mt-2">Or select an HTML file and run it</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-full flex flex-col bg-[#0a0a15]">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/5 bg-[#0f0f1e]">
        <div className="flex items-center gap-1">
          <button
            onClick={refresh}
            className="p-1.5 hover:bg-white/10 rounded text-gray-500 hover:text-gray-300 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
          <button
            onClick={openExternal}
            className="p-1.5 hover:bg-white/10 rounded text-gray-500 hover:text-gray-300 transition-colors"
            title="Open in new tab"
          >
            <ExternalLink size={14} />
          </button>
          <button
            onClick={copySource}
            className="p-1.5 hover:bg-white/10 rounded text-gray-500 hover:text-gray-300 transition-colors"
            title="Copy source"
          >
            <Copy size={14} />
          </button>
        </div>
        
        <div className="flex items-center gap-0.5 bg-white/5 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode('mobile')}
            className={`p-1.5 rounded transition-colors ${viewMode === 'mobile' ? 'bg-indigo-500/30 text-indigo-300' : 'text-gray-500 hover:text-gray-300'}`}
            title="Mobile view"
          >
            <Smartphone size={14} />
          </button>
          <button
            onClick={() => setViewMode('tablet')}
            className={`p-1.5 rounded transition-colors ${viewMode === 'tablet' ? 'bg-indigo-500/30 text-indigo-300' : 'text-gray-500 hover:text-gray-300'}`}
            title="Tablet view"
          >
            <Tablet size={14} />
          </button>
          <button
            onClick={() => setViewMode('desktop')}
            className={`p-1.5 rounded transition-colors ${viewMode === 'desktop' ? 'bg-indigo-500/30 text-indigo-300' : 'text-gray-500 hover:text-gray-300'}`}
            title="Desktop view"
          >
            <Monitor size={14} />
          </button>
        </div>

        <div className="flex items-center gap-1">
          {isRunning && (
            <span className="flex items-center gap-1.5 text-xs text-green-400">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Running
            </span>
          )}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 hover:bg-white/10 rounded text-gray-500 hover:text-gray-300 transition-colors"
            title="Fullscreen"
          >
            {isFullscreen ? <X size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="flex-1 flex items-start justify-center overflow-auto bg-[#0d0d18] p-0">
        <div className={`${getViewWidth()} h-full mx-auto ${viewMode !== 'desktop' ? 'border-x border-white/10' : ''}`}>
          <iframe
            ref={iframeRef}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-modals allow-forms allow-popups"
            title="Preview"
          />
        </div>
      </div>
    </div>
  );
}
