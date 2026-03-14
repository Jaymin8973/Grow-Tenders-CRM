import { Target, Eye, Users, Award, CheckCircle, TrendingUp } from 'lucide-react';

const teamImage = 'https://images.unsplash.com/photo-1758876203342-fc14c0bba67c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvZmZpY2UlMjB0ZWFtJTIwd29ya2luZyUyMGxhcHRvcCUyMGRvY3VtZW50c3xlbnwxfHx8fDE3NzI0NjEyMzV8MA&ixlib=rb-4.1.0&q=80&w=1080';

const team = [
  { name: 'Ankit Sharma', role: 'Founder & CEO', initials: 'AS', exp: '12+ years in govt procurement' },
  { name: 'Neha Gupta', role: 'CTO', initials: 'NG', exp: '10+ years in SaaS development' },
  { name: 'Rahul Joshi', role: 'Head of Operations', initials: 'RJ', exp: '8+ years in GeM portal expertise' },
  { name: 'Priya Singh', role: 'Customer Success', initials: 'PS', exp: '7+ years in B2B sales' },
];

const milestones = [
  { year: '2021', event: 'Founded with a mission to simplify GeM tender discovery' },
  { year: '2022', event: 'Crossed 1,000 registered businesses on the platform' },
  { year: '2023', event: 'Launched real-time SMS alerts and mobile-responsive platform' },
  { year: '2024', event: 'Reached 10,000+ active subscribers across India' },
  { year: '2025', event: 'Introduced AI-powered tender matching and analytics' },
  { year: '2026', event: 'Launched enterprise API and covering 2,45,000+ GeM tenders' },
];

export function About() {
  return (
    <div style={{ background: '#f8fafc' }} className="min-h-screen">
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #0f3349, #1a4f72)' }} className="py-14">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold text-white mb-3">
            About <span style={{ color: '#f5820d' }}>Grow Tender</span>
          </h1>
          <p className="text-blue-300 text-base max-w-2xl mx-auto">
            India's most trusted GeM tender portal helping thousands of businesses discover and win government procurement opportunities.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-6xl mx-auto px-4 -mt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { value: '10,000+', label: 'Active Subscribers' },
            { value: '2.45 Lakh+', label: 'GeM Tenders Tracked' },
            { value: '4.8/5', label: 'Customer Rating' },
          ].map((stat) => (
            <div key={stat.label}
              className="bg-white rounded-xl p-5 text-center shadow-md border"
              style={{ borderColor: '#e5e7eb' }}>
              <p className="text-2xl font-bold mb-1" style={{ color: '#f5820d' }}>{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Mission & Vision */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <img src={teamImage} alt="Our Team" className="rounded-2xl shadow-xl w-full h-72 object-cover" />
          </div>
          <div className="space-y-6">
            <div className="p-6 bg-white rounded-xl border shadow-sm" style={{ borderColor: '#e5e7eb' }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#fef3e2' }}>
                  <Target size={20} style={{ color: '#f5820d' }} />
                </div>
                <h3 className="font-bold" style={{ color: '#1a4f72' }}>Our Mission</h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                To democratize access to government procurement opportunities by making GeM tender discovery simple, fast, and intelligent for every Indian business — from startups to enterprises.
              </p>
            </div>
            <div className="p-6 bg-white rounded-xl border shadow-sm" style={{ borderColor: '#e5e7eb' }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#e0f0ff' }}>
                  <Eye size={20} style={{ color: '#1a4f72' }} />
                </div>
                <h3 className="font-bold" style={{ color: '#1a4f72' }}>Our Vision</h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                To become the one-stop platform for all GeM sellers in India, empowering them to grow their business by consistently winning government tenders with data-driven insights.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Why We're Different */}
      <div style={{ background: 'linear-gradient(135deg, #0f3349, #1a4f72)' }} className="py-12">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-white text-center mb-8">Why Choose Grow Tender?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: CheckCircle, title: 'GeM Exclusive', desc: 'We focus 100% on GeM portal tenders, giving you the most relevant and accurate data.' },
              { icon: TrendingUp, title: 'Real-Time Updates', desc: 'Our system syncs with GeM every 30 minutes, so you never miss a new opportunity.' },
              { icon: Users, title: 'Expert Support', desc: 'Our team includes former GeM officials who understand the portal inside-out.' },
              { icon: Award, title: 'Proven Track Record', desc: 'Our subscribers have a 3x higher tender win rate compared to manual searchers.' },
              { icon: CheckCircle, title: 'Verified Data', desc: 'Every tender is verified for accuracy before appearing on our platform.' },
              { icon: TrendingUp, title: 'Mobile Friendly', desc: 'Access tenders anywhere with our responsive web app and upcoming mobile app.' },
            ].map((item) => (
              <div key={item.title}
                className="p-5 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
                <item.icon size={20} className="mb-3" style={{ color: '#f5820d' }} />
                <h3 className="font-semibold text-white mb-1">{item.title}</h3>
                <p className="text-sm text-blue-300">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-center mb-8" style={{ color: '#1a4f72' }}>Our Journey</h2>
        <div className="relative">
          <div className="absolute left-8 top-0 bottom-0 w-0.5" style={{ background: '#e5e7eb' }} />
          <div className="space-y-6">
            {milestones.map((m, idx) => (
              <div key={m.year} className="flex gap-6 items-start">
                <div className="w-16 flex-shrink-0 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white z-10"
                    style={{ background: idx % 2 === 0 ? '#1a4f72' : '#f5820d' }}>
                    {idx + 1}
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 border flex-1 shadow-sm" style={{ borderColor: '#e5e7eb' }}>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                    style={{ background: idx % 2 === 0 ? '#1a4f72' : '#f5820d' }}>
                    {m.year}
                  </span>
                  <p className="text-sm text-gray-700 mt-2">{m.event}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
