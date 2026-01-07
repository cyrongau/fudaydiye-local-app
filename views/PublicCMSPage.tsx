
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CMSContent } from '../types';

const PublicCMSPage: React.FC<{ slug: string }> = ({ slug }) => {
  const navigate = useNavigate();
  const [data, setData] = useState<CMSContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPage() {
      setLoading(true);
      const q = query(collection(db, "cms_content"), where("slug", "==", slug), where("status", "==", "PUBLISHED"), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setData({ id: snap.docs[0].id, ...snap.docs[0].data() } as CMSContent);
      }
      setLoading(false);
    }
    fetchPage();
  }, [slug]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
      <div className="size-14 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
    </div>
  );

  if (!data) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-10 bg-background-light dark:bg-background-dark text-center">
       <h1 className="text-4xl font-black text-secondary dark:text-white uppercase mb-4">Node Disconnected</h1>
       <p className="text-gray-400 uppercase tracking-widest text-xs">The requested content node is currently inactive.</p>
       <button onClick={() => navigate('/')} className="mt-10 h-14 px-8 bg-primary text-secondary rounded-2xl font-black uppercase text-xs">Return Home</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark animate-in fade-in duration-700">
      {/* Cinematic Hero */}
      <section className="relative h-[50vh] min-h-[400px] w-full bg-secondary flex items-center justify-center overflow-hidden">
        {data.featuredImage && (
          <>
            <img src={data.featuredImage} className="absolute inset-0 w-full h-full object-cover opacity-20 grayscale brightness-50" alt="" />
            <div className="absolute inset-0 bg-gradient-to-t from-secondary via-secondary/70 to-transparent"></div>
          </>
        )}
        <div className="relative z-10 text-center px-6 max-w-5xl">
           <nav className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary mb-8">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <span className="material-symbols-outlined text-xs opacity-30">chevron_right</span>
              <span className="text-white opacity-40">{data.category}</span>
           </nav>
           <h1 className="text-5xl md:text-8xl font-black text-white uppercase tracking-tighter leading-[0.85]">{data.title}</h1>
           <div className="mt-10 h-1 w-20 bg-primary mx-auto rounded-full"></div>
        </div>
      </section>

      <main className="max-w-4xl mx-auto px-6 -mt-24 relative z-20 pb-40">
         <div className="bg-white dark:bg-surface-dark rounded-[80px] p-10 md:p-24 shadow-2xl border border-gray-100 dark:border-white/5">
            <div 
              className="prose prose-xl dark:prose-invert max-w-none prose-p:text-gray-500 dark:prose-p:text-gray-400 prose-headings:text-secondary dark:prose-headings:text-white prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight prose-img:rounded-[40px] prose-a:text-primary"
              dangerouslySetInnerHTML={{ __html: data.content }}
            />
            
            <div className="mt-20 pt-10 border-t border-gray-50 dark:border-white/5 flex flex-wrap gap-3">
               {data.tags?.map(tag => (
                 <span key={tag} className="text-[10px] font-black text-gray-400 border border-gray-200 dark:border-white/10 px-4 py-1.5 rounded-full uppercase tracking-widest">#{tag}</span>
               ))}
            </div>
         </div>

         <div className="mt-16 flex flex-col items-center gap-6 opacity-30 text-center grayscale">
            <div className="size-16 bg-gray-100 dark:bg-white/5 rounded-3xl flex items-center justify-center">
               <span className="material-symbols-outlined text-4xl">security</span>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.5em]">Region Verified Content Node</p>
         </div>
      </main>
    </div>
  );
};

export default PublicCMSPage;
