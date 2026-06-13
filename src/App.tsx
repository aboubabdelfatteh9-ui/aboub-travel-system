/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Customer, Trip } from './types';
import { defaultTrips } from './data/trips';
import { Logo } from './components/Logo';
import { CustomerForm } from './components/CustomerForm';
import { CustomerTable } from './components/CustomerTable';
import { PrintDocument } from './components/PrintDocument';
import { TripManifests } from './components/TripManifests';
import { 
  Users, 
  Map, 
  Wallet, 
  Database, 
  Download, 
  Upload, 
  Clock, 
  Plus, 
  Sparkles, 
  Trash2, 
  LayoutDashboard, 
  Compass, 
  Share2, 
  CheckCircle2, 
  AlertCircle,
  Edit2,
  X
} from 'lucide-react';

export default function App() {
  // 1. STATE INITIALIZATION
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'manifests' | 'trips' | 'options'>('dashboard');
  const [selectedPrintCustomer, setSelectedPrintCustomer] = useState<Customer | null>(null);
  const [selectedTripFilter, setSelectedTripFilter] = useState<string>('all');
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  
  // Alert Status
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Time and Date tracker
  const [currentTime, setCurrentTime] = useState(new Date());

  // 2. LIVE CLOCK EFFECT
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 3. LOAD DATA FROM LOCAL STORAGE (CLEAN SLATE SEEDING)
  useEffect(() => {
    const storedCustomers = localStorage.getItem('aboub_customers');
    const storedTrips = localStorage.getItem('aboub_trips');

    let loadedTrips: Trip[] = [];
    if (storedTrips) {
      try {
        loadedTrips = JSON.parse(storedTrips);
      } catch (e) {
        console.error('Error parsing stored trips:', e);
      }
    }
    // Filter out mock trips if any still exist
    const mockTripIds = ['trip-umrah', 'trip-turkey', 'trip-tunisia', 'trip-djanet', 'trip-dubai', 'trip-malaysia', 'trip-spain'];
    loadedTrips = loadedTrips.filter(t => !mockTripIds.includes(t.id));
    
    // Seed defaultTrips if list is empty
    if (loadedTrips.length === 0) {
      loadedTrips = defaultTrips;
    }
    setTrips(loadedTrips);

    let loadedCustomers: Customer[] = [];
    if (storedCustomers) {
      try {
        loadedCustomers = JSON.parse(storedCustomers);
      } catch (e) {
        console.error('Error parsing stored customers:', e);
      }
    }
    // Filter out mock customers
    const mockCustIds = ['cust-1', 'cust-2', 'cust-3'];
    loadedCustomers = loadedCustomers.filter(c => !mockCustIds.includes(c.id) && !mockTripIds.includes(c.tripId));
    setCustomers(loadedCustomers);

    // Save the cleaned-up data to persist the empty, ready-to-use slate
    localStorage.setItem('aboub_customers', JSON.stringify(loadedCustomers));
    localStorage.setItem('aboub_trips', JSON.stringify(loadedTrips));
  }, []);

  // 4. WRITE DATA TO LOCAL STORAGE ON STATE CHANGE
  const saveCustomersToStorage = (updatedCustomers: Customer[]) => {
    setCustomers(updatedCustomers);
    localStorage.setItem('aboub_customers', JSON.stringify(updatedCustomers));
  };

  const saveTripsToStorage = (updatedTrips: Trip[]) => {
    setTrips(updatedTrips);
    localStorage.setItem('aboub_trips', JSON.stringify(updatedTrips));
  };

  // 5. HELPER ACTION: TOAST MESSAGES
  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // 6. DASHBOARD CALCULATED METRICS
  const metrics = useMemo(() => {
    const activeCustomers = selectedTripFilter === 'all' 
      ? customers 
      : customers.filter(c => c.tripId === selectedTripFilter);

    const totalPassengers = activeCustomers.reduce((sum, c) => sum + (c.peopleCount || 1), 0);
    
    // Revenue calculations: sum customer totalPrice or multiply trip price by passengers
    const totalRevenue = activeCustomers.reduce((sum, c) => {
      if (c.totalPrice !== undefined) {
        return sum + c.totalPrice;
      }
      const trip = trips.find(t => t.id === c.tripId);
      const tripPrice = trip ? trip.price : 0;
      return sum + (tripPrice * (c.peopleCount || 1));
    }, 0);

    const activeTripCount = trips.filter(t => t.status === 'active').length;

    return {
      totalBookingRecords: activeCustomers.length,
      totalPassengers,
      totalRevenue,
      activeTripCount
    };
  }, [customers, trips, selectedTripFilter]);

  // 7. CORE EVENT: ADD MEMBER
  const handleAddCustomer = (newCust: Omit<Customer, 'id' | 'registrationDate' | 'invoiceNumber'>) => {
    // Generate unique invoice ID: AB-YEAR-SEQUENCE e.g. AB-2026-0004
    const nextSeq = String(customers.length + 1).padStart(4, '0');
    const invoiceNum = `AB-2026-${nextSeq}`;
    const generatedId = `customer-${Date.now()}`;

    const completeCustomer: Customer = {
      ...newCust,
      id: generatedId,
      registrationDate: new Date().toISOString(),
      invoiceNumber: invoiceNum,
    };

    const newArray = [completeCustomer, ...customers];
    saveCustomersToStorage(newArray);
    showToast(`تم تسجيل الزبون ${newCust.firstName} ${newCust.lastName} بنجاح كحجز ${invoiceNum}!`, 'success');
  };

  // 8. CORE EVENT: UPDATE MEMBER
  const handleUpdateCustomer = (updatedCust: Customer) => {
    const updatedArray = customers.map((c) => (c.id === updatedCust.id ? updatedCust : c));
    saveCustomersToStorage(updatedArray);
    showToast(`تم تعديل بيانات الزبون ${updatedCust.firstName} بنجاح.`, 'success');
  };

  // 9. CORE EVENT: DELETE MEMBER
  const handleDeleteCustomer = (id: string) => {
    const target = customers.find(c => c.id === id);
    const updatedArray = customers.filter((c) => c.id !== id);
    saveCustomersToStorage(updatedArray);
    if (target) {
      showToast(`تم حذف حجز الزبون ${target.firstName} ${target.lastName} من سجلات الوكالة.`, 'info');
    }
  };

  // 10. TOURISM PROGRAM EVENTS: ADD TOUR
  const [newTripData, setNewTripData] = useState({
    name: '',
    destination: '',
    price: 50000,
    duration: '8 أيام / 7 ليالٍ',
    date: '',
  });

  const handleAddTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTripData.name.trim() || !newTripData.destination.trim() || !newTripData.date) {
      showToast('الرجاء تعبئة كامل حقول الرحلة الجديدة', 'error');
      return;
    }

    const createdTrip: Trip = {
      id: `trip-${Date.now()}`,
      name: newTripData.name,
      destination: newTripData.destination,
      price: newTripData.price,
      duration: newTripData.duration,
      date: newTripData.date,
      status: 'active'
    };

    const updatedTrips = [...trips, createdTrip];
    saveTripsToStorage(updatedTrips);
    setNewTripData({
      name: '',
      destination: '',
      price: 50000,
      duration: '8 أيام / 7 ليالٍ',
      date: '',
    });
    showToast(`تمت إضافة برنامج رحلة سياحية جديدة بنجاح: ${createdTrip.name}`, 'success');
  };

  const handleDeleteTrip = (tripId: string) => {
    // Check if any client is already booked on this trip
    const affectedCount = customers.filter(c => c.tripId === tripId).length;
    if (affectedCount > 0) {
      showToast(`عذراً! لا يمكن حذف هذه الرحلة لوجود ${affectedCount} زبون تم حجزهم عليها.`, 'error');
      return;
    }

    const updated = trips.filter(t => t.id !== tripId);
    saveTripsToStorage(updated);
    showToast('تمت إزالة برنامج الرحلة بنجاح.', 'success');
  };

  const handleUpdateTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrip) return;
    if (!editingTrip.name.trim() || !editingTrip.destination.trim() || !editingTrip.date) {
      showToast('الرجاء تعبئة كامل حقول البرنامج السياحي', 'error');
      return;
    }

    const updatedTrips = trips.map((t) => (t.id === editingTrip.id ? editingTrip : t));
    saveTripsToStorage(updatedTrips);
    setEditingTrip(null);
    showToast(`تم تعديل وتحديث بيانات برنامج الرحلة "${editingTrip.name}" بنجاح!`, 'success');
  };

  // 11. DATA MIGRATION: EXPORT / IMPORT DATABASE (FOR OFFLINE ASSURANCE)
  const downloadBackupJSON = () => {
    const databaseDump = {
      customers,
      trips,
      exportedAt: new Date().toISOString(),
      agency: 'Aboub Travel and Tourism Agency'
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(databaseDump, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `نسخة_احتياطية_وكالة_عبعوب_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('تم تحميل نسخة من السجلات الاحتياطية بنجاح.', 'success');
  };

  const triggerJSONFileInput = () => {
    document.getElementById('backup-file-uploader')?.click();
  };

  const handleUploadBackupJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const files = e.target.files;
    if (!files || files.length === 0) return;

    fileReader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && Array.isArray(parsed.customers) && Array.isArray(parsed.trips)) {
          setCustomers(parsed.customers);
          setTrips(parsed.trips);
          saveCustomersToStorage(parsed.customers);
          saveTripsToStorage(parsed.trips);
          showToast(`تم استيراد السجلات الاحتياطية بنجاح! السجل يضم ${parsed.customers.length} زبون و ${parsed.trips.length} برنامج رحلة.`, 'success');
        } else {
          showToast('تنسيق ملف النسخة الاحتياطية غير متوافق.', 'error');
        }
      } catch (err) {
        showToast('فشل في قراءة واستيراد ملف السجلات.', 'error');
      }
    };
    if (files[0]) {
      fileReader.readAsText(files[0]);
    }
    // Clear value to allow upload again
    e.target.value = '';
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-stone-900 flex flex-col md:flex-row-reverse font-sans selection:bg-amber-100 selection:text-amber-900 print:bg-white print:text-black" dir="rtl">
      
      {/* DESKTOP FIXED SIDEBAR */}
      <aside className="w-80 bg-zinc-950 text-white sticky top-0 h-screen hidden md:flex flex-col justify-between p-6 print:hidden shrink-0 border-l border-amber-500/10 shadow-xl z-40">
        <div className="space-y-8">
          {/* Logo Heading - Premium & Modern Corporate Layout */}
          <div className="flex items-center gap-3.5">
            <div className="bg-gradient-to-br from-amber-400 to-amber-600 text-zinc-950 w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-amber-500/10 select-none transform hover:rotate-3 transition-all duration-300">
              ع
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <h1 className="font-sans font-black text-sm tracking-tight select-none leading-none bg-gradient-to-l from-white to-stone-200 bg-clip-text text-transparent">
                  وكالة عبعوب للسياحة
                </h1>
                <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider scale-90">
                  CRM
                </span>
              </div>
              <span className="font-mono text-[8px] text-stone-400 font-bold tracking-wider select-none mt-1.5 opacity-80 uppercase leading-none">
                ABOUB TRAVEL AGENCY
              </span>
            </div>
          </div>

          <div className="border-t border-zinc-800/80 my-2"></div>

          {/* Navigation Links with generous hover and active states */}
          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              id="sidebar-btn-dashboard"
              className={`w-full py-3.5 px-4 rounded-xl transition-all font-bold text-xs cursor-pointer flex items-center justify-start gap-3.5 ${
                activeTab === 'dashboard'
                  ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/15 font-black'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-zinc-900/60'
              }`}
            >
              <LayoutDashboard size={15} className="shrink-0" />
              <span>لوحة الحجوزات والزبائن</span>
            </button>

            <button
              onClick={() => setActiveTab('manifests')}
              id="sidebar-btn-manifests"
              className={`w-full py-3.5 px-4 rounded-xl transition-all font-bold text-xs cursor-pointer flex items-center justify-start gap-3.5 ${
                activeTab === 'manifests'
                  ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/15 font-black'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-zinc-900/60'
              }`}
            >
              <Users size={15} className="shrink-0" />
              <span>دليل قوائم ركاب الرحلات</span>
            </button>

            <button
              onClick={() => setActiveTab('trips')}
              id="sidebar-btn-trips"
              className={`w-full py-3.5 px-4 rounded-xl transition-all font-bold text-xs cursor-pointer flex items-center justify-start gap-3.5 ${
                activeTab === 'trips'
                  ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/15 font-black'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-zinc-900/60'
              }`}
            >
              <Compass size={15} className="shrink-0" />
              <span>برامج الرحلات والمواسم</span>
            </button>

            <button
              onClick={() => setActiveTab('options')}
              id="sidebar-btn-options"
              className={`w-full py-3.5 px-4 rounded-xl transition-all font-bold text-xs cursor-pointer flex items-center justify-start gap-3.5 ${
                activeTab === 'options'
                  ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/15 font-black'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-zinc-900/60'
              }`}
            >
              <Database size={15} className="shrink-0" />
              <span>النسخ الاحتياطي والضبط</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer Info */}
        <div className="space-y-4 pt-6 mt-auto border-t border-zinc-900/80 text-right">
          <div className="flex items-center gap-2.5 bg-zinc-900/60 border border-zinc-900 rounded-xl px-3 py-2.5 select-none justify-center">
            <Clock size={13} className="text-amber-400 animate-spin-slow shrink-0" />
            <span className="font-mono text-[10px] text-stone-300 font-bold tracking-wider">
              {currentTime.toLocaleTimeString('ar-DZ')}
            </span>
          </div>
          <div className="text-[10px] text-stone-500 leading-normal space-y-1 font-sans">
            <div>📍 حي عياد تبسبست، تقرت</div>
            <div>📞 المكتب الرئيسي: 029.67.11.01</div>
          </div>
        </div>
      </aside>

      {/* MOBILE RESPONSIVE TOP HEADER */}
      <header className="bg-zinc-950 text-white sticky top-0 z-40 shadow-md border-b border-amber-500/20 print:hidden flex flex-col md:hidden">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-amber-400 to-amber-600 text-zinc-950 w-9 h-9 rounded-lg flex items-center justify-center font-black text-md shadow-md">
              ع
            </div>
            <div className="flex flex-col text-right">
              <h1 className="font-sans font-black text-xs leading-none">وكالة عبعوب للسياحة</h1>
              <span className="font-mono text-[7.5px] text-stone-400 font-bold uppercase tracking-wide mt-1">ABOUB TRAVEL</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 bg-zinc-900 px-2 py-1 rounded-lg border border-zinc-800 text-[10px] font-mono font-bold text-amber-400">
            {currentTime.toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        {/* Mobile Navigation tab bar with modern horizontal swiper feel */}
        <div className="border-t border-zinc-900 px-2 py-1.5 bg-zinc-900/50 flex items-center justify-around gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('dashboard')}
            id="mobile-tab-dashboard"
            className={`flex-1 py-1.5 px-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all ${
              activeTab === 'dashboard' ? 'bg-amber-500 text-zinc-950 font-black shadow-xs' : 'text-stone-400 font-medium'
            }`}
          >
            <LayoutDashboard size={11} />
            <span>الحجوزات</span>
          </button>
          <button
            onClick={() => setActiveTab('manifests')}
            id="mobile-tab-manifests"
            className={`flex-1 py-1.5 px-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all ${
              activeTab === 'manifests' ? 'bg-amber-500 text-zinc-950 font-black shadow-xs' : 'text-stone-400 font-medium'
            }`}
          >
            <Users size={11} />
            <span>الكشوفات</span>
          </button>
          <button
            onClick={() => setActiveTab('trips')}
            id="mobile-tab-trips"
            className={`flex-1 py-1.5 px-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all ${
              activeTab === 'trips' ? 'bg-amber-500 text-zinc-950 font-black shadow-xs' : 'text-stone-400 font-medium'
            }`}
          >
            <Compass size={11} />
            <span>الرحلات</span>
          </button>
          <button
            onClick={() => setActiveTab('options')}
            id="mobile-tab-options"
            className={`flex-1 py-1.5 px-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all ${
              activeTab === 'options' ? 'bg-amber-500 text-zinc-950 font-black shadow-xs' : 'text-stone-400 font-medium'
            }`}
          >
            <Database size={11} />
            <span>الضبط</span>
          </button>
        </div>
      </header>

      {/* CONTENT WORKSPACE WRAPPER */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* DESKTOP STICKY SUB-HEADER TOP BAR - Super clean, high contrast design */}
        <header className="bg-white border-b border-stone-200/65 py-4 px-8 sticky top-0 z-30 justify-between items-center hidden md:flex print:hidden">
          <div className="space-y-0.5 text-right">
            <h2 className="font-sans font-black text-zinc-900 text-[15px] tracking-tight leading-none">
              {activeTab === 'dashboard' && 'لوحة تحكم كشوف الحجوزات والزبائن الفورية'}
              {activeTab === 'manifests' && 'دليل قوائم الركاب ومسافري كشف النقل'}
              {activeTab === 'trips' && 'إدارة البرامج والمواسم السياحية للوكالة'}
              {activeTab === 'options' && 'نظام النسخ الاحتياطي ومزامنة البيانات'}
            </h2>
            <p className="text-[10px] text-stone-500 font-sans mt-1">
              {activeTab === 'dashboard' && 'تابع الحسابات المالية لملفات العائلات والزبائن مع تصفية مجدولة'}
              {activeTab === 'manifests' && 'توليد قوائم المسافرين الرسمية لجهات النقل والبلدية لولاية تقرت'}
              {activeTab === 'trips' && 'أضف، حدّث أو امسح البرامج السياحية الفعالة أو القادمة للزبائن'}
              {activeTab === 'options' && 'أرسل أو استرجع قاعدة بيانات الحجوزات في جهاز المكتب بخصوصية مطلقة'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-stone-50 rounded-lg border border-stone-200/60 font-sans text-[11px] text-stone-500 font-semibold select-none leading-none">
              <span>تاريخ التقرير اليومي:</span>
              <span className="font-mono text-stone-850 font-bold">{new Date().toLocaleDateString('ar-DZ')}</span>
            </div>
          </div>
        </header>

        {/* 3. DYNAMIC APP ALERTS (TOAST) */}
        {toast && (
          <div className="fixed bottom-6 left-6 z-50 max-w-sm w-full animate-in slide-in-from-bottom-5 duration-200">
            <div className={`p-4 rounded-xl border shadow-xl flex items-start gap-4 text-right font-sans translate-x-0 ${
              toast.type === 'success' 
                ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                : toast.type === 'error' 
                ? 'bg-rose-50 border-rose-100 text-rose-800' 
                : 'bg-indigo-50 border-indigo-100 text-indigo-800'
            }`}>
              <div className="shrink-0 mt-0.5">
                {toast.type === 'success' ? (
                  <CheckCircle2 size={18} className="text-emerald-500" id="toast-success-icon" />
                ) : (
                  <AlertCircle size={18} className="text-rose-500" id="toast-danger-icon" />
                )}
              </div>
              <div>
                <span className="font-bold text-xs block">تنبيه النظام</span>
                <p className="text-xs font-semibold mt-1 leading-relaxed">{toast.message}</p>
              </div>
            </div>
          </div>
        )}

        {/* 4. MAIN ACTION WORKSPACE */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        
        {/* TAB CONTENTS */}
        <div className={`tab-container ${activeTab === 'manifests' ? '' : 'print:hidden'}`}>
          
          {/* TAB 1: CUSTOMERS & RESERVATIONS DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="flex flex-col gap-6 w-full items-stretch">
              
              {/* Top Row: Customer Registration Form */}
              <div className="w-full">
                <CustomerForm trips={trips} onAddCustomer={handleAddCustomer} />
              </div>

              {/* Bottom Row: Customers Table Directory */}
              <div className="w-full">
                <CustomerTable
                  customers={customers}
                  trips={trips}
                  onDeleteCustomer={handleDeleteCustomer}
                  onUpdateCustomer={handleUpdateCustomer}
                  onPrintCustomer={(customer) => setSelectedPrintCustomer(customer)}
                />
              </div>

            </div>
          )}

          {/* TAB 1.5: TRIP PASSENGER MANIFESTS */}
          {activeTab === 'manifests' && (
            <TripManifests customers={customers} trips={trips} />
          )}

          {/* TAB 2: VOYAGE PROGRAMS EDITOR AND LISTS */}
          {activeTab === 'trips' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-200">
              
              {/* Add New Voyage form (4 / 12 spans) */}
              <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3 mb-4">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                    <Plus size={18} id="icon-add-trip-bar" />
                  </div>
                  <div>
                    <h3 className="font-sans font-bold text-slate-800 text-sm">إضافة برنامج سفر جديد</h3>
                    <p className="text-[10px] text-slate-400 font-sans mt-0.5">أدرج رحلة طيران أو عمرة جديدة لبرامج الوكالة المتاحة</p>
                  </div>
                </div>

                <form onSubmit={handleAddTrip} className="space-y-4 font-sans text-right text-xs">
                  <div>
                    <label htmlFor="trip-name" className="block font-bold text-slate-600 mb-1">اسم الرحلة / البرنامج</label>
                    <input
                      type="text"
                      id="trip-name"
                      placeholder="مثال: رحلة سياحية إلى أنطاليا التركية"
                      value={newTripData.name}
                      onChange={(e) => setNewTripData({ ...newTripData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="trip-destination" className="block font-bold text-slate-600 mb-1">الوجهة (المدينة والبلد)</label>
                    <input
                      type="text"
                      id="trip-destination"
                      placeholder="مثال: تركيا"
                      value={newTripData.destination}
                      onChange={(e) => setNewTripData({ ...newTripData, destination: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-1">
                    <div>
                      <label htmlFor="trip-price" className="block font-bold text-slate-600 mb-1">سعر المقعد بالدينار (DZD)</label>
                      <input
                        type="number"
                        id="trip-price"
                        value={newTripData.price}
                        onChange={(e) => setNewTripData({ ...newTripData, price: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="trip-duration" className="block font-bold text-slate-600 mb-1">مدة الإقامة المجدولة</label>
                      <input
                        type="text"
                        id="trip-duration"
                        placeholder="مثال: 8 أيام / 7 ليال"
                        value={newTripData.duration}
                        onChange={(e) => setNewTripData({ ...newTripData, duration: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="trip-date" className="block font-bold text-slate-600 mb-1">تاريخ انطلاق السفر</label>
                    <input
                      type="date"
                      id="trip-date"
                      value={newTripData.date}
                      onChange={(e) => setNewTripData({ ...newTripData, date: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-right focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    id="btn-confirm-trip-add"
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors cursor-pointer text-center text-xs shadow-sm hover:shadow"
                  >
                    أضف البرنامج لقائمة الحجوزات
                  </button>
                </form>
              </div>

              {/* Programs and Active Tours list (8 / 12 spans) */}
              <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-sans font-bold text-slate-800 text-base mb-1">برامج الرحلات النشطة للوكالة</h3>
                <p className="text-xs text-slate-400 font-sans mb-4">قائمة رحلات الطيران والعمرة التي يمكنك تسكين الزبائن عليها حالياً:</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {trips.map((tour) => {
                    const bookedClientsCount = customers.filter(c => c.tripId === tour.id).length;
                    return (
                      <div key={tour.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col justify-between hover:bg-slate-50 transition-colors">
                        <div>
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 rounded px-2 py-0.5 font-mono">
                              {tour.duration}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              tour.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                            }`}>
                              {tour.status === 'active' ? 'فعّالة حالياً' : 'قادمة قريباً'}
                            </span>
                          </div>

                          <h4 className="font-sans font-bold text-slate-800 text-sm mt-3 leading-snug">
                            {tour.name}
                          </h4>

                          <div className="mt-3 space-y-1 text-slate-500 text-xs font-sans">
                            <div>الوجهة والبلد: <span className="font-semibold text-slate-800">{tour.destination}</span></div>
                            <div>تاريخ المغادرة المتوقع: <span className="font-semibold text-slate-800 font-mono">{tour.date}</span></div>
                            <div>حجوزات نشطة حالياً: <span className="font-bold text-blue-600 px-1">{bookedClientsCount} مسافرين</span></div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-4 border-t border-slate-100 pt-3">
                          <span className="text-blue-600 font-bold font-mono text-sm">
                            {tour.price.toLocaleString('ar-DZ')} د.ج
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setEditingTrip(tour)}
                              id={`btn-trip-edit-${tour.id}`}
                              className="text-slate-600 p-1.5 bg-white border border-slate-200 rounded-lg hover:border-amber-500 hover:text-amber-600 transition-colors cursor-pointer flex items-center justify-center"
                              title="تعديل تفاصيل البرنامج السياحي"
                            >
                              <Edit2 size={13} id={`icon-edit-trip-${tour.id}`} />
                            </button>
                            <button
                              onClick={() => handleDeleteTrip(tour.id)}
                              id={`btn-trip-del-${tour.id}`}
                              className="text-rose-500 p-1.5 bg-white border border-slate-200 rounded-lg hover:border-rose-600 hover:text-rose-700 transition-colors cursor-pointer flex items-center justify-center"
                              title="إزالة البرنامج السياحي"
                            >
                              <Trash2 size={13} id={`icon-del-trip-${tour.id}`} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: BACKUP UTILITIES AND LOCAL EXPORT */}
          {activeTab === 'options' && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-2xl mx-auto space-y-6 animate-in fade-in duration-200">
              <div className="text-center space-y-2 border-b border-slate-100 pb-5">
                <div className="mx-auto w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                  <Database size={24} id="icon-options-db" />
                </div>
                <h3 className="font-bold text-lg text-slate-800">إدارة السجلات والنسخ الاحتياطي</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  بما أن هذا التطبيق مخصص للعمل المكتبي الآمن، يتم تخزين كافة البيانات في متصفحك بشكل فوري وهو ما يعني خصوصية مطلقة للزبائن. لضمان عدم ضياع أعمالك، يمكنك إجراء نسخ احتياطي فوري واستعادته بأي وقت.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Download Backup */}
                <div className="border border-slate-200 p-4 rounded-xl space-y-3 bg-gradient-to-br from-slate-50 to-white hover:shadow-xs transition-all">
                  <h4 className="font-bold text-sm text-slate-800">حفظ نسخة احتياطية للقرص</h4>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    تحميل كامل قاعدة بيانات الزبائن ومواعيد حجز الرحلات في ملف واحد بصيغة JSON آمنة ومحمية لحفظها في حاسوبك المكتبي.
                  </p>
                  <button
                    onClick={downloadBackupJSON}
                    id="btn-export-records"
                    className="w-full mt-2 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    <Download size={14} id="icon-export-bk" />
                    تحميل نسخة احتياطية للبيانات
                  </button>
                </div>

                {/* Restore Backup */}
                <div className="border border-slate-200 p-4 rounded-xl space-y-3 bg-gradient-to-br from-slate-50 to-white hover:shadow-xs transition-all">
                  <h4 className="font-bold text-sm text-slate-800">استعادة البيانات من ملف</h4>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    تحميل ملف النسخة الاحتياطية المسبقة لدمج واستعادة كامل حسابات المسافرين وتواريخ انطلاق السفر المخزنة فوراً.
                  </p>
                  
                  {/* Hidden Input Uploader */}
                  <input
                    type="file"
                    id="backup-file-uploader"
                    accept=".json"
                    onChange={handleUploadBackupJSON}
                    className="hidden"
                  />

                  <button
                    onClick={triggerJSONFileInput}
                    id="btn-import-records"
                    className="w-full mt-2 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    <Upload size={14} id="icon-import-bk" />
                    اختر واستورد ملف السجلات الاحتياطية
                  </button>
                </div>

              </div>

              {/* Developer Note */}
              <div className="bg-blue-50/70 rounded-xl p-4 border border-blue-105 text-xs text-blue-800 leading-relaxed font-sans">
                <strong>💡 تنويه أمني:</strong> تذكر دائماً ألا تمسح ملفات تعريف ارتباط المتصفح (Cache) أو بيانات المتصفح الخاصة لضمان ثبات السجلات. يوصى بشدة بتحميل نسخة احتياطية في نهاية كل أسبوع عمل لحماية وحفظ ملفات زبائن وكالة عبعوب للسياحة والأسفار.
              </div>
            </div>
          )}

        </div>

      </main>

      {/* 5. FOOTER */}
      <footer className="bg-white border-t border-slate-150 py-4 px-6 text-center text-xs text-slate-400 mt-12 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>
            جميع الحقوق محفوظة © {new Date().getFullYear()} - وكالة عبعوب لسياحة والأسفار والرحلات
          </span>
          <span className="font-mono text-[10px] bg-slate-50 border border-slate-100 px-2 py-1 rounded">
            Version 2.4.0 (Offline-first Workspace)
          </span>
        </div>
      </footer>

      </div> {/* End .flex-1 .flex-col content wrapper */}

      {/* 6. MODAL OVERLAYS FOR PRINTING */}
      {selectedPrintCustomer && (
        <PrintDocument
          customer={selectedPrintCustomer}
          customers={customers}
          trips={trips}
          onClose={() => setSelectedPrintCustomer(null)}
          onSelectCustomer={setSelectedPrintCustomer}
        />
      )}

      {/* 7. MODAL OVERLAYS FOR EDITING TRIP PROGRAM */}
      {editingTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/35 backdrop-blur-xs font-sans" dir="rtl">
          <div className="bg-white rounded-2xl border border-stone-200 max-w-lg w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-155 max-h-[90vh] overflow-y-auto">
            
            <button
              onClick={() => setEditingTrip(null)}
              id="trip-modal-close"
              className="absolute top-4 left-4 p-1 rounded-full text-stone-400 bg-stone-50 hover:bg-stone-100 hover:text-stone-600 transition-colors cursor-pointer border border-stone-200"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-2 border-b border-stone-100 pb-3 mb-4 justify-start">
              <Sparkles className="text-blue-600 animate-pulse" size={16} />
              <h3 className="font-extrabold text-zinc-900 text-sm md:text-base">تعديل تفاصيل برنامج الرحلة السياحية</h3>
            </div>

            <form onSubmit={handleUpdateTrip} className="space-y-4 text-right text-xs">
              
              <div>
                <label htmlFor="edit-trip-name" className="block text-[10px] font-bold text-stone-600 mb-1">اسم الرحلة / البرنامج</label>
                <input
                  type="text"
                  id="edit-trip-name"
                  value={editingTrip.name}
                  onChange={(e) => setEditingTrip({ ...editingTrip, name: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs bg-white font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/80 transition-all text-stone-800"
                  required
                />
              </div>

              <div>
                <label htmlFor="edit-trip-destination" className="block text-[10px] font-bold text-stone-600 mb-1">الوجهة (المدينة والبلد)</label>
                <input
                  type="text"
                  id="edit-trip-destination"
                  value={editingTrip.destination}
                  onChange={(e) => setEditingTrip({ ...editingTrip, destination: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs bg-white font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/80 transition-all text-stone-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="edit-trip-price" className="block text-[10px] font-bold text-stone-600 mb-1">سعر المقعد بالدينار (DZD)</label>
                  <input
                    type="number"
                    id="edit-trip-price"
                    value={editingTrip.price}
                    onChange={(e) => setEditingTrip({ ...editingTrip, price: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs bg-white font-mono font-bold text-stone-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/80 transition-all"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="edit-trip-duration" className="block text-[10px] font-bold text-stone-600 mb-1">مدة الإقامة المجدولة</label>
                  <input
                    type="text"
                    id="edit-trip-duration"
                    value={editingTrip.duration}
                    onChange={(e) => setEditingTrip({ ...editingTrip, duration: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs bg-white font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/80 transition-all text-stone-800"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="edit-trip-date" className="block text-[10px] font-bold text-stone-600 mb-1">تاريخ انطلاق السفر</label>
                  <input
                    type="date"
                    id="edit-trip-date"
                    value={editingTrip.date}
                    onChange={(e) => setEditingTrip({ ...editingTrip, date: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs bg-white font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/80 transition-all text-stone-800 text-right font-sans"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="edit-trip-status" className="block text-[10px] font-bold text-stone-600 mb-1">حالة البرنامج النشط</label>
                  <select
                    id="edit-trip-status"
                    value={editingTrip.status}
                    onChange={(e) => setEditingTrip({ ...editingTrip, status: e.target.value as 'active' | 'completed' | 'upcoming' })}
                    className="w-full px-2.5 py-2 border border-stone-200 bg-white rounded-lg text-xs font-bold text-stone-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/80 cursor-pointer font-sans text-right"
                  >
                    <option value="active">فعّالة حالياً (نشطة)</option>
                    <option value="upcoming">قادمة قريباً</option>
                    <option value="completed">مكتملة / منتهية</option>
                  </select>
                </div>
              </div>

              {/* Cancel / Save */}
              <div className="flex items-center justify-end gap-2 border-t border-stone-100 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setEditingTrip(null)}
                  id="btn-edit-trip-cancel"
                  className="px-4 py-2 text-xs font-bold text-stone-550 hover:text-stone-750 bg-stone-50 hover:bg-stone-150 rounded-lg border border-stone-200 cursor-pointer transition-all"
                >
                  إلغاء وتراجع
                </button>
                <button
                  type="submit"
                  id="btn-edit-trip-save"
                  className="px-5 py-2 text-xs font-black text-blue-100 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all shadow-sm border border-blue-650"
                >
                  <span className="text-white font-bold">تطبيق تعديل البرنامج</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
