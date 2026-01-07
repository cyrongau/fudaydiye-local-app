
# Fudaydiye Mobile Deployment Guide (Capacitor)

This guide details the "Wrapper" approach to convert the Fudaydiye web app into native iOS and Android applications.

## 1. Prerequisites
- **Node.js** installed on your machine.
- **Xcode** (for iOS builds - requires macOS).
- **Android Studio** (for Android builds).

## 2. Reflected Changes Workflow
Any changes made to the React source code will automatically be reflected in the mobile apps after a sync:
1. **Develop**: Edit `.tsx` or CSS files.
2. **Build**: `npm run build` (Updates the `dist` folder).
3. **Sync**: `npx cap sync` (Pushes `dist` to iOS/Android native projects).
4. **Deploy**: Hit "Run" in Xcode or Android Studio.

## 3. Native Design Requirements
To maintain a high-quality app rating, ensure the following native patterns are followed:

### Ergonomics
- **No Hover**: Do not rely on `:hover` for critical information.
- **Touch Targets**: All buttons should be at least 44x44px.
- **Active States**: Use `active:opacity-70` or `active:scale-95` on all touchables.

### Scrolling
- Use `.scroll-container` class for any scrollable areas to ensure momentum scrolling.
- Body scrolling is disabled to prevent browser "rubber-banding."

### Native Bridge Features
- **Haptics**: Use the Capacitor Haptics plugin for feedback on success/error.
- **Status Bar**: Colors are managed via `capacitor.config.ts`.
- **Safe Areas**: Use `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)` to avoid notches and home indicators.
