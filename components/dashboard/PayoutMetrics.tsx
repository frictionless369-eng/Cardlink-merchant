import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { Send, Wallet, TrendingUp, AlertTriangle } from 'lucide-react';

export function PayoutMetrics() {
  const [metrics, setMetrics] = useState({
    VISA_DIRECT: 0,
    MASTERCARD_SEND: 0,
    BANK_TRANSFER: 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'transactions'), where('type', '==', 'payout'));
    const unsub = onSnapshot(q, (snapshot) => {
      let v = 0, m = 0, b = 0;
      
      snapshot.docs.forEach(doc => {
        const d = doc.data();
        const amt = typeof d.amount === 'number' ? d.amount : parseFloat(d.amount || '0');
        if (d.gateway === 'VISA_DIRECT') v += amt;
        else if (d.gateway === 'MASTERCARD_SEND') m += amt;
        else b += amt;
      });
      
      setMetrics({ VISA_DIRECT: v, MASTERCARD_SEND: m, BANK_TRANSFER: b, total: v + m + b });
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
      <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Payout Volume</div>
        <div className="text-xl font-bold font-mono text-indigo-700">€{metrics.total.toFixed(2)}</div>
      </div>
      <div className="bg-blue-50 p-4 border border-blue-100 rounded-xl">
        <div className="text-[10px] font-bold text-blue-800 uppercase tracking-wider mb-1">Visa Direct</div>
        <div className="text-lg font-bold font-mono text-blue-900">€{metrics.VISA_DIRECT.toFixed(2)}</div>
      </div>
      <div className="bg-red-50 p-4 border border-red-100 rounded-xl">
        <div className="text-[10px] font-bold text-red-800 uppercase tracking-wider mb-1">MC Send</div>
        <div className="text-lg font-bold font-mono text-red-900">€{metrics.MASTERCARD_SEND.toFixed(2)}</div>
      </div>
      <div className="bg-emerald-50 p-4 border border-emerald-100 rounded-xl">
        <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider mb-1">Bank Transfers</div>
        <div className="text-lg font-bold font-mono text-emerald-900">€{metrics.BANK_TRANSFER.toFixed(2)}</div>
      </div>
    </div>
  );
}
