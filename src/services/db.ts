/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Transaction, Debt, AppSettings, BackupData, SyncQueueItem } from '../types/finance';

const DB_NAME = 'SmartHisabDB';
const DB_VERSION = 2;

const DEFAULT_SETTINGS: AppSettings = {
  language: 'en',
  currency: 'BDT',
  theme: 'light',
  bengaliDigits: false,
  hasSeededInitialData: false,
};

// Open database promise wrapper with version 2 upgrade
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 1. Transactions store
      if (!db.objectStoreNames.contains('transactions')) {
        const txStore = db.createObjectStore('transactions', { keyPath: 'id' });
        txStore.createIndex('date', 'date', { unique: false });
        txStore.createIndex('type', 'type', { unique: false });
        txStore.createIndex('category', 'category', { unique: false });
        txStore.createIndex('userId', 'userId', { unique: false });
      } else {
        const txStore = (event.currentTarget as IDBOpenDBRequest).transaction?.objectStore('transactions');
        if (txStore && !txStore.indexNames.contains('userId')) {
          txStore.createIndex('userId', 'userId', { unique: false });
        }
      }

      // 2. Debts store
      if (!db.objectStoreNames.contains('debts')) {
        const debtStore = db.createObjectStore('debts', { keyPath: 'id' });
        debtStore.createIndex('type', 'type', { unique: false });
        debtStore.createIndex('status', 'status', { unique: false });
        debtStore.createIndex('startDate', 'startDate', { unique: false });
        debtStore.createIndex('userId', 'userId', { unique: false });
      } else {
        const debtStore = (event.currentTarget as IDBOpenDBRequest).transaction?.objectStore('debts');
        if (debtStore && !debtStore.indexNames.contains('userId')) {
          debtStore.createIndex('userId', 'userId', { unique: false });
        }
      }

      // 3. Settings store
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }

      // 4. Sync Queue store for Offline-First operations
      if (!db.objectStoreNames.contains('sync_queue')) {
        const queueStore = db.createObjectStore('sync_queue', { keyPath: 'id' });
        queueStore.createIndex('userId', 'userId', { unique: false });
        queueStore.createIndex('createdAt', 'createdAt', { unique: false });
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
  syncQueue: 'smart_hisab_sync_queue',
};

function mirrorToLocalStorage(key: string, data: any) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn('LocalStorage mirror warning:', err);
  }
}

export const dbService = {
  // 1. Transactions
  async getTransactions(userId?: string): Promise<Transaction[]> {
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
        if (userId) {
          return records.filter((t) => t.userId === userId);
        }
        return records.filter((t) => !t.userId);
      }

      const stored = localStorage.getItem(LS_KEYS.transactions);
      const all: Transaction[] = stored ? JSON.parse(stored) : [];
      if (userId) {
        return all.filter((t) => t.userId === userId);
      }
      return all.filter((t) => !t.userId);
    } catch {
      const stored = localStorage.getItem(LS_KEYS.transactions);
      const all: Transaction[] = stored ? JSON.parse(stored) : [];
      if (userId) {
        return all.filter((t) => t.userId === userId);
      }
      return all.filter((t) => !t.userId);
    }
  },

  async getAllStoredTransactions(): Promise<Transaction[]> {
    try {
      const db = await openDB();
      return new Promise<Transaction[]>((resolve, reject) => {
        const tx = db.transaction('transactions', 'readonly');
        const store = tx.objectStore('transactions');
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
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

    try {
      const stored = localStorage.getItem(LS_KEYS.transactions);
      const txs: Transaction[] = stored ? JSON.parse(stored) : [];
      const idx = txs.findIndex((t) => t.id === transaction.id);
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

  async saveBulkTransactions(transactions: Transaction[]): Promise<void> {
    try {
      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('transactions', 'readwrite');
        const store = tx.objectStore('transactions');
        for (const item of transactions) {
          store.put(item);
        }
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      console.warn('IndexedDB saveBulkTransactions fallback:', e);
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

    try {
      const stored = localStorage.getItem(LS_KEYS.transactions);
      if (stored) {
        const txs: Transaction[] = JSON.parse(stored);
        const filtered = txs.filter((t) => t.id !== id);
        mirrorToLocalStorage(LS_KEYS.transactions, filtered);
      }
    } catch {
      // ignore
    }
  },

  // 2. Debts
  async getDebts(userId?: string): Promise<Debt[]> {
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
        if (userId) {
          return records.filter((d) => d.userId === userId);
        }
        return records.filter((d) => !d.userId);
      }

      const stored = localStorage.getItem(LS_KEYS.debts);
      const all: Debt[] = stored ? JSON.parse(stored) : [];
      if (userId) {
        return all.filter((d) => d.userId === userId);
      }
      return all.filter((d) => !d.userId);
    } catch {
      const stored = localStorage.getItem(LS_KEYS.debts);
      const all: Debt[] = stored ? JSON.parse(stored) : [];
      if (userId) {
        return all.filter((d) => d.userId === userId);
      }
      return all.filter((d) => !d.userId);
    }
  },

  async getAllStoredDebts(): Promise<Debt[]> {
    try {
      const db = await openDB();
      return new Promise<Debt[]>((resolve, reject) => {
        const tx = db.transaction('debts', 'readonly');
        const store = tx.objectStore('debts');
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
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
      const idx = debts.findIndex((d) => d.id === debt.id);
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

  async saveBulkDebts(debts: Debt[]): Promise<void> {
    try {
      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('debts', 'readwrite');
        const store = tx.objectStore('debts');
        for (const item of debts) {
          store.put(item);
        }
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      console.warn('IndexedDB saveBulkDebts fallback:', e);
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
        const filtered = debts.filter((d) => d.id !== id);
        mirrorToLocalStorage(LS_KEYS.debts, filtered);
      }
    } catch {
      // ignore
    }
  },

  // 3. Settings
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

  // 4. Persistent Sync Queue for Offline-First Mutations
  async enqueueSync(item: Omit<SyncQueueItem, 'id' | 'createdAt' | 'retryCount'>): Promise<SyncQueueItem> {
    const queueItem: SyncQueueItem = {
      ...item,
      id: 'sync-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      createdAt: Date.now(),
      retryCount: 0,
    };

    try {
      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('sync_queue', 'readwrite');
        const store = tx.objectStore('sync_queue');
        store.put(queueItem);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      console.warn('IndexedDB enqueueSync fallback:', e);
      try {
        const raw = localStorage.getItem(LS_KEYS.syncQueue);
        const list: SyncQueueItem[] = raw ? JSON.parse(raw) : [];
        list.push(queueItem);
        localStorage.setItem(LS_KEYS.syncQueue, JSON.stringify(list));
      } catch {
        // ignore
      }
    }

    return queueItem;
  },

  async getSyncQueue(userId?: string): Promise<SyncQueueItem[]> {
    try {
      const db = await openDB();
      const items = await new Promise<SyncQueueItem[]>((resolve, reject) => {
        const tx = db.transaction('sync_queue', 'readonly');
        const store = tx.objectStore('sync_queue');
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });

      if (userId) {
        return items.filter((item) => !item.userId || item.userId === userId).sort((a, b) => a.createdAt - b.createdAt);
      }
      return items.sort((a, b) => a.createdAt - b.createdAt);
    } catch {
      try {
        const raw = localStorage.getItem(LS_KEYS.syncQueue);
        const list: SyncQueueItem[] = raw ? JSON.parse(raw) : [];
        if (userId) {
          return list.filter((item) => !item.userId || item.userId === userId).sort((a, b) => a.createdAt - b.createdAt);
        }
        return list.sort((a, b) => a.createdAt - b.createdAt);
      } catch {
        return [];
      }
    }
  },

  async removeSyncQueueItem(id: string): Promise<void> {
    try {
      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('sync_queue', 'readwrite');
        const store = tx.objectStore('sync_queue');
        store.delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      console.warn('IndexedDB removeSyncQueueItem fallback:', e);
    }

    try {
      const raw = localStorage.getItem(LS_KEYS.syncQueue);
      if (raw) {
        const list: SyncQueueItem[] = JSON.parse(raw);
        const filtered = list.filter((i) => i.id !== id);
        localStorage.setItem(LS_KEYS.syncQueue, JSON.stringify(filtered));
      }
    } catch {
      // ignore
    }
  },

  async updateSyncQueueItem(item: SyncQueueItem): Promise<void> {
    try {
      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('sync_queue', 'readwrite');
        const store = tx.objectStore('sync_queue');
        store.put(item);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      console.warn('IndexedDB updateSyncQueueItem fallback:', e);
    }
  },

  async clearSyncQueue(userId?: string): Promise<void> {
    if (!userId) {
      try {
        const db = await openDB();
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction('sync_queue', 'readwrite');
          tx.objectStore('sync_queue').clear();
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
      } catch {
        // ignore
      }
      localStorage.removeItem(LS_KEYS.syncQueue);
      return;
    }

    // Clear only for user
    const items = await this.getSyncQueue(userId);
    for (const item of items) {
      await this.removeSyncQueueItem(item.id);
    }
  },

  async getPendingSyncCount(userId?: string): Promise<number> {
    const queue = await this.getSyncQueue(userId);
    return queue.length;
  },

  // 5. Backup & Export
  async exportBackup(): Promise<BackupData> {
    const transactions = await this.getAllStoredTransactions();
    const debts = await this.getAllStoredDebts();
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
        const tx = db.transaction(['transactions', 'debts', 'settings', 'sync_queue'], 'readwrite');
        tx.objectStore('transactions').clear();
        tx.objectStore('debts').clear();
        tx.objectStore('settings').clear();
        tx.objectStore('sync_queue').clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      // ignore
    }
    localStorage.removeItem(LS_KEYS.transactions);
    localStorage.removeItem(LS_KEYS.debts);
    localStorage.removeItem(LS_KEYS.settings);
    localStorage.removeItem(LS_KEYS.syncQueue);
  },
};
