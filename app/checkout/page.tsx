'use client';

import Sidebar from '../../components/dashboard/Sidebar';
import TopBar from '../../components/dashboard/TopBar';
import CheckoutForm from '../../components/CheckoutForm';

export default function CheckoutPage() {
  return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1">
          <TopBar title="Checkout Preview" />
          <main className="p-8">
            <CheckoutForm />
          </main>
        </div>
      </div>
  );
}
