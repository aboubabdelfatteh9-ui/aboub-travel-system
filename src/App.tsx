/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Customer, Trip, Employee, Branch, OperationLog } from './types';
import { defaultTrips } from './data/trips';
import { Logo } from './components/Logo';
import { CustomerForm, getRoomOptionsForTrip, getTripPriceLabelsAndDefaults } from './components/CustomerForm';
import { CustomerTable } from './components/CustomerTable';
import { PrintDocument } from './components/PrintDocument';
import { TripManifests } from './components/TripManifests';
import { Login } from './components/Login';
import { 
  db, 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  query, 
  orderBy 
} from './lib/firebase';
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
  X,
  LogOut,
  Building2,
  ShieldCheck,
  ArrowLeftRight,
  HelpCircle,
  BookOpen,
  UserSquare2,
  DollarSign,
  UserPlus2,
  ShieldAlert,
  RefreshCw
} from 'lucide-react';

const DEFAULT_BRANCHES: Branch[] = [
  { id: 'branch-touggourt', name: 'فرع تقرت الرئيسي', location: 'حي عياد تبسبست، تقرت' },
  { id: 'branch-algiers', name: 'فرع الجزائر العاصمة', location: 'شارع ديدوش مراد، الجزائر العاصمة' },
  { id: 'branch-ouargla', name: 'فرع ورقلة', location: 'وسط المدينة، ورقلة' }
];

const DEFAULT_EMPLOYEES: Employee[] = [
  { id: 'emp-1', username: 'admin', name: 'عبد الفتاح عبعوب', role: 'Admin', branchId: 'branch-touggourt', branchName: 'فرع تقرت الرئيسي' },
  { id: 'emp-2', username: 'manager_algiers', name: 'أحمد بن علي', role: 'Manager', branchId: 'branch-algiers', branchName: 'فرع الجزائر العاصمة' },
  { id: 'emp-3', username: 'agent_touggourt', name: 'بلال تبسبستي', role: 'Agent', branchId: 'branch-touggourt', branchName: 'فرع تقرت الرئيسي' },
  { id: 'emp-4', username: 'agent_ouargla', name: 'ليلى هلالي', role: 'Agent', branchId: 'branch-ouargla', branchName: 'فرع ورقلة' }
];

export default function App() {
  // 1. STATE INITIALIZATION
  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const cached = localStorage.getItem('aboub_customers');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [trips, setTrips] = useState<Trip[]>(() => {
    try {
      const cached = localStorage.getItem('aboub_trips');
      if (cached) {
        const parsed: Trip[] = JSON.parse(cached);
        // Find default trips not currently in local cache (like Sharm El Sheikh added recently)
        const missingDefaults = defaultTrips.filter(
          dt => !parsed.some(pt => pt.id === dt.id)
        );
        if (missingDefaults.length > 0) {
          const merged = [...parsed, ...missingDefaults];
          localStorage.setItem('aboub_trips', JSON.stringify(merged));
          return merged;
        }
        return parsed;
      }
      return defaultTrips;
    } catch {
      return defaultTrips;
    }
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'manifests' | 'trips' | 'options' | 'admin'>('dashboard');
  const [selectedPrintCustomer, setSelectedPrintCustomer] = useState<Customer | null>(null);
  const [selectedTripFilter, setSelectedTripFilter] = useState<string>('all');
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  
  // CORPORATE ACCESS & TRACKING STATES
  const [branches, setBranches] = useState<Branch[]>(() => {
    try {
      const cached = localStorage.getItem('aboub_branches');
      return cached ? JSON.parse(cached) : DEFAULT_BRANCHES;
    } catch {
      return DEFAULT_BRANCHES;
    }
  });

  const [employees, setEmployees] = useState<Employee[]>(() => {
    try {
      const cached = localStorage.getItem('aboub_employees');
      return cached ? JSON.parse(cached) : DEFAULT_EMPLOYEES;
    } catch {
      return DEFAULT_EMPLOYEES;
    }
  });

  const [logs, setLogs] = useState<OperationLog[]>(() => {
    try {
      const cached = localStorage.getItem('aboub_logs');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(() => {
    try {
      const cached = localStorage.getItem('aboub_current_employee');
      return cached ? JSON.parse(cached) : DEFAULT_EMPLOYEES[0];
    } catch {
      return DEFAULT_EMPLOYEES[0];
    }
  });

  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>('all');

  // Employee Management Form States
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpUsername, setNewEmpUsername] = useState('');
  const [newEmpPassword, setNewEmpPassword] = useState('123');
  const [newEmpRole, setNewEmpRole] = useState<'Admin' | 'Manager' | 'Agent'>('Agent');
  const [newEmpBranchId, setNewEmpBranchId] = useState('');

  // Employee Editing / Deactivation States
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editEmpName, setEditEmpName] = useState('');
  const [editEmpUsername, setEditEmpUsername] = useState('');
  const [editEmpPassword, setEditEmpPassword] = useState('');
  const [editEmpRole, setEditEmpRole] = useState<'Admin' | 'Manager' | 'Agent'>('Agent');
  const [editEmpBranchId, setEditEmpBranchId] = useState('');

  // Branch Management Form States
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchLocation, setNewBranchLocation] = useState('');
  
  // Alert Status
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Time and Date tracker
  const [currentTime, setCurrentTime] = useState(new Date());

  // EMPLOYEE / BRANCH WRITE ACTIONS
  const handleAddEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpName.trim() || !newEmpUsername.trim() || !newEmpPassword.trim() || !newEmpBranchId) {
      showToast('الرجاء تعبئة كامل حقول حساب الموظف الجديد', 'error');
      return;
    }

    try {
      const generatedId = `emp-${Date.now()}`;
      const branchObj = branches.find(b => b.id === newEmpBranchId);
      const branchName = branchObj ? branchObj.name : 'فرع غير معروف';
      const newEmp: Employee = {
        id: generatedId,
        name: newEmpName.trim(),
        username: newEmpUsername.trim().toLowerCase(),
        password: newEmpPassword,
        role: newEmpRole,
        branchId: newEmpBranchId,
        branchName: branchName,
      };

      await setDoc(doc(db, 'employees', generatedId), newEmp);

      const logId = `log-${Date.now()}`;
      const newLog = {
        id: logId,
        employeeId: currentEmployee?.id || 'emp-1',
        employeeName: currentEmployee?.name || 'عبد الفتاح عبعوب',
        branchName: currentEmployee?.branchName || 'فرع تقرت الرئيسي',
        actionType: 'add_employee' as const,
        details: `إنشاء حساب موظف جديد: ${newEmp.name} (اسم المستخدم: ${newEmp.username}) في ${branchName}`,
        timestamp: new Date().toISOString()
      };
      await setDoc(doc(db, 'logs', logId), newLog);

      setNewEmpName('');
      setNewEmpUsername('');
      setNewEmpPassword('123');
      setNewEmpRole('Agent');
      showToast(`تم إنشاء حساب الموظف بنجاح!`, 'success');
    } catch (err) {
      console.error(err);
      showToast('خطأ في الاتصال بقاعدة البيانات', 'error');
    }
  };

  const handleDeleteEmployee = async (empId: string) => {
    if (empId === 'emp-1') {
      showToast('غير مسموح إطلاقاً بحذف حساب المدير العام الرئيسي للوكالة!', 'error');
      return;
    }
    if (empId === currentEmployee?.id) {
      showToast('غير مسموح أن تقوم بحذف حسابك الذي تستخدمه حالياً!', 'error');
      return;
    }

    try {
      const targetEmp = employees.find(e => e.id === empId);
      if (!targetEmp) {
        showToast('الموظف غير متوفر في السجلات', 'error');
        return;
      }
      await deleteDoc(doc(db, 'employees', empId));

      const logId = `log-${Date.now()}`;
      const newLog = {
        id: logId,
        employeeId: currentEmployee?.id || 'emp-1',
        employeeName: currentEmployee?.name || 'عبد الفتاح عبعوب',
        branchName: currentEmployee?.branchName || 'فرع تقرت الرئيسي',
        actionType: 'delete_employee' as const,
        details: `حذف حساب الموظف: ${targetEmp.name} (اسم المستخدم: ${targetEmp.username})`,
        timestamp: new Date().toISOString()
      };
      await setDoc(doc(db, 'logs', logId), newLog);

      showToast(`تم حذف وإنهاء حساب موظف الفرع بنجاح`, 'info');
    } catch (err) {
      console.error(err);
      showToast('خطأ في الاتصال بقاعدة البيانات', 'error');
    }
  };

  const handleUpdateEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;
    if (!editEmpName.trim() || !editEmpUsername.trim() || !editEmpBranchId) {
      showToast('الرجاء كتابة الاسم واسم المستخدم واختيار فرع صالح', 'error');
      return;
    }

    try {
      const branchObj = branches.find(b => b.id === editEmpBranchId);
      const branchName = branchObj ? branchObj.name : 'فرع غير معروف';
      
      const updatedEmp: Employee = {
        ...editingEmployee,
        name: editEmpName.trim(),
        username: editEmpUsername.trim().toLowerCase(),
        password: editEmpPassword.trim() || editingEmployee.password,
        role: editEmpRole,
        branchId: editEmpBranchId,
        branchName: branchName,
      };

      await setDoc(doc(db, 'employees', editingEmployee.id), updatedEmp);

      const logId = `log-${Date.now()}`;
      const newLog = {
        id: logId,
        employeeId: currentEmployee?.id || 'emp-1',
        employeeName: currentEmployee?.name || 'عبد الفتاح عبعوب',
        branchName: currentEmployee?.branchName || 'فرع تقرت الرئيسي',
        actionType: 'update_employee' as const,
        details: `تحديث بيانات الموظف: ${updatedEmp.name} (اسم المستخدم: ${updatedEmp.username})`,
        timestamp: new Date().toISOString()
      };
      await setDoc(doc(db, 'logs', logId), newLog);

      setEditingEmployee(null);
      showToast('تم تحديث بيانات حساب الموظف بنجاح!', 'success');
    } catch (err) {
      console.error(err);
      showToast('خطأ في الاتصال بقاعدة البيانات', 'error');
    }
  };

  const toggleDisableEmployee = async (empId: string, currentStatus: boolean | undefined) => {
    if (empId === 'emp-1') {
      showToast('غير مسموح بتعطيل حساب المدير العام الرئيسي للوكالة!', 'error');
      return;
    }
    if (empId === currentEmployee?.id) {
      showToast('غير مسموح بتعطيل حسابك الشخصي الذي تستخدمه حالياً!', 'error');
      return;
    }

    try {
      const targetEmp = employees.find(e => e.id === empId);
      if (!targetEmp) return;

      const updatedEmp = {
        ...targetEmp,
        disabled: !currentStatus
      };

      await setDoc(doc(db, 'employees', empId), updatedEmp);

      const logId = `log-${Date.now()}`;
      const newLog = {
        id: logId,
        employeeId: currentEmployee?.id || 'emp-1',
        employeeName: currentEmployee?.name || 'عبد الفتاح عبعوب',
        branchName: currentEmployee?.branchName || 'فرع تقرت الرئيسي',
        actionType: 'update_employee' as const,
        details: `${!currentStatus ? 'تعطيل' : 'تنشيط'} حساب الموظف: ${targetEmp.name}`,
        timestamp: new Date().toISOString()
      };
      await setDoc(doc(db, 'logs', logId), newLog);

      showToast(!currentStatus ? 'تم تعطيل نشاط هذا الموظف بنجاح' : 'تم إعادة تنشيط الموظف بنجاح', 'success');
    } catch (err) {
      console.error(err);
      showToast('خطأ في تعديل حالة تفعيل الموظف بقاعدة البيانات', 'error');
    }
  };

  const handleAddBranchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName.trim() || !newBranchLocation.trim()) {
      showToast('الرجاء كتابة اسم الفرع والموقع الجغرافي بالكامل', 'error');
      return;
    }

    try {
      const generatedId = `branch-${Date.now()}`;
      const newBranch: Branch = {
        id: generatedId,
        name: newBranchName.trim(),
        location: newBranchLocation.trim(),
      };

      await setDoc(doc(db, 'branches', generatedId), newBranch);

      const logId = `log-${Date.now()}`;
      const newLog = {
        id: logId,
        employeeId: currentEmployee?.id || 'emp-1',
        employeeName: currentEmployee?.name || 'عبد الفتاح عبعوب',
        branchName: currentEmployee?.branchName || 'فرع تقرت الرئيسي',
        actionType: 'add_branch' as const,
        details: `تأسيس وإرساء الفرع الجديد: ${newBranch.name} في ${newBranch.location}`,
        timestamp: new Date().toISOString()
      };
      await setDoc(doc(db, 'logs', logId), newLog);

      setNewBranchName('');
      setNewBranchLocation('');
      showToast(`تم تأسيس وإرساء الفرع بنجاح وتحصينه!`, 'success');
    } catch (err) {
      console.error(err);
      showToast('خطأ في تأسيس الفرع بقاعدة البيانات', 'error');
    }
  };

  // 2. LIVE CLOCK EFFECT & GLOBAL PRINT HEADERS/FOOTERS SUPPRESSION
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Globally hide webpage titles and default browser headers (URL, Website name, Date/Time) during print
  useEffect(() => {
    const originalTitle = document.title;
    const handleBeforePrint = () => {
      document.title = ''; // Setting document.title to empty suppresses the website title/name in Chrome/Firefox/Safari
    };
    const handleAfterPrint = () => {
      document.title = originalTitle || 'بوابة إدارة الفروع - وكالة عبعوب';
    };
    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  // Helpers: Load dynamic datasets from backend with fail-safe local storage fallback
  const loadFromLocalStorageFallback = () => {
    try {
      const cachedCust = localStorage.getItem('aboub_customers');
      const cachedTrips = localStorage.getItem('aboub_trips');
      const cachedBranches = localStorage.getItem('aboub_branches');
      const cachedEmployees = localStorage.getItem('aboub_employees');
      const cachedLogs = localStorage.getItem('aboub_logs');

      if (cachedCust) setCustomers(JSON.parse(cachedCust));
      
      if (cachedTrips) {
        const parsed: Trip[] = JSON.parse(cachedTrips);
        // Sync any missing default itineraries
        const missingDefaults = defaultTrips.filter(
          dt => !parsed.some(pt => pt.id === dt.id)
        );
        if (missingDefaults.length > 0) {
          const merged = [...parsed, ...missingDefaults];
          setTrips(merged);
          localStorage.setItem('aboub_trips', JSON.stringify(merged));
        } else {
          setTrips(parsed);
        }
      } else {
        setTrips(defaultTrips);
        localStorage.setItem('aboub_trips', JSON.stringify(defaultTrips));
      }

      if (cachedBranches) setBranches(JSON.parse(cachedBranches));
      if (cachedEmployees) setEmployees(JSON.parse(cachedEmployees));
      if (cachedLogs) setLogs(JSON.parse(cachedLogs));
    } catch (e) {
      console.error('Failed to load fallback localStorage data:', e);
    }
  };

  const fetchInitialData = async () => {
    try {
      const res = await fetch('/api/data');
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          setCustomers(result.data.customers || []);
          
          const fetchedTrips: Trip[] = result.data.trips || [];
          const missingDefaults = defaultTrips.filter(
            dt => !fetchedTrips.some(pt => pt.id === dt.id)
          );
          if (missingDefaults.length > 0) {
            const merged = [...fetchedTrips, ...missingDefaults];
            setTrips(merged);
            localStorage.setItem('aboub_trips', JSON.stringify(merged));
          } else {
            setTrips(fetchedTrips);
          }

          setBranches(result.data.branches || []);
          setEmployees(result.data.employees || []);
          setLogs(result.data.logs || []);
        }
      } else if (res.status === 401) {
        setCurrentEmployee(null);
      } else {
        loadFromLocalStorageFallback();
      }
    } catch (e) {
      console.error('Failed fetching server database, falling back to local cache:', e);
      loadFromLocalStorageFallback();
    }
  };

  const forceTriggerTripsSync = () => {
    try {
      const cached = localStorage.getItem('aboub_trips');
      let merged = [...defaultTrips];
      if (cached) {
        const parsed: Trip[] = JSON.parse(cached);
        const uniqueTrips = [...parsed];
        defaultTrips.forEach(dt => {
          const index = uniqueTrips.findIndex(ut => ut.id === dt.id);
          if (index !== -1) {
            uniqueTrips[index] = { ...uniqueTrips[index], ...dt };
          } else {
            uniqueTrips.push(dt);
          }
        });
        merged = uniqueTrips;
      }
      setTrips(merged);
      localStorage.setItem('aboub_trips', JSON.stringify(merged));
      showToast('تم تحديث ومزامنة جميع الرحلات السياحية (بما في ذلك رحلة شرم الشيخ صيف 2026 🇪🇬) ومسح الكاش المتقادم بنجاح!', 'success');
    } catch (e) {
      setTrips(defaultTrips);
      localStorage.setItem('aboub_trips', JSON.stringify(defaultTrips));
      showToast('تمت إعادة تهيئة الروزنامة وحل مشكلة الكاش بنجاح!', 'success');
    }
  };

  // Passive synchronization hooks to automatically persist application state
  useEffect(() => {
    if (customers.length > 0) {
      localStorage.setItem('aboub_customers', JSON.stringify(customers));
    }
  }, [customers]);

  useEffect(() => {
    if (trips.length > 0) {
      localStorage.setItem('aboub_trips', JSON.stringify(trips));
    }
  }, [trips]);

  useEffect(() => {
    if (branches.length > 0) {
      localStorage.setItem('aboub_branches', JSON.stringify(branches));
    }
  }, [branches]);

  useEffect(() => {
    if (employees.length > 0) {
      localStorage.setItem('aboub_employees', JSON.stringify(employees));
    }
  }, [employees]);

  useEffect(() => {
    if (logs.length > 0) {
      localStorage.setItem('aboub_logs', JSON.stringify(logs));
    }
  }, [logs]);

  useEffect(() => {
    if (currentEmployee) {
      localStorage.setItem('aboub_current_employee', JSON.stringify(currentEmployee));
    } else {
      localStorage.removeItem('aboub_current_employee');
    }
  }, [currentEmployee]);

  // 3. LOAD DATA & SESSION STATE FROM API (PROTECTED AUTO-RECOVERY ROUTE)
  useEffect(() => {
    const inspectSession = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const result = await res.json();
          if (result.success && result.employee) {
            setCurrentEmployee(result.employee);
          }
        } else {
          // If the backend has failed (like on Vercel deployment), keep the default local admin active
          if (!currentEmployee) {
            setCurrentEmployee(DEFAULT_EMPLOYEES[0]);
          }
        }
      } catch (e) {
        console.error('Session recovery failed, maintaining default session:', e);
        if (!currentEmployee) {
          setCurrentEmployee(DEFAULT_EMPLOYEES[0]);
        }
      }
    };
    inspectSession();
  }, []);

  // Real-time Firestore Synchronization Hook (replaces old interval-based polling)
  useEffect(() => {
    if (!currentEmployee) return;

    console.log('Registering real-time Firestore synchronizers...');

    // 1. Listen to customers collection
    const unsubscribeCustomers = onSnapshot(collection(db, 'customers'), (snap) => {
      const list: Customer[] = [];
      snap.forEach(docSnap => {
        list.push(docSnap.data() as Customer);
      });
      setCustomers(list);
    }, (error) => {
      console.error('Error listening to customers:', error);
    });

    // 2. Listen to trips collection
    const unsubscribeTrips = onSnapshot(collection(db, 'trips'), (snap) => {
      const list: Trip[] = [];
      snap.forEach(docSnap => {
        list.push(docSnap.data() as Trip);
      });
      if (list.length > 0) {
        // Sync any missing default itineraries
        const missingDefaults = defaultTrips.filter(
          dt => !list.some(pt => pt.id === dt.id)
        );
        if (missingDefaults.length > 0) {
          const merged = [...list, ...missingDefaults];
          setTrips(merged);
        } else {
          setTrips(list);
        }
      } else {
        setTrips(defaultTrips);
      }
    }, (error) => {
      console.error('Error listening to trips:', error);
    });

    // 3. Listen to branches collection
    const unsubscribeBranches = onSnapshot(collection(db, 'branches'), (snap) => {
      const list: Branch[] = [];
      snap.forEach(docSnap => {
        list.push(docSnap.data() as Branch);
      });
      if (list.length > 0) {
        setBranches(list);
      } else {
        setBranches(DEFAULT_BRANCHES);
      }
    }, (error) => {
      console.error('Error listening to branches:', error);
    });

    // 4. Listen to employees collection
    const unsubscribeEmployees = onSnapshot(collection(db, 'employees'), (snap) => {
      const list: Employee[] = [];
      snap.forEach(docSnap => {
        list.push(docSnap.data() as Employee);
      });
      if (list.length > 0) {
        setEmployees(list);
      } else {
        setEmployees(DEFAULT_EMPLOYEES);
      }
    }, (error) => {
      console.error('Error listening to employees:', error);
    });

    // 5. Listen to logs collection (limit to latest 150)
    const logsQuery = query(collection(db, 'logs'), orderBy('timestamp', 'desc'));
    const unsubscribeLogs = onSnapshot(logsQuery, (snap) => {
      const list: OperationLog[] = [];
      snap.forEach(docSnap => {
        list.push(docSnap.data() as OperationLog);
      });
      setLogs(list.slice(0, 150));
    }, (error) => {
      console.error('Error listening to logs:', error);
    });

    return () => {
      unsubscribeCustomers();
      unsubscribeTrips();
      unsubscribeBranches();
      unsubscribeEmployees();
      unsubscribeLogs();
    };
  }, [currentEmployee]);

  // 4. WORKSPACE SESSION AUTHENTICATION
  const handleLogin = (employee: Employee) => {
    setCurrentEmployee(employee);
    setSelectedBranchFilter('all');
    setActiveTab('dashboard');
    showToast(`أهلاً بك مجدداً يا ${employee.name} في بوابة وكالة عبعوب!`, 'success');
  };

  const handleLogout = async () => {
    showToast('بوابة مفتوحة وخالية من حواجز الدخول.', 'info');
  };

  // 4.5 WRITE DATA TO LOCAL STORAGE ON STATE CHANGE
  // Automatically handled by the standard passive observer effects

  // 5. HELPER ACTION: TOAST MESSAGES
  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // 5.8 DYNAMIC MULTI-BRANCH DATA SCOPING
  const scopedCustomers = useMemo(() => {
    if (!currentEmployee) return [];
    // Agents can now access customers across all branches (Removing sales censorship/restrictions)
    if (selectedBranchFilter && selectedBranchFilter !== 'all') {
      return customers.filter(c => c.branchId === selectedBranchFilter);
    }
    return customers;
  }, [customers, currentEmployee, selectedBranchFilter]);

  // 6. DASHBOARD CALCULATED METRICS
  const metrics = useMemo(() => {
    const activeCustomers = selectedTripFilter === 'all' 
      ? scopedCustomers 
      : scopedCustomers.filter(c => c.tripId === selectedTripFilter);

    const totalPassengers = activeCustomers.reduce((sum, c) => sum + (c.peopleCount || 1), 0);
    
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
  }, [scopedCustomers, trips, selectedTripFilter]);

  // 6.5 CORPORATE LOGGING HELPER
  const addLog = async (actionType: OperationLog['actionType'], details: string) => {
    // Audit logs are securely recorded on the server automatically.
    // This client-side helper is maintained for typings compatibility.
  };

  // 7. CORE EVENT: ADD MEMBER
  const handleAddCustomer = async (newCust: Omit<Customer, 'id' | 'registrationDate' | 'invoiceNumber'>) => {
    try {
      const generatedId = `customer-${Date.now()}`;
      const nextSeq = String(customers.length + 1).padStart(4, '0');
      const invoiceNumber = `AB-2026-${nextSeq}`;
      const completeCustomer: Customer = {
        ...newCust,
        id: generatedId,
        registrationDate: new Date().toISOString(),
        invoiceNumber: invoiceNumber,
        employeeId: currentEmployee?.id || 'emp-1',
        employeeName: currentEmployee?.name || 'عبد الفتاح عبعوب',
        branchId: currentEmployee?.branchId || 'branch-touggourt',
        branchName: currentEmployee?.branchName || 'فرع تقرت الرئيسي',
      } as Customer;

      // Write to Firestore in the cloud
      await setDoc(doc(db, 'customers', generatedId), completeCustomer);

      let tripName = 'غير معروفة';
      const trip = trips.find(t => t.id === newCust.tripId);
      if (trip) tripName = trip.name;

      const logId = `log-${Date.now()}`;
      const newLog = {
        id: logId,
        employeeId: currentEmployee?.id || 'emp-1',
        employeeName: currentEmployee?.name || 'عبد الفتاح عبعوب',
        branchName: currentEmployee?.branchName || 'فرع تقرت الرئيسي',
        actionType: 'add_customer' as const,
        details: `تم تسجيل حجز جديد بنجاح للزبون: ${completeCustomer.firstName} ${completeCustomer.lastName} (رقم الحجز: ${invoiceNumber}) لرحلة "${tripName}"`,
        timestamp: new Date().toISOString()
      };
      await setDoc(doc(db, 'logs', logId), newLog);

      showToast(`تم تسجيل الزبون ${newCust.firstName} ${newCust.lastName} بنجاح كحجز جديد!`, 'success');
    } catch (e) {
      console.error('Failed to register customer to Firestore:', e);
      showToast('فشل تسجيل حجز العميل الجديد في قاعدة البيانات', 'error');
    }
  };

  // 8. CORE EVENT: UPDATE MEMBER
  const handleUpdateCustomer = async (updatedCust: Customer) => {
    try {
      await setDoc(doc(db, 'customers', updatedCust.id), updatedCust);
      
      const logId = `log-${Date.now()}`;
      const newLog = {
        id: logId,
        employeeId: currentEmployee?.id || 'emp-1',
        employeeName: currentEmployee?.name || 'عبد الفتاح عبعوب',
        branchName: currentEmployee?.branchName || 'فرع تقرت الرئيسي',
        actionType: 'update_customer' as const,
        details: `تحديث بيانات حجز الزبون: ${updatedCust.firstName} ${updatedCust.lastName} (رقم الحجز: ${updatedCust.invoiceNumber})`,
        timestamp: new Date().toISOString()
      };
      await setDoc(doc(db, 'logs', logId), newLog);

      showToast(`تم تعديل بيانات الزبون ${updatedCust.firstName} بنجاح وحفظها.`, 'success');
    } catch (e) {
      console.error('Failed to update customer in Firestore:', e);
      showToast('فشل تحديث بيانات العميل', 'error');
    }
  };

  // 9. CORE EVENT: DELETE MEMBER
  const handleDeleteCustomer = async (id: string) => {
    try {
      const customer = customers.find(c => c.id === id);
      if (!customer) {
        showToast('الزبون غير مسجل بالنظام', 'error');
        return;
      }
      await deleteDoc(doc(db, 'customers', id));

      const logId = `log-${Date.now()}`;
      const newLog = {
        id: logId,
        employeeId: currentEmployee?.id || 'emp-1',
        employeeName: currentEmployee?.name || 'عبد الفتاح عبعوب',
        branchName: currentEmployee?.branchName || 'فرع تقرت الرئيسي',
        actionType: 'delete_customer' as const,
        details: `تم إلغاء وحذف حجز الزبون بالكامل: ${customer.firstName} ${customer.lastName} (رقم الحجز: ${customer.invoiceNumber})`,
        timestamp: new Date().toISOString()
      };
      await setDoc(doc(db, 'logs', logId), newLog);

      showToast(`تم حذف حجز الزبون بنجاح من سجلات بوابة فروع وكالة عبعوب.`, 'info');
    } catch (e) {
      console.error('Failed to delete customer from Firestore:', e);
      showToast('فشل حذف قيد حجز العميل', 'error');
    }
  };

  // 10. TOURISM PROGRAM EVENTS: ADD TOUR
  const [newTripData, setNewTripData] = useState<{
    name: string;
    destination: string;
    price: number;
    duration: string;
    date: string;
    dates: string[];
    departurePlaceNotes?: string;
    isProfessional?: boolean;
    priceSingle?: number;
    priceDouble?: number;
    priceTriple?: number;
    priceQuadruple?: number;
    priceQuintuple?: number;
    priceSextuple?: number;
    priceChild?: number;
  }>({
    name: '',
    destination: '',
    price: 50000,
    duration: '8 أيام / 7 ليالٍ',
    date: '',
    dates: [],
    departurePlaceNotes: '',
    isProfessional: false,
    priceSingle: undefined,
    priceDouble: undefined,
    priceTriple: undefined,
    priceQuadruple: undefined,
    priceQuintuple: undefined,
    priceSextuple: undefined,
    priceChild: undefined,
  });

  const [newTripDatesInput, setNewTripDatesInput] = useState('');
  const [editTripDatesInput, setEditTripDatesInput] = useState('');

  const handleAddNewTripDateState = () => {
    if (!newTripDatesInput) return;
    if (newTripData.dates.includes(newTripDatesInput) || newTripData.date === newTripDatesInput) {
      showToast('هذا التاريخ مضاف بالفعل كخيار انطلاق!', 'error');
      return;
    }
    setNewTripData({
      ...newTripData,
      dates: [...newTripData.dates, newTripDatesInput].sort(),
    });
    setNewTripDatesInput('');
  };

  const handleRemoveNewTripDateState = (dateToRemove: string) => {
    setNewTripData({
      ...newTripData,
      dates: newTripData.dates.filter((d) => d !== dateToRemove),
    });
  };

  const handleAddTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTripData.name.trim() || !newTripData.destination.trim() || !newTripData.date) {
      showToast('الرجاء تعبئة كامل حقول الرحلة الجديدة', 'error');
      return;
    }

    try {
      const generatedId = `trip-${Date.now()}`;
      const createdTrip: Trip = {
        id: generatedId,
        name: newTripData.name,
        destination: newTripData.destination,
        price: Number(newTripData.price),
        duration: newTripData.duration,
        date: newTripData.date,
        dates: newTripData.dates || [],
        status: 'active',
        departurePlaceNotes: newTripData.departurePlaceNotes || '',
        isProfessional: !!newTripData.isProfessional,
        priceSingle: newTripData.priceSingle ? Number(newTripData.priceSingle) : undefined,
        priceDouble: newTripData.priceDouble ? Number(newTripData.priceDouble) : undefined,
        priceTriple: newTripData.priceTriple ? Number(newTripData.priceTriple) : undefined,
        priceQuadruple: newTripData.priceQuadruple ? Number(newTripData.priceQuadruple) : undefined,
        priceQuintuple: newTripData.priceQuintuple ? Number(newTripData.priceQuintuple) : undefined,
        priceSextuple: newTripData.priceSextuple ? Number(newTripData.priceSextuple) : undefined,
        priceChild: newTripData.priceChild ? Number(newTripData.priceChild) : undefined,
      };

      await setDoc(doc(db, 'trips', generatedId), createdTrip);
      
      const logId = `log-${Date.now()}`;
      const newLog = {
        id: logId,
        employeeId: currentEmployee?.id || 'emp-1',
        employeeName: currentEmployee?.name || 'عبد الفتاح عبعوب',
        branchName: currentEmployee?.branchName || 'فرع تقرت الرئيسي',
        actionType: 'add_trip' as const,
        details: `إنشاء برنامج رحلة سياحية جديدة: "${createdTrip.name}" الموجهة إلى ${createdTrip.destination}`,
        timestamp: new Date().toISOString()
      };
      await setDoc(doc(db, 'logs', logId), newLog);
      
      setNewTripData({
        name: '',
        destination: '',
        price: 50000,
        duration: '8 أيام / 7 ليالٍ',
        date: '',
        dates: [],
        departurePlaceNotes: '',
        isProfessional: false,
        priceSingle: undefined,
        priceDouble: undefined,
        priceTriple: undefined,
        priceQuadruple: undefined,
        priceQuintuple: undefined,
        priceSextuple: undefined,
        priceChild: undefined,
      });
      showToast(`تمت إضافة برنامج رحلة سياحية جديدة بنجاح!`, 'success');
    } catch (err) {
      console.error('Failed to add trip:', err);
      showToast('فشل إضافة الرحلة في قاعدة البيانات', 'error');
    }
  };

  const handleDeleteTrip = async (tripId: string) => {
    const affectedCount = customers.filter(c => c.tripId === tripId).length;
    if (affectedCount > 0) {
      showToast(`عذراً! لا يمكن حذف هذه الرحلة لوجود ${affectedCount} زبون تم حجزهم عليها.`, 'error');
      return;
    }

    try {
      const targetTrip = trips.find(t => t.id === tripId);
      if (!targetTrip) {
        showToast('البرنامج السياحي غير متوفر', 'error');
        return;
      }
      await deleteDoc(doc(db, 'trips', tripId));
      
      const logId = `log-${Date.now()}`;
      const newLog = {
        id: logId,
        employeeId: currentEmployee?.id || 'emp-1',
        employeeName: currentEmployee?.name || 'عبد الفتاح عبعوب',
        branchName: currentEmployee?.branchName || 'فرع تقرت الرئيسي',
        actionType: 'delete_trip' as const,
        details: `إزالة وإلغاء برنامج الرحلة السياحية: "${targetTrip.name}"`,
        timestamp: new Date().toISOString()
      };
      await setDoc(doc(db, 'logs', logId), newLog);
      showToast('تمت إزالة برنامج الرحلة بنجاح.', 'success');
    } catch (err) {
      console.error('Failed to delete trip:', err);
      showToast('فشل حذف الرحلة من قاعدة البيانات', 'error');
    }
  };

  const handleUpdateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrip) return;
    if (!editingTrip.name.trim() || !editingTrip.destination.trim() || !editingTrip.date) {
      showToast('الرجاء تعبئة كامل حقول البرنامج السياحي', 'error');
      return;
    }

    try {
      await setDoc(doc(db, 'trips', editingTrip.id), editingTrip);
      
      const logId = `log-${Date.now()}`;
      const newLog = {
        id: logId,
        employeeId: currentEmployee?.id || 'emp-1',
        employeeName: currentEmployee?.name || 'عبد الفتاح عبعوب',
        branchName: currentEmployee?.branchName || 'فرع تقرت الرئيسي',
        actionType: 'update_trip' as const,
        details: `تحديث بيانات برنامج الرحلة: "${editingTrip.name}"`,
        timestamp: new Date().toISOString()
      };
      await setDoc(doc(db, 'logs', logId), newLog);
      setEditingTrip(null);
      showToast(`تم تعديل وتحديث بيانات برنامج الرحلة بنجاح!`, 'success');
    } catch (err) {
      console.error('Failed to update trip:', err);
      showToast('فشل تعديل بيانات هذه الرحلة في قاعدة البيانات', 'error');
    }
  };

  // 11. DATA MIGRATION: EXPORT / IMPORT DATABASE (FOR BACKUP COPIES)
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

    fileReader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && Array.isArray(parsed.customers) && Array.isArray(parsed.trips)) {
          const res = await fetch('/api/backup/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customers: parsed.customers, trips: parsed.trips }),
          });
          const data = await res.json();
          if (res.ok && data.success) {
            setCustomers(data.customers || []);
            setTrips(data.trips || []);
            if (data.logs) setLogs(data.logs);
            showToast(`تم استيراد نسخة السجلات الاحتياطية وتزامنها مع الخادم المركزي بنجاح!`, 'success');
          } else {
            showToast(data.error || 'فشل دمج البيانات بالمخدم', 'error');
          }
        } else {
          showToast('تنسيق ملف النسخة الاحتياطية غير متوافق.', 'error');
        }
      } catch (err) {
        showToast('فشل في قراءة واستيراد ملف السجلات وتزامنها.', 'error');
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
        <div className="space-y-6">
          {/* Logo Heading - Premium & Modern Corporate Layout */}
          <div className="flex items-center gap-3.5">
            <div className="bg-gradient-to-br from-amber-400 to-amber-600 text-zinc-950 w-11 h-11 rounded-2xl flex items-center justify-center font-black text-lg shadow-lg shadow-amber-500/10 select-none transform hover:rotate-3 transition-all duration-300">
              ع
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.55">
                <h1 className="font-sans font-black text-xs tracking-tight select-none leading-none bg-gradient-to-l from-white to-stone-200 bg-clip-text text-transparent">
                  وكالة عبعوب للسياحة
                </h1>
                <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider scale-90">
                  PORTAL
                </span>
              </div>
              <span className="font-mono text-[8px] text-stone-400 font-bold tracking-wider select-none mt-1 opacity-80 uppercase leading-none">
                ABOUB TRAVEL AGENCY
              </span>
            </div>
          </div>

          <div className="border-t border-zinc-800/80 my-1"></div>

          {/* Navigation Links with generous hover and active states */}
          <nav className="space-y-1.5">
            <button
              onClick={() => setActiveTab('dashboard')}
              id="sidebar-btn-dashboard"
              className={`w-full py-3 px-3.5 rounded-xl transition-all font-bold text-xs cursor-pointer flex items-center justify-start gap-3.5 ${
                activeTab === 'dashboard'
                  ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/15 font-black'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-zinc-900/60'
              }`}
            >
              <LayoutDashboard size={14} className="shrink-0" />
              <span>تسجيل وعرض الحجوزات</span>
            </button>

            <button
              onClick={() => setActiveTab('manifests')}
              id="sidebar-btn-manifests"
              className={`w-full py-3 px-3.5 rounded-xl transition-all font-bold text-xs cursor-pointer flex items-center justify-start gap-3.5 ${
                activeTab === 'manifests'
                  ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/15 font-black'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-zinc-900/60'
              }`}
            >
              <Users size={14} className="shrink-0" />
              <span>دليل قوائم المسافرين</span>
            </button>

            <button
              onClick={() => setActiveTab('trips')}
              id="sidebar-btn-trips"
              className={`w-full py-3 px-3.5 rounded-xl transition-all font-bold text-xs cursor-pointer flex items-center justify-start gap-3.5 ${
                activeTab === 'trips'
                  ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/15 font-black'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-zinc-900/60'
              }`}
            >
              <Compass size={14} className="shrink-0" />
              <span>برامج الرحلات والمواسم</span>
            </button>

            <button
              onClick={() => setActiveTab('options')}
              id="sidebar-btn-options"
              className={`w-full py-3 px-3.5 rounded-xl transition-all font-bold text-xs cursor-pointer flex items-center justify-start gap-3.5 ${
                activeTab === 'options'
                  ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/15 font-black'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-zinc-900/60'
              }`}
            >
              <Database size={14} className="shrink-0" />
              <span>النسخ الاحتياطي والضبط</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer Info */}
        <div className="space-y-4 pt-4 mt-auto border-t border-zinc-900/80 text-right">
          <div className="flex items-center gap-2.5 bg-zinc-900/60 border border-zinc-900 rounded-xl px-3 py-2 select-none justify-center">
            <Clock size={13} className="text-amber-400 shrink-0 animate-spin-slow" />
            <span className="font-mono text-[10px] text-stone-300 font-bold tracking-wider">
              {currentTime.toLocaleTimeString('ar-DZ')}
            </span>
          </div>
          <div className="text-[10px] text-stone-500 leading-normal space-y-1 font-sans">
            <div>📍 حي عياد تبسبست، تقرت</div>
            <div>📞 الهاتف: 0667910148 / 0696789633</div>
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
            className={`flex-1 py-1.5 px-1.5 rounded-lg text-[9.5px] font-bold flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-all ${
              activeTab === 'dashboard' ? 'bg-amber-500 text-zinc-950 font-black shadow-xs' : 'text-stone-400 font-medium'
            }`}
          >
            <LayoutDashboard size={11} />
            <span>الحجوزات</span>
          </button>
          <button
            onClick={() => setActiveTab('manifests')}
            id="mobile-tab-manifests"
            className={`flex-1 py-1.5 px-1.5 rounded-lg text-[9.5px] font-bold flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-all ${
              activeTab === 'manifests' ? 'bg-amber-500 text-zinc-950 font-black shadow-xs' : 'text-stone-400 font-medium'
            }`}
          >
            <Users size={11} />
            <span>الكشوفات</span>
          </button>
          <button
            onClick={() => setActiveTab('trips')}
            id="mobile-tab-trips"
            className={`flex-1 py-1.5 px-1.5 rounded-lg text-[9.5px] font-bold flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-all ${
              activeTab === 'trips' ? 'bg-amber-500 text-zinc-950 font-black shadow-xs' : 'text-stone-450 font-medium'
            }`}
          >
            <Compass size={11} />
            <span>الرحلات</span>
          </button>
          <button
            onClick={() => setActiveTab('options')}
            id="mobile-tab-options"
            className={`flex-1 py-1.5 px-1.5 rounded-lg text-[9.5px] font-bold flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-all ${
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
              <div className="space-y-1">
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
                  customers={scopedCustomers}
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
            <TripManifests customers={scopedCustomers} trips={trips} />
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
                    <label htmlFor="trip-date" className="block font-bold text-slate-600 mb-1">تاريخ انطلاق السفر (الرئيسي)</label>
                    <input
                      type="date"
                      id="trip-date"
                      value={newTripData.date}
                      onChange={(e) => setNewTripData({ ...newTripData, date: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-right focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                      required
                    />
                  </div>

                  {/* Trip Type Selector (Standard / Normal vs Professional) */}
                  <div className="space-y-1.5 font-sans text-right">
                    <span className="block font-bold text-slate-600">تصنيف وتسعير برنامج الرحلة</span>
                    <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200/50">
                      <button
                        type="button"
                        onClick={() => setNewTripData({ ...newTripData, isProfessional: false })}
                        className={`py-2 px-3 rounded-lg text-center font-bold text-[11px] transition-all cursor-pointer ${
                          !newTripData.isProfessional
                            ? 'bg-white text-slate-800 shadow-xs border border-slate-250'
                            : 'text-slate-550 hover:text-slate-850 hover:bg-slate-50'
                        }`}
                      >
                        ✈️ رحلة عادية (سعر موحد ومباشر)
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewTripData({ ...newTripData, isProfessional: true })}
                        className={`py-2 px-3 rounded-lg text-center font-bold text-[11px] transition-all cursor-pointer ${
                          newTripData.isProfessional
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-550 hover:text-slate-850 hover:bg-slate-50'
                        }`}
                      >
                        ⭐ رحلة احترافية (أسعار غرف مفصلة)
                      </button>
                    </div>
                  </div>

                  {/* Detailed Prices Section (Algerian Accommodation Style) - Always Visible */}
                  <div className="bg-blue-50/45 p-3 rounded-lg border border-blue-100 space-y-2 mt-2 font-sans text-right">
                    <h4 className="font-extrabold text-[11px] text-blue-900 border-b border-blue-100 pb-1 mb-1.5 flex items-center gap-1">
                      <span>🏷️ تفاصيل الأسعار حسب نوع الغرفة والمقعد (اختياري)</span>
                    </h4>
                    <p className="text-[9px] text-slate-500 leading-normal mb-1">
                      تعبئة هذه الحقول تفعل تلقائياً خيارات الغرف المفصلة للمسافرين في استمارة التسجيل والعروض.
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div>
                        <label htmlFor="trip-price-single" className="block font-bold text-slate-600 mb-0.5">غرفة فردية Single</label>
                        <input
                          type="number"
                          id="trip-price-single"
                          placeholder="مثال: 75000"
                          value={newTripData.priceSingle || ''}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || undefined;
                            setNewTripData({ ...newTripData, priceSingle: val, isProfessional: true });
                          }}
                          className="w-full px-2 py-1.5 border border-slate-200 bg-white rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                        />
                      </div>
                      <div>
                        <label htmlFor="trip-price-double" className="block font-bold text-slate-600 mb-0.5">غرفة ثنائية Double</label>
                        <input
                          type="number"
                          id="trip-price-double"
                          placeholder="مثال: 55000"
                          value={newTripData.priceDouble || ''}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || undefined;
                            setNewTripData({ ...newTripData, priceDouble: val, isProfessional: true });
                          }}
                          className="w-full px-2 py-1.5 border border-slate-200 bg-white rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                        />
                      </div>
                      <div>
                        <label htmlFor="trip-price-triple" className="block font-bold text-slate-600 mb-0.5">غرفة ثلاثية Triple</label>
                        <input
                          type="number"
                          id="trip-price-triple"
                          placeholder="مثال: 48000"
                          value={newTripData.priceTriple || ''}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || undefined;
                            setNewTripData({ ...newTripData, priceTriple: val, isProfessional: true });
                          }}
                          className="w-full px-2 py-1.5 border border-slate-200 bg-white rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                        />
                      </div>
                      <div>
                        <label htmlFor="trip-price-quadruple" className="block font-bold text-slate-600 mb-0.5">غرفة رباعية Quadruple</label>
                        <input
                          type="number"
                          id="trip-price-quadruple"
                          placeholder="مثال: 42000"
                          value={newTripData.priceQuadruple || ''}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || undefined;
                            setNewTripData({ ...newTripData, priceQuadruple: val, isProfessional: true });
                          }}
                          className="w-full px-2 py-1.5 border border-slate-200 bg-white rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                        />
                      </div>
                      <div>
                        <label htmlFor="trip-price-quintuple" className="block font-bold text-slate-600 mb-0.5">غرفة خماسية Quintuple</label>
                        <input
                          type="number"
                          id="trip-price-quintuple"
                          placeholder="مثال: 38000"
                          value={newTripData.priceQuintuple || ''}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || undefined;
                            setNewTripData({ ...newTripData, priceQuintuple: val, isProfessional: true });
                          }}
                          className="w-full px-2 py-1.5 border border-slate-200 bg-white rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                        />
                      </div>
                      <div>
                        <label htmlFor="trip-price-sextuple" className="block font-bold text-slate-600 mb-0.5">غرفة سداسية Sextuple</label>
                        <input
                          type="number"
                          id="trip-price-sextuple"
                          placeholder="مثال: 35000"
                          value={newTripData.priceSextuple || ''}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || undefined;
                            setNewTripData({ ...newTripData, priceSextuple: val, isProfessional: true });
                          }}
                          className="w-full px-2 py-1.5 border border-slate-200 bg-white rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                        />
                      </div>
                      <div>
                        <label htmlFor="trip-price-child" className="block font-bold text-slate-600 mb-0.5">سعر الأطفال Child</label>
                        <input
                          type="number"
                          id="trip-price-child"
                          placeholder="مثال: 32000"
                          value={newTripData.priceChild || ''}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || undefined;
                            setNewTripData({ ...newTripData, priceChild: val, isProfessional: true });
                          }}
                          className="w-full px-2 py-1.5 border border-slate-200 bg-white rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Departure/Itinerary info details */}
                  <div className="font-sans text-right">
                    <label htmlFor="trip-departure-notes" className="block font-bold text-slate-600 mb-1">تفاصيل وملاحظات خط سير الرحلة ونقاط المغادرة</label>
                    <textarea
                      id="trip-departure-notes"
                      placeholder="مثال: الانطلاق عبر الحافلة من تقرت بساحة الشهداء، مع توفير خط تجمع في بسكرة والجزائر..."
                      value={newTripData.departurePlaceNotes || ''}
                      onChange={(e) => setNewTripData({ ...newTripData, departurePlaceNotes: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium font-sans leading-relaxed text-right text-stone-800"
                    />
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 mt-1">
                    <label className="block font-bold text-slate-700 mb-1 text-[11px] flex items-center justify-between">
                      <span>📆 تواريخ انطلاق إضافية أخرى</span>
                      <span className="text-[10px] text-slate-400 font-normal">اختياري</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={newTripDatesInput}
                        onChange={(e) => setNewTripDatesInput(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 border border-slate-200 bg-white rounded-lg text-xs font-medium font-sans"
                      />
                      <button
                        type="button"
                        onClick={handleAddNewTripDateState}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold rounded-lg border border-blue-200 transition-colors text-xs shrink-0 cursor-pointer"
                      >
                        إضافة تاريخ
                      </button>
                    </div>

                    {newTripData.dates && newTripData.dates.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2 border-t border-slate-200/50 font-sans">
                        {newTripData.dates.map((d, index) => (
                          <div key={index} className="inline-flex items-center gap-1 bg-white border border-slate-200 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-bold font-mono">
                            <span>{d}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveNewTripDateState(d)}
                              className="text-red-500 hover:text-red-700 text-[10px] px-0.5 font-bold"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
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
                            <div className="flex flex-col gap-0.5">
                              <span>تاريخ المغادرة المتوقع:</span>
                              {tour.dates && tour.dates.length > 0 ? (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {Array.from(new Set([tour.date, ...tour.dates])).filter(Boolean).map((d, index) => (
                                    <span key={index} className="bg-slate-100 text-slate-700 font-bold font-mono px-1.5 py-0.5 rounded text-[9px] border border-slate-200">
                                      {d}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="font-semibold text-slate-800 font-mono">{tour.date}</span>
                              )}
                            </div>
                            <div>حجوزات نشطة حالياً: <span className="font-bold text-blue-600 px-1">{bookedClientsCount} مسافرين</span></div>
                          </div>

                          {/* Rich metadata display of prices and departure details */}
                          {(tour.departurePlaceNotes || tour.priceSingle || tour.priceDouble || tour.priceTriple || tour.priceQuadruple || tour.priceQuintuple || tour.priceSextuple || tour.priceChild) && (
                            <div className="mt-3 pt-3 border-t border-slate-200/50 space-y-2 text-[10px] text-slate-550 font-sans text-right">
                              {tour.departurePlaceNotes && (
                                <div className="bg-slate-100 p-2 rounded text-[10px] text-slate-700 leading-relaxed">
                                  <strong className="text-slate-900 block mb-0.5">📌 مسار ونقاط الانطلاق:</strong>
                                  <p className="whitespace-pre-line">{tour.departurePlaceNotes}</p>
                                </div>
                              )}
                              
                              {(tour.priceSingle !== undefined || tour.priceDouble !== undefined || tour.priceTriple !== undefined || tour.priceQuadruple !== undefined || tour.priceQuintuple !== undefined || tour.priceSextuple !== undefined || tour.priceChild !== undefined) && (
                                <div className="bg-blue-50/50 p-2 rounded border border-blue-100 text-blue-950 font-sans">
                                  <strong className="text-blue-900 block mb-1">🏷️ تفاصيل أسعار الإقامة والغرف:</strong>
                                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px]">
                                    {tour.priceSingle !== undefined && <div>• فردية Single: <span className="font-bold font-mono">{tour.priceSingle.toLocaleString('ar-DZ')} دج</span></div>}
                                    {tour.priceDouble !== undefined && <div>• ثنائية Double: <span className="font-bold font-mono">{tour.priceDouble.toLocaleString('ar-DZ')} دج</span></div>}
                                    {tour.priceTriple !== undefined && <div>• ثلاثية Triple: <span className="font-bold font-mono">{tour.priceTriple.toLocaleString('ar-DZ')} دج</span></div>}
                                    {tour.priceQuadruple !== undefined && <div>• رباعية Quad: <span className="font-bold font-mono">{tour.priceQuadruple.toLocaleString('ar-DZ')} دج</span></div>}
                                    {tour.priceQuintuple !== undefined && <div>• خماسية Quint: <span className="font-bold font-mono">{tour.priceQuintuple.toLocaleString('ar-DZ')} دج</span></div>}
                                    {tour.priceSextuple !== undefined && <div>• سداسية Sext: <span className="font-bold font-mono">{tour.priceSextuple.toLocaleString('ar-DZ')} دج</span></div>}
                                    {tour.priceChild !== undefined && <div>• أطفال Child: <span className="font-bold font-mono">{tour.priceChild.toLocaleString('ar-DZ')} دج</span></div>}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-4 border-t border-slate-100 pt-3">
                          <span className="text-blue-600 font-bold font-mono text-sm">
                            {tour.price.toLocaleString('ar-DZ')} د.ج
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                const defaultTripObj = defaultTrips.find(dt => dt.id === tour.id);
                                const enrichedTrip = {
                                  ...defaultTripObj,
                                  ...tour,
                                };
                                setEditingTrip(enrichedTrip);
                              }}
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

              {/* Force Cache Reset and Sync Official Trips */}
              <div className="border border-blue-250 p-5 rounded-xl space-y-3 bg-blue-50/45 text-right font-sans">
                <h4 className="font-bold text-sm text-blue-900 flex items-center gap-2 justify-end">
                  <span>مزامنة وتفعيل برامج الرحلات الجديدة (تحديث صيف 2026 🇪🇬)</span>
                  <RefreshCw size={15} className="text-blue-600 animate-spin" style={{ animationDuration: '6s' }} />
                </h4>
                <p className="text-[11px] text-blue-800 leading-relaxed font-sans">
                  إذا واجهتك مشكلة في ظهور برامج الرحلات المضافة حديثاً (مثل <strong>رحلة شرم الشيخ صيف 2026</strong> بمصر) بعد رفع الموقع على GitHub/Vercel، فهذا يعود لمتصفحك الذي يحتفظ بنسخة كاش عتيقة لملف <code>localStorage</code>. بالنقر على زر المزامنة أدناه، سيتم مسح الكاش المتقادم وتثبيت أحدث روزنامة رحلات معتمدة فوراً دون التأثير على الحجوزات المسجلة مطلقاً.
                </p>
                <button
                  onClick={forceTriggerTripsSync}
                  id="btn-sync-cache-trips"
                  className="w-full mt-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <RefreshCw size={14} />
                  تحديث ومزامنة روزنامة البرامج (حل مشكلة الكاش)
                </button>
              </div>

              {/* Developer Note */}
              <div className="bg-blue-50/70 rounded-xl p-4 border border-blue-105 text-xs text-blue-800 leading-relaxed font-sans">
                <strong>💡 تنويه أمني:</strong> تذكر دائماً ألا تمسح ملفات تعريف ارتباط المتصفح (Cache) أو بيانات المتصفح الخاصة لضمان ثبات السجلات. يوصى بشدة بتحميل نسخة احتياطية في نهاية كل أسبوع عمل لحماية وحفظ ملفات زبائن وكالة عبعوب للسياحة والأسفار.
              </div>
            </div>
          )}

          {/* TAB 4: ADVANCED ADMIN & HR CENTER */}
          {activeTab === 'admin' && (currentEmployee.role === 'Admin' || currentEmployee.role === 'Manager') && (
            <div className="space-y-6 animate-in fade-in duration-200 text-right">
              
              {/* Header Info */}
              <div className="bg-gradient-to-l from-zinc-900 to-zinc-800 text-white rounded-2xl p-6 shadow-md border-b border-amber-500/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                    قسم الرقابة والعمليات الإدارية الموحد
                  </span>
                  <h3 className="font-sans font-black text-lg">بوابة التحكم بالفروع وتقييم المبيعات والموظفين</h3>
                  <p className="text-xs text-stone-300">أنت تتصفح حالياً بصلاحيات الإشراف الإداري العام. قم بتهيأة الموظفين الميدانيين وفرض ضوابط المحاسبة.</p>
                </div>
                <div className="flex items-center gap-2.5 bg-zinc-950/60 border border-zinc-800 px-4 py-2.5 rounded-xl">
                  <Users className="text-amber-500 shrink-0" size={20} />
                  <div className="text-right">
                    <span className="text-[10px] text-stone-400 block font-bold leading-none">إجمالي القوى العاملة:</span>
                    <span className="font-mono text-base font-black text-stone-100">{employees.length} موظف معتمد</span>
                  </div>
                </div>
              </div>

              {/* Administrative Bento Statistics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-stone-200/80 rounded-2xl p-4 flex items-center justify-between shadow-3xs">
                  <div className="space-y-1">
                    <span className="text-[10px] text-stone-400 font-bold block">الفروع الجغرافية</span>
                    <span className="text-lg font-black text-stone-900 font-mono">{branches.length} مكاتب فرعية</span>
                    <p className="text-[9px] text-stone-500">متصلة بالنظام الموحد</p>
                  </div>
                  <div className="p-3 bg-stone-50 text-stone-600 rounded-xl border border-stone-100">
                    <Building2 size={18} />
                  </div>
                </div>

                <div className="bg-white border border-stone-200/80 rounded-2xl p-4 flex items-center justify-between shadow-3xs">
                  <div className="space-y-1">
                    <span className="text-[10px] text-stone-400 font-bold block">الوكلاء ومسؤولي الحجز</span>
                    <span className="text-lg font-black text-stone-900 font-mono">
                      {employees.filter(e => e.role === 'Agent').length} وكلاء حجز
                    </span>
                    <p className="text-[9px] text-stone-500">مستخدمين نشطين بالبوابة</p>
                  </div>
                  <div className="p-3 bg-stone-50 text-stone-600 rounded-xl border border-stone-100">
                    <UserSquare2 size={18} />
                  </div>
                </div>

                <div className="bg-white border border-stone-200/80 rounded-2xl p-4 flex items-center justify-between shadow-3xs">
                  <div className="space-y-1">
                    <span className="text-[10px] text-stone-400 font-bold block">المبيعات والحجوزات الحالية</span>
                    <span className="text-lg font-black text-stone-900 font-mono">{customers.length} زبون</span>
                    <p className="text-[9px] text-stone-500">مسجلين في كافة الفروع</p>
                  </div>
                  <div className="p-3 bg-stone-50 text-stone-600 rounded-xl border border-stone-100">
                    <DollarSign size={18} className="text-amber-600" />
                  </div>
                </div>

                <div className="bg-white border border-stone-200/80 rounded-2xl p-4 flex items-center justify-between shadow-3xs">
                  <div className="space-y-1">
                    <span className="text-[10px] text-stone-400 font-bold block">المدراء والمشرفين</span>
                    <span className="text-lg font-black text-stone-900 font-mono">
                      {employees.filter(e => e.role === 'Admin' || e.role === 'Manager').length} إداريين
                    </span>
                    <p className="text-[9px] text-stone-500">صلاحيات تحكم كاملة</p>
                  </div>
                  <div className="p-3 bg-stone-50 text-stone-600 rounded-xl border border-stone-100">
                    <ShieldCheck size={18} className="text-blue-600" />
                  </div>
                </div>
              </div>

              {/* Action Creators: Add Employee & Add Branch Side-By-Side */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                
                {/* Creator: Add Employee Account (8 / 12) */}
                <div className="lg:col-span-8 bg-white rounded-2xl border border-stone-200 p-5 space-y-4">
                  <div className="border-b border-stone-100 pb-3 flex items-center gap-3">
                    <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                      <UserPlus2 size={16} />
                    </div>
                    <div>
                      <h4 className="font-sans font-black text-stone-900 text-sm">تسجيل وتهيأة حساب موظف جديد</h4>
                      <p className="text-[10px] text-stone-500 font-sans mt-0.5">أنشئ حساب دخول منفرد لكل وكيل حجز أو رئيس فرع لتتبع مبيعاته</p>
                    </div>
                  </div>

                  <form onSubmit={handleAddEmployeeSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans text-right text-xs">
                    <div className="space-y-1">
                      <label className="font-extrabold text-stone-700 block">الاسم الثلاثي الكامل للموظف <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        placeholder="مثال: يونس بن مسعود"
                        value={newEmpName}
                        onChange={(e) => setNewEmpName(e.target.value)}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-bold font-sans text-stone-850 text-xs focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/80 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-extrabold text-stone-700 block">اسم المستخدم الفريد (الدخول) <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        placeholder="مثال: younes_touggourt"
                        value={newEmpUsername}
                        onChange={(e) => setNewEmpUsername(e.target.value)}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-bold font-mono text-left text-stone-850 text-xs focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/80 focus:outline-none"
                        dir="ltr"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-extrabold text-stone-700 block">كلمة المرور الخاصة بالحساب <span className="text-rose-500">*</span></label>
                      <input
                        type="password"
                        placeholder="اكتب كلمة سر قوية أو اترك الافتراضي 123"
                        value={newEmpPassword}
                        onChange={(e) => setNewEmpPassword(e.target.value)}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-bold font-mono text-left text-stone-850 text-xs focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/80 focus:outline-none"
                        dir="ltr"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-extrabold text-stone-700 block">الدور والجهوزية الأمنية <span className="text-rose-500">*</span></label>
                      <select
                        value={newEmpRole}
                        onChange={(e) => setNewEmpRole(e.target.value as any)}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-bold text-stone-850 text-xs focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/80 focus:outline-none cursor-pointer"
                      >
                        <option value="Agent">Agent (عميل حجز قياسي - يرى فرعه فقط)</option>
                        <option value="Manager">Manager (مشرف فروع - يرى فرعه ولديه صلاحية تصفية باقي الفروع)</option>
                        <option value="Admin">Admin (المدير الإداري العام للشركة - صلاحيات شاملة ورقابة كل الفروع)</option>
                      </select>
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <label className="font-extrabold text-stone-700 block">الفرع الجغرافي المعيّن فيه هذا الموظف <span className="text-rose-500">*</span></label>
                      <select
                        value={newEmpBranchId}
                        onChange={(e) => setNewEmpBranchId(e.target.value)}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-black text-amber-950 text-xs focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/80 focus:outline-none cursor-pointer"
                      >
                        <option value="">-- اختر الفرع الجغرافي التابع له الموظف --</option>
                        {branches.map(b => (
                          <option key={b.id} value={b.id}>🏢 {b.name} ({b.location})</option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2 pt-2 text-left">
                      <button
                        type="submit"
                        className="px-6 py-2.5 bg-zinc-950 hover:bg-zinc-900 border border-amber-500/20 text-amber-400 hover:text-amber-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer inline-flex"
                      >
                        <UserPlus2 size={13} className="shrink-0" />
                        <span>تأسيس وتنشيط حساب الموظف</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* Creator: Add Branch (4 / 12) */}
                <div className="lg:col-span-4 bg-white rounded-2xl border border-stone-200 p-5 space-y-4">
                  <div className="border-b border-stone-100 pb-3 flex items-center gap-3">
                    <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
                      <Building2 size={16} />
                    </div>
                    <div>
                      <h4 className="font-sans font-black text-stone-900 text-sm">تأسيس مكتب فرع جديد</h4>
                      <p className="text-[10px] text-stone-500 font-sans mt-0.5">افتح فرعاً جغرافياً لربط وكلائه بالنظام الجاري للشركة</p>
                    </div>
                  </div>

                  <form onSubmit={handleAddBranchSubmit} className="space-y-4 font-sans text-right text-xs">
                    <div className="space-y-1">
                      <label className="font-extrabold text-stone-700 block">اسم مكتب الفرع الجديد <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        placeholder="مثال: فرع الوادي، فرع قسنطينة"
                        value={newBranchName}
                        onChange={(e) => setNewBranchName(e.target.value)}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-bold font-sans text-stone-850 text-xs focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/80 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-extrabold text-stone-700 block">العنوان والموقع الجغرافي <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        placeholder="مثال: حي الرمال، وسط المدينة"
                        value={newBranchLocation}
                        onChange={(e) => setNewBranchLocation(e.target.value)}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-bold font-sans text-stone-850 text-xs focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/80 focus:outline-none"
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="w-full py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-850 border border-blue-200 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Plus size={13} className="shrink-0" />
                        <span>تأكيد المطلب وتأسيس مكتب الفرع</span>
                      </button>
                    </div>
                  </form>
                </div>

              </div>

              {/* Table section: list of employees */}
              <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
                <div className="p-5 border-b border-stone-100 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="font-sans font-black text-stone-900 text-sm">سجل حسابات الموظفين المعتمدة بالوكالة</h4>
                    <p className="text-[10px] text-stone-400">كافة الروابط والحسابات النشطة والمسترجعة من الـ Local Storage بخصوصية</p>
                  </div>
                  <span className="font-mono text-[10px] text-stone-500 font-bold bg-stone-50 border border-stone-200 rounded-lg px-2 py-1">
                    إجمالي: {employees.length} حساب
                  </span>
                </div>

                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-right border-collapse font-sans table-auto">
                    <thead>
                      <tr className="bg-stone-50 border-b border-stone-150 text-stone-500 font-bold select-none">
                        <th className="p-3">اسم الموظف الرسمي</th>
                        <th className="p-3">اسم المستخدم (المعرّف)</th>
                        <th className="p-3">صلاحية النظام</th>
                        <th className="p-3">الفرع المكتبي المعين فيه</th>
                        <th className="p-3 text-center">أمن الحساب</th>
                        <th className="p-3 text-center">التحكم والضبط</th>
                      </tr>
                    </thead>
                     <tbody className="divide-y divide-stone-150">
                       {employees.map(emp => (
                         <tr key={emp.id} className="hover:bg-amber-50/20 transition-all font-semibold text-stone-850 text-[11px]">
                           <td className="p-3 font-extrabold text-stone-900 flex items-center gap-2">
                             <span className="w-1.5 h-1.5 rounded-full bg-stone-400"></span>
                             <span className={emp.disabled ? 'line-through text-stone-400' : ''}>{emp.name}</span>
                           </td>
                           <td className="p-3 font-mono font-bold text-stone-600 text-left" dir="ltr">@{emp.username}</td>
                           <td className="p-3">
                             <span className={`px-2 py-0.5 rounded font-black text-[9.5px] border ${
                               emp.role === 'Admin' 
                                 ? 'bg-rose-50 text-rose-700 border-rose-100' 
                                 : emp.role === 'Manager' 
                                 ? 'bg-blue-50 text-blue-700 border-blue-105' 
                                 : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                             }`}>
                               {emp.role === 'Admin' ? 'المدير العام' : emp.role === 'Manager' ? 'مشرف فروع' : 'وكيل حجز قياسي'}
                             </span>
                           </td>
                           <td className="p-3 font-medium text-stone-605">🏢 {emp.branchName}</td>
                           <td className="p-3 text-center">
                             {emp.disabled ? (
                               <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-150">
                                 <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                                 معطل
                               </span>
                             ) : (
                               <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-150">
                                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-none"></span>
                                 نشط {emp.id === 'emp-1' && '(محمي)'}
                               </span>
                             )}
                           </td>
                           <td className="p-2 text-center">
                             <div className="flex items-center justify-center gap-1.5">
                               <button
                                 onClick={() => {
                                   setEditingEmployee(emp);
                                   setEditEmpName(emp.name);
                                   setEditEmpUsername(emp.username);
                                   setEditEmpPassword('');
                                   setEditEmpRole(emp.role);
                                   setEditEmpBranchId(emp.branchId);
                                 }}
                                 className="p-1 px-2.5 bg-stone-50 hover:bg-stone-100 text-stone-700 hover:text-stone-900 border border-stone-200 rounded-lg flex items-center gap-1 transition-all font-black text-[10px] cursor-pointer"
                               >
                                 <Edit2 size={11} />
                                 <span>تعديل</span>
                               </button>

                               <button
                                 onClick={() => toggleDisableEmployee(emp.id, emp.disabled)}
                                 disabled={emp.id === 'emp-1' || emp.id === currentEmployee?.id}
                                 className={`p-1 px-2.5 rounded-lg border text-amber-700 hover:bg-amber-50 border-amber-200 transition-all cursor-pointer select-none flex items-center gap-1 text-[10px] font-black ${
                                   emp.id === 'emp-1' || emp.id === currentEmployee?.id ? 'opacity-30 cursor-not-allowed hover:bg-transparent border-stone-100 text-stone-300' : ''
                                 }`}
                               >
                                 {emp.disabled ? (
                                   <>
                                     <CheckCircle2 size={11} className="text-emerald-500" />
                                     <span>تفعيل</span>
                                   </>
                                 ) : (
                                   <>
                                     <AlertCircle size={11} className="text-rose-500" />
                                     <span>تعطيل</span>
                                   </>
                                 )}
                               </button>

                               <button
                                 onClick={() => {
                                   if (confirm(`هل أنت متأكد من رغبتك في إلغاء وإزالة موظف الوكالة "${emp.name}" بالكامل وفصل بياناته؟`)) {
                                     handleDeleteEmployee(emp.id);
                                   }
                                 }}
                                 className={`p-1 px-2.5 rounded-lg border text-rose-500 hover:bg-rose-50 border-stone-200 transition-all cursor-pointer select-none flex items-center gap-1 text-[10px] font-black ${
                                   emp.id === 'emp-1' || emp.id === currentEmployee?.id ? 'opacity-30 cursor-not-allowed text-stone-300 hover:bg-transparent border-stone-100' : ''
                                 }`}
                                 disabled={emp.id === 'emp-1' || emp.id === currentEmployee?.id}
                                >
                                 <Trash2 size={11} />
                                 <span>حذف</span>
                               </button>
                             </div>
                           </td>
                         </tr>
                       ))}
                     </tbody>
                  </table>
                </div>
              </div>

              {/* Interactive Audit Trail Log Desk (Real Logs) */}
              <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
                <div className="p-5 border-b border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-right space-y-0.5">
                    <h4 className="font-sans font-black text-stone-900 text-sm flex items-center gap-1.5 justify-end">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                      <span>سجل العمليات والرقابة الفورية الموحد (System Audit Trail)</span>
                    </h4>
                    <p className="text-[10px] text-stone-400">بيانات رقابية مشفّرة غير قابلة للتعديل أو المسح لتحديد الموظب والفرع والوقت لكل عملية بشكل قطعي</p>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('تنبيه أمني: هل تود مسح وعصف سجل العمليات بالكامل لأسباب صيانة فنية؟')) {
                        setLogs([]);
                        localStorage.setItem('aboub_operation_logs', JSON.stringify([]));
                        showToast('تم تصفير وعصف سجل الرقابة والعمليات بنجاح!', 'info');
                      }
                    }}
                    className="px-3 py-1 bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-605 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer select-none"
                  >
                    <Trash2 size={11} />
                    <span>تصفير سجل الرقابة</span>
                  </button>
                </div>

                <div className="p-4 bg-stone-50 border-b border-stone-150 flex items-center justify-between text-xs font-sans text-stone-500 select-none">
                  <span>يعرض آخر العمليات الموثقة بالثواني والدقائق لموظفي فروع وكالة عبعوب</span>
                  <span className="font-mono text-stone-700 font-bold bg-white border border-stone-150 px-2 py-0.5 rounded-md">
                    مجموع القيود: {logs.length} عملية مرصودة
                  </span>
                </div>

                <div className="p-1 max-h-[380px] overflow-y-auto divide-y divide-stone-100">
                  {logs.length === 0 ? (
                    <div className="py-12 text-center text-stone-400 font-sans space-y-2">
                      <Lock size={20} className="mx-auto opacity-40 text-stone-500" />
                      <p className="text-xs">سجل العمليات الموحد فارغ تماماً حالياً.</p>
                      <p className="text-[10px]">البوابة ستقوم بتوثيق أي حركات حجز أو إضافة سياحية فور حدوثها.</p>
                    </div>
                  ) : (
                    [...logs].reverse().map((lg) => (
                      <div key={lg.id} className="p-3.5 hover:bg-stone-50/70 transition-all text-right flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-sans leading-relaxed">
                        
                        {/* Operator info and Action message */}
                        <div className="flex items-start md:items-center gap-3">
                          {/* Log Icon Badge */}
                          <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 md:mt-0 ${
                            lg.actionType === 'add_customer' 
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                              : lg.actionType === 'delete_customer' 
                              ? 'bg-rose-50 text-rose-600 border border-rose-100 font-black' 
                              : lg.actionType === 'update_customer' 
                              ? 'bg-amber-50 text-amber-600 border border-amber-100' 
                              : 'bg-blue-50 text-blue-600 border border-blue-100'
                          }`}>
                            <ShieldAlert size={13} />
                          </div>

                          <div className="space-y-1">
                            {/* Action text */}
                            <p className="font-black text-stone-850 text-[11.5px]">{lg.details}</p>
                            
                            {/* Actor identity badge */}
                            <div className="flex items-center gap-2 text-[10px] text-stone-500 font-bold">
                              <span className="text-stone-900 bg-stone-150 rounded px-1.5 py-0.5">👤 {lg.operatorName} (@{lg.operatorUsername})</span>
                              <span>•</span>
                              <span className="text-amber-700 bg-amber-50 rounded px-1.5 py-0.5">🏢 الفرع: {lg.branchName}</span>
                            </div>
                          </div>
                        </div>

                        {/* Timestamp value */}
                        <div className="font-mono text-[9.5px] text-stone-400 bg-stone-100 rounded-md px-2.5 py-1 text-left shrink-0 font-bold flex items-center gap-1.5 border border-stone-200/50" dir="ltr">
                          <Clock size={9} />
                          <span>{new Date(lg.timestamp).toLocaleString('ar-DZ')}</span>
                        </div>

                      </div>
                    ))
                  )}
                </div>

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
                  <label htmlFor="edit-trip-date" className="block text-[10px] font-bold text-stone-600 mb-1">تاريخ انطلاق السفر (الرئيسي)</label>
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

              <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 mt-2">
                <label className="block font-bold text-stone-700 mb-1 text-[10px] flex items-center justify-between">
                  <span>📆 تواريخ انطلاق إضافية أخرى</span>
                  <span className="text-[9px] text-stone-400 font-normal">اختياري</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={editTripDatesInput}
                    onChange={(e) => setEditTripDatesInput(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 border border-stone-200 bg-white rounded-lg text-xs font-medium font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!editTripDatesInput) return;
                      const currentDates = editingTrip.dates || [];
                      if (currentDates.includes(editTripDatesInput) || editingTrip.date === editTripDatesInput) {
                        showToast('هذا التاريخ مضاف بالفعل كخيار انطلاق!', 'error');
                        return;
                      }
                      setEditingTrip({
                        ...editingTrip,
                        dates: [...currentDates, editTripDatesInput].sort()
                      });
                      setEditTripDatesInput('');
                    }}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold rounded-lg border border-blue-200 transition-colors text-xs shrink-0 cursor-pointer"
                  >
                    إضافة تاريخ
                  </button>
                </div>

                {editingTrip.dates && editingTrip.dates.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2 border-t border-stone-200/50">
                    {editingTrip.dates.map((d, index) => (
                      <div key={index} className="inline-flex items-center gap-1 bg-white border border-slate-200 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-bold font-mono">
                        <span>{d}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTrip({
                              ...editingTrip,
                              dates: editingTrip.dates?.filter(dt => dt !== d) || []
                            });
                          }}
                          className="text-red-500 hover:text-red-700 text-[10px] px-0.5 font-bold"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Trip Type Selector for EDIT (Standard / Normal vs Professional) */}
              <div className="space-y-1.5 font-sans text-right">
                <span className="block text-[10px] font-bold text-stone-600">تصنيف وتسعير برنامج الرحلة</span>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200/50">
                  <button
                    type="button"
                    onClick={() => setEditingTrip({ ...editingTrip, isProfessional: false })}
                    className={`py-1.5 px-3 rounded-lg text-center font-bold text-[10px] transition-all cursor-pointer ${
                      !editingTrip.isProfessional
                        ? 'bg-white text-slate-800 shadow-xs border border-slate-250 font-extrabold'
                        : 'text-slate-550 hover:text-slate-850 hover:bg-slate-50'
                    }`}
                  >
                    ✈️ رحلة عادية (سعر موحد ومباشر)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingTrip({ ...editingTrip, isProfessional: true })}
                    className={`py-1.5 px-3 rounded-lg text-center font-bold text-[10px] transition-all cursor-pointer ${
                      editingTrip.isProfessional
                        ? 'bg-blue-600 text-white shadow-xs font-extrabold'
                        : 'text-slate-550 hover:text-slate-850 hover:bg-slate-50'
                    }`}
                  >
                    ⭐ رحلة احترافية (أسعار غرف مفصلة)
                  </button>
                </div>
              </div>

              {/* Detailed Prices Section (Algerian Accommodation Style) - EDIT */}
              {(() => {
                const tripLabels = getTripPriceLabelsAndDefaults(editingTrip.id, editingTrip);
                const disabledKeys = (Object.keys(tripLabels) as (keyof typeof tripLabels)[]).filter(
                  (key) => tripLabels[key].disabled
                );
                return (
                  <div className="bg-blue-50/45 p-3 rounded-lg border border-blue-100 space-y-2 mt-2 font-sans text-right">
                    <h4 className="font-extrabold text-[11px] text-blue-900 border-b border-blue-100 pb-1 mb-1.5 flex items-center gap-1">
                      <span>🏷️ تفاصيل الأسعار حسب نوع الغرفة والمقعد (اختياري)</span>
                    </h4>
                    <p className="text-[9px] text-slate-500 leading-normal mb-1">
                      تعديل هذه الحقول ينعكس فوراً للمسافرين في استمارة التسجيل الحالية والعروض لجميع المستخدمين.
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      {!tripLabels.priceSingle.disabled && (
                        <div>
                          <label htmlFor="edit-trip-price-single" className="block font-bold text-slate-600 mb-0.5">{tripLabels.priceSingle.label}</label>
                          <input
                            type="number"
                            id="edit-trip-price-single"
                            placeholder={tripLabels.priceSingle.defaultVal ? `الافتراضي: ${tripLabels.priceSingle.defaultVal}` : "لا توجد تسعيرة مخصصة"}
                            value={editingTrip.priceSingle ?? ''}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || undefined;
                              setEditingTrip({ ...editingTrip, priceSingle: val, isProfessional: true });
                            }}
                            className="w-full px-2 py-1.5 border border-slate-200 bg-white rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-stone-800"
                          />
                        </div>
                      )}
                      {!tripLabels.priceDouble.disabled && (
                        <div>
                          <label htmlFor="edit-trip-price-double" className="block font-bold text-slate-600 mb-0.5">{tripLabels.priceDouble.label}</label>
                          <input
                            type="number"
                            id="edit-trip-price-double"
                            placeholder={tripLabels.priceDouble.defaultVal ? `الافتراضي: ${tripLabels.priceDouble.defaultVal}` : "لا توجد تسعيرة مخصصة"}
                            value={editingTrip.priceDouble ?? ''}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || undefined;
                              setEditingTrip({ ...editingTrip, priceDouble: val, isProfessional: true });
                            }}
                            className="w-full px-2 py-1.5 border border-slate-200 bg-white rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-stone-800"
                          />
                        </div>
                      )}
                      {!tripLabels.priceTriple.disabled && (
                        <div>
                          <label htmlFor="edit-trip-price-triple" className="block font-bold text-slate-600 mb-0.5">{tripLabels.priceTriple.label}</label>
                          <input
                            type="number"
                            id="edit-trip-price-triple"
                            placeholder={tripLabels.priceTriple.defaultVal ? `الافتراضي: ${tripLabels.priceTriple.defaultVal}` : "لا توجد تسعيرة مخصصة"}
                            value={editingTrip.priceTriple ?? ''}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || undefined;
                              setEditingTrip({ ...editingTrip, priceTriple: val, isProfessional: true });
                            }}
                            className="w-full px-2 py-1.5 border border-slate-200 bg-white rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-stone-800"
                          />
                        </div>
                      )}
                      {!tripLabels.priceQuadruple.disabled && (
                        <div>
                          <label htmlFor="edit-trip-price-quadruple" className="block font-bold text-slate-600 mb-0.5">{tripLabels.priceQuadruple.label}</label>
                          <input
                            type="number"
                            id="edit-trip-price-quadruple"
                            placeholder={tripLabels.priceQuadruple.defaultVal ? `الافتراضي: ${tripLabels.priceQuadruple.defaultVal}` : "لا توجد تسعيرة مخصصة"}
                            value={editingTrip.priceQuadruple ?? ''}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || undefined;
                              setEditingTrip({ ...editingTrip, priceQuadruple: val, isProfessional: true });
                            }}
                            className="w-full px-2 py-1.5 border border-slate-200 bg-white rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-stone-800"
                          />
                        </div>
                      )}
                      {!tripLabels.priceQuintuple.disabled && (
                        <div>
                          <label htmlFor="edit-trip-price-quintuple" className="block font-bold text-slate-600 mb-0.5">{tripLabels.priceQuintuple.label}</label>
                          <input
                            type="number"
                            id="edit-trip-price-quintuple"
                            placeholder={tripLabels.priceQuintuple.defaultVal ? `الافتراضي: ${tripLabels.priceQuintuple.defaultVal}` : "لا توجد تسعيرة مخصصة"}
                            value={editingTrip.priceQuintuple ?? ''}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || undefined;
                              setEditingTrip({ ...editingTrip, priceQuintuple: val, isProfessional: true });
                            }}
                            className="w-full px-2 py-1.5 border border-slate-200 bg-white rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-stone-800"
                          />
                        </div>
                      )}
                      {!tripLabels.priceSextuple.disabled && (
                        <div>
                          <label htmlFor="edit-trip-price-sextuple" className="block font-bold text-slate-600 mb-0.5">{tripLabels.priceSextuple.label}</label>
                          <input
                            type="number"
                            id="edit-trip-price-sextuple"
                            placeholder={tripLabels.priceSextuple.defaultVal ? `الافتراضي: ${tripLabels.priceSextuple.defaultVal}` : "لا توجد تسعيرة مخصصة"}
                            value={editingTrip.priceSextuple ?? ''}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || undefined;
                              setEditingTrip({ ...editingTrip, priceSextuple: val, isProfessional: true });
                            }}
                            className="w-full px-2 py-1.5 border border-slate-200 bg-white rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-stone-800"
                          />
                        </div>
                      )}
                      {!tripLabels.priceChild.disabled && (
                        <div>
                          <label htmlFor="edit-trip-price-child" className="block font-bold text-slate-600 mb-0.5">{tripLabels.priceChild.label}</label>
                          <input
                            type="number"
                            id="edit-trip-price-child"
                            placeholder={tripLabels.priceChild.defaultVal ? `الافتراضي: ${tripLabels.priceChild.defaultVal}` : "لا توجد تسعيرة مخصصة"}
                            value={editingTrip.priceChild ?? ''}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || undefined;
                              setEditingTrip({ ...editingTrip, priceChild: val, isProfessional: true });
                            }}
                            className="w-full px-2 py-1.5 border border-slate-200 bg-white rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-stone-800"
                          />
                        </div>
                      )}
                    </div>

                    {/* Add Dynamic Price Selector */}
                    {disabledKeys.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-blue-100/60">
                        <span className="block text-[10px] text-blue-800 font-bold mb-1.5">➕ إضافة تسعيرة مخصصة أو خيار سكن إضافي للرحلة:</span>
                        <div className="flex gap-1 flex-wrap">
                          {disabledKeys.map((key) => {
                            const arabicLabels: Record<string, string> = {
                              priceSingle: 'غرفة فردية Single',
                              priceDouble: 'غرفة ثنائية Double',
                              priceTriple: 'غرفة ثلاثية Triple',
                              priceQuadruple: 'غرفة رباعية Quadruple',
                              priceQuintuple: 'غرفة خماسية Quintuple',
                              priceSextuple: 'غرفة سداسية Sextuple',
                              priceChild: 'سعر الأطفال Child'
                            };
                            const label = arabicLabels[key] || key;
                            return (
                              <button
                                key={key}
                                type="button"
                                onClick={() => {
                                  const defaults: Record<string, number> = {
                                    priceSingle: 25000,
                                    priceDouble: 24000,
                                    priceTriple: 20000,
                                    priceQuadruple: 18000,
                                    priceQuintuple: 16000,
                                    priceSextuple: 15000,
                                    priceChild: 10000
                                  };
                                  setEditingTrip({
                                    ...editingTrip,
                                    [key]: defaults[key] || 0,
                                    isProfessional: true
                                  });
                                }}
                                className="px-2 py-1 bg-white hover:bg-blue-100/80 border border-blue-200 text-blue-700 font-bold rounded-md text-[9px] transition-all cursor-pointer shadow-2xs"
                              >
                                + {label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Departure/Itinerary info details - EDIT */}
              <div className="font-sans text-right">
                <label htmlFor="edit-trip-departure-notes" className="block font-bold text-slate-600 mb-1">تفاصيل وملاحظات خط سير الرحلة ونقاط المغادرة</label>
                <textarea
                  id="edit-trip-departure-notes"
                  placeholder="مثال: الانطلاق عبر الحافلة من أمام مقر الوكالة..."
                  value={editingTrip.departurePlaceNotes || ''}
                  onChange={(e) => setEditingTrip({ ...editingTrip, departurePlaceNotes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium font-sans leading-relaxed text-right text-stone-800"
                />
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

      {editingEmployee && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] font-sans" dir="rtl">
          <div className="bg-white rounded-3xl border border-stone-200 max-w-lg w-full overflow-hidden shadow-2xl text-right">
            <div className="bg-amber-50 p-6 border-b border-stone-150 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
                  <Edit2 size={18} />
                </div>
                <div>
                  <h3 className="font-sans font-black text-stone-900 text-base">تعديل ملف الموظف</h3>
                  <p className="text-[11px] text-stone-500 mt-0.5">تحديث معلومات حساب ومستويات وصول هذا الوكيل</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setEditingEmployee(null)}
                className="p-1 px-2 border border-stone-200 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-lg transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdateEmployeeSubmit} className="p-6 space-y-4 text-xs font-sans">
              <div className="space-y-1">
                <label className="font-extrabold text-stone-700 block">الاسم الكامل للموظف <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={editEmpName}
                  onChange={(e) => setEditEmpName(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-bold text-stone-850 text-xs focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/80 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-extrabold text-stone-700 block">اسم المستخدم (المعرِّف) <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={editEmpUsername}
                    onChange={(e) => setEditEmpUsername(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-mono font-bold text-stone-850 text-xs focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/80 focus:outline-none"
                    dir="ltr"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-stone-700 block">كلمة المرور الجديدة</label>
                  <input
                    type="password"
                    placeholder="اتركها فارغة لعدم التغيير"
                    value={editEmpPassword}
                    onChange={(e) => setEditEmpPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-mono text-xs focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/80 focus:outline-none"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-extrabold text-stone-700 block">الدور والصلاحيات بالنظام <span className="text-rose-500">*</span></label>
                <select
                  value={editEmpRole}
                  onChange={(e) => setEditEmpRole(e.target.value as any)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-bold text-stone-850 text-xs focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/80 focus:outline-none cursor-pointer"
                  disabled={editingEmployee.id === 'emp-1'}
                >
                  <option value="Agent">Agent (عميل حجز قياسي)</option>
                  <option value="Manager">Manager (مشرف فروع)</option>
                  <option value="Admin">Admin (المدير الإداري العام)</option>
                </select>
                {editingEmployee.id === 'emp-1' && (
                  <p className="text-[10px] text-amber-600 mt-1">حساب المدير العام الرئيسي لا تُمَس صلاحياته للحفاظ على أمن النظام.</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="font-extrabold text-stone-700 block">الفرع المكتبي المعين فيه <span className="text-rose-500">*</span></label>
                <select
                  value={editEmpBranchId}
                  onChange={(e) => setEditEmpBranchId(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-black text-amber-950 text-xs focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/80 focus:outline-none cursor-pointer"
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>🏢&nbsp;&nbsp;{b.name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setEditingEmployee(null)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
                >
                  إلغاء التراجع
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold rounded-xl text-xs transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
                >
                  <ShieldCheck size={14} />
                  <span>تأكيد المطلب وحفظ التحديثات</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
