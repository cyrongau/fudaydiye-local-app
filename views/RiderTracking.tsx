import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Order } from '../types';
import { useAuth } from '../Providers';

declare const google: any;

const RiderTracking: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [slideProgress, setSlideProgress] = useState(0);
    const slideRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<HTMLDivElement>(null);
    const googleMap = useRef<any>(null);

    // Load Order
    useEffect(() => {
        if (!id) return;
        const loadOrder = async () => {
            const snap = await getDoc(doc(db, 'orders', id));
            if (snap.exists()) {
                setOrder({ id: snap.id, ...snap.data() } as Order);
            }
            setLoading(false);
        };
        loadOrder();
    }, [id]);

    // Google Maps Init (Simulated for this context as I can't load script dynamically easily without duplicates, assuming script is in index.html or previously loaded)
    useEffect(() => {
        // Wait for Google Maps to be available (loaded by previous views or index.html)
        const checkGoogle = setInterval(() => {
            if ((window as any).google && mapRef.current && !googleMap.current) {
                clearInterval(checkGoogle);
                const styledMapType = new google.maps.StyledMapType(
                    [
                        { "elementType": "geometry", "stylers": [{ "color": "#f5f5f5" }] },
                        { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
                        { "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }] },
                        { "elementType": "labels.text.stroke", "stylers": [{ "color": "#f5f5f5" }] },
                        { "featureType": "administrative.land_parcel", "elementType": "labels.text.fill", "stylers": [{ "color": "#bdbdbd" }] },
                        { "featureType": "poi", "elementType": "geometry", "stylers": [{ "color": "#eeeeee" }] },
                        { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
                        { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#ffffff" }] },
                        { "featureType": "road.arterial", "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
                        { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#dadada" }] },
                        { "featureType": "road.highway", "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }] },
                        { "featureType": "road.local", "elementType": "labels.text.fill", "stylers": [{ "color": "#9e9e9e" }] },
                        { "featureType": "transit.line", "elementType": "geometry", "stylers": [{ "color": "#e5e5e5" }] },
                        { "featureType": "transit.station", "elementType": "geometry", "stylers": [{ "color": "#eeeeee" }] },
                        { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#c9c9c9" }] },
                        { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#9e9e9e" }] }
                    ],
                    { name: "Styled Map" });

                googleMap.current = new google.maps.Map(mapRef.current, {
                    center: { lat: 9.5624, lng: 44.0770 }, // Default Hargeisa
                    zoom: 15,
                    disableDefaultUI: true,
                    mapTypeControlOptions: {
                        mapTypeIds: ['styled_map']
                    }
                });
                googleMap.current.mapTypes.set('styled_map', styledMapType);
                googleMap.current.setMapTypeId('styled_map');

                // Add Marker (Simulated Rider)
                new google.maps.Marker({
                    position: { lat: 9.5624, lng: 44.0770 },
                    map: googleMap.current,
                    icon: {
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 8,
                        fillColor: "#06DC7F",
                        fillOpacity: 1,
                        strokeWeight: 4,
                        strokeColor: "#ffffff",
                    }
                });
            }
        }, 500);
        return () => clearInterval(checkGoogle);
    }, []);

    const handleInteractionStart = (e: React.MouseEvent | React.TouchEvent) => {
        const startX = 'touches' in e ? e.touches[0].clientX : e.clientX;

        const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
            const currentX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
            const diff = currentX - startX;
            const maxSlide = (slideRef.current?.offsetWidth || 300) - 60; // Button width roughly

            const progress = Math.min(Math.max(diff, 0), maxSlide);
            setSlideProgress(progress);

            if (progress >= maxSlide - 10) {
                // Trigger Action
                finishAction();
                document.removeEventListener('mousemove', handleMove);
                document.removeEventListener('touchmove', handleMove);
            }
        };

        const handleUp = () => {
            if (slideProgress < ((slideRef.current?.offsetWidth || 300) - 60)) {
                setSlideProgress(0); // Snap back
            }
            document.removeEventListener('mousemove', handleMove);
            document.removeEventListener('touchmove', handleMove);
            document.removeEventListener('mouseup', handleUp);
            document.removeEventListener('touchend', handleUp);
        };

        document.addEventListener('mousemove', handleMove);
        document.addEventListener('touchmove', handleMove);
        document.addEventListener('mouseup', handleUp);
        document.addEventListener('touchend', handleUp);
    };

    const finishAction = async () => {
        if (!order || !id) return;

        let nextStatus = '';
        if (order.status === 'ACCEPTED') nextStatus = 'PICKED_UP';
        else if (order.status === 'PICKED_UP' || order.status === 'IN_TRANSIT') nextStatus = 'DELIVERED';

        if (nextStatus) {
            try {
                await updateDoc(doc(db, 'orders', id), {
                    status: nextStatus,
                    updatedAt: serverTimestamp()
                });

                if (nextStatus === 'DELIVERED') {
                    navigate('/rider'); // Go home on finish
                } else {
                    setSlideProgress(0); // Reset for next stage
                }
            } catch (e) { console.error(e); }
        }
    };

    if (loading || !order) return <div className="h-screen bg-gray-100 flex items-center justify-center">Loading...</div>;

    const isPickup = order.status === 'ACCEPTED';
    const actionText = isPickup ? 'Slide to Pickup' : 'Slide to Complete';

    return (
        <div className="h-screen w-full relative bg-gray-200 overflow-hidden font-sans">
            {/* Map Layer */}
            <div ref={mapRef} className="absolute inset-0 z-0" />

            {/* Top Header */}
            <div className="absolute top-0 left-0 right-0 p-6 pt-12 z-10 flex justify-between items-start pointer-events-none">
                <button onClick={() => navigate('/rider')} className="pointer-events-auto size-12 bg-white rounded-full shadow-lg flex items-center justify-center">
                    <span className="material-symbols-outlined text-gray-800">arrow_back</span>
                </button>
                <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-2xl shadow-sm text-center">
                    <span className="block text-[10px] font-bold uppercase text-gray-400">Time Remaining</span>
                    <span className="text-xl font-black text-gray-900">14 min</span>
                </div>
            </div>

            {/* Bottom Action Sheet */}
            <div className="absolute bottom-6 left-6 right-6 z-20">
                {/* Order Context Card */}
                <div className="bg-black text-white p-6 rounded-[32px] shadow-2xl mb-4">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Order #{order.orderNumber}</p>
                            <h2 className="text-2xl font-bold leading-none mb-1">{isPickup ? order.vendorName : 'Customer Dropoff'}</h2>
                            <p className="text-sm text-gray-400 truncate max-w-[200px]">{isPickup ? 'Pick up order from vendor' : order.shippingAddress}</p>
                        </div>
                        <span className="bg-gray-800 px-3 py-1 rounded-full text-[10px] font-black uppercase text-secondary border border-gray-700">
                            {order.status.replace('_', ' ')}
                        </span>
                    </div>

                    {/* Customer/Vendor Row */}
                    <div className="flex items-center gap-4 border-t border-white/10 pt-4">
                        <div className="size-10 rounded-full bg-gray-800 flex items-center justify-center">
                            <span className="material-symbols-outlined text-sm">person</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-bold">{order.customerName || 'Guest User'}</p>
                            <p className="text-[10px] text-gray-500">Customer</p>
                        </div>
                        <button className="size-10 rounded-full bg-[#E93A3A] flex items-center justify-center text-white">
                            <span className="material-symbols-outlined text-sm">call</span>
                        </button>
                        <button className="size-10 rounded-full bg-gray-800 flex items-center justify-center text-white">
                            <span className="material-symbols-outlined text-sm">chat_bubble</span>
                        </button>
                    </div>
                </div>

                {/* Slide Action Button */}
                <div
                    ref={slideRef}
                    className="h-16 bg-white rounded-full relative shadow-lg overflow-hidden flex items-center justify-center"
                    onTouchStart={handleInteractionStart}
                    onMouseDown={handleInteractionStart}
                >
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 animate-pulse">{actionText}</span>
                        <span className="material-symbols-outlined text-gray-300 ml-2 animate-bounce-x">keyboard_double_arrow_right</span>
                    </div>

                    {/* Slider Handle */}
                    <div
                        className="absolute left-1 top-1 bottom-1 w-14 bg-[#06DC7F] rounded-full flex items-center justify-center shadow-md cursor-grab active:cursor-grabbing transition-transform duration-75"
                        style={{ transform: `translateX(${slideProgress}px)` }}
                    >
                        <span className="material-symbols-outlined text-white font-bold">arrow_forward</span>
                    </div>

                    {/* Success Fill */}
                    <div
                        className="absolute left-0 top-0 bottom-0 bg-[#06DC7F]/20 transition-all duration-75 pointer-events-none"
                        style={{ width: `${slideProgress + 60}px` }}
                    ></div>
                </div>
            </div>
        </div>
    );
};

export default RiderTracking;
