
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { doc, onSnapshot, getDoc } from 'firebase/firestore'; // Removed updateDoc
import { db } from '../lib/firebase';
import { Order } from '../types';
import { useAuth } from '../Providers';
import { api } from '../src/services/api';

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
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        setMapLoaded(true); // Fallback
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

  // Changed to getDoc to avoid Re-render/Update loop with Firestore
  useEffect(() => {
    if (!id) return;
    const fetchOrder = async () => {
      try {
        const snap = await getDoc(doc(db, "orders", id));
        if (snap.exists()) {
          setOrder({ id: snap.id, ...snap.data() } as Order);
        }
      } catch (e) {
        console.error("Order load failed", e);
      }
    };
    fetchOrder();
  }, [id]);

  // Refs for markers to prevent recreation
  const vendorMarkerRef = useRef<any>(null);
  const customerMarkerRef = useRef<any>(null);
  const lastUpdateRef = useRef<number>(0);

  const { user } = useAuth(); // Added useAuth hook

  // Sync Real Location with Throttling
  useEffect(() => {
    if (!navigator.geolocation || !user?.uid) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLat(latitude);
        setLng(longitude);

        if (riderMarker.current) {
          riderMarker.current.setPosition({ lat: latitude, lng: longitude });
          googleMap.current?.panTo({ lat: latitude, lng: longitude });
        }

        // Throttle API updates to every 10 seconds
        const now = Date.now();
        if (now - lastUpdateRef.current > 10000) {
          lastUpdateRef.current = now;
          try {
            api.post('/logistics/rider/location', {
              riderId: user.uid,
              latitude,
              longitude,
              status: 'BUSY' // Assume busy if navigating
            }).catch(e => console.error("Loc update failed", e));
          } catch (err) {
            console.error("Loc update error", err);
          }
        }
      },
      (err) => console.error("GPS Error", err),
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [id, user?.uid]);
  // ... rest of file

  // Handle Markers (Vendor/Customer) - Optimized
  useEffect(() => {
    if (!mapLoaded || !googleMap.current || !order) return;

    // Vendor Marker
    const vendorLoc = order.vendorLocation || { lat: 9.5620, lng: 44.0775 };
    if (!vendorMarkerRef.current) {
      vendorMarkerRef.current = new google.maps.Marker({
        position: vendorLoc,
        map: googleMap.current,
        icon: {
          url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
          scaledSize: new google.maps.Size(40, 40)
        },
        title: order.vendorName
      });
    } else {
      vendorMarkerRef.current.setPosition(vendorLoc);
    }

    // Customer Marker
    if (leg === 'delivery') {
      const customerLoc = { lat: 9.5630, lng: 44.0790 };
      if (!customerMarkerRef.current) {
        customerMarkerRef.current = new google.maps.Marker({
          position: customerLoc,
          map: googleMap.current,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: "#E93A3A",
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: "#FFF"
          }
        });
      } else {
        customerMarkerRef.current.setPosition(customerLoc);
      }
    }
  }, [mapLoaded, order, leg]);

  const [directions, setDirections] = useState<any>(null);

  // Calculate Route
  useEffect(() => {
    if (!mapLoaded || !googleMap.current || !order || !lat || !lng) return;

    const directionsService = new google.maps.DirectionsService();
    // Destination: Vendor Loc if pickup, Customer Address if delivery (geocoding needed in real app, using mock/latlng if avail)
    // For now assuming order has lat/lng or we rely on text search (less reliable but works for mock)

    const dest = leg === 'pickup'
      ? (order.vendorLocation || { lat: 9.5620, lng: 44.0775 })
      : (order.currentLocation || { lat: 9.5630, lng: 44.0790 }); // Fallback to avoid crash

    // In production, use Place ID or exact coords
    directionsService.route({
      origin: { lat, lng },
      destination: dest,
      travelMode: google.maps.TravelMode.DRIVING
    }, (result: any, status: any) => {
      if (status === google.maps.DirectionsStatus.OK) {
        setDirections(result);

        // Render Route
        const directionsRenderer = new google.maps.DirectionsRenderer({
          map: googleMap.current,
          directions: result,
          suppressMarkers: true, // We have our own custom markers
          polylineOptions: {
            strokeColor: "#06DC7F",
            strokeWeight: 5,
            strokeOpacity: 0.8
          }
        });
      }
    });

  }, [mapLoaded, order, leg, lat, lng]); // Re-calc on significant location change? Maybe throttle this in real app.

  // NOTE: "Open System Maps" is now removed in favor of in-app view.
  // We keep the button but it just re-centers or provides info.
  const handleRecenter = () => {
    if (googleMap.current) {
      googleMap.current.panTo({ lat, lng });
      googleMap.current.setZoom(17);
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
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleRecenter}
            className="flex-[2] h-14 bg-primary text-secondary font-black text-[11px] uppercase tracking-[0.3em] rounded-2xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">navigation</span>
            Recenter
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
