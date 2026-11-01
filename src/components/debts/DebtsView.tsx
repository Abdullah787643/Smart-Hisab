/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Search, Plus, HandCoins, ArrowDownLeft, TrendingDown, CheckCircle2, X } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Debt, DebtType } from '../../types/finance';
import { DebtCard } from './DebtCard';
import { DebtModal } from './DebtModal';
import { RecordPaymentModal } from './RecordPaymentModal';
import { ConfirmDialog } from '../common/ConfirmDialog';

export const DebtsView: React.FC = () => {
  const {
    debts,
    t,
    formatMoney,
    totalReceivable,
    totalPayable,
    deleteDebt,
    setEditingDebt,
    setRecordingPaymentDebt,
  } = useFinance();

  const [activeTab, setActiveTab] = useState<'all' | 'lent' | 'borrowed' | 'settled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addType, setAddType] = useState<DebtType>('lent');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filter debts
  const filteredDebts = useMemo(() => {
    return debts
      .filter((d) => {
        // Tab filter
        if (activeTab === 'lent') {
          if (d.type !== 'lent' || d.status === 'settled') return false;
        } else if (activeTab === 'borrowed') {
          if (d.type !== 'borrowed' || d.status === 'settled') return false;
        } else if (activeTab === 'settled') {
          if (d.status !== 'settled') return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = d.personName.toLowerCase().includes(q);
          const matchPhone = (d.personPhone || '').toLowerCase().includes(q);
          const matchNotes = (d.notes || '').toLowerCase().includes(q);
          const matchAmt = String(d.totalAmount).includes(q);
          if (!matchName && !matchPhone && !matchNotes && !matchAmt) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        // Pending/partial first, then sorted by date
        if (a.status === 'settled' && b.status !== 'settled') return 1;
        if (a.status !== 'settled' && b.status === 'settled') return -1;
        return b.createdAt - a.createdAt;
      });
  }, [debts, activeTab, searchQuery]);

  const handleDeleteConfirm = async () => {
    if (deletingId) {
      await deleteDebt(deletingId);
      setDeletingId(null);
    }
  };

  const handleOpenAdd = (type: DebtType) => {
    setAddType(type);
    setIsAddModalOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Actions */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {t.debts.title}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t.debts.subtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleOpenAdd('lent')}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>{t.actions.addDebt}</span>
        </button>
      </div>

      {/* Debt KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {/* Total Receivable */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <ArrowDownLeft className="w-4 h-4" />
            <span>{t.debts.lentTab.split(' ')[0]}</span>
          </div>
          <p className="mt-2 text-lg sm:text-xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
            {formatMoney(totalReceivable)}
          </p>
          <span className="text-[11px] text-slate-400">
            {t.dashboard.receivableHint}
          </span>
        </div>

        {/* Total Payable */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium">
            <TrendingDown className="w-4 h-4" />
            <span>{t.debts.borrowedTab.split(' ')[0]}</span>
          </div>
          <p className="mt-2 text-lg sm:text-xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
            {formatMoney(totalPayable)}
          </p>
          <span className="text-[11px] text-slate-400">
            {t.dashboard.payableHint}
          </span>
        </div>

        {/* Net Position (Desktop & Tablet) */}
        <div className="hidden sm:block p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-medium">
            <HandCoins className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{t.dashboard.netDebt}</span>
          </div>
          <p
            className={`mt-2 text-lg sm:text-xl font-bold font-mono tabular-nums ${
              totalReceivable - totalPayable >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatMoney(totalReceivable - totalPayable)}
          </p>
          <span className="text-[11px] text-slate-400">
            {totalReceivable - totalPayable >= 0 ? t.debts.netSurplus : t.debts.netLiability}
          </span>
        </div>
      </div>

      {/* Search & Tabs */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.actions.search}
            className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-slate-200/60 dark:bg-slate-800/80 rounded-xl overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {t.debts.allTab}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('lent')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'lent'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {t.debts.lentTab}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('borrowed')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'borrowed'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {t.debts.borrowedTab}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('settled')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'settled'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {t.debts.settledTab}
          </button>
        </div>
      </div>

      {/* Debt Cards Feed */}
      {filteredDebts.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            {t.history.noResults}
          </p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            {t.debts.subtitle}
          </p>
          <button
            type="button"
            onClick={() => handleOpenAdd('lent')}
            className="mt-4 px-4 py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl hover:bg-emerald-100 transition-colors"
          >
            {t.actions.addDebt}
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredDebts.map((d) => (
            <DebtCard
              key={d.id}
              debt={d}
              onRecordPayment={(target) => setRecordingPaymentDebt(target)}
              onEdit={(target) => setEditingDebt(target)}
              onDelete={(id) => setDeletingId(id)}
            />
          ))}
        </div>
      )}

      {/* Add Debt Modal */}
      <DebtModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        initialType={addType}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingId)}
        title={t.settings.deleteDebtTitle}
        message={t.settings.deleteDebtMessage}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
};
