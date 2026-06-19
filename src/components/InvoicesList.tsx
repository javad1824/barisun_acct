/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Printer, 
  Download, 
  Plus, 
  X, 
  Truck, 
  CreditCard, 
  Send,
  Sparkles,
  Info,
  Trash2
} from 'lucide-react';
import { Invoice, Driver, AppSettings } from '../types';
import { toPersianDigits, formatCurrency, getPersianToday, generateUUID, getCurrentPersianMonthName } from '../utils';

interface InvoicesListProps {
  invoices: Invoice[];
  drivers: Driver[];
  settings: AppSettings;
  onAddInvoice: (invoice: Invoice) => void;
  onSettleInvoice: (invoiceId: string, method: string) => void;
  onDeleteInvoice: (invoiceId: string) => void;
  onGenerateAutoInvoices: () => void;
}

export default function InvoicesList({
  invoices,
  drivers,
  settings,
  onAddInvoice,
  onSettleInvoice,
  onDeleteInvoice,
  onGenerateAutoInvoices,
}: InvoicesListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showAddManualModal, setShowAddManualModal] = useState(false);
  const [deleteConfirmInvoice, setDeleteConfirmInvoice] = useState<Invoice | null>(null);

  // Form states for manual invoice
  const [manualDriverId, setManualDriverId] = useState('');
  const [manualAmount, setManualAmount] = useState('');
  const [manualPeriod, setManualPeriod] = useState('');
  const [manualDaysLimit, setManualDaysLimit] = useState('5');
  const [manualNotes, setManualNotes] = useState('');

  const currentMonthName = useMemo(() => getCurrentPersianMonthName(), []);

  // Compute how many active drivers don't have invoices for CURRENT month
  const uninvoicedCount = useMemo(() => {
    const activeDrivers = drivers.filter(d => d.status === 'active');
    return activeDrivers.filter(driver => {
      return !invoices.some(inv => inv.driverId === driver.id && inv.period === currentMonthName);
    }).length;
  }, [drivers, invoices, currentMonthName]);

  // Filtering invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesSearch = 
        inv.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.period.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = 
        statusFilter === 'all' || 
        inv.status === statusFilter;

      return matchesSearch && matchesStatus;
    }).sort((a, b) => b.issueDate.localeCompare(a.issueDate)); // Newest first
  }, [invoices, searchTerm, statusFilter]);

  // Open manual billing
  const openManualModal = () => {
    setManualDriverId(drivers[0]?.id || '');
    setManualAmount('');
    setManualPeriod(currentMonthName);
    setManualDaysLimit('5');
    setManualNotes('');
    setShowAddManualModal(true);
  };

  // Submit manual billing
  const handleSaveManualInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualDriverId || !manualAmount || !manualPeriod) {
      alert('لطفاً راننده، مبلغ و دوره فاکتور را مشخص کنید.');
      return;
    }

    const driver = drivers.find((d) => d.id === manualDriverId);
    if (!driver) return;

    const today = getPersianToday();
    const amountNum = parseFloat(manualAmount.replace(/[^0-9]/g, '')) || 0;
    
    // Simple calculation for due date
    const limitDays = parseInt(manualDaysLimit, 10);
    let dueDay = today.day + limitDays;
    let dueMonth = today.month;
    let dueYear = today.year;
    
    if (dueDay > 30) {
      dueDay -= 30;
      dueMonth += 1;
      if (dueMonth > 12) {
        dueMonth = 1;
        dueYear += 1;
      }
    }

    const dueDateStr = `${dueYear}/${dueMonth.toString().padStart(2, '0')}/${dueDay.toString().padStart(2, '0')}`;

    const newInvoice: Invoice = {
      id: `inv-${generateUUID()}`,
      driverId: driver.id,
      driverName: driver.name,
      driverPhone: driver.phone,
      amount: amountNum,
      period: manualPeriod,
      issueDate: today.formatted,
      dueDate: dueDateStr,
      status: 'pending',
    };

    onAddInvoice(newInvoice);
    setShowAddManualModal(false);
  };

  const printableInvoiceRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = printableInvoiceRef.current?.innerHTML;
    if (!printContent) return;

    const originalContent = document.body.innerHTML;
    
    // Create print layout
    const printWindow = window.open('', '', 'height=600,width=800');
    if (printWindow) {
      printWindow.document.write('<html><head><title>چاپ رسید پرداخت و فاکتور</title>');
      printWindow.document.write('<style>');
      printWindow.document.write(`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
        body { font-family: sans-serif; direction: rtl; padding: 40px; color: #333; line-height: 1.6; }
        .invoice-box { border: 1px solid #eee; box-shadow: 0 0 10px rgba(0,0,0,.05); max-width: 800px; margin: auto; padding: 30px; border-radius: 10px; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-left { text-align: left; }
        .flex { display: flex; }
        .justify-between { justify-content: space-between; }
        .items-center { align-items: center; }
        .grid { display: grid; }
        .grid-2 { grid-template-columns: 1fr 1fr; }
        .gap { gap: 20px; }
        .border-b { border-bottom: 2px solid #eee; padding-bottom: 15px; margin-bottom: 15px; }
        .font-bold { font-weight: bold; }
        .mono { font-family: monospace; }
        .mt-5 { margin-top: 20px; }
        .mb-5 { margin-bottom: 20px; }
        .p-4 { padding: 16px; }
        .bg-slate { bg-color: #f8fafc; background: #f8fafc; border-radius: 8px; }
        .badge { display: inline-block; padding: 4px 10px; border-radius: 4px; font-weight: bold; font-size: 11px; }
        .badge-paid { background: #d1fae5; color: #065f46; }
        .badge-pending { background: #fef3c7; color: #92400e; }
        .badge-overdue { background: #fee2e2; color: #991b1b; }
      `);
      printWindow.document.write('</style></head><body>');
      printWindow.document.write(printContent);
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  };

  const handleCopyInvoiceSms = (inv: Invoice) => {
    const text = `جناب آقای ${inv.driverName} عزیز.\nفاکتور شهریه دوره ${inv.period} برای شما صادر شد.\nمبلغ: ${formatCurrency(inv.amount, settings.currency)}\nسررسید پرداخت: ${toPersianDigits(inv.dueDate)}\nلطفا وجه را به کارت شماره:\n${settings.cardAccountNumber}\nبه نام ${settings.cardHolderName} واریز نموده و فیش ارسال فرمایید.\nممنون - شرکت البرز ترابر`;
    navigator.clipboard.writeText(text);
    alert('پیامک درخواست واریز در حافظه کپی شد!');
  };

  return (
    <div className="space-y-6 text-right" dir="rtl" id="invoices-view-container">
      {/* 1. Header & Quick Automatic Bill Summoner */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold font-sans text-slate-800">حساب‌ها و فاکتورهای صادره</h1>
        </div>
        <div className="flex gap-2">
          {uninvoicedCount > 0 && (
            <button
              onClick={onGenerateAutoInvoices}
              id="auto-invoice-action-inside"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-blue-250 shadow-xl cursor-pointer transition-all duration-200"
            >
              <Sparkles className="h-4 w-4" />
              صدور خودکار ({toPersianDigits(uninvoicedCount)} مورد)
            </button>
          )}
          <button
            onClick={openManualModal}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200/90 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Plus className="h-4.5 w-4.5 text-slate-605" />
            صدور فاکتور دستی
          </button>
        </div>
      </header>

      {/* 2. Unified Notification Banner for Billing */}
      {uninvoicedCount > 0 && (
        <div className="p-5 bg-blue-50/70 rounded-3xl border border-blue-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-blue-900 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <Info className="h-5 w-5 shrink-0" />
            </div>
            <p className="leading-relaxed font-medium">
              تعداد <b className="text-blue-950">{toPersianDigits(uninvoicedCount)} راننده فعال</b> در سیستم وجود دارند که فاکتور شهریه ماه جاری <span className="font-bold underline">({currentMonthName})</span> هنوز برایشان صادر نشده است. توصیه می‌شود صدور خودکار را بزنید.
            </p>
          </div>
          <button
            onClick={onGenerateAutoInvoices}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[11px] font-bold self-end sm:self-auto cursor-pointer transition-all shadow-md shadow-blue-200"
          >
            صدور گروهی فاکتور اکنون
          </button>
        </div>
      )}

      {/* 3. Filter Shelf */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 right-3 flex items-center pr-1 text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="جستجو بر اساس نام راننده، کد فاکتور یا دوره..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Status selection tab-bar wrapper */}
        <div className="flex gap-1.5 p-1 bg-slate-50 border border-slate-200 rounded-xl overflow-x-auto max-w-full">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer shrink-0 ${statusFilter === 'all' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
          >
            همه ({toPersianDigits(invoices.length)})
          </button>
          <button
            onClick={() => setStatusFilter('paid')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer shrink-0 ${statusFilter === 'paid' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
          >
            تسویه شده ({toPersianDigits(invoices.filter(i => i.status === 'paid').length)})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer shrink-0 ${statusFilter === 'pending' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
          >
            در انتظار ({toPersianDigits(invoices.filter(i => i.status === 'pending').length)})
          </button>
          <button
            onClick={() => setStatusFilter('overdue')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer shrink-0 ${statusFilter === 'overdue' ? 'bg-rose-600 text-white shadow-xs animate-pulse' : 'text-slate-500 hover:text-slate-800'}`}
          >
            معوقه ({toPersianDigits(invoices.filter(i => i.status === 'overdue').length)})
          </button>
        </div>
      </div>

      {/* 4. Invoices Responsive Showcase */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden" id="invoices-records-table">
        
        {/* Mobile View Card List (Optimized for small screens) */}
        <div className="block md:hidden divide-y divide-slate-100">
          {filteredInvoices.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <div className="flex flex-col items-center justify-center gap-3">
                <FileText className="h-10 w-10 text-slate-350" />
                <p className="font-semibold text-xs text-slate-500">هیچ فاکتور منطبقی در این دسته موجود نیست.</p>
              </div>
            </div>
          ) : (
            filteredInvoices.map((inv) => (
              <div 
                key={inv.id} 
                className="p-4 hover:bg-slate-50/50 cursor-pointer transition-colors space-y-3"
                onClick={() => setSelectedInvoice(inv)}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="text-[10px] text-slate-405 font-mono font-medium">شماره فاکتور: {toPersianDigits(inv.id)}</div>
                    <div className="font-extrabold text-slate-900 text-xs sm:text-sm">{inv.driverName}</div>
                    <div className="text-[10px] text-slate-500 font-semibold">دوره: {inv.period}</div>
                  </div>
                  <div className="text-left space-y-1.5">
                    <div className="font-mono font-bold text-slate-800 text-xs sm:text-sm">
                      {formatCurrency(inv.amount, settings.currency)}
                    </div>
                    <div>
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-extrabold ${
                        inv.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        inv.status === 'overdue' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                        'bg-amber-50 text-amber-700 border border-amber-100'
                      }`}>
                        {inv.status === 'paid' ? 'تسویه شده' : inv.status === 'overdue' ? 'معوقه پرداخت' : 'در انتظار واریز'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[9px] text-slate-400 border-t border-slate-100/50 pt-2 font-mono">
                  <span>تاریخ صدور: {toPersianDigits(inv.issueDate)}</span>
                  <span>حداکثر مهلت: {toPersianDigits(inv.dueDate)}</span>
                </div>

                <div className="flex items-center justify-end gap-1.5 pt-1" onClick={(e) => e.stopPropagation()}>
                  {inv.status !== 'paid' && (
                    <button
                      onClick={() => onSettleInvoice(inv.id, 'کارت به کارت')}
                      className="bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-[10px] cursor-pointer shadow-sm"
                    >
                      تسویه سریع
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedInvoice(inv)}
                    className="px-2.5 py-1.5 text-slate-700 hover:text-slate-900 rounded-xl border border-slate-200 bg-slate-50 text-[10px] font-bold cursor-pointer"
                  >
                    نمایش فاکتور
                  </button>
                  <button
                    onClick={() => handleCopyInvoiceSms(inv)}
                    title="کپی پیامک فاکتور"
                    className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-100/50 rounded-xl border border-slate-200 cursor-pointer"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setDeleteConfirmInvoice(inv);
                    }}
                    title="حذف فاکتور"
                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-100/55 rounded-xl border border-slate-200 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View Table (Hidden on small mobile devices) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-xs text-right text-slate-600">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                <th className="p-4">شماره فاکتور</th>
                <th className="p-4">نام راننده</th>
                <th className="p-4">دوره ماهانه</th>
                <th className="p-4">مبلغ فاکتور</th>
                <th className="p-4">تاریخ صدور</th>
                <th className="p-4">حداکثر مهلت</th>
                <th className="p-4">وضعیت</th>
                <th className="p-4 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <FileText className="h-10 w-10 text-slate-300" />
                      <p className="font-semibold text-xs text-slate-500">هیچ فاکتور منطبقی در این دسته موجود نیست.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr 
                    key={inv.id} 
                    className="border-b border-slate-100/70 hover:bg-slate-50/50 cursor-pointer transition-colors"
                    onClick={() => setSelectedInvoice(inv)}
                  >
                    <td className="p-4 font-mono font-semibold text-slate-800">{toPersianDigits(inv.id)}</td>
                    <td className="p-4 font-bold text-slate-800">{inv.driverName}</td>
                    <td className="p-4 font-medium text-slate-600">{inv.period}</td>
                    <td className="p-4 font-mono font-bold text-slate-800">{formatCurrency(inv.amount, settings.currency)}</td>
                    <td className="p-4 font-mono text-slate-500">{toPersianDigits(inv.issueDate)}</td>
                    <td className="p-4 font-mono text-slate-550">{toPersianDigits(inv.dueDate)}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                        inv.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        inv.status === 'overdue' ? 'bg-rose-50 text-rose-750 border border-rose-100 font-extrabold animate-pulse' :
                        'bg-amber-50 text-amber-700 border border-amber-100'
                      }`}>
                        {inv.status === 'paid' ? 'تسویه شده' : inv.status === 'overdue' ? 'معوقه پرداخت' : 'در انتظار واریز'}
                      </span>
                    </td>
                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2">
                        {inv.status !== 'paid' && (
                          <button
                            onClick={() => onSettleInvoice(inv.id, 'کارت به کارت')}
                            className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-[11px]"
                          >
                            تسویه
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="px-2.5 py-1 text-slate-600 hover:text-slate-800 rounded-lg border border-slate-200 bg-slate-50 font-medium transition-colors cursor-pointer text-[11px]"
                        >
                          مشاهده فاکتور
                        </button>
                        <button
                          onClick={() => handleCopyInvoiceSms(inv)}
                          title="کپی پیامک فاکتور"
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg border border-slate-200 cursor-pointer"
                        >
                          <Send className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setDeleteConfirmInvoice(inv);
                          }}
                          title="حذف فاکتور"
                          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. MANUAL INVOICING MODAL */}
      <AnimatePresence>
        {showAddManualModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col"
              dir="rtl"
            >
              {/* Head */}
              <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-400" />
                  <h3 className="text-sm font-bold">صدور فاکتور و رسید دستی</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddManualModal(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer animate-pulse"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSaveManualInvoice} className="p-6 space-y-4 text-xs">
                {/* Select Driver */}
                <div className="space-y-1">
                  <label className="block text-slate-500 font-semibold">انتخاب راننده مقصد <span className="text-rose-500">*</span></label>
                  <select
                    value={manualDriverId}
                    onChange={(e) => {
                      setManualDriverId(e.target.value);
                      const drv = drivers.find(d => d.id === e.target.value);
                      if (drv) {
                        setManualAmount(drv.monthlyFee.toString());
                      }
                    }}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs font-semibold"
                  >
                    <option value="" disabled>راننده را انتخاب کنید...</option>
                    {drivers.map(drv => (
                      <option key={drv.id} value={drv.id}>
                        {drv.name} ({drv.truckModel})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amount */}
                <div className="space-y-1">
                  <label className="block text-slate-500 font-semibold">مبلغ فاکتور (تومان) <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={manualAmount}
                    onChange={(e) => {
                      const cleanVal = e.target.value.replace(/[^0-9]/g, '');
                      if (cleanVal === '') {
                        setManualAmount('');
                      } else {
                        setManualAmount(parseInt(cleanVal, 10).toLocaleString('en-US'));
                      }
                    }}
                    placeholder="مانند: ۴,۵۰۰,۰۰۰"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-left font-bold"
                  />
                </div>

                {/* Period Month */}
                <div className="space-y-1">
                  <label className="block text-slate-500 font-semibold">عنوان فاکتور <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={manualPeriod}
                    onChange={(e) => setManualPeriod(e.target.value)}
                    placeholder="مانند: خرداد ۱۴۰۵"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* Days Limit */}
                <div className="space-y-1">
                  <label className="block text-slate-500 font-semibold">مهلت پرداخت پس از تاریخ صدور (روز)</label>
                  <select
                    value={manualDaysLimit}
                    onChange={(e) => setManualDaysLimit(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  >
                    <option value="3">۳ روز</option>
                    <option value="5">۵ روز</option>
                    <option value="10">۱۰ روز</option>
                    <option value="15">۱۵ روز</option>
                  </select>
                </div>

                {/* Notes */}
                <div className="space-y-1">
                  <label className="block text-slate-500 font-semibold">توضیحات فاکتور</label>
                  <textarea
                    value={manualNotes}
                    onChange={(e) => setManualNotes(e.target.value)}
                    placeholder="توضیحات اضافی مانند خدمات مربوطه، هزینه بارگیری کمکی و غیره..."
                    rows={2}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-slate-100 flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowAddManualModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-750 font-medium rounded-xl cursor-pointer"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold cursor-pointer"
                  >
                    صدور فاکتور
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. BEAUTIFUL TRUCKING COMMERCIAL RECEIPT INVOICE DRAWER */}
      <AnimatePresence>
        {selectedInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <div className="absolute inset-0" onClick={() => setSelectedInvoice(null)}></div>
            
            {/* Invoice Container Panel */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl relative z-10 flex flex-col overflow-hidden max-h-[92vh]"
              dir="rtl"
            >
              {/* Modal Buttons Toolbar */}
              <div className="bg-slate-900 p-4 text-white flex items-center justify-between no-print">
                <span className="text-xs font-bold font-sans">فاکتور ردیف سررسید شهریه رانندگان</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrint}
                    className="p-1 px-3 bg-slate-800 hover:bg-slate-700 hover:text-emerald-400 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Printer className="h-4 w-4" />
                    چاپ / دانلود PDF
                  </button>
                  <button
                    onClick={() => setSelectedInvoice(null)}
                    className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg cursor-pointer"
                  >
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>

              {/* Printable Body Wrap */}
              <div className="p-6 md:p-8 overflow-y-auto flex-1 bg-white" ref={printableInvoiceRef} id="printable-invoice">
                <div className="invoice-box border border-slate-150 p-6 rounded-2xl space-y-6 max-w-xl mx-auto">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b-2 border-slate-100 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-slate-950 text-emerald-400 rounded-2xl shadow-xl flex items-center justify-center">
                        <Truck className="h-8 w-8 text-emerald-400" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-slate-900">{settings.businessName}</h2>
                        <span className="text-[10px] text-slate-500">سامانه حسابداری و خدمات باربری کل کشور</span>
                      </div>
                    </div>
                    <div className="text-right sm:text-left text-xs text-slate-500 font-mono space-y-1">
                      <div>شماره فاکتور: <b className="text-slate-800">{toPersianDigits(selectedInvoice.id)}</b></div>
                      <div>تاریخ صدور: <span>{toPersianDigits(selectedInvoice.issueDate)}</span></div>
                      <div>مهلت پرداخت: <span className="text-rose-600 font-bold">{toPersianDigits(selectedInvoice.dueDate)}</span></div>
                    </div>
                  </div>

                  {/* Status ribbon block */}
                  <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
                    selectedInvoice.status === 'paid' ? 'bg-emerald-50 text-emerald-800 border-emerald-250' :
                    selectedInvoice.status === 'overdue' ? 'bg-rose-50 text-rose-800 border-rose-250 font-extrabold animate-pulse' :
                    'bg-amber-50 text-amber-800 border-amber-250'
                  }`}>
                    <div className="flex items-center gap-1.5">
                      {selectedInvoice.status === 'paid' ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Clock className="h-4 w-4 text-amber-500" />}
                      <span>وضعیت تسویه این فاکتور:</span>
                    </div>
                    <span className="font-extrabold text-[13px]">
                      {selectedInvoice.status === 'paid' ? 'پرداخت و تسویه موفق' : selectedInvoice.status === 'overdue' ? 'معوقه پرداخت مشتری' : 'در انتظار واریز فیش'}
                    </span>
                  </div>

                  {/* Customer / Driver Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="space-y-1">
                      <div className="text-slate-400 font-medium">مشخصات راننده کامیون:</div>
                      <div className="font-bold text-slate-800">{selectedInvoice.driverName}</div>
                      <div className="font-mono text-slate-500">{toPersianDigits(selectedInvoice.driverPhone)}</div>
                    </div>
                    <div className="space-y-1 sm:text-left">
                      <div className="text-slate-400 font-medium text-right sm:text-left">مدیر حسابداری باربری:</div>
                      <div className="font-bold text-slate-800 text-right sm:text-left">{settings.managerName}</div>
                      <div className="font-mono text-slate-500 text-right sm:text-left">{toPersianDigits(settings.phone)}</div>
                    </div>
                  </div>

                  {/* Items list / billing row */}
                  <div className="border border-slate-100 rounded-xl overflow-hidden text-xs">
                    <div className="grid grid-cols-12 bg-slate-100 p-2.5 font-bold text-slate-700">
                      <div className="col-span-8">شرح خدمات و بابت عضویت</div>
                      <div className="col-span-4 text-left">مبلغ کل</div>
                    </div>
                    <div className="grid grid-cols-12 p-3 border-b border-slate-50 last:border-0">
                      <div className="col-span-8 space-y-1">
                        <div className="font-semibold text-slate-850">شارژ ماهیانه و هزینه عضویت ناوگان حمل بار</div>
                        <div className="text-[10px] text-slate-400 leading-normal">
                          مربوط به دوره بابت ماه <b>{selectedInvoice.period}</b> جهت هماهنگی باربرها در پایانه‌ها، صدور بارنامه الکترونیکی و استفاده از پارکینگ ترابر.
                        </div>
                      </div>
                      <div className="col-span-4 text-left font-mono font-bold text-slate-800 self-center">
                        {formatCurrency(selectedInvoice.amount, '')}
                      </div>
                    </div>
                  </div>

                  {/* Total Amount block */}
                  <div className="flex justify-between items-center text-xs border-t-2 border-slate-100 pt-4">
                    <span className="font-bold text-slate-700">مجموع کل قابل تسویه:</span>
                    <span className="text-[16px] font-extrabold text-slate-900 font-mono">
                      {formatCurrency(selectedInvoice.amount, settings.currency)}
                    </span>
                  </div>

                  {/* Card Number block for outstanding invoices */}
                  {selectedInvoice.status !== 'paid' && (
                    <div className="bg-amber-50/50 p-4 rounded-xl border border-dashed border-amber-300 text-xs space-y-2">
                      <div className="font-bold text-amber-800 flex items-center gap-1">
                        <CreditCard className="h-4 w-4" />
                        راهنمای پرداخت واریز:
                      </div>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        خواهشمند است مبلغ فوق را به کارت بازرگانی باربری واریز نمود�               {/* Action and Checkout Footer (only in modal view, not printed) */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2 justify-end no-print">
                {selectedInvoice.status !== 'paid' && (
                  <button
                    onClick={() => {
                      onSettleInvoice(selectedInvoice.id, 'کارت به کارت');
                      setSelectedInvoice(prev => prev ? { ...prev, status: 'paid', paymentDate: getPersianToday().formatted, paymentMethod: 'کارت به کارت' } : null);
                    }}
                    className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs cursor-pointer transition-colors"
                  >
                    تسویه فوری فاکتور به صورت کارت‌به‌کارت
                  </button>
                )}
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  بستن پیش‌نمایش
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Confirmation Modal for Deleting Invoice */}
      <AnimatePresence>
        {deleteConfirmInvoice && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 no-print">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 shadow-2xl rounded-2xl p-6 max-w-sm w-full text-right font-sans relative"
              dir="rtl"
            >
              <div className="flex items-center gap-3 text-rose-600 mb-4 justify-start">
                <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                  <Trash2 className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-black text-slate-800">حذف فاکتور</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-6 font-medium">
                آیا از حذف فاکتور شماره <span className="font-mono font-bold text-slate-900">{toPersianDigits(deleteConfirmInvoice.id)}</span> مربوط به راننده <span className="font-bold text-slate-950">«{deleteConfirmInvoice.driverName}»</span> دوره <span className="font-bold text-slate-950">{deleteConfirmInvoice.period}</span> اطمینان دارید؟ این عمل غیرقابل بازگشت است.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmInvoice(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer font-bold text-xs"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteInvoice(deleteConfirmInvoice.id);
                    setDeleteConfirmInvoice(null);
                  }}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-750 text-white rounded-xl font-bold cursor-pointer text-xs"
                >
                  حذف قطعی
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div> <div>مهر و امضای امور مالی باربری</div>
                      <div className="text-[10px] font-mono">{toPersianDigits(getPersianToday().formatted)}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action and Checkout Footer (only in modal view, not printed) */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2 justify-end no-print">
                {selectedInvoice.status !== 'paid' && (
                  <button
                    onClick={() => {
                      onSettleInvoice(selectedInvoice.id, 'کارت به کارت');
                      setSelectedInvoice(prev => prev ? { ...prev, status: 'paid', paymentDate: getPersianToday().formatted, paymentMethod: 'کارت به کارت' } : null);
                    }}
                    className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs cursor-pointer transition-colors"
                  >
                    تسویه فوری فاکتور به صورت کارت‌به‌کارت
                  </button>
                )}
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  بستن پیش‌نمایش
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
