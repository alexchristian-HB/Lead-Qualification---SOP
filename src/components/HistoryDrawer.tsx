import React, { useState } from 'react';
import { X, Search, Trash2, FileText, ChevronRight, Download, Upload, RefreshCw } from 'lucide-react';
import { SavedLeadRecord } from '../types';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  savedLeads: SavedLeadRecord[];
  onSelectLead: (lead: SavedLeadRecord) => void;
  onDeleteLead: (id: string) => void;
  onClearAll: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  savedLeads,
  onSelectLead,
  onDeleteLead,
  onClearAll,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');

  if (!isOpen) return null;

  const filtered = savedLeads.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      item.report.leadTitle.toLowerCase().includes(term) ||
      item.report.prospectName.toLowerCase().includes(term) ||
      item.report.prospectCompany.toLowerCase().includes(term) ||
      item.report.assignedTier.toLowerCase().includes(term)
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-end">
      <div className="bg-slate-900 border-l border-slate-800 w-full max-w-md h-full flex flex-col shadow-2xl text-slate-200">
        
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="font-bold text-white text-sm flex items-center gap-2">
            <FileText className="w-4 h-4 text-sky-400" /> Saved Lead Reports ({savedLeads.length})
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-slate-800">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by prospect, company, tier..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {/* Lead List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs">
              No saved reports found.
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onSelectLead(item);
                  onClose();
                }}
                className="bg-slate-950 hover:bg-slate-800/80 border border-slate-800/80 hover:border-slate-700 p-3 rounded-lg transition-all cursor-pointer group flex items-center justify-between"
              >
                <div className="min-w-0 flex-1 pr-2">
                  <div className="flex items-center space-x-2 mb-1">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.2 rounded ${
                        item.report.assignedTier === 'PLATINUM'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : item.report.assignedTier === 'GOLD'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : item.report.assignedTier === 'SILVER'
                          ? 'bg-slate-700/50 text-slate-300 border border-slate-600'
                          : 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                      }`}
                    >
                      {item.report.assignedTier} ({item.report.finalCompositeScore}/12)
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(item.timestamp).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-white truncate group-hover:text-amber-400 transition-colors">
                    {item.report.leadTitle}
                  </h3>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {item.report.prospectName} {item.report.prospectCompany && `(${item.report.prospectCompany})`}
                  </p>
                </div>

                <div className="flex items-center space-x-1 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteLead(item.id);
                    }}
                    className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                    title="Delete record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 transition-colors" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer actions */}
        {savedLeads.length > 0 && (
          <div className="p-3 border-t border-slate-800 bg-slate-900 flex justify-between items-center text-xs">
            <span className="text-slate-400">{savedLeads.length} leads saved locally</span>
            <button
              onClick={onClearAll}
              className="text-red-400 hover:text-red-300 text-xs font-medium cursor-pointer"
            >
              Clear All History
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
