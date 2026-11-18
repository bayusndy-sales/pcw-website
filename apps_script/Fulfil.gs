/* PCW Fulfilment: vendor booking workflow for the ops team.
   Needs helpers from Admin.gs / Admin2.gs / Auth.gs: audit_, dt_, a2Rows_, a2Last_, uGet_, num6_, mailTo_, emailOk_, pRound_, sess_.
   Stages: To assign > To book > Requested (only channels that need a request) > Booked (vendor AWB created) > Confirmed (pickup / drop-off confirmed). */
const FUL_HDR = ['PCW_Ref', 'Channel', 'Stage', 'PCW_AWB_Done', 'Req_Sent_At', 'Req_Sent_By', 'Booked_At', 'Booked_By', 'Vendor_AWB', 'Vendor_Booking_Ref', 'Pickup_Date', 'Pickup_Window', 'Confirmed_At', 'Confirmed_By', 'Cost_IDR', 'Issue', 'Vendor_Notes', 'Updated_At', 'Updated_By', 'Created_At', 'Pickup_Code', 'AWB_File_Id', 'AWB_File_Name'];
const FUL_CH = {
  DHL_OWN: { label: 'DHL (own account)', src: 'DHL', req: false },
  FEDEX_OWN: { label: 'FedEx (own account)', src: 'FedEx', req: false },
  FEDEX_ICCL: { label: 'FedEx via ICCL', src: 'ICCL', req: true },
  MARS: { label: 'Mars', src: 'Mars', req: true }
};
const FUL_ORDER = ['To assign', 'To book', 'Requested', 'Booked', 'Confirmed'];

function ops_(b) { const u = sess_(b.token); return u && (u.role === 'SuperAdmin' || u.role === 'Ops') ? u : null; }
function fSheet_() {
  const ss = SpreadsheetApp.getActive(); let sh = ss.getSheetByName('Fulfilment');
  if (!sh) { sh = ss.insertSheet('Fulfilment'); sh.getRange(1, 1, 1, FUL_HDR.length).setValues([FUL_HDR]).setFontWeight('bold'); sh.setFrozenRows(1); }
  else if (sh.getLastColumn() < FUL_HDR.length) { sh.getRange(1, 1, 1, FUL_HDR.length).setValues([FUL_HDR]).setFontWeight('bold'); }
  return sh;
}
function fRows_() {
  const sh = fSheet_(); const n = sh.getLastRow(); const rows = n < 2 ? [] : sh.getRange(2, 1, n - 1, FUL_HDR.length).getValues(); const map = {};
  rows.forEach(function (r, i) { if (r[0]) map[String(r[0]).toUpperCase()] = { row: i + 2, v: r }; });
  return { sh: sh, map: map };
}
function fObj_(v) { const o = {}; FUL_HDR.forEach(function (h, i) { o[h] = v && v[i] instanceof Date ? dt_(v[i]) : (v ? v[i] : ''); }); if (!o.Stage) o.Stage = 'To assign'; return o; }
function fDate_(v) { return v instanceof Date ? Utilities.formatDate(v, TZ, 'yyyy-MM-dd') : String(v || '').slice(0, 10); }
function fMs_(v) { return v instanceof Date ? v.getTime() : (Date.parse(String(v)) || 0); }

function ulList_(b) {
  if (!ops_(b)) return { ok: false, error: 'session' };
  const d = a2Rows_(), st = a2Last_(), f = fRows_(), H = d.hdr;
  const ix = function (n) { return H.indexOf(n); };
  const items = d.rows.filter(function (r) { return r[0]; }).reverse().slice(0, 400).map(function (r) {
    const k = String(r[0]).toUpperCase(), fo = f.map[k] ? f.map[k].v : null, o = fObj_(fo);
    const cancelled = st[k] && st[k].s === 'Cancelled', delivered = st[k] && (st[k].s === 'Delivered' || st[k].s === 'Returned');
    const stage = cancelled ? 'Cancelled' : o.Stage;
    let since = fMs_(r[ix('Submitted_At')]);
    if (stage === 'Requested') since = fMs_(fo && fo[4]) || since; else if (stage === 'Booked') since = fMs_(fo && fo[6]) || since; else if (stage === 'Confirmed') since = fMs_(fo && fo[12]) || since;
    return {
      ref: r[0], submitted: fMs_(r[ix('Submitted_At')]), date: dt_(r[ix('Submitted_At')]), product: r[ix('Product')], dest: r[ix('Dest_Country')], pieces: r[ix('Pieces')], kg: r[ix('Actual_Kg')], chg: r[ix('Chargeable_Kg')],
      customer: String(r[ix('Shipper_Company')] || r[ix('Shipper_Name')]), mode: r[ix('Pickup_or_Dropoff')], pickup_req: fDate_(r[ix('Pickup_Date')]), pickup_city: r[ix('Pickup_City')], to: String(r[ix('Consignee_Name')]),
      status: st[k] ? st[k].s : 'Booking request', stage: stage, channel: o.Channel, vendor_awb: o.Vendor_AWB, vendor_ref: o.Vendor_Booking_Ref, pickup_conf: fDate_(o.Pickup_Date), window: o.Pickup_Window,
      issue: o.Issue, has_file: !!o.AWB_File_Id, code: o.Pickup_Code, awb_done: o.PCW_AWB_Done === 'Y', since: since, done: !!delivered
    };
  });
  return { ok: true, items: items, channels: FUL_CH };
}

function ulGet_(b) {
  const u = ops_(b); if (!u) return { ok: false, error: 'session' };
  const ref = String(b.ref || '').trim().toUpperCase(); const d = a2Rows_(); let row = null;
  d.rows.forEach(function (r) { if (String(r[0]).toUpperCase() === ref) row = r; }); if (!row) return { ok: false, error: 'not_found' };
  const f = {}; d.hdr.forEach(function (h, i) { if (h) f[h] = row[i] instanceof Date ? dt_(row[i]) : row[i]; });
  const sell = num_(f.Final_Price_IDR) > 0 ? num_(f.Final_Price_IDR) : num_(f.Est_Total_IDR);
  if (u.role !== 'SuperAdmin') { delete f.Est_Total_IDR; delete f.Final_Price_IDR; }
  const fr = fRows_().map[ref];
  const ev = []; sh_(TABS.track).getDataRange().getValues().forEach(function (r, i) { if (i > 0 && String(r[0]).toUpperCase() === ref) ev.push({ time: dt_(r[1]) || String(r[1]), status: r[2], note: r[5], by: r[6] }); });
  const fo = fObj_(fr ? fr.v : null); const cst = num_(fo.Cost_IDR);
  const margin = u.role === 'SuperAdmin' ? { price: sell, cost: cst, gp: sell > 0 && cst > 0 ? Math.round(sell - cst) : null, pct: sell > 0 && cst > 0 ? Math.round((sell - cst) / sell * 1000) / 10 : null } : null;
  return { ok: true, fields: f, ful: fo, events: ev, channels: FUL_CH, role: u.role, margin: margin };
}

function ordSync_(ref, kv) {
  const sh = sh_(TABS.orders); const n = sh.getLastRow(); if (n < 2) return;
  const hdr = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0]; const refs = sh.getRange(2, 1, n - 1, 1).getValues();
  let rowNo = 0; for (let i = 0; i < refs.length; i++) { if (String(refs[i][0]).toUpperCase() === ref) { rowNo = i + 2; break; } }
  if (!rowNo) return;
  Object.keys(kv).forEach(function (k) { const c = hdr.indexOf(k) + 1; if (c > 0) sh.getRange(rowNo, c).setValue(kv[k]); });
}
function trackAdd_(ref, status, note, by) { sh_(TABS.track).appendRow([ref, new Date(), status, '', '', safe_(note, 200), by]); }
function trackHas_(ref, statuses) { return sh_(TABS.track).getDataRange().getValues().some(function (r, i) { return i > 0 && String(r[0]).toUpperCase() === ref && statuses.indexOf(String(r[2])) > -1; }); }

function ulAct_(b) {
  const u = ops_(b); if (!u) return { ok: false, error: 'session' };
  const ref = String(b.ref || '').trim().toUpperCase(), op = String(b.op || '');
  if (!/^[A-Z0-9-]{6,40}$/.test(ref)) return { ok: false, error: 'invalid' };
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const d = a2Rows_(); let bk = null; const H = d.hdr;
    d.rows.forEach(function (r) { if (String(r[0]).toUpperCase() === ref) bk = r; }); if (!bk) return { ok: false, error: 'not_found' };
    const mode = String(bk[H.indexOf('Pickup_or_Dropoff')] || '');
    const f = fRows_(); let cur = f.map[ref]; let rowNo;
    if (!cur) { rowNo = f.sh.getLastRow() + 1; const nv = FUL_HDR.map(function () { return ''; }); nv[0] = ref; nv[2] = 'To assign'; nv[19] = new Date(); f.sh.getRange(rowNo, 1, 1, FUL_HDR.length).setValues([nv]); cur = { row: rowNo, v: nv }; }
    rowNo = cur.row; const o = fObj_(cur.v); const now = new Date(), who = u.email.split('@')[0];
    const set = function (name, val) { f.sh.getRange(rowNo, FUL_HDR.indexOf(name) + 1).setValue(val); };
    const stageIdx = FUL_ORDER.indexOf(o.Stage); const ch = FUL_CH[o.Channel];
    let detail = '';
    if (op === 'assign') {
      if (stageIdx >= 3) return { ok: false, error: 'locked' };
      const c = String(b.channel || ''); if (!FUL_CH[c]) return { ok: false, error: 'invalid' };
      set('Channel', c); set('Stage', 'To book'); detail = c;
    } else if (op === 'awb_done') {
      set('PCW_AWB_Done', b.value === 'Y' ? 'Y' : ''); detail = 'pcw_awb ' + (b.value === 'Y' ? 'done' : 'undone');
    } else if (op === 'requested') {
      if (!ch) return { ok: false, error: 'need_channel' }; if (!ch.req) return { ok: false, error: 'not_needed' }; if (stageIdx > 2) return { ok: false, error: 'locked' };
      set('Req_Sent_At', now); set('Req_Sent_By', who); set('Stage', 'Requested'); detail = 'request sent via ' + o.Channel;
    } else if (op === 'booked') {
      if (!ch) return { ok: false, error: 'need_channel' }; if (stageIdx < 1) return { ok: false, error: 'need_channel' }; if (stageIdx > 3) return { ok: false, error: 'locked' };
      const awb = String(b.vendor_awb || '').trim(); if (!/^[A-Za-z0-9][A-Za-z0-9 \-\/]{4,39}$/.test(awb)) return { ok: false, error: 'invalid_awb' };
      const key = awb.replace(/[ \-\/]/g, '').toUpperCase(); let dup = '';
      Object.keys(f.map).forEach(function (k) { if (k !== ref && String(f.map[k].v[8]).replace(/[ \-\/]/g, '').toUpperCase() === key) dup = k; });
      if (dup) return { ok: false, error: 'duplicate_awb', ref: dup };
      const cost = num_(String(b.cost || '').replace(/[^0-9.]/g, ''));
      set('Vendor_AWB', awb); set('Vendor_Booking_Ref', safe_(b.vendor_ref, 60)); if (cost > 0) set('Cost_IDR', cost);
      if (stageIdx < 3) { set('Booked_At', now); set('Booked_By', who); set('Stage', 'Booked'); }
      const kv = { Source_INTERNAL: ch.src, Network_Tracking_No: awb, Handled_By: who }; if (cost > 0) kv.Cost_IDR = cost;
      const sell = num_(bk[H.indexOf('Final_Price_IDR')]) > 0 ? num_(bk[H.indexOf('Final_Price_IDR')]) : num_(bk[H.indexOf('Est_Total_IDR')]);
      if (cost > 0 && sell > 0) { kv.Total_IDR = sell; kv.GP_IDR = Math.round(sell - cost); kv.GP_Pct = Math.round((sell - cost) / sell * 1000) / 10; }
      ordSync_(ref, kv);
      if (!trackHas_(ref, ['Booked', 'Paid'])) trackAdd_(ref, 'Booked', '', u.email);
      detail = 'vendor awb ' + awb;
    } else if (op === 'confirm') {
      if (stageIdx < 3) return { ok: false, error: 'need_booked' };
      const pd = String(b.pickup_date || '').trim(); const win = safe_(b.window, 40); const code = safe_(b.pickup_code, 60);
      if (mode === 'Pickup') { if (!/^\d{4}-\d{2}-\d{2}$/.test(pd)) return { ok: false, error: 'need_date' }; if (!code) return { ok: false, error: 'need_code' }; }
      else if (pd && !/^\d{4}-\d{2}-\d{2}$/.test(pd)) return { ok: false, error: 'need_date' };
      if (!o.AWB_File_Id) return { ok: false, error: 'need_file' };
      const awb2 = String(b.vendor_awb || '').trim();
      if (awb2 && awb2 !== String(o.Vendor_AWB)) {
        if (!/^[A-Za-z0-9][A-Za-z0-9 \-\/]{4,39}$/.test(awb2)) return { ok: false, error: 'invalid_awb' };
        const key2 = awb2.replace(/[ \-\/]/g, '').toUpperCase(); let dup2 = '';
        Object.keys(f.map).forEach(function (k) { if (k !== ref && String(f.map[k].v[8]).replace(/[ \-\/]/g, '').toUpperCase() === key2) dup2 = k; });
        if (dup2) return { ok: false, error: 'duplicate_awb', ref: dup2 };
        set('Vendor_AWB', awb2); ordSync_(ref, { Network_Tracking_No: awb2 });
      }
      set('Pickup_Date', pd); set('Pickup_Window', win); set('Pickup_Code', code);
      if (stageIdx === 3) { set('Confirmed_At', now); set('Confirmed_By', who); set('Stage', 'Confirmed'); }
      if (mode === 'Pickup') {
        ordSync_(ref, { Pickup_Date: pd, Status: 'Pickup scheduled' });
        if (stageIdx === 3 || fDate_(cur.v[10]) !== pd || !trackHas_(ref, ['Pickup scheduled'])) trackAdd_(ref, 'Pickup scheduled', 'Pickup ' + pd + (win ? ' ' + win : ''), u.email);
      } else ordSync_(ref, { Status: 'Booked' });
      detail = 'completed: pickup ' + pd + ' ' + win + ' code ' + (code ? 'set' : 'none') + ' file ' + o.AWB_File_Name;
    } else if (op === 'issue') {
      const t = safe_(b.text, 250); if (!t) return { ok: false, error: 'invalid' };
      set('Issue', t); detail = 'issue: ' + t;
      mailTo_(settings_().Notify_Email, 'PCW ops issue ' + ref, ref + ' flagged by ' + u.email + ':\n' + t + '\nStage: ' + o.Stage + ' / Channel: ' + (o.Channel || '-'));
    } else if (op === 'clear_issue') {
      set('Issue', ''); detail = 'issue cleared';
    } else if (op === 'note') {
      const t = safe_(b.text, 250); if (!t) return { ok: false, error: 'invalid' };
      const cv = String(o.Vendor_Notes || ''); set('Vendor_Notes', (cv ? cv + ' | ' : '') + '[' + Utilities.formatDate(now, TZ, 'MM-dd HH:mm') + ' ' + who + '] ' + t); detail = 'note';
    } else if (op === 'back') {
      if (stageIdx <= 0) return { ok: false, error: 'invalid' };
      let ns = FUL_ORDER[stageIdx - 1]; if (ns === 'Requested' && (!ch || !ch.req)) ns = 'To book';
      set('Stage', ns); detail = o.Stage + ' -> ' + ns + ' (public tracking events are not removed; fix them in Bookings if needed)';
    } else return { ok: false, error: 'invalid' };
    set('Updated_At', now); set('Updated_By', who);
    audit_(u, 'ful_' + op, ref + ' ' + detail);
    return { ok: true };
  } finally { lock.releaseLock(); }
}


/* ---- vendor AWB file (private Drive folder; ops download through the API, never a public link) ---- */
const FUL_MAX_BYTES = 4 * 1024 * 1024;
const FUL_MIME = { 'application/pdf': 'pdf', 'image/png': 'png', 'image/jpeg': 'jpg' };
function fFolder_() { const it = DriveApp.getFoldersByName('PCW Vendor AWB'); return it.hasNext() ? it.next() : DriveApp.createFolder('PCW Vendor AWB'); }
function ulUpload_(b) {
  const u = ops_(b); if (!u) return { ok: false, error: 'session' };
  const ref = String(b.ref || '').trim().toUpperCase(); if (!/^[A-Z0-9-]{6,40}$/.test(ref)) return { ok: false, error: 'invalid' };
  const mime = String(b.mime || ''); const ext = FUL_MIME[mime]; if (!ext) return { ok: false, error: 'bad_type' };
  let bytes; try { bytes = Utilities.base64Decode(String(b.data || '')); } catch (e) { return { ok: false, error: 'invalid' }; }
  if (!bytes.length || bytes.length > FUL_MAX_BYTES) return { ok: false, error: 'too_big' };
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const f = fRows_(); const cur = f.map[ref]; if (!cur) return { ok: false, error: 'not_found' };
    const o = fObj_(cur.v); if (FUL_ORDER.indexOf(o.Stage) < 3) return { ok: false, error: 'need_booked' };
    const safeName = ref + '_vendor_awb_' + Utilities.formatDate(new Date(), TZ, 'yyyyMMdd_HHmm') + '.' + ext;
    const file = fFolder_().createFile(Utilities.newBlob(bytes, mime, safeName));
    if (o.AWB_File_Id) { try { DriveApp.getFileById(String(o.AWB_File_Id)).setTrashed(true); } catch (e) {} }
    const set = function (name, val) { f.sh.getRange(cur.row, FUL_HDR.indexOf(name) + 1).setValue(val); };
    set('AWB_File_Id', file.getId()); set('AWB_File_Name', safeName); set('Updated_At', new Date()); set('Updated_By', u.email.split('@')[0]);
    audit_(u, 'ful_upload', ref + ' ' + safeName + ' ' + bytes.length + ' bytes'); return { ok: true, name: safeName };
  } finally { lock.releaseLock(); }
}
function ulFile_(b) {
  const u = ops_(b); if (!u) return { ok: false, error: 'session' };
  const ref = String(b.ref || '').trim().toUpperCase(); const cur = fRows_().map[ref]; if (!cur) return { ok: false, error: 'not_found' };
  const o = fObj_(cur.v); if (!o.AWB_File_Id) return { ok: false, error: 'no_file' };
  let blob; try { blob = DriveApp.getFileById(String(o.AWB_File_Id)).getBlob(); } catch (e) { return { ok: false, error: 'no_file' }; }
  audit_(u, 'ful_file_view', ref); return { ok: true, name: String(o.AWB_File_Name), mime: blob.getContentType(), data: Utilities.base64Encode(blob.getBytes()) };
}

/* ---- team (Ops accounts) ---- */
function ulStaffList_(b) {
  if (!adm_(b)) return { ok: false, error: 'session' };
  return { ok: true, items: sh_('Portal_Users').getDataRange().getValues().slice(1).filter(function (r) { return r[0] && (r[10] === 'SuperAdmin' || r[10] === 'Ops'); }).map(function (r) { return { email: String(r[0]), name: String(r[2]), role: String(r[10]), status: String(r[5]), last: dt_(r[8]) }; }) };
}
function ulStaffAdd_(b) {
  const a = adm_(b); if (!a) return { ok: false, error: 'session' };
  const email = String(b.email || '').trim().toLowerCase(), name = safe_(b.name, 80);
  if (!emailOk_(email) || !name) return { ok: false, error: 'missing_fields' };
  if (uGet_(email)) return { ok: false, error: 'exists' };
  const salt = Utilities.getUuid();
  sh_('Portal_Users').appendRow([email, 'PCW Operations', name, salt, pRound_(salt, Utilities.getUuid(), 'v2'), 'Active', '', new Date(), '', 'Ops account created by ' + a.email, 'Ops', '', 'v2']);
  const code = num6_(); CacheService.getScriptCache().put('rs_' + email, code, 86400);
  mailTo_(email, 'Your PCW Operations account', 'An Operations account was created for you.\nGo to https://pcwfreight.com/admin.html, choose "Set or reset password", enter this email and the code ' + code + ' (valid 24 hours) to set your password. Every sign-in needs a 6-digit code sent to this email.');
  audit_(a, 'staff_add', email + ' role=Ops'); return { ok: true };
}
function ulStaffSet_(b) {
  const a = adm_(b); if (!a) return { ok: false, error: 'session' };
  const email = String(b.email || '').trim().toLowerCase(), st = String(b.status || ''); const u = uGet_(email);
  if (!u || u.role !== 'Ops' || ['Active', 'Disabled'].indexOf(st) < 0) return { ok: false, error: 'invalid' };
  u.sh.getRange(u.row, 6).setValue(st); audit_(a, 'staff_set', email + ' ' + st); return { ok: true };
}
function ulRoute_(b) {
  switch (b.action) {
    case 'ful_list': return ulList_(b); case 'ful_get': return ulGet_(b); case 'ful_act': return ulAct_(b); case 'ful_upload': return ulUpload_(b); case 'ful_file': return ulFile_(b);
    case 'staff_list': return ulStaffList_(b); case 'staff_add': return ulStaffAdd_(b); case 'staff_set': return ulStaffSet_(b);
  }
  return null;
}
