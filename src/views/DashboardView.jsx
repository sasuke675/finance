import React, { useState } from 'react';
import { Plus, FileText, Banknote, Building2, Smartphone, AlertTriangle, ShoppingBag } from 'lucide-react';
import { useAccounts } from '../hooks/useAccounts';
import { formatCurrency } from '../lib/api';
import AccountCard from '../components/AccountCard';
import Modal from '../components/Modal';
import TransactionForm from '../components/TransactionForm';
import SaleTransactionForm from '../components/SaleTransactionForm';

const groupConfig = {
  cash: { label: 'Tunai', icon: Banknote, colorClass: 'text-income' },
  bank: { label: 'Bank', icon: Building2, colorClass: 'text-wallet' },
  ewallet: { label: 'E-Wallet', icon: Smartphone, colorClass: 'text-transfer' },
};

export default function DashboardView() {
  const { accounts, groupedAccounts, totalBalance, loading, refresh } = useAccounts();
  const [showTxModal, setShowTxModal] = useState(false);
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showEditAccountModal, setShowEditAccountModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [txLoading, setTxLoading] = useState(false);
  const [saleLoading, setSaleLoading] = useState(false);

  // New account form state
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountType, setNewAccountType] = useState('cash');
  const [newAccountBalance, setNewAccountBalance] = useState('');

  // Edit account state
  const [editingAccount, setEditingAccount] = useState(null);
  const [editAccountName, setEditAccountName] = useState('');
  const [editAccountType, setEditAccountType] = useState('cash');
  const [editAccountBalance, setEditAccountBalance] = useState('');

  // Delete account state
  const [deletingAccount, setDeletingAccount] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Debt form state
  const [debtCustomer, setDebtCustomer] = useState('');
  const [debtAmount, setDebtAmount] = useState('');
  const [debtAccountId, setDebtAccountId] = useState('');
  const [debtLoading, setDebtLoading] = useState(false);

  const handleTxSubmit = async (data) => {
    const { createTransaction } = await import('../lib/api');
    setTxLoading(true);
    try {
      await createTransaction(data);
      setShowTxModal(false);
      refresh();
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan transaksi: ' + err.message);
    } finally {
      setTxLoading(false);
    }
  };

  const handleSaleSubmit = async (data) => {
    const { createSalesTransaction } = await import('../lib/api');
    setSaleLoading(true);
    try {
      await createSalesTransaction(data);
      setShowSaleModal(false);
      refresh();
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan transaksi penjualan: ' + err.message);
    } finally {
      setSaleLoading(false);
    }
  };

  const handleAddAccount = async (e) => {
    e.preventDefault();
    const { createAccount } = await import('../lib/api');
    try {
      await createAccount({
        name: newAccountName,
        type: newAccountType,
        balance: parseFloat(newAccountBalance) || 0,
      });
      setShowAccountModal(false);
      setNewAccountName('');
      setNewAccountType('cash');
      setNewAccountBalance('');
      refresh();
    } catch (err) {
      console.error(err);
      alert('Gagal menambah akun: ' + err.message);
    }
  };

  const handleEditAccount = (account) => {
    setEditingAccount(account);
    setEditAccountName(account.name);
    setEditAccountType(account.type);
    setEditAccountBalance(String(account.balance));
    setShowEditAccountModal(true);
  };

  const handleSaveEditAccount = async (e) => {
    e.preventDefault();
    const { updateAccount } = await import('../lib/api');
    try {
      await updateAccount(editingAccount.id, {
        name: editAccountName,
        type: editAccountType,
        balance: parseFloat(editAccountBalance) || 0,
      });
      setShowEditAccountModal(false);
      setEditingAccount(null);
      refresh();
    } catch (err) {
      console.error(err);
      alert('Gagal mengubah akun: ' + err.message);
    }
  };

  const handleDeleteAccount = (account) => {
    setDeletingAccount(account);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    const { deleteAccount } = await import('../lib/api');
    setDeleteLoading(true);
    try {
      await deleteAccount(deletingAccount.id);
      setShowDeleteConfirm(false);
      setDeletingAccount(null);
      refresh();
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus akun: ' + err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleAddDebt = async (e) => {
    e.preventDefault();
    const { createDebt } = await import('../lib/api');
    setDebtLoading(true);
    try {
      await createDebt({
        customerName: debtCustomer,
        totalAmount: parseFloat(debtAmount),
        accountId: debtAccountId || null,
      });
      setShowDebtModal(false);
      setDebtCustomer('');
      setDebtAmount('');
      setDebtAccountId('');
      refresh();
    } catch (err) {
      console.error(err);
      alert('Gagal mencatat hutang: ' + err.message);
    } finally {
      setDebtLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-content">
        <div className="spinner spinner--center" />
      </div>
    );
  }

  return (
    <div className="page-content" id="dashboard-view">
      {/* Hero Balance */}
      <div className="hero-balance">
        <div className="hero-balance__label">Total Saldo</div>
        <div className="hero-balance__amount" id="total-balance">
          {formatCurrency(totalBalance)}
        </div>
      </div>

      {/* Account Groups */}
      {Object.entries(groupConfig).map(([type, config]) => {
        const group = groupedAccounts[type];
        if (!group || group.length === 0) return null;
        const Icon = config.icon;

        return (
          <div className="account-group" key={type}>
            <div className="section-header">
              <div className="section-header__title">
                <Icon size={16} className={config.colorClass} />
                {config.label}
              </div>
              <span className="section-header__badge">{group.length}</span>
            </div>
            <div className="account-group__list">
              {group.map((account) => (
                <AccountCard
                  key={account.id}
                  account={account}
                  onEdit={handleEditAccount}
                  onDelete={handleDeleteAccount}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Empty state if no accounts */}
      {accounts.length === 0 && (
        <div className="empty-state">
          <Banknote className="empty-state__icon" />
          <div className="empty-state__title">Belum ada akun</div>
          <div className="empty-state__text">
            Tambahkan akun kas, bank, atau e-wallet untuk mulai mencatat transaksi.
          </div>
          <button
            className="btn btn--primary mt-lg"
            onClick={() => setShowAccountModal(true)}
            id="add-first-account-btn"
          >
            <Plus size={18} />
            Tambah Akun Pertama
          </button>
        </div>
      )}

      {/* FABs */}
      {accounts.length > 0 && (
        <div className="fab-container">
          <button
            className="fab fab--sale"
            onClick={() => setShowSaleModal(true)}
            id="fab-sale"
            aria-label="Transaksi Penjualan"
          >
            <ShoppingBag size={22} />
            <span className="fab__tooltip">+ Penjualan</span>
          </button>
          <button
            className="fab fab--income"
            onClick={() => setShowTxModal(true)}
            id="fab-transaction"
            aria-label="Tambah Transaksi"
          >
            <Plus size={24} />
            <span className="fab__tooltip">+ Transaksi</span>
          </button>
          <button
            className="fab fab--debt"
            onClick={() => setShowDebtModal(true)}
            id="fab-debt"
            aria-label="Catat Hutang"
          >
            <FileText size={22} />
            <span className="fab__tooltip">+ Catat Hutang</span>
          </button>
        </div>
      )}

      {/* Add Account button when accounts exist */}
      {accounts.length > 0 && (
        <button
          className="btn btn--ghost btn--full mt-lg"
          onClick={() => setShowAccountModal(true)}
          id="add-account-btn"
          style={{ fontSize: 'var(--font-size-sm)' }}
        >
          <Plus size={16} />
          Tambah Akun Baru
        </button>
      )}

      {/* Transaction Modal */}
      <Modal
        isOpen={showTxModal}
        onClose={() => setShowTxModal(false)}
        title="Transaksi Baru"
      >
        <TransactionForm
          accounts={accounts}
          onSubmit={handleTxSubmit}
          onCancel={() => setShowTxModal(false)}
          loading={txLoading}
        />
      </Modal>

      {/* Sales Transaction Modal */}
      <Modal
        isOpen={showSaleModal}
        onClose={() => setShowSaleModal(false)}
        title="Transaksi Penjualan Baru"
      >
        <SaleTransactionForm
          accounts={accounts}
          onSubmit={handleSaleSubmit}
          onCancel={() => setShowSaleModal(false)}
          loading={saleLoading}
        />
      </Modal>

      {/* Debt Modal */}
      <Modal
        isOpen={showDebtModal}
        onClose={() => setShowDebtModal(false)}
        title="Catat Hutang Baru"
      >
        <form onSubmit={handleAddDebt} id="debt-form">
          <div className="form-group mb-base">
            <label className="form-label" htmlFor="debt-customer">Nama Pelanggan</label>
            <input
              id="debt-customer"
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
            <label className="form-label" htmlFor="debt-amount">Jumlah Hutang (Rp)</label>
            <input
              id="debt-amount"
              type="number"
              className="form-input"
              placeholder="0"
              value={debtAmount}
              onChange={(e) => setDebtAmount(e.target.value)}
              min="1"
              required
            />
          </div>
          <div className="form-group mb-base">
            <label className="form-label" htmlFor="debt-account">Akun/Rekening Awal (Opsional)</label>
            <select
              id="debt-account"
              className="form-select"
              value={debtAccountId}
              onChange={(e) => setDebtAccountId(e.target.value)}
            >
              <option value="">Pilih akun (opsional)</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({formatCurrency(acc.balance)})
                </option>
              ))}
            </select>
          </div>
          <div className="form-actions">
            <button
              type="button"
              className="btn btn--secondary btn--full"
              onClick={() => setShowDebtModal(false)}
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn btn--danger btn--full"
              disabled={debtLoading || !debtCustomer || !debtAmount}
              id="debt-submit-btn"
            >
              {debtLoading ? 'Menyimpan...' : 'Catat Hutang'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Account Modal */}
      <Modal
        isOpen={showAccountModal}
        onClose={() => setShowAccountModal(false)}
        title="Tambah Akun Baru"
      >
        <form onSubmit={handleAddAccount} id="add-account-form">
          <div className="form-group mb-base">
            <label className="form-label" htmlFor="acc-name">Nama Akun</label>
            <input
              id="acc-name"
              type="text"
              className="form-input"
              placeholder="contoh: BCA, Cash, Dana..."
              value={newAccountName}
              onChange={(e) => setNewAccountName(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="form-group mb-base">
            <label className="form-label" htmlFor="acc-type">Tipe Akun</label>
            <select
              id="acc-type"
              className="form-select"
              value={newAccountType}
              onChange={(e) => setNewAccountType(e.target.value)}
              required
            >
              <option value="cash">Tunai (Cash)</option>
              <option value="bank">Bank</option>
              <option value="ewallet">E-Wallet</option>
            </select>
          </div>
          <div className="form-group mb-base">
            <label className="form-label" htmlFor="acc-balance">Saldo Awal (Rp)</label>
            <input
              id="acc-balance"
              type="number"
              className="form-input"
              placeholder="0"
              value={newAccountBalance}
              onChange={(e) => setNewAccountBalance(e.target.value)}
              min="0"
            />
          </div>
          <button
            type="submit"
            className="btn btn--primary btn--full"
            disabled={!newAccountName}
            id="acc-submit-btn"
          >
            Tambah Akun
          </button>
        </form>
      </Modal>

      {/* Edit Account Modal */}
      <Modal
        isOpen={showEditAccountModal}
        onClose={() => { setShowEditAccountModal(false); setEditingAccount(null); }}
        title="Edit Akun"
      >
        <form onSubmit={handleSaveEditAccount} id="edit-account-form">
          <div className="form-group mb-base">
            <label className="form-label" htmlFor="edit-acc-name">Nama Akun</label>
            <input
              id="edit-acc-name"
              type="text"
              className="form-input"
              value={editAccountName}
              onChange={(e) => setEditAccountName(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="form-group mb-base">
            <label className="form-label" htmlFor="edit-acc-type">Tipe Akun</label>
            <select
              id="edit-acc-type"
              className="form-select"
              value={editAccountType}
              onChange={(e) => setEditAccountType(e.target.value)}
              required
            >
              <option value="cash">Tunai (Cash)</option>
              <option value="bank">Bank</option>
              <option value="ewallet">E-Wallet</option>
            </select>
          </div>
          <div className="form-group mb-base">
            <label className="form-label" htmlFor="edit-acc-balance">Saldo (Rp)</label>
            <input
              id="edit-acc-balance"
              type="number"
              className="form-input"
              value={editAccountBalance}
              onChange={(e) => setEditAccountBalance(e.target.value)}
              min="0"
            />
          </div>
          <div className="form-actions">
            <button
              type="button"
              className="btn btn--secondary btn--full"
              onClick={() => { setShowEditAccountModal(false); setEditingAccount(null); }}
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn btn--primary btn--full"
              disabled={!editAccountName}
              id="edit-acc-submit-btn"
            >
              Simpan Perubahan
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Account Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => { setShowDeleteConfirm(false); setDeletingAccount(null); }}
        title="Hapus Akun"
      >
        {deletingAccount && (
          <div className="confirm-delete">
            <div className="confirm-delete__icon">
              <AlertTriangle size={24} />
            </div>
            <div className="confirm-delete__text">
              Yakin ingin menghapus akun{' '}
              <span className="confirm-delete__name">{deletingAccount.name}</span>?
              <br />
              Semua transaksi terkait akun ini juga akan terhapus.
            </div>
            <div className="form-actions" style={{ width: '100%' }}>
              <button
                className="btn btn--secondary btn--full"
                onClick={() => { setShowDeleteConfirm(false); setDeletingAccount(null); }}
              >
                Batal
              </button>
              <button
                className="btn btn--danger btn--full"
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
                id="confirm-delete-btn"
              >
                {deleteLoading ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
