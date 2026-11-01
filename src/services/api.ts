/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuthUser, SavedAccount } from '../types/auth';
import { Transaction, Debt, AppSettings } from '../types/finance';

const SAVED_ACCOUNTS_KEY = 'smart_hisab_saved_accounts_v2';
const ACTIVE_TOKEN_KEY = 'smart_hisab_auth_token_v2';

export const api = {
  getToken(): string | null {
    return localStorage.getItem(ACTIVE_TOKEN_KEY);
  },

  setToken(token: string | null) {
    if (token) {
      localStorage.setItem(ACTIVE_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(ACTIVE_TOKEN_KEY);
    }
  },

  getSavedAccounts(): SavedAccount[] {
    try {
      const raw = localStorage.getItem(SAVED_ACCOUNTS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  saveAccount(user: AuthUser, token: string) {
    const list = this.getSavedAccounts();
    const updated: SavedAccount = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      token,
      lastActive: Date.now(),
    };
    const filtered = list.filter((a) => a.id !== user.id);
    const newList = [updated, ...filtered];
    localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(newList));
    this.setToken(token);
  },

  removeSavedAccount(id: string) {
    const list = this.getSavedAccounts().filter((a) => a.id !== id);
    localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(list));
    // If removing active account, clear active token
    const active = this.getToken();
    const remaining = list[0];
    if (remaining) {
      this.setToken(remaining.token);
    } else {
      this.setToken(null);
    }
  },

  clearSavedAccounts() {
    localStorage.removeItem(SAVED_ACCOUNTS_KEY);
    this.setToken(null);
  },

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(endpoint, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMsg = data.error || data.message || `Request failed with status ${res.status}`;
      throw new Error(errorMsg);
    }

    return data;
  },

  // Auth Endpoints
  async register(data: { fullName: string; mobileNumber: string; email: string; password: string }) {
    return this.request<{ success: boolean; message: string; user: AuthUser; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async login(identifier: string, password: string) {
    return this.request<{ success: boolean; user: AuthUser; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
  },

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request<{ success: boolean; message: string }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  async getMe() {
    return this.request<{ success: boolean; user: AuthUser }>('/api/auth/me');
  },

  async logout() {
    try {
      await this.request<{ success: boolean }>('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
  },

  async logoutAll() {
    try {
      await this.request<{ success: boolean }>('/api/auth/logout-all', { method: 'POST' });
    } catch {
      // ignore
    }
  },

  // Financial Data Endpoints
  async syncData() {
    return this.request<{
      success: boolean;
      data: { transactions: Transaction[]; debts: Debt[]; settings?: Partial<AppSettings> | null };
    }>('/api/data/sync');
  },

  async saveUserSettings(settings: Partial<AppSettings>) {
    return this.request<{ success: boolean }>('/api/data/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  async saveTransaction(transaction: Transaction) {
    return this.request<{ success: boolean; id: string }>('/api/data/transactions', {
      method: 'POST',
      body: JSON.stringify(transaction),
    });
  },

  async updateTransaction(id: string, transaction: Transaction) {
    return this.request<{ success: boolean }>(`/api/data/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(transaction),
    });
  },

  async deleteTransaction(id: string) {
    return this.request<{ success: boolean }>(`/api/data/transactions/${id}`, {
      method: 'DELETE',
    });
  },

  async saveDebt(debt: Debt) {
    return this.request<{ success: boolean; id: string }>('/api/data/debts', {
      method: 'POST',
      body: JSON.stringify(debt),
    });
  },

  async updateDebt(id: string, debt: Debt) {
    return this.request<{ success: boolean }>(`/api/data/debts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(debt),
    });
  },

  async deleteDebt(id: string) {
    return this.request<{ success: boolean }>(`/api/data/debts/${id}`, {
      method: 'DELETE',
    });
  },

  async recordDebtPayment(debtId: string, payment: any) {
    return this.request<{ success: boolean; id: string }>(`/api/data/debts/${debtId}/payments`, {
      method: 'POST',
      body: JSON.stringify(payment),
    });
  },

  async deleteDebtPayment(debtId: string, paymentId: string) {
    return this.request<{ success: boolean }>(`/api/data/debts/${debtId}/payments/${paymentId}`, {
      method: 'DELETE',
    });
  },

  async clearAllUserData() {
    return this.request<{ success: boolean }>('/api/data/all', {
      method: 'DELETE',
    });
  },
};
