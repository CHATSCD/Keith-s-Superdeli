// Store number -> { name, sheetId } map
// sheetId values are populated after running migrate.js
const STORES = {
  '59':  { name: 'Moselle',         sheetId: '' },
  '60':  { name: 'Lumberton',       sheetId: '' },
  '61':  { name: 'Wiggins',         sheetId: '' },
  '62':  { name: 'Sumrall',         sheetId: '' },
  '63':  { name: 'Petal',           sheetId: '' },
  '64':  { name: 'Purvis',          sheetId: '' },
  '65':  { name: 'Poplarville',     sheetId: '' },
  '66':  { name: 'Hattiesburg',     sheetId: '' },
  '67':  { name: 'Hattiesburg',     sheetId: '' },
  '68':  { name: 'Hattiesburg',     sheetId: '' },
  '69':  { name: 'Columbia',        sheetId: '' },
  '70':  { name: 'Tylertown',       sheetId: '' },
  '71':  { name: 'Monticello',      sheetId: '' },
  '72':  { name: 'Brookhaven',      sheetId: '' },
  '73':  { name: 'Hazlehurst',      sheetId: '' },
  '74':  { name: 'Crystal Springs', sheetId: '' },
  '75':  { name: 'Mendenhall',      sheetId: '' },
  '76':  { name: 'Magee',           sheetId: '' },
  '77':  { name: 'Collins',         sheetId: '' },
  '78':  { name: 'Seminary',        sheetId: '' },
  '79':  { name: 'Laurel',          sheetId: '' },
  '80':  { name: 'Laurel',          sheetId: '' },
  '81':  { name: 'Ellisville',      sheetId: '' },
  '82':  { name: 'Hurley',          sheetId: '' },
  '83':  { name: 'Pascagoula',      sheetId: '' },
  '84':  { name: 'Gautier',         sheetId: '' },
  '85':  { name: 'Moss Point',      sheetId: '' },
  '86':  { name: 'Ocean Springs',   sheetId: '' },
  '87':  { name: 'Biloxi',          sheetId: '' },
  '88':  { name: 'Gulfport',        sheetId: '' },
  '89':  { name: 'Gulfport',        sheetId: '' },
  '90':  { name: 'Long Beach',      sheetId: '' },
  '91':  { name: 'Pass Christian',  sheetId: '' },
  '92':  { name: 'Bay St. Louis',   sheetId: '' },
  '93':  { name: 'Waveland',        sheetId: '' },
  '94':  { name: 'Picayune',        sheetId: '' },
  '95':  { name: 'Poplarville',     sheetId: '' },
  '96':  { name: 'Carriere',        sheetId: '' },
  '97':  { name: 'Slidell',         sheetId: '' },
  '98':  { name: 'Covington',       sheetId: '' },
  '99':  { name: 'Mandeville',      sheetId: '' },
  '100': { name: 'Madisonville',    sheetId: '' },
  '101': { name: 'Hammond',         sheetId: '' },
  '102': { name: 'Ponchatoula',     sheetId: '' },
  '103': { name: 'Amite',           sheetId: '' },
  '104': { name: 'Franklinton',     sheetId: '' },
  '105': { name: 'Bogalusa',        sheetId: '' },
  '106': { name: 'Poplarville',     sheetId: '' },
  '107': { name: 'Saucier',         sheetId: '' },
  '108': { name: 'Diberville',      sheetId: '' },
  '110': { name: 'Biloxi',          sheetId: '' },
  '196': { name: 'Poplarville',     sheetId: '' },
};

function getStore(storeNum) {
  return STORES[String(storeNum)] || null;
}

function getStoreName(storeNum) {
  const s = getStore(storeNum);
  return s ? s.name : 'Unknown Store';
}

function getSheetId(storeNum) {
  const s = getStore(storeNum);
  return s ? s.sheetId : null;
}
