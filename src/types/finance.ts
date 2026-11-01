/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TransactionType = 'income' | 'expense';

export type PaymentMethod = 
  | 'cash' 
  | 'bkash' 
  | 'nagad' 
  | 'rocket' 
  | 'bank' 
  | 'credit_card' 
  | 'debit_card' 
  | 'other';

export type IncomeCategory = 
  | 'salary' 
  | 'business' 
  | 'freelance' 
  | 'investment' 
  | 'rental' 
  | 'gift' 
  | 'bonus' 
  | 'debt_collection'
  | 'other';

export type ExpenseCategory = 
  | 'food' 
  | 'groceries' 
  | 'housing' 
  | 'utilities' 
  | 'transport' 
  | 'shopping' 
  | 'medical' 
  | 'education' 
  | 'entertainment' 
  | 'family' 
  | 'debt_payment' 
  | 'charity'
  | 'other';

export type Category = IncomeCategory | ExpenseCategory;

export interface Transaction {
  id: string;
  userId?: string;
  type: TransactionType;
  amount: number;
  category: Category;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  description?: string;
  source?: string; // For income: e.g. Acme Corp, Client X
  whereSpent?: string; // For expense: e.g. Shwapno, Cafe Bistro, Pharmacy
  whySpent?: string; // For expense: e.g. Monthly ration, Dinner with friends
  paymentMethod: PaymentMethod;
  createdAt: number;
  updatedAt: number;
}

export type DebtType = 'lent' | 'borrowed';
// 'lent': I gave money -> Receivable (টাকা পাব / পাওনা)
// 'borrowed': I took money -> Payable (টাকা দেব / দেনা)

export type DebtStatus = 'pending' | 'partial' | 'settled';

export interface DebtPayment {
  id: string;
  amount: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  note?: string;
  paymentMethod?: PaymentMethod;
  createdAt: number;
}

export interface Debt {
  id: string;
  userId?: string;
  type: DebtType;
  personName: string;
  personPhone?: string;
  totalAmount: number;
  startDate: string; // YYYY-MM-DD
  dueDate?: string; // YYYY-MM-DD
  status: DebtStatus;
  notes?: string;
  payments: DebtPayment[];
  createdAt: number;
  updatedAt: number;
}

export type AppLanguage = 'en' | 'bn';
export type AppCurrency = 'BDT' | 'USD' | 'EUR';
export type AppTheme = 'light' | 'dark' | 'system';

export interface AppSettings {
  language: AppLanguage;
  currency: AppCurrency;
  theme: AppTheme;
  bengaliDigits: boolean; // Render digits as ১২৩৪৫ in Bengali mode
  hasSeededInitialData?: boolean;
}

export interface BackupData {
  version: number;
  exportedAt: string;
  appName: string;
  data: {
    transactions: Transaction[];
    debts: Debt[];
    settings: AppSettings;
  };
}

export type ActiveTab = 'dashboard' | 'transactions' | 'debts' | 'analytics' | 'settings';

export type QuickAddType = 'income' | 'expense' | 'debt' | 'choice';
