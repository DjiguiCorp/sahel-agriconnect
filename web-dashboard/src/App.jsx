import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { WebSocketProvider } from './context/WebSocketContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Home from './pages/Home';
import About from './pages/About';
import Dashboard from './pages/Dashboard';
import Contact from './pages/Contact';
import SoilDiagnostic from './pages/SoilDiagnostic';
import ThinkTank from './pages/ThinkTank';
import PlantDiseaseDetection from './pages/PlantDiseaseDetection';
import AdminLogin from './pages/AdminLogin';
import CentralAdminDashboard from './pages/CentralAdminDashboard';
import CooperativeDashboard from './components/CooperativeDashboard';
import DiasporaPartnership from './components/DiasporaPartnership';
import TransformationCenters from './components/TransformationCenters';
import Governance from './pages/Governance';
import CentersMap from './components/farmer/CentersMap';
import PerksRequest from './components/farmer/PerksRequest';
import TrainingBooking from './components/farmer/TrainingBooking';
import IrrigationAssessment from './components/farmer/IrrigationAssessment';
import ProductionOptimizer from './components/farmer/ProductionOptimizer';
import FarmerRegistrationPage from './pages/FarmerRegistrationPage';
import SupabaseDataDashboard from './pages/SupabaseDataDashboard';
import PlatformLicensing from './pages/PlatformLicensing';
import CooperativeRegistration from './pages/CooperativeRegistration';
import FarmerCertificationProgram from './pages/FarmerCertificationProgram';
import EquipmentFund from './pages/EquipmentFund';
import AfriYieldExchange from './pages/AfriYieldExchange';

function App() {
  return (
    <AuthProvider>
      <WebSocketProvider>
        <Router>
        <Routes>
          {/* Route admin login (sans header/footer) */}
          <Route path="/admin/login" element={<AdminLogin />} />

          <Route path="/admin/donnees" element={<SupabaseDataDashboard />} />
          
          {/* Routes admin protégées (sans header/footer) */}
          {/* Route principale du dashboard admin */}
          <Route
            path="/admin/central"
            element={
              <ProtectedRoute>
                <CentralAdminDashboard />
              </ProtectedRoute>
            }
          />
          {/* Alias pour /admin/dashboard - redirige vers /admin/central */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <Navigate to="/admin/central" replace />
              </ProtectedRoute>
            }
          />
          
          {/* Routes publiques (avec header/footer) */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="about" element={<About />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="contact" element={<Contact />} />
            <Route path="diagnostic-sol" element={<SoilDiagnostic />} />
            <Route path="think-tank" element={<ThinkTank />} />
            <Route path="detection-maladies" element={<PlantDiseaseDetection />} />
            <Route path="cooperatives" element={<CooperativeDashboard />} />
            <Route path="diaspora" element={<DiasporaPartnership />} />
            <Route path="centres-transformation" element={<TransformationCenters />} />
            <Route path="governance" element={<Governance />} />
            <Route path="demander-avantage" element={<PerksRequest />} />
            <Route path="irrigation" element={<IrrigationAssessment />} />
            <Route path="optimisation-production" element={<ProductionOptimizer />} />
            <Route path="enregistrer-agriculteur" element={<FarmerRegistrationPage />} />
            <Route path="platform-licensing" element={<PlatformLicensing />} />
            <Route path="cooperative-registration" element={<CooperativeRegistration />} />
            <Route path="farmer-certification" element={<FarmerCertificationProgram />} />
            <Route path="equipment-fund" element={<EquipmentFund />} />
            <Route path="afri-yield" element={<AfriYieldExchange />} />
            {/* Route catch-all pour les routes non trouvées */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
          {/* Catch-all pour les routes admin non trouvées */}
          <Route path="/admin/*" element={<Navigate to="/admin/login" replace />} />
        </Routes>
      </Router>
      </WebSocketProvider>
    </AuthProvider>
  );
}

export default App;

