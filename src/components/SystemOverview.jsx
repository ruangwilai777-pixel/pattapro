import React, { useMemo } from 'react';
import {
    TrendingUp, TrendingDown, Truck, Users, Fuel, Wrench,
    ShoppingBasket, Banknote, BarChart2, Award, ArrowUpRight,
    ArrowDownRight, ChevronLeft, ChevronRight, Activity
} from 'lucide-react';

const months = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const fmt = (n) => Math.round(n).toLocaleString('th-TH');
const pct = (a, b) => b > 0 ? ((a / b) * 100).toFixed(1) : '0.0';

const KpiCard = ({ icon: Icon, label, value, sub, color, bg, delay }) => (
    <div style={{
        background: bg,
        border: `1px solid ${color}33`,
        borderRadius: '20px',
        padding: '1.25rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        animation: `fadeSlideUp 0.5s cubic-bezier(0.23,1,0.32,1) ${delay}s both`,
        boxShadow: `0 8px 32px ${color}18`,
        position: 'relative',
        overflow: 'hidden',
    }}>
        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', borderRadius: '50%', background: `${color}10`, pointerEvents: 'none' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: '700', color: color, textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={18} color={color} />
            </div>
        </div>
        <div style={{ fontSize: '1.6rem', fontWeight: '900', color: 'var(--text-main)', letterSpacing: '-1px' }}>{value}</div>
        {sub && <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '600' }}>{sub}</div>}
    </div>
);

const RatioBar = ({ label, value, max, color, icon: Icon }) => {
    const pctVal = max > 0 ? Math.min((value / max) * 100, 100) : 0;
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Icon size={13} color={color} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: '600' }}>{label}</span>
                </div>
                <span style={{ fontSize: '0.78rem', fontWeight: '800', color: color }}>฿{fmt(value)} <span style={{ color: '#475569', fontWeight: '600' }}>({pctVal.toFixed(1)}%)</span></span>
            </div>
            <div style={{ height: '6px', borderRadius: '6px', background: 'var(--glass-border)', overflow: 'hidden' }}>
                <div style={{
                    height: '100%', width: `${pctVal}%`, borderRadius: '6px',
                    background: `linear-gradient(90deg, ${color}99, ${color})`,
                    transition: 'width 0.8s cubic-bezier(0.23,1,0.32,1)',
                    boxShadow: `0 0 8px ${color}60`
                }} />
            </div>
        </div>
    );
};

const SystemOverview = ({ trips = [], stats = {}, currentMonth, currentYear, onMonthChange, cnDeductions = {} }) => {

    // Driver performance aggregation
    const driverStats = useMemo(() => {
        const map = {};
        trips.forEach(t => {
            const name = (t.driverName || 'ไม่ระบุ').trim();
            if (!map[name]) map[name] = { name, trips: 0, revenue: 0, profit: 0, fuel: 0, wage: 0 };
            map[name].trips += 1;
            map[name].revenue += (t.price || 0) + (t.basket || 0);
            map[name].profit += (t.profit || 0);
            map[name].fuel += (t.fuel || 0);
            map[name].wage += (t.wage || 0);
        });
        return Object.values(map).sort((a, b) => b.revenue - a.revenue);
    }, [trips]);

    // Route aggregation
    const routeStats = useMemo(() => {
        const map = {};
        trips.forEach(t => {
            const route = (t.route || 'ไม่ระบุสาย').trim();
            if (!map[route]) map[route] = { route, trips: 0, revenue: 0 };
            map[route].trips += 1;
            map[route].revenue += (t.price || 0) + (t.basket || 0);
        });
        return Object.values(map).sort((a, b) => b.trips - a.trips).slice(0, 8);
    }, [trips]);

    const {
        totalRevenue = 0, totalProfit = 0, totalTrips = 0, totalNetPay = 0,
        totalPrice = 0, totalBasket = 0, totalFuel = 0, totalWage = 0,
        totalMaintenance = 0, totalBasketShare = 0, totalStaffAdvance = 0
    } = stats;

    const profitMargin = pct(totalProfit, totalRevenue);
    const avgPerTrip = totalTrips > 0 ? totalRevenue / totalTrips : 0;

    return (
        <div style={{ padding: '0 0 3rem 0' }}>
            <style>{`
                @keyframes fadeSlideUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .sys-driver-row:hover { background: var(--glass-border) !important; }
                .sys-route-row:hover  { background: var(--glass-border) !important; }
            `}</style>

            {/* ─── Month Selector ─── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--glass-border)', border: '1px solid var(--glass-border)', borderRadius: '14px', padding: '4px', gap: '0' }}>
                    <button onClick={() => onMonthChange(-1)} style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', borderRadius: '10px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--glass-border)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <ChevronLeft size={16} />
                    </button>
                    <span style={{ minWidth: '140px', textAlign: 'center', fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-main)' }}>
                        {months[currentMonth]} {currentYear}
                    </span>
                    <button onClick={() => onMonthChange(1)} style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', borderRadius: '10px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--glass-border)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <ChevronRight size={16} />
                    </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: '#10b981', fontWeight: '700' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', animation: 'pulse 2s infinite' }} />
                    รอบบิล 20 {months[(currentMonth - 1 + 12) % 12]} – 19 {months[currentMonth]}
                </div>
            </div>

            {/* ─── KPI Cards ─── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
                <KpiCard icon={TrendingUp}   label="รายได้รวม"        value={`฿${fmt(totalRevenue)}`}  sub={`เฉลี่ย ฿${fmt(avgPerTrip)}/เที่ยว`}  color="#38bdf8" bg="rgba(56,189,248,0.07)"  delay={0.05} />
                <KpiCard icon={Award}        label="กำไรสุทธิ"        value={`฿${fmt(totalProfit)}`}   sub={`Margin ${profitMargin}%`}             color={totalProfit >= 0 ? '#22c55e' : '#f43f5e'} bg={totalProfit >= 0 ? "rgba(34,197,94,0.07)" : "rgba(244,63,94,0.07)"} delay={0.1} />
                <KpiCard icon={Truck}        label="จำนวนเที่ยว"      value={`${totalTrips} เที่ยว`}   sub={`${driverStats.length} คนขับ`}         color="#a78bfa" bg="rgba(167,139,250,0.07)" delay={0.15} />
                <KpiCard icon={Users}        label="ยอดจ่ายพนักงาน"   value={`฿${fmt(totalNetPay)}`}   sub="รวมเงินเดือน + ส่วนแบ่ง"              color="#fb923c" bg="rgba(251,146,60,0.07)"  delay={0.2} />
            </div>

            {/* ─── Financial Detail + Ratio Bars ─── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.75rem' }}>

                {/* Financial Detail */}
                <div style={{ background: 'var(--glass-border)', border: '1px solid var(--glass-border)', borderRadius: '20px', padding: '1.5rem', animation: 'fadeSlideUp 0.5s .25s both' }}>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BarChart2 size={16} color="#818cf8" /> รายละเอียดการเงินประจำเดือน
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                        {[
                            { label: 'ค่าเที่ยว (Revenue)',          val: totalPrice,       color: '#38bdf8', plus: true },
                            { label: 'ค่าตะกร้า',                     val: totalBasket,      color: '#34d399', plus: true },
                            { label: 'ค่าน้ำมัน',                     val: totalFuel,        color: '#f87171', plus: false },
                            { label: 'ค่าจ้างพนักงาน',               val: totalWage,        color: '#fb923c', plus: false },
                            { label: 'ค่าซ่อมบำรุง',                 val: totalMaintenance, color: '#e879f9', plus: false },
                            { label: 'ส่วนแบ่งตะกร้าคืนพนักงาน',    val: totalBasketShare, color: '#fbbf24', plus: false },
                            { label: 'ยอดเบิกล่วงหน้า',              val: totalStaffAdvance,color: 'var(--text-dim)', plus: false },
                        ].map(({ label, val, color, plus }, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0', borderBottom: '1px solid var(--glass-border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ width: '3px', height: '16px', borderRadius: '3px', background: color }} />
                                    <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: '600' }}>{label}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    {plus ? <ArrowUpRight size={12} color={color} /> : <ArrowDownRight size={12} color={color} />}
                                    <span style={{ fontSize: '0.85rem', fontWeight: '800', color: color }}>฿{fmt(val)}</span>
                                </div>
                            </div>
                        ))}
                        {/* Net Profit Total */}
                        <div style={{ marginTop: '0.75rem', padding: '0.85rem 1rem', borderRadius: '14px', background: totalProfit >= 0 ? 'rgba(34,197,94,0.12)' : 'rgba(244,63,94,0.12)', border: `1px solid ${totalProfit >= 0 ? '#22c55e40' : '#f43f5e40'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {totalProfit >= 0 ? <TrendingUp size={15} color="#22c55e" /> : <TrendingDown size={15} color="#f43f5e" />}
                                <span style={{ fontSize: '0.85rem', fontWeight: '800', color: totalProfit >= 0 ? '#22c55e' : '#f43f5e' }}>กำไรสุทธิรวม</span>
                            </div>
                            <span style={{ fontSize: '1.1rem', fontWeight: '900', color: totalProfit >= 0 ? '#22c55e' : '#f43f5e' }}>฿{fmt(totalProfit)}</span>
                        </div>
                    </div>
                </div>

                {/* Ratio Bars */}
                <div style={{ background: 'var(--glass-border)', border: '1px solid var(--glass-border)', borderRadius: '20px', padding: '1.5rem', animation: 'fadeSlideUp 0.5s .3s both' }}>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Activity size={16} color="#818cf8" /> สัดส่วนต้นทุนต่อรายได้
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                        <RatioBar label="ค่าน้ำมัน"       value={totalFuel}        max={totalRevenue} color="#f87171" icon={Fuel} />
                        <RatioBar label="ค่าจ้างพนักงาน"  value={totalWage}        max={totalRevenue} color="#fb923c" icon={Users} />
                        <RatioBar label="ค่าซ่อมบำรุง"    value={totalMaintenance} max={totalRevenue} color="#e879f9" icon={Wrench} />
                        <RatioBar label="ส่วนแบ่งตะกร้า"  value={totalBasketShare} max={totalRevenue} color="#fbbf24" icon={ShoppingBasket} />
                        <RatioBar label="ยอดเบิกล่วงหน้า" value={totalStaffAdvance}max={totalRevenue} color="#94a3b8" icon={Banknote} />

                        {/* Profit margin bar */}
                        <div style={{ marginTop: '0.5rem', padding: '0.85rem 1rem', borderRadius: '14px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Award size={13} color="#22c55e" />
                                    <span style={{ fontSize: '0.75rem', color: '#22c55e', fontWeight: '700' }}>Profit Margin</span>
                                </div>
                                <span style={{ fontSize: '0.85rem', fontWeight: '900', color: '#22c55e' }}>{profitMargin}%</span>
                            </div>
                            <div style={{ height: '8px', borderRadius: '8px', background: 'var(--glass-border)', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${Math.min(parseFloat(profitMargin), 100)}%`, borderRadius: '8px', background: 'linear-gradient(90deg, #16a34a, #22c55e)', boxShadow: '0 0 12px #22c55e60', transition: 'width 0.8s cubic-bezier(0.23,1,0.32,1)' }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── Driver Performance ─── */}
            <div style={{ background: 'var(--glass-border)', border: '1px solid var(--glass-border)', borderRadius: '20px', padding: '1.5rem', marginBottom: '1rem', animation: 'fadeSlideUp 0.5s .35s both' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={16} color="#a78bfa" /> ประสิทธิภาพคนขับรายเดือน
                </h3>
                {driverStats.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#475569', padding: '2rem', fontSize: '0.82rem' }}>ไม่มีข้อมูลคนขับในรอบนี้</div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                            <thead>
                                <tr style={{ background: 'var(--glass-border)' }}>
                                    {['คนขับ','เที่ยว','รายได้','น้ำมัน','ค่าจ้าง','กำไร','Margin'].map(h => (
                                        <th key={h} style={{ padding: '0.6rem 0.75rem', textAlign: h === 'คนขับ' ? 'left' : 'right', color: '#64748b', fontWeight: '700', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--glass-border)', whiteSpace: 'nowrap' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {driverStats.map((d, i) => {
                                    const margin = d.revenue > 0 ? ((d.profit / d.revenue) * 100).toFixed(1) : '0.0';
                                    const profitColor = d.profit >= 0 ? '#22c55e' : '#f43f5e';
                                    return (
                                        <tr key={d.name} className="sys-driver-row" style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background .2s', cursor: 'default' }}>
                                            <td style={{ padding: '0.65rem 0.75rem', fontWeight: '700', color: '#a78bfa', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ width: '22px', height: '22px', borderRadius: '8px', background: 'rgba(167,139,250,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: '900', color: '#a78bfa' }}>{i + 1}</div>
                                                {d.name}
                                            </td>
                                            <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right', color: 'var(--text-main)', fontWeight: '700' }}>{d.trips}</td>
                                            <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right', color: '#38bdf8', fontWeight: '700' }}>฿{fmt(d.revenue)}</td>
                                            <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right', color: '#f87171' }}>฿{fmt(d.fuel)}</td>
                                            <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right', color: '#fb923c' }}>฿{fmt(d.wage)}</td>
                                            <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right', color: profitColor, fontWeight: '800' }}>฿{fmt(d.profit)}</td>
                                            <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>
                                                <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: '800', background: parseFloat(margin) >= 0 ? 'rgba(34,197,94,0.15)' : 'rgba(244,63,94,0.15)', color: profitColor }}>{margin}%</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ─── Route Summary ─── */}
            <div style={{ background: 'var(--glass-border)', border: '1px solid var(--glass-border)', borderRadius: '20px', padding: '1.5rem', animation: 'fadeSlideUp 0.5s .4s both' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Truck size={16} color="#38bdf8" /> สรุปสายงานรายเดือน
                </h3>
                {routeStats.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#475569', padding: '2rem', fontSize: '0.82rem' }}>ไม่มีข้อมูลสายงานในรอบนี้</div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                        {routeStats.map((r, i) => {
                            const barPct = routeStats[0].trips > 0 ? (r.trips / routeStats[0].trips) * 100 : 0;
                            return (
                                <div key={r.route} className="sys-route-row" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.65rem 0.5rem', borderBottom: i < routeStats.length - 1 ? '1px solid var(--glass-border)' : 'none', transition: 'background .2s', borderRadius: '8px' }}>
                                    <div style={{ width: '20px', textAlign: 'right', fontSize: '0.7rem', color: '#475569', fontWeight: '700', flexShrink: 0 }}>#{i + 1}</div>
                                    <div style={{ flex: '0 0 160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#e2e8f0' }}>{r.route}</span>
                                    </div>
                                    <div style={{ flex: 1, height: '6px', borderRadius: '6px', background: 'var(--glass-border)', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${barPct}%`, borderRadius: '6px', background: 'linear-gradient(90deg, #818cf8, #6366f1)', transition: 'width 0.6s cubic-bezier(0.23,1,0.32,1)' }} />
                                    </div>
                                    <div style={{ flexShrink: 0, textAlign: 'right', minWidth: '80px' }}>
                                        <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#a78bfa' }}>{r.trips} เที่ยว</span>
                                    </div>
                                    <div style={{ flexShrink: 0, textAlign: 'right', minWidth: '100px' }}>
                                        <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#38bdf8' }}>฿{fmt(r.revenue)}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SystemOverview;
