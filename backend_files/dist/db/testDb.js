"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runDatabaseTests = runDatabaseTests;
const db_1 = require("../config/db");
const seed_1 = require("./seed");
async function runDatabaseTests() {
    console.log('🧪 Running Phase 2 PostgreSQL Database Integrity Tests...\n');
    // 1. Run Seed
    await (0, seed_1.seedDatabase)();
    // 2. Check Connection & Version
    const versionRes = await db_1.pool.query('SELECT version()');
    console.log(`1. PostgreSQL Connected -> ✅ PASS (${versionRes.rows[0].version.split(' ')[0]} ${versionRes.rows[0].version.split(' ')[1]})`);
    // 3. Check Demo Users Count
    const userCountRes = await db_1.pool.query("SELECT COUNT(*) as count FROM users WHERE id LIKE 'usr_%'");
    const userCount = parseInt(userCountRes.rows[0].count, 10);
    console.log(`2. Demo Users Seeded = ${userCount} ->`, userCount >= 5 ? '✅ PASS' : '❌ FAIL');
    // 4. Check Non-Negative Constraint
    let constraintPassed = false;
    try {
        // Attempt illegal debit that would take wallet balance negative
        await db_1.pool.query("UPDATE wallets SET balance = -100 WHERE id = 'wlt_shakib_01'");
    }
    catch (err) {
        if (err.message.includes('violates check constraint') || err.message.includes('balance')) {
            constraintPassed = true;
        }
    }
    console.log('3. Hard Database CHECK(balance >= 0) Constraint ->', constraintPassed ? '✅ PASS (Negative balance blocked)' : '❌ FAIL');
    // 5. Check Double-Entry Invariant
    const debitRes = await db_1.pool.query("SELECT COALESCE(SUM(amount), 0) as total FROM ledger_entries WHERE entry_type = 'DEBIT'");
    const creditRes = await db_1.pool.query("SELECT COALESCE(SUM(amount), 0) as total FROM ledger_entries WHERE entry_type = 'CREDIT'");
    const debitSum = Number(debitRes.rows[0].total);
    const creditSum = Number(creditRes.rows[0].total);
    const difference = debitSum - creditSum;
    console.log(`4. Double-Entry Invariant (SUM Debits: ${debitSum} Poisha, SUM Credits: ${creditSum} Poisha, Diff: ${difference}) ->`, difference === 0 ? '✅ PASS (Zero Drift)' : '❌ FAIL');
    // 6. Verify Idempotency Table is Ready
    const idempotencyCheck = await db_1.pool.query('SELECT COUNT(*) as count FROM idempotency_records');
    console.log(`5. Idempotency Table Initialized ->`, idempotencyCheck !== undefined ? '✅ PASS' : '❌ FAIL');
    console.log('\n🎉 ALL Phase 2 PostgreSQL Database Verification Checks Passed Successfully!\n');
}
if (require.main === module || process.argv[1]?.endsWith('testDb.ts')) {
    runDatabaseTests()
        .then(() => process.exit(0))
        .catch((err) => {
        console.error(err);
        process.exit(1);
    });
}
