"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INITIAL_BALANCE_POISHA = exports.SEED_USERS = void 0;
exports.seedDatabase = seedDatabase;
const uuid_1 = require("uuid");
const db_1 = require("../config/db");
const init_1 = require("./init");
exports.SEED_USERS = [
    {
        id: 'usr_shakib_01',
        name: 'Shakib Al Hasan',
        phone: '01711111111',
        email: 'shakib@nexuspay.com',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        pin: '1234'
    },
    {
        id: 'usr_tanmoy_02',
        name: 'Tanmoy Roy',
        phone: '01722222222',
        email: 'tanmoy@nexuspay.com',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        pin: '1234'
    },
    {
        id: 'usr_mehraj_03',
        name: 'Mehraj Hossain',
        phone: '01733333333',
        email: 'mehraj@nexuspay.com',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        pin: '1234'
    },
    {
        id: 'usr_sadia_04',
        name: 'Sadia Afrin',
        phone: '01744444444',
        email: 'sadia@nexuspay.com',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        pin: '1234'
    },
    {
        id: 'usr_rahim_05',
        name: 'Rahim Uddin',
        phone: '01755555555',
        email: 'rahim@nexuspay.com',
        avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
        pin: '1234'
    }
];
exports.INITIAL_BALANCE_POISHA = 100000 * 100; // 100,000 BDT = 10,000,000 Poisha
async function seedDatabase() {
    await (0, init_1.initializeDatabase)();
    const client = await (0, db_1.getClient)();
    try {
        await client.query('BEGIN');
        // Clean existing data
        await client.query('DELETE FROM bill_split_items');
        await client.query('DELETE FROM bill_splits');
        await client.query('DELETE FROM notifications');
        await client.query('DELETE FROM connections');
        await client.query('DELETE FROM idempotency_records');
        await client.query('DELETE FROM money_requests');
        await client.query('DELETE FROM ledger_entries');
        await client.query('DELETE FROM transactions');
        await client.query('DELETE FROM wallets');
        await client.query('DELETE FROM users');
        console.log('🧹 Cleaned existing tables.');
        // 1. Create System Treasury User & Wallet (for double-entry genesis funding)
        const systemUserId = 'usr_system_treasury';
        const systemWalletId = 'wlt_system_treasury';
        await client.query(`INSERT INTO users (id, name, phone, email, avatar, pin)
       VALUES ($1, $2, $3, $4, $5, $6)`, [
            systemUserId,
            'NexusPay System Treasury',
            '01000000000',
            'treasury@nexuspay.com',
            'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
            '9999'
        ]);
        await client.query(`INSERT INTO wallets (id, user_id, currency, balance, status)
       VALUES ($1, $2, 'BDT', 0, 'ACTIVE')`, [systemWalletId, systemUserId]);
        // 2. Insert Demo Users and Wallets
        for (const user of exports.SEED_USERS) {
            await client.query(`INSERT INTO users (id, name, phone, email, avatar, pin)
         VALUES ($1, $2, $3, $4, $5, $6)`, [user.id, user.name, user.phone, user.email, user.avatar, user.pin]);
            const walletId = `wlt_${user.id.replace('usr_', '')}`;
            await client.query(`INSERT INTO wallets (id, user_id, currency, balance, status)
         VALUES ($1, $2, 'BDT', $3, 'ACTIVE')`, [walletId, user.id, exports.INITIAL_BALANCE_POISHA]);
            // Create Initial Seed Funding Transaction (Double-entry)
            const txId = (0, uuid_1.v4)();
            const refId = `GENESIS-${user.id.toUpperCase()}`;
            await client.query(`INSERT INTO transactions (id, reference_id, sender_wallet_id, receiver_wallet_id, type, amount, fee, note, category, status)
         VALUES ($1, $2, $3, $4, 'SEED_FUNDING', $5, 0, 'Hackathon Demo Auto-Funding BDT 100,000', 'Genesis', 'SUCCESS')`, [txId, refId, systemWalletId, walletId, exports.INITIAL_BALANCE_POISHA]);
            // Ledger Debit (Treasury)
            await client.query(`INSERT INTO ledger_entries (id, transaction_id, wallet_id, entry_type, amount, balance_after)
         VALUES ($1, $2, $3, 'DEBIT', $4, 0)`, [(0, uuid_1.v4)(), txId, systemWalletId, exports.INITIAL_BALANCE_POISHA]);
            // Ledger Credit (User Wallet)
            await client.query(`INSERT INTO ledger_entries (id, transaction_id, wallet_id, entry_type, amount, balance_after)
         VALUES ($1, $2, $3, 'CREDIT', $4, $5)`, [(0, uuid_1.v4)(), txId, walletId, exports.INITIAL_BALANCE_POISHA, exports.INITIAL_BALANCE_POISHA]);
        }
        // 3. Seed Realistic Sample Peer-to-Peer Transactions
        const tx1Amount = 250000;
        const tx1Id = (0, uuid_1.v4)();
        const shakibWallet = 'wlt_shakib_01';
        const tanmoyWallet = 'wlt_tanmoy_02';
        await client.query(`UPDATE wallets SET balance = balance - $1 WHERE id = $2`, [tx1Amount, shakibWallet]);
        await client.query(`UPDATE wallets SET balance = balance + $1 WHERE id = $2`, [tx1Amount, tanmoyWallet]);
        await client.query(`INSERT INTO transactions (id, reference_id, sender_wallet_id, receiver_wallet_id, type, amount, fee, note, category, status)
       VALUES ($1, $2, $3, $4, 'TRANSFER', $5, 0, 'Team Dinner bill share', 'Food', 'SUCCESS')`, [tx1Id, `TXN-${Date.now()}-001`, shakibWallet, tanmoyWallet, tx1Amount]);
        await client.query(`INSERT INTO ledger_entries (id, transaction_id, wallet_id, entry_type, amount, balance_after)
       VALUES ($1, $2, $3, 'DEBIT', $4, $5)`, [(0, uuid_1.v4)(), tx1Id, shakibWallet, tx1Amount, exports.INITIAL_BALANCE_POISHA - tx1Amount]);
        await client.query(`INSERT INTO ledger_entries (id, transaction_id, wallet_id, entry_type, amount, balance_after)
       VALUES ($1, $2, $3, 'CREDIT', $4, $5)`, [(0, uuid_1.v4)(), tx1Id, tanmoyWallet, tx1Amount, exports.INITIAL_BALANCE_POISHA + tx1Amount]);
        // 4. Seed Connections (Friends & Family)
        // Shakib is friends with Tanmoy & Rahim, and family with Sadia & Mehraj
        await client.query(`INSERT INTO connections (id, user_id, connected_user_id, relation_type, status)
       VALUES 
       ($1, 'usr_shakib_01', 'usr_tanmoy_02', 'FRIEND', 'ACCEPTED'),
       ($2, 'usr_shakib_01', 'usr_rahim_05', 'FRIEND', 'ACCEPTED'),
       ($3, 'usr_shakib_01', 'usr_sadia_04', 'FAMILY', 'ACCEPTED'),
       ($4, 'usr_shakib_01', 'usr_mehraj_03', 'FAMILY', 'ACCEPTED'),
       ($5, 'usr_tanmoy_02', 'usr_mehraj_03', 'FRIEND', 'ACCEPTED'),
       ($6, 'usr_tanmoy_02', 'usr_sadia_04', 'FRIEND', 'ACCEPTED')`, [(0, uuid_1.v4)(), (0, uuid_1.v4)(), (0, uuid_1.v4)(), (0, uuid_1.v4)(), (0, uuid_1.v4)(), (0, uuid_1.v4)()]);
        // 5. Seed Money Requests with Dynamic Borrow Time Limits
        // Request 1: Sadia requests BDT 1,500 from Shakib (Due in 12 hours -> DUE_SOON)
        const dueSoonDate = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
        const req1Id = (0, uuid_1.v4)();
        await client.query(`INSERT INTO money_requests (id, requester_id, payer_id, amount, note, due_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'PENDING')`, [req1Id, 'usr_sadia_04', 'usr_shakib_01', 150000, 'PSTU Hackathon travel reimbursement', dueSoonDate]);
        // Request 2: Rahim requests BDT 3,000 from Tanmoy (Was due yesterday -> OVERDUE)
        const overdueDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const req2Id = (0, uuid_1.v4)();
        await client.query(`INSERT INTO money_requests (id, requester_id, payer_id, amount, note, due_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'PENDING')`, [req2Id, 'usr_rahim_05', 'usr_tanmoy_02', 300000, 'Cloud Server GPU hosting cost', overdueDate]);
        // 6. Seed In-App Notifications
        await client.query(`INSERT INTO notifications (id, user_id, type, reference_id, title, message, is_read)
       VALUES 
       ($1, 'usr_shakib_01', 'MONEY_NEED', $2, 'Money Request from Sadia Afrin', 'Sadia requested ৳1,500 for travel reimbursement. Settle soon.', FALSE),
       ($3, 'usr_tanmoy_02', 'MONEY_NEED', $4, 'Urgent: Hosting Fee Request', 'Rahim requested ৳3,000 for GPU cloud hosting.', FALSE)`, [(0, uuid_1.v4)(), req1Id, (0, uuid_1.v4)(), req2Id]);
        // 7. Seed Bill Splits (Restaurant, Travel, Tour, Team Registration)
        // Bill Split 1: PSTU Cafeteria Team Lunch (Restaurant)
        const split1Id = (0, uuid_1.v4)();
        await client.query(`INSERT INTO bill_splits (id, creator_id, title, total_amount, category, status)
       VALUES ($1, 'usr_shakib_01', 'PSTU Cafeteria Team Lunch', 450000, 'RESTAURANT', 'ACTIVE')`, [split1Id]);
        await client.query(`INSERT INTO bill_split_items (id, bill_split_id, user_id, share_amount, is_paid, paid_at)
       VALUES 
       ($1, $2, 'usr_shakib_01', 150000, TRUE, CURRENT_TIMESTAMP),
       ($3, $2, 'usr_tanmoy_02', 150000, FALSE, NULL),
       ($4, $2, 'usr_mehraj_03', 150000, FALSE, NULL)`, [(0, uuid_1.v4)(), split1Id, (0, uuid_1.v4)(), (0, uuid_1.v4)()]);
        // Bill Split 2: Hackathon Microbus Travel (Travel)
        const split2Id = (0, uuid_1.v4)();
        await client.query(`INSERT INTO bill_splits (id, creator_id, title, total_amount, category, status)
       VALUES ($1, 'usr_tanmoy_02', 'Dhaka-Patuakhali Microbus Rent', 600000, 'TRAVEL', 'ACTIVE')`, [split2Id]);
        await client.query(`INSERT INTO bill_split_items (id, bill_split_id, user_id, share_amount, is_paid, paid_at)
       VALUES 
       ($1, $2, 'usr_tanmoy_02', 200000, TRUE, CURRENT_TIMESTAMP),
       ($3, $2, 'usr_shakib_01', 200000, FALSE, NULL),
       ($4, $2, 'usr_sadia_04', 200000, FALSE, NULL)`, [(0, uuid_1.v4)(), split2Id, (0, uuid_1.v4)(), (0, uuid_1.v4)()]);
        await client.query('COMMIT');
        console.log('✅ Seeded Demo Users, Connections, Dynamic Money Requests, Notifications & Bill Splits.');
    }
    catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Failed to seed PostgreSQL database:', err);
        throw err;
    }
    finally {
        client.release();
    }
}
if (require.main === module || process.argv[1]?.endsWith('seed.ts')) {
    seedDatabase()
        .then(() => process.exit(0))
        .catch((err) => {
        console.error(err);
        process.exit(1);
    });
}
