import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useWallet } from '../Providers';
import CustomerOrders from './CustomerOrders';
import WalletView from './WalletView';
import UserSettings from './UserSettings';

interface ProfileProps {
  isAuthenticated: boolean;
}

type TabType = 'OVERVIEW' | 'ORDERS' | 'WALLET' | 'SETTINGS';

const Profile: React.FC<ProfileProps> = ({ isAuthenticated }) => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { balance } = useWallet();
  const [activeTab, setActiveTab] = useState<TabType>('OVERVIEW');

  if (!isAuthenticated || !profile) return null;

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark font-display transition-colors duration-300">

      {/* 1. Compact Header */}
      <header className="bg-white dark:bg-surface-dark border-b border-gray-100 dark:border-gray-800 sticky top-0 z-30 pt-safe-top">
        <div className="px-6 py-4 flex items-center gap-4">
          <div className="relative shrink-0">
            <img
              src={profile.avatar || `https://ui-avatars.com/api/?name=${profile.fullName || 'User'}&background=random`}
              className="size-16 rounded-2xl object-cover border-2 border-gray-100 dark:border-white/10 shadow-sm"
              alt="Profile"
            />
            <div className="absolute -bottom-1 -right-1 size-5 bg-green-500 rounded-full border-2 border-white dark:border-surface-dark"></div>
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black text-secondary dark:text-white uppercase tracking-tight truncate">{profile.fullName}</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">{profile.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-md text-[9px] font-black uppercase tracking-widest border border-primary/20">
                {profile.trustTier || 'Bronze'} Member
              </span>
            </div>
          </div>
        </div>

        {/* 2. Scrollable Tabs */}
        <div className="flex items-center gap-6 px-6 overflow-x-auto no-scrollbar">
          <TabButton label="Overview" icon="dashboard" isActive={activeTab === 'OVERVIEW'} onClick={() => setActiveTab('OVERVIEW')} />
          <TabButton label="My Orders" icon="package_2" isActive={activeTab === 'ORDERS'} onClick={() => setActiveTab('ORDERS')} />
          <TabButton label="Wallet" icon="account_balance_wallet" isActive={activeTab === 'WALLET'} onClick={() => setActiveTab('WALLET')} />
          <TabButton label="Settings" icon="settings" isActive={activeTab === 'SETTINGS'} onClick={() => setActiveTab('SETTINGS')} />
        </div>
      </header>

      {/* 3. Main Content Area */}
      <main className="flex-1 p-4 md:p-6 overflow-y-auto no-scrollbar pb-24">

        {activeTab === 'OVERVIEW' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-5xl mx-auto">

            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatsCard
                label="Wallet Balance"
                value={`$${balance.toFixed(2)}`}
                icon="account_balance"
                color="bg-emerald-500"
                onClick={() => setActiveTab('WALLET')}
              />
              <StatsCard
                label="Active Orders"
                value="2" // Placeholder, ideally fetch count
                icon="local_shipping"
                color="bg-blue-500"
                onClick={() => setActiveTab('ORDERS')}
              />
              <StatsCard
                label="Wishlist"
                value="12"
                icon="favorite"
                color="bg-pink-500"
                onClick={() => navigate('/customer/wishlist')}
              />
              <StatsCard
                label="Support"
                value="Help"
                icon="support_agent"
                color="bg-purple-500"
                onClick={() => navigate('/contact')}
              />
            </div>

            {/* Quick Actions Grid */}
            <div>
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 ml-2">Quick Access</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <QuickActionCard
                  icon="location_on"
                  title="Manage Addresses"
                  desc="Add or edit delivery locations"
                  onClick={() => navigate('/customer/addresses')}
                />
                <QuickActionCard
                  icon="credit_card"
                  title="Payment Methods"
                  desc="Manage saved cards and mobile money"
                  onClick={() => navigate('/customer/payments')}
                />
                <QuickActionCard
                  icon="history"
                  title="Order History"
                  desc="View past transactions and receipts"
                  onClick={() => setActiveTab('ORDERS')}
                />
                <QuickActionCard
                  icon="lock"
                  title="Security"
                  desc="Update password and 2FA settings"
                  onClick={() => setActiveTab('SETTINGS')}
                />
              </div>
            </div>

            {/* Account Danger Zone (Simplified) */}
            <div className="mt-8 pt-8 border-t border-gray-100 dark:border-white/5">
              <button onClick={() => navigate('/login')} className="flex items-center gap-2 text-red-500 hover:text-red-600 transition-colors px-4 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10">
                <span className="material-symbols-outlined">logout</span>
                <span className="text-xs font-black uppercase tracking-widest">Log Out</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'ORDERS' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <CustomerOrders />
          </div>
        )}

        {activeTab === 'WALLET' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <WalletView />
          </div>
        )}

        {activeTab === 'SETTINGS' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <UserSettings />
          </div>
        )}

      </main>
    </div>
  );
};

// Sub-components

const TabButton: React.FC<{ label: string, icon: string, isActive: boolean, onClick: () => void }> = ({ label, icon, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 pb-3 pt-1 border-b-[3px] transition-all whitespace-nowrap group ${isActive ? 'border-primary text-secondary dark:text-white' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
  >
    <span className={`material-symbols-outlined text-[20px] ${isActive ? 'fill-1' : ''}`}>{icon}</span>
    <span className="text-[11px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

const StatsCard: React.FC<{ label: string, value: string, icon: string, color: string, onClick?: () => void }> = ({ label, value, icon, color, onClick }) => (
  <button onClick={onClick} className="bg-white dark:bg-surface-dark p-4 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-all text-left flex flex-col gap-3 group">
    <div className={`size-10 rounded-xl ${color} text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
      <span className="material-symbols-outlined">{icon}</span>
    </div>
    <div>
      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest truncate">{label}</p>
      <p className="text-xl font-black text-secondary dark:text-white tracking-tight truncate">{value}</p>
    </div>
  </button>
);

const QuickActionCard: React.FC<{ icon: string, title: string, desc: string, onClick: () => void }> = ({ icon, title, desc, onClick }) => (
  <button onClick={onClick} className="flex items-center gap-4 p-4 bg-white dark:bg-surface-dark rounded-2xl border border-gray-100 dark:border-white/5 hover:border-primary/30 transition-all text-left group">
    <div className="size-12 rounded-xl bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-500 group-hover:text-primary group-hover:bg-primary/5 transition-colors">
      <span className="material-symbols-outlined text-[24px]">{icon}</span>
    </div>
    <div>
      <h4 className="text-xs font-black text-secondary dark:text-white uppercase tracking-tight group-hover:text-primary transition-colors">{title}</h4>
      <p className="text-[10px] text-gray-400 leading-tight mt-0.5">{desc}</p>
    </div>
  </button>
);

export default Profile;
