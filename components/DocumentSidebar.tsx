import React, { useState } from 'react';
import { BookOpen, FileText, Plus, Database, ShieldCheck } from 'lucide-react';
import { vectorStore } from '../services/vectorStore';
import { INITIAL_LEGAL_DOCS } from '../constants';

interface DocumentSidebarProps {
  onIndexStart: () => void;
  onIndexComplete: () => void;
  isIndexing: boolean;
}

const DocumentSidebar: React.FC<DocumentSidebarProps> = ({ onIndexStart, onIndexComplete, isIndexing }) => {
  const [stats, setStats] = useState(vectorStore.getStats());
  const [activeTab, setActiveTab] = useState<'existing' | 'upload'>('existing');
  const [customText, setCustomText] = useState('');
  const [customTitle, setCustomTitle] = useState('');

  const handleInitialize = async () => {
    if (isIndexing) return;
    onIndexStart();
    try {
      await vectorStore.addDocuments(INITIAL_LEGAL_DOCS);
      setStats(vectorStore.getStats());
    } catch (e) {
      console.error("Initialization error", e);
    } finally {
      onIndexComplete();
    }
  };

  const handleAddCustom = async () => {
    if (!customText || !customTitle || isIndexing) return;
    onIndexStart();
    
    try {
      await vectorStore.addDocuments([{ title: customTitle, content: customText }]);
      setStats(vectorStore.getStats());
      setCustomText('');
      setCustomTitle('');
      setActiveTab('existing');
    } catch (e) {
      console.error("Custom doc error", e);
    } finally {
      onIndexComplete();
    }
  };

  return (
    <div className="w-full md:w-80 bg-slate-900 text-slate-300 flex flex-col h-full border-r border-slate-800">
      <div className="p-6 border-b border-slate-800 bg-slate-950">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="text-amber-500 w-6 h-6" />
          <h1 className="text-xl font-bold text-white serif tracking-wide">PakLegal AI</h1>
        </div>
        <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold ml-8">RAG Educator</p>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        
        {/* Stats Card */}
        <div className="bg-slate-800/50 rounded-lg p-4 mb-6 border border-slate-700">
          <div className="flex items-center gap-2 mb-3 text-amber-500 font-medium text-sm">
            <Database className="w-4 h-4" />
            <span>Vector Database Status</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-2xl font-bold text-white">{stats.documents}</div>
              <div className="text-xs text-slate-400">Documents</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{stats.totalChunks}</div>
              <div className="text-xs text-slate-400">Vector Chunks</div>
            </div>
          </div>
        </div>

        {/* Initial Loader */}
        {stats.totalChunks === 0 && (
          <div className="mb-6">
             <button 
                onClick={handleInitialize}
                disabled={isIndexing}
                className="w-full py-3 px-4 bg-blue-700 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md font-medium text-sm transition-colors flex items-center justify-center gap-2"
              >
                {isIndexing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Indexing Law...
                  </>
                ) : (
                  <>
                    <BookOpen className="w-4 h-4" />
                    Load Pakistan Constitution
                  </>
                )}
              </button>
              <p className="text-xs text-slate-500 mt-2 text-center">
                Click to load initial legal dataset into memory.
              </p>
          </div>
        )}

        <div className="mb-4 flex border-b border-slate-700">
          <button 
            className={`flex-1 pb-2 text-sm font-medium transition-colors ${activeTab === 'existing' ? 'text-white border-b-2 border-amber-500' : 'text-slate-500 hover:text-slate-300'}`}
            onClick={() => setActiveTab('existing')}
          >
            Library
          </button>
          <button 
             className={`flex-1 pb-2 text-sm font-medium transition-colors ${activeTab === 'upload' ? 'text-white border-b-2 border-amber-500' : 'text-slate-500 hover:text-slate-300'}`}
             onClick={() => setActiveTab('upload')}
          >
            Add Doc
          </button>
        </div>

        {activeTab === 'existing' ? (
           <div className="space-y-2">
             <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">Indexed Documents</h3>
             {stats.totalChunks > 0 ? (
                <>
                  <div className="flex items-center gap-3 p-3 rounded bg-slate-800/30 border border-slate-800 text-sm">
                    <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                    <span className="truncate">Constitution of Pakistan (1973)</span>
                  </div>
                   <div className="flex items-center gap-3 p-3 rounded bg-slate-800/30 border border-slate-800 text-sm">
                    <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                    <span className="truncate">Pakistan Penal Code (PPC)</span>
                  </div>
                </>
             ) : (
               <div className="text-sm text-slate-500 italic">No documents indexed yet.</div>
             )}
           </div>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
             <div className="space-y-1">
               <label className="text-xs text-slate-400">Document Title</label>
               <input 
                  type="text" 
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. Contract Act 1872"
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:outline-none focus:border-amber-500"
               />
             </div>
             <div className="space-y-1">
               <label className="text-xs text-slate-400">Content (Paste text)</label>
               <textarea 
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Paste legal text here..."
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white h-32 focus:outline-none focus:border-amber-500 resize-none"
               />
             </div>
             <button 
                onClick={handleAddCustom}
                disabled={!customTitle || !customText || isIndexing}
                className="w-full py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded font-medium text-sm flex items-center justify-center gap-2 transition-colors"
             >
                {isIndexing ? 'Processing...' : (
                  <>
                    <Plus className="w-4 h-4" />
                    Index Document
                  </>
                )}
             </button>
          </div>
        )}

      </div>
      
      <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">
        Powered by Gemini & Chroma (Simulated)
      </div>
    </div>
  );
};

export default DocumentSidebar;