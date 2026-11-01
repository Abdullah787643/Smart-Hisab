/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Search, Plus, X, RotateCcw, Calendar, Filter } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Transaction, TransactionType, Category, PaymentMethod } from '../../types/finance';
import { TransactionItem } from './TransactionItem';
import { ConfirmDialog } from '../common/ConfirmDialog';

export const TransactionsView: React.FC = () => {
  const {
    transactions,
    t,
    deleteTransaction,
    setEditingTransaction,
    openQuickAdd,
    formatAppDate,
  } = useFinance();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'yesterday' | 'week' | 'month' | 'lastMonth' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Extract unique categories and methods present in user's transactions
  const presentCategories = useMemo(() => {
    const set = new Set<Category>();
    transactions.forEach((tx) => set.add(tx.category));
    return Array.from(set);
  }, [transactions]);

  const presentMethods = useMemo(() => {
    const set = new Set<PaymentMethod>();
    transactions.forEach((tx) => set.add(tx.paymentMethod));
    return Array.from(set);
  }, [transactions]);

  // Filtered and sorted transactions
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().slice(0, 10);

    const currentMonthStr = todayStr.slice(0, 7);

    // Last month calculation
    const lastMonthD = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthStr = lastMonthD.toISOString().slice(0, 7);

    return transactions
      .filter((tx) => {
        // Type filter
        if (typeFilter !== 'all' && tx.type !== typeFilter) {
          return false;
        }

        // Category filter
        if (categoryFilter !== 'all' && tx.category !== categoryFilter) {
          return false;
        }

        // Payment method filter
        if (paymentMethodFilter !== 'all' && tx.paymentMethod !== paymentMethodFilter) {
          return false;
        }

        // Date filter
        if (dateFilter === 'today' && tx.date !== todayStr) {
          return false;
        }
        if (dateFilter === 'yesterday' && tx.date !== yesterdayStr) {
          return false;
        }
        if (dateFilter === 'week' && tx.date < weekAgoStr) {
          return false;
        }
        if (dateFilter === 'month' && !tx.date.startsWith(currentMonthStr)) {
          return false;
        }
        if (dateFilter === 'lastMonth' && !tx.date.startsWith(lastMonthStr)) {
          return false;
        }
        if (dateFilter === 'custom') {
          if (customStartDate && tx.date < customStartDate) return false;
          if (customEndDate && tx.date > customEndDate) return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchCat = (t.categories[tx.category] || tx.category).toLowerCase().includes(q);
          const matchSource = (tx.source || '').toLowerCase().includes(q);
          const matchWhere = (tx.whereSpent || '').toLowerCase().includes(q);
          const matchWhy = (tx.whySpent || '').toLowerCase().includes(q);
          const matchDesc = (tx.description || '').toLowerCase().includes(q);
          const matchMethod = (t.paymentMethods[tx.paymentMethod] || tx.paymentMethod).toLowerCase().includes(q);
          const matchAmt = String(tx.amount).includes(q);

          if (!matchCat && !matchSource && !matchWhere && !matchWhy && !matchDesc && !matchMethod && !matchAmt) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return b.date.localeCompare(a.date) || b.createdAt - a.createdAt;
        }
        if (sortBy === 'oldest') {
          return a.date.localeCompare(b.date) || a.createdAt - b.createdAt;
        }
        if (sortBy === 'highest') {
          return b.amount - a.amount;
        }
        if (sortBy === 'lowest') {
          return a.amount - b.amount;
        }
        return 0;
      });
  }, [
    transactions,
    typeFilter,
    dateFilter,
    customStartDate,
    customEndDate,
    categoryFilter,
    paymentMethodFilter,
    searchQuery,
    sortBy,
    t,
  ]);

  // Group by date for clear visual grouping
  const groupedByDate = useMemo(() => {
    const groups: { date: string; items: Transaction[] }[] = [];
    filteredTransactions.forEach((tx) => {
      const existing = groups.find((g) => g.date === tx.date);
      if (existing) {
        existing.items.push(tx);
      } else {
        groups.push({ date: tx.date, items: [tx] });
      }
    });
    return groups;
  }, [filteredTransactions]);

  const hasActiveFilters =
    typeFilter !== 'all' ||
    dateFilter !== 'all' ||
    categoryFilter !== 'all' ||
    paymentMethodFilter !== 'all' ||
    Boolean(searchQuery.trim()) ||
    Boolean(customStartDate) ||
    Boolean(customEndDate);

  const handleResetFilters = () => {
    setTypeFilter('all');
    setDateFilter('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setCategoryFilter('all');
    setPaymentMethodFilter('all');
    setSearchQuery('');
    setSortBy('newest');
  };

  const handleDeleteConfirm = async () => {
    if (deletingId) {
      await deleteTransaction(deletingId);
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header and Quick Actions */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {t.history.title}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {filteredTransactions.length} {t.actions.resultsCount}
          </p>
        </div>

        <button
          type="button"
          onClick={() => openQuickAdd('expense')}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>{t.actions.addExpense}</span>
        </button>
      </div>

      {/* Search and Filters Section */}
      <div className="space-y-2.5">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.actions.search}
            className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Type Segmented Buttons */}
          <div className="flex items-center gap-1 p-1 bg-slate-200/60 dark:bg-slate-800/80 rounded-xl">
            <button
              type="button"
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                typeFilter === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {t.history.all}
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('income')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                typeFilter === 'income'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {t.history.incomes}
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('expense')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                typeFilter === 'expense'
                  ? 'bg-rose-500 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {t.history.expenses}
            </button>
          </div>

          {/* Date range filter dropdown & Sort dropdown */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs font-medium rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-hidden cursor-pointer"
            >
              <option value="all">{t.history.dateRange}: {t.history.all}</option>
              <option value="today">{t.history.today}</option>
              <option value="yesterday">{t.history.yesterday}</option>
              <option value="week">{t.history.thisWeek}</option>
              <option value="month">{t.history.thisMonth}</option>
              <option value="lastMonth">{t.history.lastMonth}</option>
              <option value="custom">{t.history.customRange}</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs font-medium rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-hidden cursor-pointer"
            >
              <option value="newest">{t.history.newest}</option>
              <option value="oldest">{t.history.oldest}</option>
              <option value="highest">{t.history.highest}</option>
              <option value="lowest">{t.history.lowest}</option>
            </select>

            {/* Reset filters button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                title={t.actions.resetFilters}
                className="flex items-center gap-1 px-2 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.actions.resetFilters}</span>
              </button>
            )}
          </div>
        </div>

        {/* Category & Payment Method secondary filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-medium rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-hidden cursor-pointer"
          >
            <option value="all">{t.actions.allCategories}</option>
            {presentCategories.map((c) => (
              <option key={c} value={c}>
                {t.categories[c] || c}
              </option>
            ))}
          </select>

          {/* Payment Method Dropdown */}
          <select
            value={paymentMethodFilter}
            onChange={(e) => setPaymentMethodFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-medium rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-hidden cursor-pointer"
          >
            <option value="all">{t.actions.allMethods}</option>
            {presentMethods.map((m) => (
              <option key={m} value={m}>
                {t.paymentMethods[m] || m}
              </option>
            ))}
          </select>
        </div>

        {/* Custom Date Range Picker Strip */}
        {dateFilter === 'custom' && (
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">{t.actions.from}:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2 py-1 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">{t.actions.to}:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2 py-1 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        )}
      </div>

      {/* Transaction List */}
      {groupedByDate.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            {t.history.noResults}
          </p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            {t.dashboard.quickAddPrompt}
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => openQuickAdd('expense')}
              className="px-4 py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              {t.actions.addExpense}
            </button>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
              >
                {t.actions.resetFilters}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedByDate.map((group) => (
            <div key={group.date} className="space-y-2">
              <div className="sticky top-14 sm:top-16 z-20 py-1.5 px-2 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-xs flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  {formatAppDate(group.date)}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {group.items.length} {t.actions.resultsCount}
                </span>
              </div>

              <div className="space-y-2">
                {group.items.map((tx) => (
                  <TransactionItem
                    key={tx.id}
                    transaction={tx}
                    onEdit={(item) => setEditingTransaction(item)}
                    onDelete={(id) => setDeletingId(id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingId)}
        title={t.settings.deleteConfirmTitle}
        message={t.settings.deleteConfirmMessage}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
};
