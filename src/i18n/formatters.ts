/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppCurrency, AppLanguage } from '../types/finance';

const CURRENCY_SYMBOLS: Record<AppCurrency, string> = {
  BDT: '৳',
  USD: '$',
  EUR: '€',
};

const BENGALI_DIGITS: Record<string, string> = {
  '0': '০',
  '1': '১',
  '2': '২',
  '3': '৩',
  '4': '৪',
  '5': '৫',
  '6': '৬',
  '7': '৭',
  '8': '৮',
  '9': '৯',
};

const BENGALI_MONTHS = [
  'জানুয়ারি',
  'ফেব্রুয়ারি',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টেম্বর',
  'অক্টোবর',
  'নভেম্বর',
  'ডিসেম্বর',
];

const ENGLISH_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export function toBengaliNumber(val: number | string): string {
  const str = String(val);
  return str.replace(/[0-9]/g, (digit) => BENGALI_DIGITS[digit] || digit);
}

export const formatBengaliDigits = toBengaliNumber;

export function formatCurrency(
  amount: number,
  currency: AppCurrency = 'BDT',
  language: AppLanguage = 'en',
  useBengaliDigits: boolean = false
): string {
  const symbol = CURRENCY_SYMBOLS[currency] || '৳';
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  // Format standard number with commas
  const formattedStandard = new Intl.NumberFormat(currency === 'BDT' ? 'en-IN' : 'en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(absAmount);

  let finalNumber = formattedStandard;
  if (language === 'bn' || useBengaliDigits) {
    finalNumber = toBengaliNumber(formattedStandard);
  }

  const sign = isNegative ? '-' : '';
  
  if (currency === 'BDT') {
    return `${sign}${symbol}${finalNumber}`;
  }
  return `${sign}${symbol}${finalNumber}`;
}

export function formatDate(
  dateString: string,
  language: AppLanguage = 'en',
  useBengaliDigits: boolean = false
): string {
  if (!dateString) return '';
  const [yearStr, monthStr, dayStr] = dateString.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const day = parseInt(dayStr, 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    return dateString;
  }

  // Check today / yesterday
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  if (dateString === todayStr) {
    return language === 'bn' ? 'আজ' : 'Today';
  }
  if (dateString === yesterdayStr) {
    return language === 'bn' ? 'গতকাল' : 'Yesterday';
  }

  if (language === 'bn') {
    const bnDay = useBengaliDigits ? toBengaliNumber(day) : day;
    const bnYear = useBengaliDigits ? toBengaliNumber(year) : year;
    const bnMonth = BENGALI_MONTHS[month] || monthStr;
    return `${bnDay} ${bnMonth}, ${bnYear}`;
  }

  const enMonth = ENGLISH_MONTHS[month] || monthStr;
  return `${day} ${enMonth} ${year}`;
}

export function formatTime(timeString?: string, language: AppLanguage = 'en'): string {
  if (!timeString) return '';
  const [hStr, mStr] = timeString.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (isNaN(h) || isNaN(m)) return timeString;

  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  const displayM = m < 10 ? `0${m}` : `${m}`;

  if (language === 'bn') {
    let bnPeriod = '';
    if (h >= 4 && h < 12) bnPeriod = 'সকাল';
    else if (h >= 12 && h < 16) bnPeriod = 'দুপুর';
    else if (h >= 16 && h < 19) bnPeriod = 'বিকাল';
    else bnPeriod = 'রাত';

    return `${bnPeriod} ${toBengaliNumber(displayH)}:${toBengaliNumber(displayM)}`;
  }

  return `${displayH}:${displayM} ${period}`;
}
