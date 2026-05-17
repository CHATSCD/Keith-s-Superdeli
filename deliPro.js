// Module 1 — Deli Pro
// Inventory, Food Cost, Invoices, Orders, Recipes, Suppliers, Analytics
// All backed by Google Sheets tabs via sheetsApi.js.

const DELI_TABS = {
  inventory: { label: 'Inventory',  tab: 'Inventory',  headers: ['Item','Category','Unit','Count','Par Level','Reorder Point','Cost/Unit','Updated By','Last Updated'] },
  foodcost:  { label: 'Food Cost',  tab: 'Food Cost',  headers: ['Date','Week','Sales ($)','COGS ($)','Food Cost %','Target %','Notes'] },
  invoices:  { label: 'Invoices',   tab: 'Invoices',   headers: ['Date','Vendor','Invoice #','Amount ($)','Items','Notes'] },
  orders:    { label: 'Orders',     tab: 'Orders',     headers: ['Date','Vendor','Item','Unit','Qty','Status','Notes'] },
  recipes:   { label: 'Recipes',    tab: 'Recipes',    headers: ['Recipe','Category','Servings','Ingredient','Qty','Unit','Cost/Unit','Ext. Cost'] },
  suppliers: { label: 'Suppliers',  tab: 'Suppliers',  headers: ['Supplier','Rep Name','Phone','Email','Delivery Day','Notes'] },
  analytics: { label: 'Analytics',  virtual: true },
};

const INVENTORY_CATEGORIES = ['Meat','Seafood','Produce','Dairy','Dry Goods','Frozen','Beverages','Supplies','Other'];
const ORDER_STATUSES        = ['Pending','Ordered','Received','Cancelled','Back-Order'];
const DELIVERY_DAYS         = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday','Varies'];
const RECIPE_CATS           = ['Sandwiches','Salads','Hot Foods','Sides','Soups','Bakery','Beverages','Other'];

// Module-level state
const deliState = {
  storeNum: null, storeName: null, sheetId: null, sa: null,
  activeTab: 'inventory',
  data: {},
};

// ════════════════════════════════════════
// ENTRY POINT
// ════════════════════════════════════════

function deliProInit(container, storeNum, storeName, sheetId, serviceAccount) {
  deliState.storeNum  = storeNum;
  deliState.storeName = storeName;
  deliState.sheetId   = sheetId;
  deliState.sa        = serviceAccount;
  deliState.data      = {};
  deliState.activeTab = 'inventory';

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

  if (tabId === 'analytics') {
    renderAnalytics(content);
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

  try {
    const result = await sheetsGet(deliState.sa, deliState.sheetId, `${tabCfg.tab}!A1:Z1000`);
    deliState.data[tabId] = result.values || [];
  } catch (_) {
    deliState.data[tabId] = [];
  }

  switch (tabId) {
    case 'inventory': renderInventory(content, deliState.data[tabId]); break;
    case 'foodcost':  renderFoodCost(content,  deliState.data[tabId]); break;
    case 'invoices':  renderInvoices(content,  deliState.data[tabId]); break;
    case 'orders':    renderOrders(content,    deliState.data[tabId]); break;
    case 'recipes':   renderRecipes(content,   deliState.data[tabId]); break;
    case 'suppliers': renderSuppliers(content, deliState.data[tabId]); break;
  }
}

function reloadTab() {
  const container = document.getElementById('module-deli');
  if (container) switchDeliTab(container, deliState.activeTab);
}

// ════════════════════════════════════════
// INVENTORY
// ════════════════════════════════════════

function renderInventory(content, rows) {
  const dataRows = rows.length > 1 ? rows.slice(1) : [];

  const lowItems = dataRows.filter(r => {
    const count   = parseFloat(r[3]) || 0;
    const reorder = parseFloat(r[5]) || 0;
    return reorder > 0 && count <= reorder;
  });

  const bodyHTML = dataRows.length ? dataRows.map(r => {
    const oor = (() => {
      const count = parseFloat(r[3]) || 0;
      const reorder = parseFloat(r[5]) || 0;
      return reorder > 0 && count <= reorder;
    })();
    return `<tr class="${oor ? 'row-overdue' : ''}">
      <td style="font-weight:600">${r[0]||''}</td>
      <td>${r[1]||''}</td>
      <td>${r[2]||''}</td>
      <td style="font-weight:700;color:${oor?'var(--red)':'inherit'}">${r[3]||''}</td>
      <td>${r[4]||''}</td>
      <td>${r[5]||''}</td>
      <td>$${r[6]||''}</td>
      <td style="font-size:11px;color:var(--muted)">${r[8]||''}</td>
    </tr>`;
  }).join('') : `<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:28px">
    No items yet — add your first item below.
  </td></tr>`;

  content.innerHTML = `
    ${lowItems.length ? `
    <div class="banner banner-warn">
      <div class="banner-icon">⚠</div>
      <div>
        <strong>${lowItems.length} item${lowItems.length>1?'s':''} at or below reorder point</strong>
        <ul style="margin-top:6px;padding-left:18px">
          ${lowItems.map(r=>`<li>${r[0]} — Count: ${r[3]}, Reorder at: ${r[5]}</li>`).join('')}
        </ul>
      </div>
    </div>` : ''}

    <div class="card">
      <div class="card-title">
        Inventory
        <button class="btn btn-primary btn-sm" id="show-inv-form">+ Add Item</button>
      </div>

      <div id="inv-add-form" style="display:none;background:var(--bg);padding:16px;border-radius:var(--radius);margin-bottom:16px">
        <div class="form-grid">
          <div class="form-row"><label>Item Name</label><input type="text" id="inv-item" placeholder="e.g. Roast Beef"></div>
          <div class="form-row"><label>Category</label>
            <select id="inv-cat">${INVENTORY_CATEGORIES.map(c=>`<option>${c}</option>`).join('')}</select>
          </div>
          <div class="form-row"><label>Unit</label><input type="text" id="inv-unit" placeholder="lbs, case, each…"></div>
          <div class="form-row"><label>Current Count</label><input type="number" id="inv-count" min="0" step="0.1" placeholder="0"></div>
          <div class="form-row"><label>Par Level</label><input type="number" id="inv-par" min="0" step="0.1" placeholder="0"></div>
          <div class="form-row"><label>Reorder Point</label><input type="number" id="inv-reorder" min="0" step="0.1" placeholder="0"></div>
          <div class="form-row"><label>Cost / Unit ($)</label><input type="number" id="inv-cost" min="0" step="0.01" placeholder="0.00"></div>
          <div class="form-row"><label>Updated By</label><input type="text" id="inv-who" placeholder="Initials"></div>
        </div>
        <div class="btn-row">
          <button class="btn btn-primary btn-sm" id="save-inv-btn">Save Item</button>
          <button class="btn btn-ghost btn-sm" id="cancel-inv-btn">Cancel</button>
        </div>
        <div id="inv-status" style="margin-top:8px;font-size:13px"></div>
      </div>

      <div class="table-wrap">
        <table class="data-table">
          <thead><tr>
            <th>Item</th><th>Category</th><th>Unit</th><th>Count</th>
            <th>Par</th><th>Reorder At</th><th>$/Unit</th><th>Last Updated</th>
          </tr></thead>
          <tbody>${bodyHTML}</tbody>
        </table>
      </div>
    </div>
  `;

  const form   = content.querySelector('#inv-add-form');
  const showBtn = content.querySelector('#show-inv-form');
  content.querySelector('#cancel-inv-btn').addEventListener('click', () => { form.style.display='none'; showBtn.style.display=''; });
  showBtn.addEventListener('click', () => { form.style.display='block'; showBtn.style.display='none'; });

  content.querySelector('#save-inv-btn').addEventListener('click', async () => {
    const btn      = content.querySelector('#save-inv-btn');
    const statusEl = content.querySelector('#inv-status');
    const item     = content.querySelector('#inv-item')?.value?.trim();
    if (!item) { statusEl.innerHTML='<span style="color:var(--red)">Item name required.</span>'; return; }

    const row = [
      item,
      content.querySelector('#inv-cat')?.value,
      content.querySelector('#inv-unit')?.value?.trim(),
      content.querySelector('#inv-count')?.value,
      content.querySelector('#inv-par')?.value,
      content.querySelector('#inv-reorder')?.value,
      content.querySelector('#inv-cost')?.value,
      content.querySelector('#inv-who')?.value?.trim(),
      new Date().toLocaleDateString(),
    ];

    btn.disabled=true; btn.textContent='Saving…'; statusEl.textContent='';
    try {
      await sheetsEnsureHeaders(deliState.sa, deliState.sheetId, 'Inventory', DELI_TABS.inventory.headers);
      await sheetsAppend(deliState.sa, deliState.sheetId, 'Inventory!A1', [row]);
      statusEl.innerHTML='<span style="color:var(--green)">Item saved.</span>';
      setTimeout(reloadTab, 600);
    } catch(err) {
      statusEl.innerHTML=`<span style="color:var(--red)">Error: ${err.message}</span>`;
    } finally { btn.disabled=false; btn.textContent='Save Item'; }
  });
}

// ════════════════════════════════════════
// FOOD COST
// ════════════════════════════════════════

function renderFoodCost(content, rows) {
  const dataRows = rows.length > 1 ? rows.slice(1) : [];
  const today = new Date().toISOString().split('T')[0];

  const recent = dataRows.slice(-8).reverse();
  const avgFC = recent.length
    ? (recent.reduce((s,r)=>s+(parseFloat(r[4])||0),0)/recent.length).toFixed(1)
    : '--';

  const fcColor = v => parseFloat(v)>30?'red':parseFloat(v)>25?'amber':'green';

  const histHTML = recent.map(r => {
    const pct = parseFloat(r[4])||0;
    const col = pct>30?'var(--red)':pct>25?'var(--amber)':'var(--green)';
    return `<tr>
      <td>${r[0]||''}</td><td>${r[1]||''}</td>
      <td>$${r[2]||'0'}</td><td>$${r[3]||'0'}</td>
      <td style="font-weight:700;color:${col}">${r[4]||'--'}%</td>
      <td>${r[5]||'--'}%</td>
      <td style="font-size:11px;color:var(--muted)">${r[6]||''}</td>
    </tr>`;
  }).join('');

  content.innerHTML = `
    <div class="stats-row">
      <div class="stat-pill">
        <div class="stat-pill-label">4-Week Avg</div>
        <div class="stat-pill-value ${avgFC!=='--'?fcColor(avgFC):''}">${avgFC}%</div>
      </div>
      <div class="stat-pill">
        <div class="stat-pill-label">Entries</div>
        <div class="stat-pill-value">${dataRows.length}</div>
      </div>
      <div class="stat-pill">
        <div class="stat-pill-label">Target</div>
        <div class="stat-pill-value">25%</div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">Log Weekly Food Cost</div>
      <div class="form-grid">
        <div class="form-row"><label>Week End Date</label><input type="date" id="fc-date" value="${today}"></div>
        <div class="form-row"><label>Week Label</label><input type="text" id="fc-week" placeholder="e.g. WK-23"></div>
        <div class="form-row"><label>Gross Sales ($)</label><input type="number" id="fc-sales" min="0" step="0.01" placeholder="0.00"></div>
        <div class="form-row"><label>Cost of Goods ($)</label><input type="number" id="fc-cogs" min="0" step="0.01" placeholder="0.00"></div>
        <div class="form-row"><label>Food Cost % (auto)</label><input type="text" id="fc-pct" readonly style="background:var(--bg)" placeholder="—"></div>
        <div class="form-row"><label>Target %</label><input type="number" id="fc-target" value="25" min="0" max="100" step="0.1"></div>
      </div>
      <div class="form-row"><label>Notes</label><textarea id="fc-notes" placeholder="Promotions, holidays, unusual variance…"></textarea></div>
      <div class="btn-row">
        <button class="btn btn-primary" id="save-fc-btn">Save Entry</button>
      </div>
      <div id="fc-status" style="margin-top:8px;font-size:13px"></div>
    </div>

    <div class="card">
      <div class="card-title">Recent Entries</div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>Date</th><th>Week</th><th>Sales</th><th>COGS</th><th>Food Cost %</th><th>Target %</th><th>Notes</th></tr></thead>
          <tbody>${histHTML||'<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:28px">No entries yet.</td></tr>'}</tbody>
        </table>
      </div>
    </div>
  `;

  const salesEl = content.querySelector('#fc-sales');
  const cogsEl  = content.querySelector('#fc-cogs');
  const pctEl   = content.querySelector('#fc-pct');
  const calcFC  = () => {
    const s = parseFloat(salesEl.value)||0;
    const c = parseFloat(cogsEl.value)||0;
    pctEl.value = s>0 ? ((c/s)*100).toFixed(1)+'%' : '';
  };
  salesEl.addEventListener('input', calcFC);
  cogsEl.addEventListener('input', calcFC);

  content.querySelector('#save-fc-btn').addEventListener('click', async () => {
    const btn      = content.querySelector('#save-fc-btn');
    const statusEl = content.querySelector('#fc-status');
    const date     = content.querySelector('#fc-date')?.value;
    const week     = content.querySelector('#fc-week')?.value?.trim();
    const sales    = content.querySelector('#fc-sales')?.value;
    const cogs     = content.querySelector('#fc-cogs')?.value;
    const target   = content.querySelector('#fc-target')?.value;
    const notes    = content.querySelector('#fc-notes')?.value?.trim();
    const pct      = parseFloat(sales)>0 ? ((parseFloat(cogs)/parseFloat(sales))*100).toFixed(1) : '';

    if (!date||!sales||!cogs) { statusEl.innerHTML='<span style="color:var(--red)">Date, Sales, and COGS required.</span>'; return; }

    btn.disabled=true; btn.textContent='Saving…'; statusEl.textContent='';
    try {
      await sheetsEnsureHeaders(deliState.sa, deliState.sheetId, 'Food Cost', DELI_TABS.foodcost.headers);
      await sheetsAppend(deliState.sa, deliState.sheetId, 'Food Cost!A1', [[date,week,sales,cogs,pct,target,notes]]);
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
  `;

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
