import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { History, ArrowLeft, Eye, Heart, FileText, Clock, ChevronRight, Loader2 } from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { api } from '../../lib/api';

interface HistoryItem {
  id: string;
  action: string;
  oldValue: string | null;
  newValue: string | null;
  notes: string | null;
  createdAt: string;
  tender: {
    id: string;
    title: string;
    status: string;
    value: number | null;
    closingDate: string | null;
    state: string | null;
    category: { id: string; name: string } | null;
  };
}

const ACTION_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  viewed: { label: 'Viewed', icon: Eye, color: '#3b82f6' },
  saved: { label: 'Saved', icon: Heart, color: '#ef4444' },
  unsaved: { label: 'Unsaved', icon: Heart, color: '#9ca3af' },
  bid_submitted: { label: 'Bid Submitted', icon: FileText, color: '#10b981' },
  status_changed: { label: 'Status Changed', icon: Clock, color: '#f59e0b' },
  note_added: { label: 'Note Added', icon: FileText, color: '#8b5cf6' },
};

export function TenderHistory() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ total: 0, hasMore: false });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      loadHistory();
    }
  }, [isAuthenticated]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const res = await api.getMyTenderHistory(50, 0);
      setHistory(res.data || []);
      setPagination(res.pagination || { total: 0, hasMore: false });
    } catch (err: any) {
      setError(err.message || 'Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatValue = (value: number | null) => {
    if (!value) return 'Not specified';
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
    return `₹${value.toLocaleString()}`;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8fafc' }}>
        <div className="text-center">
          <Loader2 size={32} className="animate-spin mx-auto mb-4" style={{ color: '#f5820d' }} />
          <p className="text-gray-500">Loading history...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#f8fafc' }} className="min-h-screen">
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1a4f72, #0f3349)' }} className="py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="p-2 rounded-lg text-white hover:bg-white/10 transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <History size={24} /> Tender History
              </h1>
              <p className="text-blue-200 text-sm mt-1">Your tender activity and interactions</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
            {error}
          </div>
        )}

        {history.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center" style={{ borderColor: '#e5e7eb' }}>
            <History size={48} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">No Activity Yet</h3>
            <p className="text-gray-500 mb-6">Start exploring tenders to build your history</p>
            <Link
              to="/tenders"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-white font-medium"
              style={{ background: '#f5820d' }}
            >
              Browse Tenders <ChevronRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((item) => {
              const actionInfo = ACTION_LABELS[item.action] || { label: item.action, icon: Clock, color: '#6b7280' };
              const ActionIcon = actionInfo.icon;

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition-shadow"
                  style={{ borderColor: '#e5e7eb' }}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${actionInfo.color}15` }}
                    >
                      <ActionIcon size={18} style={{ color: actionInfo.color }} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-4 mb-2">
                        <span
                          className="px-2.5 py-1 rounded-full text-xs font-medium"
                          style={{ background: `${actionInfo.color}15`, color: actionInfo.color }}
                        >
                          {actionInfo.label}
                        </span>
                        <span className="text-xs text-gray-400">{formatDate(item.createdAt)}</span>
                      </div>

                      <Link
                        to={`/tender/${item.tender.id}`}
                        className="font-medium hover:underline line-clamp-2"
                        style={{ color: '#1a4f72' }}
                      >
                        {item.tender.title}
                      </Link>

                      <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
                        {item.tender.state && (
                          <span className="flex items-center gap-1">
                            📍 {item.tender.state}
                          </span>
                        )}
                        {item.tender.category && (
                          <span className="flex items-center gap-1">
                            🏷️ {item.tender.category.name}
                          </span>
                        )}
                        {item.tender.value && (
                          <span className="flex items-center gap-1">
                            💰 {formatValue(item.tender.value)}
                          </span>
                        )}
                      </div>

                      {item.notes && (
                        <p className="mt-2 text-sm text-gray-600 italic">"{item.notes}"</p>
                      )}

                      {item.oldValue && item.newValue && (
                        <div className="mt-2 flex items-center gap-2 text-sm">
                          <span className="text-red-500 line-through">{item.oldValue}</span>
                          <span>→</span>
                          <span className="text-green-600">{item.newValue}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {pagination.hasMore && (
              <div className="text-center py-4">
                <button
                  onClick={() => loadHistory()}
                  className="text-sm font-medium hover:underline"
                  style={{ color: '#f5820d' }}
                >
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
