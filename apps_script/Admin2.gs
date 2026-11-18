/* PCW Admin v2: stats, booking edit, tracking correction, customer management, invoices, audit, settings (read-only). Requires Admin.gs helpers: adm_, audit_, dt_ and Auth.gs helpers: uGet_, num6_, mailTo_, emailOk_. */
function a2Last_() { const st = {}; sh_(TABS.track).getDataRange().getValues().slice(1).forEach(function (r) { if (r[0] && r[2]) { const t = r[1] instanceof Date ? r[1].getTime() : 0; const k = String(r[0]).toUpperCase(); if (!st[k] || t >= st[k].t) st[k] = { t: t, s: String(r[2]) }; } }); return st; }
function a2Rows_() { const sh = sh_(TABS.web); const n = sh.getLastRow(); const cols = Math.max(35, sh.getLastColumn()); const hdr = sh.getRange(1, 1, 1, cols).getValues()[0]; const rows = n < 2 ? [] : sh.getRange(2, 1, n - 1, cols).getValues(); return { sh: sh, hdr: hdr, rows: rows }; }
function a2Fin_(sh) { const h = sh.getRange(1, 1, 1, Math.max(35, sh.getLastColumn())).getValues()[0]; let c = h.indexOf('Final_Price_IDR'); if (c < 0) { c = 34; sh.getRange(1, 35).setValue('Final_Price_IDR'); } return c + 1; }
function a2Time_(v) { return v instanceof Date ? v.getTime() : (Date.parse(String(v)) || 0); }
function admStats_(b) {
  if (!adm_(b)) return { ok: false, error: 'session' };
  const d = a2Rows_(); const st = a2Last_(); const byS = {}, byD = {}, byP = {}; let est = 0, c30 = 0, e30 = 0; const cut = Date.now() - 30 * 864e5;
  d.rows.forEach(function (r) { if (!r[0]) return; const s = st[String(r[0]).toUpperCase()] ? st[String(r[0]).toUpperCase()].s : 'Booking request'; byS[s] = (byS[s] || 0) + 1; byD[r[5]] = (byD[r[5]] || 0) + 1; byP[r[3]] = (byP[r[3]] || 0) + 1; const pr = (num_(r[34]) > 0 ? num_(r[34]) : num_(r[29])) || 0; if (s !== 'Cancelled') { est += pr; if (a2Time_(r[1]) >= cut) { c30++; e30 += pr; } } });
  const us = sh_('Portal_Users').getDataRange().getValues().slice(1).filter(function (r) { return r[0]; }); const uc = {}; us.forEach(function (r) { const s = String(r[5]); uc[s] = (uc[s] || 0) + 1; });
  let out = 0, nInv = 0; try { sh_('Receivables').getDataRange().getValues().slice(1).forEach(function (r) { if (r[0] && String(r[7]) !== 'Paid') { out += num_(r[4]) || 0; nInv++; } }); } catch (e) {}
  return { ok: true, total: d.rows.filter(function (r) { return r[0]; }).length, by_status: byS, by_dest: byD, by_product: byP, est_total: Math.round(est), count_30d: c30, est_30d: Math.round(e30), users: uc, outstanding: Math.round(out), open_invoices: nInv };
}
function admBookingsAll_(b) {
  if (!adm_(b)) return { ok: false, error: 'session' };
  const d = a2Rows_(); const st = a2Last_();
  return { ok: true, items: d.rows.filter(function (r) { return r[0]; }).reverse().slice(0, 500).map(function (r) { const k = String(r[0]).toUpperCase(); return { ref: r[0], date: dt_(r[1]) || String(r[1]), product: r[3], dest: r[5], pieces: r[6], kg: r[7], chg: r[9], contents: r[10], shipper: String(r[12]), company: String(r[13]), email: String(r[14]), to: String(r[22]) + (r[23] ? ' / ' + r[23] : ''), est: r[29], final: r[34] || '', notes: r[33], status: st[k] ? st[k].s : 'Booking request' }; }) };
}
function admBookingGet_(b) {
  if (!adm_(b)) return { ok: false, error: 'session' };
  const ref = String(b.ref || '').trim().toUpperCase(); const d = a2Rows_(); let row = null;
  d.rows.forEach(function (r) { if (String(r[0]).toUpperCase() === ref) row = r; }); if (!row) return { ok: false, error: 'not_found' };
  const f = {}; d.hdr.forEach(function (h, i) { if (h) f[h] = row[i] instanceof Date ? dt_(row[i]) : row[i]; });
  const ev = []; sh_(TABS.track).getDataRange().getValues().forEach(function (r, i) { if (i > 0 && String(r[0]).toUpperCase() === ref) ev.push({ row: i + 1, time: dt_(r[1]) || String(r[1]), status: r[2], location: r[3], est: r[4], note: r[5], by: r[6] }); });
  return { ok: true, fields: f, events: ev };
}
function admBookingEdit_(b) {
  const a = adm_(b); if (!a) return { ok: false, error: 'session' };
  const ref = String(b.ref || '').trim().toUpperCase(); const d = a2Rows_(); let idx = -1;
  d.rows.forEach(function (r, i) { if (String(r[0]).toUpperCase() === ref) idx = i; }); if (idx < 0) return { ok: false, error: 'not_found' };
  const NUM = { actual_kg: 'Actual_Kg', pieces: 'Pieces', chargeable_kg: 'Chargeable_Kg', declared_value: 'Declared_Value', final_price: 'Final_Price_IDR' };
  const TXT = { dims: 'Dims_cm', contents: 'Contents', consignee_name: 'Consignee_Name', consignee_company: 'Consignee_Company', consignee_address: 'Consignee_Address', consignee_city: 'Consignee_City', consignee_postcode: 'Consignee_Postcode', consignee_phone: 'Consignee_Phone', consignee_email: 'Consignee_Email' };
  const rowNo = idx + 2; const changed = []; let finCol = null;
  Object.keys(NUM).forEach(function (k) { if (b[k] === undefined || b[k] === null || String(b[k]).trim() === '') return; const v = num_(String(b[k]).replace(/[^0-9.\-]/g, '')); if (!(v >= 0) || v > 1e10) return; let col = d.hdr.indexOf(NUM[k]) + 1; if (NUM[k] === 'Final_Price_IDR') col = a2Fin_(d.sh); if (col > 0) { d.sh.getRange(rowNo, col).setValue(v); changed.push(k + '=' + v); } });
  Object.keys(TXT).forEach(function (k) { if (b[k] === undefined || b[k] === null) return; const col = d.hdr.indexOf(TXT[k]) + 1; if (col > 0) { d.sh.getRange(rowNo, col).setValue(safe_(b[k], 300)); changed.push(k); } });
  if (b.notes_add && String(b.notes_add).trim()) { const nc = d.hdr.indexOf('Notes') + 1; const cur = String(d.sh.getRange(rowNo, nc).getValue() || ''); d.sh.getRange(rowNo, nc).setValue((cur ? cur + ' | ' : '') + '[' + Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd') + ' ' + a.email.split('@')[0] + '] ' + safe_(b.notes_add, 250)); changed.push('notes'); }
  if (!changed.length) return { ok: false, error: 'nothing_to_change' };
  audit_(a, 'booking_edit', ref + ' ' + changed.join(',')); return { ok: true };
}
function admTrackDel_(b) {
  const a = adm_(b); if (!a) return { ok: false, error: 'session' };
  const ref = String(b.ref || '').trim().toUpperCase(); const row = parseInt(b.row, 10); const sh = sh_(TABS.track);
  if (!(row > 1) || row > sh.getLastRow()) return { ok: false, error: 'invalid' };
  const r = sh.getRange(row, 1, 1, 7).getValues()[0]; if (String(r[0]).toUpperCase() !== ref) return { ok: false, error: 'invalid' };
  sh.deleteRow(row); audit_(a, 'track_delete', ref + ' removed ' + r[2]); return { ok: true };
}
function admUserEdit_(b) {
  const a = adm_(b); if (!a) return { ok: false, error: 'session' };
  const u = uGet_(String(b.email || '').trim().toLowerCase()); if (!u) return { ok: false, error: 'not_found' };
  const company = safe_(b.company, 120), name = safe_(b.name, 80), phone = normPhone_(b.phone);
  if (!company || !name) return { ok: false, error: 'missing_fields' };
  u.sh.getRange(u.row, 2, 1, 2).setValues([[company, name]]); if (phone && phone.length >= 9) u.sh.getRange(u.row, 12).setValue("'" + phone);
  if (b.notes !== undefined) u.sh.getRange(u.row, 10).setValue(safe_(b.notes, 300));
  audit_(a, 'user_edit', u.email); return { ok: true };
}
function admUserCreate_(b) {
  const a = adm_(b); if (!a) return { ok: false, error: 'session' };
  const email = String(b.email || '').trim().toLowerCase(), company = safe_(b.company, 120), name = safe_(b.name, 80), phone = normPhone_(b.phone); const rate = String(b.rate || '').trim().toUpperCase();
  if (!emailOk_(email) || !company || !name) return { ok: false, error: 'missing_fields' };
  if (!/^[A-Z0-9_]{0,20}$/.test(rate) || (/^DISC/.test(rate) && !/^DISC(\d{1,2})$/.test(rate))) return { ok: false, error: 'invalid' };
  if (uGet_(email)) return { ok: false, error: 'exists' };
  const salt = Utilities.getUuid(); sh_('Portal_Users').appendRow([email, company, name, salt, pRound_(salt, Utilities.getUuid(), 'v2'), 'Active', rate, new Date(), '', 'Created by admin ' + a.email, 'Customer', phone ? "'" + phone : '', 'v2']);
  const code = num6_(); CacheService.getScriptCache().put('rs_' + email, code, 86400);
  mailTo_(email, 'Your PCW Freight account / Akun PCW Freight Anda', 'An account was created for ' + company + '.\nGo to https://pcwfreight.com/portal.html, choose "Forgot password", enter this email and the code ' + code + ' (valid 24 hours) to set your password.\n\nAkun dibuat untuk ' + company + '. Buka https://pcwfreight.com/portal.html, pilih "Lupa password", masukkan email ini dan kode ' + code + ' (berlaku 24 jam) untuk membuat password.');
  audit_(a, 'user_create', email + ' rate=' + rate); return { ok: true };
}
function admUserReset_(b) {
  const a = adm_(b); if (!a) return { ok: false, error: 'session' };
  const email = String(b.email || '').trim().toLowerCase(); const u = uGet_(email); if (!u || u.status === 'Disabled') return { ok: false, error: 'not_found' };
  const code = num6_(); CacheService.getScriptCache().put('rs_' + email, code, 86400);
  mailTo_(email, 'PCW Freight: password reset code ' + code, 'Go to https://pcwfreight.com/portal.html, choose "Forgot password", enter this email and the code ' + code + ' (valid 24 hours).\nBuka https://pcwfreight.com/portal.html, pilih "Lupa password", masukkan email ini dan kode ' + code + ' (berlaku 24 jam).');
  audit_(a, 'user_reset_sent', email); return { ok: true };
}
function admUserBookings_(b) {
  if (!adm_(b)) return { ok: false, error: 'session' };
  const email = String(b.email || '').trim().toLowerCase(); const d = a2Rows_(); const st = a2Last_();
  return { ok: true, items: d.rows.filter(function (r) { return String(r[14]).trim().toLowerCase() === email; }).reverse().slice(0, 100).map(function (r) { const k = String(r[0]).toUpperCase(); return { ref: r[0], date: dt_(r[1]) || String(r[1]), product: r[3], dest: r[5], kg: r[7], est: r[29], final: r[34] || '', status: st[k] ? st[k].s : 'Booking request' }; }) };
}
function admInvList_(b) {
  if (!adm_(b)) return { ok: false, error: 'session' };
  const v = sh_('Receivables').getDataRange().getValues().slice(1).filter(function (r) { return r[0]; });
  return { ok: true, items: v.map(function (r) { return { no: String(r[0]), ref: String(r[1]), customer: String(r[2]), date: dt_(r[3]).slice(0, 10) || String(r[3]), amount: r[4], due: dt_(r[5]).slice(0, 10) || String(r[5]), paid: dt_(r[6]).slice(0, 10) || String(r[6]), status: String(r[7]), notes: String(r[9] || '') }; }).reverse() };
}
function admInvAdd_(b) {
  const a = adm_(b); if (!a) return { ok: false, error: 'session' };
  const amount = num_(String(b.amount || '').replace(/[^0-9.]/g, '')); const ref = String(b.ref || '').trim().toUpperCase(); const cust = safe_(b.customer, 120);
  if (!(amount > 0) || !cust) return { ok: false, error: 'missing_fields' };
  const sh = sh_('Receivables'); const ym = Utilities.formatDate(new Date(), TZ, 'yyMM'); const n = sh.getDataRange().getValues().filter(function (r) { return String(r[0]).indexOf('INV-' + ym) === 0; }).length + 1; const no = 'INV-' + ym + '-' + ('000' + n).slice(-4);
  const now = new Date(); const due = new Date(now.getTime() + (parseInt(b.terms_days, 10) || 0) * 864e5);
  sh.appendRow([no, ref, cust, now, amount, due, '', 'Unpaid', '', safe_(b.notes, 200)]); audit_(a, 'invoice_add', no + ' ' + amount + ' ' + ref); return { ok: true, no: no };
}
function admInvPay_(b) {
  const a = adm_(b); if (!a) return { ok: false, error: 'session' };
  const no = String(b.no || '').trim(); const sh = sh_('Receivables'); const v = sh.getDataRange().getValues();
  for (let i = 1; i < v.length; i++) { if (String(v[i][0]) === no) { sh.getRange(i + 1, 7).setValue(new Date()); sh.getRange(i + 1, 8).setValue('Paid'); audit_(a, 'invoice_paid', no); return { ok: true }; } }
  return { ok: false, error: 'not_found' };
}
function admAudit_(b) {
  if (!adm_(b)) return { ok: false, error: 'session' };
  const v = sh_('Admin_Audit').getDataRange().getValues().slice(1).filter(function (r) { return r[0]; }).reverse().slice(0, 200);
  return { ok: true, items: v.map(function (r) { return { time: dt_(r[0]), who: String(r[1]), action: String(r[2]), detail: String(r[3]) }; }) };
}
function admSettings_(b) {
  if (!adm_(b)) return { ok: false, error: 'session' };
  return { ok: true, items: sh_(TABS.settings).getDataRange().getValues().slice(1).filter(function (r) { return r[0]; }).map(function (r) { return { key: String(r[0]), value: String(r[1]), note: String(r[2] || '') }; }) };
}
function admRoute2_(b) {
  switch (b.action) {
    case 'adm_stats': return admStats_(b); case 'adm_bookings_all': return admBookingsAll_(b); case 'adm_booking_get': return admBookingGet_(b); case 'adm_booking_edit': return admBookingEdit_(b);
    case 'adm_track_del': return admTrackDel_(b); case 'adm_user_edit': return admUserEdit_(b); case 'adm_user_create': return admUserCreate_(b); case 'adm_user_reset': return admUserReset_(b);
    case 'adm_user_bookings': return admUserBookings_(b); case 'adm_inv_list': return admInvList_(b); case 'adm_inv_add': return admInvAdd_(b); case 'adm_inv_pay': return admInvPay_(b);
    case 'adm_audit': return admAudit_(b); case 'adm_settings': return admSettings_(b);
  }
  return null;
}
