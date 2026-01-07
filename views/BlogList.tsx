
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CMSContent } from '../types';

const BlogList: React.FC = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<CMSContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState('All');

  useEffect(() => {
    // Fetch with simple filters and sort client-side to bypass composite index requirements
    const q = query(
      collection(db, "cms_content"),
      where("type", "==", "BLOG"),
      where("status", "==", "PUBLISHED")
    );

    const unsub = onSnapshot(q, (snap) => {
      const fetched = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as CMSContent));
      // Client-side sort: newest entries first
      fetched.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
      setPosts(fetched);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const categories = ['All', ...new Set(posts.map(p => p.category || 'General'))];
  const filteredPosts = activeCat === 'All' ? posts : posts.filter(p => p.category === activeCat);

  return (
    <div className="flex flex-col min-h-screen animate-in fade-in duration-700 bg-background-light dark:bg-background-dark font-display">
      {/* cinematic Blog Hero */}
      <header className="relative h-[60vh] min-h-[500px] w-full bg-secondary flex items-center justify-center overflow-hidden pb-32">
        <div className="absolute inset-0 bg-primary/5 blur-[120px] rounded-full -translate-x-1/2"></div>
        <div className="relative z-10 text-center px-6 max-w-5xl">
          <nav className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary mb-8">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <span className="material-symbols-outlined text-xs opacity-30 text-white">chevron_right</span>
            <span className="text-white opacity-40">Narrative Grid</span>
          </nav>
          <h1 className="text-6xl md:text-9xl font-black text-white tracking-tighter uppercase leading-[0.8] drop-shadow-2xl">
            Market <br /> <span className="text-primary italic">Journal</span>
          </h1>
          <p className="text-sm md:text-xl font-bold text-white/50 uppercase tracking-[0.3em] mt-10 max-w-2xl mx-auto leading-relaxed">
            Expert strategies, merchant success stories, and technical nodes from the Horn of Africa.
          </p>
        </div>
      </header>

      <main className="w-full px-6 md:px-12 -mt-20 relative z-20 pb-40">
        <div className="max-w-[1600px] mx-auto space-y-12">
          {/* Category Bar */}
          <div className="flex justify-center gap-3 overflow-x-auto no-scrollbar py-6 bg-white dark:bg-surface-dark p-4 rounded-[40px] shadow-2xl border border-white/10 w-fit mx-auto">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCat(cat)}
                className={`px-8 h-12 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border-2 ${activeCat === cat
                    ? 'bg-secondary border-secondary text-primary shadow-lg scale-105'
                    : 'bg-transparent text-gray-400 border-gray-100 dark:border-white/5 hover:border-gray-300'
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {[...Array(6)].map((_, i) => <div key={i} className="aspect-[4/5] rounded-[64px] bg-gray-100 dark:bg-white/5 animate-pulse"></div>)}
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="py-40 text-center opacity-30 uppercase text-xs font-black tracking-widest">No nodes detected in cluster</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredPosts.map(post => (
                <div
                  key={post.id}
                  onClick={() => navigate(`/blog/${post.slug}`)}
                  className="bg-white dark:bg-surface-dark rounded-[64px] overflow-hidden shadow-soft border border-gray-100 dark:border-white/5 flex flex-col group cursor-pointer hover:-translate-y-3 transition-all duration-500 hover:border-primary/20"
                >
                  <div className="aspect-[4/3] relative overflow-hidden bg-gray-50 dark:bg-black/20">
                    {post.featuredImage ? (
                      <img src={post.featuredImage} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-[5s]" alt="" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-200">
                        <span className="material-symbols-outlined text-6xl">newspaper</span>
                      </div>
                    )}
                    <div className="absolute top-8 left-8">
                      <span className="bg-white/95 dark:bg-black/60 backdrop-blur-md px-5 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest text-secondary dark:text-primary shadow-lg border border-white/10">{post.category}</span>
                    </div>
                  </div>
                  <div className="p-10 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-2xl font-black text-secondary dark:text-white uppercase tracking-tighter leading-tight mb-4 group-hover:text-primary transition-colors">{post.title}</h3>
                      <div className="flex flex-wrap gap-2 mb-6 opacity-60">
                        {post.tags?.slice(0, 3).map(t => <span key={t} className="text-[8px] font-black text-gray-400 uppercase tracking-widest">#{t}</span>)}
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-6 border-t border-gray-50 dark:border-white/5">
                      <div className="flex items-center gap-3">
                        <img src={`https://ui-avatars.com/api/?name=${post.author || 'Admin'}&background=015754&color=06DC7F`} className="size-8 rounded-full border border-primary/20" alt="" />
                        <span className="text-[9px] font-black text-secondary dark:text-white uppercase tracking-widest">Fudaydiye Ops</span>
                      </div>
                      <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest">4m Read</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default BlogList;
