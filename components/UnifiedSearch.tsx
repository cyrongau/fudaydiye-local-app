import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
// import { collection, query, getDocs, where, limit } from 'firebase/firestore'; // Check if used? No.
import { api } from '../src/services/api';
import { Product } from '../types';

interface UnifiedSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

const UnifiedSearch: React.FC<UnifiedSearchProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [queryText, setQueryText] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load Recent Searches
  useEffect(() => {
    const saved = localStorage.getItem('fudaydiye_recent_searches');
    if (saved) setRecentSearches(JSON.parse(saved));
  }, []);

  const addToRecents = (term: string) => {
    if (!term) return;
    const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('fudaydiye_recent_searches', JSON.stringify(updated));
  };

  // Focus and Fetch Recent/Trending on Open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      // Optional: Fetch trending from backend if implemented
    }
  }, [isOpen]);

  // Debounced Backend Search
  useEffect(() => {
    if (queryText.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.get('/search/products', { params: { q: queryText } });
        setResults(res.data.results || []);
      } catch (err) {
        console.error("Search API Error", err);
      } finally {
        setIsSearching(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [queryText]);

  // ... (rest of component, removing AI search logic for now)

  const handleVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice protocol not supported in this browser node.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.start();
    setIsListening(true);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQueryText(transcript);
      setIsListening(false);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
  };

  const handleResultClick = (product: Product) => {
    addToRecents(product.name);
    navigate(`/customer/product/${product.id}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-start justify-center p-4 md:p-10 pt-[calc(1rem+env(safe-area-inset-top))] md:pt-10 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-secondary/80 backdrop-blur-xl" onClick={onClose}></div>

      <div className="relative w-full max-w-2xl bg-white dark:bg-surface-dark rounded-[40px] shadow-2xl border border-white/10 overflow-hidden animate-in slide-in-from-top-10 duration-500">
        <div className="flex items-center px-4 md:px-8 h-20 gap-2 md:gap-4 border-b border-gray-100 dark:border-white/5">
          <span className={`material-symbols-outlined text-2xl md:text-3xl ${isSearching ? 'text-primary animate-spin' : 'text-gray-400'}`}>
            {isSearching ? 'sync' : 'search'}
          </span>
          <input
            ref={inputRef}
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            autoFocus
            placeholder="Search..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-base md:text-lg font-bold text-secondary dark:text-white placeholder:text-gray-400 min-w-0"
          />
          <button
            onClick={handleVoiceSearch}
            className={`size-10 md:size-11 rounded-2xl flex items-center justify-center transition-all shrink-0 ${isListening ? 'bg-red-500 text-white animate-pulse shadow-lg' : 'bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-primary'}`}
          >
            <span className="material-symbols-outlined font-black text-[20px] md:text-[24px]">mic</span>
          </button>
          <button onClick={onClose} className="size-10 md:w-auto md:h-auto md:px-3 md:py-1.5 rounded-xl md:rounded-lg bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all shrink-0">
            <span className="material-symbols-outlined md:hidden text-[20px]">close</span>
            <span className="hidden md:inline text-[10px] font-black uppercase">Esc</span>
          </button>
        </div>

        <div className="p-4 max-h-[60vh] overflow-y-auto no-scrollbar">
          {queryText.length < 3 ? (
            <div className="p-8 space-y-8">
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em]">Recent Protocol Nodes</p>
                    <button onClick={() => { setRecentSearches([]); localStorage.removeItem('fudaydiye_recent_searches'); }} className="text-[10px] font-bold text-red-500 hover:underline">Clear</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map(term => (
                      <button key={term} onClick={() => setQueryText(term)} className="px-4 py-2 rounded-xl bg-primary/10 text-primary text-[11px] font-black uppercase tracking-widest border border-primary/20 hover:bg-primary hover:text-secondary transition-all flex items-center gap-2">
                        <span className="material-symbols-outlined text-[14px]">history</span>
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em] mb-4">Trending in Mesh</p>
                <div className="flex flex-wrap gap-2">
                  {['Men Fashion', 'Smart Watch', 'Samsung', 'Perfume', 'Sneakers'].map(tag => (
                    <button key={tag} onClick={() => setQueryText(tag)} className="px-4 py-2 rounded-xl bg-gray-50 dark:bg-white/5 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-secondary dark:hover:text-white transition-all">#{tag}</button>
                  ))}
                </div>
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="p-20 text-center opacity-30">
              <span className="material-symbols-outlined text-5xl block mb-4">search_off</span>
              <p className="text-xs font-black uppercase tracking-widest">No matching results in mesh</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {results.map(product => (
                <button
                  key={product.id}
                  onClick={() => handleResultClick(product)}
                  className="flex items-center gap-4 p-4 rounded-3xl hover:bg-primary/10 transition-all text-left group"
                >
                  <div className="size-14 rounded-2xl overflow-hidden border border-gray-100 dark:border-white/10 shrink-0">
                    <img src={product.images?.[0] || 'https://picsum.photos/200/200'} className="w-full h-full object-cover" alt="" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h4 className="text-sm font-black text-secondary dark:text-white uppercase truncate">{product.name}</h4>
                      <span className="text-sm font-black text-primary">${product.basePrice}</span>
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">{product.category} • {product.vendor}</p>
                  </div>
                  <span className="material-symbols-outlined text-gray-300 group-hover:translate-x-1 transition-transform">arrow_forward_ios</span>
                </button>
              ))}
              {/* AI Logic Removed for Backend Search V1 */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnifiedSearch;
