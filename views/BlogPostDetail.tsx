
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CMSContent } from '../types';

const BlogPostDetail: React.FC = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<CMSContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPost() {
      setLoading(true);
      const q = query(collection(db, "cms_content"), where("slug", "==", slug), where("type", "==", "BLOG"), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setData({ id: snap.docs[0].id, ...snap.docs[0].data() } as CMSContent);
      }
      setLoading(false);
    }
    fetchPost();
  }, [slug]);

  if (loading) return <div className="h-screen flex items-center justify-center"><div className="size-14 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div></div>;
  if (!data) return <div className="h-screen flex items-center justify-center p-10 text-center font-display uppercase font-black">Content Node Not Found</div>;

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark pb-32 animate-in fade-in duration-700 font-display">
      <header className="relative h-[60vh] min-h-[500px] w-full bg-secondary flex items-end p-12 overflow-hidden">
         {data.featuredImage && (
           <>
            <img src={data.featuredImage} className="absolute inset-0 w-full h-full object-cover opacity-40 grayscale" alt="" />
            <div className="absolute inset-0 bg-gradient-to-t from-secondary via-secondary/20 to-transparent"></div>
           </>
         )}
         <div className="relative z-10 max-w-5xl mx-auto w-full space-y-6">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/blog')} className="size-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white active:scale-90 transition-all shadow-xl hover:bg-white/20">
                 <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <span className="bg-primary text-secondary px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.4em] shadow-lg">{data.category}</span>
            </div>
            <h1 className="text-4xl md:text-7xl font-black text-white uppercase tracking-tighter leading-tight drop-shadow-2xl">{data.title}</h1>
            <div className="flex items-center gap-6 pt-4 border-t border-white/10">
               <div className="flex items-center gap-3">
                  <img src={`https://ui-avatars.com/api/?name=${data.author || 'Admin'}&background=015754&color=06DC7F`} className="size-10 rounded-full border-2 border-primary/40 shadow-lg" alt="" />
                  <div>
                     <p className="text-[9px] font-black text-primary uppercase tracking-widest">{data.author || 'Fudaydiye Team'}</p>
                     <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">{new Date(data.createdAt?.seconds * 1000).toLocaleDateString()}</p>
                  </div>
               </div>
               <div className="flex gap-2">
                  {data.tags?.map(t => <span key={t} className="text-[9px] font-black text-white/30 uppercase tracking-widest">#{t}</span>)}
               </div>
            </div>
         </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 mt-16">
         <div className="bg-white dark:bg-surface-dark rounded-[64px] p-10 md:p-20 shadow-soft border border-gray-100 dark:border-white/5">
            <div 
              className="prose prose-lg dark:prose-invert max-w-none prose-p:text-gray-500 dark:prose-p:text-gray-400 prose-headings:text-secondary dark:prose-headings:text-white prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight prose-img:rounded-[40px] prose-a:text-primary"
              dangerouslySetInnerHTML={{ __html: data.content }}
            />
         </div>

         {/* Share Action */}
         <div className="mt-16 flex flex-col items-center gap-10">
            <div className="h-px w-32 bg-primary/20"></div>
            <div className="flex items-center gap-4">
               <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">Share Narrative</span>
               <div className="flex gap-4">
                  {['facebook', 'chat', 'link'].map(s => (
                    <button key={s} className="size-12 rounded-2xl bg-white dark:bg-surface-dark border border-gray-100 dark:border-white/5 shadow-soft flex items-center justify-center text-gray-400 hover:text-primary transition-all active:scale-90">
                       <span className="material-symbols-outlined text-[20px]">{s === 'link' ? 'content_copy' : s === 'chat' ? 'share' : 'public'}</span>
                    </button>
                  ))}
               </div>
            </div>
         </div>
      </main>
    </div>
  );
};

export default BlogPostDetail;
