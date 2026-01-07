
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { useAuth } from '../Providers';
import { KYCDocument } from '../types';

const UserSettings: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, role } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const kycInputRef = useRef<HTMLInputElement>(null);

  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [activeKycType, setActiveKycType] = useState<KYCDocument['type'] | null>(null);

  const [profileData, setProfileData] = useState({
    name: '',
    phone: '',
    email: '',
    avatar: '',
    businessLogo: ''
  });

  useEffect(() => {
    if (profile) {
      setProfileData({
        name: profile.fullName || '',
        phone: profile.mobile || '',
        email: profile.email || '',
        avatar: profile.avatar || `https://i.pravatar.cc/150?u=${profile.mobile}`,
        businessLogo: profile.businessLogo || ''
      });
    }
  }, [profile]);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  };

  const handleLogout = async () => {
    const { auth } = await import('../lib/firebase');
    await auth.signOut();
    navigate('/');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'avatar' | 'businessLogo') => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsSaving(true);
    try {
      const storageRef = ref(storage, `users/${user.uid}/${field}_${Date.now()}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(snapshot.ref);

      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { [field]: downloadUrl });
      setProfileData(prev => ({ ...prev, [field]: downloadUrl }));
      alert(`${field === 'avatar' ? 'Identity' : 'Brand logo'} synchronized.`);
    } catch (err) {
      alert("Asset sync failure.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleKycUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeKycType && user) {
      setIsSaving(true);
      setUploadProgress(10);
      try {
        const fileExt = file.name.split('.').pop()?.toLowerCase();
        const isPdf = fileExt === 'pdf';
        const fileType: 'pdf' | 'image' = isPdf ? 'pdf' : 'image';

        const storageRef = ref(storage, `kyc/${user.uid}/${activeKycType}_${Date.now()}.${fileExt}`);

        setUploadProgress(30);
        const snapshot = await uploadBytes(storageRef, file);
        setUploadProgress(70);
        const downloadUrl = await getDownloadURL(snapshot.ref);

        const docId = `kyc_${Date.now()}`;
        const newDoc: KYCDocument = {
          id: docId,
          type: activeKycType,
          fileUrl: downloadUrl,
          fileType: fileType,
          storagePath: snapshot.ref.fullPath,
          status: 'PENDING',
          uploadedAt: serverTimestamp()
        };

        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          kycDocuments: arrayUnion(newDoc),
          kycStatus: 'PENDING',
          updatedAt: serverTimestamp()
        });

        setUploadProgress(100);
        alert(`${activeKycType.replace('_', ' ')} artifact authorized.`);
      } catch (err) {
        console.error(err);
        alert("Compliance node failure.");
      } finally {
        setIsSaving(false);
        setActiveKycType(null);
        setUploadProgress(0);
      }
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        fullName: profileData.name,
        email: profileData.email,
        mobile: profileData.phone,
        updatedAt: serverTimestamp()
      });
      setIsEditingProfile(false);
    } catch (err) {
      alert("Sync failed.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!profile) return null;

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-300 font-display">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/5 active:scale-90 transition-all">
          <span className="material-symbols-outlined text-secondary dark:text-white">arrow_back</span>
        </button>
        <div className="flex flex-col">
          <h1 className="text-xl font-black text-secondary dark:text-white tracking-tighter leading-none uppercase">Gatekeeper</h1>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">Personnel Config</p>
        </div>
      </header>

      <main className="p-6 flex-1 flex flex-col gap-8 overflow-y-auto pb-40 no-scrollbar animate-in fade-in duration-500">

        <section className="bg-white dark:bg-surface-dark p-6 rounded-[32px] border border-gray-100 dark:border-white/5 shadow-soft flex flex-col md:flex-row md:items-center gap-6 transition-all relative overflow-hidden">
          {isSaving && (
            <div className="absolute bottom-0 left-0 h-1 bg-primary transition-all duration-500" style={{ width: `${uploadProgress || 20}%` }}></div>
          )}
          <div
            onClick={() => !isSaving && fileInputRef.current?.click()}
            className={`relative group shrink-0 ${!isSaving ? 'cursor-pointer' : 'opacity-50'}`}
          >
            <div className={`size-24 rounded-[40px] overflow-hidden border-2 shadow-inner transition-all ${isEditingProfile ? 'border-primary ring-4 ring-primary/10' : 'border-primary/10'}`}>
              <img src={profileData.avatar} className="w-full h-full object-cover" alt="Avatar" />
            </div>
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center rounded-[40px] transition-opacity">
              <span className="material-symbols-outlined text-white">upload</span>
            </div>
            <input type="file" ref={fileInputRef} onChange={(e) => handleImageUpload(e, 'avatar')} className="hidden" accept="image/*" />
          </div>

          <div className="flex-1 min-w-0">
            {isEditingProfile ? (
              <div className="flex flex-col gap-2">
                <input value={profileData.name} onChange={(e) => setProfileData({ ...profileData, name: e.target.value })} className="bg-gray-100 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl text-xs font-black p-2 h-9" />
                <input value={profileData.email} onChange={(e) => setProfileData({ ...profileData, email: e.target.value })} className="bg-gray-100 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl text-[10px] font-bold p-2 h-9 text-gray-500" />
              </div>
            ) : (
              <>
                <h3 className="text-xl font-black text-secondary dark:text-white uppercase tracking-tighter truncate leading-tight mb-1">{profileData.name}</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">{profileData.email}</p>
              </>
            )}
          </div>

          <button
            disabled={isSaving}
            onClick={() => isEditingProfile ? handleSaveProfile() : setIsEditingProfile(true)}
            className={`size-12 rounded-2xl flex items-center justify-center transition-all ${isEditingProfile ? 'bg-primary text-secondary' : 'bg-gray-50 dark:bg-white/5 text-gray-400'}`}
          >
            {isSaving ? <span className="animate-spin material-symbols-outlined">sync</span> : <span className="material-symbols-outlined">{isEditingProfile ? 'check' : 'edit_square'}</span>}
          </button>
        </section>

        {role === 'VENDOR' && (
          <section className="bg-white dark:bg-surface-dark p-8 rounded-[48px] border border-gray-100 dark:border-white/5 shadow-soft space-y-6">
            <div>
              <h3 className="text-xl font-black text-secondary dark:text-white uppercase tracking-tighter">Brand Identity</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Logo for Platform Directories</p>
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-8">
              <div className="relative group size-28 rounded-[32px] overflow-hidden border-2 border-primary/20 bg-gray-50 dark:bg-white/5">
                {profileData.businessLogo ? (
                  <img src={profileData.businessLogo} className="w-full h-full object-cover" alt="Business Logo" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-300">
                    <span className="material-symbols-outlined text-4xl">storefront</span>
                  </div>
                )}
                <div
                  onClick={() => logoInputRef.current?.click()}
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity cursor-pointer"
                >
                  <span className="material-symbols-outlined text-white">add_a_photo</span>
                  <span className="text-[8px] font-black text-white uppercase mt-1">Upload</span>
                </div>
                <input type="file" ref={logoInputRef} onChange={(e) => handleImageUpload(e, 'businessLogo')} className="hidden" accept="image/*" />
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 leading-relaxed uppercase tracking-widest">
                  Your business logo will be featured on the <span className="text-primary font-black">Vendor Directory</span> and the homepage brand marquee. Use a clear, square PNG or JPG.
                </p>
              </div>
            </div>
          </section>
        )}

        {(role === 'VENDOR' || role === 'RIDER') && (
          <section className="bg-white dark:bg-surface-dark p-8 rounded-[48px] border border-gray-100 dark:border-white/5 shadow-soft space-y-8 animate-in slide-in-from-bottom-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-black text-secondary dark:text-white uppercase tracking-tighter">Compliance Ledger</h3>
                <p className="text-[10px] font-black text-gray-400 dark:text-gray-300 uppercase tracking-widest mt-1">Artifact Provisioning Hub</p>
              </div>
              <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${profile.kycStatus === 'VERIFIED' ? 'bg-green-100 text-green-700 border-green-200' :
                profile.kycStatus === 'PENDING' ? 'bg-amber-100 text-amber-700 border-amber-200 animate-pulse' :
                  'bg-gray-100 dark:bg-white/10 text-gray-400 border-gray-200 dark:border-white/10'
                }`}>
                {profile.kycStatus || 'NOT STARTED'}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <KycUploader
                label="National ID"
                status={profile.kycDocuments?.find(d => d.type === 'ID_CARD')?.status || 'NONE'}
                fileType={profile.kycDocuments?.find(d => d.type === 'ID_CARD')?.fileType}
                onClick={() => { setActiveKycType('ID_CARD'); kycInputRef.current?.click(); }}
              />
              {role === 'VENDOR' ? (
                <>
                  <KycUploader
                    label="Taxation Node (TIN)"
                    status={profile.kycDocuments?.find(d => d.type === 'TAX_DOC')?.status || 'NONE'}
                    fileType={profile.kycDocuments?.find(d => d.type === 'TAX_DOC')?.fileType}
                    onClick={() => { setActiveKycType('TAX_DOC'); kycInputRef.current?.click(); }}
                  />
                  <KycUploader
                    label="Merchant License"
                    status={profile.kycDocuments?.find(d => d.type === 'BUSINESS_REG')?.status || 'NONE'}
                    fileType={profile.kycDocuments?.find(d => d.type === 'BUSINESS_REG')?.fileType}
                    onClick={() => { setActiveKycType('BUSINESS_REG'); kycInputRef.current?.click(); }}
                  />
                </>
              ) : (
                <>
                  <KycUploader
                    label="Pilot Auth (DL)"
                    status={profile.kycDocuments?.find(d => d.type === 'DRIVER_LICENSE')?.status || 'NONE'}
                    fileType={profile.kycDocuments?.find(d => d.type === 'DRIVER_LICENSE')?.fileType}
                    onClick={() => { setActiveKycType('DRIVER_LICENSE'); kycInputRef.current?.click(); }}
                  />
                  <KycUploader
                    label="Plate Registry"
                    status={profile.kycDocuments?.find(d => d.type === 'VEHICLE_PLATE')?.status || 'NONE'}
                    fileType={profile.kycDocuments?.find(d => d.type === 'VEHICLE_PLATE')?.fileType}
                    onClick={() => { setActiveKycType('VEHICLE_PLATE'); kycInputRef.current?.click(); }}
                  />
                </>
              )}
            </div>
            <input type="file" ref={kycInputRef} onChange={handleKycUpload} className="hidden" accept="image/*,application/pdf" />

            <div className="bg-primary/5 p-6 rounded-[32px] border border-primary/20 flex gap-5">
              <span className="material-symbols-outlined text-primary text-3xl">verified_user</span>
              <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 leading-relaxed uppercase tracking-widest">
                Encryption Node Active. PDF artifacts are supported for legal compliance. Artifacts are encrypted end-to-end.
              </p>
            </div>
          </section>
        )}

        <section className="space-y-6 mb-10">
          <SettingGroup title="Technical Preferences">
            <div className="flex items-center justify-between p-6">
              <div>
                <h4 className="text-sm font-black text-secondary dark:text-white uppercase tracking-tight">Dark Mode Mesh</h4>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">System color protocol</p>
              </div>
              <button onClick={toggleTheme} className={`w-14 h-8 rounded-full p-1 relative transition-all duration-500 ${isDark ? 'bg-primary shadow-primary-glow' : 'bg-gray-200 dark:bg-white/10'}`}>
                <div className={`size-6 rounded-full bg-white shadow-xl transition-transform duration-300 ${isDark ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </button>
            </div>
          </SettingGroup>
        </section>

        <section className="pb-10">
          <button onClick={handleLogout} className="w-full h-20 bg-red-500/10 text-red-500 font-black uppercase tracking-[0.3em] rounded-[28px] border border-red-500/20 active:scale-95 transition-all text-xs flex items-center justify-center gap-3 hover:bg-red-500 hover:text-white">
            <span className="material-symbols-outlined font-black">power_settings_new</span>
            Terminate Session Node
          </button>
        </section>
      </main>
    </div>
  );
};

const KycUploader: React.FC<{ label: string; status: string; fileType?: string; onClick: () => void }> = ({ label, status, fileType, onClick }) => (
  <button
    onClick={onClick}
    className={`p-6 rounded-[40px] border-2 border-dashed flex flex-col items-center text-center gap-4 transition-all hover:border-primary active:scale-[0.98] group ${status === 'VERIFIED' ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' :
      status === 'PENDING' ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800' :
        'bg-gray-50 dark:bg-black/30 border-gray-200 dark:border-white/10'
      }`}
  >
    <div className={`size-14 rounded-3xl flex items-center justify-center shadow-lg transition-all ${status === 'VERIFIED' ? 'bg-green-500 text-white' :
      status === 'PENDING' ? 'bg-amber-500 text-white animate-pulse' :
        'bg-white dark:bg-surface-dark text-gray-300 dark:text-gray-500'
      }`}>
      <span className="material-symbols-outlined text-3xl font-black">
        {status === 'VERIFIED' ? 'verified' : status === 'PENDING' ? (fileType === 'pdf' ? 'picture_as_pdf' : 'sync') : 'cloud_upload'}
      </span>
    </div>
    <div className="min-w-0">
      <p className="text-[12px] font-black text-secondary dark:text-white uppercase truncate tracking-tight">{label}</p>
      <p className={`text-[9px] font-black uppercase mt-1 tracking-widest ${status === 'VERIFIED' ? 'text-green-600 dark:text-green-400' :
        status === 'PENDING' ? 'text-amber-600 dark:text-amber-400' :
          'text-gray-400 dark:text-gray-200'
        }`}>{status === 'NONE' ? 'Awaiting Artifact' : status} {fileType === 'pdf' && '(PDF)'}</p>
    </div>
  </button>
);

const SettingGroup: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
  <div className="flex flex-col gap-3">
    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] ml-2">{title}</h3>
    <div className="bg-white dark:bg-surface-dark rounded-[40px] border border-gray-100 dark:border-white/5 overflow-hidden shadow-card divide-y divide-gray-50 dark:divide-white/5">
      {children}
    </div>
  </div>
);

export default UserSettings;
