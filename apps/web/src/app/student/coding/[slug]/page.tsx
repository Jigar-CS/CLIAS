'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useSidebar } from '@/lib/sidebar-context';
import { api } from '@/lib/api';
import { Sidebar } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';
import {
  Code,
  Play,
  Send,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Cpu,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowLeft,
  Terminal,
  FileCode,
  BookOpen,
  Eye,
  Copy,
  Check,
  X,
  Filter,
} from 'lucide-react';
import Link from 'next/link';

interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  explanation?: string;
  order: number;
}

interface ProblemDetail {
  id: string;
  slug: string;
  title: string;
  description: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  starterCodes: string;
  constraints: string;
  hints?: string;
  tags?: string;
  testCases: TestCase[];
}

interface TestResultDetail {
  testCaseNumber?: number;
  testCase?: number;
  status: 'PASSED' | 'FAILED';
  input?: string;
  expectedOutput?: string;
  expected?: string;
  actualOutput?: string;
  actual?: string;
  executionTimeMs?: number;
  timeMs?: number;
  consoleOutput?: string;
}

interface ExecutionVerdict {
  status: 'ACCEPTED' | 'WRONG_ANSWER' | 'COMPILATION_ERROR' | 'RUNTIME_ERROR' | 'TIME_LIMIT_EXCEEDED' | 'MEMORY_LIMIT_EXCEEDED';
  score?: number;
  totalTestCases: number;
  testCasesPassed: number;
  executionTimeMs: number;
  memoryKb?: number;
  memoryUsedKb?: number;
  outputMessage?: string;
  feedback?: string;
  testResults?: TestResultDetail[];
  judgeDetails?: TestResultDetail[];
}

interface SubmissionRecord {
  id: string;
  problemId: string;
  studentId: string;
  language: string;
  sourceCode: string;
  status: string;
  score: number;
  testCasesPassed: number;
  totalTestCases: number;
  executionTimeMs: number;
  memoryUsedKb: number;
  createdAt: string;
  problem?: {
    id?: string;
    title: string;
    slug: string;
    difficulty?: string;
  };
}

function renderFormattedInline(content: string) {
  const parts = content.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code
          key={i}
          className="mx-0.5 px-1.5 py-0.5 rounded font-mono text-xs bg-[var(--secondary)]/10 text-slate-900 dark:text-blue-300 border border-[var(--grid-line)]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={i} className="font-semibold text-slate-900 dark:text-slate-100">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

function RichProblemDescription({ text }: { text: string }) {
  if (!text) return null;

  // If description has examples embedded at the end, slice it off so it doesn't duplicate with the structured Example Test Cases
  const exampleMatch = text.search(/\n\s*(\*\*Example\s*\d+:?|Example\s*\d+:?)/i);
  const narrativeText = exampleMatch !== -1 ? text.slice(0, exampleMatch).trim() : text.trim();

  // Split by code fences ```
  const sections = narrativeText.split(/```/g);

  return (
    <div className="space-y-3 font-sans text-sm leading-relaxed text-slate-800 dark:text-slate-200">
      {sections.map((section, idx) => {
        // If odd index, it's inside a code block
        if (idx % 2 === 1) {
          const trimmed = section.trim();
          return (
            <pre
              key={idx}
              className="p-3 my-2 rounded bg-[var(--secondary)]/5 dark:bg-slate-900/60 border border-[var(--grid-line)] font-mono text-xs leading-relaxed overflow-x-auto text-slate-800 dark:text-slate-200"
            >
              {trimmed}
            </pre>
          );
        }

        // Even index: regular text paragraphs
        const paragraphs = section.split(/\n\s*\n/);
        return (
          <React.Fragment key={idx}>
            {paragraphs.map((para, pIdx) => {
              const trimmedPara = para.trim();
              if (!trimmedPara) return null;

              // Check if bulleted list
              if (trimmedPara.startsWith('- ') || trimmedPara.startsWith('* ')) {
                const items = trimmedPara.split(/\n[-*]\s+/).filter(Boolean);
                return (
                  <ul key={pIdx} className="space-y-1 pl-4 list-disc text-sm text-slate-700 dark:text-slate-300">
                    {items.map((item, iIdx) => (
                      <li key={iIdx}>{renderFormattedInline(item.replace(/^[-*]\s+/, ''))}</li>
                    ))}
                  </ul>
                );
              }

              return (
                <p key={pIdx} className="text-sm leading-relaxed text-slate-800 dark:text-slate-200 font-sans">
                  {renderFormattedInline(trimmedPara)}
                </p>
              );
            })}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function ProblemEditorPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { isPinned } = useSidebar();

  const [problem, setProblem] = useState<ProblemDetail | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('PYTHON');
  const [sourceCode, setSourceCode] = useState<string>('');
  const [starterCodesMap, setStarterCodesMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [executing, setExecuting] = useState<boolean>(false);
  const [verdict, setVerdict] = useState<ExecutionVerdict | null>(null);
  const [selectedTestTab, setSelectedTestTab] = useState<number>(0);
  const [showHints, setShowHints] = useState<boolean>(false);
  const [copiedCaseIdx, setCopiedCaseIdx] = useState<number | null>(null);

  // Submission history & inspection state
  const [leftTab, setLeftTab] = useState<'problem' | 'submissions'>('problem');
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<SubmissionRecord[]>([]);
  const [submissionScope, setSubmissionScope] = useState<'problem' | 'all'>('problem');
  const [loadingSubmissions, setLoadingSubmissions] = useState<boolean>(false);
  const [inspectedSubmission, setInspectedSubmission] = useState<SubmissionRecord | null>(null);
  const [submissionFilter, setSubmissionFilter] = useState<'ALL' | 'ACCEPTED' | 'FAILED'>('ALL');
  const [codeCopied, setCodeCopied] = useState<boolean>(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }

    if (user && slug) {
      loadProblem();
    }
  }, [user, authLoading, slug]);

  const loadSubmissions = async (problemIdOrSlug?: string) => {
    setLoadingSubmissions(true);
    try {
      const targetProb = problemIdOrSlug || problem?.id || slug;
      const [probSubs, allSubs] = await Promise.all([
        targetProb ? api.get(`/coding/submissions?problemId=${targetProb}`) : Promise.resolve([]),
        api.get('/coding/submissions'),
      ]);
      setSubmissions(Array.isArray(probSubs) ? probSubs : []);
      setAllSubmissions(Array.isArray(allSubs) ? allSubs : []);
    } catch (err: any) {
      console.error('Failed to load submissions:', err);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const loadProblem = async () => {
    setLoading(true);
    try {
      const data = await api.get(`/coding/problems/${slug}`);
      setProblem(data);

      let parsedStarters: Record<string, string> = {};
      try {
        parsedStarters = JSON.parse(data.starterCodes);
      } catch {
        parsedStarters = { PYTHON: '# Write your solution here' };
      }
      setStarterCodesMap(parsedStarters);
      setSourceCode(parsedStarters[selectedLanguage] || '# Write your solution here');

      loadSubmissions(data?.id || (Array.isArray(slug) ? slug[0] : slug));
    } catch (err: any) {
      console.error('Failed to load problem:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (newLang: string) => {
    setSelectedLanguage(newLang);
    if (starterCodesMap[newLang]) {
      setSourceCode(starterCodesMap[newLang]);
    }
    setVerdict(null);
  };

  const handleReset = () => {
    if (starterCodesMap[selectedLanguage]) {
      setSourceCode(starterCodesMap[selectedLanguage]);
    }
    setVerdict(null);
  };

  const handleRunCode = async () => {
    if (!problem) return;
    setExecuting(true);
    setVerdict(null);
    try {
      const res = await api.post(`/coding/problems/${problem.id}/run`, {
        language: selectedLanguage,
        sourceCode,
      });
      setVerdict(res);
      setSelectedTestTab(0);
    } catch (err: any) {
      console.error('Failed to run code:', err);
      setVerdict({
        status: 'RUNTIME_ERROR',
        totalTestCases: 0,
        testCasesPassed: 0,
        executionTimeMs: 0,
        outputMessage: err.message || 'Server error while running code.',
        testResults: [],
      });
    } finally {
      setExecuting(false);
    }
  };

  const handleSubmitCode = async () => {
    if (!problem) return;
    setExecuting(true);
    setVerdict(null);
    try {
      const res = await api.post(`/coding/problems/${problem.id}/submit`, {
        language: selectedLanguage,
        sourceCode,
      });
      setVerdict(res.verdict);
      setSelectedTestTab(0);
      loadSubmissions(problem.id);
    } catch (err: any) {
      console.error('Failed to submit code:', err);
      setVerdict({
        status: 'RUNTIME_ERROR',
        totalTestCases: 0,
        testCasesPassed: 0,
        executionTimeMs: 0,
        outputMessage: err.message || 'Server error while submitting code.',
        testResults: [],
      });
    } finally {
      setExecuting(false);
    }
  };

  const testList = verdict?.testResults || verdict?.judgeDetails || [];

  const currentList = submissionScope === 'problem' ? submissions : allSubmissions;
  const filteredSubmissions = currentList.filter((sub) => {
    if (submissionFilter === 'ALL') return true;
    if (submissionFilter === 'ACCEPTED') return sub.status === 'ACCEPTED';
    if (submissionFilter === 'FAILED') return sub.status !== 'ACCEPTED';
    return true;
  });

  return (
    <div className="flex bg-transparent min-h-screen text-[#1a2540] dark:text-[#e8edf5] font-sans relative z-10">
      <Sidebar />
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isPinned ? 'pl-64' : 'pl-[72px]'}`}>
        <Navbar />

        <main className="p-6 max-w-[1600px] w-full mx-auto space-y-4">
          {/* Top Bar Navigation */}
          <div className="flex items-center justify-between">
            <Link
              href="/student/coding"
              className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-slate-600 dark:text-slate-400 hover:text-[var(--primary)] transition-colors font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              ← BACK TO CODING ARENA
            </Link>

            <div className="flex items-center gap-3">
              {submissions.some((s) => s.status === 'ACCEPTED') && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 font-mono text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  SOLVED
                </span>
              )}
              <span
                className={`px-2.5 py-0.5 font-mono text-xs font-bold border ${problem?.difficulty === 'EASY'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                    : problem?.difficulty === 'MEDIUM'
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                  }`}
              >
                {problem?.difficulty || 'MEDIUM'}
              </span>
              <span className="font-mono text-xs text-slate-600 dark:text-slate-400 font-medium">PROBLEM #{problem?.slug}</span>
            </div>
          </div>

          {loading || !problem ? (
            <div className="panel p-16 text-center font-mono text-xs uppercase tracking-wider text-slate-600 dark:text-slate-400">
              INITIALIZING CODE COMPILER SANDBOX...
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Pane: Problem Description & Submissions (5 Cols) */}
              <div className="lg:col-span-5 panel p-6 space-y-6 max-h-[820px] overflow-y-auto">
                {/* Left Pane Navigation Tabs */}
                <div className="flex items-center gap-2 border-b border-[var(--grid-line)] pb-3">
                  <button
                    onClick={() => setLeftTab('problem')}
                    className={`font-mono text-xs uppercase tracking-wider px-3 py-1.5 border transition-all flex items-center gap-1.5 ${
                      leftTab === 'problem'
                        ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                        : 'border-[var(--grid-line)] text-slate-600 dark:text-slate-400 hover:text-inherit'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    PROBLEM
                  </button>
                  <button
                    onClick={() => {
                      setLeftTab('submissions');
                      if (problem) loadSubmissions(problem.id);
                    }}
                    className={`font-mono text-xs uppercase tracking-wider px-3 py-1.5 border transition-all flex items-center gap-1.5 ${
                      leftTab === 'submissions'
                        ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                        : 'border-[var(--grid-line)] text-slate-600 dark:text-slate-400 hover:text-inherit'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    SUBMISSIONS
                    {submissions.length > 0 && (
                      <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-[rgba(74,111,165,0.15)] dark:bg-slate-900 text-[var(--primary)] border border-[var(--grid-line)] font-bold">
                        {submissions.length}
                      </span>
                    )}
                  </button>
                </div>

                {leftTab === 'submissions' ? (
                  <div className="space-y-4">
                    {/* Scope & Filter Controls */}
                    <div className="flex flex-col gap-2 pb-3 border-b border-[var(--grid-line)]">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        {/* Scope Switcher: This Problem vs All Problems */}
                        <div className="flex items-center gap-1 bg-[var(--secondary)]/10 p-0.5 border border-[var(--grid-line)]">
                          <button
                            onClick={() => setSubmissionScope('problem')}
                            className={`font-mono text-xs uppercase tracking-wider px-2.5 py-1 border transition-all ${
                              submissionScope === 'problem'
                                ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-inherit'
                            }`}
                          >
                            This Problem ({submissions.length})
                          </button>
                          <button
                            onClick={() => setSubmissionScope('all')}
                            className={`font-mono text-xs uppercase tracking-wider px-2.5 py-1 border transition-all ${
                              submissionScope === 'all'
                                ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-inherit'
                            }`}
                          >
                            All Problems ({allSubmissions.length})
                          </button>
                        </div>

                        {/* Status Filter */}
                        <div className="flex items-center gap-1">
                          {(['ALL', 'ACCEPTED', 'FAILED'] as const).map((f) => (
                            <button
                              key={f}
                              onClick={() => setSubmissionFilter(f)}
                              className={`font-mono text-xs uppercase tracking-wider px-2.5 py-1 border transition-all ${
                                submissionFilter === f
                                  ? 'bg-slate-800 dark:bg-slate-700 text-white border-slate-700'
                                  : 'border-[var(--grid-line)] text-slate-600 dark:text-slate-400 hover:text-inherit'
                              }`}
                            >
                              {f === 'ALL' ? 'All' : f === 'ACCEPTED' ? 'Pass' : 'Fail'}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {loadingSubmissions ? (
                      <div className="py-12 text-center text-xs font-mono text-slate-600 dark:text-slate-400 flex items-center justify-center gap-2">
                        <Cpu className="w-4 h-4 animate-spin text-[var(--primary)]" />
                        Loading previous submissions...
                      </div>
                    ) : filteredSubmissions.length === 0 ? (
                      <div className="py-12 text-center text-xs text-slate-600 dark:text-slate-400 space-y-2">
                        <Clock className="w-8 h-8 mx-auto text-slate-400 dark:text-slate-600" />
                        <p className="font-semibold text-slate-800 dark:text-slate-200">No submissions found</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {submissionScope === 'problem'
                            ? 'Submit your solution using the editor on the right to test it against judge test cases.'
                            : 'You have not submitted any solutions in the arena yet.'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredSubmissions.map((sub) => {
                          const isPass = sub.status === 'ACCEPTED';
                          return (
                            <div
                              key={sub.id}
                              className="p-3.5 border border-[var(--grid-line)] bg-[var(--secondary)]/10 dark:bg-slate-950/60 hover:border-[var(--primary)] transition-all space-y-2"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`px-2 py-0.5 text-[10px] font-mono font-bold border ${
                                      isPass
                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                        : sub.status === 'COMPILATION_ERROR'
                                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                                    }`}
                                  >
                                    {sub.status.replace(/_/g, ' ')}
                                  </span>
                                  <span className="font-mono text-xs font-bold text-[var(--primary)]">
                                    Score: {sub.score ?? 0}%
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                                  {new Date(sub.createdAt).toLocaleDateString()} {new Date(sub.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>

                              {sub.problem?.title && submissionScope === 'all' && (
                                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                                  {sub.problem.title}
                                </div>
                              )}

                              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-[var(--grid-line)] font-mono">
                                <div className="flex items-center gap-3">
                                  <span className="text-slate-800 dark:text-slate-200 font-bold">{sub.language}</span>
                                  <span>
                                    {sub.testCasesPassed ?? 0}/{sub.totalTestCases ?? 0} Passed
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-slate-400" />
                                    {sub.executionTimeMs}ms
                                  </span>
                                </div>

                                <button
                                  onClick={() => setInspectedSubmission(sub)}
                                  className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--primary)] hover:underline transition-colors"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  Inspect Code
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>                 ) : (
                  <div className="space-y-5">
                    {/* Problem Header */}
                    <div className="space-y-2 pb-4 border-b border-[var(--grid-line)]">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              problem.difficulty === 'EASY'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : problem.difficulty === 'MEDIUM'
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {problem.difficulty}
                          </span>

                          {submissions.some((s) => s.status === 'ACCEPTED') && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              Solved
                            </span>
                          )}
                        </div>

                        {/* Specs */}
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1" title="Execution time limit">
                            <Clock className="w-3.5 h-3.5" />
                            1.0s
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1" title="Memory limit">
                            <Cpu className="w-3.5 h-3.5" />
                            256MB
                          </span>
                        </div>
                      </div>

                      <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-sans tracking-tight">
                        {problem.title}
                      </h1>

                      {problem.tags && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {problem.tags.split(',').map((t, idx) => (
                            <span
                              key={idx}
                              className="text-[11px] font-sans px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60"
                            >
                              {t.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Rich Formatted Problem Narrative */}
                    <div>
                      <RichProblemDescription text={problem.description} />
                    </div>

                    {/* Example Test Cases */}
                    {problem.testCases && problem.testCases.length > 0 && (
                      <div className="space-y-3 pt-4 border-t border-[var(--grid-line)]">
                        <div className="flex items-center justify-between">
                          <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Examples
                          </h3>
                          <span className="text-xs text-slate-400">
                            {problem.testCases.length} sample {problem.testCases.length === 1 ? 'case' : 'cases'}
                          </span>
                        </div>

                        <div className="space-y-3">
                          {problem.testCases.map((tc, idx) => (
                            <div key={tc.id} className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="font-sans text-xs font-semibold text-slate-800 dark:text-slate-200">
                                  Example {idx + 1}:
                                </span>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(tc.input);
                                    setCopiedCaseIdx(idx);
                                    setTimeout(() => setCopiedCaseIdx(null), 2000);
                                  }}
                                  className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
                                  title="Copy test input"
                                >
                                  {copiedCaseIdx === idx ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-500" />
                                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" />
                                      <span>Copy</span>
                                    </>
                                  )}
                                </button>
                              </div>

                              <div className="p-3 rounded bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 font-mono text-xs leading-relaxed space-y-1 text-slate-800 dark:text-slate-200">
                                <div>
                                  <span className="font-sans font-semibold text-slate-700 dark:text-slate-300 mr-2 select-none">
                                    Input:
                                  </span>
                                  <span className="select-all text-slate-900 dark:text-slate-100 font-medium">
                                    {tc.input}
                                  </span>
                                </div>
                                <div>
                                  <span className="font-sans font-semibold text-slate-700 dark:text-slate-300 mr-2 select-none">
                                    Output:
                                  </span>
                                  <span className="select-all font-semibold text-slate-900 dark:text-slate-100">
                                    {tc.expectedOutput}
                                  </span>
                                </div>
                                {tc.explanation && (
                                  <div className="pt-1 text-xs">
                                    <span className="font-sans font-semibold text-slate-700 dark:text-slate-300 mr-2 select-none">
                                      Explanation:
                                    </span>
                                    <span className="font-sans text-slate-600 dark:text-slate-400">
                                      {tc.explanation}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Constraints */}
                    {problem.constraints && (
                      <div className="space-y-2 pt-4 border-t border-[var(--grid-line)]">
                        <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                          Constraints
                        </h3>

                        <ul className="space-y-1.5 pl-4 list-disc text-xs text-slate-700 dark:text-slate-300">
                          {problem.constraints
                            .split('\n')
                            .filter((c) => c.trim().length > 0)
                            .map((constraint, cIdx) => (
                              <li key={cIdx} className="leading-relaxed">
                                <code className="font-mono text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-slate-800 dark:text-slate-200">
                                  {constraint.replace(/^[-*•]\s*/, '').trim()}
                                </code>
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}

                    {/* Hints */}
                    {problem.hints && (
                      <div className="pt-4 border-t border-[var(--grid-line)]">
                        <button
                          onClick={() => setShowHints(!showHints)}
                          className="w-full flex items-center justify-between px-3 py-2 rounded border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-900/70 text-xs text-slate-700 dark:text-slate-300 transition-colors"
                        >
                          <span className="flex items-center gap-2 font-medium">
                            <Sparkles className="w-3.5 h-3.5 text-[var(--primary)]" />
                            <span>Hints</span>
                          </span>
                          <span className="flex items-center gap-1 text-[11px] text-slate-500">
                            <span>{showHints ? 'Hide' : 'Show'}</span>
                            {showHints ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </span>
                        </button>
                        {showHints && (
                          <div className="mt-2 space-y-2">
                            {(() => {
                              try {
                                const parsed = JSON.parse(problem.hints);
                                const hintsArray = Array.isArray(parsed) ? parsed : [problem.hints];
                                return hintsArray.map((hint: string, hIdx: number) => (
                                  <div
                                    key={hIdx}
                                    className="p-3 rounded border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2.5"
                                  >
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-[var(--primary)]/10 text-[var(--primary)] shrink-0">
                                      Hint {hIdx + 1}
                                    </span>
                                    <div className="leading-relaxed">
                                      {renderFormattedInline(hint)}
                                    </div>
                                  </div>
                                ));
                              } catch {
                                return (
                                  <div className="p-3 rounded border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-xs text-slate-700 dark:text-slate-300">
                                    {renderFormattedInline(problem.hints)}
                                  </div>
                                );
                              }
                            })()}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right Pane: Code Editor & Live Console (7 Cols) */}
              <div className="lg:col-span-7 space-y-4">
                {/* Editor Header */}
                <div className="panel p-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <FileCode className="w-4 h-4 text-[var(--primary)]" />
                    <span className="font-mono text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 font-semibold">
                      COMPILER:
                    </span>
                    <select
                      value={selectedLanguage}
                      onChange={(e) => handleLanguageChange(e.target.value)}
                      className="bg-transparent border border-[var(--grid-line)] font-mono text-xs uppercase tracking-wider px-2.5 py-1.5 focus:outline-none focus:border-[var(--primary)] text-inherit"
                    >
                      <option value="PYTHON" className="bg-[var(--card)] text-[var(--foreground)]">Python 3.11</option>
                      <option value="JAVASCRIPT" className="bg-[var(--card)] text-[var(--foreground)]">JavaScript (Node.js)</option>
                      <option value="CPP" className="bg-[var(--card)] text-[var(--foreground)]">C++20 (GCC 13)</option>
                      <option value="JAVA" className="bg-[var(--card)] text-[var(--foreground)]">Java 21 (OpenJDK)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleReset}
                      className="p-1.5 border border-[var(--grid-line)] text-slate-600 dark:text-slate-400 hover:text-inherit hover:bg-[var(--secondary)]/10 transition-colors"
                      title="Reset Starter Code"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>

                    <button
                      onClick={handleRunCode}
                      disabled={executing}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs uppercase tracking-wider border border-[var(--grid-line)] hover:bg-[var(--secondary)]/10 transition-all font-semibold"
                    >
                      <Play className="w-3.5 h-3.5 text-blue-500" />
                      RUN TESTCASES
                    </button>

                    <button
                      onClick={handleSubmitCode}
                      disabled={executing}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 font-mono text-xs uppercase tracking-wider bg-[var(--primary)] text-white border border-[var(--primary)] hover:opacity-90 transition-all disabled:opacity-50 font-bold"
                    >
                      <Send className="w-3.5 h-3.5" />
                      SUBMIT SOLUTION →
                    </button>
                  </div>
                </div>

                {/* Code Textarea Editor */}
                <div className="panel p-4 font-mono text-sm leading-relaxed">
                  <textarea
                    value={sourceCode}
                    onChange={(e) => setSourceCode(e.target.value)}
                    rows={17}
                    spellCheck={false}
                    className="w-full bg-transparent resize-y outline-none font-mono text-sm leading-relaxed text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    placeholder="// Write your algorithmic solution here..."
                  />
                </div>

                {/* Live Judge Output / Verdict Console */}
                <div className="panel p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-[var(--grid-line)] pb-3">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-emerald-500" />
                      <span className="font-mono text-xs uppercase tracking-wider font-semibold">
                        JUDGE EXECUTION CONSOLE
                      </span>
                    </div>

                    {verdict && (
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${verdict.status === 'ACCEPTED'
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : verdict.status === 'COMPILATION_ERROR'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                : verdict.status === 'TIME_LIMIT_EXCEEDED'
                                  ? 'bg-orange-500/20 text-orange-300 border-orange-500/30'
                                  : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                            }`}
                        >
                          {verdict.status.replace(/_/g, ' ')}
                        </span>
                        {verdict.score !== undefined && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            Score: {verdict.score}%
                          </span>
                        )}
                        <span className="text-[11px] font-mono text-slate-700 dark:text-slate-300 font-semibold">
                          {verdict.testCasesPassed}/{verdict.totalTestCases} Passed
                        </span>
                        <span className="text-[11px] font-mono text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                          {verdict.executionTimeMs}ms
                        </span>
                      </div>
                    )}
                  </div>

                  {executing ? (
                    <div className="py-8 text-center text-slate-600 dark:text-slate-400 font-mono text-xs flex items-center justify-center gap-2">
                      <Cpu className="w-4 h-4 animate-spin text-[var(--primary)]" />
                      Sandboxing code and evaluating test assertions...
                    </div>
                  ) : !verdict ? (
                    <div className="py-6 text-center text-slate-600 dark:text-slate-400 font-mono text-xs">
                      Click <strong className="text-slate-900 dark:text-slate-200">RUN TESTCASES</strong> to validate against sample cases, or <strong className="text-emerald-600 dark:text-emerald-400">SUBMIT SOLUTION</strong> for full judge grading.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Test Case Tab Selector */}
                      {testList.length > 0 && (
                        <div className="flex items-center gap-1.5 border-b border-[var(--grid-line)] pb-2">
                          {testList.map((t, idx) => (
                            <button
                              key={idx}
                              onClick={() => setSelectedTestTab(idx)}
                              className={`font-mono text-xs uppercase tracking-wider px-3 py-1 border flex items-center gap-1.5 transition-all ${selectedTestTab === idx
                                  ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                                  : 'border-[var(--grid-line)] text-slate-600 dark:text-slate-400 hover:text-inherit'
                                }`}
                            >
                              {t.status === 'PASSED' ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <XCircle className="w-3.5 h-3.5 text-rose-500" />
                              )}
                              CASE {idx + 1}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Selected Test Case Details */}
                      {testList[selectedTestTab] && (
                        <div className="p-4 border border-[var(--grid-line)] bg-[var(--secondary)]/10 dark:bg-slate-950/60 font-mono text-xs space-y-2.5">
                          <div>
                            <span className="text-slate-700 dark:text-slate-300 font-bold">INPUT: </span>
                            <span className="text-inherit">
                              {testList[selectedTestTab].input}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-700 dark:text-slate-300 font-bold">EXPECTED OUTPUT: </span>
                            <span className="text-emerald-500 font-bold">
                              {testList[selectedTestTab].expectedOutput ?? testList[selectedTestTab].expected ?? '(none)'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-700 dark:text-slate-300 font-bold">ACTUAL OUTPUT: </span>
                            <span
                              className={
                                testList[selectedTestTab].status === 'PASSED'
                                    ? 'text-emerald-500 font-bold'
                                    : 'text-rose-500 font-bold'
                              }
                            >
                              {(() => {
                                const out = testList[selectedTestTab].actualOutput !== undefined && testList[selectedTestTab].actualOutput !== null
                                  ? testList[selectedTestTab].actualOutput
                                  : testList[selectedTestTab].actual !== undefined && testList[selectedTestTab].actual !== null
                                    ? testList[selectedTestTab].actual
                                    : null;
                                return out !== null && out !== '' ? out : '(no output)';
                              })()}
                            </span>
                          </div>
                          {testList[selectedTestTab].consoleOutput && (
                            <div className="pt-2 border-t border-[var(--grid-line)]">
                              <span className="text-slate-700 dark:text-slate-300 font-bold">STDOUT / CONSOLE: </span>
                              <pre className="text-amber-500 text-[11px] mt-1 whitespace-pre-wrap font-mono">
                                {testList[selectedTestTab].consoleOutput}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}

                      {verdict.outputMessage && (
                        <div className={`text-xs p-3 border font-mono whitespace-pre-wrap ${verdict.status === 'ACCEPTED'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                            : verdict.status === 'COMPILATION_ERROR'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                          }`}>
                          {verdict.outputMessage}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Read-Only Historical Submission Code Modal */}
          {inspectedSubmission && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
              <div className="panel w-full max-w-2xl shadow-2xl overflow-hidden space-y-4 p-6 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-[var(--grid-line)] pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <FileCode className="w-4 h-4 text-[var(--primary)]" />
                      <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-inherit">
                        {inspectedSubmission.problem?.title || 'Historical Submission Code'}
                      </h3>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-mono font-bold border ${
                          inspectedSubmission.status === 'ACCEPTED'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                            : inspectedSubmission.status === 'COMPILATION_ERROR'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                        }`}
                      >
                        {inspectedSubmission.status.replace(/_/g, ' ')}
                      </span>
                      <span className="font-mono text-xs font-bold text-[var(--primary)]">
                        SCORE: {inspectedSubmission.score ?? 0}%
                      </span>
                    </div>
                    <p className="font-mono text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                      Submitted on {new Date(inspectedSubmission.createdAt).toLocaleString()} • {inspectedSubmission.language} • {inspectedSubmission.testCasesPassed ?? 0}/{inspectedSubmission.totalTestCases ?? 0} test cases passed ({inspectedSubmission.executionTimeMs}ms)
                    </p>
                  </div>
                  <button
                    onClick={() => setInspectedSubmission(null)}
                    className="p-1.5 border border-[var(--grid-line)] text-slate-600 dark:text-slate-400 hover:text-inherit hover:bg-[var(--secondary)]/10 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-2.5 border border-[var(--grid-line)] bg-[var(--secondary)]/10 font-mono text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                  READ-ONLY VIEW. Closing this modal preserves your current working draft in the editor.
                </div>

                <div className="panel p-4 font-mono text-sm leading-relaxed max-h-[380px] overflow-y-auto">
                  <pre className="whitespace-pre-wrap select-text font-mono text-sm text-slate-900 dark:text-slate-100">
                    {inspectedSubmission.sourceCode || '// No source code recorded'}
                  </pre>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[var(--grid-line)]">
                  <button
                    onClick={() => {
                      if (inspectedSubmission.sourceCode) {
                        navigator.clipboard.writeText(inspectedSubmission.sourceCode);
                        setCodeCopied(true);
                        setTimeout(() => setCodeCopied(false), 2000);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs uppercase tracking-wider border border-[var(--grid-line)] hover:bg-[var(--secondary)]/10 transition-all"
                  >
                    {codeCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {codeCopied ? 'COPIED TO CLIPBOARD' : 'COPY CODE'}
                  </button>

                  <button
                    onClick={() => setInspectedSubmission(null)}
                    className="px-4 py-1.5 font-mono text-xs uppercase tracking-wider bg-[var(--primary)] text-white border border-[var(--primary)] hover:opacity-90 transition-all"
                  >
                    CLOSE
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
