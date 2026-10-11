'use client';

import React from 'react';
import { AlertTriangle, Lightbulb, ArrowRight } from 'lucide-react';

interface MisconceptionData {
  id: string;
  code: string;
  title: string;
  description: string;
  category: string;
  remediationAdvice: string;
}

interface MisconceptionAlertCardProps {
  misconception: MisconceptionData;
  occurrenceCount?: number;
  onExploreRemediation?: () => void;
}

export function MisconceptionAlertCard({
  misconception,
  occurrenceCount,
  onExploreRemediation,
}: MisconceptionAlertCardProps) {
  const categoryLabels: Record<string, { label: string; color: string }> = {
    CONCEPTUAL_CONFUSION: { label: 'Conceptual Trap', color: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30' },
    OFF_BY_ONE_ERROR: { label: 'Off-By-One Boundary', color: 'bg-red-50 text-red-800 border-red-200 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30' },
    COMPLEXITY_MISCALCULATION: { label: 'Complexity Estimation', color: 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30' },
    BOUNDARY_EDGE_CASE: { label: 'Edge-Case Omission', color: 'bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-500/30' },
    POINTER_REFERENCE_CONFUSION: { label: 'Pointer Mutation', color: 'bg-red-50 text-red-800 border-red-200 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30' },
    SYNTAX_SEMANTICS_OVERLOOK: { label: 'Semantic Overlook', color: 'bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-500/20 dark:text-teal-300 dark:border-teal-500/30' },
  };

  const badge = categoryLabels[misconception.category] || {
    label: misconception.category.replace(/_/g, ' '),
    color: 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  };

  return (
    <div className="mt-4 border border-amber-300/60 dark:border-amber-500/30 bg-[#faf7f2] dark:bg-[#121b30] p-5 shadow-sm transition-all duration-200" style={{borderRadius:0}}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="bg-[rgba(224,80,51,0.1)] dark:bg-amber-500/20 p-2 text-[#e05033] dark:text-amber-400 border border-[rgba(224,80,51,0.3)] dark:border-amber-500/30 shrink-0">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-amber-700 dark:text-amber-400">
                {misconception.code}
              </span>
              <span className={`font-mono px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${badge.color}`}>
                {badge.label}
              </span>
              {occurrenceCount && occurrenceCount > 1 && (
                <span className="font-mono bg-red-50 text-red-800 dark:bg-red-950/60 dark:text-red-300 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-red-200 dark:border-red-800/60">
                  Detected {occurrenceCount} times
                </span>
              )}
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm mt-1">
              {misconception.title}
            </h4>
          </div>
        </div>
      </div>

      <p className="mt-3 text-xs text-[#1a2540] dark:text-[#b0c4d8] leading-relaxed bg-[rgba(74,111,165,0.06)] dark:bg-[rgba(106,144,197,0.05)] p-3 border border-[rgba(74,111,165,0.18)] dark:border-[rgba(106,144,197,0.15)]" style={{borderRadius:0}}>
        <strong className="font-mono text-[11px] uppercase tracking-wider text-amber-800 dark:text-amber-300 font-bold block mb-0.5">Identified Cognitive Gap:</strong>
        {misconception.description}
      </p>

      <div className="mt-3 flex items-start gap-2.5 bg-[rgba(74,111,165,0.08)] dark:bg-[rgba(106,144,197,0.05)] border border-[rgba(74,111,165,0.22)] dark:border-[rgba(106,144,197,0.18)] p-3" style={{borderRadius:0}}>
        <Lightbulb className="h-4 w-4 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-teal-900 dark:text-teal-200 leading-relaxed">
          <strong className="font-mono text-[11px] uppercase tracking-wider text-teal-950 dark:text-white block font-bold">Remediation Blueprint:</strong>
          {misconception.remediationAdvice}
        </div>
      </div>

      {onExploreRemediation && (
        <button
          type="button"
          onClick={onExploreRemediation}
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors cursor-pointer"
        >
          <span>Ask Socratic Tutor about this concept →</span>
          <ArrowRight className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
