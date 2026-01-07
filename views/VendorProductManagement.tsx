
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Providers';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, deleteDoc, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product, ProductVariation, ProductType, CategoryNode } from '../types';

const PRODUCT_TAGS = ['FEATURED', 'HOT DEAL', 'NEW', 'BEST SELLER', 'LIMITED'];

const VendorProductManagement: React.FC = () => {
   const navigate = useNavigate();
   const { user, profile } = useAuth();

   const [showModal, setShowModal] = useState(false);
   const [editingId, setEditingId] = useState<string | null>(null);
   const [products, setProducts] = useState<Product[]>([]);
   const [categories, setCategories] = useState<CategoryNode[]>([]);
   const [loading, setLoading] = useState(true);
   const [isSaving, setIsSaving] = useState(false);

   const mainGalleryInputRef = useRef<HTMLInputElement>(null);
   const longDescRef = useRef<HTMLDivElement>(null);

   const [formState, setFormState] = useState<Partial<Product>>({
      name: '',
      productType: 'SIMPLE',
      basePrice: 0,
      salePrice: 0,
      tags: [],
      baseStock: 0,
      images: [],
      category: '',
      shortDescription: '',
      description: '',
      status: 'ACTIVE',
      hasVariations: false,
      attributes: [],
      variations: [],
      isExternal: false,
      externalUrl: '',
   });

   useEffect(() => {
      if (!user) return;
      setLoading(true);

      // Products listener
      const qP = query(collection(db, "products"), where("vendorId", "==", user.uid));
      const unsubscribeProducts = onSnapshot(qP, (snapshot) => {
         const prods = snapshot.docs.map(d => {
            const data = d.data();
            return {
               id: d.id,
               ...data,
               productType: data.productType || 'SIMPLE',
               category: data.category || 'Uncategorized'
            } as any;
         });
         prods.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
         setProducts(prods);
         setLoading(false);
      });

      // Categories listener
      const qC = query(collection(db, "categories"), orderBy("name", "asc"));
      const unsubscribeCategories = onSnapshot(qC, (snapshot) => {
         const cats = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as CategoryNode));
         setCategories(cats);
         // Set default category if not set
         if (cats.length > 0 && !formState.category) {
            setFormState(prev => ({ ...prev, category: cats[0].name }));
         }
      });

      return () => {
         unsubscribeProducts();
         unsubscribeCategories();
      };
   }, [user]);

   // Handle initial content for the WYSIWYG when editing or opening
   useEffect(() => {
      if (showModal && longDescRef.current) {
         longDescRef.current.innerHTML = formState.description || '';
      }
   }, [showModal, editingId]);

   const addManualVariation = () => {
      const newVar: ProductVariation = {
         id: `var-${Date.now()}`,
         attributeValues: {},
         name: '',
         price: formState.basePrice || 0,
         salePrice: 0,
         stock: formState.baseStock || 0,
         image: ''
      };
      setFormState(prev => ({
         ...prev,
         variations: [...(prev.variations || []), newVar]
      }));
   };

   const removeVariation = (id: string) => {
      setFormState(prev => ({
         ...prev,
         variations: prev.variations?.filter(v => v.id !== id)
      }));
   };

   const updateVariation = (id: string, updates: Partial<ProductVariation>) => {
      setFormState(prev => ({
         ...prev,
         variations: prev.variations?.map(v => v.id === id ? { ...v, ...updates } : v)
      }));
   };

   const handleVarImageUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
         const reader = new FileReader();
         reader.onloadend = () => {
            updateVariation(id, { image: reader.result as string });
         };
         reader.readAsDataURL(file);
      }
   };

   const execCommand = (command: string, value: string = '') => {
      document.execCommand(command, false, value);
      longDescRef.current?.focus();
   };

   const handleFormSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user || !formState.name) return;

      setIsSaving(true);
      // Get description from the contentEditable div
      const longDescription = longDescRef.current?.innerHTML || '';

      const payload = {
         ...formState,
         description: longDescription,
         basePrice: Number(formState.basePrice),
         salePrice: Number(formState.salePrice) || 0,
         baseStock: Number(formState.baseStock),
         vendorId: user.uid,
         vendor: profile?.businessName || profile?.fullName || "Verified Vendor",
         updatedAt: serverTimestamp(),
         hasVariations: formState.productType === 'VARIABLE'
      };

      try {
         if (editingId) {
            await updateDoc(doc(db, "products", editingId), payload);
         } else {
            await addDoc(collection(db, "products"), { ...payload, createdAt: serverTimestamp(), rating: 5, reviewsCount: 0 });
         }
         setShowModal(false);
         setEditingId(null);
      } catch (err) { alert("Operational Failure: Sync failed."); } finally { setIsSaving(false); }
   };

   const toggleTag = (tag: string) => {
      setFormState(prev => {
         const tags = prev.tags || [];
         return tags.includes(tag) ? { ...prev, tags: tags.filter(t => t !== tag) } : { ...prev, tags: [...tags, tag] };
      });
   };

   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onloadend = () => {
         setFormState(prev => ({ ...prev, images: [...(prev.images || []), reader.result as string] }));
      };
      reader.readAsDataURL(file);
   };

   const [searchQuery, setSearchQuery] = useState('');
   const [filterCategory, setFilterCategory] = useState('All');

   // Filter logic
   const filteredProducts = products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
         (p.category || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = filterCategory === 'All' || p.category === filterCategory;
      return matchesSearch && matchesCategory;
   });

   // Grouped categories
   const mainCats = categories.filter(c => !c.parentId);

   return (
      <div className="flex flex-col h-full animate-in fade-in duration-700 font-display">
         <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
            <div>
               <h1 className="text-4xl font-black text-secondary dark:text-white tracking-tighter uppercase leading-none">Catalog Hub</h1>
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.4em] mt-3">Manual SKU & Asset Control</p>
            </div>
            <button
               onClick={() => { setEditingId(null); setFormState({ name: '', productType: 'SIMPLE', basePrice: 0, salePrice: 0, tags: [], baseStock: 0, images: [], category: categories[0]?.name || 'Fashion', shortDescription: '', description: '', status: 'ACTIVE', attributes: [], variations: [] }); setShowModal(true); }}
               className="h-14 md:h-16 px-6 md:px-10 bg-primary text-secondary rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3 w-full md:w-auto"
            >
               <span className="material-symbols-outlined">add_box</span>
               New Listing
            </button>
         </header>

         {/* Search and Filter Toolbar */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="md:col-span-2 relative">
               <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">search</span>
               <input
                  type="text"
                  placeholder="Search inventory by name, SKU, or tag..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-12 pl-12 pr-4 bg-white dark:bg-surface-dark border border-gray-100 dark:border-white/5 rounded-2xl text-sm font-bold placeholder:font-medium placeholder:text-gray-400 outline-none focus:border-primary/50 transition-colors shadow-sm"
               />
            </div>
            <div className="relative">
               <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full h-12 pl-4 pr-10 bg-white dark:bg-surface-dark border border-gray-100 dark:border-white/5 rounded-2xl text-xs font-black uppercase appearance-none outline-none focus:border-primary/50 transition-colors shadow-sm cursor-pointer"
               >
                  <option value="All">All Categories</option>
                  {mainCats.map(c => (
                     <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
               </select>
               <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">filter_list</span>
            </div>
         </div>

         <div className="bg-white dark:bg-surface-dark rounded-[40px] border border-gray-100 dark:border-white/5 shadow-soft overflow-hidden flex-1 flex flex-col min-h-0">
            <div className="overflow-x-auto h-full overflow-y-auto no-scrollbar">
               <table className="w-full text-left">
                  <thead>
                     <tr className="border-b border-gray-50 dark:border-white/5 bg-gray-50/50 dark:bg-white/2 font-black text-[10px] text-gray-400 uppercase tracking-widest">
                        <th className="py-5 px-4 md:px-8">Product Node</th>
                        <th className="py-5 px-6 hidden md:table-cell">Type</th>
                        <th className="py-5 px-4 md:px-6 text-right md:text-left">Main Price</th>
                        <th className="py-5 px-6 hidden md:table-cell">Status</th>
                        <th className="py-5 px-8 text-right">Actions</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-white/2">
                     {loading ? (
                        <tr><td colSpan={5} className="py-20 text-center uppercase font-black text-[10px]">Syncing Mesh...</td></tr>
                     ) : filteredProducts.length === 0 ? (
                        <tr><td colSpan={5} className="py-20 text-center uppercase font-black text-[10px] text-gray-400">No products match your search.</td></tr>
                     ) : filteredProducts.map(p => (
                        <tr
                           key={p.id}
                           onClick={() => { setEditingId(p.id); setFormState(p); setShowModal(true); }}
                           className="group hover:bg-gray-50/50 dark:hover:bg-white/2 transition-colors cursor-pointer"
                        >
                           <td className="py-5 px-4 md:px-8">
                              <div className="flex items-center gap-4">
                                 <img src={p.images?.[0] || 'https://picsum.photos/200'} className="size-12 rounded-xl object-cover border dark:border-white/10" alt="" />
                                 <div>
                                    <p className="text-sm font-black text-secondary dark:text-white uppercase truncate max-w-[140px] md:max-w-[200px]">{p.name}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                       <p className="text-[9px] font-bold text-gray-400 uppercase">{p.category}</p>
                                       <span className={`md:hidden text-[7px] font-black px-1.5 py-0.5 rounded uppercase ${p.productType === 'VARIABLE' ? 'bg-purple-100 text-purple-700' : p.productType === 'EXTERNAL' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                                          {(p.productType || 'S').substring(0, 1)}
                                       </span>
                                       <span className={`md:hidden size-1.5 rounded-full ${p.status === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                    </div>
                                 </div>
                              </div>
                           </td>
                           <td className="py-5 px-6 hidden md:table-cell">
                              <span className={`text-[8px] font-black px-2 py-1 rounded uppercase ${p.productType === 'VARIABLE' ? 'bg-purple-100 text-purple-700' : p.productType === 'EXTERNAL' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                                 {p.productType}
                              </span>
                           </td>
                           <td className="py-5 px-4 md:px-6 text-right md:text-left">
                              <div className="flex flex-col md:block">
                                 <span className="text-sm font-black text-primary">${p.salePrice || p.basePrice}</span>
                                 {p.salePrice > 0 && <span className="text-[9px] text-gray-400 line-through md:ml-2">${p.basePrice}</span>}
                              </div>
                           </td>
                           <td className="py-5 px-6 hidden md:table-cell">
                              <span className={`text-[9px] font-black uppercase tracking-widest ${p.status === 'ACTIVE' ? 'text-primary' : 'text-gray-400'}`}>{p.status}</span>
                           </td>
                           <td className="py-5 px-8 text-right">
                              <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                 <button onClick={() => { setEditingId(p.id); setFormState(p); setShowModal(true); }} className="size-9 rounded-xl bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400 hover:text-primary transition-all"><span className="material-symbols-outlined text-[18px]">edit</span></button>
                                 <button onClick={() => deleteDoc(doc(db, "products", p.id))} className="size-9 rounded-xl bg-gray-50 dark:bg-white/5 flex items-center justify-center text-red-500 hover:bg-red-50 transition-all"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                              </div>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>

         {showModal && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 overflow-y-auto">
               <div className="fixed inset-0 bg-secondary/90 backdrop-blur-xl" onClick={() => setShowModal(false)}></div>
               <div className="relative w-full max-w-5xl bg-white dark:bg-surface-dark rounded-[56px] shadow-2xl p-10 max-h-[90vh] overflow-y-auto no-scrollbar border border-white/10 animate-in zoom-in-95">
                  <header className="flex justify-between items-start mb-10">
                     <div>
                        <h2 className="text-3xl font-black text-secondary dark:text-white uppercase tracking-tighter">Listing Architect</h2>
                        <p className="text-[10px] font-bold text-primary uppercase tracking-[0.4em] mt-2">Mode: {formState.productType} Entry</p>
                     </div>
                     <button onClick={() => setShowModal(false)} className="size-12 rounded-2xl bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400 hover:text-red-500 transition-all"><span className="material-symbols-outlined">close</span></button>
                  </header>

                  <form onSubmit={handleFormSubmit} className="space-y-12">
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        <div className="md:col-span-1 space-y-6">
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Product Title</label>
                              <input required value={formState.name} onChange={e => setFormState({ ...formState, name: e.target.value })} className="w-full h-14 bg-gray-50 dark:bg-white/5 border-2 border-gray-100 dark:border-white/10 rounded-2xl px-5 text-sm font-bold" placeholder="e.g. Apple iphone 15 pro" />
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Deployment Protocol</label>
                              <select value={formState.productType} onChange={e => setFormState({ ...formState, productType: e.target.value as ProductType })} className="w-full h-14 bg-gray-50 dark:bg-white/5 border-2 border-gray-100 dark:border-white/10 rounded-2xl px-5 text-[10px] font-black uppercase appearance-none cursor-pointer">
                                 <option value="SIMPLE">Simple Product</option>
                                 <option value="VARIABLE">Variable Product</option>
                                 <option value="EXTERNAL">External Affiliate</option>
                              </select>
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Product Category</label>
                              <select required value={formState.category} onChange={e => setFormState({ ...formState, category: e.target.value })} className="w-full h-14 bg-gray-50 dark:bg-white/5 border-2 border-gray-100 dark:border-white/10 rounded-2xl px-5 text-[10px] font-black uppercase appearance-none cursor-pointer">
                                 <option value="" disabled>Select Segment</option>
                                 {mainCats.map(main => (
                                    <React.Fragment key={main.id}>
                                       <option value={main.name}>{main.name}</option>
                                       {categories.filter(c => c.parentId === main.id).map(sub => (
                                          <option key={sub.id} value={sub.name}>{'\u00A0\u00A0\u00A0'}{main.name} {'>'} {sub.name}</option>
                                       ))}
                                    </React.Fragment>
                                 ))}
                                 {categories.length === 0 && <option value="Uncategorized">Uncategorized</option>}
                              </select>
                           </div>
                        </div>

                        <div className="md:col-span-2 space-y-6">
                           <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Default Price ($)</label>
                                 <input type="number" step="0.01" value={formState.basePrice} onChange={e => setFormState({ ...formState, basePrice: parseFloat(e.target.value) })} className="w-full h-14 bg-gray-50 dark:bg-white/5 border-2 border-gray-100 dark:border-white/10 rounded-2xl px-5 text-sm font-black" />
                              </div>
                              <div className="space-y-1.5">
                                 <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1">Sale Price ($)</label>
                                 <input type="number" step="0.01" value={formState.salePrice} onChange={e => setFormState({ ...formState, salePrice: parseFloat(e.target.value) })} className="w-full h-14 border-2 border-primary/20 bg-white dark:bg-surface-dark rounded-2xl px-5 text-sm font-black text-primary placeholder:text-primary/30" placeholder="Optional" />
                              </div>
                           </div>
                           <div className="space-y-3">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Marketing Nodes</label>
                              <div className="flex flex-wrap gap-2">
                                 {PRODUCT_TAGS.map(t => (
                                    <button key={t} type="button" onClick={() => toggleTag(t)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${formState.tags?.includes(t) ? 'bg-primary text-secondary border-primary shadow-sm' : 'bg-gray-50 dark:bg-white/5 border border-transparent text-gray-400'}`}>{t}</button>
                                 ))}
                              </div>
                           </div>
                        </div>
                     </div>

                     {/* New Features: Short and Long Descriptions */}
                     <div className="grid grid-cols-1 gap-10">
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Product Short Description</label>
                           <textarea
                              value={formState.shortDescription}
                              onChange={e => setFormState({ ...formState, shortDescription: e.target.value })}
                              className="w-full h-24 bg-gray-50 dark:bg-white/5 border-2 border-gray-100 dark:border-white/10 rounded-2xl px-5 py-4 text-sm font-medium"
                              placeholder="Brief summary for catalog previews..."
                           />
                        </div>

                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Product Long Description (Rich Text)</label>
                           <div className="border-2 border-gray-100 dark:border-white/10 rounded-[32px] overflow-hidden bg-white dark:bg-surface-dark">
                              <div className="bg-gray-50 dark:bg-white/2 p-3 flex flex-wrap gap-2 border-b border-gray-100 dark:border-white/5">
                                 <button type="button" onClick={() => execCommand('bold')} className="size-9 rounded-lg bg-white dark:bg-surface-dark flex items-center justify-center text-gray-400 hover:text-primary transition-all border border-gray-100 dark:border-white/10 shadow-sm"><span className="material-symbols-outlined text-[18px]">format_bold</span></button>
                                 <button type="button" onClick={() => execCommand('italic')} className="size-9 rounded-lg bg-white dark:bg-surface-dark flex items-center justify-center text-gray-400 hover:text-primary transition-all border border-gray-100 dark:border-white/10 shadow-sm"><span className="material-symbols-outlined text-[18px]">format_italic</span></button>
                                 <button type="button" onClick={() => execCommand('insertUnorderedList')} className="size-9 rounded-lg bg-white dark:bg-surface-dark flex items-center justify-center text-gray-400 hover:text-primary transition-all border border-gray-100 dark:border-white/10 shadow-sm"><span className="material-symbols-outlined text-[18px]">format_list_bulleted</span></button>
                                 <button type="button" onClick={() => execCommand('insertOrderedList')} className="size-9 rounded-lg bg-white dark:bg-surface-dark flex items-center justify-center text-gray-400 hover:text-primary transition-all border border-gray-100 dark:border-white/10 shadow-sm"><span className="material-symbols-outlined text-[18px]">format_list_numbered</span></button>
                                 <button type="button" onClick={() => execCommand('undo')} className="size-9 rounded-lg bg-white dark:bg-surface-dark flex items-center justify-center text-gray-400 hover:text-primary transition-all border border-gray-100 dark:border-white/10 shadow-sm ml-auto"><span className="material-symbols-outlined text-[18px]">undo</span></button>
                                 <button type="button" onClick={() => execCommand('redo')} className="size-9 rounded-lg bg-white dark:bg-surface-dark flex items-center justify-center text-gray-400 hover:text-primary transition-all border border-gray-100 dark:border-white/10 shadow-sm"><span className="material-symbols-outlined text-[18px]">redo</span></button>
                              </div>
                              <div
                                 ref={longDescRef}
                                 contentEditable
                                 className="w-full min-h-[250px] p-6 text-sm font-medium text-secondary dark:text-white focus:outline-none overflow-y-auto no-scrollbar"
                                 placeholder="Enter detailed technical and narrative specifications..."
                              ></div>
                           </div>
                        </div>
                     </div>

                     {formState.productType === 'VARIABLE' && (
                        <section className="bg-gray-50/50 dark:bg-white/2 p-8 rounded-[40px] border border-gray-100 dark:border-white/5 space-y-8 animate-in slide-in-from-top-4">
                           <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-6">
                              <div>
                                 <h3 className="text-sm font-black text-secondary dark:text-white uppercase tracking-tighter flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">layers</span>
                                    Variation Matrix
                                 </h3>
                                 <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1">Manual node assignment required</p>
                              </div>
                              <button
                                 type="button"
                                 onClick={addManualVariation}
                                 className="h-11 px-6 bg-secondary text-primary rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center gap-2 active:scale-95 transition-all"
                              >
                                 <span className="material-symbols-outlined text-[18px]">add_circle</span>
                                 Add Variation Node
                              </button>
                           </div>

                           <div className="grid grid-cols-1 gap-6">
                              {formState.variations?.map((v, i) => (
                                 <div key={v.id} className="bg-white dark:bg-surface-dark p-6 rounded-[32px] border border-gray-100 dark:border-white/5 shadow-soft flex flex-col lg:flex-row gap-6 items-start">
                                    <div className="flex flex-col gap-3 shrink-0">
                                       <div className="relative size-24 rounded-2xl overflow-hidden border-2 border-gray-100 dark:border-white/10 group/img cursor-pointer" onClick={() => document.getElementById(`var-file-${v.id}`)?.click()}>
                                          {v.image ? <img src={v.image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 dark:bg-white/5 text-gray-300"><span className="material-symbols-outlined">image</span></div>}
                                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity"><span className="material-symbols-outlined text-white">upload</span></div>
                                       </div>
                                       <input type="file" id={`var-file-${v.id}`} className="hidden" accept="image/*" onChange={(e) => handleVarImageUpload(v.id, e)} />
                                    </div>

                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 w-full">
                                       <div className="md:col-span-2 space-y-1.5">
                                          <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Identifier (e.g. Red / XL)</label>
                                          <input value={v.name} onChange={e => updateVariation(v.id, { name: e.target.value })} className="w-full h-11 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl px-4 text-xs font-bold" />
                                       </div>
                                       <div className="space-y-1.5">
                                          <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Price ($)</label>
                                          <input type="number" step="0.01" value={v.price} onChange={e => updateVariation(v.id, { price: parseFloat(e.target.value) })} className="w-full h-11 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl px-4 text-xs font-black" />
                                       </div>
                                       <div className="space-y-1.5">
                                          <label className="text-[8px] font-black text-primary uppercase tracking-widest">Sale ($)</label>
                                          <input type="number" step="0.01" value={v.salePrice} onChange={e => updateVariation(v.id, { salePrice: parseFloat(e.target.value) })} className="w-full h-11 bg-primary/5 border border-primary/20 rounded-xl px-4 text-xs font-black text-primary" />
                                       </div>
                                       <div className="space-y-1.5">
                                          <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Stock Node</label>
                                          <input type="number" value={v.stock} onChange={e => updateVariation(v.id, { stock: parseInt(e.target.value) })} className="w-full h-11 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl px-4 text-xs font-black" />
                                       </div>
                                    </div>
                                    <button type="button" onClick={() => removeVariation(v.id)} className="size-11 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all"><span className="material-symbols-outlined">delete</span></button>
                                 </div>
                              ))}
                           </div>
                        </section>
                     )}

                     <section className="space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Asset Repository (Main Gallery)</label>
                        <div className="flex flex-wrap gap-4">
                           {formState.images?.map((img, i) => (
                              <div key={i} className="relative size-32 rounded-[32px] overflow-hidden border border-gray-100 shadow-soft group">
                                 <img src={img} className="w-full h-full object-cover" />
                                 <button type="button" onClick={() => setFormState({ ...formState, images: formState.images?.filter((_, idx) => idx !== i) })} className="absolute top-2 right-2 size-8 rounded-full bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"><span className="material-symbols-outlined text-[18px]">close</span></button>
                              </div>
                           ))}
                           <button type="button" onClick={() => mainGalleryInputRef.current?.click()} className="size-32 rounded-[32px] border-2 border-dashed border-gray-200 dark:border-white/10 flex flex-col items-center justify-center text-gray-300 hover:border-primary hover:text-primary transition-all gap-2 bg-gray-50 dark:bg-white/2">
                              <span className="material-symbols-outlined text-4xl">add_photo_alternate</span>
                              <span className="text-[8px] font-black uppercase tracking-widest">Inject Asset</span>
                           </button>
                           <input type="file" ref={mainGalleryInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                        </div>
                     </section>

                     <div className="pt-10 flex flex-col md:flex-row items-center gap-6">
                        {editingId && (
                           <button
                              type="button"
                              onClick={() => {
                                 if (confirm('Are you sure you want to delete this listing permanently?')) {
                                    deleteDoc(doc(db, "products", editingId));
                                    setShowModal(false);
                                 }
                              }}
                              className="w-full md:w-auto h-20 px-10 bg-red-50 dark:bg-red-500/10 text-red-500 font-black text-xs uppercase tracking-[0.2em] rounded-[32px] hover:bg-red-500 hover:text-white transition-all order-last md:order-first"
                           >
                              Delete Listing
                           </button>
                        )}
                        <button type="submit" disabled={isSaving} className="w-full h-20 bg-primary text-secondary font-black text-base uppercase tracking-[0.4em] rounded-[32px] shadow-primary-glow active:scale-[0.98] transition-all disabled:opacity-50 flex-1">
                           {isSaving ? 'Synchronizing Database...' : 'Authorize Deployment'}
                        </button>
                     </div>
                  </form>
               </div>
            </div>
         )}
      </div>
   );
};

export default VendorProductManagement;
