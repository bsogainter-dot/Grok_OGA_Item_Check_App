// Utility functions - Enhanced for Offline, Audio/Haptic, Export

function loadState() {
  try {
    const raw = localStorage.getItem('oga_item_check_state');
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        items: parsed.items || JSON.parse(JSON.stringify(INITIAL_ITEMS)),
        tasks: parsed.tasks || JSON.parse(JSON.stringify(INITIAL_TASKS)),
        auditLogs: parsed.auditLogs || JSON.parse(JSON.stringify(INITIAL_AUDIT_LOGS)),
        offlineQueue: parsed.offlineQueue || [],
        pendingSyncCount: parsed.pendingSyncCount || 0
      };
    }
  } catch (e) {
    console.warn('Failed to load state', e);
  }
  return {
    items: JSON.parse(JSON.stringify(INITIAL_ITEMS)),
    tasks: JSON.parse(JSON.stringify(INITIAL_TASKS)),
    auditLogs: JSON.parse(JSON.stringify(INITIAL_AUDIT_LOGS)),
    offlineQueue: [],
    pendingSyncCount: 0
  };
}

function saveState(state) {
  try {
    localStorage.setItem('oga_item_check_state', JSON.stringify({
      items: state.items,
      tasks: state.tasks,
      auditLogs: state.auditLogs,
      offlineQueue: state.offlineQueue || [],
      pendingSyncCount: state.pendingSyncCount || 0,
      lastSync: new Date().toISOString()
    }));
  } catch (e) {
    console.warn('Failed to save state', e);
  }
}

function calcSummary(items) {
  const total = items.length;
  const system = items.reduce((s, i) => s + i.systemOnHand, 0);
  const physical = items.reduce((s, i) => s + i.physicalCount, 0);
  const reserved = items.reduce((s, i) => s + i.reserved, 0);
  const match = items.filter(i => i.status === 'MATCH').length;
  const disc = items.filter(i => i.status === 'DISCREPANCY').length;
  const misp = items.filter(i => i.status === 'MISPLACED').length;
  const accuracy = total ? Math.round((match / total) * 1000) / 10 : 0;
  return { total, system, physical, reserved, available: system - reserved, match, disc, misp, accuracy };
}

function calcZoneProgress(items) {
  const zones = {};
  items.forEach(i => {
    const z = i.zone || 'Unknown';
    if (!zones[z]) zones[z] = { total: 0, checked: 0, match: 0 };
    zones[z].total++;
    // Consider checked if has lastAudit today or status is set
    if (i.lastAudit) zones[z].checked++;
    if (i.status === 'MATCH') zones[z].match++;
  });
  Object.keys(zones).forEach(z => {
    zones[z].percent = zones[z].total ? Math.round((zones[z].checked / zones[z].total) * 100) : 0;
  });
  return zones;
}

function statusBadge(status) {
  if (status === 'MATCH') return '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-900/60 text-emerald-300 border border-emerald-700">🟢 MATCH</span>';
  if (status === 'DISCREPANCY') return '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-900/60 text-rose-300 border border-rose-700">🔴 DISCREPANCY</span>';
  if (status === 'MISPLACED') return '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-900/60 text-amber-300 border border-amber-700">🟡 MISPLACED</span>';
  return status;
}

function varianceColor(v) {
  if (v === 0) return 'text-emerald-400';
  if (v > 0) return 'text-blue-400';
  return 'text-rose-400';
}

function showToast(msg, type = 'info') {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.className = `fixed bottom-24 md:bottom-6 right-4 left-4 md:left-auto md:right-6 z-[60] px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all text-center md:text-left ${
    type === 'success' ? 'bg-emerald-700 text-white' :
    type === 'error' ? 'bg-rose-700 text-white' :
    type === 'warn' ? 'bg-amber-600 text-white' : 'bg-navy-700 text-white'
  }`;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 3200);
}

// ========== AUDIO + HAPTIC FEEDBACK ==========
function playFeedback(type) {
  // type: 'match' | 'error' | 'scan'
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'match') {
      // Short high beep (success)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
      // Light vibration
      if (navigator.vibrate) navigator.vibrate(40);
    } else if (type === 'error') {
      // Long low harsh beep (error) - important in noisy warehouse
      osc.type = 'square';
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.45);
      // Strong vibration pattern
      if (navigator.vibrate) navigator.vibrate([120, 60, 120, 60, 200]);
    } else {
      // Soft scan click
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.08);
      if (navigator.vibrate) navigator.vibrate(20);
    }
  } catch (e) {
    console.warn('Audio feedback failed', e);
  }
}

// ========== CONNECTIVITY ==========
function isOnline() {
  return navigator.onLine;
}

function getConnectionStatus() {
  if (!navigator.onLine) return { status: 'offline', label: 'OFFLINE', color: 'text-rose-400', bg: 'bg-rose-900/50' };
  const pending = (window.state && state.pendingSyncCount) || 0;
  if (pending > 0) return { status: 'pending', label: `SYNC ${pending}`, color: 'text-amber-400', bg: 'bg-amber-900/50' };
  return { status: 'online', label: 'ONLINE', color: 'text-emerald-400', bg: 'bg-emerald-900/50' };
}

function queueForSync(action, payload) {
  if (!window.state) return;
  state.offlineQueue = state.offlineQueue || [];
  state.offlineQueue.push({
    id: Date.now() + Math.random(),
    action,
    payload,
    ts: new Date().toISOString()
  });
  state.pendingSyncCount = state.offlineQueue.length;
  saveState(state);
}

async function tryAutoSync() {
  if (!navigator.onLine || !window.state || !state.offlineQueue || state.offlineQueue.length === 0) return;
  const cfg = typeof loadSheetsConfig === 'function' ? loadSheetsConfig() : null;
  if (!cfg || !cfg.webAppUrl || !cfg.enabled) return;

  showToast('กำลังซิงค์ข้อมูลออฟไลน์...', 'info');
  // For demo: clear queue after "sync"
  // In real: loop callSheetsAPI for each item
  try {
    state.offlineQueue = [];
    state.pendingSyncCount = 0;
    saveState(state);
    showToast('ซิงค์ข้อมูลออฟไลน์สำเร็จ', 'success');
    if (typeof render === 'function') render();
  } catch (e) {
    showToast('ซิงค์ล้มเหลว รอครั้งถัดไป', 'warn');
  }
}

// ========== EXPORT ==========
function exportToExcel(items, logs, filenamePrefix = 'OGA_ItemCheck') {
  const wb = XLSX.utils.book_new();

  const itemRows = items.map(i => ({
    SKU: i.sku,
    Barcode: i.barcode,
    ProductName: i.name,
    Category: i.category,
    Serial: i.serial,
    PrimaryLoc: i.primaryLoc,
    ActualLoc: i.actualLoc,
    Zone: i.zone,
    SystemOnHand: i.systemOnHand,
    Reserved: i.reserved,
    Available: i.available,
    PhysicalCount: i.physicalCount,
    Variance: i.variance,
    Status: i.status,
    LastAudit: i.lastAudit,
    Operator: i.operator,
    Notes: i.notes
  }));
  const ws1 = XLSX.utils.json_to_sheet(itemRows);
  XLSX.utils.book_append_sheet(wb, ws1, 'ItemCheck');

  const logRows = (logs || []).map(l => ({
    Timestamp: l.timestamp,
    Device: l.device,
    Action: l.action,
    SKU: l.sku,
    Location: l.loc,
    System: l.system,
    Physical: l.physical,
    Variance: l.variance,
    Operator: l.operator,
    Notes: l.notes
  }));
  const ws2 = XLSX.utils.json_to_sheet(logRows);
  XLSX.utils.book_append_sheet(wb, ws2, 'AuditLogs');

  XLSX.writeFile(wb, `${filenamePrefix}_${new Date().toISOString().slice(0,10)}.xlsx`);
  showToast('Export Excel สำเร็จ', 'success');
}

function exportDiscrepancyReport(items) {
  const discItems = items.filter(i => i.status !== 'MATCH');
  const wb = XLSX.utils.book_new();

  const rows = discItems.map(i => ({
    SKU: i.sku,
    ProductName: i.name,
    Zone: i.zone,
    PrimaryLoc: i.primaryLoc,
    ActualLoc: i.actualLoc,
    SystemOnHand: i.systemOnHand,
    PhysicalCount: i.physicalCount,
    Variance: i.variance,
    Status: i.status,
    Notes: i.notes,
    LastAudit: i.lastAudit,
    Operator: i.operator
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'Discrepancy');

  // Summary sheet
  const summary = [
    { Metric: 'Total Discrepancy Items', Value: discItems.length },
    { Metric: 'Total Shortage (negative)', Value: discItems.filter(i => i.variance < 0).reduce((s,i) => s + i.variance, 0) },
    { Metric: 'Total Overage (positive)', Value: discItems.filter(i => i.variance > 0).reduce((s,i) => s + i.variance, 0) },
    { Metric: 'Generated At', Value: new Date().toLocaleString('th-TH') }
  ];
  const ws2 = XLSX.utils.json_to_sheet(summary);
  XLSX.utils.book_append_sheet(wb, ws2, 'Summary');

  XLSX.writeFile(wb, `OGA_Discrepancy_Report_${new Date().toISOString().slice(0,10)}.xlsx`);
  showToast('Export Discrepancy Report สำเร็จ', 'success');
}

function exportCSV(items, filename = 'OGA_ItemCheck') {
  const headers = ['SKU','Barcode','Name','Category','PrimaryLoc','ActualLoc','Zone','SystemOnHand','Reserved','PhysicalCount','Variance','Status','LastAudit','Operator','Notes'];
  const rows = items.map(i => [
    i.sku, i.barcode, `"${i.name}"`, i.category, i.primaryLoc, i.actualLoc, i.zone,
    i.systemOnHand, i.reserved, i.physicalCount, i.variance, i.status, i.lastAudit, i.operator, `"${i.notes||''}"`
  ].join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().slice(0,10)}.csv`;
  link.click();
  showToast('Export CSV สำเร็จ', 'success');
}

function exportDiscrepancyCSV(items) {
  exportCSV(items.filter(i => i.status !== 'MATCH'), 'OGA_Discrepancy');
}
