
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signInWithEmailAndPassword, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserRole } from '../types';
import logo from '../assets/icon.png';

interface LoginProps {
  onLogin: () => void;
  setAppRole: (role: UserRole) => void;
}

const COUNTRY_CODES = [
  { code: '+252', label: 'Somalia', flag: '🇸🇴' },
  { code: '+251', label: 'Ethiopia', flag: '🇪🇹' },
  { code: '+253', label: 'Djibouti', flag: '🇩🇯' },
  { code: '+254', label: 'Kenya', flag: '🇰🇪' },
  { code: '+971', label: 'UAE', flag: '🇦🇪' },
];

const Login: React.FC<LoginProps> = ({ onLogin, setAppRole }) => {
  const [method, setMethod] = useState<'phone' | 'email'>('email');
  const [inputValue, setInputValue] = useState('');
  const [password, setPassword] = useState('');
  const [selectedCountryCode, setSelectedCountryCode] = useState('+252');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  // OTP States
  const [isOtpMode, setIsOtpMode] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  // Initialize Recaptcha
  useEffect(() => {
    if ((window as any).recaptchaVerifier) return;

    try {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': () => {
          // reCAPTCHA solved
        }
      });
    } catch (e) {
      console.error("Recaptcha Init Error", e);
    }
  }, []);

  const normalizePhone = (num: string) => {
    return num.replace(/\D/g, '').replace(/^0+/, '');
  };

  const handleSendOtp = async () => {
    if (method === 'email') {
      setError("Email OTP not yet supported. Please use Password or Phone.");
      return;
    }

    setError(null);
    setIsLoading(true);

    const cleanMobile = normalizePhone(inputValue);
    const identifier = `${selectedCountryCode}${cleanMobile}`;

    if (!cleanMobile) {
      setError("Please enter a valid phone number.");
      setIsLoading(false);
      return;
    }

    try {
      const appVerifier = (window as any).recaptchaVerifier;
      const confirmation = await signInWithPhoneNumber(auth, identifier, appVerifier);
      setConfirmationResult(confirmation);
      setOtpSent(true);
    } catch (err: any) {
      console.error("OTP Request Failed", err);
      let msg = "Failed to send code.";
      if (err.code === 'auth/captcha-check-failed') msg = "Security check failed. Please refresh.";
      else if (err.code === 'auth/invalid-phone-number') msg = "Invalid format. Use +252...";
      else if (err.message.includes('reCAPTCHA')) msg = "Domain not verified. Check Firebase Console.";
      else msg = err.message || "SMS Service Error.";

      setError(msg);
      if ((window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier.clear();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!confirmationResult) {
      setError("Session expired. Request new code.");
      return;
    }

    setError(null);
    setIsVerifying(true);

    try {
      const result = await confirmationResult.confirm(otpCode);
      const user = result.user;
      await onLoginSuccess(user.uid);
    } catch (err: any) {
      console.error("OTP Verification Failed", err);
      setError("Invalid code. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const onLoginSuccess = async (uid: string) => {
    try {
      let userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        const profileData = userDoc.data();
        const actualRole = profileData.role as UserRole;
        setAppRole(actualRole);
        onLogin();

        const routes: Record<UserRole, string> = {
          CUSTOMER: '/customer',
          VENDOR: '/vendor',
          RIDER: '/rider',
          CLIENT: '/client',
          ADMIN: '/admin',
          FUDAYDIYE_ADMIN: '/admin'
        };

        navigate(routes[actualRole] || '/customer');
      } else {
        setError("Number not registered. We could not find a profile linked to this account.");
      }
    } catch (err: any) {
      console.error("Login Success Error", err);
      if (err.code === 'permission-denied') {
        setError("Access Denied: Account exists but is locked.");
      } else {
        setError("Failed to fetch profile. " + err.message);
      }
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue) return;

    if (isOtpMode) {
      if (!otpSent) {
        handleSendOtp();
      } else {
        handleVerifyOtp();
      }
      return;
    }

    if (!password) return;
    setError(null);
    setIsLoading(true);

    let emailToUse = '';
    if (method === 'email') {
      emailToUse = inputValue.trim();
    } else {
      const cleanMobile = normalizePhone(inputValue);
      emailToUse = `${selectedCountryCode}${cleanMobile}@fudaydiye.so`;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, emailToUse, password);
      await onLoginSuccess(userCredential.user.uid);
    } catch (err: any) {
      console.error("Login System Error:", err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError("Access Denied. Check credentials.");
      } else {
        setError(`Identity Error: ${err.code || 'Sync Failure'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col min-h-screen overflow-y-auto bg-background-light dark:bg-background-dark transition-colors duration-500 font-display pb-32">
      <div id="recaptcha-container"></div>
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-cover bg-center opacity-[0.1] grayscale" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=2074&auto=format&fit=crop")' }}></div>
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/20 via-background-light/60 to-background-light dark:from-primary/5 dark:via-background-dark/80 dark:to-background-dark pointer-events-none"></div>
      </div>

      <div className="relative z-20 flex flex-col items-center pt-24">
        <div className="size-24 bg-white dark:bg-white/10 rounded-[28px] flex items-center justify-center shadow-2xl animate-float border border-white/10 p-4">
          <img src={logo} alt="Fudaydiye" className="w-full h-full object-contain" />
        </div>
        <div className="mt-8 text-center px-8">
          <h1 className="text-3xl font-black tracking-tight text-secondary dark:text-white mb-2 uppercase">Gatekeeper</h1>
          <div className="flex items-center gap-2 justify-center">
            <span className="text-[10px] font-black text-secondary/40 dark:text-primary/40 uppercase tracking-[0.3em]">Identity Protocol 2.5.1</span>
          </div>
          {error && <p className="mt-6 text-[10px] font-black text-red-500 bg-red-50 dark:bg-red-500/10 py-3 px-6 rounded-2xl border border-red-100 dark:border-red-500/20 animate-shake">{error}</p>}
        </div>
      </div>

      <div className="mt-auto relative z-30 w-full bg-white/95 dark:bg-surface-dark/95 backdrop-blur-2xl rounded-t-[48px] p-10 pb-16 shadow-[0_-20px_80px_rgba(0,0,0,0.2)] border-t border-white/10">
        <form onSubmit={handleLogin} className="flex flex-col gap-8 max-w-sm mx-auto">
          <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-2xl border border-gray-200 dark:border-white/10 relative">
            <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-secondary dark:bg-primary rounded-xl transition-all duration-500 ease-out shadow-lg ${method === 'phone' ? 'left-1' : 'left-[50%]'}`} />
            <button type="button" onClick={() => setMethod('phone')} className={`relative z-10 flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-colors ${method === 'phone' ? 'text-primary dark:text-secondary' : 'text-gray-400'}`}>Phone</button>
            <button type="button" onClick={() => setMethod('email')} className={`relative z-10 flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-colors ${method === 'email' ? 'text-primary dark:text-secondary' : 'text-gray-400'}`}>Email</button>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => { setIsOtpMode(!isOtpMode); setOtpSent(false); setError(null); }}
              className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary-dark transition-colors"
            >
              {isOtpMode ? 'Use Password' : 'Use OTP Code'}
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{method === 'phone' ? 'Mobile' : 'Email Address'}</label>
            <div className="h-16 rounded-3xl bg-gray-50/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center px-6 gap-4 focus-within:border-primary transition-all shadow-inner">
              {method === 'phone' && (
                <select value={selectedCountryCode} onChange={(e) => setSelectedCountryCode(e.target.value)} className="bg-transparent border-none p-0 text-sm font-black text-secondary dark:text-white focus:ring-0 appearance-none">
                  {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                </select>
              )}
              <input
                className="bg-transparent border-none focus:ring-0 text-sm font-bold flex-1 text-secondary dark:text-white placeholder:text-gray-300"
                placeholder={method === 'phone' ? '63 444 1122' : 'e.g. vendor1@fudaydiye.so'}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={otpSent}
              />
            </div>
          </div>

          {!isOtpMode ? (
            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Secure Password</label>
              <div className="h-16 rounded-3xl bg-gray-50/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center px-6 focus-within:border-primary transition-all shadow-inner">
                <input
                  className="bg-transparent border-none focus:ring-0 text-sm font-bold flex-1 text-secondary dark:text-white placeholder:text-gray-300"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          ) : (
            otpSent && (
              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                <div className="flex justify-between items-baseline">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Verification Code</label>
                  <span className="text-[9px] font-bold text-primary">Check your messages</span>
                </div>
                <div className="h-16 rounded-3xl bg-gray-50/50 dark:bg-white/5 border border-primary flex items-center px-6 focus-within:border-primary transition-all shadow-inner">
                  <input
                    className="bg-transparent border-none focus:ring-0 text-center text-lg font-black tracking-[0.5em] flex-1 text-secondary dark:text-white placeholder:text-gray-300"
                    type="text"
                    maxLength={6}
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    placeholder="000000"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                  />
                </div>
                <p className="text-[10px] text-gray-400 text-center pt-2">
                  Didn't receive it? <button type="button" onClick={() => { setOtpSent(false); handleSendOtp(); }} className="underline hover:text-primary">Resend</button>
                </p>
              </div>
            )
          )}

          <button
            disabled={isLoading || isVerifying || !inputValue || (isOtpMode && otpSent && !otpCode)}
            className="w-full h-16 bg-primary text-secondary font-black text-xs uppercase tracking-[0.3em] rounded-button shadow-primary-glow flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading || isVerifying ?
              <span className="animate-spin material-symbols-outlined">sync</span> :
              (isOtpMode ? (otpSent ? 'Verify Code' : 'Send Code') : 'Authorize Session')
            }
          </button>

          <div className="flex flex-col items-center gap-6 mt-2">
            <button type="button" onClick={() => navigate('/register')} className="text-[10px] font-black text-secondary dark:text-primary uppercase tracking-widest underline decoration-2 underline-offset-8">Create Profile</button>
            <div className="flex items-center gap-4 w-full px-12">
              <div className="h-px bg-gray-200 dark:bg-white/10 flex-1"></div>
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">OR</span>
              <div className="h-px bg-gray-200 dark:bg-white/10 flex-1"></div>
            </div>
            <button type="button" onClick={() => navigate('/')} className="text-[10px] font-black text-gray-400 hover:text-primary uppercase tracking-widest transition-colors">Continue as Guest</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
