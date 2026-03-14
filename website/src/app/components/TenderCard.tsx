import { Link, useNavigate } from 'react-router';
import { Calendar, MapPin, Building2, Clock, Eye, ChevronRight, Tag, Bell, FileText } from 'lucide-react';
import { Tender, formatCurrency, daysRemaining, formatDate } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';

interface TenderCardProps {
  tender: Tender;
  viewMode?: 'grid' | 'list';
}

export function TenderCard({ tender, viewMode = 'list' }: TenderCardProps) {
  const { isAuthenticated, hasSubscription } = useAuth();
  const navigate = useNavigate();

  const handleTenderClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
    } else if (!hasSubscription) {
      navigate('/pricing');
    } else {
      navigate(`/tender/${tender.id}`);
    }
  };

  const days = tender.closingDate ? daysRemaining(tender.closingDate) : 0;
  const isUrgent = days <= 5 && days >= 0;
  const isExpired = days < 0;

  // Map API status to display status
  const statusMap: Record<string, string> = {
    'PUBLISHED': 'Active',
    'CLOSED': 'Closed',
    'CANCELLED': 'Cancelled',
    'AWARDED': 'Awarded',
    'DRAFT': 'Draft',
  };

  const displayStatus = statusMap[tender.status] || tender.status || 'Active';

  const statusColor = {
    Active: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    Closed: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
    Cancelled: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    Awarded: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    Draft: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
  }[displayStatus] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };

  const typeColor = {
    Bid: { bg: 'bg-[#eff6ff]', text: 'text-[#1d4ed8]', border: 'border-[#bfdbfe]' },
    RA: { bg: 'bg-[#fef3c7]', text: 'text-[#92400e]', border: 'border-[#fde68a]' },
    Direct: { bg: 'bg-[#f0fdf4]', text: 'text-[#15803d]', border: 'border-[#bbf7d0]' },
  }[(tender as any).gemType] || { bg: 'bg-[#eff6ff]', text: 'text-[#1d4ed8]', border: 'border-[#bfdbfe]' };

  // Get category name from tender
  const categoryName = tender.category?.name || tender.categoryName || 'General';
  const location = (tender as any).location || tender.city || '';
  const state = tender.state || '';
  const department = (tender as any).department || (tender as any).ministry || 'Government Department';
  const bidNumber = (tender as any).bidNumber || tender.referenceId || 'N/A';
  const gemType = 'GeM Tender';
  const tags = (tender as any).tags || [];
  const viewCount = (tender as any).viewCount || 0;

  if (viewMode === 'grid') {
    return (
      <div className="group bg-white rounded-2xl border border-gray-200 hover:border-[#f5820d]/50 hover:shadow-xl transition-all duration-300 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-gradient-to-br from-gray-50 to-white border-b border-gray-100 relative">


          <div className="text-xs text-gray-500 font-mono mb-1">{bidNumber}</div>
          <Link to={`/tender/${tender.id}`} onClick={handleTenderClick} className="block">
            <h3 className="text-[15px] font-bold text-gray-900 group-hover:text-[#1a4f72] transition-colors leading-snug line-clamp-2">
              {tender.title}
            </h3>
          </Link>
        </div>

        {/* Body */}
        <div className="p-5 flex-1 flex flex-col gap-3">
          <div className="flex items-start gap-2.5 text-sm">
            <Building2 size={16} className="text-[#f5820d] shrink-0 mt-0.5" />
            <span className="text-gray-700 font-medium leading-tight">{department}</span>
          </div>
          <div className="flex items-start gap-2.5 text-sm">
            <MapPin size={16} className="text-[#f5820d] shrink-0 mt-0.5" />
            <span className="text-gray-600">{location}{state ? `, ${state}` : ''}</span>
          </div>
          <div className="flex items-start gap-2.5 text-sm">
            <Tag size={16} className="text-[#f5820d] shrink-0 mt-0.5" />
            <span className="text-gray-600 truncate">{categoryName}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 pt-4 border-t border-gray-100 bg-gray-50/50 mt-auto">
          <div className="flex items-end justify-between mb-4">
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Time Left</p>
              {isExpired ? (
                <p className="text-sm font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md">Expired</p>
              ) : (
                <div className={`flex items-center gap-1.5 text-sm font-bold ${isUrgent ? 'text-red-600 bg-red-50' : 'text-emerald-700 bg-emerald-50'} px-2.5 py-1 rounded-md`}>
                  <Clock size={14} className={isUrgent ? 'animate-pulse' : ''} />
                  {days} days
                </div>
              )}
            </div>
          </div>

          <Link to={`/tender/${tender.id}`}
            onClick={handleTenderClick}
            className="w-full py-2.5 rounded-xl text-sm font-bold text-center flex items-center justify-center gap-2 transition-all bg-[#1a4f72] text-white hover:bg-[#123650] shadow-sm hover:shadow-md">
            View Details <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  // List View (Horizontal Card)
  return (
    <div className="group bg-white rounded-2xl border border-gray-200 hover:border-[#f5820d]/40 hover:shadow-lg transition-all duration-300 relative overflow-hidden">

      {/* Accent line on left for active tenders if you like that SaaS look */}
      {displayStatus === 'Active' && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#1a4f72] to-[#f5820d]"></div>
      )}

      <div className="p-5 sm:p-6 flex flex-col lg:flex-row gap-6">

        {/* Left Column: Icon + Primary Badges (Hidden on mobile for cleaner look) */}
        <div className="hidden sm:flex flex-col items-center shrink-0 w-[72px]">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-orange-50 border border-gray-100 flex items-center justify-center shadow-sm mb-3">
            <FileText size={24} className="text-[#1a4f72]" />
          </div>

        </div>

        {/* Center Main Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">

          {/* Header row with badges */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-xs font-mono text-gray-400 bg-gray-50 px-2.5 py-0.5 rounded-md border border-gray-100">
              {bidNumber}
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusColor.bg} ${statusColor.text} ${statusColor.border}`}>
              {displayStatus}
            </span>
            {isUrgent && !isExpired && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-red-100 text-red-600 border border-red-200 animate-pulse">
                Closing Soon
              </span>
            )}

            {/* Mobile Type Badge */}
            <span className={`sm:hidden px-2.5 py-0.5 rounded-md text-[10px] uppercase font-bold border ${typeColor.bg} ${typeColor.text} ${typeColor.border}`}>
              {gemType}
            </span>
          </div>

          <Link to={`/tender/${tender.id}`} onClick={handleTenderClick} className="block mb-4">
            <h2 className="text-lg md:text-[19px] font-bold text-gray-900 leading-snug group-hover:text-[#1a4f72] transition-colors line-clamp-2 md:line-clamp-1 pr-4">
              {tender.title}
            </h2>
          </Link>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-3 gap-x-4">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Building2 size={16} className="text-gray-400 shrink-0" />
              <span className="truncate font-medium">{department}</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin size={16} className="text-gray-400 shrink-0" />
              <span className="truncate">{location}{state ? `, ${state}` : ''}</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar size={16} className="text-gray-400 shrink-0" />
              <span className="truncate">Closes: {tender.closingDate ? formatDate(tender.closingDate) : 'N/A'}</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Clock size={16} className={isUrgent ? 'text-red-500 shrink-0' : 'text-emerald-600 shrink-0'} />
              {isExpired ? (
                <span className="text-red-500 font-bold">Expired</span>
              ) : (
                <span className={isUrgent ? 'text-red-600 font-bold' : 'text-emerald-700 font-bold'}>
                  {days} days remaining
                </span>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50/50 border border-blue-100/50 text-blue-800 text-xs font-semibold">
              <Tag size={12} className="opacity-70" /> {gemType}
            </div>
            {tags.map((tag: string) => (
              <span key={tag} className="px-2.5 py-1 rounded-md bg-gray-50 border border-gray-100 text-gray-600 text-[11px] font-medium">
                {tag}
              </span>
            ))}
          </div>

        </div>

        {/* Right Column: Value & CTAs */}
        <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center border-t lg:border-t-0 lg:border-l border-gray-100 pt-4 lg:pt-0 lg:pl-6 shrink-0 md:min-w-[180px]">

          <div className="flex items-center gap-2.5">
            <button className="p-2.5 rounded-xl border border-gray-200 text-gray-400 hover:text-[#f5820d] hover:border-[#f5820d] hover:bg-orange-50 transition-all bg-white shadow-sm tooltip group" title="Set Alert">
              <Bell size={18} className="group-hover:animate-wiggle" />
            </button>
            <Link to={`/tender/${tender.id}`}
              onClick={handleTenderClick}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 whitespace-nowrap"
              style={{ background: 'linear-gradient(to right, #1a4f72, #143e5c)' }}>
              View Tender
            </Link>
          </div>

          {viewCount > 0 && (
            <div className="hidden lg:flex items-center gap-1.5 mt-4 text-[11px] font-semibold text-gray-400">
              <Eye size={12} /> {viewCount.toLocaleString()} interested
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
