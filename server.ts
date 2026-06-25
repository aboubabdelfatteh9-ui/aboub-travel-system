/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  doc,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  writeBatch
} from 'firebase/firestore';

// Load Firebase Config
const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

// Initialize Firebase Client SDK
const clientApp = initializeApp({
  apiKey: firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  appId: firebaseConfig.appId,
});

const rawDb = getFirestore(clientApp, firebaseConfig.firestoreDatabaseId);

// Admin-like wrapper for client Firestore SDK to maintain compatibility
const db = {
  collection(collectionName: string) {
    return {
      async get() {
        const snap = await getDocs(collection(rawDb, collectionName));
        return {
          empty: snap.empty,
          size: snap.size,
          docs: snap.docs.map(doc => ({
            id: doc.id,
            ref: doc.ref,
            data: () => doc.data(),
            exists: doc.exists()
          }))
        };
      },
      doc(docId: string) {
        const docRef = doc(rawDb, collectionName, docId);
        return {
          ref: docRef,
          async get() {
            const snap = await getDoc(docRef);
            return {
              id: snap.id,
              ref: snap.ref,
              exists: snap.exists(),
              data: () => snap.data()
            };
          },
          async set(data: any) {
            return await setDoc(docRef, data);
          },
          async delete() {
            return await deleteDoc(docRef);
          }
        };
      },
      where(fieldPath: string, opStr: any, value: any) {
        let q = query(collection(rawDb, collectionName), where(fieldPath, opStr, value));
        return {
          where(f: string, op: any, val: any) {
            q = query(q, where(f, op, val));
            return this;
          },
          async get() {
            const snap = await getDocs(q);
            return {
              empty: snap.empty,
              size: snap.size,
              docs: snap.docs.map(doc => ({
                id: doc.id,
                ref: doc.ref,
                data: () => doc.data(),
                exists: doc.exists()
              }))
            };
          }
        };
      },
      orderBy(field: string, direction: 'asc' | 'desc' = 'asc') {
        let q = query(collection(rawDb, collectionName), orderBy(field, direction));
        return {
          limit(n: number) {
            q = query(q, limit(n));
            return this;
          },
          async get() {
            const snap = await getDocs(q);
            return {
              empty: snap.empty,
              size: snap.size,
              docs: snap.docs.map(doc => ({
                id: doc.id,
                ref: doc.ref,
                data: () => doc.data(),
                exists: doc.exists()
              }))
            };
          }
        };
      },
      limit(n: number) {
        let q = query(collection(rawDb, collectionName), limit(n));
        return {
          async get() {
            const snap = await getDocs(q);
            return {
              empty: snap.empty,
              size: snap.size,
              docs: snap.docs.map(doc => ({
                id: doc.id,
                ref: doc.ref,
                data: () => doc.data(),
                exists: doc.exists()
              }))
            };
          }
        };
      }
    };
  },
  batch() {
    const b = writeBatch(rawDb);
    return {
      set(docObj: any, data: any) {
        const ref = docObj.ref || docObj;
        b.set(ref, data);
        return this;
      },
      delete(docObj: any) {
        const ref = docObj.ref || docObj;
        b.delete(ref);
        return this;
      },
      async commit() {
        return await b.commit();
      }
    };
  }
};

const DEFAULT_BRANCHES = [
  { id: 'branch-touggourt', name: 'فرع تقرت الرئيسي', location: 'حي عياد تبسبست، تقرت' },
  { id: 'branch-algiers', name: 'فرع الجزائر العاصمة', location: 'شارع ديدوش مراد، الجزائر العاصمة' },
  { id: 'branch-ouargla', name: 'فرع ورقلة', location: 'وسط المدينة، ورقلة' }
];

const DEFAULT_EMPLOYEES = [
  { id: 'emp-1', username: 'admin', name: 'عبد الفتاح عبعوب', role: 'Admin', branchId: 'branch-touggourt', branchName: 'فرع تقرت الرئيسي', disabled: false },
  { id: 'emp-2', username: 'manager_algiers', name: 'أحمد بن علي', role: 'Manager', branchId: 'branch-algiers', branchName: 'فرع الجزائر العاصمة', disabled: false },
  { id: 'emp-3', username: 'agent_touggourt', name: 'بلال تبسبستي', role: 'Agent', branchId: 'branch-touggourt', branchName: 'فرع تقرت الرئيسي', disabled: false },
  { id: 'emp-4', username: 'agent_ouargla', name: 'ليلى هلالي', role: 'Agent', branchId: 'branch-ouargla', branchName: 'فرع ورقلة', disabled: false }
];

const DEFAULT_TRIPS = [
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

// Seed Firestore database on startup if collections are empty
async function seedDatabaseIfEmpty() {
  try {
    const branchesRef = db.collection('branches');
    const branchesSnap = await branchesRef.limit(1).get();
    if (branchesSnap.empty) {
      console.log('Seeding default branches...');
      for (const b of DEFAULT_BRANCHES) {
        await branchesRef.doc(b.id).set(b);
      }
    }

    const employeesRef = db.collection('employees');
    const employeesSnap = await employeesRef.limit(1).get();
    if (employeesSnap.empty) {
      console.log('Seeding default employees...');
      for (const e of DEFAULT_EMPLOYEES) {
        await employeesRef.doc(e.id).set(e);
      }
    }

    const tripsRef = db.collection('trips');
    const tripsSnap = await tripsRef.limit(1).get();
    if (tripsSnap.empty) {
      console.log('Seeding default trips...');
      for (const t of DEFAULT_TRIPS) {
        await tripsRef.doc(t.id).set(t);
      }
    }
    console.log('Database verification and seeding complete.');
  } catch (error) {
    console.error('Error seeding Firestore database:', error);
  }
}

// Invoke seed logic
seedDatabaseIfEmpty();

interface Companion {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  birthPlace: string;
  age: number;
  role: 'tourist' | 'organizer' | 'driver';
  roomType: string;
  relationship: string;
}

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  birthPlace: string;
  phone: string;
  tripId: string;
  peopleCount: number;
  registrationDate: string;
  invoiceNumber: string;
  notes?: string;
  age?: number;
  roomType?: string;
  pricePerPerson?: number;
  totalPrice?: number;
  role?: 'tourist' | 'organizer' | 'driver';
  companions: Companion[];
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  bookingType?: 'individual' | 'family';
  employeeId?: string;
  employeeName?: string;
  branchId?: string;
  branchName?: string;
}

interface Employee {
  id: string;
  username: string;
  name: string;
  role: 'Admin' | 'Manager' | 'Agent';
  branchId: string;
  branchName: string;
  disabled?: boolean;
}

interface Branch {
  id: string;
  name: string;
  location: string;
}

interface Trip {
  id: string;
  name: string;
  destination: string;
  price: number;
  duration: string;
  date: string;
  status: 'active' | 'completed' | 'upcoming';
  dates?: string[];
  departurePlaceNotes?: string;
  isProfessional?: boolean;
  priceSingle?: number;
  priceDouble?: number;
  priceTriple?: number;
  priceQuadruple?: number;
  priceQuintuple?: number;
  priceSextuple?: number;
  priceChild?: number;
}

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

interface AuthenticatedRequest extends express.Request {
  user?: Employee;
}

// Authentication middleware using hardcoded employee profile
const requireAuth = async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
  req.user = {
    id: 'emp-1',
    username: 'admin',
    name: 'عبد الفتاح عبعوب',
    role: 'Admin',
    branchId: 'branch-touggourt',
    branchName: 'فرع تقرت الرئيسي',
    disabled: false
  };
  next();
};

// --- AUTHENTICATION APIS ---

app.post('/api/auth/login', async (req, res) => {
  return res.json({
    success: true,
    message: 'تم تسجيل الدخول بنجاح',
    employee: {
      id: 'emp-1',
      username: 'admin',
      name: 'عبد الفتاح عبعوب',
      role: 'Admin',
      branchId: 'branch-touggourt',
      branchName: 'فرع تقرت الرئيسي'
    }
  });
});

app.get('/api/auth/me', async (req, res) => {
  res.json({
    success: true,
    employee: {
      id: 'emp-1',
      username: 'admin',
      name: 'عبد الفتاح عبعوب',
      role: 'Admin',
      branchId: 'branch-touggourt',
      branchName: 'فرع تقرت الرئيسي'
    }
  });
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('session_token', {
    secure: true,
    sameSite: 'none'
  });
  res.json({ success: true, message: 'تم تسجيل الخروج وتدمير الجلسة بنجاح' });
});

// --- DATA ACCESS API ---

app.get('/api/data', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const [branchesSnap, employeesSnap, customersSnap, tripsSnap, logsSnap] = await Promise.all([
      db.collection('branches').get(),
      db.collection('employees').get(),
      db.collection('customers').get(),
      db.collection('trips').get(),
      db.collection('logs').orderBy('timestamp', 'desc').limit(150).get()
    ]);

    const branchesList = branchesSnap.docs.map(doc => doc.data());
    const employeesList = employeesSnap.docs.map(doc => doc.data());
    const customersList = customersSnap.docs.map(doc => doc.data());
    const tripsList = tripsSnap.docs.map(doc => doc.data());
    const logsList = logsSnap.docs.map(doc => doc.data());

    res.json({
      success: true,
      data: {
        branches: branchesList,
        employees: employeesList,
        customers: customersList,
        trips: tripsList,
        logs: logsList
      }
    });
  } catch (error) {
    console.error('Error in /api/data:', error);
    res.status(500).json({ success: false, error: 'فشل في جلب البيانات من قاعدة البيانات المشتركة' });
  }
});

// --- CUSTOMERS / BOOKING APIS ---

app.post('/api/customers', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const customersSnap = await db.collection('customers').get();
    const count = customersSnap.size;
    const nextSeq = String(count + 1).padStart(4, '0');
    const invoiceNum = `AB-2026-${nextSeq}`;
    const generatedId = `customer-${Date.now()}`;

    const completeCustomer = {
      ...req.body,
      id: generatedId,
      registrationDate: new Date().toISOString(),
      invoiceNumber: invoiceNum,
      employeeId: req.user?.id || 'emp-1',
      employeeName: req.user?.name || 'عبد الفتاح عبعوب',
      branchId: req.user?.branchId || 'branch-touggourt',
      branchName: req.user?.branchName || 'فرع تقرت الرئيسي',
    };

    await db.collection('customers').doc(generatedId).set(completeCustomer);

    let tripName = 'غير معروفة';
    const tripDoc = await db.collection('trips').doc(completeCustomer.tripId).get();
    if (tripDoc.exists) {
      tripName = tripDoc.data()?.name || 'غير معروفة';
    }

    const logId = `log-${Date.now()}`;
    const logData = {
      id: logId,
      employeeId: req.user?.id || 'emp-1',
      employeeName: req.user?.name || 'عبد الفتاح عبعوب',
      branchName: req.user?.branchName || 'فرع تقرت الرئيسي',
      actionType: 'add_customer',
      details: `تم تسجيل حجز جديد بنجاح للزبون: ${completeCustomer.firstName} ${completeCustomer.lastName} (رقم الحجز: ${invoiceNum}) لرحلة "${tripName}"`,
      timestamp: new Date().toISOString()
    };

    await db.collection('logs').doc(logId).set(logData);

    const [allCustomersSnap, allLogsSnap] = await Promise.all([
      db.collection('customers').get(),
      db.collection('logs').orderBy('timestamp', 'desc').limit(150).get()
    ]);

    res.json({
      success: true,
      customers: allCustomersSnap.docs.map(doc => doc.data()),
      logs: allLogsSnap.docs.map(doc => doc.data())
    });
  } catch (error) {
    console.error('Error in POST /api/customers:', error);
    res.status(500).json({ success: false, error: 'فشل في إضافة بيانات الحجز' });
  }
});

app.put('/api/customers/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const customerRef = db.collection('customers').doc(id);
    const docSnap = await customerRef.get();
    if (!docSnap.exists) {
      return res.status(404).json({ success: false, error: 'الزبون غير مسجل بالنظام' });
    }

    const currentData = docSnap.data()!;
    const updatedCustomer = { ...currentData, ...req.body };
    await customerRef.set(updatedCustomer);

    const logId = `log-${Date.now()}`;
    const logData = {
      id: logId,
      employeeId: req.user?.id || 'emp-1',
      employeeName: req.user?.name || 'عبد الفتاح عبعوب',
      branchName: req.user?.branchName || 'فرع تقرت الرئيسي',
      actionType: 'update_customer',
      details: `تحديث بيانات حجز الزبون: ${req.body.firstName} ${req.body.lastName} (رقم الحجز: ${req.body.invoiceNumber})`,
      timestamp: new Date().toISOString()
    };

    await db.collection('logs').doc(logId).set(logData);

    const [allCustomersSnap, allLogsSnap] = await Promise.all([
      db.collection('customers').get(),
      db.collection('logs').orderBy('timestamp', 'desc').limit(150).get()
    ]);

    res.json({
      success: true,
      customers: allCustomersSnap.docs.map(doc => doc.data()),
      logs: allLogsSnap.docs.map(doc => doc.data())
    });
  } catch (error) {
    console.error('Error in PUT /api/customers/:id:', error);
    res.status(500).json({ success: false, error: 'فشل في تحديث بيانات الحجز' });
  }
});

app.delete('/api/customers/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const customerRef = db.collection('customers').doc(id);
    const docSnap = await customerRef.get();
    if (!docSnap.exists) {
      return res.status(404).json({ success: false, error: 'الزبون غير مسجل بالنظام' });
    }

    const customer = docSnap.data()!;
    await customerRef.delete();

    const logId = `log-${Date.now()}`;
    const logData = {
      id: logId,
      employeeId: req.user?.id || 'emp-1',
      employeeName: req.user?.name || 'عبد الفتاح عبعوب',
      branchName: req.user?.branchName || 'فرع تقرت الرئيسي',
      actionType: 'delete_customer',
      details: `تم إلغاء وحذف حجز الزبون بالكامل: ${customer.firstName} ${customer.lastName} (رقم الحجز: ${customer.invoiceNumber})`,
      timestamp: new Date().toISOString()
    };

    await db.collection('logs').doc(logId).set(logData);

    const [allCustomersSnap, allLogsSnap] = await Promise.all([
      db.collection('customers').get(),
      db.collection('logs').orderBy('timestamp', 'desc').limit(150).get()
    ]);

    res.json({
      success: true,
      customers: allCustomersSnap.docs.map(doc => doc.data()),
      logs: allLogsSnap.docs.map(doc => doc.data())
    });
  } catch (error) {
    console.error('Error in DELETE /api/customers/:id:', error);
    res.status(500).json({ success: false, error: 'فشل في حذف الحجز' });
  }
});

// --- TRIPS / PROGRAMS APIS ---

app.post('/api/trips', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const generatedId = `trip-${Date.now()}`;
    const createdTrip = {
      id: generatedId,
      name: req.body.name,
      destination: req.body.destination,
      price: Number(req.body.price),
      duration: req.body.duration,
      date: req.body.date,
      dates: req.body.dates || [],
      status: 'active' as const,
      departurePlaceNotes: req.body.departurePlaceNotes || '',
      isProfessional: !!req.body.isProfessional,
      priceSingle: req.body.priceSingle ? Number(req.body.priceSingle) : undefined,
      priceDouble: req.body.priceDouble ? Number(req.body.priceDouble) : undefined,
      priceTriple: req.body.priceTriple ? Number(req.body.priceTriple) : undefined,
      priceQuadruple: req.body.priceQuadruple ? Number(req.body.priceQuadruple) : undefined,
      priceQuintuple: req.body.priceQuintuple ? Number(req.body.priceQuintuple) : undefined,
      priceSextuple: req.body.priceSextuple ? Number(req.body.priceSextuple) : undefined,
      priceChild: req.body.priceChild ? Number(req.body.priceChild) : undefined,
    };

    await db.collection('trips').doc(generatedId).set(createdTrip);

    const logId = `log-${Date.now()}`;
    const logData = {
      id: logId,
      employeeId: req.user?.id || 'emp-1',
      employeeName: req.user?.name || 'عبد الفتاح عبعوب',
      branchName: req.user?.branchName || 'فرع تقرت الرئيسي',
      actionType: 'add_trip',
      details: `إنشاء برنامج رحلة سياحية جديدة: "${createdTrip.name}" الموجهة إلى ${createdTrip.destination}`,
      timestamp: new Date().toISOString()
    };

    await db.collection('logs').doc(logId).set(logData);

    const [allTripsSnap, allLogsSnap] = await Promise.all([
      db.collection('trips').get(),
      db.collection('logs').orderBy('timestamp', 'desc').limit(150).get()
    ]);

    res.json({
      success: true,
      trips: allTripsSnap.docs.map(doc => doc.data()),
      logs: allLogsSnap.docs.map(doc => doc.data())
    });
  } catch (error) {
    console.error('Error in POST /api/trips:', error);
    res.status(500).json({ success: false, error: 'فشل في إنشاء برنامج الرحلة' });
  }
});

app.put('/api/trips/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const tripRef = db.collection('trips').doc(id);
    const docSnap = await tripRef.get();
    if (!docSnap.exists) {
      return res.status(404).json({ success: false, error: 'البرنامج السياحي غير متوفر' });
    }

    const currentTrip = docSnap.data()!;
    const updatedTrip = { ...currentTrip, ...req.body };
    await tripRef.set(updatedTrip);

    const logId = `log-${Date.now()}`;
    const logData = {
      id: logId,
      employeeId: req.user?.id || 'emp-1',
      employeeName: req.user?.name || 'عبد الفتاح عبعوب',
      branchName: req.user?.branchName || 'فرع تقرت الرئيسي',
      actionType: 'update_trip',
      details: `تعديل روزنامة وبيانات رحلة: "${req.body.name}"`,
      timestamp: new Date().toISOString()
    };

    await db.collection('logs').doc(logId).set(logData);

    const [allTripsSnap, allLogsSnap] = await Promise.all([
      db.collection('trips').get(),
      db.collection('logs').orderBy('timestamp', 'desc').limit(150).get()
    ]);

    res.json({
      success: true,
      trips: allTripsSnap.docs.map(doc => doc.data()),
      logs: allLogsSnap.docs.map(doc => doc.data())
    });
  } catch (error) {
    console.error('Error in PUT /api/trips/:id:', error);
    res.status(500).json({ success: false, error: 'فشل في تحديث بيانات الرحلة' });
  }
});

app.delete('/api/trips/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    // Check if there are customers booked on this trip
    const customersSnap = await db.collection('customers').where('tripId', '==', id).get();
    if (!customersSnap.empty) {
      return res.status(400).json({ success: false, error: `عذراً! لا يمكن حذف هذه الرحلة لوجود ${customersSnap.size} زبون تم حجزهم عليها` });
    }

    const tripRef = db.collection('trips').doc(id);
    const docSnap = await tripRef.get();
    if (!docSnap.exists) {
      return res.status(404).json({ success: false, error: 'البرنامج السياحي غير متوفر' });
    }

    const targetTrip = docSnap.data()!;
    await tripRef.delete();

    const logId = `log-${Date.now()}`;
    const logData = {
      id: logId,
      employeeId: req.user?.id || 'emp-1',
      employeeName: req.user?.name || 'عبد الفتاح عبعوب',
      branchName: req.user?.branchName || 'فرع تقرت الرئيسي',
      actionType: 'delete_trip',
      details: `إزالة وإلغاء برنامج الرحلة السياحية: "${targetTrip.name}"`,
      timestamp: new Date().toISOString()
    };

    await db.collection('logs').doc(logId).set(logData);

    const [allTripsSnap, allLogsSnap] = await Promise.all([
      db.collection('trips').get(),
      db.collection('logs').orderBy('timestamp', 'desc').limit(150).get()
    ]);

    res.json({
      success: true,
      trips: allTripsSnap.docs.map(doc => doc.data()),
      logs: allLogsSnap.docs.map(doc => doc.data())
    });
  } catch (error) {
    console.error('Error in DELETE /api/trips/:id:', error);
    res.status(500).json({ success: false, error: 'فشل في حذف برنامج الرحلة' });
  }
});

// --- STAFF / EMPLOYEES APIS ---

app.post('/api/employees', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { name, username, password, role, branchId } = req.body;
    const cleanUsername = username.trim().toLowerCase();

    const dupSnap = await db.collection('employees').where('username', '==', cleanUsername).get();
    if (!dupSnap.empty) {
      return res.status(400).json({ success: false, error: 'خطأ: اسم المستخدم هذا محجوز مسبقاً لموظف آخر!' });
    }

    const branchDoc = await db.collection('branches').doc(branchId).get();
    const branch = branchDoc.exists ? branchDoc.data()! : DEFAULT_BRANCHES[0];

    const generatedId = `emp-${Date.now()}`;
    const newEmp = {
      id: generatedId,
      name: name.trim(),
      username: cleanUsername,
      role,
      branchId: branch.id,
      branchName: branch.name,
      disabled: false
    };

    await db.collection('employees').doc(generatedId).set(newEmp);

    const logId = `log-${Date.now()}`;
    const logData = {
      id: logId,
      employeeId: req.user?.id || 'emp-1',
      employeeName: req.user?.name || 'عبد الفتاح عبعوب',
      branchName: req.user?.branchName || 'فرع تقرت الرئيسي',
      actionType: 'add_customer',
      details: `تم إنشاء حساب موظف مؤمن وجديد: ${newEmp.name} (المعرف: ${newEmp.username}) بصفة [${newEmp.role}] في [${newEmp.branchName}]`,
      timestamp: new Date().toISOString()
    };

    await db.collection('logs').doc(logId).set(logData);

    const [allEmployeesSnap, allLogsSnap] = await Promise.all([
      db.collection('employees').get(),
      db.collection('logs').orderBy('timestamp', 'desc').limit(150).get()
    ]);

    res.json({
      success: true,
      employees: allEmployeesSnap.docs.map(doc => doc.data()),
      logs: allLogsSnap.docs.map(doc => doc.data())
    });
  } catch (error) {
    console.error('Error in POST /api/employees:', error);
    res.status(500).json({ success: false, error: 'فشل في تسجيل الموظف' });
  }
});

app.put('/api/employees/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { name, username, password, role, branchId, disabled } = req.body;

    const employeeRef = db.collection('employees').doc(id);
    const docSnap = await employeeRef.get();
    if (!docSnap.exists) {
      return res.status(404).json({ success: false, error: 'الموظف غير موجود بالنظام' });
    }

    const employee = docSnap.data()!;

    if (employee.username === 'admin' || id === 'emp-1' || id === 'emp-admin') {
      if (disabled === true || (role && role !== 'Admin')) {
        return res.status(400).json({ success: false, error: 'غير مسموح بتعطيل حساب المدير العام الرئيسي للوكالة أو تعديل دوره!' });
      }
    }

    const updates: any = {};
    if (username) {
      const cleanUsername = username.trim().toLowerCase();
      const dupSnap = await db.collection('employees').where('username', '==', cleanUsername).get();
      const duplicateOther = dupSnap.docs.some(doc => doc.id !== id);
      if (duplicateOther) {
        return res.status(400).json({ success: false, error: 'اسم المستخدم محجوز مسبقاً لموظف آخر' });
      }
      updates.username = cleanUsername;
    }
    if (name) updates.name = name.trim();
    if (role) updates.role = role;
    if (branchId) {
      const branchDoc = await db.collection('branches').doc(branchId).get();
      if (branchDoc.exists) {
        const branch = branchDoc.data()!;
        updates.branchId = branch.id;
        updates.branchName = branch.name;
      }
    }
    if (disabled !== undefined) {
      updates.disabled = !!disabled;
    }

    const updatedEmployee = { ...employee, ...updates };
    await employeeRef.set(updatedEmployee);

    const logId = `log-${Date.now()}`;
    const logData = {
      id: logId,
      employeeId: req.user?.id || 'emp-1',
      employeeName: req.user?.name || 'عبد الفتاح عبعوب',
      branchName: req.user?.branchName || 'فرع تقرت الرئيسي',
      actionType: 'update_customer',
      details: `تعديل ملف الموظف: ${updatedEmployee.name} - حالة النشاط: ${disabled ? 'معطل' : 'نشط'}`,
      timestamp: new Date().toISOString()
    };

    await db.collection('logs').doc(logId).set(logData);

    const [allEmployeesSnap, allLogsSnap] = await Promise.all([
      db.collection('employees').get(),
      db.collection('logs').orderBy('timestamp', 'desc').limit(150).get()
    ]);

    res.json({
      success: true,
      employees: allEmployeesSnap.docs.map(doc => doc.data()),
      logs: allLogsSnap.docs.map(doc => doc.data())
    });
  } catch (error) {
    console.error('Error in PUT /api/employees/:id:', error);
    res.status(500).json({ success: false, error: 'فشل في تعديل بيانات الموظف' });
  }
});

app.delete('/api/employees/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    if (id === 'emp-admin' || id === 'emp-1') {
      return res.status(400).json({ success: false, error: 'غير مسموح إطلاقاً بحذف حساب المدير العام الرئيسي للوكالة!' });
    }

    const employeeRef = db.collection('employees').doc(id);
    const docSnap = await employeeRef.get();
    if (!docSnap.exists) {
      return res.status(404).json({ success: false, error: 'الموظف المطلوب غير متوفر بالوكالة' });
    }

    const employee = docSnap.data()!;
    await employeeRef.delete();

    const logId = `log-${Date.now()}`;
    const logData = {
      id: logId,
      employeeId: req.user?.id || 'emp-1',
      employeeName: req.user?.name || 'عبد الفتاح عبعوب',
      branchName: req.user?.branchName || 'فرع تقرت الرئيسي',
      actionType: 'delete_customer',
      details: `تم إلغاء حساب الموظف بالوفاق وفصل ملف دخوله بالكامل: ${employee.name} (${employee.role})`,
      timestamp: new Date().toISOString()
    };

    await db.collection('logs').doc(logId).set(logData);

    const [allEmployeesSnap, allLogsSnap] = await Promise.all([
      db.collection('employees').get(),
      db.collection('logs').orderBy('timestamp', 'desc').limit(150).get()
    ]);

    res.json({
      success: true,
      employees: allEmployeesSnap.docs.map(doc => doc.data()),
      logs: allLogsSnap.docs.map(doc => doc.data())
    });
  } catch (error) {
    console.error('Error in DELETE /api/employees/:id:', error);
    res.status(500).json({ success: false, error: 'فشل في حذف حساب الموظف' });
  }
});

// --- BRANCH OFFICE APIS ---

app.post('/api/branches', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { name, location } = req.body;

    const dupSnap = await db.collection('branches').where('name', '==', name.trim()).get();
    if (!dupSnap.empty) {
      return res.status(400).json({ success: false, error: 'هذا الفرع مسجل بالفعل في نظام الوكالة!' });
    }

    const generatedId = `branch-${Date.now()}`;
    const newBr = {
      id: generatedId,
      name: name.trim(),
      location: location.trim()
    };

    await db.collection('branches').doc(generatedId).set(newBr);

    const logId = `log-${Date.now()}`;
    const logData = {
      id: logId,
      employeeId: req.user?.id || 'emp-1',
      employeeName: req.user?.name || 'عبد الفتاح عبعوب',
      branchName: req.user?.branchName || 'فرع تقرت الرئيسي',
      actionType: 'add_trip',
      details: `تم تأسيس وتوصيل مكتب فرعي رسمي ومستقل للوكالة: ${newBr.name} في ${newBr.location}`,
      timestamp: new Date().toISOString()
    };

    await db.collection('logs').doc(logId).set(logData);

    const [allBranchesSnap, allLogsSnap] = await Promise.all([
      db.collection('branches').get(),
      db.collection('logs').orderBy('timestamp', 'desc').limit(150).get()
    ]);

    res.json({
      success: true,
      branches: allBranchesSnap.docs.map(doc => doc.data()),
      logs: allLogsSnap.docs.map(doc => doc.data())
    });
  } catch (error) {
    console.error('Error in POST /api/branches:', error);
    res.status(500).json({ success: false, error: 'فشل في تسجيل الفرع الجديد' });
  }
});

// --- LOGGING ACTION AUDIT TRAIL API ---

app.post('/api/logs/clear', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const logsSnap = await db.collection('logs').get();
    const batch = db.batch();
    logsSnap.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    res.json({ success: true, logs: [] });
  } catch (error) {
    console.error('Error in POST /api/logs/clear:', error);
    res.status(500).json({ success: false, error: 'فشل في حذف سجل العمليات' });
  }
});

// --- BACKUP RESTORING / IMPORTING DATA ---

app.post('/api/backup/import', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { customers, trips } = req.body;
    if (!Array.isArray(customers) || !Array.isArray(trips)) {
      return res.status(400).json({ success: false, error: 'تنسيق السجلات الاحتياطية غير متكامل أو خاطئ' });
    }

    const [existingCustomers, existingTrips] = await Promise.all([
      db.collection('customers').get(),
      db.collection('trips').get()
    ]);

    const batch = db.batch();
    existingCustomers.docs.forEach(doc => batch.delete(doc.ref));
    existingTrips.docs.forEach(doc => batch.delete(doc.ref));

    customers.forEach(c => {
      const id = c.id || `customer-${Date.now()}-${Math.random()}`;
      batch.set(db.collection('customers').doc(id), c);
    });

    trips.forEach(t => {
      const id = t.id || `trip-${Date.now()}-${Math.random()}`;
      batch.set(db.collection('trips').doc(id), t);
    });

    const logId = `log-${Date.now()}`;
    batch.set(db.collection('logs').doc(logId), {
      id: logId,
      employeeId: req.user?.id || 'emp-1',
      employeeName: req.user?.name || 'عبد الفتاح عبعوب',
      branchName: req.user?.branchName || 'فرع تقرت الرئيسي',
      actionType: 'add_trip',
      details: 'تم استيراد نسخة احتياطية من السجلات بنجاح في قاعدة البيانات المشتركة.',
      timestamp: new Date().toISOString()
    });

    await batch.commit();

    const [allCustomersSnap, allTripsSnap, allLogsSnap] = await Promise.all([
      db.collection('customers').get(),
      db.collection('trips').get(),
      db.collection('logs').orderBy('timestamp', 'desc').limit(150).get()
    ]);

    res.json({
      success: true,
      customers: allCustomersSnap.docs.map(doc => doc.data()),
      trips: allTripsSnap.docs.map(doc => doc.data()),
      logs: allLogsSnap.docs.map(doc => doc.data())
    });
  } catch (error) {
    console.error('Error in POST /api/backup/import:', error);
    res.status(500).json({ success: false, error: 'فشل في استيراد البيانات والنسخة الاحتياطية' });
  }
});

// --- VITE ROUTING AND DEV PIPELINES ---

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : undefined
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Corporate Control System Active: Server running on port ${PORT}`);
  });
}

startServer();
