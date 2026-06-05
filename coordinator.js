// Module 4 — Coordinator Dashboard (?view=coordinator)
// Depends on: sheetsApi.js, stores.js

async function coordinatorInit(container, serviceAccount) {
  container.innerHTML = buildCoordinatorShell();

  // Use first available store sheet as the central admin/managers sheet
  const adminSheetId = (typeof STORES !== 'undefined')
    ? Object.values(STORES).find(s => s.sheetId)?.sheetId || ''
    : '';

  document.getElementById('backup-all-btn')?.addEventListener('click', () => {
    backupAllStores(serviceAccount);
  });

  // ── Manager Registration ──
  if (adminSheetId) {
    initManagerRegistration(serviceAccount, adminSheetId);
  }

  // ── Store picker: click a tile to load that store's data ──
  document.getElementById('store-grid')?.addEventListener('click', async e => {
    const tile = e.target.closest('.store-tile');
    if (!tile) return;
    const storeNum = tile.dataset.store;
    document.querySelectorAll('.store-tile').forEach(t => t.classList.remove('active'));
    tile.classList.add('active');
    await loadSingleStore(container, serviceAccount, storeNum);
  });

  // ── Load All: fetch all stores and show chain-wide table ──
  document.getElementById('load-all-btn')?.addEventListener('click', async () => {
    const btn = document.getElementById('load-all-btn');
    btn.disabled = true; btn.textContent = 'Loading…';
    document.getElementById('store-detail-wrap').style.display = 'none';
    document.getElementById('coord-chain-section').style.display = '';
    await loadCoordinatorData(container, serviceAccount);
    btn.disabled = false; btn.textContent = 'Reload Chain Stats';
    document.getElementById('export-coord-pdf').style.display = '';
  });

  // ── Orders ──
  const orderStoreEl  = document.getElementById('coord-order-store');
  const ordersWrap    = document.getElementById('coord-orders-wrap');
  const newOrderForm  = document.getElementById('coord-new-order-form');

  document.getElementById('coord-new-order-btn')?.addEventListener('click', () => {
    newOrderForm.style.display = newOrderForm.style.display === 'none' ? '' : 'none';
    const d = new Date().toISOString().split('T')[0];
    document.getElementById('co-date').value = d;
  });
  document.getElementById('co-cancel-btn')?.addEventListener('click', () => { newOrderForm.style.display = 'none'; });

  document.getElementById('coord-load-orders-btn')?.addEventListener('click', async () => {
    const storeNum = orderStoreEl?.value;
    if (!storeNum) { ordersWrap.innerHTML = '<p style="color:var(--red);font-size:13px">Select a store first.</p>'; return; }
    const sheetId = (typeof STORES !== 'undefined' && STORES[storeNum]) ? (STORES[storeNum].sheetId) : '';
    if (!sheetId) { ordersWrap.innerHTML = '<p style="color:var(--red);font-size:13px">No sheet configured for that store.</p>'; return; }
    ordersWrap.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Loading…</p></div>';
    try {
      const res  = await sheetsGet(serviceAccount, sheetId, 'Orders!A1:G500');
      const rows = (res.values || []).slice(1).reverse().slice(0, 60);
      const html = rows.map(r => `<tr>
        <td>${r[0]||''}</td><td style="font-weight:600">${r[1]||''}</td><td>${r[2]||''}</td>
        <td>${r[3]||''}</td><td style="text-align:center">${r[4]||''}</td>
        <td><span style="font-size:11px;padding:2px 6px;border-radius:4px;
          background:${r[5]==='Received'?'var(--green)':r[5]==='Cancelled'?'var(--red)':'var(--ks-blue)'};color:#fff">${r[5]||''}</span></td>
        <td style="font-size:12px;color:var(--muted)">${r[6]||''}</td>
      </tr>`).join('') || '<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:24px">No orders yet.</td></tr>';
      ordersWrap.innerHTML = `<table class="data-table"><thead><tr>
        <th>Date</th><th>Vendor</th><th>Item</th><th>Unit</th><th>Qty</th><th>Status</th><th>Notes</th>
      </tr></thead><tbody>${html}</tbody></table>`;
    } catch (err) {
      ordersWrap.innerHTML = `<p style="color:var(--red);font-size:13px">Error: ${err.message}</p>`;
    }
  });

  document.getElementById('co-save-btn')?.addEventListener('click', async () => {
    const btn = document.getElementById('co-save-btn');
    const msg = document.getElementById('co-status-msg');
    const storeNum = orderStoreEl?.value;
    const sheetId = (typeof STORES !== 'undefined' && STORES[storeNum]) ? STORES[storeNum].sheetId : '';
    if (!sheetId) { msg.innerHTML = '<span style="color:var(--red)">Select a store first.</span>'; return; }
    const row = [
      document.getElementById('co-date').value,
      document.getElementById('co-vendor').value.trim(),
      document.getElementById('co-item').value.trim(),
      document.getElementById('co-unit').value.trim(),
      document.getElementById('co-qty').value,
      document.getElementById('co-status').value,
      document.getElementById('co-notes').value.trim(),
    ];
    if (!row[0] || !row[2]) { msg.innerHTML = '<span style="color:var(--red)">Date and Item required.</span>'; return; }
    btn.disabled = true; btn.textContent = 'Saving…';
    try {
      await sheetsEnsureHeaders(serviceAccount, sheetId, 'Orders', ['Date','Vendor','Item','Unit','Qty','Status','Notes']);
      await sheetsAppend(serviceAccount, sheetId, 'Orders!A1', [row]);
      msg.innerHTML = '<span style="color:var(--green)">✓ Order saved.</span>';
      newOrderForm.style.display = 'none';
      document.getElementById('coord-load-orders-btn').click();
    } catch (err) {
      msg.innerHTML = `<span style="color:var(--red)">Error: ${err.message}</span>`;
    } finally { btn.disabled = false; btn.textContent = 'Save Order'; }
  });

  // ── Recipes ──
  const recipeStoreEl  = document.getElementById('coord-recipe-store');
  const recipesWrap    = document.getElementById('coord-recipes-wrap');
  const newRecipeForm  = document.getElementById('coord-new-recipe-form');

  document.getElementById('coord-new-recipe-btn')?.addEventListener('click', () => {
    newRecipeForm.style.display = newRecipeForm.style.display === 'none' ? '' : 'none';
  });
  document.getElementById('cr-cancel-btn')?.addEventListener('click', () => { newRecipeForm.style.display = 'none'; });

  document.getElementById('coord-load-recipes-btn')?.addEventListener('click', async () => {
    const storeNum = recipeStoreEl?.value;
    if (!storeNum) { recipesWrap.innerHTML = '<p style="color:var(--red);font-size:13px">Select a store first.</p>'; return; }
    const sheetId = (typeof STORES !== 'undefined' && STORES[storeNum]) ? STORES[storeNum].sheetId : '';
    if (!sheetId) { recipesWrap.innerHTML = '<p style="color:var(--red);font-size:13px">No sheet configured.</p>'; return; }
    recipesWrap.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Loading…</p></div>';
    try {
      const res  = await sheetsGet(serviceAccount, sheetId, 'Recipes!A1:H500');
      const rows = (res.values || []).slice(1);
      const html = rows.map(r => `<tr>
        <td style="font-weight:600">${r[0]||''}</td><td>${r[1]||''}</td><td style="text-align:center">${r[2]||''}</td>
        <td>${r[3]||''}</td><td style="text-align:center">${r[4]||''}</td><td>${r[5]||''}</td>
        <td style="text-align:right">$${r[6]||''}</td><td style="text-align:right;font-weight:700">$${r[7]||''}</td>
      </tr>`).join('') || '<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:24px">No recipes yet.</td></tr>';
      recipesWrap.innerHTML = `<table class="data-table"><thead><tr>
        <th>Recipe</th><th>Category</th><th>Servings</th><th>Ingredient</th><th>Qty</th><th>Unit</th><th>Cost/Unit</th><th>Ext. Cost</th>
      </tr></thead><tbody>${html}</tbody></table>`;
    } catch (err) {
      recipesWrap.innerHTML = `<p style="color:var(--red);font-size:13px">Error: ${err.message}</p>`;
    }
  });

  document.getElementById('cr-save-btn')?.addEventListener('click', async () => {
    const btn = document.getElementById('cr-save-btn');
    const msg = document.getElementById('cr-status-msg');
    const storeNum = recipeStoreEl?.value;
    const sheetId = (typeof STORES !== 'undefined' && STORES[storeNum]) ? STORES[storeNum].sheetId : '';
    if (!sheetId) { msg.innerHTML = '<span style="color:var(--red)">Select a store first.</span>'; return; }
    const qty  = parseFloat(document.getElementById('cr-qty').value)     || 0;
    const cost = parseFloat(document.getElementById('cr-costunit').value) || 0;
    const row = [
      document.getElementById('cr-recipe').value.trim(),
      document.getElementById('cr-cat').value,
      document.getElementById('cr-servings').value,
      document.getElementById('cr-ingredient').value.trim(),
      qty, document.getElementById('cr-unit').value.trim(),
      cost, (qty * cost).toFixed(2),
    ];
    if (!row[0] || !row[3]) { msg.innerHTML = '<span style="color:var(--red)">Recipe name and ingredient required.</span>'; return; }
    btn.disabled = true; btn.textContent = 'Saving…';
    try {
      await sheetsEnsureHeaders(serviceAccount, sheetId, 'Recipes', ['Recipe','Category','Servings','Ingredient','Qty','Unit','Cost/Unit','Ext. Cost']);
      await sheetsAppend(serviceAccount, sheetId, 'Recipes!A1', [row]);
      msg.innerHTML = '<span style="color:var(--green)">✓ Recipe row saved.</span>';
      document.getElementById('coord-load-recipes-btn').click();
    } catch (err) {
      msg.innerHTML = `<span style="color:var(--red)">Error: ${err.message}</span>`;
    } finally { btn.disabled = false; btn.textContent = 'Save Recipe Row'; }
  });
}

function buildCoordinatorShell() {
  const stores    = typeof STORES !== 'undefined' ? STORES : {};
  const storeKeys = Object.keys(stores).sort((a, b) => Number(a) - Number(b));

  const storeGridHTML = storeKeys.length === 0
    ? '<p style="color:var(--muted);font-size:13px">No stores configured.</p>'
    : storeKeys.map(n => {
        const s = stores[n];
        return `<button class="store-tile" data-store="${n}">
          <span style="font-weight:700;font-size:13px">#${n}</span>
          ${s && s.name ? `<span style="font-weight:400;font-size:11px;color:var(--muted);display:block;line-height:1.2">${s.name}</span>` : ''}
        </button>`;
      }).join('');

  return `
    <div class="card">
      <div class="card-title" style="font-size:18px">Food &amp; Beverage Department Dashboard</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
        <button class="btn btn-primary btn-sm" id="load-all-btn">Load All Stores (Chain Stats)</button>
        <button class="btn btn-outline btn-sm" id="export-coord-pdf" style="display:none">Export Report PDF</button>
      </div>
    </div>

    <div id="coord-alerts"></div>

    <!-- Store picker — click a store to load its data -->
    <div class="card" style="margin-bottom:12px">
      <div class="card-title">Stores — Click to Load</div>
      <div id="store-grid" style="display:flex;flex-wrap:wrap;gap:8px">${storeGridHTML}</div>
    </div>

    <!-- Single-store detail panel (hidden until a tile is clicked) -->
    <div id="store-detail-wrap" style="display:none">
      <div class="card">
        <div class="card-title">
          <span id="store-detail-title">Store Detail</span>
          <span id="store-detail-links" style="display:flex;gap:6px"></span>
        </div>
        <div id="store-detail-content">
          <div class="loading-state"><div class="spinner"></div><p>Loading…</p></div>
        </div>
      </div>
      <div class="card" style="margin-top:12px">
        <div class="card-title">Food Cost</div>
        <div id="store-fc-content">
          <div class="loading-state"><div class="spinner"></div><p>Loading…</p></div>
        </div>
      </div>
    </div>

    <!-- Chain-wide section (hidden until Load All is clicked) -->
    <div id="coord-chain-section" style="display:none">
      <!-- Compliance stats populated after load -->
      <div id="coord-compliance" class="card" style="margin-bottom:12px"></div>

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

      <div class="card">
        <div class="card-title">Inspection Summary — All Stores</div>
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
    </div>

    <div class="card" style="margin-top:12px">
      <div class="card-title">
        Orders
        <button class="btn btn-primary btn-sm" id="coord-new-order-btn">+ New Order</button>
      </div>
      <div style="margin-bottom:10px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <label style="font-size:12px;font-weight:600;color:var(--muted)">Store:</label>
        <select id="coord-order-store" style="padding:6px 10px;border:1.5px solid var(--gray);border-radius:8px;font-size:13px;font-family:inherit">
          <option value="">— Select Store —</option>
          ${Object.keys(typeof STORES!=='undefined'?STORES:{}).sort((a,b)=>Number(a)-Number(b)).map(n=>{const s=(typeof STORES!=='undefined'?STORES:{})[n];return`<option value="${n}">#${n}${s&&s.name?' — '+s.name:''}</option>`;}).join('')}
        </select>
        <button class="btn btn-ghost btn-sm" id="coord-load-orders-btn">Load Orders</button>
      </div>
      <div id="coord-new-order-form" style="display:none;background:var(--bg);border-radius:8px;padding:14px;margin-bottom:12px;border:1.5px solid var(--gray)">
        <div class="form-grid">
          <div class="form-row"><label>Date</label><input type="date" id="co-date"></div>
          <div class="form-row"><label>Vendor</label><input type="text" id="co-vendor" placeholder="e.g. Ben E. Keith"></div>
          <div class="form-row"><label>Item</label><input type="text" id="co-item"></div>
          <div class="form-row"><label>Unit</label><input type="text" id="co-unit" placeholder="e.g. Case"></div>
          <div class="form-row"><label>Qty</label><input type="number" id="co-qty" min="1" placeholder="1"></div>
          <div class="form-row"><label>Status</label>
            <select id="co-status"><option>Pending</option><option>Ordered</option><option>Received</option><option>Cancelled</option><option>Back-Order</option></select>
          </div>
          <div class="form-row"><label>Notes</label><input type="text" id="co-notes" placeholder="Optional"></div>
        </div>
        <div class="btn-row">
          <button class="btn btn-primary btn-sm" id="co-save-btn">Save Order</button>
          <button class="btn btn-ghost btn-sm" id="co-cancel-btn">Cancel</button>
        </div>
        <div id="co-status-msg" style="font-size:13px;margin-top:6px"></div>
      </div>
      <div class="table-wrap" id="coord-orders-wrap">
        <p style="color:var(--muted);font-size:13px;padding:12px 0">Select a store and click Load Orders.</p>
      </div>
    </div>

    <div class="card" style="margin-top:12px">
      <div class="card-title">
        Recipes
        <button class="btn btn-primary btn-sm" id="coord-new-recipe-btn">+ New Recipe</button>
      </div>
      <div style="margin-bottom:10px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <label style="font-size:12px;font-weight:600;color:var(--muted)">Store:</label>
        <select id="coord-recipe-store" style="padding:6px 10px;border:1.5px solid var(--gray);border-radius:8px;font-size:13px;font-family:inherit">
          <option value="">— Select Store —</option>
          ${Object.keys(typeof STORES!=='undefined'?STORES:{}).sort((a,b)=>Number(a)-Number(b)).map(n=>{const s=(typeof STORES!=='undefined'?STORES:{})[n];return`<option value="${n}">#${n}${s&&s.name?' — '+s.name:''}</option>`;}).join('')}
        </select>
        <button class="btn btn-ghost btn-sm" id="coord-load-recipes-btn">Load Recipes</button>
      </div>
      <div id="coord-new-recipe-form" style="display:none;background:var(--bg);border-radius:8px;padding:14px;margin-bottom:12px;border:1.5px solid var(--gray)">
        <div class="form-grid">
          <div class="form-row"><label>Recipe</label><input type="text" id="cr-recipe"></div>
          <div class="form-row"><label>Category</label>
            <select id="cr-cat"><option>Sandwiches</option><option>Salads</option><option>Hot Foods</option><option>Sides</option><option>Soups</option><option>Bakery</option><option>Beverages</option><option>Other</option></select>
          </div>
          <div class="form-row"><label>Servings</label><input type="number" id="cr-servings" min="1" placeholder="1"></div>
          <div class="form-row"><label>Ingredient</label><input type="text" id="cr-ingredient"></div>
          <div class="form-row"><label>Qty</label><input type="text" id="cr-qty" placeholder="e.g. 2"></div>
          <div class="form-row"><label>Unit</label><input type="text" id="cr-unit" placeholder="e.g. oz"></div>
          <div class="form-row"><label>Cost/Unit ($)</label><input type="number" id="cr-costunit" step="0.01" min="0" placeholder="0.00"></div>
        </div>
        <div class="btn-row">
          <button class="btn btn-primary btn-sm" id="cr-save-btn">Save Recipe Row</button>
          <button class="btn btn-ghost btn-sm" id="cr-cancel-btn">Cancel</button>
        </div>
        <div id="cr-status-msg" style="font-size:13px;margin-top:6px"></div>
      </div>
      <div class="table-wrap" id="coord-recipes-wrap">
        <p style="color:var(--muted);font-size:13px;padding:12px 0">Select a store and click Load Recipes.</p>
      </div>
    </div>

    <div class="card" style="margin-top:12px">
      <div class="card-title">Weekly Inventory Backup</div>
      <p style="font-size:13px;color:var(--muted);margin-bottom:12px">
        Creates a dated snapshot of every store's Inventory tab. Keeps the last
        4 weekly backups per store — older ones are removed automatically.
      </p>
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
        <button class="btn btn-primary" id="backup-all-btn">Backup All Stores Now</button>
      </div>
      <div id="backup-status" style="margin-top:8px"></div>
    </div>

    <div class="card" style="margin-top:12px">
      <div class="card-title">
        Manager Registration
        <button class="btn btn-primary btn-sm" id="mgr-add-btn">+ Add Manager</button>
      </div>
      <p style="font-size:13px;color:var(--muted);margin-bottom:12px">
        Managers registered here can sign ICF and Merchandise Transfer forms using their PIN.
      </p>

      <div id="mgr-add-form" style="display:none;background:var(--bg);border-radius:8px;padding:14px;margin-bottom:12px;border:1.5px solid var(--gray)">
        <div class="form-grid">
          <div class="form-row"><label>Full Name</label><input type="text" id="mgr-name" placeholder="e.g. Sarah Hall"></div>
          <div class="form-row"><label>Store #</label><input type="text" id="mgr-store" placeholder="e.g. 107"></div>
          <div class="form-row"><label>PIN (4-6 digits)</label><input type="password" id="mgr-pin" maxlength="6" placeholder="••••" style="letter-spacing:4px"></div>
          <div class="form-row"><label>Email</label><input type="email" id="mgr-email" placeholder="manager@email.com"></div>
          <div class="form-row"><label>Role</label>
            <select id="mgr-role">
              <option>Store Manager</option>
              <option>Assistant Manager</option>
              <option>Deli Manager</option>
              <option>District Manager</option>
            </select>
          </div>
        </div>
        <div class="btn-row">
          <button class="btn btn-primary btn-sm" id="mgr-save-btn">Save Manager</button>
          <button class="btn btn-ghost btn-sm" id="mgr-cancel-btn">Cancel</button>
        </div>
        <div id="mgr-status" style="margin-top:8px;font-size:13px"></div>
      </div>

      <div class="table-wrap" id="mgr-table-wrap">
        <div class="loading-state"><div class="spinner"></div><p>Loading managers…</p></div>
      </div>
    </div>
  `;
}

let coordAllRows = [];

// Fetch in batches of 3 to stay under the 60 req/min Sheets quota.
// 3 req per batch + 1.5s between batches ≈ 42 req/min — safely under limit.
async function batchSettled(items, fn, batchSize = 3, onProgress) {
  const results = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const settled = await Promise.allSettled(batch.map(fn));
    results.push(...settled);
    if (onProgress) onProgress(Math.min(i + batchSize, items.length), items.length);
    if (i + batchSize < items.length) await new Promise(r => setTimeout(r, 1500));
  }
  return results;
}

// Load a single store's inspection + food cost data into the detail panel
async function loadSingleStore(container, serviceAccount, storeNum) {
  const store = (typeof STORES !== 'undefined' && STORES[storeNum]) ? STORES[storeNum] : null;
  const sheetId = store?.sheetId || '';

  const detailWrap    = document.getElementById('store-detail-wrap');
  const detailTitle   = document.getElementById('store-detail-title');
  const detailLinks   = document.getElementById('store-detail-links');
  const detailContent = document.getElementById('store-detail-content');
  const fcContent     = document.getElementById('store-fc-content');

  detailWrap.style.display = '';
  detailTitle.textContent  = `Store #${storeNum}${store?.name ? ' — ' + store.name : ''}`;
  detailLinks.innerHTML    = `
    <a href="/?store=${storeNum}" style="padding:3px 10px;background:var(--ks-blue);color:#fff;border-radius:5px;font-size:11px;text-decoration:none">Open Store</a>
    ${sheetId ? `<a href="https://docs.google.com/spreadsheets/d/${sheetId}" target="_blank" rel="noopener" style="padding:3px 10px;background:#0F9D58;color:#fff;border-radius:5px;font-size:11px;text-decoration:none">Sheet</a>` : ''}
  `;
  detailContent.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Loading inspection history…</p></div>';
  fcContent.innerHTML     = '<div class="loading-state"><div class="spinner"></div><p>Loading food cost…</p></div>';

  detailWrap.scrollIntoView({ behavior: 'smooth', block: 'start' });

  if (!sheetId) {
    detailContent.innerHTML = '<p style="color:var(--muted);font-size:13px;padding:8px 0">No sheet configured for this store.</p>';
    fcContent.innerHTML     = '';
    return;
  }

  // Fetch inspection history and food cost in parallel
  const [inspRes, fcRes] = await Promise.allSettled([
    sheetsGet(serviceAccount, sheetId, 'Inspections!A2:N200'),
    sheetsGet(serviceAccount, sheetId, 'Deli Pro!A1:Z5'),
  ]);

  // Inspection history
  if (inspRes.status === 'fulfilled') {
    const rows = (inspRes.value.values || []).reverse(); // most recent first
    if (rows.length === 0) {
      detailContent.innerHTML = '<p style="color:var(--muted);font-size:13px;padding:8px 0">No inspections on record.</p>';
    } else {
      const today = new Date(); today.setHours(0,0,0,0);
      const rowsHTML = rows.map(r => {
        const status = r[11] || '';
        const date   = r[2]  || '--';
        const score  = r[5]  || '--';
        const nos    = r[7]  || '0';
        const followup = r[10] || '--';
        const fu     = new Date(followup);
        const diff   = !isNaN(fu) ? Math.round((fu - today) / 86400000) : null;
        const computed = status || (diff === null ? 'Clear' : diff < 0 ? 'Overdue' : diff <= 3 ? 'Pending' : 'Clear');
        const sCls   = computed === 'Overdue' ? 'status-overdue' : computed === 'Pending' ? 'status-pending' : 'status-clear';
        return `<tr>
          <td>${date}</td>
          <td>${r[4]||'--'}</td>
          <td>${score}</td>
          <td>${nos}</td>
          <td>${followup}</td>
          <td class="${sCls}">${computed}</td>
        </tr>`;
      }).join('');
      detailContent.innerHTML = `
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>Date</th><th>Inspector</th><th>Score %</th><th>NOs</th><th>Follow-up</th><th>Status</th></tr></thead>
            <tbody>${rowsHTML}</tbody>
          </table>
        </div>`;
    }
  } else {
    detailContent.innerHTML = `<p style="color:var(--red);font-size:13px">Error loading inspections: ${inspRes.reason?.message}</p>`;
  }

  // Food cost
  if (fcRes.status === 'fulfilled') {
    const val = fcRes.value.values?.[1]?.[1] || '--';
    fcContent.innerHTML = `<p style="font-size:14px"><strong>Food Cost:</strong> ${val}</p>`;
  } else {
    fcContent.innerHTML = '<p style="color:var(--muted);font-size:13px">No food cost data.</p>';
  }
}

// Render chain-wide compliance stats after all stores are loaded
function renderComplianceStats(rows) {
  const el = document.getElementById('coord-compliance');
  if (!el) return;

  const total    = rows.length;
  const noData   = rows.filter(r => r.status === 'No Data' || r.status === 'Error').length;
  const withData = total - noData;

  // Compute timing status for each store that has data
  const today = new Date(); today.setHours(0,0,0,0);
  let onTime = 0, late = 0, pending = 0;
  rows.forEach(r => {
    if (r.status === 'No Data' || r.status === 'Error') return;
    const computed = r.status || computeStatus(r.followup);
    if (computed === 'Clear')   onTime++;
    else if (computed === 'Overdue') late++;
    else if (computed === 'Pending') pending++;
  });

  const pct = n => withData > 0 ? Math.round((n / withData) * 100) : 0;

  // Compute average score across stores with scores
  const scored = rows.filter(r => r.score && parseInt(r.score) > 0);
  const avgScore = scored.length > 0
    ? Math.round(scored.reduce((s, r) => s + parseInt(r.score), 0) / scored.length)
    : null;

  el.innerHTML = `
    <div class="card-title">Inspection Compliance — ${total} Store${total!==1?'s':''}</div>
    <div class="stats-row" style="margin-bottom:0">
      <div class="stat-pill">
        <div class="stat-pill-label">On Time</div>
        <div class="stat-pill-value green">${pct(onTime)}%</div>
        <div style="font-size:11px;color:var(--muted)">${onTime} store${onTime!==1?'s':''}</div>
      </div>
      <div class="stat-pill">
        <div class="stat-pill-label">Late / Pending</div>
        <div class="stat-pill-value amber">${pct(pending + late)}%</div>
        <div style="font-size:11px;color:var(--muted)">${pending + late} store${(pending+late)!==1?'s':''}</div>
      </div>
      <div class="stat-pill">
        <div class="stat-pill-label">Overdue</div>
        <div class="stat-pill-value red">${pct(late)}%</div>
        <div style="font-size:11px;color:var(--muted)">${late} store${late!==1?'s':''}</div>
      </div>
      <div class="stat-pill">
        <div class="stat-pill-label">Not at All</div>
        <div class="stat-pill-value red">${total > 0 ? Math.round((noData/total)*100) : 0}%</div>
        <div style="font-size:11px;color:var(--muted)">${noData} store${noData!==1?'s':''}</div>
      </div>
      ${avgScore !== null ? `
      <div class="stat-pill">
        <div class="stat-pill-label">Avg Score</div>
        <div class="stat-pill-value ${avgScore>=90?'green':avgScore>=75?'amber':'red'}">${avgScore}%</div>
        <div style="font-size:11px;color:var(--muted)">${scored.length} store${scored.length!==1?'s':''}</div>
      </div>` : ''}
    </div>
  `;
}

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

  const tableWrap = document.getElementById('coord-table-wrap');
  const total = storeEntries.length;

  const firstError = { msg: '' };
  const rows = await batchSettled(
    storeEntries,
    async ([num, store]) => {
      try {
        const data = await sheetsGet(serviceAccount, store.sheetId, 'Inspections!A2:L1000');
        const values = data.values || [];
        if (values.length === 0) {
          return { storeNum: num, storeName: store.name, sheetId: store.sheetId, lastDate: null, score: null, nos: null, followup: null, status: 'No Data' };
        }
        // Last row is most recent inspection
        const last = values[values.length - 1];
        return {
          storeNum:  num,
          storeName: store.name,
          sheetId:   store.sheetId,
          lastDate:  last[2] || '',
          score:     last[5] || '',
          nos:       last[7] || '0',
          followup:  last[10] || '',
          status:    last[11] || '',
        };
      } catch (err) {
        if (!firstError.msg) firstError.msg = err.message;
        return { storeNum: num, storeName: store.name, sheetId: store.sheetId, lastDate: null, score: null, nos: null, followup: null, status: 'Error' };
      }
    },
    3,
    (done, tot) => {
      if (tableWrap) tableWrap.innerHTML = `
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading store data… ${done} / ${tot}</p>
        </div>`;
    }
  );

  coordAllRows = rows.map(r => r.value || r.reason);

  const allFailed = coordAllRows.every(r => r.status === 'Error');
  if (allFailed) {
    const saEmail = (typeof SERVICE_ACCOUNT_EMAIL !== 'undefined' && SERVICE_ACCOUNT_EMAIL)
      ? `<br><br>Service account email: <code>${SERVICE_ACCOUNT_EMAIL}</code><br>Each sheet must be shared with this email.`
      : '';
    document.getElementById('coord-alerts').innerHTML = `
      <div class="banner banner-danger">
        <strong>Could not load any store data.</strong>${saEmail}
        ${firstError.msg ? `<br><br>Error: <code>${firstError.msg}</code>` : ''}
      </div>`;
  }

  renderComplianceStats(coordAllRows);
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
    const appHref   = `/?store=${row.storeNum}`;
    const sheetHref = row.sheetId ? `https://docs.google.com/spreadsheets/d/${row.sheetId}` : '';
    return `
      <tr class="${cls}">
        <td>${row.storeNum}</td>
        <td>${row.storeName || '--'}</td>
        <td>${row.lastDate || '--'}</td>
        <td>${row.score || '--'}</td>
        <td>${row.nos || '--'}</td>
        <td>${row.followup || '--'}</td>
        <td class="${statusCls}">${status}</td>
        <td style="white-space:nowrap">
          <a href="${appHref}" style="display:inline-block;margin-right:6px;padding:3px 8px;background:var(--ks-blue);color:#fff;border-radius:5px;font-size:11px;text-decoration:none">App</a>
          ${sheetHref ? `<a href="${sheetHref}" target="_blank" rel="noopener" style="display:inline-block;padding:3px 8px;background:#0F9D58;color:#fff;border-radius:5px;font-size:11px;text-decoration:none">Sheet</a>` : ''}
        </td>
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
          <th>Links</th>
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

  const results = await batchSettled(storeEntries.slice(0, 20), async ([num, store]) => {
    try {
      const data = await sheetsGet(serviceAccount, store.sheetId, 'Deli Pro!A1:Z5');
      return { storeNum: num, storeName: store.name, data: data.values || [] };
    } catch (_) {
      return { storeNum: num, storeName: store.name, data: [] };
    }
  });

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

  // Page numbers
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'normal');
    doc.text(safeText(`Page ${p} of ${pageCount}`), L + W - 48, 570);
  }

  doc.save(safeText(`Coordinator_Report_${new Date().toISOString().split('T')[0]}.pdf`));
}

// ════════════════════════════════════════
// MANAGER REGISTRATION
// ════════════════════════════════════════

async function loadManagers(sa, sheetId) {
  const wrap = document.getElementById('mgr-table-wrap');
  if (!wrap) return;
  try {
    const res  = await sheetsGet(sa, sheetId, 'Managers!A1:E200');
    const rows = res.values || [];
    if (rows.length <= 1) {
      wrap.innerHTML = '<p style="color:var(--muted);font-size:13px;padding:8px 0">No managers registered yet.</p>';
      return;
    }
    const bodyHTML = rows.slice(1).map((r, i) => `
      <tr>
        <td>${r[0]||''}</td>
        <td>${r[1]||''}</td>
        <td style="letter-spacing:3px;color:var(--muted)">••••</td>
        <td>${r[3]||''}</td>
        <td>${r[4]||''}</td>
        <td style="padding:4px 8px">
          <button class="btn btn-ghost btn-sm mgr-delete-btn" data-row="${i+2}" style="color:var(--red);font-size:11px">Remove</button>
        </td>
      </tr>`).join('');
    wrap.innerHTML = `
      <table class="data-table">
        <thead><tr><th>Name</th><th>Store #</th><th>PIN</th><th>Email</th><th>Role</th><th></th></tr></thead>
        <tbody>${bodyHTML}</tbody>
      </table>`;

    wrap.querySelectorAll('.mgr-delete-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Remove this manager?')) return;
        const rowNum = parseInt(btn.dataset.row, 10);
        btn.disabled = true; btn.textContent = '…';
        try {
          // Clear the row by writing empty values
          await sheetsUpdate(sa, sheetId, `Managers!A${rowNum}:E${rowNum}`, [['','','','','']]);
          loadManagers(sa, sheetId);
        } catch(err) {
          alert('Error removing: ' + err.message);
          btn.disabled = false; btn.textContent = 'Remove';
        }
      });
    });
  } catch(err) {
    wrap.innerHTML = `<p style="color:var(--red);font-size:13px">Error loading managers: ${err.message}</p>`;
  }
}

function initManagerRegistration(sa, sheetId) {
  const addBtn    = document.getElementById('mgr-add-btn');
  const form      = document.getElementById('mgr-add-form');
  const cancelBtn = document.getElementById('mgr-cancel-btn');
  const saveBtn   = document.getElementById('mgr-save-btn');
  const statusEl  = document.getElementById('mgr-status');
  if (!addBtn) return;

  // Ensure Managers sheet has headers
  sheetsEnsureHeaders(sa, sheetId, 'Managers', ['Name','Store#','PIN','Email','Role']).catch(()=>{});

  loadManagers(sa, sheetId);

  addBtn.addEventListener('click', () => {
    form.style.display = form.style.display === 'none' ? '' : 'none';
  });
  cancelBtn.addEventListener('click', () => { form.style.display = 'none'; });

  saveBtn.addEventListener('click', async () => {
    const name  = document.getElementById('mgr-name').value.trim();
    const store = document.getElementById('mgr-store').value.trim();
    const pin   = document.getElementById('mgr-pin').value.trim();
    const email = document.getElementById('mgr-email').value.trim();
    const role  = document.getElementById('mgr-role').value;

    if (!name)  { statusEl.innerHTML = '<span style="color:var(--red)">Name required.</span>'; return; }
    if (!store) { statusEl.innerHTML = '<span style="color:var(--red)">Store # required.</span>'; return; }
    if (!pin || pin.length < 4) { statusEl.innerHTML = '<span style="color:var(--red)">PIN must be 4–6 digits.</span>'; return; }

    saveBtn.disabled = true; saveBtn.textContent = 'Saving…'; statusEl.textContent = '';
    try {
      await sheetsEnsureHeaders(sa, sheetId, 'Managers', ['Name','Store#','PIN','Email','Role']);
      await sheetsAppend(sa, sheetId, 'Managers!A1', [[name, store, pin, email, role]]);
      statusEl.innerHTML = '<span style="color:var(--green)">✓ Manager saved.</span>';
      document.getElementById('mgr-name').value  = '';
      document.getElementById('mgr-store').value = '';
      document.getElementById('mgr-pin').value   = '';
      document.getElementById('mgr-email').value = '';
      form.style.display = 'none';
      loadManagers(sa, sheetId);
    } catch(err) {
      statusEl.innerHTML = `<span style="color:var(--red)">Error: ${err.message}</span>`;
    } finally {
      saveBtn.disabled = false; saveBtn.textContent = 'Save Manager';
    }
  });
}
