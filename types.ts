
export type UserRole = 'CUSTOMER' | 'VENDOR' | 'RIDER' | 'CLIENT' | 'ADMIN' | 'FUDAYDIYE_ADMIN' | 'SUPER_ADMIN';
export type ProductType = 'SIMPLE' | 'VARIABLE' | 'EXTERNAL';
export type VideoProvider = 'AGORA' | 'LIVEKIT';

export interface KYCDocument {
  id: string;
  type: 'ID_CARD' | 'TAX_DOC' | 'BUSINESS_REG' | 'OTHER' | 'DRIVER_LICENSE' | 'VEHICLE_PLATE';
  fileUrl: string;
  fileType: 'image' | 'pdf';
  storagePath?: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  uploadedAt: any;
  feedback?: string;
}

export interface CategoryNode {
  id: string;
  name: string;
  parentId: string | null;
  icon?: string;
  imageUrl?: string;
  createdAt: any;
}

export interface ProductAttribute {
  id: string;
  name: string;
  values: string[];
}

export interface ProductVariation {
  id: string;
  attributeValues: Record<string, string>;
  name: string;
  price: number;
  salePrice?: number;
  stock: number;
  image?: string;
  sku?: string;
}

export interface Product {
  id: string;
  name: string;
  productType: ProductType;
  basePrice: number;
  salePrice?: number;
  tags?: string[];
  category: string;
  images: string[];
  vendor: string;
  vendorId: string;
  rating: number;
  reviewsCount: number;
  baseStock: number;
  shortDescription: string;
  description: string;
  translatedDescription?: string;
  status: 'ACTIVE' | 'HIDDEN';
  hasVariations: boolean;
  attributes: ProductAttribute[];
  variations: ProductVariation[];
  createdAt?: any;
  // Dropshipping Fields
  isDropship?: boolean;
  sourceOrigin?: 'AMAZON_UAE' | 'ALIBABA' | 'ALIEXPRESS' | 'NONE';
  sourceId?: string;
  weightKg?: number;
  markupPercentage?: number;
  isExternal?: boolean;
  externalUrl?: string;
  originCountry?: string;
  comparePrice?: number;
  isFlashDeal?: boolean;
  flashSaleEndTime?: any;
}

export interface CartItem {
  id: string;
  productId: string;
  variationId?: string;
  name: string;
  price: number;
  qty: number;
  img: string;
  vendor: string;
  vendorId: string;
  attribute: string;
}

export interface CartNode {
  id: string;
  userId: string | null;
  guestId: string | null;
  items: CartItem[];
  updatedAt: any;
  status: 'ACTIVE' | 'CHECKED_OUT' | 'ABANDONED';
  totalValue: number;
  contactEmail?: string;
  contactPhone?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  isGuest?: boolean;
  guestEmail?: string;
  guestPhone?: string;
  vendorId: string;
  vendorName?: string;
  vendorHub?: string;
  promoterId?: string;
  items: CartItem[];
  total: number;
  deliveryFee: number;
  status: 'PENDING' | 'ACCEPTED' | 'PACKING' | 'SHIPPED' | 'DELIVERED';
  date: string;
  address: string;
  shippingAddress: string;
  paymentMethod?: string;
  currency: 'USD' | 'SLSH';
  createdAt?: any;
  completedAt?: any;
  deliveryCode?: string;
  riderId?: string;
  riderName?: string;
  isAtomic?: boolean;
  atomicDeadline?: any;
  currentLocation?: { lat: number; lng: number };
  batchId?: string;
  estimatedArrival?: string;
  distanceToPickup?: string;
  pickupGeo?: { lat: number; lng: number };
  isRatedByCustomer?: boolean;
}

export interface SavedPaymentSource {
  id: string;
  type: 'MOBILE' | 'CARD';
  provider: string;
  mask: string;
  lastUsedAt?: any;
}

export interface UserProfile {
  uid: string;
  fullName: string;
  role: UserRole;
  mobile: string;
  email: string;
  walletBalance: number;
  rewardPoints: number;
  trustScore: number;
  trustTier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  ordersFulfilled: number;
  onTimeDeliveries: number;
  totalRatingsCount: number;
  ratingsSum: number;
  reviewsWritten: number;
  isPromoter?: boolean;
  canStream?: boolean;
  referralEarnings?: number;
  location?: string;
  vendorStatus?: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED';
  avatar?: string;
  businessName?: string;
  businessLogo?: string; // New field for merchant branding
  operationalHub?: string;
  status?: string;
  currentGeo?: { lat: number; lng: number };
  lat?: number;
  lng?: number;
  vehicleType?: string;
  plateNumber?: string;
  savedPaymentSources?: SavedPaymentSource[];
  kycStatus?: 'NONE' | 'PENDING' | 'VERIFIED' | 'REJECTED';
  kycDocuments?: KYCDocument[];
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'PURCHASE' | 'EARNING' | 'PAYOUT' | 'PLATFORM_REVENUE' | 'DEPOSIT';
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  referenceId: string;
  description: string;
  createdAt: any;
  balanceBefore?: number;
  balanceAfter?: number;
}

export interface LiveSaleSession {
  id: string;
  vendorId: string;
  vendorName: string;
  hostAvatar: string;
  title: string;
  category: string;
  status: 'SCHEDULED' | 'LIVE' | 'ENDED';
  isFeatured?: boolean;
  viewerCount: number;
  peakViewers?: number;
  featuredProductId: string;
  featuredProductName: string;
  featuredProductPrice: number;
  featuredProductImg: string;
  streamUrl: string;
  provider: VideoProvider;
  createdAt: any;
  scheduledAt?: any;
  endedAt?: any;
}

export interface CMSContent {
  id: string;
  type: 'PAGE' | 'BLOG' | 'FAQ' | 'HOME_SLIDER' | 'SHOP_SLIDER' | 'MOBILE_AD' | 'PROMO_CARD';
  title: string;
  subtitle?: string;
  section?: 'HOME_TOP_ROW' | 'HOME_BOTTOM_ROW';
  slug: string;
  status: 'DRAFT' | 'PUBLISHED';
  category: string;
  tags?: string[];
  featuredImage?: string;
  ctaText?: string;
  ctaLink?: string;
  linkedProductId?: string;
  linkedVendorId?: string;
  content: string;
  author?: string;
  adFormat?: 'PRODUCT_CARD' | 'IMAGE_BANNER';
  buttonText?: string;
  createdAt: any;
  updatedAt: any;
}

export interface PayoutRequest {
  id: string;
  vendorId: string;
  vendorName: string;
  amount: number;
  status: 'PENDING' | 'SETTLED' | 'REJECTED';
  method: string;
  accountDetails: string;
  createdAt: any;
  authorizedAt?: any;
}

export interface RiderProfile {
  id: string;
  name: string;
  hub: string;
  currentGeo: { lat: number; lng: number };
  rating: number;
  vehicleType: string;
  avatar?: string;
}

export interface Store {
  id: string;
  vendorId: string;
  name: string;
  location: string;
  manager: string;
  status: 'ONLINE' | 'OFFLINE' | 'CLOSED' | 'LIVE';
  lat: number;
  lng: number;
  revenue?: string;
  lastActive?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface VendorUser {
  id: string;
  name: string;
  email: string;
  role: string;
  staffType?: 'MANAGER' | 'STAFF';
  storeId: string;
  storeName: string;
  parentVendorId: string;
  status: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  link?: string;
  type: 'ORDER' | 'FINANCE' | 'SYSTEM';
  isRead: boolean;
  createdAt: any;
}
export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  action: 'LOGIN' | 'SUSPEND' | 'REINSTATE' | 'DELETE' | 'UPDATE' | 'CREATE' | 'SYSTEM_CHECK';
  targetId?: string;
  targetType?: 'USER' | 'PRODUCT' | 'ORDER' | 'SYSTEM';
  details: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  metadata?: any;
  timestamp: any;
}
