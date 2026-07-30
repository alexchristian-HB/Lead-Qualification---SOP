import React from 'react';
import { ShieldCheck, BookOpen, Sparkles, History, FileText } from 'lucide-react';

interface HeaderProps {
  onOpenSOP: () => void;
  onToggleHistory: () => void;
  savedCount: number;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSOP, onToggleHistory, savedCount }) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Branding */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-amber-500 via-orange-600 to-red-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-orange-950/40">
            HB
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-bold text-lg tracking-tight text-slate-100">HiddenBrains</h1>
              <span className="px-2 py-0.5 text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" /> BA Lead SOP
              </span>
            </div>
            <p className="text-xs text-slate-400">Global Inbound Lead Qualification & Approach Engine</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenSOP}
            className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer"
            id="open-sop-btn"
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>SOP Reference</span>
          </button>

          <button
            onClick={onToggleHistory}
            className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer relative"
            id="toggle-history-btn"
          >
            <History className="w-4 h-4 text-sky-400" />
            <span>Saved Leads</span>
            {savedCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold bg-sky-500 text-white rounded-full">
                {savedCount}
              </span>
            )}
          </button>

          <div className="hidden sm:flex items-center space-x-1 text-xs text-slate-400 pl-2 border-l border-slate-800">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Gemini AI Standard</span>
          </div>
        </div>
      </div>
    </header>
  );
};
