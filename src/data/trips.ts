/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Trip } from '../types';

export const defaultTrips: Trip[] = [
  {
    id: 'trip-soviva-tunisia',
    name: 'عرض خاص – رحلة إلى تونس | Soviva Resort',
    destination: 'سوسة / القنطاوي - تونس',
    price: 45000,
    duration: '7 أيام / 6 ليالي',
    date: '2026-07-01',
    status: 'active',
    priceChild: 30000
  },
  {
    id: 'trip-family-tunisia',
    name: 'رحلة صيفية عائلية إلى تونس (شقق مجهزة ومكيفة)',
    destination: 'سوسة، المنستير، الحمامات - تونس',
    price: 24000,
    duration: '7 أيام / 5 ليالي',
    date: '2026-07-10',
    status: 'active',
    priceDouble: 33500,
    priceTriple: 30000,
    priceQuadruple: 28000,
    priceQuintuple: 24000,
    priceSextuple: 24000,
    priceChild: 10000
  },
  {
    id: 'trip-jijel-beach',
    name: 'رحلة صيفية إلى جوهرة الشرق الجزائري - جيجل الساحرة والمناظر الطبيعية لبلاد كاب',
    destination: 'جيجل وبجاية - الجزائر',
    price: 12900,
    duration: '6 أيام / 5 ليالٍ',
    date: '2026-07-15',
    status: 'active',
    priceDouble: 17500,
    priceTriple: 14500,
    priceQuadruple: 13505,
    priceQuintuple: 12900,
    priceSingle: 25000, // hotel stay
    priceChild: 10000
  },
  {
    id: 'trip-istanbul-8d',
    name: 'رحلة مميزة إلى إسطنبول وجزر الأميرات البديعة (فندق 4 نجوم والخطوط التركية)',
    destination: 'إسطنبول - تركيا',
    price: 135000,
    duration: '8 أيام / 7 ليالٍ',
    date: '2026-06-26',
    status: 'active',
    priceDouble: 129000,
    priceTriple: 129000,
    priceSingle: 169000,
    priceChild: 99000
  },
  {
    id: 'trip-center-algeria',
    name: 'برنامج العائلات الرائع: الجزائر العاصمة – بومرداس – تيبازة',
    destination: 'العاصمة، بومرداس وتيبازة - الجزائر',
    price: 12500,
    duration: '6 أيام / 5 ليالٍ',
    date: '2026-07-20',
    status: 'active',
    priceDouble: 15500,
    priceTriple: 14500,
    priceQuadruple: 12500,
    priceQuintuple: 12500,
    priceSingle: 23000, // luxury hotel stay
    priceChild: 10000
  },
  {
    id: 'trip-sharm-el-sheikh-2026',
    name: 'عرض صيف 2026 إلى شرم الشيخ – مصر 🇪🇬 | Parrotel Aqua Park Resort 4★',
    destination: 'شرم الشيخ - مصر',
    price: 199000,
    duration: '10 أيام / 9 ليالٍ',
    date: '2026-07-24',
    dates: ['2026-07-31', '2026-08-05', '2026-08-14', '2026-08-21'],
    status: 'active',
    priceDouble: 199000,
    priceTriple: 199000,
    priceSingle: 269000,
    priceChild: 145000
  }
];
