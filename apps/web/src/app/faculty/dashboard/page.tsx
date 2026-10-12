'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { Sidebar } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';
import { MetricCard } from '@/components/MetricCard';
import { UserRole } from '@clias/shared-types';
import {
  BookOpen,
  Users,
  FileCheck,
  TrendingUp,
  Sparkles,
  PlusCircle,
  FileSpreadsheet,
  AlertCircle,
  Activity,
  CheckCircle2,
  GraduationCap,
  ArrowRight,
} from 'lucide-react';

export default function FacultyDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [cohortData, setCohortData] = useState<any>(null);
  const [assessmentCount, setAssessmentCount] = useState<number>(0);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (!loading && (!user || (user.role !== UserRole.FACULTY && user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.HOD && !user.isFaculty))) {
      router.push('/auth/login');
      return;
    }

    if (user) {
      loadInitialData();
    }
  }, [user, loading]);

  const loadInitialData = async () => {
    setFetching(true);
    try {
      const courseList: any = await api.get('/courses');
      if (courseList && courseList.length > 0) {
        setCourses(courseList);
        const facultyCourseId = user?.courseId || user?.assignedCourse?.id;
        const activeCourse = (facultyCourseId && courseList.find((c: any) => c.id === facultyCourseId)) || courseList[0];
        setSelectedCourse(activeCourse);
        await loadCourseDetails(activeCourse);
      }
    } catch (e) {
      console.error('Error loading courses:', e);
    } finally {
      setFetching(false);
    }
  };

  const loadCourseDetails = async (course: any) => {
    try {
      // 1. Load real course cohort analytics
      const res: any = await api.get(`/analytics/faculty/course/${course.id}/summary`);
      setCohortData(res);
    } catch (e) {
      setCohortData(null);
    }

    try {
      // 2. Load assessments created for this course
      const assessments: any = await api.get(`/assessments/student?courseId=${course.id}`);
      setAssessmentCount(assessments ? assessments.length : 0);
    } catch (e) {
      setAssessmentCount(0);
    }
  };

  const totalQuestions = selectedCourse?._count?.questions ?? 0;
  const enrolledCount = cohortData?.enrolledStudentsCount ?? 0;
  const classMastery = cohortData?.overallClassMastery ?? 0;
  const topicList = cohortData?.topicAnalytics ?? [];

  return (
    <div className="min-h-screen bg-transparent text-[#1a2540] dark:text-[#e8edf5] flex relative z-10">
      <Sidebar />

      <div className="flex-1 ml-64 flex flex-col min-w-0">
        <Navbar
          title="Faculty Assessment & Curriculum Console"
          subtitle="Course orchestration, item bank management & class learning intelligence"
        />

        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6 sm:space-y-8">
          {/* Exact Gleam-Spark Page Intro Banner */}
          <div className="page-intro">
            <div>
              <p className="mono">FACULTY / OVERVIEW / 04</p>
              <h1 className="page-title display">
                GOOD MORNING,<span className="coral">{(user?.name || 'PROF. MEHTA').toUpperCase().startsWith('PROF.') ? (user?.name || 'PROF. MEHTA').toUpperCase() : `PROF. ${(user?.name || 'MEHTA').toUpperCase().split(' ')[0]}.`}</span>
              </h1>
            </div>
            <div className="readiness">
              <p className="mono">COHORT HEALTH</p>
              <strong>
                {classMastery > 0 ? Math.round(classMastery) : 0}
                <span>%</span>
              </strong>
              <p className="mono blue">
                {classMastery >= 75
                  ? 'OPTIMAL PROGRESSION'
                  : classMastery >= 50
                    ? 'STABLE PROGRESSION'
                    : classMastery > 0
                      ? 'NEEDS REINFORCEMENT'
                      : 'NO SESSIONS RECORDED'}
              </p>
            </div>
          </div>

          {/* Exact Gleam-Spark 4-Column Metrics Bar */}
          <div className="metrics">
            <div className="metric">
              <div className="metric-top mono">
                <span>01</span>
                <span>+{enrolledCount}</span>
              </div>
              <div className="metric-value font-display text-[34px] leading-tight text-[#1a2540] dark:text-[#f5f0e8]">
                {enrolledCount}
              </div>
              <div className="metric-label mono">ACTIVE STUDENTS</div>
            </div>
            <div className="metric">
              <div className="metric-top mono">
                <span>02</span>
                <span>+{classMastery > 0 ? (classMastery * 0.05).toFixed(1) : '0.0'}%</span>
              </div>
              <div className="metric-value font-display text-[34px] leading-tight text-[#1a2540] dark:text-[#f5f0e8]">
                {classMastery > 0 ? `${classMastery}%` : '0%'}
              </div>
              <div className="metric-label mono">AVERAGE MASTERY</div>
            </div>
            <div className="metric">
              <div className="metric-top mono">
                <span>03</span>
                <span>+{assessmentCount}</span>
              </div>
              <div className="metric-value font-display text-[34px] leading-tight text-[#1a2540] dark:text-[#f5f0e8]">
                {assessmentCount}
              </div>
              <div className="metric-label mono">ACTIVE ASSESSMENTS</div>
            </div>
            <div className="metric">
              <div className="metric-top mono">
                <span>04</span>
                <span>{(cohortData?.atRiskCount ?? 0) > 0 ? 'ALERT' : 'OPTIMAL'}</span>
              </div>
              <div className="metric-value font-display text-[34px] leading-tight text-[#1a2540] dark:text-[#f5f0e8]">
                {cohortData?.atRiskCount ?? 0}
              </div>
              <div className="metric-label mono">STUDENTS AT RISK</div>
            </div>
          </div>

          {/* Exact Gleam-Spark Priority Band Banner */}
          <div className="priority-band">
            <div className="priority-symbol">!</div>
            <div className="priority-content">
              <p className="mono">INSTRUCTOR-ACTION / DISPATCH</p>
              <h2 className="display">DISPATCH ADAPTIVE DRILL ON WEAK TOPICS</h2>
              <p>Target students scoring &lt;60% on recent diagnostics with automated remedial problem sets.</p>
            </div>
            <Link
              href="/faculty/assessments"
              className="action-button bg-[#e05033] hover:bg-[#c8432b] text-white flex items-center shrink-0 cursor-pointer"
              style={{ textDecoration: 'none' }}
            >
              <span>DISPATCH DRILL</span>
              <ArrowRight className="w-4 h-4 ml-4" />
            </Link>
          </div>

          {/* Action Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                {courses.length > 1 && user?.role === UserRole.SUPER_ADMIN ? (
                  <select
                    value={selectedCourse?.id || ''}
                    onChange={(e) => {
                      const c = courses.find((item: any) => item.id === e.target.value);
                      if (c) {
                        setSelectedCourse(c);
                        loadCourseDetails(c);
                      }
                    }}
                    className="text-xl font-bold text-slate-900 tracking-tight bg-transparent border-b border-dashed border-slate-300 pb-0.5 outline-none cursor-pointer hover:border-indigo-500 transition"
                  >
                    {courses.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                ) : (
                  <h2 className="text-xl font-display text-[#1a2540] dark:text-[#e8edf5] tracking-tight uppercase">
                    {selectedCourse ? `${selectedCourse.name} (${selectedCourse.code})` : 'Curriculum Console'}
                  </h2>
                )}
                <span className="text-[9px] font-mono font-bold px-2 py-0.5 bg-[rgba(74,111,165,0.1)] text-[#4a6fa5] dark:text-[#6a90c5] border border-[rgba(74,111,165,0.3)] uppercase tracking-wider" style={{borderRadius:0}}>
                  {user?.name || 'Faculty Member'}
                </span>
                <span className="text-[9px] font-mono font-bold px-2.5 py-0.5 bg-emerald-50/80 text-emerald-800 dark:text-emerald-400 border border-emerald-200 flex items-center gap-1.5" style={{borderRadius:0}}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Teaching Subject
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {(selectedCourse as any)?.department?.name || (user as any)?.department?.name || 'Department of Computer Science & Engineering'} • {(selectedCourse as any)?.department?.institute?.name || (user as any)?.institute?.name || 'CHARUSAT'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/faculty/assessments"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#faf7f2] dark:bg-[#121b30] text-[#1a2540] dark:text-[#e8edf5] hover:bg-[rgba(74,111,165,0.08)] text-[10px] font-mono font-bold uppercase tracking-wider border border-[rgba(74,111,165,0.3)] shadow-sm transition" style={{borderRadius:0}}
              >
                <PlusCircle className="w-4 h-4 text-slate-600" />
                <span>Create Assessment</span>
              </Link>
              <Link
                href="/faculty/ai-generator"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#e05033] text-white hover:bg-[#c8432b] text-[10px] font-mono font-bold uppercase tracking-wider shadow-md transition" style={{borderRadius:0}}
              >
                <Sparkles className="w-4 h-4 text-white" />
                <span>AI Question Studio</span>
              </Link>
            </div>
          </div>

          {/* Curriculum Health Breakdown */}
          <div id="bank" className="bg-[#faf7f2] dark:bg-[#121b30] border border-[rgba(74,111,165,0.25)] dark:border-[rgba(106,144,197,0.2)] shadow-sm p-6 space-y-4" style={{borderRadius:0}}>
            <div>
              <h3 className="text-base font-bold text-slate-900">Curriculum Topic Health</h3>
              <p className="text-xs text-slate-500">Live knowledge distribution across class cohort</p>
            </div>

            {topicList.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {topicList.slice(0, 6).map((topic: any, idx: number) => (
                  <div key={idx} className="p-4 bg-[rgba(74,111,165,0.06)] dark:bg-[rgba(106,144,197,0.05)] border border-[rgba(74,111,165,0.2)] dark:border-[rgba(106,144,197,0.15)] space-y-1" style={{borderRadius:0}}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-slate-800">{topic.topicName}</span>
                      <span
                        className={`font-bold ${
                          topic.classAverageMastery >= 75
                            ? 'text-emerald-600'
                            : topic.classAverageMastery >= 50
                            ? 'text-indigo-600'
                            : 'text-rose-600'
                        }`}
                      >
                        {topic.classAverageMastery}% Mastery
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px]">
                      {topic.totalAttempts} practice submissions recorded
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-[rgba(74,111,165,0.04)] border border-dashed border-[rgba(74,111,165,0.3)] text-[11px] text-[#6b7fa3] dark:text-[#8ba0c0]" style={{borderRadius:0}}>
                <GraduationCap className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                <p className="font-semibold text-slate-700">No Student Submissions Yet</p>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  When enrolled students complete practice drills or unit assessments, their mastery progression will reflect here.
                </p>
              </div>
            )}
          </div>

          {/* Platform Status */}
          <div className="p-5 bg-[rgba(74,111,165,0.08)] dark:bg-[rgba(106,144,197,0.06)] border border-[rgba(74,111,165,0.25)] dark:border-[rgba(106,144,197,0.2)] text-[#1a2540] dark:text-[#e8edf5] flex items-start gap-4" style={{borderRadius:0}}>
            <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <h4 className="font-bold text-indigo-950">Faculty Console: Active & Synchronized</h4>
              <p className="text-indigo-800/80 leading-relaxed">
                Curriculum orchestration, AI question synthesis, automated rubric scoring, and proctoring surveillance are operational for <strong>{user?.name || 'Faculty Member'}</strong>.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
