# 🎤 FastPay: 3-Minute Live Demo Script & Judge Defense Cheat Sheet
> **PSTU National Hackathon 2026 — Final Pitch & Presentation Rehearsal Guide**

---

## ⏱️ Pitch Timeline & Demo Walkthrough (Exact 3-Minute Plan)

| Time | Stage | Action & Screen | Key Pitch Script (What to say) |
| :--- | :--- | :--- | :--- |
| **0:00 - 0:30** | **The Hook & Problem** | **Landing Page** | *"FinTech apps struggle with race conditions, double-spending, and partial ledger corruption. We built **FastPay**—an enterprise money movement engine built on PostgreSQL row-level pessimistic locking, double-entry accounting, and real-time anti-fraud heuristics."* |
| **0:30 - 1:15** | **P2P Movement & Real-Time Alerts** | **Dashboard & Send Money** | 1. Log in as **Shakib (01711223344)**.<br>2. Pick **Tanmoy** from the 1-tap **Friends & Family** circle.<br>3. Send **৳2,500** with note *"Hackathon dinner"*.<br>4. Switch persona to **Tanmoy**: Open the **Notification Bell** showing `💰 ৳2,500 Received from Shakib`.<br>*"Notice: The transfer is atomic, balance is stored in integer Poisha with zero floating point drift, and the notification arrives in real-time."* |
| **1:15 - 2:00** | **Due-Date Invoices & Universal Bill Split** | **Split Bills & Requests** | 1. Open **Split Bills**: Show the **৳1,200 Dinner Split** among 3 friends.<br>2. Click **Pay My Share (৳400)**: Show live animated progress bar.<br>3. Open **Requests**: Show loan request with tomorrow's deadline highlighted with a dynamic **`DUE_SOON`** badge.<br>*"All bill splits reuse the exact same atomic transaction engine—zero duplicate money logic."* |
| **2:00 - 2:40** | **Multi-Laptop Live Fraud Attack & Auto-Freeze** | **Laptop 1 (Hacker) & Laptop 2 (Shakib)** | 1. **Laptop 1 (Rogue Attacker)**: Fires a ৳95,000 liquidation attack or 6 rapid bursts.<br>2. **Laptop 1 Result**: Instantly blocked with **`403 FORBIDDEN (Fraud Intercepted)`**.<br>3. **Laptop 2 (Shakib)**: In real-time (2s), the dashboard turns red with **`🚨 SECURITY INTERVENTION: WALLET AUTO-FROZEN`** banner!<br>4. Click **"🛡️ Verify & Unfreeze Wallet"** to restore account with **৳0 loss**.<br>*"Our heuristic engine detects multi-vector anomalies and auto-freezes compromised accounts in real-time."* |
| **2:40 - 3:00** | **The Showstopper: Concurrency & Ledger Defense** | **Concurrency Studio & Ledger Audit** | 1. Click **⚡ Concurrency Lab** in top nav.<br>2. Fire **20 simultaneous parallel transfer threads** against a ৳1,000 balance.<br>3. Show the live results: **2 Success (৳500 $\times$ 2), 18 Gracefully Rejected**, Final Balance = ৳0, **Double-Spend = ZERO**.<br>4. Open **Ledger Audit**: Show $\sum \text{Debits} = \sum \text{Credits}$, Discrepancy = ৳0.00.<br>*"Even with 20 concurrent threads attacking the wallet at the same millisecond, PostgreSQL row-level locks guarantee zero double-spending and a 100% balanced ledger."* |

---

## 💻 2-Laptop Live Demo Setup Guide (Hackathon Rehearsal)

| Device | Persona & Setup | Live Action During Presentation |
| :--- | :--- | :--- |
| **💻 Laptop 1 (Attacker Screen)** | Logged in as **`😈 Rogue Attacker`** (`01799999999`) | 1. Open **Send Money** or **Fraud Radar**.<br>2. Target Shakib (`01711111111`) with **৳95,000** or 6 rapid bursts.<br>3. Show the red **`403 Forbidden Fraud Intercepted`** error. |
| **💻 Laptop 2 (Target Victim Screen)** | Logged in as **`Shakib Al Hasan`** (`01711111111`) | 1. Keep Dashboard open.<br>2. In 2 seconds, watch the **`🚨 CRITICAL FRAUD INTERVENTION — WALLET AUTO-FROZEN`** banner appear live!<br>3. Show that balance remains **৳100,000.00 (৳0 lost)**.<br>4. Click **`🛡️ Verify & Unfreeze Wallet`** to restore active state live! |

---

## 👥 Demo Personas Quick Reference

| Name | Phone | Role & Starting Balance | Test Actions |
| :--- | :--- | :--- | :--- |
| **Shakib Al Hasan** | `01711111111` | Verified Sender (৳100,000) | Send transfers, create splits, trigger concurrency lab, unfreeze wallet |
| **Tanmoy Roy** | `01722222222` | Verified Receiver (৳100,000) | Receive money, check notifications, settle split bills |
| **Mehraj Hossain** | `01733333333` | Contact (৳100,000) | Split participant, loan request |
| **Sadia Afrin** | `01744444444` | Family Contact (৳100,000) | Settle money requests, check due-date badges |
| **Rahim Uddin** | `01755555555` | Split Participant (৳100,000) | Bill split participant |
| **😈 Rogue Attacker** | `01799999999` | Rogue Device / Hacker | Multi-laptop attack simulations |

> 💡 **Pro-Tip**: Use the **"Reset all balances to ৳100k"** button in the profile dropdown anytime before your live demo to reset all test data instantly!

---

## 🛡️ Judge Q&A Defense Matrix (Top Questions & Killer Answers)

### Q1: *"How do you prevent race conditions and double-spending when 2 transactions happen simultaneously?"*
> **Answer**:  
> *"We use **PostgreSQL Pessimistic Row-Level Locking (`SELECT ... FOR UPDATE`)** inside an atomic transaction. Crucially, we lock the sender and receiver wallets in **deterministic sorted order by `wallet_id`**. This serializes concurrent mutations and mathematically prevents deadlocks even during cross-transfers ($A \rightarrow B$ and $B \rightarrow A$)."*

---

### Q2: *"Why are you using an Integer Poisha representation instead of standard decimals or floats?"*
> **Answer**:  
> *"In financial systems, IEEE-754 floating-point arithmetic introduces rounding drift (e.g. `0.1 + 0.2 = 0.30000000000000004`). We store all balances and amounts as integer **BIGINT Poisha** ($1\text{ BDT} = 100\text{ Poisha}$). Formatting to BDT occurs solely at the UI presentation boundary, guaranteeing $100\%$ zero-loss precision down to the last poisha."*

---

### Q3: *"What happens if the network drops and the user clicks 'Send' multiple times?"*
> **Answer**:  
> *"Every mutation endpoint is protected by our **SHA-256 Idempotency Key Middleware**. On duplicate requests with the same idempotency key, the backend intercepts the call before touching balances and returns the cached transaction receipt without executing duplicate debits."*

---

### Q4: *"How is your Double-Entry Ledger structured and audited?"*
> **Answer**:  
> *"Every transfer writes immutable twin records in `ledger_entries`—one DEBIT and one CREDIT with a snapshot of `balance_after`. Our system audit verifies the mathematical invariant $\sum \text{Debits} - \sum \text{Credits} \equiv 0$. No money can enter or exit the system unaccounted for."*

---

### Q5: *"How does your Fraud Detection Engine work?"*
> **Answer**:  
> *"Our backend includes a real-time heuristic **`FraudEngine`** that computes a dynamic risk score ($0 - 100$) by evaluating:  
> 1. **Velocity**: Burst transfers exceeding limits within a 60s rolling window.  
> 2. **Amount Anomalies**: High-value transfers ($>৳25,000$ or $>৳50,000$).  
> 3. **Account Drain**: Immediate liquidation of $>95\%$ balance.  
> 4. **New Recipient Risk**: First-time unverified transfers."*

---

### Q6: *"How is your Supabase PostgreSQL database secured against direct public tampering?"*
> **Answer**:  
> *"We have enabled **Row Level Security (RLS)** across all database tables. This blocks direct unauthorized HTTP access via Supabase's public PostgREST API, while all authenticated operations are securely executed through our Node.js backend connection pool."*

---
*Good luck with the PSTU National Hackathon 2026 presentation! You are 100% prepared to win! 🏆*
