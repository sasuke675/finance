import React, { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight } from 'lucide-react';

const CATEGORIES = [
  'Pulsa',
  'Kuota',
  'Listrik',
  'Token PLN',
  'BPJS',
  'Transfer',
  'Pembelian Stok',
  'Operasional',
  'Pelunasan Hutang',
  'Lainnya',
];

export default function TransactionForm({ accounts, onSubmit, onCancel, loading }) {
  const [type, setType] = useState('in');
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [targetAccountId, setTargetAccountId] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !accountId) return;
    if (type === 'transfer' && !targetAccountId) return;

    await onSubmit({
      type,
      amount: parseFloat(amount),
      accountId,
      targetAccountId: type === 'transfer' ? targetAccountId : null,
      description,
      category,
    });

    // Reset form
    setAmount('');
    setDescription('');
    setCategory('');
  };

  return (
    <form onSubmit={handleSubmit} id="transaction-form">
      {/* Type Selector */}
      <div className="type-selector mb-base">
        <button
          type="button"
          className={`type-selector__option ${type === 'in' ? 'active--in' : ''}`}
          onClick={() => setType('in')}
          id="type-in-btn"
        >
          <ArrowDownLeft size={14} style={{ display: 'inline', marginRight: 4 }} />
          Masuk
        </button>
        <button
          type="button"
          className={`type-selector__option ${type === 'out' ? 'active--out' : ''}`}
          onClick={() => setType('out')}
          id="type-out-btn"
        >
          <ArrowUpRight size={14} style={{ display: 'inline', marginRight: 4 }} />
          Keluar
        </button>
        <button
          type="button"
          className={`type-selector__option ${type === 'transfer' ? 'active--transfer' : ''}`}
          onClick={() => setType('transfer')}
          id="type-transfer-btn"
        >
          <ArrowLeftRight size={14} style={{ display: 'inline', marginRight: 4 }} />
          Transfer
        </button>
      </div>

      {/* Amount */}
      <div className="form-group mb-base">
        <label className="form-label" htmlFor="tx-amount">Jumlah (Rp)</label>
        <input
          id="tx-amount"
          type="number"
          className="form-input"
          placeholder="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min="1"
          required
          autoFocus
        />
      </div>

      {/* Account Selection */}
      <div className={type === 'transfer' ? 'form-row mb-base' : 'form-group mb-base'}>
        <div className="form-group">
          <label className="form-label" htmlFor="tx-account">
            {type === 'transfer' ? 'Dari Akun' : 'Akun'}
          </label>
          <select
            id="tx-account"
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

        {type === 'transfer' && (
          <div className="form-group">
            <label className="form-label" htmlFor="tx-target-account">Ke Akun</label>
            <select
              id="tx-target-account"
              className="form-select"
              value={targetAccountId}
              onChange={(e) => setTargetAccountId(e.target.value)}
              required
            >
              <option value="">Pilih tujuan</option>
              {accounts
                .filter((acc) => acc.id !== accountId)
                .map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
            </select>
          </div>
        )}
      </div>

      {/* Category */}
      <div className="form-group mb-base">
        <label className="form-label" htmlFor="tx-category">Kategori</label>
        <select
          id="tx-category"
          className="form-select"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">Pilih kategori</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Description */}
      <div className="form-group mb-base">
        <label className="form-label" htmlFor="tx-description">Keterangan</label>
        <input
          id="tx-description"
          type="text"
          className="form-input"
          placeholder="Opsional..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {/* Actions */}
      <div className="form-actions">
        {onCancel && (
          <button
            type="button"
            className="btn btn--secondary btn--full"
            onClick={onCancel}
            id="tx-cancel-btn"
          >
            Batal
          </button>
        )}
        <button
          type="submit"
          className={`btn btn--full ${type === 'out' ? 'btn--danger' : 'btn--primary'}`}
          disabled={loading || !amount || !accountId}
          id="tx-submit-btn"
        >
          {loading ? 'Menyimpan...' : 'Simpan Transaksi'}
        </button>
      </div>
    </form>
  );
}
