import {
  UserWithWallet,
  Transaction,
  MoneyRequest,
  LedgerEntry,
  LedgerAuditResult,
  StressTestResult,
  Connection,
  InAppNotification,
  BillSplit,
  BillCategory,
  RelationType
} from '../types';

const RAW_API_URL = import.meta.env.VITE_API_URL || '';
const API_BASE = RAW_API_URL ? `${RAW_API_URL.replace(/\/$/, '')}/api` : '/api';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export class ApiService {
  private static memoryCache = new Map<string, CacheEntry<any>>();
  private static readonly DEFAULT_TTL_MS = 10000; // 10 seconds in-memory cache

  /**
   * Retrieves data from client memory cache if still valid
   */
  private static getFromCache<T>(key: string, ttlMs: number = this.DEFAULT_TTL_MS): T | null {
    const entry = this.memoryCache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > ttlMs) {
      this.memoryCache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Stores response in client memory cache
   */
  private static setInCache<T>(key: string, data: T): void {
    this.memoryCache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Clears in-memory client cache (called on any mutation)
   */
  public static clearCache(): void {
    this.memoryCache.clear();
  }

  private static getHeaders(idempotencyKey?: string): HeadersInit {
    const token = localStorage.getItem('fastpay_jwt_token');
    const activeUserId = localStorage.getItem('nexuspay_active_user_id') || 'usr_shakib_01';

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-User-Id': activeUserId,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }

    return headers;
  }

  // ========================================================
  // Authentication & Phone OTP Verification
  // ========================================================

  public static async register(payload: {
    name: string;
    phone: string;
    password: string;
    email?: string;
  }): Promise<{ success: boolean; message: string; phone: string; phone_verified: boolean; user?: any; dev_otp?: string }> {
    this.clearCache();
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Registration failed');
    return json;
  }

  public static async verifyOtp(payload: {
    phone: string;
    otp: string;
  }): Promise<{ success: boolean; message: string; token: string; user: any; phone_verified: boolean }> {
    this.clearCache();
    const res = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'OTP verification failed');
    if (json.token) {
      localStorage.setItem('fastpay_jwt_token', json.token);
      if (json.user?.id) {
        localStorage.setItem('nexuspay_active_user_id', json.user.id);
      }
    }
    return json;
  }

  public static async resendOtp(payload: {
    phone: string;
  }): Promise<{ success: boolean; message: string; phone: string; dev_otp?: string }> {
    const res = await fetch(`${API_BASE}/auth/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to resend OTP');
    return json;
  }

  public static async login(payload: {
    phone: string;
    password: string;
  }): Promise<{ success: boolean; message: string; token: string; user: any; phone_verified: boolean }> {
    this.clearCache();
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Login failed');
    if (json.token) {
      localStorage.setItem('fastpay_jwt_token', json.token);
      if (json.user?.id) {
        localStorage.setItem('nexuspay_active_user_id', json.user.id);
      }
    }
    return json;
  }

  public static async logout(): Promise<void> {
    this.clearCache();
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: this.getHeaders(),
      });
    } finally {
      localStorage.removeItem('fastpay_jwt_token');
    }
  }

  public static async getMe(): Promise<UserWithWallet> {
    const activeUserId = localStorage.getItem('nexuspay_active_user_id') || 'default';
    const cacheKey = `me:${activeUserId}`;
    const cached = this.getFromCache<UserWithWallet>(cacheKey, 8000);
    if (cached) return cached;

    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: this.getHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to fetch user profile');
    this.setInCache(cacheKey, json.data);
    return json.data;
  }

  // ========================================================
  // Core Money Movement & Ledger APIs (Cached in Memory)
  // ========================================================

  public static async getUsers(): Promise<UserWithWallet[]> {
    const cacheKey = 'users:all';
    const cached = this.getFromCache<UserWithWallet[]>(cacheKey, 10000);
    if (cached) return cached;

    const res = await fetch(`${API_BASE}/users`, {
      headers: this.getHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to fetch users');
    this.setInCache(cacheKey, json.data);
    return json.data;
  }

  public static async getMyWallet(): Promise<UserWithWallet> {
    const activeUserId = localStorage.getItem('nexuspay_active_user_id') || 'default';
    const cacheKey = `wallet:${activeUserId}`;
    const cached = this.getFromCache<UserWithWallet>(cacheKey, 8000);
    if (cached) return cached;

    const res = await fetch(`${API_BASE}/wallets/me`, {
      headers: this.getHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to fetch wallet');
    this.setInCache(cacheKey, json.data);
    return json.data;
  }

  public static async getHistory(limit = 50): Promise<Transaction[]> {
    const activeUserId = localStorage.getItem('nexuspay_active_user_id') || 'default';
    const cacheKey = `history:${activeUserId}:${limit}`;
    const cached = this.getFromCache<Transaction[]>(cacheKey, 6000);
    if (cached) return cached;

    const res = await fetch(`${API_BASE}/transfers/history?limit=${limit}`, {
      headers: this.getHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to fetch history');
    this.setInCache(cacheKey, json.data);
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
    this.clearCache();
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

  // ==========================================
  // Money Requests & Loans with Borrow Time Limit
  // ==========================================
  public static async createMoneyRequest(payload: {
    payer_id?: string;
    payer_phone?: string;
    amount_bdt: number;
    note?: string;
    due_date?: string;
  }): Promise<MoneyRequest> {
    this.clearCache();
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
    const activeUserId = localStorage.getItem('nexuspay_active_user_id') || 'default';
    const cacheKey = `requests:${activeUserId}:${filter}`;
    const cached = this.getFromCache<MoneyRequest[]>(cacheKey, 6000);
    if (cached) return cached;

    const res = await fetch(`${API_BASE}/requests?filter=${filter}`, {
      headers: this.getHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to fetch money requests');
    this.setInCache(cacheKey, json.data);
    return json.data;
  }

  public static async acceptMoneyRequest(requestId: string): Promise<any> {
    this.clearCache();
    const idemKey = `ACCEPT-IDEM-${requestId}-${Date.now()}`;
    const res = await fetch(`${API_BASE}/requests/${requestId}/accept`, {
      method: 'POST',
      headers: this.getHeaders(idemKey),
      body: JSON.stringify({}),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to accept request');
    return json.data;
  }

  public static async rejectMoneyRequest(requestId: string): Promise<MoneyRequest> {
    this.clearCache();
    const res = await fetch(`${API_BASE}/requests/${requestId}/reject`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({}),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to reject request');
    return json.data;
  }

  public static async cancelMoneyRequest(requestId: string): Promise<MoneyRequest> {
    this.clearCache();
    const res = await fetch(`${API_BASE}/requests/${requestId}/cancel`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({}),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to cancel request');
    return json.data;
  }

  // ==========================================
  // Connections (Friends & Family)
  // ==========================================
  public static async getConnections(relationType?: RelationType): Promise<Connection[]> {
    let url = `${API_BASE}/connections`;
    if (relationType) url += `?relation_type=${relationType}`;
    const res = await fetch(url, { headers: this.getHeaders() });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to fetch connections');
    return json.data;
  }

  public static async sendConnectionRequest(
    connectedUserId: string,
    relationType: RelationType
  ): Promise<Connection> {
    const res = await fetch(`${API_BASE}/connections`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ connected_user_id: connectedUserId, relation_type: relationType }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to send connection request');
    return json.data;
  }

  public static async acceptConnection(connectionId: string): Promise<Connection> {
    const res = await fetch(`${API_BASE}/connections/${connectionId}/accept`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to accept connection');
    return json.data;
  }

  public static async declineConnection(connectionId: string): Promise<Connection> {
    const res = await fetch(`${API_BASE}/connections/${connectionId}/decline`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to decline connection');
    return json.data;
  }

  // ==========================================
  // In-App Notifications
  // ==========================================
  public static async getNotifications(): Promise<InAppNotification[]> {
    const res = await fetch(`${API_BASE}/notifications`, {
      headers: this.getHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to fetch notifications');
    return json.data;
  }

  public static async markNotificationRead(id: string): Promise<void> {
    await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
  }

  public static async markAllNotificationsRead(): Promise<void> {
    await fetch(`${API_BASE}/notifications/read-all`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
  }

  // ==========================================
  // Bill Splits (Category-Aware Shared Expenses)
  // ==========================================
  public static async getSplits(category?: BillCategory): Promise<BillSplit[]> {
    let url = `${API_BASE}/splits`;
    if (category) url += `?category=${category}`;
    const res = await fetch(url, { headers: this.getHeaders() });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to fetch bill splits');
    return json.data;
  }

  public static async createSplit(payload: {
    title: string;
    total_amount_bdt: number;
    category: BillCategory;
    participants: Array<{ user_id?: string; phone?: string; share_amount_bdt: number }>;
  }): Promise<BillSplit> {
    const res = await fetch(`${API_BASE}/splits`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to create bill split');
    return json.data;
  }

  public static async paySplitShare(splitId: string): Promise<any> {
    const idemKey = `SPLIT-PAY-${splitId}-${Date.now()}`;
    const res = await fetch(`${API_BASE}/splits/${splitId}/pay`, {
      method: 'POST',
      headers: this.getHeaders(idemKey),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to pay split share');
    return json.data;
  }

  // ==========================================
  // Ledger & Dev Diagnostics
  // ==========================================
  public static async getLedgerEntries(
    walletId?: string,
    limit = 50,
    offset = 0
  ): Promise<{ entries: LedgerEntry[]; total: number }> {
    const cacheKey = `ledger:${walletId || 'all'}:${limit}:${offset}`;
    const cached = this.getFromCache<{ entries: LedgerEntry[]; total: number }>(cacheKey, 6000);
    if (cached) return cached;

    let url = `${API_BASE}/ledger/entries?limit=${limit}&offset=${offset}`;
    if (walletId) url += `&wallet_id=${walletId}`;

    const res = await fetch(url, {
      headers: this.getHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to fetch ledger entries');
    const result = { entries: json.data, total: json.meta.total };
    this.setInCache(cacheKey, result);
    return result;
  }

  public static async getLedgerAudit(): Promise<LedgerAuditResult> {
    const cacheKey = 'ledger:audit';
    const cached = this.getFromCache<LedgerAuditResult>(cacheKey, 8000);
    if (cached) return cached;

    const res = await fetch(`${API_BASE}/ledger/audit`, {
      headers: this.getHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to run ledger audit');
    this.setInCache(cacheKey, json.data);
    return json.data;
  }

  public static async runStressTest(params: {
    sender_id: string;
    receiver_id: string;
    total_requests: number;
    amount_per_request_bdt: number;
    starting_balance_bdt?: number;
  }): Promise<StressTestResult> {
    this.clearCache();
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
    this.clearCache();
    const res = await fetch(`${API_BASE}/dev/reset`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to reset demo');
  }
}
