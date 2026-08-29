# Implementation Plan: NexusPay Engine (PSTU National Hackathon 2026)

Design and develop a resilient, enterprise-grade Money Movement Application that allows users to transfer, request, and split money with simulated BDT 100,000 balances, featuring a **Double-Entry Ledger**, **ACID Concurrency Protection**, **Idempotency**, and a **Live Concurrency & Stress Testing Studio**.

---

## 1. Architecture & Design Decisions

```
PSTU_hack_2026/
├── server/                         # Express + TypeScript + SQLite (WAL Mode)
│   ├── src/
│   │   ├── config/db.ts           # SQLite Database connection & WAL mode setup
│   │   ├── db/schema.sql          # DB Tables (Users, Wallets, Transactions, LedgerEntries, Requests, Splits)
│   │   ├── db/seeds.ts            # Seed 5 rich demo accounts with ৳100,000 balance each
│   │   ├── services/
│   │   │   ├── transferService.ts # Atomic transfer with BEGIN IMMEDIATE lock
│   │   │   ├── ledgerService.ts   # Double-entry ledger generation & mathematical audit verification
│   │   │   ├── requestService.ts  # Money request creation, accept, decline
│   │   │   ├── splitService.ts    # Multi-user bill splitting & settlement
│   │   │   └── stressService.ts   # Simulated concurrent batch transfers (20-50 simultaneous threads)
│   │   ├── middlewares/
│   │   │   ├── idempotency.ts     # Duplicate request suppression & replay
│   │   │   └── rateLimiter.ts     # Daily transfer limits & velocity checks
│   │   ├── controllers/           # Clean REST route handlers
│   │   ├── routes/                # Express API endpoints
│   │   └── server.ts              # Express App & Server entry point
├── client/                         # React + Vite + TypeScript + Tailwind CSS + Lucide + Framer Motion
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/Header.tsx  # User profile switcher (instant switch between 5 seeded demo users)
│   │   │   ├── wallet/            # Balance card, Quick Send, Quick Request, Daily Limit bar
│   │   │   ├── transfer/          # Send Money Modal with instant validation & animated receipt
│   │   │   ├── requests/          # Money Requests Drawer & Bill Splitter Hub
│   │   │   ├── ledger/            # Double-Entry Ledger Explorer with live audit checksum
│   │   │   └── stress/            # Live Concurrency & Stress Lab (The Judge Showcase)
│   │   ├── services/api.ts        # Typed Axios / Fetch client
│   │   ├── types/index.ts         # Shared TypeScript interfaces
│   │   ├── pages/Dashboard.tsx    # Main Command Center
│   │   └── App.tsx                # App Root with tab navigation
└── README.md                       # Architectural documentation, ACID defense, API docs & Demo guide
```

---

## 2. Proposed Implementation Steps

### Phase 1: Backend Foundation & Database Engine (Server)
1. Initialize Node.js TypeScript project in `server/`.
2. Configure `better-sqlite3` with WAL mode (`journal_mode = WAL`) and foreign key constraints for fast, isolated transactions.
3. Write `schema.sql` creating:
   - `users`: Profile, phone, email, avatar, PIN.
   - `wallets`: User FK, balance in cents/integers, status.
   - `transactions`: High-level transfer record with `idempotency_key`, `reference_id`, amount, status, category, notes.
   - `ledger_entries`: Double-entry rows (`DEBIT` on sender, `CREDIT` on receiver, `balance_after`).
   - `money_requests`: P2P invoices with statuses (`PENDING`, `ACCEPTED`, `DECLINED`, `EXPIRED`).
   - `bill_splits` & `bill_split_participants`: Multi-party expense settlement.
   - `idempotency_records`: Request deduplication cache.
4. Write seeder populating 5 active test accounts (e.g. Shakib, Tanmoy, Mehraj, Sadia, Rahim) with ৳100,000 initial balance and realistic prior transaction history.

### Phase 2: Transaction Engine, ACID Locking & Services
1. **Transfer Engine (`transferService.ts`)**:
   - Enforce `db.transaction()` / `BEGIN IMMEDIATE` to lock balances during execution.
   - Verify balance $\ge$ amount.
   - Execute debit on sender, credit on receiver.
   - Insert transaction record + twin `ledger_entries`.
   - Record idempotency key.
2. **Double-Entry Ledger Audit Service (`ledgerService.ts`)**:
   - Computes live checksum: $\sum \text{Debits} - \sum \text{Credits} \equiv 0$.
   - Provides full tamper-proof audit trail for judges.
3. **Money Requests & Bill Split Services (`requestService.ts`, `splitService.ts`)**:
   - Accept money request $\rightarrow$ triggers atomic transfer from payer to requester.
   - Settle split bill item $\rightarrow$ triggers atomic transfer from participant to creator.
4. **Concurrency & Stress Testing Engine (`stressService.ts`)**:
   - Simulates $N$ concurrent requests hitting an account with a specific balance (e.g., 20 simultaneous transfers of ৳500 from an account with only ৳1,000).
   - Collects per-request latency, success count, failure count, and confirms zero double-spend.

### Phase 3: High-Performance Frontend (Client)
1. Initialize React + Vite + TypeScript in `client/` with Tailwind CSS, Lucide icons, and Framer Motion.
2. Build **User Switcher**: A header dropdown to switch between the 5 seeded users seamlessly without needing tedious re-logins.
3. Build **Fintech Wallet Dashboard**:
   - Glowing gradient balance card (BDT ৳ 100,000).
   - Daily limit indicator and velocity tracker.
   - Quick Send & Quick Request buttons with contact avatar tray.
4. Build **Send Money Drawer**:
   - Recipient phone/name search with live lookup.
   - Amount keypad with quick presets (+500, +1000, +5000).
   - Category picker & personalized notes.
   - Animated transaction confirmation and downloadable/shareable digital receipt slip.
5. Build **Money Request & Bill Split Center**:
   - Incoming requests tab with instant [Pay Now] / [Decline] actions.
   - Bill Split creator: Split total evenly across chosen teammates, showing live payment progress badges.
6. Build **Double-Entry Ledger Explorer**:
   - Dual-column Debit/Credit inspection table.
   - Live "System Integrity Status: 100% Balanced (Zero Drift)" badge.
7. Build **Live Concurrency & Stress Testing Studio (The Judge Magnet)**:
   - Visual control panel: select concurrency level (5 to 50 threads), target accounts, and amounts.
   - Live execution bar showing real-time atomic resolution.
   - Detailed proof summary (e.g., "1 Succeeded, 19 Rejected, Final Balance ৳500, Discrepancy: ৳0.00").

### Phase 4: Documentation, Polishing & Demo Pitch Preparation
1. Create `README.md` with:
   - System Architecture Diagram (Mermaid).
   - Concurrency & Double-Spend Defense Explanation.
   - API Reference & Testing Instructions.
   - 3-Minute Live Demo Walkthrough Script for the team to present to judges.

---

## 3. Verification Plan

### Automated & Backend Tests
- Run automated concurrency test script: spawn 20 simultaneous HTTP requests attempting to drain a ৳1,000 balance $\rightarrow$ confirm exactly 2 requests of ৳500 succeed, 18 rejected with `INSUFFICIENT_FUNDS`, ledger balances 100% consistent.
- Test idempotency: send duplicate `Idempotency-Key` headers $\rightarrow$ verify exact same response returned without duplicate debit.

### Manual End-to-End Verification
- Switch to User 1 (Shakib) $\rightarrow$ Send ৳2,500 to User 2 (Tanmoy) $\rightarrow$ Switch to User 2 $\rightarrow$ Verify balance is ৳102,500, check transaction history & receipt.
- User 2 creates Money Request of ৳1,200 from User 1 $\rightarrow$ Switch to User 1 $\rightarrow$ Click "Pay Now" $\rightarrow$ Verify atomic settlement.
- Open Concurrency Studio $\rightarrow$ Run 20 threads live on screen $\rightarrow$ Verify visual charts & zero drift.
