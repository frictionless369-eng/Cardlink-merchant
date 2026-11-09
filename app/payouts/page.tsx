'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import TopBar from '@/components/dashboard/TopBar';
import { 
  Send, 
  CreditCard, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  Zap, 
  ShieldCheck, 
  ArrowUpRight, 
  History,
  Lock
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';

export default function PayoutsPage() {
  const [network, setNetwork] = useState<'VISA_DIRECT' | 'MASTERCARD_SEND' | 'BANK_TRANSFER'>('VISA_DIRECT');
  const [recipientType, setRecipientType] = useState<'card' | 'bank'>('card');
  const [amount, setAmount] = useState('150.00');
  const [currency, setCurrency] = useState('EUR');
  const [recipientName, setRecipientName] = useState('Eleni Papadopoulou');
  const [cardNumber, setCardNumber] = useState('4532 7512 8901 3412');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [accountNumber, setAccountNumber] = useState('GR16026000000001234567890');
  const [bankName, setBankName] = useState('Eurobank Greece S.A.');
  const [routingOrSwift, setRoutingOrSwift] = useState('ERBKGRAA');
  const [senderReference, setSenderReference] = useState('Merchant Settlement Payout');

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string; details?: any } | null>(null);
  const [recentPayouts, setRecentPayouts] = useState<any[]>([]);

  // Load saved recipient data from settings if available
  useEffect(() => {
    async function loadRecipientDefaults() {
      try {
        const snap = await getDoc(doc(db, 'merchants', 'default_merchant'));
        if (snap.exists() && snap.data().payoutRecipient) {
          const rec = snap.data().payoutRecipient;
          if (rec.type) setRecipientType(rec.type);
          if (rec.cardHolderName) setRecipientName(rec.cardHolderName);
          if (rec.cardNumber) setCardNumber(rec.cardNumber);
          if (rec.cardExpiry) setCardExpiry(rec.cardExpiry);
          if (rec.accountHolder && rec.type === 'bank') setRecipientName(rec.accountHolder);
          if (rec.accountNumber) setAccountNumber(rec.accountNumber);
          if (rec.bankName) setBankName(rec.bankName);
          if (rec.routingOrSwift) setRoutingOrSwift(rec.routingOrSwift);
          if (rec.currency) setCurrency(rec.currency);
        }
      } catch (err) {
        console.error('Failed to load merchant recipient:', err);
      }
    }
    loadRecipientDefaults();

    // Listen for recent payout transactions
    const q = query(collection(db, 'transactions'), where('type', '==', 'payout'));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a: any, b: any) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
        setRecentPayouts(list);
      },
      (err) => console.error('Payouts snapshot error:', err)
    );

    return () => unsub();
  }, []);

  const handleCardNumberChange = (val: string) => {
    setCardNumber(val);
    const clean = val.replace(/\s+/g, '');
    if (clean.startsWith('4')) {
      setNetwork('VISA_DIRECT');
    } else if (clean.startsWith('5') || clean.startsWith('2')) {
      setNetwork('MASTERCARD_SEND');
    }
  };

  const handleExecutePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          network,
          amount,
          currency,
          recipientType,
          recipientName,
          cardNumber: recipientType === 'card' ? cardNumber : undefined,
          cardExpiry: recipientType === 'card' ? cardExpiry : undefined,
          accountNumber: recipientType === 'bank' ? accountNumber : undefined,
          bankName: recipientType === 'bank' ? bankName : undefined,
          routingOrSwift: recipientType === 'bank' ? routingOrSwift : undefined,
          senderReference,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch payout');
      }

      setStatusMessage({
        type: 'success',
        text: `Funds transfer of ${data.amount} ${data.currency} pushed via ${data.gateway} to ${data.recipientName} (${data.maskedPan})`,
        details: data,
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Error executing direct funds transfer',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1">
        <TopBar title="Direct Payouts (Visa Direct & Mastercard Send)" />
        <main className="p-8 max-w-5xl">
          {/* Header */}
          <div className="flex flex-wrap justify-between items-start gap-4 mb-8">
            <div>
              <h1 className="text-xl font-bold text-slate-900 mb-1 flex items-center gap-2">
                <Send className="w-5 h-5 text-indigo-600" />
                Direct Funds Transfer &amp; Payout Hub
              </h1>
              <p className="text-xs text-slate-500">
                Push instant funds disbursements to cards using Visa Direct (OCT) and Mastercard Send, alongside Cardlink merchant acquiring
              </p>
            </div>

            {/* Architecture Badge */}
            <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Cardlink (Acquiring) + Visa Direct &amp; Mastercard Send (Payouts)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 Cols: Payout Dispatch Form */}
            <div className="lg:col-span-2 space-y-6">
              <form onSubmit={handleExecutePayout} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    Initiate Direct Push Transfer
                  </h2>
                  <span className="text-xs font-mono bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200 font-semibold">
                    Live Rail Active
                  </span>
                </div>

                {/* Network Selection */}
                <div className="mb-5">
                  <label className="block text-xs font-semibold text-slate-700 mb-2">Payout Rail / Network</label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setRecipientType('card');
                        setNetwork('VISA_DIRECT');
                      }}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        network === 'VISA_DIRECT'
                          ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-bold text-xs text-blue-900 flex items-center justify-between">
                        <span>Visa Direct</span>
                        <span className="text-[10px] font-mono bg-blue-200/60 text-blue-800 px-1.5 py-0.5 rounded">OCT</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">Push to Visa Card (Real-Time)</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setRecipientType('card');
                        setNetwork('MASTERCARD_SEND');
                      }}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        network === 'MASTERCARD_SEND'
                          ? 'border-red-600 bg-red-50/50 ring-1 ring-red-600'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-bold text-xs text-red-900 flex items-center justify-between">
                        <span>Mastercard Send</span>
                        <span className="text-[10px] font-mono bg-red-200/60 text-red-800 px-1.5 py-0.5 rounded">A2C</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">Push to Mastercard PAN</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setRecipientType('bank');
                        setNetwork('BANK_TRANSFER');
                      }}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        network === 'BANK_TRANSFER'
                          ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-bold text-xs text-emerald-900 flex items-center justify-between">
                        <span>SEPA / Bank</span>
                        <span className="text-[10px] font-mono bg-emerald-200/60 text-emerald-800 px-1.5 py-0.5 rounded">IBAN</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">Direct Bank Wire (Eurobank)</div>
                    </button>
                  </div>
                </div>

                {/* Amount & Currency */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Disbursement Amount</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-bold">€</span>
                      <input
                        type="number"
                        step="0.01"
                        min="1"
                        required
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                        placeholder="100.00"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Currency</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-600"
                    >
                      <option value="EUR">EUR (€) - Eurozone</option>
                      <option value="USD">USD ($) - US Dollar</option>
                      <option value="GBP">GBP (£) - British Pound</option>
                    </select>
                  </div>
                </div>

                {/* Recipient Details */}
                <div className="space-y-4 pt-3 border-t border-slate-100 mb-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Recipient / Beneficiary Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      className="w-full p-2.5 text-xs border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                      placeholder="e.g. Eleni Papadopoulou"
                    />
                  </div>

                  {recipientType === 'card' ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Recipient Card Number (PAN)
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            value={cardNumber}
                            onChange={(e) => handleCardNumberChange(e.target.value)}
                            className="w-full p-2.5 text-xs font-mono border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                            placeholder="4532 7512 8901 3412"
                          />
                          <span className="absolute right-3 top-2.5 text-[10px] font-bold text-slate-400">
                            {network === 'VISA_DIRECT' ? 'VISA' : 'MASTERCARD'}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Expiry (MM/YY)</label>
                        <input
                          type="text"
                          required
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="w-full p-2.5 text-xs font-mono border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                          placeholder="12/28"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">IBAN Account Number</label>
                        <input
                          type="text"
                          required
                          value={accountNumber}
                          onChange={(e) => setAccountNumber(e.target.value)}
                          className="w-full p-2.5 text-xs font-mono border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                          placeholder="GR16026000000001234567890"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Name / SWIFT</label>
                        <input
                          type="text"
                          required
                          value={`${bankName} (${routingOrSwift})`}
                          onChange={(e) => setBankName(e.target.value)}
                          className="w-full p-2.5 text-xs border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                          placeholder="Eurobank S.A. (ERBKGRAA)"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Sender Reference / Note</label>
                    <input
                      type="text"
                      value={senderReference}
                      onChange={(e) => setSenderReference(e.target.value)}
                      className="w-full p-2 text-xs border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                      placeholder="Resort Merchant Settlement"
                    />
                  </div>
                </div>

                {statusMessage && (
                  <div
                    className={`p-3.5 rounded-lg mb-4 text-xs flex items-start gap-2.5 ${
                      statusMessage.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}
                  >
                    {statusMessage.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-semibold">{statusMessage.text}</div>
                      {statusMessage.details?.networkTransactionId && (
                        <div className="font-mono text-[11px] text-slate-600 mt-1">
                          Network Trace: {statusMessage.details.networkTransactionId} | Auth Code: {statusMessage.details.approvalCode}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {loading
                      ? 'Dispatching Network Funds Transfer...'
                      : `Transfer €${amount} via ${network === 'VISA_DIRECT' ? 'Visa Direct' : network === 'MASTERCARD_SEND' ? 'Mastercard Send' : 'SEPA Transfer'}`}
                  </span>
                </button>
              </form>
            </div>

            {/* Right Col: Dual Architecture Blueprint & Recent Payouts */}
            <div className="space-y-6">
              {/* Dual Gateway Architecture */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Dual Gateway Architecture
                </h3>
                
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-800">Cardlink VPOS</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                      Inbound Acquiring
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    E-Commerce checkout, bookings, MPI 3D-Secure, and customer card authorizations.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-blue-900">Visa Direct</span>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                      Outbound OCT
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Real-time push funds transactions directly to recipient Visa debit &amp; credit cards.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-red-50/60 border border-red-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-red-900">Mastercard Send</span>
                    <span className="text-[10px] font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded">
                      Outbound A2C
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Real-time payment transfers to Mastercard cards globally with instant ledger sync.
                  </p>
                </div>
              </div>

              {/* Recent Payouts Audit Trail */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5" />
                    Live Payout Trail
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400">{recentPayouts.length} Transfers</span>
                </div>

                <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                  {recentPayouts.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400 font-mono">
                      No direct payouts executed yet.
                    </div>
                  ) : (
                    recentPayouts.map((p) => (
                      <div key={p.id} className="py-2.5 flex items-start justify-between gap-2 text-xs">
                        <div>
                          <div className="font-semibold text-slate-900 flex items-center gap-1">
                            <span>{p.recipientName || 'Beneficiary'}</span>
                            <span className="text-[10px] font-mono text-slate-400">••••{p.maskedPan}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {p.gateway} • {p.date ? new Date(p.date).toLocaleTimeString() : ''}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-bold text-indigo-700">
                            -€{typeof p.amount === 'number' ? p.amount.toFixed(2) : p.amount}
                          </div>
                          <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1 rounded">
                            {p.status || 'Completed'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
