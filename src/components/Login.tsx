/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Employee } from '../types';
import { ShieldCheck, User, Lock, ArrowLeftRight, Building2, HelpCircle } from 'lucide-react';

interface LoginProps {
  onLogin: (employee: Employee) => void;
  employees: Employee[];
}

export const Login: React.FC<LoginProps> = ({ onLogin, employees }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!username.trim() || !password.trim()) {
      setError('الرجاء كتابة اسم المستخدم وكلمة المرور');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'خطأ في التحقق من البيانات');
      } else {
        onLogin(data.employee);
      }
    } catch (err) {
      setError('فشل الاتصال بالخادم الآمن. يرجى التأكد من تشغيل البوابة بشكل صحيح');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSelect = (emp: Employee) => {
    setUsername(emp.username);
    setPassword('123');
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-4 md:p-8 font-sans selection:bg-amber-100 selection:text-amber-900" dir="rtl">
      
      {/* Container holding the brand header & form panel */}
      <div className="max-w-md w-full space-y-6">
        
        {/* Logo and Brand Statement */}
        <div className="text-center space-y-3.5">
          <div className="mx-auto w-24 h-24 bg-white border border-stone-200 rounded-full shadow-md flex items-center justify-center overflow-hidden">
            <img 
              src="/logo.png" 
              alt="Aboub Travels Logo" 
              className="w-20 h-20 object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="space-y-1">
            <span className="bg-amber-500/10 text-amber-800 border border-amber-500/15 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-3xs inline-block">
              بوابة الموظفين والشركاء | Employee Portal
            </span>
            <h1 className="font-sans font-black text-xl text-stone-900 tracking-tight">
              نظام إدارة فروع وكالة عبعوب للسياحة
            </h1>
            <p className="text-xs text-stone-500">
              سجل دخولك بنجاح للوصول إلى لوحة الحجوزات وإدارة ملفات المسافرين
            </p>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white border border-stone-200 rounded-3xl p-6 md:p-8 shadow-sm relative overflow-hidden" id="login-form-card">
          <div className="absolute top-0 left-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none -translate-x-6 -translate-y-6"></div>
          
          <h2 className="text-stone-800 font-extrabold text-sm mb-5 pb-3 border-b border-stone-100 flex items-center gap-2">
            <ShieldCheck className="text-amber-600 shrink-0" size={16} />
            <span>تسجيل الدخول الآمن للموظف</span>
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4 text-right text-xs">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-100/80 rounded-xl text-rose-800 font-bold text-[11px] leading-relaxed">
                ⚠️ {error}
              </div>
            )}

            <div>
              <label htmlFor="login-username" className="block text-[11px] font-bold text-stone-600 mb-1.5 flex items-center gap-1.5">
                <User size={13} className="text-stone-400" />
                <span>اسم المستخدم الخاص بالموظف</span>
              </label>
              <input
                type="text"
                id="login-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="مثال: admin أو agent_touggourt"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-205 font-bold text-stone-800 bg-white placeholder-stone-400 focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/80 transition-all text-left text-xs"
                required
              />
            </div>

            <div>
              <label htmlFor="login-password" className="block text-[11px] font-bold text-stone-600 mb-1.5 flex items-center gap-1.5">
                <Lock size={13} className="text-stone-400" />
                <span>كلمة السر المشفرة لموقع الفرع</span>
              </label>
              <input
                type="password"
                id="login-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-205 font-mono font-bold text-stone-800 bg-white placeholder-stone-400 focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/80 transition-all text-left text-xs"
                required
              />
            </div>

            <button
              type="submit"
              id="btn-login-submit"
              disabled={loading}
              className={`w-full mt-2 py-3 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md select-none transform transition active:scale-[0.98] ${
                loading ? 'bg-zinc-750 opacity-80 cursor-wait' : 'bg-zinc-950 hover:bg-zinc-900'
              }`}
            >
              <ShieldCheck size={15} />
              {loading ? 'جاري التحقق وتوفير الجلسة...' : 'تحقق وتسجيل دخول آمن'}
            </button>
          </form>
        </div>

        {/* Preset accounts guide for immediate review */}
        <div className="bg-stone-50 border border-stone-200 rounded-3xl p-5 space-y-4" id="login-preset-guide">
          <div className="flex items-center gap-2 border-b border-stone-200/60 pb-3">
            <ArrowLeftRight size={14} className="text-amber-700 shrink-0" />
            <h3 className="font-extrabold text-xs text-stone-800">
              حسابات توضيحية فورية (لاكتشاف مستويات الصلاحيات)
            </h3>
          </div>
          
          <div className="space-y-2">
            {employees.map((emp) => (
              <button
                key={emp.id}
                onClick={() => handleQuickSelect(emp)}
                className="w-full p-2.5 bg-white hover:bg-amber-500/5 border border-stone-200 hover:border-amber-500/30 rounded-xl text-right flex items-center justify-between gap-3 cursor-pointer transition-all active:scale-[0.99] group shadow-3xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-800 text-xs">
                      {emp.name}
                    </span>
                    <span className="font-mono text-[8px] text-stone-400">
                      ({emp.username})
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-stone-500 text-[10px]">
                    <Building2 size={11} className="text-stone-400" />
                    <span>{emp.branchName}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${
                    emp.role === 'Admin'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200/40'
                      : emp.role === 'Manager'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200/40'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200/40'
                  }`}>
                    {emp.role === 'Admin' ? 'مدير كامل' : emp.role === 'Manager' ? 'مشرّف' : 'موظف حجز'}
                  </span>
                  <span className="text-[10px] text-stone-300 font-bold group-hover:text-amber-600 transition-colors">
                    ◀
                  </span>
                </div>
              </button>
            ))}
          </div>

          <div className="bg-amber-500/5 text-[10px] text-amber-900 border border-amber-500/10 p-3 rounded-2xl flex items-start gap-2 font-sans leading-relaxed">
            <HelpCircle size={13} className="shrink-0 text-amber-700 mt-0.5" />
            <span>
              <strong>كلمة المرور الافتراضية للجميع:</strong> <code>123</code> (انقر على أي بطاقة أعلاه لتعبئة الحقول آلياً للتجربة السريعة).
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
