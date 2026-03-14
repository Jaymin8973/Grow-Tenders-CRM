import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Bell, ArrowLeft, Plus, X, Save, Loader2, MapPin, Tag, Mail, Check } from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { api } from '../../lib/api';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu and Kashmir',
  'Ladakh', 'Puducherry', 'Chandigarh', 'Andaman and Nicobar Islands', 'Dadra and Nagar Haveli and Daman and Diu', 'Lakshadweep'
];

export function AlertSettings() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [statePreferences, setStatePreferences] = useState<string[]>([]);
  const [emailRecipients, setEmailRecipients] = useState<string[]>([]);
  const [newState, setNewState] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      loadPreferences();
    }
  }, [isAuthenticated]);

  const loadPreferences = async () => {
    try {
      const res = await api.getAlertPreferences();
      setStatePreferences(res.statePreferences || []);
      setEmailRecipients(res.emailRecipients || []);
    } catch (err) {
      console.error('Failed to load preferences:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddState = () => {
    if (newState && !statePreferences.includes(newState)) {
      setStatePreferences(prev => [...prev, newState]);
      setNewState('');
    }
  };

  const handleRemoveState = (state: string) => {
    setStatePreferences(prev => prev.filter(s => s !== state));
  };

  const handleAddEmail = () => {
    if (newEmail && !emailRecipients.includes(newEmail) && newEmail.includes('@')) {
      setEmailRecipients(prev => [...prev, newEmail]);
      setNewEmail('');
    }
  };

  const handleRemoveEmail = (email: string) => {
    setEmailRecipients(prev => prev.filter(e => e !== email));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      await api.updateAlertPreferences({
        statePreferences,
        emailRecipients,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
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
                <Bell size={24} /> Alert Settings
              </h1>
              <p className="text-blue-200 text-sm mt-1">Configure your tender notification preferences</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {success && (
          <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200 flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
              <Check size={12} className="text-white" />
            </div>
            <span className="text-green-700 font-medium">Preferences saved successfully!</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* State Preferences */}
          <div className="bg-white rounded-xl shadow-sm border p-6" style={{ borderColor: '#e5e7eb' }}>
            <h2 className="font-semibold mb-4 flex items-center gap-2" style={{ color: '#1a4f72' }}>
              <MapPin size={18} /> Preferred States
            </h2>
            <p className="text-sm text-gray-500 mb-4">You'll receive alerts for tenders from these states</p>

            <div className="flex flex-wrap gap-2 mb-4">
              {statePreferences.map(state => (
                <span key={state} className="px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1" style={{ background: '#fef3c7', color: '#92400e' }}>
                  {state}
                  <button onClick={() => handleRemoveState(state)} className="hover:text-red-600">
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <select
                value={newState}
                onChange={(e) => setNewState(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                style={{ borderColor: '#d1d5db' }}
              >
                <option value="">Select a state...</option>
                {INDIAN_STATES.filter(s => !statePreferences.includes(s)).map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
              <button
                onClick={handleAddState}
                disabled={!newState}
                className="px-4 py-2.5 rounded-lg text-white font-medium disabled:opacity-50"
                style={{ background: '#f5820d' }}
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          {/* Email Recipients */}
          <div className="bg-white rounded-xl shadow-sm border p-6" style={{ borderColor: '#e5e7eb' }}>
            <h2 className="font-semibold mb-4 flex items-center gap-2" style={{ color: '#1a4f72' }}>
              <Mail size={18} /> Email Recipients
            </h2>
            <p className="text-sm text-gray-500 mb-4">Alerts will be sent to these email addresses</p>

            <div className="flex flex-wrap gap-2 mb-4">
              {emailRecipients.map(email => (
                <span key={email} className="px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1" style={{ background: '#dcfce7', color: '#166534' }}>
                  {email}
                  <button onClick={() => handleRemoveEmail(email)} className="hover:text-red-600">
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Enter email address"
                className="flex-1 px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                style={{ borderColor: '#d1d5db' }}
                onKeyDown={(e) => e.key === 'Enter' && handleAddEmail()}
              />
              <button
                onClick={handleAddEmail}
                disabled={!newEmail || !newEmail.includes('@')}
                className="px-4 py-2.5 rounded-lg text-white font-medium disabled:opacity-50"
                style={{ background: '#f5820d' }}
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 rounded-lg text-white font-medium flex items-center gap-2 disabled:opacity-50"
              style={{ background: '#f5820d' }}
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save size={16} /> Save Preferences
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
