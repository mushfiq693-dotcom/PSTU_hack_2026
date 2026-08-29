export type TabType = 'dashboard' | 'send' | 'requests' | 'ledger' | 'stress';

export interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatar: string;
  created_at: string;
}

export interface UserWithWallet extends User {
  wallet_id: string;
  balance: number; // in integer Poisha
  currency: string;
  balance_bdt: number;
}

export interface Transaction {
  id: string;
  reference_id: string;
  sender_wallet_id: string | null;
  receiver_wallet_id: string | null;
  type: 'TRANSFER' | 'REQUEST_SETTLEMENT' | 'SEED_FUNDING' | 'BILL_SPLIT';
  amount: number; // in Poisha
  fee: number;
  note: string | null;
  category: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  idempotency_key: string | null;
  created_at: string;
  sender_name?: string;
  receiver_name?: string;
  sender_phone?: string;
  receiver_phone?: string;
}

export interface LedgerEntry {
  id: string;
  transaction_id: string;
  wallet_id: string;
  entry_type: 'DEBIT' | 'CREDIT';
  amount: number;
  balance_after: number;
  created_at: string;
  user_name?: string;
  user_phone?: string;
  reference_id?: string;
  note?: string;
  transaction_type?: string;
}

export interface MoneyRequest {
  id: string;
  requester_id: string;
  payer_id: string;
  amount: number;
  note: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED';
  transaction_id: string | null;
  created_at: string;
  resolved_at: string | null;
  requester_name?: string;
  requester_phone?: string;
  requester_avatar?: string;
  payer_name?: string;
  payer_phone?: string;
  payer_avatar?: string;
}

export interface LedgerAuditResult {
  total_debit_poisha: number;
  total_credit_poisha: number;
  total_debit_bdt: number;
  total_credit_bdt: number;
  discrepancy_poisha: number;
  discrepancy_bdt: number;
  is_balanced: boolean;
  total_ledger_entries: number;
  total_transactions: number;
  total_system_wallets_balance_bdt: number;
  system_integrity_status: 'HEALTHY_BALANCED' | 'DISCREPANCY_DETECTED';
  audited_at: string;
}

export interface StressTestResult {
  total_requests: number;
  successful_requests: number;
  rejected_requests: number;
  amount_per_request_bdt: number;
  starting_balance_bdt: number;
  expected_successful_count: number;
  final_sender_balance_bdt: number;
  double_spend_detected: boolean;
  ledger_balanced: boolean;
  total_transferred_bdt: number;
  execution_duration_ms: number;
  discrepancy_bdt: number;
  rejection_breakdown: Record<string, number>;
  request_logs: Array<{
    req_index: number;
    status: 'SUCCESS' | 'REJECTED';
    status_code: number;
    error_code?: string;
    message: string;
    duration_ms: number;
  }>;
}
