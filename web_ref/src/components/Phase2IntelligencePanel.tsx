'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import {
  Brain,
  Clock,
  GitFork,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  TrendingDown,
  Layers,
  ShieldCheck,
  Loader2,
} from 'lucide-react';

export function Phase2IntelligencePanel() {
  const [activeTab, setActiveTab] = useState<'bkt' | 'decay' | 'graph'>('bkt');
  const [loading, setLoading] = useState(false);
  const [bktData, setBktData] = useState<any>(null);
  const [retentionData, setRetentionData] = useState<any>(null);
  const [graphData, setGraphData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTabData(activeTab);
  }, [activeTab]);

  const loadTabData = async (tab: 'bkt' | 'decay' | 'graph') => {
    setLoading(true);
    setError(null);
    try {
      if (tab === 'bkt' && !bktData) {
        const res = await api.get('/analytics/student/me/bkt-comparison');
        setBktData(res);
      } else if (tab === 'decay' && !retentionData) {
        const res = await api.get('/analytics/student/me/retention');
        setRetentionData(res);
      } else if (tab === 'graph' && !graphData) {
        const res = await api.get('/analytics/student/me/knowledge-graph?courseCode=CS301');
        setGraphData(res);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch learning intelligence.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#faf7f2] dark:bg-[#121b30] border border-[rgba(74,111,165,0.25)] dark:border-[rgba(106,144,197,0.2)] shadow-sm overflow-hidden transition-colors duration-200" style={{borderRadius:0}}>
      {/* Header with Badges */}
      <div className="p-6 bg-[#1a2540] dark:bg-[#0c1220] text-white flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[rgba(74,111,165,0.25)]">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#e05033]/20 border border-[#e05033]/40 text-[#fca5a5] text-[10px] font-mono uppercase tracking-widest mb-2" style={{borderRadius:0}}>
            <Sparkles className="w-3.5 h-3.5 text-[#e05033]" />
            <span>Cognitive Intelligence Active</span>
          </div>
          <h3 className="text-xl md:text-2xl font-bold tracking-tight font-display uppercase">Advanced Student Knowledge Modeling</h3>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl font-sans">
            Mathematical validation across Bayesian Knowledge Tracing (BKT), Item Response Theory (IRT), Ebbinghaus Forgetting Curves, and Multi-Topic Prerequisite DAGs.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-[#121b30] dark:bg-[#0a0f1a] p-1 border border-[rgba(74,111,165,0.3)] shrink-0 font-mono" style={{borderRadius:0}}>
          <button
            onClick={() => setActiveTab('bkt')}
            className={`flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition ${
              activeTab === 'bkt'
                ? 'bg-[#e05033] text-white'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
            style={{borderRadius:0}}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>BKT & IRT Benchmark</span>
          </button>
          <button
            onClick={() => setActiveTab('decay')}
            className={`flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition ${
              activeTab === 'decay'
                ? 'bg-[#e05033] text-white'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
            style={{borderRadius:0}}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Retention & Decay</span>
          </button>
          <button
            onClick={() => setActiveTab('graph')}
            className={`flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition ${
              activeTab === 'graph'
                ? 'bg-[#e05033] text-white'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
            style={{borderRadius:0}}
          >
            <GitFork className="w-3.5 h-3.5" />
            <span>Knowledge Graph</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="p-6">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-7 h-7 text-indigo-600 animate-spin" />
            <p className="text-xs font-medium text-slate-500">Evaluating probabilistic learning models...</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {error}
          </div>
        ) : (
          <>
            {/* TAB 1: BKT & IRT BENCHMARK */}
            {activeTab === 'bkt' && bktData && (
              <div className="space-y-6">


                {/* Latent Ability Banner */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-[#faf7f2] dark:bg-[#0c1220] border border-[rgba(74,111,165,0.3)] flex items-center gap-3" style={{borderRadius:0}}>
                    <div className="w-10 h-10 bg-[#4a6fa5] text-white flex items-center justify-center font-bold text-sm" style={{borderRadius:0}}>
                      θ
                    </div>
                    <div>
                      <p className="text-[10px] font-mono font-bold text-[#4a6fa5] dark:text-[#6a90c5] uppercase tracking-wider">
                        IRT Latent Ability (θ)
                      </p>
                      <p className="text-lg font-black text-slate-900 dark:text-white font-mono">
                        {bktData.totalTopicsEvaluated > 0
                          ? bktData.overallIrtAbility?.theta >= 0
                            ? `+${bktData.overallIrtAbility?.theta}`
                            : bktData.overallIrtAbility?.theta
                          : '0.00 (Uncalibrated)'}
                      </p>
                      <span className="text-[10px] text-[#4a6fa5] dark:text-[#6a90c5] font-semibold font-mono">
                        {bktData.totalTopicsEvaluated > 0
                          ? `${bktData.overallIrtAbility?.abilityPercentile ?? 50}th Percentile Rank`
                          : 'Baseline Calibration'}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-[#faf7f2] dark:bg-[#0c1220] border border-[rgba(74,111,165,0.3)] flex items-center gap-3" style={{borderRadius:0}}>
                    <div className="w-10 h-10 bg-[#e05033] text-white flex items-center justify-center font-bold text-sm" style={{borderRadius:0}}>
                      P(L)
                    </div>
                    <div>
                      <p className="text-[10px] font-mono font-bold text-[#e05033] dark:text-[#e8604a] uppercase tracking-wider">
                        BKT Knowledge State
                      </p>
                      <p className="text-lg font-black text-slate-900 dark:text-white font-mono">Probabilistic Tracing</p>
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold font-mono">
                        Slip: 10% | Guess: 20% | Transition: 15%
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-[#faf7f2] dark:bg-[#0c1220] border border-[rgba(74,111,165,0.3)] flex items-center gap-3" style={{borderRadius:0}}>
                    <div className="w-10 h-10 bg-amber-600 text-white flex items-center justify-center font-bold text-sm" style={{borderRadius:0}}>
                      α
                    </div>
                    <div>
                      <p className="text-[10px] font-mono font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                        EWMA Recency Weight
                      </p>
                      <p className="text-lg font-black text-slate-900 dark:text-white font-mono">α = 0.25</p>
                      <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold font-mono">
                        Difficulty-Weighted (1.0x - 1.5x)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Side-by-Side Comparison Table */}
                <div className="border border-[rgba(74,111,165,0.25)] overflow-hidden" style={{borderRadius:0}}>
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#ede8df] dark:bg-[#162038] border-b border-[rgba(74,111,165,0.25)] text-[#1a2540] dark:text-[#e8edf5] font-mono font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-3">Topic</th>
                        <th className="p-3">EWMA Score</th>
                        <th className="p-3">BKT P(L)</th>
                        <th className="p-3">Difference</th>
                        <th className="p-3">Model Concordance</th>
                        <th className="p-3">Recommended Mastery</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgba(74,111,165,0.15)] text-slate-700 dark:text-slate-300 font-medium">
                      {bktData.topicComparisons && bktData.topicComparisons.length > 0 ? (
                        bktData.topicComparisons.map((t: any) => (
                          <tr key={t.topicId} className="hover:bg-black/5 dark:hover:bg-white/5 transition">
                            <td className="p-3">
                              <span className="font-bold text-slate-900 dark:text-white">{t.topicName}</span>
                              <span className="block text-[10px] text-[#4a6fa5] dark:text-[#6a90c5] font-mono">{t.courseCode}</span>
                            </td>
                            <td className="p-3 font-mono font-bold text-[#4a6fa5] dark:text-[#6a90c5]">
                              {t.ewmaScore}%
                            </td>
                            <td className="p-3 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                              {t.bktProbabilityPct}%
                            </td>
                            <td className="p-3 font-mono text-slate-500">
                              ±{t.difference}%
                            </td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 text-[10px] font-mono font-bold border ${
                                  t.concordance === 'STRONG_AGREEMENT'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800'
                                    : 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800'
                                }`}
                                style={{borderRadius:0}}
                              >
                                {t.concordance.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="p-3 font-extrabold text-slate-900 dark:text-white font-mono">
                              {t.recommendedMastery}%
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400 italic font-mono">
                            No topics evaluated yet. Complete practice questions to benchmark EWMA vs Bayesian Knowledge Tracing.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: FORGETTING CURVE & RETENTION */}
            {activeTab === 'decay' && retentionData && (
              <div className="space-y-6">
                {/* Summary Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="p-4 bg-[#faf7f2] dark:bg-[#0c1220] border border-[rgba(74,111,165,0.3)]" style={{borderRadius:0}}>
                    <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Raw Baseline</p>
                    <p className="text-xl font-black text-slate-900 dark:text-white font-mono">
                      {retentionData.overallRawMastery}%
                    </p>
                    <span className="text-[10px] text-slate-500 font-mono">Unadjusted Score</span>
                  </div>

                  <div className="p-4 bg-[#faf7f2] dark:bg-[#0c1220] border border-[rgba(74,111,165,0.3)]" style={{borderRadius:0}}>
                    <p className="text-[10px] font-mono font-bold text-[#4a6fa5] uppercase tracking-wider">Effective Mastery</p>
                    <p className="text-xl font-black text-[#4a6fa5] dark:text-[#6a90c5] font-mono">
                      {retentionData.overallEffectiveMastery}%
                    </p>
                    <span className="text-[10px] text-[#4a6fa5] font-mono">Decayed Retention</span>
                  </div>

                  <div className="p-4 bg-[#faf7f2] dark:bg-[#0c1220] border border-[rgba(74,111,165,0.3)]" style={{borderRadius:0}}>
                    <p className="text-[10px] font-mono font-bold text-amber-600 uppercase tracking-wider">Reviews Due</p>
                    <p className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">
                      {retentionData.reviewsDueCount} Topics
                    </p>
                    <span className="text-[10px] text-amber-700 font-mono">Spaced Repetition Trigger</span>
                  </div>

                  <div className="p-4 bg-[#faf7f2] dark:bg-[#0c1220] border border-[rgba(74,111,165,0.3)]" style={{borderRadius:0}}>
                    <p className="text-[10px] font-mono font-bold text-emerald-600 uppercase tracking-wider">Retention Index</p>
                    <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                      {retentionData.overallRetentionRate}%
                    </p>
                    <span className="text-[10px] text-emerald-700 font-mono">Consolidated Memory</span>
                  </div>
                </div>

                {/* Topics Retention Grid */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-mono font-bold text-[#4a6fa5] dark:text-[#6a90c5] uppercase tracking-wider">
                    Ebbinghaus Concept Decay Status
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {retentionData.topics && retentionData.topics.length > 0 ? (
                      retentionData.topics.map((topic: any) => (
                        <div
                          key={topic.topicId}
                          className="p-4 border border-[rgba(74,111,165,0.25)] bg-[#faf7f2] dark:bg-[#0c1220] hover:border-[#4a6fa5] transition space-y-2.5"
                          style={{borderRadius:0}}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="text-[10px] font-mono font-bold text-[#4a6fa5] dark:text-[#6a90c5] uppercase">
                                {topic.courseCode}
                              </span>
                              <h5 className="text-sm font-bold text-slate-900 dark:text-white">{topic.topicName}</h5>
                            </div>
                            <span
                              className={`px-2 py-0.5 text-[10px] font-mono font-bold border ${
                                topic.retentionStatus === 'FRESH'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : topic.retentionStatus === 'STABLE'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : 'bg-[#e05033]/15 text-[#e05033] border-[#e05033]/30'
                              }`}
                              style={{borderRadius:0}}
                            >
                              {topic.retentionStatus.replace('_', ' ')}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs pt-1 font-mono">
                            <span className="text-slate-500">
                              Last practiced {topic.daysSinceLastPractice}d ago
                            </span>
                            <span className="font-extrabold text-slate-800 dark:text-slate-200">
                              Effective: {topic.decayedMastery}%{' '}
                              <span className="text-slate-400 font-normal">
                                (Raw: {topic.rawMastery}%)
                              </span>
                            </span>
                          </div>

                          <div className="w-full h-1.5 bg-[rgba(74,111,165,0.15)] overflow-hidden" style={{borderRadius:0}}>
                            <div
                              className={`h-full ${
                                topic.retentionRatePct >= 80
                                  ? 'bg-emerald-500'
                                  : topic.retentionRatePct >= 60
                                  ? 'bg-amber-500'
                                  : 'bg-[#e05033]'
                              }`}
                              style={{ width: `${topic.retentionRatePct}%`, borderRadius: 0 }}
                            ></div>
                          </div>

                          <p className="text-[11px] text-slate-500 italic font-mono">
                            {topic.decayExplanation}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 p-8 text-center text-slate-400 italic bg-black/5 dark:bg-white/5 border border-dashed border-[rgba(74,111,165,0.3)] font-mono" style={{borderRadius:0}}>
                        No topic retention records found. Practice questions to begin tracking Ebbinghaus memory decay.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: MULTI-TOPIC KNOWLEDGE DEPENDENCY GRAPH */}
            {activeTab === 'graph' && graphData && (
              <div className="space-y-6">
                <div className="p-4 bg-[#faf7f2] dark:bg-[#0c1220] border border-[rgba(74,111,165,0.25)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4" style={{borderRadius:0}}>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {graphData.courseName} ({graphData.courseCode}) Directed Acyclic Graph
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Pedagogical prerequisite dependency tree enforcing mastery continuity before advanced concepts.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 font-mono">
                    <span className="text-[10px] font-bold px-3 py-1 bg-emerald-100 text-emerald-800" style={{borderRadius:0}}>
                      {graphData.unlockedTopicsCount} Unlocked
                    </span>
                    <span className="text-[10px] font-bold px-3 py-1 bg-amber-100 text-amber-800" style={{borderRadius:0}}>
                      {graphData.blockedTopicsCount} Pending Prerequisites
                    </span>
                  </div>
                </div>

                {/* Nodes Display */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {graphData.nodes?.map((node: any) => (
                    <div
                      key={node.id}
                      className={`p-4 border transition ${
                        node.status === 'MASTERED'
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                          : node.status === 'READY_FOR_PRACTICE'
                          ? 'bg-[#faf7f2] dark:bg-[#0c1220] border-[rgba(74,111,165,0.25)]'
                          : 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
                      }`}
                      style={{borderRadius:0}}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-[10px] font-mono font-bold text-[#4a6fa5] uppercase">
                          Node
                        </span>
                        <span
                          className={`text-[9px] font-mono font-bold px-2 py-0.5 border ${
                            node.status === 'MASTERED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : node.status === 'READY_FOR_PRACTICE'
                              ? 'bg-blue-50 text-blue-700 border-blue-300'
                              : 'bg-amber-50 text-amber-700 border-amber-300'
                          }`}
                          style={{borderRadius:0}}
                        >
                          {node.status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <h5 className="text-xs font-bold text-slate-900 dark:text-white mb-2">{node.name}</h5>

                      <div className="flex justify-between items-center text-xs mb-1 font-mono">
                        <span className="text-slate-500">Knowledge Mastery</span>
                        <span className="font-extrabold text-slate-900 dark:text-white">{node.rawMastery}%</span>
                      </div>

                      <div className="w-full h-1.5 bg-[rgba(74,111,165,0.15)] overflow-hidden mb-3" style={{borderRadius:0}}>
                        <div
                          className="h-full bg-[#e05033]"
                          style={{ width: `${Math.min(100, Math.max(5, node.rawMastery))}%`, borderRadius: 0 }}
                        ></div>
                      </div>

                      {node.prerequisites && node.prerequisites.length > 0 && (
                        <div className="text-[10px] font-mono text-slate-500 border-t border-[rgba(74,111,165,0.15)] pt-2">
                          <span className="font-bold text-slate-600 dark:text-slate-400">Requires: </span>
                          <span>{node.prerequisites.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
