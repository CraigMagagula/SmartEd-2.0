import React, { useState, useRef, useEffect } from 'react';
import { CompassIcon, SettingsIcon, UserIcon, LogOutIcon, RocketIcon, MenuIcon } from './icons';

interface DashboardHeaderProps {
  onSignOut: () => void;
  onToggleSidebar: () => void;
}

const HeaderButton: React.FC<{
    onClick?: () => void;
    children: React.ReactNode;
    className?: string;
}> = ({ onClick, children, className }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 hover:text-slate-800 transition-colors ${className}`}
    >
        {children}
    </button>
);


export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onSignOut, onToggleSidebar }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 px-4 sm:px-6 py-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
            <button onClick={onToggleSidebar} className="lg:hidden text-slate-600 p-1 -ml-1">
                <MenuIcon className="w-6 h-6" />
            </button>
            <div className="hidden md:flex items-center gap-2 text-slate-600">
                <p>Welcome back, Alex! Ready to learn?</p>
                <RocketIcon className="w-5 h-5 text-amber-500" />
            </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
            <HeaderButton className="hidden md:flex">
                <CompassIcon className="w-4 h-4" />
                <span>Explore</span>
            </HeaderButton>

            <div className="relative" ref={dropdownRef}>
                <HeaderButton onClick={toggleDropdown}>
                    <UserIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">Account</span>
                </HeaderButton>

                {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 border border-slate-200">
                        <a href="#" className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
                            <UserIcon className="w-4 h-4" />
                            Profile
                        </a>
                        <a href="#" className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
                            <SettingsIcon className="w-4 h-4" />
                            Settings
                        </a>
                    </div>
                )}
            </div>
            
            <HeaderButton onClick={onSignOut} className="bg-red-600 text-white hover:bg-red-700 border-red-700">
                <LogOutIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
            </HeaderButton>
        </div>
      </div>
    </header>
  );
};
