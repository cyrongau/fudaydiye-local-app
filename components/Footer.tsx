
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import logo from '../src/assets/logo.png';
import appleLogo from '../src/assets/apple-logo.svg';
import googlePlayLogo from '../src/assets/google-play.svg';
// Payment Icons
import iconZaad from '../src/assets/payment/zaad.svg';
import iconEdahab from '../src/assets/payment/edahab.svg';
import iconCard from '../src/assets/payment/card.svg';
import iconEvc from '../src/assets/payment/evc-plus.svg';
import iconPremier from '../src/assets/payment/premier-wallet.svg';

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
    footerText: "© 2026 Fudaydiye Click & Collect. All rights reserved."
  });

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "system_config", "global"), (doc) => {
      if (doc.exists() && doc.data().business) {
        setBusiness(prev => ({ ...prev, ...doc.data().business }));
      }
    }, (error) => {
      console.warn("Footer Config Verification Failed:", error);
    });
    return () => unsub();
  }, []);

  return (
    <footer className="hidden md:block w-full bg-white dark:bg-surface-dark pt-16 border-t border-gray-100 dark:border-white/5">
      {/* Top Bar Decoration */}
      <div className="h-2 w-full bg-primary mb-12"></div>

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 pb-16">
        {/* 1. Brand Section */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Fudaydiye" className="h-[52px] w-auto object-contain" />
            <div className="flex flex-col">
              <h2 className="text-2xl font-black text-secondary dark:text-white tracking-tighter leading-none">Fudaydiye</h2>
              <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Click & collect</span>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-black text-secondary dark:text-white">Accepted payments</h4>
            <div className="flex flex-wrap gap-3 items-center">
              <img src={iconCard} className="h-8 object-contain" alt="Cards" />
              <div className="h-6 w-px bg-gray-200" />
              <img src={iconZaad} className="h-8 object-contain" alt="ZAAD" />
              <img src={iconEdahab} className="h-8 object-contain" alt="eDahab" />
              <img src={iconEvc} className="h-8 object-contain" alt="EVC Plus" />
              <img src={iconPremier} className="h-6 object-contain" alt="Premier Wallet" />
            </div>
          </div>

          <div className="space-y-4 mt-2">
            <h4 className="text-sm font-black text-secondary dark:text-white">Download Our App</h4>
            <div className="flex gap-2">
              <a href="#" className="flex items-center gap-2 bg-black text-white px-3 py-2 rounded-lg hover:opacity-80 transition-opacity min-w-[140px]">
                <img src={appleLogo} className="h-6 w-auto brightness-0 invert" alt="App Store" />
                <div className="flex flex-col leading-none">
                  <span className="text-[8px] uppercase opacity-80">Download on the</span>
                  <span className="text-[12px] font-bold">App Store</span>
                </div>
              </a>
              <a href="#" className="flex items-center gap-2 bg-black text-white px-3 py-2 rounded-lg hover:opacity-80 transition-opacity min-w-[140px]">
                <img src={googlePlayLogo} className="h-6 w-auto brightness-0 invert" alt="Google Play" />
                <div className="flex flex-col leading-none">
                  <span className="text-[8px] uppercase opacity-80">Download on the</span>
                  <span className="text-[12px] font-bold">Google Play</span>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* 2. Customer Service */}
        <div>
          <h4 className="text-sm font-black text-secondary dark:text-white border-b-2 border-primary w-fit pb-1 mb-6">Customer Service</h4>
          <ul className="space-y-3 text-xs font-medium text-gray-500 dark:text-gray-400">
            <li className="hover:text-primary cursor-pointer transition-colors" onClick={() => navigate('/service-warranty')}>Service and Warranty</li>
            <li className="hover:text-primary cursor-pointer transition-colors" onClick={() => navigate('/returns')}>Returns and Exchanges</li>
            <li className="hover:text-primary cursor-pointer transition-colors" onClick={() => navigate('/secure-payment')}>Secured online payment</li>
            <li className="hover:text-primary cursor-pointer transition-colors" onClick={() => navigate('/shipping')}>Shipping & Delivery</li>
            <li className="hover:text-primary cursor-pointer transition-colors" onClick={() => navigate('/cookies')}>Cookies Settings</li>
          </ul>
        </div>

        {/* 3. About Us & Help */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-black text-secondary dark:text-white border-b-2 border-primary w-fit pb-1 mb-6">About Us</h4>
            <ul className="space-y-3 text-xs font-medium text-gray-500 dark:text-gray-400">
              <li className="hover:text-primary cursor-pointer transition-colors" onClick={() => navigate('/about')}>About fudaydiye</li>
              <li className="hover:text-primary cursor-pointer transition-colors" onClick={() => navigate('/mission')}>Our mission</li>
              <li className="hover:text-primary cursor-pointer transition-colors" onClick={() => navigate('/vision')}>Our vision</li>
              <li className="hover:text-primary cursor-pointer transition-colors" onClick={() => navigate('/story')}>Our story</li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-black text-secondary dark:text-white border-b-2 border-primary w-fit pb-1 mb-6">Help & Support</h4>
            <ul className="space-y-3 text-xs font-medium text-gray-500 dark:text-gray-400">
              <li className="hover:text-primary cursor-pointer transition-colors" onClick={() => navigate('/terms')}>Terms & Conditions</li>
              <li className="hover:text-primary cursor-pointer transition-colors" onClick={() => navigate('/contact')}>Contact Us</li>
              <li className="hover:text-primary cursor-pointer transition-colors" onClick={() => navigate('/faq')}>FAQs</li>
              <li className="hover:text-primary cursor-pointer transition-colors" onClick={() => navigate('/privacy')}>Privacy Policy</li>
            </ul>
          </div>
        </div>

        {/* 4. Socials */}
        <div>
          <h4 className="text-sm font-black text-secondary dark:text-white mb-6">Stay in touch with us</h4>
          <div className="flex gap-3 text-secondary dark:text-white">
            {/* Facebook */}
            <a href={business.socialFacebook} target="_blank" rel="noreferrer" className="size-9 rounded-full border border-gray-200 dark:border-white/10 flex items-center justify-center hover:bg-[#1877F2] hover:border-[#1877F2] hover:text-white transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
            </a>
            {/* Instagram */}
            <a href={business.socialInstagram} target="_blank" rel="noreferrer" className="size-9 rounded-full border border-gray-200 dark:border-white/10 flex items-center justify-center hover:bg-[#E4405F] hover:border-[#E4405F] hover:text-white transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            </a>
            {/* Twitter/X */}
            <a href={business.socialTwitter} target="_blank" rel="noreferrer" className="size-9 rounded-full border border-gray-200 dark:border-white/10 flex items-center justify-center hover:bg-black hover:border-black hover:text-white transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4l11.733 16h4.267l-11.733 -16z" /><path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" /></svg>
            </a>
            {/* Tiktok */}
            <a href="#" className="size-9 rounded-full border border-gray-200 dark:border-white/10 flex items-center justify-center hover:bg-black hover:border-black hover:text-white transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" /></svg>
            </a>
          </div>
          <div className="mt-8">
            <p className="text-2xl font-black text-secondary dark:text-white leading-tight">
              Stay <br /><span className="text-primary">in touch with us</span>
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="w-full bg-secondary text-white py-4 px-6 text-center">
        <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">{business.footerText}</p>
      </div>
    </footer>
  );
};

export default Footer;
