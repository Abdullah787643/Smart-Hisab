/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { BarChart3, PieChart } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Category, ExpenseCategory } from '../../types/finance';
import { getCategoryIcon } from '../common/CategoryBadge';

export const FinancialCharts: React.FC = () => {
  const { transactions, t, formatMoney, settings } = useFinance();

  // 1. Calculate 7-day trend data
  const weeklyData = useMemo(() => {
    const days: { dateStr: string; label: string; income: number; expense: number }[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      
      const dayName = d.toLocaleDateString(settings.language === 'bn' ? 'bn-BD' : 'en-US', {
        weekday: 'narrow',
      });

      days.push({
        dateStr,
        label: dayName,
        income: 0,
        expense: 0,
      });
    }

    transactions.forEach((tx) => {
      const target = days.find((d) => d.dateStr === tx.date);
      if (target) {
        if (tx.type === 'income') {
          target.income += Number(tx.amount) || 0;
        } else {
          target.expense += Number(tx.amount) || 0;
        }
      }
    });

    const maxVal = Math.max(
      ...days.map((d) => Math.max(d.income, d.expense)),
      1000
    );

    return { days, maxVal };
  }, [transactions, settings.language]);

  // 2. Expense Category Breakdown
  const categoryBreakdown = useMemo(() => {
    const map = new Map<Category, number>();
    let totalSpent = 0;

    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const amt = Number(t.amount) || 0;
        totalSpent += amt;
        map.set(t.category, (map.get(t.category) || 0) + amt);
      });

    const sorted = Array.from(map.entries())
      .map(([cat, amount]) => ({
        category: cat,
        amount,
        percentage: totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    return { sorted, totalSpent };
  }, [transactions]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Chart 1: 7-Day Income vs Expense Bar Chart */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {t.dashboard.weeklyTrend}
            </h3>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              {t.form.income}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              {t.form.expense}
            </span>
          </div>
        </div>

        <div className="mt-6 h-40 flex items-end justify-between gap-2 px-1">
          {weeklyData.days.map((item, idx) => {
            const incomeHeight = Math.max(4, Math.round((item.income / weeklyData.maxVal) * 100));
            const expenseHeight = Math.max(4, Math.round((item.expense / weeklyData.maxVal) * 100));

            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group">
                <div className="w-full flex items-end justify-center gap-1 h-32">
                  {/* Income bar */}
                  <div
                    style={{ height: `${item.income > 0 ? incomeHeight : 3}%` }}
                    className={`w-2.5 sm:w-3.5 rounded-t-md transition-all duration-300 ${
                      item.income > 0 ? 'bg-emerald-500 group-hover:bg-emerald-600' : 'bg-slate-100 dark:bg-slate-800'
                    }`}
                    title={`${item.dateStr} Income: ${formatMoney(item.income)}`}
                  />
                  {/* Expense bar */}
                  <div
                    style={{ height: `${item.expense > 0 ? expenseHeight : 3}%` }}
                    className={`w-2.5 sm:w-3.5 rounded-t-md transition-all duration-300 ${
                      item.expense > 0 ? 'bg-rose-500 group-hover:bg-rose-600' : 'bg-slate-100 dark:bg-slate-800'
                    }`}
                    title={`${item.dateStr} Expense: ${formatMoney(item.expense)}`}
                  />
                </div>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chart 2: Category Breakdown */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {t.dashboard.expenseByCategory}
            </h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
            {formatMoney(categoryBreakdown.totalSpent)}
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {categoryBreakdown.sorted.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">
              {t.dashboard.noTransactionsYet}
            </p>
          ) : (
            categoryBreakdown.sorted.map((item) => {
              const IconComp = getCategoryIcon(item.category);
              const label = t.categories[item.category] || item.category;

              return (
                <div key={item.category} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <IconComp className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 font-mono tabular-nums">
                      <span className="text-slate-900 dark:text-slate-100 font-medium">
                        {formatMoney(item.amount)}
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        ({item.percentage}%)
                      </span>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-500 rounded-full transition-all duration-300"
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
  );
};
