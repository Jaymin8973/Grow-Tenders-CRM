import { Link } from 'react-router';
import logoImage from '../../assets/logo.png';
import { Facebook, Twitter, Linkedin, Youtube, Instagram, Phone, Mail, MapPin } from 'lucide-react';

export function Footer() {
  const contactEmail = import.meta.env.VITE_CONTACT_EMAIL || 'support@growtender.in';
  const contactPhone = import.meta.env.VITE_CONTACT_PHONE || '+91 98765 43210';
  const contactAddress = import.meta.env.VITE_CONTACT_ADDRESS || 'Plot No. 45, Sector 44, Gurugram, Haryana - 122003, India';
  const gemPortalUrl = import.meta.env.VITE_GEM_PORTAL_URL || 'https://gem.gov.in';
  const brandName = import.meta.env.VITE_BRAND_NAME || 'Grow Tender';
  const legalCIN = import.meta.env.VITE_COMPANY_CIN || 'U74999DL2024PTC123456';

  return (
    <footer style={{ background: '#0f3349' }} className="text-gray-300">
      {/* CTA Banner */}
      <div style={{ background: '#f5820d' }} className="py-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-white text-xl font-bold">Never Miss a GeM Tender Again!</h3>
            <p className="text-orange-100 text-sm mt-1">Get real-time alerts for tenders directly in your inbox.</p>
          </div>
          <Link to="/pricing"
            className="px-6 py-3 rounded-lg font-semibold text-sm whitespace-nowrap transition-colors hover:bg-gray-100"
            style={{ background: '#fff', color: '#f5820d' }}>
            Start Free Trial Today →
          </Link>
        </div>
      </div>

      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <img src={logoImage} alt={brandName} className="h-12 w-auto mb-4 brightness-0 invert" />
            <p className="text-sm leading-relaxed text-gray-400 mb-4">
              India's most comprehensive GeM (Government e-Marketplace) tender portal. Track, search and win government tenders effortlessly.
            </p>
            <div className="flex items-center gap-3">
              <a href="#" className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-orange-500"
                style={{ background: '#1a4f72' }}>
                <Facebook size={15} />
              </a>
              <a href="#" className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-orange-500"
                style={{ background: '#1a4f72' }}>
                <Twitter size={15} />
              </a>
              <a href="#" className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-orange-500"
                style={{ background: '#1a4f72' }}>
                <Linkedin size={15} />
              </a>
              <a href="#" className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-orange-500"
                style={{ background: '#1a4f72' }}>
                <Youtube size={15} />
              </a>
              <a href="#" className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-orange-500"
                style={{ background: '#1a4f72' }}>
                <Instagram size={15} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">Quick Links</h4>
            <ul className="space-y-2">
              {[
                { label: 'Latest GeM Tenders', path: '/tenders' },
                { label: 'Active Bids', path: '/tenders?status=Active' },
                { label: 'Reverse Auctions (RA)', path: '/tenders?type=RA' },
                { label: 'Awarded Tenders', path: '/tenders?status=Awarded' },
                { label: 'Subscription Plans', path: '/pricing' },
                { label: 'GeM Portal', path: gemPortalUrl },
              ].map((link) => (
                <li key={link.label}>
                  <Link to={link.path}
                    className="text-sm text-gray-400 hover:text-orange-400 transition-colors flex items-center gap-1">
                    <span style={{ color: '#f5820d' }}>›</span> {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-gray-400">
                <MapPin size={16} className="mt-0.5 flex-shrink-0" style={{ color: '#f5820d' }} />
                <span>{contactAddress}</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-400">
                <Phone size={16} className="flex-shrink-0" style={{ color: '#f5820d' }} />
                <span>{contactPhone}</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-400">
                <Mail size={16} className="flex-shrink-0" style={{ color: '#f5820d' }} />
                <span>{contactEmail}</span>
              </li>
            </ul>
            <div className="mt-4 p-3 rounded-lg" style={{ background: '#1a4f72' }}>
              <p className="text-xs text-gray-300 mb-2">Subscribe to tender alerts</p>
              <div className="flex gap-2">
                <input type="email" placeholder="Your email"
                  className="flex-1 px-3 py-1.5 rounded text-xs bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-orange-400" />
                <button className="px-3 py-1.5 rounded text-xs text-white font-medium"
                  style={{ background: '#f5820d' }}>Go</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} {brandName}. All rights reserved. | CIN: {legalCIN}
          </p>
          <div className="flex items-center gap-4">
            {['Privacy Policy', 'Terms of Use', 'Disclaimer', 'Refund Policy'].map((item) => (
              <a key={item} href="#" className="text-xs text-gray-500 hover:text-orange-400 transition-colors">
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
