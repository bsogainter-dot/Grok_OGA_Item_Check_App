/**
 * OGA Item Check Assistant - Google Apps Script Backend
 * Deploy as Web App: Execute as "Me", Who has access: "Anyone"
 * 
 * Supported actions:
 *   ping     - Test connection
 *   setup    - Create/verify sheet structure
 *   getAll   - Get all items + tasks + audit logs
 *   saveItem - Upsert a single item (optional future)
 */

const SHEET_ITEMS = 'Items';
const SHEET_AUDIT = 'AuditLogs';
const SHEET_TASKS = 'Tasks';

const ITEM_HEADERS = [
  'SKU', 'Barcode', 'ProductName', 'Category', 'Serial',
  'PrimaryLoc', 'ActualLoc', 'Zone',
  'SystemOnHand', 'Reserved', 'Available', 'PhysicalCount', 'Variance',
  'Status', 'LastAudit', 'Operator', 'Notes'
];

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action || '';
    const ssId = body.spreadsheetId;

    let ss;
    if (ssId) {
      ss = SpreadsheetApp.openById(ssId);
    } else {
      ss = SpreadsheetApp.getActiveSpreadsheet();
    }

    switch (action) {
      case 'ping':
        return jsonResponse({
          ok: true,
          version: '1.0.0',
          serverTime: new Date().toISOString(),
          spreadsheetName: ss.getName()
        });

      case 'setup':
        return jsonResponse(setupStructure(ss));

      case 'getAll':
        return jsonResponse(getAllData(ss));

      default:
        return jsonResponse({ error: 'Unknown action: ' + action });
    }
  } catch (err) {
    return jsonResponse({ error: err.message });
  }
}

function doGet(e) {
  // สำหรับทดสอบง่ายๆ ผ่าน browser
  return ContentService
    .createTextOutput(JSON.stringify({
      ok: true,
      message: 'OGA Item Check Apps Script is running. Use POST with action=ping|setup|getAll'
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function runSetupManual() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  setupStructure(ss);
}

function setupStructure(ss) {
  const created = [];

  // Items sheet
  let sheet = ss.getSheetByName(SHEET_ITEMS);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_ITEMS);
    sheet.appendRow(ITEM_HEADERS);
    sheet.getRange(1, 1, 1, ITEM_HEADERS.length).setFontWeight('bold').setBackground('#1e293b').setFontColor('#f1f5f9');
    created.push(SHEET_ITEMS);
  } else {
    // ตรวจ header
    const existing = sheet.getRange(1, 1, 1, ITEM_HEADERS.length).getValues()[0];
    if (existing[0] !== 'SKU') {
      sheet.insertRowBefore(1);
      sheet.getRange(1, 1, 1, ITEM_HEADERS.length).setValues([ITEM_HEADERS]);
      sheet.getRange(1, 1, 1, ITEM_HEADERS.length).setFontWeight('bold');
    }
  }

  // AuditLogs
  sheet = ss.getSheetByName(SHEET_AUDIT);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_AUDIT);
    sheet.appendRow(['Timestamp', 'Device', 'Action', 'SKU', 'Location', 'System', 'Physical', 'Variance', 'Operator', 'Notes']);
    sheet.getRange(1, 1, 1, 10).setFontWeight('bold').setBackground('#1e293b').setFontColor('#f1f5f9');
    created.push(SHEET_AUDIT);
  }

  // Tasks
  sheet = ss.getSheetByName(SHEET_TASKS);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_TASKS);
    sheet.appendRow(['ID', 'Type', 'Priority', 'SKU', 'Name', 'TargetLoc', 'Zone', 'Instruction', 'Status', 'AssignedTo', 'CreatedAt']);
    sheet.getRange(1, 1, 1, 11).setFontWeight('bold').setBackground('#1e293b').setFontColor('#f1f5f9');
    created.push(SHEET_TASKS);
  }

  return {
    ok: true,
    message: created.length
      ? 'สร้างชีตใหม่: ' + created.join(', ')
      : 'โครงสร้างตารางครบถ้วนแล้ว (Items, AuditLogs, Tasks)'
  };
}

function runSetup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const result = setupStructure(ss);
  Logger.log(result);
}

function getAllData(ss) {
  const items = readSheetAsObjects(ss, SHEET_ITEMS);
  const auditLogs = readSheetAsObjects(ss, SHEET_AUDIT);
  const tasks = readSheetAsObjects(ss, SHEET_TASKS);

  return {
    ok: true,
    items: items,
    auditLogs: auditLogs,
    tasks: tasks,
    count: {
      items: items.length,
      auditLogs: auditLogs.length,
      tasks: tasks.length
    }
  };
}

function readSheetAsObjects(ss, sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  const headers = data[0].map(h => String(h).trim());
  const rows = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0]) continue; // skip empty
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = row[idx];
    });
    // normalize keys for frontend
    if (sheetName === SHEET_ITEMS) {
      rows.push({
        sku: obj.SKU || obj.sku || obj.itemCode || obj.ItemCode || '',
        barcode: obj.Barcode || obj.barcode || '',
        name: obj.ProductName || obj.name || obj.Name || '',
        category: obj.Category || obj.category || '',
        serial: obj.Serial || obj.serial || obj.serialNo || '',
        primaryLoc: obj.PrimaryLoc || obj.primaryLoc || '',
        actualLoc: obj.ActualLoc || obj.actualLoc || obj.PrimaryLoc || obj.primaryLoc || '',
        zone: obj.Zone || obj.zone || '',
        systemOnHand: Number(obj.SystemOnHand || obj.systemOnHand || obj.systemQty || obj.SystemQty || 0),
        reserved: Number(obj.Reserved || obj.reserved || obj.reservedQty || 0),
        available: Number(obj.Available || obj.available || obj.availableQty || 0),
        physicalCount: Number(obj.PhysicalCount || obj.physicalCount || obj.physicalQty || obj.PhysicalQty || 0),
        variance: Number(obj.Variance || obj.variance || 0),
        status: obj.Status || obj.status || 'MATCH',
        lastAudit: obj.LastAudit || obj.lastAudit || '',
        operator: obj.Operator || obj.operator || '',
        notes: obj.Notes || obj.notes || ''
      });
    } else {
      rows.push(obj);
    }
  }
  return rows;
}

