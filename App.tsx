
import React, { useState, createContext, useContext, ReactNode, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth'; // Might be unused now in App.tsx but checked later.
import { doc, onSnapshot, setDoc, getDoc, serverTimestamp, updateDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore'; // Check usage
import { auth, db } from './lib/firebase';
import { Providers, useAuth } from './Providers';

import Navbar from './components/Navbar';
import DashboardHeader from './components/DashboardHeader';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import BottomNav from './components/BottomNav';
import LocationTracker from './components/LocationTracker';
import { usePlatform } from './hooks/usePlatform';

import Login from './views/Login';
import Register from './views/Register';
import RoleSelection from './views/RoleSelection';
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
import VendorOrderFulfillment from './views/VendorOrderFulfillment';
import VendorReviews from './views/VendorReviews';
import VendorStoreManagement from './views/VendorStoreManagement';
import VendorStoreUsers from './views/VendorStoreUsers';
import VendorLiveSaleSetup from './views/VendorLiveSaleSetup';
import VendorLiveSessions from './views/VendorLiveSessions';
import LiveStream from './views/LiveStream';
import RiderJobs from './views/RiderJobs';
import RiderJobAssignmentList from './views/RiderJobAssignmentList';
import RiderPickupConfirmation from './views/RiderPickupConfirmation';
import RiderDeliveryConfirmation from './views/RiderDeliveryConfirmation';
import RiderStatusUpdates from './views/RiderStatusUpdates';
import RiderWallet from './views/RiderWallet';
import RiderNavigationView from './views/RiderNavigationView';
import AdminPlatformOverview from './views/AdminPlatformOverview';
import AdminFinancialReports from './views/AdminFinancialReports';
import AdminVendorManagement from './views/AdminVendorManagement';
import AdminVendorProfile from './views/AdminVendorProfile';
import AdminRiderManagement from './views/AdminRiderManagement';
import AdminRiderProfile from './views/AdminRiderProfile';
import AdminLogisticsControl from './views/AdminLogisticsControl';
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
import ClientLogistics from './views/ClientLogistics';
import Profile from './views/Profile';
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
import ScrollToTop from './components/ScrollToTop';
import { ToastProvider } from './components/Toast';

import { UserRole, CartItem, UserProfile, CartNode } from './types';

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

  const isAuthPage = ['/login', '/register', '/select-identity'].includes(location.pathname);

  const isDashboardRoute = location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/vendor') ||
    location.pathname.startsWith('/rider') ||
    location.pathname.startsWith('/client');

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
          <div className={`${isDashboardRoute && !isAuthPage ? 'p-6 lg:p-10' : ''}`}>
            {children}
          </div>
          {/* Footer on Web, hidden on Dashboard */}
          {!isAuthPage && !isDashboardRoute && <Footer />}
        </main>
      </div>

      {/* Web Mobile Bottom Nav (for mobile browsers, not native app if using isNative check correctly) */}
      <div className="md:hidden">
        {!isAuthPage && <BottomNav />}
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
          <Router>
            <ScrollToTop />
            <Layout>
              <AppRoutes />
            </Layout>
          </Router>
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
      <PermissionCheck />
      <LocationTracker />
      <Routes>
        <Route path="/" element={<CustomerHome />} />
        <Route path="/select-identity" element={<RoleSelection onSelectRole={() => { }} />} />
        <Route path="/mobile-menu" element={<MobileMenu />} />

        <Route path="/login" element={<Login onLogin={() => { }} setAppRole={() => { }} />} />
        <Route path="/register" element={<Register onRegister={() => { }} setAppRole={() => { }} />} />
        <Route path="/customer" element={<CustomerHome />} />
        <Route path="/customer/explore" element={<CustomerExplore />} />
        <Route path="/customer/new-arrivals" element={<NewArrivals />} />
        <Route path="/customer/vendors" element={<VendorList />} />
        <Route path="/customer/category/:category" element={<CategoryProductList />} />
        <Route path="/customer/product/:id" element={<ProductDetails />} />
        <Route path="/customer/vendor/:vendorId" element={<VendorShop />} />
        <Route path="/customer/cart" element={<Cart isAuthenticated={true} />} />
        <Route path="/customer/orders" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><CustomerOrders /></ProtectedRoute>} />
        <Route path="/customer/checkout" element={<Checkout isAuthenticated={true} />} />
        <Route path="/customer/profile" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><Profile isAuthenticated={true} /></ProtectedRoute>} />
        <Route path="/customer/track/:id" element={<ProtectedRoute allowedRoles={['CUSTOMER', 'VENDOR']}><TrackingMap /></ProtectedRoute>} />
        <Route path="/customer/live/:id" element={<LiveStream />} />
        <Route path="/customer/personal-info" element={<ProtectedRoute allowedRoles={['CUSTOMER', 'VENDOR', 'RIDER', 'CLIENT', 'ADMIN']}><PersonalInfo /></ProtectedRoute>} />
        <Route path="/customer/addresses" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><SavedAddresses /></ProtectedRoute>} />
        <Route path="/customer/payments" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><LinkedPayments /></ProtectedRoute>} />
        <Route path="/customer/scan" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><GlobalScanView role="CUSTOMER" /></ProtectedRoute>} />

        <Route path="/about" element={<AboutUs />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/privacy" element={<PublicCMSPage slug="privacy-policy" />} />
        <Route path="/terms" element={<PublicCMSPage slug="terms-of-service" />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/blog" element={<BlogList />} />
        <Route path="/blog/:slug" element={<BlogPostDetail />} />

        <Route path="/admin/cms" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminCMSDashboard /></ProtectedRoute>} />
        <Route path="/admin/cms/edit/:type/:id" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminCMSEditor /></ProtectedRoute>} />
        <Route path="/admin/cms/create/:type" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminCMSEditor /></ProtectedRoute>} />
        <Route path="/admin/abandonment" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminAbandonmentReport /></ProtectedRoute>} />
        <Route path="/admin/config" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminConfig /></ProtectedRoute>} />
        <Route path="/admin/categories" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminCategoryManagement /></ProtectedRoute>} />

        <Route path="/vendor" element={<ProtectedRoute allowedRoles={['VENDOR']}><VendorDashboard /></ProtectedRoute>} />
        <Route path="/vendor/management" element={<ProtectedRoute allowedRoles={['VENDOR']}><VendorProductManagement /></ProtectedRoute>} />
        <Route path="/vendor/orders" element={<ProtectedRoute allowedRoles={['VENDOR']}><VendorOrderFulfillment /></ProtectedRoute>} />
        <Route path="/vendor/inventory" element={<ProtectedRoute allowedRoles={['VENDOR']}><VendorInventoryStatus /></ProtectedRoute>} />
        <Route path="/vendor/earnings" element={<ProtectedRoute allowedRoles={['VENDOR']}><VendorEarnings /></ProtectedRoute>} />
        <Route path="/vendor/analytics" element={<ProtectedRoute allowedRoles={['VENDOR']}><VendorAnalytics /></ProtectedRoute>} />
        <Route path="/vendor/reviews" element={<ProtectedRoute allowedRoles={['VENDOR']}><VendorReviews /></ProtectedRoute>} />
        <Route path="/vendor/stores" element={<ProtectedRoute allowedRoles={['VENDOR']}><VendorStoreManagement /></ProtectedRoute>} />
        <Route path="/vendor/staff" element={<ProtectedRoute allowedRoles={['VENDOR']}><VendorStoreUsers /></ProtectedRoute>} />
        <Route path="/vendor/live-setup" element={<ProtectedRoute allowedRoles={['VENDOR']}><VendorLiveSaleSetup /></ProtectedRoute>} />
        <Route path="/vendor/live-cockpit/:id" element={<ProtectedRoute allowedRoles={['VENDOR']}><VendorLiveCockpit /></ProtectedRoute>} />
        <Route path="/vendor/abandonment" element={<ProtectedRoute allowedRoles={['VENDOR']}><AdminAbandonmentReport /></ProtectedRoute>} />
        <Route path="/vendor/settings" element={<ProtectedRoute allowedRoles={['VENDOR']}><UserSettings /></ProtectedRoute>} />

        <Route path="/rider" element={<ProtectedRoute allowedRoles={['RIDER']}><RiderJobs /></ProtectedRoute>} />
        <Route path="/rider/assignments" element={<ProtectedRoute allowedRoles={['RIDER']}><RiderJobAssignmentList /></ProtectedRoute>} />
        <Route path="/rider/pickup/:id" element={<ProtectedRoute allowedRoles={['RIDER']}><RiderPickupConfirmation /></ProtectedRoute>} />
        <Route path="/rider/confirm/:id" element={<ProtectedRoute allowedRoles={['RIDER']}><RiderDeliveryConfirmation /></ProtectedRoute>} />
        <Route path="/rider/status" element={<ProtectedRoute allowedRoles={['RIDER']}><RiderStatusUpdates /></ProtectedRoute>} />
        <Route path="/rider/wallet" element={<ProtectedRoute allowedRoles={['RIDER']}><RiderWallet /></ProtectedRoute>} />
        <Route path="/rider/navigate/:id" element={<ProtectedRoute allowedRoles={['RIDER']}><RiderNavigationView /></ProtectedRoute>} />
        <Route path="/rider/settings" element={<ProtectedRoute allowedRoles={['RIDER']}><UserSettings /></ProtectedRoute>} />
        <Route path="/client" element={<ProtectedRoute allowedRoles={['CLIENT']}><ClientLogistics /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminPlatformOverview /></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminFinancialReports /></ProtectedRoute>} />
        <Route path="/admin/report" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminSystemReport /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminVendorManagement /></ProtectedRoute>} />
        <Route path="/admin/vendor/:id" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminVendorProfile /></ProtectedRoute>} />
        <Route path="/admin/riders" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminRiderManagement /></ProtectedRoute>} />
        <Route path="/admin/rider/:id" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminRiderProfile /></ProtectedRoute>} />
        <Route path="/admin/logistics" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminLogisticsControl /></ProtectedRoute>} />
        <Route path="/admin/audits" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminAudits /></ProtectedRoute>} />
        <Route path="/admin/live-moderation" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminLiveSaleModeration /></ProtectedRoute>} />
        <Route path="/admin/hubs" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminHubs /></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['ADMIN']}><UserSettings /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

const PermissionCheck: React.FC = () => {
  useEffect(() => {
    const requestPermissions = async () => {
      // Early permission request for mobile app (especially Android)
      // This attempts to trigger the OS dialogs immediately after splash
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          // We immediately stop tracks as we just wanted the permission prompt
          // const stream = ...; stream.getTracks().forEach(t => t.stop()); 
          // Implementation detail: typically getUserMedia throws if denied, or resolves if granted/prompted successfully
        }
      } catch (err) {
        console.warn("Early permission check failed or denied:", err);
      }
    };

    // Slight delay to ensure app is fully mounted and splash potentially gone
    const timer = setTimeout(requestPermissions, 1000);
    return () => clearTimeout(timer);
  }, []);

  return null; // Invisible component
};

export default App;
