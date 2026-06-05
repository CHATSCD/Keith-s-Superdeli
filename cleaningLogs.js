// Module 3 — Maintenance Logs
// Depends on: sheetsApi.js, stores.js

const CLEANING_LOGS = {
  iceCreamMachine: {
    label: 'Ice Cream Machine',
    hasTemp: false,
    hasPPM: false,
    sections: [
      {
        title: 'Mix Level Check (Every Shift)',
        tasks: [
          'Chocolate mix level checked',
          'Vanilla mix level checked',
          '3rd Flavor level checked (if applicable)',
          'Mix levels refilled as needed',
          'Machine dispensing properly — no error codes',
          'Drip tray emptied and sanitized',
          'Exterior wiped clean',
          'Serving area clean and organized',
        ],
      },
      {
        title: 'Weekly Maintenance (Every 7 Days)',
        tasks: [
          'Full disassembly and cleaning completed',
          'All brushes used during cleaning',
          'Lubricant applied per manufacturer spec',
          'Sanitizer solution used correctly',
          'Machine reassembled and tested',
          'Weekly cleaning documented with date and initials',
        ],
      },
    ],
  },
  bakeryCase: {
    label: 'Bakery Case',
    hasTemp: false,
    hasPPM: false,
    sections: [
      {
        title: 'Daily Tasks',
        tasks: [
          'Wipe interior walls and shelves with sanitizer',
          'Clean glass doors inside and out',
          'Remove and clean display trays and liners',
          'Sweep or vacuum crumbs from bottom',
          'Wipe exterior frame and top',
          'Verify all products labeled and dated',
          'Remove expired product',
          'Check log is complete',
        ],
      },
      {
        title: 'Weekly Tasks',
        tasks: [
          'Deep clean interior with food-safe cleaner',
          'Clean and inspect door hinges and frame',
          'Check lighting and replace bulbs if needed',
        ],
      },
    ],
  },

  pretzelWarmer: {
    label: 'Pretzel Warmer',
    hasTemp: false,
    hasPPM: false,
    sections: [
      {
        title: 'Daily Tasks',
        tasks: [
          'Wipe exterior and glass with sanitizer',
          'Clean interior heating rods and remove crumbs',
          'Wipe warming rod housing - no grease buildup',
          'Clean rotating arm if applicable',
          'Verify temp set correctly at 140F or above',
          'Check pretzel stock',
          'Verify product dates and remove expired',
          'Check log is complete',
        ],
      },
      {
        title: 'Weekly Tasks',
        tasks: [
          'Full disassembly and deep clean interior',
          'Clean glass panels',
          'Inspect heating element and report damage immediately',
        ],
      },
    ],
  },

  teaBubbler: {
    label: 'Tea Bubbler',
    hasTemp: false,
    hasPPM: true,
    sections: [
      {
        title: 'Daily Tasks',
        tasks: [
          'Empty and rinse all vessels and dispensers',
          'Wash with hot soapy water',
          'Rinse thoroughly - no soap residue',
          'Sanitize all contact surfaces per PPM log',
          'Air dry - do NOT towel dry interior',
          'Clean exterior surfaces and spigots',
          'Record PPM sanitizer reading',
          'Wipe drip tray and empty and sanitize',
          'Check and clean lid and gasket areas',
        ],
      },
      {
        title: 'Weekly Tasks',
        tasks: [
          'Full disassembly - remove all removable parts',
          'Deep clean and sanitize all internal components',
          'Clean all removable parts thoroughly',
          'Flush lines and reassemble',
          'Full descale with approved descaler',
          'Inspect spigots for mineral buildup',
          'Check and clean all tubing connections',
        ],
      },
    ],
  },

  frazilMachine: {
    label: 'Frazil Machine',
    hasTemp: false,
    hasPPM: false,
    sections: [
      {
        title: 'Daily Tasks',
        tasks: [
          'Wipe exterior - no syrup drips or residue',
          'Clean and sanitize dispensing nozzle',
          'Empty, clean, and sanitize drip tray',
          'Wipe cup and lid area and counter',
          'Check product level and refill if needed',
          'Verify machine producing slush correctly',
          'Check log is complete',
        ],
      },
      {
        title: 'Weekly Tasks',
        tasks: [
          'Full disassembly - remove all removable parts',
          'Deep clean and sanitize all internal components',
          'Clean all removable parts thoroughly',
          'Flush lines and reassemble per manufacturer spec',
          'Inspect and clean condenser coils exterior',
        ],
      },
    ],
  },

  cafeTango: {
    label: 'Cafe Tango Machine',
    hasTemp: false,
    hasPPM: false,
    sections: [
      {
        title: 'Daily Tasks',
        tasks: [
          'Wipe exterior with sanitizer cloth',
          'Clean and sanitize dispensing nozzles',
          'Empty, clean, and sanitize drip tray',
          'Wipe cup and lid area and counter',
          'Check product and mix level and refill if needed',
          'Verify machine dispensing correctly',
          'Check log is complete',
        ],
      },
      {
        title: 'Weekly Tasks',
        tasks: [
          'Full disassembly - remove all removable parts',
          'Deep clean and sanitize all internal components',
          'Clean all removable parts thoroughly',
          'Flush lines and reassemble per manufacturer spec',
          'Full descale with approved descaling solution',
        ],
      },
    ],
  },

  refrigeratorTemp: {
    label: 'Refrigerator Temp Log',
    isTemp: true,
    note: 'Temperature required every 4 hours — Acceptable range: 35°F – 41°F',
    units: [
      { name: 'Walk-in Cooler',  min: 34, max: 41 },
      { name: 'Deli Reach-in',   min: 34, max: 41 },
    ],
    slots: ['6 AM', '10 AM', '2 PM', '6 PM', '10 PM', '2 AM'],
    dailyTasks: [
      'All readings recorded and in range',
      'Alert lead if any reading is out of range',
      'Check door seals - no gaps',
      'Verify thermometers visible and accurate',
      'Record corrective action if any reading out of range',
    ],
  },

  freezerTemp: {
    label: 'Freezer Temp Log',
    isTemp: true,
    note: 'Temperature required every 4 hours — Acceptable range: ≤ 0°F',
    units: [
      { name: 'Walk-in Freezer',  min: -10, max: 0 },
      { name: 'Display Freezer',  min: -10, max: 0 },
      { name: 'Ice Cream Freezer', min: -10, max: 0 },
    ],
    slots: ['6 AM', '10 AM', '2 PM', '6 PM', '10 PM', '2 AM'],
    dailyTasks: [
      'All readings recorded and in range',
      'Alert lead if any reading is out of range',
      'Check door seals - no gaps',
      'Verify thermometers visible and accurate',
      'Record corrective action if any reading out of range',
    ],
  },
  steamer: {
    label: 'Steamer',
    hasTemp: false,
    hasPPM: false,
    sections: [
      {
        title: 'Weekly Deep Clean — Required Once Per Week',
        tasks: [
          'Turn off and unplug steamer — allow to cool completely before cleaning',
          'Remove all steaming trays, racks, and inserts',
          'Soak all trays and racks in hot soapy water for 15+ minutes',
          'Scrub interior walls, floor, and ceiling with food-safe cleaner',
          'Clean and descale all steam nozzles and ports — no blockages',
          'Rinse all interior surfaces thoroughly — zero chemical residue',
          'Clean and inspect door gasket/seal — replace if cracked or worn',
          'Wipe down all exterior panels and controls',
          'Reassemble all removable parts',
          'Plug in, run a full steam cycle, verify proper function and no leaks',
          'Log is complete — date, time, and initials recorded',
        ],
      },
    ],
  },

  fryer: {
    label: 'Fryers',
    hasTemp: false,
    hasPPM: false,
    sections: [
      {
        title: 'Weekly Deep Clean / Boil-Out — Required Once Per Week',
        tasks: [
          'Turn off fryer — allow oil to cool to safe handling temperature',
          'Drain oil completely into approved grease storage container',
          'Remove fryer baskets — soak in hot degreaser solution',
          'Remove crumb screens, sediment trays, and any removable parts',
          'Fill fryer with water and approved boil-out solution',
          'Run boil-out cycle per product instructions (minimum 20 minutes)',
          'Drain boil-out solution completely',
          'Rinse interior thoroughly with clean water — no soap or chemical residue',
          'Wipe interior dry — inspect for remaining carbon buildup',
          'Scrub baskets and screens — rinse and air dry completely',
          'Wipe down exterior panels, controls, handles, and fryer top',
          'Clean fryer hood and grease filters directly above fryer',
          'Refill with fresh oil to the fill line',
          'Heat oil and verify correct operating temperature before use',
          'Log is complete — date, time, and initials recorded',
        ],
      },
    ],
  },

  ovens: {
    label: 'Ovens',
    hasTemp: false,
    hasPPM: false,
    sections: [
      {
        title: 'Weekly Deep Clean — Required Once Per Week',
        tasks: [
          'Turn off oven — allow to cool completely before cleaning',
          'Remove all oven racks and pans — soak in hot soapy water',
          'Apply food-safe oven cleaner to interior walls, floor, and ceiling',
          'Allow cleaner to work per product instructions',
          'Scrub all interior surfaces — remove all grease, carbon, and buildup',
          'Clean oven door glass inside and out — no streaks',
          'Clean door seals and gaskets — inspect for damage, replace if needed',
          'Rinse all interior surfaces thoroughly — zero chemical residue',
          'Scrub, rinse, and dry oven racks — reinstall when completely dry',
          'Wipe down exterior door, panels, and controls',
          'Clean vent filters or exhaust areas',
          'Turn on and verify oven reaches correct set temperature',
          'Log is complete — date, time, and initials recorded',
        ],
      },
    ],
  },

  pizzaOven: {
    label: 'Pizza Oven',
    hasTemp: false,
    hasPPM: false,
    sections: [
      {
        title: 'Weekly Deep Clean — Required Once Per Week',
        tasks: [
          'Turn off pizza oven — allow to cool completely before cleaning',
          'Remove all pizza screens, pans, paddles, and tools from oven',
          'Brush out all ash, crumbs, flour dust, and debris from deck/floor',
          'Clean deck/stone surface with food-safe oven cleaner — no harsh acids on stone',
          'Scrub interior walls and dome/ceiling — remove all grease and carbon buildup',
          'Clean interior door panels inside and outside',
          'Inspect and clean door seal/gasket — replace if worn or damaged',
          'Wipe down all exterior panels, controls, and handles',
          'Clean ventilation hood and grease filters above oven',
          'Clean all pizza screens, pans, and paddles — air dry completely',
          'Inspect and clean conveyor belt if applicable',
          'Turn on and verify oven reaches correct operating temperature',
          'Log is complete — date, time, and initials recorded',
        ],
      },
    ],
  },

};

// State per log: { tasks: Set<string>, ppm: '', initials: '', notes: '', temps: {} }
const cleaningState = {};

// ══════════════════════════════════════════════════════════════
// ENTRY-BASED LOGS  (Bakery · Pretzel · Sanitizer · Drink Station)
// Each entry appends a row to its own sheet tab.
// ══════════════════════════════════════════════════════════════

const ENTRY_LOGS = {

  bakeryLog: {
    label:       '🥖 Bakery Log',
    instruction: '📋 Log every item as it comes out of the oven. Discard By Date auto-fills 3 days from bake date. Log each case cleaning.',
    sheetTab:    'Bakery Log',
    sheetHeaders:['Store #','Store Name','Date Baked','Time Baked','Item','Qty','Discard By Date','Discard By Time','Discarded?','Case Cleaned Date','Case Cleaned Time','Initials'],
    buildForm(today, timeStr) {
      const d3 = new Date(); d3.setDate(d3.getDate()+3);
      const dd = d3.toISOString().slice(0,10);
      return `
        <div class="form-grid">
          <div class="form-row"><label>Date Baked</label><input type="date" id="ef-dateBaked" value="${today}"></div>
          <div class="form-row"><label>Time Baked</label><input type="time" id="ef-timeBaked" value="${timeStr}"></div>
          <div class="form-row"><label>Item Description</label><input type="text" id="ef-item" placeholder="e.g. Chocolate Chip Cookies"></div>
          <div class="form-row"><label>Qty</label><input type="number" id="ef-qty" min="1" placeholder="0"></div>
          <div class="form-row"><label>★ Discard By Date (+3 days)</label><input type="date" id="ef-discardDate" value="${dd}"></div>
          <div class="form-row"><label>Discard By Time</label><input type="time" id="ef-discardTime" value="${timeStr}"></div>
          <div class="form-row"><label>Case Cleaned — Date (if done today)</label><input type="date" id="ef-caseDate"></div>
          <div class="form-row"><label>Case Cleaned — Time</label><input type="time" id="ef-caseTime"></div>
          <div class="form-row"><label>Initials</label><input type="text" id="ef-initials" maxlength="8" placeholder="e.g. SD"></div>
        </div>`;
    },
    buildEntry() {
      const g = id => document.getElementById(id)?.value.trim()||'';
      if (!g('ef-item')) { alert('Enter item description.'); return null; }
      return {
        dateBaked: g('ef-dateBaked'), timeBaked: g('ef-timeBaked'),
        item:      g('ef-item'),      qty:        g('ef-qty'),
        discardDate: g('ef-discardDate'), discardTime: g('ef-discardTime'),
        discarded: 'NO',
        caseDate:  g('ef-caseDate'),  caseTime:   g('ef-caseTime'),
        initials:  g('ef-initials'),
      };
    },
    toRow(e, storeNum, storeName) {
      return [storeNum, storeName, e.dateBaked, e.timeBaked, e.item, e.qty,
              e.discardDate, e.discardTime, e.discarded, e.caseDate, e.caseTime, e.initials];
    },
    buildTableRow(e, idx) {
      const overdue = e.discarded !== 'YES' && e.discardDate && new Date(e.discardDate) < new Date();
      return `<tr style="${overdue?'background:rgba(220,38,38,.06)':''}">
        <td>${e.dateBaked}</td><td>${e.timeBaked}</td>
        <td><strong>${e.item}</strong></td><td>${e.qty}</td>
        <td style="color:${overdue?'var(--red)':'inherit'};font-weight:${overdue?700:400}">${e.discardDate} ${e.discardTime}</td>
        <td><span class="status-pill ${e.discarded==='YES'?'pill-ok':'pill-no'}">${e.discarded}</span></td>
        <td>${e.caseDate||'—'}</td><td>${e.initials||'—'}</td>
        <td><button class="btn btn-sm btn-outline" data-mark-baked="${idx}">✓ Discarded</button></td>
      </tr>`;
    },
    tableHeaders: ['Date','Time','Item','Qty','Discard By','Done?','Case Cleaned','Init',''],
  },

  pretzelLog: {
    label:       '🥨 Pretzel Warmer Log',
    instruction: '📋 Log each time items go in the warmer. Remove By auto-fills +4 hours. Log each warmer cleaning.',
    sheetTab:    'Pretzel Log',
    sheetHeaders:['Store #','Store Name','Date','Time Made','Item','Qty','Remove By','Removed?','Warmer Cleaned Date','Warmer Cleaned Time','Initials'],
    buildForm(today, timeStr) {
      // Calculate +4h
      const now4 = new Date(); now4.setHours(now4.getHours()+4);
      const r4 = now4.toTimeString().slice(0,5);
      return `
        <div class="form-grid">
          <div class="form-row"><label>Date</label><input type="date" id="ef-date" value="${today}"></div>
          <div class="form-row"><label>Time Made</label><input type="time" id="ef-timeMade" value="${timeStr}" oninput="pretzelUpdateRemoveBy()"></div>
          <div class="form-row"><label>Item Type</label>
            <select id="ef-item">
              <option value="">— Select —</option>
              <option>Pretzel</option><option>Hot Dog</option><option>Taquito</option>
              <option>Rollerbite</option><option>Kolache</option><option>Other</option>
            </select>
          </div>
          <div class="form-row"><label>Qty</label><input type="number" id="ef-qty" min="1" placeholder="0"></div>
          <div class="form-row"><label>★ Remove By (+4 hrs, auto)</label>
            <input type="time" id="ef-removeBy" value="${r4}" readonly style="background:var(--surface);color:var(--muted)">
          </div>
          <div class="form-row"><label>Warmer Cleaned — Date (if done today)</label><input type="date" id="ef-caseDate"></div>
          <div class="form-row"><label>Warmer Cleaned — Time</label><input type="time" id="ef-caseTime"></div>
          <div class="form-row"><label>Initials</label><input type="text" id="ef-initials" maxlength="8" placeholder="e.g. SD"></div>
        </div>`;
    },
    buildEntry() {
      const g = id => document.getElementById(id)?.value.trim()||'';
      if (!g('ef-item')) { alert('Select item type.'); return null; }
      return {
        date: g('ef-date'), timeMade: g('ef-timeMade'), item: g('ef-item'), qty: g('ef-qty'),
        removeBy: g('ef-removeBy'), removed: 'NO',
        caseDate: g('ef-caseDate'), caseTime: g('ef-caseTime'), initials: g('ef-initials'),
      };
    },
    toRow(e, storeNum, storeName) {
      return [storeNum, storeName, e.date, e.timeMade, e.item, e.qty,
              e.removeBy, e.removed, e.caseDate, e.caseTime, e.initials];
    },
    buildTableRow(e, idx) {
      return `<tr>
        <td>${e.date}</td><td>${e.timeMade}</td>
        <td><strong>${e.item}</strong></td><td>${e.qty}</td>
        <td>${e.removeBy}</td>
        <td><span class="status-pill ${e.removed==='YES'?'pill-ok':'pill-no'}">${e.removed}</span></td>
        <td>${e.caseDate||'—'}</td><td>${e.initials||'—'}</td>
        <td><button class="btn btn-sm btn-outline" data-mark-pretzel="${idx}">✓ Removed</button></td>
      </tr>`;
    },
    tableHeaders: ['Date','Time Made','Item','Qty','Remove By','Done?','Warmer Cleaned','Init',''],
  },

  sanitizerLog: {
    label:       '🧴 Sanitizer Log',
    instruction: '⚠ Test sanitizer minimum 2× per day (AM & PM). Quat: 200–400 PPM · Chlorine: 50–100 PPM. FAIL = discard solution immediately.',
    sheetTab:    'Sanitizer Log',
    sheetHeaders:['Store #','Store Name','Date','Test #','Time Tested','Solution Type','PPM','Pass/Fail','Corrective Action','Initials'],
    buildForm(today, timeStr) {
      return `
        <div class="form-grid">
          <div class="form-row"><label>Date</label><input type="date" id="ef-date" value="${today}"></div>
          <div class="form-row"><label>Test # (1=AM · 2=PM)</label>
            <select id="ef-testNum"><option value="1">1 — AM</option><option value="2">2 — PM</option></select>
          </div>
          <div class="form-row"><label>Time Tested</label><input type="time" id="ef-timeTested" value="${timeStr}"></div>
          <div class="form-row"><label>Solution Type</label>
            <select id="ef-solution">
              <option>Quat Sanitizer (200–400 PPM)</option>
              <option>Chlorine Bleach (50–100 PPM)</option>
              <option>Other</option>
            </select>
          </div>
          <div class="form-row"><label>Concentration (PPM)</label>
            <input type="number" id="ef-ppm" min="0" placeholder="e.g. 300">
          </div>
          <div class="form-row"><label>Pass / Fail</label>
            <select id="ef-result"><option value="">— Select —</option><option>PASS</option><option>FAIL</option></select>
          </div>
          <div class="form-row"><label>Corrective Action (if FAIL)</label>
            <input type="text" id="ef-action" placeholder="Made fresh solution, retested at X PPM">
          </div>
          <div class="form-row"><label>Initials</label><input type="text" id="ef-initials" maxlength="8" placeholder="e.g. SD"></div>
        </div>`;
    },
    buildEntry() {
      const g = id => document.getElementById(id)?.value.trim()||'';
      if (!g('ef-ppm'))    { alert('Enter PPM reading.'); return null; }
      if (!g('ef-result')) { alert('Select Pass or Fail.'); return null; }
      return {
        date: g('ef-date'), testNum: g('ef-testNum'), timeTested: g('ef-timeTested'),
        solution: g('ef-solution'), ppm: g('ef-ppm'), result: g('ef-result'),
        action: g('ef-action'), initials: g('ef-initials'),
      };
    },
    toRow(e, storeNum, storeName) {
      return [storeNum, storeName, e.date, e.testNum, e.timeTested,
              e.solution, e.ppm, e.result, e.action, e.initials];
    },
    buildTableRow(e) {
      const pass = e.result === 'PASS';
      return `<tr>
        <td>${e.date}</td>
        <td><span class="status-pill pill-info">${e.testNum==1?'AM':'PM'}</span></td>
        <td>${e.timeTested}</td>
        <td style="font-size:12px">${e.solution}</td>
        <td style="font-weight:700;color:${pass?'var(--green)':'var(--red)'}">${e.ppm} PPM</td>
        <td><span class="status-pill ${pass?'pill-ok':'pill-no'}">${e.result}</span></td>
        <td style="font-size:12px">${e.action||'—'}</td>
        <td>${e.initials||'—'}</td>
      </tr>`;
    },
    tableHeaders: ['Date','Test','Time','Solution','PPM','Result','Corrective Action','Init'],
  },


  rollerGrillLog: {
    label:       '🌭 Roller Grill Log',
    instruction: '📋 Log each time items go on the grill. Pull By auto-fills +4 hours. Tap ✓ Pulled when removed — records who pulled and exact time.',
    sheetTab:    'Roller Grill Log',
    sheetHeaders:['Store #','Store Name','Date Added','Time Added','Item','Qty','Pull By Time','Status','Date Pulled','Time Pulled','Pulled By','Added By (Initials)'],
    buildForm(today, timeStr) {
      const n4 = new Date(); n4.setHours(n4.getHours()+4);
      const pb = String(n4.getHours()).padStart(2,'0')+':'+String(n4.getMinutes()).padStart(2,'0');
      return `
        <div class="form-grid">
          <div class="form-row"><label>Date Added</label><input type="date" id="ef-date" value="${today}"></div>
          <div class="form-row"><label>Time Added</label>
            <input type="time" id="ef-timeMade" value="${timeStr}" oninput="rollerUpdatePullBy()">
          </div>
          <div class="form-row"><label>Item</label>
            <select id="ef-item">
              <option value="">— Select —</option>
              <option>Hot Dog</option><option>Taquito</option><option>Egg Roll</option>
              <option>Rollerbite</option><option>Kolache</option><option>Tornados</option><option>Other</option>
            </select>
          </div>
          <div class="form-row"><label>Qty</label><input type="number" id="ef-qty" min="1" placeholder="0"></div>
          <div class="form-row"><label>★ Pull By (+4 hrs, auto)</label>
            <input type="time" id="ef-pullBy" value="${pb}" readonly style="background:var(--surface);color:var(--muted)">
          </div>
          <div class="form-row"><label>Added By — Initials</label>
            <input type="text" id="ef-initials" maxlength="8" placeholder="e.g. SD">
          </div>
        </div>`;
    },
    buildEntry() {
      const g = id => document.getElementById(id)?.value.trim()||'';
      if (!g('ef-item'))    { alert('Select item type.'); return null; }
      if (!g('ef-timeMade')){ alert('Enter time added.'); return null; }
      return {
        date: g('ef-date'), timeMade: g('ef-timeMade'), item: g('ef-item'), qty: g('ef-qty'),
        pullBy: g('ef-pullBy'), status: 'ON GRILL',
        datePulled:'', timePulled:'', pulledBy:'', initials: g('ef-initials'),
      };
    },
    toRow(e, storeNum, storeName) {
      return [storeNum, storeName, e.date, e.timeMade, e.item, e.qty,
              e.pullBy, e.status, e.datePulled, e.timePulled, e.pulledBy, e.initials];
    },
    buildTableRow(e, idx) {
      const now = new Date();
      const pullDt = e.date && e.pullBy ? new Date(e.date+'T'+e.pullBy) : null;
      const overdue = e.status !== 'PULLED' && pullDt && pullDt < now;
      return `<tr style="${overdue?'background:rgba(220,38,38,.06)':''}">
        <td>${e.date}</td><td>${e.timeMade}</td>
        <td><strong>${e.item}</strong></td><td>${e.qty}</td>
        <td style="color:${overdue?'var(--red)':'inherit'};font-weight:${overdue?700:400}">${e.pullBy}</td>
        <td><span class="status-pill ${e.status==='PULLED'?'pill-ok':'pill-no'}">${e.status}</span></td>
        <td>${e.datePulled||'—'}</td>
        <td>${e.timePulled||'—'}</td>
        <td>${e.pulledBy||'—'}</td>
        <td>${e.initials||'—'}</td>
        <td>${e.status!=='PULLED'?`<button class="btn btn-sm btn-outline" data-mark-roller="${idx}">✓ Pulled</button>`:''}</td>
      </tr>`;
    },
    tableHeaders:['Date Added','Time Added','Item','Qty','Pull By','Status','Date Pulled','Time Pulled','Pulled By','Added By',''],
  },

  peanutPatchLog: {
    label:       '🥜 Peanut Patch Log',
    instruction: '📋 Log daily: switch to a new container, use a new lid, clean the old container. Full name sign-off required.',
    sheetTab:    'Peanut Patch Log',
    sheetHeaders:['Store #','Store Name','Date','Time','New Container Used?','New Lid Used?','Old Container Cleaned?','Signed By (Full Name)','Initials'],
    buildForm(today, timeStr) {
      return `
        <div class="form-grid">
          <div class="form-row"><label>Date</label><input type="date" id="ef-date" value="${today}"></div>
          <div class="form-row"><label>Time</label><input type="time" id="ef-time" value="${timeStr}"></div>
          <div class="form-row"><label>Switched to New Container?</label>
            <select id="ef-newContainer">
              <option value="">— Select —</option><option>YES</option><option>NO</option>
            </select>
          </div>
          <div class="form-row"><label>New Lid Used?</label>
            <select id="ef-newLid">
              <option value="">— Select —</option><option>YES</option><option>NO</option>
            </select>
          </div>
          <div class="form-row"><label>Old Container Cleaned?</label>
            <select id="ef-cleaned">
              <option value="">— Select —</option><option>YES</option><option>NO</option>
            </select>
          </div>
          <div class="form-row"><label>✍ Signed By — Full Name</label>
            <input type="text" id="ef-signedBy" placeholder="Full name required for sign-off">
          </div>
          <div class="form-row"><label>Initials</label>
            <input type="text" id="ef-initials" maxlength="8" placeholder="e.g. SD">
          </div>
        </div>`;
    },
    buildEntry() {
      const g = id => document.getElementById(id)?.value.trim()||'';
      if (!g('ef-newContainer')){ alert('Select New Container status.'); return null; }
      if (!g('ef-newLid'))      { alert('Select New Lid status.'); return null; }
      if (!g('ef-cleaned'))     { alert('Select Old Container Cleaned status.'); return null; }
      if (!g('ef-signedBy'))    { alert('Full name required for sign-off.'); return null; }
      return {
        date: g('ef-date'), time: g('ef-time'),
        newContainer: g('ef-newContainer'), newLid: g('ef-newLid'),
        cleaned: g('ef-cleaned'), signedBy: g('ef-signedBy'), initials: g('ef-initials'),
      };
    },
    toRow(e, storeNum, storeName) {
      return [storeNum, storeName, e.date, e.time,
              e.newContainer, e.newLid, e.cleaned, e.signedBy, e.initials];
    },
    buildTableRow(e) {
      const ok = v => `<span class="status-pill ${v==='YES'?'pill-ok':v==='NO'?'pill-no':''}">${v||'—'}</span>`;
      return `<tr>
        <td>${e.date}</td><td>${e.time}</td>
        <td style="text-align:center">${ok(e.newContainer)}</td>
        <td style="text-align:center">${ok(e.newLid)}</td>
        <td style="text-align:center">${ok(e.cleaned)}</td>
        <td style="font-weight:600">${e.signedBy}</td>
        <td>${e.initials||'—'}</td>
      </tr>`;
    },
    tableHeaders:['Date','Time','New Container?','New Lid?','Old Cleaned?','Signed By','Initials'],
  },
  drinkStationLog: {
    label:       '☕ Drink Station Log',
    instruction: '📋 Log each time product is made AND each time machines are fully broken down and cleaned. Select the correct station.',
    sheetTab:    'Drink Station Log',
    sheetHeaders:['Store #','Store Name','Date','Station','Product/Flavor','Time Made','Machine Cleaned Date','Machine Cleaned Time','Initials'],
    buildForm(today, timeStr) {
      return `
        <div class="form-grid">
          <div class="form-row"><label>Date</label><input type="date" id="ef-date" value="${today}"></div>
          <div class="form-row"><label>Station</label>
            <select id="ef-station">
              <option value="">— Select —</option>
              <option>Tea</option><option>Coffee</option><option>Tango</option><option>Frazil</option>
            </select>
          </div>
          <div class="form-row"><label>Product / Flavor</label>
            <input type="text" id="ef-product" placeholder="e.g. Sweet Tea, House Blend…">
          </div>
          <div class="form-row"><label>Time Made / Brewed</label>
            <input type="time" id="ef-timeMade" value="${timeStr}">
          </div>
          <div class="form-row"><label>Machine Cleaned — Date (if done today)</label>
            <input type="date" id="ef-cleanDate">
          </div>
          <div class="form-row"><label>Machine Cleaned — Time</label>
            <input type="time" id="ef-cleanTime">
          </div>
          <div class="form-row"><label>Initials</label><input type="text" id="ef-initials" maxlength="8" placeholder="e.g. SD"></div>
        </div>`;
    },
    buildEntry() {
      const g = id => document.getElementById(id)?.value.trim()||'';
      if (!g('ef-station')) { alert('Select a station.'); return null; }
      return {
        date: g('ef-date'), station: g('ef-station'), product: g('ef-product'),
        timeMade: g('ef-timeMade'), cleanDate: g('ef-cleanDate'),
        cleanTime: g('ef-cleanTime'), initials: g('ef-initials'),
      };
    },
    toRow(e, storeNum, storeName) {
      return [storeNum, storeName, e.date, e.station, e.product,
              e.timeMade, e.cleanDate, e.cleanTime, e.initials];
    },
    buildTableRow(e) {
      const SC = {Tea:'#e3f2fd',Coffee:'#f3e8de',Tango:'#fef9c3',Frazil:'#dcfce7'};
      return `<tr>
        <td>${e.date}</td>
        <td style="background:${SC[e.station]||'transparent'};text-align:center;font-weight:600;font-size:12px">${e.station}</td>
        <td>${e.product||'—'}</td>
        <td>${e.timeMade||'—'}</td>
        <td>${e.cleanDate||'—'} ${e.cleanTime||''}</td>
        <td>${e.initials||'—'}</td>
      </tr>`;
    },
    tableHeaders: ['Date','Station','Product/Flavor','Time Made','Machine Cleaned','Init'],
  },
};

// Per-session entries: { logId: [ {...entry} ] }
const entryLogEntries = {
  bakeryLog: [], pretzelLog: [], sanitizerLog: [], drinkStationLog: [],
  rollerGrillLog: [], peanutPatchLog: []
};

// ── Helper: time string "HH:MM" from a <input type=time> value ──────

function rollerUpdatePullBy() {
  const t = document.getElementById('ef-timeMade');
  const r = document.getElementById('ef-pullBy');
  if (!t || !r || !t.value) return;
  const [h, m] = t.value.split(':').map(Number);
  const d = new Date(); d.setHours(h+4, m, 0, 0);
  r.value = String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
}
function pretzelUpdateRemoveBy() {
  const madeEl = document.getElementById('ef-timeMade');
  const rbyEl  = document.getElementById('ef-removeBy');
  if (!madeEl || !rbyEl || !madeEl.value) return;
  const [h, m] = madeEl.value.split(':').map(Number);
  const d = new Date(); d.setHours(h+4, m, 0, 0);
  rbyEl.value = String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
}

// ── Build the panel HTML for an entry log ───────────────────────────
function buildEntryLogPanel(id, log, today) {
  const now = new Date();
  const timeStr = String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0');

  return `
    <div class="log-panel" id="panel-${id}" style="display:none">
      <div class="card">
        <div class="card-title">${log.label}</div>
        <p style="font-size:13px;color:var(--muted);margin-bottom:14px;line-height:1.5">${log.instruction}</p>

        ${log.buildForm(today, timeStr)}

        <div class="btn-row" style="margin-top:14px">
          <button class="btn btn-primary" data-entry-add="${id}">+ Add Entry</button>
        </div>
        <div class="entry-status" id="estatus-${id}" style="margin-top:8px;font-size:13px"></div>
      </div>

      <div class="card" id="entry-table-card-${id}" style="display:none">
        <div class="card-title">Today's Entries — <span id="entry-count-${id}">0</span></div>
        <div style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;font-size:13px" id="entry-table-${id}">
            <thead><tr>${log.tableHeaders.map(h=>`<th style="padding:7px 10px;background:var(--ks-blue2);color:#fff;text-align:left;white-space:nowrap;font-size:11px">${h}</th>`).join('')}</tr></thead>
            <tbody id="entry-tbody-${id}"></tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

// ── Re-render the entries table for a log ───────────────────────────
function renderEntryTable(id, log) {
  const entries = entryLogEntries[id] || [];
  const card = document.getElementById(`entry-table-card-${id}`);
  const tbody = document.getElementById(`entry-tbody-${id}`);
  const count = document.getElementById(`entry-count-${id}`);
  if (!tbody) return;

  if (!entries.length) {
    if (card) card.style.display = 'none';
    return;
  }
  if (card) card.style.display = 'block';
  if (count) count.textContent = entries.length;

  tbody.innerHTML = [...entries].reverse().map((e, i) =>
    log.buildTableRow(e, entries.length - 1 - i)
  ).join('');
}

// ── Save one entry to Google Sheets ─────────────────────────────────
async function saveEntryLogRow(logId, entry, storeNum, storeName, sheetId, serviceAccount) {
  const log = ENTRY_LOGS[logId];
  try {
    await sheetsEnsureHeaders(serviceAccount, sheetId, log.sheetTab, log.sheetHeaders);
    await sheetsAppend(serviceAccount, sheetId, `${log.sheetTab}!A1`, [log.toRow(entry, storeNum, storeName)]);
  } catch(err) {
    console.error('Entry save error:', err);
    throw err;
  }
}


function cleaningInit(container, storeNum, storeName, sheetId, serviceAccount) {
  Object.keys(CLEANING_LOGS).forEach(id => {
    cleaningState[id] = { tasks: new Set(), ppm: '', initials: '', notes: '', temps: {}, time: '' };
  });

  container.innerHTML = buildCleaningHTML(storeNum, storeName);
  attachCleaningHandlers(container, storeNum, storeName, sheetId, serviceAccount);
}

function buildCleaningHTML(storeNum, storeName) {
  const today = new Date().toISOString().split('T')[0];
  const _nt = new Date();
  const timeStr = String(_nt.getHours()).padStart(2,'0')+':'+String(_nt.getMinutes()).padStart(2,'0');

  const cleaningTabs = Object.entries(CLEANING_LOGS).map(([id, log]) => `
    <button class="tab-btn" data-log="${id}">${log.label}</button>
  `).join('');
  const entryTabs = Object.entries(ENTRY_LOGS).map(([id, log]) => `
    <button class="tab-btn" data-log="${id}">${log.label}</button>
  `).join('');
  const tabs = cleaningTabs + entryTabs;

  const cleaningPanels = Object.entries(CLEANING_LOGS).map(([id, log]) => {
    if (log.isTemp) return buildTempPanel(id, log, today, timeStr);
    return buildCleaningPanel(id, log, today, timeStr);
  }).join('');
  const entryPanels = Object.entries(ENTRY_LOGS).map(([id, log]) =>
    buildEntryLogPanel(id, log, today)
  ).join('');
  const panels = cleaningPanels + entryPanels;

  return `
    <div id="log-tab-nav" style="display:flex;overflow-x:auto;gap:4px;margin-bottom:12px;padding-bottom:4px">
      ${tabs}
    </div>
    <div id="log-panels">${panels}</div>
  `;
}

function buildCleaningPanel(id, log, today, timeStr) {
  const sectionsHTML = log.sections.map((sec, si) => `
    <div class="card">
      <div class="card-title">${sec.title}</div>
      ${sec.tasks.map((task, ti) => `
        <div class="task-item" data-log="${id}" data-task="${si}-${ti}">
          <div class="task-cb"></div>
          <div class="task-label">${task}</div>
        </div>
      `).join('')}
    </div>
  `).join('');

  return `
    <div class="log-panel" id="panel-${id}" style="display:none">
      <div class="card">
        <div class="card-title">${log.label}</div>
        <div class="form-grid">
          <div class="form-row">
            <label>Date</label>
            <input type="date" class="log-date" data-log="${id}" value="${today}">
          </div>
          <div class="form-row">
            <label>Time</label>
            <input type="time" class="log-time" data-log="${id}" value="${timeStr||''}">
          </div>
          <div class="form-row">
            <label>Employee Initials</label>
            <input type="text" class="log-initials" data-log="${id}" placeholder="Initials" maxlength="8">
          </div>
        </div>
        ${log.hasPPM ? `
        <div class="form-row">
          <label>PPM Sanitizer Reading</label>
          <input type="number" class="log-ppm" data-log="${id}" placeholder="e.g. 200" min="0" max="999">
        </div>
        ` : ''}
      </div>

      ${sectionsHTML}

      <div class="card">
        <div class="form-row">
          <label>Notes / Corrective Actions</label>
          <textarea class="log-notes" data-log="${id}" placeholder="Any issues or corrective actions taken..."></textarea>
        </div>
      </div>

      <div class="btn-row">
        <button class="btn btn-primary" data-save="${id}">Save Log to Sheet</button>
        <button class="btn btn-outline" data-pdf="${id}">Export PDF</button>
      </div>
      <div class="log-status" data-status="${id}" style="margin-top:10px;font-size:14px"></div>
    </div>
  `;
}

function buildTempPanel(id, log, today, timeStr) {
  const tableRows = log.units.map(unit => `
    <tr>
      <td style="font-weight:600;white-space:nowrap">${unit.name}<br>
        <span style="font-size:11px;color:var(--muted)">Target: ${unit.min}F to ${unit.max}F</span>
      </td>
      ${log.slots.map(slot => `
        <td>
          <input type="number" step="0.1"
            class="temp-input"
            data-log="${id}"
            data-unit="${unit.name}"
            data-slot="${slot}"
            data-min="${unit.min}"
            data-max="${unit.max}"
            placeholder="--">
          <input type="text"
            class="init-input"
            data-log="${id}"
            data-unit="${unit.name}"
            data-slot="${slot}"
            placeholder="Init"
            maxlength="5"
            style="margin-top:4px">
        </td>
      `).join('')}
    </tr>
  `).join('');

  const dailyTasksHTML = log.dailyTasks.map((task, ti) => `
    <div class="task-item" data-log="${id}" data-task="daily-${ti}">
      <div class="task-cb"></div>
      <div class="task-label">${task}</div>
    </div>
  `).join('');

  return `
    <div class="log-panel" id="panel-${id}" style="display:none">
      <div class="card">
        <div class="card-title">${log.label}</div>
        <div class="form-row">
          <label>Date</label>
          <input type="date" class="log-date" data-log="${id}" value="${today}">
        </div>
        <div class="form-row">
          <label>Log Time</label>
          <input type="time" class="log-time" data-log="${id}" value="${timeStr||''}">
        </div>
      </div>

      ${log.note ? `<div style="font-size:13px;color:var(--muted);padding:8px 12px;background:var(--surface);border-radius:6px;margin-bottom:8px">⏱ ${log.note}</div>` : ''}

      <div class="card">
        <div class="card-title">Temperature Readings</div>
        <div class="temp-grid">
          <table class="temp-table">
            <thead>
              <tr>
                <th>Unit</th>
                ${log.slots.map(s => `<th>${s}</th>`).join('')}
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <div class="card-title">Daily Tasks</div>
        ${dailyTasksHTML}
      </div>

      <div class="card">
        <div class="form-row">
          <label>Notes / Corrective Actions</label>
          <textarea class="log-notes" data-log="${id}" placeholder="Record any out-of-range corrective actions here..."></textarea>
        </div>
      </div>

      <div class="btn-row">
        <button class="btn btn-primary" data-save="${id}">Save Log to Sheet</button>
        <button class="btn btn-outline" data-pdf="${id}">Export PDF</button>
      </div>
      <div class="log-status" data-status="${id}" style="margin-top:10px;font-size:14px"></div>
    </div>
  `;
}

function attachCleaningHandlers(container, storeNum, storeName, sheetId, serviceAccount) {
  // Sub-tab switching
  const logTabNav = container.querySelector('#log-tab-nav');
  const firstId = Object.keys(CLEANING_LOGS)[0];
  const allLogIds = [...Object.keys(CLEANING_LOGS), ...Object.keys(ENTRY_LOGS)];

  function showPanel(id) {
    container.querySelectorAll('.log-panel').forEach(p => p.style.display = 'none');
    container.querySelectorAll('#log-tab-nav .tab-btn').forEach(b => b.classList.remove('active'));
    const panel = document.getElementById(`panel-${id}`);
    if (panel) panel.style.display = 'block';
    const btn = logTabNav.querySelector(`[data-log="${id}"]`);
    if (btn) btn.classList.add('active');
  }

  logTabNav.addEventListener('click', e => {
    const btn = e.target.closest('[data-log]');
    if (btn) showPanel(btn.dataset.log);
  });

  // ── Entry log: Add Entry button ──────────────────────────────────
  container.addEventListener('click', async e => {
    const addBtn = e.target.closest('[data-entry-add]');
    if (!addBtn) return;
    const id  = addBtn.dataset.entryAdd;
    const log = ENTRY_LOGS[id];
    if (!log) return;
    const entry = log.buildEntry();
    if (!entry) return;
    entryLogEntries[id].push(entry);
    renderEntryTable(id, log);
    const statusEl = document.getElementById(`estatus-${id}`);
    if (statusEl) statusEl.innerHTML = '<span style="color:var(--green)">Entry added — saving to sheet…</span>';
    try {
      await saveEntryLogRow(id, entry, storeNum, storeName, sheetId, serviceAccount);
      if (statusEl) statusEl.innerHTML = '<span style="color:var(--green)">✓ Saved to sheet.</span>';
    } catch(err) {
      if (statusEl) statusEl.innerHTML = `<span style="color:var(--red)">Sheet save failed: ${err.message}</span>`;
    }
  });

  // ── Bakery: mark discarded ────────────────────────────────────────
  container.addEventListener('click', e => {
    const btn = e.target.closest('[data-mark-baked]');
    if (!btn) return;
    const idx = parseInt(btn.dataset.markBaked);
    if (entryLogEntries.bakeryLog[idx]) {
      entryLogEntries.bakeryLog[idx].discarded = 'YES';
      renderEntryTable('bakeryLog', ENTRY_LOGS.bakeryLog);
    }
  });

  // ── Pretzel: mark removed ─────────────────────────────────────────
  container.addEventListener('click', e => {
    const btn = e.target.closest('[data-mark-pretzel]');
    if (!btn) return;
    const idx = parseInt(btn.dataset.markPretzel);
    if (entryLogEntries.pretzelLog[idx]) {
      entryLogEntries.pretzelLog[idx].removed = 'YES';
      renderEntryTable('pretzelLog', ENTRY_LOGS.pretzelLog);
    }
  });

  // ── Roller Grill: mark pulled ─────────────────────────────────
  container.addEventListener('click', e => {
    const btn = e.target.closest('[data-mark-roller]');
    if (!btn) return;
    const idx = parseInt(btn.dataset.markRoller);
    const entry = entryLogEntries.rollerGrillLog[idx];
    if (!entry) return;
    const pulledBy = prompt('Who pulled this item? (Name or initials)');
    if (!pulledBy) return;
    const now = new Date();
    entry.status     = 'PULLED';
    entry.datePulled = now.toISOString().slice(0,10);
    entry.timePulled = String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
    entry.pulledBy   = pulledBy.trim();
    renderEntryTable('rollerGrillLog', ENTRY_LOGS.rollerGrillLog);
    // Save pull update to sheet (fire-and-forget)
    saveEntryLogRow('rollerGrillLog', entry, storeNum, storeName, sheetId, serviceAccount)
      .catch(err => console.error('Roller pull save error:', err));
  });

  showPanel(firstId);

  // Task checkboxes
  container.addEventListener('click', e => {
    const item = e.target.closest('.task-item');
    if (!item) return;
    const id   = item.dataset.log;
    const task = item.dataset.task;
    if (!id || !task) return;

    const state = cleaningState[id];
    if (state.tasks.has(task)) {
      state.tasks.delete(task);
      item.classList.remove('done');
      item.querySelector('.task-cb').textContent = '';
    } else {
      state.tasks.add(task);
      item.classList.add('done');
      item.querySelector('.task-cb').textContent = '✓';
    }
  });

  // Temp inputs — out-of-range detection
  container.addEventListener('change', e => {
    const inp = e.target;
    if (!inp.classList.contains('temp-input')) return;

    const val  = parseFloat(inp.value);
    const min  = parseFloat(inp.dataset.min);
    const max  = parseFloat(inp.dataset.max);
    const id   = inp.dataset.log;
    const unit = inp.dataset.unit;
    const slot = inp.dataset.slot;

    if (!cleaningState[id]) return;
    if (!cleaningState[id].temps[unit]) cleaningState[id].temps[unit] = {};
    cleaningState[id].temps[unit][slot] = { temp: val };

    if (!isNaN(val) && (val < min || val > max)) {
      inp.classList.add('oor');
      // Show alert
      let alertEl = inp.parentElement.querySelector('.out-of-range');
      if (!alertEl) {
        alertEl = document.createElement('div');
        alertEl.className = 'out-of-range';
        alertEl.textContent = 'OUT OF RANGE - Notify lead!';
        inp.parentElement.appendChild(alertEl);
      }
    } else {
      inp.classList.remove('oor');
      const alertEl = inp.parentElement.querySelector('.out-of-range');
      if (alertEl) alertEl.remove();
    }
  });

  // Initials for temp
  container.addEventListener('change', e => {
    const inp = e.target;
    if (!inp.classList.contains('init-input')) return;
    const id   = inp.dataset.log;
    const unit = inp.dataset.unit;
    const slot = inp.dataset.slot;
    if (!cleaningState[id]) return;
    if (!cleaningState[id].temps[unit]) cleaningState[id].temps[unit] = {};
    if (!cleaningState[id].temps[unit][slot]) cleaningState[id].temps[unit][slot] = {};
    cleaningState[id].temps[unit][slot].initials = inp.value;
  });

  // Other inputs
  container.addEventListener('change', e => {
    const el = e.target;
    if (el.classList.contains('log-initials')) {
      cleaningState[el.dataset.log].initials = el.value;
    }
    if (el.classList.contains('log-time')) {
      cleaningState[el.dataset.log].time = el.value;
    }
    if (el.classList.contains('log-ppm')) {
      cleaningState[el.dataset.log].ppm = el.value;
    }
    if (el.classList.contains('log-notes')) {
      cleaningState[el.dataset.log].notes = el.value;
    }
  });

  // Save buttons
  container.addEventListener('click', async e => {
    const saveBtn = e.target.closest('[data-save]');
    if (!saveBtn) return;
    const id = saveBtn.dataset.save;
    await saveCleaningLog(id, storeNum, storeName, sheetId, serviceAccount, container);
  });

  // PDF buttons
  container.addEventListener('click', e => {
    const pdfBtn = e.target.closest('[data-pdf]');
    if (!pdfBtn) return;
    const id = pdfBtn.dataset.pdf;
    exportCleaningPDF(id, storeNum, storeName, container);
  });
}

async function saveCleaningLog(logId, storeNum, storeName, sheetId, serviceAccount, container) {
  const log      = CLEANING_LOGS[logId];
  const state    = cleaningState[logId];
  const saveBtn  = container.querySelector(`[data-save="${logId}"]`);
  const statusEl = container.querySelector(`[data-status="${logId}"]`);
  const dateEl   = container.querySelector(`.log-date[data-log="${logId}"]`);
  const date     = dateEl?.value || new Date().toISOString().split('T')[0];

  if (!sheetId) {
    statusEl.innerHTML = '<span style="color:var(--red)">Error: Sheet ID not configured.</span>';
    return;
  }

  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving...';

  let tasksCompleted = [], tasksMissed = [];

  if (log.isTemp) {
    log.dailyTasks.forEach((task, ti) => {
      const key = `daily-${ti}`;
      (state.tasks.has(key) ? tasksCompleted : tasksMissed).push(task);
    });
  } else {
    log.sections.forEach((sec, si) => {
      sec.tasks.forEach((task, ti) => {
        const key = `${si}-${ti}`;
        (state.tasks.has(key) ? tasksCompleted : tasksMissed).push(task);
      });
    });
  }

  const tempSummary = log.isTemp
    ? Object.entries(state.temps).map(([unit, slots]) =>
        `${unit}: ` + Object.entries(slots).map(([slot, v]) => `${slot}=${v.temp}F`).join(', ')
      ).join(' | ')
    : '';

  const row = [
    storeNum,
    storeName,
    date,
    state.time || '',
    log.label,
    state.initials,
    tasksCompleted.join('; '),
    tasksMissed.join('; '),
    log.hasPPM ? state.ppm : '',
    log.isTemp ? tempSummary : '',
    state.notes,
  ];

  try {
    await sheetsEnsureHeaders(serviceAccount, sheetId, 'Maintenance Logs', [
      'Store #', 'Store Name', 'Date', 'Time', 'Equipment', 'Employee',
      'Tasks Completed', 'Tasks Missed', 'PPM', 'Temp Readings', 'Notes',
    ]);
    await sheetsAppend(serviceAccount, sheetId, 'Maintenance Logs!A1', [row]);
    statusEl.innerHTML = '<span style="color:var(--green)">Log saved successfully.</span>';
  } catch (err) {
    statusEl.innerHTML = `<span style="color:var(--red)">Error: ${err.message}</span>`;
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Log to Sheet';
  }
}

function safeText(str) {
  return String(str || '').replace(/[^\x00-\xFF]/g, '').trim();
}

function exportCleaningPDF(logId, storeNum, storeName, container) {
  if (typeof window.jspdf === 'undefined') {
    alert('jsPDF not loaded. Check your internet connection and reload.');
    return;
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });

  const log      = CLEANING_LOGS[logId];
  const state    = cleaningState[logId];
  const dateEl   = container.querySelector(`.log-date[data-log="${logId}"]`);
  const date     = dateEl?.value || '';
  const initials = state.initials;
  const notes    = state.notes;

  let y = 40;
  const L = 40;
  const W = 532;

  // Header
  doc.setFillColor(26, 39, 68);
  doc.rect(L, y, W, 56, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(safeText("Keith's Superdeli"), L + 12, y + 20);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(safeText(`${log.label} Maintenance Log`), L + 12, y + 36);
  doc.text(safeText(`Store #${storeNum} - ${storeName}   Date: ${date}   Employee: ${initials}`), L + 12, y + 50);
  y += 68;

  if (log.isTemp) {
    // Temp readings table
    doc.setFillColor(26, 39, 68);
    doc.rect(L, y, W, 18, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(safeText('Temperature Readings'), L + 6, y + 13);
    y += 22;

    log.units.forEach(unit => {
      if (y > 680) { doc.addPage(); y = 40; }
      doc.setTextColor(26, 39, 68);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(safeText(`${unit.name} (Target: ${unit.min}F - ${unit.max}F)`), L, y + 12);
      y += 18;

      const slots = state.temps[unit.name] || {};
      log.slots.forEach(slot => {
        const entry = slots[slot] || {};
        const temp  = entry.temp !== undefined ? entry.temp : '--';
        const init  = entry.initials || '--';
        const oor   = entry.temp !== undefined && (entry.temp < unit.min || entry.temp > unit.max);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        if (oor) {
          doc.setTextColor(220, 38, 38);
        } else {
          doc.setTextColor(26, 26, 26);
        }
        doc.text(safeText(`  ${slot}: ${temp}F  (${init})${oor ? ' - OUT OF RANGE' : ''}`), L + 10, y + 10);
        y += 14;
      });
      y += 4;
    });

    // Daily tasks
    doc.setFillColor(26, 39, 68);
    doc.rect(L, y, W, 18, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(safeText('Daily Tasks'), L + 6, y + 13);
    y += 22;

    log.dailyTasks.forEach((task, ti) => {
      if (y > 700) { doc.addPage(); y = 40; }
      const done = state.tasks.has(`daily-${ti}`);
      doc.setTextColor(done ? 22 : 220, done ? 163 : 38, done ? 74 : 38);
      doc.setFont('helvetica', done ? 'normal' : 'bold');
      doc.setFontSize(9);
      doc.text(safeText(`[${done ? 'DONE' : 'MISSED'}] ${task}`), L + 6, y + 10);
      y += 14;
    });

  } else {
    // Regular cleaning log
    log.sections.forEach((sec, si) => {
      if (y > 660) { doc.addPage(); y = 40; }
      doc.setFillColor(26, 39, 68);
      doc.rect(L, y, W, 18, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(safeText(sec.title), L + 6, y + 13);
      y += 22;

      sec.tasks.forEach((task, ti) => {
        if (y > 700) { doc.addPage(); y = 40; }
        const done = state.tasks.has(`${si}-${ti}`);
        doc.setTextColor(done ? 22 : 220, done ? 163 : 38, done ? 74 : 38);
        doc.setFont('helvetica', done ? 'normal' : 'bold');
        doc.setFontSize(9);
        doc.text(safeText(`[${done ? 'DONE' : 'MISSED'}] ${task}`), L + 6, y + 10);
        y += 14;
      });
      y += 6;
    });

    if (log.hasPPM) {
      doc.setTextColor(26, 39, 68);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(safeText(`PPM Sanitizer Reading: ${state.ppm || '--'}`), L, y);
      y += 18;
    }
  }

  // Notes
  if (notes.trim()) {
    if (y > 660) { doc.addPage(); y = 40; }
    y += 10;
    doc.setTextColor(26, 39, 68);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(safeText('Notes / Corrective Actions:'), L, y);
    y += 14;
    doc.setTextColor(26, 26, 26);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const lines = doc.splitTextToSize(safeText(notes), W);
    doc.text(lines, L, y);
    y += lines.length * 12 + 10;
  }

  // Signature
  if (y > 680) { doc.addPage(); y = 40; }
  y += 20;
  doc.setDrawColor(26, 39, 68);
  doc.setLineWidth(1);
  doc.line(L, y, L + 200, y);
  doc.line(L + 260, y, L + 460, y);
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.setFont('helvetica', 'normal');
  doc.text(safeText('Employee Signature'), L, y + 12);
  doc.text(safeText('Lead / MOD Signature'), L + 260, y + 12);

  doc.save(safeText(`${log.label.replace(/ /g, '_')}_Store${storeNum}_${date}.pdf`));
}
