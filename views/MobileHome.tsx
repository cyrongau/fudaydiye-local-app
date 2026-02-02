import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Providers';
import { Product, CategoryNode } from '../types';
import { collection, query, where, limit, onSnapshot, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

const MobileHome: React.FC = () => {
    const navigate = useNavigate();
    const { profile } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');

    // Data State
    const [categories, setCategories] = useState<CategoryNode[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch Categories
        const unsubCats = onSnapshot(query(collection(db, "categories"), where("parentId", "==", null), limit(8)), (snap) => {
            setCategories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as CategoryNode)));
        });

        // Fetch New Arrivals
        // Note: ensuring we don't crash if index is missing, defaulting to simple query if needed
        const fetchProducts = async () => {
            try {
                const q = query(collection(db, "products"), where("status", "==", "ACTIVE"), orderBy("createdAt", "desc"), limit(6));
                const snap = await getDocs(q);
                setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
            } catch (err) {
                console.warn("Complex query failed, falling back", err);
                const qFallback = query(collection(db, "products"), where("status", "==", "ACTIVE"), limit(6));
                const snap = await getDocs(qFallback);
                setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();

        return () => unsubCats();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#121212] font-display pb-32">
            {/* 1. Header & Search */}
            <header className="px-6 pt-12 pb-4 bg-white dark:bg-[#121212] sticky top-0 z-40">
                <div className="flex items-center justify-between mb-6">
                    <button className="size-10 rounded-full bg-white dark:bg-[#1E1E1E] shadow-sm border border-gray-100 dark:border-white/5 flex items-center justify-center">
                        <span className="material-symbols-outlined text-gray-900 dark:text-white">menu</span>
                    </button>
                    <button onClick={() => navigate('/customer/cart')} className="size-10 rounded-full bg-white dark:bg-[#1E1E1E] shadow-sm border border-gray-100 dark:border-white/5 flex items-center justify-center relative">
                        <span className="material-symbols-outlined text-gray-900 dark:text-white">shopping_bag</span>
                        <span className="absolute top-0 right-0 size-2.5 bg-red-500 rounded-full border-2 border-white dark:border-[#1E1E1E]"></span>
                    </button>
                </div>

                {/* Pill Search */}
                <div className="relative">
                    <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                    <input
                        type="text"
                        placeholder="What are you looking for?"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full h-14 bg-white dark:bg-[#1E1E1E] rounded-[28px] pl-12 pr-14 text-sm font-medium shadow-sm border-none focus:ring-2 focus:ring-primary/20 placeholder-gray-400"
                    />
                    <button className="absolute right-2 top-1/2 -translate-y-1/2 size-10 bg-white dark:bg-[#2A2A2A] rounded-full flex items-center justify-center shadow-sm">
                        <span className="material-symbols-outlined text-gray-900 dark:text-white text-[20px]">tune</span>
                    </button>
                </div>
            </header>

            <div className="px-6 space-y-8 mt-4">
                {/* 2. Green Promo Card */}
                <div className="w-full aspect-[16/9] bg-primary rounded-[32px] relative overflow-hidden p-6 flex items-center shadow-lg shadow-primary/20">
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

                    {/* Abstract Green Waves */}
                    <svg className="absolute top-0 left-0 w-full h-full opacity-30" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path d="M0 50 Q 25 30 50 50 T 100 50 L 100 100 L 0 100 Z" fill="#88D64C" />
                        <path d="M0 70 Q 25 50 50 70 T 100 70 L 100 100 L 0 100 Z" fill="#75C93B" />
                    </svg>

                    <div className="relative z-10 max-w-[65%]">
                        <span className="bg-black text-white text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest inline-block mb-3">Limited Offer</span>
                        <h2 className="text-2xl font-black text-black leading-tight mb-4">First Purchase Enjoy a Special Offer</h2>
                        <button className="h-10 px-6 bg-black text-white rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 active:scale-95 transition-transform">
                            Shop Now <span className="material-symbols-outlined text-[14px] bg-white text-black rounded-full p-0.5">arrow_outward</span>
                        </button>
                    </div>

                    {/* Model Image (Mockup) */}
                    <img src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=400&auto=format&fit=crop" className="absolute -right-4 -bottom-4 h-[110%] object-cover object-top mix-blend-multiply opacity-0" alt="Model" />
                    <img src="https://images.unsplash.com/photo-1625937751876-451518e71295?q=80&w=400" className="absolute -right-8 bottom-0 h-[85%] object-cover rotate-[-10deg] drop-shadow-2xl rounded-2xl" alt="Product" />

                    {/* Pagination Dots */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                        <div className="w-2 h-2 rounded-full bg-white/50"></div>
                        <div className="w-6 h-2 rounded-full bg-white"></div>
                        <div className="w-2 h-2 rounded-full bg-white/50"></div>
                    </div>
                </div>

                {/* 3. Categories Row */}
                <div>
                    <div className="flex justify-between items-end mb-4">
                        <h3 className="text-lg font-black text-gray-900 dark:text-white">Categories</h3>
                        <button onClick={() => navigate('/customer/explore')} className="text-xs font-bold text-primary">See all</button>
                    </div>
                    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                        {categories.map(cat => (
                            <button key={cat.id} onClick={() => navigate(`/customer/category/${cat.name.toLowerCase()}`)} className="flex items-center gap-3 bg-white dark:bg-[#1E1E1E] rounded-2xl p-2 pr-4 shrink-0 shadow-sm border border-gray-100 dark:border-white/5">
                                <div className="size-10 rounded-xl bg-gray-50 dark:bg-white/5 flex items-center justify-center overflow-hidden">
                                    {cat.imageUrl ?
                                        <img src={cat.imageUrl} className="w-full h-full object-cover" /> :
                                        <span className="material-symbols-outlined text-gray-400 text-lg">{cat.icon || 'category'}</span>
                                    }
                                </div>
                                <span className="text-xs font-bold text-gray-900 dark:text-white capitalize whitespace-nowrap">{cat.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* 4. New Arrivals Grid */}
                <div>
                    <div className="flex justify-between items-end mb-4">
                        <h3 className="text-lg font-black text-gray-900 dark:text-white">New Arrival</h3>
                        <button onClick={() => navigate('/customer/explore')} className="text-xs font-bold text-primary">See all</button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {loading ? [...Array(4)].map((_, i) => <div key={i} className="aspect-[3/4] bg-white dark:bg-[#1E1E1E] rounded-[24px] animate-pulse"></div>) :
                            products.map(prod => (
                                <div key={prod.id} onClick={() => navigate(`/customer/product/${prod.id}`)} className="bg-white dark:bg-[#1E1E1E] rounded-[32px] p-3 shadow-sm active:scale-95 transition-transform flex flex-col group cursor-pointer border border-gray-100 dark:border-white/5">
                                    <div className="aspect-[4/5] bg-gray-100 dark:bg-white/5 rounded-[24px] overflow-hidden relative mb-3">
                                        <img src={prod.images?.[0] || 'https://via.placeholder.com/150'} className="w-full h-full object-cover" alt={prod.name} />
                                        <button className="absolute top-3 right-3 size-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-gray-400 shadow-sm">
                                            <span className="material-symbols-outlined text-[18px]">favorite</span>
                                        </button>
                                    </div>
                                    <h4 className="text-xs font-bold text-gray-900 dark:text-white line-clamp-1 mb-1 px-1">{prod.name}</h4>
                                    <p className="text-[10px] text-gray-400 mb-2 truncate px-1">{prod.vendor}</p>
                                    <span className="text-sm font-black text-gray-900 dark:text-white px-1">${prod.salePrice || prod.basePrice}</span>
                                </div>
                            ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MobileHome;
