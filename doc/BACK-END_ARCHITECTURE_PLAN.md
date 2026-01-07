# Fudaydiye Backend Architecture & Data Migration Plan

## 1. Objective
To transition the Fudaydiye Multi-Vendor Platform from a static/mock-driven UI to a production-ready, real-time dynamic system using Firebase (Firestore, Authentication, Storage, and Cloud Functions) and the Gemini API for intelligent features.

## 2. Core Infrastructure Strategy

### 2.1 Services Mapping
- **Identity & RBAC:** Firebase Authentication + Firestore `users` collection for role mapping (`CUSTOMER`, `VENDOR`, `RIDER`, `CLIENT`, `ADMIN`).
- **Real-time Database:** Firestore for all transactional data, catalogs, and live sale states.
- **Media Assets:** Firebase Storage for product images, user avatars, and delivery proofs.
- **Backend Logic (Server-side):** 
  - **Firestore Security Rules:** Primary gatekeeper for data integrity and access control.
  - **Cloud Functions:** For sensitive operations (payment verification, commission calculation, order state triggers).
  - **Gemini API:** Integrated via client-side/functions for product descriptions, sentiment analysis, and smart dispatch.

## 3. Data Domain Modeling (Schema Design)

### 3.1 `users` (Collection)
- `uid`: string (Primary Key)
- `fullName`: string
- `email`: string
- `mobile`: string (normalized)
- `role`: enum (UserRole)
- `location`: string (Neighborhood/Zone)
- `avatar`: string (URL)
- `walletBalance`: number
- `metadata`: object (role-specific data like `plateNumber` or `businessIdentity`)

### 3.2 `products` (Collection)
- `id`: string
- `vendorId`: string (Reference)
- `name`: string
- `price`: number
- `category`: string
- `stock`: number
- `images`: array<string>
- `description`: string (AI-enhanced)
- `status`: enum (ACTIVE, HIDDEN)
- `rating`: number
- `reviewsCount`: number

### 3.3 `orders` (Collection)
- `id`: string
- `customerId`: string (Reference)
- `vendorId`: string (Reference)
- `items`: array<{productId, qty, price, attribute}>
- `status`: enum (PENDING, ACCEPTED, PACKING, SHIPPED, DELIVERED)
- `total`: number
- `paymentMethod`: string
- `shippingAddress`: string
- `trackingId`: string (Reference to Logistics)
- `createdAt`: timestamp

### 3.4 `live_sessions` (Collection)
- `id`: string
- `vendorId`: string
- `title`: string
- `status`: enum (UPCOMING, LIVE, ENDED)
- `viewers`: number
- `featuredProducts`: array<string> (Product IDs)
- `streamUrl`: string

### 3.5 `logistics_jobs` (Collection)
- `id`: string
- `orderId`: string (Reference)
- `riderId`: string (Reference)
- `status`: enum (PENDING, PICKED_UP, IN_TRANSIT, DELIVERED)
- `pickupGeo`: {lat, lng}
- `dropoffGeo`: {lat, lng}
- `currentGeo`: {lat, lng} (Real-time updates)

## 4. Phase-wise Execution Plan

### Phase 1: Authentication & Profile Synchronization (Week 1)
- **Goal:** Users log in and see their own data across all views.
- **Actions:**
  - Update `App.tsx` Auth Listener to fetch full profile on every state change.
  - Migrating `PersonalInfo.tsx` and `UserSettings.tsx` to write directly to Firestore.
  - Implement a `ProfileLoader` HOC to prevent UI flickering during data fetch.

### Phase 2: Catalog & Storefront Dynamic Population (Week 2)
- **Goal:** Vendors manage products; Customers see real listings.
- **Actions:**
  - Create the `products` collection with seed data.
  - Link `CustomerHome.tsx` to query Firestore `products` instead of `GLOBAL_CATALOG`.
  - Implement `VendorProductManagement.tsx` CRUD logic (Add/Edit/Delete).
  - Use `Firebase Storage` for real-time image uploads.

### Phase 3: Transactional Engine (Orders & Wallets) (Week 3)
- **Goal:** Real money/stock movements.
- **Actions:**
  - **Order Flow:** `Checkout.tsx` writes to `orders` collection.
  - **Inventory Sync:** Implement a Firestore Transaction to decrement `stock` when an order is placed.
  - **Wallet Logic:** Implement `useWallet` hook to pull from `users.walletBalance`.
  - **Rider Queue:** `RiderJobs.tsx` queries for orders with status `ACCEPTED` in their assigned hub.

### Phase 4: Social Commerce Integration (Week 4)
- **Goal:** Live sales sessions driven by database states.
- **Actions:**
  - **Broadcasting:** `VendorLiveSaleSetup.tsx` creates a document in `live_sessions`.
  - **Real-time Chat:** Implement Firestore sub-collection `live_sessions/{id}/chat` for the chat feed in `LiveStream.tsx`.
  - **Product Drops:** Real-time listeners on `featuredProducts` for in-stream overlays.

### Phase 5: Logistics & GPS Tracking (Week 5)
- **Goal:** Live tracking on maps.
- **Actions:**
  - **GPS Feed:** Update `rider` location in Firestore every 10 seconds during an active job.
  - **Tracking Map:** Connect `TrackingMap.tsx` and `RiderNavigationView.tsx` to the `logistics_jobs` real-time stream.
  - **OTP Verification:** Store `deliveryCode` in `orders` for the `RiderDeliveryConfirmation.tsx` step.

### Phase 6: Admin Intelligence & Cleanup (Week 6)
- **Goal:** Platform oversight and AI integration.
- **Actions:**
  - **Admin Panel:** Connect `AdminPanel.tsx` to global stats queries (Total Sales, Active Riders).
  - **AI Integration:** Deploy Gemini logic for `OrderDisputeRefund.tsx` analysis and `VendorAnalytics.tsx` forecasts.
  - **Production Security Rules:** Finalize Firestore rules (e.g., only Riders can update their own GPS; only Admins can delete users).

## 5. Data Population & Migration Strategy
1. **Developer Seeds:** A Node.js script will be provided to populate the `products` and `users` collections with high-quality Somali-market specific data (Diracs, Electronics, etc.).
2. **Avatar/Image Storage:** All mock images (Unsplash/Picsum) will be migrated to the internal Firebase Storage bucket to avoid external dependency latency.

## 6. Integration Quality Check
- **Latency:** Ensure use of Firestore `persistence` for offline support in areas with spotty connectivity (e.g., Berbera Port).
- **Concurrency:** Use atomic increments (`fieldValue.increment`) for viewer counts and wallet balances to prevent race conditions.
- **Responsiveness:** Maintain the high-end UI design while data loads (using Shimmer loaders).

---
**Plan Status:** Ready for Review
**Next Step:** Signal for coding Phase 1 (Authentication & Profile Sync).
