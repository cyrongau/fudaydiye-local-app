
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminTermsEditor: React.FC = () => {
  const navigate = useNavigate();
  const [activeDoc, setActiveDoc] = useState<'TERMS' | 'PRIVACY'>('TERMS');
  const [content, setContent] = useState({
    TERMS: `1. Platform Usage\nFudaydiye provides a marketplace and logistics network for verified merchants and customers. By using our services, you agree to comply with Somaliland commercial laws.\n\n2. Data Protection\nWe take your privacy seriously. Your phone number and payment data are encrypted using SHA-256 protocols.`,
    PRIVACY: `Your Privacy is our top priority. We use secure servers to protect your information and never share it with third parties without your consent.`
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      alert('Document published successfully!');
      navigate(-1);
    }, 1500);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-300 font-display">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/5 active:scale-90 transition-all">
            <span className="material-symbols-outlined text-secondary dark:text-white">arrow_back</span>
          </button>
          <div className="flex flex-col">
            <h1 className="text-xl font-black text-secondary dark:text-primary tracking-tighter leading-none">Content Editor</h1>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">Legal Management</p>
          </div>
        </div>
      </header>

      <main className="p-6 flex-1 flex flex-col gap-6 overflow-y-auto pb-40 no-scrollbar animate-in fade-in duration-500">
        <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-2xl border border-gray-200 dark:border-white/10">
          {(['TERMS', 'PRIVACY'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveDoc(tab)}
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeDoc === tab 
                ? 'bg-white dark:bg-surface-dark text-secondary dark:text-primary shadow-sm' 
                : 'text-gray-400'
              }`}
            >
              {tab === 'TERMS' ? 'Terms of Service' : 'Privacy Policy'}
            </button>
          ))}
        </div>

        <section className="bg-white dark:bg-surface-dark rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-soft p-6 flex-1 flex flex-col gap-4">
           <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Raw Document Content</h3>
              <span className="text-[9px] font-black text-primary uppercase">Autosave Enabled</span>
           </div>
           <textarea 
            value={content[activeDoc]}
            onChange={(e) => setContent({ ...content, [activeDoc]: e.target.value })}
            className="flex-1 w-full bg-gray-50 dark:bg-black/10 rounded-2xl p-5 text-sm font-medium leading-relaxed text-secondary dark:text-white border-none focus:ring-2 focus:ring-primary/20 resize-none"
            placeholder="Enter legal text..."
           />
        </section>

        <div className="bg-amber-50 dark:bg-amber-500/10 p-5 rounded-[28px] border border-amber-100 dark:border-amber-500/20 flex gap-4">
           <span className="material-symbols-outlined text-amber-600">warning</span>
           <p className="text-[10px] font-medium text-amber-700 dark:text-amber-400 leading-relaxed uppercase tracking-widest">
             Changes made here are <span className="font-black">live</span> and legally binding for all users upon publishing.
           </p>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-background-dark/95 backdrop-blur-md border-t border-gray-100 dark:border-white/5 p-5 pb-10">
        <div className="max-w-lg mx-auto flex gap-3">
           <button 
            disabled={isSaving}
            onClick={handleSave}
            className="flex-[2] h-16 bg-primary text-secondary font-black text-xs uppercase tracking-[0.2em] rounded-button shadow-primary-glow flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
           >
              {isSaving ? (
                <span className="animate-spin material-symbols-outlined">sync</span>
              ) : (
                <>Publish Policy Changes</>
              )}
           </button>
           <button 
             onClick={() => navigate(-1)}
             className="flex-1 h-16 bg-gray-100 dark:bg-white/5 text-gray-400 rounded-button font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all"
           >Discard</button>
        </div>
      </footer>
    </div>
  );
};

export default AdminTermsEditor;
