
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const LiveHostProfile: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'REPLAYS' | 'SHOP' | 'UPCOMING'>('REPLAYS');
  const [isFollowing, setIsFollowing] = useState(false);

  const [host, setHost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Replays and Products remain mock for now as they require distinct collections not yet populated
  const replays = [
    { id: '1', title: "iPhone 15 Pro Max Deep Dive", date: "2 days ago", views: "4.2k", img: "https://picsum.photos/id/1/400/250" },
    { id: '2', title: "Samsung Galaxy Unboxing", date: "1 week ago", views: "8.1k", img: "https://picsum.photos/id/2/400/250" },
    { id: '3', title: "Smart Watch Face-off", date: "2 weeks ago", views: "3.5k", img: "https://picsum.photos/id/3/400/250" },
  ];

  const products = [
    { id: '101', name: "Fast Charger 65W", price: "$25.00", img: "https://picsum.photos/id/4/200/200" },
    { id: '102', name: "Wireless Headphones", price: "$45.00", img: "https://picsum.photos/id/5/200/200" },
    { id: '103', name: "Protective Glass 5D", price: "$8.00", img: "https://picsum.photos/id/6/200/200" },
  ];

  React.useEffect(() => {
    if (!id) return;
    const fetchHost = async () => {
      try {
        // Dynamic import to avoid top-level issues if not used elsewhere, or just rely on existing imports if any
        const { doc, getDoc } = await import('firebase/firestore');
        const { db } = await import('../lib/firebase');

        const docSnap = await getDoc(doc(db, "users", id));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setHost({
            name: data.displayName || "Unknown User",
            handle: data.username ? `@${data.username}` : "@user",
            bio: data.bio || "No bio available.",
            followers: data.followersCount || "0",
            likes: data.likesCount || "0",
            hours: data.liveHours || "0",
            avatar: data.photoURL || "https://i.pravatar.cc/150",
            cover: data.coverPhoto || "https://via.placeholder.com/800x400",
            isVerified: data.isVerified || false
          });
        }
      } catch (err) {
        console.error("Failed to load host", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHost();
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark"><div className="animate-spin size-8 border-4 border-primary rounded-full border-t-transparent"></div></div>;
  if (!host) return <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark text-gray-500">Host not found</div>;

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-300 font-display">
      {/* Header / Cover Area */}
      <header className="relative h-64 w-full">
        <div className="absolute inset-0 bg-gradient-to-t from-background-light dark:from-background-dark via-transparent to-black/40 z-10"></div>
        <img src={host.cover} className="w-full h-full object-cover" alt="Cover" />

        <div className="absolute top-12 left-6 z-20 flex w-[calc(100%-48px)] justify-between items-center">
          <button onClick={() => navigate(-1)} className="size-10 rounded-full bg-black/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white active:scale-90 transition-all">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <button className="size-10 rounded-full bg-black/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white active:scale-90 transition-all">
            <span className="material-symbols-outlined">share</span>
          </button>
        </div>

        {/* Profile Info Overlay (Breaking the cover) */}
        <div className="absolute -bottom-16 left-6 right-6 z-20 flex flex-col items-center">
          <div className="relative group">
            <div className="size-32 rounded-[40px] bg-white dark:bg-surface-dark p-1.5 shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden group-hover:scale-105 transition-transform duration-500">
              <img src={host.avatar} className="w-full h-full object-cover rounded-[34px]" alt="Host" />
            </div>
            <div className="absolute bottom-1 right-1 size-8 bg-primary rounded-full border-4 border-white dark:border-background-dark flex items-center justify-center shadow-lg">
              <span className="material-symbols-outlined text-secondary text-[14px] font-black">check</span>
            </div>
          </div>
        </div>
      </header>

      <main className="mt-20 px-6 flex-1 flex flex-col pb-32 no-scrollbar">
        {/* Host Identity Section */}
        <section className="text-center mb-8">
          <h1 className="text-3xl font-black text-secondary dark:text-white tracking-tighter leading-none mb-1 flex items-center justify-center gap-2">
            {host.name}
            {host.isVerified && <span className="material-symbols-outlined text-primary text-[24px] icon-filled">verified</span>}
          </h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-4">{host.handle}</p>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300 leading-relaxed max-w-xs mx-auto mb-6">
            {host.bio}
          </p>

          <div className="flex gap-3 justify-center mb-8">
            <button
              onClick={() => setIsFollowing(!isFollowing)}
              className={`h-14 px-10 rounded-[22px] font-black text-xs uppercase tracking-[0.2em] transition-all shadow-lg active:scale-95 ${isFollowing
                  ? 'bg-gray-100 dark:bg-white/5 text-gray-500 border border-gray-200 dark:border-white/10'
                  : 'bg-primary text-secondary'
                }`}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
            <button className="size-14 bg-secondary text-primary rounded-[22px] flex items-center justify-center shadow-lg active:scale-95 transition-all">
              <span className="material-symbols-outlined text-[24px] font-black">chat</span>
            </button>
          </div>

          {/* Core Stats Row */}
          <div className="flex justify-around items-center py-6 bg-white dark:bg-surface-dark rounded-[32px] border border-gray-100 dark:border-white/5 shadow-soft divide-x divide-gray-50 dark:divide-white/5">
            <StatItem label="Followers" value={host.followers} />
            <StatItem label="Likes" value={host.likes} />
            <StatItem label="Live Hours" value={host.hours} />
          </div>
        </section>

        {/* Tab Control */}
        <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-2xl border border-gray-200 dark:border-white/10 mb-8 sticky top-2 z-30 backdrop-blur-md">
          {(['REPLAYS', 'SHOP', 'UPCOMING'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab
                  ? 'bg-white dark:bg-surface-dark text-secondary dark:text-primary shadow-sm'
                  : 'text-gray-400'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="space-y-6">
          {activeTab === 'REPLAYS' && (
            <div className="grid grid-cols-1 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              {replays.map(rep => (
                <div key={rep.id} className="group cursor-pointer">
                  <div className="relative aspect-video rounded-[28px] overflow-hidden shadow-soft mb-3">
                    <img src={rep.img} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" alt={rep.title} />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                    <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-lg text-white text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 border border-white/10">
                      <span className="material-symbols-outlined text-[14px]">visibility</span>
                      {rep.views}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="size-14 rounded-full bg-primary/90 text-secondary flex items-center justify-center shadow-2xl scale-75 group-hover:scale-100 transition-transform">
                        <span className="material-symbols-outlined text-[32px] fill-1">play_arrow</span>
                      </div>
                    </div>
                  </div>
                  <div className="px-1">
                    <h4 className="text-sm font-black text-secondary dark:text-white mb-1 leading-tight group-hover:text-primary transition-colors">{rep.title}</h4>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{rep.date}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'SHOP' && (
            <div className="flex flex-col gap-4 animate-in slide-in-from-right-4 duration-300">
              <div className="p-5 bg-primary/10 rounded-[32px] border border-primary/20 flex items-center justify-between group cursor-pointer" onClick={() => navigate('/customer/store/ahmed-electronics')}>
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-2xl bg-primary flex items-center justify-center text-secondary shadow-lg">
                    <span className="material-symbols-outlined text-3xl font-black">storefront</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-secondary dark:text-white leading-none mb-1">Full Merchant Store</h4>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Browse all 1,240 items</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-primary group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {products.map(prod => (
                  <div key={prod.id} className="bg-white dark:bg-surface-dark p-3 rounded-card-xl shadow-soft border border-gray-100 dark:border-white/5 flex flex-col group cursor-pointer active:scale-95 transition-all">
                    <div className="aspect-square rounded-2xl overflow-hidden mb-3 shadow-inner bg-gray-50 dark:bg-black/20">
                      <img src={prod.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt={prod.name} />
                    </div>
                    <h5 className="text-[11px] font-black text-secondary dark:text-white truncate mb-1">{prod.name}</h5>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-xs font-black text-primary">{prod.price}</span>
                      <button className="size-8 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400">
                        <span className="material-symbols-outlined text-[18px]">add</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'UPCOMING' && (
            <div className="flex flex-col gap-4 animate-in zoom-in-95 duration-300">
              {[1].map(i => (
                <div key={i} className="bg-secondary text-white p-6 rounded-[32px] shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 size-24 bg-primary/20 blur-3xl rounded-full"></div>
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                      <div className="bg-primary text-secondary px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg">
                        <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                        Coming Soon
                      </div>
                      <button className="size-9 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary">notifications</span>
                      </button>
                    </div>
                    <h4 className="text-xl font-black tracking-tight leading-tight mb-2 uppercase">Big Tech Tuesday: Summer Sale</h4>
                    <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest leading-relaxed mb-6">
                      Oct 31, 2023 • 14:00 PM (GMT+3) <br />
                      Win prizes and massive discounts!
                    </p>
                    <button className="w-full h-12 bg-white text-secondary rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all">Set Reminder</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

const StatItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex-1 flex flex-col items-center">
    <span className="text-xl font-black text-secondary dark:text-white tracking-tighter leading-none mb-1">{value}</span>
    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
  </div>
);

export default LiveHostProfile;
