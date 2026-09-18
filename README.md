# OGA Dual-Device Item Check Assistant v1.3

**OGA International Co., Ltd.**  
ระบบตรวจนับและกระทบยอดสินค้าแบบ Dual-Device (Mobile PDA + PC Desktop)

---

## คุณสมบัติหลัก

### Mobile PDA (หน้าจอแนวตั้ง 4-6 นิ้ว)
- **Bottom Navigation Bar** อยู่ด้านล่างจอเสมอ
- **Auto-Focus + Auto-Clear** หลังสแกน ช่องสแกนพร้อมรับชิ้นถัดไปทันที
- **Audio + Haptic Feedback**
  - Match → Beep สูงสั้น + สั่นเบา
  - Error / ไม่พบ → Beep ต่ำยาว + สั่นแรง
- **Signal Indicator** (ONLINE / OFFLINE / SYNC N) บน Top Bar
- **High Contrast Mode** กดปุ่ม 🔆
- **Offline First** บันทึกในเครื่องได้แม้ไม่มี Wi-Fi แล้ว Auto-Sync เมื่อกลับมาออนไลน์

### PC Desktop
- ตารางข้อมูล + KPI สรุป
- **Zone Progress Tracker** (Progress Bar % ต่อโซน)
- Export Excel / Discrepancy Report (.xlsx) / CSV
- สร้างใบงานส่ง PDA
- Daily Variance Report

### Google Sheets Integration
- เชื่อมต่อผ่าน Apps Script Web App
- รองรับทั้ง header แบบ `SKU, SystemOnHand...` และ `itemCode, systemQty...`

---

## วิธีติดตั้งและใช้งาน

### 1. ฝั่ง Google Apps Script
1. เปิด Google Sheet ของคุณ
2. ไปที่ **Extensions → Apps Script**
3. ลบโค้ดเดิม แล้ววางเนื้อหาจากไฟล์ `google-apps-script/Code.gs`
4. บันทึก → **Deploy → New deployment**
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
5. คัดลอก **Web App URL**

### 2. ฝั่งเว็บแอป
1. เปิดไฟล์ `index.html` ด้วย Chrome / Edge
2. กดปุ่ม **📊 Google Sheet**
3. วาง Web App URL + Spreadsheet ID
4. กด **บันทึกการตั้งค่า** → **ทดสอบเชื่อมต่อ (Ping)** → **ดึงข้อมูลทั้งหมด**

### 3. ทดสอบสแกน
- สลับไปโหมด **Mobile PDA**
- สแกนหรือพิมพ์ SKU (เช่น `SH26/1070-03-01` หรือ `OGA-RF-102`) แล้วกด Enter / SCAN
- ข้อมูลควรแสดงถูกต้องตาม Sheet

---

## โครงสร้างไฟล์

```
oga-item-check-assistant/
├── index.html                          ← เปิดไฟล์นี้
├── package.json
├── README.md
├── google-apps-script/
│   └── Code.gs                         ← วางใน Apps Script
└── src/
    ├── app.js                          ← Logic หลัก + UI
    ├── data.js                         ← Mock data + Config
    └── utils.js                        ← Audio, Offline, Export
```

---

## หมายเหตุสำคัญ
- หลัง Deploy Apps Script ใหม่ ต้องใช้ **Web App URL ชุดใหม่** (หรือใช้ URL เดิมถ้าเลือก "New version")
- หากสแกนแล้วไม่เจอสินค้า → กด **ดึงข้อมูลทั้งหมด** อีกครั้ง
- ข้อมูล Offline ถูกเก็บใน `localStorage` ของเบราว์เซอร์

© 2026 OGA International Co., Ltd.
