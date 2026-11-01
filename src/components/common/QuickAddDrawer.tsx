/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, TrendingDown, ArrowUpRight, HandCoins } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { TransactionModal } from '../transactions/TransactionModal';
import { DebtModal } from '../debts/DebtModal';

export const QuickAddDrawer: React.FC = () => {
  const { isQuickAddOpen, closeQuickAdd, quickAddInitialType, t } = useFinance();
  const [activeForm, setActiveForm] = useState<'income' | 'expense' | 'debt' | null>(null);

  useEffect(() => {
    if (isQuickAddOpen) {
      if (quickAddInitialType === 'choice') {
        setActiveForm(null);
      } else {
        setActiveForm(quickAddInitialType);
      }
    } else {
      setActiveForm(null);
    }
  }, [isQuickAddOpen, quickAddInitialType]);

  if (!isQuickAddOpen) return null;

  const handleSelect = (form: 'income' | 'expense' | 'debt') => {
    setActiveForm(form);
  };

  const handleCloseAll = () => {
    setActiveForm(null);
    closeQuickAdd();
  };

  return (
    <>
      {/* If an active form is selected, render the dedicated modal */}
      {activeForm === 'income' && (
        <TransactionModal
          isOpen={true}
          onClose={handleCloseAll}
          initialType="income"
        />
      )}

      {activeForm === 'expense' && (
        <TransactionModal
          isOpen={true}
          onClose={handleCloseAll}
          initialType="expense"
        />
      )}

      {activeForm === 'debt' && (
        <DebtModal
          isOpen={true}
          onClose={handleCloseAll}
          initialType="lent"
        />
      )}

      {/* Main Choice Sheet (if no specific form is active yet) */}
      {!activeForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-t-3xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {t.dashboard.quickAdd}
              </h3>
              <button
                type="button"
                onClick={closeQuickAdd}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-2.5">
              {/* Option 1: Expense */}
              <button
                type="button"
                onClick={() => handleSelect('expense')}
                className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40 hover:bg-rose-100/60 transition-all text-left cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <TrendingDown className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-rose-600 transition-colors">
                    {t.actions.addExpense}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t.categories.food}, {t.categories.groceries}, {t.categories.transport}...
                  </p>
                </div>
              </button>

              {/* Option 2: Income */}
              <button
                type="button"
                onClick={() => handleSelect('income')}
                className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40 hover:bg-emerald-100/60 transition-all text-left cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                    {t.actions.addIncome}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t.categories.salary}, {t.categories.business}, {t.categories.freelance}...
                  </p>
                </div>
              </button>

              {/* Option 3: Debt / Loan */}
              <button
                type="button"
                onClick={() => handleSelect('debt')}
                className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-left cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-800 dark:bg-slate-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <HandCoins className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors">
                    {t.actions.addDebt}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t.debts.lentTab.split(' ')[0]} / {t.debts.borrowedTab.split(' ')[0]}
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
