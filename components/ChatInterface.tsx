import React, { useState, useRef, useEffect } from 'react';
import { Send, Scale, AlertCircle, RefreshCw } from 'lucide-react';
import { Message, MessageRole, SearchResult } from '../types';
import { generateLegalResponse } from '../services/gemini';
import { vectorStore } from '../services/vectorStore';
import MarkdownRenderer from './MarkdownRenderer';

interface ChatInterfaceProps {
  isVectorReady: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ isVectorReady }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: MessageRole.MODEL,
      content: "Greetings. I am your legal assistant for Pakistan Law. Once the database is loaded, you may ask questions regarding the Constitution, Penal Code, or other indexed documents.",
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    if (!isVectorReady) {
      alert("Please load the legal documents from the sidebar first.");
      return;
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: MessageRole.USER,
      content: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // 1. Retrieval (RAG)
      const relevantChunks: SearchResult[] = await vectorStore.search(userMsg.content);
      
      // 2. Generation (Gemini)
      const answerText = await generateLegalResponse(messages, relevantChunks, userMsg.content);

      const modelMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: MessageRole.MODEL,
        content: answerText,
        sources: relevantChunks,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, modelMsg]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: MessageRole.MODEL,
        content: "I apologize, but I encountered an error while processing your legal query.",
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      {/* Header */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 justify-between shadow-sm z-10">
        <div className="flex items-center gap-2 text-slate-800">
          <Scale className="w-5 h-5 text-amber-600" />
          <h2 className="font-bold text-lg serif">Legal Counsel Interface</h2>
        </div>
        {!isVectorReady && (
           <div className="flex items-center gap-2 text-amber-600 text-sm bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
             <AlertCircle className="w-4 h-4" />
             <span>Database not indexed</span>
           </div>
        )}
      </header>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6"
      >
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.role === MessageRole.USER ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-3xl w-full ${msg.role === MessageRole.USER ? 'flex justify-end' : ''}`}>
              <div 
                className={`
                  p-6 rounded-lg shadow-sm border
                  ${msg.role === MessageRole.USER 
                    ? 'bg-blue-600 text-white border-blue-700 rounded-br-none' 
                    : 'bg-white text-slate-800 border-slate-200 rounded-bl-none'}
                `}
              >
                {/* Message Content */}
                <div className={msg.role === MessageRole.USER ? 'text-white' : ''}>
                  {msg.role === MessageRole.USER ? (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <MarkdownRenderer content={msg.content} />
                  )}
                </div>

                {/* Sources Section (RAG) */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Scale className="w-3 h-3" />
                      Legal Sources Consulted
                    </p>
                    <div className="grid gap-2">
                      {msg.sources.map((source, idx) => (
                        <div key={idx} className="bg-slate-50 p-2 rounded border border-slate-100 text-xs text-slate-600">
                          <span className="font-semibold text-blue-800 block mb-1">{source.source}</span>
                          <p className="line-clamp-2 italic opacity-80">"{source.text}"</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
             <div className="bg-white p-4 rounded-lg rounded-bl-none shadow-sm border border-slate-200 flex items-center gap-3">
                <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                <span className="text-sm text-slate-500">Analyzing legal precedents...</span>
             </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isVectorReady ? "Ask a question about Pakistan Law..." : "Please load documents first..."}
            disabled={!isVectorReady || isLoading}
            className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-inner"
            rows={2}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || !isVectorReady || isLoading}
            className="absolute right-3 top-3 p-2 bg-blue-700 text-white rounded-md hover:bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-center text-xs text-slate-400 mt-2">
          AI can make mistakes. Verify important legal information with official statutes.
        </p>
      </div>
    </div>
  );
};

export default ChatInterface;
