import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Lock, ArrowLeft, Eye, EyeOff, Loader2, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { api } from '../../lib/api';

export function ChangePassword() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!authLoading && !isAuthenticated) {
    navigate('/login');
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const validateForm = (): boolean => {
    if (!form.currentPassword) {
      setError('Current password is required');
      return false;
    }
    if (form.newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return false;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError('New password and confirm password do not match');
      return false;
    }
    if (form.currentPassword === form.newPassword) {
      setError('New password must be different from current password');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSaving(true);
    setError(null);

    try {
      await api.changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setSuccess(true);
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
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
        <div className="max-w-xl mx-auto px-4">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="p-2 rounded-lg text-white hover:bg-white/10 transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Lock size={24} /> Change Password
              </h1>
              <p className="text-blue-200 text-sm mt-1">Update your account password</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-8">
        {success && (
          <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200 flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
              <Check size={12} className="text-white" />
            </div>
            <span className="text-green-700 font-medium">Password changed successfully! Redirecting...</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2">
            <AlertCircle size={18} className="text-red-500" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border p-6" style={{ borderColor: '#e5e7eb' }}>
          {/* Current Password */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showCurrent ? 'text' : 'password'}
                name="currentPassword"
                value={form.currentPassword}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-12 py-2.5 rounded-lg border focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                style={{ borderColor: '#d1d5db' }}
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showNew ? 'text' : 'password'}
                name="newPassword"
                value={form.newPassword}
                onChange={handleChange}
                required
                minLength={8}
                className="w-full pl-10 pr-12 py-2.5 rounded-lg border focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                style={{ borderColor: '#d1d5db' }}
                placeholder="Enter new password (min 8 characters)"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showConfirm ? 'text' : 'password'}
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-12 py-2.5 rounded-lg border focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                style={{ borderColor: '#d1d5db' }}
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {form.confirmPassword && form.newPassword && form.confirmPassword !== form.newPassword && (
              <p className="text-red-500 text-sm mt-1">Passwords do not match</p>
            )}
          </div>

          {/* Password Requirements */}
          <div className="mb-6 p-4 rounded-lg bg-gray-50">
            <p className="text-sm font-medium text-gray-700 mb-2">Password Requirements:</p>
            <ul className="text-sm text-gray-500 space-y-1">
              <li className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${form.newPassword.length >= 8 ? 'bg-green-500' : 'bg-gray-300'}`}>
                  {form.newPassword.length >= 8 && <Check size={10} className="text-white" />}
                </div>
                At least 8 characters
              </li>
              <li className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${form.newPassword && form.newPassword !== form.currentPassword ? 'bg-green-500' : 'bg-gray-300'}`}>
                  {form.newPassword && form.newPassword !== form.currentPassword && <Check size={10} className="text-white" />}
                </div>
                Different from current password
              </li>
              <li className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${form.confirmPassword && form.newPassword === form.confirmPassword ? 'bg-green-500' : 'bg-gray-300'}`}>
                  {form.confirmPassword && form.newPassword === form.confirmPassword && <Check size={10} className="text-white" />}
                </div>
                Passwords match
              </li>
            </ul>
          </div>

          {/* Buttons */}
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
                  <Loader2 size={16} className="animate-spin" /> Updating...
                </>
              ) : (
                <>
                  <Lock size={16} /> Change Password
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
