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
}

export interface Trip {
  id: string;
  name: string;
  destination: string;
  price: number; // in DZD (Algerian Dinar)
  duration: string;
  date: string;
  status: 'active' | 'completed' | 'upcoming';
}
