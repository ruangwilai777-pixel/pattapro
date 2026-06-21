'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Receipt, AlertCircle, DollarSign, Calendar, Tag } from 'lucide-react';

interface ExpenseItem {
  id: string;
  title: string;
  amount: number;
  date: string;
  category: string;
}

interface CentralExpenseFormProps {
  expenses: ExpenseItem[];
  total: number;
  onRefresh: () => void;
}

export default function CentralExpenseForm({ expenses, total, onRefresh }: CentralExpenseFormProps) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('เงินเดือน/ค่าจ้าง');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const categories = [
    'เงินเดือน/ค่าจ้าง',
    'ค่าเช่า/อาคาร',
    'สาธารณูปโภค',
    'ค่าซอฟต์แวร์/ระบบ',
    'ค่าโฆษณา/การตลาด',
    'อื่นๆ'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError('กรุณากรอกข้อมูลชื่อรายการและจำนวนเงินที่ถูกต้องเจ้า');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/finance/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          amount: Number(amount),
          category,
          date
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'บันทึกค่าใช้จ่ายไม่สำเร็จ');
      }

      setSuccessMsg('บันทึกค่าใช้จ่ายส่วนกลางเรียบร้อยแล้วเน้อเจ้า');
      setTitle('');
      setAmount('');
      // Refresh report data
      onRefresh();
      
      // Auto clear success message
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('คุณแน่ใจที่จะลบรายการค่าใช้จ่ายนี้ใช่ไหมเจ้า?')) return;

    try {
      const res = await fetch(`/api/finance/report?id=${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'ลบค่าใช้จ่ายไม่สำเร็จ');
      }

      onRefresh();
    } catch (err: any) {
      alert(err.message || 'เกิดข้อผิดพลาดในการลบรายการ');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* 1. Log Expense Form */}
      <div className="glass-panel p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Receipt className="w-5 h-5 text-[var(--accent-gold)]" />
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">บันทึกค่าใช้จ่ายส่วนกลาง</h3>
          </div>
          
          <p className="text-xs text-[var(--text-muted)] mb-6">
            เพิ่มรายการค่าใช้จ่ายในการบริหารสำนักงานใหญ่ของแบรนด์ภัทธา (เช่น เงินเดือนแอดมิน, ค่าเช่าอาคาร, ระบบคลาวด์/อินเทอร์เน็ต)
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Title */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">ชื่อรายการค่าใช้จ่าย</label>
              <input 
                type="text" 
                placeholder="เช่น ค่าเน็ตออฟฟิศ, เงินเดือนแอดมิน" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="glass-input"
                disabled={submitting}
              />
            </div>

            {/* Amount */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">จำนวนเงิน (บาท)</label>
              <div className="relative">
                <input 
                  type="number" 
                  placeholder="0.00" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="glass-input w-full pr-10"
                  disabled={submitting}
                />
                <span className="absolute right-3.5 top-3 text-xs text-[var(--text-muted)]">บาท</span>
              </div>
            </div>

            {/* Category */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">หมวดหมู่</label>
              <select 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
                className="glass-input w-full cursor-pointer appearance-none bg-[#121212] select-none"
                disabled={submitting}
              >
                {categories.map((cat, i) => (
                  <option key={i} value={cat} className="bg-[var(--bg-tertiary)] text-[var(--text-primary)]">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">วันที่บันทึกรายการ</label>
              <input 
                type="date" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="glass-input text-sm"
                disabled={submitting}
              />
            </div>

            {/* Success & Error alerts */}
            {error && (
              <div className="flex items-start gap-2 bg-red-950/30 border border-red-800/40 p-3 rounded-lg text-xs text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="flex items-start gap-2 bg-emerald-950/30 border border-emerald-800/40 p-3 rounded-lg text-xs text-emerald-400">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            <button 
              type="submit" 
              className="glass-button w-full py-3 rounded-lg flex items-center justify-center gap-2 mt-2 font-medium"
              disabled={submitting}
            >
              <Plus className="w-4 h-4" />
              <span>{submitting ? 'กำลังบันทึก...' : 'บันทึกค่าใช้จ่ายกลาง'}</span>
            </button>
          </form>
        </div>
      </div>

      {/* 2. Expense Table List */}
      <div className="lg:col-span-2 glass-panel p-6 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">รายการใช้จ่ายกลางสะสม</h3>
              <p className="text-xs text-[var(--text-muted)]">รายจ่ายบริหารจัดการของออฟฟิศหลัก</p>
            </div>
            
            <div className="text-right">
              <span className="text-xs text-[var(--text-muted)]">ยอดจ่ายส่วนกลางรวม</span>
              <div className="text-xl font-bold text-[var(--accent-gold)]">
                <span className="baht">฿</span>{total.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--glass-border)] text-[var(--text-secondary)] font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">วันที่</th>
                  <th className="py-3 px-4">รายการ</th>
                  <th className="py-3 px-4">หมวดหมู่</th>
                  <th className="py-3 px-4 text-right">จำนวนเงิน</th>
                  <th className="py-3 px-4 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--glass-border)]">
                {expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-[rgba(197,168,128,0.02)] transition-all">
                    <td className="py-3 px-4 text-[var(--text-muted)] flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[var(--accent-gold)] opacity-70" />
                      {new Date(expense.date).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                    </td>
                    <td className="py-3 px-4 font-medium text-[var(--text-primary)]">{expense.title}</td>
                    <td className="py-3 px-4 text-[var(--text-secondary)]">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[rgba(197,168,128,0.08)] border border-[var(--glass-border)]">
                        <Tag className="w-3 h-3 text-[var(--accent-gold)]" />
                        {expense.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-[var(--text-primary)]">
                      <span className="baht">฿</span>{Number(expense.amount).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleDelete(expense.id)}
                        className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                        title="ลบรายการนี้"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}

                {expenses.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-[var(--text-muted)] text-sm">
                      ไม่มีรายการค่าใช้จ่ายส่วนกลางที่ถูกบันทึกไว้ในระบบเน้อเจ้า
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
