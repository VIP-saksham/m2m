import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './hooks/useToast';
import { useAuth } from './hooks/useAuth';
import { LoadingSpinner } from './components/ui/LoadingSkeleton';

// Public pages
const Landing = lazy(() => import('./pages/public/Landing'));
const HowItWorks = lazy(() => import('./pages/public/HowItWorks'));
const ForFarmers = lazy(() => import('./pages/public/ForFarmers'));
const ForProcessors = lazy(() => import('./pages/public/ForProcessors'));
const About = lazy(() => import('./pages/public/About'));

// Auth pages
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));

// Farmer pages
const FarmerDashboard = lazy(() => import('./pages/farmer/Dashboard'));
const FarmerBatches = lazy(() => import('./pages/farmer/Batches'));
const CreateBatch = lazy(() => import('./pages/farmer/CreateBatch'));
const BatchDetail = lazy(() => import('./pages/farmer/BatchDetail'));
const DecisionCenter = lazy(() => import('./pages/farmer/DecisionCenter'));
const ProcessorOpportunities = lazy(() => import('./pages/farmer/ProcessorOpportunities'));
const FarmerLots = lazy(() => import('./pages/farmer/ProcurementLots'));
const MarketIntelligence = lazy(() => import('./pages/farmer/MarketIntelligence'));
const StorageDiscovery = lazy(() => import('./pages/farmer/StorageDiscovery'));
const FarmerNotifications = lazy(() => import('./pages/farmer/Notifications'));
const FarmerProfile = lazy(() => import('./pages/farmer/Profile'));

// Processor pages
const ProcessorDashboard = lazy(() => import('./pages/processor/Dashboard'));
const CreateDemand = lazy(() => import('./pages/processor/CreateDemand'));
const ProcessorDemands = lazy(() => import('./pages/processor/Demands'));
const DemandDetail = lazy(() => import('./pages/processor/DemandDetail'));
const MatchingEngine = lazy(() => import('./pages/processor/MatchingEngine'));
const ProcessorLots = lazy(() => import('./pages/processor/ProcurementLots'));
const LotDetail = lazy(() => import('./pages/processor/LotDetail'));
const ProcessorNotifications = lazy(() => import('./pages/processor/Notifications'));
const ProcessorProfile = lazy(() => import('./pages/processor/Profile'));

// Admin pages
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminUsers = lazy(() => import('./pages/admin/Users'));
const AdminBatches = lazy(() => import('./pages/admin/Batches'));
const AdminDemands = lazy(() => import('./pages/admin/Demands'));
const AdminLots = lazy(() => import('./pages/admin/Lots'));
const VerificationQueue = lazy(() => import('./pages/admin/VerificationQueue'));
const AuditLogs = lazy(() => import('./pages/admin/AuditLogs'));
const AdminReports = lazy(() => import('./pages/admin/Reports'));
const AdminNotifications = lazy(() => import('./pages/admin/Notifications'));
const AdminProfile = lazy(() => import('./pages/admin/Profile'));

// Shared pages
const ProcurementLotDetail = lazy(() => import('./pages/shared/ProcurementLotDetail'));
const Community = lazy(() => import('./pages/shared/Community'));
const SurplusRadar = lazy(() => import('./pages/shared/SurplusRadar'));
const ValueRecovery = lazy(() => import('./pages/shared/ValueRecovery'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
      refetchOnWindowFocus: false,
    },
  },
});

const PageLoader = () => (
  <div className="flex h-screen w-screen items-center justify-center bg-cream">
    <div className="flex flex-col items-center gap-4">
      <div className="h-12 w-12 rounded-xl bg-forest flex items-center justify-center">
        <svg viewBox="0 0 32 32" className="h-7 w-7 fill-white">
          <path d="M16 2C8.268 2 2 8.268 2 16s6.268 14 14 14 14-6.268 14-14S23.732 2 16 2zm0 3c2.5 0 4.8.76 6.7 2.06-1.2 1.44-2.8 2.44-4.7 2.44-3.31 0-6-2.69-6-6 0-.18.01-.35.02-.53C13.32 2.37 14.64 2 16 2l-.01 3zM4 16c0-5.08 2.91-9.5 7.17-11.66-.01.22-.17.41-.17.66 0 4.97 4.03 9 9 9 2.87 0 5.41-1.34 7.07-3.43C27.89 12.7 28 14.33 28 16c0 6.63-5.37 12-12 12S4 22.63 4 16z" />
        </svg>
      </div>
      <LoadingSpinner size="md" />
    </div>
  </div>
);

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect to their correct dashboard
    if (user.role === 'farmer') return <Navigate to="/farmer/dashboard" replace />;
    if (user.role === 'processor' || user.role === 'buyer') return <Navigate to="/processor/dashboard" replace />;
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/" replace />;
  }
  return children;
};

const AuthRoute = ({ children }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  if (isLoading) return <PageLoader />;
  if (isAuthenticated && user) {
    if (user.role === 'farmer') return <Navigate to="/farmer/dashboard" replace />;
    if (user.role === 'processor' || user.role === 'buyer') return <Navigate to="/processor/dashboard" replace />;
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  }
  return children;
};

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/for-farmers" element={<ForFarmers />} />
        <Route path="/for-processors" element={<ForProcessors />} />
        <Route path="/about" element={<About />} />

        {/* Auth */}
        <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
        <Route path="/register" element={<AuthRoute><Register /></AuthRoute>} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Farmer */}
        <Route path="/farmer/dashboard" element={<ProtectedRoute allowedRoles={['farmer']}><FarmerDashboard /></ProtectedRoute>} />
        <Route path="/farmer/batches" element={<ProtectedRoute allowedRoles={['farmer']}><FarmerBatches /></ProtectedRoute>} />
        <Route path="/farmer/batches/new" element={<ProtectedRoute allowedRoles={['farmer']}><CreateBatch /></ProtectedRoute>} />
        <Route path="/farmer/batches/:id" element={<ProtectedRoute allowedRoles={['farmer']}><BatchDetail /></ProtectedRoute>} />
        <Route path="/farmer/decision-center" element={<ProtectedRoute allowedRoles={['farmer']}><DecisionCenter /></ProtectedRoute>} />
        <Route path="/farmer/opportunities" element={<ProtectedRoute allowedRoles={['farmer']}><ProcessorOpportunities /></ProtectedRoute>} />
        <Route path="/farmer/lots" element={<ProtectedRoute allowedRoles={['farmer']}><FarmerLots /></ProtectedRoute>} />
        <Route path="/farmer/procurement-lots" element={<ProtectedRoute allowedRoles={['farmer']}><FarmerLots /></ProtectedRoute>} />
        <Route path="/farmer/market" element={<ProtectedRoute allowedRoles={['farmer']}><MarketIntelligence /></ProtectedRoute>} />
        <Route path="/farmer/storage" element={<ProtectedRoute allowedRoles={['farmer']}><StorageDiscovery /></ProtectedRoute>} />
        <Route path="/farmer/notifications" element={<ProtectedRoute allowedRoles={['farmer']}><FarmerNotifications /></ProtectedRoute>} />
        <Route path="/farmer/profile" element={<ProtectedRoute allowedRoles={['farmer']}><FarmerProfile /></ProtectedRoute>} />

        {/* Processor */}
        <Route path="/processor/dashboard" element={<ProtectedRoute allowedRoles={['buyer']}><ProcessorDashboard /></ProtectedRoute>} />
        <Route path="/processor/demands/new" element={<ProtectedRoute allowedRoles={['buyer']}><CreateDemand /></ProtectedRoute>} />
        <Route path="/processor/demands" element={<ProtectedRoute allowedRoles={['buyer']}><ProcessorDemands /></ProtectedRoute>} />
        <Route path="/processor/demands/:id" element={<ProtectedRoute allowedRoles={['buyer']}><DemandDetail /></ProtectedRoute>} />
        <Route path="/processor/demands/:demandId/match" element={<ProtectedRoute allowedRoles={['buyer']}><MatchingEngine /></ProtectedRoute>} />
        <Route path="/processor/lots" element={<ProtectedRoute allowedRoles={['buyer']}><ProcessorLots /></ProtectedRoute>} />
        <Route path="/processor/lots/:id" element={<ProtectedRoute allowedRoles={['buyer']}><LotDetail /></ProtectedRoute>} />
        <Route path="/processor/notifications" element={<ProtectedRoute allowedRoles={['buyer']}><ProcessorNotifications /></ProtectedRoute>} />
        <Route path="/processor/profile" element={<ProtectedRoute allowedRoles={['buyer']}><ProcessorProfile /></ProtectedRoute>} />

        {/* Admin */}
        <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><AdminUsers /></ProtectedRoute>} />
        <Route path="/admin/batches" element={<ProtectedRoute allowedRoles={['admin']}><AdminBatches /></ProtectedRoute>} />
        <Route path="/admin/demands" element={<ProtectedRoute allowedRoles={['admin']}><AdminDemands /></ProtectedRoute>} />
        <Route path="/admin/lots" element={<ProtectedRoute allowedRoles={['admin']}><AdminLots /></ProtectedRoute>} />
        <Route path="/admin/verification" element={<ProtectedRoute allowedRoles={['admin']}><VerificationQueue /></ProtectedRoute>} />
        <Route path="/admin/audit-logs" element={<ProtectedRoute allowedRoles={['admin']}><AuditLogs /></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={['admin']}><AdminReports /></ProtectedRoute>} />
        <Route path="/admin/notifications" element={<ProtectedRoute allowedRoles={['admin']}><AdminNotifications /></ProtectedRoute>} />
        <Route path="/admin/profile" element={<ProtectedRoute allowedRoles={['admin']}><AdminProfile /></ProtectedRoute>} />

        {/* Shared */}
        <Route path="/procurement-lots/:id" element={<ProtectedRoute allowedRoles={['farmer','buyer','admin']}><ProcurementLotDetail /></ProtectedRoute>} />
        <Route path="/network" element={<ProtectedRoute allowedRoles={['farmer','buyer','admin']}><Community /></ProtectedRoute>} />
        <Route path="/community" element={<ProtectedRoute allowedRoles={['farmer','buyer','admin']}><Community /></ProtectedRoute>} />
        <Route path="/surplus-radar" element={<SurplusRadar />} />
        <Route path="/value-recovery" element={<ValueRecovery />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <Router>
            <AppRoutes />
          </Router>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
