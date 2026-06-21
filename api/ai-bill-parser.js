import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { pdfBase64, mimeType, routePresets } = req.body || {};

  if (!pdfBase64) {
    return res.status(400).json({ error: 'Missing pdfBase64 in request body' });
  }

  // Use backend env variable GEMINI_API_KEY.
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server' });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { responseMimeType: 'application/json' }
    });

    const pdfPart = {
      inlineData: {
        data: pdfBase64,
        mimeType: mimeType || 'application/pdf'
      }
    };

    const prompt = `
คุณเป็นผู้เชี่ยวชาญการตรวจเอกสารบัญชีและการขนส่งของไทย
นี่คือเอกสาร PDF หรือรูปภาพใบแจ้งยอดค่าขนส่งสินค้า กรุณาแกะข้อมูลรายการออกมาทั้งหมด

**กฎทางธุรกิจที่สำคัญในการคัดกรองเงิน (Business Rules):**
1. รายการที่มีจำนวนเงินเป็น 300, 600 หรือ 1000 บาท คือ "ค่าตะกร้า" (Basket Fee)
2. รายการที่มีจำนวนเงินอื่น ๆ ทั้งหมด (ที่ไม่ใช่ 300, 600, 1000) คือ "ค่าเที่ยว" (Trip Fare) ของงานวิ่งนั้น ๆ

**การจับคู่เส้นทาง (Route Mapping):**
กรุณาเปรียบเทียบชื่อเส้นทาง/สายงานที่เขียนในเอกสาร กับรายชื่อเส้นทางจริงในระบบดังต่อไปนี้ เพื่อระบุค่า "matchedRoute" ให้ตรงกับในระบบของเรามากที่สุด (หากไม่มีตัวสะกดที่ตรงหรือใกล้เคียง ให้ใส่เป็น null):
${JSON.stringify(routePresets || [])}

**ผลลัพธ์ที่ต้องการ:**
กรุณาส่งกลับผลลัพธ์เป็น JSON ในรูปแบบนี้เท่านั้น:
{
  "trips": [
    {
      "date": "YYYY-MM-DD",  // แปลงวันที่ในเอกสาร (พ.ศ. หรือ ค.ศ.) ให้เป็นรูปแบบสากล ค.ศ. YYYY-MM-DD เสมอ เช่น 25/05/2569 -> 2026-05-25
      "originalRoute": "ชื่อสายงานเดิมจากในบิล PDF",
      "matchedRoute": "ชื่อสายงานที่จับคู่ได้จากรายชื่อในระบบ (ถ้าจับคู่ไม่ได้ให้ใส่ null)",
      "price": 1200, // จำนวนเงินเฉพาะที่เป็น "ค่าเที่ยว" เท่านั้น (ถ้าแถวนั้นคือค่าตะกร้า 300, 600, 1000 ให้กรองออก ไม่ต้องเอามา หรือใส่ price = 0)
      "isBasket": false // ใส่ true ถ้าแถวนี้คือค่าตะกร้า 300, 600, 1000
    }
  ]
}
`;

    const result = await model.generateContent([pdfPart, prompt]);
    const responseText = result.response.text();
    
    // Parse to ensure it is valid JSON before sending back
    const parsedData = JSON.parse(responseText);

    return res.status(200).json(parsedData);
  } catch (error) {
    console.error('Error during Gemini API parsing:', error);
    return res.status(500).json({ error: error.message || 'Error processing AI parsing' });
  }
}
