'use client';

import Sidebar from '../components/dashboard/Sidebar';
import TopBar from '../components/dashboard/TopBar';
import { DashboardMetrics, TransactionTable } from '../components/dashboard/StatCards';
import { ClearTransactionLogsButton } from '../components/dashboard/ClearTransactionLogsButton';

export default function DashboardPage() {
  return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1">
          <TopBar title="Overview" />
          <main className="p-8">
            {/* Live Real-time Dynamic Metrics */}
            <DashboardMetrics />

            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Recent Transactions</h2>
              <ClearTransactionLogsButton />
            </div>
            <TransactionTable />
          </main>
        </div>
      </div>
  );
}
