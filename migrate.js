#!/usr/bin/env node
/**
 * migrate.js — One-time Drive migration script
 *
 * Usage:
 *   node migrate.js
 *
 * Reads config from migrate.config.json (created by setup.js or manually).
 * Copies all 43 store Sheets from the old Drive folder to the new account's folder,
 * adds the required tabs (Inspections, Cleaning Logs, Temp Log) to each copy,
 * then writes the resulting store->sheetId map to stores.js.
 */

const https  = require('https');
const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');

// -----------------------------------------------------------------------
// Config — edit migrate.config.json or set these env vars
// -----------------------------------------------------------------------
const CONFIG_FILE = path.join(__dirname, 'migrate.config.json');

function loadConfig() {
  if (fs.existsSync(CONFIG_FILE)) {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  }
  // Fallback to env vars
  return {
    oldFolderId:    process.env.OLD_FOLDER_ID    || '13XfeXxVrzPsyXOAUwIGIE2n9XhoaAeWC',
    newFolderId:    process.env.NEW_FOLDER_ID    || '',
    templateSheetId: process.env.TEMPLATE_SHEET_ID || '1jtE9hPaF9MIzDuwyJruTTse94XjS-64SR2vNdNoNpKU',
    serviceAccount: JSON.parse(process.env.SA_JSON || '{}'),
  };
}

const STORES = {
  '59':'Moselle','60':'Lumberton','61':'Wiggins','62':'Sumrall','63':'Petal',
  '64':'Purvis','65':'Poplarville','66':'Hattiesburg','67':'Hattiesburg',
  '68':'Hattiesburg','69':'Columbia','70':'Tylertown','71':'Monticello',
  '72':'Brookhaven','73':'Hazlehurst','74':'Crystal Springs','75':'Mendenhall',
  '76':'Magee','77':'Collins','78':'Seminary','79':'Laurel','80':'Laurel',
  '81':'Ellisville','82':'Hurley','83':'Pascagoula','84':'Gautier',
  '85':'Moss Point','86':'Ocean Springs','87':'Biloxi','88':'Gulfport',
  '89':'Gulfport','90':'Long Beach','91':'Pass Christian','92':'Bay St. Louis',
  '93':'Waveland','94':'Picayune','95':'Poplarville','96':'Carriere',
  '97':'Slidell','98':'Covington','99':'Mandeville','100':'Madisonville',
  '101':'Hammond','102':'Ponchatoula','103':'Amite','104':'Franklinton',
  '105':'Bogalusa','106':'Poplarville','107':'Saucier','108':'Diberville',
  '110':'Biloxi','196':'Poplarville',
};

const NEW_TABS = ['Inspections', 'Cleaning Logs', 'Temp Log'];

const TOKEN_URI = 'https://oauth2.googleapis.com/token';
const SCOPES    = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive';

// -----------------------------------------------------------------------
// JWT + Token helpers (pure Node, no external deps)
// -----------------------------------------------------------------------

function b64url(buf) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function makeJWT(sa) {
  const now = Math.floor(Date.now() / 1000);
  const header  = { alg: 'RS256', typ: 'JWT' };
  const payload = { iss: sa.client_email, scope: SCOPES, aud: TOKEN_URI, iat: now, exp: now + 3600 };
  const h = b64url(Buffer.from(JSON.stringify(header)));
  const p = b64url(Buffer.from(JSON.stringify(payload)));
  const sig = crypto.createSign('RSA-SHA256').update(`${h}.${p}`).sign(sa.private_key);
  return `${h}.${p}.${b64url(sig)}`;
}

function httpPost(url, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const data = Buffer.from(body);
    const req = https.request({
      hostname: u.hostname, path: u.pathname + u.search, method: 'POST',
      headers: { 'Content-Length': data.length, ...headers },
    }, res => {
      let raw = '';
      res.on('data', d => raw += d);
      res.on('end', () => resolve({ status: res.statusCode, body: raw }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function httpGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    https.get({ hostname: u.hostname, path: u.pathname + u.search, headers }, res => {
      let raw = '';
      res.on('data', d => raw += d);
      res.on('end', () => resolve({ status: res.statusCode, body: raw }));
    }).on('error', reject);
  });
}

async function getToken(sa) {
  const jwt = makeJWT(sa);
  const res = await httpPost(
    TOKEN_URI,
    `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    { 'Content-Type': 'application/x-www-form-urlencoded' }
  );
  const data = JSON.parse(res.body);
  if (!data.access_token) throw new Error(`Token error: ${res.body}`);
  return data.access_token;
}

// -----------------------------------------------------------------------
// Drive / Sheets API wrappers
// -----------------------------------------------------------------------

async function listFiles(token, folderId) {
  const q = encodeURIComponent(`'${folderId}' in parents and trashed=false`);
  const res = await httpGet(
    `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)&pageSize=200`,
    { Authorization: `Bearer ${token}` }
  );
  return JSON.parse(res.body).files || [];
}

async function copyFile(token, fileId, name, destFolderId) {
  const res = await httpPost(
    `https://www.googleapis.com/drive/v3/files/${fileId}/copy`,
    JSON.stringify({ name, parents: [destFolderId] }),
    { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
  );
  const data = JSON.parse(res.body);
  if (!data.id) throw new Error(`Copy failed for ${name}: ${res.body}`);
  return data;
}

async function addTab(token, sheetId, title) {
  const res = await httpPost(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}:batchUpdate`,
    JSON.stringify({ requests: [{ addSheet: { properties: { title } } }] }),
    { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
  );
  const data = JSON.parse(res.body);
  if (data.error) {
    // Tab may already exist — treat as non-fatal
    if (data.error.message && data.error.message.includes('already exists')) {
      console.log(`    Tab "${title}" already exists, skipping.`);
      return;
    }
    throw new Error(`addTab "${title}": ${res.body}`);
  }
}

async function addHeaders(token, sheetId, tabName, headers) {
  const body = JSON.stringify({ values: [headers] });
  const res = await httpPost(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(tabName + '!A1')}?valueInputOption=USER_ENTERED`,
    body,
    { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
  );
  return JSON.parse(res.body);
}

// Override httpPost to support PUT
function httpPut(url, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const data = Buffer.from(body);
    const req = https.request({
      hostname: u.hostname, path: u.pathname + u.search, method: 'PUT',
      headers: { 'Content-Length': data.length, ...headers },
    }, res => {
      let raw = '';
      res.on('data', d => raw += d);
      res.on('end', () => resolve({ status: res.statusCode, body: raw }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function writeHeaders(token, sheetId, tabName, headers) {
  const body = JSON.stringify({ values: [headers] });
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(tabName + '!A1')}?valueInputOption=USER_ENTERED`;
  const res = await httpPut(url, body, {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  });
  return JSON.parse(res.body);
}

// -----------------------------------------------------------------------
// Main migration
// -----------------------------------------------------------------------

async function main() {
  console.log('=== Keith\'s Superdeli — Drive Migration ===\n');

  const cfg = loadConfig();

  if (!cfg.serviceAccount || !cfg.serviceAccount.client_email) {
    console.error('ERROR: Service account not configured. Edit migrate.config.json.');
    process.exit(1);
  }
  if (!cfg.newFolderId) {
    console.error('ERROR: newFolderId not set in migrate.config.json.');
    process.exit(1);
  }

  console.log('Getting access token...');
  const token = await getToken(cfg.serviceAccount);
  console.log('Token obtained.\n');

  console.log(`Listing existing files in old folder: ${cfg.oldFolderId}`);
  const existingFiles = await listFiles(token, cfg.oldFolderId);
  console.log(`Found ${existingFiles.length} files.\n`);

  // Flat storeNum -> sheetId map (matches SHEET_IDS in stores.js)
  const sheetIds = {};
  const storeNums = Object.keys(STORES);

  for (const num of storeNums) {
    const city = STORES[num];
    const targetName = `Deli Pro - Store #${num} ${city}`;

    // Find existing file by store number pattern
    let sourceFile = existingFiles.find(f =>
      f.name.includes(`#${num}`) || f.name.includes(`Store ${num} `) || f.name.includes(`Store #${num}`)
    );

    if (!sourceFile) {
      // Copy from template
      console.log(`  [${num}] ${city} — no existing file, copying template...`);
      sourceFile = { id: cfg.templateSheetId };
    } else {
      console.log(`  [${num}] ${city} — copying "${sourceFile.name}"...`);
    }

    let newFile;
    try {
      newFile = await copyFile(token, sourceFile.id, targetName, cfg.newFolderId);
      console.log(`    Copied -> ${newFile.id}`);
    } catch (err) {
      console.error(`    FAILED to copy: ${err.message}`);
      sheetIds[num] = '';
      continue;
    }

    // Add new tabs
    for (const tab of NEW_TABS) {
      try {
        await addTab(token, newFile.id, tab);
        console.log(`    Added tab: ${tab}`);
      } catch (err) {
        console.error(`    Failed to add tab "${tab}": ${err.message}`);
      }
    }

    // Write headers to new tabs
    try {
      await writeHeaders(token, newFile.id, 'Inspections', [
        'Store #','Store Name','Date','Time','Inspector','Score %',
        'YES','NO','N/A','Total','Follow-up Date','Status','NO Items','Notes',
      ]);
      await writeHeaders(token, newFile.id, 'Cleaning Logs', [
        'Store #','Store Name','Date','Equipment','Employee',
        'Tasks Completed','Tasks Missed','PPM','Temp Readings','Notes',
      ]);
      await writeHeaders(token, newFile.id, 'Temp Log', [
        'Store #','Store Name','Date','Unit','6 AM','10 AM','2 PM','6 PM','10 PM','Notes',
      ]);
      console.log(`    Headers written.`);
    } catch (err) {
      console.error(`    Failed to write headers: ${err.message}`);
    }

    sheetIds[num] = newFile.id;

    // Throttle to avoid quota
    await new Promise(r => setTimeout(r, 500));
  }

  // Build the SHEET_IDS block — only include stores with a successful copy
  const sheetIdsEntries = storeNums
    .map(num => `  '${num}': '${sheetIds[num] || ''}'`)
    .join(',\n');

  // Preserve the full STORE_NAMES block from the existing stores.js
  const existingStoresJs = fs.readFileSync(path.join(__dirname, 'stores.js'), 'utf8');
  const storeNamesMatch  = existingStoresJs.match(/const STORE_NAMES = \{[\s\S]*?\};/);
  const storeNamesBlock  = storeNamesMatch ? storeNamesMatch[0] : `const STORE_NAMES = ${JSON.stringify(STORES)};`;

  const storesJs = `// stores.js — auto-updated by migrate.js on ${new Date().toISOString()}
${storeNamesBlock}

// Store number -> Google Sheet ID
// Generated by migrate.js — do not edit the sheetId values manually unless you know what you're doing.
const SHEET_IDS = {
${sheetIdsEntries}
};

function getStoreName(storeNum) {
  return STORE_NAMES[String(storeNum)] || null;
}

function getSheetId(storeNum) {
  return SHEET_IDS[String(storeNum)] || null;
}

function getStore(storeNum) {
  const name = getStoreName(storeNum);
  if (!name) return null;
  return { name, sheetId: getSheetId(storeNum) || '' };
}
`;

  fs.writeFileSync(path.join(__dirname, 'stores.js'), storesJs, 'utf8');
  console.log('\nstores.js written with all Sheet IDs (SHEET_IDS flat map).');
  console.log('\nMigration complete!');
  const successCount = storeNums.filter(n => sheetIds[n]).length;
  console.log(`Copied ${successCount} / ${storeNums.length} stores.`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
