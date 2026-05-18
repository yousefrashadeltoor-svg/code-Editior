import JSZip from 'jszip';
import { FileNode, Language } from '../types';

const extensionToLanguage: Record<string, Language> = {
  js: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  mjs: 'javascript',
  cjs: 'javascript',
  py: 'python',
  pyw: 'python',
  html: 'html',
  htm: 'html',
  css: 'css',
  scss: 'css',
  sass: 'css',
  less: 'css',
  json: 'json',
  md: 'markdown',
  markdown: 'markdown',
  xml: 'xml',
  svg: 'xml',
  yaml: 'yaml',
  yml: 'yaml',
  java: 'java',
  cpp: 'cpp',
  cc: 'cpp',
  cxx: 'cpp',
  h: 'c',
  hpp: 'cpp',
  c: 'c',
  php: 'php',
  rb: 'ruby',
  go: 'go',
  rs: 'rust',
  sh: 'shell',
  bash: 'shell',
  bat: 'shell',
  ps1: 'shell',
  txt: 'text',
  log: 'text',
  env: 'text',
  gitignore: 'text',
  dockerfile: 'shell',
  toml: 'text',
  ini: 'text',
  cfg: 'text',
  conf: 'text',
};

export function getLanguage(filename: string): Language {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const basename = filename.toLowerCase();
  if (basename === 'dockerfile') return 'shell';
  if (basename === 'makefile') return 'shell';
  return extensionToLanguage[ext] || 'text';
}

export function getFileIcon(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const basename = filename.toLowerCase();
  
  if (basename === 'package.json') return '📦';
  if (basename === 'dockerfile') return '🐳';
  if (basename === 'readme.md') return '📖';
  if (basename === '.gitignore') return '🙈';
  if (basename === 'license') return '📜';
  if (basename === 'makefile') return '⚙️';
  
  const iconMap: Record<string, string> = {
    js: '🟨', jsx: '⚛️', ts: '🔷', tsx: '⚛️',
    py: '🐍', html: '🌐', htm: '🌐', css: '🎨',
    scss: '🎨', json: '📋', md: '📝', xml: '📄',
    svg: '🖼️', yaml: '⚙️', yml: '⚙️', java: '☕',
    cpp: '⚡', c: '⚡', h: '📎', hpp: '📎',
    php: '🐘', rb: '💎', go: '🔵', rs: '🦀',
    sh: '💻', bash: '💻', bat: '💻', sql: '🗃️',
    txt: '📄', log: '📋', env: '🔐', toml: '⚙️',
    png: '🖼️', jpg: '🖼️', jpeg: '🖼️', gif: '🖼️',
    ico: '🖼️', mp3: '🎵', mp4: '🎬', zip: '📦',
    tar: '📦', gz: '📦',
  };
  return iconMap[ext] || '📄';
}

export function getFolderIcon(name: string, isOpen: boolean): string {
  const nameL = name.toLowerCase();
  if (nameL === 'node_modules') return '📦';
  if (nameL === 'src' || nameL === 'source') return isOpen ? '📂' : '💻';
  if (nameL === 'public' || nameL === 'static' || nameL === 'assets') return isOpen ? '📂' : '🌍';
  if (nameL === 'tests' || nameL === 'test' || nameL === '__tests__') return isOpen ? '📂' : '🧪';
  if (nameL === 'docs' || nameL === 'documentation') return isOpen ? '📂' : '📚';
  if (nameL === 'config' || nameL === 'configs') return isOpen ? '📂' : '⚙️';
  if (nameL === 'dist' || nameL === 'build' || nameL === 'out') return isOpen ? '📂' : '📤';
  if (nameL === '.git') return '🔀';
  if (nameL === 'components') return isOpen ? '📂' : '🧩';
  if (nameL === 'utils' || nameL === 'helpers') return isOpen ? '📂' : '🔧';
  if (nameL === 'styles') return isOpen ? '📂' : '🎨';
  return isOpen ? '📂' : '📁';
}

const binaryExtensions = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'bmp', 'ico', 'webp', 'svg',
  'mp3', 'mp4', 'wav', 'avi', 'mkv', 'mov', 'flv',
  'zip', 'tar', 'gz', 'rar', '7z', 'bz2',
  'exe', 'dll', 'so', 'dylib', 'bin',
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
  'woff', 'woff2', 'ttf', 'eot', 'otf',
  'pyc', 'pyo', 'class', 'o', 'obj',
]);

export function isBinaryFile(filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return binaryExtensions.has(ext);
}

export async function extractZip(file: File): Promise<FileNode[]> {
  const zip = new JSZip();
  const contents = await zip.loadAsync(file);
  
  const fileMap = new Map<string, FileNode>();
  const rootNodes: FileNode[] = [];
  
  // Collect all entries
  const entries: { path: string; isDir: boolean; zipObj: JSZip.JSZipObject | null }[] = [];
  
  contents.forEach((relativePath, zipEntry) => {
    // Skip macOS metadata
    if (relativePath.startsWith('__MACOSX/') || relativePath.includes('.DS_Store')) return;
    entries.push({ path: relativePath, isDir: zipEntry.dir, zipObj: zipEntry });
  });

  // Sort to ensure parents come before children
  entries.sort((a, b) => a.path.localeCompare(b.path));

  // Detect common root prefix
  let commonPrefix = '';
  const topLevel = new Set<string>();
  for (const e of entries) {
    const firstPart = e.path.split('/')[0];
    topLevel.add(firstPart);
  }
  if (topLevel.size === 1) {
    const single = [...topLevel][0];
    const singleEntry = entries.find(e => e.path === single + '/' && e.isDir);
    if (singleEntry) {
      commonPrefix = single + '/';
    }
  }

  for (const entry of entries) {
    let path = entry.path;
    if (commonPrefix && path.startsWith(commonPrefix)) {
      path = path.substring(commonPrefix.length);
    }
    if (!path || path === '/') continue;
    
    // Remove trailing slash for dirs
    const cleanPath = path.endsWith('/') ? path.slice(0, -1) : path;
    if (!cleanPath) continue;
    
    const parts = cleanPath.split('/');
    const name = parts[parts.length - 1];
    
    if (entry.isDir) {
      const node: FileNode = {
        name,
        path: cleanPath,
        type: 'directory',
        children: [],
      };
      fileMap.set(cleanPath, node);
      
      if (parts.length === 1) {
        rootNodes.push(node);
      } else {
        const parentPath = parts.slice(0, -1).join('/');
        const parent = fileMap.get(parentPath);
        if (parent && parent.children) {
          parent.children.push(node);
        }
      }
    } else {
      let content = '';
      let size = 0;
      
      if (!isBinaryFile(name) && entry.zipObj) {
        try {
          content = await entry.zipObj.async('string');
          size = content.length;
        } catch {
          content = '[Binary file - cannot display]';
          size = 0;
        }
      } else {
        if (entry.zipObj) {
          const data = await entry.zipObj.async('uint8array');
          size = data.length;
        }
        content = `[Binary file: ${name}]`;
      }
      
      const node: FileNode = {
        name,
        path: cleanPath,
        type: 'file',
        content,
        size,
      };
      fileMap.set(cleanPath, node);
      
      if (parts.length === 1) {
        rootNodes.push(node);
      } else {
        const parentPath = parts.slice(0, -1).join('/');
        let parent = fileMap.get(parentPath);
        if (!parent) {
          // Create missing parent directories
          for (let i = 0; i < parts.length - 1; i++) {
            const dirPath = parts.slice(0, i + 1).join('/');
            if (!fileMap.has(dirPath)) {
              const dirNode: FileNode = {
                name: parts[i],
                path: dirPath,
                type: 'directory',
                children: [],
              };
              fileMap.set(dirPath, dirNode);
              if (i === 0) {
                rootNodes.push(dirNode);
              } else {
                const pPath = parts.slice(0, i).join('/');
                const p = fileMap.get(pPath);
                if (p && p.children) p.children.push(dirNode);
              }
            }
          }
          parent = fileMap.get(parentPath);
        }
        if (parent && parent.children) {
          parent.children.push(node);
        }
      }
    }
  }
  
  // Sort: directories first, then alphabetically
  const sortNodes = (nodes: FileNode[]) => {
    nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    for (const node of nodes) {
      if (node.children) sortNodes(node.children);
    }
  };
  sortNodes(rootNodes);
  
  return rootNodes;
}

export function findNode(nodes: FileNode[], path: string): FileNode | null {
  for (const node of nodes) {
    if (node.path === path) return node;
    if (node.children) {
      const found = findNode(node.children, path);
      if (found) return found;
    }
  }
  return null;
}

export function countFiles(nodes: FileNode[]): number {
  let count = 0;
  for (const node of nodes) {
    if (node.type === 'file') count++;
    if (node.children) count += countFiles(node.children);
  }
  return count;
}

export function totalSize(nodes: FileNode[]): number {
  let size = 0;
  for (const node of nodes) {
    if (node.type === 'file' && node.size) size += node.size;
    if (node.children) size += totalSize(node.children);
  }
  return size;
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function detectProjectType(nodes: FileNode[]): string {
  const hasFile = (name: string): boolean => {
    return nodes.some(n => n.name.toLowerCase() === name.toLowerCase());
  };
  
  if (hasFile('package.json')) return 'Node.js / JavaScript';
  if (hasFile('requirements.txt') || hasFile('setup.py') || hasFile('pyproject.toml')) return 'Python';
  if (hasFile('pom.xml') || hasFile('build.gradle')) return 'Java';
  if (hasFile('cargo.toml')) return 'Rust';
  if (hasFile('go.mod')) return 'Go';
  if (hasFile('gemfile')) return 'Ruby';
  if (hasFile('composer.json')) return 'PHP';
  if (hasFile('dockerfile')) return 'Docker';
  if (hasFile('index.html')) return 'HTML/Web';
  
  return 'Unknown';
}

export function getAllFiles(nodes: FileNode[]): FileNode[] {
  const files: FileNode[] = [];
  const walk = (list: FileNode[]) => {
    for (const node of list) {
      if (node.type === 'file') files.push(node);
      if (node.children) walk(node.children);
    }
  };
  walk(nodes);
  return files;
}
