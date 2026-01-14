
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Order, UserProfile } from '../types';

declare const google: any;

const TrackingMap: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [riderPhone, setRiderPhone] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMap = useRef<any>(null);
  const riderMarker = useRef<any>(null);

  useEffect(() => {
    const loadMapScript = async () => {
      try {
        const configSnap = await getDoc(doc(db, "system_config", "global"));
        const apiKey = configSnap.data()?.integrations?.maps?.apiKey;

        if (!apiKey) {
          console.warn("Maps API Key missing. Falling back to Mock Map.");
          setMapLoaded(true);
          return;
        }

        if ((window as any).google && (window as any).google.maps) {
          setMapLoaded(true);
          return;
        }

        // Check for existing script tag to prevent double-injection
        const existingScript = document.querySelector(`script[src^="https://maps.googleapis.com/maps/api/js?key=${apiKey}"]`);
        if (existingScript) {
          if (!(window as any).google) {
            const checkGoogle = setInterval(() => {
              if ((window as any).google) {
                setMapLoaded(true);
                clearInterval(checkGoogle);
              }
            }, 500);
          } else {
            setMapLoaded(true);
          }
          return;
        }

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry`;
        script.async = true;
        script.onload = () => setMapLoaded(true);
        script.onerror = () => {
          console.error("Maps API failed to load");
          setMapLoaded(true);
        };
        document.head.appendChild(script);
      } catch (err) {
        console.error("Config fetch error", err);
        setMapLoaded(true);
      }
    };
    loadMapScript();
  }, []);

  useEffect(() => {
    if (mapLoaded && mapRef.current && !googleMap.current) {
      if ((window as any).google) {
        googleMap.current = new google.maps.Map(mapRef.current, {
          center: { lat: 9.5624, lng: 44.0770 },
          zoom: 15,
          disableDefaultUI: true,
          styles: mapStyles,
        });
      } else {
        // Mock Map Render (if needed, or just leave gray background)
        if (mapRef.current) {
          mapRef.current.innerHTML = '<div style="width:100%;height:100%;background:#e5e7eb;display:flex;align-items:center;justify-content:center;opacity:0.5;font-weight:900;letter-spacing:0.2em;color:#9ca3af">MOCK MAP VISUALIZATION</div>';
        }
      }
    }
  }, [mapLoaded]);

  useEffect(() => {
    if (!id || !mapLoaded) return;

    const unsub = onSnapshot(doc(db, "orders", id), (snap) => {
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() } as Order;
        setOrder(data);

        if (data.riderId && !riderPhone) {
          getDoc(doc(db, "users", data.riderId))
            .then(uSnap => {
              if (uSnap.exists()) setRiderPhone((uSnap.data() as UserProfile).mobile);
            })
            .catch(err => {
              // Silently handle permission errors for rider profile access
              console.warn("Rider info access restricted:", err);
            });
        }

        if (data.currentLocation && googleMap.current) {
          const pos = { lat: data.currentLocation.lat, lng: data.currentLocation.lng };
          if (!riderMarker.current) {
            riderMarker.current = new google.maps.Marker({
              position: pos,
              map: googleMap.current,
              icon: {
                path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                scale: 6,
                fillColor: "#06DC7F",
                fillOpacity: 1,
                strokeWeight: 2,
                strokeColor: "#015754",
              }
            });
          } else {
            riderMarker.current.setPosition(pos);
          }
          googleMap.current.panTo(pos);
        }
      }
    }, (error) => {
      console.error("Tracking listener error:", error);
      if (error.code === 'permission-denied') {
        // Optional: Handle UI feedback
      }
    });

    return () => unsub();
  }, [id, mapLoaded, riderPhone]);

  const handleCallRider = () => {
    if (riderPhone) window.location.href = `tel:${riderPhone.replace(/\s+/g, '')}`;
    else alert("Captain voice node not yet linked.");
  };

  return (
    <div className="relative h-screen w-full overflow-hidden flex flex-col font-display bg-background-light dark:bg-background-dark">
      <div className="absolute inset-0 z-0 h-[68%] w-full bg-gray-200">
        {!mapLoaded && (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-surface-dark gap-4">
            <div className="size-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest uppercase">Connecting to Dispatch Cloud...</p>
          </div>
        )}
        <div ref={mapRef} className="w-full h-full" />
      </div>

      <div className="absolute top-0 left-0 w-full z-20 px-8 pt-12 flex justify-between items-center pointer-events-none">
        <button onClick={() => navigate(-1)} className="pointer-events-auto size-14 bg-white/95 dark:bg-background-dark/95 backdrop-blur-md rounded-2xl shadow-2xl flex items-center justify-center text-secondary dark:text-white active:scale-90 transition-all border border-gray-100">
          <span className="material-symbols-outlined text-[32px]">arrow_back</span>
        </button>
        <div className="bg-white/95 dark:bg-background-dark/95 backdrop-blur-md px-8 py-4 rounded-[28px] shadow-2xl flex items-center gap-4 border border-gray-100">
          <div className="size-3 rounded-full bg-primary animate-pulse shadow-[0_0_8px_#06DC7F]"></div>
          <span className="text-xs font-black text-secondary dark:text-white uppercase tracking-[0.2em]">Node #{order?.orderNumber || 'SYNC'}</span>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 w-full h-[40%] z-30 bg-white dark:bg-background-dark rounded-t-[64px] shadow-[0_-24px_80px_rgba(0,0,0,0.2)] flex flex-col border-t border-gray-100">
        <div className="w-16 h-1.5 bg-gray-100 dark:bg-white/5 rounded-full mx-auto mt-6"></div>

        <div className="flex-1 px-10 pt-8 flex flex-col">
          <div className="flex justify-between items-start mb-10">
            <div>
              <p className="text-[11px] font-black text-primary uppercase tracking-[0.4em] mb-2">Live Lifecycle</p>
              <h2 className="text-4xl font-black text-secondary dark:text-white uppercase tracking-tighter leading-none mb-4">
                {order?.status || 'Monitoring...'}
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-gray-400">Arriving via <span className="text-secondary dark:text-white font-black">Express Node</span></span>
              </div>
            </div>
            {order?.deliveryCode && (
              <div className="bg-primary/10 px-8 py-4 rounded-[32px] border-2 border-primary/20 text-center group">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Verification PIN</p>
                <p className="text-3xl font-black text-secondary dark:text-white tracking-[0.4em] leading-none">{order.deliveryCode}</p>
              </div>
            )}
          </div>

          <div className="bg-gray-50 dark:bg-white/5 rounded-[40px] p-6 flex items-center gap-6 mb-10 border border-gray-100">
            <img className="size-20 rounded-[30px] object-cover border-4 border-white shadow-xl" src={`https://i.pravatar.cc/150?u=${order?.riderId || 'rider'}`} alt="" />
            <div className="flex-1 min-w-0">
              <h3 className="font-black text-xl text-secondary dark:text-white leading-none uppercase truncate">{order?.riderName || 'Identifying Captain...'}</h3>
              <p className="text-[10px] text-gray-400 mt-2 uppercase tracking-widest font-bold">Verified Fleet Node</p>
            </div>
            <button onClick={handleCallRider} className="size-16 rounded-[24px] bg-white dark:bg-surface-dark shadow-2xl flex items-center justify-center text-primary border border-gray-100 active:scale-95 transition-all">
              <span className="material-symbols-outlined text-[32px]">call</span>
            </button>
          </div>

          <button onClick={() => navigate('/customer/support-chat')} className="w-full h-20 bg-secondary text-primary font-black text-base uppercase tracking-[0.4em] rounded-[32px] shadow-primary-glow flex items-center justify-center gap-4">
            <span className="material-symbols-outlined font-black">forum</span>
            Open Comms Channel
          </button>
        </div>
      </div>
    </div>
  );
};

const mapStyles = [{ elementType: "geometry", stylers: [{ color: "#242f3e" }] }, { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] }, { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#06DC7F" }] }];
export default TrackingMap;
