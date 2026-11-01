/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';

export const SummaryCards: React.FC = () => {
  const {
    t,
    formatMoney,
    totalBalance,
    totalIncome,
    totalExpenses,
    totalReceivable,
    totalPayable,
    todayIncome,
    todayExpense,
    thisMonthIncome,
    thisMonthExpense,
    savingsRate,
    setActiveTab,
    openQuickAdd,
  } = useFinance();

  return (
    <div className="space-y-4">
      {/* 1. Main Total Balance Hero Card */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-7 bg-slate-900 text-white dark:bg-slate-900 dark:border dark:border-slate-800 shadow-xl shadow-slate-900/5">
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs sm:text-sm font-medium text-slate-400">
            {t.dashboard.totalBalance}
          </span>
          <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800/80 text-emerald-400 border border-slate-700/50">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{savingsRate}% {t.dashboard.savingsRate}</span>
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight font-mono tabular-nums">
            {formatMoney(totalBalance)}
          </h2>
        </div>

        {/* Inflow vs Outflow Dual Substrip */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400">
                <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />
              </span>
              <span>{t.dashboard.totalIncome}</span>
            </div>
            <p className="text-lg sm:text-xl font-semibold text-emerald-400 font-mono tabular-nums">
              +{formatMoney(totalIncome)}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="flex items-center justify-center w-4 h-4 rounded-full bg-rose-500/20 text-rose-400">
                <TrendingDown className="w-3 h-3 stroke-[2.5]" />
              </span>
              <span>{t.dashboard.totalExpenses}</span>
            </div>
            <p className="text-lg sm:text-xl font-semibold text-rose-400 font-mono tabular-nums">
              -{formatMoney(totalExpenses)}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Receivable & Payable Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Receivable (টাকা পাব / পাওনা) */}
        <button
          type="button"
          onClick={() => setActiveTab('debts')}
          className="text-left group relative p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-800/80 transition-all shadow-xs cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center">
                <ArrowDownLeft className="w-4 h-4" />
              </div>
              <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                {t.dashboard.totalReceivable}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
          </div>
          <div className="mt-3">
            <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              {formatMoney(totalReceivable)}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {t.dashboard.receivableHint}
            </p>
          </div>
        </button>

        {/* Payable (টাকা দেব / দেনা) */}
        <button
          type="button"
          onClick={() => setActiveTab('debts')}
          className="text-left group relative p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-800/80 transition-all shadow-xs cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 flex items-center justify-center">
                <TrendingDown className="w-4 h-4" />
              </div>
              <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                {t.dashboard.totalPayable}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors" />
          </div>
          <div className="mt-3">
            <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              {formatMoney(totalPayable)}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {t.dashboard.payableHint}
            </p>
          </div>
        </button>
      </div>

      {/* 3. Today's Summary & Monthly Summary Strips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Today's Summary */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">
                {t.dashboard.todaySummary}
              </h3>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
              {new Date().toISOString().slice(0, 10)}
            </span>
          </div>

          <div className="mt-3.5 grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {t.dashboard.todayIncome}
              </p>
              <p className="mt-1 text-sm sm:text-base font-semibold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                +{formatMoney(todayIncome)}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {t.dashboard.todayExpense}
              </p>
              <p className="mt-1 text-sm sm:text-base font-semibold text-rose-600 dark:text-rose-400 font-mono tabular-nums">
                -{formatMoney(todayExpense)}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {t.dashboard.todayNet}
              </p>
              <p className={`mt-1 text-sm sm:text-base font-semibold font-mono tabular-nums ${
                todayIncome - todayExpense >= 0
                  ? 'text-slate-900 dark:text-white'
                  : 'text-rose-600 dark:text-rose-400'
              }`}>
                {formatMoney(todayIncome - todayExpense)}
              </p>
            </div>
          </div>
        </div>

        {/* Monthly Summary */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">
                {t.dashboard.monthlySummary}
              </h3>
            </div>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
              {savingsRate}% {t.dashboard.saved}
            </span>
          </div>

          <div className="mt-3.5 grid grid-cols-2 gap-4">
            <div className="space-y-0.5">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {t.dashboard.thisMonthIncome}
              </p>
              <p className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white font-mono tabular-nums">
                +{formatMoney(thisMonthIncome)}
              </p>
            </div>
            <div className="space-y-0.5 text-right">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {t.dashboard.thisMonthExpense}
              </p>
              <p className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white font-mono tabular-nums">
                -{formatMoney(thisMonthExpense)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
