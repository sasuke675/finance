import React, { useState } from 'react';
import Modal from './Modal';
import { formatCurrency } from '../lib/api';

export default function DebtPaymentModal({ isOpen, onClose, debt, accounts, onPay, loading }) {
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');

  if (!debt) return null;

  const remaining = Number(debt.total_amount) - Number(debt.paid_amount);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payAmount = parseFloat(amount);
    if (!payAmount || !accountId) return;
    if (payAmount > remaining) return;

    await onPay({
      debtId: debt.id,
      amount: payAmount,
      accountId,
    });

    setAmount('');
    onClose();
  };

  const handlePayFull = () => {
    setAmount(remaining.toString());
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Bayar Hutang">
      <div className="card card--glass" style={{ marginBottom: 'var(--spacing-base)' }}>
        <div className="flex justify-between items-center mb-sm">
          <span className="text-muted" style={{ fontSize: 'var(--font-size-sm)' }}>Pelanggan</span>
          <span className="font-bold">{debt.customer_name}</span>
        </div>
        <div className="flex justify-between items-center mb-sm">
          <span className="text-muted" style={{ fontSize: 'var(--font-size-sm)' }}>Total Hutang</span>
          <span className="font-semibold">{formatCurrency(debt.total_amount)}</span>
        </div>
        <div className="flex justify-between items-center mb-sm">
          <span className="text-muted" style={{ fontSize: 'var(--font-size-sm)' }}>Sudah Dibayar</span>
          <span className="text-income font-semibold">{formatCurrency(debt.paid_amount)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted" style={{ fontSize: 'var(--font-size-sm)' }}>Sisa</span>
          <span className="text-expense font-bold">{formatCurrency(remaining)}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} id="debt-payment-form">
        <div className="form-group mb-base">
          <label className="form-label" htmlFor="pay-amount">Jumlah Bayar (Rp)</label>
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
            <input
              id="pay-amount"
              type="number"
              className="form-input"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1"
              max={remaining}
              required
              autoFocus
            />
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              onClick={handlePayFull}
              style={{ whiteSpace: 'nowrap' }}
              id="pay-full-btn"
            >
              Lunas
            </button>
          </div>
        </div>

        <div className="form-group mb-base">
          <label className="form-label" htmlFor="pay-account">Masuk ke Akun</label>
          <select
            id="pay-account"
            className="form-select"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            required
          >
            <option value="">Pilih akun</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="btn btn--primary btn--full"
          disabled={loading || !amount || !accountId || parseFloat(amount) > remaining}
          id="pay-submit-btn"
        >
          {loading ? 'Memproses...' : `Bayar ${amount ? formatCurrency(parseFloat(amount)) : ''}`}
        </button>
      </form>
    </Modal>
  );
}
