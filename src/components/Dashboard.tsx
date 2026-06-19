/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  AlertCircle, 
  Bell, 
  Calendar, 
  CheckCircle2, 
  Truck, 
  FileText, 
  Send,
  PlusCircle,
  Clock,
  Phone,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { Driver, Invoice, Expense, AppSettings } from '../types';
import { 
  toPersianDigits, 
  formatCurrency, 
  getPersianToday, 
  getCurrentPersianMonthName,
  getMonthNameByOffset 
} from '../utils';

interface DashboardProps {
  drivers: Driver[];
  invoices: Invoice[];
  expenses: Expense[];
  settings: AppSettings;
  onNavigate: (tab: string) => void;
  onAddDriver: () => void;
  onSettleInvoice: (invoiceId: string, method: string, date?: string, amount?: number) => void;
  onAddInvoice: (invoice: Invoice) => void;
}

export default function Dashboard({
  drivers,
  invoices,
  expenses,
  settings,
  onNavigate,
  onAddDriver,
  onSettleInvoice,
  onAddInvoice,
}: DashboardProps) {
  const persianToday = useMemo(() => getPersianToday(), []);
  const [selectedBillingDay, setSelectedBillingDay] = useState<number>(persianToday.day);

  // States for searchable manual invoice modal on dashboard
  const [showManualInvoiceModal, setShowManualInvoiceModal] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [manualInvoiceAmount, setManualInvoiceAmount] = useState('');
  const [manualInvoicePeriod, setManualInvoicePeriod] = useState('');
  const [manualInvoiceYear, setManualInvoiceYear] = useState(() => getPersianToday().year.toString());
  const [manualInvoiceMonth, setManualInvoiceMonth] = useState(() => getPersianToday().month.toString().padStart(2, '0'));
  const [manualInvoiceDay, setManualInvoiceDay] = useState(() => getPersianToday().day.toString().padStart(2, '0'));
  const [driverSearchQuery, setDriverSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [isDriverSelectorOpen, setIsDriverSelectorOpen] = useState(false);
  const driverDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (driverDropdownRef.current && !driverDropdownRef.current.contains(event.target as Node)) {
        setIsDriverSelectorOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const yearsList = useMemo(() => {
    const cy = getPersianToday().year;
    return Array.from({ length: 11 }, (_, i) => cy - 5 + i);
  }, []);

  const currentMonthName = useMemo(() => getCurrentPersianMonthName(), []);
  const previousMonthName = useMemo(() => getMonthNameByOffset(-1), []);

  // 1. Calculations for CURRENT month ("خرداد ۱۴۰۵" or whatever current month name is)
  const stats = useMemo(() => {
    // Current month paid invoices
    const currentPaidInvoices = invoices.filter(
      (inv) => inv.period === currentMonthName && inv.status === 'paid'
    );
    const currentMonthIncome = currentPaidInvoices.reduce((sum, inv) => sum + inv.amount, 0);

    // Current month pending/overdue invoices
    const currentPendingInvoices = invoices.filter(
      (inv) => inv.period === currentMonthName && (inv.status === 'pending' || inv.status === 'overdue')
    );
    const currentMonthExpectedIncomes = currentPendingInvoices.reduce((sum, inv) => sum + inv.amount, 0);

    // Current month expenses (matched by date string "1405/03/xx")
    const pToday = getPersianToday();
    const currentMonthPrefix = `${pToday.year}/${pToday.month.toString().padStart(2, '0')}`;
    const currentMonthExpenses = expenses
      .filter((exp) => exp.date.startsWith(currentMonthPrefix))
      .reduce((sum, exp) => sum + exp.amount, 0);

    const netProfit = currentMonthIncome - currentMonthExpenses;

    // Total active drivers
    const activeDrivers = drivers;
    
    // Un-invoiced drivers for CURRENT month
    const uninvoicedDrivers = activeDrivers.filter((driver) => {
      return !invoices.some((inv) => inv.driverId === driver.id && inv.period === currentMonthName);
    });

    return {
      income: currentMonthIncome,
      expectedIncome: currentMonthExpectedIncomes,
      expenses: currentMonthExpenses,
      profit: netProfit,
      totalDrivers: drivers.length,
      activeDriversCount: activeDrivers.length,
      uninvoicedCount: uninvoicedDrivers.length,
      uninvoicedItems: uninvoicedDrivers,
    };
  }, [drivers, invoices, expenses, currentMonthName]);

  // 2. Compute Due dates reminders for the selected day specifically
  const remindersForSelectedDay = useMemo(() => {
    const activeDriversOfSelectedDay = drivers.filter(
      (d) => d.billingDay === selectedBillingDay
    );
    
    return activeDriversOfSelectedDay.map((driver) => {
      const pendingInvoices = invoices.filter(
        (inv) => inv.driverId === driver.id && inv.status !== 'paid'
      );
      const rawDebt = pendingInvoices.reduce((sum, inv) => sum + inv.amount, 0);
      const credit = driver.creditBalance || 0;
      const totalDebt = Math.max(0, rawDebt - credit);
      return {
        driver,
        totalDebt,
        pendingInvoices,
      };
    });
  }, [drivers, invoices, selectedBillingDay]);

  // Generate SMS reminder text
  const handleCopyReminder = (driverName: string, amount: number, billingDay: number) => {
    const text = `جناب آقای ${driverName} عزیز سلام.\nبا احترام، سررسید واریز شهریه ماهانه عضویت شما مورخ ${toPersianDigits(billingDay)} خرداد می‌باشد. مبلغ: ${formatCurrency(amount, settings.currency)}.\nشماره کارت جهت واریز:\n${settings.cardAccountNumber}\nبه نام: ${settings.cardHolderName}\nبا تشکر - ${settings.businessName}`;
    try {
      navigator.clipboard.writeText(text);
    } catch (err) {
      console.log('Clipboard copy failed, using fallback', err);
    }
    setToastMessage('متن یادآور با موفقیت کپی شد!');
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Modern SVG Trend Chart calculations (Incomes vs Expenses for the last 3 months)
  const chartData = useMemo(() => {
    const months = [
      getMonthNameByOffset(-2),
      getMonthNameByOffset(-1),
      currentMonthName
    ];

    return months.map((m, i) => {
      // Income in month m
      const inc = invoices
        .filter((inv) => inv.period === m && inv.status === 'paid')
        .reduce((sum, inv) => sum + inv.amount, 0);
      
      // Expense in month m
      let exp = 0;
      if (i === 2) {
        // Current month expense
        const currentMonthPrefix = `${persianToday.year}/${persianToday.month.toString().padStart(2, '0')}`;
        exp = expenses
          .filter((e) => e.date.startsWith(currentMonthPrefix))
          .reduce((sum, e) => sum + e.amount, 0);
      } else if (i === 1) {
        // Prev month
        let prevMonthNum = persianToday.month - 1;
        let prevYear = persianToday.year;
        if (prevMonthNum === 0) {
          prevMonthNum = 12;
          prevYear -= 1;
        }
        const prefix = `${prevYear}/${prevMonthNum.toString().padStart(2, '0')}`;
        exp = expenses
          .filter((e) => e.date.startsWith(prefix))
          .reduce((sum, e) => sum + e.amount, 0);
      } else {
        // 2 months ago
        let prev2MonthNum = persianToday.month - 2;
        let prevYear = persianToday.year;
        if (prev2MonthNum <= 0) {
          prev2MonthNum += 12;
          prevYear -= 1;
        }
        const prefix = `${prevYear}/${prev2MonthNum.toString().padStart(2, '0')}`;
        exp = expenses
          .filter((e) => e.date.startsWith(prefix))
          .reduce((sum, e) => sum + e.amount, 0);
      }

      return { month: m, income: inc, expense: exp };
    });
  }, [invoices, expenses, currentMonthName, persianToday]);

  // Calculations for total debt across all periods
  const totalAllDebt = useMemo(() => {
    const rawDebt = invoices
      .filter((inv) => inv.status !== 'paid')
      .reduce((sum, inv) => sum + inv.amount, 0);
    const totalCredit = drivers.reduce((sum, d) => sum + (d.creditBalance || 0), 0);
    return Math.max(0, rawDebt - totalCredit);
  }, [invoices, drivers]);

  // Calculations for paid invoices this period
  const totalPaidThisMonth = useMemo(() => {
    return invoices
      .filter((inv) => inv.period === currentMonthName && inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.amount, 0);
  }, [invoices, currentMonthName]);

  const filteredDriversForModal = useMemo(() => {
    return drivers.filter((drv) =>
      drv.name.toLowerCase().includes(driverSearchQuery.toLowerCase()) ||
      drv.truckModel.toLowerCase().includes(driverSearchQuery.toLowerCase())
    );
  }, [drivers, driverSearchQuery]);

  const handleSaveDashboardManualInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriverId) {
      setToastMessage('لطفاً یک راننده را انتخاب کنید.');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    const driver = drivers.find((d) => d.id === selectedDriverId);
    if (!driver) return;

    const today = getPersianToday();
    const issueDateStr = `${manualInvoiceYear}/${manualInvoiceMonth.padStart(2, '0')}/${manualInvoiceDay.padStart(2, '0')}`;
    
    let dueYear = parseInt(manualInvoiceYear, 10) || today.year;
    let dueMonth = parseInt(manualInvoiceMonth, 10) || today.month;
    let dueDay = (parseInt(manualInvoiceDay, 10) || today.day) + 5;

    if (dueDay > 30) {
      dueDay = dueDay - 30;
      dueMonth += 1;
      if (dueMonth > 12) {
        dueMonth = 1;
        dueYear += 1;
      }
    }
    const pad = (n: number) => n.toString().padStart(2, '0');
    const formattedDueDate = `${dueYear}/${pad(dueMonth)}/${pad(dueDay)}`;

    const newInvoice: Invoice = {
      id: `inv-manual-dash-${Date.now()}`,
      driverId: driver.id,
      driverName: driver.name,
      driverPhone: driver.phone,
      amount: parseFloat(manualInvoiceAmount.replace(/[^0-9]/g, '')) || 0,
      period: manualInvoicePeriod || 'فاکتور متفرقه',
      issueDate: issueDateStr,
      dueDate: formattedDueDate,
      status: 'pending',
    };

    onAddInvoice(newInvoice);
    setShowManualInvoiceModal(false);
    setSelectedDriverId('');
    setManualInvoiceAmount('');
    setManualInvoicePeriod('');
    setManualInvoiceYear('');
    setManualInvoiceMonth('');
    setManualInvoiceDay('');
    setDriverSearchQuery('');
    setToastMessage('فاکتور دستی برای راننده با موفقیت صادر شد.');
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handlePrevDay = () => {
    setSelectedBillingDay((prev) => (prev === 1 ? 31 : prev - 1));
  };

  const handleNextDay = () => {
    setSelectedBillingDay((prev) => (prev === 31 ? 1 : prev + 1));
  };

  return (
    <div className="space-y-6 text-right px-1 pb-20 select-none" dir="rtl" id="dashboard-container">


      {/* 2. Sleek Metrics Grid - AS DETAILED IN DESIGN HTML */}
      <div className="grid grid-cols-2 gap-4" id="stats-grid">
        {/* Card: تعداد رانندگان */}
        <div 
          className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm flex flex-col justify-between gap-3 text-center"
          id="stat-drivers-card"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-slate-400 text-xs font-bold">تعداد رانندگان</span>
            <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100/40">
              <Users className="h-4.5 w-4.5 text-blue-600" />
            </div>
          </div>
          <div className="flex items-baseline justify-center gap-1 w-full text-center">
            <span className="text-2xl sm:text-3xl font-extrabold text-blue-700 tracking-tight">
              {toPersianDigits(drivers.length)}
            </span>
            <span className="text-[10px] font-black text-slate-400">نفر</span>
          </div>
        </div>

        {/* Card: جمع بدهی (تومان) - Improved Layout & styling */}
        <div 
          className="bg-white p-5 rounded-[24px] border border-rose-100/80 shadow-sm flex flex-col justify-between gap-3 hover:border-rose-200 transition-all duration-150 text-center"
          id="stat-debt-card"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-slate-400 text-xs font-bold">جمع بدهی (تومان)</span>
            <div className="w-9 h-9 rounded-full bg-rose-50 flex items-center justify-center border border-rose-100/50">
              <TrendingDown className="h-4.5 w-4.5 text-rose-500" />
            </div>
          </div>
          <div className="flex items-baseline justify-center gap-1 w-full text-center overflow-hidden">
            <span className="text-[17px] sm:text-[21px] md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-rose-500 tracking-normal hover:scale-105 transition-transform duration-150 truncate max-w-full">
              {totalAllDebt > 0 ? toPersianDigits(totalAllDebt.toLocaleString('fa-IR')) : '۰'}
            </span>
          </div>
        </div>

        {/* Card: جمع واریزی این ماه (تومان) (Full Width) */}
        <div 
          className="col-span-2 bg-white p-5 rounded-[24px] border border-emerald-100 shadow-sm flex flex-col justify-between gap-3 hover:border-emerald-200 transition-all duration-150 text-center"
          id="stat-income-card"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-slate-400 text-xs font-bold">جمع واریزی این ماه (تومان)</span>
            <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100/40">
              <TrendingUp className="h-4.5 w-4.5 text-emerald-600" />
            </div>
          </div>
          <div className="flex items-baseline justify-center gap-1 w-full text-center">
            <span className="text-[20px] sm:text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 tracking-normal hover:scale-102 transition-transform duration-150">
              {totalPaidThisMonth > 0 ? toPersianDigits(totalPaidThisMonth.toLocaleString('fa-IR')) : '۰'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Action Buttons - 2 Columns */}
      <div className="grid grid-cols-2 gap-3" id="quick-actions-row">
        <button
          onClick={onAddDriver}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm py-3.5 px-4 rounded-[18px] flex items-center justify-center gap-2 shadow-md shadow-blue-200 transition-all cursor-pointer"
        >
          <PlusCircle className="h-4 w-4" />
          <span>افزودن راننده</span>
        </button>
        <button
          onClick={() => {
            setManualInvoicePeriod('');
            setManualInvoiceAmount('');
            const today = getPersianToday();
            setManualInvoiceYear(today.year.toString());
            setManualInvoiceMonth(today.month.toString().padStart(2, '0'));
            setManualInvoiceDay(today.day.toString().padStart(2, '0'));
            setSelectedDriverId('');
            setDriverSearchQuery('');
            setShowManualInvoiceModal(true);
          }}
          className="w-full bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-sm py-3.5 px-4 rounded-[18px] flex items-center justify-center gap-2 shadow-md shadow-slate-200 transition-all cursor-pointer"
        >
          <FileText className="h-4 w-4 text-blue-400" />
          <span>صدور فاکتور</span>
        </button>
      </div>

      {/* 4. "سررسیدهای امروز" Section with Day Navigation & Sequential Row List */}
      <div className="space-y-3.5" id="today-due-section">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
            <Calendar className="h-4.5 w-4.5 text-blue-600" />
            <span>سررسیدهای روز {toPersianDigits(selectedBillingDay)}م هر ماه</span>
            {selectedBillingDay === persianToday.day && (
              <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-2.2 py-0.5 rounded-full">امروز</span>
            )}
          </h2>
          
          <div className="flex items-center gap-1.5">
            {selectedBillingDay !== persianToday.day && (
              <button
                onClick={() => setSelectedBillingDay(persianToday.day)}
                className="text-[10px] font-black text-blue-600 hover:text-blue-700 bg-blue-50/70 px-2 py-1 rounded-lg transition-colors cursor-pointer"
              >
                امروز
              </button>
            )}
            <div className="flex items-center gap-1">
              <button 
                onClick={handlePrevDay}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
                title="روز قبل"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button 
                onClick={handleNextDay}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
                title="روز بعد"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {remindersForSelectedDay.length === 0 ? (
          <div className="p-6 bg-white rounded-[24px] border border-slate-100 inline-block w-full text-slate-400 font-bold text-xs text-center">
            در روز {toPersianDigits(selectedBillingDay)}م ماه هیچ سررسیدی ثبت نشده است.
          </div>
        ) : (
          <div className="flex flex-col gap-3" id="reminders-list">
            {remindersForSelectedDay.map((item) => (
              <div 
                key={item.driver.id}
                className="bg-white border border-slate-100 rounded-[20px] p-4 flex flex-col justify-between transition-colors shadow-xs w-full h-[120px] hover:border-slate-200"
              >
                {/* Top: Driver name & status */}
                <div className="flex items-center justify-between w-full">
                  <div className="text-xs font-black text-slate-800 flex items-center gap-1.5 truncate max-w-[130px]">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${item.totalDebt > 0 ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                    <span className="truncate">{item.driver.name}</span>
                  </div>
                  <div className="text-left select-none shrink-0">
                    {item.totalDebt > 0 ? (
                      <span className="text-[10px] font-black text-rose-500 bg-rose-50 border border-rose-100/40 px-2 py-0.5 rounded-md">
                        {toPersianDigits(item.totalDebt.toLocaleString('fa-IR'))} ت
                      </span>
                    ) : (
                      <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">
                        تسویه شده
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom: quick actions */}
                <div className="flex items-center justify-between border-t border-slate-50 pt-2 w-full">
                  <span className="text-[10px] font-bold text-slate-400">سررسید: {toPersianDigits(selectedBillingDay)}م</span>
                  <div className="flex items-center gap-2">
                    {item.totalDebt > 0 && (
                      <button
                        onClick={() => handleCopyReminder(item.driver.name, item.totalDebt, item.driver.billingDay)}
                        className="w-8 h-8 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-600 flex items-center justify-center cursor-pointer transition-colors"
                        title="پیامک یادآور"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                      </button>
                    )}

                    <a
                      href={`tel:${item.driver.phone}`}
                      className="w-8 h-8 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center transition-colors"
                      title="تماس تلفنی"
                    >
                      <Phone className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manual Invoice issuing Modal (with driver Selection and Search capability) */}
      <AnimatePresence>
        {showManualInvoiceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[24px] w-full max-w-sm shadow-2xl p-6 space-y-4"
              dir="rtl"
            >
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <FileText className="h-4.5 w-4.5 text-blue-600" />
                صدور فاکتور دستی
              </h3>
              <form onSubmit={handleSaveDashboardManualInvoice} className="space-y-4 text-xs font-sans">
                {/* Unified Searchable Combobox for selecting driver */}
                <div className="space-y-1 relative" ref={driverDropdownRef}>
                  <label className="block text-slate-500 font-semibold text-right">انتخاب راننده <span className="text-rose-500">*</span></label>
                  
                  <div className="relative">
                    <input
                      type="text"
                      value={driverSearchQuery}
                      onChange={(e) => {
                        setDriverSearchQuery(e.target.value);
                        setIsDriverSelectorOpen(true);
                        // If they clear the text, clear the selection
                        if (e.target.value === '') {
                          setSelectedDriverId('');
                        }
                      }}
                      onFocus={() => setIsDriverSelectorOpen(true)}
                      placeholder="🔍 جستجو و انتخاب راننده..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs text-right font-bold text-slate-800 font-sans"
                      required
                    />
                    {selectedDriverId && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDriverId('');
                          setDriverSearchQuery('');
                          setIsDriverSelectorOpen(false);
                        }}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 cursor-pointer p-0.5"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {isDriverSelectorOpen && (
                    <div className="absolute z-[100] right-0 left-0 mt-1 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg divide-y divide-slate-100 font-sans text-xs">
                      {filteredDriversForModal.length === 0 ? (
                        <div className="p-3 text-center text-[10px] text-amber-600 font-bold">
                          راننده‌ای با این مشخصات یافت نشد.
                        </div>
                      ) : (
                        filteredDriversForModal.map((drv) => (
                          <div
                            key={drv.id}
                            onClick={() => {
                              setSelectedDriverId(drv.id);
                              setDriverSearchQuery(`${drv.name} (${drv.truckModel})`);
                              setManualInvoiceAmount(drv.monthlyFee.toLocaleString('en-US'));
                              setIsDriverSelectorOpen(false);
                            }}
                            className={`p-2.5 hover:bg-slate-50 cursor-pointer text-right flex items-center justify-between transition-all ${
                              selectedDriverId === drv.id ? 'bg-blue-50 text-blue-700 font-black' : 'text-slate-700'
                            }`}
                          >
                            <span>{drv.name} <span className="text-slate-400 font-normal">({drv.truckModel})</span></span>
                            {selectedDriverId === drv.id && (
                              <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Hidden input to ensure required validation falls back correctly */}
                  <input
                    type="hidden"
                    name="selectedDriverId"
                    value={selectedDriverId}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-400 font-semibold">عنوان فاکتور</label>
                  <input
                    type="text"
                    required
                    value={manualInvoicePeriod}
                    onChange={(e) => setManualInvoicePeriod(e.target.value)}
                    placeholder="مانند: فاکتور هزینه خدمات"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-slate-800 text-right font-sans"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-400 font-semibold">مبلغ فاکتور (تومان)</label>
                  <input
                    type="text"
                    required
                    value={manualInvoiceAmount}
                    onChange={(e) => {
                      const cleanVal = e.target.value.replace(/[^0-9]/g, '');
                      if (cleanVal === '') {
                        setManualInvoiceAmount('');
                      } else {
                        setManualInvoiceAmount(parseInt(cleanVal, 10).toLocaleString('en-US'));
                      }
                    }}
                    placeholder="مثال: ۴,۵۰۰,۰۰۰"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-left font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-400 font-semibold mb-1">تاریخ صدور</label>
                  <div className="grid grid-cols-3 gap-2" dir="rtl">
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-slate-400 block text-right font-bold">روز</span>
                      <select
                        value={manualInvoiceDay}
                        onChange={(e) => setManualInvoiceDay(e.target.value)}
                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-center font-bold text-slate-800"
                      >
                        {Array.from({ length: 31 }, (_, i) => {
                          const val = (i + 1).toString().padStart(2, '0');
                          return <option key={val} value={val}>{val}</option>;
                        })}
                      </select>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-slate-400 block text-right font-bold">ماه</span>
                      <select
                        value={manualInvoiceMonth}
                        onChange={(e) => setManualInvoiceMonth(e.target.value)}
                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-center font-bold text-slate-800"
                      >
                        {Array.from({ length: 12 }, (_, i) => {
                          const val = (i + 1).toString().padStart(2, '0');
                          return <option key={val} value={val}>{val}</option>;
                        })}
                      </select>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-slate-400 block text-right font-bold">سال</span>
                      <select
                        value={manualInvoiceYear}
                        onChange={(e) => setManualInvoiceYear(e.target.value)}
                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-center font-bold text-slate-800"
                      >
                        {yearsList.map((y) => (
                          <option key={y} value={String(y)}>
                            {toPersianDigits(y)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowManualInvoiceModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer font-medium font-sans"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer font-sans"
                  >
                    صدور فاکتور
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Modern Toast Notification Feedback */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-slate-800 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 font-sans text-xs font-bold animate-none"
            dir="rtl"
          >
            <div className="w-5 h-5 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center font-mono">
              ✓
            </div>
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
