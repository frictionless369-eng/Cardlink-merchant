'use client';

import { useEffect, useState, useRef } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, onSnapshot, deleteDoc, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { Terminal, Trash2, Play, Filter } from 'lucide-react';

interface CliEntry {
  id: string;
  timestamp: string;
  statusCode: number;
  method: string;
  endpoint: string;
  event: string;
  status: 'success' | 'failure' | 'warning' | 'info';
  latencyMs?: number;
  errorCode?: string;
  error?: string;
  payload?: any;
}

export function LogConsole() {
  const [logs, setLogs] = useState<CliEntry[]>([]);
  const [localCliLines, setLocalCliLines] = useState<CliEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [command, setCommand] = useState('');
  const [filter, setFilter] = useState<'ALL' | '2XX' | 'ERR'>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        setLogs([]);
        setLoading(false);
        return;
      }

      const q = query(collection(db, 'webhook_logs'));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const data: CliEntry[] = snapshot.docs
            .map((docItem) => {
              const d = docItem.data();
              const isSuccess = d.status === 'success';
              const statusCode = d.statusCode || (isSuccess ? 200 : 500);
              return {
                id: docItem.id,
                timestamp: d.timestamp || new Date().toISOString(),
                statusCode,
                method: d.method || 'POST',
                endpoint: d.endpoint || `/api/webhooks/cardlink/${d.event || 'callback'}`,
                event: d.event || 'webhook_event',
                status: (isSuccess ? 'success' : 'failure') as CliEntry['status'],
                latencyMs: d.latencyMs,
                errorCode: d.errorCode || (!isSuccess ? 'ERR_GATEWAY_CALLBACK' : undefined),
                error: d.error,
                payload: d.payload,
              };
            })
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setLogs(data);
          setLoading(false);
        },
        (error) => {
          console.error('Webhook logs subscription error:', error);
          setLoading(false);
        }
      );
      return () => unsubscribe();
    });
    return () => unsubscribeAuth();
  }, []);

  const appendLocalLine = (entry: Omit<CliEntry, 'id' | 'timestamp'>) => {
    setLocalCliLines((prev) => [
      {
        ...entry,
        id: `cli_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  const clearLogs = async () => {
    setLocalCliLines([]);
    try {
      const snapshot = await getDocs(collection(db, 'webhook_logs'));
      const deletePromises = snapshot.docs.map((docItem) => deleteDoc(docItem.ref));
      await Promise.all(deletePromises);
      setLogs([]);
    } catch (err: any) {
      appendLocalLine({
        statusCode: 403,
        method: 'DELETE',
        endpoint: '/firestore/webhook_logs',
        event: 'CLEAR_LOGS_FAILED',
        status: 'failure',
        errorCode: err.code || 'PERMISSION_DENIED',
        error: err.message,
      });
    }
  };

  const runCliCommand = async (rawCmd: string) => {
    const trimmed = rawCmd.trim();
    if (!trimmed) return;
    setCommand('');

    const [cmd, ...args] = trimmed.split(/\s+/);

    if (cmd === 'clear') {
      await clearLogs();
      return;
    }

    if (cmd === 'help') {
      appendLocalLine({
        statusCode: 200,
        method: 'CLI',
        endpoint: 'local://help',
        event: 'AVAILABLE COMMANDS: help | ping | status | test-webhook <payment|capture|cancel> | clear',
        status: 'info',
      });
      return;
    }

    if (cmd === 'status') {
      appendLocalLine({
        statusCode: 200,
        method: 'CLI',
        endpoint: 'local://status',
        event: `MID: 9000012429 | STREAM: CONNECTED | LOGS: ${logs.length}`,
        status: 'info',
      });
      return;
    }

    if (cmd === 'ping') {
      const start = performance.now();
      try {
        const res = await fetch('/api/cardlink', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-merchant-id': '9000012429' },
          body: JSON.stringify({ name: 'CLI_PING', email: 'cli@cardlink.gr' }),
        });
        const latency = Math.round(performance.now() - start);
        const body = await res.json();
        appendLocalLine({
          statusCode: res.status,
          method: 'POST',
          endpoint: '/api/cardlink',
          event: res.ok ? 'GATEWAY_PING_OK' : 'GATEWAY_PING_ERR',
          status: res.ok ? 'success' : 'failure',
          latencyMs: latency,
          errorCode: !res.ok ? `HTTP_${res.status}` : undefined,
          payload: body,
        });
      } catch (err: any) {
        appendLocalLine({
          statusCode: 502,
          method: 'POST',
          endpoint: '/api/cardlink',
          event: 'NETWORK_UNREACHABLE',
          status: 'failure',
          errorCode: 'ERR_CONNECTION_REFUSED',
          error: err.message,
        });
      }
      return;
    }

    if (cmd === 'test-webhook') {
      const eventName = args[0] || 'payment';
      const endpoint = `/api/webhooks/cardlink/${eventName}`;
      const start = performance.now();
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-merchant-id': getAuth().currentUser?.uid || '9000012429',
          },
          body: JSON.stringify({
            event: eventName,
            orderId: `cli_${Date.now()}`,
            amount: '75.00',
            currency: 'EUR',
            status: 'CAPTURED',
          }),
        });
        const latency = Math.round(performance.now() - start);
        const body = await res.json().catch(() => ({}));
        appendLocalLine({
          statusCode: res.status,
          method: 'POST',
          endpoint,
          event: `WEBHOOK_${eventName.toUpperCase()}`,
          status: res.ok ? 'success' : 'failure',
          latencyMs: latency,
          errorCode: !res.ok ? `HTTP_${res.status}` : undefined,
          payload: body,
        });
      } catch (err: any) {
        appendLocalLine({
          statusCode: 500,
          method: 'POST',
          endpoint,
          event: 'WEBHOOK_DISPATCH_ERROR',
          status: 'failure',
          errorCode: 'ERR_NETWORK',
          error: err.message,
        });
      }
      return;
    }

    appendLocalLine({
      statusCode: 400,
      method: 'CLI',
      endpoint: `local://${cmd}`,
      event: `UNKNOWN_COMMAND: '${cmd}' (type 'help')`,
      status: 'warning',
      errorCode: 'ERR_UNKNOWN_CMD',
    });
  };

  const getStatusBadgeStyle = (code: number) => {
    if (code >= 200 && code < 300) {
      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40';
    }
    if (code >= 300 && code < 400) {
      return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40';
    }
    if (code >= 400 && code < 500) {
      return 'bg-amber-500/15 text-amber-300 border-amber-500/40';
    }
    return 'bg-red-500/15 text-red-400 border-red-500/40';
  };

  const combinedLogs = [...localCliLines, ...logs].filter((item) => {
    if (filter === '2XX') return item.statusCode >= 200 && item.statusCode < 300;
    if (filter === 'ERR') return item.statusCode >= 400 || item.status === 'failure';
    return true;
  });

  return (
    <div className="bg-slate-950 text-slate-200 font-mono text-xs rounded-xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[520px]">
      {/* CLI Top Bar */}
      <div className="flex flex-wrap justify-between items-center gap-2 px-4 py-3 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Terminal size={15} className="text-emerald-400" />
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-slate-200 font-bold tracking-wide">
            CARDLINK-CLI // REAL-TIME NETWORK RESPONSE STREAM
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
            <Filter size={11} className="text-slate-500 mx-1.5" />
            {(['ALL', '2XX', 'ERR'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                  filter === f
                    ? 'bg-slate-800 text-emerald-400'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => runCliCommand('test-webhook payment')}
            className="text-[11px] text-cyan-300 hover:text-cyan-200 bg-cyan-950/50 hover:bg-cyan-900/50 px-2.5 py-1 rounded border border-cyan-800/50 flex items-center gap-1 transition-colors"
          >
            <Play size={11} />
            <span>Test Webhook</span>
          </button>

          <button
            type="button"
            onClick={clearLogs}
            className="text-[11px] text-red-400 hover:text-red-300 bg-red-950/40 hover:bg-red-900/50 px-2.5 py-1 rounded border border-red-800/40 flex items-center gap-1 transition-colors"
          >
            <Trash2 size={11} />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Log Stream Output */}
      <div className="flex-1 p-4 overflow-y-auto space-y-1.5">
        {loading ? (
          <div className="text-slate-500 py-4">Connecting to Cardlink network response stream...</div>
        ) : combinedLogs.length === 0 ? (
          <div className="text-slate-500 py-6 space-y-1">
            <div>[READY] Listening for real-time Cardlink API &amp; webhook responses...</div>
            <div className="text-slate-600">
              Tip: Type <span className="text-emerald-400">help</span>,{' '}
              <span className="text-emerald-400">ping</span>, or{' '}
              <span className="text-emerald-400">test-webhook payment</span> below.
            </div>
          </div>
        ) : (
          combinedLogs.map((log) => {
            const isExpanded = expandedId === log.id;
            return (
              <div
                key={log.id}
                onClick={() => setExpandedId(isExpanded ? null : log.id)}
                className="p-2 rounded-lg bg-slate-900/40 hover:bg-slate-900/90 border border-slate-800/60 cursor-pointer transition-colors"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-slate-500 text-[11px]">
                    [{new Date(log.timestamp).toLocaleTimeString()}]
                  </span>

                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${getStatusBadgeStyle(
                      log.statusCode
                    )}`}
                  >
                    HTTP {log.statusCode}
                  </span>

                  <span className="text-purple-400 font-bold">{log.method}</span>
                  <span className="text-slate-300">{log.endpoint}</span>
                  <span className="text-cyan-300 font-semibold">{log.event}</span>

                  {log.latencyMs !== undefined && (
                    <span className="text-slate-500 text-[10px] ml-auto">{log.latencyMs}ms</span>
                  )}

                  {log.errorCode && (
                    <span className="px-1.5 py-0.5 rounded bg-red-950 text-red-400 border border-red-800/60 text-[10px] font-bold">
                      {log.errorCode}
                    </span>
                  )}
                </div>

                {log.error && (
                  <div className="text-red-400 text-[11px] mt-1 pl-2 border-l-2 border-red-500/50">
                    Error: {log.error}
                  </div>
                )}

                {log.payload && (
                  <div
                    className={`text-[11px] text-slate-400 mt-1 pl-2 border-l-2 border-slate-700 ${
                      isExpanded ? 'whitespace-pre-wrap break-all' : 'truncate'
                    }`}
                  >
                    {isExpanded ? JSON.stringify(log.payload, null, 2) : JSON.stringify(log.payload)}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Interactive CLI Input Prompt */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          runCliCommand(command);
        }}
        className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 border-t border-slate-800"
      >
        <span className="text-emerald-400 font-bold select-none">cardlink-cli&gt;</span>
        <input
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="Type 'help', 'ping', 'test-webhook payment', or 'clear'..."
          className="flex-1 bg-transparent text-slate-100 placeholder-slate-600 focus:outline-none text-xs font-mono"
        />
        <button
          type="submit"
          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-bold transition-colors"
        >
          RUN
        </button>
      </form>
    </div>
  );
}
