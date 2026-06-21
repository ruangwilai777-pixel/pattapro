import React from 'react';
import { Truck, DollarSign, Fuel, Users, CreditCard, ShoppingCart, Settings, Wallet, Banknote, Undo2 } from 'lucide-react';

const StatCard = ({ title, value, icon: _Icon, color, subValue }) => {
    const getColorClass = () => {
        switch (color) {
            case 'blue': return 'bg-blue-soft text-blue-deep';
            case 'red': return 'bg-white text-danger-bold';
            case 'orange': return 'bg-white text-warning-bold';
            case 'purple': return 'bg-purple-soft text-purple-deep';
            case 'green': return 'bg-green-soft text-green-deep';
            default: return 'bg-white text-main-dark';
        }
    };

    return (
        <div className={`summary-card-mini ${getColorClass()} fade-in`}>
            <div className="card-top">
                <_Icon size={12} className="card-icon" />
                <span className="card-title">{title}</span>
            </div>
            <div className="card-value">
                {typeof value === 'number' ? `฿${Math.floor(value).toLocaleString()}` : value}
                {subValue && <span className="sub-value"> {subValue}</span>}
            </div>
        </div>
    );
};

const FleetDashboard = ({ stats, yearlyStats, isSupabaseReady, trips = [], currentMonth, currentYear, viewType, setViewType, children, isMaximized, hideStats = false }) => {
    const currentStats = viewType === 'monthly' ? stats : yearlyStats;

    const monthNames = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];

    return (
        <div className="dashboard-container">




            <main className="dashboard-content" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                {viewType === 'monthly' ? children : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%' }}>
                        <div className="glass-card fade-in" style={{ padding: '3rem', textAlign: 'center', marginTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                            <div>
                                <h2 style={{ color: 'var(--text-dim)', marginBottom: '0.5rem' }}>📊 สรุปภาพรวมรายปี {currentYear + 543}</h2>
                                <p style={{ color: 'var(--text-dim)', opacity: 0.7 }}>สถิติรวมของปีนี้ทั้งหมดแสดงอยู่ในการ์ดสรุปด้านบนแล้ว</p>
                            </div>
                            <button
                                className="btn-secondary-premium"
                                onClick={() => setViewType('monthly')}
                                style={{ padding: '0.75rem 2rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
                            >
                                <Undo2 size={18} />
                                <span>กลับไปหน้าตารางรายเดือน</span>
                            </button>
                        </div>
                        {children}
                    </div>
                )}
            </main>

            <style dangerouslySetInnerHTML={{
                __html: `
                .dashboard-container { 
                    min-height: 100vh;
                    min-height: -webkit-fill-available;
                    display: flex; 
                    flex-direction: column; 
                    padding: 1.5rem;
                    perspective: 2000px;
                    /* Fix for Sticky: Let the window handle scrolling, remove overflow constraint */
                    overflow: visible;
                }



                @media (max-width: 1200px) {
                    .dashboard-container {
                        height: auto !important;
                        overflow: visible !important;
                        padding: 0.75rem;
                    }
                }
                .dashboard-header-premium { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
                .brand-logo { font-size: 2.2rem; font-weight: 900; letter-spacing: 4px; color: #fff; margin:0; line-height:1; background: none; -webkit-text-fill-color: initial; }
                .brand-subtitle { font-size: 10px; letter-spacing: 8px; color: var(--primary); margin: 5px 0 0 0; font-weight: 700; }
                
                .header-right { display: flex; align-items: center; gap: 1rem; }
                .status-pill { padding: 6px 12px; border-radius: 20px; font-size: 10px; font-weight: 800; display: flex; align-items: center; gap: 6px; border: 1px solid var(--glass-border); background: var(--glass-border); color: #94a3b8; box-shadow: none; }
                .status-pill.online { color: #2dd4bf; border-color: rgba(45, 212, 191, 0.2); background: rgba(45, 212, 191, 0.05); }
                .status-pill.online .dot { width: 6px; height: 6px; background: #2dd4bf; border-radius: 50%; box-shadow: 0 0 10px #2dd4bf; }
                
                .view-switcher-glass { background: var(--glass-border); border: 1px solid var(--glass-border); padding: 4px; border-radius: 12px; display: flex; gap: 4px; box-shadow: none; }
                .switch-btn { padding: 6px 16px; border: none; background: none; color: var(--text-dim); cursor: pointer; border-radius: 8px; font-size: 12px; font-weight: 700; transition: all 0.2s; }
                .switch-btn.active { background: var(--primary); color: white; box-shadow: 0 4px 12px rgba(129, 140, 248, 0.3); }
                
                .current-date-badge { background: rgba(129, 140, 248, 0.1); color: var(--primary); padding: 8px 16px; border-radius: 12px; font-weight: 800; font-size: 13px; border: 1px solid rgba(129, 140, 248, 0.2); }

                .summary-section-premium { flex-shrink: 0; margin-bottom: 1.5rem; }
                .section-header { display: flex; align-items: center; gap: 10px; margin-bottom: 0.75rem; color: var(--text-dim); font-size: 13px; font-weight: 700; padding-left: 5px; }
                
                .summary-grid-fixed { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 10px; padding-top: 5px; }
                .summary-grid-fixed::-webkit-scrollbar { height: 4px; }
                .summary-grid-fixed::-webkit-scrollbar-thumb { background: var(--glass-border); border-radius: 10px; }

                .summary-card-mini { 
                    flex: 0 0 135px; 
                    padding: 15px 12px; 
                    border-radius: 16px; 
                    display: flex; 
                    flex-direction: column; 
                    gap: 6px; 
                    box-shadow: 
                        0 10px 20px -5px rgba(0,0,0,0.4),
                        0 4px 6px -2px rgba(0,0,0,0.2),
                        inset 0 1px 1px var(--glass-border);
                    min-height: 85px;
                    justify-content: center;
                    transform-style: preserve-3d;
                    transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
                }
                .card-top { display: flex; align-items: center; gap: 6px; }
                .card-title { font-size: 10px; font-weight: 700; opacity: 0.8; white-space: nowrap; }
                .card-value { font-size: 16px; font-weight: 800; letter-spacing: -0.5px; }
                .sub-value { font-size: 11px; opacity: 0.8; }

                /* Dark Theme Premium Styles */
                .bg-white { background: #ffffff; color: #1e293b; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
                .bg-blue-soft { background: rgba(56, 189, 248, 0.08); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.2); }
                .bg-purple-soft { background: rgba(168, 85, 247, 0.08); color: #a855f7; border: 1px solid rgba(168, 85, 247, 0.2); }
                .bg-green-soft { background: rgba(34, 197, 94, 0.08); color: #22c55e; border: 1px solid rgba(34, 197, 94, 0.2); }
                
                .text-blue-deep { color: #38bdf8 !important; }
                .text-danger-bold { color: #f43f5e !important; }
                .text-warning-bold { color: #f59e0b !important; }
                .text-purple-deep { color: #a855f7 !important; }
                .text-green-deep { color: #22c55e !important; }
                .text-main-dark { color: var(--text-main) !important; }
                
                .text-blue-deep { color: #38bdf8 !important; }
                .text-danger-bold { color: #f43f5e !important; }
                .text-warning-bold { color: #f59e0b !important; }
                .text-purple-deep { color: #a855f7 !important; }
                .text-green-deep { color: #22c55e !important; }
                .text-main-dark { color: var(--text-main) !important; }

                .summary-card-mini { 
                    backdrop-filter: blur(10px);
                    transition: all 0.3s ease;
                }
                .summary-card-mini:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 15px 30px -5px rgba(0, 0, 0, 0.5);
                    border-color: rgba(255,255,255,0.2);
                    filter: brightness(1.2);
                }
                .summary-card-mini .card-value {
                    color: inherit;
                }

                @media (max-width: 1024px) {
                    .dashboard-container {
                        height: auto !important;
                        overflow: visible !important;
                        padding: 1rem;
                    }
                }

                @media (max-width: 1300px) {
                    .summary-grid-fixed { flex-wrap: wrap; }
                    .summary-card-mini { flex: 1 1 calc(20% - 10px); min-width: 120px; }
                }
                @media (max-width: 768px) {
                    .summary-card-mini { flex: 1 1 calc(33.33% - 10px); }
                }
                @media (max-width: 480px) {
                    .summary-card-mini { flex: 1 1 calc(50% - 10px); }
                }
                `
            }} />
        </div>
    );
};

export default FleetDashboard;
