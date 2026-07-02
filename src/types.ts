/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Companion {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  birthPlace: string;
  age: number;
  role: 'tourist' | 'organizer' | 'driver';
  roomType: string;
  relationship: string; // صلة القرابة (زوجـة، ابن، ابنة، مرافق...)
}

export interface Customer {
  id: string; // رقم الحجز الموحد (Family ID)
  firstName: string; // اسم المسؤول الرئيسي (الأب)
  lastName: string; // لقب العائلة / لقب المسؤول
  birthDate: string;
  birthPlace: string;
  phone: string;
  tripId: string;
  departureDate?: string; // تاريخ الانطلاق المحدد للزبون
  peopleCount: number; // إجمالي الأفراد المعنيين (المسؤول + المرافقين)
  registrationDate: string;
  invoiceNumber: string; // رقم الحجز / الفاتورة الشاملة
  notes?: string;
  age?: number;               // السن التلقائي للمسؤول الرئيسي
  roomType?: string;          // نوع الإقامة للمسؤول الرئيسي
  pricePerPerson?: number;    // تكلفة الفرد للمسؤول الرئيسي
  totalPrice?: number;        // المبلغ الإجمالي المدفوع للحجز العائلي
  role?: 'tourist' | 'organizer' | 'driver'; // صفة المسؤول الرئيسي
  companions: Companion[]; // قائمة كافة أفراد العائلة المرافقين
  paymentStatus: 'paid' | 'partial' | 'unpaid'; // حالة الدفع
  bookingType?: 'individual' | 'family'; // نوع الحجز (فردي أو عائلي)
  
  // Auditing details for employees & branches
  employeeId?: string;
  employeeName?: string;
  branchId?: string;
  branchName?: string;
}

export interface Employee {
  id: string;
  username: string;
  name: string;
  password?: string;
  role: 'Admin' | 'Manager' | 'Agent';
  branchId: string;
  branchName: string;
  disabled?: boolean;
}

export interface Branch {
  id: string;
  name: string;
  location: string;
}

export interface OperationLog {
  id: string;
  employeeId: string;
  employeeName: string;
  branchName: string;
  actionType: 'add_customer' | 'update_customer' | 'delete_customer' | 'add_trip' | 'update_trip' | 'delete_trip';
  details: string;
  timestamp: string;
}

export interface CustomPrice {
  id: string;
  label: string;
  price: number;
}

export interface Trip {
  id: string;
  name: string;
  destination: string;
  price: number; // in DZD (Algerian Dinar)
  duration: string;
  date: string;
  dates?: string[]; // تواريخ الانطلاق المتعددة للرحلة
  status: 'active' | 'completed' | 'upcoming';
  departurePlaceNotes?: string; // تفاصيل مكان الانطلاق ونقاط التجمع والوصول
  isProfessional?: boolean; // هل هي رحلة احترافية (لها تفاصيل أسعار) أم عادية (سعر موحد)
  priceSingle?: number; // سعر الغرفة الفردية
  priceDouble?: number; // سعر الغرفة الثنائية
  priceTriple?: number; // سعر الغرفة الثلاثية
  priceQuadruple?: number; // سعر الغرفة الرباعية
  priceQuintuple?: number; // سعر الغرفة الخماسية
  priceSextuple?: number; // سعر الغرفة السداسية
  priceChild?: number; // سعر المقعد للأطفال
  customPrices?: CustomPrice[]; // قائمة أسعار مخصصة إضافية
}
