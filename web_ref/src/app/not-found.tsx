import Link from 'next/link';
import { ArrowLeft, Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f2eb] dark:bg-[#080d1a] px-4">
      <div className="max-w-md w-full bg-[#faf8f5] dark:bg-[#0f172a] border border-[#141c2e]/15 dark:border-white/10 rounded-xl p-8 text-center shadow-lg">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-red-600/10 text-red-600 mb-4">
          <Compass className="w-6 h-6" />
        </div>
        <p className="font-mono text-[11px] uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
          [ERR 404] — ROUTE NOT LOCATED
        </p>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-3">
          Page Not Found
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
          The requested platform resource could not be resolved or is not accessible.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold tracking-wide transition shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    </div>
  );
}
