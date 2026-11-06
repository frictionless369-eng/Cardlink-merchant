'use client';

import { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, onSnapshot, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white p-6 border border-slate-200 rounded-xl shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">{label}</div>
      <div className="text-3xl font-bold font-mono tabular-nums text-slate-900">{value}</div>
    </div>
  );
}

export function DashboardMetrics() {
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        setTotalRevenue(0);
        setPendingCount(0);
        setCompletedCount(0);
        setLoading(false);
        return;
      }

      // Real-time listener for live transaction metrics
      const q = query(collection(db, 'transactions'));
      const unsubscribeSnap = onSnapshot(
        q,
        (snapshot) => {
          let revenueSum = 0;
          let pending = 0;
          let completed = 0;

          snapshot.docs.forEach((docItem) => {
            const data = docItem.data();
            const amt = typeof data.amount === 'number' ? data.amount : parseFloat(data.amount || '0');
            
            if (data.status === 'Completed') {
              completed += 1;
              if (!isNaN(amt)) revenueSum += amt;
            } else if (data.status === 'Pending') {
              pending += 1;
            }
          });

          setTotalRevenue(revenueSum);
          setPendingCount(pending);
          setCompletedCount(completed);
          setLoading(false);
        },
        (err) => {
          console.error("Metrics snapshot error:", err);
          setLoading(false);
        }
      );

      return () => unsubscribeSnap();
    });

    return () => unsubscribeAuth();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <StatCard 
        label="Total Revenue" 
        value={loading ? '...' : `$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
      />
      <StatCard 
        label="Pending Orders" 
        value={loading ? '...' : pendingCount.toString()} 
      />
      <StatCard 
        label="Completed Orders" 
        value={loading ? '...' : completedCount.toString()} 
      />
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

      const q = query(collection(db, 'transactions'));
      const unsubscribeSnap = onSnapshot(
        q,
        (snapshot) => {
          const data = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .sort((a: any, b: any) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
          setTransactions(data);
          setLoading(false);
        },
        (err) => {
          console.error("Transactions snapshot error:", err);
          setLoading(false);
        }
      );

      return () => unsubscribeSnap();
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
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200 text-xs uppercase tracking-wider">
          <tr>
            <th className="px-6 py-3.5">Transaction ID</th>
            <th className="px-6 py-3.5">Date</th>
            <th className="px-6 py-3.5 text-right">Amount</th>
            <th className="px-6 py-3.5">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {transactions.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-xs font-mono">
                No transactions recorded. Volume is currently $0.00.
              </td>
            </tr>
          ) : (
            transactions.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-6 py-4 font-mono font-medium text-slate-900">{t.id}</td>
                <td className="px-6 py-4 text-slate-600 text-xs">
                  {t.date ? new Date(t.date).toLocaleString() : '-'}
                </td>
                <td className="px-6 py-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                  ${typeof t.amount === 'number' ? t.amount.toFixed(2) : parseFloat(t.amount || '0').toFixed(2)}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    t.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    t.status === 'Pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-red-50 text-red-700 border border-red-200'
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
