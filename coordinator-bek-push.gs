/**
 * coordinator-bek-push.gs
 * ─────────────────────────────────────────────────────────────────────────
 * Paste this into the coordinator spreadsheet's Apps Script editor.
 * Run pushBEKPricesToAllStores() once a week after updating the BEK List tab.
 *
 * HOW TO SET UP:
 *   1. Open the coordinator spreadsheet → Extensions → Apps Script
 *   2. Delete any existing code and paste this entire file
 *   3. Fill in SB_URL and SB_KEY with your Supabase project credentials
 *      (Supabase → Settings → API → Project URL + anon public key)
 *   4. Create the bek_prices table in Supabase (run the SQL below once):
 *
 *      CREATE TABLE bek_prices (
 *        item_num  TEXT PRIMARY KEY,
 *        price     NUMERIC(10,4) NOT NULL,
 *        updated_at TIMESTAMPTZ DEFAULT now()
 *      );
 *      ALTER TABLE bek_prices ENABLE ROW LEVEL SECURITY;
 *      CREATE POLICY "allow anon read" ON bek_prices FOR SELECT USING (true);
 *      CREATE POLICY "allow anon upsert" ON bek_prices FOR INSERT WITH CHECK (true);
 *      CREATE POLICY "allow anon update" ON bek_prices FOR UPDATE USING (true);
 *
 *   5. Your BEK List tab must have a header row with at minimum:
 *        Item#   (item number — must match what's in the store count sheets)
 *        Price   (current BEK cost)
 *   6. Click ▶ Run and select pushBEKPricesToAllStores when prompted
 *   7. To run automatically: Triggers → Add Trigger → pushBEKPricesToAllStores
 *      → Time-driven → Week timer → Monday morning
 * ─────────────────────────────────────────────────────────────────────────
 */

// ── Supabase credentials ────────────────────────────────────────────────────
const SB_URL = 'https://YOUR_PROJECT.supabase.co';   // ← replace
const SB_KEY = 'YOUR_SUPABASE_ANON_KEY';             // ← replace

// ── BEK List tab name ───────────────────────────────────────────────────────
const BEK_TAB = 'BEK List';

// ===========================================================================
// pushBEKPricesToAllStores()
// Reads Item# + Price from the BEK List tab → upserts to Supabase bek_prices.
// All 43 Deli Pro stores pull from this table when a store saves "Purch?" items.
// ===========================================================================
function pushBEKPricesToAllStores() {
  if (SB_URL.startsWith('https://YOUR_PROJECT') || SB_KEY.startsWith('YOUR_')) {
    SpreadsheetApp.getUi().alert(
      'Setup required: fill in SB_URL and SB_KEY at the top of the script.'
    );
    return;
  }

  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(BEK_TAB);
  if (!sheet) {
    SpreadsheetApp.getUi().alert('ERROR: Could not find tab "' + BEK_TAB + '".');
    return;
  }

  const data = sheet.getDataRange().getValues();
  if (data.length < 2) {
    SpreadsheetApp.getUi().alert('No data found in "' + BEK_TAB + '" tab.');
    return;
  }

  // Locate Item# and Price columns from header row
  const hdrs      = data[0].map(function(h) { return String(h).trim().toLowerCase(); });
  const itemNumCol = hdrs.findIndex(function(h) { return /item.?#|item.?num/i.test(h); });
  const priceCol   = hdrs.findIndex(function(h) { return /^price$|^cost$|^per$/i.test(h); });

  if (itemNumCol === -1) {
    SpreadsheetApp.getUi().alert('Could not find "Item#" column in "' + BEK_TAB + '" tab.');
    return;
  }
  if (priceCol === -1) {
    SpreadsheetApp.getUi().alert('Could not find "Price" (or "Cost" / "Per") column in "' + BEK_TAB + '" tab.');
    return;
  }

  // Build upsert payload — skip rows with no item number or zero price
  var rows = [];
  for (var i = 1; i < data.length; i++) {
    var itemNum = String(data[i][itemNumCol] || '').trim();
    var price   = parseFloat(data[i][priceCol]) || 0;
    if (itemNum && price > 0) {
      rows.push({ item_num: itemNum, price: price, updated_at: new Date().toISOString() });
    }
  }

  if (rows.length === 0) {
    SpreadsheetApp.getUi().alert('No valid rows to push. Check that Item# and Price columns have data.');
    return;
  }

  // Upsert to Supabase (merge-duplicates resolves conflicts on item_num primary key)
  var url = SB_URL + '/rest/v1/bek_prices';
  var options = {
    method: 'POST',
    headers: {
      'apikey':        SB_KEY,
      'Authorization': 'Bearer ' + SB_KEY,
      'Content-Type':  'application/json',
      'Prefer':        'resolution=merge-duplicates',
    },
    payload:            JSON.stringify(rows),
    muteHttpExceptions: true,
  };

  var resp = UrlFetchApp.fetch(url, options);
  var code = resp.getResponseCode();

  if (code === 200 || code === 201) {
    SpreadsheetApp.getUi().alert(
      '✓ Pushed ' + rows.length + ' BEK prices to the Supabase feed.\n' +
      'All store apps will now see updated prices when saving Purch? items.'
    );
  } else {
    SpreadsheetApp.getUi().alert(
      'Supabase error ' + code + ':\n' + resp.getContentText()
    );
  }
}
