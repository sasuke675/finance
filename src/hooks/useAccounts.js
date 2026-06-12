import { useState, useEffect, useCallback } from 'react';
import { fetchAccounts, createAccount } from '../lib/api';

export function useAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAccounts();
      setAccounts(data);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch accounts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addAccount = useCallback(async (accountData) => {
    const newAccount = await createAccount(accountData);
    setAccounts((prev) => [...prev, newAccount].sort((a, b) => a.name.localeCompare(b.name)));
    return newAccount;
  }, []);

  const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);

  const groupedAccounts = {
    cash: accounts.filter((a) => a.type === 'cash'),
    bank: accounts.filter((a) => a.type === 'bank'),
    ewallet: accounts.filter((a) => a.type === 'ewallet'),
  };

  return {
    accounts,
    groupedAccounts,
    totalBalance,
    loading,
    error,
    refresh: load,
    addAccount,
  };
}
