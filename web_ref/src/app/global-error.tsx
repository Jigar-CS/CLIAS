'use client';

import React from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center bg-[#f5f2eb] px-4 font-sans text-slate-800">
        <div className="max-w-md w-full bg-white border border-slate-300 rounded-xl p-8 text-center shadow-lg">
          <h2 className="text-xl font-bold mb-3">Application Rendering Issue</h2>
          <p className="text-xs text-slate-600 mb-6">{error?.message || 'A temporary rendering or bundle desync occurred.'}</p>
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg"
          >
            Reload Interface
          </button>
        </div>
      </body>
    </html>
  );
}
