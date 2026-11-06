'use client';

import { db } from '../../lib/firebase';
import { collection, deleteDoc, getDocs } from 'firebase/firestore';

export function ClearTransactionLogsButton() {
  const clearLogs = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'transactions'));
      const deletePromises = snapshot.docs.map((docItem) => deleteDoc(docItem.ref));
      await Promise.all(deletePromises);
      window.location.reload();
    } catch (err) {
      console.error("Failed to clear transaction logs:", err);
    }
  };

  return (
    <button 
      onClick={clearLogs} 
      className="text-xs text-red-600 hover:text-red-800 font-medium border border-red-200 hover:bg-red-50 px-2.5 py-1 rounded transition-colors"
    >
      Clear Logs
    </button>
  );
}
