import { supabase } from './supabase';

// =====================
// HELPERS
// =====================

export function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}

export function formatShortDate(dateString) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(dateString));
}

// =====================
// ACCOUNTS
// =====================

export async function fetchAccounts() {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .order('name');

  if (error) throw error;
  return data || [];
}

export async function createAccount({ name, type, balance = 0 }) {
  const { data, error } = await supabase
    .from('accounts')
    .insert({ name, type, balance })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateAccount(id, { name, type, balance }) {
  const updates = {};
  if (name !== undefined) updates.name = name;
  if (type !== undefined) updates.type = type;
  if (balance !== undefined) updates.balance = balance;

  const { data, error } = await supabase
    .from('accounts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteAccount(id) {
  const { error } = await supabase
    .from('accounts')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// =====================
// TRANSACTIONS
// =====================

export async function fetchTransactions({ accountId, type, startDate, endDate, limit = 50 } = {}) {
  let query = supabase
    .from('transactions')
    .select('*, account:accounts!account_id(name, type), target_account:accounts!target_account_id(name, type)')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (accountId) {
    query = query.eq('account_id', accountId);
  }
  if (type) {
    query = query.eq('type', type);
  }
  if (startDate) {
    query = query.gte('created_at', startDate);
  }
  if (endDate) {
    query = query.lte('created_at', endDate);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createTransaction({ accountId, type, amount, targetAccountId, description, category, adminFee, adminFeeAccountId }) {
  // Use RPC for atomic balance update
  const { data, error } = await supabase.rpc('create_transaction_with_balance', {
    p_account_id: accountId,
    p_type: type,
    p_amount: amount,
    p_target_account_id: targetAccountId || null,
    p_description: description || '',
    p_category: category || '',
    p_admin_fee: adminFee || 0,
    p_admin_fee_account_id: adminFeeAccountId || null,
  });

  if (error) throw error;
  return data;
}

export async function createSalesTransaction({ capitalAccountId, revenueAccountId, capitalAmount, sellingPrice, category, description }) {
  const { data, error } = await supabase.rpc('create_sales_transaction', {
    p_capital_account_id: capitalAccountId,
    p_revenue_account_id: revenueAccountId,
    p_capital_amount: capitalAmount,
    p_selling_price: sellingPrice,
    p_category: category || '',
    p_description: description || '',
  });

  if (error) throw error;
  return data;
}

// =====================
// DEBTS
// =====================

export async function fetchDebts(statusFilter) {
  let query = supabase
    .from('debts')
    .select('*')
    .order('created_at', { ascending: false });

  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createDebt({ customerName, totalAmount }) {
  const { data, error } = await supabase
    .from('debts')
    .insert({
      customer_name: customerName,
      total_amount: totalAmount,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateDebt(id, { customerName, totalAmount }) {
  const updates = {};
  if (customerName !== undefined) updates.customer_name = customerName;
  if (totalAmount !== undefined) updates.total_amount = totalAmount;

  const { data, error } = await supabase
    .from('debts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function payDebt({ debtId, amount, accountId }) {
  // Use RPC for atomic debt payment + balance update
  const { data, error } = await supabase.rpc('pay_debt_with_balance', {
    p_debt_id: debtId,
    p_amount: amount,
    p_account_id: accountId,
  });

  if (error) throw error;
  return data;
}

// =====================
// ANALYTICS
// =====================

export async function getMonthlyStats(year, month) {
  const { data, error } = await supabase.rpc('get_monthly_stats', {
    p_year: year,
    p_month: month,
  });

  if (error) throw error;
  return data || [];
}

export async function getMonthlyTotals(year, month) {
  // Get the first and last day of the month
  const startDate = new Date(year, month - 1, 1).toISOString();
  const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

  const { data, error } = await supabase
    .from('transactions')
    .select('type, amount')
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .in('type', ['in', 'out']);

  if (error) throw error;

  const totals = { income: 0, expense: 0 };
  (data || []).forEach((t) => {
    if (t.type === 'in') totals.income += Number(t.amount);
    if (t.type === 'out') totals.expense += Number(t.amount);
  });

  return totals;
}
