
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleGenAI } from "@google/genai";
import { useAuth } from '../Providers';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product } from '../types';

interface InventoryItem extends Product {
   dailyVelocity: number; // Simulated or calculated from orders
   minStock: number; // Threshold for alerts
   aiTrend?: string;
}

const VendorInventoryStatus: React.FC = () => {
   const navigate = useNavigate();
   const { user } = useAuth();
   const [filter, setFilter] = useState<'ALL' | 'LOW' | 'OUT'>('ALL');
   const [isForecasting, setIsForecasting] = useState(false);
   const [activeAnalysis, setActiveAnalysis] = useState<string | null>(null);
   const [items, setItems] = useState<InventoryItem[]>([]);
   const [loading, setLoading] = useState(true);

   // Fetch Real Products
   useEffect(() => {
      if (!user) return;
      setLoading(true);

      const q = query(collection(db, "products"), where("vendorId", "==", user.uid));
      const unsubscribe = onSnapshot(q, (snapshot) => {
         const fetchedItems = snapshot.docs.map(doc => {
            const data = doc.data() as Product;
            // Simulate velocity based on rating/reviews for now, or random
            const velocity = Math.round((data.rating || 0) * (Math.random() * 2));

            return {
               id: doc.id,
               ...data,
               stock: data.baseStock || 0, // Map baseStock to stock for this view
               minStock: 5, // Default threshold
               dailyVelocity: velocity,
               img: data.images?.[0] || 'https://via.placeholder.com/400',
               price: data.salePrice > 0 ? data.salePrice : data.basePrice
            } as unknown as InventoryItem;
         });
         setItems(fetchedItems);
         setLoading(false);

         // Check for Out of Stock items for Notification
         const outOfStock = fetchedItems.filter(i => (i.baseStock || 0) <= 0);
         if (outOfStock.length > 0) {
            // Simple toast or alert simulation
            // In a real app we'd use a toast library context
            console.warn(`Action Required: ${outOfStock.length} items are out of stock.`);
         }
      });

      return () => unsubscribe();
   }, [user]);

   const runOperationalAudit = async () => {
      setIsForecasting(true);
      try {
         // Use the environment variable for API Key
         const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

         if (!apiKey) {
            setActiveAnalysis("AI Configuration Missing. Please check your API Key.");
            setIsForecasting(false);
            return;
         }

         const ai = new GoogleGenAI({ apiKey });

         // Prepare a summary of the inventory
         const inventorySummary = items
            .slice(0, 20) // Limit to 20 items to avoid token limits
            .map(i => `${i.name}: ${i.baseStock} units (${i.dailyVelocity}/day sales)`)
            .join(', ');

         const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: [
               {
                  role: 'user',
                  parts: [
                     {
                        text: `Analyze this vendor inventory and provide a concise, high-impact restock recommendation for the Somaliland market. 
                       Focus on high velocity items nearing zero. 
                       Data: ${inventorySummary}`
                     }
                  ]
               }
            ]
         });

         if (typeof response.text === 'function') {
            setActiveAnalysis(response.text());
         } else {
            // @ts-ignore
            setActiveAnalysis(response.text || JSON.stringify(response));
         }
      } catch (err) {
         console.error("AI Error:", err);
         setActiveAnalysis("Audit Failed: Unable to connect to Intelligence Grid.");
      } finally {
         setIsForecasting(false);
      }
   };

   const filteredItems = useMemo(() => {
      return items.filter(i => {
         const stock = i.baseStock || 0;
         if (filter === 'LOW') return stock > 0 && stock <= i.minStock;
         if (filter === 'OUT') return stock <= 0;
         return true; // ALL
      });
   }, [items, filter]);

   const totalValue = items.reduce((acc, i) => acc + ((i.salePrice || i.basePrice) * (i.baseStock || 0)), 0);

   if (loading) {
      return (
         <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-4">
               <div className="size-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
               <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Syncing Live Inventory...</p>
            </div>
         </div>
      );
   }

   return (
      <div className="flex flex-col h-full animate-in fade-in duration-700">
         <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
            <div>
               <h1 className="text-4xl font-black text-secondary dark:text-white tracking-tighter uppercase leading-none">Operational Logic</h1>
               <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.4em] mt-3">Stock Velocity & Reorder Hub</p>
            </div>
            <div className="flex gap-4">
               <button
                  onClick={runOperationalAudit}
                  disabled={isForecasting}
                  className="h-16 px-8 bg-secondary text-primary rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
               >
                  <span className="material-symbols-outlined">{isForecasting ? 'sync' : 'auto_awesome'}</span>
                  {isForecasting ? 'Analyzing Grid...' : 'Generate Stock Audit'}
               </button>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Analytics Wing */}
            <div className="lg:col-span-4 flex flex-col gap-6">
               {activeAnalysis && (
                  <section className="bg-primary text-secondary p-8 rounded-[40px] shadow-2xl animate-in zoom-in duration-500 relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-4 opacity-20"><span className="material-symbols-outlined text-4xl">inventory</span></div>
                     <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-4">Strategic Recommendation</h3>
                     <p className="text-sm font-black leading-relaxed italic">"{activeAnalysis}"</p>
                     <button onClick={() => setActiveAnalysis(null)} className="mt-6 text-[10px] font-black uppercase tracking-widest underline underline-offset-4 decoration-2">Dismiss Audit</button>
                  </section>
               )}

               <section className="bg-white dark:bg-surface-dark p-8 rounded-[40px] border border-gray-100 dark:border-white/5 shadow-soft">
                  <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] mb-8">Stock Velocity Matrix</h3>
                  <div className="space-y-6">
                     {items.slice(0, 5).map(item => (
                        <div key={item.id} className="space-y-2">
                           <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                              <span className="text-secondary dark:text-white truncate max-w-[150px]">{item.name}</span>
                              <span className="text-primary">{item.dailyVelocity} / Day</span>
                           </div>
                           <div className="h-1.5 w-full bg-gray-50 dark:bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full bg-primary" style={{ width: `${Math.min(((item.dailyVelocity) / 10) * 100, 100)}%` }}></div>
                           </div>
                        </div>
                     ))}
                     {items.length === 0 && <p className="text-[10px] text-gray-400 italic">No sales data available.</p>}
                  </div>
               </section>

               <div className="bg-secondary text-white p-8 rounded-[40px] shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 size-32 bg-primary/20 blur-3xl rounded-full"></div>
                  <h4 className="text-lg font-black tracking-tighter uppercase mb-2">Replenish Alerts</h4>
                  <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-6">{items.filter(i => (i.baseStock || 0) <= i.minStock).length} Critical Nodes Detected</p>
                  <button className="w-full h-14 bg-primary text-secondary font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl shadow-xl active:scale-95 transition-all">Initiate Procurement</button>
               </div>
            </div>

            {/* Data Grid Wing */}
            <div className="lg:col-span-8 flex flex-col gap-6">
               <div className="flex items-center justify-between px-2">
                  <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-2xl border border-gray-200 dark:border-white/10">
                     {(['ALL', 'LOW', 'OUT'] as const).map(f => (
                        <button
                           key={f}
                           onClick={() => setFilter(f)}
                           className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-white dark:bg-surface-dark text-secondary dark:text-primary shadow-sm' : 'text-gray-400'}`}
                        >{f}</button>
                     ))}
                  </div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em]">Total Value: ${totalValue.toLocaleString()}</p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredItems.length === 0 ? (
                     <div className="col-span-2 py-20 text-center flex flex-col items-center gap-4 opacity-50">
                        <span className="material-symbols-outlined text-4xl">inbox</span>
                        <p className="text-[10px] font-black uppercase tracking-widest">No Inventory Nodes Found</p>
                     </div>
                  ) : (
                     filteredItems.map(item => (
                        <div key={item.id} className="bg-white dark:bg-surface-dark p-6 rounded-[32px] border border-gray-100 dark:border-white/5 shadow-soft group hover:border-primary/30 transition-all flex flex-col gap-6">
                           <div className="flex items-center gap-5">
                              <div className="size-16 rounded-2xl overflow-hidden border border-gray-100 dark:border-white/10 shrink-0">
                                 <img src={item.images?.[0] || 'https://via.placeholder.com/150'} className="w-full h-full object-cover" />
                              </div>
                              <div className="min-w-0">
                                 <h4 className="text-base font-black text-secondary dark:text-white uppercase truncate">{item.name}</h4>
                                 <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">${item.salePrice || item.basePrice} • SKU: {item.id.substring(0, 6)}</p>
                              </div>
                           </div>

                           <div className="flex justify-between items-center bg-gray-50 dark:bg-white/2 p-5 rounded-2xl">
                              <div>
                                 <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">On Hand</p>
                                 <span className={`text-2xl font-black ${(item.baseStock || 0) <= 0 ? 'text-red-500' : (item.baseStock || 0) <= item.minStock ? 'text-amber-500' : 'text-secondary dark:text-white'}`}>
                                    {item.baseStock || 0}
                                 </span>
                              </div>
                              <div className="text-right">
                                 <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Days Remaining</p>
                                 <span className="text-lg font-black text-secondary dark:text-white">
                                    {item.dailyVelocity > 0 ? Math.floor((item.baseStock || 0) / item.dailyVelocity) : '∞'}
                                 </span>
                              </div>
                           </div>

                           <div className="flex gap-2">
                              <button className="flex-1 h-12 bg-gray-100 dark:bg-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-primary transition-all">Order More</button>
                              <button onClick={() => navigate('/vendor/products')} className="size-12 bg-secondary text-primary rounded-xl flex items-center justify-center shadow-lg active:scale-90 transition-all">
                                 <span className="material-symbols-outlined">edit</span>
                              </button>
                           </div>
                        </div>
                     ))
                  )}
               </div>
            </div>
         </div>
      </div>
   );
};

export default VendorInventoryStatus;
