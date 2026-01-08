
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp, addDoc, collection, onSnapshot, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Order, UserProfile } from '../types';

declare const google: any;

const RiderPickupConfirmation: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [vendorLoc, setVendorLoc] = useState<{ lat: number, lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [itemsVerified, setItemsVerified] = useState<Record<string, boolean>>({});
  const [itemPhotos, setItemPhotos] = useState<Record<string, string>>({});
  const [isConfirming, setIsConfirming] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  const mapRef = useRef<HTMLDivElement>(null);
  const googleMap = useRef<any>(null);
  const riderMarker = useRef<any>(null);

  useEffect(() => {
    if (!id) return;
    const unsub = onSnapshot(doc(db, "orders", id), async (snap) => {
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() } as Order;
        setOrder(data);

        if (data && !vendorLoc) {
          const initialChecks: Record<string, boolean> = {};
          data.items.forEach((item, idx) => initialChecks[`item-${idx}`] = false);
          setItemsVerified(initialChecks);

          const vendorSnap = await getDoc(doc(db, "users", data.vendorId));
          if (vendorSnap.exists()) {
            const vData = vendorSnap.data() as UserProfile;
            if (vData.lat && vData.lng) {
              setVendorLoc({ lat: vData.lat, lng: vData.lng });
            }
          }
        }

        if (data.currentLocation && googleMap.current) {
          const pos = { lat: data.currentLocation.lat, lng: data.currentLocation.lng };
          if (!riderMarker.current) {
            riderMarker.current = new google.maps.Marker({
              position: pos,
              map: googleMap.current,
              icon: {
                path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                scale: 5,
                fillColor: "#06DC7F",
                fillOpacity: 1,
                strokeWeight: 1,
                strokeColor: "#ffffff",
              }
            });
          } else {
            riderMarker.current.setPosition(pos);
          }
        }
      } else {
        console.error("Order not found:", id);
        setLoading(false); // Stop loading even if not found
      }
      setLoading(false);
    }, (error) => {
      console.error("Firestore Permission Error:", error);
      setLoading(false);
    });
    return () => unsub();
  }, [id, vendorLoc]);

  useEffect(() => {
    const loadMapScript = async () => {
      // Changed to use Env Var directly for security/performance
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey) { console.error("Missing Maps Key"); return; }

      if ((window as any).google) { setMapLoaded(true); return; }
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
      script.async = true;
      script.onload = () => setMapLoaded(true);
      document.head.appendChild(script);
    };
    loadMapScript();
  }, []);

  useEffect(() => {
    if (mapLoaded && mapRef.current && vendorLoc && !googleMap.current) {
      googleMap.current = new google.maps.Map(mapRef.current, {
        center: vendorLoc,
        zoom: 17,
        disableDefaultUI: true,
        styles: landmarkTacticalStyles,
      });

      new google.maps.Marker({
        position: vendorLoc,
        map: googleMap.current,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: "#06DC7F",
          fillOpacity: 1,
          strokeWeight: 3,
          strokeColor: "#ffffff",
        }
      });
    }
  }, [mapLoaded, vendorLoc]);

  const clearAssociatedNotifications = async () => {
    if (!id) return;
    try {
      const q = query(collection(db, "notifications"), where("link", "==", `/rider/pickup/${id}`));
      const snap = await getDocs(q);
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.update(d.ref, { isRead: true }));
      await batch.commit();
    } catch (e) { console.error("Notification clear failed", e); }
  };

  const toggleItem = (key: string) => {
    setItemsVerified(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCapturePhoto = (key: string) => {
    const mockPhoto = "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=800";
    setItemPhotos(prev => ({ ...prev, [key]: mockPhoto }));
  };

  const allItemsChecked = order?.items.every((_, i) => itemsVerified[`item-${i}`] && itemPhotos[`item-${i}`]);

  const handleStartTransit = async () => {
    if (!order) return;
    setIsConfirming(true);
    try {
      await updateDoc(doc(db, "orders", order.id), {
        status: 'SHIPPED',
        pickupVerifiedAt: serverTimestamp(),
        lastStatusUpdate: serverTimestamp()
      });

      await clearAssociatedNotifications();

      await addDoc(collection(db, "notifications"), {
        userId: order.riderId,
        title: "In-Transit Verification",
        message: `Package #${order.orderNumber} pickup verified. Proceed to drop-off node.`,
        link: `/rider/confirm/${order.id}`,
        type: 'ORDER',
        isRead: false,
        createdAt: serverTimestamp()
      });

      navigate(`/rider/navigate/${order.id}?leg=delivery`);
    } catch (err) {
      alert("Mesh sync failed.");
    } finally {
      setIsConfirming(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-background-light dark:bg-background-dark"><div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-300 font-display">
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-surface-dark/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-8 py-6 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="size-12 flex items-center justify-center rounded-2xl bg-gray-50 dark:bg-white/5 active:scale-90 transition-all border border-gray-100 dark:border-white/10">
          <span className="material-symbols-outlined text-secondary dark:text-white text-[28px]">arrow_back</span>
        </button>
        <div className="flex flex-col items-center">
          <h2 className="text-sm font-black tracking-[0.3em] text-secondary dark:text-primary uppercase leading-none">Verification Node</h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">#{order?.orderNumber}</p>
        </div>
        <div className="size-12"></div>
      </header>

      <main className="p-8 md:p-16 flex flex-col gap-12 overflow-y-auto pb-48 no-scrollbar animate-in fade-in duration-700 max-w-6xl mx-auto w-full">
        <section className="relative h-[320px] rounded-[48px] overflow-hidden border border-gray-100 dark:border-white/10 shadow-2xl bg-off-white dark:bg-zinc-900">
          {!mapLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div className="size-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            </div>
          )}
          <div ref={mapRef} className="w-full h-full" />

          <div className="absolute inset-0 bg-gradient-to-t from-secondary/40 via-transparent to-transparent pointer-events-none"></div>

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative">
              <div className="absolute inset-0 size-20 bg-primary/10 rounded-full animate-ping-slow"></div>
              <div className="size-12 bg-white dark:bg-surface-dark rounded-full flex items-center justify-center shadow-2xl relative border-2 border-primary">
                <span className="material-symbols-outlined text-primary font-black text-2xl">storefront</span>
              </div>
            </div>
          </div>

          <div className="absolute bottom-10 left-10 right-10 flex items-end justify-between pointer-events-none">
            <div>
              <p className="text-[11px] font-black text-primary uppercase tracking-[0.4em] mb-2 drop-shadow-md">Pickup Point</p>
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter drop-shadow-2xl">{order?.vendorName || 'Merchant Node'}</h3>
            </div>
            <button
              onClick={() => navigate(`/rider/navigate/${id}?leg=pickup`)}
              className="pointer-events-auto h-12 px-6 bg-primary text-secondary font-black text-[10px] uppercase tracking-[0.3em] rounded-[18px] shadow-primary-glow active:scale-95 transition-all flex items-center gap-2"
            >
              In-App Nav
              <span className="material-symbols-outlined text-[16px]">near_me</span>
            </button>
          </div>
        </section>

        <section className="space-y-8">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[11px] font-black text-gray-400 dark:text-white/40 uppercase tracking-[0.4em]">Multi-Asset Verification</h3>
            <span className="text-[10px] font-black text-primary uppercase tracking-widest">{Object.values(itemPhotos).length}/{order?.items.length} Proofs Logged</span>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {order?.items.map((item, idx) => {
              const key = `item-${idx}`;
              const hasItemPhoto = !!itemPhotos[key];
              const isVerified = itemsVerified[key];

              return (
                <div key={idx} className={`p-6 rounded-[40px] border-2 transition-all flex flex-col gap-6 ${isVerified && hasItemPhoto ? 'bg-primary/5 border-primary' : 'bg-white dark:bg-surface-dark border-gray-100 dark:border-white/5 shadow-soft'
                  }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        onClick={() => toggleItem(key)}
                        className={`size-12 rounded-2xl flex items-center justify-center border-2 transition-all cursor-pointer ${isVerified ? 'bg-primary border-primary text-secondary' : 'bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/10 text-gray-300'
                          }`}
                      >
                        <span className="material-symbols-outlined text-[24px] font-black">{isVerified ? 'check' : 'radio_button_unchecked'}</span>
                      </div>
                      <div>
                        <p className={`text-lg font-black uppercase tracking-tighter ${isVerified ? 'text-secondary dark:text-white' : 'text-gray-400'}`}>{item.name}</p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Qty: {item.qty} • {item.attribute}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleCapturePhoto(key)}
                      className={`size-12 rounded-xl flex items-center justify-center transition-all ${hasItemPhoto ? 'bg-secondary text-primary' : 'bg-gray-50 dark:bg-white/10 text-gray-400 border border-gray-100'
                        }`}
                    >
                      <span className="material-symbols-outlined">{hasItemPhoto ? 'check_circle' : 'photo_camera'}</span>
                    </button>
                  </div>

                  {hasItemPhoto && (
                    <div className="relative aspect-video rounded-3xl overflow-hidden border-2 border-primary/20 animate-in zoom-in duration-300">
                      <img src={itemPhotos[key]} className="w-full h-full object-cover" alt="Verification" />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer" onClick={() => handleCapturePhoto(key)}>
                        <span className="text-[9px] font-black uppercase text-white bg-black/40 px-3 py-1.5 rounded-lg">Retake Proof</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <div className="bg-amber-50 dark:bg-amber-500/10 p-10 rounded-[48px] border border-amber-100 dark:border-amber-500/20 flex gap-8 items-start animate-in slide-in-from-top-4 mb-10">
          <div className="size-14 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-600 shrink-0">
            <span className="material-symbols-outlined text-4xl font-black">warning</span>
          </div>
          <p className="text-[13px] font-medium text-amber-800 dark:text-amber-400 leading-relaxed uppercase tracking-widest">
            <span className="font-black block mb-2">Platform Safeguard:</span> A unique photo proof is required for <span className="font-black">each item node</span>. Visual artifacts are cross-referenced during delivery handovers.
          </p>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-background-dark/95 backdrop-blur-md border-t border-gray-100 dark:border-white/5 p-10 pb-14 shadow-[0_-20px_80px_rgba(0,0,0,0.2)]">
        <div className="max-w-3xl mx-auto">
          <button
            disabled={!allItemsChecked || isConfirming}
            onClick={handleStartTransit}
            className="w-full h-24 bg-primary disabled:opacity-20 text-secondary font-black text-base uppercase tracking-[0.5em] rounded-[32px] shadow-primary-glow flex items-center justify-center gap-6 active:scale-[0.98] transition-all group"
          >
            {isConfirming ? (
              <span className="animate-spin material-symbols-outlined text-4xl">sync</span>
            ) : (
              <>
                Authorize Transit Sequence
                <span className="material-symbols-outlined font-black text-4xl animate-pulse">bolt</span>
              </>
            )}
          </button>
        </div>
      </footer>
    </div>
  );
};

const landmarkTacticalStyles = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ visibility: "on" }, { color: "#242f3e" }, { weight: 2 }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#ffffff" }] },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#38414e" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#ffffff" }, { weight: 500 }],
  },
  {
    featureType: "poi",
    elementType: "labels",
    stylers: [{ visibility: "on" }],
  },
  {
    featureType: "poi.business",
    stylers: [{ visibility: "on" }]
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#17263c" }],
  },
];

export default RiderPickupConfirmation;
