/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import {
  Globe,
  Coins,
  Moon,
  Sun,
  Laptop,
  Download,
  Upload,
  Database,
  Trash2,
  Check,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  KeyRound,
  LogOut,
  Users,
  HelpCircle,
  Cloud,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import { AppLanguage, AppCurrency, AppTheme } from '../../types/finance';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { ChangePasswordModal } from '../auth/ChangePasswordModal';
import { AccountSetupGuideModal } from '../auth/AccountSetupGuideModal';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { SyncStatusBadge } from '../common/SyncStatusBadge';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    t,
    exportBackup,
    importBackup,
    loadSampleData,
    clearAllData,
    transactions,
    debts,
    showToast,
    syncStatus,
    pendingCount,
    triggerManualSync,
  } = useFinance();

  const {
    currentUser,
    activeAccount,
    savedAccounts,
    openAuthModal,
    logoutCurrent,
    logoutAll,
  } = useAuth();

  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCurrencyChange = (curr: AppCurrency) => {
    updateSettings({ currency: curr });
  };

  const handleLanguageChange = (lang: AppLanguage) => {
    updateSettings({ language: lang });
  };

  const handleThemeChange = (thm: AppTheme) => {
    updateSettings({ theme: thm });
  };

  const handleToggleBengaliDigits = () => {
    updateSettings({ bengaliDigits: !settings.bengaliDigits });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await importBackup(file);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          {t.settings.title}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {t.settings.subtitle}
        </p>
      </div>

      {/* 0. Account & Authentication Management */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {t.auth.accountSecurity}
            </h3>
          </div>
          {currentUser ? (
            <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              <Cloud className="w-3.5 h-3.5" />
              {t.auth.cloudSynced}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              {t.auth.localMode}
            </span>
          )}
        </div>

        {currentUser ? (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 font-bold text-sm flex items-center justify-center">
                  {(activeAccount?.name || currentUser.name || 'U')[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-xs text-slate-400">{t.auth.loggedInAs}</p>
                  <p className="font-bold text-sm text-slate-900 dark:text-white">
                    {activeAccount?.name || currentUser.name || 'Authenticated User'}
                  </p>
                  <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
                    {activeAccount?.email || currentUser.email} {activeAccount?.phone ? `• ${activeAccount.phone}` : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openAuthModal('switch_account')}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  <span>{t.auth.switchAccount}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setIsChangePasswordOpen(true)}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                <span>{t.auth.changePassword}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsGuideOpen(true)}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{t.auth.setupGuideTitle}</span>
              </button>
            </div>

            <div className="pt-1 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 text-xs">
              <button
                type="button"
                onClick={async () => {
                  await logoutCurrent();
                  showToast(t.auth.loggedOut);
                }}
                className="text-rose-600 hover:text-rose-700 dark:text-rose-400 font-semibold cursor-pointer py-1 flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t.auth.logout}</span>
              </button>

              {savedAccounts.length > 1 && (
                <button
                  type="button"
                  onClick={async () => {
                    await logoutAll();
                    showToast(t.auth.loggedOut);
                  }}
                  className="text-slate-400 hover:text-rose-600 text-[11px] cursor-pointer py-1"
                >
                  {t.auth.logoutAll}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {t.auth.loginPrompt}
            </p>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer"
              >
                <Smartphone className="w-4 h-4" />
                <span>{t.auth.signIn} / {t.auth.register}</span>
              </button>

              {savedAccounts.length > 0 && (
                <button
                  type="button"
                  onClick={() => openAuthModal('switch_account')}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>{t.auth.switchAccount} ({savedAccounts.length})</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsGuideOpen(true)}
                className="flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t.auth.setupGuideTitle}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* PWA Install Banner */}
      <PWAInstallButton variant="card" />

      {/* Real-time Central Cloud Sync & Offline Status */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Cloud className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {settings.language === 'bn' ? 'অফলাইন ও ক্লাউড সিঙ্ক' : 'Offline & Cloud Sync'}
            </h3>
          </div>
          <SyncStatusBadge />
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          {settings.language === 'bn'
            ? 'Smart Hisab সম্পূর্ণ অফলাইন-প্রথম। ইন্টারনেট না থাকলেও আপনার সব আয়, ব্যয়, দেনা-পাওনা লোকাল IndexedDB-তে সংরক্ষিত থাকে এবং অনলাইন হলে স্বয়ংক্রিয়ভাবে ক্লাউডে সিঙ্ক হয়।'
            : 'Smart Hisab is completely offline-first. All your income, expenses, debts, and transactions are saved locally in IndexedDB and automatically synchronize with central cloud storage when online.'}
        </p>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs text-slate-400">
              {settings.language === 'bn' ? 'অপেক্ষমান সিঙ্ক কিউ' : 'Pending Sync Queue'}
            </p>
            <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 font-mono">
              {pendingCount} {settings.language === 'bn' ? 'টি পরিবর্তন বাকি' : 'mutations pending'}
            </p>
          </div>

          <button
            type="button"
            onClick={async () => {
              const ok = await triggerManualSync();
              if (ok) {
                showToast(settings.language === 'bn' ? 'সিঙ্ক সফল হয়েছে' : 'Sync completed successfully');
              } else {
                showToast(settings.language === 'bn' ? 'অফলাইন বা সিঙ্ক ব্যর্থ' : 'Offline or sync failed');
              }
            }}
            disabled={syncStatus === 'syncing'}
            className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold transition-all cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
            <span>{t.sync.syncNow}</span>
          </button>
        </div>
      </div>

      {/* 1. Language & Localization */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {t.settings.language}
          </h3>
        </div>

        {/* Language buttons */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => handleLanguageChange('en')}
            className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              settings.language === 'en'
                ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-semibold'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div>
              <p className="text-sm">English</p>
              <p className="text-xs text-slate-400 font-normal">Default interface</p>
            </div>
            {settings.language === 'en' && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
          </button>

          <button
            type="button"
            onClick={() => handleLanguageChange('bn')}
            className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              settings.language === 'bn'
                ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-semibold'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div>
              <p className="text-sm">বাংলা (Bangla)</p>
              <p className="text-xs text-slate-400 font-normal">সম্পূর্ণ বাংলা ইন্টারফেস</p>
            </div>
            {settings.language === 'bn' && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
          </button>
        </div>

        {/* Bengali Digits Toggle (if Bangla) */}
        {settings.language === 'bn' && (
          <div className="pt-2 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                {t.settings.bengaliDigits}
              </p>
              <p className="text-[11px] text-slate-400">
                {t.settings.bengaliDigitsDesc}
              </p>
            </div>
            <button
              type="button"
              onClick={handleToggleBengaliDigits}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                settings.bengaliDigits ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`block w-4 h-4 rounded-full bg-white shadow-xs transition-transform transform mt-1 ml-1 ${
                  settings.bengaliDigits ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        )}
      </div>

      {/* 2. Currency Selector */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Coins className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {t.settings.currency}
          </h3>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {(['BDT', 'USD', 'EUR'] as AppCurrency[]).map((c) => {
            const symbols: Record<AppCurrency, string> = { BDT: '৳ BDT', USD: '$ USD', EUR: '€ EUR' };
            const isSelected = settings.currency === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => handleCurrencyChange(c)}
                className={`py-3 px-3 rounded-xl border text-center transition-all cursor-pointer ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-semibold'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                }`}
              >
                <p className="text-sm font-mono font-bold">{symbols[c]}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Appearance / Theme */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Moon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {t.settings.theme}
          </h3>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => handleThemeChange('light')}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer ${
              settings.theme === 'light'
                ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-semibold'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Sun className="w-4 h-4 mb-1 text-amber-500" />
            <span className="text-xs">{t.settings.themeLight}</span>
          </button>

          <button
            type="button"
            onClick={() => handleThemeChange('dark')}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer ${
              settings.theme === 'dark'
                ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-semibold'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Moon className="w-4 h-4 mb-1 text-indigo-400" />
            <span className="text-xs">{t.settings.themeDark}</span>
          </button>

          <button
            type="button"
            onClick={() => handleThemeChange('system')}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer ${
              settings.theme === 'system'
                ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-semibold'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Laptop className="w-4 h-4 mb-1 text-slate-500" />
            <span className="text-xs">{t.settings.themeSystem}</span>
          </button>
        </div>
      </div>

      {/* 4. Data Storage & Backup */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {t.settings.dataManagement}
            </h3>
          </div>
          <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            IndexedDB Local
          </span>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          {t.settings.storageNotice}
        </p>

        {/* Current Database Counts */}
        <div className="grid grid-cols-2 gap-3 py-1">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs">
            <span className="text-slate-400">{t.history.totalCount}</span>
            <p className="text-base font-bold text-slate-900 dark:text-white font-mono">
              {transactions.length}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs">
            <span className="text-slate-400">{t.debts.allTab}</span>
            <p className="text-base font-bold text-slate-900 dark:text-white font-mono">
              {debts.length}
            </p>
          </div>
        </div>

        {/* Backup & Restore Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={exportBackup}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-semibold transition-colors cursor-pointer min-h-[44px]"
          >
            <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{t.actions.exportBackup}</span>
          </button>

          <label className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-semibold transition-colors cursor-pointer min-h-[44px]">
            <Upload className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{t.actions.importBackup}</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>

        {/* Demo Data button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={loadSampleData}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer min-h-[40px]"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            <span>{t.actions.loadSampleData}</span>
          </button>
        </div>
      </div>

      {/* 5. Danger Zone: Reset Data */}
      <div className="p-5 rounded-2xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          <h3 className="text-sm font-semibold text-rose-900 dark:text-rose-200">
            {t.settings.dangerZone}
          </h3>
        </div>
        <p className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed">
          {t.settings.clearAllDesc}
        </p>

        <button
          type="button"
          onClick={() => setIsResetConfirmOpen(true)}
          className="mt-2 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors cursor-pointer"
        >
          {t.actions.resetData}
        </button>
      </div>

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        title={t.settings.resetConfirmTitle}
        message={t.settings.resetConfirmMessage}
        confirmLabel={t.actions.resetData}
        isDestructive={true}
        onConfirm={async () => {
          await clearAllData();
          setIsResetConfirmOpen(false);
        }}
        onCancel={() => setIsResetConfirmOpen(false)}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />

      {/* Account Setup Guide Modal */}
      <AccountSetupGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
};
