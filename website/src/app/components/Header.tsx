import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { Menu, X, ChevronDown, User, LogOut, Settings } from 'lucide-react';
import logoImage from '../../assets/logo.png';
import { useAuth } from '../../lib/auth-context';

const navLinks = [
  { label: 'Home', path: '/' },
  { label: 'GeM Tenders', path: '/tenders' },
  { label: 'Services', path: '/services' },
  { label: 'Pricing', path: '/pricing' },
  { label: 'About', path: '/about' },
  { label: 'Contact', path: '/contact' },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { customer, isAuthenticated, logout, hasSubscription } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Add a nice subtle shadow on scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`w-full sticky top-0 z-50 transition-all duration-200 ${scrolled ? 'bg-white shadow-md border-b border-gray-100' : 'bg-white border-b border-gray-100'
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">

          {/* Logo & Desktop Navigation */}
          <div className="flex items-center gap-8 lg:gap-12">
            <Link to="/" className="flex shrink-0 items-center">
              <img src={logoImage} alt="Grow Tender" className="h-42 w-auto object-contain" />
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.path}
                  className={`relative px-4 py-2 text-sm font-medium rounded-md transition-all duration-200
                    ${isActive(link.path)
                      ? 'text-[#1a4f72] bg-blue-50/50'
                      : 'text-gray-600 hover:text-[#1a4f72] hover:bg-gray-50'
                    }`}
                >
                  {link.label}
                  {isActive(link.path) && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-[#f5820d] rounded-t-full" />
                  )}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right actions (Alerts, Auth, Mobile Menu Toggle) */}
          <div className="flex items-center gap-4">

            {/* Today's Tenders Badge - Desktop */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-orange-50 border border-orange-100 rounded-full">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f5820d] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#f5820d]"></span>
              </span>
              <span className="text-xs font-semibold text-[#f5820d]">248 New Tenders</span>
            </div>

            {/* Vertical Divider */}
            <div className="hidden lg:block h-6 w-px bg-gray-200 mx-2"></div>

            {/* Auth section */}
            <div className="hidden md:flex items-center gap-3">
              {isAuthenticated ? (
                <div
                  className="relative"
                  onMouseEnter={() => setUserDropdown(true)}
                  onMouseLeave={() => setUserDropdown(false)}
                >
                  <button className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all text-gray-700 bg-white">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-[#1a4f72] text-xs font-bold">
                      {customer?.firstName?.charAt(0) || <User size={14} />}
                    </div>
                    <span className="font-medium">{customer?.firstName}</span>
                    {hasSubscription && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white bg-gradient-to-r from-[#f5820d] to-orange-500 shadow-sm">
                        PRO
                      </span>
                    )}
                    <ChevronDown size={14} className="text-gray-400 ml-1" />
                  </button>

                  {/* Dropdown Menu */}
                  {userDropdown && (
                    <div className="absolute top-full right-0 pt-2 w-56 z-50">
                      <div className="bg-white shadow-xl rounded-xl border border-gray-100 overflow-hidden transform opacity-100 transition-all">
                        <div className="px-4 py-3 bg-gray-50/50 border-b border-gray-100">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {customer?.firstName} {customer?.lastName}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5 truncate">
                            {customer?.email}
                          </p>
                        </div>
                        <div className="p-2 space-y-1">
                          <Link to="/dashboard" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:text-[#1a4f72] hover:bg-blue-50/50 transition-colors">
                            <Settings size={16} className="text-gray-400" /> Dashboard
                          </Link>
                          <Link to="/pricing" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:text-[#1a4f72] hover:bg-blue-50/50 transition-colors">
                            <User size={16} className="text-gray-400" /> Subscription
                          </Link>
                          <div className="h-px bg-gray-100 my-1"></div>
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50 transition-colors w-full text-left"
                          >
                            <LogOut size={16} className="text-red-400" /> Logout
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2 transition-colors"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/pricing"
                    className="text-sm px-5 py-2.5 rounded-lg text-white font-semibold shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
                    style={{ background: '#f5820d' }}
                  >
                    Subscribe Now
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden bg-white border-b border-gray-100 shadow-xl overflow-hidden transition-all duration-300 ease-in-out ${mobileOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
          }`}
      >
        <div className="px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.path}
              onClick={() => setMobileOpen(false)}
              className={`block px-4 py-3 text-sm font-medium rounded-lg transition-colors
                ${isActive(link.path)
                  ? 'text-[#1a4f72] bg-blue-50'
                  : 'text-gray-700 hover:bg-gray-50'
                }`}
            >
              {link.label}
            </Link>
          ))}

          <div className="my-2 h-px bg-gray-100"></div>

          <div className="px-4 py-3 flex items-center justify-between bg-orange-50 rounded-lg border border-orange-100 mx-2 mb-3">
            <span className="text-sm font-medium text-gray-700">Today's Tenders</span>
            <span className="px-2.5 py-1 rounded-md text-xs font-bold text-white bg-[#f5820d]">
              248 New
            </span>
          </div>

          <div className="px-2 pt-2 flex flex-col gap-2">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="w-full py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-center text-gray-700 hover:bg-gray-50"
                >
                  Go to Dashboard
                </Link>
                <button
                  onClick={() => { handleLogout(); setMobileOpen(false); }}
                  className="w-full py-2.5 rounded-lg text-sm font-medium text-center text-red-600 bg-red-50 hover:bg-red-100"
                >
                  Log out
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="py-2.5 rounded-lg border border-gray-200 text-sm font-semibold text-center text-gray-700 hover:bg-gray-50"
                >
                  Log in
                </Link>
                <Link
                  to="/pricing"
                  className="py-2.5 rounded-lg text-white text-sm font-semibold text-center shadow-sm"
                  style={{ background: '#f5820d' }}
                  onClick={() => setMobileOpen(false)}
                >
                  Subscribe
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
