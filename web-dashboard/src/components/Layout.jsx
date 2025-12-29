import Header from './Header';
import Footer from './Footer';
import LanguageSettings from './LanguageSettings';
import { Outlet } from 'react-router-dom';

const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
      {/* Paramètres de langue (bouton discret en bas à droite) */}
      <LanguageSettings />
    </div>
  );
};

export default Layout;

