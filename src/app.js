// OGA Dual-Device Item Check Assistant - Main Application Logic

let state = loadState();
let currentMode = 'desktop'; // desktop | mobile | dual
let currentFilter = { zone: 'All', status: 'All', category: 'All', query: '' };
let selectedSku = null;
let currentOperator = 'Wichai (PDA-02)';
let currentZone = 'Rack-B';

// ========== MODE MANAGEMENT ==========
function setMode(mode) {
  currentMode = mode;
  document.querySelectorAll('.mode-btn').forEach(b => {
    b.classList.remove('bg-amber-600', 'text-white', 'border-amber-500');
    b.classList.add('bg-navy-800', 'border-navy-700');
  });
  const btn = document.getElementById(`btn-${mode === 'mobile' ? 'mobile' : mode === 'desktop' ? 'desktop' : 'dual'}`);
  if (btn) {
    btn.classList.remove('bg-navy-800', 'border-navy-700');
    btn.classList.add('bg-amber-600', 'text-white', 'border-amber-500');
  }
  render();
  if (mode === 'mobile' || mode === 'dual') {
    focusScanInput();
  }
}

// ========== RENDER ==========
function render() {
  const root = document.getElementById('app-root');
  if (currentMode === 'mobile') {
    root.innerHTML = renderMobilePDA();
  } else if (currentMode === 'dual') {
    root.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div class="border border-navy-700 rounded-2xl p-2 bg-navy-900/50">
          <div class="text-xs text-slate-400 mb-2 px-2">📱 Live Handheld PDA</div>
          ${renderMobilePDA(true)}
        </div>
        <div class="border border-navy-700 rounded-2xl p-2 bg-navy-900/50">
          <div class="text-xs text-slate-400 mb-2 px-2">💻 PC Desktop Control</div>
          ${renderDesktop(true)}
        </div>
      </div>`;
  } else {
    root.innerHTML = renderDesktop();
  }
  updateBadge();
}

function updateBadge() {
  const disc = state.items.filter(i => i.status !== 'MATCH').length;
  const badge = document.getElementById('variance-badge');
  if (badge) badge.textContent = disc;
}

// ========== DESKTOP VIEW ==========
function renderDesktop(compact = false) {
  const summary = calcSummary(state.items);
  const filtered = getFilteredItems();

  return `
  <div class="${compact ? '' : 'space-y-4'}">
    <!-- Summary Cards -->
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      <div class="bg-navy-800 rounded-xl p-3 border border-navy-700">
        <div class="text-[10px] text-slate-400 uppercase">TOTAL SKUS</div>
        <div class="text-2xl font-bold">${summary.total}</div>
        <div class="text-[10px] text-emerald-400">ตรวจสอบแล้ว 100%</div>
      </div>
      <div class="bg-navy-800 rounded-xl p-3 border border-navy-700">
        <div class="text-[10px] text-slate-400 uppercase">SYSTEM ON-HAND</div>
        <div class="text-2xl font-bold text-amber-400">${summary.system}</div>
        <div class="text-[10px] text-slate-400">จอง: ${summary.reserved} | ว่าง: ${summary.available}</div>
      </div>
      <div class="bg-navy-800 rounded-xl p-3 border border-navy-700">
        <div class="text-[10px] text-slate-400 uppercase">PHYSICAL COUNT</div>
        <div class="text-2xl font-bold">${summary.physical}</div>
        <div class="text-[10px] text-slate-400">นับจริงหน้างาน</div>
      </div>
      <div class="bg-navy-800 rounded-xl p-3 border border-emerald-800 status-match">
        <div class="text-[10px] text-emerald-300 uppercase">MATCH (ยอดตรง)</div>
        <div class="text-2xl font-bold text-emerald-300">${summary.match}</div>
        <div class="text-[10px] text-emerald-400">ความแม่นยำ ${summary.accuracy}%</div>
      </div>
      <div class="bg-navy-800 rounded-xl p-3 border border-rose-800 status-discrepancy">
        <div class="text-[10px] text-rose-300 uppercase">DISCREPANCY</div>
        <div class="text-2xl font-bold text-rose-300">${summary.disc}</div>
        <div class="text-[10px] text-rose-400">ขาด/เกิน ต้องตรวจสอบ</div>
      </div>
      <div class="bg-navy-800 rounded-xl p-3 border border-amber-800 status-misplaced">
        <div class="text-[10px] text-amber-300 uppercase">MISPLACED</div>
        <div class="text-2xl font-bold text-amber-300">${summary.misp}</div>
        <div class="text-[10px] text-amber-400">วางสลับ Location</div>
      </div>
    </div>

    <!-- Zone Progress Tracker -->
    <div class="bg-navy-800/80 border border-navy-700 rounded-xl p-4">
      <div class="text-xs font-semibold text-slate-300 mb-3 flex items-center gap-2">
        📈 Real-time Progress by Zone
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        ${Object.entries(calcZoneProgress(state.items)).map(([zone, z]) => `
        <div class="bg-navy-900 rounded-lg p-3 border border-navy-700">
          <div class="flex justify-between items-center mb-1">
            <span class="text-sm font-semibold text-amber-400">${zone}</span>
            <span class="text-xs font-bold ${z.percent >= 80 ? 'text-emerald-400' : z.percent >= 50 ? 'text-amber-400' : 'text-rose-400'}">${z.percent}%</span>
          </div>
          <div class="w-full h-2.5 bg-navy-700 rounded-full overflow-hidden">
            <div class="h-full rounded-full transition-all duration-500 ${z.percent >= 80 ? 'bg-emerald-500' : z.percent >= 50 ? 'bg-amber-500' : 'bg-rose-500'}" style="width:${z.percent}%"></div>
          </div>
          <div class="text-[10px] text-slate-500 mt-1">${z.checked}/${z.total} checked · Match ${z.match}</div>
        </div>`).join('')}
      </div>
    </div>

    <!-- Tabs & Actions -->
    <div class="flex flex-wrap items-center gap-2 justify-between">
      <div class="flex gap-1 bg-navy-800 p-1 rounded-xl">
        <button onclick="showTab('all')" class="tab-btn px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-600 text-white">รายการสินค้าทั้งหมด (${state.items.length})</button>
        <button onclick="showTab('variance')" class="tab-btn px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-navy-700">ผลต่าง Variance (${summary.disc + summary.misp})</button>
        <button onclick="showTab('tasks')" class="tab-btn px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-navy-700">ใบงานหน้างาน (${state.tasks.filter(t=>t.status==='PENDING').length})</button>
        <button onclick="showTab('logs')" class="tab-btn px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-navy-700">ประวัติการตรวจนับ (${state.auditLogs.length})</button>
      </div>
      <div class="flex flex-wrap gap-2">
        <button onclick="openTaskDispatch()" class="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-600 hover:bg-amber-500 text-white">📤 สร้างใบงานส่ง PDA</button>
        <button onclick="exportExcel()" class="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-700 hover:bg-emerald-600">⬇️ Export Excel</button>
        <button onclick="exportDiscrepancyReport(state.items)" class="px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-700 hover:bg-rose-600">⚠️ Discrepancy .xlsx</button>
        <button onclick="exportDiscrepancyCSV(state.items)" class="px-3 py-1.5 rounded-lg text-xs font-medium bg-navy-700 hover:bg-navy-600 border border-navy-500">CSV</button>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-2 items-center">
      <input type="text" id="search-input" placeholder="ค้นหา SKU, ชื่อสินค้า, บาร์โค้ด, Serial..." 
        class="flex-1 min-w-[200px] bg-navy-800 border border-navy-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
        oninput="currentFilter.query=this.value; render()" value="${currentFilter.query}" />
      <select onchange="currentFilter.zone=this.value; render()" class="bg-navy-800 border border-navy-700 rounded-lg px-3 py-2 text-sm">
        <option value="All" ${currentFilter.zone==='All'?'selected':''}>ทุกโซน (All Zones)</option>
        <option value="Rack-A">Zone: Rack-A</option>
        <option value="Rack-B">Zone: Rack-B</option>
        <option value="Rack-C">Zone: Rack-C</option>
        <option value="Staging">Zone: Staging</option>
      </select>
      <select onchange="currentFilter.status=this.value; render()" class="bg-navy-800 border border-navy-700 rounded-lg px-3 py-2 text-sm">
        <option value="All">ทุกสถานะ</option>
        <option value="MATCH">🟢 MATCH</option>
        <option value="DISCREPANCY">🔴 DISCREPANCY</option>
        <option value="MISPLACED">🟡 MISPLACED</option>
      </select>
    </div>

    <!-- Data Table (Desktop) / Cards (Mobile) -->
    <div id="main-content-area">
      ${renderItemsTable(filtered)}
    </div>
  </div>`;
}

function getFilteredItems() {
  return state.items.filter(i => {
    if (currentFilter.zone !== 'All' && i.zone !== currentFilter.zone) return false;
    if (currentFilter.status !== 'All' && i.status !== currentFilter.status) return false;
    if (currentFilter.query) {
      const q = currentFilter.query.toLowerCase();
      if (!(`${i.sku} ${i.name} ${i.barcode} ${i.serial} ${i.primaryLoc}`.toLowerCase().includes(q))) return false;
    }
    return true;
  });
}

function renderItemsTable(items) {
  // Responsive: on mobile show cards, on desktop table
  return `
  <div class="hidden md:block overflow-x-auto rounded-xl border border-navy-700">
    <table class="w-full text-sm">
      <thead class="bg-navy-800 text-slate-400 text-[11px] uppercase">
        <tr>
          <th class="px-3 py-2 text-left">SKU Code</th>
          <th class="px-3 py-2 text-left">Product Name & Category</th>
          <th class="px-3 py-2 text-left">Location</th>
          <th class="px-3 py-2 text-right">System</th>
          <th class="px-3 py-2 text-right">Reserved</th>
          <th class="px-3 py-2 text-right">Available</th>
          <th class="px-3 py-2 text-right">Physical</th>
          <th class="px-3 py-2 text-right">Variance</th>
          <th class="px-3 py-2 text-center">Status</th>
          <th class="px-3 py-2 text-left">Last Audit</th>
          <th class="px-3 py-2 text-center">Actions</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(i => `
        <tr class="border-t border-navy-800 hover:bg-navy-800/50">
          <td class="px-3 py-2">
            <div class="font-mono font-semibold text-amber-400">${i.sku}</div>
            <div class="text-[10px] text-slate-500">${i.barcode}</div>
          </td>
          <td class="px-3 py-2">
            <div class="font-medium">${i.name}</div>
            <div class="text-[10px] text-slate-400">${i.category} · SN: ${i.serial}</div>
          </td>
          <td class="px-3 py-2">
            <div>${i.primaryLoc}</div>
            ${i.primaryLoc !== i.actualLoc ? `<div class="text-[10px] text-amber-400">Actual: ${i.actualLoc}</div>` : ''}
            <div class="text-[10px] text-slate-500">Zone: ${i.zone}</div>
          </td>
          <td class="px-3 py-2 text-right font-mono">${i.systemOnHand}</td>
          <td class="px-3 py-2 text-right font-mono text-amber-400">${i.reserved}</td>
          <td class="px-3 py-2 text-right font-mono text-emerald-400">${i.available}</td>
          <td class="px-3 py-2 text-right font-mono">${i.physicalCount}</td>
          <td class="px-3 py-2 text-right font-mono font-bold ${varianceColor(i.variance)}">${i.variance > 0 ? '+' : ''}${i.variance}</td>
          <td class="px-3 py-2 text-center">${statusBadge(i.status)}</td>
          <td class="px-3 py-2 text-[11px]">
            <div>${i.lastAudit.split(' ')[1] || i.lastAudit}</div>
            <div class="text-slate-500">${i.operator}</div>
          </td>
          <td class="px-3 py-2 text-center">
            <button onclick="openItemDetail('${i.sku}')" class="text-slate-400 hover:text-white px-1">🔍</button>
            <button onclick="openTaskDispatch('${i.sku}')" class="text-slate-400 hover:text-amber-400 px-1">📤</button>
          </td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>

  <!-- Mobile Cards -->
  <div class="md:hidden space-y-3">
    ${items.map(i => `
    <div class="bg-navy-800 rounded-xl p-3 border border-navy-700 card-hover">
      <div class="flex justify-between items-start mb-2">
        <div>
          <div class="font-mono font-semibold text-amber-400">${i.sku}</div>
          <div class="text-sm font-medium">${i.name}</div>
          <div class="text-[10px] text-slate-400">${i.category}</div>
        </div>
        ${statusBadge(i.status)}
      </div>
      <div class="grid grid-cols-3 gap-2 text-center text-xs mb-2">
        <div class="bg-navy-900 rounded-lg p-1.5"><div class="text-slate-500">System</div><div class="font-bold">${i.systemOnHand}</div></div>
        <div class="bg-navy-900 rounded-lg p-1.5"><div class="text-slate-500">Physical</div><div class="font-bold">${i.physicalCount}</div></div>
        <div class="bg-navy-900 rounded-lg p-1.5"><div class="text-slate-500">Variance</div><div class="font-bold ${varianceColor(i.variance)}">${i.variance > 0 ? '+' : ''}${i.variance}</div></div>
      </div>
      <div class="flex justify-between text-[11px] text-slate-400">
        <span>📍 ${i.primaryLoc} (${i.zone})</span>
        <span>${i.operator}</span>
      </div>
    </div>`).join('')}
  </div>`;
}

// ========== MOBILE PDA VIEW ==========


function renderNotFoundPDA(code, conn, pendingTasks, compact) {
  const content = `
  <div class="pda-screen ${compact ? '' : 'mx-auto'} max-w-md ${compact ? '' : 'pda-content-with-nav'}">
    <div class="bg-navy-900 border border-navy-700 rounded-2xl overflow-hidden shadow-2xl">
      <div class="bg-navy-800 px-3 py-2 flex items-center justify-between border-b border-navy-700">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full ${conn.status === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}"></span>
          <span class="text-xs font-semibold">OGA TC-57X</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-[10px] px-1.5 py-0.5 rounded ${conn.bg} ${conn.color} font-bold">${conn.label}</span>
        </div>
      </div>
      <div class="p-4 space-y-4">
        <form id="scan-form" class="flex gap-2" onsubmit="event.preventDefault(); handleScan(document.getElementById('scan-input').value); return false;">
          <input id="scan-input" type="text" autocomplete="off" spellcheck="false"
            placeholder="ยิงบาร์โค้ด / SKU / Serial..." 
            class="flex-1 bg-navy-950 border-2 border-rose-500 rounded-xl px-3 py-3.5 text-sm focus:outline-none font-mono" />
          <button type="submit" class="px-5 py-3.5 rounded-xl bg-rose-600 font-bold text-sm">SCAN</button>
        </form>

        <div class="bg-rose-950/60 border-2 border-rose-600 rounded-xl p-5 text-center">
          <div class="text-4xl mb-2">🔍</div>
          <div class="text-rose-300 font-bold text-lg mb-1">ไม่พบสินค้าในระบบ</div>
          <div class="font-mono text-amber-300 text-sm break-all mb-3">${code}</div>
          <div class="text-xs text-slate-400 leading-relaxed">
            SKU / บาร์โค้ดนี้ยังไม่มีในฐานข้อมูลที่โหลดอยู่<br>
            กรุณาตรวจสอบการสะกด หรือกดปุ่ม <b>Google Sheet → ดึงข้อมูลทั้งหมด</b> เพื่อซิงค์ข้อมูลล่าสุดจาก Sheet
          </div>
        </div>

        <button onclick="rescan()" class="w-full py-3 rounded-xl bg-navy-700 font-semibold text-sm">🔄 สแกนใหม่</button>
      </div>
    </div>
  </div>`;
  const bottomNav = compact ? '' : `
  <nav class="bottom-nav mobile-only">
    <div class="flex items-stretch justify-around h-16 max-w-md mx-auto">
      <button onclick="setMode('mobile')" class="flex-1 flex flex-col items-center justify-center gap-0.5 text-amber-400">
        <span class="text-xl">📷</span><span class="text-[10px] font-semibold">สแกน</span>
      </button>
      <button onclick="showPdaTasks()" class="flex-1 flex flex-col items-center justify-center gap-0.5 text-slate-400">
        <span class="text-xl">📋</span><span class="text-[10px]">ใบงาน</span>
      </button>
      <button onclick="toggleHighContrast()" class="flex-1 flex flex-col items-center justify-center gap-0.5 text-slate-400">
        <span class="text-xl">🔆</span><span class="text-[10px]">Contrast</span>
      </button>
      <button onclick="setMode('desktop')" class="flex-1 flex flex-col items-center justify-center gap-0.5 text-slate-400">
        <span class="text-xl">💻</span><span class="text-[10px]">PC View</span>
      </button>
      <button onclick="openSheetsSettings()" class="flex-1 flex flex-col items-center justify-center gap-0.5 text-slate-400">
        <span class="text-xl">☁️</span><span class="text-[10px]">Sync</span>
      </button>
    </div>
  </nav>`;
  return content + bottomNav;
}

function renderMobilePDA(compact = false) {
  const conn = getConnectionStatus();
  const pendingTasks = state.tasks.filter(t => t.status === 'PENDING').length;

  // Handle not-found scanned code
  let notFoundCode = null;
  if (selectedSku && selectedSku.startsWith('__NOT_FOUND__:')) {
    notFoundCode = selectedSku.replace('__NOT_FOUND__:', '');
  }

  let item = null;
  if (!notFoundCode) {
    item = selectedSku ? state.items.find(i => i.sku === selectedSku) : state.items.find(i => i.sku === 'OGA-RF-102') || state.items[0];
  }

  if (notFoundCode) {
    // Render a clear "SKU Not Found" card
    return renderNotFoundPDA(notFoundCode, conn, pendingTasks, compact);
  }

  if (!item) return '<div class="text-center py-10">ไม่มีข้อมูลสินค้า</div>';

  const statusClass = item.status === 'MATCH' ? 'status-match' : item.status === 'DISCREPANCY' ? 'status-discrepancy' : 'status-misplaced';
  const statusText = item.status === 'MATCH' ? '[MATCH - OK]' : item.status === 'DISCREPANCY' ? '[DISCREPANCY - WARNING]' : '[MISPLACED]';

  const content = `
  <div class="pda-screen ${compact ? '' : 'mx-auto'} max-w-md ${compact ? '' : 'pda-content-with-nav'}">
    <div class="bg-navy-900 border border-navy-700 rounded-2xl overflow-hidden shadow-2xl">
      <!-- PDA Top Bar with Signal -->
      <div class="bg-navy-800 px-3 py-2 flex items-center justify-between border-b border-navy-700">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full ${conn.status === 'online' ? 'bg-emerald-400 animate-pulse' : conn.status === 'pending' ? 'bg-amber-400 animate-pulse' : 'bg-rose-500'}"></span>
          <span class="text-xs font-semibold">OGA TC-57X</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-[10px] px-1.5 py-0.5 rounded ${conn.bg} ${conn.color} font-bold">${conn.label}</span>
          <span class="text-[10px] text-slate-400">${currentOperator.split(' ')[0]}</span>
        </div>
      </div>

      <div class="p-3 space-y-3">
        <!-- Zone & Task banner -->
        <div class="flex items-center justify-between gap-2">
          <select onchange="currentZone=this.value" class="bg-navy-800 border border-navy-700 rounded-lg px-2 py-1.5 text-xs flex-1">
            <option value="Rack-B" ${currentZone==='Rack-B'?'selected':''}>Zone: Rack-B</option>
            <option value="Rack-A" ${currentZone==='Rack-A'?'selected':''}>Zone: Rack-A</option>
            <option value="Rack-C" ${currentZone==='Rack-C'?'selected':''}>Zone: Rack-C</option>
            <option value="Staging" ${currentZone==='Staging'?'selected':''}>Zone: Staging</option>
          </select>
          ${pendingTasks > 0 ? `<div class="text-[10px] text-amber-400 whitespace-nowrap">📋 ${pendingTasks} งาน</div>` : ''}
        </div>

        <!-- Scan Input - Form for reliable Enter key from barcode scanners -->
        <form id="scan-form" class="flex gap-2" onsubmit="event.preventDefault(); handleScan(document.getElementById('scan-input').value); return false;">
          <input id="scan-input" type="text" inputmode="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"
            placeholder="ยิงบาร์โค้ด / SKU / Serial..." 
            class="flex-1 bg-navy-950 border-2 border-amber-500/70 rounded-xl px-3 py-3.5 text-sm focus:outline-none focus:border-amber-400 font-mono"
            enterkeyhint="go" />
          <button type="submit"
            class="px-5 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 font-bold text-sm scan-laser">SCAN</button>
        </form>

        <!-- Current SKU Card -->
        <div class="bg-navy-800 rounded-xl p-3 border border-navy-700">
          <div class="flex justify-between items-start mb-1">
            <div class="font-mono text-amber-400 font-bold text-lg">SKU: ${item.sku}</div>
            <span class="text-[10px] px-2 py-0.5 rounded bg-navy-700">${item.category || 'General'}</span>
          </div>
          <div class="text-sm font-medium mb-2 leading-snug">${item.name}</div>
          <div class="text-[11px] text-slate-400 space-y-1">
            <div class="flex items-center gap-1">📍 Primary: <b class="text-slate-200">${item.primaryLoc}</b> · Zone: ${item.zone}</div>
            ${item.primaryLoc !== item.actualLoc ? `<div class="text-amber-400">→ Actual: ${item.actualLoc}</div>` : ''}
            <div>🔢 ${item.barcode || '-'} ${item.serial ? '· SN: ' + item.serial : ''}</div>
          </div>
        </div>

        <!-- Status Block - High visibility (full text like original) -->
        <div class="${statusClass} rounded-xl p-4 border-2 text-center">
          <div class="text-sm font-bold tracking-wide mb-2 opacity-95">${statusText}</div>
          <div class="text-xl font-bold mb-1">System: ${item.systemOnHand} | Physical: ${item.physicalCount}</div>
          <div class="inline-block px-3 py-1 rounded-full text-base font-black ${item.variance === 0 ? 'bg-emerald-900/50 text-emerald-300' : item.variance < 0 ? 'bg-rose-900/50 text-rose-300' : 'bg-blue-900/50 text-blue-300'}">
            ผลต่าง: ${item.variance > 0 ? '+' : ''}${item.variance} ${item.variance === 0 ? 'ชิ้น' : item.variance < 0 ? '(ขาด) ชิ้น' : '(เกิน) ชิ้น'}
          </div>
        </div>

        <!-- Qty Stepper - Large touch targets -->
        <div>
          <div class="text-xs text-slate-400 mb-1.5 text-center">ปรับจำนวนนับจริง (Physical)</div>
          <div class="flex items-center justify-center gap-2">
            <button onclick="adjustQty('${item.sku}', -5)" class="w-14 h-14 rounded-xl bg-navy-800 border border-navy-600 text-lg font-bold active:bg-navy-700">-5</button>
            <button onclick="adjustQty('${item.sku}', -1)" class="w-14 h-14 rounded-xl bg-navy-800 border border-navy-600 text-xl font-bold active:bg-navy-700">−</button>
            <input id="physical-input" type="number" value="${item.physicalCount}" 
              class="w-20 h-14 text-center text-2xl font-black bg-navy-950 border-2 border-amber-500 rounded-xl focus:outline-none"
              onchange="setPhysical('${item.sku}', this.value)" />
            <button onclick="adjustQty('${item.sku}', 1)" class="w-14 h-14 rounded-xl bg-navy-800 border border-navy-600 text-xl font-bold active:bg-navy-700">+</button>
            <button onclick="adjustQty('${item.sku}', 5)" class="w-14 h-14 rounded-xl bg-navy-800 border border-navy-600 text-lg font-bold active:bg-navy-700">+5</button>
          </div>
        </div>

        <!-- Quick reason chips -->
        <div class="flex flex-wrap gap-1.5 justify-center">
          ${['เบิกงานอีเวนต์','รับคืน RMA','วางผิดที่','ชำรุด','นับซ้ำยืนยัน'].map(r => 
            `<button onclick="setNote('${item.sku}','${r}')" class="text-[10px] px-2.5 py-1.5 rounded-lg bg-navy-800 border border-navy-600 active:border-amber-500">${r}</button>`
          ).join('')}
        </div>

        <!-- Primary Actions -->
        <div class="grid grid-cols-1 gap-2 pt-1">
          <button onclick="flagDiscrepancy('${item.sku}')" 
            class="w-full py-4 rounded-xl bg-rose-600 active:bg-rose-700 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-900/40">
            ⚠️ บันทึกผลต่างทันที
          </button>
          <div class="grid grid-cols-2 gap-2">
            <button onclick="confirmMatch('${item.sku}')" class="py-3.5 rounded-xl bg-emerald-700 active:bg-emerald-800 font-semibold text-sm">
              ✅ ยืนยันยอดตรง
            </button>
            <button onclick="rescan()" class="py-3.5 rounded-xl bg-navy-700 active:bg-navy-600 font-semibold text-sm">
              🔄 สแกนใหม่
            </button>
          </div>
        </div>

        <!-- Quick SKU presets (demo) -->
        <div class="pt-1 border-t border-navy-800">
          <div class="text-[10px] text-slate-500 mb-1">Quick Select</div>
          <div class="flex flex-wrap gap-1">
            ${state.items.slice(0,6).map(i => `
              <button onclick="selectSku('${i.sku}')" 
                class="text-[10px] px-2 py-1 rounded-lg border ${i.sku===item.sku ? 'border-amber-500 bg-amber-900/50' : 'border-navy-700 bg-navy-800'}">
                ${i.sku.split('-').pop()} ${i.status==='MATCH'?'🟢':i.status==='DISCREPANCY'?'🔴':'🟡'}
              </button>`).join('')}
          </div>
        </div>
      </div>
    </div>
  </div>`;

  // Bottom Navigation (only when not compact / dual view)
  const bottomNav = compact ? '' : `
  <nav class="bottom-nav mobile-only">
    <div class="flex items-stretch justify-around h-16 max-w-md mx-auto">
      <button onclick="setMode('mobile'); selectSku(selectedSku || 'OGA-RF-102');" class="flex-1 flex flex-col items-center justify-center gap-0.5 text-amber-400">
        <span class="text-xl">📷</span>
        <span class="text-[10px] font-semibold">สแกน</span>
      </button>
      <button onclick="showPdaTasks()" class="flex-1 flex flex-col items-center justify-center gap-0.5 text-slate-400 relative">
        <span class="text-xl">📋</span>
        <span class="text-[10px]">ใบงาน</span>
        ${pendingTasks > 0 ? `<span class="absolute top-1 right-4 w-4 h-4 bg-rose-500 rounded-full text-[9px] flex items-center justify-center text-white">${pendingTasks}</span>` : ''}
      </button>
      <button onclick="toggleHighContrast()" class="flex-1 flex flex-col items-center justify-center gap-0.5 text-slate-400">
        <span class="text-xl">🔆</span>
        <span class="text-[10px]">Contrast</span>
      </button>
      <button onclick="setMode('desktop')" class="flex-1 flex flex-col items-center justify-center gap-0.5 text-slate-400">
        <span class="text-xl">💻</span>
        <span class="text-[10px]">PC View</span>
      </button>
      <button onclick="openSheetsSettings()" class="flex-1 flex flex-col items-center justify-center gap-0.5 text-slate-400">
        <span class="text-xl">☁️</span>
        <span class="text-[10px]">Sync</span>
      </button>
    </div>
  </nav>`;

  return content + bottomNav;
}

function focusScanInput() {
  setTimeout(() => {
    const el = document.getElementById('scan-input');
    if (!el) return;
    el.focus();
    // Extra safety: attach keydown once more (in case of any edge cases)
    if (!el._scanBound) {
      el.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.keyCode === 13) {
          e.preventDefault();
          e.stopPropagation();
          handleScan(el.value);
        }
      });
      el._scanBound = true;
    }
    // Also bind form submit if exists
    const form = document.getElementById('scan-form');
    if (form && !form._scanBound) {
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        handleScan(el.value);
      });
      form._scanBound = true;
    }
  }, 60);
}

function toggleHighContrast() {
  document.body.classList.toggle('high-contrast');
  const on = document.body.classList.contains('high-contrast');
  localStorage.setItem('oga_high_contrast', on ? '1' : '0');
  showToast(on ? 'เปิด High Contrast แล้ว' : 'ปิด High Contrast', 'info');
}

function showPdaTasks() {
  const pending = state.tasks.filter(t => t.status === 'PENDING');
  if (pending.length === 0) {
    showToast('ไม่มีใบงานค้าง', 'info');
    return;
  }
  openModal(`
    <div class="p-4">
      <div class="flex justify-between items-center mb-3">
        <h3 class="font-bold">📋 ใบงานหน้างาน (${pending.length})</h3>
        <button onclick="closeModal()" class="text-xl text-slate-400">×</button>
      </div>
      <div class="space-y-2">
        ${pending.map(t => `
        <div class="bg-navy-800 rounded-xl p-3 border border-navy-700">
          <div class="flex justify-between">
            <span class="font-mono text-amber-400 font-semibold">${t.sku}</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded ${t.priority==='HIGH'?'bg-rose-900 text-rose-300':'bg-amber-900 text-amber-300'}">${t.priority}</span>
          </div>
          <div class="text-sm mt-1">${t.instruction}</div>
          <div class="text-[10px] text-slate-500 mt-1">${t.targetLoc} · ${t.type}</div>
          <button onclick="selectSku('${t.sku}'); closeModal();" class="mt-2 w-full py-2 rounded-lg bg-amber-600 text-xs font-semibold">เปิดสแกน SKU นี้</button>
        </div>`).join('')}
      </div>
    </div>`);
}

// ========== ACTIONS ==========
function selectSku(sku) {
  selectedSku = sku;
  render();
}


function handleScan(code) {
  const raw = (code || '').toString();
  const q = raw.trim();
  
  const input = document.getElementById('scan-input');
  if (input) input.value = '';

  if (!q) {
    playFeedback('error');
    showToast('⚠️ กรุณายิงบาร์โค้ด หรือพิมพ์ SKU / Serial ก่อนกด SCAN', 'warn');
    focusScanInput();
    return;
  }

  // 1) Exact match first (SKU / Barcode / Serial) — most important
  let found = state.items.find(i => {
    const sku = (i.sku || '').toString().trim();
    const barcode = (i.barcode || '').toString().trim();
    const serial = (i.serial || '').toString().trim();
    return sku === q || barcode === q || serial === q ||
           sku.toLowerCase() === q.toLowerCase() ||
           barcode.toLowerCase() === q.toLowerCase() ||
           serial.toLowerCase() === q.toLowerCase();
  });

  // 2) If no exact match, try startsWith (for partial scanner reads) but only if unique
  if (!found) {
    const candidates = state.items.filter(i => {
      const sku = (i.sku || '').toString().toLowerCase();
      const barcode = (i.barcode || '').toString().toLowerCase();
      const ql = q.toLowerCase();
      return (sku && sku.startsWith(ql)) || (barcode && barcode.startsWith(ql));
    });
    if (candidates.length === 1) found = candidates[0];
  }

  if (found) {
    // Always re-calculate status from current variance
    found.variance = (found.physicalCount || 0) - (found.systemOnHand || 0);
    if (found.primaryLoc && found.actualLoc && found.primaryLoc !== found.actualLoc && found.variance !== 0) {
      found.status = 'MISPLACED';
    } else if (found.variance !== 0) {
      found.status = 'DISCREPANCY';
    } else {
      found.status = 'MATCH';
    }

    selectedSku = found.sku;
    if (found.status === 'MATCH') {
      playFeedback('match');
      showToast('✅ พบสินค้า: ' + found.sku + ' · [MATCH - OK]', 'success');
    } else {
      playFeedback('error');
      showToast('⚠️ พบสินค้า: ' + found.sku + ' · [' + found.status + ']', 'warn');
    }
    if (!navigator.onLine) {
      queueForSync('scan', { sku: found.sku, ts: new Date().toISOString() });
    }
    render();
    focusScanInput();
  } else {
    selectedSku = '__NOT_FOUND__:' + q;
    playFeedback('error');
    showToast('❌ ไม่พบสินค้าในระบบ: "' + q + '" — ลองดึงข้อมูลจาก Google Sheet อีกครั้ง', 'error');
    render();
    focusScanInput();
  }
}

function adjustQty(sku, delta) {
  const item = state.items.find(i => i.sku === sku);
  if (!item) return;
  item.physicalCount = Math.max(0, item.physicalCount + delta);
  item.variance = item.physicalCount - item.systemOnHand;
  updateStatus(item);
  saveState(state);
  render();
}

function setPhysical(sku, val) {
  const item = state.items.find(i => i.sku === sku);
  if (!item) return;
  item.physicalCount = Math.max(0, parseInt(val) || 0);
  item.variance = item.physicalCount - item.systemOnHand;
  updateStatus(item);
  saveState(state);
  render();
}

function updateStatus(item) {
  if (item.primaryLoc !== item.actualLoc && item.variance !== 0) {
    item.status = 'MISPLACED';
  } else if (item.variance !== 0) {
    item.status = 'DISCREPANCY';
  } else {
    item.status = 'MATCH';
  }
}

function setNote(sku, note) {
  const item = state.items.find(i => i.sku === sku);
  if (item) {
    item.notes = note;
    showToast('บันทึกเหตุผล: ' + note, 'info');
  }
}

function confirmMatch(sku) {
  const item = state.items.find(i => i.sku === sku);
  if (!item) return;
  item.physicalCount = item.systemOnHand;
  item.variance = 0;
  item.status = 'MATCH';
  item.lastAudit = new Date().toISOString().replace('T',' ').slice(0,19);
  item.operator = currentOperator;
  addAuditLog('CONFIRM_MATCH', item);
  saveState(state);
  playFeedback('match');
  showToast(`✅ ยืนยันยอด ${sku} ถูกต้อง`, 'success');
  render();
}

function flagDiscrepancy(sku) {
  const item = state.items.find(i => i.sku === sku);
  if (!item) return;
  item.lastAudit = new Date().toISOString().replace('T',' ').slice(0,19);
  item.operator = currentOperator;
  updateStatus(item);
  addAuditLog('FLAG_DISCREPANCY', item);
  // Auto create task if variance != 0
  if (item.variance !== 0) {
    const exists = state.tasks.find(t => t.sku === sku && t.status === 'PENDING');
    if (!exists) {
      state.tasks.push({
        id: 'TASK-' + Date.now(),
        type: item.status === 'MISPLACED' ? 'RELOCATE' : 'RECOUNT',
        priority: Math.abs(item.variance) >= 5 ? 'HIGH' : 'MEDIUM',
        sku: item.sku,
        name: item.name,
        targetLoc: item.primaryLoc,
        zone: item.zone,
        instruction: `ตรวจสอบผลต่าง ${item.variance} ชิ้น ที่ ${item.primaryLoc}`,
        status: 'PENDING',
        assignedTo: 'Supervisor',
        createdAt: item.lastAudit
      });
    }
  }
  saveState(state);
  playFeedback('alert');
  showToast(`⚠️ บันทึกผลต่าง ${sku} และแจ้ง Supervisor แล้ว`, 'warn');
  render();
}

function addAuditLog(action, item) {
  state.auditLogs.unshift({
    timestamp: item.lastAudit,
    device: 'MOBILE_PDA',
    action,
    sku: item.sku,
    loc: item.actualLoc,
    system: item.systemOnHand,
    physical: item.physicalCount,
    variance: item.variance,
    operator: item.operator,
    notes: item.notes || ''
  });
  // Keep last 50
  if (state.auditLogs.length > 50) state.auditLogs.length = 50;
}

function rescan() {
  selectedSku = null;
  const input = document.getElementById('scan-input');
  if (input) { input.value = ''; input.focus(); }
  render();
}

function askCopilot(sku) {
  const item = state.items.find(i => i.sku === sku);
  if (!item) return;
  const msg = `🤖 Copilot AI วิเคราะห์:\n\nSKU: ${item.sku}\nสถานะ: ${item.status}\nผลต่าง: ${item.variance} ชิ้น\n\nสาเหตุที่เป็นไปได้:\n${item.notes || '- ยังไม่มีบันทึกเหตุผล'}\n\nแนวทางแก้ไข:\n1. ส่งใบงาน Re-count ให้พนักงานหน้างาน\n2. ตรวจสอบประวัติการเบิก/คืน\n3. อัปเดต Location หากวางผิดที่`;
  alert(msg);
}

// ========== TABS ==========
function showTab(tab) {
  const area = document.getElementById('main-content-area');
  if (!area) return;
  if (tab === 'all') {
    area.innerHTML = renderItemsTable(getFilteredItems());
  } else if (tab === 'variance') {
    const vars = state.items.filter(i => i.status !== 'MATCH');
    area.innerHTML = `
      <div class="mb-3 text-sm text-slate-400">ตรวจพบสินค้าที่มีผลต่าง (Variance) ทั้งหมด ${vars.length} รายการ</div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        ${vars.map(i => `
        <div class="bg-navy-800 rounded-xl p-4 border ${i.status==='DISCREPANCY'?'border-rose-700':'border-amber-700'}">
          <div class="flex justify-between items-start mb-2">
            <div>
              <div class="font-mono font-bold text-amber-400">${i.sku}</div>
              <div class="text-sm">${i.name}</div>
            </div>
            ${statusBadge(i.status)}
          </div>
          <div class="grid grid-cols-3 gap-2 text-center text-xs mb-3">
            <div><div class="text-slate-500">System</div><div class="font-bold">${i.systemOnHand}</div></div>
            <div><div class="text-slate-500">Physical</div><div class="font-bold">${i.physicalCount}</div></div>
            <div><div class="text-slate-500">Variance</div><div class="font-bold ${varianceColor(i.variance)}">${i.variance>0?'+':''}${i.variance}</div></div>
          </div>
          <div class="text-[11px] text-slate-400 mb-2">${i.notes || 'ยังไม่มีบันทึกเหตุผล'}</div>
          <div class="flex justify-between items-center">
            <span class="text-[10px] text-slate-500">${i.operator} · ${i.lastAudit}</span>
            <button onclick="openTaskDispatch('${i.sku}')" class="text-xs px-2 py-1 rounded bg-amber-700 hover:bg-amber-600">ส่งใบงาน Re-count</button>
          </div>
        </div>`).join('')}
      </div>`;
  } else if (tab === 'tasks') {
    area.innerHTML = `
      <div class="flex justify-between items-center mb-3">
        <div class="text-sm text-slate-400">รายการใบงานที่ส่งไปยังเครื่อง Mobile PDA (${state.tasks.length} รายการ)</div>
        <button onclick="openTaskDispatch()" class="text-xs px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500">+ สร้างใบงานใหม่</button>
      </div>
      <div class="space-y-2">
        ${state.tasks.map(t => `
        <div class="bg-navy-800 rounded-xl p-3 border border-navy-700 flex flex-wrap items-center justify-between gap-2">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-[10px] px-1.5 py-0.5 rounded ${t.priority==='HIGH'?'bg-rose-900 text-rose-300':'bg-amber-900 text-amber-300'}">${t.type} · ${t.priority}</span>
              <span class="font-mono font-semibold text-amber-400">${t.sku}</span>
            </div>
            <div class="text-sm mt-1">${t.name}</div>
            <div class="text-[11px] text-slate-400">${t.instruction}</div>
            <div class="text-[10px] text-slate-500 mt-1">เป้าหมาย: ${t.targetLoc} · ${t.assignedTo} · ${t.createdAt}</div>
          </div>
          <span class="text-xs px-2 py-1 rounded-full ${t.status==='PENDING'?'bg-amber-900/50 text-amber-300':'bg-emerald-900/50 text-emerald-300'}">${t.status}</span>
        </div>`).join('') || '<div class="text-center text-slate-500 py-8">ยังไม่มีใบงาน</div>'}
      </div>`;
  } else if (tab === 'logs') {
    area.innerHTML = `
      <div class="flex justify-between items-center mb-3">
        <div class="text-sm text-slate-400">ประวัติการสแกนและกระทบยอด Audit Logs (${state.auditLogs.length} บันทึก)</div>
        <button onclick="exportExcel()" class="text-xs px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600">Export Audit Logs</button>
      </div>
      <div class="overflow-x-auto rounded-xl border border-navy-700">
        <table class="w-full text-xs">
          <thead class="bg-navy-800 text-slate-400">
            <tr>
              <th class="px-2 py-2 text-left">Timestamp</th>
              <th class="px-2 py-2 text-left">Device</th>
              <th class="px-2 py-2 text-left">Action</th>
              <th class="px-2 py-2 text-left">SKU</th>
              <th class="px-2 py-2 text-left">Loc</th>
              <th class="px-2 py-2 text-right">Sys</th>
              <th class="px-2 py-2 text-right">Phy</th>
              <th class="px-2 py-2 text-right">Var</th>
              <th class="px-2 py-2 text-left">Operator</th>
            </tr>
          </thead>
          <tbody>
            ${state.auditLogs.map(l => `
            <tr class="border-t border-navy-800">
              <td class="px-2 py-1.5">${l.timestamp}</td>
              <td class="px-2 py-1.5"><span class="px-1.5 py-0.5 rounded bg-navy-700">${l.device}</span></td>
              <td class="px-2 py-1.5">${l.action}</td>
              <td class="px-2 py-1.5 font-mono text-amber-400">${l.sku}</td>
              <td class="px-2 py-1.5">${l.loc}</td>
              <td class="px-2 py-1.5 text-right">${l.system}</td>
              <td class="px-2 py-1.5 text-right">${l.physical}</td>
              <td class="px-2 py-1.5 text-right font-bold ${varianceColor(l.variance)}">${l.variance>0?'+':''}${l.variance}</td>
              <td class="px-2 py-1.5">${l.operator}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  }
}

// ========== MODALS ==========
function openModal(html) {
  document.getElementById('modal-content').innerHTML = html;
  document.getElementById('modal-overlay').classList.remove('hidden');
  document.getElementById('modal-overlay').classList.add('flex');
}

function closeModal(e) {
  if (e && e.target !== document.getElementById('modal-overlay')) return;
  document.getElementById('modal-overlay').classList.add('hidden');
  document.getElementById('modal-overlay').classList.remove('flex');
}

function openTaskDispatch(prefillSku = null) {
  // Prefer discrepancy items first in the list
  const sorted = [...state.items].sort((a, b) => {
    if (a.status !== 'MATCH' && b.status === 'MATCH') return -1;
    if (a.status === 'MATCH' && b.status !== 'MATCH') return 1;
    return (a.sku || '').localeCompare(b.sku || '');
  });
  const options = sorted.map(i => {
    const mark = i.status === 'MATCH' ? '🟢' : i.status === 'DISCREPANCY' ? '🔴' : '🟡';
    const sel = (prefillSku && i.sku === prefillSku) ? 'selected' : '';
    return `<option value="${i.sku}" ${sel}>${mark} ${i.sku} — ${i.name || ''}</option>`;
  }).join('');

  openModal(`
    <div class="p-5 max-h-[90vh] overflow-y-auto">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-bold">📤 สร้างใบงานส่งไปยังเครื่อง Mobile PDA</h3>
        <button onclick="closeModal()" class="text-slate-400 hover:text-white text-xl">×</button>
      </div>
      <div class="space-y-3">
        <div>
          <div class="flex items-center justify-between mb-1">
            <label class="text-xs text-slate-400">เลือกสินค้าเป้าหมาย (เลือกได้หลายรายการ)</label>
            <div class="flex gap-2">
              <button type="button" onclick="taskSelectAll(true)" class="text-[10px] px-2 py-0.5 rounded bg-navy-700 hover:bg-navy-600">เลือกทั้งหมด</button>
              <button type="button" onclick="taskSelectAll(false)" class="text-[10px] px-2 py-0.5 rounded bg-navy-700 hover:bg-navy-600">ยกเลิกทั้งหมด</button>
            </div>
          </div>
          <select id="task-sku" multiple size="8"
            class="w-full mt-1 bg-navy-800 border border-navy-700 rounded-lg px-3 py-2 text-sm font-mono">
            ${options}
          </select>
          <p class="text-[10px] text-slate-500 mt-1">กด Ctrl / Cmd ค้างไว้เพื่อเลือกหลายรายการ หรือใช้ปุ่มเลือกทั้งหมด</p>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs text-slate-400">ประเภทงาน (Task Type)</label>
            <select id="task-type" class="w-full mt-1 bg-navy-800 border border-navy-700 rounded-lg px-3 py-2 text-sm">
              <option value="RECOUNT">นับซ้ำ (Recount)</option>
              <option value="RELOCATE">ย้ายตำแหน่ง (Relocate)</option>
              <option value="RECHECK">ตรวจสอบซ้ำ (Recheck)</option>
            </select>
          </div>
          <div>
            <label class="text-xs text-slate-400">ระดับความเร่งด่วน (Priority)</label>
            <select id="task-priority" class="w-full mt-1 bg-navy-800 border border-navy-700 rounded-lg px-3 py-2 text-sm">
              <option value="HIGH">สูงที่สุด (High)</option>
              <option value="MEDIUM">ปานกลาง (Medium)</option>
              <option value="LOW">ต่ำ (Low)</option>
            </select>
          </div>
        </div>
        <div>
          <label class="text-xs text-slate-400">ข้อความสั่งการไปยังหน้าจอ PDA</label>
          <textarea id="task-instruction" rows="2" class="w-full mt-1 bg-navy-800 border border-navy-700 rounded-lg px-3 py-2 text-sm" placeholder="เช่น ตรวจสอบยอดขาด ด่วน"></textarea>
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <button onclick="closeModal()" class="px-4 py-2 rounded-lg bg-navy-700 text-sm">ยกเลิก</button>
          <button onclick="submitTask()" class="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-sm font-semibold">ส่งใบงานไปยัง PDA ทันที</button>
        </div>
      </div>
    </div>`);
}

function taskSelectAll(select) {
  const sel = document.getElementById('task-sku');
  if (!sel) return;
  for (let i = 0; i < sel.options.length; i++) {
    sel.options[i].selected = !!select;
  }
}

function submitTask() {
  const sel = document.getElementById('task-sku');
  if (!sel) {
    showToast('❌ ไม่พบรายการสินค้า', 'error');
    return;
  }
  const selected = Array.from(sel.selectedOptions).map(o => o.value);
  if (selected.length === 0) {
    showToast('⚠️ กรุณาเลือกสินค้าอย่างน้อย 1 รายการ', 'warn');
    return;
  }
  const type = document.getElementById('task-type').value;
  const priority = document.getElementById('task-priority').value;
  const baseInstruction = document.getElementById('task-instruction').value;

  let count = 0;
  selected.forEach((sku, idx) => {
    const item = state.items.find(i => i.sku === sku);
    const instruction = baseInstruction || `ตรวจสอบ ${sku}` + (item && item.variance ? ` (ผลต่าง ${item.variance})` : '');
    state.tasks.unshift({
      id: 'TASK-' + Date.now() + '-' + idx,
      type, priority, sku,
      name: item ? item.name : sku,
      targetLoc: item ? item.primaryLoc : '',
      zone: item ? item.zone : '',
      instruction,
      status: 'PENDING',
      assignedTo: 'Floor Checker',
      createdAt: new Date().toISOString().replace('T',' ').slice(0,19)
    });
    count++;
  });
  saveState(state);
  closeModal();
  showToast('✅ ส่งใบงาน ' + count + ' รายการไปยัง PDA สำเร็จ', 'success');
  render();
}

function openDailyReport() {
  const summary = calcSummary(state.items);
  const vars = state.items.filter(i => i.status !== 'MATCH');
  const netVar = vars.reduce((s,i) => s + i.variance, 0);
  openModal(`
    <div class="p-5">
      <div class="flex justify-between items-center mb-4">
        <div>
          <h3 class="text-lg font-bold">📊 รายงานสรุปผลการกระทบยอดและตรวจนับสินค้าประจำวัน</h3>
          <div class="text-xs text-slate-400">Daily Variance Reconciliation Report · OGA International Co., Ltd.</div>
        </div>
        <button onclick="closeModal()" class="text-slate-400 hover:text-white text-xl">×</button>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div class="bg-navy-800 rounded-xl p-3 text-center">
          <div class="text-[10px] text-slate-400">TOTAL SKUS CHECKED</div>
          <div class="text-xl font-bold">${summary.total}</div>
        </div>
        <div class="bg-navy-800 rounded-xl p-3 text-center">
          <div class="text-[10px] text-slate-400">SYSTEM VS PHYSICAL</div>
          <div class="text-xl font-bold">${summary.system} / ${summary.physical}</div>
        </div>
        <div class="bg-navy-800 rounded-xl p-3 text-center">
          <div class="text-[10px] text-slate-400">NET DISCREPANCY</div>
          <div class="text-xl font-bold ${varianceColor(netVar)}">${netVar>0?'+':''}${netVar} ชิ้น</div>
        </div>
        <div class="bg-navy-800 rounded-xl p-3 text-center">
          <div class="text-[10px] text-slate-400">ACCURACY RATE</div>
          <div class="text-xl font-bold ${summary.accuracy>=95?'text-emerald-400':'text-amber-400'}">${summary.accuracy}%</div>
        </div>
      </div>
      <div class="text-sm font-semibold mb-2 text-rose-300">⚠️ รายละเอียดรายการที่มีผลต่าง</div>
      <div class="overflow-x-auto rounded-xl border border-navy-700 mb-4">
        <table class="w-full text-xs">
          <thead class="bg-navy-800 text-slate-400">
            <tr><th class="px-2 py-2 text-left">SKU</th><th class="px-2 py-2 text-left">Product</th><th class="px-2 py-2 text-left">Loc</th><th class="px-2 py-2 text-right">Sys</th><th class="px-2 py-2 text-right">Phy</th><th class="px-2 py-2 text-right">Var</th><th class="px-2 py-2 text-left">หมายเหตุ</th></tr>
          </thead>
          <tbody>
            ${vars.map(i => `
            <tr class="border-t border-navy-800">
              <td class="px-2 py-1.5 font-mono text-amber-400">${i.sku}</td>
              <td class="px-2 py-1.5">${i.name}</td>
              <td class="px-2 py-1.5">${i.primaryLoc}</td>
              <td class="px-2 py-1.5 text-right">${i.systemOnHand}</td>
              <td class="px-2 py-1.5 text-right">${i.physicalCount}</td>
              <td class="px-2 py-1.5 text-right font-bold ${varianceColor(i.variance)}">${i.variance>0?'+':''}${i.variance}</td>
              <td class="px-2 py-1.5 text-slate-400">${i.notes||'-'}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
      <div class="bg-navy-800 rounded-xl p-3 text-xs text-slate-300 mb-4">
        <div class="font-semibold mb-1">ข้อเสนอแนะและมาตรการแก้ไขสำหรับหัวหน้าคลังสินค้า (SUPERVISOR RECOMMENDATIONS):</div>
        <ol class="list-decimal list-inside space-y-1">
          ${vars.map((i,idx) => `<li>SKU ${i.sku}: ${i.notes || 'ตรวจสอบและส่งใบงาน Re-count'}</li>`).join('')}
        </ol>
      </div>
      <div class="flex justify-end gap-2">
        <button onclick="exportExcel()" class="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-sm">Export Excel</button>
        <button onclick="window.print()" class="px-4 py-2 rounded-lg bg-navy-700 text-sm">Print</button>
        <button onclick="closeModal()" class="px-4 py-2 rounded-lg bg-navy-700 text-sm">ปิดหน้าต่าง</button>
      </div>
    </div>`);
}

function openManual() {
  openModal(`
    <div class="p-5 max-h-[80vh] overflow-y-auto">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-bold">📖 คู่มือการใช้งานระบบ OGA Item Check Assistant (Dual-Device)</h3>
        <button onclick="closeModal()" class="text-slate-400 hover:text-white text-xl">×</button>
      </div>
      <div class="space-y-4 text-sm">
        <div class="bg-navy-800 rounded-xl p-4">
          <h4 class="font-semibold text-amber-400 mb-2">1. โหมด Mobile PDA (Floor Checker)</h4>
          <ul class="list-disc list-inside space-y-1 text-slate-300">
            <li>ใช้ปุ่ม SCAN หรือยิงเลเซอร์เพื่อสแกนบาร์โค้ด/RFID</li>
            <li>ระบบจะแสดงสถานะ [MATCH] / [DISCREPANCY] / [MISPLACED] ทันที</li>
            <li>ปรับจำนวนด้วยปุ่ม ±1 / ±5 หรือพิมพ์ตรงๆ</li>
            <li>กด "บันทึกผลต่างทันที" เพื่อแจ้ง Supervisor และสร้างใบงานอัตโนมัติ</li>
            <li>รองรับ Offline: ข้อมูลเก็บในเครื่อง แล้ว sync เมื่อมีสัญญาณ</li>
          </ul>
        </div>
        <div class="bg-navy-800 rounded-xl p-4">
          <h4 class="font-semibold text-amber-400 mb-2">2. โหมด PC Desktop (Supervisor)</h4>
          <ul class="list-disc list-inside space-y-1 text-slate-300">
            <li>ดูภาพรวม KPI, ตารางสินค้า, กรองตามโซน/สถานะ</li>
            <li>แท็บ Variance สำหรับจัดการรายการที่มีปัญหา</li>
            <li>สร้างใบงาน (Task Dispatch) ส่งไปยัง PDA ได้ทันที</li>
            <li>Export Excel / CSV / ดู Daily Report</li>
          </ul>
        </div>
        <div class="bg-navy-800 rounded-xl p-4">
          <h4 class="font-semibold text-amber-400 mb-2">3. Google Sheets Integration</h4>
          <p class="text-slate-300 mb-2">เพื่อเชื่อมต่อฐานข้อมูลจริง:</p>
          <ol class="list-decimal list-inside space-y-1 text-slate-400 text-xs">
            <li>สร้าง Google Sheet และแชร์เป็น "Anyone with the link can view" หรือใช้ Service Account</li>
            <li>เปิด Google Sheets API ใน Google Cloud Console</li>
            <li>ใส่ Spreadsheet ID และ API Key ในไฟล์ <code>src/data.js</code> (SHEETS_CONFIG)</li>
            <li>ตั้ง enabled: true แล้วเรียกฟังก์ชัน fetchFromGoogleSheets()</li>
          </ol>
        </div>
        <div class="bg-navy-800 rounded-xl p-4">
          <h4 class="font-semibold text-amber-400 mb-2">4. Offline & Sync</h4>
          <p class="text-slate-300">ข้อมูลทั้งหมดถูกบันทึกใน localStorage ของเบราว์เซอร์/เครื่อง PDA อัตโนมัติ เมื่อกลับมามี Wi-Fi ระบบจะพร้อมซิงค์ (ในเวอร์ชันนี้ใช้ local เป็นหลัก สามารถขยายเป็น IndexedDB + Background Sync ได้)</p>
        </div>
      </div>
      <div class="mt-4 text-center">
        <button onclick="closeModal()" class="px-6 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 font-semibold">ปิดคู่มือ</button>
      </div>
    </div>`);
}

function openItemDetail(sku) {
  const item = state.items.find(i => i.sku === sku);
  if (!item) return;
  openModal(`
    <div class="p-5">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-bold font-mono text-amber-400">${item.sku}</h3>
        <button onclick="closeModal()" class="text-slate-400 hover:text-white text-xl">×</button>
      </div>
      <div class="space-y-2 text-sm">
        <div><span class="text-slate-400">ชื่อสินค้า:</span> ${item.name}</div>
        <div><span class="text-slate-400">หมวดหมู่:</span> ${item.category}</div>
        <div><span class="text-slate-400">Barcode:</span> ${item.barcode}</div>
        <div><span class="text-slate-400">Serial:</span> ${item.serial}</div>
        <div><span class="text-slate-400">Primary Loc:</span> ${item.primaryLoc} · Actual: ${item.actualLoc}</div>
        <div><span class="text-slate-400">System / Physical / Variance:</span> ${item.systemOnHand} / ${item.physicalCount} / <span class="${varianceColor(item.variance)}">${item.variance}</span></div>
        <div><span class="text-slate-400">สถานะ:</span> ${statusBadge(item.status)}</div>
        <div><span class="text-slate-400">Last Audit:</span> ${item.lastAudit} โดย ${item.operator}</div>
        <div><span class="text-slate-400">หมายเหตุ:</span> ${item.notes || '-'}</div>
      </div>
      <div class="mt-4 flex gap-2">
        <button onclick="selectSku('${item.sku}'); setMode('mobile'); closeModal();" class="px-4 py-2 rounded-lg bg-amber-600 text-sm">เปิดในโหมด PDA</button>
        <button onclick="openTaskDispatch('${item.sku}')" class="px-4 py-2 rounded-lg bg-navy-700 text-sm">สร้างใบงาน</button>
      </div>
    </div>`);
}

// ========== EXPORT ==========
function exportExcel() {
  exportToExcel(state.items, state.auditLogs);
}

// ========== INIT ==========
window.addEventListener('online', () => {
  showToast('กลับมาออนไลน์แล้ว – กำลังซิงค์...', 'success');
  tryAutoSync();
  if (typeof render === 'function') render();
});
window.addEventListener('offline', () => showToast('โหมด Offline – ข้อมูลจะถูกเก็บในเครื่อง', 'warn'));

document.addEventListener('DOMContentLoaded', () => {
  selectedSku = 'OGA-RF-102';
  if (localStorage.getItem('oga_high_contrast') === '1') {
    document.body.classList.add('high-contrast');
  }
  setMode('desktop');
  // Barcode wedge support
  let scanBuffer = '';
  let scanTimer = null;
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
    if (e.key === 'Enter' && scanBuffer.length > 2) {
      handleScan(scanBuffer);
      scanBuffer = '';
      e.preventDefault();
      return;
    }
    if (e.key.length === 1) {
      scanBuffer += e.key;
      clearTimeout(scanTimer);
      scanTimer = setTimeout(() => { scanBuffer = ''; }, 80);
    }
  });
});

// Make functions global
window.setMode = setMode;
window.handleScan = handleScan;
window.adjustQty = adjustQty;
window.setPhysical = setPhysical;
window.setNote = setNote;
window.confirmMatch = confirmMatch;
window.flagDiscrepancy = flagDiscrepancy;
window.rescan = rescan;
window.askCopilot = askCopilot;
window.selectSku = selectSku;
window.showTab = showTab;
window.openTaskDispatch = openTaskDispatch;
window.submitTask = submitTask;
window.taskSelectAll = taskSelectAll;
window.openDailyReport = openDailyReport;
window.openManual = openManual;
window.openItemDetail = openItemDetail;
window.exportExcel = exportExcel;
window.closeModal = closeModal;
window.currentFilter = currentFilter;

// ========== GOOGLE SHEETS & APPS SCRIPT INTEGRATION ==========

function openSheetsSettings() {
  SHEETS_CONFIG = loadSheetsConfig();
  openModal(`
    <div class="p-5 md:p-6">
      <div class="flex justify-between items-center mb-5">
        <div>
          <h3 class="text-xl font-bold flex items-center gap-2">
            <span class="text-2xl">📊</span> Google Sheet & Script
          </h3>
          <p class="text-xs text-slate-400 mt-1">เชื่อมต่อ Google Sheet & Apps Script สำหรับซิงค์ข้อมูลสินค้าและ Audit Log</p>
        </div>
        <button onclick="closeModal()" class="text-slate-400 hover:text-white text-2xl leading-none">×</button>
      </div>

      <div class="bg-navy-800/80 border border-navy-700 rounded-2xl p-5 space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-1.5">
            <span class="text-blue-400">🔗</span> Web App URL
          </label>
          <input id="cfg-webapp" type="text" 
            value="${SHEETS_CONFIG.webAppUrl || ''}"
            placeholder="https://script.google.com/macros/s/XXXX/exec"
            class="w-full bg-navy-950 border border-navy-600 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-300 mb-1.5">
            <span class="text-emerald-400">📄</span> Spreadsheet ID
          </label>
          <input id="cfg-sheetid" type="text" 
            value="${SHEETS_CONFIG.spreadsheetId || ''}"
            placeholder="1IVnrFrIhKWyZiUml_5vXSsFpjhGo_A1KOfFP4X9229E"
            class="w-full bg-navy-950 border border-navy-600 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
        </div>

        <div class="flex flex-wrap gap-2 pt-2">
          <button onclick="saveSheetsSettings()" 
            class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold shadow-lg shadow-orange-900/30">
            💾 บันทึกการตั้งค่า
          </button>
          <button onclick="pingSheets()" 
            class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-lg shadow-emerald-900/30">
            🟢 ทดสอบเชื่อมต่อ (Ping)
          </button>
          <button onclick="setupSheetsStructure()" 
            class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy-700 hover:bg-navy-600 border border-navy-500 text-sm font-medium">
            📋 สร้าง/ตรวจโครงสร้างตาราง
          </button>
          <button onclick="pullAllFromSheets()" 
            class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-900/30">
            ⬇️ ดึงข้อมูลทั้งหมด
          </button>
        </div>
      </div>

      <div id="sheets-status" class="mt-4 p-4 rounded-xl bg-navy-900 border border-navy-700 text-sm hidden"></div>

      <div class="mt-5 p-4 rounded-xl bg-amber-950/40 border border-amber-800/50">
        <div class="text-xs font-semibold text-amber-400 mb-2">URL ที่ตั้งค่าเริ่มต้น (จากระบบของคุณ)</div>
        <div class="text-[11px] text-slate-400 space-y-1 font-mono">
          <div><span class="text-slate-500">Sheet:</span> ${DEFAULT_SHEETS.sheetId}</div>
          <div><span class="text-slate-500">Script:</span> ${DEFAULT_SHEETS.scriptId}</div>
        </div>
        <p class="text-[11px] text-slate-500 mt-2 leading-relaxed">
          หาก Refresh แล้วยังไม่เชื่อมต่อ กด <strong class="text-orange-400">บันทึกการตั้งค่า</strong> แล้ว <strong class="text-emerald-400">ดึงข้อมูลทั้งหมด</strong> อีกครั้ง — ระบบจะจำ URL ไว้ตลอดอัตโนมัติ
        </p>
      </div>

      <div class="mt-4 text-[11px] text-slate-500 leading-relaxed">
        <strong class="text-slate-400">วิธี Deploy Apps Script:</strong><br>
        1. เปิด Google Sheet → Extensions → Apps Script<br>
        2. วางโค้ดจากไฟล์ <code class="text-amber-400">google-apps-script/Code.gs</code><br>
        3. Deploy → New deployment → Type: Web app → Execute as: Me → Who has access: Anyone<br>
        4. คัดลอก Web App URL มาใส่ด้านบน
      </div>
    </div>
  `);
}

function saveSheetsSettings() {
  const webAppUrl = document.getElementById('cfg-webapp').value.trim();
  const spreadsheetId = document.getElementById('cfg-sheetid').value.trim();
  if (!webAppUrl) {
    showToast('กรุณากรอก Web App URL', 'error');
    return;
  }
  SHEETS_CONFIG.webAppUrl = webAppUrl;
  SHEETS_CONFIG.spreadsheetId = spreadsheetId;
  SHEETS_CONFIG.enabled = true;
  saveSheetsConfig(SHEETS_CONFIG);
  showToast('✅ บันทึกการตั้งค่าเรียบร้อย', 'success');
  updateSheetsStatus('ตั้งค่าถูกบันทึกแล้ว · พร้อมทดสอบเชื่อมต่อ', 'success');
}

async function callSheetsAPI(action, payload = {}) {
  const cfg = loadSheetsConfig();
  if (!cfg.webAppUrl) {
    throw new Error('ยังไม่ได้ตั้งค่า Web App URL');
  }
  const body = {
    action,
    spreadsheetId: cfg.spreadsheetId || '',
    ...payload
  };
  const res = await fetch(cfg.webAppUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    throw new Error('HTTP ' + res.status);
  }
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data;
}

async function pingSheets() {
  updateSheetsStatus('กำลังทดสอบเชื่อมต่อ...', 'loading');
  try {
    const result = await callSheetsAPI('ping');
    SHEETS_CONFIG.lastPing = new Date().toISOString();
    SHEETS_CONFIG.enabled = true;
    saveSheetsConfig(SHEETS_CONFIG);
    updateSheetsStatus('🟢 เชื่อมต่อสำเร็จ!<br><span class="text-xs text-slate-400">Server time: ' + (result.serverTime || '-') + ' · Version: ' + (result.version || '1.0') + '</span>', 'success');
    showToast('เชื่อมต่อ Google Apps Script สำเร็จ', 'success');
  } catch (e) {
    updateSheetsStatus('🔴 เชื่อมต่อไม่สำเร็จ: ' + e.message + '<br><span class="text-xs text-slate-400">ตรวจสอบ Web App URL และการ Deploy (Who has access = Anyone)</span>', 'error');
    showToast('ทดสอบเชื่อมต่อล้มเหลว', 'error');
  }
}

async function setupSheetsStructure() {
  updateSheetsStatus('กำลังสร้าง/ตรวจสอบโครงสร้างตาราง...', 'loading');
  try {
    const result = await callSheetsAPI('setup');
    updateSheetsStatus('✅ โครงสร้างตารางพร้อมใช้งาน<br><span class="text-xs text-slate-400">' + (result.message || 'Sheets: Items, AuditLogs, Tasks ถูกสร้างหรือตรวจแล้ว') + '</span>', 'success');
    showToast('สร้างโครงสร้างตารางสำเร็จ', 'success');
  } catch (e) {
    updateSheetsStatus('🔴 เกิดข้อผิดพลาด: ' + e.message, 'error');
    showToast('สร้างโครงสร้างล้มเหลว', 'error');
  }
}

async function pullAllFromSheets() {
  updateSheetsStatus('กำลังดึงข้อมูลทั้งหมดจาก Google Sheet...', 'loading');
  try {
    const result = await callSheetsAPI('getAll');
    if (result.items && Array.isArray(result.items)) {
      state.items = result.items.map(mapSheetRowToItem);
      if (result.tasks) state.tasks = result.tasks;
      if (result.auditLogs) state.auditLogs = result.auditLogs;
      saveState(state);
      SHEETS_CONFIG.lastSync = new Date().toISOString();
      saveSheetsConfig(SHEETS_CONFIG);
      updateSheetsStatus('✅ ดึงข้อมูลสำเร็จ · สินค้า ' + state.items.length + ' รายการ<br><span class="text-xs text-slate-400">Sync ล่าสุด: ' + new Date().toLocaleString('th-TH') + '</span>', 'success');
      showToast('ดึงข้อมูล ' + state.items.length + ' รายการสำเร็จ', 'success');
      render();
    } else {
      updateSheetsStatus('⚠️ ไม่พบข้อมูลสินค้าใน Sheet (หรือโครงสร้างยังไม่ถูกต้อง)', 'warn');
    }
  } catch (e) {
    updateSheetsStatus('🔴 ดึงข้อมูลล้มเหลว: ' + e.message, 'error');
    showToast('ดึงข้อมูลล้มเหลว', 'error');
  }
}

function mapSheetRowToItem(row) {
  if (Array.isArray(row)) {
    return {
      sku: row[0] || '',
      barcode: row[1] || '',
      name: row[2] || '',
      category: row[3] || '',
      serial: row[4] || '',
      primaryLoc: row[5] || '',
      actualLoc: row[6] || row[5] || '',
      zone: row[7] || '',
      systemOnHand: parseInt(row[8]) || 0,
      reserved: parseInt(row[9]) || 0,
      available: parseInt(row[10]) || 0,
      physicalCount: parseInt(row[11]) || 0,
      variance: parseInt(row[12]) || 0,
      status: row[13] || 'MATCH',
      lastAudit: row[14] || '',
      operator: row[15] || '',
      notes: row[16] || ''
    };
  }
  // Support both old mock headers and real Sheet headers (itemCode, systemQty, etc.)
  const sku = row.sku || row.SKU || row.itemCode || row.ItemCode || '';
  const systemOnHand = parseInt(row.systemOnHand || row.SystemOnHand || row.systemQty || row.SystemQty || 0) || 0;
  const physicalCount = parseInt(row.physicalCount || row.PhysicalCount || row.physicalQty || row.PhysicalQty || 0) || 0;
  let variance = parseInt(row.variance || row.Variance || 0);
  if (isNaN(variance)) variance = physicalCount - systemOnHand;
  // Always derive status from variance (don't trust Sheet status if inconsistent)
  let status = 'MATCH';
  const primaryLoc = row.primaryLoc || row.PrimaryLoc || '';
  const actualLoc = row.actualLoc || row.ActualLoc || primaryLoc || '';
  if (primaryLoc && actualLoc && primaryLoc !== actualLoc && variance !== 0) {
    status = 'MISPLACED';
  } else if (variance !== 0) {
    status = 'DISCREPANCY';
  }

  return {
    sku: sku,
    barcode: row.barcode || row.Barcode || '',
    name: row.name || row.ProductName || row.Name || '',
    category: row.category || row.Category || '',
    serial: row.serial || row.Serial || row.serialNo || '',
    primaryLoc: primaryLoc,
    actualLoc: actualLoc,
    zone: row.zone || row.Zone || '',
    systemOnHand: systemOnHand,
    reserved: parseInt(row.reserved || row.Reserved || row.reservedQty || 0) || 0,
    available: parseInt(row.available || row.Available || row.availableQty || 0) || 0,
    physicalCount: physicalCount,
    variance: variance,
    status: status,
    lastAudit: row.lastAudit || row.LastAudit || '',
    operator: row.operator || row.Operator || '',
    notes: row.notes || row.Notes || ''
  };
}

function updateSheetsStatus(html, type) {
  const el = document.getElementById('sheets-status');
  if (!el) return;
  el.classList.remove('hidden');
  const colors = {
    success: 'border-emerald-700 bg-emerald-950/40 text-emerald-200',
    error: 'border-rose-700 bg-rose-950/40 text-rose-200',
    warn: 'border-amber-700 bg-amber-950/40 text-amber-200',
    loading: 'border-blue-700 bg-blue-950/40 text-blue-200'
  };
  el.className = 'mt-4 p-4 rounded-xl border text-sm ' + (colors[type] || colors.loading);
  el.innerHTML = html;
}

window.openSheetsSettings = openSheetsSettings;
window.saveSheetsSettings = saveSheetsSettings;
window.pingSheets = pingSheets;
window.setupSheetsStructure = setupSheetsStructure;
window.pullAllFromSheets = pullAllFromSheets;

// Additional globals for new features
window.focusScanInput = focusScanInput;
window.toggleHighContrast = toggleHighContrast;
window.showPdaTasks = showPdaTasks;
window.exportDiscrepancyReport = exportDiscrepancyReport;
window.exportDiscrepancyCSV = exportDiscrepancyCSV;
window.exportCSV = exportCSV;
window.tryAutoSync = tryAutoSync;
window.getConnectionStatus = getConnectionStatus;
