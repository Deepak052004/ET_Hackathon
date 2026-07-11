import React, { useState } from 'react';
import SectionHeader from '../components/ui/SectionHeader';
import ChatInterface from '../components/investigation/ChatInterface';
import ContextViewer from '../components/investigation/ContextViewer';
import { SearchCode, FileText } from 'lucide-react';
import useKnowledgeGraph from '../hooks/useKnowledgeGraph';

export default function Investigation() {
  const [selectedSource, setSelectedSource] = useState(null);
  const [equipmentRisks, setEquipmentRisks] = useState([]);
  
  const { getEquipmentRisks } = useKnowledgeGraph();

  const handleSourceSelect = (source) => {
    setSelectedSource(source);
    setEquipmentRisks([]); // Clear equipment risks when showing a source
  };

  const handleTagSelect = async (tag) => {
    setSelectedSource(null); // Clear source when showing equipment
    try {
      const risks = await getEquipmentRisks(tag);
      setEquipmentRisks(risks);
    } catch (err) {
      console.error('Failed to fetch equipment risks:', err);
      // fallback or error handling could go here
    }
  };

  return (
    <div className="flex h-full gap-4" style={{ height: 'calc(100vh - 110px)' }}>
      {/* Left Pane: Chat Interface */}
      <div className="flex-1 panel flex flex-col overflow-hidden h-full">
        <SectionHeader 
          title="AI Safety Copilot" 
          icon={SearchCode} 
          className="p-4 border-b border-slate-800 m-0 bg-slate-900"
        />
        <div className="flex-1 min-h-0">
          <ChatInterface 
            onSourceSelect={handleSourceSelect} 
            onTagSelect={handleTagSelect} 
          />
        </div>
      </div>
      
      {/* Right Pane: Context Inspector */}
      <div className="w-96 flex flex-col gap-4 h-full">
        <div className="panel flex-1 flex flex-col overflow-hidden">
          <SectionHeader 
            title="Context Inspector" 
            icon={FileText} 
            className="p-4 border-b border-slate-800 m-0 bg-slate-900 flex-shrink-0" 
          />
          <div className="flex-1 overflow-y-auto p-4">
            <ContextViewer 
              selectedSource={selectedSource} 
              equipmentRisks={equipmentRisks} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
