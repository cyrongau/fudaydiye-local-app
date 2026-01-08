
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, Timestamp, doc, deleteDoc, getDocs } from 'firebase/firestore';
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
   const [communicationChannel, setCommunicationChannel] = useState<'EMAIL' | 'SMS' | 'WHATSAPP'>('EMAIL');
   const [useTemplate, setUseTemplate] = useState(false);
   const [selectedTemplate, setSelectedTemplate] = useState('abandoned_cart_recovery');

   const WHATSAPP_TEMPLATES = [
      { id: 'abandoned_cart_recovery', name: 'Standard Recovery (Default)' },
      { id: 'cart_reminder_discount', name: 'Reminder + 5% Discount' },
      { id: 'urgent_stock_alert', name: 'Urgent Stock Alert' }
   ];

   useEffect(() => {
      let active = true;

      const fetchCarts = async () => {
         try {
            // Show carts not updated in the last 24 hours
            const oneDayAgo = Date.now() - 86400000;
            const q = query(
               collection(db, "carts"),
               where("status", "==", "ACTIVE")
            );

            const snap = await getDocs(q);
            if (!active) return;

            const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as CartNode));

            // Client-side filtering for > 24h and sorting
            const abandoned = data.filter(c => {
               const updatedTime = c.updatedAt?.seconds ? c.updatedAt.seconds * 1000 : 0;
               return updatedTime < oneDayAgo;
            }).sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0));

            // If vendor role, filter for items belonging to them
            if (role === 'VENDOR') {
               setCarts(abandoned.filter(c => c.items.some(i => i.vendorId === user?.uid)));
            } else {
               setCarts(abandoned);
            }
            setLoading(false);
         } catch (e) {
            console.error("Abandonment setup error", e);
            setLoading(false);
         }
      };

      fetchCarts();

      return () => { active = false; };
   }, [role, user]);

   const generateRecoveryPrompt = async (cart: CartNode) => {
      setIsGenerating(cart.id);
      try {
         const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
         const ai = new GoogleGenAI({ apiKey });
         const itemNames = cart.items.map(i => i.name).join(', ');
         const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: [{
               role: 'user', parts: [{
                  text: `Generate a persuasive recovery message for a customer who abandoned a cart with: ${itemNames}. 
         Offer a 5% discount code 'FUDAYDIYE_BACK'. Keep it friendly and concise for WhatsApp/SMS. Mention fast delivery in Hargeisa.` }]
            }],
         });
         setRecoveryMessage(response.text || '');
      } catch (err) {
         console.error(err);
         setRecoveryMessage("Haye! We noticed items in your Fudaydiye cart. Complete your order now and get 5% off with code FUDAYDIYE_BACK!");
      } finally {
         setIsGenerating(null);
      }
   };

   const generateStrategy = async () => {
      setIsGenerating('STRATEGY');
      try {
         const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
         const ai = new GoogleGenAI({ apiKey });
         // Aggregate data for context
         const totalLost = carts.reduce((acc, c) => acc + c.totalValue, 0);
         const topItems = carts.flatMap(c => c.items).map(i => i.name).slice(0, 10).join(', ');

         const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: [{
               role: 'user', parts: [{
                  text: `Analyze this abandoned cart data: Total Potential Revenue Lost: $${totalLost}. Common abandoned items: ${topItems}.
               Generate a strategic recommendation for the Platform Admin to suggest to Vendors. 
               Focus on: 1. Promoting specific categories via Homepage Cards. 2. Running a Flash Deal. 3. Facebook Ad themes.
               Keep it concise, actionable, and professional.` }]
            }],
         });
         setRecoveryMessage(response.text || '');
      } catch (err) {
         setRecoveryMessage("Strategy Node Error: Suggest reviewing pricing competitiveness and offering free delivery thresholds.");
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
                  <div className="flex justify-between items-center mb-4">
                     <h3 className="text-[10px] font-black uppercase tracking-[0.3em]">{role === 'ADMIN' ? 'Strategic Intelligence' : 'Recovery Protocol'}</h3>
                     {role === 'VENDOR' && (
                        <div className="flex gap-2">
                           {communicationChannel === 'WHATSAPP' && (
                              <button
                                 onClick={() => setUseTemplate(!useTemplate)}
                                 className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${useTemplate ? 'bg-green-500 text-white shadow-lg' : 'bg-secondary/10 text-secondary'}`}
                              >
                                 Template Mode
                              </button>
                           )}
                           <select
                              value={communicationChannel}
                              onChange={(e) => setCommunicationChannel(e.target.value as any)}
                              className="bg-secondary/20 text-secondary border-none rounded-lg text-[9px] font-black uppercase py-1 px-2 focus:ring-0"
                           >
                              <option value="EMAIL">Email</option>
                              <option value="SMS">SMS</option>
                              <option value="WHATSAPP">WhatsApp</option>
                           </select>
                        </div>
                     )}
                  </div>
                  {(useTemplate && communicationChannel === 'WHATSAPP') ? (
                     <div className="bg-white/90 p-6 rounded-3xl border border-green-500/20 shadow-inner space-y-4 animate-in fade-in zoom-in duration-300">
                        <div className="flex items-center gap-3 mb-2">
                           <span className="material-symbols-outlined text-green-600">whatsapp</span>
                           <h4 className="text-xs font-black uppercase text-secondary">Select Business Template</h4>
                        </div>
                        <select
                           value={selectedTemplate}
                           onChange={(e) => setSelectedTemplate(e.target.value)}
                           className="w-full bg-green-50 border-none rounded-xl px-4 py-3 text-xs font-bold text-secondary focus:ring-green-500"
                        >
                           {WHATSAPP_TEMPLATES.map(t => (
                              <option key={t.id} value={t.id}>{t.name}</option>
                           ))}
                        </select>
                        <p className="text-[9px] text-gray-400 font-medium leading-relaxed">
                           Template: <span className="font-mono text-secondary">{selectedTemplate}</span>
                           <br />Warning: Templates must be pre-approved in Meta Business Manager.
                        </p>
                        <button className="w-full h-12 bg-green-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg hover:bg-green-600 transition-colors">
                           <span className="material-symbols-outlined text-sm">send</span> Send Template
                        </button>
                     </div>
                  ) : (
                     recoveryMessage ? (
                        <div className="space-y-6 animate-in zoom-in duration-300">
                           <div className="bg-white/90 p-5 rounded-3xl border border-secondary/10 shadow-inner">
                              <p className="text-xs font-medium leading-relaxed italic">"{recoveryMessage}"</p>
                           </div>
                           {role !== 'ADMIN' && (
                              <button className="w-full h-12 bg-secondary text-primary rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg hover:bg-white transition-colors">
                                 <span className="material-symbols-outlined text-sm">
                                    {communicationChannel === 'EMAIL' ? 'mail' : communicationChannel === 'SMS' ? 'textsms' : 'chat'}
                                 </span>
                                 Send {communicationChannel}
                              </button>
                           )}
                           <button onClick={() => setRecoveryMessage(null)} className="w-full text-center text-[9px] font-black uppercase tracking-widest opacity-60">Reset AI Node</button>
                        </div>
                     ) : (
                        <div className="py-10 text-center opacity-40">
                           <span className="material-symbols-outlined text-4xl mb-4">{role === 'ADMIN' ? 'lightbulb' : 'auto_awesome'}</span>
                           <p className="text-[10px] font-black uppercase tracking-widest">
                              {role === 'ADMIN'
                                 ? 'Generate high-level strategies to reduce platform-wide abandonment.'
                                 : 'Select a cart node to generate intelligence-led recovery scripts.'}
                           </p>
                           {role === 'ADMIN' && (
                              <button
                                 onClick={generateStrategy}
                                 disabled={!!isGenerating}
                                 className="mt-6 h-12 w-full bg-white text-secondary rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center shadow-lg active:scale-95 transition-all"
                              >
                                 {isGenerating === 'STRATEGY' ? 'Analyzing...' : 'Generate Insights'}
                              </button>
                           )}
                        </div>
                     )
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
