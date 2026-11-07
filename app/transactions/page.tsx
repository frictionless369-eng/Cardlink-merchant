'use client';

import Sidebar from '@/components/dashboard/Sidebar';
import TopBar from '@/components/dashboard/TopBar';
import { TransactionTable } from '@/components/dashboard/StatCards';
import { ClearTransactionLogsButton } from '@/components/dashboard/ClearTransactionLogsButton';
import AuthGuard from '@/components/dashboard/AuthGuard';

export default function TransactionsPage() {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1">
          <TopBar title="Transactions" />
          <main className="p-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-xl font-bold text-slate-900">Transaction History</h1>
                <p className="text-xs text-slate-500">Live payment audit trail from ABA PayWay gateway</p>
              </div>
              <ClearTransactionLogsButton />
            </div>
            <TransactionTable />
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
