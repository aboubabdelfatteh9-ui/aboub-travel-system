/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Customer, Trip, Companion } from '../types';
import { Logo } from './Logo';
import { FileText, Download, Printer, X, Mail, Phone, MapPin, CheckCircle, Info, Calendar, Sparkles, Receipt, HelpCircle, Users } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface PrintDocumentProps {
  customer: Customer | null;
  customers: Customer[];
  trips: Trip[];
  onClose: () => void;
  onSelectCustomer: (customer: Customer) => void;
}

// Simple age calculator helper duplicate to avoid circular dependencies
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

export const PrintDocument: React.FC<PrintDocumentProps> = ({ customer, customers, trips, onClose, onSelectCustomer }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [settings, setSettings] = useState<{
    websiteName: string;
    websiteEnglishName: string;
    receiptLogoUrl?: string;
  }>({
    websiteName: 'وكالة عبعوب للسياحة والأسفار',
    websiteEnglishName: 'ABOUB TRAVEL & TOURISM AGENCY',
    receiptLogoUrl: ''
  });

  useEffect(() => {
    const loadSettings = () => {
      try {
        const stored = localStorage.getItem('agencySettings');
        if (stored) {
          const parsed = JSON.parse(stored);
          setSettings({
            websiteName: parsed.websiteName || 'وكالة عبعوب للسياحة والأسفار',
            websiteEnglishName: parsed.websiteEnglishName || 'ABOUB TRAVEL & TOURISM AGENCY',
            receiptLogoUrl: parsed.receiptLogoUrl || ''
          });
        }
      } catch (e) {
        console.error(e);
      }
    };

    loadSettings();
    window.addEventListener('agencySettingsChanged', loadSettings);
    return () => window.removeEventListener('agencySettingsChanged', loadSettings);
  }, []);

  if (!customer) return null;

  const isFamily = customer.bookingType === 'family' || (customer.bookingType === undefined && (customer.companions || []).length > 0);

  const familyRelations = ['الزوجـة', 'الزوجة', 'wife', 'الزوج', 'husband', 'ابـن', 'ابن', 'son', 'ابنـة', 'ابنة', 'daughter', 'والـد', 'والد', 'father', 'والـدة', 'والدة', 'mother'];
  const isRealFamily = isFamily && (customer.companions || []).some(cmp => {
    const rel = (cmp.relationship || '').trim().toLowerCase();
    return familyRelations.some(fRel => fRel.toLowerCase() === rel || rel.includes('زوج') || rel.includes('ابن') || rel.includes('والد'));
  });

  // Index of this customer in the whole customer array
  const currentCustIndex = customers.findIndex((c) => c.id === customer.id);
  const totalInList = customers.length;

  // Find associated trip
  const trip = trips.find((t) => t.id === customer.tripId) || {
    id: '',
    name: 'رحلة غير معروفة',
    destination: 'غير محدد',
    price: 0,
    duration: 'غير محدد',
    date: 'غير محدد',
    status: 'active'
  };

  // Resolve prices dynamically using apartment pricing when available
  const totalPricePaid = customer.totalPrice !== undefined ? customer.totalPrice : (customer.pricePerPerson || trip.price);

  const paidVal = customer.paidAmount !== undefined 
    ? customer.paidAmount 
    : (customer.paymentStatus === 'paid' ? totalPricePaid : 0);

  const remainingVal = customer.remainingAmount !== undefined 
    ? customer.remainingAmount 
    : (customer.paymentStatus === 'unpaid' ? totalPricePaid : 0);

  // Get current date for issue
  const formattedDate = new Date().toLocaleDateString('ar-DZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Calculate potential departure date in Arabic
  const departureDateToUse = customer.departureDate || trip.date;
  const formattedDepartureDate = departureDateToUse !== 'غير محدد' && departureDateToUse
    ? new Date(departureDateToUse).toLocaleDateString('ar-DZ', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'غير محدد';

  const ageComputed = customer.age || calculateAge(customer.birthDate);
  const companionCount = (customer.companions || []).length;
  const totalPassengersCount = companionCount + 1;

  // Map Arabic translation for roles
  const getRoleArabic = (role?: 'tourist' | 'organizer' | 'driver') => {
    if (role === 'organizer') return 'مؤطر دائم';
    if (role === 'driver') return 'سائق الحافلة';
    return 'سائح مشترك';
  };

  // Map Arabic translation for payment status
  const getPaymentStatusArabic = (status?: 'paid' | 'partial' | 'unpaid') => {
    if (status === 'paid') return 'مدفوع بالكامل 🟢';
    if (status === 'partial') return 'دفعة جزئية (غير مكتمل) 🟡';
    return 'غير مدفوع (تأكيد معلق) 🔴';
  };

  // Trigger PDF Download
  const downloadPDF = async () => {
    const printArea = document.getElementById('a4-print-ticket-container');
    if (!printArea) return;
    
    setIsGenerating(true);

    // Helpers to rewrite modern CSS oklch / oklab color syntax to standard compatible HSLA/RGBA
    const convertOklchToHsl = (oklchStr: string): string => {
      try {
        const match = oklchStr.match(/oklch\(([^)]+)\)/);
        const content = match ? match[1] : oklchStr;
        
        if (content.includes('from') || content.includes('var')) {
          return 'hsl(215, 60%, 50%)'; // default blue
        }
        
        const cleanContent = content.replace(/,/g, ' ').trim().replace(/\s+/g, ' ');
        const parts = cleanContent.split('/');
        const coords = parts[0].trim().split(' ');
        const alphaPart = parts[1] ? parts[1].trim() : null;
        
        if (coords.length < 3) return 'hsl(215, 60%, 50%)';
        
        let l = parseFloat(coords[0]);
        if (coords[0].includes('%')) l = l / 100;
        
        let c = parseFloat(coords[1]);
        if (coords[1].includes('%')) c = c / 100;
        
        let h = parseFloat(coords[2]);
        if (isNaN(h)) h = 0;
        
        let s = Math.min(100, Math.max(5, Math.round(c * 250)));
        let lPct = Math.min(100, Math.max(0, Math.round(l * 100)));
        
        if (alphaPart) {
          return `hsla(${Math.round(h)}, ${s}%, ${lPct}%, ${alphaPart})`;
        }
        return `hsl(${Math.round(h)}, ${s}%, ${lPct}%)`;
      } catch (err) {
        console.error('Error converting oklch:', err);
        return 'hsl(215, 60%, 50%)';
      }
    };

    const convertOklabToRgb = (oklabStr: string): string => {
      try {
        const match = oklabStr.match(/oklab\(([^)]+)\)/);
        const content = match ? match[1] : oklabStr;
        
        if (content.includes('from') || content.includes('var')) {
          return 'rgb(120, 120, 120)'; // default neutral gray fallback
        }
        
        const cleanContent = content.replace(/,/g, ' ').trim().replace(/\s+/g, ' ');
        const parts = cleanContent.split('/');
        const coords = parts[0].trim().split(' ');
        const alphaPart = parts[1] ? parts[1].trim() : null;
        
        if (coords.length < 3) return 'rgb(120, 120, 120)';
        
        let l = parseFloat(coords[0]);
        if (coords[0].includes('%')) l = l / 100;
        
        let a = parseFloat(coords[1]);
        let b = parseFloat(coords[2]);
        
        // Fast linear approximation from OKLab to RGB
        let r = l + 0.396 * a + 0.215 * b;
        let g = l - 0.105 * a - 0.063 * b;
        let bl = l - 0.089 * a - 1.29 * b;
        
        let rByte = Math.min(255, Math.max(0, Math.round(r * 255)));
        let gByte = Math.min(255, Math.max(0, Math.round(g * 255)));
        let bByte = Math.min(255, Math.max(0, Math.round(bl * 255)));
        
        if (alphaPart) {
          return `rgba(${rByte}, ${gByte}, ${bByte}, ${alphaPart})`;
        }
        return `rgb(${rByte}, ${gByte}, ${bByte})`;
      } catch (err) {
        console.error('Error converting oklab:', err);
        return 'rgb(120, 120, 120)';
      }
    };

    const replaceUnsupportedColors = (str: string): string => {
      if (typeof str !== 'string') return str;
      let result = str;
      
      // Replace oklch(...)
      result = result.replace(/oklch\([^)]+\)/g, (match) => {
        return convertOklchToHsl(match);
      });
      
      // Replace oklab(...)
      result = result.replace(/oklab\([^)]+\)/g, (match) => {
        return convertOklabToRgb(match);
      });
      
      return result;
    };

    // 1. Temporarily rewrite style elements to replace unsupported CSS Level 4 modern colors before capturing
    const styleElements = Array.from(document.querySelectorAll('style'));
    const originalStyleContentsByElement = styleElements.map(el => ({
      element: el,
      originalText: el.textContent || ''
    }));

    styleElements.forEach(el => {
      const text = el.textContent || '';
      if (text.includes('oklch') || text.includes('oklab')) {
        el.textContent = replaceUnsupportedColors(text);
      }
    });

    // 2. Temporarily retrieve, rewrite, and inject external stylesheets (e.g., from link tags)
    const linkElements = Array.from(document.querySelectorAll('link[rel="stylesheet"]')) as HTMLLinkElement[];
    const tempStyleElements: HTMLStyleElement[] = [];
    const deactivatedLinks: HTMLLinkElement[] = [];

    for (const link of linkElements) {
      try {
        const href = link.href;
        const isSameOrigin = href.startsWith('/') || href.startsWith(window.location.origin);
        if (isSameOrigin) {
          const res = await fetch(href);
          if (res.ok) {
            const cssText = await res.text();
            if (cssText.includes('oklch') || cssText.includes('oklab')) {
              const processedCss = replaceUnsupportedColors(cssText);
              const tempStyle = document.createElement('style');
              tempStyle.setAttribute('data-temp-print-style', 'true');
              tempStyle.textContent = processedCss;
              document.head.appendChild(tempStyle);
              tempStyleElements.push(tempStyle);
              
              link.disabled = true;
              deactivatedLinks.push(link);
            }
          }
        }
      } catch (e) {
        console.warn('Could not preprocess external stylesheet:', link.href, e);
      }
    }

    // Recursively rewrite inline style attributes inside print area to avoid html2canvas failures
    const originalInlineStyles = new Map<HTMLElement, string | null>();
    const rewriteInlineStyles = (elem: HTMLElement) => {
      const styleAttr = elem.getAttribute('style');
      if (styleAttr && (styleAttr.includes('oklch') || styleAttr.includes('oklab'))) {
        originalInlineStyles.set(elem, styleAttr);
        elem.setAttribute('style', replaceUnsupportedColors(styleAttr));
      }
      Array.from(elem.children).forEach(child => {
        rewriteInlineStyles(child as HTMLElement);
      });
    };

    rewriteInlineStyles(printArea);

    // Save and override window.getComputedStyle to intercept oklch/oklab evaluations when html2canvas calls it
    const originalGetComputedStyle = window.getComputedStyle;
    window.getComputedStyle = function (elt: Element, pseudoElt?: string | null): CSSStyleDeclaration {
      const style = originalGetComputedStyle(elt, pseudoElt);
      return new Proxy(style, {
        get(target, prop, receiver) {
          const val = Reflect.get(target, prop, receiver);
          if (typeof val === 'function') {
            if (prop === 'getPropertyValue') {
              return function(propertyName: string) {
                const originalVal = target.getPropertyValue(propertyName);
                if (typeof originalVal === 'string' && (originalVal.includes('oklch') || originalVal.includes('oklab'))) {
                  return replaceUnsupportedColors(originalVal);
                }
                return originalVal;
              };
            }
            return val.bind(target);
          }
          if (typeof val === 'string' && (val.includes('oklch') || val.includes('oklab'))) {
            return replaceUnsupportedColors(val);
          }
          return val;
        }
      }) as any;
    };

    const cleanupAllPreprocessedStyles = () => {
      // Restore window.getComputedStyle immediately
      window.getComputedStyle = originalGetComputedStyle;

      // Restore style Elements
      originalStyleContentsByElement.forEach(item => {
        item.element.textContent = item.originalText;
      });

      // Restore inline styles
      originalInlineStyles.forEach((originalText, elem) => {
        if (originalText === null) {
          elem.removeAttribute('style');
        } else {
          elem.setAttribute('style', originalText);
        }
      });

      // Remove temp inline style tags created for links & re-enable links
      tempStyleElements.forEach(el => el.remove());
      deactivatedLinks.forEach(link => {
        link.disabled = false;
      });
    };

    // Hide control buttons on capturing, scale up resolution for Arabic font readability
    html2canvas(printArea, {
      scale: 2, 
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    })
      .then((canvas) => {
        cleanupAllPreprocessedStyles();

        const imgData = canvas.toDataURL('image/png');
        
        // Standard A4 proportions (210 x 297 mm)
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
        });

        const imgWidth = 210;
        const pageHeight = 297;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

        const filename = `receipt_${customer.lastName}_${customer.invoiceNumber || 'ticket'}.pdf`;
        try {
          pdf.save(filename);
        } catch (saveError) {
          console.warn('Standard pdf.save() failed, using dynamic local blob url download:', saveError);
          const blobOutput = pdf.output('blob');
          const blobUrl = URL.createObjectURL(blobOutput);
          const downloadAnchor = document.createElement('a');
          downloadAnchor.href = blobUrl;
          downloadAnchor.download = filename;
          document.body.appendChild(downloadAnchor);
          downloadAnchor.click();
          document.body.removeChild(downloadAnchor);
        }
        setIsGenerating(false);
      })
      .catch((err) => {
        cleanupAllPreprocessedStyles();

        console.error('Error generating PDF:', err);
        setIsGenerating(false);
        try {
          alert('حدث خطأ أثناء حفظ الوصل كـ PDF. يرجى استخدام زر "الطباعة الفورية المباشرة" كبديل سريع ومضمون.');
        } catch (e) {
          console.warn('Alert was blocked or failed:', e);
        }
      });
  };

  // Trigger Native Browser Print
  const triggerNativePrint = () => {
    const originalTitle = document.title;
    document.title = ''; // Clear webpage title so it does not appear in browser print headers
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 150);
  };

  return (
    <div id="print-modal-overlay" className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 md:p-6 font-sans">
      {/* Printable page layout container */}
      <div id="print-modal-content" className="bg-slate-50 rounded-2xl max-w-6xl w-full p-6 shadow-xl relative flex flex-col md:flex-row gap-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Controls Column (Hidden on print) */}
        <div className="md:w-1/4 flex flex-col justify-between gap-6 print:hidden text-right" dir="rtl">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-slate-800">
              <Receipt className="text-blue-600" size={18} />
              <h3 className="font-bold text-sm">
                {isFamily ? 'معاينة وصل الحجز الموحد' : 'معاينة وصل الحجز الفردي'}
              </h3>
            </div>
            
            <p className="text-[11px] text-slate-500 leading-relaxed">
              {isFamily 
                ? 'هذه معاينة لـ "وصل تأكيد الحجز العائلي الرسمي". يحتوي هذا المستند على كافة البيانات المالية وأسماء أفراد العائلة في وصل دفع واحد شامل.'
                : 'هذه معاينة لـ "وصل تأكيد الحجز الفردي الرسمي". يحتوي هذا المستند على التفاصيل الشخصية للزبون وتفاصيل رحلته ووصل دفع قياسي فردي.'}
            </p>

            {/* Navigation controls */}
            {totalInList > 1 && (
              <div className="bg-slate-100 p-2.5 rounded-xl border border-slate-200/85 space-y-1.5 shadow-3xs my-2 text-center">
                <span className="text-[10px] font-bold text-slate-500 block">
                  التنقل بين الحجوزات ({currentCustIndex + 1} من {totalInList})
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={currentCustIndex === 0}
                    onClick={() => onSelectCustomer(customers[currentCustIndex - 1])}
                    className={`flex-1 py-1 px-1.5 border rounded-lg font-black text-[10px] flex items-center justify-center gap-1 transition-all ${
                      currentCustIndex === 0
                        ? 'opacity-40 bg-slate-50 border-slate-150 text-slate-400 cursor-not-allowed'
                        : 'bg-white border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 active:scale-95 cursor-pointer text-slate-700'
                    }`}
                  >
                     السابق ➡️
                  </button>
                  <button
                    type="button"
                    disabled={currentCustIndex === totalInList - 1}
                    onClick={() => onSelectCustomer(customers[currentCustIndex + 1])}
                    className={`flex-1 py-1 px-1.5 border rounded-lg font-black text-[10px] flex items-center justify-center gap-1 transition-all ${
                      currentCustIndex === totalInList - 1
                        ? 'opacity-40 bg-slate-50 border-slate-150 text-slate-400 cursor-not-allowed'
                        : 'bg-white border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 active:scale-95 cursor-pointer text-slate-700'
                    }`}
                  >
                    ⬅️ التالي
                  </button>
                </div>
              </div>
            )}

            <div className="border-t border-slate-205 my-4 pt-4 space-y-2.5 text-xs text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-400">
                  {isFamily 
                    ? (isRealFamily ? "رب العائلة (المسؤول):" : "المسؤول:") 
                    : "الزبون الرئيسي:"}
                </span>
                <strong className="text-slate-850">{customer.firstName} {customer.lastName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{isFamily ? "رقم الحجز (Family ID):" : "رقم الحجز الفردي:"}</span>
                <span className="font-mono font-bold text-slate-800">{customer.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">عدد الركاب:</span>
                <strong className="text-blue-600">{totalPassengersCount} أفراد</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">البرنامج:</span>
                <span className="font-bold text-slate-800 text-left truncate max-w-[120px]">{trip.destination}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">حالة الدفع الكلية:</span>
                <span className="font-bold text-[10px]">{getPaymentStatusArabic(customer.paymentStatus)}</span>
              </div>
              <div className="flex justify-between font-bold border-t border-slate-100 pt-2 text-slate-900 mt-1">
                <span className="text-slate-500 text-[11px]">المبلغ الإجمالي الكلي:</span>
                <span className="font-mono text-xs text-slate-800">{(totalPricePaid).toLocaleString('ar-DZ')} دج</span>
              </div>
              {customer.paymentStatus === 'partial' && (
                <>
                  <div className="flex justify-between font-bold text-slate-900">
                    <span className="text-amber-700 text-[11px]">المبلغ المدفوع بالفعل:</span>
                    <span className="font-mono text-xs text-amber-600">{(paidVal).toLocaleString('ar-DZ')} دج</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900">
                    <span className="text-rose-700 text-[11px]">المبلغ المتبقي للسداد:</span>
                    <span className="font-mono text-xs text-rose-600">{(remainingVal).toLocaleString('ar-DZ')} دج</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-200">
            {/* Direct Print button */}
            <button
              onClick={triggerNativePrint}
              id="btn-trigger-native-print"
              className="w-full py-2.5 px-4 bg-slate-850 hover:bg-slate-900 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all shadow active:scale-95 cursor-pointer"
            >
              <Printer size={14} />
              طباعة فورية للوصل
            </button>

            {/* Close button */}
            <button
              onClick={onClose}
              id="btn-close-print-modal"
              className="w-full py-2 px-4 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-3xs"
            >
              <X size={14} />
              إغلاق المعاينة
            </button>
          </div>
        </div>

        {/* Paper Container Preview (The actual A4 Ticket) */}
        <div id="a4-print-ticket-wrapper" className="flex-1 overflow-auto max-h-[75vh] h-[75vh] border border-slate-250 rounded-xl bg-white shadow-inner flex justify-center hide-scrollbar">
          
          <div
            id="a4-print-ticket-container"
            className={`w-[210mm] min-h-[297mm] ${isFamily ? (companionCount > 2 ? 'p-[8mm]' : 'p-[11mm]') : 'p-[15mm]'} bg-white text-slate-800 relative select-text flex flex-col justify-between shadow-xs print:shadow-none`}
            dir="rtl"
          >
            {/* DOCUMENT WATERMARK */}
            <div className="absolute inset-0 opacity-[0.05] flex items-center justify-center pointer-events-none z-0">
              <Logo size={isFamily && companionCount > 2 ? 340 : 420} src={settings.receiptLogoUrl} />
            </div>

            <div className="z-10 flex flex-col min-h-full justify-between print:block print:h-auto print:min-h-0">
              <div>
                
                {/* RECIPIENT HEADER */}
                <div className={`flex items-start justify-between border-b-2 border-blue-600 ${isFamily ? 'pb-3 mb-3' : 'pb-5 mb-5'} z-10`}>
                  {/* Agency details */}
                  <div className="space-y-1 text-right">
                    <Logo size={isFamily && companionCount > 2 ? 60 : 70} showText={false} src={settings.receiptLogoUrl} />
                    <h1 className="font-sans font-black text-lg text-slate-805 tracking-tight mt-1">
                      {settings.websiteName}
                    </h1>
                    <p className="text-[9px] text-slate-400 font-mono tracking-wide uppercase">
                      {settings.websiteEnglishName}
                    </p>
                    <div className="pt-2 flex flex-col gap-0.5 text-[11px] text-slate-600">
                      <span className="flex items-center gap-1.5 font-medium">
                        <MapPin size={11} className="text-blue-600" />
                        الشارع 01، حي عياد تبسبست، تقرت، الجزائر
                      </span>
                      <span className="flex items-center gap-1.5 font-sans font-bold">
                        <Phone size={11} className="text-blue-600" />
                        0667910148 / 0696789633
                      </span>
                    </div>
                  </div>

                  {/* Document metadata (Invoice No, Date, Logo) */}
                  <div className="text-left flex flex-col items-end pt-2">
                    <div className="bg-blue-50 text-blue-700 font-extrabold px-3.5 py-1.5 rounded-lg border border-blue-100 text-[11px] mb-3 font-sans">
                      {isFamily ? 'تأكيد حجز ووصل دفع عائلي موحد' : 'تأكيد حجز ووصل دفع فردي رسمي'}
                    </div>
                    
                    <div className="space-y-1 text-right text-[11px] text-slate-600 font-sans">
                      <div>
                        {isFamily ? 'رقم الحجز (Family ID):' : 'رقم الحجز الموحد:'} <span className="font-mono text-blue-800 font-black bg-blue-50 text-[11px] px-2 py-0.5 rounded border border-blue-100">{customer.invoiceNumber}</span>
                      </div>
                      <div>
                        تاريخ الإصدار: <span className="text-slate-800 font-semibold">{formattedDate}</span>
                      </div>
                      {customer.branchName && (
                        <div>
                          فرع التسجيل: <span className="text-slate-800 font-semibold">{customer.branchName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* TICKET DESCRIPTION TITLE */}
                <div className={`bg-gradient-to-r from-blue-700 to-blue-600 text-white rounded-lg ${isFamily ? 'py-1.5 px-3 mb-3' : 'py-2.5 px-4 mb-5'} text-center select-none shadow-sm z-10 font-bold flex items-center justify-between`}>
                  <span className="font-bold text-xs">
                    {isFamily ? 'وصل حجز عائلي رسمي موحد' : 'وصل حجز فردي رسمي لمسافر'}
                  </span>
                  <span className="text-[11px] font-mono font-bold tracking-tight bg-white/20 px-2 py-0.5 rounded">
                    عدد الركاب: {totalPassengersCount} أشخاص
                  </span>
                </div>

                {/* 1. PRIMARY ACCOUNT RESPONSIBLE (LEADER) - ONLY FOR INDIVIDUAL BOOKING */}
                {!isFamily ? (
                  <div className="border border-slate-200 rounded-lg p-4 mb-5 bg-slate-50/55 z-10 print:break-inside-avoid">
                    <h3 className="font-sans font-bold text-xs text-blue-600 border-b border-slate-205 pb-1.5 mb-2.5 flex items-center gap-1.5">
                      <CheckCircle size={13} className="text-blue-600" />
                      أولاً: معلومات مستلم الحجز والزبون الأساسي
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-[11px] text-slate-700 text-right">
                      <div>
                        <span className="text-slate-400 block mb-0.5">اسم ولقب المسافر الكامل:</span>
                        <strong className="text-slate-900 text-xs font-black bg-white px-2 py-0.5 rounded border border-slate-200/50 inline-block">
                          {customer.lastName} {customer.firstName}
                        </strong>
                      </div>

                      <div>
                        <span className="text-slate-400 block mb-0.5">رقم الهاتف الشامل:</span>
                        <strong className="text-slate-900 font-mono text-xs tracking-wide bg-white px-2 py-0.5 rounded border border-slate-200/50 inline-block">
                          {customer.phone}
                        </strong>
                      </div>

                      <div>
                        <span className="text-slate-400 block mb-0.5">تاريخ ومكان الميلاد:</span>
                        <strong className="text-slate-900">
                          {customer.birthDate} ({customer.birthPlace || 'غير محدد'}) - السن: {ageComputed} سنة
                        </strong>
                      </div>

                      <div>
                        <span className="text-slate-400 block mb-0.5">الصفة الفردية:</span>
                        <strong className="text-slate-900 font-bold">{getRoleArabic(customer.role)}</strong>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-100/90 border border-slate-200/80 rounded-lg py-1.5 px-3 mb-2.5 flex items-center justify-between text-[10px] text-slate-700 font-sans z-10 relative">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 font-bold">{isRealFamily ? "رب العائلة (المسؤول):" : "المسؤول:"}</span>
                      <strong className="text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200/60 font-extrabold">{customer.firstName} {customer.lastName}</strong>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono">
                      <span className="text-slate-400 font-bold">رقم الهاتف للاتصال:</span>
                      <strong className="text-blue-700 bg-white px-2 py-0.5 rounded border border-slate-200/60 font-black">{customer.phone}</strong>
                    </div>
                  </div>
                )}

                {/* 2. COMPANIONS AND FAMILY MEMBERS TABLE (ONLY FOR FAMILY BOOKING) */}
                {isFamily && (
                  <div className={`border border-slate-200 rounded-lg ${companionCount > 2 ? 'p-2 mb-2.5' : 'p-3.5 mb-3.5'} bg-slate-50/55 z-10 font-sans print:break-inside-avoid`}>
                    <h3 className={`font-sans font-bold text-xs text-blue-600 border-b border-slate-205 ${companionCount > 2 ? 'pb-1 mb-1.5' : 'pb-1.5 mb-2.5'} flex items-center gap-1.5`}>
                      <Users size={13} className="text-blue-600" />
                      أولاً: قائمة جميع أفراد العائلة والمرافقين المشمولين بالحجز
                    </h3>

                    {companionCount > 0 ? (
                      <div className="overflow-hidden border border-slate-200 rounded-md bg-white">
                        <table className="w-full text-right text-[10px] border-collapse">
                          <thead>
                            <tr className="bg-slate-100/80 text-slate-700 border-b border-slate-200 font-bold">
                              <th className={`${companionCount > 2 ? 'py-0.5 px-1.5' : 'py-1 px-2.5'} w-12 text-center`}>الرقم</th>
                              <th className={`${companionCount > 2 ? 'py-0.5 px-1.5' : 'py-1 px-2.5'}`}>صلة القرابة</th>
                              <th className={`${companionCount > 2 ? 'py-0.5 px-1.5' : 'py-1 px-2.5'}`}>الاسم واللقب الكامل</th>
                              <th className={`${companionCount > 2 ? 'py-0.5 px-1.5' : 'py-1 px-2.5'}`}>تاريخ ومكان الميلاد (السن)</th>
                              <th className={`${companionCount > 2 ? 'py-0.5 px-1.5' : 'py-1 px-2.5'}`}>نوع الإقامة المبرمجة</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-150 font-medium">
                            {/* Main Leader row inside table too for extreme clarity */}
                            <tr className="bg-blue-50/20">
                              <td className={`${companionCount > 2 ? 'py-0.5 px-1.5' : 'py-1 px-2.5'} text-center font-bold text-blue-800`}>1</td>
                              <td className={`${companionCount > 2 ? 'py-0.5 px-1.5' : 'py-1 px-2.5'} font-bold text-blue-800`}>
                                {isRealFamily ? "رب العائلة (المسؤول)" : "المسؤول"}
                              </td>
                              <td className={`${companionCount > 2 ? 'py-0.5 px-1.5' : 'py-1 px-2.5'} font-bold text-slate-900`}>{customer.firstName} {customer.lastName}</td>
                              <td className={`${companionCount > 2 ? 'py-0.5 px-1.5' : 'py-1 px-2.5'}`}>{customer.birthDate} ({customer.birthPlace || 'غير محدد'}) - {ageComputed} سنة</td>
                              <td className={`${companionCount > 2 ? 'py-0.5 px-1.5' : 'py-1 px-2.5'} text-slate-600`}>{customer.roomType || 'عرض قياسي موحد'}</td>
                            </tr>

                            {/* Companion Rows */}
                            {customer.companions.map((cmp, index) => (
                              <tr key={cmp.id} className="hover:bg-slate-50/50">
                                <td className={`${companionCount > 2 ? 'py-0.5 px-1.5' : 'py-1 px-2.5'} text-center text-slate-500`}>{index + 2}</td>
                                <td className={`${companionCount > 2 ? 'py-0.5 px-1.5' : 'py-1 px-2.5'} font-bold text-blue-600`}>
                                  {cmp.relationship === 'wife' || cmp.relationship?.toLowerCase() === 'wife' ? 'زوجة' : (cmp.relationship || 'مرافق')}
                                </td>
                                <td className={`${companionCount > 2 ? 'py-0.5 px-1.5' : 'py-1 px-2.5'} font-semibold text-slate-800`}>{cmp.firstName} {cmp.lastName}</td>
                                <td className={`${companionCount > 2 ? 'py-0.5 px-1.5' : 'py-1 px-2.5'}`}>{cmp.birthDate} ({cmp.birthPlace || 'غير محدد'}) - {calculateAge(cmp.birthDate)} سنة</td>
                                <td className={`${companionCount > 2 ? 'py-0.5 px-1.5' : 'py-1 px-2.5'} text-slate-500`}>{cmp.roomType || 'عرض قياسي موفر'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="bg-white rounded p-4 text-center text-slate-400 italic text-[11px] border border-slate-150">
                        لا يوجد مرافقين مضافين لهذا الحجز (حجز مخصص لفرد واحد فقط)
                      </div>
                    )}
                  </div>
                )}

                {/* CONDITIONAL RENDER: SIDE-BY-SIDE GRID FOR FAMILY OR STACKED FOR INDIVIDUAL */}
                {isFamily ? (
                  <div className="grid grid-cols-2 gap-3 mb-2.5 z-10 font-sans">
                    
                    {/* ثانياً: تفاصيل البرنامج المعتمد للأسرة */}
                    <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50/55 flex flex-col justify-between print:break-inside-avoid">
                      <div>
                        <h3 className="font-sans font-bold text-[11px] text-blue-600 border-b border-slate-205 pb-1 mb-1.5 flex items-center gap-1.5">
                          <Calendar size={12} className="text-blue-600" />
                          ثانياً: تفاصيل البرنامج المعتمد للأسرة
                        </h3>

                        <div className="space-y-1 text-[9.5px] text-slate-700 text-right font-sans">
                          <div>
                            <span className="text-slate-400 block mb-0.5 font-bold">اسم البرنامج والمسار المعتمد بالوكالة:</span>
                            <strong className="text-slate-950 text-[10.5px] font-bold bg-white px-2 py-0.5 rounded border border-slate-200/50 block leading-tight">
                              {trip.name}
                            </strong>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-slate-400 block mb-0.5">الوجهة والبلد:</span>
                              <strong className="text-slate-900">{trip.destination}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block mb-0.5 font-sans">مدة البرنامج:</span>
                              <strong className="text-slate-900">{trip.duration}</strong>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/30">
                            <div>
                              <span className="text-slate-400 block mb-0.5">تاريخ المغادرة المرتقب:</span>
                              <strong className="text-blue-600 font-extrabold">{formattedDepartureDate}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block mb-0.5">الإقامة الموحدة:</span>
                              <strong className="text-slate-900">{customer.roomType || 'عرض قياسي موحد'}</strong>
                            </div>
                          </div>
                        </div>
                      </div>

                      {trip.departurePlaceNotes && (
                        <div className="mt-1.5 pt-1 border-t border-slate-200/30 text-[8.5px]">
                          <span className="text-slate-400 block mb-0.5 font-bold">مكان التجمع ونقاط الانطلاق:</span>
                          <p className="text-slate-800 font-sans font-bold leading-normal bg-white/70 px-1.5 py-0.5 rounded border border-slate-200/30">
                            {trip.departurePlaceNotes}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* ثالثاً: بيانات الحساب المالي الإجمالي للحجز العائلي */}
                    <div className="border-2 border-blue-200 rounded-lg p-2.5 bg-blue-50/[0.15] flex flex-col justify-between print:break-inside-avoid">
                      <div>
                        <h3 className="font-sans font-bold text-[11px] text-blue-600 border-b border-slate-205 pb-1 mb-1.5 flex items-center gap-1.5">
                          <Info size={12} className="text-blue-600" />
                          ثالثاً: بيانات الحساب المالي الإجمالي
                        </h3>

                        <div className="space-y-1 text-[9.5px] text-slate-800 text-right">
                          <div className="flex items-center justify-between bg-white/80 px-2 py-0.5 rounded border border-slate-150">
                            <span className="text-slate-500 font-bold">إجمالي المسافرين:</span>
                            <span className="font-extrabold text-blue-800">{totalPassengersCount} مسافرين</span>
                          </div>

                          <div className="flex items-center justify-between border-b border-slate-200/40 pb-1">
                            <span className="text-slate-500 font-bold">المبلغ الإجمالي الكلي:</span>
                            <strong className="text-[11px] text-slate-900 font-mono font-extrabold">
                              {totalPricePaid.toLocaleString('ar-DZ')} د.ج
                            </strong>
                          </div>

                          <div className="space-y-1">
                            {customer.paymentStatus === 'partial' ? (
                              <>
                                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">
                                  <span className="text-emerald-800 font-bold">المبلغ المدفوع (العربون):</span>
                                  <strong className="text-[10px] text-emerald-700 font-mono font-black">
                                    {paidVal.toLocaleString('ar-DZ')} د.ج
                                  </strong>
                                </div>
                                <div className="flex items-center justify-between bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded">
                                  <span className="text-rose-800 font-bold">المبلغ المتبقي:</span>
                                  <strong className="text-[10px] text-rose-700 font-mono font-black">
                                    {remainingVal.toLocaleString('ar-DZ')} د.ج
                                  </strong>
                                </div>
                              </>
                            ) : customer.paymentStatus === 'paid' ? (
                              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">
                                <span className="text-emerald-800 font-bold">المدفوع بالكامل:</span>
                                <strong className="text-[11px] text-emerald-700 font-mono font-black">
                                  {totalPricePaid.toLocaleString('ar-DZ')} د.ج
                                </strong>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded">
                                <span className="text-rose-800 font-bold">المتبقي للسداد:</span>
                                <strong className="text-[11px] text-rose-700 font-mono font-black">
                                  {totalPricePaid.toLocaleString('ar-DZ')} د.ج
                                </strong>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {customer.notes && (
                        <div className="border-t border-slate-200 mt-1.5 pt-1 text-[8.5px] text-slate-500 leading-normal text-right">
                          <span className="font-bold text-slate-700 font-sans">ملاحظات:</span> {customer.notes}
                        </div>
                      )}
                    </div>

                  </div>
                ) : (
                  /* Normal Side-by-Side Grid for Individual Bookings to match Family layout */
                  <div className="grid grid-cols-2 gap-3 mb-2.5 z-10 font-sans">
                    
                    {/* ثانياً: تفاصيل وجهة السفر والبرنامج المعتمد للزبون */}
                    <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50/55 flex flex-col justify-between print:break-inside-avoid">
                      <div>
                        <h3 className="font-sans font-bold text-[11px] text-blue-600 border-b border-slate-205 pb-1 mb-1.5 flex items-center gap-1.5">
                          <Calendar size={12} className="text-blue-600" />
                          ثانياً: تفاصيل وجهة السفر والبرنامج المعتمد
                        </h3>

                        <div className="space-y-1 text-[9.5px] text-slate-700 text-right font-sans">
                          <div>
                            <span className="text-slate-400 block mb-0.5 font-bold">اسم البرنامج والمسار المعتمد بالوكالة:</span>
                            <strong className="text-slate-950 text-[10.5px] font-bold bg-white px-2 py-0.5 rounded border border-slate-200/50 block leading-tight">
                              {trip.name}
                            </strong>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-slate-400 block mb-0.5">الوجهة والبلد:</span>
                              <strong className="text-slate-900">{trip.destination}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block mb-0.5 font-sans">مدة البرنامج:</span>
                              <strong className="text-slate-900">{trip.duration}</strong>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/30">
                            <div>
                              <span className="text-slate-400 block mb-0.5">تاريخ المغادرة المرتقب:</span>
                              <strong className="text-blue-600 font-extrabold">{formattedDepartureDate}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block mb-0.5 font-sans">الإقامة للزبون:</span>
                              <strong className="text-slate-900">{customer.roomType || 'عرض قياسي موحد'}</strong>
                            </div>
                          </div>
                        </div>
                      </div>

                      {trip.departurePlaceNotes && (
                        <div className="mt-1.5 pt-1 border-t border-slate-200/30 text-[8.5px]">
                          <span className="text-slate-400 block mb-0.5 font-bold">مكان التجمع ونقاط الانطلاق:</span>
                          <p className="text-slate-800 font-sans font-bold leading-normal bg-white/70 px-1.5 py-0.5 rounded border border-slate-200/30">
                            {trip.departurePlaceNotes}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* ثالثاً: بيانات الحساب المالي الإجمالي للحجز الفردي */}
                    <div className="border-2 border-blue-200 rounded-lg p-2.5 bg-blue-50/[0.15] flex flex-col justify-between print:break-inside-avoid">
                      <div>
                        <h3 className="font-sans font-bold text-[11px] text-blue-600 border-b border-slate-205 pb-1 mb-1.5 flex items-center gap-1.5">
                          <Info size={12} className="text-blue-600" />
                          ثالثاً: بيانات الحساب المالي الإجمالي
                        </h3>

                        <div className="space-y-1 text-[9.5px] text-slate-800 text-right">
                          <div className="flex items-center justify-between bg-white/80 px-2 py-0.5 rounded border border-slate-150">
                            <span className="text-slate-500 font-bold">إجمالي المسافرين:</span>
                            <span className="font-extrabold text-blue-800">مسافر واحد (حجز فردي)</span>
                          </div>

                          <div className="flex items-center justify-between border-b border-slate-200/40 pb-1">
                            <span className="text-slate-500 font-bold">المبلغ الإجمالي الكلي:</span>
                            <strong className="text-[11px] text-slate-900 font-mono font-extrabold">
                              {totalPricePaid.toLocaleString('ar-DZ')} د.ج
                            </strong>
                          </div>

                          <div className="space-y-1">
                            {customer.paymentStatus === 'partial' ? (
                              <>
                                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">
                                  <span className="text-emerald-800 font-bold">المبلغ المدفوع (العربون):</span>
                                  <strong className="text-[10px] text-emerald-700 font-mono font-black">
                                    {paidVal.toLocaleString('ar-DZ')} د.ج
                                  </strong>
                                </div>
                                <div className="flex items-center justify-between bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded">
                                  <span className="text-rose-800 font-bold">المبلغ المتبقي:</span>
                                  <strong className="text-[10px] text-rose-700 font-mono font-black">
                                    {remainingVal.toLocaleString('ar-DZ')} د.ج
                                  </strong>
                                </div>
                              </>
                            ) : customer.paymentStatus === 'paid' ? (
                              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">
                                <span className="text-emerald-800 font-bold">المدفوع بالكامل:</span>
                                <strong className="text-[11px] text-emerald-700 font-mono font-black">
                                  {totalPricePaid.toLocaleString('ar-DZ')} د.ج
                                </strong>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded">
                                <span className="text-rose-800 font-bold">المتبقي للسداد:</span>
                                <strong className="text-[11px] text-rose-700 font-mono font-black">
                                  {totalPricePaid.toLocaleString('ar-DZ')} د.ج
                                </strong>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {customer.notes && (
                        <div className="border-t border-slate-200 mt-1.5 pt-1 text-[8.5px] text-slate-500 leading-normal text-right">
                          <span className="font-bold text-slate-700 font-sans">ملاحظات:</span> {customer.notes}
                        </div>
                      )}
                    </div>

                  </div>
                )}

                {/* TERMS & REGULATIONS */}
                <div className={`border border-slate-200 rounded-lg ${isFamily ? 'p-2 mb-2 bg-slate-50/10' : 'p-2.5 mb-2.5 bg-slate-50/10'} z-10 print:break-inside-avoid`}>
                  <h4 className="font-sans font-bold text-xs text-slate-700 mb-1 flex items-center gap-1">
                    <Info size={11} className="text-slate-400" />
                    شروط سفر وإقرارات تذاكر وكالة عبعوب:
                  </h4>
                  <ol className="list-decimal list-inside space-y-0.5 text-[8.5px] text-slate-500 leading-relaxed pl-2">
                    <li>تعتبر بيانات هذا الوصل تأكيداً رسمياً لحفّار السكاكين وحساب الغرف بمجرد تأكيد ختم مصلحة الحجوزات.</li>
                    <li>لا يمكن إلغاء الحجز أو استرجاع المدفوعات بعد تأكيد الحجز.</li>
                    <li>يلتزم أفراد الحجز بالحضور لمركز المغادرة في الأوقات المحددة سلفاً مصحوبين بجواز السفر أو بطاقة التعريف.</li>
                  </ol>
                </div>

                {/* SIGNATURE & STAMP SECTION */}
                <div className={`grid grid-cols-2 gap-8 ${isFamily ? 'mt-2.5 pt-2' : 'mt-5 pt-4'} border-t border-dashed border-slate-200 z-10 print:break-inside-avoid`}>
                  <div className="text-right">
                    <span className="text-[10px] font-extrabold text-stone-700 block mb-0.5">إمضاء العميل / المستلم:</span>
                    <div className={`border border-dashed border-slate-200 rounded-xl bg-slate-50/30 flex items-end justify-center pb-1 ${isFamily ? 'h-11' : 'h-16'}`}>
                      <span className="text-[9px] text-slate-400 font-bold">توقيع المعني</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-extrabold text-stone-700 block mb-0.5">إمضاء وختم الوكالة:</span>
                    <div className={`border border-dashed border-slate-200 rounded-xl bg-slate-50/30 flex items-center justify-center relative ${isFamily ? 'h-11' : 'h-16'}`}>
                      <span className="text-[9px] text-slate-450 font-bold">الختم والتوقيع الرسمي</span>
                      
                      {/* Decorative circular stamp placeholder */}
                      <div className={`absolute left-4 top-1.5 w-10 h-10 border border-blue-200/50 rounded-full flex flex-col items-center justify-center text-[5px] text-blue-300/60 rotate-12 select-none uppercase pointer-events-none ${isFamily ? 'scale-[0.8]' : ''}`}>
                        <span className="scale-[0.8] leading-none font-bold">ABOUB</span>
                        <span className="scale-[0.7] leading-none">TRAVEL</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* STATUS BAR / OFFICIAL DIGITAL RECEIPT FOOTER */}
              <div className="flex items-center justify-between border-t border-slate-200 pt-4 mt-6 z-10 text-xs font-sans">
                <div className="space-y-1 text-right">
                  <span className="text-[10px] text-slate-700 block font-extrabold">وصل حجز مالي وإداري مؤكد ({settings.websiteName})</span>
                  <span className="text-[8.5px] text-slate-400 block font-medium">تم إصدار وتحرير المعاملة إلكترونياً عبر البوابة الرسمية للوكالة وتصبح سارية بمجرد الإمضاء والختم.</span>
                </div>

                <div className="flex items-center gap-4 text-left">
                  <div className="text-left font-sans">
                    <span className="text-[9px] text-slate-450 block">تاريخ إصدار الوصل:</span>
                    <span className="text-[10.5px] text-slate-800 font-extrabold font-mono block">{formattedDate}</span>
                  </div>
                  
                  {/* Small Digital verification seal tag */}
                  <div className="border-2 border-blue-500/80 text-blue-500/80 rounded-full w-14 h-14 flex flex-col items-center justify-center border-dashed p-1 shrink-0 rotate-12 select-none">
                    <span className="text-[4px] font-black tracking-tight leading-none font-sans">{settings.websiteName.split(' ')[0] || 'وكالة'} {settings.websiteName.split(' ')[1] || 'عبعوب'}</span>
                    <span className="text-[5px] font-extrabold uppercase font-mono tracking-tighter leading-none">{settings.websiteEnglishName.split(' ')[0] || 'ABOUB'}</span>
                    <div className="border-t border-blue-500/80 w-full my-0.5"></div>
                    <span className="text-[5.5px] font-bold">
                      {isFamily ? 'حجز عائلي' : 'حجز فردي'}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* Global CSS injected into print mode via direct print styles */}
      <style>{`
        /* Hide scrollbars for preview pane on screen and print */
        .hide-scrollbar::-webkit-scrollbar {
          display: none !important;
        }
        .hide-scrollbar {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }

        /* Screen Preview Responsive Zoom Scale */
        #a4-print-ticket-container {
          zoom: 0.85;
          transform-origin: top center;
        }

        @media screen and (max-width: 1200px) {
          #a4-print-ticket-container {
            zoom: 0.75;
          }
        }
        @media screen and (max-width: 1024px) {
          #a4-print-ticket-container {
            zoom: 0.7;
          }
        }
        @media screen and (max-width: 768px) {
          #a4-print-ticket-container {
            zoom: 0.95;
          }
        }
        @media screen and (max-width: 640px) {
          #a4-print-ticket-container {
            zoom: 0.75;
          }
        }
        @media screen and (max-width: 480px) {
          #a4-print-ticket-container {
            zoom: 0.55;
          }
        }
        @media screen and (max-width: 380px) {
          #a4-print-ticket-container {
            zoom: 0.45;
          }
        }

        @page {
          size: A4 portrait;
          margin: 0 !important;
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 0 !important;
          }
          html, body, #root, #root > div {
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
            position: static !important;
            display: block !important;
          }
          body {
            visibility: hidden;
            background: white !important;
          }
          #print-modal-overlay, 
          #print-modal-content, 
          #a4-print-ticket-wrapper, 
          #a4-print-ticket-container, 
          #a4-print-ticket-container * {
            visibility: visible !important;
          }
          #print-modal-overlay {
            position: static !important;
            width: 100% !important;
            height: auto !important;
            background: transparent !important;
            padding: 0 !important;
            margin: 0 !important;
            display: block !important;
          }
          #print-modal-content {
            position: static !important;
            width: 100% !important;
            height: auto !important;
            background: transparent !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            display: block !important;
          }
          #a4-print-ticket-wrapper {
            display: block !important;
            position: static !important;
            overflow: visible !important;
            max-height: none !important;
            height: auto !important;
            border: none !important;
            background: transparent !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          #a4-print-ticket-container {
            position: relative !important;
            width: 210mm !important;
            min-height: 297mm !important;
            height: auto !important;
            margin: 0 auto !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
            box-sizing: border-box !important;
            zoom: 1 !important;
            overflow: visible !important;
          }
          .print\:hidden {
            display: none !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
};
