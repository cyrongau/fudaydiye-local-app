import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth, useCart, useWishlist } from '../Providers';
import { doc, getDoc, collection, query, where, limit, getDocs, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useToast } from '../components/Toast';
import { Product, ProductVariation } from '../types';

interface ReviewNode {
    id: string;
    productId: string;
    userId: string;
    userName: string;
    userAvatar: string;
    rating: number;
    comment: string;
    createdAt: any;
}

const MobileProductDetails: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { addToCart } = useCart();
    const { user, profile } = useAuth();
    const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
    const { showToast } = useToast();

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [activeImg, setActiveImg] = useState('');
    const [activeTab, setActiveTab] = useState<'DESCRIPTION' | 'INFO' | 'REVIEWS'>('DESCRIPTION');
    const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
    const [reviews, setReviews] = useState<ReviewNode[]>([]);

    const [selectedVar, setSelectedVar] = useState<ProductVariation | null>(null);

    // Review Form State
    const [isReviewing, setIsReviewing] = useState(false);
    const [newRating, setNewRating] = useState(5);
    const [newComment, setNewComment] = useState('');
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);

    useEffect(() => {
        async function fetchProduct() {
            if (!id) return;
            setLoading(true);
            const docSnap = await getDoc(doc(db, "products", id));
            if (docSnap.exists()) {
                const data = { id: docSnap.id, ...docSnap.data() } as Product;
                setProduct(data);
                setActiveImg(data.images?.[0] || '');

                if (data.productType === 'VARIABLE' && data.variations?.length > 0) {
                    setSelectedVar(data.variations[0]);
                    if (data.variations[0].image) setActiveImg(data.variations[0].image);
                }

                // Fetch Similar Products
                const q = query(
                    collection(db, "products"),
                    where("category", "==", data.category),
                    where("status", "==", "ACTIVE"),
                    limit(5)
                );
                const simSnap = await getDocs(q);
                setSimilarProducts(simSnap.docs.map(d => ({ id: d.id, ...d.data() } as Product)).filter(p => p.id !== id));
            }
            setLoading(false);
        }
        fetchProduct();
    }, [id]);

    // Real-time Reviews Listener
    useEffect(() => {
        if (!id) return;
        const q = query(collection(db, "reviews"), where("productId", "==", id));
        const unsub = onSnapshot(q, (snap) => {
            const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() } as ReviewNode));
            fetched.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            setReviews(fetched);
        });
        return () => unsub();
    }, [id]);

    const handleVarSelect = (v: ProductVariation) => {
        setSelectedVar(v);
        if (v.image) setActiveImg(v.image);
    };

    const handleAddToCart = (redirect = false) => {
        if (!product) return;

        if (product.productType === 'EXTERNAL') {
            window.open(product.externalUrl, '_blank');
            return;
        }

        const finalPrice = selectedVar
            ? (selectedVar.salePrice && selectedVar.salePrice > 0 ? selectedVar.salePrice : selectedVar.price)
            : (product.salePrice && product.salePrice > 0 ? product.salePrice : product.basePrice);

        addToCart({
            productId: product.id,
            variationId: selectedVar?.id,
            name: product.name,
            price: finalPrice,
            qty: quantity,
            img: activeImg,
            vendor: product.vendor,
            vendorId: product.vendorId,
            attribute: selectedVar ? selectedVar.name : 'Standard'
        });
        if (redirect) navigate('/customer/checkout');
    };

    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !id || !newComment.trim()) return;

        setIsSubmittingReview(true);
        try {
            await addDoc(collection(db, "reviews"), {
                productId: id,
                userId: user.uid,
                userName: profile?.fullName || "Verified Shopper",
                userAvatar: profile?.avatar || "",
                rating: newRating,
                comment: newComment.trim(),
                createdAt: serverTimestamp()
            });
            setNewComment('');
            setNewRating(5);
            setIsReviewing(false);
        } catch (err) {
            alert("Logic Error: Could not broadcast review node.");
        } finally {
            setIsSubmittingReview(false);
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center bg-background-light dark:bg-background-dark"><div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
    if (!product) return <div className="h-screen flex items-center justify-center font-black uppercase text-secondary dark:text-white">Node Identity Lost</div>;

    const currentPrice = selectedVar
        ? (selectedVar.salePrice && selectedVar.salePrice > 0 ? selectedVar.salePrice : selectedVar.price)
        : (product.salePrice && product.salePrice > 0 ? product.salePrice : product.basePrice);

    const currentStock = selectedVar ? selectedVar.stock : product.baseStock;

    return (
        <div className="min-h-screen bg-white dark:bg-[#121212] font-display pb-32">
            {/* 1. Header */}
            <nav className="px-6 pt-12 pb-4 flex items-center justify-between sticky top-0 z-40 bg-white/80 dark:bg-[#121212]/80 backdrop-blur-md">
                <button onClick={() => navigate(-1)} className="size-10 rounded-full bg-white dark:bg-[#1E1E1E] flex items-center justify-center shadow-sm border border-gray-100 dark:border-white/5">
                    <span className="material-symbols-outlined text-gray-900 dark:text-white">chevron_left</span>
                </button>
                <span className="text-lg font-bold text-gray-900 dark:text-white">Details</span>
                <button onClick={() => navigate('/customer/cart')} className="size-10 rounded-full bg-white dark:bg-[#1E1E1E] flex items-center justify-center shadow-sm border border-gray-100 dark:border-white/5 relative">
                    <span className="material-symbols-outlined text-gray-900 dark:text-white">shopping_bag</span>
                    {/* Simple dot for cart not empty could go here */}
                </button>
            </nav>

            {/* 2. Scrollable Content */}
            <div className="px-6 space-y-6">
                {/* Main Image */}
                <div className="aspect-[4/5] bg-gray-100 dark:bg-white/5 rounded-[40px] overflow-hidden relative shadow-inner">
                    <img src={activeImg || 'https://via.placeholder.com/400'} className="w-full h-full object-cover" alt={product.name} />

                    {/* Image Gallery Dots (Simplified) */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {product.images?.slice(0, 3).map((img, i) => (
                            <div key={i} className={`h-1.5 rounded-full transition-all ${activeImg === img ? 'w-6 bg-black dark:bg-white' : 'w-1.5 bg-black/20 dark:bg-white/20'}`}></div>
                        ))}
                    </div>
                </div>

                {/* Title & Price Row */}
                <div>
                    <p className="text-primary text-xs font-bold uppercase tracking-widest mb-2">{product.category}</p>
                    <div className="flex justify-between items-start mb-2">
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white leading-tight flex-1 mr-4">{product.name}</h1>
                        <button
                            onClick={() => isInWishlist(product.id) ? removeFromWishlist(product.id) : addToWishlist(product)}
                            className="size-10 rounded-full bg-white dark:bg-[#1E1E1E] flex items-center justify-center shadow-sm border border-gray-100 dark:border-white/5"
                        >
                            <span className={`material-symbols-outlined ${isInWishlist(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}>favorite</span>
                        </button>
                    </div>

                    {/* Vendor Row */}
                    <div
                        onClick={() => navigate(`/customer/vendor/${product.vendorId}`)}
                        className="flex items-center gap-3 py-3 border-b border-gray-50 dark:border-white/5 mb-4 cursor-pointer"
                    >
                        <div className="size-10 rounded-full bg-[#1A1A1A] flex items-center justify-center text-white font-black text-xs">
                            {product.vendor.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1">
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1">
                                {product.vendor}
                                <span className="material-symbols-outlined text-[14px] text-blue-500 bg-blue-100 rounded-full p-0.5" style={{ fontSize: '10px' }}>check</span>
                            </h4>
                            <p className="text-[10px] text-gray-400">Official Store</p>
                        </div>
                        <button className="bg-black dark:bg-white text-white dark:text-black px-4 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">check</span> Following
                        </button>
                    </div>
                </div>

                {/* Variations (Size) */}
                {product.productType === 'VARIABLE' && product.variations && (
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-sm font-bold text-gray-500">Select Variation</span>
                            <span className="text-xs text-primary font-bold">Size Guide</span>
                        </div>
                        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                            {product.variations.map(v => (
                                <button
                                    key={v.id}
                                    onClick={() => handleVarSelect(v)}
                                    className={`min-w-[50px] h-[50px] rounded-xl flex items-center justify-center text-xs font-bold transition-all border ${selectedVar?.id === v.id ? 'bg-primary border-primary text-secondary shadow-lg shadow-primary/20' : 'bg-gray-50 dark:bg-[#1E1E1E] border-transparent text-gray-500'}`}
                                >
                                    {v.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Description Snippet */}
                <div className="space-y-2">
                    <h3 className="text-sm font-bold text-gray-500">Description</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-3">
                        {product.description || product.shortDescription}
                    </p>
                    <button className="text-xs font-bold text-black dark:text-white underline">Read More</button>
                </div>
            </div>

            {/* 5. Floating Bottom Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#121212] p-6 rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.05)] border-t border-gray-50 dark:border-white/5">
                <div className="flex items-center justify-between gap-6">
                    <div>
                        <p className="text-xs text-gray-400 font-medium mb-1">Total Price</p>
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white">${currentPrice.toFixed(2)}</h2>
                    </div>

                    {/* Add to Cart Button */}
                    <button
                        disabled={currentStock === 0}
                        onClick={() => handleAddToCart()}
                        className="flex-1 h-16 bg-primary text-secondary rounded-[24px] text-sm font-black uppercase tracking-wider flex items-center justify-center gap-3 shadow-xl shadow-primary/20 active:scale-95 transition-transform"
                    >
                        <span className="material-symbols-outlined">shopping_bag</span>
                        Add to Cart
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MobileProductDetails;
