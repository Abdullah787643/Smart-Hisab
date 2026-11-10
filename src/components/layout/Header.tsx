/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Plus, Globe, Moon, Sun, Users, User as UserIcon } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import { ActiveTab } from '../../types/finance';
import { SyncStatusBadge } from '../common/SyncStatusBadge';
import { PWAInstallButton } from '../common/PWAInstallButton';

export const Header: React.FC = () => {
  const {
    t,
    settings,
    updateSettings,
    activeTab,
    setActiveTab,
    openQuickAdd,
  } = useFinance();

  const { currentUser, activeAccount, openAuthModal } = useAuth();

  const toggleLanguage = () => {
    updateSettings({ language: settings.language === 'en' ? 'bn' : 'en' });
  };

  const toggleTheme = () => {
    updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' });
  };

  const navItems: { id: ActiveTab; label: string }[] = [
    { id: 'dashboard', label: t.nav.dashboard },
    { id: 'transactions', label: t.nav.transactions },
    { id: 'debts', label: t.nav.debts },
    { id: 'analytics', label: t.nav.analytics },
    { id: 'settings', label: t.nav.settings },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-4 sm:gap-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveTab('dashboard')}
            className="text-left flex items-baseline gap-2 whitespace-nowrap shrink-0 cursor-pointer focus:outline-hidden"
          >
            <span className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Smart Hisab
            </span>
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              {settings.language === 'bn' ? 'স্মার্ট হিসাব' : 'Finance'}
            </span>
          </button>
          {/* Real-time Online / Offline / Sync Status Indicator */}
          <SyncStatusBadge />
        </div>

        {/* Zone 2: Desktop 4-5 Navigation Links (Hidden on mobile) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer ${
                activeTab === item.id
                  ? 'text-emerald-600 dark:text-emerald-400 font-semibold border-b-2 border-emerald-600 dark:border-emerald-400'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Zone 3: Quick Utilities and Primary Action */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* PWA Install Button */}
          <PWAInstallButton variant="header" />

          {/* Language Switcher Button */}
          <button
            onClick={toggleLanguage}
            title={settings.language === 'en' ? 'Switch to Bangla' : 'Switch to English'}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer min-h-[36px]"
          >
            <Globe className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>{settings.language === 'en' ? 'বাং' : 'EN'}</span>
          </button>

          {/* Theme Switcher Button */}
          <button
            onClick={toggleTheme}
            title={settings.theme === 'dark' ? 'Light mode' : 'Dark mode'}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
          >
            {settings.theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

          {/* Account & Multi-user Switcher Button */}
          <button
            onClick={() => openAuthModal(currentUser ? 'switch_account' : 'login')}
            title={
              currentUser
                ? `Account: ${activeAccount?.name || activeAccount?.phone || activeAccount?.email || 'Active'} (Click to switch)`
                : 'Log In or Register'
            }
            className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer min-h-[36px] ${
              currentUser
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {currentUser ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="hidden sm:inline font-medium max-w-[100px] truncate">
                  {activeAccount?.name?.split(' ')[0] || (activeAccount?.phone ? activeAccount.phone.slice(-4) : 'User')}
                </span>
                <Users className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <UserIcon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span className="hidden sm:inline">{t.auth.signIn}</span>
              </>
            )}
          </button>

          {/* Primary Quick Add Button */}
          <button
            onClick={() => openQuickAdd('choice')}
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] rounded-xl transition-all shadow-xs whitespace-nowrap shrink-0 cursor-pointer min-h-[36px]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden xs:inline">{t.actions.quickAdd}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
