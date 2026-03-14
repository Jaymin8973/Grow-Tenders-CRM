import { useParams, Link } from 'react-router';
import { useState, useEffect } from 'react';
import {
  ArrowLeft, Calendar, MapPin, Building2, Clock, FileText, Download,
  Share2, Eye, Tag, IndianRupee, Package, Truck, Shield, ChevronRight, Lock, Crown, Heart, Loader2
} from 'lucide-react';
import { useTender } from '../../lib/hooks';
import { Tender, formatCurrency, daysRemaining, formatDate, api } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';

export function TenderDetail() {
  const gemPortalUrl = ((import.meta as any).env?.VITE_GEM_PORTAL_URL as string | undefined) || 'https://gem.gov.in';
  const { id } = useParams();
  const { tender, loading, error } = useTender(id);
  const { isAuthenticated, hasSubscription, customer } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  // Check if user has limited access (free trial users have full access)
  const isFreeTrialValid = customer?.freeTrialActive && 
    (!customer?.freeTrialEndDate || new Date(customer.freeTrialEndDate) > new Date());
  const hasFullAccess = hasSubscription || isFreeTrialValid || tender?.accessLevel === 'full';
  const isLimited = !hasFullAccess && tender?.subscriptionRequired;

  // Check if tender is saved
  useEffect(() => {
    if (isAuthenticated && id) {
      api.checkIfSaved(id).then(res => setIsSaved(res.isSaved)).catch(() => { });
    }
  }, [isAuthenticated, id]);

  const handleSaveToggle = async () => {
    if (!isAuthenticated) {
      return;
    }
    setSaveLoading(true);
    try {
      if (isSaved) {
        await api.unsaveTender(id!);
        setIsSaved(false);
      } else {
        await api.saveTender(id!);
        setIsSaved(true);
      }
    } catch (err) {
      console.error('Failed to save/unsave tender:', err);
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8fafc' }}>
        <div className="text-center">
          <div className="text-5xl mb-4">⏳</div>
          <h2 className="text-xl font-bold mb-2" style={{ color: '#1a4f72' }}>Loading Tender</h2>
          <p className="text-gray-500 mb-4">Please wait...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8fafc' }}>
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold mb-2" style={{ color: '#1a4f72' }}>Unable to Load Tender</h2>
          <p className="text-gray-500 mb-4">{error}</p>
          <Link to="/tenders"
            className="px-6 py-3 rounded-lg text-white font-medium"
            style={{ background: '#1a4f72' }}>
            Back to Tenders
          </Link>
        </div>
      </div>
    );
  }

  if (!tender) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8fafc' }}>
        <div className="text-center">
          <div className="text-5xl mb-4">😕</div>
          <h2 className="text-xl font-bold mb-2" style={{ color: '#1a4f72' }}>Tender Not Found</h2>
          <p className="text-gray-500 mb-4">This tender may have been removed or the link is invalid.</p>
          <Link to="/tenders"
            className="px-6 py-3 rounded-lg text-white font-medium"
            style={{ background: '#1a4f72' }}>
            Back to Tenders
          </Link>
        </div>
      </div>
    );
  }

  const days = tender.closingDate ? daysRemaining(tender.closingDate) : 0;
  const isUrgent = days <= 5 && days >= 0;
  const isExpired = days < 0;

  const statusMap: Record<string, string> = {
    PUBLISHED: 'Active',
    CLOSED: 'Closed',
    CANCELLED: 'Cancelled',
    AWARDED: 'Awarded',
    DRAFT: 'Draft',
  };
  const displayStatus = statusMap[tender.status] || tender.status || 'Active';

  const tenderAny = tender as Tender & Record<string, any>;
  const bidNumber = tenderAny.bidNumber || tender.referenceId || tender.id;
  const ministry = tenderAny.ministry || tenderAny.department || 'Government Department';
  const department = tenderAny.department || tenderAny.ministry || 'Government Department';
  const location = tenderAny.location || tender.city || '';
  const state = tender.state || '';
  const categoryName = tender.category?.name || tender.categoryName || tenderAny.category || 'General';
  const subCategory = tenderAny.subCategory || '-';
  const gemType = tenderAny.gemType || 'Bid';
  const tags: string[] = Array.isArray(tenderAny.tags) ? tenderAny.tags : [];
  const viewCount: number = typeof tenderAny.viewCount === 'number' ? tenderAny.viewCount : 0;
  const quantity = tenderAny.quantity;
  const unit = tenderAny.unit;
  const emd = tenderAny.emd;
  const bidValidity = tenderAny.bidValidity;
  const deliveryDays = tenderAny.deliveryDays;
  const publishDate = tender.publishDate;
  const closingDate = tender.closingDate;
  const openingDate = tenderAny.openingDate;
  const description = tender.description || tender.requirements || '-';
  const documents: Array<{ id: string; name: string; url?: string }> = Array.isArray(tender.attachments)
    ? tender.attachments.map((a) => ({ id: a.id, name: a.filename, url: a.url }))
    : [];

  const handleDownload = async () => {
    const url = (tender as any)?.tenderUrl as string | undefined;
    if (!url) {
      alert('Document link not available');
      return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const statusColor = {
    Active: { bg: '#dcfce7', text: '#15803d' },
    Closed: { bg: '#fee2e2', text: '#dc2626' },
    Cancelled: { bg: '#fef3c7', text: '#d97706' },
    Awarded: { bg: '#dbeafe', text: '#1d4ed8' },
    Draft: { bg: '#f3f4f6', text: '#6b7280' },
  }[displayStatus] || { bg: '#f3f4f6', text: '#6b7280' };

  const typeColorMap: Record<string, { bg: string; text: string; border: string }> = {
    Bid: { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
    RA: { bg: '#fef3c7', text: '#92400e', border: '#fde68a' },
    Direct: { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
  };
  const typeColor = typeColorMap[gemType] || typeColorMap.Bid;

  const relatedTenders: Tender[] = [];

  return (
    <div style={{ background: '#f8fafc' }} className="min-h-screen">
      {/* Breadcrumb */}
      <div style={{ background: '#1a4f72' }} className="py-4">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-2 text-sm text-blue-300">
            <Link to="/" className="hover:text-white">Home</Link>
            <ChevronRight size={14} />
            <Link to="/tenders" className="hover:text-white">GeM Tenders</Link>
            <ChevronRight size={14} />
            <span className="text-white truncate">{bidNumber}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6 flex-col lg:flex-row">
          {/* Main */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Back button */}
            <Link to="/tenders"
              className="inline-flex items-center gap-1 text-sm"
              style={{ color: '#1a4f72' }}>
              <ArrowLeft size={15} /> Back to Tenders
            </Link>

            {/* Header Card */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden" style={{ borderColor: '#e5e7eb' }}>
              <div className="p-1.5" style={{ background: '#1a4f72' }}>
                <div className="flex items-center gap-2 px-3 py-1 text-xs text-blue-200">
                  <span>📋 GeM Tender Details</span>
                  <span className="opacity-60">|</span>
                  <span>{bidNumber}</span>
                </div>
              </div>
              <div className="p-6">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="px-3 py-1 rounded-full text-xs font-medium"
                    style={{ background: typeColor.bg, color: typeColor.text, border: `1px solid ${typeColor.border}` }}>
                    GeM {gemType}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium"
                    style={{ background: statusColor.bg, color: statusColor.text }}>
                    ● {displayStatus}
                  </span>
                  {isUrgent && !isExpired && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-600 animate-pulse">
                      ⚡ Closing in {days} days!
                    </span>
                  )}
                  <span className="ml-auto flex items-center gap-1 text-xs text-gray-400">
                    <Eye size={12} /> {viewCount.toLocaleString()} views
                  </span>
                </div>

                <h1 className="text-xl font-bold mb-4" style={{ color: '#1a4f72', lineHeight: '1.4' }}>
                  {tender.title}
                </h1>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  {[
                    { icon: FileText, label: 'Bid Number', value: bidNumber },
                    { icon: Building2, label: 'Department', value: department },
                    { icon: Shield, label: 'Ministry', value: ministry },
                    { icon: MapPin, label: 'Location', value: `${location}${state ? `, ${state}` : ''}` },
                    { icon: Tag, label: 'Category', value: categoryName },
                    { icon: Tag, label: 'Sub-Category', value: subCategory },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: '#f8fafc' }}>
                      <item.icon size={16} className="mt-0.5 flex-shrink-0" style={{ color: '#f5820d' }} />
                      <div>
                        <p className="text-xs text-gray-500">{item.label}</p>
                        <p className="text-sm font-medium" style={{ color: '#1a4f72' }}>{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <span key={tag} className="px-3 py-1 rounded-full text-xs bg-gray-100 text-gray-600">#{tag}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Key Details */}
            <div className="bg-white rounded-xl shadow-sm border p-6" style={{ borderColor: '#e5e7eb' }}>
              <h2 className="font-semibold mb-4 pb-2 border-b" style={{ color: '#1a4f72', borderColor: '#e5e7eb' }}>
                Key Tender Details
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { icon: IndianRupee, label: 'EMD Amount', value: formatCurrency(emd), hideIfEmpty: true },
                  { icon: Package, label: 'Quantity', value: quantity && unit ? `${quantity} ${unit}` : '-', hideIfEmpty: true },
                  { icon: Calendar, label: 'Published Date', value: publishDate ? formatDate(publishDate) : '-' },
                  { icon: Calendar, label: 'Closing Date', value: closingDate ? formatDate(closingDate) : '-' },
                  { icon: Calendar, label: 'Opening Date', value: openingDate ? formatDate(openingDate) : '-', hideIfEmpty: true },
                  { icon: Clock, label: 'Bid Validity', value: bidValidity ? `${bidValidity} Days` : '-', hideIfEmpty: true },
                  { icon: Truck, label: 'Delivery Days', value: deliveryDays ? `${deliveryDays} Days` : '-', hideIfEmpty: true },
                  { icon: Clock, label: 'Days Remaining', value: isExpired ? 'Expired' : `${days} Days`, urgent: isUrgent },
                ].filter((item: any) => !item.hideIfEmpty).map((item) => (
                  <div key={item.label}
                    className="p-4 rounded-xl border"
                    style={{
                      borderColor: '#e5e7eb',
                      background: '#fafafa'
                    }}>
                    <div className="flex items-center gap-2 mb-1">
                      <item.icon size={14} style={{ color: '#1a4f72' }} />
                      <span className="text-xs text-gray-500">{item.label}</span>
                    </div>
                    <p className="font-bold text-sm"
                      style={{ color: item.urgent ? '#dc2626' : '#1a4f72' }}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-xl shadow-sm border p-6" style={{ borderColor: '#e5e7eb' }}>
              <h2 className="font-semibold mb-3 pb-2 border-b" style={{ color: '#1a4f72', borderColor: '#e5e7eb' }}>
                Tender Description
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
            </div>

            {/* Documents */}
            <div className="bg-white rounded-xl shadow-sm border p-6" style={{ borderColor: '#e5e7eb' }}>
              <h2 className="font-semibold mb-4 pb-2 border-b flex items-center gap-2" style={{ color: '#1a4f72', borderColor: '#e5e7eb' }}>
                Tender Documents
                {isLimited && <Lock size={14} className="text-orange-500" />}
              </h2>

              {isLimited ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: '#fff8f0' }}>
                    <Crown size={28} style={{ color: '#f5820d' }} />
                  </div>
                  <h3 className="font-semibold mb-2" style={{ color: '#1a4f72' }}>Subscription Required</h3>
                  <p className="text-sm text-gray-500 mb-4">Subscribe to download tender documents and view full details</p>
                  <Link to="/pricing"
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-white font-medium"
                    style={{ background: '#f5820d' }}>
                    <Crown size={16} /> View Plans
                  </Link>
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 rounded-lg border" style={{ borderColor: '#e5e7eb' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded flex items-center justify-center" style={{ background: '#fee0c0' }}>
                      <FileText size={20} style={{ color: '#f5820d' }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#1a4f72' }}>GeM Bid Document</p>
                      <p className="text-xs text-gray-400">Official tender document from GeM Portal</p>
                    </div>
                  </div>
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-80 cursor-pointer"
                    style={{ background: '#1a4f72' }}>
                    <Download size={16} /> Download Document
                  </button>
                </div>
              )}
            </div>

            {/* Related Tenders */}
            {relatedTenders.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border p-6" style={{ borderColor: '#e5e7eb' }}>
                <h2 className="font-semibold mb-4 pb-2 border-b" style={{ color: '#1a4f72', borderColor: '#e5e7eb' }}>
                  Related Tenders
                </h2>
                <div className="space-y-3">
                  {relatedTenders.map((t) => (
                    <Link key={t.id} to={`/tender/${t.id}`}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-blue-50 transition-colors border"
                      style={{ borderColor: '#e5e7eb' }}>
                      <FileText size={15} className="mt-0.5 flex-shrink-0" style={{ color: '#f5820d' }} />
                      <div>
                        <p className="text-sm font-medium line-clamp-1" style={{ color: '#1a4f72' }}>{t.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{formatCurrency(t.value)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="w-full lg:w-72 flex-shrink-0 space-y-4">
            {/* Action card */}
            <div className="bg-white rounded-xl shadow-sm border p-5 sticky top-20" style={{ borderColor: '#e5e7eb' }}>
              {!isExpired && (
                <div className={`text-center p-3 rounded-xl mb-4 ${isUrgent ? 'bg-red-50' : 'bg-green-50'}`}>
                  <p className="text-xs text-gray-500 mb-0.5">Closing in</p>
                  <p className={`text-xl font-bold ${isUrgent ? 'text-red-600' : 'text-green-600'}`}>
                    {days} Days
                  </p>
                  <p className="text-xs text-gray-400">{closingDate ? formatDate(closingDate) : '-'}</p>
                </div>
              )}

              <div className="space-y-2">
                {isAuthenticated && (
                  <button
                    onClick={handleSaveToggle}
                    disabled={saveLoading}
                    className="w-full py-3 rounded-xl text-sm font-semibold border flex items-center justify-center gap-2 transition-colors hover:bg-red-50"
                    style={{ borderColor: isSaved ? '#ef4444' : '#d1d5db', color: isSaved ? '#ef4444' : '#6b7280' }}>
                    {saveLoading ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <Heart size={15} fill={isSaved ? '#ef4444' : 'none'} />
                    )}
                    {isSaved ? 'Saved' : 'Save Tender'}
                  </button>
                )}
                <a href={gemPortalUrl} target="_blank" rel="noopener noreferrer"
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white text-center block transition-opacity hover:opacity-90"
                  style={{ background: '#f5820d' }}>
                  Apply on GeM Portal →
                </a>
                <button className="w-full py-3 rounded-xl text-sm font-semibold border flex items-center justify-center gap-2 transition-colors hover:bg-gray-50"
                  style={{ borderColor: '#d1d5db', color: '#6b7280' }}>
                  <Share2 size={15} /> Share Tender
                </button>
              </div>
            </div>

            {/* Subscribe CTA */}
            <div className="rounded-xl p-5 text-center" style={{ background: 'linear-gradient(135deg, #1a4f72, #0f3349)' }}>
              <p className="text-white font-semibold mb-1">Want More Tenders?</p>
              <p className="text-blue-300 text-xs mb-3">Get unlimited access to all GeM tenders with daily email alerts</p>
              <Link to="/pricing"
                className="block py-2.5 rounded-lg text-sm font-semibold transition-colors"
                style={{ background: '#f5820d', color: 'white' }}>
                Subscribe Now
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
