/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  MapPin, 
  Phone, 
  Calendar, 
  Truck, 
  User, 
  FileText, 
  Edit3, 
  Trash2, 
  X, 
  AlertCircle,
  CreditCard,
  UserCheck,
  Briefcase,
  ArrowRight
} from 'lucide-react';
import { Driver, Invoice, AppSettings } from '../types';
import { toPersianDigits, formatCurrency, getPersianToday, generateUUID, getCurrentPersianMonthName } from '../utils';

const parsePersianDate = (dateStr: string) => {
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    return {
      year: parts[0],
      month: parts[1].padStart(2, '0'),
      day: parts[2].padStart(2, '0'),
    };
  }
  const today = getPersianToday();
  return {
    year: today.year.toString(),
    month: today.month.toString().padStart(2, '0'),
    day: today.day.toString().padStart(2, '0'),
  };
};

interface DriversListProps {
  drivers: Driver[];
  invoices: Invoice[];
  settings: AppSettings;
  onAddDriver: (driver: Driver) => void;
  onUpdateDriver: (driver: Driver) => void;
  onDeleteDriver: (id: string) => void;
  onAddInvoice: (invoice: Invoice) => void;
  onSettleInvoice: (invoiceId: string, method: string, date?: string, amount?: number) => void;
  onRegisterDeposit: (driverId: string, amount: number, date: string, description?: string) => void;
  initialOpenAddModal?: boolean;
  onResetInitialOpenAddModal?: () => void;
}

export default function DriversList({
  drivers,
  invoices,
  settings,
  onAddDriver,
  onUpdateDriver,
  onDeleteDriver,
  onAddInvoice,
  onSettleInvoice,
  onRegisterDeposit,
  initialOpenAddModal,
  onResetInitialOpenAddModal,
}: DriversListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [viewingDriverId, setViewingDriverId] = useState<string | null>(null);
  const viewingDriverProfile = useMemo(() => drivers.find(d => d.id === viewingDriverId) || null, [drivers, viewingDriverId]);
  const [activeProfileTab, setActiveProfileTab] = useState<'info' | 'transactions'>('info');

  const yearsList = useMemo(() => {
    const cy = getPersianToday().year;
    return Array.from({ length: 11 }, (_, i) => cy - 5 + i);
  }, []);

  // Copied alert Toast Message state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states for adding/editing
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formMonthlyFee, setFormMonthlyFee] = useState('');
  const [formTruckModel, setFormTruckModel] = useState('');
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');
  const [formNotes, setFormNotes] = useState('');
  const [formNationalId, setFormNationalId] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formLicenseExpiryDate, setFormLicenseExpiryDate] = useState('');
  const [formInvoiceStartPreference, setFormInvoiceStartPreference] = useState<'joinMonth' | 'nextMonth'>('joinMonth');

  // Date parts state (3 boxes for membership date)
  const [joinYear, setJoinYear] = useState('1405');
  const [joinMonth, setJoinMonth] = useState('01');
  const [joinDay, setJoinDay] = useState('10');

  // License Expiry date states (3 boxes)
  const [expiryYear, setExpiryYear] = useState('1406');
  const [expiryMonth, setExpiryMonth] = useState('01');
  const [expiryDay, setExpiryDay] = useState('01');

  // Iranian License Plate part states
  const [platePart1, setPlatePart1] = useState('12');
  const [plateLetter, setPlateLetter] = useState('ع');
  const [platePart2, setPlatePart2] = useState('345');
  const [plateIranCode, setPlateIranCode] = useState('22');

  // Deletion Confirm state
  const [deleteConfirmDriver, setDeleteConfirmDriver] = useState<{ id: string; name: string } | null>(null);

  // Modals for inline billing tools
  const [showManualInvoiceModal, setShowManualInvoiceModal] = useState<Driver | null>(null);
  const [manualInvoicePeriod, setManualInvoicePeriod] = useState('');
  const [manualInvoiceAmount, setManualInvoiceAmount] = useState('');
  const [manualInvoiceYear, setManualInvoiceYear] = useState(() => getPersianToday().year.toString());
  const [manualInvoiceMonth, setManualInvoiceMonth] = useState(() => getPersianToday().month.toString().padStart(2, '0'));
  const [manualInvoiceDay, setManualInvoiceDay] = useState(() => getPersianToday().day.toString().padStart(2, '0'));

  const [showRegisterDepositModal, setShowRegisterDepositModal] = useState<Driver | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositYear, setDepositYear] = useState(() => getPersianToday().year.toString());
  const [depositMonth, setDepositMonth] = useState(() => getPersianToday().month.toString().padStart(2, '0'));
  const [depositDay, setDepositDay] = useState(() => getPersianToday().day.toString().padStart(2, '0'));
  const [depositDescription, setDepositDescription] = useState('');

  // Handle auto-opening the add modal if initialOpenAddModal is passed
  React.useEffect(() => {
    if (initialOpenAddModal) {
      openAddModal();
      if (onResetInitialOpenAddModal) {
        onResetInitialOpenAddModal();
      }
    }
  }, [initialOpenAddModal]);

  // Extract all unique cities for filtering
  const uniqueCities = useMemo(() => {
    const cities = drivers.map((d) => d.city).filter(Boolean);
    return Array.from(new Set(cities));
  }, [drivers]);

  // Handle Search and Filters
  const filteredDrivers = useMemo(() => {
    return drivers.filter((driver) => {
      const matchSearch = 
        driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driver.phone.includes(searchTerm) ||
        driver.truckModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driver.city.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchCity = cityFilter === '' || driver.city === cityFilter;
      
      return matchSearch && matchCity;
    });
  }, [drivers, searchTerm, cityFilter]);

  // Helper to parse Iranian license plate
  const parsePlateStr = (plateStr: string) => {
    const cleanStr = (plateStr || '').trim();
    // Expected format: "12 ب 345 ایران 22"
    const regex = /^(\d{2})\s+([آ-یالف-ی])\s+(\d{3})\s+ایران\s+(\d{2})$/;
    const match = cleanStr.match(regex);
    if (match) {
      return {
        part1: match[1],
        letter: match[2],
        part2: match[3],
        iranCode: match[4]
      };
    }
    // Fallback if formatting was non-standard
    const nums = cleanStr.replace(/[^0-9]/g, ' ').trim().split(/\s+/).filter(Boolean);
    const letters = cleanStr.replace(/[0-9]/g, '').replace('ایران', '').trim();
    return {
      part1: nums[0] || '12',
      letter: letters ? letters.charAt(0) : 'ب',
      part2: nums[1] || '345',
      iranCode: nums[2] || '22'
    };
  };

  // Open modal for Adding
  const openAddModal = () => {
    const today = getPersianToday();
    setFormName('');
    setFormPhone('');
    setFormCity('');
    setFormMonthlyFee('');
    setFormTruckModel('');
    setFormStatus('active');
    setFormNotes('');
    setFormNationalId('');
    setFormUsername('');
    setFormPassword('');
    setFormLicenseExpiryDate('');
    setFormInvoiceStartPreference('joinMonth');

    // Date parts
    setJoinYear(today.year.toString());
    setJoinMonth(today.month.toString().padStart(2, '0'));
    setJoinDay(today.day.toString().padStart(2, '0'));

    // Expiry date parts
    setExpiryYear((today.year + 1).toString());
    setExpiryMonth(today.month.toString().padStart(2, '0'));
    setExpiryDay(today.day.toString().padStart(2, '0'));

    // Plate parts
    setPlatePart1('12');
    setPlateLetter('ع');
    setPlatePart2('345');
    setPlateIranCode('22');

    setEditingDriver(null);
    setShowAddModal(true);
  };

  // Open modal for Editing
  const openEditModal = (driver: Driver, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering open profile
    setEditingDriver(driver);
    setFormName(driver.name);
    setFormPhone(driver.phone);
    setFormCity(driver.city);
    setFormMonthlyFee(driver.monthlyFee.toString());
    setFormTruckModel(driver.truckModel);
    setFormStatus(driver.status);
    setFormNotes(driver.notes || '');
    setFormNationalId(driver.nationalId || '');
    setFormUsername(driver.username || '');
    setFormPassword(driver.password || '');
    setFormLicenseExpiryDate(driver.licenseExpiryDate || '');
    setFormInvoiceStartPreference(driver.invoiceStartPreference || 'joinMonth');

    // Parse dateparts
    const dateParts = driver.joinDate.split('/');
    setJoinYear(dateParts[0] || '1405');
    setJoinMonth((dateParts[1] || '01').padStart(2, '0'));
    setJoinDay((dateParts[2] || '01').padStart(2, '0'));

    // Parse expiry dateparts
    if (driver.licenseExpiryDate) {
      const expParts = driver.licenseExpiryDate.split('/');
      setExpiryYear(expParts[0] || '1406');
      setExpiryMonth((expParts[1] || '01').padStart(2, '0'));
      setExpiryDay((expParts[2] || '01').padStart(2, '0'));
    } else {
      setExpiryYear(String(parseInt(dateParts[0] || '1405', 10) + 1));
      setExpiryMonth('01');
      setExpiryDay('01');
    }

    // Parse plateparts
    const parsedPlate = parsePlateStr(driver.licensePlate);
    setPlatePart1(parsedPlate.part1);
    setPlateLetter(parsedPlate.letter);
    setPlatePart2(parsedPlate.part2);
    setPlateIranCode(parsedPlate.iranCode);

    setShowAddModal(true);
  };

  // Save Add/Edit Driver Form
  const handleSaveDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formPhone || !formMonthlyFee) {
      alert('لطفاً مشخصات اصلی شامل نام، شماره تلفن و هزینه ماهانه را پر کنید.');
      return;
    }

    const feeNum = parseFloat(formMonthlyFee.replace(/[^0-9]/g, '')) || 0;
    
    // Format join date and save billing day from the join day
    const formattedJoinDate = `${joinYear}/${joinMonth.padStart(2, '0')}/${joinDay.padStart(2, '0')}`;
    const billingDayNum = parseInt(joinDay, 10) || 10;
    const formattedLicensePlate = `${platePart1.trim()} ${plateLetter.trim()} ${platePart2.trim()} ایران ${plateIranCode.trim()}`;

    const data: Driver = {
      id: editingDriver ? editingDriver.id : `drv-${generateUUID()}`,
      name: formName,
      phone: formPhone,
      city: formCity || 'نامشخص',
      monthlyFee: feeNum,
      joinDate: editingDriver ? editingDriver.joinDate : formattedJoinDate,
      truckModel: formTruckModel || 'نامشخص',
      licensePlate: formattedLicensePlate,
      status: formStatus,
      billingDay: editingDriver ? (editingDriver.billingDay || 10) : billingDayNum,
      notes: formNotes,
      nationalId: formNationalId,
      username: formUsername,
      password: formPassword,
      licenseExpiryDate: `${expiryYear}/${expiryMonth.padStart(2, '0')}/${expiryDay.padStart(2, '0')}`,
      invoiceStartPreference: formInvoiceStartPreference,
    };

    if (editingDriver) {
      onUpdateDriver(data);
    } else {
      onAddDriver(data);
    }
    
    setShowAddModal(false);
  };

  const handleDelete = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmDriver({ id, name });
  };

  const handleSaveManualInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showManualInvoiceModal) return;

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
      id: `inv-manual-${generateUUID()}`,
      driverId: showManualInvoiceModal.id,
      driverName: showManualInvoiceModal.name,
      driverPhone: showManualInvoiceModal.phone,
      amount: parseFloat(manualInvoiceAmount.replace(/[^0-9]/g, '')) || 0,
      period: manualInvoicePeriod || getCurrentPersianMonthName(),
      issueDate: issueDateStr,
      dueDate: formattedDueDate,
      status: 'pending',
    };

    onAddInvoice(newInvoice);
    setShowManualInvoiceModal(null);
    setToastMessage('فاکتور دستی با موفقیت صادر و در پرونده راننده ثبت شد.');
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSaveDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showRegisterDepositModal) return;

    const amountNum = parseFloat(depositAmount.replace(/[^0-9]/g, '')) || 0;
    const payDate = `${depositYear}/${depositMonth.padStart(2, '0')}/${depositDay.padStart(2, '0')}`;

    onRegisterDeposit(showRegisterDepositModal.id, amountNum, payDate, depositDescription);

    setShowRegisterDepositModal(null);
    setToastMessage('واریزی با موفقیت ثبت شد.');
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Profile Drawer calculations specifically for selected driver
  const driverProfileStats = useMemo(() => {
    if (!viewingDriverProfile) return null;
    const history = invoices.filter((inv) => inv.driverId === viewingDriverProfile.id);
    const paidSum = history.filter((inv) => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0);
    const pendingSum = history.filter((inv) => inv.status !== 'paid').reduce((sum, inv) => sum + inv.amount, 0);
    const totalInvoiced = paidSum + pendingSum;

    return {
      history,
      paidSum,
      pendingSum,
      totalInvoiced,
      invoiceCount: history.length,
    };
  }, [viewingDriverProfile, invoices]);

  return (
    <div className="space-y-6 text-right pb-24 select-none" dir="rtl" id="drivers-list-view">
      {/* Dynamic Floating Action Button for Mobile Users (Squircle lighter blue button at bottom-left as seen in mockup) */}
      <button
        onClick={openAddModal}
        id="floating-add-driver-fab"
        className="fixed bottom-24 left-6 z-40 h-14 w-14 bg-blue-100 hover:bg-blue-200 active:bg-blue-300 text-blue-900 rounded-[20px] flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer border border-blue-200/50"
        title="افزودن راننده جدید"
      >
        <Plus className="h-6 w-6 text-blue-900 stroke-[3]" />
      </button>

      {/* Modern High-fidelity Custom Search Bar (Matches Mockup) */}
      <div className="flex flex-col gap-3" id="drivers-search-container">
        <div className="relative">
          <span className="absolute inset-y-0 right-4 flex items-center pr-1 text-slate-400">
            <Search className="h-5 w-5 text-slate-400" />
          </span>
          <input
            type="text"
            placeholder="جستجو (نام، تلفن، پلاک و...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            id="search-drivers-input"
            className="w-full pr-12 pl-4 py-3.5 bg-white border border-slate-200 rounded-[24px] text-sm font-semibold text-slate-800 placeholder-slate-400/80 focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all text-right"
          />
        </div>
      </div>

      {/* 3. Drivers Row Cards (Exactly as seen in mockup Image 1) */}
      <div className="space-y-3.5" id="drivers-records-list">
        {filteredDrivers.length === 0 ? (
          <div className="py-16 bg-white rounded-[24px] border border-slate-100 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <AlertCircle className="h-10 w-10 text-slate-300" />
            <p className="font-extrabold text-sm text-slate-700">هیچ راننده‌ای یافت نشد!</p>
            <p className="text-[11px] text-slate-400">یک راننده جدید اضافه کنید تا در لیست نمایش داده شود.</p>
          </div>
        ) : (
          filteredDrivers.map((driver) => {
            const driverInvoices = invoices.filter((i) => i.driverId === driver.id);
            const pendingInvoices = driverInvoices.filter((i) => i.status !== 'paid');
            const totalDebt = pendingInvoices.reduce((sum, i) => sum + i.amount, 0);
            const credit = driver.creditBalance || 0;
            const netBalance = totalDebt - credit;
            
            const firstLetter = driver.name.trim().charAt(0) || 'ر';

            return (
              <motion.div
                key={driver.id}
                layout
                whileHover={{ y: -1 }}
                onClick={() => setViewingDriverId(driver.id)}
                className="bg-white p-4 rounded-[20px] border border-slate-100 shadow-sm flex items-center justify-between cursor-pointer hover:border-blue-600/20 active:bg-slate-50/50 transition-all"
              >
                {/* Right side: Initials circles and Text stack */}
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-full bg-blue-100/70 text-blue-900 border border-blue-200/20 flex items-center justify-center font-extrabold text-lg select-none">
                    {firstLetter}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-extrabold text-slate-800">{driver.name}</h3>
                    <p className="text-[11px] font-bold text-slate-400/90">
                      تلفن: {toPersianDigits(driver.phone)}
                    </p>
                  </div>
                </div>

                {/* Left side: Debt status in fa digits */}
                <div className="text-left">
                  {netBalance > 0 ? (
                    <span className="text-xs sm:text-sm font-black text-rose-500">
                      {toPersianDigits(netBalance.toLocaleString('fa-IR'))} بدهکار
                    </span>
                  ) : netBalance < 0 ? (
                    <span className="text-xs sm:text-sm font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100/40">
                      {toPersianDigits(Math.abs(netBalance).toLocaleString('fa-IR'))} طلبکار
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100/40">
                      خوش‌حساب
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* 4. DRIVER PROFILE DRAWER / VIEW DIALOG (Fully compliant with Image 3 high-fidelity Mockup) */}
      <AnimatePresence>
        {viewingDriverProfile && (() => {
          const driverInvoices = invoices.filter((i) => i.driverId === viewingDriverProfile.id);
          const pendingInvoices = driverInvoices.filter((i) => i.status !== 'paid');
          const totalDebt = pendingInvoices.reduce((sum, i) => sum + i.amount, 0);
          const credit = viewingDriverProfile.creditBalance || 0;
          const netBalance = totalDebt - credit;

          // Dynamically rebuild full ledger of debit payments (charges) and credit payments (deposits / transfers)
          const driverTransactions = (() => {
            const list: Array<{
              id: string;
              date: string;
              description: string;
              amount: number;
              type: 'charge' | 'payment';
              badgeLabel: string;
              status?: string;
            }> = [];

            driverInvoices.forEach((inv) => {
              // 1. Every invoice is a charge (debit) to the driver
              if (inv.id.includes('manual-dep-surplus')) {
                // This is a placeholder invoice representing surplus of payment.
                // We will render it exclusively as a payment/credit transaction below, so skip its charge.
                return;
              }
              
              let chargeDesc = `صدور فاکتور دوره ${inv.period}`;
              if (inv.id.includes('manual')) {
                chargeDesc = `صدور فاکتور دستی: ${inv.period}`;
              }
              
              list.push({
                id: `${inv.id}-charge`,
                date: inv.issueDate,
                description: chargeDesc,
                amount: inv.amount,
                type: 'charge',
                badgeLabel: inv.status === 'paid' ? 'تسویه شده' : 'پرداخت نشده',
                status: inv.status
              });

              // 2. If the invoice is paid, record a corresponding payment (credit) transaction
              if (inv.status === 'paid') {
                const payDesc = inv.description ? inv.description : 'واریزی';
                list.push({
                  id: `${inv.id}-payment`,
                  date: inv.paymentDate || inv.issueDate,
                  description: payDesc,
                  amount: inv.amount,
                  type: 'payment',
                  badgeLabel: 'واریز شده'
                });
              }
            });

            // 3. Explicitly add surplus deposit payments
            driverInvoices.forEach((inv) => {
              if (inv.id.includes('manual-dep-surplus')) {
                const payDesc = inv.description ? inv.description : 'واریزی';
                list.push({
                  id: `${inv.id}-deposit-surplus`,
                  date: inv.paymentDate || inv.issueDate,
                  description: payDesc,
                  amount: inv.amount,
                  type: 'payment',
                  badgeLabel: 'واریز (طلبکاری)'
                });
              }
            });

            const normalizePersianDate = (dStr: string) => {
              if (!dStr) return '';
              const parts = dStr.split('/');
              if (parts.length === 3) {
                return `${parts[0]}/${parts[1].padStart(2, '0')}/${parts[2].padStart(2, '0')}`;
              }
              return dStr;
            };

            // Chronological sort: Newest first. If same day, put invoice charge before payment so the ledger balance resolves nicely
            return list.sort((a, b) => {
              const dateCompare = normalizePersianDate(b.date).localeCompare(normalizePersianDate(a.date));
              if (dateCompare === 0) {
                return a.type === 'charge' ? 1 : -1;
              }
              return dateCompare;
            });
          })();

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-xs">
              {/* Backdrop */}
              <div className="absolute inset-0" onClick={() => setViewingDriverId(null)}></div>
              
              {/* Drawer Content */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 26, stiffness: 220 }}
                className="bg-white w-full max-w-md h-full shadow-2xl relative z-10 flex flex-col text-right p-6 overflow-y-auto no-scrollbar"
                dir="rtl"
              >
                {/* Header Row: Back button (right), Name (center), Actions (left) (EXACTLY MATCHING IMAGE 3) */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100" id="drawer-header-row">
                  {/* Close / Back button (RTL layout: right side) */}
                  <button
                    onClick={() => setViewingDriverId(null)}
                    className="p-1.5 hover:bg-slate-50 text-slate-650 rounded-full cursor-pointer transition-colors"
                    title="بازگشت"
                  >
                    <ArrowRight className="h-6 w-6 stroke-[2.5]" />
                  </button>

                  {/* Centered Name */}
                  <h2 className="text-lg font-black text-slate-800">{viewingDriverProfile.name}</h2>

                  {/* Edit & Delete Action Row (RTL layout: left side) */}
                  <div className="flex items-center gap-1">
                    {/* Pencil Edit button */}
                    <button
                      onClick={(e) => {
                        openEditModal(viewingDriverProfile, e);
                      }}
                      className="p-2 hover:bg-slate-100 text-slate-600 rounded-full cursor-pointer transition-colors"
                      title="ویرایش راننده"
                    >
                      <Edit3 className="h-5 w-5" />
                    </button>

                    {/* Trash Delete button */}
                    <button
                      onClick={(e) => {
                        handleDelete(viewingDriverProfile.id, viewingDriverProfile.name, e);
                      }}
                      className="p-2 hover:bg-rose-50 text-rose-500 rounded-full cursor-pointer transition-colors"
                      title="حذف اطلاعات"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Profile Contents Stack */}
                <div className="py-4 space-y-4 flex-1">
                  {/* Banner representing Debt / Status */}
                  {netBalance > 0 ? (
                    <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4.5 text-center flex flex-col items-center justify-center gap-1">
                      <span className="text-rose-500 text-xs font-bold">بدهکار</span>
                      <span className="text-[19px] font-black font-mono text-rose-550 leading-none">
                        {toPersianDigits(netBalance.toLocaleString('fa-IR'))} تومان
                      </span>
                    </div>
                  ) : netBalance < 0 ? (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4.5 text-center flex flex-col items-center justify-center gap-1">
                      <span className="text-emerald-600 text-xs font-bold">بستانکار (طلبکار)</span>
                      <span className="text-[19px] font-black font-mono text-emerald-700 leading-none flex items-center justify-center gap-1">
                        <span>{toPersianDigits(Math.abs(netBalance).toLocaleString('fa-IR'))}</span>
                        <span className="text-xs">تومان</span>
                      </span>
                    </div>
                  ) : (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4.5 text-center flex flex-col items-center justify-center gap-1">
                      <span className="text-emerald-600 text-xs font-bold">وضعیت مالی</span>
                      <span className="text-[16px] font-black text-emerald-700 leading-none">
                        تسویه (خوش‌حساب)
                      </span>
                    </div>
                  )}

                  {/* Circle Quick Action Buttons Row (Complaining Image 3 exact 4-stacked functions circles) */}
                  <div className="grid grid-cols-4 gap-2 py-2" id="drawer-quick-actions">
                    {/* Call circle */}
                    <a 
                      href={`tel:${viewingDriverProfile.phone}`}
                      className="flex flex-col items-center gap-1.5 cursor-pointer selection:bg-transparent"
                    >
                      <div className="w-13 h-13 rounded-full bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-emerald-600 transition-all flex items-center justify-center border border-emerald-100/50">
                        <Phone className="h-5 w-5" />
                      </div>
                      <span className="text-[10px] font-black text-slate-500">تماس</span>
                    </a>

                    {/* Copy SMS Copy reminder link */}
                    <button
                      onClick={() => {
                        if (netBalance <= 0) {
                          setToastMessage('راننده عزیز بدهی ندارد و خوش‌حساب است.');
                          setTimeout(() => setToastMessage(null), 3000);
                          return;
                        }
                        const smsText = `جناب آقای ${viewingDriverProfile.name}\nمیزان بدهی شما بابت شهریه ثابت ماهیانه، مبلغ ${toPersianDigits(netBalance.toLocaleString('fa-IR'))} تومان می‌باشد.\nخواهشمند است نسبت به پرداخت اقدام نمایید.`;
                        try {
                          navigator.clipboard.writeText(smsText);
                        } catch (err) {
                          console.log('Clipboard copy failed, using fallback', err);
                        }
                        setToastMessage('متن پیام یادآور با موفقیت کپی شد!');
                        setTimeout(() => setToastMessage(null), 3500);
                      }}
                      className="flex flex-col items-center gap-1.5 cursor-pointer selection:bg-transparent"
                    >
                      <div className="w-13 h-13 rounded-full bg-amber-50 hover:bg-amber-100 active:bg-amber-200 text-amber-600 transition-all flex items-center justify-center border border-amber-100/50">
                        <FileText className="h-5 w-5" />
                      </div>
                      <span className="text-[10px] font-black text-slate-500">پیامک</span>
                    </button>

                    {/* Settle Deposit registration button */}
                    <button
                      onClick={() => {
                        setDepositAmount(viewingDriverProfile.monthlyFee.toLocaleString('en-US'));
                        const today = getPersianToday();
                        setDepositYear(today.year.toString());
                        setDepositMonth(today.month.toString().padStart(2, '0'));
                        setDepositDay(today.day.toString().padStart(2, '0'));
                        setDepositDescription('');
                        setShowRegisterDepositModal(viewingDriverProfile);
                      }}
                      className="flex flex-col items-center gap-1.5 cursor-pointer selection:bg-transparent"
                    >
                      <div className="w-13 h-13 rounded-full bg-purple-50 hover:bg-purple-100 active:bg-purple-200 text-purple-600 transition-all flex items-center justify-center border border-purple-100/50">
                        <CreditCard className="h-5 w-5" />
                      </div>
                      <span className="text-[10px] font-black text-slate-500">ثبت واریز</span>
                    </button>

                    {/* Invoice drafting button */}
                    <button
                      onClick={() => {
                        setManualInvoicePeriod('');
                        setManualInvoiceAmount(viewingDriverProfile.monthlyFee.toLocaleString('en-US'));
                        const today = getPersianToday();
                        setManualInvoiceYear(today.year.toString());
                        setManualInvoiceMonth(today.month.toString().padStart(2, '0'));
                        setManualInvoiceDay(today.day.toString().padStart(2, '0'));
                        setShowManualInvoiceModal(viewingDriverProfile);
                      }}
                      className="flex flex-col items-center gap-1.5 cursor-pointer selection:bg-transparent"
                    >
                      <div className="w-13 h-13 rounded-full bg-blue-50 hover:bg-blue-100 active:bg-blue-200 text-blue-600 transition-all flex items-center justify-center border border-blue-100/50">
                        <Plus className="h-5 w-5" />
                      </div>
                      <span className="text-[10px] font-black text-slate-500">صدور فاکتور</span>
                    </button>
                  </div>

                  {/* Interactive Subtab Switcher exactly as seen in design wireframe */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100" id="drawer-subtabs">
                    <button
                      onClick={() => setActiveProfileTab('info')}
                      className={`py-2 px-4 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        activeProfileTab === 'info' 
                          ? 'bg-white text-slate-800 shadow-xs' 
                          : 'text-slate-400 hover:text-slate-650'
                      }`}
                    >
                      اطلاعات
                    </button>
                    <button
                      onClick={() => setActiveProfileTab('transactions')}
                      className={`py-2 px-4 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        activeProfileTab === 'transactions' 
                          ? 'bg-white text-slate-800 shadow-xs' 
                          : 'text-slate-400 hover:text-slate-650'
                      }`}
                    >
                      گردش حساب
                    </button>
                  </div>

                  {/* Sub-tab Contents Container */}
                  <div className="pt-2 text-xs" id="drawer-tab-content">
                    {activeProfileTab === 'info' ? (
                      <div className="space-y-4 bg-slate-50/50 border border-slate-100 p-4.5 rounded-[20px]">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <span className="text-slate-400 font-bold">شماره تلفن:</span>
                          <span className="font-mono text-slate-800 font-extrabold">{toPersianDigits(viewingDriverProfile.phone)}</span>
                        </div>
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <span className="text-slate-400 font-bold">پلاک خودرو:</span>
                          <span className="font-mono text-slate-800 font-extrabold">{toPersianDigits(viewingDriverProfile.licensePlate)}</span>
                        </div>
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <span className="text-slate-400 font-bold">شهر فعالیت:</span>
                          <span className="text-slate-800 font-extrabold">{viewingDriverProfile.city}</span>
                        </div>
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <span className="text-slate-400 font-bold">کد ملی:</span>
                          <span className="font-mono text-slate-800 font-extrabold">{viewingDriverProfile.nationalId ? toPersianDigits(viewingDriverProfile.nationalId) : 'ثبت نشده'}</span>
                        </div>
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <span className="text-slate-400 font-bold">نام کاربری:</span>
                          <span className="text-slate-800 font-extrabold">{viewingDriverProfile.username || 'ثبت نشده'}</span>
                        </div>
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <span className="text-slate-400 font-bold">رمز عبور:</span>
                          <span className="font-mono text-slate-800 font-extrabold">{viewingDriverProfile.password || 'ثبت نشده'}</span>
                        </div>
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <span className="text-slate-400 font-bold">انقضای پروانه فعالیت:</span>
                          <span className="font-mono text-slate-800 font-extrabold">{viewingDriverProfile.licenseExpiryDate ? toPersianDigits(viewingDriverProfile.licenseExpiryDate) : 'ثبت نشده'}</span>
                        </div>
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <span className="text-slate-400 font-bold">نوع و مدل کامیون:</span>
                          <span className="text-slate-800 font-extrabold">{viewingDriverProfile.truckModel}</span>
                        </div>
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <span className="text-slate-400 font-bold">شهریه ثابت ماهانه:</span>
                          <span className="font-extrabold text-slate-850">
                            {formatCurrency(viewingDriverProfile.monthlyFee, settings.currency)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <span className="text-slate-400 font-bold">تاریخ شروع فعالیت:</span>
                          <span className="text-slate-800 font-extrabold">{toPersianDigits(viewingDriverProfile.joinDate)}</span>
                        </div>
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <span className="text-slate-400 font-bold">نخستین فاکتور شهریه:</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            viewingDriverProfile.invoiceStartPreference === 'nextMonth'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200/50'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                          }`}>
                            {viewingDriverProfile.invoiceStartPreference === 'nextMonth'
                              ? 'با یک ماه تنفس (از ماه بعد)'
                              : 'از ماه اول شروع عضویت'}
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          <span className="text-slate-400 font-bold block">یادداشت‌های پرونده:</span>
                          <p className="p-3 bg-white border border-slate-100 text-slate-600 rounded-xl leading-relaxed text-[11px]">
                            {viewingDriverProfile.notes || 'یادداشتی درج نشده است.'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {driverTransactions.length === 0 ? (
                          <div className="py-8 text-center text-slate-400">
                            هیچ تراکنشی در گردش حساب ثبت نشده است.
                          </div>
                        ) : (
                          driverTransactions.map((tx) => (
                            <div key={tx.id} className="p-3.5 bg-slate-50 border border-slate-100/70 rounded-2xl flex items-center justify-between">
                              <div className="space-y-1">
                                <span className="font-extrabold text-slate-800 block text-[11px]">{tx.description}</span>
                                <span className="text-[10px] text-slate-400 block font-mono">تاریخ: {toPersianDigits(tx.date)}</span>
                              </div>
                              <div className="text-left space-y-1.5">
                                <span className={`font-extrabold font-mono text-xs block ${tx.type === 'payment' ? 'text-emerald-600' : 'text-slate-800'}`}>
                                  {tx.type === 'payment' ? '＋' : '－'} {toPersianDigits(tx.amount.toLocaleString('fa-IR'))} تومان
                                </span>
                                <span className={`inline-block px-2.2 py-0.5 rounded-full text-[9px] font-black ${
                                  tx.type === 'payment'
                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100/50' 
                                    : tx.status === 'paid'
                                      ? 'bg-slate-100/80 text-slate-500 border border-slate-200/50'
                                      : 'bg-rose-50 text-rose-500 border border-rose-100/50'
                                }`}>
                                  {tx.badgeLabel}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                  </div>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* 5. ADD / EDIT DIALOG MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col"
              dir="rtl"
            >
              {/* Head */}
              <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-emerald-400" />
                  <h3 className="text-sm font-bold">
                    {editingDriver ? `ویرایش پرونده راننده: ${editingDriver.name}` : 'افزودن راننده'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Scrollable Form */}
              <form onSubmit={handleSaveDriver} className="p-6 overflow-y-auto max-h-[80vh] space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name & Phone Row */}
                  <div className="grid grid-cols-2 gap-3 sm:col-span-2">
                    {/* Name */}
                    <div className="space-y-1">
                      <label className="block text-slate-500 font-semibold">نام و نام خانوادگی راننده <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        required
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="مانند: حسن رضاییان"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    {/* Phone */}
                    <div className="space-y-1">
                      <label className="block text-slate-500 font-semibold">شماره تماس راننده <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        required
                        value={formPhone}
                        onChange={(e) => setFormPhone(e.target.value)}
                        placeholder="مانند: 09121234567"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-left"
                      />
                    </div>
                  </div>

                  {/* Iranian License Plate Picker */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="block text-slate-500 font-semibold">شماره پلاک ملی کامیون</label>
                    <div className="flex items-center justify-center bg-slate-50 p-2.5 rounded-2xl border border-slate-200/60 shadow-sm" dir="ltr">
                      <div className="flex items-center bg-white border-2 border-slate-900 rounded-lg overflow-hidden h-10 w-full max-w-[280px] shadow-sm font-mono text-xs font-bold text-slate-800">
                        {/* 1. Left Blue Section */}
                        <div className="bg-blue-800 text-white flex flex-col items-center justify-center w-6 h-full px-0.5 border-r border-slate-900">
                           <div className="w-3 h-1.5 flex flex-col justify-between">
                            <span className="bg-green-600 h-[2px] w-full"></span>
                            <span className="bg-white h-[2px] w-full"></span>
                            <span className="bg-red-600 h-[2px] w-full"></span>
                          </div>
                          <span className="text-[5px] font-sans scale-75 leading-none mt-0.5">I.R.</span>
                          <span className="text-[5px] font-sans scale-75 leading-none font-bold">IRAN</span>
                        </div>

                        {/* 2. Number Part 1 (2 digits) */}
                        <input
                          type="text"
                          maxLength={2}
                          value={platePart1}
                          onChange={(e) => setPlatePart1(e.target.value.replace(/[^0-9]/g, ''))}
                          placeholder="۱۲"
                          className="w-10 h-full text-center bg-transparent border-none outline-none focus:ring-0 text-slate-850 font-sans font-extrabold text-xs focus:bg-amber-50"
                        />

                        {/* 3. Letter drop-down */}
                        <select
                          value={plateLetter}
                          onChange={(e) => setPlateLetter(e.target.value)}
                          className="w-14 h-full text-center bg-transparent border-none outline-none focus:ring-0 text-slate-850 font-sans font-extrabold text-[11px] pr-1 border-r border-l border-slate-300 focus:bg-amber-50 text-center-last"
                        >
                          {['الف', 'ب', 'ج', 'د', 'س', 'ص', 'ط', 'ع', 'ق', 'ل', 'م', 'ن', 'و', 'هـ', 'ی'].map((letter) => (
                            <option key={letter} value={letter}>{letter}</option>
                          ))}
                        </select>

                        {/* 4. Number Part 2 (3 digits) */}
                        <input
                          type="text"
                          maxLength={3}
                          value={platePart2}
                          onChange={(e) => setPlatePart2(e.target.value.replace(/[^0-9]/g, ''))}
                          placeholder="۳۴۵"
                          className="w-14 h-full text-center bg-transparent border-none outline-none focus:ring-0 text-slate-850 font-sans font-extrabold text-xs focus:bg-amber-50"
                        />

                        {/* 5. Iranian vertical separator and Code (2 digits) */}
                        <div className="flex-1 h-full flex items-center justify-center gap-2 bg-slate-50 border-l-2 border-slate-900 text-slate-900 px-3 shrink-0">
                          <span className="font-sans font-extrabold text-slate-600 text-xs select-none">ایران</span>
                          <input
                            type="text"
                            maxLength={2}
                            value={plateIranCode}
                            onChange={(e) => setPlateIranCode(e.target.value.replace(/[^0-9]/g, ''))}
                            placeholder="۲۲"
                            className="w-10 h-6 text-center bg-white border border-slate-300 rounded-md outline-none focus:ring-1 focus:ring-emerald-500 text-slate-900 font-sans font-extrabold text-xs focus:bg-amber-50"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Monthly Fee & National ID Row */}
                  <div className="grid grid-cols-2 gap-3 sm:col-span-2">
                    {/* Monthly Fee */}
                    <div className="space-y-1">
                      <label className="block text-slate-500 font-semibold">شهریه ثابت ماهانه (تومان) <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        required
                        value={formMonthlyFee}
                        onChange={(e) => {
                          const cleanVal = e.target.value.replace(/[^0-9]/g, '');
                          if (cleanVal === '') {
                            setFormMonthlyFee('');
                          } else {
                            setFormMonthlyFee(parseInt(cleanVal, 10).toLocaleString('en-US'));
                          }
                        }}
                        placeholder="مانند: ۴,۵۰۰,۰۰۰"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-left font-bold"
                      />
                    </div>

                    {/* National ID */}
                    <div className="space-y-1">
                      <label className="block text-slate-500 font-semibold">کد ملی</label>
                      <input
                        type="text"
                        maxLength={10}
                        value={formNationalId}
                        onChange={(e) => setFormNationalId(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="مثال: ۱۲۳۴۵۶۷۸۹۰"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-right"
                      />
                    </div>
                  </div>

                  {/* City & Truck Model Row */}
                  <div className="grid grid-cols-2 gap-3 sm:col-span-2">
                    {/* City */}
                    <div className="space-y-1">
                      <label className="block text-slate-500 font-semibold">شهر محل حرکت / فعالیت</label>
                      <input
                        type="text"
                        value={formCity}
                        onChange={(e) => setFormCity(e.target.value)}
                        placeholder="مانند: بندرعباس"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    {/* Truck Model */}
                    <div className="space-y-1">
                      <label className="block text-slate-500 font-semibold">مدل کامیون</label>
                      <input
                        type="text"
                        value={formTruckModel}
                        onChange={(e) => setFormTruckModel(e.target.value)}
                        placeholder="مانند: ولوو FH 500 نسل ۵"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Username & Password Row */}
                  <div className="grid grid-cols-2 gap-3 sm:col-span-2">
                    {/* Username */}
                    <div className="space-y-1">
                      <label className="block text-slate-500 font-semibold">نام کاربری</label>
                      <input
                        type="text"
                        value={formUsername}
                        onChange={(e) => setFormUsername(e.target.value)}
                        placeholder="نام کاربری"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-left font-mono"
                      />
                    </div>

                    {/* Password */}
                    <div className="space-y-1">
                      <label className="block text-slate-500 font-semibold">رمز عبور</label>
                      <input
                        type="text"
                        value={formPassword}
                        onChange={(e) => setFormPassword(e.target.value)}
                        placeholder="رمز عبور"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-left font-mono"
                      />
                    </div>
                  </div>

                  {/* Join Date */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="block text-slate-500 font-semibold mb-1">تاریخ عضویت</label>
                    {editingDriver ? (
                      <div className="flex flex-col gap-1 w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-right">
                        <span className="text-slate-700 font-bold font-mono text-sm">
                          {toPersianDigits(editingDriver.joinDate)}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          (تاریخ عضویت پس از ثبت پرونده غیرقابل تغییر و ویرایش است)
                        </span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-3">
                        {/* Day */}
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-slate-400 font-bold block">روز</span>
                          <select
                            value={joinDay}
                            onChange={(e) => setJoinDay(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-center"
                          >
                            {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')).map((day) => (
                              <option key={day} value={day}>
                                {toPersianDigits(day)}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Month */}
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-slate-400 font-bold block">ماه</span>
                          <select
                            value={joinMonth}
                            onChange={(e) => setJoinMonth(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-center"
                          >
                            {[
                              { val: '01', name: 'فروردین' },
                              { val: '02', name: 'اردیبهشت' },
                              { val: '03', name: 'خرداد' },
                              { val: '04', name: 'تیر' },
                              { val: '05', name: 'مرداد' },
                              { val: '06', name: 'شهریور' },
                              { val: '07', name: 'مهر' },
                              { val: '08', name: 'آبان' },
                              { val: '09', name: 'آذر' },
                              { val: '10', name: 'دی' },
                              { val: '11', name: 'بهمن' },
                              { val: '12', name: 'اسفند' }
                            ].map((m) => (
                              <option key={m.val} value={m.val}>
                                {m.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Year */}
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-slate-400 font-bold block">سال</span>
                          <select
                            value={joinYear}
                            onChange={(e) => setJoinYear(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-center font-bold text-slate-800"
                          >
                            {yearsList.map((y) => (
                              <option key={y} value={String(y)}>
                                {toPersianDigits(y)}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* License Expiry Date */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="block text-slate-500 font-semibold mb-1 font-sans">تاریخ انقضای پروانه فعالیت</label>
                    <div className="grid grid-cols-3 gap-3">
                      {/* Expiry Day */}
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-400 font-bold block">روز</span>
                        <select
                          value={expiryDay}
                          onChange={(e) => setExpiryDay(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-center"
                        >
                          {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')).map((day) => (
                            <option key={day} value={day}>
                              {toPersianDigits(day)}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Expiry Month */}
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-400 font-bold block">ماه</span>
                        <select
                          value={expiryMonth}
                          onChange={(e) => setExpiryMonth(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-center"
                        >
                          {[
                            { val: '01', name: 'فروردین' },
                            { val: '02', name: 'اردیبهشت' },
                            { val: '03', name: 'خرداد' },
                            { val: '04', name: 'تیر' },
                            { val: '05', name: 'مرداد' },
                            { val: '06', name: 'شهریور' },
                            { val: '07', name: 'مهر' },
                            { val: '08', name: 'آبان' },
                            { val: '09', name: 'آذر' },
                            { val: '10', name: 'دی' },
                            { val: '11', name: 'بهمن' },
                            { val: '12', name: 'اسفند' }
                          ].map((m) => (
                            <option key={m.val} value={m.val}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Expiry Year */}
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-400 font-bold block">سال</span>
                        <select
                          value={expiryYear}
                          onChange={(e) => setExpiryYear(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-center font-bold text-slate-800"
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
                </div>

                {/* First Invoice Generation Preference */}
                <div className="space-y-2 bg-slate-50 p-4.5 rounded-2xl border border-slate-200/60 shadow-xs">
                  <span className="block text-slate-700 font-bold text-xs flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    زمان صدور اولین فاکتور شهریه راننده
                  </span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1.5">
                    <button
                      type="button"
                      onClick={() => setFormInvoiceStartPreference('joinMonth')}
                      className={`flex flex-col text-right p-3.5 rounded-xl border transition-all cursor-pointer ${
                        formInvoiceStartPreference === 'joinMonth'
                          ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950 font-bold ring-1 ring-emerald-500'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-2 justify-between w-full">
                        <span className="text-xs font-semibold">از همین ماه شروع عضویت</span>
                        <div className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                          formInvoiceStartPreference === 'joinMonth' ? 'border-emerald-500' : 'border-slate-300'
                        }`}>
                          {formInvoiceStartPreference === 'joinMonth' && (
                            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 font-normal leading-relaxed">
                        فاکتور اولین ماه شهریه بلافاصله در بدو ورود راننده به سیستم ثبت و صادر می‌شود.
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormInvoiceStartPreference('nextMonth')}
                      className={`flex flex-col text-right p-3.5 rounded-xl border transition-all cursor-pointer ${
                        formInvoiceStartPreference === 'nextMonth'
                          ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950 font-bold ring-1 ring-emerald-500'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-2 justify-between w-full">
                        <span className="text-xs font-semibold">شروع از ماه آینده (یک ماه تنفس)</span>
                        <div className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                          formInvoiceStartPreference === 'nextMonth' ? 'border-emerald-500' : 'border-slate-300'
                        }`}>
                          {formInvoiceStartPreference === 'nextMonth' && (
                            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 font-normal leading-relaxed">
                        راننده عضو خواهد شد، اما اولین فاکتور بدهی وی از ماه بعدی صادر خواهد شد.
                      </span>
                    </button>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-1">
                  <label className="block text-slate-500 font-semibold">توضیحات</label>
                  <textarea
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="توضیحات اختیاری درباره راننده..."
                    rows={3}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* Action Buttons */}
                <div className="pt-4 border-t border-slate-100 flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer font-medium"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold cursor-pointer"
                  >
                    {editingDriver ? 'ثبت و ذخیره تغییرات' : 'افزودن راننده'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. MANUAL INVOICE MODAL */}
      <AnimatePresence>
        {showManualInvoiceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4"
              dir="rtl"
            >
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <FileText className="h-4.5 w-4.5 text-blue-600" />
                صدور فاکتور دستی برای {showManualInvoiceModal.name}
              </h3>
              <form onSubmit={handleSaveManualInvoice} className="space-y-4 text-xs font-sans">
                <div className="space-y-1">
                  <label className="block text-slate-500 font-semibold">عنوان فاکتور</label>
                  <input
                    type="text"
                    required
                    value={manualInvoicePeriod}
                    onChange={(e) => setManualInvoicePeriod(e.target.value)}
                    placeholder="مانند: فاکتور خدمات"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-slate-800 text-right"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-slate-500 font-semibold">مبلغ فاکتور (تومان)</label>
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
                  <label className="block text-slate-500 font-semibold mb-1">تاریخ صدور</label>
                  <div className="grid grid-cols-3 gap-2" dir="rtl">
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-slate-400 font-bold block text-right">روز</span>
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
                      <span className="text-[9px] text-slate-400 font-bold block text-right">ماه</span>
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
                      <span className="text-[9px] text-slate-400 font-bold block text-right">سال</span>
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
                    onClick={() => setShowManualInvoiceModal(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer font-medium"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer"
                  >
                    صدور فاکتور
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. QUICK DEPOSIT REGISTRATION MODAL */}
      <AnimatePresence>
        {showRegisterDepositModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4"
              dir="rtl"
            >
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <CreditCard className="h-4.5 w-4.5 text-emerald-600" />
                ثبت واریزی {showRegisterDepositModal.name}
              </h3>
              <form onSubmit={handleSaveDeposit} className="space-y-4 text-xs font-sans">
                <div className="space-y-1">
                  <label className="block text-slate-500 font-semibold">مبلغ پرداختی (تومان)</label>
                  <input
                    type="text"
                    required
                    value={depositAmount}
                    onChange={(e) => {
                      const cleanVal = e.target.value.replace(/[^0-9]/g, '');
                      if (cleanVal === '') {
                        setDepositAmount('');
                      } else {
                        setDepositAmount(parseInt(cleanVal, 10).toLocaleString('en-US'));
                      }
                    }}
                    placeholder="مانند: ۴,۵۰۰,۰۰۰"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-left font-bold text-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-slate-500 font-semibold">بابت / عنوان واریزی (اختیاری)</label>
                  <input
                    type="text"
                    value={depositDescription}
                    onChange={(e) => setDepositDescription(e.target.value)}
                    placeholder="مانند: قرارداد، شهریه تیر و ..."
                    className="w-full px-3 py-2 bg-slate-55 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-right font-sans text-xs text-slate-800"
                  />
                </div>
                 <div className="space-y-1">
                  <label className="block text-slate-500 font-semibold mb-1">تاریخ پرداخت</label>
                  <div className="grid grid-cols-3 gap-2" dir="rtl">
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-slate-400 font-bold block text-right">روز</span>
                      <select
                        value={depositDay}
                        onChange={(e) => setDepositDay(e.target.value)}
                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-center font-bold text-slate-800"
                      >
                        {Array.from({ length: 31 }, (_, i) => {
                          const val = (i + 1).toString().padStart(2, '0');
                          return <option key={val} value={val}>{val}</option>;
                        })}
                      </select>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-slate-400 font-bold block text-right">ماه</span>
                      <select
                        value={depositMonth}
                        onChange={(e) => setDepositMonth(e.target.value)}
                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-center font-bold text-slate-800"
                      >
                        {Array.from({ length: 12 }, (_, i) => {
                          const val = (i + 1).toString().padStart(2, '0');
                          return <option key={val} value={val}>{val}</option>;
                        })}
                      </select>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-slate-400 font-bold block text-right">سال</span>
                      <select
                        value={depositYear}
                        onChange={(e) => setDepositYear(e.target.value)}
                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-center font-bold text-slate-800"
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
                    onClick={() => setShowRegisterDepositModal(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer font-medium"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer"
                  >
                    ثبت و پرداخت موفق
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 8. CONFIRM DELETION MODAL */}
      <AnimatePresence>
        {deleteConfirmDriver && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
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
                <h3 className="text-sm font-black text-slate-800">حذف اطلاعات راننده</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-6 font-medium">
                آیا از حذف اطلاعات راننده <span className="font-extrabold text-slate-900 border-b border-rose-200">«{deleteConfirmDriver.name}»</span> و تمامی فاکتورها، واریزی‌ها و تاریخچه مربوطه به طور کامل اطمینان دارید؟ این عمل غیرقابل بازگشت است.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmDriver(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer font-bold text-xs"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteDriver(deleteConfirmDriver.id);
                    if (viewingDriverId === deleteConfirmDriver.id) {
                      setViewingDriverId(null);
                    }
                    setDeleteConfirmDriver(null);
                    setToastMessage('اطلاعات راننده با موفقیت حذف شد.');
                  }}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold cursor-pointer text-xs"
                >
                  حذف قطعی اطلاعات
                </button>
              </div>
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
