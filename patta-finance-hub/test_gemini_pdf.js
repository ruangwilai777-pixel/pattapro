process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

// Manually parse env variables
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let val = match[2] || '';
    if (val.length > 0 && val.startsWith('"') && val.endsWith('"')) {
      val = val.substring(1, val.length - 1);
    }
    env[key] = val.trim();
  }
});

const geminiApiKey = env.GEMINI_API_KEY;
const pdfPath = '/Users/santakrit3mgmail.com/.gemini/antigravity/scratch/bill_sample.pdf';

if (!geminiApiKey) {
  console.error('Missing GEMINI_API_KEY in .env.local');
  process.exit(1);
}

// Convert local file to Generative Part object
function fileToGenerativePart(filePath, mimeType) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(filePath)).toString("base64"),
      mimeType
    },
  };
}

async function run() {
  console.log('Initializing Gemini AI...');
  const genAI = new GoogleGenerativeAI(geminiApiKey);
  
  // Using gemini-2.5-flash
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const pdfPart = fileToGenerativePart(pdfPath, 'application/pdf');
  
  const prompt = `
คุณเป็นผู้เชี่ยวชาญการตรวจเอกสารบัญชีและการขนส่งของไทย
นี่คือไฟล์ PDF ตัวอย่างบิลค่าเที่ยวของธุรกิจรถขนส่ง (ภัทธา เรืองวิลัย)

**กฎทางธุรกิจที่สำคัญมาก (Business Rule):**
ในเอกสารนี้ ทุกรายการจะพิมพ์ในช่องรายการว่า "ค่าขนส่งสินค้า" เหมือนกันหมด
แต่แท้จริงแล้ว:
- รายการที่มีจำนวนเงินเท่ากับ 300, 600 หรือ 1,000 บาท คือ "ค่าตะกร้า" (Basket Fee) ของสายงานนั้นๆ
- รายการที่มีจำนวนเงินอื่นๆ (ที่ไม่ใช่ 300, 600, 1000) คือ "ค่าเที่ยว" (Trip Fare) ของสายงานนั้นๆ

กรุณาช่วยอ่านและประมวลผลข้อมูลในไฟล์นี้โดยใช้กฎข้างต้นเพื่อแยกแยะระหว่าง "ค่าเที่ยว" และ "ค่าตะกร้า" ในแต่ละเที่ยวงานอย่างถูกต้อง

โปรดสรุปข้อมูลออกมาเป็น ตาราง Markdown โดยแสดงรายละเอียดดังนี้:
1. ลำดับที่ / วันที่วิ่งงาน
2. สายรถ
3. ยอดเงินค่าเที่ยว (บาท) -> ใส่ยอดเงินถ้าไม่ใช่ 300, 600, 1000 (ถ้าเป็นกลุ่มนั้น ให้แสดงเป็น 0.00)
4. ยอดเงินค่าตะกร้า (บาท) -> ใส่ยอดเงินถ้าคือ 300, 600, 1000 (ถ้าเป็นยอดอื่น ให้แสดงเป็น 0.00)
5. ผลรวมเงินทั้งหมดของรายการนั้นๆ

ในตอนท้ายของคำตอบ ให้สรุปยอดรวมของ "ค่าเที่ยวทั้งหมด" และ "ค่าตะกร้าทั้งหมด" จากเอกสารฉบับนี้ด้วย
ตอบเป็นภาษาไทยเจ้า (อู้คำเมืองผสมภาษาไทยสไตล์น้องนินาก็ได้เจ้า)
`;

  console.log('Sending PDF with business rule to Gemini API...');
  try {
    const result = await model.generateContent([pdfPart, prompt]);
    const responseText = result.response.text();
    console.log('\n=== GEMINI RESPONSE ===\n');
    console.log(responseText);
    
    // Save response to scratch for reference
    fs.writeFileSync('/Users/santakrit3mgmail.com/.gemini/antigravity/scratch/extracted_bill_analysis_v2.md', responseText, 'utf8');
    console.log('\nAnalysis saved to /Users/santakrit3mgmail.com/.gemini/antigravity/scratch/extracted_bill_analysis_v2.md');
  } catch (error) {
    console.error('Error during Gemini PDF processing:', error);
  }
}

run();
