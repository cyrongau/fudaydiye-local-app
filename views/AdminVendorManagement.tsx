
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, getDocs, where, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { userService } from '../src/lib/services/userService';

import SystemAlert from '../components/SystemAlert';
import { AuditService } from '../lib/auditService';

const AdminVendorManagement: React.FC = () => {
  const navigate = useNavigate();
  const [roleFilter, setRoleFilter] = useState<'VENDOR' | 'RIDER' | 'CUSTOMER' | 'CLIENT'>('VENDOR');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VERIFIED' | 'PENDING' | 'SUSPENDED'>('ALL');
  const [users, setUsers] = useState<any[]>([]);
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
    const fetchUsers = async () => {
      setLoading(true);
      try {
        // Use UserService instead of direct Firestore query
        const userData = await userService.getAllUsers(roleFilter);
        setUsers(userData);
      } catch (e) {
        console.error("User fetch error:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [roleFilter, alertConfig.isOpen]);

  const handleUpdateStatus = (userId: string, action: 'SUSPEND' | 'REINSTATE' | 'DELETE') => {
    if (action === 'SUSPEND') {
      showConfirm(
        'Suspend User Access?',
        'This will lock the user account. Action reversible by Admin.',
        async () => {
          try {
            await userService.updateStatus(userId, {
              status: 'SUSPENDED',
              vendorStatus: 'SUSPENDED',
              isAccountLocked: true,
            });
            await AuditService.logAction('ADMIN', 'Current Admin', 'SUSPEND', `Suspended User ${userId}`, 'HIGH', 'USER', userId);
            showAlert('Protocol Executed', 'User account suspended.', 'SUCCESS');
            setAlertConfig(prev => ({ ...prev, isOpen: false }));
          } catch (err) {
            console.error(err);
            setTimeout(() => showAlert('Execution Failed', 'Insufficient permissions.', 'DANGER'), 100);
          }
        },
        'DANGER'
      );
    } else if (action === 'REINSTATE') {
      showConfirm('Reinstate Access?', 'Restore user access level.', async () => {
        await userService.updateStatus(userId, { vendorStatus: 'ACTIVE', status: 'ACTIVE', isAccountLocked: false });
        showAlert('Access Restored', 'User account active.', 'SUCCESS');
        setAlertConfig(prev => ({ ...prev, isOpen: false }));
      }, 'CONFIRM');
    } else if (action === 'DELETE') {
      showConfirm('Delete User?', 'Irreversible action.', async () => {
        await userService.updateStatus(userId, { vendorStatus: 'DELETED', status: 'DELETED', isAccountLocked: true });
        showAlert('User Deleted', 'Account marked for deletion.', 'SUCCESS');
        setAlertConfig(prev => ({ ...prev, isOpen: false }));
      }, 'DANGER');
    }
  };

  const handleToggleStream = async (userId: string, currentStatus: boolean) => {
    try {
      await userService.updateStatus(userId, {
        canStream: !currentStatus
      });
      showAlert('Protocol Executed', `Live Stream Access has been ${!currentStatus ? 'GRANTED' : 'REVOKED'}.`, 'SUCCESS');
    } catch (e) {
      console.error(e);
      showAlert('Execution Failed', 'Permission denied.', 'DANGER');
    }
  };

  const filteredUsers = users.filter(u => {
    if (statusFilter === 'ALL') return true;
    // Map status check to generic field or legacy vendorStatus
    const s = u.vendorStatus || u.status || 'ACTIVE';
    if (statusFilter === 'VERIFIED') return u.kycStatus === 'VERIFIED';
    return s === statusFilter;
  });

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-300 font-display">
      {/* SystemAlert Component (Keep existing) */}
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
          <h1 className="text-xl font-black text-secondary dark:text-primary tracking-tighter leading-none">User Management</h1>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">Governance & Compliance</p>
        </div>
      </header>

      <main className="p-6 flex-1 flex flex-col gap-8 overflow-y-auto pb-10 no-scrollbar animate-in fade-in duration-500">

        {/* Role Filter Pills */}
        <div className="bg-white dark:bg-surface-dark p-2 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex gap-2 overflow-x-auto no-scrollbar">
          {(['VENDOR', 'RIDER', 'CLIENT', 'CUSTOMER'] as const).map(role => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${roleFilter === role
                ? 'bg-secondary text-primary shadow-md'
                : 'bg-gray-50 dark:bg-white/5 text-gray-400 hover:bg-gray-100'
                }`}
            >
              {role}s
            </button>
          ))}
        </div>

        {/* Status Filter Bar - Only show relevant statuses */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {['ALL', 'VERIFIED', 'PENDING', 'SUSPENDED'].map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f as any)}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${statusFilter === f
                ? 'bg-white dark:bg-surface-dark text-secondary dark:text-white border-secondary dark:border-white'
                : 'bg-transparent text-gray-400 border-transparent hover:border-gray-200'
                }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Enhanced User List */}
        {loading ? (
          <div className="py-20 flex justify-center"><div className="size-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div></div>
        ) : (
          <div className="flex flex-col gap-5">
            {filteredUsers.map((user) => (
              <div key={user.id} className="bg-white dark:bg-surface-dark p-6 rounded-[40px] border border-gray-100 dark:border-gray-800 shadow-soft group hover:border-primary/20 transition-all">
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.businessName || user.fullName || 'User'}&background=random`} className="size-16 rounded-[24px] object-cover border-2 border-gray-100 dark:border-white/10" alt={user.fullName} />
                    {user.kycStatus === 'VERIFIED' && (
                      <div className="absolute -top-2 -right-2 size-6 bg-amber-400 rounded-full flex items-center justify-center border-4 border-white dark:border-surface-dark shadow-md">
                        <span className="material-symbols-outlined text-white text-[12px] font-black">star</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-black text-base text-secondary dark:text-white truncate uppercase tracking-tighter">{user.businessName || user.fullName || 'Unknown User'}</h3>
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${user.status === 'SUSPENDED' || user.vendorStatus === 'SUSPENDED' ? 'bg-red-100 text-red-600' :
                        user.kycStatus === 'VERIFIED' ? 'bg-green-100 text-green-700' :
                          user.kycStatus === 'PENDING' ? 'bg-amber-100 text-amber-700 animate-pulse' :
                            'bg-gray-100 text-gray-400'
                        }`}>
                        {user.status === 'SUSPENDED' || user.vendorStatus === 'SUSPENDED' ? 'SUSPENDED' : (user.kycStatus || 'ACTIVE')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{user.role} • {user.businessCategory || 'Standard'}</span>
                      {user.role === 'VENDOR' && (
                        <>
                          <span className="size-1 bg-gray-200 rounded-full"></span>
                          <span className="text-[10px] font-black text-primary">${user.walletBalance?.toFixed(2) || '0.00'} ESCROW</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Role Specific Actions - Only Show for VENDOR/RIDER */}
                {(user.role === 'VENDOR' || user.role === 'RIDER') && (
                  <div className="mt-6 pt-6 border-t border-gray-50 dark:border-white/5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 bg-gray-50 dark:bg-white/5 px-4 py-2 rounded-xl">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Live Stream Access</span>
                      <button
                        onClick={() => handleToggleStream(user.id, user.canStream || false)}
                        className={`relative w-10 h-6 rounded-full transition-colors duration-300 ${user.canStream ? 'bg-primary' : 'bg-gray-200 dark:bg-white/10'}`}
                      >
                        <span className={`absolute top-1 left-1 size-4 bg-white rounded-full transition-transform duration-300 shadow-sm ${user.canStream ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  </div>
                )}

                <div className="pt-2 flex gap-2">
                  {(user.role === 'VENDOR' || user.role === 'RIDER') && (
                    <button
                      onClick={() => navigate(user.role === 'VENDOR' ? `/admin/vendor/${user.id}?view=kyc` : `/admin/rider/${user.id}`)}
                      className="flex-1 h-12 bg-primary text-secondary rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[18px]">fact_check</span>
                      {user.kycStatus === 'VERIFIED' ? 'Re-Verify KYC' : 'Authorize KYC'}
                    </button>
                  )}

                  <button
                    onClick={() => {
                      const isSuspended = user.status === 'SUSPENDED' || user.vendorStatus === 'SUSPENDED';
                      if (isSuspended) {
                        setAlertConfig({
                          isOpen: true,
                          title: 'Review Suspended Account',
                          message: 'Select an action protocol:',
                          type: 'WARNING',
                          customSlot: (
                            <div className="flex flex-col gap-2 w-full">
                              <button onClick={() => handleUpdateStatus(user.id, 'REINSTATE')} className="w-full h-12 bg-green-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-green-600">Reinstate Access</button>
                              <button onClick={() => handleUpdateStatus(user.id, 'DELETE')} className="w-full h-12 bg-red-100 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-colors">Permanently Delete</button>
                              <button onClick={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))} className="w-full h-12 bg-transparent text-gray-400 font-bold text-[10px] uppercase">Cancel Review</button>
                            </div>
                          )
                        });
                      } else {
                        handleUpdateStatus(user.id, 'SUSPEND');
                      }
                    }}
                    className={`flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] active:scale-95 transition-all ${user.status === 'SUSPENDED' || user.vendorStatus === 'SUSPENDED'
                      ? 'bg-secondary text-white shadow-lg border border-white/10'
                      : 'bg-gray-100 dark:bg-white/5 text-gray-500 hover:bg-red-50 hover:text-red-500'
                      }`}
                  >
                    {user.status === 'SUSPENDED' || user.vendorStatus === 'SUSPENDED' ? 'Review' : 'Suspend Access'}
                  </button>

                  <button
                    onClick={() => navigate(user.role === 'VENDOR' ? `/admin/vendor/${user.id}` : '#')}
                    className="size-12 rounded-xl bg-secondary text-primary flex items-center justify-center active:scale-95 transition-all shadow-md group/btn"
                    title="Review Profile"
                  >
                    <span className="material-symbols-outlined group-hover:scale-110 transition-transform">person</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </main >
    </div >
  );
};

export default AdminVendorManagement;
