
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { useAuth } from '../Providers';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Store } from '../types';

const VendorStoreManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStoreId, setEditingStoreId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formStore, setFormStore] = useState({
    name: '',
    location: '',
    manager: '',
    status: 'ONLINE' as Store['status'],
    lat: 9.5624,
    lng: 44.0770
  });

  useEffect(() => {
    let active = true;

    const fetchStores = async () => {
      if (!user) return;
      try {
        const q = query(collection(db, "stores"), where("vendorId", "==", user.uid));
        const snapshot = await getDocs(q);
        if (active) {
          setStores(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Store)));
          setLoading(false);
        }
      } catch (err) {
        console.error("Store fetch error:", err);
        if (active) setLoading(false);
      }
    };

    fetchStores();
    return () => { active = false; };
  }, [user]);

  const handleOpenAddModal = () => {
    setEditingStoreId(null);
    setFormStore({ name: '', location: '', manager: '', status: 'ONLINE', lat: 9.5624, lng: 44.0770 });
    setShowModal(true);
  };

  const handleOpenEditModal = (store: Store) => {
    setEditingStoreId(store.id);
    setFormStore({
      name: store.name,
      location: store.location,
      manager: store.manager,
      status: store.status,
      lat: store.lat,
      lng: store.lng
    });
    setShowModal(true);
  };

  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    try {
      if (editingStoreId) {
        const storeRef = doc(db, "stores", editingStoreId);
        await updateDoc(storeRef, {
          ...formStore,
          lastActive: "Updated just now",
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, "stores"), {
          ...formStore,
          vendorId: user.uid,
          revenue: "$0",
          lastActive: "Just now",
          createdAt: serverTimestamp()
        });
      }
      setShowModal(false);
      setFormStore({ name: '', location: '', manager: '', status: 'ONLINE', lat: 9.5624, lng: 44.0770 });
    } catch (err) {
      console.error(err);
      alert("Operational Failure: Could not sync branch node.");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleStatus = async (store: Store) => {
    // Basic toggle between ONLINE and OFFLINE
    const nextStatus = store.status === 'OFFLINE' ? 'ONLINE' : 'OFFLINE';
    try {
      await updateDoc(doc(db, "stores", store.id), {
        status: nextStatus,
        lastActive: "Status toggled"
      });
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusStyle = (status: Store['status']) => {
    switch (status) {
      case 'LIVE': return 'bg-red-500 text-white animate-pulse';
      case 'ONLINE': return 'bg-green-100 text-green-700';
      case 'OFFLINE': return 'bg-gray-100 text-gray-500';
      case 'CLOSED': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-500';
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-300 font-display">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/5 active:scale-90 transition-all">
            <span className="material-symbols-outlined text-secondary dark:text-white">arrow_back</span>
          </button>
          <div className="flex flex-col">
            <h1 className="text-xl font-black text-secondary dark:text-primary tracking-tighter leading-none uppercase">Store Network</h1>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">Global Command Hub</p>
          </div>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="size-10 rounded-full bg-primary text-secondary flex items-center justify-center shadow-primary-glow active:scale-90 transition-all"
        >
          <span className="material-symbols-outlined font-black">add_business</span>
        </button>
      </header>

      <main className="p-6 flex-1 flex flex-col gap-6 overflow-y-auto pb-32 no-scrollbar animate-in fade-in duration-500">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-secondary text-white p-5 rounded-[28px] shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 size-20 bg-primary/20 blur-2xl rounded-full"></div>
            <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-1">Total Branches</p>
            <p className="text-2xl font-black">{stores.length}</p>
          </div>
          <div className="bg-white dark:bg-surface-dark p-5 rounded-[28px] border border-gray-100 dark:border-gray-800 shadow-soft">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Live Terminals</p>
            <p className="text-2xl font-black text-primary">{stores.filter(s => s.status === 'LIVE' || s.status === 'ONLINE').length}</p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Managed Branches</h3>

          {loading ? (
            <div className="py-20 flex justify-center"><div className="size-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div></div>
          ) : stores.length === 0 ? (
            <div className="py-20 text-center opacity-30">
              <span className="material-symbols-outlined text-5xl block mb-4">store_off</span>
              <p className="text-xs font-black uppercase tracking-widest">No branch nodes configured</p>
            </div>
          ) : (
            stores.map(store => (
              <div key={store.id} className="bg-white dark:bg-surface-dark p-6 rounded-[32px] border border-gray-100 dark:border-white/5 shadow-soft flex flex-col gap-5 group hover:border-primary/30 transition-all">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="size-14 rounded-2xl bg-gray-50 dark:bg-white/5 flex items-center justify-center text-secondary dark:text-primary shadow-inner border border-gray-100 dark:border-white/10">
                      <span className="material-symbols-outlined text-3xl">
                        {store.status === 'LIVE' ? 'live_tv' : store.status === 'CLOSED' ? 'block' : 'store'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-lg font-black text-secondary dark:text-white uppercase tracking-tighter leading-none mb-1 truncate pr-2">{store.name}</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest truncate">{store.location}</span>
                        <span className="size-1 rounded-full bg-gray-200"></span>
                        <span className="text-[9px] font-black text-primary uppercase">GPS LOCKED</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button
                      onClick={() => toggleStatus(store)}
                      className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm transition-colors ${getStatusStyle(store.status)}`}
                    >
                      {store.status}
                    </button>
                    {store.status === 'CLOSED' && <p className="text-[8px] font-bold text-orange-600 uppercase tracking-tighter">Inactive node</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-white/2 p-4 rounded-2xl border border-gray-100 dark:border-white/5">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Node Coordinates</p>
                    <p className="text-[10px] font-black text-secondary dark:text-white tracking-tighter">{store.lat?.toFixed(4)}, {store.lng?.toFixed(4)}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-white/2 p-4 rounded-2xl border border-gray-100 dark:border-white/5">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Branch Manager</p>
                    <p className="text-sm font-black text-secondary dark:text-white truncate">{store.manager || 'Unassigned'}</p>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => navigate('/vendor/management')}
                    className="flex-1 h-12 bg-gray-100 dark:bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-secondary dark:text-white border border-gray-200 dark:border-white/10 active:scale-95 transition-all"
                  >Catalog</button>
                  <button
                    onClick={() => handleOpenEditModal(store)}
                    className="flex-1 h-12 bg-secondary text-primary rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                    Manage
                  </button>
                  <button
                    onClick={() => { if (window.confirm('Terminate branch node from network?')) deleteDoc(doc(db, "stores", store.id)) }}
                    className="size-12 bg-gray-50 dark:bg-white/5 rounded-xl flex items-center justify-center text-red-400 hover:text-red-500 border border-gray-100 dark:border-white/10 active:scale-90 transition-all"
                  >
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowModal(false)}></div>
          <div className="relative bg-white dark:bg-surface-dark rounded-[40px] p-10 max-w-md w-full shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex flex-col items-center mb-10 text-center">
              <div className="size-16 rounded-[22px] bg-primary/10 flex items-center justify-center text-primary mb-6 border border-primary/20">
                <span className="material-symbols-outlined text-[32px] font-black">
                  {editingStoreId ? 'edit_location' : 'add_business'}
                </span>
              </div>
              <h2 className="text-2xl font-black text-secondary dark:text-white tracking-tighter uppercase leading-none">
                {editingStoreId ? 'Relocate Branch' : 'Add Branch Node'}
              </h2>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-3">
                {editingStoreId ? 'Update identity and geo-coordinates' : 'Expand your merchant footprint'}
              </p>
            </div>

            <form onSubmit={handleSaveStore} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Store Name</label>
                <input required value={formStore.name} onChange={e => setFormStore({ ...formStore, name: e.target.value })} className="w-full h-14 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl px-5 text-sm font-bold focus:border-primary transition-all" placeholder="e.g. Hodan Boutique West" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Physical Neighborhood</label>
                <input required value={formStore.location} onChange={e => setFormStore({ ...formStore, location: e.target.value })} className="w-full h-14 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl px-5 text-sm font-bold focus:border-primary transition-all" placeholder="e.g. Independence Ave, Hargeisa" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Latitude</label>
                  <input type="number" step="any" required value={formStore.lat} onChange={e => setFormStore({ ...formStore, lat: parseFloat(e.target.value) })} className="w-full h-14 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl px-5 text-sm font-bold focus:border-primary transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Longitude</label>
                  <input type="number" step="any" required value={formStore.lng} onChange={e => setFormStore({ ...formStore, lng: parseFloat(e.target.value) })} className="w-full h-14 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl px-5 text-sm font-bold focus:border-primary transition-all" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Primary Manager</label>
                  <input value={formStore.manager} onChange={e => setFormStore({ ...formStore, manager: e.target.value })} className="w-full h-14 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl px-5 text-sm font-bold focus:border-primary transition-all" placeholder="Full name" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Operating Status</label>
                  <select value={formStore.status} onChange={e => setFormStore({ ...formStore, status: e.target.value as Store['status'] })} className="w-full h-14 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl px-5 text-[10px] font-black uppercase focus:border-primary transition-all appearance-none cursor-pointer">
                    <option value="ONLINE">🟢 Online (Open)</option>
                    <option value="OFFLINE">⚪ Offline</option>
                    <option value="CLOSED">🟠 Closed / Maintenance</option>
                    <option value="LIVE">🔴 Live Stream Active</option>
                  </select>
                </div>
              </div>

              <button
                disabled={isSaving}
                type="submit"
                className="w-full h-16 bg-primary text-secondary font-black uppercase text-xs tracking-[0.2em] rounded-2xl shadow-lg shadow-primary/20 active:scale-95 transition-all mt-6 flex items-center justify-center gap-3"
              >
                {isSaving ? <span className="animate-spin material-symbols-outlined">sync</span> : (editingStoreId ? 'Authorize Relocation' : 'Provision Branch Node')}
              </button>
            </form>
          </div>
        </div>
      )}

      <BottomNav items={[
        { label: 'Home', icon: 'grid_view', path: '/vendor' },
        { label: 'Orders', icon: 'receipt_long', path: '/vendor/orders' },
        { label: 'Scan', icon: 'qr_code_scanner', path: '/vendor/scan', special: true },
        { label: 'Network', icon: 'hub', path: '/vendor/stores' },
        { label: 'Stock', icon: 'inventory_2', path: '/vendor/inventory' },
      ]} />
    </div>
  );
};

export default VendorStoreManagement;
