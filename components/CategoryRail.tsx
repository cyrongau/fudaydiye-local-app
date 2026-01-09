
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CategoryNode } from '../types';

interface CategoryRailProps {
    categories: CategoryNode[];
}

const CategoryRail: React.FC<CategoryRailProps> = ({ categories }) => {
    const navigate = useNavigate();

    return (
        <section className="py-6 px-4 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black text-secondary dark:text-white">Categories</h3>
                <button onClick={() => navigate('/customer/explore')} className="text-[10px] font-bold text-primary uppercase tracking-wider">See All</button>
            </div>

            <div className="flex flex-nowrap overflow-x-auto pb-4 gap-4 md:grid md:grid-cols-6 md:gap-6 no-scrollbar snap-x snap-mandatory">
                {/* 'All' Card */}
                <div onClick={() => navigate('/customer/explore')} className="flex flex-col items-center gap-2 min-w-[72px] md:min-w-0 snap-start cursor-pointer group">
                    <div className="size-16 md:size-24 rounded-2xl bg-[#E8F5F3] dark:bg-white/5 flex items-center justify-center text-[#015754] border-2 border-transparent group-hover:border-primary transition-all shadow-sm">
                        <span className="material-symbols-outlined text-2xl md:text-3xl">grid_view</span>
                    </div>
                    <span className="text-[10px] md:text-xs font-bold text-gray-500 group-hover:text-primary transition-colors">All</span>
                </div>

                {categories.map((cat, i) => (
                    <div key={i} onClick={() => navigate(`/customer/category/${cat.name.toLowerCase()}`)} className="flex flex-col items-center gap-2 min-w-[72px] md:min-w-0 snap-start cursor-pointer group">
                        <div className="size-16 md:size-24 rounded-2xl bg-white dark:bg-white/5 shadow-sm border border-gray-100 dark:border-white/5 flex items-center justify-center text-gray-600 border-2 border-transparent group-hover:border-primary group-hover:shadow-primary-glow transition-all relative overflow-hidden">
                            {cat.imageUrl && <img src={cat.imageUrl} className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:scale-110 transition-transform" alt={cat.name} />}
                            <span className={`material-symbols-outlined text-2xl md:text-3xl relative z-10 ${cat.imageUrl ? 'text-white drop-shadow-md' : ''}`}>{cat.icon || 'category'}</span>
                        </div>
                        <span className="text-[10px] md:text-xs font-medium text-gray-600 dark:text-gray-400 group-hover:text-primary truncate max-w-full text-center transition-colors">{cat.name}</span>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default CategoryRail;
