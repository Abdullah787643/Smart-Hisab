/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, ShieldCheck, Lock, Smartphone, Users, CheckCircle } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';

interface AccountSetupGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccountSetupGuideModal: React.FC<AccountSetupGuideModalProps> = ({ isOpen, onClose }) => {
  const { t } = useFinance();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {t.auth.setupGuideTitle}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t.auth.setupGuideDesc}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-600 dark:text-slate-300">
          {/* Architecture Status */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
              <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Central Cloud Database & Multi-Device Sync</span>
            </div>
            <p className="leading-relaxed text-slate-600 dark:text-slate-300">
              Smart Hisab permanently synchronizes transactions, debts, payments, and settings across all your devices using a secure central cloud database backend (Cloud PostgreSQL). No Firebase required.
            </p>
          </div>

          {/* 1. Multi-Device Login */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
              <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>1. Cross-Device Login via Mobile Number</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              Log in from your Android phone, tablet, or computer using your registered Mobile Number (or Gmail) and Password. If you clear browser cache, switch phones, or buy a new device, all your previous transactions, debts, and partial payments are immediately restored.
            </p>
          </div>

          {/* 2. Cloud Database Deployment */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
              <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>2. Cloud Database Configuration</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              To connect your managed cloud database (Neon Serverless Postgres, Supabase Postgres, Google Cloud SQL, or Aiven), provide the standard encrypted connection string in your environment:
            </p>
            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 font-mono text-[11px] text-emerald-700 dark:text-emerald-400 border border-slate-200 dark:border-slate-800 break-all select-all">
              DATABASE_URL=&quot;postgresql://user:pass@host:5432/smarthisab?sslmode=require&quot;
            </div>
            <p className="text-[11px] text-slate-400">
              On first boot, the system automatically runs schema migrations and transfers existing data with 0% data loss.
            </p>
          </div>

          {/* 3. Account Isolation & Conflict Prevention */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
              <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>3. Strict Isolation & Duplicate Prevention</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              All financial rows are strictly indexed by User ID. Cryptographic JWT verification prevents any account from accessing another&apos;s data. Idempotent upserts prevent duplicate records during network reconnects.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors cursor-pointer"
          >
            {t.actions.close}
          </button>
        </div>
      </div>
    </div>
  );
};
