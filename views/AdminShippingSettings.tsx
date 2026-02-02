
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'react-hot-toast';

interface ShippingRegion {
    id: string;
    name: string;
    fee: number;
    deliveryDays: string;
    isActive: boolean;
}

const AdminShippingSettings: React.FC = () => {
    const navigate = useNavigate();
    const [regions, setRegions] = useState<ShippingRegion[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRegion, setEditingRegion] = useState<ShippingRegion | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        fee: '',
        deliveryDays: '',
        isActive: true
    });

    const fetchRegions = async () => {
        try {
            setLoading(true);
            const querySnapshot = await getDocs(collection(db, 'shipping_zones'));
            const list = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() })) as ShippingRegion[];
            setRegions(list);
        } catch (error) {
            console.error("Error fetching regions:", error);
            toast.error("Failed to load shipping regions");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRegions();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.fee) return;

        try {
            const payload = {
                name: formData.name,
                fee: parseFloat(formData.fee),
                deliveryDays: formData.deliveryDays,
                isActive: formData.isActive,
                updatedAt: serverTimestamp()
            };

            if (editingRegion) {
                await updateDoc(doc(db, 'shipping_zones', editingRegion.id), payload);
                toast.success("Region updated");
            } else {
                await addDoc(collection(db, 'shipping_zones'), {
                    ...payload,
                    createdAt: serverTimestamp()
                });
                toast.success("Region added");
            }
            setIsModalOpen(false);
            resetForm();
            fetchRegions();
        } catch (error) {
            console.error("Error saving region:", error);
            toast.error("Failed to save region");
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this shipping region?")) return;
        try {
            await deleteDoc(doc(db, 'shipping_zones', id));
            toast.success("Region deleted");
            fetchRegions();
        } catch (error) {
            toast.error("Failed to delete region");
        }
    };

    const resetForm = () => {
        setEditingRegion(null);
        setFormData({ name: '', fee: '', deliveryDays: '', isActive: true });
    };

    const openEdit = (region: ShippingRegion) => {
        setEditingRegion(region);
        setFormData({
            name: region.name,
            fee: region.fee.toString(),
            deliveryDays: region.deliveryDays || '',
            isActive: region.isActive
        });
        setIsModalOpen(true);
    };

    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-300">
            <header className="sticky top-0 z-50 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/5 active:scale-90 transition-all">
                        <span className="material-symbols-outlined text-secondary dark:text-white">arrow_back</span>
                    </button>
                    <div className="flex flex-col">
                        <h1 className="text-xl font-black text-secondary dark:text-white tracking-tighter leading-none">Shipping & Logistics</h1>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">Global Delivery Fees</p>
                    </div>
                </div>
                <button
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="px-6 h-10 bg-primary text-secondary font-black text-[10px] uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-primary-glow flex items-center gap-2"
                >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    New Region
                </button>
            </header>

            <main className="p-6 md:p-10 max-w-7xl mx-auto w-full">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="size-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    </div>
                ) : regions.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="size-24 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="material-symbols-outlined text-4xl text-gray-300">local_shipping</span>
                        </div>
                        <h3 className="text-lg font-black text-secondary dark:text-white">No Shipping Regions</h3>
                        <p className="text-xs text-gray-400 mt-2">Define delivery zones and fees to enable checkout.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {regions.map((region) => (
                            <div key={region.id} className="bg-white dark:bg-surface-dark p-6 rounded-[32px] shadow-soft border border-gray-100 dark:border-white/5 group hover:border-primary/30 transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="size-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                                        <span className="material-symbols-outlined">location_on</span>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openEdit(region)} className="size-8 bg-gray-50 dark:bg-white/5 rounded-lg flex items-center justify-center text-secondary dark:text-white hover:bg-gray-200"><span className="material-symbols-outlined text-[16px]">edit</span></button>
                                        <button onClick={() => handleDelete(region.id)} className="size-8 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-100"><span className="material-symbols-outlined text-[16px]">delete</span></button>
                                    </div>
                                </div>
                                <h3 className="text-lg font-black text-secondary dark:text-white uppercase tracking-tight mb-1">{region.name}</h3>
                                <div className="flex items-baseline gap-1 mb-4">
                                    <span className="text-2xl font-black text-primary">${region.fee.toFixed(2)}</span>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">per order</span>
                                </div>
                                <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 p-3 rounded-xl">
                                    <span className="material-symbols-outlined text-gray-400 text-[18px]">schedule</span>
                                    <span className="text-xs font-bold text-secondary dark:text-white">{region.deliveryDays || '1-2 Days'}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-secondary/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <div className="relative bg-white dark:bg-surface-dark w-full max-w-md p-8 rounded-[40px] shadow-2xl border border-gray-100 dark:border-white/5 animate-in zoom-in-95">
                        <h2 className="text-2xl font-black text-secondary dark:text-white uppercase tracking-tighter mb-6">
                            {editingRegion ? 'Edit Region' : 'New Shipping Zone'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Region Name</label>
                                <input
                                    autoFocus
                                    required
                                    placeholder="e.g. Hargeisa, Borama"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full h-14 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl px-5 font-bold focus:border-primary outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Shipping Fee ($)</label>
                                <input
                                    required
                                    type="number"
                                    step="0.01"
                                    placeholder="5.00"
                                    value={formData.fee}
                                    onChange={e => setFormData({ ...formData, fee: e.target.value })}
                                    className="w-full h-14 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl px-5 font-bold focus:border-primary outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Est. Delivery Time</label>
                                <input
                                    placeholder="e.g. 24 Hours, 2-3 Days"
                                    value={formData.deliveryDays}
                                    onChange={e => setFormData({ ...formData, deliveryDays: e.target.value })}
                                    className="w-full h-14 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl px-5 font-bold focus:border-primary outline-none transition-all"
                                />
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 h-14 bg-gray-100 dark:bg-white/5 text-gray-500 font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-gray-200 transition-colors">Cancel</button>
                                <button type="submit" className="flex-1 h-14 bg-primary text-secondary font-black uppercase text-xs tracking-widest rounded-2xl shadow-primary-glow hover:scale-105 active:scale-95 transition-all">
                                    {editingRegion ? 'Save Changes' : 'Create Zone'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminShippingSettings;
