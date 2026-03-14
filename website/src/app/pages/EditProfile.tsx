import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { User, Mail, Phone, Building, Briefcase, MapPin, ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { api } from '../../lib/api';

interface ProfileForm {
  firstName: string;
  lastName: string;
  phone: string;
  company: string;
  position: string;
  address: string;
  city: string;
  state: string;
}

export function EditProfile() {
  const { customer, isAuthenticated, loading: authLoading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<ProfileForm>({
    firstName: '',
    lastName: '',
    phone: '',
    company: '',
    position: '',
    address: '',
    city: '',
    state: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (customer) {
      setForm({
        firstName: customer.firstName || '',
        lastName: customer.lastName || '',
        phone: customer.phone || '',
        company: customer.company || '',
        position: customer.position || '',
        address: customer.address || '',
        city: customer.city || '',
        state: customer.state || '',
      });
    }
  }, [customer]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await api.updateProfile(form);
      setSuccess(true);
      // Refresh customer data in context
      if (refreshProfile) {
        await refreshProfile();
      }
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8fafc' }}>
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#f8fafc' }} className="min-h-screen">
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1a4f72, #0f3349)' }} className="py-8">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="p-2 rounded-lg text-white hover:bg-white/10 transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <User size={24} /> Edit Profile
              </h1>
              <p className="text-blue-200 text-sm mt-1">Update your personal information</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {success && (
          <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200 flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-green-700 font-medium">Profile updated successfully!</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border p-6" style={{ borderColor: '#e5e7eb' }}>
          {/* Personal Information */}
          <div className="mb-8">
            <h2 className="font-semibold mb-4 pb-2 border-b" style={{ color: '#1a4f72', borderColor: '#e5e7eb' }}>
              Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                    style={{ borderColor: '#d1d5db' }}
                    placeholder="Enter first name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                <input
                  type="text"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                  style={{ borderColor: '#d1d5db' }}
                  placeholder="Enter last name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={customer?.email || ''}
                    disabled
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border bg-gray-50 text-gray-500 cursor-not-allowed"
                    style={{ borderColor: '#d1d5db' }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                    style={{ borderColor: '#d1d5db' }}
                    placeholder="+91-9876543210"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div className="mb-8">
            <h2 className="font-semibold mb-4 pb-2 border-b" style={{ color: '#1a4f72', borderColor: '#e5e7eb' }}>
              Professional Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <div className="relative">
                  <Building size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    name="company"
                    value={form.company}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                    style={{ borderColor: '#d1d5db' }}
                    placeholder="Company name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Position / Designation</label>
                <div className="relative">
                  <Briefcase size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    name="position"
                    value={form.position}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                    style={{ borderColor: '#d1d5db' }}
                    placeholder="Your role"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="mb-8">
            <h2 className="font-semibold mb-4 pb-2 border-b" style={{ color: '#1a4f72', borderColor: '#e5e7eb' }}>
              Address Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                    style={{ borderColor: '#d1d5db' }}
                    placeholder="Street address"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                  style={{ borderColor: '#d1d5db' }}
                  placeholder="City"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input
                  type="text"
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                  style={{ borderColor: '#d1d5db' }}
                  placeholder="State"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t" style={{ borderColor: '#e5e7eb' }}>
            <Link
              to="/dashboard"
              className="px-6 py-2.5 rounded-lg border text-sm font-medium hover:bg-gray-50 transition-colors"
              style={{ borderColor: '#d1d5db', color: '#1a4f72' }}
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-lg text-white text-sm font-medium flex items-center gap-2 disabled:opacity-50 transition-colors"
              style={{ background: '#f5820d' }}
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save size={16} /> Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
