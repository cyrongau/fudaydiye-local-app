import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Providers';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';

interface MenuItem {
    icon: string;
    path: string;
    label: string;
    color?: string;
}

const MobileMenu: React.FC = () => {
    const navigate = useNavigate();
    const { role, profile } = useAuth();
    const [isDarkMode, setIsDarkMode] = React.useState(false);

    React.useEffect(() => {
        const isDark = document.documentElement.classList.contains('dark');
        setIsDarkMode(isDark);
    }, []);

    const toggleTheme = () => {
        const newMode = !isDarkMode;
        setIsDarkMode(newMode);
        if (newMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    };

    if (!role) return null;

    const getAdminItems = (): MenuItem[] => [
        { icon: 'grid_view', path: '/admin', label: 'Health Center', color: 'bg-blue-100 text-blue-600' },
        { icon: 'hub', path: '/admin/config', label: 'Integrations', color: 'bg-purple-100 text-purple-600' },
        { icon: 'category', path: '/admin/categories', label: 'Taxonomy', color: 'bg-orange-100 text-orange-600' },
        { icon: 'bar_chart', path: '/admin/reports', label: 'Treasury', color: 'bg-green-100 text-green-600' },
        { icon: 'local_shipping', path: '/admin/logistics', label: 'Fleet Control', color: 'bg-indigo-100 text-indigo-600' },
        { icon: 'videocam', path: '/admin/live-moderation', label: 'Live Terminal', color: 'bg-red-100 text-red-600' },
        { icon: 'group', path: '/admin/users', label: 'Identity Nodes', color: 'bg-yellow-100 text-yellow-600' },
        { icon: 'two_wheeler', path: '/admin/riders', label: 'Riders', color: 'bg-teal-100 text-teal-600' },
        { icon: 'article', path: '/admin/cms', label: 'CMS Terminal', color: 'bg-pink-100 text-pink-600' },
        { icon: 'security', path: '/admin/audits', label: 'Security Log', color: 'bg-gray-100 text-gray-600' },
    ];

    const getVendorItems = (): MenuItem[] => [
        { icon: 'grid_view', path: '/vendor', label: 'Command Center', color: 'bg-blue-100 text-blue-600' },
        { icon: 'receipt_long', path: '/vendor/orders', label: 'Fulfillment', color: 'bg-green-100 text-green-600' },
        { icon: 'inventory_2', path: '/vendor/management', label: 'Catalog', color: 'bg-orange-100 text-orange-600' },
        { icon: 'inventory', path: '/vendor/inventory', label: 'Stock Logic', color: 'bg-yellow-100 text-yellow-600' },
        { icon: 'bar_chart', path: '/vendor/analytics', label: 'Growth Engine', color: 'bg-purple-100 text-purple-600' },
        { icon: 'account_balance_wallet', path: '/vendor/earnings', label: 'Earning Ledger', color: 'bg-teal-100 text-teal-600' },
        { icon: 'hub', path: '/vendor/stores', label: 'Branches', color: 'bg-indigo-100 text-indigo-600' },
        { icon: 'group', path: '/vendor/staff', label: 'Personnel', color: 'bg-red-100 text-red-600' },
        { icon: 'videocam', path: '/vendor/live-setup', label: 'Live Sale', color: 'bg-rose-100 text-rose-600' },
    ];

    const getRiderItems = (): MenuItem[] => [
        { icon: 'grid_view', path: '/rider', label: 'Fleet Queue', color: 'bg-blue-100 text-blue-600' },
        { icon: 'assignment', path: '/rider/assignments', label: 'Assignments', color: 'bg-orange-100 text-orange-600' },
        { icon: 'sensors', path: '/rider/status', label: 'Status & Duty', color: 'bg-green-100 text-green-600' },
        { icon: 'account_balance_wallet', path: '/rider/wallet', label: 'Earnings', color: 'bg-yellow-100 text-yellow-600' },
    ];

    const getCustomerItems = (): MenuItem[] => [
        { icon: 'home', path: '/', label: 'Home', color: 'bg-gray-100 text-gray-600' },
        { icon: 'category', path: '/customer/explore', label: 'Categories', color: 'bg-blue-100 text-blue-600' },
        { icon: 'shopping_cart', path: '/customer/cart', label: 'Cart', color: 'bg-green-100 text-green-600' },
        { icon: 'person', path: '/customer/profile', label: 'Profile', color: 'bg-purple-100 text-purple-600' },
        { icon: 'favorite', path: '/customer/wishlist', label: 'Wishlist', color: 'bg-red-100 text-red-600' },
        { icon: 'local_shipping', path: '/customer/orders', label: 'Orders', color: 'bg-orange-100 text-orange-600' },
    ];

    let items: MenuItem[] = [];
    if (role === 'ADMIN') items = getAdminItems();
    else if (role === 'VENDOR') items = getVendorItems();
    else if (role === 'RIDER') items = getRiderItems();
    else {
        items = getCustomerItems();
        if (role === 'CLIENT') {
            items.push({ icon: 'local_shipping', path: '/client', label: 'Logistics Terminal', color: 'bg-blue-100 text-blue-600' });
        }
    }

    // Settings is common
    const settingsLabel = role === 'RIDER' ? 'Verification Hub' : 'System Config';
    const settingsItem = { icon: 'settings', path: `/${role.toLowerCase()}/settings`, label: settingsLabel, color: 'bg-gray-200 text-gray-700' };

    // Add logout or other common items if needed

    return (
        <div className="p-4 pb-32 pt-12 animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-black text-secondary dark:text-white">Navigation</h1>
                <div className="flex items-center gap-3">
                    <button
                        onClick={toggleTheme}
                        className="size-10 bg-gray-100 dark:bg-white/10 rounded-full flex items-center justify-center text-gray-500 active:scale-90 transition-all"
                    >
                        <span className="material-symbols-outlined text-xl">
                            {isDarkMode ? 'light_mode' : 'dark_mode'}
                        </span>
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="size-10 bg-gray-100 dark:bg-white/10 rounded-full flex items-center justify-center text-gray-500 active:scale-90 transition-all"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
            </div>

            {/* User Profile Summary */}
            <div className="flex items-center gap-4 mb-8 bg-white dark:bg-white/5 p-4 rounded-2xl shadow-sm">
                <div className="size-12 rounded-full bg-orange-100 overflow-hidden border border-gray-100 dark:border-white/10">
                    <img src={profile?.avatar || `https://ui-avatars.com/api/?name=${profile?.fullName || 'User'}&background=random`} alt="Profile" className="w-full h-full object-cover" />
                </div>
                <div>
                    <h3 className="font-bold text-secondary dark:text-white">{profile?.fullName || 'User'}</h3>
                    <p className="text-xs text-gray-400 capitalize">{profile?.businessName || profile?.operationalHub || role?.toLowerCase()}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {items.map((item) => (
                    <button
                        key={item.label}
                        onClick={() => navigate(item.path)}
                        className="flex flex-col items-center justify-center p-4 bg-white dark:bg-white/5 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 active:scale-95 transition-transform"
                    >
                        <div className={`size-12 rounded-full flex items-center justify-center mb-3 ${item.color || 'bg-gray-100 text-gray-600'}`}>
                            <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                        </div>
                        <span className="text-xs font-bold text-secondary dark:text-gray-300">{item.label}</span>
                    </button>
                ))}

                {/* Settings Item */}
                <button
                    onClick={() => navigate(settingsItem.path)}
                    className="flex flex-col items-center justify-center p-4 bg-white dark:bg-white/5 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 active:scale-95 transition-transform"
                >
                    <div className={`size-12 rounded-full flex items-center justify-center mb-3 ${settingsItem.color}`}>
                        <span className="material-symbols-outlined text-2xl">{settingsItem.icon}</span>
                    </div>
                    <span className="text-xs font-bold text-secondary dark:text-gray-300">{settingsItem.label}</span>
                </button>
            </div>

            <button
                onClick={async () => {
                    await signOut(auth);
                    navigate('/login');
                }}
                className="w-full mt-8 flex items-center justify-center gap-2 p-4 rounded-2xl bg-red-50 text-red-600 font-bold active:bg-red-100 transition-colors"
            >
                <span className="material-symbols-outlined">logout</span>
                <span>Sign Out</span>
            </button>
        </div>
    );
};

export default MobileMenu;
