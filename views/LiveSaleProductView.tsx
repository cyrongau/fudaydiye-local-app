
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCart } from '../Providers';

const LiveSaleProductView: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { cart, addToCart } = useCart();
  const [stock, setStock] = useState(12);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimer, setLockTimer] = useState(120); // 2 minutes lock

  const product = {
    id: id || 'A14',
    name: "Samsung Galaxy A14 - 128GB",
    price: 180.00,
    oldPrice: 210.00,
    vendor: "Ahmed Electronics",
    isFlashDrop: true,
    gallery: [
      "https://picsum.photos/id/2/800/800",
      "https://picsum.photos/id/3/800/800",
      "https://picsum.photos/id/4/800/800",
      "https://picsum.photos/id/5/800/800",
    ]
  };

  useEffect(() => {
    let interval: any;
    if (isLocked && lockTimer > 0) {
      interval = setInterval(() => setLockTimer(t => t - 1), 1000);
    } else if (lockTimer === 0) {
      setIsLocked(false);
      setLockTimer(120);
    }
    return () => clearInterval(interval);
  }, [isLocked, lockTimer]);

  const handleAddToCart = () => {
    if (isLocked) {
      navigate('/customer/cart');
      return;
    }

    // Trigger Inventory Lock
    setIsLocked(true);
    addToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      qty: quantity,
      img: product.gallery[0],
      vendor: product.vendor,
      attribute: 'Live Drop Variant'
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-300 font-display">
      <header className="sticky top-0 z-40 flex items-center bg-white/90 dark:bg-surface-dark/90 backdrop-blur-md p-4 justify-between border-b border-gray-100 dark:border-white/5 shadow-sm">
        <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/5 transition active:scale-90">
          <span className="material-symbols-outlined text-text-main dark:text-white">arrow_back</span>
        </button>
        <div className="flex-1 px-4 text-center">
          <h1 className="text-sm font-black text-secondary dark:text-white truncate uppercase tracking-tighter">
            {product.isFlashDrop ? 'Limited Drop' : 'Live Drop'}
          </h1>
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{product.vendor}</p>
        </div>
        <div className="size-10"></div>
      </header>

      <main className="flex-1 p-4 flex flex-col gap-5 pb-40 overflow-y-auto no-scrollbar animate-in fade-in duration-500">
        {/* Animated Stock Progress Bar for Flash Drops */}
        {product.isFlashDrop && (
          <div className="bg-red-600 text-white p-3 rounded-2xl shadow-lg animate-in slide-in-from-top-4 duration-500 flex flex-col gap-2">
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
              <span>Selling Fast</span>
              <span className="animate-pulse">85% Sold Out</span>
            </div>
            <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all duration-[3s]" style={{ width: '85%' }}></div>
            </div>
          </div>
        )}

        <div className="relative aspect-square rounded-[40px] overflow-hidden bg-white shadow-soft">
          <img src={product.gallery[activeImageIndex]} className="w-full h-full object-cover" alt={product.name} />
          <div className="absolute top-6 left-6 bg-red-600 text-white text-[9px] font-black px-3 py-1 rounded uppercase tracking-[0.2em] shadow-lg flex items-center gap-1.5 border border-white/20">
            <span className="size-1.5 rounded-full bg-white animate-pulse"></span>
            Flash Sale
          </div>
        </div>

        <div className="flex gap-3 overflow-x-auto no-scrollbar px-2 -mt-1">
          {product.gallery.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setActiveImageIndex(idx)}
              className={`size-16 shrink-0 rounded-2xl overflow-hidden border-2 transition-all p-0.5 ${activeImageIndex === idx ? 'border-primary shadow-lg' : 'border-gray-100 dark:border-white/5 opacity-60'}`}
            >
              <img src={img} className="w-full h-full object-cover rounded-xl" alt="Thumbnail" />
            </button>
          ))}
        </div>

        <div className="bg-white dark:bg-surface-dark p-6 rounded-[32px] shadow-card border border-gray-100 dark:border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black text-secondary dark:text-white leading-tight uppercase tracking-tighter">{product.name}</h2>
            <div className="text-right">
              <span className="text-2xl font-black text-primary tracking-tighter">${product.price}</span>
            </div>
          </div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 leading-relaxed italic border-t border-gray-50 dark:border-white/5 pt-4">
            "High-performance smartphone featuring pro-grade camera sensors. Guaranteed 24-month regional warranty included with every live drop purchase."
          </p>
        </div>

        {isLocked && (
          <div className="bg-amber-400 text-secondary p-5 rounded-[28px] shadow-lg relative overflow-hidden flex items-center justify-between animate-in zoom-in duration-300">
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1">Inventory Secured</p>
              <h3 className="text-lg font-black tracking-tighter">Held for {Math.floor(lockTimer / 60)}:{(lockTimer % 60).toString().padStart(2, '0')}</h3>
            </div>
            <span className="material-symbols-outlined text-[32px] font-black animate-spin-slow">lock_clock</span>
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-background-dark/95 backdrop-blur-md border-t border-gray-100 dark:border-white/5 p-5 pb-10 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
        <div className="flex items-center gap-4 max-w-lg mx-auto">
          <div className="flex h-16 shrink-0 items-center rounded-2xl bg-gray-100 dark:bg-white/5 px-2 border border-gray-200 dark:border-white/10">
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="size-11 rounded-xl flex items-center justify-center text-gray-400 active:scale-90 transition-all"><span className="material-symbols-outlined">remove</span></button>
            <span className="w-10 text-center text-lg font-black">{quantity}</span>
            <button onClick={() => setQuantity(quantity + 1)} className="size-11 rounded-xl flex items-center justify-center text-primary active:scale-90 transition-all"><span className="material-symbols-outlined">add</span></button>
          </div>
          <button
            onClick={handleAddToCart}
            className={`flex-1 h-16 ${isLocked ? 'bg-secondary' : 'bg-primary'} text-secondary font-black text-sm uppercase tracking-[0.2em] rounded-[24px] shadow-primary-glow flex items-center justify-center gap-3 active:scale-[0.98] transition-all`}
          >
            {isLocked ? (
              <>
                Proceed to Checkout
                <span className="material-symbols-outlined text-[22px] font-black">arrow_forward</span>
              </>
            ) : (
              <>
                Secure Stock Item
                <span className="material-symbols-outlined text-[22px] font-black">lock</span>
              </>
            )}
          </button>
        </div>
      </footer>
    </div>
  );
};

export default LiveSaleProductView;
