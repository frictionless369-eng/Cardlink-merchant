'use client';

import Sidebar from '../../components/dashboard/Sidebar';
import TopBar from '../../components/dashboard/TopBar';
import CheckoutForm from '../../components/CheckoutForm';
import AuthGuard from '../../components/dashboard/AuthGuard';

export default function CheckoutPage() {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1">
          <TopBar title="Checkout Preview" />
          <main className="p-8">
            <CheckoutForm />
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
