-- ============================================================
-- Financial Management App — Supabase Database Schema
-- Run this SQL in your Supabase SQL Editor to set up the DB.
-- ============================================================

-- =====================
-- 1. ENUM TYPES
-- =====================
CREATE TYPE account_type AS ENUM ('cash', 'bank', 'ewallet');
CREATE TYPE transaction_type AS ENUM ('in', 'out', 'transfer');
CREATE TYPE debt_status AS ENUM ('unpaid', 'partially_paid', 'paid');

-- =====================
-- 2. TABLES
-- =====================

-- Accounts table (wallets, banks, cash)
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type account_type NOT NULL,
  balance NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Transactions table (income, expense, transfer)
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  type transaction_type NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  target_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Debts table (customer debts / hutang)
CREATE TABLE debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  total_amount NUMERIC NOT NULL CHECK (total_amount > 0),
  paid_amount NUMERIC NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
  status debt_status NOT NULL DEFAULT 'unpaid',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================
-- 3. INDEXES
-- =====================
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_account_id ON transactions(account_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_debts_user_id ON debts(user_id);
CREATE INDEX idx_debts_status ON debts(status);

-- =====================
-- 4. ROW LEVEL SECURITY
-- =====================

-- Enable RLS on all tables
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;

-- Accounts policies
CREATE POLICY "Users can view own accounts"
  ON accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own accounts"
  ON accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own accounts"
  ON accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own accounts"
  ON accounts FOR DELETE
  USING (auth.uid() = user_id);

-- Transactions policies
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Debts policies
CREATE POLICY "Users can view own debts"
  ON debts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own debts"
  ON debts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own debts"
  ON debts FOR UPDATE
  USING (auth.uid() = user_id);

-- =====================
-- 5. RPC FUNCTIONS (Atomic Operations)
-- =====================

-- Function: Create transaction with automatic balance update
CREATE OR REPLACE FUNCTION create_transaction_with_balance(
  p_user_id UUID,
  p_account_id UUID,
  p_type transaction_type,
  p_amount NUMERIC,
  p_target_account_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT '',
  p_category TEXT DEFAULT ''
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transaction_id UUID;
BEGIN
  -- Insert the transaction record
  INSERT INTO transactions (user_id, account_id, type, amount, target_account_id, description, category)
  VALUES (p_user_id, p_account_id, p_type, p_amount, p_target_account_id, p_description, p_category)
  RETURNING id INTO v_transaction_id;

  -- Update balances based on transaction type
  IF p_type = 'in' THEN
    UPDATE accounts SET balance = balance + p_amount WHERE id = p_account_id AND user_id = p_user_id;
  ELSIF p_type = 'out' THEN
    UPDATE accounts SET balance = balance - p_amount WHERE id = p_account_id AND user_id = p_user_id;
  ELSIF p_type = 'transfer' THEN
    -- Decrement source account
    UPDATE accounts SET balance = balance - p_amount WHERE id = p_account_id AND user_id = p_user_id;
    -- Increment target account
    UPDATE accounts SET balance = balance + p_amount WHERE id = p_target_account_id AND user_id = p_user_id;
  END IF;

  RETURN v_transaction_id;
END;
$$;

-- Function: Pay debt with automatic balance update and debt status change
CREATE OR REPLACE FUNCTION pay_debt_with_balance(
  p_user_id UUID,
  p_debt_id UUID,
  p_amount NUMERIC,
  p_account_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transaction_id UUID;
  v_debt RECORD;
  v_new_paid NUMERIC;
  v_new_status debt_status;
  v_customer_name TEXT;
BEGIN
  -- Get current debt info
  SELECT * INTO v_debt FROM debts WHERE id = p_debt_id AND user_id = p_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Debt not found';
  END IF;

  v_customer_name := v_debt.customer_name;
  v_new_paid := v_debt.paid_amount + p_amount;

  -- Determine new status
  IF v_new_paid >= v_debt.total_amount THEN
    v_new_status := 'paid';
    v_new_paid := v_debt.total_amount; -- Cap at total
  ELSE
    v_new_status := 'partially_paid';
  END IF;

  -- Create income transaction for the payment
  INSERT INTO transactions (user_id, account_id, type, amount, description, category)
  VALUES (p_user_id, p_account_id, 'in', p_amount, 'Pelunasan hutang: ' || v_customer_name, 'Pelunasan Hutang')
  RETURNING id INTO v_transaction_id;

  -- Update account balance
  UPDATE accounts SET balance = balance + p_amount WHERE id = p_account_id AND user_id = p_user_id;

  -- Update debt record
  UPDATE debts SET paid_amount = v_new_paid, status = v_new_status WHERE id = p_debt_id AND user_id = p_user_id;

  RETURN v_transaction_id;
END;
$$;

-- Function: Get monthly stats for analytics
CREATE OR REPLACE FUNCTION get_monthly_stats(
  p_user_id UUID,
  p_year INTEGER,
  p_month INTEGER
)
RETURNS TABLE (
  day INTEGER,
  total_in NUMERIC,
  total_out NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    EXTRACT(DAY FROM t.created_at)::INTEGER AS day,
    COALESCE(SUM(CASE WHEN t.type = 'in' THEN t.amount ELSE 0 END), 0) AS total_in,
    COALESCE(SUM(CASE WHEN t.type = 'out' THEN t.amount ELSE 0 END), 0) AS total_out
  FROM transactions t
  WHERE t.user_id = p_user_id
    AND EXTRACT(YEAR FROM t.created_at) = p_year
    AND EXTRACT(MONTH FROM t.created_at) = p_month
    AND t.type IN ('in', 'out')
  GROUP BY EXTRACT(DAY FROM t.created_at)
  ORDER BY day;
END;
$$;
