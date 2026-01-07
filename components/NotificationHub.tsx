
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AppNotification } from '../types';

interface NotificationHubProps {
   userId: string;
   isOpen: boolean;
   onClose: () => void;
}

const NotificationHub: React.FC<NotificationHubProps> = ({ userId, isOpen, onClose }) => {
   const navigate = useNavigate();
   const [notifications, setNotifications] = useState<AppNotification[]>([]);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      if (!userId || !isOpen) return;

      // Use query without orderBy to avoid index requirement
      const q = query(
         collection(db, "notifications"),
         where("userId", "==", userId),
         limit(20)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
         const fetched = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AppNotification));
         // Manual client-side sort
         fetched.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
         setNotifications(fetched);
         setLoading(false);
      });

      return () => unsubscribe();
   }, [userId, isOpen]);

   const handleNotificationClick = async (notif: AppNotification) => {
      try {
         await updateDoc(doc(db, "notifications", notif.id), { isRead: true });
         if (notif.link) {
            navigate(notif.link);
            onClose();
         }
      } catch (err) { console.error(err); }
   };

   if (!isOpen) return null;

   return (
      <div className="fixed inset-x-4 top-24 mx-auto w-auto max-w-[380px] md:inset-auto md:absolute md:top-full md:right-0 md:mt-4 md:w-[380px] bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-[200]">
         <header className="p-6 border-b border-gray-50 dark:border-white/5 flex items-center justify-between bg-gray-50/50 dark:bg-white/2">
            <div className="flex items-center gap-3">
               <div className="size-9 rounded-xl bg-primary flex items-center justify-center text-secondary shadow-lg">
                  <span className="material-symbols-outlined font-black text-xl">notifications_active</span>
               </div>
               <h3 className="text-sm font-black text-secondary dark:text-white uppercase tracking-tighter">System Events</h3>
            </div>
            <button onClick={onClose} className="size-8 rounded-full bg-white dark:bg-white/5 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
               <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
         </header>

         <div className="max-h-[480px] overflow-y-auto no-scrollbar py-2">
            {loading ? (
               <div className="p-20 flex justify-center"><div className="size-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div></div>
            ) : notifications.length === 0 ? (
               <div className="p-20 text-center opacity-30">
                  <span className="material-symbols-outlined text-4xl mb-4">notifications_off</span>
                  <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">No active event nodes found</p>
               </div>
            ) : (
               <div className="divide-y divide-gray-50 dark:divide-white/2">
                  {notifications.map(notif => (
                     <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-5 flex gap-4 transition-colors cursor-pointer group ${!notif.isRead ? 'bg-primary/5' : 'hover:bg-gray-50 dark:hover:bg-white/2'}`}
                     >
                        <div className={`size-10 rounded-xl shrink-0 flex items-center justify-center shadow-sm ${notif.type === 'FINANCE' ? 'bg-amber-100 text-amber-600' :
                              notif.type === 'ORDER' ? 'bg-blue-100 text-blue-600' :
                                 'bg-primary/20 text-primary'
                           }`}>
                           <span className="material-symbols-outlined text-[20px]">
                              {notif.type === 'FINANCE' ? 'wallet' : notif.type === 'ORDER' ? 'package_2' : 'hub'}
                           </span>
                        </div>
                        <div className="flex-1 min-w-0">
                           <div className="flex justify-between items-start mb-1">
                              <h4 className={`text-xs font-black uppercase tracking-tight truncate ${!notif.isRead ? 'text-secondary dark:text-white' : 'text-gray-400'}`}>{notif.title}</h4>
                              {!notif.isRead && <span className="size-1.5 rounded-full bg-primary animate-pulse"></span>}
                           </div>
                           <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">{notif.message}</p>
                           <div className="flex items-center justify-between mt-2">
                              <p className="text-[8px] font-bold text-gray-300 uppercase tracking-widest">Action Required</p>
                              <span className="material-symbols-outlined text-gray-300 text-xs group-hover:text-primary group-hover:translate-x-1 transition-all">arrow_forward</span>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            )}
         </div>

         <footer className="p-4 bg-gray-50/50 dark:bg-white/2 border-t border-gray-50 dark:border-white/5">
            <button className="w-full h-11 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-primary transition-colors">Clear All Events</button>
         </footer>
      </div>
   );
};

export default NotificationHub;
