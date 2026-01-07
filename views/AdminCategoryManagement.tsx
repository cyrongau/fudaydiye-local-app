
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, getDocs, addDoc, deleteDoc, doc, serverTimestamp, orderBy, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CategoryNode } from '../types';

import IconPickerModal from '../components/IconPickerModal';

const AdminCategoryManagement: React.FC = () => {
   const navigate = useNavigate();
   const fileInputRef = useRef<HTMLInputElement>(null);
   const [categories, setCategories] = useState<CategoryNode[]>([]);
   const [loading, setLoading] = useState(true);
   const [isSaving, setIsSaving] = useState(false);

   const [newName, setNewName] = useState('');
   const [selectedIcon, setSelectedIcon] = useState('category');
   const [iconModalOpen, setIconModalOpen] = useState(false);
   const [selectedImage, setSelectedImage] = useState<string | null>(null);
   const [parentSelection, setParentSelection] = useState<string>('NULL');

   const fetchCategories = async () => {
      setLoading(true);
      try {
         const q = query(collection(db, "categories"), orderBy("createdAt", "asc"));
         const snap = await getDocs(q);
         setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() } as CategoryNode)));
      } catch (err) {
         console.error("Fetch categories error:", err);
         // Fallback to simpler query if orderBy fails
         try {
            const fallbackQ = query(collection(db, "categories"));
            const fallbackSnap = await getDocs(fallbackQ);
            setCategories(fallbackSnap.docs.map(d => ({ id: d.id, ...d.data() } as CategoryNode)));
         } catch (e) {
            console.error("Critical category fetch error", e);
         }
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      fetchCategories();
   }, []);

   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
         const reader = new FileReader();
         reader.onloadend = () => setSelectedImage(reader.result as string);
         reader.readAsDataURL(file);
      }
   };

   const handleAddCategory = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newName.trim()) return;

      setIsSaving(true);
      try {
         await addDoc(collection(db, "categories"), {
            name: newName.trim(),
            parentId: parentSelection === 'NULL' ? null : parentSelection,
            icon: selectedIcon,
            imageUrl: selectedImage || '',
            createdAt: serverTimestamp()
         });
         setNewName('');
         setParentSelection('NULL');
         setSelectedImage(null);
         setSelectedIcon('category');
         fetchCategories();
      } catch (err) {
         alert("Operational Failure: Could not sync taxonomy node.");
      } finally {
         setIsSaving(false);
      }
   };

   const handleDelete = async (id: string) => {
      if (window.confirm("Erase this taxonomy node? This will leave sub-categories orphaned.")) {
         await deleteDoc(doc(db, "categories", id));
         fetchCategories();
      }
   };

   const mainCategories = categories.filter(c => !c.parentId);

   return (
      <div className="flex flex-col h-full animate-in fade-in duration-700 font-display">
         <IconPickerModal
            isOpen={iconModalOpen}
            onClose={() => setIconModalOpen(false)}
            onSelect={setSelectedIcon}
         />

         <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
            <div>
               <h1 className="text-4xl font-black text-secondary dark:text-white tracking-tighter uppercase leading-none">Taxonomy Hub</h1>
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.4em] mt-3">Platform Taxonomy & Categorization Control</p>
            </div>
         </header>

         <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Creation Wing */}
            <div className="lg:col-span-4">
               <section className="bg-white dark:bg-surface-dark p-10 rounded-[48px] border border-gray-100 dark:border-white/5 shadow-soft space-y-8">
                  <div>
                     <h3 className="text-xl font-black text-secondary dark:text-white uppercase tracking-tighter">Deploy Node</h3>
                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Register new category or segment</p>
                  </div>

                  <form onSubmit={handleAddCategory} className="space-y-6">
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Node Identifier (Name)</label>
                        <input
                           required
                           value={newName}
                           onChange={e => setNewName(e.target.value)}
                           className="w-full h-14 bg-gray-50 dark:bg-white/5 border-2 border-gray-100 dark:border-white/10 rounded-2xl px-5 text-sm font-bold text-secondary dark:text-white focus:border-primary transition-all"
                           placeholder="e.g. Traditional Wear"
                        />
                     </div>

                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Visual Symbol (Icon)</label>
                        <button
                           type="button"
                           onClick={() => setIconModalOpen(true)}
                           className="w-full h-16 bg-gray-50 dark:bg-white/5 border-2 border-gray-100 dark:border-white/10 rounded-2xl px-5 flex items-center justify-between hover:border-primary transition-all group"
                        >
                           <div className="flex items-center gap-4">
                              <div className="size-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                                 <span className="material-symbols-outlined text-2xl">{selectedIcon}</span>
                              </div>
                              <span className="text-sm font-bold text-gray-600 dark:text-gray-300 uppercase">{selectedIcon}</span>
                           </div>
                           <span className="text-[10px] font-black text-primary uppercase tracking-widest">Browse Assets</span>
                        </button>
                     </div>

                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Representational Asset (Image)</label>
                        <div
                           onClick={() => fileInputRef.current?.click()}
                           className="w-full aspect-video rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/2 flex flex-col items-center justify-center cursor-pointer group hover:border-primary transition-all overflow-hidden"
                        >
                           {selectedImage ? (
                              <img src={selectedImage} className="w-full h-full object-cover" alt="" />
                           ) : (
                              <span className="material-symbols-outlined text-3xl text-gray-300">add_photo_alternate</span>
                           )}
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                     </div>

                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Parent Protocol (Optional)</label>
                        <select
                           value={parentSelection}
                           onChange={e => setParentSelection(e.target.value)}
                           className="w-full h-14 bg-gray-50 dark:bg-white/5 border-2 border-gray-100 dark:border-white/10 rounded-2xl px-5 text-[10px] font-black uppercase tracking-widest appearance-none cursor-pointer"
                        >
                           <option value="NULL">Root Category (Primary Node)</option>
                           {mainCategories.map(cat => (
                              <option key={cat.id} value={cat.id}>{cat.name}</option>
                           ))}
                        </select>
                     </div>

                     <button
                        disabled={isSaving}
                        className="w-full h-16 bg-primary text-secondary font-black text-xs uppercase tracking-[0.3em] rounded-2xl shadow-primary-glow flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50"
                     >
                        {isSaving ? <span className="animate-spin material-symbols-outlined">sync</span> : 'Initialize Taxonomy Node'}
                     </button>
                  </form>
               </section>
            </div>

            {/* Visibility Wing */}
            <div className="lg:col-span-8">
               <section className="bg-white dark:bg-surface-dark rounded-[48px] border border-gray-100 dark:border-white/5 shadow-soft overflow-hidden">
                  <div className="p-8 border-b border-gray-50 dark:border-white/2 bg-gray-50/50 dark:bg-white/2">
                     <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.3em]">Active Market Segments</h3>
                  </div>

                  <div className="p-8">
                     {loading ? (
                        <div className="py-20 flex justify-center"><div className="size-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div></div>
                     ) : categories.length === 0 ? (
                        <div className="py-20 text-center opacity-30">
                           <span className="material-symbols-outlined text-6xl">category</span>
                           <p className="text-xs font-black uppercase tracking-widest mt-4">No taxonomy nodes mapped in current cluster</p>
                        </div>
                     ) : (
                        <div className="space-y-6">
                           {mainCategories.map(main => (
                              <div key={main.id} className="space-y-4">
                                 <div className="flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                       <div className="size-10 rounded-xl bg-secondary text-primary flex items-center justify-center shadow-lg">
                                          <span className="material-symbols-outlined text-xl">{main.icon || 'hub'}</span>
                                       </div>
                                       <h4 className="text-lg font-black text-secondary dark:text-white uppercase tracking-tighter">{main.name}</h4>
                                    </div>
                                    <button
                                       onClick={() => handleDelete(main.id)}
                                       className="size-9 rounded-xl bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                                    >
                                       <span className="material-symbols-outlined text-lg">delete</span>
                                    </button>
                                 </div>

                                 {/* Sub categories */}
                                 <div className="ml-14 grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {categories.filter(c => c.parentId === main.id).map(sub => (
                                       <div key={sub.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/2 rounded-2xl border border-gray-100 dark:border-white/5 group/sub">
                                          <div className="flex items-center gap-3">
                                             <span className="material-symbols-outlined text-gray-300 text-sm">subdirectory_arrow_right</span>
                                             <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">{sub.name}</span>
                                          </div>
                                          <button
                                             onClick={() => handleDelete(sub.id)}
                                             className="text-gray-300 hover:text-red-500 opacity-0 group-hover/sub:opacity-100 transition-all"
                                          >
                                             <span className="material-symbols-outlined text-[16px]">close</span>
                                          </button>
                                       </div>
                                    ))}
                                 </div>
                              </div>
                           ))}
                        </div>
                     )}
                  </div>
               </section>
            </div>
         </div>
      </div>
   );
};

export default AdminCategoryManagement;
