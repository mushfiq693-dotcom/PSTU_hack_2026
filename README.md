# FastPay / NexusPay Engine: Enterprise Money Movement Platform
**PSTU National Hackathon 2026 — Money Movement Application Challenge**

FastPay is an enterprise-grade digital money movement backend and frontend application built for high concurrency, zero financial discrepancy, strict ACID atomicity, double-entry auditability, and deterministic race condition defense.

---

## 🛠 Tech Stack
- **Backend**: Node.js, Express, TypeScript, Connection Pool (`pg.Pool`)
- **Database**: PostgreSQL (Row-Level `SELECT ... FOR UPDATE` Locking, Deterministic Order)
- **Financial Architecture**: Integer Poisha ($1\text{ BDT} = 100\text{ Poisha}$) in `BIGINT`, Double-Entry Immutable Ledger, Deterministic Idempotency
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Framer Motion, Lucide Icons

---

## 🌟 Core Features

1. **💸 Atomic P2P Money Transfers**:
   - Zero double-spending via PostgreSQL row-level locks.
   - Idempotency key replay protection (no duplicate charges on network retries).
   - Instant receipt generation with transaction hash and copyable reference ID.

2. **👥 Friends & Family Circle**:
   - Relationship tagging (`FRIEND` / `FAMILY`).
   - Connections-first quick tray in recipient picker for 1-tap transfers.

3. **⏳ Money Requests with Borrow Time Limits**:
   - Set repayment deadlines (`due_date`).
   - Query-time dynamic computed status (`OVERDUE`, `DUE_SOON`, `PENDING`) with visual badge warnings.

4. **🔔 Smart In-App Notifications**:
   - Real-time alerts for payment requests.
   - Dynamically synthesized debt reminders for overdue/due-soon loans without background cron lag.

5. **🍕 Universal Bill Splitting**:
   - Categories: **Restaurant & Dining**, **Travel & Transport**, **Tour & Hangouts**, **Team Registration**.
   - Reuses the exact same atomic `TransferService` (zero duplicate money-moving code).
   - Real-time progress bar and "Pay My Share" 1-click settlement.

6. **⚡ Concurrency & Stress Lab (The Showstopper)**:
   - Interactive live benchmark firing 20 to 50 simultaneous parallel threads on screen.
   - Visual thread outcome grid proving mathematical integrity ($\Delta = 0$).

---

## 🚀 Quick Start (Local Setup)

### 1. Database Setup
Ensure PostgreSQL is running locally on port `5432`:
```bash
createdb nexuspay
```

### 2. Start Backend Server (Terminal 1)
```bash
cd backend_files
npm install
npm run db:init
npm run db:seed
npm run dev
```
> 🟢 API runs at `http://localhost:5001`.

### 3. Start Frontend Application (Terminal 2)
```bash
cd frontend_files
npm install
npm run dev
```
> 🟢 Frontend runs at `http://localhost:5173`.

---

## 🛡 Concurrency & Financial Architecture Defense

### 1. Row-Level Locking (`SELECT ... FOR UPDATE`)
All balance mutations acquire row locks in **deterministic alphabetical order** of `user_id`. This guarantees:
- Serialization of concurrent requests.
- Zero deadlocks under cross-transfers ($A \rightarrow B$ and $B \rightarrow A$ at the exact same millisecond).
- Zero negative balances or double spending.

### 2. Double-Entry Bookkeeping
Every single transfer writes twin immutable ledger records:
- `DEBIT` on sender wallet with snapshot of `balance_after`.
- `CREDIT` on receiver wallet with snapshot of `balance_after`.
- Mathematical invariant:
  $$\sum \text{Debits} - \sum \text{Credits} \equiv 0$$

### 3. Idempotency Key Replay Protection
All mutation requests support `Idempotency-Key` headers. Duplicate requests are intercepted by middleware and return the original cached transaction receipt without re-debiting funds.
