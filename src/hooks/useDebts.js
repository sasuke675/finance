import { useState, useEffect, useCallback } from 'react';
import { fetchDebts, createDebt, payDebt } from '../lib/api';

export function useDebts() {
  const [debts, setDebts] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchDebts(statusFilter);
      setDebts(data);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch debts:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const addDebt = useCallback(async (debtData) => {
    await createDebt(debtData);
    await load();
  }, [load]);

  const makePayment = useCallback(async (paymentData) => {
    await payDebt(paymentData);
    await load();
  }, [load]);

  const totalUnpaid = debts
    .filter((d) => d.status !== 'paid')
    .reduce((sum, d) => sum + (Number(d.total_amount) - Number(d.paid_amount)), 0);

  return {
    debts,
    totalUnpaid,
    loading,
    error,
    statusFilter,
    setStatusFilter,
    refresh: load,
    addDebt,
    makePayment,
  };
}
