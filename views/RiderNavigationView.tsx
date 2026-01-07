
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { doc, updateDoc, onSnapshot, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Order } from '../types';

declare const google: any;

// Defined landmarkTacticalStyles to fix "Cannot find name" error
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

const RiderNavigationView: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const leg = searchParams.get('leg') || 'pickup';

  const [order, setOrder] = useState<Order | null>(null);
  const [lat, setLat] = useState(9.5624);
  const [lng, setLng] = useState(44.0770);
  const [mapLoaded, setMapLoaded] = useState(false);
  
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMap = useRef<any>(null);
  const riderMarker = useRef<any>(null);

  // Added effect to load map script
  useEffect(() => {
    const loadMapScript = async () => {
      const configSnap = await getDoc(doc(db, "system_config", "global"));
      const apiKey = configSnap.data()?.integrations?.maps?.apiKey;
      if (!apiKey) {
        setMapLoaded(true); // Fallback to placeholder if key missing
        return;
      }
      if ((window as any).google) { setMapLoaded(true); return; }
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry`;
      script.async = true;
      script.onload = () => setMapLoaded(true);
      document.head.appendChild(script);
    };
    loadMapScript();
  }, []);

  // Added effect to initialize map
  useEffect(() => {
    if (mapLoaded && mapRef.current && !googleMap.current) {
      googleMap.current = new google.maps.Map(mapRef.current, {
        center: { lat, lng },
        zoom: 17,
        disableDefaultUI: true,
        styles: landmarkTacticalStyles,
        mapTypeId: 'roadmap'
      });
      
      // Initialize Rider Marker
      riderMarker.current = new google.maps.Marker({
        position: { lat, lng },
        map: googleMap.current,
        icon: {
          path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: 6,
          fillColor: "#06DC7F",
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: "#ffffff",
        }
      });
    }
  }, [mapLoaded, lat, lng]);

  // Added effect to sync order data
  useEffect(() => {
    if (!id) return;
    const unsub = onSnapshot(doc(db, "orders", id), (snap) => {
      if (snap.exists()) {
        setOrder({ id: snap.id, ...snap.data() } as Order);
      }
    });
    return () => unsub();
  }, [id]);

  // Added movement simulation
  const handleSimulateMovement = () => {
    const newLat = lat + (Math.random() - 0.5) * 0.001;
    const newLng = lng + (Math.random() - 0.5) * 0.001;
    setLat(newLat);
    setLng(newLng);
    
    if (riderMarker.current) {
      riderMarker.current.setPosition({ lat: newLat, lng: newLng });
      googleMap.current.panTo({ lat: newLat, lng: newLng });
    }

    if (id) {
        updateDoc(doc(db, "orders", id), {
            currentLocation: { lat: newLat, lng: newLng }
        });
    }
  };

  return (
    <div className="relative h-screen w-full overflow-hidden flex flex-col font-display bg-background-light dark:bg-background-dark">
      <div className="absolute inset-0 z-0 h-full w-full bg-gray-200">
        {!mapLoaded && (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-surface-dark gap-4">
            <div className="size-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Activating Tactical HUD...</p>
          </div>
        )}
        <div ref={mapRef} className="w-full h-full" />
      </div>

      <div className="absolute top-0 left-0 w-full z-20 px-6 pt-12 flex justify-between items-center pointer-events-none">
        <button onClick={() => navigate(-1)} className="pointer-events-auto size-12 bg-white dark:bg-background-dark/95 backdrop-blur-md rounded-2xl shadow-2xl flex items-center justify-center text-secondary dark:text-white active:scale-90 transition-all border border-gray-100 dark:border-white/10">
          <span className="material-symbols-outlined text-[32px]">arrow_back</span>
        </button>
        <div className="bg-secondary text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10 pointer-events-auto">
          <span className="text-[10px] font-black uppercase tracking-widest text-primary">{leg === 'pickup' ? 'TO PICKUP' : 'TO DELIVERY'}</span>
          <span className="text-sm font-black tracking-tighter">ETA: 4 MINS</span>
        </div>
      </div>

      <div className="absolute bottom-8 left-6 right-6 z-30 bg-white dark:bg-surface-dark rounded-[40px] shadow-2xl border border-gray-100 dark:border-white/5 p-6 flex flex-col gap-6">
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner border border-primary/20">
                  <span className="material-symbols-outlined text-3xl font-black">near_me</span>
               </div>
               <div>
                  <h4 className="text-base font-black text-secondary dark:text-white uppercase tracking-tighter mb-1">
                    {leg === 'pickup' ? order?.vendorName : order?.shippingAddress?.split(',')[0]}
                  </h4>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    {leg === 'pickup' ? 'Merchant Terminal Node' : 'Customer Drop-off Node'}
                  </p>
               </div>
            </div>
            <button 
              onClick={handleSimulateMovement}
              className="size-12 rounded-2xl bg-gray-50 dark:bg-white/5 flex items-center justify-center text-primary shadow-sm active:scale-90"
            >
               <span className="material-symbols-outlined">sync</span>
            </button>
         </div>

         <div className="flex gap-3">
            <button className="flex-[2] h-14 bg-primary text-secondary font-black text-[11px] uppercase tracking-[0.3em] rounded-2xl shadow-lg active:scale-95 transition-all">
               Open System Maps
            </button>
            <button 
              onClick={() => navigate(leg === 'pickup' ? `/rider/pickup/${id}` : `/rider/confirm/${id}`)}
              className="flex-1 h-14 bg-secondary text-white font-black text-[11px] uppercase tracking-widest rounded-2xl shadow-lg active:scale-95 transition-all"
            >
               Arrived
            </button>
         </div>
      </div>
    </div>
  );
};

// Added missing default export
export default RiderNavigationView;
