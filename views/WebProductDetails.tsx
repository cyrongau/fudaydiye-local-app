import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth, useCart, useWishlist } from '../Providers';
import { doc, getDoc, collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useToast } from '../components/Toast';
import { Product, ProductVariation } from '../types';

const WebProductDetails: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { addToCart } = useCart();
    const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
    const { showToast } = useToast();

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [activeImg, setActiveImg] = useState('');
    const [activeTab, setActiveTab] = useState<'DESCRIPTION' | 'REVIEWS'>('DESCRIPTION');
    const [selectedVar, setSelectedVar] = useState<ProductVariation | null>(null);
    const [similarProducts, setSimilarProducts] = useState<Product[]>([]);

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

                // Fetch Similar
                const q = query(
                    collection(db, "products"),
                    where("category", "==", data.category),
                    where("status", "==", "ACTIVE"),
                    limit(4)
                );
                const simSnap = await getDocs(q);
                setSimilarProducts(simSnap.docs.map(d => ({ id: d.id, ...d.data() } as Product)).filter(p => p.id !== id));
            }
            setLoading(false);
        }
        fetchProduct();
    }, [id]);

    const handleAddToCart = (redirect = false) => {
        if (!product) return;
        const finalPrice = selectedVar ? (selectedVar.salePrice || selectedVar.price) : (product.salePrice || product.basePrice);
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
        else showToast('Added to cart', 'SUCCESS');
    };

    if (loading) return <div className="h-screen flex items-center justify-center"><div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
    if (!product) return <div>Product not found</div>;

    const currentPrice = selectedVar ? (selectedVar.salePrice || selectedVar.price) : (product.salePrice || product.basePrice);
    const oldPrice = selectedVar ? selectedVar.price : product.basePrice;

    return (
        <div className="max-w-7xl mx-auto px-8 py-12">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 mb-8">
                <span className="cursor-pointer hover:text-primary" onClick={() => navigate('/')}>Home</span>
                <span>/</span>
                <span className="cursor-pointer hover:text-primary" onClick={() => navigate('/customer/explore')}>Shop</span>
                <span>/</span>
                <span className="text-secondary dark:text-white">{product.name}</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-24">
                {/* Left: Gallery */}
                <div className="space-y-6">
                    <div className="aspect-square bg-gray-50 dark:bg-white/5 rounded-[40px] overflow-hidden relative group">
                        <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                            style={{ backgroundImage: `url(${activeImg})` }}></div>
                        <div className="absolute inset-0 bg-black/5 dark:bg-black/20 group-hover:bg-transparent transition-colors duration-300 pointer-events-none"></div>
                        <button
                            onClick={() => isInWishlist(product.id) ? removeFromWishlist(product.id) : addToWishlist(product)}
                            className="absolute top-6 right-6 size-12 rounded-full bg-white dark:bg-[#1E1E1E] shadow-xl flex items-center justify-center hover:scale-110 transition-transform z-10"
                        >
                            <span className={`material-symbols-outlined text-[24px] ${isInWishlist(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}>favorite</span>
                        </button>
                    </div>
                    <div className="flex gap-4 overflow-x-auto py-2">
                        {product.images?.map((img, i) => (
                            <button
                                key={i}
                                onClick={() => setActiveImg(img)}
                                className={`size-24 rounded-2xl border-2 shrink-0 bg-cover bg-center transition-all ${activeImg === img ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100'}`}
                                style={{ backgroundImage: `url(${img})` }}
                            >
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right: Info */}
                <div className="flex flex-col">
                    <div className="flex items-center gap-4 mb-4">
                        <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{product.category}</span>
                        {product.salePrice && <span className="bg-red-100 text-red-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Sale</span>}
                        <div className="flex items-center gap-1 text-orange-400">
                            <span className="material-symbols-outlined text-[16px] icon-filled">star</span>
                            <span className="text-xs font-bold text-gray-900 dark:text-white mt-0.5">4.8 (124 reviews)</span>
                        </div>
                    </div>

                    <h1 className="text-4xl lg:text-5xl font-black text-secondary dark:text-white leading-tight mb-4 tracking-tight">{product.name}</h1>

                    <div className="flex items-end gap-4 mb-8">
                        <span className="text-4xl font-black text-primary">${currentPrice.toFixed(2)}</span>
                        {oldPrice > currentPrice && <span className="text-xl font-bold text-gray-400 line-through mb-1.5">${oldPrice.toFixed(2)}</span>}
                    </div>

                    {/* Variations */}
                    {product.productType === 'VARIABLE' && product.variations && (
                        <div className="mb-8">
                            <div className="flex justify-between mb-3">
                                <span className="text-sm font-bold text-gray-900 dark:text-white">Select Variation</span>
                                <button className="text-xs font-bold text-primary">Size Guide</button>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                {product.variations.map(v => (
                                    <button
                                        key={v.id}
                                        onClick={() => { setSelectedVar(v); if (v.image) setActiveImg(v.image); }}
                                        className={`px-6 h-12 rounded-xl text-xs font-bold uppercase tracking-wider border-2 transition-all ${selectedVar?.id === v.id ? 'border-primary bg-primary text-secondary shadow-lg shadow-primary/20' : 'border-gray-100 dark:border-white/10 text-gray-500 hover:border-gray-300'}`}
                                    >
                                        {v.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Quantity & Actions */}
                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-14 p-1 bg-gray-50 dark:bg-white/5 rounded-[20px] flex items-center border border-gray-100 dark:border-white/5">
                            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="size-12 rounded-2xl bg-white dark:bg-surface-dark shadow-sm flex items-center justify-center hover:text-primary transition-colors">
                                <span className="material-symbols-outlined text-[18px]">remove</span>
                            </button>
                            <input
                                type="number"
                                value={quantity}
                                readOnly
                                className="w-12 text-center bg-transparent border-none text-lg font-black text-secondary dark:text-white focus:ring-0 p-0"
                            />
                            <button onClick={() => setQuantity(quantity + 1)} className="size-12 rounded-2xl bg-white dark:bg-surface-dark shadow-sm flex items-center justify-center hover:text-primary transition-colors">
                                <span className="material-symbols-outlined text-[18px]">add</span>
                            </button>
                        </div>
                        <span className="text-xs font-bold text-green-500 bg-green-50 dark:bg-green-900/10 px-3 py-1.5 rounded-lg flex items-center gap-1">
                            <span className="size-2 rounded-full bg-green-500 animate-pulse"></span>
                            {selectedVar ? selectedVar.stock : product.baseStock} available
                        </span>
                    </div>

                    <div className="flex gap-4 mb-10">
                        <button onClick={() => handleAddToCart(false)} className="flex-1 h-14 border-2 border-primary text-primary hover:bg-primary hover:text-secondary rounded-[20px] text-sm font-black uppercase tracking-widest transition-all">
                            Add to Cart
                        </button>
                        <button onClick={() => handleAddToCart(true)} className="flex-1 h-14 bg-primary text-secondary rounded-[20px] text-sm font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
                            Buy Now
                        </button>
                    </div>

                    {/* Benefits */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                            <div className="size-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
                                <span className="material-symbols-outlined">local_shipping</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Delivery</span>
                                <span className="text-xs font-bold text-secondary dark:text-white">2-3 Days</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                            <div className="size-10 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center">
                                <span className="material-symbols-outlined">verified_user</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Guarantee</span>
                                <span className="text-xs font-bold text-secondary dark:text-white">7 Days Return</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Details */}
            <div className="bg-gray-50 dark:bg-white/5 rounded-[40px] p-8 lg:p-12 mb-24">
                <h3 className="text-xl font-black text-secondary dark:text-white mb-6">Product Description</h3>
                <div className="prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-gray-300">
                    <p>{product.description || product.shortDescription}</p>
                </div>
            </div>

            {/* You May Also Like */}
            <div>
                <h3 className="text-2xl font-black text-secondary dark:text-white mb-8">You may also like</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {similarProducts.map(prod => (
                        <div key={prod.id} onClick={() => navigate(`/customer/product/${prod.id}`)} className="group cursor-pointer">
                            <div className="aspect-square bg-gray-100 dark:bg-white/5 rounded-[32px] overflow-hidden mb-4 border border-gray-100 dark:border-white/5 relative bg-cover bg-center transition-transform group-hover:scale-105"
                                style={{ backgroundImage: `url(${prod.images?.[0] || 'https://via.placeholder.com/400'})` }}>
                                {prod.salePrice && <span className="absolute top-4 left-4 bg-red-500 text-white text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-widest">-20%</span>}
                            </div>
                            <h4 className="text-sm font-bold text-secondary dark:text-white truncate mb-1">{prod.name}</h4>
                            <p className="text-primary font-black">${prod.salePrice || prod.basePrice}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default WebProductDetails;
