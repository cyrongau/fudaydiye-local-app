
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { useCart } from '../Providers';

const Cart: React.FC<{ isAuthenticated: boolean }> = ({ isAuthenticated }) => {
  const navigate = useNavigate();
  const { cart, removeFromCart, updateQty, clearCart, cartTotal } = useCart();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'LIST' | 'GRID'>('LIST');

  const deliveryFee = cart.length > 0 ? 5 : 0;
  const total = cartTotal + deliveryFee;

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-300 font-display">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/5 transition-all active:scale-90">
            <span className="material-symbols-outlined text-secondary dark:text-white">arrow_back</span>
          </button>
          <div>
            <h1 className="text-2xl font-black text-secondary dark:text-white tracking-tight leading-none uppercase">Shopping Bag</h1>
            <Link to="/customer/explore" className="text-[10px] font-black text-primary uppercase tracking-[0.2em] hover:underline mt-1 block">
              ← Continue Shopping
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-xl">
            <button onClick={() => setViewMode('LIST')} className={`size-9 flex items-center justify-center rounded-lg transition-all ${viewMode === 'LIST' ? 'bg-white dark:bg-surface-dark text-primary shadow-sm' : 'text-gray-400'}`}>
              <span className="material-symbols-outlined text-[20px]">view_list</span>
            </button>
            <button onClick={() => setViewMode('GRID')} className={`size-9 flex items-center justify-center rounded-lg transition-all ${viewMode === 'GRID' ? 'bg-white dark:bg-surface-dark text-primary shadow-sm' : 'text-gray-400'}`}>
              <span className="material-symbols-outlined text-[20px]">grid_view</span>
            </button>
          </div>
          <div className="bg-primary text-secondary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest hidden md:block">
            {cart.length} Items
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 md:p-12 max-w-7xl mx-auto w-full flex flex-col lg:flex-row gap-10 pb-48">
        {cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 animate-in fade-in duration-500 text-center">
            <div className="size-28 rounded-[40px] bg-gray-50 dark:bg-white/5 flex items-center justify-center mb-8 border border-gray-100 dark:border-white/5">
              <span className="material-symbols-outlined text-[56px] text-gray-200">shopping_bag</span>
            </div>
            <h2 className="text-2xl font-black text-secondary dark:text-white uppercase tracking-tighter mb-2">Bag Node Empty</h2>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-10 max-w-xs leading-relaxed">Synchronize your terminal with our latest marketplace drops to begin.</p>
            <button
              onClick={() => navigate('/customer/explore')}
              className="h-16 px-12 bg-primary text-secondary font-black uppercase tracking-[0.3em] rounded-[24px] shadow-primary-glow active:scale-95 transition-all"
            >
              Explore Catalog
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-6">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em]">Inventory Nodes</h2>
                <button
                  onClick={() => { if (window.confirm("Flush selection?")) clearCart(); }}
                  className="text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-50 dark:hover:bg-red-950 px-3 py-1 rounded-lg transition-colors"
                >
                  Flush Cart
                </button>
              </div>

              {viewMode === 'LIST' ? (
                <div className="flex flex-col gap-4">
                  {cart.map(item => (
                    <div key={item.id} className="bg-white dark:bg-surface-dark rounded-[32px] p-5 shadow-soft border border-gray-100 dark:border-white/5 flex gap-6 group hover:border-primary/20 transition-all animate-in slide-in-from-bottom-4">
                      <div className="size-28 shrink-0 rounded-[28px] overflow-hidden shadow-inner bg-gray-50 dark:bg-black/20 relative">
                        <img src={item.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={item.name} />
                      </div>
                      <div className="flex-1 flex flex-col justify-between py-1">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <h3 className="text-lg font-black text-secondary dark:text-white leading-tight uppercase tracking-tight mb-1">{item.name}</h3>
                            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{item.vendor}</p>
                          </div>
                          <button onClick={() => setConfirmDelete(item.id)} className="size-10 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-300 hover:text-red-500 flex items-center justify-center transition-all active:scale-90">
                            <span className="material-symbols-outlined">delete</span>
                          </button>
                        </div>

                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50 dark:border-white/5">
                          <span className="text-xl font-black text-secondary dark:text-white tracking-tighter">${(item.price * item.qty).toFixed(2)}</span>
                          <div className="flex items-center gap-4 bg-gray-100/50 dark:bg-white/5 p-1.5 rounded-2xl border border-gray-200 dark:border-white/10">
                            <button onClick={() => updateQty(item.id, -1)} className="size-10 rounded-xl flex items-center justify-center text-gray-400 hover:text-primary active:scale-90 transition-all"><span className="material-symbols-outlined font-black">remove</span></button>
                            <span className="text-sm font-black w-6 text-center">{item.qty}</span>
                            <button onClick={() => updateQty(item.id, 1)} className="size-10 rounded-xl flex items-center justify-center text-primary hover:scale-110 active:scale-90 transition-all"><span className="material-symbols-outlined font-black">add</span></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {cart.map(item => (
                    <div key={item.id} className="bg-white dark:bg-surface-dark rounded-[48px] p-5 shadow-soft border border-gray-100 dark:border-white/5 flex flex-col group animate-in zoom-in-95">
                      <div className="relative aspect-square rounded-[40px] overflow-hidden bg-gray-50 mb-6 shadow-inner">
                        <img src={item.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={item.name} />
                        <button onClick={() => setConfirmDelete(item.id)} className="absolute top-4 right-4 size-10 rounded-full bg-white/90 dark:bg-black/60 backdrop-blur-md flex items-center justify-center text-red-500 shadow-xl active:scale-90">
                          <span className="material-symbols-outlined">close</span>
                        </button>
                      </div>
                      <div className="px-2 space-y-4">
                        <div>
                          <h4 className="text-sm font-black text-secondary dark:text-white uppercase truncate">{item.name}</h4>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.vendor}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xl font-black text-primary">${(item.price * item.qty).toFixed(2)}</span>
                          <div className="flex items-center gap-3 bg-gray-50 dark:bg-white/2 p-1 rounded-xl">
                            <button onClick={() => updateQty(item.id, -1)} className="size-8 rounded-lg flex items-center justify-center text-gray-400"><span className="material-symbols-outlined text-sm">remove</span></button>
                            <span className="text-xs font-black w-4 text-center">{item.qty}</span>
                            <button onClick={() => updateQty(item.id, 1)} className="size-8 rounded-lg flex items-center justify-center text-primary"><span className="material-symbols-outlined text-sm">add</span></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <aside className="w-full lg:w-96 shrink-0">
              <div className="sticky top-32 space-y-6">
                <div className="bg-secondary text-white p-10 rounded-[48px] shadow-2xl relative overflow-hidden group border border-white/5">
                  <div className="absolute top-0 right-0 size-48 bg-primary/20 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
                  <div className="relative z-10 space-y-8">
                    <div>
                      <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4">Authorization Total</p>
                      <h2 className="text-6xl font-black tracking-tighter leading-none">${total.toFixed(2)}</h2>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center"><span className="text-[10px] font-black text-white/50 uppercase tracking-widest">Bag Value</span><span className="text-sm font-black text-white">${cartTotal.toFixed(2)}</span></div>
                      <div className="flex justify-between items-center"><span className="text-[10px] font-black text-white/50 uppercase tracking-widest">Dispatch Fee</span><span className="text-sm font-black text-white">${deliveryFee.toFixed(2)}</span></div>
                    </div>

                    <button
                      onClick={() => navigate('/customer/checkout')}
                      className="w-full h-20 bg-primary text-secondary font-black text-base uppercase tracking-[0.3em] rounded-[24px] shadow-primary-glow flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all"
                    >
                      Checkout Now
                      <span className="material-symbols-outlined font-black">arrow_forward</span>
                    </button>
                  </div>
                </div>
              </div>
            </aside>
          </>
        )}
      </main>

      {confirmDelete && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-secondary/80 backdrop-blur-sm" onClick={() => setConfirmDelete(null)}></div>
          <div className="relative bg-white dark:bg-surface-dark rounded-[48px] p-10 shadow-2xl border border-gray-100 dark:border-white/5 animate-in zoom-in-95 duration-300 w-full max-w-sm text-center">
            <h3 className="text-2xl font-black text-secondary dark:text-white mb-3 uppercase tracking-tighter">Erase Node?</h3>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-widest leading-relaxed mb-8">Remove this item from the current session buffer?</p>
            <div className="flex flex-col gap-3">
              <button onClick={() => { removeFromCart(confirmDelete!); setConfirmDelete(null); }} className="w-full h-16 bg-red-600 text-white font-black rounded-2xl uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all">Yes, Remove</button>
              <button onClick={() => setConfirmDelete(null)} className="w-full h-14 bg-gray-100 dark:bg-white/5 text-gray-400 font-black rounded-2xl uppercase text-[10px] tracking-widest active:scale-95 transition-all">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Cart;
