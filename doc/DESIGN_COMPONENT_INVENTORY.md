# Fudaydiye — Component Inventory (Atoms → Molecules → Organisms)

Purpose: derive a reusable Flutter component library from the provided UI screens. Follow design system: primary #00dc82, secondary #005653, `Lugfa` typography, light mode, card-based layout, large touch targets, subtle animations.

---

## Atoms
- Colors
  - Primary: #00dc82
  - Secondary: #005653
  - Surface, Background, On-surface, Error (material tokens)
- Typography
  - Font family: Lugfa
  - Sizes: Display / H1..H6 / Body / Caption / Button
- Icons
  - Action icons (back, search, cart, wallet, live, play)
  - Status icons (check, clock, warning, location)
- Buttons
  - Primary CTA (filled, rounded, prominent)
  - Secondary CTA (outlined)
  - Icon button (circular)
- Text inputs
  - Single-line input with label & helper/error text
  - Multiline input
- Chips / Tags
  - Category chip
  - Badge (small count)
- Avatars
  - Small/Medium/Large
- Dividers / Spacers
- Skeleton loaders / shimmer
- Badges (live, new, sold-out)

## Molecules
- Product Card
  - Image, title, short vendor line, price, badge(s), CTA
- Vendor Tile
  - Avatar, name, trust badge, ratings summary
- Price Row
  - Price, original price (muted), discount badge
- Rating Widget
  - Star row + numeric value
- Location Picker Row
  - Current location label + change action
- Bottom Navigation Bar (icons + labels)
- Search Bar with suggestions
- Filter Row (chips + modal trigger)
- Cart Summary Bubble (floating) with total & quick-checkout
- Live Product Overlay
  - Small product card pinned over video with Buy CTA
- Payment Method Row
  - Icon, method name, masked details
- Order Timeline Row
  - Status dot + label + timestamp
- Map Pin + Mini Info Card
- Rider Job Tile
  - Pickup/dropoff short, ETA, action buttons

## Organisms
- Home Feed Card Group
  - Mixed product cards, live session promos, recommendation strip
- Category Grid with Filter Sidebar (responsive)
- Product Detail Header
  - Gallery, vendor info, price row, live/same-day badges
- Checkout Form
  - Address, payment method, delivery options, CTA
- Live Session View
  - Video container, chat column, live product tray (horizontal), buy flow
- Live Session Lobby
  - Host info, start time, join button
- Cart Screen
  - Items list, promo input, totals, checkout CTA
- Vendor Dashboard Header
  - KPI cards (orders, revenue, live sales), Start Live CTA
- Rider Job List + Map Split View
- Admin Overview Panel (cards + charts)

## Templates (pages composed from organisms)
- Customer Home (Home Feed + Bottom Nav)
- Category/Product List (filters + product grid)
- Product Details (Product Detail Header + Reviews + Similar)
- Cart & Checkout (Cart Screen + Checkout Form)
- Live Feed (Feed of Live Sessions) → Live Session View
- Vendor Product Management (list + CRUD modals)
- Rider App Home (Job List) → Navigation View
- Admin Dashboard (overview + quick actions)

## Screen-to-Component Mapping (selected)
- `customer_home/` → Home Feed Card Group, Search Bar, Bottom Nav
- `cart_&_checkout_flow/` → Cart Summary Bubble, Checkout Form, Payment Method Row
- `product_detail_view/` & `product_details_view/` → Product Detail Header, Rating Widget, Vendor Tile
- `live_sale_feed_1/` & `live_sale_feed_2/` → Live promo cards, Live Product Overlay
- `in-stream_checkout_modal/` → Live Product Overlay, Payment Method Row
- `rider_job_assignment_list/` & `rider_navigation_view/` → Rider Job Tile, Map Pin + Mini Info Card
- `vendor_dashboard_1/` → KPI cards, Vendor Tile, Start Live CTA
- `ratings_&_reviews/` → Rating Widget, Review List Item molecule
- `wallet_&_rewards/` → Wallet balance card, Rewards list

## Accessibility & Interaction Notes
- Touch targets >= 48dp
- High contrast for text over images (apply scrim on product images)
- Provide content placeholders for low-bandwidth (skeleton + retry)
- All forms must support offline queueing (local persistence + sync)

## Animation/Motion Guidelines
- Durations: 150ms (micro) — 300ms (navigations)
- Use fade + translate for content entrance; scale for button taps
- Shimmer for loading product lists

## Suggested Flutter Structure (for components)
lib/
 ├── core/
 │   ├── theme/
 │   │   ├── colors.dart
 │   │   ├── typography.dart
 │   │   └── app_theme.dart
 │   ├── widgets/atoms/
 │   ├── widgets/molecules/
 │   └── widgets/organisms/
 ├── features/
 │   ├── home/
 │   ├── product/
 │   ├── checkout/
 │   └── live/

---

## Next steps
1. Convert these component descriptions into real Flutter widgets (start with `core/theme` and `atoms/button`, `atoms/text`, `molecules/product_card`).
2. Scaffold the project skeleton and add `Lugfa` font assets.
3. Implement the `PrimaryButton`, `ProductCard`, and `BottomNav` and wire a mock Home screen.

(See `SPRINT_4_SUMMARY.md` → `SPRINT_8_SUMMARY.md` for sprint-specific behaviors and constraints.)
