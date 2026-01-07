
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, getDocs, where, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

import SystemAlert from '../components/SystemAlert';
import { AuditService } from '../lib/auditService';

const AdminRiderManagement: React.FC = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'ALL' | 'ONLINE' | 'PENDING' | 'OFFLINE' | 'SUSPENDED'>('ALL');
  const [showReallocationModal, setShowReallocationModal] = useState(false);
  const [selectedRider, setSelectedRider] = useState<any>(null);
  const [riders, setRiders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Alert State
  const [alertConfig, setAlertConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'INFO' | 'SUCCESS' | 'WARNING' | 'DANGER' | 'CONFIRM';
    onConfirm?: () => void;
    customSlot?: React.ReactNode;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'INFO',
  });

  const showAlert = (title: string, message: string, type: 'INFO' | 'SUCCESS' | 'WARNING' | 'DANGER') => {
    setAlertConfig({ isOpen: true, title, message, type, onConfirm: undefined });
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void, type: 'CONFIRM' | 'DANGER' = 'CONFIRM') => {
    setAlertConfig({ isOpen: true, title, message, type, onConfirm });
  };

  useEffect(() => {
    const fetchRiders = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, "users"), where("role", "==", "RIDER"));
        const snap = await getDocs(q);
        setRiders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (e) {
        console.error("Rider fetch error:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchRiders();
  }, [alertConfig.isOpen]); // Refresh on alert actions

  const hubs = [
    { id: 'H1', name: 'Hargeisa Central', load: 85, color: 'text-red-500' },
    { id: 'H2', name: 'Berbera Port', load: 30, color: 'text-primary' },
    { id: 'H3', name: 'Burco Express', load: 15, color: 'text-primary' },
  ];

  const filteredRiders = riders.filter(r => {
    if (filter === 'ALL') return true;
    if (filter === 'PENDING') return r.kycStatus === 'PENDING' || r.status === 'PENDING';
    if (filter === 'SUSPENDED') return r.riderStatus === 'SUSPENDED';
    return r.status === filter;
  });

  const handleUpdateStatus = (riderId: string, action: 'SUSPEND' | 'REINSTATE' | 'DELETE') => {
    if (action === 'SUSPEND') {
      showConfirm(
        'Suspend Fleet Access?',
        'This will immediately lock the rider dashboard, force offline status, and prevent order assignment.',
        async () => {
          try {
            await updateDoc(doc(db, "users", riderId), {
              riderStatus: 'SUSPENDED',
              status: 'OFFLINE', // Force offline
              isAccountLocked: true,
              lastAdminAction: serverTimestamp()
            });
            await AuditService.logAction('ADMIN', 'Current Admin', 'SUSPEND', `Suspended Rider ${riderId}`, 'HIGH', 'USER', riderId);

            showAlert('Protocol Executed', 'Rider node has been suspended and isolated from the logistics mesh.', 'SUCCESS');
            setAlertConfig(prev => ({ ...prev, isOpen: false }));
          } catch (err) {
            console.error(err);
            setTimeout(() => showAlert('Execution Failed', 'Insufficient permissions.', 'DANGER'), 100);
          }
        },
        'DANGER'
      );
    } else if (action === 'REINSTATE') {
      showConfirm(
        'Reinstate Access?',
        'This will restore dashboard access for the rider. They will need to go Online manually.',
        async () => {
          try {
            await updateDoc(doc(db, "users", riderId), {
              riderStatus: 'ACTIVE',
              isAccountLocked: false,
              lastAdminAction: serverTimestamp()
            });
            await AuditService.logAction('ADMIN', 'Current Admin', 'REINSTATE', `Reinstated Rider ${riderId}`, 'MEDIUM', 'USER', riderId);

            showAlert('Access Restored', 'Rider node is now active in the network.', 'SUCCESS');
            setAlertConfig(prev => ({ ...prev, isOpen: false }));
          } catch (err) {
            setTimeout(() => showAlert('Execution Failed', 'Insufficient permissions.', 'DANGER'), 100);
          }
        },
        'CONFIRM'
      );
    } else if (action === 'DELETE') {
      showConfirm(
        'Permanently Delete Node?',
        'This action is IRREVERSIBLE. All rider data and history will be wiped.',
        async () => {
          try {
            await updateDoc(doc(db, "users", riderId), {
              riderStatus: 'DELETED',
              isAccountLocked: true,
              deletedAt: serverTimestamp()
            });
            await AuditService.logAction('ADMIN', 'Current Admin', 'DELETE', `Deleted Rider ${riderId}`, 'CRITICAL', 'USER', riderId);

            showAlert('Node Terminated', 'Rider account marked for deletion.', 'SUCCESS');
            setAlertConfig(prev => ({ ...prev, isOpen: false }));
          } catch (err) {
            setTimeout(() => showAlert('Execution Failed', 'Insufficient permissions.', 'DANGER'), 100);
          }
        },
        'DANGER'
      );
    }
  };

  const handleReallocate = (e: React.MouseEvent, rider: any) => {
    e.stopPropagation();
    setSelectedRider(rider);
    setShowReallocationModal(true);
  };

  const confirmReallocation = async (hubName: string) => {
    if (!selectedRider) return;
    try {
      await updateDoc(doc(db, "users", selectedRider.id), {
        location: hubName,
        updatedAt: serverTimestamp()
      });
      setShowReallocationModal(false);
      setSelectedRider(null);
    } catch (err) {
      alert("Node transfer failed.");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-300">
      <SystemAlert
        isOpen={alertConfig.isOpen}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onConfirm={alertConfig.onConfirm}
        onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
        confirmText={alertConfig.type === 'DANGER' ? 'Suspend Access' : 'Confirm'}
        customSlot={alertConfig.customSlot}
      />

      <header className="sticky top-0 z-50 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/5 active:scale-90 transition-all">
          <span className="material-symbols-outlined text-secondary dark:text-white">arrow_back</span>
        </button>
        <div className="flex flex-col">
          <h1 className="text-xl font-black text-secondary dark:text-primary tracking-tighter leading-none uppercase">Fleet Control</h1>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">Personnel Verification & Ops</p>
        </div>
      </header>

      <main className="p-6 flex-1 flex flex-col gap-8 overflow-y-auto pb-32 no-scrollbar animate-in fade-in duration-500">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-secondary text-white p-6 rounded-[32px] shadow-soft border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 size-24 bg-primary/20 blur-[60px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
            <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-1 relative z-10">Verification Queue</p>
            <p className="text-4xl font-black relative z-10">{riders.filter(r => r.kycStatus === 'PENDING').length}</p>
          </div>
          <div className="bg-white dark:bg-surface-dark p-6 rounded-[32px] border border-gray-100 dark:border-white/5 shadow-soft">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Active Captains</p>
            <p className="text-4xl font-black text-primary">{riders.filter(r => r.status === 'ONLINE').length}</p>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {['ALL', 'PENDING', 'ONLINE', 'OFFLINE', 'SUSPENDED'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`snap-start px-5 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 whitespace-nowrap ${filter === f
                ? 'bg-secondary border-secondary text-primary shadow-lg scale-105'
                : 'bg-white dark:bg-white/5 text-gray-400 border-gray-100 dark:border-gray-800'
                }`}
            >
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-20 flex justify-center"><div className="size-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div></div>
        ) : filteredRiders.length === 0 ? (
          <div className="py-32 text-center opacity-30 flex flex-col items-center">
            <div className="size-24 rounded-[40px] bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-6 border-2 border-dashed border-gray-300">
              <span className="material-symbols-outlined text-5xl">person_off</span>
            </div>
            <p className="text-xs font-black uppercase tracking-[0.2em]">No riders found</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Check mesh connection</p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {filteredRiders.map((rider) => (
              <div
                key={rider.id}
                onClick={() => navigate(`/admin/rider/${rider.id}`)}
                className="bg-white dark:bg-surface-dark p-6 rounded-[40px] border border-gray-100 dark:border-gray-800 shadow-soft group hover:border-primary/20 transition-all relative cursor-pointer"
              >
                <div className="flex items-center gap-5 relative z-10">
                  <div className="relative">
                    <img src={rider.avatar || `https://ui-avatars.com/api/?name=${rider.fullName}&background=015754&color=06DC7F`} className="size-16 rounded-3xl object-cover border-2 border-white dark:border-white/10 shadow-sm" alt={rider.fullName} />
                    <span className={`absolute -bottom-1 -right-1 size-5 rounded-full border-4 border-white dark:border-surface-dark ${rider.riderStatus === 'SUSPENDED' ? 'bg-red-500' :
                      rider.status === 'ONLINE' ? 'bg-primary' :
                        rider.status === 'BUSY' ? 'bg-amber-500' : 'bg-gray-300'
                      }`}></span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-black text-lg text-secondary dark:text-white truncate tracking-tighter uppercase">{rider.fullName}</h3>
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${rider.riderStatus === 'SUSPENDED' ? 'bg-red-100 text-red-600' :
                        rider.kycStatus === 'VERIFIED' ? 'bg-green-100 text-green-700' :
                          rider.kycStatus === 'PENDING' ? 'bg-amber-100 text-amber-700 animate-pulse' :
                            'bg-gray-100 text-gray-400'
                        }`}>
                        {rider.riderStatus === 'SUSPENDED' ? 'SUSPENDED' : (rider.kycStatus || 'UNVERIFIED')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded uppercase tracking-widest">{rider.location || 'UNASSIGNED'}</span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{rider.vehicleType}</span>
                    </div>

                    <div className="flex items-center justify-between border-t border-gray-50 dark:border-white/5 pt-4">
                      <div className="flex gap-4">
                        <div className="flex flex-col">
                          <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Plate ID</span>
                          <span className="text-xs font-black text-secondary dark:text-white uppercase">{rider.plateNumber || 'N/A'}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Rating</span>
                          <div className="flex items-center gap-1 text-amber-500">
                            <span className="material-symbols-outlined text-xs fill-1">star</span>
                            <span className="text-xs font-black text-gray-400">{rider.rating || '5.0'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (rider.riderStatus === 'SUSPENDED') {
                              // Review Flow
                              setAlertConfig({
                                isOpen: true,
                                title: 'Review Suspended Node',
                                message: 'Select an action protocol for this rider:',
                                type: 'WARNING',
                                customSlot: (
                                  <div className="flex flex-col gap-2 w-full">
                                    <button onClick={() => handleUpdateStatus(rider.id, 'REINSTATE')} className="w-full h-12 bg-green-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-green-600">Reinstate Access</button>
                                    <button onClick={() => handleUpdateStatus(rider.id, 'DELETE')} className="w-full h-12 bg-red-100 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-colors">Permanently Delete</button>
                                    <button onClick={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))} className="w-full h-12 bg-transparent text-gray-400 font-bold text-[10px] uppercase">Cancel Review</button>
                                  </div>
                                )
                              });
                            } else {
                              handleUpdateStatus(rider.id, 'SUSPEND');
                            }
                          }}
                          className={`h-10 px-4 rounded-xl border flex items-center justify-center font-black text-[9px] uppercase tracking-widest active:scale-95 transition-all ${rider.riderStatus === 'SUSPENDED'
                            ? 'bg-secondary text-white border-white/20'
                            : 'bg-red-50 text-red-500 border-red-100 hover:bg-red-500 hover:text-white'
                            }`}
                        >
                          {rider.riderStatus === 'SUSPENDED' ? 'Review' : 'Suspend'}
                        </button>

                        {rider.riderStatus !== 'SUSPENDED' && (
                          <button
                            onClick={(e) => handleReallocate(e, rider)}
                            className="size-10 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 flex items-center justify-center text-gray-400 hover:text-primary active:scale-90 transition-all"
                          >
                            <span className="material-symbols-outlined text-[20px]">rebase_edit</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showReallocationModal && selectedRider && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-10">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowReallocationModal(false)}></div>
          <div className="relative w-full max-w-sm bg-white dark:bg-surface-dark rounded-[40px] p-8 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="size-20 rounded-[28px] bg-primary/10 border border-primary/20 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-primary text-[40px]">hub</span>
              </div>
              <h3 className="text-2xl font-black text-secondary dark:text-white mb-2 tracking-tighter uppercase">Select Operational Hub</h3>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-relaxed">
                Assigning <span className="text-primary">{selectedRider.fullName}</span> to a regional logistics node.
              </p>
            </div>

            <div className="flex flex-col gap-3 mb-8">
              {hubs.map(hub => (
                <button
                  key={hub.id}
                  onClick={() => confirmReallocation(hub.name)}
                  className={`flex items-center justify-between p-5 rounded-[24px] border-2 transition-all ${selectedRider.location === hub.name
                    ? 'border-gray-100 bg-gray-50 opacity-40 cursor-not-allowed'
                    : 'border-transparent bg-gray-50 dark:bg-white/5 hover:border-primary active:scale-[0.98]'
                    }`}
                  disabled={selectedRider.location === hub.name}
                >
                  <div className="flex items-center gap-4">
                    <div className="size-10 rounded-xl bg-white dark:bg-surface-dark flex items-center justify-center text-gray-400 border border-gray-100">
                      <span className="material-symbols-outlined">location_on</span>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-black text-secondary dark:text-white leading-tight">{hub.name}</p>
                      <p className={`text-[9px] font-bold uppercase tracking-widest ${hub.color}`}>{hub.load}% Load</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-primary">arrow_forward_ios</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowReallocationModal(false)}
              className="w-full h-14 text-gray-400 text-[10px] font-black uppercase tracking-[0.3em]"
            >
              Cancel Transfer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRiderManagement;
