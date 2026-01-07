
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { GoogleGenAI } from "@google/genai";

const VendorAnalytics: React.FC = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('WEEKLY');
  const [isForecasting, setIsForecasting] = useState(false);
  const [strategicAdvice, setStrategicAdvice] = useState<string | null>(null);

  const stats = [
    { label: "Net Revenue", value: "$12.8k", trend: "+24%", icon: "payments", color: "text-primary" },
    { label: "Active Orders", value: "284", trend: "+12%", icon: "package_2", color: "text-blue-500" },
    { label: "Live Reach", value: "8.4k", trend: "+42%", icon: "visibility", color: "text-amber-500" },
    { label: "Return Rate", value: "1.2%", trend: "-5%", icon: "assignment_return", color: "text-purple-500" },
  ];

  const generateGrowthStrategy = async () => {
    setIsForecasting(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const context = `
        Merchant: Hodan Styles
        Market: Hargeisa, Somaliland
        Stats: Revenue $12k (up 24%), Orders 284, Reach 8.4k.
        Target: Expand to Berbera and Borama regions.
      `;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Act as a Senior Somali E-commerce consultant. Provide 3 specific, operational growth tips based on these stats for the local market. Be brief and actionable. Data: ${context}`,
      });
      setStrategicAdvice(response.text);
    } catch (error) {
      console.error("AI Error:", error);
    } finally {
      setIsForecasting(false);
    }
  };

  useEffect(() => {
    generateGrowthStrategy();
  }, []);

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
        <div>
           <h1 className="text-4xl font-black text-secondary dark:text-white tracking-tighter uppercase leading-none">Growth Engine</h1>
           <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.4em] mt-3">Strategic Performance Matrix</p>
        </div>
        <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-2xl border border-gray-200 dark:border-white/10">
          {(['DAILY', 'WEEKLY', 'MONTHLY'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${period === p ? 'bg-white dark:bg-surface-dark text-secondary dark:text-primary shadow-sm' : 'text-gray-400'}`}>{p}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* KPI Grid */}
        <div className="lg:col-span-8 flex flex-col gap-8">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {stats.map(s => (
                <div key={s.label} className="bg-white dark:bg-surface-dark p-8 rounded-[40px] shadow-soft border border-gray-100 dark:border-white/5 group hover:border-primary/30 transition-all">
                   <div className="flex justify-between items-start mb-6">
                      <div className={`size-12 rounded-2xl ${s.color.replace('text-', 'bg-')}/10 flex items-center justify-center ${s.color} shadow-inner`}>
                         <span className="material-symbols-outlined text-[28px]">{s.icon}</span>
                      </div>
                      <span className="text-[10px] font-black text-green-500 bg-green-500/10 px-3 py-1 rounded-full uppercase tracking-widest">{s.trend}</span>
                   </div>
                   <div className="text-5xl font-black text-secondary dark:text-white tracking-tighter">{s.value}</div>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mt-2">{s.label}</p>
                </div>
              ))}
           </div>

           <section className="bg-white dark:bg-surface-dark p-10 rounded-[48px] shadow-soft border border-gray-100 dark:border-white/5">
              <div className="flex justify-between items-center mb-10">
                 <h3 className="text-xl font-black text-secondary dark:text-white uppercase tracking-tighter">Performance Curve</h3>
                 <div className="size-10 rounded-xl bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400"><span className="material-symbols-outlined">filter_list</span></div>
              </div>
              <div className="h-64 flex items-end justify-between gap-6">
                 {[40, 60, 35, 90, 75, 45, 80, 55, 100].map((h, i) => (
                   <div key={i} className="flex-1 bg-gray-50 dark:bg-white/2 rounded-t-2xl relative group">
                      <div className={`absolute bottom-0 left-0 right-0 rounded-t-2xl transition-all duration-[1.5s] ${i === 8 ? 'bg-primary shadow-primary-glow' : 'bg-secondary'}`} style={{ height: `${h}%` }}></div>
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-secondary text-primary text-[8px] font-black px-2 py-1 rounded uppercase shadow-xl">Oct {i+20}</div>
                   </div>
                 ))}
              </div>
           </section>
        </div>

        {/* AI Strategy Column */}
        <div className="lg:col-span-4 flex flex-col gap-6">
           <section className="bg-secondary text-white p-8 rounded-[40px] shadow-2xl relative overflow-hidden group border border-white/5">
              <div className="absolute top-0 right-0 size-48 bg-primary/20 blur-[80px] rounded-full"></div>
              <div className="relative z-10">
                 <div className="flex items-center gap-3 mb-8">
                    <div className="size-11 rounded-2xl bg-primary flex items-center justify-center text-secondary shadow-lg">
                       <span className="material-symbols-outlined font-black">psychology</span>
                    </div>
                    <div>
                       <h4 className="text-sm font-black uppercase tracking-widest">Merchant AI Strategist</h4>
                       <p className="text-[9px] font-bold text-primary uppercase">Deep Performance Audit</p>
                    </div>
                 </div>

                 {isForecasting ? (
                    <div className="space-y-4 py-10 flex flex-col items-center">
                       <div className="size-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                       <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Simulating Scenarios...</p>
                    </div>
                 ) : (
                    <div className="space-y-6 animate-in slide-in-from-bottom duration-700">
                       <p className="text-sm font-medium leading-relaxed italic text-white/90">
                          {strategicAdvice || "Analysis pending operational data sync."}
                       </p>
                       <button onClick={generateGrowthStrategy} className="w-full h-14 bg-white/10 border border-white/20 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 active:scale-95 transition-all">Refresh Insights</button>
                    </div>
                 )}
              </div>
           </section>

           <section className="bg-white dark:bg-surface-dark p-8 rounded-[40px] border border-gray-100 dark:border-white/5 shadow-soft">
              <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] mb-6">Regional Intensity</h3>
              <div className="space-y-6">
                 <GeoMetric label="Hargeisa Region" value="64%" color="bg-primary" />
                 <GeoMetric label="Berbera Port Area" value="18%" color="bg-blue-500" />
                 <GeoMetric label="Borama Center" value="12%" color="bg-amber-500" />
                 <GeoMetric label="Others" value="6%" color="bg-gray-400" />
              </div>
           </section>
        </div>
      </div>
    </div>
  );
};

const GeoMetric: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
  <div className="space-y-2">
     <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
        <span className="text-secondary dark:text-white">{label}</span>
        <span className="text-gray-400">{value}</span>
     </div>
     <div className="h-1.5 w-full bg-gray-50 dark:bg-white/5 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: value }}></div>
     </div>
  </div>
);

export default VendorAnalytics;
