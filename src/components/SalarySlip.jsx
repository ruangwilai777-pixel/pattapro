import React from 'react';
import ReactDOM from 'react-dom';
import { X, Printer, Truck, Wallet, TrendingDown, Info, Shield, Receipt, Download, Image as ImageIcon } from 'lucide-react';
import html2canvas from 'html2canvas';
import { logoBase64 } from '../assets/logoBase64';


const SalarySlip = ({ driverName, trips, onClose, period, cnDeduction = 0 }) => {
    const slipRef = React.useRef(null);
    const [isDownloading, setIsDownloading] = React.useState(false);
    const [capturedImg, setCapturedImg] = React.useState(null);
    const [zoom, setZoom] = React.useState(1.0);

    // Safety Parser
    const p = (val) => parseFloat(val) || 0;

    const totalWage = trips.reduce((sum, t) => sum + p(t.wage), 0);
    const totalBasketShare = trips.reduce((sum, t) => sum + p(t.basketShare), 0);
    const totalAdvance = trips.reduce((sum, t) => sum + p(t.staffShare), 0);
    const cn = p(cnDeduction);

    const housingAllowance = trips.length > 0 ? 1000 : 0;
    const totalIncome = totalWage + totalBasketShare + housingAllowance;
    const netPay = totalIncome - totalAdvance - cn;

    const handleDownloadImage = async () => {
        if (!slipRef.current) return;
        setIsDownloading(true);
        setCapturedImg(null);

        try {
            await new Promise(r => setTimeout(r, 400));
            const canvas = await html2canvas(slipRef.current, {
                scale: 3,
                useCORS: true,
                backgroundColor: '#020617',
                logging: false,
                width: slipRef.current.offsetWidth,
                height: slipRef.current.offsetHeight,
                onclone: (doc) => {
                    const clonedSlip = doc.querySelector('.slip-card-premium');
                    if (clonedSlip) {
                        clonedSlip.style.backdropFilter = 'none';
                        clonedSlip.style.background = '#020617';
                    }
                }
            });

            const imageData = canvas.toDataURL("image/png", 1.0);

            const link = document.createElement('a');
            link.download = `Slip_${driverName}_${period.replace(/\//g, '-')}.png`;
            link.href = imageData;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setCapturedImg(imageData);
        } catch (err) {
            console.error('Save failed:', err);
            alert('ไม่สามารถเซฟรูปได้ในแอปนี้ กรุณาลองแคปหน้าจอแทนนะครับ');
        } finally {
            setIsDownloading(false);
        }
    };



    const modalContent = (
        <div className="modal-overlay fade-in">
            <div className="slip-window" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div ref={slipRef} className="glass-card slip-card-premium fade-in-up" style={{ zoom: zoom }}>
                    {/* Header */}
                    <div className="slip-header-premium">
                        <div className="header-brand">
                            <div className="brand-logo-container" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <img src={logoBase64} alt="Logo" style={{ height: '65px', width: 'auto', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.4)', display: 'block' }} />
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <h1 className="brand-logo" style={{ fontSize: '1.3rem', margin: 0, lineHeight: '1.2', fontWeight: '800' }}>ภัทธา ทรานสปอร์ต</h1>
                                    <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 'bold', letterSpacing: '1px' }}>PATTA TRANSPORT</span>
                                </div>
                            </div>
                            <div className="official-badge">
                                <Shield size={10} /> OFFICIAL SLIP
                            </div>
                        </div>
                        <button className="btn-close-minimal no-print" onClick={onClose}><X size={22} /></button>
                    </div>

                    <div className="slip-body-premium">
                        {/* Summary Header */}
                        <div className="info-grid">
                            <div className="info-item">
                                <span className="label">ชื่อคนขับ</span>
                                <span className="value">{driverName}</span>
                            </div>
                            <div className="info-item" style={{ textAlign: 'right' }}>
                                <span className="label">รอบสรุปยอด</span>
                                <span className="value">{period}</span>
                            </div>
                        </div>

                        {/* SECTION: INCOME */}
                        <div className="slip-section">
                            <div className="section-title text-safe">
                                <Wallet size={14} /> รายรับ (+)
                            </div>
                            <div className="data-table">
                                <div className="data-row">
                                    <span>ค่าแรง ({trips.length} เที่ยว)</span>
                                    <span className="val">฿{totalWage.toLocaleString()}</span>
                                </div>
                                <div className="data-row">
                                    <span>ค่าตะกร้า</span>
                                    <span className="val">฿{totalBasketShare.toLocaleString()}</span>
                                </div>
                                <div className="data-row highlight">
                                    <span>ค่าที่พัก</span>
                                    <span className="val text-safe">฿{housingAllowance.toLocaleString()}</span>
                                </div>
                                <div className="data-divider"></div>
                                <div className="data-total">
                                    <span>รวมรายได้ทั้งหมด</span>
                                    <span className="total-val text-safe">฿{totalIncome.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* SECTION: DEDUCTIONS */}
                        <div className="slip-section" style={{ marginTop: '1.5rem' }}>
                            <div className="section-title text-danger">
                                <TrendingDown size={14} /> รายรายการหัก (-)
                            </div>
                            <div className="data-table">
                                <div className="data-row">
                                    <span>ยอดเงินเบิกสะสม</span>
                                    <span className="val-danger">-฿{totalAdvance.toLocaleString()}</span>
                                </div>
                                {cn > 0 && (
                                    <div className="data-row">
                                        <span>หักค่าสินค้า (CN)</span>
                                        <span className="val-danger">-฿{cn.toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="data-divider"></div>
                                <div className="data-total">
                                    <span>รวมรายการหัก</span>
                                    <span className="total-val text-danger">-฿{(totalAdvance + cn).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* FINAL PAYOUT */}
                        <div className="final-pay-container">
                            <div className="pay-card">
                                <span className="pay-label">ยอดจ่ายสุทธิคงเหลือ</span>
                                <div className="pay-amount-row">
                                    <span className="currency">฿</span>
                                    <span className="amount">{netPay.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Footnote */}
                        <div className="slip-footnote">
                            <Info size={14} /> <span>แจ้งยอดคนขับเพื่อตรวจสอบความถูกต้อง</span>
                        </div>

                        {/* Signature area for Print Only */}
                        <div className="print-only signature-area">
                            <div className="sig-block">
                                <div className="sig-line"></div>
                                <p>ผู้รับเงิน</p>
                            </div>
                            <div className="sig-block">
                                <div className="sig-line"></div>
                                <p>บริษัท / ผู้อนุมัติจ่าย</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="slip-footer no-print">
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button
                            className="btn btn-primary slip-btn"
                            onClick={handleDownloadImage}
                            disabled={isDownloading}
                        >
                            <ImageIcon size={18} />
                            {isDownloading ? 'กำลังประมวลผล...' : 'บันทึกรูปสลิป'}
                        </button>
                        <button className="btn btn-outline slip-btn" onClick={onClose} style={{ flex: 0.4 }}>
                            ปิด
                        </button>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .modal-overlay {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(2, 6, 23, 0.9);
                    backdrop-filter: blur(20px);
                    display: flex;
                    align-items: flex-start;
                    justify-content: center;
                    justify-content: center;
                    z-index: 9999;
                    padding: 2rem 1rem;
                    overflow-y: auto;
                    overflow-x: auto;
                }
                .slip-window { width: 100%; max-width: 420px; }
                .slip-card-premium { 
                    background: linear-gradient(165deg, #0f172a 0%, #020617 100%); 
                    border: 1px solid var(--glass-border);
                    border-radius: 2.5rem;
                    overflow: hidden;
                    box-shadow: 0 40px 100px rgba(0,0,0,0.6);
                    position: relative;
                }
                .slip-card-premium::before {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; right: 0; height: 1px;
                    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
                }
                .slip-header-premium { 
                    padding: 1.5rem 2rem 1rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    position: relative;
                }
                .header-brand { display: flex; flex-direction: column; gap: 0.75rem; }
                .brand-title { 
                    font-size: 1.5rem; 
                    font-weight: 900; 
                    background: linear-gradient(to right, #ffffff, #94a3b8);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    margin: 0; 
                    line-height: 1; 
                    letter-spacing: -1px; 
                }
                .brand-subtitle { font-size: 0.65rem; font-weight: 800; color: #818cf8; margin: 0; letter-spacing: 4px; opacity: 0.8; }

                .official-badge { 
                    display: inline-flex; 
                    align-items: center; 
                    gap: 6px; 
                    background: var(--glass-border); 
                    color: #94a3b8; 
                    padding: 6px 12px; 
                    border-radius: 12px; 
                    font-size: 0.6rem; 
                    font-weight: 700;
                    border: 1px solid var(--glass-border);
                    width: fit-content;
                }
                
                .slip-body-premium { padding: 0.5rem 2.5rem 1.5rem; }
                .info-grid { 
                    display: flex; 
                    justify-content: space-between; 
                    margin-bottom: 1.5rem; 
                    background: var(--glass-border);
                    padding: 1.25rem;
                    border-radius: 1.5rem;
                    border: 1px solid var(--glass-border);
                }
                .info-item .label { display: block; font-size: 0.6rem; color: #64748b; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px; }
                .info-item .value { font-size: 1.1rem; font-weight: 700; color: #f8fafc; }

                .section-title { 
                    font-size: 0.7rem; 
                    font-weight: 800; 
                    text-transform: uppercase; 
                    letter-spacing: 2px; 
                    margin-bottom: 1.25rem; 
                    display: flex; 
                    align-items: center; 
                    gap: 10px;
                    color: #64748b;
                }
                .data-table { 
                    background: var(--glass-border); 
                    border-radius: 1.5rem; 
                    padding: 1.25rem; 
                    border: 1px solid var(--glass-border); 
                }
                .data-row { display: flex; justify-content: space-between; font-size: 0.95rem; color: #94a3b8; margin-bottom: 1rem; }
                .data-row.highlight { color: #10b981; font-weight: 600; }
                .data-row .val { color: #f1f5f9; font-weight: 700; }
                .val-danger { color: #f43f5e; font-weight: 700; }
                .data-divider { height: 1px; background: var(--glass-border); margin: 1rem 0; border: none; }
                .data-total { display: flex; justify-content: space-between; font-weight: 800; font-size: 1.05rem; color: #f8fafc; }

                .final-pay-container { margin-top: 1.5rem; position: relative; }
                .pay-card { 
                    background: linear-gradient(135deg, rgba(129, 140, 248, 0.1), rgba(168, 85, 247, 0.1)); 
                    padding: 1.5rem 1.5rem; 
                    border-radius: 2rem; 
                    text-align: center;
                    border: 1px solid rgba(129, 140, 248, 0.2);
                    position: relative;
                    overflow: hidden;
                }
                .pay-label { font-size: 0.75rem; font-weight: 800; color: #10b981; text-transform: uppercase; letter-spacing: 3px; position: relative; z-index: 1; }
                .pay-amount-row { display: flex; align-items: baseline; justify-content: center; gap: 8px; margin-top: 0.75rem; position: relative; z-index: 1; }
                .pay-amount-row .currency { font-size: 1.5rem; font-weight: 900; color: #ffffff; opacity: 0.5; }
                .pay-amount-row .amount { font-size: 2.8rem; font-weight: 900; color: #ffffff; letter-spacing: -1px; }

                .slip-footnote { text-align: center; margin-top: 1rem; color: #475569; font-size: 0.7rem; display: flex; align-items: center; gap: 8px; justify-content: center; }
                .slip-footer { 
                    padding: 1.5rem 0 0 0; 
                    position: relative;
                    z-index: 10;
                }
                .slip-btn { 
                    width: 100%; 
                    border-radius: 1.25rem; 
                    padding: 1rem; 
                    font-weight: 800; 
                    font-size: 1rem; 
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    border: 1px solid var(--glass-border);
                    cursor: pointer;
                }
                .slip-btn.btn-primary {
                    background: #818cf8 !important;
                    color: white !important;
                    box-shadow: 0 10px 15px -3px rgba(129, 140, 248, 0.3);
                }
                .slip-btn.btn-outline {
                    background: var(--glass-border) !important;
                    color: #94a3b8 !important;
                    border: 1px solid var(--glass-border) !important;
                }
                .slip-btn:hover:not(:disabled) { transform: translateY(-2px); filter: brightness(1.1); }

                .text-safe { color: #10b981; }
                .text-danger { color: #f43f5e; }

                .btn-close-minimal { background: var(--glass-border); border: 1px solid var(--glass-border); color: #94a3b8; cursor: pointer; padding: 0.75rem; border-radius: 1rem; transition: all 0.2s; }
                .btn-close-minimal:hover { background: var(--glass-border); color: #ffffff; }

                .print-only { display: none; }
                
                @media (max-width: 480px) {
                    .modal-overlay { padding: 1rem; align-items: center; } /* Keep overlay transparent */
                    .slip-window { max-width: 100%; width: 100%; }
                    .slip-card-premium { 
                        max-height: 85vh; 
                        overflow-y: auto; 
                        border-radius: 1.5rem; 
                        /* Restore card look */
                        background: linear-gradient(165deg, #0f172a 0%, #020617 100%);
                        border: 1px solid var(--glass-border); 
                        box-shadow: 0 20px 50px rgba(0,0,0,0.5); 
                    }
                    .slip-header-premium { padding: 1.25rem 1.25rem 0.5rem; }
                    .slip-body-premium { padding: 0.5rem 1.25rem 1.5rem; }
                    .brand-title { font-size: 1.25rem; }
                    .pay-amount-row .amount { font-size: 2.2rem; }
                    .info-grid { padding: 1rem; margin-bottom: 1rem; }
                    .data-table { padding: 1rem; }
                    .slip-footer { padding: 1rem 0 0 0; }
                }

                @media print {
                    .modal-overlay { background: white !important; padding: 0; display: block; position: absolute; }
                    .slip-window { max-width: 100% !important; margin: 0; }
                    .slip-card-premium { background: white !important; border: 1px solid #000 !important; color: black !important; box-shadow: none !important; }
                    .no-print { display: none !important; }
                    .print-only { display: flex !important; margin-top: 4rem; justify-content: space-around; }
                    .brand-title { color: black !important; -webkit-text-fill-color: initial !important; background: none !important; }
                    .brand-subtitle { color: #333 !important; }
                    .info-item .value, .data-row span, .data-total span, .pay-amount-row .amount { color: black !important; }
                    .data-table { background: white !important; border: 1px solid #000 !important; }
                    .pay-card { border: 1px solid #000 !important; background: white !important; box-shadow: none !important; color: black !important; }
                    .pay-label, .pay-amount-row .currency { color: black !important; }
                    .sig-block { text-align: center; width: 40%; }
                    .sig-line { border-bottom: 1px solid black; margin-bottom: 15px; width: 100%; height: 20px; }
                    .sig-block p { font-size: 0.85rem; font-weight: 700; color: black; }
                }

                .capture-preview-overlay {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.95);
                    z-index: 2000;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 2rem;
                    text-align: center;
                }
                .preview-img {
                    max-width: 100%;
                    max-height: 70vh;
                    border-radius: 1rem;
                    box-shadow: 0 20px 50px rgba(0,0,0,0.5);
                    margin-bottom: 1.5rem;
                }
                .preview-hint {
                    color: #4ade80;
                    font-weight: 800;
                    font-size: 1.1rem;
                    margin-bottom: 2rem;
                }
                `}} />

            {capturedImg && (
                <div className="capture-preview-overlay fade-in">
                    <div className="preview-hint">✨ สร้างรูปเสร็จแล้ว!<br />กรุณา "กดค้างที่รูป" แล้วเลือก "บันทึกรูปภาพ"</div>
                    <img src={capturedImg} alt="Salary Slip Preview" className="preview-img" />
                    <button className="btn-premium" onClick={() => setCapturedImg(null)} style={{ padding: '1rem 2rem' }}>
                        ปิดหน้าจอนี้
                    </button>
                </div>
            )}
        </div>
    );

    return ReactDOM.createPortal(modalContent, document.body);
};

export default SalarySlip;
