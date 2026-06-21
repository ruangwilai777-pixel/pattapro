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
import { logoBase64 } from '../assets/logoBase64';



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
        <div className="driver-landscape">
            <header className="driver-premium-header slide-up">
                <div className="header-content">
                    <div className="brand-badge">
                        <Sparkles size={14} className="sparkle-icon" />
                        <span>PREMIUM ACCESS</span>
                    </div>
                    <div className="brand-group">

                        <div className="logo-group" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <img src={logoBase64} alt="ภัทธา ทรานสปอร์ต Logo" style={{ height: '90px', width: 'auto', borderRadius: '15px', boxShadow: '0 10px 24px rgba(0,0,0,0.6)', border: '2px solid var(--glass-border)', display: 'block' }} />
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <h1 className="brand-logo" style={{ fontSize: '1.3rem', margin: 0, lineHeight: '1.2', fontWeight: '800' }}>ภัทธา ทรานสปอร์ต</h1>
                                <span className="subtitle" style={{ fontSize: '0.7rem', color: 'var(--text-dim)', letterSpacing: '2px', fontWeight: '600' }}>PATTA TRANSPORT</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {submitted && (
                <div className="success-overlay-premium fade-in">
                    <div className="success-card-premium slide-up">
                        <div className="success-icon-wrapper">
                            <CheckCircle2 size={48} />
                        </div>
                        <h2>บันทึกข้อมูลเรียบร้อย!</h2>
                        <p>ข้อมูลของคุณถูกเก็บเข้าสู่ระบบแล้ว</p>
                    </div>
                </div>
            )}

            <main className="driver-main-content">
                <div className="driver-greeting-row slide-up" style={{ animationDelay: '0.1s' }}>
                    <div className="greeting-card">
                        <div className="user-avatar" style={{ overflow: 'hidden', padding: 0 }}>
                            <img src="/driver-avatar.png" alt="Driver" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div className="greeting-text">
                            <h3 style={{ fontFamily: "'Anuphan', sans-serif", fontWeight: '600', fontSize: '1.25rem', letterSpacing: '0.02em' }}>{formData.driverName ? `สวัสดีคุณ, ${formData.driverName}` : 'ยินดีต้อนรับ'}</h3>
                            <p style={{ fontFamily: "'Anuphan', sans-serif", opacity: 0.7, fontSize: '0.9rem' }}>{formData.driverName ? 'พร้อมสำหรับการลงรอบสายงานวันนี้แล้ว' : 'กรุณากรอกชื่อเพื่อเริ่มต้น'}</p>
                        </div>
                    </div>

                    {formData.driverName && (
                        <div className="driver-quick-stats">
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

                                // Total Basket Share Calculation
                                const totalBasketShare = driverTrips.reduce((sum, t) => sum + (parseFloat(t.basketShare) || 0), 0);

                                return (
                                    <>
                                        <div className="stat-pill">
                                            <span className="label">เดือนนี้</span>
                                            <span className="value">{driverTrips.length} เที่ยว</span>
                                        </div>
                                        <div className="stat-pill profit">
                                            <span className="label">ค่าแรง+</span>
                                            <span className="value">฿{driverTrips.reduce((s, t) => s + (parseFloat(t.wage) || 0), 0).toLocaleString()}</span>
                                        </div>
                                        <div className="stat-pill basket" style={{
                                            borderColor: 'rgba(56, 189, 248, 0.2)',
                                            background: 'rgba(56, 189, 248, 0.05)'
                                        }}>
                                            <span className="label">🧺 ค่าตะกร้า (เดือนนี้)</span>
                                            <span className="value" style={{ color: '#38bdf8' }}>
                                                ฿{totalBasketShare.toLocaleString()}
                                            </span>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="driver-card slide-up" style={{ animationDelay: '0.2s' }}>
                    <div className="form-section-title">
                        <Edit size={16} />
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
                                placeholder="ระบุชื่อ..."
                                value={formData.driverName}
                                onChange={(e) => {
                                    setFormData({ ...formData, driverName: e.target.value });
                                    localStorage.setItem('lastDriverName', e.target.value);
                                }}
                                required
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
                            />
                            <div className="file-upload-section">
                                <label className={`file-upload-btn ${files.basket ? 'has-file' : ''}`}>
                                    <Upload size={12} />
                                    <span>{files.basket ? 'แนบรูปแล้ว' : 'แนบรูปตะกร้า'}</span>
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
                            />
                            <div className="file-upload-section">
                                <label className={`file-upload-btn ${files.fuel ? 'has-file' : ''}`}>
                                    <Upload size={12} />
                                    <span>{files.fuel ? 'แนบรูปแล้ว' : 'แนบรูปน้ำมัน'}</span>
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
                            />
                            <div className="file-upload-section">
                                <label className={`file-upload-btn ${files.maintenance ? 'has-file' : ''}`}>
                                    <Upload size={12} />
                                    <span>{files.maintenance ? 'แนบรูปแล้ว' : 'แนบรูปใบซ่อม'}</span>
                                    <input type="file" hidden accept="image/*" onChange={(e) => setFiles(prev => ({ ...prev, maintenance: e.target.files[0] }))} />
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="submit" className="btn-premium w-full" disabled={isUploading}>
                            {isUploading ? <Sparkles size={20} className="spin" /> : <Save size={20} />}
                            <span>{isUploading ? 'กำลังอัปโหลด...' : (editingId ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูลงาน')}</span>
                        </button>
                        {editingId && (
                            <button type="button" onClick={handleCancelEdit} className="btn-secondary-premium">
                                <X size={20} />
                            </button>
                        )}
                    </div>
                </form>

                <div className="driver-card slide-up" style={{ animationDelay: '0.3s', marginTop: '1.5rem' }}>
                    <div className="form-section-title">
                        <History size={16} />
                        <span>รายงานและประวัติ</span>
                    </div>

                    <div className="filter-group">
                        <div className="select-wrapper">
                            <select
                                value={slipMonth}
                                onChange={(e) => setSlipMonth(parseInt(e.target.value))}
                                className="input-premium select-input"
                                style={{ fontWeight: '600' }}
                            >
                                {['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'].map((m, i) => (
                                    <option key={i} value={i} style={{ color: '#000' }}>{m}</option>
                                ))}
                            </select>
                        </div>
                        <div className="select-wrapper">
                            <select
                                value={slipYear}
                                onChange={(e) => setSlipYear(parseInt(e.target.value))}
                                className="input-premium select-input"
                                style={{ fontWeight: '600' }}
                            >
                                {(() => {
                                    const currentY = new Date().getFullYear();
                                    const years = [currentY - 1, currentY, currentY + 1];
                                    return years.map(y => (
                                        <option key={y} value={y} style={{ color: '#000' }}>{y}</option>
                                    ));
                                })()}
                            </select>
                        </div>
                    </div>


                    <div className="action-grid">
                        <button
                            type="button"
                            className="btn-premium"
                            style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: 'var(--text-main)' }}
                            onClick={async () => {
                                if (!formData.driverName.trim()) {
                                    alert('⚠️ กรุณาพิมพ์ "ชื่อคนขับ" ของคุณก่อนดูสลิปครับ');
                                    return;
                                }
                                await fetchTrips();
                                setShowSlip(true);
                            }}
                            disabled={loading}
                        >
                            <Wallet size={18} />
                            <span>{loading ? 'กำลังโหลด...' : 'ดูสลิปเงินเดือน'}</span>
                        </button>

                        <button
                            type="button"
                            className="btn-premium"
                            style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)', color: 'var(--text-main)' }}
                            onClick={async () => {
                                if (!formData.driverName.trim()) {
                                    alert('⚠️ กรุณาพิมพ์ "ชื่อคนขับ" ของคุณก่อนดูใบวางบิลครับ');
                                    return;
                                }
                                await fetchTrips();
                                setShowBillingDoc(true);
                            }}
                            disabled={loading}
                        >
                            <Receipt size={18} />
                            <span>{loading ? 'กำลังโหลด...' : 'ดูใบวางบิล'}</span>
                        </button>

                        <button
                            type="button"
                            className="btn-premium"
                            style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'var(--text-main)' }}
                            onClick={async () => {
                                if (!formData.driverName.trim()) {
                                    alert('⚠️ กรุณาพิมพ์ "ชื่อคนขับ" ของคุณก่อนดูตารางลงงานครับ');
                                    return;
                                }
                                await fetchTrips();
                                setShowTripLog(true);
                            }}
                            disabled={loading}
                        >
                            <Table size={18} />
                            <span>{loading ? 'กำลังโหลด...' : 'ดูตารางลงงาน'}</span>
                        </button>

                        <button
                            type="button"
                            className="btn-premium"
                            style={{
                                background: showHistory
                                    ? 'linear-gradient(135deg, #475569 0%, #1e293b 100%)'
                                    : 'linear-gradient(135deg, #334155 0%, #0f172a 100%)',
                                color: 'var(--text-main)',
                                gridColumn: 'span 2'
                            }}
                            onClick={() => setShowHistory(!showHistory)}
                        >
                            <History size={18} />
                            <span>{showHistory ? 'ปิดประวัติ' : 'ดูประวัติงาน'}</span>
                        </button>
                    </div>
                </div>

                {showHistory && (
                    <div className="history-timeline fade-in">
                        {(() => {
                            const searchName = formData.driverName.trim().replace(/\s+/g, ' ').toLowerCase();
                            const filtered = trips.filter(t => {
                                const driverName = (t.driverName || '').trim().replace(/\s+/g, ' ').toLowerCase();
                                return searchName ? driverName === searchName : true;
                            }).slice(0, 10);

                            if (filtered.length > 0) {
                                return filtered.map((trip) => (
                                    <div key={trip.id} className="timeline-item">
                                        <div className="timeline-dot"></div>
                                        <div className="timeline-content">
                                            <div className="item-main">
                                                <h4>{trip.route}</h4>
                                                <p>{trip.date} • {trip.driverName}</p>
                                            </div>
                                            <div className="item-actions">
                                                {(trip.fuel_bill_url || trip.maintenance_bill_url || trip.basket_bill_url) && (
                                                    <div style={{ display: 'flex', gap: '4px', marginRight: '8px' }}>
                                                        {trip.fuel_bill_url && (
                                                            <a href={trip.fuel_bill_url} target="_blank" rel="noreferrer" className="bill-icon-btn" title="ดูรูปน้ำมัน"><Camera size={14} /></a>
                                                        )}
                                                        {trip.maintenance_bill_url && (
                                                            <a href={trip.maintenance_bill_url} target="_blank" rel="noreferrer" className="bill-icon-btn" title="ดูรูปค่าซ่อม"><Camera size={14} /></a>
                                                        )}
                                                        {trip.basket_bill_url && (
                                                            <a href={trip.basket_bill_url} target="_blank" rel="noreferrer" className="bill-icon-btn" title="ดูรูปตะกร้า"><Camera size={14} /></a>
                                                        )}
                                                    </div>
                                                )}
                                                <button onClick={() => handleEdit(trip)} className="icon-btn-edit">
                                                    <Edit size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(trip.id)} className="icon-btn-delete">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ));
                            } else {
                                return <div className="empty-history">ไม่พบประวัติงาน{formData.driverName ? `ของคุณ ${formData.driverName}` : ''}</div>;
                            }
                        })()}
                    </div>
                )}
            </main>

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
                    background: 'rgba(0,0,0,0.85)', zIndex: 9999, overflowY: 'auto', overflowX: 'auto', padding: '2rem 1rem'
                }}>
                    <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative' }}>
                        <button
                            onClick={() => setShowBillingDoc(false)}
                            style={{
                                position: 'absolute', right: '-10px', top: '-10px', zIndex: 10001,
                                background: '#f43f5e', color: 'var(--text-main)', border: 'none',
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
                    background: 'rgba(0,0,0,0.85)', zIndex: 9999, overflowY: 'auto', overflowX: 'auto', padding: '2rem 1rem'
                }}>
                    <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
                        <button
                            onClick={() => setShowTripLog(false)}
                            style={{
                                position: 'absolute', right: '-10px', top: '-10px', zIndex: 10001,
                                background: '#f43f5e', color: 'var(--text-main)', border: 'none',
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
                .driver-landscape {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 1.5rem;
                    min-height: 100vh;
                    padding-bottom: 5rem;
                }
                .driver-premium-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; padding: 0.5rem 0; }
                .header-content { display: flex; flex-direction: column; gap: 0.5rem; }
                .brand-badge { background: rgba(129, 140, 248, 0.1); color: var(--primary); padding: 4px 10px; border-radius: 20px; font-size: 0.65rem; font-weight: 800; width: fit-content; display: flex; align-items: center; gap: 6px; border: 1px solid rgba(129, 140, 248, 0.2); letter-spacing: 1px; }
                .sparkle-icon { animation: pulse 2s infinite; }
                .brand-group { display: flex; align-items: center; gap: 1rem; }
                .logo-box { width: 48px; height: 48px; background: linear-gradient(135deg, var(--primary), var(--accent)); border-radius: 14px; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 8px 16px rgba(129, 140, 248, 0.3); overflow: hidden; }
                .brand-group h1 { font-size: 1.75rem; font-weight: 900; margin: 0; line-height: 1; letter-spacing: -1px; color: var(--text-main); }
                .brand-group .subtitle { font-size: 0.75rem; color: var(--text-dim); margin: 4px 0 0 0; font-weight: 600; letter-spacing: 1px; }
                .driver-greeting-row { display: grid; grid-template-columns: 1.5fr 1fr; gap: 1rem; margin-bottom: 2rem; }
                .greeting-card { display: flex; align-items: center; gap: 1rem; background: var(--glass-bg); padding: 1.25rem; border-radius: 1.5rem; border: 1px solid var(--glass-border); backdrop-filter: blur(10px); }
                .driver-quick-stats { display: flex; flex-direction: column; gap: 0.5rem; }
                .stat-pill { background: var(--glass-bg); border: 1px solid var(--glass-border); padding: 0.5rem 1rem; border-radius: 1rem; display: flex; justify-content: space-between; align-items: center; }
                .stat-pill.profit { border-color: rgba(16, 185, 129, 0.2); background: rgba(16, 185, 129, 0.05); }
                .stat-pill .label { font-size: 0.65rem; text-transform: uppercase; color: var(--text-dim); letter-spacing: 0.5px; font-weight: 600; }
                .stat-pill .value { font-size: 0.9rem; font-weight: 700; color: var(--text-main); }
                .stat-pill.profit .value { color: #10b981; }
                .user-avatar { width: 40px; height: 40px; background: var(--glass-bg); border: 1px solid var(--glass-border); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--primary); }
                .driver-card { background: var(--glass-bg); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border: 1px solid var(--glass-border); box-shadow: var(--glass-shadow); border-radius: 1.75rem; padding: 1.5rem; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
                .driver-card:hover { border-color: rgba(129, 140, 248, 0.3); box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.6); }
                .form-section-title { display: flex; align-items: center; gap: 10px; margin-bottom: 1.25rem; color: var(--primary); font-weight: 700; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1.2px; opacity: 0.9; }
                .input-grid-premium { display: grid; grid-template-columns: 1fr; gap: 1rem; }
                .full-width { grid-column: 1 / -1; }
                .input-field-premium { display: flex; flex-direction: column; gap: 0.5rem; }
                .input-field-premium label { font-size: 0.75rem; color: var(--text-dim); margin-left: 4px; display: flex; align-items: center; gap: 6px; font-weight: 500; }
                .input-premium { background: rgba(0, 0, 0, 0.2)!important; border: 1px solid var(--glass-border)!important; border-radius: 1rem!important; padding: 0.8rem 1rem!important; color: white!important; font-size: 1rem!important; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)!important; }
                .form-actions { margin-top: 1.5rem; display: flex; gap: 0.75rem; }
                .w-full { width: 100%; }
                .filter-group { display: grid; grid-template-columns: 2fr 1fr; gap: 0.75rem; margin-bottom: 1.25rem; }
                .select-input { appearance: none; cursor: pointer; width: 100%; }
                .action-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
                .secondary-style { background: var(--glass-bg); border: 1px solid var(--glass-border); color: var(--text-main); box-shadow: var(--glass-shadow); }
                .btn-secondary-premium.active { border-color: var(--primary); color: var(--primary); background: rgba(129, 140, 248, 0.05); }
                .history-timeline { margin-top: 2rem; padding-left: 1rem; border-left: 1px solid var(--glass-border); display: flex; flex-direction: column; gap: 1.5rem; }
                .timeline-item { position: relative; }
                .timeline-dot { position: absolute; left: -1.35rem; top: 0.5rem; width: 10px; height: 10px; background: var(--primary); border-radius: 50%; box-shadow: 0 0 10px var(--primary); }
                .timeline-content { display: flex; justify-content: space-between; align-items: flex-start; }
                .item-main h4 { margin: 0; font-size: 1rem; color: var(--text-main); }
                .item-main p { margin: 2px 0 0 0; font-size: 0.75rem; color: var(--text-dim); }
                .item-actions { display: flex; gap: 0.5rem; }
                .icon-btn-edit, .icon-btn-delete { background: none; border: none; padding: 6px; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
                .icon-btn-edit { color: var(--primary); }
                .icon-btn-edit:hover { background: rgba(129, 140, 248, 0.1); }
                .icon-btn-delete { color: var(--danger); }
                .icon-btn-delete:hover { background: rgba(244, 63, 94, 0.1); }
                .empty-history { text-align: center; padding: 2rem; color: var(--text-dim); font-size: 0.9rem; font-style: italic; }
                .success-overlay-premium { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: var(--glass-bg); backdrop-filter: blur(10px); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 2rem; }
                .success-card-premium { background: var(--bg-card); border: 1px solid var(--primary); padding: 3rem 2rem; border-radius: 2.5rem; text-align: center; max-width: 320px; width: 100%; box-shadow: 0 40px 100px rgba(0, 0, 0, 0.8); }
                .success-icon-wrapper { width: 80px; height: 80px; background: rgba(16, 185, 129, 0.1); color: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem auto; border: 2px solid rgba(16, 185, 129, 0.2); animation: bounce 1s infinite alternate; }
                .file-upload-section { margin-top: 8px; display: flex; gap: 8px; }
                .file-upload-btn { display: flex; align-items: center; gap: 6px; padding: 8px 12px; background: var(--glass-border); border: 1px dashed var(--glass-border); border-radius: 8px; font-size: 0.75rem; color: var(--text-dim); cursor: pointer; transition: all 0.3s ease; width: 100%; justify-content: center; }
                .file-upload-btn:hover { background: rgba(129, 140, 248, 0.05); border-color: var(--primary); color: var(--primary); }
                .file-upload-btn.has-file { background: rgba(16, 185, 129, 0.05); border-style: solid; border-color: #10b981; color: #10b981; }
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes pulse { 0% { opacity: 0.6; transform: scale(1); } 50% { opacity: 1; transform: scale(1.1); } 100% { opacity: 0.6; transform: scale(1); } }
                @keyframes bounce { from { transform: translateY(0); } to { transform: translateY(-10px); } }
                @media(max-width: 480px) { 
                    .driver-landscape { padding: 0.75rem; } 
                    .input-grid-premium { grid-template-columns: 1fr; } 
                    .brand-group h1 { font-size: 1.4rem; }
                    .driver-premium-header { margin-bottom: 1.5rem; }
                    .driver-greeting-row { grid-template-columns: 1fr; gap: 0.75rem; margin-bottom: 1.5rem; }
                    .stat-pill { padding: 0.8rem 1rem; }
                    .stat-pill .value { font-size: 1.1rem; }
                    .btn-premium { padding: 1.1rem; font-size: 1rem; }
                    .input-premium { padding: 0.9rem 1rem!important; font-size: 1.1rem!important; }
                    .logo-group img { height: 60px!important; }
                    .brand-logo { font-size: 1.1rem!important; }
                    .subtitle { font-size: 0.6rem!important; }
                 } 

            `}} />
        </div >
    );
};

export default DriverEntry;
