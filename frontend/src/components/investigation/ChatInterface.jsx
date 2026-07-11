import React, { useState, useRef, useEffect } from 'react';
import useRagQuery from '../../hooks/useRagQuery';
import MessageBubble from './MessageBubble';
import { Send } from 'lucide-react';

export default function ChatInterface({ onSourceSelect, onTagSelect }) {
  const { messages, sendQuery, isLoading } = useRagQuery();
  const [input, setInput] = useState('');
  const endOfMessagesRef = useRef(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendQuery(input.trim());
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 overflow-hidden relative">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <MessageBubble 
            key={msg.id} 
            message={msg} 
            onSourceSelect={onSourceSelect}
            onTagSelect={onTagSelect}
          />
        ))}
        <div ref={endOfMessagesRef} />
      </div>

      <div className="border-t border-slate-800 bg-slate-900 p-3 mt-auto">
        <div className="relative">
          <textarea
            className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-sm pl-3 pr-12 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-cobalt focus:border-cobalt resize-none placeholder-slate-500"
            rows={2}
            placeholder="Ask about incidents, equipment risks, safety procedures..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          <button
            className="absolute right-2 bottom-2 p-1.5 bg-cobalt hover:bg-blue-700 text-white rounded-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
