
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../Providers';

const Wishlist: React.FC = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [items, setItems] = useState([
    { id: 'w-1', name: "Traditional Silk Dirac", price: 85, vendor: "Hodan Styles", img: "https://picsum.photos/id/1011/400/400" },
    { id: 'w-2', name: "Oud Essence 50ml", price: 65, vendor: "Fragrance Hub", img: "https://images.unsplash.com/photo-1547887538-e3a2f32cb1cc?q=80&w=400" },
    { id: 'w-3', name: "MacBook Air M2", price: 999, vendor: "Sahal Tech", img: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=400" },
    { id: 'w-4', name: "Leather Handbag", price: 45, vendor: "Urban Chic", img: "https://picsum.photos/id/1012/400/400" },
  ]);

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

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
          <div className="grid grid-cols-2 gap-4">
            {items.map(item => (
              <div key={item.id} className="bg-white dark:bg-surface-dark rounded-[32px] p-3 shadow-soft border border-gray-100 dark:border-white/5 flex flex-col group animate-in zoom-in-95 duration-300">
                <div className="relative aspect-square rounded-[24px] overflow-hidden mb-3 bg-gray-50 dark:bg-black/20">
                  <img src={item.img} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt={item.name} />
                  <button
                    onClick={() => removeItem(item.id)}
                    className="absolute top-2 right-2 size-8 rounded-full bg-white/90 dark:bg-black/60 backdrop-blur-md flex items-center justify-center text-red-500 shadow-sm active:scale-90 transition-all"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>
                <div className="px-1 flex flex-col flex-1">
                  <span className="text-[8px] text-gray-400 font-black uppercase tracking-widest mb-0.5 truncate">{item.vendor}</span>
                  <h3 className="text-xs font-black text-secondary dark:text-white uppercase leading-tight mb-2 truncate">{item.name}</h3>
                  <div className="mt-auto flex items-center justify-between">
                    <span className="text-primary font-black text-base">${item.price}</span>
                    <button
                      onClick={() => handleAddToCart(item)}
                      className="size-9 bg-secondary dark:bg-primary text-white dark:text-black rounded-xl flex items-center justify-center shadow-md active:scale-90 transition-all"
                    >
                      <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
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

export default Wishlist;
