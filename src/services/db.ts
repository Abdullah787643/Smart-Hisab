/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Transaction, Debt, AppSettings, BackupData } from '../types/finance';

const DB_NAME = 'SmartHisabDB';
const DB_VERSION = 1;

const DEFAULT_SETTINGS: AppSettings = {
  language: 'en',
  currency: 'BDT',
  theme: 'light',
  bengaliDigits: false,
  hasSeededInitialData: false,
};

// Open database promise wrapper
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Transactions store
      if (!db.objectStoreNames.contains('transactions')) {
        const txStore = db.createObjectStore('transactions', { keyPath: 'id' });
        txStore.createIndex('date', 'date', { unique: false });
        txStore.createIndex('type', 'type', { unique: false });
        txStore.createIndex('category', 'category', { unique: false });
      }

      // Debts store
      if (!db.objectStoreNames.contains('debts')) {
        const debtStore = db.createObjectStore('debts', { keyPath: 'id' });
        debtStore.createIndex('type', 'type', { unique: false });
        debtStore.createIndex('status', 'status', { unique: false });
        debtStore.createIndex('startDate', 'startDate', { unique: false });
      }

      // Settings store
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

// Fallback to localStorage keys
const LS_KEYS = {
  transactions: 'smart_hisab_txs',
  debts: 'smart_hisab_debts',
  settings: 'smart_hisab_settings',
};

// Helper to mirror into localStorage
function mirrorToLocalStorage(key: string, data: any) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn('LocalStorage mirror warning:', err);
  }
}

export const dbService = {
  async getTransactions(): Promise<Transaction[]> {
    try {
      const db = await openDB();
      const records = await new Promise<Transaction[]>((resolve, reject) => {
        const tx = db.transaction('transactions', 'readonly');
        const store = tx.objectStore('transactions');
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });

      if (records && records.length > 0) {
        mirrorToLocalStorage(LS_KEYS.transactions, records);
        return records;
      }

      // Fallback check
      const stored = localStorage.getItem(LS_KEYS.transactions);
      return stored ? JSON.parse(stored) : [];
    } catch {
      const stored = localStorage.getItem(LS_KEYS.transactions);
      return stored ? JSON.parse(stored) : [];
    }
  },

  async saveTransaction(transaction: Transaction): Promise<void> {
    try {
      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('transactions', 'readwrite');
        const store = tx.objectStore('transactions');
        store.put(transaction);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      console.warn('IndexedDB saveTransaction fallback:', e);
    }

    // Mirror to localStorage
    try {
      const stored = localStorage.getItem(LS_KEYS.transactions);
      const txs: Transaction[] = stored ? JSON.parse(stored) : [];
      const idx = txs.findIndex(t => t.id === transaction.id);
      if (idx >= 0) {
        txs[idx] = transaction;
      } else {
        txs.unshift(transaction);
      }
      mirrorToLocalStorage(LS_KEYS.transactions, txs);
    } catch {
      // ignore
    }
  },

  async deleteTransaction(id: string): Promise<void> {
    try {
      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('transactions', 'readwrite');
        const store = tx.objectStore('transactions');
        store.delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      console.warn('IndexedDB deleteTransaction fallback:', e);
    }

    // Mirror delete
    try {
      const stored = localStorage.getItem(LS_KEYS.transactions);
      if (stored) {
        const txs: Transaction[] = JSON.parse(stored);
        const filtered = txs.filter(t => t.id !== id);
        mirrorToLocalStorage(LS_KEYS.transactions, filtered);
      }
    } catch {
      // ignore
    }
  },

  async getDebts(): Promise<Debt[]> {
    try {
      const db = await openDB();
      const records = await new Promise<Debt[]>((resolve, reject) => {
        const tx = db.transaction('debts', 'readonly');
        const store = tx.objectStore('debts');
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });

      if (records && records.length > 0) {
        mirrorToLocalStorage(LS_KEYS.debts, records);
        return records;
      }

      const stored = localStorage.getItem(LS_KEYS.debts);
      return stored ? JSON.parse(stored) : [];
    } catch {
      const stored = localStorage.getItem(LS_KEYS.debts);
      return stored ? JSON.parse(stored) : [];
    }
  },

  async saveDebt(debt: Debt): Promise<void> {
    try {
      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('debts', 'readwrite');
        const store = tx.objectStore('debts');
        store.put(debt);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      console.warn('IndexedDB saveDebt fallback:', e);
    }

    try {
      const stored = localStorage.getItem(LS_KEYS.debts);
      const debts: Debt[] = stored ? JSON.parse(stored) : [];
      const idx = debts.findIndex(d => d.id === debt.id);
      if (idx >= 0) {
        debts[idx] = debt;
      } else {
        debts.unshift(debt);
      }
      mirrorToLocalStorage(LS_KEYS.debts, debts);
    } catch {
      // ignore
    }
  },

  async deleteDebt(id: string): Promise<void> {
    try {
      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('debts', 'readwrite');
        const store = tx.objectStore('debts');
        store.delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      console.warn('IndexedDB deleteDebt fallback:', e);
    }

    try {
      const stored = localStorage.getItem(LS_KEYS.debts);
      if (stored) {
        const debts: Debt[] = JSON.parse(stored);
        const filtered = debts.filter(d => d.id !== id);
        mirrorToLocalStorage(LS_KEYS.debts, filtered);
      }
    } catch {
      // ignore
    }
  },

  async getSettings(): Promise<AppSettings> {
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const tx = db.transaction('settings', 'readonly');
        const store = tx.objectStore('settings');
        const req = store.get('app_settings');
        req.onsuccess = () => {
          if (req.result && req.result.value) {
            mirrorToLocalStorage(LS_KEYS.settings, req.result.value);
            resolve({ ...DEFAULT_SETTINGS, ...req.result.value });
          } else {
            const ls = localStorage.getItem(LS_KEYS.settings);
            resolve(ls ? { ...DEFAULT_SETTINGS, ...JSON.parse(ls) } : DEFAULT_SETTINGS);
          }
        };
        req.onerror = () => {
          const ls = localStorage.getItem(LS_KEYS.settings);
          resolve(ls ? { ...DEFAULT_SETTINGS, ...JSON.parse(ls) } : DEFAULT_SETTINGS);
        };
      });
    } catch {
      const stored = localStorage.getItem(LS_KEYS.settings);
      return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
    }
  },

  async saveSettings(settings: AppSettings): Promise<void> {
    try {
      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('settings', 'readwrite');
        const store = tx.objectStore('settings');
        store.put({ key: 'app_settings', value: settings });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      // ignore
    }
    mirrorToLocalStorage(LS_KEYS.settings, settings);
  },

  async exportBackup(): Promise<BackupData> {
    const transactions = await this.getTransactions();
    const debts = await this.getDebts();
    const settings = await this.getSettings();

    return {
      version: 1,
      appName: 'Smart Hisab',
      exportedAt: new Date().toISOString(),
      data: {
        transactions,
        debts,
        settings,
      },
    };
  },

  async restoreBackup(backup: BackupData): Promise<void> {
    if (!backup || !backup.data) {
      throw new Error('Invalid backup file');
    }

    const { transactions, debts, settings } = backup.data;

    await this.clearAllData();

    if (Array.isArray(transactions)) {
      for (const t of transactions) {
        await this.saveTransaction(t);
      }
    }

    if (Array.isArray(debts)) {
      for (const d of debts) {
        await this.saveDebt(d);
      }
    }

    if (settings) {
      await this.saveSettings(settings);
    }
  },

  async clearAllData(): Promise<void> {
    try {
      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(['transactions', 'debts', 'settings'], 'readwrite');
        tx.objectStore('transactions').clear();
        tx.objectStore('debts').clear();
        tx.objectStore('settings').clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      // ignore
    }
    localStorage.removeItem(LS_KEYS.transactions);
    localStorage.removeItem(LS_KEYS.debts);
    localStorage.removeItem(LS_KEYS.settings);
  },
};
