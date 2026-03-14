import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Heart, Trash2, MapPin, Tag, Calendar, FileText, ChevronRight, ArrowLeft, Clock } from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { formatCurrency, formatDate, api } from '../../lib/api';

interface SavedTender {
  id: string;
  createdAt: string;
  notes: string | null;
  tender: {
    id: string;
    title: string;
    description: string;
    status: string;
    value: number | null;
    publishDate: string | null;
    closingDate: string | null;
    state: string | null;
    city: string | null;
    category: { id: string; name: string } | null;
    categoryName: string | null;
    referenceId: string | null;
  };
}

export function SavedTenders() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [savedTenders, setSavedTenders] = useState<SavedTender[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      loadSavedTenders();
    }
  }, [isAuthenticated]);

  const loadSavedTenders = async () => {
    try {
      const res = await api.getSavedTenders(50, 0);
      setSavedTenders(res.data || []);
      setTotal(res.pagination?.total || 0);
      setHasMore(res.pagination?.hasMore || false);
    } catch (err) {
      console.error('Failed to load saved tenders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsave = async (tenderId: string) => {
    try {
      await api.unsaveTender(tenderId);
      setSavedTenders(prev => prev.filter(s => s.tender.id !== tenderId));
      setTotal(prev => prev - 1);
    } catch (err) {
      console.error('Failed to unsave:', err);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      PUBLISHED: { bg: '#dcfce7', text: '#15803d' },
      CLOSED: { bg: '#fee2e2', text: '#dc2626' },
      CANCELLED: { bg: '#fef3c7', text: '#d97706' },
      AWARDED: { bg: '#dbeafe', text: '#1d4ed8' },
    };
    return colors[status] || { bg: '#f3f4f6', text: '#6b7280' };
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8fafc' }}>
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading saved tenders...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#f8fafc' }} className="min-h-screen">
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1a4f72, #0f3349)' }} className="py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="p-2 rounded-lg text-white hover:bg-white/10 transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Heart size={24} className="text-red-400" /> Saved Tenders
              </h1>
              <p className="text-blue-200 text-sm mt-1">{total} tenders saved</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {savedTenders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center" style={{ borderColor: '#e5e7eb' }}>
            <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center bg-red-50">
              <Heart size={32} className="text-red-300" />
            </div>
            <h2 className="text-xl font-semibold mb-2" style={{ color: '#1a4f72' }}>No Saved Tenders Yet</h2>
            <p className="text-gray-500 mb-6">Start saving tenders to keep track of opportunities you're interested in</p>
            <Link to="/tenders" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-white font-medium" style={{ background: '#f5820d' }}>
              <FileText size={18} /> Browse Tenders
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {savedTenders.map((saved) => {
              const statusColor = getStatusColor(saved.tender.status);
              return (
                <div key={saved.id} className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow group" style={{ borderColor: '#e5e7eb' }}>
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      <Link to={`/tender/${saved.tender.id}`} className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: statusColor.bg, color: statusColor.text }}>
                            {saved.tender.status}
                          </span>
                          {saved.tender.referenceId && (
                            <span className="text-xs text-gray-500">#{saved.tender.referenceId}</span>
                          )}
                          <span className="ml-auto text-xs text-gray-400 flex items-center gap-1">
                            <Clock size={12} /> Saved on {formatDate(saved.createdAt)}
                          </span>
                        </div>
                        
                        <h3 className="font-semibold text-lg mb-2 line-clamp-2" style={{ color: '#1a4f72' }}>
                          {saved.tender.title}
                        </h3>
                        
                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                          {saved.tender.description}
                        </p>
                        
                        <div className="flex flex-wrap gap-4 text-sm">
                          {saved.tender.value && (
                            <div className="flex items-center gap-1">
                              <span className="text-gray-500">Value:</span>
                              <span className="font-semibold" style={{ color: '#f5820d' }}>{formatCurrency(saved.tender.value)}</span>
                            </div>
                          )}
                          {saved.tender.state && (
                            <div className="flex items-center gap-1 text-gray-500">
                              <MapPin size={14} /> {saved.tender.state}
                              {saved.tender.city && `, ${saved.tender.city}`}
                            </div>
                          )}
                          {(saved.tender.category?.name || saved.tender.categoryName) && (
                            <div className="flex items-center gap-1 text-gray-500">
                              <Tag size={14} /> {saved.tender.category?.name || saved.tender.categoryName}
                            </div>
                          )}
                          {saved.tender.closingDate && (
                            <div className="flex items-center gap-1 text-gray-500">
                              <Calendar size={14} /> Closes: {formatDate(saved.tender.closingDate)}
                            </div>
                          )}
                        </div>
                      </Link>
                      
                      <div className="flex flex-col gap-2">
                        <Link 
                          to={`/tender/${saved.tender.id}`}
                          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-blue-600 transition-colors"
                          title="View Details">
                          <ChevronRight size={20} />
                        </Link>
                        <button 
                          onClick={() => handleUnsave(saved.tender.id)}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Remove from Saved">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    
                    {saved.notes && (
                      <div className="mt-3 pt-3 border-t" style={{ borderColor: '#e5e7eb' }}>
                        <p className="text-xs text-gray-500 mb-1">Your Notes:</p>
                        <p className="text-sm text-gray-700">{saved.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            
            {hasMore && (
              <div className="text-center py-4">
                <button className="px-6 py-2 rounded-lg border text-sm font-medium hover:bg-gray-50 transition-colors" style={{ borderColor: '#d1d5db', color: '#1a4f72' }}>
                  Load More
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
