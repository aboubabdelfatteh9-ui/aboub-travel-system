/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Customer, Trip, AgencySettings } from '../types';
import { Printer, Receipt, RotateCcw, Sparkles, Check, ChevronRight, FileText, User, HelpCircle } from 'lucide-react';

interface ReceiptVoucherProps {
  customers: Customer[];
  trips: Trip[];
  agencySettings: AgencySettings;
}

// Arabic Tafkeet (Number to Words) helper for Algerian Dinars
const tafkeet = (num: number): string => {
  if (num === 0) return 'صفر دينار جزائري';
  
  const units = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة', 'عشرة'];
  const teens = ['عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
  const tens = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
  const hundreds = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];
  const thousands = ['', 'ألف', 'ألفان', 'ثلاثة آلاف', 'أربعة آلاف', 'خمسة آلاف', 'ستة آلاف', 'سبعة آلاف', 'ثمانية آلاف', 'تسعة آلاف', 'عشرة آلاف'];

  const convertLessThanThousand = (n: number): string => {
    let result = '';
    const h = Math.floor(n / 100);
    const remainder = n % 100;
    const t = Math.floor(remainder / 10);
    const u = remainder % 10;

    if (h > 0) {
      result += hundreds[h];
    }

    if (remainder > 0) {
      if (result !== '') result += ' و ';
      if (remainder < 11) {
        result += units[remainder];
      } else if (remainder < 20) {
        result += teens[remainder - 10];
      } else {
        if (u > 0) {
          result += units[u] + ' و ';
        }
        result += tens[t];
      }
    }
    return result;
  };

  let output = '';
  
  const millions = Math.floor(num / 1000000);
  let remainder = num % 1000000;
  
  const thousandsGroup = Math.floor(remainder / 1000);
  const hundredsGroup = remainder % 1000;

  if (millions > 0) {
    if (millions === 1) output += 'مليون';
    else if (millions === 2) output += 'مليونان';
    else if (millions >= 3 && millions <= 10) output += convertLessThanThousand(millions) + ' ملايين';
    else output += convertLessThanThousand(millions) + ' مليون';
  }

  if (thousandsGroup > 0) {
    if (output !== '') output += ' و ';
    if (thousandsGroup === 1) output += 'ألف';
    else if (thousandsGroup === 2) output += 'ألفان';
    else if (thousandsGroup >= 3 && thousandsGroup <= 10) output += convertLessThanThousand(thousandsGroup) + ' آلاف';
    else output += convertLessThanThousand(thousandsGroup) + ' ألف';
  }

  if (hundredsGroup > 0) {
    if (output !== '') output += ' و ';
    output += convertLessThanThousand(hundredsGroup);
  }

  return output.trim() + ' دينار جزائري لا غير';
};

export const ReceiptVoucher: React.FC<ReceiptVoucherProps> = ({ customers, trips, agencySettings }) => {
  // Main form states matching the template exactly
  const [day, setDay] = useState('');
  const [voucherNo, setVoucherNo] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [amountInWords, setAmountInWords] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [birthDetails, setBirthDetails] = useState('');
  const [issuedAt, setIssuedAt] = useState('');
  const [treasurerTarget, setTreasurerTarget] = useState('أمين مال شركة عبوب للسياحة والأسفار');
  const [totalAgreedAmount, setTotalAgreedAmount] = useState('');
  
  // Customization & styling settings
  const [showHelper, setShowHelper] = useState(true);
  const [selectedCustId, setSelectedCustId] = useState('');

  // Auto load default values or current date
  useEffect(() => {
    const today = new Date();
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const currentDayName = days[today.getDay()];
    const formattedDate = today.toLocaleDateString('ar-DZ', { year: 'numeric', month: 'long', day: 'numeric' });
    
    // Set default day and issue dates if empty
    setDay(`${currentDayName} ${formattedDate}`);
    setIssuedAt(`تقرت في ${today.toLocaleDateString('ar-DZ', { year: 'numeric', month: '2-digit', day: '2-digit' })}`);
    
    // Generate a random-like or sequential number
    const randomNum = Math.floor(Math.random() * 900) + 100;
    setVoucherNo(`${randomNum}/${today.getFullYear()}`);
  }, []);

  // Sync state if agencySettings website name changes
  useEffect(() => {
    if (agencySettings.websiteName) {
      setTreasurerTarget(`أمين مال شركة ${agencySettings.websiteName.replace('وكالة ', '')}`);
    }
  }, [agencySettings.websiteName]);

  // Handle auto-filling based on existing customer selection
  const handleSelectCustomer = (custId: string) => {
    setSelectedCustId(custId);
    if (!custId) return;
    
    const cust = customers.find(c => c.id === custId);
    if (!cust) return;

    setCustomerName(cust.name || '');
    setNationalId(cust.nationalId || '');
    
    // Format birth details if we have birth date
    if (cust.birthDate) {
      const bDate = new Date(cust.birthDate);
      const formattedBirthDate = bDate.toLocaleDateString('ar-DZ', { year: 'numeric', month: '2-digit', day: '2-digit' });
      setBirthDetails(`${formattedBirthDate} بـ ${cust.birthPlace || 'تقرت'}`);
    } else {
      setBirthDetails(cust.birthPlace ? `بـ ${cust.birthPlace}` : '');
    }

    // Amount paid
    const paid = cust.paidAmount !== undefined ? cust.paidAmount : 0;
    setAmountPaid(paid > 0 ? paid.toString() : '');
    
    // Generate words automatically
    if (paid > 0) {
      setAmountInWords(tafkeet(paid));
    }

    // Total agreed amount
    // Get associated trip price
    const tripObj = trips.find(t => t.id === cust.tripId);
    const totalPrice = cust.totalPrice !== undefined 
      ? cust.totalPrice 
      : (cust.pricePerPerson || (tripObj ? tripObj.price : 0));
    setTotalAgreedAmount(totalPrice > 0 ? totalPrice.toString() : '');

    // Reset voucher number to something nice
    const cleanId = cust.id.replace('cust-', '').slice(0, 3).toUpperCase();
    const today = new Date();
    setVoucherNo(`${cleanId}/${today.getFullYear()}`);
  };

  // Trigger tafkeet calculation manually or when amountPaid changes
  const handleTafkeet = () => {
    const num = Number(amountPaid);
    if (!isNaN(num) && num > 0) {
      setAmountInWords(tafkeet(num));
    }
  };

  // Reset to empty template
  const handleReset = () => {
    if (window.confirm('هل أنت متأكد من رغبتك في إفراغ كافة حقول الوصل لبدء كتابة جديدة؟')) {
      setSelectedCustId('');
      setCustomerName('');
      setNationalId('');
      setBirthDetails('');
      setAmountPaid('');
      setAmountInWords('');
      setTotalAgreedAmount('');
      const today = new Date();
      setVoucherNo(`.../${today.getFullYear()}`);
    }
  };

  // Launch browser printing
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-1 sm:p-4 text-right">
      
      {/* Top action helper panel - hidden in printing */}
      <div className="bg-stone-50 border border-stone-200 p-4 rounded-3xl mb-6 shadow-sm print:hidden space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 text-zinc-950 rounded-2xl shadow-xs">
              <Receipt size={22} className="stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-sm font-black text-stone-850">مولد طباعة وصولات الاستلام المخصصة</h3>
              <p className="text-[10px] text-stone-500 font-bold mt-0.5">يمكنك ملء الحقول يدوياً أو اختيار زبون مسجل لملء البيانات تلقائياً، ثم طباعتها مباشرة.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer"
              title="إفراغ الحقول وكتابة جديد"
            >
              <RotateCcw size={13} />
              <span>إعادة تهيئة الحقول</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/10"
            >
              <Printer size={13} />
              <span>طباعة الوصل الفورية</span>
            </button>
          </div>
        </div>

        {/* Quick select client */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-stone-150 items-center">
          <div className="space-y-1 md:col-span-1">
            <label className="block text-[10px] font-bold text-stone-500">⚡ تعبئة سريعة من زبائن الوكالة:</label>
            <select
              value={selectedCustId}
              onChange={(e) => handleSelectCustomer(e.target.value)}
              className="w-full text-xs font-bold bg-white border border-stone-200 rounded-xl px-3 py-2 text-stone-750 focus:outline-none focus:border-amber-500"
            >
              <option value="">-- اختر زبوناً للملء التلقائي (اختياري) --</option>
              {customers.map(c => {
                const tripObj = trips.find(t => t.id === c.tripId);
                return (
                  <option key={c.id} value={c.id}>
                    {c.name} ({tripObj ? tripObj.name : 'رحلة غير معروفة'})
                  </option>
                );
              })}
            </select>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/15 rounded-2xl p-2.5 md:col-span-2 flex items-start gap-2 text-[10px] text-amber-900 font-bold">
            <Sparkles size={14} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span>ميزة التفقيط الذكي:</span> عند كتابة مبلغ التسديد بالأرقام (مثلاً 120000)، اضغط على زر <span className="bg-amber-500/20 px-1 py-0.5 rounded text-amber-950">تفقيط الحروف 🪄</span> لترجمة المبلغ فوراً إلى اللغة العربية الفصحى والدينار الجزائري لضمان جودة الوصل.
            </div>
          </div>
        </div>
      </div>

      {/* Editor & Preview Split Screen - Hidden in Print */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:hidden">
        
        {/* Left Side: Fields Form Editor */}
        <div className="lg:col-span-5 bg-white border border-stone-200 rounded-3xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-1.5 border-b border-stone-100 pb-3">
            <FileText size={16} className="text-stone-500" />
            <h4 className="text-xs font-black text-stone-800">بيانات وتفاصيل كتابة الوصل</h4>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-stone-500">في يوم:</label>
              <input
                type="text"
                value={day}
                onChange={(e) => setDay(e.target.value)}
                placeholder="مثال: الأربعاء 15 جويلية 2026"
                className="w-full text-xs font-bold px-3 py-2 border border-stone-200 rounded-xl focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-stone-500">وصل رقم:</label>
              <input
                type="text"
                value={voucherNo}
                onChange={(e) => setVoucherNo(e.target.value)}
                placeholder="مثال: 004/2026"
                className="w-full text-xs font-bold px-3 py-2 border border-stone-200 rounded-xl focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 items-end">
            <div className="space-y-1 col-span-2">
              <label className="block text-[10px] font-bold text-stone-500">مبلغ التسديد بالأرقام (د.ج):</label>
              <input
                type="number"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                placeholder="مثال: 150000"
                className="w-full text-xs font-black px-3 py-2 border border-stone-200 rounded-xl focus:border-amber-500 focus:outline-none font-mono"
              />
            </div>
            <button
              type="button"
              onClick={handleTafkeet}
              disabled={!amountPaid}
              className="py-2.5 px-2 bg-amber-500 hover:bg-amber-600 disabled:bg-stone-100 disabled:text-stone-400 text-zinc-950 font-black text-[10px] rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1 shrink-0 h-9.5"
            >
              <span>تفقيط الحروف 🪄</span>
            </button>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-stone-500">مبلغ التسديد بالحروف:</label>
            <input
              type="text"
              value={amountInWords}
              onChange={(e) => setAmountInWords(e.target.value)}
              placeholder="مثال: مائة وخمسون ألف دينار جزائري لا غير"
              className="w-full text-xs font-bold px-3 py-2 border border-stone-200 rounded-xl focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-stone-500">من طرف السيد/ة:</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="مثال: عبد الفتاح عبعوب"
              className="w-full text-xs font-bold px-3 py-2 border border-stone-200 rounded-xl focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-stone-500">رقم التعريف الوطني (NIN):</label>
            <input
              type="text"
              value={nationalId}
              onChange={(e) => setNationalId(e.target.value)}
              placeholder="مثال: 10123456789012"
              className="w-full text-xs font-bold px-3 py-2 border border-stone-200 rounded-xl focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-stone-500">تاريخ ومكان ميلاده:</label>
            <input
              type="text"
              value={birthDetails}
              onChange={(e) => setBirthDetails(e.target.value)}
              placeholder="مثال: 01/01/1985 بـ تقرت"
              className="w-full text-xs font-bold px-3 py-2 border border-stone-200 rounded-xl focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-stone-500">صادر في (مكان وتاريخ إصدار الوصل):</label>
            <input
              type="text"
              value={issuedAt}
              onChange={(e) => setIssuedAt(e.target.value)}
              placeholder="مثال: تقرت في 15/07/2026"
              className="w-full text-xs font-bold px-3 py-2 border border-stone-200 rounded-xl focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-stone-500">الجهة الموجه إليها الوصل (أمين مال):</label>
            <input
              type="text"
              value={treasurerTarget}
              onChange={(e) => setTreasurerTarget(e.target.value)}
              placeholder="مثال: أمين مال شركة عبوب للسياحة والأسفار"
              className="w-full text-xs font-bold px-3 py-2 border border-stone-200 rounded-xl focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-stone-500">إجمالي المبلغ المتفق عليه والمقدر بـ (د.ج):</label>
            <input
              type="text"
              value={totalAgreedAmount}
              onChange={(e) => setTotalAgreedAmount(e.target.value)}
              placeholder="مثال: 200000"
              className="w-full text-xs font-black px-3 py-2 border border-stone-200 rounded-xl focus:border-amber-500 focus:outline-none font-mono"
            />
          </div>
        </div>

        {/* Right Side: Interactive Preview in a nice mock paper layout */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between border-b border-stone-200 pb-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-black text-stone-750">معاينة مباشرة للوصل الورقي (جاهز للطباعة)</span>
            </div>
            <button
              onClick={handlePrint}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1 cursor-pointer"
            >
              <Printer size={12} />
              <span>معاينة الطباعة</span>
            </button>
          </div>

          <div className="bg-stone-100/50 p-6 rounded-3xl border border-stone-200 flex justify-center">
            {/* The actual component styled like a beautiful printable paper card */}
            <div className="bg-white w-[595px] min-h-[842px] max-w-full p-10 shadow-lg border border-stone-300 rounded-sm relative text-right flex flex-col justify-between font-sans leading-relaxed text-zinc-900 select-none">
              
              {/* Paper Watermark Ornament (Visual effect on preview, subtle) */}
              <div className="absolute inset-0 pointer-events-none border-[12px] border-double border-amber-500/10 m-3 rounded-xs"></div>
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.03]">
                <Receipt size={300} className="text-stone-900 stroke-[1.5]" />
              </div>

              {/* Header Content */}
              <div className="relative z-10">
                <div className="flex justify-between items-start border-b-2 border-stone-900 pb-5 mb-6">
                  {/* Left Header - English */}
                  <div className="text-left font-sans">
                    <h2 className="text-xs font-black text-zinc-900 uppercase tracking-tight">{agencySettings.websiteEnglishName || 'ABOUB TRAVEL & TOURISM'}</h2>
                    <p className="text-[8px] text-stone-500 font-bold tracking-wider mt-0.5">TRAVEL, TOURISM & TRANSPORTATION</p>
                    <p className="text-[7.5px] text-stone-400 font-mono font-medium mt-1">NIN: 00153901901844</p>
                  </div>

                  {/* Center Logo Placeholder */}
                  <div className="flex flex-col items-center">
                    {agencySettings.websiteLogoUrl ? (
                      <img
                        src={agencySettings.websiteLogoUrl}
                        alt="Logo"
                        className="w-12 h-12 object-cover rounded-xl"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center text-zinc-950 font-black text-lg shadow-sm">
                        ع
                      </div>
                    )}
                  </div>

                  {/* Right Header - Arabic */}
                  <div className="text-right">
                    <h1 className="text-sm font-black text-zinc-900">{agencySettings.websiteName || 'وكالة عبعوب للسياحة والأسفار'}</h1>
                    <p className="text-[9px] text-stone-500 font-bold mt-0.5">للـسـيـاحـة والأسـفـار والـنـقـل والـعـمـرة</p>
                    <p className="text-[8px] text-stone-400 font-bold mt-1">المكتب الرئيسي: حي عياد تبسبست، تقرت</p>
                  </div>
                </div>

                {/* Voucher Title */}
                <div className="flex justify-center my-6">
                  <div className="border-4 border-double border-stone-900 px-10 py-1.5 bg-stone-50/50">
                    <h3 className="text-base font-black text-stone-900 tracking-widest">وصــــــل اســـتــلام</h3>
                  </div>
                </div>

                {/* Date & Voucher No */}
                <div className="flex justify-between items-center bg-stone-50/80 px-4 py-2 border border-stone-200/60 rounded-xl mb-8 font-sans">
                  <div>
                    <span className="text-[11px] font-extrabold text-stone-500 ml-1">وصل رقم:</span>
                    <span className="text-xs font-black text-stone-900 font-mono bg-white px-2 py-0.5 border border-stone-150 rounded-md shadow-3xs">{voucherNo || '.................'}</span>
                  </div>
                  <div>
                    <span className="text-[11px] font-extrabold text-stone-500 ml-1">في يوم:</span>
                    <span className="text-xs font-bold text-stone-900 bg-white px-2.5 py-0.5 border border-stone-150 rounded-md shadow-3xs">{day || '...........................................'}</span>
                  </div>
                </div>

                {/* Receipt template body */}
                <div className="space-y-6 text-stone-850 text-xs font-medium leading-loose">
                  
                  {/* Amount Paid line */}
                  <div className="flex items-baseline flex-wrap gap-x-2">
                    <span className="font-extrabold text-stone-900 min-w-[130px] shrink-0">لقد تم تسديد مبلغ:</span>
                    <div className="flex-1 border-b border-dashed border-stone-400 px-2 font-black text-stone-900 font-mono text-sm bg-stone-50/30 rounded-xs">
                      {amountPaid ? `${Number(amountPaid).toLocaleString()} د.ج` : '........................................................................'}
                    </div>
                  </div>

                  {/* Amount In Words line */}
                  <div className="flex items-baseline flex-wrap gap-x-2">
                    <span className="font-extrabold text-stone-900 min-w-[130px] shrink-0">بالحروف:</span>
                    <div className="flex-1 border-b border-dashed border-stone-400 px-2 font-bold text-zinc-850">
                      {amountInWords || '.........................................................................................................................'}
                    </div>
                  </div>

                  {/* Mr/Ms line */}
                  <div className="flex items-baseline flex-wrap gap-x-2">
                    <span className="font-extrabold text-stone-900 min-w-[130px] shrink-0">من طرف السيد/ة:</span>
                    <div className="flex-1 border-b border-dashed border-stone-400 px-2 font-extrabold text-stone-900 text-sm">
                      {customerName || '.........................................................................................................................'}
                    </div>
                  </div>

                  {/* National ID line */}
                  <div className="flex items-baseline flex-wrap gap-x-2">
                    <span className="font-extrabold text-stone-900 min-w-[130px] shrink-0">رقم التعريف الوطني:</span>
                    <div className="flex-1 border-b border-dashed border-stone-400 px-2 font-bold font-mono text-zinc-800">
                      {nationalId || '.........................................................................................................................'}
                    </div>
                  </div>

                  {/* Birth date & place */}
                  <div className="flex items-baseline flex-wrap gap-x-2">
                    <span className="font-extrabold text-stone-900 min-w-[130px] shrink-0">تاريخ ومكان ميلاده:</span>
                    <div className="flex-1 border-b border-dashed border-stone-400 px-2 font-bold text-zinc-800">
                      {birthDetails || '.........................................................................................................................'}
                    </div>
                  </div>

                  {/* Issued at */}
                  <div className="flex items-baseline flex-wrap gap-x-2">
                    <span className="font-extrabold text-stone-900 min-w-[130px] shrink-0">صادر في:</span>
                    <div className="flex-1 border-b border-dashed border-stone-400 px-2 font-bold text-zinc-800">
                      {issuedAt || '.........................................................................................................................'}
                    </div>
                  </div>

                  {/* Target To (Treasurer) */}
                  <div className="flex items-baseline flex-wrap gap-x-2">
                    <span className="font-extrabold text-stone-900 min-w-[130px] shrink-0">إلى السيد:</span>
                    <div className="flex-1 border-b border-dashed border-stone-400 px-2 font-bold text-stone-800">
                      {treasurerTarget || '.........................................................................................................................'}
                    </div>
                  </div>

                  {/* Of total agreed amount */}
                  <div className="flex items-baseline flex-wrap gap-x-2 pt-2">
                    <span className="font-extrabold text-stone-900 min-w-[270px] shrink-0">من المبلغ الإجمالي، والمتفق عليه، والمقدر بـ:</span>
                    <div className="flex-1 border-b border-dashed border-stone-400 px-2 font-black text-stone-900 font-mono text-sm bg-stone-50/30 rounded-xs">
                      {totalAgreedAmount ? `${Number(totalAgreedAmount).toLocaleString()} د.ج` : '............................................................'}
                    </div>
                  </div>

                </div>
              </div>

              {/* Signatures Footer */}
              <div className="relative z-10 pt-16 grid grid-cols-2 gap-10">
                <div className="text-center space-y-6">
                  <span className="font-black text-xs text-stone-900 border-b border-stone-300 pb-1 px-4">توقيع أمين مال الشركة</span>
                  <div className="h-16 flex items-center justify-center">
                    <span className="text-[10px] text-stone-300 italic">الختم والتوقيع الرسمي</span>
                  </div>
                </div>

                <div className="text-center space-y-6">
                  <span className="font-black text-xs text-stone-900 border-b border-stone-300 pb-1 px-4">توقيع المعني</span>
                  <div className="h-16 flex items-center justify-center">
                    <span className="text-[10px] text-stone-300 italic">بصمة أو توقيع المسدد</span>
                  </div>
                </div>
              </div>

              {/* Fine Print Footer */}
              <div className="relative z-10 border-t border-stone-200 pt-4 mt-8 flex justify-between text-[7.5px] text-stone-400 font-bold select-none leading-none">
                <span>شركة عبوب للسياحة والأسفار • نسخة حوسبة رقمية</span>
                <span>تاريخ التوليد: {new Date().toLocaleDateString('ar-DZ')}</span>
              </div>

            </div>
          </div>
        </div>

      </div>

      {/* Pure Print-Only Layout, optimized to fit on standard paper sizes and completely hide browser margins and web elements */}
      <div className="hidden print:block text-right text-zinc-900 bg-white" style={{ direction: 'rtl' }}>
        <div className="bg-white w-[100%] mx-auto p-2 relative" style={{ minHeight: 'auto' }}>
          
          <div className="flex justify-between items-start border-b-2 border-stone-900 pb-4 mb-4">
            <div className="text-left">
              <h2 className="text-[10px] font-black text-zinc-900 uppercase tracking-tight">{agencySettings.websiteEnglishName || 'ABOUB TRAVEL & TOURISM'}</h2>
              <p className="text-[7px] text-stone-500 font-bold tracking-wider">TRAVEL, TOURISM & TRANSPORTATION</p>
              <p className="text-[7px] text-stone-400 font-mono font-medium">NIN: 00153901901844</p>
            </div>

            <div className="flex flex-col items-center">
              {agencySettings.websiteLogoUrl ? (
                <img
                  src={agencySettings.websiteLogoUrl}
                  alt="Logo"
                  className="w-10 h-10 object-cover rounded-lg"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center text-zinc-950 font-black text-sm">
                  ع
                </div>
              )}
            </div>

            <div className="text-right">
              <h1 className="text-xs font-black text-zinc-900">{agencySettings.websiteName || 'وكالة عبعوب للسياحة والأسفار'}</h1>
              <p className="text-[8px] text-stone-500 font-bold">للـسـيـاحـة والأسـفـار والـنـقـل والـعـمـرة</p>
              <p className="text-[7px] text-stone-400 font-bold">المكتب الرئيسي: حي عياد تبسبست، تقرت</p>
            </div>
          </div>

          <div className="flex justify-center my-4">
            <div className="border-4 border-double border-stone-900 px-8 py-1 bg-stone-50">
              <h3 className="text-sm font-black text-stone-900 tracking-widest">وصــــــل اســـتــلام</h3>
            </div>
          </div>

          <div className="flex justify-between items-center bg-stone-50 px-4 py-1.5 border border-stone-200 rounded-lg mb-6 text-[10px]">
            <div>
              <span className="font-extrabold text-stone-500 ml-1">وصل رقم:</span>
              <span className="font-black text-stone-950 font-mono bg-white px-2 py-0.5 border border-stone-150 rounded">{voucherNo || '.................'}</span>
            </div>
            <div>
              <span className="font-extrabold text-stone-500 ml-1">في يوم:</span>
              <span className="font-bold text-stone-950 bg-white px-2 py-0.5 border border-stone-150 rounded">{day || '...........................................'}</span>
            </div>
          </div>

          <div className="space-y-4 text-stone-950 text-[10.5px] leading-loose">
            
            <div className="flex items-baseline flex-wrap gap-x-2">
              <span className="font-extrabold min-w-[120px] shrink-0">لقد تم تسديد مبلغ:</span>
              <div className="flex-1 border-b border-dashed border-stone-500 px-2 font-black text-sm">
                {amountPaid ? `${Number(amountPaid).toLocaleString()} د.ج` : '........................................................................'}
              </div>
            </div>

            <div className="flex items-baseline flex-wrap gap-x-2">
              <span className="font-extrabold min-w-[120px] shrink-0">بالحروف:</span>
              <div className="flex-1 border-b border-dashed border-stone-500 px-2 font-bold">
                {amountInWords || '.........................................................................................................................'}
              </div>
            </div>

            <div className="flex items-baseline flex-wrap gap-x-2">
              <span className="font-extrabold min-w-[120px] shrink-0">من طرف السيد/ة:</span>
              <div className="flex-1 border-b border-dashed border-stone-500 px-2 font-extrabold text-xs">
                {customerName || '.........................................................................................................................'}
              </div>
            </div>

            <div className="flex items-baseline flex-wrap gap-x-2">
              <span className="font-extrabold min-w-[120px] shrink-0">رقم التعريف الوطني:</span>
              <div className="flex-1 border-b border-dashed border-stone-500 px-2 font-bold font-mono">
                {nationalId || '.........................................................................................................................'}
              </div>
            </div>

            <div className="flex items-baseline flex-wrap gap-x-2">
              <span className="font-extrabold min-w-[120px] shrink-0">تاريخ ومكان ميلاده:</span>
              <div className="flex-1 border-b border-dashed border-stone-500 px-2 font-bold">
                {birthDetails || '.........................................................................................................................'}
              </div>
            </div>

            <div className="flex items-baseline flex-wrap gap-x-2">
              <span className="font-extrabold min-w-[120px] shrink-0">صادر في:</span>
              <div className="flex-1 border-b border-dashed border-stone-500 px-2 font-bold">
                {issuedAt || '.........................................................................................................................'}
              </div>
            </div>

            <div className="flex items-baseline flex-wrap gap-x-2">
              <span className="font-extrabold min-w-[120px] shrink-0">إلى السيد:</span>
              <div className="flex-1 border-b border-dashed border-stone-500 px-2 font-bold">
                {treasurerTarget || '.........................................................................................................................'}
              </div>
            </div>

            <div className="flex items-baseline flex-wrap gap-x-2 pt-2">
              <span className="font-extrabold min-w-[240px] shrink-0">من المبلغ الإجمالي، والمتفق عليه، والمقدر بـ:</span>
              <div className="flex-1 border-b border-dashed border-stone-500 px-2 font-black text-xs">
                {totalAgreedAmount ? `${Number(totalAgreedAmount).toLocaleString()} د.ج` : '............................................................'}
              </div>
            </div>

          </div>

          <div className="pt-12 grid grid-cols-2 gap-10">
            <div className="text-center space-y-4">
              <span className="font-black text-[10px] border-b border-stone-300 pb-0.5 px-3">توقيع أمين مال الشركة</span>
              <div className="h-12 flex items-center justify-center">
                <span className="text-[8px] text-stone-400 italic">الختم والتوقيع</span>
              </div>
            </div>

            <div className="text-center space-y-4">
              <span className="font-black text-[10px] border-b border-stone-300 pb-0.5 px-3">توقيع المعني</span>
              <div className="h-12 flex items-center justify-center">
                <span className="text-[8px] text-stone-400 italic">البصمة أو التوقيع</span>
              </div>
            </div>
          </div>

          <div className="border-t border-stone-300 pt-2 mt-6 flex justify-between text-[6.5px] text-stone-400 font-bold">
            <span>شركة عبوب للسياحة والأسفار • الهاتف: 0667910148 / 0696789633</span>
            <span>تاريخ الطباعة: {new Date().toLocaleDateString('ar-DZ')}</span>
          </div>

        </div>
      </div>

    </div>
  );
};
