import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, useCart } from '../Providers';

interface NavItem {
  label: string;
  icon: string;
  path: string;
  special?: boolean;
}

interface BottomNavProps {
  items?: NavItem[];
}

const BottomNav: React.FC<BottomNavProps> = ({ items: manualItems }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { role, user } = useAuth();
  const { cart } = useCart();

  const getRoleItems = (): NavItem[] => {
    if (manualItems) return manualItems;

    // Default to Customer navigation for guests or explicit Customers
    if (!user || role === 'CUSTOMER') {
      return [
        { label: 'Home', icon: 'home', path: '/' },
        { label: 'Explore', icon: 'category', path: '/customer/explore' },
        // Centered Scan Button
        { label: 'Pay', icon: 'qr_code_scanner', path: '/customer/scan', special: true },
        { label: 'Cart', icon: 'shopping_cart', path: '/customer/cart' },
        { label: 'Profile', icon: 'person', path: '/customer/profile' },
      ];
    }

    if (role === 'VENDOR') {
      return [
        { label: 'Dashboard', icon: 'dashboard', path: '/vendor' },
        { label: 'Orders', icon: 'receipt_long', path: '/vendor/orders' },
        // Central Special Button: Scan
        { label: 'Scan', icon: 'qr_code_scanner', path: '/vendor/scan', special: true },
        { label: 'Products', icon: 'inventory_2', path: '/vendor/management' },
        { label: 'Menu', icon: 'grid_view', path: '/mobile-menu' },
      ];
    }

    if (role === 'RIDER') {
      return [
        { label: 'Status', icon: 'two_wheeler', path: '/rider' },
        { label: 'Tasks', icon: 'assignment', path: '/rider/assignments' },
        // Central Special Button: Scan
        { label: 'Scan', icon: 'qr_code_scanner', path: '/rider/scan', special: true },
        { label: 'Wallet', icon: 'account_balance_wallet', path: '/rider/wallet' },
        { label: 'Menu', icon: 'grid_view', path: '/mobile-menu' },
      ];
    }

    if (role === 'ADMIN') {
      return [
        { label: 'Overview', icon: 'analytics', path: '/admin' },
        { label: 'Users', icon: 'group', path: '/admin/users' },
        { label: 'Reports', icon: 'summarize', path: '/admin/reports' },
        { label: 'Menu', icon: 'grid_view', path: '/mobile-menu' },
      ];
    }

    // Fallback for CLIENT or other roles
    return [
      { label: 'Home', icon: 'home', path: '/' },
      { label: 'Menu', icon: 'grid_view', path: '/mobile-menu' },
    ];
  };

  const navItems = getRoleItems();

  return (
    <div className="fixed bottom-8 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <nav className="bg-white dark:bg-[#1E1E1E] rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-100 dark:border-white/5 py-4 px-8 flex items-center gap-8 pointer-events-auto backdrop-blur-md bg-opacity-95 dark:bg-opacity-95">
        {navItems.map((item) => {
          // Simple active check
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));

          // Render Special "Scan" Button if present
          if (item.special) {
            return (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className="size-12 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform -mt-8 border-4 border-white dark:border-[#121212]"
              >
                <span className="material-symbols-outlined text-[24px]">qr_code_scanner</span>
              </button>
            )
          }

          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className="relative flex flex-col items-center justify-center gap-1 group"
            >
              <div className={`transition-all duration-300 ${isActive ? 'text-[#06DC7F] scale-110' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}>
                <span className="material-symbols-outlined text-[26px]">{item.icon}</span>
              </div>
              {isActive && <span className="absolute -bottom-2 w-1 h-1 bg-[#06DC7F] rounded-full"></span>}

              {/* Badge Logic (Simplified for Demo, assuming Bag has badge in real world if needed) */}
              {item.label === 'Bag' && cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-black size-3.5 flex items-center justify-center rounded-full border border-white dark:border-[#1E1E1E]">
                  {cart.length}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default BottomNav;
