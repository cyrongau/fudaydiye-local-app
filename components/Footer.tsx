
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

const Footer: React.FC = () => {
  const navigate = useNavigate();
  const [business, setBusiness] = useState({
    title: 'Fudaydiye',
    shortDesc: "Hargeisa's ultimate commerce mesh. Connecting local vendors to global markets through high-speed logistics and social selling.",
    address: "Independence Ave, Telesom Plaza, 4th Floor, Hargeisa, Somaliland",
    phone: "+252 63 444 1122",
    email: "ops@fudaydiye.so",
    socialFacebook: "https://facebook.com",
    socialInstagram: "https://instagram.com",
    socialTwitter: "https://twitter.com",
    socialYoutube: "https://youtube.com",
    brandIcon: "",
    footerText: "© 2024 Fudaydiye Express & Marketplace. Built for the Horn."
  });

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "system_config", "global"), (doc) => {
      if (doc.exists() && doc.data().business) {
        setBusiness(prev => ({ ...prev, ...doc.data().business }));
      }
    });
    return () => unsub();
  }, []);

  return (
    <footer className="hidden md:block w-full bg-secondary text-white py-20 mt-20 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-16">
        {/* Brand & Mission */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <div className="size-11 bg-primary rounded-xl flex items-center justify-center text-secondary shadow-lg overflow-hidden">
              {business.brandIcon ? <img src={business.brandIcon} className="w-full h-full object-cover" alt="Logo" /> : <span className="material-symbols-outlined font-black">local_shipping</span>}
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tighter">{business.title}</h2>
          </div>
          <p className="text-xs font-medium text-white/60 leading-loose uppercase tracking-widest">
            {business.shortDesc}
          </p>
          <div className="flex gap-4">
            {business.socialFacebook && (
              <a href={business.socialFacebook} target="_blank" rel="noreferrer" className="size-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#1877F2] hover:text-white transition-all group">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70 group-hover:opacity-100 transition-opacity"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
              </a>
            )}
            {business.socialInstagram && (
              <a href={business.socialInstagram} target="_blank" rel="noreferrer" className="size-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#E4405F] hover:text-white transition-all group">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70 group-hover:opacity-100 transition-opacity"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              </a>
            )}
            {business.socialTwitter && (
              <a href={business.socialTwitter} target="_blank" rel="noreferrer" className="size-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-black hover:text-white transition-all group">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70 group-hover:opacity-100 transition-opacity"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
              </a>
            )}
            {business.socialYoutube && (
              <a href={business.socialYoutube} target="_blank" rel="noreferrer" className="size-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#FF0000] hover:text-white transition-all group">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70 group-hover:opacity-100 transition-opacity"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"></path><path d="m10 15 5-3-5-3z"></path></svg>
              </a>
            )}
          </div>
        </div>

        {/* Nodes */}
        <div>
          <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-8">Ecosystem Hubs</h4>
          <ul className="space-y-4 text-xs font-bold uppercase tracking-widest text-white/50">
            <li className="hover:text-primary transition-colors cursor-pointer" onClick={() => navigate('/customer')}>Local Marketplace</li>
            <li className="hover:text-primary transition-colors cursor-pointer" onClick={() => navigate('/vendor')}>Merchant Cloud</li>
            <li className="hover:text-primary transition-colors cursor-pointer" onClick={() => navigate('/client')}>Enterprise API</li>
            <li className="hover:text-primary transition-colors cursor-pointer" onClick={() => navigate('/blog')}>Community Blog</li>
            <li className="hover:text-primary transition-colors cursor-pointer">Live Stream Lab</li>
          </ul>
        </div>

        {/* Support */}
        <div>
          <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-8">Support Channel</h4>
          <ul className="space-y-4 text-xs font-bold uppercase tracking-widest text-white/50">
            <li className="hover:text-primary transition-colors cursor-pointer" onClick={() => navigate('/about')}>About Us</li>
            <li className="hover:text-primary transition-colors cursor-pointer" onClick={() => navigate('/faq')}>Help Center</li>
            <li className="hover:text-primary transition-colors cursor-pointer" onClick={() => navigate('/contact')}>Contact Us</li>
            <li className="hover:text-primary transition-colors cursor-pointer" onClick={() => navigate('/terms')}>Terms of Service</li>
            <li className="hover:text-primary transition-colors cursor-pointer" onClick={() => navigate('/privacy')}>Privacy Layer</li>
          </ul>
        </div>

        {/* HQ Contact */}
        <div>
          <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-8">Headquarters</h4>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <span className="material-symbols-outlined text-primary">location_on</span>
              <p className="text-xs font-medium text-white/60 leading-relaxed uppercase tracking-widest whitespace-pre-line">
                {business.address}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-primary">call</span>
              <p className="text-xs font-black text-white">{business.phone}</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-primary">mail</span>
              <p className="text-xs font-black text-white">{business.email}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-20 mt-20 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
        <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">{business.footerText}</p>
        <div className="flex items-center gap-6 opacity-30">
          <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS8S5_9rV_P-6E6_hM7Bw9b6zN8X7z9w8X7z9w8X7z9w" className="h-6 object-contain" alt="ZAAD" />
          <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR_xN8E3fX_P-6E6_hM7Bw9b6zN8X7z9w8X7z9w8X7z9w" className="h-6 object-contain" alt="eDahab" />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
