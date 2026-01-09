import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth, useCart, useWishlist } from '../Providers';
import { doc, getDoc, collection, query, where, limit, getDocs, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
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

const ProductDetails: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { addToCart } = useCart();
  const { user, profile } = useAuth();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

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

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `Check out ${product.name} on Fudaydiye`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const currentPrice = selectedVar
    ? (selectedVar.salePrice && selectedVar.salePrice > 0 ? selectedVar.salePrice : selectedVar.price)
    : (product.salePrice && product.salePrice > 0 ? product.salePrice : product.basePrice);

  const oldPrice = selectedVar ? selectedVar.price : product.basePrice;
  const isCurrentlyOnSale = selectedVar ? (selectedVar.salePrice && selectedVar.salePrice > 0) : (product.salePrice && product.salePrice > 0);
  const currentStock = selectedVar ? selectedVar.stock : product.baseStock;

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-display text-text-main dark:text-white pb-[calc(var(--bottom-nav-height)+6rem)]">
      <div className="max-w-7xl mx-auto px-6 pt-6">
        <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-8">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <span className="text-secondary dark:text-white truncate">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          <div className="lg:col-span-6 space-y-6">
            <div className="relative aspect-square bg-white dark:bg-surface-dark rounded-[48px] overflow-hidden border border-gray-100 dark:border-white/5 shadow-soft group">
              <img src={activeImg} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="" />
              <div className="absolute top-8 right-8 flex flex-col gap-4 z-20">
                <button onClick={(e) => {
                  e.preventDefault();
                  isInWishlist(product.id) ? removeFromWishlist(product.id) : addToWishlist(product);
                }} className={`size-12 rounded-full bg-white dark:bg-black/40 backdrop-blur-md shadow-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${isInWishlist(product.id) ? 'text-red-500' : 'text-gray-400 hover:text-red-500'} `}>
                  <span className={`material-symbols-outlined text-2xl ${isInWishlist(product.id) ? 'fill-current' : ''} `}>favorite</span>
                </button>
                <button onClick={handleShare} className="size-12 rounded-full bg-white dark:bg-black/40 backdrop-blur-md shadow-xl flex items-center justify-center text-gray-400 hover:text-primary transition-all hover:scale-110 active:scale-95">
                  <span className="material-symbols-outlined text-2xl">share</span>
                </button>
              </div>
              {isCurrentlyOnSale && (
                <div className="absolute top-8 left-8 bg-red-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl animate-bounce">
                  Flash Sale Node
                </div>
              )}
            </div>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
              {product.images?.map((img, i) => (
                <button key={i} onClick={() => setActiveImg(img)} className={`size-24 rounded-[24px] overflow-hidden border-2 transition-all p-0.5 shrink-0 ${activeImg === img ? 'border-primary shadow-lg scale-105' : 'border-gray-100 dark:border-white/5 opacity-60'} `}><img src={img} className="w-full h-full object-cover rounded-[20px]" alt="" /></button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-6 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black text-primary uppercase tracking-[0.3em]">{product.category}</span>
                <span className="size-1 bg-gray-200 rounded-full"></span>
                <span className={`px - 2 py - 0.5 rounded text - [8px] font - black uppercase ${currentStock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} `}>
                  {currentStock > 0 ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-black text-secondary dark:text-white uppercase tracking-tighter leading-tight">{product.name}</h1>
              <div className="flex items-baseline gap-4 pt-2">
                <span className="text-5xl font-black text-primary tracking-tighter">${currentPrice.toFixed(2)}</span>
                {isCurrentlyOnSale && <span className="text-xl font-bold text-gray-300 line-through">${oldPrice.toFixed(2)}</span>}
              </div>
            </div>

            {product.productType === 'VARIABLE' && (
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Select Variant</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {product.variations?.map(v => (
                    <button
                      key={v.id}
                      onClick={() => handleVarSelect(v)}
                      className={`p - 4 rounded - 2xl text - [10px] font - black uppercase tracking - widest transition - all border - 2 flex flex - col items - center gap - 2 text - center ${selectedVar?.id === v.id
                        ? 'bg-secondary border-secondary text-primary shadow-lg scale-105'
                        : 'bg-white dark:bg-surface-dark border-gray-100 dark:border-white/5 text-gray-400'
                        } `}
                    >
                      {v.image && <img src={v.image} className="size-8 rounded-lg object-cover mb-1 border border-white/10" />}
                      <span className="truncate w-full">{v.name}</span>
                      <span className="text-[8px] opacity-60">${v.salePrice && v.salePrice > 0 ? v.salePrice : v.price}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 leading-loose italic border-l-4 border-primary/20 pl-6 py-1">{product.shortDescription}</p>

            <div className="flex flex-col gap-4 pt-6">
              {product.productType !== 'EXTERNAL' ? (
                <>
                  <div className="flex gap-4">
                    <div className="flex h-16 w-36 items-center rounded-2xl bg-gray-50 dark:bg-white/5 border-2 border-gray-100 dark:border-white/10 shadow-inner overflow-hidden">
                      <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="flex-1 h-full flex items-center justify-center text-gray-400 active:scale-90 transition-all"><span className="material-symbols-outlined font-black">remove</span></button>
                      <span className="w-8 text-center text-lg font-black">{quantity}</span>
                      <button onClick={() => setQuantity(quantity + 1)} className="flex-1 h-full flex items-center justify-center text-primary active:scale-90 transition-all"><span className="material-symbols-outlined font-black">add</span></button>
                    </div>
                    <button disabled={currentStock === 0} onClick={() => handleAddToCart()} className="flex-1 h-16 bg-primary text-secondary font-black text-sm uppercase tracking-[0.2em] rounded-2xl shadow-primary-glow flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-30">Add To Cart</button>
                  </div>
                  <button disabled={currentStock === 0} onClick={() => handleAddToCart(true)} className="w-full h-16 bg-secondary text-white font-black text-sm uppercase tracking-[0.2em] rounded-2xl shadow-xl active:scale-[0.98] transition-all">Buy Now</button>
                </>
              ) : (
                <button onClick={() => handleAddToCart()} className="w-full h-20 bg-blue-600 text-white font-black text-base uppercase tracking-[0.3em] rounded-[24px] shadow-xl flex items-center justify-center gap-4 active:scale-95 transition-all">
                  Deploy Affiliate Link
                  <span className="material-symbols-outlined text-3xl">open_in_new</span>
                </button>
              )}
            </div>

            <div
              onClick={() => navigate(`/customer/vendor/${product.vendorId}`)}
              className="bg-white dark:bg-surface-dark p-6 rounded-[32px] border border-gray-100 dark:border-white/5 shadow-soft flex items-center justify-between group hover:border-primary/20 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm border border-primary/20 group-hover:bg-primary group-hover:text-secondary transition-colors"><span className="material-symbols-outlined">storefront</span></div>
                <div><p className="text-[9px] font-black text-primary uppercase tracking-widest mb-0.5">Verified Merchant</p><h4 className="text-sm font-black text-secondary dark:text-white uppercase">{product.vendor}</h4></div>
              </div>
              <span className="material-symbols-outlined text-gray-300 group-hover:translate-x-1 transition-transform">chevron_right</span>
            </div>
          </div>
        </div>

        {/* Extended Details Section */}
        <section className="mt-24">
          <div className="flex flex-col md:flex-row gap-2 bg-gray-100 dark:bg-white/5 p-2 rounded-2xl w-full mb-12 border border-gray-200 dark:border-white/5">
            <TabBtn label="Narrative Details" active={activeTab === 'DESCRIPTION'} onClick={() => setActiveTab('DESCRIPTION')} />
            <TabBtn label="Specifications" active={activeTab === 'INFO'} onClick={() => setActiveTab('INFO')} />
            <TabBtn label="Reviews Ledger" active={activeTab === 'REVIEWS'} onClick={() => setActiveTab('REVIEWS')} />
          </div>

          <div className="bg-white dark:bg-surface-dark rounded-[56px] p-10 md:p-16 border border-gray-100 dark:border-white/5 shadow-soft min-h-[400px]">
            {activeTab === 'DESCRIPTION' && (
              <div className="animate-in fade-in duration-500">
                <h3 className="text-2xl font-black text-secondary dark:text-white uppercase tracking-tighter mb-6">Product Narrative</h3>
                <div className="prose dark:prose-invert max-w-none text-gray-500 dark:text-gray-400 leading-relaxed font-medium uppercase text-xs tracking-widest">
                  {product.description || 'No detailed narrative provided for this item node.'}
                </div>
              </div>
            )}

            {activeTab === 'INFO' && (
              <div className="animate-in fade-in duration-500 space-y-8">
                <h3 className="text-2xl font-black text-secondary dark:text-white uppercase tracking-tighter mb-6">Technical Nodes</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <InfoRow label="Protocol Segment" value={product.category} />
                  <InfoRow label="Stock Identity (SKU)" value={product.id} />
                  <InfoRow label="Verified Vendor" value={product.vendor} />
                  <InfoRow label="Availability Hub" value={product.baseStock > 0 ? 'Active' : 'Dormant'} />
                  <InfoRow label="Logistics Tier" value="Atomic Dispatch Enabled" />
                  <InfoRow label="Origin Node" value={product.originCountry || 'Regional'} />
                </div>
              </div>
            )}

            {activeTab === 'REVIEWS' && (
              <div className="animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                  <div>
                    <h3 className="text-2xl font-black text-secondary dark:text-white uppercase tracking-tighter">Customer Consensus</h3>
                    <div className="flex items-center gap-4 mt-4">
                      <div className="text-left">
                        <p className="text-3xl font-black text-primary leading-none">{product.rating}★</p>
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-1">{reviews.length} Validations</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (!user) { navigate('/login'); return; }
                      setIsReviewing(!isReviewing);
                    }}
                    className="bg-secondary text-primary px-8 h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-3 active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined">{isReviewing ? 'close' : 'rate_review'}</span>
                    {isReviewing ? 'Cancel Review' : 'Broadcast Feedback'}
                  </button>
                </div>

                {isReviewing && (
                  <form onSubmit={handleSubmitReview} className="mb-16 bg-gray-50 dark:bg-white/2 p-8 rounded-[40px] border border-gray-100 dark:border-white/5 animate-in slide-in-from-top-4 duration-300">
                    <div className="flex flex-col gap-8">
                      <div className="flex flex-col items-center gap-4">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Satisfaction Protocol</span>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map(star => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setNewRating(star)}
                              className={`size - 12 rounded - xl flex items - center justify - center transition - all ${newRating >= star ? 'bg-amber-400 text-white shadow-lg scale-110' : 'bg-white dark:bg-surface-dark text-gray-200'} `}
                            >
                              <span className="material-symbols-outlined font-black text-2xl fill-1">star</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Narrative Feedback</label>
                        <textarea
                          required
                          value={newComment}
                          onChange={e => setNewComment(e.target.value)}
                          placeholder="Describe your experience with this node..."
                          className="w-full h-32 bg-white dark:bg-surface-dark border-2 border-gray-100 dark:border-white/10 rounded-[28px] p-6 text-sm font-medium focus:border-primary focus:ring-0 transition-all resize-none shadow-inner"
                        />
                      </div>

                      <button
                        disabled={isSubmittingReview}
                        className="w-full h-16 bg-primary text-secondary font-black text-xs uppercase tracking-[0.3em] rounded-2xl shadow-primary-glow flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50"
                      >
                        {isSubmittingReview ? <span className="animate-spin material-symbols-outlined">sync</span> : 'Authorize & Publish'}
                      </button>
                    </div>
                  </form>
                )}

                <div className="space-y-6">
                  {reviews.length === 0 ? (
                    <div className="py-20 text-center opacity-30 uppercase font-black tracking-widest text-xs">
                      No review nodes broadcasted to the mesh yet.
                    </div>
                  ) : (
                    reviews.map((rev) => (
                      <div key={rev.id} className="bg-white dark:bg-surface-dark p-6 rounded-[32px] border border-gray-50 dark:border-white/5 shadow-soft animate-in slide-in-from-bottom-2">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-4">
                            <img src={rev.userAvatar || `https://ui-avatars.com/api/?name=${rev.userName}&background=015754&color=06DC7F`} className="size-10 rounded-xl object-cover" alt="" />
                            <div>
                              <h4 className="text-sm font-black text-secondary dark:text-white uppercase leading-none mb-1">{rev.userName}</h4>
                              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Verified Customer</p>
                            </div>
                          </div >
                          <div className="flex text-amber-400 gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className={`material-symbols-outlined text-[16px] ${i < rev.rating ? 'fill-1' : 'opacity-20'}`}>star</span>
                            ))}
                          </div>
                        </div >
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 leading-relaxed italic border-l-2 border-primary/20 pl-4">
                          "{rev.comment}"
                        </p>
                        <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest mt-4 text-right">
                          NODE SYNC: {rev.createdAt?.toDate().toLocaleDateString() || 'Just Now'}
                        </p>
                      </div >
                    ))
                  )}
                </div >
              </div >
            )}
          </div >
        </section >

        {/* Similar Nodes Section */}
        {
          similarProducts.length > 0 && (
            <section className="mt-32">
              <div className="flex justify-between items-end mb-12 px-2">
                <div>
                  <h3 className="text-3xl font-black text-secondary dark:text-white uppercase tracking-tighter leading-none">Similar Nodes</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.4em] mt-3">Cluster Recommendation</p>
                </div>
                <button onClick={() => navigate(`/customer/category/${product.category.toLowerCase()}`)} className="text-primary text-[10px] font-black uppercase tracking-widest border-b-2 border-primary pb-1">View Full Cluster</button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
                {similarProducts.map(p => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </section>
          )
        }
      </div >
    </div >
  );
};

const TabBtn = ({ label, active, onClick }: any) => (
  <button onClick={onClick} className={`px-6 md:px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap w-full md:w-auto ${active ? 'bg-white dark:bg-surface-dark text-primary shadow-sm' : 'text-gray-400 hover:text-secondary'}`}>{label}</button>
);

const InfoRow = ({ label, value }: any) => (
  <div className="flex items-center justify-between py-4 border-b border-gray-50 dark:border-white/5">
    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
    <span className="text-xs font-bold text-secondary dark:text-white uppercase">{value}</span>
  </div>
);

const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const disc = product.salePrice ? Math.round((1 - product.salePrice / product.basePrice) * 100) : 0;

  return (
    <div onClick={() => navigate(`/customer/product/${product.id}`)} className="bg-white dark:bg-surface-dark rounded-[24px] p-4 border border-gray-100 dark:border-white/5 shadow-soft group hover:-translate-y-2 transition-all cursor-pointer flex flex-col">
      <div className="relative aspect-square rounded-[32px] overflow-hidden bg-gray-50 dark:bg-black/20 mb-5 shadow-inner">
        <img src={product.images?.[0] || 'https://picsum.photos/400/400'} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-[2s]" alt="" />
        {disc > 0 && <div className="absolute top-4 left-4 bg-red-600 text-white text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest shadow-lg">-{disc}%</div>}
      </div>
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[9px] font-black text-primary uppercase tracking-[0.3em] truncate max-w-[100px]">{product.vendor}</span>
        </div>
        <h4 className="text-xs font-black text-secondary dark:text-white uppercase leading-tight line-clamp-2 mb-4 tracking-tight">{product.name}</h4>
        <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-50 dark:border-white/5">
          <span className="text-base font-black text-secondary dark:text-white tracking-tighter">${product.salePrice || product.basePrice}</span>
          <button onClick={(e) => { e.stopPropagation(); addToCart({ productId: product.id, name: product.name, price: product.salePrice || product.basePrice, qty: 1, img: product.images[0], vendor: product.vendor, vendorId: product.vendorId, attribute: 'Standard' }); }} className="size-9 bg-secondary text-primary rounded-xl shadow-2xl flex items-center justify-center active:scale-90 transition-all hover:bg-primary hover:text-secondary group/btn"><span className="material-symbols-outlined font-black text-xl group-hover/btn:scale-110 transition-transform">add</span></button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
