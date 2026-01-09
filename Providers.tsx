
import React, { useState, createContext, useContext, ReactNode, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { ToastProvider } from './context/ToastContext';
import { doc, onSnapshot, setDoc, getDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { UserRole, CartItem, UserProfile } from './types';

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

    useEffect(() => {
        let unsubProfile: (() => void) | undefined;

        const unsubAuth = onAuthStateChanged(auth, async (fbUser) => {
            if (unsubProfile) unsubProfile();
            setUser(fbUser);

            if (fbUser) {
                unsubProfile = onSnapshot(doc(db, "users", fbUser.uid), (snap) => {
                    if (snap.exists()) {
                        const data = snap.data() as UserProfile;
                        setProfile(data);
                        setRole(data.role);
                    } else {
                        if (fbUser.email === 'admin@fudaydiye.so') setRole('ADMIN');
                        else { setProfile(null); setRole(null); }
                    }
                    setLoading(false);
                }, (error) => {
                    console.error("Profile sync error:", error);
                    setLoading(false);
                });

                handleCartAuthMerge(fbUser.uid);
            } else {
                setProfile(null);
                setRole(null);
                setLoading(false);
                initGuestCart();
            }
        });

        return () => {
            unsubAuth();
            if (unsubProfile) unsubProfile();
        };
    }, []);

    const initGuestCart = () => {
        let guestId = localStorage.getItem('fudaydiye_guest_cart_id');
        if (!guestId) {
            guestId = 'guest_' + Math.random().toString(36).substring(7);
            localStorage.setItem('fudaydiye_guest_cart_id', guestId);
        }
        setSyncCartId(guestId);
    };

    const handleCartAuthMerge = async (uid: string) => {
        const guestId = localStorage.getItem('fudaydiye_guest_cart_id');
        if (!guestId) {
            setSyncCartId(uid);
            return;
        }

        try {
            const guestDocRef = doc(db, "carts", guestId);
            const guestSnap = await getDoc(guestDocRef);
            const userDocRef = doc(db, "carts", uid);
            const userSnap = await getDoc(userDocRef);

            if (guestSnap.exists()) {
                const guestItems = guestSnap.data().items || [];
                const userItems = userSnap.exists() ? userSnap.data().items || [] : [];
                const merged = [...userItems];
                guestItems.forEach((gi: CartItem) => {
                    if (!merged.find(ui => ui.productId === gi.productId && ui.variationId === gi.variationId)) {
                        merged.push(gi);
                    }
                });

                await setDoc(userDocRef, {
                    userId: uid,
                    guestId: null,
                    items: merged,
                    updatedAt: serverTimestamp(),
                    status: 'ACTIVE'
                }, { merge: true });

                await deleteDoc(guestDocRef);
                localStorage.removeItem('fudaydiye_guest_cart_id');
            }
            setSyncCartId(uid);
        } catch (err) {
            console.error("Cart merge error:", err);
            setSyncCartId(uid);
        }
    };

    useEffect(() => {
        if (!syncCartId) return;
        const unsub = onSnapshot(doc(db, "carts", syncCartId), (snap) => {
            if (snap.exists()) {
                setCart(snap.data().items || []);
            } else {
                setCart([]);
            }
        }, (error) => {
            console.error("Cart sync error:", error);
        });
        return () => unsub();
    }, [syncCartId]);

    const updateCloudCart = async (newItems: CartItem[]) => {
        if (!syncCartId) return;
        const total = newItems.reduce((sum, i) => sum + (i.price * i.qty), 0);
        await setDoc(doc(db, "carts", syncCartId), {
            userId: user ? user.uid : null,
            guestId: !user ? syncCartId : null,
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
            newItems = [...cart, { ...item, id: Math.random().toString(36).substring(7) } as CartItem];
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
        if (!syncCartId) return; // Re-using syncCartId as a generic user/guest ID identifier for simplicity, or we can make a separate one.
        // Let's use the same ID strategy: auth uid or guest_cart_id.

        const docRef = doc(db, "wishlists", syncCartId);
        const unsub = onSnapshot(docRef, (snap) => {
            if (snap.exists()) {
                setWishlist(snap.data().items || []);
            } else {
                setWishlist([]);
            }
        }, (error) => console.error("Wishlist sync error:", error));
        return () => unsub();
    }, [syncCartId]);

    const updateCloudWishlist = async (newItems: WishlistItem[]) => {
        if (!syncCartId) return;
        await setDoc(doc(db, "wishlists", syncCartId), {
            userId: user ? user.uid : null,
            guestId: !user ? syncCartId : null,
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
                        <WalletContext.Provider value={{ balance: profile?.walletBalance || 0, topUp: (a) => console.log(a) }}>
                            {children}
                        </WalletContext.Provider>
                    </WishlistContext.Provider>
                </CartContext.Provider>
            </ToastProvider>
        </AuthContext.Provider>
    );
};

