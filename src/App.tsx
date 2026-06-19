/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutGrid, 
  Users, 
  FileText, 
  Settings as SettingsIcon, 
  Truck, 
  Menu, 
  X,
  PlusCircle,
  Database,
  Sparkles,
  User
} from 'lucide-react';

// Child components
import Dashboard from './components/Dashboard';
import DriversList from './components/DriversList';
import Settings from './components/Settings';

// Types and data
import { AppState, Driver, Invoice, AppSettings } from './types';
import { initialAppState } from './demoData';
import { getPersianToday, getCurrentPersianMonthName, toPersianDigits, generateUUID } from './utils';

const LOCAL_STORAGE_KEY = 'truck_accounting_system_state';

export default function App() {
  // Global state
  const [state, setState] = useState<AppState>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AppState;
        if (parsed.drivers && parsed.invoices && parsed.settings) {
          // Robust deduplication of invoices on load
          const uniqueInvoices: Invoice[] = [];
          const seen = new Set<string>();
          parsed.invoices.forEach((inv) => {
            const key = `${inv.driverId}-${inv.period}`;
            if (!seen.has(key)) {
              seen.add(key);
              uniqueInvoices.push(inv);
            }
          });
          parsed.invoices = uniqueInvoices;
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to parse state from localStorage', e);
    }
    // Fallback to pre-populated Persian demo state
    return initialAppState;
  });

  // Current tab navigation state
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openAddDriverOnMount, setOpenAddDriverOnMount] = useState(false);

  // Sync to localStorage automatically whenever state alters
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Calculations for current period and today's details
  const currentMonthName = useMemo(() => getCurrentPersianMonthName(), []);
  const todayDetail = useMemo(() => getPersianToday(), []);

  // Drivers Handlers
  const handleAddDriver = useCallback((driver: Driver) => {
    setState((prev) => ({
      ...prev,
      drivers: [...prev.drivers, driver],
    }));
  }, []);

  const handleUpdateDriver = useCallback((updatedDriver: Driver) => {
    setState((prev) => ({
      ...prev,
      drivers: prev.drivers.map((d) => (d.id === updatedDriver.id ? updatedDriver : d)),
    }));
  }, []);

  const handleDeleteDriver = useCallback((driverId: string) => {
    setState((prev) => ({
      ...prev,
      drivers: prev.drivers.filter((d) => d.id !== driverId),
      // Clean corresponding invoices as well
      invoices: prev.invoices.filter((inv) => inv.driverId !== driverId),
    }));
  }, []);

  // Invoices Handlers
  const handleAddInvoice = useCallback((invoice: Invoice) => {
    setState((prev) => ({
      ...prev,
      invoices: [invoice, ...prev.invoices],
    }));
  }, []);

  const handleSettleInvoice = useCallback((invoiceId: string, method: string = 'کارت به کارت', date: string = '', amount?: number) => {
    const today = getPersianToday();
    setState((prev) => ({
      ...prev,
      invoices: prev.invoices.map((inv) => {
        if (inv.id === invoiceId) {
          return {
            ...inv,
            status: 'paid',
            paymentDate: date || today.formatted,
            paymentMethod: method,
            amount: amount !== undefined ? amount : inv.amount,
          };
        }
        return inv;
      }),
    }));
  }, []);

  const handleRegisterDeposit = useCallback((driverId: string, amount: number, date: string, description?: string) => {
    setState((prev) => {
      const driver = prev.drivers.find((d) => d.id === driverId);
      if (!driver) return prev;

      // Available total pool = current new deposit + existing credit balance of the driver
      let totalPool = amount + (driver.creditBalance || 0);

      // Get pending invoices of the driver, sorted from oldest to newest issue date
      const driverInvoices = prev.invoices.filter((i) => i.driverId === driverId);
      const pendingInvoices = driverInvoices
        .filter((i) => i.status !== 'paid')
        .sort((a, b) => a.issueDate.localeCompare(b.issueDate));

      const updatedInvoices = prev.invoices.map((inv) => {
        if (inv.driverId === driverId && inv.status !== 'paid') {
          const isPending = pendingInvoices.some((pi) => pi.id === inv.id);
          if (isPending) {
            if (totalPool >= inv.amount) {
              totalPool -= inv.amount;
              return {
                ...inv,
                status: 'paid' as const,
                paymentDate: date,
                paymentMethod: 'کارت به کارت',
                description: description || inv.description || '',
              };
            }
          }
        }
        return inv;
      });

      // Log any positive remaining pool as a paid surplus deposit
      // so it is visible in the transaction history (گردش حساب) to show overpaid / creditor amount
      const finalInvoices = [...updatedInvoices];
      if (totalPool > 0) {
        finalInvoices.push({
          id: `manual-dep-surplus-${generateUUID()}`,
          driverId: driverId,
          driverName: driver.name,
          driverPhone: driver.phone,
          amount: totalPool,
          period: 'واریز (طلبکاری)',
          issueDate: date,
          dueDate: date,
          status: 'paid',
          paymentMethod: 'کارت به کارت',
          paymentDate: date,
          description: description || '',
        });
      }

      const updatedDrivers = prev.drivers.map((d) => {
        if (d.id === driverId) {
          return {
            ...d,
            creditBalance: totalPool,
          };
        }
        return d;
      });

      return {
        ...prev,
        drivers: updatedDrivers,
        invoices: finalInvoices,
      };
    });
  }, []);

  const handleDeleteInvoice = useCallback((invoiceId: string) => {
    setState((prev) => ({
      ...prev,
      invoices: prev.invoices.filter((inv) => inv.id !== invoiceId),
    }));
  }, []);

  // Settings Handlers
  const handleUpdateSettings = useCallback((updatedSettings: AppSettings) => {
    setState((prev) => ({
      ...prev,
      settings: updatedSettings,
    }));
  }, []);

  // 🚀 AUTOMATED BACKGROUND INVOICING TRIGGER SYSTEM
  // Checks, generates, and reconciles monthly subscription invoices on membership calendar due dates.
  useEffect(() => {
    const activeDrivers = state.drivers.filter((d) => d.status === 'active');
    const existingInvoices = state.invoices;
    const today = getPersianToday();
    const monthsList = [
      'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
      'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
    ];

    const newInvoices: Invoice[] = [];
    const outdatedInvoiceIds = new Set<string>();

    activeDrivers.forEach((driver) => {
      let joinYear = today.year;
      let joinMonth = today.month;
      let joinDay = 10;

      if (driver.joinDate) {
        // Robust cleanup of Persian digits to English digits for parser safety
        const cleanDateStr = driver.joinDate.replace(/[۰-۹]/g, (d) => {
          return '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString();
        });
        const parts = cleanDateStr.split('/');
        if (parts.length === 3) {
          const y = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10);
          const d = parseInt(parts[2], 10);
          if (!isNaN(y)) joinYear = y;
          if (!isNaN(m)) joinMonth = m;
          if (!isNaN(d)) joinDay = d;
        }
      }

      // Generate all periods starting from the chosen billing start month to (today.year, today.month)
      let billStartYear = joinYear;
      let billStartMonth = joinMonth;

      if (driver.invoiceStartPreference === 'nextMonth') {
        billStartMonth += 1;
        if (billStartMonth > 12) {
          billStartMonth = 1;
          billStartYear += 1;
        }
      }

      let currentY = billStartYear;
      let currentM = billStartMonth;

      const driverExpectedPeriods = new Set<string>();

      while (true) {
        // Break condition: past today's month
        if (currentY > today.year || (currentY === today.year && currentM > today.month)) {
          break;
        }

        // Determine if this is a month we should generate for
        let shouldGenerate = false;
        
        // 1. If it's the billing start month, always generate
        if (currentY === billStartYear && currentM === billStartMonth) {
          shouldGenerate = true;
        } 
        // 2. If it is today's month, generate only if today's day of month >= joinDay
        else if (currentY === today.year && currentM === today.month) {
          if (today.day >= joinDay) {
            shouldGenerate = true;
          }
        } 
        // 3. For any month strictly between the billing start month and today's month, always generate
        else {
          shouldGenerate = true;
        }

        if (shouldGenerate) {
          const periodName = `${monthsList[currentM - 1]} ${toPersianDigits(currentY)}`;
          driverExpectedPeriods.add(periodName);
          
          // Verify both existing and newly scheduled invoices to completely prevent intra-loop double generation
          const alreadyHasInvoice = existingInvoices.some(
            (inv) => inv.driverId === driver.id && inv.period === periodName
          ) || newInvoices.some(
            (inv) => inv.driverId === driver.id && inv.period === periodName
          );

          if (!alreadyHasInvoice) {
            let dueDay = joinDay + 5;
            let dueMonth = currentM;
            let dueYear = currentY;
            if (dueDay > 30) {
              dueDay = dueDay - 30;
              dueMonth += 1;
              if (dueMonth > 12) {
                dueMonth = 1;
                dueYear += 1;
              }
            }

            const pad = (n: number) => n.toString().padStart(2, '0');
            const dueDateFormatted = `${dueYear}/${pad(dueMonth)}/${pad(dueDay)}`;
            const issueDateFormatted = `${currentY}/${pad(currentM)}/${pad(joinDay)}`;

            newInvoices.push({
              id: `inv-auto-${generateUUID()}`,
              driverId: driver.id,
              driverName: driver.name,
              driverPhone: driver.phone,
              amount: driver.monthlyFee,
              period: periodName,
              issueDate: issueDateFormatted,
              dueDate: dueDateFormatted,
              status: 'pending',
            });
          }
        }

        // Increment month
        currentM += 1;
        if (currentM > 12) {
          currentM = 1;
          currentY += 1;
        }
      }

      // Collect any outdated auto-generated pending invoices of this driver that are not in driverExpectedPeriods
      existingInvoices.forEach((inv) => {
        if (
          inv.driverId === driver.id &&
          inv.status !== 'paid' &&
          inv.id.startsWith('inv-auto-') &&
          !driverExpectedPeriods.has(inv.period)
        ) {
          outdatedInvoiceIds.add(inv.id);
        }
      });
    });

    if (newInvoices.length > 0 || outdatedInvoiceIds.size > 0) {
      setState((prev) => {
        // Filter out outdated invoices
        let updatedInvoices = prev.invoices;
        if (outdatedInvoiceIds.size > 0) {
          updatedInvoices = updatedInvoices.filter((inv) => !outdatedInvoiceIds.has(inv.id));
        }

        // Double-check prevention of duplicates on state transition level
        const filteredNewInvoices = newInvoices.filter(newInv => 
          !outdatedInvoiceIds.has(newInv.id) &&
          !updatedInvoices.some(existingInv => 
            existingInv.driverId === newInv.driverId && existingInv.period === newInv.period
          )
        );

        if (filteredNewInvoices.length === 0 && updatedInvoices.length === prev.invoices.length) {
          return prev;
        }

        return {
          ...prev,
          invoices: [...filteredNewInvoices, ...updatedInvoices],
        };
      });
    }
  }, [state.drivers, state.invoices]);

  // DB Backup Operations
  const handleExportBackup = useCallback(() => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `truck-accounting-backup-${todayDetail.year}-${todayDetail.month}-${todayDetail.day}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }, [state, todayDetail]);

  const handleImportBackup = useCallback((importedState: AppState) => {
    setState(importedState);
  }, []);

  const handleReloadDemoData = useCallback(() => {
    setState(initialAppState);
  }, []);

  const handleClearAllData = useCallback(() => {
    setState({
      drivers: [],
      invoices: [],
      expenses: [],
      settings: {
        businessName: 'موسسه حمل و نقل سنگین من',
        managerName: 'مدیر کل باربری',
        phone: '09120000000',
        currency: 'تومان',
        cardAccountNumber: '۶۰۳۷-۹۹۹۹-۹۹۹۹-۹۹۹۹',
        cardHolderName: 'حساب عمومی باربری',
        autoInvoicerDay: 5,
      },
    });
  }, []);

  const handleTabNavigation = (tab: string) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen md:h-screen md:overflow-hidden bg-slate-50 font-sans" dir="rtl" id="app-wrapper">
      {/* 1. SIDEBAR NAVIGATION - DESKTOP */}
      <aside className="hidden md:flex w-64 bg-slate-900 text-white flex-col shadow-2xl shrink-0 z-20">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Truck className="w-6 h-6 text-white" />
          </div>
          <span className="text-sm font-bold tracking-tight block max-w-[150px] truncate">{state.settings.businessName}</span>
        </div>
        
        <nav className="flex-1 py-6">
          <div className="px-4 space-y-2">
            <button 
              onClick={() => handleTabNavigation('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-right transition-colors text-xs font-bold cursor-pointer ${
                activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/45'
              }`}
            >
              <LayoutGrid className="h-4.5 w-4.5" />
              <span>داشبورد</span>
            </button>
            <button 
              onClick={() => handleTabNavigation('drivers')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-right transition-colors text-xs font-bold cursor-pointer ${
                activeTab === 'drivers' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/45'
              }`}
            >
              <Users className="h-4.5 w-4.5" />
              <span>رانندگان ({toPersianDigits(state.drivers.length)})</span>
            </button>
            <button 
              onClick={() => handleTabNavigation('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-right transition-colors text-xs font-bold cursor-pointer ${
                activeTab === 'settings' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/45'
              }`}
            >
              <User className="h-4.5 w-4.5" />
              <span>حساب کاربری</span>
            </button>
          </div>
        </nav>

        <div className="p-6 bg-slate-800/50 rounded-t-3xl mt-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-slate-600 border border-slate-500 flex items-center justify-center text-xs font-mono font-bold text-white uppercase">
              {state.settings.managerName.slice(0, 2)}
            </div>
            <div>
              <p className="text-xs font-semibold">{state.settings.managerName}</p>
              <p className="text-[10px] text-slate-400">به‌روزشده: امروز</p>
            </div>
          </div>
          <button 
            onClick={handleExportBackup}
            className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-xs rounded-lg transition-colors text-center text-slate-200 hover:text-white cursor-pointer"
          >
            بک‌آپ از داده‌ها
          </button>
        </div>
      </aside>

      {/* 2. CORE VIEW SWITCH AREA & MOBILE CONTAINER */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden relative">
        
        {/* Sleek, Premium Mobile Top Header - No Clumsy Drawer */}
        <header className="md:hidden bg-white/90 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40 shrink-0 px-4 py-3 flex items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/15">
              <Truck className="h-4.5 w-4.5" />
            </div>
            <div>
              <span className="text-xs font-black text-slate-900 block tracking-tight">{state.settings.businessName}</span>
            </div>
          </div>

        </header>

        {/* Scrollable Container with bottom padding so navigation is never obscured on phones */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 pt-5 pb-24 md:py-6 flex flex-col justify-between min-h-0 bg-slate-50 gap-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15, ease: "easeInOut" }}
              className="flex-1"
            >
              {activeTab === 'dashboard' && (
                <Dashboard
                  drivers={state.drivers}
                  invoices={state.invoices}
                  expenses={state.expenses}
                  settings={state.settings}
                  onNavigate={handleTabNavigation}
                  onAddDriver={() => {
                    setOpenAddDriverOnMount(true);
                    handleTabNavigation('drivers');
                  }}
                  onSettleInvoice={handleSettleInvoice}
                  onAddInvoice={handleAddInvoice}
                />
              )}

              {activeTab === 'drivers' && (
                <DriversList
                  drivers={state.drivers}
                  invoices={state.invoices}
                  settings={state.settings}
                  onAddDriver={handleAddDriver}
                  onUpdateDriver={handleUpdateDriver}
                  onDeleteDriver={handleDeleteDriver}
                  onAddInvoice={handleAddInvoice}
                  onSettleInvoice={handleSettleInvoice}
                  onRegisterDeposit={handleRegisterDeposit}
                  initialOpenAddModal={openAddDriverOnMount}
                  onResetInitialOpenAddModal={() => setOpenAddDriverOnMount(false)}
                />
              )}

              {activeTab === 'settings' && (
                <Settings
                  settings={state.settings}
                  onUpdateSettings={handleUpdateSettings}
                  onExportBackup={handleExportBackup}
                  onImportBackup={handleImportBackup}
                  onReloadDemoData={handleReloadDemoData}
                  onClearAllData={handleClearAllData}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* 3. HUMBLE STATIC FOOTER (Hidden on mobile to preserve visual whitespace and minimize clutter) */}
          <footer className="hidden md:block text-center py-4 text-[10px] text-slate-400 border-t border-slate-200/50 shrink-0">
            <p>تمام حقوق امن برای پنل حسابداری {state.settings.businessName} محفوظ است.</p>
            <p className="mt-1 font-mono">توسعه یافته منطبق با زبان طراحی Sleek Interface و آخرین ترفندهای وب</p>
          </footer>
        </div>

        {/* Beautiful Sticky iOS/Android Style Mobile Bottom Navigation Bar */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-150/70 shadow-[0_-8px_24px_rgba(0,0,0,0.04)] z-40 px-3 pb-safe pt-2.5">
          <div className="max-w-md mx-auto flex items-center justify-around h-12">
            <button
              onClick={() => handleTabNavigation('dashboard')}
              id="m-nav-dashboard"
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all relative cursor-pointer ${
                activeTab === 'dashboard' ? 'text-blue-600 font-bold' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <LayoutGrid className={`h-5 w-5 transition-transform duration-200 ${activeTab === 'dashboard' ? 'scale-110 text-blue-600 animate-none' : 'scale-100'}`} />
              <span className="text-[10px] mt-1.5 tracking-tight font-bold">داشبورد</span>
              {activeTab === 'dashboard' && (
                <motion.div 
                  layoutId="bottom-nav-active-bar" 
                  className="absolute -top-[10px] w-6 h-1 bg-blue-600 rounded-full" 
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                />
              )}
            </button>

            <button
              onClick={() => handleTabNavigation('drivers')}
              id="m-nav-drivers"
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all relative cursor-pointer ${
                activeTab === 'drivers' ? 'text-blue-600 font-bold' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div className="relative">
                <Users className={`h-5 w-5 transition-transform duration-200 ${activeTab === 'drivers' ? 'scale-110 text-blue-600' : 'scale-100'}`} />
              </div>
              <span className="text-[10px] mt-1.5 tracking-tight font-bold">رانندگان</span>
              {activeTab === 'drivers' && (
                <motion.div 
                  layoutId="bottom-nav-active-bar" 
                  className="absolute -top-[10px] w-6 h-1 bg-blue-600 rounded-full" 
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                />
              )}
            </button>

            <button
              onClick={() => handleTabNavigation('settings')}
              id="m-nav-settings"
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all relative cursor-pointer ${
                activeTab === 'settings' ? 'text-blue-600 font-bold' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <User className={`h-5 w-5 transition-transform duration-200 ${activeTab === 'settings' ? 'scale-110 text-blue-600' : 'scale-100'}`} />
              <span className="text-[10px] mt-1.5 tracking-tight font-bold">حساب کاربری</span>
              {activeTab === 'settings' && (
                <motion.div 
                  layoutId="bottom-nav-active-bar" 
                  className="absolute -top-[10px] w-6 h-1 bg-blue-600 rounded-full" 
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                />
              )}
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}
