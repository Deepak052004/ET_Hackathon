import React from 'react';
import ConfidenceBadge from '../ui/ConfidenceBadge';
import CitationCard from './CitationCard';
import EquipmentTagList from './EquipmentTagList';
import { AlertTriangle, AlertCircle } from 'lucide-react';

export default function MessageBubble({ message, onSourceSelect, onTagSelect }) {
  const { role, content, confidence, sources, isThinking, isTimeout, isError, timestamp } = message;
  
  const isUser = role === 'user';
  
  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-fade-in-down`}>
      <div 
        className={`rounded-sm p-3 max-w-[85%] text-sm ${
          isUser 
            ? 'bg-cobalt/20 border border-blue-900 text-slate-100' 
            : 'bg-slate-800 border border-slate-700 text-slate-200'
        }`}
      >
        {isThinking ? (
          <div className="flex items-center gap-1 text-slate-400 font-mono tracking-widest animate-pulse">
            ●●●
          </div>
        ) : isTimeout ? (
          <div className="flex items-start gap-2 text-amber-400">
            <AlertTriangle size={18} className="mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-semibold mb-1">Response Timeout</div>
              <div className="text-amber-500/80">{content}</div>
            </div>
          </div>
        ) : isError ? (
          <div className="flex items-start gap-2 text-red-400">
            <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
            <div>{content}</div>
          </div>
        ) : (
          <div className="space-y-3">
            <div dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br/>') }} />
            
            {/* Parsed equipment tags */}
            <EquipmentTagList text={content} onTagSelect={onTagSelect} />
            
            {confidence && (
              <div className="mt-2 pt-2 border-t border-slate-700/50 flex justify-end">
                <ConfidenceBadge score={confidence} />
              </div>
            )}
            
            {sources && sources.length > 0 && (
              <div className="mt-3 space-y-1">
                <div className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Sources</div>
                {sources.map((src, idx) => (
                  <CitationCard key={idx} source={src} onSelect={() => onSourceSelect(src)} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="text-[10px] text-slate-500 mt-1 mx-1">
        {timestamp ? new Date(timestamp).toLocaleTimeString() : ''}
      </div>
    </div>
  );
}
