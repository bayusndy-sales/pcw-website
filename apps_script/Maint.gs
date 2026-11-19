// Maintenance helpers that live in Untitled.gs in the Apps Script project. Run by hand from the editor, not routed from doPost/doGet.
function authDrive() { return fFolder_().getId(); }

// One-off bulk loader for Rates_Public from a CSV file named rates_import.csv in the owner's Drive; clears Rates_Public first.
function importRates() { const fi = DriveApp.getFilesByName('rates_import.csv'); if (!fi.hasNext()) throw new Error('rates_import.csv not found in Drive'); const t = fi.next().getBlob().getDataAsString(); const rows = Utilities.parseCsv(t); const hdr = rows.shift(); const out = rows.filter(function (x) { return x[0]; }).map(function (x) { return [x[0], x[1], x[2], Number(x[3]), Number(x[4]), Number(x[5]), Number(x[6])]; }); if (out.length < 20000) throw new Error('csv too short ' + out.length); const sh = sh_('Rates_Public'); sh.clearContents(); sh.getRange(1, 1, 1, 7).setValues([hdr]); sh.getRange(2, 1, out.length, 7).setValues(out); CacheService.getScriptCache().removeAll(['countries', 'r|loaded']); return out.length; }

// Clears cached rate lookups after Rates_Public changes.
function flushRates() { const v = sh_('Rates_Public').getDataRange().getValues(); const seen = {}; const keys = ['countries', 'r|loaded']; for (let i = 1; i < v.length; i++) { const k = 'r|' + v[i][0] + '|' + v[i][1] + '|' + v[i][2]; if (!seen[k]) { seen[k] = 1; keys.push(k); } } const c = CacheService.getScriptCache(); for (let i = 0; i < keys.length; i += 100) c.removeAll(keys.slice(i, i + 100)); return keys.length; }

// Nightly copy of the whole spreadsheet into the Drive folder "PCW Backups"; keeps the newest 14 copies (older copies go to Drive trash).
function backupSheet() {
  const fi = DriveApp.getFoldersByName('PCW Backups'); const f = fi.hasNext() ? fi.next() : DriveApp.createFolder('PCW Backups');
  const name = 'PCW Backup ' + Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');
  const ex = f.getFilesByName(name); if (ex.hasNext()) return 'exists';
  DriveApp.getFileById(SpreadsheetApp.getActive().getId()).makeCopy(name, f);
  const all = []; const it = f.getFiles(); while (it.hasNext()) { const x = it.next(); if (x.getName().indexOf('PCW Backup ') === 0) all.push(x); }
  all.sort(function (a, b) { return a.getName() < b.getName() ? 1 : -1; });
  all.slice(14).forEach(function (x) { x.setTrashed(true); });
  return all.length;
}
// Run once from the editor to schedule the nightly backup (about 02:30 Jakarta time).
function installTriggers() {
  ScriptApp.getProjectTriggers().forEach(function (t) { const h = t.getHandlerFunction(); if (h === 'backupSheet' || h === 'healthCheck') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('backupSheet').timeBased().atHour(2).nearMinute(30).everyDays(1).inTimezone(TZ).create();
  ScriptApp.newTrigger('healthCheck').timeBased().everyHours(1).create();
  return 'ok';
}

/** Run from the editor: compares published Priority vs Economy totals for every country at common weights.
 *  Writes a CSV to Drive folder "PCW Reports" and logs a summary. Read-only for rates. */
function priceAudit() {
  const W = [0.5, 1, 2, 3, 5, 10, 15, 20, 30], rows = [['Country', 'Kg', 'Priority_IDR', 'Economy_IDR', 'Economy_minus_Priority', 'Economy_higher']];
  const byKg = {}; let both = 0, worse = 0; const worseCountries = {};
  countries_().forEach(function (c) {
    W.forEach(function (kg) {
      const r = rate_({ country: c, type: 'Parcel', kg: kg, pieces: 1 }); if (!r.ok) return;
      const p = r.options.filter(function (o) { return o.product === 'Priority'; })[0], e = r.options.filter(function (o) { return o.product === 'Economy'; })[0];
      if (!p || !e || p.quote || e.quote) return;
      both++; const hi = e.total > p.total; if (hi) { worse++; (worseCountries[c] = worseCountries[c] || []).push(kg); }
      byKg[kg] = byKg[kg] || [0, 0]; byKg[kg][0]++; if (hi) byKg[kg][1]++;
      rows.push([c, kg, p.total, e.total, e.total - p.total, hi ? 'YES' : '']);
    });
  });
  const fi = DriveApp.getFoldersByName('PCW Reports'); const f = fi.hasNext() ? fi.next() : DriveApp.createFolder('PCW Reports');
  const name = 'PCW price audit Priority vs Economy ' + Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd') + '.csv';
  const file = f.createFile(name, rows.map(function (r) { return r.map(function (x) { return '"' + String(x).replace(/"/g, '""') + '"'; }).join(','); }).join('\n'), MimeType.CSV);
  const sum = 'Pairs priced both ways: ' + both + '; Economy higher than Priority: ' + worse + ' (' + Math.round(worse / Math.max(both, 1) * 1000) / 10 + '%)\nBy kg: ' +
    W.map(function (k) { const x = byKg[k] || [0, 0]; return k + 'kg ' + x[1] + '/' + x[0]; }).join(', ') + '\nCountries affected: ' + Object.keys(worseCountries).length + '\nFile: ' + file.getUrl();
  console.log(sum); console.log(JSON.stringify(worseCountries).slice(0, 3000)); return sum;
}
