'use client';

import React from 'react';
import { Sparkles, Sliders, TrendingUp, Cpu } from 'lucide-react';

interface CalibrationData {
  topicId: string;
  topicName: string;
  currentMastery: number;
  recommendedDifficulty: 'EASY' | 'MEDIUM' | 'HARD';
  confidenceInterval: { low: number; high: number };
  pedagogicalRationale: string;
}

interface AdaptiveCalibrationBannerProps {
  calibration: CalibrationData | null;
  adaptiveMode: boolean;
  onToggleAdaptive: () => void;
  selectedDifficulty?: string;
}

export function AdaptiveCalibrationBanner({
  calibration,
  adaptiveMode,
  onToggleAdaptive,
  selectedDifficulty = 'MEDIUM',
}: AdaptiveCalibrationBannerProps) {
  if (!calibration) return null;

  const activeDifficulty = (adaptiveMode
    ? calibration.recommendedDifficulty
    : (selectedDifficulty as 'EASY' | 'MEDIUM' | 'HARD') || calibration.recommendedDifficulty) as
    | 'EASY'
    | 'MEDIUM'
    | 'HARD';

  const difficultyColors = {
    EASY: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40 shadow-xs',
    MEDIUM: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40 shadow-xs',
    HARD: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/40 shadow-xs',
  };

  const difficultyLabels = {
    EASY: 'Level 1: Scaffolding Foundations',
    MEDIUM: 'Level 2: Analytical Application',
    HARD: 'Level 3: Edge-Case Synthesis',
  };

  return (
    <div className="mb-6 rounded-2xl border border-[#141c2e]/14 dark:border-white/10 bg-[#faf8f5] dark:bg-[#0f172a] p-5 shadow-sm relative overflow-hidden transition-colors duration-200">
      {/* Subtle Ambient Accent */}
      <div className="absolute top-0 right-0 -mt-6 -mr-6 w-48 h-48 bg-red-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="rounded-xl bg-red-500/10 dark:bg-red-500/20 p-2.5 text-[#dc2626] border border-red-500/20 mt-0.5 shrink-0 shadow-xs">
            <Cpu className="h-5 w-5 animate-pulse text-[#dc2626]" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="font-bold text-[#141c2e] dark:text-white text-base tracking-tight font-sans">
                {adaptiveMode ? 'Adaptive Difficulty Calibration' : 'Manual Feature Calibration'}
              </h3>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-mono font-semibold border ${
                adaptiveMode
                  ? 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20'
                  : 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/20'
              }`}>
                <Sparkles className="h-3 w-3 text-[#dc2626]" />
                {adaptiveMode ? 'Adaptive Engine' : 'Custom Calibration'}
              </span>
            </div>
            <p className="mt-1 text-xs text-[#141c2e]/70 dark:text-slate-300 leading-relaxed max-w-xl font-sans">
              {adaptiveMode
                ? calibration.pedagogicalRationale
                : `Manual challenge calibration active (${activeDifficulty}). You are manually calibrating to practice ${activeDifficulty.toLowerCase()}-tier conceptual questions in ${calibration.topicName}, overriding the automatic diagnostic baseline.`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 self-end sm:self-center shrink-0">
          <div className="text-right">
            <div className="text-[10px] font-mono font-bold text-[#141c2e]/60 dark:text-slate-400 uppercase tracking-wider">
              {adaptiveMode ? 'Calibrated Tier' : 'User-Selected Tier'}
            </div>
            <span
              className={`inline-block mt-1 px-3 py-1.5 rounded-xl text-xs font-mono font-bold border ${
                difficultyColors[activeDifficulty] || difficultyColors.MEDIUM
              }`}
            >
              {activeDifficulty} • {difficultyLabels[activeDifficulty] || 'Custom Tier'}
            </span>
          </div>

          <button
            type="button"
            onClick={onToggleAdaptive}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-medium transition-all border shadow-xs ${
              adaptiveMode
                ? 'bg-[#dc2626] hover:bg-[#b91c1c] text-white border-[#dc2626] shadow-red-600/20'
                : 'bg-amber-600 hover:bg-amber-700 text-white border-amber-600 shadow-amber-600/20'
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            {adaptiveMode ? 'Auto-Calibrated' : 'Manual Override'}
          </button>
        </div>
      </div>

      {/* Mastery & Confidence Interval Bar */}
      <div className="relative z-10 mt-4 pt-3.5 border-t border-[#141c2e]/10 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-[#141c2e]/70 dark:text-slate-300 gap-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-[#dc2626] shrink-0" />
          <span>Active Mastery in <strong className="text-[#141c2e] dark:text-white font-semibold">{calibration.topicName}</strong>:</span>
          <span className="font-mono font-bold text-[#dc2626] dark:text-red-400 text-xs bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-md">
            {calibration.currentMastery.toFixed(1)}%
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[#141c2e]/60 dark:text-slate-400 text-xs font-mono">95% Latent Ability Range:</span>
          <div className="w-36 bg-[#141c2e]/10 dark:bg-slate-950 border border-[#141c2e]/15 dark:border-slate-800 h-2.5 rounded-full overflow-hidden relative shadow-inner">
            <div
              className="bg-gradient-to-r from-[#dc2626] to-[#0d9488] h-full rounded-full shadow-xs"
              style={{
                width: `${Math.max(8, calibration.confidenceInterval.high - calibration.confidenceInterval.low)}%`,
                marginLeft: `${calibration.confidenceInterval.low}%`,
              }}
            />
          </div>
          <span className="font-mono text-xs font-bold text-[#dc2626] dark:text-red-400">
            [{calibration.confidenceInterval.low.toFixed(0)}% – {calibration.confidenceInterval.high.toFixed(0)}%]
          </span>
        </div>
      </div>
    </div>
  );
}
