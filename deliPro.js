// Module 1 — Deli Pro
// Placeholder that renders the existing Deli Pro interface inside an iframe
// or as an embedded module once you share the existing Deli Pro source.
//
// The function signature matches the other modules so index.html can call it uniformly.
// Replace the body of deliProInit() with your ported Deli Pro code.

function deliProInit(container, storeNum, storeName, sheetId, serviceAccount) {
  container.innerHTML = `
    <div class="card">
      <div class="card-title">Deli Pro — Store #${storeNum} ${storeName}</div>
      <div class="banner banner-info" style="margin-bottom:16px">
        Deli Pro module ready for integration. Share your existing Deli Pro source code
        and it will be ported into this module, retaining all current functionality:
        Inventory, Food Cost, Invoices, Orders, Recipes, Suppliers, Analytics.
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px">
        ${[
          ['Inventory',   'Track stock levels'],
          ['Food Cost',   'Cost % analysis'],
          ['Invoices',    'Log received invoices'],
          ['Orders',      'Manage orders'],
          ['Recipes',     'Recipe costing'],
          ['Suppliers',   'Supplier contacts'],
          ['Analytics',   'Trends & reports'],
        ].map(([label, desc]) => `
          <div class="card" style="text-align:center;padding:20px 12px;margin:0;cursor:pointer">
            <div style="font-weight:700;color:var(--navy);margin-bottom:4px">${label}</div>
            <div style="font-size:12px;color:var(--muted)">${desc}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="card" style="margin-top:12px">
      <div class="card-title">Quick Stats</div>
      <p style="color:var(--muted);font-size:13px">
        Connect the Deli Pro module to load live inventory and food cost data from
        the "Deli Pro" tab of this store's Google Sheet (Sheet ID: ${sheetId || 'not configured'}).
      </p>
    </div>
  `;
}
