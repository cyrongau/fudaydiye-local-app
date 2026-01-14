import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Timestamp } from 'firebase/firestore';
import { useAuth } from '../Providers';
import { Product, VideoProvider } from '../types';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { liveStreamService } from '../src/lib/services/liveStreamService';
import { toast } from 'sonner';

const VendorLiveSaleSetup: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();


  const [searchParams] = useSearchParams();
  const editSessionId = searchParams.get('edit');

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Fashion');
  const [mode, setMode] = useState<'LIVE' | 'SCHEDULE'>('LIVE');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [provider, setProvider] = useState<VideoProvider>('AGORA');

  const videoRef = useRef<HTMLDivElement>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [permError, setPermError] = useState<string | null>(null);

  const [inventory, setInventory] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Load Session if Editing
  useEffect(() => {
    if (!editSessionId || !user) return;

    const loadSession = async () => {
      setIsLoading(true);
      const unsubscribe = liveStreamService.subscribeToSession(editSessionId, (data) => {
        if (data) {
          setTitle(data.title);
          setCategory(data.category);
          setMode(data.status === 'LIVE' ? 'LIVE' : 'SCHEDULE');

          if (data.scheduledAt) {
            const d = new Date(data.scheduledAt.seconds * 1000);
            setScheduledDate(d.toISOString().split('T')[0]);
            setScheduledTime(d.toTimeString().slice(0, 5));
          }

          if (data.featuredProductId) {
            // Ideally we fetch the full product or reconstruct it
            // For now, checking against loaded inventory in next effect or just waiting for inventory
          }
        }
        setIsLoading(false);
      });
      return () => unsubscribe();
    };
    loadSession();
  }, [editSessionId, user]);

  // Sync Featured Product when inventory loads
  useEffect(() => {
    if (editSessionId && inventory.length > 0 && selectedProducts.length === 0) {
      liveStreamService.subscribeToSession(editSessionId, (data) => {
        if (data?.featuredProductId) {
          const found = inventory.find(p => p.id === data.featuredProductId);
          if (found) setSelectedProducts([found]);
        }
      });
    }
  }, [inventory, editSessionId]);

  // Agora State
  const localTracks = useRef<{ audio: any; video: any }>({ audio: null, video: null });

  useEffect(() => {
    if (loading) return;
    if (!profile?.canStream) {
      toast.error("Live Streaming Access Denied. Contact Admin.");
      navigate('/vendor');
    }
  }, [profile, loading, navigate]);

  const initializeVideoProtocol = async () => {
    if (!navigator.mediaDevices) {
      setPermError("Secure context node required.");
      return;
    }
    setIsInitializing(true);
    setPermError(null);
    try {
      const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
      localTracks.current = { audio: audioTrack, video: videoTrack };
      setHasPermission(true);
      setTimeout(() => { if (videoRef.current) videoTrack.play(videoRef.current); }, 100);
      toast.success("Broadcast Node Initialized");
    } catch (err: any) {
      setPermError("Hardware link blocked. Verify permissions.");
      setHasPermission(false);
      toast.error("Camera/Mic Permission Denied");
    } finally { setIsInitializing(false); }
  };

  useEffect(() => {
    const fetchInventory = async () => {
      if (!user) return;
      try {
        const products = await liveStreamService.fetchVendorProducts(user.uid);
        setInventory(products);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load inventory");
      }
    };
    fetchInventory();
    return () => {
      if (localTracks.current.audio) { localTracks.current.audio.stop(); localTracks.current.audio.close(); }
      if (localTracks.current.video) { localTracks.current.video.stop(); localTracks.current.video.close(); }
    };
  }, [user]);

  const handleAction = async () => {
    if (!user || !title || selectedProducts.length === 0) return;

    setIsLoading(true);
    try {
      let finalScheduledAt = null;
      if (mode === 'SCHEDULE') {
        const dateObj = new Date(`${scheduledDate}T${scheduledTime}`);
        finalScheduledAt = Timestamp.fromDate(dateObj);
      }

      const sessionData = {
        vendorId: user.uid,
        vendorName: profile?.businessName || "Merchant",
        hostAvatar: profile?.avatar || "",
        title,
        category,
        status: mode === 'LIVE' ? 'LIVE' : 'SCHEDULED' as any,
        featuredProductId: selectedProducts[0]?.id || null,
        featuredProductName: selectedProducts[0]?.name || null,
        featuredProductPrice: selectedProducts[0]?.basePrice || null || selectedProducts[0]?.price || 0,
        featuredProductImg: selectedProducts[0]?.images?.[0] || null,
        scheduledAt: finalScheduledAt
      };

      if (editSessionId) {
        await liveStreamService.updateSession(editSessionId, sessionData);
        toast.success("Session Updated");
        navigate('/vendor/live-sessions');
      } else {
        // Create New
        const sessionId = await liveStreamService.createSession({
          ...sessionData,
          mode: mode,
          featuredProduct: selectedProducts[0]
        });

        if (mode === 'LIVE') {
          toast.success("Session Created! Redirecting to setup...");
          navigate(`/vendor/live-cockpit/${sessionId}`);
        } else {
          toast.success("Broadcast Scheduled Successfully");
          navigate('/vendor/live-sessions');
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Operation failed. Check permissions.");
    } finally {
      setIsLoading(false);
    }
  };

  const isTitleValid = title.trim().length > 3;
  const isInventoryValid = selectedProducts.length > 0;
  const isScheduleValid = mode === 'SCHEDULE' ? (!!scheduledDate && !!scheduledTime) : true;
  const canProceed = isTitleValid && isInventoryValid && isScheduleValid && !isLoading;

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark font-display">
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-surface-dark/90 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/5 active:scale-90 transition-all">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-sm font-black text-secondary dark:text-white uppercase tracking-widest leading-none">Broadcast Control</h1>
        <div className="size-10"></div>
      </header>

      <main className="p-6 flex-1 flex flex-col gap-8 overflow-y-auto pb-48 no-scrollbar max-w-2xl mx-auto w-full">
        {mode === 'LIVE' ? (
          <section className="relative aspect-[3/4] rounded-[48px] overflow-hidden bg-black shadow-2xl border-8 border-white dark:border-surface-dark group">
            <div ref={videoRef} className={`w-full h-full object-cover transition-opacity duration-700 ${hasPermission ? 'opacity-100' : 'opacity-0 absolute'}`} />
            {!hasPermission && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-10 text-center bg-zinc-900">
                <span className="material-symbols-outlined text-primary text-5xl mb-6 animate-pulse">{permError ? 'error' : 'videocam_off'}</span>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-6 leading-relaxed">{permError || 'Initialize hardware node to start.'}</p>
                <button onClick={initializeVideoProtocol} disabled={isInitializing} className="h-16 px-10 bg-primary text-secondary rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 shadow-xl transition-all">
                  {isInitializing ? 'INITIALIZING...' : 'Link Video Node'}
                </button>
              </div>
            )}
            {hasPermission && <div className="absolute top-8 left-8 bg-black/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-2"><div className="size-2 rounded-full bg-primary animate-ping"></div><span className="text-[10px] font-black text-white uppercase tracking-widest">Feed Active</span></div>}
          </section>
        ) : (
          <section className="bg-secondary text-white p-10 rounded-[48px] shadow-2xl relative overflow-hidden group border border-white/5">
            <div className="absolute top-0 right-0 size-48 bg-primary/20 blur-[80px] rounded-full"></div>
            <div className="relative z-10">
              <h3 className="text-xl font-black uppercase tracking-tighter mb-4">Event Scheduling</h3>
              <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-8 leading-relaxed">Schedule your session to build hype. A countdown banner will appear on your shop page for all customers.</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-primary uppercase">Broadcast Date</label>
                  <input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} className="w-full h-12 bg-white/10 border border-white/10 rounded-xl px-4 text-xs font-bold text-white" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-primary uppercase">Broadcast Time</label>
                  <input type="time" value={scheduledTime} onChange={e => setScheduledTime(e.target.value)} className="w-full h-12 bg-white/10 border border-white/10 rounded-xl px-4 text-xs font-bold text-white" />
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="space-y-10">
          <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-2xl border border-gray-200 dark:border-white/10">
            <button onClick={() => setMode('LIVE')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'LIVE' ? 'bg-white dark:bg-surface-dark text-primary shadow-sm' : 'text-gray-400'}`}>Start Now</button>
            <button onClick={() => setMode('SCHEDULE')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'SCHEDULE' ? 'bg-white dark:bg-surface-dark text-primary shadow-sm' : 'text-gray-400'}`}>Schedule Future</button>
          </div>

          <div className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Session Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Identify your live drop..." className="w-full h-16 rounded-[24px] bg-white dark:bg-surface-dark border-2 border-gray-100 dark:border-gray-800 px-6 text-sm font-black text-secondary dark:text-white focus:border-primary transition-all shadow-inner" />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Featured Inventory</label>
                <div className="relative w-40">
                  <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-[14px]">search</span>
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-8 pl-7 pr-3 bg-gray-100 dark:bg-white/5 border-none rounded-lg text-[10px] font-bold text-secondary dark:text-white focus:ring-1 focus:ring-primary placeholder:text-gray-400 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 max-h-[250px] overflow-y-auto no-scrollbar content-start">
                {inventory
                  .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(p => (
                    <button key={p.id} onClick={() => setSelectedProducts(prev => prev.find(s => s.id === p.id) ? prev.filter(s => s.id !== p.id) : [...prev, p])} className={`p-4 rounded-[28px] border-2 flex items-center gap-3 text-left transition-all ${selectedProducts.find(s => s.id === p.id) ? 'bg-primary/5 border-primary shadow-md' : 'bg-white dark:bg-surface-dark border-gray-50 dark:border-white/5'}`}>
                      <img src={p.images?.[0] || 'https://placehold.co/100'} className="size-10 rounded-xl overflow-hidden shrink-0 border border-gray-100 object-cover" alt="" />
                      <span className="text-[10px] font-black uppercase truncate text-secondary dark:text-white">{p.name}</span>
                    </button>
                  ))}
                {inventory.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                  <div className="col-span-2 py-8 text-center opacity-40">
                    <span className="material-symbols-outlined text-2xl mb-1">search_off</span>
                    <p className="text-[9px] font-black uppercase">No items found</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <button disabled={!canProceed} onClick={handleAction} className="w-full h-16 bg-red-600 disabled:bg-gray-200 dark:disabled:bg-white/5 text-white font-black text-sm uppercase tracking-[0.4em] rounded-[32px] shadow-2xl flex items-center justify-center gap-4 active:scale-[0.98] transition-all group">
            {isLoading ? "PROCESSING..." : (editSessionId ? "UPDATE SESSION" : (mode === 'LIVE' ? "INITIALIZE BROADCAST" : "CONFIRM SCHEDULE"))}
            <span className="material-symbols-outlined font-black group-hover:animate-pulse">sensors</span>
          </button>
        </section>
      </main>
    </div>
  );
};

export default VendorLiveSaleSetup;
