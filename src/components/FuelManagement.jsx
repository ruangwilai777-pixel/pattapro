import React, { useState, useMemo } from 'react';
import { Fuel, Plus, Trash2, Calendar, Banknote, History, TrendingDown, TrendingUp, Wallet, ChevronDown, ChevronUp, User, Clock } from 'lucide-react';
import { getLocalDate } from '../utils/dateUtils';

const FuelManagement = ({ fuelRefills, trips, addFuelRefill, deleteFuelRefill }) => {
    const [showForm, setShowForm] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [selectedDriver, setSelectedDriver] = useState('all');
    const [formData, setFormData] = useState({
        date: getLocalDate(),
        amount: '',
        notes: ''
    });

    const refillsArray = Array.isArray(fuelRefills) ? fuelRefills : [];
    const tripsArray = Array.isArray(trips) ? trips : [];

    const drivers = useMemo(() => {
        const dSet = new Set();
        refillsArray.forEach(r => { if (r.notes) dSet.add(r.notes.trim()); });
        tripsArray.forEach(t => { if (t.driverName) dSet.add(t.driverName.trim().replace(/\s+/g, ' ')); });
        return Array.from(dSet).sort();
    }, [refillsArray, tripsArray]);

    const stats = useMemo(() => {
        let filteredRefills = refillsArray;
        let filteredTrips = tripsArray;

        if (selectedDriver !== 'all') {
            filteredRefills = filteredRefills.filter(r => (r.notes || '').trim() === selectedDriver);
            filteredTrips = filteredTrips.filter(t => (t.driverName || '').trim().replace(/\s+/g, ' ') === selectedDriver);
        }

        // --- NEW LOGIC: Only count fuel usage AFTER the very first refill was made ---
        // 1. Find the earliest refill date for this context
        const refillDates = filteredRefills
            .map(r => (r.date || '').split('T')[0])
            .filter(d => d)
            .sort();

        const firstRefillDate = refillDates.length > 0 ? refillDates[0] : null;

        // 2. Sum Refills
        const totalRefills = filteredRefills.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);

        // 3. Sum Usage ONLY ON OR AFTER the first refill date
        const fuelUsed = firstRefillDate
            ? filteredTrips
                .filter(t => (t.date || '') >= firstRefillDate)
                .reduce((sum, t) => sum + (parseFloat(t.fuel) || 0), 0)
            : 0;

        const balance = totalRefills - fuelUsed;

        return { totalRefills, fuelUsed, balance };
    }, [refillsArray, tripsArray, selectedDriver]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const res = await addFuelRefill(formData);
        if (res.success) {
            setFormData({ date: formData.date, amount: '', notes: formData.notes });
            setShowForm(false);
        } else {
            alert('เกิดข้อผิดพลาด: ' + res.error?.message);
        }
    };

    return (
        <div className="driver-card fade-in" style={{ padding: '1rem', marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div className="form-section-title" style={{ margin: 0, fontSize: '0.9rem' }}>
                    <Fuel size={16} />
                    <span>จัดการยอดน้ำมัน (เริ่มนับจากยอดโอน)</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setShowForm(!showForm)} className="btn-icon" style={{ background: 'rgba(129, 140, 248, 0.1)', color: 'var(--primary)', padding: '4px' }}>
                        <Plus size={16} />
                    </button>
                    <button onClick={() => setIsExpanded(!isExpanded)} className="btn-icon" style={{ background: 'var(--glass-border)', color: 'var(--text-dim)', padding: '4px' }}>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginBottom: '4px', textTransform: 'uppercase' }}>เลือกคนขับเพื่อดูยอดคงเหลือ</div>
                <select value={selectedDriver} onChange={(e) => setSelectedDriver(e.target.value)} className="input-premium" style={{ width: '100%', fontSize: '0.85rem', padding: '0.5rem' }}>
                    <option value="all">ทุกคน (ยอดรวมบริษัท)</option>
                    {drivers.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
            </div>

            <div style={{ padding: '1rem', background: stats.balance >= 0 ? 'rgba(129, 140, 248, 0.05)' : 'rgba(239, 68, 68, 0.1)', borderRadius: '16px', border: `1px solid ${stats.balance >= 0 ? 'rgba(129, 140, 248, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`, marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Wallet size={14} /> ยอดเงินคงเหลือสะสม {selectedDriver !== 'all' ? `(${selectedDriver})` : ''}
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: '900', color: stats.balance >= 0 ? 'var(--primary)' : 'var(--danger)', margin: '4px 0' }}>
                    ฿{stats.balance.toLocaleString()}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--glass-border)' }}>
                    <div>
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>โอนเข้าทั้งหมด</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#22c55e' }}>฿{stats.totalRefills.toLocaleString()}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>ใช้ไป (ตั้งแต่โอนครั้งแรก)</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#ef4444' }}>฿{stats.fuelUsed.toLocaleString()}</div>
                    </div>
                </div>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="glass-card slide-up" style={{ padding: '1.25rem', marginBottom: '1rem', background: 'var(--glass-border)', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'grid', gap: '0.8rem' }}>
                        <div className="input-field-premium">
                            <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '4px', display: 'block' }}>วันที่โอน</label>
                            <input type="date" className="input-premium" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} required />
                        </div>
                        <div className="input-field-premium">
                            <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '4px', display: 'block' }}>ชื่อคนขับ</label>
                            <input type="text" list="driver-list-final" className="input-premium" placeholder="ชื่อคนขับ..." value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} required />
                            <datalist id="driver-list-final">{drivers.map(d => <option key={d} value={d} />)}</datalist>
                        </div>
                        <div className="input-field-premium">
                            <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '4px', display: 'block' }}>จำนวนเงิน (บาท)</label>
                            <input type="number" className="input-premium" placeholder="0" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} required />
                        </div>
                        <button type="submit" className="btn-premium" style={{ marginTop: '0.5rem', padding: '0.8rem' }}><Plus size={18} /> บันทึกยอดโอน</button>
                    </div>
                </form>
            )}

            {isExpanded && (
                <div className="table-responsive" style={{ maxHeight: '250px', overflowY: 'auto', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                    <table className="trip-table" style={{ fontSize: '0.8rem' }}>
                        <thead>
                            <tr>
                                <th style={{ padding: '10px' }}>วันที่/คนขับ</th>
                                <th style={{ padding: '10px' }}>ยอดเงิน</th>
                                <th style={{ padding: '10px', width: '40px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {refillsArray
                                .filter(r => selectedDriver === 'all' || (r.notes || '').trim() === selectedDriver)
                                .map(refill => (
                                    <tr key={refill.id}>
                                        <td style={{ padding: '10px' }}>
                                            <div style={{ fontWeight: '500' }}>{new Date(refill.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{refill.notes}</div>
                                        </td>
                                        <td style={{ padding: '10px', color: '#22c55e', fontWeight: '800' }}>฿{parseFloat(refill.amount).toLocaleString()}</td>
                                        <td style={{ padding: '10px' }}>
                                            <button onClick={() => { if (window.confirm('ลบรายการนี้?')) deleteFuelRefill(refill.id); }} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                        </td>
                                    </tr>
                                ))
                            }
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default FuelManagement;
