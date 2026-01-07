
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, orderBy, Timestamp, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CartNode } from '../types';
import { useAuth } from '../Providers';
import { GoogleGenAI } from "@google/genai";

const AdminAbandonmentReport: React.FC = () => {
   const navigate = useNavigate();
   const { role, user } = useAuth();
   const [carts, setCarts] = useState<CartNode[]>([]);
   const [loading, setLoading] = useState(true);
   const [isGenerating, setIsGenerating] = useState<string | null>(null);
   const [recoveryMessage, setRecoveryMessage] = useState<string | null>(null);

   useEffect(() => {
      let unsub = () => { };
      try {
         // Show carts not updated in the last hour
         const oneHourAgo = new Date(Date.now() - 3600000);
         const q = query(
            collection(db, "carts"),
            where("status", "==", "ACTIVE"),
            where("updatedAt", "<", Timestamp.fromDate(oneHourAgo)),
            orderBy("updatedAt", "desc")
         );

         unsub = onSnapshot(q, (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as CartNode));
            // If vendor role, filter for items belonging to them
            if (role === 'VENDOR') {
               setCarts(data.filter(c => c.items.some(i => i.vendorId === user?.uid)));
            } else {
               setCarts(data);
            }
            setLoading(false);
         }, (err) => {
            console.error("Abandonment Report Listener Error:", err);
            setLoading(false);
         });
      } catch (e) {
         console.error("Abandonment setup error", e);
         setLoading(false);
      }

      return () => unsub();
   }, [role, user]);

   const generateRecoveryPrompt = async (cart: CartNode) => {
      setIsGenerating(cart.id);
      try {
         const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
         const itemNames = cart.items.map(i => i.name).join(', ');
         const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Generate a persuasive recovery message for a customer who abandoned a cart with: ${itemNames}. 
        Offer a 5% discount code 'FUDAYDIYE_BACK'. Keep it friendly and concise for WhatsApp/SMS. Mention fast delivery in Hargeisa.`,
         });
         setRecoveryMessage(response.text || '');
      } catch (err) {
         console.error(err);
         setRecoveryMessage("Haye! We noticed items in your Fudaydiye cart. Complete your order now and get 5% off with code FUDAYDIYE_BACK!");
      } finally {
         setIsGenerating(null);
      }
   };

   return (
      <div className="flex flex-col h-full animate-in fade-in duration-700 font-display">
         <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
            <div>
               <h1 className="text-4xl font-black text-secondary dark:text-white tracking-tighter uppercase leading-none">Lost Leads</h1>
               <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.4em] mt-3">Cart Abandonment Intelligence</p>
            </div>
            <div className="bg-primary/10 text-primary px-4 py-2 rounded-xl text-[10px] font-black uppercase border border-primary/20">
               {carts.length} Nodes Detected
            </div>
         </header>

         <main className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-8 space-y-6">
               {loading ? (
                  <div className="py-20 flex justify-center"><div className="size-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div></div>
               ) : carts.length === 0 ? (
                  <div className="py-20 text-center opacity-30 bg-white dark:bg-surface-dark rounded-[48px] border-2 border-dashed">
                     <span className="material-symbols-outlined text-6xl mb-4">shopping_cart_off</span>
                     <p className="text-xs font-black uppercase tracking-widest">No abandoned carts found</p>
                  </div>
               ) : (
                  carts.map(cart => (
                     <div key={cart.id} className="bg-white dark:bg-surface-dark p-6 rounded-[40px] border border-gray-100 dark:border-white/5 shadow-soft hover:border-primary/30 transition-all flex flex-col gap-6 group">
                        <div className="flex justify-between items-start">
                           <div className="flex items-center gap-4">
                              <div className="size-14 rounded-2xl bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400">
                                 <span className="material-symbols-outlined text-3xl">shopping_cart</span>
                              </div>
                              <div>
                                 <h4 className="text-sm font-black text-secondary dark:text-white uppercase leading-none mb-1.5">{cart.userId ? 'Registered Node' : 'Guest Identity'}</h4>
                                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Last Activity: {new Date(cart.updatedAt?.seconds * 1000).toLocaleTimeString()}</p>
                              </div>
                           </div>
                           <div className="text-right">
                              <p className="text-xl font-black text-primary tracking-tighter leading-none">${cart.totalValue.toFixed(2)}</p>
                              <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">{cart.items.length} Items</p>
                           </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                           {cart.items.map(item => (
                              <div key={item.id} className="bg-gray-50 dark:bg-white/2 px-3 py-1 rounded-lg border border-gray-100 dark:border-white/5 flex items-center gap-2">
                                 <img src={item.img} className="size-5 rounded object-cover" />
                                 <span className="text-[9px] font-bold text-secondary dark:text-white truncate max-w-[100px]">{item.name}</span>
                              </div>
                           ))}
                        </div>

                        <div className="flex gap-2 border-t border-gray-50 dark:border-white/5 pt-4">
                           <button
                              onClick={() => generateRecoveryPrompt(cart)}
                              disabled={!!isGenerating}
                              className="flex-1 h-12 bg-secondary text-primary font-black text-[10px] uppercase tracking-[0.2em] rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                           >
                              <span className={`material-symbols-outlined text-[18px] ${isGenerating === cart.id ? 'animate-spin' : ''}`}>psychology</span>
                              {isGenerating === cart.id ? 'Analyzing Logic...' : 'Build Recovery Node'}
                           </button>
                           <button onClick={() => deleteDoc(doc(db, "carts", cart.id))} className="size-12 rounded-xl bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400 hover:text-red-500"><span className="material-symbols-outlined">delete</span></button>
                        </div>
                     </div>
                  ))
               )}
            </div>

            <div className="lg:col-span-4 space-y-6">
               <section className="bg-primary text-secondary p-8 rounded-[48px] shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-20"><span className="material-symbols-outlined text-4xl">campaign</span></div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-4">Recovery Protocol</h3>
                  {recoveryMessage ? (
                     <div className="space-y-6 animate-in zoom-in duration-300">
                        <div className="bg-white/90 p-5 rounded-3xl border border-secondary/10 shadow-inner">
                           <p className="text-xs font-medium leading-relaxed italic">"{recoveryMessage}"</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                           <button className="h-12 bg-secondary text-primary rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg">
                              <span className="material-symbols-outlined text-sm">mail</span> Email
                           </button>
                           <button className="h-12 bg-green-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg">
                              <span className="material-symbols-outlined text-sm">chat</span> WhatsApp
                           </button>
                        </div>
                        <button onClick={() => setRecoveryMessage(null)} className="w-full text-center text-[9px] font-black uppercase tracking-widest opacity-60">Reset AI Node</button>
                     </div>
                  ) : (
                     <div className="py-10 text-center opacity-40">
                        <span className="material-symbols-outlined text-4xl mb-4">auto_awesome</span>
                        <p className="text-[10px] font-black uppercase tracking-widest">Select a cart node to generate intelligence-led recovery scripts.</p>
                     </div>
                  )}
               </section>

               <section className="bg-white dark:bg-surface-dark p-8 rounded-[40px] border border-gray-100 dark:border-white/5 shadow-soft">
                  <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] mb-6">Abandonment Drivers</h3>
                  <div className="space-y-6">
                     <DriverStat label="High Delivery Fee" value="42%" color="bg-red-500" />
                     <DriverStat label="Browsing/Comparison" value="38%" color="bg-blue-500" />
                     <DriverStat label="Auth Friction" value="12%" color="bg-amber-500" />
                     <DriverStat label="Payment Failure" value="8%" color="bg-primary" />
                  </div>
               </section>
            </div>
         </main>
      </div>
   );
};

const DriverStat: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
   <div className="space-y-2">
      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
         <span className="text-secondary dark:text-white">{label}</span>
         <span className="text-gray-400">{value}</span>
      </div>
      <div className="h-1 w-full bg-gray-50 dark:bg-white/5 rounded-full overflow-hidden">
         <div className={`h-full ${color}`} style={{ width: value }}></div>
      </div>
   </div>
);

export default AdminAbandonmentReport;
