
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { GoogleGenAI } from "@google/genai";

interface InventoryItem {
  id: string;
  name: string;
  price: number;
  stock: number;
  minStock: number;
  category: string;
  img: string;
  description: string;
  aiTrend?: string;
  dailyVelocity: number;
}

const VendorInventoryStatus: React.FC = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'ALL' | 'LOW' | 'OUT'>('ALL');
  const [isForecasting, setIsForecasting] = useState(false);
  const [activeAnalysis, setActiveAnalysis] = useState<string | null>(null);

  const [items, setItems] = useState<InventoryItem[]>([
    { id: 'P-101', name: "Silk Chiffon Dirac", price: 120, stock: 15, minStock: 5, category: "Fashion", img: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=400", description: "Premium silk chiffon set.", aiTrend: "+25% Demand Spike Expected", dailyVelocity: 1.2 },
    { id: 'P-102', name: "Gorgorad Under-dress", price: 35, stock: 3, minStock: 10, category: "Fashion", img: "https://images.unsplash.com/photo-1621330396173-e41b1cafd17f?q=80&w=400", description: "Comfortable under-dress.", dailyVelocity: 4.5 },
    { id: 'P-201', name: "Galaxy S24 Ultra", price: 1150, stock: 2, minStock: 4, category: "Electronics", img: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?q=80&w=400", description: "Latest flagship phone.", aiTrend: "Restock by Tuesday", dailyVelocity: 0.4 },
    { id: 'P-301', name: "Premium Oud Wood", price: 85, stock: 12, minStock: 5, category: "Fragrance", img: "https://images.unsplash.com/photo-1547887538-e3a2f32cb1cc?q=80&w=400", description: "Natural oud pieces.", dailyVelocity: 0.8 },
    { id: 'P-401', name: "Wild Organic Honey", price: 32, stock: 0, minStock: 10, category: "Groceries", img: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?q=80&w=400", description: "Pure Somali honey.", dailyVelocity: 2.1 },
  ]);

  const runOperationalAudit = async () => {
    setIsForecasting(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const inventorySummary = items.map(i => `${i.name}: ${i.stock} units (${i.dailyVelocity}/day sales)`).join(', ');
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze this vendor inventory and provide a concise, high-impact restock recommendation for the Somaliland market. Focus on high velocity items nearing zero. Data: ${inventorySummary}`,
      });
      setActiveAnalysis(response.text);
    } catch (err) {
      console.error(err);
    } finally {
      setIsForecasting(false);
    }
  };

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
            className="h-16 px-8 bg-secondary text-primary rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all flex items-center gap-3"
           >
              <span className="material-symbols-outlined">{isForecasting ? 'sync' : 'auto_awesome'}</span>
              Generate Restock Audit
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
                 {items.slice(0, 3).map(item => (
                   <div key={item.id} className="space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                         <span className="text-secondary dark:text-white truncate max-w-[150px]">{item.name}</span>
                         <span className="text-primary">{item.dailyVelocity} / Day</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-50 dark:bg-white/5 rounded-full overflow-hidden">
                         <div className="h-full bg-primary" style={{ width: `${(item.dailyVelocity / 5) * 100}%` }}></div>
                      </div>
                   </div>
                 ))}
              </div>
           </section>

           <div className="bg-secondary text-white p-8 rounded-[40px] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 size-32 bg-primary/20 blur-3xl rounded-full"></div>
              <h4 className="text-lg font-black tracking-tighter uppercase mb-2">Replenish Alerts</h4>
              <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-6">{items.filter(i => i.stock <= i.minStock).length} Critical Nodes Detected</p>
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
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em]">Total Value: $42.4k</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {items.filter(i => {
                if (filter === 'LOW') return i.stock > 0 && i.stock <= i.minStock;
                if (filter === 'OUT') return i.stock === 0;
                return true;
              }).map(item => (
                <div key={item.id} className="bg-white dark:bg-surface-dark p-6 rounded-[32px] border border-gray-100 dark:border-white/5 shadow-soft group hover:border-primary/30 transition-all flex flex-col gap-6">
                   <div className="flex items-center gap-5">
                      <div className="size-16 rounded-2xl overflow-hidden border border-gray-100 dark:border-white/10 shrink-0">
                         <img src={item.img} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                         <h4 className="text-base font-black text-secondary dark:text-white uppercase truncate">{item.name}</h4>
                         <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">${item.price} • SKU: {item.id}</p>
                      </div>
                   </div>

                   <div className="flex justify-between items-center bg-gray-50 dark:bg-white/2 p-5 rounded-2xl">
                      <div>
                         <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">On Hand</p>
                         <span className={`text-2xl font-black ${item.stock === 0 ? 'text-red-500' : item.stock <= item.minStock ? 'text-amber-500' : 'text-secondary dark:text-white'}`}>{item.stock}</span>
                      </div>
                      <div className="text-right">
                         <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Days Remaining</p>
                         <span className="text-lg font-black text-secondary dark:text-white">{Math.floor(item.stock / item.dailyVelocity) || '--'}</span>
                      </div>
                   </div>

                   <div className="flex gap-2">
                      <button className="flex-1 h-12 bg-gray-100 dark:bg-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-primary transition-all">Order More</button>
                      <button className="size-12 bg-secondary text-primary rounded-xl flex items-center justify-center shadow-lg active:scale-90 transition-all">
                         <span className="material-symbols-outlined">sync_alt</span>
                      </button>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default VendorInventoryStatus;
