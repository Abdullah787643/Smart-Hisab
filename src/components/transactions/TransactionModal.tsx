/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import {
  Transaction,
  TransactionType,
  Category,
  IncomeCategory,
  ExpenseCategory,
  PaymentMethod,
} from '../../types/finance';
import { useFinance } from '../../context/FinanceContext';
import { CategoryIcon } from '../common/CategoryBadge';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: TransactionType;
  editingTransaction?: Transaction | null;
}

const INCOME_CATEGORIES: IncomeCategory[] = [
  'salary',
  'business',
  'freelance',
  'investment',
  'rental',
  'gift',
  'bonus',
  'debt_collection',
  'other',
];

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'food',
  'groceries',
  'housing',
  'utilities',
  'transport',
  'shopping',
  'medical',
  'education',
  'entertainment',
  'family',
  'debt_payment',
  'charity',
  'other',
];

const PAYMENT_METHODS: PaymentMethod[] = [
  'cash',
  'bkash',
  'nagad',
  'rocket',
  'bank',
  'credit_card',
  'debit_card',
  'other',
];

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  initialType = 'expense',
  editingTransaction,
}) => {
  const { t, addTransaction, updateTransaction, settings } = useFinance();

  const [type, setType] = useState<TransactionType>(initialType);
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<Category>('food');
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [source, setSource] = useState<string>('');
  const [whereSpent, setWhereSpent] = useState<string>('');
  const [whySpent, setWhySpent] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [description, setDescription] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<boolean>(false);

  // Quick amounts depending on currency
  const quickIncrements = settings.currency === 'BDT' ? [100, 500, 1000, 5000] : [10, 20, 50, 100];

  // Initialize or reset form values
  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setAmount(String(editingTransaction.amount));
      setCategory(editingTransaction.category);
      setDate(editingTransaction.date);
      setTime(editingTransaction.time || '12:00');
      setSource(editingTransaction.source || '');
      setWhereSpent(editingTransaction.whereSpent || '');
      setWhySpent(editingTransaction.whySpent || '');
      setPaymentMethod(editingTransaction.paymentMethod || 'cash');
      setDescription(editingTransaction.description || '');
      setDuplicateWarning(false);
      setError(null);
    } else {
      const now = new Date();
      setType(initialType);
      setAmount('');
      setCategory(initialType === 'income' ? 'salary' : 'food');
      setDate(now.toISOString().slice(0, 10));
      const hours = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      setTime(`${hours}:${mins}`);
      setSource('');
      setWhereSpent('');
      setWhySpent('');
      setPaymentMethod('cash');
      setDescription('');
      setDuplicateWarning(false);
      setError(null);
    }
  }, [editingTransaction, initialType, isOpen]);

  // Handle category adjustment when switching between income and expense
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    if (newType === 'income') {
      if (!INCOME_CATEGORIES.includes(category as IncomeCategory)) {
        setCategory('salary');
      }
    } else {
      if (!EXPENSE_CATEGORIES.includes(category as ExpenseCategory)) {
        setCategory('food');
      }
    }
  };

  const handleAddQuickAmount = (val: number) => {
    const current = parseFloat(amount) || 0;
    setAmount(String(current + val));
  };

  const handleSetQuickDate = (target: 'today' | 'yesterday') => {
    const d = new Date();
    if (target === 'yesterday') {
      d.setDate(d.getDate() - 1);
    }
    setDate(d.toISOString().slice(0, 10));
  };

  const handleSubmit = async (e: React.FormEvent, bypassDuplicate = false) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError(t.form.validAmount);
      return;
    }

    if (!date) {
      setError(t.form.requiredField);
      return;
    }

    if (editingTransaction) {
      await updateTransaction({
        ...editingTransaction,
        type,
        amount: parsedAmount,
        category,
        date,
        time: time || '12:00',
        source: type === 'income' ? source.trim() : undefined,
        whereSpent: type === 'expense' ? whereSpent.trim() : undefined,
        whySpent: type === 'expense' ? whySpent.trim() : undefined,
        paymentMethod,
        description: description.trim(),
      });
      onClose();
    } else {
      const result = await addTransaction(
        {
          type,
          amount: parsedAmount,
          category,
          date,
          time: time || '12:00',
          source: type === 'income' ? source.trim() : undefined,
          whereSpent: type === 'expense' ? whereSpent.trim() : undefined,
          whySpent: type === 'expense' ? whySpent.trim() : undefined,
          paymentMethod,
          description: description.trim(),
        },
        bypassDuplicate
      );

      if (!result.success && result.duplicate) {
        setDuplicateWarning(true);
        return;
      }

      onClose();
    }
  };

  if (!isOpen) return null;

  const currentCategories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-6 transition-all">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {editingTransaction
                ? t.actions.edit
                : type === 'income'
                ? t.actions.addIncome
                : t.actions.addExpense}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Type Selector (if adding new) */}
        {!editingTransaction && (
          <div className="mt-4 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                type === 'expense'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              {t.form.expense}
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                type === 'income'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              {t.form.income}
            </button>
          </div>
        )}

        {/* Duplicate Warning Dialog Banner */}
        {duplicateWarning && (
          <div className="mt-4 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">{t.form.duplicateWarning}</p>
                <div className="mt-2.5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => handleSubmit(e, true)}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg text-xs transition-colors cursor-pointer"
                  >
                    {t.actions.confirm}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDuplicateWarning(false)}
                    className="px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-lg text-xs border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                  >
                    {t.actions.cancel}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={(e) => handleSubmit(e, false)} className="mt-4 space-y-4">
          {/* Amount Field + Quick Add increments */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                {t.form.amount} *
              </label>
              <span className="text-[11px] text-slate-400">
                {settings.currency}
              </span>
            </div>
            <div className="relative">
              <input
                type="number"
                step="any"
                min="0.01"
                inputMode="decimal"
                required
                autoFocus
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full text-2xl font-bold font-mono px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
            </div>

            {/* Quick amount chips */}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-slate-400 font-medium mr-1">
                {t.form.quickAmounts}:
              </span>
              {quickIncrements.map((inc) => (
                <button
                  key={inc}
                  type="button"
                  onClick={() => handleAddQuickAmount(inc)}
                  className="px-2.5 py-1 text-xs font-mono font-medium rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  +{inc}
                </button>
              ))}
            </div>
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              {t.form.category} *
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
              {currentCategories.map((cat) => {
                const isSelected = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`flex flex-col items-center p-2 rounded-xl text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white dark:bg-slate-800 shadow-sm border border-emerald-500 text-emerald-600 dark:text-emerald-400 font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <CategoryIcon category={cat} size="sm" isIncome={type === 'income'} />
                    <span className="text-[10px] mt-1 line-clamp-1">
                      {t.categories[cat] || cat}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date & Time Row with Quick Date Chips */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {t.form.date} *
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleSetQuickDate('today')}
                      className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                    >
                      {t.form.today}
                    </button>
                    <span className="text-slate-300 text-[10px]">·</span>
                    <button
                      type="button"
                      onClick={() => handleSetQuickDate('yesterday')}
                      className="text-[10px] text-slate-500 hover:underline cursor-pointer"
                    >
                      {t.form.yesterday}
                    </button>
                  </div>
                </div>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t.form.time}
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
            </div>
          </div>

          {/* Income-specific vs Expense-specific fields */}
          {type === 'income' ? (
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t.form.source}
              </label>
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder={t.form.sourcePlaceholder}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t.form.whereSpent}
                </label>
                <input
                  type="text"
                  value={whereSpent}
                  onChange={(e) => setWhereSpent(e.target.value)}
                  placeholder={t.form.whereSpentPlaceholder}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t.form.whySpent}
                </label>
                <input
                  type="text"
                  value={whySpent}
                  onChange={(e) => setWhySpent(e.target.value)}
                  placeholder={t.form.whySpentPlaceholder}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
            </div>
          )}

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              {t.form.paymentMethod}
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30"
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {t.paymentMethods[m] || m}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              {t.form.description} <span className="text-slate-400 font-normal">({t.form.optional})</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>

          {/* Submit Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              {t.actions.cancel}
            </button>
            <button
              type="submit"
              className={`px-5 py-2.5 text-xs sm:text-sm font-semibold text-white rounded-xl transition-all shadow-xs cursor-pointer ${
                type === 'income'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {editingTransaction ? t.actions.saveChanges : t.actions.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
