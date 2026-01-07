# Fudaydiye Web & Mobile Wrapper UI/UX Design

## 1. Native Integration (Capacitor)
When wrapped for mobile, the application must behave like a native inhabitant of the OS.

### Safe Areas
- **Top Inset**: The DashboardHeader must account for the iPhone "Notch" or Android status bar using CSS `env(safe-area-inset-top)`.
- **Bottom Inset**: The BottomNav must float above the iOS "Home Indicator" using `env(safe-area-inset-bottom)`.

### Touch & Feedback
- **Active States**: Mobile users expect immediate visual feedback. Every button uses `active:scale-95` to simulate physical compression.
- **Haptics**: Integration with `@capacitor/haptics` is used for successful "Scan" and "Payment Confirmed" events.

## 2. Visual Themes
- **Primary**: #06DC7F (Fudaydiye Green)
- **Secondary**: #015754 (Deep Teal)
- **Mobile Background**: Backgrounds in the mobile app are 5% darker than the web version to increase contrast on OLED screens.

## 3. Asset Loading
- **Shimmer Effects**: Essential for mobile 4G/5G connections to prevent the UI from feeling broken during data fetches.
- **Local Caching**: Image assets and fonts are cached locally by the Capacitor wrapper to ensure 0ms load time for the shell.

## 4. Responsive Breakpoints
- **Mobile (Wrapper)**: 0px - 768px (Strict 1-column layout for products)
- **Tablet**: 768px - 1024px (2-column layout)
- **Desktop (Management)**: 1024px+ (Full sidebar and 12-column grid)