'use client';
import { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export function WebhookLogTable() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    async function fetchLogs() {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      const q = query(
        collection(db, 'webhook_logs'), 
        where('merchantId', '==', user.uid),
        orderBy('timestamp', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLogs(data);
    }
    fetchLogs();
  }, []);

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-50 text-slate-500 font-medium">
          <tr>
            <th className="px-6 py-3">Timestamp</th>
            <th className="px-6 py-3">Event</th>
            <th className="px-6 py-3">Status</th>
            <th className="px-6 py-3">Error</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {logs.map((log) => (
            <tr key={log.id} className="hover:bg-slate-50">
              <td className="px-6 py-4 text-slate-600 font-mono">
                {new Date(log.timestamp).toLocaleString()}
              </td>
              <td className="px-6 py-4 font-semibold text-slate-900">{log.event}</td>
              <td className="px-6 py-4">
                <span className={`px-2 py-1 rounded text-xs ${log.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {log.status}
                </span>
              </td>
              <td className="px-6 py-4 text-slate-600">{log.error || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
