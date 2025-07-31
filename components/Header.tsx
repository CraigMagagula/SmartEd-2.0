import React from 'react';
import { TrashIcon } from './icons';

interface HeaderProps {
    onClearChat: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onClearChat }) => {
  return (
    <header className="py-4 px-4 md:px-6 border-b border-gray-700/50 sticky top-0 bg-gray-900/50 backdrop-blur-sm z-10">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-md">
            A
          </div>
          <h1 className="text-2xl font-bold text-gray-100 tracking-tight">AdaptEd</h1>
        </div>
        <button
          onClick={onClearChat}
          className="flex items-center gap-2 px-3 py-2 bg-red-600/20 text-red-400 rounded-lg border border-red-500/30 hover:bg-red-600/40 transition-colors duration-200 text-sm"
          aria-label="Clear chat and document"
        >
          <TrashIcon className="w-4 h-4" />
          <span>Clear</span>
        </button>
      </div>
    </header>
  );
};