/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Briefcase,
  TrendingUp,
  Laptop,
  Building,
  Key,
  Gift,
  Award,
  ArrowDownLeft,
  Utensils,
  ShoppingCart,
  Home,
  Zap,
  Car,
  ShoppingBag,
  HeartPulse,
  GraduationCap,
  Film,
  Users,
  CreditCard,
  Heart,
  HelpCircle,
  LucideIcon,
} from 'lucide-react';
import { Category, PaymentMethod } from '../../types/finance';
import { useFinance } from '../../context/FinanceContext';

const CATEGORY_ICONS: Record<Category, LucideIcon> = {
  salary: Briefcase,
  business: Building,
  freelance: Laptop,
  investment: TrendingUp,
  rental: Key,
  gift: Gift,
  bonus: Award,
  debt_collection: ArrowDownLeft,
  food: Utensils,
  groceries: ShoppingCart,
  housing: Home,
  utilities: Zap,
  transport: Car,
  shopping: ShoppingBag,
  medical: HeartPulse,
  education: GraduationCap,
  entertainment: Film,
  family: Users,
  debt_payment: CreditCard,
  charity: Heart,
  other: HelpCircle,
};

export const getCategoryIcon = (category: Category): LucideIcon => {
  return CATEGORY_ICONS[category] || HelpCircle;
};

interface CategoryIconProps {
  category: Category;
  size?: 'sm' | 'md' | 'lg';
  isIncome?: boolean;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  category,
  size = 'md',
  isIncome = false,
}) => {
  const IconComponent = getCategoryIcon(category);

  const sizeClasses = {
    sm: 'w-7 h-7 rounded-lg text-xs',
    md: 'w-10 h-10 rounded-xl text-sm',
    lg: 'w-12 h-12 rounded-2xl text-base',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const colorStyle = isIncome
    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
    : 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400';

  return (
    <div
      className={`shrink-0 flex items-center justify-center font-medium ${sizeClasses[size]} ${colorStyle}`}
    >
      <IconComponent className={iconSizes[size]} />
    </div>
  );
};

export const PaymentMethodBadge: React.FC<{ method: PaymentMethod }> = ({ method }) => {
  const { t } = useFinance();
  const label = t.paymentMethods[method] || method;

  return (
    <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">
      {label}
    </span>
  );
};
