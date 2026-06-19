/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Driver {
  id: string;
  name: string;
  phone: string;
  city: string;
  monthlyFee: number; // in Tomans
  joinDate: string; // e.g., "1402/05/10" (Persian Calendar preferred or standard)
  truckModel: string; // e.g., Volvo FH500, Scania, Mack
  licensePlate: string; // e.g., "34 ب 567 ایران 22"
  status: 'active' | 'inactive';
  billingDay: number; // Day of Persian month for recurring fee (1 to 31)
  notes?: string;
  nationalId?: string; // کد ملی
  username?: string; // نام کاربری
  password?: string; // رمز عبور
  licenseExpiryDate?: string; // تاریخ انقضای پروانه فعالیت
  creditBalance?: number; // بستانکاری / طلبکاری (تومان)
  invoiceStartPreference?: 'joinMonth' | 'nextMonth'; // شروع فاکتوردهی از ماه عضویت یا ماه بعد
}

export interface Invoice {
  id: string;
  driverId: string;
  driverName: string;
  driverPhone: string;
  amount: number;
  period: string; // e.g., "خرداد ۱۴۰۵" or "1405/03"
  issueDate: string; // Shamsi or Gregorian
  dueDate: string; // Shamsi or Gregorian
  status: 'paid' | 'pending' | 'overdue';
  paymentDate?: string;
  paymentMethod?: string; // "کارت به کارت", "نقدی", "واریز به حساب"
  description?: string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  notes?: string;
}

export interface AppSettings {
  businessName: string;
  managerName: string;
  phone: string;
  currency: string; // "تومان" or "ریال"
  cardAccountNumber: string; // For invoices
  cardHolderName: string;
  autoInvoicerDay: number; // Day of the month to trigger warnings/alerts
}

export interface AppState {
  drivers: Driver[];
  invoices: Invoice[];
  expenses: Expense[];
  settings: AppSettings;
}
