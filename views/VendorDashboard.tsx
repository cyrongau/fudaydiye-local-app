import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../Providers';
import AdminAbandonmentReport from './AdminAbandonmentReport';
import HeaderNotification from '../components/HeaderNotification';

const VendorDashboard: React.FC = () => {
   const navigate = useNavigate();
   const { profile, user } = useAuth();
   const [allOrders, setAllOrders] = useState<any[]>([]);
   const [stats, setStats] = useState({
      sales: 0,
      activeOrders: 0,
      pendingShipment: 0,
      activeProducts: 0,
      followers: 0
   });
   const [recentOrders, setRecentOrders] = useState<any[]>([]);
   const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'LEADS'>('DASHBOARD');

   // Filter State
   const [timeRange, setTimeRange] = useState<'DAY' | 'WEEK' | 'MONTH' | '6_MONTHS' | 'YEAR'>('MONTH');
   const [isPeriodOpen, setIsPeriodOpen] = useState(false);

   useEffect(() => {
      if (!user?.uid) return;

      const fetchData = async () => {
         try {
            // 1. Fetch ALL Orders for Vendor
            const qOrders = query(collection(db, "orders"), where("vendorId", "==", user.uid));
            const orderSnap = await getDocs(qOrders);
            const orders = orderSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

            // Client-side Sort
            orders.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            setAllOrders(orders);

            // 2. Fetch Products (Inventory Stats - Not filtered by date usually, but could be)
            const qProducts = query(collection(db, "products"), where("vendorId", "==", user.uid), where("status", "==", "ACTIVE"));
            const productSnap = await getDocs(qProducts);
            setStats(prev => ({ ...prev, activeProducts: productSnap.size }));

            // 3. Fetch Followers Count
            try {
               const qFollowers = query(collection(db, "users", user.uid, "followers"));
               const followerSnap = await getDocs(qFollowers);
               setStats(prev => ({ ...prev, followers: followerSnap.size }));
            } catch (e) { }

         } catch (error) {
            console.error("Dashboard Data Error:", error);
         }
      };

      fetchData();
   }, [user]);

   // Calculate Stats based on TimeRange
   useEffect(() => {
      if (!allOrders.length) return;

      const now = new Date();
      const cutoff = new Date();

      switch (timeRange) {
         case 'DAY': cutoff.setHours(0, 0, 0, 0); break;
         case 'WEEK': cutoff.setDate(now.getDate() - 7); break;
         case 'MONTH': cutoff.setMonth(now.getMonth() - 1); break;
         case '6_MONTHS': cutoff.setMonth(now.getMonth() - 6); break;
         case 'YEAR': cutoff.setFullYear(now.getFullYear() - 1); break;
      }

      const filteredOrders = allOrders.filter(order => {
         const orderDate = new Date((order.createdAt?.seconds || 0) * 1000);
         return orderDate >= cutoff;
      });

      let totalSales = 0;
      let active = 0;
      let pending = 0;

      filteredOrders.forEach(order => {
         let orderTotal = Number(order.total) || Number(order.totalAmount);
         if (isNaN(orderTotal)) orderTotal = 0;

         const status = (order.status || '').toUpperCase();

         if (status === 'DELIVERED') totalSales += orderTotal;
         if (['PENDING', 'ACCEPTED', 'PROCESSING', 'PICKED_UP'].includes(status)) active++;
         if (status === 'PENDING') pending++;
      });

      setStats(prev => ({ ...prev, sales: totalSales, activeOrders: active, pendingShipment: pending }));
      setRecentOrders(filteredOrders.slice(0, 5));

   }, [allOrders, timeRange]);

   const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
   };

   const getRangeLabel = () => {
      const labels = {
         DAY: 'Today',
         WEEK: 'This Week',
         MONTH: 'This Month',
         '6_MONTHS': 'Last 6 Months',
         YEAR: 'This Year'
      };
      return labels[timeRange];
   };

   return (
      <div className="flex flex-col min-h-screen bg-gray-50/50 dark:bg-black pb-[calc(var(--bottom-nav-height)+2rem)] font-display">
         {/* Header */}
         <div className="bg-white dark:bg-surface-dark px-8 py-6 flex items-center justify-between sticky top-0 z-30 border-b border-gray-100 dark:border-white/5">
            <div>
               <h1 className="text-2xl font-black text-secondary dark:text-white mb-1">
                  Overview
               </h1>
               <p className="text-sm text-gray-400 font-medium">Here is the summary of overall data</p>
            </div>
            <div className="flex items-center gap-4">

               {/* Period Filter Pill */}
               <div className="relative">
                  <button
                     onClick={() => setIsPeriodOpen(!isPeriodOpen)}
                     className="flex items-center bg-gray-50 dark:bg-white/5 px-4 py-2 rounded-full border border-gray-100 dark:border-white/5 hover:border-gray-300 transition-colors"
                  >
                     <span className="text-xs font-bold text-gray-500 mr-2 uppercase tracking-wide">{getRangeLabel()}</span>
                     <span className={`material-symbols-outlined text-gray-400 text-sm transition-transform ${isPeriodOpen ? 'rotate-180' : ''}`}>expand_more</span>
                  </button>

                  {isPeriodOpen && (
                     <div className="absolute top-full right-0 mt-2 w-40 bg-white dark:bg-surface-dark rounded-xl shadow-xl border border-gray-100 dark:border-white/5 py-1 z-50 animate-in fade-in slide-in-from-top-2">
                        {(['DAY', 'WEEK', 'MONTH', '6_MONTHS', 'YEAR'] as const).map((r) => (
                           <button
                              key={r}
                              onClick={() => { setTimeRange(r); setIsPeriodOpen(false); }}
                              className={`w-full text-left px-4 py-2 text-[10px] font-bold uppercase tracking-wider hover:bg-gray-50 dark:hover:bg-white/5 ${timeRange === r ? 'text-primary' : 'text-gray-500'}`}
                           >
                              {r === 'DAY' ? 'Today' : r === 'WEEK' ? 'This Week' : r === 'MONTH' ? 'This Month' : r === '6_MONTHS' ? 'Last 6 Months' : 'This Year'}
                           </button>
                        ))}
                     </div>
                  )}
               </div>

               <HeaderNotification />
               <div className="size-10 rounded-full bg-orange-300 overflow-hidden border border-orange-100 ring-2 ring-white dark:ring-black">
                  <img src={profile?.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200"} className="w-full h-full object-cover" alt="Profile" />
               </div>
            </div>
         </div>

         <div className="p-8 space-y-8 max-w-[1600px] mx-auto w-full">

            {/* Top Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {/* 1. Total Balance Card (Main Green) */}
               <div className="bg-[#048848] text-white p-6 rounded-[24px] relative overflow-hidden shadow-lg shadow-green-900/10">
                  <div className="relative z-10 flex flex-col justify-between h-full min-h-[140px]">
                     <div className="flex justify-between items-start">
                        <div className="size-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                           <span className="material-symbols-outlined text-white text-xl">account_balance_wallet</span>
                        </div>
                        <span className="material-symbols-outlined text-white/40">more_horiz</span>
                     </div>
                     <div>
                        <p className="text-sm font-medium opacity-80 mb-1">Total Sales Balance</p>
                        <div className="flex items-baseline gap-3">
                           <h2 className="text-3xl font-black">{formatCurrency(stats.sales)}</h2>
                           <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-bold">
                              {timeRange === 'DAY' ? 'Today' : 'Total'}
                           </span>
                        </div>
                     </div>
                  </div>
                  {/* Decorative circles */}
                  <div className="absolute -top-10 -right-10 size-40 bg-white/5 rounded-full blur-2xl"></div>
                  <div className="absolute bottom-0 right-10 size-20 bg-emerald-400/20 rounded-full blur-xl"></div>
               </div>

               {/* 2. Active Orders (White/Surface) */}
               <div className="bg-white dark:bg-surface-dark p-6 rounded-[24px] border border-gray-100 dark:border-white/5 shadow-sm">
                  <div className="flex flex-col justify-between h-full min-h-[140px]">
                     <div className="flex justify-between items-start">
                        <div className="size-10 bg-[#F4F6F8] dark:bg-white/5 rounded-xl flex items-center justify-center text-secondary dark:text-white">
                           <span className="material-symbols-outlined text-xl">shopping_bag</span>
                        </div>
                        <span className="material-symbols-outlined text-gray-300">more_horiz</span>
                     </div>
                     <div>
                        <p className="text-sm font-medium text-gray-400 mb-1">Active Orders</p>
                        <div className="flex items-baseline gap-3">
                           <h2 className="text-3xl font-black text-secondary dark:text-white">{stats.activeOrders}</h2>
                           <span className="bg-green-50 text-green-600 px-2 py-0.5 rounded-full text-[10px] font-bold">
                              {timeRange === 'MONTH' ? 'This Month' : 'Selected Period'}
                           </span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-2 font-medium">
                           <span className="text-[#048848] font-bold">{stats.pendingShipment}</span> pending shipment
                        </p>
                     </div>
                  </div>
               </div>

               {/* 3. Product Inventory (White/Surface) */}
               <div className="bg-white dark:bg-surface-dark p-6 rounded-[24px] border border-gray-100 dark:border-white/5 shadow-sm">
                  <div className="flex flex-col justify-between h-full min-h-[140px]">
                     <div className="flex justify-between items-start">
                        <div className="size-10 bg-[#fff5eb] text-orange-600 rounded-xl flex items-center justify-center">
                           <span className="material-symbols-outlined text-xl">inventory_2</span>
                        </div>
                        <span className="material-symbols-outlined text-gray-300">more_horiz</span>
                     </div>
                     <div>
                        <p className="text-sm font-medium text-gray-400 mb-1">Active Products</p>
                        <div className="flex items-baseline gap-3">
                           <h2 className="text-3xl font-black text-secondary dark:text-white">{stats.activeProducts}</h2>
                           <span className="bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full text-[10px] font-bold">Catalog</span>
                        </div>
                        <div className="mt-2 w-full bg-gray-100 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
                           <div className="h-full bg-orange-400 w-3/4 rounded-full"></div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Quick Actions (Simplified Bar) */}
            <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-2">
               <button onClick={() => navigate('/vendor/management')} className="flex items-center gap-2 bg-secondary text-white pl-4 pr-6 py-3 rounded-xl hover:opacity-90 transition-opacity active:scale-95 shrink-0">
                  <span className="material-symbols-outlined text-lg">add_circle</span>
                  <span className="text-xs font-bold uppercase tracking-wide">Add Product</span>
               </button>

               <QuickActionPill icon="upload_file" label="Import CSV" onClick={() => navigate('/vendor/import')} />
               <QuickActionPill icon="inventory" label="Inventory" onClick={() => navigate('/vendor/inventory')} />
               <QuickActionPill icon="bar_chart" label="Full Analytics" onClick={() => navigate('/vendor/analytics')} />
               <QuickActionPill icon="shopping_cart_off" label="Lost Leads" onClick={() => setActiveTab('LEADS')} active={activeTab === 'LEADS'} />
            </div>

            {/* Main Content Area: Recent Orders & Leads */}
            <div className="bg-white dark:bg-surface-dark rounded-[24px] border border-gray-100 dark:border-white/5 p-6 shadow-sm">

               {activeTab === 'LEADS' ? (
                  <div>
                     <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-black text-secondary dark:text-white">Recover Leads</h3>
                        <button onClick={() => setActiveTab('DASHBOARD')} className="text-xs font-bold text-gray-400 hover:text-primary">Back to Dashboard</button>
                     </div>
                     <AdminAbandonmentReport />
                  </div>
               ) : (
                  <>
                     <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-black text-secondary dark:text-white">Recent Activities</h3>
                        <div className="flex items-center gap-3">
                           <div className="relative">
                              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">search</span>
                              <input type="text" placeholder="Search orders..." className="pl-9 pr-4 py-2 bg-gray-50 dark:bg-white/5 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary w-48 transition-all" />
                           </div>
                           <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 dark:border-white/10 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                              <span className="material-symbols-outlined text-sm">filter_list</span>
                              Filter
                           </button>
                        </div>
                     </div>

                     <div className="overflow-x-auto">
                        <table className="w-full">
                           <thead>
                              <tr className="text-left border-b border-gray-100 dark:border-white/5">
                                 <th className="pb-3 pl-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider w-[40px]"></th>
                                 <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Product / Activity</th>
                                 <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Order ID</th>
                                 <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Date</th>
                                 <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Price</th>
                                 <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                 <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Action</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                              {recentOrders.length === 0 ? (
                                 <tr>
                                    <td colSpan={7} className="py-8 text-center text-xs text-gray-400">No recent activity {timeRange !== 'MONTH' ? `for ${getRangeLabel()}` : ''}.</td>
                                 </tr>
                              ) : (
                                 recentOrders.map((order, i) => (
                                    <tr key={i} className="group hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                       <td className="py-4 pl-2">
                                          <div className="size-10 rounded-lg bg-gray-100 shrink-0 overflow-hidden">
                                             <img src={order.items?.[0]?.image || "https://placehold.co/100"} className="size-full object-cover" alt="" />
                                          </div>
                                       </td>
                                       <td className="py-4 pr-4">
                                          <p className="text-xs font-bold text-secondary dark:text-white truncate max-w-[180px]">{order.items?.[0]?.name}</p>
                                          <p className="text-[10px] text-gray-400">{order.items?.length || 1} items</p>
                                       </td>
                                       <td className="py-4 text-xs font-medium text-gray-500">#{order.id.slice(0, 8).toUpperCase()}</td>
                                       <td className="py-4 text-xs font-medium text-gray-500">
                                          {new Date(order.createdAt?.seconds * 1000).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                       </td>
                                       <td className="py-4 text-xs font-bold text-secondary dark:text-white">
                                          {formatCurrency(Number(order.total) || Number(order.totalAmount) || 0)}
                                       </td>
                                       <td className="py-4">
                                          <StatusBadge status={order.status} />
                                       </td>
                                       <td className="py-4">
                                          <button className="text-gray-400 hover:text-primary transition-colors">
                                             <span className="material-symbols-outlined">more_horiz</span>
                                          </button>
                                       </td>
                                    </tr>
                                 ))
                              )}
                           </tbody>
                        </table>
                     </div>
                  </>
               )}
            </div>
         </div>
      </div>
   );
};

// UI Components
const QuickActionPill: React.FC<{ icon: string; label: string; onClick: () => void; active?: boolean }> = ({ icon, label, onClick, active }) => (
   <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all active:scale-95 shrink-0 ${active
         ? 'bg-secondary text-white border-secondary'
         : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:border-gray-300'}`}
   >
      <span className="material-symbols-outlined text-lg">{icon}</span>
      <span className="text-xs font-bold whitespace-nowrap">{label}</span>
   </button>
);

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
   let color = 'bg-gray-100 text-gray-600';
   if (status === 'PENDING') color = 'bg-yellow-50 text-yellow-600';
   if (['COMPLETED', 'DELIVERED'].includes(status)) color = 'bg-green-50 text-green-600';
   if (status === 'CANCELLED') color = 'bg-red-50 text-red-600';

   return (
      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full w-fit ${color}`}>
         <div className="size-1.5 rounded-full bg-current"></div>
         <span className="text-[10px] font-bold uppercase tracking-wide">{status}</span>
      </div>
   );
};

export default VendorDashboard;
