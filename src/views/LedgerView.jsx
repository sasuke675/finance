import React, { useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Search,
  Plus,
} from 'lucide-react';
import { useTransactions } from '../hooks/useTransactions';
import { useAccounts } from '../hooks/useAccounts';
import { formatCurrency, formatDate } from '../lib/api';
import Modal from '../components/Modal';
import TransactionForm from '../components/TransactionForm';

const typeConfig = {
  in: { icon: ArrowDownLeft, label: 'Masuk', colorClass: 'in' },
  out: { icon: ArrowUpRight, label: 'Keluar', colorClass: 'out' },
  transfer: { icon: ArrowLeftRight, label: 'Transfer', colorClass: 'transfer' },
};

const filterTypes = [
  { value: '', label: 'Semua' },
  { value: 'in', label: 'Masuk' },
  { value: 'out', label: 'Keluar' },
  { value: 'transfer', label: 'Transfer' },
];

export default function LedgerView() {
  const { transactions, loading, filters, updateFilters, refresh } = useTransactions();
  const { accounts, refresh: refreshAccounts } = useAccounts();
  const [showForm, setShowForm] = useState(false);
  const [txLoading, setTxLoading] = useState(false);

  const handleTxSubmit = async (data) => {
    const { createTransaction } = await import('../lib/api');
    setTxLoading(true);
    try {
      await createTransaction(data);
      setShowForm(false);
      refresh();
      refreshAccounts();
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan transaksi: ' + err.message);
    } finally {
      setTxLoading(false);
    }
  };

  return (
    <div className="page-content" id="ledger-view">
      {/* Header */}
      <div className="flex justify-between items-center mb-base">
        <h1 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700 }}>
          Buku Kas
        </h1>
        <button
          className="btn btn--primary btn--sm"
          onClick={() => setShowForm(true)}
          id="add-tx-btn"
        >
          <Plus size={16} />
          Tambah
        </button>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        {filterTypes.map(({ value, label }) => (
          <button
            key={value}
            className={`filter-chip ${filters.type === value ? 'active' : ''}`}
            onClick={() => updateFilters({ type: value || undefined })}
            id={`filter-${value || 'all'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Date Filter */}
      <div className="form-row mb-base">
        <div className="form-group">
          <label className="form-label" htmlFor="filter-start-date">Dari</label>
          <input
            id="filter-start-date"
            type="date"
            className="form-input"
            value={filters.startDate || ''}
            onChange={(e) => updateFilters({ startDate: e.target.value || undefined })}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="filter-end-date">Sampai</label>
          <input
            id="filter-end-date"
            type="date"
            className="form-input"
            value={filters.endDate || ''}
            onChange={(e) => updateFilters({ endDate: e.target.value || undefined })}
          />
        </div>
      </div>

      {/* Transaction List */}
      {loading ? (
        <div className="spinner spinner--center" />
      ) : transactions.length === 0 ? (
        <div className="empty-state">
          <Search className="empty-state__icon" />
          <div className="empty-state__title">Belum ada transaksi</div>
          <div className="empty-state__text">
            Transaksi yang tercatat akan muncul di sini.
          </div>
        </div>
      ) : (
        <div className="transaction-list">
          {transactions.map((tx) => {
            const config = typeConfig[tx.type];
            const Icon = config.icon;

            return (
              <div
                key={tx.id}
                className="transaction-item animate-in"
                id={`tx-${tx.id}`}
              >
                <div className={`transaction-item__icon transaction-item__icon--${config.colorClass}`}>
                  <Icon size={18} />
                </div>
                <div className="transaction-item__info">
                  <div className="transaction-item__description">
                    {tx.description || tx.category || config.label}
                  </div>
                  <div className="transaction-item__meta">
                    <span>{tx.account?.name}</span>
                    {tx.type === 'transfer' && tx.target_account && (
                      <>
                        <span>→</span>
                        <span>{tx.target_account.name}</span>
                      </>
                    )}
                    <span>•</span>
                    <span>{formatDate(tx.created_at)}</span>
                  </div>
                </div>
                <div className={`transaction-item__amount transaction-item__amount--${config.colorClass}`}>
                  {tx.type === 'out' ? '−' : tx.type === 'in' ? '+' : ''}
                  {formatCurrency(tx.amount)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Transaction Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Transaksi Baru"
      >
        <TransactionForm
          accounts={accounts}
          onSubmit={handleTxSubmit}
          onCancel={() => setShowForm(false)}
          loading={txLoading}
        />
      </Modal>
    </div>
  );
}
