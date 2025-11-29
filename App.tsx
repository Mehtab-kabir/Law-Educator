import React, { useState } from 'react';
import DocumentSidebar from './components/DocumentSidebar';
import ChatInterface from './components/ChatInterface';

const App: React.FC = () => {
  const [isVectorReady, setIsVectorReady] = useState(false);
  const [isIndexing, setIsIndexing] = useState(false);

  const handleIndexStart = () => {
    setIsIndexing(true);
  };

  const handleIndexComplete = () => {
    setIsIndexing(false);
    setIsVectorReady(true);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100">
      <DocumentSidebar 
        onIndexStart={handleIndexStart}
        onIndexComplete={handleIndexComplete} 
        isIndexing={isIndexing}
      />
      
      <main className="flex-1 h-full relative">
        <ChatInterface isVectorReady={isVectorReady} />
      </main>
    </div>
  );
};

export default App;