import React, { useEffect, useRef } from 'react';
import { useAuth } from '../Providers';
import { db } from '../lib/firebase';
import { RiderService } from '../src/lib/services/riderService';

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


                    const latitude = BASE_LAT + latOffset;
                    const longitude = BASE_LNG + lngOffset;

                    // Send to Backend via API
                    await RiderService.sendHeartbeat({
                        riderId: user.uid,
                        latitude,
                        longitude,
                        status: 'ONLINE' // or profile?.status if validated
                    });

                    console.log("Tracker: Heartbeat sent.", { latitude, longitude });
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
