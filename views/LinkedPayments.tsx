
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Providers';
import { SavedPaymentSource } from '../types';

const LinkedPayments: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [sources, setSources] = useState<SavedPaymentSource[]>([]);

  useEffect(() => {
    if (profile?.savedPaymentSources) {
      setSources(profile.savedPaymentSources);
    }
  }, [profile]);

  const handleDelete = (id: string) => {
    if (window.confirm('Unlink this payment source?')) {
      setSources(prev => prev.filter(s => s.id !== id));
      // In production, this would update Firestore
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-300 font-display">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/5 active:scale-90 transition-all">
            <span className="material-symbols-outlined text-secondary dark:text-white">arrow_back</span>
          </button>
          <div className="flex flex-col">
            <h1 className="text-xl font-black text-secondary dark:text-white tracking-tighter leading-none">Linked Sources</h1>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">Payment & Finance</p>
          </div>
        </div>
        <button className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
          <span className="material-symbols-outlined font-black">lock</span>
        </button>
      </header>

      <main className="p-6 flex-1 flex flex-col gap-8 overflow-y-auto pb-40 no-scrollbar animate-in fade-in duration-500">
        <section className="bg-secondary text-white p-7 rounded-[40px] shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 size-32 bg-primary/20 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
          <div className="relative z-10">
            <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-2">Platform Escrow</h3>
            <p className="text-sm font-medium leading-relaxed opacity-80 uppercase tracking-widest">
              Authorized payment sources are stored encrypted for rapid marketplace synchronization.
            </p>
          </div>
        </section>

        {/* Dynamic Payment Sources */}
        <section className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Verified Nodes</h3>
            <button className="text-primary text-[10px] font-black uppercase tracking-widest">Logic Hub</button>
          </div>
          <div className="flex flex-col gap-4">
            {sources.length === 0 ? (
              <div className="py-20 text-center opacity-30 bg-white dark:bg-white/5 rounded-[40px] border-2 border-dashed border-gray-100">
                <span className="material-symbols-outlined text-4xl mb-4">payments</span>
                <p className="text-[10px] font-black uppercase tracking-widest">No verified sources detected</p>
              </div>
            ) : (
              sources.map(source => (
                <div key={source.id} className="bg-white dark:bg-surface-dark p-6 rounded-[32px] border border-gray-100 dark:border-white/5 shadow-soft group hover:border-primary/20 transition-all flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className={`size-14 rounded-2xl ${source.type === 'MOBILE' ? 'bg-primary/10 text-primary' : 'bg-secondary text-white'} flex items-center justify-center shadow-lg overflow-hidden relative`}>
                      <span className="material-symbols-outlined text-[32px] relative z-10">{source.type === 'MOBILE' ? 'smartphone' : 'credit_card'}</span>
                    </div>
                    <div>
                      <h4 className="text-base font-black text-secondary dark:text-white uppercase tracking-tighter leading-none mb-1.5">{source.provider}</h4>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{source.mask}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleDelete(source.id)}
                      className="size-9 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors active:scale-90"
                    >
                      <span className="material-symbols-outlined text-[18px]">remove_circle</span>
                    </button>
                  </div>
                </div>
              ))
            )}

            <button
              onClick={() => navigate('/customer/checkout')}
              className="w-full h-14 bg-gray-50 dark:bg-white/2 rounded-[24px] border-2 border-dashed border-gray-200 dark:border-gray-800 flex items-center justify-center gap-3 text-gray-400 hover:text-primary hover:border-primary transition-all active:scale-[0.98]"
            >
              <span className="material-symbols-outlined">add_circle</span>
              <span className="text-[10px] font-black uppercase tracking-widest">Authorize New Source at Checkout</span>
            </button>
          </div>
        </section>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-background-dark/95 backdrop-blur-md border-t border-gray-100 dark:border-white/5 p-5 pb-10">
        <div className="max-w-lg mx-auto flex gap-3">
          <button className="flex-1 h-16 bg-primary text-secondary font-black text-xs uppercase tracking-[0.2em] rounded-button shadow-primary-glow active:scale-[0.98] transition-all">
            Security Protocol
          </button>
          <button className="size-16 rounded-button bg-secondary text-primary flex items-center justify-center shadow-lg">
            <span className="material-symbols-outlined text-3xl font-black">qr_code_2</span>
          </button>
        </div>
      </footer>
    </div>
  );
};

export default LinkedPayments;
