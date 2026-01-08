import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { useAuth, useCart } from '../Providers';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { VendorUser, Store } from '../types';

const VendorStoreUsers: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'MANAGERS' | 'STAFF'>('ALL');
  const [users, setUsers] = useState<VendorUser[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Modal state
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    role: 'STAFF' as 'MANAGER' | 'STAFF',
    storeId: ''
  });

  // 1. Fetch available store nodes for assignment
  useEffect(() => {
    let active = true;

    const fetchStores = async () => {
      if (!user) return;
      try {
        const q = query(collection(db, "stores"), where("vendorId", "==", user.uid));
        const snapshot = await getDocs(q);
        if (active) {
          setStores(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Store)));
        }
      } catch (err) { }
    };

    fetchStores();
    return () => { active = false; };
  }, [user]);

  // 2. Fetch all staff members linked to this vendor
  useEffect(() => {
    let active = true;
    const fetchUsers = async () => {
      if (!user) return;
      try {
        // In this model, staff are users with a `vendorId` field matching the owner
        const q = query(collection(db, "users"), where("parentVendorId", "==", user.uid));
        const snapshot = await getDocs(q);

        if (active) {
          setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
          setLoading(false);
        }
      } catch (err) {
        if (active) setLoading(false);
      }
    };

    fetchUsers();
    return () => { active = false; };
  }, [user]);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    try {
      const selectedStore = stores.find(s => s.id === newStaff.storeId);

      // Creating a new personnel node
      await addDoc(collection(db, "users"), {
        fullName: newStaff.name,
        email: newStaff.email,
        role: 'VENDOR_STAFF', // Internal role designation
        staffType: newStaff.role,
        storeId: newStaff.storeId,
        storeName: selectedStore?.name || 'Central',
        parentVendorId: user.uid,
        status: 'ACTIVE',
        walletBalance: 0,
        trustTier: 'BRONZE',
        createdAt: serverTimestamp()
      });

      setShowAddModal(false);
      setNewStaff({ name: '', email: '', role: 'STAFF', storeId: '' });
    } catch (err) {
      console.error(err);
      alert("Operational Failure: Could not provision personnel node.");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleStatus = async (staffId: string, currentStatus: string) => {
    try {
      await updateDoc(doc(db, "users", staffId), {
        status: currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
      });
    } catch (err) { console.error(err); }
  };

  const filteredUsers = users.filter(u => {
    if (activeFilter === 'MANAGERS') return u.role === 'MANAGER' || (u as any).staffType === 'MANAGER';
    if (activeFilter === 'STAFF') return u.role === 'STAFF' || (u as any).staffType === 'STAFF';
    return true;
  });

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-300 font-display">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/5 active:scale-90 transition-all">
            <span className="material-symbols-outlined text-secondary dark:text-white">arrow_back</span>
          </button>
          <div className="flex flex-col">
            <h1 className="text-xl font-black text-secondary dark:text-primary tracking-tighter leading-none uppercase">Staff Command</h1>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">HR & Access Control</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="size-10 rounded-full bg-primary text-secondary flex items-center justify-center shadow-primary-glow active:scale-90 transition-all"
        >
          <span className="material-symbols-outlined font-black">person_add</span>
        </button>
      </header>

      <main className="p-6 flex-1 flex flex-col gap-8 overflow-y-auto pb-32 no-scrollbar animate-in fade-in duration-500">
        {/* Performance Insight */}
        <section className="bg-primary/5 rounded-[32px] p-6 border border-primary/20 flex items-center gap-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <span className="material-symbols-outlined text-primary text-5xl">auto_awesome</span>
          </div>
          <div className="size-14 rounded-2xl bg-primary flex items-center justify-center text-secondary shadow-lg shrink-0">
            <span className="material-symbols-outlined text-3xl font-black">badge</span>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-black text-secondary dark:text-white leading-tight mb-1 uppercase tracking-widest">Network Personnel</h4>
            <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 leading-relaxed uppercase tracking-widest">
              You have <span className="text-primary font-bold">{users.length} active nodes</span> in your staff directory across {stores.length} branches.
            </p>
          </div>
        </section>

        {/* Filter Bar */}
        <div className="flex bg-gray-100/50 dark:bg-white/5 p-1.5 rounded-2xl border border-gray-200/50 dark:border-white/5 gap-1">
          {(['ALL', 'MANAGERS', 'STAFF'] as const).map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeFilter === f
                ? 'bg-white dark:bg-surface-dark text-primary shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-white/5'
                }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* User List */}
        <div className="flex flex-col gap-4">
          {loading ? (
            <div className="py-20 flex justify-center"><div className="size-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div></div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-20 text-center opacity-30">
              <span className="material-symbols-outlined text-5xl block mb-4">group_off</span>
              <p className="text-xs font-black uppercase tracking-widest">No personnel nodes found</p>
            </div>
          ) : (
            filteredUsers.map(staff => (
              <div key={staff.id} className="bg-white dark:bg-surface-dark p-5 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-soft group hover:border-primary/20 transition-all flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img src={`https://i.pravatar.cc/150?u=${staff.id}`} className={`size-14 rounded-2xl object-cover border-2 border-white dark:border-white/10 shadow-sm ${staff.status === 'INACTIVE' ? 'grayscale opacity-50' : ''}`} alt={staff.name} />
                    <span className={`absolute -bottom-1 -right-1 size-4 rounded-full border-2 border-white dark:border-surface-dark ${staff.status === 'ACTIVE' ? 'bg-primary' : 'bg-gray-400'}`}></span>
                  </div >
                  <div>
                    <h4 className={`text-base font-black uppercase tracking-tighter leading-none mb-1 ${staff.status === 'INACTIVE' ? 'text-gray-400 line-through' : 'text-secondary dark:text-white'}`}>{staff.name}</h4>
                    <div className="flex items-center gap-2">
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest ${(staff as any).staffType === 'MANAGER' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>{(staff as any).staffType || staff.role}</span>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest truncate max-w-[80px]">@{staff.storeName}</span>
                    </div>
                  </div>
                </div >
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleStatus(staff.id, staff.status)}
                    className="size-10 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 flex items-center justify-center text-gray-400 hover:text-primary active:scale-90 transition-all shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[20px]">{staff.status === 'ACTIVE' ? 'person_off' : 'person_check'}</span>
                  </button>
                  <button className="size-10 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 flex items-center justify-center text-gray-400 hover:text-red-500 active:scale-90 transition-all shadow-sm">
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                </div>
              </div >
            ))
          )}
        </div >
      </main >

      {/* Add Personnel Modal */}
      {
        showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowAddModal(false)}></div>
            <div className="relative bg-white dark:bg-surface-dark rounded-[40px] p-10 max-w-md w-full shadow-2xl animate-in zoom-in-95">
              <div className="flex flex-col items-center mb-8">
                <div className="size-16 rounded-[22px] bg-primary/10 flex items-center justify-center text-primary mb-6 border border-primary/20">
                  <span className="material-symbols-outlined text-[32px] font-black">person_add</span>
                </div>
                <h2 className="text-2xl font-black text-secondary dark:text-white tracking-tighter uppercase leading-none">Add Personnel</h2>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-3">Sync node to store network</p>
              </div>

              <form onSubmit={handleAddStaff} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Identity Name</label>
                  <input required value={newStaff.name} onChange={e => setNewStaff({ ...newStaff, name: e.target.value })} className="w-full h-12 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl px-4 text-sm font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Node</label>
                  <input required type="email" value={newStaff.email} onChange={e => setNewStaff({ ...newStaff, email: e.target.value })} className="w-full h-12 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl px-4 text-sm font-bold" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Role Type</label>
                    <select value={newStaff.role} onChange={e => setNewStaff({ ...newStaff, role: e.target.value as any })} className="w-full h-12 bg-gray-50 dark:bg-white/5 border-none rounded-xl px-4 text-[10px] font-black uppercase tracking-widest">
                      <option value="STAFF">Staff</option>
                      <option value="MANAGER">Manager</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Assign Node</label>
                    <select required value={newStaff.storeId} onChange={e => setNewStaff({ ...newStaff, storeId: e.target.value })} className="w-full h-12 bg-gray-50 dark:bg-white/5 border-none rounded-xl px-4 text-[10px] font-black uppercase tracking-widest">
                      <option value="">Choose Store</option>
                      {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>

                <button
                  disabled={isSaving || !newStaff.storeId}
                  type="submit"
                  className="w-full h-16 bg-primary text-secondary font-black uppercase text-xs tracking-[0.2em] rounded-2xl shadow-lg active:scale-95 transition-all mt-6 flex items-center justify-center gap-3 disabled:opacity-30"
                >
                  {isSaving ? <span className="animate-spin material-symbols-outlined">sync</span> : 'Authorize Personnel'}
                </button>
              </form>
            </div>
          </div>
        )
      }

      <BottomNav items={[
        { label: 'Home', icon: 'grid_view', path: '/vendor' },
        { label: 'Orders', icon: 'receipt_long', path: '/vendor/orders' },
        { label: 'Scan', icon: 'qr_code_scanner', path: '/vendor/scan', special: true },
        { label: 'Network', icon: 'hub', path: '/vendor/stores' },
        { label: 'Staff', icon: 'group', path: '/vendor/staff' },
      ]} />
    </div >
  );
};

export default VendorStoreUsers;
