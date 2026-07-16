/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Customer, Trip, Companion } from '../types';
import { Sparkles, UserPlus, Phone, Calendar, MapPin, Users, PlaneTakeoff, Info, Building2, Trash2, Plus, DollarSign, ListPlus, ShieldAlert } from 'lucide-react';

interface CustomerFormProps {
  trips: Trip[];
  onAddCustomer: (customer: Omit<Customer, 'id' | 'registrationDate' | 'invoiceNumber'>) => void;
}

// Simple age calculator helper
export const calculateAge = (birthDateString: string): number => {
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

// Match a saved roomType string or option value to current dynamic room options
export const matchRoomTypeOption = (
  savedRoomType: string,
  options: { value: string; label: string; price: number }[]
) => {
  if (!savedRoomType) return null;
  // 1. Exact match by label or value
  const exact = options.find(o => o.label === savedRoomType || o.value === savedRoomType);
  if (exact) return exact;

  // 2. Prefix match (ignoring price in parentheses)
  const cleanSaved = savedRoomType.split('(')[0].trim().split(' (')[0].trim();
  const matched = options.find(o => {
    const cleanLabel = o.label.split('(')[0].trim().split(' (')[0].trim();
    return cleanLabel === cleanSaved || o.value === savedRoomType;
  });
  return matched || null;
};

export interface PriceFieldConfig {
  label: string;
  defaultVal?: number;
  disabled?: boolean;
}

export interface TripPriceConfig {
  priceSingle: PriceFieldConfig;
  priceDouble: PriceFieldConfig;
  priceTriple: PriceFieldConfig;
  priceQuadruple: PriceFieldConfig;
  priceQuintuple: PriceFieldConfig;
  priceSextuple: PriceFieldConfig;
  priceChild: PriceFieldConfig;
  priceBase: PriceFieldConfig;
}

// Custom helper to get labels and fallback default values for Algerian style trip room pricing
export const getBaseTripPriceLabelsAndDefaults = (tripId: string): TripPriceConfig => {
  if (tripId === 'trip-soviva-tunisia') {
    return {
      priceSingle: { label: 'غير مستخدم في هذا العرض', defaultVal: undefined, disabled: true },
      priceDouble: { label: 'غير مستخدم في هذا العرض', defaultVal: undefined, disabled: true },
      priceTriple: { label: 'غير مستخدم في هذا العرض', defaultVal: undefined, disabled: true },
      priceQuadruple: { label: 'غير مستخدم في هذا العرض', defaultVal: undefined, disabled: true },
      priceQuintuple: { label: 'غير مستخدم في هذا العرض', defaultVal: undefined, disabled: true },
      priceSextuple: { label: 'غير مستخدم في هذا العرض', defaultVal: undefined, disabled: true },
      priceChild: { label: 'سعر طفل من 3 إلى 10 سنوات (دج)', defaultVal: 30000, disabled: false },
      priceBase: { label: 'سعر فندق Soviva Resort (دج)', defaultVal: 45000, disabled: false }
    };
  }
  if (tripId === 'trip-family-tunisia') {
    return {
      priceSingle: { label: 'غير مستخدم في هذا العرض', defaultVal: undefined, disabled: true },
      priceDouble: { label: 'شقة ثنائية Double (دج/شخص)', defaultVal: 33500, disabled: false },
      priceTriple: { label: 'شقة ثلاثية Triple (دج/شخص)', defaultVal: 30000, disabled: false },
      priceQuadruple: { label: 'شقة رباعية Quadruple (دج/شخص)', defaultVal: 28000, disabled: false },
      priceQuintuple: { label: 'شقة خماسية أو سداسية (دج/شخص)', defaultVal: 24000, disabled: false },
      priceSextuple: { label: 'شقة سداسية (مكرر للخماسي) (دج/شخص)', defaultVal: 24000, disabled: false },
      priceChild: { label: 'سعر طفل من 3 إلى 10 سنوات (مقعد فقط) (دج)', defaultVal: 10000, disabled: false },
      priceBase: { label: 'السعر المباشر للمقعد/الشقة المشتركة (دج)', defaultVal: 24000, disabled: false }
    };
  }
  if (tripId === 'trip-jijel-beach') {
    return {
      priceSingle: { label: 'إقامة فندقية (ثنائي/ثلاثي/رباعي) (دج/شخص)', defaultVal: 25000, disabled: false },
      priceDouble: { label: 'شقة مجهزة لـ 2 أفراد (دج/شخص)', defaultVal: 17500, disabled: false },
      priceTriple: { label: 'شقة مجهزة لـ 3 أفراد (دج/شخص)', defaultVal: 14500, disabled: false },
      priceQuadruple: { label: 'شقة مجهزة لـ 4 أفراد (دج/شخص)', defaultVal: 13505, disabled: false },
      priceQuintuple: { label: 'شقة مجهزة لـ 5 أفراد (دج/شخص)', defaultVal: 12900, disabled: false },
      priceSextuple: { label: 'غير مستخدم في هذا العرض', defaultVal: undefined, disabled: true },
      priceChild: { label: 'سعر طفل من 3 إلى 10 سنوات (مقعد فقط) (دج)', defaultVal: 10000, disabled: false },
      priceBase: { label: 'السعر الأساسي الموحد (دج)', defaultVal: 12900, disabled: false }
    };
  }
  if (tripId === 'trip-istanbul-8d') {
    return {
      priceSingle: { label: 'غرفة فردية Single (دج/شخص)', defaultVal: 169000, disabled: false },
      priceDouble: { label: 'غرفة ثنائية/ثلاثية Double/Triple (دج/شخص)', defaultVal: 129000, disabled: false },
      priceTriple: { label: 'غرفة ثنائية/ثلاثية (مكرر للـ Double) (دج/شخص)', defaultVal: 129000, disabled: false },
      priceQuadruple: { label: 'غير مستخدم في هذا العرض', defaultVal: undefined, disabled: true },
      priceQuintuple: { label: 'غير مستخدم في هذا العرض', defaultVal: undefined, disabled: true },
      priceSextuple: { label: 'غير مستخدم في هذا العرض', defaultVal: undefined, disabled: true },
      priceChild: { label: 'سعر طفل من 3 إلى 11 سنة (دج)', defaultVal: 99000, disabled: false },
      priceBase: { label: 'السعر الأساسي للرحلة (دج)', defaultVal: 135000, disabled: false }
    };
  }
  if (tripId === 'trip-center-algeria') {
    return {
      priceSingle: { label: 'إقامة فندقية راقية (دج/شخص)', defaultVal: 23000, disabled: false },
      priceDouble: { label: 'مرقد - غرفة ثنائية (دج/شخص)', defaultVal: 15500, disabled: false },
      priceTriple: { label: 'مرقد - غرفة ثلاثية (دج/شخص)', defaultVal: 14500, disabled: false },
      priceQuadruple: { label: 'مرقد - غرفة رباعية أو خماسية (دج/شخص)', defaultVal: 12500, disabled: false },
      priceQuintuple: { label: 'مرقد - غرفة خماسية (مكرر للرباعي) (دج/شخص)', defaultVal: 12500, disabled: false },
      priceSextuple: { label: 'غير مستخدم في هذا العرض', defaultVal: undefined, disabled: true },
      priceChild: { label: 'سعر طفل من 3 إلى 10 سنوات (مقعد فقط) (دج)', defaultVal: 10000, disabled: false },
      priceBase: { label: 'السعر الأساسي المباشر (دج)', defaultVal: 12500, disabled: false }
    };
  }
  if (tripId === 'trip-sharm-el-sheikh-2026') {
    return {
      priceSingle: { label: 'غرفة فردية Single (دج/شخص)', defaultVal: 269000, disabled: false },
      priceDouble: { label: 'غرفة ثنائية/ثلاثية Double/Triple (دج/شخص)', defaultVal: 199000, disabled: false },
      priceTriple: { label: 'غرفة ثنائية/ثلاثية (مكرر للـ Double) (دج/شخص)', defaultVal: 199000, disabled: false },
      priceQuadruple: { label: 'غير مستخدم في هذا العرض', defaultVal: undefined, disabled: true },
      priceQuintuple: { label: 'غير مستخدم في هذا العرض', defaultVal: undefined, disabled: true },
      priceSextuple: { label: 'غير مستخدم في هذا العرض', defaultVal: undefined, disabled: true },
      priceChild: { label: 'سعر طفل من 2 إلى 11 سنة (دج)', defaultVal: 145000, disabled: false },
      priceBase: { label: 'السعر الأساسي للرحلة (دج)', defaultVal: 199000, disabled: false }
    };
  }
  
  // Fallback for custom trips
  return {
    priceSingle: { label: 'غرفة فردية Single (دج)', defaultVal: undefined, disabled: false },
    priceDouble: { label: 'غرفة ثنائية Double (دج)', defaultVal: undefined, disabled: false },
    priceTriple: { label: 'غرفة ثلاثية Triple (دج)', defaultVal: undefined, disabled: false },
    priceQuadruple: { label: 'غرفة رباعية Quadruple (دج)', defaultVal: undefined, disabled: false },
    priceQuintuple: { label: 'غرفة خماسية Quintuple (دج)', defaultVal: undefined, disabled: false },
    priceSextuple: { label: 'غرفة سداسية Sextuple (دج)', defaultVal: undefined, disabled: false },
    priceChild: { label: 'سعر الأطفال Child (دج)', defaultVal: undefined, disabled: false },
    priceBase: { label: 'سعر المقعد بالدينار (DZD)', defaultVal: undefined, disabled: false }
  };
};

export const getTripPriceLabelsAndDefaults = (tripId: string, tripObj?: Trip): TripPriceConfig => {
  const config = getBaseTripPriceLabelsAndDefaults(tripId);
  
  if (tripObj) {
    const keys: (keyof TripPriceConfig)[] = [
      'priceSingle',
      'priceDouble',
      'priceTriple',
      'priceQuadruple',
      'priceQuintuple',
      'priceSextuple',
      'priceChild',
      'priceBase'
    ];
    const standardLabels: Record<string, string> = {
      priceSingle: 'غرفة فردية Single (دج)',
      priceDouble: 'غرفة ثنائية Double (دج)',
      priceTriple: 'غرفة ثلاثية Triple (دج)',
      priceQuadruple: 'غرفة رباعية Quadruple (دج)',
      priceQuintuple: 'غرفة خماسية Quintuple (دج)',
      priceSextuple: 'غرفة سداسية Sextuple (دج)',
      priceChild: 'سعر الأطفال Child (دج)',
      priceBase: 'سعر المقعد بالدينار (DZD)'
    };
    keys.forEach((key) => {
      config[key].disabled = false;
      if (config[key].label === 'غير مستخدم في هذا العرض') {
        config[key].label = standardLabels[key];
      }
    });
  }
  return config;
};

// Rich lookup table based on the customer's published ads
export const getRoomOptionsForTrip = (tId: string, basePrice: number, tripObj?: Trip) => {
  let options: { value: string; label: string; price: number }[] = [];
  let excludedKeys: string[] = [];

  // Predefined Trips with dynamic pricing support:
  if (tId === 'trip-soviva-tunisia') {
    const priceStandard = tripObj?.price ?? basePrice ?? 45000;
    const priceChild = tripObj?.priceChild ?? 30000;
    options = [
      { value: 'soviva_standard', label: `فندق Soviva Resort - فطور صباحي + عشاء (${priceStandard.toLocaleString('ar-DZ')} دج/شخص)`, price: priceStandard },
      { value: 'child_3_10', label: `طفل من 3 إلى 10 سنوات (${priceChild.toLocaleString('ar-DZ')} دج)`, price: priceChild },
      { value: 'child_under_2', label: 'طفل أقل من سنتين (مجاناً - 0 دج)', price: 0 }
    ];
    excludedKeys = ['priceChild'];
  } else if (tId === 'trip-family-tunisia') {
    const priceFiveSix = tripObj?.priceQuintuple ?? tripObj?.priceSextuple ?? 24000;
    const priceQuad = tripObj?.priceQuadruple ?? 28000;
    const priceTriple = tripObj?.priceTriple ?? 30000;
    const priceDouble = tripObj?.priceDouble ?? 33500;
    const priceChild = tripObj?.priceChild ?? 10000;

    options = [
      { value: 'five_six', label: `شقة خماسية أو سداسية (${priceFiveSix.toLocaleString('ar-DZ')} دج/شخص)`, price: priceFiveSix },
      { value: 'quad', label: `شقة رباعية (${priceQuad.toLocaleString('ar-DZ')} دج/شخص)`, price: priceQuad },
      { value: 'triple', label: `شقة ثلاثية (${priceTriple.toLocaleString('ar-DZ')} دج/شخص)`, price: priceTriple },
      { value: 'double', label: `شقة ثنائية (${priceDouble.toLocaleString('ar-DZ')} دج/شخص)`, price: priceDouble },
      { value: 'child_3_10', label: `طفل من 3 إلى 10 سنوات (مقعد فقط - ${priceChild.toLocaleString('ar-DZ')} دج)`, price: priceChild },
      { value: 'child_under_2', label: 'طفل أقل من سنتين (مجاناً - 0 دج)', price: 0 }
    ];
    excludedKeys = ['priceDouble', 'priceTriple', 'priceQuadruple', 'priceQuintuple', 'priceSextuple', 'priceChild'];
  } else if (tId === 'trip-jijel-beach') {
    const priceQuintuple = tripObj?.priceQuintuple ?? 12900;
    const priceQuad = tripObj?.priceQuadruple ?? 13505;
    const priceTriple = tripObj?.priceTriple ?? 14500;
    const priceDouble = tripObj?.priceDouble ?? 17500;
    const priceHotel = tripObj?.priceSingle ?? 25000;
    const priceChild = tripObj?.priceChild ?? 10000;

    options = [
      { value: 'jijel_apt_5', label: `شقة مجهزة - عائلية لـ 5 أفراد (${priceQuintuple.toLocaleString('ar-DZ')} دج/شخص)`, price: priceQuintuple },
      { value: 'jijel_apt_4', label: `شقة مجهزة - عائلية لـ 4 أفراد (${priceQuad.toLocaleString('ar-DZ')} دج/شخص)`, price: priceQuad },
      { value: 'jijel_apt_3', label: `شقة مجهزة - عائلية لـ 3 أفراد (${priceTriple.toLocaleString('ar-DZ')} دج/شخص)`, price: priceTriple },
      { value: 'jijel_apt_2', label: `شقة مجهزة - عائلية لـ 2 أفراد (${priceDouble.toLocaleString('ar-DZ')} دج/شخص)`, price: priceDouble },
      { value: 'jijel_hotel', label: `إقامة فندقية (ثنائي/ثلاثي/رباعي) مع فطور صباحي (${priceHotel.toLocaleString('ar-DZ')} دج/شخص)`, price: priceHotel },
      { value: 'child_3_10', label: `طفل من 3 إلى 10 سنوات (مقعد فقط - ${priceChild.toLocaleString('ar-DZ')} دج)`, price: priceChild },
      { value: 'child_under_2', label: 'طفل أقل من سنتين (مجاناً - 0 دج)', price: 0 }
    ];
    excludedKeys = ['priceSingle', 'priceDouble', 'priceTriple', 'priceQuadruple', 'priceQuintuple', 'priceChild'];
  } else if (tId === 'trip-istanbul-8d') {
    const priceDoubleTriple = tripObj?.priceDouble ?? tripObj?.priceTriple ?? 129000;
    const priceSingle = tripObj?.priceSingle ?? 169000;
    const priceChild = tripObj?.priceChild ?? 99000;
    const priceUnder2 = 18000;

    options = [
      { value: 'istanbul_adult_double_triple', label: `شخص بالغ - غرفة ثنائية أو ثلاثية (${priceDoubleTriple.toLocaleString('ar-DZ')} دج/شخص)`, price: priceDoubleTriple },
      { value: 'istanbul_single', label: `شخص واحد بمفرده - غرفة فردية (${priceSingle.toLocaleString('ar-DZ')} دج/شخص)`, price: priceSingle },
      { value: 'istanbul_child_3_11', label: `طفل بين 3 إلى 11 سنة (${priceChild.toLocaleString('ar-DZ')} دج/شخص)`, price: priceChild },
      { value: 'istanbul_child_under_2', label: `طفل أقل من سنتين (${priceUnder2.toLocaleString('ar-DZ')} دج/شخص)`, price: priceUnder2 }
    ];
    excludedKeys = ['priceSingle', 'priceDouble', 'priceTriple', 'priceChild'];
  } else if (tId === 'trip-sharm-el-sheikh-2026') {
    const priceDoubleTriple = tripObj?.priceDouble ?? tripObj?.priceTriple ?? 199000;
    const priceSingle = tripObj?.priceSingle ?? 269000;
    const priceChild = tripObj?.priceChild ?? 145000;
    const priceUnder2 = 34000;

    options = [
      { value: 'sharm_double_triple', label: `شخص بالغ - غرفة ثنائية أو ثلاثية (${priceDoubleTriple.toLocaleString('ar-DZ')} دج/شخص)`, price: priceDoubleTriple },
      { value: 'sharm_single', label: `شخص واحد بمفرده - غرفة فردية (${priceSingle.toLocaleString('ar-DZ')} دج/شخص)`, price: priceSingle },
      { value: 'sharm_child_2_11', label: `طفل بين 2 إلى 11 سنة (${priceChild.toLocaleString('ar-DZ')} دج/شخص)`, price: priceChild },
      { value: 'sharm_child_under_2', label: `رضيع أقل من سنتين (${priceUnder2.toLocaleString('ar-DZ')} دج/شخص)`, price: priceUnder2 }
    ];
    excludedKeys = ['priceSingle', 'priceDouble', 'priceTriple', 'priceChild'];
  } else if (tId === 'trip-center-algeria') {
    const priceQuadFive = tripObj?.priceQuadruple ?? tripObj?.priceQuintuple ?? 12500;
    const priceTriple = tripObj?.priceTriple ?? 14500;
    const priceDouble = tripObj?.priceDouble ?? 15500;
    const priceHotel = tripObj?.priceSingle ?? 23000;
    const priceChild = tripObj?.priceChild ?? 10000;

    options = [
      { value: 'mergad_quad_five', label: `مرقد - غرفة رباعية أو خماسية (${priceQuadFive.toLocaleString('ar-DZ')} دج/شخص)`, price: priceQuadFive },
      { value: 'mergad_triple', label: `مرقد - غرفة ثلاثية (${priceTriple.toLocaleString('ar-DZ')} دج/شخص)`, price: priceTriple },
      { value: 'mergad_double', label: `مرقد - غرفة ثنائية (${priceDouble.toLocaleString('ar-DZ')} دج/شخص)`, price: priceDouble },
      { value: 'hotel_stay', label: `إقامة فندقية راقية (${priceHotel.toLocaleString('ar-DZ')} دج/شخص)`, price: priceHotel },
      { value: 'child_3_10', label: `طفل من 3 إلى 10 سنوات (مقعد فقط - ${priceChild.toLocaleString('ar-DZ')} دج)`, price: priceChild },
      { value: 'child_under_2', label: 'طفل أقل من سنتين (مجاناً - 0 دج)', price: 0 }
    ];
    excludedKeys = ['priceSingle', 'priceDouble', 'priceTriple', 'priceQuadruple', 'priceQuintuple', 'priceChild'];
  } else {
    // Generic fallback for custom/professional trips added or edited
    if (tripObj) {
      const customOpts = [];
      const isProf = !!tripObj.isProfessional;

      // Check if there are any specific adult room rates defined
      const hasAdultRoomRates = 
        tripObj.priceSingle !== undefined || 
        tripObj.priceDouble !== undefined || 
        tripObj.priceTriple !== undefined || 
        tripObj.priceQuadruple !== undefined || 
        tripObj.priceQuintuple !== undefined || 
        tripObj.priceSextuple !== undefined;

      // If it's a regular trip (not professional), OR if it is professional but no specific adult room rates are specified,
      // we ALWAYS include the standard uniform/base price option!
      if (!isProf || !hasAdultRoomRates) {
        customOpts.push({
          value: 'standard',
          label: `سعر موحد ومباشر (${basePrice.toLocaleString('ar-DZ')} دج/شخص)`,
          price: basePrice
        });
      }

      if (isProf) {
        if (tripObj.priceDouble !== undefined) {
          customOpts.push({
            value: 'double',
            label: `غرفة ثنائية Double (${tripObj.priceDouble.toLocaleString('ar-DZ')} دج/شخص)`,
            price: tripObj.priceDouble
          });
        }
        if (tripObj.priceTriple !== undefined) {
          customOpts.push({
            value: 'triple',
            label: `غرفة ثلاثية Triple (${tripObj.priceTriple.toLocaleString('ar-DZ')} دج/شخص)`,
            price: tripObj.priceTriple
          });
        }
        if (tripObj.priceQuadruple !== undefined) {
          customOpts.push({
            value: 'quadruple',
            label: `غرفة رباعية Quadruple (${tripObj.priceQuadruple.toLocaleString('ar-DZ')} دج/شخص)`,
            price: tripObj.priceQuadruple
          });
        }
        if (tripObj.priceQuintuple !== undefined) {
          customOpts.push({
            value: 'quintuple',
            label: `غرفة خماسية Quintuple (${tripObj.priceQuintuple.toLocaleString('ar-DZ')} دج/شخص)`,
            price: tripObj.priceQuintuple
          });
        }
        if (tripObj.priceSextuple !== undefined) {
          customOpts.push({
            value: 'sextuple',
            label: `غرفة سداسية Sextuple (${tripObj.priceSextuple.toLocaleString('ar-DZ')} دج/شخص)`,
            price: tripObj.priceSextuple
          });
        }
        if (tripObj.priceSingle !== undefined) {
          customOpts.push({
            value: 'single',
            label: `غرفة فردية Single (${tripObj.priceSingle.toLocaleString('ar-DZ')} دج/شخص)`,
            price: tripObj.priceSingle
          });
        }
        if (tripObj.priceChild !== undefined) {
          customOpts.push({
            value: 'child_custom',
            label: `سعر الأطفال Child (${tripObj.priceChild.toLocaleString('ar-DZ')} دج)`,
            price: tripObj.priceChild
          });
        }
      }
      
      customOpts.push({
        value: 'child_under_2_custom',
        label: 'طفل أقل من سنتين (مجاناً - 0 دج)',
        price: 0
      });

      // Append any custom pricing fields
      if (isProf && tripObj.customPrices && Array.isArray(tripObj.customPrices)) {
        tripObj.customPrices.forEach((cp) => {
          if (!customOpts.some(opt => opt.value === `custom_${cp.id}`)) {
            customOpts.push({
              value: `custom_${cp.id}`,
              label: `${cp.label} (${cp.price.toLocaleString('ar-DZ')} دج)`,
              price: cp.price
            });
          }
        });
      }

      return customOpts;
    }

    // Fallback for custom trips added inside the dashboard if no tripObj was passed
    return [
      { value: 'standard', label: `سعر موحد ومباشر (${basePrice.toLocaleString('ar-DZ')} دج/شخص)`, price: basePrice },
      { value: 'double', label: `غرفة ثنائية مزدوجة (+10%) (${Math.round(basePrice * 1.1).toLocaleString('ar-DZ')} دج/شخص)`, price: Math.round(basePrice * 1.1) },
      { value: 'suite', label: `جناح سويت ملكي فاخر (+30%) (${Math.round(basePrice * 1.3).toLocaleString('ar-DZ')} دج/شخص)`, price: Math.round(basePrice * 1.3) }
    ];
  }

  // Now dynamically append any newly activated price fields that are not in excludedKeys
  if (tripObj && tripObj.isProfessional) {
    const extraKeys: { key: keyof Trip; value: string; label: string }[] = [
      { key: 'priceDouble', value: 'double', label: 'غرفة ثنائية Double' },
      { key: 'priceTriple', value: 'triple', label: 'غرفة ثلاثية Triple' },
      { key: 'priceQuadruple', value: 'quadruple', label: 'غرفة رباعية Quadruple' },
      { key: 'priceQuintuple', value: 'quintuple', label: 'غرفة خماسية Quintuple' },
      { key: 'priceSextuple', value: 'sextuple', label: 'غرفة سداسية Sextuple' },
      { key: 'priceSingle', value: 'single', label: 'غرفة فردية Single' },
      { key: 'priceChild', value: 'child_custom', label: 'سعر الأطفال Child' },
    ];

    extraKeys.forEach(({ key, value, label }) => {
      if (!excludedKeys.includes(key) && tripObj[key] !== undefined) {
        if (!options.some(opt => opt.value === value)) {
          options.push({
            value,
            label: `${label} (${(tripObj[key] as number).toLocaleString('ar-DZ')} دج/شخص)`,
            price: tripObj[key] as number
          });
        }
      }
    });

    // Append any custom pricing fields
    if (tripObj.customPrices && Array.isArray(tripObj.customPrices)) {
      tripObj.customPrices.forEach((cp) => {
        if (!options.some(opt => opt.value === `custom_${cp.id}`)) {
          options.push({
            value: `custom_${cp.id}`,
            label: `${cp.label} (${cp.price.toLocaleString('ar-DZ')} دج)`,
            price: cp.price
          });
        }
      });
    }
  }

  return options;
};

export const CustomerForm: React.FC<CustomerFormProps> = ({ trips, onAddCustomer }) => {
  // 1. Leader (Main responsible person) Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    birthDate: '',
    birthPlace: '',
    phone: '',
    tripId: trips[0]?.id || '',
    departureDate: trips[0]?.date || '',
    notes: '',
    roomType: '',
    pricePerPerson: 0,
    role: 'tourist' as 'tourist' | 'organizer' | 'driver',
    paymentStatus: 'paid' as 'paid' | 'partial' | 'unpaid',
    nationalId: '', // رقم التعريف الوطني
  });

  // 2. Added Companions State
  const [companions, setCompanions] = useState<Companion[]>([]);

  // Booking Type Selection State
  const [bookingType, setBookingType] = useState<'individual' | 'family'>('individual');

  // 3. New Companion In-progress Form State
  const [companionForm, setCompanionForm] = useState({
    firstName: '',
    lastName: '',
    birthDate: '',
    birthPlace: '',
    role: 'tourist' as 'tourist' | 'organizer' | 'driver',
    roomType: '',
    relationship: 'الزوجـة', // Default to first dropdown option 'الزوجـة'
    nationalId: '', // رقم التعريف الوطني للمرافق
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [companionError, setCompanionError] = useState<string>('');
  const [customTotalPrice, setCustomTotalPrice] = useState<string>('');
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [remainingAmount, setRemainingAmount] = useState<string>('');

  const activeSelectedTrip = trips.find(t => t.id === formData.tripId) || trips[0];
  const activeOptions = activeSelectedTrip ? getRoomOptionsForTrip(activeSelectedTrip.id, activeSelectedTrip.price, activeSelectedTrip) : [];

  // Helper inside to determine room price for helper
  const getCompanionRoomPrice = (roomTypeLabel: string, roleVal: string) => {
    if (roleVal === 'organizer' || roleVal === 'driver') return 0;
    const matched = matchRoomTypeOption(roomTypeLabel, activeOptions);
    return matched ? matched.price : (activeSelectedTrip ? activeSelectedTrip.price : 0);
  };

  // Sync apartment selection options and defaults on trip change for lead and companion
  useEffect(() => {
    if (trips.length > 0) {
      const selectedTripId = formData.tripId || trips[0].id;
      const tripObj = trips.find(t => t.id === selectedTripId) || trips[0];
      const opts = getRoomOptionsForTrip(tripObj.id, tripObj.price, tripObj);
      
      setFormData(prev => {
        const matches = matchRoomTypeOption(prev.roomType, opts);
        const resolvedRoomType = matches ? matches.label : (opts[0]?.label || '');
        const standardPrice = matches ? matches.price : (opts[0]?.price || tripObj.price);
        const resolvedPrice = (prev.role === 'organizer' || prev.role === 'driver') ? 0 : standardPrice;
        const departureDateToUse = prev.tripId !== selectedTripId ? tripObj.date : (prev.departureDate || tripObj.date);

        return {
          ...prev,
          tripId: selectedTripId,
          departureDate: departureDateToUse,
          roomType: resolvedRoomType,
          pricePerPerson: resolvedPrice
        };
      });

      // Also adjust pending companion default room type
      setCompanionForm(prev => {
        const matches = matchRoomTypeOption(prev.roomType, opts);
        return {
          ...prev,
          roomType: matches ? matches.label : (opts[0]?.label || '')
        };
      });

      // Also adjust already-added companions' room types so their labels are synced to the new prices!
      setCompanions(prevComps => {
        return prevComps.map(cmp => {
          const matches = matchRoomTypeOption(cmp.roomType, opts);
          if (matches) {
            return {
              ...cmp,
              roomType: matches.label
            };
          }
          return cmp;
        });
      });
    }
  }, [trips, formData.tripId]);

  // Set the companion's default Last Name to match the father's/leader's Last Name when they type it
  useEffect(() => {
    if (formData.lastName && !companionForm.lastName) {
      setCompanionForm(prev => ({
        ...prev,
        lastName: formData.lastName
      }));
    }
  }, [formData.lastName]);

  // Auto calculate companion room recommendations based on their age input
  useEffect(() => {
    if (companionForm.birthDate && activeSelectedTrip) {
      const computedAge = calculateAge(companionForm.birthDate);
      const opts = activeOptions;
      let recommendedOpt = null;

      if (formData.tripId === 'trip-istanbul-8d') {
        if (computedAge < 2) {
          recommendedOpt = opts.find(o => o.value === 'istanbul_child_under_2');
        } else if (computedAge >= 3 && computedAge <= 11) {
          recommendedOpt = opts.find(o => o.value === 'istanbul_child_3_11');
        } else {
          recommendedOpt = opts.find(o => o.value === 'istanbul_adult_double_triple');
        }
      } else if (formData.tripId === 'trip-sharm-el-sheikh-2026') {
        if (computedAge < 2) {
          recommendedOpt = opts.find(o => o.value === 'sharm_child_under_2');
        } else if (computedAge >= 2 && computedAge <= 11) {
          recommendedOpt = opts.find(o => o.value === 'sharm_child_2_11');
        } else {
          recommendedOpt = opts.find(o => o.value === 'sharm_double_triple');
        }
      } else if (['trip-center-algeria', 'trip-jijel-beach', 'trip-family-tunisia', 'trip-soviva-tunisia'].includes(formData.tripId)) {
        if (computedAge < 2) {
          recommendedOpt = opts.find(o => o.value === 'child_under_2');
        } else if (computedAge >= 3 && computedAge <= 10) {
          recommendedOpt = opts.find(o => o.value === 'child_3_10');
        } else {
          if (formData.tripId === 'trip-center-algeria') {
            recommendedOpt = opts.find(o => o.value === 'mergad_quad_five');
          } else if (formData.tripId === 'trip-jijel-beach') {
            recommendedOpt = opts.find(o => o.value === 'jijel_apt_5');
          } else if (formData.tripId === 'trip-family-tunisia') {
            recommendedOpt = opts.find(o => o.value === 'five_six');
          } else if (formData.tripId === 'trip-soviva-tunisia') {
            recommendedOpt = opts.find(o => o.value === 'soviva_standard');
          }
        }
      }

      if (recommendedOpt) {
        setCompanionForm(prev => ({
          ...prev,
          roomType: recommendedOpt.label
        }));
      }
    }
  }, [companionForm.birthDate, formData.tripId]);

  // Total Estimated Calculation
  const estimatedTotalPrice = (() => {
    const leadPrice = formData.pricePerPerson || 0;
    if (bookingType === 'individual') {
      return leadPrice;
    }
    const compsPrice = companions.reduce((sum, cmp) => {
      return sum + getCompanionRoomPrice(cmp.roomType, cmp.role);
    }, 0);
    return leadPrice + compsPrice;
  })();

  // Resolve total amount being paid
  const finalTotalPriceToSubmit = customTotalPrice !== '' ? (parseFloat(customTotalPrice) || 0) : estimatedTotalPrice;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'الرجاء إدخال اسم المسؤول';
    if (!formData.lastName.trim()) newErrors.lastName = 'الرجاء إدخال اللقب الكلي';
    if (!formData.birthDate) newErrors.birthDate = 'الرجاء إدخال تاريخ ميلاد المسؤول';
    if (!formData.birthPlace.trim()) newErrors.birthPlace = 'الرجاء تحديد مكان الميلاد للمسؤول';
    if (!formData.phone.trim()) {
      newErrors.phone = 'الرجاء إدخال رقم هاتف التواصل';
    } else if (!/^(05|06|07|02|03|04)[0-9]{8}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'يرجى إدخال رقم هاتف جزائري صحيح (مثال: 0550123456)';
    }
    if (!formData.tripId) newErrors.tripId = 'الرجاء اختيار برنامج سفر معين';
    if (!formData.roomType) newErrors.roomType = 'الرجاء اختيار نوع الإقامة للمسؤول';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddCompanion = (e: React.MouseEvent) => {
    e.preventDefault();
    setCompanionError('');

    if (!companionForm.firstName.trim()) {
      setCompanionError('الرجاء إدخال الاسم الأول للمرافق');
      return;
    }
    if (!companionForm.lastName.trim()) {
      setCompanionError('الرجاء إدخال اللقب للمرافق');
      return;
    }
    if (!companionForm.birthDate) {
      setCompanionError('الرجاء إدخال تاريخ ميلاد المرافق');
      return;
    }
    if (!companionForm.birthPlace.trim()) {
      setCompanionError('الرجاء إدخال مكان ميلاد المرافق');
      return;
    }

    const calculatedCmpAge = calculateAge(companionForm.birthDate);
    const newCmp: Companion = {
      id: `comp-${Date.now()}`,
      firstName: companionForm.firstName.trim(),
      lastName: companionForm.lastName.trim(),
      birthDate: companionForm.birthDate,
      birthPlace: companionForm.birthPlace.trim(),
      age: calculatedCmpAge,
      role: companionForm.role,
      roomType: companionForm.roomType || (activeOptions[0]?.label || ''),
      relationship: companionForm.relationship,
      nationalId: companionForm.nationalId.trim(), // Save companion's nationalId
    };

    setCompanions(prev => [...prev, newCmp]);

    // Reset Companion form except common options
    setCompanionForm({
      firstName: '',
      lastName: formData.lastName || '', // inherit father's surname immediately
      birthDate: '',
      birthPlace: '',
      role: 'tourist',
      roomType: activeOptions[0]?.label || '',
      relationship: 'الزوجـة', // Default to first dropdown option 'الزوجـة'
      nationalId: '', // Reset companion's nationalId
    });
  };

  const handleRemoveCompanion = (idToRemove: string) => {
    setCompanions(prev => prev.filter(c => c.id !== idToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      const computedLeadAge = calculateAge(formData.birthDate);
      const isLeadFree = formData.role === 'organizer' || formData.role === 'driver';
      const actualLeadPrice = isLeadFree ? 0 : formData.pricePerPerson;

      const finalPaidAmount = formData.paymentStatus === 'partial' 
        ? (parseFloat(paidAmount) || 0) 
        : (formData.paymentStatus === 'paid' ? finalTotalPriceToSubmit : 0);

      const finalRemainingAmount = formData.paymentStatus === 'partial' 
        ? (parseFloat(remainingAmount) || 0) 
        : (formData.paymentStatus === 'unpaid' ? finalTotalPriceToSubmit : 0);

      // Complete customer object as dynamic family holding companions
      onAddCustomer({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        birthDate: formData.birthDate,
        birthPlace: formData.birthPlace.trim(),
        phone: formData.phone.trim(),
        tripId: formData.tripId,
        departureDate: formData.departureDate || activeSelectedTrip?.date,
        peopleCount: bookingType === 'individual' ? 1 : companions.length + 1, // Leader + companions
        notes: formData.notes.trim(),
        age: computedLeadAge,
        roomType: formData.roomType,
        pricePerPerson: actualLeadPrice,
        totalPrice: finalTotalPriceToSubmit, // Unified aggregate paid amount
        paidAmount: finalPaidAmount,
        remainingAmount: finalRemainingAmount,
        role: formData.role,
        companions: bookingType === 'individual' ? [] : companions,
        paymentStatus: formData.paymentStatus,
        bookingType: bookingType,
        nationalId: formData.nationalId.trim(), // Save customer's nationalId
      });

      // Clean Slate reset
      const currentTripId = formData.tripId || trips[0]?.id || '';
      const selected = trips.find(t => t.id === currentTripId);
      const opts = selected ? getRoomOptionsForTrip(selected.id, selected.price, selected) : [];
      
      setFormData({
        firstName: '',
        lastName: '',
        birthDate: '',
        birthPlace: '',
        phone: '',
        tripId: currentTripId,
        departureDate: selected ? selected.date : '',
        notes: '',
        roomType: opts[0]?.label || '',
        pricePerPerson: opts[0]?.price || 0,
        role: 'tourist',
        paymentStatus: 'paid',
        nationalId: '', // Reset customer's nationalId
      });
      setBookingType('individual');
      setCompanions([]);
      setCustomTotalPrice('');
      setPaidAmount('');
      setRemainingAmount('');
      setErrors({});
      setCompanionError('');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: value,
      };

      // Recalculate options if trip changes or birthDate changes for principal parent
      if (name === 'tripId' || name === 'birthDate') {
        const selectedTripId = name === 'tripId' ? value : prev.tripId;
        const currentBirthDate = name === 'birthDate' ? value : prev.birthDate;
        
        const selected = trips.find(t => t.id === selectedTripId);
        if (selected) {
          const opts = getRoomOptionsForTrip(selected.id, selected.price, selected);
          
          let recommendedOpt = null;
          if (currentBirthDate) {
            const computedAge = calculateAge(currentBirthDate);
            if (selectedTripId === 'trip-istanbul-8d') {
              if (computedAge < 2) {
                recommendedOpt = opts.find(o => o.value === 'istanbul_child_under_2');
              } else if (computedAge >= 3 && computedAge <= 11) {
                recommendedOpt = opts.find(o => o.value === 'istanbul_child_3_11');
              } else {
                recommendedOpt = opts.find(o => o.value === 'istanbul_adult_double_triple');
              }
            } else if (['trip-center-algeria', 'trip-jijel-beach', 'trip-family-tunisia', 'trip-soviva-tunisia'].includes(selectedTripId)) {
              if (computedAge < 2) {
                recommendedOpt = opts.find(o => o.value === 'child_under_2');
              } else if (computedAge >= 3 && computedAge <= 10) {
                recommendedOpt = opts.find(o => o.value === 'child_3_10');
              } else {
                if (selectedTripId === 'trip-center-algeria') {
                  recommendedOpt = opts.find(o => o.value === 'mergad_quad_five');
                } else if (selectedTripId === 'trip-jijel-beach') {
                  recommendedOpt = opts.find(o => o.value === 'jijel_apt_5');
                } else if (selectedTripId === 'trip-family-tunisia') {
                  recommendedOpt = opts.find(o => o.value === 'five_six');
                } else if (selectedTripId === 'trip-soviva-tunisia') {
                  recommendedOpt = opts.find(o => o.value === 'soviva_standard');
                }
              }
            }
          }

          if (recommendedOpt) {
            updated.roomType = recommendedOpt.label;
            updated.pricePerPerson = recommendedOpt.price;
          } else {
            const matches = matchRoomTypeOption(prev.roomType, opts);
            updated.roomType = matches ? matches.label : (opts[0]?.label || '');
            updated.pricePerPerson = matches ? matches.price : (opts[0]?.price || selected.price);
          }
        }
      }

      // Sync pricing when roomType changes manually
      if (name === 'roomType') {
        const tripObj = trips.find(t => t.id === prev.tripId) || trips[0];
        if (tripObj) {
          const opts = getRoomOptionsForTrip(tripObj.id, tripObj.price, tripObj);
          const matched = matchRoomTypeOption(value, opts);
          if (matched) {
            updated.roomType = matched.label;
            updated.pricePerPerson = matched.price;
          }
        }
      }

      // If the role changes or anything else changes, force 0 if role is organizer or driver
      if (updated.role === 'organizer' || updated.role === 'driver') {
        updated.pricePerPerson = 0;
      } else if (name === 'role' && value === 'tourist') {
        const tripObj = trips.find(t => t.id === updated.tripId) || trips[0];
        if (tripObj) {
          const opts = getRoomOptionsForTrip(tripObj.id, tripObj.price, tripObj);
          const matched = matchRoomTypeOption(updated.roomType, opts);
          updated.pricePerPerson = matched ? matched.price : tripObj.price;
        }
      }

      return updated;
    });

    if (errors[name]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const handleCompanionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCompanionForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const liveAge = formData.birthDate ? calculateAge(formData.birthDate) : null;
  const companionAgePreview = companionForm.birthDate ? calculateAge(companionForm.birthDate) : null;

  return (
    <div className="bg-white border border-stone-200/80 rounded-2xl p-6 shadow-xs text-stone-850 relative overflow-hidden" dir="rtl">
      
      {/* Decorative premium atmosphere background */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none -translate-x-12 -translate-y-12"></div>
      
      {/* Form Header */}
      <div className="relative z-10 flex items-center justify-between border-b border-stone-100 pb-5 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 text-amber-700 rounded-xl border border-amber-500/15 shadow-3xs">
            <UserPlus size={18} id="icon-user-plus" />
          </div>
          <div>
            <h2 className="font-sans font-extrabold text-zinc-900 text-sm md:text-base tracking-tight select-none leading-none">
              {bookingType === 'individual' ? 'تسجيل حجز فردي جديد' : 'تسجيل حجز عائلي جديد'}
            </h2>
            <p className="text-[10px] text-stone-500 font-sans mt-2 leading-none">
              {bookingType === 'individual' 
                ? 'أنشئ ملف مسافر فردي مستقل مع وصل طباعة قياسي' 
                : 'اربط العائلة بـ Family ID مشترك وتذكرة طباعة موحدة'}
            </p>
          </div>
        </div>
        
        {/* Subtle status indicator */}
        <div className="hidden sm:flex items-center gap-2 bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-200">
          <span className="w-1.5 h-1.5 rounded-full bg-[#D97706] animate-pulse"></span>
          <span className="text-[10px] font-bold text-stone-605 text-stone-600">المكتب متصل بالكامل</span>
        </div>
      </div>

      {/* Choice Selector Controls for Booking Type */}
      <div className="relative z-10 mb-6 bg-stone-50 p-1 rounded-xl flex gap-1 border border-stone-200/60">
        <button
          type="button"
          onClick={() => {
            setBookingType('individual');
            setCompanions([]);
          }}
          className={`flex-1 py-2.5 px-4 rounded-lg font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
            bookingType === 'individual'
              ? 'bg-zinc-950 text-white shadow-sm shadow-zinc-950/10'
              : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100'
          }`}
        >
          <span className="text-sm">👤</span>
          حجز فردي استثنائي
        </button>
        <button
          type="button"
          onClick={() => setBookingType('family')}
          className={`flex-1 py-2.5 px-4 rounded-lg font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
            bookingType === 'family'
              ? 'bg-zinc-950 text-white shadow-sm shadow-zinc-950/10'
              : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100'
          }`}
        >
          <span className="text-sm">👨‍👩‍👧‍👦</span>
          حجز عائلي مشترك
        </button>
      </div>

      <form onSubmit={handleSubmit} className="relative z-10 space-y-6 font-sans text-right text-xs">
        
        {/* SECTION A: MAIN PASSSENGER OR HEAD OF FAMILY BOOKING (THE FATHER/LEADER) */}
        <div className="bg-[#FAF8F5]/80 rounded-xl p-5 border border-stone-200/80 space-y-4 shadow-3xs transition-colors">
          <h3 className="font-sans font-extrabold text-stone-800 pb-2.5 mb-1 text-xs flex items-center gap-2 border-b border-stone-200/60">
            <Users size={14} className="text-amber-700 shrink-0" />
            <span>
              {bookingType === 'individual' ? '1. البيانات الشخصية للزبون الأساسي' : '1. بيانات المسؤول الأساسي عن الحجز'}
            </span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-[11px] font-bold text-stone-600 mb-1.5">
                الاسم الأول <span className="text-amber-600">*</span>
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="مثال: يونس"
                className={`w-full px-3.5 py-2.5 rounded-xl border font-bold text-stone-800 bg-white placeholder-stone-400 focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/80 transition-all text-xs ${
                  errors.firstName ? 'border-rose-400 bg-rose-50/20' : 'border-stone-200'
                }`}
              />
              {errors.firstName && <p className="text-[10px] text-rose-600 font-bold mt-1.5">⚠️ {errors.firstName}</p>}
            </div>

            <div>
              <label htmlFor="lastName" className="block text-[11px] font-bold text-stone-600 mb-1.5">
                اللقب العائلي الكلي <span className="text-amber-600">*</span>
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="مثال: عبعوب"
                className={`w-full px-3.5 py-2.5 rounded-xl border font-bold text-stone-800 bg-white placeholder-stone-400 focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/80 transition-all text-xs ${
                  errors.lastName ? 'border-rose-400 bg-rose-50/20' : 'border-stone-200'
                }`}
              />
              {errors.lastName && <p className="text-[10px] text-rose-600 font-bold mt-1.5">⚠️ {errors.lastName}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="birthDate" className="block text-[11px] font-bold text-stone-600 mb-1.5 flex items-center gap-1.5">
                <Calendar size={13} className="text-stone-400" />
                <span>تاريخ ميلاد المسؤول</span> <span className="text-amber-600">*</span>
              </label>
              <input
                type="date"
                id="birthDate"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleChange}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-right font-bold text-stone-800 bg-white focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/80 transition-all text-xs ${
                  errors.birthDate ? 'border-rose-400 bg-rose-50/20' : 'border-stone-200'
                }`}
              />
              {liveAge !== null && (
                <div className="mt-1.5 text-[10px] font-bold text-amber-800 bg-amber-500/5 border border-amber-500/10 px-2 py-0.5 rounded-md inline-block">
                  📅 السن المحتسب: {liveAge} سنة
                </div>
              )}
              {errors.birthDate && <p className="text-[10px] text-rose-600 font-bold mt-1.5">⚠️ {errors.birthDate}</p>}
            </div>

            <div>
              <label htmlFor="birthPlace" className="block text-[11px] font-bold text-stone-600 mb-1.5 flex items-center gap-1.5">
                <MapPin size={13} className="text-stone-400" />
                <span>مكان الولادة (المكتوب)</span> <span className="text-amber-600">*</span>
              </label>
              <input
                type="text"
                id="birthPlace"
                name="birthPlace"
                value={formData.birthPlace}
                onChange={handleChange}
                placeholder="مثال: تقرت"
                className={`w-full px-3.5 py-2.5 rounded-xl border font-bold text-stone-800 bg-white placeholder-stone-400 focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/80 transition-all text-xs ${
                  errors.birthPlace ? 'border-rose-400 bg-rose-50/20' : 'border-stone-200'
                }`}
              />
              {errors.birthPlace && <p className="text-[10px] text-rose-600 font-bold mt-1.5">⚠️ {errors.birthPlace}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="phone" className="block text-[11px] font-bold text-stone-600 mb-1.5 flex items-center gap-1.5">
                <Phone size={13} className="text-stone-400" />
                <span>رقم هاتف التواصل</span> <span className="text-amber-600">*</span>
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="مثال: 0550123456"
                className={`w-full px-3.5 py-2.5 rounded-xl border font-mono font-bold text-stone-800 bg-white text-left placeholder-stone-400 focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/80 transition-all text-xs ${
                  errors.phone ? 'border-rose-400 bg-rose-50/20' : 'border-stone-200'
                }`}
              />
              {errors.phone && <p className="text-[10px] text-rose-600 font-bold mt-1.5">⚠️ {errors.phone}</p>}
            </div>

            <div>
              <label htmlFor="nationalId" className="block text-[11px] font-bold text-stone-600 mb-1.5 flex items-center gap-1.5">
                <span>رقم التعريف الوطني (NIN)</span>
              </label>
              <input
                type="text"
                id="nationalId"
                name="nationalId"
                value={formData.nationalId}
                onChange={handleChange}
                placeholder="مثال: 102345678901234567"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 font-mono font-bold text-stone-800 bg-white placeholder-stone-400 focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/80 transition-all text-xs text-left"
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-[11px] font-bold text-stone-600 mb-1.5">تأطير تذكرة السفر</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white font-bold text-stone-800 focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/80 transition-all text-[11px] cursor-pointer"
              >
                <option value="tourist">👤 ركوب سياحي (Tourist)</option>
                <option value="organizer">👔 مؤطر دائم (Organizer - مجاناً)</option>
                <option value="driver">🚌 سائق مساعد (Driver - مجاناً)</option>
              </select>
            </div>
          </div>

          {/* Accommodation Selection For Lead */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            <div>
              <label htmlFor="tripId" className="block text-[11px] font-bold text-stone-600 mb-1.5 flex items-center gap-1.5">
                <PlaneTakeoff size={13} className="text-stone-400" />
                <span>برنامج الرحلة السياحية</span> <span className="text-amber-600">*</span>
              </label>
              <select
                id="tripId"
                name="tripId"
                value={formData.tripId}
                onChange={handleChange}
                className={`w-full px-3.5 py-2.5 rounded-xl border font-bold text-stone-800 bg-white focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/80 transition-all text-[11px] cursor-pointer ${
                  errors.tripId ? 'border-rose-400 bg-rose-50/15' : 'border-stone-200'
                }`}
              >
                {trips.map((trip) => (
                  <option key={trip.id} value={trip.id}>
                    ✈️ {trip.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="departureDate" className="block text-[11px] font-bold text-stone-600 mb-1.5 flex items-center gap-1.5">
                <Calendar size={13} className="text-stone-400" />
                <span>تاريخ الانطلاق المحدد</span> <span className="text-amber-600">*</span>
              </label>
              <select
                id="departureDate"
                name="departureDate"
                value={formData.departureDate || (activeSelectedTrip ? activeSelectedTrip.date : '')}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white font-bold text-stone-800 focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/80 transition-all text-[11px] cursor-pointer font-sans"
              >
                {activeSelectedTrip && Array.from(new Set([activeSelectedTrip.date, ...(activeSelectedTrip.dates || [])])).filter(Boolean).map((d, i) => (
                  <option key={i} value={d}>
                    📅 {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="roomType" className="block text-[11px] font-bold text-stone-600 mb-1.5 flex items-center gap-1.5">
                <Building2 size={13} className="text-stone-400" />
                <span>نوع وعرض إقامة المسؤول</span> <span className="text-amber-600">*</span>
              </label>
              <select
                id="roomType"
                name="roomType"
                value={formData.roomType}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white font-bold text-stone-800 focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/80 transition-all text-[11px] cursor-pointer font-sans"
              >
                {activeOptions.map((opt, i) => (
                  <option key={i} value={opt.label}>
                    {opt.label} ({(opt.price).toLocaleString('ar-DZ')} د.ج)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Display active selected custom trip notes right during form entry */}
          {activeSelectedTrip && activeSelectedTrip.departurePlaceNotes && (
            <div className="mt-3 bg-zinc-50 border border-zinc-200/60 p-3 rounded-xl flex items-start gap-2 text-[10px] text-zinc-600 leading-relaxed font-sans text-right">
              <span className="text-amber-600 font-extrabold text-[11px] mt-0.5 shrink-0">💡 خط السير ونقاط الانطلاق:</span>
              <p className="whitespace-pre-line flex-1">{activeSelectedTrip.departurePlaceNotes}</p>
            </div>
          )}
        </div>

        {/* SECTION B: FAMILY MEMBERS / COMPANIONS ADDER */}
        {bookingType === 'family' && (
          <div className="bg-amber-500/[0.015] border border-stone-200/80 rounded-xl p-5 space-y-4">
            <h3 className="font-sans font-extrabold text-stone-800 pb-2.5 mb-1 text-xs flex items-center gap-2 border-b border-stone-200/60">
              <ListPlus size={14} className="text-amber-700 shrink-0" />
              <span>2. تهيئة وتفصيل أفراد المجموعة والعائلة المرافقة</span>
            </h3>

            {/* Companions Sub-Form */}
            <div className="grid grid-cols-2 gap-3 bg-[#FAF8F5]/80 p-4 rounded-xl border border-stone-200/50 shadow-3xs space-y-2">
              
              <div className="col-span-2 text-stone-500 font-medium text-[10px] flex items-start gap-1.5 leading-relaxed">
                <Info size={13} className="text-amber-700 shrink-0 mt-0.5" />
                <span>قم بإدراج تفاصيل العائلة فرداً فرداً ثم بادر بضغط الزر "إضافة هذا المسافر للمجموعة ➕" لتضمينه رسمياً في السجل.</span>
              </div>

              <div className="col-span-1">
                <label htmlFor="compRelationship" className="block text-[10px] font-bold text-stone-600 mb-1">صلة القرابة</label>
                <select
                  id="compRelationship"
                  name="relationship"
                  value={companionForm.relationship}
                  onChange={handleCompanionChange}
                  className="w-full px-2.5 py-2 rounded-lg border border-stone-200 bg-white font-bold text-stone-800 text-xs focus:outline-none focus:ring-4 focus:ring-amber-500/10 cursor-pointer"
                >
                  <option value="الزوجـة">💍 الزوجـة</option>
                  <option value="الزوج">🤵 الزوج</option>
                  <option value="ابـن">👦 ابـن</option>
                  <option value="ابنـة">👧 ابنـة</option>
                  <option value="والـد">👴 والـد</option>
                  <option value="والـدة">👵 والـدة</option>
                  <option value="أخ">👦 أخ</option>
                  <option value="أخت">👧 أخت</option>
                  <option value="مرافـق آخر">👤 مرافـق آخر</option>
                </select>
              </div>

              <div className="col-span-1">
                <label htmlFor="compRole" className="block text-[10px] font-bold text-stone-600 mb-1">الصفة والتفويض</label>
                <select
                  id="compRole"
                  name="role"
                  value={companionForm.role}
                  onChange={handleCompanionChange}
                  className="w-full px-2.5 py-2 rounded-lg border border-stone-200 bg-white font-bold text-stone-800 text-xs focus:outline-none focus:ring-4 focus:ring-amber-500/10 cursor-pointer"
                >
                  <option value="tourist">👤 ركوب سياحي</option>
                  <option value="organizer">👔 مؤطر (مجاناً)</option>
                  <option value="driver">🚌 سائق (مجاناً)</option>
                </select>
              </div>

              <div className="col-span-1">
                <label htmlFor="compFirstName" className="block text-[10px] font-bold text-stone-600 mb-1">الاسم الأول <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  id="compFirstName"
                  name="firstName"
                  value={companionForm.firstName}
                  onChange={handleCompanionChange}
                  placeholder="مثال: ريان"
                  className="w-full px-2.5 py-2 rounded-lg border border-stone-200 bg-white font-bold text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-4 focus:ring-amber-500/10 text-xs"
                />
              </div>

              <div className="col-span-1">
                <label htmlFor="compLastName" className="block text-[10px] font-bold text-stone-600 mb-1">اللقب الكلي <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  id="compLastName"
                  name="lastName"
                  value={companionForm.lastName}
                  onChange={handleCompanionChange}
                  placeholder="مثال: عبعوب"
                  className="w-full px-2.5 py-2 rounded-lg border border-stone-200 bg-white font-bold text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-4 focus:ring-amber-500/10 text-xs"
                />
              </div>

              <div className="col-span-1">
                <label htmlFor="compBirthDate" className="block text-[10px] font-bold text-stone-600 mb-1">تاريخ الميلاد <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  id="compBirthDate"
                  name="birthDate"
                  value={companionForm.birthDate}
                  onChange={handleCompanionChange}
                  className="w-full px-2.5 py-2 rounded-lg border border-stone-200 bg-white font-bold text-stone-800 text-right focus:outline-none focus:ring-4 focus:ring-amber-500/10 text-[11px]"
                />
                {companionAgePreview !== null && (
                  <span className="text-[9px] font-bold text-amber-800 mt-1 block bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60 w-fit">
                    السن: {companionAgePreview} سنة
                  </span>
                )}
              </div>

              <div className="col-span-1">
                <label htmlFor="compBirthPlace" className="block text-[10px] font-bold text-stone-600 mb-1">مكان الميلاد <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  id="compBirthPlace"
                  name="birthPlace"
                  value={companionForm.birthPlace}
                  onChange={handleCompanionChange}
                  placeholder="مكان الولادة"
                  className="w-full px-2.5 py-2 rounded-lg border border-stone-200 bg-white font-bold text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-4 focus:ring-amber-500/10 text-xs"
                />
              </div>

              <div className="col-span-1">
                <label htmlFor="compRoomType" className="block text-[10px] font-bold text-stone-600 mb-1">إقامة وسكن الفرد المخصص</label>
                <select
                  id="compRoomType"
                  name="roomType"
                  value={companionForm.roomType}
                  onChange={handleCompanionChange}
                  className="w-full px-2.5 py-2 rounded-lg border border-stone-200 bg-white font-bold text-stone-800 text-[11px] focus:outline-none focus:ring-4 focus:ring-amber-500/10 cursor-pointer font-sans"
                >
                  {activeOptions.map((opt, i) => (
                    <option key={i} value={opt.label}>
                      {opt.label} ({(opt.price).toLocaleString('ar-DZ')} د.ج)
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-1">
                <label htmlFor="compNationalId" className="block text-[10px] font-bold text-stone-600 mb-1">رقم التعريف الوطني للمرافق</label>
                <input
                  type="text"
                  id="compNationalId"
                  name="nationalId"
                  value={companionForm.nationalId}
                  onChange={handleCompanionChange}
                  placeholder="مثال: 102345678901234567"
                  className="w-full px-2.5 py-2 rounded-lg border border-stone-200 bg-white font-mono font-bold text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-4 focus:ring-amber-500/10 text-xs text-left"
                />
              </div>

              {companionError && (
                <div className="col-span-2 text-[10px] text-rose-600 bg-rose-50 border border-rose-200/50 p-2.5 rounded-lg flex items-center gap-1.5 font-bold">
                  <ShieldAlert size={12} className="shrink-0 text-rose-600" />
                  <span>{companionError}</span>
                </div>
              )}

              <div className="col-span-2 pt-2">
                <button
                  type="button"
                  onClick={handleAddCompanion}
                  id="btn-add-companion-inside"
                  className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-950 text-white font-extrabold rounded-lg flex items-center justify-center gap-1.5 text-[11px] cursor-pointer shadow-sm active:scale-[0.98] transition-all"
                >
                  <Plus size={14} />
                  إرسال وإضافة هذا الفرد للقائمة العائلية
                </button>
              </div>

            </div>

            {/* Rendered Companions List */}
            {companions.length > 0 && (
              <div className="overflow-hidden border border-stone-200 rounded-lg bg-white shadow-3xs">
                <table className="w-full text-right text-[10px] border-collapse">
                  <thead>
                    <tr className="bg-stone-50 text-stone-500 border-b border-stone-200 font-bold">
                      <th className="py-2.5 px-3">القرابة</th>
                      <th className="py-2.5 px-3">الاسم واللقب الكامل</th>
                      <th className="py-2.5 px-3">السن والميلاد</th>
                      <th className="py-2.5 px-3">نوع السكن/السعر</th>
                      <th className="py-2.5 px-3 text-center">الإجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-bold text-stone-700">
                    {companions.map((cmp) => {
                      const roomPrice = getCompanionRoomPrice(cmp.roomType, cmp.role);
                      return (
                        <tr key={cmp.id} className="hover:bg-stone-50/50 transition-colors">
                          <td className="py-2.5 px-3 font-extrabold text-amber-600">
                            {cmp.relationship === 'wife' || cmp.relationship?.toLowerCase() === 'wife' ? 'الزوجة' : cmp.relationship}
                          </td>
                          <td className="py-2.5 px-3 text-zinc-900">{cmp.firstName} {cmp.lastName}</td>
                          <td className="py-2.5 px-3 font-mono text-stone-500">{cmp.age} سنة ({cmp.birthPlace})</td>
                          <td className="py-2.5 px-3 text-stone-600">
                            <span className="block truncate max-w-[125px] font-sans">{cmp.roomType}</span>
                            <span className="font-extrabold text-emerald-600 font-mono text-[9px]">{roomPrice.toLocaleString('ar-DZ')} دج</span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveCompanion(cmp.id)}
                              id={`btn-remove-companion-${cmp.id}`}
                              className="text-stone-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 cursor-pointer transition-colors"
                              title="إزالة الفرد"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        )}

        {/* SECTION C: BILLING STATUS & SUBMIT */}
        <div className="bg-[#FAF8F5]/80 rounded-xl p-5 border border-stone-200/80 space-y-4 shadow-3xs transition-colors">
          <h3 className="font-sans font-extrabold text-stone-800 pb-2.5 mb-1 text-xs flex items-center gap-2 border-b border-stone-200/60">
            <DollarSign size={14} className="text-amber-700 shrink-0" />
            <span>
              {bookingType === 'individual' ? '2. المدفوعات وتأكيد حجز الفرد النهائي' : '3. المبالغ الإجمالية وحالة الدفع العائلية'}
            </span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="customTotalPrice" className="block text-[11px] font-bold text-stone-600 mb-1.5">
                {bookingType === 'individual' ? 'المبلغ المدفوع (د.ج)' : 'المبلغ المالي المفوتر الإجمالي المدفوع (د.ج)'} <span className="text-amber-600">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="customTotalPrice"
                  name="customTotalPrice"
                  value={customTotalPrice}
                  onChange={(e) => setCustomTotalPrice(e.target.value)}
                  placeholder={`التقدير التلقائي: ${estimatedTotalPrice.toLocaleString('ar-DZ')} دج`}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white font-mono font-bold text-amber-800 focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/80 text-xs pl-12 text-right"
                />
                <span className="absolute left-3.5 top-3.5 text-[9px] text-stone-400 font-bold font-mono tracking-widest">DZD</span>
              </div>
              <p className="text-[10px] text-stone-500 mt-1.5 leading-relaxed font-sans">
                في حال ترك الحقل فارغاً، سيعتمد النظام السعر القياسي المبرمج تلقائياً: <strong className="text-stone-700">{estimatedTotalPrice.toLocaleString('ar-DZ')} دج</strong>
              </p>
            </div>

            <div>
              <label htmlFor="paymentStatus" className="block text-[11px] font-bold text-stone-600 mb-1.5">الحالة الفعلية للدفع والتسوية</label>
              <select
                id="paymentStatus"
                name="paymentStatus"
                value={formData.paymentStatus}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white font-bold text-stone-800 focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/80 text-xs cursor-pointer"
              >
                <option value="paid">🟢 دفعة تامة ومكتملة (Paid)</option>
                <option value="partial">🟡 عربون / دفعة مسبقة جزئية (Partial)</option>
                <option value="unpaid">🔴 تأكيد بدون دفع (Unpaid)</option>
              </select>
            </div>

            {formData.paymentStatus === 'partial' && (
              <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 pt-3.5 border-t border-amber-500/10">
                <div>
                  <label htmlFor="paidAmount" className="block text-[11px] font-bold text-stone-600 mb-1.5">
                    المبلغ المدفوع (العربون) (د.ج) <span className="text-amber-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="paidAmount"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value)}
                      placeholder="أدخل المبلغ الذي تم دفعه..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white font-mono font-bold text-amber-800 focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/80 text-xs pl-12 text-right"
                    />
                    <span className="absolute left-3.5 top-3.5 text-[9px] text-stone-400 font-bold font-mono tracking-widest">DZD</span>
                  </div>
                </div>

                <div>
                  <label htmlFor="remainingAmount" className="block text-[11px] font-bold text-stone-600 mb-1.5">
                    المبلغ المتبقي (د.ج) <span className="text-amber-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="remainingAmount"
                      value={remainingAmount}
                      onChange={(e) => setRemainingAmount(e.target.value)}
                      placeholder={
                        paidAmount !== ''
                          ? `المقترح: ${(finalTotalPriceToSubmit - (parseFloat(paidAmount) || 0)).toLocaleString('ar-DZ')} دج`
                          : 'أدخل المبلغ المتبقي...'
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white font-mono font-bold text-rose-800 focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/80 text-xs pl-12 text-right"
                    />
                    <span className="absolute left-3.5 top-3.5 text-[9px] text-stone-400 font-bold font-mono tracking-widest">DZD</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-stone-200/60 flex justify-between items-center text-xs">
            <span className="font-bold text-stone-500">إجمالي ركاب التذكرة:</span>
            <span className="font-extrabold text-[#1C1917] bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full font-mono text-[11px]">
              {bookingType === 'individual' ? 1 : companions.length + 1} مسافرين في السجل
            </span>
          </div>

          {/* Optional Notes */}
          <div>
            <label htmlFor="notes" className="block text-[11px] font-bold text-stone-600 mb-1.5 flex items-center gap-1.5">
              <Info size={13} className="text-stone-400" />
              <span>تعليمات وتفضيلات إضافية مرافقة للزبائن</span>
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={2}
              placeholder={bookingType === 'individual' ? "مثال: يفضل المقاعد الأمامية بالحافلة السياحية..." : "مثال: السكن بجوار الغرف الأخرى للمجموعة، تفضيلات الغذاء..."}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white text-stone-800 text-xs focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/80 transition-all resize-none placeholder-stone-400"
            />
          </div>
        </div>

        {/* Form Actions */}
        <button
          type="submit"
          id="btn-submit-family-booking"
          className="w-full mt-2 flex items-center justify-center gap-2.5 py-4 bg-zinc-950 hover:bg-zinc-900 border border-amber-500/10 text-amber-400 font-extrabold text-center rounded-xl shadow-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-all cursor-pointer text-xs transform hover:-translate-y-0.5 active:translate-y-0 shadow-zinc-950/10"
        >
          <Sparkles size={16} />
          <span>{bookingType === 'individual' ? 'تأكيد الحجز الفردي وطباعة الوصل ✈️' : 'تأكيد الحجز العائلي وطباعة الوصل ✈️'}</span>
        </button>
      </form>
    </div>
  );
};
