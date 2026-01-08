
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs, query, where, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CMSContent, Product } from '../types';
import { GoogleGenAI, Type } from "@google/genai";
import ProductPickerModal from '../components/ProductPickerModal';

const AdminCMSEditor: React.FC = () => {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(!!id);
  const [isSaving, setIsSaving] = useState(false);
  const [isAiOptimizing, setIsAiOptimizing] = useState(false);
  const [isSlugLocked, setIsSlugLocked] = useState(false);

  const [formState, setFormState] = useState<Partial<CMSContent>>({
    type: (type as any) || 'PAGE',
    title: '',
    subtitle: '',
    slug: '',
    status: 'DRAFT',
    category: 'General',
    tags: [],
    featuredImage: '',
    ctaText: 'Explore Now',
    ctaLink: '/customer/explore',
    linkedProductId: '',
    linkedVendorId: '',
  });

  const [tagInput, setTagInput] = useState('');
  const [showProductPicker, setShowProductPicker] = useState(false);

  // Ensure we check type from both state and URL to prevent desync
  const effectiveType = formState.type || type || 'PAGE';
  const isSliderType = effectiveType.includes('SLIDER');
  const [productList, setProductList] = useState<Product[]>([]);

  useEffect(() => {
    if (type && formState.type !== type) {
      setFormState(prev => ({ ...prev, type: type as any }));
    }
  }, [type]);

  useEffect(() => {
    async function initData() {
      // Fetch Content
      if (id) {
        const snap = await getDoc(doc(db, "cms_content", id));
        if (snap.exists()) {
          const data = snap.data() as CMSContent;
          setFormState(data);
          setTagInput(data.tags?.join(', ') || '');
          setIsSlugLocked(true);
          if (editorRef.current) {
            editorRef.current.innerHTML = data.content || '';
          }
        }
      }

      // Fetch Products for Selector
      const prodSnap = await getDocs(query(collection(db, "products"), where("status", "==", "ACTIVE"), limit(50)));
      setProductList(prodSnap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));

      setLoading(false);
    }
    initData();
  }, [id]);

  const handleTitleChange = (val: string) => {
    const slug = isSlugLocked ? formState.slug : val.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
    setFormState(prev => ({ ...prev, title: val, slug }));
  };

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleSave = async () => {
    setIsSaving(true);
    const content = editorRef.current?.innerHTML || '';
    const docId = id || Math.random().toString(36).substring(7);

    // Sanitize payload
    const payload = {
      type: effectiveType,
      title: formState.title || '',
      subtitle: formState.subtitle || '',
      slug: formState.slug || '',
      status: formState.status || 'DRAFT',
      category: formState.category || 'General',
      tags: tagInput.split(',').map(t => t.trim()).filter(t => t),
      featuredImage: formState.featuredImage || '',
      content: content,
      ctaText: formState.ctaText || 'Explore Now',
      ctaLink: formState.ctaLink || '/customer/explore',
      linkedProductId: formState.linkedProductId || '',
      linkedVendorId: formState.linkedVendorId || '',
      section: formState.section || 'HOME_TOP_ROW',
      updatedAt: serverTimestamp(),
      createdAt: formState.createdAt || serverTimestamp(),
    };

    try {
      await setDoc(doc(db, "cms_content", docId), payload);
      setToast({ message: 'Content synced to ecosystem successfully.', type: 'success' });
      setTimeout(() => navigate('/admin/cms'), 1000);
    } catch (err: any) {
      console.error(err);
      setToast({ message: `Sync failure: ${err.message}`, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormState(prev => ({ ...prev, featuredImage: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const exec = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-background-light dark:bg-background-dark"><div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark font-display relative">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[110] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 fade-in duration-300 ${toast.type === 'success' ? 'bg-[#06DC7F] text-[#015754]' : 'bg-red-500 text-white'}`}>
          <span className="material-symbols-outlined text-[20px] font-black">{toast.type === 'success' ? 'check_circle' : 'error'}</span>
          <span className="text-[11px] font-black uppercase tracking-widest">{toast.message}</span>
        </div>
      )}

      <header className="sticky top-0 z-[100] bg-white dark:bg-surface-dark border-b border-gray-100 dark:border-gray-800 px-10 py-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/admin/cms')} className="size-11 rounded-2xl bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400 active:scale-90 transition-all border border-gray-100 dark:border-white/5 hover:bg-white dark:hover:bg-white/10 hover:shadow-sm">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h1 className="text-xl font-black text-secondary dark:text-white uppercase tracking-tighter leading-none">{id ? 'Refine Artifact' : `Provision ${type?.replace('_', ' ')}`}</h1>
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mt-1">Ecosystem Content Architect</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            disabled={isSaving}
            onClick={handleSave}
            className="h-16 px-10 bg-primary text-secondary rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg hover:shadow-primary-glow active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? <span className="animate-spin material-symbols-outlined">sync</span> : <><span className="material-symbols-outlined">publish</span> Publish to Cloud</>}
          </button>
        </div>
      </header>

      <main className="p-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 flex flex-col gap-8">
          <section className="bg-white dark:bg-surface-dark p-10 rounded-[48px] border border-gray-100 dark:border-white/5 shadow-soft space-y-8">
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Display Title</label>
                <input
                  value={formState.title}
                  onChange={e => handleTitleChange(e.target.value)}
                  className="w-full h-16 bg-gray-50 dark:bg-black/20 border-2 border-transparent focus:border-primary/50 dark:focus:border-primary/50 rounded-[24px] px-8 text-2xl font-black text-secondary dark:text-white placeholder-gray-300 transition-all outline-none"
                  placeholder="Hero Title Text..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Badge Text / Category</label>
                <input
                  value={formState.category || ''}
                  onChange={e => setFormState({ ...formState, category: e.target.value })}
                  className="w-full h-12 bg-gray-50 dark:bg-black/20 border-2 border-transparent focus:border-primary/50 dark:focus:border-primary/50 rounded-xl px-4 text-xs font-bold text-secondary dark:text-white placeholder-gray-400 transition-all outline-none"
                  placeholder="e.g. GENERAL, NEW ARRIVAL, FEATURED"
                />
              </div>
              {(isSliderType || effectiveType === 'PROMO_CARD') && (
                <div className="space-y-2 animate-in slide-in-from-top-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Secondary Subtitle</label>
                  <input
                    type="text"
                    value={formState.subtitle || ''}
                    onChange={(e) => setFormState({ ...formState, subtitle: e.target.value })}
                    className="w-full h-12 bg-gray-50 dark:bg-black/20 border-2 border-transparent focus:border-primary/50 dark:focus:border-primary/50 rounded-xl px-4 text-xs font-bold text-secondary dark:text-white placeholder-gray-400 transition-all outline-none"
                    placeholder="Secondary subtitle text..."
                  />
                </div>
              )}

              {effectiveType === 'PROMO_CARD' && (
                <div className="space-y-2 animate-in slide-in-from-top-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Display Section</label>
                  <select
                    value={formState.section || 'HOME_TOP_ROW'}
                    onChange={(e) => setFormState({ ...formState, section: e.target.value as any })}
                    className="w-full h-12 bg-gray-50 dark:bg-black/20 border-2 border-transparent focus:border-primary/50 dark:focus:border-primary/50 rounded-xl px-4 text-xs font-bold text-secondary dark:text-white focus:outline-none appearance-none cursor-pointer"
                  >
                    <option value="HOME_TOP_ROW">Top Row (Mid Page)</option>
                    <option value="HOME_BOTTOM_ROW">Bottom Row (Footer)</option>
                  </select>
                </div>
              )}
            </div>

            {!isSliderType && effectiveType !== 'PROMO_CARD' && (
              <div className="space-y-2">
                <div className="flex flex-col border-2 border-gray-100 dark:border-white/5 rounded-[32px] overflow-hidden shadow-inner bg-white dark:bg-surface-dark">
                  <div className="bg-gray-50 dark:bg-white/2 p-3 flex flex-wrap gap-1 border-b border-gray-100 dark:border-white/5">
                    <ToolBtn icon="format_bold" onClick={() => exec('bold')} />
                    <ToolBtn icon="format_italic" onClick={() => exec('italic')} />
                    <ToolBtn icon="image" onClick={() => imageInputRef.current?.click()} />
                    <input type="file" ref={imageInputRef} className="hidden" accept="image/*" />
                  </div>
                  <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    className="w-full min-h-[400px] p-10 focus:outline-none bg-white dark:bg-surface-dark prose dark:prose-invert max-w-none shadow-inner overflow-y-auto"
                  />
                </div>
              </div>
            )}

            {(isSliderType || effectiveType === 'PROMO_CARD') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4">
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">CTA Logic</h4>
                  <div className="space-y-4">
                    <InputField label="Button Text" value={formState.ctaText!} onChange={v => setFormState({ ...formState, ctaText: v })} />
                    <InputField label="Target URL / Link" value={formState.ctaLink!} onChange={v => setFormState({ ...formState, ctaLink: v })} />
                  </div>
                </div>
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Ecosystem Linkage</h4>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Linked Product (Overlay Card)</label>

                      {formState.linkedProductId ? (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl">
                          {(() => {
                            const p = productList.find(p => p.id === formState.linkedProductId);
                            return p ? (
                              <>
                                <img src={p.images?.[0]} className="size-10 rounded-lg object-cover bg-white" />
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-black text-secondary dark:text-white truncate">{p.name}</div>
                                  <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">${p.basePrice}</div>
                                </div>
                                <button onClick={() => setFormState({ ...formState, linkedProductId: '' })} className="size-8 flex items-center justify-center rounded-lg hover:bg-red-100 hover:text-red-500 transition-colors text-gray-400"><span className="material-symbols-outlined text-lg">close</span></button>
                              </>
                            ) : (
                              <div className="flex items-center justify-between w-full">
                                <span className="text-xs text-red-400 font-bold">Linked Product Not Found (ID: {formState.linkedProductId})</span>
                                <button onClick={() => setFormState({ ...formState, linkedProductId: '' })} className="size-8 flex items-center justify-center rounded-lg hover:bg-red-100 hover:text-red-500 transition-colors text-gray-400"><span className="material-symbols-outlined text-lg">close</span></button>
                              </div>
                            )
                          })()}
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowProductPicker(true)}
                          className="w-full h-12 bg-gray-50 dark:bg-black/20 border border-dashed border-gray-300 dark:border-white/20 rounded-xl flex items-center justify-center gap-2 text-gray-400 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all group"
                        >
                          <span className="material-symbols-outlined group-hover:scale-110 transition-transform">add_circle</span>
                          <span className="text-[10px] font-black uppercase tracking-widest">Select Product</span>
                        </button>
                      )}
                    </div>
                    <InputField label="Linked Vendor Node (ID)" value={formState.linkedVendorId!} onChange={v => setFormState({ ...formState, linkedVendorId: v })} />
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-8">
          <section className="bg-white dark:bg-surface-dark p-8 rounded-[40px] border border-gray-100 dark:border-white/5 shadow-soft space-y-8">
            <h3 className="text-[10px] font-black text-secondary dark:text-white uppercase tracking-[0.4em] border-b border-gray-50 dark:border-white/5 pb-4">Background Node</h3>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative aspect-video rounded-[32px] overflow-hidden bg-gray-50 dark:bg-black/20 border-2 border-dashed border-gray-200 dark:border-white/10 flex flex-col items-center justify-center cursor-pointer group hover:border-primary transition-all shadow-inner"
            >
              {formState.featuredImage ? (
                <img src={formState.featuredImage} className="w-full h-full object-cover" alt="Hero Asset" />
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <span className="material-symbols-outlined text-4xl text-gray-300">image_search</span>
                  <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">Add Hero Background</span>
                </div>
              )}
            </div>
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />

            <div className="space-y-4 pt-4">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Lifecycle Status</label>
              <select value={formState.status} onChange={e => setFormState({ ...formState, status: e.target.value as any })} className="w-full h-14 bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-white/10 rounded-2xl px-5 text-xs font-black uppercase tracking-widest appearance-none cursor-pointer text-secondary dark:text-white focus:outline-none focus:border-primary/50">
                <option value="DRAFT">⚪ Offline Draft</option>
                <option value="PUBLISHED">🟢 Active on Cloud</option>
              </select>
            </div>

            <div className="space-y-4 pt-4">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Meta Tags (Comma Separated)</label>
              <input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                className="w-full h-14 bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-white/10 rounded-2xl px-5 text-xs font-bold text-secondary dark:text-white focus:border-primary/50 focus:outline-none placeholder-gray-400"
                placeholder="e.g. Summer, Featured, orange-theme"
              />
            </div>
          </section>
        </div>
      </main >

      <ProductPickerModal
        isOpen={showProductPicker}
        onClose={() => setShowProductPicker(false)}
        onSelect={(p) => setFormState({ ...formState, linkedProductId: p.id })}
        products={productList}
      />
    </div >
  );
};

const ToolBtn: React.FC<{ icon: string; onClick: () => void }> = ({ icon, onClick }) => (
  <button type="button" onClick={onClick} className="size-10 rounded-xl flex items-center justify-center text-gray-400 hover:bg-white dark:hover:bg-white/10 hover:text-primary transition-all">
    <span className="material-symbols-outlined text-[20px]">{icon}</span>
  </button>
);

const InputField = ({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) => (
  <div className="space-y-1.5">
    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</label>
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full h-12 bg-gray-50 dark:bg-black/20 border border-transparent focus:border-primary/50 dark:focus:border-primary/50 rounded-xl px-4 text-xs font-bold text-secondary dark:text-white placeholder-gray-400 transition-all outline-none"
    />
  </div>
);

export default AdminCMSEditor;
