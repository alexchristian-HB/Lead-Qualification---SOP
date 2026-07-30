import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { LeadInputForm } from './components/LeadInputForm';
import { ReportViewer } from './components/ReportViewer';
import { SOPQuickGuideModal } from './components/SOPQuickGuideModal';
import { HistoryDrawer } from './components/HistoryDrawer';
import { InboundLeadInput, LeadQualificationReport, SavedLeadRecord } from './types';
import { AlertCircle, FileCheck2, Sparkles, ShieldCheck, RefreshCw } from 'lucide-react';

const LOCAL_STORAGE_KEY = 'hb_lead_qualification_history_v1';

export default function App() {
  const [activeReport, setActiveReport] = useState<LeadQualificationReport | null>(null);
  const [currentInput, setCurrentInput] = useState<InboundLeadInput | null>(null);
  const [savedLeads, setSavedLeads] = useState<SavedLeadRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSOPOpen, setIsSOPOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);

  // Load saved leads from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        setSavedLeads(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to parse saved leads from localStorage:', e);
    }
  }, []);

  // Save leads to localStorage whenever savedLeads changes
  const saveToHistory = (newRecord: SavedLeadRecord) => {
    setSavedLeads((prev) => {
      const updated = [newRecord, ...prev.filter((item) => item.id !== newRecord.id)];
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save to localStorage:', e);
      }
      return updated;
    });
  };

  const handleDeleteLead = (id: string) => {
    setSavedLeads((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to update localStorage:', e);
      }
      return updated;
    });
  };

  const handleClearAllHistory = () => {
    setSavedLeads([]);
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear localStorage:', e);
    }
  };

  // Submit Lead Input for Qualification
  const handleQualifyLead = async (input: InboundLeadInput) => {
    setIsLoading(true);
    setErrorMessage(null);
    setCurrentInput(input);

    try {
      let res = await fetch('/api/qualify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      // Fallback for static PHP shared hosting
      if (!res.ok && res.status === 404) {
        res = await fetch('./api.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(input),
        });
      }

      let data;
      try {
        data = await res.json();
      } catch (jsonErr) {
        throw new Error('Server returned invalid response format. Ensure web server rewrite rules or api.php are enabled.');
      }

      if (!res.ok || !data.success || !data.report) {
        const errorText = data.error || 'Failed to qualify lead.';
        const detailsText = data.details ? ` Details: ${data.details}` : '';
        throw new Error(`${errorText}${detailsText}`);
      }

      const report: LeadQualificationReport = data.report;
      setActiveReport(report);

      // Save to history
      const record: SavedLeadRecord = {
        id: report.leadId,
        timestamp: report.createdAt,
        input,
        report,
      };
      saveToHistory(record);

      // Smooth scroll to report
      setTimeout(() => {
        const reportEl = document.getElementById('qualification-report-printable');
        if (reportEl) {
          reportEl.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);

    } catch (err: any) {
      console.error('Qualification error:', err);
      setErrorMessage(err?.message || 'An unexpected error occurred while communicating with Gemini.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle report manual score updates
  const handleUpdateReport = (updatedReport: LeadQualificationReport) => {
    setActiveReport(updatedReport);
    if (currentInput) {
      const record: SavedLeadRecord = {
        id: updatedReport.leadId,
        timestamp: updatedReport.createdAt,
        input: currentInput,
        report: updatedReport,
      };
      saveToHistory(record);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased">
      
      {/* Header */}
      <Header
        onOpenSOP={() => setIsSOPOpen(true)}
        onToggleHistory={() => setIsHistoryOpen(true)}
        savedCount={savedLeads.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Intro SOP Bar */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-slate-200">Global Inbound Leads Qualification Standard Operating Procedure</p>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Evaluates Axis 1 (Entity Type), Axis 2 (Paying Capacity Geography), Axis 3 (Readiness) + Red Flags & Thin Info Protocol.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsSOPOpen(true)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-medium rounded-lg transition-colors cursor-pointer text-xs shrink-0"
          >
            View SOP Scoring Matrix →
          </button>
        </div>

        {/* Input Form Section */}
        <LeadInputForm onSubmit={handleQualifyLead} isLoading={isLoading} />

        {/* Error Display */}
        {errorMessage && (
          <div className="bg-red-950/60 border border-red-500/40 rounded-xl p-4 text-xs text-red-300 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold text-red-200 text-sm mb-1">Qualification Error</strong>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Generated Report Section */}
        {activeReport && (
          <ReportViewer report={activeReport} onUpdateReport={handleUpdateReport} />
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>HiddenBrains Business Analyst Intelligence Engine • Global Inbound SOP Compliance</p>
      </footer>

      {/* SOP Reference Guide Modal */}
      <SOPQuickGuideModal isOpen={isSOPOpen} onClose={() => setIsSOPOpen(false)} />

      {/* History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        savedLeads={savedLeads}
        onSelectLead={(item) => {
          setActiveReport(item.report);
          setCurrentInput(item.input);
        }}
        onDeleteLead={handleDeleteLead}
        onClearAll={handleClearAllHistory}
      />

    </div>
  );
}
