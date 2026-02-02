import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CMSContent } from '../types';

interface SeasonEssentialsGridProps {
    items: CMSContent[];
}

const STATIC_ESSENTIALS = [
    {
        id: 'se1',
        title: "Women's Style",
        subtitle: 'Up to 70% Off',
        category: 'New Arrivals',
        featuredImage: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200',
        ctaLink: '/customer/category/fashion',
        ctaText: 'Shop Now',
        type: 'PROMO_CARD'
    },
    {
        id: 'se2',
        title: 'Handbag',
        subtitle: '15% Off',
        category: 'Accessories',
        featuredImage: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=800',
        ctaLink: '/customer/category/bags',
        ctaText: 'Shop Now',
        type: 'PROMO_CARD'
    },
    {
        id: 'se3',
        title: 'Watch',
        subtitle: '45% Off',
        category: 'Modern',
        featuredImage: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?q=80&w=800',
        ctaLink: '/customer/category/watches',
        ctaText: 'Shop Now',
        type: 'PROMO_CARD'
    }
];

const FlashSaleStrip = () => {
    const [time, setTime] = useState({ h: 2, m: 30, s: 45 });

    useEffect(() => {
        const timer = setInterval(() => {
            setTime(prev => {
                if (prev.s > 0) return { ...prev, s: prev.s - 1 };
                if (prev.m > 0) return { ...prev, m: prev.m - 1, s: 59 };
                if (prev.h > 0) return { ...prev, h: prev.h - 1, m: 59, s: 59 };
                return { h: 12, m: 0, s: 0 }; // Reset
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="bg-[#EBF9CD] dark:bg-[#1E2510] rounded-[24px] p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm border border-[#DCEBC0] dark:border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none">
                <span className="material-symbols-outlined text-9xl text-[#B9D989]">bolt</span>
            </div>

            <div className="flex items-center gap-4 z-10">
                <span className="font-black text-lg md:text-xl uppercase tracking-tighter text-[#2a3c0e] dark:text-[#EBF9CD]">Flash Sale</span>
                <div className="h-6 w-[1px] bg-[#2a3c0e]/20 dark:bg-[#EBF9CD]/20"></div>
                <span className="text-xs font-bold text-[#556b2f] dark:text-[#B9D989] uppercase tracking-widest">Ending Soon</span>
            </div>

            <div className="flex items-center gap-2 md:gap-4 font-black text-2xl md:text-4xl text-[#2a3c0e] dark:text-white font-mono z-10">
                <div className="bg-white dark:bg-black/20 rounded-xl p-2 min-w-[60px] text-center shadow-sm">00</div>
                <span className="text-[#B9D989]">:</span>
                <div className="bg-white dark:bg-black/20 rounded-xl p-2 min-w-[60px] text-center shadow-sm">{time.h.toString().padStart(2, '0')}</div>
                <span className="text-[#B9D989]">:</span>
                <div className="bg-white dark:bg-black/20 rounded-xl p-2 min-w-[60px] text-center shadow-sm">{time.m.toString().padStart(2, '0')}</div>
                <span className="text-[#B9D989]">:</span>
                <div className="bg-white dark:bg-black/20 rounded-xl p-2 min-w-[60px] text-center shadow-sm text-[#EB5757]">{time.s.toString().padStart(2, '0')}</div>
            </div>

            <button className="bg-[#2a3c0e] hover:bg-[#3d5218] text-[#EBF9CD] rounded-xl px-8 py-3 font-black text-xs uppercase tracking-[0.2em] transition-all shadow-lg z-10">
                Explore Deals
            </button>
        </div>
    );
};

const SeasonEssentialsGrid: React.FC<SeasonEssentialsGridProps> = ({ items }) => {
    const navigate = useNavigate();
    // Use CMS items if available (at least 3), otherwise fallback
    const displayItems = (items && items.length >= 3) ? items : STATIC_ESSENTIALS;

    const largeItem = displayItems[0];
    const smallItemTop = displayItems[1];
    const smallItemBottom = displayItems[2];

    return (
        <div className="w-full">
            <FlashSaleStrip />

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-auto md:h-[500px]">
                {/* Left Large Card (7 cols) */}
                <div
                    onClick={() => navigate(largeItem.ctaLink || '/customer/explore')}
                    className="md:col-span-7 h-[400px] md:h-full bg-[#F4F6F8] dark:bg-white/5 rounded-[40px] relative group overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all border border-gray-100 dark:border-white/5"
                >
                    <div className="absolute right-0 bottom-0 top-0 w-3/4 bg-contain bg-bottom bg-no-repeat transition-transform duration-700 group-hover:scale-105 origin-bottom-right" style={{ backgroundImage: `url("${largeItem.featuredImage}")` }}></div>

                    <div className="absolute top-0 left-0 bottom-0 w-1/2 p-8 md:p-12 flex flex-col justify-center z-10 bg-gradient-to-r from-[#F4F6F8] via-[#F4F6F8]/80 to-transparent dark:from-[#1a1a1a] dark:via-[#1a1a1a]/80">
                        <span className="text-[#015754] text-xs font-black uppercase tracking-[0.25em] mb-4 bg-white/50 backdrop-blur w-fit px-3 py-1 rounded-lg">{largeItem.category || 'Collection'}</span>
                        <h3 className="text-4xl md:text-6xl font-black text-secondary dark:text-white leading-[0.9] tracking-tighter mb-4">
                            {largeItem.title}
                        </h3>
                        <p className="text-lg md:text-xl font-medium text-gray-500 mb-8">{largeItem.subtitle}</p>
                        <button className="w-fit bg-secondary text-white px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-primary hover:text-secondary transition-all shadow-lg flex items-center gap-2">
                            {largeItem.ctaText || 'Shop Collection'} <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </button>
                    </div>
                </div>

                {/* Right Column (5 cols) - Stacked */}
                <div className="md:col-span-5 flex flex-col gap-6 h-full">
                    {/* Top Small Item */}
                    <div
                        onClick={() => navigate(smallItemTop.ctaLink || '/customer/explore')}
                        className="flex-1 bg-[#EBE0D0] dark:bg-white/10 rounded-[32px] relative group overflow-hidden cursor-pointer shadow-sm hover:shadow-lg transition-all border border-white/10"
                    >
                        <div className="absolute right-4 bottom-0 top-4 w-1/2 bg-contain bg-center bg-no-repeat transition-transform duration-500 group-hover:-translate-x-2" style={{ backgroundImage: `url("${smallItemTop.featuredImage}")` }}></div>
                        <div className="absolute inset-0 p-8 flex flex-col justify-center items-start z-10">
                            <span className="bg-[#015754] text-white text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider mb-2">{smallItemTop.subtitle || 'Sale'}</span>
                            <h3 className="text-2xl md:text-3xl font-black text-[#2A1B0A] dark:text-white leading-none mb-4">{smallItemTop.title}</h3>
                            <span className="text-[10px] font-bold underline decoration-2 underline-offset-4 hover:text-[#015754] transition-colors uppercase tracking-widest">Shop Now</span>
                        </div>
                    </div>

                    {/* Bottom Small Item */}
                    <div
                        onClick={() => navigate(smallItemBottom.ctaLink || '/customer/explore')}
                        className="relative flex-1 bg-[#D4E2E0] dark:bg-white/15 rounded-[32px] group overflow-hidden cursor-pointer shadow-sm hover:shadow-lg transition-all border border-white/10"
                    >
                        <div className="absolute right-0 top-0 bottom-0 w-2/3 bg-cover bg-center transition-transform duration-700 group-hover:scale-110 grayscale-[20%] group-hover:grayscale-0" style={{ backgroundImage: `url("${smallItemBottom.featuredImage}")` }}></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-[#D4E2E0] via-[#D4E2E0]/80 to-transparent dark:from-black dark:via-black/50"></div>
                        <div className="absolute inset-0 p-8 flex flex-col justify-end z-10">
                            <div className="bg-white/30 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-lg w-fit">
                                <h4 className="text-xs font-black text-[#015754] uppercase tracking-widest mb-1">{smallItemBottom.category}</h4>
                                <h3 className="text-xl font-black text-[#015754] dark:text-white leading-none">{smallItemBottom.title}</h3>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SeasonEssentialsGrid;
