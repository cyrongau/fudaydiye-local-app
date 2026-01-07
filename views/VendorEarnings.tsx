
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Providers';
import { collection, query, where, orderBy, onSnapshot, limit, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Transaction, PayoutRequest } from '../types';

const VendorEarnings: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Sync Transactions
    const qTx = query(
      collection(db, "transactions"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(20)
    );

    const unsubTx = onSnapshot(qTx, (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
      setLoading(false);
    });

    // Sync Payouts
    const qPay = query(
      collection(db, "payouts"),
      where("vendorId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsubPay = onSnapshot(qPay, (snapshot) => {
      setPayouts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
    });

    return () => {
      unsubTx();
      unsubPay();
    };
  }, [user]);

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile || !payoutAmount) return;

    const amount = parseFloat(payoutAmount);
    if (amount > profile.walletBalance) {
      alert("Amount exceeds liquid liquid balance.");
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "payouts"), {
        vendorId: user.uid,
        vendorName: profile.businessName || profile.fullName,
        amount: amount,
        status: 'PENDING',
        method: 'ZAAD / eDahab',
        accountDetails: profile.mobile,
        createdAt: serverTimestamp(),
      });

      // Add notification for system record
      await addDoc(collection(db, "notifications"), {
        userId: user.uid,
        title: "Payout Requested",
        message: `Your request for $${amount} has been queued for authorization.`,
        type: 'FINANCE',
        isRead: false,
        createdAt: serverTimestamp()
      });

      setShowPayoutModal(false);
      setPayoutAmount('');
      alert("Payout Request Node Broadcasted to Treasury.");
    } catch (err) {
      console.error(err);
      alert("Communication Failure with Ledger.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const walletBalance = profile?.walletBalance || 0;

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-700 font-display">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
        <div className="flex flex-col">
          <h1 className="text-4xl font-black text-secondary dark:text-white tracking-tighter leading-none uppercase">Treasury</h1>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mt-3">Merchant Ledger Hub</p>
        </div>
        <div className="flex gap-4">
          <button className="h-14 px-8 bg-gray-100 dark:bg-white/5 text-gray-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-gray-200 dark:border-white/10">Export CSV</button>
          <button
            onClick={() => setShowPayoutModal(true)}
            className="h-14 px-8 bg-primary text-secondary rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all"
          >Request Payout</button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 flex flex-col gap-6">
          <section className="bg-secondary text-white rounded-[40px] p-10 shadow-2xl relative overflow-hidden group border border-white/5">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/30 transition-colors duration-700"></div>
            <div className="relative z-10">
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4 block text-shadow-sm">Liquid Earning Portfolio</span>
              <h2 className="text-7xl font-black tracking-tighter leading-none mb-8">
                ${walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h2>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/20 backdrop-blur-md">
                  <span className="size-2 rounded-full bg-primary animate-pulse"></span>
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest">Authorized Stream</span>
                </div>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-2 gap-4">
            <SummaryTile label="In-Review" value={`$${payouts.filter(p => p.status === 'PENDING').reduce((sum, p) => sum + p.amount, 0).toFixed(2)}`} icon="history" />
            <SummaryTile label="Platform Tax" value="10%" icon="percent" />
          </div>
        </div>

        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em]">Real-time Ledger Audit</h3>
            <p className="text-[9px] font-black text-primary uppercase tracking-[0.3em]">Network Integrity Verified</p>
          </div>

          {loading ? (
            <div className="py-20 flex justify-center"><div className="size-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div></div>
          ) : transactions.length === 0 ? (
            <div className="bg-white dark:bg-surface-dark p-20 rounded-[40px] border border-gray-100 dark:border-white/5 text-center opacity-40">
              <span className="material-symbols-outlined text-6xl">receipt_long</span>
              <p className="text-xs font-black uppercase mt-4">No recent ledger nodes detected</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-surface-dark rounded-[40px] border border-gray-100 dark:border-white/5 shadow-soft overflow-hidden">
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left">
                  <thead className="bg-gray-50/50 dark:bg-white/2 border-b border-gray-100 dark:border-white/5">
                    <tr>
                      <th className="py-5 px-8 text-[10px] font-black text-gray-400 uppercase tracking-widest">Descriptor</th>
                      <th className="py-5 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Flow</th>
                      <th className="py-5 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Logic</th>
                      <th className="py-5 px-8 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Node ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-white/2">
                    {transactions.map(tx => (
                      <tr key={tx.id} className="group hover:bg-gray-50/50 dark:hover:bg-white/2 transition-colors">
                        <td className="py-5 px-8">
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-secondary dark:text-white uppercase truncate max-w-[200px]">{tx.description}</span>
                            <span className="text-[9px] font-bold text-gray-400 uppercase mt-1">Authorized Node</span>
                          </div>
                        </td>
                        <td className="py-5 px-6">
                          <span className={`text-sm font-black ${tx.type === 'EARNING' ? 'text-primary' : 'text-red-500'}`}>
                            {tx.type === 'EARNING' ? '+' : '-'}${tx.amount.toFixed(2)}
                          </span>
                        </td>
                        <td className="py-5 px-6">
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest border border-gray-200 dark:border-white/10 px-2 py-1 rounded-lg">
                            {tx.type}
                          </span>
                        </td>
                        <td className="py-5 px-8 text-right">
                          <span className="text-[10px] font-bold text-secondary dark:text-primary uppercase tracking-widest">{tx.referenceId.substring(0, 8)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payout Request Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowPayoutModal(false)}></div>
          <div className="relative bg-white dark:bg-surface-dark rounded-[40px] p-10 max-w-md w-full shadow-2xl animate-in zoom-in-95">
            <div className="flex flex-col items-center mb-8">
              <div className="size-16 rounded-[22px] bg-primary/10 flex items-center justify-center text-primary mb-6 border border-primary/20">
                <span className="material-symbols-outlined text-[32px] font-black">account_balance_wallet</span>
              </div>
              <h2 className="text-2xl font-black text-secondary dark:text-white tracking-tighter uppercase leading-none">Request Payout</h2>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-3 text-center">Funds are settled within 2-4 hours to verified mobile wallets</p>
            </div>

            <form onSubmit={handleRequestPayout} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Withdrawal Amount ($)</label>
                <div className="h-16 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 flex items-center px-6 gap-3 focus-within:border-primary transition-all">
                  <span className="text-xl font-black text-primary">$</span>
                  <input
                    required
                    type="number"
                    step="0.01"
                    max={walletBalance}
                    value={payoutAmount}
                    onChange={e => setPayoutAmount(e.target.value)}
                    className="bg-transparent border-none focus:ring-0 text-xl font-black text-secondary dark:text-white w-full"
                    placeholder="0.00"
                  />
                </div>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">Available: ${walletBalance.toFixed(2)}</p>
              </div>

              <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-white/10">
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Destination Gateway</p>
                <p className="text-xs font-black text-secondary dark:text-white uppercase">{profile?.mobile} (ZAAD/eDahab Sync)</p>
              </div>

              <button
                disabled={isSubmitting || !payoutAmount || parseFloat(payoutAmount) <= 0}
                type="submit"
                className="w-full h-16 bg-primary text-secondary font-black uppercase text-xs tracking-[0.2em] rounded-2xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-30"
              >
                {isSubmitting ? <span className="animate-spin material-symbols-outlined">sync</span> : 'Authorize Withdrawal'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const SummaryTile: React.FC<{ label: string; value: string; icon: string }> = ({ label, value, icon }) => (
  <div className="bg-white dark:bg-surface-dark p-6 rounded-[32px] border border-gray-100 dark:border-white/5 shadow-soft flex flex-col gap-4 group hover:border-primary/20 transition-all">
    <div className="size-10 rounded-xl bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-primary transition-colors">
      <span className="material-symbols-outlined text-[20px]">{icon}</span>
    </div>
    <div>
      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-black text-secondary dark:text-white tracking-tighter leading-none">{value}</p>
    </div>
  </div>
);

export default VendorEarnings;
