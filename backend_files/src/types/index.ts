export type TransactionType = 'TRANSFER' | 'REQUEST_SETTLEMENT' | 'SEED_FUNDING' | 'BILL_SPLIT';
export type TransactionStatus = 'SUCCESS' | 'FAILED' | 'PENDING';
export type LedgerEntryType = 'DEBIT' | 'CREDIT';
export type RequestStatus = 'PENDING' | 'OVERDUE' | 'DUE_SOON' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED';
export type WalletStatus = 'ACTIVE' | 'FROZEN' | 'CLOSED';
export type RelationType = 'FRIEND' | 'FAMILY';
export type ConnectionStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED';
export type NotificationType = 'MONEY_NEED' | 'DEBT_REMINDER';
export type BillCategory = 'RESTAURANT' | 'TRAVEL' | 'TOUR' | 'TEAM_REGISTRATION';

export interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatar: string;
  pin?: string;
  created_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  currency: string;
  balance: number; // in integer Poisha (1 BDT = 100 Poisha)
  status: WalletStatus;
  updated_at: string;
}

export interface UserWithWallet extends User {
  wallet_id: string;
  balance: number;
  currency: string;
  balance_bdt: number;
}

export interface Transaction {
  id: string;
  reference_id: string;
  sender_wallet_id: string | null;
  receiver_wallet_id: string | null;
  type: TransactionType;
  amount: number; // in Poisha
  fee: number;
  note: string | null;
  category: string;
  status: TransactionStatus;
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
  entry_type: LedgerEntryType;
  amount: number; // in Poisha
  balance_after: number; // in Poisha
  created_at: string;
  user_name?: string;
  user_phone?: string;
  reference_id?: string;
  note?: string;
}

export interface MoneyRequest {
  id: string;
  requester_id: string;
  payer_id: string;
  amount: number; // in Poisha
  note: string | null;
  due_date: string | null;
  status: RequestStatus;
  computed_status?: RequestStatus;
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

export interface Connection {
  id: string;
  user_id: string;
  connected_user_id: string;
  relation_type: RelationType;
  status: ConnectionStatus;
  created_at: string;
  connected_name?: string;
  connected_phone?: string;
  connected_avatar?: string;
  connected_email?: string;
  direction?: 'INCOMING' | 'OUTGOING' | 'MUTUAL';
}

export interface InAppNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  reference_id: string | null;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  is_synthesized?: boolean;
}

export interface BillSplitItem {
  id: string;
  bill_split_id: string;
  user_id: string;
  share_amount: number; // in Poisha
  is_paid: boolean;
  paid_at: string | null;
  transaction_id: string | null;
  user_name?: string;
  user_phone?: string;
  user_avatar?: string;
}

export interface BillSplit {
  id: string;
  creator_id: string;
  title: string;
  total_amount: number; // in Poisha
  category: BillCategory;
  status: 'ACTIVE' | 'SETTLED';
  created_at: string;
  creator_name?: string;
  creator_phone?: string;
  participants: BillSplitItem[];
}

export interface TransferRequestDto {
  sender_id?: string;
  receiver_id?: string;
  receiver_phone?: string;
  amount_bdt: number; // submitted in BDT from UI
  amount_poisha?: number;
  note?: string;
  category?: string;
}

export interface CreateMoneyRequestDto {
  payer_id?: string;
  payer_phone?: string;
  amount_bdt: number;
  note?: string;
  due_date?: string;
}

export interface CreateBillSplitDto {
  title: string;
  total_amount_bdt: number;
  category: BillCategory;
  participants: Array<{
    user_id?: string;
    phone?: string;
    share_amount_bdt: number;
  }>;
}

export interface StressTestRequestDto {
  sender_id: string;
  receiver_id: string;
  total_requests: number;
  amount_per_request_bdt: number;
  starting_balance_bdt?: number;
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
