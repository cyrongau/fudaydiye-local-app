
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, limit, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product, CMSContent, LiveSaleSession } from '../types';
import { useCart } from '../Providers';
import UnifiedSearch from '../components/UnifiedSearch';

const CustomerExplore: React.FC = () => {
   const navigate = useNavigate();
   const { addToCart } = useCart();

   // States
   const [products, setProducts] = useState<Product[]>([]);
   const [heroSlides, setHeroSlides] = useState<CMSContent[]>([]);
   const [liveSessions, setLiveSessions] = useState<LiveSaleSession[]>([]);
   const [loading, setLoading] = useState(true);
   const [activeHero, setActiveHero] = useState(0);
   // const [currentPage, setCurrentPage] = useState(1); // Server-side filtering handles 'limit', pagination TODO
   const [activeTag, setActiveTag] = useState('All');
   const [isSearchOpen, setIsSearchOpen] = useState(false);
   const [showFilters, setShowFilters] = useState(false);
   const [priceRange, setPriceRange] = useState<{ min: string, max: string }>({ min: '', max: '' });

   // const ITEMS_PER_PAGE = 12;

   const categoryPills = ['All', 'Fashion', 'Electronics', 'Home', 'Beauty', 'Food', 'Tech', 'Artisanal'];

   useEffect(() => {
      // 1. Sync Shop Hero Sliders (Keep Realtime)
      const qHero = query(collection(db, "cms_content"), where("type", "==", "SHOP_SLIDER"), where("status", "==", "PUBLISHED"), limit(5));
      const unsubHero = onSnapshot(qHero, (snap) => {
         setHeroSlides(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as CMSContent)));
      });

      // 2. Sync Live Sessions (Keep Realtime)
      const qLive = query(collection(db, "live_sessions"), where("status", "in", ["LIVE", "SCHEDULED"]), limit(12));
      const unsubLive = onSnapshot(qLive, (snap) => {
         const sessions = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as LiveSaleSession));
         const validSessions = sessions.filter(s => {
            if (s.status === 'LIVE' && (s.viewerCount || 0) < 0) return false;
            return true;
         });
         validSessions.sort((a, b) => {
            if (a.status === b.status) return (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0);
            return a.status === 'LIVE' ? -1 : 1;
         });
         setLiveSessions(validSessions);
      });

      const heroTimer = setInterval(() => {
         setActiveHero(prev => (prev + 1) % Math.max(1, heroSlides.length));
      }, 8000);

      return () => { unsubHero(); unsubLive(); clearInterval(heroTimer); };
   }, []);

   const [hasMore, setHasMore] = useState(true);
   const isLoadMore = useRef(false);

   // Reset on filter change
   useEffect(() => {
      setProducts([]);
      setHasMore(true);
      isLoadMore.current = false;
      fetchProducts(true);
   }, [activeTag, priceRange.min, priceRange.max]);

   const fetchProducts = async (isReset: boolean = false) => {
      setLoading(true);
      try {
         const params: any = { limit: 20 };
         if (activeTag !== 'All') params.category = activeTag;
         if (priceRange.min) params.minPrice = Number(priceRange.min);
         if (priceRange.max) params.maxPrice = Number(priceRange.max);

         if (!isReset && products.length > 0) {
            const lastProduct = products[products.length - 1];
            params.lastId = lastProduct.id;
            // Determine sort field
            if (priceRange.min || priceRange.max) {
               params.lastValue = lastProduct.basePrice;
            } else {
               // Assuming createdAt is returned as object or string. 
               // Firestore usually returns Timestamp object {seconds, nanoseconds} in client SDK, 
               // but via API it might be ISO string or handled by axios transformer.
               // Let's check what came back. If it's pure JSON from NestJS serialize, it might be ISO string.
               // We pass it as is.
               params.lastValue = (lastProduct as any).createdAt;
            }
         }

         const { api } = await import('../src/services/api');
         const res = await api.get('/search/products', { params });
         const newProducts = res.data.results || [];

         if (newProducts.length < 20) {
            setHasMore(false);
         }

         setProducts(prev => isReset ? newProducts : [...prev, ...newProducts]);

      } catch (err) {
         console.error("Failed to fetch products", err);
      } finally {
         setLoading(false);
         isLoadMore.current = false;
      }
   };

   // Initial Load
   // useEffect handled by filter dependencies

   // Client-side filtering removed. 
   // Backend returns filtered list.
   const paginatedProducts = products;

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
      <div className="flex flex-col animate-in fade-in duration-700 bg-background-light dark:bg-background-dark font-display w-full overflow-x-hidden">

         {/* ... (Hero Sections remain same) */}

         <section className="relative h-[50vh] md:h-screen w-full bg-secondary overflow-hidden snap-start">
            {/* ... (Hero content from original file) ... */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light pointer-events-none z-10"></div>
            {heroSlides.length === 0 ? (
               <div className="absolute inset-0 flex flex-col items-center justify-center p-6 md:p-24 text-center z-0">
                  <h1 className="text-4xl md:text-7xl font-black text-white uppercase tracking-tighter leading-none mb-4 md:mb-6">Explore the <br /> Marketplace <span className="text-primary italic">Cloud</span></h1>
                  <p className="text-xs md:text-xl font-bold text-white/40 uppercase tracking-[0.4em]">Unified Inventory Protocol</p>
               </div>
            ) : heroSlides.map((slide, idx) => (
               <div
                  key={idx}
                  className={`absolute inset-0 transition-all duration-1000 ease-in-out transform ${activeHero === idx ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-full pointer-events-none'}`}
               >
                  <img src={slide.featuredImage} className="absolute inset-0 w-full h-full object-cover grayscale-[20%]" alt="" />
                  <div className="absolute inset-0 bg-gradient-to-r from-secondary via-secondary/70 to-transparent"></div>

                  <div className="relative z-10 h-full flex flex-col justify-center px-6 md:px-24 max-w-5xl space-y-4 md:space-y-8 mt-10 md:mt-0">
                     <span className="bg-primary text-secondary px-4 md:px-6 py-1.5 md:py-2 rounded-full text-[9px] md:text-[11px] font-black uppercase tracking-[0.4em] w-fit shadow-2xl animate-in slide-in-from-left">
                        {slide.category || 'Featured'}
                     </span>
                     <h1 className="text-4xl md:text-9xl font-black text-white uppercase tracking-tighter leading-[0.9] md:leading-[0.85] drop-shadow-2xl">
                        {slide.title}
                     </h1>
                     <p className="text-xs md:text-xl font-bold text-white/60 uppercase tracking-[0.2em] max-w-xs md:max-w-xl leading-relaxed line-clamp-3 md:line-clamp-none">
                        {slide.subtitle}
                     </p>
                     <button onClick={() => navigate(slide.ctaLink || '/customer/explore')} className="h-12 md:h-20 px-8 md:px-16 bg-primary text-secondary font-black text-xs md:text-sm uppercase tracking-[0.2em] rounded-[18px] md:rounded-[24px] shadow-primary-glow hover:scale-105 active:scale-95 transition-all w-fit mt-4">
                        {slide.ctaText || 'Shop Collection'}
                     </button>
                  </div>
               </div>
            ))}
            {heroSlides.length > 1 && (
               <div className="absolute bottom-6 md:bottom-12 left-6 md:left-24 z-20 flex gap-2 md:gap-3">
                  {heroSlides.map((_, i) => (
                     <button key={i} onClick={() => setActiveHero(i)} className={`h-1.5 transition-all duration-500 rounded-full ${activeHero === i ? 'w-10 md:w-20 bg-primary' : 'w-2 md:w-4 bg-white/20'}`}></button>
                  ))}
               </div>
            )}
         </section>

         {/* ... (Live Feed remains same) ... */}
         {liveSessions.length > 0 && (
            <section className="w-full bg-surface-dark py-20 px-12 relative overflow-hidden">
               {/* ...Content... */}
               <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 blur-[120px] rounded-full"></div>
               <div className="relative z-10 max-w-7xl mx-auto">
                  <div className="flex items-center justify-between mb-12">
                     <div>
                        <h2 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">Live Showcases</h2>
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mt-3">Interactive Commerce Mesh</p>
                     </div>
                     <button className="h-12 px-8 bg-white/5 border border-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">All Broadcasts</button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                     {liveSessions.map(session => (
                        <div
                           key={session.id}
                           onClick={() => navigate(`/customer/live/${session.id}`)}
                           className="relative aspect-[3/4] rounded-[32px] overflow-hidden bg-black shadow-lg border border-white/10 cursor-pointer group hover:border-primary transition-all"
                        >
                           <img src={session.featuredProductImg || "https://picsum.photos/400/600"} className="w-full h-full object-cover transition-transform duration-[10s] group-hover:scale-110" alt="" />
                           <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent"></div>

                           <div className="absolute top-3 left-3 flex items-center gap-2">
                              {session.status === 'LIVE' ? (
                                 <>
                                    <div className="bg-red-600 text-white text-[8px] font-black px-2 py-0.5 rounded-lg uppercase tracking-widest flex items-center gap-1 shadow-lg">
                                       <span className="size-1 bg-white rounded-full animate-pulse"></span>
                                       LIVE
                                    </div>
                                    <div className="bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-lg text-white text-[8px] font-black uppercase tracking-widest border border-white/10">
                                       {Math.max(0, session.viewerCount || 0)}
                                    </div>
                                 </>
                              ) : (
                                 <div className="bg-purple-600 text-white text-[8px] font-black px-2 py-0.5 rounded-lg uppercase tracking-widest flex items-center gap-1 shadow-lg">
                                    SCHEDULED
                                 </div>
                              )}
                           </div>

                           <div className="absolute bottom-4 left-4 right-4">
                              <h4 className="text-sm font-black text-white uppercase leading-tight mb-1 tracking-tight group-hover:text-primary transition-colors line-clamp-2">{session.title}</h4>
                              <p className="text-[8px] font-bold text-white/40 uppercase tracking-[0.2em] truncate">{session.vendorName}</p>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </section>
         )}

         {/* Filter Bar */}
         <section className="w-full bg-white dark:bg-surface-dark border-b border-gray-100 dark:border-white/5 sticky top-[88px] z-50 py-6 px-12 overflow-x-auto no-scrollbar flex items-center gap-4">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest pr-4 border-r border-gray-100 dark:border-white/10 shrink-0">Filter Cluster</span>
            {categoryPills.map(tag => (
               <button
                  key={tag}
                  onClick={() => { setActiveTag(tag); }}
                  className={`px-8 h-12 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-2 shrink-0 ${activeTag === tag
                     ? 'bg-secondary border-secondary text-primary shadow-lg scale-105'
                     : 'bg-transparent text-gray-400 border-gray-100 dark:border-white/5 hover:border-gray-300'
                     }`}
               >
                  {tag}
               </button>
            ))}
         </section>

         <main className="w-full px-4 md:px-12 py-10 md:py-20 space-y-8 md:space-y-16 pb-32 md:pb-20">
            {/* Search Bar & Title */}
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6 md:gap-8 mb-6 md:mb-10 text-center lg:text-left">
               <div className="flex flex-col items-center lg:items-start w-full lg:w-auto">
                  <h2 className="text-2xl md:text-4xl font-black text-secondary dark:text-white uppercase tracking-tighter leading-none">Unified <span className="text-primary italic">Shop</span></h2>
                  <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mt-2">Verified Merchant Network</p>
               </div>
               <div className="flex items-center gap-4 w-full lg:max-w-xl">
                  <div
                     onClick={() => setIsSearchOpen(true)}
                     className="flex-1 h-12 md:h-14 bg-white dark:bg-surface-dark rounded-xl md:rounded-2xl border-2 border-gray-100 dark:border-white/5 flex items-center px-4 md:px-6 gap-3 cursor-text hover:border-primary/20 transition-all shadow-sm"
                  >
                     <span className="material-symbols-outlined text-gray-400 text-[20px] md:text-[24px]">search</span>
                     <span className="text-xs md:text-sm font-bold text-gray-400 flex-1 truncate">Search or describe what you need (AI Enabled)...</span>
                  </div>
               </div>
            </div>

            {loading && products.length === 0 ? (
               <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
                  {[...Array(12)].map((_, i) => <div key={i} className="aspect-[3/4] rounded-[48px] bg-gray-100 dark:bg-white/5 animate-pulse"></div>)}
               </div>
            ) : paginatedProducts.length === 0 ? (
               <div className="py-40 text-center opacity-30 uppercase font-black tracking-widest">No nodes found in selection</div>
            ) : (
               <>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-10">
                     {paginatedProducts.map(p => (
                        <div
                           key={p.id}
                           onClick={() => navigate(`/customer/product/${p.id}`)}
                           className="bg-white dark:bg-surface-dark rounded-[32px] md:rounded-[56px] p-3 md:p-5 border border-gray-100 dark:border-white/5 shadow-soft group hover:-translate-y-2 transition-all cursor-pointer flex flex-col relative"
                        >
                           <div className="relative aspect-square rounded-[24px] md:rounded-[40px] overflow-hidden bg-gray-50 dark:bg-black/20 mb-3 md:mb-6 shadow-inner group">
                              <img src={p.images?.[0] || 'https://picsum.photos/400/400'} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-[2s]" alt="" />
                           </div>
                           <div className="px-1 md:px-2 flex-1 flex flex-col">
                              <div className="flex justify-between items-start mb-1">
                                 <span className="text-[7px] md:text-[8px] font-black text-primary uppercase tracking-[0.3em] truncate max-w-[100px]">{p.vendor}</span>
                              </div>
                              <h4 className="text-xs md:text-sm font-black text-secondary dark:text-white uppercase leading-tight line-clamp-2 mb-2 md:mb-6 tracking-tight min-h-[2.5em]">{p.name}</h4>
                              <div className="mt-auto flex items-center justify-between pt-2 md:pt-5 border-t border-gray-50 dark:border-white/5">
                                 <span className="text-sm md:text-xl font-black text-secondary dark:text-white tracking-tighter">${p.basePrice.toFixed(2)}</span>
                                 <button
                                    onClick={(e) => handleQuickAdd(p, e)}
                                    className="size-8 md:size-11 bg-secondary text-primary rounded-[14px] md:rounded-[20px] shadow-2xl flex items-center justify-center active:scale-90 transition-all hover:bg-primary hover:text-secondary group/btn"
                                 >
                                    <span className="material-symbols-outlined font-black text-base md:text-[24px] group-hover/btn:scale-110 transition-transform">add</span>
                                 </button>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>

                  {/* Load More Trigger */}
                  {hasMore && (
                     <div className="flex justify-center pt-12">
                        <button
                           onClick={() => fetchProducts(false)}
                           disabled={loading}
                           className="bg-secondary text-white px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest hover:bg-primary hover:text-secondary disabled:opacity-50 transition-all shadow-xl"
                        >
                           {loading ? 'Loading...' : 'Load More Inventory'}
                        </button>
                     </div>
                  )}
               </>
            )}
         </main>

         <UnifiedSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      </div>
   );
};

export default CustomerExplore;
