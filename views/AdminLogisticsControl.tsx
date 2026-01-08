
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

const AdminLogisticsControl: React.FC = () => {
  const navigate = useNavigate();
  const [activeHub, setActiveHub] = useState('HARGEISA');

  const [orders, setOrders] = useState<any[]>([]);
  const [riders, setRiders] = useState<any[]>([]);

  useEffect(() => {
    const fetchLogisticsData = async () => {
      try {
        // 1. Fetch Active Shipments
        const qOrders = query(collection(db, "orders"), where("status", "in", ["ACCEPTED", "SHIPPED"]));
        const snapOrders = await getDocs(qOrders);
        const orderList = snapOrders.docs.map(d => ({ id: d.id, ...d.data() }));

        // Populate if empty (Mock Fallback)
        if (orderList.length > 0) {
          setOrders(orderList);
        } else {
          setOrders([]);
        }

        // 2. Fetch Riders
        const qRiders = query(collection(db, "users"), where("role", "==", "RIDER"));
        const snapRiders = await getDocs(qRiders);
        const riderList = snapRiders.docs.map(d => ({ id: d.id, ...d.data() }));

        if (riderList.length > 0) {
          setRiders(riderList);
        } else {
          setRiders([]);
        }

      } catch (e) {
        console.error("Logistics data fetch error:", e);
        setOrders([]);
        setRiders([]);
      }
    };

    fetchLogisticsData();
  }, []);

  // Compute Hub Stats dynamically (Safeguarded)
  const hubs = [
    { id: 'HARGEISA', name: 'Hargeisa Central', capacity: '2k' },
    { id: 'BERBERA', name: 'Berbera Port', capacity: '1.2k' },
    { id: 'BURCO', name: 'Burco Express', capacity: '1.5k' },
  ].map(hub => {
    // Safety check: ensure arrays exist and items have properties
    const hubOrders = Array.isArray(orders) ? orders.filter(o => o && (o.vendorHub === hub.id || (!o.vendorHub && hub.id === 'HARGEISA'))) : [];
    const hubRiders = Array.isArray(riders) ? riders.filter(r => r && (r.location === hub.id || (!r.location && hub.id === 'HARGEISA'))) : [];

    return {
      ...hub,
      load: Math.min(100, Math.round((hubOrders.length / 20) * 100)),
      riders: hubRiders.length,
      activeCount: hubOrders.length
    };
  });

  // Safety check for shipments mapping
  const activeShipments = Array.isArray(orders) ? orders.map(o => {
    if (!o) return null;
    return {
      id: o.orderNumber || o.id || 'Pending',
      from: o.vendorName || 'Unknown Vendor',
      to: typeof o.shippingAddress === 'string' ? o.shippingAddress.split(',')[0] : 'Customer',
      status: o.status === 'ACCEPTED' ? 'PICKING_UP' : 'IN_TRANSIT',
      eta: o.estimatedArrival || 'Calculating...',
      type: o.isAtomic ? 'BAJAJ' : 'CAR',
      riderId: o.riderId
    };
  }).filter(Boolean) as any[] : [];

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-300">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/5 active:scale-90 transition-all">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="flex flex-col">
          <h1 className="text-xl font-black text-secondary dark:text-primary tracking-tighter leading-none">Command Center</h1>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">Global Logistics</p>
        </div>
      </header>

      <main className="p-6 flex-1 flex flex-col gap-8 overflow-y-auto pb-10 no-scrollbar">
        {/* Network Visualization Overlay Style */}
        <section className="bg-secondary text-white rounded-[32px] p-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-[11px] font-black text-primary uppercase tracking-[0.2em]">Network Utilization</h3>
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest leading-none">All Systems Optimal</span>
              </div>
            </div>

            <div className="flex items-end justify-between gap-2 h-24 mb-6">
              {/* Dynamic Visualization based on order volume - scaling to 10 bars */}
              {Array.from({ length: 10 }).map((_, i) => {
                // Simple visualization logic: if we have orders, distribute them pseudorandomly for 'activity' feel, else 0
                const totalActive = orders.length;
                const height = totalActive > 0 ? Math.min(100, (totalActive * 5) + (Math.random() * 20)) : 5;

                return (
                  <div key={i} className="flex-1 bg-white/5 rounded-t-sm relative group/bar h-full">
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-primary/40 rounded-t-sm transition-all duration-1000"
                      style={{ height: `${height}%` }}
                    ></div>
                  </div>
                )
              })}
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="flex flex-col">
                <span className="text-3xl font-black tracking-tighter">{orders.length}</span>
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">Total Hub Deliveries</span>
              </div>
              <div className="flex flex-col">
                <span className="text-3xl font-black tracking-tighter">{orders.length > 0 ? (orders.length * 0.4).toFixed(1) : '0.0'}<span className="text-lg text-primary">m/pkg</span></span>
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">Processing Rate</span>
              </div>
            </div>
          </div>
        </section>

        {/* Hub Performance Overview */}
        <section>
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Regional Hubs</h3>
            <button className="text-primary text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
              Add Hub <span className="material-symbols-outlined text-[14px]">add_circle</span>
            </button>
          </div>
          <div className="flex flex-col gap-4">
            {hubs.map((hub) => (
              <div
                key={hub.id}
                onClick={() => setActiveHub(hub.id)}
                className={`p-5 rounded-[28px] border transition-all cursor-pointer group ${activeHub === hub.id
                  ? 'bg-white dark:bg-surface-dark border-primary shadow-soft'
                  : 'bg-white dark:bg-surface-dark border-gray-100 dark:border-gray-800 opacity-60'
                  }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`size-10 rounded-xl flex items-center justify-center ${activeHub === hub.id ? 'bg-primary text-secondary' : 'bg-gray-100 text-gray-400 dark:bg-white/5'}`}>
                      <span className="material-symbols-outlined">{activeHub === hub.id ? 'hub' : 'sensors'}</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-secondary dark:text-white leading-none mb-1">{hub.name}</h4>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{hub.capacity} Threshold</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-lg font-black ${hub.load > 80 ? 'text-red-500' : 'text-primary'}`}>{hub.load}%</span>
                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Load</p>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${hub.load > 80 ? 'bg-red-500' : 'bg-primary'}`}
                    style={{ width: `${hub.load}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-secondary dark:text-white">{hub.riders} Active Riders</span>
                    <span className="size-1 bg-gray-200 rounded-full"></span>
                    <span className="text-[10px] font-black text-green-500">Online</span>
                  </div>
                  <span className="material-symbols-outlined text-gray-300 text-[18px] group-hover:translate-x-1 transition-transform">chevron_right</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Global Shipment Feed */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Real-time Oversight</h3>
            <div className="flex gap-2">
              <button className="size-8 rounded-lg bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400 border border-gray-100 dark:border-gray-800">
                <span className="material-symbols-outlined text-[18px]">filter_alt</span>
              </button>
              <button className="size-8 rounded-lg bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400 border border-gray-100 dark:border-gray-800">
                <span className="material-symbols-outlined text-[18px]">sort</span>
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            {activeShipments.map(shp => (
              <div key={shp.id} className="bg-white dark:bg-surface-dark p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-soft hover:border-primary/20 transition-all cursor-pointer">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`size-10 rounded-xl flex items-center justify-center ${shp.status === 'DELAYED' ? 'bg-red-100 text-red-600' :
                      shp.status === 'PICKING_UP' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                      <span className="material-symbols-outlined text-[20px]">
                        {shp.type === 'BAJAJ' ? 'two_wheeler' : shp.type === 'CAR' ? 'directions_car' : 'local_shipping'}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-secondary dark:text-white leading-none mb-1">{shp.id}</h4>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{shp.from} → {shp.to}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${shp.status === 'DELAYED' ? 'bg-red-100 text-red-700' :
                      shp.status === 'PICKING_UP' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                      {shp.status.replace('_', ' ')}
                    </span>
                    <p className="text-[11px] font-black text-secondary dark:text-white mt-1">ETA: {shp.eta}</p>
                  </div>
                </div>
                <div className="pt-3 border-t border-gray-50 dark:border-white/5 flex items-center justify-between">
                  <div className="flex -space-x-1.5">
                    {[1, 2].map(i => <img key={i} className="size-6 rounded-full border-2 border-white dark:border-surface-dark shadow-sm" src={`https://i.pravatar.cc/100?img=${i + 20}`} alt="Rider" />)}
                    <div className="size-6 rounded-full bg-gray-100 dark:bg-white/5 border-2 border-white dark:border-surface-dark text-[8px] font-black flex items-center justify-center text-gray-400">+1</div>
                  </div>
                  <button className="text-primary text-[10px] font-black uppercase tracking-widest flex items-center gap-1">Track Live <span className="material-symbols-outlined text-[14px]">my_location</span></button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminLogisticsControl;
