
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../Providers';
import NotificationHub from './NotificationHub';
import UnifiedSearch from './UnifiedSearch';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import logo from '../assets/logo.png';

const DashboardHeader: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, role } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;
      try {
        const q = query(collection(db, "notifications"), where("userId", "==", user.uid), where("isRead", "==", false));
        const snap = await getDocs(q);
        setUnreadCount(snap.size);
      } catch (e) {
        // Silent fail
        setUnreadCount(0);
      }
    };
    fetchNotifications();
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) setIsNotifOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    const { auth } = await import('../lib/firebase');
    await auth.signOut();
    navigate('/');
  };

  const getNavLinks = () => {
    if (role === 'ADMIN') {
      return [
        { label: 'Overview', path: '/admin' },
        { label: 'Audits', path: '/admin/audits' },
        { label: 'Reports', path: '/admin/reports' },
        { label: 'Infrastructure', path: '/admin/hubs' },
      ];
    }
    if (role === 'VENDOR') {
      return [
        { label: 'Dashboard', path: '/vendor' },
        { label: 'Fulfillment', path: '/vendor/orders' },
        { label: 'Intelligence', path: '/vendor/analytics' },
        { label: 'Reputation', path: '/vendor/reviews' },
      ];
    }
    if (role === 'RIDER') {
      return [
        { label: 'Queue', path: '/rider' },
        { label: 'Assignments', path: '/rider/assignments' },
        { label: 'Earnings', path: '/rider/wallet' },
        { label: 'Status', path: '/rider/status' },
      ];
    }
    return [];
  };

  const links = getNavLinks();

  return (
    <header className="bg-white dark:bg-surface-dark border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-10 sticky top-0 z-[90] shadow-sm pt-[env(safe-area-inset-top)] min-h-[88px]">
      <div className="flex items-center gap-3 cursor-pointer group py-4" onClick={() => navigate('/')}>
        <div className="size-11 bg-white rounded-2xl flex items-center justify-center shadow-soft group-hover:scale-105 transition-transform text-secondary p-1 border border-gray-100 dark:border-white/10">
          <img src={logo} alt="Fudaydiye" className="w-full h-full object-contain" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-xl font-black text-secondary dark:text-white tracking-tighter uppercase leading-[0.8]">Fudaydiye</h1>
          <span className="text-[8px] font-black text-primary uppercase tracking-[0.3em] mt-1">Global Terminal</span>
        </div>
      </div>

      <nav className="hidden lg:flex items-center bg-gray-50 dark:bg-white/5 p-1 rounded-full border border-gray-100 dark:border-white/10">
        {links.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <button
              key={link.label}
              onClick={() => navigate(link.path)}
              className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${isActive
                ? 'bg-white dark:bg-surface-dark text-secondary dark:text-primary shadow-sm ring-1 ring-black/5'
                : 'text-gray-400 hover:text-secondary dark:hover:text-white'
                }`}
            >
              {link.label}
            </button>
          );
        })}
      </nav>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="size-11 rounded-full hover:bg-gray-50 dark:hover:bg-white/5 flex items-center justify-center text-gray-400 transition-colors"
          >
            <span className="material-symbols-outlined text-[24px]">search</span>
          </button>
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className={`size-11 rounded-full flex items-center justify-center transition-all ${isNotifOpen ? 'bg-primary text-secondary shadow-lg' : 'hover:bg-gray-50 dark:hover:bg-white/5 text-gray-400'}`}
            >
              <span className="material-symbols-outlined text-[24px]">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute top-2.5 right-2.5 size-4 bg-red-500 rounded-full border-2 border-white dark:border-surface-dark flex items-center justify-center text-[7px] font-black text-white">
                  {unreadCount}
                </span>
              )}
            </button>
            <NotificationHub userId={user?.uid || ''} isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
          </div>
        </div>

        <div className="h-8 w-px bg-gray-100 dark:bg-white/10 mx-1"></div>

        <div className="relative" ref={dropdownRef}>
          <div onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-3 group cursor-pointer">
            <div className="size-11 rounded-full p-0.5 border-2 border-primary/20 shadow-soft overflow-hidden group-hover:border-primary/50 transition-all">
              <img src={profile?.avatar || `https://ui-avatars.com/api/?name=${profile?.fullName || 'User'}&background=015754&color=06DC7F`} className="w-full h-full rounded-full object-cover" alt="Profile" />
            </div>
            <span className={`material-symbols-outlined text-gray-300 text-[20px] transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`}>expand_more</span>
          </div>

          {isProfileOpen && (
            <div className="absolute top-full right-0 mt-4 w-60 bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 rounded-[32px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 py-3">
              <div className="px-6 py-4 border-b border-gray-50 dark:border-white/5 mb-2 bg-gray-50/50 dark:bg-white/2">
                <p className="text-[9px] font-black text-primary uppercase tracking-[0.4em] mb-2">{role} Access</p>
                <p className="text-sm font-black text-secondary dark:text-white truncate">{profile?.fullName}</p>
                <p className="text-[8px] font-bold text-gray-400 truncate mt-1">{profile?.email}</p>
              </div>
              <DropdownItem icon="account_circle" label="My Identity" onClick={() => { navigate('/customer/personal-info'); setIsProfileOpen(false); }} />
              <DropdownItem icon="verified_user" label={role === 'RIDER' ? 'Verification Hub' : 'Security Settings'} onClick={() => { navigate(`/${role?.toLowerCase()}/settings`); setIsProfileOpen(false); }} />
              <DropdownItem icon="hub" label="Identity Hub" onClick={() => { navigate('/select-identity'); setIsProfileOpen(false); }} />
              <div className="h-px bg-gray-50 dark:bg-white/5 my-2 mx-4"></div>
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-6 py-3 hover:bg-red-50 dark:hover:bg-red-500/10 text-left group transition-all">
                <div className="size-8 rounded-lg bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-500">
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                </div>
                <span className="text-[11px] font-black text-gray-500 dark:text-gray-300 uppercase tracking-widest group-hover:text-red-600">Terminate Session</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <UnifiedSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </header>
  );
};

const DropdownItem: React.FC<{ icon: string; label: string; onClick: () => void }> = ({ icon, label, onClick }) => (
  <button onClick={onClick} className="w-full flex items-center gap-3 px-6 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5 text-left group transition-all">
    <div className="size-8 rounded-lg bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-primary border border-gray-100 dark:border-white/10">
      <span className="material-symbols-outlined text-[18px]">{icon}</span>
    </div>
    <span className="text-[11px] font-black text-secondary dark:text-white uppercase tracking-widest">{label}</span>
  </button>
);

export default DashboardHeader;
