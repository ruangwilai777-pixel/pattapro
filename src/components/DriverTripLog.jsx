import React from 'react';

const DriverTripLog = ({ trips, currentMonth, currentYear, driverName, isDriverCopy = false }) => {
    const monthNames = [
        'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
        'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];

    const dayNames = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

    const logData = React.useMemo(() => {
        const startDate = new Date(currentYear, currentMonth - 1, 20);
        const endDate = new Date(currentYear, currentMonth, 19);

        const days = [];
        let curr = new Date(startDate);

        while (curr <= endDate) {
            const year = curr.getFullYear();
            const month = String(curr.getMonth() + 1).padStart(2, '0');
            const day = String(curr.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;
            const dayTrips = trips.filter(t => t.date === dateStr);

            days.push({
                date: new Date(curr),
                dateStr,
                dayNum: curr.getDate(),
                dayLabel: dayNames[curr.getDay()],
                monthLabel: monthNames[curr.getMonth()],
                trips: dayTrips
            });
            curr.setDate(curr.getDate() + 1);
        }
        return days;
    }, [trips, currentMonth, currentYear]);

    // Reliable Split: Look for where the month actualy changes in our sequential dates
    const transitionIndex = logData.findIndex((d, i) => i > 0 && d.date.getMonth() !== logData[i - 1].date.getMonth());

    // Fallback if no transition (shouldn't happen with 20th-19th range, but for safety)
    const part1 = transitionIndex !== -1 ? logData.slice(0, transitionIndex) : logData;
    const part2 = transitionIndex !== -1 ? logData.slice(transitionIndex) : [];

    const renderTable = (data, title) => {
        const totalWage = data.reduce((sum, day) => {
            return sum + day.trips.reduce((s, t) => s + (isDriverCopy ? (t.wage || 0) : (t.price || 0)), 0);
        }, 0);

        const totalBasket = data.reduce((sum, day) => {
            return sum + day.trips.reduce((s, t) => s + (isDriverCopy ? (t.basketShare || 0) : (t.basket || 0)), 0);
        }, 0);

        return (
            <div className="trip-log-table-container" style={{ flex: 1, minWidth: '280px', width: '100%' }}>
                <div style={{
                    textAlign: 'center',
                    fontWeight: '700',
                    padding: '10px',
                    border: '1px solid #cbd5e1',
                    borderBottom: 'none',
                    background: '#f8fafc',
                    fontSize: '14px',
                    color: '#1e293b',
                    borderRadius: '12px 12px 0 0',
                }}>
                    {title}
                </div>
                <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                }}>
                    <thead>
                        <tr style={{ background: '#f8fafc', color: '#1e293b' }}>
                            <th style={{ border: '1px solid #cbd5e1', padding: '10px 4px', width: '35px', fontWeight: '700' }}>ที่</th>
                            <th style={{ border: '1px solid #cbd5e1', padding: '10px 4px', width: '45px', fontWeight: '700' }}>วัน</th>
                            <th style={{ border: '1px solid #cbd5e1', padding: '10px 8px', fontWeight: '700', textAlign: 'left' }}>สายวิ่ง</th>
                            <th style={{ border: '1px solid #cbd5e1', padding: '10px 8px', width: '85px', fontWeight: '700', textAlign: 'right' }}>ค่าเที่ยว</th>
                            <th style={{ border: '1px solid #cbd5e1', padding: '10px 8px', width: '85px', fontWeight: '700', textAlign: 'right' }}>ตะกร้า</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((day, idx) => {
                            return (
                                <React.Fragment key={day.dateStr}>
                                    {day.trips.length === 0 ? (
                                        <tr style={{ background: '#fff' }}>
                                            <td style={{ border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: '700', color: '#1e293b', padding: '8px 4px' }}>{day.dayNum}</td>
                                            <td style={{ border: '1px solid #cbd5e1', textAlign: 'center', color: '#64748b', padding: '8px 4px' }}>{day.dayLabel}</td>
                                            <td style={{ border: '1px solid #cbd5e1', textAlign: 'center', color: '#cbd5e1', padding: '8px 8px' }}>-</td>
                                            <td style={{ border: '1px solid #cbd5e1', textAlign: 'right', color: '#cbd5e1', padding: '8px 8px' }}>-</td>
                                            <td style={{ border: '1px solid #cbd5e1', textAlign: 'right', color: '#cbd5e1', padding: '8px 8px' }}>-</td>
                                        </tr>
                                    ) : (
                                        day.trips.map((t, tIdx) => (
                                            <tr key={`${day.dateStr}-${t.id || tIdx}`} style={{ background: '#fff' }}>
                                                {tIdx === 0 ? (
                                                    <>
                                                        <td rowSpan={day.trips.length} style={{ border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: '700', color: '#1e293b', padding: '8px 4px' }}>{day.dayNum}</td>
                                                        <td rowSpan={day.trips.length} style={{ border: '1px solid #cbd5e1', textAlign: 'center', color: '#64748b', padding: '8px 4px' }}>{day.dayLabel}</td>
                                                    </>
                                                ) : null}
                                                <td style={{ border: '1px solid #cbd5e1', textAlign: 'left', color: '#1e293b', padding: '8px 8px' }}>{t.route}</td>
                                                <td style={{ border: '1px solid #cbd5e1', textAlign: 'right', color: '#1e293b', fontWeight: '700', padding: '8px 8px' }}>
                                                    {isDriverCopy ? (parseFloat(t.wage || 0)).toLocaleString() : (parseFloat(t.price || 0)).toLocaleString()}
                                                </td>
                                                <td style={{ border: '1px solid #cbd5e1', textAlign: 'right', color: '#1e293b', fontWeight: '700', padding: '8px 8px' }}>
                                                    {isDriverCopy ? (parseFloat(t.basketShare || 0)).toLocaleString() : (parseFloat(t.basket || 0)).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                    <tfoot>
                        <tr style={{ background: '#f8fafc', fontWeight: '700' }}>
                            <td colSpan={3} style={{ border: '1px solid #cbd5e1', textAlign: 'right', padding: '10px 8px', color: '#1e293b' }}>รวม:</td>
                            <td style={{ border: '1px solid #cbd5e1', textAlign: 'right', padding: '10px 8px', color: '#1e293b', fontSize: '14px' }}>{totalWage.toLocaleString()}</td>
                            <td style={{ border: '1px solid #cbd5e1', textAlign: 'right', padding: '10px 8px', color: '#1e293b', fontSize: '14px' }}>{totalBasket.toLocaleString()}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        );
    };

    const prevMonthIdx = (currentMonth - 1 + 12) % 12;
    const currMonthIdx = currentMonth;

    return (
        <div className="trip-log-card" style={{
            width: '100%',
            maxWidth: '1200px',
            margin: '0 auto',
            background: 'white',
            padding: '1.5rem',
            borderRadius: '1.25rem',
            color: 'black',
            fontFamily: "'Sarabun', sans-serif",
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02)',
            border: '1.5px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'visible'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '12px', borderBottom: '2px solid #f1f5f9' }}>
                <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800', background: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    🗓️ ตารางลงงานรายวัน: {driverName}
                </h2>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', background: '#f1f5f9', padding: '4px 12px', borderRadius: '20px' }}>
                    รอบประจำเดือน {monthNames[currMonthIdx]} {currentYear + 543}
                </div>
            </div>

            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'center' }}>
                {part1.length > 0 && renderTable(part1, `ช่วงวันที่ 20 - ${part1[part1.length - 1]?.dayNum} ${monthNames[prevMonthIdx]}`)}
                {part2.length > 0 && renderTable(part2, `ช่วงวันที่ 1 - 19 ${monthNames[currMonthIdx]}`)}
            </div>

            {/* GRAND TOTAL SUMMARY AT BOTTOM */}
            <div className="grand-total-container" style={{ marginTop: '30px', border: '1px solid #cbd5e1', padding: '20px', borderRadius: '18px', background: '#f8fafc' }}>
                <div style={{ textAlign: 'center', fontWeight: '700', fontSize: '18px', marginBottom: '15px', textDecoration: 'underline', color: '#1e293b' }}>
                    สรุปยอดรวมสุทธิประจำรอบบิล
                </div>
                <div className="total-summary-grid" style={{ display: 'flex', justifyContent: 'space-around', gap: '15px', flexWrap: 'wrap' }}>
                    {(() => {
                        const grandTotalWage = trips.reduce((sum, t) => sum + (isDriverCopy ? (t.wage || 0) : (t.price || 0)), 0);
                        const grandTotalBasket = trips.reduce((sum, t) => sum + (isDriverCopy ? (t.basketShare || 0) : (t.basket || 0)), 0);
                        const totalAll = grandTotalWage + grandTotalBasket;

                        return (
                            <>
                                <div className="total-box" style={{
                                    flex: '1 1 150px',
                                    textAlign: 'center',
                                    border: '1px solid #cbd5e1',
                                    padding: '16px',
                                    background: 'linear-gradient(to bottom, #ffffff, #f8fafc)',
                                    borderRadius: '16px',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                                }}>
                                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{isDriverCopy ? 'ค่าจ้าง' : 'ค่าเที่ยว'}</div>
                                    <div style={{ fontSize: '22px', fontWeight: '800', color: '#1e293b' }}>฿{grandTotalWage.toLocaleString()}</div>
                                </div>
                                <div className="total-box" style={{
                                    flex: '1 1 150px',
                                    textAlign: 'center',
                                    border: '1px solid #cbd5e1',
                                    padding: '16px',
                                    background: 'linear-gradient(to bottom, #ffffff, #f8fafc)',
                                    borderRadius: '16px',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                                }}>
                                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{isDriverCopy ? 'แบ่งตะกร้า' : 'ค่าตะกร้า'}</div>
                                    <div style={{ fontSize: '22px', fontWeight: '800', color: '#1e293b' }}>฿{grandTotalBasket.toLocaleString()}</div>
                                </div>
                                <div className="total-box highlight" style={{
                                    flex: '1 1 100%',
                                    textAlign: 'center',
                                    border: '1px solid #334155',
                                    padding: '20px',
                                    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                                    borderRadius: '16px',
                                    boxShadow: '0 10px 15px -3px rgba(30, 41, 59, 0.2)'
                                }}>
                                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>รวมยอดสุทธิทั้งสิ้น</div>
                                    <div style={{ fontSize: '32px', fontWeight: '900', color: '#ffffff', letterSpacing: '-1px' }}>฿{totalAll.toLocaleString()}</div>
                                </div>
                            </>
                        );
                    })()}
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @media screen and (max-width: 600px) {
                    .trip-log-card { padding: 0.75rem !important; border-radius: 1rem !important; }
                    .trip-log-table-container { min-width: 100% !important; }
                    table { font-size: 11px !important; }
                    th, td { padding: 4px 2px !important; }
                    .total-summary-grid { flex-direction: column !important; }
                    .total-box { flex: 1 1 auto !important; width: 100% !important; }
                    h2 { font-size: 16px !important; }
                }
                @media print {
                    .trip-log-card { 
                        width: 100% !important; 
                        min-width: 0 !important; 
                        margin: 0 !important; 
                        box-shadow: none !important;
                        padding: 0 !important;
                        border: none !important;
                    }
                    button { display: none !important; }
                }
            `}} />
        </div>
    );
};

export default DriverTripLog;
