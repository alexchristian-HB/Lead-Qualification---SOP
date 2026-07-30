import React from 'react';
import { X, CheckCircle2, AlertTriangle, HelpCircle, Layers, Globe, FileCheck, Target } from 'lucide-react';

interface SOPQuickGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SOPQuickGuideModal: React.FC<SOPQuickGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl text-slate-200 overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-5 bg-slate-900 border-b border-slate-800 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">HiddenBrains Inbound Lead SOP Guide</h2>
              <p className="text-xs text-slate-400">Business Analyst Qualification & Approach Matrix</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          
          {/* Purpose */}
          <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
            <h3 className="font-semibold text-amber-400 mb-1 flex items-center gap-1.5">
              <Target className="w-4 h-4" /> Purpose & Scope
            </h3>
            <p className="text-slate-300 text-xs leading-relaxed">
              Standardizes how BA team qualifies inbound leads handed off from Sales/Sophie (AI outbound), ensuring every prospect receives an approach proportionate to its real potential regardless of contact location vs paying entity geography, entity type, or preparation level.
            </p>
          </div>

          {/* 3 Scoring Axes */}
          <div>
            <h3 className="text-base font-bold text-white mb-3">Qualification Framework — 3 Scoring Axes (Max 12 Pts)</h3>
            
            <div className="grid md:grid-cols-3 gap-4">
              
              {/* Axis 1 */}
              <div className="bg-slate-800/40 p-4 rounded-lg border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Axis 1</span>
                  <span className="text-xs text-slate-400">Max 4 pts</span>
                </div>
                <h4 className="font-semibold text-slate-100 text-xs mb-2">Entity Type</h4>
                <p className="text-[11px] text-slate-400 mb-3">
                  *If contact is an intermediary agency/reseller, score the <strong className="text-amber-300">END CLIENT</strong> entity type.
                </p>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  <li className="flex justify-between border-b border-slate-800/60 pb-1"><span>Idea-stage startup</span> <strong className="text-amber-400">1 pt</strong></li>
                  <li className="flex justify-between border-b border-slate-800/60 pb-1"><span>Agency / Reseller</span> <strong className="text-amber-400">2 pts</strong></li>
                  <li className="flex justify-between border-b border-slate-800/60 pb-1"><span>Funded Startup / SME</span> <strong className="text-amber-400">3 pts</strong></li>
                  <li className="flex justify-between pb-1"><span>Enterprise / Corporate</span> <strong className="text-amber-400">4 pts</strong></li>
                </ul>
              </div>

              {/* Axis 2 */}
              <div className="bg-slate-800/40 p-4 rounded-lg border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-sky-400">Axis 2</span>
                  <span className="text-xs text-slate-400">Max 4 pts</span>
                </div>
                <h4 className="font-semibold text-slate-100 text-xs mb-2">Geography & Paying Capacity</h4>
                <p className="text-[11px] text-slate-400 mb-3">
                  *Score market of <strong className="text-sky-300">PAYING ENTITY</strong>, not point of contact country!
                </p>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  <li className="flex justify-between border-b border-slate-800/60 pb-1"><span>Tier A (US, UK, W.Europe, Gulf)</span> <strong className="text-sky-400">4 pts</strong></li>
                  <li className="flex justify-between border-b border-slate-800/60 pb-1"><span>Tier B (Israel, SG, E.Europe, SA)</span> <strong className="text-sky-400">3 pts</strong></li>
                  <li className="flex justify-between border-b border-slate-800/60 pb-1"><span>Tier C (India Funded, LatAm)</span> <strong className="text-sky-400">2 pts</strong></li>
                  <li className="flex justify-between pb-1"><span>Tier D (Bootstrapped SMBs)</span> <strong className="text-sky-400">1 pt</strong></li>
                </ul>
              </div>

              {/* Axis 3 */}
              <div className="bg-slate-800/40 p-4 rounded-lg border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Axis 3</span>
                  <span className="text-xs text-slate-400">Max 4 pts</span>
                </div>
                <h4 className="font-semibold text-slate-100 text-xs mb-2">Readiness / Spec Level</h4>
                <p className="text-[11px] text-slate-400 mb-3">
                  *If L0/L1, trigger Section 7 Thin-Info Questionnaire first.
                </p>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  <li className="flex justify-between border-b border-slate-800/60 pb-1"><span>L0: One-liner, no specs</span> <strong className="text-emerald-400">1 pt</strong></li>
                  <li className="flex justify-between border-b border-slate-800/60 pb-1"><span>L1: Ref site/app given</span> <strong className="text-emerald-400">2 pts</strong></li>
                  <li className="flex justify-between border-b border-slate-800/60 pb-1"><span>L2: Written feature brief</span> <strong className="text-emerald-400">3 pts</strong></li>
                  <li className="flex justify-between pb-1"><span>L3: Full PRD / prototype</span> <strong className="text-emerald-400">4 pts</strong></li>
                </ul>
              </div>

            </div>
          </div>

          {/* Lead Tiers */}
          <div>
            <h3 className="text-base font-bold text-white mb-3">Composite Score & Playbook Mapping</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-emerald-950/40 border border-emerald-500/30 p-3 rounded-lg">
                <span className="text-xs font-bold px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded">Platinum (10–12 pts)</span>
                <p className="text-xs text-slate-300 mt-2 font-medium">Senior BA + Practice Head</p>
                <p className="text-[11px] text-slate-400 mt-1">SLA: &lt;24 hrs | Multi-session discovery workshop | Custom SOW & dedicated team</p>
              </div>

              <div className="bg-amber-950/40 border border-amber-500/30 p-3 rounded-lg">
                <span className="text-xs font-bold px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded">Gold (7–9 pts)</span>
                <p className="text-xs text-slate-300 mt-2 font-medium">Senior / Mid BA</p>
                <p className="text-[11px] text-slate-400 mt-1">SLA: &lt;48 hrs | Structured call 60-90 min | Detailed estimate & phased SOW</p>
              </div>

              <div className="bg-slate-800/60 border border-slate-700 p-3 rounded-lg">
                <span className="text-xs font-bold px-2 py-0.5 bg-slate-700 text-slate-300 rounded">Silver (4–6 pts)</span>
                <p className="text-xs text-slate-300 mt-2 font-medium">Mid / Junior BA</p>
                <p className="text-[11px] text-slate-400 mt-1">SLA: &lt;3 business days | Template call 30-45 min | Fixed-scope quick estimate</p>
              </div>

              <div className="bg-orange-950/40 border border-orange-500/30 p-3 rounded-lg">
                <span className="text-xs font-bold px-2 py-0.5 bg-orange-500/20 text-orange-300 rounded">Bronze (3 pts)</span>
                <p className="text-xs text-slate-300 mt-2 font-medium">Junior BA / Nurture</p>
                <p className="text-[11px] text-slate-400 mt-1">SLA: Auto-response | Email questionnaire | Ballpark range & nurture sequence</p>
              </div>
            </div>
          </div>

          {/* Red Flags & Thin Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-red-950/30 border border-red-500/20 p-4 rounded-lg">
              <h4 className="font-semibold text-red-400 text-xs mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-400" /> Red Flags (Overrides Tier)
              </h4>
              <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                <li>Budget incompatible with scope (e.g. $300 for full marketplace)</li>
                <li>No verifiable contact details / avoids phone channel</li>
                <li>Demands free detailed architecture / specs beyond reasonable</li>
                <li>Repeated cycles with no willingness to share budget/timeline</li>
                <li>Prior history of non-payment or abusive conduct</li>
              </ul>
            </div>

            <div className="bg-indigo-950/30 border border-indigo-500/20 p-4 rounded-lg">
              <h4 className="font-semibold text-indigo-400 text-xs mb-2 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-indigo-400" /> Thin-Info Protocol (L0/L1 Leads)
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                When a lead arrives with single-line or reference-only input, send the 7-question Thin-Info Questionnaire first before scoring Axis 3:
                1. Budget range, 2. Target timeline, 3. Decision-maker team, 4. Existing team, 5. Reference likes/dislikes, 6. Core business model, 7. Must-have features.
              </p>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
          >
            Got it, Close Guide
          </button>
        </div>

      </div>
    </div>
  );
};
