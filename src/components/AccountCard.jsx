import React from 'react';
import { Banknote, Building2, Smartphone, Pencil, Trash2 } from 'lucide-react';
import { formatCurrency } from '../lib/api';

const typeIcons = {
  cash: Banknote,
  bank: Building2,
  ewallet: Smartphone,
};

const typeLabels = {
  cash: 'Tunai',
  bank: 'Bank',
  ewallet: 'E-Wallet',
};

export default function AccountCard({ account, onEdit, onDelete }) {
  const Icon = typeIcons[account.type] || Banknote;

  return (
    <div className="account-card animate-in" id={`account-${account.id}`}>
      <div className={`account-card__icon account-card__icon--${account.type}`}>
        <Icon size={20} />
      </div>
      <div className="account-card__info">
        <div className="account-card__name">{account.name}</div>
        <div className="account-card__type">{typeLabels[account.type]}</div>
      </div>
      <div className="account-card__balance">
        {formatCurrency(account.balance)}
      </div>
      {(onEdit || onDelete) && (
        <div className="account-card__actions">
          {onEdit && (
            <button
              className="account-card__action-btn"
              onClick={() => onEdit(account)}
              aria-label={`Edit ${account.name}`}
              id={`edit-account-${account.id}`}
            >
              <Pencil size={15} />
            </button>
          )}
          {onDelete && (
            <button
              className="account-card__action-btn account-card__action-btn--delete"
              onClick={() => onDelete(account)}
              aria-label={`Hapus ${account.name}`}
              id={`delete-account-${account.id}`}
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
