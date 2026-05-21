import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { WebSocketProvider } from './context/WebSocketContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary, { ApiSection } from './components/ErrorBoundary';
import { useGeolocation } from './hooks/useGeolocation';

const Layout = lazy(() => import('./components/Layout'));
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Contact = lazy(() => import('./pages/Contact'));
const SoilDiagnostic = lazy(() => import('./pages/SoilDiagnostic'));
const ThinkTank = lazy(() => import('./pages/ThinkTank'));
const PlantDiseaseDetection = lazy(() => import('./pages/PlantDiseaseDetection'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const CentralAdminDashboard = lazy(() => import('./pages/CentralAdminDashboard'));
const CooperativeDashboard = lazy(() => import('./components/CooperativeDashboard'));
const DiasporaPartnership = lazy(() => import('./components/DiasporaPartnership'));
const TransformationCenters = lazy(() => import('./components/TransformationCenters'));
const Governance = lazy(() => import('./pages/Governance'));
const PerksRequest = lazy(() => import('./components/farmer/PerksRequest'));
const IrrigationAssessment = lazy(() => import('./components/farmer/IrrigationAssessment'));
const ProductionOptimizer = lazy(() => import('./components/farmer/ProductionOptimizer'));
const PlatformLicensing = lazy(() => import('./pages/PlatformLicensing'));
const CooperativeRegistration = lazy(() => import('./pages/CooperativeRegistration'));
const FarmerCertificationProgram = lazy(() => import('./pages/FarmerCertificationProgram'));
const EquipmentFund = lazy(() => import('./pages/EquipmentFund'));
const FarmerNeeds = lazy(() => import('./pages/FarmerNeeds'));
const AfriYieldLayout = lazy(() => import('./pages/AfriYieldLayout'));
const Pricing = lazy(() => import('./pages/Pricing'));
const ProducerProRegistration = lazy(() => import('./pages/ProducerProRegistration'));
const ProducerDashboard = lazy(() => import('./pages/ProducerDashboard'));
const FarmerRegistrationPage = lazy(() => import('./pages/FarmerRegistrationPage'));
const ImpactReport = lazy(() => import('./pages/ImpactReport'));
const TraceabilityLookup = lazy(() => import('./pages/TraceabilityLookup'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const HowItWorks = lazy(() => import('./pages/HowItWorks'));
const InvestorRelations = lazy(() => import('./pages/InvestorRelations'));
const DeleteAccount = lazy(() => import('./pages/DeleteAccount'));
const GovernmentPortal = lazy(() => import('./pages/GovernmentPortal'));
const NgoPortal = lazy(() => import('./pages/NgoPortal'));
const CooperativePortal = lazy(() => import('./pages/CooperativePortal'));
const JoinCooperative = lazy(() => import('./pages/JoinCooperative'));
const NotFound = lazy(() => import('./pages/NotFound'));
const InvestmentSuccess = lazy(() => import('./pages/InvestmentSuccess'));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-10 h-10 border-4 border-[#1a3c2e] border-t-transparent rounded-full animate-spin" />
  </div>
);

function App() {
  useGeolocation();
  return (
    <ErrorBoundary>
      <AuthProvider>
        <WebSocketProvider>
          <Router>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/invest/success" element={<InvestmentSuccess />} />
                <Route path="/invest/cancel" element={<Navigate to="/afri-yield" replace />} />
                <Route path="/admin/login" element={<AdminLogin />} />

                <Route
                  path="/admin/central"
                  element={
                    <ProtectedRoute>
                      <ApiSection>
                        <CentralAdminDashboard />
                      </ApiSection>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/dashboard"
                  element={
                    <ProtectedRoute>
                      <Navigate to="/admin/central" replace />
                    </ProtectedRoute>
                  }
                />

                <Route path="/" element={<Layout />}>
                  <Route index element={<Home />} />
                  <Route path="about" element={<About />} />
                  <Route
                    path="impact"
                    element={
                      <ApiSection>
                        <ImpactReport />
                      </ApiSection>
                    }
                  />
                  <Route
                    path="dashboard"
                    element={
                      <ApiSection>
                        <Dashboard />
                      </ApiSection>
                    }
                  />
                  <Route
                    path="inscription"
                    element={
                      <ApiSection>
                        <FarmerRegistrationPage />
                      </ApiSection>
                    }
                  />
                  <Route
                    path="my-dashboard"
                    element={
                      <ApiSection>
                        <ProducerDashboard />
                      </ApiSection>
                    }
                  />
                  <Route path="delete-account" element={<DeleteAccount />} />
                  <Route
                    path="trace/:batchNumber?"
                    element={
                      <ApiSection>
                        <TraceabilityLookup />
                      </ApiSection>
                    }
                  />
                  <Route path="terms" element={<TermsOfService />} />
                  <Route path="terms-of-service" element={<TermsOfService />} />
                  <Route path="privacy" element={<PrivacyPolicy />} />
                  <Route path="privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="contact" element={<Contact />} />
                  <Route path="pricing" element={<Pricing />} />
                  <Route path="producer-pro-registration" element={<ProducerProRegistration />} />
                  <Route path="how-it-works" element={<HowItWorks />} />
                  <Route
                    path="investor-relations"
                    element={
                      <ApiSection>
                        <InvestorRelations />
                      </ApiSection>
                    }
                  />
                  <Route path="diagnostic-sol" element={<SoilDiagnostic />} />
                  <Route path="think-tank" element={<ThinkTank />} />
                  <Route path="detection-maladies" element={<PlantDiseaseDetection />} />
                  <Route
                    path="cooperatives"
                    element={
                      <ApiSection>
                        <CooperativeDashboard />
                      </ApiSection>
                    }
                  />
                  <Route
                    path="diaspora"
                    element={
                      <ApiSection>
                        <DiasporaPartnership />
                      </ApiSection>
                    }
                  />
                  <Route path="centres-transformation" element={<TransformationCenters />} />
                  <Route path="governance" element={<Governance />} />
                  <Route path="demander-avantage" element={<PerksRequest />} />
                  <Route path="irrigation" element={<IrrigationAssessment />} />
                  <Route path="optimisation-production" element={<ProductionOptimizer />} />
                  <Route
                    path="platform-licensing"
                    element={
                      <ApiSection>
                        <PlatformLicensing />
                      </ApiSection>
                    }
                  />
                  <Route
                    path="government-portal"
                    element={
                      <ApiSection>
                        <GovernmentPortal />
                      </ApiSection>
                    }
                  />
                  <Route
                    path="ngo-portal"
                    element={
                      <ApiSection>
                        <NgoPortal />
                      </ApiSection>
                    }
                  />
                  <Route
                    path="cooperative-portal"
                    element={
                      <ApiSection>
                        <CooperativePortal />
                      </ApiSection>
                    }
                  />
                  <Route
                    path="join-cooperative/:code"
                    element={
                      <ApiSection>
                        <JoinCooperative />
                      </ApiSection>
                    }
                  />
                  <Route
                    path="cooperative-registration"
                    element={
                      <ApiSection>
                        <CooperativeRegistration />
                      </ApiSection>
                    }
                  />
                  <Route path="farmer-certification" element={<FarmerCertificationProgram />} />
                  <Route
                    path="equipment-fund"
                    element={
                      <ApiSection>
                        <EquipmentFund />
                      </ApiSection>
                    }
                  />
                  <Route
                    path="farmer-needs"
                    element={
                      <ApiSection>
                        <FarmerNeeds />
                      </ApiSection>
                    }
                  />
                  <Route
                    path="afri-yield/*"
                    element={
                      <ApiSection>
                        <AfriYieldLayout />
                      </ApiSection>
                    }
                  />
                  <Route path="*" element={<NotFound />} />
                </Route>
                <Route path="/admin/*" element={<Navigate to="/admin/login" replace />} />
              </Routes>
            </Suspense>
          </Router>
        </WebSocketProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
