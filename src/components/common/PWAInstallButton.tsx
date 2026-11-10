/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Download, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { useFinance } from '../../context/FinanceContext';

interface PWAInstallButtonProps {
  variant?: 'header' | 'card' | 'badge';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'header' }) => {
  const { isInstallable, promptInstall } = usePWAInstall();
  const { t } = useFinance();

  if (!isInstallable) return null;

  if (variant === 'card') {
    return (
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/5 border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
              {t.sync.installApp}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {t.sync.installAppDesc}
            </p>
          </div>
        </div>
        <button
          onClick={promptInstall}
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>{t.sync.installApp}</span>
        </button>
      </div>
    );
  }

  // Header variant
  return (
    <button
      onClick={promptInstall}
      title={t.sync.installApp}
      className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer min-h-[38px]"
    >
      <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
      <span>{t.sync.installApp}</span>
    </button>
  );
};
