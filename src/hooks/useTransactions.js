import { useState, useEffect, useCallback } from 'react';
import { fetchTransactions, createTransaction } from '../lib/api';

export function useTransactions(initialFilters = {}) {
  const [transactions, setTransactions] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchTransactions(filters);
      setTransactions(data);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch transactions:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  const addTransaction = useCallback(async (transactionData) => {
    await createTransaction(transactionData);
    // Refresh list after adding
    await load();
  }, [load]);

  const updateFilters = useCallback((newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  return {
    transactions,
    loading,
    error,
    filters,
    updateFilters,
    refresh: load,
    addTransaction,
  };
}
