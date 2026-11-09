'use client';

import Sidebar from '../../components/dashboard/Sidebar';
import TopBar from '../../components/dashboard/TopBar';
import { LogConsole } from '../../components/dashboard/LogConsole';
import AuthGuard from '../../components/dashboard/AuthGuard';

export default function WebhookLogsPage() {
  return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1">
          <TopBar title="Webhook Logs" />
          <main className="p-8">
            <LogConsole />
          </main>
        </div>
      </div>
  );
}
