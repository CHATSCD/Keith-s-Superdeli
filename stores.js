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
// Sourced from "Deli Pro — Keith's Superstore" sheets in Google Drive ("Keith's" folder).
const SHEET_IDS = {
  '59':  '1jtr6ImbWYKlJlWS3vOODLXMIPNWciLLIC8jwWf9-Ndg',
  '60':  '1eGse-kalezUhOzhXxla1mJxAAcLula64iGOiaeff0Hs',
  '61':  '1MdcT9PKz3oHQLuFL6Em2DJLGl0mqOj72dC0TfRx6TtQ',
  '62':  '1FHhOJKsfl6DvaMYffOzW_-c7YKPJsrWLbRm-opQRl7Y',
  '63':  '1FJ7DjlhF-Zp5CzJWCbKRxgxORT25qVlFGx31ZRjEOVM',
  '64':  '1ZDV6XrXvlZNOlY7eaCQy6VTzgDmVyzGXEab8hotv7NU',
  '65':  '1mMtLVGlc1nma1OjaOyoMniAl4BkyT3HxjrT8Eq8cCzs',
  '66':  '1gvsexDeKh8FerHd_ky4IUUpaxMH_Xz65zQqIGVy0x8w',
  '67':  '12wRd98ufOLTkzo3Q9LJeci6boRER3-VxE_04KC3qYqE',
  '68':  '1fcM04NxauohKA7TUdrbfcFlo70UKWIvkJMuricpk6WI',
  '69':  '1U5l9yX5gl-vrzWXF8v9cfwrKYhRd9HTgcqU39GDVVno',
  '70':  '1QsKCJonomIZOjtmaWU6kEWP2i4Tb6xhf45Lz9bLe2_o',
  '71':  '13eVYgMgB3HGf9Zu341tffufeH9NDY058BlhjpaxW2oE',
  '72':  '1MSh-vW21JxXUNXRRUrbQCEjUH5Sy7HKtks68Y_WQATE',
  '73':  '13B7tQJbz3nh55usfjosr-Ljw7bkC_P9HsUEAlKzfCFc',
  '74':  '1KHhSEV45JMCK1timw6mJpsZsl1MY0YiooziId1m6XII',
  '75':  '1CmntphJY9D8mHSQFR1n89mgxyd_6bIhM5Jq0DHvYR_Y',
  '76':  '1vuthE_hiGcXEqxQOHOwjn0ZyamqoyJh91iixEKrrFb8',
  '77':  '1difSfsKPRLqKMyr_F-4r1gNRVNaIuPuE5M9imrLS1nM',
  '78':  '1kXj66g5ehAtOx3FeSP_OM7ac_gVqQuJbuX6K35V3a44',
  '79':  '1DXNY0EwQu9JQ675DFNKu5iSo4v9KMTYVU0coD-7jUos',
  '80':  '1J7xGEkQeTRr-UjAaw_hVDPq9E5PQMaUhd6bpwLCEHvQ',
  '81':  '11eixrFbRojOKxeU4s4ZRfvzbeVIn3AlfskW2BXMDtHQ',
  '82':  '1K8QX_aMSec-wmTfegbgi0MBnKvRpWOJ67QGatIlQYi8',
  '83':  '1Dm7acn__h_famgLpFO6iSq1yqV4l6LGy9iW4bkuOMVw',
  '84':  '1iy8eHVuR73x1Zh8AKhp0HtNzcMabUhJsFxXKXfsqtjs',
  '85':  '1pTij0oEbpwCQS6BnecuJix3IyOpASiD2SXnCE9dzPNE',
  '86':  '1m-rVmia4iQDN72ZerpCD4xPVHQOPAy0NypyTwqONSNk',
  '87':  '15-mlq_EDuYc7UCA1fwGYcFprMKXa8MRqi5w-aiqB_M4',
  '88':  '1UC7jiKNq2HEs1BSb5by0GASd3E8FaLTXDG6Mj124rr0',
  '89':  '1GujrmwLQQCT03CvsTEJfZGZJSeaaKIs-1AIjPe7vWtM',
  '90':  '13657o3wrHuJjDqX0CBsRm3PlhI0N64bgsa9fmOVDSPM',
  '91':  '1OiF_oTcMNplYV5k3jBWCt14cxvd99aD1HB6ixhPgabY',
  '92':  '1i3DSd6g2E-meqz8xXnqKQm7q9eJzVfTt0zlDuGH_-7s',
  '93':  '1MAOabW1Xp0UDLR6FxngzEfTu1I8TuNSO3DeUr0_qEQA',
  '94':  '1s2ZMMTcFZOYpdCWJKEGrbq4f8mDpAReHe55lPPMG6tM',
  '95':  '1lN83paAbGeWfZF9jxxRzrJ5wzV14eWUqpb0XDbZnP90',
  '96':  '1p7etZsAzlXGpZZVvYb7EwQIrVrVq1V3hCwjIPtx63Uc',
  '97':  '1b3QGfF4knRB5Dp-1TCfKCwNq6IPgW9of--PbJVajVrc',
  '98':  '1u4zUirwIkL_g49varwN8742iABqK7db-ANr2WRZVagg',
  '99':  '1XwBb_9sAQR53N--wpc0zV0fWRHrKNbUWOYtv5rZtd54',
  '100': '1VmuPR-cwqCU9q31KX1reHnJH7ETJwdjpfxF0LFoYcdg',
  '101': '16BEKY6d705qQfb3PGYCIrBzIjkYCo4rKkO-VsjfKGpQ',
  '102': '1B7nt_tYL02Q4vJ4ptZ-T_OLjLSSze0wRZ_TeF_Wjtik',
  '103': '1E9R4s5FzM4tGD7D4_dJinUPauk_DpG8ou7fTHZI_EuI',
  '104': '13TvI7iZg2QdnqGow0D6Mk6qUSl_yF3cPgayr3uqNyLI',
  '105': '19-0eArlD7IfEQvuL481FkR8aeDnubkpo9bVPjAgJT5M',
  '106': '19-YHrjQU6TZYBGlaE1DB_3VGWlzmt67hIrtZfiNCPWc',
  '107': '10aknBx8DyrkHlRkK6b57hRa4CyrJvt2RmMfGLxtNDtw',
  '108': '1MFo6-4nC15gVr7iAuSQoWcIH3m8phBxTNTZKJteUnWQ',
  '110': '1D_ES-vQJ-qF_hvX80bz8yheanL4mesM9OnjL7p8qtRs',
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
