import { NextResponse } from 'next/server';
import { souvenirClient, truckClient } from '@/utils/supabase/clients';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const EXPENSES_FILE = path.join(process.cwd(), 'expenses.json');

// Helper to read local central expenses
function getCentralExpenses() {
  try {
    if (fs.existsSync(EXPENSES_FILE)) {
      const raw = fs.readFileSync(EXPENSES_FILE, 'utf8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading expenses.json:', err);
  }
  // Default seed data
  return [
    { id: '1', title: 'ค่าเช่าออฟฟิศส่วนกลาง', amount: 12000, date: new Date().toISOString().slice(0, 10), category: 'ค่าเช่า/อาคาร' },
    { id: '2', title: 'เงินเดือนพนักงานแอดมินกลาง', amount: 15000, date: new Date().toISOString().slice(0, 10), category: 'เงินเดือน/ค่าจ้าง' },
    { id: '3', title: 'ค่าอินเทอร์เน็ตและซอฟต์แวร์ระบบ', amount: 2500, date: new Date().toISOString().slice(0, 10), category: 'สาธารณูปโภค' }
  ];
}

// Helper to write local central expenses
function saveCentralExpenses(expenses: any[]) {
  try {
    fs.writeFileSync(EXPENSES_FILE, JSON.stringify(expenses, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing expenses.json:', err);
    return false;
  }
}

// Mock Data Generator for Souvenir Shop (last 30 days)
function generateMockSouvenirData() {
  const data = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dayOfWeek = date.getDay();
    
    // Higher sales on weekends (Friday, Saturday, Sunday)
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;
    const baseSales = isWeekend ? 8500 : 3200;
    const randomVariation = Math.random() * 4000 - 1500;
    
    const dailyIncome = Math.round(baseSales + randomVariation);
    // Cost of goods sold (COGS) is roughly 55%
    const cogs = Math.round(dailyIncome * 0.55);
    
    data.push({
      date: date.toISOString().slice(0, 10),
      income: dailyIncome,
      expenses: cogs, // COGS + packaging
      profit: dailyIncome - cogs,
      ordersCount: Math.round(dailyIncome / 180) // Average ticket 180 THB
    });
  }
  return data;
}

// Mock Data Generator for Truck Dispatch (last 30 days)
function generateMockTruckData() {
  const data = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dayOfWeek = date.getDay();
    
    // Truck dispatches are higher on weekdays
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const baseRevenue = isWeekend ? 4000 : 15000; // less truck runs on Sunday
    const randomVariation = Math.random() * 6000 - 2000;
    
    const dailyIncome = Math.round(baseRevenue + randomVariation);
    
    // Expenses: Diesel fuel (35%), Driver wages (25%), Maintenance/Toll (10%)
    const diesel = Math.round(dailyIncome * 0.35);
    const wages = Math.round(dailyIncome * 0.25);
    const maintenance = Math.round(dailyIncome * 0.10);
    const totalExpenses = diesel + wages + maintenance;
    
    data.push({
      date: date.toISOString().slice(0, 10),
      income: dailyIncome,
      expenses: totalExpenses,
      profit: dailyIncome - totalExpenses,
      tripsCount: Math.round(dailyIncome / 3500), // Average trip rate 3500 THB
      details: { diesel, wages, maintenance }
    });
  }
  return data;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const forceMock = searchParams.get('mock') === 'true';

    let souvenirData = [];
    let isSouvenirMocked = true;
    
    let truckData = [];
    let isTruckMocked = true;

    // 1. Fetch from Souvenir Shop Database (or fallback to Mock)
    if (souvenirClient && !forceMock) {
      try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        // Fetch orders paid/shipping/completed in the last 30 days
        const { data: dbOrders, error } = await souvenirClient
          .from('orders')
          .select('total_price, created_at')
          .in('status', ['paid', 'shipping', 'completed'])
          .gte('created_at', thirtyDaysAgo.toISOString());

        if (error) {
          console.error('Souvenir DB Query Error:', error);
        }

        if (!error && dbOrders) {
          // Group by date
          const dateMap: { [date: string]: { income: number, ordersCount: number } } = {};
          dbOrders.forEach((order: any) => {
            const dateStr = order.created_at.slice(0, 10);
            if (!dateMap[dateStr]) {
              dateMap[dateStr] = { income: 0, ordersCount: 0 };
            }
            dateMap[dateStr].income += Number(order.total_price || 0);
            dateMap[dateStr].ordersCount += 1;
          });

          // Generate list
          const now = new Date();
          for (let i = 29; i >= 0; i--) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const dateStr = date.toISOString().slice(0, 10);
            const record = dateMap[dateStr] || { income: 0, ordersCount: 0 };
            const cogs = Math.round(record.income * 0.55); // assumed COGS
            
            souvenirData.push({
              date: dateStr,
              income: record.income,
              expenses: cogs,
              profit: record.income - cogs,
              ordersCount: record.ordersCount
            });
          }
          isSouvenirMocked = false;
        }
      } catch (err) {
        console.error('Error fetching real souvenir database data:', err);
      }
    }

    if (isSouvenirMocked) {
      souvenirData = generateMockSouvenirData();
    }

    // 2. Fetch from Truck Dispatch Database (or fallback to Mock)
    if (truckClient && !forceMock) {
      try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().slice(0, 10);
        
        // Fetch trips in the last 30 days using real columns (price, date, fuel, wage, maintenance)
        const { data: dbJobs, error } = await truckClient
          .from('trips')
          .select('price, date, fuel, wage, maintenance')
          .gte('date', thirtyDaysAgoStr);

        if (error) {
          console.error('Truck DB Query Error:', error);
        }

        if (!error && dbJobs) {
          const dateMap: { [date: string]: { income: number, expenses: number, tripsCount: number } } = {};
          dbJobs.forEach((job: any) => {
            const dateStr = job.date ? job.date.slice(0, 10) : '';
            if (!dateStr) return;
            
            if (!dateMap[dateStr]) {
              dateMap[dateStr] = { income: 0, expenses: 0, tripsCount: 0 };
            }
            const income = Number(job.price || 0);
            const diesel = Number(job.fuel || 0);
            const wages = Number(job.wage || 0);
            const maint = Number(job.maintenance || 0);
            
            dateMap[dateStr].income += income;
            dateMap[dateStr].expenses += (diesel + wages + maint);
            dateMap[dateStr].tripsCount += 1;
          });

          const now = new Date();
          for (let i = 29; i >= 0; i--) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const dateStr = date.toISOString().slice(0, 10);
            const record = dateMap[dateStr] || { income: 0, expenses: 0, tripsCount: 0 };
            
            truckData.push({
              date: dateStr,
              income: record.income,
              expenses: Math.round(record.expenses),
              profit: Math.round(record.income - record.expenses),
              tripsCount: record.tripsCount
            });
          }
          isTruckMocked = false;
        }
      } catch (err) {
        console.error('Error fetching real truck database data:', err);
      }
    }

    if (isTruckMocked) {
      truckData = generateMockTruckData();
    }

    // 3. Load Central expenses
    const centralExpensesList = getCentralExpenses();
    const totalCentralExpenses = centralExpensesList.reduce((sum: number, item: any) => sum + Number(item.amount), 0);

    // 4. Calculate aggregated totals
    const souvenirTotals = souvenirData.reduce(
      (acc, d) => {
        acc.income += d.income;
        acc.expenses += d.expenses;
        acc.profit += d.profit;
        acc.orders += d.ordersCount;
        return acc;
      },
      { income: 0, expenses: 0, profit: 0, orders: 0 }
    );

    const truckTotals = truckData.reduce(
      (acc, d) => {
        acc.income += d.income;
        acc.expenses += d.expenses;
        acc.profit += d.profit;
        acc.trips += d.tripsCount;
        return acc;
      },
      { income: 0, expenses: 0, profit: 0, trips: 0 }
    );

    const aggregatedTotals = {
      income: souvenirTotals.income + truckTotals.income,
      expenses: souvenirTotals.expenses + truckTotals.expenses + totalCentralExpenses,
      profit: (souvenirTotals.income + truckTotals.income) - (souvenirTotals.expenses + truckTotals.expenses + totalCentralExpenses)
    };

    return NextResponse.json({
      success: true,
      souvenir: {
        totals: souvenirTotals,
        daily: souvenirData,
        isMocked: isSouvenirMocked
      },
      truck: {
        totals: truckTotals,
        daily: truckData,
        isMocked: isTruckMocked
      },
      centralExpenses: {
        list: centralExpensesList,
        total: totalCentralExpenses
      },
      totals: aggregatedTotals
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error: any) {
    console.error('Error generating consolidated finance report:', error);
    return NextResponse.json(
      { error: 'Failed to generate financial report: ' + error.message },
      { status: 500 }
    );
  }
}

// POST endpoint to add a central expense
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { title, amount, category, date } = body;

    if (!title || !amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Title and valid positive amount are required' }, { status: 400 });
    }

    const expenses = getCentralExpenses();
    const newExpense = {
      id: 'exp-' + Date.now(),
      title,
      amount: Number(amount),
      category: category || 'อื่นๆ',
      date: date || new Date().toISOString().slice(0, 10)
    };

    expenses.unshift(newExpense);
    saveCentralExpenses(expenses);

    return NextResponse.json({
      success: true,
      expense: newExpense
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE endpoint to delete a central expense
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Expense ID is required' }, { status: 400 });
    }

    const expenses = getCentralExpenses();
    const filtered = expenses.filter((e: any) => e.id !== id);
    saveCentralExpenses(filtered);

    return NextResponse.json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
