
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { GoogleGenAI } from "@google/genai";

const OrderDisputeRefund: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [hasPhoto, setHasPhoto] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiVerdict, setAiVerdict] = useState<string | null>(null);
  const [step, setStep] = useState<'FORM' | 'REVIEW'>('FORM');
  const [probability, setProbability] = useState(0);

  const orderData = {
    id: id || 'ORD-9821',
    vendor: 'Hodan Styles',
    total: '$125.00',
    date: 'Oct 14, 2023',
    item: 'Premium Silk Chiffon Dirac'
  };

  const analyzeDispute = async () => {
    setIsAnalyzing(true);
    setStep('REVIEW');
    
    // Animate probability
    let target = Math.floor(Math.random() * (98 - 75) + 75);
    let current = 0;
    const interval = setInterval(() => {
      if (current < target) {
        current += 1;
        setProbability(current);
      } else clearInterval(interval);
    }, 20);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Act as a Fudaydiye Marketplace Judge. A customer is requesting a refund for "${orderData.item}" (Order #${orderData.id}) for reason: "${reason}". Their description: "${description}". The user has a high trust score of 92%.
        Provide a 2-sentence response: 
        1. Empathize with their specific situation.
        2. State that the automated trust engine suggests a ${target}% resolution probability in their favor.`,
      });
      setAiVerdict(response.text);
    } catch (error) {
      console.error("AI Error:", error);
      setAiVerdict("Identity trust verified. Analysis suggests a high probability for immediate claim resolution. Our treasury node is currently calculating partial refund eligibility.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = () => {
    alert("Dispute filed. Claim authorized for manual treasury release in under 2 hours.");
    navigate('/customer/orders');
  };

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-300 font-display">
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-surface-dark/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/5 active:scale-90 transition-all">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="flex flex-col">
          <h1 className="text-xl font-black text-secondary dark:text-primary tracking-tighter leading-none">Order Recovery</h1>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">Resolution Protocol</p>
        </div>
      </header>

      <main className="p-6 flex-1 flex flex-col gap-8 overflow-y-auto pb-10 no-scrollbar animate-in fade-in duration-500">
        {step === 'FORM' ? (
          <>
            <section className="bg-white dark:bg-surface-dark p-6 rounded-[32px] border border-gray-100 dark:border-white/5 shadow-soft flex items-center gap-4">
               <div className="size-14 rounded-2xl bg-gray-50 dark:bg-white/5 flex items-center justify-center border border-gray-100 shadow-inner">
                  <span className="material-symbols-outlined text-3xl text-gray-400">package_2</span>
               </div>
               <div>
                  <h4 className="text-base font-black text-secondary dark:text-white leading-none mb-1.5 uppercase tracking-tighter">{orderData.item}</h4>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Order #{orderData.id} • {orderData.total}</p>
               </div>
            </section>

            <section className="space-y-6">
               <div className="space-y-3">
                  <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Claim Reason</h3>
                  <div className="grid grid-cols-2 gap-3">
                     {['Item Damaged', 'Delayed/Lost', 'Wrong Item', 'Quality Issue'].map(t => (
                       <button 
                        key={t}
                        onClick={() => setReason(t)}
                        className={`h-14 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest transition-all ${
                          reason === t ? 'bg-primary/10 border-primary text-secondary dark:text-primary shadow-sm' : 'bg-white dark:bg-white/5 border-gray-100 dark:border-white/5 text-gray-400'
                        }`}
                       >
                          {t}
                       </button>
                     ))}
                  </div>
               </div>

               <div className="space-y-3">
                  <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Supporting Evidence</h3>
                  <button 
                    onClick={() => setHasPhoto(!hasPhoto)}
                    className={`w-full aspect-video rounded-[32px] border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all relative overflow-hidden ${
                      hasPhoto ? 'border-primary bg-primary/5' : 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-white/5'
                    }`}
                  >
                    {hasPhoto ? (
                      <>
                        <img src="https://images.unsplash.com/photo-1549461754-4458f2762f21?q=80&w=600" className="absolute inset-0 w-full h-full object-cover opacity-40" alt="Proof" />
                        <span className="relative z-10 text-[10px] font-black text-secondary dark:text-primary uppercase tracking-widest bg-white/90 dark:bg-black/60 px-5 py-2.5 rounded-2xl border border-primary/20 backdrop-blur-md shadow-xl">Evidence Locked</span>
                      </>
                    ) : (
                      <>
                        <div className="size-14 rounded-full bg-white dark:bg-surface-dark flex items-center justify-center text-gray-300 border border-gray-100 shadow-sm">
                          <span className="material-symbols-outlined text-3xl">add_a_photo</span>
                        </div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Attach Visual Proof</span>
                      </>
                    )}
                  </button>
               </div>

               <textarea 
                 value={description}
                 onChange={(e) => setDescription(e.target.value)}
                 placeholder="Describe the claim in detail for our AI resolution hub..."
                 className="w-full h-36 rounded-[32px] bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 p-6 text-sm font-medium focus:ring-primary/20 focus:border-primary transition-all resize-none shadow-soft"
               />
            </section>

            <button 
              disabled={!reason || !description}
              onClick={analyzeDispute}
              className="w-full h-16 bg-primary text-secondary font-black uppercase tracking-[0.2em] rounded-button shadow-primary-glow flex items-center justify-center gap-3 disabled:opacity-30 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined font-black">psychology</span>
              Initiate AI Analysis
            </button>
          </>
        ) : (
          <div className="flex flex-col gap-8 animate-in zoom-in-95 duration-500">
            <section className="bg-secondary text-white p-8 rounded-[40px] shadow-2xl relative overflow-hidden text-center group border border-white/5">
               <div className="absolute top-0 right-0 size-48 bg-primary/20 blur-[80px] rounded-full"></div>
               <div className="relative z-10 flex flex-col items-center">
                  <div className="size-20 rounded-[28px] bg-primary/20 flex items-center justify-center text-primary mb-8 animate-pulse border border-primary/30 shadow-lg">
                     <span className="material-symbols-outlined text-[42px] font-black">auto_awesome</span>
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-widest mb-6">Dispute Intelligence</h3>
                  {isAnalyzing ? (
                    <div className="space-y-4 py-6">
                       <div className="size-1.5 bg-primary rounded-full animate-bounce mx-auto"></div>
                       <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Comparing Claim against Trust Ledger...</p>
                    </div>
                  ) : (
                    <div className="space-y-8">
                       <p className="text-sm font-medium leading-relaxed italic text-white/90 px-2">"{aiVerdict}"</p>
                       
                       <div className="bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10 flex items-center justify-between">
                          <div className="text-left">
                             <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">Resolution Merit</p>
                             <div className="flex items-center gap-2">
                                <p className="text-3xl font-black text-primary tracking-tighter">{probability}%</p>
                                <span className="material-symbols-outlined text-primary text-lg animate-bounce">trending_up</span>
                             </div>
                          </div>
                          <div className="text-right">
                             <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">System Action</p>
                             <div className="bg-primary/20 px-3 py-1 rounded-lg border border-primary/20">
                                <p className="text-[10px] font-black text-primary uppercase tracking-widest">Full Refund</p>
                             </div>
                          </div>
                       </div>
                    </div>
                  )}
               </div>
            </section>

            <div className="flex flex-col gap-3">
               <button 
                onClick={handleSubmit}
                className="w-full h-16 bg-primary text-secondary font-black uppercase tracking-[0.2em] rounded-[24px] shadow-lg active:scale-95 transition-all"
               >
                  Authorize Claim Submission
               </button>
               <button 
                onClick={() => setStep('FORM')}
                className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] py-4 hover:text-primary transition-colors"
               >
                  Re-submit Documentation
               </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default OrderDisputeRefund;
