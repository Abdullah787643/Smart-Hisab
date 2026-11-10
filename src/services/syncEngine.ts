/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SyncQueueItem, SyncStatus, Transaction, Debt, AppSettings } from '../types/finance';
import { dbService } from './db';
import { api } from './api';

type SyncListener = (status: SyncStatus, pendingCount: number) => void;
type DataUpdateCallback = (data: {
  transactions: Transaction[];
  debts: Debt[];
  settings?: Partial<AppSettings> | null;
}) => void;

class SyncEngine {
  private status: SyncStatus = typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'synced';
  private pendingCount = 0;
  private listeners: Set<SyncListener> = new Set();
  private dataUpdateCallbacks: Set<DataUpdateCallback> = new Set();
  private isProcessing = false;
  private activeUserId: string | null = null;
  private syncTimeout: any = null;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleNetworkChange(true));
      window.addEventListener('offline', () => this.handleNetworkChange(false));
    }
  }

  public init(userId?: string) {
    this.activeUserId = userId || null;
    this.updatePendingCount().then(() => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        this.setStatus('offline');
      } else if (this.pendingCount > 0) {
        this.triggerSync();
      } else {
        this.setStatus('synced');
      }
    });
  }

  public setActiveUser(userId: string | null) {
    this.activeUserId = userId;
    this.updatePendingCount();
    if (userId && this.isOnline()) {
      this.triggerSync();
    }
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.status, this.pendingCount);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public onDataUpdate(cb: DataUpdateCallback): () => void {
    this.dataUpdateCallbacks.add(cb);
    return () => {
      this.dataUpdateCallbacks.delete(cb);
    };
  }

  public isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  public getStatus(): SyncStatus {
    return this.status;
  }

  public getPendingCount(): number {
    return this.pendingCount;
  }

  private setStatus(newStatus: SyncStatus) {
    this.status = newStatus;
    this.notifyListeners();
  }

  private notifyListeners() {
    for (const listener of this.listeners) {
      listener(this.status, this.pendingCount);
    }
  }

  private async updatePendingCount() {
    this.pendingCount = await dbService.getPendingSyncCount(this.activeUserId || undefined);
    this.notifyListeners();
  }

  private handleNetworkChange(isOnline: boolean) {
    if (!isOnline) {
      this.setStatus('offline');
    } else {
      this.setStatus('syncing');
      // Delay slightly for network stack stabilization
      if (this.syncTimeout) clearTimeout(this.syncTimeout);
      this.syncTimeout = setTimeout(() => {
        this.triggerSync();
      }, 1000);
    }
  }

  /**
   * Main synchronization trigger: processes pending mutations, then pulls and reconciles cloud state
   */
  public async triggerSync(): Promise<boolean> {
    if (this.isProcessing) return false;
    if (!this.isOnline()) {
      this.setStatus('offline');
      return false;
    }

    const token = api.getToken();
    if (!token || !this.activeUserId) {
      // Guest or not logged in: local changes remain in IndexedDB
      await this.updatePendingCount();
      this.setStatus(this.isOnline() ? 'synced' : 'offline');
      return true;
    }

    this.isProcessing = true;
    this.setStatus('syncing');

    try {
      // 1. Drain pending sync queue for current user
      const queue = await dbService.getSyncQueue(this.activeUserId);
      for (const item of queue) {
        if (!this.isOnline()) {
          this.setStatus('offline');
          this.isProcessing = false;
          return false;
        }

        try {
          await this.processQueueItem(item);
          await dbService.removeSyncQueueItem(item.id);
        } catch (itemErr: any) {
          console.warn(`Sync queue item ${item.action} failed:`, itemErr);
          const isNetworkError =
            itemErr.name === 'TypeError' ||
            (itemErr.message && itemErr.message.includes('Failed to fetch')) ||
            !this.isOnline();

          if (isNetworkError) {
            this.setStatus('offline');
            this.isProcessing = false;
            return false;
          }

          // If it's a permanent HTTP error or max retries reached, don't block entire queue forever
          item.retryCount = (item.retryCount || 0) + 1;
          item.lastError = itemErr.message || 'Sync error';
          if (item.retryCount >= 5) {
            console.error('Max retry attempts reached for sync item. Evicting:', item);
            await dbService.removeSyncQueueItem(item.id);
          } else {
            await dbService.updateSyncQueueItem(item);
          }
        }
      }

      await this.updatePendingCount();

      // 2. Fetch latest records from Supabase / Cloud backend
      const res = await api.syncData();
      if (res.success && res.data) {
        await this.reconcileCloudData(res.data);
      }

      this.setStatus('synced');
      return true;
    } catch (err: any) {
      console.warn('Sync failed:', err);
      const isNetwork =
        err.name === 'TypeError' || (err.message && err.message.includes('Failed to fetch')) || !this.isOnline();

      if (isNetwork) {
        this.setStatus('offline');
      } else {
        this.setStatus('error');
      }
      return false;
    } finally {
      this.isProcessing = false;
      await this.updatePendingCount();
    }
  }

  /**
   * Process individual mutation
   */
  private async processQueueItem(item: SyncQueueItem): Promise<void> {
    switch (item.action) {
      case 'CREATE_TX':
        await api.saveTransaction(item.payload);
        break;
      case 'UPDATE_TX':
        await api.updateTransaction(item.entityId, item.payload);
        break;
      case 'DELETE_TX':
        await api.deleteTransaction(item.entityId);
        break;
      case 'CREATE_DEBT':
        await api.saveDebt(item.payload);
        break;
      case 'UPDATE_DEBT':
        await api.updateDebt(item.entityId, item.payload);
        break;
      case 'DELETE_DEBT':
        await api.deleteDebt(item.entityId);
        break;
      case 'RECORD_PAYMENT':
        await api.recordDebtPayment(item.payload.debtId, item.payload.payment);
        break;
      case 'DELETE_PAYMENT':
        await api.deleteDebtPayment(item.payload.debtId, item.payload.paymentId);
        break;
      case 'UPDATE_SETTINGS':
        await api.saveUserSettings(item.payload);
        break;
      default:
        console.warn('Unknown sync action:', item.action);
    }
  }

  /**
   * Conflict resolution using Last-Write-Wins (LWW) based on updatedAt timestamps
   */
  private async reconcileCloudData(cloudData: {
    transactions: Transaction[];
    debts: Debt[];
    settings?: Partial<AppSettings> | null;
  }) {
    if (!this.activeUserId) return;

    // Get current local records for this user
    const localTxs = await dbService.getTransactions(this.activeUserId);
    const localDebts = await dbService.getDebts(this.activeUserId);

    const localTxMap = new Map<string, Transaction>(localTxs.map((t) => [t.id, t]));
    const localDebtMap = new Map<string, Debt>(localDebts.map((d) => [d.id, d]));

    // Merged transactions
    const mergedTxs: Transaction[] = [];
    for (const cloudTx of cloudData.transactions || []) {
      const local = localTxMap.get(cloudTx.id);
      if (!local) {
        // New record from cloud (e.g. from another device)
        mergedTxs.push(cloudTx);
      } else {
        // Conflict resolution: compare updatedAt
        if ((cloudTx.updatedAt || 0) >= (local.updatedAt || 0)) {
          mergedTxs.push(cloudTx);
        } else {
          // Local is newer
          mergedTxs.push(local);
        }
      }
    }

    // Keep any local transactions that haven't synced yet
    for (const [id, local] of localTxMap.entries()) {
      if (!mergedTxs.some((t) => t.id === id)) {
        mergedTxs.push(local);
      }
    }

    // Merged debts
    const mergedDebts: Debt[] = [];
    for (const cloudDebt of cloudData.debts || []) {
      const local = localDebtMap.get(cloudDebt.id);
      if (!local) {
        mergedDebts.push(cloudDebt);
      } else {
        if ((cloudDebt.updatedAt || 0) >= (local.updatedAt || 0)) {
          mergedDebts.push(cloudDebt);
        } else {
          mergedDebts.push(local);
        }
      }
    }

    for (const [id, local] of localDebtMap.entries()) {
      if (!mergedDebts.some((d) => d.id === id)) {
        mergedDebts.push(local);
      }
    }

    // Persist reconciled records into local IndexedDB
    await dbService.saveBulkTransactions(mergedTxs);
    await dbService.saveBulkDebts(mergedDebts);

    // Notify React state listeners
    for (const cb of this.dataUpdateCallbacks) {
      cb({
        transactions: mergedTxs,
        debts: mergedDebts,
        settings: cloudData.settings,
      });
    }
  }
}

export const syncEngine = new SyncEngine();
