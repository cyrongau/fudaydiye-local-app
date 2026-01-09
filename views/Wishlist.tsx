
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart, useWishlist } from '../Providers';

const Wishlist: React.FC = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { wishlist: items, removeFromWishlist: removeItem } = useWishlist();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<'NEW' | 'PRICE_ASC' | 'PRICE_DESC'>('NEW');

  const filteredItems = items
    .filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.vendor?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortOption === 'PRICE_ASC') return a.price - b.price;
      if (sortOption === 'PRICE_DESC') return b.price - a.price;
      return 0; // Default to insertion order (usually newest first if list is appended)
    });


  const handleAddToCart = (product: any) => {
    addToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      qty: 1,
      img: product.img,
      vendor: product.vendor,
      attribute: 'Default'
    });
    alert(`${product.name} added to bag!`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark font-display">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/5 active:scale-90 transition-all">
          <span className="material-symbols-outlined text-secondary dark:text-white">arrow_back</span>
        </button>
        <div className="flex flex-col">
          <h1 className="text-xl font-black text-secondary dark:text-white tracking-tighter leading-none">Wishlist</h1>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">{items.length} Saved Items</p>
        </div>
      </header>

      <main className="p-6 flex-1 flex flex-col gap-6 overflow-y-auto pb-20 no-scrollbar animate-in fade-in duration-500">
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 opacity-30 text-center">
            <div className="size-20 bg-gray-100 dark:bg-white/5 rounded-[32px] flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-4xl">favorite_border</span>
            </div>
            <p className="text-sm font-black uppercase tracking-widest text-secondary dark:text-white">No items in wishlist</p>
            <button
              onClick={() => navigate('/customer')}
              className="mt-6 text-primary font-black uppercase tracking-widest text-xs border border-primary/20 px-6 py-3 rounded-xl active:scale-95 transition-all"
            >
              Explore Marketplace
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:w-96">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400">search</span>
                <input
                  type="text"
                  placeholder="Search your favorites..."
                  className="w-full h-12 rounded-2xl bg-white dark:bg-surface-dark border border-gray-100 dark:border-white/5 pl-12 pr-4 text-sm font-bold outline-none focus:border-primary transition-all shadow-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 hide-scrollbar">
                {(['NEW', 'PRICE_ASC', 'PRICE_DESC'] as const).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setSortOption(opt)}
                    className={`h-10 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${sortOption === opt
                      ? 'bg-secondary text-white border-secondary'
                      : 'bg-white dark:bg-white/5 text-gray-400 border-gray-100 dark:border-white/5 hover:border-primary'
                      }`}
                  >
                    {opt === 'NEW' && 'Recently Added'}
                    {opt === 'PRICE_ASC' && 'Lowest Price'}
                    {opt === 'PRICE_DESC' && 'Highest Price'}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredItems.map(item => (
                <div key={item.id} className="bg-white dark:bg-surface-dark rounded-[24px] p-2.5 shadow-sm hover:shadow-md border border-gray-100 dark:border-white/5 flex flex-col group animate-in zoom-in-95 duration-300">
                  <div className="relative aspect-square rounded-[18px] overflow-hidden mb-3 bg-gray-50 dark:bg-black/20">
                    <img src={item.img} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt={item.name} />
                    <button
                      onClick={() => removeItem(item.id)}
                      className="absolute top-2 right-2 size-7 rounded-full bg-white/90 dark:bg-black/60 backdrop-blur-md flex items-center justify-center text-red-500 shadow-sm active:scale-90 transition-all hover:bg-red-50"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>
                  <div className="px-1 flex flex-col flex-1">
                    <span className="text-[8px] text-gray-400 font-black uppercase tracking-widest mb-0.5 truncate">{item.vendor}</span>
                    <h3 className="text-xs font-black text-secondary dark:text-white uppercase leading-tight mb-2 line-clamp-2 min-h-[2.5em]">{item.name}</h3>
                    <div className="mt-auto flex items-center justify-between">
                      <span className="text-primary font-black text-sm">${item.price}</span>
                      <button
                        onClick={() => handleAddToCart(item)}
                        className="size-8 bg-secondary dark:bg-primary text-white dark:text-black rounded-lg flex items-center justify-center shadow-md active:scale-90 transition-all hover:scale-105"
                      >
                        <span className="material-symbols-outlined text-[16px]">shopping_bag</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredItems.length === 0 && searchQuery && (
              <div className="py-20 text-center opacity-50">
                <span className="material-symbols-outlined text-4xl mb-4 text-gray-300">search_off</span>
                <p className="text-xs font-bold uppercase tracking-widest">No items match your search</p>
                <button onClick={() => setSearchQuery('')} className="text-primary text-[10px] font-black uppercase mt-2 hover:underline">Clear Search</button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Wishlist;
