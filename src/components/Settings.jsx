import React, { useState, useEffect, useMemo } from 'react';
import { 
    Settings as SettingsIcon, Plus, Trash2, Save, FileText, 
    Coins, Building, Activity, Copy, ChevronLeft, ChevronRight 
} from 'lucide-react';

const Settings = ({ 
    routePresets, saveRoutePreset, deletePreset, fetchPresets, 
    currentMonth, currentYear,
    basketTiers = [], saveBasketTier, deleteBasketTier,
    checkAndCleanupOldImages,
    trips = [] 
}) => {
    const [activeTab, setActiveTab] = useState('prices');
    const [loading, setLoading] = useState(false);

    // PRICES TAB STATES
    const [manageMonth, setManageMonth] = useState(currentMonth);
    const [manageYear, setManageYear] = useState(currentYear);
    const [localPresets, setLocalPresets] = useState({});
    const [routeForm, setRouteForm] = useState({ route: '', price: '' });

    // BASKET TAB STATES
    const [basketForm, setBasketForm] = useState({ min_count: '', max_count: '', revenue: '', share: '' });

    // COMPANY TAB STATES
    const [companyForm, setCompanyForm] = useState(() => {
        const cached = localStorage.getItem('companySettings');
        return cached ? JSON.parse(cached) : {
            name: 'ภัทธา ทรานสปอร์ต',
            nameEn: 'PATTHA TRANSPORT - LOGISTICS SERVICES',
            address: 'เลขที่ 246 หมู่ 6 ต.เวียงตาล อ.ห้างฉัตร จ.ลำปาง 52190',
            taxId: '',
            phone: '',
            bankName: '',
            bankAccount: '',
            bankOwner: ''
        };
    });

    const months = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];

    // PRICES TAB SYNC & FETCH
    useEffect(() => {
        setManageMonth(currentMonth);
        setManageYear(currentYear);
    }, [currentMonth, currentYear]);

    useEffect(() => {
        const loadPresets = async () => {
            if (manageMonth === currentMonth && manageYear === currentYear) {
                setLocalPresets(routePresets);
            } else if (fetchPresets) {
                const data = await fetchPresets(manageMonth, manageYear, false);
                setLocalPresets(data || {});
            }
        };
        loadPresets();
    }, [manageMonth, manageYear, routePresets, currentMonth, currentYear, fetchPresets]);

    const handleMonthChange = (direction) => {
        let newMonth = manageMonth + direction;
        let newYear = manageYear;
        if (newMonth < 0) { newMonth = 11; newYear -= 1; }
        if (newMonth > 11) { newMonth = 0; newYear += 1; }
        setManageMonth(newMonth);
        setManageYear(newYear);
    };

    // Save Preset Action
    const handleSavePreset = async (e) => {
        e.preventDefault();
        if (!routeForm.route.trim()) return alert('กรุณาระบุชื่อสายงาน');
        if (!routeForm.price) return alert('กรุณาระบุราคาค่าเที่ยว');

        setLoading(true);
        const result = await saveRoutePreset(
            routeForm.route.trim(), 
            routeForm.price, 
            0, 
            manageMonth, 
            manageYear
        );

        if (result.success) {
            setRouteForm({ route: '', price: '' });
            alert('🎉 บันทึกราคาค่าเที่ยวสำเร็จเรียบร้อยแล้ว!');
            if (fetchPresets) {
                const data = await fetchPresets(manageMonth, manageYear, false);
                setLocalPresets(data || {});
            }
        } else {
            alert('❌ บันทึกไม่สำเร็จ: ' + (result.error?.message || 'เกิดข้อผิดพลาด'));
        }
        setLoading(false);
    };

    // Delete Preset Action
    const handleDeletePreset = async (route) => {
        if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบสายงาน "${route}" ในเดือนนี้?`)) return;
        setLoading(true);
        const result = await deletePreset(route, manageMonth, manageYear);
        if (result.success) {
            alert('🗑️ ลบสายงานสำเร็จแล้ว!');
            if (fetchPresets) {
                const data = await fetchPresets(manageMonth, manageYear, false);
                setLocalPresets(data || {});
            }
        } else {
            alert('❌ ลบไม่สำเร็จ');
        }
        setLoading(false);
    };

    // Copy Presets from Previous Month
    const handleCopyPresets = async () => {
        const prevMonthIndex = manageMonth === 0 ? 11 : manageMonth - 1;
        const prevYear = manageMonth === 0 ? manageYear - 1 : manageYear;

        if (confirm(`ยืนยันการคัดลอกค่าเที่ยวทั้งหมดจากเดือนก่อนหน้า (${months[prevMonthIndex]} ${prevYear}) มายังเดือนนี้?`)) {
            setLoading(true);
            try {
                const prevData = await fetchPresets(prevMonthIndex, prevYear, false);
                if (prevData && Object.keys(prevData).length > 0) {
                    let successCount = 0;
                    for (const [route, preset] of Object.entries(prevData)) {
                        const res = await saveRoutePreset(route, preset.price, preset.wage, manageMonth, manageYear);
                        if (res.success) successCount++;
                    }
                    alert(`✅ คัดลอกสำเร็จทั้งหมด ${successCount} รายการ!`);
                    if (fetchPresets) {
                        const data = await fetchPresets(manageMonth, manageYear, false);
                        setLocalPresets(data || {});
                    }
                } else {
                    alert('⚠️ ไม่พบข้อมูลค่าเที่ยวของเดือนก่อนหน้า');
                }
            } catch (err) {
                console.error(err);
                alert('❌ เกิดข้อผิดพลาดในการคัดลอก');
            } finally {
                setLoading(false);
            }
        }
    };

    // Extract logged but unconfigured routes
    const unconfiguredRoutes = useMemo(() => {
        if (!trips || trips.length === 0) return [];
        const m = String(manageMonth + 1).padStart(2, '0');
        const periodPrefix = `${manageYear}-${m}`;
        const activeMonthTrips = trips.filter(t => t.date && t.date.startsWith(periodPrefix));
        const uniqueTripRoutes = [...new Set(activeMonthTrips.map(t => t.route?.trim()).filter(Boolean))];
        return uniqueTripRoutes.filter(route => !localPresets[route] && !['ค่าซ่อมบำรุง', 'เบิกเงิน', 'เบิกถอน'].includes(route));
    }, [trips, manageMonth, manageYear, localPresets]);

    // BASKET TIERS ACTIONS
    const handleSaveBasketTier = async (e) => {
        e.preventDefault();
        const { min_count, max_count, revenue, share } = basketForm;
        if (!min_count || !max_count || !revenue || !share) return alert('กรุณากรอกข้อมูลให้ครบทุกช่อง');

        setLoading(true);
        const result = await saveBasketTier({
            min_count: parseInt(min_count),
            max_count: parseInt(max_count),
            revenue: parseFloat(revenue),
            share: parseFloat(share)
        });

        if (result.success) {
            setBasketForm({ min_count: '', max_count: '', revenue: '', share: '' });
            alert('🎉 บันทึกเกณฑ์ตะกร้าเรียบร้อยแล้ว!');
        } else {
            alert('❌ เกิดข้อผิดพลาดในการบันทึก');
        }
        setLoading(false);
    };

    const handleDeleteBasketTier = async (id) => {
        if (!confirm('ต้องการลบเกณฑ์ตะกร้าช่วงนี้ใช่หรือไม่?')) return;
        setLoading(true);
        const result = await deleteBasketTier(id);
        if (result.success) {
            alert('🗑️ ลบเกณฑ์สำเร็จแล้ว!');
        } else {
            alert('❌ ลบไม่สำเร็จ');
        }
        setLoading(false);
    };

    // COMPANY SETTINGS ACTIONS
    const handleSaveCompanySettings = (e) => {
        e.preventDefault();
        localStorage.setItem('companySettings', JSON.stringify(companyForm));
        alert('🎉 บันทึกข้อมูลบริษัทหัวกระดาษสำเร็จเรียบร้อยแล้ว!');
        // Dispatch custom event to trigger updates in Bill/Slip components
        window.dispatchEvent(new Event('companySettingsUpdated'));
    };

    // SYSTEM ACTIONS
    const handleCleanupImages = async () => {
        if (confirm('คุณยืนยันที่จะเริ่มระบบล้างข้อมูลรูปภาพเก่าที่มีอายุเกิน 2 เดือนออกจากฐานข้อมูลหลักเพื่อเพิ่มพื้นที่เก็บข้อมูลหรือไม่? (ยอดการเงินในตารางทั้งหมดจะไม่ถูกลบเด็ดขาด)')) {
            setLoading(true);
            const res = await checkAndCleanupOldImages();
            if (res.success) {
                alert(`✅ ดำเนินการล้างข้อมูลเรียบร้อยแล้ว! ลบรูปภาพใบเสร็จเก่าออก ${res.count} รูปภาพ`);
            } else {
                alert('❌ เกิดข้อผิดพลาด หรือไม่พบรูปภาพเก่าที่มีอายุเกินกำหนด');
            }
            setLoading(false);
        }
    };

    return (
        <div className="glass-card fade-in" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem', backdropFilter: 'blur(16px)' }}>
            
            {/* BRAND HEADER */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1.25rem' }}>
                <div style={{ padding: '10px', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', borderRadius: '16px', color: 'var(--text-main)' }}>
                    <SettingsIcon size={24} />
                </div>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0, color: 'var(--text-main)' }}>แผงตั้งค่าและจัดการระบบ</h2>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', margin: 0, fontWeight: 600 }}>จัดการค่าตอบแทน สลิปเงินเดือน สัดส่วนตะกร้า และประมวลผลเซิร์ฟเวอร์</p>
                </div>
            </div>

            {/* TAB SELECTOR */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', background: 'var(--bg-card)', padding: '6px', borderRadius: '18px', gap: '8px', border: '1px solid var(--glass-border)' }}>
                {[
                    { id: 'prices', label: 'ราคาค่าเที่ยว', icon: Plus, activeColor: '#8b5cf6', activeBg: 'rgba(139, 92, 246, 0.15)' },
                    { id: 'basket', label: 'ส่วนแบ่งตะกร้า', icon: Coins, activeColor: '#fbbf24', activeBg: 'rgba(251, 191, 36, 0.15)' },
                    { id: 'company', label: 'ใบวางบิลบริษัท', icon: FileText, activeColor: '#38bdf8', activeBg: 'rgba(56, 189, 248, 0.15)' },
                    { id: 'system', label: 'จัดการระบบ', icon: Activity, activeColor: '#f43f5e', activeBg: 'rgba(244, 63, 94, 0.15)' }
                ].map(t => {
                    const active = activeTab === t.id;
                    return (
                        <button
                            key={t.id}
                            onClick={() => setActiveTab(t.id)}
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                padding: '12px 10px', borderRadius: '12px', border: active ? `2px solid ${t.activeColor}` : '2px solid transparent',
                                fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer',
                                background: active ? t.activeBg : 'transparent',
                                color: active ? t.activeColor : '#64748b',
                                transition: 'all 0.25s ease'
                            }}
                        >
                            <t.icon size={16} />
                            <span>{t.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* SUB-TABS CONTENT */}
            
            {/* 1. PRICES TAB */}
            {activeTab === 'prices' && (
                <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                            <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', margin: 0, fontWeight: 800 }}>ตั้งค่าราคาค่าเที่ยวและค่าจ้างรายเดือน</h3>
                            <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', margin: '4px 0 0 0' }}>กำหนดราคาค่าเที่ยวสะสมประจำแต่ละรอบเดือน</p>
                        </div>

                        {/* Month Selector */}
                        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--glass-border)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '4px' }}>
                            <button onClick={() => handleMonthChange(-1)} style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>
                                <ChevronLeft size={16} />
                            </button>
                            <span style={{ minWidth: '130px', textAlign: 'center', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>
                                {months[manageMonth]} {manageYear}
                            </span>
                            <button onClick={() => handleMonthChange(1)} style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Copy Presets Box */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button 
                            onClick={handleCopyPresets}
                            disabled={loading}
                            style={{ 
                                display: 'flex', alignItems: 'center', gap: '6px', 
                                padding: '8px 16px', borderRadius: '10px', 
                                background: 'var(--glass-border)', color: '#a855f7', 
                                border: '1px solid rgba(168,85,247,0.3)', cursor: 'pointer', 
                                fontSize: '0.75rem', fontWeight: 700 
                            }}
                        >
                            <Copy size={13} />
                            คัดลอกราคาจากเดือน {months[manageMonth === 0 ? 11 : manageMonth - 1]}
                        </button>
                    </div>

                    {/* Form to Add Preset */}
                    <form onSubmit={handleSavePreset} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr auto', gap: '12px', alignItems: 'end', background: 'var(--glass-border)', border: '1px solid var(--glass-border)', padding: '1.25rem', borderRadius: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '6px', color: 'var(--text-dim)', fontWeight: 700 }}>ชื่อสายงาน / เส้นทาง</label>
                            <input 
                                type="text"
                                style={{ width: '100%', padding: '10px 14px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'var(--text-main)', fontSize: '0.85rem' }}
                                placeholder="เช่น 501 หรือ ชลบุรี"
                                value={routeForm.route}
                                onChange={e => setRouteForm({ ...routeForm, route: e.target.value })}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '6px', color: 'var(--text-dim)', fontWeight: 700 }}>ราคาค่าเที่ยว (+)</label>
                            <input 
                                type="number"
                                style={{ width: '100%', padding: '10px 14px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'var(--text-main)', fontSize: '0.85rem' }}
                                placeholder="บาท"
                                value={routeForm.price}
                                onChange={e => setRouteForm({ ...routeForm, price: e.target.value })}
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={loading}
                            style={{ 
                                height: '40px', padding: '0 20px', borderRadius: '10px', 
                                border: 'none', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', 
                                color: 'var(--text-main)', fontWeight: 800, cursor: 'pointer', fontSize: '0.8rem',
                                display: 'flex', alignItems: 'center', gap: '6px',
                                boxShadow: '0 4px 12px rgba(99,102,241,0.25)'
                            }}
                        >
                            <Save size={14} />
                            {loading ? 'บันทึก...' : 'บันทึกราคา'}
                        </button>
                    </form>

                    {/* Unconfigured Quick Add Section */}
                    {unconfiguredRoutes.length > 0 && (
                        <div style={{ background: 'rgba(139, 92, 246, 0.05)', border: '1px dashed rgba(139, 92, 246, 0.3)', padding: '1rem', borderRadius: '16px' }}>
                            <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#a855f7', margin: '0 0 8px 0' }}>✨ พบสายรถที่ถูกกรอกในรอบบิลนี้แล้วแต่ยังไม่มีการตั้งเรตราคาคงที่ (กดเพื่อช่วยดึงไปกรอกด่วน):</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {unconfiguredRoutes.map(r => (
                                    <div 
                                        key={r} 
                                        onClick={() => setRouteForm({ ...routeForm, route: r })}
                                        style={{ 
                                            padding: '4px 12px', background: 'var(--glass-border)', 
                                            borderRadius: '8px', fontSize: '0.72rem', color: '#c084fc', 
                                            cursor: 'pointer', border: '1px solid rgba(192, 132, 252, 0.2)',
                                            fontWeight: 700, transition: 'all 0.2s' 
                                        }}
                                        onMouseOver={e => e.currentTarget.style.background = 'rgba(139, 92, 246, 0.15)'}
                                        onMouseOut={e => e.currentTarget.style.background = 'var(--glass-border)'}
                                    >
                                        + {r}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* List Table of Presets */}
                    <div style={{ border: '1px solid var(--glass-border)', borderRadius: '16px', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: 'var(--glass-border)', borderBottom: '1px solid var(--glass-border)' }}>
                                    <th style={{ padding: '12px 16px', color: 'var(--text-dim)' }}>ชื่อสายงาน / เส้นทาง</th>
                                    <th style={{ padding: '12px 16px', color: '#10b981', textAlign: 'right' }}>ราคาค่าเที่ยว</th>
                                    <th style={{ padding: '12px 16px', color: '#64748b', textAlign: 'center' }}>จัดการ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.keys(localPresets).length === 0 ? (
                                    <tr>
                                        <td colSpan={3} style={{ padding: '3rem', textAlign: 'center', color: '#64748b', fontWeight: 600 }}>
                                            ยังไม่มีสายงานและราคาประเมินที่บันทึกสำหรับงวดเดือนนี้
                                        </td>
                                    </tr>
                                ) : (
                                    Object.entries(localPresets).sort((a,b) => a[0].localeCompare(b[0])).map(([route, info]) => (
                                        <tr key={route} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s' }}>
                                            <td style={{ padding: '12px 16px', color: 'var(--text-main)', fontWeight: 700 }}>{route}</td>
                                            <td style={{ padding: '12px 16px', color: '#34d399', fontWeight: 800, textAlign: 'right' }}>฿{parseInt(info.price || 0).toLocaleString()}</td>
                                            <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                                <button 
                                                    onClick={() => handleDeletePreset(route)}
                                                    style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer', opacity: 0.8 }}
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* 2. BASKET TAB */}
            {activeTab === 'basket' && (
                <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                        <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', margin: 0, fontWeight: 800 }}>เกณฑ์คำนวณส่วนแบ่งตะกร้ารูปแบบเหมาขั้นบันได (Basket Tiers)</h3>
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', margin: '4px 0 0 0' }}>กำหนดช่วงปริมาณตะกร้า (ใบ) เพื่อหารายรับบริษัทสะสม และเงินนำส่วนแบ่งพนักงานขับรถโดยอัตโนมัติ</p>
                    </div>

                    {/* Basket Tier Form */}
                    <form onSubmit={handleSaveBasketTier} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr) auto', gap: '12px', alignItems: 'end', background: 'var(--glass-border)', border: '1px solid var(--glass-border)', padding: '1.25rem', borderRadius: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '6px', color: 'var(--text-dim)', fontWeight: 700 }}>จำนวนตะกร้าเริ่มต้น (ใบ)</label>
                            <input 
                                type="number"
                                style={{ width: '100%', padding: '10px 14px', background: 'rgba(0,0,30,0.3)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'var(--text-main)' }}
                                placeholder="เช่น 81"
                                value={basketForm.min_count}
                                onChange={e => setBasketForm({ ...basketForm, min_count: e.target.value })}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '6px', color: 'var(--text-dim)', fontWeight: 700 }}>ถึงจำนวนตะกร้าสูงสุด (ใบ)</label>
                            <input 
                                type="number"
                                style={{ width: '100%', padding: '10px 14px', background: 'rgba(0,0,30,0.3)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'var(--text-main)' }}
                                placeholder="เช่น 85"
                                value={basketForm.max_count}
                                onChange={e => setBasketForm({ ...basketForm, max_count: e.target.value })}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '6px', color: 'var(--text-dim)', fontWeight: 700 }}>รายรับของบริษัทรวม (บาท)</label>
                            <input 
                                type="number"
                                style={{ width: '100%', padding: '10px 14px', background: 'rgba(0,0,30,0.3)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'var(--text-main)' }}
                                placeholder="เช่น 300"
                                value={basketForm.revenue}
                                onChange={e => setBasketForm({ ...basketForm, revenue: e.target.value })}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '6px', color: 'var(--text-dim)', fontWeight: 700 }}>ส่วนแบ่งจ่ายพนักงานขับรถ (บาท)</label>
                            <input 
                                type="number"
                                style={{ width: '100%', padding: '10px 14px', background: 'rgba(0,0,30,0.3)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'var(--text-main)' }}
                                placeholder="เช่น 200"
                                value={basketForm.share}
                                onChange={e => setBasketForm({ ...basketForm, share: e.target.value })}
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={loading}
                            style={{ 
                                height: '40px', padding: '0 20px', borderRadius: '10px', 
                                border: 'none', background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)', 
                                color: 'var(--text-main)', fontWeight: 800, cursor: 'pointer', fontSize: '0.8rem',
                                display: 'flex', alignItems: 'center', gap: '6px',
                                boxShadow: '0 4px 12px rgba(217,119,6,0.25)'
                            }}
                        >
                            <Plus size={15} />
                            เพิ่มเกณฑ์ใหม่
                        </button>
                    </form>

                    {/* Basket Tiers List */}
                    <div style={{ border: '1px solid var(--glass-border)', borderRadius: '16px', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: 'var(--glass-border)', borderBottom: '1px solid var(--glass-border)' }}>
                                    <th style={{ padding: '12px 16px', color: 'var(--text-dim)' }}>ช่วงจำนวนใบตะกร้า</th>
                                    <th style={{ padding: '12px 16px', color: '#34d399', textAlign: 'right' }}>รายรับบริษัท</th>
                                    <th style={{ padding: '12px 16px', color: '#fbbf24', textAlign: 'right' }}>ส่วนแบ่งจ่ายคืนคนขับ</th>
                                    <th style={{ padding: '12px 16px', color: '#64748b', textAlign: 'center' }}>จัดการ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(!basketTiers || basketTiers.length === 0) ? (
                                    <tr>
                                        <td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: '#64748b', fontWeight: 600 }}>
                                            ยังไม่มีการกำหนดเกณฑ์ขั้นบันไดตะกร้าในระบบดึกดำบรรพ์
                                        </td>
                                    </tr>
                                ) : (
                                    basketTiers.map(tier => (
                                        <tr key={tier.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                            <td style={{ padding: '12px 16px', color: 'var(--text-main)', fontWeight: 700 }}>{tier.min_count} - {tier.max_count} ใบ</td>
                                            <td style={{ padding: '12px 16px', color: '#34d399', fontWeight: 800, textAlign: 'right' }}>฿{parseFloat(tier.revenue).toLocaleString()}</td>
                                            <td style={{ padding: '12px 16px', color: '#fbbf24', fontWeight: 800, textAlign: 'right' }}>฿{parseFloat(tier.share).toLocaleString()}</td>
                                            <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                                <button 
                                                    onClick={() => handleDeleteBasketTier(tier.id)}
                                                    style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer', opacity: 0.8 }}
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* 3. COMPANY TAB */}
            {activeTab === 'company' && (
                <form onSubmit={handleSaveCompanySettings} className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                        <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', margin: 0, fontWeight: 800 }}>ตั้งค่าข้อมูลบริษัทและข้อมูลหัวกระดาษ (Company Information)</h3>
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', margin: '4px 0 0 0' }}>แก้ไขข้อมูลบริษัท เลขที่ผู้เสียภาษี และรายละเอียดบัญชีธนาคารสำหรับพิมพ์ใบสรุปและสลิปเงินเดือนแบบเป็นทางการ</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        {/* LEFT SECTION: COMPANY INFO */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--glass-border)', border: '1px solid var(--glass-border)', padding: '1.5rem', borderRadius: '16px' }}>
                            <h4 style={{ color: '#38bdf8', fontSize: '0.9rem', fontWeight: 800, margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Building size={16} />
                                ข้อมูลองค์กรและแบรนด์
                            </h4>
                            
                            <div>
                                <label style={{ display: 'block', fontSize: '0.72rem', marginBottom: '6px', color: 'var(--text-dim)', fontWeight: 700 }}>ชื่อแบรนด์ / บริษัท (ภาษาไทย)</label>
                                <input 
                                    type="text"
                                    style={{ width: '100%', padding: '10px 14px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'var(--text-main)', fontSize: '0.85rem' }}
                                    value={companyForm.name}
                                    onChange={e => setCompanyForm({ ...companyForm, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.72rem', marginBottom: '6px', color: 'var(--text-dim)', fontWeight: 700 }}>Company Name (ภาษาอังกฤษ)</label>
                                <input 
                                    type="text"
                                    style={{ width: '100%', padding: '10px 14px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'var(--text-main)', fontSize: '0.85rem' }}
                                    value={companyForm.nameEn}
                                    onChange={e => setCompanyForm({ ...companyForm, nameEn: e.target.value })}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.72rem', marginBottom: '6px', color: 'var(--text-dim)', fontWeight: 700 }}>เลขประจำตัวผู้เสียภาษีอากร / ติดต่อ</label>
                                <input 
                                    type="text"
                                    style={{ width: '100%', padding: '10px 14px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'var(--text-main)', fontSize: '0.85rem' }}
                                    value={companyForm.taxId}
                                    onChange={e => setCompanyForm({ ...companyForm, taxId: e.target.value })}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.72rem', marginBottom: '6px', color: 'var(--text-dim)', fontWeight: 700 }}>ที่อยู่อย่างเป็นทางการ</label>
                                <textarea 
                                    rows="3"
                                    style={{ width: '100%', padding: '10px 14px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'var(--text-main)', fontSize: '0.85rem', fontFamily: 'inherit', resize: 'none' }}
                                    value={companyForm.address}
                                    onChange={e => setCompanyForm({ ...companyForm, address: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* RIGHT SECTION: BANKING INFO */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--glass-border)', border: '1px solid var(--glass-border)', padding: '1.5rem', borderRadius: '16px' }}>
                            <h4 style={{ color: '#38bdf8', fontSize: '0.9rem', fontWeight: 800, margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Coins size={16} />
                                รายละเอียดสัญญารับเงินชำระ
                            </h4>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.72rem', marginBottom: '6px', color: 'var(--text-dim)', fontWeight: 700 }}>ชื่อธนาคาร</label>
                                <input 
                                    type="text"
                                    style={{ width: '100%', padding: '10px 14px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'var(--text-main)', fontSize: '0.85rem' }}
                                    placeholder="เช่น กสิกรไทย"
                                    value={companyForm.bankName}
                                    onChange={e => setCompanyForm({ ...companyForm, bankName: e.target.value })}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.72rem', marginBottom: '6px', color: 'var(--text-dim)', fontWeight: 700 }}>เลขที่บัญชี</label>
                                <input 
                                    type="text"
                                    style={{ width: '100%', padding: '10px 14px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'var(--text-main)', fontSize: '0.85rem' }}
                                    placeholder="เช่น 123-x-xxxxx-x"
                                    value={companyForm.bankAccount}
                                    onChange={e => setCompanyForm({ ...companyForm, bankAccount: e.target.value })}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.72rem', marginBottom: '6px', color: 'var(--text-dim)', fontWeight: 700 }}>ชื่อเจ้าของบัญชี</label>
                                <input 
                                    type="text"
                                    style={{ width: '100%', padding: '10px 14px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'var(--text-main)', fontSize: '0.85rem' }}
                                    placeholder="ชื่อผู้รับโอน"
                                    value={companyForm.bankOwner}
                                    onChange={e => setCompanyForm({ ...companyForm, bankOwner: e.target.value })}
                                />
                            </div>

                            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <button 
                                    type="submit"
                                    style={{ 
                                        width: '100%', height: '42px', borderRadius: '10px', border: 'none',
                                        background: 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)',
                                        color: 'var(--text-main)', fontWeight: 800, cursor: 'pointer', fontSize: '0.85rem',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                    }}
                                >
                                    <Save size={16} />
                                    บันทึกค่ากระดาษบริษัท
                                </button>
                                <span style={{ fontSize: '0.65rem', color: '#64748b', textAlign: 'center', fontWeight: 600 }}>* ข้อมูลเหล่านี้จะบันทึกลงหน่วยความจำถาวรภายในบราวเซอร์ (Local Storage) ทันที</span>
                            </div>
                        </div>
                    </div>
                </form>
            )}

            {/* 4. SYSTEM TAB */}
            {activeTab === 'system' && (
                <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                        <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', margin: 0, fontWeight: 800 }}>ดูแลประสิทธิภาพและล้างประวัติเซิร์ฟเวอร์</h3>
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', margin: '4px 0 0 0' }}>ประเมินความปลอดภัยและประสิทธิภาพการตอบสนองความเร็วของหน้าจอเว็บแอปพลิเคชัน</p>
                    </div>

                    <div style={{ background: 'rgba(244, 63, 94, 0.05)', border: '1px solid rgba(244, 63, 94, 0.2)', padding: '1.75rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <h4 style={{ fontSize: '0.98rem', color: '#f43f5e', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Activity size={18} />
                            เคลียร์ไฟล์และรูปภาพเก่าของระบบ (Image Database Cleanup)
                        </h4>
                        
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', margin: 0, lineHeight: 1.6 }}>
                            สแกนหาเที่ยวงานวิ่งที่มีอายุ **เกินกว่า 2 เดือนขึ้นไป** จากวันที่ปัจจุบัน ระบบจะทำการปลดรูปภาพใบเสร็จค่าน้ำมัน, รูปบิลค่าซ่อมบำรุง และบิลตะกร้าเก่า เพื่อเคลียร์หน่วยความจำ Storage ของ Supabase ที่เต็มลงให้ว่างขึ้น โดยที่ **ตารางข้อมูลตัวเลข ประวัติเที่ยวงาน ชื่อคนขับ และประวัติการวิ่งทั้งปวงจะสถิตอย่างปลอดภัย ไม่ลบเลือนเด็ดขาด** (ลบเฉพาะประวัติภาพถ่ายแนบเท่านั้น)
                        </p>

                        <button 
                            onClick={handleCleanupImages}
                            disabled={loading}
                            style={{ 
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                padding: '12px', borderRadius: '10px', border: 'none',
                                background: '#f43f5e', color: 'var(--text-main)', fontWeight: 800, cursor: 'pointer',
                                fontSize: '0.85rem', width: 'fit-content',
                                boxShadow: '0 4px 12px rgba(244,63,94,0.3)',
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={e => e.currentTarget.style.background = '#e11d48'}
                            onMouseOut={e => e.currentTarget.style.background = '#f43f5e'}
                        >
                            {loading ? 'กำลังเคลียร์ข้อมูล...' : 'เริ่มล้างข้อมูลรูปภาพเก่า (Clear Images > 2 Months)'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
