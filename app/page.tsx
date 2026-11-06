'use client';

import Sidebar from '../components/dashboard/Sidebar';
import TopBar from '../components/dashboard/TopBar';
import { StatCard, TransactionTable } from '../components/dashboard/StatCards';
import { ClearTransactionLogsButton } from '../components/dashboard/ClearTransactionLogsButton';
import AuthGuard from '../components/dashboard/AuthGuard';

export default function DashboardPage() {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1">
          <TopBar title="Overview" />
          <main className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <StatCard label="Total Revenue" value="$2,450.00" />
              <StatCard label="Pending Orders" value="12" />
              <StatCard label="Completed Orders" value="85" />
            </div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Recent Transactions</h2>
              <ClearTransactionLogsButton />
            </div>
            <TransactionTable />
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
