
import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'react-hot-toast';
import DashboardHeader from '../components/DashboardHeader';

interface ShippingZone {
    id: string;
    name: string;
    type: 'FIXED' | 'DISTANCE';
    baseFee: number;
    ratePerKm?: number;
    isActive: boolean;
}

const AdminLogisticsSettings: React.FC = () => {
    const [zones, setZones] = useState<ShippingZone[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingZone, setEditingZone] = useState<ShippingZone | null>(null);

    // Form State
    const [name, setName] = useState('');
    const [type, setType] = useState<'FIXED' | 'DISTANCE'>('FIXED');
    const [baseFee, setBaseFee] = useState('');
    const [ratePerKm, setRatePerKm] = useState('');

    useEffect(() => {
        fetchZones();
    }, []);

    const fetchZones = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "shipping_zones"));
            const list = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ShippingZone));
            // Sort: Active first, then by name
            list.sort((a, b) => (a.isActive === b.isActive ? 0 : a.isActive ? -1 : 1));
            setZones(list);
        } catch (error) {
            console.error("Error fetching zones", error);
            toast.error("Failed to load shipping zones");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (zone?: ShippingZone) => {
        if (zone) {
            setEditingZone(zone);
            setName(zone.name);
            setType(zone.type);
            setBaseFee(zone.baseFee.toString());
            setRatePerKm(zone.ratePerKm?.toString() || '');
        } else {
            setEditingZone(null);
            setName('');
            setType('FIXED');
            setBaseFee('');
            setRatePerKm('');
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !baseFee) {
            toast.error("Please fill in required fields");
            return;
        }

        const data = {
            name,
            type,
            baseFee: parseFloat(baseFee),
            ratePerKm: type === 'DISTANCE' ? parseFloat(ratePerKm) || 0 : 0,
            isActive: true,
            updatedAt: serverTimestamp()
        };

        try {
            if (editingZone) {
                await updateDoc(doc(db, "shipping_zones", editingZone.id), data);
                toast.success("Zone updated");
            } else {
                await addDoc(collection(db, "shipping_zones"), {
                    ...data,
                    createdAt: serverTimestamp()
                });
                toast.success("Zone created");
            }
            setIsModalOpen(false);
            fetchZones();
        } catch (error) {
            console.error(error);
            toast.error("Failed to save zone");
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this zone?")) return;
        try {
            await deleteDoc(doc(db, "shipping_zones", id));
            toast.success("Zone deleted");
            fetchZones();
        } catch (error) {
            toast.error("Failed to delete zone");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black">
            <DashboardHeader />
            <div className="max-w-7xl mx-auto px-6 py-8 pt-24">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-black text-secondary dark:text-white uppercase tracking-tight">Logistics Configuration</h1>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Manage Delivery Zones & Shipping Fees</p>
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="bg-primary hover:bg-primary/90 text-secondary font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-primary/20"
                    >
                        <span className="material-symbols-outlined">add_location_alt</span>
                        <span className="uppercase text-xs tracking-widest">Add Zone</span>
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20"><span className="loader"></span></div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {zones.map((zone) => (
                            <div key={zone.id} className="bg-white dark:bg-surface-dark border border-gray-100 dark:border-white/5 rounded-2xl p-6 group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                    <button onClick={() => handleOpenModal(zone)} className="size-8 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center hover:bg-primary hover:text-secondary text-gray-500 transition-colors">
                                        <span className="material-symbols-outlined text-[18px]">edit</span>
                                    </button>
                                    <button onClick={() => handleDelete(zone.id)} className="size-8 rounded-lg bg-red-50 flex items-center justify-center hover:bg-red-500 hover:text-white text-red-500 transition-colors">
                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                    </button>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                        <span className="material-symbols-outlined text-[24px]">
                                            {zone.type === 'DISTANCE' ? 'route' : 'location_city'}
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-secondary dark:text-white uppercase leading-none">{zone.name}</h3>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider border ${zone.type === 'DISTANCE' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                                                {zone.type === 'DISTANCE' ? 'Dynamic' : 'Fixed Rate'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 space-y-3">
                                    <div className="flex justify-between items-center text-sm border-b border-gray-50 dark:border-white/5 pb-2">
                                        <span className="text-gray-400 font-medium">Base Fee</span>
                                        <span className="font-black text-secondary dark:text-white">${zone.baseFee.toFixed(2)}</span>
                                    </div>
                                    {zone.type === 'DISTANCE' && (
                                        <div className="flex justify-between items-center text-sm border-b border-gray-50 dark:border-white/5 pb-2">
                                            <span className="text-gray-400 font-medium">Rate / KM</span>
                                            <span className="font-black text-secondary dark:text-white">${zone.ratePerKm?.toFixed(2)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-secondary/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <div className="bg-white dark:bg-surface-dark w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 dark:border-white/5 flex justify-between items-center">
                            <h3 className="text-lg font-black text-secondary dark:text-white uppercase">
                                {editingZone ? 'Edit Zone' : 'New Shipping Zone'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)}><span className="material-symbols-outlined text-gray-400">close</span></button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-5">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Zone Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="e.g. Hargeisa Market"
                                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 font-bold outline-none focus:border-primary transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Fee Structure</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setType('FIXED')}
                                        className={`px-4 py-3 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs uppercase ${type === 'FIXED' ? 'bg-primary text-secondary border-primary' : 'bg-transparent border-gray-200 text-gray-400'}`}
                                    >
                                        <span className="material-symbols-outlined">payments</span> Fixed
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setType('DISTANCE')}
                                        className={`px-4 py-3 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs uppercase ${type === 'DISTANCE' ? 'bg-primary text-secondary border-primary' : 'bg-transparent border-gray-200 text-gray-400'}`}
                                    >
                                        <span className="material-symbols-outlined">route</span> Per KM
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Base Fee ($)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={baseFee}
                                        onChange={e => setBaseFee(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 font-bold outline-none focus:border-primary transition-colors"
                                    />
                                </div>
                                {type === 'DISTANCE' && (
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Per KM ($)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={ratePerKm}
                                            onChange={e => setRatePerKm(e.target.value)}
                                            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 font-bold outline-none focus:border-primary transition-colors"
                                        />
                                    </div>
                                )}
                            </div>

                            <button type="submit" className="w-full bg-secondary dark:bg-white dark:text-secondary text-primary font-black uppercase tracking-widest py-4 rounded-xl hover:opacity-90 transition-opacity mt-4">
                                Save Configuration
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminLogisticsSettings;
