'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Eye,
  Camera,
  UserCheck,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ExternalLink,
  Search,
  RefreshCw,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Sidebar } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';

interface ViolationItem {
  id: string;
  type: string;
  severity: string;
  confidence: number;
  timestamp: string;
  details?: string;
}

interface ProctoringSessionItem {
  id: string;
  submissionId: string;
  studentName: string;
  enrollmentNumber: string;
  assessmentTitle: string;
  assessmentCode: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FLAGGED' | 'INVALIDATED';
  trustScore: number;
  violationsCount: number;
  faceEnrollmentVerified: boolean;
  startedAt: string;
  completedAt?: string;
  invigilatorNotes?: string;
  violations: ViolationItem[];
}

export default function FacultyInvigilationPage() {
  const [sessions, setSessions] = useState<ProctoringSessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedSession, setSelectedSession] = useState<ProctoringSessionItem | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'FLAGGED' | 'IN_PROGRESS' | 'COMPLETED'>('ALL');
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    fetchSessions(true);

    // Dynamic Live Polling (every 5 seconds) to track 150 student workstations in real-time
    const interval = setInterval(() => {
      fetchSessions(false);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const fetchSessions = async (initial = false) => {
    if (initial) setLoading(true);
    else setIsSyncing(true);
    try {
      const res: any = await api.get('/proctoring/invigilator/sessions');
      if (Array.isArray(res)) {
        const mapped = res.map((s: any) => ({
          id: s.id,
          submissionId: s.submissionId,
          studentName:
            s.student?.authorizedStudent?.name ||
            s.student?.user?.name ||
            s.student?.user?.email?.split('@')[0] ||
            s.student?.email ||
            'Student',
          enrollmentNumber:
            s.student?.authorizedStudent?.enrollmentNumber ||
            s.student?.enrollmentNumber ||
            '24CS001',
          assessmentTitle: s.submission?.assessment?.title || 'Proctored Assessment',
          assessmentCode: s.submission?.assessment?.code || 'ASSESSMENT',
          status: s.status,
          trustScore: s.trustScore,
          violationsCount: s.violationsCount,
          faceEnrollmentVerified: s.faceEnrollmentVerified,
          startedAt: s.startedAt,
          completedAt: s.completedAt,
          invigilatorNotes: s.invigilatorNotes,
          violations: s.violations || [],
        }));
        setSessions(mapped);
        setSelectedSession((current) => {
          if (!current && mapped.length > 0) return mapped[0];
          if (current) {
            const updated = mapped.find((m) => m.id === current.id);
            return updated || current;
          }
          return null;
        });
      } else {
        setSessions([]);
      }
    } catch {
      // keep current state on background poll hiccup
    } finally {
      if (initial) setLoading(false);
      setIsSyncing(false);
    }
  };

  const handleReviewAction = async (decision: 'APPROVED' | 'FLAGGED' | 'INVALIDATED') => {
    if (!selectedSession) return;
    setIsSubmittingReview(true);
    try {
      await api.patch(`/proctoring/invigilator/sessions/${selectedSession.id}/review`, {
        decision,
        notes: reviewNotes || selectedSession.invigilatorNotes || `Marked ${decision} by Invigilator`,
      });
      const newStatus =
        decision === 'APPROVED' ? 'COMPLETED' : decision === 'FLAGGED' ? 'FLAGGED' : 'INVALIDATED';
      const updatedList = sessions.map((s) =>
        s.id === selectedSession.id
          ? { ...s, status: newStatus as any, invigilatorNotes: reviewNotes || s.invigilatorNotes }
          : s
      );
      setSessions(updatedList);
      setSelectedSession({ ...selectedSession, status: newStatus as any, invigilatorNotes: reviewNotes });
    } catch {
      // Local optimistic update
      const newStatus =
        decision === 'APPROVED' ? 'COMPLETED' : decision === 'FLAGGED' ? 'FLAGGED' : 'INVALIDATED';
      const updatedList = sessions.map((s) =>
        s.id === selectedSession.id
          ? { ...s, status: newStatus as any, invigilatorNotes: reviewNotes || s.invigilatorNotes }
          : s
      );
      setSessions(updatedList);
      setSelectedSession({ ...selectedSession, status: newStatus as any, invigilatorNotes: reviewNotes });
    } finally {
      setIsSubmittingReview(false);
      setReviewNotes('');
    }
  };

  const filteredSessions = sessions.filter((s) => {
    if (statusFilter === 'ALL') return true;
    return s.status === statusFilter;
  });

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (score >= 65) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
  };

  return (
    <div className="min-h-screen bg-transparent text-[#1a2540] dark:text-[#e8edf5] flex font-sans relative z-10">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col min-w-0">
        <Navbar
          title="Exam Integrity & AI Invigilation Console"
          subtitle="Real-time multi-modal proctoring logs, trust score audits & violation review"
        />
        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-300 w-full">
          {/* Gleam-Spark Page Intro Banner */}
          <div className="page-intro">
            <div>
              <p className="mono">FACULTY / PROCTORING / 04</p>
              <h1 className="page-title display">
                INVIGILATION <span className="coral">CONSOLE.</span>
              </h1>
            </div>
            <div className="readiness">
              <p className="mono">PROCTORING AUDIT</p>
              <strong>
                {sessions.length}
                <span>SESS</span>
              </strong>
              <p className="mono blue">{sessions.filter((s) => s.status === 'FLAGGED').length > 0 ? `${sessions.filter((s) => s.status === 'FLAGGED').length} SUSPECT SESSIONS` : 'INTEGRITY VERIFIED'}</p>
            </div>
          </div>

          {/* Gleam-Spark 4-Column Metrics Bar */}
          <div className="metrics">
            <div className="metric">
              <div className="metric-top mono"><span>01</span><span>LIVE</span></div>
              <div className="metric-value">{sessions.length}</div>
              <div className="metric-label mono">PROCTORED SESSIONS</div>
            </div>
            <div className="metric">
              <div className="metric-top mono"><span>02</span><span className="blue">HIGH TRUST</span></div>
              <div className="metric-value">{sessions.filter((s) => s.trustScore >= 80).length}</div>
              <div className="metric-label mono">TRUST &ge; 80%</div>
            </div>
            <div className="metric">
              <div className="metric-top mono"><span>03</span><span className="coral">FLAGGED</span></div>
              <div className="metric-value">{sessions.filter((s) => s.status === 'FLAGGED').length}</div>
              <div className="metric-label mono">INTEGRITY FLAGS</div>
            </div>
            <div className="metric">
              <div className="metric-top mono"><span>04</span><span>AUDIT</span></div>
              <div className="metric-value">100%</div>
              <div className="metric-label mono">HUMAN-IN-THE-LOOP</div>
            </div>
          </div>

          {/* Gleam-Spark Priority Band Callout */}
          <div className="priority-band">
            <div className="priority-symbol">!</div>
            <div className="priority-content">
              <p className="mono">AI PROCTORING / REAL-TIME TELEMETRY</p>
              <h2 className="display">REAL-TIME BEHAVIORAL AUDITING &amp; LOGGING</h2>
              <p>AI-assisted exam integrity monitoring with browser focus tracking, continuous facial verification, and human invigilator oversight.</p>
            </div>
            <button
              type="button"
              onClick={() => fetchSessions(true)}
              className="action-button bg-[#e05033] text-white hover:bg-[#c8432b] shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>SYNC TELEMETRY</span>
            </button>
          </div>

      {/* Main Grid: Sessions List + Detail Audit Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sessions Roster */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Exam Submissions ({filteredSessions.length})
            </h2>

            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px]">
              {(['ALL', 'FLAGGED', 'IN_PROGRESS', 'COMPLETED'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2 py-0.5 rounded-lg font-medium transition-colors ${
                    statusFilter === st
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="p-8 text-center text-slate-500 text-sm rounded-xl bg-slate-900/40 border border-slate-800">
                Loading live proctoring telemetry...
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm rounded-xl bg-slate-900/40 border border-slate-800 space-y-2">
                <Camera className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                <div className="font-semibold text-slate-400">No Proctored Telemetry Sessions</div>
                <div className="text-xs text-slate-500 max-w-xs mx-auto">
                  No active or historical exam proctoring sessions match this filter. Live telemetry streams dynamically as students take proctored assessments.
                </div>
              </div>
            ) : (
              filteredSessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => setSelectedSession(session)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    selectedSession?.id === session.id
                      ? 'bg-slate-800/90 border-amber-500/50 shadow-md shadow-amber-500/10'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div>
                      <span className="font-bold text-white text-sm block">{session.studentName}</span>
                      <span className="text-xs text-slate-400 font-mono">{session.enrollmentNumber}</span>
                    </div>
                    <div className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border ${getScoreColor(session.trustScore)}`}>
                      {session.trustScore}% Trust
                    </div>
                  </div>

                  <div className="text-xs text-slate-400 line-clamp-1 mb-2">
                    {session.assessmentTitle}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800/60">
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-500" />
                      {session.violationsCount} Anomaly Flags
                    </span>
                    <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                      session.status === 'FLAGGED'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-slate-800 text-slate-300'
                    }`}>
                      {session.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Selected Session Audit Detail */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6">
          {selectedSession ? (
            <>
              {/* Session Top Card */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-white">{selectedSession.studentName}</h3>
                    <span className="font-mono text-xs text-slate-400">({selectedSession.enrollmentNumber})</span>
                    {selectedSession.faceEnrollmentVerified && (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Face Enrolled
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">{selectedSession.assessmentTitle}</p>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-black font-mono text-white">
                    {selectedSession.trustScore}
                    <span className="text-xs font-normal text-slate-400"> / 100</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium">Integrity Trust Index</div>
                </div>
              </div>

              {/* Behavioral Anomaly Timeline */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Objective Behavioral Timeline ({selectedSession.violations.length} Events)
                </h4>

                {selectedSession.violations.length > 0 ? (
                  <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-2">
                    {selectedSession.violations.map((v) => {
                      const snapshotMatch = v.details?.match(/\[SNAPSHOT:(data:image\/[a-zA-Z]+;base64,[^\]]+)\]/);
                      const cleanDetails = v.details ? v.details.replace(/\[SNAPSHOT:.*?\]/g, '').trim() : '';
                      const snapshotData = snapshotMatch ? snapshotMatch[1] : null;

                      return (
                        <div
                          key={v.id}
                          className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-amber-400 font-mono">{v.type}</span>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                                {Math.round(v.confidence * 100)}% Confidence
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {new Date(v.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                          {cleanDetails && (
                            <p className="text-xs text-slate-300 leading-relaxed font-sans">{cleanDetails}</p>
                          )}
                          {snapshotData && (
                            <div className="pt-1.5">
                              <div className="text-[10px] font-bold text-rose-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                <Camera className="w-3 h-3" /> Captured Lab Video Evidence
                              </div>
                              <div className="relative group inline-block rounded-lg overflow-hidden border border-rose-500/30 bg-black max-w-xs shadow-md">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={snapshotData}
                                  alt="Violation evidence snapshot"
                                  className="w-48 h-auto object-cover rounded cursor-pointer hover:scale-105 transition-transform duration-200"
                                  onClick={() => window.open(snapshotData, '_blank')}
                                />
                                <span className="text-[9px] text-slate-400 px-1.5 py-0.5 bg-black/70 absolute bottom-1 right-1 rounded">
                                  Click to inspect
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 text-center text-slate-500 text-sm rounded-xl bg-slate-950/40 border border-slate-800/60">
                    No integrity anomalies recorded during this evaluation session.
                  </div>
                )}
              </div>

              {/* Invigilator Review Action Box */}
              <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Human Invigilator Academic Review
                </h4>

                {selectedSession.invigilatorNotes && (
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
                    <span className="font-bold text-slate-200">Current Notes: </span>
                    {selectedSession.invigilatorNotes}
                  </div>
                )}

                <textarea
                  rows={2}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Record formal invigilator observation notes (e.g. verified student connectivity drop, benign window swap, or disciplinary referral)..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={() => handleReviewAction('APPROVED')}
                    disabled={isSubmittingReview}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Clear
                  </button>

                  <button
                    onClick={() => handleReviewAction('FLAGGED')}
                    disabled={isSubmittingReview}
                    className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" /> Flag for Disciplinary Review
                  </button>

                  <button
                    onClick={() => handleReviewAction('INVALIDATED')}
                    disabled={isSubmittingReview}
                    className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Invalidate Submission
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-500">
              Select an exam submission to inspect the proctoring audit log.
            </div>
          )}
        </div>
      </div>
        </main>
      </div>
    </div>
  );
}
