'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import TopBar from '@/components/dashboard/TopBar';
import AuthGuard from '@/components/dashboard/AuthGuard';
import { Shield, Webhook, CreditCard, Database, ExternalLink, Globe, CheckCircle2, Save } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export default function SettingsPage() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cardlink-merchant.vercel.app';

  const [webhookConfig, setWebhookConfig] = useState({
    httpMethod: 'POST',
    contentType: 'application/json',
    verifyDigest: true,
    retryOnFailure: true,
    maxRetries: 3,
    timeoutSeconds: 10,
    enablePaymentAdvice: true,
    enableCaptureAdvice: true,
    enableCancelAdvice: true,
  });
  const [saving, setSaving] = useState(false);
  const [savedBanner, setSavedBanner] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) return;
      try {
        const snap = await getDoc(doc(db, 'merchants', user.uid));
        if (snap.exists() && snap.data().webhookConfig) {
          setWebhookConfig((prev) => ({ ...prev, ...snap.data().webhookConfig }));
        }
      } catch (err) {
        console.error('Failed to load webhook config:', err);
      }
    });
    return () => unsub();
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedBanner(false);
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        await setDoc(
          doc(db, 'merchants', user.uid),
          {
            id: user.uid,
            cardlinkMerchantId: '9000012429',
            webhookConfig,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      }
      setSavedBanner(true);
      setTimeout(() => setSavedBanner(false), 3000);
    } catch (err) {
      console.error('Failed to save webhook config:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1">
          <TopBar title="Settings" />
          <main className="p-8 max-w-4xl">
            <h1 className="text-xl font-bold text-slate-900 mb-2">Merchant Settings &amp; Cardlink Webhook Configuration</h1>
            <p className="text-xs text-slate-500 mb-8">
              Configure Cardlink webhook delivery, digest verification, and endpoint specifications
            </p>

            <div className="space-y-6">
              {/* Cardlink Webhook Configuration Options */}
              <form onSubmit={handleSaveConfig} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                    <Webhook className="w-5 h-5 text-slate-700" />
                    Cardlink Webhook Specifications &amp; Delivery Options
                  </h2>
                  {savedBanner && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Saved to Firestore
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">HTTP Callback Method</label>
                    <select
                      value={webhookConfig.httpMethod}
                      onChange={(e) => setWebhookConfig({ ...webhookConfig, httpMethod: e.target.value })}
                      className="w-full p-2 text-xs font-mono border border-slate-300 rounded-lg bg-white text-slate-900"
                    >
                      <option value="POST">POST (Cardlink Standard)</option>
                      <option value="GET">GET (Query String)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Payload Content-Type</label>
                    <select
                      value={webhookConfig.contentType}
                      onChange={(e) => setWebhookConfig({ ...webhookConfig, contentType: e.target.value })}
                      className="w-full p-2 text-xs font-mono border border-slate-300 rounded-lg bg-white text-slate-900"
                    >
                      <option value="application/json">application/json</option>
                      <option value="application/x-www-form-urlencoded">application/x-www-form-urlencoded</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Max Retry Attempts</label>
                    <input
                      type="number"
                      min={0}
                      max={10}
                      value={webhookConfig.maxRetries}
                      onChange={(e) => setWebhookConfig({ ...webhookConfig, maxRetries: parseInt(e.target.value || '0', 10) })}
                      className="w-full p-2 text-xs font-mono border border-slate-300 rounded-lg bg-white text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Callback Timeout (Seconds)</label>
                    <input
                      type="number"
                      min={3}
                      max={30}
                      value={webhookConfig.timeoutSeconds}
                      onChange={(e) => setWebhookConfig({ ...webhookConfig, timeoutSeconds: parseInt(e.target.value || '10', 10) })}
                      className="w-full p-2 text-xs font-mono border border-slate-300 rounded-lg bg-white text-slate-900"
                    />
                  </div>
                </div>

                <div className="space-y-2.5 border-t border-slate-100 pt-4 mb-5 text-xs">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="font-medium text-slate-700">Enforce HMAC-SHA256 Digest Verification</span>
                    <input
                      type="checkbox"
                      checked={webhookConfig.verifyDigest}
                      onChange={(e) => setWebhookConfig({ ...webhookConfig, verifyDigest: e.target.checked })}
                      className="rounded border-slate-300 text-slate-900"
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="font-medium text-slate-700">Enable Background Payment Advice Webhook</span>
                    <input
                      type="checkbox"
                      checked={webhookConfig.enablePaymentAdvice}
                      onChange={(e) => setWebhookConfig({ ...webhookConfig, enablePaymentAdvice: e.target.checked })}
                      className="rounded border-slate-300 text-slate-900"
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="font-medium text-slate-700">Enable Background Capture Advice Webhook</span>
                    <input
                      type="checkbox"
                      checked={webhookConfig.enableCaptureAdvice}
                      onChange={(e) => setWebhookConfig({ ...webhookConfig, enableCaptureAdvice: e.target.checked })}
                      className="rounded border-slate-300 text-slate-900"
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="font-medium text-slate-700">Enable Background Cancel Advice Webhook</span>
                    <input
                      type="checkbox"
                      checked={webhookConfig.enableCancelAdvice}
                      onChange={(e) => setWebhookConfig({ ...webhookConfig, enableCancelAdvice: e.target.checked })}
                      className="rounded border-slate-300 text-slate-900"
                    />
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'Saving...' : 'Save Webhook Configuration'}</span>
                </button>
              </form>

              {/* Firebase Database & Authorized Domain */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900 mb-4">
                  <Database className="w-5 h-5 text-slate-700" />
                  Firestore &amp; Auth Domain Configuration
                </h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500">Firestore Project ID</span>
                    <span className="font-mono text-xs font-semibold text-slate-900">gen-lang-client-0864652260</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500">Database Instance</span>
                    <span className="font-mono text-xs text-slate-800">ai-studio-onepagecheckouta-f5488437...</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500">Configured Authorized Domain</span>
                    <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5" /> cardlink-merchant.vercel.app
                    </span>
                  </div>
                  <div className="pt-2">
                    <a
                      href="https://console.firebase.google.com/project/gen-lang-client-0864652260/authentication/settings"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-900 hover:text-slate-700 underline"
                    >
                      Open Firebase Console Authorized Domains <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Cardlink Config */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900 mb-4">
                  <CreditCard className="w-5 h-5 text-slate-700" />
                  Cardlink Gateway Configuration
                </h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500">Merchant ID</span>
                    <span className="font-mono font-medium text-slate-900">9000012429</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500">Primary Endpoint (MPI)</span>
                    <span className="font-mono text-xs text-slate-800">https://eurocommerce-test.cardlink.gr/vpos/shophandlermpi</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500">Secondary Endpoint (XML API)</span>
                    <span className="font-mono text-xs text-slate-800">https://eurocommerce-test.cardlink.gr/vpos/xmlpayvpos</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-500">Shared Secret Status</span>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700">
                      <Shield className="w-3.5 h-3.5" /> Encrypted in Environment
                    </span>
                  </div>
                </div>
              </div>

              {/* Webhook URLs Reference */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900 mb-4">
                  <Webhook className="w-5 h-5 text-slate-700" />
                  Registered Webhook Event Endpoints
                </h2>
                <div className="space-y-3 text-xs font-mono">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                    <div className="font-semibold text-slate-700">Payment Webhook</div>
                    <div className="text-slate-600 break-all">{baseUrl}/api/webhooks/cardlink/payment</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                    <div className="font-semibold text-slate-700">Capture Webhook</div>
                    <div className="text-slate-600 break-all">{baseUrl}/api/webhooks/cardlink/capture</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                    <div className="font-semibold text-slate-700">Cancel Webhook</div>
                    <div className="text-slate-600 break-all">{baseUrl}/api/webhooks/cardlink/cancel</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                    <div className="font-semibold text-slate-700">Payment Advice Webhook</div>
                    <div className="text-slate-600 break-all">{baseUrl}/api/webhooks/cardlink/payment-advice</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                    <div className="font-semibold text-slate-700">Capture Advice Webhook</div>
                    <div className="text-slate-600 break-all">{baseUrl}/api/webhooks/cardlink/capture-advice</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                    <div className="font-semibold text-slate-700">Cancel Advice Webhook</div>
                    <div className="text-slate-600 break-all">{baseUrl}/api/webhooks/cardlink/cancel-advice</div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
