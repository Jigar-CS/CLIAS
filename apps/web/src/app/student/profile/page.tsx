'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Sidebar } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';
import { ProfileView } from '@/components/ProfileView';
import { UserRole } from '@clias/shared-types';

export default function StudentProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-transparent text-[#1a2540] dark:text-[#e8edf5] flex font-sans relative z-10">
      <Sidebar />

      <div className="flex-1 ml-64 flex flex-col min-w-0">
        <Navbar
          title="Student Scholar Profile & Learning Identity"
          subtitle="Manage personal contact data, target career readiness roles, and portfolio accounts"
        />

        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-200">
          {/* Gleam-Spark Page Intro */}
          <div className="page-intro">
            <div>
              <p className="mono text-[#4a6fa5] dark:text-[#6a90c5] tracking-widest text-[9px] uppercase mb-2">
                LEARNING INTELLIGENCE / PROFILE / 01
              </p>
              <h1 className="page-title font-display text-5xl sm:text-6xl text-[#1a2540] dark:text-[#f5f0e8] uppercase tracking-tight">
                STUDENT PROFILE
              </h1>
            </div>
            <div className="readiness">
              <p className="mono text-[8px] uppercase tracking-wider text-[#6b7fa3]">ENROLLMENT STATUS</p>
              <strong className="font-display text-4xl text-[#1a2540] dark:text-[#f5f0e8]">
                ACTIVE<span className="font-mono text-sm text-[#e05033]">●</span>
              </strong>
              <p className="mono text-[8px] text-[#4a6fa5] dark:text-[#6a90c5] uppercase tracking-wider">CHARUSAT ACADEMIC IDENTITY</p>
            </div>
          </div>

          {/* Gleam-Spark 4-Column Metric Band */}
          <div className="metrics">
            <div className="metric">
              <div className="metric-top mono"><span>01</span><span className="text-[#e05033]">ROLE</span></div>
              <div className="metric-value font-display text-2xl sm:text-3xl">STUDENT</div>
              <div className="metric-label mono">SECURITY LEVEL</div>
            </div>
            <div className="metric">
              <div className="metric-top mono"><span>02</span><span className="text-[#4a6fa5]">INSTITUTE</span></div>
              <div className="metric-value font-display text-2xl sm:text-3xl">CHARUSAT</div>
              <div className="metric-label mono">CSPIT / DEPSTAR</div>
            </div>
            <div className="metric">
              <div className="metric-top mono"><span>03</span><span>PROGRAM</span></div>
              <div className="metric-value font-display text-2xl sm:text-3xl">B.TECH</div>
              <div className="metric-label mono">DEGREE PATH</div>
            </div>
            <div className="metric">
              <div className="metric-top mono"><span>04</span><span className="text-[#4a6fa5]">IDENTITY</span></div>
              <div className="metric-value font-display text-2xl sm:text-3xl">VERIFIED</div>
              <div className="metric-label mono">SSO / CAMPUS ID</div>
            </div>
          </div>

          <ProfileView forcedRole={UserRole.STUDENT} />
        </main>
      </div>
    </div>
  );
}
