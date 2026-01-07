import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { CMSContent, Product } from '../types';

const AdminMobileAds: React.FC = () => {
    const [ads, setAds] = useState<CMSContent[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [currentAd, setCurrentAd] = useState<Partial<CMSContent>>({
        type: 'MOBILE_AD',
        status: 'PUBLISHED',
        adFormat: 'IMAGE_BANNER',
        ctaText: 'Shop Now'
    });
    const [products, setProducts] = useState<Product[]>([]);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        let unsub = () => { };
        try {
            const q = query(collection(db, "cms_content"), where("type", "==", "MOBILE_AD"));
            unsub = onSnapshot(q, (snap) => {
                setAds(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as CMSContent)));
            }, (error: any) => {
                console.error("Mobile Ads Fetch Error:", error);
            });
        } catch (e) {
            console.error("Mobile Ads setup error", e);
        }

        // Search for products for the dropdown
        const fetchProducts = async () => {
            try {
                const snap = await getDocs(query(collection(db, "products"), where("status", "==", "ACTIVE"))); // simplified for demo
                setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
            } catch (err) { console.error("Product fetch error", err); }
        };
        fetchProducts();

        return () => unsub();
    }, []);

    const handleSave = async () => {
        if (!currentAd.title) return alert('Title is required');

        try {
            if (currentAd.id) {
                await setDoc(doc(db, "cms_content", currentAd.id), { ...currentAd, updatedAt: serverTimestamp() }, { merge: true });
            } else {
                await addDoc(collection(db, "cms_content"), { ...currentAd, type: 'MOBILE_AD', createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
            }
            setIsEditing(false);
            setCurrentAd({ type: 'MOBILE_AD', status: 'PUBLISHED', adFormat: 'IMAGE_BANNER', ctaText: 'Shop Now' });
        } catch (e) {
            console.error(e);
            alert('Error saving ad');
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Delete this ad?')) {
            await deleteDoc(doc(db, "cms_content", id));
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const storageRef = ref(storage, `cms/mobile_ads/${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);
            setCurrentAd(prev => ({ ...prev, featuredImage: url }));
        } catch (error) {
            console.error(error);
            alert('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black text-secondary dark:text-white">Mobile Ads Manager</h2>
                    <p className="text-xs text-gray-400 mt-1">Manage homepage banner slider for mobile app</p>
                </div>
                <button onClick={() => { setCurrentAd({ type: 'MOBILE_AD', status: 'PUBLISHED', adFormat: 'IMAGE_BANNER', ctaText: 'Shop Now' }); setIsEditing(true); }} className="bg-primary text-secondary px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider hover:scale-105 transition-transform">
                    + New Ad Banner
                </button>
            </div>

            {isEditing && (
                <div className="bg-white dark:bg-white/5 p-6 rounded-[32px] border border-gray-100 dark:border-white/5 shadow-xl space-y-6">
                    <h3 className="font-black text-lg text-secondary dark:text-white uppercase tracking-tight">{currentAd.id ? 'Edit Ad' : 'Create New Ad'}</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Internal Title (Admin Only)</label>
                                <input
                                    value={currentAd.title || ''}
                                    onChange={e => setCurrentAd({ ...currentAd, title: e.target.value })}
                                    className="w-full h-12 bg-gray-50 dark:bg-black/20 rounded-xl px-4 text-sm font-bold border-none outline-none focus:ring-2 ring-primary/50"
                                    placeholder="e.g. Summer Sale Mobile Banner"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Ad Format</label>
                                <div className="flex gap-2">
                                    {['IMAGE_BANNER', 'PRODUCT_CARD'].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setCurrentAd({ ...currentAd, adFormat: type as any })}
                                            className={`flex-1 h-10 rounded-lg text-[10px] font-black uppercase ${currentAd.adFormat === type ? 'bg-secondary text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-500'}`}
                                        >
                                            {type.replace('_', ' ')}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {currentAd.adFormat === 'IMAGE_BANNER' && (
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Banner Image (Mobile Portrait)</label>
                                    <input type="file" onChange={handleImageUpload} className="w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-primary file:text-secondary hover:file:bg-primary/80" />
                                    {uploading && <p className="text-[10px] text-primary mt-1">Uploading...</p>}
                                    {currentAd.featuredImage && (
                                        <img src={currentAd.featuredImage} className="mt-2 w-full h-32 object-cover rounded-xl" alt="Preview" />
                                    )}
                                </div>
                            )}

                            {currentAd.adFormat === 'PRODUCT_CARD' && (
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Linked Product</label>
                                    <select
                                        value={currentAd.linkedProductId || ''}
                                        onChange={e => setCurrentAd({ ...currentAd, linkedProductId: e.target.value })}
                                        className="w-full h-12 bg-gray-50 dark:bg-black/20 rounded-xl px-4 text-sm font-bold border-none outline-none"
                                    >
                                        <option value="">Select a Product...</option>
                                        {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.vendor})</option>)}
                                    </select>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Button Text</label>
                                <input
                                    value={currentAd.ctaText || ''}
                                    onChange={e => setCurrentAd({ ...currentAd, ctaText: e.target.value })}
                                    className="w-full h-12 bg-gray-50 dark:bg-black/20 rounded-xl px-4 text-sm font-bold border-none outline-none focus:ring-2 ring-primary/50"
                                    placeholder="e.g. Shop Now"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Button Link / Redirect (Optional)</label>
                                <input
                                    value={currentAd.ctaLink || ''}
                                    onChange={e => setCurrentAd({ ...currentAd, ctaLink: e.target.value })}
                                    className="w-full h-12 bg-gray-50 dark:bg-black/20 rounded-xl px-4 text-sm font-bold border-none outline-none focus:ring-2 ring-primary/50"
                                    placeholder="e.g. /category/shoes or https://..."
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Status</label>
                                <select
                                    value={currentAd.status}
                                    onChange={e => setCurrentAd({ ...currentAd, status: e.target.value as any })}
                                    className="w-full h-12 bg-gray-50 dark:bg-black/20 rounded-xl px-4 text-sm font-bold border-none outline-none"
                                >
                                    <option value="DRAFT">Draft (Hidden)</option>
                                    <option value="PUBLISHED">Published (Visible)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4 border-t border-gray-100 dark:border-white/5">
                        <button onClick={handleSave} className="flex-1 bg-secondary text-white h-12 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-black">Save Ad Banner</button>
                        <button onClick={() => setIsEditing(false)} className="flex-1 bg-gray-100 text-gray-500 h-12 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-gray-200">Cancel</button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ads.map(ad => (
                    <div key={ad.id} className="bg-white dark:bg-white/5 rounded-[32px] p-4 border border-gray-100 dark:border-white/5 group relative overflow-hidden">
                        <div className="aspect-[4/3] rounded-[24px] bg-gray-100 dark:bg-black/20 mb-4 overflow-hidden relative">
                            {ad.adFormat === 'IMAGE_BANNER' && ad.featuredImage && (
                                <img src={ad.featuredImage} className="w-full h-full object-cover" alt="" />
                            )}
                            {ad.adFormat === 'PRODUCT_CARD' && (
                                <div className="flex items-center justify-center h-full text-center p-4">
                                    <div>
                                        <p className="text-[10px] uppercase font-black text-gray-400">Linked Product</p>
                                        <p className="text-secondary dark:text-white font-bold">{products.find(p => p.id === ad.linkedProductId)?.name || 'Unknown Product'}</p>
                                    </div>
                                </div>
                            )}
                            <div className="absolute top-3 right-3 bg-black/50 backdrop-blur text-white text-[9px] font-black px-2 py-1 rounded-lg uppercase">
                                {ad.adFormat === 'IMAGE_BANNER' ? 'Banner' : 'Product'}
                            </div>
                        </div>
                        <h4 className="font-black text-secondary dark:text-white truncate">{ad.title}</h4>
                        <div className="flex justify-between items-center mt-4">
                            <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${ad.status === 'PUBLISHED' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                                {ad.status}
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => { setCurrentAd(ad); setIsEditing(true); }} className="size-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center hover:bg-blue-100"><span className="material-symbols-outlined text-[16px]">edit</span></button>
                                <button onClick={() => handleDelete(ad.id)} className="size-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100"><span className="material-symbols-outlined text-[16px]">delete</span></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminMobileAds;
