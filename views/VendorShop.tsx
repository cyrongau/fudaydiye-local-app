
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, query, where, onSnapshot, limit, orderBy, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product, UserProfile, LiveSaleSession } from '../types';
import { useCart, useAuth } from '../Providers';
import BottomNav from '../components/BottomNav';

const VendorShop: React.FC = () => {
   const { vendorId } = useParams();
   const navigate = useNavigate();
   const { user } = useAuth();
   const { addToCart } = useCart();
   const [vendor, setVendor] = useState<UserProfile | null>(null);
   const [products, setProducts] = useState<Product[]>([]);
   const [scheduledSession, setScheduledSession] = useState<LiveSaleSession | null>(null);
   const [loading, setLoading] = useState(true);
   const [activeTab, setActiveTab] = useState<'NEW' | 'OFFERS' | 'BEST'>('NEW');
   const [activeHero, setActiveHero] = useState(0);

   useEffect(() => {
      if (!vendorId) return;

      onSnapshot(doc(db, "users", vendorId), (snap) => {
         if (snap.exists()) setVendor(snap.data() as UserProfile);
      });

      const qProducts = query(collection(db, "products"), where("vendorId", "==", vendorId), where("status", "==", "ACTIVE"));
      onSnapshot(qProducts, (snap) => {
         setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
         setLoading(false);
      });

      // Sync Upcoming Session
      const qLive = query(collection(db, "live_sessions"), where("vendorId", "==", vendorId), where("status", "==", "SCHEDULED"), limit(1));
      onSnapshot(qLive, (snap) => {
         if (!snap.empty) setScheduledSession({ id: snap.docs[0].id, ...snap.docs[0].data() } as LiveSaleSession);
         else setScheduledSession(null);
      });

   }, [vendorId]);

   const handleReminder = async () => {
      if (!user) { navigate('/login'); return; }
      try {
         await addDoc(collection(db, "notifications"), {
            userId: user.uid,
            title: "Live Reminder Node Locked",
            message: `Synchronization verified. We will notify you when ${vendor?.businessName} initializes the broadcast.`,
            type: 'SYSTEM',
            isRead: false,
            createdAt: serverTimestamp()
         });
         alert("Verification code received. Reminder node active.");
      } catch (e) { alert("Mesh sync failure."); }
   };

   const filteredProducts = products.filter(p => {
      if (activeTab === 'OFFERS') return (p.salePrice || 0) > 0;
      if (activeTab === 'BEST') return (p.rating || 0) >= 4.5;
      return true;
   });

   return (
      <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark font-display">
         {/* Dynamic Header Node */}
         <section className="relative h-[65vh] min-h-[550px] bg-secondary overflow-hidden shadow-2xl">
            {scheduledSession ? (
               <div className="absolute inset-0 animate-in fade-in duration-1000">
                  <img src={scheduledSession.featuredProductImg} className="w-full h-full object-cover opacity-30 grayscale-[50%]" alt="" />
                  <div className="absolute inset-0 bg-gradient-to-t from-secondary via-secondary/70 to-transparent"></div>
                  <div className="relative z-10 h-full flex flex-col items-center justify-center p-10 text-center space-y-8">
                     <div className="bg-red-600 text-white px-6 py-2 rounded-2xl text-xs font-black uppercase tracking-[0.4em] shadow-xl animate-pulse">Upcoming Broadcast Node</div>
                     <h2 className="text-5xl md:text-8xl font-black text-white uppercase tracking-tighter leading-tight drop-shadow-2xl">{scheduledSession.title}</h2>

                     <div className="flex gap-6 md:gap-12">
                        <CountdownUnit label="Days" value="02" />
                        <CountdownUnit label="Hours" value="14" />
                        <CountdownUnit label="Mins" value="45" />
                     </div>

                     <div className="flex flex-col md:flex-row gap-4 pt-8">
                        <button onClick={handleReminder} className="h-16 px-12 bg-primary text-secondary font-black rounded-[24px] uppercase text-xs tracking-[0.2em] shadow-primary-glow active:scale-95 transition-all">Remind Me</button>
                        <button onClick={() => navigate(`/customer/product/${scheduledSession.featuredProductId}`)} className="h-16 px-12 bg-white/10 backdrop-blur-md border border-white/20 text-white font-black rounded-[24px] uppercase text-xs tracking-[0.2em] active:scale-95 transition-all">Sneak Peek</button>
                     </div>
                  </div>
               </div>
            ) : (
               <div className="absolute inset-0">
                  <img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2000" className="absolute inset-0 w-full h-full object-cover opacity-10 grayscale mix-blend-overlay" alt="" />
                  <div className="absolute inset-0 bg-gradient-to-br from-secondary/98 via-secondary/80 to-primary/10"></div>
                  <div className="relative z-10 h-full w-full flex flex-col items-center justify-center p-20 text-center space-y-8">
                     <div className="size-20 rounded-[32px] bg-primary flex items-center justify-center text-secondary shadow-primary-glow animate-float"><span className="material-symbols-outlined text-[48px] font-black">storefront</span></div>
                     <h2 className="text-5xl md:text-8xl font-black text-white uppercase tracking-tighter leading-none">{vendor?.businessName || 'Verified Merchant'}</h2>
                     <p className="text-sm font-bold text-white/40 uppercase tracking-[0.5em]">Identity Node HGR-01 Verified</p>
                  </div>
               </div>
            )}
         </section>

         <div className="max-w-7xl mx-auto w-full px-6 -mt-20 relative z-30 pb-32">
            <div className="bg-white dark:bg-surface-dark p-8 rounded-[48px] shadow-2xl border border-gray-100 dark:border-white/10 flex flex-col md:flex-row items-center justify-between gap-8 mb-16">
               <div className="flex items-center gap-6">
                  <div className="size-24 rounded-[32px] bg-primary/10 p-1 border-2 border-primary/20 shadow-inner overflow-hidden">
                     <img src={vendor?.avatar || `https://ui-avatars.com/api/?name=${vendor?.businessName}`} className="w-full h-full object-cover rounded-[28px]" alt="" />
                  </div>
                  <div>
                     <h3 className="text-2xl font-black text-secondary dark:text-white tracking-tighter uppercase leading-none mb-2">{vendor?.businessName}</h3>
                     <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">Global Marketplace Node</span>
                        <div className="flex text-amber-400"><span className="material-symbols-outlined text-[16px] fill-1">star</span><span className="text-[10px] font-black text-gray-400 ml-1">4.9 Score</span></div>
                     </div>
                  </div>
               </div>
               <div className="flex gap-4">
                  <button className="h-14 px-8 bg-gray-50 dark:bg-white/5 text-gray-400 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-gray-100">Contact</button>
                  <button className="size-14 rounded-2xl bg-secondary text-primary flex items-center justify-center shadow-lg"><span className="material-symbols-outlined font-black">share</span></button>
               </div>
            </div>

            <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-8 mb-12">
               <div className="flex gap-8">
                  <TabBtn label="Inventory" active={activeTab === 'NEW'} onClick={() => setActiveTab('NEW')} />
                  <TabBtn label="Sale Events" active={activeTab === 'OFFERS'} onClick={() => setActiveTab('OFFERS')} />
                  <TabBtn label="Highly Rated" active={activeTab === 'BEST'} onClick={() => setActiveTab('BEST')} />
               </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
               {loading ? [...Array(5)].map((_, i) => <div key={i} className="aspect-[3/4] rounded-[48px] bg-gray-50 dark:bg-white/5 animate-pulse"></div>) :
                  filteredProducts.length === 0 ? <div className="col-span-full py-40 text-center opacity-30 uppercase font-black tracking-widest text-xs">No matching nodes</div> :
                     filteredProducts.map(p => <ProductCard key={p.id} product={p} addToCart={addToCart} navigate={navigate} />)
               }
            </div>
         </div>
         <BottomNav />
      </div>
   );
};

const CountdownUnit = ({ label, value }: any) => (
   <div className="flex flex-col items-center">
      <span className="text-4xl md:text-7xl font-black text-white tracking-tighter tabular-nums">{value}</span>
      <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mt-2">{label}</span>
   </div>
);

const TabBtn = ({ label, active, onClick }: any) => (
   <button onClick={onClick} className={`text-[11px] font-black uppercase tracking-[0.2em] transition-all relative ${active ? 'text-primary' : 'text-gray-400'}`}>
      {label}
      {active && <div className="absolute -bottom-8 left-0 right-0 h-1 bg-primary rounded-full"></div>}
   </button>
);

const ProductCard = ({ product, addToCart, navigate }: any) => (
   <div onClick={() => navigate(`/customer/product/${product.id}`)} className="bg-white dark:bg-surface-dark rounded-[40px] p-4 border border-gray-100 dark:border-white/5 shadow-soft group hover:-translate-y-2 transition-all cursor-pointer flex flex-col h-full">
      <div className="relative aspect-square rounded-[32px] overflow-hidden bg-gray-50 dark:bg-black/20 mb-5"><img src={product.images[0]} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="" /></div>
      <div className="flex-1 flex flex-col">
         <h4 className="text-xs font-black text-secondary dark:text-white uppercase leading-tight line-clamp-2 mb-4">{product.name}</h4>
         <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-50 dark:border-white/5">
            <span className="text-base font-black text-secondary dark:text-white tracking-tighter">${product.basePrice}</span>
            <button onClick={(e) => { e.stopPropagation(); addToCart({ productId: product.id, name: product.name, price: product.salePrice || product.basePrice, qty: 1, img: product.images[0], vendor: product.vendor, vendorId: product.vendorId, attribute: 'Standard' }); }} className="size-9 bg-secondary text-primary rounded-xl flex items-center justify-center shadow-lg active:scale-90 transition-all"><span className="material-symbols-outlined text-[20px] font-black">add</span></button>
         </div>
      </div>
   </div>
);

export default VendorShop;
