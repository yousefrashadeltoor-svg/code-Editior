import { useState, useCallback, useRef, useEffect } from 'react';
import { FileNode, OpenTab, ConsoleMessage } from './types';
import { extractZip, findNode, getLanguage, countFiles, totalSize, formatSize, detectProjectType, getFileIcon, isBinaryFile } from './utils/fileUtils';
import { executeHTML, executeJavaScript, executePython, displayCode, autoDetectEntry } from './utils/executor';
import { createTemplate } from './utils/templates';
import CodeEditor from './components/CodeEditor';
import FileTree from './components/FileTree';
import Terminal from './components/Terminal';
import Preview from './components/Preview';
import WelcomeScreen from './components/WelcomeScreen';
import {
  Play, Square, FolderOpen, X,
  PanelLeftClose, PanelLeftOpen,
  Download, AlertCircle, Code2, Eye, SplitSquareHorizontal,
  Upload, RotateCcw, FileText, Zap
} from 'lucide-react';

type ViewMode = 'editor' | 'preview' | 'split';
type BottomPanel = 'console' | 'none';

export default function App() {
  // Project state
  const [files, setFiles] = useState<FileNode[]>([]);
  const [projectName, setProjectName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Editor state
  const [openTabs, setOpenTabs] = useState<OpenTab[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [fileContents, setFileContents] = useState<Map<string, string>>(new Map());
  const [searchQuery, setSearchQuery] = useState('');

  // Layout state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [bottomPanel, setBottomPanel] = useState<BottomPanel>('console');
  const [bottomHeight, setBottomHeight] = useState(200);

  // Execution state
  const [previewHtml, setPreviewHtml] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [consoleMessages, setConsoleMessages] = useState<ConsoleMessage[]>([]);

  // Refs for resizing
  const sidebarResizing = useRef(false);
  const bottomResizing = useRef(false);

  const hasProject = files.length > 0;

  // Add console message
  const addConsoleMessage = useCallback((type: ConsoleMessage['type'], content: string) => {
    setConsoleMessages(prev => [...prev, { type, content, timestamp: Date.now() }]);
  }, []);

  // Handle file upload (ZIP or single file)
  const handleFileUpload = useCallback(async (file: File) => {
    setIsLoading(true);
    setConsoleMessages([]);
    
    try {
      if (file.name.endsWith('.zip')) {
        addConsoleMessage('system', `📦 Extracting: ${file.name} (${formatSize(file.size)})...`);
        const extracted = await extractZip(file);
        setFiles(extracted);
        setProjectName(file.name.replace('.zip', ''));
        
        const fileCount = countFiles(extracted);
        const size = totalSize(extracted);
        const type = detectProjectType(extracted);
        
        addConsoleMessage('success', `✅ Extracted ${fileCount} files (${formatSize(size)})`);
        addConsoleMessage('info', `📋 Project type: ${type}`);
        
        // Auto-open entry file
        const entry = autoDetectEntry(extracted);
        if (entry) {
          const node = findNode(extracted, entry);
          if (node) {
            openFile(node, extracted);
            addConsoleMessage('info', `📂 Auto-opened: ${entry}`);
          }
        }
      } else {
        // Single file
        const content = await file.text();
        const node: FileNode = {
          name: file.name,
          path: file.name,
          type: 'file',
          content,
          size: content.length,
        };
        setFiles([node]);
        setProjectName(file.name);
        openFile(node, [node]);
        addConsoleMessage('success', `✅ Loaded: ${file.name}`);
      }
    } catch (err: any) {
      addConsoleMessage('error', `❌ Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [addConsoleMessage]);

  // Handle new project from template
  const handleNewProject = useCallback((template: string) => {
    const templateFiles = createTemplate(template);
    if (templateFiles.length === 0) return;
    
    setFiles(templateFiles);
    setProjectName(`new-${template}-project`);
    setConsoleMessages([]);
    
    const first = templateFiles.find(f => f.type === 'file');
    if (first) {
      openFile(first, templateFiles);
    }
    
    addConsoleMessage('success', `✨ Created new ${template} project`);
  }, [addConsoleMessage]);

  // Open file in editor
  const openFile = useCallback((node: FileNode, currentFiles?: FileNode[]) => {
    if (node.type !== 'file') return;
    if (isBinaryFile(node.name)) {
      addConsoleMessage('warn', `⚠️ Cannot open binary file: ${node.name}`);
      return;
    }

    const filesToUse = currentFiles || files;
    const fileNode = findNode(filesToUse, node.path) || node;
    
    // Store content
    setFileContents(prev => {
      const next = new Map(prev);
      if (!next.has(node.path) && fileNode.content !== undefined) {
        next.set(node.path, fileNode.content);
      }
      return next;
    });

    // Add tab if not exists
    setOpenTabs(prev => {
      if (prev.some(t => t.path === node.path)) return prev;
      return [...prev, { path: node.path, name: node.name, modified: false }];
    });

    setActiveTab(node.path);
  }, [files, addConsoleMessage]);

  // Handle file select from tree
  const handleFileSelect = useCallback((path: string) => {
    const node = findNode(files, path);
    if (node) openFile(node);
  }, [files, openFile]);

  // Close tab
  const closeTab = useCallback((path: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setOpenTabs(prev => {
      const next = prev.filter(t => t.path !== path);
      if (activeTab === path) {
        setActiveTab(next.length > 0 ? next[next.length - 1].path : null);
      }
      return next;
    });
    setFileContents(prev => {
      const next = new Map(prev);
      next.delete(path);
      return next;
    });
  }, [activeTab]);

  // Handle code change
  const handleCodeChange = useCallback((value: string) => {
    if (!activeTab) return;
    setFileContents(prev => {
      const next = new Map(prev);
      next.set(activeTab, value);
      return next;
    });
    setOpenTabs(prev =>
      prev.map(t => t.path === activeTab ? { ...t, modified: true } : t)
    );
    // Update the file node content too
    setFiles(prev => {
      const updateNode = (nodes: FileNode[]): FileNode[] => {
        return nodes.map(n => {
          if (n.path === activeTab) return { ...n, content: value };
          if (n.children) return { ...n, children: updateNode(n.children) };
          return n;
        });
      };
      return updateNode(prev);
    });
  }, [activeTab]);

  // Run project
  const handleRun = useCallback(() => {
    if (!activeTab && files.length === 0) return;
    
    setIsRunning(true);
    setConsoleMessages(prev => [...prev, { type: 'system', content: '─'.repeat(50), timestamp: Date.now() }]);

    // Determine what to run
    const filePath = activeTab || autoDetectEntry(files) || '';
    const node = findNode(files, filePath);
    if (!node || !node.content) {
      addConsoleMessage('error', '❌ No file to run');
      setIsRunning(false);
      return;
    }

    // Get the latest content
    const content = fileContents.get(filePath) || node.content;
    const lang = getLanguage(node.name);

    let html = '';
    const logger = (msg: ConsoleMessage) => {
      setConsoleMessages(prev => [...prev, msg]);
    };

    if (lang === 'html') {
      html = executeHTML(files, filePath, logger);
    } else if (lang === 'javascript' || lang === 'typescript') {
      html = executeJavaScript(content, filePath, logger, files);
    } else if (lang === 'python') {
      html = executePython(content, filePath, logger);
    } else {
      html = displayCode(content, filePath, lang, logger);
    }

    setPreviewHtml(html);
    if (viewMode === 'editor') {
      setViewMode('split');
    }
    setBottomPanel('console');
  }, [activeTab, files, fileContents, viewMode, addConsoleMessage]);

  // Stop execution
  const handleStop = useCallback(() => {
    setIsRunning(false);
    setPreviewHtml('');
    addConsoleMessage('system', '⏹ Execution stopped');
  }, [addConsoleMessage]);

  // Console message from iframe
  const handleConsoleMessage = useCallback((type: string, content: string) => {
    const msgType = (['error', 'warn', 'info', 'success'].includes(type) ? type : 'log') as ConsoleMessage['type'];
    setConsoleMessages(prev => [...prev, { type: msgType, content, timestamp: Date.now() }]);
  }, []);

  // Download project
  const handleDownload = useCallback(async () => {
    const JSZipModule = (await import('jszip')).default;
    const zip = new JSZipModule();
    
    const addToZip = (nodes: FileNode[], parentPath: string) => {
      for (const node of nodes) {
        if (node.type === 'file') {
          const content = fileContents.get(node.path) || node.content || '';
          zip.file(parentPath + node.name, content);
        } else if (node.children) {
          addToZip(node.children, parentPath + node.name + '/');
        }
      }
    };
    
    addToZip(files, '');
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName || 'project'}.zip`;
    a.click();
    URL.revokeObjectURL(url);
    addConsoleMessage('success', '📥 Project downloaded');
  }, [files, fileContents, projectName, addConsoleMessage]);

  // Reset project
  const handleReset = useCallback(() => {
    setFiles([]);
    setOpenTabs([]);
    setActiveTab(null);
    setFileContents(new Map());
    setPreviewHtml('');
    setIsRunning(false);
    setConsoleMessages([]);
    setProjectName('');
  }, []);

  // Sidebar resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (sidebarResizing.current) {
        const newWidth = Math.max(180, Math.min(500, e.clientX));
        setSidebarWidth(newWidth);
      }
      if (bottomResizing.current) {
        const newHeight = Math.max(100, Math.min(500, window.innerHeight - e.clientY));
        setBottomHeight(newHeight);
      }
    };
    const handleMouseUp = () => {
      sidebarResizing.current = false;
      bottomResizing.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRun();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        addConsoleMessage('info', '💾 Changes auto-saved');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleRun, addConsoleMessage]);

  // Active file content
  const activeContent = activeTab ? (fileContents.get(activeTab) || '') : '';
  const activeLanguage = activeTab ? getLanguage(activeTab.split('/').pop() || '') : 'text';

  // Welcome screen
  if (!hasProject) {
    return <WelcomeScreen onFileUpload={handleFileUpload} onNewProject={handleNewProject} isLoading={isLoading} />;
  }

  const showEditor = viewMode === 'editor' || viewMode === 'split';
  const showPreview = viewMode === 'preview' || viewMode === 'split';

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0a0a0f] overflow-hidden">
      {/* Top Bar */}
      <header className="h-12 flex items-center justify-between px-3 border-b border-white/5 bg-[#0d0d18] flex-shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 hover:bg-white/10 rounded-lg text-gray-500 hover:text-gray-300 transition-colors"
          >
            {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
          </button>
          
          <div className="flex items-center gap-2 ml-1">
            <Zap size={18} className="text-indigo-400" />
            <span className="text-sm font-bold text-gray-300">{projectName}</span>
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full">
              {detectProjectType(files)}
            </span>
            <span className="text-[10px] bg-white/5 text-gray-500 px-2 py-0.5 rounded-full">
              {countFiles(files)} files
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* View mode buttons */}
          <div className="flex items-center bg-white/5 rounded-lg p-0.5 mr-2">
            <button
              onClick={() => setViewMode('editor')}
              className={`p-1.5 rounded text-xs flex items-center gap-1 transition-colors ${viewMode === 'editor' ? 'bg-indigo-500/30 text-indigo-300' : 'text-gray-500 hover:text-gray-300'}`}
              title="Editor only"
            >
              <Code2 size={14} />
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`p-1.5 rounded text-xs flex items-center gap-1 transition-colors ${viewMode === 'split' ? 'bg-indigo-500/30 text-indigo-300' : 'text-gray-500 hover:text-gray-300'}`}
              title="Split view"
            >
              <SplitSquareHorizontal size={14} />
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`p-1.5 rounded text-xs flex items-center gap-1 transition-colors ${viewMode === 'preview' ? 'bg-indigo-500/30 text-indigo-300' : 'text-gray-500 hover:text-gray-300'}`}
              title="Preview only"
            >
              <Eye size={14} />
            </button>
          </div>

          {/* Run / Stop */}
          {isRunning ? (
            <button
              onClick={handleStop}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-medium transition-colors"
            >
              <Square size={14} />
              Stop
            </button>
          ) : (
            <button
              onClick={handleRun}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg text-sm font-medium transition-colors"
              title="Ctrl+Enter"
            >
              <Play size={14} />
              Run
            </button>
          )}

          {/* Actions */}
          <button
            onClick={handleDownload}
            className="p-1.5 hover:bg-white/10 rounded-lg text-gray-500 hover:text-gray-300 transition-colors"
            title="Download project"
          >
            <Download size={16} />
          </button>
          
          <label className="p-1.5 hover:bg-white/10 rounded-lg text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
            title="Upload new project"
          >
            <Upload size={16} />
            <input
              type="file"
              accept=".zip,.html,.htm,.py,.js,.ts,.jsx,.tsx,.css,.json,.txt,.md"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleReset();
                  setTimeout(() => handleFileUpload(file), 100);
                }
                e.target.value = '';
              }}
            />
          </label>

          <button
            onClick={handleReset}
            className="p-1.5 hover:bg-white/10 rounded-lg text-gray-500 hover:text-gray-300 transition-colors"
            title="Close project"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        {sidebarOpen && (
          <>
            <aside
              className="flex-shrink-0 border-r border-white/5 bg-[#0d0d18] overflow-hidden flex flex-col"
              style={{ width: sidebarWidth }}
            >
              <div className="h-8 flex items-center px-3 border-b border-white/5 flex-shrink-0">
                <FolderOpen size={13} className="text-gray-500 mr-2" />
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Explorer</span>
              </div>
              <FileTree
                files={files}
                activeFile={activeTab}
                onFileSelect={handleFileSelect}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
            </aside>
            {/* Sidebar Resizer */}
            <div
              className="resizer w-1 cursor-col-resize bg-transparent hover:bg-indigo-500 flex-shrink-0 transition-colors"
              onMouseDown={(e) => {
                e.preventDefault();
                sidebarResizing.current = true;
                document.body.style.cursor = 'col-resize';
                document.body.style.userSelect = 'none';
              }}
            />
          </>
        )}

        {/* Editor + Preview */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 flex overflow-hidden">
            {/* Editor Panel */}
            {showEditor && (
              <div className={`flex flex-col overflow-hidden ${showPreview ? 'flex-1' : 'flex-1'}`}
                style={showPreview ? { width: '50%', flexShrink: 0, flexGrow: 0 } : undefined}
              >
                {/* Tabs */}
                <div className="flex items-center border-b border-white/5 bg-[#0b0b16] overflow-x-auto flex-shrink-0">
                  <div className="flex items-center min-w-0">
                    {openTabs.map((tab) => (
                      <div
                        key={tab.path}
                        className={`editor-tab flex items-center gap-1.5 px-3 py-2 cursor-pointer group min-w-0 ${
                          activeTab === tab.path ? 'active' : ''
                        }`}
                        onClick={() => setActiveTab(tab.path)}
                      >
                        <span className="text-xs flex-shrink-0">{getFileIcon(tab.name)}</span>
                        <span className="text-xs text-gray-400 truncate max-w-[120px]">{tab.name}</span>
                        {tab.modified && (
                          <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full flex-shrink-0" />
                        )}
                        <button
                          onClick={(e) => closeTab(tab.path, e)}
                          className="ml-1 p-0.5 rounded hover:bg-white/10 text-gray-600 hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Editor Content */}
                <div className="flex-1 overflow-hidden bg-[#0e0e1a]">
                  {activeTab ? (
                    <CodeEditor
                      key={activeTab}
                      content={activeContent}
                      language={activeLanguage}
                      onChange={handleCodeChange}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <FileText size={48} className="text-gray-700 mx-auto mb-3" />
                        <p className="text-gray-600 text-sm">Select a file to edit</p>
                        <p className="text-gray-700 text-xs mt-1">Or press Ctrl+Enter to run</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Splitter between editor and preview */}
            {showEditor && showPreview && (
              <div className="w-1 bg-white/5 flex-shrink-0" />
            )}

            {/* Preview Panel */}
            {showPreview && (
              <div className="flex-1 overflow-hidden">
                <Preview
                  htmlContent={previewHtml}
                  onConsoleMessage={handleConsoleMessage}
                  isRunning={isRunning}
                />
              </div>
            )}
          </div>

          {/* Bottom Panel (Console) */}
          {bottomPanel === 'console' && (
            <>
              {/* Bottom Resizer */}
              <div
                className="resizer h-1 cursor-row-resize bg-white/5 flex-shrink-0"
                onMouseDown={(e) => {
                  e.preventDefault();
                  bottomResizing.current = true;
                  document.body.style.cursor = 'row-resize';
                  document.body.style.userSelect = 'none';
                }}
              />
              <div className="flex-shrink-0 overflow-hidden" style={{ height: bottomHeight }}>
                <Terminal
                  messages={consoleMessages}
                  onClear={() => setConsoleMessages([])}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <footer className="h-6 flex items-center justify-between px-3 border-t border-white/5 bg-[#0a0a12] text-[11px] text-gray-600 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setBottomPanel(bottomPanel === 'console' ? 'none' : 'console')}
            className="flex items-center gap-1 hover:text-gray-400 transition-colors"
          >
            <AlertCircle size={11} />
            Console {consoleMessages.filter(m => m.type === 'error').length > 0 && (
              <span className="text-red-400">({consoleMessages.filter(m => m.type === 'error').length})</span>
            )}
          </button>
          {isRunning && (
            <span className="flex items-center gap-1 text-green-500">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              Running
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {activeTab && (
            <>
              <span>{activeLanguage.toUpperCase()}</span>
              <span>UTF-8</span>
            </>
          )}
          <span>Ctrl+Enter to Run</span>
        </div>
      </footer>
    </div>
  );
}
