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
    units: [
      { name: 'Walk-in Cooler',  min: 34, max: 41 },
      { name: 'Deli Reach-in',   min: 34, max: 41 },
    ],
    slots: ['6 AM', '10 AM', '2 PM', '6 PM', '10 PM'],
    dailyTasks: [
      'All readings recorded and in range',
      'Alert manager if any reading is out of range',
      'Check door seals - no gaps',
      'Verify thermometers visible and accurate',
      'Record corrective action if any reading out of range',
    ],
  },

  freezerTemp: {
    label: 'Freezer Temp Log',
    isTemp: true,
    units: [
      { name: 'Walk-in Freezer',  min: -10, max: 0 },
      { name: 'Display Freezer',  min: -10, max: 0 },
      { name: 'Ice Cream Freezer', min: -10, max: 0 },
    ],
    slots: ['6 AM', '10 AM', '2 PM', '6 PM', '10 PM'],
    dailyTasks: [
      'All readings recorded and in range',
      'Alert manager if any reading is out of range',
      'Check door seals - no gaps',
      'Verify thermometers visible and accurate',
      'Record corrective action if any reading out of range',
    ],
  },
};

// State per log: { tasks: Set<string>, ppm: '', initials: '', notes: '', temps: {} }
const cleaningState = {};

function cleaningInit(container, storeNum, storeName, sheetId, serviceAccount) {
  Object.keys(CLEANING_LOGS).forEach(id => {
    cleaningState[id] = { tasks: new Set(), ppm: '', initials: '', notes: '', temps: {} };
  });

  container.innerHTML = buildCleaningHTML(storeNum, storeName);
  attachCleaningHandlers(container, storeNum, storeName, sheetId, serviceAccount);
}

function buildCleaningHTML(storeNum, storeName) {
  const today = new Date().toISOString().split('T')[0];

  const tabs = Object.entries(CLEANING_LOGS).map(([id, log]) => `
    <button class="tab-btn" data-log="${id}">${log.label}</button>
  `).join('');

  const panels = Object.entries(CLEANING_LOGS).map(([id, log]) => {
    if (log.isTemp) return buildTempPanel(id, log, today);
    return buildCleaningPanel(id, log, today);
  }).join('');

  return `
    <div id="log-tab-nav" style="display:flex;overflow-x:auto;gap:4px;margin-bottom:12px;padding-bottom:4px">
      ${tabs}
    </div>
    <div id="log-panels">${panels}</div>
  `;
}

function buildCleaningPanel(id, log, today) {
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

function buildTempPanel(id, log, today) {
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
      </div>

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
        alertEl.textContent = 'OUT OF RANGE - Notify manager!';
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
      'Store #', 'Store Name', 'Date', 'Equipment', 'Employee',
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
  doc.text(safeText('Manager / MOD Signature'), L + 260, y + 12);

  doc.save(safeText(`${log.label.replace(/ /g, '_')}_Store${storeNum}_${date}.pdf`));
}
