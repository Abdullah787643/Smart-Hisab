/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Cloud, CloudOff, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatBengaliDigits } from '../../i18n/formatters';

interface SyncStatusBadgeProps {
  compact?: boolean;
}

export const SyncStatusBadge: React.FC<SyncStatusBadgeProps> = ({ compact = false }) => {
  const { syncStatus, pendingCount, triggerManualSync, t, settings } = useFinance();
  const [isSyncingManually, setIsSyncingManually] = useState(false);

  const handleSyncClick = async () => {
    if (syncStatus === 'syncing' || isSyncingManually) return;
    setIsSyncingManually(true);
    try {
      await triggerManualSync();
    } finally {
      setIsSyncingManually(false);
    }
  };

  const countDisplay = settings.bengaliDigits
    ? formatBengaliDigits(pendingCount)
    : pendingCount.toString();

  // 1. Syncing state
  if (syncStatus === 'syncing' || isSyncingManually) {
    return (
      <button
        onClick={handleSyncClick}
        title={t.sync.syncing}
        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60 transition-colors cursor-pointer select-none"
      >
        <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-600 dark:text-sky-400" />
        {!compact && (
          <span className="hidden sm:inline">
            {t.sync.syncing}
            {pendingCount > 0 && ` (${countDisplay})`}
          </span>
        )}
      </button>
    );
  }

  // 2. Offline state
  if (syncStatus === 'offline') {
    return (
      <button
        onClick={handleSyncClick}
        title={`${t.sync.offline} - ${pendingCount > 0 ? `${pendingCount} ${t.sync.pendingChanges}` : t.sync.localDataSaved}`}
        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 transition-colors cursor-pointer select-none"
      >
        <CloudOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
        <span className="font-medium">
          {t.sync.offline}
          {pendingCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-200 dark:bg-amber-900/80 text-[10px] text-amber-900 dark:text-amber-200 font-bold">
              {countDisplay}
            </span>
          )}
        </span>
      </button>
    );
  }

  // 3. Error state
  if (syncStatus === 'error') {
    return (
      <button
        onClick={handleSyncClick}
        title={`${t.sync.syncFailed} - ${t.sync.tapToRetry}`}
        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors cursor-pointer select-none"
      >
        <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
        <span className="font-medium">
          {t.sync.syncFailed}
          {!compact && <span className="hidden sm:inline text-[11px] opacity-80"> ({t.sync.tapToRetry})</span>}
        </span>
      </button>
    );
  }

  // 4. Online & Synced state
  return (
    <button
      onClick={handleSyncClick}
      title={`${t.sync.online} - ${t.sync.synced}`}
      className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-lg bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/40 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40 transition-colors cursor-pointer select-none"
    >
      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
      {!compact && (
        <span className="hidden sm:inline font-medium">
          {t.sync.online}
        </span>
      )}
    </button>
  );
};
