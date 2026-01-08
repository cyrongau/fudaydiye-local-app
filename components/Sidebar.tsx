
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../Providers';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

interface SidebarItem {
  icon: string;
  path: string;
  label: string;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { role, profile } = useAuth(); // Access profile

  if (role === 'CUSTOMER' || !role) return null;
  // ... (items definitions omitted for brevity, they are unchanged)

  const getAdminItems = (): SidebarItem[] => [
    { icon: 'grid_view', path: '/admin', label: 'Health Center' },
    { icon: 'hub', path: '/admin/config', label: 'Integrations' },
    { icon: 'category', path: '/admin/categories', label: 'Taxonomy' },
    { icon: 'bar_chart', path: '/admin/reports', label: 'Treasury' },
    { icon: 'local_shipping', path: '/admin/logistics', label: 'Fleet Control' },
    { icon: 'videocam', path: '/admin/live-moderation', label: 'Live Terminal' },
    { icon: 'group', path: '/admin/users', label: 'Merchants' },
    { icon: 'two_wheeler', path: '/admin/riders', label: 'Riders' },
    { icon: 'article', path: '/admin/cms', label: 'CMS Terminal' },
    { icon: 'security', path: '/admin/audits', label: 'Security Log' },
  ];

  const getVendorItems = (): SidebarItem[] => [
    { icon: 'grid_view', path: '/vendor', label: 'Command Center' },
    { icon: 'receipt_long', path: '/vendor/orders', label: 'Fulfillment' },
    { icon: 'inventory_2', path: '/vendor/management', label: 'Catalog' },
    { icon: 'inventory', path: '/vendor/inventory', label: 'Stock Logic' },
    { icon: 'bar_chart', path: '/vendor/analytics', label: 'Growth Engine' },
    { icon: 'account_balance_wallet', path: '/vendor/earnings', label: 'Earning Ledger' },
    { icon: 'hub', path: '/vendor/stores', label: 'Branches' },
    { icon: 'group', path: '/vendor/staff', label: 'Personnel' },
  ];

  const getRiderItems = (): SidebarItem[] => [
    { icon: 'grid_view', path: '/rider', label: 'Fleet Queue' },
    { icon: 'assignment', path: '/rider/assignments', label: 'Assignments' },
    { icon: 'sensors', path: '/rider/status', label: 'Status & Duty' },
    { icon: 'account_balance_wallet', path: '/rider/wallet', label: 'Earnings & Wallet' },
  ];

  const items = role === 'ADMIN' ? getAdminItems() : role === 'VENDOR' ? getVendorItems() : getRiderItems();
  const settingsLabel = role === 'RIDER' ? 'Verification Hub' : 'System Config';

  return (
    <aside
      className={`hidden md:flex transition-all duration-500 ease-in-out bg-white dark:bg-surface-dark border-r border-gray-100 dark:border-gray-800 h-[calc(100vh-88px)] sticky top-[88px] flex-col items-center justify-between shrink-0 overflow-hidden z-40 ${isCollapsed ? 'w-[88px]' : 'w-[260px]'}`}
    >
      <div className="flex flex-col gap-1.5 w-full px-3 py-6 overflow-y-auto no-scrollbar flex-1">

        {/* User Profile Section */}
        <div className={`flex flex-col items-center mb-6 transition-all duration-500 ${isCollapsed ? 'gap-2' : 'gap-3'}`}>
          <div className="size-16 rounded-full border-2 border-gray-100 dark:border-white/10 p-1 flex-shrink-0">
            <img
              src={profile?.avatar || `https://ui-avatars.com/api/?name=${profile?.fullName || 'User'}&background=random`}
              className="w-full h-full rounded-full object-cover"
              alt="Profile"
            />
          </div>

          <div className={`text-center transition-all duration-500 overflow-hidden whitespace-nowrap ${isCollapsed ? 'opacity-0 h-0' : 'opacity-100 h-auto'}`}>
            <h3 className="text-sm font-black text-secondary dark:text-white uppercase leading-tight truncate px-2">{profile?.fullName || 'User'}</h3>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{role}</p>
          </div>
        </div>

        <button
          onClick={onToggle}
          className="mb-4 size-12 rounded-2xl bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400 hover:text-primary transition-colors self-center shrink-0"
        >
          <span className={`material-symbols-outlined transition-transform duration-500 ${isCollapsed ? '' : 'rotate-180'}`}>
            side_navigation
          </span>
        </button>

        {items.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`h-12 rounded-xl flex items-center transition-all group relative px-3 w-full shrink-0 ${isActive
                ? 'bg-secondary text-primary shadow-md'
                : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'
                }`}
            >
              <span className={`material-symbols-outlined text-[24px] shrink-0 ${isActive ? 'icon-filled' : ''}`}>
                {item.icon}
              </span>

              <span className={`ml-4 text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-500 ${isCollapsed ? 'opacity-0 translate-x-10 pointer-events-none' : 'opacity-100 translate-x-0'}`}>
                {item.label}
              </span>

              {isCollapsed && (
                <div className="absolute left-[80px] px-3 py-1.5 bg-secondary text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[100] shadow-xl">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-1.5 w-full px-3 border-t border-gray-50 dark:border-white/5 py-6 shrink-0">
        <button
          onClick={() => navigate(`/${role?.toLowerCase()}/settings`)}
          className={`h-12 rounded-xl flex items-center px-3 w-full text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-all group relative overflow-hidden ${location.pathname.includes('settings') ? 'bg-gray-100 dark:bg-white/10' : ''}`}
        >
          <span className="material-symbols-outlined text-[24px] shrink-0">verified_user</span>
          <span className={`ml-4 text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-500 ${isCollapsed ? 'opacity-0 translate-x-10' : 'opacity-100 translate-x-0'}`}>
            {settingsLabel}
          </span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
