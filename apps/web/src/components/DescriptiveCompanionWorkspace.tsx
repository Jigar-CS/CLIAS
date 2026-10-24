'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  FileText,
  Smartphone,
  RefreshCw,
  Download,
  Trash2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Maximize2,
  Layers,
  Sparkles,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

export interface StrokePoint {
  x: number;
  y: number;
  p?: number;
}

export interface StrokeItem {
  id: string;
  points?: StrokePoint[];
  pts?: StrokePoint[];
  color?: string | number;
  strokeWidth?: number;
  w?: number;
  toolType?: string;
  tool?: string;
}

interface DescriptiveWorkspaceProps {
  question: {
    id: string;
    questionText: string;
    explanation?: string;
    points?: number;
    topicName?: string;
    difficulty?: string;
  };
  questionNumber: number;
  sessionId: string;
  onStrokeCountChange?: (questionId: string, count: number) => void;
}

export function DescriptiveCompanionWorkspace({
  question,
  questionNumber,
  sessionId,
  onStrokeCountChange,
}: DescriptiveWorkspaceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [strokes, setStrokes] = useState<StrokeItem[]>([]);
  const [mobileConnected, setMobileConnected] = useState(false);
  const [pairingHost, setPairingHost] = useState('');
  const [isClearing, setIsClearing] = useState(false);
  const [viewMode, setViewMode] = useState<'fit' | 'actual'>('fit');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [docDimensions, setDocDimensions] = useState({ width: 900, height: 2400 });
  const socketRef = useRef<WebSocket | null>(null);

  const activeQId = `Q${questionNumber}`;

  // Dynamically expand canvas bounds if any received strokes exceed default 900x2400 dimensions
  useEffect(() => {
    let w = 900;
    let h = 2400;
    for (const stroke of strokes) {
      const pts = stroke.points || stroke.pts || [];
      for (const p of pts) {
        if (p.x + 50 > w) w = Math.ceil(p.x + 50);
        if (p.y + 80 > h) h = Math.ceil(p.y + 80);
      }
    }
    setDocDimensions({ width: w, height: h });
  }, [strokes]);

  // 1. Determine local host for pairing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      // Default companion port on NestJS backend is 4000
      setPairingHost(`${hostname}:4000`);
    }
  }, []);

  // 2. Fetch existing strokes for this question upon question change
  const fetchStrokes = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/v1/companion/strokes?sessionId=${encodeURIComponent(sessionId)}&questionId=${activeQId}`,
      );
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.strokes)) {
          setStrokes(data.strokes);
          onStrokeCountChange?.(question.id, data.strokes.length);
        }
      }
    } catch (err) {
      console.warn('[DescriptiveWorkspace] Could not fetch cached strokes:', err);
    }
  }, [sessionId, activeQId, question.id, onStrokeCountChange]);

  useEffect(() => {
    fetchStrokes();
  }, [fetchStrokes]);

  // 3. Connect to Companion WebSocket
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const hostname = window.location.hostname;
    const wsUrl = `ws://${hostname}:4000/companion?role=viewer&sessionId=${encodeURIComponent(
      sessionId,
    )}&questionId=${activeQId}`;

    let ws: WebSocket;
    try {
      ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        // Connected to companion gateway
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'INITIAL_STATE') {
            if (msg.mobileStatus === 'connected') setMobileConnected(true);
            if (msg.data && Array.isArray(msg.data.strokes)) {
              setStrokes(msg.data.strokes);
              onStrokeCountChange?.(question.id, msg.data.strokes.length);
            }
          } else if (msg.type === 'MOBILE_STATUS') {
            setMobileConnected(msg.status === 'connected');
          } else if (msg.type === 'CANVAS_UPDATE') {
            setMobileConnected(true);
            if (msg.questionId === activeQId) {
              if (Array.isArray(msg.allStrokes)) {
                setStrokes(msg.allStrokes);
                onStrokeCountChange?.(question.id, msg.allStrokes.length);
              }
            }
          } else if (msg.type === 'CANVAS_CLEAR') {
            if (msg.questionId === activeQId) {
              setStrokes([]);
              onStrokeCountChange?.(question.id, 0);
            }
          }
        } catch (e) {
          console.error('[DescriptiveWorkspace] WebSocket message error:', e);
        }
      };

      ws.onclose = () => {
        // Disconnected
      };
    } catch (e) {
      console.warn('[DescriptiveWorkspace] WebSocket initialization error:', e);
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [sessionId, activeQId, question.id, onStrokeCountChange]);

  // 4. Render digital ruled paper canvas with live strokes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (canvas.width !== docDimensions.width || canvas.height !== docDimensions.height) {
      canvas.width = docDimensions.width;
      canvas.height = docDimensions.height;
    }

    // Background ruled paper
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle horizontal notebook ruled lines (spaced every 36px, starting at y=48)
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    for (let y = 48; y < canvas.height; y += 36) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Vertical red margin rule at x = 60
    ctx.strokeStyle = '#fee2e2';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(60, 0);
    ctx.lineTo(60, canvas.height);
    ctx.stroke();

    // Page break markers every 750px
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = '#94a3b8';
    for (let p = 1; p * 750 < canvas.height; p++) {
      const py = p * 750;
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(canvas.width, py);
      ctx.stroke();
      ctx.fillText(`— PAGE ${p + 1} —`, canvas.width - 120, py - 10);
    }

    // Render strokes with smooth quadratic bezier curves
    for (const stroke of strokes) {
      const pts = stroke.points || stroke.pts;
      if (!pts || pts.length === 0) continue;

      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (stroke.toolType === 'highlighter' || stroke.tool === 'highlighter') {
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.4)';
        ctx.lineWidth = stroke.strokeWidth || stroke.w || 20;
        ctx.globalCompositeOperation = 'multiply';
      } else {
        let color = '#0f172a';
        if (stroke.color) {
          if (typeof stroke.color === 'number') {
            const hex = (stroke.color >>> 0).toString(16).padStart(8, '0');
            const r = parseInt(hex.substring(2, 4), 16);
            const g = parseInt(hex.substring(4, 6), 16);
            const b = parseInt(hex.substring(6, 8), 16);
            color = `rgb(${r},${g},${b})`;
          } else if (typeof stroke.color === 'string') {
            color = stroke.color;
          }
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = stroke.strokeWidth || stroke.w || 3;
      }

      if (pts.length === 1) {
        ctx.beginPath();
        const r = Math.max(1.5, (stroke.strokeWidth || stroke.w || 3) / 2);
        ctx.arc(pts[0].x, pts[0].y, r, 0, Math.PI * 2);
        ctx.fillStyle = ctx.strokeStyle;
        ctx.fill();
        ctx.restore();
        continue;
      }

      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);

      for (let i = 1; i < pts.length; i++) {
        const p0 = pts[i - 1];
        const p1 = pts[i];
        const midX = (p0.x + p1.x) / 2;
        const midY = (p0.y + p1.y) / 2;
        ctx.quadraticCurveTo(p0.x, p0.y, midX, midY);
      }

      const last = pts[pts.length - 1];
      ctx.lineTo(last.x, last.y);
      ctx.stroke();
      ctx.restore();
    }
  }, [strokes, docDimensions]);

  // Handle Clear Canvas
  const handleClear = async () => {
    if (!window.confirm(`Clear all handwritten strokes for ${activeQId}?`)) return;
    setIsClearing(true);
    try {
      await fetch(
        `/api/v1/companion/clear?sessionId=${encodeURIComponent(sessionId)}&questionId=${activeQId}`,
        { method: 'POST' },
      );
      setStrokes([]);
      onStrokeCountChange?.(question.id, 0);
    } catch (e) {
      console.error('Failed to clear canvas:', e);
    } finally {
      setIsClearing(false);
    }
  };

  // Handle PNG Download
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `CLIAS_${activeQId}_Answer_Sheet.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Parse prompt and rubric from questionText
  const parts = question.questionText.split('\n\n[Marking Rubric:');
  const mainPrompt = parts[0];
  const rubric = parts[1] ? parts[1].replace(']', '').trim() : question.explanation || '';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: Descriptive Prompt & Rubric Card */}
      <div className="lg:col-span-5 space-y-4">
        {/* Question Header Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider">
              {activeQId} • Descriptive
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
              {question.points ?? 10} Marks
            </span>
          </div>

          <div className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line">
            {mainPrompt}
          </div>

          {rubric && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Evaluation Rubric
              </span>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-normal">{rubric}</p>
            </div>
          )}
        </div>

        {/* Mobile Companion Pairing Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white border border-indigo-500/30 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold tracking-wide">Mobile Writing Companion</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/40 border border-slate-700 text-[10px]">
              <span
                className={`w-2 h-2 rounded-full ${
                  mobileConnected ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-rose-500'
                }`}
              />
              <span className="font-semibold text-slate-300">
                {mobileConnected ? 'Connected (Live)' : 'Waiting for Device'}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed">
            Write handwriting answers on your paired phone or tablet in landscape mode. Your strokes
            are rendered live on this digital sheet and auto-saved.
          </p>

          <div className="p-3 rounded-xl bg-black/50 border border-slate-800 space-y-1.5 font-mono text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-400">Endpoint:</span>
              <span className="text-cyan-300 font-bold">{pairingHost || 'localhost:4000'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Session ID:</span>
              <span className="text-indigo-300">{sessionId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Active Sheet:</span>
              <span className="text-emerald-400 font-bold">{activeQId}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: 900x2400 Continuous Downward Scroll Ruled Answer Sheet */}
      <div className="lg:col-span-7 space-y-3">
        {/* Canvas Toolbar with Fit-Width & Zoom Controls */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-500" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Live Digital Answer Sheet ({activeQId})
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              • {strokes.length} strokes
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Toggle: Fit Width vs Actual 100% */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('fit')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition flex items-center gap-1.5 ${
                  viewMode === 'fit'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Fit sheet to 100% card width so all words are fully visible"
              >
                <Maximize2 className="w-3 h-3" />
                <span>Fit Width</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setViewMode('actual');
                  setZoomLevel(100);
                }}
                className={`px-2.5 py-1 rounded-lg font-semibold transition flex items-center gap-1.5 ${
                  viewMode === 'actual'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="View at 1:1 actual pixel scale"
              >
                <span>100% Size</span>
              </button>
            </div>

            {viewMode === 'actual' && (
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(50, z - 15))}
                  className="px-2 py-0.5 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md font-bold"
                  title="Zoom Out"
                >
                  -
                </button>
                <span className="font-mono text-[11px] px-1 font-bold text-slate-700 dark:text-slate-300">
                  {zoomLevel}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(200, z + 15))}
                  className="px-2 py-0.5 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md font-bold"
                  title="Zoom In"
                >
                  +
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleClear}
              disabled={isClearing || strokes.length === 0}
              className="p-1.5 px-2 text-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition disabled:opacity-40 flex items-center gap-1 font-semibold border border-rose-200 dark:border-rose-900/40"
              title="Clear answer sheet for this question"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              disabled={strokes.length === 0}
              className="p-1.5 px-2 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-xl transition disabled:opacity-40 flex items-center gap-1 font-semibold border border-indigo-200 dark:border-indigo-900/40"
              title="Download answer sheet as PNG"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export PNG</span>
            </button>
          </div>
        </div>

        {/* Scrollable Answer Sheet Paper Container */}
        <div className="w-full h-[660px] rounded-2xl bg-slate-200/90 dark:bg-slate-950/80 p-3 sm:p-5 overflow-y-auto overflow-x-auto border border-slate-300 dark:border-slate-800 shadow-inner">
          <div
            className="bg-white rounded-xl shadow-xl relative overflow-hidden mx-auto transition-all duration-150"
            style={
              viewMode === 'fit'
                ? {
                    width: '100%',
                    maxWidth: `${docDimensions.width}px`,
                    height: 'auto',
                    aspectRatio: `${docDimensions.width} / ${docDimensions.height}`,
                  }
                : {
                    width: `${(docDimensions.width * zoomLevel) / 100}px`,
                    minWidth: `${(docDimensions.width * zoomLevel) / 100}px`,
                    height: `${(docDimensions.height * zoomLevel) / 100}px`,
                  }
            }
          >
            <canvas
              ref={canvasRef}
              width={docDimensions.width}
              height={docDimensions.height}
              className="w-full h-auto block select-none bg-white"
            />
            <div className="absolute bottom-4 right-6 text-[10px] font-bold tracking-widest text-slate-400 pointer-events-none select-none">
              CLIAS SECURE DIGITAL ANSWER SHEET • CONFIDENTIAL
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
