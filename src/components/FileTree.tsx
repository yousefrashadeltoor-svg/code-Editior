import { useState, useCallback } from 'react';
import { FileNode } from '../types';
import { getFileIcon, getFolderIcon } from '../utils/fileUtils';
import { ChevronRight, ChevronDown, Search } from 'lucide-react';

interface FileTreeProps {
  files: FileNode[];
  activeFile: string | null;
  onFileSelect: (path: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

function TreeNode({ 
  node, 
  depth, 
  activeFile, 
  onFileSelect,
  searchQuery,
  defaultOpen,
}: { 
  node: FileNode; 
  depth: number; 
  activeFile: string | null;
  onFileSelect: (path: string) => void;
  searchQuery: string;
  defaultOpen: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen || depth < 1);
  
  const matchesSearch = searchQuery && 
    node.name.toLowerCase().includes(searchQuery.toLowerCase());

  const hasMatchingChildren = useCallback((): boolean => {
    if (!searchQuery) return true;
    if (matchesSearch) return true;
    if (node.children) {
      return node.children.some(child => {
        if (child.name.toLowerCase().includes(searchQuery.toLowerCase())) return true;
        if (child.children) return true; // check deeper
        return false;
      });
    }
    return false;
  }, [searchQuery, matchesSearch, node]);

  if (searchQuery && !matchesSearch && !hasMatchingChildren()) {
    return null;
  }
  
  if (node.type === 'directory') {
    const shouldBeOpen = searchQuery ? true : isOpen;
    
    return (
      <div className="animate-fade-in">
        <div
          className={`file-tree-item flex items-center gap-1.5 px-2 py-1 cursor-pointer select-none rounded-md mx-1 my-0.5`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="text-gray-500 w-4 h-4 flex items-center justify-center flex-shrink-0">
            {shouldBeOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
          <span className="text-sm flex-shrink-0">{getFolderIcon(node.name, shouldBeOpen)}</span>
          <span className="text-sm text-gray-300 truncate font-medium">{node.name}</span>
          {node.children && (
            <span className="text-[10px] text-gray-600 ml-auto flex-shrink-0">
              {node.children.length}
            </span>
          )}
        </div>
        {shouldBeOpen && node.children && (
          <div>
            {node.children.map((child) => (
              <TreeNode
                key={child.path}
                node={child}
                depth={depth + 1}
                activeFile={activeFile}
                onFileSelect={onFileSelect}
                searchQuery={searchQuery}
                defaultOpen={depth < 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const isActive = activeFile === node.path;

  return (
    <div
      className={`file-tree-item flex items-center gap-1.5 px-2 py-1 cursor-pointer select-none rounded-md mx-1 my-0.5 ${
        isActive ? 'active' : ''
      } ${matchesSearch ? 'bg-indigo-500/10' : ''}`}
      style={{ paddingLeft: `${depth * 16 + 24}px` }}
      onClick={() => onFileSelect(node.path)}
    >
      <span className="text-sm flex-shrink-0">{getFileIcon(node.name)}</span>
      <span className={`text-sm truncate ${isActive ? 'text-indigo-300 font-medium' : 'text-gray-400'}`}>
        {node.name}
      </span>
    </div>
  );
}

export default function FileTree({ files, activeFile, onFileSelect, searchQuery, onSearchChange }: FileTreeProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Search */}
      <div className="p-2 border-b border-white/5">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 focus:bg-white/8 transition-colors"
          />
        </div>
      </div>
      
      {/* Tree */}
      <div className="flex-1 overflow-y-auto py-1">
        {files.map((node) => (
          <TreeNode
            key={node.path}
            node={node}
            depth={0}
            activeFile={activeFile}
            onFileSelect={onFileSelect}
            searchQuery={searchQuery}
            defaultOpen={true}
          />
        ))}
      </div>
    </div>
  );
}
