
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart, useAuth, useWishlist } from '../Providers';
import { collection, query, orderBy, onSnapshot, limit, where, getDoc, getDocs, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product, CMSContent, CategoryNode, LiveSaleSession, UserProfile } from '../types';

import CategoryRail from '../components/CategoryRail';
import CustomerLogisticsPanel from '../components/CustomerLogisticsPanel';
import HomeBentoGrid from '../components/HomeBentoGrid';
import SeasonEssentialsGrid from '../components/SeasonEssentialsGrid';

const useAutoScroll = (ref: React.RefObject<HTMLDivElement>, intervalMs = 3000, scrollAmount = 300) => {
   useEffect(() => {
      const el = ref.current;
      if (!el) return;

      let interval: NodeJS.Timeout;
      let isPaused = false;

      const start = () => {
         interval = setInterval(() => {
            if (!el || isPaused) return;

            // Check if we are at the end (with small tolerance)
            const isAtEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 10;

            if (isAtEnd) {
               el.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
               el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            }
         }, intervalMs);
      };

      const pause = () => { isPaused = true; };
      const resume = () => { isPaused = false; };

      el.addEventListener('mouseenter', pause);
      el.addEventListener('mouseleave', resume);
      el.addEventListener('touchstart', pause);
      el.addEventListener('touchend', resume);

      start();

      return () => {
         clearInterval(interval);
         if (el) {
            el.removeEventListener('mouseenter', pause);
            el.removeEventListener('mouseleave', resume);
            el.removeEventListener('touchstart', pause);
            el.removeEventListener('touchend', resume);
         }
      };
   }, [ref, intervalMs, scrollAmount]);
};

const WebCustomerHome: React.FC = () => {

   const navigate = useNavigate();
   const { addToCart } = useCart();
   const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
   const [products, setProducts] = useState<Product[]>([]);
   const [flashDeals, setFlashDeals] = useState<Product[]>([]);
   const [heroSlides, setHeroSlides] = useState<CMSContent[]>([]);
   const [categories, setCategories] = useState<CategoryNode[]>([]);
   const [liveSessions, setLiveSessions] = useState<LiveSaleSession[]>([]);
   const [scheduledSessions, setScheduledSessions] = useState<LiveSaleSession[]>([]);
   const [featuredLive, setFeaturedLive] = useState<LiveSaleSession | null>(null);
   const [loading, setLoading] = useState(true);
   const [activeHero, setActiveHero] = useState(0);
   const [activeTab, setActiveTab] = useState<'NEW' | 'BEST' | 'POPULAR'>('NEW');

   const [mobileAds, setMobileAds] = useState<CMSContent[]>([]);
   const [promoCards, setPromoCards] = useState<CMSContent[]>([]);

   // Refs for auto-scrolling
   const catRef = React.useRef<HTMLDivElement>(null);

   // Apply auto-scroll (slower for categories, faster snap for cards)
   useAutoScroll(catRef, 4000, 200);

   // 1. Static Content Subscriptions (Run Once)
   useEffect(() => {
      // Categories
      const unsubCats = onSnapshot(query(collection(db, "categories"), where("parentId", "==", null), limit(8)), (snap) => {
         if (!snap.empty) {
            setCategories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as CategoryNode)));
         } else {
            setCategories([
               { id: '1', name: 'Fashion', icon: 'checkroom', slug: 'fashion', parentId: null },
               { id: '2', name: 'Electronics', icon: 'devices', slug: 'electronics', parentId: null },
               { id: '3', name: 'Home', icon: 'chair', slug: 'home', parentId: null },
               { id: '4', name: 'Beauty', icon: 'face', slug: 'beauty', parentId: null },
               { id: '5', name: 'Fresh', icon: 'restaurant', slug: 'fresh', parentId: null },
               { id: '6', name: 'Mobiles', icon: 'smartphone', slug: 'mobiles', parentId: null },
            ]);
         }
      }, (err) => console.error("Categories Sync Error:", err));

      // Dynamic Hero Slides
      const unsubHero = onSnapshot(query(collection(db, "cms_content"), where("type", "==", "HOME_SLIDER"), where("status", "==", "PUBLISHED"), limit(5)), (snap) => {
         setHeroSlides(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as CMSContent)));
      }, (err) => console.error("Hero Sync Error:", err));

      // Mobile Ads
      const unsubAds = onSnapshot(query(collection(db, "cms_content"), where("type", "==", "MOBILE_AD"), where("status", "==", "PUBLISHED"), limit(5)), (snap) => {
         setMobileAds(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as CMSContent)));
      }, (err) => console.error("Ads Sync Error:", err));

      // Promo Cards
      const unsubPromos = onSnapshot(query(collection(db, "cms_content"), where("type", "==", "PROMO_CARD"), where("status", "==", "PUBLISHED"), limit(20)), (snap) => {
         const allCards = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as CMSContent));
         setPromoCards(allCards);
      }, (err) => console.error("Promos Sync Error:", err));

      // Sync Featured Node (Only LIVE or SCHEDULED)
      const unsubFeatured = onSnapshot(query(collection(db, "live_sessions"), where("isFeatured", "==", true), where("status", "in", ["LIVE", "SCHEDULED"]), limit(1)), (snap) => {
         if (!snap.empty) setFeaturedLive({ id: snap.docs[0].id, ...snap.docs[0].data() } as LiveSaleSession);
         else setFeaturedLive(null);
      }, (err) => console.error("Featured Live Error:", err));

      // Active Live Sale Sessions
      const unsubLive = onSnapshot(query(collection(db, "live_sessions"), where("status", "==", "LIVE"), limit(8)), (snap) => {
         setLiveSessions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as LiveSaleSession)));
      }, (err) => console.error("Live Sessions Error:", err));

      // Scheduled Sessions (for Banner)
      const unsubScheduled = onSnapshot(query(collection(db, "live_sessions"), where("status", "==", "SCHEDULED"), limit(10)), (snap) => {
         const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as LiveSaleSession));
         list.sort((a, b) => (a.scheduledAt?.seconds || 0) - (b.scheduledAt?.seconds || 0));
         setScheduledSessions(list.slice(0, 1));
      }, (err) => console.error("Scheduled Sessions Error:", err));

      // Flash Deals
      const unsubFlash = onSnapshot(query(collection(db, "products"), where("isFlashDeal", "==", true), limit(12)), (snap) => {
         const deals = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
         deals.sort((a, b) => {
            const discA = a.basePrice > 0 ? (1 - (a.salePrice || a.basePrice) / a.basePrice) : 0;
            const discB = b.basePrice > 0 ? (1 - (b.salePrice || b.basePrice) / b.basePrice) : 0;
            return discB - discA;
         });
         setFlashDeals(deals);
      }, (err) => console.error("Flash Deals Error:", err));

      return () => {
         unsubCats(); unsubHero(); unsubAds(); unsubFeatured(); unsubLive(); unsubScheduled(); unsubPromos(); unsubFlash();
      };
   }, []);

   // 2. Active Tab Product Feed (Re-runs on Tab Change)
   useEffect(() => {
      setLoading(true);
      let qProd = query(collection(db, "products"), where("status", "==", "ACTIVE"), limit(10));

      // NOTE: Ensure Compound Indexes exist for these queries in Firestore Console!
      if (activeTab === 'NEW') qProd = query(collection(db, "products"), where("status", "==", "ACTIVE"), limit(10)); // Removed sort to fix missing index error
      else if (activeTab === 'POPULAR') qProd = query(collection(db, "products"), where("status", "==", "ACTIVE"), orderBy("rating", "desc"), limit(10));

      // Use getDocs instead of onSnapshot for this specific query to avoid SDK "Internal Assertion Failed" (ID: ca9)
      // which often occurs with limit queries + memory cache in some SDK/browser combos.
      getDocs(qProd).then((snapshot) => {
         setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
         setLoading(false);
      }).catch((error) => {
         console.error("Product Feed Error:", error);
         setLoading(false);
      });

      // return () => unsubProd(); // No unsubscribe needed for getDocs
   }, [activeTab]);

   const STATIC_SLIDES = [
      { id: 's1', title: 'Fudaydiye', subtitle: 'Commerce Reimagined', featuredImage: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=1200', category: 'Welcome', ctaText: 'Start Shopping', ctaLink: '/customer/explore' },
      { id: 's2', title: 'New Arrivals', subtitle: 'Check out the latest trends', featuredImage: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1200', category: 'Fresh', ctaText: 'View Collection', ctaLink: '/customer/category/fashion' }
   ];

   useEffect(() => {
      const slideCount = heroSlides.length > 0 ? heroSlides.length : STATIC_SLIDES.length;
      if (slideCount > 1) {
         const timer = setInterval(() => setActiveHero(prev => (prev + 1) % slideCount), 5000);
         return () => clearInterval(timer);
      }
   }, [heroSlides]);

   // Flash Deal Timer Logic
   const [timeLeft, setTimeLeft] = useState("00:00:00");

   useEffect(() => {
      if (flashDeals.length === 0) return;

      // Use the earliest end time from the deals, or default to midnight
      const targetTime = flashDeals[0].flashSaleEndTime
         ? new Date(flashDeals[0].flashSaleEndTime.seconds * 1000).getTime()
         : new Date().setHours(24, 0, 0, 0);

      const interval = setInterval(() => {
         const now = new Date().getTime();
         const distance = targetTime - now;

         if (distance < 0) {
            setTimeLeft("ENDED");
            // Optionally remove ended deals here or rely on Firestore update
         } else {
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
         }
      }, 1000);

      return () => clearInterval(interval);
   }, [flashDeals]);

   return (
      <div className="flex flex-col animate-in fade-in duration-700 bg-background-light dark:bg-background-dark font-display w-full overflow-x-hidden">

         {/* 1. Dynamic Hero Slider (Desktop) / Eid Sale Banner (Mobile) */}
         <section className="relative w-full">
            {/* Desktop Only Hero */}
            {/* Desktop Only Hero - Renders ONLY if content exists */}
            {heroSlides.length > 0 && (
               <div className="hidden md:block h-[85vh] bg-secondary overflow-hidden relative group shadow-2xl">
                  {heroSlides.map((slide, idx) => (
                     <div key={idx} className={`absolute inset-0 transition-all duration-1000 ${activeHero === idx ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'}`}>
                        <div className="absolute inset-0"><img src={slide.featuredImage} className="w-full h-full object-cover grayscale-[30%] brightness-75" alt="" /><div className="absolute inset-0 bg-gradient-to-r from-secondary via-secondary/70 to-transparent"></div></div>
                        <div className="relative z-10 h-full px-12 md:px-24 flex flex-col justify-center items-start text-left">
                           <div className="max-w-3xl space-y-6">
                              <span className="bg-primary text-secondary px-5 py-2 rounded-full text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl inline-block">{slide.category}</span>
                              <h1 className="text-5xl md:text-6xl lg:text-8xl font-black text-white tracking-tight uppercase leading-[0.85]">{slide.title}</h1>
                              {slide.subtitle && <p className="text-white/80 text-lg font-medium max-w-xl">{slide.subtitle}</p>}
                              <button onClick={() => navigate(slide.ctaLink || '/customer/explore')} className="h-20 px-16 bg-primary text-secondary font-black text-sm uppercase tracking-[0.2em] rounded-2xl shadow-primary-glow active:scale-95 transition-all">{slide.ctaText}</button>
                           </div>
                           {slide.linkedProductId && <HeroProductCard productId={slide.linkedProductId} />}
                        </div>
                     </div>
                  ))}
               </div>
            )}

            {/* Mobile Optimized Hero Section */}
            <div className="md:hidden px-4 pt-4 space-y-4">
               {/* Priority 1: Featured Live Session (Live Now) */}
               {/* Priority 1: Featured LIVE Session */}
               {featuredLive && featuredLive.status === 'LIVE' && (
                  <div onClick={() => navigate(`/customer/live/${featuredLive.id}`)} className="rounded-[24px] bg-[#015754] p-5 flex flex-col relative overflow-hidden text-white shadow-2xl cursor-pointer border border-white/10 animate-in fade-in zoom-in duration-500">
                     <div className="absolute inset-0">
                        <img src={featuredLive.featuredProductImg || featuredLive.hostAvatar} className="w-full h-full object-cover opacity-40 mix-blend-overlay" alt="" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#015754] via-[#015754]/80 to-transparent"></div>
                     </div>

                     <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                           <div className="flex items-center gap-2 bg-[#06DC7F]/20 backdrop-blur-md px-3 py-1 rounded-full border border-[#06DC7F]/30">
                              <span className="size-2 bg-[#06DC7F] rounded-full animate-pulse shadow-[0_0_8px_#06DC7F]"></span>
                              <span className="text-[10px] font-black text-[#06DC7F] uppercase tracking-widest">Live Now</span>
                           </div>
                           <span className="text-[10px] font-bold bg-black/30 px-2 py-1 rounded-lg backdrop-blur-md">{featuredLive.viewerCount || 0} watching</span>
                        </div>

                        <h2 className="text-2xl font-black leading-none uppercase mb-2 line-clamp-2">{featuredLive.title}</h2>
                        <p className="text-xs text-white/70 font-bold uppercase tracking-wider mb-6">with {featuredLive.vendorName}</p>

                        <button className="w-full h-11 bg-[#06DC7F] text-[#015754] rounded-xl text-[11px] font-black uppercase tracking-[0.1em] flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] transition-transform">
                           Join Stream <span className="material-symbols-outlined text-[16px]">videocam</span>
                        </button>
                     </div>
                  </div>
               )}

               {/* Priority 2: Scheduled Live Session (Featured OR Next Scheduled) */}
               {(!featuredLive || featuredLive.status !== 'LIVE') && (featuredLive?.status === 'SCHEDULED' || scheduledSessions.length > 0) && (
                  <ScheduledBanner session={featuredLive?.status === 'SCHEDULED' ? featuredLive : scheduledSessions[0]} />
               )}

               {/* Priority 3: Hero CMS Slider (Fallback if no active/scheduled live) */}
               {(!featuredLive || featuredLive.status === 'ENDED') && scheduledSessions.length === 0 && (
                  <div className="rounded-[24px] bg-secondary p-6 text-white relative overflow-hidden shadow-lg h-[200px] flex flex-col justify-center transition-all duration-500" onClick={() => navigate((heroSlides.length > 0 ? heroSlides : STATIC_SLIDES)[activeHero % (heroSlides.length || STATIC_SLIDES.length)].ctaLink || '/customer/explore')}>
                     {(() => {
                        const slides = heroSlides.length > 0 ? heroSlides : STATIC_SLIDES;
                        const slide = slides[activeHero % slides.length];
                        return (
                           <>
                              <img key={slide.id} src={slide.featuredImage} className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay animate-in fade-in duration-1000" alt="" />
                              <div className="absolute inset-0 bg-gradient-to-r from-secondary via-secondary/80 to-transparent"></div>
                              <div className="relative z-10 max-w-[80%] animate-in slide-in-from-right-4 duration-500 key={slide.id}">
                                 <span className="bg-primary text-secondary text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider mb-2 inline-block shadow-lg">{slide.category || 'Welcome'}</span>
                                 <h2 className="text-2xl font-black leading-none mb-2 text-white uppercase tracking-tight line-clamp-2">{slide.title}</h2>
                                 <button className="bg-white text-secondary text-[10px] font-black px-5 py-2 rounded-xl uppercase tracking-widest mt-2 hover:bg-primary transition-colors">{slide.ctaText || 'Explore'}</button>
                              </div>

                              {/* Slide Indicators */}
                              {slides.length > 1 && (
                                 <div className="absolute bottom-4 right-4 flex gap-1.5">
                                    {slides.map((_, i) => (
                                       <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === (activeHero % slides.length) ? 'w-4 bg-primary' : 'w-1.5 bg-white/20'}`} />
                                    ))}
                                 </div>
                              )}
                           </>
                        );
                     })()}
                  </div>
               )}
            </div>

            {/* Dynamic Promo Cards (Bento Grid) */}
            <section className="py-6 md:py-12 w-full">
               <div className="max-w-7xl mx-auto px-6">
                  <HomeBentoGrid items={promoCards} />
               </div>
            </section>

         </section >

         {/* 2. Category Rail (Grid on Desktop / Scroll Mobile) */}
         <section className="py-8 w-full">
            <div className="max-w-7xl mx-auto px-6 text-center mb-6 md:mb-10">
               <h2 className="text-2xl md:text-3xl font-black text-secondary dark:text-white uppercase tracking-tighter">Browse Hubs</h2>
               <div className="h-1 w-12 bg-primary mx-auto mt-2 rounded-full"></div>
            </div>

            <div className="max-w-7xl mx-auto px-6">
               {/* Mobile: Scroll, Desktop: Grid */}
               <div ref={catRef} className="flex md:grid md:grid-cols-6 lg:grid-cols-8 gap-4 md:gap-8 overflow-x-auto md:overflow-visible snap-x snap-mandatory no-scrollbar pb-4 -mx-6 px-6 md:mx-0 md:px-0">
                  {categories.map((cat) => (
                     <button key={cat.id} onClick={() => navigate(`/customer/category/${cat.name.toLowerCase()}`)} className="flex flex-col items-center gap-3 group shrink-0 snap-center min-w-[80px] md:min-w-0 md:w-full">
                        <div className="size-16 md:size-24 rounded-[24px] bg-gray-50 dark:bg-white/5 flex items-center justify-center border border-gray-100 dark:border-white/10 group-hover:border-primary group-hover:bg-primary/5 group-hover:shadow-lg transition-all relative overflow-hidden">
                           {cat.imageUrl ? <img src={cat.imageUrl} className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform" /> : null}
                           <span className={`material-symbols-outlined text-[28px] md:text-[36px] ${cat.imageUrl ? 'text-white drop-shadow-md' : 'text-gray-400 dark:text-white'} group-hover:text-primary transition-colors relative z-10`}>{cat.icon || 'category'}</span>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 group-hover:text-secondary dark:group-hover:text-white transition-colors whitespace-nowrap">{cat.name}</span>
                     </button>
                  ))}
               </div>
            </div>
         </section>

         {/* Main Feed */}
         < section className="py-10 px-6 bg-gray-50/50 dark:bg-black/10" >
            <div className="max-w-7xl mx-auto">
               <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
                  <div className="flex bg-white dark:bg-surface-dark p-1.5 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5">
                     <TabBtn label="New Shipments" active={activeTab === 'NEW'} onClick={() => setActiveTab('NEW')} />
                     <TabBtn label="Best Selling" active={activeTab === 'BEST'} onClick={() => setActiveTab('BEST')} />
                     <TabBtn label="Top Rated" active={activeTab === 'POPULAR'} onClick={() => setActiveTab('POPULAR')} />
                  </div>
                  <button onClick={() => navigate('/customer/explore')} className="text-primary text-[10px] font-black uppercase tracking-[0.3em] border-b-2 border-primary pb-1">Full Dispatch Ledger</button>
               </div>
               {loading ? <div className="grid grid-cols-2 lg:grid-cols-5 gap-8">{[...Array(10)].map((_, i) => <div key={i} className="aspect-[3/4] rounded-[32px] bg-white dark:bg-white/5 animate-pulse shadow-sm"></div>)}</div> :
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 md:gap-8">
                     {products.map(prod => <ProductCard key={prod.id} product={prod} />)}
                  </div>
               }
            </div>
         </section>

         <section className="py-6 md:py-20 px-6 max-w-7xl mx-auto">
            <SeasonEssentialsGrid items={promoCards.slice(3, 6)} />
         </section>

         {/* Vendor Logo Slider - Infinite Scroll Marquee */}
         <CustomerLogisticsPanel />

      </div >
   );
};

const FeatureItem = ({ icon, label, sub }: any) => (
   <div className="flex items-center gap-5 group">
      <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner border border-primary/20 group-hover:bg-primary group-hover:text-secondary transition-all"><span className="material-symbols-outlined text-3xl font-black">{icon}</span></div>
      <div><h4 className="text-xs font-black text-secondary dark:text-white uppercase tracking-widest leading-none mb-1.5">{label}</h4><p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{sub}</p></div>
   </div>
);

const TabBtn = ({ label, active, onClick }: any) => (
   <button onClick={onClick} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${active ? 'bg-primary text-secondary shadow-lg' : 'text-gray-400 hover:text-secondary dark:hover:text-white'}`}>{label}</button>
);

const PromoBanner = ({ title, promo, img, tag, orange, link }: any) => {
   const navigate = useNavigate();
   return (
      <div onClick={() => navigate(link || '/customer/explore')} className={`h-60 md:h-80 rounded-[32px] md:rounded-[48px] ${orange ? 'bg-[#F9F0EE]' : 'bg-secondary'} p-6 md:p-10 relative overflow-hidden group cursor-pointer shadow-xl border border-white/5 hover:-translate-y-2 hover:shadow-2xl transition-all duration-500 ease-out`}>
         <div className={`absolute inset-0 bg-cover bg-center ${orange ? '' : 'opacity-30 grayscale'} group-hover:scale-110 group-hover:rotate-1 transition-transform duration-[1.5s] ease-in-out`} style={{ backgroundImage: `url("${img}")` }}></div>
         <div className="relative z-10 space-y-4 md:space-y-6 transition-transform duration-500 group-hover:-translate-y-1">
            <span className={`text-[9px] font-black ${orange ? 'text-orange-500' : 'text-primary'} uppercase tracking-[0.4em] inline-block border-b-2 border-transparent group-hover:border-current transition-all pb-1`}>{tag}</span>
            <h3 className={`text-2xl md:text-3xl font-black ${orange ? 'text-secondary' : 'text-white'} leading-none uppercase tracking-tighter`}>{title}<br /><span className={orange ? 'text-orange-500' : 'text-primary'}>{promo}</span></h3>
            <button className={`h-10 px-6 ${orange ? 'bg-secondary text-white' : 'bg-white text-secondary'} rounded-xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg group-hover:shadow-xl group-hover:scale-105`}>Shop Now</button>
         </div>
      </div>
   );
};

const LiveCard: React.FC<{ session: LiveSaleSession; onClick: () => void }> = ({ session, onClick }) => (
   <div onClick={onClick} className="relative aspect-[3/4] rounded-[40px] md:rounded-[56px] overflow-hidden bg-black shadow-2xl cursor-pointer group border border-white/10">
      <img src={session.featuredProductImg} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-[8s]" alt="" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
      <div className="absolute top-4 left-4 md:top-8 md:left-8 flex flex-col gap-2">
         <div className="bg-red-600 text-white text-[8px] md:text-[10px] font-black px-3 py-1 rounded-xl uppercase tracking-widest flex items-center gap-2 shadow-xl border border-white/10 w-fit">
            <span className="size-1.5 md:size-2 bg-white rounded-full animate-pulse shadow-[0_0_8px_#fff]"></span> Live
         </div>
         <div className="bg-black/40 backdrop-blur-md text-white text-[8px] md:text-[10px] font-black px-3 py-1 rounded-xl uppercase tracking-widest border border-white/10 w-fit">{session.viewerCount} Watching</div>
      </div>
      <div className="absolute bottom-6 left-6 right-6 md:bottom-10 md:left-10 md:right-10">
         <h3 className="text-sm md:text-xl font-black text-white uppercase tracking-tight leading-tight mb-2 group-hover:text-primary transition-colors duration-500 truncate">{session.title}</h3>
         <p className="text-[9px] md:text-[11px] font-bold text-white/50 uppercase tracking-[0.2em]">{session.vendorName}</p>
      </div>
   </div>
);

const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
   const navigate = useNavigate();
   const { addToCart } = useCart();
   const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
   const disc = product.salePrice ? Math.round((1 - product.salePrice / product.basePrice) * 100) : 0;
   return (
      <div onClick={() => navigate(`/customer/product/${product.id}`)} className="bg-white dark:bg-surface-dark rounded-[40px] p-5 border border-gray-100 dark:border-white/5 shadow-soft group hover:-translate-y-2 transition-all cursor-pointer flex flex-col h-full">
         <div className="relative aspect-square rounded-[32px] overflow-hidden bg-gray-50 dark:bg-black/20 mb-5 shadow-inner">
            <img src={product.images?.[0] || 'https://picsum.photos/400/400'} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-[2s]" alt="" />
            {disc > 0 && <div className="absolute top-4 left-4 bg-red-600 text-white text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest shadow-lg">-{disc}%</div>}
            <button onClick={(e) => {
               e.stopPropagation();
               isInWishlist(product.id) ? removeFromWishlist(product.id) : addToWishlist(product);
            }} className={`absolute top-4 right-4 size-8 bg-white rounded-full shadow-md flex items-center justify-center transition-colors z-10 ${isInWishlist(product.id) ? 'text-red-500' : 'text-gray-400 hover:text-red-500'} `}>
               <span className={`material-symbols-outlined text-[18px] ${isInWishlist(product.id) ? 'fill-current' : ''} `}>favorite</span>
            </button>
         </div>
         <div className="flex-1 flex flex-col">
            <span className="text-[9px] font-black text-primary uppercase tracking-[0.3em] truncate max-w-[100px]">{product.vendor}</span>
            <h4 className="text-sm font-black text-secondary dark:text-white uppercase leading-tight line-clamp-2 mb-6 tracking-tight">{product.name}</h4>
            <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-50 dark:border-white/5">
               <span className="text-lg font-black text-secondary dark:text-white tracking-tighter">${product.salePrice || product.basePrice}</span>
               <button onClick={(e) => { e.stopPropagation(); addToCart({ productId: product.id, name: product.name, price: product.salePrice || product.basePrice, qty: 1, img: product.images[0], vendor: product.vendor, vendorId: product.vendorId, attribute: 'Standard' }); }} className="size-11 rounded-xl shadow-2xl flex items-center justify-center active:scale-90 transition-all group/btn bg-secondary text-primary hover:bg-primary hover:text-secondary"><span className="material-symbols-outlined font-black text-2xl">shopping_bag</span></button>
            </div>
         </div>
      </div>
   );
};

const HeroProductCard: React.FC<{ productId: string }> = ({ productId }) => {
   const navigate = useNavigate();
   const { addToCart } = useCart();
   const [product, setProduct] = useState<Product | null>(null);

   useEffect(() => {
      const fetchP = async () => {
         const snap = await getDoc(doc(db, "products", productId));
         if (snap.exists()) setProduct({ id: snap.id, ...snap.data() } as Product);
      };
      if (productId) fetchP();
   }, [productId]);

   if (!product) return null;

   return (
      <div onClick={(e) => { e.stopPropagation(); navigate(`/customer/product/${product.id}`); }} className="absolute right-8 lg:right-32 top-1/2 -translate-y-1/2 w-[280px] lg:w-[320px] bg-white dark:bg-surface-dark rounded-[32px] p-4 shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] backdrop-blur-md animate-in slide-in-from-right-10 duration-700 cursor-pointer group hover:scale-105 transition-transform z-20">
         <div className="aspect-square rounded-[24px] bg-gray-50 dark:bg-white/5 overflow-hidden mb-4 relative">
            <img src={product.images?.[0]} className="w-full h-full object-cover" alt={product.name} />
            <div className="absolute top-2 right-2 bg-secondary/80 text-white text-[10px] font-black px-2 py-1 rounded-lg backdrop-blur-sm shadow-sm">${product.basePrice}</div>
         </div>
         <div>
            <h4 className="text-sm font-black text-secondary dark:text-white leading-tight line-clamp-2 mb-1">{product.name}</h4>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">{product.vendor}</p>
            <button
               onClick={(e) => {
                  e.stopPropagation();
                  addToCart({ productId: product.id, name: product.name, price: product.salePrice || product.basePrice, qty: 1, img: product.images[0], vendor: product.vendor, vendorId: product.vendorId, attribute: 'Standard' });
               }}
               className="w-full h-10 bg-primary text-secondary rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-secondary hover:text-white transition-colors flex items-center justify-center gap-2"
            >
               Add to Cart <span className="material-symbols-outlined text-[14px]">shopping_cart</span>
            </button>
         </div>
      </div>
   );
};
const ScheduledBanner = ({ session }: { session: LiveSaleSession }) => {
   const [timer, setTimer] = useState("");

   useEffect(() => {
      if (!session.scheduledAt) return;
      const target = new Date(session.scheduledAt.seconds * 1000).getTime();
      const interval = setInterval(() => {
         const now = new Date().getTime();
         const dist = target - now;
         if (dist < 0) {
            setTimer("Starting Soon");
            return;
         }
         const d = Math.floor(dist / (1000 * 60 * 60 * 24));
         const h = Math.floor((dist % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
         const m = Math.floor((dist % (1000 * 60 * 60)) / (1000 * 60));
         const s = Math.floor((dist % (1000 * 60)) / 1000);
         setTimer(`${d > 0 ? d + 'd ' : ''}${h}h ${m}m ${s}s`);
      }, 1000);
      return () => clearInterval(interval);
   }, [session]);

   return (
      <div className="rounded-[24px] bg-[#2A0A18] p-5 relative overflow-hidden text-white shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-700">
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
         <div className="absolute inset-0 bg-gradient-to-r from-purple-900/40 to-transparent mix-blend-overlay"></div>
         <div className="relative z-10">
            <div className="flex justify-between items-start mb-3">
               <span className="bg-white/10 text-white border border-white/10 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest inline-block">Upcoming Event</span>
               <div className="bg-white/20 px-2 py-1 rounded-lg backdrop-blur text-[10px] font-black font-mono tracking-widest shadow-inner">
                  {timer || "Loading..."}
               </div>
            </div>

            <h2 className="text-xl font-black leading-tight mb-1">{session.title}</h2>
            <p className="text-[10px] opacity-70 uppercase tracking-widest mb-4">
               {new Date(session.scheduledAt!.seconds * 1000).toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })} • {session.vendorName}
            </p>
            <button className="bg-white text-[#2A0A18] text-[10px] font-black px-5 py-2.5 rounded-xl uppercase tracking-wider w-full flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors">
               <span className="material-symbols-outlined text-[14px]">notifications_active</span> Remind Me
            </button>
         </div>
      </div>
   );
};

export default WebCustomerHome;
