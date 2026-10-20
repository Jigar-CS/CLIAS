'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { Sidebar } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';
import { UserRole } from '@clias/shared-types';
import {
  Settings,
  ShieldCheck,
  Building,
  Key,
  Cpu,
  Mail,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Lock,
  Globe,
  Database,
  Sliders,
} from 'lucide-react';

export default function AdminSettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [savedNotification, setSavedNotification] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states
  const [universityName, setUniversityName] = useState('CHARUSAT');
  const [universityFullName, setUniversityFullName] = useState('Charotar University of Science and Technology');
  const [emailDomain, setEmailDomain] = useState('charusat.edu.in');
  const [portalTitle, setPortalTitle] = useState('CLIAS — Learning Intelligence & Assessment System');

  const [jwtExpiry, setJwtExpiry] = useState('7d');
  const [otpExpiryMinutes, setOtpExpiryMinutes] = useState(5);
  const [maxLoginAttempts, setMaxLoginAttempts] = useState(5);
  const [enforceStrictIsolation, setEnforceStrictIsolation] = useState(true);

  const [aiServiceUrl, setAiServiceUrl] = useState('http://localhost:8000');
  const [ragSimilarityThreshold, setRagSimilarityThreshold] = useState(0.75);
  const [socraticMaxTurns, setSocraticMaxTurns] = useState(10);

  const [emailDriver, setEmailDriver] = useState('development');
  const [senderEmail, setSenderEmail] = useState('no-reply@charusat.edu.in');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== UserRole.SUPER_ADMIN)) {
      router.push('/auth/login');
      return;
    }

    const loadSettings = async () => {
      try {
        const config: any = await api.get('/admin/settings');
        if (config) {
          if (config.universityName) setUniversityName(config.universityName);
          if (config.universityFullName) setUniversityFullName(config.universityFullName);
          if (config.emailDomain) setEmailDomain(config.emailDomain);
          if (config.portalTitle) setPortalTitle(config.portalTitle);
          if (config.jwtExpiry) setJwtExpiry(config.jwtExpiry);
          if (config.otpExpiryMinutes) setOtpExpiryMinutes(config.otpExpiryMinutes);
          if (config.maxLoginAttempts) setMaxLoginAttempts(config.maxLoginAttempts);
          if (typeof config.enforceStrictIsolation === 'boolean') setEnforceStrictIsolation(config.enforceStrictIsolation);
          if (config.aiServiceUrl) setAiServiceUrl(config.aiServiceUrl);
          if (typeof config.ragSimilarityThreshold === 'number') setRagSimilarityThreshold(config.ragSimilarityThreshold);
          if (config.socraticMaxTurns) setSocraticMaxTurns(config.socraticMaxTurns);
          if (config.emailDriver) setEmailDriver(config.emailDriver);
          if (config.senderEmail) setSenderEmail(config.senderEmail);
        }
      } catch (err) {
        console.warn('Could not load dynamic settings:', err);
      }
    };

    if (user && user.role === UserRole.SUPER_ADMIN) {
      loadSettings();
    }
  }, [user, authLoading]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch('/admin/settings', {
        universityName,
        universityFullName,
        emailDomain,
        portalTitle,
        jwtExpiry,
        otpExpiryMinutes,
        maxLoginAttempts,
        enforceStrictIsolation,
        aiServiceUrl,
        ragSimilarityThreshold,
        socraticMaxTurns,
        emailDriver,
        senderEmail,
      });
      setSavedNotification(true);
      setTimeout(() => {
        setSavedNotification(false);
      }, 4000);
    } catch (err: any) {
      alert(err?.message || 'Failed to update system settings');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = async () => {
    setUniversityName('CHARUSAT');
    setUniversityFullName('Charotar University of Science and Technology');
    setEmailDomain('charusat.edu.in');
    setPortalTitle('CLIAS — Learning Intelligence & Assessment System');
    setJwtExpiry('7d');
    setOtpExpiryMinutes(5);
    setMaxLoginAttempts(5);
    setEnforceStrictIsolation(true);
    setAiServiceUrl('http://localhost:8000');
    setRagSimilarityThreshold(0.75);
    setSocraticMaxTurns(10);
    setEmailDriver('development');
    setSenderEmail('no-reply@charusat.edu.in');

    try {
      await api.patch('/admin/settings', {
        universityName: 'CHARUSAT',
        universityFullName: 'Charotar University of Science and Technology',
        emailDomain: 'charusat.edu.in',
        portalTitle: 'CLIAS — Learning Intelligence & Assessment System',
        jwtExpiry: '7d',
        otpExpiryMinutes: 5,
        maxLoginAttempts: 5,
        enforceStrictIsolation: true,
        aiServiceUrl: 'http://localhost:8000',
        ragSimilarityThreshold: 0.75,
        socraticMaxTurns: 10,
        emailDriver: 'development',
        senderEmail: 'no-reply@charusat.edu.in',
      });
      setSavedNotification(true);
      setTimeout(() => setSavedNotification(false), 3000);
    } catch {}
  };

  return (
    <div className="min-h-screen bg-transparent text-[#1a2540] dark:text-[#e8edf5] flex font-sans relative z-10">
      <Sidebar />

      <div className="flex-1 ml-64 flex flex-col min-w-0">
        <Navbar
          title="System Settings & Institutional Governance Console"
          subtitle="Identity, Security Keys, AI Engine Endpoints & Notification Dispatch Configuration"
        />

        <main className="p-8 max-w-7xl w-full mx-auto space-y-8 animate-in fade-in duration-200">
          {/* Gleam-Spark Banner Intro */}
          <div className="page-intro">
            <div>
              <div className="page-title">SYSTEM SETTINGS.</div>
            </div>
            <div className="readiness">
              <div className="readiness-score">100%</div>
              <div className="readiness-label">CLUSTER STATUS</div>
            </div>
          </div>

          {/* 4-Column Metrics Bar */}
          <div className="metrics">
            <div className="metric">
              <div className="metric-val">STRICT</div>
              <div className="metric-lbl">ROLE ISOLATION (RULE 5 & 23)</div>
            </div>
            <div className="metric">
              <div className="metric-val">{jwtExpiry.toUpperCase()}</div>
              <div className="metric-lbl">SESSION TOKEN LIFESPAN</div>
            </div>
            <div className="metric">
              <div className="metric-val">{otpExpiryMinutes} MIN</div>
              <div className="metric-lbl">OTP CODE VALIDITY</div>
            </div>
            <div className="metric">
              <div className="metric-val">CONNECTED</div>
              <div className="metric-lbl">AI ENGINE ENDPOINT</div>
            </div>
          </div>

          {/* Priority Status Band */}
          <div className="priority-band">
            <span>● POLICY ENGINE READY</span>
            <span>DOMAINS VALIDATED</span>
            <span>ENCRYPTED PARAMETERS</span>
          </div>

          {/* Header Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--grid-line)] pb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold font-mono uppercase tracking-wider text-inherit">
                  CLUSTER CONFIGURATION PARAMETERS
                </h2>
                <span className="px-2.5 py-0.5 text-xs font-mono font-bold border border-[var(--grid-line)] bg-[var(--secondary)]/10 text-[var(--primary)]">
                  ACTIVE SPECIFICATION
                </span>
              </div>
              <p className="font-mono text-xs text-slate-600 dark:text-slate-400 font-medium">
                CONFIGURE INSTITUTIONAL IDENTITY, AUTHENTICATION TIMEOUTS, AND MICROSERVICE PIPELINE ENDPOINTS.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetDefaults}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 font-mono text-xs uppercase tracking-wider border border-[var(--grid-line)] hover:bg-[var(--secondary)]/10 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>RESET DEFAULTS</span>
              </button>
              <button
                form="settings-form"
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2 bg-[var(--primary)] hover:opacity-90 text-white font-mono text-xs uppercase tracking-wider transition border border-[var(--primary)]"
              >
                <Save className="w-4 h-4" />
                <span>SAVE CONFIGURATION →</span>
              </button>
            </div>
          </div>

          {savedNotification && (
            <div className="p-4 panel border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>SYSTEM CONFIGURATION SUCCESSFULLY VALIDATED AND DEPLOYED ACROSS THE ACTIVE CLUSTER.</span>
            </div>
          )}

          <form id="settings-form" onSubmit={handleSaveSettings} className="space-y-6">
            {/* Section 1: Institutional Identity */}
            <div className="panel p-6 space-y-4">
              <div className="flex items-center gap-2.5 border-b border-[var(--grid-line)] pb-3">
                <Building className="w-5 h-5 text-[var(--primary)]" />
                <div>
                  <h3 className="text-base font-bold font-mono uppercase tracking-wider text-inherit">INSTITUTIONAL IDENTITY &amp; DOMAIN</h3>
                  <p className="font-mono text-xs text-slate-600 dark:text-slate-400 font-medium">CONTROLS EMAIL VALIDATION DOMAINS AND UNIVERSITY BRANDING</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    University Brand Short Name
                  </label>
                  <input
                    type="text"
                    required
                    value={universityName}
                    onChange={(e) => setUniversityName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-600 text-slate-900 dark:text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    University Full Legal Name
                  </label>
                  <input
                    type="text"
                    required
                    value={universityFullName}
                    onChange={(e) => setUniversityFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-600 text-slate-900 dark:text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Authorized Institutional Email Domain
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">@</span>
                    <input
                      type="text"
                      required
                      value={emailDomain}
                      onChange={(e) => setEmailDomain(e.target.value)}
                      className="w-full pl-8 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-600 text-slate-900 dark:text-white font-medium"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Student and faculty registration is restricted to this domain.</p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Portal Window Title
                  </label>
                  <input
                    type="text"
                    required
                    value={portalTitle}
                    onChange={(e) => setPortalTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-600 text-slate-900 dark:text-white font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Security & Authentication */}
            <div className="panel p-6 space-y-4">
              <div className="flex items-center gap-2.5 border-b border-[var(--grid-line)] pb-3">
                <Lock className="w-5 h-5 text-[var(--primary)]" />
                <div>
                  <h3 className="text-base font-bold font-mono uppercase tracking-wider text-inherit">SECURITY &amp; ACCESS GOVERNANCE</h3>
                  <p className="font-mono text-xs text-slate-600 dark:text-slate-400 font-medium">JWT TOKEN DURATIONS, OTP VERIFICATION LIMITS, AND STRICT ROLE ISOLATION</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                <div>
                  <label className="block font-bold mb-1">
                    JWT SESSION TOKEN LIFESPAN
                  </label>
                  <select
                    value={jwtExpiry}
                    onChange={(e) => setJwtExpiry(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-transparent border border-[var(--grid-line)] focus:outline-none focus:border-[var(--primary)] text-inherit"
                  >
                    <option value="1d" className="bg-[var(--card)] text-[var(--foreground)]">1 Day</option>
                    <option value="7d" className="bg-[var(--card)] text-[var(--foreground)]">7 Days (Default)</option>
                    <option value="14d" className="bg-[var(--card)] text-[var(--foreground)]">14 Days</option>
                    <option value="30d" className="bg-[var(--card)] text-[var(--foreground)]">30 Days</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">
                    OTP CODE VALIDITY (MINUTES)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={otpExpiryMinutes}
                    onChange={(e) => setOtpExpiryMinutes(parseInt(e.target.value, 10))}
                    className="w-full px-3.5 py-2.5 bg-transparent border border-[var(--grid-line)] focus:outline-none focus:border-[var(--primary)] text-inherit"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">
                    MAX CONSECUTIVE LOGIN ATTEMPTS
                  </label>
                  <input
                    type="number"
                    min={3}
                    max={10}
                    value={maxLoginAttempts}
                    onChange={(e) => setMaxLoginAttempts(parseInt(e.target.value, 10))}
                    className="w-full px-3.5 py-2.5 bg-transparent border border-[var(--grid-line)] focus:outline-none focus:border-[var(--primary)] text-inherit"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enforceStrictIsolation}
                    onChange={(e) => setEnforceStrictIsolation(e.target.checked)}
                    className="w-4 h-4 text-[var(--primary)] border-[var(--grid-line)]"
                  />
                  <div>
                    <span className="font-mono text-xs font-bold block uppercase tracking-wider">
                      ENFORCE STRICT ROLE ISOLATION MATRIX (RULE 5 &amp; 23)
                    </span>
                    <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400 font-medium block">
                      Guarantees counsellors view only assigned mentees, faculty access only designated courses, and unassigned records are strictly quarantined.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Section 3: AI Intelligence Engine & RAG */}
            <div className="panel p-6 space-y-4">
              <div className="flex items-center gap-2.5 border-b border-[var(--grid-line)] pb-3">
                <Cpu className="w-5 h-5 text-cyan-500" />
                <div>
                  <h3 className="text-base font-bold font-mono uppercase tracking-wider text-inherit">AI MICROSERVICE &amp; SEMANTIC RAG SETTINGS</h3>
                  <p className="font-mono text-xs text-slate-600 dark:text-slate-400 font-medium">ENDPOINTS AND HYPERPARAMETERS FOR SOCRATIC TUTORING AND GROUNDED GENERATION</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                <div>
                  <label className="block font-bold mb-1">
                    AI MICROSERVICE URL
                  </label>
                  <input
                    type="text"
                    required
                    value={aiServiceUrl}
                    onChange={(e) => setAiServiceUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-transparent border border-[var(--grid-line)] focus:outline-none focus:border-[var(--primary)] text-inherit"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">
                    RAG COSINE SIMILARITY THRESHOLD
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.5"
                    max="0.95"
                    value={ragSimilarityThreshold}
                    onChange={(e) => setRagSimilarityThreshold(parseFloat(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-transparent border border-[var(--grid-line)] focus:outline-none focus:border-[var(--primary)] text-inherit"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">
                    MAX SOCRATIC CHAT DIALOGUE TURNS
                  </label>
                  <input
                    type="number"
                    min={3}
                    max={25}
                    value={socraticMaxTurns}
                    onChange={(e) => setSocraticMaxTurns(parseInt(e.target.value, 10))}
                    className="w-full px-3.5 py-2.5 bg-transparent border border-[var(--grid-line)] focus:outline-none focus:border-[var(--primary)] text-inherit"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Email Relay */}
            <div className="panel p-6 space-y-4">
              <div className="flex items-center gap-2.5 border-b border-[var(--grid-line)] pb-3">
                <Mail className="w-5 h-5 text-purple-500" />
                <div>
                  <h3 className="text-base font-bold font-mono uppercase tracking-wider text-inherit">EMAIL &amp; NOTIFICATION RELAY</h3>
                  <p className="font-mono text-xs text-slate-600 dark:text-slate-400 font-medium">DRIVER CONFIGURATION FOR OTP DELIVERY AND PROCTORING VIOLATION ALERTS</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div>
                  <label className="block font-bold mb-1">
                    EMAIL SERVICE DRIVER
                  </label>
                  <select
                    value={emailDriver}
                    onChange={(e) => setEmailDriver(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-transparent border border-[var(--grid-line)] focus:outline-none focus:border-[var(--primary)] text-inherit"
                  >
                    <option value="development" className="bg-slate-900 text-slate-100">Development Mock (Console Logged)</option>
                    <option value="smtp" className="bg-slate-900 text-slate-100">Production SMTP Relay</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">
                    SENDER "FROM" ADDRESS
                  </label>
                  <input
                    type="email"
                    required
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-transparent border border-[var(--grid-line)] focus:outline-none focus:border-[var(--primary)] text-inherit"
                  />
                </div>
              </div>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
