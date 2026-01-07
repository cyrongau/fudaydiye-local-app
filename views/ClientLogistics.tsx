
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { useAuth } from '../Providers';

interface Shipment {
   id: string;
   status: string;
   dest: string;
   time: string;
   size: string;
   isExternal?: boolean;
   customsStatus?: 'QUEUED' | 'INSPECTING' | 'RELEASED' | 'REJECTED';
}

const ClientLogistics: React.FC = () => {
   const navigate = useNavigate();
   const { profile } = useAuth();
   const [activeTab, setActiveTab] = useState<'LOCAL' | 'CUSTOMS' | 'API'>('LOCAL');
   const [apiKey, setApiKey] = useState('sk_live_fud_••••••••••••••••');
   const [showKey, setShowKey] = useState(false);
   const [shipments, setShipments] = useState<Shipment[]>([
      { id: "FD-1290", status: "ON_WAY", dest: "Berbera", time: "1.5 hrs", size: "M" },
      { id: "GLO-882", status: "PENDING", dest: "Hargeisa", time: "3 Days", size: "L", isExternal: true, customsStatus: 'QUEUED' },
   ]);

   const handleRelease = (id: string) => {
      setShipments(prev => prev.map(s => s.id === id ? { ...s, customsStatus: 'RELEASED', status: 'ON_WAY' } : s));
   };

   return (
      <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-300">
         <header className="sticky top-0 z-40 bg-surface-light dark:bg-surface-dark border-b border-gray-100 dark:border-gray-800 px-6 py-5 flex items-center justify-between">
            <div className="flex flex-col">
               <h1 className="text-2xl font-black tracking-tight text-secondary dark:text-primary">Terminal</h1>
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Enterprise Fleet Command</p>
            </div>
            <button className="size-11 rounded-full bg-primary/10 text-primary flex items-center justify-center">
               <span className="material-symbols-outlined text-[24px] icon-filled">hub</span>
            </button>
         </header>

         <main className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto pb-32 no-scrollbar animate-in fade-in duration-500">
            <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-2xl border border-gray-200 dark:border-white/10">
               <button onClick={() => setActiveTab('LOCAL')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'LOCAL' ? 'bg-white dark:bg-surface-dark text-secondary dark:text-primary shadow-sm' : 'text-gray-400'}`}>Local</button>
               <button onClick={() => setActiveTab('CUSTOMS')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'CUSTOMS' ? 'bg-white dark:bg-surface-dark text-secondary dark:text-primary shadow-sm' : 'text-gray-400'}`}>Customs</button>
               <button onClick={() => setActiveTab('API')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'API' ? 'bg-white dark:bg-surface-dark text-secondary dark:text-primary shadow-sm' : 'text-gray-400'}`}>Developer</button>
            </div>

            {activeTab === 'API' ? (
               <div className="flex flex-col gap-6 animate-in slide-in-from-right duration-500">
                  <section className="bg-secondary text-white p-7 rounded-[40px] shadow-2xl relative overflow-hidden group">
                     <div className="absolute top-0 right-0 size-32 bg-primary/20 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
                     <div className="relative z-10">
                        <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4">Enterprise Logistics API</h3>
                        <p className="text-sm font-medium leading-relaxed opacity-80 uppercase tracking-widest">
                           Integrate Fudaydiye dispatch into your own storefront or ERP system.
                        </p>
                     </div>
                  </section>

                  <section className="bg-white dark:bg-surface-dark p-6 rounded-[32px] border border-gray-100 dark:border-white/5 shadow-soft space-y-6">
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Live Secret Key</label>
                        <div className="h-14 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center px-4 font-mono text-xs overflow-hidden">
                           <span className="flex-1 truncate">{showKey ? 'sk_live_fud_88219xPqLm02Kz99ZaAdP' : apiKey}</span>
                           <button onClick={() => setShowKey(!showKey)} className="size-10 flex items-center justify-center text-gray-400">
                              <span className="material-symbols-outlined">{showKey ? 'visibility_off' : 'visibility'}</span>
                           </button>
                        </div>
                     </div>

                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Webhook Endpoint</label>
                        <input
                           defaultValue="https://api.yourcompany.so/webhooks/fudaydiye"
                           className="w-full h-14 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-4 text-xs font-bold text-secondary dark:text-white"
                        />
                     </div>

                     <button className="w-full h-14 bg-primary text-secondary font-black text-[10px] uppercase tracking-[0.2em] rounded-xl shadow-lg active:scale-95 transition-all">
                        Sync Configuration
                     </button>
                  </section>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-5 bg-white dark:bg-surface-dark rounded-3xl border border-gray-100 shadow-sm">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">API Usage</p>
                        <p className="text-xl font-black text-secondary dark:text-white">4.2k / 10k</p>
                     </div>
                     <div className="p-5 bg-white dark:bg-surface-dark rounded-3xl border border-gray-100 shadow-sm">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Avg Latency</p>
                        <p className="text-xl font-black text-primary">124ms</p>
                     </div>
                  </div>
               </div>
            ) : activeTab === 'LOCAL' ? (
               <div className="flex flex-col gap-4">
                  {shipments.filter(s => !s.isExternal).map(shp => (
                     <div key={shp.id} className="bg-white dark:bg-surface-dark p-5 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-soft flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                              <span className="material-symbols-outlined">local_shipping</span>
                           </div>
                           <div>
                              <h4 className="text-sm font-black text-secondary dark:text-white uppercase tracking-tighter leading-none mb-1.5">#{shp.id}</h4>
                              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">To: {shp.dest}</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-xs font-black text-secondary dark:text-white">{shp.time}</p>
                           <p className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-400">{shp.status}</p>
                        </div>
                     </div>
                  ))}
               </div>
            ) : (
               <div className="flex flex-col gap-6">
                  <div className="bg-blue-600 text-white p-6 rounded-[32px] shadow-lg relative overflow-hidden flex items-center gap-5">
                     <div className="size-12 rounded-2xl bg-white/20 flex items-center justify-center">
                        <span className="material-symbols-outlined text-3xl">verified_user</span>
                     </div>
                     <div>
                        <h4 className="text-sm font-black uppercase tracking-widest leading-none mb-1">Global Verification</h4>
                        <p className="text-[10px] font-bold text-white/70 uppercase">Reviewing external arrivals.</p>
                     </div>
                  </div>

                  {shipments.filter(s => s.isExternal).map(shp => (
                     <div key={shp.id} className="bg-white dark:bg-surface-dark p-6 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-soft flex flex-col gap-5">
                        <div className="flex justify-between items-start">
                           <div className="flex items-center gap-4">
                              <div className="size-14 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 flex items-center justify-center">
                                 <span className="material-symbols-outlined text-[32px]">flight_land</span>
                              </div>
                              <div>
                                 <h4 className="text-sm font-black text-secondary dark:text-white uppercase tracking-tighter mb-1">Package ID: {shp.id}</h4>
                                 <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${shp.customsStatus === 'QUEUED' ? 'bg-gray-100 text-gray-500' :
                                       shp.customsStatus === 'INSPECTING' ? 'bg-amber-100 text-amber-600' :
                                          'bg-green-100 text-green-700'
                                    }`}>
                                    {shp.customsStatus}
                                 </span>
                              </div>
                           </div>
                        </div>

                        {shp.customsStatus !== 'RELEASED' && (
                           <div className="flex gap-2">
                              <button onClick={() => handleRelease(shp.id)} className="flex-1 h-12 bg-primary text-secondary font-black text-[10px] uppercase tracking-[0.2em] rounded-xl shadow-lg active:scale-95 transition-all">Verify & Release</button>
                              <button className="flex-1 h-12 bg-gray-50 dark:bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-red-500 border border-red-100 dark:border-red-900/20">Flag Hold</button>
                           </div>
                        )}
                     </div>
                  ))}
               </div>
            )}
         </main>
         <BottomNav />
      </div>
   );
};

export default ClientLogistics;
