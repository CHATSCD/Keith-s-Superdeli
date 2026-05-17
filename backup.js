// Module — Chain-Wide Weekly Backup
// Creates a dated "Backup YYYY-MM-DD" tab in each store's Deli Pro sheet
// containing a snapshot of the Inventory tab. Keeps the 4 most recent
// backup tabs and deletes any older ones automatically.
// Depends on: sheetsApi.js, stores.js

const BACKUP_KEEP   = 4;
const BACKUP_PREFIX = 'Backup ';

// Back up a single store. Returns { skipped, tabName, itemCount } or throws.
async function backupStore(sa, sheetId) {
  const dateLabel  = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const newTabName = BACKUP_PREFIX + dateLabel;

  // Get all existing tabs
  const meta   = await sheetsGetMetadata(sa, sheetId);
  const sheets = (meta.sheets || []).map(s => s.properties);

  // Backup tabs sorted oldest → newest by name
  const backupTabs = sheets
    .filter(p => p.title.startsWith(BACKUP_PREFIX))
    .sort((a, b) => a.title.localeCompare(b.title));

  // If today's backup already exists, skip
  if (backupTabs.some(p => p.title === newTabName)) return { skipped: true, tabName: newTabName };

  // Delete oldest tabs so we never exceed BACKUP_KEEP after adding the new one
  const overflow = backupTabs.length - BACKUP_KEEP + 1;
  for (let i = 0; i < overflow; i++) {
    await sheetsDeleteTab(sa, sheetId, backupTabs[i].sheetId);
  }

  // Create the new backup tab
  await sheetsAddTab(sa, sheetId, newTabName);

  // Copy Inventory → new tab
  const inv  = await sheetsGet(sa, sheetId, 'Inventory!A:I');
  const rows = inv.values || [];
  if (rows.length) {
    await sheetsUpdate(sa, sheetId, `${newTabName}!A1`, rows);
  }

  return { skipped: false, tabName: newTabName, itemCount: Math.max(0, rows.length - 1) };
}

// Back up every store that has a sheetId. Shows progress in #backup-status.
async function backupAllStores(sa) {
  const statusEl = document.getElementById('backup-status');
  const btnEl    = document.getElementById('backup-all-btn');

  if (btnEl)    { btnEl.disabled = true; btnEl.textContent = 'Backing up…'; }
  if (statusEl) statusEl.innerHTML = '<span style="color:var(--muted)">Starting backup for all stores…</span>';

  const entries = Object.entries(STORES).filter(([, s]) => s.sheetId);
  let done = 0, skipped = 0, errors = 0;
  const errorList = [];

  for (const [num, store] of entries) {
    if (statusEl) {
      statusEl.innerHTML = `<span style="color:var(--muted)">
        Backing up store #${num} ${store.name} (${done + skipped + errors + 1} / ${entries.length})…
      </span>`;
    }
    try {
      const result = await backupStore(sa, store.sheetId);
      result.skipped ? skipped++ : done++;
    } catch (err) {
      errors++;
      errorList.push(`#${num} ${store.name}: ${err.message}`);
    }
  }

  if (btnEl) { btnEl.disabled = false; btnEl.textContent = 'Backup All Stores Now'; }

  if (!statusEl) return;

  if (errors === 0) {
    statusEl.innerHTML = `
      <div class="banner banner-brand" style="margin-top:8px">
        <div class="banner-icon">✓</div>
        <div>
          <strong>Backup complete.</strong>
          ${done} store${done !== 1 ? 's' : ''} backed up${skipped ? `, ${skipped} already had today's backup` : ''}.
          Each store keeps the last ${BACKUP_KEEP} weekly snapshots.
        </div>
      </div>`;
  } else {
    statusEl.innerHTML = `
      <div class="banner banner-warn" style="margin-top:8px">
        <div class="banner-icon">⚠</div>
        <div>
          <strong>${done} backed up, ${errors} failed${skipped ? `, ${skipped} skipped` : ''}.</strong>
          <ul style="margin-top:6px;padding-left:18px;font-size:12px">
            ${errorList.map(e => `<li>${e}</li>`).join('')}
          </ul>
        </div>
      </div>`;
  }
}
