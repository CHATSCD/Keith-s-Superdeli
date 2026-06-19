// Module 4 — Coordinator Dashboard (?view=coordinator)
// Depends on: sheetsApi.js, stores.js

async function coordinatorInit(container, serviceAccount) {
  container.innerHTML = buildCoordinatorShell();
  await loadCoordinatorData(container, serviceAccount);

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

  // ── Transfer & Bring-In Forms (coordinator-created, no PIN) ──
  initCoordTransferForms(serviceAccount);
}

let coordItemPriceByName = {};
let coordItemNames = [];

// Lightweight custom autocomplete (native <datalist> dropdowns don't render reliably in
// Safari/iOS Safari, which is most of the floor traffic for this app).
function attachItemAutocomplete(input) {
  input.setAttribute('autocomplete', 'off');
  let box = null;
  function close() { if (box) { box.remove(); box = null; } }
  function show() {
    const q = input.value.trim().toLowerCase();
    close();
    if (!q || coordItemNames.length === 0) return;
    const matches = coordItemNames.filter(n => n.toLowerCase().includes(q)).slice(0, 8);
    if (matches.length === 0) return;
    const rect = input.getBoundingClientRect();
    box = document.createElement('div');
    box.style.cssText = `position:fixed;z-index:999;left:${rect.left}px;top:${rect.bottom}px;width:${Math.max(rect.width,180)}px;background:#fff;border:1.5px solid var(--gray);border-radius:8px;box-shadow:0 4px 14px rgba(0,0,0,.18);max-height:180px;overflow-y:auto;font-size:13px;`;
    matches.forEach(name => {
      const opt = document.createElement('div');
      opt.textContent = name;
      opt.style.cssText = 'padding:7px 10px;cursor:pointer';
      opt.addEventListener('mouseenter', () => opt.style.background = '#f0f0f0');
      opt.addEventListener('mouseleave', () => opt.style.background = '');
      opt.addEventListener('mousedown', e => {
        e.preventDefault();
        input.value = name;
        close();
        input.dispatchEvent(new Event('input', { bubbles: true }));
      });
      box.appendChild(opt);
    });
    document.body.appendChild(box);
  }
  input.addEventListener('input', show);
  input.addEventListener('focus', show);
  input.addEventListener('blur', () => setTimeout(close, 150));
}

// Load the item + price catalog from Store #60's count sheet (Deli / Branded Deli / Fountain
// tabs) to power the description dropdowns on the coordinator's Transfer & Bring-In forms.
async function loadCoordItemCatalog(sa) {
  const statusEl = document.getElementById('coord-item-catalog-status');
  const refStore = (typeof STORES !== 'undefined') ? STORES['60'] : null;
  const sheetId  = refStore && (refStore.countSheetId || refStore.sheetId);
  if (!sheetId) {
    if (statusEl) statusEl.textContent = 'Store #60 count sheet not configured — type item names manually.';
    return;
  }

  const SECTION_TABS = ['Deli', 'Branded Deli', 'Fountain'];
  const TAB_ALIASES = {
    'Deli':         ['Deli', 'DELI', 'Deli Counter', 'Deli Items', 'Deli Inventory'],
    'Branded Deli': ['Branded Deli', 'BRANDED DELI', 'Branded', 'Hunt Brothers', 'HB'],
    'Fountain':     ['Fountain', 'FOUNTAIN', 'Beverage', 'Beverages', 'Beverage Station', 'Icee', 'ICEE'],
  };

  try {
    const sections = await Promise.all(SECTION_TABS.map(async tabName => {
      const aliases = TAB_ALIASES[tabName] || [tabName];
      for (const name of aliases) {
        try {
          const res = await sheetsGet(sa, sheetId, `${name}!A1:Z1000`);
          if (res.values && res.values.length > 0) return { rows: res.values };
        } catch (_) { /* try next alias */ }
      }
      return { rows: [] };
    }));

    const items = [];
    sections.forEach(sec => {
      const p = parseInventorySection(sec);
      p.dataRows.forEach(r => {
        const name = (r[p.nameColIdx] || '').trim();
        if (!name) return;
        const price = parseFloat(r[p.perColIdx]) || 0;
        items.push({ name, price });
      });
    });

    const seen = new Set();
    coordItemPriceByName = {};
    coordItemNames = items
      .filter(i => { const k = i.name.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; })
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(i => { coordItemPriceByName[i.name.toLowerCase()] = i.price; return i.name; });

    if (statusEl) {
      statusEl.textContent = seen.size
        ? `${seen.size} items loaded from Store #60's count sheet — start typing in Description to pick one (price auto-fills).`
        : "No items found on Store #60's count sheet.";
    }
  } catch (err) {
    if (statusEl) statusEl.textContent = `Could not load item catalog: ${err.message}`;
  }
}

function initCoordTransferForms(sa) {
  const transferBlock = document.getElementById('coord-transfer-block');
  const bringinBlock  = document.getElementById('coord-bringin-block');
  const typeTransferBtn = document.getElementById('coord-tf-type-transfer');
  const typeBringinBtn  = document.getElementById('coord-tf-type-bringin');
  if (!transferBlock) return;

  loadCoordItemCatalog(sa);
  document.querySelectorAll('.ctf-desc, .cbi-desc').forEach(attachItemAutocomplete);

  const today = new Date().toISOString().split('T')[0];
  document.getElementById('ctf-date').value = today;
  document.getElementById('cbi-date').value = today;

  typeTransferBtn.addEventListener('click', () => {
    transferBlock.style.display = '';
    bringinBlock.style.display  = 'none';
    typeTransferBtn.className = 'btn btn-primary btn-sm';
    typeBringinBtn.className  = 'btn btn-ghost btn-sm';
  });
  typeBringinBtn.addEventListener('click', () => {
    transferBlock.style.display = 'none';
    bringinBlock.style.display  = '';
    typeTransferBtn.className = 'btn btn-ghost btn-sm';
    typeBringinBtn.className  = 'btn btn-primary btn-sm';
  });

  // ── Transfer: item picked from catalog → auto-fill cost ──
  document.getElementById('ctf-table').addEventListener('input', e => {
    if (!e.target.classList.contains('ctf-desc')) return;
    const row = e.target.closest('tr');
    const price = coordItemPriceByName[e.target.value.trim().toLowerCase()];
    const costInput = row?.querySelector('.ctf-cost');
    if (price && costInput && !costInput.value) {
      costInput.value = price.toFixed(2);
      costInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });

  // ── Transfer: auto-calc extended cost/retail ──
  document.getElementById('ctf-table').addEventListener('input', e => {
    const row = e.target.closest('tr');
    if (!row) return;
    const qty  = parseFloat(row.querySelector('.ctf-qty')?.value)     || 0;
    const cost = parseFloat(row.querySelector('.ctf-cost')?.value)    || 0;
    const sret = parseFloat(row.querySelector('.ctf-sretail')?.value) || 0;
    const rret = parseFloat(row.querySelector('.ctf-rretail')?.value) || 0;
    row.querySelector('.ctf-extcost').textContent    = qty && cost ? '$' + (qty*cost).toFixed(2) : '';
    row.querySelector('.ctf-sextretail').textContent = qty && sret ? '$' + (qty*sret).toFixed(2) : '';
    row.querySelector('.ctf-rextretail').textContent = qty && rret ? '$' + (qty*rret).toFixed(2) : '';
  });

  function collectTransferLines() {
    const lines = [];
    document.querySelectorAll('#ctf-table tbody tr').forEach(r => {
      const qty  = r.querySelector('.ctf-qty')?.value?.trim();
      const desc = r.querySelector('.ctf-desc')?.value?.trim();
      if (!qty && !desc) return;
      lines.push({
        dept: r.querySelector('.ctf-dept')?.value?.trim() || '',
        qty, desc,
        cost: r.querySelector('.ctf-cost')?.value?.trim() || '',
        extCost: r.querySelector('.ctf-extcost')?.textContent?.trim() || '',
        sRetail: r.querySelector('.ctf-sretail')?.value?.trim() || '',
        sExtRetail: r.querySelector('.ctf-sextretail')?.textContent?.trim() || '',
        rRetail: r.querySelector('.ctf-rretail')?.value?.trim() || '',
        rExtRetail: r.querySelector('.ctf-rextretail')?.textContent?.trim() || '',
      });
    });
    return lines;
  }

  document.getElementById('ctf-save-btn').addEventListener('click', async () => {
    const btn      = document.getElementById('ctf-save-btn');
    const statusEl = document.getElementById('ctf-status');
    const fromStore = document.getElementById('ctf-from-store').value;
    const toStore    = document.getElementById('ctf-to-store').value;
    const date       = document.getElementById('ctf-date').value;
    if (!fromStore || !toStore) { statusEl.innerHTML = '<span style="color:var(--red)">Select both stores.</span>'; return; }
    if (fromStore === toStore)  { statusEl.innerHTML = '<span style="color:var(--red)">Stores must be different.</span>'; return; }
    const sheetId = (typeof STORES !== 'undefined' && STORES[fromStore]) ? STORES[fromStore].sheetId : '';
    if (!sheetId) { statusEl.innerHTML = '<span style="color:var(--red)">No sheet configured for that store.</span>'; return; }

    const lines = collectTransferLines();
    if (lines.length === 0) { statusEl.innerHTML = '<span style="color:var(--red)">Add at least one item.</span>'; return; }

    btn.disabled = true; btn.textContent = 'Saving…'; statusEl.textContent = '';
    const ts = new Date().toLocaleString();
    const sheetRows = lines.map(l => [
      fromStore, toStore, date, l.dept, l.qty, l.desc, l.cost, l.extCost,
      l.sRetail, l.sExtRetail, l.rRetail, l.rExtRetail,
      'Coordinator', ts, '', '', 'CREATED BY COORDINATOR — PENDING SIGNATURES',
    ]);
    try {
      await sheetsEnsureHeaders(sa, sheetId, 'Merchandise Transfer', [
        'From Store','To Store','Date','Dept','Qty','Description','Cost','Ext Cost',
        'Transfer Retail','Transfer Ext Retail','Receiving Retail','Receiving Ext Retail',
        'From Signed By','From Signed At','To Signed By','To Signed At','Status'
      ]);
      await sheetsAppend(sa, sheetId, 'Merchandise Transfer!A1', sheetRows);
      statusEl.innerHTML = '<span style="color:var(--green)">✓ Transfer sheet saved. Print it and get both stores to sign.</span>';
    } catch (err) {
      statusEl.innerHTML = `<span style="color:var(--red)">Error: ${err.message}</span>`;
    } finally {
      btn.disabled = false; btn.textContent = 'Save Transfer Sheet';
    }
  });

  document.getElementById('ctf-print-btn').addEventListener('click', () => {
    const date    = document.getElementById('ctf-date').value;
    const fromNum = document.getElementById('ctf-from-store').value;
    const toNum   = document.getElementById('ctf-to-store').value;
    const lines = collectTransferLines();
    printTransferOrBringIn({
      title: 'Merchandise Transfer',
      topFields: [`Transferring Store #: ${fromNum || '_______'}`, `Receiving Store #: ${toNum || '_______'}`],
      headers: ['Date','Dept','Qty','Item Description','Cost','Extended Cost','Transferring Store Retail','Transferring Store Extended Retail','Receiving Store Retail','Receiving Store Extended Retail'],
      rows: lines.map(l => [date, l.dept, l.qty, l.desc, l.cost, l.extCost, l.sRetail, l.sExtRetail, l.rRetail, l.rExtRetail]),
      signatures: ['Transferring Manager Signature', 'Receiving Manager Signature', 'District Manager Signature'],
    });
  });

  // ── Bring In / ICF: item picked from catalog → auto-fill unit cost ──
  document.getElementById('cbi-table').addEventListener('input', e => {
    if (!e.target.classList.contains('cbi-desc')) return;
    const row = e.target.closest('tr');
    const price = coordItemPriceByName[e.target.value.trim().toLowerCase()];
    const costInput = row?.querySelector('.cbi-ucost');
    if (price && costInput && !costInput.value) {
      costInput.value = price.toFixed(2);
      costInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });

  // ── Bring In / ICF: auto-calc totals ──
  document.getElementById('cbi-table').addEventListener('input', e => {
    const row = e.target.closest('tr');
    if (!row) return;
    const qty   = parseFloat(row.querySelector('.cbi-qty')?.value)     || 0;
    const ucost = parseFloat(row.querySelector('.cbi-ucost')?.value)   || 0;
    const uret  = parseFloat(row.querySelector('.cbi-uretail')?.value) || 0;
    const tc = qty * ucost, tr = qty * uret;
    row.querySelector('.cbi-tcost').textContent   = tc ? '$' + tc.toFixed(2) : '';
    row.querySelector('.cbi-tretail').textContent = tr ? '$' + tr.toFixed(2) : '';

    let totalCost = 0, totalRetail = 0;
    document.querySelectorAll('#cbi-table tbody tr').forEach(r => {
      totalCost   += parseFloat(r.querySelector('.cbi-tcost')?.textContent?.replace('$',''))   || 0;
      totalRetail += parseFloat(r.querySelector('.cbi-tretail')?.textContent?.replace('$',''))|| 0;
    });
    document.getElementById('cbi-total-cost').textContent   = '$' + totalCost.toFixed(2);
    document.getElementById('cbi-total-retail').textContent = '$' + totalRetail.toFixed(2);
  });

  function collectBringInLines() {
    const lines = [];
    document.querySelectorAll('#cbi-table tbody tr').forEach(r => {
      const qty  = r.querySelector('.cbi-qty')?.value?.trim();
      const desc = r.querySelector('.cbi-desc')?.value?.trim();
      if (!qty && !desc) return;
      lines.push({
        qty, desc,
        dept: r.querySelector('.cbi-dept')?.value?.trim() || '',
        ucost: r.querySelector('.cbi-ucost')?.value?.trim() || '',
        tcost: r.querySelector('.cbi-tcost')?.textContent?.trim() || '',
        uretail: r.querySelector('.cbi-uretail')?.value?.trim() || '',
        tretail: r.querySelector('.cbi-tretail')?.textContent?.trim() || '',
      });
    });
    return lines;
  }

  document.getElementById('cbi-save-btn').addEventListener('click', async () => {
    const btn      = document.getElementById('cbi-save-btn');
    const statusEl = document.getElementById('cbi-status');
    const store    = document.getElementById('cbi-store').value;
    const date     = document.getElementById('cbi-date').value;
    if (!store) { statusEl.innerHTML = '<span style="color:var(--red)">Select a store.</span>'; return; }
    const sheetId = (typeof STORES !== 'undefined' && STORES[store]) ? STORES[store].sheetId : '';
    if (!sheetId) { statusEl.innerHTML = '<span style="color:var(--red)">No sheet configured for that store.</span>'; return; }

    const lines = collectBringInLines();
    if (lines.length === 0) { statusEl.innerHTML = '<span style="color:var(--red)">Add at least one item.</span>'; return; }

    btn.disabled = true; btn.textContent = 'Saving…'; statusEl.textContent = '';
    const ts = new Date().toLocaleString();
    const sheetRows = lines.map(l => [
      date, store, l.qty, l.desc, l.dept, l.ucost, l.tcost, l.uretail, l.tretail, 'Coordinator', ts,
    ]);
    try {
      await sheetsEnsureHeaders(sa, sheetId, 'Bring In', ['Date','Store#','Qty','Description','Dept#','Unit Cost','Total Cost','Unit Retail','Total Retail','Signed By','Timestamp']);
      await sheetsAppend(sa, sheetId, 'Bring In!A1', sheetRows);
      statusEl.innerHTML = '<span style="color:var(--green)">✓ Bring-In sheet saved. Print it and get the store manager to sign.</span>';
    } catch (err) {
      statusEl.innerHTML = `<span style="color:var(--red)">Error: ${err.message}</span>`;
    } finally {
      btn.disabled = false; btn.textContent = 'Save Bring-In Sheet';
    }
  });

  document.getElementById('cbi-print-btn').addEventListener('click', () => {
    const date  = document.getElementById('cbi-date').value;
    const store = document.getElementById('cbi-store').value;
    const lines = collectBringInLines();
    let totalCost = 0, totalRetail = 0;
    lines.forEach(l => {
      totalCost   += parseFloat((l.tcost || '').replace('$','')) || 0;
      totalRetail += parseFloat((l.tretail || '').replace('$','')) || 0;
    });
    printTransferOrBringIn({
      title: 'Bring In / ICF Form',
      topFields: [`Date: ${date || '_______'}`, `Store #: ${store || '_______'}`],
      headers: ['Qty','Description','Dept #','Unit Cost','Total Cost','Unit Retail','Total Retail'],
      rows: lines.map(l => [l.qty, l.desc, l.dept, l.ucost, l.tcost, l.uretail, l.tretail]),
      footerNote: `Total Cost: $${totalCost.toFixed(2)}    Total Retail: $${totalRetail.toFixed(2)}<br>Invoice will be entered in the office. Only put on your ICF.`,
    });
  });
}

function printTransferOrBringIn({ title, topFields, headers, rows, signatures, footerNote }) {
  const win = window.open('', '_blank');
  if (!win) { alert('Pop-up blocked. Allow pop-ups to print.'); return; }
  const rowsHTML = rows.length
    ? rows.map(r => `<tr>${r.map(c => `<td>${c || ''}</td>`).join('')}</tr>`).join('')
    : `<tr><td colspan="${headers.length}" style="text-align:center;color:#888">No items entered.</td></tr>`;
  win.document.write(`
    <html>
    <head>
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 24px; color: #1a1a1a; }
        h1 { font-size: 18px; margin-bottom: 14px; text-align: center; }
        .top-fields { display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 16px; flex-wrap: wrap; gap: 12px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th, td { border: 1px solid #999; padding: 5px 7px; text-align: left; }
        th { background: #1a2744; color: #fff; }
        .footer-note { margin-top: 14px; font-size: 13px; }
        .sig-block { margin-top: 36px; display: flex; gap: 40px; flex-wrap: wrap; }
        .sig-line { flex: 1; min-width: 220px; border-top: 1px solid #1a1a1a; padding-top: 6px; font-size: 12px; }
      </style>
    </head>
    <body>
      <h1>Keith's Superdeli — ${title}</h1>
      <div class="top-fields">${(topFields||[]).map(m => `<span>${m}</span>`).join('')}</div>
      <table>
        <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
        <tbody>${rowsHTML}</tbody>
      </table>
      ${footerNote ? `<div class="footer-note">${footerNote}</div>` : ''}
      ${signatures && signatures.length ? `<div class="sig-block">${signatures.map(s => `<div class="sig-line">${s}</div>`).join('')}</div>` : ''}
      <script>window.onload = () => { window.print(); };</script>
    </body>
    </html>
  `);
  win.document.close();
}

function buildCoordinatorShell() {
  return `
    <div class="card">
      <div class="card-title" style="font-size:18px">Food &amp; Beverage Department Dashboard</div>
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
      <div class="card-title">Transfer &amp; Bring-In Forms</div>
      <p style="font-size:13px;color:var(--muted);margin-bottom:12px">
        Create a Merchandise Transfer or Bring-In (ICF) sheet yourself — no manager PIN needed.
        Save it, then print and get wet signatures from the store(s) involved.
      </p>

      <div style="display:flex;gap:8px;margin-bottom:14px">
        <button class="btn btn-primary btn-sm" id="coord-tf-type-transfer">Merchandise Transfer</button>
        <button class="btn btn-ghost btn-sm" id="coord-tf-type-bringin">Bring In (ICF)</button>
      </div>
      <div id="coord-item-catalog-status" style="font-size:12px;color:var(--muted);margin-bottom:10px">Loading item catalog from Store #60's count sheet…</div>

      <!-- Merchandise Transfer block -->
      <div id="coord-transfer-block">
        <div style="display:flex;gap:16px;margin-bottom:12px;flex-wrap:wrap">
          <div class="form-row"><label>Transferring Store</label>
            <select id="ctf-from-store" style="padding:6px 10px;border:1.5px solid var(--gray);border-radius:8px;font-size:13px;font-family:inherit">
              <option value="">— Select Store —</option>
              ${Object.keys(typeof STORES!=='undefined'?STORES:{}).sort((a,b)=>Number(a)-Number(b)).map(n=>{const s=(typeof STORES!=='undefined'?STORES:{})[n];return`<option value="${n}">#${n}${s&&s.name?' — '+s.name:''}</option>`;}).join('')}
            </select>
          </div>
          <div class="form-row"><label>Receiving Store</label>
            <select id="ctf-to-store" style="padding:6px 10px;border:1.5px solid var(--gray);border-radius:8px;font-size:13px;font-family:inherit">
              <option value="">— Select Store —</option>
              ${Object.keys(typeof STORES!=='undefined'?STORES:{}).sort((a,b)=>Number(a)-Number(b)).map(n=>{const s=(typeof STORES!=='undefined'?STORES:{})[n];return`<option value="${n}">#${n}${s&&s.name?' — '+s.name:''}</option>`;}).join('')}
            </select>
          </div>
          <div class="form-row"><label>Date</label><input type="date" id="ctf-date" style="padding:6px 10px;border:1.5px solid var(--gray);border-radius:8px;font-size:13px;font-family:inherit"></div>
        </div>

        <div class="table-wrap">
          <table class="data-table" id="ctf-table" style="min-width:900px">
            <thead><tr>
              <th style="width:70px">Dept</th><th style="width:60px">Qty</th><th>Item Description</th>
              <th style="width:80px">Cost</th><th style="width:80px">Ext Cost</th>
              <th style="width:90px">Transfer Retail</th><th style="width:100px">Transfer Ext Retail</th>
              <th style="width:90px">Receiving Retail</th><th style="width:100px">Receiving Ext Retail</th>
            </tr></thead>
            <tbody>${Array.from({length: 10}, () => `
              <tr>
                <td style="padding:3px 4px"><input type="text" class="ctf-dept" style="width:56px;padding:4px 6px;border:1.5px solid var(--gray);border-radius:6px;font-size:13px;text-align:center;background:var(--white)"></td>
                <td style="padding:3px 4px"><input type="number" class="ctf-qty" min="0" step="1" style="width:48px;padding:4px 6px;border:1.5px solid var(--gray);border-radius:6px;font-size:13px;text-align:center;background:var(--white)"></td>
                <td style="padding:3px 4px"><input type="text" class="ctf-desc" placeholder="type to search items…" style="width:100%;padding:4px 6px;border:1.5px solid var(--gray);border-radius:6px;font-size:13px;background:var(--white)"></td>
                <td style="padding:3px 4px"><input type="number" class="ctf-cost" min="0" step="0.01" style="width:68px;padding:4px 6px;border:1.5px solid var(--gray);border-radius:6px;font-size:13px;text-align:center;background:var(--white)"></td>
                <td style="padding:3px 4px"><span class="ctf-extcost" style="display:inline-block;min-width:68px;font-weight:600;font-size:13px;padding:4px 6px"></span></td>
                <td style="padding:3px 4px"><input type="number" class="ctf-sretail" min="0" step="0.01" style="width:68px;padding:4px 6px;border:1.5px solid var(--gray);border-radius:6px;font-size:13px;text-align:center;background:var(--white)"></td>
                <td style="padding:3px 4px"><span class="ctf-sextretail" style="display:inline-block;min-width:68px;font-weight:600;font-size:13px;padding:4px 6px"></span></td>
                <td style="padding:3px 4px"><input type="number" class="ctf-rretail" min="0" step="0.01" style="width:68px;padding:4px 6px;border:1.5px solid var(--gray);border-radius:6px;font-size:13px;text-align:center;background:var(--white)"></td>
                <td style="padding:3px 4px"><span class="ctf-rextretail" style="display:inline-block;min-width:68px;font-weight:600;font-size:13px;padding:4px 6px"></span></td>
              </tr>`).join('')}</tbody>
          </table>
        </div>

        <div class="btn-row" style="margin-top:10px">
          <button class="btn btn-primary btn-sm" id="ctf-save-btn">Save Transfer Sheet</button>
          <button class="btn btn-outline btn-sm" id="ctf-print-btn">Print</button>
        </div>
        <div id="ctf-status" style="font-size:13px;margin-top:6px"></div>
      </div>

      <!-- Bring In / ICF block -->
      <div id="coord-bringin-block" style="display:none">
        <div style="display:flex;gap:16px;margin-bottom:12px;flex-wrap:wrap">
          <div class="form-row"><label>Store</label>
            <select id="cbi-store" style="padding:6px 10px;border:1.5px solid var(--gray);border-radius:8px;font-size:13px;font-family:inherit">
              <option value="">— Select Store —</option>
              ${Object.keys(typeof STORES!=='undefined'?STORES:{}).sort((a,b)=>Number(a)-Number(b)).map(n=>{const s=(typeof STORES!=='undefined'?STORES:{})[n];return`<option value="${n}">#${n}${s&&s.name?' — '+s.name:''}</option>`;}).join('')}
            </select>
          </div>
          <div class="form-row"><label>Date</label><input type="date" id="cbi-date" style="padding:6px 10px;border:1.5px solid var(--gray);border-radius:8px;font-size:13px;font-family:inherit"></div>
        </div>

        <div class="table-wrap">
          <table class="data-table" id="cbi-table" style="min-width:640px">
            <thead><tr>
              <th style="width:60px">Qty</th>
              <th>Description</th>
              <th style="width:70px">Dept #</th>
              <th style="width:90px">Unit Cost</th>
              <th style="width:90px">Total Cost</th>
              <th style="width:90px">Unit Retail</th>
              <th style="width:90px">Total Retail</th>
            </tr></thead>
            <tbody>${Array.from({length: 20}, () => `
              <tr>
                <td style="padding:3px 4px"><input type="number" class="cbi-qty" min="0" step="1" style="width:52px;padding:4px 6px;border:1.5px solid var(--gray);border-radius:6px;font-size:13px;text-align:center;background:var(--white)"></td>
                <td style="padding:3px 4px"><input type="text" class="cbi-desc" placeholder="type to search items…" style="width:100%;padding:4px 6px;border:1.5px solid var(--gray);border-radius:6px;font-size:13px;background:var(--white)"></td>
                <td style="padding:3px 4px"><input type="text" class="cbi-dept" style="width:60px;padding:4px 6px;border:1.5px solid var(--gray);border-radius:6px;font-size:13px;text-align:center;background:var(--white)"></td>
                <td style="padding:3px 4px"><input type="number" class="cbi-ucost" min="0" step="0.01" style="width:80px;padding:4px 6px;border:1.5px solid var(--gray);border-radius:6px;font-size:13px;text-align:center;background:var(--white)"></td>
                <td style="padding:3px 4px"><span class="cbi-tcost" style="display:inline-block;min-width:80px;font-weight:600;font-size:13px;padding:4px 6px"></span></td>
                <td style="padding:3px 4px"><input type="number" class="cbi-uretail" min="0" step="0.01" style="width:80px;padding:4px 6px;border:1.5px solid var(--gray);border-radius:6px;font-size:13px;text-align:center;background:var(--white)"></td>
                <td style="padding:3px 4px"><span class="cbi-tretail" style="display:inline-block;min-width:80px;font-weight:600;font-size:13px;padding:4px 6px"></span></td>
              </tr>`).join('')}</tbody>
            <tfoot><tr>
              <td colspan="4" style="text-align:right;font-weight:700;padding:6px 10px">Totals:</td>
              <td style="font-weight:700;padding:6px 6px"><span id="cbi-total-cost">$0.00</span></td>
              <td></td>
              <td style="font-weight:700;padding:6px 6px"><span id="cbi-total-retail">$0.00</span></td>
            </tr></tfoot>
          </table>
        </div>

        <div class="btn-row" style="margin-top:10px">
          <button class="btn btn-primary btn-sm" id="cbi-save-btn">Save Bring-In Sheet</button>
          <button class="btn btn-outline btn-sm" id="cbi-print-btn">Print</button>
        </div>
        <div id="cbi-status" style="font-size:13px;margin-top:6px"></div>
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
