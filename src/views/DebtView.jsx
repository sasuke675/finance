import React, { useState } from 'react';
import { Plus, Users } from 'lucide-react';
import { useDebts } from '../hooks/useDebts';
import { useAccounts } from '../hooks/useAccounts';
import { formatCurrency, formatShortDate } from '../lib/api';
import DebtPaymentModal from '../components/DebtPaymentModal';
import Modal from '../components/Modal';

const statusFilters = [
  { value: 'all', label: 'Semua' },
  { value: 'unpaid', label: 'Belum Lunas' },
  { value: 'partially_paid', label: 'Sebagian' },
  { value: 'paid', label: 'Lunas' },
];

const statusLabels = {
  unpaid: 'Belum Lunas',
  partially_paid: 'Sebagian',
  paid: 'Lunas',
};

export default function DebtView() {
  const {
    debts,
    totalUnpaid,
    loading,
    statusFilter,
    setStatusFilter,
    refresh,
    makePayment,
  } = useDebts();
  const { accounts, refresh: refreshAccounts } = useAccounts();

  const [selectedDebt, setSelectedDebt] = useState(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [addLoading, setAddLoading] = useState(false);

  // Add debt form state
  const [debtCustomer, setDebtCustomer] = useState('');
  const [debtAmount, setDebtAmount] = useState('');

  const handlePay = async (paymentData) => {
    setPayLoading(true);
    try {
      await makePayment(paymentData);
      refreshAccounts();
    } catch (err) {
      console.error(err);
      alert('Gagal memproses pembayaran: ' + err.message);
    } finally {
      setPayLoading(false);
    }
  };

  const handleAddDebt = async (e) => {
    e.preventDefault();
    const { createDebt } = await import('../lib/api');
    setAddLoading(true);
    try {
      await createDebt({
        customerName: debtCustomer,
        totalAmount: parseFloat(debtAmount),
      });
      setShowAddModal(false);
      setDebtCustomer('');
      setDebtAmount('');
      refresh();
    } catch (err) {
      console.error(err);
      alert('Gagal mencatat hutang: ' + err.message);
    } finally {
      setAddLoading(false);
    }
  };

  const openPayModal = (debt) => {
    setSelectedDebt(debt);
    setShowPayModal(true);
  };

  return (
    <div className="page-content" id="debt-view">
      {/* Header */}
      <div className="flex justify-between items-center mb-base">
        <h1 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700 }}>
          Daftar Hutang
        </h1>
        <button
          className="btn btn--danger btn--sm"
          onClick={() => setShowAddModal(true)}
          id="add-debt-btn"
        >
          <Plus size={16} />
          Catat
        </button>
      </div>

      {/* Total Unpaid */}
      <div className="card card--expense mb-base" style={{ textAlign: 'center', padding: 'var(--spacing-base) var(--spacing-lg)' }}>
        <div className="stat-card__label">Total Hutang Belum Lunas</div>
        <div className="stat-card__value stat-card__value--expense" id="total-unpaid-debt">
          {formatCurrency(totalUnpaid)}
        </div>
      </div>

      {/* Status Filters */}
      <div className="filter-bar">
        {statusFilters.map(({ value, label }) => (
          <button
            key={value}
            className={`filter-chip ${statusFilter === value ? 'active' : ''}`}
            onClick={() => setStatusFilter(value)}
            id={`debt-filter-${value}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Debt List */}
      {loading ? (
        <div className="spinner spinner--center" />
      ) : debts.length === 0 ? (
        <div className="empty-state">
          <Users className="empty-state__icon" />
          <div className="empty-state__title">Tidak ada hutang</div>
          <div className="empty-state__text">
            {statusFilter !== 'all'
              ? 'Tidak ada hutang dengan status ini.'
              : 'Belum ada hutang yang dicatat.'}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-sm">
          {debts.map((debt) => {
            const remaining = Number(debt.total_amount) - Number(debt.paid_amount);
            const progress =
              debt.total_amount > 0
                ? (Number(debt.paid_amount) / Number(debt.total_amount)) * 100
                : 0;

            return (
              <div key={debt.id} className="debt-card animate-in" id={`debt-${debt.id}`}>
                <div className="debt-card__header">
                  <div className="debt-card__name">{debt.customer_name}</div>
                  <span className={`debt-card__status debt-card__status--${debt.status}`}>
                    {statusLabels[debt.status]}
                  </span>
                </div>

                <div className="debt-card__amounts">
                  <span>
                    Dibayar: {formatCurrency(debt.paid_amount)} / {formatCurrency(debt.total_amount)}
                  </span>
                  <span>Sisa: {formatCurrency(remaining)}</span>
                </div>

                <div className="debt-card__progress">
                  <div
                    className="debt-card__progress-bar"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-muted" style={{ fontSize: 'var(--font-size-xs)' }}>
                    {formatShortDate(debt.created_at)}
                  </span>
                  {debt.status !== 'paid' && (
                    <button
                      className="btn btn--pay"
                      onClick={() => openPayModal(debt)}
                      id={`pay-btn-${debt.id}`}
                    >
                      Bayar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Payment Modal */}
      <DebtPaymentModal
        isOpen={showPayModal}
        onClose={() => {
          setShowPayModal(false);
          setSelectedDebt(null);
        }}
        debt={selectedDebt}
        accounts={accounts}
        onPay={handlePay}
        loading={payLoading}
      />

      {/* Add Debt Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Catat Hutang Baru"
      >
        <form onSubmit={handleAddDebt} id="add-debt-form">
          <div className="form-group mb-base">
            <label className="form-label" htmlFor="new-debt-customer">Nama Pelanggan</label>
            <input
              id="new-debt-customer"
              type="text"
              className="form-input"
              placeholder="Nama pelanggan..."
              value={debtCustomer}
              onChange={(e) => setDebtCustomer(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="form-group mb-base">
            <label className="form-label" htmlFor="new-debt-amount">Jumlah Hutang (Rp)</label>
            <input
              id="new-debt-amount"
              type="number"
              className="form-input"
              placeholder="0"
              value={debtAmount}
              onChange={(e) => setDebtAmount(e.target.value)}
              min="1"
              required
            />
          </div>
          <div className="form-actions">
            <button
              type="button"
              className="btn btn--secondary btn--full"
              onClick={() => setShowAddModal(false)}
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn btn--danger btn--full"
              disabled={addLoading || !debtCustomer || !debtAmount}
              id="add-debt-submit-btn"
            >
              {addLoading ? 'Menyimpan...' : 'Catat Hutang'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
