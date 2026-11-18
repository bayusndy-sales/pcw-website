// Maintenance helpers that live in Untitled.gs in the Apps Script project. Run by hand from the editor, not routed from doPost/doGet.
function authDrive() { return fFolder_().getId(); }

// One-off bulk loader for Rates_Public from a CSV hosted on the site. Needs rates_import_tmp.csv at the web root; clears Rates_Public first.
function importRates() { const t = UrlFetchApp.fetch('https://pcwfreight.com/rates_import_tmp.csv?x=' + Date.now()).getContentText(); const rows = Utilities.parseCsv(t); const hdr = rows.shift(); const out = rows.filter(function (x) { return x[0]; }).map(function (x) { return [x[0], x[1], x[2], Number(x[3]), Number(x[4]), Number(x[5]), Number(x[6])]; }); if (out.length < 20000) throw new Error('csv too short ' + out.length); const sh = sh_('Rates_Public'); sh.clearContents(); sh.getRange(1, 1, 1, 7).setValues([hdr]); sh.getRange(2, 1, out.length, 7).setValues(out); CacheService.getScriptCache().removeAll(['countries', 'r|loaded']); return out.length; }

// Clears cached rate lookups after Rates_Public changes.
function flushRates() { const v = sh_('Rates_Public').getDataRange().getValues(); const seen = {}; const keys = ['countries', 'r|loaded']; for (let i = 1; i < v.length; i++) { const k = 'r|' + v[i][0] + '|' + v[i][1] + '|' + v[i][2]; if (!seen[k]) { seen[k] = 1; keys.push(k); } } const c = CacheService.getScriptCache(); for (let i = 0; i < keys.length; i += 100) c.removeAll(keys.slice(i, i + 100)); return keys.length; }
