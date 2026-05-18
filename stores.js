// Store number -> city name
const STORE_NAMES = {
  '59':  'Moselle',
  '60':  'Wilmer',
  '80':  'Lucedale',
  '81':  'Lucedale',
  '82':  'Hurley',
  '85':  'Moss Point',
  '86':  'Moss Point',
  '88':  'Vancleave',
  '89':  'Ocean Springs',
  '90':  '',
  '91':  'Wiggins',
  '100': 'Ellisville',
  '105': 'Ellisville',
  '107': 'Saucier',
  '108': 'Long Beach',
  '109': 'Pass Christian',
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

// Store number -> Count Sheet Google Sheet ID
// Sourced from emails forwarded to shaundubuisson24@gmail.com by foodservice3@keithsuperstore.com
// (originally shared by Theresa Holifield, May 2026).
// Store 127 (Collins) intentionally excluded per coordinator instruction.
const COUNT_SHEET_IDS = {
  '60':  '1RObmggSu-cMIGXCeRF-0yFe8AFxP5BHRiPMuYiVsxc4',
  '82':  '1zeoB03u7qRaouRhgT-wYKlh-B5-rRyffJ6ZhkZ06dvc',
  '109': '1DLoZvAS6tlsmXZ3NfYYK-RaL_Salg0EBRHCl0empMA4',
  '112': '1gRZp3lyOdASKSa7iqyEM3_xKyUuQr7UBH542sHZBFrc',
  '140': '1guVTZbcgJSJ4ne17ly18g6yCCBLWWF2mcGPdrdnB9lo',
  '155': '1lIFVT2ff3i3bgwELElTwAumhJa1-AtUCZbtWI360eMY',
  '157': '17FNJACyBCOnmKyQyHH0P0LCF8nSHVt7w7qTJ4W8SvK0',
  '173': '1BxBA2Isdxd4SNUCLENcNIOml2oqncszfGBnScF_ADaY',
  '175': '1zX-5DsoytY53_nBkHYv_jcyEyVJgPopQ4FOreVMU2xg',
  '194': '1jtsEz43d1HaHNiVbI6wKqMaqg40v1yN-4VVnIi2bpCI',
};

// Store number -> Google Sheet ID
// Sourced from "Deli Pro — Keith's Superstore" sheets in Google Drive ("Keith's" folder).
const SHEET_IDS = {
  '59':  '1jtr6ImbWYKlJlWS3vOODLXMIPNWciLLIC8jwWf9-Ndg',
  '60':  '1eGse-kalezUhOzhXxla1mJxAAcLula64iGOiaeff0Hs',
  '80':  '1J7xGEkQeTRr-UjAaw_hVDPq9E5PQMaUhd6bpwLCEHvQ',
  '81':  '11eixrFbRojOKxeU4s4ZRfvzbeVIn3AlfskW2BXMDtHQ',
  '82':  '1K8QX_aMSec-wmTfegbgi0MBnKvRpWOJ67QGatIlQYi8',
  '85':  '1pTij0oEbpwCQS6BnecuJix3IyOpASiD2SXnCE9dzPNE',
  '86':  '1m-rVmia4iQDN72ZerpCD4xPVHQOPAy0NypyTwqONSNk',
  '88':  '1UC7jiKNq2HEs1BSb5by0GASd3E8FaLTXDG6Mj124rr0',
  '89':  '1GujrmwLQQCT03CvsTEJfZGZJSeaaKIs-1AIjPe7vWtM',
  '90':  '13657o3wrHuJjDqX0CBsRm3PlhI0N64bgsa9fmOVDSPM',
  '91':  '1OiF_oTcMNplYV5k3jBWCt14cxvd99aD1HB6ixhPgabY',
  '100': '1VmuPR-cwqCU9q31KX1reHnJH7ETJwdjpfxF0LFoYcdg',
  '105': '19-0eArlD7IfEQvuL481FkR8aeDnubkpo9bVPjAgJT5M',
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
// { storeNum: { name, sheetId, countSheetId } }
const STORES = {};
Object.keys(STORE_NAMES).forEach(function(num) {
  STORES[num] = {
    name:         STORE_NAMES[num],
    sheetId:      SHEET_IDS[num] || '',
    countSheetId: COUNT_SHEET_IDS[num] || '',
  };
});
