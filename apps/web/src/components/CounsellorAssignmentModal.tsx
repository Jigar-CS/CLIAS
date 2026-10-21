'use client';

import React, { useState, useRef } from 'react';
import { api } from '@/lib/api';
import {
  X,
  Upload,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Download,
  Loader2,
  Users,
  ShieldCheck,
  ArrowRight,
  Info,
} from 'lucide-react';

interface CounsellorAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CounsellorAssignmentModal({
  isOpen,
  onClose,
  onSuccess,
}: CounsellorAssignmentModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (selectedFile: File) => {
    setError(null);
    setResult(null);
    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'csv', 'pdf'].includes(ext || '')) {
      setError('Invalid file type. Please upload an Excel (.xlsx, .xls), CSV (.csv), or PDF (.pdf) file.');
      return;
    }
    setFile(selectedFile);
  };

  const handleDownloadSample = async (format: 'xlsx' | 'csv') => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`http://localhost:4000/api/v1/admin/counsellor-assignments/sample?format=${format}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      });
      if (!res.ok) throw new Error('Failed to download sample file');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `clias_counsellor_allocation_sample.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Sample download failed');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    setResult(null);

    try {
      // Read file as base64
      const reader = new FileReader();
      const fileDataPromise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      });

      const base64Data = await fileDataPromise;

      const res: any = await api.post(
        '/admin/counsellor-assignments/upload',
        {
          fileBase64: base64Data,
          fileName: file.name,
        },
        { timeout: 120000 } as any,
      );

      setResult(res);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err?.message || 'Failed to process counsellor assignments file. Please verify format.');
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150 text-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Upload Counsellor-Student Allocations
              </h2>
             
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Guidance & Sample Download */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 space-y-3">
          <div className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300">
            <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <div className="space-y-1 text-[11px] leading-relaxed">
              <p className="font-semibold text-slate-900 dark:text-white">Supported Content Formats in PDF or Excel:</p>
              <ul className="list-disc list-inside space-y-0.5 text-slate-500 dark:text-slate-400">
                <li><strong className="text-slate-700 dark:text-slate-200">Multiple ID Ranges:</strong> e.g. <span className="font-mono text-indigo-500">24CS001-24CS010, 24CS020-24CS030</span> or <span className="font-mono text-indigo-500">id 1 to 10 and also 20 to 30</span> (assigns 1-10 & 20-30, leaving 11-19 out)</li>
                <li><strong className="text-slate-700 dark:text-slate-200">Continuous Range:</strong> e.g. <span className="font-mono text-indigo-500">24CS001-24CS045</span> or <span className="font-mono text-indigo-500">1 to 50</span></li>
                <li><strong className="text-slate-700 dark:text-slate-200">Exclusions:</strong> e.g. <span className="font-mono text-indigo-500">id 1 to 30 but not 11 to 19</span></li>
                <li><strong className="text-slate-700 dark:text-slate-200">IDs or Names:</strong> e.g. <span className="font-mono text-indigo-500">24CS001, 24CS002</span> or <span className="font-mono text-indigo-500">Rahul Patel, Priya Sharma</span></li>
                <li><strong className="text-slate-700 dark:text-slate-200">Excel Structure:</strong> Column 1 for Counsellor Name/Email, Column 2 for Student IDs/Ranges. Multiple rows per counsellor are also supported.</li>
              </ul>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1 border-t border-slate-200 dark:border-slate-800/60">
            <span className="text-[11px] text-slate-500 font-medium">Download Templates:</span>
            <button
              type="button"
              onClick={() => handleDownloadSample('xlsx')}
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Sample Excel (.xlsx)</span>
            </button>
            <button
              type="button"
              onClick={() => handleDownloadSample('csv')}
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Sample CSV</span>
            </button>
          </div>
        </div>

        {/* Dropzone */}
        {!result && (
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition ${
              dragActive
                ? 'border-indigo-500 bg-indigo-500/10'
                : file
                ? 'border-emerald-500/50 bg-emerald-500/5'
                : 'border-slate-300 dark:border-slate-700 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 bg-slate-50/50 dark:bg-slate-950/40'
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.csv,.pdf"
              className="hidden"
              onChange={handleFileChange}
            />

            {file ? (
              <div className="space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-md">
                  {file.name.endsWith('.pdf') ? (
                    <FileText className="w-7 h-7" />
                  ) : (
                    <FileSpreadsheet className="w-7 h-7" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">{file.name}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {(file.size / 1024).toFixed(1)} KB • Click or drag another file to replace
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 flex items-center justify-center mx-auto">
                  <Upload className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    Drop your PDF or Excel allocation file here
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Supports <strong className="text-indigo-500 font-semibold">.xlsx, .xls, .csv, .pdf</strong>
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Result View */}
        {result && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
              <div>
                <span className="font-bold block text-sm">{result.message}</span>
                <span className="text-[11px] opacity-90">
                  {result.studentsCount} students mapped across {result.counsellorsCount} counsellor(s).
                </span>
              </div>
            </div>

            {/* Assignments preview list */}
            {result.assignments && result.assignments.length > 0 && (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-xs max-h-60 overflow-y-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 sticky top-0">
                    <tr>
                      <th className="p-3">Counsellor</th>
                      <th className="p-3">Student</th>
                      <th className="p-3">Enrollment</th>
                      <th className="p-3">Cohort</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                    {[...result.assignments]
                      .sort((a: any, b: any) =>
                        (a.enrollmentNumber || '').localeCompare(b.enrollmentNumber || '', undefined, {
                          numeric: true,
                          sensitivity: 'base',
                        }),
                      )
                      .map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-850/50">
                        <td className="p-3 font-semibold text-indigo-600 dark:text-indigo-400">{item.counsellorEmail}</td>
                        <td className="p-3 font-bold text-slate-900 dark:text-white">{item.studentName}</td>
                        <td className="p-3 font-mono text-[11px] text-slate-500">{item.enrollmentNumber}</td>
                        <td className="p-3 text-slate-400">Sem {item.semester} • Div {item.division}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Unmatched list notice */}
            {result.unmatchedStudents && result.unmatchedStudents.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs space-y-1">
                <span className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Unmatched items ({result.unmatchedStudents.length}):
                </span>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  {result.unmatchedStudents.slice(0, 10).join(', ')}
                  {result.unmatchedStudents.length > 10 ? ` and ${result.unmatchedStudents.length - 10} more.` : ''}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            {result ? (
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
              >
                Upload Another File
              </button>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              {result ? 'Done' : 'Cancel'}
            </button>

            {!result && (
              <button
                type="button"
                onClick={handleUpload}
                disabled={!file || uploading}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Parsing & Assigning...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Process & Assign Students</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
