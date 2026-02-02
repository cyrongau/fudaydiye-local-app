import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CMSContent } from '../types';

interface HomeBentoGridProps {
    items: CMSContent[];
}

const FALLBACK_ITEMS: CMSContent[] = [
    {
        id: 'fb1',
        title: 'Pink Fashion',
        subtitle: '$42.00',
        category: 'Women',
        featuredImage: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000', // Pink vibes
        ctaLink: '/customer/category/fashion',
        type: 'PROMO_CARD',
        status: 'PUBLISHED',
        slug: 'pink-fashion',
        content: '',
        createdAt: { seconds: 0, nanoseconds: 0 },
        updatedAt: { seconds: 0, nanoseconds: 0 }
    },
    {
        id: 'fb2',
        title: 'Autumn Frock',
        subtitle: '$56.00',
        category: 'Chocolates', // Using screenshot text, though likely 'Kids'
        featuredImage: 'https://images.unsplash.com/photo-1621452773781-0f992fd0f5d0?q=80&w=1000', // Yellow vibes
        ctaLink: '/customer/category/kids',
        type: 'PROMO_CARD',
        status: 'PUBLISHED',
        slug: 'autumn-frock',
        content: '',
        createdAt: { seconds: 0, nanoseconds: 0 },
        updatedAt: { seconds: 0, nanoseconds: 0 }
    },
    {
        id: 'fb3',
        title: 'Purple Sneakers',
        subtitle: '$80.00',
        category: 'Shoe',
        featuredImage: 'https://images.unsplash.com/photo-1560769629-975e12de9ed5?q=80&w=1000', // Purple product
        ctaLink: '/customer/category/shoes',
        type: 'PROMO_CARD',
        status: 'PUBLISHED',
        slug: 'purple-sneakers',
        content: '',
        createdAt: { seconds: 0, nanoseconds: 0 },
        updatedAt: { seconds: 0, nanoseconds: 0 }
    }
];

const COLORS = ['bg-[#FFE8F0]', 'bg-[#FBFDC9]', 'bg-[#EBE4FF]']; // Pink, Yellow, Purple

const HomeBentoGrid: React.FC<HomeBentoGridProps> = ({ items }) => {
    const navigate = useNavigate();

    // Use items or fallback if empty
    const displayItems = (items && items.length > 0) ? items : FALLBACK_ITEMS;

    // Take top 3 for this specific layout (screenshot shows 3)
    const gridItems = displayItems.slice(0, 3);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {gridItems.map((item, index) => {
                const bgColor = COLORS[index % COLORS.length];

                return (
                    <div
                        key={item.id}
                        onClick={() => navigate(item.ctaLink || '/customer/explore')}
                        className={`aspect-[4/5] md:aspect-square rounded-[48px] ${bgColor} relative group overflow-hidden cursor-pointer transition-transform duration-500 hover:-translate-y-2 hover:shadow-2xl transform-gpu`}
                        style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'translateZ(0)' }}
                    >
                        {/* Top Tag */}
                        <div className="absolute top-6 left-6 z-20">
                            <span className="bg-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-800 shadow-sm">
                                {item.category || 'Featured'}
                            </span>
                        </div>

                        {/* Title */}
                        <div className="absolute top-16 left-6 z-20 max-w-[70%]">
                            <h3 className="text-3xl md:text-4xl font-black text-gray-900 leading-[0.9] tracking-tighter">
                                {item.title}
                            </h3>
                        </div>

                        {/* Image */}
                        <div className="absolute inset-0 z-10">
                            <img
                                src={item.featuredImage}
                                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 mixture-blend-overlay"
                                alt={item.title}
                            />
                        </div>

                        {/* Bottom Glass Bar */}
                        <div className="absolute bottom-6 left-6 right-6 h-16 bg-white/30 backdrop-blur-md rounded-[24px] flex items-center justify-between px-2 pl-6 z-20 border border-white/40 shadow-sm group-hover:bg-white/40 transition-colors">
                            <span className="text-lg font-black text-gray-900 tracking-tight">
                                {item.subtitle || '$0.00'}
                            </span>
                            <button className="size-12 bg-[#1A1A1A] rounded-[20px] flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform">
                                <span className="material-symbols-outlined text-[20px]">shopping_basket</span>
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default HomeBentoGrid;
