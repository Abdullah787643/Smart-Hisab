/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Download, Smartphone, X, CheckCircle, MoreVertical, Share2 } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { useFinance } from '../../context/FinanceContext';

interface PWAInstallButtonProps {
  variant?: 'header' | 'card' | 'badge';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'header' }) => {
  const { isInstallable, isInstalled, isAndroid, isIOS, promptInstall } = usePWAInstall();
  const { t, settings } = useFinance();
  const [showGuideModal, setShowGuideModal] = useState(false);

  // If already running as an installed PWA on home screen, hide
  if (isInstalled) return null;

  const handleInstallClick = async () => {
    const result = await promptInstall();
    if (result === 'manual') {
      setShowGuideModal(true);
    }
  };

  const isBn = settings.language === 'bn';

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {isBn ? 'অ্যাপ ইনস্টল করার উপায়' : 'How to Install App'}
            </h3>
          </div>
          <button
            onClick={() => setShowGuideModal(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isIOS ? (
          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              {isBn ? 'আইফোন / আইপ্যাডে ইনস্টল করতে:' : 'To install on iPhone / iPad:'}
            </p>
            <ol className="list-decimal list-inside space-y-2">
              <li className="flex items-start gap-2">
                <Share2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <span>{isBn ? 'Safari ব্রাউজারের নিচে শেয়ার (Share) বাটনে চাপুন।' : 'Tap the Share button in Safari.'}</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <span>{isBn ? 'মেনু থেকে "Add to Home Screen" নির্বাচন করুন।' : 'Select "Add to Home Screen".'}</span>
              </li>
            </ol>
          </div>
        ) : (
          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              {isBn ? 'অ্যান্ড্রয়েড ক্রোম ব্রাউজারে ইনস্টল করতে:' : 'To install in Android Chrome:'}
            </p>
            <ol className="space-y-2">
              <li className="flex items-start gap-2">
                <MoreVertical className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <span>{isBn ? '১. ক্রোম ব্রাউজারের উপরের ডানের ৩টি ডটে (⋮) ট্যাপ করুন।' : '1. Tap the three dots (⋮) in top right of Chrome.'}</span>
              </li>
              <li className="flex items-start gap-2">
                <Download className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <span>{isBn ? '২. "Install app" বা "Add to Home screen" নির্বাচন করুন।' : '2. Tap "Install app" or "Add to Home screen".'}</span>
              </li>
            </ol>
          </div>
        )}

        <button
          onClick={() => setShowGuideModal(false)}
          className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer transition-colors"
        >
          {isBn ? 'ঠিক আছে' : 'Got it'}
        </button>
      </div>
    </div>
  );

  if (variant === 'card') {
    return (
      <>
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
            onClick={handleInstallClick}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{t.sync.installApp}</span>
          </button>
        </div>
        {showGuideModal && modalContent}
      </>
    );
  }

  // Header variant
  return (
    <>
      <button
        onClick={handleInstallClick}
        title={t.sync.installApp}
        className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer min-h-[36px]"
      >
        <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span>{t.sync.installApp}</span>
      </button>
      {showGuideModal && modalContent}
    </>
  );
};
