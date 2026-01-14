
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

import { Html5QrcodeScanner } from 'html5-qrcode';

interface GlobalScanViewProps {
  role: 'CUSTOMER' | 'VENDOR' | 'RIDER' | 'CLIENT' | 'ADMIN';
}

const GlobalScanView: React.FC<GlobalScanViewProps> = ({ role }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);

  const searchParams = new URLSearchParams(location.search);
  const targetOrderId = searchParams.get('orderId');

  useEffect(() => {
    // Initialize Scanner
    const scanner = new Html5QrcodeScanner(
      "reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      },
        /* verbose= */ false
    );

    scanner.render(onScanSuccess, (err) => {
      // Handle scan errors silently
    });

    function onScanSuccess(decodedText: string, decodedResult: any) {
      if (isProcessing) return;
      handleScan(decodedText);
      // Stop scanning after success if needed, or keeping it running.
      // Usually better to pause processing.
      scanner.clear();
    }

    return () => {
      scanner.clear().catch(err => console.error("Failed to clear scanner", err));
    };
  }, []);

  const handleScan = async (decodedText: string) => {
    setIsProcessing(true);
    setScanResult(decodedText);

    try {
      console.log("Scanned:", decodedText);

      // Logic to handle the scanned code
      if (targetOrderId) {
        await updateDoc(doc(db, "orders", targetOrderId), {
          status: role === 'VENDOR' ? 'SHIPPED' : 'ACCEPTED',
          lastScanAt: serverTimestamp(),
          scannedBy: role
        });
      }

      // Simulate success navigation for demo/test if code is generic
      // Or handle real codes. For now, assume success on any code.

      setTimeout(() => {
        if (role === 'CUSTOMER') {
          navigate('/customer/pay-confirm', {
            state: {
              invoiceId: 'INV-' + Math.floor(Math.random() * 10000),
              merchantName: 'Scanned Vendor',
              amount: 45.50,
              itemCount: 1,
              rawCode: decodedText
            }
          });
        }
        else if (role === 'VENDOR') navigate('/vendor/orders');
        else if (role === 'RIDER') navigate('/rider/assignments');
        else navigate(-1);
      }, 1000);

    } catch (err) {
      console.error("Scan processing error:", err);
      alert("Scan Error: Processing Failed");
      setIsProcessing(false);
    }
  };

  const getRoleContent = () => {
    switch (role) {
      case 'CUSTOMER': return { title: 'Pay & Receive', sub: 'Scan Merchant or Package QR' };
      case 'VENDOR': return { title: 'Handover Protocol', sub: 'Verify package pickup with Rider' };
      case 'RIDER': return { title: 'Dispatch Check', sub: 'Verify pickup at Vendor Node' };
      default: return { title: 'Unified Scanner', sub: 'Align code within brackets' };
    }
  };

  const content = getRoleContent();

  return (
    <div className="flex flex-col h-screen bg-black text-white font-display overflow-hidden relative">
      <header className="relative z-20 p-6 pt-12 flex justify-between items-center bg-black/50 backdrop-blur-md">
        <button
          onClick={() => navigate(-1)}
          className="size-11 rounded-full bg-white/10 flex items-center justify-center border border-white/10 active:scale-90 transition-transform"
        >
          <span className="material-symbols-outlined text-white">close</span>
        </button>
        <div className="text-center flex flex-col items-center">
          <h2 className="text-sm font-black uppercase tracking-[0.3em]">{content.title}</h2>
        </div>
        <div className="size-11"></div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4 relative">
        <div id="reader" className="w-full max-w-sm overflow-hidden rounded-[32px] border-4 border-primary/50 shadow-2xl bg-black"></div>

        {scanResult && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="p-6 bg-white rounded-[32px] text-center animate-in zoom-in">
              <div className="size-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-3xl">check</span>
              </div>
              <h3 className="text-secondary font-black uppercase text-lg">Code Detected</h3>
              <p className="text-gray-400 text-xs font-bold font-mono mt-2 break-all max-w-[200px]">{scanResult}</p>
              <p className="text-primary text-[10px] font-black uppercase tracking-widest mt-4 animate-pulse">Processing Node...</p>
            </div>
          </div>
        )}

        <div className="mt-8 text-center max-w-xs">
          <p className="text-sm font-bold text-white/50 leading-relaxed uppercase tracking-widest">{content.sub}</p>
        </div>
      </main>
    </div>
  );
};

export default GlobalScanView;
