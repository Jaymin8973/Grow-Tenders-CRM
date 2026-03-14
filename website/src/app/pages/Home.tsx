import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  Search, TrendingUp, Shield, Bell, CheckCircle, ArrowRight,
  FileText, Users, Building2, Star, ChevronRight, Zap, Award, Globe, Loader2
} from 'lucide-react';
import { useTenders, useStats } from '../../lib/hooks';
import { Tender, formatCurrency, daysRemaining, formatDate } from '../../lib/api';
import { TenderCard } from '../components/TenderCard';

const heroImage = 'https://images.unsplash.com/photo-1614610741015-55914090378e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnb3Zlcm5tZW50JTIwcHJvY3VyZW1lbnQlMjB0ZW5kZXIlMjBidXNpbmVzc3xlbnwxfHx8fDE3NzI0NjEyMjV8MA&ixlib=rb-4.1.0&q=80&w=1080';
const teamImage = 'https://images.unsplash.com/photo-1758876203342-fc14c0bba67c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvZmZpY2UlMjB0ZWFtJTIwd29ya2luZyUyMGxhcHRvcCUyMGRvY3VtZW50c3xlbnwxfHx8fDE3NzI0NjEyMzV8MA&ixlib=rb-4.1.0&q=80&w=1080';

const howItWorks = [
  { step: '01', title: 'Create Free Account', desc: 'Register and set up your profile with your business category preferences.', icon: Users },
  { step: '02', title: 'Set Up Alerts', desc: 'Configure keyword-based alerts for your GeM tender categories.', icon: Bell },
  { step: '03', title: 'Search & Filter', desc: 'Use advanced filters to find relevant GeM tenders in seconds.', icon: Search },
  { step: '04', title: 'Win More Tenders', desc: 'Submit competitive bids and grow your government business.', icon: Award },
];

const testimonials = [
  {
    name: 'Rajesh Sharma',
    company: 'TechSolutions Pvt Ltd',
    role: 'Director',
    text: 'Grow Tender has transformed how we track GeM opportunities. We\'ve won 3 major contracts worth ₹45 Lakhs using this platform.',
    rating: 5,
    avatar: 'RS',
  },
  {
    name: 'Priya Mehta',
    company: 'MedEquip Supplies',
    role: 'CEO',
    text: 'The daily email alerts save us hours of manual searching. The filters are precise and we never miss a relevant GeM bid.',
    rating: 5,
    avatar: 'PM',
  },
  {
    name: 'Amit Verma',
    company: 'Secure Guard Services',
    role: 'Managing Director',
    text: 'Best GeM tender portal in India. The support team is excellent and the data is always up-to-date.',
    rating: 5,
    avatar: 'AV',
  },
];

const features = [
  { icon: Bell, title: 'Real-Time Alerts', desc: 'Instant email & SMS notifications for new GeM tenders matching your profile.' },
  { icon: Search, title: 'Advanced Search', desc: 'Filter by ministry, department, state, category, value range, and more.' },
  { icon: Shield, title: 'Verified Data', desc: 'All tenders sourced directly from GeM portal with 100% accuracy.' },
  { icon: FileText, title: 'Bid Documents', desc: 'Download tender documents, corrigendums, and BOQ directly.' },
  { icon: TrendingUp, title: 'Tender Analytics', desc: 'Track past bids, win rates, and market insights for your category.' },
  { icon: Globe, title: 'All India Coverage', desc: 'Tenders from all central and state government departments on GeM.' },
];

export function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  // Fetch tenders from API
  const { data: tenders, loading: tendersLoading, error: tendersError } = useTenders({ limit: 20 });

  // Fetch stats from API
  const { stats: apiStats } = useStats();

  // Compute stats from API or use defaults
  const stats = [
    { label: 'Total GeM Tenders', value: apiStats?.totalTenders ? `${apiStats.totalTenders.toLocaleString()}+` : '2,45,000+', icon: FileText, color: '#1a4f72' },
    { label: 'Active Tenders Today', value: apiStats?.activeTenders ? apiStats.activeTenders.toLocaleString() : '8,432', icon: TrendingUp, color: '#f5820d' },
    { label: 'Registered Buyers', value: '59,000+', icon: Building2, color: '#1a4f72' },
    { label: 'Verified Sellers', value: '7.5 Lakh+', icon: Users, color: '#f5820d' },
  ];

  // Show latest tenders by default
  const displayTenders = tenders.slice(0, 6);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery) {
      navigate(`/tenders?q=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate('/tenders');
    }
  };

  return (
    <div className="min-h-screen" style={{ background: '#f8fafc' }}>

      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden bg-white pt-20 pb-28 md:pt-32 md:pb-40 border-b border-gray-100">
        {/* Abstract Background Elements */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-[20%] -right-[15%] w-[70vw] h-[70vw] rounded-full bg-gradient-to-b from-[#f5820d] to-transparent blur-[120px] opacity-10"></div>
          <div className="absolute top-[40%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-r from-[#1a4f72] to-transparent blur-[120px] opacity-10"></div>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02]"></div>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
          {/* Trust Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full mb-8 bg-white border border-gray-200 shadow-sm transition-all hover:bg-gray-50 cursor-default group">
            <div className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f5820d] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#f5820d]"></span>
            </div>
            <span className="text-sm font-semibold text-gray-700">The Modern Way to Discover GeM Tenders</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-[#111827] tracking-tight leading-[1.12] mb-6 max-w-4xl mx-auto">
            Win Government Tenders With <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1a4f72] via-[#236b9c] to-[#f5820d]">Precision</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Stop searching endlessly. Track <strong className="font-semibold text-gray-900">2,45,000+</strong> GeM tenders instantly, anticipate competitor moves, and never miss a profitable bid again.
          </p>

          {/* Advanced Search Input */}
          <div className="w-full max-w-2xl mx-auto relative group z-20">
            {/* Glow effect behind search box */}
            <div className="absolute -inset-1 bg-gradient-to-r from-[#1a4f72] via-[#f5820d] to-[#1a4f72] rounded-2xl blur-lg transition-all duration-500 group-hover:scale-[1.02] opacity-20"></div>

            <form onSubmit={handleSearch} className="relative bg-white rounded-2xl p-2 md:p-2.5 shadow-2xl flex flex-col sm:flex-row gap-2 transition-all border border-white/50">
              <div className="flex-1 relative flex items-center">
                <Search size={22} className="absolute left-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Try 'Solar Panels' or 'Defence'..."
                  className="w-full pl-12 pr-4 py-3.5 md:py-4 text-base focus:outline-none rounded-xl text-gray-800 bg-transparent placeholder-gray-400"
                />
              </div>
              <button type="submit"
                className="w-full sm:w-auto px-8 py-3.5 md:py-4 rounded-xl text-white font-bold text-base transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(to right, #f5820d, #ea7000)' }}>
                Find Tenders
              </button>
            </form>
          </div>

          {/* Quick Stats / Info under search box */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 md:gap-10 text-sm font-medium text-gray-500 md:text-base">
            <div className="flex items-center gap-2">
              <Shield size={18} className="text-green-500" />
              100% Verified GeM Data
            </div>
            <div className="flex items-center gap-2">
              <Bell size={18} className="text-[#f5820d]" />
              Real-time Email Alerts
            </div>
            <div className="flex items-center gap-2">
              <Award size={18} className="text-[#1a4f72]" />
              AI-Driven Analytics
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label}
              className="bg-white rounded-xl p-5 shadow-sm border flex items-center gap-4"
              style={{ borderColor: '#e5e7eb' }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: stat.color === '#f5820d' ? '#fef3e2' : '#e0f0ff' }}>
                <stat.icon size={22} style={{ color: stat.color }} />
              </div>
              <div>
                <p className="text-xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Latest Tenders ── */}
      <section className="max-w-7xl mx-auto px-4 pb-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: '#1a4f72' }}>GeM Tenders</h2>
            <p className="text-gray-500 text-sm mt-1">Latest government procurement opportunities</p>
          </div>
          <Link to="/tenders"
            className="text-sm font-medium flex items-center gap-1"
            style={{ color: '#f5820d' }}>
            View All Tenders <ChevronRight size={14} />
          </Link>
        </div>

        {/* Tabs have been removed. Tenders now always show latest. */}

        {/* Loading State */}
        {tendersLoading && (
          <div className="bg-white rounded-xl p-16 text-center shadow-sm border" style={{ borderColor: '#e5e7eb' }}>
            <Loader2 size={40} className="animate-spin mx-auto mb-4" style={{ color: '#f5820d' }} />
            <p className="text-gray-500">Loading tenders...</p>
          </div>
        )}

        {/* Tenders List */}
        {!tendersLoading && (
          <div className="space-y-3">
            {displayTenders.map((tender) => (
              <TenderCard key={tender.id} tender={tender as any} viewMode="list" />
            ))}
          </div>
        )}

        <div className="text-center mt-6">
          <Link to="/tenders"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-lg text-white font-semibold transition-all hover:opacity-90"
            style={{ background: '#1a4f72' }}>
            View All GeM Tenders <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ background: 'linear-gradient(135deg, #0f3349 0%, #1a4f72 100%)' }} className="py-14">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-white mb-2">Why Choose Grow Tender?</h2>
            <p className="text-blue-300">Everything you need to succeed on GeM portal</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat) => (
              <div key={feat.title}
                className="rounded-xl p-6 transition-all hover:scale-105"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: 'rgba(245,130,13,0.2)' }}>
                  <feat.icon size={22} style={{ color: '#f5820d' }} />
                </div>
                <h3 className="text-white font-semibold mb-2">{feat.title}</h3>
                <p className="text-blue-300 text-sm leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="max-w-7xl mx-auto px-4 py-14">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#1a4f72' }}>How It Works</h2>
          <p className="text-gray-500">Start winning GeM tenders in 4 simple steps</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {howItWorks.map((step, idx) => (
            <div key={step.step} className="relative">
              {idx < howItWorks.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-[calc(50%+2.5rem)] right-0 h-0.5"
                  style={{ background: 'linear-gradient(90deg, #f5820d, #e5e7eb)' }} />
              )}
              <div className="bg-white rounded-xl p-6 text-center shadow-sm border" style={{ borderColor: '#e5e7eb' }}>
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: '#1a4f72' }}>
                  <step.icon size={24} className="text-white" />
                </div>
                <div className="text-xs font-bold mb-2" style={{ color: '#f5820d' }}>STEP {step.step}</div>
                <h3 className="font-semibold mb-2" style={{ color: '#1a4f72' }}>{step.title}</h3>
                <p className="text-sm text-gray-500">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section style={{ background: '#f0f7ff' }} className="py-14">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold mb-2" style={{ color: '#1a4f72' }}>What Our Clients Say</h2>
            <p className="text-gray-500">Trusted by 10,000+ businesses across India</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-white rounded-xl p-6 shadow-sm border" style={{ borderColor: '#e5e7eb' }}>
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} size={14} fill="#f5820d" style={{ color: '#f5820d' }} />
                  ))}
                </div>
                <p className="text-sm text-gray-600 italic mb-4">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                    style={{ background: '#1a4f72' }}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#1a4f72' }}>{t.name}</p>
                    <p className="text-xs text-gray-500">{t.role} - {t.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing Teaser ── */}
      <section className="max-w-7xl mx-auto px-4 py-14">
        <div className="rounded-2xl overflow-hidden shadow-xl"
          style={{ background: 'linear-gradient(135deg, #1a4f72, #0f3349)' }}>
          <div className="p-10 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4"
              style={{ background: 'rgba(245,130,13,0.2)', border: '1px solid rgba(245,130,13,0.4)' }}>
              <Zap size={13} style={{ color: '#f5820d' }} />
              <span className="text-xs text-orange-300">Limited Time Offer</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">
              Start with <span style={{ color: '#f5820d' }}>7-Day Free Trial</span>
            </h2>
            <p className="text-blue-300 mb-6 max-w-xl mx-auto">
              Get full access to all GeM tenders, unlimited searches, email alerts, and expert support — no credit card required.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
              {['Unlimited Search', 'Email Alerts', 'Bid Documents', 'Expert Support', 'Mobile App'].map((feat) => (
                <div key={feat} className="flex items-center gap-1.5 text-sm text-blue-200">
                  <CheckCircle size={14} style={{ color: '#f5820d' }} />
                  {feat}
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link to="/pricing"
                className="px-8 py-3 rounded-lg font-semibold text-sm transition-all hover:scale-105"
                style={{ background: '#f5820d', color: 'white' }}>
                Start Free Trial Now
              </Link>
              <Link to="/pricing"
                className="px-8 py-3 rounded-lg font-semibold text-sm text-white border border-white/30 hover:bg-white/10 transition-colors">
                View Plans
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
