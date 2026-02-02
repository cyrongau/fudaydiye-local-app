
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCountryCode, setSelectedCountryCode] = useState('+252');

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobile: '',
    password: '',
  });

  const normalizePhone = (num: string) => {
    return num.replace(/\D/g, '').replace(/^0+/, '');
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const cleanMobile = normalizePhone(formData.mobile);
      const identityEmail = formData.email || `${selectedCountryCode}${cleanMobile}@fudaydiye.so`;

      const { api } = await import('../src/services/api');

      const payload = {
        email: identityEmail,
        password: formData.password,
        fullName: formData.fullName,
        mobile: `${selectedCountryCode}${cleanMobile}`,
        role: 'CUSTOMER', // Defaulting to Customer
      };

      const res = await api.post('/auth/register', payload);

      if (res.data.success && res.data.token) {
        const { signInWithCustomToken } = await import('firebase/auth');
        await signInWithCustomToken(auth, res.data.token);

        setAppRole('CUSTOMER');
        onRegister();
        navigate('/customer');
      }

    } catch (err: any) {
      console.error("Registration Error:", err);
      setError(err.response?.data?.message || err.message || 'Registration failure.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col h-screen overflow-hidden bg-background-light dark:bg-background-dark transition-colors duration-300">
      <div className="absolute inset-0 grid-overlay opacity-20"></div>
      <div className="relative z-20 flex items-center justify-between p-6 pt-12">
        <button onClick={handleBack} className="size-11 rounded-full bg-white/20 dark:bg-white/5 border border-secondary/10 dark:border-white/10 flex items-center justify-center text-secondary dark:text-white"><span className="material-symbols-outlined">arrow_back</span></button>
        <span className="text-[11px] font-black text-secondary dark:text-white uppercase tracking-[0.4em]">Fudaydiye Registration</span>
        <div className="size-11"></div>
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar pb-32 px-6 max-w-4xl mx-auto w-full flex flex-col">

        <div className="flex flex-col flex-1 animate-in slide-in-from-right duration-500 py-4">
          <div className="bg-white dark:bg-black/30 backdrop-blur-xl rounded-[40px] p-8 md:p-12 w-full border border-secondary/5 dark:border-primary/10 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] mb-10 mt-4">
            <div className="flex flex-col items-center mb-10 text-center">
              <h2 className="text-3xl font-black text-secondary dark:text-white mb-2 tracking-tighter uppercase">Join Fudaydiye</h2>
              <p className="text-[10px] font-black text-secondary/60 dark:text-white/60 uppercase tracking-[0.3em]">Create your account</p>
              {error && <p className="mt-6 text-[10px] font-black text-red-500 bg-red-50 p-4 rounded-2xl border border-red-100 animate-bounce uppercase tracking-widest">{error}</p>}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-secondary/50 dark:text-white/50 uppercase tracking-widest ml-1">Full Name</label>
                <input required placeholder="Enter full name..." className="w-full h-16 rounded-[24px] bg-gray-50 dark:bg-white/5 border-2 border-gray-100 dark:border-white/10 focus:border-primary text-secondary dark:text-white text-base font-bold px-6 shadow-inner focus:outline-none transition-all" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-secondary/50 dark:text-white/50 uppercase tracking-widest ml-1">Email Address (Optional)</label>
                <input type="email" placeholder="name@example.com" className="w-full h-16 rounded-[24px] bg-gray-50 dark:bg-white/5 border-2 border-gray-100 dark:border-white/10 focus:border-primary text-secondary dark:text-white text-base font-bold px-6 shadow-inner focus:outline-none transition-all" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-secondary/50 dark:text-white/50 uppercase tracking-widest ml-1">Mobile Number</label>
                <div className="flex w-full h-16 rounded-[24px] bg-gray-50 dark:bg-white/5 border-2 border-gray-100 dark:border-white/10 focus-within:border-primary overflow-hidden shadow-inner transition-all">
                  <div className="flex items-center px-4 bg-gray-100/50 dark:bg-white/10 border-r border-gray-200 dark:border-white/10 gap-2">
                    <span className="text-lg">{COMMON_COUNTRY_CODES.find(c => c.code === selectedCountryCode)?.flag}</span>
                    <select value={selectedCountryCode} onChange={(e) => setSelectedCountryCode(e.target.value)} className="bg-transparent border-none p-0 text-xs font-black text-secondary dark:text-white focus:ring-0 appearance-none cursor-pointer outline-none">
                      {COMMON_COUNTRY_CODES.map(c => <option key={c.code} value={c.code} className="bg-white dark:bg-dark-base text-secondary dark:text-white">{c.code} ({c.label})</option>)}
                    </select>
                  </div>
                  <input required type="tel" placeholder="63 444 1122" className="bg-transparent border-none focus:ring-0 text-secondary dark:text-white text-base font-bold px-6 flex-1 outline-none" value={formData.mobile} onChange={(e) => setFormData({ ...formData, mobile: e.target.value })} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-secondary/50 dark:text-white/50 uppercase tracking-widest ml-1">Password</label>
                <input required type="password" placeholder="••••••••" className="w-full h-16 rounded-[24px] bg-gray-50 dark:bg-white/5 border-2 border-gray-100 dark:border-white/10 focus:border-primary text-base font-bold px-6 shadow-inner focus:outline-none transition-all" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
              </div>

              <div className="flex gap-4 pt-10">
                <button type="submit" disabled={isLoading} className="flex-1 h-16 bg-primary text-secondary font-black text-xs uppercase tracking-[0.3em] rounded-[24px] shadow-primary-glow flex items-center justify-center gap-3 active:scale-[0.98] transition-all">
                  {isLoading ? <span className="animate-spin material-symbols-outlined">sync</span> : 'Initialize Account'}
                </button>
              </div>
            </form>
            <div className="mt-8 text-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Already a member? <span onClick={() => navigate('/login')} className="text-primary cursor-pointer hover:underline">Sign In</span>
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Register;
