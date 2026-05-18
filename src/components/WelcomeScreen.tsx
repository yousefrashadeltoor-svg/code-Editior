import { useState, useRef, useCallback } from 'react';
import { Upload, FileCode, Zap, Globe, FolderOpen, Plus, Terminal, Code2, Layers } from 'lucide-react';

interface WelcomeScreenProps {
  onFileUpload: (file: File) => void;
  onNewProject: (template: string) => void;
  isLoading: boolean;
}

export default function WelcomeScreen({ onFileUpload, onNewProject, isLoading }: WelcomeScreenProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) onFileUpload(file);
  }, [onFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileUpload(file);
  }, [onFileUpload]);

  const templates = [
    { id: 'html', icon: <Globe size={24} />, label: 'HTML/CSS/JS', desc: 'Web project', color: 'from-orange-500 to-red-500' },
    { id: 'python', icon: <Terminal size={24} />, label: 'Python', desc: 'Python script', color: 'from-blue-500 to-cyan-500' },
    { id: 'javascript', icon: <Code2 size={24} />, label: 'JavaScript', desc: 'Node.js script', color: 'from-yellow-500 to-orange-500' },
    { id: 'react', icon: <Layers size={24} />, label: 'React', desc: 'React component', color: 'from-cyan-500 to-blue-500' },
  ];

  return (
    <div className="h-full w-full overflow-y-auto bg-gradient-to-br from-[#0a0a15] via-[#0f0f25] to-[#0a0a15]">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-6 shadow-lg shadow-indigo-500/25">
            <Zap size={40} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-3">
            CodeArena
          </h1>
          <p className="text-gray-400 text-lg max-w-md mx-auto">
            بيئة تطوير متكاملة في المتصفح — ارفع مشروعك وشغّله فوراً
          </p>
        </div>

        {/* Upload Zone */}
        <div
          className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 mb-10 ${
            isDragOver
              ? 'border-indigo-400 bg-indigo-500/10 scale-[1.02]'
              : 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]'
          } ${isLoading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip,.html,.htm,.py,.js,.ts,.jsx,.tsx,.css,.json,.txt,.md,.xml,.yaml,.yml,.java,.cpp,.c,.php,.rb,.go,.rs,.sh"
            className="hidden"
            onChange={handleFileSelect}
          />
          
          {isLoading ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-lg text-indigo-300">جاري استخراج الملفات...</p>
            </div>
          ) : (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 mb-4">
                <Upload size={32} className="text-indigo-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-200 mb-2">
                ارفع ملف أو مشروع مضغوط
              </h3>
              <p className="text-gray-500 mb-4">
                اسحب وأفلت ملف ZIP أو أي ملف كود هنا
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-white/5 text-xs text-gray-400">.zip</span>
                <span className="px-3 py-1 rounded-full bg-white/5 text-xs text-gray-400">.html</span>
                <span className="px-3 py-1 rounded-full bg-white/5 text-xs text-gray-400">.py</span>
                <span className="px-3 py-1 rounded-full bg-white/5 text-xs text-gray-400">.js/.ts</span>
                <span className="px-3 py-1 rounded-full bg-white/5 text-xs text-gray-400">.css</span>
                <span className="px-3 py-1 rounded-full bg-white/5 text-xs text-gray-400">+more</span>
              </div>
            </>
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-10">
          <div className="flex-1 h-px bg-white/5" />
          <span className="text-gray-600 text-sm uppercase tracking-wider">أو ابدأ مشروع جديد</span>
          <div className="flex-1 h-px bg-white/5" />
        </div>

        {/* Templates */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {templates.map((tmpl) => (
            <button
              key={tmpl.id}
              onClick={() => onNewProject(tmpl.id)}
              className="group relative overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] p-6 text-center hover:border-white/15 hover:bg-white/[0.04] transition-all duration-300"
            >
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${tmpl.color} mb-3 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all`}>
                {tmpl.icon}
              </div>
              <h4 className="text-sm font-semibold text-gray-300 mb-0.5">{tmpl.label}</h4>
              <p className="text-xs text-gray-600">{tmpl.desc}</p>
            </button>
          ))}
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <FolderOpen className="text-indigo-400 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <h4 className="text-sm font-semibold text-gray-300 mb-1">استخراج فوري</h4>
              <p className="text-xs text-gray-500">فك ضغط الملفات وتحليل المشروع تلقائياً مع عرض شجرة الملفات</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <FileCode className="text-green-400 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <h4 className="text-sm font-semibold text-gray-300 mb-1">محرر كود احترافي</h4>
              <p className="text-xs text-gray-500">تلوين أكواد، إكمال تلقائي، وتعديل مباشر بأحدث التقنيات</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <Plus className="text-purple-400 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <h4 className="text-sm font-semibold text-gray-300 mb-1">تشغيل متعدد اللغات</h4>
              <p className="text-xs text-gray-500">HTML, JavaScript, Python مع دعم Pyodide للتشغيل في المتصفح</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
