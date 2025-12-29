import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import CooperativesManagement from '../components/admin/CooperativesManagement';
import SeasonalPlanning from '../components/admin/SeasonalPlanning';
import InputsManagement from '../components/admin/InputsManagement';
import CertificationManagement from '../components/admin/CertificationManagement';
import PartnershipsManagement from '../components/admin/PartnershipsManagement';
import ReportsManagement from '../components/admin/ReportsManagement';
import RealTimeFarmers from '../components/admin/RealTimeFarmers';
import LogisticsManagement from '../components/admin/LogisticsManagement';

const CentralAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('farmers');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const tabs = [
    { id: 'farmers', label: 'Agriculteurs (Temps Réel)', icon: '👨‍🌾' },
    { id: 'cooperatives', label: 'Coopératives', icon: '🤝' },
    { id: 'seasonal', label: 'Planification Saisonnière', icon: '📅' },
    { id: 'inputs', label: 'Intrants & Fertilisants', icon: '🌱' },
    { id: 'certification', label: 'Certification', icon: '⭐' },
    { id: 'partnerships', label: 'Partenariats & Usines', icon: '🏭' },
    { id: 'logistics', label: 'Logistique', icon: '🚚' },
    { id: 'reports', label: 'Rapports', icon: '📊' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-green to-primary-lightgreen rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">SA</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-primary-green">Central Admin</h1>
                <p className="text-xs text-gray-500">Tableau de bord administratif</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-lg min-h-[calc(100vh-4rem)] hidden md:block">
          <nav className="p-4 space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-green text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="text-xl">{tab.icon}</span>
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Mobile Tabs */}
        <div className="md:hidden w-full">
          <div className="bg-white border-b border-gray-200 overflow-x-auto">
            <div className="flex space-x-2 p-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-green text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'farmers' && <RealTimeFarmers />}
            {activeTab === 'cooperatives' && <CooperativesManagement />}
            {activeTab === 'seasonal' && <SeasonalPlanning />}
            {activeTab === 'inputs' && <InputsManagement />}
            {activeTab === 'certification' && <CertificationManagement />}
            {activeTab === 'partnerships' && <PartnershipsManagement />}
            {activeTab === 'logistics' && <LogisticsManagement />}
            {activeTab === 'reports' && <ReportsManagement />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default CentralAdminDashboard;

