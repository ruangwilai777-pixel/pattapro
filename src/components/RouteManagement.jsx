import React, { useState, useEffect } from 'react';
import { Settings, Plus, Trash2, Save, X } from 'lucide-react';

const RouteManagement = ({ routePresets: globalPresets, onSave, onDelete, currentMonth: initialMonth, currentYear: initialYear, fetchPresets }) => {
    const [formData, setFormData] = useState({ route: '', price: '', wage: '' });
    const [loading, setLoading] = useState(false);

    // Independent month state for management
    const [manageMonth, setManageMonth] = useState(initialMonth);
    const [manageYear, setManageYear] = useState(initialYear);

    // Local presets state for the managed month
    const [localPresets, setLocalPresets] = useState({});

    const months = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];

    // Sync with parent when it changes significantly
    useEffect(() => {
        setManageMonth(initialMonth);
        setManageYear(initialYear);
    }, [initialMonth, initialYear]);

    // Fetch presets when managed month changes
    useEffect(() => {
        const loadPresets = async () => {
            // If managing current month, use global props for instant speed, otherwise fetch
            if (manageMonth === initialMonth && manageYear === initialYear) {
                setLocalPresets(globalPresets);
            } else if (fetchPresets) {
                const data = await fetchPresets(manageMonth, manageYear, false); // false = don't update global state
                setLocalPresets(data || {});
            }
        };
        loadPresets();
    }, [manageMonth, manageYear, globalPresets, initialMonth, initialYear, fetchPresets]);

    const handleMonthChange = (direction) => {
        let newMonth = manageMonth + direction;
        let newYear = manageYear;
        if (newMonth < 0) { newMonth = 11; newYear -= 1; }
        if (newMonth > 11) { newMonth = 0; newYear += 1; }
        setManageMonth(newMonth);
        setManageYear(newYear);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.route) return alert('กรุณาระบุชื่อสายงาน');

        setLoading(true);
        // Use the locally selected management month/year
        const result = await onSave(formData.route, formData.price, formData.wage, manageMonth, manageYear);

        if (result.success) {
            setFormData({ route: '', price: '', wage: '' });
            alert('บันทึกเรียบร้อย');
            // Refresh local list
            if (fetchPresets) {
                const data = await fetchPresets(manageMonth, manageYear, false);
                setLocalPresets(data || {});
            }
        } else {
            alert('บันทึกไม่สำเร็จ: ' + (result.error?.message || 'Unknown error'));
        }
        setLoading(false);
    };

    const handleDelete = async (route) => {
        if (!confirm('ยืนยันลบรายการนี้?')) return;
        await onDelete(route, manageMonth, manageYear);
        // Refresh local list
        if (fetchPresets) {
            const data = await fetchPresets(manageMonth, manageYear, false);
            setLocalPresets(data || {});
        }
    };

    return (
        <div className="glass-card" style={{ padding: '1.5rem', marginTop: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', margin: 0 }}>
                    <Settings size={20} color="var(--primary)" />
                    จัดการราคา / แผนงาน (Preset)
                </h3>

                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--glass-border)', borderRadius: '0.5rem', padding: '0.25rem' }}>
                    <button onClick={() => handleMonthChange(-1)} style={{ background: 'none', border: 'none', color: 'var(--text-main)', padding: '4px 8px', cursor: 'pointer' }}>&lt;</button>
                    <div style={{ padding: '0 12px', fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 'bold', minWidth: '140px', textAlign: 'center' }}>
                        {months[manageMonth]} {manageYear}
                    </div>
                    <button onClick={() => handleMonthChange(1)} style={{ background: 'none', border: 'none', color: 'var(--text-main)', padding: '4px 8px', cursor: 'pointer' }}>&gt;</button>
                </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '10px', alignItems: 'end', marginBottom: '2rem' }}>
                <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '4px', color: 'var(--text-dim)' }}>ชื่อสายงาน</label>
                    <input
                        type="text"
                        style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', borderRadius: '0.5rem', color: 'var(--text-main)' }}
                        placeholder="เช่น ชลบุรี-ระยอง"
                        value={formData.route}
                        onChange={e => setFormData({ ...formData, route: e.target.value })}
                    />
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '4px', color: 'var(--text-dim)' }}>ค่าเที่ยว (บาท)</label>
                    <input
                        type="number"
                        style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', borderRadius: '0.5rem', color: 'var(--text-main)' }}
                        placeholder="0"
                        value={formData.price}
                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                    />
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '4px', color: 'var(--text-dim)' }}>ค่าจ้าง (บาท)</label>
                    <input
                        type="number"
                        style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', borderRadius: '0.5rem', color: 'var(--text-main)' }}
                        placeholder="0"
                        value={formData.wage}
                        onChange={e => setFormData({ ...formData, wage: e.target.value })}
                    />
                </div>
                <button type="submit" disabled={loading} className="btn-primary" style={{ height: '44px', padding: '0 1.5rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {loading ? '...' : <Save size={18} />} บันทึก
                </button>
            </form>

            <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--glass-border)', borderRadius: '0.75rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead style={{ background: 'var(--glass-border)' }}>
                        <tr>
                            <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-dim)' }}>สายงาน</th>
                            <th style={{ padding: '12px', textAlign: 'left', color: '#22c55e' }}>ค่าเที่ยว</th>
                            <th style={{ padding: '12px', textAlign: 'left', color: '#f59e0b' }}>ค่าจ้าง</th>
                            <th style={{ padding: '12px', textAlign: 'center' }}>ลบ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(localPresets).length === 0 ? (
                            <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)' }}>ยังไม่มีข้อมูลของเดือนนี้</td></tr>
                        ) : (
                            Object.entries(localPresets).map(([route, data]) => (
                                <tr key={route} style={{ borderTop: '1px solid var(--glass-border)' }}>
                                    <td style={{ padding: '12px' }}>{route}</td>
                                    <td style={{ padding: '12px', fontWeight: 'bold' }}>{parseInt(data.price).toLocaleString()}</td>
                                    <td style={{ padding: '12px' }}>{parseInt(data.wage).toLocaleString()}</td>
                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                        <button onClick={() => handleDelete(route)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', opacity: 0.7 }}>
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default RouteManagement;
