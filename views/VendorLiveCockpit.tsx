import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../Providers';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { liveStreamService, LiveSession, ChatMessage, Product } from '../src/lib/services/liveStreamService';
import { toast } from 'sonner';
import ConfirmationModal from '../components/ConfirmationModal';

const VendorLiveCockpit: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [session, setSession] = useState<LiveSession | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [viewerCount, setViewerCount] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [cameraOn, setCameraOn] = useState(true);
    const [products, setProducts] = useState<Product[]>([]);
    const [showProductPicker, setShowProductPicker] = useState(false);
    const [chatInput, setChatInput] = useState("");

    // Agora Refs
    const rtcClient = useRef<any>(null);
    const localTracks = useRef<{ audio: any; video: any }>({ audio: null, video: null });
    const videoRef = useRef<HTMLDivElement>(null);
    const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
    const [currentCameraIdx, setCurrentCameraIdx] = useState(0);

    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        isDestructive?: boolean;
        confirmLabel?: string;
    }>({ isOpen: false, title: "", message: "", onConfirm: () => { } });

    // Initial Camera Fetch
    useEffect(() => {
        AgoraRTC.getCameras().then(devs => {
            const videoDevs = devs.filter(d => d.kind === 'videoinput');
            setCameras(videoDevs);
        }).catch(e => console.error("Failed to list cameras", e));
    }, []);

    const switchCamera = async () => {
        if (!cameras.length || !localTracks.current.video) return;
        const nextIdx = (currentCameraIdx + 1) % cameras.length;
        const nextDeviceId = cameras[nextIdx].deviceId;
        try {
            await localTracks.current.video.setDevice(nextDeviceId);
            setCurrentCameraIdx(nextIdx);
            toast.success(`Switched to ${cameras[nextIdx].label || `Camera ${nextIdx + 1}`}`);
        } catch (e) {
            console.error("Switch Camera Failed", e);
            toast.error("Failed to switch camera");
        }
    };

    useEffect(() => {
        if (!id || !user) return;

        // 1. Subscribe to Session
        const unsubSession = liveStreamService.subscribeToSession(id, (data) => {
            if (data) {
                setSession(data);
                setViewerCount(data.viewerCount || 0);
                if (data.status === 'ENDED') {
                    cleanup();
                    navigate('/vendor');
                }
            }
        });

        // 2. Subscribe to Chat
        const unsubChat = liveStreamService.subscribeToChat(id, (msgs) => setMessages(msgs));

        // 3. Fetch Vendor Products
        const loadProducts = async () => {
            try {
                const fetchedProducts = await liveStreamService.fetchVendorProducts(user.uid);
                setProducts(fetchedProducts);
            } catch (err) {
                console.error("Failed to load inventory:", err);
            }
        };
        loadProducts();

        return () => {
            unsubSession();
            unsubChat();
            cleanup();
        };
    }, [id, user]);

    // Agora Initialization
    useEffect(() => {
        let isMounted = true;

        const initAgora = async () => {
            if (!id || !user || rtcClient.current) return;

            try {
                // 1. Get Permissions & Start Local Video IMMEDIATELY (Preview)
                console.log("Requesting Camera/Mic...");
                // Fix Zoom: Use fixed resolution/aspect ratio to prevent extreme cropping (720p landscape default)
                // Use 'detail' optimization to favor quality over smoothness if bandwidth drops
                // Fix Zoom: Use explicit Portrait dimensions to match mobile UI.
                // 480x640 is a safe mobile portrait baseline. 
                const [audio, video] = await AgoraRTC.createMicrophoneAndCameraTracks(
                    { encoderConfig: "high_quality_stereo" },
                    {
                        encoderConfig: { width: 480, height: 640, frameRate: 15, bitrateMin: 400, bitrateMax: 1000 },
                        optimizationMode: "detail",
                        facingMode: "user" // Default to front camera
                    }
                );

                if (!isMounted) {
                    audio.close();
                    video.close();
                    return;
                }

                localTracks.current = { audio, video };

                if (videoRef.current) {
                    console.log("Playing Local Video Track...");
                    video.play(videoRef.current);
                } else {
                    console.error("Video Ref is missing during initialization");
                }

                // 2. Fetch Config & Join Channel
                let appId = await liveStreamService.getAgoraAppId();
                if (!appId) {
                    console.warn("Using Fallback App ID");
                    appId = "435105dca9634d289069695d378034d6";
                }

                if (!appId) {
                    toast.error("Config Error: Missing Agora App ID");
                    return;
                }

                console.log("Initializing Agora Client...");
                const client = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
                client.setClientRole("host");

                console.log(`Joining Channel: ${id} with AppID: ${appId}`);
                await client.join(appId, id, null, user.uid);

                if (!isMounted) {
                    await client.leave();
                    return;
                }

                // 3. Publish Tracks
                console.log("Publishing Tracks...");
                await client.publish([audio, video]);
                rtcClient.current = client;

                toast.success("You are Live!");

                // Update session status
                if (session?.status === 'SCHEDULED' || session?.status === undefined) {
                    await liveStreamService.updateSessionStatus(id, 'LIVE');
                }

            } catch (err: any) {
                console.error("Agora Error:", err);
                toast.error(`Stream Error: ${err.message || "Unknown"}`);
            }
        };

        // Small delay to ensure Ref is attached
        const timer = setTimeout(() => initAgora(), 100);

        return () => {
            isMounted = false;
            clearTimeout(timer);
            cleanup();
        };
    }, [id, user]);

    const cleanup = async () => {
        if (localTracks.current.audio) {
            localTracks.current.audio.stop();
            localTracks.current.audio.close();
            localTracks.current.audio = null;
        }
        if (localTracks.current.video) {
            localTracks.current.video.stop();
            localTracks.current.video.close();
            localTracks.current.video = null;
        }
        if (rtcClient.current) {
            await rtcClient.current.leave();
            rtcClient.current = null;
        }
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
        setConfirmModal({
            isOpen: true,
            title: "End Broadcast",
            message: "Are you sure you want to end this live stream? This action cannot be undone.",
            isDestructive: true,
            confirmLabel: "End Stream",
            onConfirm: async () => {
                if (id) {
                    await liveStreamService.updateSessionStatus(id, 'ENDED');
                    navigate('/vendor');
                }
            }
        });
    };

    const handleSendChat = async () => {
        console.log("Attempting to send chat...", { chatInput, id, userId: user?.uid });
        if (!chatInput.trim() || !id || !user) {
            console.warn("Send aborted: Missing input or user data");
            return;
        }
        try {
            await liveStreamService.sendChatMessage(id, {
                text: chatInput.trim(),
                userId: user.uid,
                userName: session?.vendorName || "Host"
            });
            console.log("Message sent successfully");
            setChatInput("");
        } catch (e) {
            console.error("Failed to send message:", e);
            toast.error("Msg failed");
        }
    };

    return (
        <div className="flex flex-col h-screen bg-black text-white font-display overflow-hidden relative">

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                isDestructive={confirmModal.isDestructive}
                confirmLabel={confirmModal.confirmLabel}
            />

            {/* Main Video Viewfinder - Full Screen */}
            <div className="absolute inset-0 z-0">
                <div ref={videoRef} className="w-full h-full object-cover">
                    {!cameraOn && <div className="flex items-center justify-center h-full bg-zinc-900 text-gray-500 font-bold uppercase tracking-widest">Camera Paused</div>}
                </div>
                {/* Gradient Overlay for Visibility */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none"></div>
            </div>

            {/* Top Bar: Host Profile & Status */}
            <div className="absolute top-0 left-0 right-0 p-6 z-20 flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <img src={session?.hostAvatar || "https://placehold.co/100"} className="size-10 rounded-full border-2 border-white shadow-md" alt="" />
                        <div className="absolute -bottom-1 -right-1 bg-primary text-secondary text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase">HOST</div>
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-white uppercase shadow-black drop-shadow-md leading-none">{session?.vendorName}</h3>
                        <p className="text-[10px] font-bold text-white/80 uppercase shadow-black drop-shadow-md mt-0.5">{session?.title}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[14px]">visibility</span>
                        <span className="text-[10px] font-bold">{viewerCount}</span>
                    </div>
                    <div className="bg-red-600 px-3 py-1.5 rounded-full flex items-center gap-2 animate-pulse shadow-red-900/50 shadow-lg">
                        <span className="size-2 bg-white rounded-full"></span>
                        <span className="text-[10px] font-black uppercase">LIVE</span>
                    </div>
                    <button onClick={endStream} className="size-8 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/30 transition-all">
                        <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                </div>
            </div>

            {/* Middle: Chat Overlay (Left Side on Desktop, Bottom on Mobile logic mostly handled by absolute positioning) */}
            <div className="absolute bottom-24 left-6 z-20 w-80 max-h-[400px] flex flex-col justify-end pointer-events-none">
                <div className="space-y-3 pointer-events-auto mask-image-gradient-to-t">
                    {messages.slice(-5).map(msg => (
                        <div key={msg.id} className="flex items-start gap-2 bg-black/40 backdrop-blur-md p-3 rounded-2xl border border-white/5 shadow-lg animate-in slide-in-from-bottom-2 fade-in duration-300">
                            <div className={`size-6 rounded-full flex items-center justify-center text-[10px] font-black uppercase shrink-0 ${['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500'][msg.userName.length % 4]}`}>
                                {msg.userName.charAt(0)}
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-white/60 uppercase mb-0.5">{msg.userName}</p>
                                <p className="text-sm font-medium text-white shadow-black drop-shadow-sm leading-tight">{msg.text}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom: Featured Product Card (Floating) */}
            {session?.featuredProductId && (
                <div className="absolute bottom-24 right-6 z-20 w-72 bg-white dark:bg-surface-dark p-4 rounded-3xl shadow-2xl border border-white/10 animate-in slide-in-from-bottom-10 duration-500">
                    <div className="flex gap-4 items-center">
                        <img src={session.featuredProductImg || "https://placehold.co/100"} className="size-16 rounded-xl object-cover bg-gray-100" />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase">FEATURED</span>
                            </div>
                            <h4 className="text-secondary dark:text-white font-black text-sm truncate uppercase">{session.featuredProductName}</h4>
                            <p className="text-primary font-bold text-lg">${session.featuredProductPrice}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Bottom Control Bar */}
            <div className="absolute bottom-6 left-6 right-6 z-30 flex items-center gap-4">
                <div className="flex-1 bg-black/40 backdrop-blur-md h-14 rounded-full border border-white/10 flex items-center px-2 shadow-lg">
                    <input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                        placeholder="Chat as Host..."
                        className="flex-1 min-w-0 bg-transparent border-none text-white text-xs font-bold px-4 placeholder:text-white/30 focus:ring-0 outline-none"
                    />
                    <button onClick={handleSendChat} type="button" className="size-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary hover:text-secondary transition-all shrink-0">
                        <span className="material-symbols-outlined text-white/50 hover:text-secondary text-[18px]">send</span>
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={toggleMute} className={`size-14 rounded-full flex items-center justify-center transition-all shadow-lg ${isMuted ? 'bg-red-500 text-white' : 'bg-white/10 backdrop-blur-md text-white hover:bg-white/20'}`}>
                        <span className="material-symbols-outlined">{isMuted ? 'mic_off' : 'mic'}</span>
                    </button>
                    <button onClick={toggleCamera} className={`size-14 rounded-full flex items-center justify-center transition-all shadow-lg ${!cameraOn ? 'bg-red-500 text-white' : 'bg-white/10 backdrop-blur-md text-white hover:bg-white/20'}`}>
                        <span className="material-symbols-outlined">{!cameraOn ? 'videocam_off' : 'videocam'}</span>
                    </button>
                    <button onClick={switchCamera} className={`size-14 rounded-full flex items-center justify-center transition-all shadow-lg bg-white/10 backdrop-blur-md text-white hover:bg-white/20`}>
                        <span className="material-symbols-outlined">flip_camera_ios</span>
                    </button>
                    <button onClick={() => setShowProductPicker(true)} className="size-14 rounded-full bg-primary text-secondary flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                        <span className="material-symbols-outlined">push_pin</span>
                    </button>
                </div>
            </div>

            {/* Product Picker Sheet */}
            {showProductPicker && (
                <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-surface-dark w-full max-w-md mx-auto rounded-t-[40px] shadow-2xl border-t border-white/10 max-h-[80%] flex flex-col animate-in slide-in-from-bottom-20 duration-500">
                        <div className="p-8 pb-4 flex justify-between items-center bg-gray-50/50 dark:bg-white/5 rounded-t-[40px]">
                            <div>
                                <h3 className="text-base font-black uppercase tracking-widest text-secondary dark:text-white">Pin Product</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Select item to feature</p>
                            </div>
                            <button onClick={() => setShowProductPicker(false)} className="size-8 bg-gray-200 dark:bg-white/10 rounded-full flex items-center justify-center active:scale-90 transition-all"><span className="material-symbols-outlined text-[16px]">close</span></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {products.map(p => (
                                <div key={p.id}
                                    onClick={() => {
                                        setConfirmModal({
                                            isOpen: true,
                                            title: "Pin Product",
                                            message: `Feature "${p.name}" for all viewers?`,
                                            confirmLabel: "Pin Now",
                                            onConfirm: async () => {
                                                await liveStreamService.pinProductToStream(id!, p);
                                                setSession(prev => prev ? ({ ...prev, featuredProductId: p.id, featuredProductName: p.name, featuredProductImg: p.images?.[0], featuredProductPrice: p.price }) : null);
                                                setShowProductPicker(false);
                                                toast.success("Product Pinned!");
                                            }
                                        });
                                    }}
                                    className="flex items-center gap-4 p-4 rounded-3xl bg-gray-50 dark:bg-white/5 border border-transparent hover:border-primary/50 active:scale-[0.98] transition-all cursor-pointer"
                                >
                                    <img src={p.images?.[0] || "https://placehold.co/100"} className="size-16 rounded-xl object-cover bg-gray-200" />
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-xs font-black text-secondary dark:text-white truncate uppercase">{p.name}</h4>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">{p.vendorId === user?.uid ? 'In Stock' : 'Out of Stock'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-primary">${p.price}</p>
                                        <span className="text-[8px] font-bold text-gray-400 uppercase">Select</span>
                                    </div>
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
