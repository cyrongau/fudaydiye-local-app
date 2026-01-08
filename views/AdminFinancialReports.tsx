import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// Added addDoc to the imports from firebase/firestore
import { collection, query, orderBy, getDocs, doc, updateDoc, increment, runTransaction, serverTimestamp, addDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PayoutRequest, Transaction } from '../types';

const AdminFinancialReports: React.FC = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('MONTHLY');
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'PAYOUTS' | 'LEDGER' | 'RATES'>('PAYOUTS');
  const [exchangeRate, setExchangeRate] = useState<number>(8500);
  const [rateLoading, setRateLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Sync Payout Queue
      const qPay = query(collection(db, "payouts"), orderBy("createdAt", "desc"));
      const snapPay = await getDocs(qPay);
      setPayouts(snapPay.docs.map(d => ({ id: d.id, ...d.data() } as PayoutRequest)));

      // Sync Global Ledger
      const qTx = query(collection(db, "transactions"), orderBy("createdAt", "desc"));
      const snapTx = await getDocs(qTx);
      setTransactions(snapTx.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)));

      // Sync Exchange Rate
      const snapRate = await getDocs(query(collection(db, "settings")));
      const rateDoc = snapRate.docs.find(d => d.id === 'exchange_rates');
      if (rateDoc && rateDoc.exists()) {
        setExchangeRate(rateDoc.data().rate || 8500);
      }
    } catch (err) {
      console.error("Financial Reports Data Load Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateRate = async () => {
    setRateLoading(true);
    try {
      await setDoc(doc(db, "settings", "exchange_rates"), {
        rate: Number(exchangeRate),
        updatedAt: serverTimestamp(),
        updatedBy: 'ADMIN' // In real app, put actual admin ID here
      }, { merge: true });
      alert("Exchange Rate Updated Successfully.");
    } catch (err) {
      console.error("Error updating rate:", err);
      alert("Failed to update exchange rate.");
    } finally {
      setRateLoading(false);
    }
  };

  const authorizePayout = async (payout: PayoutRequest) => {
    if (!window.confirm(`Authorize settlement of $${payout.amount} to ${payout.vendorName}?`)) return;

    try {
      await runTransaction(db, async (transaction) => {
        const vendorRef = doc(db, "users", payout.vendorId);
        const payoutRef = doc(db, "payouts", payout.id);
        const ledgerRef = doc(collection(db, "transactions"));

        // 1. Update payout status
        transaction.update(payoutRef, {
          status: 'SETTLED',
          authorizedAt: serverTimestamp()
        });

        // 2. Deduct from liquid wallet
        transaction.update(vendorRef, {
          walletBalance: increment(-payout.amount)
        });

        // 3. Record Payout Transaction
        transaction.set(ledgerRef, {
          userId: payout.vendorId,
          type: 'PAYOUT',
          amount: payout.amount,
          status: 'COMPLETED',
          referenceId: payout.id,
          description: `Authorized Payout to ${payout.method}`,
          createdAt: serverTimestamp()
        });
      });

      // Notify Vendor
      // Fix: addDoc is now correctly imported
      await addDoc(collection(db, "notifications"), {
        userId: payout.vendorId,
        title: "Payout Authorized",
        message: `System node has authorized your $${payout.amount} withdrawal. Funds arriving via ${payout.method}.`,
        type: 'FINANCE',
        isRead: false,
        createdAt: serverTimestamp()
      });

      alert("Node Settlement Successful.");
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Treasury Sync Failure.");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-300 font-display">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/5 active:scale-90 transition-all">
          <span className="material-symbols-outlined text-secondary dark:text-white">arrow_back</span>
        </button>
        <div className="flex flex-col">
          <h1 className="text-xl font-black text-secondary dark:text-primary tracking-tighter leading-none uppercase">Admin Treasury</h1>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">Platform Liquidity Command</p>
        </div>
      </header>

      <main className="p-6 flex-1 flex flex-col gap-8 overflow-y-auto pb-32 no-scrollbar animate-in fade-in duration-500">
        <section className="bg-secondary text-white rounded-[40px] p-8 shadow-2xl relative overflow-hidden group border border-white/5">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/20 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/30 transition-colors duration-700"></div>
          <div className="relative z-10 flex flex-col gap-1">
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-3">Managed Platform GMV</span>
            <h2 className="text-6xl font-black tracking-tighter leading-none">$0<span className="text-primary text-2xl font-bold">.00</span></h2>
            <div className="mt-8 flex items-center gap-3">
              <div className="flex-1 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                <p className="text-[8px] font-black uppercase text-primary mb-1">Escrow Queue</p>
                <p className="text-lg font-black">${payouts.filter(p => p.status === 'PENDING').reduce((sum, p) => sum + p.amount, 0).toFixed(2)}</p>
              </div>
              <button className="size-14 bg-primary text-secondary rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all">
                <span className="material-symbols-outlined font-black">analytics</span>
              </button>
            </div>
          </div>
        </section>

        <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-2xl border border-gray-200 dark:border-white/10">
          <button onClick={() => setActiveTab('PAYOUTS')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'PAYOUTS' ? 'bg-white dark:bg-surface-dark text-secondary dark:text-primary shadow-sm' : 'text-gray-400'}`}>Payout Queue</button>
          <button onClick={() => setActiveTab('LEDGER')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'LEDGER' ? 'bg-white dark:bg-surface-dark text-secondary dark:text-primary shadow-sm' : 'text-gray-400'}`}>Platform Ledger</button>
          <button onClick={() => setActiveTab('RATES')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'RATES' ? 'bg-white dark:bg-surface-dark text-secondary dark:text-primary shadow-sm' : 'text-gray-400'}`}>Exchange Rates</button>
        </div>

        {activeTab === 'PAYOUTS' ? (
          <div className="flex flex-col gap-4">
            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Awaiting Authorization</h3>
            {loading ? (
              <div className="py-20 flex justify-center"><div className="size-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div></div>
            ) : payouts.length === 0 ? (
              <div className="py-20 text-center opacity-30">
                <span className="material-symbols-outlined text-5xl block mb-4">account_balance</span>
                <p className="text-xs font-black uppercase">No pending withdrawals</p>
              </div>
            ) : (
              payouts.map(p => (
                <div key={p.id} className="bg-white dark:bg-surface-dark p-6 rounded-[32px] border border-gray-100 dark:border-white/5 shadow-soft group hover:border-primary/20 transition-all flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <div className="size-12 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-secondary dark:text-primary">
                        <span className="material-symbols-outlined text-3xl">store</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-secondary dark:text-white uppercase">{p.vendorName}</h4>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{p.method}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-primary tracking-tighter">${p.amount.toFixed(2)}</p>
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter ${p.status === 'PENDING' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-700'}`}>
                        {p.status}
                      </span>
                    </div>
                  </div>
                  {p.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => authorizePayout(p)}
                        className="flex-1 h-11 bg-secondary text-primary rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                      >Authorize Release</button>
                      <button className="h-11 px-4 bg-gray-50 dark:bg-white/5 rounded-xl text-red-500 border border-red-50 dark:border-red-900/10"><span className="material-symbols-outlined">block</span></button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        ) : activeTab === 'RATES' ? (
          <div className="flex flex-col gap-6">
            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Currency Configuration</h3>

            <div className="bg-white dark:bg-surface-dark p-8 rounded-[40px] border border-gray-100 dark:border-white/5 shadow-soft max-w-2xl">

              <div className="flex items-start gap-6 mb-8">
                <div className="size-16 rounded-2xl bg-green-50 dark:bg-green-900/20 text-green-600 flex items-center justify-center border border-green-100 dark:border-green-800">
                  <span className="material-symbols-outlined text-4xl">currency_exchange</span>
                </div>
                <div>
                  <h4 className="text-lg font-black text-secondary dark:text-white uppercase leading-none mb-2">USD to SLSH Rate</h4>
                  <p className="text-xs text-gray-500 max-w-md leading-relaxed">
                    Define the daily exchange rate for Mobile Money transactions under $100. This rate is used to convert cart totals for local Somaliland payment providers.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Current Rate (1 USD = ? SLSH)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={exchangeRate}
                      onChange={(e) => setExchangeRate(Number(e.target.value))}
                      className="w-full h-16 pl-6 pr-12 bg-gray-50 dark:bg-white/5 border-2 border-gray-200 dark:border-white/10 rounded-2xl text-2xl font-black text-secondary dark:text-white focus:border-green-500 transition-all"
                    />
                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">SLSH</span>
                  </div>
                </div>

                <button
                  onClick={handleUpdateRate}
                  disabled={rateLoading}
                  className="h-16 bg-secondary text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-primary hover:text-secondary transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {rateLoading ? <span className="material-symbols-outlined animate-spin">sync</span> : <span className="material-symbols-outlined">save</span>}
                  Update Rate
                </button>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Auto-Fetch Backup</p>
                <button className="text-[10px] font-black text-primary uppercase tracking-widest border-b border-primary border-dashed pb-0.5 hover:text-secondary transition-colors">Fetch from Central Bank API</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Immutable Flow Record</h3>
            {transactions.map(tx => (
              <div key={tx.id} className="bg-white dark:bg-surface-dark p-5 rounded-[32px] border border-gray-100 dark:border-white/5 shadow-soft group flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`size-10 rounded-xl flex items-center justify-center ${tx.type === 'PAYOUT' ? 'bg-amber-50 text-amber-600' : 'bg-primary/10 text-primary'}`}>
                    <span className="material-symbols-outlined">{tx.type === 'PAYOUT' ? 'send_money' : 'receipt_long'}</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-secondary dark:text-white uppercase leading-none mb-1">{tx.description}</h4>
                    <p className="text-[9px] font-bold text-gray-400 uppercase">Ref: {tx.referenceId.substring(0, 8)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-black ${tx.type === 'PAYOUT' ? 'text-red-500' : 'text-primary'}`}>
                    {tx.type === 'PAYOUT' ? '-' : '+'}${tx.amount.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminFinancialReports;