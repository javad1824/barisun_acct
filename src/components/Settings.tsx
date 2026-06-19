/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Save, 
  Trash2, 
  Download, 
  Upload, 
  RefreshCw, 
  ShieldAlert, 
  Building, 
  User, 
  Phone, 
  CreditCard, 
  Database,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { AppSettings, AppState } from '../types';

interface SettingsProps {
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
  onExportBackup: () => void;
  onImportBackup: (importedState: AppState) => void;
  onReloadDemoData: () => void;
  onClearAllData: () => void;
}

export default function Settings({
  settings,
  onUpdateSettings,
  onExportBackup,
  onImportBackup,
  onReloadDemoData,
  onClearAllData,
}: SettingsProps) {
  const [formBusinessName, setFormBusinessName] = useState(settings.businessName);
  const [formManagerName, setFormManagerName] = useState(settings.managerName);
  const [formPhone, setFormPhone] = useState(settings.phone);
  const [formCardAccountNumber, setFormCardAccountNumber] = useState(settings.cardAccountNumber);
  const [formCardHolderName, setFormCardHolderName] = useState(settings.cardHolderName);
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: AppSettings = {
      ...settings,
      businessName: formBusinessName,
      managerName: formManagerName,
      phone: formPhone,
      cardAccountNumber: formCardAccountNumber,
      cardHolderName: formCardHolderName,
    };
    onUpdateSettings(updated);
    setShowSavedFeedback(true);
    setTimeout(() => setShowSavedFeedback(false), 3000);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const imported = JSON.parse(text) as AppState;
        
        // Basic schema verification
        if (imported && Array.isArray(imported.drivers) && Array.isArray(imported.invoices)) {
          onImportBackup(imported);
          alert('اطلاعات نسخه پشتیبان شما با موفقیت بازیابی و ثبت شد!');
        } else {
          alert('خطا: قالب فایل پشتیبان انتخابی نامعتبر می‌باشد.');
        }
      } catch (err) {
        alert('در خواندن فایل پشتیبان خطایی رخ داد. لطفاً مطمئن شوید فایل دارای فرمت JSON استاندارد باشد.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 text-right" dir="rtl" id="settings-view-panel">


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Settings Card Column */}
        <div className="lg:col-span-2 space-y-4">
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 pb-3 border-b border-slate-100">
              <Building className="h-5 w-5 text-blue-600" />
              اطلاعات عمومی و مشخصات باربری
            </h2>

            {showSavedFeedback && (
              <div className="p-3 bg-blue-50 border border-blue-200 text-blue-850 rounded-xl text-xs font-semibold flex items-center gap-2 animate-bounce">
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                تغییرات با موفقیت ذخیره و در فاکتورها اعمال گردید!
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Business Name */}
              <div className="space-y-1">
                <label className="block text-slate-500 font-semibold">نام موسسه / شرکت حمل‌ونقل <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={formBusinessName}
                  onChange={(e) => setFormBusinessName(e.target.value)}
                  placeholder="مثال: شرکت حمل و نقل سنگین البرز ترابر"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Manager Name */}
              <div className="space-y-1">
                <label className="block text-slate-500 font-semibold">نام و نام خانوادگی مدیریت <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={formManagerName}
                  onChange={(e) => setFormManagerName(e.target.value)}
                  placeholder="مثال: مهندس صفدری کرمانی"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Telephone */}
              <div className="space-y-1">
                <label className="block text-slate-500 font-semibold">شماره تماس پشتیبانی دفتر <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="مثال: 09121111111"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-mono text-left"
                />
              </div>

              {/* Card Number */}
              <div className="space-y-1">
                <label className="block text-slate-500 font-semibold">شماره کارت بانکی جهت درج در فاکتورها <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={formCardAccountNumber}
                  onChange={(e) => setFormCardAccountNumber(e.target.value)}
                  placeholder="مثال: ۶۰۳۷-۹۹۷۹-۱۲۳۴-۵۶۷۸"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-mono text-left"
                />
              </div>

              {/* Card holder Name */}
              <div className="space-y-1 sm:col-span-2">
                <label className="block text-slate-500 font-semibold">نام صاحب حساب کارت بانکی <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={formCardHolderName}
                  onChange={(e) => setFormCardHolderName(e.target.value)}
                  placeholder="مثال: البرز ترابر صفدری"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-all shadow-blue-200 shadow-xl"
                id="save-settings-btn"
              >
                <Save className="h-4 w-4 text-white" />
                ذخیره تنظیمات پروفایل
              </button>
            </div>
          </form>
        </div>

        {/* Database & Backup Actions Column */}
        <div className="space-y-4">
          {/* Backup Storage controls */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
              <Database className="h-5 w-5 text-blue-600" />
              مدیریت و بک‌آپ‌گیری از داده‌ها
            </h2>

            <p className="text-[11px] text-slate-500 leading-normal">
              سیستم به صورت آفلاین اطلاعات شما را در حافظه مرورگر کاملا ایمن ذخیره می‌کند. جهت اطمینان خاطر از عدم ریسک پاک شدن، می‌توانید به راحتی بک‌آپ تهیه کنید.
            </p>

            <div className="space-y-2.5 text-xs text-slate-700">
              {/* Export Backup button */}
              <button
                onClick={onExportBackup}
                className="w-full py-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-850 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Download className="h-4 w-4 text-blue-500" />
                دانلود فایل نسخه پشتیبان (.JSON)
              </button>

              {/* Import Backup file selector */}
              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  className="hidden"
                  id="import-backup-file-input"
                />
                <label
                  htmlFor="import-backup-file-input"
                  className="w-full py-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-850 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors animate-none"
                >
                  <Upload className="h-4 w-4 text-blue-600 font-bold" />
                  بازیابی از روی فایل بک‌آپ قدیمی
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
