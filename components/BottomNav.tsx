import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../Providers';

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
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex flex-col items-center pointer-events-none pb-[env(safe-area-inset-bottom)]">
      <div className="relative w-full pointer-events-auto">
        {/* Background Layer with heavy blur */}
        <div className="absolute inset-x-0 bottom-[-100px] h-[172px] bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-2xl border-t border-gray-100 dark:border-gray-800 shadow-[0_-8px_30px_rgba(0,0,0,0.1)]"></div>

        {/* Centered Items Container */}
        <div className="relative flex items-end justify-around h-[84px] px-2 pb-2 max-w-3xl mx-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;

            if (item.special) {
              return (
                <div key={item.label} className="relative flex flex-col items-center px-2 mb-12 z-[60]">
                  <button
                    onClick={() => navigate(item.path)}
                    className="size-16 rounded-[24px] bg-secondary text-primary shadow-[0_12px_24px_rgba(1,87,84,0.4)] border-[6px] border-background-light dark:border-background-dark flex items-center justify-center transition-all active:scale-90 hover:scale-105 group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-10 transition-opacity"></div>
                    <span className={`material-symbols-outlined text-[32px] font-black ${isActive ? 'icon-filled' : ''}`}>
                      {item.icon}
                    </span>
                    <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping opacity-40"></div>
                  </button>
                </div>
              );
            }

            return (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center gap-1 w-full h-[72px] transition-all relative ${isActive ? 'text-primary' : 'text-gray-400'
                  }`}
              >
                <span className={`material-symbols-outlined text-[24px] ${isActive ? 'icon-filled' : ''}`}>
                  {item.icon}
                </span>
                <span className="text-[9px] font-black uppercase tracking-widest leading-none">
                  {item.label}
                </span>
                {isActive && (
                  <span className="absolute bottom-1 w-1 h-1 bg-primary rounded-full"></span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
