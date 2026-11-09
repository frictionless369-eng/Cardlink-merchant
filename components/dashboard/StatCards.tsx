'use client';

import { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, onSnapshot, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

import { FileText } from 'lucide-react';
import { ReceiptModal } from './ReceiptModal';

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
  const [failedCount, setFailedCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const q = query(collection(db, 'transactions'));
    const unsubscribeSnap = onSnapshot(
      q,
        (snapshot) => {
          let revenueSum = 0;
          let pending = 0;
          let completed = 0;
          let failed = 0;

          snapshot.docs.forEach((docItem) => {
            const data = docItem.data();
            const amt = typeof data.amount === 'number' ? data.amount : parseFloat(data.amount || '0');
            
            if (data.status === 'Completed') {
              completed += 1;
              if (!isNaN(amt)) revenueSum += amt;
            } else if (data.status === 'Pending') {
              pending += 1;
            } else {
              failed += 1;
            }
          });

          setTotalRevenue(revenueSum);
          setPendingCount(pending);
          setCompletedCount(completed);
          setFailedCount(failed);
          setLoading(false);
        },
        (err) => {
          console.error("Metrics snapshot error:", err);
          setLoading(false);
        }
      );

    return () => unsubscribeSnap();
  }, []);

  const total = completedCount + failedCount + pendingCount;
  const successRate = total > 0 ? (completedCount / (total - pendingCount || 1)) * 100 : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
      <StatCard 
        label="Success Rate" 
        value={loading ? '...' : `${successRate.toFixed(1)}%`} 
      />
    </div>
  );
}

export function TransactionTable() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState<any | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  useEffect(() => {
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
  }, []);

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-6 text-center text-xs text-slate-500">
        Loading transactions...
      </div>
    );
  }

  const handleOpenReceipt = (tx: any) => {
    setSelectedTx(tx);
    setIsReceiptOpen(true);
  };

  return (
    <>
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-3.5">Transaction ID</th>
              <th className="px-6 py-3.5">Date</th>
              <th className="px-6 py-3.5 text-right">Amount</th>
              <th className="px-6 py-3.5">Status</th>
              <th className="px-6 py-3.5 text-right">Receipt / Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-xs font-mono">
                  No transactions recorded. Volume is currently $0.00.
                </td>
              </tr>
            ) : (
              transactions.map((t, index) => {
                const statusNormalized = (t.status || '').toLowerCase().trim();
                const isPendingOrAwaiting =
                  statusNormalized === 'pending' ||
                  statusNormalized === 'awaiting-capture' ||
                  statusNormalized === 'awaiting_capture' ||
                  statusNormalized === 'authorized';

                return (
                  <tr
                    key={`${t.id}-${index}`}
                    className={`transition-colors relative ${
                      isPendingOrAwaiting
                        ? 'bg-amber-50/50 hover:bg-amber-50/80 animate-pulse border-l-4 border-l-amber-500'
                        : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <td className="px-6 py-4 font-mono font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        {isPendingOrAwaiting && (
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                          </span>
                        )}
                        <span>{t.id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-xs">
                      {t.date ? new Date(t.date).toLocaleString() : '-'}
                    </td>
                    <td className="px-6 py-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                      ${typeof t.amount === 'number' ? t.amount.toFixed(2) : parseFloat(t.amount || '0').toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          statusNormalized === 'completed' || statusNormalized === 'success'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : isPendingOrAwaiting
                            ? 'bg-amber-100/90 text-amber-800 border border-amber-300 shadow-2xs'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {isPendingOrAwaiting && (
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping"></span>
                        )}
                        {t.status === 'Completed' ? 'Success' : t.status || 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {statusNormalized === 'completed' || statusNormalized === 'success' ? (
                        <button
                          type="button"
                          onClick={() => handleOpenReceipt(t)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors rounded-lg border border-slate-200 shadow-2xs cursor-pointer"
                          title="Generate Printable PDF Receipt"
                        >
                          <FileText size={13} className="text-slate-500" />
                          <span>Download Receipt</span>
                        </button>
                      ) : (
                        <span className="text-xs text-amber-600/80 font-medium font-mono">
                          {isPendingOrAwaiting ? 'Processing...' : 'N/A'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <ReceiptModal
        transaction={selectedTx}
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
      />
    </>
  );
}

