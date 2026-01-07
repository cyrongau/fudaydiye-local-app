
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface GlobalScanViewProps {
  role: 'CUSTOMER' | 'VENDOR' | 'RIDER' | 'CLIENT' | 'ADMIN';
}

const GlobalScanView: React.FC<GlobalScanViewProps> = ({ role }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [flash, setFlash] = useState(false);

  const searchParams = new URLSearchParams(location.search);
  const targetOrderId = searchParams.get('orderId');

  useEffect(() => {
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        console.error("Scanner camera error:", err);
      }
    }
    setupCamera();
    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const handleSimulatedScan = async () => {
    setIsProcessing(true);
    
    // Simulate hardware decryption of QR code
    setTimeout(async () => {
      try {
        // If we are scanning for a specific order (e.g. handover)
        if (targetOrderId) {
          await updateDoc(doc(db, "orders", targetOrderId), {
            status: role === 'VENDOR' ? 'SHIPPED' : 'ACCEPTED',
            lastScanAt: serverTimestamp(),
            scannedBy: role
          });
        }

        setIsProcessing(false);
        setIsSuccess(true);
        
        setTimeout(() => {
          if (role === 'CUSTOMER') navigate('/customer/orders');
          else if (role === 'VENDOR') navigate('/vendor/orders');
          else if (role === 'RIDER') navigate('/rider/assignments');
          else navigate(-1);
        }, 1500);

      } catch (err) {
        console.error("Database sync during scan failed:", err);
        setIsProcessing(false);
      }
    }, 2000);
  };

  const getRoleContent = () => {
    switch(role) {
      case 'CUSTOMER': return { title: 'Pay & Receive', sub: 'Scan Merchant or Package QR' };
      case 'VENDOR': return { title: 'Handover Protocol', sub: 'Verify package pickup with Rider' };
      case 'RIDER': return { title: 'Dispatch Check', sub: 'Verify pickup at Vendor Node' };
      default: return { title: 'Unified Scanner', sub: 'Align code within brackets' };
    }
  };

  const content = getRoleContent();

  return (
    <div className="flex flex-col h-screen bg-black text-white font-display overflow-hidden relative">
      <div className="absolute inset-0 z-0">
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="absolute inset-0 border-[40px] md:border-[100px] border-black/70 pointer-events-none"></div>
      </div>

      <header className="relative z-10 p-6 pt-12 flex justify-between items-center">
        <button 
          onClick={() => navigate(-1)} 
          className="size-11 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 active:scale-90 transition-transform"
        >
          <span className="material-symbols-outlined text-white">close</span>
        </button>
        <div className="text-center flex flex-col items-center">
           <h2 className="text-sm font-black uppercase tracking-[0.3em]">{content.title}</h2>
           <div className="flex items-center gap-1.5 mt-1">
              <span className="size-1.5 rounded-full bg-primary animate-pulse"></span>
              <span className="text-[8px] font-black text-primary uppercase tracking-widest">Active Scan Layer</span>
           </div>
        </div>
        <button onClick={() => setFlash(!flash)} className={`size-11 rounded-full backdrop-blur-md flex items-center justify-center border transition-all ${flash ? 'bg-primary/20 border-primary text-primary shadow-primary-glow' : 'bg-white/10 border-white/10 text-white'}`}>
          <span className="material-symbols-outlined">{flash ? 'flashlight_on' : 'flashlight_off'}</span>
        </button>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-8">
        <div className="relative w-full aspect-square max-w-[280px]">
           <div className="absolute inset-0 rounded-[48px] overflow-hidden">
              <div className="absolute top-0 left-0 size-14 border-t-4 border-l-4 border-primary rounded-tl-[32px]"></div>
              <div className="absolute top-0 right-0 size-14 border-t-4 border-r-4 border-primary rounded-tr-[32px]"></div>
              <div className="absolute bottom-0 left-0 size-14 border-b-4 border-l-4 border-primary rounded-bl-[32px]"></div>
              <div className="absolute bottom-0 right-0 size-14 border-b-4 border-r-4 border-primary rounded-br-[32px]"></div>
              
              {!isProcessing && !isSuccess && (
                <div className="scanner-laser animate-laser-scan"></div>
              )}

              {isProcessing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
                   <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                   <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-primary">Cryptographic Verify...</p>
                </div>
              )}

              {isSuccess && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-primary text-secondary animate-in zoom-in duration-300">
                   <span className="material-symbols-outlined text-6xl font-black mb-2">check_circle</span>
                   <p className="text-xs font-black uppercase tracking-widest">Handover Authorized</p>
                </div>
              )}
           </div>

           <button 
            disabled={isProcessing || isSuccess}
            onClick={handleSimulatedScan}
            className="absolute inset-0 z-20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/20 rounded-[48px]"
           >
              <div className="bg-white/90 text-secondary px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl">Confirm Detect</div>
           </button>
        </div>

        <div className="mt-16 text-center max-w-xs">
           <p className="text-sm font-bold text-white/80 leading-relaxed uppercase tracking-widest">{content.sub}</p>
        </div>
      </main>

      <footer className="relative z-10 p-10 flex flex-col items-center gap-4">
         <p className="text-[8px] font-bold text-white/30 uppercase tracking-[0.4em]">Fudaydiye Trust Layer 2.5.0</p>
      </footer>
    </div>
  );
};

export default GlobalScanView;
