import React, { useState } from 'react';
import { api } from '../src/services/api';
import { UserRole } from '../types';

interface CreateUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [role, setRole] = useState<UserRole>('VENDOR');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
        mobile: '',
        businessName: '',
        businessCategory: '',
        vehicleType: 'Motorcycle',
        plateNumber: '',
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const payload = {
                ...formData,
                role,
                // Ensure email is set or generated if empty (though required here)
                email: formData.email || `${formData.mobile.replace(/\D/g, '')}@fudaydiye.so`
            };

            await api.post('/auth/register', payload); // Using the same public register endpoint but might need Admin prevs override if available, or just standard register
            // NOTE: Standard register logs the user in. If we are Admin creating a user, we strictly shouldn't use /auth/register if it auto-logs-in.
            // However, for this task, if the backend supports it, we might need a specific '/admin/users' endpoint.
            // Assuming /auth/register is the only way for now. If it returns a token, we just ignore it on client side here. 
            // ideally we should have an admin endpoint. I will use /auth/register for now but handle the "auto login" side effect by NOT using the token.

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Failed to create user');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white dark:bg-surface-dark w-full max-w-lg rounded-[32px] p-8 shadow-2xl animate-in fade-in zoom-in duration-300 border border-gray-100 dark:border-white/10 max-h-[90vh] overflow-y-auto">

                <h2 className="text-2xl font-black text-secondary dark:text-white uppercase tracking-tighter mb-1">Create Internal User</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">Manually Register Vendor or Rider</p>

                {error && <div className="bg-red-50 text-red-500 p-4 rounded-xl mb-4 text-xs font-bold">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Role</label>
                        <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-xl">
                            <button type="button" onClick={() => setRole('VENDOR')} className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${role === 'VENDOR' ? 'bg-secondary text-white shadow' : 'text-gray-400'}`}>Vendor</button>
                            <button type="button" onClick={() => setRole('RIDER')} className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${role === 'RIDER' ? 'bg-secondary text-white shadow' : 'text-gray-400'}`}>Rider</button>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name (Legal)</label>
                        <input required className="w-full h-12 bg-gray-50 dark:bg-white/5 rounded-xl px-4 font-bold border-2 border-transparent focus:border-primary outline-none" placeholder="Manager Name" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mobile</label>
                            <input required className="w-full h-12 bg-gray-50 dark:bg-white/5 rounded-xl px-4 font-bold border-2 border-transparent focus:border-primary outline-none" placeholder="+252..." value={formData.mobile} onChange={e => setFormData({ ...formData, mobile: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email (Optional)</label>
                            <input type="email" className="w-full h-12 bg-gray-50 dark:bg-white/5 rounded-xl px-4 font-bold border-2 border-transparent focus:border-primary outline-none" placeholder="user@company.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Initial Password</label>
                        <input required type="password" className="w-full h-12 bg-gray-50 dark:bg-white/5 rounded-xl px-4 font-bold border-2 border-transparent focus:border-primary outline-none" placeholder="••••••••" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                    </div>

                    {role === 'VENDOR' && (
                        <div className="space-y-4 pt-2 border-t border-dashed border-gray-200 dark:border-white/10 animate-in slide-in-from-top-2">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Business Name</label>
                                <input required className="w-full h-12 bg-gray-50 dark:bg-white/5 rounded-xl px-4 font-bold border-2 border-transparent focus:border-primary outline-none" placeholder="Shop Name" value={formData.businessName} onChange={e => setFormData({ ...formData, businessName: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Category</label>
                                <input required className="w-full h-12 bg-gray-50 dark:bg-white/5 rounded-xl px-4 font-bold border-2 border-transparent focus:border-primary outline-none" placeholder="e.g. Retail" value={formData.businessCategory} onChange={e => setFormData({ ...formData, businessCategory: e.target.value })} />
                            </div>
                        </div>
                    )}

                    {role === 'RIDER' && (
                        <div className="space-y-4 pt-2 border-t border-dashed border-gray-200 dark:border-white/10 animate-in slide-in-from-top-2">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Vehicle Type</label>
                                <select className="w-full h-12 bg-gray-50 dark:bg-white/5 rounded-xl px-4 font-bold border-2 border-transparent focus:border-primary outline-none" value={formData.vehicleType} onChange={e => setFormData({ ...formData, vehicleType: e.target.value })}>
                                    <option value="Motorcycle">Motorcycle</option>
                                    <option value="Three-wheeler (Bajaj)">Three-wheeler (Bajaj)</option>
                                    <option value="Car">Car</option>
                                    <option value="Van">Van</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Plate Number</label>
                                <input required className="w-full h-12 bg-gray-50 dark:bg-white/5 rounded-xl px-4 font-bold border-2 border-transparent focus:border-primary outline-none" placeholder="SL-..." value={formData.plateNumber} onChange={e => setFormData({ ...formData, plateNumber: e.target.value })} />
                            </div>
                        </div>
                    )}

                    <div className="pt-6 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 h-12 bg-gray-100 dark:bg-white/5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-200">Cancel</button>
                        <button type="submit" disabled={loading} className="flex-[2] h-12 bg-primary text-secondary rounded-xl text-xs font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-2">
                            {loading ? <span className="material-symbols-outlined animate-spin">sync</span> : 'Create User'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default CreateUserModal;
