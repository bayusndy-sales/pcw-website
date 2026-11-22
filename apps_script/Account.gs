/* PCW account types (Company / Personal), identity documents, payment terms and the payment gate.
   Needs helpers from Auth.gs / Admin.gs / Fulfil.gs: uGet_, registerBase_, verifyTurnstile_, safe_, normPhone_, audit_, adm_, sess_, mailTo_, trackAdd_, FUL_MIME.
   Portal_Users extra columns (14 onward) are created by accHdr_() on first use.
   Rules:
   - Company: NIB + NPWP files (PT or CV). May choose Prepaid or Invoice; Invoice is only a request until a SuperAdmin approves it.
   - Personal: KTP + NPWP files. Always Prepaid. The vendor booking is not processed until payment is marked as received.
   - Guest bookings (no account) are Prepaid.
   - Legacy accounts (Payment_Terms blank) keep working as before, with no payment gate, until a SuperAdmin sets their terms. */
const ACC_COLS = ['Account_Type', 'Legal_Entity', 'NPWP_No', 'NIB_No', 'Payment_Terms', 'Pay_Pref', 'Credit_Days_Req', 'Docs_Status', 'Docs_Files', 'Docs_Note', 'Docs_At', 'Terms_Note']; // columns 14..25
const ACC_MAX_BYTES = 3 * 1024 * 1024;
const ACC_KINDS = { Company: ['NIB', 'NPWP'], Personal: ['KTP', 'NPWP'] };
const WEB_PAY_COLS = ['Payment_Mode', 'Payment_Status', 'Payment_At', 'Payment_By', 'Payment_Note']; // Web_Bookings columns 36..40

function accHdr_() {
  const sh = sh_('Portal_Users'); const have = sh.getRange(1, 14, 1, ACC_COLS.length).getValues()[0];
  if (have.join('|') !== ACC_COLS.join('|')) sh.getRange(1, 14, 1, ACC_COLS.length).setValues([ACC_COLS]);
  return sh;
}
function webPayHdr_() {
  const sh = sh_(TABS.web); const have = sh.getRange(1, 36, 1, WEB_PAY_COLS.length).getValues()[0];
  if (have.join('|') !== WEB_PAY_COLS.join('|')) sh.getRange(1, 36, 1, WEB_PAY_COLS.length).setValues([WEB_PAY_COLS]);
  return sh;
}
function accSet_(u, kv) { const sh = accHdr_(); Object.keys(kv).forEach(function (k) { const c = ACC_COLS.indexOf(k); if (c >= 0) sh.getRange(u.row, 14 + c).setValue(kv[k]); }); }
function accDigits_(v) { return String(v || '').replace(/\D/g, ''); }

/** How a booking by this user is paid. Returns { mode, status }. */
function payOf_(u) {
  if (!u) return { mode: 'Prepaid', status: 'Unpaid' };
  if (u.terms === 'Prepaid' || u.acct === 'Personal') return { mode: 'Prepaid', status: 'Unpaid' };
  if (u.terms === 'Invoice') return { mode: 'Invoice', status: 'On account' };
  return { mode: 'Legacy', status: 'On account' };
}

function accFolder_() { const it = DriveApp.getFoldersByName('PCW Customer Documents'); return it.hasNext() ? it.next() : DriveApp.createFolder('PCW Customer Documents'); }
function sigOk_(bytes, mime) {
  const b = function (i) { return (bytes[i] & 0xFF); };
  if (mime === 'application/pdf') return b(0) === 0x25 && b(1) === 0x50 && b(2) === 0x44 && b(3) === 0x46;
  if (mime === 'image/png') return b(0) === 0x89 && b(1) === 0x50 && b(2) === 0x4E && b(3) === 0x47;
  if (mime === 'image/jpeg') return b(0) === 0xFF && b(1) === 0xD8 && b(2) === 0xFF;
  return false;
}
/** Validates the uploaded documents for an account type. Returns { ok, files:[{kind,mime,ext,bytes}] } or { ok:false, error }. */
function docsCheck_(atype, files) {
  const need = ACC_KINDS[atype]; if (!need) return { ok: false, error: 'invalid_account_type' };
  const by = {}; (Array.isArray(files) ? files : []).forEach(function (f) { if (f && f.kind) by[String(f.kind)] = f; });
  const out = [];
  for (let i = 0; i < need.length; i++) {
    const f = by[need[i]]; if (!f || !f.data) return { ok: false, error: 'docs_required', kind: need[i] };
    const mime = String(f.mime || ''); const ext = FUL_MIME[mime]; if (!ext) return { ok: false, error: 'bad_type', kind: need[i] };
    let bytes; try { bytes = Utilities.base64Decode(String(f.data)); } catch (e) { return { ok: false, error: 'bad_file', kind: need[i] }; }
    if (!bytes.length || bytes.length > ACC_MAX_BYTES) return { ok: false, error: 'too_big', kind: need[i] };
    if (!sigOk_(bytes, mime)) return { ok: false, error: 'bad_file', kind: need[i] };
    out.push({ kind: need[i], mime: mime, ext: ext, bytes: bytes });
  }
  return { ok: true, files: out };
}
/** Stores checked documents in the private folder, trashes the previous ones, returns the kind -> fileId map. */
function docsStore_(u, checked, prevJson) {
  let prev = {}; try { prev = JSON.parse(prevJson || '{}'); } catch (e) {}
  const map = {}; const stamp = Utilities.formatDate(new Date(), TZ, 'yyyyMMdd_HHmm'); const folder = accFolder_();
  checked.forEach(function (c) {
    const name = u.email.replace(/[^a-z0-9@._-]/gi, '_') + '_' + c.kind + '_' + stamp + '.' + c.ext;
    map[c.kind] = folder.createFile(Utilities.newBlob(c.bytes, c.mime, name)).getId();
    if (prev[c.kind]) { try { DriveApp.getFileById(prev[c.kind]).setTrashed(true); } catch (e) {} }
  });
  return map;
}

/** Public registration: Company or Personal, with documents. Replaces the old register route. */
function register_(b) {
  delete b.__ts;
  if (b.website) return { ok: false, error: 'rejected' };
  if (!verifyTurnstile_(b.turnstile)) return { ok: false, error: 'bot_check_failed' };
  const atype = b.account_type === 'Personal' ? 'Personal' : (b.account_type === 'Company' ? 'Company' : '');
  if (!atype) return { ok: false, error: 'invalid_account_type' };
  const email = String(b.email || '').trim().toLowerCase();
  let entity = '', npwp = '', nib = '', pref = 'Prepaid', days = '';
  if (atype === 'Company') {
    entity = b.legal_entity === 'CV' ? 'CV' : (b.legal_entity === 'PT' ? 'PT' : ''); if (!entity) return { ok: false, error: 'missing_fields' };
    npwp = accDigits_(b.npwp_no); nib = accDigits_(b.nib_no);
    if (npwp.length < 15 || npwp.length > 16) return { ok: false, error: 'invalid_npwp' };
    if (nib.length < 10 || nib.length > 20) return { ok: false, error: 'invalid_nib' };
    pref = b.pay_pref === 'Invoice' ? 'Invoice' : 'Prepaid';
    if (pref === 'Invoice') { days = [7, 14, 30].indexOf(parseInt(b.credit_days, 10)) >= 0 ? parseInt(b.credit_days, 10) : 14; }
  }
  if (b.docs_consent !== true) return { ok: false, error: 'docs_consent_required' };
  const chk = docsCheck_(atype, b.docs); if (!chk.ok) return chk;
  const ex = uGet_(email);
  if (ex && ex.status !== 'Pending') return registerBase_(Object.assign({}, b, { __ts: true })); // existing account: base sends the "already registered" email, nothing is changed
  b.__ts = true; const r = registerBase_(b); delete b.__ts;
  if (!r || !r.ok) return r;
  const u = uGet_(email); if (!u) return r;
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    accHdr_(); const files = docsStore_(u, chk.files, '');
    accSet_(u, { Account_Type: atype, Legal_Entity: entity, NPWP_No: npwp ? "'" + npwp : '', NIB_No: nib ? "'" + nib : '', Payment_Terms: 'Prepaid', Pay_Pref: pref, Credit_Days_Req: days, Docs_Status: 'Pending', Docs_Files: JSON.stringify(files), Docs_Note: '', Docs_At: new Date(), Terms_Note: '' });
  } finally { lock.releaseLock(); }
  return r;
}

/** Signed-in customer replaces documents (after a rejection, or to update). */
function docsUpload_(b) {
  const u = sess_(b.token); if (!u) return { ok: false, error: 'session' };
  if (!rateLimit_('du_' + u.email, 6, 3600)) return { ok: false, error: 'too_many_requests' };
  const atype = u.acct === 'Personal' ? 'Personal' : 'Company';
  const chk = docsCheck_(atype, b.docs); if (!chk.ok) return chk;
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    accHdr_(); const prev = sh_('Portal_Users').getRange(u.row, 14 + ACC_COLS.indexOf('Docs_Files')).getValue();
    const files = docsStore_(u, chk.files, String(prev || ''));
    accSet_(u, { Docs_Files: JSON.stringify(files), Docs_Status: 'Pending', Docs_Note: '', Docs_At: new Date() });
  } finally { lock.releaseLock(); }
  mailTo_(settings_().Notify_Email, 'PCW customer documents uploaded: ' + u.company, u.email + ' uploaded new documents. Review them in Admin > Customers.');
  return { ok: true };
}

/** Company asks for invoice terms (Personal accounts cannot). */
function termsRequest_(b) {
  const u = sess_(b.token); if (!u) return { ok: false, error: 'session' };
  if (u.acct === 'Personal') return { ok: false, error: 'personal_prepaid_only' };
  if (!rateLimit_('tr_' + u.email, 5, 3600)) return { ok: false, error: 'too_many_requests' };
  const days = [7, 14, 30].indexOf(parseInt(b.credit_days, 10)) >= 0 ? parseInt(b.credit_days, 10) : 14;
  accSet_(u, { Pay_Pref: 'Invoice', Credit_Days_Req: days });
  mailTo_(settings_().Notify_Email, 'Invoice terms requested: ' + u.company, u.company + ' / ' + u.email + ' asks for invoice terms (' + days + ' days). Review in Admin > Customers > Details.');
  return { ok: true };
}

/** Customer-facing account summary (added to the signed-in user object). */
function accPub_(u) {
  return { account_type: u.acct || 'Company', legal_entity: u.entity || '', pay_terms: u.terms || 'Legacy', pay_pref: u.pref || '', credit_days: u.days || '', docs_status: u.docs || '', docs_note: u.dnote || '' };
}

/* ---- admin (SuperAdmin) ---- */
function admAcc_(b) {
  if (!adm_(b)) return { ok: false, error: 'session' };
  accHdr_(); const v = sh_('Portal_Users').getDataRange().getValues().slice(1); const o = {};
  v.forEach(function (r) { if (r[0]) o[String(r[0]).toLowerCase()] = { account_type: String(r[13] || ''), entity: String(r[14] || ''), npwp: String(r[15] || ''), nib: String(r[16] || ''), terms: String(r[17] || ''), pref: String(r[18] || ''), days: String(r[19] || ''), docs: String(r[20] || ''), docs_note: String(r[22] || ''), docs_at: dt_(r[23]) }; });
  return { ok: true, map: o };
}
function admDocsSet_(b) {
  const a = adm_(b); if (!a) return { ok: false, error: 'session' };
  const u = uGet_(String(b.email || '').trim().toLowerCase()); if (!u) return { ok: false, error: 'not_found' };
  const st = String(b.status || ''); if (['Approved', 'Rejected', 'Pending'].indexOf(st) < 0) return { ok: false, error: 'invalid' };
  const note = safe_(b.note, 200); if (st === 'Rejected' && !note) return { ok: false, error: 'need_note' };
  accSet_(u, { Docs_Status: st, Docs_Note: st === 'Rejected' ? note : '' }); audit_(a, 'docs_' + st.toLowerCase(), u.email + (note ? ' ' + note : ''));
  if (st === 'Approved') mailTo_(u.email, 'PCW Freight: your documents are approved', 'Your documents have been verified. Thank you.\nDokumen Anda sudah diverifikasi. Terima kasih.\n\nPCW Freight');
  if (st === 'Rejected') mailTo_(u.email, 'PCW Freight: please upload your documents again', 'We could not accept your documents: ' + note + '\nPlease sign in at https://pcwfreight.com/portal.html, open Profile and upload them again.\n\nDokumen Anda belum dapat kami terima: ' + note + '\nSilakan masuk ke https://pcwfreight.com/id/portal.html, buka Profil, lalu unggah ulang.\n\nPCW Freight');
  return { ok: true };
}
function admDocView_(b) {
  const a = adm_(b); if (!a) return { ok: false, error: 'session' };
  const email = String(b.email || '').trim().toLowerCase(); const u = uGet_(email); if (!u) return { ok: false, error: 'not_found' };
  const kind = String(b.kind || ''); if (['NIB', 'NPWP', 'KTP'].indexOf(kind) < 0) return { ok: false, error: 'invalid' };
  let map = {}; try { map = JSON.parse(String(sh_('Portal_Users').getRange(u.row, 14 + ACC_COLS.indexOf('Docs_Files')).getValue() || '{}')); } catch (e) {}
  if (!map[kind]) return { ok: false, error: 'no_file' };
  let blob; try { blob = DriveApp.getFileById(map[kind]).getBlob(); } catch (e) { return { ok: false, error: 'no_file' }; }
  audit_(a, 'doc_view', email + ' ' + kind); return { ok: true, name: kind, mime: blob.getContentType(), data: Utilities.base64Encode(blob.getBytes()) };
}
function admTermsSet_(b) {
  const a = adm_(b); if (!a) return { ok: false, error: 'session' };
  const u = uGet_(String(b.email || '').trim().toLowerCase()); if (!u) return { ok: false, error: 'not_found' };
  const terms = String(b.terms || ''); if (['Prepaid', 'Invoice'].indexOf(terms) < 0) return { ok: false, error: 'invalid' };
  if (terms === 'Invoice' && u.acct === 'Personal') return { ok: false, error: 'personal_prepaid_only' };
  const days = terms === 'Invoice' ? ([7, 14, 30, 45, 60].indexOf(parseInt(b.credit_days, 10)) >= 0 ? parseInt(b.credit_days, 10) : 14) : '';
  accSet_(u, { Payment_Terms: terms, Credit_Days_Req: days, Terms_Note: safe_(b.note, 200) }); audit_(a, 'terms_set', u.email + ' ' + terms + (days ? ' ' + days + 'd' : ''));
  mailTo_(u.email, 'PCW Freight: your payment terms', terms === 'Invoice' ? 'Your account now has invoice terms (' + days + ' days after the invoice date). Terms and Conditions apply.\nAkun Anda kini memakai termin tagihan (' + days + ' hari setelah tanggal tagihan). Berlaku Syarat dan Ketentuan.\n\nPCW Freight' : 'Your account pays upfront: transfer after booking, and we process the shipment once payment is received.\nAkun Anda membayar di muka: transfer setelah booking, dan kiriman kami proses setelah pembayaran diterima.\n\nPCW Freight');
  return { ok: true };
}
/** SuperAdmin confirms (or reverses) a prepaid payment. */
function admPaySet_(b) {
  const a = adm_(b); if (!a) return { ok: false, error: 'session' };
  const ref = String(b.ref || '').trim().toUpperCase(); if (!/^[A-Z0-9-]{6,40}$/.test(ref)) return { ok: false, error: 'invalid' };
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const sh = webPayHdr_(); const n = sh.getLastRow(); if (n < 2) return { ok: false, error: 'not_found' };
    const refs = sh.getRange(2, 1, n - 1, 1).getValues(); let row = 0; for (let i = 0; i < refs.length; i++) { if (String(refs[i][0]).toUpperCase() === ref) { row = i + 2; break; } }
    if (!row) return { ok: false, error: 'not_found' };
    const mode = String(sh.getRange(row, 36).getValue() || '');
    if (mode !== 'Prepaid') return { ok: false, error: 'not_prepaid' };
    const paid = b.value === 'Y';
    sh.getRange(row, 37, 1, 4).setValues([[paid ? 'Paid' : 'Unpaid', paid ? new Date() : '', paid ? a.email.split('@')[0] : '', safe_(b.note, 200)]]);
    if (paid && !trackHas_(ref, ['Paid'])) trackAdd_(ref, 'Paid', 'Payment received', a.email);
    audit_(a, paid ? 'pay_received' : 'pay_reversed', ref + (b.note ? ' ' + safe_(b.note, 120) : ''));
    return { ok: true };
  } finally { lock.releaseLock(); }
}
/** Payment + documents gate used before ops request or book anything with a vendor. Returns '' when clear, otherwise an error code. */
function payGate_(bookingRow, hdr) {
  const mode = String(bookingRow[hdr.indexOf('Payment_Mode')] || ''), status = String(bookingRow[hdr.indexOf('Payment_Status')] || '');
  if (mode === 'Prepaid' && status !== 'Paid') return 'payment_required';
  const email = String(bookingRow[14] || '').trim().toLowerCase(); const u = email ? uGet_(email) : null;
  if (u && u.docs && u.docs !== 'Approved') return 'docs_required';
  return '';
}
function accRoute_(b) {
  switch (b.action) {
    case 'docs_m': return docsUpload_(b); case 'terms_req': return termsRequest_(b);
    case 'adm_acc': return admAcc_(b); case 'adm_docs_set': return admDocsSet_(b); case 'adm_doc_view': return admDocView_(b); case 'adm_terms_set': return admTermsSet_(b); case 'adm_pay_set': return admPaySet_(b);
  }
  return null;
}
