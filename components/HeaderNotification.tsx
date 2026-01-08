
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, orderBy, doc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../Providers';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'ORDER' | 'SYSTEM' | 'ALERT';
    read: boolean;
    link?: string;
    createdAt: any;
}

const HeaderNotification: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Sound Effect (Simple Chime)
    useEffect(() => {
        audioRef.current = new Audio("data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU..."); // Placeholder for shortness, essentially a beep
        // In a real app, use a real URL or complete base64
    }, []);

    // Notification Listener
    useEffect(() => {
        if (!user?.uid) return;

        // Request Web Push Permission
        if ("Notification" in window && Notification.permission !== "granted") {
            Notification.requestPermission();
        }

        const q = query(collection(db, "notifications"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
        const unsub = onSnapshot(q, (snap) => {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Notification));
            setNotifications(list);

            const unreadCount = list.filter(n => !n.read).length;
            if (unreadCount > 0 && !hasUnread) {
                // Play sound only on new unread state
                audioRef.current?.play().catch(error => {
                    // Ignore NotAllowedError (autoplay policy)
                    console.log("Audio autoplay prevented:", error);
                });

                // Trigger System Notification
                if ("Notification" in window && Notification.permission === "granted") {
                    new Notification("Fudaydiye System Event", { body: "You have new tasks requiring attention." });
                }
            }
            setHasUnread(unreadCount > 0);
        });
        return () => unsub();
    }, [user, hasUnread]);

    const handleClearNotifications = async () => {
        const batch = writeBatch(db);
        notifications.forEach(n => {
            batch.delete(doc(db, "notifications", n.id));
        });
        await batch.commit();
    };

    return (
        <div className="relative">
            <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative text-gray-400 size-10 rounded-full flex items-center justify-center transition-all ${hasUnread ? 'bg-red-50 text-red-500 animate-wiggle' : 'bg-gray-50 dark:bg-white/5'}`}
            >
                <span className={`material-symbols-outlined ${hasUnread ? 'filled' : ''}`}>notifications</span>
                {hasUnread && <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border border-white"></span>}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
                <div className="absolute top-12 right-0 w-80 bg-white dark:bg-surface-dark rounded-2xl shadow-xl border border-gray-100 dark:border-white/5 p-4 z-50 animate-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-black text-secondary dark:text-white uppercase tracking-wider">System Events</h4>
                        <button onClick={handleClearNotifications} className="text-[10px] font-bold text-red-500 hover:underline">Clear All</button>
                    </div>
                    <div className="max-h-64 overflow-y-auto space-y-2 no-scrollbar">
                        {notifications.length === 0 ? (
                            <p className="text-[10px] text-gray-400 text-center py-4">No new system events.</p>
                        ) : (
                            notifications.map(n => (
                                <div
                                    key={n.id}
                                    onClick={() => {
                                        if (n.link) navigate(n.link);
                                        setShowNotifications(false);
                                    }}
                                    className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer group"
                                >
                                    <div className="flex justify-between items-start">
                                        <span className="text-[10px] font-black text-secondary dark:text-white uppercase">{n.title}</span>
                                        <span className="text-[8px] text-gray-400">{new Date(n.createdAt?.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight mt-1 group-hover:text-primary transition-colors">{n.message}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default HeaderNotification;
