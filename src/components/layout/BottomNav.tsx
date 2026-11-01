/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  LayoutDashboard,
  ReceiptText,
  Plus,
  HandCoins,
  Settings,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { ActiveTab } from '../../types/finance';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, openQuickAdd, t } = useFinance();

  const tabs: { id: ActiveTab; label: string; icon: typeof LayoutDashboard }[] = [
    { id: 'dashboard', label: t.nav.dashboard, icon: LayoutDashboard },
    { id: 'transactions', label: t.nav.transactions, icon: ReceiptText },
    { id: 'debts', label: t.nav.debts, icon: HandCoins },
    { id: 'settings', label: t.nav.settings, icon: Settings },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-lg">
      <div className="grid grid-cols-5 items-center h-16 max-w-md mx-auto px-2">
        {/* Tab 1: Dashboard */}
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] cursor-pointer transition-colors ${
            activeTab === 'dashboard'
              ? 'text-emerald-600 dark:text-emerald-400 font-medium'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[11px] tracking-tight mt-1 truncate max-w-[64px]">
            {tabs[0].label}
          </span>
        </button>

        {/* Tab 2: Transactions */}
        <button
          type="button"
          onClick={() => setActiveTab('transactions')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] cursor-pointer transition-colors ${
            activeTab === 'transactions'
              ? 'text-emerald-600 dark:text-emerald-400 font-medium'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <ReceiptText className="w-5 h-5" />
          <span className="text-[11px] tracking-tight mt-1 truncate max-w-[64px]">
            {tabs[1].label}
          </span>
        </button>

        {/* Center: Quick Add Floating Button */}
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={() => openQuickAdd('choice')}
            aria-label={t.actions.quickAdd}
            className="flex items-center justify-center w-12 h-12 -mt-4 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/30 active:scale-95 transition-all cursor-pointer min-h-[44px] min-w-[44px]"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Tab 3: Debts */}
        <button
          type="button"
          onClick={() => setActiveTab('debts')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] cursor-pointer transition-colors ${
            activeTab === 'debts'
              ? 'text-emerald-600 dark:text-emerald-400 font-medium'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <HandCoins className="w-5 h-5" />
          <span className="text-[11px] tracking-tight mt-1 truncate max-w-[64px]">
            {tabs[2].label}
          </span>
        </button>

        {/* Tab 4: Settings */}
        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] cursor-pointer transition-colors ${
            activeTab === 'settings'
              ? 'text-emerald-600 dark:text-emerald-400 font-medium'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[11px] tracking-tight mt-1 truncate max-w-[64px]">
            {tabs[3].label}
          </span>
        </button>
      </div>
    </nav>
  );
};
