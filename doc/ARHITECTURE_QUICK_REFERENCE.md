# Fudaydiye Architecture - Quick Reference

## System Overview
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Frontend**: React + Tailwind CSS
- **Mobile Wrapper**: Capacitor (Native iOS/Android Bridge)
- **Architecture**: Real-time Document Mesh

## Core Modules (11 Total)
1. **Auth & User Management** - Firebase Auth + RBAC
2. **Multi-Vendor Marketplace** - Real-time Catalog & Directories
3. **Product & Inventory** - Atomic Stock Logic
4. **Orders & Checkout** - Direct API Payment Tunnels (ZAAD/eDahab)
5. **Payments & Wallets** - Financial Ledger & Escrow
6. **Live Sale** - Video Mesh (Agora/LiveKit) + Social HUD
7. **Ratings & Reviews** - Verified Consensus Nodes
8. **Logistics** - Real-time GPS Fleet Control
9. **AI & Analytics** - Gemini 3 Flash Strategist
10. **CMS Terminal** - Dynamic App Content
11. **Admin Console** - Governance & Moderation

## Mobile Deployment (Xcode & Android Studio)
- **Wrapper**: Capacitor 6.0+
- **iOS Target**: Xcode Proj (Swift)
- **Android Target**: Android Studio Proj (Kotlin)
- **Hardware Bridge**: Capacitor Plugins for Camera, Geolocation, and Push Notifications.

## Database Principles
- Real-time Listeners (onSnapshot)
- Atomic Increments (FieldValue)
- Multi-collection Transactions
- Offline Persistence (IndexedDB/Native SQLite)

## Sprint Status
- **Milestone 1-4**: Core Experience & Shell [COMPLETED]
- **Milestone 5-6**: Financial Mesh & Video Sync [IN PROGRESS]
- **Milestone 7-8**: Mobile Wrapping & Optimization [UPCOMING]
