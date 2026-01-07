import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, limit, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile } from '../types';

const VendorTicker: React.FC = () => {
    const navigate = useNavigate();
    const [vendors, setVendors] = useState<UserProfile[]>([]);

    useEffect(() => {
        const q = query(collection(db, "users"), where("role", "==", "VENDOR"), limit(20));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                const loaded = snapshot.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile));
                // Filter out suspended vendors
                setVendors(loaded.filter(v => v.vendorStatus !== 'SUSPENDED'));
            } else {
                setVendors([]);
            }
        });

        return () => unsubscribe();
    }, []);

    if (vendors.length === 0) return null;

    return (
        <section className="py-16 border-t border-gray-100 dark:border-white/5 bg-white dark:bg-surface-dark overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 mb-10 flex justify-between items-end">
                <div>
                    <h3 className="text-2xl font-black text-secondary dark:text-white tracking-tighter uppercase leading-none">Shop By Merchant</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.4em] mt-2">Verified Ecosystem Hubs</p>
                </div>
                <button onClick={() => navigate('/customer/vendors')} className="text-primary text-[10px] font-black uppercase tracking-widest hover:underline">Full Directory</button>
            </div>

            <div className="flex relative">
                {/* Infinite Marquee Wrapper */}
                <div className="flex gap-12 animate-marquee whitespace-nowrap items-center py-4 hover:pause">
                    {[...vendors, ...vendors].map((v, i) => (
                        <button
                            key={`${v.uid}-${i}`}
                            onClick={() => navigate(`/customer/vendor/${v.uid}`)}
                            className="group flex flex-col items-center gap-3 shrink-0"
                        >
                            <div className="size-20 md:size-28 rounded-[32px] bg-gray-50 dark:bg-white/5 p-1 border-2 border-transparent group-hover:border-primary group-hover:shadow-primary-glow transition-all grayscale group-hover:grayscale-0 overflow-hidden relative">
                                <img
                                    src={v.businessLogo || v.avatar || `https://ui-avatars.com/api/?name=${v.businessName || 'V'}&background=015754&color=06DC7F`}
                                    className="w-full h-full object-cover rounded-[28px]"
                                    alt={v.businessName}
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${v.businessName || 'V'}&background=015754&color=06DC7F`;
                                    }}
                                />
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 group-hover:text-secondary dark:group-hover:text-white transition-colors truncate max-w-[100px]">{v.businessName || v.fullName}</span>
                        </button>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default VendorTicker;
