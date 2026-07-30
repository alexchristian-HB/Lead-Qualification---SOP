import React, { useState } from 'react';
import { 
  ShieldCheck, AlertTriangle, Copy, Check, Download, Edit3, Sparkles, 
  Layers, Globe, FileCheck, ArrowRight, UserCheck, Clock, MessageSquare, 
  Briefcase, Send, ChevronDown, ChevronUp, RefreshCw, Printer, AlertCircle,
  Building, MapPin, FileText, CheckCircle2
} from 'lucide-react';
import { LeadQualificationReport, LeadTier, EntityType, GeoTier, ReadinessLevel } from '../types';

interface ReportViewerProps {
  report: LeadQualificationReport;
  onUpdateReport?: (updatedReport: LeadQualificationReport) => void;
}

export const ReportViewer: React.FC<ReportViewerProps> = ({ report, onUpdateReport }) => {
  const [copiedCRM, setCopiedCRM] = useState<boolean>(false);
  const [copiedEmail, setCopiedEmail] = useState<boolean>(false);
  const [isEditingScores, setIsEditingScores] = useState<boolean>(false);
  const [isExportingPDF, setIsExportingPDF] = useState<boolean>(false);

  // Editable scores state for BA Overrides
  const [axis1Score, setAxis1Score] = useState<number>(report.axis1.score);
  const [axis2Score, setAxis2Score] = useState<number>(report.axis2.score);
  const [axis3Score, setAxis3Score] = useState<number>(report.axis3.score);

  // Handle PDF Export / Printing
  const handleExportPDF = async () => {
    setIsExportingPDF(true);

    try {
      // Direct PDF Generation via html2pdf
      const element = document.getElementById('qualification-report-printable');
      if (!element) throw new Error('Report container element not found');

      const opt = {
        margin:       0.25,
        filename:     `HiddenBrains_Lead_Report_${report.leadId}_${report.assignedTier}.pdf`,
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, backgroundColor: '#0f172a', logging: false },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' as const }
      };

      const html2pdfModule = (await import('html2pdf.js')).default;
      await html2pdfModule().set(opt).from(element).save();
    } catch (err) {
      console.warn('html2pdf direct export fallback, attempting print window:', err);
      try {
        window.print();
      } catch (printErr) {
        console.error('Print failed:', printErr);
      }
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Helper for tier styling & badges
  const getTierMeta = (tier: LeadTier) => {
    switch (tier) {
      case 'PLATINUM':
        return {
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          cardBorder: 'border-emerald-500/30',
          scoreColor: 'text-emerald-400',
          label: 'PLATINUM TIER',
          subLabel: 'Strategic Priority Account (Score 10–12)',
        };
      case 'GOLD':
        return {
          badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          cardBorder: 'border-amber-500/30',
          scoreColor: 'text-amber-400',
          label: 'GOLD TIER',
          subLabel: 'High Potential Lead (Score 7–9)',
        };
      case 'SILVER':
        return {
          badgeBg: 'bg-slate-700/60 text-slate-200 border-slate-600',
          cardBorder: 'border-slate-700',
          scoreColor: 'text-slate-300',
          label: 'SILVER TIER',
          subLabel: 'Standard Lead (Score 4–6)',
        };
      case 'BRONZE':
      default:
        return {
          badgeBg: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
          cardBorder: 'border-orange-500/30',
          scoreColor: 'text-orange-400',
          label: 'BRONZE TIER',
          subLabel: 'Nurture Lead (Score 3)',
        };
    }
  };

  const tierMeta = getTierMeta(report.assignedTier);

  // Copy CRM Log to clipboard
  const handleCopyCRM = () => {
    const text = `=== HIDDENBRAINS BA CRM LEAD QUALIFICATION RECORD ===
Lead ID: ${report.leadId}
Title: ${report.leadTitle}
Prospect Name: ${report.prospectName || 'N/A'}
Company / Entity: ${report.prospectCompany || 'N/A'}
---------------------------------------------------
Axis 1 (Entity Type): ${report.axis1.entityTypeName} [Score: ${report.axis1.score}/4]
Axis 2 (Paying Geography): ${report.axis2.payingTier} (${report.axis2.payingEntityCountry}) [Score: ${report.axis2.score}/4]
Axis 3 (Readiness Level): Level ${report.axis3.readinessLevel} - ${report.axis3.readinessDescription} [Score: ${report.axis3.score}/4]
---------------------------------------------------
COMPOSITE RATING SCORE: ${report.finalCompositeScore} / 12
ASSIGNED LEAD TIER: ${report.assignedTier}
BA OWNER ASSIGNED: ${report.playbook.owner}
TARGET RESPONSE SLA: ${report.playbook.sla}
DISCOVERY FORMAT: ${report.playbook.discoveryFormat}
PROPOSAL MODEL: ${report.playbook.proposalModel}
SALES NOTIFICATION: ${report.crmLog.salesNotificationText}
===================================================`;

    navigator.clipboard.writeText(text);
    setCopiedCRM(true);
    setTimeout(() => setCopiedCRM(false), 2500);
  };

  // Copy Thin Info Questionnaire Email Template
  const handleCopyThinInfoEmail = () => {
    if (!report.thinInfoQuestions || report.thinInfoQuestions.length === 0) return;

    const emailBody = `Dear ${report.prospectName || 'Client'},

Thank you for contacting HiddenBrains Infotech.

To help our Business Analysis team prepare an accurate approach and tailored cost estimate for your inquiry (${report.leadTitle}), could you kindly provide brief details on these key points?

${report.thinInfoQuestions
  .map((q, idx) => `${idx + 1}. ${q.question}`)
  .join('\n\n')}

Upon receiving your inputs, our Practice Head and Technical BAs will review and schedule an initial discovery discussion.

Best regards,
Business Analysis & Solutions Team
HiddenBrains Infotech`;

    navigator.clipboard.writeText(emailBody);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  // Recalculate score on manual BA override
  const handleSaveOverrides = () => {
    const newComposite = Math.min(12, Math.max(3, axis1Score + axis2Score + axis3Score));
    
    let newTier: LeadTier = 'BRONZE';
    if (newComposite >= 10) newTier = 'PLATINUM';
    else if (newComposite >= 7) newTier = 'GOLD';
    else if (newComposite >= 4) newTier = 'SILVER';

    let newPlaybook = { ...report.playbook };
    if (newTier === 'PLATINUM') {
      newPlaybook = {
        owner: 'Senior BA + Practice Head / Principal',
        sla: 'Response within 24 hrs',
        discoveryFormat: 'Full discovery workshop (multi-session)',
        proposalModel: 'Detailed SOW with phased roadmap; dedicated-team or milestone pricing',
      };
    } else if (newTier === 'GOLD') {
      newPlaybook = {
        owner: 'Senior / Mid BA',
        sla: 'Response within 48 hrs',
        discoveryFormat: 'Structured discovery call, 60–90 min',
        proposalModel: 'Detailed estimate + phased SOW',
      };
    } else if (newTier === 'SILVER') {
      newPlaybook = {
        owner: 'Mid / Junior BA',
        sla: 'Response within 3 business days',
        discoveryFormat: 'Template-driven call, 30–45 min + questionnaire',
        proposalModel: 'Fixed-scope quick estimate; standard packages',
      };
    } else {
      newPlaybook = {
        owner: 'Junior BA / automated nurture',
        sla: 'Templated auto-response; no call until qualified further',
        discoveryFormat: 'Qualifying questionnaire by email first',
        proposalModel: 'Ballpark range only; re-engage later via nurture sequence',
      };
    }

    const updated: LeadQualificationReport = {
      ...report,
      axis1: { ...report.axis1, score: axis1Score },
      axis2: { ...report.axis2, score: axis2Score },
      axis3: { ...report.axis3, score: axis3Score },
      rawCompositeScore: newComposite,
      finalCompositeScore: newComposite,
      assignedTier: newTier,
      playbook: newPlaybook,
      crmLog: {
        ...report.crmLog,
        compositeScore: newComposite,
        assignedTier: newTier,
        recommendedBAOwner: newPlaybook.owner,
      },
    };

    if (onUpdateReport) {
      onUpdateReport(updated);
    }
    setIsEditingScores(false);
  };

  return (
    <div className="space-y-6 text-slate-100" id="qualification-report-printable">
      
      {/* ========================================== */}
      {/* 1. EXECUTIVE LEAD SCORECARD & HEADER */}
      {/* ========================================== */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
        
        {/* Top Header Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center space-x-2 text-xs font-mono text-amber-400 mb-1">
              <span className="font-bold">{report.leadId}</span>
              <span>•</span>
              <span>Generated {new Date(report.createdAt).toLocaleDateString()} {new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {report.leadTitle}
            </h1>

            <div className="flex items-center gap-4 mt-2 text-xs text-slate-300 flex-wrap">
              <span className="flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                Prospect: <strong className="text-white">{report.prospectName || 'Unspecified'}</strong> {report.prospectCompany && `(${report.prospectCompany})`}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-sky-400" />
                Contact Location: <strong className="text-sky-300">{report.axis2.contactCountry}</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                Paying Buyer: <strong className="text-emerald-300">{report.axis2.payingEntityCountry} ({report.axis2.payingEntityRegion})</strong>
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap print:hidden shrink-0">
            <button
              onClick={() => setIsEditingScores(!isEditingScores)}
              className="px-3 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-400" />
              <span>{isEditingScores ? 'Close Override' : 'Override Ratings'}</span>
            </button>

            <button
              onClick={handleCopyCRM}
              className="px-3 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer"
              id="copy-crm-btn"
            >
              {copiedCRM ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-sky-400" />}
              <span>{copiedCRM ? 'Copied to CRM!' : 'Copy CRM Record'}</span>
            </button>

            <button
              onClick={handleExportPDF}
              disabled={isExportingPDF}
              className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 text-slate-950 rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer shadow-lg shadow-amber-950/40"
              id="download-pdf-btn"
            >
              {isExportingPDF ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / Download PDF</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Big Rating Banner Grid */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
          
          {/* Main Tier Pill & Score */}
          <div className={`md:col-span-5 p-5 rounded-xl border ${tierMeta.badgeBg} ${tierMeta.cardBorder} flex flex-col justify-between`}>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 block mb-1">
                SOP Qualification Rating
              </span>
              <div className="flex items-baseline space-x-3">
                <span className="text-3xl font-black text-white tracking-wide">{report.assignedTier}</span>
                <span className={`text-xl font-bold ${tierMeta.scoreColor}`}>
                  {report.finalCompositeScore} <span className="text-xs font-normal text-slate-300">/ 12 pts</span>
                </span>
              </div>
              <p className="text-xs text-slate-200 mt-1 font-medium">{tierMeta.subLabel}</p>
            </div>

            {report.isTierOverriddenByRedFlag && (
              <div className="mt-3 p-2 bg-red-950/80 border border-red-500/40 rounded text-xs text-red-300 font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>Tier overridden downward due to Red Flag criteria</span>
              </div>
            )}
          </div>

          {/* Quick SLA & BA Owner Card */}
          <div className="md:col-span-7 bg-slate-950 border border-slate-800 p-5 rounded-xl flex flex-col justify-between">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Assigned BA Owner
                </span>
                <p className="text-xs font-bold text-amber-300">{report.playbook.owner}</p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Target Response SLA
                </span>
                <p className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{report.playbook.sla}</span>
                </p>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-800 text-xs text-slate-300">
              <span className="text-slate-400">Discovery Approach: </span>
              <strong className="text-white">{report.playbook.discoveryFormat}</strong>
            </div>
          </div>

        </div>

        {/* Rating Math Formula Summary Bar */}
        <div className="mt-4 bg-slate-950 border border-slate-800/80 px-4 py-2.5 rounded-lg flex items-center justify-between text-xs flex-wrap gap-2">
          <span className="text-slate-400 font-medium">Rating Score Formula:</span>
          <div className="flex items-center space-x-3 font-mono">
            <span className="text-amber-400">Axis 1 (Entity): {report.axis1.score}pt</span>
            <span className="text-slate-600">+</span>
            <span className="text-sky-400">Axis 2 (Geography): {report.axis2.score}pt</span>
            <span className="text-slate-600">+</span>
            <span className="text-emerald-400">Axis 3 (Readiness): {report.axis3.score}pt</span>
            <span className="text-slate-600">=</span>
            <strong className="text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
              {report.finalCompositeScore} / 12 ({report.assignedTier})
            </strong>
          </div>
        </div>

      </div>

      {/* ========================================== */}
      {/* MANUAL OVERRIDE EDITOR (IF CLICKED) */}
      {/* ========================================== */}
      {isEditingScores && (
        <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-5 shadow-lg">
          <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-2">
            <Edit3 className="w-4 h-4" /> Manual Business Analyst Rating Override
          </h3>
          <p className="text-xs text-slate-300 mb-4">
            Adjust individual axis points if additional offline information or direct call insights warrant re-scoring.
          </p>

          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Axis 1: Entity Type Score
              </label>
              <select
                value={axis1Score}
                onChange={(e) => setAxis1Score(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
              >
                <option value={1}>1 Pt — Idea-stage startup (no funding)</option>
                <option value={2}>2 Pts — Agency / Reseller</option>
                <option value={3}>3 Pts — Funded startup / SME</option>
                <option value={4}>4 Pts — Enterprise / Large Corporate</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Axis 2: Geography & Capacity Score
              </label>
              <select
                value={axis2Score}
                onChange={(e) => setAxis2Score(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
              >
                <option value={4}>4 Pts — Tier A (US, UK, W.Europe, Gulf)</option>
                <option value={3}>3 Pts — Tier B (Israel, SG, E.Europe, SA)</option>
                <option value={2}>2 Pts — Tier C (India Funded, LatAm)</option>
                <option value={1}>1 Pt — Tier D (Bootstrapped SMBs)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Axis 3: Readiness / Spec Level Score
              </label>
              <select
                value={axis3Score}
                onChange={(e) => setAxis3Score(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
              >
                <option value={1}>1 Pt — L0: Single line inquiry</option>
                <option value={2}>2 Pts — L1: Reference site/app given</option>
                <option value={3}>3 Pts — L2: Written feature brief</option>
                <option value={4}>4 Pts — L3: Documented PRD / Wireframes</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsEditingScores(false)}
              className="px-3 py-1.5 bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold rounded-md cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveOverrides}
              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-md cursor-pointer"
            >
              Save Overrides & Recalculate
            </button>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 2. RED FLAGS ALERT CALLOUT (IF PRESENT) */}
      {/* ========================================== */}
      {report.hasRedFlags && report.redFlags && report.redFlags.length > 0 && (
        <div className="bg-red-950/50 border border-red-500/50 rounded-xl p-5 shadow-lg">
          <div className="flex items-center space-x-2 text-red-400 font-bold text-sm mb-3">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span>RED FLAGS & DISQUALIFICATION CRITERIA TRIGGERED (SECTION 8)</span>
          </div>

          <div className="space-y-3">
            {report.redFlags.map((flag, idx) => (
              <div key={idx} className="bg-slate-950/90 border border-red-900/60 p-3.5 rounded-lg text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-red-300 text-xs">{flag.flag}</span>
                  <span className="px-2 py-0.5 bg-red-500/20 text-red-300 text-[10px] font-bold rounded border border-red-500/30">
                    {flag.severity}
                  </span>
                </div>
                <p className="text-slate-300 leading-relaxed mb-2">{flag.description}</p>
                <p className="text-amber-300 font-semibold">Action Required: {flag.actionRequired}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 3. STRUCTURED 3-AXIS SCORE EVALUATION TABLE */}
      {/* ========================================== */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4 text-amber-400" />
          3-Axis SOP Qualification Score Breakdown
        </h2>

        {/* Summary Table */}
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/60">
                <th className="p-3 font-bold uppercase tracking-wider">Axis Category</th>
                <th className="p-3 font-bold uppercase tracking-wider">Classification</th>
                <th className="p-3 font-bold uppercase tracking-wider">Key Subject / Entity</th>
                <th className="p-3 font-bold uppercase tracking-wider text-right">Points Earned</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              
              {/* Axis 1 Row */}
              <tr className="hover:bg-slate-800/40 transition-colors">
                <td className="p-3 font-bold text-amber-400 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  Axis 1: Entity Type
                </td>
                <td className="p-3">
                  <span className="font-semibold text-white">{report.axis1.entityTypeName}</span>
                  {report.axis1.isIntermediary && (
                    <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-sky-500/20 text-sky-300 rounded border border-sky-500/30">
                      Intermediary
                    </span>
                  )}
                </td>
                <td className="p-3 text-slate-300">
                  {report.axis1.isIntermediary ? (
                    <span>End Client: <strong className="text-amber-300">{report.axis1.endClientName || 'Unspecified End Client'}</strong></span>
                  ) : (
                    <span>Direct Client ({report.prospectCompany || 'Direct Buyer'})</span>
                  )}
                </td>
                <td className="p-3 text-right font-black text-amber-400 text-sm">
                  {report.axis1.score} / 4 pts
                </td>
              </tr>

              {/* Axis 2 Row */}
              <tr className="hover:bg-slate-800/40 transition-colors">
                <td className="p-3 font-bold text-sky-400 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Axis 2: Paying Geography
                </td>
                <td className="p-3 font-semibold text-white">
                  {report.axis2.payingTier} ({report.axis2.payingEntityRegion})
                </td>
                <td className="p-3 text-slate-300">
                  Paying Entity in <strong className="text-emerald-300">{report.axis2.payingEntityCountry}</strong> (Contact in {report.axis2.contactCountry})
                </td>
                <td className="p-3 text-right font-black text-sky-400 text-sm">
                  {report.axis2.score} / 4 pts
                </td>
              </tr>

              {/* Axis 3 Row */}
              <tr className="hover:bg-slate-800/40 transition-colors">
                <td className="p-3 font-bold text-emerald-400 flex items-center gap-2">
                  <FileCheck className="w-4 h-4" />
                  Axis 3: Spec Readiness
                </td>
                <td className="p-3 font-semibold text-white">
                  Level {report.axis3.readinessLevel} — {report.axis3.readinessDescription}
                </td>
                <td className="p-3 text-slate-300 truncate max-w-xs">
                  {report.axis3.providedMaterialsSummary && report.axis3.providedMaterialsSummary.length > 0
                    ? report.axis3.providedMaterialsSummary.join(', ')
                    : 'No written brief provided'}
                </td>
                <td className="p-3 text-right font-black text-emerald-400 text-sm">
                  {report.axis3.score} / 4 pts
                </td>
              </tr>

              {/* Total Row */}
              <tr className="bg-slate-950 font-bold border-t-2 border-slate-700">
                <td className="p-3 text-slate-100 text-sm" colSpan={3}>
                  COMPOSITE EVALUATION TOTAL
                </td>
                <td className="p-3 text-right text-amber-300 text-base font-black">
                  {report.finalCompositeScore} / 12 pts ({report.assignedTier})
                </td>
              </tr>

            </tbody>
          </table>
        </div>

        {/* Detailed Rationale Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          
          {/* Axis 1 Detail */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                Axis 1 Rationale
              </span>
              <p className="text-xs text-slate-200 leading-relaxed mb-3">
                {report.axis1.rationale}
              </p>
            </div>
            {report.axis1.isIntermediary && (
              <div className="bg-amber-500/10 border border-amber-500/20 p-2.5 rounded text-[11px] text-amber-300">
                <strong>SOP Rule Applied:</strong> Intermediary reselling to end client. Evaluated end client entity type.
              </div>
            )}
          </div>

          {/* Axis 2 Detail */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block mb-1">
                Axis 2 Rationale & Mismatch
              </span>
              <p className="text-xs text-slate-200 leading-relaxed mb-3">
                {report.axis2.rationale}
              </p>
            </div>
            {report.axis2.mismatchNote && (
              <div className="bg-sky-500/10 border border-sky-500/30 p-2.5 rounded text-[11px] text-sky-300">
                <strong>Geo Mismatch:</strong> {report.axis2.mismatchNote}
              </div>
            )}
          </div>

          {/* Axis 3 Detail */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                Axis 3 Readiness Rationale
              </span>
              <p className="text-xs text-slate-200 leading-relaxed mb-3">
                {report.axis3.rationale}
              </p>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded text-[11px] text-emerald-300">
              <strong>Level {report.axis3.readinessLevel}:</strong> {report.axis3.readinessDescription}
            </div>
          </div>

        </div>

      </div>

      {/* ========================================== */}
      {/* 4. SECTION 6 — APPROACH PLAYBOOK */}
      {/* ========================================== */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-emerald-400" />
          Section 6 — Tier-Based Approach Playbook
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Assigned BA Owner
            </span>
            <p className="font-bold text-amber-300 text-sm">{report.playbook.owner}</p>
            <p className="text-[11px] text-slate-400 mt-1">Lead qualification & discovery owner</p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Target Response SLA
            </span>
            <p className="font-bold text-emerald-400 text-sm flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{report.playbook.sla}</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Turnaround time from handoff</p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Discovery Format
            </span>
            <p className="font-semibold text-white text-xs">{report.playbook.discoveryFormat}</p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Proposal & Pricing Model
            </span>
            <p className="font-semibold text-white text-xs">{report.playbook.proposalModel}</p>
          </div>

        </div>
      </div>

      {/* ========================================== */}
      {/* 5. THIN-INFO PROTOCOL (SECTION 7) IF L0 / L1 */}
      {/* ========================================== */}
      {report.requiresThinInfoProtocol && (
        <div className="bg-indigo-950/40 border border-indigo-500/40 rounded-xl p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-indigo-500/20">
            <div>
              <h2 className="text-sm font-bold text-indigo-200 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                Section 7 — Thin-Information Protocol Questionnaire (L0 / L1)
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Inbound lead is early-stage (L0/L1). Send these 7 qualification questions to the client before committing deep technical BA time.
              </p>
            </div>

            <button
              onClick={handleCopyThinInfoEmail}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 shadow-md"
              id="copy-thin-info-email-btn"
            >
              {copiedEmail ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedEmail ? 'Copied Email Draft!' : 'Copy Reply Email Draft'}</span>
            </button>
          </div>

          {/* Questions Grid */}
          <div className="grid md:grid-cols-2 gap-3">
            {report.thinInfoQuestions.map((q) => (
              <div key={q.id} className="bg-slate-900 border border-slate-800 p-3.5 rounded-lg text-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-amber-300 text-xs">Q{q.id}: {q.context}</span>
                  {q.isAnsweredInEmail ? (
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                      Answered in Brief
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-orange-400 bg-orange-950/60 px-2 py-0.5 rounded border border-orange-800">
                      Pending Input
                    </span>
                  )}
                </div>
                <p className="text-slate-100 font-medium mb-1">{q.question}</p>
                {q.detectedAnswer && (
                  <p className="text-slate-400 text-[11px] bg-slate-950 p-2 rounded border border-slate-800 mt-1">
                    Detected answer: "{q.detectedAnswer}"
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 6. EXECUTIVE SUMMARY & BA NEXT STEPS */}
      {/* ========================================== */}
      <div className="grid md:grid-cols-2 gap-6">
        
        {/* Executive Assessment */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
          <h2 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" /> Executive BA Assessment Summary
          </h2>
          
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mb-4 text-xs text-slate-200 leading-relaxed">
            {report.executiveSummary}
          </div>

          <h3 className="text-xs font-bold text-slate-300 mb-2">Key Account Highlights</h3>
          <ul className="space-y-2 text-xs text-slate-300">
            {report.keyHighlights.map((hl, idx) => (
              <li key={idx} className="flex items-start gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>{hl}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Recommended BA Action Steps */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h2 className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <ArrowRight className="w-4 h-4" /> Actionable Next Steps for BA Team
            </h2>

            <ol className="space-y-2.5 text-xs text-slate-200">
              {report.recommendedNextSteps.map((step, idx) => (
                <li key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-300 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 border border-sky-500/30">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Sales Notification Bar */}
          <div className="mt-5 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase text-slate-400">
                Sales / CRM Handoff Text
              </span>
              <button
                onClick={handleCopyCRM}
                className="text-[11px] text-sky-400 hover:text-sky-300 font-semibold cursor-pointer flex items-center gap-1"
              >
                <Copy className="w-3 h-3" /> Copy Log
              </button>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] text-slate-300 font-mono select-all">
              {report.crmLog.salesNotificationText}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
