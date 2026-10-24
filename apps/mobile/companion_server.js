const http = require('http');
const { WebSocketServer } = require('ws');
const os = require('os');

// Detect local IPv4 address
function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

const localIp = getLocalIp();
const PORT = 4000;

// State store for active answer sheet strokes
const answerSheets = {
  'clias-session-9842:Q1': {
    sessionId: 'clias-session-9842',
    questionId: 'Q1',
    strokes: [],
    lastUpdated: Date.now(),
  },
};

let activeQuestionId = 'Q1';

const server = http.createServer((req, res) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host}`);
  if (reqUrl.pathname === '/' || reqUrl.pathname === '/viewer') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(getViewerHtml(localIp, PORT));
    return;
  }
  if (reqUrl.pathname === '/api/clear') {
    const q = reqUrl.searchParams.get('questionId') || activeQuestionId;
    const s = reqUrl.searchParams.get('sessionId') || 'clias-session-9842';
    const clearAll = reqUrl.searchParams.get('all') === 'true';

    if (clearAll) {
      for (const k of Object.keys(answerSheets)) {
        answerSheets[k].strokes = [];
        answerSheets[k].lastUpdated = Date.now();
      }
    } else {
      const key = `${s}:${q}`;
      if (answerSheets[key]) {
        answerSheets[key].strokes = [];
        answerSheets[key].lastUpdated = Date.now();
      }
    }

    broadcastToViewers({
      type: 'CANVAS_CLEAR',
      questionId: q,
      allStrokes: [],
      totalStrokes: 0,
      lastUpdated: Date.now(),
    });

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, message: 'Canvas cleared' }));
    return;
  }
  if (reqUrl.pathname === '/api/strokes') {
    const q = reqUrl.searchParams.get('questionId') || activeQuestionId;
    const s = reqUrl.searchParams.get('sessionId') || 'clias-session-9842';
    const key = `${s}:${q}`;
    const sheet = answerSheets[key] || { sessionId: s, questionId: q, strokes: [] };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(sheet));
    return;
  }
  res.writeHead(404);
  res.end('Not Found');
});

const wss = new WebSocketServer({ server });

let viewerSockets = new Set();
let mobileSockets = new Set();

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const isViewer = url.searchParams.get('role') === 'viewer';
  const sessionId = url.searchParams.get('sessionId') || 'clias-session-9842';
  const questionId = url.searchParams.get('questionId') || 'Q1';
  const key = `${sessionId}:${questionId}`;

  if (isViewer) {
    viewerSockets.add(ws);
    // Send initial snapshot
    if (answerSheets[key]) {
      ws.send(JSON.stringify({
        type: 'INITIAL_STATE',
        data: answerSheets[key],
      }));
    }
    // Send current mobile connection status immediately to viewer
    ws.send(JSON.stringify({
      type: 'MOBILE_STATUS',
      status: mobileSockets.size > 0 ? 'connected' : 'disconnected',
      time: Date.now(),
    }));
    ws.on('close', () => viewerSockets.delete(ws));
    return;
  }

  // Mobile Companion Client connected
  mobileSockets.add(ws);
  console.log(`[CompanionServer] Mobile Companion connected for Session: ${sessionId}, Question: ${questionId}`);

  // Notify viewers that mobile connected
  broadcastToViewers({
    type: 'MOBILE_STATUS',
    status: 'connected',
    time: Date.now(),
  });

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());

      if (data.type === 'CANVAS_DELTA') {
        activeQuestionId = data.questionId || questionId;
        const activeKey = `${data.sessionId || sessionId}:${activeQuestionId}`;

        const sheet = answerSheets[activeKey] || {
          sessionId: data.sessionId || sessionId,
          questionId: activeQuestionId,
          strokes: [],
          lastUpdated: Date.now(),
        };

        // Handle deletions
        if (data.deleted && data.deleted.length > 0) {
          const deleteSet = new Set(data.deleted);
          sheet.strokes = sheet.strokes.filter(s => !deleteSet.has(s.id));
        }

        // Handle added / updated strokes
        if (data.strokes && data.strokes.length > 0) {
          for (const newStroke of data.strokes) {
            const idx = sheet.strokes.findIndex(s => s.id === newStroke.id);
            if (idx >= 0) {
              sheet.strokes[idx] = newStroke;
            } else {
              sheet.strokes.push(newStroke);
            }
          }
        }

        sheet.lastUpdated = Date.now();
        answerSheets[activeKey] = sheet;

        // 1. Send ACK back to mobile phone
        ws.send(JSON.stringify({
          type: 'CANVAS_DELTA_ACK',
          seq: data.seq,
          checksum: data.checksum,
        }));

        // 2. Broadcast live update to browser viewer
        broadcastToViewers({
          type: 'CANVAS_UPDATE',
          questionId: activeQuestionId,
          allStrokes: sheet.strokes,
          delta: data,
          totalStrokes: sheet.strokes.length,
          lastUpdated: sheet.lastUpdated,
        });

      } else if (data.type === 'CLEAR_CANVAS') {
        const q = data.questionId || questionId;
        const s = data.sessionId || sessionId;
        const key = `${s}:${q}`;
        if (answerSheets[key]) {
          answerSheets[key].strokes = [];
          answerSheets[key].lastUpdated = Date.now();
        }
        broadcastToViewers({
          type: 'CANVAS_CLEAR',
          questionId: q,
          allStrokes: [],
          totalStrokes: 0,
          lastUpdated: Date.now(),
        });
        ws.send(JSON.stringify({ type: 'CLEAR_CANVAS_ACK', success: true }));
        console.log(`[CompanionServer] Canvas cleared via mobile for Session: ${s}, Question: ${q}`);
      } else if (data.type === 'HEARTBEAT') {
        ws.send(JSON.stringify({ type: 'HEARTBEAT_ACK', timestamp: Date.now() }));
      }
    } catch (err) {
      console.error('[CompanionServer] Error handling message:', err);
    }
  });

  ws.on('close', () => {
    mobileSockets.delete(ws);
    console.log('[CompanionServer] Mobile Companion disconnected');
    broadcastToViewers({
      type: 'MOBILE_STATUS',
      status: mobileSockets.size > 0 ? 'connected' : 'disconnected',
      time: Date.now(),
    });
  });
});

function broadcastToViewers(payload) {
  const json = JSON.stringify(payload);
  for (const client of viewerSockets) {
    if (client.readyState === 1) {
      client.send(json);
    }
  }
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n======================================================`);
  console.log(`   CLIAS DESCRIPTIVE ANSWER COMPANION PORTAL`);
  console.log(`======================================================`);
  console.log(`   * Live Portal Viewer : http://localhost:${PORT}`);
  console.log(`   * Network Viewer     : http://${localIp}:${PORT}`);
  console.log(`   * Mobile Pairing Host: ${localIp}:${PORT}`);
  console.log(`======================================================\n`);
});

function getViewerHtml(ip, port) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>CLIAS — Live Descriptive Answer Sheet</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: #0f172a; color: #f8fafc; display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
    
    header { background: #1e293b; padding: 14px 24px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #334155; }
    .brand { display: flex; align-items: center; gap: 12px; }
    .logo-badge { background: #4f46e5; color: white; font-weight: bold; padding: 6px 12px; border-radius: 8px; font-size: 14px; }
    .title { font-size: 16px; font-weight: 600; color: #e2e8f0; }

    .status-group { display: flex; align-items: center; gap: 16px; }
    .status-pill { display: flex; align-items: center; gap: 8px; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; background: #334155; }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: #ef4444; }
    .dot.live { background: #10b981; box-shadow: 0 0 8px #10b981; }

    .btn { background: #4f46e5; color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; transition: background 0.2s; }
    .btn:hover { background: #4338ca; }
    .btn-outline { background: transparent; border: 1px solid #475569; color: #cbd5e1; }
    .btn-outline:hover { background: #334155; }

    main { display: flex; flex: 1; overflow: hidden; }

    /* Left pane: Question & Pairing Info */
    .sidebar { width: 380px; background: #1e293b; border-right: 1px solid #334155; padding: 24px; display: flex; flex-direction: column; gap: 20px; overflow-y: auto; }
    .question-card { background: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 16px; }
    .q-num { font-size: 11px; font-weight: 700; color: #818cf8; text-transform: uppercase; margin-bottom: 6px; }
    .q-text { font-size: 14px; line-height: 1.5; color: #f1f5f9; }

    .pairing-box { background: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 16px; }
    .p-title { font-size: 12px; font-weight: 700; color: #94a3b8; margin-bottom: 8px; }
    .p-code { font-family: monospace; background: #1e293b; padding: 8px 12px; border-radius: 6px; font-size: 13px; color: #38bdf8; display: flex; justify-content: space-between; }

    /* Right pane: Real-Time Digital Answer Sheet */
    .canvas-container { flex: 1; background: #334155; display: flex; justify-content: center; align-items: flex-start; padding: 24px; overflow-y: auto; overflow-x: auto; position: relative; }
    .paper-sheet { background: white; width: 900px; height: 2400px; box-shadow: 0 20px 40px rgba(0,0,0,0.4); border-radius: 8px; position: relative; }
    canvas { width: 100%; height: 100%; display: block; }
    
    .paper-watermark { position: absolute; bottom: 16px; right: 20px; font-size: 11px; color: #94a3b8; font-weight: 600; pointer-events: none; }
  </style>
</head>
<body>

  <header>
    <div class="brand">
      <div class="logo-badge">CLIAS</div>
      <div class="title">Examination Portal — Question 1 Descriptive Answer</div>
    </div>
    <div class="status-group">
      <div class="status-pill" id="mobilePill">
        <div class="dot" id="statusDot"></div>
        <span id="statusText">Waiting for Mobile Companion...</span>
      </div>
      <span style="font-size: 12px; color: #94a3b8;" id="strokeCounter">0 strokes</span>
      <button class="btn btn-outline" onclick="downloadImage()">Export PNG</button>
      <button class="btn" onclick="clearViewer()">Clear View</button>
    </div>
  </header>

  <main>
    <div class="sidebar">
      <div class="question-card">
        <div class="q-num">Question 1 (10 Marks)</div>
        <div class="q-text">
          <strong>Explain ACID Properties in Database Management Systems (DBMS) with suitable real-world examples.</strong>
          <p style="margin-top: 10px; font-size: 12px; color: #94a3b8;">
            Write the complete descriptive breakdown natively using your mobile companion writing pad. Your strokes are rendered live on this laptop screen.
          </p>
        </div>
      </div>

      <div class="pairing-box">
        <div class="p-title">Mobile Pairing Parameters</div>
        <div style="font-size: 12px; color: #94a3b8; margin-bottom: 8px;">
          Enter these values on your phone setup screen:
        </div>
        <div style="margin-bottom: 10px;">
          <div style="font-size: 11px; color: #64748b;">Laptop Host / IP</div>
          <div class="p-code">${ip}:${port}</div>
        </div>
        <div style="margin-bottom: 10px;">
          <div style="font-size: 11px; color: #64748b;">Session Token</div>
          <div class="p-code">clias-session-9842</div>
        </div>
        <div>
          <div style="font-size: 11px; color: #64748b;">Question Identifier</div>
          <div class="p-code">Q1</div>
        </div>
      </div>
    </div>

    <div class="canvas-container">
      <div class="paper-sheet" id="paperSheet">
        <canvas id="answerCanvas" width="900" height="2400"></canvas>
        <div class="paper-watermark">CLIAS SECURE DIGITAL ANSWER SHEET • CONFIDENTIAL</div>
      </div>
    </div>
  </main>

  <script>
    const canvas = document.getElementById('answerCanvas');
    const ctx = canvas.getContext('2d');
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    const strokeCounter = document.getElementById('strokeCounter');

    let strokes = [];

    // Draw lined ruled paper guidelines
    function drawPaperBackground() {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 1;
      for (let y = 48; y < canvas.height; y += 36) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Red vertical margin rule
      ctx.strokeStyle = '#fee2e2';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(60, 0);
      ctx.lineTo(60, canvas.height);
      ctx.stroke();

      // Page markers every 750px
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.font = '10px sans-serif';
      ctx.fillStyle = '#94a3b8';
      for (let p = 1; p * 750 < canvas.height; p++) {
        const py = p * 750;
        ctx.beginPath();
        ctx.moveTo(0, py);
        ctx.lineTo(canvas.width, py);
        ctx.stroke();
        ctx.fillText(\`— PAGE \${p + 1} —\`, canvas.width - 120, py - 10);
      }
    }

    function renderAllStrokes() {
      drawPaperBackground();

      for (const stroke of strokes) {
        if (!stroke.pts || stroke.pts.length === 0) continue;

        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (stroke.tool === 'highlighter') {
          ctx.strokeStyle = 'rgba(234, 179, 8, 0.35)';
          ctx.lineWidth = stroke.w || 18;
          ctx.globalCompositeOperation = 'multiply';
        } else {
          // Convert ARGB integer to css hex/rgb if needed
          let color = '#0f172a';
          if (stroke.color) {
            const hex = (stroke.color >>> 0).toString(16).padStart(8, '0');
            const r = parseInt(hex.substring(2, 4), 16);
            const g = parseInt(hex.substring(4, 6), 16);
            const b = parseInt(hex.substring(6, 8), 16);
            color = \`rgb(\${r},\${g},\${b})\`;
          }
          ctx.strokeStyle = color;
          ctx.lineWidth = stroke.w || 3;
        }

        if (stroke.pts.length === 1) {
          ctx.beginPath();
          ctx.arc(stroke.pts[0].x, stroke.pts[0].y, (stroke.w || 3) / 2, 0, Math.PI * 2);
          ctx.fillStyle = ctx.strokeStyle;
          ctx.fill();
          ctx.restore();
          continue;
        }

        // Draw smooth quadratic bezier path
        ctx.beginPath();
        ctx.moveTo(stroke.pts[0].x, stroke.pts[0].y);

        for (let i = 1; i < stroke.pts.length; i++) {
          const p0 = stroke.pts[i - 1];
          const p1 = stroke.pts[i];
          const midX = (p0.x + p1.x) / 2;
          const midY = (p0.y + p1.y) / 2;
          ctx.quadraticCurveTo(p0.x, p0.y, midX, midY);
        }

        const last = stroke.pts[stroke.pts.length - 1];
        ctx.lineTo(last.x, last.y);
        ctx.stroke();
        ctx.restore();
      }

      strokeCounter.innerText = \`\${strokes.length} strokes rendered\`;
    }

    // Connect WebSocket to receive live strokes
    const ws = new WebSocket(\`ws://\${window.location.host}/companion?role=viewer\`);

    ws.onopen = () => {
      console.log('Connected to companion server as viewer');
    };

    function fetchLiveStrokes() {
      fetch('/api/strokes')
        .then(res => res.json())
        .then(data => {
          if (data && Array.isArray(data.strokes)) {
            if (data.strokes.length !== strokes.length) {
              strokes = data.strokes;
              renderAllStrokes();
            }
          }
        })
        .catch(err => console.error('Fetch error:', err));
    }

    // Immediately fetch existing strokes on page load
    fetchLiveStrokes();
    // Safety sync interval every 2 seconds
    setInterval(fetchLiveStrokes, 2000);

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      if (msg.type === 'INITIAL_STATE' && msg.data) {
        strokes = msg.data.strokes || [];
        renderAllStrokes();
      } else if (msg.type === 'MOBILE_STATUS') {
        if (msg.status === 'connected') {
          statusDot.className = 'dot live';
          statusText.innerText = 'Mobile Connected & Active';
        } else {
          statusDot.className = 'dot';
          statusText.innerText = 'Mobile Disconnected';
        }
      } else if (msg.type === 'CANVAS_CLEAR') {
        strokes = [];
        renderAllStrokes();
      } else if (msg.type === 'CANVAS_UPDATE') {
        statusDot.className = 'dot live';
        statusText.innerText = 'Mobile Syncing (Live)';

        if (msg.allStrokes && Array.isArray(msg.allStrokes)) {
          strokes = msg.allStrokes;
        } else {
          const delta = msg.delta;
          if (delta && delta.deleted && delta.deleted.length > 0) {
            const set = new Set(delta.deleted);
            strokes = strokes.filter(s => !set.has(s.id));
          }
          if (delta && delta.strokes && delta.strokes.length > 0) {
            for (const s of delta.strokes) {
              const idx = strokes.findIndex(x => x.id === s.id);
              if (idx >= 0) strokes[idx] = s;
              else strokes.push(s);
            }
          }
        }
        renderAllStrokes();
      }
    };

    function downloadImage() {
      const link = document.createElement('a');
      link.download = 'Question_1_Descriptive_Answer.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    }

    function clearViewer() {
      if (!confirm('Clear all strokes for this answer sheet?')) return;
      fetch('/api/clear?all=true', { method: 'POST' })
        .then(res => res.json())
        .then(() => {
          strokes = [];
          renderAllStrokes();
        })
        .catch(err => {
          console.error('Clear error:', err);
          strokes = [];
          renderAllStrokes();
        });
    }

    drawPaperBackground();
  </script>
</body>
</html>`;
}
