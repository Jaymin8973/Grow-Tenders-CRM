import { useState, useEffect, useCallback } from 'react';
import { api, Tender, Category, TenderStats, PaginatedResponse } from './api';

// Hook for fetching tenders with pagination
export function useTenders(params?: {
  category?: string;
  search?: string;
  state?: string;
  city?: string;
  department?: string;
  ministry?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
  offset?: number;
}) {
  const [data, setData] = useState<Tender[]>([]);
  const [pagination, setPagination] = useState({ total: 0, limit: 20, offset: 0, hasMore: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result: PaginatedResponse<Tender> = await api.getTenders(params);
      setData(result.data);
      setPagination(result.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tenders');
    } finally {
      setLoading(false);
    }
  }, [params?.category, params?.search, params?.state, params?.city, params?.department, params?.ministry, params?.status, params?.fromDate, params?.toDate, params?.limit, params?.offset]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, pagination, loading, error, refetch: fetchData };
}

// Hook for fetching all tenders (auto-loads every page)
export function useAllTenders(params?: {
  category?: string;
  search?: string;
  state?: string;
  city?: string;
  ministry?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
}) {
  const [data, setData] = useState<Tender[]>([]);
  const [pagination, setPagination] = useState({ total: 0, limit: 0, offset: 0, hasMore: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const batchSize = 100;
      let offset = 0;
      let total = 0;
      const all: Tender[] = [];

      while (true) {
        const result: PaginatedResponse<Tender> = await api.getTenders({
          ...params,
          limit: batchSize,
          offset,
        });

        if (offset === 0) {
          total = result.pagination.total;
        }

        all.push(...result.data);

        offset += result.pagination.limit;

        if (offset >= total || result.data.length === 0 || !result.pagination.hasMore) {
          setPagination({
            total,
            limit: batchSize,
            offset,
            hasMore: false,
          });
          break;
        }
      }

      setData(all);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tenders');
    } finally {
      setLoading(false);
    }
  }, [params?.category, params?.search, params?.state, params?.city, params?.ministry, params?.status, params?.fromDate, params?.toDate]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { data, pagination, loading, error, refetch: fetchAll };
}

// Hook for fetching a single tender
export function useTender(id: string | undefined) {
  const [tender, setTender] = useState<Tender | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const fetchTender = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await api.getTenderById(id);
        setTender(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch tender');
      } finally {
        setLoading(false);
      }
    };

    fetchTender();
  }, [id]);

  return { tender, loading, error };
}

// Hook for fetching categories
export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await api.getCategories();
        // Categories now come from tender.categoryName (same as CRM)
        setCategories(result.map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          count: cat.count || 0,
        })));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch categories');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, loading, error };
}

export function useTenderStates() {
  const [states, setStates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStates = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await api.getTenderStates();
        setStates(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch states');
      } finally {
        setLoading(false);
      }
    };

    fetchStates();
  }, []);

  return { states, loading, error };
}

export function useTenderCities(state: string) {
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCities = async () => {
      if (!state) {
        setCities([]);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const result = await api.getTenderCities(state);
        setCities(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch cities');
      } finally {
        setLoading(false);
      }
    };

    fetchCities();
  }, [state]);

  return { cities, loading, error };
}

export function useTenderDepartments() {
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDepartments = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await api.getTenderDepartments();
        setDepartments(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch departments');
      } finally {
        setLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  return { departments, loading, error };
}

// Hook for fetching stats
export function useStats() {
  const [stats, setStats] = useState<TenderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await api.getStats();
        setStats(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading, error };
}
