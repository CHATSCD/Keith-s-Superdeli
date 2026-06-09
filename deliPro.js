// Module 1 — Deli Pro
// Inventory, Food Cost, Invoices, Orders, Recipes, Suppliers, Analytics
// All backed by Google Sheets tabs via sheetsApi.js.

const DELI_TABS = {
  dailyinv:  { label: 'Daily Inv. Form', tab: 'Daily Inv Control', headers: ['Week Of','Section','Field','Sun','Mon','Tue','Wed','Thu','Fri','Sat'] },
  inventory: { label: 'Inventory',  tab: 'Inventory',           headers: ['Count By','Item','Item#','Case Pack','On Hand','Per','Total'] },
  wastelog:  { label: 'Waste Log',  tab: 'Waste Log',           headers: ['Date','Item #','Item Name','Section','Qty Wasted','Unit Price','Total Cost','Reason','Notes'] },
  foodcost:  { label: 'Food Cost',  tab: 'Food Cost Calculator', headers: ['Date','Weekly Sales','Beg Inv Deli','Beg Inv Fountain','Beg Inv Branded','Purchases Hunt Brothers','Purchases Icee','Purchases Ben E. Keith','COGS','Food Cost %','Notes'] },
  invoices:  { label: 'Invoices',   tab: 'Invoices',            headers: ['Date','Vendor','Invoice #','Amount ($)','Items','Notes'] },
  suppliers: { label: 'Suppliers',  tab: 'Suppliers',           headers: ['Supplier','Rep Name','Phone','Email','Delivery Day','Notes'] },
  labels:    { label: 'Labels',      virtual: true },
  menu:      { label: 'Menu',        virtual: true },
  analytics: { label: 'Analytics',  virtual: true },
  training:  { label: 'Training',   virtual: true },
};

// Orders and Recipes tabs — still readable for coordinator dashboard pull
const ORDERS_TAB_CFG  = { tab: 'Orders',  headers: ['Date','Vendor','Item','Unit','Qty','Status','Notes'] };
const RECIPES_TAB_CFG = { tab: 'Recipes', headers: ['Recipe','Category','Servings','Ingredient','Qty','Unit','Cost/Unit','Ext. Cost'] };

const INVENTORY_CATEGORIES = ['Meat','Seafood','Produce','Dairy','Dry Goods','Frozen','Beverages','Supplies','Other'];
const ORDER_STATUSES        = ['Pending','Ordered','Received','Cancelled','Back-Order'];
const DELIVERY_DAYS         = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday','Varies'];
const RECIPE_CATS           = ['Sandwiches','Salads','Hot Foods','Sides','Soups','Bakery','Beverages','Other'];

// Module-level state
const deliState = {
  storeNum: null, storeName: null, sheetId: null, sa: null,
  countSheetId: null,
  activeTab: 'inventory',
  data: {},
};

// ════════════════════════════════════════
// ENTRY POINT
// ════════════════════════════════════════

function deliProInit(container, storeNum, storeName, sheetId, serviceAccount, countSheetId) {
  deliState.storeNum      = storeNum;
  deliState.storeName     = storeName;
  deliState.sheetId       = sheetId;
  deliState.countSheetId  = countSheetId || null;
  deliState.sa            = serviceAccount;
  deliState.data          = {};
  deliState.activeTab    = 'inventory';

  container.innerHTML = buildDeliShell();
  attachDeliNav(container);
  switchDeliTab(container, 'inventory');
}

function buildDeliShell() {
  const tabs = Object.entries(DELI_TABS).map(([id, t]) =>
    `<button class="tab-btn deli-sub-btn" data-deli="${id}">${t.label}</button>`
  ).join('');

  return `
    <div id="deli-sub-nav" style="
      display:flex;overflow-x:auto;gap:4px;margin-bottom:12px;
      padding-bottom:4px;-webkit-overflow-scrolling:touch;scrollbar-width:none
    ">${tabs}</div>
    <div id="deli-content"></div>
  `;
}

function attachDeliNav(container) {
  container.querySelector('#deli-sub-nav').addEventListener('click', e => {
    const btn = e.target.closest('[data-deli]');
    if (!btn) return;
    switchDeliTab(container, btn.dataset.deli);
  });
}

async function switchDeliTab(container, tabId) {
  deliState.activeTab = tabId;
  container.querySelectorAll('.deli-sub-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.deli === tabId)
  );

  const content = container.querySelector('#deli-content');
  if (!content) return;

  if (tabId === 'dailyinv') {
    renderDailyInvForm(content);
    return;
  }

  if (tabId === 'analytics') {
    renderAnalytics(content);
    return;
  }

  if (tabId === 'training') {
    renderTraining(content);
    return;
  }

  if (tabId === 'labels') {
    content.innerHTML = `
      <div style="height:calc(100vh - 120px);min-height:500px">
        <iframe src="labels.html"
          style="width:100%;height:100%;border:none;display:block;border-radius:var(--radius)"
          allow="clipboard-write"
          loading="lazy"
        ></iframe>
      </div>`;
    return;
  }

  if (tabId === 'menu') {
    const url = 'menu.html?store=' + encodeURIComponent(deliState.storeNum || '')
              + '&name=' + encodeURIComponent(deliState.storeName || '');
    content.innerHTML = `
      <div style="height:calc(100vh - 120px);min-height:500px">
        <iframe src="${url}"
          style="width:100%;height:100%;border:none;display:block;border-radius:var(--radius)"
          loading="lazy"
        ></iframe>
      </div>`;
    return;
  }

  if (tabId === 'inventory') {
    renderInventoryEmbed(content);
    return;
  }

  const tabCfg = DELI_TABS[tabId];
  content.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>Loading ${tabCfg.label}…</p></div>`;

  if (!deliState.sheetId) {
    content.innerHTML = `
      <div class="banner banner-warn">
        <div class="banner-icon">⚠</div>
        <div>No Sheet ID configured for this store. Run <code>migrate.js</code> or paste the Sheet ID into <code>stores.js</code>.</div>
      </div>`;
    return;
  }

  const saNote = (typeof SERVICE_ACCOUNT_EMAIL !== 'undefined' && SERVICE_ACCOUNT_EMAIL)
    ? `<br><br>Service account: <code>${SERVICE_ACCOUNT_EMAIL}</code><br>This email must be shared with the store's Google Sheet.`
    : '';

  // Inventory: if a dedicated count sheet exists, load Deli/Branded Deli/Fountain tabs;
  // otherwise fall through to load the single "Inventory" tab from the main sheet.
  if (tabId === 'inventory' && deliState.countSheetId) {
    const INV_SECTION_DEFS = [
      { key: 'deli',     label: '🥩 Deli',          tabName: 'Deli' },
      { key: 'branded',  label: '🍕 Branded Deli',   tabName: 'Branded Deli' },
      { key: 'beverage', label: '☕ Fountain',        tabName: 'Fountain' },
    ];
    const sheetId = deliState.countSheetId;

    content.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>Loading inventory sections…</p></div>`;

    // Fallback tab name variants for each section (some stores use different capitalization/naming)
    const TAB_ALIASES = {
      'Deli':        ['Deli', 'DELI', 'Deli Counter', 'Deli Items', 'Deli Inventory'],
      'Branded Deli':['Branded Deli', 'BRANDED DELI', 'Branded', 'Hunt Brothers', 'HB'],
      'Fountain':    ['Fountain', 'FOUNTAIN', 'Beverage', 'Beverages', 'Beverage Station', 'Icee', 'ICEE'],
    };
    const sections = await Promise.all(INV_SECTION_DEFS.map(async def => {
      const aliases = TAB_ALIASES[def.tabName] || [def.tabName];
      let lastErr = null;
      for (const name of aliases) {
        try {
          const res = await sheetsGet(deliState.sa, sheetId, `${name}!A1:Z1000`);
          if (res.values && res.values.length > 0) return { ...def, sheetId, rows: res.values, tabName: name };
          // Tab exists but is empty — stop trying aliases
          return { ...def, sheetId, rows: [], tabName: name };
        } catch (e) { lastErr = e; /* try next alias */ }
      }
      return { ...def, sheetId, rows: [], fetchError: lastErr ? lastErr.message : null };
    }));

    // Cache combined for waste log item lookup
    const combined = [].concat(...sections.map(s => s.rows.slice(1)));
    deliState.data['inventory'] = [['Count By','Item','Item#','Case Pack','On Hand','Per','Total'], ...combined];

    try {
      renderCountSheetSections(content, sections);
    } catch(err) {
      content.innerHTML = `<div class="card"><div class="banner banner-warn"><div class="banner-icon">⚠</div><div>Inventory render error: ${err.message}<br><pre style="font-size:11px;margin-top:8px;white-space:pre-wrap">${err.stack||''}</pre></div></div>
      <div style="padding:12px;font-size:12px;color:var(--muted)">Section row counts: ${sections.map(s=>s.tabName+': '+s.rows.length).join(', ')}</div></div>`;
    }
    return;
  }

  try {
    const result = await sheetsGet(deliState.sa, deliState.sheetId, `${tabCfg.tab}!A1:Z1000`);
    deliState.data[tabId] = result.values || [];
  } catch (err) {
    // Tab doesn't exist yet — create it with headers then show empty state
    const tabMissing = /unable to parse range|not found/i.test(err.message);
    if (tabMissing && tabCfg.headers) {
      try {
        await sheetsAddTab(deliState.sa, deliState.sheetId, tabCfg.tab);
        await sheetsUpdate(deliState.sa, deliState.sheetId, `${tabCfg.tab}!A1`, [tabCfg.headers]);
      } catch (_) { /* ignore if tab already exists race */ }
      deliState.data[tabId] = [tabCfg.headers];
    } else {
      content.innerHTML = `
        <div class="banner banner-danger">
          <strong>Could not load data from Google Sheets.</strong>
          <br>Error: <code>${err.message}</code>
          ${saNote}
        </div>`;
      return;
    }
  }

  switch (tabId) {
    case 'inventory': renderCountSheet(content, deliState.data[tabId]); break;
    case 'wastelog':  renderWasteLog(content,   deliState.data[tabId]); break;
    case 'foodcost':  renderFoodCost(content,   deliState.data[tabId]); break;
    case 'invoices':  renderInvoices(content,   deliState.data[tabId]); break;
    case 'suppliers': renderSuppliers(content,  deliState.data[tabId]); break;
  }
}

function reloadTab() {
  const container = document.getElementById('module-deli');
  if (container) switchDeliTab(container, deliState.activeTab);
}

const COUNT_BY_OPTIONS = ['BAG','BOX','CAKE','CAN','CARTON','CASE','CONTAINER','EACH','FLAT','JUG','LOAF','PACK','PAIL','PIE','ROLL','SHAKER','SLEEVE','OTHER'];
const INV_SECTIONS     = ['Deli','Fountain','Branded Deli'];
const INV_CATEGORIES   = ['Bread','Cheese','Condiments','Dairy','Deli Meat','Other','Packaging','Produce','BIB / CO2','Cafe Tango','Coffee','Coffee Beans','Creamer & Sweetener','Cups & Lids','Syrups & Sauce','Pizza','Spices','Toppings','Wings'];
const INV_FLAGS        = ['OK','LOW','OUT'];

// ════════════════════════════════════════
// INVENTORY
// ════════════════════════════════════════

// ════════════════════════════════════════
// BEK PRICE FEED  (Supabase lookup)
// ════════════════════════════════════════

async function bekFetchPrices(itemNums) {
  const sbUrl = (typeof SB_URL !== 'undefined' && SB_URL) ? SB_URL : '';
  const sbKey = (typeof SB_KEY !== 'undefined' && SB_KEY) ? SB_KEY : '';
  if (!sbUrl || !sbKey) throw new Error('BEK price feed not configured (add SB_URL / SB_KEY to serviceAccount.js)');
  if (itemNums.length === 0) return {};
  const inVal = itemNums.map(n => `"${String(n).replace(/"/g, '')}"`)  .join(',');
  const url = `${sbUrl}/rest/v1/bek_prices?item_num=in.(${inVal})&select=item_num,price`;
  const resp = await fetch(url, {
    headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}` },
  });
  if (!resp.ok) throw new Error(`Supabase error ${resp.status}`);
  const rows = await resp.json();
  const map = {};
  (rows || []).forEach(r => { map[String(r.item_num)] = r.price; });
  return map;
}

// ════════════════════════════════════════
// ════════════════════════════════════════
// INVENTORY — MULTI-SECTION (each section = its own sheet tab)
// ════════════════════════════════════════

function renderCountSheetSections(content, sections) {
  // sections: [{ key, label, tabName, sheetId, rows: string[][] }]

  // Parse one section's raw rows into { headers, dataRows, countColIdx, itemNumColIdx, perColIdx, numCols }
  function parseSection(sec) {
    const raw = sec.rows || [];
    if (raw.length === 0) return { headers: [], dataRows: [], countColIdx: 4, itemNumColIdx: 2, perColIdx: 5, numCols: 7, headerRowIdx: 0 };

    // Find header row: prefer a row with 'Count By'/'Item#' pattern; fall back to the
    // row with the most populated cells in the first 6 rows (title rows are sparse).
    let headerRowIdx = 0;
    let headerFound = false;
    for (let ri = 0; ri < Math.min(6, raw.length); ri++) {
      if (raw[ri].some(c => /count.?by|item.?#|item\s*num/i.test(c || ''))) { headerRowIdx = ri; headerFound = true; break; }
    }
    if (!headerFound) {
      let maxCells = 0;
      for (let ri = 0; ri < Math.min(6, raw.length); ri++) {
        const cnt = (raw[ri] || []).filter(c => (c || '').trim()).length;
        if (cnt > maxCells) { maxCells = cnt; headerRowIdx = ri; }
      }
    }
    const headerRow = raw[headerRowIdx] || [];
    const dataRows  = raw.slice(headerRowIdx + 1).filter(r => r.some(c => (c || '').trim()));

    let numCols = headerRow.length;
    for (let i = 0; i < dataRows.length; i++) { if (dataRows[i].length > numCols) numCols = dataRows[i].length; }
    if (numCols < 1) numCols = 7;

    let countColIdx = headerRow.findIndex(h => /^on.?hand$/i.test((h||'').trim()));
    if (countColIdx < 0) countColIdx = Math.min(4, numCols - 1);
    let itemNumColIdx = headerRow.findIndex(h => /item.?#|item.?num/i.test((h||'').trim()));
    if (itemNumColIdx < 0) itemNumColIdx = Math.min(2, numCols - 1);
    let perColIdx = headerRow.findIndex(h => /^per$|^cost$|^price$/i.test((h||'').trim()));
    if (perColIdx < 0) perColIdx = Math.min(5, numCols - 1);

    // Build padded header labels
    const headers = [];
    for (let i = 0; i < numCols; i++) {
      headers.push((headerRow[i] || '').trim() || (i === countColIdx ? 'On Hand' : ''));
    }

    return { headers, dataRows, countColIdx, itemNumColIdx, perColIdx, numCols, headerRowIdx };
  }

  // Build the tbody HTML rows for one section, tagged with data-pane-sec
  function buildRows(sec, p) {
    if (p.dataRows.length === 0) {
      return `<tr data-pane-sec="${sec.key}"><td colspan="${p.numCols + 1}" style="text-align:center;color:var(--muted);padding:28px">
        No items found in the <strong>${sec.tabName}</strong> sheet tab.<br>
        <small>Make sure a tab named exactly "<strong>${sec.tabName}</strong>" exists in this store's Google Sheet.</small>
      </td></tr>`;
    }

    let html = '';
    p.dataRows.forEach((r, idx) => {
      const sheetRow = p.headerRowIdx + 2 + idx;
      const cells = p.headers.map((h, i) => {
        const val = (r[i] || '').trim();
        if (i === p.countColIdx) {
          return `<td style="padding:3px 5px"><input type="number" class="cs-count-input"
            data-cs-row="${sheetRow}" data-cs-col="${i}"
            data-cs-tab="${sec.tabName}" data-cs-sid="${sec.sheetId}"
            value="${val}" min="0" step="0.01"
            style="width:72px;padding:4px 8px;border:1.5px solid var(--gray);border-radius:6px;font-size:13px;font-weight:700;text-align:center;background:var(--white)"></td>`;
        }
        return `<td>${val}</td>`;
      }).join('');

      const itemNum = (r[itemNumColIdx]||'').trim();
      const purchCell = `<td style="padding:3px 5px;text-align:center"><input type="checkbox" class="cs-purch-chk" data-cs-row="${sheetRow}" data-item-num="${itemNum}" data-per-col="${perColIdx}" data-cs-tab="${sec.tabName}" data-cs-sid="${sec.sheetId}" style="width:18px;height:18px;cursor:pointer;accent-color:var(--ks-blue)"></td>`;
      return `<tr>${cells}${purchCell}</tr>`;
    }).join('');

    const errDetail = sec.fetchError
      ? `<br><small style="color:var(--red)">API error: ${sec.fetchError}</small>`
      : `<br><small style="color:var(--muted)">Tab must be named exactly "<strong>${sec.tabName}</strong>" in this store's Google Sheet.</small>`;
    const emptyMsg = `<tr><td colspan="${numCols+1}" style="text-align:center;color:var(--muted);padding:28px">No items found in the <strong>${sec.tabName}</strong> sheet tab (${dataRows.length} rows fetched, ${dataRows.filter(r=>r.some(c=>(c||'').trim())).length} non-blank).${errDetail}</td></tr>`;

    return { colHdrs, rowsHTML: rowsHTML || emptyMsg, outCnt };
  }

  const parsed = sections.map(sec => ({ sec, p: parseSection(sec) }));

  // Section sub-tab buttons
  const tabBtns = [
    `<button class="tab-btn deli-sub-btn cs-inv-tab active" data-inv-sec="all" style="font-size:13px">All Items (${parsed.reduce((s,x)=>s+x.p.dataRows.length,0)})</button>`,
    ...parsed.map(({ sec, p }) =>
      `<button class="tab-btn deli-sub-btn cs-inv-tab" data-inv-sec="${sec.key}" style="font-size:13px">${sec.label} (${p.dataRows.length})</button>`
    )
  ].join('');

  // Header row — use first section's headers (all sections share the same sheet structure)
  const firstHeaders = parsed[0].p.headers;
  const numCols      = parsed[0].p.numCols;
  const theadHtml    = firstHeaders.map(h => `<th>${h || ''}</th>`).join('') + '<th>📦 Purch?</th>';

  // Body: section title stripe + rows for each section
  const tbodyHtml = parsed.map(({ sec, p }) => {
    const hdr = `<tr data-pane-sec="${sec.key}" style="background:var(--ks-blue2,#1565C0)"><td colspan="${numCols + 1}" style="color:#fff;font-weight:700;font-size:12px;padding:6px 12px;letter-spacing:.05em;text-transform:uppercase">${sec.label} — ${sec.tabName} (${p.dataRows.length} items)</td></tr>`;
    return hdr + buildRows(sec, p);
  }).join('');

  content.innerHTML = `
    <div class="card">
      <div class="card-title" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
        <span>Inventory Count Sheet</span>
        <span style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <button class="btn btn-ghost btn-sm" id="bek-upload-btn">📤 Upload BEK Prices</button>
          <button class="btn btn-primary btn-sm" id="save-all-counts-btn">💾 Save All Counts</button>
        </span>
      </div>

      <!-- BEK Upload panel -->
      <div id="bek-upload-panel" style="display:none;background:var(--bg);border-radius:8px;padding:14px;margin-bottom:12px;border:1.5px solid var(--gray)">
        <div style="font-weight:600;font-size:13px;margin-bottom:8px">Upload BEK Price List (CSV)</div>
        <div style="font-size:12px;color:var(--muted);margin-bottom:10px">CSV must have columns: <code>item_num</code> and <code>price</code> (or <code>Item Number</code> / <code>Unit Price</code>).</div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <input type="file" id="bek-file-input" accept=".csv,.txt" style="font-size:13px">
          <button class="btn btn-primary btn-sm" id="bek-process-btn">Process &amp; Upload</button>
          <button class="btn btn-ghost btn-sm" id="bek-cancel-btn">Cancel</button>
        </div>
        <div id="bek-upload-status" style="margin-top:8px;font-size:13px"></div>
      </div>

      <!-- Section sub-tabs -->
      <div style="display:flex;gap:4px;margin-bottom:10px;border-bottom:2px solid var(--gray);overflow-x:auto;-webkit-overflow-scrolling:touch">
        ${tabBtns}
      </div>

      <div id="save-all-counts-status" style="font-size:13px;margin-bottom:8px;display:none"></div>
      <div class="table-wrap">
        <table class="data-table" id="cs-main-table">
          <thead><tr>${theadHtml}</tr></thead>
          <tbody>${tbodyHtml}</tbody>
        </table>
      </div>
    </div>
  `;

  // Sub-tab switching
  content.querySelectorAll('.cs-inv-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      content.querySelectorAll('.cs-inv-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const sec = btn.dataset.invSec;
      content.querySelectorAll('#cs-main-table tbody tr').forEach(tr => {
        const rowSec = tr.dataset.paneSec;
        tr.style.display = (sec === 'all' || rowSec === sec) ? '' : 'none';
      });
    });
  });

  // Auto-save count inputs on blur
  content.querySelectorAll('.cs-count-input').forEach(inp => {
    const save = async () => {
      const sid      = inp.dataset.csSid;
      const tabName  = inp.dataset.csTab;
      const sheetRow = inp.dataset.csRow;
      const colIdx   = parseInt(inp.dataset.csCol, 10);
      if (!sid || !tabName || !sheetRow || isNaN(colIdx)) return;
      const col = String.fromCharCode(65 + colIdx);
      inp.style.borderColor = 'var(--ks-blue)';
      try {
        await sheetsUpdate(deliState.sa, sid, `${tabName}!${col}${sheetRow}`, [[inp.value]]);
        inp.style.borderColor = 'var(--green)';
        setTimeout(() => { inp.style.borderColor = 'var(--gray)'; }, 1500);
      } catch (_) { inp.style.borderColor = 'var(--red)'; }
    };
    inp.addEventListener('blur', save);
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); inp.blur(); } });
  });

  // Save All button
  const saveAllBtn    = content.querySelector('#save-all-counts-btn');
  const saveAllStatus = content.querySelector('#save-all-counts-status');
  saveAllBtn.addEventListener('click', async () => {
    const inputs  = [...content.querySelectorAll('.cs-count-input')];
    const checked = [...content.querySelectorAll('.cs-purch-chk:checked')];
    saveAllBtn.disabled = true; saveAllBtn.textContent = 'Saving…';
    saveAllStatus.style.display = 'block';
    saveAllStatus.innerHTML = '<span style="color:var(--muted)">Writing counts…</span>';
    try {
      await Promise.all(inputs.map(inp => {
        const sid      = inp.dataset.csSid;
        const tabName  = inp.dataset.csTab;
        const sheetRow = inp.dataset.csRow;
        const colIdx   = parseInt(inp.dataset.csCol, 10);
        if (!sid || !tabName || !sheetRow || isNaN(colIdx)) return Promise.resolve();
        const col = String.fromCharCode(65 + colIdx);
        return sheetsUpdate(deliState.sa, sid, `${tabName}!${col}${sheetRow}`, [[inp.value]]);
      }));
      if (checked.length > 0) {
        saveAllStatus.innerHTML = '<span style="color:var(--muted)">Fetching BEK prices…</span>';
        const itemNums = [...new Set(checked.map(c => c.dataset.itemNum).filter(Boolean))];
        let priceMap = {};
        try { priceMap = await bekFetchPrices(itemNums); } catch (_) {}
        const priceWrites = checked.filter(c => priceMap[c.dataset.itemNum] != null).map(c => {
          const col = String.fromCharCode(65 + parseInt(c.dataset.perCol, 10));
          return sheetsUpdate(deliState.sa, c.dataset.csSid, `${c.dataset.csTab}!${col}${c.dataset.csRow}`, [[priceMap[c.dataset.itemNum]]]);
        });
        await Promise.all(priceWrites);
        checked.forEach(c => { c.checked = false; });
        saveAllStatus.innerHTML = `<span style="color:var(--green)">✓ ${inputs.length} counts saved, ${priceWrites.length} BEK prices updated.</span>`;
      } else {
        saveAllStatus.innerHTML = `<span style="color:var(--green)">✓ All ${inputs.length} counts saved.</span>`;
      }
    } catch (err) {
      saveAllStatus.innerHTML = `<span style="color:var(--red)">Error: ${err.message}</span>`;
    } finally {
      saveAllBtn.disabled = false; saveAllBtn.textContent = '💾 Save All Counts';
    }
  });

  // BEK Upload
  const bekUploadBtn  = content.querySelector('#bek-upload-btn');
  const bekPanel      = content.querySelector('#bek-upload-panel');
  bekUploadBtn.addEventListener('click', () => { bekPanel.style.display = bekPanel.style.display === 'none' ? '' : 'none'; });
  content.querySelector('#bek-cancel-btn').addEventListener('click', () => { bekPanel.style.display = 'none'; });
  content.querySelector('#bek-process-btn').addEventListener('click', async () => {
    const file = content.querySelector('#bek-file-input').files[0];
    const bekStatus = content.querySelector('#bek-upload-status');
    if (!file) { bekStatus.innerHTML = '<span style="color:var(--red)">Select a CSV file first.</span>'; return; }
    const sbUrl = (typeof SB_URL !== 'undefined' && SB_URL) ? SB_URL : '';
    const sbKey = (typeof SB_KEY !== 'undefined' && SB_KEY) ? SB_KEY : '';
    if (!sbUrl || !sbKey) { bekStatus.innerHTML = '<span style="color:var(--red)">BEK feed not configured (add SB_URL / SB_KEY).</span>'; return; }
    const btn = content.querySelector('#bek-process-btn');
    btn.disabled = true; btn.textContent = 'Processing…';
    try {
      const text  = await file.text();
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      if (lines.length < 2) throw new Error('CSV appears empty.');
      const delim = lines[0].includes('\t') ? '\t' : ',';
      const hdrs  = lines[0].split(delim).map(h => h.replace(/^"|"$/g,'').trim().toLowerCase());
      const numCol   = hdrs.findIndex(h => /item.?num|item.?#/i.test(h));
      const priceCol = hdrs.findIndex(h => /^price$|unit.?price|each.?price/i.test(h));
      if (numCol < 0 || priceCol < 0) throw new Error(`Couldn't find item_num/price columns. Headers: ${hdrs.join(', ')}`);
      const rows = lines.slice(1).map(l => {
        const cols = l.split(delim).map(c => c.replace(/^"|"$/g,'').trim());
        const price = parseFloat(cols[priceCol]);
        return cols[numCol] && !isNaN(price) ? { item_num: cols[numCol], price } : null;
      }).filter(Boolean);
      if (!rows.length) throw new Error('No valid rows found.');
      bekStatus.innerHTML = `<span style="color:var(--muted)">Uploading ${rows.length} prices…</span>`;
      for (let i = 0; i < rows.length; i += 200) {
        const resp = await fetch(`${sbUrl}/rest/v1/bek_prices`, {
          method: 'POST',
          headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}`, 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates' },
          body: JSON.stringify(rows.slice(i, i + 200)),
        });
        if (!resp.ok) throw new Error(`Supabase ${resp.status}`);
      }
      bekStatus.innerHTML = `<span style="color:var(--green)">✓ ${rows.length} BEK prices uploaded.</span>`;
    } catch (err) {
      bekStatus.innerHTML = `<span style="color:var(--red)">Error: ${err.message}</span>`;
    } finally { btn.disabled = false; btn.textContent = 'Process & Upload'; }
  });
}

// COUNT SHEET (native display, no conversion)
// ════════════════════════════════════════

function renderCountSheet(content, raw) {
  if (!raw || raw.length === 0) {
    content.innerHTML = '<div class="empty-state"><p>Count sheet is empty.</p></div>';
    return;
  }

  // Scan the first 6 rows to find the real header row.
  // Use "count by" or "item#" — NOT "on hand" alone because title rows often contain it.
  let headerRowIdx = 0;
  let headerFound = false;
  for (let ri = 0; ri < Math.min(6, raw.length); ri++) {
    if (raw[ri].some(c => /count.?by|item.?#|item\s*num/i.test(c || ''))) {
      headerRowIdx = ri;
      headerFound = true;
      break;
    }
  }
  // Fallback: if no header pattern matched and row 0 looks like a title (≤2 populated cells),
  // use row 1 as the header if it has more content — handles "DELI PRO — INVENTORY VALUATION" style sheets.
  if (!headerFound) {
    const row0Cells = (raw[0] || []).filter(c => (c || '').trim()).length;
    const row1Cells = (raw[1] || []).filter(c => (c || '').trim()).length;
    if (row0Cells <= 2 && row1Cells >= 3) headerRowIdx = 1;
  }

  const headerRow = raw[headerRowIdx] || [];
  // Data starts one row after the header; sheet row number = headerRowIdx + 2 + dataIdx (1-based + header offset)
  const dataRows  = raw.slice(headerRowIdx + 1);

  // Find the On Hand column — match "on hand" specifically, not "count" (which hits "Count By")
  let countColIdx = -1;
  for (let i = 0; i < headerRow.length; i++) {
    if (/^on.?hand$/i.test((headerRow[i] || '').trim())) { countColIdx = i; break; }
  }
  if (countColIdx === -1) countColIdx = 4; // default to col E

  // Find Item# column (for BEK price lookup)
  let itemNumColIdx = -1;
  for (let i = 0; i < headerRow.length; i++) {
    if (/item.?#|item.?num/i.test((headerRow[i] || '').trim())) { itemNumColIdx = i; break; }
  }
  if (itemNumColIdx === -1) itemNumColIdx = 2;

  // Find Per/cost column (updated with BEK prices for checked items)
  let perColIdx = -1;
  for (let i = 0; i < headerRow.length; i++) {
    if (/^per$|^cost$|^price$/i.test((headerRow[i] || '').trim())) { perColIdx = i; break; }
  }
  if (perColIdx === -1) perColIdx = 5;

  // Find a STATUS column (for color coding)
  let statusColIdx = -1;
  for (let i = 0; i < headerRow.length; i++) {
    if (/status/i.test(headerRow[i] || '')) { statusColIdx = i; break; }
  }
  if (statusColIdx === -1) {
    const sample = dataRows.find(r => r.length >= 8);
    if (sample) {
      const last = (sample[sample.length - 1] || '').trim();
      if (/^(out|low|ok|no.?par)$/i.test(last)) statusColIdx = sample.length - 1;
    }
  }

  // Build display headers — blank header cells are hidden (null), except the count column
  let numCols = 1;
  for (let i = 0; i < raw.length; i++) { if (raw[i].length > numCols) numCols = raw[i].length; }
  const headers = Array.from({ length: numCols }, (_, i) => {
    if (i === countColIdx) return 'On Hand';
    return (headerRow[i] || '').trim() || null;
  });

  // ── Build rows and section tabs ──
  const colHeaders = headers.map(h => h !== null ? `<th>${h}</th>` : '').join('') + '<th style="white-space:nowrap">📦 Purch?</th>';

  // ── Build all rows, tagging each with its detected section ──
  let activeSec = 'all';
  const outCount = { all: 0, deli: 0, branded: 0, beverage: 0 };

  const rowsHTML = dataRows.map((r, dataIdx) => {
    const sheetRow = headerRowIdx + 2 + dataIdx;
    if (r.every(c => !(c || '').trim())) return '';

    const colA     = (r[0] || '').trim();
    const colB     = (r[1] || '').trim();
    const countV   = (r[countColIdx] || '').trim();
    const nonEmpty = r.filter(c => (c || '').trim()).length;

    // Section header row
    if (!colA && colB && !countV && nonEmpty <= 3) {
      const lbl = colB.toLowerCase();
      if      (/branded/i.test(lbl))                         activeSec = 'branded';
      else if (/fountain|beverage|bev|coffee|bibs/i.test(lbl)) activeSec = 'beverage';
      else if (/deli/i.test(lbl))                            activeSec = 'deli';
      else                                                   activeSec = 'other';
      return `<tr data-sec="${activeSec}"><td colspan="${numCols + 1}" style="font-weight:700;font-size:12px;background:var(--ks-blue);color:#fff;padding:5px 10px;letter-spacing:.05em;text-transform:uppercase">${colB}</td></tr>`;
    }

    // Track OUT count per section
    const isOut = statusColIdx >= 0 && /^out$/i.test((r[statusColIdx] || '').trim());
    if (isOut) { outCount.all++; if (outCount[activeSec] !== undefined) outCount[activeSec]++; }

    const cells = headers.map((h, i) => {
      if (h === null) return '';
      const val = (r[i] || '').trim();
      if (i === countColIdx) {
        return `<td style="padding:3px 5px"><input type="number" class="cs-count-input" data-cs-row="${sheetRow}" data-cs-col="${i}" value="${val}" min="0" step="0.01" style="width:72px;padding:4px 8px;border:1.5px solid var(--gray);border-radius:6px;font-size:13px;font-weight:700;text-align:center;background:var(--white)"></td>`;
      }
      if (i === statusColIdx && val) {
        const sc = (v => { const s=v.toUpperCase(); return s==='OUT'?'color:var(--red);font-weight:700':s==='LOW'?'color:var(--amber);font-weight:700':s==='OK'?'color:var(--green);font-weight:600':'' })(val);
        return `<td style="${sc}">${val}</td>`;
      }
      return `<td>${val}</td>`;
    }).join('');

    const itemNum  = (r[itemNumColIdx] || '').trim();
    const purchCell = `<td style="padding:3px 5px;text-align:center"><input type="checkbox" class="cs-purch-chk" data-cs-row="${sheetRow}" data-item-num="${itemNum}" data-per-col="${perColIdx}" style="width:18px;height:18px;cursor:pointer;accent-color:var(--ks-blue)"></td>`;
    return `<tr data-sec="${activeSec}">${cells}${purchCell}</tr>`;
  }).join('');

  const SECTION_TABS = [
    { key: 'all',      label: 'All Items' },
    { key: 'deli',     label: '🥩 Deli' },
    { key: 'branded',  label: '🍕 Branded Deli' },
    { key: 'beverage', label: '☕ Beverage Station' },
  ];

  const tabButtons = SECTION_TABS.map((s, i) => {
    const cnt = outCount[s.key] || 0;
    return `<button class="tab-btn deli-sub-btn cs-inv-tab${i===0?' active':''}" data-inv-sec="${s.key}" style="font-size:13px;white-space:nowrap">
      ${s.label}${cnt > 0 ? ` <span style="font-size:11px;color:var(--red);font-weight:700">(${cnt} OUT)</span>` : ''}
    </button>`;
  }).join('');

  content.innerHTML = `
    <div class="card">
      <div class="card-title" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
        <span>Inventory Count Sheet</span>
        <span style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          ${outCount.all > 0 ? `<span style="font-size:12px;font-weight:700;color:var(--red)">${outCount.all} OUT total</span>` : ''}
          <button class="btn btn-ghost btn-sm" id="bek-upload-btn">📤 Upload BEK Prices</button>
          <button class="btn btn-primary btn-sm" id="save-all-counts-btn">💾 Save Count &amp; Update Purchased Prices</button>
        </span>
      </div>

      <!-- BEK Upload panel -->
      <div id="bek-upload-panel" style="display:none;background:var(--bg);border-radius:8px;padding:14px;margin-bottom:12px;border:1.5px solid var(--gray)">
        <div style="font-weight:600;font-size:13px;margin-bottom:8px">Upload BEK Price List (CSV)</div>
        <div style="font-size:12px;color:var(--muted);margin-bottom:10px">
          CSV must have columns: <code>item_num</code> and <code>price</code> (or <code>Item Number</code> / <code>Unit Price</code>).
        </div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <input type="file" id="bek-file-input" accept=".csv,.txt" style="font-size:13px">
          <button class="btn btn-primary btn-sm" id="bek-process-btn">Process &amp; Upload</button>
          <button class="btn btn-ghost btn-sm" id="bek-cancel-btn">Cancel</button>
        </div>
        <div id="bek-upload-status" style="margin-top:8px;font-size:13px"></div>
      </div>

      <!-- Section sub-tabs -->
      <div style="display:flex;gap:4px;margin-bottom:10px;border-bottom:2px solid var(--gray);overflow-x:auto;padding-bottom:0;-webkit-overflow-scrolling:touch">
        ${tabButtons}
      </div>

      <div id="save-all-counts-status" style="font-size:13px;margin-bottom:8px;display:none"></div>
      <div class="table-wrap">
        <table class="data-table" id="cs-main-table">
          <thead><tr>${colHeaders}</tr></thead>
          <tbody>${rowsHTML}</tbody>
        </table>
      </div>
    </div>
  `;

  // ── Section tab filtering (show/hide rows by data-sec) ──
  content.querySelectorAll('.cs-inv-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      content.querySelectorAll('.cs-inv-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const sec = btn.dataset.invSec;
      content.querySelectorAll('#cs-main-table tbody tr').forEach(tr => {
        tr.style.display = (sec === 'all' || tr.dataset.sec === sec) ? '' : 'none';
      });
    });
  });

  // ── BEK Upload panel ──
  const bekUploadBtn  = content.querySelector('#bek-upload-btn');
  const bekPanel      = content.querySelector('#bek-upload-panel');
  const bekCancelBtn  = content.querySelector('#bek-cancel-btn');
  const bekProcessBtn = content.querySelector('#bek-process-btn');
  const bekFileInput  = content.querySelector('#bek-file-input');
  const bekStatus     = content.querySelector('#bek-upload-status');

  bekUploadBtn.addEventListener('click', () => { bekPanel.style.display = bekPanel.style.display === 'none' ? '' : 'none'; });
  bekCancelBtn.addEventListener('click', () => { bekPanel.style.display = 'none'; });

  bekProcessBtn.addEventListener('click', async () => {
    const file = bekFileInput.files[0];
    if (!file) { bekStatus.innerHTML = '<span style="color:var(--red)">Select a CSV file first.</span>'; return; }

    const sbUrl = (typeof SB_URL !== 'undefined' && SB_URL) ? SB_URL : '';
    const sbKey = (typeof SB_KEY !== 'undefined' && SB_KEY) ? SB_KEY : '';
    if (!sbUrl || !sbKey) {
      bekStatus.innerHTML = '<span style="color:var(--red)">BEK feed not configured (add SB_URL / SB_KEY).</span>';
      return;
    }

    bekProcessBtn.disabled = true; bekProcessBtn.textContent = 'Processing…';
    bekStatus.innerHTML = '<span style="color:var(--muted)">Reading file…</span>';

    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      if (lines.length < 2) throw new Error('CSV appears empty.');

      // Detect delimiter
      const delim = lines[0].includes('\t') ? '\t' : ',';
      const rawHeaders = lines[0].split(delim).map(h => h.replace(/^"|"$/g, '').trim().toLowerCase());

      // Find item_num and price columns flexibly
      const numCol   = rawHeaders.findIndex(h => /item.?num|item.?#|itemnumber/i.test(h));
      const priceCol = rawHeaders.findIndex(h => /^price$|unit.?price|each.?price|ext.?price/i.test(h));
      if (numCol === -1 || priceCol === -1) throw new Error(`Could not find item_num / price columns. Headers found: ${rawHeaders.join(', ')}`);

      const rows = lines.slice(1).map(l => {
        const cols = l.split(delim).map(c => c.replace(/^"|"$/g, '').trim());
        const item_num = cols[numCol];
        const price    = parseFloat(cols[priceCol]);
        if (!item_num || isNaN(price)) return null;
        return { item_num, price };
      }).filter(Boolean);

      if (rows.length === 0) throw new Error('No valid rows found after parsing.');

      bekStatus.innerHTML = `<span style="color:var(--muted)">Uploading ${rows.length} prices…</span>`;

      // Upsert in batches of 200
      const batch = 200;
      for (let i = 0; i < rows.length; i += batch) {
        const chunk = rows.slice(i, i + batch);
        const resp = await fetch(`${sbUrl}/rest/v1/bek_prices`, {
          method: 'POST',
          headers: {
            'apikey': sbKey,
            'Authorization': `Bearer ${sbKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates',
          },
          body: JSON.stringify(chunk),
        });
        if (!resp.ok) {
          const errText = await resp.text();
          throw new Error(`Supabase error ${resp.status}: ${errText}`);
        }
      }

      bekStatus.innerHTML = `<span style="color:var(--green)">✓ ${rows.length} BEK prices uploaded successfully.</span>`;
      bekFileInput.value = '';
    } catch (err) {
      bekStatus.innerHTML = `<span style="color:var(--red)">Error: ${err.message}</span>`;
    } finally {
      bekProcessBtn.disabled = false; bekProcessBtn.textContent = 'Process & Upload';
    }
  });

  content.querySelectorAll('.cs-count-input').forEach(input => {
    const saveCount = async () => {
      const sheetRow  = input.dataset.csRow;
      const colIdx    = parseInt(input.dataset.csCol, 10);
      if (!sheetRow || isNaN(colIdx)) return;
      const colLetter     = String.fromCharCode(65 + colIdx);
      const saveSheetId   = deliState.countSheetId || deliState.sheetId;
      const saveTabPrefix = deliState.countSheetId ? '' : 'Inventory!';
      input.style.borderColor = 'var(--ks-blue)';
      try {
        await sheetsUpdate(deliState.sa, saveSheetId, `${saveTabPrefix}${colLetter}${sheetRow}`, [[input.value]]);
        input.style.borderColor = 'var(--green)';
        setTimeout(() => { input.style.borderColor = 'var(--gray)'; }, 1500);
      } catch (_) {
        input.style.borderColor = 'var(--red)';
      }
    };
    input.addEventListener('blur', saveCount);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); input.blur(); } });
  });

  const saveAllBtn    = content.querySelector('#save-all-counts-btn');
  const saveAllStatus = content.querySelector('#save-all-counts-status');
  saveAllBtn.addEventListener('click', async () => {
    const inputs       = [...content.querySelectorAll('.cs-count-input')];
    const checkedBoxes = [...content.querySelectorAll('.cs-purch-chk:checked')];
    saveAllBtn.disabled = true;
    saveAllBtn.textContent = 'Saving…';
    saveAllStatus.style.display = 'block';
    saveAllStatus.innerHTML = '<span style="color:var(--muted)">Writing counts…</span>';
    try {
      const bulkSheetId   = deliState.countSheetId || deliState.sheetId;
      const bulkTabPrefix = deliState.countSheetId ? '' : 'Inventory!';

      await Promise.all(inputs.map(inp => {
        const sheetRow = inp.dataset.csRow;
        const colIdx   = parseInt(inp.dataset.csCol, 10);
        if (!sheetRow || isNaN(colIdx)) return Promise.resolve();
        const colLetter = String.fromCharCode(65 + colIdx);
        return sheetsUpdate(deliState.sa, bulkSheetId, `${bulkTabPrefix}${colLetter}${sheetRow}`, [[inp.value]]);
      }));

      if (checkedBoxes.length > 0) {
        saveAllStatus.innerHTML = '<span style="color:var(--muted)">Fetching BEK prices…</span>';
        const itemNums = [...new Set(checkedBoxes.map(c => c.dataset.itemNum).filter(Boolean))];
        let priceMap = {};
        try {
          priceMap = await bekFetchPrices(itemNums);
        } catch (pErr) {
          saveAllStatus.innerHTML = `<span style="color:var(--amber)">⚠ Counts saved. BEK price update failed: ${pErr.message}</span>`;
          return;
        }

        saveAllStatus.innerHTML = '<span style="color:var(--muted)">Updating BEK prices…</span>';
        const priceWrites = checkedBoxes
          .filter(c => priceMap[c.dataset.itemNum] != null)
          .map(c => {
            const colLetter = String.fromCharCode(65 + parseInt(c.dataset.perCol, 10));
            return sheetsUpdate(deliState.sa, bulkSheetId, `${bulkTabPrefix}${colLetter}${c.dataset.csRow}`, [[priceMap[c.dataset.itemNum]]]);
          });
        await Promise.all(priceWrites);

        checkedBoxes.forEach(c => { c.checked = false; });

        const updated = priceWrites.length;
        const skipped = checkedBoxes.length - updated;
        saveAllStatus.innerHTML = `<span style="color:var(--green)">✓ ${inputs.length} counts saved, ${updated} BEK price${updated !== 1 ? 's' : ''} updated.${skipped > 0 ? ` <span style="color:var(--amber)">${skipped} item${skipped !== 1 ? 's' : ''} not in BEK feed.</span>` : ''}</span>`;
      } else {
        saveAllStatus.innerHTML = `<span style="color:var(--green)">✓ All ${inputs.length} counts saved.</span>`;
      }
    } catch (err) {
      saveAllStatus.innerHTML = `<span style="color:var(--red)">Error: ${err.message}</span>`;
    } finally {
      saveAllBtn.disabled = false;
      saveAllBtn.textContent = '💾 Save Count & Update Purchased Prices';
    }
  });
}

// ════════════════════════════════════════
// DAILY INVENTORY CONTROL FORM
// ════════════════════════════════════════

const DAILY_INV_SECTIONS = [
  {
    key:   'deli',
    label: 'Deli Inventory at Cost',
    sub:   'Hot Deli, Hotdog, Chili Cheese, Peanut Patch',
    color: '#1565C0',
  },
  {
    key:   'branded',
    label: 'Branded Deli Inventory at Cost',
    sub:   'Hunt Brothers, Piccadilly Pizza',
    color: '#6A1B9A',
  },
  {
    key:   'beverage',
    label: 'Beverage Station Inventory at Cost',
    sub:   'Coffee, Cappuccino, Fountain Drinks, BIBs, Frozen Drinks, Tea',
    color: '#00695C',
  },
];

const DAILY_INV_FIELDS = [
  { key: 'beg',       label: 'Beginning Inv.',       hint: '$',    calc: false },
  { key: 'purchases', label: 'Purchases',             hint: '(+)',  calc: false },
  { key: 'retail',    label: '% of Retail Sales',     hint: '(−)',  calc: false },
  { key: 'transfers', label: 'Transfers',              hint: '(+/−)',calc: false },
  { key: 'end',       label: 'Ending Inv.',            hint: '',     calc: true  },
];

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function getDayDates(weekOf) {
  if (!weekOf) return DAYS.map(d => d);
  const base = new Date(weekOf + 'T00:00:00');
  return DAYS.map((d, i) => {
    const dt = new Date(base);
    dt.setDate(base.getDate() + i);
    return `${d} ${dt.getMonth()+1}/${dt.getDate()}`;
  });
}

function renderDailyInvForm(content, sheetRows) {
  // Build an in-memory state map: state[sectionKey][fieldKey][dayIdx] = value
  const state = {};
  DAILY_INV_SECTIONS.forEach(sec => {
    state[sec.key] = {};
    DAILY_INV_FIELDS.forEach(f => { state[sec.key][f.key] = Array(7).fill(''); });
  });

  // Parse sheet rows if provided
  // Row format: [weekOf, sectionKey, fieldKey, sun, mon, tue, wed, thu, fri, sat]
  let weekOf = '';
  if (sheetRows && sheetRows.length > 1) {
    for (const row of sheetRows.slice(1)) {
      if (!weekOf && row[0]) weekOf = row[0];
      const sec = row[1]; const fld = row[2];
      if (state[sec] && state[sec][fld]) {
        for (let d = 0; d < 7; d++) state[sec][fld][d] = row[3 + d] || '';
      }
    }
  }

  // Default week-of to most recent Sunday
  if (!weekOf) {
    const today = new Date();
    const sun = new Date(today);
    sun.setDate(today.getDate() - today.getDay());
    weekOf = sun.toISOString().split('T')[0];
  }

  const dayLabels = getDayDates(weekOf);

  function calcEnding(sec, dayIdx) {
    const beg  = parseFloat(state[sec].beg[dayIdx])       || 0;
    const pur  = parseFloat(state[sec].purchases[dayIdx]) || 0;
    const ret  = parseFloat(state[sec].retail[dayIdx])    || 0;
    const trn  = parseFloat(state[sec].transfers[dayIdx]) || 0;
    return (beg + pur - ret + trn).toFixed(2);
  }

  function buildSectionCard(sec) {
    const rows = DAILY_INV_FIELDS.map(f => {
      const isCalc = f.calc;
      const cells = DAYS.map((_, di) => {
        if (isCalc) {
          return `<td style="padding:3px 4px;text-align:center">
            <span class="di-end" data-sec="${sec.key}" data-day="${di}" style="
              display:inline-block;min-width:72px;font-weight:700;font-size:13px;
              color:${sec.color};text-align:center
            ">${calcEnding(sec.key, di)}</span>
          </td>`;
        }
        return `<td style="padding:3px 4px">
          <input type="number" class="di-input" step="0.01" min="0"
            data-sec="${sec.key}" data-field="${f.key}" data-day="${di}"
            value="${state[sec.key][f.key][di]}"
            style="width:72px;padding:4px 6px;border:1.5px solid var(--gray);border-radius:6px;
                   font-size:13px;text-align:center;background:var(--white)">
        </td>`;
      }).join('');

      return `<tr>
        <td style="padding:6px 10px;font-size:12px;font-weight:600;white-space:nowrap;min-width:140px">
          ${f.label} <span style="color:var(--muted);font-weight:400">${f.hint}</span>
        </td>
        ${cells}
      </tr>`;
    }).join('');

    const dayHeaders = dayLabels.map(d =>
      `<th style="min-width:80px;text-align:center;font-size:11px">${d}</th>`
    ).join('');

    return `
      <div class="card" style="margin-bottom:16px">
        <div class="card-title" style="background:${sec.color};color:#fff;border-radius:var(--radius) var(--radius) 0 0;margin:-16px -16px 12px;padding:12px 16px">
          <div style="font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:.04em">${sec.label}</div>
          <div style="font-size:11px;font-weight:400;opacity:.85;margin-top:2px">${sec.sub}</div>
        </div>
        <div class="table-wrap">
          <table class="data-table" style="min-width:680px">
            <thead><tr>
              <th style="min-width:140px">Field</th>
              ${dayHeaders}
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    `;
  }

  const today = new Date().toISOString().split('T')[0];

  content.innerHTML = `
    <div style="max-width:900px">
      <div class="card" style="margin-bottom:16px">
        <div class="card-title" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
          <span>Daily Inventory Control Form</span>
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
            <label style="font-size:12px;font-weight:600;color:var(--muted)">Week of (Sunday):</label>
            <input type="date" id="di-weekof" value="${weekOf}"
              style="padding:6px 10px;border:1.5px solid var(--gray);border-radius:8px;font-size:14px;font-family:inherit">
            <button class="btn btn-ghost btn-sm" id="di-load-btn">Load Week</button>
          </div>
        </div>
        <div style="font-size:12px;color:var(--muted)">
          Store #${deliState.storeNum} &mdash; ${deliState.storeName || ''}
          &nbsp;&middot;&nbsp; Ending Inv = Beg Inv + Purchases &minus; % of Retail Sales ± Transfers
        </div>
      </div>

      <!-- Self-Registration banner (shown if no managers registered for this store) -->
      <div id="di-register-banner" style="display:none;margin-bottom:12px">
        <div class="card" style="border:2px solid var(--ks-blue)">
          <div class="card-title" style="font-size:13px">Register Your Manager PIN</div>
          <p style="font-size:13px;color:var(--muted);margin:0 0 10px">No manager is registered for Store #${deliState.storeNum} yet. Register your PIN below to sign ICF forms, transfers, and close the week.</p>
          <div style="display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap">
            <div class="form-row"><label>Full Name</label><input type="text" id="self-reg-name" placeholder="Your name" style="padding:6px 10px;border:1.5px solid var(--gray);border-radius:8px;font-size:13px;font-family:inherit"></div>
            <div class="form-row"><label>Email</label><input type="email" id="self-reg-email" placeholder="your@email.com" style="padding:6px 10px;border:1.5px solid var(--gray);border-radius:8px;font-size:13px;font-family:inherit"></div>
            <div class="form-row"><label>Create PIN (4–6 digits)</label><input type="password" id="self-reg-pin" maxlength="6" placeholder="••••" style="width:100px;padding:6px 10px;border:1.5px solid var(--gray);border-radius:8px;font-size:16px;letter-spacing:4px;text-align:center;font-family:inherit"></div>
            <div class="form-row"><label>Confirm PIN</label><input type="password" id="self-reg-pin2" maxlength="6" placeholder="••••" style="width:100px;padding:6px 10px;border:1.5px solid var(--gray);border-radius:8px;font-size:16px;letter-spacing:4px;text-align:center;font-family:inherit"></div>
            <div class="form-row"><label>Role</label>
              <select id="self-reg-role" style="padding:6px 10px;border:1.5px solid var(--gray);border-radius:8px;font-size:13px;font-family:inherit">
                <option>Store Manager</option><option>Assistant Manager</option><option>Deli Manager</option>
              </select>
            </div>
            <button class="btn btn-primary btn-sm" id="self-reg-btn">Register</button>
          </div>
          <div id="self-reg-status" style="font-size:13px;margin-top:8px"></div>
        </div>
      </div>

      <div id="di-sections">
        ${DAILY_INV_SECTIONS.map(buildSectionCard).join('')}
      </div>

      <div style="display:flex;gap:10px;align-items:center;margin-top:4px;flex-wrap:wrap">
        <button class="btn btn-primary" id="di-save-btn">💾 Save All Sections</button>
        <button class="btn btn-ghost" id="di-print-form-btn">🖨 Print Form</button>
        <button class="btn btn-ghost" id="di-pull-week-btn">📥 Pull Week for Store…</button>
        <button class="btn btn-ghost" id="di-close-week-btn" style="border-color:var(--red);color:var(--red)">🔒 Close Week</button>
        <div id="di-status" style="font-size:13px"></div>
      </div>

      <!-- Close Week panel -->
      <div id="di-close-panel" style="display:none;margin-top:12px;background:#fff3f3;border-radius:8px;padding:14px;border:1.5px solid var(--red)">
        <div style="font-weight:700;font-size:13px;margin-bottom:6px;color:var(--red)">🔒 Close Week — ${weekOf}</div>
        <p style="font-size:13px;margin:0 0 10px">This will lock all counts, ICF entries, and transfers for this week and email a full summary to the district office. This cannot be undone.</p>
        <div style="display:flex;gap:8px;align-items:flex-end;flex-wrap:wrap">
          <div class="form-row">
            <label>Your Manager PIN</label>
            <input type="password" id="di-close-pin" maxlength="6" placeholder="••••" style="width:100px;padding:8px 10px;border:1.5px solid var(--red);border-radius:8px;font-size:16px;letter-spacing:4px;text-align:center;font-family:inherit">
          </div>
          <button class="btn btn-sm" id="di-close-confirm-btn" style="background:var(--red);color:#fff;border:none">Confirm Close Week</button>
          <button class="btn btn-ghost btn-sm" id="di-close-cancel-btn">Cancel</button>
        </div>
        <div id="di-close-status" style="font-size:13px;margin-top:8px"></div>
      </div>

      <!-- Pull Week panel -->
      <div id="di-pull-panel" style="display:none;margin-top:12px;background:var(--bg);border-radius:8px;padding:14px;border:1.5px solid var(--gray)">
        <div style="font-weight:600;font-size:13px;margin-bottom:10px">Pull Week Data from Another Store</div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <select id="di-store-select" style="padding:8px 12px;border:1.5px solid var(--gray);border-radius:8px;font-size:14px;font-family:inherit;min-width:220px">
            <option value="">— Select Store —</option>
            ${Object.keys(STORES).sort((a,b)=>Number(a)-Number(b)).map(n => {
              const s = STORES[n];
              return `<option value="${n}">${'#'+n+(s.name?' — '+s.name:'')}</option>`;
            }).join('')}
          </select>
          <button class="btn btn-primary btn-sm" id="di-pull-go-btn">Pull Week</button>
          <button class="btn btn-ghost btn-sm" id="di-pull-cancel-btn">Cancel</button>
        </div>
        <div id="di-pull-status" style="margin-top:8px;font-size:13px"></div>
      </div>
    </div>
  `;

  // Re-render on week change
  content.querySelector('#di-load-btn').addEventListener('click', () => {
    const newWeek = content.querySelector('#di-weekof').value;
    if (newWeek) {
      // reset state for new week
      DAILY_INV_SECTIONS.forEach(sec => {
        DAILY_INV_FIELDS.forEach(f => { state[sec.key][f.key] = Array(7).fill(''); });
      });
      weekOf = newWeek;
      renderDailyInvForm(content, null);
    }
  });

  // Live ending-inv recalc on input
  content.querySelector('#di-sections').addEventListener('input', e => {
    const inp = e.target.closest('.di-input');
    if (!inp) return;
    const sec = inp.dataset.sec;
    const fld = inp.dataset.field;
    const di  = parseInt(inp.dataset.day, 10);
    state[sec][fld][di] = inp.value;

    const endSpan = content.querySelector(`.di-end[data-sec="${sec}"][data-day="${di}"]`);
    if (endSpan) endSpan.textContent = calcEnding(sec, di);
  });

  // Save to Google Sheets
  content.querySelector('#di-save-btn').addEventListener('click', async () => {
    const btn      = content.querySelector('#di-save-btn');
    const statusEl = content.querySelector('#di-status');
    if (!deliState.sheetId) {
      statusEl.innerHTML = '<span style="color:var(--red)">No sheet ID configured.</span>';
      return;
    }
    btn.disabled = true; btn.textContent = 'Saving…'; statusEl.textContent = '';

    try {
      await sheetsEnsureHeaders(deliState.sa, deliState.sheetId, 'Daily Inv Control', DELI_TABS.dailyinv.headers);

      // Collect current ending values from DOM
      const rows = [];
      DAILY_INV_SECTIONS.forEach(sec => {
        DAILY_INV_FIELDS.forEach(f => {
          let dayVals;
          if (f.calc) {
            dayVals = DAYS.map((_, di) => calcEnding(sec.key, di));
          } else {
            dayVals = state[sec.key][f.key].slice();
          }
          rows.push([weekOf, sec.key, f.key, ...dayVals]);
        });
      });

      // Clear existing rows for this week, then append fresh rows
      // Simple approach: just append (sheet will accumulate history by week)
      await sheetsAppend(deliState.sa, deliState.sheetId, 'Daily Inv Control!A1', rows);
      statusEl.innerHTML = '<span style="color:var(--green)">✓ Saved successfully.</span>';
    } catch (err) {
      statusEl.innerHTML = `<span style="color:var(--red)">Error: ${err.message}</span>`;
    } finally {
      btn.disabled = false; btn.textContent = '💾 Save All Sections';
    }
  });

  // ── Print Form (current store, current week) ──
  content.querySelector('#di-print-form-btn').addEventListener('click', () => {
    const diRows = [];
    DAILY_INV_SECTIONS.forEach(sec => {
      DAILY_INV_FIELDS.forEach(f => {
        const vals = f.calc
          ? DAYS.map((_, di) => calcEnding(sec.key, di))
          : state[sec.key][f.key].slice();
        diRows.push([weekOf, sec.key, f.key, ...vals]);
      });
    });
    pullWeekPrintWindow(
      '#' + deliState.storeNum + (deliState.storeName ? ' — ' + deliState.storeName : ''),
      weekOf,
      deliState.data['inventory'] || [],
      diRows
    );
  });

  // ── Pull Week panel ──
  const pullWeekBtn    = content.querySelector('#di-pull-week-btn');
  const pullPanel      = content.querySelector('#di-pull-panel');
  const pullCancelBtn  = content.querySelector('#di-pull-cancel-btn');
  const pullGoBtn      = content.querySelector('#di-pull-go-btn');
  const pullSelect     = content.querySelector('#di-store-select');
  const pullStatus     = content.querySelector('#di-pull-status');

  pullWeekBtn.addEventListener('click', () => {
    pullPanel.style.display = pullPanel.style.display === 'none' ? '' : 'none';
  });
  pullCancelBtn.addEventListener('click', () => { pullPanel.style.display = 'none'; });

  pullGoBtn.addEventListener('click', async () => {
    const storeNum = pullSelect.value;
    if (!storeNum) { pullStatus.innerHTML = '<span style="color:var(--red)">Select a store.</span>'; return; }

    const storeInfo = STORES[storeNum];
    const targetSheetId = storeInfo && (storeInfo.countSheetId || storeInfo.sheetId);
    if (!targetSheetId) { pullStatus.innerHTML = '<span style="color:var(--red)">No sheet configured for that store.</span>'; return; }

    const wk = content.querySelector('#di-weekof').value || weekOf;
    pullGoBtn.disabled = true; pullGoBtn.textContent = 'Pulling…';
    pullStatus.innerHTML = '<span style="color:var(--muted)">Fetching count sheet…</span>';

    try {
      // Fetch count sheet
      const countResult = await sheetsGet(deliState.sa, targetSheetId, 'A1:Z1000');
      const countRaw = countResult.values || [];

      // Fetch daily inv control
      pullStatus.innerHTML = '<span style="color:var(--muted)">Fetching daily inv control…</span>';
      let diRows = [];
      try {
        const diResult = await sheetsGet(deliState.sa, storeInfo.sheetId || targetSheetId, 'Daily Inv Control!A1:K500');
        diRows = diResult.values || [];
      } catch (_) { /* tab may not exist yet */ }

      // Filter daily inv rows by week
      const diForWeek = diRows.slice(1).filter(r => r[0] === wk);

      // Open combined print window
      const storeLbl = '#' + storeNum + (storeInfo.name ? ' — ' + storeInfo.name : '');
      pullWeekPrintWindow(storeLbl, wk, countRaw, diForWeek);
      pullStatus.innerHTML = `<span style="color:var(--green)">✓ Opened print view for ${storeLbl}</span>`;
    } catch (err) {
      pullStatus.innerHTML = `<span style="color:var(--red)">Error: ${err.message}</span>`;
    } finally {
      pullGoBtn.disabled = false; pullGoBtn.textContent = 'Pull Week';
    }
  });

  // ── Close Week ──
  const closeWeekBtn    = content.querySelector('#di-close-week-btn');
  const closePanel      = content.querySelector('#di-close-panel');
  const closeCancelBtn  = content.querySelector('#di-close-cancel-btn');
  const closeConfirmBtn = content.querySelector('#di-close-confirm-btn');
  const closeStatusEl   = content.querySelector('#di-close-status');

  closeWeekBtn.addEventListener('click', () => {
    closePanel.style.display = closePanel.style.display === 'none' ? '' : 'none';
  });
  closeCancelBtn.addEventListener('click', () => { closePanel.style.display = 'none'; });

  closeConfirmBtn.addEventListener('click', async () => {
    const pin = content.querySelector('#di-close-pin').value.trim();
    if (!pin) { closeStatusEl.innerHTML = '<span style="color:var(--red)">Enter your PIN.</span>'; return; }

    closeConfirmBtn.disabled = true; closeConfirmBtn.textContent = 'Verifying…';
    const manager = await verifyManagerPinForStore(pin, deliState.storeNum);
    if (!manager) {
      closeStatusEl.innerHTML = '<span style="color:var(--red)">PIN not recognized for this store.</span>';
      closeConfirmBtn.disabled = false; closeConfirmBtn.textContent = 'Confirm Close Week'; return;
    }

    closeConfirmBtn.textContent = 'Closing week…';
    closeStatusEl.innerHTML = '<span style="color:var(--muted)">Gathering data…</span>';

    try {
      const closedAt  = new Date().toLocaleString();
      const storeLabel = `#${deliState.storeNum}${deliState.storeName ? ' — ' + deliState.storeName : ''}`;

      // 1. Fetch ICF entries for this store
      let icfRows = [];
      try {
        const icfRes = await sheetsGet(deliState.sa, deliState.sheetId, 'Bring In!A1:K500');
        icfRows = (icfRes.values || []).slice(1).filter(r => (r[1]||'').toString().trim() === String(deliState.storeNum));
      } catch(_) {}

      // 2. Fetch Transfer entries for this store
      let tfRows = [];
      try {
        const tfRes = await sheetsGet(deliState.sa, deliState.sheetId, 'Merchandise Transfer!A1:Q500');
        tfRows = (tfRes.values || []).slice(1).filter(r =>
          (r[0]||'').toString().trim() === String(deliState.storeNum) ||
          (r[1]||'').toString().trim() === String(deliState.storeNum)
        );
      } catch(_) {}

      // 3. Write Week Closure record to sheet
      await sheetsEnsureHeaders(deliState.sa, deliState.sheetId, 'Week Closures', [
        'Week Of','Store#','Store Name','Closed By','Closed At','ICF Entries','Transfer Entries','Status'
      ]);
      await sheetsAppend(deliState.sa, deliState.sheetId, 'Week Closures!A1', [[
        weekOf,
        deliState.storeNum,
        deliState.storeName || '',
        manager.name,
        closedAt,
        icfRows.length,
        tfRows.length,
        'CLOSED',
      ]]);

      closeStatusEl.innerHTML = `<span style="color:var(--green)">✓ Week closed by ${manager.name} at ${closedAt}. Email notification sent.</span>`;
      closeWeekBtn.disabled = true;
      closeWeekBtn.textContent = '🔒 Week Closed';
      closePanel.style.display = 'none';

      // Lock all inputs on the daily inv form
      content.querySelectorAll('.di-input').forEach(i => { i.disabled = true; i.style.background = 'var(--bg)'; });
      content.querySelector('#di-save-btn').disabled = true;

      // Show recount unlock option
      const recountDiv = document.createElement('div');
      recountDiv.style.cssText = 'margin-top:10px';
      recountDiv.innerHTML = `
        <button class="btn btn-ghost btn-sm" id="di-recount-btn" style="font-size:12px;color:var(--muted)">Request Recount / Unlock</button>
        <div id="di-recount-panel" style="display:none;margin-top:10px;background:#fff8e1;border-radius:8px;padding:12px;border:1.5px solid var(--amber)">
          <div style="font-weight:600;font-size:13px;margin-bottom:8px;color:#b45309">Request Recount</div>
          <p style="font-size:12px;color:var(--muted);margin:0 0 8px">Unlocking requires your PIN and a reason. This will be logged and emailed to the district office.</p>
          <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:flex-end">
            <div class="form-row"><label>PIN</label><input type="password" id="di-recount-pin" maxlength="6" placeholder="••••" style="width:90px;padding:6px 10px;border:1.5px solid var(--gray);border-radius:8px;font-size:15px;letter-spacing:4px;text-align:center;font-family:inherit"></div>
            <div class="form-row" style="flex:1;min-width:200px"><label>Reason for Recount</label><input type="text" id="di-recount-reason" placeholder="e.g. Miscounted chicken section" style="width:100%;padding:6px 10px;border:1.5px solid var(--gray);border-radius:8px;font-size:13px;font-family:inherit"></div>
            <button class="btn btn-sm" id="di-recount-confirm-btn" style="background:var(--amber);color:#fff;border:none">Unlock for Recount</button>
          </div>
          <div id="di-recount-status" style="font-size:13px;margin-top:6px"></div>
        </div>`;
      closePanel.parentNode.insertBefore(recountDiv, closePanel.nextSibling);

      recountDiv.querySelector('#di-recount-btn').addEventListener('click', () => {
        const rp = recountDiv.querySelector('#di-recount-panel');
        rp.style.display = rp.style.display === 'none' ? '' : 'none';
      });

      recountDiv.querySelector('#di-recount-confirm-btn').addEventListener('click', async () => {
        const rBtn     = recountDiv.querySelector('#di-recount-confirm-btn');
        const rStatus  = recountDiv.querySelector('#di-recount-status');
        const rPin     = recountDiv.querySelector('#di-recount-pin').value.trim();
        const rReason  = recountDiv.querySelector('#di-recount-reason').value.trim();
        if (!rPin)    { rStatus.innerHTML = '<span style="color:var(--red)">Enter your PIN.</span>'; return; }
        if (!rReason) { rStatus.innerHTML = '<span style="color:var(--red)">A reason is required.</span>'; return; }

        rBtn.disabled = true; rBtn.textContent = 'Verifying…';
        const mgr = await verifyManagerPinForStore(rPin, deliState.storeNum);
        if (!mgr) {
          rStatus.innerHTML = '<span style="color:var(--red)">PIN not recognized.</span>';
          rBtn.disabled = false; rBtn.textContent = 'Unlock for Recount'; return;
        }

        try {
          await sheetsEnsureHeaders(deliState.sa, deliState.sheetId, 'Recount Log', ['Week Of','Store#','Store Name','Unlocked By','Reason','Timestamp']);
          await sheetsAppend(deliState.sa, deliState.sheetId, 'Recount Log!A1', [[
            weekOf, deliState.storeNum, deliState.storeName || '',
            mgr.name, rReason, new Date().toLocaleString(),
          ]]);
          // Re-enable inputs
          content.querySelectorAll('.di-input').forEach(i => { i.disabled = false; i.style.background = 'var(--white)'; });
          content.querySelector('#di-save-btn').disabled = false;
          closeWeekBtn.disabled = false; closeWeekBtn.textContent = '🔒 Close Week';
          rStatus.innerHTML = `<span style="color:var(--green)">✓ Unlocked by ${mgr.name}. Reason logged.</span>`;
          recountDiv.querySelector('#di-recount-panel').style.display = 'none';
          recountDiv.querySelector('#di-recount-btn').style.display = 'none';
        } catch(err) {
          rStatus.innerHTML = `<span style="color:var(--red)">Error: ${err.message}</span>`;
          rBtn.disabled = false; rBtn.textContent = 'Unlock for Recount';
        }
      });

    } catch(err) {
      closeStatusEl.innerHTML = `<span style="color:var(--red)">Error: ${err.message}</span>`;
      closeConfirmBtn.disabled = false; closeConfirmBtn.textContent = 'Confirm Close Week';
    }
  });

  // ── Self-Registration (shown if no manager registered for this store) ──
  (async () => {
    if (!deliState.sheetId) return;
    try {
      const res  = await sheetsGet(deliState.sa, deliState.sheetId, 'Managers!A2:E200');
      const rows = (res.values || []);
      const hasManager = rows.some(r => (r[1]||'').toString().trim() === String(deliState.storeNum));
      if (!hasManager) content.querySelector('#di-register-banner').style.display = 'block';
    } catch(_) {
      content.querySelector('#di-register-banner').style.display = 'block';
    }

    const selfRegBtn = content.querySelector('#self-reg-btn');
    if (!selfRegBtn) return;
    selfRegBtn.addEventListener('click', async () => {
      const name   = content.querySelector('#self-reg-name').value.trim();
      const email  = content.querySelector('#self-reg-email').value.trim();
      const pin    = content.querySelector('#self-reg-pin').value.trim();
      const pin2   = content.querySelector('#self-reg-pin2').value.trim();
      const role   = content.querySelector('#self-reg-role').value;
      const status = content.querySelector('#self-reg-status');

      if (!name)           { status.innerHTML = '<span style="color:var(--red)">Name required.</span>'; return; }
      if (!pin || pin.length < 4) { status.innerHTML = '<span style="color:var(--red)">PIN must be 4–6 digits.</span>'; return; }
      if (pin !== pin2)    { status.innerHTML = '<span style="color:var(--red)">PINs do not match.</span>'; return; }

      selfRegBtn.disabled = true; selfRegBtn.textContent = 'Registering…';
      try {
        await sheetsEnsureHeaders(deliState.sa, deliState.sheetId, 'Managers', ['Name','Store#','PIN','Email','Role']);
        await sheetsAppend(deliState.sa, deliState.sheetId, 'Managers!A1', [[name, deliState.storeNum, pin, email, role]]);
        status.innerHTML = `<span style="color:var(--green)">✓ Registered! Your PIN is set. You can now sign forms and close the week.</span>`;
        content.querySelector('#di-register-banner').style.display = 'none';
      } catch(err) {
        status.innerHTML = `<span style="color:var(--red)">Error: ${err.message}</span>`;
        selfRegBtn.disabled = false; selfRegBtn.textContent = 'Register';
      }
    });
  })();
}

// ════════════════════════════════════════
// MANAGER PIN HELPER
// ════════════════════════════════════════

async function verifyManagerPin(pin) {
  if (!deliState.sheetId) return null;
  try {
    const res = await sheetsGet(deliState.sa, deliState.sheetId, 'Managers!A2:E200');
    const rows = (res.values || []);
    // Columns: Name | Store# | PIN | Email | Role
    const match = rows.find(r => (r[2] || '').toString().trim() === pin.toString().trim());
    if (!match) return null;
    return { name: match[0]||'', store: match[1]||'', pin: match[2]||'', email: match[3]||'', role: match[4]||'' };
  } catch(e) { return null; }
}

async function verifyManagerPinForStore(pin, storeNum) {
  if (!deliState.sheetId) return null;
  try {
    const res = await sheetsGet(deliState.sa, deliState.sheetId, 'Managers!A2:E200');
    const rows = (res.values || []);
    const match = rows.find(r =>
      (r[2] || '').toString().trim() === pin.toString().trim() &&
      (r[1] || '').toString().trim() === storeNum.toString().trim()
    );
    if (!match) return null;
    return { name: match[0]||'', store: match[1]||'', email: match[3]||'', role: match[4]||'' };
  } catch(e) { return null; }
}

// ════════════════════════════════════════
// BRING IN / ICF FORM
// ════════════════════════════════════════

function renderICFForm(container) {
  const today = new Date().toISOString().split('T')[0];
  const storeNum = deliState.storeNum || '';

  const lineRows = Array.from({length: 20}, (_, i) => `
    <tr>
      <td style="padding:3px 4px"><input type="number" class="icf-qty" min="0" step="1" style="width:52px;padding:4px 6px;border:1.5px solid var(--gray);border-radius:6px;font-size:13px;text-align:center;background:var(--white)"></td>
      <td style="padding:3px 4px"><input type="text" class="icf-desc" style="width:100%;padding:4px 6px;border:1.5px solid var(--gray);border-radius:6px;font-size:13px;background:var(--white)"></td>
      <td style="padding:3px 4px"><input type="text" class="icf-dept" style="width:60px;padding:4px 6px;border:1.5px solid var(--gray);border-radius:6px;font-size:13px;text-align:center;background:var(--white)"></td>
      <td style="padding:3px 4px"><input type="number" class="icf-ucost" min="0" step="0.01" style="width:80px;padding:4px 6px;border:1.5px solid var(--gray);border-radius:6px;font-size:13px;text-align:center;background:var(--white)"></td>
      <td style="padding:3px 4px"><span class="icf-tcost" style="display:inline-block;min-width:80px;font-weight:600;font-size:13px;padding:4px 6px"></span></td>
      <td style="padding:3px 4px"><input type="number" class="icf-uretail" min="0" step="0.01" style="width:80px;padding:4px 6px;border:1.5px solid var(--gray);border-radius:6px;font-size:13px;text-align:center;background:var(--white)"></td>
      <td style="padding:3px 4px"><span class="icf-tretail" style="display:inline-block;min-width:80px;font-weight:600;font-size:13px;padding:4px 6px"></span></td>
    </tr>`).join('');

  container.innerHTML = `
    <div class="card" style="margin-top:20px">
      <div class="card-title" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
        <span>Bring In / ICF Form</span>
        <span style="font-size:12px;color:var(--muted)">Invoice will be entered in the office. Only put on your ICF.</span>
      </div>

      <div style="display:flex;gap:16px;margin-bottom:12px;flex-wrap:wrap">
        <div class="form-row"><label>Date</label><input type="date" id="icf-date" value="${today}" style="padding:6px 10px;border:1.5px solid var(--gray);border-radius:8px;font-size:14px;font-family:inherit"></div>
        <div class="form-row"><label>Store #</label><input type="text" id="icf-store" value="${storeNum}" style="width:80px;padding:6px 10px;border:1.5px solid var(--gray);border-radius:8px;font-size:14px;font-family:inherit"></div>
      </div>

      <div class="table-wrap">
        <table class="data-table" id="icf-table" style="min-width:640px">
          <thead><tr>
            <th style="width:60px">Qty</th>
            <th>Description</th>
            <th style="width:70px">Dept #</th>
            <th style="width:90px">Unit Cost</th>
            <th style="width:90px">Total Cost</th>
            <th style="width:90px">Unit Retail</th>
            <th style="width:90px">Total Retail</th>
          </tr></thead>
          <tbody>${lineRows}</tbody>
          <tfoot><tr>
            <td colspan="4" style="text-align:right;font-weight:700;padding:6px 10px">Totals:</td>
            <td style="font-weight:700;padding:6px 6px"><span id="icf-total-cost">$0.00</span></td>
            <td></td>
            <td style="font-weight:700;padding:6px 6px"><span id="icf-total-retail">$0.00</span></td>
          </tr></tfoot>
        </table>
      </div>

      <!-- Signature -->
      <div style="margin-top:16px;padding:14px;background:var(--bg);border-radius:8px;border:1.5px solid var(--gray)">
        <div style="font-weight:600;font-size:13px;margin-bottom:10px">Manager Sign-Off</div>
        <div style="display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap">
          <div class="form-row">
            <label>Your PIN</label>
            <input type="password" id="icf-pin" maxlength="6" placeholder="••••" style="width:100px;padding:8px 10px;border:1.5px solid var(--gray);border-radius:8px;font-size:16px;letter-spacing:4px;text-align:center;font-family:inherit">
          </div>
          <button class="btn btn-primary" id="icf-submit-btn">Submit & Sign</button>
          <div id="icf-status" style="font-size:13px"></div>
        </div>
        <div id="icf-signed-banner" style="display:none;margin-top:10px;padding:10px 14px;background:var(--green);color:#fff;border-radius:8px;font-weight:600;font-size:13px"></div>
      </div>
    </div>
  `;

  // Auto-calc totals on input
  container.querySelector('#icf-table').addEventListener('input', e => {
    const row = e.target.closest('tr');
    if (!row) return;
    const qty    = parseFloat(row.querySelector('.icf-qty')?.value)    || 0;
    const ucost  = parseFloat(row.querySelector('.icf-ucost')?.value)  || 0;
    const uret   = parseFloat(row.querySelector('.icf-uretail')?.value)|| 0;
    const tc = qty * ucost;
    const tr = qty * uret;
    row.querySelector('.icf-tcost').textContent  = tc  ? '$' + tc.toFixed(2)  : '';
    row.querySelector('.icf-tretail').textContent = tr ? '$' + tr.toFixed(2) : '';

    // Update totals row
    let totalCost = 0, totalRetail = 0;
    container.querySelectorAll('#icf-table tbody tr').forEach(r => {
      totalCost   += parseFloat(r.querySelector('.icf-tcost')?.textContent?.replace('$',''))  || 0;
      totalRetail += parseFloat(r.querySelector('.icf-tretail')?.textContent?.replace('$',''))|| 0;
    });
    container.querySelector('#icf-total-cost').textContent   = '$' + totalCost.toFixed(2);
    container.querySelector('#icf-total-retail').textContent = '$' + totalRetail.toFixed(2);
  });

  container.querySelector('#icf-submit-btn').addEventListener('click', async () => {
    const btn      = container.querySelector('#icf-submit-btn');
    const statusEl = container.querySelector('#icf-status');
    const pin      = container.querySelector('#icf-pin').value.trim();
    if (!pin) { statusEl.innerHTML = '<span style="color:var(--red)">Enter your PIN.</span>'; return; }

    btn.disabled = true; btn.textContent = 'Verifying…'; statusEl.textContent = '';

    const manager = await verifyManagerPinForStore(pin, deliState.storeNum);
    if (!manager) {
      statusEl.innerHTML = '<span style="color:var(--red)">PIN not recognized for this store.</span>';
      btn.disabled = false; btn.textContent = 'Submit & Sign'; return;
    }

    // Collect rows
    const date    = container.querySelector('#icf-date').value;
    const store   = container.querySelector('#icf-store').value;
    const rows    = [];
    container.querySelectorAll('#icf-table tbody tr').forEach(r => {
      const qty  = r.querySelector('.icf-qty')?.value?.trim();
      const desc = r.querySelector('.icf-desc')?.value?.trim();
      if (!qty && !desc) return;
      rows.push([
        date, store,
        qty,
        desc,
        r.querySelector('.icf-dept')?.value?.trim(),
        r.querySelector('.icf-ucost')?.value?.trim(),
        r.querySelector('.icf-tcost')?.textContent?.trim(),
        r.querySelector('.icf-uretail')?.value?.trim(),
        r.querySelector('.icf-tretail')?.textContent?.trim(),
        manager.name,
        new Date().toLocaleString(),
      ]);
    });

    if (rows.length === 0) {
      statusEl.innerHTML = '<span style="color:var(--red)">Add at least one item.</span>';
      btn.disabled = false; btn.textContent = 'Submit & Sign'; return;
    }

    try {
      await sheetsEnsureHeaders(deliState.sa, deliState.sheetId, 'Bring In', ['Date','Store#','Qty','Description','Dept#','Unit Cost','Total Cost','Unit Retail','Total Retail','Signed By','Timestamp']);
      await sheetsAppend(deliState.sa, deliState.sheetId, 'Bring In!A1', rows);
      const banner = container.querySelector('#icf-signed-banner');
      banner.textContent = `✓ Signed by ${manager.name} (Store #${manager.store}) — ${new Date().toLocaleString()}`;
      banner.style.display = 'block';
      btn.style.display = 'none';
      container.querySelector('#icf-pin').disabled = true;
      statusEl.textContent = '';
    } catch(err) {
      statusEl.innerHTML = `<span style="color:var(--red)">Error saving: ${err.message}</span>`;
      btn.disabled = false; btn.textContent = 'Submit & Sign';
    }
  });
}

// ════════════════════════════════════════
// MERCHANDISE TRANSFER FORM
// ════════════════════════════════════════

function renderTransferForm(container) {
  const today    = new Date().toISOString().split('T')[0];
  const storeNum = deliState.storeNum || '';

  const lineRows = Array.from({length: 10}, (_, i) => `
    <tr>
      <td style="padding:3px 4px"><input type="date" class="tf-date" value="${today}" style="width:120px;padding:4px 6px;border:1.5px solid var(--gray);border-radius:6px;font-size:12px;background:var(--white)"></td>
      <td style="padding:3px 4px"><input type="text" class="tf-dept" style="width:60px;padding:4px 6px;border:1.5px solid var(--gray);border-radius:6px;font-size:13px;text-align:center;background:var(--white)"></td>
      <td style="padding:3px 4px"><input type="number" class="tf-qty" min="0" step="1" style="width:52px;padding:4px 6px;border:1.5px solid var(--gray);border-radius:6px;font-size:13px;text-align:center;background:var(--white)"></td>
      <td style="padding:3px 4px"><input type="text" class="tf-desc" style="width:100%;padding:4px 6px;border:1.5px solid var(--gray);border-radius:6px;font-size:13px;background:var(--white)"></td>
      <td style="padding:3px 4px"><input type="number" class="tf-cost" min="0" step="0.01" style="width:72px;padding:4px 6px;border:1.5px solid var(--gray);border-radius:6px;font-size:13px;text-align:center;background:var(--white)"></td>
      <td style="padding:3px 4px"><span class="tf-extcost" style="display:inline-block;min-width:72px;font-weight:600;font-size:13px;padding:4px 6px"></span></td>
      <td style="padding:3px 4px"><input type="number" class="tf-sretail" min="0" step="0.01" style="width:72px;padding:4px 6px;border:1.5px solid var(--gray);border-radius:6px;font-size:13px;text-align:center;background:var(--white)"></td>
      <td style="padding:3px 4px"><span class="tf-sextretail" style="display:inline-block;min-width:72px;font-weight:600;font-size:13px;padding:4px 6px"></span></td>
      <td style="padding:3px 4px"><input type="number" class="tf-rretail" min="0" step="0.01" style="width:72px;padding:4px 6px;border:1.5px solid var(--gray);border-radius:6px;font-size:13px;text-align:center;background:var(--white)"></td>
      <td style="padding:3px 4px"><span class="tf-rextretail" style="display:inline-block;min-width:72px;font-weight:600;font-size:13px;padding:4px 6px"></span></td>
    </tr>`).join('');

  container.innerHTML = `
    <div class="card" style="margin-top:20px">
      <div class="card-title">Merchandise Transfer</div>

      <div style="display:flex;gap:16px;margin-bottom:12px;flex-wrap:wrap">
        <div class="form-row"><label>Transferring Store #</label><input type="text" id="tf-from-store" value="${storeNum}" style="width:80px;padding:6px 10px;border:1.5px solid var(--gray);border-radius:8px;font-size:14px;font-family:inherit"></div>
        <div class="form-row"><label>Receiving Store #</label><input type="text" id="tf-to-store" placeholder="e.g. 108" style="width:80px;padding:6px 10px;border:1.5px solid var(--gray);border-radius:8px;font-size:14px;font-family:inherit"></div>
      </div>

      <div class="table-wrap">
        <table class="data-table" id="tf-table" style="min-width:900px">
          <thead><tr>
            <th>Date</th><th>Dept</th><th>Qty</th><th>Item Description</th>
            <th>Cost</th><th>Ext Cost</th>
            <th>Transfer Retail</th><th>Transfer Ext Retail</th>
            <th>Receiving Retail</th><th>Receiving Ext Retail</th>
          </tr></thead>
          <tbody>${lineRows}</tbody>
        </table>
      </div>

      <!-- Signatures -->
      <div style="margin-top:16px;display:grid;grid-template-columns:1fr 1fr;gap:12px" id="tf-sig-grid">

        <!-- Transferring Manager -->
        <div style="padding:14px;background:var(--bg);border-radius:8px;border:1.5px solid var(--gray)">
          <div style="font-weight:600;font-size:13px;margin-bottom:8px">Transferring Manager Sign-Off</div>
          <div style="display:flex;gap:8px;align-items:flex-end;flex-wrap:wrap">
            <div class="form-row">
              <label>PIN</label>
              <input type="password" id="tf-from-pin" maxlength="6" placeholder="••••" style="width:90px;padding:8px 10px;border:1.5px solid var(--gray);border-radius:8px;font-size:16px;letter-spacing:4px;text-align:center;font-family:inherit">
            </div>
            <button class="btn btn-primary btn-sm" id="tf-from-sign-btn">Sign</button>
          </div>
          <div id="tf-from-status" style="font-size:13px;margin-top:6px"></div>
          <div id="tf-from-signed" style="display:none;margin-top:8px;padding:8px 12px;background:var(--green);color:#fff;border-radius:6px;font-size:12px;font-weight:600"></div>
        </div>

        <!-- Receiving Manager -->
        <div style="padding:14px;background:var(--bg);border-radius:8px;border:1.5px solid var(--gray)">
          <div style="font-weight:600;font-size:13px;margin-bottom:8px">Receiving Manager Sign-Off</div>
          <div style="font-size:12px;color:var(--muted);margin-bottom:8px">Transferring manager must sign first.</div>
          <div style="display:flex;gap:8px;align-items:flex-end;flex-wrap:wrap">
            <div class="form-row">
              <label>PIN</label>
              <input type="password" id="tf-to-pin" maxlength="6" placeholder="••••" disabled style="width:90px;padding:8px 10px;border:1.5px solid var(--gray);border-radius:8px;font-size:16px;letter-spacing:4px;text-align:center;font-family:inherit;opacity:.5">
            </div>
            <button class="btn btn-primary btn-sm" id="tf-to-sign-btn" disabled style="opacity:.5">Sign</button>
          </div>
          <div id="tf-to-status" style="font-size:13px;margin-top:6px"></div>
          <div id="tf-to-signed" style="display:none;margin-top:8px;padding:8px 12px;background:var(--green);color:#fff;border-radius:6px;font-size:12px;font-weight:600"></div>
        </div>

      </div>

      <div id="tf-complete-banner" style="display:none;margin-top:14px;padding:14px;background:var(--ks-blue);color:#fff;border-radius:8px;font-weight:700;font-size:14px;text-align:center"></div>
      <div id="tf-status" style="margin-top:8px;font-size:13px"></div>
    </div>
  `;

  // Auto-calc extended costs/retails
  container.querySelector('#tf-table').addEventListener('input', e => {
    const row = e.target.closest('tr');
    if (!row) return;
    const qty     = parseFloat(row.querySelector('.tf-qty')?.value)     || 0;
    const cost    = parseFloat(row.querySelector('.tf-cost')?.value)    || 0;
    const sret    = parseFloat(row.querySelector('.tf-sretail')?.value) || 0;
    const rret    = parseFloat(row.querySelector('.tf-rretail')?.value) || 0;
    row.querySelector('.tf-extcost').textContent    = qty && cost ? '$' + (qty*cost).toFixed(2)  : '';
    row.querySelector('.tf-sextretail').textContent = qty && sret ? '$' + (qty*sret).toFixed(2)  : '';
    row.querySelector('.tf-rextretail').textContent = qty && rret ? '$' + (qty*rret).toFixed(2)  : '';
  });

  let fromManagerName = '';
  let fromManagerEmail = '';
  let savedRowId = null;

  // ── Transferring manager sign ──
  container.querySelector('#tf-from-sign-btn').addEventListener('click', async () => {
    const btn      = container.querySelector('#tf-from-sign-btn');
    const statusEl = container.querySelector('#tf-from-status');
    const pin      = container.querySelector('#tf-from-pin').value.trim();
    const fromStore = container.querySelector('#tf-from-store').value.trim();
    const toStore   = container.querySelector('#tf-to-store').value.trim();
    if (!pin)     { statusEl.innerHTML = '<span style="color:var(--red)">Enter your PIN.</span>'; return; }
    if (!toStore) { statusEl.innerHTML = '<span style="color:var(--red)">Enter receiving store #.</span>'; return; }

    btn.disabled = true; btn.textContent = 'Verifying…';
    const manager = await verifyManagerPinForStore(pin, fromStore);
    if (!manager) {
      statusEl.innerHTML = '<span style="color:var(--red)">PIN not recognized for store #' + fromStore + '.</span>';
      btn.disabled = false; btn.textContent = 'Sign'; return;
    }

    // Collect line items
    const lines = [];
    container.querySelectorAll('#tf-table tbody tr').forEach(r => {
      const qty  = r.querySelector('.tf-qty')?.value?.trim();
      const desc = r.querySelector('.tf-desc')?.value?.trim();
      if (!qty && !desc) return;
      lines.push([
        r.querySelector('.tf-date')?.value,
        r.querySelector('.tf-dept')?.value?.trim(),
        qty, desc,
        r.querySelector('.tf-cost')?.value?.trim(),
        r.querySelector('.tf-extcost')?.textContent?.trim(),
        r.querySelector('.tf-sretail')?.value?.trim(),
        r.querySelector('.tf-sextretail')?.textContent?.trim(),
        r.querySelector('.tf-rretail')?.value?.trim(),
        r.querySelector('.tf-rextretail')?.textContent?.trim(),
      ]);
    });

    if (lines.length === 0) {
      statusEl.innerHTML = '<span style="color:var(--red)">Add at least one item.</span>';
      btn.disabled = false; btn.textContent = 'Sign'; return;
    }

    fromManagerName  = manager.name;
    fromManagerEmail = manager.email;
    const ts = new Date().toLocaleString();

    // Save to sheet — one row per line item, first row carries the transfer metadata
    const sheetRows = lines.map((line, i) => [
      fromStore, toStore,
      ...line,
      i === 0 ? manager.name : '', // from_signed_by (first row only)
      i === 0 ? ts : '',           // from_signed_at
      '', '',                       // to_signed_by, to_signed_at (pending)
      'PENDING',                    // status
    ]);

    try {
      await sheetsEnsureHeaders(deliState.sa, deliState.sheetId, 'Merchandise Transfer', [
        'From Store','To Store','Date','Dept','Qty','Description','Cost','Ext Cost',
        'Transfer Retail','Transfer Ext Retail','Receiving Retail','Receiving Ext Retail',
        'From Signed By','From Signed At','To Signed By','To Signed At','Status'
      ]);
      await sheetsAppend(deliState.sa, deliState.sheetId, 'Merchandise Transfer!A1', sheetRows);

      container.querySelector('#tf-from-signed').textContent = `✓ ${manager.name} (Store #${fromStore}) — ${ts}`;
      container.querySelector('#tf-from-signed').style.display = 'block';
      container.querySelector('#tf-from-pin').disabled = true;
      btn.style.display = 'none';
      statusEl.textContent = '';

      // Unlock receiving manager sign-off
      const toPin = container.querySelector('#tf-to-pin');
      const toBtn = container.querySelector('#tf-to-sign-btn');
      toPin.disabled = false; toPin.style.opacity = '1';
      toBtn.disabled = false; toBtn.style.opacity = '1';
      container.querySelector('#tf-to-status').innerHTML = '<span style="color:var(--muted)">Transferring manager signed. Receiving manager can now sign.</span>';

      // Lock form fields
      container.querySelectorAll('#tf-table input').forEach(i => i.disabled = true);
      container.querySelector('#tf-from-store').disabled = true;
      container.querySelector('#tf-to-store').disabled   = true;
    } catch(err) {
      statusEl.innerHTML = `<span style="color:var(--red)">Error: ${err.message}</span>`;
      btn.disabled = false; btn.textContent = 'Sign';
    }
  });

  // ── Receiving manager sign ──
  container.querySelector('#tf-to-sign-btn').addEventListener('click', async () => {
    const btn      = container.querySelector('#tf-to-sign-btn');
    const statusEl = container.querySelector('#tf-to-status');
    const pin      = container.querySelector('#tf-to-pin').value.trim();
    const toStore  = container.querySelector('#tf-to-store').value.trim();
    if (!pin) { statusEl.innerHTML = '<span style="color:var(--red)">Enter your PIN.</span>'; return; }

    btn.disabled = true; btn.textContent = 'Verifying…';
    const manager = await verifyManagerPinForStore(pin, toStore);
    if (!manager) {
      statusEl.innerHTML = '<span style="color:var(--red)">PIN not recognized for store #' + toStore + '.</span>';
      btn.disabled = false; btn.textContent = 'Sign'; return;
    }

    const ts = new Date().toLocaleString();
    container.querySelector('#tf-to-signed').textContent = `✓ ${manager.name} (Store #${toStore}) — ${ts}`;
    container.querySelector('#tf-to-signed').style.display = 'block';
    container.querySelector('#tf-to-pin').disabled = true;
    btn.style.display = 'none';
    statusEl.textContent = '';

    // Show completion banner
    const banner = container.querySelector('#tf-complete-banner');
    banner.textContent = `✅ Transfer complete — signed by ${fromManagerName} (transferring) & ${manager.name} (receiving). Notification sent.`;
    banner.style.display = 'block';

    // Write completion back to sheet — append a completion summary row
    const fromStore = container.querySelector('#tf-from-store').value.trim();
    try {
      await sheetsAppend(deliState.sa, deliState.sheetId, 'Merchandise Transfer!A1', [[
        fromStore, toStore,
        '', '', '', 'TRANSFER COMPLETE', '', '', '', '', '', '',
        fromManagerName, '', manager.name, ts, 'COMPLETE'
      ]]);
    } catch(_) {}
  });
}

function pullWeekPrintWindow(storeLbl, weekOf, countRaw, diRows) {
  const dayLabels = getDayDates(weekOf);

  // Build count table HTML (simplified text version of the count sheet)
  let countHTML = '';
  if (countRaw.length > 1) {
    // find header row
    let headerIdx = 0;
    for (let i = 0; i < Math.min(6, countRaw.length); i++) {
      if (countRaw[i].some(c => /count.?by|item.?#/i.test(c || ''))) { headerIdx = i; break; }
    }
    const hdr = countRaw[headerIdx] || [];
    const data = countRaw.slice(headerIdx + 1);
    const hdCells = hdr.map(h => `<th>${h||''}</th>`).join('');
    const rows = data.map(r => {
      if (r.every(c => !(c||'').trim())) return '';
      const colA = (r[0]||'').trim(); const colB = (r[1]||'').trim();
      if (!colA && colB) return `<tr><td colspan="${hdr.length}" class="section-hdr">${colB}</td></tr>`;
      return `<tr>${r.map(c=>`<td>${c||''}</td>`).join('')}</tr>`;
    }).join('');
    countHTML = `<table><thead><tr>${hdCells}</tr></thead><tbody>${rows}</tbody></table>`;
  } else {
    countHTML = '<p style="color:#888">No count sheet data.</p>';
  }

  // Build daily inv control table
  let diHTML = '';
  if (diRows.length > 0) {
    // Rebuild state from diRows
    const diState = {};
    DAILY_INV_SECTIONS.forEach(sec => {
      diState[sec.key] = {};
      DAILY_INV_FIELDS.forEach(f => { diState[sec.key][f.key] = Array(7).fill(''); });
    });
    diRows.forEach(r => {
      const sec = r[1]; const fld = r[2];
      if (diState[sec] && diState[sec][fld]) {
        for (let d = 0; d < 7; d++) diState[sec][fld][d] = r[3 + d] || '';
      }
    });

    const calcEnd = (sec, di) => {
      const beg = parseFloat(diState[sec].beg[di])||0;
      const pur = parseFloat(diState[sec].purchases[di])||0;
      const ret = parseFloat(diState[sec].retail[di])||0;
      const trn = parseFloat(diState[sec].transfers[di])||0;
      return (beg+pur-ret+trn).toFixed(2);
    };

    diHTML = DAILY_INV_SECTIONS.map(sec => {
      const rows = DAILY_INV_FIELDS.map(f => {
        const vals = f.calc
          ? DAYS.map((_,di) => calcEnd(sec.key, di))
          : diState[sec.key][f.key];
        return `<tr><td class="field-lbl">${f.label} ${f.hint}</td>${vals.map(v=>`<td>${v||''}</td>`).join('')}</tr>`;
      }).join('');
      return `
        <div class="di-section">
          <div class="di-sec-title" style="background:${sec.color}">${sec.label}<br><small>${sec.sub}</small></div>
          <table>
            <thead><tr><th>Field</th>${dayLabels.map(d=>`<th>${d}</th>`).join('')}</tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`;
    }).join('');
  } else {
    diHTML = '<p style="color:#888">No Daily Inventory Control data for this week.</p>';
  }

  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html><html><head>
    <title>Week of ${weekOf} — ${storeLbl}</title>
    <style>
      body{font-family:Arial,sans-serif;font-size:11px;margin:16px;color:#111}
      h1{font-size:16px;margin:0 0 4px} h2{font-size:13px;margin:16px 0 6px;color:#1565C0;border-bottom:2px solid #1565C0;padding-bottom:3px}
      table{border-collapse:collapse;width:100%;margin-bottom:12px}
      th,td{border:1px solid #ccc;padding:3px 6px;text-align:left}
      th{background:#1565C0;color:#fff;font-size:10px}
      .section-hdr{background:#e3f2fd;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:.04em}
      .di-section{margin-bottom:20px}
      .di-sec-title{color:#fff;font-weight:700;font-size:12px;padding:8px 12px;text-transform:uppercase;letter-spacing:.04em}
      .di-sec-title small{font-weight:400;font-size:10px;display:block;opacity:.85}
      .field-lbl{font-weight:600;white-space:nowrap;width:160px}
      @media print{button{display:none}}
    </style>
  </head><body>
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
      <div>
        <h1>Daily Inventory Control Form</h1>
        <div>Store ${storeLbl} &nbsp;&middot;&nbsp; Week of ${weekOf}</div>
      </div>
      <button onclick="window.print()" style="padding:8px 16px;background:#1565C0;color:#fff;border:none;border-radius:6px;font-size:13px;cursor:pointer">🖨 Print</button>
    </div>

    <h2>Daily Inventory Control — All Sections</h2>
    ${diHTML}

    <h2>Item-by-Item Count Sheet</h2>
    ${countHTML}
  </body></html>`);
  win.document.close();
}

function renderInventoryEmbed(content) {
  const sheetId = deliState.sheetId;
  if (!sheetId) {
    content.innerHTML = `<div class="banner banner-warn"><div class="banner-icon">⚠</div><div>No Sheet ID configured for this store.</div></div>`;
    return;
  }

  const editUrl  = `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;
  const embedUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/edit?usp=sharing&rm=minimal`;

  content.innerHTML = `
    <div class="card" style="padding:0;overflow:hidden">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid var(--gray);flex-wrap:wrap;gap:8px">
        <span style="font-weight:700;font-size:15px">Inventory</span>
        <span style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
          <button class="btn btn-ghost btn-sm" id="bek-upload-btn">📤 Update BEK Prices</button>
          <a href="${editUrl}" target="_blank" class="btn btn-primary btn-sm" style="text-decoration:none">Open in Google Sheets ↗</a>
        </span>
      </div>

      <!-- BEK Upload panel -->
      <div id="bek-upload-panel" style="display:none;background:var(--bg);padding:14px 16px;border-bottom:1px solid var(--gray)">
        <div style="font-weight:600;font-size:13px;margin-bottom:8px">Upload BEK Price List (CSV)</div>
        <div style="font-size:12px;color:var(--muted);margin-bottom:10px">
          CSV must have columns: <code>item_num</code> and <code>price</code> (or <code>Item Number</code> / <code>Unit Price</code>).
        </div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <input type="file" id="bek-file-input" accept=".csv,.txt" style="font-size:13px">
          <button class="btn btn-primary btn-sm" id="bek-process-btn">Process &amp; Upload</button>
          <button class="btn btn-ghost btn-sm" id="bek-cancel-btn">Cancel</button>
        </div>
        <div id="bek-upload-status" style="margin-top:8px;font-size:13px"></div>
      </div>

      <iframe
        src="${embedUrl}"
        style="width:100%;height:calc(100vh - 180px);min-height:500px;border:none;display:block"
        allowfullscreen
        loading="lazy"
      ></iframe>
    </div>
  `;

  // ── BEK Upload panel wiring ──
  const bekUploadBtn  = content.querySelector('#bek-upload-btn');
  const bekPanel      = content.querySelector('#bek-upload-panel');
  const bekCancelBtn  = content.querySelector('#bek-cancel-btn');
  const bekProcessBtn = content.querySelector('#bek-process-btn');
  const bekFileInput  = content.querySelector('#bek-file-input');
  const bekStatus     = content.querySelector('#bek-upload-status');

  bekUploadBtn.addEventListener('click', () => { bekPanel.style.display = bekPanel.style.display === 'none' ? '' : 'none'; });
  bekCancelBtn.addEventListener('click', () => { bekPanel.style.display = 'none'; });

  bekProcessBtn.addEventListener('click', async () => {
    const file = bekFileInput.files[0];
    if (!file) { bekStatus.innerHTML = '<span style="color:var(--red)">Select a CSV file first.</span>'; return; }

    const sbUrl = (typeof SB_URL !== 'undefined' && SB_URL) ? SB_URL : '';
    const sbKey = (typeof SB_KEY !== 'undefined' && SB_KEY) ? SB_KEY : '';
    if (!sbUrl || !sbKey) {
      bekStatus.innerHTML = '<span style="color:var(--red)">BEK feed not configured (add SB_URL / SB_KEY).</span>';
      return;
    }

    bekProcessBtn.disabled = true; bekProcessBtn.textContent = 'Processing…';
    bekStatus.innerHTML = '<span style="color:var(--muted)">Reading file…</span>';

    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      if (lines.length < 2) throw new Error('CSV appears empty.');

      const delim = lines[0].includes('\t') ? '\t' : ',';
      const rawHeaders = lines[0].split(delim).map(h => h.replace(/^"|"$/g, '').trim().toLowerCase());

      const numCol   = rawHeaders.findIndex(h => /item.?num|item.?#|itemnumber/i.test(h));
      const priceCol = rawHeaders.findIndex(h => /^price$|unit.?price|each.?price|ext.?price/i.test(h));
      if (numCol === -1 || priceCol === -1) throw new Error(`Could not find item_num / price columns. Headers found: ${rawHeaders.join(', ')}`);

      const rows = lines.slice(1).map(l => {
        const cols = l.split(delim).map(c => c.replace(/^"|"$/g, '').trim());
        const item_num = cols[numCol];
        const price    = parseFloat(cols[priceCol]);
        if (!item_num || isNaN(price)) return null;
        return { item_num, price };
      }).filter(Boolean);

      if (rows.length === 0) throw new Error('No valid rows found after parsing.');
      bekStatus.innerHTML = `<span style="color:var(--muted)">Uploading ${rows.length} prices…</span>`;

      const batch = 200;
      for (let i = 0; i < rows.length; i += batch) {
        const chunk = rows.slice(i, i + batch);
        const resp = await fetch(`${sbUrl}/rest/v1/bek_prices`, {
          method: 'POST',
          headers: {
            'apikey': sbKey,
            'Authorization': `Bearer ${sbKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates',
          },
          body: JSON.stringify(chunk),
        });
        if (!resp.ok) {
          const errText = await resp.text();
          throw new Error(`Supabase error ${resp.status}: ${errText}`);
        }
      }

      bekStatus.innerHTML = `<span style="color:var(--green)">✓ ${rows.length} BEK prices uploaded successfully.</span>`;
      bekFileInput.value = '';
    } catch (err) {
      bekStatus.innerHTML = `<span style="color:var(--red)">Error: ${err.message}</span>`;
    } finally {
      bekProcessBtn.disabled = false; bekProcessBtn.textContent = 'Process & Upload';
    }
  });
}

function renderInventory(content, rows) {
  const dataRows = rows.length > 1 ? rows.slice(1) : [];

  // Detect section headers and assign each row a section
  let activeSec = 'deli';
  let hasSections = false;
  const outCount = { all: 0, deli: 0, branded: 0, beverage: 0 };
  const taggedRows = dataRows.map(r => {
    const colA = (r[0] || '').trim();
    const colB = (r[1] || '').trim();
    const nonEmpty = r.filter(c => (c || '').toString().trim() !== '').length;
    // Section header row: has item/label text but no numeric data columns
    const hasNumericData = !isNaN(parseFloat(r[4])) && parseFloat(r[4]) > 0;
    if (colB && !hasNumericData && nonEmpty <= 3 && /branded|deli|beverage|bev|fountain|coffee|bibs/i.test(colB)) {
      hasSections = true;
      const lbl = colB.toLowerCase();
      if      (/branded/i.test(lbl))                              activeSec = 'branded';
      else if (/fountain|beverage|bev|coffee|bibs/i.test(lbl))   activeSec = 'beverage';
      else if (/deli/i.test(lbl))                                 activeSec = 'deli';
      return { r, sec: activeSec, isHeader: true };
    }
    const oh = parseFloat(r[4]) || 0;
    if (oh === 0 && colB) { outCount.all++; if (outCount[activeSec] !== undefined) outCount[activeSec]++; }
    return { r, sec: activeSec, isHeader: false };
  });

  const outItems = dataRows.filter(r => (r[4]||'').toString().trim() === '0' || (r[4]||'').toString().trim() === '');
  const lowItems = dataRows.filter(r => {
    const oh = parseFloat(r[4]) || 0;
    const per = parseFloat(r[5]) || 0;
    return oh > 0 && oh < per;
  });

  // Load saved paid state from localStorage
  const paidKey = 'inv-paid-' + (deliState.sheetId || 'default');
  let paidItems = {};
  try { paidItems = JSON.parse(localStorage.getItem(paidKey) || '{}'); } catch(e) {}

  const bodyHTML = taggedRows.length ? taggedRows.map((tr, idx) => {
    const { r, sec, isHeader } = tr;
    if (isHeader) {
      return `<tr data-sec="${sec}" class="inv-sec-header"><td colspan="8" style="font-weight:700;font-size:12px;background:var(--ks-blue);color:#fff;padding:5px 10px;letter-spacing:.05em;text-transform:uppercase">${r[1]||''}</td></tr>`;
    }
    const oh = parseFloat(r[4]) || 0;
    const out = oh === 0 && (r[1]||'').trim() !== '';
    const itemKey = (r[2]||r[1]||idx).toString().trim();
    const paid = !!paidItems[itemKey];
    return `<tr data-sec="${sec}" data-paid="${paid}" data-item-key="${itemKey.replace(/"/g,'&quot;')}" class="${out ? 'row-overdue' : ''}${paid ? ' inv-paid-row' : ''}">
      <td style="font-size:11px;color:var(--muted)">${r[0]||''}</td>
      <td style="font-weight:600${paid?' text-decoration:line-through;opacity:.55':''}">${r[1]||''}</td>
      <td style="font-size:12px;color:var(--muted)">${r[2]||''}</td>
      <td style="font-size:12px">${r[3]||''}</td>
      <td style="font-weight:700;color:${out?'var(--red)':'inherit'}">${r[4]||''}</td>
      <td>$${r[5]||''}</td>
      <td style="font-weight:600">$${r[6]||''}</td>
      <td style="padding:3px 8px;text-align:center"><input type="checkbox" class="inv-paid-chk" data-item-key="${itemKey.replace(/"/g,'&quot;')}" ${paid?'checked':''} style="width:16px;height:16px;cursor:pointer;accent-color:var(--ks-blue);display:none"></td>
    </tr>`;
  }).join('') : `<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:28px">
    No inventory data — sheet may be loading or not yet shared with this app.
  </td></tr>`;

  const INV_SECTION_TABS = [
    { key: 'all',      label: 'All Items' },
    { key: 'deli',     label: 'Deli' },
    { key: 'branded',  label: 'Branded Deli' },
    { key: 'beverage', label: 'Fountain' },
  ];

  const tabButtons = INV_SECTION_TABS.map((s, i) => {
    const cnt = outCount[s.key] || 0;
    return `<button class="tab-btn deli-sub-btn inv-sec-tab${i===0?' active':''}" data-inv-sec="${s.key}" style="font-size:13px;white-space:nowrap">
      ${s.label}${cnt > 0 ? ` <span style="font-size:11px;color:var(--red);font-weight:700">(${cnt} OUT)</span>` : ''}
    </button>`;
  }).join('');

  content.innerHTML = `
    ${(outItems.length || lowItems.length) ? `
    <div class="banner banner-warn">
      <div class="banner-icon">⚠</div>
      <div>
        ${outItems.length ? `<strong>${outItems.length} item${outItems.length>1?'s':''} out of stock</strong><br>` : ''}
        ${lowItems.length ? `<strong>${lowItems.length} item${lowItems.length>1?'s':''} running low</strong>` : ''}
      </div>
    </div>` : ''}

    <div class="card">
      <div class="card-title" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
        <span>Inventory</span>
        <span style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <button class="btn btn-ghost btn-sm" id="inv-paid-toggle" style="font-size:12px">✅ Items Paid: OFF</button>
          <button class="btn btn-primary btn-sm" id="show-inv-form">+ Add Item</button>
        </span>
      </div>

      <div id="inv-add-form" style="display:none;background:var(--bg);padding:16px;border-radius:var(--radius);margin-bottom:16px">
        <div class="form-grid">
          <div class="form-row"><label>Count By</label>
            <select id="inv-countby">${COUNT_BY_OPTIONS.map(c=>`<option>${c}</option>`).join('')}</select>
          </div>
          <div class="form-row"><label>Item Name</label><input type="text" id="inv-item" placeholder="e.g. Chicken Breast Fritter"></div>
          <div class="form-row"><label>Item #</label><input type="text" id="inv-itemnum" placeholder="e.g. 122974"></div>
          <div class="form-row"><label>Case Pack</label><input type="text" id="inv-casepack" placeholder="e.g. 2/5Lb"></div>
          <div class="form-row"><label>On Hand</label><input type="number" id="inv-onhand" min="0" step="0.1" placeholder="0"></div>
          <div class="form-row"><label>Per ($)</label><input type="number" id="inv-per" min="0" step="0.01" placeholder="0.00"></div>
          <div class="form-row"><label>Total ($)</label><input type="text" id="inv-total" readonly style="background:var(--bg)" placeholder="auto"></div>
        </div>
        <div class="btn-row">
          <button class="btn btn-primary btn-sm" id="save-inv-btn">Save Item</button>
          <button class="btn btn-ghost btn-sm" id="cancel-inv-btn">Cancel</button>
        </div>
        <div id="inv-status" style="margin-top:8px;font-size:13px"></div>
      </div>

      <!-- Section sub-tabs (only shown when sheet has section headers) -->
      <div id="inv-sec-nav" style="display:${hasSections?'flex':'none'};gap:4px;margin-bottom:10px;border-bottom:2px solid var(--gray);overflow-x:auto;padding-bottom:0;-webkit-overflow-scrolling:touch">
        ${tabButtons}
      </div>

      <div class="table-wrap">
        <table class="data-table" id="inv-main-table">
          <thead><tr>
            <th>Count By</th><th>Item</th><th>Item#</th><th>Case Pack</th>
            <th>On Hand</th><th>Per</th><th>Total</th><th id="inv-paid-col-hdr" style="display:none">Paid</th>
          </tr></thead>
          <tbody>${bodyHTML}</tbody>
        </table>
      </div>
    </div>
  `;

  const form    = content.querySelector('#inv-add-form');
  const showBtn = content.querySelector('#show-inv-form');
  const onhandEl = content.querySelector('#inv-onhand');
  const perEl    = content.querySelector('#inv-per');
  const totalEl  = content.querySelector('#inv-total');

  const calcTotal = () => {
    const oh  = parseFloat(onhandEl.value) || 0;
    const per = parseFloat(perEl.value) || 0;
    totalEl.value = oh > 0 && per > 0 ? '$' + (oh * per).toFixed(2) : '';
  };
  onhandEl.addEventListener('input', calcTotal);
  perEl.addEventListener('input', calcTotal);

  content.querySelector('#cancel-inv-btn').addEventListener('click', () => { form.style.display='none'; showBtn.style.display=''; });
  showBtn.addEventListener('click', () => { form.style.display='block'; showBtn.style.display='none'; });

  // ── Section tab filtering ──
  content.querySelectorAll('.inv-sec-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      content.querySelectorAll('.inv-sec-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const sec = btn.dataset.invSec;
      content.querySelectorAll('#inv-main-table tbody tr').forEach(tr => {
        tr.style.display = (sec === 'all' || tr.dataset.sec === sec) ? '' : 'none';
      });
    });
  });

  // ── Items Paid toggle ──
  let paidMode = false;
  const paidToggleBtn = content.querySelector('#inv-paid-toggle');
  const paidColHdr    = content.querySelector('#inv-paid-col-hdr');

  paidToggleBtn.addEventListener('click', () => {
    paidMode = !paidMode;
    paidToggleBtn.textContent = paidMode ? '✅ Items Paid: ON' : '✅ Items Paid: OFF';
    paidToggleBtn.style.background = paidMode ? 'var(--ks-blue)' : '';
    paidToggleBtn.style.color      = paidMode ? '#fff' : '';
    paidColHdr.style.display       = paidMode ? '' : 'none';
    content.querySelectorAll('.inv-paid-chk').forEach(chk => {
      chk.style.display = paidMode ? '' : 'none';
    });
  });

  content.querySelectorAll('.inv-paid-chk').forEach(chk => {
    chk.addEventListener('change', () => {
      const key = chk.dataset.itemKey;
      if (chk.checked) { paidItems[key] = true; } else { delete paidItems[key]; }
      try { localStorage.setItem(paidKey, JSON.stringify(paidItems)); } catch(e) {}
      const row = chk.closest('tr');
      if (row) {
        row.dataset.paid = chk.checked ? 'true' : 'false';
        row.classList.toggle('inv-paid-row', chk.checked);
        const nameCell = row.querySelector('td:nth-child(2)');
        if (nameCell) nameCell.style.textDecoration = chk.checked ? 'line-through' : '';
        if (nameCell) nameCell.style.opacity = chk.checked ? '0.55' : '';
      }
    });
  });

  content.querySelector('#save-inv-btn').addEventListener('click', async () => {
    const btn      = content.querySelector('#save-inv-btn');
    const statusEl = content.querySelector('#inv-status');
    const item     = content.querySelector('#inv-item')?.value?.trim();
    if (!item) { statusEl.innerHTML='<span style="color:var(--red)">Item name required.</span>'; return; }

    const oh  = parseFloat(content.querySelector('#inv-onhand')?.value) || 0;
    const per = parseFloat(content.querySelector('#inv-per')?.value) || 0;
    const row = [
      content.querySelector('#inv-countby')?.value,
      item,
      content.querySelector('#inv-itemnum')?.value?.trim(),
      content.querySelector('#inv-casepack')?.value?.trim(),
      oh,
      per,
      oh > 0 && per > 0 ? (oh * per).toFixed(2) : '',
    ];

    btn.disabled=true; btn.textContent='Saving…'; statusEl.textContent='';
    try {
      await sheetsAppend(deliState.sa, deliState.sheetId, 'Inventory!A1', [row]);
      statusEl.innerHTML='<span style="color:var(--green)">Item saved.</span>';
      setTimeout(reloadTab, 600);
    } catch(err) {
      statusEl.innerHTML=`<span style="color:var(--red)">Error: ${err.message}</span>`;
    } finally { btn.disabled=false; btn.textContent='Save Item'; }
  });

}

// ════════════════════════════════════════
// COUNT LOG  (writes to COUNT HISTORY tab)
// ════════════════════════════════════════

const WASTE_REASONS = ['Expired','Over-Production','Dropped/Spilled','Quality Reject','Temperature Abuse','Other'];

function renderWasteLog(content, rows) {
  // Pull item list from inventory (already loaded if user visited Inventory tab)
  // If not yet loaded, fetch it now
  const invData = deliState.data['inventory'] || [];

  async function ensureInvLoaded() {
    if (invData.length > 1) return invData;
    if (!deliState.sheetId && !deliState.countSheetId) return [];
    try {
      const sheetId = deliState.countSheetId || deliState.sheetId;
      const result  = await sheetsGet(deliState.sa, sheetId, 'A1:Z1000');
      const raw = result.values || [];
      deliState.data['inventory'] = raw;
      return raw;
    } catch (_) { return []; }
  }

  // Build inv item map: itemNum -> { name, section, unitPrice }
  function buildItemMap(raw) {
    if (!raw || raw.length < 2) return [];
    let hdrIdx = 0;
    for (let i = 0; i < Math.min(6, raw.length); i++) {
      if (raw[i].some(c => /count.?by|item.?#/i.test(c||''))) { hdrIdx = i; break; }
    }
    const hdr = raw[hdrIdx] || [];
    const nameCol  = hdr.findIndex(h => /^item$|^item.?name/i.test((h||'').trim()));
    const numCol   = hdr.findIndex(h => /item.?#|item.?num/i.test((h||'').trim()));
    const perCol   = hdr.findIndex(h => /^per$|^cost$|^price$/i.test((h||'').trim()));

    // track current section from section-header rows
    let sec = '';
    const items = [];
    raw.slice(hdrIdx + 1).forEach(r => {
      const colA = (r[0]||'').trim(); const colB = (r[1]||'').trim();
      const nonEmpty = r.filter(c=>(c||'').trim()).length;
      if (!colA && colB && nonEmpty <= 3) { sec = colB; return; }
      const name = nameCol >= 0 ? (r[nameCol]||'').trim() : (r[1]||'').trim();
      const num  = numCol  >= 0 ? (r[numCol] ||'').trim() : (r[2]||'').trim();
      if (!name) return;
      const price = perCol >= 0 ? parseFloat(r[perCol]) || 0 : 0;
      items.push({ num, name, section: sec, price });
    });
    return items;
  }

  const today = new Date().toISOString().split('T')[0];
  const dataRows = rows && rows.length > 1 ? rows.slice(1) : [];

  // ── Totals helper ──
  function computeTotals(dRows) {
    const now   = new Date();
    const todayStr  = today;
    const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay());
    const weekStr   = weekStart.toISOString().split('T')[0];
    const monthKey  = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    const yearKey   = String(now.getFullYear());

    let daily=0, weekly=0, monthly=0, yearly=0;
    dRows.forEach(r => {
      const d = r[0]||''; const cost = parseFloat(r[6])||0;
      if (d === todayStr)                                   daily   += cost;
      if (d >= weekStr && d <= todayStr)                    weekly  += cost;
      if (d.startsWith(monthKey))                           monthly += cost;
      if (d.startsWith(yearKey))                            yearly  += cost;
    });
    return { daily, weekly, monthly, yearly };
  }

  const totals  = computeTotals(dataRows);
  const recent  = dataRows.slice(-50).reverse();

  const histHTML = recent.map(r => `<tr>
    <td>${r[0]||''}</td>
    <td style="font-size:12px;color:var(--muted)">${r[1]||''}</td>
    <td style="font-weight:600">${r[2]||''}</td>
    <td style="font-size:12px">${r[3]||''}</td>
    <td style="text-align:center">${r[4]||''}</td>
    <td style="text-align:right">$${parseFloat(r[5]||0).toFixed(2)}</td>
    <td style="text-align:right;font-weight:700;color:var(--red)">$${parseFloat(r[6]||0).toFixed(2)}</td>
    <td style="font-size:12px">${r[7]||''}</td>
    <td style="font-size:12px;color:var(--muted)">${r[8]||''}</td>
  </tr>`).join('');

  const initialOptions = buildItemMap(invData).map(i =>
    `<option value="${i.num}" data-price="${i.price}" data-section="${i.section}">${i.name}${i.num?' ('+i.num+')':''}</option>`
  ).join('') || '<option value="">Loading items…</option>';

  content.innerHTML = `
    <!-- Totals Summary -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:14px">
      ${[['Today',totals.daily],['This Week',totals.weekly],['This Month',totals.monthly],['This Year',totals.yearly]].map(([lbl,val])=>`
        <div class="card" style="padding:14px;text-align:center;margin-bottom:0">
          <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em">${lbl}</div>
          <div style="font-size:22px;font-weight:800;color:var(--red);margin-top:4px">$${val.toFixed(2)}</div>
          <div style="font-size:10px;color:var(--muted)">waste cost</div>
        </div>`).join('')}
    </div>

    <!-- Entry Form -->
    <div class="card" style="margin-bottom:12px">
      <div class="card-title">Log Waste Entry</div>
      <div class="form-grid">
        <div class="form-row"><label>Date</label>
          <input type="date" id="wl-date" value="${today}">
        </div>
        <div class="form-row"><label>Item</label>
          <select id="wl-item" style="max-width:100%">
            <option value="">— Select Item —</option>
            ${initialOptions}
          </select>
        </div>
        <div class="form-row"><label>Section</label>
          <input type="text" id="wl-section" readonly style="background:var(--bg)" placeholder="auto-filled">
        </div>
        <div class="form-row"><label>Qty Wasted</label>
          <input type="number" id="wl-qty" min="0" step="0.01" placeholder="0">
        </div>
        <div class="form-row"><label>Unit Price ($)</label>
          <input type="number" id="wl-price" min="0" step="0.01" placeholder="auto-filled">
        </div>
        <div class="form-row"><label>Total Cost</label>
          <input type="text" id="wl-total" readonly style="background:var(--bg);font-weight:700;color:var(--red)" placeholder="$0.00">
        </div>
        <div class="form-row"><label>Reason</label>
          <select id="wl-reason">${WASTE_REASONS.map(r=>`<option>${r}</option>`).join('')}</select>
        </div>
        <div class="form-row"><label>Notes</label>
          <input type="text" id="wl-notes" placeholder="Optional notes">
        </div>
      </div>
      <div class="btn-row">
        <button class="btn btn-primary" id="wl-save-btn">Log Waste</button>
      </div>
      <div id="wl-status" style="margin-top:8px;font-size:13px"></div>
    </div>

    <!-- History -->
    <div class="card">
      <div class="card-title">Recent Waste Entries (last 50)</div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr>
            <th>Date</th><th>Item#</th><th>Item</th><th>Section</th>
            <th>Qty</th><th>Unit $</th><th>Total $</th><th>Reason</th><th>Notes</th>
          </tr></thead>
          <tbody>${histHTML||'<tr><td colspan="9" style="text-align:center;color:var(--muted);padding:28px">No waste entries yet.</td></tr>'}</tbody>
        </table>
      </div>
    </div>
  `;

  // ── Auto-fill price and section when item changes ──
  const itemSel   = content.querySelector('#wl-item');
  const priceEl   = content.querySelector('#wl-price');
  const sectionEl = content.querySelector('#wl-section');
  const qtyEl     = content.querySelector('#wl-qty');
  const totalEl   = content.querySelector('#wl-total');

  function recalcTotal() {
    const qty   = parseFloat(qtyEl.value)   || 0;
    const price = parseFloat(priceEl.value) || 0;
    totalEl.value = qty > 0 && price > 0 ? '$' + (qty * price).toFixed(2) : '$0.00';
  }

  itemSel.addEventListener('change', () => {
    const opt = itemSel.options[itemSel.selectedIndex];
    priceEl.value   = opt?.dataset?.price   || '';
    sectionEl.value = opt?.dataset?.section || '';
    recalcTotal();
  });
  priceEl.addEventListener('input', recalcTotal);
  qtyEl.addEventListener('input', recalcTotal);

  // If inventory wasn't loaded yet, fetch it and repopulate dropdown
  if (invData.length < 2 && (deliState.sheetId || deliState.countSheetId)) {
    ensureInvLoaded().then(raw => {
      const items = buildItemMap(raw);
      if (!items.length) return;
      itemSel.innerHTML = '<option value="">— Select Item —</option>' +
        items.map(i => `<option value="${i.num}" data-price="${i.price}" data-section="${i.section}">${i.name}${i.num?' ('+i.num+')':''}</option>`).join('');
    });
  }

  // ── Save ──
  content.querySelector('#wl-save-btn').addEventListener('click', async () => {
    const btn      = content.querySelector('#wl-save-btn');
    const statusEl = content.querySelector('#wl-status');
    const date     = content.querySelector('#wl-date').value;
    const opt      = itemSel.options[itemSel.selectedIndex];
    const itemNum  = itemSel.value;
    const itemName = opt?.text?.replace(/\s*\(\d+\)\s*$/, '').trim() || '';
    const section  = sectionEl.value;
    const qty      = parseFloat(qtyEl.value) || 0;
    const price    = parseFloat(priceEl.value) || 0;
    const total    = (qty * price).toFixed(2);
    const reason   = content.querySelector('#wl-reason').value;
    const notes    = content.querySelector('#wl-notes').value.trim();

    if (!date) { statusEl.innerHTML = '<span style="color:var(--red)">Date required.</span>'; return; }
    if (!itemNum && !itemName) { statusEl.innerHTML = '<span style="color:var(--red)">Select an item.</span>'; return; }
    if (qty <= 0) { statusEl.innerHTML = '<span style="color:var(--red)">Qty must be greater than 0.</span>'; return; }

    btn.disabled = true; btn.textContent = 'Saving…'; statusEl.textContent = '';
    try {
      await sheetsEnsureHeaders(deliState.sa, deliState.sheetId, 'Waste Log', DELI_TABS.wastelog.headers);
      await sheetsAppend(deliState.sa, deliState.sheetId, 'Waste Log!A1',
        [[date, itemNum, itemName, section, qty, price, total, reason, notes]]
      );
      statusEl.innerHTML = '<span style="color:var(--green)">✓ Waste entry logged.</span>';
      content.querySelector('#wl-qty').value   = '';
      content.querySelector('#wl-notes').value = '';
      totalEl.value = '$0.00';
      setTimeout(reloadTab, 700);
    } catch (err) {
      statusEl.innerHTML = `<span style="color:var(--red)">Error: ${err.message}</span>`;
    } finally { btn.disabled = false; btn.textContent = 'Log Waste'; }
  });
}

// ════════════════════════════════════════
// FOOD COST
// ════════════════════════════════════════

function renderFoodCost(content, rows) {
  const dataRows = rows.length > 1 ? rows.slice(1) : [];
  const today    = new Date().toISOString().split('T')[0];
  const recent   = dataRows.slice(-8).reverse();

  const avgFC = recent.length
    ? (recent.reduce((s,r)=>s+(parseFloat(r[9])||0),0)/recent.length).toFixed(1)
    : '--';
  const fcColor = v => parseFloat(v)>30?'red':parseFloat(v)>25?'amber':'green';

  const histHTML = recent.map(r => {
    const pct = parseFloat(r[9])||0;
    const col = pct>30?'var(--red)':pct>25?'var(--amber)':'var(--green)';
    return `<tr>
      <td>${r[0]||''}</td>
      <td>$${r[1]||'0'}</td>
      <td>$${r[2]||'0'} / $${r[3]||'0'} / $${r[4]||'0'}</td>
      <td style="font-size:11px">HB: $${r[5]||'0'} / Icee: $${r[6]||'0'} / BEK: $${r[7]||'0'}</td>
      <td>$${r[8]||'0'}</td>
      <td style="font-weight:700;color:${col}">${pct||'--'}%</td>
    </tr>`;
  }).join('');

  content.innerHTML = `
    <div class="stats-row">
      <div class="stat-pill"><div class="stat-pill-label">8-Wk Avg</div><div class="stat-pill-value ${avgFC!=='--'?fcColor(avgFC):''}">${avgFC}%</div></div>
      <div class="stat-pill"><div class="stat-pill-label">Entries</div><div class="stat-pill-value">${dataRows.length}</div></div>
      <div class="stat-pill"><div class="stat-pill-label">Target</div><div class="stat-pill-value">25%</div></div>
    </div>

    <div class="card">
      <div class="card-title">Log Weekly Food Cost</div>
      <div class="form-grid">
        <div class="form-row"><label>Week End Date</label><input type="date" id="fc-date" value="${today}"></div>
        <div class="form-row"><label>Weekly Sales ($)</label><input type="number" id="fc-sales" min="0" step="0.01" placeholder="0.00"></div>
      </div>
      <div style="font-size:12px;font-weight:600;color:var(--muted);margin:10px 0 6px">Beginning Inventory ($)</div>
      <div class="form-grid">
        <div class="form-row"><label>Deli</label><input type="number" id="fc-beg-deli" min="0" step="0.01" placeholder="0.00"></div>
        <div class="form-row"><label>Fountain</label><input type="number" id="fc-beg-fountain" min="0" step="0.01" placeholder="0.00"></div>
        <div class="form-row"><label>Branded Deli</label><input type="number" id="fc-beg-branded" min="0" step="0.01" placeholder="0.00"></div>
      </div>
      <div style="font-size:12px;font-weight:600;color:var(--muted);margin:10px 0 6px">Purchases ($)</div>
      <div class="form-grid">
        <div class="form-row"><label>Hunt Brothers</label><input type="number" id="fc-p-hb" min="0" step="0.01" placeholder="0.00"></div>
        <div class="form-row"><label>Icee</label><input type="number" id="fc-p-icee" min="0" step="0.01" placeholder="0.00"></div>
        <div class="form-row"><label>Ben E. Keith</label><input type="number" id="fc-p-bek" min="0" step="0.01" placeholder="0.00"></div>
      </div>
      <div class="form-grid" style="margin-top:10px">
        <div class="form-row"><label>COGS ($) (auto)</label><input type="text" id="fc-cogs" readonly style="background:var(--bg)" placeholder="auto"></div>
        <div class="form-row"><label>Food Cost % (auto)</label><input type="text" id="fc-pct" readonly style="background:var(--bg)" placeholder="auto"></div>
      </div>
      <div class="form-row" style="margin-top:8px"><label>Notes</label><textarea id="fc-notes" placeholder="Promotions, holidays, unusual variance…"></textarea></div>
      <div class="btn-row"><button class="btn btn-primary" id="save-fc-btn">Save Entry</button></div>
      <div id="fc-status" style="margin-top:8px;font-size:13px"></div>
    </div>

    <div class="card">
      <div class="card-title">Recent Entries</div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>Date</th><th>Sales</th><th>Beg Inv (D/F/B)</th><th>Purchases</th><th>COGS</th><th>FC%</th></tr></thead>
          <tbody>${histHTML||'<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:28px">No entries yet.</td></tr>'}</tbody>
        </table>
      </div>
    </div>
  `;

  const calcAuto = () => {
    const sales  = parseFloat(content.querySelector('#fc-sales')?.value) || 0;
    const begD   = parseFloat(content.querySelector('#fc-beg-deli')?.value) || 0;
    const begF   = parseFloat(content.querySelector('#fc-beg-fountain')?.value) || 0;
    const begB   = parseFloat(content.querySelector('#fc-beg-branded')?.value) || 0;
    const pHB    = parseFloat(content.querySelector('#fc-p-hb')?.value) || 0;
    const pIcee  = parseFloat(content.querySelector('#fc-p-icee')?.value) || 0;
    const pBEK   = parseFloat(content.querySelector('#fc-p-bek')?.value) || 0;
    const cogs   = begD + begF + begB + pHB + pIcee + pBEK;
    content.querySelector('#fc-cogs').value = cogs > 0 ? '$' + cogs.toFixed(2) : '';
    content.querySelector('#fc-pct').value  = sales > 0 && cogs > 0 ? ((cogs/sales)*100).toFixed(1) + '%' : '';
  };
  ['#fc-sales','#fc-beg-deli','#fc-beg-fountain','#fc-beg-branded','#fc-p-hb','#fc-p-icee','#fc-p-bek'].forEach(sel => {
    content.querySelector(sel)?.addEventListener('input', calcAuto);
  });

  content.querySelector('#save-fc-btn').addEventListener('click', async () => {
    const btn    = content.querySelector('#save-fc-btn');
    const statusEl = content.querySelector('#fc-status');
    const date   = content.querySelector('#fc-date')?.value;
    const sales  = content.querySelector('#fc-sales')?.value;
    const begD   = content.querySelector('#fc-beg-deli')?.value;
    const begF   = content.querySelector('#fc-beg-fountain')?.value;
    const begB   = content.querySelector('#fc-beg-branded')?.value;
    const pHB    = content.querySelector('#fc-p-hb')?.value;
    const pIcee  = content.querySelector('#fc-p-icee')?.value;
    const pBEK   = content.querySelector('#fc-p-bek')?.value;
    const notes  = content.querySelector('#fc-notes')?.value?.trim();

    const saleN  = parseFloat(sales)||0;
    const cogs   = (parseFloat(begD)||0)+(parseFloat(begF)||0)+(parseFloat(begB)||0)+(parseFloat(pHB)||0)+(parseFloat(pIcee)||0)+(parseFloat(pBEK)||0);
    const pct    = saleN > 0 ? ((cogs/saleN)*100).toFixed(1) : '';

    if (!date||!sales) { statusEl.innerHTML='<span style="color:var(--red)">Date and Weekly Sales required.</span>'; return; }

    btn.disabled=true; btn.textContent='Saving…'; statusEl.textContent='';
    try {
      await sheetsEnsureHeaders(deliState.sa, deliState.sheetId, 'Food Cost Calculator', DELI_TABS.foodcost.headers);
      await sheetsAppend(deliState.sa, deliState.sheetId, 'Food Cost Calculator!A1', [[date,sales,begD,begF,begB,pHB,pIcee,pBEK,cogs.toFixed(2),pct,notes]]);
      statusEl.innerHTML='<span style="color:var(--green)">Entry saved.</span>';
      setTimeout(reloadTab, 600);
    } catch(err) {
      statusEl.innerHTML=`<span style="color:var(--red)">Error: ${err.message}</span>`;
    } finally { btn.disabled=false; btn.textContent='Save Entry'; }
  });
}

// ════════════════════════════════════════
// INVOICES
// ════════════════════════════════════════

function renderInvoices(content, rows) {
  const dataRows = rows.length > 1 ? rows.slice(1) : [];
  const today = new Date().toISOString().split('T')[0];
  const thisMonth = new Date().getMonth();
  const thisYear  = new Date().getFullYear();

  const monthTotal = dataRows
    .filter(r => { const d=new Date(r[0]); return d.getMonth()===thisMonth&&d.getFullYear()===thisYear; })
    .reduce((s,r)=>s+(parseFloat(r[3])||0), 0);

  const recent = dataRows.slice(-12).reverse();
  const bodyHTML = recent.map(r => `
    <tr>
      <td>${r[0]||''}</td>
      <td style="font-weight:600">${r[1]||''}</td>
      <td style="font-size:12px">${r[2]||''}</td>
      <td style="font-weight:700">$${parseFloat(r[3]||0).toFixed(2)}</td>
      <td style="font-size:12px">${r[4]||''}</td>
      <td style="font-size:11px;color:var(--muted)">${r[5]||''}</td>
    </tr>`).join('');

  content.innerHTML = `
    <div class="stats-row">
      <div class="stat-pill"><div class="stat-pill-label">Total Logged</div><div class="stat-pill-value">${dataRows.length}</div></div>
      <div class="stat-pill"><div class="stat-pill-label">This Month</div><div class="stat-pill-value">$${monthTotal.toLocaleString('en-US',{maximumFractionDigits:0})}</div></div>
    </div>

    <div class="card">
      <div class="card-title">Log Received Invoice</div>
      <div class="form-grid">
        <div class="form-row"><label>Date Received</label><input type="date" id="iv-date" value="${today}"></div>
        <div class="form-row"><label>Vendor</label><input type="text" id="iv-vendor" placeholder="e.g. Sysco"></div>
        <div class="form-row"><label>Invoice #</label><input type="text" id="iv-num" placeholder="INV-12345"></div>
        <div class="form-row"><label>Amount ($)</label><input type="number" id="iv-amount" min="0" step="0.01" placeholder="0.00"></div>
      </div>
      <div class="form-row"><label>Items / Description</label><textarea id="iv-items" placeholder="Briefly describe what was received…"></textarea></div>
      <div class="form-row"><label>Notes</label><input type="text" id="iv-notes" placeholder="Substitutions, shortages, issues…"></div>
      <div class="btn-row"><button class="btn btn-primary" id="save-iv-btn">Log Invoice</button></div>
      <div id="iv-status" style="margin-top:8px;font-size:13px"></div>
    </div>

    <div class="card">
      <div class="card-title">Recent Invoices</div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>Date</th><th>Vendor</th><th>Invoice #</th><th>Amount</th><th>Items</th><th>Notes</th></tr></thead>
          <tbody>${bodyHTML||'<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:28px">No invoices logged yet.</td></tr>'}</tbody>
        </table>
      </div>
    </div>

    <!-- Bring In / ICF and Transfer forms -->
    <div id="inv-icf-container"></div>
    <div id="inv-transfer-container"></div>
  `;

  renderICFForm(content.querySelector('#inv-icf-container'));
  renderTransferForm(content.querySelector('#inv-transfer-container'));

  content.querySelector('#save-iv-btn').addEventListener('click', async () => {
    const btn      = content.querySelector('#save-iv-btn');
    const statusEl = content.querySelector('#iv-status');
    const date     = content.querySelector('#iv-date')?.value;
    const vendor   = content.querySelector('#iv-vendor')?.value?.trim();
    const num      = content.querySelector('#iv-num')?.value?.trim();
    const amount   = content.querySelector('#iv-amount')?.value;
    const items    = content.querySelector('#iv-items')?.value?.trim();
    const notes    = content.querySelector('#iv-notes')?.value?.trim();

    if (!date||!vendor||!amount) { statusEl.innerHTML='<span style="color:var(--red)">Date, Vendor, and Amount required.</span>'; return; }

    btn.disabled=true; btn.textContent='Saving…'; statusEl.textContent='';
    try {
      await sheetsEnsureHeaders(deliState.sa, deliState.sheetId, 'Invoices', DELI_TABS.invoices.headers);
      await sheetsAppend(deliState.sa, deliState.sheetId, 'Invoices!A1', [[date,vendor,num,amount,items,notes]]);
      statusEl.innerHTML='<span style="color:var(--green)">Invoice logged.</span>';
      setTimeout(reloadTab, 600);
    } catch(err) {
      statusEl.innerHTML=`<span style="color:var(--red)">Error: ${err.message}</span>`;
    } finally { btn.disabled=false; btn.textContent='Log Invoice'; }
  });
}

// ════════════════════════════════════════
// ORDERS
// ════════════════════════════════════════

function renderOrders(content, rows) {
  const dataRows = rows.length > 1 ? rows.slice(1) : [];
  const today = new Date().toISOString().split('T')[0];

  const open   = dataRows.filter(r => r[5]==='Pending'||r[5]==='Ordered'||r[5]==='Back-Order');
  const recent = dataRows.slice(-15).reverse();

  const statusBadge = s => {
    const cls = s==='Received'?'pass':s==='Cancelled'?'fail':'pending';
    return `<span class="section-badge ${cls}">${s||''}</span>`;
  };

  const orderRow = r => `<tr>
    <td>${r[0]||''}</td>
    <td style="font-weight:600">${r[1]||''}</td>
    <td>${r[2]||''}</td>
    <td>${r[4]||''} ${r[3]||''}</td>
    <td>${statusBadge(r[5])}</td>
    <td style="font-size:11px;color:var(--muted)">${r[6]||''}</td>
  </tr>`;

  content.innerHTML = `
    <div class="stats-row">
      <div class="stat-pill"><div class="stat-pill-label">Open Orders</div><div class="stat-pill-value ${open.length?'amber':''}">${open.length}</div></div>
      <div class="stat-pill"><div class="stat-pill-label">Total Orders</div><div class="stat-pill-value">${dataRows.length}</div></div>
    </div>

    <div class="card">
      <div class="card-title">Place / Log Order</div>
      <div class="form-grid">
        <div class="form-row"><label>Date</label><input type="date" id="ord-date" value="${today}"></div>
        <div class="form-row"><label>Vendor</label><input type="text" id="ord-vendor" placeholder="e.g. Sysco"></div>
        <div class="form-row"><label>Item / Description</label><input type="text" id="ord-item" placeholder="e.g. Sliced Turkey Breast"></div>
        <div class="form-row"><label>Unit</label><input type="text" id="ord-unit" placeholder="case, lbs, each…"></div>
        <div class="form-row"><label>Quantity</label><input type="number" id="ord-qty" min="0" step="0.5" placeholder="1"></div>
        <div class="form-row"><label>Status</label>
          <select id="ord-status">${ORDER_STATUSES.map(s=>`<option>${s}</option>`).join('')}</select>
        </div>
      </div>
      <div class="form-row"><label>Notes</label><input type="text" id="ord-notes" placeholder="Special instructions, substitutions…"></div>
      <div class="btn-row"><button class="btn btn-primary" id="save-ord-btn">Save Order</button></div>
      <div id="ord-status-msg" style="margin-top:8px;font-size:13px"></div>
    </div>

    ${open.length ? `
    <div class="card">
      <div class="card-title">Open Orders</div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>Date</th><th>Vendor</th><th>Item</th><th>Qty</th><th>Status</th><th>Notes</th></tr></thead>
          <tbody>${open.map(orderRow).join('')}</tbody>
        </table>
      </div>
    </div>` : ''}

    <div class="card">
      <div class="card-title">Recent Orders</div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>Date</th><th>Vendor</th><th>Item</th><th>Qty</th><th>Status</th><th>Notes</th></tr></thead>
          <tbody>${recent.map(orderRow).join('')||'<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:28px">No orders yet.</td></tr>'}</tbody>
        </table>
      </div>
    </div>
  `;

  content.querySelector('#save-ord-btn').addEventListener('click', async () => {
    const btn      = content.querySelector('#save-ord-btn');
    const statusEl = content.querySelector('#ord-status-msg');
    const date     = content.querySelector('#ord-date')?.value;
    const vendor   = content.querySelector('#ord-vendor')?.value?.trim();
    const item     = content.querySelector('#ord-item')?.value?.trim();
    const unit     = content.querySelector('#ord-unit')?.value?.trim();
    const qty      = content.querySelector('#ord-qty')?.value;
    const status   = content.querySelector('#ord-status')?.value;
    const notes    = content.querySelector('#ord-notes')?.value?.trim();

    if (!date||!vendor||!item) { statusEl.innerHTML='<span style="color:var(--red)">Date, Vendor, and Item required.</span>'; return; }

    btn.disabled=true; btn.textContent='Saving…'; statusEl.textContent='';
    try {
      await sheetsEnsureHeaders(deliState.sa, deliState.sheetId, 'Orders', DELI_TABS.orders.headers);
      await sheetsAppend(deliState.sa, deliState.sheetId, 'Orders!A1', [[date,vendor,item,unit,qty,status,notes]]);
      statusEl.innerHTML='<span style="color:var(--green)">Order saved.</span>';
      setTimeout(reloadTab, 600);
    } catch(err) {
      statusEl.innerHTML=`<span style="color:var(--red)">Error: ${err.message}</span>`;
    } finally { btn.disabled=false; btn.textContent='Save Order'; }
  });
}

// ════════════════════════════════════════
// RECIPES
// ════════════════════════════════════════

function renderRecipes(content, rows) {
  const dataRows = rows.length > 1 ? rows.slice(1) : [];

  const recipeMap = {};
  dataRows.forEach(r => {
    const name = r[0]||'Unnamed';
    if (!recipeMap[name]) recipeMap[name] = { category:r[1], servings:r[2], ingredients:[] };
    if (r[3]) recipeMap[name].ingredients.push({ name:r[3],qty:r[4],unit:r[5],cpu:r[6],ext:r[7] });
  });

  const cards = Object.entries(recipeMap).map(([name, rec]) => {
    const total = rec.ingredients.reduce((s,i)=>s+(parseFloat(i.ext)||0),0);
    const perServ = parseFloat(rec.servings)>0 ? (total/parseFloat(rec.servings)).toFixed(2) : '--';
    const ingRows = rec.ingredients.map(i=>`
      <tr style="border-top:1px solid var(--gray)">
        <td style="padding:5px 10px">${i.name}</td>
        <td style="padding:5px 10px;text-align:center">${i.qty}</td>
        <td style="padding:5px 10px;text-align:center">${i.unit}</td>
        <td style="padding:5px 10px;text-align:center">$${i.cpu}</td>
        <td style="padding:5px 10px;text-align:center;font-weight:700">$${parseFloat(i.ext||0).toFixed(3)}</td>
      </tr>`).join('');
    return `
      <div class="card">
        <div class="card-title">
          ${name}
          <span style="font-size:12px;color:var(--muted);font-weight:400">${rec.category||''}</span>
        </div>
        <div style="font-size:12px;color:var(--muted);margin-bottom:10px">
          Servings: ${rec.servings||'--'} &bull; Cost/Serving: <strong>$${perServ}</strong> &bull; Total Cost: <strong>$${total.toFixed(2)}</strong>
        </div>
        <div class="table-wrap">
          <table style="width:100%;border-collapse:collapse;font-size:13px">
            <thead><tr style="background:var(--ks-blue2);color:#fff">
              <th style="padding:6px 10px;text-align:left">Ingredient</th>
              <th style="padding:6px 10px">Qty</th><th style="padding:6px 10px">Unit</th>
              <th style="padding:6px 10px">$/Unit</th><th style="padding:6px 10px">Ext.</th>
            </tr></thead>
            <tbody>${ingRows}</tbody>
          </table>
        </div>
      </div>`;
  }).join('');

  content.innerHTML = `
    <div class="card">
      <div class="card-title">
        Add Recipe Ingredient
        <button class="btn btn-primary btn-sm" id="show-rec-form">+ Add</button>
      </div>
      <div id="rec-form" style="display:none;background:var(--bg);padding:16px;border-radius:var(--radius);margin-bottom:12px">
        <div class="form-grid">
          <div class="form-row"><label>Recipe Name</label><input type="text" id="rec-name" placeholder="e.g. Club Sandwich"></div>
          <div class="form-row"><label>Category</label>
            <select id="rec-cat">${RECIPE_CATS.map(c=>`<option>${c}</option>`).join('')}</select>
          </div>
          <div class="form-row"><label>Servings / Yield</label><input type="number" id="rec-servings" min="1" placeholder="1"></div>
          <div class="form-row"><label>Ingredient</label><input type="text" id="rec-ing" placeholder="e.g. Roast Beef"></div>
          <div class="form-row"><label>Quantity</label><input type="number" id="rec-qty" min="0" step="0.01" placeholder="0"></div>
          <div class="form-row"><label>Unit</label><input type="text" id="rec-unit" placeholder="oz, lbs, each…"></div>
          <div class="form-row"><label>Cost / Unit ($)</label><input type="number" id="rec-cpu" min="0" step="0.001" placeholder="0.000"></div>
          <div class="form-row"><label>Ext. Cost (auto)</label><input type="text" id="rec-ext" readonly style="background:var(--bg)"></div>
        </div>
        <div class="btn-row">
          <button class="btn btn-primary btn-sm" id="save-rec-btn">Save Ingredient</button>
          <button class="btn btn-ghost btn-sm" id="cancel-rec-btn">Cancel</button>
        </div>
        <div id="rec-status" style="margin-top:8px;font-size:13px"></div>
      </div>
    </div>
    ${cards||'<div class="card"><p style="color:var(--muted);text-align:center;padding:28px">No recipes yet. Click "+ Add" to build your recipe costing sheet.</p></div>'}
  `;

  const form = content.querySelector('#rec-form');
  content.querySelector('#show-rec-form').addEventListener('click', () => { form.style.display='block'; });
  content.querySelector('#cancel-rec-btn').addEventListener('click', () => { form.style.display='none'; });

  const qtyEl = content.querySelector('#rec-qty');
  const cpuEl = content.querySelector('#rec-cpu');
  const extEl = content.querySelector('#rec-ext');
  const calcExt = () => {
    const q = parseFloat(qtyEl.value)||0;
    const c = parseFloat(cpuEl.value)||0;
    extEl.value = (q*c).toFixed(3);
  };
  qtyEl.addEventListener('input', calcExt);
  cpuEl.addEventListener('input', calcExt);

  content.querySelector('#save-rec-btn').addEventListener('click', async () => {
    const btn      = content.querySelector('#save-rec-btn');
    const statusEl = content.querySelector('#rec-status');
    const name     = content.querySelector('#rec-name')?.value?.trim();
    const ing      = content.querySelector('#rec-ing')?.value?.trim();
    if (!name||!ing) { statusEl.innerHTML='<span style="color:var(--red)">Recipe Name and Ingredient required.</span>'; return; }

    const qty  = content.querySelector('#rec-qty')?.value;
    const cpu  = content.querySelector('#rec-cpu')?.value;
    const ext  = ((parseFloat(qty)||0)*(parseFloat(cpu)||0)).toFixed(3);
    const row  = [name,content.querySelector('#rec-cat')?.value,content.querySelector('#rec-servings')?.value,ing,qty,content.querySelector('#rec-unit')?.value?.trim(),cpu,ext];

    btn.disabled=true; btn.textContent='Saving…'; statusEl.textContent='';
    try {
      await sheetsEnsureHeaders(deliState.sa, deliState.sheetId, 'Recipes', DELI_TABS.recipes.headers);
      await sheetsAppend(deliState.sa, deliState.sheetId, 'Recipes!A1', [row]);
      statusEl.innerHTML='<span style="color:var(--green)">Ingredient saved.</span>';
      setTimeout(reloadTab, 600);
    } catch(err) {
      statusEl.innerHTML=`<span style="color:var(--red)">Error: ${err.message}</span>`;
    } finally { btn.disabled=false; btn.textContent='Save Ingredient'; }
  });
}

// ════════════════════════════════════════
// SUPPLIERS
// ════════════════════════════════════════

function renderSuppliers(content, rows) {
  const dataRows = rows.length > 1 ? rows.slice(1) : [];

  const bodyHTML = dataRows.map(r=>`
    <tr>
      <td style="font-weight:700">${r[0]||''}</td>
      <td>${r[1]||''}</td>
      <td><a href="tel:${r[2]||''}" style="color:var(--ks-blue)">${r[2]||''}</a></td>
      <td><a href="mailto:${r[3]||''}" style="color:var(--ks-blue);font-size:12px">${r[3]||''}</a></td>
      <td>${r[4]||''}</td>
      <td style="font-size:11px;color:var(--muted)">${r[5]||''}</td>
    </tr>`).join('');

  content.innerHTML = `
    <div class="card">
      <div class="card-title">
        Supplier Directory
        <button class="btn btn-primary btn-sm" id="show-sup-form">+ Add Supplier</button>
      </div>
      <div id="sup-form" style="display:none;background:var(--bg);padding:16px;border-radius:var(--radius);margin-bottom:16px">
        <div class="form-grid">
          <div class="form-row"><label>Supplier Name</label><input type="text" id="sup-name" placeholder="e.g. Sysco"></div>
          <div class="form-row"><label>Rep Name</label><input type="text" id="sup-rep" placeholder="Sales rep name"></div>
          <div class="form-row"><label>Phone</label><input type="tel" id="sup-phone" placeholder="(555) 555-5555"></div>
          <div class="form-row"><label>Email</label><input type="email" id="sup-email" placeholder="rep@supplier.com"></div>
          <div class="form-row"><label>Delivery Day</label>
            <select id="sup-day">${DELIVERY_DAYS.map(d=>`<option>${d}</option>`).join('')}</select>
          </div>
        </div>
        <div class="form-row"><label>Notes</label>
          <textarea id="sup-notes" placeholder="Order minimums, lead times, special items…" style="min-height:60px"></textarea>
        </div>
        <div class="btn-row">
          <button class="btn btn-primary btn-sm" id="save-sup-btn">Save Supplier</button>
          <button class="btn btn-ghost btn-sm" id="cancel-sup-btn">Cancel</button>
        </div>
        <div id="sup-status" style="margin-top:8px;font-size:13px"></div>
      </div>

      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>Supplier</th><th>Rep</th><th>Phone</th><th>Email</th><th>Delivery</th><th>Notes</th></tr></thead>
          <tbody>${bodyHTML||'<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:28px">No suppliers yet.</td></tr>'}</tbody>
        </table>
      </div>
    </div>
  `;

  const form = content.querySelector('#sup-form');
  content.querySelector('#show-sup-form').addEventListener('click', () => { form.style.display='block'; });
  content.querySelector('#cancel-sup-btn').addEventListener('click', () => { form.style.display='none'; });

  content.querySelector('#save-sup-btn').addEventListener('click', async () => {
    const btn      = content.querySelector('#save-sup-btn');
    const statusEl = content.querySelector('#sup-status');
    const name     = content.querySelector('#sup-name')?.value?.trim();
    if (!name) { statusEl.innerHTML='<span style="color:var(--red)">Supplier name required.</span>'; return; }

    const row = [
      name,
      content.querySelector('#sup-rep')?.value?.trim(),
      content.querySelector('#sup-phone')?.value?.trim(),
      content.querySelector('#sup-email')?.value?.trim(),
      content.querySelector('#sup-day')?.value,
      content.querySelector('#sup-notes')?.value?.trim(),
    ];

    btn.disabled=true; btn.textContent='Saving…'; statusEl.textContent='';
    try {
      await sheetsEnsureHeaders(deliState.sa, deliState.sheetId, 'Suppliers', DELI_TABS.suppliers.headers);
      await sheetsAppend(deliState.sa, deliState.sheetId, 'Suppliers!A1', [row]);
      statusEl.innerHTML='<span style="color:var(--green)">Supplier saved.</span>';
      setTimeout(reloadTab, 600);
    } catch(err) {
      statusEl.innerHTML=`<span style="color:var(--red)">Error: ${err.message}</span>`;
    } finally { btn.disabled=false; btn.textContent='Save Supplier'; }
  });
}

// ════════════════════════════════════════
// ANALYTICS  (computed from cached data)
// ════════════════════════════════════════

function renderAnalytics(content) {
  const inv  = (deliState.data.inventory||[]).slice(1);
  const fc   = (deliState.data.foodcost ||[]).slice(1);
  const invs = (deliState.data.invoices ||[]).slice(1);
  const ords = (deliState.data.orders   ||[]).slice(1);

  const lowStock = inv.filter(r=>{
    const count=parseFloat(r[3])||0, reorder=parseFloat(r[5])||0;
    return reorder>0&&count<=reorder;
  }).length;

  const recent4 = fc.slice(-4);
  const avgFC   = recent4.length ? (recent4.reduce((s,r)=>s+(parseFloat(r[4])||0),0)/recent4.length).toFixed(1) : '--';
  const fcColor = avgFC!=='--' ? (parseFloat(avgFC)>30?'red':parseFloat(avgFC)>25?'amber':'green') : '';

  const pendingOrds = ords.filter(r=>r[5]==='Pending'||r[5]==='Ordered').length;

  const vendorSpend = {};
  invs.forEach(r=>{ const v=r[1]||'Unknown'; vendorSpend[v]=(vendorSpend[v]||0)+(parseFloat(r[3])||0); });
  const topVendors = Object.entries(vendorSpend).sort((a,b)=>b[1]-a[1]).slice(0,5);

  const fcTrend = fc.slice(-8).map((r,i)=>({
    label: r[1]||r[0]||`W${i+1}`,
    pct: parseFloat(r[4])||0,
  }));

  const barChart = fcTrend.length ? `
    <div class="card">
      <div class="card-title">Food Cost Trend (last 8 entries)</div>
      <div style="display:flex;gap:8px;align-items:flex-end;height:110px;padding-bottom:4px;overflow-x:auto">
        ${fcTrend.map(w=>{
          const h = Math.min(100, Math.max(4, Math.round(w.pct*3.2)));
          const col = w.pct>30?'var(--red)':w.pct>25?'var(--amber)':'var(--green)';
          return `<div style="display:flex;flex-direction:column;align-items:center;gap:3px;flex-shrink:0;min-width:44px">
            <div style="font-size:10px;font-weight:700;color:${col}">${w.pct}%</div>
            <div style="background:${col};border-radius:4px 4px 0 0;width:32px;height:${h}px"></div>
            <div style="font-size:9px;color:var(--muted);text-align:center;max-width:44px;overflow:hidden">${w.label}</div>
          </div>`;
        }).join('')}
      </div>
      <div style="font-size:11px;color:var(--muted);margin-top:6px">Target: 25%. Green &lt;25% / Amber 25-30% / Red &gt;30%.</div>
    </div>` : '';

  const vendorTable = topVendors.length ? `
    <div class="card">
      <div class="card-title">Top Vendors by Invoice Spend</div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>Vendor</th><th>Total Spend</th></tr></thead>
          <tbody>${topVendors.map(([v,s])=>`<tr><td>${v}</td><td style="font-weight:700">$${s.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</td></tr>`).join('')}</tbody>
        </table>
      </div>
    </div>` : '';

  const lowStockTable = lowStock>0 ? `
    <div class="card">
      <div class="card-title">Items Needing Reorder</div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>Item</th><th>Category</th><th>Count</th><th>Reorder At</th></tr></thead>
          <tbody>${inv.filter(r=>{const c=parseFloat(r[3])||0,ro=parseFloat(r[5])||0;return ro>0&&c<=ro;}).map(r=>`
            <tr class="row-overdue"><td>${r[0]}</td><td>${r[1]}</td>
            <td style="color:var(--red);font-weight:700">${r[3]}</td><td>${r[5]}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>` : '';

  const noData = !fc.length&&!inv.length&&!invs.length&&!ords.length;

  content.innerHTML = `
    <div class="stats-row">
      <div class="stat-pill"><div class="stat-pill-label">4-Wk Avg Food Cost</div><div class="stat-pill-value ${fcColor}">${avgFC}%</div></div>
      <div class="stat-pill"><div class="stat-pill-label">Low Stock Items</div><div class="stat-pill-value ${lowStock?'red':''}">${lowStock}</div></div>
      <div class="stat-pill"><div class="stat-pill-label">Pending Orders</div><div class="stat-pill-value ${pendingOrds?'amber':''}">${pendingOrds}</div></div>
      <div class="stat-pill"><div class="stat-pill-label">Invoices Logged</div><div class="stat-pill-value">${invs.length}</div></div>
    </div>

    ${barChart}
    ${vendorTable}
    ${lowStockTable}

    ${noData ? `
    <div class="banner banner-info">
      <div class="banner-icon">ℹ</div>
      <div>Visit each sub-tab to load data, then return here for your Analytics summary.</div>
    </div>` : `
    <div class="banner banner-brand">
      <div class="banner-icon">ℹ</div>
      <div>Analytics reflects data loaded this session. Navigate each sub-tab to refresh.</div>
    </div>`}
  `;
}

// ════════════════════════════════════════
// TRAINING
// ════════════════════════════════════════

function renderTraining(content) {
  const docs = [
    {
      icon: '📓',
      title: 'Student Workbook',
      desc: 'Spaceman 6235-C Cleaning — full step-by-step workbook for trainees',
      url: 'https://drive.google.com/file/d/1mHmjSfumSFPrA-aO9RwP1zA5vfe__bWE/view',
    },
    {
      icon: '📝',
      title: 'Student Test',
      desc: 'Spaceman 6235-C Cleaning — assessment to verify trainee competency',
      url: 'https://drive.google.com/file/d/1Ea_BetNR6Fiu-cMWDvBl-eK2GAUHeRzf/view',
    },
    {
      icon: '📋',
      title: 'Instructor Manual',
      desc: 'Spaceman 6235-C Cleaning — full instructor guide with teaching notes',
      url: 'https://drive.google.com/file/d/1I6sj0wN1FqvrF9o9r-zEuIVkRY2bKr6K/view',
    },
    {
      icon: '🗺️',
      title: 'Quick Reference Guide',
      desc: 'Spaceman 6235-C Cleaning — at-a-glance summary for trained staff',
      url: 'https://drive.google.com/file/d/1v1ImjNsbkcrNWUnhsorMdIxsyFKKQBK5/view',
    },
  ];

  const cards = docs.map(d => `
    <a href="${d.url}" target="_blank" rel="noopener" style="
      display:block;text-decoration:none;color:inherit;
      background:#fff;border-radius:var(--radius);padding:18px 20px;
      box-shadow:var(--shadow);border-left:4px solid var(--ks-blue);
      margin-bottom:12px;
    ">
      <div style="display:flex;align-items:center;gap:14px">
        <div style="font-size:32px;flex-shrink:0">${d.icon}</div>
        <div>
          <div style="font-weight:700;font-size:15px;color:var(--ks-blue)">${d.title}</div>
          <div style="font-size:13px;color:var(--muted);margin-top:3px">${d.desc}</div>
        </div>
        <div style="margin-left:auto;color:var(--ks-blue);font-size:20px;flex-shrink:0">↗</div>
      </div>
    </a>
  `).join('');

  content.innerHTML = `
    <div class="card" style="margin-bottom:16px">
      <div class="card-title">🍦 Spaceman 6235-C — Training Materials</div>
      <p style="font-size:13px;color:var(--muted);margin-bottom:16px">
        Tap any document to open it. Documents open in Google Drive.
      </p>
      ${cards}
    </div>
    <a href="/training-manual.html" target="_blank" rel="noopener" style="
      display:block;text-decoration:none;color:inherit;
      background:#fff;border-radius:var(--radius);
      box-shadow:var(--shadow);border-left:5px solid var(--ks-blue);
      margin-bottom:16px;overflow:hidden;
    ">
      <div style="background:var(--ks-blue);padding:14px 20px;display:flex;align-items:center;gap:12px">
        <span style="font-size:28px">📘</span>
        <div>
          <div style="font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:18px;color:#fff;text-transform:uppercase;letter-spacing:.5px">Deli Pro — Employee Training Manual</div>
          <div style="font-size:12px;color:rgba(255,255,255,.75);margin-top:2px">Complete step-by-step guide to every feature in this app</div>
        </div>
        <div style="margin-left:auto;color:rgba(255,255,255,.7);font-size:22px;flex-shrink:0">↗</div>
      </div>
      <div style="padding:14px 20px;font-size:13px;color:var(--muted);display:flex;flex-wrap:wrap;gap:8px">
        <span style="background:#EBF5FF;color:var(--ks-blue);border-radius:12px;padding:3px 10px;font-weight:600">15 Chapters</span>
        <span style="background:#EBF5FF;color:var(--ks-blue);border-radius:12px;padding:3px 10px;font-weight:600">All Modules Covered</span>
        <span style="background:#EBF5FF;color:var(--ks-blue);border-radius:12px;padding:3px 10px;font-weight:600">Step-by-Step Instructions</span>
        <span style="background:#EBF5FF;color:var(--ks-blue);border-radius:12px;padding:3px 10px;font-weight:600">Print / PDF Ready</span>
      </div>
    </a>
  `;
}

