import React, { useState } from 'react';
import { Plus, Users, Pencil } from 'lucide-react';
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddMoreModal, setShowAddMoreModal] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [addMoreLoading, setAddMoreLoading] = useState(false);

  // Add debt form state
  const [debtCustomer, setDebtCustomer] = useState('');
  const [debtAmount, setDebtAmount] = useState('');

  // Edit debt form state
  const [editingDebt, setEditingDebt] = useState(null);
  const [editCustomer, setEditCustomer] = useState('');
  const [editAmount, setEditAmount] = useState('');

  // Add more debt state (for existing customer)
  const [addMoreDebt, setAddMoreDebt] = useState(null);
  const [addMoreAmount, setAddMoreAmount] = useState('');

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

  const handleEditDebt = (debt) => {
    setEditingDebt(debt);
    setEditCustomer(debt.customer_name);
    setEditAmount(String(debt.total_amount));
    setShowEditModal(true);
  };

  const handleSaveEditDebt = async (e) => {
    e.preventDefault();
    const { updateDebt } = await import('../lib/api');
    setEditLoading(true);
    try {
      await updateDebt(editingDebt.id, {
        customerName: editCustomer,
        totalAmount: parseFloat(editAmount),
      });
      setShowEditModal(false);
      setEditingDebt(null);
      refresh();
    } catch (err) {
      console.error(err);
      alert('Gagal mengubah hutang: ' + err.message);
    } finally {
      setEditLoading(false);
    }
  };

  const handleOpenAddMore = (debt) => {
    setAddMoreDebt(debt);
    setAddMoreAmount('');
    setShowAddMoreModal(true);
  };

  const handleAddMoreDebt = async (e) => {
    e.preventDefault();
    const { updateDebt } = await import('../lib/api');
    setAddMoreLoading(true);
    try {
      const newTotal = Number(addMoreDebt.total_amount) + parseFloat(addMoreAmount);
      await updateDebt(addMoreDebt.id, {
        totalAmount: newTotal,
      });
      setShowAddMoreModal(false);
      setAddMoreDebt(null);
      setAddMoreAmount('');
      refresh();
    } catch (err) {
      console.error(err);
      alert('Gagal menambah hutang: ' + err.message);
    } finally {
      setAddMoreLoading(false);
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
                  <div className="debt-card__header-actions">
                    <button
                      className="debt-card__edit-btn"
                      onClick={() => handleEditDebt(debt)}
                      aria-label={`Edit hutang ${debt.customer_name}`}
                      id={`edit-debt-${debt.id}`}
                    >
                      <Pencil size={14} />
                    </button>
                    <span className={`debt-card__status debt-card__status--${debt.status}`}>
                      {statusLabels[debt.status]}
                    </span>
                  </div>
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
                  <div className="flex items-center gap-sm">
                    {debt.status !== 'paid' && (
                      <>
                        <button
                          className="btn btn--secondary btn--sm"
                          onClick={() => handleOpenAddMore(debt)}
                          id={`add-more-debt-${debt.id}`}
                          style={{ fontSize: 'var(--font-size-xs)', padding: '4px 10px' }}
                        >
                          <Plus size={13} />
                          Tambah
                        </button>
                        <button
                          className="btn btn--pay"
                          onClick={() => openPayModal(debt)}
                          id={`pay-btn-${debt.id}`}
                        >
                          Bayar
                        </button>
                      </>
                    )}
                  </div>
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

      {/* Edit Debt Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setEditingDebt(null); }}
        title="Edit Hutang"
      >
        {editingDebt && (
          <form onSubmit={handleSaveEditDebt} id="edit-debt-form">
            <div className="form-group mb-base">
              <label className="form-label" htmlFor="edit-debt-customer">Nama Pelanggan</label>
              <input
                id="edit-debt-customer"
                type="text"
                className="form-input"
                value={editCustomer}
                onChange={(e) => setEditCustomer(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="form-group mb-base">
              <label className="form-label" htmlFor="edit-debt-amount">Total Hutang (Rp)</label>
              <input
                id="edit-debt-amount"
                type="number"
                className="form-input"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                min="1"
                required
              />
            </div>
            {Number(editingDebt.paid_amount) > 0 && (
              <div className="card card--glass mb-base" style={{ padding: 'var(--spacing-md)' }}>
                <div className="text-muted" style={{ fontSize: 'var(--font-size-sm)' }}>
                  Sudah dibayar: <span className="text-income font-bold">{formatCurrency(editingDebt.paid_amount)}</span>
                </div>
              </div>
            )}
            <div className="form-actions">
              <button
                type="button"
                className="btn btn--secondary btn--full"
                onClick={() => { setShowEditModal(false); setEditingDebt(null); }}
              >
                Batal
              </button>
              <button
                type="submit"
                className="btn btn--primary btn--full"
                disabled={editLoading || !editCustomer || !editAmount}
                id="edit-debt-submit-btn"
              >
                {editLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Add More Debt Modal (add to existing customer) */}
      <Modal
        isOpen={showAddMoreModal}
        onClose={() => { setShowAddMoreModal(false); setAddMoreDebt(null); }}
        title="Tambah Hutang"
      >
        {addMoreDebt && (
          <form onSubmit={handleAddMoreDebt} id="add-more-debt-form">
            <div className="card card--glass mb-base" style={{ padding: 'var(--spacing-md)' }}>
              <div className="flex justify-between items-center mb-sm">
                <span className="text-muted" style={{ fontSize: 'var(--font-size-sm)' }}>Pelanggan</span>
                <span className="font-bold">{addMoreDebt.customer_name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted" style={{ fontSize: 'var(--font-size-sm)' }}>Hutang Saat Ini</span>
                <span className="text-expense font-bold">{formatCurrency(addMoreDebt.total_amount)}</span>
              </div>
            </div>
            <div className="form-group mb-base">
              <label className="form-label" htmlFor="add-more-amount">Tambahan Hutang (Rp)</label>
              <input
                id="add-more-amount"
                type="number"
                className="form-input"
                placeholder="0"
                value={addMoreAmount}
                onChange={(e) => setAddMoreAmount(e.target.value)}
                min="1"
                required
                autoFocus
              />
            </div>
            {addMoreAmount && parseFloat(addMoreAmount) > 0 && (
              <div className="card card--expense mb-base" style={{ padding: 'var(--spacing-md)', textAlign: 'center' }}>
                <span className="text-muted" style={{ fontSize: 'var(--font-size-sm)' }}>Total hutang baru: </span>
                <span className="text-expense font-bold">
                  {formatCurrency(Number(addMoreDebt.total_amount) + parseFloat(addMoreAmount))}
                </span>
              </div>
            )}
            <div className="form-actions">
              <button
                type="button"
                className="btn btn--secondary btn--full"
                onClick={() => { setShowAddMoreModal(false); setAddMoreDebt(null); }}
              >
                Batal
              </button>
              <button
                type="submit"
                className="btn btn--danger btn--full"
                disabled={addMoreLoading || !addMoreAmount}
                id="add-more-debt-submit-btn"
              >
                {addMoreLoading ? 'Menyimpan...' : 'Tambah Hutang'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
