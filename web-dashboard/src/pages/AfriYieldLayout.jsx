import { Routes, Route } from 'react-router-dom';
import AfriYieldShell from '../components/AfriYieldShell';
import AfriYieldExchange from './AfriYieldExchange';
import InvestorRegistration from './InvestorRegistration';
import InvestmentOpportunities from './InvestmentOpportunities';
import OpportunityDetail from './OpportunityDetail';
import InvestorDashboard from './InvestorDashboard';
import InvestorPortal from './InvestorPortal';
import InvestmentConfirmation from './InvestmentConfirmation';
import CommodityMarketplace from './CommodityMarketplace';
import InvestorUpdates from './InvestorUpdates';

export default function AfriYieldLayout() {
  return (
    <Routes>
      <Route element={<AfriYieldShell />}>
        <Route index element={<AfriYieldExchange />} />
        <Route path="register" element={<InvestorRegistration />} />
        <Route path="updates" element={<InvestorUpdates />} />
        <Route path="marketplace" element={<CommodityMarketplace />} />
        <Route path="opportunities/:id" element={<OpportunityDetail />} />
        <Route path="opportunities" element={<InvestmentOpportunities />} />
        <Route path="invest/:opportunityId" element={<InvestmentConfirmation />} />
        <Route path="portal" element={<InvestorPortal />} />
        <Route path="dashboard" element={<InvestorDashboard />} />
      </Route>
    </Routes>
  );
}
