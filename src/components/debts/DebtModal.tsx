/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, HandCoins, CheckSquare, Square } from 'lucide-react';
import { Debt, DebtType } from '../../types/finance';
import { useFinance } from '../../context/FinanceContext';

interface DebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingDebt?: Debt | null;
  initialType?: DebtType;
}

export const DebtModal: React.FC<DebtModalProps> = ({
  isOpen,
  onClose,
  editingDebt,
  initialType = 'lent',
}) => {
  const { t, addDebt, updateDebt } = useFinance();

  const [type, setType] = useState<DebtType>(initialType);
  const [personName, setPersonName] = useState('');
  const [personPhone, setPersonPhone] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [adjustCashBalance, setAdjustCashBalance] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingDebt) {
      setType(editingDebt.type);
      setPersonName(editingDebt.personName);
      setPersonPhone(editingDebt.personPhone || '');
      setTotalAmount(String(editingDebt.totalAmount));
      setStartDate(editingDebt.startDate);
      setDueDate(editingDebt.dueDate || '');
      setNotes(editingDebt.notes || '');
      setAdjustCashBalance(false);
      setError(null);
    } else {
      const now = new Date();
      setType(initialType);
      setPersonName('');
      setPersonPhone('');
      setTotalAmount('');
      setStartDate(now.toISOString().slice(0, 10));
      setDueDate('');
      setNotes('');
      setAdjustCashBalance(false);
      setError(null);
    }
  }, [editingDebt, initialType, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const amount = parseFloat(totalAmount);
    if (isNaN(amount) || amount <= 0) {
      setError(t.form.validAmount);
      return;
    }

    if (!personName.trim()) {
      setError(t.form.requiredField);
      return;
    }

    if (!startDate) {
      setError(t.form.requiredField);
      return;
    }

    if (editingDebt) {
      await updateDebt({
        ...editingDebt,
        type,
        personName: personName.trim(),
        personPhone: personPhone.trim() || undefined,
        totalAmount: amount,
        startDate,
        dueDate: dueDate || undefined,
        notes: notes.trim() || undefined,
      });
    } else {
      await addDebt(
        {
          type,
          personName: personName.trim(),
          personPhone: personPhone.trim() || undefined,
          totalAmount: amount,
          startDate,
          dueDate: dueDate || undefined,
          notes: notes.trim() || undefined,
        },
        adjustCashBalance
      );
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-6 transition-all">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <HandCoins className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {editingDebt ? t.debts.editDebtTitle : t.debts.addDebtTitle}
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

        {/* Debt Type Selector (Lent vs Borrowed) */}
        {!editingDebt && (
          <div className="mt-4 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => setType('lent')}
              className={`py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                type === 'lent'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              {t.debts.lentTab}
            </button>
            <button
              type="button"
              onClick={() => setType('borrowed')}
              className={`py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                type === 'borrowed'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              {t.debts.borrowedTab}
            </button>
          </div>
        )}

        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          {type === 'lent' ? t.debts.lentDescription : t.debts.borrowedDescription}
        </p>

        {error && (
          <div className="mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Person Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t.debts.personName} *
              </label>
              <input
                type="text"
                required
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                placeholder="e.g. Rafiq, Tanvir"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t.debts.personPhone}
              </label>
              <input
                type="tel"
                value={personPhone}
                onChange={(e) => setPersonPhone(e.target.value)}
                placeholder="+88017XXXXXXXX"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              {t.debts.totalAmount} *
            </label>
            <input
              type="number"
              step="any"
              min="0.01"
              required
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              placeholder="0.00"
              className="w-full text-xl font-bold font-mono px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>

          {/* Dates: Given/Borrowed date & Due date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t.debts.startDate} *
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t.debts.dueDate} <span className="text-slate-400 font-normal">({t.form.optional})</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              {t.debts.notes} <span className="text-slate-400 font-normal">({t.form.optional})</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Reason for debt, installment agreements, etc."
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>

          {/* Optional: Adjust Total Balance Immediately */}
          {!editingDebt && (
            <div
              onClick={() => setAdjustCashBalance(!adjustCashBalance)}
              className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer select-none"
            >
              <div className="mt-0.5 text-emerald-600 dark:text-emerald-400">
                {adjustCashBalance ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-slate-400" />}
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-slate-900 dark:text-white">
                  {t.debts.adjustBalancePrompt}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {type === 'lent' ? t.debts.adjustBalanceLentNote : t.debts.adjustBalanceBorrowedNote}
                </p>
              </div>
            </div>
          )}

          {/* Action buttons */}
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
              className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-xs cursor-pointer"
            >
              {editingDebt ? t.actions.saveChanges : t.actions.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
