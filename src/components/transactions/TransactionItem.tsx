/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { Transaction } from '../../types/finance';
import { useFinance } from '../../context/FinanceContext';
import { CategoryIcon } from '../common/CategoryBadge';

interface TransactionItemProps {
  transaction: Transaction;
  onEdit?: (tx: Transaction) => void;
  onDelete?: (id: string) => void;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  onEdit,
  onDelete,
}) => {
  const { t, formatMoney, formatAppDate, formatAppTime } = useFinance();
  const [menuOpen, setMenuOpen] = useState(false);

  const isIncome = transaction.type === 'income';
  const categoryLabel = t.categories[transaction.category] || transaction.category;
  const paymentMethodLabel = t.paymentMethods[transaction.paymentMethod] || transaction.paymentMethod;

  // Primary title text
  const primaryTitle = isIncome
    ? transaction.source || categoryLabel
    : transaction.whereSpent || categoryLabel;

  // Secondary subtext
  const secondaryDetail = isIncome
    ? transaction.description
    : transaction.whySpent || transaction.description;

  return (
    <div className="relative group flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-2xs">
      <div className="flex items-center gap-3.5 min-w-0">
        <CategoryIcon category={transaction.category} isIncome={isIncome} size="md" />

        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
              {primaryTitle}
            </h4>
          </div>

          {/* Clean unboxed metadata with dot separators */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
            <span>{categoryLabel}</span>
            <span aria-hidden="true">·</span>
            <span>{paymentMethodLabel}</span>
            <span aria-hidden="true">·</span>
            <span>{formatAppTime(transaction.time) || formatAppDate(transaction.date)}</span>
          </div>

          {secondaryDetail && (
            <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">
              {secondaryDetail}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0 ml-3">
        <div className="text-right">
          <span
            className={`text-sm sm:text-base font-bold font-mono tabular-nums ${
              isIncome
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {isIncome ? '+' : '-'}{formatMoney(transaction.amount)}
          </span>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 text-right">
            {formatAppDate(transaction.date)}
          </p>
        </div>

        {/* Action button menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center transition-colors"
            aria-label="Options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1 z-40 w-32 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg py-1 animate-in fade-in duration-100">
                {onEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit(transaction);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>{t.actions.edit}</span>
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete(transaction.id);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t.actions.delete}</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
