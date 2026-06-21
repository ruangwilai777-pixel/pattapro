'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  ShoppingBag, 
  Truck, 
  DollarSign, 
  Calendar,
  AlertCircle,
  Database,
  Briefcase
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import FinancialCharts from '@/components/FinancialCharts';
import CentralExpenseForm from '@/components/CentralExpenseForm';
import ChatbotAssistant from '@/components/ChatbotAssistant';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'expenses' | 'ai'>('overview');
  const [activeProject, setActiveProject] = useState<'all' | 'souvenir' | 'truck'>('all');
  const [forceMock, setForceMock] = useState(false);
  
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch consolidated report data
  const fetchReport = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/finance/report?mock=${forceMock}&t=${Date.now()}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'ไม่สามารถดึงข้อมูลรายงานการเงินได้เจ้า');
      }
      setReportData(data);
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการติดต่อเซิร์ฟเวอร์');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [forceMock]);

  // Extract variables based on active project
  const getDisplayTotals = () => {
    if (!reportData) return { income: 0, expenses: 0, profit: 0, orderCount: 0, unitLabel: '' };
    
    if (activeProject === 'souvenir') {
      return {
        income: reportData.souvenir.totals.income,
        expenses: reportData.souvenir.totals.expenses,
        profit: reportData.souvenir.totals.profit,
        orderCount: reportData.souvenir.totals.orders,
        unitLabel: 'ออเดอร์ของฝาก'
      };
    } else if (activeProject === 'truck') {
      return {
        income: reportData.truck.totals.income,
        expenses: reportData.truck.totals.expenses,
        profit: reportData.truck.totals.profit,
        orderCount: reportData.truck.totals.trips,
        unitLabel: 'จำนวนเที่ยววิ่งงาน'
      };
    } else {
      return {
        income: reportData.totals.income,
        expenses: reportData.totals.expenses,
        profit: reportData.totals.profit,
        orderCount: reportData.souvenir.totals.orders + reportData.truck.totals.trips,
        unitLabel: 'รายการธุรกรรมทั้งหมด'
      };
    }
  };

  const totals = getDisplayTotals();
  const profitMargin = totals.income > 0 ? (totals.profit / totals.income) * 100 : 0;

  return (
    <div className="flex gap-8 p-4 min-h-screen max-w-[1600px] mx-auto w-full">
      {/* 1. Left Navigation Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        activeProject={activeProject}
        setActiveProject={setActiveProject}
        forceMock={forceMock}
        setForceMock={setForceMock}
        isSouvenirMocked={reportData?.souvenir?.isMocked ?? true}
        isTruckMocked={reportData?.truck?.isMocked ?? true}
      />

      {/* 2. Main Content Area */}
      <main className="flex-1 flex flex-col gap-6 py-2 overflow-x-hidden">
        {/* Header bar */}
        <header className="flex justify-between items-center glass-panel px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              {activeTab === 'overview' && 'ภาพรวมผลประกอบการในเครือ'}
              {activeTab === 'expenses' && 'การจัดการค่าใช้จ่ายสำนักงานกลาง'}
              {activeTab === 'ai' && 'ถามน้องนินา AI วิเคราะห์การเงิน'}
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              ข้อมูลรวมธุรกิจ Patta Shop และ Truck Dispatching (ช่วง 30 วันที่ผ่านมา)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={fetchReport}
              disabled={loading}
              className="text-xs px-3.5 py-2.5 rounded-lg glass-button-outline hover-lift flex items-center gap-2 font-medium"
            >
              <span>อัปเดตข้อมูล</span>
            </button>
            
            <div className="text-xs text-[var(--text-muted)] flex items-center gap-1.5 px-3 py-2 bg-[rgba(255,255,255,0.02)] border border-[var(--glass-border)] rounded-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>เซิร์ฟเวอร์เปิดใช้งานอยู่</span>
            </div>
          </div>
        </header>

        {/* Dynamic tabs render */}
        {loading && !reportData ? (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-12 h-12 rounded-full border-2 border-[var(--accent-gold)] border-t-transparent animate-spin mb-4" />
            <p className="text-sm text-[var(--text-muted)]">กำลังรวบรวมและวิเคราะห์ตัวเลขทางการเงินเจ้า...</p>
          </div>
        ) : error ? (
          <div className="glass-panel p-8 text-center max-w-lg mx-auto flex flex-col items-center gap-4 my-12">
            <AlertCircle className="w-12 h-12 text-red-400" />
            <h3 className="text-lg font-semibold text-red-400">เกิดข้อผิดพลาด</h3>
            <p className="text-sm text-[var(--text-muted)]">{error}</p>
            <button onClick={fetchReport} className="glass-button px-5 py-2.5 rounded-lg text-sm font-medium">
              ลองใหม่อีกครั้ง
            </button>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="flex-grow flex flex-col gap-6"
            >
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <>
                  {/* Financial Metrics Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* 1. Revenue */}
                    <div className="glass-panel p-6 card-glow flex justify-between items-start">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider">รายรับรวมทั้งหมด</span>
                        <span className="text-2xl font-bold text-[var(--text-primary)]">
                          <span className="baht">฿</span>{totals.income.toLocaleString()}
                        </span>
                        <span className="text-[11px] text-[var(--text-muted)] mt-1.5 flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5 text-[var(--accent-souvenir)]" /> 
                          <span className="text-[var(--accent-souvenir)] font-medium">+12.4%</span> จากเดือนก่อน
                        </span>
                      </div>
                      <div className="w-10 h-10 rounded-lg bg-[rgba(197,168,128,0.08)] border border-[var(--glass-border)] flex items-center justify-center">
                        <Wallet className="w-5 h-5 text-[var(--accent-gold)]" />
                      </div>
                    </div>

                    {/* 2. Expenses */}
                    <div className="glass-panel p-6 card-glow flex justify-between items-start">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider">รายจ่ายสะสม</span>
                        <span className="text-2xl font-bold text-[var(--text-primary)]">
                          <span className="baht">฿</span>{totals.expenses.toLocaleString()}
                        </span>
                        <span className="text-[11px] text-[var(--text-muted)] mt-1.5 flex items-center gap-1">
                          <TrendingDown className="w-3.5 h-3.5 text-amber-500" />
                          <span className="text-amber-500 font-medium">+4.8%</span> จากสัปดาห์ก่อน
                        </span>
                      </div>
                      <div className="w-10 h-10 rounded-lg bg-[rgba(231,29,54,0.08)] border border-red-500/15 flex items-center justify-center">
                        <TrendingDown className="w-5 h-5 text-red-400" />
                      </div>
                    </div>

                    {/* 3. Net Profit */}
                    <div className="glass-panel p-6 card-glow flex justify-between items-start">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider">กำไรสุทธิสุงสุด</span>
                        <span className="text-2xl font-bold text-emerald-400">
                          <span className="baht">฿</span>{totals.profit.toLocaleString()}
                        </span>
                        <span className="text-[11px] text-[var(--text-muted)] mt-1.5">
                          อัตรากำไรเฉลี่ย: <span className="font-semibold text-emerald-400">{profitMargin.toFixed(1)}%</span>
                        </span>
                      </div>
                      <div className="w-10 h-10 rounded-lg bg-[rgba(16,185,129,0.08)] border border-emerald-500/15 flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-emerald-400" />
                      </div>
                    </div>

                    {/* 4. Order / Trip Count */}
                    <div className="glass-panel p-6 card-glow flex justify-between items-start">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider">{totals.unitLabel}</span>
                        <span className="text-2xl font-bold text-[var(--text-primary)]">
                          {totals.orderCount.toLocaleString()} {activeProject === 'all' ? 'รายการ' : activeProject === 'souvenir' ? 'ออเดอร์' : 'เที่ยว'}
                        </span>
                        <span className="text-[11px] text-[var(--text-muted)] mt-1.5">
                          {activeProject === 'all' && 'ออเดอร์ของฝาก + เที่ยววิ่งงานรถ'}
                          {activeProject === 'souvenir' && 'ยอดชำระสำเร็จผ่านระบบ'}
                          {activeProject === 'truck' && 'เที่ยวการวิ่งงานส่งของที่เสร็จสิ้น'}
                        </span>
                      </div>
                      <div className="w-10 h-10 rounded-lg bg-[rgba(78,128,152,0.08)] border border-[var(--glass-border)] flex items-center justify-center">
                        {activeProject === 'truck' ? (
                          <Truck className="w-5 h-5 text-[var(--accent-truck)]" />
                        ) : (
                          <ShoppingBag className="w-5 h-5 text-[var(--accent-gold)]" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* SVG Charts section */}
                  <FinancialCharts 
                    souvenirDaily={reportData.souvenir.daily}
                    truckDaily={reportData.truck.daily}
                    souvenirTotals={reportData.souvenir.totals}
                    truckTotals={reportData.truck.totals}
                    centralTotal={reportData.centralExpenses.total}
                    activeProject={activeProject}
                  />

                  {/* Transaction / Logs Table Summary */}
                  <div className="glass-panel p-6">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h3 className="text-lg font-semibold text-[var(--text-primary)]">ข้อมูลธุรกรรมสรุปรายวัน</h3>
                        <p className="text-xs text-[var(--text-muted)]">รายได้และรายจ่ายแจกแจงรายวัน</p>
                      </div>
                      
                      <div className="text-xs text-[var(--text-muted)] bg-[rgba(255,255,255,0.02)] border border-[var(--glass-border)] px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>ล่าสุด 30 วัน</span>
                      </div>
                    </div>

                    <div className="overflow-y-auto max-h-[300px]">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-[var(--glass-border)] text-[var(--text-secondary)] font-semibold uppercase tracking-wider sticky top-0 bg-[var(--bg-secondary)] z-10">
                            <th className="py-3 px-4">วันที่</th>
                            <th className="py-3 px-4">ประเภทธุรกิจ</th>
                            <th className="py-3 px-4 text-right">รายรับ (บาท)</th>
                            <th className="py-3 px-4 text-right">รายจ่าย (บาท)</th>
                            <th className="py-3 px-4 text-right">กำไรสุทธิ (บาท)</th>
                            <th className="py-3 px-4 text-center">ปริมาณงาน</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--glass-border)]">
                          {Array.from({ length: reportData.souvenir.daily.length }).map((_, idx) => {
                            const date = reportData.souvenir.daily[idx].date;
                            const sItem = reportData.souvenir.daily[idx];
                            const tItem = reportData.truck.daily[idx];
                            
                            // Render list rows based on activeProject filter
                            const renderRows = [];
                            if (activeProject === 'all' || activeProject === 'souvenir') {
                              renderRows.push({
                                date,
                                type: 'Patta Shop (ของฝาก)',
                                income: sItem.income,
                                expenses: sItem.expenses,
                                profit: sItem.profit,
                                count: `${sItem.ordersCount} ออเดอร์`,
                                isTruck: false
                              });
                            }
                            if (activeProject === 'all' || activeProject === 'truck') {
                              renderRows.push({
                                date,
                                type: 'Truck Dispatch (รถวิ่งงาน)',
                                income: tItem.income,
                                expenses: tItem.expenses,
                                profit: tItem.profit,
                                count: `${tItem.tripsCount} เที่ยว`,
                                isTruck: true
                              });
                            }

                            return renderRows.map((row, rIdx) => (
                              <tr key={`${idx}-${rIdx}`} className="hover:bg-[rgba(255,255,255,0.01)] transition-all">
                                <td className="py-3 px-4 text-[var(--text-muted)]">
                                  {new Date(row.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </td>
                                <td className="py-3 px-4">
                                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                                    row.isTruck 
                                      ? 'bg-[rgba(78,128,152,0.08)] border-[rgba(78,128,152,0.2)] text-[var(--accent-truck)]' 
                                      : 'bg-[rgba(144,190,109,0.08)] border-[rgba(144,190,109,0.2)] text-[var(--accent-souvenir)]'
                                  }`}>
                                    {row.isTruck ? <Truck className="w-3 h-3" /> : <ShoppingBag className="w-3 h-3" />}
                                    {row.type}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-right text-[var(--text-primary)]"><span className="baht">฿</span>{row.income.toLocaleString()}</td>
                                <td className="py-3 px-4 text-right text-[var(--text-muted)]"><span className="baht">฿</span>{row.expenses.toLocaleString()}</td>
                                <td className={`py-3 px-4 text-right font-semibold ${row.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                  <span className="baht">฿</span>{row.profit.toLocaleString()}
                                </td>
                                <td className="py-3 px-4 text-center text-[var(--text-muted)]">{row.count}</td>
                              </tr>
                            ));
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {/* TAB 2: CENTRAL EXPENSES MANAGEMENT */}
              {activeTab === 'expenses' && (
                <CentralExpenseForm 
                  expenses={reportData.centralExpenses.list}
                  total={reportData.centralExpenses.total}
                  onRefresh={fetchReport}
                />
              )}

              {/* TAB 3: NON NINA AI FINANCIAL CHATBOT */}
              {activeTab === 'ai' && (
                <ChatbotAssistant 
                  financialSummary={reportData}
                />
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}
