
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product } from '../types';
import { useCart } from '../Providers';

const NewArrivals: React.FC = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch only active products and sort/limit client-side to avoid mandatory composite index
    const q = query(
      collection(db, "products"),
      where("status", "==", "ACTIVE")
    );

    const unsub = onSnapshot(q, (snap) => {
      const fetched = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      // Manual client-side sort: Latest first
      fetched.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
      // Limit to 20 for the "New Arrivals" node
      setProducts(fetched.slice(0, 20));
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleQuickAdd = (p: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart({
      productId: p.id,
      name: p.name,
      price: p.basePrice,
      qty: 1,
      img: p.images?.[0] || 'https://picsum.photos/400/400',
      vendor: p.vendor,
      vendorId: p.vendorId,
      attribute: 'Standard'
    });
  };

  return (
    <div className="flex flex-col min-h-screen animate-in fade-in duration-700 bg-background-light dark:bg-background-dark font-display">
      <header className="bg-secondary text-white py-24 px-12 text-center relative overflow-hidden rounded-bl-[80px] rounded-br-[80px] shadow-2xl">
        <div className="absolute inset-0 bg-primary/5 blur-[100px] rounded-full translate-x-1/2"></div>
        <div className="relative z-10 max-w-4xl mx-auto space-y-6">
          <span className="text-[10px] font-black text-primary uppercase tracking-[0.5em] block">Fresh Dispatch Feed</span>
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter uppercase leading-[0.85]">New <span className="text-primary italic">Arrivals</span></h1>
          <p className="text-sm md:text-xl font-bold text-white/50 uppercase tracking-[0.3em] mt-8 max-w-2xl mx-auto">The very latest inventory nodes synchronized across the Hargeisa cluster.</p>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 md:px-12 mt-16 pb-40">
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[...Array(8)].map((_, i) => <div key={i} className="aspect-[3/4] rounded-[64px] bg-gray-100 dark:bg-white/5 animate-pulse"></div>)}
          </div>
        ) : products.length === 0 ? (
          <div className="py-40 text-center opacity-30 uppercase font-black tracking-widest text-xs">
            <span className="material-symbols-outlined text-6xl mb-4">inventory</span>
            <p>No new arrivals in current cycle</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
            {products.map(p => (
              <div
                key={p.id}
                onClick={() => navigate(`/customer/product/${p.id}`)}
                className="bg-white dark:bg-surface-dark rounded-[64px] p-5 border border-gray-100 dark:border-white/5 shadow-soft group hover:-translate-y-2 transition-all cursor-pointer flex flex-col"
              >
                <div className="relative aspect-[4/5] rounded-[48px] overflow-hidden bg-gray-50 dark:bg-black/20 mb-6 shadow-inner group">
                  <img src={p.images?.[0] || 'https://picsum.photos/400/500'} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-[2s]" alt="" />
                  <div className="absolute top-6 left-6 bg-primary text-secondary px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-xl border border-white/20 animate-pulse">New Node</div>
                  <button className="absolute top-6 right-6 size-11 rounded-full bg-white/95 dark:bg-black/40 backdrop-blur-md flex items-center justify-center text-gray-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 shadow-xl">
                    <span className="material-symbols-outlined">favorite</span>
                  </button>
                </div>
                <div className="px-2 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[9px] font-black text-primary uppercase tracking-[0.3em] truncate max-w-[120px]">{p.vendor}</span>
                    <div className="flex items-center gap-0.5 text-amber-400">
                      <span className="material-symbols-outlined text-[12px] fill-1">star</span>
                      <span className="text-[9px] font-black text-gray-400">5.0</span>
                    </div>
                  </div>
                  <h4 className="text-base font-black text-secondary dark:text-white uppercase leading-tight line-clamp-2 mb-6 tracking-tight">{p.name}</h4>
                  <div className="mt-auto flex items-center justify-between pt-5 border-t border-gray-50 dark:border-white/5">
                    <span className="text-2xl font-black text-secondary dark:text-white tracking-tighter">${p.basePrice.toFixed(2)}</span>
                    <button
                      onClick={(e) => handleQuickAdd(p, e)}
                      className="size-14 bg-secondary text-primary rounded-[24px] shadow-2xl flex items-center justify-center active:scale-90 transition-all hover:bg-primary hover:text-secondary group/btn"
                    >
                      <span className="material-symbols-outlined font-black group-hover/btn:scale-110 transition-transform text-3xl">add</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default NewArrivals;
