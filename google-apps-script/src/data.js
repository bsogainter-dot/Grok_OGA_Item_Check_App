// OGA Item Check Assistant - Mock Data (matching live screenshots)
// Can be replaced with real Google Sheets fetch

const INITIAL_ITEMS = [
  {
    sku: "OGA-BC-101",
    barcode: "8859012301014",
    name: "Industrial 2D Barcode Scanner Pro",
    category: "Barcode Scanners",
    serial: "BC101-SN-8921",
    primaryLoc: "Rack-A01",
    actualLoc: "Rack-A01",
    zone: "Rack-A",
    systemOnHand: 100,
    reserved: 20,
    available: 80,
    physicalCount: 100,
    variance: 0,
    status: "MATCH",
    lastAudit: "2026-08-24 09:30:15",
    operator: "Somchai (PDA-01)",
    notes: ""
  },
  {
    sku: "OGA-BT-606",
    barcode: "8859012306060",
    name: "Smart Li-Ion Hot-Swap Battery 5000mAh",
    category: "Accessories",
    serial: "BT606-SN-3390",
    primaryLoc: "Rack-C03",
    actualLoc: "Rack-C03",
    zone: "Rack-C",
    systemOnHand: 150,
    reserved: 30,
    available: 120,
    physicalCount: 140,
    variance: -10,
    status: "DISCREPANCY",
    lastAudit: "2026-08-24 10:50:11",
    operator: "Wichai (PDA-02)",
    notes: "ขาด 10 ก้อน อาจหายระหว่างส่ง"
  },
  {
    sku: "OGA-CB-505",
    barcode: "8859012305053",
    name: "Multi-Bay Charging Cradle Dock 4-Slot",
    category: "Accessories",
    serial: "CB505-SN-1109",
    primaryLoc: "Rack-C01",
    actualLoc: "Rack-C01",
    zone: "Rack-C",
    systemOnHand: 25,
    reserved: 0,
    available: 25,
    physicalCount: 25,
    variance: 0,
    status: "MATCH",
    lastAudit: "2026-08-24 09:12:40",
    operator: "Somchai (PDA-01)",
    notes: ""
  },
  {
    sku: "OGA-LB-909",
    barcode: "8859012309091",
    name: "Direct Thermal Barcode Labels 100x150mm (Roll)",
    category: "Supplies",
    serial: "LB909-LOT-66",
    primaryLoc: "Rack-C05",
    actualLoc: "Rack-C05",
    zone: "Rack-C",
    systemOnHand: 300,
    reserved: 50,
    available: 250,
    physicalCount: 300,
    variance: 0,
    status: "MATCH",
    lastAudit: "2026-08-24 08:30:00",
    operator: "Somchai (PDA-01)",
    notes: ""
  },
  {
    sku: "OGA-PR-301",
    barcode: "8859012303018",
    name: "Heavy Duty Thermal Label Printer 4\"",
    category: "Printers",
    serial: "PR301-SN-9912",
    primaryLoc: "Rack-A05",
    actualLoc: "Rack-A05",
    zone: "Rack-A",
    systemOnHand: 30,
    reserved: 5,
    available: 25,
    physicalCount: 30,
    variance: 0,
    status: "MATCH",
    lastAudit: "2026-08-24 08:45:00",
    operator: "Somchai (PDA-01)",
    notes: ""
  },
  {
    sku: "OGA-RB-1010",
    barcode: "8859012310103",
    name: "Resin Thermal Transfer Ribbon 110mm x 300m",
    category: "Supplies",
    serial: "RB1010-LOT-98",
    primaryLoc: "Rack-C06",
    actualLoc: "Rack-C06",
    zone: "Rack-C",
    systemOnHand: 120,
    reserved: 20,
    available: 100,
    physicalCount: 120,
    variance: 0,
    status: "MATCH",
    lastAudit: "2026-08-24 08:35:10",
    operator: "Somchai (PDA-01)",
    notes: ""
  },
  {
    sku: "OGA-RF-102",
    barcode: "8859012301021",
    name: "RFID Handheld Gun Reader Ultra",
    category: "RFID Equipment",
    serial: "RF102-SN-4432",
    primaryLoc: "Rack-B04",
    actualLoc: "Rack-B04",
    zone: "Rack-B",
    systemOnHand: 50,
    reserved: 15,
    available: 35,
    physicalCount: 45,
    variance: -5,
    status: "DISCREPANCY",
    lastAudit: "2026-08-24 10:14:02",
    operator: "Wichai (PDA-02)",
    notes: "ขาด 5 เครื่อง คาดว่าถูกเบิกไปโชว์งาน OGA Tech Showcase"
  },
  {
    sku: "OGA-SN-808",
    barcode: "8859012308084",
    name: "Wireless Bluetooth Ring Scanner Wearable",
    category: "Barcode Scanners",
    serial: "SN808-SN-2210",
    primaryLoc: "Staging-01",
    actualLoc: "Rack-A02",
    zone: "Staging",
    systemOnHand: 15,
    reserved: 2,
    available: 13,
    physicalCount: 10,
    variance: -5,
    status: "MISPLACED",
    lastAudit: "2026-08-24 11:45:30",
    operator: "Wichai (PDA-02)",
    notes: "วางผิดที่ ควรอยู่ Staging-01 แต่พบที่ Rack-A02"
  },
  {
    sku: "OGA-TB-404",
    barcode: "8859012304046",
    name: "Rugged Android Mobile PDA 6\" IP68",
    category: "Mobile Computers",
    serial: "TB404-SN-7761",
    primaryLoc: "Rack-B02",
    actualLoc: "Rack-B02",
    zone: "Rack-B",
    systemOnHand: 40,
    reserved: 10,
    available: 30,
    physicalCount: 42,
    variance: 2,
    status: "DISCREPANCY",
    lastAudit: "2026-08-24 11:20:30",
    operator: "Nattapong (PDA-03)",
    notes: "เกิน 2 เครื่อง พบจากกล่องคืนจากงานซ่อม RMA"
  },
  {
    sku: "OGA-VR-707",
    barcode: "8859012307077",
    name: "Forklift Vehicle Mount Holster Kit",
    category: "Accessories",
    serial: "VR707-SN-5521",
    primaryLoc: "Rack-B08",
    actualLoc: "Rack-B08",
    zone: "Rack-B",
    systemOnHand: 60,
    reserved: 12,
    available: 48,
    physicalCount: 60,
    variance: 0,
    status: "MATCH",
    lastAudit: "2026-08-24 11:05:19",
    operator: "Nattapong (PDA-03)",
    notes: ""
  }

  ,
  {
    sku: "SH26/1070-01-01",
    barcode: "",
    name: "ZCM SGCD1 Z12 1.20 X 1389 X 2250",
    category: "Materials",
    serial: "",
    primaryLoc: "Rack-A01",
    actualLoc: "Rack-A01",
    zone: "Rack-A",
    systemOnHand: 22,
    reserved: 0,
    available: 0,
    physicalCount: 10,
    variance: -12,
    status: "DISCREPANCY",
    lastAudit: "",
    operator: "",
    notes: ""
  },
  {
    sku: "SH26/1070-02-01",
    barcode: "",
    name: "ZCM SGCD1 Z12 1.20 X 1389 X 2300",
    category: "Materials",
    serial: "",
    primaryLoc: "Rack-A02",
    actualLoc: "Rack-A02",
    zone: "Rack-A",
    systemOnHand: 11,
    reserved: 0,
    available: 0,
    physicalCount: 2,
    variance: -9,
    status: "DISCREPANCY",
    lastAudit: "",
    operator: "",
    notes: ""
  },
  {
    sku: "SH26/1070-03-01",
    barcode: "",
    name: "ZCM SGCD1 Z12 1.20 X 1389 X 2350",
    category: "Materials",
    serial: "",
    primaryLoc: "Rack-A03",
    actualLoc: "Rack-A03",
    zone: "Rack-A",
    systemOnHand: 18,
    reserved: 0,
    available: 0,
    physicalCount: 18,
    variance: 0,
    status: "MATCH",
    lastAudit: "",
    operator: "",
    notes: ""
  },
  {
    sku: "SL26/1070-01-01",
    barcode: "",
    name: "SS SUS 304 BA 0.80 X 165 X C",
    category: "Materials",
    serial: "",
    primaryLoc: "Rack-A10",
    actualLoc: "Rack-A10",
    zone: "Rack-A",
    systemOnHand: 496,
    reserved: 0,
    available: 0,
    physicalCount: 0,
    variance: -496,
    status: "DISCREPANCY",
    lastAudit: "",
    operator: "",
    notes: ""
  }
];

const INITIAL_TASKS = [
  {
    id: "TASK-001",
    type: "RECOUNT",
    priority: "HIGH",
    sku: "OGA-RF-102",
    name: "RFID Handheld Gun Reader Ultra",
    targetLoc: "Rack-B04",
    zone: "Rack-B",
    instruction: "ตรวจสอบยอดขาด -5 ชิ้น ที่ Rack-B04 ด่วน",
    status: "PENDING",
    assignedTo: "Supervisor Pitak",
    createdAt: "2026-08-24 10:20:00"
  },
  {
    id: "TASK-002",
    type: "RELOCATE",
    priority: "MEDIUM",
    sku: "OGA-SN-808",
    name: "Wireless Bluetooth Ring Scanner Wearable",
    targetLoc: "Staging-01",
    zone: "Staging",
    instruction: "ย้ายสินค้าจาก Rack-A02 กลับเข้าสู่ตำแหน่ง Staging-01",
    status: "PENDING",
    assignedTo: "Supervisor Pitak",
    createdAt: "2026-08-24 11:50:00"
  }
];

const INITIAL_AUDIT_LOGS = [
  { timestamp: "2026-08-24 11:45:30", device: "MOBILE_PDA", action: "FLAG_DISCREPANCY", sku: "OGA-SN-808", loc: "Rack-A02", system: 15, physical: 10, variance: -5, operator: "Wichai (PDA-02)", notes: "วางผิดที่" },
  { timestamp: "2026-08-24 11:20:30", device: "MOBILE_PDA", action: "FLAG_DISCREPANCY", sku: "OGA-TB-404", loc: "Rack-B02", system: 40, physical: 42, variance: 2, operator: "Nattapong (PDA-03)", notes: "พบของคืน RMA" },
  { timestamp: "2026-08-24 10:50:11", device: "MOBILE_PDA", action: "FLAG_DISCREPANCY", sku: "OGA-BT-606", loc: "Rack-C03", system: 150, physical: 140, variance: -10, operator: "Wichai (PDA-02)", notes: "ขาด 10 ก้อน" },
  { timestamp: "2026-08-24 10:14:02", device: "MOBILE_PDA", action: "FLAG_DISCREPANCY", sku: "OGA-RF-102", loc: "Rack-B04", system: 50, physical: 45, variance: -5, operator: "Wichai (PDA-02)", notes: "เบิกโชว์งาน" },
  { timestamp: "2026-08-24 09:30:15", device: "MOBILE_PDA", action: "CONFIRM_MATCH", sku: "OGA-BC-101", loc: "Rack-A01", system: 100, physical: 100, variance: 0, operator: "Somchai (PDA-01)", notes: "ยอดตรง" }
];

// ========== Google Sheets & Apps Script Config ==========
// โหลดจาก localStorage หรือใช้ค่าเริ่มต้นจาก screenshot
function loadSheetsConfig() {
  try {
    const raw = localStorage.getItem('oga_sheets_config');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return {
    webAppUrl: "https://script.google.com/macros/s/AKfycbw439O0bUnsgYmu23y7VeHVgP2G1t0UXypewr4tAvtMQn-_z5mjKrTHCYP1OCsumfVz/exec",
    spreadsheetId: "1IVnrFrIhKWyZiUml_5vXSsFpjhGo_A1KOfFP4X9229E",
    enabled: false,
    lastPing: null,
    lastSync: null
  };
}

function saveSheetsConfig(cfg) {
  localStorage.setItem('oga_sheets_config', JSON.stringify(cfg));
}

// ค่าเริ่มต้นจากระบบ (ตัวอย่างใน screenshot)
const DEFAULT_SHEETS = {
  sheetId: "1BtnPg9M0wi-kuPMDocMBw8nLSxrOh9PNVZPmvuryeJgE",
  scriptId: "AKfycbxk2zF987PT91-CxuxUjxhSA4F6701CoAFOyNm1FyU7nBo87fLdz12-cm-OHcG_f2xZ"
};

let SHEETS_CONFIG = loadSheetsConfig();

