/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Sparkles,
  PieChart,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Category } from '../../types/finance';
import { getCategoryIcon } from '../common/CategoryBadge';

export const AnalyticsView: React.FC = () => {
  const {
    transactions,
    t,
    formatMoney,
    totalIncome,
    totalExpenses,
    savingsRate,
  } = useFinance();

  // Net cashflow
  const netSavings = totalIncome - totalExpenses;

  // Breakdown by expense category
  const expenseCategories = useMemo(() => {
    const map = new Map<Category, number>();
    let total = 0;

    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const amt = Number(t.amount) || 0;
        total += amt;
        map.set(t.category, (map.get(t.category) || 0) + amt);
      });

    return Array.from(map.entries())
      .map(([cat, amount]) => ({
        category: cat,
        amount,
        percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  // Breakdown by income category
  const incomeCategories = useMemo(() => {
    const map = new Map<Category, number>();
    let total = 0;

    transactions
      .filter((t) => t.type === 'income')
      .forEach((t) => {
        const amt = Number(t.amount) || 0;
        total += amt;
        map.set(t.category, (map.get(t.category) || 0) + amt);
      });

    return Array.from(map.entries())
      .map(([cat, amount]) => ({
        category: cat,
        amount,
        percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  // Top expense category
  const topExpense = expenseCategories[0];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          {t.analytics.title}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {t.analytics.subtitle}
        </p>
      </div>

      {/* Primary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Net Savings */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {t.analytics.netSavings}
          </span>
          <p
            className={`mt-2 text-2xl font-bold font-mono tabular-nums ${
              netSavings >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatMoney(netSavings)}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span>{savingsRate}% {t.dashboard.savingsRate}</span>
          </div>
        </div>

        {/* Total Inflow */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {t.analytics.totalInflow}
          </span>
          <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
            +{formatMoney(totalIncome)}
          </p>
          <span className="mt-2 block text-xs text-slate-400">
            {incomeCategories.length} {t.analytics.incomeSources}
          </span>
        </div>

        {/* Total Outflow */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {t.analytics.totalOutflow}
          </span>
          <p className="mt-2 text-2xl font-bold text-rose-600 dark:text-rose-400 font-mono tabular-nums">
            -{formatMoney(totalExpenses)}
          </p>
          <span className="mt-2 block text-xs text-slate-400">
            {topExpense ? `${t.categories[topExpense.category] || topExpense.category} (${topExpense.percentage}%)` : t.analytics.noExpensesYet}
          </span>
        </div>
      </div>

      {/* Category Breakdowns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Expense Categories */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-rose-500" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {t.analytics.spendingDistribution}
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {formatMoney(totalExpenses)}
            </span>
          </div>

          <div className="mt-4 space-y-3.5">
            {expenseCategories.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                {t.dashboard.noTransactionsYet}
              </p>
            ) : (
              expenseCategories.map((item) => {
                const IconComp = getCategoryIcon(item.category);
                return (
                  <div key={item.category} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <IconComp className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {t.categories[item.category] || item.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-slate-900 dark:text-white font-medium">
                          {formatMoney(item.amount)}
                        </span>
                        <span className="text-slate-400 text-[11px]">
                          ({item.percentage}%)
                        </span>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rose-500 rounded-full"
                        style={{ width: `${Math.max(2, item.percentage)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Income Categories */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {t.analytics.incomeDistribution}
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {formatMoney(totalIncome)}
            </span>
          </div>

          <div className="mt-4 space-y-3.5">
            {incomeCategories.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                {t.dashboard.noTransactionsYet}
              </p>
            ) : (
              incomeCategories.map((item) => {
                const IconComp = getCategoryIcon(item.category);
                return (
                  <div key={item.category} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <IconComp className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {t.categories[item.category] || item.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-slate-900 dark:text-white font-medium">
                          {formatMoney(item.amount)}
                        </span>
                        <span className="text-slate-400 text-[11px]">
                          ({item.percentage}%)
                        </span>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${Math.max(2, item.percentage)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
