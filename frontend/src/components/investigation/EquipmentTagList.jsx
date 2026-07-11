import React, { useMemo } from 'react';
import { Tag } from 'lucide-react';

export default function EquipmentTagList({ text, onTagSelect }) {
  const tags = useMemo(() => {
    if (!text) return [];
    // Regex for equipment tags like PUMP-D-401, COMP-B-201, GAS_H2S-A-01, etc.
    const regex = /\b([A-Z]{2,}_?[A-Z0-9]*-[A-Z0-9]+-\d+[A-Z]?)\b/g;
    const matches = [...text.matchAll(regex)].map(m => m[1]);
    return [...new Set(matches)];
  }, [text]);

  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-3 pt-2 border-t border-slate-700/30">
      {tags.map(tag => (
        <button
          key={tag}
          onClick={() => onTagSelect(tag)}
          className="flex items-center gap-1.5 font-mono text-xs text-slate-300 bg-slate-800 border border-slate-700 hover:border-cobalt hover:text-cobalt px-2 py-1 rounded-sm transition-colors cursor-pointer"
        >
          <Tag size={12} className="opacity-70" />
          {tag}
        </button>
      ))}
    </div>
  );
}
