'use client';

import Sidebar from '@/components/dashboard/Sidebar';
import TopBar from '@/components/dashboard/TopBar';
import AuthGuard from '@/components/dashboard/AuthGuard';
import { Shield, Webhook, CreditCard, Database, ExternalLink, Globe } from 'lucide-react';

export default function SettingsPage() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cardlink-merchant.vercel.app';

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1">
          <TopBar title="Settings" />
          <main className="p-8 max-w-4xl">
            <h1 className="text-xl font-bold text-slate-900 mb-2">Merchant Settings & API Credentials</h1>
            <p className="text-xs text-slate-500 mb-8">Managed securely server-side via environment variables & Firebase</p>

            <div className="space-y-6">
              {/* Firebase Database & Authorized Domain */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900 mb-4">
                  <Database className="w-5 h-5 text-slate-700" />
                  Firestore & Auth Domain Configuration
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
