import React from 'react';

interface TopicMasteryProps {
  topicName: string;
  courseCode: string;
  masteryScore: number;
  decayedMastery?: number;
  retentionStatus?: 'FRESH' | 'STABLE' | 'DECAYING' | 'CRITICAL_DECAY';
  attemptCount?: number;
  accuracy?: number;
  onPracticeClick?: () => void;
}

export function TopicMasteryCard({
  topicName,
  courseCode,
  masteryScore,
  decayedMastery,
  retentionStatus,
  attemptCount,
  onPracticeClick,
}: TopicMasteryProps) {
  const score = Math.round(masteryScore);
  const effectiveScore = decayedMastery !== undefined ? Math.round(decayedMastery) : score;

  let statusBadge = {
    label: 'Needs Practice',
    color: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/40',
    barColor: 'bg-red-600',
  };

  if (score >= 75) {
    statusBadge = {
      label: 'Mastered',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40',
      barColor: 'bg-emerald-500',
    };
  } else if (score >= 60) {
    statusBadge = {
      label: 'Proficient',
      color: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-500/20 dark:text-teal-300 dark:border-teal-500/40',
      barColor: 'bg-teal-600',
    };
  } else if (score >= 40) {
    statusBadge = {
      label: 'Developing',
      color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40',
      barColor: 'bg-amber-500',
    };
  }

  return (
    <div className="bg-[#faf7f2] dark:bg-[#121b30] p-4 border border-[rgba(74,111,165,0.25)] dark:border-[rgba(106,144,197,0.2)] shadow-sm hover:shadow-md flex flex-col justify-between transition-all duration-200" style={{borderRadius:0}}>
      <div>
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="font-mono text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase">
              {courseCode}
            </span>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight mt-0.5">{topicName}</h4>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span
              className={`font-mono text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 border ${statusBadge.color}`}
              style={{borderRadius:0}}
            >
              {statusBadge.label}
            </span>
            {retentionStatus && (retentionStatus === 'DECAYING' || retentionStatus === 'CRITICAL_DECAY') && (
              <span className="font-mono text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30">
                Decay Alert
              </span>
            )}
          </div>
        </div>

        <div className="mt-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-mono text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">Mastery Level</span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-slate-900 dark:text-white">{score}%</span>
              {decayedMastery !== undefined && effectiveScore < score && (
                <span className="font-mono text-[10px] text-amber-600 dark:text-amber-400 font-semibold" title="Decayed effective retention score">
                  ({effectiveScore}%)
                </span>
              )}
            </div>
          </div>
          <div className="w-full h-1.5 bg-[rgba(74,111,165,0.12)] dark:bg-[rgba(106,144,197,0.1)] overflow-hidden" style={{borderRadius:0}}>
            <div
              className={`h-full rounded-full transition-all duration-500 ${statusBadge.barColor}`}
              style={{ width: `${Math.min(100, Math.max(5, score))}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-[rgba(74,111,165,0.18)] dark:border-[rgba(106,144,197,0.15)] flex items-center justify-between text-[11px] text-[#6b7fa3] dark:text-[#8ba0c0]">
        <span className="font-mono text-[10px] uppercase tracking-wider">{attemptCount ? `${attemptCount} attempts` : 'No attempts'}</span>
        {onPracticeClick && (
          <button
            onClick={onPracticeClick}
            className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#e05033] dark:text-[#e8604a] hover:text-[#c8432b] dark:hover:text-[#d0503a] transition flex items-center gap-1 cursor-pointer"
          >
            Practice Topic →
          </button>
        )}
      </div>
    </div>
  );
}
