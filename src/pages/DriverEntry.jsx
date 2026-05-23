import React, { useState, useEffect, useMemo } from 'react';
import { useTrips } from '../hooks/useTrips';
import { useFuel } from '../hooks/useFuel';
import {
    Save,
    Truck,
    CheckCircle2,
    Edit,
    Trash2,
    X,
    Wallet,
    Calendar,
    User,
    MapPin,
    Fuel,
    Banknote,
    History,
    Sparkles,
    Wrench,
    Upload,
    ChevronLeft,
    ChevronRight,
    Camera,
    Receipt,
    Table
} from 'lucide-react';
import { getLocalDate } from '../utils/dateUtils';
import SalarySlip from '../components/SalarySlip';
import BillingSummary from '../components/BillingSummary';
import DriverTripLog from '../components/DriverTripLog';
import MonthlyTable from '../components/MonthlyTable';
import { logoBase64 } from '../assets/logoBase64';
import '../ios-light.css';



const DriverEntry = () => {
    const tripHook = useTrips();
    const { addTrip, deleteTrip, updateTrip, routePresets, trips, fetchTrips, fetchPresets, loading, uploadFile } = tripHook;
    const cnDeductions = tripHook.cnDeductions || {};
    const { fuelRefills } = useFuel();
    const [submitted, setSubmitted] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [showSlip, setShowSlip] = useState(false);
    const [showBillingDoc, setShowBillingDoc] = useState(false);
    const [showTripLog, setShowTripLog] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    
    // Bottom Tab Navigation states
    const [activeTab, setActiveTab] = useState('home'); // 'home', 'history', 'schedule', 'profile'
    const [tempName, setTempName] = useState('');

    // Billing Logic: If day >= 20, default to showing NEXT month's data
    const now = new Date();
    let initialSlipMonth = now.getMonth();
    let initialSlipYear = now.getFullYear();
    if (now.getDate() >= 20) {
        initialSlipMonth += 1;
        if (initialSlipMonth > 11) {
            initialSlipMonth = 0;
            initialSlipYear += 1;
        }
    }

    const [slipMonth, setSlipMonth] = useState(initialSlipMonth);
    const [slipYear, setSlipYear] = useState(initialSlipYear);
    const [isUploading, setIsUploading] = useState(false);
    const [files, setFiles] = useState({ fuel: null, maintenance: null, basket: null });

    useEffect(() => {
        document.title = "Patta Transport";
        // Dynamic Manifest for Driver
        const link = document.querySelector("link[rel*='manifest']") || document.createElement('link');
        link.type = 'application/manifest+json';
        link.rel = 'manifest';
        link.href = '/driver.webmanifest?v=2.2';
        document.getElementsByTagName('head')[0].appendChild(link);
    }, []);

    const [formData, setFormData] = useState({
        driverName: localStorage.getItem('lastDriverName') || '',
        route: '',
        price: '',
        fuel: '',
        wage: '',
        staffShare: '',
        basketCount: '',
        basket: '',
        basketShare: '',
        maintenance: '',
        date: getLocalDate()
    });

    const [dynamicPresets, setDynamicPresets] = useState(routePresets);

    // Helper to get calendar info from date string
    const getCalendarInfo = (dateStr) => {
        if (!dateStr) return { month: new Date().getMonth(), year: new Date().getFullYear() };
        const [y, m, d] = dateStr.split('-').map(Number);
        const dateObj = new Date(y, m - 1, d);
        return { month: dateObj.getMonth(), year: dateObj.getFullYear() };
    };

    // Update presets when date changes (Driver Side)
    useEffect(() => {
        const updatePresetsForDate = async (newDate) => {
            const { month, year } = getCalendarInfo(newDate);
            if (fetchPresets) {
                const presets = await fetchPresets(month, year, false);
                setDynamicPresets(presets || {});
            }
        };
        updatePresetsForDate(formData.date);
    }, [formData.date, fetchPresets]);

    // Auto-open slip if requested via URL (?view=Name)
    useEffect(() => {
        const hash = window.location.hash;
        if (hash.includes('?')) {
            const params = new URLSearchParams(hash.split('?')[1]);
            const viewName = params.get('view');
            if (viewName) {
                setFormData(prev => ({ ...prev, driverName: viewName }));
                setShowSlip(true);
            }
        }
    }, [trips]);

    const handleRouteChange = (e) => {
        const routeName = e.target.value;
        const preset = dynamicPresets[routeName] || routePresets[routeName];

        if (preset) {
            setFormData({
                ...formData,
                route: routeName,
                price: preset.price || '',
                wage: preset.wage || ''
            });
        } else {
            // Smart Remember: Check if we have a manually saved wage for this route
            const savedWages = JSON.parse(localStorage.getItem('lastWagesPerRoute') || '{}');
            const lastWage = savedWages[routeName] || '';

            setFormData({
                ...formData,
                route: routeName,
                wage: lastWage // Auto-fill with last used wage for this route
            });
        }
    };

    const handleEdit = (trip) => {
        setFormData({
            ...trip,
            price: trip.price || '',
            fuel: trip.fuel || '',
            wage: trip.wage || '',
            staffShare: trip.staffShare || '',
            basketCount: trip.basketCount || '',
            basket: trip.basket || '',
            basketShare: trip.basketShare || '',
            maintenance: trip.maintenance || '',
            date: trip.date.split('T')[0]
        });
        setEditingId(trip.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setFormData({
            driverName: localStorage.getItem('lastDriverName') || '',
            route: '', price: '', fuel: '', wage: '', staffShare: '',
            basketCount: '', basket: '', basketShare: '',
            maintenance: '',
            date: getLocalDate()
        });
    };

    const handleDelete = async (id) => {
        if (window.confirm('คุณแน่ใจว่าต้องการลบรายการนี้?')) {
            await deleteTrip(id);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.route) {
            alert('กรุณากรอกสายงาน');
            return;
        }

        setIsUploading(true);

        try {
            const fuelUrl = files.fuel ? await uploadFile(files.fuel, 'fuel_bills') : (formData.fuel_bill_url || null);
            const maintenanceUrl = files.maintenance ? await uploadFile(files.maintenance, 'maintenance_bills') : (formData.maintenance_bill_url || null);
            const basketUrl = files.basket ? await uploadFile(files.basket, 'basket_bills') : (formData.basket_bill_url || null);

            const finalData = {
                ...formData,
                fuel_bill_url: fuelUrl,
                maintenance_bill_url: maintenanceUrl,
                basket_bill_url: basketUrl
            };

            let result;
            if (editingId) {
                result = await updateTrip(editingId, finalData);
                setEditingId(null);
            } else {
                result = await addTrip(finalData);
            }

            if (result && result.success === false) {
                console.error('Save failed:', result.error);
                alert(`❌ บัญทึกไม่สำเร็จ: ${result.error?.message || 'โปรดตรวจสอบการเชื่อมต่ออินเทอร์เน็ต'}`);
                return;
            }

            setSubmitted(true);

            // Smart Remember: Save current wage for this route to localStorage
            if (formData.route && formData.wage) {
                const savedWages = JSON.parse(localStorage.getItem('lastWagesPerRoute') || '{}');
                savedWages[formData.route] = formData.wage;
                localStorage.setItem('lastWagesPerRoute', JSON.stringify(savedWages));
            }

            setFormData({
                driverName: localStorage.getItem('lastDriverName') || '',
                route: '', price: '', fuel: '', wage: '', staffShare: '',
                basketCount: '', basket: '', basketShare: '',
                maintenance: '',
                date: getLocalDate()
            });
            setFiles({ fuel: null, maintenance: null, basket: null });

            setTimeout(() => setSubmitted(false), 3000);
        } catch (err) {
            console.error('Submit error detailed:', err);
            alert(`เกิดข้อผิดพลาดในการบันทึกข้อมูล: ${err.message || 'โครงสร้างฐานข้อมูลอาจมีการเปลี่ยนแปลง'}`);
        } finally {
            setIsUploading(false);
        }
    };

    // Safe Filter Logic for Reports
    const filteredBillingTrips = React.useMemo(() => {
        if (!formData.driverName) return [];
        try {
            const searchName = formData.driverName.trim().replace(/\s+/g, ' ');
            // Handle edge case where slipMonth is invalid (though it shouldn't be with select 0-11)
            const mIdx = parseInt(slipMonth);
            const yIdx = parseInt(slipYear);

            if (isNaN(mIdx) || isNaN(yIdx)) return [];

            // Billing cycle: 20th of Prev Month to 19th of Current Month
            const startDate = new Date(yIdx, mIdx - 1, 20);
            const endDate = new Date(yIdx, mIdx, 19);

            // Adjust bounds to cover full days if needed, but standard Date comparison works for 00:00:00

            return trips.filter(t => {
                if (!t.date) return false;
                const [y, m, d] = t.date.split('-').map(Number);
                if (!y) return false;
                const checkDate = new Date(y, m - 1, d);

                const tName = (t.driverName || '').trim().replace(/\s+/g, ' ');

                return tName === searchName && checkDate >= startDate && checkDate <= endDate;
            });
        } catch (e) {
            console.error("Filtering error:", e);
            return [];
        }
    }, [trips, formData.driverName, slipMonth, slipYear]);

    return (
        <div className="driver-landscape-ios">
            {/* If not logged in (no driverName), show gorgeous iOS login card */}
            {!formData.driverName ? (
                <div style={{ display: 'flex', flex: 1, justifyContent: 'center', alignItems: 'center', padding: '2rem', minHeight: '100vh' }}>
                    <div className="premium-card anim-up" style={{ width: '100%', maxWidth: '380px', textAlign: 'center', border: '2px solid #e2e8f0', borderRadius: '24px', padding: '2rem 1.5rem', boxShadow: '0 10px 40px rgba(0,0,0,0.04)' }}>
                        <img src={logoBase64} alt="ภัทธา Logo" style={{ height: '70px', width: 'auto', marginBottom: '1.25rem', borderRadius: '15px', border: '1px solid rgba(0,0,0,0.05)', display: 'inline-block' }} />
                        <h2 style={{ fontSize: '1.4rem', fontWeight: '800', fontFamily: 'Outfit, Anuphan, sans-serif', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>ภัทธา ทรานสปอร์ต</h2>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', letterSpacing: '1px', fontWeight: '600', marginBottom: '1.75rem' }}>PATTA DRIVER PORTAL</p>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'left', marginBottom: '1.5rem' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginLeft: '4px' }}>ลงชื่อผู้ใช้งาน / ชื่อคนขับ</label>
                            <input
                                type="text"
                                className="input-premium"
                                placeholder="ระบุชื่อจริงของคุณ..."
                                value={tempName}
                                onChange={(e) => setTempName(e.target.value)}
                                style={{ background: '#fff', color: '#000', width: '100%' }}
                            />
                        </div>
                        
                        <button
                            onClick={() => {
                                if (!tempName.trim()) {
                                    alert('⚠️ กรุณากรอกชื่อคนขับของคุณด้วยครับ');
                                    return;
                                }
                                const name = tempName.trim();
                                setFormData(prev => ({ ...prev, driverName: name }));
                                localStorage.setItem('lastDriverName', name);
                            }}
                            className="btn-premium"
                            style={{ width: '100%', padding: '0.9rem', borderRadius: '14px', background: 'linear-gradient(135deg, var(--primary) 0%, #6d28d9 100%)', border: 'none', boxShadow: '0 8px 24px rgba(139, 92, 246, 0.25)' }}
                        >
                            <CheckCircle2 size={18} />
                            <span>เข้าสู่ระบบ</span>
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    {/* Header */}
                    <header className="driver-premium-header slide-up" style={{ padding: '1rem', borderBottom: '1px solid rgba(0,0,0,0.06)', background: '#fff', position: 'sticky', top: 0, zIndex: 100, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div className="logo-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <img src={logoBase64} alt="Logo" style={{ height: '40px', width: 'auto', borderRadius: '8px' }} />
                            <div>
                                <h1 style={{ fontSize: '1rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>ภัทธา ทรานสปอร์ต</h1>
                                <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', fontWeight: '600', display: 'block', letterSpacing: '0.5px' }}>PATTA TRANSPORT</span>
                            </div>
                        </div>
                        
                        <div>
                            <span style={{ fontSize: '0.75rem', fontWeight: '700', padding: '4px 10px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.1)', color: 'var(--primary)' }}>
                                {activeTab === 'home' && 'หน้าหลัก'}
                                {activeTab === 'history' && 'ประวัติ'}
                                {activeTab === 'schedule' && 'ตารางงาน'}
                                {activeTab === 'profile' && 'บัญชี'}
                            </span>
                        </div>
                    </header>

                    {/* Success Overlay */}
                    {submitted && (
                        <div className="success-overlay-premium fade-in">
                            <div className="success-card-premium slide-up">
                                <div className="success-icon-wrapper">
                                    <CheckCircle2 size={48} />
                                </div>
                                <h2 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>บันทึกข้อมูลเรียบร้อย!</h2>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>ข้อมูลของคุณถูกเก็บเข้าสู่ระบบแล้ว</p>
                            </div>
                        </div>
                    )}

                    {/* Main Content Area */}
                    <main className="driver-content-ios">
                        {/* Tab content conditional rendering */}
                        {activeTab === 'home' && (
                            <div className="fade-in">
                                {/* Greeting & Stats Card */}
                                <div className="premium-card" style={{ marginBottom: '1rem', background: '#fff' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                                        <div className="user-avatar" style={{ width: '44px', height: '44px', overflow: 'hidden', padding: 0, borderRadius: '50%', border: '2px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <img src="/driver-avatar.png" alt="Driver" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>สวัสดีคุณ, {formData.driverName}</h3>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>พร้อมสำหรับการลงรอบสายงานวันนี้แล้ว</p>
                                        </div>
                                    </div>

                                    <div className="driver-quick-stats" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                        {(() => {
                                            const driverTrips = trips.filter(t => {
                                                const searchName = formData.driverName.trim().replace(/\s+/g, ' ');
                                                const startDate = new Date(slipYear, slipMonth - 1, 20);
                                                const endDate = new Date(slipYear, slipMonth, 19);
                                                const [y, m, d] = (t.date || '').split('-').map(Number);
                                                if (!y) return false;
                                                const checkDate = new Date(y, m - 1, d);
                                                return t.driverName === searchName && checkDate >= startDate && checkDate <= endDate;
                                            });

                                            const totalWage = driverTrips.reduce((s, t) => s + (parseFloat(t.wage) || 0), 0);
                                            const totalBasketShare = driverTrips.reduce((sum, t) => sum + (parseFloat(t.basketShare) || 0), 0);

                                            return (
                                                <>
                                                    <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '14px', border: '1px solid rgba(0,0,0,0.02)' }}>
                                                        <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px', fontWeight: '700' }}>รอบเดือนนี้</span>
                                                        <span style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-primary)' }}>{driverTrips.length} เที่ยว</span>
                                                    </div>
                                                    <div style={{ background: 'rgba(16, 185, 129, 0.04)', padding: '0.75rem', borderRadius: '14px', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                                                        <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: '#10b981', display: 'block', marginBottom: '2px', fontWeight: '700' }}>สะสมรวม</span>
                                                        <span style={{ fontSize: '1rem', fontWeight: '800', color: '#10b981' }}>฿{totalWage.toLocaleString()}</span>
                                                    </div>
                                                    <div style={{ background: 'rgba(56, 189, 248, 0.04)', padding: '0.75rem', borderRadius: '14px', border: '1px solid rgba(56, 189, 248, 0.1)', gridColumn: 'span 2' }}>
                                                        <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: '#0284c7', display: 'block', marginBottom: '2px', fontWeight: '700' }}>🧺 ค่าตะกร้า (เดือนนี้)</span>
                                                        <span style={{ fontSize: '1rem', fontWeight: '800', color: '#0284c7' }}>฿{totalBasketShare.toLocaleString()}</span>
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>

                                {/* Entry Form */}
                                <form onSubmit={handleSubmit} className="premium-card">
                                    <div className="form-section-title" style={{ color: 'var(--text-primary)', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '0.9rem' }}>
                                        <Edit size={16} color="var(--primary)" />
                                        <span>ลงรายละเอียดงาน</span>
                                    </div>

                                    <div className="input-grid-premium">
                                        <div className="input-field-premium">
                                            <label><Calendar size={14} /> วันที่วิ่งงาน</label>
                                            <input
                                                type="date"
                                                className="input-premium"
                                                value={formData.date}
                                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                                required
                                            />
                                        </div>

                                        <div className="input-field-premium">
                                            <label><User size={14} /> ชื่อคนขับ</label>
                                            <input
                                                type="text"
                                                className="input-premium"
                                                value={formData.driverName}
                                                disabled
                                                style={{ background: '#f8fafc', color: 'var(--text-secondary)', cursor: 'not-allowed', border: '2px dashed #cbd5e1' }}
                                            />
                                        </div>

                                        <div className="input-field-premium full-width">
                                            <label><MapPin size={14} /> สายงาน / เส้นทาง</label>
                                            <input
                                                type="text"
                                                list="route-options"
                                                className="input-premium"
                                                placeholder="เลือกหรือพิมพ์เส้นทาง..."
                                                value={formData.route}
                                                onChange={handleRouteChange}
                                                required
                                                style={{ background: '#fff' }}
                                            />
                                            <datalist id="route-options">
                                                {Object.keys(dynamicPresets).map(route => (
                                                    <option key={route} value={route} />
                                                ))}
                                            </datalist>
                                        </div>

                                        <div className="input-field-premium">
                                            <label><Banknote size={14} /> ค่าจ้าง (บาท)</label>
                                            <input
                                                type="number"
                                                className="input-premium"
                                                placeholder="0"
                                                value={formData.wage}
                                                onChange={(e) => setFormData({ ...formData, wage: e.target.value })}
                                                style={{ background: '#fff' }}
                                            />
                                        </div>

                                        <div className="input-field-premium">
                                            <label><Truck size={14} /> จำนวนตะกร้า</label>
                                            <input
                                                type="number"
                                                className="input-premium"
                                                placeholder="0"
                                                value={formData.basketCount}
                                                onChange={(e) => {
                                                    const count = parseInt(e.target.value) || 0;
                                                    let rev = 0;
                                                    let share = 0;

                                                    if (count >= 101) {
                                                        rev = 1000;
                                                        share = 700;
                                                    } else if (count >= 91) {
                                                        rev = 600;
                                                        share = 400;
                                                    } else if (count >= 86) {
                                                        rev = 300;
                                                        share = 200;
                                                    }

                                                    setFormData({
                                                        ...formData,
                                                        basketCount: e.target.value,
                                                        basket: rev,
                                                        basketShare: share
                                                    });
                                                }}
                                                style={{ background: '#fff' }}
                                            />
                                            <div className="file-upload-section" style={{ marginTop: '6px' }}>
                                                <label className={`file-upload-btn ${files.basket ? 'has-file' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px', border: '1px dashed #cbd5e1', borderRadius: '8px', fontSize: '0.75rem', justifyContent: 'center', cursor: 'pointer' }}>
                                                    <Upload size={12} />
                                                    <span>{files.basket ? '🧺 รูปแนบเรียบร้อย' : 'แนบรูปตะกร้า'}</span>
                                                    <input type="file" hidden accept="image/*" onChange={(e) => setFiles(prev => ({ ...prev, basket: e.target.files[0] }))} />
                                                </label>
                                            </div>
                                        </div>

                                        <div className="input-field-premium">
                                            <label><Fuel size={14} /> ค่าน้ำมัน (บาท)</label>
                                            <input
                                                type="number"
                                                className="input-premium"
                                                placeholder="0"
                                                value={formData.fuel}
                                                onChange={(e) => setFormData({ ...formData, fuel: e.target.value })}
                                                style={{ background: '#fff' }}
                                            />
                                            <div className="file-upload-section" style={{ marginTop: '6px' }}>
                                                <label className={`file-upload-btn ${files.fuel ? 'has-file' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px', border: '1px dashed #cbd5e1', borderRadius: '8px', fontSize: '0.75rem', justifyContent: 'center', cursor: 'pointer' }}>
                                                    <Upload size={12} />
                                                    <span>{files.fuel ? '⛽️ รูปแนบเรียบร้อย' : 'แนบรูปใบน้ำมัน'}</span>
                                                    <input type="file" hidden accept="image/*" onChange={(e) => setFiles(prev => ({ ...prev, fuel: e.target.files[0] }))} />
                                                </label>
                                            </div>
                                        </div>

                                        <div className="input-field-premium">
                                            <label><Wallet size={14} /> ยอดเบิก (ถ้ามี)</label>
                                            <input
                                                type="number"
                                                className="input-premium"
                                                placeholder="0"
                                                value={formData.staffShare}
                                                onChange={(e) => setFormData({ ...formData, staffShare: e.target.value })}
                                                style={{ background: '#fff' }}
                                            />
                                        </div>

                                        <div className="input-field-premium">
                                            <label><Wrench size={14} /> ค่าซ่อมบำรุง (ถ้ามี)</label>
                                            <input
                                                type="number"
                                                className="input-premium"
                                                placeholder="0"
                                                value={formData.maintenance}
                                                onChange={(e) => setFormData({ ...formData, maintenance: e.target.value })}
                                                style={{ background: '#fff' }}
                                            />
                                            <div className="file-upload-section" style={{ marginTop: '6px' }}>
                                                <label className={`file-upload-btn ${files.maintenance ? 'has-file' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px', border: '1px dashed #cbd5e1', borderRadius: '8px', fontSize: '0.75rem', justifyContent: 'center', cursor: 'pointer' }}>
                                                    <Upload size={12} />
                                                    <span>{files.maintenance ? '🔧 รูปแนบเรียบร้อย' : 'แนบรูปใบซ่อม'}</span>
                                                    <input type="file" hidden accept="image/*" onChange={(e) => setFiles(prev => ({ ...prev, maintenance: e.target.files[0] }))} />
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-actions" style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                                        <button type="submit" className="btn-premium w-full" disabled={isUploading} style={{ flex: 1 }}>
                                            {isUploading ? <Sparkles size={20} className="spin" /> : <Save size={20} />}
                                            <span>{isUploading ? 'กำลังอัปโหลด...' : (editingId ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูลงาน')}</span>
                                        </button>
                                        {editingId && (
                                            <button type="button" onClick={handleCancelEdit} className="btn-premium" style={{ background: '#64748b', boxShadow: 'none' }}>
                                                <X size={20} />
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </div>
                        )}

                        {activeTab === 'history' && (
                            <div className="fade-in">
                                <div className="premium-card">
                                    <div className="form-section-title" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem', marginBottom: '1.25rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '0.9rem' }}>
                                        <History size={16} color="var(--primary)" />
                                        <span>ประวัติงานของคุณ (15 วันล่าสุด)</span>
                                    </div>

                                    <div className="history-timeline" style={{ borderLeft: '2px solid #f1f5f9', paddingLeft: '1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                        {(() => {
                                            const searchName = formData.driverName.trim().replace(/\s+/g, ' ').toLowerCase();
                                            const filtered = trips.filter(t => {
                                                const driverName = (t.driverName || '').trim().replace(/\s+/g, ' ').toLowerCase();
                                                return driverName === searchName;
                                            }).slice(0, 15);

                                            if (filtered.length > 0) {
                                                return filtered.map((trip) => (
                                                    <div key={trip.id} className="timeline-item" style={{ position: 'relative' }}>
                                                        <div className="timeline-dot" style={{ position: 'absolute', left: '-1.35rem', top: '0.4rem', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary)', boxShadow: '0 0 8px var(--primary-glow)' }}></div>
                                                        <div className="timeline-content" style={{ background: '#f8fafc', padding: '1rem', borderRadius: '16px', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                                <div>
                                                                    <h4 style={{ fontWeight: '700', fontSize: '0.95rem', margin: 0 }}>{trip.route}</h4>
                                                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>{trip.date} • {trip.driverName}</p>
                                                                </div>
                                                                
                                                                <div style={{ display: 'flex', gap: '0.25rem' }}>
                                                                    <button onClick={() => { handleEdit(trip); setActiveTab('home'); }} className="icon-btn-edit" style={{ background: 'none', border: 'none', color: 'var(--primary)', padding: '4px', cursor: 'pointer' }}>
                                                                        <Edit size={16} />
                                                                    </button>
                                                                    <button onClick={() => handleDelete(trip.id)} className="icon-btn-delete" style={{ background: 'none', border: 'none', color: 'var(--danger)', padding: '4px', cursor: 'pointer' }}>
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            
                                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', fontSize: '0.75rem', fontWeight: '600' }}>
                                                                <span style={{ background: 'rgba(16, 185, 129, 0.08)', color: '#10b981', padding: '2px 6px', borderRadius: '6px' }}>ค่าจ้าง: ฿{(parseFloat(trip.wage) || 0).toLocaleString()}</span>
                                                                {trip.basketCount > 0 && (
                                                                    <span style={{ background: 'rgba(56, 189, 248, 0.08)', color: '#0284c7', padding: '2px 6px', borderRadius: '6px' }}>ตะกร้า: {trip.basketCount} ใบ (฿{(parseFloat(trip.basketShare) || 0).toLocaleString()})</span>
                                                                )}
                                                                {trip.fuel > 0 && (
                                                                    <span style={{ background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444', padding: '2px 6px', borderRadius: '6px' }}>น้ำมัน: ฿{(parseFloat(trip.fuel) || 0).toLocaleString()}</span>
                                                                )}
                                                            </div>
                                                            
                                                            {(trip.fuel_bill_url || trip.maintenance_bill_url || trip.basket_bill_url) && (
                                                                <div style={{ display: 'flex', gap: '6px', borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem', marginTop: '2px' }}>
                                                                    {trip.fuel_bill_url && (
                                                                        <a href={trip.fuel_bill_url} target="_blank" rel="noreferrer" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)', textDecoration: 'none', background: '#fff', padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}><Camera size={12} /><span>รูปน้ำมัน</span></a>
                                                                    )}
                                                                    {trip.maintenance_bill_url && (
                                                                        <a href={trip.maintenance_bill_url} target="_blank" rel="noreferrer" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)', textDecoration: 'none', background: '#fff', padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}><Camera size={12} /><span>รูปใบซ่อม</span></a>
                                                                    )}
                                                                    {trip.basket_bill_url && (
                                                                        <a href={trip.basket_bill_url} target="_blank" rel="noreferrer" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)', textDecoration: 'none', background: '#fff', padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}><Camera size={12} /><span>รูปตะกร้า</span></a>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ));
                                            } else {
                                                return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontStyle: 'italic' }}>ไม่พบประวัติการทำงานของคุณ</div>;
                                            }
                                        })()}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'schedule' && (
                            <div className="fade-in" style={{ paddingBottom: '1rem' }}>
                                <MonthlyTable
                                    trips={trips}
                                    currentMonth={slipMonth}
                                    currentYear={slipYear}
                                    onMonthChange={handleMonthChange}
                                    readOnly={true}
                                    showSlips={false}
                                />
                            </div>
                        )}

                        {activeTab === 'profile' && (
                            <div className="fade-in">
                                <div className="profile-container" style={{ padding: '0' }}>
                                    {/* Driver Profile Card */}
                                    <div className="premium-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1rem', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(109, 40, 217, 0.05) 100%)', borderColor: 'rgba(139, 92, 246, 0.15)' }}>
                                        <div className="user-avatar" style={{ width: '56px', height: '56px', overflow: 'hidden', padding: 0, borderRadius: '50%', border: '2px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <img src="/driver-avatar.png" alt="Driver" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>{formData.driverName}</h3>
                                            <span style={{ fontSize: '0.7rem', background: 'rgba(139, 92, 246, 0.1)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '10px', fontWeight: '700', display: 'inline-block', marginTop: '4px' }}>พนักงานขับรถ</span>
                                        </div>
                                    </div>

                                    {/* Slips & Documents Section */}
                                    <div className="premium-card" style={{ marginBottom: '1rem' }}>
                                        <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 1rem 0' }}>
                                            <Receipt size={16} color="var(--primary)" />
                                            <span>สลิปเงินเดือน & เอกสาร</span>
                                        </h4>
                                        
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                                            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600', marginLeft: '4px' }}>เลือกรอบสรุปยอด</label>
                                            <div className="filter-group" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.5rem', marginBottom: 0 }}>
                                                <div className="select-wrapper" style={{ position: 'relative' }}>
                                                    <select
                                                        value={slipMonth}
                                                        onChange={(e) => setSlipMonth(parseInt(e.target.value))}
                                                        className="input-premium select-input"
                                                        style={{ background: '#fff', color: '#000', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', padding: '0.6rem 0.8rem !important', width: '100%', height: '42px' }}
                                                    >
                                                        {['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'].map((m, i) => (
                                                            <option key={i} value={i}>{m}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="select-wrapper" style={{ position: 'relative' }}>
                                                    <select
                                                        value={slipYear}
                                                        onChange={(e) => setSlipYear(parseInt(e.target.value))}
                                                        className="input-premium select-input"
                                                        style={{ background: '#fff', color: '#000', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', padding: '0.6rem 0.8rem !important', width: '100%', height: '42px' }}
                                                    >
                                                        {(() => {
                                                            const currentY = new Date().getFullYear();
                                                            return [currentY - 1, currentY, currentY + 1].map(y => (
                                                                <option key={y} value={y}>{y}</option>
                                                            ));
                                                        })()}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                            <button
                                                type="button"
                                                className="btn-premium"
                                                style={{ width: '100%', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: 'white', border: 'none', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)', padding: '0.75rem 1rem' }}
                                                onClick={async () => {
                                                    await fetchTrips();
                                                    setShowSlip(true);
                                                }}
                                                disabled={loading}
                                            >
                                                <Wallet size={16} />
                                                <span>{loading ? 'กำลังโหลด...' : 'ดูสลิปเงินเดือน'}</span>
                                            </button>

                                            <button
                                                type="button"
                                                className="btn-premium"
                                                style={{ width: '100%', background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)', color: 'white', border: 'none', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)', padding: '0.75rem 1rem' }}
                                                onClick={async () => {
                                                    await fetchTrips();
                                                    setShowBillingDoc(true);
                                                }}
                                                disabled={loading}
                                            >
                                                <Receipt size={16} />
                                                <span>{loading ? 'กำลังโหลด...' : 'ดูใบวางบิล'}</span>
                                            </button>

                                            <button
                                                type="button"
                                                className="btn-premium"
                                                style={{ width: '100%', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)', padding: '0.75rem 1rem' }}
                                                onClick={async () => {
                                                    await fetchTrips();
                                                    setShowTripLog(true);
                                                }}
                                                disabled={loading}
                                            >
                                                <Table size={16} />
                                                <span>{loading ? 'กำลังโหลด...' : 'ดูตารางลงงาน'}</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Contact Section */}
                                    <div className="premium-card" style={{ marginBottom: '1rem' }}>
                                        <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.75rem', fontWeight: '700', margin: 0 }}>ติดต่อฝ่ายประสานงาน</h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                                            <p style={{ margin: 0 }}>🏢 <strong>บริษัท ภัทธา ทรานสปอร์ต แอนด์ โลจิสติกส์ จำกัด</strong></p>
                                            <p style={{ margin: 0 }}>📞 <strong>เบอร์โทรสำนักงานหลัก:</strong> ติดต่อผู้จัดการ/ฝ่ายบัญชี</p>
                                            <p style={{ margin: 0 }}>⚙️ <strong>ระบบเวอร์ชัน:</strong> 2.5 (Native React Build)</p>
                                        </div>
                                    </div>

                                    {/* Logout */}
                                    <button
                                        onClick={() => {
                                            if (window.confirm('คุณต้องการออกจากระบบคนขับหรือไม่?')) {
                                                setFormData(prev => ({ ...prev, driverName: '' }));
                                                localStorage.removeItem('lastDriverName');
                                                setTempName('');
                                            }
                                        }}
                                        className="btn-premium"
                                        style={{ width: '100%', padding: '0.8rem', borderRadius: '14px', background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)', border: 'none', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)' }}
                                    >
                                        <X size={16} />
                                        <span>ออกจากระบบคนขับ</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </main>

                    {/* Fixed Bottom Tab Navigation */}
                    <nav className="ios-bottom-nav">
                        <button className={`ios-nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
                            <Truck size={18} />
                            <span>หน้าหลัก</span>
                        </button>
                        <button className={`ios-nav-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
                            <History size={18} />
                            <span>ประวัติ</span>
                        </button>
                        <button className={`ios-nav-item ${activeTab === 'schedule' ? 'active' : ''}`} onClick={() => setActiveTab('schedule')}>
                            <Calendar size={18} />
                            <span>ตารางงาน</span>
                        </button>
                        <button className={`ios-nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
                            <User size={18} />
                            <span>บัญชี</span>
                        </button>
                    </nav>
                </>
            )}

            {/* Modals float nicely on top of all views */}
            {showSlip && (
                <SalarySlip
                    driverName={formData.driverName}
                    trips={filteredBillingTrips}
                    cnDeduction={cnDeductions[formData.driverName?.trim().replace(/\s+/g, ' ')] || 0}
                    onClose={() => setShowSlip(false)}
                    period={`20 ${['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'][(slipMonth - 1 + 12) % 12]} - 19 ${['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'][slipMonth]} ${slipYear}`}
                />
            )}

            {showBillingDoc && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.85)', zIndex: 9999, overflowY: 'auto', padding: '2rem 1rem'
                }}>
                    <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative' }}>
                        <button
                            onClick={() => setShowBillingDoc(false)}
                            style={{
                                position: 'absolute', right: '-10px', top: '-10px', zIndex: 10001,
                                background: '#f43f5e', color: 'white', border: 'none',
                                borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                            }}
                        >
                            <X size={20} />
                        </button>
                        <BillingSummary
                            trips={filteredBillingTrips}
                            currentMonth={slipMonth}
                            currentYear={slipYear}
                            driverName={formData.driverName.trim().replace(/\s+/g, ' ')}
                            address={formData.driverName.includes("สมชาย") ? "279 ม.7 ต.ป่าสัก อ.เมือง ลำพูน 51000" : "เลขที่ 246 หมู่ 6 ต.เวียงตาล อ.ห้างฉัตร ลำปาง 52190"}
                            isDriverCopy={true}
                        />
                    </div>
                </div>
            )}

            {showTripLog && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.85)', zIndex: 9999, overflowY: 'auto', padding: '2rem 1rem'
                }}>
                    <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
                        <button
                            onClick={() => setShowTripLog(false)}
                            style={{
                                position: 'absolute', right: '-10px', top: '-10px', zIndex: 10001,
                                background: '#f43f5e', color: 'white', border: 'none',
                                borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                            }}
                        >
                            <X size={20} />
                        </button>
                        <DriverTripLog
                            trips={filteredBillingTrips}
                            currentMonth={slipMonth}
                            currentYear={slipYear}
                            driverName={formData.driverName.trim().replace(/\s+/g, ' ')}
                            isDriverCopy={true}
                        />
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                .driver-landscape-ios {
                    min-height: 100vh;
                    background-color: #f8fafc;
                    font-family: 'Outfit', 'Anuphan', sans-serif;
                    color: #0f172a;
                    position: relative;
                    width: 100%;
                    max-width: 500px;
                    margin: 0 auto;
                    display: flex;
                    flex-direction: column;
                    padding-bottom: 80px;
                    box-sizing: border-box;
                }

                .driver-content-ios {
                    padding: 1rem;
                    width: 100%;
                    flex: 1;
                    box-sizing: border-box;
                }

                .ios-bottom-nav {
                    position: fixed;
                    bottom: 0;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 100%;
                    max-width: 500px;
                    height: 70px;
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border-top: 1px solid rgba(0, 0, 0, 0.08);
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    padding: 6px 0;
                    z-index: 1000;
                    box-shadow: 0 -4px 30px rgba(0, 0, 0, 0.03);
                }

                .ios-nav-item {
                    background: none;
                    border: none;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 4px;
                    color: #8e8e93;
                    font-size: 0.72rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    outline: none;
                }

                .ios-nav-item.active {
                    color: var(--primary);
                }

                .ios-nav-item svg {
                    transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }

                .ios-nav-item.active svg {
                    transform: scale(1.15) translateY(-2px);
                    color: var(--primary);
                }

                .input-premium {
                    background: #ffffff !important;
                    border: 2px solid #cbd5e1 !important;
                    border-radius: 14px !important;
                    padding: 0.75rem 1rem !important;
                    color: #0f172a !important;
                    font-size: 1rem !important;
                    font-weight: 600 !important;
                    box-shadow: none !important;
                    transition: all 0.3s ease !important;
                }

                .input-premium:focus {
                    border-color: var(--primary) !important;
                    box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.15) !important;
                    outline: none !important;
                }

                .premium-card {
                    background: #ffffff;
                    border: 1px solid rgba(0, 0, 0, 0.06);
                    border-radius: 20px;
                    padding: 1.25rem;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.03);
                    margin-bottom: 1rem;
                }

                .btn-premium {
                    background: linear-gradient(135deg, var(--primary) 0%, #6d28d9 100%);
                    color: #ffffff;
                    font-weight: 700;
                    font-size: 0.95rem;
                    border: none;
                    border-radius: 14px;
                    padding: 0.8rem 1.25rem;
                    box-shadow: 0 6px 20px rgba(139, 92, 246, 0.2);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .btn-premium:hover {
                    transform: translateY(-1.5px);
                    box-shadow: 0 10px 24px rgba(139, 92, 246, 0.3);
                }

                .btn-premium:active {
                    transform: translateY(0);
                }

                .success-overlay-premium {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(255, 255, 255, 0.85);
                    backdrop-filter: blur(10px);
                    z-index: 2000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 2rem;
                }

                .success-card-premium {
                    background: #ffffff;
                    border: 1px solid rgba(16, 185, 129, 0.2);
                    padding: 2.5rem 2rem;
                    border-radius: 24px;
                    text-align: center;
                    max-width: 320px;
                    width: 100%;
                    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.08);
                }

                .success-icon-wrapper {
                    width: 64px;
                    height: 64px;
                    background: rgba(16, 185, 129, 0.08);
                    color: #10b981;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 1.25rem auto;
                    border: 1px solid rgba(16, 185, 129, 0.2);
                }

                .input-field-premium {
                    display: flex;
                    flex-direction: column;
                    gap: 0.4rem;
                }

                .input-field-premium label {
                    font-size: 0.75rem;
                    color: var(--text-secondary);
                    margin-left: 4px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-weight: 600;
                }

                .input-grid-premium {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 0.8rem;
                }

                .full-width {
                    grid-column: 1 / -1;
                }

                .select-wrapper::after {
                    content: '▼';
                    font-size: 0.7rem;
                    color: var(--text-secondary);
                    right: 12px;
                    top: 15px;
                    position: absolute;
                    pointer-events: none;
                }

                .select-input {
                    appearance: none;
                    -webkit-appearance: none;
                    cursor: pointer;
                }

                .fade-in {
                    animation: fadeIn 0.4s ease-out forwards;
                }

                .slide-up {
                    animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }

                @media (max-width: 480px) {
                    .driver-landscape-ios {
                        padding-bottom: 75px;
                    }
                }
                `
            }} />
        </div>
    );
};

export default DriverEntry;
