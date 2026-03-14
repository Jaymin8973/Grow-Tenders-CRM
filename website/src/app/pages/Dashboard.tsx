import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { User, Mail, Phone, Building, Crown, Settings, Bell, FileText, Heart, Clock, ChevronRight, LogOut, Lock, History as HistoryIcon } from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { api } from '../../lib/api';

export function Dashboard() {
  const { customer, isAuthenticated, loading, hasSubscription, logout } = useAuth();
  const navigate = useNavigate();
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login');
    }
  }, [loading, isAuthenticated, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      loadSavedCount();
    }
  }, [isAuthenticated]);

  const loadSavedCount = async () => {
    try {
      const res = await api.getSavedTenders(1, 0);
      setSavedCount(res.pagination?.total || 0);
    } catch (err) {
      console.error('Failed to load saved count:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8fafc' }}>
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div style={{ background: '#f8fafc' }} className="min-h-screen">
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1a4f72, #0f3349)' }} className="py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold" style={{ background: '#f5820d' }}>
                {customer.firstName?.charAt(0)}{customer.lastName?.charAt(0)}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {customer.firstName} {customer.lastName}
                </h1>
                <p className="text-blue-200 text-sm">{customer.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {hasSubscription ? (
                <span className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2" style={{ background: '#f5820d', color: 'white' }}>
                  <Crown size={16} /> PRO Member
                </span>
              ) : (
                <Link to="/pricing" className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2" style={{ background: '#f5820d', color: 'white' }}>
                  <Crown size={16} /> Upgrade to PRO
                </Link>
              )}
              <button onClick={handleLogout} className="p-2 rounded-lg text-white hover:bg-white/10 transition-colors">
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border p-6" style={{ borderColor: '#e5e7eb' }}>
              <h2 className="font-semibold mb-4 pb-2 border-b flex items-center gap-2" style={{ color: '#1a4f72', borderColor: '#e5e7eb' }}>
                <User size={18} /> Profile Information
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: '#f8fafc' }}>
                  <Mail size={16} style={{ color: '#f5820d' }} />
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm font-medium" style={{ color: '#1a4f72' }}>{customer.email}</p>
                  </div>
                </div>
                
                {customer.phone && (
                  <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: '#f8fafc' }}>
                    <Phone size={16} style={{ color: '#f5820d' }} />
                    <div>
                      <p className="text-xs text-gray-500">Phone</p>
                      <p className="text-sm font-medium" style={{ color: '#1a4f72' }}>{customer.phone}</p>
                    </div>
                  </div>
                )}
                
                {customer.company && (
                  <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: '#f8fafc' }}>
                    <Building size={16} style={{ color: '#f5820d' }} />
                    <div>
                      <p className="text-xs text-gray-500">Company</p>
                      <p className="text-sm font-medium" style={{ color: '#1a4f72' }}>{customer.company}</p>
                    </div>
                  </div>
                )}
              </div>

              <Link to="/edit-profile" className="w-full mt-4 py-2.5 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors" style={{ borderColor: '#d1d5db', color: '#1a4f72' }}>
                <Settings size={16} /> Edit Profile
              </Link>

              <Link to="/change-password" className="w-full mt-2 py-2.5 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors" style={{ borderColor: '#d1d5db', color: '#1a4f72' }}>
                <Lock size={16} /> Change Password
              </Link>
            </div>

            {/* Subscription Card */}
            <div className="bg-white rounded-xl shadow-sm border p-6 mt-4" style={{ borderColor: '#e5e7eb' }}>
              <h2 className="font-semibold mb-4 pb-2 border-b flex items-center gap-2" style={{ color: '#1a4f72', borderColor: '#e5e7eb' }}>
                <Crown size={18} /> Subscription
              </h2>
              
              {hasSubscription ? (
                <div className="text-center py-4">
                  <div className="w-14 h-14 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ background: '#fff8f0' }}>
                    <Crown size={24} style={{ color: '#f5820d' }} />
                  </div>
                  <p className="font-semibold mb-1" style={{ color: '#1a4f72' }}>{customer.planType || 'PRO'} Plan</p>
                  <p className="text-xs text-gray-500 mb-3">Active Subscription</p>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-600">Active</span>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="w-14 h-14 mx-auto mb-3 rounded-full flex items-center justify-center bg-gray-100">
                    <Crown size={24} className="text-gray-400" />
                  </div>
                  <p className="font-semibold mb-1" style={{ color: '#1a4f72' }}>Free Plan</p>
                  <p className="text-xs text-gray-500 mb-3">Limited tender access</p>
                  <Link to="/pricing" className="inline-block px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: '#f5820d' }}>
                    Upgrade Now
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: FileText, label: 'Tenders Viewed', value: 0, color: '#1a4f72' },
                { icon: Heart, label: 'Saved Tenders', value: savedCount, color: '#ef4444' },
                { icon: Bell, label: 'Active Alerts', value: 0, color: '#f5820d' },
                { icon: Clock, label: 'Days Active', value: 0, color: '#10b981' },
              ].map((stat) => (
                <div key={stat.label} className="bg-white rounded-xl shadow-sm border p-4" style={{ borderColor: '#e5e7eb' }}>
                  <stat.icon size={20} style={{ color: stat.color }} />
                  <p className="text-2xl font-bold mt-2" style={{ color: '#1a4f72' }}>{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border p-6" style={{ borderColor: '#e5e7eb' }}>
              <h2 className="font-semibold mb-4 pb-2 border-b" style={{ color: '#1a4f72', borderColor: '#e5e7eb' }}>
                Quick Actions
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Link to="/tenders" className="flex items-center justify-between p-4 rounded-lg border hover:shadow-sm transition-shadow" style={{ borderColor: '#e5e7eb' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: '#eff6ff' }}>
                      <FileText size={18} style={{ color: '#1a4f72' }} />
                    </div>
                    <div>
                      <p className="font-medium text-sm" style={{ color: '#1a4f72' }}>Browse Tenders</p>
                      <p className="text-xs text-gray-500">Search all GeM tenders</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-gray-400" />
                </Link>

                <Link to="/pricing" className="flex items-center justify-between p-4 rounded-lg border hover:shadow-sm transition-shadow" style={{ borderColor: '#e5e7eb' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: '#fff8f0' }}>
                      <Crown size={18} style={{ color: '#f5820d' }} />
                    </div>
                    <div>
                      <p className="font-medium text-sm" style={{ color: '#1a4f72' }}>Subscription Plans</p>
                      <p className="text-xs text-gray-500">View pricing options</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-gray-400" />
                </Link>

                <Link to="/saved-tenders" className="flex items-center justify-between p-4 rounded-lg border hover:shadow-sm transition-shadow" style={{ borderColor: '#e5e7eb' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-red-50">
                        <Heart size={18} className="text-red-500" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-sm" style={{ color: '#1a4f72' }}>Saved Tenders</p>
                        <p className="text-xs text-gray-500">{savedCount} saved</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-gray-400" />
                </Link>

                <Link to="/alert-settings" className="flex items-center justify-between p-4 rounded-lg border hover:shadow-sm transition-shadow" style={{ borderColor: '#e5e7eb' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: '#fef3c7' }}>
                      <Bell size={18} style={{ color: '#f5820d' }} />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-sm" style={{ color: '#1a4f72' }}>Alert Settings</p>
                      <p className="text-xs text-gray-500">Manage notifications</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-gray-400" />
                </Link>

                <Link to="/tender-history" className="flex items-center justify-between p-4 rounded-lg border hover:shadow-sm transition-shadow" style={{ borderColor: '#e5e7eb' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: '#e0e7ff' }}>
                      <HistoryIcon size={18} style={{ color: '#4f46e5' }} />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-sm" style={{ color: '#1a4f72' }}>Tender History</p>
                      <p className="text-xs text-gray-500">Your activity log</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-gray-400" />
                </Link>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border p-6" style={{ borderColor: '#e5e7eb' }}>
              <h2 className="font-semibold mb-4 pb-2 border-b" style={{ color: '#1a4f72', borderColor: '#e5e7eb' }}>
                Recent Activity
              </h2>
              
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-gray-100">
                  <Clock size={24} className="text-gray-400" />
                </div>
                <p className="text-gray-500 text-sm">No recent activity</p>
                <p className="text-gray-400 text-xs mt-1">Start browsing tenders to see your activity here</p>
                <Link to="/tenders" className="inline-block mt-4 px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: '#f5820d' }}>
                  Browse Tenders
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
