-- ============================================================
-- Financial Management App — Supabase Database Schema
-- Run this SQL in your Supabase SQL Editor to set up the DB.
-- ============================================================

-- =====================
-- 1. ENUM TYPES
-- =====================
DO $$ BEGIN
  CREATE TYPE account_type AS ENUM ('cash', 'bank', 'ewallet');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE transaction_type AS ENUM ('in', 'out', 'transfer');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE debt_status AS ENUM ('unpaid', 'partially_paid', 'paid');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =====================
-- 2. DROP EXISTING (for re-running)
-- =====================
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS debts CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;

-- =====================
-- 3. TABLES
-- =====================

-- Accounts table (wallets, banks, cash)
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type account_type NOT NULL,
  balance NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Transactions table (income, expense, transfer)
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  customer_name TEXT NOT NULL,
  total_amount NUMERIC NOT NULL CHECK (total_amount > 0),
  paid_amount NUMERIC NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
  status debt_status NOT NULL DEFAULT 'unpaid',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================
-- 4. INDEXES
-- =====================
CREATE INDEX idx_transactions_account_id ON transactions(account_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_debts_status ON debts(status);

-- =====================
-- 5. ROW LEVEL SECURITY
-- =====================

-- Enable RLS on all tables
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;

-- Allow full access via anon key (single-operator app, no auth)
CREATE POLICY "Allow all access to accounts"
  ON accounts FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all access to transactions"
  ON transactions FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all access to debts"
  ON debts FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================
-- 6. RPC FUNCTIONS (Atomic Operations)
-- =====================

-- Function: Create transaction with automatic balance update
CREATE OR REPLACE FUNCTION create_transaction_with_balance(
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
  INSERT INTO transactions (account_id, type, amount, target_account_id, description, category)
  VALUES (p_account_id, p_type, p_amount, p_target_account_id, p_description, p_category)
  RETURNING id INTO v_transaction_id;

  -- Update balances based on transaction type
  IF p_type = 'in' THEN
    UPDATE accounts SET balance = balance + p_amount WHERE id = p_account_id;
  ELSIF p_type = 'out' THEN
    UPDATE accounts SET balance = balance - p_amount WHERE id = p_account_id;
  ELSIF p_type = 'transfer' THEN
    -- Decrement source account
    UPDATE accounts SET balance = balance - p_amount WHERE id = p_account_id;
    -- Increment target account
    UPDATE accounts SET balance = balance + p_amount WHERE id = p_target_account_id;
  END IF;

  RETURN v_transaction_id;
END;
$$;

-- Function: Pay debt with automatic balance update and debt status change
CREATE OR REPLACE FUNCTION pay_debt_with_balance(
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
  SELECT * INTO v_debt FROM debts WHERE id = p_debt_id;
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
  INSERT INTO transactions (account_id, type, amount, description, category)
  VALUES (p_account_id, 'in', p_amount, 'Pelunasan hutang: ' || v_customer_name, 'Pelunasan Hutang')
  RETURNING id INTO v_transaction_id;

  -- Update account balance
  UPDATE accounts SET balance = balance + p_amount WHERE id = p_account_id;

  -- Update debt record
  UPDATE debts SET paid_amount = v_new_paid, status = v_new_status WHERE id = p_debt_id;

  RETURN v_transaction_id;
END;
$$;

-- Function: Get monthly stats for analytics
CREATE OR REPLACE FUNCTION get_monthly_stats(
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
  WHERE EXTRACT(YEAR FROM t.created_at) = p_year
    AND EXTRACT(MONTH FROM t.created_at) = p_month
    AND t.type IN ('in', 'out')
  GROUP BY EXTRACT(DAY FROM t.created_at)
  ORDER BY day;
END;
$$;
