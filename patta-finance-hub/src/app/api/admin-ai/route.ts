import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { messages, financialSummary } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return NextResponse.json({ error: 'Gemini API Key is not configured' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Format current financials for Gemini
    const financialInfo = financialSummary
      ? `
ข้อมูลทางการเงินรวมล่าสุด (30 วันที่ผ่านมา):
- รายรับรวมทั้งหมด: ฿${Number(financialSummary.totals.income).toLocaleString('th-TH')}
- รายจ่ายรวมทั้งหมด (รวมค่าใช้จ่ายกลาง): ฿${Number(financialSummary.totals.expenses).toLocaleString('th-TH')}
- กำไรสุทธิรวม: ฿${Number(financialSummary.totals.profit).toLocaleString('th-TH')}

แยกตามประเภทธุรกิจ:
1. ธุรกิจร้านของฝาก (Patta Shop):
   - รายได้ของฝาก: ฿${Number(financialSummary.souvenir.totals.income).toLocaleString('th-TH')}
   - รายจ่ายของฝาก (COGS): ฿${Number(financialSummary.souvenir.totals.expenses).toLocaleString('th-TH')}
   - กำไรของฝาก: ฿${Number(financialSummary.souvenir.totals.profit).toLocaleString('th-TH')}
   - จำนวนออเดอร์: ${financialSummary.souvenir.totals.orders} ออเดอร์
   - สถานะข้อมูล: ${financialSummary.souvenir.isMocked ? 'ข้อมูลจำลอง (Demo)' : 'ฐานข้อมูลจริง'}

2. ธุรกิจรถวิ่งงาน (Truck Dispatch):
   - รายได้ค่ารถวิ่งงาน: ฿${Number(financialSummary.truck.totals.income).toLocaleString('th-TH')}
   - รายจ่ายค่ารถ (น้ำมัน/ค่าแรง/ซ่อมบำรุง): ฿${Number(financialSummary.truck.totals.expenses).toLocaleString('th-TH')}
   - กำไรค่ารถ: ฿${Number(financialSummary.truck.totals.profit).toLocaleString('th-TH')}
   - จำนวนเที่ยววิ่งงาน: ${financialSummary.truck.totals.trips} เที่ยว
   - สถานะข้อมูล: ${financialSummary.truck.isMocked ? 'ข้อมูลจำลอง (Demo)' : 'ฐานข้อมูลจริง'}

3. ค่าใช้จ่ายส่วนกลาง (Office Overheads):
   - รายจ่ายส่วนกลางรวม: ฿${Number(financialSummary.centralExpenses.total).toLocaleString('th-TH')}
   - รายการค่าใช้จ่ายส่วนกลาง: ${JSON.stringify(financialSummary.centralExpenses.list)}
`
      : 'ไม่มีข้อมูลทางการเงินส่งมา';

    const systemInstruction = `คุณคือ "น้องนินา" (Nong Nina) ที่ปรึกษาทางธุรกิจและการเงินอัจฉริยะส่วนตัวของแบรนด์ภัทธาของฝาก (Patta Shop) และธุรกิจรถวิ่งงาน
คุณต้องทำหน้าที่วิเคราะห์ตัวเลขรายรับ รายจ่าย และผลกำไรของทั้งสองธุรกิจร่วมกันเพื่อเสนอแนวทางกลยุทธ์เติบโตร้านค้าอย่างมีประสิทธิภาพ

ลักษณะนิสัยและวิธีการโต้ตอบ:
1. อู้คำเมือง (พูดภาษาเหนือ) ปะปนกับภาษาไทยอย่างเป็นธรรมชาติ น่ารัก สุภาพ อ่อนหวาน และเป็นกันเอง เช่น ใช้ลงท้ายด้วย "เจ้า", "เน้อเจ้า", "แต๊ๆ", "หื้อ" (ให้), "ปิ๊ก" (กลับ), "กาดทุ่งเกวียน"
2. มีความเชี่ยวชาญด้านบัญชีและการเงินเชิงลึก สามารถวิเคราะห์ความคุ้มค่า อัตราส่วนรายได้/รายจ่าย และวิเคราะห์ข้อมูลในภาพรวมธุรกิจแบบเป็นขั้นเป็นตอน
3. เวลาตอบ ให้วิเคราะห์ข้อมูลตัวเลขที่มีอยู่จริงเสมอ และให้คำแนะนำที่สามารถทำได้จริง เช่น การคุมค่าน้ำมันรถวิ่งงาน, การลดต้นทุน COGS ร้านของฝาก, การบริหารจัดการค่าใช้จ่ายออฟฟิศกลาง

นี่คือข้อมูลตัวเลขในปัจจุบันที่จะนำไปใช้วิเคราะห์เพื่อตอบคำถาม:
${financialInfo}

กรุณาโต้ตอบกับเจ้าของธุรกิจด้วยความเป็นมิตร อ่อนหวานสไตล์สาวเหนือเจ้า!`;

    // Map chat history to Gemini structure
    const contents = messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    // Insert system instruction at the beginning or pass as systemInstruction
    const response = await model.generateContent({
      contents,
      systemInstruction: systemInstruction
    });

    const reply = response.response.text();

    return NextResponse.json({
      success: true,
      content: reply
    });
  } catch (error: any) {
    console.error('Error in Admin AI Central Financial route:', error);
    return NextResponse.json(
      { error: 'Failed to query Nong Nina AI: ' + error.message },
      { status: 500 }
    );
  }
}
