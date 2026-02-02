import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, useCart, useWishlist } from '../Providers';
import { collection, getDocs } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import UnifiedSearch from './UnifiedSearch';
import HeaderNotification from './HeaderNotification';
import { useSystemConfig } from '../hooks/useSystemConfig';
import logo from '../assets/icon.png';

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
  const { wishlist } = useWishlist();
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { config } = useSystemConfig();
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
    if (user && !user.isAnonymous) {
      const routes: Record<string, string> = {
        CUSTOMER: '/customer/profile',
        VENDOR: '/vendor',
        RIDER: '/rider',
        CLIENT: '/client',
        ADMIN: '/admin',
        FUDAYDIYE_ADMIN: '/admin',
        SUPER_ADMIN: '/admin'
      };
      let targetRole = role;
      if (!targetRole && user.email === 'admin@fudaydiye.so') targetRole = 'SUPER_ADMIN';
      if (!targetRole && user.email === 'info@fudaydiye.com') targetRole = 'FUDAYDIYE_ADMIN';
      navigate(routes[targetRole || 'CUSTOMER'] || '/customer');
    } else {
      navigate('/login');
    }
  };

  return (
    <nav className="sticky top-0 z-[100] w-full bg-white dark:bg-surface-dark border-b border-gray-100 dark:border-gray-800 shadow-sm pt-[env(safe-area-inset-top)]">
      <div className="hidden md:flex w-full px-8 h-[88px] items-center justify-between gap-6 bg-white dark:bg-surface-dark">
        {/* 1. Logo Section */}
        <div className="flex items-center gap-3 cursor-pointer shrink-0 min-w-[180px]" onClick={() => navigate('/')}>
          <div className="flex items-center gap-2">
            <div className="size-10 bg-white rounded-xl flex items-center justify-center shadow-sm p-1">
              <img src={logo} alt="Fudaydiye" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-[22px] font-black tracking-tight text-secondary dark:text-white leading-none">Fudaydiye</h1>
              <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Commerce & Logistics</span>
            </div>
          </div>
        </div>

        {/* 2. Search Section (Pill with Filter) */}
        <div
          onClick={() => setIsSearchOpen(true)}
          className="flex-1 max-w-xl h-[52px] bg-white border border-gray-200 dark:border-white/10 dark:bg-white/5 rounded-full flex items-center px-6 gap-3 group hover:border-primary/50 hover:shadow-sm transition-all cursor-text"
        >
          <span className="material-symbols-outlined text-gray-400 text-[24px]">search</span>
          <span className="flex-1 text-[14px] font-medium text-gray-400 truncate">Search something here</span>
          <div className="h-6 w-px bg-gray-200 dark:bg-white/10 mx-1"></div>
          <button className="text-gray-400 hover:text-secondary dark:hover:text-white transition-colors">
            <span className="material-symbols-outlined text-[20px]">tune</span>
          </button>
        </div>

        {/* 3. Location Section (Dropdown) */}
        <LocationWidget />

        {/* 4. Actions Section */}
        <div className="flex items-center gap-4 shrink-0">
          {(!user || user.isAnonymous) && (
            <ActionCircle
              icon="account_circle"
              onClick={() => navigate('/login')}
            />
          )}

          <div className="flex items-center gap-3">
            {/* Cart with Hover Dropdown */}
            <div className="relative group z-50">
              <button onClick={() => navigate('/customer/cart')} className="size-11 rounded-full border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center justify-center text-secondary dark:text-white transition-all relative">
                <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
                {cart.reduce((a, b) => a + b.qty, 0) > 0 && (
                  <span className="absolute -top-1 -right-1 size-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-surface-dark">
                    {cart.reduce((a, b) => a + b.qty, 0)}
                  </span>
                )}
              </button>

              {/* Hover Card */}
              <div className="absolute right-0 top-full pt-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top-right z-[60]">
                <div className="w-80 bg-white dark:bg-surface-dark rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                  <div className="p-4 border-b border-gray-50 dark:border-white/5 flex justify-between items-center">
                    <span className="text-xs font-black uppercase text-secondary dark:text-white tracking-widest">My Cart ({cart.reduce((a, b) => a + b.qty, 0)})</span>
                    <span className="text-xs font-bold text-primary">${cart.reduce((a, b) => a + (b.price * b.qty), 0).toFixed(2)}</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto p-2">
                    {cart.length === 0 ? (
                      <div className="py-8 text-center text-gray-400 text-xs font-bold uppercase tracking-wider">Your bag is empty</div>
                    ) : (
                      cart.map((item, i) => (
                        <div key={i} className="flex gap-3 p-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-colors">
                          <div className="size-12 rounded-lg bg-gray-100 dark:bg-white/5 overflow-hidden shrink-0">
                            <img src={item.img} className="w-full h-full object-cover" alt="" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-secondary dark:text-white truncate">{item.name}</p>
                            <p className="text-[10px] text-gray-400">{item.qty} x ${item.price}</p>
                          </div>
                          <button className="text-gray-300 hover:text-red-500"><span className="material-symbols-outlined text-[16px]">close</span></button>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-white/5">
                    <button onClick={() => navigate('/customer/cart')} className="w-full h-10 bg-black dark:bg-white text-white dark:text-black rounded-xl text-[10px] font-black uppercase tracking-widest">
                      Checkout
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Dark Mode Toggle */}
            <ActionCircle
              icon={isDarkMode ? "light_mode" : "dark_mode"}
              onClick={toggleTheme}
            />

            <ActionCircle icon="favorite" onClick={() => navigate('/customer/wishlist')} badge={wishlist.length} />
            <div className="relative">
              <HeaderNotification />
            </div>

            {user && !user.isAnonymous && (
              <UserMenu user={user} role={role} profile={profile} handleActionClick={handleActionClick} />
            )}
          </div>
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

              <SubNavLink label="Shop" active={isSelected('/customer/explore')} onClick={() => navigate('/customer/explore')} />
              <SubNavLink label="New Arrivals" active={isSelected('/customer/new-arrivals')} onClick={() => navigate('/customer/new-arrivals')} />
              <SubNavLink label="Vendors" active={isSelected('/customer/vendors')} onClick={() => navigate('/customer/vendors')} />
              <SubNavLink label="About Us" active={isSelected('/about')} onClick={() => navigate('/about')} />
              <SubNavLink label="Blog" active={isSelected('/blog')} onClick={() => navigate('/blog')} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">support_agent</span>
            <a href={`tel:${(config?.business?.phone || '+252 63 8555590').replace(/[^0-9+]/g, '')}`} className="text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap hover:text-primary transition-colors">
              Support: {config?.business?.phone || '+252 63 8555590'}
            </a>
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
                  <MobileNavLink label="Wishlist" icon="favorite" onClick={() => { navigate('/customer/wishlist'); setIsMobileMenuOpen(false); }} />
                  <div className="h-px bg-gray-100 dark:bg-white/5 my-2"></div>
                  <MobileNavLink
                    label={isDarkMode ? "Light Mode" : "Dark Mode"}
                    icon={isDarkMode ? "light_mode" : "dark_mode"}
                    onClick={toggleTheme}
                  />
                  <MobileNavLink
                    label={user && !user.isAnonymous ? (role === 'CUSTOMER' ? 'Profile' : 'Dashboard') : 'Sign In'}
                    icon={user && !user.isAnonymous ? 'account_circle' : 'login'}
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

const ActionCircle: React.FC<{ icon: string; onClick: () => void; badge?: number }> = ({ icon, onClick, badge }) => (
  <button onClick={onClick} className="size-11 rounded-full border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center justify-center text-secondary dark:text-white transition-all relative">
    <span className="material-symbols-outlined text-[20px] fill-current">{icon}</span>
    {badge !== undefined && badge > 0 && (
      <span className="absolute -top-1 -right-1 size-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-surface-dark">
        {badge}
      </span>
    )}
  </button>
);

const LocationWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(() => localStorage.getItem('fddy_delivery_location') || 'Hargeisa, Somaliland');
  const [locations, setLocations] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial fetch of zones for dropdown
    const fetchZones = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "shipping_zones"));
        const names = querySnapshot.docs.map(d => d.data().name).sort();
        if (names.length > 0) {
          setLocations(names);
        } else {
          // Fallback if no zones defined yet
          setLocations(["Hargeisa, Somaliland", "Hargeisa Market", "Jigjiga Yar", "26 June", "Gacan Libaax"]);
        }
      } catch (err) {
        console.warn("Failed to fetch shipping zones", err);
        setLocations(["Hargeisa, Somaliland", "Hargeisa Market", "Jigjiga Yar", "26 June", "Gacan Libaax"]);
      }
    };
    fetchZones();

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (loc: string) => {
    setSelectedLocation(loc);
    localStorage.setItem('fddy_delivery_location', loc);
    setIsOpen(false);
  };

  return (
    <div className="hidden lg:flex items-center gap-3 shrink-0 min-w-[200px] pl-4 border-l border-transparent relative" ref={dropdownRef}>
      <div className="size-10 rounded-full bg-green-50 dark:bg-white/5 flex items-center justify-center text-primary border border-green-100 dark:border-white/10 shrink-0">
        <span className="material-symbols-outlined text-[20px]">location_on</span>
      </div>
      <div className="flex flex-col cursor-pointer group" onClick={() => setIsOpen(!isOpen)}>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Deliver to</span>
        <div className="flex items-center gap-1">
          <span className="text-[13px] font-black text-secondary dark:text-white leading-tight truncate max-w-[140px]">{selectedLocation}</span>
          <span className={`material-symbols-outlined text-[16px] text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}>expand_more</span>
        </div>
      </div>

      {isOpen && (
        <div className="absolute top-full left-4 mt-2 w-56 bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
          <div className="py-2 max-h-64 overflow-y-auto no-scrollbar">
            {locations.map((loc) => (
              <button
                key={loc}
                onClick={() => handleSelect(loc)}
                className={`w-full text-left px-5 py-3 text-[12px] font-bold uppercase tracking-wide hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${selectedLocation === loc ? 'text-primary bg-primary/5' : 'text-secondary dark:text-white'}`}
              >
                {loc}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// New UserMenu Component
const UserMenu: React.FC<{ user: any, role: any, profile: any, handleActionClick: () => void }> = ({ user, role, profile, handleActionClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const getMenuItems = () => {
    const items = [];

    // Add Dashboard for non-customers
    if (role && role !== 'CUSTOMER') {
      items.push({ label: 'Dashboard', icon: 'dashboard', path: '/admin', action: handleActionClick });
    }

    // Standard items
    items.push(
      { label: 'My Profile', icon: 'person', path: '/customer/profile' },
      { label: 'My Orders', icon: 'package_2', path: '/customer/orders' },
      { label: 'Settings', icon: 'settings', path: '/customer/settings' }
    );

    return items;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="size-11 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden border-2 border-white dark:border-gray-700 hover:border-primary transition-all focus:outline-none active:scale-95 shadow-sm"
      >
        <img
          src={profile?.avatar || `https://ui-avatars.com/api/?name=${profile?.fullName || 'User'}&background=random`}
          alt="Profile"
          className="w-full h-full object-cover"
        />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-60 bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
          <div className="p-5 border-b border-gray-50 dark:border-white/5 bg-gray-50/50 dark:bg-white/5">
            <p className="text-sm font-black text-secondary dark:text-white truncate">{profile?.fullName || user.email}</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate mt-0.5">{role}</p>
          </div>
          <div className="p-2 space-y-0.5">
            {getMenuItems().map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (item.action) item.action();
                  else navigate(item.path);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl text-left group transition-colors"
              >
                <span className={`material-symbols-outlined text-[18px] ${item.label === 'Dashboard' ? 'text-primary' : 'text-gray-400 group-hover:text-primary'}`}>{item.icon}</span>
                <span className={`text-[11px] font-bold uppercase tracking-wide ${item.label === 'Dashboard' ? 'text-primary' : 'text-gray-600 dark:text-gray-300 group-hover:text-secondary dark:group-hover:text-white'}`}>{item.label}</span>
              </button>
            ))}
            <div className="h-px bg-gray-50 dark:bg-white/5 my-1 mx-2"></div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl text-left group transition-colors"
            >
              <span className="material-symbols-outlined text-gray-400 group-hover:text-red-500 text-[18px]">logout</span>
              <span className="text-[11px] font-bold text-gray-600 dark:text-gray-300 group-hover:text-red-500 uppercase tracking-wide">Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;
