
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
// Added addDoc to the firestore imports
import { doc, getDoc, updateDoc, increment, collection, query, where, getDocs, writeBatch, serverTimestamp, runTransaction, setDoc, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Order } from '../types';
import { RiderService } from '../src/lib/services/riderService';

const RiderDeliveryConfirmation: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [otp, setOtp] = useState(['', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrder() {
      if (!id) return;
      const snap = await getDoc(doc(db, "orders", id));
      if (snap.exists()) setOrder({ id: snap.id, ...snap.data() } as Order);
    }
    fetchOrder();
  }, [id]);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 3) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const clearAssociatedNotifications = async () => {
    if (!id) return;
    try {
      const q = query(collection(db, "notifications"), where("link", "==", `/rider/confirm/${id}`));
      const snap = await getDocs(q);
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.update(d.ref, { isRead: true }));
      await batch.commit();
    } catch (e) { console.error("Notification clear failed", e); }
  };

  const handleComplete = async () => {
    if (!order) return;
    setIsSubmitting(true);
    setError(null);

    const enteredCode = otp.join('');
    if (enteredCode === order.deliveryCode) {
      try {
        // Use Backend for Atomic Settlement (Transactions, Wallet Updates, Order Status)
        await RiderService.completeJob(order.id, order.riderId!);

        await clearAssociatedNotifications();

        // Notify Customer for Rating
        await addDoc(collection(db, "notifications"), {
          userId: order.customerId,
          title: "Package Handover Confirmed",
          message: `Delivery complete! Please rate Captain ${order.riderName}'s efficiency.`,
          link: `/customer/orders`,
          type: 'ORDER',
          isRead: false,
          createdAt: serverTimestamp()
        });

        setIsSuccess(true);
      } catch (err) {
        console.error("Handover Transaction Error:", err);
        setError("Atomic Settlement Failure. Protocol documents not found in mesh.");
      }
    } else {
      setError("INCORRECT HANDOVER PIN. VERIFICATION REQUIRED.");
    }
    setIsSubmitting(false);
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col min-h-screen bg-secondary text-white items-center justify-center p-8 animate-in fade-in duration-500 text-center">
        <div className="size-28 bg-primary rounded-[40px] flex items-center justify-center shadow-primary-glow mb-8 animate-bounce">
          <span className="material-symbols-outlined text-secondary text-[60px] font-black">check</span>
        </div>
        <h2 className="text-3xl font-black tracking-tighter mb-2 uppercase leading-none">Job Authorized</h2>
        <p className="text-primary text-[10px] font-black uppercase tracking-[0.3em] mb-12">Earnings released to wallet</p>
        <button onClick={() => navigate('/rider')} className="w-full h-16 bg-primary text-secondary font-black uppercase tracking-[0.2em] rounded-2xl shadow-lg active:scale-95 transition-all">Next in Queue</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-300 font-display">
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-surface-dark/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-6 py-6 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="size-11 flex items-center justify-center rounded-2xl bg-gray-50 dark:bg-white/5 active:scale-90 transition-all border border-gray-100 dark:border-white/10">
          <span className="material-symbols-outlined text-secondary dark:text-white text-[24px]">arrow_back</span>
        </button>
        <div className="flex flex-col items-center">
          <h2 className="text-xs font-black tracking-[0.3em] text-secondary dark:text-primary uppercase leading-none">Handover Node</h2>
          <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">Verification Step</p>
        </div>
        <div className="size-11"></div>
      </header>

      <main className="p-4 md:p-12 flex-1 flex flex-col gap-10 md:gap-16 overflow-y-auto pb-48 no-scrollbar animate-in fade-in duration-700">
        <section className="bg-white dark:bg-surface-dark p-6 md:p-8 rounded-[40px] md:rounded-[48px] shadow-soft border border-gray-100 dark:border-white/5 flex items-center justify-between group">
          <div className="flex flex-col gap-1">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Customer Node</p>
            <h3 className="text-xl md:text-2xl font-black text-secondary dark:text-white uppercase tracking-tighter leading-none">
              {order?.customerName || 'Syncing...'}
            </h3>
          </div>
          <div className="text-right flex flex-col gap-1">
            <p className="text-[9px] font-black text-primary uppercase tracking-widest">Earning</p>
            <p className="text-2xl md:text-3xl font-black text-primary tracking-tighter leading-none">
              ${(order?.deliveryFee || 3.50).toFixed(2)}
            </p>
          </div>
        </section>

        <section className="space-y-8 flex flex-col items-center w-full">
          <div className="text-center space-y-2">
            <h3 className="text-base md:text-lg font-black text-secondary dark:text-white uppercase tracking-[0.2em] leading-none">Authorize Handover</h3>
            <p className="text-[9px] md:text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-relaxed max-w-[280px] mx-auto">
              Ask the shopper for the 4-digit security PIN visible in their live tracker.
            </p>
          </div>

          <div className="flex justify-center gap-2 md:gap-4 w-full px-2">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                id={`otp-${idx}`}
                type="tel"
                maxLength={1}
                className="w-[22%] h-20 md:h-32 rounded-[24px] md:rounded-[32px] bg-white dark:bg-surface-dark border-none text-center text-4xl md:text-5xl font-black text-secondary dark:text-primary focus:ring-4 focus:ring-primary/20 transition-all shadow-[0_8px_30px_rgba(1,87,84,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)]"
                value={digit}
                onChange={(e) => handleOtpChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                placeholder="•"
              />
            ))}
          </div>

          {error && (
            <div className="px-6 py-2 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-900/30 animate-shake text-center">
              <p className="text-[9px] font-black text-red-500 uppercase tracking-widest">{error}</p>
            </div>
          )}
        </section>

        <div className="bg-amber-50 dark:bg-amber-500/10 p-6 md:p-8 rounded-[32px] md:rounded-[40px] border border-amber-100 dark:border-amber-500/20 flex gap-4 md:gap-6 items-start">
          <div className="size-10 md:size-12 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-600 shrink-0">
            <span className="material-symbols-outlined text-2xl md:text-3xl font-black">lock_open</span>
          </div>
          <p className="text-[10px] md:text-[11px] font-medium text-amber-800 dark:text-amber-400 leading-relaxed uppercase tracking-widest">
            <span className="font-black block mb-1">Protocol Check:</span> Do not hand over the package before verifying the PIN. This code is unique to the customer's terminal.
          </p>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-background-dark/95 backdrop-blur-md border-t border-gray-100 dark:border-white/5 p-6 pb-12 shadow-[0_-20px_80px_rgba(0,0,0,0.15)]">
        <div className="max-w-xl mx-auto">
          <button
            disabled={otp.some(d => !d) || isSubmitting}
            onClick={handleComplete}
            className="w-full h-16 bg-primary disabled:opacity-20 text-secondary font-black text-sm uppercase tracking-[0.4em] rounded-[24px] shadow-primary-glow flex items-center justify-center gap-4 active:scale-[0.98] transition-all group"
          >
            {isSubmitting ? (
              <span className="animate-spin material-symbols-outlined text-3xl">sync</span>
            ) : (
              <>
                Authorize Sequence
                <span className="material-symbols-outlined font-black text-2xl group-hover:translate-x-1 transition-transform">bolt</span>
              </>
            )}
          </button>
        </div>
      </footer>
    </div>
  );
};

export default RiderDeliveryConfirmation;
