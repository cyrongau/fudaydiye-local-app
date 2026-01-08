
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../types';

interface RoleSelectionProps {
  onSelectRole: (role: UserRole) => void;
}

const RoleSelection: React.FC<RoleSelectionProps> = ({ onSelectRole }) => {
  const [selected, setSelected] = useState<UserRole>('CUSTOMER');
  const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const navigate = useNavigate();

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [isDarkMode]);

  const handleEntry = () => {
    onSelectRole(selected);
    navigate('/login', { state: { selectedRole: selected } });
  };

  const handleGuestEntry = () => {
    onSelectRole('CUSTOMER');
    // Navigate to root which is now CustomerHome
    navigate('/');
  };

  const roles: { id: UserRole; label: string; icon: string; desc: string; accent: string }[] = [
    { id: 'CUSTOMER', label: 'Shopper', icon: 'shopping_basket', desc: 'Browse and buy from thousands of local vendors.', accent: 'text-blue-600' },
    { id: 'VENDOR', label: 'Merchant', icon: 'storefront', desc: 'Scale your business with AI tools and logistics.', accent: 'text-amber-600' },
    { id: 'RIDER', label: 'Rider', icon: 'two_wheeler', desc: 'Join the fleet and earn per high-speed delivery.', accent: 'text-primary-dark' },
    { id: 'CLIENT', label: 'Logistics', icon: 'package_2', desc: 'Enterprise tools for large-scale dispatch management.', accent: 'text-purple-600' },
    { id: 'ADMIN', label: 'Administrator', icon: 'admin_panel_settings', desc: 'Manage the ecosystem health and moderation.', accent: 'text-red-600' },
    { id: 'FUDAYDIYE_ADMIN', label: 'Global Ops', icon: 'language', desc: 'Super-vendor with cross-border capabilities.', accent: 'text-indigo-600' },
  ];

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-6 overflow-x-hidden transition-colors duration-700">

      {/* Background Image Layer */}
      <div className="absolute inset-0 z-0 logistics-bg grayscale-[30%] opacity-40"></div>

      {/* Dynamic Gradient Overlay - "Consuming" the image with light/inviting tones */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-white/95 via-white/80 to-primary/20 dark:from-background-dark/95 dark:via-background-dark/80 dark:to-primary/10"></div>

      {/* Grid Overlay for texture */}
      <div className="absolute inset-0 grid-overlay opacity-[0.3] dark:opacity-10 z-0"></div>

      {/* Floating Decorative Blobs */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] right-[-10%] size-[800px] bg-primary/10 rounded-full blur-[140px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-5%] size-[600px] bg-secondary/10 rounded-full blur-[120px] animate-pulse delay-1000"></div>
      </div>

      {/* Top Controls */}
      <div className="absolute top-8 right-8 z-50">
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="size-12 rounded-2xl bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 flex items-center justify-center text-secondary dark:text-white hover:scale-110 active:scale-95 transition-all shadow-card backdrop-blur-md"
        >
          <span className="material-symbols-outlined">{isDarkMode ? 'light_mode' : 'dark_mode'}</span>
        </button>
      </div>

      {/* Main Hub Container */}
      <div className="relative z-20 w-full max-w-6xl flex flex-col items-center gap-10 animate-in fade-in zoom-in-95 duration-1000">

        {/* Identity Branding */}
        <div className="flex flex-col items-center text-center">
          <div className="size-24 bg-secondary dark:bg-primary rounded-[32px] flex items-center justify-center shadow-2xl animate-float mb-6">
            <span className="material-symbols-outlined text-primary dark:text-secondary font-black text-[52px]">hub</span>
          </div>
          <h1 className="text-6xl font-black tracking-tighter text-secondary dark:text-white uppercase leading-none mb-3">
            Fudaydiye <span className="text-primary italic">Cloud</span>
          </h1>
          <div className="flex items-center gap-4">
            <div className="h-px w-8 bg-primary/30"></div>
            <p className="text-[12px] font-black text-secondary/60 dark:text-primary/60 uppercase tracking-[0.5em]">Identity Control Protocol</p>
            <div className="h-px w-8 bg-primary/30"></div>
          </div>
        </div>

        {/* The Identity Hub Glass Card */}
        <div className="w-full bg-white/40 dark:bg-white/5 backdrop-blur-2xl rounded-[64px] border border-white dark:border-white/10 p-10 md:p-16 shadow-[0_48px_80px_-24px_rgba(1,87,84,0.15)]">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-black text-secondary dark:text-white uppercase tracking-tight mb-3">Connect to Workspace</h2>
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest leading-relaxed">
              Select your functional node to authenticate and access your ecosystem dashboard.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => setSelected(role.id)}
                className={`group relative flex flex-col p-10 rounded-[48px] text-left transition-all duration-500 border-2 ${selected === role.id
                  ? 'bg-secondary border-secondary shadow-primary-glow -translate-y-3'
                  : 'bg-white/60 dark:bg-white/5 border-white dark:border-white/10 hover:border-primary/50 hover:bg-white/80 hover:shadow-2xl'
                  }`}
              >
                <div className="flex justify-between items-start mb-10">
                  <div className={`size-20 rounded-[28px] flex items-center justify-center transition-all shadow-inner ${selected === role.id
                    ? 'bg-primary text-secondary shadow-lg'
                    : 'bg-gray-100 dark:bg-white/10 ' + role.accent
                    }`}>
                    <span className="material-symbols-outlined text-[44px] font-bold">{role.icon}</span>
                  </div>
                  {selected === role.id && (
                    <div className="size-8 bg-primary rounded-full flex items-center justify-center animate-in zoom-in border-4 border-secondary">
                      <span className="material-symbols-outlined text-secondary text-[20px] font-black">check</span>
                    </div>
                  )}
                </div>

                <h3 className={`text-2xl font-black uppercase tracking-tight mb-3 transition-colors ${selected === role.id ? 'text-white' : 'text-secondary dark:text-white'
                  }`}>
                  {role.label}
                </h3>
                <p className={`text-[13px] font-medium leading-relaxed transition-opacity ${selected === role.id ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                  {role.desc}
                </p>

                {/* Subtle Interactive Element */}
                {selected !== role.id && (
                  <div className="absolute bottom-10 right-10 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                    <span className="material-symbols-outlined text-primary text-3xl">arrow_right_alt</span>
                  </div>
                )}
              </button>
            ))}

            {/* Functional Integration Placeholder */}
            <div className="hidden lg:flex flex-col p-10 rounded-[48px] border-2 border-dashed border-primary/20 items-center justify-center bg-primary/5 opacity-50 hover:opacity-80 transition-opacity cursor-pointer group">
              <div className="size-16 rounded-[22px] bg-white dark:bg-white/5 flex items-center justify-center text-primary mb-5 shadow-sm group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[32px]">webhook</span>
              </div>
              <span className="text-[11px] font-black uppercase tracking-widest text-center text-secondary dark:text-primary leading-relaxed">
                Custom API<br />Enterprise Node
              </span>
            </div>
          </div>

          {/* Authorization Footer Action Row */}
          <div className="mt-16 flex flex-col lg:flex-row items-center justify-between gap-12 pt-14 border-t border-secondary/10 dark:border-white/10">
            <div className="flex items-center gap-6">
              <div className="size-16 rounded-full bg-secondary text-primary flex items-center justify-center shadow-xl border-4 border-white/50">
                <span className="material-symbols-outlined font-black text-[28px]">verified_user</span>
              </div>
              <div className="flex flex-col">
                <p className="text-secondary dark:text-white font-black text-base uppercase tracking-tight">Verified Protocol</p>
                <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest">End-to-end identity encryption enabled</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-10">
              <button
                onClick={handleGuestEntry}
                className="text-[13px] font-black text-secondary dark:text-white hover:text-primary uppercase tracking-[0.2em] transition-colors"
              >
                Guest View
              </button>
              <div className="h-8 w-px bg-secondary/10 dark:bg-white/10 hidden sm:block"></div>
              <button
                onClick={() => navigate('/register', { state: { role: selected } })}
                className="text-[13px] font-black text-secondary dark:text-white hover:text-primary uppercase tracking-[0.2em] transition-colors"
              >
                Register Node
              </button>
              <button
                onClick={handleEntry}
                className="h-20 px-16 bg-primary text-secondary font-black text-base uppercase tracking-[0.3em] rounded-[32px] shadow-2xl shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-1.5 active:scale-95 transition-all"
              >
                Authorize Access
              </button>
            </div>
          </div>
        </div>

        {/* Global Footer Elements */}
        <footer className="flex flex-col items-center gap-8 pb-12 opacity-70 hover:opacity-100 transition-opacity">
          <div className="flex flex-wrap justify-center items-center gap-12">
            <a href="#" className="text-[11px] font-black text-secondary dark:text-white uppercase tracking-widest hover:text-primary transition-colors">Infrastructure Status</a>
            <a href="#" className="text-[11px] font-black text-secondary dark:text-white uppercase tracking-widest hover:text-primary transition-colors">Developer Portal</a>
            <a href="#" className="text-[11px] font-black text-secondary dark:text-white uppercase tracking-widest hover:text-primary transition-colors">Region: Horn of Africa</a>
          </div>
          <div className="flex items-center gap-4 bg-white/40 dark:bg-white/5 backdrop-blur-md px-6 py-2 rounded-full border border-white/50">
            <div className="size-2 rounded-full bg-primary animate-pulse"></div>
            <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-[0.4em]">© 2024 Fudaydiye Global Operations Hub</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default RoleSelection;
