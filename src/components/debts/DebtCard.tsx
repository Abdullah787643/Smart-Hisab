/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Phone,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Plus,
  Edit2,
  Trash2,
  CreditCard,
  Check,
} from 'lucide-react';
import { Debt } from '../../types/finance';
import { useFinance } from '../../context/FinanceContext';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface DebtCardProps {
  debt: Debt;
  onRecordPayment: (debt: Debt) => void;
  onEdit: (debt: Debt) => void;
  onDelete: (id: string) => void;
}

export const DebtCard: React.FC<DebtCardProps> = ({
  debt,
  onRecordPayment,
  onEdit,
  onDelete,
}) => {
  const {
    t,
    formatMoney,
    formatAppDate,
    deleteDebtPayment,
    settleDebtImmediately,
  } = useFinance();

  const [showHistory, setShowHistory] = useState(false);
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);
  const [isSettleConfirmOpen, setIsSettleConfirmOpen] = useState(false);

  const isLent = debt.type === 'lent'; // Receivable
  const totalPaid = debt.payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const remaining = Math.max(0, debt.totalAmount - totalPaid);
  const percentage = Math.min(100, Math.round((totalPaid / debt.totalAmount) * 100));
  const isSettled = debt.status === 'settled' || remaining === 0;

  // Due date calculation
  const getDueStatus = () => {
    if (!debt.dueDate) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const due = new Date(debt.dueDate);
    due.setHours(0, 0, 0, 0);

    const diffDays = Math.round((due.getTime() - now.getTime()) / (1000 * 3600 * 24));

    if (isSettled) {
      return { text: t.debts.status.settled, color: 'text-emerald-600 dark:text-emerald-400', isOverdue: false };
    }
    if (diffDays === 0) {
      return { text: t.debts.dueToday, color: 'text-amber-600 dark:text-amber-400', isOverdue: false };
    }
    if (diffDays < 0) {
      return {
        text: `${t.debts.overdue} ${Math.abs(diffDays)} ${t.debts.days}`,
        color: 'text-rose-600 dark:text-rose-400 font-semibold',
        isOverdue: true,
      };
    }
    return {
      text: `${diffDays} ${t.debts.daysRemaining}`,
      color: 'text-slate-500 dark:text-slate-400',
      isOverdue: false,
    };
  };

  const dueStatus = getDueStatus();

  const handleDeletePaymentConfirm = async () => {
    if (deletingPaymentId) {
      await deleteDebtPayment(debt.id, deletingPaymentId);
      setDeletingPaymentId(null);
    }
  };

  const handleSettleConfirm = async () => {
    await settleDebtImmediately(debt.id);
    setIsSettleConfirmOpen(false);
  };

  return (
    <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-xs transition-all">
      {/* Top row: Person Name + Type Tag + Quick Contact Links */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
              {debt.personName}
            </h3>
            {/* Subtle unboxed status indicator */}
            <span
              className={`text-xs font-semibold shrink-0 ${
                isLent
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              · {isLent ? t.debts.lentTab.split(' ')[0] : t.debts.borrowedTab.split(' ')[0]}
            </span>
          </div>

          {/* Clean phone and date metadata */}
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
            {debt.personPhone ? (
              <>
                <span className="font-mono">{debt.personPhone}</span>
                <span aria-hidden="true">·</span>
              </>
            ) : null}
            <span>{formatAppDate(debt.startDate)}</span>
            {dueStatus && (
              <>
                <span aria-hidden="true">·</span>
                <span className={dueStatus.color}>{dueStatus.text}</span>
              </>
            )}
          </div>
        </div>

        {/* Quick Call, SMS, Edit, Delete triggers */}
        <div className="flex items-center gap-1.5 shrink-0">
          {debt.personPhone && (
            <>
              <a
                href={`tel:${debt.personPhone}`}
                title={t.actions.callPerson}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-600 dark:bg-slate-800 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-400 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5" />
              </a>
              <a
                href={`sms:${debt.personPhone}`}
                title={t.actions.smsPerson}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-600 dark:bg-slate-800 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-400 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
              </a>
            </>
          )}

          <button
            type="button"
            onClick={() => onEdit(debt)}
            title={t.actions.edit}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(debt.id)}
            title={t.actions.delete}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-950/60 dark:hover:text-rose-400 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {debt.notes && (
        <p className="mt-2.5 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
          {debt.notes}
        </p>
      )}

      {/* Financial Numbers Matrix */}
      <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2">
        <div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate block">
            {t.debts.totalAmount}
          </span>
          <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-mono tabular-nums truncate">
            {formatMoney(debt.totalAmount)}
          </p>
        </div>

        <div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate block">
            {t.debts.alreadyPaid}
          </span>
          <p className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums truncate">
            {formatMoney(totalPaid)}
          </p>
        </div>

        <div className="text-right">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate block">
            {t.debts.remainingAmount}
          </span>
          <p
            className={`text-sm sm:text-base font-bold font-mono tabular-nums truncate ${
              isSettled
                ? 'text-emerald-600 dark:text-emerald-400'
                : isLent
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatMoney(remaining)}
          </p>
        </div>
      </div>

      {/* Repayment Progress Bar */}
      <div className="mt-3 space-y-1">
        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 rounded-full ${
              isSettled ? 'bg-emerald-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>{percentage}% {t.debts.percentPaid}</span>
          <span>{isSettled ? t.debts.status.settled : `${debt.payments.length} ${t.debts.paymentsCount}`}</span>
        </div>
      </div>

      {/* Action Footer: Record Payment, Quick Settle & History Toggle */}
      <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors cursor-pointer py-1"
        >
          <span>
            {t.debts.paymentHistory} ({debt.payments.length})
          </span>
          {showHistory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        <div className="flex items-center gap-2">
          {!isSettled ? (
            <>
              <button
                type="button"
                onClick={() => setIsSettleConfirmOpen(true)}
                title={t.actions.settleNow}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden xs:inline">{t.actions.settleNow}</span>
              </button>

              <button
                type="button"
                onClick={() => onRecordPayment(debt)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl transition-all shadow-2xs cursor-pointer min-h-[34px]"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{t.debts.recordPartialPayment}</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>{t.debts.status.settled}</span>
            </div>
          )}
        </div>
      </div>

      {/* Accordion History Drawer with Delete Payment capabilities */}
      {showHistory && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2 animate-in fade-in duration-150">
          {debt.payments.length === 0 ? (
            <p className="text-xs text-slate-400 py-2 text-center">
              {t.debts.noPaymentsYet}
            </p>
          ) : (
            debt.payments.map((p, idx) => (
              <div
                key={p.id || idx}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs"
              >
                <div className="space-y-0.5 min-w-0 pr-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {formatMoney(p.amount)}
                    </span>
                    {p.paymentMethod && (
                      <span className="text-[10px] text-slate-400">
                        ({t.paymentMethods[p.paymentMethod] || p.paymentMethod})
                      </span>
                    )}
                  </div>
                  {p.note && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {p.note}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] text-slate-400 font-mono">
                    {formatAppDate(p.date)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setDeletingPaymentId(p.id)}
                    title={t.actions.delete}
                    className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Settle Debt Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isSettleConfirmOpen}
        title={t.debts.confirmSettleTitle}
        message={t.debts.confirmSettleMessage}
        confirmLabel={t.actions.confirm}
        isDestructive={false}
        onConfirm={handleSettleConfirm}
        onCancel={() => setIsSettleConfirmOpen(false)}
      />

      {/* Delete Payment Record Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingPaymentId)}
        title={t.actions.deletePaymentTitle}
        message={t.actions.deletePaymentMessage}
        confirmLabel={t.actions.delete}
        isDestructive={true}
        onConfirm={handleDeletePaymentConfirm}
        onCancel={() => setDeletingPaymentId(null)}
      />
    </div>
  );
};
