/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Helper to convert English digits to Persian digits
export function toPersianDigits(num: number | string | undefined): string {
  if (num === undefined || num === null) return '';
  const str = num.toString();
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.replace(/[0-9]/g, (w) => persianDigits[parseInt(w, 10)]);
}

// Convert price to formatted string with commas (e.g., 4,500,000 تومان)
export function formatCurrency(amount: number, currency: string = 'تومان'): string {
  const formatted = amount.toLocaleString('en-US');
  return `${toPersianDigits(formatted)} ${currency}`;
}

// Map english numerals in string back to standard number
export function cleanNumber(str: string): number {
  const persianDigits = [/۰/g, /۱/g, /۲/g, /۳/g, /۴/g, /۵/g, /۶/g, /۷/g, /۸/g, /۹/g];
  const arabicDigits = [/٠/g, /١/g, /٢/g, /٣/g, /٤/g, /٥/g, /٦/g, /٧/g, /٨/g, /٩/g];
  let cleanStr = str;
  for (let i = 0; i < 10; i++) {
    cleanStr = cleanStr.replace(persianDigits[i], i.toString()).replace(arabicDigits[i], i.toString());
  }
  return parseFloat(cleanStr.replace(/[^0-9.]/g, '')) || 0;
}

// Create a unique id
export function generateUUID(): string {
  return Math.random().toString(36).substring(2, 11);
}

// Simple Solar Hijri Date Estimation for June 2026
// Current date: 2026-06-10 => solar hijri 1405/03/20 (20 Khordad 1405)
export function getPersianToday(): { year: number; month: number; day: number; formatted: string } {
  // Let's use a solid calculation tailored for approx modern dates
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const day = today.getDate();
  
  // Custom simple offset approximation near 2026
  // June 10, 2026 is exactly 21 Khordad 1405.
  // We'll write a simple conversion
  let shYear = year - 621;
  let shMonth = 1;
  let shDay = 1;

  // Approximate offset
  // Jan = Dey/Bahman, Feb = Bahman/Esfand, Mar = Esfand/Farvardin, Apr = Farvardin/Ordibehesht, May = Ordibehesht/Khordad, Jun = Khordad/Tir ...
  if (month === 1) { // Jan
    shYear -= 1;
    shMonth = day <= 20 ? 10 : 11;
    shDay = day <= 20 ? day + 10 : day - 20;
  } else if (month === 2) { // Feb
    shYear -= 1;
    shMonth = day <= 19 ? 11 : 12;
    shDay = day <= 19 ? day + 11 : day - 19;
  } else if (month === 3) { // Mar
    // Farvardin starts on Mar 20 or 21 (approx)
    if (day <= 20) {
      shYear -= 1;
      shMonth = 12;
      shDay = day + 9; // Approx
    } else {
      shMonth = 1;
      shDay = day - 20;
    }
  } else if (month === 4) { // Apr
    shMonth = day <= 20 ? 1 : 2;
    shDay = day <= 20 ? day + 11 : day - 20;
  } else if (month === 5) { // May
    shMonth = day <= 21 ? 2 : 3;
    shDay = day <= 21 ? day + 10 : day - 21;
  } else if (month === 6) { // Jun
    shMonth = day <= 21 ? 3 : 4;
    shDay = day <= 21 ? day + 10 : day - 21;
  } else if (month === 7) { // Jul
    shMonth = day <= 22 ? 4 : 5;
    shDay = day <= 22 ? day + 9 : day - 22;
  } else if (month === 8) { // Aug
    shMonth = day <= 22 ? 5 : 6;
    shDay = day <= 22 ? day + 9 : day - 22;
  } else if (month === 9) { // Sep
    shMonth = day <= 22 ? 6 : 7;
    shDay = day <= 22 ? day + 8 : day - 22;
  } else if (month === 10) { // Oct
    shMonth = day <= 22 ? 7 : 8;
    shDay = day <= 22 ? day + 8 : day - 22;
  } else if (month === 11) { // Nov
    shMonth = day <= 21 ? 8 : 9;
    shDay = day <= 21 ? day + 9 : day - 21;
  } else if (month === 12) { // Dec
    shMonth = day <= 21 ? 9 : 10;
    shDay = day <= 21 ? day + 9 : day - 21;
  }

  const monthsList = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
  ];

  return {
    year: shYear,
    month: shMonth,
    day: shDay,
    formatted: `${toPersianDigits(shYear)}/${toPersianDigits(shMonth.toString().padStart(2, '0'))}/${toPersianDigits(shDay.toString().padStart(2, '0'))}`
  };
}

export function getCurrentPersianMonthName(): string {
  const monthsList = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
  ];
  const { month, year } = getPersianToday();
  return `${monthsList[month - 1]} ${toPersianDigits(year)}`;
}

export function getMonthNameByOffset(offset: number): string {
  const monthsList = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
  ];
  let { month, year } = getPersianToday();
  month += offset;
  while (month <= 0) {
    month += 12;
    year -= 1;
  }
  while (month > 12) {
    month -= 12;
    year += 1;
  }
  return `${monthsList[month - 1]} ${toPersianDigits(year)}`;
}
