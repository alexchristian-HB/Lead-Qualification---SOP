import React, { useState } from 'react';
import { Mail, Paperclip, Send, Sparkles, FileText, X, AlertCircle, HelpCircle, Info } from 'lucide-react';
import { AttachmentFile, InboundLeadInput } from '../types';
import { SAMPLE_LEADS, SampleLeadPreset } from '../data/sampleLeads';

interface LeadInputFormProps {
  onSubmit: (input: InboundLeadInput) => Promise<void>;
  isLoading: boolean;
}

export const LeadInputForm: React.FC<LeadInputFormProps> = ({ onSubmit, isLoading }) => {
  const [emailSubject, setEmailSubject] = useState<string>('');
  const [senderName, setSenderName] = useState<string>('');
  const [senderEmail, setSenderEmail] = useState<string>('');
  const [rawText, setRawText] = useState<string>('');
  const [baOverrideNotes, setBaOverrideNotes] = useState<string>('');
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  // Load sample preset
  const handleSelectPreset = (preset: SampleLeadPreset) => {
    setEmailSubject(preset.subject);
    setSenderName(preset.senderName);
    setSenderEmail(preset.senderEmail);
    setRawText(preset.rawText);
    setBaOverrideNotes(preset.baOverrideNotes || '');
    setAttachments([]);
    setFormError(null);
  };

  // Clear form
  const handleClear = () => {
    setEmailSubject('');
    setSenderName('');
    setSenderEmail('');
    setRawText('');
    setBaOverrideNotes('');
    setAttachments([]);
    setFormError(null);
  };

  // Handle file uploads
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files: File[] = Array.from(e.target.files);

    files.forEach((file: File) => {
      const reader = new FileReader();
      const isText = file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md') || file.name.endsWith('.json') || file.name.endsWith('.csv');

      if (isText) {
        reader.onload = (event) => {
          const content = event.target?.result as string;
          setAttachments((prev) => [
            ...prev,
            { fileName: file.name, fileType: file.type || 'text/plain', size: file.size, content },
          ]);
        };
        reader.readAsText(file);
      } else {
        reader.onload = (event) => {
          const content = event.target?.result as string; // Base64 data URL
          setAttachments((prev) => [
            ...prev,
            { fileName: file.name, fileType: file.type || 'application/octet-stream', size: file.size, content },
          ]);
        };
        reader.readAsDataURL(file);
      }
    });
    // Reset file input
    e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim()) {
      setFormError('Please paste the email thread, inquiry body, or call notes.');
      return;
    }
    setFormError(null);

    await onSubmit({
      emailSubject,
      senderName,
      senderEmail,
      rawText,
      attachments,
      baOverrideNotes,
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl text-slate-200">
      
      {/* Top Header & Presets */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Mail className="w-5 h-5 text-amber-400" /> Lead Intake & Raw Text Processing
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Paste raw email, inquiry thread, or call notes received by BA team. Gemini will extract & evaluate against the 3-Axis SOP.
          </p>
        </div>

        {/* Quick Sample Presets */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] uppercase font-bold text-slate-400 mr-1">Presets:</span>
          {SAMPLE_LEADS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleSelectPreset(preset)}
              className="px-2.5 py-1 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 border border-slate-700 rounded-md transition-colors cursor-pointer"
              title={preset.subject}
            >
              {preset.badge}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmitForm} className="space-y-4">
        
        {/* Email Metadata Grid */}
        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Email Subject <span className="text-slate-500">(Optional)</span>
            </label>
            <input
              type="text"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              placeholder="e.g. Request for Proposal - Mobile App"
              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500/80 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Sender Name <span className="text-slate-500">(Optional)</span>
            </label>
            <input
              type="text"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="e.g. John Smith"
              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500/80 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Sender Email <span className="text-slate-500">(Optional)</span>
            </label>
            <input
              type="email"
              value={senderEmail}
              onChange={(e) => setSenderEmail(e.target.value)}
              placeholder="e.g. john@company.com"
              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500/80 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Raw Text Body Input */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-slate-200">
              Raw Email Body / Inquiry Notes / Message Thread <span className="text-red-400">*</span>
            </label>
            <button
              type="button"
              onClick={handleClear}
              className="text-[11px] text-slate-400 hover:text-slate-200 underline cursor-pointer"
            >
              Clear Fields
            </button>
          </div>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            rows={7}
            placeholder="Paste raw inbound email content, customer brief, RFP summary, or call notes here..."
            className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500/80 rounded-lg p-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none transition-colors leading-relaxed font-mono"
          />
        </div>

        {/* BA Override / Offline Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-sky-400" />
            BA Notes / Geography & End Client Clarifications <span className="text-slate-500">(Optional)</span>
          </label>
          <input
            type="text"
            value={baOverrideNotes}
            onChange={(e) => setBaOverrideNotes(e.target.value)}
            placeholder="e.g. Contact is based in India, but paying entity is US parent company FreightFlow LLC."
            className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none transition-colors"
          />
        </div>

        {/* Attachment Upload & List */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
              <Paperclip className="w-3.5 h-3.5 text-amber-400" /> Attachments / Wireframes / Specs
            </label>
            <label className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-md text-xs font-medium cursor-pointer transition-colors inline-flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5" />
              <span>Attach File(s)</span>
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                accept=".txt,.pdf,.doc,.docx,.png,.jpg,.jpeg,.json,.md,.csv"
              />
            </label>
          </div>

          {/* List of uploaded attachments */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {attachments.map((att, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center space-x-2 text-xs"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-slate-200 font-medium max-w-[180px] truncate">{att.fileName}</span>
                  {att.size && (
                    <span className="text-[10px] text-slate-500">
                      ({Math.round(att.size / 1024)} KB)
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeAttachment(idx)}
                    className="text-slate-500 hover:text-red-400 transition-colors ml-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Error message */}
        {formError && (
          <div className="p-3 bg-red-950/50 border border-red-500/30 rounded-lg text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className={`px-6 py-3 rounded-lg font-bold text-xs flex items-center space-x-2 text-slate-950 transition-all cursor-pointer shadow-lg ${
              isLoading
                ? 'bg-amber-500/50 cursor-not-allowed opacity-80'
                : 'bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:from-amber-300 hover:to-orange-400 shadow-orange-950/50 active:scale-95'
            }`}
            id="generate-report-btn"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Evaluating Inbound Lead via Gemini SOP...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 fill-slate-950" />
                <span>Generate Lead Qualification Report</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};
