
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

const VendorStore: React.FC = () => {
  const { vendorId } = useParams();
  const navigate = useNavigate();

  const products = [
    { id: '1', name: "Silk Chiffon Dirac", price: 85, img: "https://picsum.photos/id/1011/400/400" },
    { id: '2', name: "Satin Evening Dress", price: 110, img: "https://picsum.photos/id/1027/400/400" },
    { id: '3', name: "Embroidered Scarf", price: 25, img: "https://picsum.photos/id/1005/400/400" },
    { id: '4', name: "Traditional Gorgorad", price: 45, img: "https://picsum.photos/id/1012/400/400" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark">
      <header className="relative h-64 w-full overflow-hidden">
        <div className="absolute inset-0 bg-secondary/80 z-10"></div>
        <img src="https://picsum.photos/id/1011/800/600" className="w-full h-full object-cover" alt="Banner" />
        <button onClick={() => navigate(-1)} className="absolute top-12 left-6 z-20 size-11 rounded-full bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        
        <div className="absolute bottom-6 left-6 right-6 z-20 flex items-end gap-4">
          <div className="size-20 rounded-3xl bg-white p-1 shadow-lg overflow-hidden border-2 border-primary/50">
            <img src="https://picsum.photos/id/1014/200/200" className="w-full h-full object-cover rounded-[22px]" alt="Logo" />
          </div>
          <div className="flex-1 pb-1">
            <h1 className="text-2xl font-black text-white leading-tight">Hodan Styles</h1>
            <div className="flex items-center gap-3 mt-1">
               <span className="text-[10px] font-black text-primary uppercase tracking-widest">Verified Vendor</span>
               <div className="flex items-center gap-1 text-amber-400">
                 <span className="material-symbols-outlined text-xs fill-1">star</span>
                 <span className="text-[10px] font-black text-white">4.9 (2.4k)</span>
               </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-y-auto pb-28">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-black text-text-main dark:text-white tracking-tight">Store Line-up</h2>
          <button className="size-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400">
             <span className="material-symbols-outlined">tune</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-5">
          {products.map((p) => (
            <div 
              key={p.id}
              onClick={() => navigate(`/customer/product/${p.id}`)}
              className="bg-white dark:bg-surface-dark rounded-card-xl p-3 shadow-soft border border-gray-100 dark:border-white/5 flex flex-col group cursor-pointer transition-all hover:-translate-y-1"
            >
              <div className="w-full aspect-square rounded-2xl overflow-hidden mb-3">
                <img src={p.img} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt={p.name} />
              </div>
              <h3 className="text-sm font-black text-secondary dark:text-white leading-tight mb-2 truncate">{p.name}</h3>
              <div className="mt-auto flex items-center justify-between">
                <span className="text-primary font-black text-base">${p.price}</span>
                <div className="size-8 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400">
                   <span className="material-symbols-outlined text-[20px]">add</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <BottomNav items={[
        { label: 'Home', icon: 'home', path: '/customer' },
        { label: 'Explore', icon: 'explore', path: '/customer/explore' },
        { label: 'Cart', icon: 'shopping_cart', path: '/customer/checkout', special: true },
        { label: 'Orders', icon: 'package_2', path: '/customer/orders' },
        { label: 'Account', icon: 'person', path: '/customer/profile' },
      ]} />
    </div>
  );
};

export default VendorStore;
