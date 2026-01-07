import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

export type Platform = 'web' | 'android' | 'ios';

export const usePlatform = () => {
    const [platform, setPlatform] = useState<Platform>('web');
    const [isNative, setIsNative] = useState(false);

    useEffect(() => {
        const p = Capacitor.getPlatform() as Platform;
        setPlatform(p);
        setIsNative(p === 'android' || p === 'ios');

        // Add platform class to body for global CSS targeting
        document.body.setAttribute('data-platform', p);
        if (p === 'android' || p === 'ios') {
            document.body.classList.add('native-app');
        } else {
            document.body.classList.remove('native-app');
        }

    }, []);

    return { platform, isNative };
};
