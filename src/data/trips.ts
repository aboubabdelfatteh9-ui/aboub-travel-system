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
    status: 'active'
  },
  {
    id: 'trip-family-tunisia',
    name: 'رحلة صيفية عائلية إلى تونس (شقق مجهزة ومكيفة)',
    destination: 'سوسة، المنستير، الحمامات - تونس',
    price: 24000,
    duration: '7 أيام / 5 ليالي',
    date: '2026-07-10',
    status: 'active'
  },
  {
    id: 'trip-jijel-beach',
    name: 'رحلة صيفية إلى جوهرة الشرق الجزائري - جيجل الساحرة والمناظر الطبيعية لبلاد كاب',
    destination: 'جيجل وبجاية - الجزائر',
    price: 12900,
    duration: '6 أيام / 5 ليالٍ',
    date: '2026-07-15',
    status: 'active'
  },
  {
    id: 'trip-istanbul-8d',
    name: 'رحلة مميزة إلى إسطنبول وجزر الأميرات البديعة (فندق 4 نجوم والخطوط التركية)',
    destination: 'إسطنبول - تركيا',
    price: 135000,
    duration: '8 أيام / 7 ليالٍ',
    date: '2026-06-26',
    status: 'active'
  },
  {
    id: 'trip-center-algeria',
    name: 'برنامج العائلات الرائع: الجزائر العاصمة – بومرداس – تيبازة',
    destination: 'العاصمة، بومرداس وتيبازة - الجزائر',
    price: 12500,
    duration: '6 أيام / 5 ليالٍ',
    date: '2026-07-20',
    status: 'active'
  },
  {
    id: 'trip-sharm-el-sheikh-2026',
    name: 'عرض صيف 2026 إلى شرم الشيخ – مصر 🇪🇬 | Parrotel Aqua Park Resort 4★',
    destination: 'شرم الشيخ - مصر',
    price: 199000,
    duration: '10 أيام / 9 ليالٍ',
    date: '2026-07-24',
    dates: ['2026-07-31', '2026-08-05', '2026-08-14', '2026-08-21'],
    status: 'active'
  }
];
