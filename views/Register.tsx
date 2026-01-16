
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserRole } from '../types';
import { auth, db } from '../lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

interface RegisterProps {
  onRegister: () => void;
  setAppRole: (role: UserRole) => void;
}

type RegistrationStep = 'SELECT_ROLE' | 'FORM';

const COMMON_COUNTRY_CODES = [
  { code: '+252', label: 'Somalia/SL', flag: '🇸🇴' },
  { code: '+251', label: 'Ethiopia', flag: '🇪🇹' },
  { code: '+253', label: 'Djibouti', flag: '🇩🇯' },
  { code: '+254', label: 'Kenya', flag: '🇰🇪' },
  { code: '+971', label: 'UAE', flag: '🇦🇪' },
  { code: '+1', label: 'USA/Canada', flag: '🇺🇸' },
  { code: '+44', label: 'UK', flag: '🇬🇧' },
  { code: '+90', label: 'Turkey', flag: '🇹🇷' },
  { code: '+20', label: 'Egypt', flag: '🇪🇬' },
  { code: '+966', label: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+49', label: 'Germany', flag: '🇩🇪' },
];

const VEHICLE_TYPES = [
  "Toyota Vitz",
  "Three-wheeler (Bajaj)",
  "Pickup Truck",
  "Box Truck",
  "Motorcycle",
  "Heavy Logistics Truck"
];

const Register: React.FC<RegisterProps> = ({ onRegister, setAppRole }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState<RegistrationStep>(location.state?.role ? 'FORM' : 'SELECT_ROLE');
  const [selectedRole, setSelectedRole] = useState<UserRole>(location.state?.role || 'CUSTOMER');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCountryCode, setSelectedCountryCode] = useState('+252');

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobile: '',
    location: '',
    password: '',
    businessIdentity: '',
    category: 'Fashion & Apparel',
    vehicleType: VEHICLE_TYPES[0],
    plateNumber: '',
    enterpriseName: '',
    operationalHub: ''
  });

  const roles: { id: UserRole; label: string; icon: string }[] = [
    { id: 'CUSTOMER', label: 'SHOPPER', icon: 'person' },
    { id: 'VENDOR', label: 'VENDOR', icon: 'store' },
    { id: 'RIDER', label: 'RIDER', icon: 'local_shipping' },
    { id: 'CLIENT', label: 'CLIENT', icon: 'work' },
    { id: 'FUDAYDIYE_ADMIN', label: 'GLOBAL OPS', icon: 'public' },
  ];

  const normalizePhone = (num: string) => {
    return num.replace(/\D/g, '').replace(/^0+/, '');
  };

  const handleBack = () => {
    if (step === 'FORM') {
      setStep('SELECT_ROLE');
    } else {
      navigate(-1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const cleanMobile = normalizePhone(formData.mobile);
      const identityEmail = formData.email || `${selectedCountryCode}${cleanMobile}@fudaydiye.so`;

      const { api } = await import('../src/services/api'); // Ensure api is imported

      const payload = {
        email: identityEmail,
        password: formData.password,
        fullName: formData.fullName,
        mobile: `${selectedCountryCode}${cleanMobile}`,
        role: selectedRole,
        // Optional fields based on role
        businessName: (selectedRole === 'VENDOR' || selectedRole === 'FUDAYDIYE_ADMIN' || selectedRole === 'CLIENT') ? (formData.businessIdentity || formData.enterpriseName) : undefined,
        businessCategory: selectedRole === 'VENDOR' ? formData.category : undefined,
        vehicleType: selectedRole === 'RIDER' ? formData.vehicleType : undefined,
        plateNumber: selectedRole === 'RIDER' ? formData.plateNumber : undefined,
        operationalHub: selectedRole === 'CLIENT' ? formData.operationalHub : undefined
      };

      const res = await api.post('/auth/register', payload);

      if (res.data.success && res.data.token) {
        const { signInWithCustomToken } = await import('firebase/auth');
        await signInWithCustomToken(auth, res.data.token);

        setAppRole(selectedRole);
        onRegister();

        const routes: Record<UserRole, string> = {
          CUSTOMER: '/customer',
          VENDOR: '/vendor',
          RIDER: '/rider',
          CLIENT: '/client',
          ADMIN: '/admin',
          FUDAYDIYE_ADMIN: '/vendor'
        };
        navigate(routes[selectedRole]);
      }

    } catch (err: any) {
      console.error("Registration Error:", err);
      setError(err.response?.data?.message || err.message || 'Registration failure.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderRoleSelection = () => (
    <div className="flex flex-col flex-1 animate-in fade-in zoom-in-95 duration-500">
      <div className="bg-white dark:bg-black/30 backdrop-blur-xl rounded-[40px] p-10 w-full border border-secondary/10 dark:border-primary/10 shadow-2xl mt-4 mb-24">
        <div className="flex flex-col items-center mb-10">
          <div className="size-20 rounded-[28px] bg-primary/20 border border-primary/30 flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-primary text-[40px] icon-filled">account_circle</span>
          </div>
          <h2 className="text-3xl font-black text-secondary dark:text-white mb-2 tracking-tighter uppercase">Join the Mesh</h2>
          <p className="text-[10px] font-black text-secondary/60 dark:text-white/60 uppercase tracking-[0.4em]">Select Identity Node</p>
        </div>

        <div className="grid grid-cols-2 gap-5 mb-12">
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => setSelectedRole(role.id)}
              className={`relative h-36 rounded-[32px] flex flex-col items-center justify-center gap-4 transition-all duration-500 border-2 ${selectedRole === role.id
                ? 'border-primary bg-primary/10 dark:bg-primary/10 shadow-primary-glow scale-[1.05]'
                : 'border-secondary/5 dark:border-white/5 bg-gray-50 dark:bg-white/2 hover:border-primary/20'
                }`}
            >
              <span className={`material-symbols-outlined text-[42px] ${selectedRole === role.id ? 'text-primary' : 'text-secondary/40 dark:text-white/40'}`}>
                {role.icon}
              </span>
              <span className={`text-[11px] font-black uppercase tracking-[0.2em] ${selectedRole === role.id ? 'text-secondary dark:text-white' : 'text-secondary/40 dark:text-white/40'}`}>
                {role.label}
              </span>
              {selectedRole === role.id && (
                <div className="absolute top-4 right-4">
                  <span className="material-symbols-outlined text-primary text-[20px] icon-filled animate-in zoom-in">check_circle</span>
                </div>
              )}
            </button>
          ))}
        </div>

        <button
          onClick={() => setStep('FORM')}
          className="w-full h-20 bg-primary text-secondary font-black text-sm uppercase tracking-[0.3em] rounded-[24px] shadow-primary-glow active:scale-95 transition-all"
        >
          Initialize Protocol
        </button>
      </div>
    </div>
  );

  const renderForm = () => {
    return (
      <div className="flex flex-col flex-1 animate-in slide-in-from-right duration-500">
        <div className="bg-white dark:bg-black/30 backdrop-blur-xl rounded-[40px] p-10 w-full border border-secondary/10 dark:border-primary/10 shadow-2xl mt-4 mb-24">
          <div className="flex flex-col items-center mb-10 text-center">
            <h2 className="text-3xl font-black text-secondary dark:text-white mb-2 tracking-tighter uppercase">{selectedRole} Setup</h2>
            <p className="text-[10px] font-black text-secondary/60 dark:text-white/60 uppercase tracking-[0.3em]">Configure Node Credentials</p>
            {error && <p className="mt-6 text-[10px] font-black text-red-500 bg-red-50 p-4 rounded-2xl border border-red-100 animate-bounce uppercase tracking-widest">{error}</p>}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-secondary/50 dark:text-white/50 uppercase tracking-widest ml-1">Legal Recipient Name</label>
              <input required placeholder="Enter full name..." className="w-full h-16 rounded-[24px] bg-gray-50 dark:bg-white/5 border-2 border-gray-100 dark:border-white/10 focus:border-primary text-secondary dark:text-white text-base font-bold px-6 shadow-inner" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-secondary/50 dark:text-white/50 uppercase tracking-widest ml-1">Identity Access Mobile</label>
              <div className="flex w-full h-16 rounded-[24px] bg-gray-50 dark:bg-white/5 border-2 border-gray-100 dark:border-white/10 focus-within:border-primary overflow-hidden shadow-inner">
                <div className="flex items-center px-4 bg-gray-100/50 dark:bg-white/10 border-r border-gray-200 dark:border-white/10 gap-2">
                  <span className="text-lg">{COMMON_COUNTRY_CODES.find(c => c.code === selectedCountryCode)?.flag}</span>
                  <select value={selectedCountryCode} onChange={(e) => setSelectedCountryCode(e.target.value)} className="bg-transparent border-none p-0 text-xs font-black text-secondary dark:text-white focus:ring-0 appearance-none cursor-pointer">
                    {COMMON_COUNTRY_CODES.map(c => <option key={c.code} value={c.code} className="bg-white dark:bg-dark-base text-secondary dark:text-white">{c.code} ({c.label})</option>)}
                  </select>
                </div>
                <input required type="tel" placeholder="63 444 1122" className="bg-transparent border-none focus:ring-0 text-secondary dark:text-white text-base font-bold px-6 flex-1" value={formData.mobile} onChange={(e) => setFormData({ ...formData, mobile: e.target.value })} />
              </div>
            </div>

            {(selectedRole === 'VENDOR' || selectedRole === 'FUDAYDIYE_ADMIN') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-secondary/50 dark:text-white/50 uppercase tracking-widest ml-1">Enterprise Name</label>
                  <input required placeholder="e.g. Som-Logistics Ltd" className="w-full h-16 rounded-[24px] bg-gray-50 dark:bg-white/5 border-2 border-gray-100 dark:border-white/10 focus:border-primary text-base font-bold px-6" value={formData.businessIdentity} onChange={(e) => setFormData({ ...formData, businessIdentity: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-secondary/50 dark:text-white/50 uppercase tracking-widest ml-1">One-Word Industry</label>
                  <input required placeholder="e.g. Retail" className="w-full h-16 rounded-[24px] bg-gray-50 dark:bg-white/5 border-2 border-gray-100 dark:border-white/10 focus:border-primary text-base font-bold px-6" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} />
                </div>
              </div>
            )}

            {selectedRole === 'RIDER' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-secondary/50 dark:text-white/50 uppercase tracking-widest ml-1">Vehicle Node</label>
                  <select className="w-full h-16 rounded-[24px] bg-gray-50 dark:bg-white/5 border-2 border-gray-100 dark:border-white/10 focus:border-primary text-[11px] font-black uppercase appearance-none px-6" value={formData.vehicleType} onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}>
                    {VEHICLE_TYPES.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-secondary/50 dark:text-white/50 uppercase tracking-widest ml-1">Verified Plate ID</label>
                  <input required placeholder="e.g. SL-2911" className="w-full h-16 rounded-[24px] bg-gray-50 dark:bg-white/5 border-2 border-gray-100 dark:border-white/10 focus:border-primary text-base font-bold px-6" value={formData.plateNumber} onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })} />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-secondary/50 dark:text-white/50 uppercase tracking-widest ml-1">Access Pass (Password)</label>
              <input required type="password" placeholder="••••••••" className="w-full h-16 rounded-[24px] bg-gray-50 dark:bg-white/5 border-2 border-gray-100 dark:border-white/10 focus:border-primary text-base font-bold px-6 shadow-inner" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
            </div>

            <div className="flex gap-4 pt-10">
              <button type="button" onClick={handleBack} className="size-16 rounded-[24px] bg-gray-100 dark:bg-white/5 flex items-center justify-center text-secondary dark:text-white active:scale-90 transition-all border border-gray-200 dark:border-white/10"><span className="material-symbols-outlined">arrow_back</span></button>
              <button type="submit" disabled={isLoading} className="flex-1 h-16 bg-primary text-secondary font-black text-xs uppercase tracking-[0.3em] rounded-[24px] shadow-primary-glow flex items-center justify-center gap-3 active:scale-[0.98] transition-all">
                {isLoading ? <span className="animate-spin material-symbols-outlined">sync</span> : 'Confirm Registration'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="relative flex flex-col h-screen overflow-hidden bg-background-light dark:bg-background-dark transition-colors duration-300">
      <div className="absolute inset-0 grid-overlay opacity-20"></div>
      <div className="relative z-20 flex items-center justify-between p-6 pt-12">
        <button onClick={handleBack} className="size-11 rounded-full bg-white/20 dark:bg-white/5 border border-secondary/10 dark:border-white/10 flex items-center justify-center text-secondary dark:text-white"><span className="material-symbols-outlined">arrow_back</span></button>
        <span className="text-[11px] font-black text-secondary dark:text-white uppercase tracking-[0.4em]">Fudaydiye Protocol</span>
        <div className="size-11"></div>
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar pb-32 px-6 max-w-4xl mx-auto w-full">
        {step === 'SELECT_ROLE' ? renderRoleSelection() : renderForm()}
      </div>
    </div>
  );
};

export default Register;
