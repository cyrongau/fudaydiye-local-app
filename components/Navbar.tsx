
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, useCart } from '../Providers';
import UnifiedSearch from './UnifiedSearch';
import HeaderNotification from './HeaderNotification';
import logo from '../assets/logo.png';

const categories = [
  { name: 'Fashion', icon: 'checkroom', slug: 'fashion' },
  { name: 'Electronics', icon: 'devices', slug: 'electronics' },
  { name: 'Home & Living', icon: 'home', slug: 'home' },
  { name: 'Beauty', icon: 'content_cut', slug: 'beauty' },
  { name: 'Food & Groceries', icon: 'restaurant', slug: 'food' },
  { name: 'Tech Gear', icon: 'laptop_mac', slug: 'tech' },
  { name: 'Books', icon: 'menu_book', slug: 'books' },
];

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role, profile } = useAuth();
  const { cart } = useCart();
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const isSelected = (path: string) => location.pathname === path;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCategoriesOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleCategoryClick = (slug: string) => {
    navigate(`/customer/category/${slug}`);
    setIsCategoriesOpen(false);
    setIsMobileMenuOpen(false);
  };

  const handleActionClick = () => {
    if (user) {
      const routes: Record<string, string> = {
        CUSTOMER: '/customer/profile',
        VENDOR: '/vendor',
        RIDER: '/rider',
        CLIENT: '/client',
        ADMIN: '/admin',
        FUDAYDIYE_ADMIN: '/vendor'
      };
      let targetRole = role;
      if (!targetRole && user.email === 'admin@fudaydiye.so') targetRole = 'ADMIN';
      navigate(routes[targetRole || 'CUSTOMER'] || '/customer');
    } else {
      navigate('/login');
    }
  };

  return (
    <nav className="sticky top-0 z-[100] w-full bg-white dark:bg-surface-dark border-b border-gray-100 dark:border-gray-800 shadow-sm pt-[env(safe-area-inset-top)]">
      <div className="hidden md:flex w-full px-12 h-[88px] items-center justify-between gap-8">
        <div className="flex items-center gap-4 cursor-pointer shrink-0" onClick={() => navigate('/')}>
          <div className="size-14 bg-white rounded-[18px] flex items-center justify-center shadow-soft p-2">
            <img src={logo} alt="Fudaydiye" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-[28px] font-black tracking-tight text-secondary dark:text-white uppercase leading-[0.8] mb-1">Fudaydiye</h1>
            <span className="text-[11px] font-black text-primary uppercase tracking-[0.4em]">Enterprise Cloud</span>
          </div>
        </div>

        <div
          onClick={() => setIsSearchOpen(true)}
          className="flex-1 max-w-2xl h-[60px] bg-[#F7F9F8] dark:bg-white/5 rounded-full flex items-center px-6 gap-3 group border border-transparent hover:border-primary/30 transition-all cursor-text"
        >
          <span className="material-symbols-outlined text-gray-400 text-[28px]">search</span>
          <span className="flex-1 text-base font-medium text-gray-400 truncate">Search products, brands...</span>
          <button className="bg-primary text-secondary px-8 h-[44px] rounded-full text-[13px] font-black uppercase tracking-[0.1em] hover:bg-primary-dark transition-all">
            Find
          </button>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <button
            onClick={toggleTheme}
            className="size-12 rounded-2xl bg-gray-50 dark:bg-white/10 flex items-center justify-center text-secondary dark:text-white hover:scale-110 transition-all shadow-sm"
            title="Toggle Theme"
          >
            <span className="material-symbols-outlined">{isDarkMode ? 'light_mode' : 'dark_mode'}</span>
          </button>

          <button onClick={() => navigate('/customer/profile')} className="text-secondary dark:text-white hover:text-primary transition-colors ml-2">
            <span className="material-symbols-outlined text-[32px]">favorite_border</span>
          </button>

          <button
            onClick={() => navigate('/customer/cart')}
            className="relative text-secondary dark:text-white hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-[32px]">shopping_bag</span>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 size-5 rounded-full bg-primary text-secondary text-[10px] font-black flex items-center justify-center border-2 border-white dark:border-surface-dark">
                {cartCount}
              </span>
            )}
          </button>
          <button
            onClick={handleActionClick}
            className="px-8 h-[56px] bg-secondary text-primary font-black text-[15px] uppercase tracking-[0.2em] rounded-[18px] shadow-lg hover:shadow-secondary/20 active:scale-95 transition-all ml-2"
          >
            {user ? (role === 'CUSTOMER' ? 'Profile' : 'Dashboard') : 'Sign In'}
          </button>
        </div>
      </div>

      <div className="hidden md:block border-t border-gray-50 dark:border-gray-800">
        <div className="w-full px-12 h-14 flex items-center justify-between relative">
          <div className="flex items-center gap-10">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                className={`flex items-center gap-3 text-[11px] font-black uppercase tracking-widest transition-colors ${isCategoriesOpen ? 'text-primary' : 'text-secondary dark:text-white hover:text-primary'}`}
              >
                <span className="material-symbols-outlined text-[20px]">menu</span>
                Browse All Categories
                <span className={`material-symbols-outlined text-[18px] transition-transform ${isCategoriesOpen ? 'rotate-180' : ''}`}>expand_more</span>
              </button>

              {isCategoriesOpen && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-[110]">
                  <div className="py-2">
                    {categories.map((cat) => (
                      <button
                        key={cat.slug}
                        onClick={() => handleCategoryClick(cat.slug)}
                        className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-white/5 text-left group transition-all"
                      >
                        <span className="material-symbols-outlined text-gray-400 group-hover:text-primary transition-colors">{cat.icon}</span>
                        <span className="text-[12px] font-bold text-secondary dark:text-white uppercase tracking-wider">{cat.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="h-5 w-px bg-gray-100 dark:bg-white/10"></div>

            <div className="flex items-center gap-6 flex-nowrap">
              <SubNavLink label="Home" active={isSelected('/customer') || isSelected('/')} onClick={() => navigate('/')} />
              {!user && <SubNavLink label="Identity Hub" active={isSelected('/select-identity')} onClick={() => navigate('/select-identity')} />}
              <SubNavLink label="Shop" active={isSelected('/customer/explore')} onClick={() => navigate('/customer/explore')} />
              <SubNavLink label="New Arrivals" active={isSelected('/customer/new-arrivals')} onClick={() => navigate('/customer/new-arrivals')} />
              <SubNavLink label="Vendors" active={isSelected('/customer/vendors')} onClick={() => navigate('/customer/vendors')} />
              <SubNavLink label="About Us" active={isSelected('/about')} onClick={() => navigate('/about')} />
              <SubNavLink label="Blog" active={isSelected('/blog')} onClick={() => navigate('/blog')} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">support_agent</span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Support: +252 63 444 1122</span>
          </div>
        </div>
      </div>

      <div className="md:hidden flex items-center justify-between px-4 h-16 bg-white dark:bg-surface-dark">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="size-10 flex items-center justify-center text-secondary dark:text-white"
          >
            <span className="material-symbols-outlined text-[32px]">menu</span>
          </button>
        </div>

        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="size-8 bg-white rounded-lg flex items-center justify-center shadow-sm p-1">
            <img src={logo} alt="Fudaydiye" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-sm md:text-lg font-black text-secondary dark:text-white uppercase tracking-tighter">Fudaydiye</h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="-mr-2">
            <HeaderNotification />
          </div>
          <button onClick={() => navigate('/customer/cart')} className="relative text-secondary dark:text-white">
            <span className="material-symbols-outlined text-[28px]">shopping_bag</span>
            {cartCount > 0 && <span className="absolute -top-1 -right-1 size-4 rounded-full bg-primary text-secondary text-[8px] font-black flex items-center justify-center border-2 border-white dark:border-surface-dark">{cartCount}</span>}
          </button>
          <button onClick={() => setIsSearchOpen(true)} className="size-10 rounded-full bg-secondary/5 flex items-center justify-center text-secondary dark:text-white">
            <span className="material-symbols-outlined text-[24px]">search</span>
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[200] md:hidden">
          <div className="absolute inset-0 bg-secondary/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="relative w-72 h-full bg-white dark:bg-surface-dark shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
            <div className="p-6 pt-[calc(1.5rem+env(safe-area-inset-top))] border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-9 bg-primary rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-secondary font-black text-[22px]">hub</span>
                </div>
                <span className="text-lg font-black text-secondary dark:text-white tracking-tighter uppercase leading-none">Navigation</span>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="size-9 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8">
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Core Platform</h3>
                <div className="flex flex-col gap-2">
                  <MobileNavLink label="Home" icon="home" onClick={() => { navigate('/'); setIsMobileMenuOpen(false); }} />
                  <MobileNavLink label="Vendors" icon="storefront" onClick={() => { navigate('/customer/vendors'); setIsMobileMenuOpen(false); }} />
                  <MobileNavLink label="Shop" icon="shopping_bag" onClick={() => { navigate('/customer/explore'); setIsMobileMenuOpen(false); }} />
                  <MobileNavLink label="Orders" icon="package_2" onClick={() => { navigate('/customer/orders'); setIsMobileMenuOpen(false); }} />
                  <div className="h-px bg-gray-100 dark:bg-white/5 my-2"></div>
                  <MobileNavLink
                    label={isDarkMode ? "Light Mode" : "Dark Mode"}
                    icon={isDarkMode ? "light_mode" : "dark_mode"}
                    onClick={toggleTheme}
                  />
                  <MobileNavLink
                    label={user ? (role === 'CUSTOMER' ? 'Profile' : 'Dashboard') : 'Sign In'}
                    icon={user ? 'account_circle' : 'login'}
                    onClick={() => { handleActionClick(); setIsMobileMenuOpen(false); }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <UnifiedSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </nav>
  );
};

const SubNavLink: React.FC<{ label: string; active?: boolean; onClick?: () => void; highlight?: boolean }> = ({ label, active, onClick, highlight }) => (
  <button
    onClick={onClick}
    className={`text-[11px] font-black uppercase tracking-widest transition-all relative whitespace-nowrap ${active ? 'text-primary' : highlight ? 'text-red-500' : 'text-gray-400 hover:text-secondary dark:hover:text-white'
      }`}
  >
    {label}
    {highlight && <span className="absolute -top-3 -right-2 px-1 bg-red-500 text-white text-[7px] rounded-sm font-black">HOT</span>}
  </button>
);

const MobileNavLink: React.FC<{ label: string; icon: string; onClick: () => void }> = ({ label, icon, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 text-left group active:scale-95 transition-all"
  >
    <div className="size-10 rounded-xl bg-white dark:bg-surface-dark flex items-center justify-center text-gray-400 group-hover:text-primary transition-colors">
      <span className="material-symbols-outlined text-[24px]">{icon}</span>
    </div>
    <span className="text-[14px] font-black text-secondary dark:text-white uppercase tracking-tight">{label}</span>
  </button>
);

export default Navbar;
