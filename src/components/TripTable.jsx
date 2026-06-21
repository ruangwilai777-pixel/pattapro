import React from 'react';
import { Trash2, Edit2, Download, Camera } from 'lucide-react';

const TripTable = ({ trips, onDelete, onEdit, onExport }) => {
    return (
        <div className="glass-card fade-in" style={{ marginTop: '2rem' }}>
            <div className="header" style={{ padding: '1.5rem 1.5rem 0 1.5rem', marginBottom: '0.5rem' }}>
                <h3 style={{ fontSize: '1.25rem' }}>รายการงานทั้งหมด</h3>
                <button className="btn btn-outline" onClick={onExport}>
                    <Download size={18} />
                    Export to Excel
                </button>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>วันที่</th>
                            <th style={{ minWidth: '130px' }}>สายงาน</th>
                            <th>ราคาค่าเที่ยว (+)</th>
                            <th>ค่าน้ำมัน (-)</th>
                            <th>ค่าจ้าง (-)</th>
                            <th>ค่าซ่อม (-)</th>
                            <th>เบิกคนขับ (-)</th>
                            <th>รายได้ตะกร้า (+)</th>
                            <th>ส่วนแบ่งตะกร้า (-)</th>
                            <th>ยอดเบิก (ลูกน้อง)</th>
                            <th>กำไรสุทธิ</th>
                            <th>จัดการ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {trips.length === 0 ? (
                            <tr>
                                <td colSpan="11" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
                                    ยังไม่มีข้อมูลในระบบ...
                                </td>
                            </tr>
                        ) : (
                            trips.map((trip) => (
                                <tr key={trip.id}>
                                    <td>{new Date(trip.date).toLocaleDateString('th-TH')}</td>
                                    <td style={{ fontWeight: '500' }}>{trip.route}</td>
                                    <td>{parseFloat(trip.price).toLocaleString()} ฿</td>
                                    <td style={{ color: 'var(--danger)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                            <span>{parseFloat(trip.fuel).toLocaleString()} ฿</span>
                                            {(trip.fuel_bill_url || trip.fuel_url) && (
                                                <a href={trip.fuel_bill_url || trip.fuel_url} target="_blank" rel="noreferrer" title="กดดูรูปน้ำมัน" className="bill-thumbnail-link">
                                                    <img 
                                                        src={trip.fuel_bill_url || trip.fuel_url} 
                                                        alt="รูปน้ำมัน" 
                                                        className="receipt-thumbnail"
                                                    />
                                                </a>
                                            )}
                                        </div>
                                    </td>
                                    <td style={{ color: 'var(--danger)' }}>-{parseFloat(trip.wage).toLocaleString()} ฿</td>
                                    <td style={{ color: 'var(--danger)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                            <span>{parseFloat(trip.maintenance || 0).toLocaleString()} ฿</span>
                                            {(trip.maintenance_bill_url || trip.maintenance_url) && (
                                                <a href={trip.maintenance_bill_url || trip.maintenance_url} target="_blank" rel="noreferrer" title="กดดูรูปค่าซ่อม" className="bill-thumbnail-link">
                                                    <img 
                                                        src={trip.maintenance_bill_url || trip.maintenance_url} 
                                                        alt="รูปค่าซ่อม" 
                                                        className="receipt-thumbnail"
                                                    />
                                                </a>
                                            )}
                                        </div>
                                    </td>
                                    <td style={{ color: 'var(--warning-intense)' }}>-{parseFloat(trip.advance || 0).toLocaleString()} ฿</td>
                                    <td style={{ color: 'var(--success)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                            <span>+{parseFloat(trip.basket || 0).toLocaleString()} ฿</span>
                                            {(trip.basket_bill_url || trip.basket_url) && (
                                                <a href={trip.basket_bill_url || trip.basket_url} target="_blank" rel="noreferrer" title="กดดูรูปตะกร้า" className="bill-thumbnail-link">
                                                    <img 
                                                        src={trip.basket_bill_url || trip.basket_url} 
                                                        alt="รูปตะกร้า" 
                                                        className="receipt-thumbnail"
                                                    />
                                                </a>
                                            )}
                                        </div>
                                    </td>

                                    <td style={{ color: 'var(--danger)' }}>-{parseFloat(trip.basketShare || 0).toLocaleString()} ฿</td>
                                    <td style={{ color: 'var(--warning)' }}>-{parseFloat(trip.staffShare || 0).toLocaleString()} ฿</td>
                                    <td>
                                        <span className={`badge ${trip.profit >= 0 ? 'badge-profit' : 'badge-loss'}`}>
                                            {Math.round(trip.profit).toLocaleString()} ฿
                                        </span>
                                    </td>
                                    <td>
                                        <div className="table-actions">
                                            <button className="btn-icon" style={{ color: 'var(--primary)' }} onClick={() => onEdit(trip)}>
                                                <Edit2 size={18} />
                                            </button>
                                            <button className="btn-icon" onClick={() => onDelete(trip.id)}>
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <style>{`
                .bill-thumbnail-link { display: inline-flex; align-items: center; justify-content: center; }
                .receipt-thumbnail {
                    width: 32px;
                    height: 32px;
                    border-radius: 6px;
                    object-fit: cover;
                    border: 1px solid var(--glass-border);
                    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
                    cursor: pointer;
                    transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s, border-color 0.2s;
                }
                .receipt-thumbnail:hover {
                    transform: scale(2.5);
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.6);
                    border-color: var(--primary);
                    position: relative;
                    z-index: 999;
                }
            `}</style>
        </div>
    );
};

export default TripTable;
