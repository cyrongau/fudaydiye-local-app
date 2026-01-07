# Architecture & UI/UX Summary — Key Constraints, Assumptions, and Risks

Purpose: concise reference for engineering decisions and next actions.

## High-level constraints
- Technology: NestJS (TypeScript) backend; Flutter front-end (mobile-first). PostgreSQL + Redis on backend.
- Architecture: Domain-driven modules, event-driven patterns, API base `/api/v1/*`, JWT auth + RBAC.
- Data models: UUIDs for primary keys; Decimal(10,2) for monetary fields; soft deletes where applicable.
- Security: No card storage (Stripe); HMAC webhook verification; audit trails and immutable transactions for payments.
- UX constraints: `Lugfa` font, primary #00dc82, secondary #005653, light mode, card-based layout, 8px spacing system, large touch targets, fast/subtle animations.

## Assumptions
- Riverpod is acceptable as state-management; back-end APIs follow prescribed endpoints and pagination.
- Live Sale streaming will use WebRTC/RTMP with provider-abstraction; real provider selection and credentials will occur in infra sprints.
- Mobile money providers (Waafi, ZAAD, Sahal, EVC Plus, eDahab) must be integrated server-side; placeholder implementations exist.
- Google Maps (routing/geocoding) used for logistics; route optimization and advanced GPS features are out-of-scope in initial sprints.
- Low-bandwidth environments heavily influence UI decisions and streaming fallbacks.

## Major risks & mitigations
- Provider integration delays (mobile money, Stripe, streaming): treat as explicit dependencies and mock providers for frontend/back-end tests; track as high-priority tasks.
- Live Sale scale & concurrency: requires load testing and event-driven design for chat/order handling; add stress tests and queue-based order processing.
- Fraud and trust concerns (reviews, refunds, disputes): implement rule-based heuristics in early sprints and ensure admin review workflows; log and expose flags with explainable reasons.
- Data consistency during high concurrency (inventory locking, payments): use DB transactions and inventory reserve/unreserve flows; add end-to-end tests simulating race conditions.
- Font & asset licensing (Lugfa): include placeholders and document license acquisition steps; do not commit font binaries without license confirmation.

## Actionable short-term items
1. Create an `API Contracts` directory with OpenAPI/Swagger stubs for Products, Cart/Checkout, Payments, Orders, and LiveSale minimal endpoints.
2. Complete frontend design system (fonts, colors, atoms) and add CI job to run Flutter tests.
3. Implement mocked provider stubs for payments and streaming to avoid blocking UI development.
4. Add a `SECURITY_CHECKLIST.md` and `.env.example` with required secrets (do not include secrets in repo).
5. Schedule load testing for LiveSale + Orders once integration points are ready.

## Notes / References
- See `SPRINT_4_SUMMARY.md` → `SPRINT_8_SUMMARY.md` for feature-level constraints and acceptance criteria.
- Refer to `DESIGN_COMPONENT_INVENTORY.md` for componentization guidance.

---

Next step: I can generate OpenAPI stubs for the core frontend flows (Products, Cart, Checkout, Payments) and add them to `frontend/api/` as mockable JSON/YAML files; confirm if you want OpenAPI or simpler JSON contract stubs.
