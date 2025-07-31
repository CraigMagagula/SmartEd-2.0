import React from 'react';
import type { MindMapNode } from '../services/geminiService';

interface MindMapProps {
  node: MindMapNode;
}

const MindMap: React.FC<MindMapProps> = ({ node }) => {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <h2 className="text-xl font-bold text-slate-900 text-center mb-6">Generated Mind Map</h2>
      <div className="pl-4">
          <MindMapNodeComponent node={node} level={0} />
      </div>
    </div>
  );
};

const MindMapNodeComponent: React.FC<{ node: MindMapNode, level: number }> = ({ node, level }) => {
  const levelColors = [
    'text-violet-700', // level 0
    'text-sky-700',    // level 1
    'text-emerald-700', // level 2
    'text-amber-700',   // level 3
    'text-rose-700',    // level 4
  ];

  const color = levelColors[level % levelColors.length];

  return (
    <div className={level > 0 ? 'pl-6 border-l-2 border-slate-200' : ''}>
      <div className="relative pt-2">
        {level > 0 && <span className="absolute -left-[25px] top-5 w-6 h-[2px] bg-slate-200"></span>}
        <h3 className={`text-lg font-semibold ${color}`}>{node.topic}</h3>
        {node.children && node.children.length > 0 && (
          <div className="mt-2 space-y-2">
            {node.children.map((child, index) => (
              <MindMapNodeComponent key={index} node={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MindMap;