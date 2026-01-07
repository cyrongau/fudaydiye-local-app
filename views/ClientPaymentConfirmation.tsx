
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DocumentModal from '../components/DocumentModal';

const ClientPaymentConfirmation: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'PAYING' | 'CONFIRMED'>('PAYING');
  const [selectedDoc, setSelectedDoc] = useState<any>(null);

  useEffect(() => {
    // Simulate payment processing wait
    const timer = setTimeout(() => {
      setStatus('CONFIRMED');
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  const bookingData = {
    id: 'FD-1295',
    date: 'Oct 24, 2023',
    origin: 'Warehouse A, Hargeisa',
    destination: 'Berbera Port Authority',
    amount: '$4.50',
    size: 'Medium (M)',
    weight: '12.5 kg',
    rider: 'Khadar Ahmed'
  };

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-300 font-display">
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center overflow-y-auto no-scrollbar">
        {status === 'PAYING' ? (
          <div className="flex flex-col items-center animate-in fade-in duration-700">
            <div className="relative mb-10">
              <div className="size-32 bg-primary/10 rounded-full animate-ping-slow"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="size-24 bg-white dark:bg-surface-dark rounded-[32px] shadow-2xl flex items-center justify-center relative overflow-hidden border border-gray-100 dark:border-gray-800">
                    <img 
                      src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS8S5_9rV_P-6E6_hM7Bw9b6zN8X7z9w8X7z9w8X7z9w" 
                      className="size-16 object-contain" 
                      alt="ZAAD Logo" 
                    />
                 </div>
              </div>
            </div>
            
            <h2 className="text-2xl font-black text-secondary dark:text-white mb-3 tracking-tighter">USSD Prompt Sent</h2>
            <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] mb-8 max-w-xs leading-relaxed">
              Waiting for you to authorize <span className="text-primary font-black">$4.50</span> on your mobile device...
            </p>
            
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-white/5 rounded-full border border-gray-200 dark:border-white/10">
               <span className="animate-spin material-symbols-outlined text-[18px] text-primary">sync</span>
               <span className="text-[9px] font-black uppercase tracking-widest text-secondary dark:text-white">Connecting to Gateway</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center w-full animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
            <div className="size-24 bg-primary rounded-[32px] flex items-center justify-center shadow-primary-glow mb-8 animate-bounce">
              <span className="material-symbols-outlined text-secondary text-[48px] font-black">check</span>
            </div>
            
            <h2 className="text-3xl font-black text-secondary dark:text-white mb-1 tracking-tighter">Booking Confirmed!</h2>
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-10">Dispatch ID #{bookingData.id}</p>

            {/* Summary Card */}
            <div className="w-full bg-white dark:bg-surface-dark rounded-[40px] p-8 border border-gray-100 dark:border-gray-800 shadow-soft text-left space-y-6">
               <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</h3>
                    <div className="flex items-center gap-2">
                       <span className="size-2 rounded-full bg-primary animate-pulse"></span>
                       <span className="text-xs font-black text-secondary dark:text-white uppercase tracking-widest">Searching for Rider</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Paid Amount</h3>
                    <span className="text-sm font-black text-primary">{bookingData.amount}</span>
                  </div>
               </div>

               <div className="h-[1px] w-full bg-gray-50 dark:bg-white/5"></div>

               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Pick Up</h3>
                    <p className="text-xs font-bold text-secondary dark:text-white leading-tight">{bookingData.origin}</p>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Destination</h3>
                    <p className="text-xs font-bold text-secondary dark:text-white leading-tight">{bookingData.destination}</p>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Size</h3>
                    <p className="text-xs font-bold text-secondary dark:text-white leading-tight">{bookingData.size}</p>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest">ETA (Matching)</h3>
                    <p className="text-xs font-bold text-secondary dark:text-white leading-tight">~ 5-8 mins</p>
                  </div>
               </div>

               <div className="flex gap-2 pt-4">
                  <button 
                    onClick={() => setSelectedDoc({ id: bookingData.id, date: bookingData.date, amount: bookingData.amount, location: bookingData.destination, size: bookingData.size })}
                    className="flex-1 h-12 bg-gray-100 dark:bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-secondary dark:text-white border border-gray-200 dark:border-gray-800 flex items-center justify-center gap-2 active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                    Receipt
                  </button>
                  <button 
                    onClick={() => navigate(`/customer/track-external/${bookingData.id}`)}
                    className="flex-1 h-12 bg-secondary dark:bg-primary text-white dark:text-secondary rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md"
                  >
                    <span className="material-symbols-outlined text-[18px]">near_me</span>
                    Track
                  </button>
               </div>
            </div>

            <button 
              onClick={() => navigate('/client')}
              className="mt-10 text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] hover:text-primary transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Return to Shipments
            </button>
          </div>
        )}
      </main>

      <DocumentModal 
        isOpen={!!selectedDoc} 
        onClose={() => setSelectedDoc(null)} 
        type="SHIPPING_RECEIPT" 
        data={selectedDoc || {}} 
      />
    </div>
  );
};

export default ClientPaymentConfirmation;
