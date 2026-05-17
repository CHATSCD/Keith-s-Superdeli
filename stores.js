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
  '109': 'Pass Christian',
  '110': 'Biloxi',
  '112': 'Gautier',
  '117': 'Bay Springs',
  '120': 'Purvis',
  '122': 'Purvis',
  '123': 'Purvis',
  '125': 'Seminary',
  '127': 'Collins',
  '130': 'Columbia',
  '135': 'Hattiesburg',
  '137': 'Hattiesburg',
  '140': 'Mount Olive',
  '150': 'Hattiesburg',
  '151': 'Hattiesburg',
  '155': 'Sumrall',
  '157': 'Hattiesburg',
  '160': 'Wiggins',
  '161': 'Wiggins',
  '173': 'Hattiesburg',
  '175': 'Petal',
  '182': 'Waveland',
  '183': 'Bay St. Louis',
  '184': 'Bay St. Louis',
  '185': 'Lumberton',
  '192': 'Picayune',
  '194': 'Carriere',
  '196': 'Poplarville',
};

// Store number -> Google Sheet ID
// Sourced from "Deli Pro — Keith's Superstore" sheets in Google Drive ("Keith's" folder).
// Stores 59–106, 110 do not yet have Deli Pro sheets in Drive.
const SHEET_IDS = {
  '107': '10aknBx8DyrkHlRkK6b57hRa4CyrJvt2RmMfGLxtNDtw',
  '108': '1MFo6-4nC15gVr7iAuSQoWcIH3m8phBxTNTZKJteUnWQ',
  '109': '1tJ_yWp1ZkMNjEey0LDPNpXRLtTFM8Di2256yyn9_gY4',
  '112': '1D3RLQKYDimkrtcrbyoP6L8rmLKJiajMl4YH5rDSbY5Q',
  '117': '1LSehG84o3fZEJGY5Aol6SMPvEo7JarPkg8nOY5nuq1E',
  '120': '156B8U_7g4pCJKUJnJm-1f_6dRB0vJO8WBqYeOMtEtC4',
  '122': '1thc7U0IROkUl5Galg4ScEF3avDP9K6v-eQO9MGwPstw',
  '123': '1JC6NuyDreIa_MnVfVlQQbHouaZd723wgCUZ9BvvQhmM',
  '125': '1AytxFlJKi7VnUzHBsJKJvYkfVPWqYRpyxpfU7YX5rEA',
  '127': '1rFFodosqO7Yl2DOscduDqsP2tx3mxA1oxuF1z_gwL0M',
  '130': '1MqfLWTdP96Dqb-5gJRrRJhtmtAX6UDOrQA9Nx_sCtwE',
  '135': '1MbDLcUt5zoy9VOxd6kz8GBS6Sy4yPOrn8O7r59UjG4M',
  '137': '1_65wbQTGmMtcBm8784jfvqtMZtxuyrlwwYHOO7ia_b8',
  '140': '1wlLESRnTl8gEO94pTH8Ypg1FD1qm7Kxxta_QGga7Qg0',
  '150': '1AMB9dws66Ysyqzy0TZhVgZhBHLX40aXa0J8fwG49Atg',
  '151': '1pODIJXhUcJMWwCGJ6awWNx51gaYrbg2VYw0xQbqdQCw',
  '155': '1VP00Z5SH7G63a8K2Eoxn40Y5jiqCnz9B9CkrQ3Valvk',
  '157': '194y2x-AMKszNhaxA_cIpFHIPDq04fZupO4HbGkq0Pj0',
  '160': '1EbIdRCrxwNL_JOptWKqee2BDFcE7S4j_wt0LVdE2ZJc',
  '161': '1Ij0iw-2vVvM1ni6Ps9H3m-TQvOVqRMkF0R9TCDBxSK8',
  '173': '1SR0YwiRwcWtlaT33kR1d1tZ1SDJo_0EpLtkxK9P3uKw',
  '175': '1pauY9Ko_m5VlOQB8Lq70HSRlihLBVQCr1k7V6IdcAoQ',
  '182': '1PFzq3SkvAGA6RIUjJTQ4zr3nPx4bqFfN3UTZ0U8PWQk',
  '183': '1MECo56xyIzZWgCrG4D9VoDVyFC8b5LBXhskmZsQuRAA',
  '184': '1x2IWC4CDWkSv-GzH2HlPhZ8sK7_XG7D7xzeEBiQWiU0',
  '185': '1p79KwMjvhqugHjIjomSr2pXTj3okSVkFIT99XkV-CkA',
  '192': '1Q8fRtali0B0iLLF7vfKVOuAQWNTtR6zyTYY3twV_SnM',
  '194': '1F27bcIZVGUXjW341ehNVOkamhPQohO5aJstLqdpi5Zw',
  '196': '1DFW6TZpLDBHwK7VQB48bvGjYDE6EpjQQwGmXFfwVDvo',
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
