import React, { useEffect, useRef } from 'react';
import { useAuth } from '../Providers';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

const LocationTracker: React.FC = () => {
    const { user, role, profile } = useAuth();
    const intervalRef = useRef<any>(null);

    // Hargeisa Base Coordinates
    const BASE_LAT = 9.562385;
    const BASE_LNG = 44.062446;

    useEffect(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);

        if (user && role === 'RIDER' && profile?.status === 'ONLINE') {
            // Start simulated tracking
            intervalRef.current = setInterval(async () => {
                try {
                    // Simulate small movement (random walk)
                    // In production, this would use navigator.geolocation.watchPosition
                    const latOffset = (Math.random() - 0.5) * 0.01; // ~1km range variation
                    const lngOffset = (Math.random() - 0.5) * 0.01;

                    const newGeo = {
                        lat: BASE_LAT + latOffset,
                        lng: BASE_LNG + lngOffset,
                        lastUpdate: new Date().toISOString()
                    };

                    await updateDoc(doc(db, "users", user.uid), {
                        currentGeo: newGeo,
                        lastHeartbeat: serverTimestamp()
                    });

                    console.log("Tracker: Location sync sent.", newGeo);
                } catch (err) {
                    console.error("Tracker: Sync failed.", err);
                }
            }, 30000); // 30 seconds
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [user, role, profile?.status]);

    return null; // Headless component
};

export default LocationTracker;
