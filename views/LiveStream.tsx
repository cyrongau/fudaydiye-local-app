import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, increment, limit, getDoc, runTransaction } from 'firebase/firestore';
import { db, functions } from '../lib/firebase';
import { useAuth, useCart } from '../Providers';
import { httpsCallable } from 'firebase/functions';
import { GoogleGenAI } from "@google/genai";

// Load Agora SDK dynamically
import AgoraRTC from 'agora-rtc-sdk-ng';

interface Heart {
  id: string;
  x: number;
}

const LiveStream: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { user, profile } = useAuth();

  const mode = new URLSearchParams(location.search).get('mode') === 'seller' ? 'seller' : 'buyer';
  const isObserver = new URLSearchParams(location.search).get('observer') === 'true';

  const [comment, setComment] = useState('');
  const [hearts, setHearts] = useState<Heart[]>([]);
  const [sessionData, setSessionData] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [showAiCompanion, setShowAiCompanion] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [isStreamBlocked, setIsStreamBlocked] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLDivElement>(null);
  const rtcClient = useRef<any>(null);
  const localTracks = useRef<{ audio: any; video: any }>({ audio: null, video: null });

  useEffect(() => {
    if (!id) return;

    const setupRtc = async (data: any) => {
      if (mode === 'seller' && !localTracks.current.video) {
        try {
          const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
          localTracks.current = { audio: audioTrack, video: videoTrack };
          if (videoRef.current) videoTrack.play(videoRef.current);
        } catch (e) { console.error("Hardware node failure:", e); }
      }

      if (data.provider !== 'AGORA') return;
      const configSnap = await getDoc(doc(db, "system_config", "global"));
      const agoraAppId = configSnap.data()?.integrations?.agora?.appId;
      if (!agoraAppId) return;

      rtcClient.current = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
      rtcClient.current.setClientRole((mode === 'seller') ? "host" : "audience");

      rtcClient.current.on("user-published", async (remoteUser: any, mediaType: "audio" | "video") => {
        try {
          await rtcClient.current.subscribe(remoteUser, mediaType);
          if (mediaType === "video" && videoRef.current) {
            // Fix: Clear container before playing to ensure clean node attachment
            videoRef.current.innerHTML = '';
            remoteUser.videoTrack.play(videoRef.current);
            setIsStreamBlocked(false);
          }
          if (mediaType === "audio") remoteUser.audioTrack.play();
        } catch (err: any) {
          if (err.code === 'AUTOPLAY_NOT_ALLOWED') setIsStreamBlocked(true);
        }
      });

      try {
        await rtcClient.current.join(agoraAppId, id, null, user?.uid || `guest_${Date.now()} `);
        if (mode === 'seller' && localTracks.current.video) {
          await rtcClient.current.publish([localTracks.current.audio, localTracks.current.video]);
        }
      } catch (e) { console.error("Agora join failure:", e); }
    };

    const unsubSession = onSnapshot(doc(db, "live_sessions", id), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setSessionData(data);
        if (data.status === 'ENDED') { cleanupAndExit(true); return; }
        if (!rtcClient.current && data.status === 'LIVE') setupRtc(data);
      }
    });

    const qHearts = query(collection(db, "live_sessions", id, "reactions"), orderBy("createdAt", "desc"), limit(10));
    const unsubHearts = onSnapshot(qHearts, (snap) => {
      const newHearts = snap.docs.map(d => ({ id: d.id, x: d.data().x }));
      setHearts(prev => {
        const fresh = newHearts.filter(nh => !prev.find(p => p.id === nh.id));
        return [...prev, ...fresh].slice(-15);
      });
    });

    const qChat = query(collection(db, "live_sessions", id, "chat"), orderBy("createdAt", "asc"));
    const unsubChat = onSnapshot(qChat, (snap) => {
      setMessages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });

    if (mode === 'buyer' && !isObserver) {
      updateDoc(doc(db, "live_sessions", id), { viewerCount: increment(1) });
    }

    return () => { unsubSession(); unsubHearts(); unsubChat(); cleanupAndExit(); };
  }, [id, mode, isObserver, user]);

  const cleanupAndExit = async (wasTerminated = false) => {
    if (rtcClient.current) { await rtcClient.current.leave(); rtcClient.current = null; }
    if (localTracks.current.audio) { localTracks.current.audio.stop(); localTracks.current.audio.close(); localTracks.current.audio = null; }
    if (localTracks.current.video) { localTracks.current.video.stop(); localTracks.current.video.close(); localTracks.current.video = null; }
    if (mode === 'buyer' && !isObserver && id) updateDoc(doc(db, "live_sessions", id), { viewerCount: increment(-1) });
    if (wasTerminated) alert(mode === 'seller' ? "Identity Node: Broadcast Terminated." : "The live session has ended.");
    if (isObserver) navigate('/admin/live-moderation');
    else if (mode === 'seller') navigate('/vendor');
    else if (wasTerminated) navigate('/customer');
  };

  const handleEndSession = async () => {
    if (!id || mode !== 'seller' || !window.confirm("Terminate this broadcast node? This action is permanent.")) return;
    setIsEnding(true);
    try {
      await updateDoc(doc(db, "live_sessions", id), { status: 'ENDED', endedAt: serverTimestamp() });
    } catch (e) { setIsEnding(false); }
  };

  const handleSendMessage = async () => {
    if (!comment.trim() || !user || !id) return;
    if (comment.toLowerCase().includes('@ai')) askGemini(comment);
    await addDoc(collection(db, "live_sessions", id, "chat"), {
      userId: user.uid,
      userName: profile?.fullName || "Verified Viewer",
      text: comment,
      sender: user.uid === sessionData?.vendorId ? 'seller' : 'buyer',
      createdAt: serverTimestamp()
    });
    setComment('');
  };

  const askGemini = async (queryText: string) => {
    setIsAiThinking(true);
    setShowAiCompanion(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Live Sale Context: ${sessionData?.title}.Product: ${sessionData?.featuredProductName}.Question: ${queryText}. Answer briefly as an expert assistant.`,
      });
      setAiResponse(response.text || "AI logic offline.");
    } catch (err) { setAiResponse("AI logic sync error."); } finally { setIsAiThinking(false); }
  };

  const broadcastHeart = async () => {
    if (!id) return;
    await addDoc(collection(db, "live_sessions", id, "reactions"), { x: Math.random() * 80 - 40, type: 'heart', createdAt: serverTimestamp() });
  };

  return (
    <div className="relative h-screen w-full bg-black overflow-hidden flex flex-col font-display">
      <div className="absolute inset-0 z-0 bg-zinc-950">
        <div ref={videoRef} className="h-full w-full object-cover" />
        <div className="absolute inset-x-0 bottom-0 h-[40%] bg-gradient-to-t from-black/80 to-transparent pointer-events-none"></div>
      </div>

      {isStreamBlocked && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="text-center p-10 max-w-sm">
            <div className="size-20 rounded-full bg-primary/20 flex items-center justify-center text-primary mx-auto mb-6 border border-primary/30">
              <span className="material-symbols-outlined text-4xl font-black">play_arrow</span>
            </div>
            <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-4">Stream Standby</h3>
            <button
              onClick={() => { setIsStreamBlocked(false); window.location.reload(); }}
              className="h-14 px-10 bg-primary text-secondary rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95"
            >Sync Feed Now</button>
          </div>
        </div>
      )}

      {/* Floating Hearts */}
      <div className="absolute right-4 bottom-32 pointer-events-none z-30 w-20 h-60 overflow-hidden">
        {hearts.map(heart => (
          <div key={heart.id} className="absolute bottom-0 animate-float-heart" style={{ left: `${heart.x + 20} px` }}>
            <span className="material-symbols-outlined text-primary text-[32px] fill-1 shadow-primary-glow">favorite</span>
          </div>
        ))}
      </div>

      {/* Header: Profile & Status */}
      <div className="absolute top-0 left-0 right-0 z-40 pt-10 px-4 flex justify-between items-start">
        {/* Host Profile Pill */}
        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md p-1 pr-4 rounded-full border border-white/10">
          <img className="size-9 rounded-full object-cover border border-primary" src={sessionData?.hostAvatar || "https://picsum.photos/id/1005/50/50"} alt="Host" />
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-white uppercase tracking-wide truncate max-w-[100px]">{sessionData?.vendorName || "Loading..."}</span>
            <span className="text-[8px] text-gray-300 font-medium">Hargeisa, Somaliland</span>
          </div>
          <button className="bg-primary text-secondary text-[9px] font-black px-3 py-1.5 rounded-full uppercase ml-2 active:scale-90 transition-transform">
            Follow
          </button>
        </div>

        {/* Live Status Badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
            <span className="material-symbols-outlined text-white text-[14px]">visibility</span>
            <span className="text-[10px] font-black text-white">{sessionData?.viewerCount || 0}</span>
          </div>
          <div className="bg-red-600 text-white text-[10px] font-black px-3 py-1.5 rounded-md uppercase animate-pulse shadow-lg">
            LIVE
          </div>
          <button onClick={() => cleanupAndExit()} className="size-8 rounded-full bg-black/40 text-white backdrop-blur-md flex items-center justify-center border border-white/10 ml-1">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
      </div>

      {/* Right Side Actions */}
      <div className="absolute bottom-24 right-4 z-40 flex flex-col gap-4 items-center">
        <button onClick={broadcastHeart} className="flex flex-col items-center gap-1 group">
          <div className="size-10 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform group-active:bg-primary/20">
            <span className="material-symbols-outlined text-white text-3xl group-active:text-primary fill-1">favorite</span>
          </div>
          <span className="text-[10px] font-black text-white shadow-black drop-shadow-md">4.2k</span>
        </button>
        <button className="flex flex-col items-center gap-1">
          <div className="size-10 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform">
            <span className="material-symbols-outlined text-white text-3xl fill-1">chat_bubble</span>
          </div>
          <span className="text-[10px] font-black text-white shadow-black drop-shadow-md">128</span>
        </button>
        <button className="flex flex-col items-center gap-1">
          <div className="size-10 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform">
            <span className="material-symbols-outlined text-white text-3xl fill-1">share</span>
          </div>
          <span className="text-[10px] font-black text-white shadow-black drop-shadow-md">Share</span>
        </button>
        <button className="flex flex-col items-center gap-1 mt-2">
          <span className="material-symbols-outlined text-white text-2xl drop-shadow-md">more_vert</span>
        </button>
      </div>

      {/* Main Content Area: Chat & Products */}
      <div className="absolute bottom-0 left-0 right-0 z-30 pb-4 px-4 flex flex-col gap-4">

        {/* Chat Stream (Bottom Left) */}
        <div className="flex flex-col items-start gap-2 max-w-[75%] max-h-[200px] overflow-hidden mask-image-gradient-t">
          {messages.slice(-5).map((msg) => (
            <div key={msg.id} className="animate-in slide-in-from-bottom-2 duration-300">
              <div className="bg-black/30 backdrop-blur-sm rounded-2xl rounded-tl-none px-3 py-2 border border-white/5">
                <span className="text-[10px] font-black text-gray-300 mr-2 opacity-80">{msg.userName}</span>
                <span className="text-[11px] text-white font-medium">{msg.text}</span>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Bottom Bar: Product Card & Comment Input */}
        <div className="flex items-end gap-3 w-full pr-14">
          {/* Featured Product Card (Popup style) */}
          {sessionData?.featuredProductId && (
            <div className="bg-white rounded-2xl p-2 flex items-center gap-3 shadow-2xl animate-in slide-in-from-bottom-6 duration-500 max-w-[240px]">
              <img src={sessionData.featuredProductImg} className="size-12 rounded-lg object-cover bg-gray-100" />
              <div className="flex-1 min-w-0">
                <h4 className="text-[10px] font-black text-black uppercase truncate leading-tight">{sessionData.featuredProductName}</h4>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="material-symbols-outlined text-[10px] text-gray-400">sd_storage</span>
                  <span className="text-[9px] text-gray-500 font-bold">128GB Storage</span>
                </div>
                <span className="text-xs font-black text-primary mt-0.5 block">SL Sh {sessionData.featuredProductPrice}</span>
              </div>
              <button
                onClick={() => {
                  if (mode === 'buyer') setShowCheckout(true);
                  else navigate(`/ customer / product / ${sessionData.featuredProductId} `);
                }}
                className="bg-primary text-secondary text-[10px] font-black px-4 py-2 rounded-lg uppercase shadow-primary-glow active:scale-95"
              >
                BUY
              </button>
            </div>
          )}

          {/* Comment Input (If no product, or next to it if space allows, but usually obscures product. 
                   Let's make comment input a floating button that opens a modal or inline input if product is hidden.
                   For now, sticking to the screenshot, the product card is dominant. 
                   We need an input field. Let's place it below the chat if product not active, or make it a pill.
               */}
          <div className="flex-1">
            {!sessionData?.featuredProductId && (
              <div className="relative w-full">
                <input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="w-full h-10 pl-4 pr-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-xs text-white placeholder:text-gray-300 focus:ring-1 focus:ring-primary focus:bg-black/60 transition-all font-medium"
                  placeholder="Ask a question..."
                />
                <button onClick={handleSendMessage} className="absolute right-1 top-1/2 -translate-y-1/2 icon-btn size-8 bg-primary text-secondary rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg">send</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* If product is active, we might want a smaller input trigger to avoid clutter */}
        {sessionData?.featuredProductId && (
          <div className="w-full relative pr-14 mt-1">
            <div className="relative w-full">
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="w-full h-10 pl-4 pr-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-xs text-white placeholder:text-gray-300 focus:ring-1 focus:ring-primary focus:bg-black/60 transition-all font-medium"
                placeholder="Ask a question..."
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-300 text-lg">sentiment_satisfied</span>
            </div>
          </div>
        )}

      </div>

      {showCheckout && (
        <InStreamCheckout
          sessionData={sessionData}
          onClose={() => setShowCheckout(false)}
          userId={user?.uid}
          profile={profile}
        />
      )}
    </div>
  );
};

const InStreamCheckout: React.FC<any> = ({ sessionData, onClose, userId, profile }) => {
  const [step, setStep] = useState<'DETAILS' | 'PAYING' | 'SUCCESS'>('DETAILS');
  const [selectedMethod, setSelectedMethod] = useState('ZAAD');
  const [phone, setPhone] = useState(profile?.mobile?.split(' ').pop() || '');
  const [address, setAddress] = useState(profile?.location || '');
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePlaceOrder = async () => {
    if (!phone || !address) { alert("Input Protocol Failure: Missing delivery node data."); return; }
    setIsProcessing(true);
    setStep('PAYING');

    setTimeout(async () => {
      try {
        const createOrder = httpsCallable(functions, 'createOrder');

        const payload = {
          recipientId: userId || null, // null for guest
          recipientName: profile?.fullName || "Verified Live Buyer",
          recipientPhone: `+ 252 ${phone} `,
          recipientAddress: address,
          paymentMethod: selectedMethod,
          paymentDetails: { phone: phone },
          deliveryFee: 5.00,
          isAtomic: false,
          cartItems: [{
            productId: sessionData.featuredProductId,
            variationId: null,
            qty: 1,
            vendorId: sessionData.vendorId
          }],
          savePayment: false,
          syncCartId: null
        };

        const result = await createOrder(payload);
        const data = result.data as any;

        if (data.success) {
          setStep('SUCCESS');
          setTimeout(onClose, 3000);
        } else {
          throw new Error(data.message || "Order node rejected.");
        }
      } catch (err: any) {
        console.error("Order error:", err);
        alert(err.message || "Mesh Settlement Failure.");
        setStep('DETAILS');
        setIsProcessing(false);
      }
    }, 4000);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-end justify-center p-4 md:p-10 animate-in slide-in-from-bottom duration-500">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-lg bg-white dark:bg-surface-dark rounded-[48px] overflow-hidden shadow-[0_48px_80px_-24px_rgba(1,87,84,0.3)] border border-gray-100 dark:border-white/10">
        {step === 'DETAILS' && (
          <div className="p-8 space-y-8">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-2xl bg-primary flex items-center justify-center text-secondary shadow-lg">
                  <span className="material-symbols-outlined font-black">shopping_bag</span>
                </div>
                <div>
                  <h3 className="text-lg font-black text-secondary dark:text-white uppercase tracking-tighter leading-none">Instant Checkout</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Live Drop Protocol</p>
                </div>
              </div>
              <button onClick={onClose} className="size-10 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400"><span className="material-symbols-outlined">close</span></button>
            </div>

            <div className="bg-gray-50 dark:bg-white/5 p-5 rounded-[32px] flex items-center gap-5">
              <img src={sessionData.featuredProductImg} className="size-20 rounded-2xl object-cover shadow-sm" alt="" />
              <div className="flex-1">
                <h4 className="text-sm font-black text-secondary dark:text-white uppercase truncate">{sessionData.featuredProductName}</h4>
                <p className="text-xl font-black text-primary tracking-tighter mt-1">${sessionData.featuredProductPrice}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Delivery Neighborhood</label>
                <input value={address} onChange={e => setAddress(e.target.value)} className="w-full h-14 bg-gray-50 dark:bg-white/5 border-2 border-gray-100 dark:border-white/10 rounded-2xl px-6 text-sm font-bold focus:border-primary transition-all" placeholder="e.g. Jigjiga Yar, Block 2" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">ZAAD / eDahab Mobile</label>
                <div className="flex h-14 bg-gray-50 dark:bg-white/5 border-2 border-gray-100 dark:border-white/10 rounded-2xl px-6 items-center gap-3">
                  <span className="text-sm font-black opacity-40">+252</span>
                  <input value={phone} onChange={e => setPhone(e.target.value)} className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-black" placeholder="63 444 1122" />
                </div>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              className="w-full h-18 bg-primary text-secondary font-black text-sm uppercase tracking-[0.4em] rounded-[24px] shadow-primary-glow active:scale-[0.98] transition-all flex items-center justify-center gap-4"
            >
              Authorize Payment
              <span className="material-symbols-outlined font-black">bolt</span>
            </button>
          </div>
        )}

        {step === 'PAYING' && (
          <div className="p-16 flex flex-col items-center text-center animate-in fade-in duration-700">
            <div className="relative mb-10">
              <div className="size-32 bg-primary/10 rounded-full animate-ping-slow"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="size-24 bg-primary rounded-[36px] shadow-primary-glow flex items-center justify-center">
                  <span className="material-symbols-outlined text-secondary text-5xl font-black animate-bounce">smartphone</span>
                </div>
              </div>
            </div>
            <h2 className="text-3xl font-black text-secondary dark:text-white uppercase tracking-tighter mb-2">USSD Node Active</h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.4em] mb-10 leading-relaxed">Please verify the PIN prompt on your device to finalize settlement.</p>
            <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
              <span className="size-1.5 rounded-full bg-primary animate-pulse"></span>
              <span className="text-[9px] font-black uppercase text-primary tracking-widest">Gateway Verified</span>
            </div>
          </div>
        )}

        {step === 'SUCCESS' && (
          <div className="p-16 flex flex-col items-center text-center animate-in zoom-in duration-500">
            <div className="size-28 bg-primary rounded-[40px] flex items-center justify-center shadow-primary-glow mb-10 animate-bounce">
              <span className="material-symbols-outlined text-secondary text-6xl font-black">verified</span>
            </div>
            <h2 className="text-4xl font-black text-secondary dark:text-white uppercase tracking-tighter mb-2">Sync Complete!</h2>
            <p className="text-primary text-[10px] font-black uppercase tracking-[0.4em] leading-relaxed">Your order node has been authorized. <br /> Closing checkout mesh...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveStream;
