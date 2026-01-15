
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Providers';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import BottomNav from '../components/BottomNav';
import { RiderService } from '../src/lib/services/riderService';

const RiderStatusUpdates: React.FC = () => {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const [isOnline, setIsOnline] = useState(profile?.status === 'ONLINE');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (profile) {
      setIsOnline(profile.status === 'ONLINE');
    }
  }, [profile]);

  const toggleDuty = async () => {
    if (!user) return;
    setIsUpdating(true);
    try {
      const nextStatus = isOnline ? 'OFFLINE' : 'ONLINE';
      await RiderService.updateStatus(user.uid, nextStatus);
      setIsOnline(!isOnline);
      // Optimistically update profile fallback
    } catch (err) {
      alert("Failed to synchronize status node.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Logic: Efficiency calculation based on SLA performance
  // (On-time deliveries / Total deliveries) * 100
  const efficiencyScore = useMemo(() => {
    if (!profile?.ordersFulfilled || profile.ordersFulfilled === 0) return '100%';
    const rate = ((profile.onTimeDeliveries || 0) / profile.ordersFulfilled) * 100;
    return `${Math.round(rate)}%`;
  }, [profile]);

  // Logic: Trust Score based on average of customer ratings
  const trustScore = useMemo(() => {
    if (!profile?.totalRatingsCount || profile.totalRatingsCount === 0) return '5.0';
    const avg = (profile.ratingsSum || 0) / profile.totalRatingsCount;
    return avg.toFixed(1);
  }, [profile]);

  const performance = {
    todayEarnings: `$${(profile?.walletBalance || 0).toFixed(2)}`,
    trips: profile?.ordersFulfilled || 0,
    onlineHours: '6.5h',
    rating: trustScore,
    efficiency: efficiencyScore
  };

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-300 font-display">
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-surface-dark/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-6 py-6 flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-2xl font-black text-secondary dark:text-white tracking-tighter">Status & Duty</h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">Personnel Management</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className={`text-[10px] font-black uppercase tracking-widest leading-none mb-1 ${isOnline ? 'text-primary' : 'text-gray-400'}`}>
              {isOnline ? 'Active' : 'Dormant'}
            </span>
            <span className="text-xs font-bold text-secondary dark:text-white">{profile?.fullName}</span>
          </div>
          <div className="size-11 rounded-2xl border-2 border-primary/20 shadow-soft overflow-hidden">
            <img src={profile?.avatar || `https://ui-avatars.com/api/?name=${profile?.fullName || 'R'}`} className="w-full h-full object-cover" alt="Profile" />
          </div>
        </div>
      </header>

      <main className="p-6 flex-1 flex flex-col gap-6 overflow-y-auto pb-32 no-scrollbar animate-in fade-in duration-500">
        <section className={`p-8 rounded-[40px] shadow-2xl transition-all duration-500 border-2 ${isOnline
          ? 'bg-secondary border-primary/30 text-white'
          : 'bg-white dark:bg-surface-dark border-gray-100 dark:border-gray-800 text-gray-400'
          }`}>
          <div className="flex justify-between items-start mb-10">
            <div>
              <p className={`text-[10px] font-black uppercase tracking-[0.3em] mb-2 ${isOnline ? 'text-primary' : 'text-gray-400'}`}>Current Availability</p>
              <h2 className={`text-4xl font-black tracking-tighter leading-none ${isOnline ? 'text-white' : 'text-gray-300'}`}>
                {isOnline ? 'Online' : 'Offline'}
              </h2>
            </div>
            <button
              disabled={isUpdating}
              onClick={toggleDuty}
              className={`h-10 w-20 rounded-full relative p-1 transition-all duration-500 ${isOnline ? 'bg-primary' : 'bg-gray-200 dark:bg-white/10'} ${isUpdating ? 'opacity-50' : ''}`}
            >
              <div className={`size-8 rounded-full bg-white shadow-xl transition-transform duration-500 flex items-center justify-center ${isOnline ? 'translate-x-10' : 'translate-x-0'}`}>
                {isUpdating ? (
                  <span className="animate-spin material-symbols-outlined text-[18px] text-gray-400">sync</span>
                ) : (
                  <span className={`material-symbols-outlined text-[20px] ${isOnline ? 'text-primary' : 'text-gray-300'}`}>
                    {isOnline ? 'bolt' : 'power_settings_new'}
                  </span>
                )}
              </div>
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className={`flex-1 p-4 rounded-2xl border transition-colors ${isOnline ? 'bg-white/5 border-white/10' : 'bg-gray-50 dark:bg-white/2 border-gray-100 dark:border-white/5'}`}>
              <p className="text-[9px] font-bold uppercase tracking-widest opacity-60 mb-1">Session Node</p>
              <p className={`text-xl font-black ${isOnline ? 'text-primary' : 'text-gray-400'}`}>{isOnline ? 'Active' : '--'}</p>
            </div>
            <div className={`flex-1 p-4 rounded-2xl border transition-colors ${isOnline ? 'bg-white/5 border-white/10' : 'bg-gray-50 dark:bg-white/2 border-gray-100 dark:border-white/5'}`}>
              <p className="text-[9px] font-bold uppercase tracking-widest opacity-60 mb-1">Hub Zone</p>
              <p className={`text-xl font-black ${isOnline ? 'text-white' : 'text-gray-400'}`}>{profile?.location || 'Central'}</p>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Live Telemetry</h3>
            <div className="flex items-center gap-1">
              <span className="size-1.5 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">GPS Linked</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <MetricBox label="Valuation" value={performance.todayEarnings} icon="payments" color="text-primary" />
            <MetricBox label="Trips" value={performance.trips} icon="local_shipping" color="text-blue-500" />
            <MetricBox label="Efficiency" value={performance.efficiency} icon="speed" color="text-amber-500" />
            <MetricBox label="Trust Score" value={performance.rating} icon="star" color="text-primary" />
          </div>
        </section>

        <section className="mb-10">
          <div className="bg-white dark:bg-surface-dark p-6 rounded-[32px] border border-gray-100 dark:border-white/5 shadow-soft">
            <h4 className="text-xs font-black text-secondary dark:text-white uppercase tracking-widest mb-4">Assigned Vehicle</h4>
            <div className="flex items-center gap-4">
              <div className="size-14 rounded-2xl bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400 border border-gray-100 dark:border-white/10">
                <span className="material-symbols-outlined text-3xl">two_wheeler</span>
              </div>
              <div>
                <p className="text-base font-black text-secondary dark:text-white uppercase leading-none mb-1">{profile?.vehicleType || 'Bajaj'}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Plate: {profile?.plateNumber || 'N/A'}</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
};

const MetricBox: React.FC<{ label: string; value: string | number; icon: string; color: string }> = ({ label, value, icon, color }) => (
  <div className="bg-white dark:bg-surface-dark p-5 rounded-[28px] border border-gray-100 dark:border-white/5 shadow-soft flex flex-col gap-3">
    <div className={`size-10 rounded-xl ${color.replace('text-', 'bg-')}/10 flex items-center justify-center ${color}`}>
      <span className="material-symbols-outlined">{icon}</span>
    </div>
    <div>
      <p className="text-2xl font-black text-secondary dark:text-white tracking-tighter leading-none mb-1">{value}</p>
      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
    </div>
  </div>
);

export default RiderStatusUpdates;
