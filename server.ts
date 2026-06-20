/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';

const DB_FILE_PATH = path.join(process.cwd(), 'database-fallback.json');

const initialLocalDb = {
  branches: [
    { id: 'branch-main', name: 'المركز الرئيسي للإدارة', location: 'المركز الرئيسي' }
  ],
  employees: [
    {
      id: 'emp-admin',
      username: 'admin',
      name: 'عبد الفتاح عبعوب',
      role: 'Admin',
      branchId: 'branch-main',
      branchName: 'المركز الرئيسي للإدارة',
      disabled: false
    }
  ],
  customers: [] as any[],
  trips: [
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
  ],
  logs: [] as any[]
};

function readLocalDb() {
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.trips)) {
        const missingDefaults = initialLocalDb.trips.filter(
          (dt: any) => !parsed.trips.some((pt: any) => pt.id === dt.id)
        );
        if (missingDefaults.length > 0) {
          parsed.trips = [...parsed.trips, ...missingDefaults];
          writeLocalDb(parsed);
        }
      }
      return parsed;
    } else {
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(initialLocalDb, null, 2), 'utf-8');
    }
  } catch (err) {
    console.warn('Fallback JSON db read error:', err);
  }
  return initialLocalDb;
}

function writeLocalDb(data: any) {
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Fallback JSON db write error:', err);
  }
}

// Ensure database file is initialized at startup
readLocalDb();

// --- DATA SCHEMAS ---

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
}

const app = express();
const PORT = 3000;

// --- EXPRESS MIDDLEWARE ---

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

interface AuthenticatedRequest extends express.Request {
  user?: Employee;
}

// Pure Local Auth Middleware (No Firebase needed)
const requireAuth = async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
  req.user = {
    id: 'emp-admin',
    username: 'admin',
    name: 'عبد الفتاح عبعوب',
    role: 'Admin',
    branchId: 'branch-main',
    branchName: 'المركز الرئيسي للإدارة',
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
      id: 'emp-admin',
      username: 'admin',
      name: 'عبد الفتاح عبعوب',
      role: 'Admin',
      branchId: 'branch-main',
      branchName: 'المركز الرئيسي للإدارة'
    }
  });
});

app.get('/api/auth/me', async (req, res) => {
  res.json({
    success: true,
    employee: {
      id: 'emp-admin',
      username: 'admin',
      name: 'عبد الفتاح عبعوب',
      role: 'Admin',
      branchId: 'branch-main',
      branchName: 'المركز الرئيسي للإدارة'
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

// --- CORE TRAVEL BUSINESS APIS (PURE LOCAL STORAGE) ---

app.get('/api/data', requireAuth, async (req: AuthenticatedRequest, res) => {
  const db = readLocalDb();
  res.json({
    success: true,
    data: db
  });
});

// Write Action - New Booking Customer
app.post('/api/customers', requireAuth, async (req: AuthenticatedRequest, res) => {
  const db = readLocalDb();
  const nextSeq = String(db.customers.length + 1).padStart(4, '0');
  const invoiceNum = `AB-2026-${nextSeq}`;
  const generatedId = `customer-${Date.now()}`;

  const completeCustomer = {
    ...req.body,
    id: generatedId,
    registrationDate: new Date().toISOString(),
    invoiceNumber: invoiceNum,
    employeeId: req.user?.id || 'emp-admin',
    employeeName: req.user?.name || 'عبد الفتاح عبعوب',
    branchId: req.user?.branchId || 'branch-main',
    branchName: req.user?.branchName || 'المركز الرئيسي للإدارة',
  };

  db.customers.push(completeCustomer);

  let tripName = 'غير معروفة';
  const trip = db.trips.find((t: any) => t.id === completeCustomer.tripId);
  if (trip) tripName = trip.name;

  db.logs.unshift({
    id: `log-${Date.now()}`,
    employeeId: req.user?.id || 'emp-admin',
    employeeName: req.user?.name || 'عبد الفتاح عبعوب',
    branchName: req.user?.branchName || 'المركز الرئيسي للإدارة',
    actionType: 'add_customer',
    details: `تم تسجيل حجز جديد بنجاح للزبون: ${completeCustomer.firstName} ${completeCustomer.lastName} (رقم الحجز: ${invoiceNum}) لرحلة "${tripName}"`,
    timestamp: new Date().toISOString()
  });

  writeLocalDb(db);
  res.json({ success: true, customers: db.customers, logs: db.logs });
});

app.put('/api/customers/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  const db = readLocalDb();
  const idx = db.customers.findIndex((c: any) => c.id === req.params.id);
  if (idx !== -1) {
    db.customers[idx] = { ...db.customers[idx], ...req.body };
  }

  db.logs.unshift({
    id: `log-${Date.now()}`,
    employeeId: req.user?.id || 'emp-admin',
    employeeName: req.user?.name || 'عبد الفتاح عبعوب',
    branchName: req.user?.branchName || 'المركز الرئيسي للإدارة',
    actionType: 'update_customer',
    details: `تحديث بيانات حجز الزبون: ${req.body.firstName} ${req.body.lastName} (رقم الحجز: ${req.body.invoiceNumber})`,
    timestamp: new Date().toISOString()
  });

  writeLocalDb(db);
  res.json({ success: true, customers: db.customers, logs: db.logs });
});

app.delete('/api/customers/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  const db = readLocalDb();
  const customer = db.customers.find((c: any) => c.id === req.params.id);
  if (!customer) {
    return res.status(404).json({ success: false, error: 'الزبون غير مسجل بالنظام' });
  }

  db.customers = db.customers.filter((c: any) => c.id !== req.params.id);

  db.logs.unshift({
    id: `log-${Date.now()}`,
    employeeId: req.user?.id || 'emp-admin',
    employeeName: req.user?.name || 'عبد الفتاح عبعوب',
    branchName: req.user?.branchName || 'المركز الرئيسي للإدارة',
    actionType: 'delete_customer',
    details: `تم إلغاء وحذف حجز الزبون بالكامل: ${customer.firstName} ${customer.lastName} (رقم الحجز: ${customer.invoiceNumber})`,
    timestamp: new Date().toISOString()
  });

  writeLocalDb(db);
  res.json({ success: true, customers: db.customers, logs: db.logs });
});

// Trip Itineraries Core APIs
app.post('/api/trips', requireAuth, async (req: AuthenticatedRequest, res) => {
  const db = readLocalDb();
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
  db.trips.push(createdTrip);

  db.logs.unshift({
    id: `log-${Date.now()}`,
    employeeId: req.user?.id || 'emp-admin',
    employeeName: req.user?.name || 'عبد الفتاح عبعوب',
    branchName: req.user?.branchName || 'المركز الرئيسي للإدارة',
    actionType: 'add_trip',
    details: `إنشاء برنامج رحلة سياحية جديدة: "${createdTrip.name}" الموجهة إلى ${createdTrip.destination}`,
    timestamp: new Date().toISOString()
  });

  writeLocalDb(db);
  res.json({ success: true, trips: db.trips, logs: db.logs });
});

app.put('/api/trips/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  const db = readLocalDb();
  const idx = db.trips.findIndex((t: any) => t.id === req.params.id);
  if (idx !== -1) {
    db.trips[idx] = { ...db.trips[idx], ...req.body };
  }

  db.logs.unshift({
    id: `log-${Date.now()}`,
    employeeId: req.user?.id || 'emp-admin',
    employeeName: req.user?.name || 'عبد الفتاح عبعوب',
    branchName: req.user?.branchName || 'المركز الرئيسي للإدارة',
    actionType: 'update_trip',
    details: `تعديل روزنامة وبيانات رحلة: "${req.body.name}"`,
    timestamp: new Date().toISOString()
  });

  writeLocalDb(db);
  res.json({ success: true, trips: db.trips, logs: db.logs });
});

app.delete('/api/trips/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  const db = readLocalDb();
  
  const travellers = db.customers.filter((c: any) => c.tripId === req.params.id);
  if (travellers.length > 0) {
    return res.status(400).json({ success: false, error: `عذراً! لا يمكن حذف هذه الرحلة لوجود ${travellers.length} زبون تم حجزهم عليها` });
  }

  const targetTrip = db.trips.find((t: any) => t.id === req.params.id);
  if (!targetTrip) {
    return res.status(404).json({ success: false, error: 'البرنامج السياحي غير متوفر' });
  }

  db.trips = db.trips.filter((t: any) => t.id !== req.params.id);

  db.logs.unshift({
    id: `log-${Date.now()}`,
    employeeId: req.user?.id || 'emp-admin',
    employeeName: req.user?.name || 'عبد الفتاح عبعوب',
    branchName: req.user?.branchName || 'المركز الرئيسي للإدارة',
    actionType: 'delete_trip',
    details: `إزالة وإلغاء برنامج الرحلة السياحية: "${targetTrip.name}"`,
    timestamp: new Date().toISOString()
  });

  writeLocalDb(db);
  res.json({ success: true, trips: db.trips, logs: db.logs });
});

// --- PERSONNEL MANAGEMENT APIS ---

app.post('/api/employees', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { name, username, password, role, branchId } = req.body;
  const db = readLocalDb();
  
  const cleanUsername = username.trim().toLowerCase();
  const duplicate = db.employees.some((e: any) => e.username === cleanUsername);
  if (duplicate) {
    return res.status(400).json({ success: false, error: 'خطأ: اسم المستخدم هذا محجوز مسبقاً لموظف آخر!' });
  }

  const branch = db.branches.find((b: any) => b.id === branchId) || db.branches[0];

  const newEmp = {
    id: `emp-${Date.now()}`,
    name: name.trim(),
    username: cleanUsername,
    role,
    branchId: branch.id,
    branchName: branch.name,
    disabled: false
  };
  db.employees.push(newEmp);

  db.logs.unshift({
    id: `log-${Date.now()}`,
    employeeId: req.user?.id || 'emp-admin',
    employeeName: req.user?.name || 'عبد الفتاح عبعوب',
    branchName: req.user?.branchName || 'المركز الرئيسي للإدارة',
    actionType: 'add_customer',
    details: `تم إنشاء حساب موظف مؤمن وجديد: ${newEmp.name} (المعرف: ${newEmp.username}) بصفة [${newEmp.role}] في [${newEmp.branchName}]`,
    timestamp: new Date().toISOString()
  });

  writeLocalDb(db);
  res.json({ success: true, employees: db.employees, logs: db.logs });
});

app.put('/api/employees/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { name, username, password, role, branchId, disabled } = req.body;
  const db = readLocalDb();
  const employee = db.employees.find((e: any) => e.id === req.params.id);
  if (!employee) {
    return res.status(404).json({ success: false, error: 'الموظف غير موجود بالنظام' });
  }

  if (employee.username === 'admin' || id === 'emp-1' || id === 'emp-admin') {
    if (disabled === true || (role && role !== 'Admin')) {
      return res.status(400).json({ success: false, error: 'غير مسموح بتعطيل حساب المدير العام الرئيسي للوكالة أو تعديل دوره!' });
    }
  }

  const updates: any = {};
  if (username) {
    if (db.employees.some((e: any) => e.username === username.trim().toLowerCase() && e.id !== id)) {
      return res.status(400).json({ success: false, error: 'اسم المستخدم محجوز مسبقاً لموظف آخر' });
    }
    updates.username = username.trim().toLowerCase();
  }
  if (name) updates.name = name.trim();
  if (role) updates.role = role;
  if (branchId) {
    const branch = db.branches.find((b: any) => b.id === branchId);
    if (branch) {
      updates.branchId = branch.id;
      updates.branchName = branch.name;
    }
  }
  if (disabled !== undefined) {
    updates.disabled = !!disabled;
  }

  const idx = db.employees.findIndex((e: any) => e.id === id);
  if (idx !== -1) {
    db.employees[idx] = { ...db.employees[idx], ...updates };
  }

  db.logs.unshift({
    id: `log-${Date.now()}`,
    employeeId: req.user?.id || 'emp-admin',
    employeeName: req.user?.name || 'عبد الفتاح عبعوب',
    branchName: req.user?.branchName || 'المركز الرئيسي للإدارة',
    actionType: 'update_customer',
    details: `تعديل ملف الموظف: ${db.employees[idx]?.name || name} - حالة النشاط: ${disabled ? 'معطل' : 'نشط'}`,
    timestamp: new Date().toISOString()
  });

  writeLocalDb(db);
  res.json({ success: true, employees: db.employees, logs: db.logs });
});

app.delete('/api/employees/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const db = readLocalDb();
  
  if (id === 'emp-admin' || id === 'emp-1') {
    return res.status(400).json({ success: false, error: 'غير مسموح إطلاقاً بحذف حساب المدير العام الرئيسي للوكالة!' });
  }

  const employee = db.employees.find((e: any) => e.id === id);
  if (!employee) {
    return res.status(404).json({ success: false, error: 'الموظف المطلوب غير متوفر بالوكالة' });
  }

  db.employees = db.employees.filter((e: any) => e.id !== id);

  db.logs.unshift({
    id: `log-${Date.now()}`,
    employeeId: req.user?.id || 'emp-admin',
    employeeName: req.user?.name || 'عبد الفتاح عبعوب',
    branchName: req.user?.branchName || 'المركز الرئيسي للإدارة',
    actionType: 'delete_customer',
    details: `تم إلغاء حساب الموظف بالوفاق وفصل ملف دخوله بالكامل: ${employee.name} (${employee.role})`,
    timestamp: new Date().toISOString()
  });

  writeLocalDb(db);
  res.json({ success: true, employees: db.employees, logs: db.logs });
});

// --- BRANCH OFFICE APIS ---

app.post('/api/branches', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { name, location } = req.body;
  const db = readLocalDb();
  
  if (db.branches.some((b: any) => b.name === name.trim())) {
    return res.status(400).json({ success: false, error: 'هذا الفرع مسجل بالفعل في نظام الوكالة!' });
  }

  const generatedId = `branch-${Date.now()}`;
  const newBr = {
    id: generatedId,
    name: name.trim(),
    location: location.trim()
  };
  db.branches.push(newBr);

  db.logs.unshift({
    id: `log-${Date.now()}`,
    employeeId: req.user?.id || 'emp-admin',
    employeeName: req.user?.name || 'عبد الفتاح عبعوب',
    branchName: req.user?.branchName || 'المركز الرئيسي للإدارة',
    actionType: 'add_trip',
    details: `تم تأسيس وتوصيل مكتب فرعي رسمي ومستقل للوكالة: ${newBr.name} في ${newBr.location}`,
    timestamp: new Date().toISOString()
  });

  writeLocalDb(db);
  res.json({ success: true, branches: db.branches, logs: db.logs });
});

// --- LOGGING ACTION AUDIT TRAIL API ---

app.post('/api/logs/clear', requireAuth, async (req: AuthenticatedRequest, res) => {
  const db = readLocalDb();
  db.logs = [];
  writeLocalDb(db);
  res.json({ success: true, logs: [] });
});

// --- BACKUP RESTORING / IMPORTING DATA ---

app.post('/api/backup/import', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { customers, trips } = req.body;
  if (!Array.isArray(customers) || !Array.isArray(trips)) {
    return res.status(400).json({ success: false, error: 'تنسيق السجلات الاحتياطية غير متكامل أو خاطئ' });
  }

  const db = readLocalDb();
  db.customers = customers;
  db.trips = trips;
  db.logs.unshift({
    id: `log-${Date.now()}`,
    employeeId: req.user?.id || 'emp-admin',
    employeeName: req.user?.name || 'عبد الفتاح عبعوب',
    branchName: req.user?.branchName || 'المركز الرئيسي للإدارة',
    actionType: 'add_trip',
    details: 'تم استيراد نسخة احتياطية من السجلات بنجاح في قاعدة البيانات المحلية.',
    timestamp: new Date().toISOString()
  });
  writeLocalDb(db);
  res.json({
    success: true,
    customers: db.customers,
    trips: db.trips,
    logs: db.logs
  });
});

// --- VITE ROUTING AND DEV PIPELINES ---

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
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
