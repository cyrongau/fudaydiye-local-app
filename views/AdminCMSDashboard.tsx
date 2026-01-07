import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, onSnapshot, orderBy, deleteDoc, doc, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CMSContent } from '../types';
import AdminMobileAds from './AdminMobileAds';
import AdminLiveManager from './AdminLiveManager';

const AdminCMSDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'PAGE' | 'BLOG' | 'FAQ' | 'HOME_SLIDER' | 'SHOP_SLIDER' | 'MOBILE_AD' | 'LIVE_OPS'>('PAGE');
  const [items, setItems] = useState<CMSContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only fetch for generic tabs
    if (activeTab === 'MOBILE_AD' || activeTab === 'LIVE_OPS') return;

    let unsub = () => { };
    try {
      const q = query(collection(db, "cms_content"), orderBy("updatedAt", "desc"));
      unsub = onSnapshot(q, (snap) => {
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as CMSContent));
        setItems(data);
        setLoading(false);
      }, (error: any) => {
        console.error("CMS Fetch Error:", error);
        setLoading(false);
      });
    } catch (e) {
      console.error("CMS setup error", e);
      setLoading(false);
    }
    return () => unsub();
  }, [activeTab]);

  const filteredItems = items.filter(item => item.type === activeTab);

  const handleDelete = async (id: string) => {
    if (window.confirm('Erase this content from the ecosystem?')) {
      await deleteDoc(doc(db, "cms_content", id));
    }
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-700 font-display">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black text-secondary dark:text-white tracking-tighter uppercase leading-none">CMS Terminal</h1>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.4em] mt-3">Platform Content Infrastructure</p>
        </div>
        {activeTab !== 'MOBILE_AD' && activeTab !== 'LIVE_OPS' && (
          <button
            onClick={() => navigate(`/admin/cms/create/${activeTab}`)}
            className="h-16 px-10 bg-primary text-secondary rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg hover:shadow-primary-glow active:scale-95 transition-all flex items-center gap-3"
          >
            <span className="material-symbols-outlined">add_circle</span>
            Create {activeTab.replace('_', ' ')}
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-12">
          <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-2xl border border-gray-200 dark:border-white/10 w-fit mb-8 overflow-x-auto no-scrollbar max-w-full">
            {(['PAGE', 'BLOG', 'FAQ', 'HOME_SLIDER', 'SHOP_SLIDER', 'MOBILE_AD', 'LIVE_OPS'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab
                  ? 'bg-white dark:bg-surface-dark text-secondary dark:text-primary shadow-sm'
                  : 'text-gray-400 hover:text-secondary dark:hover:text-white'
                  }`}
              >
                {tab === 'MOBILE_AD' ? 'MOBILE ADS' : tab.replace('_', ' ')}
              </button>
            ))}
          </div>

          {activeTab === 'MOBILE_AD' ? (
            <AdminMobileAds />
          ) : activeTab === 'LIVE_OPS' ? (
            <AdminLiveManager />
          ) : (
            <div className="bg-white dark:bg-surface-dark rounded-[40px] border border-gray-100 dark:border-white/5 shadow-soft overflow-hidden">
              {/* Existing Table Code */}
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-50 dark:border-white/5 bg-gray-50/50 dark:bg-white/2">
                      <th className="py-5 px-8 text-[10px] font-black text-gray-400 uppercase tracking-widest">Descriptor</th>
                      <th className="py-5 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</th>
                      <th className="py-5 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                      <th className="py-5 px-8 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Control</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-white/2">
                    {loading ? (
                      <tr><td colSpan={4} className="py-20 text-center"><div className="size-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div></td></tr>
                    ) : filteredItems.length === 0 ? (
                      <tr><td colSpan={4} className="py-20 text-center opacity-30 uppercase text-[10px] font-black tracking-widest">No {activeTab.toLowerCase()} nodes detected</td></tr>
                    ) : (
                      filteredItems.map(item => (
                        <tr key={item.id} className="group hover:bg-gray-50/50 dark:hover:bg-white/2 transition-colors">
                          <td className="py-6 px-8">
                            <div className="flex items-center gap-4">
                              {item.featuredImage ? (
                                <img src={item.featuredImage} className="size-14 rounded-2xl object-cover border dark:border-white/10" alt="" />
                              ) : (
                                <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                  <span className="material-symbols-outlined">
                                    {item.type.includes('SLIDER') ? 'view_carousel' : 'description'}
                                  </span>
                                </div>
                              )}
                              <div>
                                <p className="text-sm font-black text-secondary dark:text-white uppercase truncate max-w-[300px]">{item.title}</p>
                                <p className="text-[9px] font-bold text-gray-400 uppercase">Slug: /{item.slug}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-6 px-6">
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{item.type}</span>
                          </td>
                          <td className="py-6 px-6">
                            <span className={`text-[9px] font-black px-2 py-1 rounded-lg border uppercase tracking-widest ${item.status === 'PUBLISHED' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="py-6 px-8 text-right">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => navigate(`/admin/cms/edit/${item.type}/${item.id}`)} className="size-10 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400 hover:text-primary transition-all"><span className="material-symbols-outlined text-[20px]">edit_note</span></button>
                              <button onClick={() => handleDelete(item.id)} className="size-10 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-red-500 hover:bg-red-50 transition-all"><span className="material-symbols-outlined text-[20px]">delete_forever</span></button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminCMSDashboard;
