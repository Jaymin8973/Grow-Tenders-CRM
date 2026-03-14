import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useAuth } from '../../lib/auth-context';
import { api } from '../../lib/api';

const API_URL = ((import.meta as any).env?.VITE_API_URL as string | undefined) || 'http://localhost:3001/api';

export function TenderDownloadPdf() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { customer, loading: authLoading } = useAuth();
  const [downloading, setDownloading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const downloadPdf = async () => {
      if (authLoading) return;
      
      const token = localStorage.getItem('accessToken');
      
      if (!token || !customer) {
        // Redirect to login with return URL
        navigate(`/login?redirect=/tenders/${id}/download-pdf`);
        return;
      }

      try {
        if (!id) throw new Error('Tender id missing');

        const tender = await api.getTenderById(id);
        const tenderUrl = (tender as any)?.tenderUrl as string | undefined;
        if (!tenderUrl) throw new Error('Document link not available');

        // Keep the existing access/subscription enforcement by hitting the protected endpoint.
        // We don't need the PDF blob; a successful response is enough.
        const response = await fetch(`${API_URL}/public/tenders/${id}/gem-document`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          if (response.status === 403) {
            setError('Subscription required to download documents. Please subscribe to access this feature.');
            setTimeout(() => navigate('/pricing'), 3000);
            return;
          }
          throw new Error(data.message || 'Download failed');
        }

        window.location.href = tenderUrl;
      } catch (err) {
        console.error('Download error:', err);
        setError(err instanceof Error ? err.message : 'Failed to download document');
      } finally {
        setDownloading(false);
      }
    };

    downloadPdf();
  }, [id, customer, authLoading, navigate]);

  if (authLoading || downloading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Downloading PDF document...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-lg">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Download Failed</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate(`/tender/${id}`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            View Tender Details
          </button>
        </div>
      </div>
    );
  }

  return null;
}
