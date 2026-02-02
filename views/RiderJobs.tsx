
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, updateDoc, doc, serverTimestamp, addDoc, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Order } from '../types';
import { useAuth } from '../Providers';
import HeaderNotification from '../components/HeaderNotification';
import { RiderService } from '../src/lib/services/riderService';

interface MeshBatch {
  id: string;
  orders: Order[];
  totalEarning: number;
  totalDistance: string;
  efficiency: number;
  stops: number;
}

const RiderJobs: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'BATCH' | 'SINGLE'>('BATCH');

  useEffect(() => {
    if (!profile?.location) return;

    // Real Logic: Filter orders by Rider's Hub
    // If rider is "Central" or undefined, show all. Otherwise, filter strictly.
    // 1. Robust Query: Fetch recent orders and filter client-side to prevent Index/Assertion errors
    // Simple query on collection reference
    // Optimized Query: Filter for PENDING orders only to prevent over-fetching
    const q = query(
      collection(db, "orders"),
      where("status", "==", "PENDING"),
      where("riderId", "==", null), // Only unassigned orders
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));

      // Filter for PENDING + Hub Match
      const hubFiltered = allOrders.filter(o =>
        o.status === "PENDING" &&
        !o.riderId &&
        (profile?.location === 'Central' || !o.vendorHub || o.vendorHub === profile?.location)
      );

      setAvailableOrders(hubFiltered);
      setLoading(false);
    }, (error) => {
      console.error("Fleet Queue Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile?.location]);

  // AI Mesh Logic: Smart Cluster orders based on exact specific neighborhood match
  const batches = useMemo(() => {
    const meshBatches: MeshBatch[] = [];
    const processedIds = new Set<string>();

    availableOrders.forEach((order) => {
      if (processedIds.has(order.id)) return;

      // Logic: Group by exact first part of address (e.g. "Jigjiga Yar") and same Vendor Hub
      const neighborhood = order.shippingAddress.split(',')[0].trim();

      const cluster = availableOrders.filter(o =>
        o.id !== order.id &&
        !processedIds.has(o.id) &&
        o.shippingAddress.includes(neighborhood) &&
        o.vendorHub === order.vendorHub
      ).slice(0, 2); // Cap at 3 total orders per batch

      if (cluster.length > 0) {
        const fullGroup = [order, ...cluster];
        fullGroup.forEach(o => processedIds.add(o.id));

        // Calculate real combined distance (simulated) and earnings
        const totalPay = fullGroup.reduce((sum, o) => sum + (o.deliveryFee || 3.5), 0);

        meshBatches.push({
          id: `mesh-${order.id.substring(0, 4)}-${cluster.length}`,
          orders: fullGroup,
          totalEarning: totalPay, // No bonus, just sum for now
          totalDistance: `${(1.5 + cluster.length * 0.8).toFixed(1)} KM`,
          efficiency: 90 + (cluster.length * 3), // Higher efficiency for more items
          stops: fullGroup.length + 1 // 1 Pickup (assumed same hub) + N drops
        });
      }
    });

    return meshBatches;
  }, [availableOrders]);

  const handleAcceptSingle = async (order: Order) => {
    if (!user) return;
    try {
      await RiderService.acceptJob(order.id, user.uid);
      navigate(`/rider/pickup/${order.id}`);
    } catch (err) { alert("Node claim failure."); }
  };

  const handleAcceptBatch = async (batch: MeshBatch) => {
    if (!user) return;
    const dbBatch = writeBatch(db);

    try {
      batch.orders.forEach(order => {
        const orderRef = doc(db, "orders", order.id);
        dbBatch.update(orderRef, {
          status: 'ACCEPTED',
          riderId: user.uid,
          riderName: profile?.fullName || "Dispatch Captain",
          batchId: batch.id,
          acceptedAt: serverTimestamp()
        });
      });

      await dbBatch.commit();
      alert("Neural Mesh Link Authorized. Batch claimed.");
      navigate('/rider/assignments');
    } catch (err) {
      alert("Mesh batch synchronization failure.");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark font-display transition-colors">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-surface-dark/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-3xl bg-secondary text-primary flex items-center justify-center shadow-lg border-2 border-primary/20">
              <span className="material-symbols-outlined text-3xl font-black">hub</span>
            </div>
            <div>
              <h2 className="text-secondary dark:text-white text-xl font-black uppercase tracking-tighter leading-none">Fleet Queue</h2>
              <span className="text-[9px] font-black text-primary uppercase tracking-[0.3em] mt-1 block">Mesh Network Active</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <HeaderNotification />
            <div className="text-right">
              <p className="text-xs font-black text-secondary dark:text-white leading-none">{availableOrders.length}</p>
              <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1">Pending Nodes</p>
            </div>
          </div>
        </div>

        <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-2xl border border-gray-200 dark:border-white/10">
          <button
            onClick={() => setViewMode('BATCH')}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${viewMode === 'BATCH' ? 'bg-white dark:bg-surface-dark text-primary shadow-sm' : 'text-gray-400'}`}
          >
            <span className="material-symbols-outlined text-[18px]">account_tree</span>
            Mesh Batches ({batches.length})
          </button>
          <button
            onClick={() => setViewMode('SINGLE')}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${viewMode === 'SINGLE' ? 'bg-white dark:bg-surface-dark text-primary shadow-sm' : 'text-gray-400'}`}
          >
            <span className="material-symbols-outlined text-[18px]">person</span>
            Single Jobs ({availableOrders.filter(o => !batches.some(b => b.orders.find(bo => bo.id === o.id))).length})
          </button>
        </div>
      </header >

      <main className="flex-1 p-6 md:p-12 flex flex-col gap-6 overflow-y-auto pb-48 no-scrollbar animate-in fade-in duration-500 max-w-4xl mx-auto w-full">
        {loading ? (
          <div className="py-20 flex justify-center"><div className="size-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div></div>
        ) : viewMode === 'BATCH' ? (
          /* MESH BATCH LISTING */
          batches.length === 0 ? (
            <div className="py-32 text-center opacity-30">
              <span className="material-symbols-outlined text-6xl block mb-4">inbox</span>
              <p className="text-xs font-black uppercase tracking-widest">No data available yet</p>
            </div>
          ) : (
            batches.map(batch => (
              <div key={batch.id} className="bg-secondary text-white p-8 rounded-[48px] shadow-2xl border border-white/5 relative overflow-hidden group animate-in slide-in-from-bottom-4 duration-500">
                <div className="absolute top-0 right-0 size-48 bg-primary/10 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2"></div>

                <div className="relative z-10 flex justify-between items-start mb-8">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-primary text-secondary px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest">Mesh Efficiency: {batch.efficiency}%</span>
                      <span className="bg-white/10 px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest text-primary border border-white/10">{batch.totalDistance}</span>
                    </div>
                    <h3 className="text-2xl font-black tracking-tighter uppercase leading-none">Multiplex Batch</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black text-primary tracking-tighter leading-none">${batch.totalEarning.toFixed(2)}</p>
                    <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest mt-1">Total Reward</p>
                  </div>
                </div>

                <div className="space-y-4 mb-10">
                  {batch.orders.map((o, idx) => (
                    <div key={o.id} className="flex items-center gap-4 bg-white/5 p-3 rounded-2xl border border-white/5">
                      <div className="size-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary text-[10px] font-black">#{idx + 1}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black uppercase truncate">{o.vendorName} → {o.shippingAddress.split(',')[0]}</p>
                        <p className="text-[8px] font-bold text-white/30 uppercase tracking-widest">Protocol: {o.isAtomic ? 'ATOMIC' : 'STANDARD'}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleAcceptBatch(batch)}
                  className="w-full h-16 bg-primary text-secondary font-black text-xs uppercase tracking-[0.3em] rounded-[24px] shadow-primary-glow flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
                >
                  Authorize Mesh Batch
                  <span className="material-symbols-outlined font-black">bolt</span>
                </button>
              </div>
            ))
          )
        ) : (
          /* SINGLE JOB LISTING */
          <div className="flex flex-col gap-5">
            {availableOrders
              .filter(o => !batches.some(b => b.orders.find(bo => bo.id === o.id)))
              .map(job => (
                <div key={job.id} className="bg-white dark:bg-surface-dark p-7 rounded-[40px] border border-gray-100 dark:border-white/5 shadow-soft flex flex-col gap-6 group hover:border-primary/20 transition-all animate-in slide-in-from-bottom-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <div className="size-14 rounded-2xl bg-gray-50 dark:bg-white/5 flex items-center justify-center text-secondary dark:text-primary shadow-inner border border-gray-100">
                        <span className="material-symbols-outlined text-3xl font-black">local_shipping</span>
                      </div>
                      <div>
                        <h4 className="text-base font-black text-secondary dark:text-white uppercase tracking-tighter mb-1">#{job.orderNumber}</h4>
                        <div className="flex items-center gap-2">
                          {job.type === 'LOGISTICS' && (
                            <span className="bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">Client Order</span>
                          )}
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest truncate max-w-[150px]">{job.shippingAddress}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-primary tracking-tighter leading-none">${(job.deliveryFee || 3.50).toFixed(2)}</p>
                      <p className="text-[8px] font-bold text-gray-300 uppercase tracking-widest mt-1">Earning</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAcceptSingle(job)}
                    className="w-full h-14 bg-gray-100 dark:bg-white/5 text-secondary dark:text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl active:scale-[0.98] transition-all hover:bg-primary hover:text-secondary border border-gray-100 dark:border-white/10"
                  >
                    Claim Node
                  </button>
                </div>
              ))}
          </div>
        )}
      </main>
    </div >
  );
};

export default RiderJobs;
