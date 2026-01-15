
import React, { useEffect, useState } from 'react';
import { api } from '../src/lib/api';
import { useAuth } from '../Providers';
import { toast } from 'sonner';

const WalletView: React.FC = () => {
    const { user, profile } = useAuth();
    const [balance, setBalance] = useState({ balance: 0, pendingPayouts: 0 });
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showPayoutModal, setShowPayoutModal] = useState(false);
    const [payoutAmount, setPayoutAmount] = useState('');

    const fetchData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // Fetch Balance
            const res = await api.get(`/finance/balance?userId=${user.uid}`);
            setBalance(res.data);

            // Fetch Transactions (Simulated for now, would need an endpoint)
            // const txRes = await api.get(`/finance/transactions?userId=${user.uid}`);
            // setTransactions(txRes.data);

        } catch (error) {
            console.error(error);
            toast.error("Failed to load wallet.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    const handleRequestPayout = async () => {
        if (!user || !payoutAmount) return;
        const amount = parseFloat(payoutAmount);
        if (isNaN(amount) || amount <= 0) {
            toast.error("Invalid amount");
            return;
        }

        try {
            await api.post('/finance/payout/request', {
                userId: user.uid,
                amount,
                method: 'MOBILE_MONEY',
                accountNumber: profile?.phoneNumber || 'N/A'
            });
            toast.success("Payout Requested");
            setShowPayoutModal(false);
            setPayoutAmount('');
            fetchData();
        } catch (error) {
            toast.error("Request Failed");
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-black/50 p-6 rounded-3xl animate-in fade-in">
            <h1 className="text-3xl font-black text-secondary dark:text-white uppercase tracking-tighter mb-8">Financial Hub</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                {/* Main Balance Card */}
                <div className="col-span-2 bg-gradient-to-br from-primary to-orange-400 p-8 rounded-[40px] shadow-2xl relative overflow-hidden text-secondary">
                    <div className="absolute top-0 right-0 p-8 opacity-20"><span className="material-symbols-outlined text-9xl">account_balance_wallet</span></div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] mb-2">Available Balance</p>
                    <h2 className="text-6xl font-black tracking-tighter mb-6">${balance.balance.toFixed(2)}</h2>

                    <div className="flex gap-4">
                        <button onClick={() => setShowPayoutModal(true)} className="px-8 py-3 bg-white text-secondary font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg active:scale-95 transition-all">Withdraw Funds</button>
                    </div>
                </div>

                {/* Pending Card */}
                <div className="bg-white dark:bg-surface-dark p-8 rounded-[40px] border border-gray-100 dark:border-white/5 flex flex-col justify-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Pending Payouts</p>
                    <h3 className="text-4xl font-black text-secondary dark:text-white tracking-tighter mb-4">${balance.pendingPayouts.toFixed(2)}</h3>
                    <p className="text-[10px] text-gray-400 leading-relaxed">Funds currently processing. Settlement normally occurs at 6 PM or 7 AM depending on shift.</p>
                </div>
            </div>

            {/* Transaction List */}
            <h3 className="text-lg font-black uppercase tracking-widest mb-6">Recent Activity</h3>
            <div className="bg-white dark:bg-surface-dark rounded-[32px] border border-gray-100 dark:border-white/5 overflow-hidden flex-1">
                {transactions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 opacity-40">
                        <span className="material-symbols-outlined text-4xl mb-2">receipt_long</span>
                        <p className="text-[10px] font-black uppercase tracking-widest">No transactions yet</p>
                    </div>
                ) : (
                    <div className="p-4">
                        {/* Map transactions here */}
                    </div>
                )}
            </div>

            {/* Payout Modal */}
            {showPayoutModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
                    <div className="bg-white dark:bg-surface-dark w-full max-w-sm p-8 rounded-[40px] shadow-2xl">
                        <h3 className="text-lg font-black uppercase mb-4">Request Payout</h3>
                        <div className="space-y-4 mb-8">
                            <div>
                                <label className="text-[10px] font-black uppercase text-gray-400">Amount</label>
                                <input
                                    type="number"
                                    value={payoutAmount}
                                    onChange={(e) => setPayoutAmount(e.target.value)}
                                    className="w-full text-2xl font-black border-b-2 border-gray-200 outline-none py-2 bg-transparent"
                                    placeholder="0.00"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-gray-400">Methods</label>
                                <div className="flex items-center gap-2 mt-2 p-3 bg-gray-50 rounded-xl">
                                    <span className="material-symbols-outlined">smartphone</span>
                                    <span className="text-xs font-bold">Mobile Money ({profile?.phoneNumber})</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setShowPayoutModal(false)} className="flex-1 py-4 rounded-xl font-black text-xs uppercase tracking-widest bg-gray-100 hover:bg-gray-200 transition-all">Cancel</button>
                            <button onClick={handleRequestPayout} className="flex-1 py-4 rounded-xl font-black text-xs uppercase tracking-widest bg-primary text-secondary shadow-lg active:scale-95 transition-all">Confirm</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WalletView;
