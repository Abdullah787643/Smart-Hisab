/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Eye,
  EyeOff,
  Users,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Mail,
  User as UserIcon,
  Phone,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import { SavedAccount } from '../../types/auth';
import { AccountSetupGuideModal } from './AccountSetupGuideModal';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authMode,
    setAuthMode,
    savedAccounts,
    activeAccount,
    register,
    loginWithIdentifier,
    switchToAccount,
    removeAccountFromDevice,
    logoutAll,
  } = useAuth();

  const { t, showToast } = useFinance();

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Reset form error & passwords when switching modes
  useEffect(() => {
    setErrorMessage(null);
    setPassword('');
    setConfirmPassword('');
  }, [authMode]);

  if (!isAuthModalOpen) return null;

  // Handlers
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanIdentifier = identifier.trim();
    if (!cleanIdentifier) {
      setErrorMessage(t.auth.loginIdentifier + ' is required');
      return;
    }
    if (password.length < 6) {
      setErrorMessage(t.auth.invalidPassword);
      return;
    }

    setIsSubmitting(true);
    const res = await loginWithIdentifier(cleanIdentifier, password);
    setIsSubmitting(false);

    if (res.success) {
      showToast(t.toast.settingsSaved);
    } else {
      setErrorMessage(res.error || 'Login failed');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanName = fullName.trim();
    if (!cleanName || cleanName.length < 2) {
      setErrorMessage(t.auth.invalidName);
      return;
    }

    const cleanPhone = mobileNumber.trim();
    const digitsOnly = cleanPhone.replace(/\D/g, '');
    if (digitsOnly.length < 10) {
      setErrorMessage(t.auth.invalidPhone);
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setErrorMessage(t.auth.invalidEmail);
      return;
    }

    if (password.length < 6) {
      setErrorMessage(t.auth.invalidPassword);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage(t.auth.passwordMismatch);
      return;
    }

    setIsSubmitting(true);
    const res = await register(cleanName, cleanPhone, cleanEmail, password);
    setIsSubmitting(false);

    if (res.success) {
      showToast('Account created successfully! Welcome to Smart Hisab.');
    } else {
      setErrorMessage(res.error || 'Failed to create account');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              {authMode === 'switch_account' ? (
                <Users className="w-5 h-5" />
              ) : (
                <ShieldCheck className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {authMode === 'switch_account'
                  ? t.auth.switchAccountTitle
                  : authMode === 'register'
                  ? t.auth.registerTitle
                  : t.auth.loginTitle}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                {authMode === 'switch_account'
                  ? t.auth.switchAccountSubtitle
                  : authMode === 'register'
                  ? t.auth.registerSubtitle
                  : t.auth.loginSubtitle}
              </p>
            </div>
          </div>
          <button
            onClick={closeAuthModal}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Error Message Alert */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* =========================================
              MODE: LOGIN (Dual Mobile + Gmail)
             ========================================= */}
          {authMode === 'login' && (
            <div className="space-y-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {t.auth.loginIdentifier}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder={t.auth.loginIdentifierPlaceholder}
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {t.auth.password}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t.auth.passwordPlaceholder}
                      className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>{t.auth.loginBtn}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Auxiliary links & actions */}
              <div className="pt-2 flex flex-col gap-2.5 text-xs text-center border-t border-slate-100 dark:border-slate-800">
                {savedAccounts.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setAuthMode('switch_account')}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800/70 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    <span>
                      {t.auth.switchAccount} ({savedAccounts.length})
                    </span>
                  </button>
                )}

                <div className="text-slate-500 dark:text-slate-400">
                  {t.auth.dontHaveAccount}{' '}
                  <button
                    type="button"
                    onClick={() => setAuthMode('register')}
                    className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    {t.auth.registerNow}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsGuideOpen(true)}
                  className="flex items-center justify-center gap-1 text-[11px] text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors pt-1 cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>{t.auth.setupGuideTitle}</span>
                </button>
              </div>
            </div>
          )}

          {/* =======================================================
              MODE: REGISTER (Full Name, Phone, Gmail, Passwords)
             ======================================================= */}
          {authMode === 'register' && (
            <div className="space-y-4">
              <form onSubmit={handleRegister} className="space-y-3.5">
                {/* 1. Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.auth.fullName}
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={t.auth.fullNamePlaceholder}
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* 2. Mobile Number */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.auth.phoneNumber}
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      placeholder={t.auth.phonePlaceholder}
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* 3. Gmail Address */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.auth.email}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t.auth.emailPlaceholder}
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* 4. Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.auth.password}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t.auth.passwordPlaceholder}
                      className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* 5. Confirm Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.auth.confirmPassword}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={t.auth.confirmPasswordPlaceholder}
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-all shadow-xs cursor-pointer disabled:opacity-50 mt-2"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>{t.auth.registerBtn || 'Create Account'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="pt-2 text-xs text-center text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
                {t.auth.alreadyHaveAccount}{' '}
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  {t.auth.loginNow}
                </button>
              </div>
            </div>
          )}

          {/* =========================================
              MODE: MULTI-ACCOUNT SWITCHER
             ========================================= */}
          {authMode === 'switch_account' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {t.auth.rememberedAccounts}
                </p>

                {savedAccounts.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-center text-xs text-slate-400">
                    {t.auth.noAccountsFound}
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {savedAccounts.map((account: SavedAccount) => {
                      const isActive = account.id === activeAccount?.id;
                      const initial = (account.name || account.email || 'U')[0].toUpperCase();

                      return (
                        <div
                          key={account.id}
                          className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                            isActive
                              ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 shadow-xs ring-1 ring-emerald-500/30'
                              : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => switchToAccount(account)}
                            className="flex items-center gap-3 text-left flex-1 min-w-0 cursor-pointer"
                          >
                            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                              {initial}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                                {account.name || 'Account'}
                              </p>
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                                {account.phone && <span>{account.phone}</span>}
                                {account.email && <span>&bull; {account.email}</span>}
                              </div>
                              {isActive ? (
                                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  {t.auth.currentActive}
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400 mt-0.5 block">
                                  Tap to switch account
                                </span>
                              )}
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => removeAccountFromDevice(account.id)}
                            title={t.auth.removeAccount}
                            className="p-2 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setIdentifier('');
                    setAuthMode('register');
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{t.auth.addAnotherAccount}</span>
                </button>

                {savedAccounts.length > 0 && (
                  <button
                    type="button"
                    onClick={async () => {
                      await logoutAll();
                      closeAuthModal();
                      showToast(t.auth.loggedOut);
                    }}
                    className="w-full py-2 px-4 text-xs font-medium text-rose-600 hover:text-rose-700 dark:text-rose-400 transition-colors cursor-pointer text-center"
                  >
                    {t.auth.logoutAll}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Account Setup Guide Modal */}
      <AccountSetupGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
    </div>
  );
};
