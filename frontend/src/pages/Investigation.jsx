import React, { useState } from 'react';
import ChatInterface from '../components/investigation/ChatInterface';
import ContextViewer from '../components/investigation/ContextViewer';
import useKnowledgeGraph from '../hooks/useKnowledgeGraph';

import { useStore } from '../lib/store';

export default function Investigation() {
  const [selectedSource, setSelectedSource] = useState(null);
  const [equipmentRisks, setEquipmentRisks] = useState([]);
  
  const { getEquipmentRisks } = useKnowledgeGraph();
  const openModal = useStore((s) => s.openModal);

  const handleSourceSelect = (source) => {
    setSelectedSource(source);
    setEquipmentRisks([]);
  };

  const handleTagSelect = async (tag) => {
    setSelectedSource(null);
    try {
      const risks = await getEquipmentRisks(tag);
      setEquipmentRisks(risks);
    } catch (err) {
      console.error('Failed to fetch equipment risks:', err);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-112px)] w-full">
      {/* Header Section */}
      <div className="flex justify-between items-end mb-6 border-l-2 border-primary pl-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary uppercase tracking-tight">AI Safety Copilot</h1>
          <p className="font-mono text-[11px] font-bold tracking-widest text-on-surface-variant uppercase mt-1">Investigation Protocol</p>
        </div>
        <button 
          onClick={() => openModal('rca')}
          className="bg-primary/20 text-primary border border-primary/50 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-colors flex items-center gap-2 animate-pulse"
        >
          <span className="material-symbols-outlined text-sm">auto_awesome</span>
          Generate Auto-RCA
        </button>
      </div>

      <div className="flex flex-col lg:flex-row h-full gap-6 flex-1 min-h-0">
        {/* Left Pane: Chat Interface */}
        <div className="flex-1 bg-surface-container border border-outline-variant flex flex-col overflow-hidden inset-panel rounded-sm">
          <div className="flex justify-between items-center px-4 py-3 border-b border-outline-variant bg-surface-container-low">
            <h2 className="font-mono text-[11px] font-bold text-primary flex items-center gap-2 uppercase tracking-widest">
              <span className="material-symbols-outlined text-lg">terminal</span> 
              Multi-Agent Query Engine (RAG)
            </h2>
          </div>
          <div className="flex-1 min-h-0 relative">
            <ChatInterface 
              onSourceSelect={handleSourceSelect} 
              onTagSelect={handleTagSelect} 
            />
          </div>
        </div>
        
        {/* Right Pane: Context Inspector */}
        <div className="w-full lg:w-96 flex flex-col gap-6 h-full flex-shrink-0">
          <div className="bg-surface-container border border-outline-variant flex flex-col overflow-hidden flex-1 inset-panel rounded-sm">
            <div className="flex justify-between items-center px-4 py-3 border-b border-outline-variant bg-surface-container-low">
              <h2 className="font-mono text-[11px] font-bold text-tertiary-container flex items-center gap-2 uppercase tracking-widest">
                <span className="material-symbols-outlined text-lg">fact_check</span> 
                Context Inspector
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <ContextViewer 
                selectedSource={selectedSource} 
                equipmentRisks={equipmentRisks} 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
