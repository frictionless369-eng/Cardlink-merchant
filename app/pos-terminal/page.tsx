'use client';

import Sidebar from '@/components/dashboard/Sidebar';
import TopBar from '@/components/dashboard/TopBar';
import AuthGuard from '@/components/dashboard/AuthGuard';
import { OldschoolKeypad } from '@/components/dashboard/OldschoolKeypad';

export default function PosTerminalPage() {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1">
          <TopBar title="POS Terminal (Manual PAN)" />
          <main className="p-8">
            <div className="max-w-2xl mx-auto mb-6 text-center">
              <h1 className="text-2xl font-bold text-slate-900">Virtual POS Terminal</h1>
              <p className="text-xs text-slate-500 mt-1">
                Tactile keypad for manual Primary Account Number (PAN) entry and MOTO transactions
              </p>
            </div>
            <OldschoolKeypad />
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
