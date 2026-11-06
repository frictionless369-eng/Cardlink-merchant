'use client';

import { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, onSnapshot, deleteDoc, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export function LogConsole() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        setLogs([]);
        setLoading(false);
        return;
      }

      // Query without composite index requirement, sorting client-side
      const q = query(collection(db, 'webhook_logs'));

      const unsubscribe = onSnapshot(
        q, 
        (snapshot) => {
          const data = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .sort((a: any, b: any) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
          setLogs(data);
          setLoading(false);
        },
        (error) => {
          console.error("Webhook logs subscription error:", error);
          setLoading(false);
        }
      );
      return () => unsubscribe();
    });
    return () => unsubscribeAuth();
  }, []);

  const clearLogs = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'webhook_logs'));
      const deletePromises = snapshot.docs.map(docItem => deleteDoc(docItem.ref));
      await Promise.all(deletePromises);
      setLogs([]);
    } catch (err) {
      console.error("Failed to clear logs:", err);
    }
  };

  return (
    <div className="bg-slate-950 text-emerald-400 font-mono text-xs p-4 rounded-lg h-96 overflow-y-auto border border-slate-800 shadow-inner">
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-slate-300 font-semibold text-xs">[SYSTEM LOGS] Real-time Cardlink Event Telemetry</span>
        </div>
        <button 
          onClick={clearLogs} 
          className="text-xs text-red-400 hover:text-red-300 bg-red-950/40 hover:bg-red-900/50 px-2 py-1 rounded border border-red-800/40 transition-colors"
        >
          Clear Console
        </button>
      </div>
      {loading ? (
        <div className="text-slate-500 text-xs py-4">Connecting to log stream...</div>
      ) : logs.length === 0 ? (
        <div className="text-slate-600 text-xs py-4">Console idle. Awaiting incoming webhook callbacks or API responses.</div>
      ) : (
        <div className="space-y-1.5">
          {logs.map((log) => (
            <div key={log.id} className="leading-relaxed hover:bg-slate-900/60 p-1 rounded transition-colors">
              <span className="text-slate-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>{' '}
              <span className={log.status === 'success' ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                {log.status?.toUpperCase() || 'INFO'}
              </span>{' '}
              <span className="text-cyan-300 font-semibold">{log.event}</span>{' '}
              {log.error && <span className="text-red-400">| Error: {log.error}</span>}
              {log.payload && (
                <div className="text-[11px] text-slate-400 pl-4 mt-0.5 truncate">
                  Payload: {JSON.stringify(log.payload)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
