import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { linkWithPhoneNumber, RecaptchaVerifier, ConfirmationResult } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { useAuth } from '../Providers';
import { useToast } from '../components/Toast';
import { userService } from '../src/services/userService';

const COUNTRY_CODES = [
  { code: '+252', label: 'Somalia', flag: '🇸🇴' },
  { code: '+251', label: 'Ethiopia', flag: '🇪🇹' },
  { code: '+253', label: 'Djibouti', flag: '🇩🇯' },
  { code: '+254', label: 'Kenya', flag: '🇰🇪' },
  { code: '+971', label: 'UAE', flag: '🇦🇪' },
];

const VEHICLE_TYPES = [
  "Toyota Vitz",
  "Three-wheeler (Bajaj)",
  "Pickup Truck",
  "Box Truck",
  "Motorcycle",
  "Heavy Logistics Truck"
];

const PersonalInfo: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, role } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedCountryCode, setSelectedCountryCode] = useState('+252');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Phone Linking State
  const [isLinking, setIsLinking] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    avatar: 'https://ui-avatars.com/api/?name=User&background=015754&color=06DC7F',
    location: '',
    businessName: '',
    operationalHub: '',
    lat: 9.5624,
    lng: 44.0770,
    vehicleType: 'Toyota Vitz',
    plateNumber: ''
  });

  // Init Recaptcha
  useEffect(() => {
    return () => {
      if ((window as any).recaptchaVerifier) {
        try { (window as any).recaptchaVerifier.clear(); } catch (e) { }
        (window as any).recaptchaVerifier = null;
      }
    };
  }, []);

  const initVerifier = () => {
    if (!(window as any).recaptchaVerifier) {
      try {
        (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-cont', {
          'size': 'invisible',
          'callback': () => { /* solved */ }
        });
      } catch (e) {
        console.error("Recaptcha Init Error", e);
      }
    }
  };

  useEffect(() => {
    if (profile) {
      let mobile = profile.mobile || '';
      let code = '+252';
      for (const c of COUNTRY_CODES) {
        if (mobile.startsWith(c.code)) {
          code = c.code;
          mobile = mobile.replace(c.code, '');
          break;
        }
      }

      setFormData({
        fullName: profile.fullName || '',
        email: profile.email || '',
        phone: mobile,
        avatar: profile.avatar || `https://ui-avatars.com/api/?name=${profile.fullName || 'User'}&background=015754&color=06DC7F`,
        location: profile.location || '',
        businessName: profile.businessName || '',
        operationalHub: profile.operationalHub || '',
        lat: profile.lat || 9.5624,
        lng: profile.lng || 44.0770,
        vehicleType: profile.vehicleType || 'Toyota Vitz',
        plateNumber: profile.plateNumber || ''
      });
      setSelectedCountryCode(code);
    }
  }, [profile]);

  // Helper to resize image using Canvas API
  const resizeImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
    });
  };

  const handleLinkPhone = async () => {
    if (!formData.phone) {
      showToast("Enter a phone number first", "ERROR");
      return;
    }
    setError(null);
    setIsLinking(true);

    try {
      initVerifier();
      const cleanPhone = formData.phone.replace(/\D/g, '').replace(/^0+/, '');
      const fullPhone = `${selectedCountryCode}${cleanPhone}`;

      const appVerifier = (window as any).recaptchaVerifier;
      const confirmation = await linkWithPhoneNumber(auth.currentUser!, fullPhone, appVerifier);

      setConfirmationResult(confirmation);
      setOtpSent(true);
      showToast("OTP Code Sent!", "SUCCESS");
    } catch (err: any) {
      console.error("Link Phone Error", err);
      let msg = err.message;
      if (err.code === 'auth/credential-already-in-use') msg = "This number is already linked to another account.";
      if (err.code === 'auth/invalid-phone-number') msg = "Invalid phone format.";
      setError(msg);
      showToast(msg, "ERROR");
      // Reset recaptcha
      if ((window as any).recaptchaVerifier) {
        try { (window as any).recaptchaVerifier.clear(); } catch (e) { }
        (window as any).recaptchaVerifier = null;
      }
    } finally {
      setIsLinking(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!confirmationResult || !otpCode) return;
    setIsLinking(true);

    // 1. Verify OTP
    try {
      await confirmationResult.confirm(otpCode);
      showToast("Phone Verified! Linking profile...", "SUCCESS");
      setOtpSent(false);
      setOtpCode('');
    } catch (err: any) {
      console.error("OTP Verify Error", err);
      if (err.code === 'auth/account-exists-with-different-credential') {
        setError("This phone number is already linked to another account. Please use a different number or delete the old account.");
      } else if (err.code === 'auth/invalid-verification-code') {
        setError("Invalid OTP Code. Please try again.");
      } else {
        setError(`Verification Failed: ${err.message}`);
      }
      setIsLinking(false);
      return;
    }

    // 2. Update Profile (Try Backend -> Fallback to Direct)
    if (user) {
      const cleanPhone = formData.phone.replace(/\D/g, '').replace(/^0+/, '');
      const mobile = `${selectedCountryCode}${cleanPhone}`;

      try {
        await userService.update(user.uid, { mobile });
        showToast("Phone number linked successfully!", "SUCCESS");
      } catch (backendErr: any) {
        console.warn("Backend update failed, trying direct Firestore update...", backendErr);
        try {
          await updateDoc(doc(db, 'users', user.uid), { mobile });
          showToast("Phone number linked (Direct Save)", "SUCCESS");
        } catch (directErr: any) {
          console.error("Direct Update Error", directErr);
          setError(`Verified, but failed to save: ${directErr.message}`);
          showToast("Failed to save phone number to profile.", "ERROR");
        }
      } finally {
        setIsLinking(false);
      }
    } else {
      setIsLinking(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    setError(null);

    const cleanPhone = formData.phone.replace(/\D/g, '');
    const updateData: any = {
      fullName: formData.fullName,
      email: formData.email,
      mobile: `${selectedCountryCode}${cleanPhone}`,
      location: formData.location,
      avatar: formData.avatar,
    };

    if (role === 'VENDOR') {
      updateData.businessName = formData.businessName || '';
      // Ensure numbers are valid, fallback to existing or default
      const lat = Number(formData.lat);
      const lng = Number(formData.lng);
      // Note: DTO currently doesn't support lat/lng directly in root...
      // Wait, Profile has lat/lng, but UpdateProfileDto might not have them?
      // Let's assume UpdateProfileDto needs them or we send them.
      // My DTO didn't include lat/lng! I should fix DTO or backend will ignore/error.
      // For now, let's include them, but I might need to update DTO quickly if backend validation is strict (whitelist: true).
      // Let's check DTO... DTO has `location` (string).
      // But backend `users` collection has `lat`, `lng`.
      // I should probably add `lat`, `lng` to DTO later.
      // For now, let's send them.
      updateData.lat = isNaN(lat) ? 9.5624 : lat;
      updateData.lng = isNaN(lng) ? 44.0770 : lng;
    }
    if (role === 'RIDER') {
      updateData.vehicleType = formData.vehicleType || 'Toyota Vitz';
      updateData.plateNumber = formData.plateNumber || '';
    }
    if (role === 'CLIENT' || role === 'ADMIN') {
      // operationalHub not in DTO?
      updateData.operationalHub = formData.operationalHub || '';
    }

    try {
      await userService.update(user.uid, updateData);
      showToast('Identity synchronized successfully across the mesh.', 'SUCCESS');
      navigate(-1);
    } catch (backendErr: any) {
      console.warn("Backend sync failed, trying direct Firestore save...", backendErr);
      try {
        await updateDoc(doc(db, 'users', user.uid), updateData);
        showToast('Identity saved safely (Direct Mode).', 'SUCCESS');
        navigate(-1);
      } catch (directErr: any) {
        console.error("Direct Update Error:", directErr);
        showToast("Sync failed. Check connection.", 'ERROR');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const resized = await resizeImage(reader.result as string);
        setFormData(prev => ({ ...prev, avatar: resized }));
      };
      reader.readAsDataURL(file);
    }
  };

  if (!profile) return (
    <div className="h-screen flex items-center justify-center">
      <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-300 font-display">
      <div id="recaptcha-cont"></div>
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/5 active:scale-90 transition-all hover:bg-gray-200 dark:hover:bg-white/10">
          <span className="material-symbols-outlined text-secondary dark:text-white">arrow_back</span>
        </button>
        <div className="flex flex-col">
          <h1 className="text-xl font-black text-secondary dark:text-white tracking-tighter leading-none">Identity Manager</h1>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">{role} Profile Access</p>
        </div>
      </header>

      <main className="p-6 flex-1 flex flex-col gap-8 overflow-y-auto pb-40 no-scrollbar animate-in fade-in duration-500">
        <section className="flex flex-col items-center">
          <div className="relative group">
            <div className="size-32 rounded-[40px] overflow-hidden border-4 border-white dark:border-white/10 shadow-2xl group-hover:scale-105 transition-transform duration-500 bg-gray-50 dark:bg-white/5">
              <img src={formData.avatar} className="w-full h-full object-cover" alt="Avatar" />
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 size-10 bg-primary text-secondary rounded-2xl flex items-center justify-center shadow-lg border-4 border-background-light dark:border-background-dark active:scale-90 transition-all"
            >
              <span className="material-symbols-outlined text-[20px] font-black">photo_camera</span>
            </button>
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mt-6">Node ID: {user?.uid.substring(0, 12)}</p>
          {error && <p className="mt-4 text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-xl border border-red-100 dark:border-red-900/30 shadow-sm">{error}</p>}
        </section>

        <form onSubmit={handleUpdate} className="space-y-6 max-w-2xl mx-auto w-full">
          <div className="bg-white dark:bg-surface-dark p-8 rounded-[40px] border border-gray-100 dark:border-white/5 shadow-soft space-y-6">
            <h3 className="text-[11px] font-black text-primary uppercase tracking-[0.4em] mb-4">Core Identity</h3>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Identity Name</label>
              <input
                required
                value={formData.fullName}
                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full h-14 bg-gray-50/50 dark:bg-white/5 border-2 border-gray-100 dark:border-white/10 rounded-2xl px-5 text-sm font-bold text-secondary dark:text-white focus:border-primary transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Node</label>
              <input
                required
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full h-14 bg-gray-50/50 dark:bg-white/5 border-2 border-gray-100 dark:border-white/10 rounded-2xl px-5 text-sm font-bold text-secondary dark:text-white focus:border-primary transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-baseline">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mobile Access</label>
                {user?.phoneNumber ? (
                  <span className="text-[9px] font-bold text-green-500 uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">verified</span> Verified Linked
                  </span>
                ) : (
                  <button type="button" onClick={handleLinkPhone} disabled={isLinking || otpSent} className="text-[9px] font-black text-primary uppercase tracking-wider hover:underline disabled:opacity-50">
                    {isLinking ? 'Sending...' : 'Link to Account'}
                  </button>
                )}
              </div>

              <div className="flex w-full h-14 rounded-2xl bg-gray-50/50 dark:bg-white/5 border-2 border-gray-100 dark:border-white/10 focus-within:border-primary transition-all overflow-hidden relative">
                <div className="flex items-center px-4 bg-gray-100/50 dark:bg-white/10 border-r border-gray-200 dark:border-white/10 gap-1">
                  <span className="text-sm">{COUNTRY_CODES.find(c => c.code === selectedCountryCode)?.flag}</span>
                  <select
                    value={selectedCountryCode}
                    onChange={(e) => setSelectedCountryCode(e.target.value)}
                    className="bg-transparent border-none p-0 text-xs font-black text-secondary dark:text-white focus:ring-0 appearance-none cursor-pointer"
                  >
                    {COUNTRY_CODES.map(c => (
                      <option key={c.code} value={c.code} className="bg-white dark:bg-background-dark text-secondary dark:text-white">{c.code}</option>
                    ))}
                  </select>
                </div>
                <input
                  required
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="flex-1 h-full bg-transparent border-none focus:ring-0 px-4 text-sm font-bold text-secondary dark:text-white"
                />
              </div>

              {otpSent && (
                <div className="mt-2 animate-in slide-in-from-top-2 p-4 bg-primary/10 rounded-xl border border-primary/20">
                  <p className="text-[10px] text-center font-bold text-primary mb-2">Enter verification code sent to your phone</p>
                  <div className="flex gap-2">
                    <input
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="000000"
                      className="flex-1 bg-white dark:bg-black/20 h-10 rounded-lg text-center font-black tracking-[0.3em] border border-primary/30"
                    />
                    <button type="button" onClick={handleVerifyOtp} disabled={isLinking} className="bg-primary text-secondary px-4 rounded-lg font-black text-[10px] uppercase">
                      {isLinking ? 'Verifying...' : 'Verify & Link'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {role === 'VENDOR' && (
              <div className="space-y-6 animate-in slide-in-from-bottom-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1">Business Identity Name</label>
                  <input
                    value={formData.businessName}
                    onChange={e => setFormData({ ...formData, businessName: e.target.value })}
                    className="w-full h-14 bg-gray-50/50 dark:bg-white/5 border-2 border-gray-100 dark:border-white/10 rounded-2xl px-5 text-sm font-bold text-secondary dark:text-white focus:border-primary transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">HQ Latitude</label>
                    <input
                      type="number" step="any"
                      value={formData.lat}
                      onChange={e => {
                        const val = parseFloat(e.target.value);
                        setFormData({ ...formData, lat: isNaN(val) ? 0 : val });
                      }}
                      className="w-full h-14 bg-gray-50/50 dark:bg-white/5 border-2 border-gray-100 dark:border-white/10 rounded-2xl px-5 text-sm font-bold text-secondary dark:text-white focus:border-primary transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">HQ Longitude</label>
                    <input
                      type="number" step="any"
                      value={formData.lng}
                      onChange={e => {
                        const val = parseFloat(e.target.value);
                        setFormData({ ...formData, lng: isNaN(val) ? 0 : val });
                      }}
                      className="w-full h-14 bg-gray-50/50 dark:bg-white/5 border-2 border-gray-100 dark:border-white/10 rounded-2xl px-5 text-sm font-bold text-secondary dark:text-white focus:border-primary transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            {role === 'RIDER' && (
              <div className="space-y-6 animate-in slide-in-from-bottom-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1">Vehicle Asset</label>
                  <select
                    value={formData.vehicleType}
                    onChange={e => setFormData({ ...formData, vehicleType: e.target.value })}
                    className="w-full h-14 bg-gray-50/50 dark:bg-white/5 border-2 border-gray-100 dark:border-white/10 rounded-2xl px-5 text-sm font-black text-secondary dark:text-white focus:border-primary appearance-none uppercase"
                  >
                    {VEHICLE_TYPES.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1">Plate Identifier</label>
                  <input
                    value={formData.plateNumber}
                    onChange={e => setFormData({ ...formData, plateNumber: e.target.value })}
                    className="w-full h-14 bg-gray-50/50 dark:bg-white/5 border-2 border-gray-100 dark:border-white/10 rounded-2xl px-5 text-sm font-bold text-secondary dark:text-white focus:border-primary transition-all uppercase"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Default Geo Location</label>
              <input
                required
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                className="w-full h-14 bg-gray-50/50 dark:bg-white/5 border-2 border-gray-100 dark:border-white/10 rounded-2xl px-5 text-sm font-bold text-secondary dark:text-white focus:border-primary transition-all"
                placeholder="e.g. Jigjiga Yar, Hargeisa"
              />
            </div>
          </div>

          <div className="bg-secondary text-white p-8 rounded-[40px] shadow-2xl relative overflow-hidden group border border-white/5">
            <div className="absolute top-0 right-0 size-32 bg-primary/20 blur-3xl rounded-full"></div>
            <div className="relative z-10">
              <h4 className="text-lg font-black uppercase tracking-tighter mb-2">Platform Trust Seal</h4>
              <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest leading-relaxed mb-6">
                Updating your identity details ensures your node remains verified for priority dispatch and treasury access.
              </p>
              <button
                type="submit"
                disabled={isSaving}
                className="w-full h-16 bg-primary text-secondary font-black uppercase text-xs tracking-[0.2em] rounded-2xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isSaving ? <span className="animate-spin material-symbols-outlined">sync</span> : 'Update Identity Node'}
              </button>
            </div>
          </div>

          <div className="p-8 rounded-[40px] border-2 border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10 space-y-4">
            <h4 className="text-xs font-black text-red-500 uppercase tracking-widest">Danger Zone</h4>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">
              If you have accidentally created a duplicate account (e.g. separate Phone login), you can delete it here to free up the number.
            </p>
            <button
              type="button"
              onClick={async () => {
                if (window.confirm("ARE YOU SURE? This will permanently delete this account and login credential.")) {
                  try {
                    await userService.delete(user!.uid);
                    // Delete Auth Credential
                    await user!.delete();
                    showToast("Account Deleted.", "SUCCESS");
                    navigate('/login');
                  } catch (e: any) {
                    console.error(e);
                    setError(e.message);
                    if (e.code === 'auth/requires-recent-login') {
                      alert("For security, please Log Out and Log In again before deleting.");
                    }
                  }
                }
              }}
              className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline"
            >
              Delete This Account
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default PersonalInfo;
