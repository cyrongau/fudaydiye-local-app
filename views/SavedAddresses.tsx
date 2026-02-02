
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../Providers';

interface AddressItem {
  id: string;
  label: string;
  street: string;
  details: string;
  icon: string;
  isDefault: boolean;
  coords: { lat: number; lng: number };
  isAutomatic?: boolean;
}

const SavedAddresses: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [editingAddress, setEditingAddress] = useState<AddressItem | null>(null);
  const [isSyncingGps, setIsSyncingGps] = useState(false);
  const [loading, setLoading] = useState(true);

  const [addresses, setAddresses] = useState<AddressItem[]>([]);

  useEffect(() => {
    const initData = async () => {
      setLoading(true);

      // 1. Fetch API Key
      try {
        const configSnap = await getDoc(doc(db, "system_config", "global"));
        if (configSnap.exists()) {
          setApiKey(configSnap.data()?.integrations?.maps?.apiKey || null);
        }
      } catch (e) {
        console.warn("Config access restricted", e);
      }

      // 2. Mock some initial manual addresses if none exist, 
      // but in production, we would fetch from a 'user_addresses' collection.
      const initialManual: AddressItem[] = [
        {
          id: 'addr-1',
          label: 'Home',
          street: 'Jigjiga Yar, Block 5',
          details: 'Villa 12, near Global Hotel',
          icon: 'home',
          isDefault: true,
          coords: { lat: 9.5624, lng: 44.0770 }
        }
      ];

      // 3. Fetch "Order-Derived" Automatic Locations
      let automaticNodes: AddressItem[] = [];
      if (user) {
        try {
          const q = query(
            collection(db, "orders"),
            where("customerId", "==", user.uid),
            limit(3)
          );
          const orderSnap = await getDocs(q);
          automaticNodes = orderSnap.docs.map(doc => {
            const d = doc.data();
            return {
              id: doc.id,
              label: 'Recent Dispatch Node',
              street: d.shippingAddress?.substring(0, 30) + '...',
              details: `Derived from successful order #${d.orderNumber}`,
              icon: 'history',
              isDefault: false,
              isAutomatic: true,
              coords: d.pickupGeo || { lat: 9.5600, lng: 44.0600 }
            };
          });
        } catch (e) {
          // Permission denied usually happens if user has no access to orders collection
          console.warn("Automatic node derivation skipped:", e);
        }
      }

      setAddresses([...initialManual, ...automaticNodes]);
      setLoading(false);
    };

    initData();
  }, [user]);

  const handleSetDefault = (id: string) => {
    setAddresses(prev => prev.map(a => ({ ...a, isDefault: a.id === id })));
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Remove this address?')) {
      setAddresses(prev => prev.filter(a => a.id !== id));
    }
  };

  const handleSaveEdit = () => {
    if (!editingAddress) return;
    setAddresses(prev => prev.map(a => a.id === editingAddress.id ? editingAddress : a));
    setEditingAddress(null);
  };

  const syncCurrentGps = () => {
    if (!navigator.geolocation) {
      alert("Geolocation node disconnected.");
      return;
    }
    setIsSyncingGps(true);
    navigator.geolocation.getCurrentPosition((pos) => {
      setEditingAddress(prev => prev ? ({
        ...prev,
        coords: { lat: pos.coords.latitude, lng: pos.coords.longitude }
      }) : null);
      setIsSyncingGps(false);
    }, () => {
      alert("Permission denied or link lost.");
      setIsSyncingGps(false);
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-300 font-display">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/5 active:scale-90 transition-all hover:bg-gray-200 dark:hover:bg-white/10">
            <span className="material-symbols-outlined text-secondary dark:text-white">arrow_back</span>
          </button>
          <div className="flex flex-col">
            <h1 className="text-xl font-black text-secondary dark:text-white tracking-tighter leading-none">Saved Locations</h1>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">Delivery Hubs</p>
          </div>
        </div>
        <button className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center active:scale-90 transition-all">
          <span className="material-symbols-outlined font-black">add_location_alt</span>
        </button>
      </header>

      <main className="p-6 flex-1 flex flex-col gap-8 overflow-y-auto pb-40 no-scrollbar animate-in fade-in duration-500">
        {loading ? (
          <div className="py-20 flex justify-center"><div className="size-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div></div>
        ) : (
          <>
            {/* Automatic Nodes */}
            <section className="space-y-4">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] ml-2">Order-Derived Nodes</h3>
              {addresses.filter(a => a.isAutomatic).length === 0 ? (
                <div className="bg-white dark:bg-surface-dark p-6 rounded-[32px] border border-gray-100 dark:border-white/5 text-center opacity-40">
                  <p className="text-[10px] font-black uppercase tracking-widest">Complete orders to see automatic nodes</p>
                </div>
              ) : (
                addresses.filter(a => a.isAutomatic).map(addr => <AddressCard key={addr.id} addr={addr} apiKey={apiKey} onEdit={() => setEditingAddress(addr)} onDelete={() => handleDelete(addr.id)} onSetDefault={() => handleSetDefault(addr.id)} />)
              )}
            </section>

            {/* Manual Nodes */}
            <section className="space-y-4">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] ml-2">User-Defined Nodes</h3>
              {addresses.filter(a => !a.isAutomatic).map(addr => <AddressCard key={addr.id} addr={addr} apiKey={apiKey} onEdit={() => setEditingAddress(addr)} onDelete={() => handleDelete(addr.id)} onSetDefault={() => handleSetDefault(addr.id)} />)}
            </section>
          </>
        )}
      </main>

      {/* Edit Address Modal */}
      {editingAddress && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-secondary/90 backdrop-blur-md" onClick={() => setEditingAddress(null)}></div>
          <div className="relative w-full max-w-lg bg-white dark:bg-surface-dark rounded-[48px] shadow-2xl p-10 overflow-hidden">
            <h2 className="text-2xl font-black text-secondary dark:text-white uppercase tracking-tighter mb-8">Refine Dispatch Node</h2>

            <div className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Place Descriptor</label>
                <input
                  value={editingAddress.label}
                  onChange={e => setEditingAddress({ ...editingAddress, label: e.target.value })}
                  className="w-full h-14 bg-gray-50 dark:bg-white/5 border-2 border-gray-100 dark:border-white/10 rounded-2xl px-5 font-black text-secondary dark:text-white focus:border-primary transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Latitude</label>
                  <input
                    type="number" step="any"
                    value={editingAddress.coords.lat}
                    onChange={e => setEditingAddress({ ...editingAddress, coords: { ...editingAddress.coords, lat: parseFloat(e.target.value) } })}
                    className="w-full h-14 bg-gray-50 dark:bg-white/5 border-2 border-gray-100 dark:border-white/10 rounded-2xl px-5 text-sm font-black text-primary focus:border-primary transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Longitude</label>
                  <input
                    type="number" step="any"
                    value={editingAddress.coords.lng}
                    onChange={e => setEditingAddress({ ...editingAddress, coords: { ...editingAddress.coords, lng: parseFloat(e.target.value) } })}
                    className="w-full h-14 bg-gray-50 dark:bg-white/5 border-2 border-gray-100 dark:border-white/10 rounded-2xl px-5 text-sm font-black text-primary focus:border-primary transition-all"
                  />
                </div>
              </div>

              <button
                onClick={syncCurrentGps}
                disabled={isSyncingGps}
                className="w-full h-12 bg-primary/10 text-primary border border-primary/20 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <span className={`material-symbols-outlined text-[18px] ${isSyncingGps ? 'animate-spin' : ''}`}>my_location</span>
                {isSyncingGps ? 'Pinging Satellites...' : 'Auto-Sync Current GPS'}
              </button>

              <div className="h-32 w-full rounded-3xl bg-gray-100 dark:bg-black/20 overflow-hidden relative border border-gray-100 dark:border-white/10">
                {apiKey && (
                  <img
                    src={`https://maps.googleapis.com/maps/api/staticmap?center=${editingAddress.coords.lat},${editingAddress.coords.lng}&zoom=17&size=400x150&scale=2&maptype=roadmap&markers=color:0x06DC7F%7C${editingAddress.coords.lat},${editingAddress.coords.lng}&key=${apiKey}&style=feature:all%7Celement:geometry%7Ccolor:0x242f3e&style=feature:road%7Celement:geometry%7Ccolor:0x38414e`}
                    className="w-full h-full object-cover"
                    alt="Live Node Preview"
                  />
                )}
                <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                  <span className="text-[8px] font-black text-white bg-black/40 px-2 py-1 rounded uppercase tracking-widest">Live Node Preview</span>
                </div>
              </div>

              <div className="flex gap-3 pt-6">
                <button
                  onClick={() => setEditingAddress(null)}
                  className="flex-1 h-16 bg-gray-100 dark:bg-white/5 text-gray-500 rounded-[24px] font-black text-xs uppercase tracking-widest active:scale-95 transition-all"
                >Discard</button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-[2] h-16 bg-primary text-secondary rounded-[24px] font-black text-sm uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all"
                >Authorize Update</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-background-dark/95 backdrop-blur-md border-t border-gray-100 dark:border-white/5 p-5 pb-10">
        <div className="max-w-lg mx-auto">
          <button className="w-full h-16 bg-secondary text-primary font-black text-sm uppercase tracking-[0.2em] rounded-button shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all">
            <span className="material-symbols-outlined font-black">add</span>
            Provision New Zone
          </button>
        </div>
      </footer>
    </div>
  );
};

const AddressCard: React.FC<{
  addr: AddressItem;
  apiKey: string | null;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
}> = ({ addr, apiKey, onEdit, onDelete, onSetDefault }) => (
  <div
    className={`bg-white dark:bg-surface-dark rounded-[32px] border transition-all overflow-hidden flex flex-col shadow-soft ${addr.isDefault ? 'border-primary shadow-lg ring-1 ring-primary/20' : 'border-gray-100 dark:border-white/5'
      }`}
  >
    <div className="h-44 w-full bg-gray-100 dark:bg-black/20 relative group">
      {apiKey ? (
        <img
          src={`https://maps.googleapis.com/maps/api/staticmap?center=${addr.coords.lat},${addr.coords.lng}&zoom=17&size=600x300&scale=2&maptype=roadmap&markers=color:0x06DC7F%7C${addr.coords.lat},${addr.coords.lng}&key=${apiKey}&style=feature:all%7Celement:geometry%7Ccolor:0x242f3e&style=feature:road%7Celement:geometry%7Ccolor:0x38414e`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          alt="Map Preview"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-50 dark:bg-white/5">
          <span className="material-symbols-outlined text-4xl text-gray-200">map</span>
          <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">Awaiting Maps Node...</p>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
    </div>

    <div className="p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-4">
          <div className={`size-12 rounded-2xl flex items-center justify-center shadow-inner border border-primary/10 ${addr.isDefault ? 'bg-primary text-secondary' : 'bg-gray-50 dark:bg-white/10 text-gray-400'}`}>
            <span className="material-symbols-outlined text-[28px]">{addr.icon}</span>
          </div>
          <div>
            <h4 className="text-lg font-black text-secondary dark:text-white tracking-tighter leading-none mb-1">{addr.label}</h4>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{addr.street}</p>
          </div>
        </div>
        {addr.isDefault && (
          <div className="bg-primary/20 text-primary text-[8px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest border border-primary/30 flex items-center gap-1.5 shadow-sm">
            <span className="size-1 bg-primary rounded-full animate-pulse"></span>
            Default Node
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-6 px-1 leading-relaxed">
        {addr.details}
      </p>

      <div className="flex gap-2 pt-2 border-t border-gray-50 dark:border-white/5">
        {!addr.isDefault && (
          <button
            onClick={onSetDefault}
            className="flex-1 h-11 bg-gray-50 dark:bg-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest text-gray-500 border border-gray-100 dark:border-white/10 active:scale-95 transition-all hover:bg-gray-200 dark:hover:bg-white/10"
          >Set Default</button>
        )}
        <button
          onClick={onEdit}
          className="flex-1 h-11 bg-gray-50 dark:bg-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest text-gray-500 border border-gray-100 dark:border-white/10 active:scale-95 transition-all hover:bg-gray-200 dark:hover:bg-white/10"
        >Edit Node</button>
        <button
          onClick={onDelete}
          className="size-11 bg-red-50 dark:bg-red-500/10 rounded-xl flex items-center justify-center text-red-500 border border-red-100 dark:border-red-500/10 active:scale-90 transition-all hover:bg-red-100"
        >
          <span className="material-symbols-outlined text-[20px]">delete</span>
        </button>
      </div>
    </div>
  </div>
);

export default SavedAddresses;
