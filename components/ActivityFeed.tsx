import React, { useEffect, useState } from 'react';
import { useAuth } from '../Providers';
import { api } from '../src/services/api';

interface EventLog {
    id: string;
    type: string;
    metadata: any;
    createdAt: { _seconds: number, _nanoseconds: number };
    relatedEntityId?: string;
}

const ActivityFeed: React.FC = () => {
    const { user } = useAuth();
    const [events, setEvents] = useState<EventLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const fetchEvents = async () => {
            try {
                const res = await api.get('/events?limit=10');
                setEvents(res.data);
            } catch (err) {
                console.error("Failed to fetch activity:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, [user]);

    const getIconAndColor = (type: string) => {
        switch (type) {
            case 'ORDER_PLACED': return { icon: 'shopping_bag', color: 'bg-green-100 text-green-600' };
            case 'LIVE_JOINED': return { icon: 'live_tv', color: 'bg-red-100 text-red-600' };
            case 'REVIEW_ADDED': return { icon: 'rate_review', color: 'bg-yellow-100 text-yellow-600' };
            default: return { icon: 'notifications', color: 'bg-gray-100 text-gray-600' };
        }
    };

    const formatMessage = (e: EventLog) => {
        switch (e.type) {
            case 'ORDER_PLACED': return `Placed Order #${e.metadata?.orderNumber}`;
            case 'LIVE_JOINED': return `Joined a Live Session`;
            default: return e.type.replace('_', ' ');
        }
    };

    if (loading) return <div className="h-20 animate-pulse bg-gray-50 rounded-xl"></div>;
    if (events.length === 0) return null; // Hide if empty

    return (
        <div className="bg-white dark:bg-surface-dark rounded-3xl p-6 border border-gray-100 dark:border-white/5 shadow-sm">
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-6">Recent Activity</h3>
            <div className="relative border-l-2 border-gray-100 dark:border-white/10 ml-3 space-y-8">
                {events.map((e, idx) => {
                    const { icon, color } = getIconAndColor(e.type);
                    return (
                        <div key={e.id} className="relative pl-8">
                            <span className={`absolute -left-[17px] top-0 size-8 rounded-full border-4 border-white dark:border-surface-dark flex items-center justify-center ${color}`}>
                                <span className="material-symbols-outlined text-[14px] font-bold">{icon}</span>
                            </span>
                            <div className="flex flex-col">
                                <span className="text-xs font-black text-secondary dark:text-white uppercase tracking-tight">
                                    {formatMessage(e)}
                                </span>
                                <span className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wider">
                                    {new Date(e.createdAt._seconds * 1000).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ActivityFeed;
