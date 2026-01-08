import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { GoogleGenAI } from "@google/genai";
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { useToast } from '../context/ToastContext';

const AdminConfig: React.FC = () => {
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError } = useToast();
  const [activeTab, setActiveTab] = useState<'PARAMETERS' | 'DIRECT_APIS' | 'GOOGLE_MAPS' | 'VIDEO_MESH' | 'BUSINESS' | 'COMMUNICATIONS' | 'INTEGRATIONS'>('BUSINESS');
  const [isAiAuditing, setIsAiAuditing] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [settings, setSettings] = useState({
    commission: 10,
    expressFee: 5.0,
    dynamicPricingActive: true
  });

  const [integrations, setIntegrations] = useState({
    telesom: { apiKey: '', endpoint: '', active: false },
    somtel: { apiKey: '', endpoint: '', active: false },
    golis: { apiKey: '', endpoint: '', active: false },
    hormuud: { apiKey: '', endpoint: '', active: false },
    premierBank: { merchantId: '', apiKey: '', endpoint: '', active: false },
    maps: { apiKey: '', active: false },
    agora: { appId: '', certificate: '', active: false },
    livekit: { apiKey: '', apiSecret: '', host: '', active: false },
    whatsapp: { phoneId: '', token: '', namespace: '', active: false },
    sms: { provider: 'twilio', apiKey: '', senderId: '', sid: '', active: false },
    // Dropshipping
    amazonUae: { apiKey: '', secretKey: '', marketplaceId: '', active: false },
    alibaba: { apiKey: '', secretKey: '', active: false },
    aliexpress: { apiKey: '', secretKey: '', active: false },
  });

  const [business, setBusiness] = useState({
    title: 'Fudaydiye',
    shortDesc: "Hargeisa's ultimate commerce mesh.",
    address: "Independence Ave, Telesom Plaza, 4th Floor, Hargeisa, SL",
    phone: "+252 63 444 1122",
    email: "ops@fudaydiye.so",
    socialFacebook: "",
    socialInstagram: "",
    socialTwitter: "",
    socialYoutube: "",
    brandLogoLight: "",
    brandLogoDark: "",
    brandIcon: "",
    footerText: "© 2024 Fudaydiye Express & Marketplace. Built for the Horn."
  });

  useEffect(() => {
    let active = true;

    const fetchConfig = async () => {
      try {
        const snap = await getDoc(doc(db, "system_config", "global"));
        if (!active) return;

        if (snap.exists()) {
          const data = snap.data();
          if (data.integrations) {
            setIntegrations(prev => ({
              ...prev,
              ...data.integrations,
              // Ensure structural integrity for deep keys if missing in fetched data
              amazonUae: data.integrations.amazonUae || prev.amazonUae,
              alibaba: data.integrations.alibaba || prev.alibaba,
              aliexpress: data.integrations.aliexpress || prev.aliexpress,
            }));
          }
          if (data.settings) setSettings(prev => ({ ...prev, ...data.settings }));
          if (data.business) setBusiness(prev => ({ ...prev, ...data.business }));
        }
        setLoading(false);
      } catch (e) {
        console.error("Config fetch error", e);
        setLoading(false);
      }
    };

    fetchConfig();

    return () => { active = false; };
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    setUploading(field);

    try {
      // Image Optimization
      const optimizeImage = (file: File): Promise<Blob> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.src = URL.createObjectURL(file);
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 500;
            const MAX_HEIGHT = 500;
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
            canvas.toBlob((blob) => {
              if (blob) resolve(blob);
              else reject(new Error('Canvas blob failure'));
            }, 'image/webp', 0.9); // Convert to WebP
          };
          img.onerror = reject;
        });
      };

      const optimizedBlob = await optimizeImage(file);
      const storageRef = ref(storage, `branding/${field}_${Date.now()}.webp`);

      await uploadBytes(storageRef, optimizedBlob);
      const url = await getDownloadURL(storageRef);
      // @ts-ignore
      setBusiness(prev => ({ ...prev, [field]: url }));
      toastSuccess('Brand asset optimized & uploaded.');
    } catch (err) {
      console.error(err);
      toastError('Upload failed.');
    } finally {
      setUploading(null);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, "system_config", "global"), {
        integrations,
        settings,
        business,
        updatedAt: serverTimestamp(),
        updatedBy: 'admin'
      }, { merge: true });
      toastSuccess('Ecosystem configuration synchronized.');
    } catch (err) {
      console.error(err);
      toastError('Node synchronization failure.');
    } finally {
      setIsSaving(false);
    }
  };

  const runAiAudit = async () => {
    setIsAiAuditing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Audit the following direct commerce integrations for Fudaydiye: ZAAD, eDahab, Sahal, EVC Plus, and Premier Bank API. Verify that removing Mobile Pay in favor of direct telco API links improves transaction reliability and reduces cost for local merchants in Hargeisa.`,
      });
      setAiInsight(response.text || "AI analysis completed.");
    } catch (err) {
      setAiInsight("AI Node momentarily offline.");
    } finally {
      setIsAiAuditing(false);
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
      <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-300 font-display">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/5 active:scale-90 transition-all">
            <span className="material-symbols-outlined text-secondary dark:text-white">arrow_back</span>
          </button>
          <div className="flex flex-col">
            <h1 className="text-xl font-black text-secondary dark:text-primary tracking-tighter leading-none uppercase">Infrastructure</h1>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">Ecosystem Control Hub</p>
          </div>
        </div>
        <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-xl overflow-x-auto no-scrollbar max-w-[300px] md:max-w-none">
          <button
            onClick={() => setActiveTab('BUSINESS')}
            className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all whitespace-nowrap ${activeTab === 'BUSINESS' ? 'bg-primary text-secondary shadow-sm' : 'text-gray-400'}`}
          >
            Business Identity
          </button>
          {(['PARAMETERS', 'DIRECT_APIS', 'COMMUNICATIONS', 'INTEGRATIONS', 'GOOGLE_MAPS', 'VIDEO_MESH'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all whitespace-nowrap ${activeTab === tab ? 'bg-primary text-secondary shadow-sm' : 'text-gray-400'}`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>
      </header>

      <main className="p-6 flex-1 flex flex-col gap-8 overflow-y-auto pb-40 no-scrollbar">

        {activeTab === 'BUSINESS' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* General Info */}
              <div className="bg-white dark:bg-surface-dark p-8 rounded-[32px] shadow-sm border border-gray-100 dark:border-white/5">
                <h3 className="text-lg font-black text-secondary dark:text-white uppercase tracking-tight mb-6 flex items-center gap-3">
                  <span className="size-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center material-symbols-outlined">storefront</span>
                  General Info
                </h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Business Title</label>
                    <input value={business.title} onChange={e => setBusiness({ ...business, title: e.target.value })} className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-xl px-4 py-3 text-sm font-bold text-secondary dark:text-white focus:ring-2 focus:ring-primary/50 transition-all" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Short Description</label>
                    <textarea value={business.shortDesc} onChange={e => setBusiness({ ...business, shortDesc: e.target.value })} rows={3} className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-xl px-4 py-3 text-sm font-medium text-secondary dark:text-white focus:ring-2 focus:ring-primary/50 transition-all" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Address</label>
                    <textarea value={business.address} onChange={e => setBusiness({ ...business, address: e.target.value })} rows={2} className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-xl px-4 py-3 text-sm font-medium text-secondary dark:text-white focus:ring-2 focus:ring-primary/50 transition-all" />
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div className="bg-white dark:bg-surface-dark p-8 rounded-[32px] shadow-sm border border-gray-100 dark:border-white/5">
                <h3 className="text-lg font-black text-secondary dark:text-white uppercase tracking-tight mb-6 flex items-center gap-3">
                  <span className="size-10 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center material-symbols-outlined">contact_phone</span>
                  Contact Points
                </h3>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Phone Number</label>
                      <input value={business.phone} onChange={e => setBusiness({ ...business, phone: e.target.value })} className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-xl px-4 py-3 text-sm font-bold text-secondary dark:text-white focus:ring-2 focus:ring-primary/50 transition-all" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Email Address</label>
                      <input value={business.email} onChange={e => setBusiness({ ...business, email: e.target.value })} className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-xl px-4 py-3 text-sm font-bold text-secondary dark:text-white focus:ring-2 focus:ring-primary/50 transition-all" />
                    </div>
                  </div>
                  <hr className="border-gray-100 dark:border-white/5" />
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Footer Copyright Text</label>
                    <input value={business.footerText} onChange={e => setBusiness({ ...business, footerText: e.target.value })} className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-xl px-4 py-3 text-xs font-medium text-secondary dark:text-white focus:ring-2 focus:ring-primary/50 transition-all" />
                  </div>
                </div>
              </div>

              {/* Branding (Use URLs for now) */}
              {/* Branding (URL or Upload) */}
              <div className="bg-white dark:bg-surface-dark p-8 rounded-[32px] shadow-sm border border-gray-100 dark:border-white/5">
                <h3 className="text-lg font-black text-secondary dark:text-white uppercase tracking-tight mb-6 flex items-center gap-3">
                  <span className="size-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center material-symbols-outlined">palette</span>
                  Branding
                </h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Light Mode Logo</label>
                    <div className="flex gap-2">
                      <input value={business.brandLogoLight} onChange={e => setBusiness({ ...business, brandLogoLight: e.target.value })} className="flex-1 bg-gray-50 dark:bg-white/5 border-none rounded-xl px-4 py-3 text-xs text-secondary dark:text-white font-mono" placeholder="https://... or Upload Image ->" />
                      <div className="relative overflow-hidden shrink-0">
                        <button className="h-full bg-primary/10 text-primary px-4 rounded-xl text-xs font-bold hover:bg-primary hover:text-secondary transition-all flex items-center gap-2 whitespace-nowrap">
                          <span className="material-symbols-outlined text-lg">{uploading === 'brandLogoLight' ? 'sync' : 'cloud_upload'}</span>
                          {uploading === 'brandLogoLight' ? 'Uploading...' : 'Upload'}
                        </button>
                        <input type="file" onChange={(e) => handleFileUpload(e, 'brandLogoLight')} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Dark Mode Logo</label>
                    <div className="flex gap-2">
                      <input value={business.brandLogoDark} onChange={e => setBusiness({ ...business, brandLogoDark: e.target.value })} className="flex-1 bg-gray-50 dark:bg-white/5 border-none rounded-xl px-4 py-3 text-xs text-secondary dark:text-white font-mono" placeholder="https://... or Upload Image ->" />
                      <div className="relative overflow-hidden shrink-0">
                        <button className="h-full bg-primary/10 text-primary px-4 rounded-xl text-xs font-bold hover:bg-primary hover:text-secondary transition-all flex items-center gap-2 whitespace-nowrap">
                          <span className="material-symbols-outlined text-lg">{uploading === 'brandLogoDark' ? 'sync' : 'cloud_upload'}</span>
                          {uploading === 'brandLogoDark' ? 'Uploading...' : 'Upload'}
                        </button>
                        <input type="file" onChange={(e) => handleFileUpload(e, 'brandLogoDark')} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Brand Icon (Favicon/App Icon)</label>
                    <div className="flex gap-2">
                      <input value={business.brandIcon} onChange={e => setBusiness({ ...business, brandIcon: e.target.value })} className="flex-1 bg-gray-50 dark:bg-white/5 border-none rounded-xl px-4 py-3 text-xs text-secondary dark:text-white font-mono" placeholder="https://... or Upload Image ->" />
                      <div className="relative overflow-hidden shrink-0">
                        <button className="h-full bg-primary/10 text-primary px-4 rounded-xl text-xs font-bold hover:bg-primary hover:text-secondary transition-all flex items-center gap-2 whitespace-nowrap">
                          <span className="material-symbols-outlined text-lg">{uploading === 'brandIcon' ? 'sync' : 'cloud_upload'}</span>
                          {uploading === 'brandIcon' ? 'Uploading...' : 'Upload'}
                        </button>
                        <input type="file" onChange={(e) => handleFileUpload(e, 'brandIcon')} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div className="bg-white dark:bg-surface-dark p-8 rounded-[32px] shadow-sm border border-gray-100 dark:border-white/5">
                <h3 className="text-lg font-black text-secondary dark:text-white uppercase tracking-tight mb-6 flex items-center gap-3">
                  <span className="size-10 rounded-xl bg-pink-500/10 text-pink-500 flex items-center justify-center material-symbols-outlined">share</span>
                  Social Links
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="size-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold">FB</span>
                    <input value={business.socialFacebook} onChange={e => setBusiness({ ...business, socialFacebook: e.target.value })} className="flex-1 bg-gray-50 dark:bg-white/5 border-none rounded-xl px-4 py-2.5 text-xs text-secondary dark:text-white" placeholder="Facebook URL" />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="size-8 rounded-lg bg-pink-600 text-white flex items-center justify-center text-xs font-bold">IG</span>
                    <input value={business.socialInstagram} onChange={e => setBusiness({ ...business, socialInstagram: e.target.value })} className="flex-1 bg-gray-50 dark:bg-white/5 border-none rounded-xl px-4 py-2.5 text-xs text-secondary dark:text-white" placeholder="Instagram URL" />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="size-8 rounded-lg bg-sky-500 text-white flex items-center justify-center text-xs font-bold">TW</span>
                    <input value={business.socialTwitter} onChange={e => setBusiness({ ...business, socialTwitter: e.target.value })} className="flex-1 bg-gray-50 dark:bg-white/5 border-none rounded-xl px-4 py-2.5 text-xs text-secondary dark:text-white" placeholder="Twitter/X URL" />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="size-8 rounded-lg bg-red-600 text-white flex items-center justify-center text-xs font-bold">YT</span>
                    <input value={business.socialYoutube} onChange={e => setBusiness({ ...business, socialYoutube: e.target.value })} className="flex-1 bg-gray-50 dark:bg-white/5 border-none rounded-xl px-4 py-2.5 text-xs text-secondary dark:text-white" placeholder="YouTube URL" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}


        {activeTab === 'DIRECT_APIS' && (
          <div className="space-y-10">
            <section className="bg-secondary text-white p-10 rounded-[48px] shadow-2xl relative overflow-hidden group border border-white/10">
              <div className="absolute top-0 right-0 size-64 bg-primary/20 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="size-12 rounded-2xl bg-primary flex items-center justify-center text-secondary shadow-lg">
                      <span className="material-symbols-outlined font-black text-2xl">account_balance</span>
                    </div>
                    <h3 className="text-lg font-black uppercase tracking-[0.2em]">Direct Mesh Architect</h3>
                  </div>
                  <p className="text-sm font-medium leading-relaxed italic opacity-80">
                    {aiInsight || "System optimized for direct Telecommunications and Bank API links. Reducing latency by eliminating third-party aggregators like Mobile Pay."}
                  </p>
                </div>
                <button
                  onClick={runAiAudit}
                  disabled={isAiAuditing}
                  className="h-16 px-10 bg-primary text-secondary rounded-[24px] font-black text-xs uppercase tracking-[0.3em] shadow-xl active:scale-95 transition-all flex items-center gap-3 whitespace-nowrap"
                >
                  {isAiAuditing ? <span className="animate-spin material-symbols-outlined">sync</span> : 'Audit API Health'}
                </button>
              </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <IntegrationCard
                name="ZAAD (Telesom)"
                desc="Direct Mobile Money Tunnel"
                icon="smartphone"
                active={integrations.telesom.active}
                onToggle={() => setIntegrations({ ...integrations, telesom: { ...integrations.telesom, active: !integrations.telesom.active } })}
              >
                <div className="space-y-4 pt-4">
                  <CredentialField label="API Endpoint" value={integrations.telesom.endpoint} onChange={(val) => setIntegrations({ ...integrations, telesom: { ...integrations.telesom, endpoint: val } })} />
                  <CredentialField label="Secret Key" value={integrations.telesom.apiKey} onChange={(val) => setIntegrations({ ...integrations, telesom: { ...integrations.telesom, apiKey: val } })} isSecret />
                </div>
              </IntegrationCard>

              <IntegrationCard
                name="eDahab (Somtel)"
                desc="Direct Merchant API"
                icon="account_balance_wallet"
                active={integrations.somtel.active}
                onToggle={() => setIntegrations({ ...integrations, somtel: { ...integrations.somtel, active: !integrations.somtel.active } })}
              >
                <div className="space-y-4 pt-4">
                  <CredentialField label="Endpoint URL" value={integrations.somtel.endpoint} onChange={(val) => setIntegrations({ ...integrations, somtel: { ...integrations.somtel, endpoint: val } })} />
                  <CredentialField label="Merchant Key" value={integrations.somtel.apiKey} onChange={(val) => setIntegrations({ ...integrations, somtel: { ...integrations.somtel, apiKey: val } })} isSecret />
                </div>
              </IntegrationCard>

              <IntegrationCard
                name="Sahal (Golis)"
                desc="Regional Mobile Protocol"
                icon="bolt"
                active={integrations.golis.active}
                onToggle={() => setIntegrations({ ...integrations, golis: { ...integrations.golis, active: !integrations.golis.active } })}
              >
                <div className="space-y-4 pt-4">
                  <CredentialField label="API Secret" value={integrations.golis.apiKey} onChange={(val) => setIntegrations({ ...integrations, golis: { ...integrations.golis, apiKey: val } })} isSecret />
                </div>
              </IntegrationCard>

              <IntegrationCard
                name="EVC Plus (Hormuud)"
                desc="Direct Gateway Access"
                icon="send_to_mobile"
                active={integrations.hormuud.active}
                onToggle={() => setIntegrations({ ...integrations, hormuud: { ...integrations.hormuud, active: !integrations.hormuud.active } })}
              >
                <div className="space-y-4 pt-4">
                  <CredentialField label="Merchant ID" value={integrations.hormuud.apiKey} onChange={(val) => setIntegrations({ ...integrations, hormuud: { ...integrations.hormuud, apiKey: val } })} />
                </div>
              </IntegrationCard>

              <IntegrationCard
                name="Bank API (Premier)"
                desc="Debit & Credit Card Nodes"
                icon="credit_card"
                active={integrations.premierBank.active}
                onToggle={() => setIntegrations({ ...integrations, premierBank: { ...integrations.premierBank, active: !integrations.premierBank.active } })}
              >
                <div className="space-y-4 pt-4">
                  <CredentialField label="Card Merchant ID" value={integrations.premierBank.merchantId} onChange={(val) => setIntegrations({ ...integrations, premierBank: { ...integrations.premierBank, merchantId: val } })} />
                  <CredentialField label="Public API Key" value={integrations.premierBank.apiKey} onChange={(val) => setIntegrations({ ...integrations, premierBank: { ...integrations.premierBank, apiKey: val } })} />
                </div>
              </IntegrationCard>
            </div>
          </div>
        )}

        {activeTab === 'PARAMETERS' && (
          <section className="flex flex-col gap-6">
            <ConfigGroup title="Market Logic">
              <div className="p-8 flex items-center justify-between">
                <div>
                  <p className="text-base font-black text-secondary dark:text-white leading-tight uppercase tracking-tighter">Dynamic Mesh Pricing</p>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-2">AI-optimized dispatch rates</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, dynamicPricingActive: !settings.dynamicPricingActive })}
                  className={`h-8 w-14 rounded-full relative transition-all p-1 ${settings.dynamicPricingActive ? 'bg-primary' : 'bg-white/20'}`}
                >
                  <div className={`size-6 rounded-full bg-white shadow-md transition-transform ${settings.dynamicPricingActive ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </button>
              </div>
              <div className="p-8 flex items-center justify-between">
                <div>
                  <p className="text-base font-black text-secondary dark:text-white leading-tight uppercase tracking-tighter">Global Platform Fee</p>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-2">Default commission node rate</p>
                </div>
                <div className="flex items-center gap-3 bg-gray-100 dark:bg-white/5 px-4 py-3 rounded-2xl border border-gray-100 dark:border-white/10">
                  <input
                    type="number"
                    value={settings.commission}
                    onChange={(e) => setSettings({ ...settings, commission: parseInt(e.target.value) || 0 })}
                    className="w-14 bg-transparent border-none p-0 text-lg font-black focus:ring-0 text-right text-secondary dark:text-white"
                  />
                  <span className="text-lg font-black text-primary">%</span>
                </div>
              </div>
            </ConfigGroup>
          </section>
        )}

        {activeTab === 'GOOGLE_MAPS' && (
          <section>
            <IntegrationCard
              name="Google Maps SDK"
              desc="Precision Routing Node"
              icon="map"
              active={integrations.maps.active}
              onToggle={() => setIntegrations({ ...integrations, maps: { ...integrations.maps, active: !integrations.maps.active } })}
            >
              <div className="space-y-6 pt-4">
                <CredentialField label="Maps Browser API Key" value={integrations.maps.apiKey} onChange={(val) => setIntegrations({ ...integrations, maps: { ...integrations.maps, apiKey: val } })} isSecret />
              </div>
            </IntegrationCard>
          </section>
        )}

        {activeTab === 'VIDEO_MESH' && (
          <section>
            <IntegrationCard
              name="Agora RTC"
              desc="High Traffic Broadcaster"
              icon="videocam"
              active={integrations.agora.active}
              onToggle={() => setIntegrations({ ...integrations, agora: { ...integrations.agora, active: !integrations.agora.active } })}
            >
              <div className="space-y-6 pt-4">
                <CredentialField label="Agora App ID" value={integrations.agora.appId} onChange={(val) => setIntegrations({ ...integrations, agora: { ...integrations.agora, appId: val } })} />
                <CredentialField label="Secondary Certificate" value={integrations.agora.certificate} onChange={(val) => setIntegrations({ ...integrations, agora: { ...integrations.agora, certificate: val } })} isSecret />
              </div>
            </IntegrationCard>

            <div className="h-10"></div>

            <IntegrationCard
              name="LiveKit Node"
              desc="Self-Hosted Social Mesh"
              icon="dns"
              active={integrations.livekit.active}
              onToggle={() => setIntegrations({ ...integrations, livekit: { ...integrations.livekit, active: !integrations.livekit.active } })}
            >
              <div className="space-y-4 pt-4">
                <CredentialField label="LiveKit Server URL" value={integrations.livekit.host} onChange={(val) => setIntegrations({ ...integrations, livekit: { ...integrations.livekit, host: val } })} />
                <CredentialField label="API Key" value={integrations.livekit.apiKey} onChange={(val) => setIntegrations({ ...integrations, livekit: { ...integrations.livekit, apiKey: val } })} />
                <CredentialField label="API Secret" value={integrations.livekit.apiSecret} onChange={(val) => setIntegrations({ ...integrations, livekit: { ...integrations.livekit, apiSecret: val } })} isSecret />
              </div>
            </IntegrationCard>
          </section>
        )}

        {activeTab === 'COMMUNICATIONS' && (
          <section className="space-y-8">
            <IntegrationCard
              name="WhatsApp Business"
              desc="Meta Cloud API"
              icon="chat"
              active={integrations.whatsapp?.active}
              onToggle={() => setIntegrations({ ...integrations, whatsapp: { ...integrations.whatsapp, active: !integrations.whatsapp?.active } })}
            >
              <div className="space-y-4 pt-4">
                <CredentialField label="Phone Number ID" value={integrations.whatsapp?.phoneId || ''} onChange={(val) => setIntegrations({ ...integrations, whatsapp: { ...integrations.whatsapp, phoneId: val } })} />
                <CredentialField label="System User Token" value={integrations.whatsapp?.token || ''} onChange={(val) => setIntegrations({ ...integrations, whatsapp: { ...integrations.whatsapp, token: val } })} isSecret />
                <CredentialField label="Template Namespace" value={integrations.whatsapp?.namespace || ''} onChange={(val) => setIntegrations({ ...integrations, whatsapp: { ...integrations.whatsapp, namespace: val } })} />
              </div>
            </IntegrationCard>

            <IntegrationCard
              name="SMS Gateway"
              desc="Global Text Messaging"
              icon="sms"
              active={integrations.sms?.active}
              onToggle={() => setIntegrations({ ...integrations, sms: { ...integrations.sms, active: !integrations.sms?.active } })}
            >
              <div className="space-y-6 pt-4">
                <div className="px-2">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2 block mb-2">Provider</label>
                  <div className="flex bg-gray-50 dark:bg-white/5 p-1 rounded-2xl border border-gray-100 dark:border-white/10 w-fit">
                    {['twilio', 'msg91', 'firebase'].map((p) => (
                      <button
                        key={p}
                        onClick={() => setIntegrations({ ...integrations, sms: { ...integrations.sms, provider: p } })}
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${integrations.sms?.provider === p ? 'bg-white shadow-sm text-secondary' : 'text-gray-400'}`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {integrations.sms?.provider === 'twilio' && (
                  <>
                    <CredentialField label="Account SID" value={integrations.sms?.sid || ''} onChange={(val) => setIntegrations({ ...integrations, sms: { ...integrations.sms, sid: val } })} />
                    <CredentialField label="Auth Token" value={integrations.sms?.apiKey || ''} onChange={(val) => setIntegrations({ ...integrations, sms: { ...integrations.sms, apiKey: val } })} isSecret />
                    <CredentialField label="Sender ID / From Number" value={integrations.sms?.senderId || ''} onChange={(val) => setIntegrations({ ...integrations, sms: { ...integrations.sms, senderId: val } })} />
                  </>
                )}

                {integrations.sms?.provider === 'msg91' && (
                  <>
                    <CredentialField label="Auth Key" value={integrations.sms?.apiKey || ''} onChange={(val) => setIntegrations({ ...integrations, sms: { ...integrations.sms, apiKey: val } })} isSecret />
                    <CredentialField label="Sender ID" value={integrations.sms?.senderId || ''} onChange={(val) => setIntegrations({ ...integrations, sms: { ...integrations.sms, senderId: val } })} />
                  </>
                )}

                {integrations.sms?.provider === 'firebase' && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-500/10 rounded-2xl text-[10px] font-medium text-blue-600 dark:text-blue-400">
                    Firebase Authentication SMS is configured automatically via GCIP. No manual keys required here for basic Auth OTP.
                  </div>
                )}
              </div>
            </IntegrationCard>
          </section>
        )}

        {activeTab === 'INTEGRATIONS' && (
          <section className="space-y-8">
            <IntegrationCard
              name="Amazon UAE"
              desc="Direct Catalog Import"
              icon="shopping_cart"
              active={integrations.amazonUae?.active}
              onToggle={() => setIntegrations({ ...integrations, amazonUae: { ...integrations.amazonUae, active: !integrations.amazonUae?.active } })}
            >
              <div className="space-y-4 pt-4">
                <CredentialField label="AWS Access Key" value={integrations.amazonUae?.apiKey || ''} onChange={(val) => setIntegrations({ ...integrations, amazonUae: { ...integrations.amazonUae, apiKey: val } })} />
                <CredentialField label="AWS Secret Key" value={integrations.amazonUae?.secretKey || ''} onChange={(val) => setIntegrations({ ...integrations, amazonUae: { ...integrations.amazonUae, secretKey: val } })} isSecret />
                <CredentialField label="Marketplace ID" value={integrations.amazonUae?.marketplaceId || ''} onChange={(val) => setIntegrations({ ...integrations, amazonUae: { ...integrations.amazonUae, marketplaceId: val } })} />
              </div>
            </IntegrationCard>

            <IntegrationCard
              name="Alibaba"
              desc="Wholesale Source Node"
              icon="factory"
              active={integrations.alibaba?.active}
              onToggle={() => setIntegrations({ ...integrations, alibaba: { ...integrations.alibaba, active: !integrations.alibaba?.active } })}
            >
              <div className="space-y-4 pt-4">
                <CredentialField label="App Key" value={integrations.alibaba?.apiKey || ''} onChange={(val) => setIntegrations({ ...integrations, alibaba: { ...integrations.alibaba, apiKey: val } })} />
                <CredentialField label="App Secret" value={integrations.alibaba?.secretKey || ''} onChange={(val) => setIntegrations({ ...integrations, alibaba: { ...integrations.alibaba, secretKey: val } })} isSecret />
              </div>
            </IntegrationCard>

            <IntegrationCard
              name="AliExpress"
              desc="Dropship Source Node"
              icon="package_2"
              active={integrations.aliexpress?.active}
              onToggle={() => setIntegrations({ ...integrations, aliexpress: { ...integrations.aliexpress, active: !integrations.aliexpress?.active } })}
            >
              <div className="space-y-4 pt-4">
                <CredentialField label="App Key" value={integrations.aliexpress?.apiKey || ''} onChange={(val) => setIntegrations({ ...integrations, aliexpress: { ...integrations.aliexpress, apiKey: val } })} />
                <CredentialField label="App Secret" value={integrations.aliexpress?.secretKey || ''} onChange={(val) => setIntegrations({ ...integrations, aliexpress: { ...integrations.aliexpress, secretKey: val } })} isSecret />
              </div>
            </IntegrationCard>

            <ConfigGroup title="Global Logistics Logic">
              <div className="p-8 flex items-center justify-between">
                <div>
                  <p className="text-base font-black text-secondary dark:text-white leading-tight uppercase tracking-tighter">Default Markup</p>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-2">Added to landed cost</p>
                </div>
                <div className="flex items-center gap-3 bg-gray-100 dark:bg-white/5 px-4 py-3 rounded-2xl border border-gray-100 dark:border-white/10">
                  <input type="number" defaultValue="30" className="w-14 bg-transparent border-none p-0 text-lg font-black focus:ring-0 text-right text-secondary dark:text-white" />
                  <span className="text-lg font-black text-primary">%</span>
                </div>
              </div>
            </ConfigGroup>
          </section>
        )}

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full h-24 bg-primary text-secondary font-black text-lg uppercase tracking-[0.4em] rounded-[32px] shadow-primary-glow active:scale-95 transition-all mt-4 mb-20 flex items-center justify-center gap-5"
        >
          {isSaving ? <span className="animate-spin material-symbols-outlined text-4xl">sync</span> : (
            <>Authorize & Sync Matrix <span className="material-symbols-outlined font-black text-3xl">lock_open</span></>
          )}
        </button>
      </main>

      <BottomNav items={[
        { label: 'Overview', icon: 'dashboard', path: '/admin' },
        { label: 'Audits', icon: 'security', path: '/admin/audits' },
        { label: 'Hubs', icon: 'hub', path: '/admin/hubs' },
        { label: 'Config', icon: 'settings', path: '/admin/settings' },
      ]} />
    </div>
  );
};

const ConfigGroup: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="flex flex-col gap-4">
    <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.4em] ml-4">{title}</h3>
    <div className="bg-white dark:bg-surface-dark rounded-[48px] border border-gray-100 dark:border-white/5 overflow-hidden shadow-card divide-y divide-gray-50 dark:divide-white/5">
      {children}
    </div>
  </div>
);

const IntegrationCard: React.FC<{ name: string; desc: string; icon: string; active: boolean; onToggle: () => void; children: React.ReactNode }> = ({ name, desc, icon, active, onToggle, children }) => (
  <div className="bg-white dark:bg-surface-dark p-10 rounded-[56px] border border-gray-100 dark:border-white/5 shadow-soft flex flex-col gap-8 relative group overflow-hidden">
    <div className="absolute top-0 right-0 p-6">
      <div className={`size-3 rounded-full ${active ? 'bg-primary animate-pulse shadow-[0_0_12px_#06DC7F]' : 'bg-gray-300'}`}></div>
    </div>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-6">
        <div className={`size-16 rounded-[24px] flex items-center justify-center shadow-lg transition-all ${active ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-gray-100 text-gray-400 dark:bg-white/5'}`}>
          <span className="material-symbols-outlined text-[36px] font-black">{icon}</span>
        </div>
        <div>
          <h4 className="text-xl font-black text-secondary dark:text-white uppercase tracking-tighter leading-none mb-1.5">{name}</h4>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{desc}</p>
        </div>
      </div>
      <button
        onClick={onToggle}
        className={`h-8 w-14 rounded-full relative transition-all duration-500 p-1 ${active ? 'bg-primary shadow-primary-glow' : 'bg-gray-200 dark:bg-white/10'}`}
      >
        <div className={`size-6 rounded-full bg-white shadow-md transition-transform duration-300 ${active ? 'translate-x-6' : 'translate-x-0'}`}></div>
      </button>
    </div>
    <div className={`transition-all duration-700 ${active ? 'opacity-100 scale-100' : 'opacity-20 scale-95 pointer-events-none'}`}>
      {children}
    </div>
  </div>
);

const CredentialField: React.FC<{ label: string; value: string; onChange: (val: string) => void; isSecret?: boolean }> = ({ label, value, onChange, isSecret }) => {
  const [show, setShow] = useState(!isSecret);
  return (
    <div className="space-y-2">
      <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">{label}</p>
      <div className="h-16 bg-gray-50 dark:bg-white/5 rounded-[24px] border-2 border-gray-100 dark:border-white/10 flex items-center px-6 font-mono text-sm overflow-hidden focus-within:border-primary/50 transition-all shadow-inner">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-transparent border-none p-0 focus:ring-0 text-secondary dark:text-white text-base font-black tracking-tight"
          placeholder={`Enter ${label.toLowerCase()}...`}
        />
        {isSecret && (
          <button onClick={() => setShow(!show)} className="text-gray-300 hover:text-primary ml-3 active:scale-90 transition-transform">
            <span className="material-symbols-outlined text-[20px]">{show ? 'visibility_off' : 'visibility'}</span>
          </button>
        )}
        <button onClick={() => { navigator.clipboard.writeText(value); alert(`${label} node copied.`); }} className="text-gray-300 hover:text-primary ml-3 active:scale-90 transition-transform">
          <span className="material-symbols-outlined text-[20px]">content_copy</span>
        </button>
      </div>
    </div>
  );
};

export default AdminConfig;