import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import { MessageCircle } from 'lucide-react';
import { Header } from './Header';
import { Footer } from './Footer';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export function Layout() {
  const whatsappLink = import.meta.env.VITE_WHATSAPP_LINK || 'https://wa.me/9106130870?text=Hi%2C%20I%20need%20help%20with%20GeM%20Tender%20services.%20Please%20assist%20me.';

  return (
    <div className="flex flex-col min-h-screen">
      <ScrollToTop />
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      
      {/* Floating WhatsApp Button */}
      <a
        href={whatsappLink}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
        style={{ background: '#25d366' }}
      >
        <MessageCircle size={24} className="text-white" />
        <span className="text-white font-semibold text-sm hidden sm:inline">Chat on WhatsApp</span>
      </a>
    </div>
  );
}