// Google Sheets / Drive API helpers
// Uses a JWT signed with the Service Account key (no OAuth popup).
// Auth pattern matches existing Deli Pro: PRIVATE_KEY_PARTS array joined, RS256 JWT.

const SHEETS_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';
const DRIVE_BASE  = 'https://www.googleapis.com/drive/v3';
const TOKEN_URI   = 'https://oauth2.googleapis.com/token';

const DEFAULT_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive',
];

// ---------- JWT helpers ----------

function base64url(str) {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlUint8(arr) {
  let s = '';
  arr.forEach(b => s += String.fromCharCode(b));
  return base64url(s);
}

async function signJWT(header, payload, pemKey) {
  const enc = new TextEncoder();
  const h = base64url(JSON.stringify(header));
  const p = base64url(JSON.stringify(payload));
  const sigInput = enc.encode(`${h}.${p}`);

  // Normalize: handle literal \n sequences that some env var tools produce
  const pemBody = pemKey
    .replace(/\\n/g, '\n')
    .replace(/-----[^-]+-----/g, '')
    .replace(/\s/g, '');
  const binaryDer = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0));

  const key = await crypto.subtle.importKey(
    'pkcs8',
    binaryDer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, sigInput);
  return `${h}.${p}.${base64urlUint8(new Uint8Array(sig))}`;
}

// ---------- Token cache ----------

let _tokenCache = { token: null, expiry: 0 };
let _tokenInflight = null;

function fetchWithTimeout(url, options, ms = 20000) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { ...options, signal: ctrl.signal }).finally(() => clearTimeout(id));
}

// sa = { client_email, private_key, scopes? }
// client_email  = SERVICE_ACCOUNT_EMAIL
// private_key   = PRIVATE_KEY (from PRIVATE_KEY_PARTS.join(''))
// scopes        = optional array; defaults to Sheets + Drive
async function getAccessToken(sa) {
  const now = Math.floor(Date.now() / 1000);
  if (_tokenCache.token && now < _tokenCache.expiry - 30) {
    return _tokenCache.token;
  }
  // Deduplicate: if a token fetch is already in flight, reuse it
  if (_tokenInflight) return _tokenInflight;

  _tokenInflight = (async () => {
    try {
      const scopeStr = (sa.scopes || DEFAULT_SCOPES).join(' ');
      const ts = Math.floor(Date.now() / 1000);
      const header  = { alg: 'RS256', typ: 'JWT' };
      const payload = {
        iss: sa.client_email,
        scope: scopeStr,
        aud: TOKEN_URI,
        iat: ts,
        exp: ts + 3600,
      };

      const jwt = await signJWT(header, payload, sa.private_key);

      const resp = await fetchWithTimeout(TOKEN_URI, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: jwt,
        }),
      });

      if (!resp.ok) {
        const err = await resp.text();
        throw new Error(`Token fetch failed: ${err}`);
      }

      const data = await resp.json();
      _tokenCache = { token: data.access_token, expiry: ts + data.expires_in };
      return data.access_token;
    } finally {
      _tokenInflight = null;
    }
  })();

  return _tokenInflight;
}

// ---------- Sheets read/write ----------

async function sheetsGet(serviceAccount, sheetId, range) {
  const token = await getAccessToken(serviceAccount);
  const url = `${SHEETS_BASE}/${sheetId}/values/${encodeURIComponent(range)}`;
  const resp = await fetchWithTimeout(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!resp.ok) throw new Error(`Sheets GET failed: ${await resp.text()}`);
  return resp.json();
}

async function sheetsAppend(serviceAccount, sheetId, range, values) {
  const token = await getAccessToken(serviceAccount);
  const url = `${SHEETS_BASE}/${sheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
  const resp = await fetchWithTimeout(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values }),
  });
  if (!resp.ok) throw new Error(`Sheets APPEND failed: ${await resp.text()}`);
  return resp.json();
}

async function sheetsUpdate(serviceAccount, sheetId, range, values) {
  const token = await getAccessToken(serviceAccount);
  const url = `${SHEETS_BASE}/${sheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
  const resp = await fetchWithTimeout(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values }),
  });
  if (!resp.ok) throw new Error(`Sheets UPDATE failed: ${await resp.text()}`);
  return resp.json();
}

async function sheetsBatchGet(serviceAccount, sheetId, ranges) {
  const token = await getAccessToken(serviceAccount);
  const qs = ranges.map(r => `ranges=${encodeURIComponent(r)}`).join('&');
  const url = `${SHEETS_BASE}/${sheetId}/values:batchGet?${qs}`;
  const resp = await fetchWithTimeout(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!resp.ok) throw new Error(`Sheets batchGet failed: ${await resp.text()}`);
  return resp.json();
}

// ---------- Drive helpers ----------

async function driveListFiles(serviceAccount, folderId) {
  const token = await getAccessToken(serviceAccount);
  const q = encodeURIComponent(`'${folderId}' in parents and trashed=false`);
  const url = `${DRIVE_BASE}/files?q=${q}&fields=files(id,name)&pageSize=200`;
  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!resp.ok) throw new Error(`Drive list failed: ${await resp.text()}`);
  return resp.json();
}

async function driveCopyFile(serviceAccount, fileId, name, destFolderId) {
  const token = await getAccessToken(serviceAccount);
  const url = `${DRIVE_BASE}/files/${fileId}/copy`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      parents: [destFolderId],
    }),
  });
  if (!resp.ok) throw new Error(`Drive copy failed: ${await resp.text()}`);
  return resp.json();
}

async function sheetsAddTab(serviceAccount, sheetId, tabTitle) {
  const token = await getAccessToken(serviceAccount);
  const url = `${SHEETS_BASE}/${sheetId}:batchUpdate`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [{
        addSheet: {
          properties: { title: tabTitle },
        },
      }],
    }),
  });
  if (!resp.ok) throw new Error(`Add tab "${tabTitle}" failed: ${await resp.text()}`);
  return resp.json();
}

async function sheetsEnsureHeaders(serviceAccount, sheetId, tabName, headers) {
  try {
    const data = await sheetsGet(serviceAccount, sheetId, `${tabName}!A1:A1`);
    if (data.values && data.values[0] && data.values[0][0]) return; // already has header
  } catch (_) { /* tab may be empty */ }
  await sheetsUpdate(serviceAccount, sheetId, `${tabName}!A1`, [headers]);
}

// Returns spreadsheet metadata including all sheet tab names and their internal IDs.
async function sheetsGetMetadata(sa, sheetId) {
  const token = await getAccessToken(sa);
  const url = `${SHEETS_BASE}/${sheetId}?fields=sheets.properties`;
  const resp = await fetchWithTimeout(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!resp.ok) throw new Error(`Metadata fetch failed: ${await resp.text()}`);
  return resp.json();
}

// Permanently deletes a tab by its internal numeric sheet ID (from sheetsGetMetadata).
async function sheetsDeleteTab(sa, sheetId, tabSheetId) {
  const token = await getAccessToken(sa);
  const url = `${SHEETS_BASE}/${sheetId}:batchUpdate`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ requests: [{ deleteSheet: { sheetId: tabSheetId } }] }),
  });
  if (!resp.ok) throw new Error(`Delete tab failed: ${await resp.text()}`);
  return resp.json();
}
