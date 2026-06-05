// Module 2 — F.S. Inspection
// Depends on: sheetsApi.js, stores.js

const INSPECTION_SECTIONS = [
  {
    id: 'storerooms',
    title: 'Storerooms',
    items: [
      'Rotation of food supplies',
      'All items covered, labeled, and dated',
      'Items on racks 6 inches from floor',
      'Cleaning supplies stored separately from food',
      'Shelves clean and dust-free',
      'Walls, floors, ceilings, vents, and doors clean',
      'No signs of rodent or insect infestation',
    ],
  },
  {
    id: 'refrigerator',
    title: 'Refrigerator',
    items: [
      'Shelves, racks, walls, floors, ceiling, and doors clean',
      'Fans clear of dust or ice buildup',
      'Thermometer visible and reading 41F or below',
      'Temps logged daily',
      'Raw food stored below cooked food',
      'Food dated and labeled',
      'Food discarded after 72 hours',
    ],
  },
  {
    id: 'freezers',
    title: 'Freezers',
    items: [
      'Food covered, labeled, and dated',
      'Items on racks with adequate air circulation',
      'Shelves, walls, floors, ceiling, and doors clean and ice-free',
      'Thermometer visible and reading 0F or below',
      'Freezer temps logged daily',
    ],
  },
  {
    id: 'inventory',
    title: 'Inventory',
    items: [
      'Items organized and labeled',
      'Counts by sleeve and box confirmed',
      'Counts done by same person consistently',
      'Counts done same day and time each cycle',
      'Pricing updated with weekly invoices',
      'Items not being used identified',
      'Pricing current on all received forms',
    ],
  },
  {
    id: 'pizza',
    title: 'Pizza Station',
    items: [
      'Station clean and free of previous toppings',
      'Cutting tools wiped and disinfected',
      'Toppings drained and refilled',
      'Crusts stocked',
      'Boxes premade',
      'Hot box filled with pizza',
      'Hot box display clean front and back',
      'Pizza time labeled on box',
      'Pizza variety in stock',
    ],
  },
  {
    id: 'sink',
    title: '3 Compartment Sink',
    items: [
      'Sanitizing test kit available and in use',
      'Items air dried (not towel dried)',
      'Storage racks, walls, and floor clean',
      'PPM recorded daily',
      'Scrubbers and rags in clean order',
      'All utensils cleaned, sanitized, and stored properly',
    ],
  },
  {
    id: 'sanitation',
    title: 'General Sanitation',
    items: [
      'Daily cleaning schedule followed',
      'Handwashing procedures posted',
      'Towel and soap dispensers filled',
      'Floors, walls, ceilings, and work areas clean',
      'Work tables and drawers clean',
      'Hood filters clean and on schedule',
      'Gloves worn per policy',
      'Smoker cleaned',
      'Steamer wiped and drained',
      'Heat boxes wiped and turned off',
      'Grab-and-go wiped and organized',
      'Hot box wiped inside and out',
      'Trash out and boxes broken down',
      'Griddle grease drain cleaned daily',
      'Fryers filtered after each use',
    ],
  },
  {
    id: 'foh',
    title: 'Front of House',
    items: [
      'Tables and seats wiped',
      'Drink stations clean',
      'Trash cans not overflowing',
      'Bakery case full and products labeled',
      'Condiments refilled and organized',
      'Windows and doors clean',
      'Entrance swept',
      'Under seating swept',
      'Coffee and tea urns wiped',
      'Inventory organized in cabinets',
      'Cups, lids, straws, and condiments stocked',
    ],
  },
  {
    id: 'entering',
    title: 'Upon Entering Store',
    items: [
      'Greeted with "Welcome to Keith\'s"',
      'Entrance free of trash',
      'Garbage cans recently pulled',
      'Cigarette post 6 or more feet from doorways',
    ],
  },
  {
    id: 'icecream',
    title: 'Ice Cream Machines',
    items: [
      'Log fully filled out',
      'Machine working properly',
      'Machine cleaned within 7 days - Week 1',
      'Machine cleaned within 7 days - Week 2',
      'Machine cleaned within 7 days - Week 3',
      'Machine cleaned within 7 days - Week 4',
    ],
    specialItems: { 1: 'maintenanceTicket' },
  },
  {
    id: 'bakery',
    title: 'Bakery Case (Room Temp)',
    items: [
      'Case full for customers',
      'Case clean',
      'Log complete',
      'All products and shelves dated',
      'All products in date',
    ],
  },
  {
    id: 'pretzel',
    title: 'Pretzel Warmer',
    items: [
      'Clean',
      'Stocked',
      'Log complete',
      'Product in date',
    ],
  },
  {
    id: 'nacho',
    title: 'Nacho Dispenser',
    items: [
      'Clean',
      'Stocked',
      'Log up to date',
      'Product in date',
    ],
  },
  {
    id: 'gelato',
    title: 'Gelato Case',
    items: [
      'Clean',
      'Stocked',
      'No craters in product',
      'Product fresh',
      'Log up to date',
    ],
  },
];

const TOTAL_QUESTIONS = INSPECTION_SECTIONS.reduce((t, s) => t + s.items.length, 0);

// State
let inspState = {
  answers: {},    // key: "sectionId-itemIndex" -> 'yes'|'no'|'na'
  photos:  {},    // key: "sectionId-itemIndex" -> [dataUrl, ...]
  ticket:  null,  // generated maintenance ticket
};

function inspInit(container, storeNum, storeName, sheetId, serviceAccount) {
  container.innerHTML = buildInspHTML(storeNum, storeName);
  attachInspHandlers(container, storeNum, storeName, sheetId, serviceAccount);
  updateProgress(container);
}

function buildInspHTML(storeNum, storeName) {
  const today = new Date().toISOString().split('T')[0];

  let sectionsHTML = INSPECTION_SECTIONS.map(sec => buildSection(sec)).join('');

  return `
    <div class="banner banner-info" id="followup-banner" style="display:none">
      <strong>Follow-up Required:</strong> <span id="followup-date-display"></span>
    </div>

    <div class="card">
      <div class="card-title">Inspection Details</div>
      <div class="form-grid">
        <div class="form-row">
          <label>Inspector Name</label>
          <input type="text" id="insp-inspector" placeholder="Full name">
        </div>
        <div class="form-row">
          <label>Date</label>
          <input type="date" id="insp-date" value="${today}">
        </div>
      </div>
      <div class="form-grid">
        <div class="form-row">
          <label>On Schedule</label>
          <input type="text" id="insp-schedule" placeholder="Names">
        </div>
        <div class="form-row">
          <label>Kitchen Staff</label>
          <input type="text" id="insp-kitchen" placeholder="Names">
        </div>
        <div class="form-row">
          <label>Front Staff</label>
          <input type="text" id="insp-front" placeholder="Names">
        </div>
        <div class="form-row">
          <label>Staffing Needed</label>
          <input type="text" id="insp-needed" placeholder="Positions">
        </div>
      </div>
    </div>

    <div class="sticky-sub">
      <div class="card" style="padding:10px 16px;margin-bottom:0">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px">
          <span style="font-size:13px;font-weight:600">Progress</span>
          <span id="insp-progress-label" style="font-size:13px;color:var(--muted)">0 / ${TOTAL_QUESTIONS}</span>
        </div>
        <div class="progress-wrap"><div class="progress-bar" id="insp-progress-bar" style="width:0%"></div></div>
      </div>
    </div>

    ${sectionsHTML}

    <div class="card">
      <div class="card-title">Additional Notes</div>
      <div class="form-row">
        <textarea id="insp-notes" placeholder="Any additional observations..."></textarea>
      </div>
    </div>

    <div class="btn-row">
      <button class="btn btn-primary" id="insp-save-btn">Save Inspection to Sheet</button>
      <button class="btn btn-outline" id="insp-pdf-btn">Export PDF</button>
    </div>
    <div id="insp-status" style="margin-top:10px;font-size:14px"></div>
  `;
}

function buildSection(sec) {
  const itemsHTML = sec.items.map((item, idx) => {
    const key = `${sec.id}-${idx}`;
    const special = sec.specialItems && sec.specialItems[idx];
    return `
      <div class="checklist-item" id="ci-${key}">
        <div class="item-question">${item}</div>
        <div class="yn-row">
          <button class="yn-btn yes" data-key="${key}" data-val="yes">YES</button>
          <button class="yn-btn no"  data-key="${key}" data-val="no">NO</button>
          <button class="yn-btn na"  data-key="${key}" data-val="na">N/A</button>
        </div>
        <div class="photo-area" id="photo-${key}">
          <label>Photo required for NO item</label>
          <input type="file" accept="image/*" multiple data-key="${key}">
          <div class="photo-preview-row" id="preview-${key}"></div>
        </div>
        ${special === 'maintenanceTicket' ? buildMaintenanceForm(key) : ''}
      </div>
    `;
  }).join('');

  return `
    <div class="card" id="section-${sec.id}">
      <div class="card-title">
        ${sec.title}
        <span class="section-badge pending" id="badge-${sec.id}">Pending</span>
      </div>
      ${itemsHTML}
    </div>
  `;
}

function buildMaintenanceForm(key) {
  return `
    <div class="maintenance-slide" id="maint-${key}">
      <h4>Maintenance Ticket</h4>
      <div id="maint-ticket-num-${key}"></div>
      <div class="form-grid">
        <div class="form-row">
          <label>Reported By</label>
          <input type="text" id="maint-reporter-${key}" placeholder="Your name">
        </div>
        <div class="form-row">
          <label>Priority</label>
          <select id="maint-priority-${key}">
            <option value="Normal">Normal</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </select>
        </div>
        <div class="form-row">
          <label>Equipment</label>
          <input type="text" id="maint-equip-${key}" value="Ice Cream Machine">
        </div>
      </div>
      <div class="form-row">
        <label>Issue Description</label>
        <textarea id="maint-desc-${key}" placeholder="Describe the issue in detail..."></textarea>
      </div>
      <button class="btn btn-gold btn-sm" onclick="generateTicket('${key}')">Generate Ticket</button>
    </div>
  `;
}

function attachInspHandlers(container, storeNum, storeName, sheetId, serviceAccount) {
  // YES/NO/NA buttons
  container.addEventListener('click', e => {
    const btn = e.target.closest('.yn-btn');
    if (!btn) return;

    const key = btn.dataset.key;
    const val = btn.dataset.val;

    // Clear siblings
    const row = btn.closest('.yn-row');
    row.querySelectorAll('.yn-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');

    inspState.answers[key] = val;

    // Photo area
    const photoArea = document.getElementById(`photo-${key}`);
    if (photoArea) {
      photoArea.classList.toggle('visible', val === 'no');
    }

    // Maintenance ticket (ice cream machine item 1 = index 1)
    const maintSlide = document.getElementById(`maint-${key}`);
    if (maintSlide) {
      maintSlide.classList.toggle('open', val === 'no');
      if (val === 'no') {
        const num = generateTicketNumber();
        document.getElementById(`maint-ticket-num-${key}`).innerHTML =
          `<div class="ticket-number">Ticket # ${num}</div>`;
        inspState.ticket = { number: num, key };
      }
    }

    updateProgress(container);
    updateSectionBadge(key.split('-')[0]);
  });

  // Photo uploads
  container.addEventListener('change', e => {
    const input = e.target;
    if (input.type !== 'file') return;
    const key = input.dataset.key;
    const preview = document.getElementById(`preview-${key}`);
    if (!preview) return;

    const files = Array.from(input.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        if (!inspState.photos[key]) inspState.photos[key] = [];
        inspState.photos[key].push(ev.target.result);
        const img = document.createElement('img');
        img.src = ev.target.result;
        preview.appendChild(img);
      };
      reader.readAsDataURL(file);
    });
  });

  // Follow-up date from inspection date
  const dateInput = container.querySelector('#insp-date');
  if (dateInput) {
    dateInput.addEventListener('change', updateFollowupBanner);
    updateFollowupBanner();
  }

  function updateFollowupBanner() {
    const d = container.querySelector('#insp-date');
    if (!d || !d.value) return;
    const dt = new Date(d.value + 'T12:00:00');
    dt.setDate(dt.getDate() + 7);
    const fu = dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const banner = document.getElementById('followup-banner');
    const span   = document.getElementById('followup-date-display');
    if (banner && span) {
      span.textContent = fu;
      banner.style.display = hasAnyNo() ? '' : 'none';
    }
  }

  // Save button
  const saveBtn = container.querySelector('#insp-save-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => saveInspection(storeNum, storeName, sheetId, serviceAccount, container));
  }

  // PDF button
  const pdfBtn = container.querySelector('#insp-pdf-btn');
  if (pdfBtn) {
    pdfBtn.addEventListener('click', () => exportInspectionPDF(storeNum, storeName, container));
  }
}

function updateProgress(container) {
  const answered = Object.keys(inspState.answers).length;
  const pct = Math.round((answered / TOTAL_QUESTIONS) * 100);
  const bar   = document.getElementById('insp-progress-bar');
  const label = document.getElementById('insp-progress-label');
  if (bar)   bar.style.width = pct + '%';
  if (label) label.textContent = `${answered} / ${TOTAL_QUESTIONS}`;
}

function updateSectionBadge(sectionId) {
  const sec = INSPECTION_SECTIONS.find(s => s.id === sectionId);
  if (!sec) return;
  const badge = document.getElementById(`badge-${sectionId}`);
  if (!badge) return;

  const keys = sec.items.map((_, i) => `${sectionId}-${i}`);
  const answers = keys.map(k => inspState.answers[k]);

  if (answers.every(a => a)) {
    const hasNo = answers.some(a => a === 'no');
    badge.className = `section-badge ${hasNo ? 'fail' : 'pass'}`;
    badge.textContent = hasNo ? 'Issues Found' : 'Pass';
  } else {
    badge.className = 'section-badge pending';
    badge.textContent = 'Pending';
  }
}

function hasAnyNo() {
  return Object.values(inspState.answers).some(v => v === 'no');
}

function generateTicketNumber() {
  return 'MNT-' + String(Math.floor(100000 + Math.random() * 900000));
}

window.generateTicket = function(key) {
  const reporter = document.getElementById(`maint-reporter-${key}`)?.value || '';
  const priority = document.getElementById(`maint-priority-${key}`)?.value || 'Normal';
  const equip    = document.getElementById(`maint-equip-${key}`)?.value || '';
  const desc     = document.getElementById(`maint-desc-${key}`)?.value || '';
  if (!desc.trim()) { alert('Please enter an issue description.'); return; }

  const ticketEl = document.getElementById(`maint-ticket-num-${key}`);
  let num = inspState.ticket?.number;
  if (!num) { num = generateTicketNumber(); }
  inspState.ticket = { number: num, reporter, priority, equip, desc, key };
  if (ticketEl) ticketEl.innerHTML = `<div class="ticket-number">Ticket # ${num}</div>`;
  alert(`Maintenance ticket ${num} generated.\nPriority: ${priority}\nEquipment: ${equip}`);
};

function calcScore() {
  const vals = Object.values(inspState.answers);
  const yes  = vals.filter(v => v === 'yes').length;
  const no   = vals.filter(v => v === 'no').length;
  const na   = vals.filter(v => v === 'na').length;
  const total = vals.length;
  const scoreable = yes + no;
  const pct = scoreable > 0 ? Math.round((yes / scoreable) * 100) : 0;
  return { yes, no, na, total, pct };
}

function collectNoItems() {
  const items = [];
  INSPECTION_SECTIONS.forEach(sec => {
    sec.items.forEach((item, idx) => {
      const key = `${sec.id}-${idx}`;
      if (inspState.answers[key] === 'no') {
        items.push(`${sec.title}: ${item}`);
      }
    });
  });
  return items;
}

async function saveInspection(storeNum, storeName, sheetId, serviceAccount, container) {
  const btn = document.getElementById('insp-save-btn');
  const status = document.getElementById('insp-status');

  const inspector = container.querySelector('#insp-inspector')?.value?.trim();
  const date      = container.querySelector('#insp-date')?.value;
  const notes     = container.querySelector('#insp-notes')?.value?.trim() || '';

  if (!inspector) { alert('Please enter inspector name.'); return; }
  if (!date)      { alert('Please select a date.'); return; }
  if (!sheetId)   { status.textContent = 'Error: Sheet ID not configured for this store.'; return; }

  btn.disabled = true;
  btn.textContent = 'Saving...';
  status.textContent = '';

  const { yes, no, na, total, pct } = calcScore();
  const noItems = collectNoItems();

  const followup = (() => {
    const dt = new Date(date + 'T12:00:00');
    dt.setDate(dt.getDate() + 7);
    return dt.toLocaleDateString('en-US');
  })();

  const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const statusVal = no > 0 ? 'Needs Follow-up' : 'Clear';

  const row = [
    storeNum,
    storeName,
    date,
    time,
    inspector,
    `${pct}%`,
    yes,
    no,
    na,
    total,
    followup,
    statusVal,
    noItems.join(' | '),
    notes,
  ];

  try {
    await sheetsEnsureHeaders(serviceAccount, sheetId, 'Inspections', [
      'Store #','Store Name','Date','Time','Inspector','Score %',
      'YES','NO','N/A','Total','Follow-up Date','Status','NO Items','Notes',
    ]);
    await sheetsAppend(serviceAccount, sheetId, 'Inspections!A1', [row]);
    status.innerHTML = '<span style="color:var(--green)">Inspection saved successfully.</span>';
  } catch (err) {
    status.innerHTML = `<span style="color:var(--red)">Error: ${err.message}</span>`;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save Inspection to Sheet';
  }
}

function safeText(str) {
  // Strip non-latin / emoji characters for jsPDF
  return String(str || '').replace(/[^\x00-\xFF]/g, '').trim();
}

function exportInspectionPDF(storeNum, storeName, container) {
  if (typeof jspdf === 'undefined' && typeof window.jspdf === 'undefined') {
    alert('jsPDF not loaded. Check your internet connection and reload.');
    return;
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });

  const inspector = container.querySelector('#insp-inspector')?.value || '';
  const date      = container.querySelector('#insp-date')?.value || '';
  const notes     = container.querySelector('#insp-notes')?.value || '';
  const { yes, no, na, pct } = calcScore();
  const noItems = collectNoItems();

  const followup = (() => {
    if (!date) return '';
    const dt = new Date(date + 'T12:00:00');
    dt.setDate(dt.getDate() + 7);
    return dt.toLocaleDateString('en-US');
  })();

  let y = 40;
  const L = 40;
  const W = 532;

  // Header block
  doc.setFillColor(26, 39, 68);
  doc.rect(L, y, W, 60, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(safeText("Keith's Superdeli"), L + 12, y + 22);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(safeText(`Food Safety Inspection Report`), L + 12, y + 38);
  doc.text(safeText(`Store #${storeNum} - ${storeName}`), L + 12, y + 52);
  y += 70;

  // Follow-up banner if NOs present
  if (no > 0) {
    doc.setFillColor(254, 226, 226);
    doc.rect(L, y, W, 24, 'F');
    doc.setTextColor(153, 27, 27);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(safeText(`FOLLOW-UP REQUIRED BY: ${followup}`), L + 8, y + 16);
    y += 32;
  }

  // Summary row
  doc.setTextColor(26, 39, 68);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(safeText(`Date: ${date}   Inspector: ${inspector}   Score: ${pct}%   YES: ${yes}   NO: ${no}   N/A: ${na}`), L, y);
  y += 20;

  doc.setDrawColor(200, 168, 75);
  doc.setLineWidth(1.5);
  doc.line(L, y, L + W, y);
  y += 12;

  // Sections
  INSPECTION_SECTIONS.forEach(sec => {
    if (y > 680) { doc.addPage(); y = 40; }

    doc.setFillColor(26, 39, 68);
    doc.rect(L, y, W, 18, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(safeText(sec.title), L + 6, y + 13);
    y += 22;

    sec.items.forEach((item, idx) => {
      if (y > 700) { doc.addPage(); y = 40; }
      const key = `${sec.id}-${idx}`;
      const ans = inspState.answers[key] || '--';
      const color = ans === 'yes' ? [22, 163, 74] : ans === 'no' ? [220, 38, 38] : [107, 114, 128];

      doc.setTextColor(...color);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(safeText(ans.toUpperCase()), L + 4, y + 10);

      doc.setTextColor(26, 26, 26);
      doc.setFont('helvetica', 'normal');
      doc.text(safeText(item), L + 36, y + 10, { maxWidth: W - 40 });
      y += 16;
    });
    y += 6;
  });

  // Action list
  if (noItems.length > 0) {
    if (y > 600) { doc.addPage(); y = 40; }
    doc.setFillColor(254, 226, 226);
    doc.rect(L, y, W, 18, 'F');
    doc.setTextColor(153, 27, 27);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(safeText('ACTION REQUIRED'), L + 6, y + 13);
    y += 22;

    noItems.forEach((item, i) => {
      if (y > 720) { doc.addPage(); y = 40; }
      doc.setTextColor(26, 26, 26);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(safeText(`${i + 1}. ${item}`), L + 6, y + 10, { maxWidth: W - 12 });
      y += 16;
    });
    y += 10;
  }

  // Maintenance ticket
  if (inspState.ticket) {
    if (y > 640) { doc.addPage(); y = 40; }
    doc.setFillColor(255, 251, 235);
    doc.rect(L, y, W, 60, 'F');
    doc.setDrawColor(217, 119, 6);
    doc.rect(L, y, W, 60);
    doc.setTextColor(217, 119, 6);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(safeText(`MAINTENANCE TICKET: ${inspState.ticket.number}`), L + 8, y + 14);
    doc.setTextColor(26, 26, 26);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(safeText(`Priority: ${inspState.ticket.priority || ''}   Equipment: ${inspState.ticket.equip || ''}`), L + 8, y + 28);
    doc.text(safeText(`Issue: ${inspState.ticket.desc || ''}`), L + 8, y + 42, { maxWidth: W - 16 });
    y += 70;
  }

  // Notes
  if (notes.trim()) {
    if (y > 660) { doc.addPage(); y = 40; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(26, 39, 68);
    doc.text(safeText('Additional Notes:'), L, y);
    y += 14;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(26, 26, 26);
    const noteLines = doc.splitTextToSize(safeText(notes), W);
    doc.text(noteLines, L, y);
    y += noteLines.length * 12 + 10;
  }

  // Signature lines
  if (y > 680) { doc.addPage(); y = 40; }
  y += 20;
  doc.setDrawColor(26, 39, 68);
  doc.setLineWidth(1);
  doc.line(L, y, L + 200, y);
  doc.line(L + 260, y, L + 460, y);
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.setFont('helvetica', 'normal');
  doc.text(safeText('Inspector Signature'), L, y + 12);
  doc.text(safeText('Manager Signature'), L + 260, y + 12);

  // Page numbers
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'normal');
    doc.text(safeText(`Page ${p} of ${pageCount}`), L + W - 48, 775);
  }

  doc.save(safeText(`Inspection_Store${storeNum}_${date}.pdf`));
}
