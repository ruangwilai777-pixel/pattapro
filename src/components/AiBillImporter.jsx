import React, { useState, useMemo } from 'react';
import { 
    UploadCloud, FileText, Sparkles, CheckCircle2, 
    AlertTriangle, Loader2, Database, RefreshCw, ChevronRight
} from 'lucide-react';

const AiBillImporter = ({ 
    trips, addTrip, updateTrip, fetchTrips, routePresets, 
    currentMonth, currentYear 
}) => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingStage, setLoadingStage] = useState('');
    const [parsedTrips, setParsedTrips] = useState([]);
    const [selectedDriver, setSelectedDriver] = useState('นางสาว ภัทธา เรืองวิลัย');
    const [syncing, setSyncing] = useState(false);
    const [syncResult, setSyncResult] = useState(null);

    // List of drivers available to choose for import
    const driversList = [
        'นางสาว ภัทธา เรืองวิลัย',
        'สมชาย',
    ];

    // Get all preset routes for Manual Override dropdowns
    const availablePresets = useMemo(() => {
        return routePresets ? Object.keys(routePresets) : [];
    }, [routePresets]);

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
        if (selected && (selected.type === 'application/pdf' || selected.type.startsWith('image/'))) {
            setFile(selected);
            setParsedTrips([]);
            setSyncResult(null);
        } else {
            alert('กรุณาเลือกไฟล์ PDF หรือไฟล์รูปภาพ (PNG, JPG, JPEG) เท่านั้นครับ');
        }
    };

    const handleAnalyze = async () => {
        if (!file) return;

        setLoading(true);
        setSyncResult(null);
        setLoadingStage('กำลังอ่านข้อมูลบิลเอกสาร...');

        try {
            // Read file as Base64
            const base64Data = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => {
                    // Extract only base64 string from data URL
                    const base64 = reader.result.split(',')[1];
                    resolve(base64);
                };
                reader.onerror = (error) => reject(error);
            });

            setLoadingStage('ส่งข้อมูลบิลให้ AI ประมวลผลแยกแยะค่าเที่ยว...');

            // Call secure serverless backend route
            const response = await fetch('/api/ai-bill-parser', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    pdfBase64: base64Data,
                    mimeType: file.type, // Send dynamic mimeType (e.g. image/jpeg)
                    routePresets: availablePresets
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Server error during parsing');
            }

            const data = await response.json();

            if (!data.trips || !Array.isArray(data.trips)) {
                throw new Error('AI ส่งผลลัพธ์ข้อมูลกลับมาไม่ถูกต้อง');
            }

            setLoadingStage('จับคู่เปรียบเทียบกับข้อมูลในระบบ...');

            // Map and match with existing trips in the DB
            const enriched = data.trips.map((item, index) => {
                // Find matching trip by date, route, and driver
                const matchedSystemTrip = trips.find(t => {
                    const tDate = t.date ? t.date.split('T')[0] : '';
                    const iDate = item.date ? item.date.split('T')[0] : '';
                    const isSameDate = tDate === iDate;
                    
                    const tDriver = (t.driverName || '').trim().replace(/\s+/g, ' ');
                    const isSameDriver = tDriver.includes(selectedDriver.replace(/\s+/g, ' '));

                    // Use matchedRoute or originalRoute for database lookup
                    const targetRoute = (item.matchedRoute || item.originalRoute || '').trim();
                    const tRoute = (t.route || '').trim();
                    const isSameRoute = tRoute === targetRoute;

                    return isSameDate && isSameDriver && isSameRoute;
                });

                return {
                    id: index,
                    date: item.date,
                    originalRoute: item.originalRoute,
                    matchedRoute: item.matchedRoute || item.originalRoute || '',
                    price: item.price || 0,
                    isBasket: !!item.isBasket,
                    matchedTrip: matchedSystemTrip || null,
                    selected: !item.isBasket && (item.price > 0), // select by default if not a basket fee
                    action: matchedSystemTrip ? 'update' : 'create' // update existing or create new
                };
            });

            // Filter out rows classified as basket fees
            const filtered = enriched.filter(t => !t.isBasket);

            setParsedTrips(filtered);

        } catch (error) {
            console.error(error);
            alert(`เกิดข้อผิดพลาดในการวิเคราะห์ด้วย AI: ${error.message}`);
        } finally {
            setLoading(false);
            setLoadingStage('');
        }
    };

    const handleRouteOverride = (rowId, newRoute) => {
        setParsedTrips(prev => prev.map(row => {
            if (row.id !== rowId) return row;

            // Re-match against database trips when route is manually overridden
            const matchedSystemTrip = trips.find(t => {
                const tDate = t.date ? t.date.split('T')[0] : '';
                const iDate = row.date ? row.date.split('T')[0] : '';
                const isSameDate = tDate === iDate;

                const tDriver = (t.driverName || '').trim().replace(/\s+/g, ' ');
                const isSameDriver = tDriver.includes(selectedDriver.replace(/\s+/g, ' '));

                const tRoute = (t.route || '').trim();
                const isSameRoute = tRoute === newRoute.trim();

                return isSameDate && isSameDriver && isSameRoute;
            });

            return {
                ...row,
                matchedRoute: newRoute,
                matchedTrip: matchedSystemTrip || null,
                action: matchedSystemTrip ? 'update' : 'create'
            };
        }));
    };

    const handleToggleSelect = (rowId) => {
        setParsedTrips(prev => prev.map(row => 
            row.id === rowId ? { ...row, selected: !row.selected } : row
        ));
    };

    const handleSelectAll = (val) => {
        setParsedTrips(prev => prev.map(row => ({ ...row, selected: val })));
    };

    const handleSync = async () => {
        const targets = parsedTrips.filter(t => t.selected);
        if (targets.length === 0) {
            alert('กรุณาเลือกรายการที่ต้องการบันทึกอย่างน้อย 1 รายการครับ');
            return;
        }

        const confirmMsg = `ยืนยันบันทึกค่าเที่ยวจำนวน ${targets.length} รายการเข้าฐานข้อมูลของคนขับ "${selectedDriver}" หรือไม่?`;
        if (!window.confirm(confirmMsg)) return;

        setSyncing(true);
        let updatedCount = 0;
        let createdCount = 0;
        let failedCount = 0;

        try {
            for (const item of targets) {
                const preset = routePresets[item.matchedRoute] || {};
                const defaultWage = parseFloat(preset.wage) || 0;

                if (item.action === 'update' && item.matchedTrip) {
                    // Update existing trip price
                    try {
                        const original = item.matchedTrip;
                        const res = await updateTrip(original.id, {
                            ...original,
                            price: item.price,
                            // Preserve other fields
                            driverName: selectedDriver,
                            date: item.date,
                            route: item.matchedRoute
                        });
                        if (res && res.success) updatedCount++;
                        else failedCount++;
                    } catch (e) {
                        console.error(e);
                        failedCount++;
                    }
                } else {
                    // Create a new trip
                    try {
                        const res = await addTrip({
                            date: item.date,
                            route: item.matchedRoute,
                            driverName: selectedDriver,
                            price: item.price,
                            fuel: 0,
                            wage: defaultWage,
                            basket: 0,
                            maintenance: 0,
                            staffShare: 0,
                            basketShare: 0,
                            basketCount: 0
                        });
                        if (res && res.success) createdCount++;
                        else failedCount++;
                    } catch (e) {
                        console.error(e);
                        failedCount++;
                    }
                }
            }

            // Refresh trips in parent state
            await fetchTrips();

            setSyncResult({
                success: true,
                updatedCount,
                createdCount,
                failedCount
            });

            // Reset list
            setParsedTrips([]);
            setFile(null);

        } catch (err) {
            console.error(err);
            alert(`เกิดข้อผิดพลาดในการซิงก์ข้อมูล: ${err.message}`);
        } finally {
            setSyncing(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* 1. CONFIG PANEL */}
            <div className="glass-card" style={{ 
                background: 'var(--glass-bg)', 
                border: '1px solid var(--glass-border)', 
                borderRadius: '24px', 
                padding: '1.75rem',
                backdropFilter: 'blur(20px)'
            }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Sparkles size={18} color="#a78bfa" /> ✨ นำเข้าข้อมูลบิลค่าเที่ยวด้วย AI อัจฉริยะ (Gemini 2.5)
                </h3>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'flex-end' }}>
                    {/* Driver Selection */}
                    <div style={{ flex: '1 1 250px' }}>
                        <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 700, marginBottom: '6px' }}>
                            เลือกคนขับที่ต้องการอัปโหลดบิล
                        </label>
                        <select 
                            value={selectedDriver}
                            onChange={(e) => {
                                setSelectedDriver(e.target.value);
                                setParsedTrips([]);
                            }}
                            style={{
                                width: '100%',
                                padding: '10px 14px',
                                borderRadius: '12px',
                                border: '1px solid var(--glass-border)',
                                background: 'rgba(255,255,255,0.04)',
                                color: 'var(--text-main)',
                                fontSize: '0.85rem',
                                fontWeight: 700,
                                outline: 'none'
                            }}
                        >
                            {driversList.map(d => (
                                <option key={d} value={d} style={{ background: '#1e1b4b', color: '#fff' }}>{d}</option>
                            ))}
                        </select>
                    </div>

                    {/* File Dropzone */}
                    <div style={{ flex: '2 1 350px' }}>
                        <div style={{
                            border: '2px dashed var(--glass-border)',
                            borderRadius: '16px',
                            padding: '1.2rem',
                            textAlign: 'center',
                            cursor: 'pointer',
                            position: 'relative',
                            background: file ? 'rgba(99,102,241,0.06)' : 'transparent',
                            transition: 'all 0.3s ease'
                        }}>
                            <input 
                                type="file" 
                                accept="application/pdf, image/png, image/jpeg, image/jpg"
                                onChange={handleFileChange}
                                style={{
                                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                                    opacity: 0, cursor: 'pointer'
                                }} 
                            />
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                                <UploadCloud size={28} color={file ? '#818cf8' : '#64748b'} />
                                {file ? (
                                    <div>
                                        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-main)' }}>{file.name}</div>
                                        <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>{(file.size / 1024).toFixed(1)} KB | พร้อมวิเคราะห์</div>
                                    </div>
                                ) : (
                                    <div>
                                        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-dim)' }}>ลากไฟล์ PDF หรือรูปภาพบิลมาวางตรงนี้ หรือคลิกเพื่ออัปโหลด</div>
                                        <div style={{ fontSize: '0.68rem', color: '#475569' }}>รองรับไฟล์ PDF, PNG, JPG, JPEG (เช่น บิลค่าเที่ยวสแกนหรือแคปจาก Line)</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Start Action Button */}
                    <div style={{ flex: '0 0 auto' }}>
                        <button
                            onClick={handleAnalyze}
                            disabled={!file || loading}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                padding: '12px 24px',
                                borderRadius: '12px',
                                border: 'none',
                                background: file && !loading ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' : '#334155',
                                color: file && !loading ? 'white' : '#64748b',
                                cursor: file && !loading ? 'pointer' : 'not-allowed',
                                fontSize: '0.88rem',
                                fontWeight: 800,
                                boxShadow: file && !loading ? '0 4px 14px rgba(99,102,241,0.4)' : 'none',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    <span>กำลังอ่านบิล...</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles size={16} />
                                    <span>เริ่มวิเคราะห์บิล AI</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Progress bar when loading */}
                {loading && (
                    <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ fontSize: '0.75rem', color: '#a78bfa', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Loader2 size={14} className="animate-spin" />
                            <span>{loadingStage}</span>
                        </div>
                        <div style={{ width: '100%', height: 4, borderRadius: 2, background: 'var(--glass-border)', overflow: 'hidden' }}>
                            <div style={{ 
                                height: '100%', 
                                width: loadingStage.includes('ดึงข้อมูล') ? '30%' : loadingStage.includes('Gemini') ? '70%' : '90%', 
                                background: 'linear-gradient(90deg, #6366f1, #d946ef)',
                                transition: 'width 1s ease'
                            }} />
                        </div>
                    </div>
                )}
            </div>

            {/* 2. SUCCESS SYNC RESULT NOTIFICATION */}
            {syncResult && (
                <div style={{
                    background: 'rgba(16,185,129,0.08)',
                    border: '1px solid rgba(16,185,129,0.2)',
                    borderRadius: '20px',
                    padding: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    color: '#34d399'
                }}>
                    <CheckCircle2 size={24} />
                    <div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 800 }}>บันทึกข้อมูลเรียบร้อยแล้วเจ้า!</div>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>
                            อัปเดตเที่ยวงานเดิม {syncResult.updatedCount} รายการ | สร้างเที่ยวงานใหม่ {syncResult.createdCount} รายการ | ล้มเหลว {syncResult.failedCount} รายการ
                        </div>
                    </div>
                </div>
            )}

            {/* 3. PREVIEW & EDITING TABLE */}
            {parsedTrips.length > 0 && (
                <div className="glass-card" style={{
                    background: 'var(--glass-bg)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '24px',
                    padding: '1.5rem',
                    backdropFilter: 'blur(20px)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <div>
                            <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                                📋 ตารางพรีวิวยอดค่าเที่ยวที่ AI อ่านได้จากบิล
                            </h3>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', margin: '2px 0 0 0' }}>
                                *ค่าตะกร้า (300, 600, 1000) ถูกคัดแยกออกเรียบร้อยแล้ว และระบบจะไม่บันทึกค่าตะกร้าโดยอัตโนมัติ
                            </p>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                                onClick={() => handleSelectAll(true)}
                                style={{ background: 'transparent', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '4px 10px', fontSize: '0.7rem', color: 'var(--text-dim)', cursor: 'pointer', fontWeight: 700 }}
                            >
                                เลือกทั้งหมด
                            </button>
                            <button 
                                onClick={() => handleSelectAll(false)}
                                style={{ background: 'transparent', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '4px 10px', fontSize: '0.7rem', color: 'var(--text-dim)', cursor: 'pointer', fontWeight: 700 }}
                            >
                                ล้างทั้งหมด
                            </button>
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto', width: '100%', marginBottom: '1.5rem' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                    <th style={{ padding: '8px 12px', width: 40 }}></th>
                                    <th style={{ padding: '8px 12px', color: '#64748b', fontWeight: 700 }}>วันที่</th>
                                    <th style={{ padding: '8px 12px', color: '#64748b', fontWeight: 700 }}>สายงานในบิล PDF</th>
                                    <th style={{ padding: '8px 12px', color: '#64748b', fontWeight: 700 }}>สายงานจับคู่ในระบบ (Manual Override)</th>
                                    <th style={{ padding: '8px 12px', color: '#64748b', fontWeight: 700, textAlign: 'right' }}>ค่าเที่ยวจากบิล</th>
                                    <th style={{ padding: '8px 12px', color: '#64748b', fontWeight: 700, textAlign: 'center' }}>สถานะ/การดำเนินการ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {parsedTrips.map((row) => {
                                    const isMatch = !!row.matchedTrip;
                                    return (
                                        <tr key={row.id} style={{ 
                                            borderBottom: '1px solid var(--glass-border)',
                                            background: row.selected ? 'rgba(99,102,241,0.02)' : 'transparent',
                                            opacity: row.selected ? 1 : 0.6,
                                            transition: 'opacity 0.2s ease'
                                        }}>
                                            {/* Select Checkbox */}
                                            <td style={{ padding: '12px 12px', textAlign: 'center' }}>
                                                <input 
                                                    type="checkbox"
                                                    checked={row.selected}
                                                    onChange={() => handleToggleSelect(row.id)}
                                                    style={{ width: 15, height: 15, cursor: 'pointer' }}
                                                />
                                            </td>
                                            
                                            {/* Date */}
                                            <td style={{ padding: '12px 12px', color: '#e2e8f0', fontWeight: 700 }}>
                                                {new Date(row.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </td>
                                            
                                            {/* Original Route */}
                                            <td style={{ padding: '12px 12px', color: 'var(--text-dim)' }}>
                                                {row.originalRoute}
                                            </td>
                                            
                                            {/* Manual Override Preset Selector */}
                                            <td style={{ padding: '12px 12px' }}>
                                                <select
                                                    value={row.matchedRoute}
                                                    onChange={(e) => handleRouteOverride(row.id, e.target.value)}
                                                    style={{
                                                        padding: '4px 8px',
                                                        borderRadius: '8px',
                                                        border: '1px solid var(--glass-border)',
                                                        background: 'rgba(255,255,255,0.02)',
                                                        color: '#e2e8f0',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 600,
                                                        outline: 'none',
                                                        maxWidth: 240
                                                    }}
                                                >
                                                    <option value="" disabled style={{ background: '#1e1b4b' }}>-- เลือกเส้นทาง --</option>
                                                    {!availablePresets.includes(row.matchedRoute) && row.matchedRoute && (
                                                        <option value={row.matchedRoute} style={{ background: '#1e1b4b' }}>{row.matchedRoute} (จับคู่ไม่ได้)</option>
                                                    )}
                                                    {availablePresets.map(presetName => (
                                                        <option key={presetName} value={presetName} style={{ background: '#1e1b4b' }}>{presetName}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            
                                            {/* Price */}
                                            <td style={{ padding: '12px 12px', textAlign: 'right', color: '#38bdf8', fontWeight: 800, fontSize: '0.85rem' }}>
                                                ฿{row.price.toLocaleString('th-TH')}
                                            </td>
                                            
                                            {/* DB Status & Action */}
                                            <td style={{ padding: '12px 12px', textAlign: 'center' }}>
                                                {isMatch ? (
                                                    <span style={{ 
                                                        display: 'inline-flex', alignItems: 'center', gap: 4,
                                                        background: 'rgba(56,189,248,0.1)', color: '#38bdf8',
                                                        padding: '3px 8px', borderRadius: '12px', fontSize: '0.68rem', fontWeight: 700 
                                                    }}>
                                                        <Database size={12} />
                                                        อัปเดตค่าเที่ยว (เดิม ฿{row.matchedTrip.price || 0})
                                                    </span>
                                                ) : (
                                                    <span style={{ 
                                                        display: 'inline-flex', alignItems: 'center', gap: 4,
                                                        background: 'rgba(245,158,11,0.1)', color: '#f59e0b',
                                                        padding: '3px 8px', borderRadius: '12px', fontSize: '0.68rem', fontWeight: 700 
                                                    }}>
                                                        <AlertTriangle size={12} />
                                                        สร้างเที่ยวงานใหม่
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Sync Button */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                            onClick={handleSync}
                            disabled={syncing}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                padding: '10px 24px',
                                borderRadius: '12px',
                                border: 'none',
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                color: 'white',
                                cursor: syncing ? 'not-allowed' : 'pointer',
                                fontSize: '0.88rem',
                                fontWeight: 800,
                                boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            {syncing ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    <span>กำลังบันทึกเข้าระบบ...</span>
                                </>
                            ) : (
                                <>
                                    <Database size={16} />
                                    <span>ยืนยันบันทึกข้อมูลเข้าระบบ ({parsedTrips.filter(t => t.selected).length})</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AiBillImporter;
