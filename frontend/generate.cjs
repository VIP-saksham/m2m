const fs = require('fs');
const path = require('path');

const components = [
  'Button', 'Input', 'Select', 'Modal', 'Drawer', 'Toast', 'Badge', 
  'Card', 'Table', 'EmptyState', 'LoadingSkeleton', 'ErrorState', 
  'Pagination', 'FileUploader', 'ImagePreview'
];

const domainComponents = [
  'BatchCard', 'DemandCard', 'DecisionScoreCard', 'MatchResultCard', 
  'ProcurementLotCard', 'StatusTimeline', 'NotificationDropdown', 
  'ChartCard', 'AssessmentCard'
];

const layouts = [
  'PublicLayout', 'FarmerLayout', 'ProcessorLayout', 'AdminLayout'
];

const hooks = [
  'useBatches', 'useDemands', 'useLots', 'useNotifications'
];

const farmerPages = [
  'Dashboard', 'Batches', 'CreateBatch', 'BatchDetail', 'DecisionCenter', 
  'ProcessorOpportunities', 'ProcurementLots', 'MarketIntelligence', 
  'StorageDiscovery', 'Notifications', 'Profile'
];

const processorPages = [
  'Dashboard', 'CreateDemand', 'Demands', 'DemandDetail', 'MatchingEngine', 
  'ProcurementLots', 'LotDetail', 'Notifications', 'Profile'
];

const adminPages = [
  'Dashboard', 'Users', 'VerificationQueue', 'AuditLogs', 'Batches', 
  'Demands', 'Lots', 'Reports'
];

const sharedPages = [
  'ProcurementLotDetail', 'Network', 'SurplusRadar', 'ValueRecovery'
];

const publicPages = [
  'HowItWorks', 'ForFarmers', 'ForProcessors', 'About'
];

const authPages = [
  'Register', 'ForgotPassword'
];

const createDir = (dir) => {
  const target = path.join(__dirname, dir);
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }
};

const writeFile = (filepath, content) => {
  fs.writeFileSync(path.join(__dirname, filepath), content);
};

const getComponentTemplate = (name) => `import React from 'react';

const ${name} = (props) => {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold">${name}</h2>
    </div>
  );
};

export default ${name};
`;

const getHookTemplate = (name) => `import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../services/api';

export const ${name} = () => {
  return {
    data: null,
    isLoading: false,
    error: null
  };
};
`;

// Create Directories
[
  'src/components/ui',
  'src/components/domain',
  'src/layouts',
  'src/hooks',
  'src/pages/farmer',
  'src/pages/processor',
  'src/pages/admin',
  'src/pages/shared',
  'src/pages/public',
  'src/pages/auth'
].forEach(createDir);

// Create Files
components.forEach(name => writeFile(`src/components/ui/${name}.jsx`, getComponentTemplate(name)));
domainComponents.forEach(name => writeFile(`src/components/domain/${name}.jsx`, getComponentTemplate(name)));
layouts.forEach(name => writeFile(`src/layouts/${name}.jsx`, getComponentTemplate(name)));
hooks.forEach(name => writeFile(`src/hooks/${name}.js`, getHookTemplate(name)));
farmerPages.forEach(name => writeFile(`src/pages/farmer/${name}.jsx`, getComponentTemplate(name)));
processorPages.forEach(name => writeFile(`src/pages/processor/${name}.jsx`, getComponentTemplate(name)));
adminPages.forEach(name => writeFile(`src/pages/admin/${name}.jsx`, getComponentTemplate(name)));
sharedPages.forEach(name => writeFile(`src/pages/shared/${name}.jsx`, getComponentTemplate(name)));
publicPages.forEach(name => writeFile(`src/pages/public/${name}.jsx`, getComponentTemplate(name)));
authPages.forEach(name => writeFile(`src/pages/auth/${name}.jsx`, getComponentTemplate(name)));

const appContent = `import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

// Layouts
import FarmerLayout from './layouts/FarmerLayout';
import ProcessorLayout from './layouts/ProcessorLayout';
import AdminLayout from './layouts/AdminLayout';
import PublicLayout from './layouts/PublicLayout';

// Public & Auth
const Landing = React.lazy(() => import('./pages/public/Landing'));
const Login = React.lazy(() => import('./pages/auth/Login'));
const Register = React.lazy(() => import('./pages/auth/Register'));
const ForgotPassword = React.lazy(() => import('./pages/auth/ForgotPassword'));
const HowItWorks = React.lazy(() => import('./pages/public/HowItWorks'));
const ForFarmers = React.lazy(() => import('./pages/public/ForFarmers'));
const ForProcessors = React.lazy(() => import('./pages/public/ForProcessors'));
const About = React.lazy(() => import('./pages/public/About'));

// Farmer
const FarmerDashboard = React.lazy(() => import('./pages/farmer/Dashboard'));
const FarmerBatches = React.lazy(() => import('./pages/farmer/Batches'));
const CreateBatch = React.lazy(() => import('./pages/farmer/CreateBatch'));
const FarmerBatchDetail = React.lazy(() => import('./pages/farmer/BatchDetail'));
const DecisionCenter = React.lazy(() => import('./pages/farmer/DecisionCenter'));
const ProcessorOpportunities = React.lazy(() => import('./pages/farmer/ProcessorOpportunities'));
const FarmerProcurementLots = React.lazy(() => import('./pages/farmer/ProcurementLots'));
const MarketIntelligence = React.lazy(() => import('./pages/farmer/MarketIntelligence'));
const StorageDiscovery = React.lazy(() => import('./pages/farmer/StorageDiscovery'));
const FarmerNotifications = React.lazy(() => import('./pages/farmer/Notifications'));
const FarmerProfile = React.lazy(() => import('./pages/farmer/Profile'));

// Processor
const ProcessorDashboard = React.lazy(() => import('./pages/processor/Dashboard'));
const CreateDemand = React.lazy(() => import('./pages/processor/CreateDemand'));
const Demands = React.lazy(() => import('./pages/processor/Demands'));
const DemandDetail = React.lazy(() => import('./pages/processor/DemandDetail'));
const MatchingEngine = React.lazy(() => import('./pages/processor/MatchingEngine'));
const ProcessorProcurementLots = React.lazy(() => import('./pages/processor/ProcurementLots'));
const LotDetail = React.lazy(() => import('./pages/processor/LotDetail'));
const ProcessorNotifications = React.lazy(() => import('./pages/processor/Notifications'));
const ProcessorProfile = React.lazy(() => import('./pages/processor/Profile'));

// Admin
const AdminDashboard = React.lazy(() => import('./pages/admin/Dashboard'));
const Users = React.lazy(() => import('./pages/admin/Users'));
const VerificationQueue = React.lazy(() => import('./pages/admin/VerificationQueue'));
const AuditLogs = React.lazy(() => import('./pages/admin/AuditLogs'));
const AdminBatches = React.lazy(() => import('./pages/admin/Batches'));
const AdminDemands = React.lazy(() => import('./pages/admin/Demands'));
const AdminLots = React.lazy(() => import('./pages/admin/Lots'));
const Reports = React.lazy(() => import('./pages/admin/Reports'));

// Shared
const ProcurementLotDetail = React.lazy(() => import('./pages/shared/ProcurementLotDetail'));
const Network = React.lazy(() => import('./pages/shared/Network'));
const SurplusRadar = React.lazy(() => import('./pages/shared/SurplusRadar'));
const ValueRecovery = React.lazy(() => import('./pages/shared/ValueRecovery'));


const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) return <div className="p-8 text-center">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  if (allowedRole && user?.role !== allowedRole) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function App() {
  return (
    <Router>
      <Suspense fallback={<div className="flex h-screen w-screen items-center justify-center bg-cream">Loading...</div>}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/for-farmers" element={<ForFarmers />} />
          <Route path="/for-processors" element={<ForProcessors />} />
          <Route path="/about" element={<About />} />

          {/* Farmer Routes */}
          <Route path="/farmer/*" element={<ProtectedRoute allowedRole="farmer"><FarmerLayout /></ProtectedRoute>}>
            <Route path="dashboard" element={<FarmerDashboard />} />
            <Route path="batches" element={<FarmerBatches />} />
            <Route path="batches/new" element={<CreateBatch />} />
            <Route path="batches/:id" element={<FarmerBatchDetail />} />
            <Route path="decision-center" element={<DecisionCenter />} />
            <Route path="opportunities" element={<ProcessorOpportunities />} />
            <Route path="lots" element={<FarmerProcurementLots />} />
            <Route path="market" element={<MarketIntelligence />} />
            <Route path="storage" element={<StorageDiscovery />} />
            <Route path="notifications" element={<FarmerNotifications />} />
            <Route path="profile" element={<FarmerProfile />} />
          </Route>

          {/* Processor Routes */}
          <Route path="/processor/*" element={<ProtectedRoute allowedRole="processor"><ProcessorLayout /></ProtectedRoute>}>
            <Route path="dashboard" element={<ProcessorDashboard />} />
            <Route path="demands/new" element={<CreateDemand />} />
            <Route path="demands" element={<Demands />} />
            <Route path="demands/:id" element={<DemandDetail />} />
            <Route path="demands/:id/match" element={<MatchingEngine />} />
            <Route path="lots" element={<ProcessorProcurementLots />} />
            <Route path="lots/:id" element={<LotDetail />} />
            <Route path="notifications" element={<ProcessorNotifications />} />
            <Route path="profile" element={<ProcessorProfile />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin/*" element={<ProtectedRoute allowedRole="admin"><AdminLayout /></ProtectedRoute>}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="batches" element={<AdminBatches />} />
            <Route path="demands" element={<AdminDemands />} />
            <Route path="lots" element={<AdminLots />} />
            <Route path="verification" element={<VerificationQueue />} />
            <Route path="audit-logs" element={<AuditLogs />} />
            <Route path="reports" element={<Reports />} />
          </Route>

          {/* Shared Routes */}
          <Route path="/procurement-lots/:id" element={<ProtectedRoute><ProcurementLotDetail /></ProtectedRoute>} />
          <Route path="/network" element={<ProtectedRoute><Network /></ProtectedRoute>} />
          <Route path="/surplus-radar" element={<ProtectedRoute><SurplusRadar /></ProtectedRoute>} />
          <Route path="/value-recovery" element={<ProtectedRoute><ValueRecovery /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
`;

writeFile('src/App.jsx', appContent);
console.log('All missing files and App.jsx generated successfully.');
