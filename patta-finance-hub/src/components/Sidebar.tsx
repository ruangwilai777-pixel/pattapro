'use client';

import React from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  MessageSquareCode, 
  Database, 
  Sparkles,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  Truck,
  Store
} from 'lucide-react';

interface SidebarProps {
  activeTab: 'overview' | 'expenses' | 'ai';
  setActiveTab: (tab: 'overview' | 'expenses' | 'ai') => void;
  activeProject: 'all' | 'souvenir' | 'truck';
  setActiveProject: (proj: 'all' | 'souvenir' | 'truck') => void;
  forceMock: boolean;
  setForceMock: (mock: boolean) => void;
  isSouvenirMocked: boolean;
  isTruckMocked: boolean;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  activeProject,
  setActiveProject,
  forceMock,
  setForceMock,
  isSouvenirMocked,
  isTruckMocked
}: SidebarProps) {
  return (
    <aside className="w-80 glass-panel h-[calc(100vh-2rem)] flex flex-col p-6 sticky top-4">
      {/* Title & Brand */}
      <div className="flex flex-col mb-8">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-6 h-6 text-[var(--accent-gold)]" />
          <span className="text-xs uppercase tracking-[0.25em] text-[var(--text-muted)] font-semibold">Financial Hub</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight gold-shimmer">
          PATTA GROUP
        </h1>
      </div>

      {/* Main Navigation */}
      <div className="flex flex-col gap-2 flex-1">
        <div className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2 font-semibold">
          เมนูการใช้งาน
        </div>
        
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
            activeTab === 'overview'
              ? 'background-image: linear-gradient(135deg, rgba(197, 168, 128, 0.15) 0%, rgba(197, 168, 128, 0.05) 100%); border: 1px solid rgba(197, 168, 128, 0.3); text-[var(--accent-gold)] font-medium'
              : 'text-[var(--text-primary)] hover:bg-[rgba(197, 168, 128, 0.05)] hover:text-[var(--accent-gold)] border border-transparent'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>แดชบอร์ดภาพรวม</span>
        </button>

        <button
          onClick={() => setActiveTab('expenses')}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
            activeTab === 'expenses'
              ? 'background-image: linear-gradient(135deg, rgba(197, 168, 128, 0.15) 0%, rgba(197, 168, 128, 0.05) 100%); border: 1px solid rgba(197, 168, 128, 0.3); text-[var(--accent-gold)] font-medium'
              : 'text-[var(--text-primary)] hover:bg-[rgba(197, 168, 128, 0.05)] hover:text-[var(--accent-gold)] border border-transparent'
          }`}
        >
          <Receipt className="w-5 h-5" />
          <span>รายจ่ายส่วนกลาง</span>
        </button>

        <button
          onClick={() => setActiveTab('ai')}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all relative overflow-hidden group ${
            activeTab === 'ai'
              ? 'background-image: linear-gradient(135deg, rgba(197, 168, 128, 0.15) 0%, rgba(197, 168, 128, 0.05) 100%); border: 1px solid rgba(197, 168, 128, 0.3); text-[var(--accent-gold)] font-medium'
              : 'text-[var(--text-primary)] hover:bg-[rgba(197, 168, 128, 0.05)] hover:text-[var(--accent-gold)] border border-transparent'
          }`}
        >
          <MessageSquareCode className="w-5 h-5 text-[var(--accent-gold)]" />
          <span>ถามน้องนินา AI</span>
          <span className="absolute right-3 top-3.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent-gold)] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent-gold)]"></span>
          </span>
        </button>

        {/* Project Selector - only active for Overview */}
        {activeTab === 'overview' && (
          <div className="mt-8 flex flex-col gap-2">
            <div className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2 font-semibold">
              ตัวกรองธุรกิจ
            </div>
            
            <button
              onClick={() => setActiveProject('all')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-left transition-all ${
                activeProject === 'all'
                  ? 'bg-[rgba(197, 168, 128, 0.1)] text-[var(--text-primary)] border-l-4 border-[var(--accent-gold)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.02)]'
              }`}
            >
              <Sparkles className="w-4 h-4 text-[var(--accent-gold)]" />
              <span>ทุกธุรกิจรวมกัน</span>
            </button>

            <button
              onClick={() => setActiveProject('souvenir')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-left transition-all ${
                activeProject === 'souvenir'
                  ? 'bg-[rgba(144,190,109,0.08)] text-[var(--text-primary)] border-l-4 border-[var(--accent-souvenir)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.02)]'
              }`}
            >
              <Store className="w-4 h-4 text-[var(--accent-souvenir)]" />
              <span>ร้านของฝาก (Patta Shop)</span>
            </button>

            <button
              onClick={() => setActiveProject('truck')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-left transition-all ${
                activeProject === 'truck'
                  ? 'bg-[rgba(78,128,152,0.08)] text-[var(--text-primary)] border-l-4 border-[var(--accent-truck)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.02)]'
              }`}
            >
              <Truck className="w-4 h-4 text-[var(--accent-truck)]" />
              <span>ธุรกิจรถวิ่งงาน (Truck)</span>
            </button>
          </div>
        )}
      </div>

      {/* Footer Info & Connection status */}
      <div className="flex flex-col gap-4 border-t border-[var(--glass-border)] pt-4">
        {/* Mock/Demo Toggle */}
        <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
          <span className="font-medium">โหมดจำลองข้อมูล (Demo)</span>
          <button 
            onClick={() => setForceMock(!forceMock)}
            className="text-[var(--accent-gold)] transition-colors hover:text-[var(--accent-gold-hover)]"
            title="กดเพื่อเปิด/ปิดระบบจำลองข้อมูลเพื่อตรวจสอบ"
          >
            {forceMock ? (
              <ToggleRight className="w-8 h-8 text-[var(--accent-gold)]" />
            ) : (
              <ToggleLeft className="w-8 h-8 text-[var(--text-muted)]" />
            )}
          </button>
        </div>

        {/* Database Status Indicators */}
        <div className="flex flex-col gap-2 bg-[rgba(0,0,0,0.2)] p-3 rounded-lg border border-[var(--glass-border)]">
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
              <Database className="w-3.5 h-3.5 text-[var(--accent-souvenir)]" /> DB ร้านของฝาก:
            </span>
            <span className={`font-semibold flex items-center gap-1 ${isSouvenirMocked ? 'text-amber-500' : 'text-emerald-500'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isSouvenirMocked ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 animate-pulse'}`}></span>
              {isSouvenirMocked ? 'จำลอง' : 'เชื่อมต่อแล้ว'}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
              <Database className="w-3.5 h-3.5 text-[var(--accent-truck)]" /> DB รถวิ่งงาน:
            </span>
            <span className={`font-semibold flex items-center gap-1 ${isTruckMocked ? 'text-amber-500' : 'text-emerald-500'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isTruckMocked ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 animate-pulse'}`}></span>
              {isTruckMocked ? 'จำลอง' : 'เชื่อมต่อแล้ว'}
            </span>
          </div>
        </div>

        <div className="text-center text-[10px] text-[var(--text-muted)]">
          &copy; 2026 Patta Group. All rights reserved.
        </div>
      </div>
    </aside>
  );
}
