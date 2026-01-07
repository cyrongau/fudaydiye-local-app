
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import DocumentModal from '../components/DocumentModal';
import { useAuth } from '../Providers';
import { collection, query, where, onSnapshot, doc, updateDoc, getDocs, addDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Order, RiderProfile } from '../types';

const VendorOrderFulfillment: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'PACKING' | 'SHIPPED' | 'DELIVERED'>('PENDING');

  const [assigningOrderId, setAssigningOrderId] = useState<string | null>(null);
  const [availableRiders, setAvailableRiders] = useState<RiderProfile[]>([]);
  const [isFindingRiders, setIsFindingRiders] = useState(false);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "orders"),
      where("vendorId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      fetched.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setOrders(fetched);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const clearAssociatedNotifications = async (orderId: string) => {
    try {
      const q = query(collection(db, "notifications"), where("userId", "==", user?.uid));
      const snap = await getDocs(q);
      const batch = writeBatch(db);
      snap.docs.forEach(d => {
        if (d.data().message.includes(orderId)) {
          batch.update(d.ref, { isRead: true });
        }
      });
      await batch.commit();
    } catch (e) { console.error(e); }
  };

  const handleStatusChange = async (order: Order, nextStatus: string) => {
    try {
      await updateDoc(doc(db, "orders", order.id), {
        status: nextStatus,
        lastStatusUpdate: serverTimestamp()
      });

      await clearAssociatedNotifications(order.orderNumber);

      await addDoc(collection(db, "notifications"), {
        userId: order.customerId,
        title: "Dispatch Node Status",
        message: `Order #${order.orderNumber} transitioned to ${nextStatus}.`,
        link: `/customer/track/${order.id}`,
        type: 'ORDER',
        isRead: false,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      alert("Mesh failure: Status synchronization could not be broadcast.");
    }
  };

  const findRidersForOrder = async (order: Order) => {
    setAssigningOrderId(order.id);
    setIsFindingRiders(true);

    try {
      const q = query(collection(db, "users"), where("role", "==", "RIDER"), where("status", "==", "ONLINE"));
      const snap = await getDocs(q);
      const riders = snap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.fullName,
          hub: data.location || 'Hargeisa',
          currentGeo: data.currentGeo || { lat: 9.5624, lng: 44.0770 },
          rating: data.rating || 5.0,
          vehicleType: data.vehicleType || 'Bajaj'
        } as RiderProfile;
      });
      setAvailableRiders(riders);
    } catch (err) {
      console.error(err);
    } finally {
      setIsFindingRiders(false);
    }
  };

  const handleAssignRider = async (rider: RiderProfile) => {
    if (!assigningOrderId) return;
    try {
      const targetOrder = orders.find(o => o.id === assigningOrderId);
      await updateDoc(doc(db, "orders", assigningOrderId), {
        riderId: rider.id,
        riderName: rider.name,
        status: 'ACCEPTED',
        lastUpdate: serverTimestamp()
      });

      if (targetOrder) await clearAssociatedNotifications(targetOrder.orderNumber);

      await addDoc(collection(db, "notifications"), {
        userId: rider.id,
        title: "Priority Pickup",
        message: `New dispatch request from ${profile?.businessName || 'Merchant'}.`,
        link: `/rider/pickup/${assigningOrderId}`,
        type: 'ORDER',
        isRead: false,
        createdAt: serverTimestamp()
      });

      setAssigningOrderId(null);
    } catch (err) {
      alert("Assignment failure.");
    }
  };

  const filteredOrders = orders.filter(o => o.status === activeTab);

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark font-display transition-colors">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/5 active:scale-90 transition-all">
            <span className="material-symbols-outlined text-secondary dark:text-white">arrow_back</span>
          </button>
          <div className="flex flex-col">
            <h1 className="text-xl font-black text-secondary dark:text-primary uppercase tracking-tighter leading-none">Fulfillment</h1>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">Live Order Protocol</p>
          </div>
        </div>
      </header>

      <main className="p-6 flex-1 flex flex-col gap-8 overflow-y-auto pb-32 no-scrollbar animate-in fade-in duration-500">
        <section className="flex gap-2 overflow-x-auto no-scrollbar">
          {['PENDING', 'PACKING', 'SHIPPED', 'DELIVERED'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-6 py-2.5 rounded-2xl border-2 whitespace-nowrap transition-all text-[10px] font-black uppercase tracking-widest ${activeTab === tab ? 'bg-primary border-primary text-secondary shadow-lg' : 'bg-white dark:bg-white/5 border-transparent text-gray-400'
                }`}
            >
              {tab} ({orders.filter(o => o.status === tab).length})
            </button>
          ))}
        </section>

        <div className="flex flex-col gap-6">
          {loading ? (
            <div className="flex justify-center py-20"><div className="size-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div></div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-24 text-center opacity-30">
              <span className="material-symbols-outlined text-6xl block mb-4">inventory</span>
              <p className="text-xs font-black uppercase tracking-widest">No active requests in this segment</p>
            </div>
          ) : (
            filteredOrders.map(order => (
              <div key={order.id} className="bg-white dark:bg-surface-dark p-6 rounded-[32px] border border-gray-100 dark:border-white/5 shadow-soft flex flex-col gap-5 animate-in slide-in-from-bottom-2 duration-300">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="size-14 rounded-2xl bg-gray-50 dark:bg-white/5 flex items-center justify-center text-secondary dark:text-primary shadow-inner border border-gray-100 dark:border-white/10">
                      <span className="material-symbols-outlined text-3xl font-black">package_2</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-secondary dark:text-white leading-none mb-1.5 uppercase tracking-tighter">#{order.orderNumber}</h4>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{order.customerName}</p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <p className="text-base font-black text-primary leading-none">${order.total.toFixed(2)}</p>
                    {order.deliveryCode && (order.status !== 'DELIVERED') && (
                      <div className="bg-primary text-secondary px-4 py-2 rounded-2xl flex items-center gap-2 shadow-primary-glow animate-in zoom-in duration-300">
                        <span className="material-symbols-outlined text-[16px] font-black">lock</span>
                        <div className="flex flex-col items-start leading-none">
                          <span className="text-[7px] font-black uppercase tracking-widest opacity-60">Security PIN</span>
                          <span className="text-[14px] font-black tracking-[0.2em]">{order.deliveryCode}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {order.riderName && (
                  <div className="flex items-center justify-between bg-gray-50 dark:bg-white/2 p-4 rounded-2xl border border-gray-100 dark:border-white/5">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-gray-400 text-[20px]">two_wheeler</span>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Assigned to: <span className="text-secondary dark:text-white font-black">{order.riderName}</span></p>
                    </div>
                    {order.status === 'ACCEPTED' && (
                      <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-100 dark:border-amber-500/20">
                        <span className="size-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                        <span className="text-[8px] font-black text-amber-600 uppercase tracking-widest">Awaiting Pickup</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  {order.status === 'PENDING' && (
                    <button
                      onClick={() => handleStatusChange(order, 'PACKING')}
                      className="flex-1 h-12 bg-primary text-secondary font-black text-[10px] uppercase tracking-[0.2em] rounded-xl shadow-lg active:scale-95 transition-all"
                    >Start Packing</button>
                  )}
                  {order.status === 'PACKING' && (
                    <button
                      onClick={() => findRidersForOrder(order)}
                      className="flex-1 h-12 bg-secondary text-primary font-black text-[10px] uppercase tracking-[0.2em] rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      Assign Captain
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedDoc({ id: order.orderNumber, date: 'Today', vendor: profile?.businessName, customer: order.customerName, amount: `$${order.total.toFixed(2)}` })}
                    className="size-12 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl flex items-center justify-center text-gray-400 active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined">print</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {assigningOrderId && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-10">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setAssigningOrderId(null)}></div>
          <div className="relative w-full max-w-sm bg-white dark:bg-surface-dark rounded-[40px] p-8 shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[70vh] flex flex-col">
            <h3 className="text-xl font-black text-secondary dark:text-white uppercase tracking-tighter mb-6">Assign Dispatch Captain</h3>
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
              {isFindingRiders ? <div className="py-10 text-center animate-spin"><span className="material-symbols-outlined">sync</span></div> : (
                availableRiders.length === 0 ? <p className="text-center text-xs opacity-40 py-10 uppercase font-black">No online captains detected</p> :
                  availableRiders.map(rider => (
                    <button key={rider.id} onClick={() => handleAssignRider(rider)} className="w-full p-4 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-3xl flex items-center justify-between group transition-all hover:border-primary/20">
                      <div className="flex items-center gap-4 text-left">
                        <img src={rider.avatar || `https://ui-avatars.com/api/?name=${rider.name}&background=015754&color=06DC7F`} className="size-11 rounded-2xl object-cover shadow-sm border border-gray-100" alt="" />
                        <div>
                          <p className="text-sm font-black text-secondary dark:text-white uppercase">{rider.name}</p>
                          <p className="text-[9px] font-bold text-gray-400 uppercase">{rider.vehicleType} • {rider.rating}★</p>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-primary">arrow_forward</span>
                    </button>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      <DocumentModal isOpen={!!selectedDoc} onClose={() => setSelectedDoc(null)} type="PACKING_SLIP" data={selectedDoc || {}} />
      <BottomNav />
    </div>
  );
};

export default VendorOrderFulfillment;
