import { ConsoleMessage, FileNode } from '../types';
import { findNode, getAllFiles } from './fileUtils';

type Logger = (msg: ConsoleMessage) => void;

function createMessage(type: ConsoleMessage['type'], content: string): ConsoleMessage {
  return { type, content, timestamp: Date.now() };
}

// Execute HTML project in iframe
export function executeHTML(
  files: FileNode[],
  entryFile: string,
  log: Logger
): string {
  const node = findNode(files, entryFile);
  if (!node || !node.content) {
    log(createMessage('error', `❌ File not found: ${entryFile}`));
    return '';
  }

  let html = node.content;

  // Inline CSS files referenced in HTML
  const cssRegex = /<link[^>]*href=["']([^"']+\.css)["'][^>]*>/gi;
  let match;
  while ((match = cssRegex.exec(html)) !== null) {
    const cssPath = resolveRelativePath(entryFile, match[1]);
    const cssNode = findNode(files, cssPath);
    if (cssNode && cssNode.content) {
      html = html.replace(match[0], `<style>\n${cssNode.content}\n</style>`);
    }
  }

  // Inline JS files referenced in HTML
  const jsRegex = /<script[^>]*src=["']([^"']+\.js)["'][^>]*><\/script>/gi;
  while ((match = jsRegex.exec(html)) !== null) {
    const jsPath = resolveRelativePath(entryFile, match[1]);
    const jsNode = findNode(files, jsPath);
    if (jsNode && jsNode.content) {
      html = html.replace(match[0], `<script>\n${jsNode.content}\n</script>`);
    }
  }

  // Add console capture script
  const consoleCapture = `
<script>
(function() {
  const origConsole = { 
    log: console.log, 
    error: console.error, 
    warn: console.warn, 
    info: console.info 
  };
  
  function send(type, args) {
    try {
      const content = Array.from(args).map(a => {
        if (typeof a === 'object') return JSON.stringify(a, null, 2);
        return String(a);
      }).join(' ');
      window.parent.postMessage({ type: 'console', logType: type, content }, '*');
    } catch(e) {}
  }
  
  console.log = function() { send('log', arguments); origConsole.log.apply(console, arguments); };
  console.error = function() { send('error', arguments); origConsole.error.apply(console, arguments); };
  console.warn = function() { send('warn', arguments); origConsole.warn.apply(console, arguments); };
  console.info = function() { send('info', arguments); origConsole.info.apply(console, arguments); };
  
  window.onerror = function(msg, url, line, col, error) {
    send('error', ['Error: ' + msg + ' (line ' + line + ')']);
  };
  window.onunhandledrejection = function(e) {
    send('error', ['Unhandled Promise Rejection: ' + e.reason]);
  };
})();
</script>`;

  // Inject console capture before </head> or at the beginning
  if (html.includes('</head>')) {
    html = html.replace('</head>', consoleCapture + '\n</head>');
  } else if (html.includes('<body')) {
    html = html.replace('<body', consoleCapture + '\n<body');
  } else {
    html = consoleCapture + '\n' + html;
  }

  log(createMessage('success', `▶ Running HTML project: ${entryFile}`));
  return html;
}

// Execute JavaScript in sandboxed iframe
export function executeJavaScript(
  code: string,
  filename: string,
  log: Logger,
  files?: FileNode[]
): string {
  log(createMessage('info', `▶ Running JavaScript: ${filename}`));
  
  // Collect all JS modules for potential imports
  let moduleScripts = '';
  if (files) {
    const allFiles = getAllFiles(files);
    for (const f of allFiles) {
      if (f.path !== filename && (f.name.endsWith('.js') || f.name.endsWith('.mjs'))) {
        // Skip for now - basic execution
      }
    }
  }

  const html = `<!DOCTYPE html>
<html><head><style>
body { 
  font-family: 'JetBrains Mono', monospace; 
  background: #1a1a2e; 
  color: #e2e8f0; 
  padding: 20px; 
  margin: 0;
  white-space: pre-wrap;
  font-size: 14px;
  line-height: 1.6;
}
.output-line { margin: 2px 0; }
.error { color: #ef4444; }
.warn { color: #eab308; }
.info { color: #6366f1; }
</style></head><body>
<script>
(function() {
  const output = document.body;
  
  function addLine(text, className) {
    const div = document.createElement('div');
    div.className = 'output-line ' + (className || '');
    div.textContent = text;
    output.appendChild(div);
    window.parent.postMessage({ type: 'console', logType: className || 'log', content: text }, '*');
  }
  
  const origConsole = { log: console.log, error: console.error, warn: console.warn, info: console.info };
  
  function formatArgs(args) {
    return Array.from(args).map(a => {
      if (typeof a === 'object') return JSON.stringify(a, null, 2);
      return String(a);
    }).join(' ');
  }
  
  console.log = function() { addLine(formatArgs(arguments), ''); };
  console.error = function() { addLine(formatArgs(arguments), 'error'); };
  console.warn = function() { addLine(formatArgs(arguments), 'warn'); };
  console.info = function() { addLine(formatArgs(arguments), 'info'); };
  
  // Provide some basic APIs
  window.alert = function(msg) { addLine('[alert] ' + msg, 'info'); };
  window.prompt = function(msg) { addLine('[prompt] ' + msg, 'info'); return null; };
  
  window.onerror = function(msg, url, line) {
    addLine('Error: ' + msg + ' (line ' + line + ')', 'error');
  };
  
  try {
    ${code}
  } catch(e) {
    addLine('❌ ' + e.name + ': ' + e.message, 'error');
    if (e.stack) addLine(e.stack, 'error');
  }
})();
</script>
${moduleScripts}
</body></html>`;

  return html;
}

// Python execution via Pyodide
export function executePython(
  code: string,
  filename: string,
  log: Logger
): string {
  log(createMessage('info', `▶ Running Python: ${filename}`));
  log(createMessage('system', '⏳ Loading Python runtime (Pyodide)...'));

  const html = `<!DOCTYPE html>
<html><head>
<style>
body { 
  font-family: 'JetBrains Mono', monospace; 
  background: #1a1a2e; 
  color: #e2e8f0; 
  padding: 20px; 
  margin: 0;
  white-space: pre-wrap;
  font-size: 14px;
  line-height: 1.6;
}
.output-line { margin: 2px 0; }
.error { color: #ef4444; }
.warn { color: #eab308; }
.info { color: #6366f1; }
.success { color: #22c55e; }
#loading { color: #6366f1; font-size: 16px; }
#loading .spinner { 
  display: inline-block; 
  width: 20px; height: 20px; 
  border: 2px solid #6366f1; 
  border-top-color: transparent; 
  border-radius: 50%; 
  animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
</head><body>
<div id="loading"><span class="spinner"></span> Loading Python runtime...</div>
<div id="output"></div>
<script src="https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.js"></script>
<script>
(function() {
  const output = document.getElementById('output');
  const loading = document.getElementById('loading');
  
  function addLine(text, className) {
    const div = document.createElement('div');
    div.className = 'output-line ' + (className || '');
    div.textContent = text;
    output.appendChild(div);
    window.parent.postMessage({ type: 'console', logType: className || 'log', content: text }, '*');
  }

  async function run() {
    try {
      const pyodide = await loadPyodide({
        stdout: (text) => addLine(text, ''),
        stderr: (text) => addLine(text, 'error'),
      });
      
      loading.innerHTML = '<span class="success">✅ Python runtime loaded!</span>';
      window.parent.postMessage({ type: 'console', logType: 'success', content: '✅ Python runtime (Pyodide) loaded successfully!' }, '*');
      
      setTimeout(() => { loading.style.display = 'none'; }, 1500);
      
      // Install common packages if needed
      const code = ${JSON.stringify(code)};
      
      // Check for imports that need micropip
      const importRegex = /^(?:from|import)\\s+(\\w+)/gm;
      let m;
      const packagesToInstall = [];
      const builtins = new Set(['os', 'sys', 'math', 'random', 'json', 'datetime', 'time', 
        'collections', 'itertools', 'functools', 'operator', 'string', 're', 'io',
        'pathlib', 'typing', 'abc', 'copy', 'enum', 'dataclasses', 'statistics',
        'decimal', 'fractions', 'hashlib', 'hmac', 'secrets', 'base64',
        'struct', 'codecs', 'unicodedata', 'textwrap', 'difflib',
        'pprint', 'calendar', 'array', 'bisect', 'heapq',
        'contextlib', 'inspect', 'dis', 'ast', 'token', 'tokenize',
        'unittest', 'doctest', 'traceback', 'warnings', 'logging',
        'csv', 'configparser', 'argparse', 'getopt',
        'http', 'urllib', 'html', 'xml', 'email',
        'turtle', 'tkinter', 'socket', 'threading', 'multiprocessing',
        'subprocess', 'shutil', 'glob', 'tempfile', 'zipfile', 'tarfile',
        'gzip', 'bz2', 'lzma', 'pickle', 'shelve', 'sqlite3',
        'platform', 'ctypes', 'signal', 'mmap', 'gc', 'weakref',
        'pyodide', 'js', 'pyodide_js', '_pyodide',
      ]);
      
      while ((m = importRegex.exec(code)) !== null) {
        const pkg = m[1].toLowerCase();
        if (!builtins.has(pkg)) {
          packagesToInstall.push(pkg);
        }
      }
      
      if (packagesToInstall.length > 0) {
        addLine('📦 Installing packages: ' + packagesToInstall.join(', ') + '...', 'info');
        await pyodide.loadPackage('micropip');
        const micropip = pyodide.pyimport('micropip');
        for (const pkg of packagesToInstall) {
          try {
            await micropip.install(pkg);
            addLine('  ✅ ' + pkg + ' installed', 'success');
          } catch(e) {
            addLine('  ⚠️ Could not install ' + pkg + ': ' + e.message, 'warn');
          }
        }
      }
      
      addLine('─'.repeat(50), 'info');
      addLine('', '');
      
      await pyodide.runPythonAsync(code);
      
      addLine('', '');
      addLine('─'.repeat(50), 'info');
      addLine('✅ Execution completed successfully', 'success');
      window.parent.postMessage({ type: 'console', logType: 'success', content: '✅ Python execution completed' }, '*');
      
    } catch(e) {
      loading.style.display = 'none';
      addLine('❌ ' + e.message, 'error');
      window.parent.postMessage({ type: 'console', logType: 'error', content: '❌ ' + e.message }, '*');
    }
  }
  
  run();
})();
</script>
</body></html>`;

  return html;
}

// Generic code display
export function displayCode(code: string, filename: string, language: string, log: Logger): string {
  log(createMessage('warn', `⚠️ Direct execution of ${language} is not supported in browser.`));
  log(createMessage('info', `📄 Displaying code for: ${filename}`));
  
  const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  
  return `<!DOCTYPE html>
<html><head><style>
body { 
  font-family: 'JetBrains Mono', monospace; 
  background: #1a1a2e; 
  color: #e2e8f0; 
  padding: 20px; 
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
}
.warning-banner {
  background: linear-gradient(135deg, #3730a3, #4338ca);
  border: 1px solid #6366f1;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}
.warning-banner h2 { margin: 0 0 8px; font-size: 18px; }
.warning-banner p { margin: 4px 0; opacity: 0.8; font-size: 13px; }
pre { 
  background: #0f0f1a; 
  border: 1px solid #2a2a4a;
  border-radius: 8px; 
  padding: 16px; 
  overflow-x: auto;
  white-space: pre;
  tab-size: 4;
}
code { font-family: inherit; }
.line-num { 
  color: #4a4a6a; 
  user-select: none; 
  display: inline-block;
  width: 40px;
  text-align: right;
  margin-right: 16px;
}
</style></head><body>
<div class="warning-banner">
  <h2>📋 ${language.toUpperCase()} - Read Only Preview</h2>
  <p>File: ${filename}</p>
  <p>⚠️ This language requires a native runtime and cannot be executed directly in the browser.</p>
  <p>💡 For Python files, click "Run" to execute with Pyodide. For HTML files, they will render directly.</p>
</div>
<pre><code>${escaped.split('\n').map((line, i) => `<span class="line-num">${i + 1}</span>${line}`).join('\n')}</code></pre>
</body></html>`;
}

function resolveRelativePath(fromPath: string, toPath: string): string {
  if (!toPath.startsWith('.')) {
    // Try as-is from root
    return toPath;
  }
  const fromParts = fromPath.split('/').slice(0, -1);
  const toParts = toPath.split('/');
  
  for (const part of toParts) {
    if (part === '..') {
      fromParts.pop();
    } else if (part !== '.') {
      fromParts.push(part);
    }
  }
  return fromParts.join('/');
}

export function autoDetectEntry(files: FileNode[]): string | null {
  const allFiles = getAllFiles(files);
  
  // Priority order for entry files
  const priorities = [
    'index.html',
    'main.py',
    'app.py',
    'main.js',
    'index.js',
    'app.js',
    'main.ts',
    'index.ts',
    'script.js',
    'script.py',
    'run.py',
    'start.py',
  ];
  
  for (const p of priorities) {
    const found = allFiles.find(f => f.name.toLowerCase() === p.toLowerCase());
    if (found) return found.path;
  }
  
  // Find first HTML file
  const htmlFile = allFiles.find(f => f.name.endsWith('.html'));
  if (htmlFile) return htmlFile.path;
  
  // Find first Python file
  const pyFile = allFiles.find(f => f.name.endsWith('.py'));
  if (pyFile) return pyFile.path;
  
  // Find first JS file
  const jsFile = allFiles.find(f => f.name.endsWith('.js'));
  if (jsFile) return jsFile.path;
  
  return allFiles[0]?.path || null;
}
