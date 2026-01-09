
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { useAuth } from '../Providers';
import { collection, query, where, orderBy, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

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
   const { user, profile } = useAuth(); // Assuming 'user' gives us the auth object with uid
   const [activeTab, setActiveTab] = useState<'LOCAL' | 'CUSTOMS' | 'API'>('LOCAL');
   const [apiKey, setApiKey] = useState('sk_live_fud_••••••••••••••••');
   const [showKey, setShowKey] = useState(false);

   // Data State
   const [shipments, setShipments] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);

   // Form State
   const [showBookForm, setShowBookForm] = useState(false);
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [newOrder, setNewOrder] = useState({
      pickup: '',
      dropoff: '',
      size: 'Medium',
      conditions: [] as string[],
      notes: ''
   });

   // Fetch Real Orders
   useEffect(() => {
      if (!user?.uid) return;

      const fetchOrders = async () => {
         try {
            const q = query(
               collection(db, "orders"),
               where("customerId", "==", user.uid),
               where("type", "==", "LOGISTICS"),
               orderBy("createdAt", "desc")
            );

            const snap = await getDocs(q);
            const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setShipments(data);
         } catch (err) {
            console.error("Fetch orders error:", err);
         } finally {
            setLoading(false);
         }
      };

      fetchOrders();
   }, [user?.uid]);

   const handleCreateOrder = async () => {
      if (!newOrder.pickup || !newOrder.dropoff) {
         alert("Please enter pickup and dropoff locations.");
         return;
      }

      setIsSubmitting(true);
      try {
         await addDoc(collection(db, "orders"), {
            type: 'LOGISTICS',
            status: 'PENDING',
            customerId: user?.uid,
            customerName: profile?.name || 'Logistics Client',
            pickupLocation: { address: newOrder.pickup }, // Simplified for string input
            dropoffLocation: { address: newOrder.dropoff },
            packageSize: newOrder.size,
            packageConditions: newOrder.conditions,
            notes: newOrder.notes,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            price: 0, // Pending calculation
            items: [] // Structure compatibility
         });

         setShowBookForm(false);
         setNewOrder({ pickup: '', dropoff: '', size: 'Medium', conditions: [], notes: '' });
         setActiveTab('LOCAL'); // Switch to view list
      } catch (e) {
         console.error("Order creation failed", e);
         alert("Failed to create order. Please check your connection.");
      } finally {
         setIsSubmitting(false);
      }
   };

   const toggleCondition = (c: string) => {
      setNewOrder(prev =>
         prev.conditions.includes(c)
            ? { ...prev, conditions: prev.conditions.filter(x => x !== c) }
            : { ...prev, conditions: [...prev.conditions, c] }
      );
   };

   return (
      <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-300 font-display">
         {/* Top Header */}
         <header className="sticky top-0 z-50 bg-white/90 dark:bg-surface-dark/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
            <div className="flex flex-col">
               <h1 className="text-2xl font-black text-secondary dark:text-white tracking-tighter uppercase">Logistics</h1>
               <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-green-500 animate-pulse"></span>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Terminal Active</p>
               </div>
            </div>
            <div className="flex items-center gap-3">
               <button
                  onClick={() => navigate('/')}
                  className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 size-10 md:size-auto md:px-4 md:py-2 rounded-full md:rounded-xl flex items-center justify-center md:justify-start gap-2 transition-all active:scale-95"
               >
                  <span className="material-symbols-outlined text-[20px] md:text-[18px]">shopping_bag</span>
                  <div className="hidden md:flex flex-col items-start leading-none">
                     <span className="text-[8px] font-black uppercase tracking-widest opacity-60">Switch To</span>
                     <span className="text-[10px] font-black uppercase tracking-widest">Consumer Mode</span>
                  </div>
               </button>
               <button className="size-10 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center text-secondary dark:text-white border border-gray-200 dark:border-white/10">
                  <span className="material-symbols-outlined">notifications</span>
               </button>
            </div>
         </header>
         <main className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto pb-32 no-scrollbar animate-in fade-in duration-500">
            {showBookForm ? (
               <div className="animate-in slide-in-from-top-4 duration-300">
                  <div className="bg-white dark:bg-surface-dark p-6 rounded-[40px] border border-gray-100 dark:border-white/5 shadow-2xl space-y-6">
                     <div className="flex items-center justify-between">
                        <h2 className="text-lg font-black text-secondary dark:text-white uppercase tracking-tighter">New Delivery Request</h2>
                        <button onClick={() => setShowBookForm(false)} className="size-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors">
                           <span className="material-symbols-outlined text-lg">close</span>
                        </button>
                     </div>

                     <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="space-y-1.5">
                              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Pickup Location</label>
                              <input
                                 value={newOrder.pickup}
                                 onChange={e => setNewOrder({ ...newOrder, pickup: e.target.value })}
                                 className="w-full h-12 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 px-4 text-xs font-bold text-secondary dark:text-white"
                                 placeholder="Enter pickup address..."
                              />
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Dropoff Location</label>
                              <input
                                 value={newOrder.dropoff}
                                 onChange={e => setNewOrder({ ...newOrder, dropoff: e.target.value })}
                                 className="w-full h-12 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 px-4 text-xs font-bold text-secondary dark:text-white"
                                 placeholder="Enter destination address..."
                              />
                           </div>
                        </div>

                        <div className="space-y-1.5">
                           <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Package Size</label>
                           <div className="grid grid-cols-4 gap-2">
                              {['Small', 'Medium', 'Large', 'Extra Heavy'].map(size => (
                                 <button
                                    key={size}
                                    onClick={() => setNewOrder({ ...newOrder, size })}
                                    className={`h-10 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${newOrder.size === size ? 'bg-secondary text-white ring-2 ring-primary' : 'bg-gray-50 dark:bg-white/5 text-gray-400'}`}
                                 >
                                    {size}
                                 </button>
                              ))}
                           </div>
                        </div>

                        <div className="space-y-1.5">
                           <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Handling Conditions</label>
                           <div className="flex flex-wrap gap-2">
                              {['Fragile', 'Perishable', 'Liquid', 'Gas', 'Electronic', 'Document', 'Food', 'Medicine', 'Home Appliance'].map(cond => (
                                 <button
                                    key={cond}
                                    onClick={() => toggleCondition(cond)}
                                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border ${newOrder.conditions.includes(cond) ? 'bg-amber-100 border-amber-200 text-amber-700' : 'bg-transparent border-gray-200 dark:border-white/10 text-gray-400'}`}
                                 >
                                    {cond}
                                 </button>
                              ))}
                           </div>
                        </div>
                     </div>

                     <button
                        onClick={handleCreateOrder}
                        disabled={isSubmitting}
                        className="w-full h-14 bg-primary text-secondary font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                     >
                        {isSubmitting ? <span className="material-symbols-outlined animate-spin">sync</span> : 'Confirm Booking'}
                     </button>
                  </div>
               </div>
            ) : (
               <>
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
                     </div>
                  ) : activeTab === 'LOCAL' ? (
                     <div className="flex flex-col gap-4">
                        {loading ? (
                           <div className="p-10 text-center text-gray-400">Loading Fleet Data...</div>
                        ) : shipments.length === 0 ? (
                           <div className="p-10 text-center flex flex-col items-center gap-4">
                              <div className="size-16 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center text-gray-400">
                                 <span className="material-symbols-outlined text-3xl">inbox</span>
                              </div>
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No active shipments.</p>
                           </div>
                        ) : (
                           shipments.filter(s => s.type === 'LOGISTICS' && !s.isExternal).map(shp => (
                              <div key={shp.id} className="bg-white dark:bg-surface-dark p-5 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-soft flex items-center justify-between">
                                 <div className="flex items-center gap-4">
                                    <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                       <span className="material-symbols-outlined">local_shipping</span>
                                    </div>
                                    <div>
                                       <h4 className="text-sm font-black text-secondary dark:text-white uppercase tracking-tighter leading-none mb-1.5">#{shp.id.substring(0, 8)}</h4>
                                       <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">To: {typeof shp.dropoffLocation === 'string' ? shp.dropoffLocation : shp.dropoffLocation?.address || 'Unknown'}</p>
                                    </div>
                                 </div>
                                 <div className="text-right">
                                    <p className="text-[10px] font-black text-secondary dark:text-white mb-0.5">{shp.packageSize}</p>
                                    <p className={`text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-md inline-block ${shp.status === 'PENDING' ? 'bg-amber-100 text-amber-600' :
                                       shp.status === 'ON_WAY' ? 'bg-blue-100 text-blue-600' :
                                          'bg-gray-100 text-gray-500'}`}>{shp.status}</p>
                                 </div>
                              </div>
                           ))
                        )}
                        <button
                           onClick={() => setShowBookForm(true)}
                           className="fixed bottom-36 right-6 size-14 bg-primary text-secondary rounded-2xl shadow-xl flex items-center justify-center active:scale-90 transition-all z-40 border border-white/10"
                        >
                           <span className="material-symbols-outlined text-2xl font-black">add</span>
                        </button>
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
                        {/* Mock data for customs - could be real later */}
                        <div className="p-10 text-center flex flex-col items-center gap-4">
                           <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No shipments in customs queue.</p>
                        </div>
                     </div>
                  )}
               </>
            )}
         </main>
         <BottomNav />
      </div>
   );
};

export default ClientLogistics;
