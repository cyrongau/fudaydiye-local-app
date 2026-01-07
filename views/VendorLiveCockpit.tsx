import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, limit, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../Providers';
import AgoraRTC from 'agora-rtc-sdk-ng';

const VendorLiveCockpit: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [session, setSession] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [viewerCount, setViewerCount] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [cameraOn, setCameraOn] = useState(true);
    const [products, setProducts] = useState<any[]>([]);
    const [showProductPicker, setShowProductPicker] = useState(false);

    // Agora Refs
    const rtcClient = useRef<any>(null);
    const localTracks = useRef<{ audio: any; video: any }>({ audio: null, video: null });
    const videoRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!id || !user) return;

        // Fetch Session Data
        const unsubSession = onSnapshot(doc(db, "live_sessions", id), (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                setSession(data);
                setViewerCount(data.viewerCount || 0);
                if (data.status === 'ENDED') {
                    cleanup();
                    navigate('/vendor');
                }
            }
        });

        // Chat Stream
        const qChat = query(collection(db, "live_sessions", id!, "chat"), orderBy("createdAt", "asc"));
        const unsubChat = onSnapshot(qChat, (snap) => {
            setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        // 3. Fetch Vendor Products (Real Inventory)
        const fetchProducts = async () => {
            const q = query(collection(db, "products"), where("vendorId", "==", user.uid));
            const snap = await getDocs(q);
            setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        };
        fetchProducts();

        return () => {
            unsubSession();
            unsubChat();
            cleanup();
        };
    }, [id, user]);

    // Agora Initialization
    useEffect(() => {
        const initAgora = async () => {
            try {
                const configSnap = await getDoc(doc(db, "system_config", "global"));
                const appId = configSnap.data()?.integrations?.agora?.appId;
                if (!appId) return;

                const client = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
                client.setClientRole("host");

                await client.join(appId, id!, null, user?.uid);

                const [audio, video] = await AgoraRTC.createMicrophoneAndCameraTracks();
                localTracks.current = { audio, video };

                if (videoRef.current) video.play(videoRef.current);
                await client.publish([audio, video]);

                rtcClient.current = client;

                // Update session to LIVE if scheduled
                if (session?.status === 'SCHEDULED') {
                    await updateDoc(doc(db, "live_sessions", id!), { status: 'LIVE' });
                }

            } catch (err) {
                console.error("Agora Cockpit Fail:", err);
                alert("Failed to initialize broadcast node.");
            }
        };

        if (id && user && !rtcClient.current) initAgora();

    }, [id, user]);

    const cleanup = async () => {
        if (localTracks.current.audio) { localTracks.current.audio.close(); }
        if (localTracks.current.video) { localTracks.current.video.close(); }
        if (rtcClient.current) { await rtcClient.current.leave(); }
    };

    const toggleMute = () => {
        if (localTracks.current.audio) {
            localTracks.current.audio.setEnabled(isMuted); // If muted, enable.
            setIsMuted(!isMuted);
        }
    };

    const toggleCamera = () => {
        if (localTracks.current.video) {
            localTracks.current.video.setEnabled(!cameraOn); // If on, disable.
            setCameraOn(!cameraOn);
        }
    };

    const endStream = async () => {
        if (!window.confirm("End this broadcast?")) return;
        if (id) await updateDoc(doc(db, "live_sessions", id), { status: 'ENDED', endedAt: serverTimestamp() });
        navigate('/vendor');
    };

    return (
        <div className="flex flex-col h-screen bg-black text-white font-display">
            {/* Viewfinder Area */}
            <div className="relative flex-1 bg-zinc-900 overflow-hidden">
                <div ref={videoRef} className="absolute inset-0 w-full h-full object-cover">
                    {!cameraOn && <div className="flex items-center justify-center h-full text-gray-500">Camera Paused</div>}
                </div>

                {/* HUD Overlay */}
                <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start bg-gradient-to-b from-black/60 to-transparent">
                    <div className="flex items-center gap-2">
                        <div className="bg-red-600 px-3 py-1 rounded-md text-[10px] font-black uppercase animate-pulse">LIVE</div>
                        <div className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">visibility</span>
                            {viewerCount}
                        </div>
                    </div>
                    <button onClick={endStream} className="bg-white/10 backdrop-blur-md size-8 rounded-full flex items-center justify-center border border-white/10"><span className="material-symbols-outlined text-lg">close</span></button>
                </div>
            </div>

            {/* Controller Area */}
            <div className="h-[45%] bg-surface-dark border-t border-white/10 flex flex-col">
                {/* Chat Stream (Cockpit View) */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest sticky top-0 bg-surface-dark pb-2 z-10">Live Interactions</h4>
                    {messages.length === 0 && <p className="text-gray-500 text-xs italic">Waiting for viewers...</p>}
                    {messages.map(msg => (
                        <div key={msg.id} className="flex gap-2 items-start text-sm">
                            <span className="font-bold text-primary text-xs shrink-0">{msg.userName}:</span>
                            <span className="text-gray-300 text-xs">{msg.text}</span>
                        </div>
                    ))}
                </div>

                {/* Control Grid */}
                <div className="p-4 grid grid-cols-4 gap-4 bg-black/20">
                    <button onClick={toggleMute} className={`flex flex-col items-center gap-1 ${isMuted ? 'text-red-500' : 'text-white'}`}>
                        <div className={`size-12 rounded-2xl flex items-center justify-center border ${isMuted ? 'bg-red-500/20 border-red-500' : 'bg-white/5 border-white/10'}`}>
                            <span className="material-symbols-outlined">{isMuted ? 'mic_off' : 'mic'}</span>
                        </div>
                        <span className="text-[9px] font-bold uppercase">Mic</span>
                    </button>
                    <button onClick={toggleCamera} className={`flex flex-col items-center gap-1 ${!cameraOn ? 'text-red-500' : 'text-white'}`}>
                        <div className={`size-12 rounded-2xl flex items-center justify-center border ${!cameraOn ? 'bg-red-500/20 border-red-500' : 'bg-white/5 border-white/10'}`}>
                            <span className="material-symbols-outlined">{cameraOn ? 'videocam' : 'videocam_off'}</span>
                        </div>
                        <span className="text-[9px] font-bold uppercase">Cam</span>
                    </button>
                    <button className="flex flex-col items-center gap-1">
                        <div className="size-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white active:bg-primary active:text-secondary active:border-primary transition-colors">
                            <span className="material-symbols-outlined">flip_camera_ios</span>
                        </div>
                        <span className="text-[9px] font-bold uppercase">Flip</span>
                    </button>
                    <button
                        onClick={() => setShowProductPicker(true)}
                        className="flex flex-col items-center gap-1"
                    >
                        <div className="size-12 rounded-2xl bg-primary text-secondary flex items-center justify-center shadow-lg active:scale-95 transition-transform">
                            <span className="material-symbols-outlined">push_pin</span>
                        </div>
                        <span className="text-[9px] font-bold uppercase">Pin</span>
                    </button>
                </div>
            </div>

            {/* Product Picker Sheet */}
            {showProductPicker && (
                <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-surface-dark w-full rounded-t-[32px] border-t border-white/10 max-h-[70%] flex flex-col">
                        <div className="p-6 pb-2 flex justify-between items-center">
                            <h3 className="text-sm font-black uppercase tracking-widest text-white">Select Product to Pin</h3>
                            <button onClick={() => setShowProductPicker(false)} className="text-gray-400"><span className="material-symbols-outlined">close</span></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {products.length === 0 && <p className="text-center text-gray-500 text-xs py-10">No products found in inventory.</p>}
                            {products.map(p => (
                                <div key={p.id}
                                    onClick={async () => {
                                        if (window.confirm(`Pin "${p.name}" to stream?`)) {
                                            await updateDoc(doc(db, "live_sessions", id!), {
                                                featuredProductId: p.id,
                                                featuredProductName: p.name,
                                                featuredProductPrice: p.price,
                                                featuredProductImg: p.images?.[0] || "https://placehold.co/100"
                                            });
                                            setShowProductPicker(false);
                                        }
                                    }}
                                    className="flex items-center gap-4 p-3 rounded-2xl bg-white/5 border border-white/5 active:bg-white/10"
                                >
                                    <img src={p.images?.[0] || "https://placehold.co/100"} className="size-12 rounded-lg object-cover bg-gray-800" />
                                    <div className="flex-1">
                                        <h4 className="text-xs font-bold text-white truncate">{p.name}</h4>
                                        <p className="text-[10px] text-primary font-black uppercase tracking-wider">${p.price}</p>
                                    </div>
                                    <button className="px-3 py-1.5 rounded-lg bg-primary text-secondary text-[10px] font-black uppercase">PIN</button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VendorLiveCockpit;
