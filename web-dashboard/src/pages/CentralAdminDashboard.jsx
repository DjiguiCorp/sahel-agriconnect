import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import CooperativesManagement from '../components/admin/CooperativesManagement';
import CooperativesDiasporaManagement from '../components/admin/CooperativesDiasporaManagement';
import SeasonalPlanning from '../components/admin/SeasonalPlanning';
import InputsManagement from '../components/admin/InputsManagement';
import CertificationManagement from '../components/admin/CertificationManagement';
import PartnershipsManagement from '../components/admin/PartnershipsManagement';
import ReportsManagement from '../components/admin/ReportsManagement';
import RealTimeFarmers from '../components/admin/RealTimeFarmers';
import LogisticsManagement from '../components/admin/LogisticsManagement';
import CentersManagement from '../components/admin/CentersManagement';
import PerksManagement from '../components/admin/PerksManagement';
import TrainingsManagement from '../components/admin/TrainingsManagement';
import IrrigationManagement from '../components/admin/IrrigationManagement';
import ProductionOptimizationManagement from '../components/admin/ProductionOptimizationManagement';
import AfriYieldManagement from '../components/admin/AfriYieldManagement';
import Governance from '../pages/Governance';
import {
  Sprout,
  Handshake,
  Building2,
  BookOpen,
  Scale,
  Gift,
  Droplets,
  Bot,
  Calendar,
  Star,
  Truck,
  BarChart3,
  Database,
  Coins,
} from 'lucide-react';

const tabs = [
  { id: 'farmers', label: 'Agriculteurs', Icon: Sprout, shortLabel: 'Agric.' },
  { id: 'cooperatives', label: 'Coopératives', Icon: Handshake, shortLabel: 'Coop.' },
  { id: 'centers', label: 'Centres', Icon: Building2, shortLabel: 'Centres' },
  { id: 'trainings', label: 'Formations', Icon: BookOpen, shortLabel: 'Form.' },
  { id: 'governance', label: 'Gouvernance', Icon: Scale, shortLabel: 'Gouv.' },
  { id: 'perks', label: 'Avantages', Icon: Gift, shortLabel: 'Avant.' },
  { id: 'irrigation', label: 'Irrigation', Icon: Droplets, shortLabel: 'Irr.' },
  { id: 'optimization', label: 'Optimisation', Icon: Bot, shortLabel: 'Opt.' },
  { id: 'seasonal', label: 'Planification', Icon: Calendar, shortLabel: 'Plan.' },
  { id: 'certification', label: 'Certification', Icon: Star, shortLabel: 'Cert.' },
  { id: 'logistics', label: 'Logistique', Icon: Truck, shortLabel: 'Log.' },
  { id: 'reports', label: 'Rapports', Icon: BarChart3, shortLabel: 'Rapp.' },
  { id: 'afriyield', label: 'AfriYield Exchange', Icon: Coins, shortLabel: 'AfriY.', accent: 'gold' },
];

const CentralAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('farmers');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-Optimized Header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="px-3 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Left: Logo and Title */}
            <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-primary-green to-primary-lightgreen rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg sm:text-xl">SA</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg sm:text-xl font-bold text-primary-green">Central Admin</h1>
                <p className="text-xs text-gray-500 hidden lg:block">Tableau de bord administratif</p>
              </div>
              <div className="sm:hidden">
                <h1 className="text-sm font-bold text-primary-green">Admin</h1>
              </div>
            </div>

            {/* Right: User Info and Logout */}
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              {/* User Info - Hidden on very small screens, shown on larger mobile */}
              <div className="hidden sm:block text-right max-w-[120px] lg:max-w-none">
                <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate hidden lg:block">{user?.email}</p>
              </div>
              
              {/* Logout Button - Mobile optimized */}
              <Link
                to="/admin/donnees"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-brand-forest bg-brand-iconBg rounded-lg hover:bg-brand-cream border border-brand-sage/30"
              >
                <Database className="w-4 h-4" aria-hidden />
                Données Supabase
              </Link>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-xs sm:text-sm font-medium whitespace-nowrap"
              >
                <span className="hidden sm:inline">Déconnexion</span>
                <span className="sm:hidden">Déco</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:block fixed left-0 top-16 w-64 bg-white shadow-lg h-[calc(100vh-4rem)] overflow-y-auto z-40">
        <nav className="p-4 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? tab.accent === 'gold'
                    ? 'bg-[#B5850A] text-white shadow-md'
                    : 'bg-primary-green text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <tab.Icon
                className={`h-5 w-5 shrink-0 ${
                  activeTab === tab.id ? 'text-white' : 'text-brand-forest'
                }`}
                aria-hidden
              />
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Mobile Navigation - Horizontal Scrollable Tabs */}
      <div className="md:hidden sticky top-14 z-30 bg-white border-b border-gray-200">
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex space-x-2 p-2 min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg whitespace-nowrap transition-colors flex-shrink-0 ${
                  activeTab === tab.id
                    ? tab.accent === 'gold'
                      ? 'bg-[#B5850A] text-white shadow-md'
                      : 'bg-primary-green text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <tab.Icon
                  className={`h-4 w-4 shrink-0 ${activeTab === tab.id ? 'text-white' : 'text-brand-forest'}`}
                  aria-hidden
                />
                <span className="text-xs font-medium">{tab.shortLabel}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content - Adjusted for mobile */}
      <main className="md:ml-64 p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'farmers' && <RealTimeFarmers />}
          {activeTab === 'cooperatives' && <CooperativesManagement />}
          {activeTab === 'centers' && <CentersManagement />}
          {activeTab === 'trainings' && <TrainingsManagement />}
          {activeTab === 'governance' && <Governance />}
          {activeTab === 'perks' && <PerksManagement />}
          {activeTab === 'irrigation' && <IrrigationManagement />}
          {activeTab === 'optimization' && <ProductionOptimizationManagement />}
          {activeTab === 'seasonal' && <SeasonalPlanning />}
          {activeTab === 'certification' && <CertificationManagement />}
          {activeTab === 'logistics' && <LogisticsManagement />}
          {activeTab === 'reports' && <ReportsManagement />}
          {activeTab === 'afriyield' && <AfriYieldManagement />}
        </div>
      </main>
    </div>
  );
};

export default CentralAdminDashboard;
