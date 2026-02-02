
import React, { useState, createContext, useContext, ReactNode, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth'; // Might be unused now in App.tsx but checked later.
import { doc, onSnapshot, setDoc, getDoc, serverTimestamp, updateDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore'; // Check usage
import { auth, db } from './lib/firebase';
import { Providers, useAuth } from './Providers';
import { UserRole, CartItem, UserProfile, CartNode } from './types';

import Navbar from './components/Navbar';
import DashboardHeader from './components/DashboardHeader';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import BottomNav from './components/BottomNav';
import LocationTracker from './components/LocationTracker';
import PullToRefresh from './components/PullToRefresh';
import { usePlatform } from './hooks/usePlatform';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { api } from './src/services/api';

import Login from './views/Login';
import Register from './views/Register';
import ForgotPassword from './views/ForgotPassword';

import MobileMenu from './views/MobileMenu';
import CustomerHome from './views/CustomerHome';
import CustomerExplore from './views/CustomerExplore';
import CustomerOrders from './views/CustomerOrders';
import CategoryProductList from './views/CategoryProductList';
import ProductDetails from './views/ProductDetails';
import VendorDashboard from './views/VendorDashboard';
import VendorAnalytics from './views/VendorAnalytics';
import VendorEarnings from './views/VendorEarnings';
import VendorInventoryStatus from './views/VendorInventoryStatus';
import VendorProductManagement from './views/VendorProductManagement';
import VendorProductImport from './views/VendorProductImport';
import VendorOrderFulfillment from './views/VendorOrderFulfillment';
import VendorReviews from './views/VendorReviews';

import AdminLogisticsSettings from './views/AdminLogisticsSettings';
import VendorStoreManagement from './views/VendorStoreManagement';
import VendorStoreUsers from './views/VendorStoreUsers';
import VendorLiveSaleSetup from './views/VendorLiveSaleSetup';
import VendorLiveSessions from './views/VendorLiveSessions';
import LiveStream from './views/LiveStream';
import RiderJobs from './views/RiderJobs';
import RiderHome from './views/RiderHome'; // NEW
import RiderTracking from './views/RiderTracking'; // NEW
import RiderJobAssignmentList from './views/RiderJobAssignmentList';
import RiderPickupConfirmation from './views/RiderPickupConfirmation';
import RiderDeliveryConfirmation from './views/RiderDeliveryConfirmation';
import RiderStatusUpdates from './views/RiderStatusUpdates';
import RiderWallet from './views/RiderWallet';
import RiderNavigationView from './views/RiderNavigationView';
import PaymentConfirmation from './views/PaymentConfirmation';

import ClientAnalytics from './views/ClientAnalytics';
import ClientInvoices from './views/ClientInvoices';
import ClientSupport from './views/ClientSupport';
import AdminPlatformOverview from './views/AdminPlatformOverview';
import AdminFinancialReports from './views/AdminFinancialReports';
import AdminVendorManagement from './views/AdminVendorManagement';
import AdminVendorProfile from './views/AdminVendorProfile';
import AdminRiderManagement from './views/AdminRiderManagement';
import AdminRiderProfile from './views/AdminRiderProfile';
import AdminLogisticsControl from './views/AdminLogisticsControl';
import AdminDispatchConsole from './views/AdminDispatchConsole';
import AdminAudits from './views/AdminAudits';
import AdminLiveSaleModeration from './views/AdminLiveSaleModeration';
import AdminHubs from './views/AdminHubs';
import AdminSystemReport from './views/AdminSystemReport';
import AdminConfig from './views/AdminConfig';
import AdminCategoryManagement from './views/AdminCategoryManagement';
import UserSettings from './views/UserSettings';
import PersonalInfo from './views/PersonalInfo';
import SavedAddresses from './views/SavedAddresses';
import LinkedPayments from './views/LinkedPayments';
import ErrorBoundary from './components/ErrorBoundary';
import Cart from './views/Cart';
import Checkout from './views/Checkout';
import TrackingMap from './views/TrackingMap';
import Profile from './views/Profile';
import Wishlist from './views/Wishlist';
import AdminCMSDashboard from './views/AdminCMSDashboard';
import AdminCMSEditor from './views/AdminCMSEditor';
import AdminAbandonmentReport from './views/AdminAbandonmentReport';
import PublicCMSPage from './views/PublicCMSPage';
import BlogList from './views/BlogList';
import BlogPostDetail from './views/BlogPostDetail';
import FaqPage from './views/FaqPage';
import AboutUs from './views/AboutUs';
import NewArrivals from './views/NewArrivals';
import VendorShop from './views/VendorShop';
import VendorList from './views/VendorList';
import GlobalScanView from './views/GlobalScanView';
import VendorLiveCockpit from './views/VendorLiveCockpit';
import ContactUs from './views/ContactUs';
import WalletView from './views/WalletView';
import ScrollToTop from './components/ScrollToTop';
import { ToastProvider } from './components/Toast'; // Restore ToastProvider
import { ModalProvider } from './components/ModalProvider'; // Keep ModalProvider
import Onboarding from './views/Onboarding';
import SeedView from './views/SeedView';
import AdminShippingSettings from './views/AdminShippingSettings';

const RootRedirect: React.FC = () => {
  const hasOnboarded = localStorage.getItem('fddy_onboarding_completed');
  const isNative = Capacitor.isNativePlatform();

  if (isNative && !hasOnboarded) {
    return <Navigate to="/onboarding" replace />;
  }
  return <CustomerHome />;
};

const ProtectedRoute: React.FC<{ children: ReactNode; allowedRoles?: UserRole[] }> = ({ children, allowedRoles }) => {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-background-light dark:bg-background-dark">
      <div className="size-14 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
    </div>
  );

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to="/customer" replace />;
  }

  return <>{children}</>;
};

const MainLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const isAuthPage = ['/login', '/register'].includes(location.pathname);

  const isDashboardRoute = location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/vendor') ||
    location.pathname.startsWith('/rider') ||
    location.pathname.startsWith('/client');

  const isOnboarding = location.pathname === '/onboarding';
  const isLiveRoute = location.pathname.includes('/customer/live/') || location.pathname.includes('/vendor/live-cockpit/');

  // If onboarding or live stream, render children directly without layout wrapper for full immersion
  if (isOnboarding || isLiveRoute) {
    return <>{children}</>;
  }

  // CORE FIX: Prevent "Home Flash" before Onboarding
  // If we are native and haven't onboarded, redirect immediately BEFORE rendering the shell (Navbar/Sidebar)
  const isNative = Capacitor.isNativePlatform();
  const hasOnboarded = localStorage.getItem('fddy_onboarding_completed');
  if (isNative && !hasOnboarded && location.pathname === '/') {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-300">
      {/* Top Navigation: Standard for Web */}
      {!isAuthPage && (isDashboardRoute ? <DashboardHeader /> : <Navbar />)}

      <div className="flex flex-1 w-full mx-auto overflow-hidden">
        {isDashboardRoute && !isAuthPage && (
          <Sidebar
            isCollapsed={isSidebarCollapsed}
            onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />
        )}

        <main className={`flex-1 overflow-y-auto no-scrollbar pb-24 md:pb-0 transition-all duration-500 ${isDashboardRoute && !isAuthPage ? 'bg-gray-50/30 dark:bg-black/10' : ''}`}>
          <PullToRefresh>
            <div className={`${(isDashboardRoute && !isAuthPage && !location.pathname.startsWith('/rider')) ? 'p-6 lg:p-10' : ''}`}>
              {children}
            </div>
            {/* Footer on Web, hidden on Dashboard */}
            {!isAuthPage && !isDashboardRoute && <Footer />}
          </PullToRefresh>
        </main>
      </div>

      {/* Web Mobile Bottom Nav (for mobile browsers, not native app if using isNative check correctly) */}
      {/* Web Mobile Bottom Nav (for mobile browsers, not native app if using isNative check correctly) */}
      <div className="md:hidden">
        {!isAuthPage && !location.pathname.startsWith('/rider') && <BottomNav />}
      </div>
    </div>
  );
};

// Main Layout Switcher
const Layout: React.FC<{ children: ReactNode }> = ({ children }) => {
  // We now use the WebLayout (Responsive PWA) for everything.
  // The 'isNative' check is no longer used to switch layouts, 
  // but the usePlatform hook is still useful for CSS classes (.native-app).
  usePlatform();

  return <MainLayout>{children}</MainLayout>;
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Providers>
        <ToastProvider>
          <ModalProvider>
            <Router>
              <ScrollToTop />
              <Toaster position="top-center" toastOptions={{
                style: {
                  background: '#333',
                  color: '#fff',
                  fontFamily: 'Plus Jakarta Sans',
                  fontSize: '12px',
                  fontWeight: 'bold',
                }
              }} />
              <Layout>
                <AppRoutes />
              </Layout>
            </Router>
          </ModalProvider>
        </ToastProvider>
      </Providers>
    </ErrorBoundary>
  );
};


const AppRoutes: React.FC = () => {
  const { loading } = useAuth();
  if (loading) return null;

  return (
    <>
      <SystemPermissions />
      <LocationTracker />
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/seed" element={<SeedView />} />
        <Route path="/" element={<RootRedirect />} />
        <Route path="/mobile-menu" element={<MobileMenu />} />

        <Route path="/login" element={<Login onLogin={() => { }} setAppRole={() => { }} />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/register" element={<Register onRegister={() => { }} setAppRole={() => { }} />} />
        <Route path="/customer" element={<CustomerHome />} />
        <Route path="/customer/explore" element={<CustomerExplore />} />
        <Route path="/customer/new-arrivals" element={<NewArrivals />} />
        <Route path="/customer/vendors" element={<VendorList />} />
        <Route path="/customer/category/:category" element={<CategoryProductList />} />
        <Route path="/customer/product/:id" element={<ProductDetails />} />
        <Route path="/customer/vendor/:vendorId" element={<VendorShop />} />
        <Route path="/customer/cart" element={<Cart isAuthenticated={true} />} />
        <Route path="/customer/orders" element={<ProtectedRoute allowedRoles={['CUSTOMER', 'GUEST']}><CustomerOrders /></ProtectedRoute>} />
        <Route path="/customer/checkout" element={<Checkout isAuthenticated={true} />} />
        <Route path="/customer/profile" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><Profile isAuthenticated={true} /></ProtectedRoute>} />
        <Route path="/customer/wishlist" element={<ProtectedRoute allowedRoles={['CUSTOMER', 'GUEST']}><Wishlist /></ProtectedRoute>} />
        <Route path="/customer/track/:id" element={<ProtectedRoute allowedRoles={['CUSTOMER', 'VENDOR', 'GUEST']}><TrackingMap /></ProtectedRoute>} />
        <Route path="/customer/live/:id" element={<LiveStream />} />
        <Route path="/customer/personal-info" element={<ProtectedRoute allowedRoles={['CUSTOMER', 'VENDOR', 'RIDER', 'CLIENT', 'ADMIN', 'FUDAYDIYE_ADMIN']}><PersonalInfo /></ProtectedRoute>} />
        <Route path="/customer/addresses" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><SavedAddresses /></ProtectedRoute>} />
        <Route path="/customer/payments" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><LinkedPayments /></ProtectedRoute>} />
        <Route path="/customer/scan" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><GlobalScanView role="CUSTOMER" /></ProtectedRoute>} />
        <Route path="/customer/pay-confirm" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><PaymentConfirmation /></ProtectedRoute>} />

        <Route path="/about" element={<AboutUs />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/privacy" element={<PublicCMSPage slug="privacy-policy" />} />
        <Route path="/terms" element={<PublicCMSPage slug="terms-of-service" />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/blog" element={<BlogList />} />
        <Route path="/blog/:slug" element={<BlogPostDetail />} />

        <Route path="/admin/cms" element={<ProtectedRoute allowedRoles={['ADMIN', 'FUDAYDIYE_ADMIN', 'SUPER_ADMIN']}><AdminCMSDashboard /></ProtectedRoute>} />
        <Route path="/admin/cms/edit/:type/:id" element={<ProtectedRoute allowedRoles={['ADMIN', 'FUDAYDIYE_ADMIN', 'SUPER_ADMIN']}><AdminCMSEditor /></ProtectedRoute>} />
        <Route path="/admin/cms/create/:type" element={<ProtectedRoute allowedRoles={['ADMIN', 'FUDAYDIYE_ADMIN', 'SUPER_ADMIN']}><AdminCMSEditor /></ProtectedRoute>} />
        <Route path="/admin/abandonment" element={<ProtectedRoute allowedRoles={['ADMIN', 'FUDAYDIYE_ADMIN', 'SUPER_ADMIN']}><AdminAbandonmentReport /></ProtectedRoute>} />
        <Route path="/admin/config" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']}><AdminConfig /></ProtectedRoute>} />
        <Route path="/admin/categories" element={<ProtectedRoute allowedRoles={['ADMIN', 'FUDAYDIYE_ADMIN', 'SUPER_ADMIN']}><AdminCategoryManagement /></ProtectedRoute>} />

        <Route path="/vendor" element={<ProtectedRoute allowedRoles={['VENDOR', 'FUDAYDIYE_ADMIN']}><VendorDashboard /></ProtectedRoute>} />
        <Route path="/vendor/management" element={<ProtectedRoute allowedRoles={['VENDOR', 'FUDAYDIYE_ADMIN']}><VendorProductManagement /></ProtectedRoute>} />
        <Route path="/vendor/import" element={<ProtectedRoute allowedRoles={['VENDOR', 'FUDAYDIYE_ADMIN']}><VendorProductImport /></ProtectedRoute>} />
        <Route path="/vendor/orders" element={<ProtectedRoute allowedRoles={['VENDOR', 'FUDAYDIYE_ADMIN']}><VendorOrderFulfillment /></ProtectedRoute>} />
        <Route path="/vendor/inventory" element={<ProtectedRoute allowedRoles={['VENDOR', 'FUDAYDIYE_ADMIN']}><VendorInventoryStatus /></ProtectedRoute>} />
        <Route path="/vendor/earnings" element={<ProtectedRoute allowedRoles={['VENDOR', 'FUDAYDIYE_ADMIN']}><VendorEarnings /></ProtectedRoute>} />
        <Route path="/vendor/analytics" element={<ProtectedRoute allowedRoles={['VENDOR', 'FUDAYDIYE_ADMIN']}><VendorAnalytics /></ProtectedRoute>} />
        <Route path="/vendor/reviews" element={<ProtectedRoute allowedRoles={['VENDOR', 'FUDAYDIYE_ADMIN']}><VendorReviews /></ProtectedRoute>} />
        <Route path="/vendor/stores" element={<ProtectedRoute allowedRoles={['VENDOR', 'FUDAYDIYE_ADMIN']}><VendorStoreManagement /></ProtectedRoute>} />
        <Route path="/vendor/staff" element={<ProtectedRoute allowedRoles={['VENDOR', 'FUDAYDIYE_ADMIN']}><VendorStoreUsers /></ProtectedRoute>} />
        <Route path="/vendor/live-sessions" element={<ProtectedRoute allowedRoles={['VENDOR', 'FUDAYDIYE_ADMIN']}><VendorLiveSessions /></ProtectedRoute>} />
        <Route path="/vendor/live-setup" element={<ProtectedRoute allowedRoles={['VENDOR', 'FUDAYDIYE_ADMIN']}><VendorLiveSaleSetup /></ProtectedRoute>} />
        <Route path="/vendor/live-cockpit/:id" element={<ProtectedRoute allowedRoles={['VENDOR', 'FUDAYDIYE_ADMIN']}><VendorLiveCockpit /></ProtectedRoute>} />
        <Route path="/vendor/abandonment" element={<ProtectedRoute allowedRoles={['VENDOR', 'FUDAYDIYE_ADMIN']}><AdminAbandonmentReport /></ProtectedRoute>} />
        <Route path="/vendor/settings" element={<ProtectedRoute allowedRoles={['VENDOR', 'FUDAYDIYE_ADMIN']}><UserSettings /></ProtectedRoute>} />
        <Route path="/vendor/scan" element={<ProtectedRoute allowedRoles={['VENDOR', 'FUDAYDIYE_ADMIN']}><GlobalScanView role="VENDOR" /></ProtectedRoute>} />

        <Route path="/rider" element={<ProtectedRoute allowedRoles={['RIDER']}><RiderHome /></ProtectedRoute>} />
        <Route path="/rider/assignments" element={<ProtectedRoute allowedRoles={['RIDER']}><RiderJobs /></ProtectedRoute>} />
        <Route path="/rider/pickup/:id" element={<ProtectedRoute allowedRoles={['RIDER']}><RiderPickupConfirmation /></ProtectedRoute>} />
        <Route path="/rider/confirm/:id" element={<ProtectedRoute allowedRoles={['RIDER']}><RiderDeliveryConfirmation /></ProtectedRoute>} />
        <Route path="/rider/status" element={<ProtectedRoute allowedRoles={['RIDER']}><RiderStatusUpdates /></ProtectedRoute>} />
        <Route path="/rider/wallet" element={<ProtectedRoute allowedRoles={['RIDER']}><RiderWallet /></ProtectedRoute>} />
        <Route path="/rider/navigate/:id" element={<ProtectedRoute allowedRoles={['RIDER']}><RiderTracking /></ProtectedRoute>} />
        <Route path="/rider/settings" element={<ProtectedRoute allowedRoles={['RIDER']}><UserSettings /></ProtectedRoute>} />
        <Route path="/rider/scan" element={<ProtectedRoute allowedRoles={['RIDER']}><GlobalScanView role="RIDER" /></ProtectedRoute>} />
        {/* Reusing RiderWallet path but pointing to new component or keeping separate? User asked for WalletView */}
        {/* Actually, RiderWallet existed in line 46 imports, let's replace it or add new general wallet route */}
        <Route path="/wallet" element={<ProtectedRoute allowedRoles={['VENDOR', 'RIDER', 'CLIENT']}><WalletView /></ProtectedRoute>} />


        {/* Client Routes */}
        <Route path="/client/analytics" element={<ProtectedRoute allowedRoles={['CLIENT']}><ClientAnalytics /></ProtectedRoute>} />
        <Route path="/client/invoices" element={<ProtectedRoute allowedRoles={['CLIENT']}><ClientInvoices /></ProtectedRoute>} />
        <Route path="/client/support" element={<ProtectedRoute allowedRoles={['CLIENT']}><ClientSupport /></ProtectedRoute>} />
        <Route path="/client/settings" element={<ProtectedRoute allowedRoles={['CLIENT']}><UserSettings /></ProtectedRoute>} />

        <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN', 'FUDAYDIYE_ADMIN', 'SUPER_ADMIN']}><AdminPlatformOverview /></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={['ADMIN', 'FUDAYDIYE_ADMIN', 'SUPER_ADMIN']}><AdminFinancialReports /></ProtectedRoute>} />
        <Route path="/admin/report" element={<ProtectedRoute allowedRoles={['ADMIN', 'FUDAYDIYE_ADMIN', 'SUPER_ADMIN']}><AdminSystemReport /></ProtectedRoute>} />
        <Route path="/admin/shipping" element={<ProtectedRoute allowedRoles={['ADMIN', 'FUDAYDIYE_ADMIN', 'SUPER_ADMIN']}><AdminShippingSettings /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['ADMIN', 'FUDAYDIYE_ADMIN', 'SUPER_ADMIN']}><AdminVendorManagement /></ProtectedRoute>} />
        <Route path="/admin/vendor/:id" element={<ProtectedRoute allowedRoles={['ADMIN', 'FUDAYDIYE_ADMIN', 'SUPER_ADMIN']}><AdminVendorProfile /></ProtectedRoute>} />
        <Route path="/admin/riders" element={<ProtectedRoute allowedRoles={['ADMIN', 'FUDAYDIYE_ADMIN', 'SUPER_ADMIN']}><AdminRiderManagement /></ProtectedRoute>} />
        <Route path="/admin/rider/:id" element={<ProtectedRoute allowedRoles={['ADMIN', 'FUDAYDIYE_ADMIN', 'SUPER_ADMIN']}><AdminRiderProfile /></ProtectedRoute>} />
        <Route path="/admin/logistics" element={<ProtectedRoute allowedRoles={['ADMIN', 'FUDAYDIYE_ADMIN', 'SUPER_ADMIN']}><AdminLogisticsControl /></ProtectedRoute>} />
        <Route path="/admin/dispatch" element={<ProtectedRoute allowedRoles={['ADMIN', 'FUDAYDIYE_ADMIN', 'SUPER_ADMIN']}><AdminDispatchConsole /></ProtectedRoute>} />
        <Route path="/admin/audits" element={<ProtectedRoute allowedRoles={['ADMIN', 'FUDAYDIYE_ADMIN', 'SUPER_ADMIN']}><AdminAudits /></ProtectedRoute>} />
        <Route path="/admin/live-moderation" element={<ProtectedRoute allowedRoles={['ADMIN', 'FUDAYDIYE_ADMIN', 'SUPER_ADMIN']}><AdminLiveSaleModeration /></ProtectedRoute>} />
        <Route path="/admin/hubs" element={<ProtectedRoute allowedRoles={['ADMIN', 'FUDAYDIYE_ADMIN', 'SUPER_ADMIN']}><AdminHubs /></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}><UserSettings /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

const SystemPermissions: React.FC = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const initPush = async () => {
      try {
        let perm = await PushNotifications.checkPermissions();
        if (perm.receive === 'prompt') {
          perm = await PushNotifications.requestPermissions();
        }
        if (perm.receive === 'granted') {
          await PushNotifications.register();
        }
      } catch (e) {
        console.error("Push Init Error:", e);
      }
    };

    const setupListeners = async () => {
      await PushNotifications.removeAllListeners();

      await PushNotifications.addListener('registration', async token => {
        console.log('Push Registration Token:', token.value);
        if (user) {
          try {
            await api.post('/notifications/token', { token: token.value });
          } catch (err) {
            console.error("Failed to sync push token with backend", err);
          }
        }
      });

      await PushNotifications.addListener('registrationError', err => {
        console.error('Push Registration Error: ', err.error);
      });

      await PushNotifications.addListener('pushNotificationReceived', notification => {
        console.log('Push Received: ', notification);
        // Optionally show local toast if app is in foreground
      });

      await PushNotifications.addListener('pushNotificationActionPerformed', notification => {
        console.log('Push Action Performed:', notification.actionId, notification.inputValue);
        // Handle deep linking here if needed
      });
    };

    setupListeners();
    initPush();

  }, [user]); // Re-run if user changes to ensure token is synced to new user identity

  useEffect(() => {
    const requestMediaPermissions = async () => {
      // Early permission request for mobile app (especially Android)
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        }
      } catch (err) {
        console.warn("Early permission check failed or denied:", err);
      }
    };

    const timer = setTimeout(requestMediaPermissions, 1000);
    return () => clearTimeout(timer);
  }, []);

  return null;
};

export default App;
