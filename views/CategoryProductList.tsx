
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product } from '../types';
import { useCart } from '../Providers';

const allCategories = [
  { name: 'All', slug: 'all' },
  { name: 'Fashion', slug: 'fashion' },
  { name: 'Electronics', slug: 'electronics' },
  { name: 'Home', slug: 'home' },
  { name: 'Beauty', slug: 'beauty' },
  { name: 'Food', slug: 'food' },
  { name: 'Tech', slug: 'tech' },
  { name: 'Books', slug: 'books' }
];

const CategoryProductList: React.FC = () => {
  const { category: catParam } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState(catParam || 'all');

  useEffect(() => {
    setLoading(true);
    // Base query: all active products
    const q = query(
      collection(db, "products"),
      where("status", "==", "ACTIVE"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedProds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));

      // Filter in memory for maximum flexibility and to avoid index limitations for this prototype
      if (selectedCat === 'all') {
        setProducts(fetchedProds);
      } else {
        const filtered = fetchedProds.filter(p =>
          p.category.toLowerCase() === selectedCat.toLowerCase()
        );
        setProducts(filtered);
      }
      setLoading(false);
    }, (error) => {
      console.error("Category query error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedCat]);

  const handleCategoryChange = (slug: string) => {
    setSelectedCat(slug);
    navigate(`/customer/category/${slug}`);
  };

  const handleQuickAdd = (e: React.MouseEvent, p: Product) => {
    e.stopPropagation();
    addToCart({
      productId: p.id,
      name: p.name,
      price: p.basePrice,
      qty: 1,
      img: p.images?.[0] || 'https://picsum.photos/400/400',
      vendor: p.vendor,
      vendorId: p.vendorId,
      attribute: 'Standard'
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark font-display transition-colors duration-300">
      <header className="sticky top-0 z-40 bg-surface-light/95 dark:bg-surface-dark/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center px-6 py-4 gap-4">
          <button onClick={() => navigate('/customer')} className="size-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/5 active:scale-90 transition-all shadow-sm">
            <span className="material-symbols-outlined text-secondary dark:text-white">arrow_back</span>
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-black capitalize tracking-tight text-secondary dark:text-white">
              {allCategories.find(c => c.slug === selectedCat)?.name || 'Marketplace'}
            </h1>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              {loading ? 'Pinging Node...' : `${products.length} Items Synchronized`}
            </p>
          </div>
        </div>

        <div className="px-6 pb-4">
          <div className="-mx-6 px-6 flex gap-2 overflow-x-auto no-scrollbar snap-x">
            {allCategories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => handleCategoryChange(cat.slug)}
                className={`snap-start px-5 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-2 flex items-center justify-center ${selectedCat === cat.slug
                    ? 'bg-secondary border-secondary text-primary shadow-lg scale-105'
                    : 'bg-white dark:bg-surface-dark text-gray-400 border-gray-100 dark:border-gray-800'
                  }`}
              >
                {cat.name}
              </button>
            ))}
            <div className="shrink-0 w-6"></div>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-y-auto pb-32 no-scrollbar animate-in fade-in duration-500">
        {loading ? (
          <div className="py-20 flex justify-center"><div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div></div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 opacity-30 text-center">
            <div className="size-20 rounded-[32px] bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-5xl">search_off</span>
            </div>
            <p className="text-sm font-black uppercase tracking-widest text-secondary dark:text-white">No products found in this node</p>
            <button onClick={() => navigate('/customer')} className="mt-6 text-primary font-black uppercase text-xs">Return to Hub</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                onClick={() => navigate(`/customer/product/${product.id}`)}
                className="bg-white dark:bg-surface-dark rounded-[40px] p-4 shadow-soft border border-gray-100 dark:border-gray-800 flex flex-col cursor-pointer transition-all hover:-translate-y-1 hover:border-primary/20 group"
              >
                <div className="w-full aspect-square rounded-[32px] overflow-hidden bg-gray-50 dark:bg-black/20 mb-4 shadow-inner">
                  <img src={product.images?.[0] || 'https://picsum.photos/400/400'} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" alt={product.name} />
                </div>
                <div className="flex flex-col flex-1 px-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[9px] text-primary font-black uppercase tracking-widest truncate">{product.vendor}</span>
                    <div className="flex items-center gap-0.5 text-amber-400">
                      <span className="material-symbols-outlined text-[12px] fill-1">star</span>
                      <span className="text-[9px] font-black text-gray-400">5.0</span>
                    </div>
                  </div>
                  <h3 className="text-sm font-black text-secondary dark:text-white leading-tight mb-3 line-clamp-2 uppercase tracking-tight">{product.name}</h3>
                  <div className="mt-auto flex items-center justify-between">
                    <span className="text-lg font-black text-secondary dark:text-white tracking-tighter">${product.basePrice.toFixed(2)}</span>
                    <button
                      onClick={(e) => handleQuickAdd(e, product)}
                      className="size-10 bg-secondary text-primary rounded-xl flex items-center justify-center shadow-lg hover:bg-primary hover:text-secondary transition-colors"
                    >
                      <span className="material-symbols-outlined text-[20px] font-black">add</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNav items={[
        { label: 'Home', icon: 'home', path: '/customer' },
        { label: 'Explore', icon: 'explore', path: '/customer/explore' },
        { label: 'Scan', icon: 'qr_code_scanner', path: '/customer/scan', special: true },
        { label: 'Orders', icon: 'package_2', path: '/customer/orders' },
        { label: 'Account', icon: 'person', path: '/customer/profile' },
      ]} />
    </div>
  );
};

export default CategoryProductList;
