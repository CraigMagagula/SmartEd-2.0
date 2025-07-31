import React from 'react';
import { HomeIcon, TargetIcon, HelpCircleIcon, BookTextIcon, LibraryIcon, YoutubeIcon, CameraIcon, SparklesIcon, BarChartIcon, SmartEdIcon, FileQuestionIcon } from './icons';

interface SidebarProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

const navItems = [
  { name: 'Overview', icon: HomeIcon },
  { name: 'My Techniques', icon: TargetIcon },
  { name: 'Quiz Generator', icon: HelpCircleIcon },
  { name: 'Smart Notes & Summaries', icon: BookTextIcon },
  { name: 'Library', icon: LibraryIcon },
  { name: 'YouTube Search', icon: YoutubeIcon },
  { name: 'Photo Solver', icon: CameraIcon },
  { name: 'AI Study Coach', icon: SparklesIcon },
  { name: 'Test Papers', icon: FileQuestionIcon },
  { name: 'Progress', icon: BarChartIcon },
];

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage, isSidebarOpen, setIsSidebarOpen }) => {

  const handleItemClick = (page: string) => {
    setCurrentPage(page);
    setIsSidebarOpen(false); // Close sidebar on mobile after navigation
  };

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={`fixed inset-0 bg-black/60 z-30 lg:hidden transition-opacity ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsSidebarOpen(false)}
        aria-hidden="true"
      ></div>

      <aside className={`fixed lg:relative inset-y-0 left-0 w-64 bg-white border-r border-slate-200 flex flex-col z-40 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
              <SmartEdIcon className="w-9 h-9" />
              <span className="font-bold text-2xl text-slate-900">SmartEd</span>
          </div>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.name}
              onClick={() => handleItemClick(item.name)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                currentPage === item.name
                  ? 'bg-violet-600 text-white shadow'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
};
