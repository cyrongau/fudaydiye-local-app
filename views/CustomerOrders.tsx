
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DocumentModal from '../components/DocumentModal';
import { useAuth } from '../Providers';
import { collection, query, where, onSnapshot, doc, updateDoc, increment, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Order } from '../types';

const CustomerOrders: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);

  // Rating State
  const [ratingOrder, setRatingOrder] = useState<Order | null>(null);
  const [selectedRating, setSelectedRating] = useState(0);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "orders"),
      where("customerId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      fetched.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
      setOrders(fetched);
      setLoading(false);
    }, (err) => {
      console.error("Order Sync failure:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleRatingSubmit = async () => {
    if (!ratingOrder || selectedRating === 0) return;
    setIsSubmittingRating(true);
    try {
      await runTransaction(db, async (transaction) => {
        const riderRef = doc(db, "users", ratingOrder.riderId!);
        const orderRef = doc(db, "orders", ratingOrder.id);

        transaction.update(riderRef, {
          totalRatingsCount: increment(1),
          ratingsSum: increment(selectedRating)
        });

        transaction.update(orderRef, {
          isRatedByCustomer: true
        });
      });
      setRatingOrder(null);
      setSelectedRating(0);
    } catch (err) {
      console.error(err);
      alert("Rating sync failure.");
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED': return 'bg-green-500';
      case 'PENDING': return 'bg-amber-500';
      case 'SHIPPED': return 'bg-blue-500';
      case 'ACCEPTED': return 'bg-primary';
      case 'PACKING': return 'bg-secondary';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-700 font-display max-w-7xl mx-auto px-4 md:px-10">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-12 py-8">
        <div className="flex flex-col">
          <h1 className="text-4xl md:text-5xl font-black text-secondary dark:text-white tracking-tighter leading-none uppercase">Order Hub</h1>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mt-3">Live Dispatch Oversight • Real-time Node Sync</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 text-primary px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-primary/20 shadow-sm flex items-center gap-3">
            <span className="size-2 rounded-full bg-primary animate-ping"></span>
            {orders.length} Active Dispatch Nodes
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col gap-10 overflow-y-auto pb-48 no-scrollbar">
        {loading ? (
          <div className="flex justify-center py-40"><div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div></div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-40 opacity-30 text-center">
            <div className="size-24 bg-gray-100 dark:bg-white/5 rounded-[40px] flex items-center justify-center mb-8 border border-gray-100 dark:border-white/10">
              <span className="material-symbols-outlined text-5xl">package_2</span>
            </div>
            <p className="text-base font-black uppercase tracking-[0.3em]">No active shipments detected in cluster</p>
            <button onClick={() => navigate('/customer')} className="mt-10 text-primary font-black uppercase text-xs tracking-[0.4em] underline decoration-4 underline-offset-[12px] hover:text-secondary transition-colors">Initialize Exploration</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {orders.map(order => (
              <div key={order.id} className="bg-white dark:bg-surface-dark p-8 rounded-[48px] border border-gray-100 dark:border-white/5 shadow-soft flex flex-col gap-8 group transition-all hover:border-primary/40 hover:shadow-2xl hover:-translate-y-2 relative overflow-hidden">
                <div className={`absolute top-0 right-0 size-32 opacity-5 rounded-full -translate-y-1/2 translate-x-1/2 ${getStatusColor(order.status)}`}></div>

                <div className="flex justify-between items-start relative z-10">
                  <div className="flex items-center gap-5">
                    <div className="size-16 rounded-[28px] bg-gray-50 dark:bg-white/5 flex items-center justify-center text-secondary dark:text-primary shadow-inner border border-gray-100 dark:border-white/10 group-hover:scale-105 transition-transform">
                      <span className="material-symbols-outlined text-4xl font-black">inventory_2</span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-black text-secondary dark:text-white uppercase tracking-tighter leading-none mb-2 truncate">#{order.orderNumber}</h3>
                      <div className="flex items-center gap-2">
                        <span className={`size-2 rounded-full ${getStatusColor(order.status)} ${order.status !== 'DELIVERED' ? 'animate-pulse' : ''}`}></span>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{order.status}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-primary tracking-tighter leading-none">${order.total.toFixed(2)}</p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-2">Valuation</p>
                  </div>
                </div>

                {order.status === 'DELIVERED' && !order.isRatedByCustomer ? (
                  <div className="bg-primary/5 p-6 rounded-[32px] border border-primary/20 flex flex-col items-center gap-4 animate-in slide-in-from-top-2">
                    <p className="text-[10px] font-black text-secondary dark:text-white uppercase tracking-widest">Rate Delivery Efficiency</p>
                    <button
                      onClick={() => setRatingOrder(order)}
                      className="w-full h-12 bg-primary text-secondary font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg active:scale-95 transition-all"
                    >Rate Captain {order.riderName?.split(' ')[0]}</button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 relative z-10">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Mesh Progress</span>
                      <span className="text-[9px] font-black text-secondary dark:text-white uppercase">
                        {order.status === 'DELIVERED' ? '100%' : order.status === 'SHIPPED' ? '75%' : order.status === 'PACKING' ? '50%' : '25%'}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-50 dark:bg-white/2 rounded-full overflow-hidden border border-gray-100 dark:border-white/5 shadow-inner">
                      <div className={`h-full transition-all duration-[2s] ${getStatusColor(order.status)}`} style={{ width: order.status === 'DELIVERED' ? '100%' : order.status === 'SHIPPED' ? '75%' : order.status === 'PACKING' ? '50%' : '25%' }}></div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 relative z-10">
                  <button
                    onClick={() => navigate(`/customer/track/${order.id}`)}
                    className="h-14 bg-secondary text-primary font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all group/btn hover:shadow-primary-glow"
                  >
                    <span className="material-symbols-outlined text-[20px] group-hover/btn:scale-110 transition-transform">my_location</span>
                    Live Track
                  </button>
                  <button
                    onClick={() => setSelectedDoc({ id: order.orderNumber, date: order.createdAt?.toDate().toLocaleDateString() || 'Today', vendor: order.vendorName || 'Fudaydiye Merchant', amount: `$${order.total.toFixed(2)}`, customer: order.customerName })}
                    className="h-14 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 flex items-center justify-center text-gray-400 active:scale-95 transition-all hover:bg-white hover:text-primary shadow-sm group/receipt"
                  >
                    <span className="material-symbols-outlined group-hover/receipt:rotate-12 transition-transform">receipt_long</span>
                    <span className="ml-2 text-[10px] font-black uppercase tracking-widest">Receipt</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Rating Modal */}
      {ratingOrder && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-secondary/80 backdrop-blur-md" onClick={() => setRatingOrder(null)}></div>
          <div className="relative bg-white dark:bg-surface-dark rounded-[48px] p-10 max-w-sm w-full shadow-2xl text-center animate-in zoom-in-95">
            <div className="size-20 rounded-[28px] bg-primary/20 flex items-center justify-center text-primary mx-auto mb-6">
              <span className="material-symbols-outlined text-[40px] font-black">star</span>
            </div>
            <h3 className="text-2xl font-black text-secondary dark:text-white uppercase tracking-tighter mb-2">Rate Dispatch</h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-10 leading-relaxed">
              Provide consensus on Captain {ratingOrder.riderName}'s delivery speed and efficiency.
            </p>

            <div className="flex justify-center gap-2 mb-10">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => setSelectedRating(star)}
                  className={`size-12 rounded-xl flex items-center justify-center transition-all ${selectedRating >= star ? 'bg-amber-400 text-white shadow-lg scale-110' : 'bg-gray-50 dark:bg-white/5 text-gray-200'}`}
                >
                  <span className="material-symbols-outlined text-2xl fill-1">star</span>
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              <button
                disabled={selectedRating === 0 || isSubmittingRating}
                onClick={handleRatingSubmit}
                className="w-full h-16 bg-primary text-secondary font-black uppercase text-xs tracking-[0.2em] rounded-2xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                {isSubmittingRating ? <span className="animate-spin material-symbols-outlined">sync</span> : 'Confirm Rating Node'}
              </button>
              <button onClick={() => setRatingOrder(null)} className="text-[10px] font-black text-gray-400 uppercase tracking-widest py-3">Later</button>
            </div>
          </div>
        </div>
      )}

      <DocumentModal isOpen={!!selectedDoc} onClose={() => setSelectedDoc(null)} type="INVOICE" data={selectedDoc || {}} />
    </div>
  );
};

export default CustomerOrders;
