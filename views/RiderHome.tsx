import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Providers';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Order } from '../types';

const RiderHome: React.FC = () => {
    const { user, profile } = useAuth();
    const navigate = useNavigate();
    const [activeOrder, setActiveOrder] = useState<Order | null>(null);
    const [recentOrders, setRecentOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        // 1. Listen for ACTIVE Assignment
        const activeQuery = query(
            collection(db, 'orders'),
            where('riderId', '==', user.uid),
            where('status', 'in', ['ACCEPTED', 'PICKED_UP', 'IN_TRANSIT'])
        );

        const unsubActive = onSnapshot(activeQuery, (snap) => {
            if (!snap.empty) {
                setActiveOrder({ id: snap.docs[0].id, ...snap.docs[0].data() } as Order);
            } else {
                setActiveOrder(null);
            }
        }, (err) => {
            console.error("Active Query Error", err);
            // Don't block loading here, rely on history or timeout, or set false
            // But we usually want to wait for both.
            // Let's rely on the history query to finish loading, as it's the 2nd one.
        });

        // 2. Listen for Recent History - Client Side Sort to avoid Index Block
        const historyQuery = query(
            collection(db, 'orders'),
            where('riderId', '==', user.uid),
            where('status', '==', 'DELIVERED')
        );

        const unsubHistory = onSnapshot(historyQuery, (snap) => {
            const sorted = snap.docs
                .map(d => ({ id: d.id, ...d.data() } as Order))
                .sort((a, b) => {
                    // Sort descending by updatedAt
                    const dateA = a.updatedAt?.seconds || 0;
                    const dateB = b.updatedAt?.seconds || 0;
                    return dateB - dateA;
                })
                .slice(0, 5); // Limit to 5

            setRecentOrders(sorted);
            setLoading(false);
        }, (err) => {
            console.error("History Query Error", err);
            setLoading(false); // Force load stop on error
        });

        return () => {
            unsubActive();
            unsubHistory();
        };
    }, [user]);

    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-black/90">
            <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#121212] pb-24 font-display text-gray-900 dark:text-gray-100">
            {/* Simple Header */}
            <div className="px-6 pt-12 pb-6 flex justify-between items-center bg-white dark:bg-[#1E1E1E] rounded-b-[32px] shadow-sm">
                <div>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Welcome back,</p>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white">{profile?.fullName || 'Rider'}</h1>
                </div>
                <div className="relative">
                    <span className="absolute top-0 right-0 size-2.5 bg-red-500 rounded-full border-2 border-white dark:border-[#1E1E1E]"></span>
                    <button className="size-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center hover:bg-gray-200 transition-colors">
                        <span className="material-symbols-outlined text-gray-600 dark:text-gray-300">notifications</span>
                    </button>
                </div>
            </div>

            <div className="p-6 flex flex-col gap-8">
                {/* Find Shipments Button (if no active order) */}
                {!activeOrder && (
                    <div
                        onClick={() => navigate('/rider/assignments')}
                        className="bg-primary text-secondary p-6 rounded-[32px] shadow-lg shadow-primary/20 flex items-center justify-between cursor-pointer active:scale-95 transition-transform"
                    >
                        <div>
                            <h3 className="text-lg font-black uppercase">Find New Delivery</h3>
                            <p className="text-xs font-medium opacity-80">Browse available jobs nearby</p>
                        </div>
                        <div className="size-12 bg-white/20 rounded-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-2xl">search</span>
                        </div>
                    </div>
                )}

                {/* Current Shipment Card */}
                {activeOrder && (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg">Current Shipment</h3>
                            <button onClick={() => navigate(`/rider/navigate/${activeOrder.id}`)} className="text-xs font-bold text-primary">See Details</button>
                        </div>

                        <div
                            onClick={() => navigate(`/rider/navigate/${activeOrder.id}`)}
                            className="bg-white dark:bg-[#1E1E1E] p-6 rounded-[32px] shadow-sm border border-gray-100 dark:border-white/5 relative overflow-hidden group"
                        >
                            {/* Status Badge */}
                            <div className="absolute top-6 right-6 px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                {activeOrder.status.replace('_', ' ')}
                            </div>

                            <div className="flex items-center gap-4 mb-6">
                                <div className="size-14 bg-gray-100 dark:bg-white/5 rounded-2xl flex items-center justify-center">
                                    <span className="material-symbols-outlined text-2xl text-gray-500">inventory_2</span>
                                </div>
                                <div>
                                    <p className="text-[10px] bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 rounded text-gray-500 uppercase tracking-wider w-fit mb-1">ID: {activeOrder.orderNumber}</p>
                                    <h3 className="font-black text-lg leading-none">{activeOrder.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Prepaid Order'}</h3>
                                </div>
                            </div>

                            {/* Progress Steps (Simplified) */}
                            <div className="flex items-center gap-2 mb-6 opacity-80">
                                <div className={`h-1.5 flex-1 rounded-full ${['ACCEPTED', 'PICKED_UP', 'IN_TRANSIT'].includes(activeOrder.status) ? 'bg-primary' : 'bg-gray-200 dark:bg-white/10'}`}></div>
                                <div className={`h-1.5 flex-1 rounded-full ${['PICKED_UP', 'IN_TRANSIT'].includes(activeOrder.status) ? 'bg-primary' : 'bg-gray-200 dark:bg-white/10'}`}></div>
                                <div className={`h-1.5 flex-1 rounded-full ${['IN_TRANSIT'].includes(activeOrder.status) ? 'bg-orange-400' : 'bg-gray-200 dark:bg-white/10'}`}></div>
                                <div className="px-2 text-[10px] font-bold text-gray-400">4h Away</div>
                            </div>

                            {/* Route Info */}
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1.5">Pickup</p>
                                    <p className="font-bold text-sm">{activeOrder.vendorName}</p>
                                </div>
                                <div className="h-[1px] flex-1 bg-gray-200 mx-4 mb-2 border-t border-dashed border-gray-300"></div>
                                <div className="text-right">
                                    <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1.5">Dropoff</p>
                                    <p className="font-bold text-sm">{activeOrder.shippingAddress?.split(',')[0]}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Recent Shipments */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg">Recent History</h3>
                        <button className="text-xs font-bold text-gray-400">See All</button>
                    </div>

                    <div className="flex flex-col gap-4">
                        {recentOrders.length === 0 ? (
                            <p className="text-center text-gray-400 text-sm py-8">No recent history</p>
                        ) : (
                            recentOrders.map(order => (
                                <div key={order.id} className="bg-white dark:bg-[#1E1E1E] p-4 rounded-[24px] flex items-center justify-between shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="size-12 bg-gray-50 dark:bg-white/5 rounded-xl flex items-center justify-center">
                                            <span className="material-symbols-outlined text-gray-400">package_2</span>
                                        </div>
                                        <div>
                                            <p className="text-xs font-black uppercase mb-0.5">#{order.orderNumber}</p>
                                            <p className="text-[10px] text-gray-400">{order.shippingAddress?.split(',')[0]} • ${order.total.toFixed(2)}</p>
                                        </div>
                                    </div>
                                    <div className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-[9px] font-black uppercase">Delivered</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Custom Bottom Nav for Rider */}
            <div className="fixed bottom-0 left-0 right-0 bg-[#1A1A1A] text-white pt-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))] px-6 shadow-[0_-4px_24px_rgba(0,0,0,0.3)] flex items-center justify-around z-50 rounded-t-[24px]">
                <button className="flex flex-col items-center gap-1 p-2 bg-white/10 rounded-2xl w-14 h-14 justify-center">
                    <span className="material-symbols-outlined text-xl">home</span>
                    <span className="text-[8px] font-bold uppercase">Home</span>
                </button>
                <button className="flex flex-col items-center gap-1 p-2 opacity-50 w-14 h-14 justify-center" onClick={() => navigate('/rider/assignments')}>
                    <span className="material-symbols-outlined text-xl">local_shipping</span>
                    <span className="text-[8px] font-bold uppercase">Jobs</span>
                </button>
                <button className="bg-primary text-secondary size-14 rounded-full flex items-center justify-center shadow-lg -mt-10 border-[6px] border-[#121212] dark:border-[#121212]" onClick={() => navigate('/rider/scan')}>
                    <span className="material-symbols-outlined text-2xl font-black">qr_code_scanner</span>
                </button>
                <button className="flex flex-col items-center gap-1 p-2 opacity-50 w-14 h-14 justify-center" onClick={() => navigate('/rider/status')}>
                    <span className="material-symbols-outlined text-xl">map</span>
                    <span className="text-[8px] font-bold uppercase">Track</span>
                </button>
                <button className="flex flex-col items-center gap-1 p-2 opacity-50 w-14 h-14 justify-center" onClick={() => navigate('/rider/settings')}>
                    <span className="material-symbols-outlined text-xl">person</span>
                    <span className="text-[8px] font-bold uppercase">Profile</span>
                </button>
            </div>
        </div>
    );
};

export default RiderHome;
