/**
 * update-counts-60.gs
 * ────────────────────────────────────────────────────────────────────────────
 * Paste this entire script into the Google Apps Script editor for store #60's
 * "DELI PRO — INVENTORY VALUATION" sheet.
 *
 * HOW TO RUN:
 *   1. Open the sheet → Extensions → Apps Script
 *   2. Delete any existing code, paste this in
 *   3. Click the ▶ Run button (select "updateCounts" if prompted)
 *   4. Approve any permissions requests
 *   5. A popup will confirm how many items were updated
 * ────────────────────────────────────────────────────────────────────────────
 */

function updateCounts() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('DELI PRO — INVENTORY VALUATION');
  if (!sheet) {
    SpreadsheetApp.getUi().alert(
      'ERROR: Could not find tab "DELI PRO — INVENTORY VALUATION". ' +
      'Make sure you are running this script from the correct spreadsheet.'
    );
    return;
  }

  const data     = sheet.getDataRange().getValues();
  const COUNT_COL = 5; // Column E (1-based index)

  // ── Count map ─────────────────────────────────────────────────────────────
  // Keys are lowercase substrings to match against column A (item description).
  // More specific terms must come BEFORE broader ones that could also match them.
  // Format: 'search string': count
  const COUNTS = [
    // ── PAGE 1 ──────────────────────────────────────────────────────────────
    ['muffin corn frozen',                    1     ],
    ['dressing roasted red pepper',           0.15  ],
    ['casserole hashbrown ready to bake',     3     ],
    ['potato mashed deluxe',                  5     ],
    ['mac & cheese',                          2     ],
    ['sauce alfredo',                         3     ],
    ['brownie chocolate chip',                1     ],
    ['tamale chicken',                        8     ],
    ['tamale beef',                           5     ],

    // ── PAGE 2 ──────────────────────────────────────────────────────────────
    ['chicken breast strip fajita',           1     ],
    ['beef strip for fajita',                 1     ],
    ['sauce chimichurri',                     4     ],
    ['dip roasted street corn mexican',       3     ],
    ['dip queso blanco',                      3     ],
    ['pork pulled with barbecue sauce',       2     ],
    ['topping reeses pieces',                 0.5   ],
    ['sprinkle rainbow',                      0.5   ],
    ['topping heath bar chopped',             1     ],
    ['topping gummy bear',                    3.25  ],
    ['topping butterfinger',                  0.5   ],
    ['topping caramel',                       0.25  ],
    ['topping candy rainbow nerds',           0.25  ],
    ['topping marshmallow',                   0.25  ],
    ['syrup chocolate full flavor',           0.25  ],
    ['topping cookie oreo',                   0.25  ],
    ['topping butterscotch',                  0.35  ],

    // ── PAGE 3 ──────────────────────────────────────────────────────────────
    // Portion cups BEFORE generic BBQ to prevent wrong match
    ['sauce barbecue original portion cup',   0.5   ],
    ['sauce barbecue original',               0.25  ],
    ['cheese american yellow .5 ounce',       0.25  ],
    ['cheese swiss sliced',                   7     ],
    ['dressing honey mustard portion cup',    1.25  ],
    ['sauce tartar portion cup',              0.95  ],
    ['dressing ranch portion control cup',    0.95  ],
    ['sauce marinara',                        1     ],
    // Bell pepper 5lb — "Medium #1" is the 5lb size
    ['pepper bell green medium',              0.46  ],

    // ── PAGE 4 ──────────────────────────────────────────────────────────────
    ['cheese cheddar mild fancy shredded',    0.75  ],

    // ── PAGE 5 ──────────────────────────────────────────────────────────────
    ['jambalaya',                             5     ],
    // Petite diced = with green chili; plain diced handled below on pg 6
    ['tomato diced with green chili',         8     ],
    ['sauce spaghetti',                       3     ],
    ['pasta spaghetti 10',                    2.5   ],
    ['rice long grain parboiled',             0.75  ],
    ['breader fish fry',                      1     ],
    ['breader shrimp fry',                    0.75  ],
    ['penne pasta',                           3.25  ],
    ['tortilla flour 12',                     5     ],
    ['seasoning blend garlic pepper',         0.95  ],
    ['onion powder',                          0.95  ],
    ['seasoning blend lemon pepper',          5.25  ],
    ['seasoning blend montreal steak',        9.5   ],
    ['seasoning blend montreal chicken',      2     ],
    ['food release oil',                      7     ], // PAM
    ['spice salt shaker',                     1     ],
    // Pepper shaker — match disposable shaker not the bag
    ['pepper black ground shaker',            1     ],

    // ── PAGE 6 ──────────────────────────────────────────────────────────────
    ['cinnamon ground',                       5     ],
    // Garlic powder (not granulated) — exact match guard applied below
    ['garlic powder',                         1     ],
    ['seasoning creole original',             3.75  ], // Tony Chachere's
    ['mix pancake batter',                    5.45  ],
    ['sauce hot louisiana plastic',           3     ],
    ['sauce cheese cheddar',                  1     ],
    ['bean baked original',                   3     ], // Bush's Baked Beans
    ['beans black low sodium',                4     ], // Bush's Black Beans
    // Regular diced tomato (NOT with green chili — handled above)
    ['tomato diced 3/4',                      3     ],
    ['broth chicken',                         11    ],
    ['ketchup fancy',                         1     ],
    ['soup cream of chicken',                 5     ],
    ['pepper jalapeno nacho sliced',          0.5   ],
    // Mayonnaise JUG only (not pouch)
    ['mayonnaise',                            3.85  ], // total from all pages
    ['salsa medium thick',                    6.5   ],
    ['sweet pancake',                         5.45  ], // fallback if 'mix pancake batter' didn't match
  ];

  // ── Match and update ───────────────────────────────────────────────────────
  const matched   = new Set();   // track which COUNTS entries were used
  const updated   = [];
  const skipped   = [];

  for (let row = 1; row < data.length; row++) {
    const itemRaw  = String(data[row][0] || '').trim();
    const itemLow  = itemRaw.toLowerCase();
    if (!itemLow) continue;

    for (let i = 0; i < COUNTS.length; i++) {
      if (matched.has(i)) continue;               // already consumed
      const [term, count] = COUNTS[i];

      // Special guard: 'mayonnaise' must not match 'mayonnaise pouch'
      if (term === 'mayonnaise' && itemLow.includes('pouch')) continue;
      // Special guard: 'garlic powder' must not match 'garlic granulated'
      if (term === 'garlic powder' && itemLow.includes('granulated')) continue;
      // Special guard: 'sauce barbecue original' must not re-match after portion cup
      if (term === 'sauce barbecue original' && itemLow.includes('portion cup')) continue;
      // Special guard: 'sweet pancake' skip if 'mix pancake batter' already matched
      if (term === 'sweet pancake' && matched.has(COUNTS.findIndex(c => c[0] === 'mix pancake batter'))) continue;
      // Skip 'pepper bell green medium' matching to other peppers
      if (term === 'pepper bell green medium' && !itemLow.includes('bell green medium')) continue;

      if (itemLow.includes(term)) {
        sheet.getRange(row + 1, COUNT_COL).setValue(count);
        updated.push(`✓ Row ${row + 1}: ${itemRaw}  →  ${count}`);
        matched.add(i);
        break;
      }
    }
  }

  // Report unmatched search terms
  for (let i = 0; i < COUNTS.length; i++) {
    if (!matched.has(i)) {
      skipped.push(`✗ No match: "${COUNTS[i][0]}" (count ${COUNTS[i][1]})`);
    }
  }

  const summary =
    `Updated ${updated.length} items.\n\n` +
    updated.join('\n') +
    (skipped.length
      ? `\n\n──────────────────────\nNot found in sheet (${skipped.length}):\n` + skipped.join('\n')
      : '');

  Logger.log(summary);
  // Alert shows first ~1500 chars; full log in Apps Script → View → Logs
  SpreadsheetApp.getUi().alert(
    summary.length > 1500 ? summary.substring(0, 1500) + '\n\n…(see Apps Script Logs for full list)' : summary
  );
}
