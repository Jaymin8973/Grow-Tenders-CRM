import { Link } from 'react-router';
import { ChevronRight, Search } from 'lucide-react';
import { categories } from '../data/mockTenders';
import { useState } from 'react';

export function Categories() {
  const [search, setSearch] = useState('');

  const filtered = categories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ background: '#f8fafc' }} className="min-h-screen">
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0f3349, #1a4f72)' }} className="py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold text-white mb-3">
            GeM Tender <span style={{ color: '#f5820d' }}>Categories</span>
          </h1>
          <p className="text-blue-300 mb-6">Browse government tenders by product or service category</p>
          <div className="relative max-w-lg mx-auto">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search categories..."
              className="w-full pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-none text-gray-700"
            />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {filtered.map((cat) => (
            <Link key={cat.id}
              to={`/tenders?category=${encodeURIComponent(cat.name)}`}
              className="bg-white rounded-xl p-5 border hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group"
              style={{ borderColor: '#e5e7eb' }}>
              <div className="text-3xl mb-3">{cat.icon}</div>
              <h3 className="text-sm font-semibold mb-1 group-hover:text-orange-500 transition-colors"
                style={{ color: '#1a4f72' }}>
                {cat.name}
              </h3>
              <p className="text-xs text-gray-400">{cat.count.toLocaleString()} tenders</p>
              <div className="mt-3 flex items-center gap-1 text-xs font-medium"
                style={{ color: '#f5820d' }}>
                View Tenders <ChevronRight size={12} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
