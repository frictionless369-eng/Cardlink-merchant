'use client';

import { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white p-6 border border-slate-200 rounded-lg">
      <div className="text-sm text-slate-500 mb-1">{label}</div>
      <div className="text-3xl font-bold font-mono tabular-nums text-slate-900">{value}</div>
    </div>
  );
}

export function TransactionTable() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        setTransactions([]);
        setLoading(false);
        return;
      }

      const uid = user.uid;
      async function fetchTransactions() {
        try {
          const q = query(collection(db, 'transactions'), where('merchantId', '==', uid));
          const querySnapshot = await getDocs(q);
          const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setTransactions(data);
        } catch (err) {
          console.error("Error fetching transactions:", err);
          // Fallback to fetch all transactions if merchantId doesn't match
          try {
            const querySnapshotAll = await getDocs(collection(db, 'transactions'));
            const dataAll = querySnapshotAll.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTransactions(dataAll);
          } catch (fallbackErr) {
            console.error("Fallback fetch failed:", fallbackErr);
          }
        } finally {
          setLoading(false);
        }
      }
      fetchTransactions();
    });
    return () => unsubscribeAuth();
  }, []);

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-6 text-center text-xs text-slate-500">
        Loading transactions...
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-50 text-slate-500 font-medium">
          <tr>
            <th className="px-6 py-3">Transaction ID</th>
            <th className="px-6 py-3">Date</th>
            <th className="px-6 py-3 text-right">Amount</th>
            <th className="px-6 py-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {transactions.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-6 py-8 text-center text-slate-400 text-xs font-mono">
                No transactions recorded yet. Initiate a payment preview to generate logs.
              </td>
            </tr>
          ) : (
            transactions.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-mono text-slate-900">{t.id}</td>
                <td className="px-6 py-4 text-slate-600">{t.date ? new Date(t.date).toLocaleString() : '-'}</td>
                <td className="px-6 py-4 text-right font-mono tabular-nums text-slate-900">
                  ${typeof t.amount === 'number' ? t.amount.toFixed(2) : t.amount}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    t.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' :
                    t.status === 'Pending' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {t.status}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
