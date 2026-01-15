
import React, { useEffect, useRef, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface Props {
    riders: any[];
    orders: any[];
    onMarkerClick?: (type: 'RIDER' | 'ORDER', id: string) => void;
    selectedId?: string | null;
}

declare const google: any;

const DispatchMap: React.FC<Props> = ({ riders, orders, onMarkerClick, selectedId }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const googleMap = useRef<any>(null);
    const markers = useRef<{ [key: string]: any }>({});
    const [mapLoaded, setMapLoaded] = useState(false);

    // 1. Load Script (Ideally genericize this hook)
    useEffect(() => {
        const loadScript = async () => {
            if ((window as any).google && (window as any).google.maps) {
                setMapLoaded(true);
                return;
            }

            try {
                const configSnap = await getDoc(doc(db, "system_config", "global"));
                const apiKey = configSnap.data()?.integrations?.maps?.apiKey;

                if (!apiKey) {
                    console.warn("No Map Key");
                    setMapLoaded(true); // Fallback
                    return;
                }

                const existing = document.querySelector(`script[src^="https://maps.googleapis.com/maps/api/js?key=${apiKey}"]`);
                if (existing) {
                    setMapLoaded(true);
                    return;
                }

                const script = document.createElement('script');
                script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry`;
                script.async = true;
                script.onload = () => setMapLoaded(true);
                document.head.appendChild(script);

            } catch (e) {
                console.error("Map Load Error", e);
                setMapLoaded(true);
            }
        };
        loadScript();
    }, []);

    // 2. Initialize Map
    useEffect(() => {
        if (mapLoaded && mapRef.current && !googleMap.current) {
            if ((window as any).google) {
                googleMap.current = new google.maps.Map(mapRef.current, {
                    center: { lat: -1.2921, lng: 36.8219 }, // Nairobi Default
                    zoom: 12,
                    disableDefaultUI: false,
                    styles: [{ elementType: "geometry", stylers: [{ color: "#242f3e" }] }, { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] }]
                });
            }
        }
    }, [mapLoaded]);

    // 3. Render Markers
    useEffect(() => {
        if (!googleMap.current || !mapLoaded) return;

        // Clear removed markers
        // (Simplified: In production, diff keys. For prototype: Keep simple)

        // Render Riders
        riders.forEach(r => {
            if (!r.currLocation) return;
            const pos = { lat: r.currLocation._lat || r.currLocation.latitude, lng: r.currLocation._long || r.currLocation.longitude };

            if (!markers.current[r.id]) {
                markers.current[r.id] = new google.maps.Marker({
                    position: pos,
                    map: googleMap.current,
                    icon: {
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 8,
                        fillColor: "#06DC7F",
                        fillOpacity: 1,
                        strokeWeight: 2,
                        strokeColor: "#FFFFFF",
                    },
                    title: r.name || 'Rider'
                });
                markers.current[r.id].addListener('click', () => onMarkerClick && onMarkerClick('RIDER', r.id));
            } else {
                markers.current[r.id].setPosition(pos);
            }
        });

        // Render Orders
        orders.forEach(o => {
            // Assuming order has a location (e.g. shippingAddress geocoded or vendor location)
            // For prototype, let's use vendor location or mock if missing.
            // Using a mock default offset for now if real geocoding missing.
            const lat = o.vendorLocation?.latitude || -1.2921 + (Math.random() * 0.01);
            const lng = o.vendorLocation?.longitude || 36.8219 + (Math.random() * 0.01);
            const pos = { lat, lng };

            if (!markers.current[o.id]) {
                markers.current[o.id] = new google.maps.Marker({
                    position: pos,
                    map: googleMap.current,
                    icon: {
                        path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
                        scale: 6,
                        fillColor: "#FF4500",
                        fillOpacity: 1,
                        strokeWeight: 2,
                        strokeColor: "#FFFFFF",
                    },
                    title: `Order #${o.orderNumber}`
                });
                markers.current[o.id].addListener('click', () => onMarkerClick && onMarkerClick('ORDER', o.id));
            }
        });

    }, [riders, orders, mapLoaded]);

    return <div ref={mapRef} className="w-full h-full bg-gray-900" />;
}

export default DispatchMap;
