/**
 * PCW Freight website back end - Phase A (no login).
 * Bound to the Google Sheet "PCW Operations Backend".
 * Actions:
 *   GET  ?action=countries                       -> list of countries with published rates
 *   GET  ?action=rate&country=&type=&kg=&pieces=&l=&w=&h=  -> published-rate estimate
 *   GET  ?action=track&ref=&lang=                -> public status timeline
 *   POST {action:'book', ...}  (Content-Type text/plain) -> booking request, returns PCW reference
 * Rules: prices are always recalculated here (browser prices are ignored);
 * no cost, vendor name or carrier number ever leaves this script.
 */

const TABS = {
  orders: 'Orders', track: 'Tracking', web: 'Web_Bookings',
  rates: 'Rates_Public', settings: 'Settings', status: 'Status_Public'
};
const PRODUCT_CODE = { Priority: 'PX', Economy: 'EC' };
const PRODUCT_NAME = { Priority: 'Priority Express', Economy: 'Economy Express' };
const TZ = 'Asia/Jakarta';

/* ---------------- entry points ---------------- */

function doGet(e) {
  const p = (e && e.parameter) || {};
  try {
    if (p.action === 'countries') return json_({ ok: true, countries: countries_() });
    if (p.action === 'rate') return json_(rate_(p));
    if (p.action === 'track') return json_(track_(p));
    if (p.action === 'bt') return json_({ ok: true, bt: botToken_() });
    return json_({ ok: false, error: 'unknown_action' });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: 'server_error' });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    delete body.__member; delete body.__disc; delete body.__pub; delete body.__ts; delete body.__pay; const ar = authRoute_(body) || accRoute_(body) || admRoute_(body) || admRoute2_(body) || ulRoute_(body); if (ar) return json_(ar); if (body.action === 'book') return json_(book_(body)); if (body.action === 'portal_login') return json_(portalLogin_(body)); if (body.action === 'portal_list') return json_(portalList_(body)); if (body.action === 'portal_book') return json_(portalBook_(body));
    return json_({ ok: false, error: 'unknown_action' });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: 'server_error' });
  }
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ---------------- helpers ---------------- */

function sh_(name) { return SpreadsheetApp.getActive().getSheetByName(name); }

function settings_() {
  const cache = CacheService.getScriptCache();
  const hit = cache.get('settings');
  if (hit) return JSON.parse(hit);
  const values = sh_(TABS.settings).getDataRange().getValues();
  const s = {};
  values.slice(1).forEach(function (r) { if (r[0] !== '') s[String(r[0]).trim()] = r[1]; });
  cache.put('settings', JSON.stringify(s), 300);
  return s;
}

/** Text written into the Sheet: trimmed, length-capped, and protected against formula injection. */
function safe_(v, max) {
  let s = String(v == null ? '' : v).replace(/[\r\n\t]+/g, ' ').trim().slice(0, max || 300);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function num_(v) { const n = parseFloat(v); return isFinite(n) ? n : NaN; }
function round2_(n) { return Math.round(n * 100) / 100; }
function ceilStep_(x, step) { return Math.ceil(x / step - 1e-9) * step; }

/* ---------------- rates ---------------- */

/** Rates grouped by product|type|country, cached per group (cache values must stay small). */
function group_(prod, type, country) {
  const key = 'r|' + prod + '|' + type + '|' + country;
  const cache = CacheService.getScriptCache();
  const hit = cache.get(key);
  if (hit) return JSON.parse(hit);
  if (cache.get('r|loaded')) return null; // all groups cached and this one does not exist
  const values = sh_(TABS.rates).getDataRange().getValues().slice(1);
  const groups = {};
  values.forEach(function (r) {
    if (!r[0]) return;
    const k = 'r|' + r[0] + '|' + r[1] + '|' + r[2];
    (groups[k] = groups[k] || []).push({ w: Number(r[3]), b: Number(r[4]), f: Number(r[5]), t: Number(r[6]) });
  });
  Object.keys(groups).forEach(function (k) { groups[k].sort(function (a, b) { return a.w - b.w; }); });
  const toCache = {};
  Object.keys(groups).forEach(function (k) { toCache[k] = JSON.stringify(groups[k]); });
  toCache['r|loaded'] = '1';
  cache.putAll(toCache, 21600);
  return groups[key] || null;
}

function pick_(prod, type, country, cw) {
  const g = group_(prod, type, country);
  if (!g) return null;
  for (let i = 0; i < g.length; i++) if (g[i].w >= cw - 1e-9) return g[i];
  return null; // heavier than the published table -> quote
}

function countries_() {
  const cache = CacheService.getScriptCache();
  const hit = cache.get('countries');
  if (hit) return JSON.parse(hit);
  const values = sh_(TABS.rates).getDataRange().getValues().slice(1);
  const set = {};
  values.forEach(function (r) { if (r[2]) set[r[2]] = 1; });
  const list = Object.keys(set).sort();
  cache.put('countries', JSON.stringify(list), 21600);
  return list;
}

/* ---- demand surcharge + multi-package rating ---- */
const DEMAND_RATE = { CH: 2000, AS: 2000, OC: 10000, EU: 26000, AM: 30000, ME: 24000, RW: 17000 }; // IDR per billing kg, DHL Indonesia origin, 1 Oct 2026 - 5 Feb 2027
const DEMAND_GROUPS = {
  CH: ["China", "Hong Kong", "Macau"],
  AS: ["Bangladesh", "Bhutan", "Brunei", "Cambodia", "India", "Japan", "Laos", "Malaysia (West)", "Maldives", "Mongolia", "Myanmar", "Nepal", "Pakistan", "Philippines", "Singapore", "South Korea", "Sri Lanka", "Taiwan", "Thailand", "Timor-Leste", "Vietnam"],
  OC: ["Australia", "Cook Islands", "Fiji", "Kiribati", "Nauru", "New Caledonia", "New Zealand", "Niue", "Papua New Guinea", "Samoa", "Solomon Islands", "Tahiti (French Polynesia)", "Tonga", "Tuvalu", "Vanuatu"],
  EU: ["Albania", "Andorra", "Austria", "Belgium", "Bosnia & Herzegovina", "Bulgaria", "Canary Islands", "Croatia", "Cyprus", "Czech Republic", "Denmark", "Estonia", "Finland", "France", "Germany", "Gibraltar", "Greece", "Guernsey", "Hungary", "Iceland", "Ireland", "Italy", "Jersey", "Kosovo", "Latvia", "Liechtenstein", "Lithuania", "Luxembourg", "Malta", "Moldova", "Monaco", "Montenegro", "Netherlands", "North Macedonia", "Norway", "Poland", "Portugal", "Romania", "San Marino", "Serbia", "Slovakia", "Slovenia", "Spain", "Sweden", "Switzerland", "Turkey", "United Kingdom", "Vatican City"],
  AM: ["American Samoa", "Anguilla", "Antigua & Barbuda", "Argentina", "Aruba", "Bahamas", "Barbados", "Belize", "Bermuda", "Bolivia", "Bonaire", "Brazil", "British Virgin Islands", "Canada", "Cayman Islands", "Chile", "Colombia", "Costa Rica", "Curacao", "Dominica", "Dominican Republic", "Ecuador", "El Salvador", "French Guiana", "Grenada", "Guadeloupe", "Guam", "Guatemala", "Guyana", "Haiti", "Honduras", "Jamaica", "Marshall Islands", "Martinique", "Mexico", "Micronesia", "Montserrat", "Nevis", "Nicaragua", "Northern Mariana Islands", "Palau", "Panama", "Paraguay", "Peru", "Puerto Rico", "St. Barthelemy", "St. Eustatius", "St. Kitts", "St. Lucia", "St. Maarten", "St. Vincent", "Suriname", "Trinidad & Tobago", "Turks & Caicos", "US Virgin Islands", "United States", "Uruguay"],
  ME: ["Algeria", "Bahrain", "Egypt", "Jordan", "Kuwait", "Lebanon", "Morocco", "Oman", "Qatar", "Saudi Arabia", "Tunisia", "United Arab Emirates"],
};  // every other country = RW

function demandCode_(country) {
  for (const k in DEMAND_GROUPS) if (DEMAND_GROUPS[k].indexOf(country) !== -1) return k;
  return 'RW';
}
function dateStr_(v) {
  if (!v) return '';
  if (v instanceof Date) return Utilities.formatDate(v, TZ, 'yyyy-MM-dd');
  const sv = String(v);
  if (sv.indexOf('T') > 0) { const d = new Date(sv); if (!isNaN(d)) return Utilities.formatDate(d, TZ, 'yyyy-MM-dd'); }
  return sv.slice(0, 10);
}
function demandPerKg_(country, s) {
  if (String(s.Demand_On || 'Y').toUpperCase() === 'N') return { rate: 0 };
  const from = dateStr_(s.Demand_From) || '2026-10-01', to = dateStr_(s.Demand_To) || '2027-02-05';
  const today = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');
  if (today < from || today > to) return { rate: 0 };
  const f = Number(s.Demand_Factor); const factor = f > 0 ? f : 0.9;
  return { rate: Math.round(DEMAND_RATE[demandCode_(country)] * factor), to: to };
}
function items_(p) {
  let arr = null;
  if (p.items) { try { arr = typeof p.items === 'string' ? JSON.parse(p.items) : p.items; } catch (e) { arr = null; } }
  if (!Array.isArray(arr) || !arr.length) {
    const pcs = Math.max(1, Math.min(50, parseInt(p.pieces, 10) || 1));
    arr = [{ q: pcs, kg: num_(p.kg) / pcs, l: p.l, w: p.w, h: p.h }];
  }
  if (arr.length > 20) return null;
  const out = [];
  for (let i = 0; i < arr.length; i++) {
    const a = arr[i] || {};
    const q = Math.max(1, Math.min(50, parseInt(a.q, 10) || 1));
    const kg = num_(a.kg);
    if (!(kg > 0) || kg > 1000) return null;
    out.push({ q: q, kg: kg, l: Math.ceil(num_(a.l) || 0), w: Math.ceil(num_(a.w) || 0), h: Math.ceil(num_(a.h) || 0) });
  }
  return out;
}

/* ---- promo: maximum discount that still keeps PCW GP at 20% or more (Settings: Promo_On, Promo_GP, Promo_Max) ---- */
function promoMax_(prod, country, cw, total, demand, s) {
  try {
    if (String(s.Promo_On || 'Y').toUpperCase() === 'N' || !(total > 0)) return 0;
    const gp = Math.max(0.20, Number(s.Promo_GP) || 0.20);
    const cap = Number(s.Promo_Max) > 0 ? Number(s.Promo_Max) : 30;
    const costs = chanSuggest_(prod, country, cw).costs || {};
    let cost = Infinity;
    if (prod === 'Economy') { if (costs.MARS > 0) cost = costs.MARS; }
    else ['FEDEX_OWN', 'FEDEX_ICCL', 'DHL_OWN'].forEach(function (k) { if (costs[k] > 0 && costs[k] < cost) cost = costs[k]; });
    if (!isFinite(cost)) return 0;
    cost += (demand || 0);   // [ASSUMED] the demand surcharge is paid to the carrier at the amount charged
    const d = 1 - cost / ((1 - gp) * total);
    const pct = Math.min(cap, Math.floor(d * 100 / 5) * 5);
    return pct >= 5 ? pct : 0;
  } catch (e) { return 0; }
}

function rate_(p) {
  const s = settings_();
  const country = String(p.country || '').trim();
  const type = p.type === 'Document' ? 'Document' : 'Parcel';
  const items = items_(p);
  if (!country || !items) return { ok: false, error: 'invalid_input' };
  if (countries_().indexOf(country) === -1) return { ok: false, error: 'country_not_listed' };
  const divisor = Number(s.Volumetric_Divisor) || 5000;
  let pieces = 0, actual = 0, vol = 0, basis = 0;
  items.forEach(function (it) {
    const v = (it.l > 0 && it.w > 0 && it.h > 0) ? it.l * it.w * it.h / divisor : 0;
    it.vol = v;
    pieces += it.q; actual += it.kg * it.q; vol += v * it.q;
    basis += ceilStep_(Math.max(it.kg, v), 0.5) * it.q;
  });
  if (pieces > 200) return { ok: false, error: 'invalid_input' };
  const dem = demandPerKg_(country, s);
  const fuelPct = Number(s.Fuel_Pct) || 0;
  const out = {
    ok: true, country: country, type: type, pieces: pieces, items: items.map(function (it) { return { q: it.q, kg: it.kg, l: it.l, w: it.w, h: it.h }; }),
    actual_kg: round2_(actual), volumetric_kg: round2_(vol),
    fuel_pct: fuelPct, demand_per_kg: dem.rate, demand_until: dem.to || '', options: []
  };
  ['Priority', 'Economy'].forEach(function (prod) {
    const cw = prod === 'Priority' ? ceilStep_(basis, basis <= 30 ? 0.5 : 1) : ceilStep_(basis, 1);
    let row = null;
    if (prod === 'Priority') {
      row = pick_(prod, type, country, cw);
      if (!row && type === 'Document') row = pick_(prod, 'Parcel', country, cw);
    } else {
      row = pick_(prod, 'Parcel', country, cw);
    }
    if (prod === 'Economy' && country === 'Timor-Leste' && cw >= 18) row = null;   // heavy Economy to Timor-Leste is quoted personally (margin floor)
    if (!row) { out.options.push({ product: prod, chargeable_kg: cw, quote: true }); return; }
    let base = row.b, fuel = row.f;
    if (prod === 'Priority' && cw > 30 && row.w > 0) {
      const k = cw / row.w;                       // heavy bands are priced per kg
      base = Math.ceil(row.b * k / 1000) * 1000;
      fuel = Math.round(base * (row.f / row.b));
    }
    const demand = prod === 'Priority' ? dem.rate * cw : 0;
    if (demand) fuel += Math.round(fuelPct * demand);
    out.options.push({ product: prod, chargeable_kg: cw, base: base, demand: demand, fuel: fuel, total: base + demand + fuel, max_disc: promoMax_(prod, country, cw, base + demand + fuel, demand, s) });
  });
  // Economy has a 1 kg basis; when it is not cheaper than Priority for this shipment, the site does not offer it
  const P = out.options[0], E = out.options[1];
  if (P && E && !P.quote && !E.quote && E.total >= P.total) E.not_cheaper = true;
  return out;
}

/* ---------------- tracking ---------------- */

function track_(p) { // public tracking, cached 60 s per ref and language
  const k = 'tk_' + String(p.ref || '').trim().toUpperCase().slice(0, 40) + '_' + (p.lang === 'id' ? 'id' : 'en'), c = CacheService.getScriptCache();
  const hit = c.get(k); if (hit) return JSON.parse(hit);
  const r = trackRaw_(p); if (r.ok) c.put(k, JSON.stringify(r), 60); return r;
}
function trackRaw_(p) {
  const ref = String(p.ref || '').trim().toUpperCase();
  const lang = p.lang === 'id' ? 'id' : 'en';
  if (!/^[A-Z0-9-]{6,40}$/.test(ref)) return { ok: false, error: 'invalid_ref' };
  if (!rateLimit_('trk_' + ref, 60, 3600)) return { ok: false, error: 'too_many_requests' };

  // public wording
  const map = {};
  sh_(TABS.status).getDataRange().getValues().slice(1).forEach(function (r) {
    if (r[0]) map[r[0]] = { en: r[1], id: r[2], show: String(r[3]).toUpperCase() === 'Y' };
  });

  // shipment header from Orders (product + destination only)
  let product = '', dest = '', found = false;
  const orders = sh_(TABS.orders).getDataRange().getValues();
  for (let i = 1; i < orders.length; i++) {
    if (String(orders[i][0]).toUpperCase() === ref) {
      found = true; product = orders[i][2]; dest = orders[i][7]; break;
    }
  }

  const events = [];
  let est = '';
  sh_(TABS.track).getDataRange().getValues().slice(1).forEach(function (r) {
    if (String(r[0]).toUpperCase() !== ref || !r[2]) return;
    found = true;
    const m = map[r[2]];
    if (m && !m.show) return;
    const label = m ? (lang === 'id' ? m.id : m.en) : r[2];
    const t = r[1] instanceof Date ? r[1] : (r[1] ? new Date(r[1]) : null);
    events.push({
      time: t && !isNaN(t) ? Utilities.formatDate(t, TZ, 'yyyy-MM-dd HH:mm') : '',
      status: label, location: String(r[3] || ''), note: String(r[5] || '')
    });
    if (r[4]) est = r[4] instanceof Date ? Utilities.formatDate(r[4], TZ, 'yyyy-MM-dd') : String(r[4]);
  });
  if (!found) return { ok: false, error: 'not_found' };
  events.sort(function (a, b) { return a.time < b.time ? 1 : -1; });
  if (!events.length) {
    const m = map['Booking request'];
    events.push({ time: '', status: m ? (lang === 'id' ? m.id : m.en) : 'Booking received', location: '', note: '' });
  }
  return { ok: true, ref: ref, product: product, destination: dest, est_delivery: est, events: events };
}

/* ---------------- booking ---------------- */

function rateLimit_(key, max, seconds) {
  const cache = CacheService.getScriptCache();
  const n = parseInt(cache.get(key) || '0', 10);
  if (n >= max) return false;
  cache.put(key, String(n + 1), seconds);
  return true;
}

function verifyTurnstile_(token) {
  const secret = tsSecret_();
  if (!secret) return true; // bot check not configured yet
  if (!token) return false;
  const res = UrlFetchApp.fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'post', payload: { secret: secret, response: token }, muteHttpExceptions: true
  });
  try { return JSON.parse(res.getContentText()).success === true; } catch (e) { return false; }
}

/* Self-hosted bot check: the page asks for a signed time token on load; a booking is accepted only if the token is genuine,
   at least 4 seconds old, less than 2 hours old and not used before. When the Script Property TS_SECRET is set, the Cloudflare Turnstile check is required as well. */
function tsSecret_() { return PropertiesService.getScriptProperties().getProperty('TS_SECRET') || settings_().Turnstile_Secret || ''; }
function btKey_() {
  const pr = PropertiesService.getScriptProperties();
  let k = pr.getProperty('BT_KEY');
  if (!k) { k = Utilities.getUuid() + Utilities.getUuid(); pr.setProperty('BT_KEY', k); }
  return k;
}
function btSig_(ts) { return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(String(ts), btKey_())); }
function botToken_() { const ts = Date.now(); return ts + '.' + btSig_(ts); }
function botOk_(b) {
  if (tsSecret_() && !verifyTurnstile_(b.turnstile)) return false;
  const parts = String(b.bt || '').split('.');
  if (parts.length !== 2) return false;
  const ts = parseInt(parts[0], 10), age = Date.now() - ts;
  if (!ts || age < 4000 || age > 7200000) return false;
  if (btSig_(ts) !== parts[1]) return false;
  const cache = CacheService.getScriptCache(), uk = 'btu_' + parts[1].slice(0, 40);
  if (cache.get(uk)) return false;
  cache.put(uk, '1', 7200);
  return true;
}

function nextRef_(code) {
  const yymm = Utilities.formatDate(new Date(), TZ, 'yyMM');
  const prefix = 'PCW-' + code + '-' + yymm + '-';
  let max = 0;
  [TABS.orders, TABS.web].forEach(function (name) {
    const sheet = sh_(name);
    const last = sheet.getLastRow();
    if (last < 2) return;
    sheet.getRange(2, 1, last - 1, 1).getValues().forEach(function (r) {
      const v = String(r[0]);
      if (v.indexOf(prefix) === 0) max = Math.max(max, parseInt(v.slice(prefix.length), 10) || 0);
    });
  });
  const pr = PropertiesService.getScriptProperties(), pk = 'REF_' + prefix;
  max = Math.max(max, parseInt(pr.getProperty(pk) || '0', 10));
  pr.setProperty(pk, String(max + 1)); // counter never goes back, even if test rows are deleted
  return prefix + ('000' + (max + 1)).slice(-4);
}

function normPhone_(v) {
  let d = String(v || '').replace(/\D/g, '');
  if (d.indexOf('0') === 0) d = '62' + d.slice(1);
  return d;
}

function book_(b) {
  const s = settings_();
  if (b.website) return { ok: false, error: 'rejected' };           // honeypot field filled = bot
  if (!b.__member && !botOk_(b)) return { ok: false, error: 'bot_check_failed' };

  const prod = b.product === 'Economy' ? 'Economy' : (b.product === 'Priority' ? 'Priority' : '');
  const email = String(b.shipper_email || '').trim().toLowerCase();
  const wa = normPhone_(b.shipper_whatsapp);
  const pickup = b.pickup_or_dropoff === 'Pickup' ? 'Pickup' : 'Drop-off';
  const pickupCity = String(b.pickup_city || '').trim();
  const outsideRaw = pickup === 'Pickup' && pickupCity.toLowerCase().indexOf(String(s.Economy_Online_Pickup_Area || 'Jakarta').toLowerCase()) === -1;
  const outside = outsideRaw && prod === 'Economy'; // Priority pickup is included anywhere in Indonesia

  const required = {
    product: prod, dest_country: b.dest_country, contents: b.contents, shipper_name: b.shipper_name,
    shipper_email: email, shipper_whatsapp: wa, consignee_name: b.consignee_name,
    consignee_address: b.consignee_address, consignee_city: b.consignee_city, consignee_phone: b.consignee_phone, consignee_email: b.consignee_email, declared_value: b.declared_value
  };
  const missing = Object.keys(required).filter(function (k) { return !String(required[k] || '').trim(); });
  if (pickup === 'Pickup' && !String(b.pickup_address || '').trim()) missing.push('pickup_address');
  if (missing.length) return { ok: false, error: 'missing_fields', fields: missing };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(b.consignee_email).trim())) return { ok: false, error: 'invalid_email' }; if (/p\.?\s?o\.?\s?box/i.test(String(b.consignee_address))) return { ok: false, error: 'po_box_not_accepted' };
  if (wa.length < 9 || wa.length > 15) return { ok: false, error: 'invalid_whatsapp' };
  if (b.terms_accepted !== true || b.privacy_consent !== true || b.no_prohibited !== true) {
    return { ok: false, error: 'consent_required' };
  }
  if (prod === 'Economy' && outside) return { ok: false, error: 'economy_pickup_outside_jakarta' };

  if (!rateLimit_('bk_' + email, b.__member ? 60 : 5, 3600) || !rateLimit_('bk_all', 60, 3600)) {
    return { ok: false, error: 'too_many_requests' };
  }

  // price is recalculated here, never taken from the browser
  const r = rate_({ country: b.dest_country, type: b.shipment_type, kg: b.actual_kg, pieces: b.pieces, l: b.l, w: b.w, h: b.h, items: b.items });
  if (!r.ok) return r;
  const opt = r.options.filter(function (o) { return o.product === prod; })[0];
  const quote = (b.__member && !b.__disc && !b.__pub) || !opt || !!opt.quote; if (b.__disc && opt && !opt.quote) { const dk = 1 - b.__disc; opt.base = Math.round(opt.base * dk); opt.demand = Math.round((opt.demand || 0) * dk); opt.fuel = Math.round(opt.fuel * dk); opt.total = Math.round(opt.total * dk); }

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  let ref;
  try {
    ref = nextRef_(PRODUCT_CODE[prod]);
    const now = new Date();
    const dims = r.items.map(function (it) { return it.q + ' x ' + it.kg + 'kg' + ((it.l > 0 && it.w > 0 && it.h > 0) ? ' ' + it.l + 'x' + it.w + 'x' + it.h + ' cm' : ''); }).join('; ');
    const notes = ['Web booking (published rate estimate)']; const xm = String(b.contents || '').match(/\| Options: (.*)$/); if (xm) notes.push('EXTRAS REQUESTED: ' + xm[1] + ' (confirm availability and price)');
    if (outside) notes.push('PICKUP OUTSIDE JAKARTA: confirm pickup cost');
    if (b.__member) notes.push('PORTAL MEMBER BOOKING (' + safe_(b.shipper_company) + '): price per member agreement, not published rate' + (b.__disc ? ' (' + Math.round(b.__disc * 100) + '% off published)' : '')); else if (quote) notes.push('ABOVE PUBLISHED TABLE: quote needed');

    webPayHdr_(); const pay = b.__pay && b.__pay.mode ? b.__pay : { mode: 'Prepaid', status: 'Unpaid' };
    sh_(TABS.web).appendRow([
      ref, now, b.lang === 'id' ? 'id' : 'en', prod, r.type, safe_(r.country), r.pieces, r.actual_kg, safe_(dims),
      opt ? opt.chargeable_kg : '', safe_(b.contents), safe_(b.declared_value, 40),
      safe_(b.shipper_name), safe_(b.shipper_company), safe_(email), "'" + wa, pickup,
      safe_(b.pickup_address), safe_(pickupCity), safe_(b.pickup_postcode, 20), safe_(b.pickup_date, 20),
      outsideRaw ? 'Y' : 'N', safe_(b.consignee_name), safe_(b.consignee_company), safe_(b.consignee_address),
      safe_(b.consignee_city), safe_(b.consignee_postcode, 20), safe_(b.consignee_phone, 30), safe_(b.consignee_email),
      quote ? '' : opt.total, 'Y', 'Y', 'Y', safe_(notes.join(' | ')), pay.mode, pay.status
    ]);

    const orders = sh_(TABS.orders);
    const row = orders.getLastRow() + 1;
    orders.getRange(row, 1, 1, 32).setValues([[
      ref, now, PRODUCT_NAME[prod], safe_(b.shipper_company || b.shipper_name), safe_(b.shipper_name), "'" + wa,
      safe_(pickupCity || 'Drop-off'), safe_(r.country), safe_((b.consignee_company ? b.consignee_company + ', ' : '') + b.consignee_city),
      safe_(b.contents), safe_(b.declared_value, 40), r.pieces, r.actual_kg, safe_(dims), opt ? opt.chargeable_kg : '',
      '', '', '', quote ? '' : opt.base, quote ? '' : opt.fuel, quote ? '' : (opt.demand || ''), '',
      '=IF(S' + row + '="","",S' + row + '+T' + row + '+U' + row + '+V' + row + ')',
      '=IF(OR(W' + row + '="",R' + row + '=""),"",W' + row + '-R' + row + ')',
      '=IF(OR(X' + row + '="",W' + row + '=0),"",X' + row + '/W' + row + ')',
      'Unpaid', '', safe_(b.pickup_date, 20), 'Booking request', '', '', safe_(notes.join(' | '))
    ]]);
  } finally {
    lock.releaseLock();
  }

  notify_(ref, prod, r, opt, quote, outside, b, email, s);

  return {
    ok: true, ref: ref, product: prod, quote: quote,
    chargeable_kg: opt ? opt.chargeable_kg : null, est_total: quote ? null : opt.total,
    pickup_outside_jakarta: outside, pay_mode: (b.__pay && b.__pay.mode) || 'Prepaid'
  };
}

function notify_(ref, prod, r, opt, quote, outside, b, email, s) {
  const owner = s.Notify_Email;
  const idr = function (n) { return 'Rp ' + Number(n).toLocaleString('id-ID'); };
  const price = quote ? 'Quote needed' : idr(opt.total);
  try {
    if (owner) {
      sendMail_({
        to: owner, name: 'PCW Freight Website',
        subject: 'New web booking ' + ref + ' - ' + PRODUCT_NAME[prod] + ' to ' + r.country,
        body: [
          'Reference: ' + ref,
          'Product: ' + PRODUCT_NAME[prod] + ' (' + r.type + ')',
          'Destination: ' + r.country,
          'Pieces / actual kg / chargeable kg: ' + r.pieces + ' / ' + r.actual_kg + ' / ' + (opt ? opt.chargeable_kg : '-'),
          'Published estimate: ' + price,
          'Payment: ' + ((b.__pay && b.__pay.mode) || 'Prepaid') + ((!b.__pay || b.__pay.mode === 'Prepaid') ? ' (do NOT request or book with the vendor until payment is marked as received)' : ''),
          'Shipper: ' + b.shipper_name + ' ' + (b.shipper_company || '') + ' | ' + email + ' | ' + normPhone_(b.shipper_whatsapp),
          'Pickup: ' + (b.pickup_or_dropoff || '') + ' ' + (b.pickup_city || '') + (outside ? ' (OUTSIDE JAKARTA - confirm pickup cost)' : ''),
          '',
          'Open the Sheet: Orders and Web_Bookings tabs.'
        ].join('\n')
      });
    }
    const id = b.lang === 'id'; const pre = !(b.__pay && b.__pay.mode && b.__pay.mode !== 'Prepaid');
    sendMail_({
      to: email, name: 'PCW Freight',
      subject: (id ? 'Permintaan booking diterima: ' : 'Booking request received: ') + ref,
      body: (id ? [
        'Terima kasih, permintaan booking Anda sudah kami terima.',
        '', 'Nomor referensi: ' + ref,
        'Layanan: PCW ' + PRODUCT_NAME[prod], 'Tujuan: ' + r.country,
        'Estimasi (published rate): ' + price,
        '', (pre ? 'PEMBAYARAN DI MUKA: mohon transfer setelah booking. Kiriman Anda kami proses (termasuk pemesanan ke jaringan pengangkut) setelah pembayaran kami terima. Tanpa pembayaran, kiriman tidak diproses. Bank Mandiri 1040006147347 a.n. PT Prabaswara Catur Widantara. Cantumkan nomor referensi ' + ref + ' pada berita transfer.' : 'Pembayaran sesuai termin yang disepakati.'), '', 'Tim kami akan mengonfirmasi berat, harga final, dan jadwal pickup sebelum pengiriman.',
        'Lacak kiriman: https://pcwfreight.com/track?ref=' + ref,
        'WhatsApp: +62 811 9989 6752', '', 'PCW Freight - PT Prabaswara Catur Widantara'
      ] : [
        'Thank you, we have received your booking request.',
        '', 'Reference: ' + ref,
        'Service: PCW ' + PRODUCT_NAME[prod], 'Destination: ' + r.country,
        'Estimate (published rate): ' + price,
        '', (pre ? 'PAYMENT UPFRONT: please transfer after booking. We process your shipment (including booking with the carrier network) only after we receive payment. Without payment the shipment is not processed. Bank Mandiri 1040006147347, account name PT Prabaswara Catur Widantara. Write reference ' + ref + ' in the transfer note.' : 'Payment follows the terms agreed with you.'), '', 'Our team will confirm final weight, price and pickup before shipping.',
        'Track: https://pcwfreight.com/track?ref=' + ref,
        'WhatsApp: +62 811 9989 6752', '', 'PCW Freight - PT Prabaswara Catur Widantara'
      ]).join('\n')
    });
  } catch (err) {
    console.error('mail failed', err); // booking is already saved; mail failure must not lose it
  }
}

/* ---------------- tracking emails + admin menu ---------------- */

/** Installable trigger (created by setup): emails the shipper when a Status is entered in Tracking. */
function onTrackingEdit(e) {
  if (!e || !e.range) return;
  const sheet = e.range.getSheet();
  if (sheet.getName() !== TABS.track || e.range.getColumn() !== 3 || e.range.getRow() < 2) return;
  const row = sheet.getRange(e.range.getRow(), 1, 1, 7).getValues()[0];
  const ref = String(row[0]).toUpperCase(), status = row[2];
  if (!ref || !status) return;
  const map = {};
  sh_(TABS.status).getDataRange().getValues().slice(1).forEach(function (r) { map[r[0]] = r; });
  const m = map[status];
  if (m && String(m[3]).toUpperCase() !== 'Y') return;
  const web = sh_(TABS.web).getDataRange().getValues();
  let email = '', lang = 'en';
  for (let i = 1; i < web.length; i++) if (String(web[i][0]).toUpperCase() === ref) { email = web[i][14]; lang = web[i][2]; break; }
  if (!email) return; // shipments not booked on the website get no automatic email
  const label = m ? (lang === 'id' ? m[2] : m[1]) : status;
  try {
    sendMail_({
      to: email, name: 'PCW Freight',
      subject: (lang === 'id' ? 'Update kiriman ' : 'Shipment update ') + ref + ': ' + label,
      body: (lang === 'id' ? 'Status kiriman ' : 'Status of shipment ') + ref + ': ' + label +
        (row[3] ? ' - ' + row[3] : '') + (row[5] ? '\n' + row[5] : '') +
        '\n\nhttps://pcwfreight.com/track?ref=' + ref + '\n\nPCW Freight - PT Prabaswara Catur Widantara'
    });
  } catch (err) { console.error(err); }
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('PCW Website')
    .addItem('Refresh website cache (after changing rates or settings)', 'refreshCache').addItem('Generate AWB for selected booking row', 'generateAwbForSelectedRow')
    .addToUi();
}

function refreshCache() {
  const cache = CacheService.getScriptCache();
  cache.removeAll(['settings', 'countries', 'r|loaded']);
  // rate groups expire within 6 hours; force reload now:
  const values = sh_(TABS.rates).getDataRange().getValues().slice(1);
  const keys = {};
  values.forEach(function (r) { if (r[0]) keys['r|' + r[0] + '|' + r[1] + '|' + r[2]] = 1; });
  cache.removeAll(Object.keys(keys));
  SpreadsheetApp.getActive().toast('Website cache refreshed.');
}

/** Run once from the editor: creates the tracking-email trigger and asks for permissions. */
function setup() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'onTrackingEdit') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('onTrackingEdit').forSpreadsheet(SpreadsheetApp.getActive()).onEdit().create();
  refreshCache();
  console.log('Setup done. Test rate: ' + JSON.stringify(rate_({ country: 'Japan', type: 'Parcel', kg: 5 })));
}
