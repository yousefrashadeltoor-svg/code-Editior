export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  content?: string;
  size?: number;
}

export interface OpenTab {
  path: string;
  name: string;
  modified: boolean;
}

export interface ConsoleMessage {
  type: 'log' | 'error' | 'warn' | 'info' | 'system' | 'success';
  content: string;
  timestamp: number;
}

export type Language = 
  | 'javascript' 
  | 'typescript' 
  | 'python' 
  | 'html' 
  | 'css' 
  | 'json' 
  | 'markdown'
  | 'text'
  | 'xml'
  | 'yaml'
  | 'java'
  | 'cpp'
  | 'c'
  | 'php'
  | 'ruby'
  | 'go'
  | 'rust'
  | 'shell';

export interface ProjectInfo {
  name: string;
  type: string;
  fileCount: number;
  totalSize: number;
}
