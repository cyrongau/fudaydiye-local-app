
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Providers';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Transaction } from '../types';

const RiderWallet: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Sync real transactions for the rider
    const q = query(
      collection(db, "transactions"),
      where("userId", "==", user.uid),
      limit(20)
    );

    const unsub = onSnapshot(q, (snap) => {
      const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction));
      fetched.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setTransactions(fetched);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  const balance = profile?.walletBalance || 0;

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-300 font-display">
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-surface-dark/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-6 py-6 flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-2xl font-black text-secondary dark:text-white tracking-tighter uppercase">Earnings Hub</h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">Direct Earning Ledger</p>
        </div>
      </header>

      <main className="p-6 flex-1 flex flex-col gap-6 overflow-y-auto pb-32 no-scrollbar animate-in fade-in duration-500">
        <section className="bg-secondary text-white p-10 rounded-[48px] shadow-2xl relative overflow-hidden group border border-white/5">
          <div className="absolute top-0 right-0 size-48 bg-primary/20 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10">
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4">Total Liquid Funds</p>
            <h2 className="text-6xl font-black tracking-tighter leading-none mb-10">${balance.toFixed(2)}</h2>
            <button className="w-full h-14 bg-primary text-secondary font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-primary-glow active:scale-95 transition-all">
              Initiate Settlement
            </button>
          </div>
        </section>

        <div className="flex flex-col gap-4">
          <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] ml-2">Recent Job Payouts</h3>
          {loading ? (
            <div className="py-20 flex justify-center"><div className="size-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div></div>
          ) : transactions.length === 0 ? (
            <div className="bg-white dark:bg-surface-dark p-16 rounded-[40px] border border-gray-100 dark:border-white/5 text-center opacity-30">
              <span className="material-symbols-outlined text-5xl mb-4">payments</span>
              <p className="text-xs font-black uppercase tracking-widest">No earnings nodes detected</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {transactions.map(tx => (
                <div key={tx.id} className="bg-white dark:bg-surface-dark p-5 rounded-[28px] border border-gray-100 dark:border-white/5 shadow-soft flex items-center justify-between group hover:border-primary/20 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="size-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                      <span className="material-symbols-outlined text-[20px]">bolt</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-secondary dark:text-white uppercase leading-none mb-1">{tx.description}</h4>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{tx.createdAt?.toDate().toLocaleDateString()} • {tx.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-black text-primary">+${tx.amount.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <section className="bg-primary/5 rounded-[32px] p-6 border border-primary/20 flex gap-4 mt-4">
          <span className="material-symbols-outlined text-primary text-3xl">auto_awesome</span>
          <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 leading-relaxed uppercase tracking-widest">
            Job earnings are released automatically upon verified handovers. Payouts to mobile wallets are processed 3 times daily.
          </p>
        </section>
      </main>


    </div >
  );
};

export default RiderWallet;
