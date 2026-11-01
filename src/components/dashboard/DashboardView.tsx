/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { Plus, ArrowUpRight, TrendingDown, HandCoins, ArrowRight } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { SummaryCards } from './SummaryCards';
import { FinancialCharts } from './FinancialCharts';
import { TransactionItem } from '../transactions/TransactionItem';

export const DashboardView: React.FC = () => {
  const {
    transactions,
    t,
    openQuickAdd,
    setActiveTab,
    setEditingTransaction,
    deleteTransaction,
  } = useFinance();

  // Time-based greeting
  const greeting = useMemo(() => {
    const hours = new Date().getHours();
    if (hours >= 4 && hours < 12) return t.dashboard.greetingMorning;
    if (hours >= 12 && hours < 17) return t.dashboard.greetingAfternoon;
    return t.dashboard.greetingEvening;
  }, [t]);

  // Last 5 recent transactions
  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)
      .slice(0, 5);
  }, [transactions]);

  return (
    <div className="space-y-6">
      {/* Top Greeting and Quick Add Buttons Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            {greeting}
          </span>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t.appName}
          </h1>
        </div>

        {/* Action Triggers */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => openQuickAdd('expense')}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/50 dark:text-rose-400 dark:hover:bg-rose-900/50 transition-colors cursor-pointer min-h-[40px]"
          >
            <TrendingDown className="w-3.5 h-3.5" />
            <span>{t.actions.addExpense}</span>
          </button>
          <button
            type="button"
            onClick={() => openQuickAdd('income')}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-400 dark:hover:bg-emerald-900/50 transition-colors cursor-pointer min-h-[40px]"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{t.actions.addIncome}</span>
          </button>
          <button
            type="button"
            onClick={() => openQuickAdd('debt')}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer min-h-[40px]"
          >
            <HandCoins className="w-3.5 h-3.5" />
            <span>{t.actions.addDebt}</span>
          </button>
        </div>
      </div>

      {/* High-Level Financial Metrics */}
      <SummaryCards />

      {/* Visual Charts: 7-Day Trend + Expense Breakdown */}
      <FinancialCharts />

      {/* Recent Activity List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {t.dashboard.recentTransactions}
          </h3>
          <button
            type="button"
            onClick={() => setActiveTab('transactions')}
            className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
          >
            <span>{t.dashboard.viewAll}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="text-center py-10 px-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              {t.dashboard.noTransactionsYet}
            </p>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              {t.dashboard.quickAddPrompt}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentTransactions.map((tx) => (
              <TransactionItem
                key={tx.id}
                transaction={tx}
                onEdit={(item) => setEditingTransaction(item)}
                onDelete={(id) => deleteTransaction(id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
