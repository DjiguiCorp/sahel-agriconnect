import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import LanguageSettings from './LanguageSettings';
import SEO from './SEO';
import { captureEvent, AnalyticsEvents } from '../lib/analytics';

const Layout = () => {
  const location = useLocation();

  useEffect(() => {
    captureEvent(AnalyticsEvents.PAGE_VIEW, { path: location.pathname });
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      <SEO path={location.pathname} />
      <Header />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
      <LanguageSettings />
    </div>
  );
};

export default Layout;
