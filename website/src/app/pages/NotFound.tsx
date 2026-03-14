import { Link } from 'react-router';

export function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center" style={{ background: '#f8fafc' }}>
      <div className="text-center">
        <div className="text-8xl font-bold mb-4" style={{ color: '#e5e7eb' }}>404</div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: '#1a4f72' }}>Page Not Found</h2>
        <p className="text-gray-500 mb-6">The page you're looking for doesn't exist.</p>
        <Link to="/"
          className="px-6 py-3 rounded-lg text-white font-medium"
          style={{ background: '#1a4f72' }}>
          Back to Home
        </Link>
      </div>
    </div>
  );
}
