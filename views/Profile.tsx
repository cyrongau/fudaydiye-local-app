import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { useWallet, useAuth } from '../Providers';
import { doc, collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot, deleteDoc, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Transaction } from '../types';
import { walletService } from '../src/lib/services/walletService';
import { userService } from '../src/lib/services/userService';
import ActivityFeed from '../components/ActivityFeed';

interface ProfileProps {
  isAuthenticated: boolean;
}

const Profile: React.FC<ProfileProps> = ({ isAuthenticated }) => {
  const navigate = useNavigate();
  const { balance } = useWallet();
  const { user, profile } = useAuth();
  const [showLoadFunds, setShowLoadFunds] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);
  const [isPromoterLoading, setIsPromoterLoading] = useState(false);

  const [topUpAmount, setTopUpAmount] = useState('');
  const [selectedGateway, setSelectedGateway] = useState('ZAAD');
  const [isProcessingTopUp, setIsProcessingTopUp] = useState(false);
  const [transactionHistory, setTransactionHistory] = useState<Transaction[]>([]);

  useEffect(() => {
    if (!user || !showTransactions) return;

    const q = query(
      collection(db, "transactions"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(30)
    );

    const unsub = onSnapshot(q, (snap) => {
      setTransactionHistory(snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)));
    });

    return () => unsub();
  }, [user, showTransactions]);

  const handleSignOut = async () => {
    const { auth } = await import('../lib/firebase');
    await auth.signOut();
    navigate('/');
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    // Enhanced Security Check: Require explicit input
    const input = window.prompt("SECURITY CHECK: To permanently delete your account, please type 'DELETE' below.\n\nThis action cannot be undone.");

    if (input !== 'DELETE') {
      if (input !== null) alert("Incorrect confirmation code. Deletion cancelled.");
      return;
    }

    try {
      // Delete Firestore Profile
      await deleteDoc(doc(db, "users", user.uid));
      // Delete Auth Account
      await user.delete();
      alert("Account successfully deleted.");
      navigate('/');
    } catch (err: any) {
      console.error("Deletion Error:", err);
      if (err.code === 'auth/requires-recent-login') {
        alert("Security Protocol: Re-authentication required. Please sign out and sign in again before deleting your account.");
      } else {
        alert("Deletion failed: " + err.message);
      }
    }
  };



  // ... inside component

  const handleTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !topUpAmount || parseFloat(topUpAmount) <= 0) return;

    setIsProcessingTopUp(true);
    const amount = parseFloat(topUpAmount);

    try {
      await walletService.deposit(user.uid, amount, selectedGateway);

      // Legacy Notification (Client-side for now)
      await addDoc(collection(db, "notifications"), {
        userId: user.uid,
        title: "Wallet Refilled",
        message: `Your account balance was credited with $${amount.toFixed(2)} successfully via ${selectedGateway} direct API.`,
        type: 'FINANCE',
        isRead: false,
        createdAt: serverTimestamp()
      });

      alert(`Success! $${amount.toFixed(2)} added to your Fudaydiye Wallet.`);
      setShowLoadFunds(false);
      setTopUpAmount('');
    } catch (err) {
      console.error(err);
      alert("Top-up synchronization failure. Please try again.");
    } finally {
      setIsProcessingTopUp(false);
    }
  };

  const togglePromoterStatus = async () => {
    if (!user || !isPromoterEligible) return;
    setIsPromoterLoading(true);
    try {
      const nextStatus = !profile?.isPromoter;
      await userService.updateProfile(user.uid, {
        // @ts-ignore - profile type might need updating or DTO allows arbitrary fields
        isPromoter: nextStatus
      });
      alert(nextStatus ? "Hambalyo! You are now a Fudaydiye Promoter." : "Promoter status deactivated.");
    } catch (err) {
      console.error(err);
      alert("Failed to update status.");
    } finally {
      setIsPromoterLoading(false);
    }
  };

  if (!isAuthenticated || !profile) {
    return (
      <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark">
        <header className="p-6">
          <h1 className="text-2xl font-black text-secondary dark:text-white tracking-tight uppercase">Identity</h1>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
          <div className="size-24 rounded-[40px] bg-red-50 dark:bg-white/5 flex items-center justify-center mb-6 border border-red-100 dark:border-white/10">
            <span className="material-symbols-outlined text-[48px] text-red-400">no_accounts</span>
          </div>
          <h2 className="text-xl font-black text-secondary dark:text-white mb-2 uppercase tracking-tighter">Profile Sync Error</h2>
          <p className="text-xs font-bold text-gray-400 mb-8 max-w-[250px] mx-auto">
            We couldn't retrieve your profile node using the current protocol. Using a secure reconnect usually fixes this.
          </p>
          <button
            onClick={handleSignOut}
            className="w-full h-16 bg-secondary text-primary font-black uppercase tracking-[0.2em] rounded-button shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <span className="material-symbols-outlined">refresh</span>
            Reset Session
          </button>
        </main>

      </div>
    );
  }

  const isPromoterEligible = profile.trustTier === 'GOLD' || profile.trustTier === 'PLATINUM';

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'PLATINUM': return 'text-sky-400 border-sky-400/30 bg-sky-400/10';
      case 'GOLD': return 'text-amber-400 border-amber-400/30 bg-amber-400/10';
      case 'SILVER': return 'text-gray-300 border-gray-300/30 bg-gray-300/10';
      default: return 'text-orange-600 border-orange-600/30 bg-orange-600/10';
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark font-display transition-colors duration-300">
      <header className="sticky top-0 z-40 bg-surface-light/95 dark:bg-surface-dark/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 p-6 flex justify-between items-center">
        <h1 className="text-2xl font-black text-secondary dark:text-white tracking-tighter uppercase">My Identity</h1>
        <button onClick={() => navigate('/customer/settings')} className="size-11 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400 active:scale-90 transition-all hover:bg-gray-200 dark:hover:bg-white/10">
          <span className="material-symbols-outlined">tune</span>
        </button>
      </header>

      <main className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto pb-32 no-scrollbar animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 text-center md:text-left">
          <div className="relative">
            <div className={`size-24 rounded-[40px] p-1 border-2 shadow-soft ${profile.trustTier === 'PLATINUM' ? 'bg-sky-400/20 border-sky-400/30' : 'bg-primary/20 border-primary/30'} `}>
              <img src={profile.avatar || `https://i.pravatar.cc/150?u=${profile.mobile}`} className="w-full h-full object-cover rounded-[34px]" alt="Profile" />
            </div>
            <div className="absolute -bottom-1 -right-1 size-8 bg-secondary text-primary rounded-full flex items-center justify-center border-4 border-background-light dark:border-background-dark shadow-lg">
              <span className="material-symbols-outlined text-[16px] font-black">verified</span>
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-black text-secondary dark:text-white leading-tight uppercase tracking-tighter">{profile.fullName}</h2>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-2">
              <span className={`px-2 py-0.5 ${getTierColor(profile.trustTier || 'BRONZE')} text-[9px] font-black uppercase tracking-widest rounded border opacity-90 shadow-sm`}>
                {profile.trustTier || 'BRONZE'} STATUS
              </span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">@{profile.location || 'Hargeisa'}</span>
            </div>
          </div>
        </div>

        <section className="bg-secondary text-white p-8 rounded-[40px] shadow-2xl relative overflow-hidden group border border-white/5">
          <div className="absolute top-0 right-0 size-48 bg-primary/20 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10 flex flex-col">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">account_balance_wallet</span>
                  Direct Wallet
                </h3>
              </div>
              <div className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-xl border border-white/10">
                <span className="text-[10px] font-black text-primary uppercase">Active Node</span>
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-10">
              <span className="text-5xl font-black tracking-tighter leading-none">${balance.toFixed(2)}</span>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowLoadFunds(true)} className="flex-1 h-14 bg-primary text-secondary font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl shadow-lg active:scale-95 transition-all">Direct Refill</button>
              <button onClick={() => setShowTransactions(true)} className="size-14 bg-white/10 rounded-2xl border border-white/10 flex items-center justify-center backdrop-blur-md active:scale-95 transition-all">
                <span className="material-symbols-outlined text-white">receipt_long</span>
              </button>
            </div>
          </div>
        </section>

        <section className={`p-7 rounded-[40px] shadow-2xl relative overflow-hidden transition-all duration-500 border-2 ${!isPromoterEligible
          ? 'bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/5 opacity-50 grayscale'
          : profile.isPromoter
            ? 'bg-primary text-secondary border-primary/20'
            : 'bg-white dark:bg-surface-dark border-gray-100 dark:border-gray-800 shadow-soft'
          }`}>
          {!isPromoterEligible && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/5 backdrop-blur-[2px]">
              <span className="material-symbols-outlined text-secondary dark:text-white text-3xl font-black mb-2">lock</span>
              <p className="text-[9px] font-black uppercase tracking-widest text-secondary dark:text-white">Gold Tier Required</p>
            </div>
          )}
          <div className="absolute top-0 right-0 size-32 bg-white/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-8">
              <div>
                <p className={`text-[9px] font-black uppercase tracking-[0.4em] mb-1 ${profile.isPromoter ? 'text-secondary/60' : 'text-primary'}`}>Promoter Hub</p>
                <h3 className={`text-2xl font-black tracking-tighter ${profile.isPromoter ? 'text-secondary' : 'text-secondary dark:text-white'}`}>
                  {profile.isPromoter ? 'Link Active' : 'Promote & Earn'}
                </h3>
              </div>
              <button
                disabled={isPromoterLoading || !isPromoterEligible}
                onClick={togglePromoterStatus}
                className={`h-7 w-12 rounded-full relative transition-all p-1 ${profile.isPromoter ? 'bg-secondary' : 'bg-gray-100 dark:bg-white/10'}`}
              >
                <div className={`size-5 rounded-full bg-white shadow-md transition-transform ${profile.isPromoter ? 'translate-x-5' : 'translate-x-0'}`}></div>
              </button>
            </div>
          </div>
        </section>

        <section>
          <ActivityFeed />
        </section>

        <div className="space-y-6 mt-2 pb-10">
          <MenuSection title="Account Mastery">
            <MenuItem icon="person" label="Identity Sync" onClick={() => navigate('/customer/personal-info')} />
            <MenuItem icon="location_on" label="Regional Zones" onClick={() => navigate('/customer/addresses')} />
            <MenuItem icon="credit_card" label="Financial Nodes" onClick={() => navigate('/customer/payments')} />
          </MenuSection>

          <MenuSection title="Network Support">
            <MenuItem icon="help_center" label="Platform Docs" onClick={() => navigate('/faq')} />
            <MenuItem icon="chat_bubble" label="Direct Channel" onClick={() => navigate('/contact')} />
          </MenuSection>

          <MenuSection title="Protocol Override (Danger Zone)">
            <button onClick={handleSignOut} className="w-full p-5 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-white/10 transition-all group">
              <div className="flex items-center gap-4">
                <div className="size-10 rounded-xl bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-500 group-hover:text-red-500 transition-colors border border-gray-100 dark:border-white/10 shadow-sm">
                  <span className="material-symbols-outlined text-[22px]">logout</span>
                </div>
                <span className="text-sm font-black text-secondary dark:text-white uppercase tracking-tighter leading-none">Log Out</span>
              </div>
            </button>
            <button onClick={handleDeleteAccount} className="w-full p-5 flex items-center justify-between hover:bg-red-50 dark:hover:bg-red-900/10 transition-all group">
              <div className="flex items-center gap-4">
                <div className="size-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500 border border-red-100 dark:border-red-900/30 shadow-sm">
                  <span className="material-symbols-outlined text-[22px]">delete_forever</span>
                </div>
                <span className="text-sm font-black text-red-600 dark:text-red-400 uppercase tracking-tighter leading-none">Delete Account</span>
              </div>
            </button>
          </MenuSection>
        </div>
      </main >

      {/* Transaction Statement Modal */}
      {
        showTransactions && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-secondary/80 backdrop-blur-sm" onClick={() => setShowTransactions(false)}></div>
            <div className="relative bg-white dark:bg-surface-dark rounded-[48px] w-full max-w-lg shadow-2xl border border-gray-100 dark:border-white/5 animate-in zoom-in-95 overflow-hidden flex flex-col max-h-[80vh]">
              <header className="p-8 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="size-10 rounded-xl bg-secondary text-primary flex items-center justify-center shadow-lg">
                    <span className="material-symbols-outlined">receipt_long</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-secondary dark:text-white uppercase tracking-tighter">Treasury Ledger</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Direct Flow History</p>
                  </div>
                </div>
                <button onClick={() => setShowTransactions(false)} className="size-10 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </header>
              <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                {transactionHistory.length === 0 ? (
                  <div className="py-20 text-center opacity-30">
                    <span className="material-symbols-outlined text-5xl mb-4">cloud_off</span>
                    <p className="text-xs font-black uppercase tracking-widest">No transaction nodes detected</p>
                  </div>
                ) : (
                  transactionHistory.map(tx => (
                    <div key={tx.id} className="p-5 rounded-3xl bg-gray-50 dark:bg-white/2 border border-gray-100 dark:border-white/5 flex items-center justify-between group hover:border-primary/30 transition-all">
                      <div className="flex items-center gap-4">
                        <div className={`size-10 rounded-xl flex items-center justify-center ${tx.type === 'DEPOSIT' || tx.type === 'EARNING' ? 'bg-primary/10 text-primary' : 'bg-red-50 text-red-500'}`}>
                          <span className="material-symbols-outlined text-[20px]">{tx.type === 'DEPOSIT' ? 'add_card' : 'shopping_bag'}</span>
                        </div>
                        <div>
                          <p className="text-xs font-black text-secondary dark:text-white uppercase tracking-tight truncate max-w-[150px]">{tx.description}</p>
                          <p className="text-[8px] font-bold text-gray-400 uppercase">{tx.createdAt?.toDate().toLocaleDateString()} • Ref: {tx.referenceId?.substring(0, 8)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-black ${tx.type === 'DEPOSIT' || tx.type === 'EARNING' ? 'text-primary' : 'text-red-500'}`}>{tx.type === 'DEPOSIT' || tx.type === 'EARNING' ? '+' : '-'}${tx.amount.toFixed(2)}</p>
                        <p className="text-[8px] font-bold text-gray-400 uppercase mt-0.5">Bal: ${tx.balanceAfter?.toFixed(2)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )
      }

      {/* Load Funds Modal */}
      {
        showLoadFunds && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-secondary/80 backdrop-blur-sm" onClick={() => setShowLoadFunds(false)}></div>
            <div className="relative bg-white dark:bg-surface-dark rounded-[48px] w-full max-w-md shadow-2xl border border-gray-100 dark:border-white/5 animate-in zoom-in-95 overflow-hidden flex flex-col">
              <header className="p-8 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="size-10 rounded-xl bg-primary text-secondary flex items-center justify-center shadow-lg">
                    <span className="material-symbols-outlined font-black">add_card</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-secondary dark:text-white uppercase tracking-tighter leading-none">Direct Top-up</h3>
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-1">Telco API Gateway</p>
                  </div>
                </div>
                <button onClick={() => setShowLoadFunds(false)} className="size-10 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </header>

              <form onSubmit={handleTopUp} className="p-8 space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Deposit Amount ($)</label>
                  <div className="h-16 rounded-2xl bg-gray-50 dark:bg-white/5 border-2 border-gray-100 dark:border-white/10 flex items-center px-6 gap-4 focus-within:border-primary transition-all">
                    <span className="text-xl font-black text-primary">$</span>
                    <input
                      required
                      type="number"
                      step="0.01"
                      value={topUpAmount}
                      onChange={e => setTopUpAmount(e.target.value)}
                      placeholder="0.00"
                      className="bg-transparent border-none focus:ring-0 text-xl font-black flex-1 text-secondary dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Select API Gateway</label>
                  <div className="grid grid-cols-1 gap-3">
                    {['ZAAD', 'EDAHAB', 'SAHAL', 'EVC_PLUS', 'PREMIER'].map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setSelectedGateway(opt)}
                        className={`p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${selectedGateway === opt
                          ? 'border-primary bg-primary/5 text-secondary dark:text-white shadow-soft'
                          : 'border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/2 text-gray-400 hover:border-primary/20'
                          }`}
                      >
                        <span className="text-[11px] font-black uppercase tracking-widest">{opt.replace('_', ' ')} Direct</span>
                        {selectedGateway === opt && <span className="material-symbols-outlined text-primary text-xl">check_circle</span>}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  disabled={isProcessingTopUp || !topUpAmount}
                  className="w-full h-16 bg-primary text-secondary font-black text-xs uppercase tracking-[0.2em] rounded-[24px] shadow-primary-glow flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-30"
                >
                  {isProcessingTopUp ? <span className="animate-spin material-symbols-outlined">sync</span> : 'Confirm Direct Deposit'}
                </button>
              </form>
            </div>
          </div>
        )
      }


    </div >
  );
};

const MenuSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="flex flex-col gap-3">
    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] ml-2">{title}</h3>
    <div className="bg-white dark:bg-surface-dark rounded-[32px] border border-gray-100 dark:border-white/5 overflow-hidden shadow-card divide-y divide-gray-50 dark:divide-white/5">
      {children}
    </div>
  </div>
);

const MenuItem: React.FC<{ icon: string; label: string; onClick?: () => void }> = ({ icon, label, onClick }) => (
  <button onClick={onClick} className="w-full p-5 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-white/10 transition-all group">
    <div className="flex items-center gap-4">
      <div className="size-10 rounded-xl bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-500 group-hover:text-primary transition-colors border border-gray-100 dark:border-white/10 shadow-sm">
        <span className="material-symbols-outlined text-[22px]">{icon}</span>
      </div>
      <span className="text-sm font-black text-secondary dark:text-white uppercase tracking-tighter leading-none">{label}</span>
    </div>
    <span className="material-symbols-outlined text-gray-300 text-[20px] group-hover:translate-x-1 transition-transform">chevron_right</span>
  </button>
);

export default Profile;
