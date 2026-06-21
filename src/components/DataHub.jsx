import React, { useState, useMemo, useEffect } from 'react';
import {
    TableProperties, TrendingUp, Calendar, ChevronLeft, ChevronRight,
    Download, Plus, BarChart2, Users, Truck, Fuel, Wrench,
    ArrowUpRight, ArrowDownRight, Award, Activity, X, Edit2, Trash2
} from 'lucide-react';

const months = [
    'มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
    'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'
];
const fmt = (n) => Math.round(n).toLocaleString('th-TH');

/* ── KPI card ── */
const KpiCard = ({ icon: Icon, label, value, color, sub }) => (
    <div className="glass-card kpi-card-hover" style={{
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        borderRadius: '20px',
        padding: '1.25rem',
        display: 'flex', flexDirection: 'column', gap: '0.4rem',
        position: 'relative', overflow: 'hidden',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
        transition: 'all 0.3s cubic-bezier(0.23, 1, 0.32, 1)'
    }}>
        <div style={{ position: 'absolute', top: -16, right: -16, width: 64, height: 64, borderRadius: '50%', background: `${color}0d` }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</span>
            <div style={{ width: 34, height: 34, borderRadius: 12, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={16} color={color} />
            </div>
        </div>
        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>{value}</div>
        {sub && <div style={{ fontSize: '0.7rem', color: color, fontWeight: 700 }}>{sub}</div>}
    </div>
);

const DataHub = ({
    currentMonth, currentYear, trips, onMonthChange, onExport,
    onSelectDate, onEditTrip, onDeleteTrip, cnDeductions, setCnDeductions,
    onBulkUpdateRoutePrice, routePresets, stats = {}
}) => {
    /* ── Bulk Update Modal State ── */
    const [isBulkOpen, setIsBulkOpen] = useState(false);
    const [bulkMonth, setBulkMonth] = useState(currentMonth);
    const [bulkYear, setBulkYear] = useState(currentYear);
    const [bulkRoute, setBulkRoute] = useState('');
    const [bulkPrice, setBulkPrice] = useState('');
    const [isBulkLoading, setIsBulkLoading] = useState(false);

    useEffect(() => {
        setBulkMonth(currentMonth);
        setBulkYear(currentYear);
    }, [currentMonth, currentYear]);

    /* ── Chronological Trips Sorting & Row Consolidation (Merged by Date + Driver) ── */
    const sortedTrips = useMemo(() => {
        const groups = {};
        trips.forEach(t => {
            const dateStr = t.date || '';
            let driver = (t.driverName || t.driver_name || 'ไม่ระบุชื่อ').trim().replace(/\s+/g, ' ');
            if (driver.includes('ภัทธา')) {
                driver = 'นางสาว ภัทธา เรืองวิลัย';
            }
            const key = `${dateStr}_${driver}`;
            if (!groups[key]) {
                groups[key] = {
                    id: t.id,
                    ids: [t.id],
                    date: dateStr,
                    driverName: driver,
                    routes: [],
                    price: 0,
                    fuel: 0,
                    wage: 0,
                    maintenance: 0,
                    advance: 0,
                    basket: 0,
                    basketCount: 0,
                    basketShare: 0,
                    staffShare: 0,
                    profit: 0,
                    fuel_bill_urls: [],
                    maintenance_bill_urls: [],
                    basket_bill_urls: [],
                    originalTrips: [t]
                };
            } else {
                groups[key].ids.push(t.id);
                groups[key].originalTrips.push(t);
            }

            const g = groups[key];
            if (t.route && t.route.trim()) {
                g.routes.push(t.route.trim());
            }
            g.price += (t.price || 0);
            g.fuel += (t.fuel || 0);
            g.wage += (t.wage || 0);
            g.maintenance += (t.maintenance || 0);
            g.advance += (t.advance || t.staffShare || 0);
            g.basket += (t.basket || 0);
            g.basketCount += (t.basketCount || 0);
            g.basketShare += (t.basketShare || 0);
            g.staffShare += (t.staffShare || 0);

            const fuelUrl = t.fuel_bill_url || t.fuel_url || t.fuelUrl;
            if (fuelUrl) g.fuel_bill_urls.push(fuelUrl);
            
            const maintUrl = t.maintenance_bill_url || t.maintenance_url || t.maintenanceUrl;
            if (maintUrl) g.maintenance_bill_urls.push(maintUrl);

            const basketUrl = t.basket_bill_url || t.basket_url || t.basketUrl;
            if (basketUrl) g.basket_bill_urls.push(basketUrl);
        });

        const merged = Object.values(groups).map(g => {
            const uniqueRoutes = Array.from(new Set(g.routes)).filter(Boolean);
            g.route = uniqueRoutes.length > 0 ? uniqueRoutes.join(', ') : '-';
            g.profit = (g.price + g.basket) - (g.fuel + g.wage + g.basketShare);
            g.fuel_bill_url = g.fuel_bill_urls[0] || null;
            g.maintenance_bill_url = g.maintenance_bill_urls[0] || null;
            g.basket_bill_url = g.basket_bill_urls[0] || null;
            return g;
        });

        return merged.sort((a, b) => new Date(a.date) - new Date(b.date));
    }, [trips]);

    /* ── Route Performance stats ── */
    const routeStats = useMemo(() => {
        const map = {};
        trips.forEach(t => {
            const r = (t.route||'ไม่ระบุ').trim();
            if (!map[r]) map[r] = { route: r, trips: 0, revenue: 0, profit: 0 };
            map[r].trips++;
            map[r].revenue += (t.price||0) + (t.basket||0);
            map[r].profit  += (t.profit||0);
        });
        return Object.values(map).sort((a,b) => b.trips - a.trips);
    }, [trips]);

    /* ── Available Routes for Quick Select ── */
    const allAvailableRoutes = useMemo(() => {
        const presets = routePresets ? Object.keys(routePresets) : [];
        const tripRoutes = trips ? Array.from(new Set(trips.map(t => t.route).filter(Boolean))) : [];
        const combined = Array.from(new Set([...presets, ...tripRoutes])).sort();
        return combined.map(route => {
            const price = routePresets?.[route]?.price || '';
            return { route, price };
        });
    }, [routePresets, trips]);

    const { 
        totalRevenue=0, totalProfit=0, totalTrips=0, totalFuel=0, 
        totalWage=0, totalMaintenance=0, totalBasketShare=0, 
        totalStaffAdvance=0, totalBasket=0, totalPrice=0 
    } = stats;

    const handleBulkSubmit = async (e) => {
        e.preventDefault();
        if (!bulkRoute.trim()) {
            alert('กรุณากรอกสายรถ');
            return;
        }
        if (!bulkPrice || parseFloat(bulkPrice) <= 0) {
            alert('กรุณากรอกจำนวนเงินให้ถูกต้อง');
            return;
        }
        
        const confirmMsg = `คุณแน่ใจหรือไม่ว่าต้องการอัปเดต/เพิ่มค่าเที่ยวของสายรถ "${bulkRoute.trim()}" ในรอบเดือน ${months[bulkMonth]} ${bulkYear} เป็นจำนวนเงิน ฿${parseFloat(bulkPrice).toLocaleString()} สำหรับทุกวันในเดือนนี้ทั้งหมดพร้อมกัน?`;
        if (!window.confirm(confirmMsg)) return;

        setIsBulkLoading(true);
        try {
            if (onBulkUpdateRoutePrice) {
                const res = await onBulkUpdateRoutePrice(bulkMonth, bulkYear, bulkRoute.trim(), parseFloat(bulkPrice));
                if (res.success) {
                    alert('🎉 บันทึกรวบยอดข้อมูลค่าเที่ยวทุกวันเรียบร้อยแล้วครับ!');
                    setIsBulkOpen(false);
                    setBulkRoute('');
                    setBulkPrice('');
                } else {
                    alert(`❌ เกิดข้อผิดพลาด: ${res.error || 'ไม่สามารถอัปเดตข้อมูลได้'}`);
                }
            } else {
                alert('ฟังก์ชัน Bulk Update ไม่พร้อมใช้งาน');
            }
        } catch (err) {
            alert(`เกิดข้อผิดพลาด: ${err.message || err}`);
        } finally {
            setIsBulkLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

            {/* ════════════════════════════════════════
                TOP BAR: CONTROLS & NAVIGATOR
            ════════════════════════════════════════ */}
            <div style={{ display: 'flex', alignItems: 'center', justifySelf: 'stretch', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', background: 'var(--bg-card)', padding: '0.85rem 1.25rem', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', background: 'var(--glass-border)', border: '1px solid var(--glass-border)', borderRadius: 12, padding: 3 }}>
                        <button onClick={() => onMonthChange(-1)} style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ChevronLeft size={16} />
                        </button>
                        <span style={{ minWidth: 130, textAlign: 'center', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                            {months[currentMonth]} {currentYear}
                        </span>
                        <button onClick={() => onMonthChange(1)} style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ChevronRight size={16} />
                        </button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: '#10b981', fontWeight: 800 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
                        รอบบิล 20 {months[(currentMonth-1+12)%12]} – 19 {months[currentMonth]}
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {/* Bulk Update Trigger */}
                    <button 
                        onClick={() => setIsBulkOpen(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'var(--text-main)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 800, boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}
                    >
                        <Plus size={15} /> ป้อนด่วนรายเดือน (Bulk)
                    </button>
                    {/* CSV Export */}
                    <button 
                        onClick={onExport} 
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: '1px solid var(--glass-border)', background: 'var(--glass-border)', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 800 }}
                    >
                        <Download size={14} /> Export CSV
                    </button>
                </div>
            </div>

            {/* ════════════════════════════════════════
                SECTION 2: สรุปงานแยกตามสายรถ (ROUTE SUMMARY)
            ════════════════════════════════════════ */}
            <div className="glass-card" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 20, padding: '1.25rem', backdropFilter: 'blur(10px)' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Truck size={16} color="#a78bfa" /> 🚚 สถิติวิเคราะห์ประสิทธิภาพแยกรายเส้นทาง (Route Performance)
                </h3>
                {routeStats.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#475569', padding: '1.5rem', fontSize: '0.8rem' }}>ไม่มีข้อมูลสายงานในรอบนี้</div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                    {['#','สายงาน','จำนวนเที่ยววิ่ง','รายได้รวม','กำไรสุทธิรวม'].map(h => (
                                        <th key={h} style={{ padding: '0.5rem 0.75rem', textAlign: h==='สายงาน'||h==='#'?'left':'right', color: '#64748b', fontWeight: 700, fontSize: '0.7rem', whiteSpace: 'nowrap' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {routeStats.map((r, i) => {
                                    const barPct = routeStats[0].trips > 0 ? (r.trips / routeStats[0].trips) * 100 : 0;
                                    const isPos = r.profit >= 0;
                                    return (
                                        <tr key={r.route} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                            <td style={{ padding: '0.6rem 0.75rem', color: '#475569', fontWeight: 700, width: 32 }}>#{i+1}</td>
                                            <td style={{ padding: '0.6rem 0.75rem' }}>
                                                <div style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>{r.route}</div>
                                                <div style={{ height: 3, borderRadius: 3, background: 'var(--glass-border)', overflow: 'hidden', width: '120px' }}>
                                                    <div style={{ height: '100%', width: `${barPct}%`, borderRadius: 3, background: 'linear-gradient(90deg, #a78bfa, #8b5cf6)' }} />
                                                </div>
                                            </td>
                                            <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right', color: '#a78bfa', fontWeight: 700 }}>{r.trips} เที่ยว</td>
                                            <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right', color: '#38bdf8', fontWeight: 700 }}>฿{fmt(r.revenue)}</td>
                                            <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right', color: isPos?'#22c55e':'#f43f5e', fontWeight: 800 }}>฿{fmt(r.profit)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ════════════════════════════════════════
                SECTION 3: ตารางวิ่งงานทั้งหมด (ALL TRIPS FLAT TABLE)
            ════════════════════════════════════════ */}
            <div className="glass-card" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 20, padding: '1.25rem', backdropFilter: 'blur(10px)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <TableProperties size={18} color="#6366f1" /> 📋 ตารางรายการวิ่งงานทั้งหมดในเดือนนี้
                        </h3>
                        <p style={{ fontSize: '0.7rem', color: '#64748b', margin: '2px 0 0 0', fontWeight: 600 }}>แสดงข้อมูลแบบเรียงลำดับรายเที่ยว ไม่มีการรวบยอดการ์ดรายวัน</p>
                    </div>
                    <span style={{ fontSize: '0.72rem', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', padding: '4px 12px', borderRadius: '12px', fontWeight: 800, border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                        ทั้งหมด {sortedTrips.length} รายการ
                    </span>
                </div>

                <div className="table-container" style={{ overflowX: 'auto', width: '100%' }}>
                    <table className="premium-data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'center' }}>
                        <thead>
                            <tr style={{ background: 'var(--bg-card)', borderBottom: '2px solid var(--glass-border)', color: 'var(--text-dim)' }}>
                                <th style={{ padding: '12px 10px', textAlign: 'left', fontWeight: '800' }}>วันที่</th>
                                <th style={{ padding: '12px 10px', textAlign: 'left', fontWeight: '800' }}>คนขับ</th>
                                <th style={{ padding: '12px 10px', textAlign: 'left', fontWeight: '800' }}>สายงาน</th>
                                <th style={{ padding: '12px 10px', fontWeight: '800', textAlign: 'right' }}>ค่าเที่ยว (+)</th>
                                <th style={{ padding: '12px 10px', fontWeight: '800', textAlign: 'right' }}>น้ำมัน (-)</th>
                                <th style={{ padding: '12px 10px', fontWeight: '800', textAlign: 'right' }}>ค่าจ้าง (-)</th>
                                <th style={{ padding: '12px 10px', fontWeight: '800', textAlign: 'right' }}>ค่าซ่อม (-)</th>
                                <th style={{ padding: '12px 10px', fontWeight: '800', textAlign: 'right' }}>เบิกเงิน (-)</th>
                                <th style={{ padding: '12px 10px', fontWeight: '800', textAlign: 'right' }}>รายได้ตะกร้า (+)</th>
                                <th style={{ padding: '12px 10px', fontWeight: '800', textAlign: 'right' }}>ส่วนแบ่งตะกร้า (-)</th>
                                <th style={{ padding: '12px 10px', fontWeight: '800', textAlign: 'right' }}>ยอดลูกน้อง (-)</th>
                                <th style={{ padding: '12px 10px', fontWeight: '800', textAlign: 'right' }}>กำไรสุทธิ</th>
                                <th style={{ padding: '12px 10px', fontWeight: '800' }}>จัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedTrips.length === 0 ? (
                                <tr>
                                    <td colSpan="13" style={{ textAlign: 'center', padding: '3.5rem', color: '#64748b', fontWeight: 600 }}>
                                        ยังไม่มีข้อมูลการวิ่งงานในรอบเดือนนี้...
                                    </td>
                                </tr>
                            ) : (
                                sortedTrips.map((trip) => {
                                    const fuelReceipt = trip.fuel_bill_url || trip.fuel_url;
                                    const maintReceipt = trip.maintenance_bill_url || trip.maintenance_url;
                                    const basketReceipt = trip.basket_bill_url || trip.basket_url;
                                    return (
                                        <tr key={trip.id} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s' }} className="table-row-hover-dark">
                                            <td style={{ padding: '12px 10px', textAlign: 'left', color: '#e2e8f0', fontWeight: 700, whiteSpace: 'nowrap' }}>
                                                {new Date(trip.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                                            </td>
                                            <td style={{ padding: '12px 10px', textAlign: 'left', color: 'var(--text-main)', fontWeight: 700 }}>
                                                {trip.driverName || trip.driver_name || '-'}
                                            </td>
                                            <td style={{ padding: '12px 10px', textAlign: 'left', color: '#818cf8', fontWeight: 800 }}>
                                                {trip.route}
                                            </td>
                                            <td style={{ padding: '12px 10px', fontWeight: 700, textAlign: 'right', color: 'var(--text-main)' }}>
                                                ฿{fmt(trip.price || 0)}
                                            </td>
                                            <td style={{ padding: '12px 10px', textAlign: 'right', color: '#f87171' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                                                    <span>฿{fmt(trip.fuel || 0)}</span>
                                                    {fuelReceipt && (
                                                        <a href={fuelReceipt} target="_blank" rel="noreferrer" className="receipt-preview-trigger">
                                                            <img src={fuelReceipt} alt="น้ำมัน" style={{ width: 22, height: 22, borderRadius: 4, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.2)' }} />
                                                        </a>
                                                    )}
                                                </div>
                                            </td>
                                            <td style={{ padding: '12px 10px', fontWeight: 700, textAlign: 'right', color: '#f87171' }}>
                                                ฿{fmt(trip.wage || 0)}
                                            </td>
                                            <td style={{ padding: '12px 10px', textAlign: 'right', color: '#f87171' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                                                    <span>฿{fmt(trip.maintenance || 0)}</span>
                                                    {maintReceipt && (
                                                        <a href={maintReceipt} target="_blank" rel="noreferrer" className="receipt-preview-trigger">
                                                            <img src={maintReceipt} alt="ซ่อม" style={{ width: 22, height: 22, borderRadius: 4, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.2)' }} />
                                                        </a>
                                                    )}
                                                </div>
                                            </td>
                                            <td style={{ padding: '12px 10px', fontWeight: 700, textAlign: 'right', color: '#fb923c' }}>
                                                ฿{fmt(trip.advance || 0)}
                                            </td>
                                            <td style={{ padding: '12px 10px', textAlign: 'right', color: '#34d399' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                                                    <span>฿{fmt(trip.basket || 0)}</span>
                                                    {basketReceipt && (
                                                        <a href={basketReceipt} target="_blank" rel="noreferrer" className="receipt-preview-trigger">
                                                            <img src={basketReceipt} alt="ตะกร้า" style={{ width: 22, height: 22, borderRadius: 4, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.2)' }} />
                                                        </a>
                                                    )}
                                                </div>
                                            </td>
                                            <td style={{ padding: '12px 10px', fontWeight: 700, textAlign: 'right', color: '#fbbf24' }}>
                                                ฿{fmt(trip.basketShare || 0)}
                                            </td>
                                            <td style={{ padding: '12px 10px', fontWeight: 700, textAlign: 'right', color: '#fb923c' }}>
                                                ฿{fmt(trip.staffShare || 0)}
                                            </td>
                                            <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                                                <span style={{ 
                                                    padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 900,
                                                    background: trip.profit >= 0 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                                                    color: trip.profit >= 0 ? '#34d399' : '#f87171',
                                                    border: trip.profit >= 0 ? '1px solid rgba(34, 197, 94, 0.2)' : '1px solid rgba(244, 63, 94, 0.2)'
                                                }}>
                                                    ฿{fmt(trip.profit || 0)}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px 10px' }}>
                                                <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                                                    <button onClick={() => onEditTrip(trip)} className="ios-tap" style={{ background: 'var(--glass-border)', border: '1px solid var(--glass-border)', color: '#38bdf8', width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} title="แก้ไข">
                                                        <Edit2 size={13} />
                                                    </button>
                                                    <button onClick={() => { if(window.confirm('ยืนยันที่จะลบข้อมูลรายการของวันนี้ทั้งหมดสำหรับคนขับคนนี้?')) { trip.ids.forEach(id => onDeleteTrip(id)); } }} className="ios-tap" style={{ background: 'var(--glass-border)', border: '1px solid var(--glass-border)', color: '#f43f5e', width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} title="ลบ">
                                                        <Trash2 size={13} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ════════════════════════════════════════
                MODAL: MONTHLY BULK ROUTE UPDATE
            ════════════════════════════════════════ */}
            {isBulkOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div className="glass-card fade-in" style={{ width: '100%', maxWidth: '480px', maxHeight: '95vh', display: 'flex', flexDirection: 'column', borderRadius: '24px', background: 'var(--glass-bg)', color: 'var(--text-main)', border: '1px solid var(--glass-border)', backdropFilter: 'blur(24px)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
                        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)' }}>
                            <div>
                                <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '900', margin: 0 }}>
                                    <Plus size={20} color="#10b981" /> ป้อนข้อมูลค่าเที่ยวรวดเดียว (Bulk Update)
                                </h3>
                                <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', margin: '4px 0 0 0', fontWeight: 600 }}>ป้อนค่าเที่ยวสายรถแบบคงที่สำหรับทุกวันในเดือนด่วน</p>
                            </div>
                            <button onClick={() => setIsBulkOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}><X size={22} /></button>
                        </div>
                        
                        <form onSubmit={handleBulkSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                            {/* เดือน/ปี */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-dim)' }}>เลือกเดือน / ปีที่รวบยอด</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                    <select
                                        style={{ height: '38px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '10px', padding: '0 10px', fontSize: '0.85rem', outline: 'none' }}
                                        value={bulkMonth}
                                        onChange={(e) => setBulkMonth(parseInt(e.target.value))}
                                    >
                                        {months.map((m, idx) => (
                                            <option key={idx} value={idx}>{m}</option>
                                        ))}
                                    </select>
                                    <select
                                        style={{ height: '38px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '10px', padding: '0 10px', fontSize: '0.85rem', outline: 'none' }}
                                        value={bulkYear}
                                        onChange={(e) => setBulkYear(parseInt(e.target.value))}
                                    >
                                        {Array.from({ length: 5 }, (_, i) => currentYear - 2 + i).map((y) => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* ตัวเลือกด่วนจากรายการวิ่ง */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-dim)' }}>เลือกด่วนจากรายการวิ่ง (คลิกเพื่อเลือกทันที)</label>
                                {allAvailableRoutes.length === 0 ? (
                                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontStyle: 'italic', padding: '10px', textAlign: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: '10px' }}>ไม่มีข้อมูลสายงานที่บันทึกไว้ในระบบ</div>
                                ) : (
                                    <div style={{ 
                                        display: 'grid', 
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', 
                                        gap: '0.5rem', 
                                        maxHeight: '120px', 
                                        overflowY: 'auto', 
                                        padding: '6px',
                                        background: 'rgba(0,0,0,0.3)',
                                        borderRadius: '10px',
                                        border: '1px solid var(--glass-border)'
                                    }} className="custom-scrollbar">
                                        {allAvailableRoutes.map(({ route, price }) => {
                                            const isSelected = bulkRoute === route;
                                            return (
                                                <button
                                                    key={route}
                                                    type="button"
                                                    onClick={() => {
                                                        setBulkRoute(route);
                                                        if (price !== undefined && price !== '') {
                                                            setBulkPrice(price);
                                                        }
                                                    }}
                                                    style={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'flex-start',
                                                        gap: '2px',
                                                        padding: '8px 12px',
                                                        borderRadius: '8px',
                                                        border: isSelected ? '1px solid #10b981' : '1px solid var(--glass-border)',
                                                        background: isSelected ? 'rgba(16, 185, 129, 0.15)' : 'var(--glass-border)',
                                                        color: isSelected ? '#10b981' : '#e2e8f0',
                                                        cursor: 'pointer',
                                                        textAlign: 'left',
                                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                                                    }}
                                                    className="ios-tap"
                                                >
                                                    <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>สาย {route}</span>
                                                    <span style={{ fontSize: '0.68rem', color: isSelected ? '#34d399' : '#94a3b8' }}>
                                                        {price ? `฿${parseInt(price).toLocaleString()}` : 'ไม่ระบุราคา'}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* สายรถ */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-dim)' }}>สายรถ (เส้นทางวิ่ง)</label>
                                <input
                                    type="text"
                                    list="bulk-route-options"
                                    style={{ height: '38px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '10px', padding: '0 12px', fontSize: '0.85rem', width: '100%', outline: 'none' }}
                                    placeholder="เช่น 522..."
                                    value={bulkRoute}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setBulkRoute(val);
                                        const cleanVal = val.trim();
                                        if (routePresets && routePresets[cleanVal]) {
                                            setBulkPrice(routePresets[cleanVal].price || '');
                                        }
                                    }}
                                />
                                <datalist id="bulk-route-options">
                                    {routePresets && Object.keys(routePresets).map(route => (
                                        <option key={route} value={route} />
                                    ))}
                                </datalist>
                            </div>

                            {/* จำนวนเงิน */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-dim)' }}>จำนวนเงินค่าเที่ยวตายตัว (บาท)</label>
                                <input
                                    type="number"
                                    style={{ height: '38px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '10px', padding: '0 12px', fontSize: '0.85rem', width: '100%', outline: 'none' }}
                                    placeholder="ระบุราคาค่าเที่ยว..."
                                    value={bulkPrice}
                                    onChange={(e) => setBulkPrice(e.target.value)}
                                />
                            </div>

                            {/* ยืนยัน / ยกเลิก */}
                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    style={{ padding: '0 20px', height: '38px', background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-dim)', fontWeight: '700', cursor: 'pointer', borderRadius: '10px', fontSize: '0.8rem' }}
                                    onClick={() => setIsBulkOpen(false)}
                                    disabled={isBulkLoading}
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="submit"
                                    style={{ padding: '0 20px', height: '38px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none', color: 'var(--text-main)', fontWeight: '800', cursor: 'pointer', borderRadius: '10px', fontSize: '0.8rem', boxShadow: '0 4px 10px rgba(16,185,129,0.2)' }}
                                    disabled={isBulkLoading}
                                >
                                    {isBulkLoading ? 'กำลังบันทึก...' : 'บันทึกด่วน'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Custom Premium Styles */}
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                    height: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(0,0,0,0.1);
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: var(--glass-border);
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255,255,255,0.3);
                }
                .table-row-hover-dark:hover {
                    background: var(--glass-border)!important;
                }
                .kpi-card-hover:hover {
                    transform: translateY(-4px);
                    border-color: var(--glass-border)!important;
                    box-shadow: 0 12px 40px 0 rgba(0, 0, 0, 0.35)!important;
                }
                .receipt-preview-trigger {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    transition: transform 0.2s;
                }
                .receipt-preview-trigger img {
                    transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s;
                }
                .receipt-preview-trigger img:hover {
                    transform: scale(2.8);
                    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.7);
                    position: relative;
                    z-index: 100;
                }
            `}</style>
        </div>
    );
};

export default DataHub;
