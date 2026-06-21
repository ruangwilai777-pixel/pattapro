'use client';

import React, { useState } from 'react';
import { TrendingUp, ArrowUpRight, DollarSign, Store, Truck, Briefcase } from 'lucide-react';

interface DailyData {
  date: string;
  income: number;
  expenses: number;
  profit: number;
}

interface FinancialChartsProps {
  souvenirDaily: DailyData[];
  truckDaily: DailyData[];
  souvenirTotals: { income: number; expenses: number; profit: number };
  truckTotals: { income: number; expenses: number; profit: number };
  centralTotal: number;
  activeProject: 'all' | 'souvenir' | 'truck';
}

export default function FinancialCharts({
  souvenirDaily,
  truckDaily,
  souvenirTotals,
  truckTotals,
  centralTotal,
  activeProject
}: FinancialChartsProps) {
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; label: string; income: number; profit: number } | null>(null);

  // 1. Prepare Daily Data based on activeProject filter
  const mergedDaily: DailyData[] = [];
  const daysCount = souvenirDaily.length;

  for (let i = 0; i < daysCount; i++) {
    const date = souvenirDaily[i]?.date || '';
    
    if (activeProject === 'all') {
      const sItem = souvenirDaily[i] || { income: 0, expenses: 0, profit: 0 };
      const tItem = truckDaily[i] || { income: 0, expenses: 0, profit: 0 };
      mergedDaily.push({
        date,
        income: sItem.income + tItem.income,
        expenses: sItem.expenses + tItem.expenses,
        profit: sItem.profit + tItem.profit
      });
    } else if (activeProject === 'souvenir') {
      mergedDaily.push(souvenirDaily[i]);
    } else {
      mergedDaily.push(truckDaily[i]);
    }
  }

  // Calculate chart parameters
  const chartWidth = 680;
  const chartHeight = 240;
  const paddingLeft = 70;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 40;

  const graphWidth = chartWidth - paddingLeft - paddingRight;
  const graphHeight = chartHeight - paddingTop - paddingBottom;

  // Find max values for scaling
  const maxIncome = Math.max(...mergedDaily.map(d => d.income), 10000);
  const maxProfit = Math.max(...mergedDaily.map(d => d.profit), 5000);
  const chartMax = Math.ceil(maxIncome * 1.15); // Add margin at the top

  // Generate SVG Points
  const pointsIncome: string[] = [];
  const pointsProfit: string[] = [];

  mergedDaily.forEach((d, i) => {
    const x = paddingLeft + (i / (daysCount - 1)) * graphWidth;
    const yIncome = chartHeight - paddingBottom - (d.income / chartMax) * graphHeight;
    const yProfit = chartHeight - paddingBottom - (d.profit / chartMax) * graphHeight;
    
    pointsIncome.push(`${x},${yIncome}`);
    pointsProfit.push(`${x},${yProfit}`);
  });

  const incomePath = `M ${pointsIncome.join(' L ')}`;
  const profitPath = `M ${pointsProfit.join(' L ')}`;

  // Generate Area Paths for gradient fills
  const incomeAreaPath = `${incomePath} L ${paddingLeft + graphWidth},${chartHeight - paddingBottom} L ${paddingLeft},${chartHeight - paddingBottom} Z`;
  const profitAreaPath = `${profitPath} L ${paddingLeft + graphWidth},${chartHeight - paddingBottom} L ${paddingLeft},${chartHeight - paddingBottom} Z`;

  // Get coordinates for grid lines
  const gridTicks = 4;
  const gridLines = Array.from({ length: gridTicks }).map((_, idx) => {
    const ratio = idx / (gridTicks - 1);
    const value = Math.round(chartMax * ratio);
    const y = chartHeight - paddingBottom - ratio * graphHeight;
    return { value, y };
  });

  // X-axis ticks (every 5 days)
  const xAxisTicks = mergedDaily.filter((_, idx) => idx % 5 === 0 || idx === daysCount - 1);

  // Expense Breakdown data structure
  const breakdownItems = [];
  if (activeProject === 'all' || activeProject === 'souvenir') {
    breakdownItems.push({
      name: 'ต้นทุนสินค้าของฝาก (COGS)',
      amount: souvenirTotals.expenses,
      color: 'var(--accent-souvenir)',
      icon: Store
    });
  }
  if (activeProject === 'all' || activeProject === 'truck') {
    // Diesel fuel (35%), Driver wages (25%), Maintenance (10%)
    const fuel = Math.round(truckTotals.expenses * 0.5);
    const wages = Math.round(truckTotals.expenses * 0.35);
    const maint = Math.round(truckTotals.expenses * 0.15);
    
    breakdownItems.push({
      name: 'ค่าน้ำมันดีเซล (รถวิ่งงาน)',
      amount: fuel,
      color: '#ff9f1c',
      icon: Truck
    });
    breakdownItems.push({
      name: 'ค่าแรงคนขับรถ',
      amount: wages,
      color: 'var(--accent-truck)',
      icon: Truck
    });
    breakdownItems.push({
      name: 'ค่าบำรุงรักษา/ค่าผ่านทาง',
      amount: maint,
      color: '#e71d36',
      icon: Truck
    });
  }
  if (activeProject === 'all') {
    breakdownItems.push({
      name: 'ค่าใช้จ่ายออฟฟิศกลาง',
      amount: centralTotal,
      color: 'var(--accent-gold)',
      icon: Briefcase
    });
  }

  const totalBreakdownExpenses = breakdownItems.reduce((sum, item) => sum + item.amount, 0);

  // Project shares calculation
  const totalRevenue = souvenirTotals.income + truckTotals.income;
  const souvenirRevShare = totalRevenue > 0 ? (souvenirTotals.income / totalRevenue) * 100 : 0;
  const truckRevShare = totalRevenue > 0 ? (truckTotals.income / totalRevenue) * 100 : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* 1. Main Daily Trends Chart */}
      <div className="lg:col-span-2 glass-panel p-6 relative overflow-hidden flex flex-col justify-between min-h-[360px]">
        <div>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">แนวโน้มรายรับและกำไรสะสม</h3>
              <p className="text-xs text-[var(--text-muted)]">กราฟรายวันในรอบ 30 วันที่ผ่านมา (บาท)</p>
            </div>
            
            {/* Chart Legend */}
            <div className="flex gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[var(--accent-gold)]"></span>
                <span className="text-[var(--text-muted)]">รายรับ</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <span className="text-[var(--text-muted)]">กำไรสุทธิ</span>
              </div>
            </div>
          </div>

          {/* SVG Custom Line Chart */}
          <div className="relative flex-1">
            <svg 
              viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
              className="w-full h-auto overflow-visible select-none"
            >
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent-gold)" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="var(--accent-gold)" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {gridLines.map((line, idx) => (
                <g key={idx}>
                  <line 
                    x1={paddingLeft} 
                    y1={line.y} 
                    x2={chartWidth - paddingRight} 
                    y2={line.y} 
                    stroke="var(--glass-border)" 
                    strokeWidth="1"
                    strokeDasharray="4 6"
                  />
                  <text 
                    x={paddingLeft - 8} 
                    y={line.y + 4} 
                    fill="var(--text-muted)" 
                    fontSize="11" 
                    textAnchor="end"
                  >
                    <tspan className="baht">฿</tspan>{line.value.toLocaleString()}
                  </text>
                </g>
              ))}

              {/* Area Paths (Fills) */}
              <path d={incomeAreaPath} fill="url(#incomeGrad)" />
              <path d={profitAreaPath} fill="url(#profitGrad)" />

              {/* Lines Paths */}
              <path 
                d={incomePath} 
                fill="none" 
                stroke="var(--accent-gold)" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
              <path 
                d={profitPath} 
                fill="none" 
                stroke="#10b981" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />

              {/* Interactive Interaction Circles */}
              {mergedDaily.map((d, i) => {
                const x = paddingLeft + (i / (daysCount - 1)) * graphWidth;
                const yIncome = chartHeight - paddingBottom - (d.income / chartMax) * graphHeight;
                const yProfit = chartHeight - paddingBottom - (d.profit / chartMax) * graphHeight;

                return (
                  <g key={i} className="cursor-pointer group">
                    {/* Transparent hover area */}
                    <rect 
                      x={x - 10} 
                      y={0} 
                      width={20} 
                      height={chartHeight - paddingBottom} 
                      fill="transparent" 
                      onMouseEnter={(e) => {
                        setHoveredPoint({
                          x,
                          y: yIncome,
                          label: new Date(d.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }),
                          income: d.income,
                          profit: d.profit
                        });
                      }}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                    
                    {/* Highlight line on hover */}
                    {hoveredPoint && hoveredPoint.x === x && (
                      <line 
                        x1={x} 
                        y1={paddingTop} 
                        x2={x} 
                        y2={chartHeight - paddingBottom} 
                        stroke="rgba(197, 168, 128, 0.4)" 
                        strokeWidth="1.5"
                      />
                    )}

                    {/* Nodes */}
                    <circle 
                      cx={x} 
                      cy={yIncome} 
                      r={hoveredPoint && hoveredPoint.x === x ? "5" : "1.5"} 
                      fill="var(--accent-gold)" 
                      className="transition-all duration-100" 
                    />
                    <circle 
                      cx={x} 
                      cy={yProfit} 
                      r={hoveredPoint && hoveredPoint.x === x ? "5" : "1.5"} 
                      fill="#10b981" 
                      className="transition-all duration-100" 
                    />
                  </g>
                );
              })}

              {/* Bottom X Axis Line */}
              <line 
                x1={paddingLeft} 
                y1={chartHeight - paddingBottom} 
                x2={chartWidth - paddingRight} 
                y2={chartHeight - paddingBottom} 
                stroke="var(--glass-border)" 
                strokeWidth="1.5"
              />

              {/* X Axis Labels */}
              {xAxisTicks.map((d, idx) => {
                const globalIdx = mergedDaily.findIndex(item => item.date === d.date);
                const x = paddingLeft + (globalIdx / (daysCount - 1)) * graphWidth;
                const formattedDate = new Date(d.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
                return (
                  <text 
                    key={idx} 
                    x={x} 
                    y={chartHeight - paddingBottom + 20} 
                    fill="var(--text-muted)" 
                    fontSize="11" 
                    textAnchor="middle"
                  >
                    {formattedDate}
                  </text>
                );
              })}
            </svg>

            {/* Custom Floating Chart Tooltip */}
            {hoveredPoint && (
              <div 
                className="absolute z-10 bg-[var(--bg-tertiary)] border border-[var(--accent-gold)] p-3 rounded-lg shadow-xl text-xs flex flex-col gap-1"
                style={{ 
                  left: `${(hoveredPoint.x / chartWidth) * 100}%`, 
                  top: `${Math.max(10, (hoveredPoint.y / chartHeight) * 100 - 30)}%`,
                  transform: 'translateX(-50%)'
                }}
              >
                <div className="font-semibold text-center text-[var(--accent-gold)] mb-1 border-b border-[var(--glass-border)] pb-1">
                  {hoveredPoint.label}
                </div>
                <div className="flex justify-between gap-6 text-[var(--text-primary)]">
                  <span>รายรับ:</span>
                  <span className="font-semibold"><span className="baht">฿</span>{hoveredPoint.income.toLocaleString()}</span>
                </div>
                <div className="flex justify-between gap-6 text-emerald-500">
                  <span>กำไรสุทธิ:</span>
                  <span className="font-semibold"><span className="baht">฿</span>{hoveredPoint.profit.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Side Breakdown and Shares Charts */}
      <div className="glass-panel p-6 flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-5">สัดส่วนค่าใช้จ่ายจำแนกกลุ่ม</h3>
          
          <div className="flex flex-col gap-4">
            {breakdownItems.map((item, idx) => {
              const share = totalBreakdownExpenses > 0 ? (item.amount / totalBreakdownExpenses) * 100 : 0;
              const Icon = item.icon;
              return (
                <div key={idx} className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="flex items-center gap-1.5 text-[var(--text-primary)]">
                      <Icon className="w-3.5 h-3.5 opacity-80" style={{ color: item.color }} />
                      {item.name}
                    </span>
                    <span className="font-semibold" style={{ color: item.color }}>
                      <span className="baht">฿</span>{item.amount.toLocaleString()} ({share.toFixed(1)}%)
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-[rgba(255,255,255,0.03)] h-2.5 rounded-full overflow-hidden border border-[var(--glass-border)]">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${share}%`, 
                        backgroundColor: item.color,
                        boxShadow: `0 0 8px ${item.color}50`
                      }}
                    />
                  </div>
                </div>
              );
            })}

            {breakdownItems.length === 0 && (
              <div className="text-center py-10 text-[var(--text-muted)] text-sm">
                ไม่มีข้อมูลรายจ่ายในช่วงนี้
              </div>
            )}
          </div>
        </div>

        {/* Project Revenue Share Section (Only visible in 'all' view) */}
        {activeProject === 'all' && (
          <div className="mt-8 pt-6 border-t border-[var(--glass-border)]">
            <h4 className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-3 font-semibold">
              ส่วนแบ่งรายรับธุรกิจ (Souvenir vs Truck)
            </h4>
            
            <div className="w-full bg-[rgba(255,255,255,0.02)] h-6 rounded-lg overflow-hidden flex border border-[var(--glass-border)] text-[10px] font-semibold">
              {souvenirRevShare > 0 && (
                <div 
                  className="h-full flex items-center justify-center text-black bg-[var(--accent-souvenir)] transition-all"
                  style={{ width: `${souvenirRevShare}%` }}
                  title={`ส่วนแบ่งของฝาก: ${souvenirRevShare.toFixed(1)}%`}
                >
                  {souvenirRevShare > 15 ? `ของฝาก ${souvenirRevShare.toFixed(0)}%` : `${souvenirRevShare.toFixed(0)}%`}
                </div>
              )}
              {truckRevShare > 0 && (
                <div 
                  className="h-full flex items-center justify-center text-white bg-[var(--accent-truck)] transition-all"
                  style={{ width: `${truckRevShare}%` }}
                  title={`ส่วนแบ่งรถวิ่งงาน: ${truckRevShare.toFixed(1)}%`}
                >
                  {truckRevShare > 15 ? `รถวิ่งงาน ${truckRevShare.toFixed(0)}%` : `${truckRevShare.toFixed(0)}%`}
                </div>
              )}
            </div>
            
            <div className="flex justify-between items-center text-[11px] text-[var(--text-muted)] mt-2">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-[var(--accent-souvenir)]"></span> Patta Shop (ของฝาก)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-[var(--accent-truck)]"></span> Truck Dispatch (รถวิ่งงาน)
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
