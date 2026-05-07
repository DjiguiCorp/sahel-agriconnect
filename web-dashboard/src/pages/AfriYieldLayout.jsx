import { Routes, Route } from 'react-router-dom';
import AfriYieldShell from '../components/AfriYieldShell';
import AfriYieldExchange from './AfriYieldExchange';
import InvestorRegistration from './InvestorRegistration';
import InvestmentOpportunities from './InvestmentOpportunities';
import OpportunityDetail from './OpportunityDetail';
import InvestorDashboard from './InvestorDashboard';
import InvestorPortal from './InvestorPortal';
import CommodityMarketplace from './CommodityMarketplace';

export default function AfriYieldLayout() {
  return (
    <Routes>
      <Route element={<AfriYieldShell />}>
        <Route index element={<AfriYieldExchange />} />
        <Route path="register" element={<InvestorRegistration />} />
        <Route path="marketplace" element={<CommodityMarketplace />} />
        <Route path="opportunities/:id" element={<OpportunityDetail />} />
        <Route path="opportunities" element={<InvestmentOpportunities />} />
        <Route path="portal" element={<InvestorPortal />} />
        <Route path="dashboard" element={<InvestorDashboard />} />
      </Route>
    </Routes>
  );
}
