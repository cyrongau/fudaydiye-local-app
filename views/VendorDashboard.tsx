import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DocumentModal from '../components/DocumentModal';
import { GoogleGenAI } from "@google/genai";
import { collection, query, where, orderBy, doc, deleteDoc, writeBatch, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../Providers';
import AdminAbandonmentReport from './AdminAbandonmentReport';
import HeaderNotification from '../components/HeaderNotification';

interface Message {
   role: 'user' | 'ai';
   text: string;
   type?: 'text' | 'sales_summary' | 'product_action';
}

interface Notification {
   id: string;
   title: string;
   message: string;
   type: 'ORDER' | 'SYSTEM' | 'ALERT';
   read: boolean;
   link?: string;
   createdAt: any;
}

const VendorDashboard: React.FC = () => {
   const navigate = useNavigate();
   const { profile, user } = useAuth();
   const [stats, setStats] = useState({
      sales: 0,
      activeOrders: 0,
      pendingShipment: 0,
      activeProducts: 0
   });
   const [recentOrders, setRecentOrders] = useState<any[]>([]);
   const [topProducts, setTopProducts] = useState<any[]>([]);
   const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'LEADS'>('DASHBOARD');

   useEffect(() => {
      if (!user?.uid) return;

      const fetchData = async () => {
         try {
            // 1. Fetch Orders (Sales & Activity)
            const qOrders = query(collection(db, "orders"), where("vendorId", "==", user.uid));
            const orderSnap = await getDocs(qOrders);

            let totalSales = 0;
            let active = 0;
            let pending = 0;
            const orders = orderSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

            // Client-side Sort
            orders.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

            orders.forEach(order => {
               let orderTotal = Number(order.total) || Number(order.totalAmount);
               if (isNaN(orderTotal)) orderTotal = 0;

               const status = (order.status || '').toUpperCase();

               if (status === 'DELIVERED') totalSales += orderTotal;
               if (['PENDING', 'ACCEPTED', 'PROCESSING', 'PICKED_UP'].includes(status)) active++;
               if (status === 'PENDING') pending++;
            });

            setStats(prev => ({ ...prev, sales: totalSales, activeOrders: active, pendingShipment: pending }));
            setRecentOrders(orders.slice(0, 5));

            // Calculate Top Products based on recent orders (Basic logic)
            const productCounts: Record<string, any> = {};
            orders.forEach(order => {
               order.items?.forEach((item: any) => {
                  if (!productCounts[item.productId]) {
                     productCounts[item.productId] = { name: item.name, sold: 0, img: item.image };
                  }
                  productCounts[item.productId].sold += item.qty || 1;
               });
            });
            setTopProducts(Object.values(productCounts).sort((a: any, b: any) => b.sold - a.sold).slice(0, 5));

            // 2. Fetch Products (Inventory Stats)
            const qProducts = query(collection(db, "products"), where("vendorId", "==", user.uid), where("status", "==", "ACTIVE"));
            const productSnap = await getDocs(qProducts);
            setStats(prev => ({ ...prev, activeProducts: productSnap.size }));

         } catch (error) {
            console.error("Dashboard Data Error:", error);
         }
      };

      fetchData();
   }, [user]);

   const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
   };

   return (
      <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-black pb-[calc(var(--bottom-nav-height)+2rem)] font-display">
         {/* Header */}
         <div className="bg-white dark:bg-surface-dark px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 z-30 border-b border-gray-100 dark:border-white/5">
            <div className="flex items-center gap-2">
               <div className="size-8 bg-[#06DC7F] rounded-full flex items-center justify-center text-white font-black text-xs">F</div>
               <span className="text-lg font-black text-secondary dark:text-white">Fudaydiye</span>
            </div>
            <div className="flex items-center gap-3">
               <HeaderNotification />

               <div className="size-8 rounded-full bg-orange-300 overflow-hidden border border-orange-100">
                  <img src={profile?.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200"} className="w-full h-full object-cover" alt="Profile" />
               </div>
            </div>
         </div>

         <div className="px-6 space-y-6 pt-6">
            {/* Greeting */}
            <div>
               <h1 className="text-2xl font-black text-secondary dark:text-white">
                  Good morning,<br />{profile?.displayName?.split(' ')[0] || 'Partner'} <span className="text-2xl">👋</span>
               </h1>
            </div>

            {/* Live Sale Banner - Only if enabled */}
            {profile?.canStream && (
               <div onClick={() => navigate('/vendor/live-setup')} className="bg-[#E93A3A] rounded-[24px] p-5 flex items-center justify-between text-white shadow-lg shadow-red-500/20 active:scale-95 transition-all cursor-pointer relative overflow-hidden">
                  <div className="absolute top-0 right-0 size-24 bg-white/10 rounded-full blur-2xl -mr-8 -mt-8"></div>
                  <div className="flex items-center gap-4 relative z-10">
                     <div className="size-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                        <span className="material-symbols-outlined text-2xl">videocam</span>
                     </div>
                     <div>
                        <h3 className="text-base font-black uppercase tracking-tight">Go Live Now</h3>
                        <p className="text-[11px] opacity-90 font-medium">Boost sales by 50% today</p>
                     </div>
                  </div>
                  <div className="size-10 bg-white text-[#E93A3A] rounded-full flex items-center justify-center shadow-sm relative z-10">
                     <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </div>
               </div>
            )}

            {/* Stats Cards - Staggered Grid */}
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-white dark:bg-surface-dark p-5 rounded-[24px] shadow-sm border border-gray-100 dark:border-white/5 flex flex-col justify-between h-32">
                  <div className="flex items-start justify-between">
                     <div className="size-8 bg-green-100 text-green-600 rounded-xl flex items-center justify-center"><span className="material-symbols-outlined text-lg">payments</span></div>
                     <span className="text-[10px] bg-green-50 text-green-600 px-2 py-1 rounded-md font-bold">+12%</span>
                  </div>
                  <div>
                     <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Sales</span>
                     <p className="text-2xl font-black text-secondary dark:text-white mt-0.5">{formatCurrency(stats.sales)}</p>
                  </div>
               </div>
               <div className="bg-white dark:bg-surface-dark p-5 rounded-[24px] shadow-sm border border-gray-100 dark:border-white/5 flex flex-col justify-between h-32">
                  <div className="flex items-start justify-between">
                     <div className="size-8 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center"><span className="material-symbols-outlined text-lg">shopping_bag</span></div>
                     <span className="text-[10px] bg-gray-50 text-gray-400 px-2 py-1 rounded-md font-bold">{stats.pendingShipment} New</span>
                  </div>
                  <div>
                     <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Active Orders</span>
                     <p className="text-2xl font-black text-secondary dark:text-white mt-0.5">{stats.activeOrders}</p>
                  </div>
               </div>
            </div>

            {/* Quick Actions Scroll View */}
            <div>
               <h3 className="text-sm font-black text-secondary dark:text-white mb-3">Quick Actions</h3>
               <div className="flex gap-4 overflow-x-auto no-scrollbar py-1">
                  <QuickAction icon="inventory_2" label="Products" color="bg-orange-100 text-orange-600" onClick={() => navigate('/vendor/inventory')} />
                  <QuickAction icon="upload_file" label="Import" color="bg-teal-100 text-teal-600" onClick={() => navigate('/vendor/import')} />
                  {profile?.canStream && <QuickAction icon="campaign" label="Promote" color="bg-purple-100 text-purple-600" onClick={() => navigate('/vendor/live-setup')} />}
                  <QuickAction icon="bar_chart" label="Analytics" color="bg-blue-100 text-blue-600" onClick={() => navigate('/vendor/analytics')} />
                  <QuickAction icon="reviews" label="Reviews" color="bg-yellow-100 text-yellow-600" onClick={() => navigate('/vendor/reviews')} />
                  <QuickAction icon="unsubscribe" label="Leads" color="bg-red-100 text-red-600" onClick={() => setActiveTab('LEADS')} />
               </div>
            </div>

            {activeTab === 'LEADS' ? (
               <AdminAbandonmentReport />
            ) : (
               <>
                  {/* Recent Orders List */}

                  {/* Recent Orders List */}
                  <div>
                     <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-black text-secondary dark:text-white">Recent Orders</h3>
                        <button onClick={() => navigate('/vendor/orders')} className="text-[11px] font-black text-[#06DC7F] uppercase tracking-wider">View All</button>
                     </div>
                     <div className="space-y-3">
                        {recentOrders.length === 0 && <div className="bg-white dark:bg-surface-dark rounded-2xl p-8 text-center text-gray-400 text-xs">No orders yet today.</div>}
                        {recentOrders.map((order, i) => (
                           <div key={i} className="bg-white dark:bg-surface-dark p-3 rounded-[20px] shadow-sm border border-gray-100 dark:border-white/5 flex gap-4 active:scale-[0.98] transition-all">
                              <div className="size-14 rounded-xl bg-gray-100 shrink-0 overflow-hidden">
                                 <img src={order.items?.[0]?.image || "https://placehold.co/100"} className="size-full object-cover" />
                              </div>
                              <div className="flex-1 min-w-0">
                                 <div className="flex justify-between items-start mb-1">
                                    <h4 className="text-sm font-bold text-secondary dark:text-white truncate pr-2">{order.items?.[0]?.name}</h4>
                                    <span className="text-sm font-black text-[#06DC7F] shrink-0">{formatCurrency(Number(order.total) || Number(order.totalAmount) || 0)}</span>
                                 </div>
                                 <p className="text-[10px] text-gray-400 mb-2">{order.items?.length || 1} items • {new Date(order.createdAt?.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                 <div className="flex items-center gap-2">
                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wide ${order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{order.status}</span>
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               </>
            )}
         </div>

         {/* FAB - Add Product */}
         <button
            onClick={() => navigate('/vendor/add-product')}
            className="fixed bottom-[calc(var(--bottom-nav-height)+1.5rem)] right-5 size-14 bg-secondary text-[#06DC7F] rounded-full shadow-xl shadow-secondary/30 flex items-center justify-center z-40 active:scale-90 transition-transform"
         >
            <span className="material-symbols-outlined text-3xl">add</span>
         </button>
      </div>
   );
};

const QuickAction: React.FC<{ icon: string; label: string; color: string; onClick: () => void }> = ({ icon, label, color, onClick }) => (
   <div onClick={onClick} className="flex flex-col items-center gap-2 cursor-pointer active:scale-95 transition-transform">
      <div className={`size-14 rounded-full flex items-center justify-center shadow-sm ${color} bg-opacity-20`}>
         <span className="material-symbols-outlined text-2xl">{icon}</span>
      </div>
      <span className="text-[10px] font-bold text-gray-600 dark:text-gray-400">{label}</span>
   </div>
);

export default VendorDashboard;


