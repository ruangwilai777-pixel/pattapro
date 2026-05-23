import React from 'react';
import { Download, ChevronLeft, ChevronRight, Plus, Edit2, Trash2, ReceiptText, Camera, History, X, Truck, CheckCircle2, Wrench, Banknote } from 'lucide-react';
import SalarySlip from './SalarySlip';

const MonthlyTable = ({ currentMonth, currentYear, trips, onMonthChange, onExport, onSelectDate, onEditTrip, onDeleteTrip, cnDeductions, setCnDeductions, showSlips = true, onlySlips = false }) => {
    const [selectedDriverForSlip, setSelectedDriverForSlip] = React.useState(null);
    const [selectedDriverForHistory, setSelectedDriverForHistory] = React.useState(null);
    const [viewMode, setViewMode] = React.useState('daily');

    const months = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];

    const getDatesInRange = () => {
        const dates = [];
        const startDate = new Date(currentYear, currentMonth - 1, 20);
        const endDate = new Date(currentYear, currentMonth, 19);

        let current = new Date(startDate);
        while (current <= endDate) {
            dates.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }
        return dates;
    };

    const datesInRange = getDatesInRange();

    // Filter trips in the current 20th to 19th period
    const tripsInPeriod = React.useMemo(() => {
        const start = new Date(currentYear, currentMonth - 1, 20);
        const end = new Date(currentYear, currentMonth, 19);
        const startStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-20`;
        const endStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-19`;
        return trips.filter(t => t.date && t.date >= startStr && t.date <= endStr);
    }, [trips, currentMonth, currentYear]);

    // Drivers summary statistics aggregated in React
    const driversStats = React.useMemo(() => {
        const drivers = {};
        tripsInPeriod.forEach(t => {
            const driverName = (t.driverName || t.driver_name || 'ไม่ระบุชื่อ').trim();
            if (!driverName || driverName === '-' || driverName === 'ไม่ระบุชื่อ') return;

            if (!drivers[driverName]) {
                drivers[driverName] = {
                    name: driverName,
                    trips: 0,
                    price: 0,
                    fuel: 0,
                    wage: 0,
                    maintenance: 0,
                    basket: 0,
                    basketShare: 0,
                    advance: 0,
                    profit: 0
                };
            }

            const d = drivers[driverName];
            d.trips += 1;
            d.price += parseFloat(t.price) || 0;
            d.fuel += parseFloat(t.fuel) || 0;
            d.wage += parseFloat(t.wage) || 0;
            d.maintenance += parseFloat(t.maintenance) || 0;
            d.basket += parseFloat(t.basket) || 0;
            d.basketShare += parseFloat(t.basketShare || t.basket_share || t.staff_share) || 0;
            d.advance += parseFloat(t.staffShare || t.advance || t.staff_advance) || 0;
            d.profit += parseFloat(t.profit) || 0;
        });
        return Object.values(drivers);
    }, [tripsInPeriod]);

    // System-wide overview aggregated metrics
    const overviewMetrics = React.useMemo(() => {
        let totalTrips = tripsInPeriod.length;
        let totalRevenue = 0;
        let totalFuel = 0;
        let totalWages = 0;
        let totalMaintenance = 0;
        let totalBaskets = 0;
        let totalBasketShare = 0;
        let totalAdvances = 0;
        let totalProfit = 0;

        tripsInPeriod.forEach(t => {
            const driverName = (t.driverName || t.driver_name || '').trim();
            if (!driverName || driverName === '-' || driverName === 'ไม่ระบุชื่อ') return;

            totalRevenue += parseFloat(t.price) || 0;
            totalWages += parseFloat(t.wage) || 0;
            totalBaskets += parseFloat(t.basket) || 0;
            totalBasketShare += parseFloat(t.basketShare || t.basket_share || t.staff_share) || 0;
            totalFuel += parseFloat(t.fuel) || 0;
            totalAdvances += parseFloat(t.staffShare || t.advance || t.staff_advance) || 0;
            totalMaintenance += parseFloat(t.maintenance) || 0;
            totalProfit += parseFloat(t.profit) || 0;
        });

        const totalExpenses = totalFuel + totalWages + totalMaintenance + totalBasketShare;
        const netProfitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue * 100) : 0;

        const fuelRatio = totalRevenue > 0 ? (totalFuel / totalRevenue * 100) : 0;
        const wageRatio = totalRevenue > 0 ? (totalWages / totalRevenue * 100) : 0;
        const maintRatio = totalRevenue > 0 ? (totalMaintenance / totalRevenue * 100) : 0;
        const shareRatio = totalRevenue > 0 ? (totalBasketShare / totalRevenue * 100) : 0;

        return {
            totalTrips,
            totalRevenue,
            totalFuel,
            totalWages,
            totalMaintenance,
            totalBaskets,
            totalBasketShare,
            totalAdvances,
            totalProfit,
            totalExpenses,
            netProfitMargin,
            fuelRatio,
            wageRatio,
            maintRatio,
            shareRatio
        };
    }, [tripsInPeriod]);

    const getDayData = (date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${d}`;
        const dayTrips = trips.filter(t => t.date === dateStr);

        if (dayTrips.length === 0) return { route: '-', price: 0, fuel: 0, wage: 0, basket: 0, basketShare: 0, staffShare: 0, maintenance: 0, advance: 0, profit: 0, count: 0, items: [] };

        return {
            ...dayTrips.reduce((acc, trip) => ({
                route: dayTrips.map(t => t.route).join(', '),
                driverName: dayTrips.map(t => t.driverName).filter(n => n).join(', ') || '-',
                price: acc.price + trip.price,
                fuel: acc.fuel + trip.fuel,
                wage: acc.wage + trip.wage,
                basket: acc.basket + trip.basket,
                staffShare: acc.staffShare + trip.staffShare,
                maintenance: acc.maintenance + trip.maintenance,
                basketShare: acc.basketShare + trip.basketShare,
                profit: acc.profit + trip.profit
            }), { price: 0, fuel: 0, wage: 0, basket: 0, staffShare: 0, maintenance: 0, basketShare: 0, profit: 0 }),
            count: dayTrips.length,
            items: dayTrips
        };
    };

    return (
        <div className="glass-card fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {!onlySlips && (
                <div className="header" style={{ padding: '1rem 1.5rem', marginBottom: '0', flexShrink: 0, flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        <div>
                            <h3 style={{ fontSize: '1.25rem' }}>ตารางรอบสรุปยอด (20 - 19)</h3>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                                ยอดของรอบที่เลือก: {months[currentMonth]} {currentYear}
                            </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem', padding: '0.25rem' }}>
                            <button className="btn-icon" onClick={() => onMonthChange(-1)}><ChevronLeft size={18} /></button>
                            <span style={{ minWidth: '120px', textAlign: 'center', fontWeight: '500' }}>
                                {months[currentMonth]} {currentYear}
                            </span>
                            <button className="btn-icon" onClick={() => onMonthChange(1)}><ChevronRight size={18} /></button>
                        </div>

                        {/* Gold-themed sliding toggle buttons */}
                        <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(15, 23, 42, 0.4)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '0.25rem', gap: '0.25rem', boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)' }}>
                            <button 
                                className={`view-toggle-btn ${viewMode === 'overview' ? 'active' : ''}`}
                                onClick={() => setViewMode('overview')}
                                style={{
                                    padding: '0.5rem 1rem',
                                    border: 'none',
                                    background: viewMode === 'overview' ? 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)' : 'transparent',
                                    color: viewMode === 'overview' ? 'black' : '#94a3b8',
                                    fontSize: '0.8rem',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    borderRadius: '9px',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    boxShadow: viewMode === 'overview' ? '0 4px 12px rgba(251, 191, 36, 0.3)' : 'none'
                                }}
                            >
                                ภาพรวมระบบ
                            </button>
                            <button 
                                className={`view-toggle-btn ${viewMode === 'summary' ? 'active' : ''}`}
                                onClick={() => setViewMode('summary')}
                                style={{
                                    padding: '0.5rem 1rem',
                                    border: 'none',
                                    background: viewMode === 'summary' ? 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)' : 'transparent',
                                    color: viewMode === 'summary' ? 'black' : '#94a3b8',
                                    fontSize: '0.8rem',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    borderRadius: '9px',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    boxShadow: viewMode === 'summary' ? '0 4px 12px rgba(251, 191, 36, 0.3)' : 'none'
                                }}
                            >
                                สรุปยอดคนขับ
                            </button>
                            <button 
                                className={`view-toggle-btn ${viewMode === 'daily' ? 'active' : ''}`}
                                onClick={() => setViewMode('daily')}
                                style={{
                                    padding: '0.5rem 1rem',
                                    border: 'none',
                                    background: viewMode === 'daily' ? 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)' : 'transparent',
                                    color: viewMode === 'daily' ? 'black' : '#94a3b8',
                                    fontSize: '0.8rem',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    borderRadius: '9px',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    boxShadow: viewMode === 'daily' ? '0 4px 12px rgba(251, 191, 36, 0.3)' : 'none'
                                }}
                            >
                                ตารางงานรายวัน
                            </button>
                        </div>
                    </div>
                    <button className="btn btn-outline" onClick={onExport}>
                        <Download size={18} />
                        Export รอบนี้
                    </button>
                </div>
            )}


            {/* Salary Slips section - Moved to Top */}
            {showSlips && (
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: onlySlips ? 'none' : '1px solid rgba(255,255,255,0.05)', flexShrink: 0, background: 'rgba(255,255,255,0.02)' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ReceiptText size={18} color="var(--primary)" /> ออกสลิปเงินเดือนพนักงาน
                    </h3>
                    <div style={onlySlips ? { display: 'flex', flexDirection: 'column', gap: '0.8rem' } : { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.25rem' }}>
                        {(() => {
                            const tripsInPeriod = (() => {
                                const start = new Date(currentYear, currentMonth - 1, 20);
                                const end = new Date(currentYear, currentMonth, 19);
                                const startStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-20`;
                                const endStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-19`;
                                return trips.filter(t => t.date && t.date >= startStr && t.date <= endStr);
                            })();

                            const driversMap = {};
                            tripsInPeriod.forEach(t => {
                                const name = t.driverName || 'ไม่ระบุชื่อ';
                                if (!driversMap[name]) driversMap[name] = [];
                                driversMap[name].push(t);
                            });

                            return Object.entries(driversMap).map(([name, driverTrips]) => {
                                const cn = parseFloat(cnDeductions[name]) || 0;
                                const totalPay = driverTrips.reduce((sum, t) => {
                                    const wage = parseFloat(t.wage) || 0;
                                    const bShare = parseFloat(t.basketShare || t.basket_share || t.staff_share) || 0;
                                    const advance = parseFloat(t.staffShare || t.advance || t.staff_advance) || 0;
                                    return sum + wage + bShare - advance;
                                }, 1000) - cn;

                                return (
                                    <div key={name} className="glass-card" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div>
                                            <p style={{ fontWeight: '600', marginBottom: '0.1rem', fontSize: '0.9rem' }}>{name}</p>
                                            <p style={{ fontSize: '0.7rem', color: 'var(--success)' }}>฿{totalPay.toLocaleString()}</p>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                            <div style={{ marginRight: '0.2rem' }}>
                                                <input
                                                    type="number"
                                                    placeholder="CN"
                                                    className="warning-input"
                                                    style={{ width: '50px', padding: '0.2rem', fontSize: '0.7rem' }}
                                                    value={cnDeductions[name] || ''}
                                                    onChange={(e) => setCnDeductions({ ...cnDeductions, [name]: e.target.value })}
                                                />
                                            </div>

                                            <button
                                                className="btn btn-outline"
                                                style={{ padding: '0.3rem 0.5rem', fontSize: '0.7rem', whiteSpace: 'nowrap' }}
                                                onClick={() => {
                                                     const url = `${window.location.origin}/#/driver?view=${encodeURIComponent(name)}`;
                                                    navigator.clipboard.writeText(url);
                                                    alert(`ก๊อปปี้ลิงก์สลิปของ ${name} เรียบร้อย!`);
                                                }}
                                            >
                                                <Download size={12} />
                                            </button>
                                            <button
                                                className="btn btn-primary"
                                                style={{ padding: '0.3rem 0.6rem', fontSize: '0.7rem', whiteSpace: 'nowrap' }}
                                                onClick={() => setSelectedDriverForSlip({ name, trips: driverTrips, cn: cnDeductions[name] })}
                                            >
                                                <ReceiptText size={12} /> สลิป
                                            </button>
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                </div>
            )}

            {viewMode === 'daily' && !onlySlips && (
                <div className="table-container" style={{ width: '100%', overflowX: 'auto' }}>
                    <table style={{ minWidth: '1000px' }}>
                        <thead style={{ position: 'sticky', top: 0, zIndex: 1000, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)' }}>
                            <tr>
                                <th style={{ width: '15%', padding: '0.5rem', textAlign: 'center' }}>วันที่</th>
                                <th style={{ width: '10%', padding: '0.5rem', textAlign: 'left' }}>คนขับ</th>
                                <th style={{ width: '12%', padding: '0.5rem', textAlign: 'left' }}>สายงาน</th>
                                <th style={{ width: '7%', padding: '0.5rem', textAlign: 'right' }}>ราคา</th>
                                <th style={{ width: '7%', padding: '0.5rem', textAlign: 'right' }}>น้ำมัน</th>
                                <th style={{ width: '7%', padding: '0.5rem', textAlign: 'right' }}>ค่าจ้าง</th>
                                <th style={{ width: '7%', padding: '0.5rem', textAlign: 'right' }}>ค่าซ่อม</th>
                                <th style={{ width: '7%', padding: '0.5rem', textAlign: 'right' }}>ตะกร้า</th>
                                <th style={{ width: '7%', padding: '0.5rem', textAlign: 'right' }}>แบ่ง</th>
                                <th style={{ width: '7%', padding: '0.5rem', textAlign: 'right' }}>เบิก</th>
                                <th style={{ width: '7%', padding: '0.5rem', textAlign: 'right' }}>กำไร</th>
                                <th style={{ width: '7%', padding: '0.5rem', textAlign: 'center' }}>จัดการ</th>
                            </tr>
                        </thead>
                        <tbody style={{ fontSize: '0.8rem' }}>
                            {datesInRange.flatMap((date) => {
                                const data = getDayData(date);
                                const isToday = new Date().toDateString() === date.toDateString();
                                const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

                                if (data.items.length === 0) {
                                    return [(
                                        <tr
                                            key={`empty-${dateStr}`}
                                            onClick={() => onSelectDate(dateStr)}
                                            className="clickable-row"
                                            style={{
                                                cursor: 'pointer',
                                                background: isToday ? 'rgba(99, 102, 241, 0.1)' : 'transparent'
                                            }}
                                        >
                                            <td style={{ padding: '0.4rem 0.2rem', textAlign: 'center' }}>
                                                <span style={{ fontWeight: '500', color: isToday ? 'var(--primary)' : 'var(--text-dim)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                                                    {date.toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                                                </span>
                                            </td>
                                            <td colSpan={10} style={{ textAlign: 'center', color: 'var(--text-dim)', opacity: 0.3, fontSize: '0.7rem' }}>ไม่มีรายการ (คลิกเพื่อเพิ่ม)</td>
                                            <td></td>
                                        </tr>
                                    )];
                                }

                                return data.items.map((trip, tIdx) => (
                                    <tr
                                        key={trip.id || `trip-${dateStr}-${tIdx}`}
                                        style={isToday ? { background: 'rgba(99, 102, 241, 0.1)' } : {}}
                                        className="trip-row-hover"
                                    >
                                        <td style={{ padding: '0.5rem', textAlign: 'center', borderRight: tIdx === 0 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                                            {tIdx === 0 ? (
                                                <span style={{ fontWeight: '500', color: isToday ? 'var(--primary)' : 'var(--text-main)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                                                    {date.toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                                                </span>
                                            ) : null}
                                        </td>
                                        <td style={{ padding: '0.5rem', color: 'var(--primary)', fontWeight: '500', textAlign: 'left' }}>
                                            {trip.driverName}
                                        </td>
                                        <td style={{ padding: '0.5rem', color: 'var(--text-main)', textAlign: 'left' }}>
                                            {trip.route}
                                        </td>
                                        <td style={{ padding: '0.5rem', textAlign: 'right' }}>{trip.price > 0 ? trip.price.toLocaleString() : '-'}</td>
                                        <td style={{ padding: '0.5rem', textAlign: 'right', color: 'var(--danger)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                                                <span>{trip.fuel > 0 ? trip.fuel.toLocaleString() : '-'}</span>
                                                {(trip.fuel_bill_url || trip.fuel_url) && (
                                                    <a href={trip.fuel_bill_url || trip.fuel_url} target="_blank" rel="noreferrer" title="กดดูรูปน้ำมัน" className="bill-thumbnail-link">
                                                        <img 
                                                            src={trip.fuel_bill_url || trip.fuel_url} 
                                                            alt="รูปน้ำมัน" 
                                                            className="receipt-thumbnail"
                                                        />
                                                    </a>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ padding: '0.5rem', textAlign: 'right', color: 'var(--danger)' }}>{trip.wage > 0 ? trip.wage.toLocaleString() : '-'}</td>
                                        <td style={{ padding: '0.5rem', textAlign: 'right', color: 'var(--danger)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                                                <span>{trip.maintenance > 0 ? trip.maintenance.toLocaleString() : '-'}</span>
                                                {(trip.maintenance_bill_url || trip.maintenance_url) && (
                                                    <a href={trip.maintenance_bill_url || trip.maintenance_url} target="_blank" rel="noreferrer" title="กดดูรูปค่าซ่อม" className="bill-thumbnail-link">
                                                        <img 
                                                            src={trip.maintenance_bill_url || trip.maintenance_url} 
                                                            alt="รูปค่าซ่อม" 
                                                            className="receipt-thumbnail"
                                                        />
                                                    </a>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ padding: '0.5rem', textAlign: 'right', color: 'var(--success)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                                                <span>{trip.basket > 0 ? trip.basket.toLocaleString() : '-'}</span>
                                                {(trip.basket_bill_url || trip.basket_url) && (
                                                    <a href={trip.basket_bill_url || trip.basket_url} target="_blank" rel="noreferrer" title="กดดูรูปตะกร้า" className="bill-thumbnail-link">
                                                        <img 
                                                            src={trip.basket_bill_url || trip.basket_url} 
                                                            alt="รูปตะกร้า" 
                                                            className="receipt-thumbnail"
                                                        />
                                                    </a>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ padding: '0.5rem', textAlign: 'right', color: 'var(--danger)' }}>
                                            {trip.basketShare > 0 ? trip.basketShare.toLocaleString() : '-'}
                                        </td>
                                        <td style={{ padding: '0.5rem', textAlign: 'right', color: 'var(--warning)' }}>
                                            {trip.staffShare > 0 ? trip.staffShare.toLocaleString() : '-'}
                                        </td>
                                        <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                                            {trip.profit !== 0 ? (
                                                <span className={`badge ${trip.profit >= 0 ? 'badge-profit' : 'badge-loss'}`} style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem', float: 'right' }}>
                                                    {Math.round(trip.profit).toLocaleString()}
                                                </span>
                                            ) : '-'}
                                        </td>
                                        <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                <button className="btn-icon" onClick={() => onEditTrip(trip)} style={{ padding: '4px' }} title="แก้ไข">
                                                    <Edit2 size={16} color="var(--primary)" />
                                                </button>
                                                <button className="btn-icon" onClick={() => onDeleteTrip(trip.id)} style={{ padding: '4px' }} title="ลบ">
                                                    <Trash2 size={16} color="var(--danger)" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ));
                            })}
                        </tbody>
                        <tfoot style={{ position: 'sticky', bottom: 0, background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(20px)', borderTop: '2px solid var(--primary-glow)', zIndex: 20 }}>
                            {(() => {
                                const totals = datesInRange.reduce((acc, date) => {
                                    const data = getDayData(date);
                                    return {
                                        count: acc.count + (data.count || 0),
                                        price: acc.price + (data.price || 0),
                                        fuel: acc.fuel + (data.fuel || 0),
                                        wage: acc.wage + (data.wage || 0),
                                        maintenance: acc.maintenance + (data.maintenance || 0),
                                        basket: acc.basket + (data.basket || 0),
                                        basketShare: acc.basketShare + (data.basketShare || 0),
                                        staffShare: acc.staffShare + (data.staffShare || 0),
                                        profit: acc.profit + (data.profit || 0)
                                    };
                                }, { count: 0, price: 0, fuel: 0, wage: 0, maintenance: 0, basket: 0, basketShare: 0, staffShare: 0, profit: 0 });

                                const totalCellStyles = { padding: '0.75rem 0.2rem', textAlign: 'center', fontSize: '0.85rem', fontFamily: "'Outfit', sans-serif" };

                                return (
                                    <tr style={{ fontWeight: '800' }}>
                                        <td style={{ ...totalCellStyles, color: 'var(--primary)', textAlign: 'center', fontFamily: "'Chakra Petch', sans-serif", fontSize: '0.9rem' }}>
                                            <div>รวมสรุป</div>
                                            <div style={{ fontSize: '0.7rem', color: 'white', opacity: 0.8 }}>({totals.count} เที่ยว)</div>
                                        </td>
                                        <td></td>
                                        <td></td>
                                        <td style={{ ...totalCellStyles, color: 'white' }}>
                                            <div style={{ fontSize: '0.6rem', opacity: 0.6, marginBottom: '-2px' }}>รวมค่าเที่ยว</div>
                                            ฿{totals.price.toLocaleString()}
                                        </td>
                                        <td style={{ ...totalCellStyles, color: 'var(--danger)' }}>
                                            <div style={{ fontSize: '0.6rem', opacity: 0.6, marginBottom: '-2px' }}>น้ำมัน</div>
                                            ฿{totals.fuel.toLocaleString()}
                                        </td>
                                        <td style={{ ...totalCellStyles, color: 'var(--danger)' }}>
                                            <div style={{ fontSize: '0.6rem', opacity: 0.6, marginBottom: '-2px' }}>ค่าแรง</div>
                                            ฿{totals.wage.toLocaleString()}
                                        </td>
                                        <td style={{ ...totalCellStyles, color: 'var(--danger)' }}>
                                            <div style={{ fontSize: '0.6rem', opacity: 0.6, marginBottom: '-2px' }}>ซ่อม</div>
                                            ฿{totals.maintenance.toLocaleString()}
                                        </td>
                                        <td style={{ ...totalCellStyles, color: 'var(--safe)' }}>
                                            <div style={{ fontSize: '0.6rem', opacity: 0.6, marginBottom: '-2px' }}>รวมตะกร้า</div>
                                            ฿{totals.basket.toLocaleString()}
                                        </td>
                                        <td style={{ ...totalCellStyles, color: 'var(--danger)' }}>
                                            <div style={{ fontSize: '0.6rem', opacity: 0.6, marginBottom: '-2px' }}>แบ่ง</div>
                                            ฿{totals.basketShare.toLocaleString()}
                                        </td>
                                        <td style={{ ...totalCellStyles, color: 'var(--warning)' }}>
                                            <div style={{ fontSize: '0.6rem', opacity: 0.6, marginBottom: '-2px' }}>เบิก</div>
                                            ฿{totals.staffShare.toLocaleString()}
                                        </td>
                                        <td style={{ padding: '0.5rem 0' }}>
                                            <div style={{ fontSize: '0.6rem', opacity: 0.6, marginBottom: '2px', textAlign: 'center' }}>กำไรสุทธิ</div>
                                            <div className={`badge ${totals.profit >= 0 ? 'badge-profit' : 'badge-loss'}`} style={{ fontSize: '0.85rem', width: '90%', margin: '0 auto', display: 'flex', justifyContent: 'center' }}>
                                                ฿{Math.round(totals.profit).toLocaleString()}
                                            </div>
                                        </td>
                                        <td></td>
                                    </tr>
                                );
                            })()}
                        </tfoot>
                    </table>
                </div>
            )}

            {viewMode === 'overview' && !onlySlips && (
                <div className="system-overview-container animate-fade-in" style={{ padding: '1.5rem', color: 'white' }}>
                    <div className="overview-dashboard" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        
                        {/* Top Row: Summary Info */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                            <div>
                                <h4 style={{ fontSize: '1.1rem', color: '#fbbf24', fontFamily: "'Chakra Petch', sans-serif", margin: 0 }}>ภาพรวมและสรุปผลประกอบการระบบ</h4>
                                <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0.2rem 0 0 0' }}>วิเคราะห์สถิติรายรับ รายจ่าย และผลกำไรประจำรอบบิลนี้</p>
                            </div>
                            <div style={{ background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.2)', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                <span style={{ width: '6px', height: '6px', background: '#fbbf24', borderRadius: '50%', boxShadow: '0 0 8px #fbbf24' }}></span>
                                <span>ข้อมูลสรุปเรียลไทม์</span>
                            </div>
                        </div>

                        {/* KPI Grid */}
                        <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                            
                            {/* Card 1: Revenue */}
                            <div className="kpi-card glass-card" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContext: 'space-between', marginBottom: '0.75rem' }}>
                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '500' }}>รายรับรวมทั้งหมด</span>
                                    <div style={{ background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)', width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(217, 119, 6, 0.3)' }}>
                                        <Banknote size={16} color="white" />
                                    </div>
                                </div>
                                <div style={{ fontSize: '1.45rem', fontWeight: '800', fontFamily: "'Outfit', sans-serif", color: 'white' }}>฿{overviewMetrics.totalRevenue.toLocaleString()}</div>
                                <div style={{ fontSize: '0.7rem', color: '#fbbf24', marginTop: '0.25rem' }}>รายได้จากค่าเที่ยวและบริการ</div>
                            </div>

                            {/* Card 2: Net Profit */}
                            <div className="kpi-card glass-card" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContext: 'space-between', marginBottom: '0.75rem' }}>
                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '500' }}>กำไรสุทธิ</span>
                                    <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)', width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)' }}>
                                        <CheckCircle2 size={16} color="white" />
                                    </div>
                                </div>
                                <div style={{ fontSize: '1.45rem', fontWeight: '800', fontFamily: "'Outfit', sans-serif", color: '#10b981' }}>฿{Math.round(overviewMetrics.totalProfit).toLocaleString()}</div>
                                <div style={{ fontSize: '0.7rem', color: '#34d399', marginTop: '0.25rem', display: 'flex', gap: '0.25rem' }}>
                                    <span style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '0.1rem 0.3rem', borderRadius: '4px', fontWeight: '700' }}>Margin {overviewMetrics.netProfitMargin.toFixed(1)}%</span>
                                    <span>ของรายรับ</span>
                                </div>
                            </div>

                            {/* Card 3: Expenses */}
                            <div className="kpi-card glass-card" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContext: 'space-between', marginBottom: '0.75rem' }}>
                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '500' }}>รายจ่ายของระบบ</span>
                                    <div style={{ background: 'linear-gradient(135deg, #f43f5e 0%, #be123c 100%)', width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(244, 63, 94, 0.3)' }}>
                                        <Wrench size={16} color="white" />
                                    </div>
                                </div>
                                <div style={{ fontSize: '1.45rem', fontWeight: '800', fontFamily: "'Outfit', sans-serif", color: '#f43f5e' }}>฿{overviewMetrics.totalExpenses.toLocaleString()}</div>
                                <div style={{ fontSize: '0.7rem', color: '#fb7185', marginTop: '0.25rem' }}>น้ำมัน + ค่าแรง + ซ่อม + แบ่งตะกร้า</div>
                            </div>

                            {/* Card 4: Trip Stats */}
                            <div className="kpi-card glass-card" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContext: 'space-between', marginBottom: '0.75rem' }}>
                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '500' }}>จำนวนเที่ยวและเฉลี่ย</span>
                                    <div style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)', width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(99, 102, 241, 0.3)' }}>
                                        <Truck size={16} color="white" />
                                    </div>
                                </div>
                                <div style={{ fontSize: '1.45rem', fontWeight: '800', fontFamily: "'Outfit', sans-serif", color: '#818cf8' }}>{overviewMetrics.totalTrips} เที่ยว</div>
                                <div style={{ fontSize: '0.7rem', color: '#a5b4fc', marginTop: '0.25rem' }}>เฉลี่ย ฿{(overviewMetrics.totalTrips > 0 ? Math.round(overviewMetrics.totalRevenue / overviewMetrics.totalTrips) : 0).toLocaleString()} / เที่ยว</div>
                            </div>

                        </div>

                        {/* Bottom Grid: Ratios & Basket Details */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
                            
                            {/* Left Box: Expense Ratio Breakdown */}
                            <div className="glass-card" style={{ background: 'rgba(15, 23, 42, 0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                                <h5 style={{ fontSize: '0.9rem', color: '#fbbf24', fontFamily: "'Chakra Petch', sans-serif", margin: 0 }}>อัตราส่วนค่าใช้จ่ายต่อรายรับ</h5>
                                
                                {/* Fuel Ratio */}
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.4rem', color: '#cbd5e1' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><span style={{ width: '8px', height: '8px', background: '#fb5424', borderRadius: '50%' }}></span>ค่าน้ำมัน (Fuel)</span>
                                        <span style={{ fontWeight: '700', fontFamily: "'Outfit', sans-serif" }}>฿{overviewMetrics.totalFuel.toLocaleString()} ({overviewMetrics.fuelRatio.toFixed(1)}%)</span>
                                    </div>
                                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.02)' }}>
                                        <div style={{ width: `${overviewMetrics.fuelRatio}%`, height: '100%', background: 'linear-gradient(90deg, #f59e0b, #fb5424)', borderRadius: '4px' }}></div>
                                    </div>
                                </div>

                                {/* Wage Ratio */}
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.4rem', color: '#cbd5e1' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><span style={{ width: '8px', height: '8px', background: '#a855f7', borderRadius: '50%' }}></span>ค่าจ้างพนักงาน (Wages)</span>
                                        <span style={{ fontWeight: '700', fontFamily: "'Outfit', sans-serif" }}>฿{overviewMetrics.totalWages.toLocaleString()} ({overviewMetrics.wageRatio.toFixed(1)}%)</span>
                                    </div>
                                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.02)' }}>
                                        <div style={{ width: `${overviewMetrics.wageRatio}%`, height: '100%', background: 'linear-gradient(90deg, #c084fc, #a855f7)', borderRadius: '4px' }}></div>
                                    </div>
                                </div>

                                {/* Maintenance Ratio */}
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.4rem', color: '#cbd5e1' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><span style={{ width: '8px', height: '8px', background: '#f87171', borderRadius: '50%' }}></span>ค่าซ่อมบำรุง (Maintenance)</span>
                                        <span style={{ fontWeight: '700', fontFamily: "'Outfit', sans-serif" }}>฿{overviewMetrics.totalMaintenance.toLocaleString()} ({overviewMetrics.maintRatio.toFixed(1)}%)</span>
                                    </div>
                                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.02)' }}>
                                        <div style={{ width: `${overviewMetrics.maintRatio}%`, height: '100%', background: 'linear-gradient(90deg, #f87171, #ef4444)', borderRadius: '4px' }}></div>
                                    </div>
                                </div>

                                {/* Basket Share Ratio */}
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.4rem', color: '#cbd5e1' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><span style={{ width: '8px', height: '8px', background: '#fb7185', borderRadius: '50%' }}></span>แบ่งปันค่าตะกร้า (Basket Share)</span>
                                        <span style={{ fontWeight: '700', fontFamily: "'Outfit', sans-serif" }}>฿{overviewMetrics.totalBasketShare.toLocaleString()} ({overviewMetrics.shareRatio.toFixed(1)}%)</span>
                                    </div>
                                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.02)' }}>
                                        <div style={{ width: `${overviewMetrics.shareRatio}%`, height: '100%', background: 'linear-gradient(90deg, #fb7185, #f43f5e)', borderRadius: '4px' }}></div>
                                    </div>
                                </div>

                            </div>

                            {/* Right Box: Basket Breakdown */}
                            <div className="glass-card" style={{ background: 'rgba(15, 23, 42, 0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <h5 style={{ fontSize: '0.9rem', color: '#fbbf24', fontFamily: "'Chakra Petch', sans-serif", margin: 0 }}>วิเคราะห์ส่วนต่างตะกร้าและเงินสำรอง</h5>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', padding: '0.8rem 1rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '500' }}>รายรับค่าตะกร้าสะสม (Basket In)</div>
                                            <div style={{ fontSize: '0.7rem', color: '#a78bfa', marginTop: '0.1rem' }}>เก็บจากโรงงาน/ลูกค้า</div>
                                        </div>
                                        <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#34d399', fontFamily: "'Outfit', sans-serif" }}>฿{overviewMetrics.totalBaskets.toLocaleString()}</div>
                                    </div>

                                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', padding: '0.8rem 1rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '500' }}>แบ่งค่าตะกร้าให้คนขับ (Basket Out)</div>
                                            <div style={{ fontSize: '0.7rem', color: '#f43f5e', marginTop: '0.1rem' }}>จ่ายค่าตอบแทนให้พนักงาน</div>
                                        </div>
                                        <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#f87171', fontFamily: "'Outfit', sans-serif" }}>฿{overviewMetrics.totalBasketShare.toLocaleString()}</div>
                                    </div>

                                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', padding: '0.8rem 1rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '3px solid #fbbf24' }}>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: '#fbbf24', fontWeight: '600' }}>ผลต่างค่าตะกร้า (Net Basket Profit)</div>
                                            <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.1rem' }}>กำไรสะสมจากการหมุนตะกร้า</div>
                                        </div>
                                        <div style={{ fontSize: '1.15rem', fontWeight: '800', fontFamily: "'Outfit', sans-serif", color: (overviewMetrics.totalBaskets - overviewMetrics.totalBasketShare) >= 0 ? '#34d399' : '#ef4444' }}>
                                            ฿{(overviewMetrics.totalBaskets - overviewMetrics.totalBasketShare).toLocaleString()}
                                        </div>
                                    </div>

                                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', padding: '0.8rem 1rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: '#cbd5e1', fontWeight: '500' }}>ยอดเบิกเงินสำรองสะสม (Staff Advances)</div>
                                            <div style={{ fontSize: '0.7rem', color: '#fbbf24', marginTop: '0.1rem' }}>เบิกล่วงหน้าระหว่างรอบบิล</div>
                                        </div>
                                        <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#fbbf24', fontFamily: "'Outfit', sans-serif" }}>฿{overviewMetrics.totalAdvances.toLocaleString()}</div>
                                    </div>
                                </div>

                            </div>

                        </div>

                    </div>
                </div>
            )}

            {viewMode === 'summary' && !onlySlips && (
                <div className="table-container" style={{ width: '100%', overflowX: 'auto' }}>
                    <table style={{ minWidth: '1000px' }}>
                        <thead style={{ position: 'sticky', top: 0, zIndex: 1000, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)' }}>
                            <tr>
                                <th style={{ width: '15%', padding: '0.5rem', textAlign: 'left' }}>คนขับ</th>
                                <th style={{ width: '10%', padding: '0.5rem', textAlign: 'center' }}>จำนวนเที่ยว</th>
                                <th style={{ width: '10%', padding: '0.5rem', textAlign: 'right' }}>ราคา</th>
                                <th style={{ width: '9%', padding: '0.5rem', textAlign: 'right' }}>น้ำมัน</th>
                                <th style={{ width: '9%', padding: '0.5rem', textAlign: 'right' }}>ค่าจ้าง</th>
                                <th style={{ width: '9%', padding: '0.5rem', textAlign: 'right' }}>ค่าซ่อม</th>
                                <th style={{ width: '9%', padding: '0.5rem', textAlign: 'right' }}>ตะกร้า</th>
                                <th style={{ width: '9%', padding: '0.5rem', textAlign: 'right' }}>แบ่ง</th>
                                <th style={{ width: '9%', padding: '0.5rem', textAlign: 'right' }}>เบิก</th>
                                <th style={{ width: '11%', padding: '0.5rem', textAlign: 'center' }}>กำไรสุทธิ</th>
                            </tr>
                        </thead>
                        <tbody style={{ fontSize: '0.8rem' }}>
                            {driversStats.map(d => (
                                <tr key={d.name} className="trip-row-hover">
                                    <td style={{ padding: '0.75rem 0.5rem', color: 'var(--primary)', fontWeight: '600', textAlign: 'left' }}>{d.name}</td>
                                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>{d.trips} เที่ยว</td>
                                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>{d.price > 0 ? d.price.toLocaleString() : '-'}</td>
                                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: 'var(--danger)' }}>{d.fuel > 0 ? d.fuel.toLocaleString() : '-'}</td>
                                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: 'var(--danger)' }}>{d.wage > 0 ? d.wage.toLocaleString() : '-'}</td>
                                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: 'var(--danger)' }}>{d.maintenance > 0 ? d.maintenance.toLocaleString() : '-'}</td>
                                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: 'var(--success)' }}>{d.basket > 0 ? d.basket.toLocaleString() : '-'}</td>
                                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: 'var(--danger)' }}>{d.basketShare > 0 ? d.basketShare.toLocaleString() : '-'}</td>
                                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: 'var(--warning)' }}>{d.advance > 0 ? d.advance.toLocaleString() : '-'}</td>
                                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                                        <span className={`badge ${d.profit >= 0 ? 'badge-profit' : 'badge-loss'}`} style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', float: 'none', display: 'inline-block', minWidth: '70px' }}>
                                            {Math.round(d.profit).toLocaleString()}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {driversStats.length === 0 && (
                                <tr>
                                    <td colSpan="10" style={{ padding: '2rem', color: 'var(--text-dim)', opacity: 0.4, fontSize: '0.8rem', textAlign: 'center' }}>
                                        ไม่มีรายชื่อวิ่งงานสำหรับรอบบิลนี้
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        <tfoot style={{ position: 'sticky', bottom: 0, background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(20px)', borderTop: '2px solid var(--primary-glow)', zIndex: 20 }}>
                            <tr style={{ fontWeight: '800' }}>
                                <td style={{ padding: '0.75rem 0.5rem', color: 'var(--primary)', textAlign: 'left', fontFamily: "'Chakra Petch', sans-serif", fontSize: '0.9rem' }}>
                                    <div>รวมสรุป</div>
                                    <div style={{ fontSize: '0.7rem', color: 'white', opacity: 0.8 }}>({overviewMetrics.totalTrips} เที่ยว)</div>
                                </td>
                                <td></td>
                                <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontFamily: "'Outfit', sans-serif" }}>฿{overviewMetrics.totalRevenue.toLocaleString()}</td>
                                <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: 'var(--danger)', fontFamily: "'Outfit', sans-serif" }}>฿{overviewMetrics.totalFuel.toLocaleString()}</td>
                                <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: 'var(--danger)', fontFamily: "'Outfit', sans-serif" }}>฿{overviewMetrics.totalWages.toLocaleString()}</td>
                                <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: 'var(--danger)', fontFamily: "'Outfit', sans-serif" }}>฿{overviewMetrics.totalMaintenance.toLocaleString()}</td>
                                <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: 'var(--success)', fontFamily: "'Outfit', sans-serif" }}>฿{overviewMetrics.totalBaskets.toLocaleString()}</td>
                                <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: 'var(--danger)', fontFamily: "'Outfit', sans-serif" }}>฿{overviewMetrics.totalBasketShare.toLocaleString()}</td>
                                <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: 'var(--warning)', fontFamily: "'Outfit', sans-serif" }}>฿{overviewMetrics.totalAdvances.toLocaleString()}</td>
                                <td style={{ padding: '0.5rem 0' }}>
                                    <div className={`badge ${overviewMetrics.totalProfit >= 0 ? 'badge-profit' : 'badge-loss'}`} style={{ fontSize: '0.85rem', width: '90%', margin: '0 auto', display: 'flex', justifyContent: 'center' }}>
                                        ฿{Math.round(overviewMetrics.totalProfit).toLocaleString()}
                                    </div>
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}



            {selectedDriverForSlip && (
                <SalarySlip
                    driverName={selectedDriverForSlip.name}
                    trips={selectedDriverForSlip.trips}
                    cnDeduction={selectedDriverForSlip.cn}
                    onClose={() => setSelectedDriverForSlip(null)}
                    period={`20 ${months[(currentMonth - 1 + 12) % 12]} - 19 ${months[currentMonth]} ${currentYear}`}
                />
            )}

            {selectedDriverForHistory && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div className="glass-card" style={{ width: '100%', maxWidth: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
                        <div className="header" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <div>
                                <h3 style={{ fontSize: '1.25rem' }}>ประวัติงาน: {selectedDriverForHistory.name}</h3>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>รวมทั้งสิ้น {selectedDriverForHistory.trips.length} เที่ยว</p>
                            </div>
                            <button className="btn-icon" onClick={() => setSelectedDriverForHistory(null)}><X size={24} /></button>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {selectedDriverForHistory.trips.map((trip, idx) => (
                                    <div key={trip.id || idx} style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <p style={{ fontWeight: '700', color: 'var(--primary)' }}>{trip.date}</p>
                                            <p style={{ fontSize: '0.9rem' }}>{trip.route}</p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <p style={{ fontWeight: '800' }}>฿{(parseFloat(trip.wage) || 0).toLocaleString()}</p>
                                            <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>ราคาค่าเที่ยว: ฿{(parseFloat(trip.price) || 0).toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <style>{`
                .clickable-row:hover { background: rgba(255,255,255,0.05) !important; }
                .trip-row-hover:hover { background: rgba(255,255,255,0.02); }
                .bill-icon-btn { margin-left: 4px; color: var(--primary); opacity: 0.7; }
                .bill-icon-btn:hover { opacity: 1; transform: scale(1.1); }
                .bill-thumbnail-link { display: inline-flex; align-items: center; justify-content: center; }
                .receipt-thumbnail {
                    width: 32px;
                    height: 32px;
                    border-radius: 6px;
                    object-fit: cover;
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
                    cursor: pointer;
                    transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s, border-color 0.2s;
                }
                .receipt-thumbnail:hover {
                    transform: scale(2.5);
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.6);
                    border-color: var(--primary);
                    position: relative;
                    z-index: 999;
                }
            `}</style>
        </div>
    );
};

export default MonthlyTable;
