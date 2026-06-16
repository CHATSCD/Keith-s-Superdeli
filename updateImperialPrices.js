// One-time script to update Imperial item prices on store 184 sheet.
// Run from the browser console while logged into the app, or call updateImperialPrices(sa, sheetId).
// Uses the existing sheetsApi.js functions (sheetsGet, sheetsUpdate, sheetsAppend).

async function updateImperialPrices(sa, sheetId) {
  const PRICE_UPDATES = {
    'Mini Taco Beef':  '$28.41',
    'Stuffed Nacho':   '$57.94',
  };

  const NEW_ITEMS = [
    ['CASE', 'Tornado Salsa Egg & Cheese',    '', 'case', '', '$20.90', ''],
    ['CASE', 'Tornado Southwest Chicken',      '', 'case', '', '$20.90', ''],
    ['CASE', 'Rollerbites Buffalo Chicken',    '', 'case', '', '$60.19', ''],
    ['CASE', 'Rollerbites Cheeseburger',       '', 'case', '', '$31.30', ''],
    ['CASE', 'Tornado Pepper Jack Ched Ruiz',  '', 'case', '', '$22.67', ''],
    ['CASE', 'Tornado Bacon Ched Potato Ruiz', '', 'case', '', '$22.67', ''],
    ['CASE', 'Tornado Chipotle Chicken Ruiz',  '', 'case', '', '$22.67', ''],
    ['CASE', 'Tornado Ranch Steak Ched Ruiz',  '', 'case', '', '$25.34', ''],
    ['CASE', 'Tornado Western Chicken Ruiz',   '', 'case', '', '$23.34', ''],
    ['CASE', 'Tornado Sausage Egg Ched Ruiz',  '', 'case', '', '$23.34', ''],
    ['CASE', 'Tornado Nacho Ruiz',             '', 'case', '', '',       ''],
    ['CASE', 'Meat Pie Crawfish Errols',       '', 'case', '', '$59.61', ''],
    ['BAG',  'Brisket Sliced Lower',           '', '',     '', '$132.36',''],
  ];

  console.log('Fetching current sheet data...');
  const result = await sheetsGet(sa, sheetId, 'A1:Z1000');
  const rows = result.values || [];

  // Find Imperial section and update prices
  let updatedCount = 0;
  for (let i = 0; i < rows.length; i++) {
    const itemName = (rows[i][1] || '').trim();
    if (PRICE_UPDATES[itemName]) {
      const perColIdx = 5; // Column F = Per/price column
      const currentPrice = (rows[i][perColIdx] || '').trim();
      const newPrice = PRICE_UPDATES[itemName];
      if (currentPrice !== newPrice) {
        const range = `F${i + 1}`;
        await sheetsUpdate(sa, sheetId, range, [[newPrice]]);
        console.log(`Updated ${itemName}: ${currentPrice} → ${newPrice} (row ${i + 1})`);
        updatedCount++;
      } else {
        console.log(`${itemName} already at ${newPrice}, skipping`);
      }
    }
  }

  // Find the last row of the Imperial section to append new items after it
  let imperialStart = -1;
  let imperialEnd = -1;
  let inImperial = false;
  for (let i = 0; i < rows.length; i++) {
    const colA = (rows[i][0] || '').trim();
    const colB = (rows[i][1] || '').trim().toLowerCase();
    const nonEmpty = rows[i].filter(c => (c || '').trim()).length;

    if (!colA && colB && nonEmpty <= 3) {
      if (/imperial|merchants/i.test(colB)) {
        imperialStart = i;
        inImperial = true;
      } else if (inImperial) {
        imperialEnd = i;
        inImperial = false;
      }
    }
    if (inImperial && colA) imperialEnd = i + 1;
  }
  if (inImperial) imperialEnd = rows.length;

  if (imperialEnd < 0) {
    console.warn('Could not find Imperial section boundary. Appending at end of sheet.');
    imperialEnd = rows.length;
  }

  // Filter out items that already exist
  const existingNames = new Set(rows.map(r => (r[1] || '').trim().toLowerCase()));
  const toAdd = NEW_ITEMS.filter(item => !existingNames.has(item[1].toLowerCase()));

  if (toAdd.length > 0) {
    console.log(`Adding ${toAdd.length} new Imperial items at row ${imperialEnd + 1}...`);
    // Insert rows at the end of Imperial section
    const range = `A${imperialEnd + 1}`;
    await sheetsUpdate(sa, sheetId, range, toAdd);
    console.log('New items added:', toAdd.map(r => r[1]).join(', '));
  } else {
    console.log('All items already exist on the sheet.');
  }

  console.log(`Done. ${updatedCount} prices updated, ${toAdd.length} items added.`);
  return { updatedCount, addedCount: toAdd.length };
}
