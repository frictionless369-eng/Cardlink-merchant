'use client';

import { useState } from 'react';
import { Lock, Unlock, ShieldAlert, Key, CheckCircle2, X, Terminal, Database, Server } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function AdminModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'webhooks' | 'database'>('overview');

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'Siemreap2026') {
      setIsAuthenticated(true);
      setError(null);
    } else {
      setError('Invalid Admin Password. Access Denied.');
    }
  };

  const handleClose = () => {
    setPassword('');
    setIsAuthenticated(false);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl text-slate-100 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-lg ${isAuthenticated ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                {isAuthenticated ? <Unlock size={18} /> : <Lock size={18} />}
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-wide">SECURE ADMIN PANEL</h3>
                <p className="text-[11px] text-slate-400">
                  {isAuthenticated ? 'Authenticated Admin Session' : 'Protected Gateway Controls'}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          {!isAuthenticated ? (
            <form onSubmit={handleUnlock} className="p-6 space-y-4">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs flex items-center gap-2.5">
                <ShieldAlert size={16} className="shrink-0" />
                <span>Enter the administrative security password to access merchant controls.</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Admin Master Password
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password..."
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {error && (
                <div className="text-xs text-red-400 font-medium">{error}</div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <Unlock size={14} />
                  <span>Unlock Admin Panel</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="p-6 space-y-6">
              {/* Unlocked Tabs */}
              <div className="flex border-b border-slate-800 gap-4 text-xs font-semibold">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`pb-2 transition-colors flex items-center gap-1.5 ${
                    activeTab === 'overview'
                      ? 'border-b-2 border-emerald-400 text-emerald-400'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Server size={14} /> System Config
                </button>
                <button
                  onClick={() => setActiveTab('webhooks')}
                  className={`pb-2 transition-colors flex items-center gap-1.5 ${
                    activeTab === 'webhooks'
                      ? 'border-b-2 border-emerald-400 text-emerald-400'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Terminal size={14} /> Webhooks &amp; Gateway
                </button>
                <button
                  onClick={() => setActiveTab('database')}
                  className={`pb-2 transition-colors flex items-center gap-1.5 ${
                    activeTab === 'database'
                      ? 'border-b-2 border-emerald-400 text-emerald-400'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Database size={14} /> Database Ledger
                </button>
              </div>

              {/* Tab Contents */}
              {activeTab === 'overview' && (
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Cardlink MID</span>
                      <span className="font-mono text-emerald-400 font-bold">9000012429</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Shared Secret</span>
                      <span className="font-mono text-slate-300">Cardlink1 (SHA-256 Base64)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">MPI Endpoint</span>
                      <span className="font-mono text-cyan-300 text-[10px]">https://eurocommerce-test.cardlink.gr/vpos/shophandlermpi</span>
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-xl text-emerald-300 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-400" />
                      <span>Authorized Domain Configured</span>
                    </div>
                    <span className="font-mono text-[10px] bg-emerald-900/60 px-2 py-0.5 rounded">
                      cardlink-merchant.vercel.app
                    </span>
                  </div>
                </div>
              )}

              {activeTab === 'webhooks' && (
                <div className="space-y-3 text-xs font-mono">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <div className="text-slate-400">Payment Advice Webhook</div>
                    <div className="text-emerald-400 break-all text-[11px]">
                      https://cardlink-merchant.vercel.app/api/webhooks/cardlink/payment-advice
                    </div>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <div className="text-slate-400">Capture Advice Webhook</div>
                    <div className="text-cyan-400 break-all text-[11px]">
                      https://cardlink-merchant.vercel.app/api/webhooks/cardlink/capture-advice
                    </div>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <div className="text-slate-400">Cancel Advice Webhook</div>
                    <div className="text-amber-400 break-all text-[11px]">
                      https://cardlink-merchant.vercel.app/api/webhooks/cardlink/cancel-advice
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'database' && (
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Firestore Project ID</span>
                      <span className="font-mono text-slate-200">gen-lang-client-0864652260</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Security Rules</span>
                      <span className="font-bold text-emerald-400">DEPLOYED &amp; ACTIVE</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                <span className="text-[11px] text-slate-500 font-mono">Status: AUTHENTICATED</span>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-colors"
                >
                  Close Admin Panel
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
