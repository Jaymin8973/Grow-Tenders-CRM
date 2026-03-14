import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router';
import { Search, Filter, Grid, List, X, SlidersHorizontal, Loader2, AlertCircle } from 'lucide-react';
import { useTenders, useTenderCities, useTenderStates, useTenderDepartments } from '../../lib/hooks';
import { Tender } from '../../lib/api';
import { TenderCard } from '../components/TenderCard';

export function Tenders() {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get('q') || '');
  const [selectedState, setSelectedState] = useState(searchParams.get('state') || '');
  const [selectedCity, setSelectedCity] = useState(searchParams.get('city') || '');
  const [selectedDepartment, setSelectedDepartment] = useState(searchParams.get('department') || '');
  const [departmentSearch, setDepartmentSearch] = useState('');
  const [departmentOpen, setDepartmentOpen] = useState(false);
  const [fromDate, setFromDate] = useState(searchParams.get('fromDate') || '');
  const [toDate, setToDate] = useState(searchParams.get('toDate') || '');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(0);
  const perPage = 10;

  const departmentBoxRef = useRef<HTMLDivElement | null>(null);

  const { states, loading: statesLoading } = useTenderStates();
  const { cities, loading: citiesLoading } = useTenderCities(selectedState);
  const { departments, loading: departmentsLoading } = useTenderDepartments();

  const filteredDepartments = useMemo(() => {
    const q = departmentSearch.trim().toLowerCase();
    if (!q) return departments;
    return departments.filter((d) => d.toLowerCase().includes(q));
  }, [departments, departmentSearch]);

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (!departmentBoxRef.current) return;
      if (!departmentBoxRef.current.contains(e.target as Node)) {
        setDepartmentOpen(false);
      }
    };

    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setSelectedCity('');
  }, [selectedState]);

  // Fetch tenders from API
  const { data: tenders, pagination, loading, error, refetch } = useTenders({
    search: debouncedSearch || undefined,
    state: selectedState || undefined,
    city: selectedCity || undefined,
    department: selectedDepartment || undefined,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
    limit: perPage,
    offset: page * perPage,
  });

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedState('');
    setSelectedCity('');
    setSelectedDepartment('');
    setDepartmentSearch('');
    setDepartmentOpen(false);
    setFromDate('');
    setToDate('');
    setPage(0);
  };

  const activeFilterCount = [
    searchQuery,
    selectedState,
    selectedCity,
    selectedDepartment,
    fromDate,
    toDate,
  ].filter(Boolean).length;

  const totalPages = Math.ceil((pagination.total || 0) / perPage);

  const visiblePages = 5;
  const startPage = Math.max(0, Math.min(page - Math.floor(visiblePages / 2), Math.max(0, totalPages - visiblePages)));
  const endPage = Math.min(totalPages, startPage + visiblePages);

  return (
    <div style={{ background: '#f8fafc' }} className="min-h-screen">
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0f3349, #1a4f72)' }} className="py-8">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-2xl font-bold text-white mb-1">GeM Tenders</h1>
          <p className="text-blue-300 text-sm">Search and filter from {pagination.total}+ GeM tenders</p>
          {/* Search */}
          <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:items-center">
            <div className="flex-1 relative max-w-2xl">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
                placeholder="Search tenders by keyword, bid number, department..."
                className="w-full pl-10 pr-4 py-3 rounded-lg text-sm focus:outline-none text-gray-700 border"
                style={{ background: 'white', borderColor: '#d1d5db' }}
              />
            </div>
            <button
              onClick={() => refetch()}
              className="px-4 py-3 rounded-lg text-white text-sm font-medium flex items-center justify-center gap-2 sm:w-auto w-32"
              style={{ background: '#f5820d' }}>
              <Search size={15} /> Search
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar Filters - Desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border sticky top-20 overflow-hidden" style={{ borderColor: '#e5e7eb' }}>
              <div className="p-4 border-b" style={{ borderColor: '#e5e7eb', background: '#fafbff' }}>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-sm flex items-center gap-2" style={{ color: '#1a4f72' }}>
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#e0f2fe' }}>
                      <Filter size={15} style={{ color: '#1a4f72' }} />
                    </span>
                    Filters
                  </h3>

                  {activeFilterCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg border flex items-center gap-1 hover:bg-white transition-colors"
                      style={{ borderColor: '#fed7aa', color: '#f5820d' }}
                    >
                      <X size={12} /> Clear ({activeFilterCount})
                    </button>
                  )}
                </div>

                {activeFilterCount > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedDepartment && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ background: '#fef3c7', color: '#92400e' }}>
                        Department: {selectedDepartment}
                      </span>
                    )}
                    {selectedState && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ background: '#f1f5f9', color: '#334155' }}>
                        State: {selectedState}
                      </span>
                    )}
                    {selectedCity && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ background: '#f0fdf4', color: '#166534' }}>
                        City: {selectedCity}
                      </span>
                    )}
                    {(fromDate || toDate) && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ background: '#eef2ff', color: '#3730a3' }}>
                        Date
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="p-4 space-y-4 max-h-[calc(100vh-220px)] overflow-y-auto">
                {/* Department */}
                <div className="rounded-xl border p-3" style={{ borderColor: '#eef2f7', background: '#ffffff' }}>
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-2">Department</label>
                  <div ref={departmentBoxRef} className="relative">
                    <input
                      type="text"
                      value={departmentSearch}
                      onChange={(e) => {
                        setDepartmentSearch(e.target.value);
                        setDepartmentOpen(true);
                      }}
                      onFocus={() => setDepartmentOpen(true)}
                      placeholder={departmentsLoading ? 'Loading departments...' : (selectedDepartment || 'All Departments')}
                      className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none text-gray-700"
                      style={{ borderColor: '#d1d5db', background: '#ffffff' }}
                    />

                    {departmentOpen && (
                      <div
                        className="absolute z-20 mt-2 w-full bg-white border rounded-xl shadow-lg overflow-hidden"
                        style={{ borderColor: '#e5e7eb' }}
                      >
                        <div className="max-h-64 overflow-y-auto">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDepartment('');
                              setDepartmentSearch('');
                              setDepartmentOpen(false);
                              setPage(0);
                            }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between"
                          >
                            <span>All Departments</span>
                            {selectedDepartment === '' && <span className="text-gray-900">✓</span>}
                          </button>

                          {!departmentsLoading && filteredDepartments.length === 0 && (
                            <div className="px-3 py-2 text-sm text-gray-500">No departments found</div>
                          )}

                          {filteredDepartments.map((d) => (
                            <button
                              key={d}
                              type="button"
                              onClick={() => {
                                setSelectedDepartment(d);
                                setDepartmentSearch(d);
                                setDepartmentOpen(false);
                                setPage(0);
                              }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between"
                            >
                              <span className="pr-2">{d}</span>
                              {selectedDepartment === d && <span className="text-gray-900">✓</span>}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* State */}
                <div className="rounded-xl border p-3" style={{ borderColor: '#eef2f7', background: '#ffffff' }}>
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-2">State</label>
                  <select
                    value={selectedState}
                    onChange={(e) => { setSelectedState(e.target.value); setPage(0); }}
                    className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none text-gray-700"
                    style={{ borderColor: '#d1d5db', background: '#ffffff' }}
                  >
                    <option value="">{statesLoading ? 'Loading states...' : 'All States'}</option>
                    {states.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* City */}
                <div className="rounded-xl border p-3" style={{ borderColor: '#eef2f7', background: '#ffffff' }}>
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-2">City</label>
                  <select
                    value={selectedCity}
                    onChange={(e) => { setSelectedCity(e.target.value); setPage(0); }}
                    disabled={!selectedState}
                    className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none text-gray-700"
                    style={{ borderColor: '#d1d5db', background: '#ffffff' }}
                  >
                    <option value="">{!selectedState ? 'Select state first' : (citiesLoading ? 'Loading cities...' : 'All Cities')}</option>
                    {cities.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Date Range */}
                <div className="rounded-xl border p-3 space-y-3" style={{ borderColor: '#eef2f7', background: '#ffffff' }}>
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block">Date Range</label>
                  <div className="grid grid-cols-1 gap-2">
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => { setFromDate(e.target.value); setPage(0); }}
                      className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none text-gray-700"
                      style={{ borderColor: '#d1d5db', background: '#ffffff' }}
                    />
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => { setToDate(e.target.value); setPage(0); }}
                      className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none text-gray-700"
                      style={{ borderColor: '#d1d5db', background: '#ffffff' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="bg-white rounded-xl shadow-sm border p-3 mb-4 flex items-center justify-between gap-3 flex-wrap"
              style={{ borderColor: '#e5e7eb' }}>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  <span className="font-semibold" style={{ color: '#1a4f72' }}>{pagination.total}</span> tenders found
                </span>
                {activeFilterCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                    style={{ background: '#f5820d' }}>
                    {activeFilterCount} filters
                  </span>
                )}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden flex items-center gap-1 px-3 py-1.5 rounded-lg border text-sm"
                  style={{ borderColor: '#1a4f72', color: '#1a4f72' }}>
                  <SlidersHorizontal size={14} /> Filters
                </button>
              </div>
              <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: '#d1d5db' }}>
                <button onClick={() => setViewMode('list')}
                  className="px-3 py-1.5 transition-colors"
                  style={viewMode === 'list' ? { background: '#1a4f72', color: 'white' } : { color: '#6b7280' }}>
                  <List size={16} />
                </button>
                <button onClick={() => setViewMode('grid')}
                  className="px-3 py-1.5 transition-colors"
                  style={viewMode === 'grid' ? { background: '#1a4f72', color: 'white' } : { color: '#6b7280' }}>
                  <Grid size={16} />
                </button>
              </div>
            </div>

            {/* Mobile Filters */}
            {showFilters && (
              <div className="lg:hidden bg-white rounded-xl shadow-sm border p-4 mb-4 space-y-3"
                style={{ borderColor: '#e5e7eb' }}>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <div ref={departmentBoxRef} className="relative">
                      <input
                        type="text"
                        value={departmentSearch}
                        onChange={(e) => {
                          setDepartmentSearch(e.target.value);
                          setDepartmentOpen(true);
                        }}
                        onFocus={() => setDepartmentOpen(true)}
                        placeholder={departmentsLoading ? 'Loading departments...' : (selectedDepartment || 'All Departments')}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                        style={{ borderColor: '#d1d5db' }}
                      />

                      {departmentOpen && (
                        <div
                          className="absolute z-20 mt-2 w-full bg-white border rounded-xl shadow-lg overflow-hidden"
                          style={{ borderColor: '#e5e7eb' }}
                        >
                          <div className="max-h-64 overflow-y-auto">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedDepartment('');
                                setDepartmentSearch('');
                                setDepartmentOpen(false);
                                setPage(0);
                              }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between"
                            >
                              <span>All Departments</span>
                              {selectedDepartment === '' && <span className="text-gray-900">✓</span>}
                            </button>

                            {!departmentsLoading && filteredDepartments.length === 0 && (
                              <div className="px-3 py-2 text-sm text-gray-500">No departments found</div>
                            )}

                            {filteredDepartments.map((d) => (
                              <button
                                key={d}
                                type="button"
                                onClick={() => {
                                  setSelectedDepartment(d);
                                  setDepartmentSearch(d);
                                  setDepartmentOpen(false);
                                  setPage(0);
                                }}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between"
                              >
                                <span className="pr-2">{d}</span>
                                {selectedDepartment === d && <span className="text-gray-900">✓</span>}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <select value={selectedState} onChange={(e) => { setSelectedState(e.target.value); setPage(0); }}
                    className="px-3 py-2 border rounded-lg text-sm" style={{ borderColor: '#d1d5db' }}>
                    <option value="">{statesLoading ? 'Loading states...' : 'All States'}</option>
                    {states.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <select value={selectedCity} onChange={(e) => { setSelectedCity(e.target.value); setPage(0); }} disabled={!selectedState}
                    className="px-3 py-2 border rounded-lg text-sm" style={{ borderColor: '#d1d5db' }}>
                    <option value="">{!selectedState ? 'Select state first' : (citiesLoading ? 'Loading cities...' : 'All Cities')}</option>
                    {cities.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => { setFromDate(e.target.value); setPage(0); }}
                    className="px-3 py-2 border rounded-lg text-sm"
                    style={{ borderColor: '#d1d5db' }}
                  />
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => { setToDate(e.target.value); setPage(0); }}
                    className="px-3 py-2 border rounded-lg text-sm"
                    style={{ borderColor: '#d1d5db' }}
                  />
                </div>
                <button onClick={clearFilters} className="text-sm" style={{ color: '#f5820d' }}>Clear All Filters</button>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="bg-white rounded-xl p-16 text-center shadow-sm border" style={{ borderColor: '#e5e7eb' }}>
                <Loader2 size={40} className="animate-spin mx-auto mb-4" style={{ color: '#f5820d' }} />
                <p className="text-gray-500">Loading tenders...</p>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="bg-white rounded-xl p-16 text-center shadow-sm border" style={{ borderColor: '#e5e7eb' }}>
                <AlertCircle size={40} className="mx-auto mb-4 text-red-500" />
                <h3 className="font-semibold mb-2" style={{ color: '#1a4f72' }}>Error Loading Tenders</h3>
                <p className="text-gray-500 text-sm mb-4">{error}</p>
                <button onClick={() => refetch()}
                  className="px-4 py-2 rounded-lg text-sm text-white"
                  style={{ background: '#f5820d' }}>
                  Try Again
                </button>
              </div>
            )}

            {/* Results */}
            {!loading && !error && tenders.length === 0 ? (
              <div className="bg-white rounded-xl p-16 text-center shadow-sm border" style={{ borderColor: '#e5e7eb' }}>
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="font-semibold mb-2" style={{ color: '#1a4f72' }}>No tenders found</h3>
                <p className="text-gray-500 text-sm mb-4">Try adjusting your search filters</p>
                <button onClick={clearFilters}
                  className="px-4 py-2 rounded-lg text-sm text-white"
                  style={{ background: '#f5820d' }}>
                  Clear Filters
                </button>
              </div>
            ) : !loading && !error && viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {tenders.map((tender: Tender) => (
                  <TenderCard key={tender.id} tender={tender as any} viewMode="grid" />
                ))}
              </div>
            ) : !loading && !error && (
              <div className="space-y-3">
                {tenders.map((tender: Tender) => (
                  <TenderCard key={tender.id} tender={tender as any} viewMode="list" />
                ))}
              </div>
            )}

            {/* Pagination */}
            {!loading && !error && totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-4 py-2 rounded-lg border text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ borderColor: '#d1d5db', color: '#1a4f72' }}>
                  Previous
                </button>
                {Array.from({ length: endPage - startPage }, (_, i) => {
                  const p = startPage + i;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className="w-9 h-9 rounded-lg text-sm font-medium transition-colors"
                      style={page === p
                        ? { background: '#1a4f72', color: 'white' }
                        : { background: 'white', color: '#6b7280', border: '1px solid #d1d5db' }}
                    >
                      {p + 1}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-4 py-2 rounded-lg border text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ borderColor: '#d1d5db', color: '#1a4f72' }}>
                  Next
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
