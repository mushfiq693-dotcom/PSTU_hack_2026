import {
  UserWithWallet,
  Transaction,
  MoneyRequest,
  LedgerEntry,
  LedgerAuditResult,
  StressTestResult
} from '../types';

const API_BASE = '/api';

export class ApiService {
  private static getHeaders(idempotencyKey?: string): HeadersInit {
    const activeUserId = localStorage.getItem('nexuspay_active_user_id') || 'usr_shakib_01';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-User-Id': activeUserId,
    };

    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }

    return headers;
  }

  public static async getUsers(): Promise<UserWithWallet[]> {
    const res = await fetch(`${API_BASE}/users`, {
      headers: this.getHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to fetch users');
    return json.data;
  }

  public static async getMyWallet(): Promise<UserWithWallet> {
    const res = await fetch(`${API_BASE}/wallets/me`, {
      headers: this.getHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to fetch wallet');
    return json.data;
  }

  public static async getHistory(limit = 50): Promise<Transaction[]> {
    const res = await fetch(`${API_BASE}/transfers/history?limit=${limit}`, {
      headers: this.getHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to fetch history');
    return json.data;
  }

  public static async transferMoney(payload: {
    receiver_id?: string;
    receiver_phone?: string;
    amount_bdt: number;
    note?: string;
    category?: string;
    idempotency_key?: string;
  }): Promise<{ message: string; data: any; replayed?: boolean }> {
    const idemKey = payload.idempotency_key || `IDEM-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const res = await fetch(`${API_BASE}/transfers`, {
      method: 'POST',
      headers: this.getHeaders(idemKey),
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    const isReplayed = res.headers.get('X-Idempotent-Replay') === 'true';
    if (!res.ok) throw new Error(json.message || 'Transfer failed');
    return { ...json, replayed: isReplayed };
  }

  public static async createMoneyRequest(payload: {
    payer_id?: string;
    payer_phone?: string;
    amount_bdt: number;
    note?: string;
  }): Promise<MoneyRequest> {
    const res = await fetch(`${API_BASE}/requests`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to create money request');
    return json.data;
  }

  public static async getMoneyRequests(filter: 'incoming' | 'outgoing' | 'all' = 'all'): Promise<MoneyRequest[]> {
    const res = await fetch(`${API_BASE}/requests?filter=${filter}`, {
      headers: this.getHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to fetch money requests');
    return json.data;
  }

  public static async acceptMoneyRequest(requestId: string): Promise<any> {
    const idemKey = `ACCEPT-IDEM-${requestId}-${Date.now()}`;
    const res = await fetch(`${API_BASE}/requests/${requestId}/accept`, {
      method: 'POST',
      headers: this.getHeaders(idemKey),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to accept request');
    return json.data;
  }

  public static async rejectMoneyRequest(requestId: string): Promise<MoneyRequest> {
    const res = await fetch(`${API_BASE}/requests/${requestId}/reject`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to reject request');
    return json.data;
  }

  public static async cancelMoneyRequest(requestId: string): Promise<MoneyRequest> {
    const res = await fetch(`${API_BASE}/requests/${requestId}/cancel`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to cancel request');
    return json.data;
  }

  public static async getLedgerEntries(
    walletId?: string,
    limit = 50,
    offset = 0
  ): Promise<{ entries: LedgerEntry[]; total: number }> {
    let url = `${API_BASE}/ledger/entries?limit=${limit}&offset=${offset}`;
    if (walletId) url += `&wallet_id=${walletId}`;

    const res = await fetch(url, {
      headers: this.getHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to fetch ledger entries');
    return { entries: json.data, total: json.meta.total };
  }

  public static async getLedgerAudit(): Promise<LedgerAuditResult> {
    const res = await fetch(`${API_BASE}/ledger/audit`, {
      headers: this.getHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to run ledger audit');
    return json.data;
  }

  public static async runStressTest(params: {
    sender_id: string;
    receiver_id: string;
    total_requests: number;
    amount_per_request_bdt: number;
    starting_balance_bdt?: number;
  }): Promise<StressTestResult> {
    const res = await fetch(`${API_BASE}/stress/run`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(params),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Stress test failed');
    return json.data;
  }

  public static async resetDemoData(): Promise<void> {
    const res = await fetch(`${API_BASE}/dev/reset`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to reset demo');
  }
}
