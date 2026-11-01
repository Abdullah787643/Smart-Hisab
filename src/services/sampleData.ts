/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Transaction, Debt } from '../types/finance';

export function getSampleData(): { transactions: Transaction[]; debts: Debt[] } {
  const now = new Date();
  const formatD = (offsetDays: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - offsetDays);
    return d.toISOString().slice(0, 10);
  };

  const today = formatD(0);
  const yesterday = formatD(1);
  const d3 = formatD(3);
  const d5 = formatD(5);
  const d8 = formatD(8);
  const d12 = formatD(12);

  const transactions: Transaction[] = [
    {
      id: 'tx-1',
      type: 'income',
      amount: 75000,
      category: 'salary',
      date: d12,
      time: '10:00',
      source: 'Tech Solutions Ltd',
      description: 'Monthly Salary - Direct Deposit',
      paymentMethod: 'bank',
      createdAt: Date.now() - 12 * 86400000,
      updatedAt: Date.now() - 12 * 86400000,
    },
    {
      id: 'tx-2',
      type: 'expense',
      amount: 18000,
      category: 'housing',
      date: d12,
      time: '14:30',
      whereSpent: 'Apartment Owner',
      whySpent: 'House rent payment for this month',
      paymentMethod: 'bank',
      createdAt: Date.now() - 12 * 86400000 + 1000,
      updatedAt: Date.now() - 12 * 86400000 + 1000,
    },
    {
      id: 'tx-3',
      type: 'income',
      amount: 22000,
      category: 'freelance',
      date: d8,
      time: '16:45',
      source: 'Global UX Client',
      description: 'Design system consultation project',
      paymentMethod: 'bank',
      createdAt: Date.now() - 8 * 86400000,
      updatedAt: Date.now() - 8 * 86400000,
    },
    {
      id: 'tx-4',
      type: 'expense',
      amount: 4650,
      category: 'groceries',
      date: d5,
      time: '18:15',
      whereSpent: 'Shwapno Super Shop',
      whySpent: 'Weekly kitchen groceries and vegetables',
      paymentMethod: 'credit_card',
      createdAt: Date.now() - 5 * 86400000,
      updatedAt: Date.now() - 5 * 86400000,
    },
    {
      id: 'tx-5',
      type: 'expense',
      amount: 2400,
      category: 'utilities',
      date: d3,
      time: '11:20',
      whereSpent: 'DESCO / Titas Gas',
      whySpent: 'Electricity & Gas bill clearance',
      paymentMethod: 'bkash',
      createdAt: Date.now() - 3 * 86400000,
      updatedAt: Date.now() - 3 * 86400000,
    },
    {
      id: 'tx-6',
      type: 'expense',
      amount: 1250,
      category: 'food',
      date: yesterday,
      time: '19:40',
      whereSpent: 'Sultan Dine',
      whySpent: 'Dinner with family',
      paymentMethod: 'cash',
      createdAt: Date.now() - 86400000,
      updatedAt: Date.now() - 86400000,
    },
    {
      id: 'tx-7',
      type: 'expense',
      amount: 350,
      category: 'transport',
      date: today,
      time: '09:15',
      whereSpent: 'Uber Ride / CNG',
      whySpent: 'Office commute',
      paymentMethod: 'nagad',
      createdAt: Date.now() - 7200000,
      updatedAt: Date.now() - 7200000,
    },
    {
      id: 'tx-8',
      type: 'income',
      amount: 5000,
      category: 'debt_collection',
      date: today,
      time: '11:30',
      source: 'Rafiqul Islam',
      description: 'First installment payment of debt',
      paymentMethod: 'bkash',
      createdAt: Date.now() - 3600000,
      updatedAt: Date.now() - 3600000,
    },
  ];

  const dueIn5Days = new Date(now);
  dueIn5Days.setDate(dueIn5Days.getDate() + 5);
  const dueIn15Days = new Date(now);
  dueIn15Days.setDate(dueIn15Days.getDate() + 15);

  const debts: Debt[] = [
    {
      id: 'debt-1',
      type: 'lent', // Receivable (টাকা পাব)
      personName: 'Rafiqul Islam',
      personPhone: '+8801711223344',
      totalAmount: 15000,
      startDate: d12,
      dueDate: dueIn5Days.toISOString().slice(0, 10),
      status: 'partial',
      notes: 'Emergency loan for medical tests, promised to return in 2 installments',
      payments: [
        {
          id: 'pay-1',
          amount: 5000,
          date: today,
          time: '11:30',
          note: 'First installment via bKash',
          paymentMethod: 'bkash',
          createdAt: Date.now() - 3600000,
        },
      ],
      createdAt: Date.now() - 12 * 86400000,
      updatedAt: Date.now() - 3600000,
    },
    {
      id: 'debt-2',
      type: 'lent', // Receivable (টাকা পাব)
      personName: 'Tanvir Ahmed',
      personPhone: '+8801819334455',
      totalAmount: 6000,
      startDate: d5,
      dueDate: dueIn15Days.toISOString().slice(0, 10),
      status: 'pending',
      notes: 'Borrowed for laptop RAM upgrade',
      payments: [],
      createdAt: Date.now() - 5 * 86400000,
      updatedAt: Date.now() - 5 * 86400000,
    },
    {
      id: 'debt-3',
      type: 'borrowed', // Payable (টাকা দেব)
      personName: 'Uncle Kabir',
      personPhone: '+8801912445566',
      totalAmount: 10000,
      startDate: d8,
      dueDate: dueIn15Days.toISOString().slice(0, 10),
      status: 'partial',
      notes: 'Borrowed for car repair expense',
      payments: [
        {
          id: 'pay-2',
          amount: 4000,
          date: yesterday,
          time: '17:00',
          note: 'Paid cash in person',
          paymentMethod: 'cash',
          createdAt: Date.now() - 86400000,
        },
      ],
      createdAt: Date.now() - 8 * 86400000,
      updatedAt: Date.now() - 86400000,
    },
    {
      id: 'debt-4',
      type: 'borrowed', // Settled
      personName: 'Sajid Karim',
      personPhone: '+8801611778899',
      totalAmount: 2500,
      startDate: d12,
      status: 'settled',
      notes: 'Weekend dinner split coverage',
      payments: [
        {
          id: 'pay-3',
          amount: 2500,
          date: d5,
          time: '12:00',
          note: 'Fully paid via Nagad',
          paymentMethod: 'nagad',
          createdAt: Date.now() - 5 * 86400000,
        },
      ],
      createdAt: Date.now() - 12 * 86400000,
      updatedAt: Date.now() - 5 * 86400000,
    },
  ];

  return { transactions, debts };
}
