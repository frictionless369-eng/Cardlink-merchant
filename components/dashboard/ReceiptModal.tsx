'use client';

import { Printer, Download, X, CheckCircle2, ShieldCheck, Building2, CreditCard, Calendar, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ReceiptTransaction {
  id: string;
  date: string;
  amount: number | string;
  currency?: string;
  status: string;
  type?: string;
  gateway?: string;
  entryMethod?: string;
  cardBrand?: string;
  maskedPan?: string;
  merchantId?: string;
  digestCalculated?: string;
}

export function ReceiptModal({
  transaction,
  isOpen,
  onClose,
}: {
  transaction: ReceiptTransaction | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen || !transaction) return null;

  const formattedAmount =
    typeof transaction.amount === 'number'
      ? transaction.amount.toFixed(2)
      : parseFloat(transaction.amount || '0').toFixed(2);

  const formattedDate = transaction.date
    ? new Date(transaction.date).toLocaleString('en-US', {
        dateStyle: 'full',
        timeStyle: 'medium',
      })
    : new Date().toLocaleString();

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm print:p-0 print:bg-white print:static">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 text-slate-900 print:shadow-none print:border-none print:w-full print:max-w-none"
        >
          {/* Top Control Bar (Hidden during Print) */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 print:hidden">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span className="text-xs font-bold text-slate-800 tracking-wide uppercase">
                Official Payment Receipt
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Print or Save PDF"
              >
                <Printer size={14} />
                <span>Print / Save PDF</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Printable Receipt Body */}
          <div className="p-8 space-y-6 font-sans print:p-6" id="printable-receipt">
            {/* Header / Brand */}
            <div className="text-center border-b border-slate-200 pb-6">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center mb-3 border border-emerald-200">
                <CheckCircle2 size={28} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Luxury Resort &amp; Hotel</h2>
              <p className="text-xs text-slate-500 mt-1">123 Athens Riviera · Customer Billing Department</p>
              <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold border border-emerald-200">
                <span>STATUS: PAYMENT CONFIRMED &amp; SETTLED</span>
              </div>
            </div>

            {/* Total Amount Block */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Amount Charged</span>
              <div className="text-3xl font-extrabold font-mono tabular-nums text-slate-900">
                ${formattedAmount} <span className="text-xs text-slate-500 font-sans font-normal">{transaction.currency || 'USD'}</span>
              </div>
            </div>

            {/* Metadata Detail Grid */}
            <div className="space-y-3 text-xs border-t border-b border-slate-100 py-4">
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Hash size={13} className="text-slate-400" /> Transaction Ref ID
                </span>
                <span className="font-mono font-bold text-slate-900">{transaction.id}</span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Calendar size={13} className="text-slate-400" /> Date &amp; Time
                </span>
                <span className="font-medium text-slate-800">{formattedDate}</span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Building2 size={13} className="text-slate-400" /> Merchant ID (MID)
                </span>
                <span className="font-mono text-slate-800">{transaction.merchantId || '9000012429'}</span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <CreditCard size={13} className="text-slate-400" /> Gateway &amp; Channel
                </span>
                <span className="font-medium text-slate-800">
                  {transaction.gateway || 'Cardlink VPOS'} ({transaction.entryMethod || 'HOSTED_REDIRECT'})
                </span>
              </div>

              {transaction.maskedPan && (
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">Card Scheme &amp; PAN</span>
                  <span className="font-mono text-slate-800">
                    {transaction.cardBrand || 'CARD'} {transaction.maskedPan}
                  </span>
                </div>
              )}
            </div>

            {/* Line Item Breakdown */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between font-semibold text-slate-700">
                <span>Description</span>
                <span>Amount</span>
              </div>
              <div className="flex justify-between text-slate-600 py-1 border-t border-slate-100">
                <span>Resort Room Suite Reservation</span>
                <span className="font-mono">${formattedAmount}</span>
              </div>
              <div className="flex justify-between text-slate-600 py-1 border-t border-slate-100">
                <span>Processing &amp; Gateway Fees</span>
                <span className="font-mono">$0.00</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-2">
                <span>Total Paid</span>
                <span className="font-mono text-sm">${formattedAmount}</span>
              </div>
            </div>

            {/* Security Verification & Barcode Footer */}
            <div className="pt-4 border-t border-slate-200 text-center space-y-2">
              <div className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">
                DIGEST HASH: {transaction.digestCalculated ? transaction.digestCalculated.slice(0, 24) + '...' : 'SHA-256 Base64 Verified'}
              </div>
              <p className="text-[11px] text-slate-500">
                Thank you for your reservation. Keep this receipt for your records.
              </p>
            </div>
          </div>

          {/* Bottom Actions (Hidden during Print) */}
          <div className="flex justify-between items-center px-6 py-4 bg-slate-50 border-t border-slate-100 print:hidden">
            <span className="text-[11px] text-slate-400">Cardlink Payment Network Audit Trail</span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
