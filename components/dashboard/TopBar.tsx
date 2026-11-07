'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { LogOut, User as UserIcon, Lock } from 'lucide-react';
import { AdminModal } from './AdminModal';

export default function TopBar({ title }: { title: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/login');
  };

  return (
    <>
      <header className="flex items-center justify-between px-8 py-4 border-b border-slate-200 bg-white">
        <div className="text-sm font-medium text-slate-500">Dashboard / {title}</div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAdminOpen(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors py-1.5 px-3 rounded-lg border border-slate-200 shadow-xs cursor-pointer"
            title="Admin Panel (Password Protected)"
          >
            <Lock className="w-3.5 h-3.5 text-slate-600" />
            <span>Admin Panel</span>
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-slate-700 text-xs font-medium">
            <UserIcon className="w-3.5 h-3.5 text-slate-500" />
            <span>{user?.email || 'frictionless369@gmail.com'}</span>
          </div>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-red-600 transition-colors py-1.5 px-2.5 rounded-md hover:bg-red-50 cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      <AdminModal isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />
    </>
  );
}

