
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile } from '../types';

const VendorList: React.FC = () => {
   const navigate = useNavigate();
   const [vendors, setVendors] = useState<UserProfile[]>([]);
   const [loading, setLoading] = useState(true);
   const [search, setSearch] = useState('');

   useEffect(() => {
      const q = query(collection(db, "users"), where("role", "==", "VENDOR"));
      const unsub = onSnapshot(q, (snap) => {
         setVendors(snap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile)));
         setLoading(false);
      });
      return () => unsub();
   }, []);

   const filtered = vendors.filter(v =>
      v.vendorStatus !== 'SUSPENDED' &&
      (v.businessName?.toLowerCase().includes(search.toLowerCase()) ||
         v.fullName?.toLowerCase().includes(search.toLowerCase()))
   );

   return (
      <div className="flex flex-col min-h-screen animate-in fade-in duration-700 bg-background-light dark:bg-background-dark font-display">
         <header className="bg-secondary text-white py-24 px-12 text-center relative overflow-hidden rounded-bl-[80px] rounded-br-[80px] md:rounded-bl-[120px] md:rounded-br-[120px] shadow-2xl">
            <div className="absolute inset-0 bg-primary/10 blur-[100px] rounded-full translate-x-1/2"></div>
            <div className="relative z-10 max-w-4xl mx-auto space-y-6">
               <span className="text-[10px] font-black text-primary uppercase tracking-[0.5em] block">Verified Merchant Hub</span>
               <h1 className="text-5xl md:text-8xl font-black tracking-tighter uppercase leading-[0.85]">Shop By <span className="text-primary italic">Vendor</span></h1>
               <div className="max-w-2xl mx-auto relative mt-10">
                  <div className="h-16 md:h-20 bg-white/10 backdrop-blur-xl border-2 border-white/20 rounded-[28px] flex items-center px-8 gap-4 focus-within:border-primary transition-all shadow-2xl">
                     <span className="material-symbols-outlined text-gray-400">search</span>
                     <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search merchant identity or brand name..."
                        className="bg-transparent border-none focus:ring-0 text-white font-black text-base uppercase tracking-widest placeholder:text-white/30 flex-1"
                     />
                  </div>
               </div>
            </div>
         </header>

         <main className="max-w-7xl mx-auto w-full px-6 mt-16 pb-40">
            {loading ? (
               <div className="py-20 flex justify-center"><div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div></div>
            ) : filtered.length === 0 ? (
               <div className="py-20 text-center opacity-30 uppercase font-black tracking-widest text-xs">
                  <span className="material-symbols-outlined text-5xl mb-4">storefront</span>
                  <p>No merchant nodes found in current cluster</p>
               </div>
            ) : (
               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
                  {filtered.map(v => (
                     <div
                        key={v.uid}
                        onClick={() => navigate(`/customer/vendor/${v.uid}`)}
                        className="bg-white dark:bg-surface-dark p-6 rounded-[48px] border border-gray-100 dark:border-white/5 shadow-soft flex flex-col items-center text-center group cursor-pointer hover:-translate-y-2 transition-all hover:border-primary/20"
                     >
                        <div className="size-24 rounded-[32px] bg-primary/10 p-1 border-2 border-primary/20 shadow-inner overflow-hidden mb-6 group-hover:scale-110 transition-transform">
                           <img src={v.businessLogo || v.avatar || `https://ui-avatars.com/api/?name=${v.businessName || 'V'}&background=015754&color=06DC7F`} className="w-full h-full object-cover rounded-[28px]" alt="" />
                        </div>
                        <h3 className="text-lg font-black text-secondary dark:text-white uppercase tracking-tighter leading-tight mb-2 truncate w-full">{v.businessName || v.fullName}</h3>
                        <div className="flex items-center gap-2 mb-4">
                           <span className="text-[9px] font-black text-primary uppercase tracking-widest">Verified</span>
                           <span className="size-1 bg-gray-200 rounded-full"></span>
                           <div className="flex text-amber-400"><span className="material-symbols-outlined text-[14px] fill-1">star</span><span className="text-[10px] font-bold text-gray-400 ml-1">{v.trustTier === 'PLATINUM' ? '5.0' : '4.9'}</span></div>
                        </div>
                        <button className="mt-auto w-full h-11 bg-gray-50 dark:bg-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest text-gray-500 group-hover:bg-primary group-hover:text-secondary transition-colors">Visit Hub</button>
                     </div>
                  ))}
               </div>
            )}
         </main>
      </div>
   );
};

export default VendorList;
