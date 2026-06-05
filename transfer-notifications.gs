/**
 * Keith's Superdeli — Merchandise Transfer Notification
 *
 * Install: open your Google Sheet → Extensions → Apps Script → paste this file.
 * Then: Triggers → Add Trigger → onTransferEdit | From spreadsheet | On edit
 *
 * Sends an email when a Merchandise Transfer row is marked COMPLETE.
 */

const DISTRICT_EMAIL = 'foodservices3@gmail.com';
const FROM_EMAIL     = 'shaunDubuisson24@gmail.com';  // must own the sheet

function onTransferEdit(e) {
  const sheet = e.source.getActiveSheet();
  if (sheet.getName() !== 'Merchandise Transfer') return;

  const range  = e.range;
  const row    = range.getRow();
  const numCols = sheet.getLastColumn();

  // Status is in column 17 (Q)
  const STATUS_COL = 17;
  if (range.getColumn() > STATUS_COL) return;

  const statusVal = sheet.getRange(row, STATUS_COL).getValue();
  if (statusVal !== 'COMPLETE') return;

  // Read the full row
  const data = sheet.getRange(row, 1, 1, numCols).getValues()[0];
  const fromStore     = data[0]  || '';
  const toStore       = data[1]  || '';
  const description   = data[5]  || '';
  const fromSignedBy  = data[12] || '';
  const toSignedBy    = data[14] || '';
  const toSignedAt    = data[15] || '';

  // Look up emails from Managers tab
  const mgrsSheet = e.source.getSheetByName('Managers');
  let fromEmail = '', toEmail = '';
  if (mgrsSheet) {
    const mgrs = mgrsSheet.getRange(2, 1, mgrsSheet.getLastRow(), 4).getValues();
    mgrs.forEach(function(m) {
      if (String(m[1]).trim() === String(fromStore).trim()) fromEmail = m[3] || '';
      if (String(m[1]).trim() === String(toStore).trim())   toEmail   = m[3] || '';
    });
  }

  const subject = `Transfer Complete: Store #${fromStore} → Store #${toStore}`;
  const body = `
Merchandise Transfer — COMPLETE

Transferring Store: #${fromStore}
Receiving Store:    #${toStore}

Items: ${description}

Transferring Manager: ${fromSignedBy}
Receiving Manager:    ${toSignedBy}
Completed At:         ${toSignedAt}

This transfer has been recorded in the Keith's Superdeli Google Sheet under the "Merchandise Transfer" tab.
  `.trim();

  const recipients = [fromEmail, toEmail, DISTRICT_EMAIL].filter(Boolean).join(',');
  if (recipients) {
    GmailApp.sendEmail(recipients, subject, body, { from: FROM_EMAIL });
  }
}
