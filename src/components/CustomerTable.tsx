/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Customer, Trip } from '../types';
import { 
  Search, 
  Edit2, 
  Trash2, 
  Printer, 
  X, 
  Save, 
  Building2, 
  HelpCircle, 
  Sparkles
} from 'lucide-react';
import { calculateAge, getRoomOptionsForTrip } from './CustomerForm';

interface CustomerTableProps {
  customers: Customer[];
  trips: Trips[];
  onDeleteCustomer: (id: string) => void;
  onUpdateCustomer: (customer: Customer) => void;
  onPrintCustomer: (customer: Customer) => void;
}

type Trips = Trip;

export const CustomerTable: React.FC<CustomerTableProps> = ({
  customers,
  trips,
  onDeleteCustomer,
  onUpdateCustomer,
  onPrintCustomer,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Helper to find trip by ID
  const getTripName = (tripId: string) => {
    const trip = trips.find((t) => t.id === tripId);
    return trip ? trip.name : 'رحلة غير معروفة';
  };

  // Helper to show role badge
  const getRoleBadge = (role?: 'tourist' | 'organizer' | 'driver') => {
    if (role === 'organizer') {
      return (
        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded">
          👔 المؤطر (مجانا)
        </span>
      );
    }
    if (role === 'driver') {
      return (
        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded">
          🚌 السائق (مجانا)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded">
        👤 سائح
      </span>
    );
  };

  // Helper for Payment Status Badges
  const getPaymentStatusBadge = (status?: 'paid' | 'partial' | 'unpaid') => {
    if (status === 'paid') {
      return (
        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-750 border border-emerald-200 text-[10px] font-extrabold px-2.5 py-1 rounded-full select-none shadow-3xs">
          🟢 مدفوع كامل
        </span>
      );
    }
    if (status === 'partial') {
      return (
        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-750 border border-amber-200 text-[10px] font-extrabold px-2.5 py-1 rounded-full select-none shadow-3xs">
          🟡 دفعة جزئية
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-750 border border-rose-200 text-[10px] font-extrabold px-2.5 py-1 rounded-full select-none shadow-3xs">
        🔴 غير مدفوع
      </span>
    );
  };

  // Filter customers
  const filteredCustomers = customers.filter((customer) => {
    const cleanSearch = searchTerm.toLowerCase().trim();
    if (!cleanSearch) return true;

    const leaderFullName = `${customer.firstName} ${customer.lastName}`.toLowerCase();
    const phoneMatches = customer.phone.includes(cleanSearch);
    const invoiceMatches = customer.invoiceNumber.toLowerCase().includes(cleanSearch);
    
    const companionMatches = (customer.companions || []).some(comp => {
      const companionFullName = `${comp.firstName} ${comp.lastName}`.toLowerCase();
      return companionFullName.includes(cleanSearch);
    });

    return (
      leaderFullName.includes(cleanSearch) ||
      phoneMatches ||
      invoiceMatches ||
      companionMatches
    );
  });

  // Handle Save in Editing Mode
  const handleEditSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCustomer) {
      if (!editingCustomer.firstName.trim() || !editingCustomer.lastName.trim()) {
        alert('الرجاء إدخال اسم المسؤول ولقبه بشكل صحيح');
        return;
      }
      
      const computedAge = calculateAge(editingCustomer.birthDate);
      onUpdateCustomer({
        ...editingCustomer,
        age: computedAge,
        peopleCount: (editingCustomer.companions || []).length + 1,
      });
      setEditingCustomer(null);
    }
  };

  const formatBirthInfo = (birthDate: string, birthPlace: string) => {
    if (!birthDate) return 'غير محدد';
    return `${birthDate} (${birthPlace || 'غير محدد'})`;
  };

  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    return new Date(a.registrationDate).getTime() - new Date(b.registrationDate).getTime();
  });

  const editingTripObj = editingCustomer ? (trips.find(t => t.id === editingCustomer.tripId) || trips[0]) : null;
  const editingRoomOptions = editingTripObj ? getRoomOptionsForTrip(editingTripObj.id, editingTripObj.price) : [];

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-6" dir="rtl">
      
      {/* Search Header Container - Premium Styling */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-stone-100 pb-6">
        <div className="space-y-1 text-right">
          <div className="flex items-center gap-2 justify-start">
            <span className="w-1.5 h-4 bg-amber-500 rounded-full"></span>
            <h3 className="font-sans font-extrabold text-zinc-900 text-sm md:text-base tracking-tight">سجل كشوفات الحجوزات العائلية والمسافرين</h3>
          </div>
          <p className="text-[11px] text-stone-500 font-sans mt-0.5">ابحث بالاسم، اللقب، رقم الحجز أو أسماء المرافقين</p>
        </div>

        {/* Premium search input with sleek amber/gold glow */}
        <div className="relative md:w-80 group">
          <input
            type="text"
            placeholder="البحث السريع في السجلات المبرمة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-11 py-3 bg-stone-50/50 hover:bg-stone-50/80 border border-stone-200 rounded-xl text-xs font-bold text-stone-800 placeholder-stone-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/80 transition-all duration-300 text-right shadow-3xs hover:border-stone-300"
          />
          <Search size={14} className="absolute right-4 top-3.5 text-stone-400 group-focus-within:text-amber-600 transition-colors duration-300" />
        </div>
      </div>

      {/* Results Count Descriptor */}
      <div className="flex justify-between items-center text-xs text-stone-500 font-medium">
        <span>مجموع الحجوزات المفلترة: <strong className="text-amber-700 font-bold">{sortedCustomers.length} حجز عائلي</strong></span>
        {searchTerm && <button onClick={() => setSearchTerm('')} className="text-amber-600 hover:underline cursor-pointer">إلغاء التصفية ❌</button>}
      </div>

      {sortedCustomers.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-stone-200 rounded-2xl bg-stone-50/30 space-y-2">
          <HelpCircle size={36} className="mx-auto text-stone-300 animate-pulse" />
          <h4 className="font-sans font-bold text-stone-700 text-sm">لم يتم العثور على أي حجز مطابق!</h4>
          <p className="text-stone-500 text-[11px]">جرب البحث بكلمة أو رقم حجز مختلف أو تفاصيل حجز أخرى.</p>
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* Desktop Luxury Dossiers Register - Beautifully Organized on Large Screens */}
          <div className="hidden lg:block space-y-4">
            
            {/* List of Luxury Cards */}
            <div className="space-y-5">
              {sortedCustomers.map((customer) => {
                const currentTrip = trips.find(t => t.id === customer.tripId);
                const showTotalPrice = customer.totalPrice !== undefined ? customer.totalPrice : (currentTrip ? currentTrip.price : 0);
                const companionCount = (customer.companions || []).length;
                const totalCount = companionCount + 1;

                return (
                  <div 
                    key={customer.id} 
                    className="bg-white border border-stone-200 rounded-2xl shadow-sm hover:border-amber-500/30 hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col group"
                  >
                    {/* Inner Card Top Header */}
                    <div className="bg-stone-50 border-b border-stone-100 px-5 py-3 flex items-center justify-between font-sans">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-black bg-zinc-900 text-amber-400 border border-zinc-950 px-3 py-1 rounded-lg shadow-3xs select-all">
                          رقم الحجز: {customer.invoiceNumber}
                        </span>
                        <span className="text-[11px] text-stone-500 font-bold font-mono">
                          📅 تاريخ التسجيل: {new Date(customer.registrationDate).toLocaleDateString('ar-DZ')}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {getPaymentStatusBadge(customer.paymentStatus)}
                        {customer.bookingType === 'individual' ? (
                          <span className="bg-amber-50 text-amber-800 border border-amber-200/50 px-2.5 py-1 rounded-lg text-[10px] font-black shadow-3xs">
                            👤 حجز مستقل
                          </span>
                        ) : (
                          <span className="bg-blue-50 text-blue-800 border border-blue-200/50 px-2.5 py-1 rounded-lg text-[10px] font-black shadow-3xs">
                            👨‍👩‍👧‍👦 حجز عائلي ({totalCount} أفراد)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Content Grid */}
                    <div className="p-5 grid grid-cols-12 gap-6 items-stretch divide-x divide-x-reverse divide-stone-100">
                      
                      {/* Section 1: Lead Customer Details (col-span-4) */}
                      <div className="col-span-4 space-y-3.5 pr-1">
                        <div>
                          <span className="text-[10px] text-stone-400 font-extrabold block mb-1 uppercase tracking-wider">الزبون الرئيسي (المسؤول)</span>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-sans font-black text-stone-900 text-sm leading-tight">
                              {customer.lastName} {customer.firstName}
                            </h4>
                            {getRoleBadge(customer.role)}
                          </div>
                        </div>

                        <div className="text-[11px] text-stone-605 space-y-2 font-sans pt-1">
                          <div className="flex items-center gap-1.5 text-stone-605">
                            <span className="text-stone-400">🎂 الميلاد والسن:</span>
                            <span className="font-bold text-stone-800">{formatBirthInfo(customer.birthDate, customer.birthPlace)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 pt-1">
                            <span className="inline-flex items-center gap-1 bg-amber-50/75 text-amber-900 font-mono font-black px-2.5 py-1 rounded-lg border border-amber-500/10 shadow-3xs text-[10.5px]">
                              📞 {customer.phone}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Section 2: Companions and Family Members list (col-span-4) */}
                      <div className="col-span-4 space-y-3.5 pr-5">
                        <span className="text-[10px] text-stone-400 font-extrabold block mb-1 uppercase tracking-wider">أفراد العائلة والمرافقين بالملف</span>
                        {companionCount > 0 ? (
                          <div className="flex flex-wrap gap-1.5 max-h-[85px] overflow-y-auto pr-0.5 custom-scrollbar">
                            {customer.companions.map((cmp) => (
                              <span 
                                key={cmp.id} 
                                className="inline-flex items-center gap-1 bg-stone-50 text-stone-700 text-[10px] px-2 py-0.8 rounded-lg border border-stone-200 font-sans shadow-3xs"
                              >
                                <span className="text-amber-700 font-black text-[8px] bg-amber-50/80 px-1 py-0.1 border border-amber-200 rounded shrink-0">
                                  {cmp.relationship}
                                </span>
                                <span className="font-bold text-stone-900">{cmp.firstName}</span>
                                <span className="text-stone-450 font-mono text-[8.5px] shrink-0">({calculateAge(cmp.birthDate)} سنة)</span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div className="text-[11px] text-stone-400 italic font-medium pt-1">
                            سائح مستقل لوحده في الفندق (لا يوجد مرافقون).
                          </div>
                        )}
                      </div>

                      {/* Section 3: Travel Program & Lodging assignment (col-span-4) */}
                      <div className="col-span-4 space-y-3.5 pr-5 flex flex-col justify-between">
                        <div className="space-y-1.5">
                          <span className="text-[10px] text-stone-400 font-extrabold block uppercase tracking-wider">برنامج السفر والمسار المبرمج</span>
                          <strong className="text-stone-900 text-xs font-black leading-tight block">
                            {getTripName(customer.tripId)}
                          </strong>
                          {currentTrip && (
                            <div className="text-[10px] text-stone-500 font-mono font-bold space-y-0.5 pt-0.5">
                              <span className="block">⏳ مدة المغامرة: {currentTrip.duration}</span>
                              <span className="block text-blue-600">🛫 موعد الاقلاع المرتقب: {customer.departureDate || currentTrip.date}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between border-t border-stone-100 pt-2.5 mt-2.5">
                          <div>
                            <span className="text-[9px] text-stone-450 block font-bold">نوع الغرفة المبرمج:</span>
                            <span className="inline-flex items-center gap-1 text-[10.5px] text-amber-850 font-black bg-amber-50/85 px-2.5 py-0.8 rounded-lg border border-amber-500/10 shadow-3xs mt-1 leading-none">
                              🏠 {customer.roomType || 'غرفة قياسية'}
                            </span>
                          </div>

                          <div className="text-left">
                            <span className="text-[9px] text-stone-450 block font-bold text-left">التكلفة والوضعية المالية:</span>
                            <div className="text-center font-mono font-black text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-500/15 text-[11px] inline-block shadow-3xs tracking-tight mt-1">
                              💵 {showTotalPrice.toLocaleString('ar-DZ')} دج
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Padded Footer Bar containing Administrative note & Action buttons */}
                    <div className="bg-[#FAF9F6] border-t border-stone-200/60 px-5 py-3 flex flex-row items-center justify-between gap-4">
                      
                      {/* Left side: Client administrative comment */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold text-stone-400 uppercase tracking-tight shrink-0">ملاحظات الملف:</span>
                        {customer.notes ? (
                          <p className="text-[11px] text-stone-750 bg-amber-500/5 px-3 py-1 rounded-lg border border-amber-500/10 max-w-[280px] xl:max-w-[480px] truncate leading-tight font-sans font-bold text-right" title={customer.notes}>
                            ⚠️ {customer.notes}
                          </p>
                        ) : (
                          <p className="text-[10.5px] text-stone-500 font-bold font-sans">
                            ✔️ معالجة مستوفية، والبيانات والملفات مكتملة.
                          </p>
                        )}
                      </div>

                      {/* Right side: Action operational buttons (Fully prominent and responsive) */}
                      <div className="flex items-center gap-2 px-1">
                        
                        {/* Print Receipt Button */}
                        <button
                          onClick={() => onPrintCustomer(customer)}
                          id={`btn-print-invoice-dossier-${customer.id}`}
                          className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl px-4 py-2 font-black text-xs shadow-3xs active:scale-[0.97] transition-all cursor-pointer border border-amber-650 flex items-center gap-1.5 shrink-0"
                          title="طباعة التذكرة ووصل الاستلام الكلي للملف"
                        >
                          <Printer size={13} className="stroke-[2.5]" />
                          <span>طباعة وصل الحجز</span>
                        </button>

                        {/* Edit Record Button */}
                        <button
                          onClick={() => setEditingCustomer(customer)}
                          id={`btn-edit-details-dossier-${customer.id}`}
                          className="bg-stone-900 hover:bg-stone-950 text-white rounded-xl px-4 py-2 font-black text-xs shadow-3xs active:scale-[0.97] transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                          title="تعديل بيانات الحجز والمبالغ المدفوعة"
                        >
                          <Edit2 size={13} className="stroke-[2.5]" />
                          <span>تعديل السجل</span>
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => setDeleteConfirmId(customer.id)}
                          id={`btn-delete-res-dossier-${customer.id}`}
                          className="bg-white hover:bg-rose-50 text-stone-550 hover:text-rose-600 rounded-xl px-3 py-2 border border-stone-200 hover:border-rose-200 cursor-pointer shadow-3xs transition-all active:scale-[0.97] flex items-center gap-1.5 font-bold text-xs shrink-0"
                          title="حذف ملف الحجز"
                        >
                          <Trash2 size={13} className="stroke-[2.5]" />
                          <span>حذف</span>
                        </button>

                      </div>

                    </div>

                  </div>
                );
              })}
            </div>
          </div>

          {/* Unified mobile user-interface responsive cards - Styled perfectly */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:hidden gap-4">
            {sortedCustomers.map((customer) => {
              const currentTrip = trips.find(t => t.id === customer.tripId);
              const showTotalPrice = customer.totalPrice !== undefined ? customer.totalPrice : (currentTrip ? currentTrip.price : 0);
              const companionCount = (customer.companions || []).length;
              const totalCount = companionCount + 1;

              return (
                <div key={customer.id} className="border border-stone-200 rounded-2xl p-4 bg-white hover:bg-stone-50/50 transition-all text-right relative space-y-4 shadow-3xs font-sans">
                  
                  {/* Card Title Header with Payment Badge and Invoice */}
                  <div className="flex items-center justify-between border-b border-stone-200/40 pb-2.5 font-sans">
                    <span className="font-mono text-[10px] font-black bg-stone-900 text-white border border-stone-950 px-2.5 py-0.5 rounded-lg shadow-3xs">
                      رقم الحجز: {customer.invoiceNumber}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {getPaymentStatusBadge(customer.paymentStatus)}
                    </div>
                  </div>

                  {/* Leader Info */}
                  <div className="space-y-1 bg-stone-50/60 p-3 rounded-xl border border-stone-200/40">
                    <span className="text-[9px] text-stone-400 block font-black leading-none">رب العائلة / المسؤول:</span>
                    <h4 className="font-extrabold text-[#1C1917] text-sm leading-tight pt-1">
                      {customer.firstName} {customer.lastName}
                    </h4>
                    <div className="text-[10px] text-stone-500 font-medium space-y-1 pt-1.5 font-sans">
                      <div>🎂 {customer.birthDate} ({customer.birthPlace})</div>
                      <div className="inline-flex items-center gap-1 bg-stone-100 font-mono font-bold text-stone-700 px-2 py-0.5 rounded-md border border-stone-200 shadow-3xs mt-1">
                        📞 {customer.phone}
                      </div>
                      <div className="pt-2">{getRoleBadge(customer.role)}</div>
                    </div>
                  </div>

                  {/* Companions Sub-block */}
                  <div className="p-3 rounded-xl border border-stone-200/80 bg-stone-50/50 space-y-2 text-[10px]">
                    <div className="flex justify-between items-center text-stone-700 font-bold border-b border-stone-200/60 pb-1 mb-1.5 border-stone-150/80">
                      <span>👤 الأفراد والعائلة المرافقة:</span>
                      <span className="font-mono text-stone-900 font-extrabold">{totalCount} مسافرين</span>
                    </div>

                    {companionCount > 0 ? (
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                        {customer.companions.map((cmp) => (
                          <span key={cmp.id} className="inline-flex items-center gap-1.5 bg-white text-stone-700 text-[9px] px-2 py-1 rounded-md border border-stone-200 shadow-3xs font-medium">
                            <span className="text-amber-700 font-bold bg-amber-50/60 px-1 py-0.2 rounded border border-amber-200 shrink-0">{cmp.relationship}</span>
                            <span>{cmp.firstName}</span>
                            <span className="text-stone-400 shrink-0">({calculateAge(cmp.birthDate)}س)</span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[10px] text-stone-400 italic block">سائح فردي (بدون مرافقين)</span>
                    )}
                  </div>

                  {/* Voyage and price detail */}
                  <div className="text-xs space-y-1.5 text-stone-600 bg-stone-50/30 p-3 rounded-xl border border-stone-200/50">
                    <div>
                      <span className="text-stone-400 block text-[9px] font-black pb-0.5">البرنامج السياحي المتعاقد عليه:</span>
                      <strong className="text-[#1C1917] text-xs font-extrabold leading-normal">{getTripName(customer.tripId)}</strong>
                    </div>
                    {customer.roomType && (
                      <div className="text-[10px] text-amber-800 font-bold bg-amber-50 inline-block px-2 py-0.5 rounded border border-amber-500/10 mt-1">
                        🏠 {customer.roomType}
                      </div>
                    )}
                  </div>

                  {/* Financial calculation summary bar */}
                  <div className="flex justify-between items-center bg-[#FAF8F5] p-3 border border-stone-205 border-stone-200 rounded-xl text-xs">
                    <span className="font-bold text-stone-600 font-sans">إجمالي مدفوعات المعاملة:</span>
                    <strong className="font-mono font-black text-amber-900 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                      {showTotalPrice.toLocaleString('ar-DZ')} دج
                    </strong>
                  </div>

                  {/* Responsive bottom card actions with proper labels */}
                  <div className="flex items-center gap-2 pt-2.5 border-t border-stone-100">
                    <button
                      onClick={() => onPrintCustomer(customer)}
                      id={`mob-btn-print-${customer.id}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-extrabold cursor-pointer transition-all border border-amber-650 shadow-3xs"
                    >
                      <Printer size={12} />
                      طباعة الوصل
                    </button>
                    <button
                      onClick={() => setEditingCustomer(customer)}
                      id={`mob-btn-edit-${customer.id}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-stone-900 hover:bg-stone-950 text-white rounded-lg text-[11px] font-extrabold border border-stone-950 cursor-pointer transition-all shadow-3xs"
                    >
                      <Edit2 size={11} />
                      تعديل الحجز
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(customer.id)}
                      id={`mob-btn-delete-${customer.id}`}
                      className="p-2 bg-stone-50 hover:bg-rose-50 text-rose-500 hover:text-rose-700 rounded-lg border border-stone-200 cursor-pointer transition-all flex items-center justify-center shadow-3xs"
                      title="حذف السجل"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* 2. CUSTOM FAMILY EDIT MODAL */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C1917]/35 backdrop-blur-xs font-sans">
          <div className="bg-white rounded-2xl border border-stone-200 max-w-lg w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-155 max-h-[90vh] overflow-y-auto" dir="rtl">
            
            <button
              onClick={() => setEditingCustomer(null)}
              id="modal-close"
              className="absolute top-4 left-4 p-1 rounded-full text-stone-400 bg-stone-50 hover:bg-stone-100 hover:text-stone-600 transition-colors cursor-pointer border border-stone-200"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-2 border-b border-stone-100 pb-3 mb-4 justify-start">
              <Sparkles className="text-amber-600 animate-pulse" size={16} />
              <h3 className="font-extrabold text-zinc-900 text-sm md:text-base">تعديل بيانات الحجز المالي والعشيرة</h3>
            </div>

            <form onSubmit={handleEditSave} className="space-y-4 text-right text-xs">
              
              {/* Leader Full Name */}
              <div className="grid grid-cols-2 gap-3 bg-stone-50/60 p-3.5 rounded-xl border border-stone-200/60">
                <div className="col-span-2 text-stone-800 font-extrabold text-[10px] pb-1 border-b border-stone-200/40 mb-1 flex items-center gap-1.5 justify-start">
                  <span>👤 معلومات الكفيل الأساسي:</span>
                </div>
                <div>
                  <label htmlFor="edit-firstName" className="block text-[10px] font-bold text-stone-600 mb-1">الاسم الأول المسؤول</label>
                  <input
                     type="text"
                     id="edit-firstName"
                     value={editingCustomer.firstName}
                     onChange={(e) => setEditingCustomer({ ...editingCustomer, firstName: e.target.value })}
                     className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs bg-white font-medium focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/80 transition-all text-stone-800"
                     required
                  />
                </div>
                <div>
                  <label htmlFor="edit-lastName" className="block text-[10px] font-bold text-stone-600 mb-1">اللقب الكلي</label>
                  <input
                    type="text"
                    id="edit-lastName"
                    value={editingCustomer.lastName}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs bg-white font-medium focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/80 transition-all text-stone-800"
                    required
                  />
                </div>
              </div>

              {/* Phone, birth info */}
              <div className="grid grid-cols-2 gap-3 bg-[#FAF8F5]/80 p-3.5 rounded-xl border border-stone-200/60">
                <div>
                  <label htmlFor="edit-phone" className="block text-[10px] font-bold text-stone-600 mb-1">رقم الهاتف</label>
                  <input
                    type="text"
                    id="edit-phone"
                    value={editingCustomer.phone}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs bg-white font-mono text-left focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/80 transition-all font-bold text-stone-850"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="edit-birthPlace" className="block text-[10px] font-bold text-stone-600 mb-1">مكان الولادة (الولاية)</label>
                  <input
                    type="text"
                    id="edit-birthPlace"
                    value={editingCustomer.birthPlace}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, birthPlace: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs bg-white font-medium focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/80 transition-all text-stone-800"
                    required
                  />
                </div>
              </div>

              {/* Trip Selection & Accommodation */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-[#FAF8F5]/80 p-3.5 rounded-xl border border-stone-200/60">
                <div className="md:col-span-1">
                  <label htmlFor="edit-trip" className="block text-[10px] font-bold text-stone-600 mb-1">البرنامج السياحي</label>
                  <select
                    id="edit-trip"
                    value={editingCustomer.tripId}
                    onChange={(e) => {
                      const newTripId = e.target.value;
                      const selectedTrip = trips.find(t => t.id === newTripId);
                      setEditingCustomer({ 
                        ...editingCustomer, 
                        tripId: newTripId,
                        departureDate: selectedTrip ? selectedTrip.date : '' 
                      });
                    }}
                    className="w-full px-2.5 py-2 border border-stone-200 bg-white rounded-lg text-xs font-bold text-stone-800 focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/80 cursor-pointer font-sans"
                  >
                    {trips.map((trip) => (
                      <option key={trip.id} value={trip.id}>
                        {trip.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="edit-departureDate" className="block text-[10px] font-bold text-stone-600 mb-1">تاريخ المغادرة المحدد</label>
                  <select
                    id="edit-departureDate"
                    value={editingCustomer.departureDate || (editingTripObj ? editingTripObj.date : '')}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, departureDate: e.target.value })}
                    className="w-full px-2.5 py-2 border border-stone-200 bg-white rounded-lg text-xs font-bold text-stone-800 focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/80 cursor-pointer font-sans"
                  >
                    {editingTripObj && Array.from(new Set([editingTripObj.date, ...(editingTripObj.dates || [])])).filter(Boolean).map((d, i) => (
                      <option key={i} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="edit-roomType" className="block text-[10px] font-bold text-stone-600 mb-1">الإقامة الفندقية</label>
                  <select
                    id="edit-roomType"
                    value={editingCustomer.roomType || ''}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, roomType: e.target.value })}
                    className="w-full px-2.5 py-2 border border-stone-200 bg-white rounded-lg text-xs font-bold text-stone-800 focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/80 cursor-pointer font-sans"
                  >
                    {editingRoomOptions.map((opt, i) => (
                      <option key={i} value={opt.label}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Total Price paid and Status editing */}
              <div className="grid grid-cols-2 gap-3 bg-amber-500/[0.03] p-3.5 rounded-xl border border-amber-500/20 shadow-3xs">
                <div className="col-span-2 text-amber-850 font-extrabold text-[10px] border-b border-amber-200/20 pb-1 mb-1 flex items-center gap-1.5 justify-start">
                  <span>💵 التدابير والأوضاع المالية للحجز:</span>
                </div>
                <div>
                  <label htmlFor="edit-totalPrice" className="block text-[10px] font-bold text-stone-700 mb-1">
                    المبلغ الإجمالي المدفوع (دج)
                  </label>
                  <input
                    type="number"
                    id="edit-totalPrice"
                    value={editingCustomer.totalPrice || 0}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, totalPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs bg-white font-mono font-black text-left text-amber-900 focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/80"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="edit-paymentStatus" className="block text-[10px] font-bold text-stone-700 mb-1">حالة السداد الكلي للمعاملة</label>
                  <select
                    id="edit-paymentStatus"
                    value={editingCustomer.paymentStatus || 'paid'}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, paymentStatus: e.target.value as 'paid' | 'partial' | 'unpaid' })}
                    className="w-full px-2.5 py-2 border border-stone-200 bg-white rounded-lg text-xs font-bold text-stone-800 focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/80 cursor-pointer font-sans"
                  >
                    <option value="paid">🟢 مدفوع الكلفة بالكامل</option>
                    <option value="partial">🟡 مدفوع جزئياً (عربون محضر)</option>
                    <option value="unpaid">🔴 لم يتم سداده بعد</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="edit-notes" className="block text-[10px] font-bold text-stone-600 mb-1">تعليمات إدارية وتفضيلات مرافقة</label>
                <textarea
                  id="edit-notes"
                  rows={2}
                  value={editingCustomer.notes || ''}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs bg-white font-medium resize-none focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/80 transition-all text-stone-800"
                  placeholder="ملاحظات الحافلة، المقاعد، السكن..."
                />
              </div>

              {/* Cancel / Save */}
              <div className="flex items-center justify-end gap-2 border-t border-stone-100 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  id="btn-edit-cancel"
                  className="px-4 py-2 text-xs font-bold text-stone-550 hover:text-stone-750 bg-stone-50 hover:bg-stone-100 rounded-lg border border-stone-200 cursor-pointer transition-all"
                >
                  إلغاء وتراجع
                </button>
                <button
                  type="submit"
                  id="btn-edit-save"
                  className="px-5 py-2 text-xs font-black text-amber-500 bg-stone-900 hover:bg-stone-950 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all shadow-sm border border-stone-950"
                >
                  <Save size={13} />
                  تطبيق تعديل السجل المالي
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 3. CONFIRM DELETE MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/35 backdrop-blur-xs font-sans">
          <div className="bg-white rounded-2xl border border-stone-200 max-w-sm w-full p-6 shadow-xl relative text-center animate-in fade-in duration-150" dir="rtl">
            <div className="mx-auto w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mb-4 border border-rose-100">
              <Trash2 size={20} id="icon-trash-modal" className="text-rose-600" />
            </div>
            <h3 className="font-extrabold text-[#1C1917] text-sm md:text-base mb-1">تأكيد حذف محضر وحجز العائلة</h3>
            <p className="text-[11px] text-stone-500 mb-6 font-medium leading-relaxed">
              هل أنت متأكد من رغبتك في حذف هذا الحجز بشكل كامل؟ سيتم حذف رب العائلة وكافة أفراد العائلة والمرافقين المجدولين فيه ولا يمكن استرجاع البيانات!
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                id="btn-del-cancel"
                className="flex-1 py-2 rounded-lg text-xs font-bold text-stone-500 hover:text-stone-700 bg-stone-50 hover:bg-stone-100 border border-stone-200 transition-all cursor-pointer"
              >
                تراجع وإلغاء
              </button>
              <button
                onClick={() => {
                  onDeleteCustomer(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                id="btn-del-confirm"
                className="flex-1 py-2 rounded-lg text-xs font-black text-white bg-rose-600 hover:bg-rose-700 transition-all cursor-pointer shadow-sm shadow-rose-200"
              >
                تأكيد الحذف نهائياً
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
