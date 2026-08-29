-- ==============================================================================
-- FastPay Engine: Normalized Relational Database Schema (PostgreSQL Engine)
-- High Concurrency, ACID Double-Entry Ledger, Idempotency & Money Movement
-- Amounts are strictly stored as integer POISHA (1 BDT = 100 Poisha) in BIGINT
-- ==============================================================================

-- 1. Users Table (Demo profiles & standard auth)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(32) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    avatar TEXT,
    password_hash VARCHAR(255),
    phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
    pin VARCHAR(64) NOT NULL DEFAULT '1234',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Idempotent column additions for existing installations
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;

-- 2. Phone Verifications Table (OTP Lifecycle & Security)
CREATE TABLE IF NOT EXISTS phone_verifications (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    phone VARCHAR(32) NOT NULL,
    otp_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Wallets Table (One wallet per user with strict non-negative balance constraint)
CREATE TABLE IF NOT EXISTS wallets (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    currency VARCHAR(10) NOT NULL DEFAULT 'BDT',
    balance BIGINT NOT NULL DEFAULT 0 CHECK (balance >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'FROZEN', 'CLOSED')),
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Transactions Table (High-level business movement record)
CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(64) PRIMARY KEY,
    reference_id VARCHAR(64) UNIQUE NOT NULL,
    sender_wallet_id VARCHAR(64) REFERENCES wallets(id),
    receiver_wallet_id VARCHAR(64) REFERENCES wallets(id),
    type VARCHAR(32) NOT NULL CHECK (type IN ('TRANSFER', 'REQUEST_SETTLEMENT', 'SEED_FUNDING', 'BILL_SPLIT')),
    amount BIGINT NOT NULL CHECK (amount > 0),
    fee BIGINT NOT NULL DEFAULT 0 CHECK (fee >= 0),
    note TEXT,
    category VARCHAR(64) NOT NULL DEFAULT 'General',
    status VARCHAR(20) NOT NULL DEFAULT 'SUCCESS' CHECK (status IN ('SUCCESS', 'FAILED', 'PENDING')),
    idempotency_key VARCHAR(128) UNIQUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. Ledger Entries Table (Immutable Double-Entry Bookkeeping)
-- Invariant: Every transaction MUST have matched DEBIT and CREDIT entries with identical amounts
CREATE TABLE IF NOT EXISTS ledger_entries (
    id VARCHAR(64) PRIMARY KEY,
    transaction_id VARCHAR(64) NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    wallet_id VARCHAR(64) NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    entry_type VARCHAR(10) NOT NULL CHECK (entry_type IN ('DEBIT', 'CREDIT')),
    amount BIGINT NOT NULL CHECK (amount > 0),
    balance_after BIGINT NOT NULL CHECK (balance_after >= 0),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. Money Requests Table (P2P Invoices, Borrowing & Due Dates)
CREATE TABLE IF NOT EXISTS money_requests (
    id VARCHAR(64) PRIMARY KEY,
    requester_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    payer_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount BIGINT NOT NULL CHECK (amount > 0),
    note TEXT,
    due_date TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'EXPIRED')),
    transaction_id VARCHAR(64) REFERENCES transactions(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMPTZ
);

ALTER TABLE money_requests ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ;

-- 7. Connections Table (Friends & Family)
CREATE TABLE IF NOT EXISTS connections (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    connected_user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    relation_type VARCHAR(20) NOT NULL CHECK (relation_type IN ('FRIEND', 'FAMILY')),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_connection_pair UNIQUE (user_id, connected_user_id)
);

-- 8. Notifications Table (In-App Push & Debt Reminders)
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(32) NOT NULL CHECK (type IN ('MONEY_NEED', 'DEBT_REMINDER')),
    reference_id VARCHAR(64),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 9. Bill Splits Table (Multi-party Shared Expenses)
CREATE TABLE IF NOT EXISTS bill_splits (
    id VARCHAR(64) PRIMARY KEY,
    creator_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    total_amount BIGINT NOT NULL CHECK (total_amount > 0),
    category VARCHAR(32) NOT NULL DEFAULT 'RESTAURANT' CHECK (category IN ('RESTAURANT', 'TRAVEL', 'TOUR', 'TEAM_REGISTRATION')),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SETTLED')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 10. Bill Split Items Table (Individual Participant Shares)
CREATE TABLE IF NOT EXISTS bill_split_items (
    id VARCHAR(64) PRIMARY KEY,
    bill_split_id VARCHAR(64) NOT NULL REFERENCES bill_splits(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    share_amount BIGINT NOT NULL CHECK (share_amount > 0),
    is_paid BOOLEAN NOT NULL DEFAULT FALSE,
    paid_at TIMESTAMPTZ,
    transaction_id VARCHAR(64) REFERENCES transactions(id),
    CONSTRAINT unique_bill_participant UNIQUE (bill_split_id, user_id)
);

-- 11. Idempotency Records Table (Prevents duplicate requests / double debits)
CREATE TABLE IF NOT EXISTS idempotency_records (
    key VARCHAR(128) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status_code INT NOT NULL,
    response_body TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- Performance Indices
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_phone_verifications_phone ON phone_verifications(phone);
CREATE INDEX IF NOT EXISTS idx_phone_verifications_user_id ON phone_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_phone_verifications_created_at ON phone_verifications(created_at);
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_sender ON transactions(sender_wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_receiver ON transactions(receiver_wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_idempotency ON transactions(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_ledger_wallet_id ON ledger_entries(wallet_id);
CREATE INDEX IF NOT EXISTS idx_ledger_transaction_id ON ledger_entries(transaction_id);
CREATE INDEX IF NOT EXISTS idx_ledger_created_at ON ledger_entries(created_at);
CREATE INDEX IF NOT EXISTS idx_money_requests_requester ON money_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_money_requests_payer ON money_requests(payer_id);
CREATE INDEX IF NOT EXISTS idx_money_requests_status ON money_requests(status);
CREATE INDEX IF NOT EXISTS idx_connections_user ON connections(user_id);
CREATE INDEX IF NOT EXISTS idx_connections_connected ON connections(connected_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_bill_splits_creator ON bill_splits(creator_id);
CREATE INDEX IF NOT EXISTS idx_bill_split_items_split ON bill_split_items(bill_split_id);
CREATE INDEX IF NOT EXISTS idx_bill_split_items_user ON bill_split_items(user_id);
