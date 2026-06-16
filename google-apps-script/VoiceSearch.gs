// Google Apps Script — Voice Search sidebar for Keith's Superdeli sheets
// To install: open your Google Sheet → Extensions → Apps Script → paste this file + VoiceSearchSidebar.html

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🎤 Voice Search')
    .addItem('Open Voice Search', 'showVoiceSearch')
    .addToUi();
}

function showVoiceSearch() {
  var html = HtmlService.createHtmlOutputFromFile('VoiceSearchSidebar')
    .setTitle('🎤 Voice Search')
    .setWidth(360);
  SpreadsheetApp.getUi().showSidebar(html);
}

function getSheetItems() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  // Find header row
  var hdrIdx = 0;
  for (var i = 0; i < Math.min(6, data.length); i++) {
    for (var j = 0; j < data[i].length; j++) {
      var cell = String(data[i][j] || '');
      if (/count.?by|item.?#|product.?desc/i.test(cell)) { hdrIdx = i; break; }
    }
    if (hdrIdx > 0) break;
  }

  var hdr = data[hdrIdx];
  var nameCol = -1, numCol = -1, priceCol = -1;
  for (var c = 0; c < hdr.length; c++) {
    var h = String(hdr[c] || '').trim().toLowerCase();
    if (nameCol < 0 && /^item$|^item.?name|product.?desc/i.test(h)) nameCol = c;
    if (numCol < 0 && /item.?#|item.?num|bek.?item/i.test(h)) numCol = c;
    if (priceCol < 0 && /^per$|^cost$|^price$|case.?price|ppu/i.test(h)) priceCol = c;
  }
  if (nameCol < 0) nameCol = 1;

  var section = '';
  var items = [];
  for (var r = hdrIdx + 1; r < data.length; r++) {
    var row = data[r];
    var colA = String(row[0] || '').trim();
    var colB = String(row[1] || '').trim();
    var nonEmpty = row.filter(function(c) { return String(c || '').trim(); }).length;

    // Section header detection
    if (!colA && colB && nonEmpty <= 3) {
      section = colB;
      continue;
    }

    var name = String(row[nameCol] || '').trim();
    if (!name) continue;

    var num = numCol >= 0 ? String(row[numCol] || '').trim() : '';
    var price = priceCol >= 0 ? parseFloat(row[priceCol]) || 0 : 0;

    items.push({
      name: name,
      num: num,
      section: section,
      price: price,
      row: r + 1 // 1-based sheet row
    });
  }
  return items;
}

function goToRow(rowNum) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var range = sheet.getRange(rowNum, 1);
  sheet.setActiveRange(range);
  SpreadsheetApp.flush();
}

function updateQuantity(rowNum, colLetter, value) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var range = sheet.getRange(colLetter + rowNum);
  range.setValue(value);
  SpreadsheetApp.flush();
  return true;
}
