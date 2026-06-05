/**
 * Keith's Superdeli — Transfer & Week Closure Notifications
 *
 * Install: Google Sheet → Extensions → Apps Script → paste this → Save
 * Triggers → Add Trigger:
 *   1. onSheetEdit  | From spreadsheet | On edit
 *
 * Emails sent from the Google account that owns the sheet.
 */

var DISTRICT_EMAILS = ['foodservice@keithsuperstore.com', 'foodservice3@keithsuperstore.com', 'foodservices3@gmail.com'];
var FROM_EMAIL      = 'shaunDubuisson24@gmail.com';

// ── Main trigger ──────────────────────────────────────────────
function onSheetEdit(e) {
  var sheet = e.source.getActiveSheet();
  var name  = sheet.getName();

  if (name === 'Merchandise Transfer') handleTransferComplete(e, sheet);
  if (name === 'Week Closures')        handleWeekClosure(e, sheet);
  if (name === 'Recount Log')          handleRecountUnlock(e, sheet);
}

// ── Merchandise Transfer — fires when Status column = COMPLETE ─
function handleTransferComplete(e, sheet) {
  var STATUS_COL = 17;
  if (e.range.getColumn() > STATUS_COL) return;

  var row    = e.range.getRow();
  var status = sheet.getRange(row, STATUS_COL).getValue();
  if (status !== 'COMPLETE') return;

  var numCols = sheet.getLastColumn();
  var data    = sheet.getRange(row, 1, 1, numCols).getValues()[0];

  var fromStore   = data[0]  || '';
  var toStore     = data[1]  || '';
  var description = data[5]  || '';
  var fromSigned  = data[12] || '';
  var toSigned    = data[14] || '';
  var completedAt = data[15] || new Date().toLocaleString();

  // Look up lead emails
  var ss       = e.source;
  var mgrsSheet = ss.getSheetByName('Managers');
  var fromEmail = '', toEmail = '';
  if (mgrsSheet && mgrsSheet.getLastRow() > 1) {
    var mgrs = mgrsSheet.getRange(2, 1, mgrsSheet.getLastRow() - 1, 4).getValues();
    mgrs.forEach(function(m) {
      if (String(m[1]).trim() === String(fromStore).trim()) fromEmail = m[3] || '';
      if (String(m[1]).trim() === String(toStore).trim())   toEmail   = m[3] || '';
    });
  }

  var subject = 'Transfer Complete: Store #' + fromStore + ' → Store #' + toStore;
  var body = [
    'MERCHANDISE TRANSFER — COMPLETE',
    '',
    'Transferring Store: #' + fromStore,
    'Receiving Store:    #' + toStore,
    '',
    'Items: ' + description,
    '',
    'Transferring Lead: ' + fromSigned,
    'Receiving Lead:    ' + toSigned,
    'Completed At:         ' + completedAt,
    '',
    'Full details are in the "Merchandise Transfer" tab of the Google Sheet.',
  ].join('\n');

  var allRecipients = DISTRICT_EMAILS.concat([fromEmail, toEmail]).filter(Boolean);
  var uniqueRecipients = allRecipients.filter(function(v, i, a) { return a.indexOf(v) === i; });

  GmailApp.sendEmail(uniqueRecipients.join(','), subject, body);
}

// ── Week Closure — fires when Status column = CLOSED ──────────
function handleWeekClosure(e, sheet) {
  var STATUS_COL = 8;
  if (e.range.getColumn() > STATUS_COL) return;

  var row    = e.range.getRow();
  var status = sheet.getRange(row, STATUS_COL).getValue();
  if (status !== 'CLOSED') return;

  var data      = sheet.getRange(row, 1, 1, 8).getValues()[0];
  var weekOf    = data[0] || '';
  var storeNum  = data[1] || '';
  var storeName = data[2] || '';
  var closedBy  = data[3] || '';
  var closedAt  = data[4] || new Date().toLocaleString();
  var icfCount  = data[5] || 0;
  var tfCount   = data[6] || 0;

  var ss = e.source;

  // Pull Daily Inv Control rows for this week
  var diSummary = '';
  var diSheet   = ss.getSheetByName('Daily Inv Control');
  if (diSheet && diSheet.getLastRow() > 1) {
    var diRows = diSheet.getRange(2, 1, diSheet.getLastRow() - 1, 11).getValues();
    var weekRows = diRows.filter(function(r) { return String(r[0]).trim() === String(weekOf).trim(); });
    if (weekRows.length > 0) {
      diSummary = '\n--- DAILY INVENTORY COUNTS ---\n';
      weekRows.forEach(function(r) {
        diSummary += r[1] + ' / ' + r[2] + ': ' + r.slice(3).join(', ') + '\n';
      });
    }
  }

  // Pull Bring In rows for this store
  var icfSummary = '';
  var icfSheet   = ss.getSheetByName('Bring In');
  if (icfSheet && icfSheet.getLastRow() > 1) {
    var icfRows = icfSheet.getRange(2, 1, icfSheet.getLastRow() - 1, 11).getValues();
    var storeICF = icfRows.filter(function(r) { return String(r[1]).trim() === String(storeNum).trim(); });
    if (storeICF.length > 0) {
      icfSummary = '\n--- BRING IN / ICF ENTRIES ---\n';
      storeICF.forEach(function(r) {
        icfSummary += r[0] + '  Qty:' + r[2] + '  ' + r[3] + '  Total Cost:' + r[6] + '  Total Retail:' + r[8] + '\n';
      });
    }
  }

  // Pull Merchandise Transfer rows for this store
  var tfSummary = '';
  var tfSheet   = ss.getSheetByName('Merchandise Transfer');
  if (tfSheet && tfSheet.getLastRow() > 1) {
    var tfRows = tfSheet.getRange(2, 1, tfSheet.getLastRow() - 1, 17).getValues();
    var storeTF = tfRows.filter(function(r) {
      return String(r[0]).trim() === String(storeNum).trim() || String(r[1]).trim() === String(storeNum).trim();
    });
    if (storeTF.length > 0) {
      tfSummary = '\n--- MERCHANDISE TRANSFERS ---\n';
      storeTF.forEach(function(r) {
        if (r[5] === 'TRANSFER COMPLETE') return;
        tfSummary += 'From #' + r[0] + ' → To #' + r[1] + '  ' + r[5] + '  Qty:' + r[4] + '  Cost:' + r[6] + '  Status:' + r[16] + '\n';
      });
    }
  }

  var storeLabel = 'Store #' + storeNum + (storeName ? ' — ' + storeName : '');
  var subject    = 'Week Closed: ' + storeLabel + ' — Week of ' + weekOf;
  var body = [
    'WEEK CLOSURE SUMMARY',
    '',
    'Store:       ' + storeLabel,
    'Week Of:     ' + weekOf,
    'Closed By:   ' + closedBy,
    'Closed At:   ' + closedAt,
    'ICF Entries: ' + icfCount,
    'Transfers:   ' + tfCount,
    diSummary,
    icfSummary,
    tfSummary,
    '',
    'Full details are in the Google Sheet.',
  ].join('\n');

  GmailApp.sendEmail(DISTRICT_EMAILS.join(','), subject, body);
}

// ── Recount Unlock — fires when a row is added to Recount Log ─
function handleRecountUnlock(e, sheet) {
  var sheet = e.source.getActiveSheet();
  if (sheet.getName() !== 'Recount Log') return;

  var row  = e.range.getRow();
  if (row < 2) return;
  var data = sheet.getRange(row, 1, 1, 6).getValues()[0];
  if (!data[3]) return; // no name = header row

  var weekOf    = data[0] || '';
  var storeNum  = data[1] || '';
  var storeName = data[2] || '';
  var unlockedBy = data[3] || '';
  var reason    = data[4] || '';
  var ts        = data[5] || new Date().toLocaleString();

  var subject = 'RECOUNT REQUEST: Store #' + storeNum + ' — Week of ' + weekOf;
  var body = [
    'RECOUNT / UNLOCK REQUEST',
    '',
    'Store:       #' + storeNum + (storeName ? ' — ' + storeName : ''),
    'Week Of:     ' + weekOf,
    'Requested By: ' + unlockedBy,
    'Reason:      ' + reason,
    'Timestamp:   ' + ts,
    '',
    'This store has unlocked their closed week to make corrections.',
    'Please review once they re-submit.',
  ].join('\n');

  GmailApp.sendEmail(DISTRICT_EMAILS.join(','), subject, body);
}
