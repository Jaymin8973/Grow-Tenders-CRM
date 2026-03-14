import { useState, useEffect } from 'react';
import { X, MapPin, Loader2, Check } from 'lucide-react';

interface StateSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (state: string) => Promise<void>;
}

// List of Indian states
const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
];

export function StateSelectionModal({ isOpen, onClose, onConfirm }: StateSelectionModalProps) {
  const [selectedState, setSelectedState] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setSelectedState('');
      setSearchQuery('');
      setError(null);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredStates = INDIAN_STATES.filter(state =>
    state.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleConfirm = async () => {
    if (!selectedState) {
      setError('Please select a state to continue');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      await onConfirm(selectedState);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to activate trial');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div
          className="px-6 pt-8 pb-6"
          style={{ background: 'linear-gradient(135deg, #0f3349, #1a4f72)' }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/20">
              <MapPin size={20} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Select Your State</h2>
          </div>
          <p className="text-blue-200 text-sm">
            We'll send you tender alerts for your selected state during your 3-day free trial
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {/* Search */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search state..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              style={{ borderColor: '#d1d5db' }}
            />
          </div>

          {/* States list */}
          <div className="max-h-64 overflow-y-auto border rounded-lg" style={{ borderColor: '#e5e7eb' }}>
            {filteredStates.length > 0 ? (
              filteredStates.map((state) => (
                <button
                  key={state}
                  onClick={() => setSelectedState(state)}
                  className={`w-full px-4 py-3 text-left text-sm flex items-center justify-between hover:bg-gray-50 transition-colors ${
                    selectedState === state ? 'bg-orange-50' : ''
                  }`}
                  style={{
                    borderBottom: '1px solid #f3f4f6',
                  }}
                >
                  <span className={selectedState === state ? 'font-medium' : ''} style={{ color: selectedState === state ? '#f5820d' : '#374151' }}>
                    {state}
                  </span>
                  {selectedState === state && (
                    <Check size={16} style={{ color: '#f5820d' }} />
                  )}
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-gray-500 text-sm">
                No states found matching "{searchQuery}"
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border font-medium transition-colors hover:bg-gray-50"
              style={{ borderColor: '#d1d5db', color: '#374151' }}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading || !selectedState}
              className="flex-1 py-2.5 rounded-lg text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ background: '#f5820d' }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Activating...
                </>
              ) : (
                'Start Free Trial'
              )}
            </button>
          </div>

          <p className="mt-4 text-center text-xs text-gray-400">
            3-day free trial • No credit card required
          </p>
        </div>
      </div>
    </div>
  );
}
