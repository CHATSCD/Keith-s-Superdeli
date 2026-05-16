// Module 4 — Coordinator Dashboard (?view=coordinator)
// Depends on: sheetsApi.js, stores.js

async function coordinatorInit(container, serviceAccount) {
  container.innerHTML = buildCoordinatorShell();
  await loadCoordinatorData(container, serviceAccount);
}

function buildCoordinatorShell() {
  return `
    <div class="card">
      <div class="card-title" style="font-size:18px">Chain-Wide Operations Dashboard</div>
      <p style="font-size:13px;color:var(--muted);margin-bottom:0">
        Showing all stores. Data pulled live from each store's Google Sheet.
      </p>
    </div>

    <div class="filter-bar card" style="margin-bottom:12px">
      <div class="form-row">
        <label>Filter by Status</label>
        <select id="filter-status">
          <option value="all">All</option>
          <option value="Overdue">Overdue</option>
          <option value="Pending">Pending</option>
          <option value="Clear">Clear</option>
        </select>
      </div>
      <div class="form-row">
        <label>Min Score %</label>
        <input type="number" id="filter-score" placeholder="0" min="0" max="100">
      </div>
      <div class="form-row">
        <label>Search Store</label>
        <input type="text" id="filter-search" placeholder="# or city">
      </div>
      <div style="display:flex;align-items:flex-end">
        <button class="btn btn-primary btn-sm" id="apply-filters">Apply</button>
      </div>
    </div>

    <div id="coord-alerts"></div>

    <div class="card">
      <div class="card-title">
        Inspection Summary
        <button class="btn btn-outline btn-sm" id="export-coord-pdf">Export Report PDF</button>
      </div>
      <div class="table-wrap" id="coord-table-wrap">
        <div class="loading-state"><div class="spinner"></div><p>Loading store data...</p></div>
      </div>
    </div>

    <div class="card" style="margin-top:12px">
      <div class="card-title">Food Cost Summary</div>
      <div class="table-wrap" id="food-cost-table-wrap">
        <div class="loading-state"><div class="spinner"></div><p>Loading food cost data...</p></div>
      </div>
    </div>
  `;
}

let coordAllRows = [];

async function loadCoordinatorData(container, serviceAccount) {
  const storeEntries = Object.entries(STORES).filter(([, s]) => s.sheetId);

  if (storeEntries.length === 0) {
    document.getElementById('coord-table-wrap').innerHTML = `
      <div class="banner banner-warn">
        No Sheet IDs configured yet. Run migrate.js and populate stores.js to enable the coordinator dashboard.
      </div>
    `;
    document.getElementById('food-cost-table-wrap').innerHTML = '';
    return;
  }

  const rows = await Promise.allSettled(
    storeEntries.map(async ([num, store]) => {
      try {
        const data = await sheetsGet(serviceAccount, store.sheetId, 'Inspections!A2:L1000');
        const values = data.values || [];
        if (values.length === 0) {
          return { storeNum: num, storeName: store.name, lastDate: null, score: null, nos: null, followup: null, status: 'No Data' };
        }
        // Last row is most recent inspection
        const last = values[values.length - 1];
        return {
          storeNum:  num,
          storeName: store.name,
          lastDate:  last[2] || '',
          score:     last[5] || '',
          nos:       last[7] || '0',
          followup:  last[10] || '',
          status:    last[11] || '',
        };
      } catch (_) {
        return { storeNum: num, storeName: store.name, lastDate: null, score: null, nos: null, followup: null, status: 'Error' };
      }
    })
  );

  coordAllRows = rows.map(r => r.value || r.reason);
  renderCoordTable(container, coordAllRows);
  renderAlerts(container, coordAllRows);
  await loadFoodCostSummary(container, storeEntries, serviceAccount);

  document.getElementById('apply-filters')?.addEventListener('click', () => {
    const status = document.getElementById('filter-status')?.value || 'all';
    const minScore = parseInt(document.getElementById('filter-score')?.value || '0') || 0;
    const search = (document.getElementById('filter-search')?.value || '').toLowerCase();

    const filtered = coordAllRows.filter(row => {
      if (status !== 'all' && row.status !== status) return false;
      if (row.score) {
        const pct = parseInt(row.score);
        if (!isNaN(pct) && pct < minScore) return false;
      }
      if (search) {
        const match = String(row.storeNum).includes(search) ||
          (row.storeName || '').toLowerCase().includes(search);
        if (!match) return false;
      }
      return true;
    });
    renderCoordTable(container, filtered);
  });

  document.getElementById('export-coord-pdf')?.addEventListener('click', () => {
    exportCoordPDF(coordAllRows);
  });
}

function computeStatus(followup) {
  if (!followup) return 'Clear';
  const fu = new Date(followup);
  if (isNaN(fu.getTime())) return 'Clear';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = (fu - today) / (1000 * 60 * 60 * 24);
  if (diff < 0) return 'Overdue';
  if (diff <= 3) return 'Pending';
  return 'Clear';
}

function renderCoordTable(container, rows) {
  const wrap = document.getElementById('coord-table-wrap');
  if (!wrap) return;

  if (!rows || rows.length === 0) {
    wrap.innerHTML = '<div class="empty-state"><p>No stores match the current filters.</p></div>';
    return;
  }

  const rowsHTML = rows.map(row => {
    const status = row.status || computeStatus(row.followup);
    const cls = status === 'Overdue' ? 'row-overdue' : '';
    const statusCls = status === 'Overdue' ? 'status-overdue' : status === 'Pending' ? 'status-pending' : 'status-clear';
    return `
      <tr class="${cls}">
        <td>${row.storeNum}</td>
        <td>${row.storeName || '--'}</td>
        <td>${row.lastDate || '--'}</td>
        <td>${row.score || '--'}</td>
        <td>${row.nos || '--'}</td>
        <td>${row.followup || '--'}</td>
        <td class="${statusCls}">${status}</td>
      </tr>
    `;
  }).join('');

  wrap.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>Store #</th>
          <th>City</th>
          <th>Last Inspection</th>
          <th>Score %</th>
          <th>NOs</th>
          <th>Follow-up Due</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>${rowsHTML}</tbody>
    </table>
  `;
}

function renderAlerts(container, rows) {
  const alertsEl = document.getElementById('coord-alerts');
  if (!alertsEl) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const urgent = rows.filter(row => {
    if (!row.followup) return false;
    const fu = new Date(row.followup);
    if (isNaN(fu.getTime())) return false;
    const diff = (fu - today) / (1000 * 60 * 60 * 24);
    return diff <= 3;
  });

  if (urgent.length === 0) {
    alertsEl.innerHTML = '';
    return;
  }

  const items = urgent.map(r => {
    const fu = new Date(r.followup);
    const diff = Math.round((fu - today) / (1000 * 60 * 60 * 24));
    const label = diff < 0 ? `${Math.abs(diff)} days overdue` : diff === 0 ? 'Due TODAY' : `Due in ${diff} day(s)`;
    return `<li>Store #${r.storeNum} ${r.storeName} &mdash; ${label}</li>`;
  }).join('');

  alertsEl.innerHTML = `
    <div class="banner banner-danger">
      <strong>Follow-up Alerts (${urgent.length} store${urgent.length > 1 ? 's' : ''})</strong>
      <ul style="margin-top:8px;padding-left:20px">${items}</ul>
    </div>
  `;
}

async function loadFoodCostSummary(container, storeEntries, serviceAccount) {
  const wrap = document.getElementById('food-cost-table-wrap');
  if (!wrap) return;

  const results = await Promise.allSettled(
    storeEntries.slice(0, 20).map(async ([num, store]) => { // limit to first 20 for perf
      try {
        const data = await sheetsGet(serviceAccount, store.sheetId, 'Deli Pro!A1:Z5');
        return { storeNum: num, storeName: store.name, data: data.values || [] };
      } catch (_) {
        return { storeNum: num, storeName: store.name, data: [] };
      }
    })
  );

  const rows = results
    .map(r => r.value)
    .filter(Boolean)
    .map(r => {
      // Extract food cost % from Deli Pro tab — adjust column indices to match your actual sheet
      const val = r.data[1]?.[1] || '--';
      return { storeNum: r.storeNum, storeName: r.storeName, foodCost: val };
    });

  if (rows.length === 0) {
    wrap.innerHTML = '<div class="empty-state"><p>No food cost data available.</p></div>';
    return;
  }

  const rowsHTML = rows.map(r => `
    <tr>
      <td>${r.storeNum}</td>
      <td>${r.storeName}</td>
      <td>${r.foodCost}</td>
    </tr>
  `).join('');

  wrap.innerHTML = `
    <table class="data-table">
      <thead>
        <tr><th>Store #</th><th>City</th><th>Food Cost</th></tr>
      </thead>
      <tbody>${rowsHTML}</tbody>
    </table>
    <p style="font-size:11px;color:var(--muted);margin-top:8px">
      Showing first 20 stores. Food cost column location may need adjustment to match your Deli Pro tab structure.
    </p>
  `;
}

function safeText(str) {
  return String(str || '').replace(/[^\x00-\xFF]/g, '').trim();
}

function exportCoordPDF(rows) {
  if (typeof window.jspdf === 'undefined') {
    alert('jsPDF not loaded. Check your internet connection and reload.');
    return;
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'letter', orientation: 'landscape' });

  let y = 40;
  const L = 40;
  const W = 732;

  doc.setFillColor(26, 39, 68);
  doc.rect(L, y, W, 50, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(safeText("Keith's Superdeli"), L + 12, y + 20);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(safeText(`Chain-Wide Inspection Report - Generated ${new Date().toLocaleDateString()}`), L + 12, y + 38);
  y += 60;

  // Table headers
  const cols = [60, 130, 100, 70, 50, 100, 80];
  const headers = ['Store #', 'City', 'Last Inspection', 'Score %', 'NOs', 'Follow-up Due', 'Status'];
  doc.setFillColor(26, 39, 68);
  doc.rect(L, y, W, 18, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  let x = L + 4;
  headers.forEach((h, i) => { doc.text(safeText(h), x, y + 13); x += cols[i]; });
  y += 20;

  rows.forEach((row, ri) => {
    if (y > 520) { doc.addPage(); y = 40; }
    const status = row.status || computeStatus(row.followup);
    if (status === 'Overdue') {
      doc.setFillColor(255, 240, 240);
      doc.rect(L, y, W, 16, 'F');
    } else if (ri % 2 === 0) {
      doc.setFillColor(248, 248, 246);
      doc.rect(L, y, W, 16, 'F');
    }

    const vals = [
      row.storeNum, row.storeName, row.lastDate || '--',
      row.score || '--', row.nos || '--', row.followup || '--', status,
    ];
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    x = L + 4;
    vals.forEach((v, i) => {
      const isStatus = i === 6;
      if (isStatus) {
        doc.setTextColor(
          status === 'Overdue' ? 220 : status === 'Pending' ? 217 : 22,
          status === 'Overdue' ? 38  : status === 'Pending' ? 119 : 163,
          status === 'Overdue' ? 38  : status === 'Pending' ? 6   : 74
        );
        doc.setFont('helvetica', 'bold');
      } else {
        doc.setTextColor(26, 26, 26);
        doc.setFont('helvetica', 'normal');
      }
      doc.text(safeText(v), x, y + 11);
      x += cols[i];
    });
    y += 16;
  });

  doc.save(safeText(`Coordinator_Report_${new Date().toISOString().split('T')[0]}.pdf`));
}
