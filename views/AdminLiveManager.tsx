import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { LiveSaleSession } from '../types';

import StatusModal from '../components/StatusModal';

const AdminLiveManager: React.FC = () => {
    const [sessions, setSessions] = useState<LiveSaleSession[]>([]);

    // Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [modalConfig, setModalConfig] = useState({ title: '', message: '', type: 'SUCCESS' as 'SUCCESS' | 'ERROR' });

    const showModal = (title: string, message: string, type: 'SUCCESS' | 'ERROR' = 'SUCCESS') => {
        setModalConfig({ title, message, type });
        setModalOpen(true);
    };

    useEffect(() => {
        let unsub = () => { };
        try {
            const q = query(collection(db, "live_sessions"), where("status", "==", "LIVE"));
            unsub = onSnapshot(q, (snap) => {
                setSessions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as LiveSaleSession)));
            }, (error: any) => {
                console.error("Live Manager Fetch Error:", error);
                // Fallback valid state
                setSessions([]);
            });
        } catch (e) {
            console.error("Live Manager setup error", e);
        }
        return () => unsub();
    }, []);

    const handleFeatureSession = async (sessionId: string) => {
        // Unfeature others first (optional, but good for single featured item)
        // For simplicity, we just set this one to featured. 
        // Ideally we should run a batch to set all others isFeatured=false

        try {
            const batch = writeBatch(db);
            const allLive = await getDocs(query(collection(db, "live_sessions"), where("status", "==", "LIVE")));

            allLive.docs.forEach(d => {
                if (d.id === sessionId) {
                    batch.update(d.ref, { isFeatured: true });
                } else {
                    batch.update(d.ref, { isFeatured: false });
                }
            });

            await batch.commit();
            showModal('Feature Sync Complete', 'Session is now featured on homepage.');
        } catch (e) {
            console.error(e);
            showModal('Sync Failed', 'Could not update featured session.', 'ERROR');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            <StatusModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
            />

            <div>
                <h2 className="text-2xl font-black text-secondary dark:text-white">Live Operations</h2>
                <p className="text-xs text-gray-400 mt-1">Manage active broadcasts and feature sessions</p>
            </div>

            <div className="bg-white dark:bg-white/5 rounded-[32px] p-6 border border-gray-100 dark:border-white/5">
                <h3 className="font-black text-secondary dark:text-white mb-4 uppercase tracking-wider text-sm">Active Sessions ({sessions.length})</h3>

                <div className="space-y-4">
                    {sessions.length === 0 ? <p className="text-sm text-gray-400">No active live sessions.</p> : sessions.map(session => (
                        <div key={session.id} className="flex items-center justify-between bg-gray-50 dark:bg-black/20 p-4 rounded-2xl border border-gray-100 dark:border-white/5">
                            <div className="flex items-center gap-4">
                                <img src={session.featuredProductImg || "https://picsum.photos/100"} className="size-16 rounded-xl object-cover" alt="" />
                                <div>
                                    <h4 className="font-black text-secondary dark:text-white">{session.title}</h4>
                                    <p className="text-xs text-gray-400">{session.vendorName} • {session.viewerCount} Viewers</p>
                                    {session.isFeatured && <span className="bg-primary text-secondary text-[8px] font-black px-2 py-0.5 rounded uppercase mt-1 inline-block">Featured on Home</span>}
                                </div>
                            </div>
                            <button
                                onClick={() => handleFeatureSession(session.id)}
                                disabled={session.isFeatured}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${session.isFeatured ? 'bg-green-100 text-green-600 opacity-50 cursor-default' : 'bg-secondary text-white hover:scale-105'}`}
                            >
                                {session.isFeatured ? 'Currently Featured' : 'Feature This'}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AdminLiveManager;
