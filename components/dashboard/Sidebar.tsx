'use client';

import { LayoutDashboard, ReceiptText, Settings, CreditCard, Calculator } from 'lucide-react';
import Link from 'next/link';

export default function Sidebar() {
  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/' },
    { name: 'Direct Payouts', icon: CreditCard, href: '/payouts' },
    { name: 'POS Keypad (PAN)', icon: Calculator, href: '/pos-terminal' },
    { name: 'Transactions', icon: ReceiptText, href: '/transactions' },
    { name: 'Webhook Logs', icon: Settings, href: '/webhook-logs' },
    { name: 'Checkout Preview', icon: CreditCard, href: '/checkout' },
    { name: 'Settings', icon: Settings, href: '/settings' },
  ];

  return (
    <aside className="w-64 border-r border-slate-200 h-screen p-6 bg-slate-50">
      <h1 className="text-xl font-bold mb-8 text-slate-900">Merchant Portal</h1>
      <nav className="space-y-4">
        {menuItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="flex items-center gap-3 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            <item.icon size={20} />
            {item.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
