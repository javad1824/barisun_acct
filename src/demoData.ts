/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppState } from './types';

export const initialAppState: AppState = {
  drivers: [
    {
      id: 'drv-1',
      name: 'جلال همتی',
      phone: '09123456789',
      city: 'بندرعباس',
      monthlyFee: 4500000,
      joinDate: '1402/02/15',
      truckModel: 'ولوو FH 500 نسل ۵',
      licensePlate: '۵۴ ع ۸۷۶ ایران ۸۲',
      status: 'active',
      billingDay: 10,
      notes: 'راننده مسیر ترانزیتی بندرعباس - تهران. خوش‌حساب.'
    },
    {
      id: 'drv-2',
      name: 'غلامرضا ذوالقدری',
      phone: '09131112233',
      city: 'اصفهان',
      monthlyFee: 5000000,
      joinDate: '1402/05/01',
      truckModel: 'اسکانیا R500 جفت‌محور',
      licensePlate: '۲۳ ب ۷۶۵ ایران ۵۳',
      status: 'active',
      billingDay: 15,
      notes: 'حمل بار سنگین آهن‌آلات.'
    },
    {
      id: 'drv-3',
      name: 'رضا کریمی ده سرخ',
      phone: '09154445566',
      city: 'مشهد',
      monthlyFee: 3800000,
      joinDate: '1401/11/12',
      truckModel: 'بنز ۲۶۲۴ مایلر ده چرخ',
      licensePlate: '۱۲ ق ۵۴۳ ایران ۱۲',
      status: 'active',
      billingDay: 5,
      notes: 'مسیر فعال خراسان رضوی.'
    },
    {
      id: 'drv-4',
      name: 'محمدرضا باقری',
      phone: '09355556677',
      city: 'تبریز',
      monthlyFee: 4800000,
      joinDate: '1402/09/20',
      truckModel: 'اف‌ام ۴۶۰ باری',
      licensePlate: '۳۳ ج ۱۲۳ ایران ۳۵',
      status: 'active',
      billingDay: 21,
      notes: 'حمل بارهای گمرکی ترکیه.'
    },
    {
      id: 'drv-5',
      name: 'امیرعباس شاه‌حسینی',
      phone: '09012223344',
      city: 'قزوین',
      monthlyFee: 3200000,
      joinDate: '1403/01/10',
      truckModel: 'کشنده فوتون ۴۳۰',
      licensePlate: '۸۷ الف ۶۵۴ ایران ۷۹',
      status: 'active',
      billingDay: 10,
      notes: 'بیشتر در خط قزوین الی بندرعباس فعال است.'
    },
    {
      id: 'drv-6',
      name: 'حسین سلیمانی',
      phone: '09189998877',
      city: 'کرمانشاه',
      monthlyFee: 4000000,
      joinDate: '1402/12/05',
      truckModel: 'رنو پریمیوم ۴۶۰ دنده‌ای',
      licensePlate: '۴۵ ط ۶۹۸ ایران ۱۹',
      status: 'inactive',
      billingDay: 25,
      notes: 'در حال اصلاح کارهای معاینه فنی و ترخیص گمرکی برای چند ماه آینده غیرفعال.'
    }
  ],
  invoices: [
    // Prepopulated Invoices for "اردیبهشت ۱۴۰۵" (Previous Month)
    {
      id: 'inv-1',
      driverId: 'drv-1',
      driverName: 'جلال همتی',
      driverPhone: '09123456789',
      amount: 4500000,
      period: 'اردیبهشت ۱۴۰۵',
      issueDate: '1405/02/10',
      dueDate: '1405/02/15',
      status: 'paid',
      paymentDate: '1405/02/12',
      paymentMethod: 'کارت به کارت'
    },
    {
      id: 'inv-2',
      driverId: 'drv-2',
      driverName: 'غلامرضا ذوالقدری',
      driverPhone: '09131112233',
      amount: 5000000,
      period: 'اردیبهشت ۱۴۰۵',
      issueDate: '1405/02/15',
      dueDate: '1405/02/20',
      status: 'paid',
      paymentDate: '1405/02/19',
      paymentMethod: 'واریز به حساب'
    },
    {
      id: 'inv-3',
      driverId: 'drv-3',
      driverName: 'رضا کریمی ده سرخ',
      driverPhone: '09154445566',
      amount: 3800000,
      period: 'اردیبهشت ۱۴۰۵',
      issueDate: '1405/02/05',
      dueDate: '1405/02/10',
      status: 'paid',
      paymentDate: '1405/02/08',
      paymentMethod: 'کارت به کارت'
    },
    {
      id: 'inv-4',
      driverId: 'drv-4',
      driverName: 'محمدرضا باقری',
      driverPhone: '09355556677',
      amount: 4800000,
      period: 'اردیبهشت ۱۴۰۵',
      issueDate: '1405/02/21',
      dueDate: '1405/02/26',
      status: 'paid',
      paymentDate: '1405/02/23',
      paymentMethod: 'کارت به کارت'
    },
    {
      id: 'inv-5',
      driverId: 'drv-5',
      driverName: 'امیرعباس شاه‌حسینی',
      driverPhone: '09012223344',
      amount: 3200000,
      period: 'اردیبهشت ۱۴۰۵',
      issueDate: '1405/02/10',
      dueDate: '1405/02/15',
      status: 'paid',
      paymentDate: '1405/02/14',
      paymentMethod: 'نقدی'
    },
    // Prepopulated Invoices for "خرداد ۱۴۰۵" (Current Month)
    {
      id: 'inv-6',
      driverId: 'drv-3',
      driverName: 'رضا کریمی ده سرخ',
      driverPhone: '09154445566',
      amount: 3800000,
      period: 'خرداد ۱۴۰۵',
      issueDate: '1405/03/05',
      dueDate: '1405/03/10',
      status: 'paid',
      paymentDate: '1405/03/09',
      paymentMethod: 'کارت به کارت'
    },
    {
      id: 'inv-7',
      driverId: 'drv-1',
      driverName: 'جلال همتی',
      driverPhone: '09123456789',
      amount: 4500000,
      period: 'خرداد ۱۴۰۵',
      issueDate: '1405/03/10',
      dueDate: '1405/03/15',
      status: 'pending', // Pending (near billDate but not paid yet)
    },
    {
      id: 'inv-8',
      driverId: 'drv-5',
      driverName: 'امیرعباس شاه‌حسینی',
      driverPhone: '09012223344',
      amount: 3200000,
      period: 'خرداد ۱۴۰۵',
      issueDate: '1405/03/10',
      dueDate: '1405/03/15',
      status: 'overdue', // Overdue because current date is Khordad 21 (Jun 10)
    }
  ],
  expenses: [
    {
      id: 'exp-1',
      title: 'خرید اینترنت سیم کارت دفتر باربری',
      amount: 450000,
      category: 'اینترنت و تلفن',
      date: '1405/03/02',
      notes: 'بسته ۶ ماهه ۳۰ گیگابایت برای مودم همراه دفتر'
    },
    {
      id: 'exp-2',
      title: 'اجاره بهای دفتر شهری و پارکینگ کامیون',
      amount: 3500000,
      category: 'اجاره و نگهبانی',
      date: '1405/03/01',
      notes: 'قسط خرداد ماه ۱۴۰۵'
    },
    {
      id: 'exp-3',
      title: 'هزینه ترخیص‌کار و چایچی دفتر',
      amount: 800000,
      category: 'ملزومات اداری و پذیرایی',
      date: '1405/03/05'
    },
    {
      id: 'exp-4',
      title: 'چاپ فاکتور و اوراق سلفون‌دار اداری برای رانندگان',
      amount: 1200000,
      category: 'تبلیغات و چاپ',
      date: '1405/02/25',
      notes: '۲۰۰ برگ قبض باربری و رسیدهای بهادار فانتوف'
    }
  ],
  settings: {
    businessName: 'شرکت حمل و نقل سنگین البرز ترابر',
    managerName: 'مهندس صفدری کرمانی',
    phone: '09121111111',
    currency: 'تومان',
    cardAccountNumber: '۶۰۳۷-۹۹۷۹-۱۲۳۴-۵۶۷۸',
    cardHolderName: 'البرز ترابر صفدری',
    autoInvoicerDay: 5
  }
};
