/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Transaction,
  Debt,
  AppSettings,
  ActiveTab,
  PaymentMethod,
  DebtPayment,
  BackupData,
  QuickAddType,
} from '../types/finance';
import { dbService } from '../services/db';
import { getSampleData } from '../services/sampleData';
import { translations } from '../i18n/translations';
import { formatCurrency as formatCurr, formatDate as formatD, formatTime as formatT } from '../i18n/formatters';
import { useAuth } from './AuthContext';
import { api } from '../services/api';

interface FinanceContextType {
  transactions: Transaction[];
  debts: Debt[];
  settings: AppSettings;
  activeTab: ActiveTab;
  isLoading: boolean;
  toastMessage: string | null;
  t: typeof translations.en;
  isCloudSynced: boolean;

  // Computed values
  totalIncome: number;
  totalExpenses: number;
  totalBalance: number;
  totalReceivable: number;
  totalPayable: number;
  todayIncome: number;
  todayExpense: number;
  todayNet: number;
  thisMonthIncome: number;
  thisMonthExpense: number;
  savingsRate: number;

  // Formatting helpers bound to current settings
  formatMoney: (amount: number) => string;
  formatAppDate: (dateString: string) => string;
  formatAppTime: (timeString?: string) => string;

  // Actions
  setActiveTab: (tab: ActiveTab) => void;
  showToast: (msg: string) => void;
  addTransaction: (
    data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>,
    bypassDuplicateCheck?: boolean
  ) => Promise<{ success: boolean; duplicate?: boolean }>;
  updateTransaction: (transaction: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  addDebt: (
    data: Omit<Debt, 'id' | 'payments' | 'createdAt' | 'updatedAt' | 'status'>,
    adjustCashBalance?: boolean
  ) => Promise<void>;
  updateDebt: (debt: Debt) => Promise<void>;
  deleteDebt: (id: string) => Promise<void>;
  recordDebtPayment: (
    debtId: string,
    payment: { amount: number; date: string; time: string; note?: string; paymentMethod?: PaymentMethod }
  ) => Promise<{ settled: boolean }>;
  deleteDebtPayment: (debtId: string, paymentId: string) => Promise<void>;
  settleDebtImmediately: (debtId: string) => Promise<void>;

  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  exportBackup: () => Promise<void>;
  importBackup: (file: File) => Promise<boolean>;
  loadSampleData: () => Promise<void>;
  clearAllData: () => Promise<void>;

  // Modal controls
  isQuickAddOpen: boolean;
  quickAddInitialType: QuickAddType;
  openQuickAdd: (type?: QuickAddType) => void;
  closeQuickAdd: () => void;

  editingTransaction: Transaction | null;
  setEditingTransaction: (tx: Transaction | null) => void;

  editingDebt: Debt | null;
  setEditingDebt: (debt: Debt | null) => void;

  recordingPaymentDebt: Debt | null;
  setRecordingPaymentDebt: (debt: Debt | null) => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const isCloudSynced = Boolean(currentUser);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    language: 'en',
    currency: 'BDT',
    theme: 'light',
    bengaliDigits: false,
    hasSeededInitialData: false,
  });
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddInitialType, setQuickAddInitialType] = useState<QuickAddType>('choice');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [recordingPaymentDebt, setRecordingPaymentDebt] = useState<Debt | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 3200);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Load app settings from local database
  useEffect(() => {
    dbService.getSettings().then((loadedSettings) => {
      if (loadedSettings) {
        setSettings(loadedSettings);
      }
    });
  }, []);

  // Synchronize financial data whenever currentUser changes
  useEffect(() => {
    let isCancelled = false;

    if (currentUser?.id) {
      setIsLoading(true);
      // Immediately reset state to guarantee complete data isolation between accounts
      setTransactions([]);
      setDebts([]);

      api
        .syncData()
        .then((res) => {
          if (!isCancelled && res.success && res.data) {
            setTransactions(res.data.transactions || []);
            setDebts(res.data.debts || []);
            if (res.data.settings) {
              setSettings((prev) => ({
                ...prev,
                ...res.data.settings,
              }));
            }
          }
        })
        .catch((err) => {
          console.warn('API sync failed, falling back to local cache:', err);
          if (!isCancelled) {
            dbService.getTransactions().then((txs) => setTransactions(txs.filter((t) => t.userId === currentUser.id)));
            dbService.getDebts().then((d) => setDebts(d.filter((item) => item.userId === currentUser.id)));
          }
        })
        .finally(() => {
          if (!isCancelled) setIsLoading(false);
        });
    } else {
      // Local Guest mode (IndexedDB)
      setIsLoading(true);
      Promise.all([dbService.getTransactions(), dbService.getDebts()])
        .then(([loadedTxs, loadedDebts]) => {
          if (isCancelled) return;
          // Filter to non-user or local records
          const localTxs = loadedTxs.filter((t) => !t.userId);
          const localDebts = loadedDebts.filter((d) => !d.userId);

          if (!settings.hasSeededInitialData && localTxs.length === 0 && localDebts.length === 0) {
            const sample = getSampleData();
            setTransactions(sample.transactions);
            setDebts(sample.debts);
          } else {
            setTransactions(localTxs.length > 0 ? localTxs : loadedTxs);
            setDebts(localDebts.length > 0 ? localDebts : loadedDebts);
          }
        })
        .finally(() => {
          if (!isCancelled) setIsLoading(false);
        });
    }

    return () => {
      isCancelled = true;
    };
  }, [currentUser?.id, settings.hasSeededInitialData]);

  // Sync theme to HTML document element
  useEffect(() => {
    const root = document.documentElement;
    const isDark =
      settings.theme === 'dark' ||
      (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.theme]);

  // Active translation dictionary
  const t = translations[settings.language] || translations.en;

  // Format helpers
  const formatMoney = useCallback(
    (amount: number) => {
      return formatCurr(amount, settings.currency, settings.language, settings.bengaliDigits);
    },
    [settings.currency, settings.language, settings.bengaliDigits]
  );

  const formatAppDate = useCallback(
    (dateString: string) => {
      return formatD(dateString, settings.language, settings.bengaliDigits);
    },
    [settings.language, settings.bengaliDigits]
  );

  const formatAppTime = useCallback(
    (timeString?: string) => {
      return formatT(timeString, settings.language);
    },
    [settings.language]
  );

  // Financial Calculations
  const totalIncome = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [transactions]);

  const totalExpenses = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [transactions]);

  const totalBalance = useMemo(() => {
    return totalIncome - totalExpenses;
  }, [totalIncome, totalExpenses]);

  // Receivables: Lent debts remaining
  const totalReceivable = useMemo(() => {
    return debts
      .filter((d) => d.type === 'lent' && d.status !== 'settled')
      .reduce((sum, d) => {
        const paid = (d.payments || []).reduce((pSum, p) => pSum + (Number(p.amount) || 0), 0);
        const remaining = Math.max(0, d.totalAmount - paid);
        return sum + remaining;
      }, 0);
  }, [debts]);

  // Payables: Borrowed debts remaining
  const totalPayable = useMemo(() => {
    return debts
      .filter((d) => d.type === 'borrowed' && d.status !== 'settled')
      .reduce((sum, d) => {
        const paid = (d.payments || []).reduce((pSum, p) => pSum + (Number(p.amount) || 0), 0);
        const remaining = Math.max(0, d.totalAmount - paid);
        return sum + remaining;
      }, 0);
  }, [debts]);

  // Today's summary
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const currentMonthStr = todayStr.slice(0, 7); // YYYY-MM

  const todayIncome = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'income' && t.date === todayStr)
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [transactions, todayStr]);

  const todayExpense = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'expense' && t.date === todayStr)
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [transactions, todayStr]);

  const todayNet = useMemo(() => {
    return todayIncome - todayExpense;
  }, [todayIncome, todayExpense]);

  const thisMonthIncome = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'income' && t.date.startsWith(currentMonthStr))
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [transactions, currentMonthStr]);

  const thisMonthExpense = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'expense' && t.date.startsWith(currentMonthStr))
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [transactions, currentMonthStr]);

  const savingsRate = useMemo(() => {
    if (thisMonthIncome <= 0) return 0;
    const net = thisMonthIncome - thisMonthExpense;
    return Math.max(0, Math.min(100, Math.round((net / thisMonthIncome) * 100)));
  }, [thisMonthIncome, thisMonthExpense]);

  // Transactions Management
  const addTransaction = async (
    data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>,
    bypassDuplicateCheck = false
  ): Promise<{ success: boolean; duplicate?: boolean }> => {
    if (!bypassDuplicateCheck) {
      const isDuplicate = transactions.some(
        (t) =>
          t.type === data.type &&
          t.amount === data.amount &&
          t.category === data.category &&
          t.date === data.date &&
          Math.abs(Date.now() - t.createdAt) < 600000
      );
      if (isDuplicate) {
        return { success: false, duplicate: true };
      }
    }

    const newTx: Transaction = {
      ...data,
      id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      userId: currentUser?.id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    if (currentUser?.id) {
      await api.saveTransaction(newTx);
    }
    await dbService.saveTransaction(newTx);
    setTransactions((prev) => [newTx, ...prev.filter((t) => t.id !== newTx.id)]);
    showToast(t.toast.transactionAdded);
    return { success: true };
  };

  const updateTransaction = async (transaction: Transaction) => {
    const updated: Transaction = {
      ...transaction,
      userId: currentUser?.id || transaction.userId,
      updatedAt: Date.now(),
    };
    if (currentUser?.id) {
      await api.updateTransaction(updated.id, updated);
    }
    await dbService.saveTransaction(updated);
    setTransactions((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    showToast(t.toast.transactionUpdated);
    setEditingTransaction(null);
  };

  const deleteTransaction = async (id: string) => {
    if (currentUser?.id) {
      await api.deleteTransaction(id);
    }
    await dbService.deleteTransaction(id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    showToast(t.toast.transactionDeleted);
  };

  // Debt Management
  const addDebt = async (
    data: Omit<Debt, 'id' | 'payments' | 'createdAt' | 'updatedAt' | 'status'>,
    adjustCashBalance = false
  ) => {
    const newDebt: Debt = {
      ...data,
      id: 'debt-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      userId: currentUser?.id,
      status: 'pending',
      payments: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    if (currentUser?.id) {
      await api.saveDebt(newDebt);
    }
    await dbService.saveDebt(newDebt);
    setDebts((prev) => [newDebt, ...prev.filter((d) => d.id !== newDebt.id)]);

    // If user selected to adjust cash balance immediately
    if (adjustCashBalance) {
      const currentTime = new Date();
      const timeStr = `${String(currentTime.getHours()).padStart(2, '0')}:${String(currentTime.getMinutes()).padStart(2, '0')}`;
      if (data.type === 'lent') {
        // Cash outflow
        const outTx: Transaction = {
          id: 'tx-debt-out-' + Date.now(),
          type: 'expense',
          amount: data.totalAmount,
          category: 'other',
          date: data.startDate,
          time: timeStr,
          whereSpent: data.personName,
          whySpent: `Lent to ${data.personName}`,
          paymentMethod: 'cash',
          userId: currentUser?.id,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        if (currentUser?.id) {
          await api.saveTransaction(outTx);
        }
        await dbService.saveTransaction(outTx);
        setTransactions((prev) => [outTx, ...prev]);
      } else {
        // Cash inflow
        const inTx: Transaction = {
          id: 'tx-debt-in-' + Date.now(),
          type: 'income',
          amount: data.totalAmount,
          category: 'other',
          date: data.startDate,
          time: timeStr,
          source: data.personName,
          description: `Borrowed from ${data.personName}`,
          paymentMethod: 'cash',
          userId: currentUser?.id,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        if (currentUser?.id) {
          await api.saveTransaction(inTx);
        }
        await dbService.saveTransaction(inTx);
        setTransactions((prev) => [inTx, ...prev]);
      }
    }

    showToast(t.toast.debtAdded);
  };

  const updateDebt = async (debt: Debt) => {
    const totalPaid = (debt.payments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const isSettled = totalPaid >= debt.totalAmount;
    const newStatus: Debt['status'] = isSettled ? 'settled' : totalPaid > 0 ? 'partial' : 'pending';

    const updated: Debt = {
      ...debt,
      userId: currentUser?.id || debt.userId,
      status: newStatus,
      updatedAt: Date.now(),
    };
    if (currentUser?.id) {
      await api.updateDebt(updated.id, updated);
    }
    await dbService.saveDebt(updated);
    setDebts((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
    showToast(t.toast.debtUpdated);
    setEditingDebt(null);
  };

  const deleteDebt = async (id: string) => {
    if (currentUser?.id) {
      await api.deleteDebt(id);
    }
    await dbService.deleteDebt(id);
    setDebts((prev) => prev.filter((d) => d.id !== id));
    showToast(t.toast.debtDeleted);
  };

  const recordDebtPayment = async (
    debtId: string,
    paymentData: { amount: number; date: string; time: string; note?: string; paymentMethod?: PaymentMethod }
  ): Promise<{ settled: boolean }> => {
    const target = debts.find((d) => d.id === debtId);
    if (!target) return { settled: false };

    const newPayment: DebtPayment = {
      id: 'pay-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      amount: paymentData.amount,
      date: paymentData.date,
      time: paymentData.time,
      note: paymentData.note,
      paymentMethod: paymentData.paymentMethod || 'cash',
      createdAt: Date.now(),
    };

    const updatedPayments = [...(target.payments || []), newPayment];
    const totalPaid = updatedPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const isSettled = totalPaid >= target.totalAmount;
    const newStatus: Debt['status'] = isSettled ? 'settled' : totalPaid > 0 ? 'partial' : 'pending';

    const updatedDebt: Debt = {
      ...target,
      userId: currentUser?.id || target.userId,
      payments: updatedPayments,
      status: newStatus,
      updatedAt: Date.now(),
    };

    if (currentUser?.id) {
      await api.recordDebtPayment(debtId, newPayment);
    }
    await dbService.saveDebt(updatedDebt);
    setDebts((prev) => prev.map((d) => (d.id === updatedDebt.id ? updatedDebt : d)));

    // Automatically record corresponding financial transaction so Total Balance updates!
    if (target.type === 'lent') {
      const collectionTx: Transaction = {
        id: 'tx-pay-' + Date.now(),
        type: 'income',
        amount: paymentData.amount,
        category: 'debt_collection',
        date: paymentData.date,
        time: paymentData.time,
        source: target.personName,
        description: `${paymentData.note || 'Debt repayment'} (${target.personName})`,
        paymentMethod: paymentData.paymentMethod || 'cash',
        userId: currentUser?.id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      if (currentUser?.id) {
        await api.saveTransaction(collectionTx);
      }
      await dbService.saveTransaction(collectionTx);
      setTransactions((prev) => [collectionTx, ...prev]);
    } else {
      const repaymentTx: Transaction = {
        id: 'tx-pay-' + Date.now(),
        type: 'expense',
        amount: paymentData.amount,
        category: 'debt_payment',
        date: paymentData.date,
        time: paymentData.time,
        whereSpent: target.personName,
        whySpent: `${paymentData.note || 'Debt payment to'} ${target.personName}`,
        paymentMethod: paymentData.paymentMethod || 'cash',
        userId: currentUser?.id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      if (currentUser?.id) {
        await api.saveTransaction(repaymentTx);
      }
      await dbService.saveTransaction(repaymentTx);
      setTransactions((prev) => [repaymentTx, ...prev]);
    }

    if (isSettled) {
      showToast(t.debts.settledCongratulations);
    } else {
      showToast(t.debts.paymentSuccess);
    }

    setRecordingPaymentDebt(null);
    return { settled: isSettled };
  };

  const deleteDebtPayment = async (debtId: string, paymentId: string) => {
    const target = debts.find((d) => d.id === debtId);
    if (!target) return;

    const paymentToDelete = (target.payments || []).find((p) => p.id === paymentId);
    const updatedPayments = (target.payments || []).filter((p) => p.id !== paymentId);
    const totalPaid = updatedPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const isSettled = totalPaid >= target.totalAmount;
    const newStatus: Debt['status'] = isSettled ? 'settled' : totalPaid > 0 ? 'partial' : 'pending';

    const updatedDebt: Debt = {
      ...target,
      userId: currentUser?.id || target.userId,
      payments: updatedPayments,
      status: newStatus,
      updatedAt: Date.now(),
    };

    if (currentUser?.id) {
      await api.deleteDebtPayment(debtId, paymentId);
    }
    await dbService.saveDebt(updatedDebt);
    setDebts((prev) => prev.map((d) => (d.id === updatedDebt.id ? updatedDebt : d)));

    if (paymentToDelete) {
      const matchingTx = transactions.find(
        (t) =>
          t.date === paymentToDelete.date &&
          t.amount === paymentToDelete.amount &&
          ((target.type === 'lent' && t.category === 'debt_collection') ||
            (target.type === 'borrowed' && t.category === 'debt_payment'))
      );
      if (matchingTx) {
        if (currentUser?.id) {
          await api.deleteTransaction(matchingTx.id);
        }
        await dbService.deleteTransaction(matchingTx.id);
        setTransactions((prev) => prev.filter((t) => t.id !== matchingTx.id));
      }
    }

    showToast(t.toast.debtPaymentDeleted);
  };

  const settleDebtImmediately = async (debtId: string) => {
    const target = debts.find((d) => d.id === debtId);
    if (!target) return;
    const totalPaid = (target.payments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const remaining = Math.max(0, target.totalAmount - totalPaid);
    if (remaining <= 0) return;

    const dateStr = new Date().toISOString().slice(0, 10);
    const timeStr = `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`;

    await recordDebtPayment(debtId, {
      amount: remaining,
      date: dateStr,
      time: timeStr,
      note: 'Full settlement',
      paymentMethod: 'cash',
    });
  };

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    const merged: AppSettings = { ...settings, ...newSettings };
    await dbService.saveSettings(merged);
    setSettings(merged);
    if (currentUser?.id) {
      try {
        await api.saveUserSettings(newSettings);
      } catch (err) {
        console.warn('Failed to sync settings to cloud backend:', err);
      }
    }
    showToast(translations[merged.language]?.toast?.settingsSaved || 'Settings saved');
  };

  const exportBackup = async () => {
    const backup = await dbService.exportBackup();
    // Include in-memory transactions & debts
    backup.data.transactions = transactions;
    backup.data.debts = debts;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `smart-hisab-backup-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast(t.actions.exportSuccess);
  };

  const importBackup = async (file: File): Promise<boolean> => {
    try {
      const text = await file.text();
      const backup: BackupData = JSON.parse(text);
      if (!backup || !backup.data) {
        showToast(t.toast.importFailed);
        return false;
      }
      await dbService.restoreBackup(backup);
      const restoredTxs = backup.data.transactions || [];
      const restoredDebts = backup.data.debts || [];

      if (currentUser?.id) {
        for (const tx of restoredTxs) {
          await api.saveTransaction({ ...tx, userId: currentUser.id });
        }
        for (const d of restoredDebts) {
          await api.saveDebt({ ...d, userId: currentUser.id });
        }
      }

      setTransactions(restoredTxs);
      setDebts(restoredDebts);
      if (backup.data.settings) {
        setSettings(backup.data.settings);
      }
      showToast(t.actions.importSuccess);
      return true;
    } catch (e) {
      console.error(e);
      showToast(t.toast.importFailed);
      return false;
    }
  };

  const loadSampleData = async () => {
    const sample = getSampleData();
    await dbService.clearAllData();
    if (currentUser?.id) {
      await api.clearAllUserData();
      for (const tx of sample.transactions) {
        await api.saveTransaction({ ...tx, userId: currentUser.id });
      }
      for (const d of sample.debts) {
        await api.saveDebt({ ...d, userId: currentUser.id });
      }
    }
    for (const tx of sample.transactions) {
      await dbService.saveTransaction(tx);
    }
    for (const d of sample.debts) {
      await dbService.saveDebt(d);
    }
    setTransactions(sample.transactions);
    setDebts(sample.debts);
    showToast(t.toast.sampleDataLoaded);
  };

  const clearAllData = async () => {
    if (currentUser?.id) {
      await api.clearAllUserData();
    }
    await dbService.clearAllData();
    setTransactions([]);
    setDebts([]);
    showToast(t.toast.dataReset);
  };

  const openQuickAdd = (type: QuickAddType = 'choice') => {
    setQuickAddInitialType(type);
    setIsQuickAddOpen(true);
  };

  const closeQuickAdd = () => {
    setIsQuickAddOpen(false);
  };

  return (
    <FinanceContext.Provider
      value={{
        transactions,
        debts,
        settings,
        activeTab,
        isLoading,
        toastMessage,
        t,
        isCloudSynced,
        totalIncome,
        totalExpenses,
        totalBalance,
        totalReceivable,
        totalPayable,
        todayIncome,
        todayExpense,
        todayNet,
        thisMonthIncome,
        thisMonthExpense,
        savingsRate,
        formatMoney,
        formatAppDate,
        formatAppTime,
        setActiveTab,
        showToast,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addDebt,
        updateDebt,
        deleteDebt,
        recordDebtPayment,
        deleteDebtPayment,
        settleDebtImmediately,
        updateSettings,
        exportBackup,
        importBackup,
        loadSampleData,
        clearAllData,
        isQuickAddOpen,
        quickAddInitialType,
        openQuickAdd,
        closeQuickAdd,
        editingTransaction,
        setEditingTransaction,
        editingDebt,
        setEditingDebt,
        recordingPaymentDebt,
        setRecordingPaymentDebt,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
