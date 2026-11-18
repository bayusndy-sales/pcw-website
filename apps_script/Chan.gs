/* Channel auto-suggest. Vendor cost tables: FedEx IP publish (Indonesia export 2026), ICCL "Export Rate 2026 - PCW Freight" (15 Nov 2026),
   DHL Express Indonesia 2026 guide (non-document), Mars Smart Intl Aug 2026 R1. Costs are ex-fuel on own/ICCL accounts, compared all-in with fuel. */
const CH_D = JSON.parse(Utilities.ungzip(Utilities.newBlob(Utilities.base64Decode('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'), 'application/x-gzip')).getDataAsString());   // gzip+base64 of the cost tables
CH_D.C['Israel'] = ['E', 8, 'E', 'IL', 'ROW'];   // zones as Albania (DHL zone 8, Mars ROW); FedEx/ICCL zone E. Priority only.
const CH_FUEL_DEF = { fedex: 0.515, dhl: 0.50 };           // weekly figures [VERIFY]; override in Settings: Fuel_FedEx_Pct, Fuel_DHL_Pct
const CH_FX_DISC = 0.45, CH_DHL_DISC = 0.50;               // own FedEx 45% / own DHL 50% off publish (base only)

function chUp_(kg, step) { return Math.ceil(kg / step - 1e-9) * step; }
function chFxPub_(zone, kg) {
  const zi = 'ABCDEFG'.indexOf(zone); if (zi < 0) return null;
  if (kg <= 20.5) { const k = chUp_(kg, 0.5); const r = CH_D.FXM.filter(function (x) { return Math.abs(x[0] - k) < 1e-9; })[0]; return r ? r[1 + zi] : null; }
  const k = Math.ceil(kg); const bands = [['21-44', 21, 44], ['45-70', 45, 70], ['71-99', 71, 99], ['100-299', 100, 299], ['300-499', 300, 499], ['500-999', 500, 999]];
  for (let i = 0; i < bands.length; i++) if (k >= bands[i][1] && k <= bands[i][2]) { const r = CH_D.FXB.filter(function (x) { return x[0] === bands[i][0]; })[0]; return r ? r[1 + zi] * k : null; }
  return null;
}
function chIcPub_(zone, kg) {
  const zi = CH_D.ICZ.indexOf(zone); if (zi < 0) return null;
  if (kg <= 20.5) { const k = chUp_(kg, 0.5); const r = CH_D.ICM.filter(function (x) { return Math.abs(x[0] - k) < 1e-9; })[0]; return r ? r[1 + zi] : null; }
  const k = Math.ceil(kg); const bands = [['21-44', 21, 44], ['45-70', 45, 70], ['71-99', 71, 99], ['100-299', 100, 299], ['300-499', 300, 499], ['500-999', 500, 999], ['1000+', 1000, 1e9]];
  for (let i = 0; i < bands.length; i++) if (k >= bands[i][1] && k <= bands[i][2]) { const r = CH_D.ICB.filter(function (x) { return x[0] === bands[i][0]; })[0]; return r ? r[1 + zi] * k : null; }
  return null;
}
function chDhlPub_(zone, kg) {
  if (!(zone >= 1 && zone <= 8)) return null;
  if (kg <= 30) { const k = kg <= 10 ? chUp_(kg, 0.5) : Math.ceil(kg - 1e-9); const r = CH_D.DHN.filter(function (x) { return Math.abs(x[0] - k) < 1e-9; })[0]; return r ? r[zone] : null; }
  const row = CH_D.DHB[kg <= 70 ? 0 : 1]; return row ? row[zone - 1] * Math.ceil(kg) : null;
}
function chSmart_(key, kg) {
  const r = CH_D.SM[key]; if (!r) return null;
  const k = Math.max(1, Math.ceil(kg - 1e-9)); const t = k <= 1 ? 0 : k === 2 ? 1 : k <= 5 ? 2 : k <= 30 ? 3 : k <= 70 ? 4 : 5;
  return r[t] * k;
}

/** product: 'Priority'|'Economy' (as stored, 'Priority Express' etc.), country: site country name, kg: chargeable kg of the booking. */
function chanSuggest_(product, country, kg) {
  const s = settings_(); const c = CH_D.C[country];
  const fFx = Number(s.Fuel_FedEx_Pct) > 0 ? Number(s.Fuel_FedEx_Pct) : CH_FUEL_DEF.fedex;
  const fDh = Number(s.Fuel_DHL_Pct) > 0 ? Number(s.Fuel_DHL_Pct) : CH_FUEL_DEF.dhl;
  const out = { suggest: '', reason: '', flags: [], costs: {}, kg: kg };
  if (country === 'Israel') out.flags.push('Israel: confirm the Elevated Risk surcharge and the transit delay with the carrier before booking.');
  if (!c || !(kg > 0)) { out.reason = 'No rate data for this destination or weight. Choose a channel manually.'; return out; }
  const mars = chSmart_(c[4], kg);
  if (String(product).toLowerCase().indexOf('economy') === 0) {
    out.suggest = 'MARS'; out.reason = 'Economy always goes through Mars.'; if (mars) out.costs.MARS = Math.round(mars); return out;
  }
  const fx = c[0] ? chFxPub_(c[0], kg) : null, ic = c[2] ? chIcPub_(c[2], kg) : null, dh = c[1] ? chDhlPub_(c[1], kg) : null;
  if (fx) out.costs.FEDEX_OWN = Math.round(fx * (1 - CH_FX_DISC) * (1 + fFx));
  if (ic) out.costs.FEDEX_ICCL = Math.round(ic * (1 + fFx));
  if (dh) out.costs.DHL_OWN = Math.round(dh * (1 - CH_DHL_DISC) * (1 + fDh));
  const noSmart = ['Singapore', 'Malaysia (West)', 'Taiwan'].indexOf(country) > -1;
  if (kg > 20) {
    out.flags.push('Over 20 kg: check the FedEx Last Minute rate on the own FedEx account before booking.');
    if (!noSmart && mars) { out.costs.MARS = Math.round(mars); out.flags.push('Over 20 kg: also check the Mars Smart rate.'); }
    out.reason = 'Over 20 kg: no automatic pick. Compare the Last Minute rate' + (!noSmart ? ' and Mars Smart' : '') + ' with the figures below.';
    return out;
  }
  let best = '', bv = Infinity;
  ['FEDEX_OWN', 'FEDEX_ICCL', 'DHL_OWN'].forEach(function (k) { if (out.costs[k] && out.costs[k] < bv) { bv = out.costs[k]; best = k; } });
  if (!best) { out.reason = 'This destination is not in the FedEx, ICCL or DHL rate cards. Choose a channel manually.'; return out; }
  out.suggest = best; out.reason = 'Cheapest of own FedEx, FedEx via ICCL and own DHL (fuel included, 20 kg or less).';
  const missing = ['FEDEX_OWN', 'FEDEX_ICCL', 'DHL_OWN'].filter(function (k) { return !out.costs[k]; });
  if (missing.length) out.flags.push('No rate in the card for: ' + missing.join(', ') + '.');
  return out;
}

/* ---- weekly fuel settings (SuperAdmin) ---- */
const FUEL_FIELDS = [
  ['Fuel_Pct', 'Customer fuel on Priority price', 'PCW customer fuel on Priority base; reset monthly = highest carrier figure last 4 weeks + 1 point'],
  ['Fuel_FedEx_Pct', 'FedEx fuel (own account and ICCL)', 'Weekly FedEx fuel %, used only for the channel cost comparison'],
  ['Fuel_DHL_Pct', 'DHL fuel (own account)', 'Weekly DHL fuel %, used only for the channel cost comparison']
];
function fuelAge_() {
  const d = dateStr_(settings_().Fuel_Updated); if (!d) return { age: null, date: '' };
  return { age: Math.max(0, Math.floor((Date.now() - new Date(d + 'T00:00:00+07:00').getTime()) / 86400000)), date: d };
}
function admFuelGet_(b) {
  if (!adm_(b)) return { ok: false, error: 'session' };
  const s = settings_(), fu = fuelAge_();
  return { ok: true, updated: fu.date, age: fu.age, items: FUEL_FIELDS.map(function (f) {
    const v = Number(s[f[0]]); const def = f[0] === 'Fuel_FedEx_Pct' ? CH_FUEL_DEF.fedex : f[0] === 'Fuel_DHL_Pct' ? CH_FUEL_DEF.dhl : 0.51;
    return { key: f[0], label: f[1], value: v > 0 ? v : def };
  }) };
}
function admFuelSet_(b) {
  const u = adm_(b); if (!u) return { ok: false, error: 'session' };
  const vals = b.values || {}, upd = {};
  for (let i = 0; i < FUEL_FIELDS.length; i++) {
    const k = FUEL_FIELDS[i][0], n = Number(vals[k]);
    if (!(n >= 20 && n <= 100)) return { ok: false, error: 'invalid', field: FUEL_FIELDS[i][1] };
    upd[k] = Math.round(n * 10) / 1000;
  }
  const sh = sh_(TABS.settings), data = sh.getDataRange().getValues();
  const put = function (key, val, note, text) {
    let row = 0; for (let i = 1; i < data.length; i++) if (String(data[i][0]).trim() === key) { row = i + 1; break; }
    if (!row) { sh.appendRow([key, '', note || '']); row = sh.getLastRow(); data.push([key, '', note || '']); }
    const c = sh.getRange(row, 2); if (text) c.setNumberFormat('@'); c.setValue(val);
  };
  FUEL_FIELDS.forEach(function (f) { put(f[0], upd[f[0]], f[2]); });
  put('Fuel_Updated', Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd'), 'Date the fuel % was last confirmed (weekly)', true);
  CacheService.getScriptCache().remove('settings');
  audit_(u, 'fuel_set', Object.keys(upd).map(function (k) { return k + '=' + upd[k]; }).join(', '));
  return { ok: true };
}
