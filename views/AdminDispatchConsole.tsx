
import React, { useEffect, useState } from 'react';
import { api } from '../src/lib/api';
import DispatchMap from '../components/DispatchMap';
import { toast } from 'sonner';

const AdminDispatchConsole: React.FC = () => {
    const [orders, setOrders] = useState<any[]>([]);
    const [riders, setRiders] = useState<any[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // 1. Fetch Data
    const convertGeoPoint = (obj: any) => {
        // Helper to normalize Firestore GeoPoint vs API JSON
        if (obj && obj._lat && obj._long) return { latitude: obj._lat, longitude: obj._long };
        return obj;
    };

    const fetchData = async () => {
        try {
            // Fetch Unassigned Orders (Status filtering now supported)
            const ordersRes = await api.get('/orders?status=READY_FOR_PICKUP&riderId=null');
            setOrders(ordersRes.data || []);

            // Fetch Nearby Riders (Mock lat/lng for now, or center of city)
            const ridersRes = await api.get('/logistics/riders/nearby?lat=-1.2921&lng=36.8219&radius=10');
            // Normalize rider location
            const normalizedRiders = (ridersRes.data || []).map((r: any) => ({
                ...r,
                currLocation: convertGeoPoint(r.currLocation)
            }));
            setRiders(normalizedRiders);

        } catch (error) {
            console.error("Dispatch Load Error", error);
            toast.error("Failed to load dispatch data.");
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    // 2. Dispatch Action
    const handleAssign = async (riderId: string) => {
        if (!selectedOrder) return;
        setLoading(true);
        try {
            await api.post('/logistics/jobs/assign', { orderId: selectedOrder, riderId });
            toast.success("Order Dispatched!");
            setOrders(prev => prev.filter(o => o.id !== selectedOrder));
            setSelectedOrder(null);
            fetchData(); // Refresh to update rider status
        } catch (error) {
            toast.error("Dispatch Failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen w-full bg-gray-900 text-white">
            {/* Sidebar: Unassigned Orders */}
            <div className="w-96 flex flex-col border-r border-gray-800 bg-gray-900 z-10">
                <div className="p-6 border-b border-gray-800">
                    <h1 className="text-xl font-bold uppercase tracking-widest text-primary">Dispatch Console</h1>
                    <p className="text-xs text-gray-400 mt-1">{orders.length} Pending Orders</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {orders.length === 0 && (
                        <div className="text-center py-10 text-gray-500 text-sm">No Pending Orders</div>
                    )}
                    {orders.map(order => (
                        <div
                            key={order.id}
                            onClick={() => setSelectedOrder(order.id)}
                            className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedOrder === order.id ? 'bg-primary/10 border-primary' : 'bg-gray-800 border-gray-700 hover:border-gray-500'}`}
                        >
                            <div className="flex justify-between mb-2">
                                <span className="font-bold text-sm">#{order.orderNumber}</span>
                                <span className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300">${order.total}</span>
                            </div>
                            <p className="text-xs text-gray-400 truncate">{order.recipientAddress || 'No Address'}</p>
                            <div className="mt-3 flex gap-2">
                                <span className="text-[10px] uppercase font-bold text-blue-400 bg-blue-400/10 px-2 py-1 rounded">
                                    {order.paymentMethod}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main: Map */}
            <div className="flex-1 relative">
                <DispatchMap
                    riders={riders}
                    orders={orders}
                    selectedId={selectedOrder}
                    onMarkerClick={(type, id) => {
                        if (type === 'ORDER') setSelectedOrder(id);
                    }}
                />

                {/* Overlay: Rider Selection (When Order Selected) */}
                {selectedOrder && (
                    <div className="absolute bottom-8 left-8 right-8 bg-gray-900/90 backdrop-blur-md p-6 rounded-2xl border border-gray-700 shadow-2xl flex flex-col animate-in slide-in-from-bottom-10">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg">Select Rider for Order</h3>
                            <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-white">Close</button>
                        </div>
                        <div className="flex gap-4 overflow-x-auto pb-2">
                            {riders.map(rider => (
                                <div key={rider.id} className="min-w-[200px] p-4 bg-black/50 rounded-xl border border-gray-700 hover:border-primary cursor-pointer group" onClick={() => handleAssign(rider.id)}>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-bold text-sm">{rider.name || 'Rider'}</span>
                                        <span className={`size-2 rounded-full ${rider.status === 'ONLINE' ? 'bg-green-500' : 'bg-orange-500'}`}></span>
                                    </div>
                                    <p className="text-xs text-gray-400">{rider.distance ? `${rider.distance.toFixed(1)} km away` : 'Nearby'}</p>
                                    <button className="mt-3 w-full py-2 bg-primary text-black font-bold text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                        DISPATCH
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDispatchConsole;
