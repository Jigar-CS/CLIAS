'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { BrainCircuit, Lock, Mail, Loader2, AlertCircle, Sun, Moon } from 'lucide-react';
import { UserRole } from '@clias/shared-types';

export default function LoginPage() {
  const [email, setEmail] = useState('student@charusat.edu.in');
  const [password, setPassword] = useState('clias123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const universityName = process.env.NEXT_PUBLIC_UNIVERSITY_NAME || 'CHARUSAT';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const user = await login(email, password);
      // Role-aware redirection
      if (user.role === UserRole.SUPER_ADMIN) {
        router.push('/admin/dashboard');
      } else if (user.role === UserRole.FACULTY) {
        router.push('/faculty/dashboard');
      } else if (user.role === UserRole.COUNSELLOR) {
        router.push('/counsellor/dashboard');
      } else if (user.role === UserRole.HOD) {
        router.push('/hod/dashboard');
      } else if (user.role === UserRole.HEAD) {
        router.push('/head/dashboard');
      } else {
        router.push('/student/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('clias123');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-transparent text-[#1a2540] dark:text-[#e8edf5] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative transition-colors duration-200 grid-paper z-10">
      {/* CARDIA Atlas Coordinate Grid Atmosphere */}
      <div className="absolute inset-0 pointer-events-none atlas-grid opacity-35 dark:opacity-20" />

      {/* Theme Toggle Button in Top Right */}
      <div className="absolute top-6 right-6 z-10">
        <button
          onClick={toggleTheme}
          className="p-2.5 text-[#6b7fa3] dark:text-[#8ba0c0] hover:text-[#1a2540] dark:hover:text-[#e8edf5] bg-[#faf7f2] dark:bg-[#121b30] hover:bg-[rgba(74,111,165,0.1)] border border-[rgba(74,111,165,0.3)] transition shadow-sm flex items-center gap-1.5 cursor-pointer"
          style={{borderRadius:0}}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <Link href="/" className="inline-flex items-center gap-2.5 mb-3">
          <div className="w-11 h-11 bg-[#e05033] flex items-center justify-center text-white shadow-sm" style={{borderRadius:0}}>
            <BrainCircuit className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-display tracking-tight text-[#1a2540] dark:text-[#e8edf5] uppercase">CLIAS</span>
        </Link>
        <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-red-600 dark:text-red-400 mb-1">
          [AUTH // PORTAL]
        </p>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">University Portal Sign In</h1>
        <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-tight">{universityName} Learning Intelligence &amp; Assessment System</p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-[#faf7f2] dark:bg-[#121b30] py-8 px-6 border border-[rgba(74,111,165,0.28)] dark:border-[rgba(106,144,197,0.2)] shadow-xl sm:px-10" style={{borderRadius:0}}>
          {error && (
            <div className="mb-5 p-3 bg-[rgba(224,80,51,0.08)] border border-[rgba(224,80,51,0.3)] text-[#e05033] text-[11px] flex items-start gap-2.5 font-mono" style={{borderRadius:0}}>
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 font-mono uppercase tracking-wider text-[11px]">
                University Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={`name@${process.env.NEXT_PUBLIC_UNIVERSITY_EMAIL_DOMAIN || 'charusat.edu.in'}`}
                  className="w-full pl-10 pr-4 py-2.5 text-[11px] font-mono bg-[rgba(74,111,165,0.06)] dark:bg-[rgba(106,144,197,0.06)] border border-[rgba(74,111,165,0.28)] dark:border-[rgba(106,144,197,0.2)] text-[#1a2540] dark:text-[#e8edf5] focus:outline-none focus:border-[#e05033] focus:bg-[#faf7f2] dark:focus:bg-[#121b30] transition uppercase tracking-wider placeholder:normal-case placeholder:tracking-normal"
                  style={{borderRadius:0}}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 font-mono uppercase tracking-wider text-[11px]">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 text-[11px] font-mono bg-[rgba(74,111,165,0.06)] dark:bg-[rgba(106,144,197,0.06)] border border-[rgba(74,111,165,0.28)] dark:border-[rgba(106,144,197,0.2)] text-[#1a2540] dark:text-[#e8edf5] focus:outline-none focus:border-[#e05033] focus:bg-[#faf7f2] dark:focus:bg-[#121b30] transition"
                  style={{borderRadius:0}}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 text-[10px] font-mono font-bold uppercase tracking-widest text-white bg-[#e05033] hover:bg-[#c8432b] transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              style={{borderRadius:0}}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              <span>{loading ? 'Authenticating...' : 'Sign In to Portal'}</span>
            </button>
          </form>

          {/* Quick Demo Fill Buttons */}
          <div className="mt-6 pt-5 border-t border-[#141c2e]/10 dark:border-white/10">
            <p className="font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center mb-2.5">
              One-Click Role Presets:
            </p>
            <div className="grid grid-cols-3 gap-1.5 font-mono text-[10px] font-bold">
              <button
                type="button"
                onClick={() => fillDemo('student@charusat.edu.in')}
                className="py-1.5 px-2 rounded bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/40 transition cursor-pointer"
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => fillDemo('dharasolanki.cse@charusat.ac.in')}
                className="py-1.5 px-2 rounded bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 transition cursor-pointer"
              >
                Faculty
              </button>
              <button
                type="button"
                onClick={() => fillDemo('counsellor@charusat.edu.in')}
                className="py-1.5 px-2 rounded bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40 transition cursor-pointer"
              >
                Counsellor
              </button>
              <button
                type="button"
                onClick={() => fillDemo('hod@charusat.edu.in')}
                className="py-1.5 px-2 rounded bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800/40 transition cursor-pointer"
              >
                HOD
              </button>
              <button
                type="button"
                onClick={() => fillDemo('head@charusat.edu.in')}
                className="py-1.5 px-2 rounded bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40 transition cursor-pointer"
              >
                Dean
              </button>
              <button
                type="button"
                onClick={() => fillDemo('admin@charusat.edu.in')}
                className="py-1.5 px-2 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
              >
                Admin
              </button>
            </div>
          </div>

          <div className="mt-5 text-center text-xs text-slate-500 dark:text-slate-400">
            <span>New university student? </span>
            <Link href="/auth/register" className="font-mono font-bold text-[10px] uppercase tracking-widest text-[#e05033] dark:text-[#e8604a] hover:underline">
              Activate your account &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
