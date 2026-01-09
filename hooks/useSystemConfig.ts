import { useState, useEffect } from 'react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface BusinessConfig {
    title: string;
    phone: string;
    email: string;
    address: string;
    socialFacebook: string;
    socialInstagram: string;
    socialTwitter: string;
    socialYoutube: string;
    brandLogoLight: string;
    brandLogoDark: string;
    brandIcon: string;
    footerText: string;
}

export interface SystemConfig {
    business: BusinessConfig;
    settings: any;
    integrations: any;
}

export const useSystemConfig = () => {
    const [config, setConfig] = useState<SystemConfig | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = onSnapshot(doc(db, "system_config", "global"), (doc) => {
            if (doc.exists()) {
                setConfig(doc.data() as SystemConfig);
            }
            setLoading(false);
        });

        return () => unsub();
    }, []);

    return { config, loading };
};
