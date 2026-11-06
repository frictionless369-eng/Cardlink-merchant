'use client';

import Sidebar from '@/components/dashboard/Sidebar';
import TopBar from '@/components/dashboard/TopBar';
import AuthGuard from '@/components/dashboard/AuthGuard';
import { Key, Shield, Webhook, CreditCard } from 'lucide-react';

export default function SettingsPage() {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1">
          <TopBar title="Settings" />
          <main className="p-8 max-w-4xl">
            <h1 className="text-xl font-bold text-slate-900 mb-2">Merchant Settings & API Credentials</h1>
            <p className="text-xs text-slate-500 mb-8">Managed securely server-side via environment variables</p>

            <div className="space-y-6">
              {/* Cardlink Config */}
              <div className="bg-white border border-slate-200 rounded-lg p-6">
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
              <div className="bg-white border border-slate-200 rounded-lg p-6">
                <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900 mb-4">
                  <Webhook className="w-5 h-5 text-slate-700" />
                  Registered Webhook Event Endpoints
                </h2>
                <div className="space-y-3 text-xs font-mono">
                  <div className="p-3 bg-slate-50 rounded border border-slate-100 space-y-1">
                    <div className="font-semibold text-slate-700">Payment Webhook</div>
                    <div className="text-slate-600 break-all">https://ais-dev-fpwzezjzrwpku6blc74ooe-501042649401.asia-east1.run.app/api/webhooks/cardlink/payment</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded border border-slate-100 space-y-1">
                    <div className="font-semibold text-slate-700">Capture Webhook</div>
                    <div className="text-slate-600 break-all">https://ais-dev-fpwzezjzrwpku6blc74ooe-501042649401.asia-east1.run.app/api/webhooks/cardlink/capture</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded border border-slate-100 space-y-1">
                    <div className="font-semibold text-slate-700">Cancel Webhook</div>
                    <div className="text-slate-600 break-all">https://ais-dev-fpwzezjzrwpku6blc74ooe-501042649401.asia-east1.run.app/api/webhooks/cardlink/cancel</div>
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
