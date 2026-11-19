// Automatic health check: runs hourly (installTriggers) and after every deploy (run healthCheck in the editor).
// Emails the notification address when something breaks, and again when it is fixed.
var HEALTH_SITE = 'https://pcwfreight.com';

function hGet_(url) { return UrlFetchApp.fetch(url, { muteHttpExceptions: true, followRedirects: true }); }
function hJson_(res) { try { return JSON.parse(res.getContentText()); } catch (e) { return null; } }

function healthRun_() {
  var checks = [];
  function add(name, fn) {
    var ok = false, info = '';
    try { var r = fn(); ok = r === true; info = ok ? '' : String(r); } catch (e) { info = 'error: ' + e; }
    checks.push({ name: name, ok: ok, info: info.slice(0, 160) });
  }
  add('Home page', function () { var r = hGet_(HEALTH_SITE + '/'); return r.getResponseCode() === 200 && /PCW Freight/.test(r.getContentText()) || 'HTTP ' + r.getResponseCode(); });
  add('No IPv6 record on pcwfreight.com', function () { var j = hJson_(hGet_('https://dns.google/resolve?name=pcwfreight.com&type=AAAA')); return !!j && j.Status === 0 && !j.Answer || 'AAAA record present or DNS lookup failed: ' + JSON.stringify(j && j.Answer || j).slice(0, 100); });
  add('Analytics beacon on home page', function () { var r = hGet_(HEALTH_SITE + '/'); return r.getResponseCode() === 200 && /cloudflareinsights\.com\/beacon\.min\.js/.test(r.getContentText()) && /ad77f003755d4f6db246556c703bce6f/.test(r.getContentText()) || 'beacon or token missing on home page'; });
  add('Booking page has bot check', function () { var r = hGet_(HEALTH_SITE + '/book.html'); return r.getResponseCode() === 200 && /cf-turnstile/.test(r.getContentText()) || 'HTTP ' + r.getResponseCode() + ' or widget missing'; });
  add('Register page script has bot check', function () { var r = hGet_(HEALTH_SITE + '/assets/portal.js'); return r.getResponseCode() === 200 && /rgTs/.test(r.getContentText()) || 'HTTP ' + r.getResponseCode() + ' or widget missing'; });
  add('Booking script sends bot token', function () { var r = hGet_(HEALTH_SITE + '/assets/app.js'); return r.getResponseCode() === 200 && /cf-turnstile-response/.test(r.getContentText()) && /action:\s*["']bt["']/.test(r.getContentText()) || 'token code missing'; });
  // Web-app logic is called directly: Apps Script calling its own /exec URL can hang.
  add('Countries list', function () { var c = countries_(); return c.length > 100 || 'got ' + c.length + ' countries'; });
  add('Rate quote (Singapore 1 kg)', function () { var j = rate_({ country: 'Singapore', type: 'Parcel', kg: 1, pieces: 1 }); return j && j.ok && j.options && j.options.length > 0 || 'got ' + JSON.stringify(j).slice(0, 100); });
  add('Bot token', function () { return /^\d+\./.test(botToken_()) || 'no token'; });
  add('Turnstile enforced', function () { var j = register_({ action: 'register', email: 'health-check@example.com' }); return j && j.error === 'bot_check_failed' || 'got ' + JSON.stringify(j).slice(0, 100); });
  add('Website country list matches rates table', function () {
    var m = hGet_(HEALTH_SITE + '/assets/app.js').getContentText().match(/\["Albania"[^\]]*\]/); if (!m) return 'list not found in app.js';
    var site = JSON.parse(m[0]), live = countries_();
    var miss = live.filter(function (c) { return site.indexOf(c) < 0; }), extra = site.filter(function (c) { return live.indexOf(c) < 0; });
    return !miss.length && !extra.length || 'missing on website: ' + (miss.join(', ') || '-') + '; not in rates: ' + (extra.join(', ') || '-');
  });
  add('Mail relay alive and paired', function () {
    var r = UrlFetchApp.fetch(HEALTH_SITE + '/mailrelay.php', { method: 'post', contentType: 'application/json', payload: '{}', muteHttpExceptions: true });
    return r.getResponseCode() === 403 && /"sig"/.test(r.getContentText()) || 'HTTP ' + r.getResponseCode() + ' ' + r.getContentText().slice(0, 80);
  });
  add('Fuel % updated in last 7 days', function () { var f = fuelAge_(); return f.age !== null && f.age <= 7 || 'last update ' + (f.date || 'never') + ' (' + f.age + ' days ago): update the weekly fuel form in Admin'; });
  add('Rates table loaded', function () { var n = sh_('Rates_Public').getLastRow(); return n > 20000 || 'only ' + n + ' rows'; });
  add('Nightly backup', function () {
    var fi = DriveApp.getFoldersByName('PCW Backups'); if (!fi.hasNext()) return 'folder missing';
    var f = fi.next(), d = new Date(), names = [];
    if (Number(Utilities.formatDate(d, TZ, 'H')) < 3) d = new Date(d.getTime() - 864e5);
    names.push('PCW Backup ' + Utilities.formatDate(d, TZ, 'yyyy-MM-dd'), 'PCW Backup ' + Utilities.formatDate(new Date(d.getTime() - 864e5), TZ, 'yyyy-MM-dd'));
    return names.some(function (n) { return f.getFilesByName(n).hasNext(); }) || 'no backup for ' + names[0] + ' or the day before';
  });
  return checks;
}

/** Run from the editor after any deploy, or by the hourly trigger. Returns a text report. */
function healthCheck() {
  var checks = healthRun_(), bad = checks.filter(function (c) { return !c.ok; });
  var report = checks.map(function (c) { return (c.ok ? 'OK    ' : 'FAIL  ') + c.name + (c.info ? ' - ' + c.info : ''); }).join('\n');
  console.log(report);
  var pr = PropertiesService.getScriptProperties();
  var key = bad.map(function (c) { return c.name; }).join('|'), last = pr.getProperty('HEALTH_LAST') || '', lastAt = Number(pr.getProperty('HEALTH_ALERT_AT') || 0);
  var to = settings_().Notify_Email;
  if (key && (key !== last || Date.now() - lastAt > 6 * 3600e3)) {
    sendMail_({ to: to, subject: 'PCW website problem: ' + bad.length + ' check(s) failing', body: 'The hourly website check found a problem.\n\n' + report + '\n\nThis alert repeats every 6 hours while the problem lasts. Run healthCheck in Apps Script to re-test.' });
    pr.setProperty('HEALTH_ALERT_AT', String(Date.now()));
  } else if (!key && last) {
    sendMail_({ to: to, subject: 'PCW website: all checks OK again', body: 'All website checks pass again.\n\n' + report });
  }
  pr.setProperty('HEALTH_LAST', key);
  return report;
}
