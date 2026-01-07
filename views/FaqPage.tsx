
import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CMSContent } from '../types';

const FaqPage: React.FC = () => {
  const [faqs, setFaqs] = useState<CMSContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    // Simplified query for testing - fetching all CMS content of type FAQ
    const q = query(
      collection(db, "cms_content"), 
      where("type", "==", "FAQ"), 
      where("status", "==", "PUBLISHED")
    );
    
    const unsub = onSnapshot(q, (snap) => {
      const fetchedFaqs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as CMSContent));
      // Manual client-side sort to ensure they always appear in a good order
      fetchedFaqs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setFaqs(fetchedFaqs);
      setLoading(false);
    }, (err) => {
      console.error("FAQ sync failure:", err);
      setLoading(false);
    });
    
    return () => unsub();
  }, []);

  const filtered = faqs.filter(f => 
    f.title.toLowerCase().includes(search.toLowerCase()) || 
    f.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark pb-32 animate-in fade-in duration-700 font-display">
      <header className="bg-secondary text-white py-24 px-12 text-center relative overflow-hidden rounded-bl-[80px] rounded-br-[80px] md:rounded-bl-[120px] md:rounded-br-[120px] shadow-2xl">
         <div className="absolute inset-0 bg-primary/10 blur-[100px] rounded-full translate-x-1/2"></div>
         <div className="relative z-10 max-w-4xl mx-auto space-y-6">
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.5em] block">Platform Knowledge Base</span>
            <h1 className="text-5xl md:text-8xl font-black tracking-tighter uppercase leading-[0.85]">Help <span className="text-primary italic">Terminal</span></h1>
            <div className="max-w-2xl mx-auto relative mt-10">
               <div className="h-16 md:h-20 bg-white/10 backdrop-blur-xl border-2 border-white/20 rounded-[28px] flex items-center px-8 gap-4 focus-within:border-primary transition-all shadow-2xl">
                  <span className="material-symbols-outlined text-gray-400">search</span>
                  <input 
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search technical specs or policy nodes..."
                    className="bg-transparent border-none focus:ring-0 text-white font-black text-base uppercase tracking-widest placeholder:text-white/30 flex-1"
                  />
               </div>
            </div>
         </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 mt-16 space-y-6">
         {loading ? (
            <div className="py-20 flex justify-center"><div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div></div>
         ) : filtered.length === 0 ? (
            <div className="py-20 text-center opacity-30 uppercase font-black tracking-widest text-xs">
              <span className="material-symbols-outlined text-5xl mb-4">search_off</span>
              <p>No matching nodes found in Terminal</p>
            </div>
         ) : (
            filtered.map(faq => (
               <details key={faq.id} className="bg-white dark:bg-surface-dark rounded-[32px] border border-gray-100 dark:border-white/5 shadow-soft group">
                  <summary className="p-8 flex items-center justify-between cursor-pointer list-none select-none">
                     <h3 className="text-lg font-black text-secondary dark:text-white uppercase tracking-tight pr-6">{faq.title}</h3>
                     <div className="size-10 rounded-xl bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400 group-open:bg-primary group-open:text-secondary transition-all">
                        <span className="material-symbols-outlined transition-transform group-open:rotate-180">expand_more</span>
                     </div>
                  </summary>
                  <div className="px-8 pb-8 border-t border-gray-50 dark:border-white/2 pt-6">
                     <div 
                       className="prose dark:prose-invert max-w-none text-gray-500 dark:text-gray-400 text-sm font-medium leading-loose"
                       dangerouslySetInnerHTML={{ __html: faq.content }}
                     />
                     <div className="mt-6 flex items-center gap-3">
                        <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Logic Segment:</span>
                        <span className="bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded text-[8px] font-black text-gray-500 uppercase tracking-tighter">{faq.category || 'Platform'}</span>
                     </div>
                  </div>
               </details>
            ))
         )}

         <section className="mt-24 p-12 bg-primary text-secondary rounded-[64px] shadow-primary-glow flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="space-y-4 text-center md:text-left">
               <h3 className="text-3xl font-black uppercase tracking-tighter leading-none">Still have questions?</h3>
               <p className="text-xs font-black uppercase tracking-widest opacity-60">Connect with our human support nodes for instant assistance.</p>
            </div>
            <button className="h-16 px-10 bg-secondary text-primary rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all">Start Live Chat</button>
         </section>
      </main>
    </div>
  );
};

export default FaqPage;
