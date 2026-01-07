# Fudaydiye System Architecture & Development Plan

**Version:** 1.0  
**Date:** 2024  
**Status:** Initial Architecture Design

---

## Table of Contents

1. [System Architecture Overview](#1-system-architecture-overview)
2. [Module Breakdown](#2-module-breakdown)
3. [Database Domain Model](#3-database-domain-model)
4. [Backend Development Plan](#4-backend-development-plan)
5. [Sprint Roadmap](#5-sprint-roadmap)
6. [API Contracts Overview](#6-api-contracts-overview)
7. [Integration Points](#7-integration-points)
8. [Risk Assessment](#8-risk-assessment)

---

## 1. System Architecture Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT APPLICATIONS                       │
├──────────────┬──────────────┬──────────────┬────────────────────┤
│   Customer   │    Vendor    │  Logistics   │      Admin         │
│   App (F)    │  Dashboard(F)│    App (F)   │   Dashboard (F)    │
│ Web + Mobile │   Web Only   │  Mobile Only │     Web Only       │
└──────┬───────┴──────┬───────┴──────┬───────┴──────────┬──────────┘
       │              │              │                 │
       └──────────────┴──────────────┴─────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API GATEWAY / LOAD BALANCER                   │
│                    (Rate Limiting, Auth, Routing)                │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NESTJS BACKEND (REST API)                     │
│                    /api/v1/*                                     │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Auth       │  │   Orders     │  │  Payments    │          │
│  │   Module     │  │   Module     │  │  Module      │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Products   │  │  Live Sale   │  │  Logistics   │          │
│  │   Module     │  │  Module      │  │  Module      │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Vendors    │  │  Analytics   │  │  Admin       │          │
│  │   Module     │  │  Module      │  │  Module      │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
       │                    │                    │
       ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  PostgreSQL  │    │    Redis     │    │  External    │
│  (Primary DB)│    │ (Cache/Queue)│    │   Services   │
└──────────────┘    └──────────────┘    └──────────────┘
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    ▼                         ▼                         ▼
            ┌──────────────┐          ┌──────────────┐          ┌──────────────┐
            │ Mobile Money │          │ Google Maps  │          │  Streaming   │
            │   APIs       │          │     API      │          │  (WebRTC/    │
            │              │          │              │          │    RTMP)     │
            └──────────────┘          └──────────────┘          └──────────────┘
```

### 1.2 Core Design Principles

- **Domain-Driven Design (DDD)**: Each module represents a bounded context
- **Microservices-Ready**: Modules can be extracted to services later
- **Event-Driven**: Critical flows use events (Redis pub/sub or queues)
- **Stateless Backend**: JWT-based auth, horizontal scaling ready
- **Database per Domain**: Logical separation, shared PostgreSQL instance initially

### 1.3 Technology Stack Confirmation

**Backend:**
- NestJS 10+ (TypeScript)
- Node.js LTS (20.x)
- Prisma ORM
- PostgreSQL 15+
- Redis 7+ (BullMQ for queues, cache)
- JWT (Passport.js)
- Class-validator, Class-transformer

**Frontend:**
- Flutter 3.x (Dart 3.x)
- BLoC or Riverpod (TBD per feature)
- Material 3
- Responsive design (Web + Mobile)

**Infrastructure:**
- Docker & Docker Compose
- AWS/GCP ready
- Google Maps SDK
- WebRTC/RTMP for streaming

---

## 2. Module Breakdown

### 2.1 Authentication & User Management Module

**Purpose:** Centralized identity, roles, and permissions

**Responsibilities:**
- User registration (phone/email)
- JWT token generation & refresh
- Role-based access control (RBAC)
- Password reset & OTP verification
- User profile management
- Multi-factor authentication (optional Phase 1)

**Entities:**
- User
- Role
- Permission
- UserSession
- OTP

**Key Services:**
- `AuthService`: Login, register, token management
- `UserService`: Profile CRUD
- `RoleService`: RBAC management

**Dependencies:** None (foundational)

**API Endpoints:**
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/forgot-password`
- `GET /api/v1/users/me`
- `PATCH /api/v1/users/me`

---

### 2.2 Multi-Vendor Marketplace Module

**Purpose:** Vendor onboarding, profiles, and marketplace operations

**Responsibilities:**
- Vendor registration & approval workflow
- Vendor profile management
- Storefront configuration
- Vendor verification & documents
- Commission configuration per vendor
- Vendor analytics dashboard data

**Entities:**
- Vendor
- VendorDocument
- VendorStorefront
- VendorCommission

**Key Services:**
- `VendorService`: Vendor CRUD, approval
- `StorefrontService`: Storefront management
- `CommissionService`: Commission calculation rules

**Dependencies:** Auth Module

**API Endpoints:**
- `POST /api/v1/vendors/register`
- `GET /api/v1/vendors` (list with filters)
- `GET /api/v1/vendors/:id`
- `PATCH /api/v1/vendors/:id/approve`
- `GET /api/v1/vendors/:id/storefront`

---

### 2.3 Product & Inventory Management Module

**Purpose:** Product catalog, inventory tracking, and stock management

**Responsibilities:**
- Product CRUD (local & dropship)
- Category & subcategory management
- Inventory tracking with real-time updates
- Stock locking during checkout
- Product variants (size, color, etc.)
- Product images & media
- Search & filtering
- Product recommendations (AI Phase 1)

**Entities:**
- Product
- Category
- ProductVariant
- Inventory
- InventoryTransaction
- ProductImage
- ProductTag

**Key Services:**
- `ProductService`: Product CRUD, search
- `InventoryService`: Stock management, locking
- `CategoryService`: Category tree management
- `SearchService`: Full-text search

**Dependencies:** Vendor Module, Auth Module

**API Endpoints:**
- `GET /api/v1/products` (with filters, pagination)
- `GET /api/v1/products/:id`
- `POST /api/v1/products` (vendor only)
- `PATCH /api/v1/products/:id`
- `GET /api/v1/products/:id/inventory`
- `POST /api/v1/inventory/lock`
- `POST /api/v1/inventory/unlock`

---

### 2.4 Orders & Checkout Module

**Purpose:** Order lifecycle, checkout process, and order management

**Responsibilities:**
- Shopping cart management
- Checkout flow (multi-step)
- Order creation & status tracking
- Order cancellation & refund initiation
- Order splitting (multi-vendor orders)
- Order history
- Order notifications

**Entities:**
- Cart
- CartItem
- Order
- OrderItem
- OrderStatus
- OrderNote

**Key Services:**
- `CartService`: Cart management
- `OrderService`: Order creation, status updates
- `CheckoutService`: Checkout orchestration

**Dependencies:** Product Module, Payment Module, Auth Module

**API Endpoints:**
- `GET /api/v1/cart`
- `POST /api/v1/cart/items`
- `DELETE /api/v1/cart/items/:id`
- `POST /api/v1/orders/checkout`
- `GET /api/v1/orders`
- `GET /api/v1/orders/:id`
- `PATCH /api/v1/orders/:id/cancel`

---

### 2.5 Payments & Wallets Module

**Purpose:** Payment processing, wallet management, and financial transactions

**Responsibilities:**
- Payment gateway integration (5 mobile money providers)
- Wallet creation & management
- Transaction logging & audit trail
- Commission calculation & distribution
- Refund processing
- Settlement to vendors
- Payment method management
- Cash-on-delivery handling

**Entities:**
- Wallet
- Payment
- PaymentMethod
- Transaction
- Commission
- Settlement
- Refund

**Key Services:**
- `PaymentService`: Payment processing, gateway calls
- `WalletService`: Wallet operations (atomic)
- `CommissionService`: Commission calculation
- `SettlementService`: Vendor payouts

**Dependencies:** Order Module, Auth Module

**API Endpoints:**
- `POST /api/v1/payments/initiate`
- `POST /api/v1/payments/verify`
- `GET /api/v1/wallets/me`
- `POST /api/v1/wallets/withdraw`
- `GET /api/v1/transactions`
- `POST /api/v1/payments/refund`

---

### 2.6 Social E-commerce Live Sale Module (First-Class)

**Purpose:** Live streaming sales, real-time interactions, and instant checkout

**Responsibilities:**
- Live session creation & management
- Stream URL generation (WebRTC/RTMP)
- Real-time chat & reactions
- Product overlay during streams
- Click-to-buy during live sessions
- Inventory locking during live sales
- Viewer analytics
- Promoter reward tracking
- Live sale performance metrics

**Entities:**
- LiveSaleSession
- LiveSaleProduct
- LiveSaleViewer
- LiveSaleChat
- LiveSaleReaction
- LiveSaleAnalytics
- PromoterReward

**Key Services:**
- `LiveSaleService`: Session management, stream orchestration
- `LiveSaleChatService`: Real-time chat (WebSocket/SSE)
- `LiveSaleProductService`: Product overlay management
- `LiveSaleAnalyticsService`: Metrics & insights

**Dependencies:** Product Module, Order Module, Payment Module, Auth Module

**API Endpoints:**
- `POST /api/v1/live-sales`
- `GET /api/v1/live-sales/active`
- `GET /api/v1/live-sales/:id`
- `POST /api/v1/live-sales/:id/products`
- `POST /api/v1/live-sales/:id/chat`
- `POST /api/v1/live-sales/:id/buy`
- `GET /api/v1/live-sales/:id/analytics`

**Real-time:**
- WebSocket: `/ws/live-sales/:id` (chat, reactions, product updates)

---

### 2.7 Ratings & Reviews Module

**Purpose:** Customer feedback, product ratings, and vendor reputation

**Responsibilities:**
- Product rating & review submission
- Vendor rating
- Review moderation
- Review aggregation & statistics
- Sentiment analysis input (AI Phase 1)

**Entities:**
- Review
- Rating
- ReviewImage
- ReviewHelpful

**Key Services:**
- `ReviewService`: Review CRUD, moderation
- `RatingService`: Rating aggregation

**Dependencies:** Order Module, Product Module, Auth Module

**API Endpoints:**
- `POST /api/v1/reviews`
- `GET /api/v1/products/:id/reviews`
- `GET /api/v1/vendors/:id/reviews`
- `PATCH /api/v1/reviews/:id/helpful`

---

### 2.8 Drop-Shipping Module

**Purpose:** Overseas product sourcing and fulfillment

**Responsibilities:**
- Dropship product import
- Supplier management
- Price margin calculation
- Order forwarding to suppliers
- Tracking integration
- Dropship-specific inventory rules

**Entities:**
- DropshipProduct
- Supplier
- DropshipOrder
- SupplierOrder

**Key Services:**
- `DropshipService`: Dropship product management
- `SupplierService`: Supplier management
- `DropshipOrderService`: Order forwarding

**Dependencies:** Product Module, Order Module

**API Endpoints:**
- `GET /api/v1/dropship/products`
- `POST /api/v1/dropship/products/import`
- `GET /api/v1/suppliers`
- `POST /api/v1/dropship/orders/:id/forward`

---

### 2.9 Fudaydiye Logistics Module (Standalone-Capable)

**Purpose:** Delivery management, routing, and logistics operations

**Responsibilities:**
- Delivery job creation (from orders or external)
- Rider assignment & management
- Route optimization (Google Maps)
- Real-time tracking
- Pickup & delivery confirmation
- Cash collection & reconciliation
- Delivery analytics
- External delivery request handling

**Entities:**
- DeliveryJob
- Rider
- DeliveryRoute
- DeliveryStatus
- DeliveryProof
- ExternalDeliveryRequest

**Key Services:**
- `DeliveryService`: Job creation, assignment
- `RiderService`: Rider management
- `RoutingService`: Google Maps integration
- `TrackingService`: Real-time tracking

**Dependencies:** Order Module (optional), Auth Module

**API Endpoints:**
- `POST /api/v1/logistics/deliveries`
- `GET /api/v1/logistics/deliveries`
- `POST /api/v1/logistics/deliveries/:id/assign`
- `PATCH /api/v1/logistics/deliveries/:id/status`
- `GET /api/v1/logistics/deliveries/:id/track`
- `POST /api/v1/logistics/external-requests`
- `GET /api/v1/logistics/riders`

**Real-time:**
- WebSocket: `/ws/deliveries/:id` (tracking updates)

---

### 2.10 AI & Analytics Module (Phase 1)

**Purpose:** Data-driven insights, recommendations, and basic AI features

**Responsibilities:**
- Product recommendation engine
- Demand trend analysis
- Live sale performance metrics
- Discount suggestion logic
- Basic fraud detection
- Sales analytics aggregation
- User behavior tracking

**Entities:**
- Recommendation
- TrendAnalysis
- AnalyticsEvent
- FraudAlert

**Key Services:**
- `RecommendationService`: Product recommendations
- `AnalyticsService`: Data aggregation
- `TrendService`: Demand forecasting
- `FraudDetectionService`: Anomaly detection

**Dependencies:** All modules (data consumer)

**API Endpoints:**
- `GET /api/v1/analytics/recommendations`
- `GET /api/v1/analytics/trends`
- `GET /api/v1/analytics/live-sales/:id/performance`
- `GET /api/v1/analytics/dashboard` (admin)

---

### 2.11 Admin & Super Admin Module

**Purpose:** Platform administration, monitoring, and control

**Responsibilities:**
- User & vendor management
- Order monitoring & intervention
- Payment reconciliation
- Commission configuration
- Dispute resolution
- System configuration
- Analytics dashboard
- Audit logs

**Entities:**
- AdminUser
- SystemConfig
- Dispute
- AuditLog

**Key Services:**
- `AdminService`: User/vendor management
- `DisputeService`: Dispute resolution
- `ConfigService`: System configuration

**Dependencies:** All modules

**API Endpoints:**
- `GET /api/v1/admin/users`
- `PATCH /api/v1/admin/users/:id/status`
- `GET /api/v1/admin/orders`
- `POST /api/v1/admin/disputes/:id/resolve`
- `GET /api/v1/admin/analytics`

---

## 3. Database Domain Model

### 3.1 Core Entities & Relationships

```prisma
// Core User & Auth
model User {
  id            String   @id @default(uuid())
  email         String?  @unique
  phone         String?  @unique
  passwordHash  String
  firstName     String?
  lastName      String?
  avatar        String?
  isActive      Boolean  @default(true)
  isVerified    Boolean  @default(false)
  role          UserRole @default(CUSTOMER)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  deletedAt     DateTime?

  // Relations
  sessions      UserSession[]
  vendor        Vendor?
  rider         Rider?
  orders        Order[]
  cart          Cart?
  wallet        Wallet?
  reviews       Review[]
  liveSales     LiveSaleSession[] @relation("Host")
  liveSaleViews LiveSaleViewer[]
  addresses     Address[]

  @@index([email])
  @@index([phone])
  @@map("users")
}

enum UserRole {
  CUSTOMER
  VENDOR
  RIDER
  ADMIN
  SUPER_ADMIN
}

model UserSession {
  id           String   @id @default(uuid())
  userId       String
  token        String   @unique
  refreshToken String?  @unique
  ipAddress    String?
  userAgent    String?
  expiresAt    DateTime
  createdAt    DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([token])
  @@map("user_sessions")
}

// Vendor & Marketplace
model Vendor {
  id              String   @id @default(uuid())
  userId          String   @unique
  businessName    String
  businessLicense String?
  taxId           String?
  status          VendorStatus @default(PENDING)
  commissionRate  Decimal  @default(0.10) // 10%
  rating          Decimal  @default(0) @db.Decimal(3, 2)
  totalSales      Int      @default(0)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  approvedAt      DateTime?
  approvedBy      String?

  user            User     @relation(fields: [userId], references: [id])
  documents       VendorDocument[]
  products        Product[]
  orders          Order[]
  liveSales       LiveSaleSession[]
  reviews         Review[]
  storefront      VendorStorefront?
  commissions     Commission[]

  @@index([status])
  @@map("vendors")
}

enum VendorStatus {
  PENDING
  APPROVED
  REJECTED
  SUSPENDED
}

model VendorDocument {
  id        String   @id @default(uuid())
  vendorId  String
  type      DocumentType
  url       String
  verified  Boolean  @default(false)
  createdAt DateTime @default(now())

  vendor Vendor @relation(fields: [vendorId], references: [id], onDelete: Cascade)

  @@map("vendor_documents")
}

enum DocumentType {
  BUSINESS_LICENSE
  TAX_CERTIFICATE
  ID_CARD
  OTHER
}

// Products & Inventory
model Product {
  id          String   @id @default(uuid())
  vendorId    String
  name        String
  description String?  @db.Text
  sku         String?
  categoryId  String?
  price       Decimal  @db.Decimal(10, 2)
  comparePrice Decimal? @db.Decimal(10, 2)
  isActive    Boolean  @default(true)
  isDropship  Boolean  @default(false)
  supplierId  String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime?

  vendor      Vendor   @relation(fields: [vendorId], references: [id])
  category    Category? @relation(fields: [categoryId], references: [id])
  images      ProductImage[]
  variants    ProductVariant[]
  inventory   Inventory?
  orderItems  OrderItem[]
  cartItems   CartItem[]
  reviews     Review[]
  liveSaleProducts LiveSaleProduct[]
  tags        ProductTag[]

  @@index([vendorId])
  @@index([categoryId])
  @@index([isActive])
  @@fulltext([name, description])
  @@map("products")
}

model Category {
  id          String   @id @default(uuid())
  name        String
  slug        String   @unique
  parentId    String?
  image       String?
  order       Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  parent      Category? @relation("CategoryTree", fields: [parentId], references: [id])
  children    Category[] @relation("CategoryTree")
  products    Product[]

  @@index([parentId])
  @@map("categories")
}

model ProductVariant {
  id        String   @id @default(uuid())
  productId String
  name      String   // e.g., "Size: Large", "Color: Red"
  sku       String?
  price     Decimal? @db.Decimal(10, 2)
  createdAt DateTime @default(now())

  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@index([productId])
  @@map("product_variants")
}

model Inventory {
  id              String   @id @default(uuid())
  productId       String   @unique
  quantity        Int      @default(0)
  reservedQuantity Int     @default(0) // Locked during checkout
  lowStockThreshold Int    @default(10)
  updatedAt       DateTime @updatedAt

  product         Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  transactions    InventoryTransaction[]

  @@map("inventory")
}

model InventoryTransaction {
  id          String            @id @default(uuid())
  inventoryId String
  type        TransactionType
  quantity    Int
  reason      String?
  referenceId String? // Order ID, etc.
  createdAt   DateTime          @default(now())

  inventory   Inventory @relation(fields: [inventoryId], references: [id], onDelete: Cascade)

  @@index([inventoryId])
  @@index([referenceId])
  @@map("inventory_transactions")
}

enum TransactionType {
  STOCK_IN
  STOCK_OUT
  RESERVED
  RELEASED
  ADJUSTMENT
}

// Orders & Checkout
model Order {
  id              String      @id @default(uuid())
  orderNumber     String      @unique
  customerId      String
  vendorId        String
  status          OrderStatus @default(PENDING)
  subtotal        Decimal     @db.Decimal(10, 2)
  tax             Decimal     @default(0) @db.Decimal(10, 2)
  shippingFee     Decimal     @default(0) @db.Decimal(10, 2)
  total           Decimal     @db.Decimal(10, 2)
  paymentStatus   PaymentStatus @default(PENDING)
  paymentMethod   PaymentMethodType?
  shippingAddress Address?
  notes           String?     @db.Text
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  cancelledAt     DateTime?

  customer        User        @relation(fields: [customerId], references: [id])
  vendor          Vendor      @relation(fields: [vendorId], references: [id])
  items           OrderItem[]
  payment         Payment?
  delivery        DeliveryJob?
  reviews         Review[]

  @@index([customerId])
  @@index([vendorId])
  @@index([status])
  @@index([orderNumber])
  @@map("orders")
}

enum OrderStatus {
  PENDING
  CONFIRMED
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
  REFUNDED
}

enum PaymentStatus {
  PENDING
  PAID
  FAILED
  REFUNDED
  PARTIALLY_REFUNDED
}

model OrderItem {
  id          String   @id @default(uuid())
  orderId     String
  productId   String
  variantId   String?
  quantity    Int
  price       Decimal  @db.Decimal(10, 2)
  subtotal    Decimal  @db.Decimal(10, 2)
  createdAt   DateTime @default(now())

  order       Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product     Product  @relation(fields: [productId], references: [id])

  @@index([orderId])
  @@index([productId])
  @@map("order_items")
}

model Cart {
  id        String   @id @default(uuid())
  userId    String   @unique
  updatedAt DateTime @updatedAt

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  items     CartItem[]

  @@map("carts")
}

model CartItem {
  id        String   @id @default(uuid())
  cartId    String
  productId String
  variantId String?
  quantity  Int
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  cart      Cart     @relation(fields: [cartId], references: [id], onDelete: Cascade)
  product   Product  @relation(fields: [productId], references: [id])

  @@unique([cartId, productId, variantId])
  @@index([cartId])
  @@map("cart_items")
}

// Payments & Wallets
model Wallet {
  id        String   @id @default(uuid())
  userId    String   @unique
  balance   Decimal  @default(0) @db.Decimal(10, 2)
  currency  String   @default("USD")
  updatedAt DateTime @updatedAt

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  transactions Transaction[]

  @@map("wallets")
}

model Payment {
  id              String          @id @default(uuid())
  orderId         String?         @unique
  amount          Decimal         @db.Decimal(10, 2)
  currency        String          @default("USD")
  method          PaymentMethodType
  status          PaymentStatus   @default(PENDING)
  provider        PaymentProvider
  providerTxId    String?
  providerResponse Json?
  failureReason   String?
  paidAt          DateTime?
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  order           Order?
  transactions    Transaction[]
  refunds         Refund[]

  @@index([orderId])
  @@index([providerTxId])
  @@index([status])
  @@map("payments")
}

enum PaymentMethodType {
  MOBILE_MONEY
  CASH_ON_DELIVERY
  WALLET
  CARD
}

enum PaymentProvider {
  WAAFI
  EDAHAB
  ZAAD
  SAHAL
  EVC_PLUS
  CASH
  INTERNAL
}

model Transaction {
  id          String            @id @default(uuid())
  walletId    String?
  paymentId   String?
  type        TransactionType
  amount      Decimal           @db.Decimal(10, 2)
  balanceBefore Decimal         @db.Decimal(10, 2)
  balanceAfter  Decimal         @db.Decimal(10, 2)
  description String?
  referenceId String?
  createdAt   DateTime          @default(now())

  wallet      Wallet?           @relation(fields: [walletId], references: [id])
  payment     Payment?          @relation(fields: [paymentId], references: [id])

  @@index([walletId])
  @@index([paymentId])
  @@index([type])
  @@map("transactions")
}

enum TransactionType {
  DEPOSIT
  WITHDRAWAL
  PAYMENT
  REFUND
  COMMISSION
  SETTLEMENT
}

model Commission {
  id          String   @id @default(uuid())
  vendorId    String
  orderId     String?
  amount      Decimal  @db.Decimal(10, 2)
  rate        Decimal  @db.Decimal(5, 4) // e.g., 0.1000 for 10%
  status      CommissionStatus @default(PENDING)
  settledAt   DateTime?
  createdAt   DateTime @default(now())

  vendor      Vendor   @relation(fields: [vendorId], references: [id])
  settlement  Settlement?

  @@index([vendorId])
  @@index([status])
  @@map("commissions")
}

enum CommissionStatus {
  PENDING
  SETTLED
  CANCELLED
}

model Settlement {
  id          String   @id @default(uuid())
  vendorId    String
  amount      Decimal  @db.Decimal(10, 2)
  status      SettlementStatus @default(PENDING)
  paidAt      DateTime?
  createdAt   DateTime @default(now())

  vendor      Vendor
  commissions Commission[]

  @@index([vendorId])
  @@index([status])
  @@map("settlements")
}

enum SettlementStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}

model Refund {
  id          String   @id @default(uuid())
  paymentId   String
  amount      Decimal  @db.Decimal(10, 2)
  reason      String?
  status      RefundStatus @default(PENDING)
  processedAt DateTime?
  createdAt   DateTime @default(now())

  payment     Payment  @relation(fields: [paymentId], references: [id])

  @@index([paymentId])
  @@map("refunds")
}

enum RefundStatus {
  PENDING
  PROCESSED
  FAILED
}

// Live Sale Module
model LiveSaleSession {
  id          String   @id @default(uuid())
  hostId      String
  vendorId    String
  title       String
  description String?  @db.Text
  streamUrl   String?
  status      LiveSaleStatus @default(SCHEDULED)
  scheduledAt DateTime?
  startedAt   DateTime?
  endedAt     DateTime?
  viewerCount Int      @default(0)
  totalSales  Decimal  @default(0) @db.Decimal(10, 2)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  host        User     @relation("Host", fields: [hostId], references: [id])
  vendor      Vendor   @relation(fields: [vendorId], references: [id])
  products    LiveSaleProduct[]
  viewers     LiveSaleViewer[]
  chat        LiveSaleChat[]
  analytics   LiveSaleAnalytics?

  @@index([hostId])
  @@index([vendorId])
  @@index([status])
  @@map("live_sale_sessions")
}

enum LiveSaleStatus {
  SCHEDULED
  LIVE
  ENDED
  CANCELLED
}

model LiveSaleProduct {
  id            String   @id @default(uuid())
  sessionId     String
  productId     String
  displayOrder  Int
  isHighlighted Boolean  @default(false)
  specialPrice  Decimal? @db.Decimal(10, 2)
  createdAt     DateTime @default(now())

  session       LiveSaleSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  product       Product         @relation(fields: [productId], references: [id])

  @@index([sessionId])
  @@map("live_sale_products")
}

model LiveSaleViewer {
  id        String   @id @default(uuid())
  sessionId String
  userId    String
  joinedAt  DateTime @default(now())
  leftAt    DateTime?

  session   LiveSaleSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  user      User            @relation(fields: [userId], references: [id])

  @@unique([sessionId, userId])
  @@index([sessionId])
  @@map("live_sale_viewers")
}

model LiveSaleChat {
  id        String   @id @default(uuid())
  sessionId String
  userId    String?
  message   String
  createdAt DateTime @default(now())

  session   LiveSaleSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  @@index([sessionId])
  @@index([createdAt])
  @@map("live_sale_chat")
}

model LiveSaleAnalytics {
  id              String   @id @default(uuid())
  sessionId       String   @unique
  peakViewers     Int
  totalMessages   Int
  totalReactions  Int
  totalPurchases  Int
  conversionRate  Decimal  @db.Decimal(5, 4)
  createdAt       DateTime @default(now())

  session         LiveSaleSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  @@map("live_sale_analytics")
}

// Reviews & Ratings
model Review {
  id        String   @id @default(uuid())
  orderId   String
  productId String
  vendorId  String
  userId    String
  rating    Int      // 1-5
  comment   String?  @db.Text
  isVerified Boolean @default(false)
  helpfulCount Int   @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  order     Order    @relation(fields: [orderId], references: [id])
  product   Product  @relation(fields: [productId], references: [id])
  vendor    Vendor   @relation(fields: [vendorId], references: [id])
  user      User     @relation(fields: [userId], references: [id])
  images    ReviewImage[]
  helpful   ReviewHelpful[]

  @@unique([orderId, userId])
  @@index([productId])
  @@index([vendorId])
  @@map("reviews")
}

model ReviewImage {
  id       String @id @default(uuid())
  reviewId String
  url      String

  review   Review @relation(fields: [reviewId], references: [id], onDelete: Cascade)

  @@map("review_images")
}

model ReviewHelpful {
  id       String @id @default(uuid())
  reviewId String
  userId   String

  review   Review @relation(fields: [reviewId], references: [id], onDelete: Cascade)

  @@unique([reviewId, userId])
  @@map("review_helpful")
}

// Logistics
model DeliveryJob {
  id              String          @id @default(uuid())
  orderId         String?         @unique
  externalRequestId String?
  riderId         String?
  pickupAddress   Address
  deliveryAddress Address
  status          DeliveryStatus  @default(PENDING)
  estimatedTime   Int?            // minutes
  actualTime      Int?
  fee             Decimal         @db.Decimal(10, 2)
  cashCollected   Decimal?        @db.Decimal(10, 2)
  startedAt       DateTime?
  completedAt     DateTime?
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  order           Order?
  rider           Rider?          @relation(fields: [riderId], references: [id])
  route           DeliveryRoute?
  proofs          DeliveryProof[]

  @@index([riderId])
  @@index([status])
  @@map("delivery_jobs")
}

enum DeliveryStatus {
  PENDING
  ASSIGNED
  PICKED_UP
  IN_TRANSIT
  DELIVERED
  FAILED
  CANCELLED
}

model Rider {
  id            String   @id @default(uuid())
  userId        String   @unique
  vehicleType   VehicleType
  vehiclePlate  String?
  licenseNumber String?
  status        RiderStatus @default(INACTIVE)
  rating        Decimal  @default(0) @db.Decimal(3, 2)
  totalDeliveries Int    @default(0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  user          User     @relation(fields: [userId], references: [id])
  deliveries    DeliveryJob[]

  @@map("riders")
}

enum VehicleType {
  MOTORCYCLE
  CAR
  TRUCK
  BICYCLE
}

enum RiderStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
}

model DeliveryRoute {
  id            String   @id @default(uuid())
  deliveryId    String   @unique
  polyline      String?  // Google Maps encoded polyline
  distance      Decimal? @db.Decimal(10, 2) // km
  duration      Int?     // minutes
  createdAt     DateTime @default(now())

  delivery      DeliveryJob @relation(fields: [deliveryId], references: [id], onDelete: Cascade)

  @@map("delivery_routes")
}

model DeliveryProof {
  id          String   @id @default(uuid())
  deliveryId  String
  type        ProofType
  url         String
  createdAt   DateTime @default(now())

  delivery    DeliveryJob @relation(fields: [deliveryId], references: [id], onDelete: Cascade)

  @@map("delivery_proofs")
}

enum ProofType {
  PICKUP_SIGNATURE
  DELIVERY_SIGNATURE
  PHOTO
  RECEIPT
}

model Address {
  id          String   @id @default(uuid())
  userId      String?
  label       String?  // "Home", "Work", etc.
  street      String
  city        String
  state       String?
  postalCode  String?
  country     String   @default("Somaliland")
  latitude    Decimal? @db.Decimal(10, 8)
  longitude   Decimal? @db.Decimal(11, 8)
  isDefault   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user        User?    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("addresses")
}

// Common
model ProductImage {
  id        String   @id @default(uuid())
  productId String
  url       String
  order     Int      @default(0)
  isPrimary Boolean  @default(false)
  createdAt DateTime @default(now())

  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@index([productId])
  @@map("product_images")
}

model ProductTag {
  id        String   @id @default(uuid())
  productId String
  tag       String
  createdAt DateTime @default(now())

  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@index([productId])
  @@index([tag])
  @@map("product_tags")
}

model VendorStorefront {
  id          String   @id @default(uuid())
  vendorId    String   @unique
  banner      String?
  description String?  @db.Text
  theme       Json?    // Custom theme settings
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  vendor      Vendor   @relation(fields: [vendorId], references: [id], onDelete: Cascade)

  @@map("vendor_storefronts")
}
```

### 3.2 Database Design Principles

- **UUIDs**: All primary keys use UUIDs for security and distributed system compatibility
- **Soft Deletes**: Critical entities (User, Product, Order) support soft deletes
- **Audit Fields**: `createdAt`, `updatedAt`, `deletedAt` on all entities
- **Indexes**: Strategic indexes on foreign keys, search fields, and status fields
- **Full-Text Search**: PostgreSQL full-text search on Product name/description
- **Decimal Precision**: All monetary values use `Decimal(10, 2)` for accuracy
- **JSON Fields**: Flexible data stored as JSON (e.g., provider responses, theme settings)

---

## 4. Backend Development Plan

### 4.1 Project Structure

```
fudaydiye-backend/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── common/
│   │   ├── decorators/
│   │   ├── filters/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   ├── pipes/
│   │   └── utils/
│   ├── config/
│   │   ├── database.config.ts
│   │   ├── redis.config.ts
│   │   └── app.config.ts
│   ├── database/
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── migrations/
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/
│   │   │   ├── guards/
│   │   │   └── dto/
│   │   ├── users/
│   │   ├── vendors/
│   │   ├── products/
│   │   ├── orders/
│   │   ├── payments/
│   │   ├── live-sales/
│   │   ├── reviews/
│   │   ├── logistics/
│   │   ├── analytics/
│   │   └── admin/
│   └── shared/
│       ├── entities/
│       └── interfaces/
├── test/
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── nest-cli.json
```

### 4.2 Development Phases

#### Phase 1: Foundation (Week 1-2)
1. **Project Setup**
   - Initialize NestJS project
   - Configure Prisma with PostgreSQL
   - Setup Redis connection
   - Docker configuration
   - Environment variables management
   - ESLint, Prettier, Husky

2. **Core Infrastructure**
   - Global exception filters
   - Response interceptors
   - Validation pipes
   - Logging service
   - Health check endpoints

3. **Auth Module (MVP)**
   - User registration (phone/email)
   - JWT authentication
   - Password hashing (bcrypt)
   - Role-based guards
   - Session management

#### Phase 2: Core Commerce (Week 3-5)
4. **User & Vendor Modules**
   - User profile management
   - Vendor registration & approval workflow
   - Vendor documents upload
   - Storefront configuration

5. **Product & Inventory Module**
   - Product CRUD
   - Category management
   - Inventory tracking
   - Stock locking mechanism
   - Product search (full-text)

6. **Cart & Orders Module**
   - Shopping cart management
   - Checkout flow
   - Order creation
   - Order status workflow

#### Phase 3: Payments & Financials (Week 6-7)
7. **Payments Module**
   - Wallet creation & management
   - Payment gateway integration (stub first, then real)
   - Transaction logging
   - Payment verification

8. **Commission & Settlement**
   - Commission calculation service
   - Settlement processing
   - Financial audit trail

#### Phase 4: Live Sale (Week 8-10)
9. **Live Sale Module**
   - Live session management
   - WebSocket/SSE for real-time chat
   - Product overlay system
   - Click-to-buy integration
   - Inventory locking during live sales
   - Live sale analytics

#### Phase 5: Logistics (Week 11-12)
10. **Logistics Module**
    - Delivery job creation
    - Rider management
    - Google Maps integration
    - Route optimization
    - Real-time tracking (WebSocket)
    - External delivery request handling

#### Phase 6: Reviews & Analytics (Week 13-14)
11. **Reviews Module**
    - Review submission & moderation
    - Rating aggregation
    - Review helpfulness

12. **Analytics Module (Phase 1)**
    - Product recommendations (rule-based)
    - Demand trend analysis
    - Live sale performance metrics
    - Basic fraud detection

#### Phase 7: Admin & Polish (Week 15-16)
13. **Admin Module**
    - Admin dashboard APIs
    - User/vendor management
    - Dispute resolution
    - System configuration

14. **Testing & Documentation**
    - Unit tests (core services)
    - Integration tests (critical flows)
    - API documentation (Swagger)
    - Deployment guides

---

## 5. Sprint Roadmap

### Sprint 1 (Week 1-2): Foundation & Auth
**Goal:** Working authentication system

**Deliverables:**
- ✅ NestJS project initialized
- ✅ Prisma schema (core entities)
- ✅ Database migrations
- ✅ Auth module (register, login, JWT)
- ✅ User management (CRUD)
- ✅ RBAC guards
- ✅ Docker setup

**Acceptance Criteria:**
- Users can register with phone/email
- JWT tokens issued on login
- Role-based access control works
- All endpoints return consistent error format

---

### Sprint 2 (Week 3-4): Vendor & Product Management
**Goal:** Vendors can onboard and list products

**Deliverables:**
- ✅ Vendor registration & approval workflow
- ✅ Vendor document upload
- ✅ Product CRUD (vendor-scoped)
- ✅ Category management
- ✅ Inventory tracking
- ✅ Product search

**Acceptance Criteria:**
- Vendors can register and submit documents
- Admins can approve/reject vendors
- Vendors can create products with images
- Products searchable by name/description
- Inventory updates tracked

---

### Sprint 3 (Week 5-6): Orders & Checkout
**Goal:** Customers can browse and place orders

**Deliverables:**
- ✅ Shopping cart management
- ✅ Checkout flow (multi-step)
- ✅ Order creation
- ✅ Order status workflow
- ✅ Order history

**Acceptance Criteria:**
- Customers can add products to cart
- Checkout process completes orders
- Inventory locked during checkout
- Orders visible to customers and vendors
- Order status updates correctly

---

### Sprint 4 (Week 7-8): Payments & Wallets
**Goal:** Payment processing and wallet management

**Deliverables:**
- ✅ Wallet creation & management
- ✅ Payment gateway integration (stub → real)
- ✅ Transaction logging
- ✅ Commission calculation
- ✅ Settlement processing

**Acceptance Criteria:**
- Wallets created automatically for users
- Payments processed (mobile money stubs)
- Transactions logged with audit trail
- Commissions calculated correctly
- Settlements can be processed

---

### Sprint 5 (Week 9-10): Live Sale Module
**Goal:** Live streaming sales functionality

**Deliverables:**
- ✅ Live session creation & management
- ✅ Real-time chat (WebSocket)
- ✅ Product overlay system
- ✅ Click-to-buy during live sessions
- ✅ Live sale analytics

**Acceptance Criteria:**
- Vendors can create live sale sessions
- Viewers can join and chat in real-time
- Products can be highlighted during stream
- Click-to-buy creates orders instantly
- Analytics track viewer engagement

---

### Sprint 6 (Week 11-12): Logistics Module
**Goal:** Delivery management and tracking

**Deliverables:**
- ✅ Delivery job creation
- ✅ Rider management
- ✅ Google Maps integration
- ✅ Route optimization
- ✅ Real-time tracking
- ✅ External delivery requests

**Acceptance Criteria:**
- Orders automatically create delivery jobs
- Riders can be assigned to deliveries
- Routes calculated using Google Maps
- Real-time tracking updates via WebSocket
- External businesses can request deliveries

---

### Sprint 7 (Week 13-14): Reviews & Analytics
**Goal:** Customer feedback and insights

**Deliverables:**
- ✅ Review submission & moderation
- ✅ Rating aggregation
- ✅ Product recommendations (rule-based)
- ✅ Demand trend analysis
- ✅ Live sale performance metrics

**Acceptance Criteria:**
- Customers can review products after delivery
- Ratings aggregated and displayed
- Recommendations shown on product pages
- Analytics dashboard shows trends
- Live sale metrics tracked

---

### Sprint 8 (Week 15-16): Admin & Production Readiness
**Goal:** Admin tools and production deployment

**Deliverables:**
- ✅ Admin dashboard APIs
- ✅ User/vendor management
- ✅ Dispute resolution
- ✅ System configuration
- ✅ API documentation (Swagger)
- ✅ Unit & integration tests
- ✅ Deployment configuration

**Acceptance Criteria:**
- Admins can manage all entities
- Disputes can be resolved
- System configurable via admin panel
- All APIs documented
- Core services have unit tests
- Application deployable via Docker

---

## 6. API Contracts Overview

### 6.1 API Versioning
All APIs versioned: `/api/v1/*`

### 6.2 Response Format

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": { ... }
  }
}
```

### 6.3 Authentication
- Header: `Authorization: Bearer <JWT_TOKEN>`
- Refresh: `POST /api/v1/auth/refresh` with refresh token

### 6.4 Pagination
- Query params: `?page=1&limit=20`
- Response includes: `meta: { page, limit, total, totalPages }`

### 6.5 Filtering & Sorting
- Filters: `?status=ACTIVE&vendorId=xxx`
- Sorting: `?sortBy=createdAt&sortOrder=DESC`

---

## 7. Integration Points

### 7.1 External Services

**Mobile Money APIs:**
- Waafi, eDahab, ZAAD, Sahal, EVC Plus
- Strategy: Adapter pattern for each provider
- Fallback: Queue failed payments for retry

**Google Maps API:**
- Geocoding: Address → coordinates
- Directions: Route calculation
- Distance Matrix: Multi-point routing

**Streaming Service:**
- WebRTC (preferred) or RTMP
- CDN integration for scalability
- Stream URL generation per session

### 7.2 Internal Event System

**Redis Pub/Sub Events:**
- `order.created` → Trigger delivery job
- `payment.completed` → Update order status
- `inventory.locked` → Reserve stock
- `live-sale.started` → Notify subscribers

**Queue Jobs (BullMQ):**
- Email/SMS notifications
- Image processing
- Analytics aggregation
- Settlement processing

---

## 8. Risk Assessment

### 8.1 Technical Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Payment gateway failures | High | Retry queue, fallback to COD |
| Inventory race conditions | High | Database-level locking, transactions |
| Live sale stream failures | Medium | Graceful degradation, fallback UI |
| Google Maps API limits | Medium | Caching, batch requests |
| Database performance | Medium | Indexing, query optimization, read replicas |

### 8.2 Business Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Vendor fraud | High | Document verification, approval workflow |
| Payment disputes | High | Audit trail, dispute resolution system |
| Inventory discrepancies | Medium | Real-time sync, reconciliation jobs |
| Scalability concerns | Medium | Horizontal scaling, caching strategy |

### 8.3 Security Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| JWT token theft | High | Short expiry, refresh tokens, HTTPS only |
| SQL injection | High | Prisma ORM (parameterized queries) |
| XSS attacks | Medium | Input sanitization, CSP headers |
| Rate limiting bypass | Medium | Multiple layers (API Gateway + app-level) |

---

## 9. Next Steps

1. **Review & Approval**: Review this architecture document
2. **Clarifications**: Address any questions or concerns
3. **Sprint 1 Kickoff**: Begin foundation setup
4. **Daily Standups**: Track progress against roadmap
5. **Iterative Refinement**: Adjust plan based on learnings

---

**Document Status:** Ready for Review  
**Next Action:** Await approval to proceed with Sprint 1

