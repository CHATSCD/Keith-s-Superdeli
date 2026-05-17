// Store number -> city name
const STORE_NAMES = {
  '59':  'Moselle',
  '60':  'Lumberton',
  '61':  'Wiggins',
  '62':  'Sumrall',
  '63':  'Petal',
  '64':  'Purvis',
  '65':  'Poplarville',
  '66':  'Hattiesburg',
  '67':  'Hattiesburg',
  '68':  'Hattiesburg',
  '69':  'Columbia',
  '70':  'Tylertown',
  '71':  'Monticello',
  '72':  'Brookhaven',
  '73':  'Hazlehurst',
  '74':  'Crystal Springs',
  '75':  'Mendenhall',
  '76':  'Magee',
  '77':  'Collins',
  '78':  'Seminary',
  '79':  'Laurel',
  '80':  'Laurel',
  '81':  'Ellisville',
  '82':  'Hurley',
  '83':  'Pascagoula',
  '84':  'Gautier',
  '85':  'Moss Point',
  '86':  'Ocean Springs',
  '87':  'Biloxi',
  '88':  'Gulfport',
  '89':  'Gulfport',
  '90':  'Long Beach',
  '91':  'Pass Christian',
  '92':  'Bay St. Louis',
  '93':  'Waveland',
  '94':  'Picayune',
  '95':  'Poplarville',
  '96':  'Carriere',
  '97':  'Slidell',
  '98':  'Covington',
  '99':  'Mandeville',
  '100': 'Madisonville',
  '101': 'Hammond',
  '102': 'Ponchatoula',
  '103': 'Amite',
  '104': 'Franklinton',
  '105': 'Bogalusa',
  '106': 'Poplarville',
  '107': 'Saucier',
  '108': 'Diberville',
  '110': 'Biloxi',
  '196': 'Poplarville',
};

// Store number -> Google Sheet ID
// Populated by running: node migrate.js
// You can also paste Sheet IDs manually — get them from the spreadsheet URL:
//   https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit
// Template Sheet ID (used as source for migration): 1jtE9hPaF9MIzDuwyJruTTse94XjS-64SR2vNdNoNpKU
const SHEET_IDS = {
  '107': '1jtE9hPaF9MIzDuwyJruTTse94XjS-64SR2vNdNoNpKU',  // Saucier — update after migration
  // Remaining store IDs added by migrate.js or pasted manually:
  // '59':  '',
  // '60':  '',
  // '61':  '',
  // '62':  '',
  // '63':  '',
  // '64':  '',
  // '65':  '',
  // '66':  '',
  // '67':  '',
  // '68':  '',
  // '69':  '',
  // '70':  '',
  // '71':  '',
  // '72':  '',
  // '73':  '',
  // '74':  '',
  // '75':  '',
  // '76':  '',
  // '77':  '',
  // '78':  '',
  // '79':  '',
  // '80':  '',
  // '81':  '',
  // '82':  '',
  // '83':  '',
  // '84':  '',
  // '85':  '',
  // '86':  '',
  // '87':  '',
  // '88':  '',
  // '89':  '',
  // '90':  '',
  // '91':  '',
  // '92':  '',
  // '93':  '',
  // '94':  '',
  // '95':  '',
  // '96':  '',
  // '97':  '',
  // '98':  '',
  // '99':  '',
  // '100': '',
  // '101': '',
  // '102': '',
  // '103': '',
  // '104': '',
  // '105': '',
  // '106': '',
  // '108': '',
  // '110': '',
  // '196': '',
};

function getStoreName(storeNum) {
  return STORE_NAMES[String(storeNum)] || null;
}

function getSheetId(storeNum) {
  return SHEET_IDS[String(storeNum)] || null;
}

// getStore() — convenience wrapper used by index.html router
function getStore(storeNum) {
  const name = getStoreName(storeNum);
  if (!name) return null;
  return { name, sheetId: getSheetId(storeNum) || '' };
}

// STORES — combined map used by coordinator.js
// { storeNum: { name, sheetId } }
const STORES = {};
Object.keys(STORE_NAMES).forEach(function(num) {
  STORES[num] = { name: STORE_NAMES[num], sheetId: SHEET_IDS[num] || '' };
});
