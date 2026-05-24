import React from 'react';
import { Download, ChevronLeft, ChevronRight, Plus, Edit2, Trash2, ReceiptText, Camera, History, X } from 'lucide-react';
import SalarySlip from './SalarySlip';

const MonthlyTable = ({ currentMonth, currentYear, trips, onMonthChange, onExport, onSelectDate, onEditTrip, onDeleteTrip, cnDeductions, setCnDeductions, showSlips = true, onlySlips = false, onBulkUpdateRoutePrice, routePresets }) => {
    const [selectedDriverForSlip, setSelectedDriverForSlip] = React.useState(null);
    const [selectedDriverForHistory, setSelectedDriverForHistory] = React.useState(null);

    const [isBulkOpen, setIsBulkOpen] = React.useState(false);
    const [bulkMonth, setBulkMonth] = React.useState(currentMonth);
    const [bulkYear, setBulkYear] = React.useState(currentYear);
    const [bulkRoute, setBulkRoute] = React.useState('');
    const [bulkPrice, setBulkPrice] = React.useState('');
    const [isBulkLoading, setIsBulkLoading] = React.useState(false);

    React.useEffect(() => {
        setBulkMonth(currentMonth);
        setBulkYear(currentYear);
    }, [currentMonth, currentYear]);

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
                <div className="header" style={{ padding: '1rem 1.5rem', marginBottom: '0', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            className="btn btn-outline"
                            style={{ borderColor: 'var(--primary)', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                            onClick={() => setIsBulkOpen(true)}
                        >
                            <Plus size={18} />
                            ป้อนสายรถด่วน (Bulk)
                        </button>
                        <button className="btn btn-outline" onClick={onExport}>
                            <Download size={18} />
                            Export รอบนี้
                        </button>
                    </div>
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
                                                    const url = `${window.location.origin}${window.location.pathname}#/driver?view=${encodeURIComponent(name)}`;
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

            {!onlySlips && (
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

            {isBulkOpen && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div className="glass-card fade-in" style={{ width: '100%', maxWidth: '500px', maxHeight: '95vh', display: 'flex', flexDirection: 'column', borderRadius: '1.5rem', background: 'var(--glass-bg)', color: 'var(--text-main)', border: '1px solid var(--glass-border)', backdropFilter: 'blur(24px)', boxShadow: 'var(--glass-shadow)' }}>
                        <div className="header" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <div>
                                <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '800' }}>
                                    <Plus size={20} color="var(--primary)" /> ป้อนสายรถด่วน (Bulk Update)
                                </h3>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>อัปเดตหรือเพิ่มราคาค่าเที่ยวสายรถรวดเดียวทั้งเดือน</p>
                            </div>
                            <button className="btn-icon" onClick={() => setIsBulkOpen(false)}><X size={24} /></button>
                        </div>
                        <form onSubmit={handleBulkSubmit} style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            
                            {/* เดือน/ปี */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-dim)' }}>เลือกเดือน / ปี</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <select
                                        className="input-premium-compact"
                                        style={{ height: '38px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px', padding: '0 10px', fontSize: '0.9rem' }}
                                        value={bulkMonth}
                                        onChange={(e) => setBulkMonth(parseInt(e.target.value))}
                                    >
                                        {months.map((m, idx) => (
                                            <option key={idx} value={idx}>{m}</option>
                                        ))}
                                    </select>
                                    <select
                                        className="input-premium-compact"
                                        style={{ height: '38px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px', padding: '0 10px', fontSize: '0.9rem' }}
                                        value={bulkYear}
                                        onChange={(e) => setBulkYear(parseInt(e.target.value))}
                                    >
                                        {Array.from({ length: 5 }, (_, i) => currentYear - 2 + i).map((y) => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* สายรถ */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-dim)' }}>สายรถ (เส้นทาง)</label>
                                <input
                                    type="text"
                                    list="bulk-route-options"
                                    className="input-premium-compact"
                                    style={{ height: '38px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px', padding: '0 12px', fontSize: '0.9rem', width: '100%' }}
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
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-dim)' }}>จำนวนเงินค่าเที่ยวตายตัว (บาท)</label>
                                <input
                                    type="number"
                                    className="input-premium-compact"
                                    style={{ height: '38px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px', padding: '0 12px', fontSize: '0.9rem', width: '100%' }}
                                    placeholder="ระบุจำนวนเงินค่าเที่ยว..."
                                    value={bulkPrice}
                                    onChange={(e) => setBulkPrice(e.target.value)}
                                />
                            </div>

                            {/* ปุ่มกดยืนยัน */}
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    className="btn btn-outline"
                                    style={{ padding: '0.5rem 1.5rem', height: '40px' }}
                                    onClick={() => setIsBulkOpen(false)}
                                    disabled={isBulkLoading}
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    style={{
                                        padding: '0.5rem 1.5rem',
                                        height: '40px',
                                        background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                                        border: 'none',
                                        color: 'white',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        borderRadius: '8px'
                                    }}
                                    disabled={isBulkLoading}
                                >
                                    {isBulkLoading ? 'กำลังบันทึก...' : 'บันทึกพร้อมกันทั้งหมด'}
                                </button>
                            </div>
                        </form>
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
