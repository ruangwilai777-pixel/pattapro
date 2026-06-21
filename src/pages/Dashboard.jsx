import React, { useState, useRef, useMemo } from 'react';
import { useTrips } from '../hooks/useTrips';

import MonthlyTable from '../components/MonthlyTable';
import TripTable from '../components/TripTable';
import TripEditModal from '../components/TripEditModal';
import SystemOverview from '../components/SystemOverview';
import FleetDashboard from '../components/FleetDashboard';
import BillingSummary from '../components/BillingSummary';
import DriverTripLog from '../components/DriverTripLog';
import DataHub from '../components/DataHub';
import Settings from '../components/Settings';
import DriverEntry from './DriverEntry';
import { logoBase64 } from '../assets/logoBase64';

import {
    LayoutDashboard, TableProperties, Users, Settings as SettingsIcon, Plus,
    ChevronLeft, ChevronRight, Download
} from 'lucide-react';

/* ──────────────────────────────────────────────
   Tab definitions
────────────────────────────────────────────── */
const TABS = [
    { id: 'overview', label: 'ภาพรวมระบบ',   icon: LayoutDashboard },
    { id: 'table',    label: 'ตารางงาน',       icon: TableProperties },
    { id: 'driver',   label: 'ลงงานคนขับ (+)', icon: Plus },
    { id: 'summary',  label: 'สรุปยอดคนขับ',  icon: Users },
    { id: 'settings', label: 'การตั้งค่า',     icon: SettingsIcon },
];

const months = [
    'มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
    'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'
];

const Dashboard = () => {
    const {
        trips, addTrip, deleteTrip, updateTrip, stats, yearlyStats,
        currentMonth, setCurrentMonth,
        currentYear, setCurrentYear,
        routePresets, cnDeductions, setCnDeductions,
        saveRoutePreset, deletePreset, fetchPresets, fetchTrips,
        isSupabaseReady, currentMonthTripsEnriched, uploadFile,
        bulkUpdateRoutePrice,
        basketTiers, saveBasketTier, deleteBasketTier, checkAndCleanupOldImages
    } = useTrips();

    React.useEffect(() => {
        document.title = 'ตารางค่าเที่ยว (Admin)';
        const link = document.querySelector("link[rel*='manifest']") || document.createElement('link');
        link.type = 'application/manifest+json';
        link.rel = 'manifest';
        link.href = '/admin.webmanifest?v=2.2';
        document.getElementsByTagName('head')[0].appendChild(link);
    }, []);

    const [activeTab,    setActiveTab]    = useState('overview');
    const [editingTrip,  setEditingTrip]  = useState(null);
    const [isModalOpen,  setIsModalOpen]  = useState(false);
    const [formDate,     setFormDate]     = useState(null);
    const [viewType,     setViewType]     = useState('monthly');
    const formRef = useRef(null);

    /* ── handlers ── */
    const handleMonthChange = (dir) => {
        let m = currentMonth + dir, y = currentYear;
        if (m < 0)  { m = 11; y -= 1; }
        if (m > 11) { m = 0;  y += 1; }
        setCurrentMonth(m);
        setCurrentYear(y);
    };

    const handleEditTrip   = (trip) => { setEditingTrip(trip); setIsModalOpen(true); };
    const handleUpdateTrip = async (id, data) => { await updateTrip(id, data); setEditingTrip(null); setIsModalOpen(false); };
    const handleAddTrip    = async (data) => { await addTrip(data); setIsModalOpen(false); };
    const handleSelectDate = (date) => {
        setFormDate({ value: date, ts: Date.now() });
        setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    };

    const handleExport = () => {
        const headers = ['วันที่','คนขับ','สายงาน','ค่าเที่ยว','น้ำมัน','ค่าจ้าง','ค่าซ่อม','จำนวนตะกร้า','ค่าตะกร้า','ส่วนแบ่งตะกร้า','ยอดเบิก','กำไร'];
        const csv = [
            headers.join(','),
            ...currentMonthTripsEnriched.map(t =>
                [t.date,`"${t.driverName}"`,`"${t.route}"`,t.price,t.fuel,t.wage,t.maintenance,t.basketCount,t.basket,t.basketShare,t.staffShare,t.profit].join(',')
            )
        ].join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href = url;
        a.download = `fleet_data_${currentMonth + 1}_${currentYear}.csv`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
    };

    /* ── driver summary (used in 'summary' tab) ── */
    const driverSummary = useMemo(() => {
        const map = {};
        currentMonthTripsEnriched.forEach(t => {
            let name = (t.driverName || t.driver_name || 'ไม่ระบุชื่อ').trim().replace(/\s+/g, ' ');
            if (name.includes('ภัทธา')) name = 'นางสาว ภัทธา เรืองวิลัย';
            if (!map[name]) map[name] = [];
            map[name].push(t);
        });
        return Object.entries(map);
    }, [currentMonthTripsEnriched]);

    return (
        <FleetDashboard
            stats={stats}
            yearlyStats={yearlyStats}
            isSupabaseReady={isSupabaseReady}
            trips={trips}
            currentMonth={currentMonth}
            currentYear={currentYear}
            viewType={viewType}
            setViewType={setViewType}
            isMaximized={false}
            hideStats={true}
        >
            {/* ══════════════════════════════════════
                HEADER
            ══════════════════════════════════════ */}
            <div className="header-flex-premium" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                {/* Left: logo + title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', flexWrap: 'wrap' }}>
                    <img src={logoBase64} alt="Patta Logo" style={{ height: '80px', borderRadius: '14px', boxShadow: '0 12px 32px rgba(0,0,0,0.6)', border: '2px solid var(--glass-border)' }} />
                    <div>
                        <h1 className="brand-logo" style={{ fontSize: '1.5rem', margin: 0, lineHeight: 1.2, fontWeight: 900 }}>ภัทธา ทรานสปอร์ต</h1>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', letterSpacing: '3px', fontWeight: 800 }}>PATTA TRANSPORT</span>
                    </div>
                    {/* Online pill */}
                    <div className={`status-pill ${isSupabaseReady ? 'online' : 'offline'}`} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700 }}>
                        <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: isSupabaseReady ? '#2dd4bf' : '#f43f5e', boxShadow: isSupabaseReady ? '0 0 8px #2dd4bf' : 'none' }} />
                        <span style={{ color: isSupabaseReady ? '#2dd4bf' : '#f43f5e' }}>{isSupabaseReady ? `ออนไลน์ (${trips.length})` : 'ออฟไลน์'}</span>
                    </div>
                </div>

                {/* Right: Add button */}
                <button
                    className="btn-primary-premium"
                    onClick={() => { setEditingTrip(null); setIsModalOpen(true); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 22px', borderRadius: '12px', fontSize: '14px', fontWeight: 700, boxShadow: '0 4px 12px rgba(99,102,241,0.4)' }}
                >
                    <Plus size={18} /> เพิ่มรายการ
                </button>
            </div>

            {/* ══════════════════════════════════════
                TAB NAV
            ══════════════════════════════════════ */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '1.75rem', background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '6px' }}>
                {TABS.map(({ id, label, icon: Icon }) => {
                    const active = activeTab === id;
                    return (
                        <button
                            key={id}
                            onClick={() => setActiveTab(id)}
                            style={{
                                flex: 1,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                                padding: '0.55rem 1rem',
                                border: 'none',
                                borderRadius: '11px',
                                cursor: 'pointer',
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                transition: 'all 0.25s cubic-bezier(0.23,1,0.32,1)',
                                background: active
                                    ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                                    : 'transparent',
                                color: active ? 'white' : '#64748b',
                                boxShadow: active ? '0 4px 14px rgba(99,102,241,0.35)' : 'none',
                            }}
                        >
                            <Icon size={15} />
                            <span>{label}</span>
                        </button>
                    );
                })}
            </div>

            {/* ══════════════════════════════════════
                TAB: ภาพรวมระบบ
            ══════════════════════════════════════ */}
            {activeTab === 'overview' && (
                <SystemOverview
                    trips={currentMonthTripsEnriched}
                    stats={stats}
                    currentMonth={currentMonth}
                    currentYear={currentYear}
                    onMonthChange={handleMonthChange}
                    cnDeductions={cnDeductions}
                />
            )}

            {/* ══════════════════════════════════════
                TAB: ตารางงาน
            ══════════════════════════════════════ */}
            {activeTab === 'table' && (
                <DataHub
                    currentMonth={currentMonth}
                    currentYear={currentYear}
                    trips={currentMonthTripsEnriched}
                    onMonthChange={handleMonthChange}
                    onExport={handleExport}
                    onSelectDate={handleSelectDate}
                    onEditTrip={handleEditTrip}
                    onDeleteTrip={deleteTrip}
                    cnDeductions={cnDeductions}
                    setCnDeductions={setCnDeductions}
                    onBulkUpdateRoutePrice={bulkUpdateRoutePrice}
                    routePresets={routePresets}
                    stats={stats}
                />
            )}

            {/* ══════════════════════════════════════
                TAB: ลงงานคนขับ (ปุ่มบวก)
            ══════════════════════════════════════ */}
            {activeTab === 'driver' && (
                <div className="fade-in" style={{ background: 'transparent' }}>
                    <DriverEntry />
                </div>
            )}

            {/* ══════════════════════════════════════
                TAB: สรุปยอดคนขับ
            ══════════════════════════════════════ */}
            {activeTab === 'summary' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                    {/* Month nav */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '4px' }}>
                            <button onClick={() => handleMonthChange(-1)} style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', borderRadius: '8px', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <ChevronLeft size={16} />
                            </button>
                            <span style={{ minWidth: '140px', textAlign: 'center', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>
                                {months[currentMonth]} {currentYear}
                            </span>
                            <button onClick={() => handleMonthChange(1)} style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', borderRadius: '8px', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <ChevronRight size={16} />
                            </button>
                        </div>
                        <button onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 16px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'var(--bg-card)', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700 }}>
                            <Download size={14} /> Export CSV
                        </button>
                    </div>

                    {driverSummary.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#475569', padding: '4rem', fontSize: '0.85rem' }}>ไม่มีข้อมูลในรอบบิลนี้</div>
                    ) : driverSummary.map(([driverName, driverTrips]) => (
                        <div key={driverName} style={{ display: 'flex', flexDirection: 'column', gap: '2rem', borderTop: '2px dashed #6366f1', paddingTop: '2rem' }}>
                            <h2 style={{ fontSize: '1.35rem', color: '#6366f1', fontWeight: 900, textAlign: 'center', letterSpacing: '0.5px' }}>
                                📊 รายละเอียดงานและสรุปยอด: {driverName}
                            </h2>

                            <DriverTripLog
                                trips={driverTrips}
                                currentMonth={currentMonth}
                                currentYear={currentYear}
                                driverName={driverName}
                                isDriverCopy={true}
                            />

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <h3 style={{ fontSize: '1rem', color: '#000', fontWeight: 800, margin: '1rem 0' }}>🧾 ใบวางบิลสำหรับสำนักงาน (แยกรายวัน)</h3>
                                </div>
                                <BillingSummary
                                    trips={driverTrips}
                                    currentMonth={currentMonth}
                                    currentYear={currentYear}
                                    driverName="นางสาว ภัทธา เรืองวิลัย"
                                    address="เลขที่ 246 หมู่ 6 ต.เวียงตาล อ.ห้างฉัตร ลำปาง 52190"
                                    isDriverCopy={false}
                                    cnDeduction={cnDeductions['นางสาว ภัทธา เรืองวิลัย'] || 0}
                                />
                                <div style={{ textAlign: 'center' }}>
                                    <h3 style={{ fontSize: '1rem', color: '#000', fontWeight: 800, margin: '1.5rem 0 1rem' }}>🧾 ใบแจ้งยอดสำหรับคนขับ (สรุปตามเส้นทาง)</h3>
                                </div>
                                <BillingSummary
                                    trips={driverTrips}
                                    currentMonth={currentMonth}
                                    currentYear={currentYear}
                                    driverName={driverName}
                                    address={driverName.includes('สมชาย') ? '279 ม.7 ต.ป่าสัก อ.เมือง ลำพูน 51000' : 'เลขที่ 246 หมู่ 6 ต.เวียงตาล อ.ห้างฉัตร ลำปาง 52190'}
                                    isDriverCopy={true}
                                    cnDeduction={cnDeductions[driverName] || 0}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ══════════════════════════════════════
                TAB: การตั้งค่า
            ══════════════════════════════════════ */}
            {activeTab === 'settings' && (
                <Settings
                    routePresets={routePresets}
                    saveRoutePreset={saveRoutePreset}
                    deletePreset={deletePreset}
                    fetchPresets={fetchPresets}
                    currentMonth={currentMonth}
                    currentYear={currentYear}
                    basketTiers={basketTiers}
                    saveBasketTier={saveBasketTier}
                    deleteBasketTier={deleteBasketTier}
                    checkAndCleanupOldImages={checkAndCleanupOldImages}
                    trips={trips}
                />
            )}

            {/* ══════════════════════════════════════
                MODAL
            ══════════════════════════════════════ */}
            <TripEditModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingTrip(null); }}
                onAdd={handleAddTrip}
                onUpdate={handleUpdateTrip}
                uploadFile={uploadFile}
                routePresets={routePresets}
                fetchPresets={fetchPresets}
                externalDate={formDate}
                onDateChange={(val) => setFormDate({ value: val, ts: Date.now() })}
                editingTrip={editingTrip}
            />

            {/* ══════════════════════════════════════
                FAB
            ══════════════════════════════════════ */}
            <button
                onClick={() => { setEditingTrip(null); setIsModalOpen(true); }}
                style={{
                    position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 500,
                    width: '56px', height: '56px', borderRadius: '50%', border: 'none',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    color: 'var(--text-main)', cursor: 'pointer', fontSize: '1.6rem', fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 8px 24px rgba(99,102,241,0.5)',
                    transition: 'all 0.3s cubic-bezier(0.23,1,0.32,1)',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.12)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(99,102,241,0.7)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)';    e.currentTarget.style.boxShadow = '0 8px 24px rgba(99,102,241,0.5)'; }}
                title="เพิ่มรายการใหม่"
            >
                <Plus size={26} />
            </button>

            {/* ══════════════════════════════════════
                STYLES
            ══════════════════════════════════════ */}
            <style dangerouslySetInnerHTML={{ __html: `
                .admin-main-grid { display: flex; gap: 1.25rem; align-items: flex-start; }
                .admin-table-col {
                    flex: 1; min-width: 0;
                    background: var(--glass-bg); border-radius: 2rem;
                    border: 1px solid var(--glass-border); backdrop-filter: blur(20px);
                    padding: 1.25rem; box-shadow: 0 20px 50px -10px rgba(0,0,0,0.5), inset 0 1px 1px var(--glass-border);
                    height: auto; display: flex; flex-direction: column; transition: all 0.6s cubic-bezier(0.23,1,0.32,1);
                }
                @media (max-width: 1200px) {
                    html, body, #root { height: auto !important; overflow: auto !important; }
                    .admin-main-grid { flex-direction: column !important; height: auto !important; }
                }
            `}} />
        </FleetDashboard>
    );
};

export default Dashboard;