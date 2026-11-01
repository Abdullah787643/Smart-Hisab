/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { DashboardView } from './components/dashboard/DashboardView';
import { TransactionsView } from './components/transactions/TransactionsView';
import { DebtsView } from './components/debts/DebtsView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { SettingsView } from './components/settings/SettingsView';
import { QuickAddDrawer } from './components/common/QuickAddDrawer';
import { TransactionModal } from './components/transactions/TransactionModal';
import { DebtModal } from './components/debts/DebtModal';
import { RecordPaymentModal } from './components/debts/RecordPaymentModal';
import { AuthModal } from './components/auth/AuthModal';
import { CheckCircle2 } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const {
    activeTab,
    isLoading,
    toastMessage,
    editingTransaction,
    setEditingTransaction,
    editingDebt,
    setEditingDebt,
    recordingPaymentDebt,
    setRecordingPaymentDebt,
  } = useFinance();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Bar Header */}
      <Header />

      {/* Main Responsive Viewport */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-4 sm:py-6 pb-24 md:pb-12">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
            <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-500 font-medium">Smart Hisab Loading...</p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && <DashboardView />}
            {activeTab === 'transactions' && <TransactionsView />}
            {activeTab === 'debts' && <DebtsView />}
            {activeTab === 'analytics' && <AnalyticsView />}
            {activeTab === 'settings' && <SettingsView />}
          </>
        )}
      </main>

      {/* Global Quick Add Action Sheet */}
      <QuickAddDrawer />

      {/* Edit Transaction Modal */}
      {editingTransaction && (
        <TransactionModal
          isOpen={true}
          onClose={() => setEditingTransaction(null)}
          editingTransaction={editingTransaction}
          initialType={editingTransaction.type}
        />
      )}

      {/* Edit Debt Modal */}
      {editingDebt && (
        <DebtModal
          isOpen={true}
          onClose={() => setEditingDebt(null)}
          editingDebt={editingDebt}
          initialType={editingDebt.type}
        />
      )}

      {/* Record Debt Payment Modal */}
      {recordingPaymentDebt && (
        <RecordPaymentModal
          isOpen={true}
          onClose={() => setRecordingPaymentDebt(null)}
          debt={recordingPaymentDebt}
        />
      )}

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:right-6 z-50 flex items-center justify-center md:justify-end pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-900 shadow-xl text-xs sm:text-sm font-medium backdrop-blur-md">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Authentication and Account Switcher Modal */}
      <AuthModal />

      {/* Mobile-first ergonomic Bottom Navigation Bar */}
      <BottomNav />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <FinanceProvider>
        <MainAppContent />
      </FinanceProvider>
    </AuthProvider>
  );
}
