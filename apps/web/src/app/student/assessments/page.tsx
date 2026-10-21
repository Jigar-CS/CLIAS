'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { Sidebar } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';
import {
  FileText,
  Clock,
  Award,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  AlertCircle,
  ChevronRight,
  BookOpen,
  Trophy,
  GraduationCap,
} from 'lucide-react';
import { AssessmentLeaderboardModal } from '@/components/AssessmentLeaderboardModal';

interface AssessmentItem {
  id: string;
  title: string;
  description?: string;
  code: string;
  courseCode: string;
  courseName: string;
  type: string;
  division?: string;
  batch?: string;
  rollFilter?: string;
  status: string;
  durationMinutes: number;
  totalMarks: number;
  passingMarks: number;
  totalQuestions: number;
  allowedAttempts: number;
  attemptsCount: number;
  hasAvailableAttempts: boolean;
  activeSubmissionId: string | null;
  bestScore: number | null;
  bestPercentage: number | null;
  passed: boolean;
  isExpired?: boolean;
  expiresAt?: string;
  mySubmissions?: Array<{
    id?: string;
    percentage?: number;
    score?: number;
    status?: string;
  }>;
}

export default function StudentAssessmentsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [assessments, setAssessments] = useState<AssessmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCourse, setFilterCourse] = useState<string>('ALL');
  const [selectedLeaderboardAssessment, setSelectedLeaderboardAssessment] = useState<{
    id: string;
    title: string;
  } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }
    if (user) {
      loadAssessments();
    }
  }, [user, authLoading]);

  const loadAssessments = async () => {
    setLoading(true);
    try {
      const data = await api.get('/assessments/student');
      setAssessments(data);
    } catch (err) {
      console.error('Failed to load assessments', err);
    } finally {
      setLoading(false);
    }
  };

  const courses = Array.from(new Set(assessments.map((a) => a.courseCode)));
  const filtered = filterCourse === 'ALL' ? assessments : assessments.filter((a) => a.courseCode === filterCourse);

  const evaluatedAssessments = assessments.filter(
    (a) => typeof a.bestPercentage === 'number' && a.bestPercentage !== null,
  );

  const avgExamScore =
    evaluatedAssessments.length > 0
      ? Math.round(
          evaluatedAssessments.reduce((acc, a) => acc + (a.bestPercentage || 0), 0) /
            evaluatedAssessments.length,
        )
      : 0;

  return (
    <div className="min-h-screen bg-transparent text-[#1a2540] dark:text-[#e8edf5] flex font-sans relative z-10">
      <Sidebar />

      <div className="flex-1 ml-64 flex flex-col min-w-0">
        <Navbar
          title="Formal Assessments & Exams"
          subtitle="Departmental quizzes, mid-terms, and timed evaluations"
        />

        <main className="p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto space-y-6">
          {/* Gleam-Spark Page Intro */}
          <div className="page-intro">
            <div>
              <h1 className="page-title font-display text-5xl sm:text-6xl text-[#1a2540] dark:text-[#f5f0e8] uppercase tracking-tight">
                ASSESSMENT ARENA
              </h1>
            </div>
            <div className="readiness">
              <p className="mono text-xs font-semibold uppercase tracking-wider text-[#6b7fa3]">EXAM READINESS</p>
              <strong className="font-display text-4xl text-[#1a2540] dark:text-[#f5f0e8]">
                {avgExamScore}<span className="font-mono text-sm text-[#e05033]">%</span>
              </strong>
              <p className="mono text-xs font-semibold text-[#4a6fa5] dark:text-[#6a90c5] uppercase tracking-wider">PROCTORED EVALUATION</p>
            </div>
          </div>

          {/* Gleam-Spark 4-Column Metric Band */}
          <div className="metrics">
            <div className="metric">
              <div className="metric-top mono"><span>01</span><span className="text-[#e05033]">ACTIVE</span></div>
              <div className="metric-value font-display text-2xl sm:text-3xl">{assessments.length}</div>
              <div className="metric-label mono">TOTAL ASSIGNED</div>
            </div>
            <div className="metric">
              <div className="metric-top mono"><span>02</span><span className="text-[#4a6fa5]">COURSES</span></div>
              <div className="metric-value font-display text-2xl sm:text-3xl">{courses.length}</div>
              <div className="metric-label mono">SUBJECT DOMAINS</div>
            </div>
            <div className="metric">
              <div className="metric-top mono"><span>03</span><span>TIMED</span></div>
              <div className="metric-value font-display text-2xl sm:text-3xl">SECURE</div>
              <div className="metric-label mono">INTEGRITY MONITORED</div>
            </div>
            <div className="metric">
              <div className="metric-top mono"><span>04</span><span className="text-[#4a6fa5]">CHARUSAT</span></div>
              <div className="metric-value font-display text-2xl sm:text-3xl">OFFICIAL</div>
              <div className="metric-label mono">SEMESTER EXAMS</div>
            </div>
          </div>

          {/* Gleam-Spark Priority Band with Course Filter */}
          <div className="priority-band">
            <div className="priority-symbol">!</div>
            <div className="priority-content">
              <h2 className="font-display text-xl uppercase tracking-wide">DEPARTMENT TIMED ASSESSMENTS</h2>
              <p className="text-xs text-[#8ba0c0] font-sans">
                Official assessments assigned by course faculty. Ensure stable connection before beginning your timed attempt.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#e8edf5]">Filter:</span>
              <select
                value={filterCourse}
                onChange={(e) => setFilterCourse(e.target.value)}
                className="bg-[#1a2540] text-white border border-[rgba(106,144,197,0.3)] text-xs font-mono px-3 py-2 uppercase"
                style={{ borderRadius: 0 }}
              >
                <option value="ALL">ALL COURSES</option>
                {courses.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Assessment Cards Grid */}
          {loading ? (
            <div className="p-12 text-center text-xs font-mono font-semibold text-slate-400">
              Loading assessments...
            </div>
          ) : filtered.length === 0 ? (
            <div className="border border-[rgba(74,111,165,0.25)] dark:border-[rgba(106,144,197,0.2)] bg-[#faf7f2] dark:bg-[#121b30] p-12 text-center text-slate-500 dark:text-slate-400" style={{ borderRadius: 0 }}>
              <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="font-display text-xl text-[#1a2540] dark:text-[#f5f0e8] uppercase">No Assessments Assigned</p>
              <p className="text-xs font-mono text-[#4a6fa5] mt-1">You currently have no pending tests for this filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {filtered.map((item) => {
                const canAttempt = item.hasAvailableAttempts || !!item.activeSubmissionId;

                return (
                  <div
                    key={item.id}
                    className="bg-[#faf7f2] dark:bg-[#121b30] border border-[rgba(74,111,165,0.25)] dark:border-[rgba(106,144,197,0.2)] p-4 sm:p-6 shadow-xs flex flex-col justify-between"
                    style={{ borderRadius: 0 }}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
                            {item.courseCode}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-xs font-mono font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {item.type}
                          </span>
                          {item.batch && item.batch !== 'ALL' ? (
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30 flex items-center gap-1">
                              <GraduationCap className="w-3 h-3" />
                              Batch &apos;{item.batch}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                              <GraduationCap className="w-3 h-3" />
                              All Batches
                            </span>
                          )}
                          {item.division && (
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-bold ${item.division === 'DIV 1'
                                  ? 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30'
                                  : item.division === 'DIV 2'
                                    ? 'bg-purple-50 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30'
                                    : 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30'
                                }`}
                            >
                              {item.division === 'DIV 1'
                                ? 'Division A'
                                : item.division === 'DIV 2'
                                  ? 'Division B'
                                  : 'All Divisions'}
                            </span>
                          )}
                          {item.rollFilter && item.rollFilter !== 'ALL' && (
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                item.rollFilter === 'ODD'
                                  ? 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30'
                                  : 'bg-purple-50 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30'
                              }`}
                            >
                              {item.rollFilter === 'ODD' ? 'Odd IDs Only' : 'Even IDs Only'}
                            </span>
                          )}
                          {item.isExpired && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Test Ended
                            </span>
                          )}
                        </div>

                        {item.bestScore !== null && (
                          <div className="flex items-center gap-1.5 text-xs font-bold">
                            {item.passed ? (
                              <span className="text-emerald-600 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {item.bestPercentage?.toFixed(0)}% Passed
                              </span>
                            ) : (
                              <span className="text-rose-600 flex items-center gap-1">
                                <XCircle className="w-3.5 h-3.5" />
                                {item.bestPercentage?.toFixed(0)}% Retake
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                        {item.title}
                      </h3>
                      {item.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      )}

                      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/60">
                          <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Duration</span>
                          <span className="font-bold text-slate-800 dark:text-slate-100 flex items-center justify-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                            {item.durationMinutes}m
                          </span>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/60">
                          <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Questions</span>
                          <span className="font-bold text-slate-800 dark:text-slate-100 mt-0.5 block">
                            {item.totalQuestions} MCQs
                          </span>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/60">
                          <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Attempts</span>
                          <span className="font-bold text-slate-800 dark:text-slate-100 mt-0.5 block">
                            {item.attemptsCount} / {item.allowedAttempts}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        Passing criteria: <strong className="text-slate-700 dark:text-slate-200">{item.passingMarks}%</strong>
                      </span>

                      <div className="flex items-center gap-2">
                        {/* Leaderboard Action Button */}
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedLeaderboardAssessment({ id: item.id, title: item.title })
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-[rgba(74,111,165,0.12)] hover:bg-[rgba(74,111,165,0.2)] text-[#4a6fa5] dark:text-[#6a90c5] border border-[rgba(74,111,165,0.3)] text-xs font-mono font-bold uppercase tracking-wider transition"
                          style={{ borderRadius: 0 }}
                          title="View dynamic live leaderboard for this assessment"
                        >
                          <Trophy className="w-3.5 h-3.5 text-[#e05033]" />
                          <span>Leaderboard</span>
                        </button>

                        {item.isExpired ? (
                          <span
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold uppercase cursor-not-allowed select-none"
                            style={{ borderRadius: 0 }}
                            title="The scheduled duration for this test has ended and submissions are closed."
                          >
                            <Clock className="w-3.5 h-3.5 text-[#e05033]" />
                            <span>Test Ended</span>
                          </span>
                        ) : canAttempt ? (
                          <button
                            type="button"
                            onClick={() => router.push(`/student/assessments/${item.id}/take`)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-[#e05033] hover:bg-[#c8432b] text-white text-xs font-mono font-bold uppercase tracking-wider transition"
                            style={{ borderRadius: 0 }}
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>{item.activeSubmissionId ? 'Resume Exam' : 'Start Exam'}</span>
                          </button>
                        ) : (
                          <span className="text-xs font-mono font-semibold text-slate-400 px-2 py-1 uppercase">
                            Completed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Dynamic Assessment Leaderboard Modal */}
      {selectedLeaderboardAssessment && (
        <AssessmentLeaderboardModal
          assessmentId={selectedLeaderboardAssessment.id}
          assessmentTitle={selectedLeaderboardAssessment.title}
          isOpen={!!selectedLeaderboardAssessment}
          onClose={() => setSelectedLeaderboardAssessment(null)}
        />
      )}
    </div>
  );
}
