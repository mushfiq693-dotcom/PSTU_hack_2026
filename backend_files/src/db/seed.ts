import { v4 as uuidv4 } from 'uuid';
import { pool, getClient } from '../config/db';
import { initializeDatabase } from './init';

export interface SeedUser {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatar: string;
  pin: string;
}

export const SEED_USERS: SeedUser[] = [
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

export const INITIAL_BALANCE_POISHA = 100000 * 100; // 100,000 BDT = 10,000,000 Poisha

export async function seedDatabase(): Promise<void> {
  await initializeDatabase();

  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Clean existing data
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

    await client.query(
      `INSERT INTO users (id, name, phone, email, avatar, pin)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        systemUserId,
        'NexusPay System Treasury',
        '01000000000',
        'treasury@nexuspay.com',
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
        '9999'
      ]
    );

    await client.query(
      `INSERT INTO wallets (id, user_id, currency, balance, status)
       VALUES ($1, $2, 'BDT', 0, 'ACTIVE')`,
      [systemWalletId, systemUserId]
    );

    // 2. Insert Demo Users and Wallets
    for (const user of SEED_USERS) {
      await client.query(
        `INSERT INTO users (id, name, phone, email, avatar, pin)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [user.id, user.name, user.phone, user.email, user.avatar, user.pin]
      );

      const walletId = `wlt_${user.id.replace('usr_', '')}`;
      await client.query(
        `INSERT INTO wallets (id, user_id, currency, balance, status)
         VALUES ($1, $2, 'BDT', $3, 'ACTIVE')`,
        [walletId, user.id, INITIAL_BALANCE_POISHA]
      );

      // Create Initial Seed Funding Transaction (Double-entry)
      const txId = uuidv4();
      const refId = `GENESIS-${user.id.toUpperCase()}`;
      await client.query(
        `INSERT INTO transactions (id, reference_id, sender_wallet_id, receiver_wallet_id, type, amount, fee, note, category, status)
         VALUES ($1, $2, $3, $4, 'SEED_FUNDING', $5, 0, 'Hackathon Demo Auto-Funding BDT 100,000', 'Genesis', 'SUCCESS')`,
        [txId, refId, systemWalletId, walletId, INITIAL_BALANCE_POISHA]
      );

      // Ledger Debit (Treasury)
      await client.query(
        `INSERT INTO ledger_entries (id, transaction_id, wallet_id, entry_type, amount, balance_after)
         VALUES ($1, $2, $3, 'DEBIT', $4, 0)`,
        [uuidv4(), txId, systemWalletId, INITIAL_BALANCE_POISHA]
      );

      // Ledger Credit (User Wallet)
      await client.query(
        `INSERT INTO ledger_entries (id, transaction_id, wallet_id, entry_type, amount, balance_after)
         VALUES ($1, $2, $3, 'CREDIT', $4, $5)`,
        [uuidv4(), txId, walletId, INITIAL_BALANCE_POISHA, INITIAL_BALANCE_POISHA]
      );
    }

    // 3. Seed Realistic Sample Peer-to-Peer Transactions
    // Sample Transfer 1: Shakib -> Tanmoy (BDT 2,500 = 250,000 poisha for "Team Dinner")
    const tx1Amount = 250000;
    const tx1Id = uuidv4();
    const shakibWallet = 'wlt_shakib_01';
    const tanmoyWallet = 'wlt_tanmoy_02';

    await client.query(`UPDATE wallets SET balance = balance - $1 WHERE id = $2`, [tx1Amount, shakibWallet]);
    await client.query(`UPDATE wallets SET balance = balance + $1 WHERE id = $2`, [tx1Amount, tanmoyWallet]);

    await client.query(
      `INSERT INTO transactions (id, reference_id, sender_wallet_id, receiver_wallet_id, type, amount, fee, note, category, status)
       VALUES ($1, $2, $3, $4, 'TRANSFER', $5, 0, 'Team Dinner bill share', 'Food', 'SUCCESS')`,
      [tx1Id, `TXN-${Date.now()}-001`, shakibWallet, tanmoyWallet, tx1Amount]
    );

    await client.query(
      `INSERT INTO ledger_entries (id, transaction_id, wallet_id, entry_type, amount, balance_after)
       VALUES ($1, $2, $3, 'DEBIT', $4, $5)`,
      [uuidv4(), tx1Id, shakibWallet, tx1Amount, INITIAL_BALANCE_POISHA - tx1Amount]
    );

    await client.query(
      `INSERT INTO ledger_entries (id, transaction_id, wallet_id, entry_type, amount, balance_after)
       VALUES ($1, $2, $3, 'CREDIT', $4, $5)`,
      [uuidv4(), tx1Id, tanmoyWallet, tx1Amount, INITIAL_BALANCE_POISHA + tx1Amount]
    );

    // Sample Transfer 2: Mehraj -> Sadia (BDT 1,200 = 120,000 poisha for "Hackathon Registration")
    const tx2Amount = 120000;
    const tx2Id = uuidv4();
    const mehrajWallet = 'wlt_mehraj_03';
    const sadiaWallet = 'wlt_sadia_04';

    await client.query(`UPDATE wallets SET balance = balance - $1 WHERE id = $2`, [tx2Amount, mehrajWallet]);
    await client.query(`UPDATE wallets SET balance = balance + $1 WHERE id = $2`, [tx2Amount, sadiaWallet]);

    await client.query(
      `INSERT INTO transactions (id, reference_id, sender_wallet_id, receiver_wallet_id, type, amount, fee, note, category, status)
       VALUES ($1, $2, $3, $4, 'TRANSFER', $5, 0, 'Hackathon Registration fee', 'Events', 'SUCCESS')`,
      [tx2Id, `TXN-${Date.now()}-002`, mehrajWallet, sadiaWallet, tx2Amount]
    );

    await client.query(
      `INSERT INTO ledger_entries (id, transaction_id, wallet_id, entry_type, amount, balance_after)
       VALUES ($1, $2, $3, 'DEBIT', $4, $5)`,
      [uuidv4(), tx2Id, mehrajWallet, tx2Amount, INITIAL_BALANCE_POISHA - tx2Amount]
    );

    await client.query(
      `INSERT INTO ledger_entries (id, transaction_id, wallet_id, entry_type, amount, balance_after)
       VALUES ($1, $2, $3, 'CREDIT', $4, $5)`,
      [uuidv4(), tx2Id, sadiaWallet, tx2Amount, INITIAL_BALANCE_POISHA + tx2Amount]
    );

    // 4. Seed Sample Money Requests
    // Request 1: Sadia requests BDT 1,500 from Shakib (Pending)
    await client.query(
      `INSERT INTO money_requests (id, requester_id, payer_id, amount, note, status)
       VALUES ($1, $2, $3, $4, $5, 'PENDING')`,
      [uuidv4(), 'usr_sadia_04', 'usr_shakib_01', 150000, 'PSTU Hackathon travel expense reimbursement']
    );

    // Request 2: Rahim requests BDT 3,000 from Tanmoy (Pending)
    await client.query(
      `INSERT INTO money_requests (id, requester_id, payer_id, amount, note, status)
       VALUES ($1, $2, $3, $4, $5, 'PENDING')`,
      [uuidv4(), 'usr_rahim_05', 'usr_tanmoy_02', 300000, 'Cloud Server hosting cost']
    );

    await client.query('COMMIT');
    console.log('✅ Seeded 5 Demo accounts, Initial Ledgers, Transactions & Money Requests in PostgreSQL.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Failed to seed PostgreSQL database:', err);
    throw err;
  } finally {
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
