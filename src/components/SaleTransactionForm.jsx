import React, { useState } from 'react';
import { ArrowRight, HelpCircle } from 'lucide-react';
import { formatCurrency } from '../lib/api';

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
  'Fee/Biaya Admin',
  'Lainnya',
];

export default function SaleTransactionForm({ accounts, onSubmit, onCancel, loading }) {
  const [capitalAmount, setCapitalAmount] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [capitalAccountId, setCapitalAccountId] = useState(accounts[0]?.id || '');
  const [revenueAccountId, setRevenueAccountId] = useState(accounts[1]?.id || accounts[0]?.id || '');
  const [category, setCategory] = useState('Pulsa');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!capitalAmount || !sellingPrice || !capitalAccountId || !revenueAccountId) return;

    await onSubmit({
      capitalAccountId,
      revenueAccountId,
      capitalAmount: parseFloat(capitalAmount),
      sellingPrice: parseFloat(sellingPrice),
      category,
      description,
    });

    // Reset form
    setCapitalAmount('');
    setSellingPrice('');
    setDescription('');
  };

  const cap = parseFloat(capitalAmount) || 0;
  const sell = parseFloat(sellingPrice) || 0;
  const calculatedFee = sell - cap;

  return (
    <form onSubmit={handleSubmit} id="sale-transaction-form">
      {/* Capital Amount */}
      <div className="form-group mb-base">
        <label className="form-label" htmlFor="sale-capital">Modal Awal (Rp)</label>
        <input
          id="sale-capital"
          type="number"
          className="form-input"
          placeholder="0"
          value={capitalAmount}
          onChange={(e) => setCapitalAmount(e.target.value)}
          min="1"
          required
          autoFocus
        />
      </div>

      {/* Selling Price */}
      <div className="form-group mb-base">
        <label className="form-label" htmlFor="sale-price">Harga Jual (Rp)</label>
        <input
          id="sale-price"
          type="number"
          className="form-input"
          placeholder="0"
          value={sellingPrice}
          onChange={(e) => setSellingPrice(e.target.value)}
          min="1"
          required
        />
      </div>

      {/* Dynamic Profit / Fee Indicator */}
      {(capitalAmount || sellingPrice) && (
        <div 
          className="mb-base" 
          style={{
            padding: 'var(--spacing-md)',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 600,
            textAlign: 'center',
            background: calculatedFee > 0 
              ? 'var(--color-income-bg)' 
              : calculatedFee < 0 
                ? 'var(--color-debt-bg)' 
                : 'var(--color-bg-tertiary)',
            color: calculatedFee > 0 
              ? 'var(--color-income)' 
              : calculatedFee < 0 
                ? 'var(--color-debt)' 
                : 'var(--color-text-secondary)',
            border: `1px solid ${
              calculatedFee > 0 
                ? 'rgba(16, 185, 129, 0.2)' 
                : calculatedFee < 0 
                  ? 'rgba(239, 68, 68, 0.2)' 
                  : 'var(--color-border)'
            }`,
            transition: 'all var(--transition-fast)'
          }}
        >
          {calculatedFee > 0 && `Estimasi Fee/Keuntungan: +${formatCurrency(calculatedFee)}`}
          {calculatedFee < 0 && `Estimasi Rugi Penjualan: ${formatCurrency(calculatedFee)}`}
          {calculatedFee === 0 && `Break Even (Harga Jual = Modal)`}
        </div>
      )}

      {/* Account Selection Row */}
      <div className="form-row mb-base">
        <div className="form-group">
          <label className="form-label" htmlFor="sale-capital-account">Dari Akun (Modal)</label>
          <select
            id="sale-capital-account"
            className="form-select"
            value={capitalAccountId}
            onChange={(e) => setCapitalAccountId(e.target.value)}
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

        <div className="form-group">
          <label className="form-label" htmlFor="sale-revenue-account">Ke Akun (Penerimaan)</label>
          <select
            id="sale-revenue-account"
            className="form-select"
            value={revenueAccountId}
            onChange={(e) => setRevenueAccountId(e.target.value)}
            required
          >
            <option value="">Pilih tujuan</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Category */}
      <div className="form-group mb-base">
        <label className="form-label" htmlFor="sale-category">Kategori Penjualan</label>
        <select
          id="sale-category"
          className="form-select"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
        >
          {CATEGORIES.filter(cat => cat !== 'Fee/Biaya Admin').map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Description */}
      <div className="form-group mb-base">
        <label className="form-label" htmlFor="sale-description">Keterangan</label>
        <input
          id="sale-description"
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
            id="sale-cancel-btn"
          >
            Batal
          </button>
        )}
        <button
          type="submit"
          className="btn btn--primary btn--full"
          disabled={loading || !capitalAmount || !sellingPrice || !capitalAccountId || !revenueAccountId}
          id="sale-submit-btn"
          style={{ background: 'linear-gradient(135deg, var(--color-transfer), #7c3aed)', boxShadow: '0 2px 8px rgba(167, 139, 250, 0.3)' }}
        >
          {loading ? 'Menyimpan...' : 'Simpan Penjualan'}
        </button>
      </div>
    </form>
  );
}
