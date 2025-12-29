import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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

function App() {
  return (
    <AuthProvider>
      <WebSocketProvider>
        <Router>
        <Routes>
          {/* Route admin login (sans header/footer) */}
          <Route path="/admin/login" element={<AdminLogin />} />
          
          {/* Route admin protégée (sans header/footer) */}
          <Route
            path="/admin/central"
            element={
              <ProtectedRoute>
                <CentralAdminDashboard />
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
          </Route>
        </Routes>
      </Router>
      </WebSocketProvider>
    </AuthProvider>
  );
}

export default App;

