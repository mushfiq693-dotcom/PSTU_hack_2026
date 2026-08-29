# NexusPay Engine: Enterprise Money Movement Platform
**PSTU National Hackathon 2026 — Money Movement Application Challenge**

NexusPay is an enterprise-grade digital money movement backend and frontend application built for high concurrency, zero financial discrepancy, strict ACID atomicity, double-entry auditability, and deterministic race condition defense.

---

## 🛠 Tech Stack
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL 16 (Row-Level `SELECT ... FOR UPDATE` Locking, Connection Pool)
- **Financial Architecture**: Integer Poisha ($1\text{ BDT} = 100\text{ Poisha}$) in `BIGINT`, Double-Entry Immutable Ledger, Deterministic Idempotency
- **Frontend**: React, Vite, TypeScript, Tailwind CSS, Lucide Icons

---

## 🚀 Quick Start (Backend)

### 1. Configure Environment
In `backend_files/`:
```bash
cp .env.example .env
```
Ensure PostgreSQL is running on `localhost:5432` with database `nexuspay`:
```bash
createdb nexuspay
```

### 2. Install & Seed
```bash
cd backend_files
npm install
npm run db:init
npm run db:seed
```

### 3. Run Verification Tests
```bash
# Run database constraint verification
npm run db:test

# Run full integration & concurrency stress test
npm run test
```

### 4. Start Server
```bash
npm run dev
```
Server runs at `http://localhost:5001`.

---

## 🛡 Concurrency & Financial Defense

### 1. Row-Level Locking (`SELECT ... FOR UPDATE`)
All balance mutations in `TransferService` acquire row-level locks on sender and receiver wallets in deterministic alphabetical order of `user_id`. This guarantees:
- Complete serialization of concurrent requests.
- Zero deadlocks under cross-transfers (A $\rightarrow$ B and B $\rightarrow$ A simultaneously).
- Zero double spending under high-concurrency bursts.

### 2. Double-Entry Bookkeeping
Every transaction creates twin immutable ledger records:
- `DEBIT` on sender wallet with snapshot of `balance_after`.
- `CREDIT` on receiver wallet with snapshot of `balance_after`.
- Invariant verified via `/api/ledger/audit`:
  $$\sum \text{Debits} - \sum \text{Credits} \equiv 0$$

### 3. Idempotency Key Replay
Mutation requests support `Idempotency-Key` headers. Duplicate requests are intercepted by middleware and return the original transaction receipt without performing redundant debits.
