/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Customer, Trip, Companion } from '../types';
import { Printer, Calendar, MapPin, Users, HelpCircle, FileText, Bus, UserCheck, PhoneCall } from 'lucide-react';

interface TripManifestsProps {
  customers: Customer[];
  trips: Trip[];
}

interface ManifestMeta {
  toPlace: string;
  startDate: string;
  startTime: string;
  returnDate: string;
  docDate: string;
  busPlate: string;
}

interface FlatPassenger {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  birthPlace: string;
  role: 'tourist' | 'organizer' | 'driver';
  relationship?: string;
  isLeader: boolean;
  phone: string;
}

// Simple age calculator
const calculateAge = (birthDateString: string): number => {
  if (!birthDateString) return 0;
  const today = new Date();
  const birthDate = new Date(birthDateString);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 0 ? age : 0;
};

export function TripManifests({ customers, trips }: TripManifestsProps) {
  const [selectedTripId, setSelectedTripId] = useState<string>('');
  const tableContainerRef = React.useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Scroll function specifically adjusted for RTL table container
  const scrollTable = (direction: 'left' | 'right') => {
    if (tableContainerRef.current) {
      const container = tableContainerRef.current;
      const scrollAmount = 220;
      // In RTL, scrolling left is negative, scrolling right is positive/towards zero
      const targetScroll = container.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
      container.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
    }
  };

  // Drag ranges or Slider range adjustment
  const handleJoystickChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setScrollProgress(val);
    if (tableContainerRef.current) {
      const container = tableContainerRef.current;
      const { scrollWidth, clientWidth } = container;
      const maxScroll = scrollWidth - clientWidth;
      if (maxScroll > 0) {
        // rtl scrollLeft ranges from 0 (at right) to -maxScroll (at left)
        const targetScroll = -(val / 100) * maxScroll;
        container.scrollLeft = targetScroll;
      }
    }
  };

  // Sync scroll indicator when user swipes or scrolls table natively
  useEffect(() => {
    const container = tableContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      const maxScroll = scrollWidth - clientWidth;
      if (maxScroll <= 0) {
        setScrollProgress(0);
      } else {
        const pct = Math.abs(scrollLeft) / maxScroll;
        setScrollProgress(Math.min(100, Math.max(0, Math.round(pct * 100))));
      }
    };

    container.addEventListener('scroll', handleScroll);
    setTimeout(handleScroll, 200); // initial check after table render

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [customers, selectedTripId]);
  
  // Trip manifesting meta-fields stored per tripId
  const [manifestMeta, setManifestMeta] = useState<Record<string, ManifestMeta>>(() => {
    const stored = localStorage.getItem('aboub_manifest_meta');
    return stored ? JSON.parse(stored) : {};
  });

  // Keep selected trip updated when trips load
  useEffect(() => {
    if (trips.length > 0 && !selectedTripId) {
      setSelectedTripId(trips[0].id);
    }
  }, [trips, selectedTripId]);

  // Save meta to localStorage on change
  const updateMetaField = (tripId: string, flag: keyof ManifestMeta, value: string) => {
    setManifestMeta(prev => {
      const current = prev[tripId] || {
        toPlace: '',
        startDate: '',
        startTime: '',
        returnDate: '',
        docDate: new Date().toLocaleDateString('ar-DZ', { year: 'numeric', month: '2-digit', day: '2-digit' }),
        busPlate: ''
      };
      
      const updated = {
        ...prev,
        [tripId]: {
          ...current,
          [flag]: value
        }
      };
      localStorage.setItem('aboub_manifest_meta', JSON.stringify(updated));
      return updated;
    });
  };

  const activeTrip = trips.find(t => t.id === selectedTripId) || trips[0];

  // Get metadata for the active trip
  const currentMeta = activeTrip ? (manifestMeta[activeTrip.id] || {
    toPlace: activeTrip.destination || '',
    startDate: activeTrip.date || '',
    startTime: '08:00',
    returnDate: '',
    docDate: new Date().toLocaleDateString('ar-DZ', { year: 'numeric', month: '2-digit', day: '2-digit' }),
    busPlate: ''
  }) : {
    toPlace: '',
    startDate: '',
    startTime: '',
    returnDate: '',
    docDate: '',
    busPlate: ''
  };

  // Filter and flatten passengers for the chosen trip
  const flatPassengers: FlatPassenger[] = [];
  const activeCustomers = [...customers]
    .filter(c => c.tripId === (activeTrip?.id || ''))
    .sort((a, b) => new Date(a.registrationDate).getTime() - new Date(b.registrationDate).getTime());

  activeCustomers.forEach((cust) => {
    // Add Family Leader
    flatPassengers.push({
      id: cust.id,
      firstName: cust.firstName,
      lastName: cust.lastName,
      birthDate: cust.birthDate,
      birthPlace: cust.birthPlace || 'غير محدد',
      role: cust.role || 'tourist',
      isLeader: true,
      phone: cust.phone || '',
    });

    // Add Companions if any
    if (cust.companions && cust.companions.length > 0) {
      cust.companions.forEach((comp) => {
        flatPassengers.push({
          id: comp.id,
          firstName: comp.firstName,
          lastName: comp.lastName || cust.lastName, // Fallback to leader's family name
          birthDate: comp.birthDate,
          birthPlace: comp.birthPlace || cust.birthPlace || 'غير محدد',
          role: 'tourist', // Companions default to tourist
          relationship: comp.relationship,
          isLeader: false,
          phone: cust.phone || '',
        });
      });
    }
  });

  const getRoleArabic = (role?: 'tourist' | 'organizer' | 'driver', isLeader = true, relationship = '') => {
    if (!isLeader) {
      return 'سائح';
    }
    if (role === 'organizer') return 'مؤطر دائم';
    if (role === 'driver') return 'سائق الحافلة';
    return 'سائح';
  };

  const getRolePrintClass = (role?: 'tourist' | 'organizer' | 'driver') => {
    return 'text-slate-900 font-bold';
  };

  // Helper to format Birthday details
  const formatBirthInfo = (birthDate: string, birthPlace: string) => {
    if (!birthDate) return 'غير محدد';
    try {
      const d = new Date(birthDate);
      if (isNaN(d.getTime())) return `${birthDate} بـ ${birthPlace || 'تقرت'}`;
      const formattedDate = d.toLocaleDateString('ar-DZ', { year: 'numeric', month: '2-digit', day: '2-digit' });
      return `${formattedDate} بـ ${birthPlace || 'تقرت'}`;
    } catch {
      return `${birthDate} بـ ${birthPlace || 'تقرت'}`;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-6" id="trip-manifest-page-viewport">
      
      {/* 1. TOP SELECTOR BAR (print:hidden) */}
      <div className="w-full space-y-4 print:hidden">
        <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-100 pb-3 mb-4">
            <div>
              <h3 className="font-sans font-extrabold text-zinc-900 text-sm flex items-center gap-2">
                <Bus size={16} className="text-amber-700" />
                اختر البرنامج السياحي لمشاهدة قائمة الركاب
              </h3>
              <p className="text-[11px] text-stone-500 mt-0.5 font-sans">
                اضغط على البرنامج المطلوب لمشاهدة قائمة النقل الرسمية لمركز الشرطة ووزارة النقل.
              </p>
            </div>
            
            {/* Dynamic Details Widget */}
            <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/30 p-2.5 rounded-xl border border-blue-100/50 text-right max-w-md">
              <h4 className="text-[10px] font-bold text-blue-800 flex items-center gap-1.5 mb-0.5">
                <HelpCircle size={12} />
                تجميع تلقائي ذكي للقائمة
              </h4>
              <p className="text-[9.5px] text-slate-600 leading-normal font-sans">
                يقوم النظام آلياً بتفكيك الحجوزات العائلية وإدراج كل فرد في سطر منفصل وباسمائهم الكاملة لضمان كشف ركاب دقيق وقانوني للرحلة.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {trips.length === 0 ? (
              <div className="col-span-full text-center py-6 text-xs text-stone-400 font-semibold bg-stone-50 rounded-xl border border-dashed border-stone-200">
                لا توجد برامج مضافة بعد
              </div>
            ) : (
              trips.map((trip) => {
                const isSelected = trip.id === selectedTripId;
                return (
                  <button
                    key={trip.id}
                    onClick={() => setSelectedTripId(trip.id)}
                    className={`w-full text-right p-3.5 rounded-xl border transition-all flex flex-col justify-start gap-1 cursor-pointer relative group ${
                      isSelected
                        ? 'bg-zinc-950 text-white border-zinc-950 shadow-md shadow-zinc-900/10'
                        : 'bg-stone-50/50 hover:bg-[#FAF8F5] border-stone-200 text-stone-700'
                    }`}
                  >
                    <div className="flex justify-between items-start w-full gap-2">
                      <span className={`text-[9px] px-2 py-0.5 rounded font-black tracking-wide uppercase ${
                        isSelected ? 'bg-amber-600 text-white' : 'bg-stone-200/70 text-stone-600'
                      }`}>
                        {trip.duration}
                      </span>
                    </div>
                    <strong className="text-xs font-extrabold font-sans mt-1.5 group-hover:translate-x-[-2px] transition-transform">
                      {trip.name}
                    </strong>
                    <span className={`text-[10px] font-mono mt-0.5 ${isSelected ? 'text-stone-300' : 'text-stone-400'}`}>
                      المغادرة: {trip.date}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 2. THE MAIN OFFICIAL DECLARATION VIEW SHEET (A4 sized layout) */}
      <div className="w-full bg-white rounded-xl border border-slate-200 p-5 md:p-8 shadow-xs relative print:shadow-none print:border-none print:p-0 print:m-0">
        
        {/* Print controls row (print:hidden) */}
        {activeTrip && (
          <div className="space-y-4 mb-6 print:hidden">
            <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-4 gap-3">
              <div>
                <h2 className="font-sans font-black text-slate-800 text-sm md:text-base flex items-center gap-2">
                  <FileText className="text-blue-600" size={17} />
                  بيان ركاب رحلة: {activeTrip.name}
                </h2>
                <p className="text-[11px] text-slate-400 font-sans mt-0.5">جهز قائمة النقل الرسمية بالبيانات المطلوبة واطبعها بصيغة A4</p>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <Printer size={14} />
                  تحميل كـ PDF / طباعة الكشف الموحد
                </button>
              </div>
            </div>

            {/* Hint for perfect PDF */}
            <div className="bg-blue-50/60 border border-blue-200/50 rounded-lg p-3 text-right">
              <p className="text-[11px] text-blue-900 leading-normal flex items-start gap-1.5 font-sans">
                <span>💡</span>
                <span>
                  <strong>تلميح لحفظ الكشف كملف PDF:</strong> اضغط على زر الطباعة أعلاه، ثم اختر <strong>"حفظ بتنسيق PDF" (Save as PDF)</strong> من خانة الوجهة بالمتصفح ليتم تصدير الكشف بشكل فوري وواضح ومطابق للمتطلبات الأمنية والبلدية.
                </span>
              </p>
            </div>
          </div>
        )}

        {/* If no trip selected / empty view */}
        {!activeTrip ? (
          <div className="text-center py-16">
            <Bus size={44} className="mx-auto text-slate-300 animate-pulse mb-3" />
            <strong className="text-slate-650 text-xs block">الرجاء اختيار برنامج رحلة في القائمة الجانبية</strong>
          </div>
        ) : (
          /* THE OFFICIAL AFRICAN-ARAB PRINTABLE SHEET */
          <div id="printable-manifest-document" className="bg-white text-right leading-relaxed font-sans text-slate-900 printable-card">
            
            {/* Top row headers */}
            <div className="grid grid-cols-2 gap-4 items-start pb-4 border-b border-double border-slate-300">
              {/* Upper Right */}
              <div>
                <h4 className="font-sans font-black text-xs text-slate-900 tracking-tight">وكالة عبعوب للسياحة والأسفار</h4>
                <p className="text-[9px] text-slate-500 font-serif tracking-wider font-semibold mt-0.5">ABOUB TRAVEL & TOURISM</p>
                <span className="text-[9px] text-slate-400 block mt-1">المكتب 01، حي عياد تبسبست، تقرت</span>
              </div>

              {/* Upper Left */}
              <div className="text-left font-sans flex flex-col items-end">
                <div className="flex items-center gap-1.5 text-xs text-slate-800 font-bold">
                  <span>تقرت في:</span>
                  <input
                    type="text"
                    value={currentMeta.docDate}
                    onChange={(e) => updateMetaField(activeTrip.id, 'docDate', e.target.value)}
                    placeholder="2026/06/12"
                    className="border-b border-dashed border-slate-300 font-bold text-xs text-slate-900 w-28 text-center py-0.5 focus:outline-none focus:border-blue-500 print:border-none print:px-0"
                  />
                </div>
              </div>
            </div>

            {/* Centered Large Title */}
            <div className="text-center my-6 space-y-1">
              <h1 className="font-sans font-black text-lg md:text-xl text-slate-950 tracking-tight block border-b-2 border-slate-950 max-w-xs mx-auto pb-1 print:text-[16px]">
                قائمة الأشخاص للرحلة
              </h1>
              <span className="text-[9px] font-mono font-bold tracking-wider text-slate-400 inline-block">
                Manifest Ref: {activeTrip.id.replace('trip-', 'TM-')}
              </span>
            </div>

            {/* Declaration Paragraph with fillable input fields */}
            <div className="bg-slate-50/55 border border-slate-200/80 rounded-xl p-4 md:p-5 text-xs text-slate-800 leading-loose text-justify font-sans relative print:border-none print:bg-white print:p-0 print:leading-relaxed">
              نحن مدير شركة عبعوب للسياحة والأسفار نشهد على استغلال حافلة نقل المسافرين التي تحمل رقم تسجيل:
              <input
                type="text"
                value={currentMeta.busPlate || ''}
                onChange={(e) => updateMetaField(activeTrip.id, 'busPlate', e.target.value)}
                placeholder=" (اضغط لكتابة رقم الحافلة) "
                className="mx-1 px-2 py-0.5 font-bold border-b border-dashed border-slate-400 text-slate-950 text-center placeholder-slate-400 bg-blue-50/20 focus:outline-none focus:border-blue-600 focus:bg-white transition-all text-[11px] w-48 inline-block print:border-none print:bg-transparent print:p-0"
              />
              لقيامها برحلة من مقر وكالتنا الكائن بمحل رقم 01 بحي عياد تبسبست تقرت الشارع 01 إلى:
              
              <input
                type="text"
                value={currentMeta.toPlace}
                onChange={(e) => updateMetaField(activeTrip.id, 'toPlace', e.target.value)}
                placeholder=" (الوجهة المحددة) "
                className="mx-1 px-2 py-0.5 font-bold border-b border-dashed border-slate-400 text-slate-950 text-center placeholder-slate-400 bg-blue-50/20 focus:outline-none focus:border-blue-600 focus:bg-white transition-all text-[11px] w-40 inline-block print:border-none print:bg-transparent print:p-0"
              />
              
              يوم:
              <input
                type="text"
                value={currentMeta.startDate}
                onChange={(e) => updateMetaField(activeTrip.id, 'startDate', e.target.value)}
                placeholder=" (تاريخ الانطلاق) "
                className="mx-1 px-2 py-0.5 font-bold border-b border-dashed border-slate-400 text-slate-950 text-center placeholder-slate-400 bg-blue-50/20 focus:outline-none focus:border-blue-600 focus:bg-white transition-all text-[11px] w-36 inline-block print:border-none print:bg-transparent print:p-0"
              />

              على الساعة:
              <input
                type="text"
                value={currentMeta.startTime}
                onChange={(e) => updateMetaField(activeTrip.id, 'startTime', e.target.value)}
                placeholder=" (ساعة الانطلاق المحددة) "
                className="mx-1 px-2 py-0.5 font-bold border-b border-dashed border-slate-400 text-slate-950 text-center placeholder-slate-400 bg-blue-50/20 focus:outline-none focus:border-blue-600 focus:bg-white transition-all text-[11px] w-28 inline-block print:border-none print:bg-transparent print:p-0"
              />

              والعودة يوم:
              <input
                type="text"
                value={currentMeta.returnDate}
                onChange={(e) => updateMetaField(activeTrip.id, 'returnDate', e.target.value)}
                placeholder=" (تاريخ رجوع الحافلة) "
                className="mx-1 px-2 py-0.5 font-bold border-b border-dashed border-slate-400 text-slate-950 text-center placeholder-slate-400 bg-blue-50/20 focus:outline-none focus:border-blue-600 focus:bg-white transition-all text-[11px] w-40 inline-block print:border-none print:bg-transparent print:p-0"
              />
              إلى مقر وكالتنا للقائمة التالية:
            </div>



            {/* THE PASSENGER MANIFEST TABLE */}
            <div 
              ref={tableContainerRef}
              className="mt-3 overflow-x-auto border border-slate-350 rounded-lg whitespace-nowrap scroll-smooth relative"
            >
              <table className="w-full text-right border-collapse text-xs min-w-[700px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 border-b border-slate-300 font-bold">
                    <th className="py-2.5 px-3 border-l border-slate-300 text-center w-12">N°</th>
                    <th className="py-2.5 px-4 border-l border-slate-300">الاســم واللقــب الكامل</th>
                    <th className="py-2.5 px-4 border-l border-slate-300">تاريخ ومكان الميلاد الكامل</th>
                    <th className="py-2.5 px-4">الصفة / المرافق</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800 font-medium">
                  {flatPassengers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400 italic">
                        لا يوجد ركاب مسجلين على هذا البرنامج السياحي بعد.
                      </td>
                    </tr>
                  ) : (
                    flatPassengers.map((p, index) => (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                        {/* 1. Sequence */}
                        <td className="py-2 px-3 border-l border-slate-200 text-center font-mono font-bold text-slate-600 w-12">
                          {index + 1}
                        </td>
                        
                        {/* 2. Passenger Full name */}
                        <td className="py-2 px-4 border-l border-slate-200 font-bold text-slate-900">
                          {p.firstName} {p.lastName}
                        </td>
                        
                        {/* 3. Birthday / Place */}
                        <td className="py-2 px-4 border-l border-slate-200 font-mono text-[11px]">
                          {formatBirthInfo(p.birthDate, p.birthPlace)}
                        </td>
                        
                        {/* 4. Relationship or individual Role */}
                        <td className="py-2 px-4">
                          <span className={p.isLeader ? getRolePrintClass(p.role) : 'text-slate-600 font-bold'}>
                            {getRoleArabic(p.role, p.isLeader, p.relationship)}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom summary and sign-off */}
            <div className="mt-8 flex justify-between items-center text-xs font-sans text-slate-500 pt-4 border-t border-slate-200/60">
              <span className="text-[10px] text-slate-400 italic font-medium"></span>
              <div className="text-left font-sans pl-2 print:pl-0">
                <p className="font-bold text-slate-900">إمضاء وختم مدير الوكالة:</p>
                <div className="w-36 h-16 border border-dashed border-slate-350 rounded mt-1 opacity-50"></div>
              </div>
            </div>

          </div>
        )}

      </div>
      
      {/* Global CSS style tags for manifest A4 layout */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-layout-app-wrapper, .print-hidden-viewport {
            display: none !important;
          }
          #printable-manifest-document, #printable-manifest-document * {
            visibility: visible;
          }
          #printable-manifest-document {
            position: absolute;
            left: 0;
            top: 0;
            width: 210mm;
            min-height: 297mm;
            padding: 15mm;
            margin: 0;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
          }
          #printable-manifest-document input {
            border: none !important;
            border-bottom: none !important;
            background: transparent !important;
            padding: 0 !important;
            margin: 0 !important;
            width: auto !important;
            text-align: center !important;
            font-weight: bold !important;
            color: #000 !important;
            box-shadow: none !important;
          }
          #printable-manifest-document input::placeholder {
            color: transparent !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}
