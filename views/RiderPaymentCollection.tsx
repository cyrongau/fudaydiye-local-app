
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const RiderPaymentCollection: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedMethod, setSelectedMethod] = useState<'CASH' | 'ZAAD' | 'EDAHAB'>('CASH');
  const [isProcessing, setIsProcessing] = useState(false);

  const orderData = {
    id: id || 'FD-8921',
    customer: 'Amina Omer',
    amount: '$125.00',
    items: 2
  };

  const handleConfirmCollection = () => {
    setIsProcessing(true);
    // Simulate payment verification
    setTimeout(() => {
      setIsProcessing(false);
      // After payment is collected, move to OTP/Photo verification
      navigate(`/rider/confirm/${orderData.id}`);
    }, 2000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-300">
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-surface-dark/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-4 py-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-all active:scale-90 text-text-main dark:text-white">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="flex flex-col items-center">
          <h2 className="text-sm font-black tracking-tight text-secondary dark:text-white uppercase tracking-widest">Collect Payment</h2>
          <p className="text-[9px] font-bold text-gray-400 uppercase">Order #{orderData.id}</p>
        </div>
        <div className="size-10"></div>
      </header>

      <main className="flex-1 p-6 flex flex-col gap-8 overflow-y-auto pb-40 no-scrollbar">
        {/* Amount to Collect Card */}
        <section className="bg-secondary text-white p-8 rounded-[40px] shadow-2xl relative overflow-hidden text-center">
           <div className="absolute top-0 right-0 size-32 bg-primary/20 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
           <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4">Total Amount Due</p>
           <h1 className="text-6xl font-black tracking-tighter leading-none mb-2">{orderData.amount}</h1>
           <div className="flex items-center justify-center gap-2 mt-4 opacity-60">
              <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
              <span className="text-xs font-bold uppercase tracking-widest">{orderData.items} Items included</span>
           </div>
        </section>

        {/* Payment Method Selector */}
        <section className="space-y-4">
           <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Select Collection Method</h3>
           <div className="grid grid-cols-1 gap-3">
              <PaymentMethodCard 
                id="CASH" 
                label="Physical Cash" 
                desc="Collect cash from customer" 
                icon="payments" 
                selected={selectedMethod === 'CASH'} 
                onClick={() => setSelectedMethod('CASH')} 
              />
              <PaymentMethodCard 
                id="ZAAD" 
                label="ZAAD Service" 
                desc="Request payment to your wallet" 
                img="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS8S5_9rV_P-6E6_hM7Bw9b6zN8X7z9w8X7z9w8X7z9w"
                selected={selectedMethod === 'ZAAD'} 
                onClick={() => setSelectedMethod('ZAAD')} 
              />
              <PaymentMethodCard 
                id="EDAHAB" 
                label="eDahab" 
                desc="Request payment to your wallet" 
                img="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR_xN8E3fX_P-6E6_hM7Bw9b6zN8X7z9w8X7z9w8X7z9w"
                selected={selectedMethod === 'EDAHAB'} 
                onClick={() => setSelectedMethod('EDAHAB')} 
              />
           </div>
        </section>

        {/* Customer Interaction Help */}
        <div className="bg-white dark:bg-surface-dark p-6 rounded-[32px] border border-gray-100 dark:border-white/5 shadow-soft flex items-start gap-4">
           <div className="size-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
              <span className="material-symbols-outlined">info</span>
           </div>
           <div>
              <h4 className="text-sm font-black text-secondary dark:text-white leading-none mb-1">Verify First</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">Ensure you have received the full amount before clicking confirm. Once confirmed, you can proceed to OTP verification.</p>
           </div>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-background-dark/95 backdrop-blur-md border-t border-gray-100 dark:border-white/5 p-5 pb-10">
        <div className="max-w-lg mx-auto">
           <button 
            onClick={handleConfirmCollection}
            disabled={isProcessing}
            className="w-full h-16 bg-primary text-secondary font-black text-sm uppercase tracking-[0.2em] rounded-button shadow-primary-glow flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50"
           >
              {isProcessing ? (
                <span className="animate-spin material-symbols-outlined">sync</span>
              ) : (
                <>
                  <span className="material-symbols-outlined font-black">check_circle</span>
                  Confirm {selectedMethod === 'CASH' ? 'Cash' : 'Payment'} Received
                </>
              )}
           </button>
        </div>
      </footer>
    </div>
  );
};

const PaymentMethodCard: React.FC<{ 
  id: string; 
  label: string; 
  desc: string; 
  icon?: string; 
  img?: string; 
  selected: boolean; 
  onClick: () => void 
}> = ({ label, desc, icon, img, selected, onClick }) => (
  <button 
    onClick={onClick}
    className={`p-5 rounded-[28px] border-2 flex items-center justify-between gap-4 transition-all text-left ${
      selected 
      ? 'border-primary bg-primary/5 shadow-soft scale-[1.02] z-10' 
      : 'border-gray-50 dark:border-white/5 bg-white dark:bg-white/2 hover:border-gray-200 opacity-70'
    }`}
  >
    <div className="flex items-center gap-4">
       <div className={`size-12 rounded-2xl flex items-center justify-center shrink-0 ${selected ? 'bg-primary text-secondary' : 'bg-gray-100 dark:bg-white/5 text-gray-400'}`}>
          {img ? <img src={img} className="size-8 object-contain" alt={label} /> : <span className="material-symbols-outlined text-[28px]">{icon}</span>}
       </div>
       <div>
          <h4 className={`text-sm font-black leading-none mb-1 ${selected ? 'text-secondary dark:text-white' : 'text-gray-500'}`}>{label}</h4>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{desc}</p>
       </div>
    </div>
    {selected && (
       <span className="material-symbols-outlined text-primary text-[24px] icon-filled">check_circle</span>
    )}
  </button>
);

export default RiderPaymentCollection;
