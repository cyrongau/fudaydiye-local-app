
import React, { useState, createContext, useContext, ReactNode, useEffect } from 'react';
import { onAuthStateChanged, signInAnonymously, User as FirebaseUser } from 'firebase/auth';
import { ToastProvider } from './context/ToastContext';
import { doc, onSnapshot, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { UserRole, CartItem, UserProfile } from './types';

// ... (keep Context interfaces same)

interface AuthContextType {
    user: FirebaseUser | null;
    role: UserRole | null;
    profile: UserProfile | null;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within Providers');
    return context;
};

interface CartContextType {
    cart: CartItem[];
    addToCart: (item: Omit<CartItem, 'id'>) => void;
    removeFromCart: (id: string) => void;
    updateQty: (id: string, delta: number) => void;
    clearCart: () => void;
    cartTotal: number;
    syncCartId: string | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) throw new Error('useCart must be used within Providers');
    return context;
};

interface WalletContextType {
    balance: number;
    topUp: (amount: number) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
    const context = useContext(WalletContext);
    if (!context) throw new Error('useWallet must be used within Providers');
    return context;
};

interface WishlistContextType {
    wishlist: any[]; // Using any[] temporarily to match implementation, but preferably strict type
    addToWishlist: (product: any) => void;
    removeFromWishlist: (productId: string) => void;
    isInWishlist: (productId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const useWishlist = () => {
    const context = useContext(WishlistContext);
    if (!context) throw new Error('useWishlist must be used within Providers');
    return context;
};

export const Providers: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [role, setRole] = useState<UserRole | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const [cart, setCart] = useState<CartItem[]>([]);
    const [syncCartId, setSyncCartId] = useState<string | null>(null);
    const [walletBalance, setWalletBalance] = useState(0);

    useEffect(() => {
        let unsubProfile: (() => void) | undefined;
        let unsubWallet: (() => void) | undefined;

        const unsubAuth = onAuthStateChanged(auth, async (fbUser) => {
            if (unsubProfile) unsubProfile();
            if (unsubWallet) unsubWallet();
            setUser(fbUser);

            if (fbUser) {
                setSyncCartId(fbUser.uid);

                if (!fbUser.isAnonymous) {
                    // 1. Profile Sync
                    unsubProfile = onSnapshot(doc(db, "users", fbUser.uid), async (snap) => {
                        if (snap.exists()) {
                            const data = snap.data() as UserProfile;
                            setProfile(data);
                            if (fbUser.email === 'admin@fudaydiye.so') {
                                setRole('SUPER_ADMIN');
                                // Force token refresh to pick up custom claims
                                try {
                                    await fbUser.getIdToken(true);
                                } catch (e) {
                                    console.warn('Token refresh failed:', e);
                                }
                            } else {
                                setRole(data.role);
                            }
                        } else {
                            if (fbUser.email === 'admin@fudaydiye.so') {
                                setRole('SUPER_ADMIN');
                                // Force token refresh for super admin
                                try {
                                    await fbUser.getIdToken(true);
                                } catch (e) {
                                    console.warn('Token refresh failed:', e);
                                }
                            }
                            else if (fbUser.email === 'info@fudaydiye.com') setRole('FUDAYDIYE_ADMIN');
                            else { setProfile(null); setRole(null); }
                        }
                        setLoading(false);
                    }, (error) => {
                        console.error("Profile sync error:", error);
                        setLoading(false);
                    });

                    // 2. Wallet Sync (New Backend Schema)
                    unsubWallet = onSnapshot(doc(db, "wallets", fbUser.uid), (snap) => {
                        if (snap.exists()) {
                            // @ts-ignore
                            setWalletBalance(snap.data().balance || 0);
                        } else {
                            setWalletBalance(0);
                        }
                    });
                } else {
                    setProfile(null);
                    setRole('GUEST');
                    setLoading(false);
                    setWalletBalance(0);
                }
            } else {
                setLoading(true);
                signInAnonymously(auth).catch((err) => {
                    console.error("Anon Auth Failed", err);
                    let guestId = localStorage.getItem('fudaydiye_guest_cart_id');
                    if (!guestId) {
                        guestId = 'guest_' + Math.random().toString(36).substring(7);
                        localStorage.setItem('fudaydiye_guest_cart_id', guestId);
                    }
                    setSyncCartId(guestId);
                    setLoading(false);
                });
            }
        });

        return () => {
            unsubAuth();
            if (unsubProfile) unsubProfile();
            if (unsubWallet) unsubWallet();
        };
    }, []);

    // Helper to merge if we were to support pre-login fetching, 
    // but with Auto-Anon, the user is ALWAYS logged in (either anon or real).
    // So 'handleCartAuthMerge' is less relevant unless we support 'Login' from Anon state.
    // If user Logs In from Anon, Firebase automatically handles the UID switch or we must manual merge.
    // Ideally, we use linkWithCredential, so UID stays same!
    // If they sign in to a DIFFERENT account, we might want to merge carts.
    // For now, let's keep it simple: The Cart ID IS the User ID.

    useEffect(() => {
        if (!syncCartId) return;
        // Optimization: Riders and Vendors don't use the Cart/Wishlist
        if (role === 'RIDER' || role === 'VENDOR' || role === 'ADMIN') return;

        const unsub = onSnapshot(doc(db, "carts", syncCartId), (snap) => {
            if (snap.exists()) {
                setCart(snap.data().items || []);
            } else {
                setCart([]);
            }
        }, (error) => {
            // Ignore permission errors for non-cart users
            console.warn("Cart sync skipped/failed", error.code);
        });
        return () => unsub();
    }, [syncCartId, role]);

    const updateCloudCart = async (newItems: CartItem[]) => {
        if (!syncCartId) return;
        const total = newItems.reduce((sum, i) => sum + (i.price * i.qty), 0);
        await setDoc(doc(db, "carts", syncCartId), {
            userId: user ? user.uid : null, // If anon, user.uid is still valid
            isAnonymous: user?.isAnonymous || false,
            items: newItems,
            totalValue: total,
            updatedAt: serverTimestamp(),
            status: 'ACTIVE'
        }, { merge: true });
    };

    const addToCart = (item: Omit<CartItem, 'id'>) => {
        const existing = cart.find(i => i.productId === item.productId && i.variationId === item.variationId);
        let newItems: CartItem[];
        if (existing) {
            newItems = cart.map(i => i.id === existing.id ? { ...i, qty: i.qty + item.qty } : i);
        } else {
            // Sanitize item properties to ensure no undefined values are passed to Firestore
            const safeItem = {
                ...item,
                qty: item.qty || 1,
                attribute: item.attribute || 'Standard',
                vendor: item.vendor || 'Fudaydiye',
                vendorId: item.vendorId || null,
                selectedParams: (item as any).selectedParams || {},
                id: Math.random().toString(36).substring(7)
            } as CartItem;
            newItems = [...cart, safeItem];
        }
        updateCloudCart(newItems);
    };

    const removeFromCart = (id: string) => {
        const newItems = cart.filter(i => i.id !== id);
        updateCloudCart(newItems);
    };

    const updateQty = (id: string, delta: number) => {
        const newItems = cart.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i);
        updateCloudCart(newItems);
    };

    const clearCart = () => updateCloudCart([]);
    const cartTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

    // --- Wishlist Logic ---
    interface WishlistItem {
        id: string; // productId
        name: string;
        price: number;
        img: string;
        vendor: string;
        addedAt: any;
    }

    const [wishlist, setWishlist] = useState<WishlistItem[]>([]);

    // Sync Wishlist
    useEffect(() => {
        if (!syncCartId) return;
        if (role === 'RIDER' || role === 'VENDOR' || role === 'ADMIN') return;

        const docRef = doc(db, "wishlists", syncCartId);
        const unsub = onSnapshot(docRef, (snap) => {
            if (snap.exists()) {
                setWishlist(snap.data().items || []);
            } else {
                setWishlist([]);
            }
        }, (error) => console.warn("Wishlist sync skipped", error.code));
        return () => unsub();
    }, [syncCartId, role]);

    const updateCloudWishlist = async (newItems: WishlistItem[]) => {
        if (!syncCartId) return;
        await setDoc(doc(db, "wishlists", syncCartId), {
            userId: user ? user.uid : null,
            isAnonymous: user?.isAnonymous || false,
            items: newItems,
            updatedAt: serverTimestamp()
        }, { merge: true });
    };

    const addToWishlist = (product: any) => {
        if (wishlist.some(i => i.id === product.id)) return;
        const newItem: WishlistItem = {
            id: product.id,
            name: product.name,
            price: product.salePrice || product.basePrice || product.price,
            img: product.images?.[0] || product.img,
            vendor: product.vendor,
            addedAt: new Date() // Client side timestamp for immediate UI, server overwrites if needed or we use arrayUnion
        };
        updateCloudWishlist([...wishlist, newItem]);
    };

    const removeFromWishlist = (productId: string) => {
        const newItems = wishlist.filter(i => i.id !== productId);
        updateCloudWishlist(newItems);
    };

    const isInWishlist = (productId: string) => wishlist.some(i => i.id === productId);

    return (
        <AuthContext.Provider value={{ user, role, profile, loading }}>
            <ToastProvider>
                <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQty, clearCart, cartTotal, syncCartId }}>
                    <WishlistContext.Provider value={{ wishlist, addToWishlist, removeFromWishlist, isInWishlist }}>
                        <WalletContext.Provider value={{ balance: walletBalance, topUp: (a) => console.log('Use walletService.deposit', a) }}>
                            {children}
                        </WalletContext.Provider>
                    </WishlistContext.Provider>
                </CartContext.Provider>
            </ToastProvider>
        </AuthContext.Provider>
    );
};

