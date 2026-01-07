import React, { useState, useEffect } from 'react';
import { Product } from '../types';

interface ProductPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (product: Product) => void;
    products: Product[];
}

const ProductPickerModal: React.FC<ProductPickerModalProps> = ({ isOpen, onClose, onSelect, products }) => {
    const [search, setSearch] = useState('');
    const [filtered, setFiltered] = useState<Product[]>(products);

    useEffect(() => {
        if (!search) {
            setFiltered(products);
        } else {
            const lower = search.toLowerCase();
            setFiltered(products.filter(p =>
                p.name.toLowerCase().includes(lower) ||
                p.vendor?.toLowerCase().includes(lower)
            ));
        }
    }, [search, products]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            ></div>

            <div className="relative z-10 w-full max-w-2xl bg-white dark:bg-surface-dark rounded-[32px] p-6 shadow-2xl animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-white/10 flex flex-col max-h-[85vh]">

                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-black text-secondary dark:text-white uppercase tracking-tighter">Select Product</h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Link an item to this slide</p>
                    </div>
                    <button onClick={onClose} className="size-10 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center hover:bg-gray-100 transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="relative mb-6">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400">search</span>
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by name or vendor..."
                        className="w-full h-12 bg-gray-50 dark:bg-black/20 rounded-xl pl-12 pr-4 text-sm font-bold border border-transparent focus:border-primary transition-all outline-none text-secondary dark:text-white"
                        autoFocus
                    />
                </div>

                <div className="overflow-y-auto flex-1 space-y-2 pr-2">
                    {filtered.length === 0 && (
                        <div className="py-10 text-center text-gray-400 text-xs font-bold uppercase tracking-widest">No products found</div>
                    )}
                    {filtered.map(product => (
                        <button
                            key={product.id}
                            onClick={() => { onSelect(product); onClose(); }}
                            className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 border border-transparent hover:border-gray-100 dark:hover:border-white/5 transition-all group text-left"
                        >
                            <div className="size-12 rounded-xl bg-gray-100 dark:bg-white/5 overflow-hidden flex-shrink-0">
                                <img src={product.images?.[0] || 'https://placehold.co/100'} className="w-full h-full object-cover" alt="" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-black text-secondary dark:text-white truncate">{product.name}</h4>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{product.vendor} • ${product.basePrice}</p>
                            </div>
                            <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-secondary transition-colors">
                                <span className="material-symbols-outlined text-lg">add</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ProductPickerModal;
