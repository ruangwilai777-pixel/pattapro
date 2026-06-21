import React, { useState, useEffect } from 'react';
import { PlusCircle, Save, X, ChevronLeft, ChevronRight, Calendar, MapPin, User, Banknote, Fuel, Truck, Wrench, Wallet, History, Sparkles, Camera, ShoppingBasket } from 'lucide-react';
import { getLocalDate } from '../utils/dateUtils';

const TripForm = ({ onAdd, onUpdate, uploadFile, routePresets, fetchPresets, externalDate, onDateChange, editingTrip, onCancelEdit }) => {
    const [fuelFile, setFuelFile] = useState(null);
    const [maintFile, setMaintFile] = useState(null);
    const [basketFile, setBasketFile] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState({
        driverName: localStorage.getItem('lastAdminDriverName') || '',
        route: '',
        price: '',
        fuel: '',
        wage: '',
        basket: '',
        staffShare: '',
        basketCount: '',
        basketShare: '',
        maintenance: '',
        advance: '',
        date: getLocalDate()
    });

    // Start with global presets, but verify date matches logic
    const [dynamicPresets, setDynamicPresets] = useState(routePresets);

    // Updated: Use ACTUAL calendar month/year for preset lookups as requested
    const getCalendarInfo = (dateStr) => {
        if (!dateStr) return { month: new Date().getMonth(), year: new Date().getFullYear() };
        const [y, m, d] = dateStr.split('-').map(Number);
        const dateObj = new Date(y, m - 1, d);
        return { month: dateObj.getMonth(), year: dateObj.getFullYear() };
    };

    // Helper: Update presets whenever the date changes
    useEffect(() => {
        const refreshPresets = async () => {
            const { month, year } = getCalendarInfo(formData.date);
            // If we have a fetcher, use it to get specific month's rates
            if (fetchPresets) {
                const monthlyData = await fetchPresets(month, year, false);
                setDynamicPresets(monthlyData || {});
            }
        };
        refreshPresets();
    }, [formData.date, fetchPresets]);

    const handleRouteChange = (e) => {
        const routeName = e.target.value;
        const preset = dynamicPresets[routeName];
        if (preset) {
            setFormData(prev => ({
                ...prev,
                route: routeName,
                price: preset.price || '',
                wage: preset.wage || ''
            }));
        } else {
            // Smart Remember for Admin: Check if we have a manually saved price/wage for this route
            const savedData = JSON.parse(localStorage.getItem('adminLastDataPerRoute') || '{}');
            const lastTripData = savedData[routeName] || { price: '', wage: '' };

            setFormData(prev => ({
                ...prev,
                route: routeName,
                price: lastTripData.price || '',
                wage: lastTripData.wage || ''
            }));
        }
    };

    // Auto-calculate Basket Share based on Count (Tier Logic)
    const handleBasketCountChange = (e) => {
        const count = parseInt(e.target.value) || 0;
        let revenue = 0;
        let share = 0;

        if (count >= 101) {
            revenue = 1000;
            share = 700;
        } else if (count >= 91) {
            revenue = 600;
            share = 400;
        } else if (count >= 86) {
            revenue = 300;
            share = 200;
        }

        setFormData(prev => ({
            ...prev,
            basketCount: e.target.value,
            basket: revenue,
            basketShare: share
        }));
    };

    // Update internal state when external props change
    useEffect(() => {
        // Reset file selections when switching records
        setFuelFile(null);
        setMaintFile(null);
        setBasketFile(null);

        if (editingTrip) {
            setFormData({
                ...editingTrip,
                driverName: editingTrip.driverName || editingTrip.driver_name || '',
                staffShare: editingTrip.staffShare || editingTrip.staff_share || '',
                basketCount: editingTrip.basketCount || editingTrip.basket_count || '',
                basketShare: editingTrip.basketShare || editingTrip.basket_share || ''
            });
        } else if (externalDate) {
            const nextDate = externalDate.value;
            if (nextDate !== formData.date) {
                setFormData(prev => ({ ...prev, date: nextDate }));
            }
        }
    }, [editingTrip, externalDate, formData.date]);

    const handleDateShift = (days) => {
        const [y, m, d] = formData.date.split('-').map(Number);
        const current = new Date(y, m - 1, d);
        current.setDate(current.getDate() + days);

        const newY = current.getFullYear();
        const newM = String(current.getMonth() + 1).padStart(2, '0');
        const newD = String(current.getDate()).padStart(2, '0');
        const newDate = `${newY}-${newM}-${newD}`;

        setFormData({ ...formData, date: newDate });
        if (onDateChange) onDateChange(newDate);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.route) {
            alert('กรุณากรอก "สายงาน" เป็นอย่างน้อยเพื่อบันทึก');
            return;
        }

        setIsSaving(true);
        try {
            const finalData = { ...formData };
            if (!finalData.wage) {
                finalData.wage = 0;
            }
            if (uploadFile) {
                if (fuelFile) {
                    const url = await uploadFile(fuelFile, 'fuel_bills');
                    if (!url) alert('❌ อัพรูปน้ำมันไม่ผ่าน (ติดสิทธิ์ Policy หรือไม่มี Bucket)');
                    else alert('✅ อัพโหลดรูปผ่าน (กำลังบันทึกลงฐานข้อมูล...)');
                    finalData.fuel_bill_url = url;
                }
                if (maintFile) {
                    const url = await uploadFile(maintFile, 'maintenance_bills');
                    if (!url) alert('❌ อัพรูปซ่อมไม่ผ่าน (ติดสิทธิ์ Policy หรือไม่มี Bucket)');
                    else alert('✅ อัพโหลดรูปผ่าน (กำลังบันทึกลงฐานข้อมูล...)');
                    finalData.maintenance_bill_url = url;
                }
                if (basketFile) {
                    const url = await uploadFile(basketFile, 'basket_bills');
                    if (!url) alert('❌ อัพรูปตะกร้าไม่ผ่าน (ติดสิทธิ์ Policy หรือไม่มี Bucket)');
                    else alert('✅ อัพโหลดรูปผ่าน (กำลังบันทึกลงฐานข้อมูล...)');
                    finalData.basket_bill_url = url;
                }
            } else {
                alert('⚠️ ระบบอัพโหลดไม่พร้อมใช้งาน (เช็ค Supabase Connection)');
            }

            if (editingTrip) {
                await onUpdate(editingTrip.id, finalData);
            } else {
                await onAdd(finalData);
                // Resetting selectively for faster entry
                setFormData(prev => ({
                    ...prev,
                    route: '',
                    price: '',
                    wage: '',
                    fuel: '',
                    basket: '',
                    basketShare: '',
                    basketCount: '',
                    maintenance: '',
                    advance: '',
                    staffShare: ''
                }));
            }

            // Smart Remember for Admin: Save current price/wage for this route
            if (formData.route && (formData.price || formData.wage)) {
                const savedData = JSON.parse(localStorage.getItem('adminLastDataPerRoute') || '{}');
                savedData[formData.route] = {
                    price: formData.price,
                    wage: formData.wage
                };
                localStorage.setItem('adminLastDataPerRoute', JSON.stringify(savedData));
            }

            // Clear files after success
            setFuelFile(null);
            setMaintFile(null);
            setBasketFile(null);

            // Clear input values manually since they are uncontrolled
            document.querySelectorAll('input[type="file"]').forEach(input => input.value = '');

        } catch (err) {
            console.error("Save error:", err);
            alert("บันทึกไม่สำเร็จ: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="glass-card admin-trip-form-card">
            <div className="form-header-premium">
                <h3 className="form-title">
                    <History size={22} className="text-primary" />
                    บันทึกข้อมูลกองรถ (Admin)
                </h3>
            </div>

            <div className="date-picker-row">
                <label className="date-label">วันที่</label>
                <div className="date-controls">
                    <button type="button" className="date-nav-btn" onClick={() => handleDateShift(-1)}>
                        <ChevronLeft size={18} />
                    </button>
                    <input
                        type="date"
                        className="date-input-minimal"
                        value={formData.date}
                        onChange={(e) => {
                            setFormData({ ...formData, date: e.target.value });
                            if (onDateChange) onDateChange(e.target.value);
                        }}
                    />
                    <button type="button" className="date-nav-btn" onClick={() => handleDateShift(1)}>
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            <div className="admin-form-grid">
                {/* Column Left */}
                <div className="grid-column">
                    <div className="input-field-premium">
                        <label><User size={14} /> ชื่อคนขับ</label>
                        <input
                            type="text"
                            className="input-premium-compact"
                            placeholder="ระบุชื่อคนขับ..."
                            value={formData.driverName}
                            onChange={(e) => {
                                setFormData({ ...formData, driverName: e.target.value });
                                localStorage.setItem('lastAdminDriverName', e.target.value);
                            }}
                        />
                    </div>
                    <div className="input-field-premium">
                        <label><Banknote size={14} /> ราคาค่าเที่ยว (บาท)</label>
                        <input
                            type="number"
                            className="input-premium-compact"
                            placeholder="0"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        />
                    </div>
                    <div className="input-field-premium">
                        <div className="label-row">
                            <label><Fuel size={14} /> ค่าน้ำมัน</label>
                            <div className="file-action-mini">
                                <label className="file-label-mini">
                                    <Camera size={10} /> {fuelFile ? 'เลือกแล้ว' : (formData.fuel_bill_url ? 'มีตั๋ว' : 'แนบตั๋ว')}
                                    <input type="file" accept="image/*" onChange={(e) => setFuelFile(e.target.files[0])} style={{ display: 'none' }} />
                                </label>
                                {(fuelFile || formData.fuel_bill_url) && (
                                    <button
                                        type="button"
                                        className="preview-btn-premium"
                                        onClick={() => window.open(fuelFile ? URL.createObjectURL(fuelFile) : formData.fuel_bill_url, '_blank')}
                                        title="คลิกเพื่อดูรูปน้ำมัน"
                                    >
                                        <Camera size={12} /> ดูรูป
                                    </button>
                                )}
                            </div>
                        </div>
                        <input
                            type="number"
                            className="input-premium-compact"
                            placeholder="0"
                            value={formData.fuel}
                            onChange={(e) => setFormData({ ...formData, fuel: e.target.value })}
                        />
                    </div>
                    <div className="input-field-premium">
                        <div className="label-row">
                            <label><Wrench size={14} /> ค่าซ่อม</label>
                            <div className="file-action-mini">
                                <label className="file-label-mini">
                                    <Camera size={10} /> {maintFile ? 'เลือกแล้ว' : (formData.maintenance_bill_url ? 'มีตั๋ว' : 'แนบตั๋ว')}
                                    <input type="file" accept="image/*" onChange={(e) => setMaintFile(e.target.files[0])} style={{ display: 'none' }} />
                                </label>
                                {(maintFile || formData.maintenance_bill_url) && (
                                    <button
                                        type="button"
                                        className="preview-btn-premium"
                                        onClick={() => window.open(maintFile ? URL.createObjectURL(maintFile) : formData.maintenance_bill_url, '_blank')}
                                        title="คลิกเพื่อดูรูปค่าซ่อม"
                                    >
                                        <Camera size={12} /> ดูรูป
                                    </button>
                                )}
                            </div>
                        </div>
                        <input
                            type="number"
                            className="input-premium-compact"
                            placeholder="0"
                            value={formData.maintenance}
                            onChange={(e) => setFormData({ ...formData, maintenance: e.target.value })}
                        />
                    </div>
                    <div className="input-field-premium">
                        <div className="label-row">
                            <label><Banknote size={14} /> รายได้ตะกร้า</label>
                            <div className="file-action-mini">
                                <label className="file-label-mini">
                                    <Camera size={10} /> {basketFile ? 'เลือกแล้ว' : (formData.basket_bill_url ? 'มีตั๋ว' : 'แนบตั๋ว')}
                                    <input type="file" accept="image/*" onChange={(e) => setBasketFile(e.target.files[0])} style={{ display: 'none' }} />
                                </label>
                                {(basketFile || formData.basket_bill_url) && (
                                    <button
                                        type="button"
                                        className="preview-btn-premium"
                                        onClick={() => window.open(basketFile ? URL.createObjectURL(basketFile) : formData.basket_bill_url, '_blank')}
                                        title="คลิกเพื่อดูรูปตะกร้า"
                                    >
                                        <Camera size={12} /> ดูรูป
                                    </button>
                                )}
                            </div>
                        </div>
                        <input
                            type="number"
                            className="input-premium-compact"
                            placeholder="0"
                            value={formData.basket}
                            onChange={(e) => setFormData({ ...formData, basket: e.target.value })}
                        />
                    </div>
                </div>

                {/* Column Right */}
                <div className="grid-column">
                    <div className="input-field-premium">
                        <label><MapPin size={14} /> สายงาน (เส้นทาง)</label>
                        <input
                            type="text"
                            list="route-options"
                            className="input-premium-compact"
                            placeholder="ระบุสายงาน..."
                            value={formData.route}
                            onChange={handleRouteChange}
                        />
                        <datalist id="route-options">
                            {Object.keys(dynamicPresets).map(route => (
                                <option key={route} value={route} />
                            ))}
                        </datalist>
                    </div>

                    <div className="input-field-premium">
                        <label><ShoppingBasket size={14} /> จำนวนตะกร้า (ใบ)</label>
                        <input
                            type="number"
                            className="input-premium-compact"
                            placeholder="0"
                            value={formData.basketCount}
                            onChange={handleBasketCountChange}
                        />
                    </div>
                    <div className="input-field-premium">
                        <label><Wallet size={14} /> ยอดเบิกสะสม</label>
                        <input
                            type="number"
                            className="input-premium-compact"
                            placeholder="0"
                            value={formData.staffShare}
                            onChange={(e) => setFormData({ ...formData, staffShare: e.target.value })}
                        />
                    </div>
                    <div className="input-field-premium">
                        <label><Sparkles size={14} /> ส่วนแบ่งตะกร้า (บาท)</label>
                        <input
                            type="number"
                            className="input-premium-compact"
                            placeholder="0"
                            value={formData.basketShare}
                            onChange={(e) => setFormData({ ...formData, basketShare: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '0.8rem' }}>
                <button type="button" onClick={onCancelEdit} style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '13px' }}>
                    ยกเลิก
                </button>
                <button type="submit" className="save-btn-premium" disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'SAVE CHECK'}
                </button>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .admin-trip-form-card { border-radius: 1.5rem; background: var(--glass-bg); color: var(--text-main); border: 1px solid var(--glass-border); backdrop-filter: blur(24px); box-shadow: var(--glass-shadow); padding: 0.8rem!important; }
                .form-header-premium { margin-bottom: 0.25rem; }
                .form-title { font-size: 0.95rem; font-weight: 800; display: flex; align-items: center; gap: 8px; color: var(--text-main); }
                
                .date-picker-row { display: flex; align-items: center; gap: 8px; margin-bottom: 0.5rem; background: rgba(0,0,0,0.1); padding: 4px 8px; border-radius: 8px; }
                .date-label { font-size: 10px; font-weight: 700; color: var(--text-dim); min-width: 35px; }
                .date-controls { display: flex; align-items: center; gap: 4px; flex: 1; justify-content: flex-end; }
                .date-nav-btn { background: var(--glass-border); border: 1px solid var(--glass-border); color: var(--text-dim); padding: 2px; border-radius: 4px; cursor: pointer; transition: all 0.2s; }
                .date-nav-btn:hover { background: rgba(129, 140, 248, 0.2); color: var(--primary); }
                .date-input-minimal { background: transparent; border: none; padding: 0; color: var(--text-main); font-weight: 700; font-family: inherit; outline: none; font-size: 11.5px; cursor: pointer; text-align: right; }
                
                .admin-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
                .grid-column { display: flex; flex-direction: column; gap: 0.35rem; }
                
                .input-field-premium { display: flex; flex-direction: column; gap: 1px; position: relative; }
                .label-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1px; height: 14px; }
                .input-field-premium label { display: flex; align-items: center; gap: 3px; font-size: 9.5px; font-weight: 700; color: var(--text-dim); margin: 0; }
                .input-premium-compact { background: rgba(0,0,0,0.2) !important; border: 1px solid var(--glass-border) !important; border-radius: 6px !important; padding: 4px 8px !important; color: white !important; font-size: 11px !important; font-weight: 600 !important; height: 28px; }
                .input-premium-compact:focus { border-color: var(--primary) !important; background: var(--glass-border) !important; }
                
                .preview-btn-premium { background: rgba(45, 212, 191, 0.15); border: 1px solid rgba(45, 212, 191, 0.4); color: #2dd4bf; padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 4px; transition: all 0.2s; }
                .preview-btn-premium:hover { background: #2dd4bf; color: #0f172a; box-shadow: 0 0 10px rgba(45, 212, 191, 0.4); }
                
                .save-btn-premium { 
                    background: linear-gradient(135deg, var(--primary), var(--accent)); 
                    color: white; 
                    border: none; 
                    padding: 0 16px; 
                    border-radius: 8px; 
                    font-weight: 800; 
                    font-size: 12px;
                    display: flex; 
                    align-items: center; 
                    gap: 5px; 
                    cursor: pointer; 
                    transition: all 0.3s;
                    box-shadow: 0 4px 12px rgba(129, 140, 248, 0.2);
                    width: 100%;
                    justify-content: center;
                    height: 34px;
                }
                .save-btn-premium:hover { transform: translateY(-1px); filter: brightness(1.2); box-shadow: 0 10px 20px rgba(129, 140, 248, 0.3); }
                .save-btn-premium:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

                .file-action-mini { display: flex; gap: 3px; align-items: center; }
                .file-label-mini { 
                    display: inline-flex; 
                    align-items: center; 
                    gap: 3px; 
                    font-size: 8.5px; 
                    font-weight: 600; 
                    color: var(--primary); 
                    background: rgba(129, 140, 248, 0.1); 
                    padding: 1px 5px; 
                    border-radius: 3px; 
                    cursor: pointer; 
                    transition: all 0.2s;
                    border: 1px solid rgba(129, 140, 248, 0.2);
                    height: 16px;
                    white-space: nowrap;
                }
                .file-label-mini:hover { background: rgba(129, 140, 248, 0.2); }
                .preview-btn-mini {
                    font-size: 8.5px;
                    padding: 1px 5px;
                    background: rgba(16, 185, 129, 0.15);
                    color: #10b981;
                    border: 1px solid rgba(16, 185, 129, 0.3);
                    border-radius: 3px;
                    cursor: pointer;
                    height: 16px;
                }
                
                @media (max-width: 600px) {
                    .admin-form-grid { grid-template-columns: 1fr; gap: 0.5rem; }
                }
                `
            }} />
        </form>
    );
};

export default TripForm;
