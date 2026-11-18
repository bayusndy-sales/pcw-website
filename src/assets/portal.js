(function () {
  'use strict';
  var API = 'https://script.google.com/macros/s/AKfycbx3QvkVLyrTEZWld-RjGroQJ181qxhoGKQ7XODdqD-5IXV2bLLTdDn_Q7AxbUR4oWn3Sw/exec';
  var ID = document.documentElement.lang === 'id', ROOT = document.body.getAttribute('data-root') || '', BASE = ROOT + (ID ? 'id/' : '');
  var COUNTRIES = ["Australia","Canada","China","France","Germany","Hong Kong","India","Italy","Japan","Malaysia (West)","Netherlands","New Zealand","Philippines","Saudi Arabia","Singapore","South Korea","Spain","Taiwan","Thailand","United Arab Emirates","United Kingdom","United States","Vietnam"];
  var WA = '6281199896752';
  function t(en, id) { return ID ? id : en; }
  function $(s, e) { return (e || document).querySelector(s); }
  function $$(s, e) { return Array.prototype.slice.call((e || document).querySelectorAll(s)); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function idr(n) { return 'Rp ' + Number(n).toLocaleString('id-ID'); }
  function post(b) { b.lang = ID ? 'id' : 'en'; return fetch(API, { method: 'POST', body: JSON.stringify(b) }).then(function (r) { return r.json(); }); }
  function store(k, v) { try { if (v === null) sessionStorage.removeItem(k); else if (v !== undefined) sessionStorage.setItem(k, v); return sessionStorage.getItem(k); } catch (e) { return null; } }
  function notice(kind, msg) { return '<div class="notice ' + kind + '">' + msg + '</div>'; }
  function busy(btn, on, label) { if (on) { btn._l = btn.innerHTML; btn.disabled = true; btn.innerHTML = '<span class="spin"></span> ' + (label || ''); } else { btn.disabled = false; if (btn._l) btn.innerHTML = btn._l; } }
  var ERR = {
    invalid_login: t('Email or password is incorrect.', 'Email atau password salah.'),
    invalid_code: t('The code is incorrect or expired.', 'Kode salah atau kedaluwarsa.'),
    too_many_requests: t('Too many attempts. Please wait a while and try again.', 'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.'),
    weak_password: t('Password must be at least 10 characters.', 'Password minimal 10 karakter.'),
    missing_fields: t('Please complete all fields.', 'Lengkapi semua kolom.'),
    invalid_whatsapp: t('Please enter a valid WhatsApp number.', 'Masukkan nomor WhatsApp yang valid.'),
    consent_required: t('Please accept the Terms and Privacy Policy.', 'Mohon setujui Syarat dan Kebijakan Privasi.'),
    bot_check_failed: t('Verification failed. Reload the page and try again.', 'Verifikasi gagal. Muat ulang halaman lalu coba lagi.'),
    cannot_disable_self: t('You cannot disable your own account.', 'Anda tidak dapat menonaktifkan akun sendiri.'),
    economy_pickup_outside_jakarta: t('Economy pickup outside Jakarta is arranged by request.', 'Pickup Economy di luar Jakarta diatur melalui permintaan.'),
    po_box_not_accepted: t('PO Box addresses cannot be delivered.', 'Alamat PO Box tidak dapat dikirimi.'),
    country_not_listed: t('This destination is not on the published list. Contact us for a quote.', 'Tujuan ini belum ada di daftar. Hubungi kami untuk penawaran.')
  };
  function err(r) { return ERR[r && r.error] || (r && r.error === 'missing_fields' ? ERR.missing_fields : t('Something went wrong. Try again or contact us on WhatsApp.', 'Terjadi kendala. Coba lagi atau hubungi kami lewat WhatsApp.')); }
  function fld(n, label, typ, req, extra) { return '<div><label' + (req === false ? '' : ' class="req"') + '>' + label + '</label><input name="' + n + '" type="' + (typ || 'text') + '"' + (req === false ? '' : ' required') + ' ' + (extra || '') + '></div>'; }
  function opts(list, sel) { return list.map(function (c) { return '<option value="' + esc(c) + '"' + (c === sel ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join(''); }
  function wl(text) { return 'https://wa.me/' + WA + '?text=' + encodeURIComponent(text); }
  var TH = 'text-align:left;padding:8px;border-bottom:2px solid #ccd;white-space:nowrap', TD = 'padding:8px;border-bottom:1px solid #e3e6ee;vertical-align:top';
  function table(cols, rows) { return '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:.92rem"><thead><tr>' + cols.map(function (c) { return '<th style="' + TH + '">' + c + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>'; }
  function tr(cells) { return '<tr>' + cells.map(function (c) { return '<td style="' + TD + '">' + c + '</td>'; }).join('') + '</tr>'; }
  function tabs(el, names, onShow) {
    var bar = document.createElement('div'); bar.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;margin:16px 0';
    names.forEach(function (n, i) { var b = document.createElement('button'); b.type = 'button'; b.className = 'btn btn-o btn-sm'; b.textContent = n[1]; b.setAttribute('data-t', n[0]); b.onclick = function () { go(n[0]); }; bar.appendChild(b); });
    el.appendChild(bar);
    function go(k) { $$('button', bar).forEach(function (b) { var on = b.getAttribute('data-t') === k; b.className = 'btn btn-sm ' + (on ? 'btn-a' : 'btn-o'); }); $$('[data-pane]', el).forEach(function (p) { p.classList.toggle('hidden', p.getAttribute('data-pane') !== k); }); if (onShow) onShow(k); }
    return go;
  }

  /* ---------- REGISTER ---------- */
  var rg = $('#rgRoot');
  if (rg) {
    rg.innerHTML = '<div id="rgMsg"></div>' +
      '<form id="rgForm" class="box" style="max-width:560px" novalidate><h2 style="margin-top:0">' + t('Create your account', 'Buat akun Anda') + '</h2>' +
      '<input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      fld('company', t('Company or full name', 'Nama perusahaan atau nama lengkap'), 'text', true, 'autocomplete="organization"') +
      '<div style="margin-top:14px">' + fld('name', t('Contact name', 'Nama kontak'), 'text', true, 'autocomplete="name"') + '</div>' +
      '<div style="margin-top:14px">' + fld('email', 'Email', 'email', true, 'autocomplete="email"') + '</div>' +
      '<div style="margin-top:14px">' + fld('phone', t('WhatsApp number', 'Nomor WhatsApp'), 'tel', true, 'placeholder="0811…" autocomplete="tel"') + '</div>' +
      '<div style="margin-top:14px">' + fld('password', 'Password', 'password', true, 'minlength="10" autocomplete="new-password"') + '<p class="hint">' + t('At least 10 characters.', 'Minimal 10 karakter.') + '</p></div>' +
      '<div>' + fld('password2', t('Repeat password', 'Ulangi password'), 'password', true, 'autocomplete="new-password"') + '</div>' +
      '<label class="check" style="margin-top:14px"><input type="checkbox" name="terms"><span>' + t('I accept the <a href="terms.html" target="_blank">Terms &amp; Conditions</a>.', 'Saya menyetujui <a href="terms.html" target="_blank">Syarat &amp; Ketentuan</a>.') + '</span></label>' +
      '<label class="check"><input type="checkbox" name="privacy"><span>' + t('I agree to the <a href="privacy.html" target="_blank">Privacy Policy</a>.', 'Saya setuju dengan <a href="privacy.html" target="_blank">Kebijakan Privasi</a>.') + '</span></label>' +
      '<button class="btn btn-a" type="submit" style="margin-top:14px;padding:14px;width:100%">' + t('Create account', 'Buat akun') + '</button>' +
      '<p class="hint">' + t('Already registered? ', 'Sudah punya akun? ') + '<a href="portal.html">' + t('Sign in', 'Masuk') + '</a></p></form>' +
      '<form id="rgVerify" class="box hidden" style="max-width:460px"><h2 style="margin-top:0">' + t('Verify your email', 'Verifikasi email Anda') + '</h2><p id="rgSent"></p>' +
      fld('code', t('6-digit code', 'Kode 6 digit'), 'text', true, 'inputmode="numeric" maxlength="6" autocomplete="one-time-code"') +
      '<button class="btn btn-a" type="submit" style="margin-top:14px">' + t('Verify', 'Verifikasi') + '</button></form>' +
      '<div id="rgDone" class="hidden box" style="max-width:460px"></div>';
    var rf = $('#rgForm'), rv = $('#rgVerify'), rm = $('#rgMsg'), remail = '';
    rf.addEventListener('submit', function (ev) {
      ev.preventDefault(); var e = rf.elements, btn = $('[type=submit]', rf); rm.innerHTML = '';
      if (e.password.value !== e.password2.value) { rm.innerHTML = notice('err', t('Passwords do not match.', 'Password tidak sama.')); return; }
      if (!e.terms.checked || !e.privacy.checked) { rm.innerHTML = notice('err', ERR.consent_required); return; }
      busy(btn, true, t('Sending…', 'Mengirim…'));
      post({ action: 'register', website: e.website.value, company: e.company.value.trim(), name: e.name.value.trim(), email: e.email.value.trim(), phone: e.phone.value.trim(), password: e.password.value, terms_accepted: true, privacy_consent: true }).then(function (r) {
        busy(btn, false);
        if (!r.ok) { rm.innerHTML = notice('err', err(r)); return; }
        remail = e.email.value.trim().toLowerCase(); rf.classList.add('hidden'); rv.classList.remove('hidden');
        $('#rgSent').textContent = t('We sent a 6-digit code to ', 'Kami mengirim kode 6 digit ke ') + remail + t('. It is valid for 30 minutes. Check your spam folder if needed.', '. Berlaku 30 menit. Cek folder spam bila perlu.');
      }).catch(function () { busy(btn, false); rm.innerHTML = notice('err', err()); });
    });
    rv.addEventListener('submit', function (ev) {
      ev.preventDefault(); var btn = $('[type=submit]', rv); rm.innerHTML = ''; busy(btn, true);
      post({ action: 'verify', email: remail, code: rv.elements.code.value.trim() }).then(function (r) {
        busy(btn, false);
        if (!r.ok) { rm.innerHTML = notice('err', err(r)); return; }
        rv.classList.add('hidden'); var d = $('#rgDone'); d.classList.remove('hidden');
        d.innerHTML = '<h2 style="margin-top:0">' + t('Account ready', 'Akun siap') + '</h2><p>' + t('Your account is active. Sign in to check rates, book and track shipments.', 'Akun Anda aktif. Masuk untuk cek tarif, booking, dan lacak kiriman.') + '</p><a class="btn btn-a" href="portal.html">' + t('Sign in', 'Masuk') + '</a>';
      }).catch(function () { busy(btn, false); rm.innerHTML = notice('err', err()); });
    });
  }

  /* ---------- CUSTOMER PORTAL ---------- */
  var root = $('#pRoot');
  if (root) {
    var ME = null, ITEMS = [], PREFILL = null;
    function renderLogin(msg) {
      root.innerHTML = (msg || '') + '<form id="lf" class="box" style="max-width:460px"><h2 style="margin-top:0">' + t('Sign in', 'Masuk') + '</h2><div id="lm"></div>' +
        fld('email', 'Email', 'email', true, 'autocomplete="username"') + '<div style="margin-top:14px">' + fld('password', 'Password', 'password', true, 'autocomplete="current-password"') + '</div>' +
        '<button class="btn btn-a" type="submit" style="margin-top:14px;width:100%;padding:14px">' + t('Sign in', 'Masuk') + '</button>' +
        '<p class="hint"><a href="#" id="fg">' + t('Forgot password?', 'Lupa password?') + '</a> · <a href="register.html">' + t('Create an account', 'Buat akun') + '</a></p></form>';
      $('#fg').onclick = function (e) { e.preventDefault(); renderReset(); };
      $('#lf').addEventListener('submit', function (ev) {
        ev.preventDefault(); var f = ev.target, btn = $('[type=submit]', f); busy(btn, true);
        post({ action: 'login', email: f.elements.email.value.trim(), password: f.elements.password.value }).then(function (r) {
          busy(btn, false);
          if (!r.ok) { $('#lm').innerHTML = notice('err', err(r)); return; }
          if (r.otp) { $('#lm').innerHTML = notice('err', t('Use the admin sign-in page.', 'Gunakan halaman login admin.')); return; }
          store('pt', r.token); ME = r.user; renderApp();
        }).catch(function () { busy(btn, false); $('#lm').innerHTML = notice('err', err()); });
      });
    }
    function renderReset() {
      root.innerHTML = '<form id="rq" class="box" style="max-width:460px"><h2 style="margin-top:0">' + t('Reset password', 'Reset password') + '</h2><div id="rm"></div>' + fld('email', 'Email', 'email', true) +
        '<button class="btn btn-a" type="submit" style="margin-top:14px">' + t('Send code', 'Kirim kode') + '</button> <a href="#" id="bk">' + t('Back', 'Kembali') + '</a></form>' +
        '<form id="rd" class="box hidden" style="max-width:460px"><div id="rm2"></div>' + fld('code', t('6-digit code from email', 'Kode 6 digit dari email'), 'text', true, 'inputmode="numeric" maxlength="6"') +
        '<div style="margin-top:14px">' + fld('password', t('New password (min 10 characters)', 'Password baru (min 10 karakter)'), 'password', true, 'minlength="10" autocomplete="new-password"') + '</div>' +
        '<button class="btn btn-a" type="submit" style="margin-top:14px">' + t('Set new password', 'Atur password baru') + '</button></form>';
      $('#bk').onclick = function (e) { e.preventDefault(); renderLogin(); };
      var em = '';
      $('#rq').addEventListener('submit', function (ev) { ev.preventDefault(); em = ev.target.elements.email.value.trim().toLowerCase(); post({ action: 'reset_req', email: em }).then(function () { $('#rq').classList.add('hidden'); $('#rd').classList.remove('hidden'); $('#rm2').innerHTML = notice('info', t('If the email is registered, a code is on its way.', 'Jika email terdaftar, kode sedang dikirim.')); }).catch(function () { $('#rm').innerHTML = notice('err', err()); }); });
      $('#rd').addEventListener('submit', function (ev) { ev.preventDefault(); var f = ev.target; post({ action: 'reset_do', email: em, code: f.elements.code.value.trim(), password: f.elements.password.value }).then(function (r) { if (!r.ok) { $('#rm2').innerHTML = notice('err', err(r)); return; } renderLogin(notice('ok', t('Password updated. Please sign in.', 'Password diperbarui. Silakan masuk.'))); }).catch(function () { $('#rm2').innerHTML = notice('err', err()); }); });
    }
    function expired() { store('pt', null); ME = null; renderLogin(notice('warn', t('Session expired. Please sign in again.', 'Sesi berakhir. Silakan masuk lagi.'))); }
    function renderApp() {
      var plan = ME.plan === 'member' ? t('Member rates', 'Tarif member') : t('Published rates', 'Published rate');
      root.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px"><div><h2 style="margin:0">' + esc(ME.company) + '</h2><span class="hint">' + esc(ME.name) + ' · ' + esc(ME.email) + ' · ' + plan + '</span></div><button id="so" class="btn btn-o" type="button">' + t('Sign out', 'Keluar') + '</button></div>' +
        '<div data-pane="dash"><div id="dB"></div></div>' +
        '<div data-pane="rates"></div><div data-pane="new"></div><div data-pane="ship"></div><div data-pane="prof"></div>';
      $('#so').onclick = function () { post({ action: 'logout', token: store('pt') }); store('pt', null); ME = null; renderLogin(); };
      var go = tabs(root, [['dash', t('Dashboard', 'Dashboard')], ['rates', t('Rates', 'Tarif')], ['new', t('New shipment', 'Kiriman baru')], ['ship', t('Shipments', 'Kiriman')], ['prof', t('Profile', 'Profil')]], function (k) { if (k === 'dash' || k === 'ship') loadList(); });
      // move tab bar right after header
      root.insertBefore(root.lastChild, root.children[1]);
      buildRates(); buildNew(); buildProfile(); window._go = go; go('dash');
    }
    function loadList() {
      post({ action: 'list_m', token: store('pt') }).then(function (r) {
        if (!r.ok) { if (r.error === 'session') return expired(); return; }
        ITEMS = r.items || []; renderDash(); renderShip();
      });
    }
    function renderDash() {
      var n = ITEMS.length, dl = ITEMS.filter(function (i) { return /deliver/i.test(i.status); }).length, tr_ = n - dl;
      var box = function (v, l) { return '<div class="box" style="text-align:center"><div style="font-size:2rem;font-weight:800;color:var(--blue)">' + v + '</div><div class="hint">' + l + '</div></div>'; };
      $('#dB').innerHTML = '<div class="row r3">' + box(n, t('Total shipments', 'Total kiriman')) + box(tr_, t('In progress', 'Dalam proses')) + box(dl, t('Delivered', 'Terkirim')) + '</div>' +
        '<div style="margin:16px 0;display:flex;gap:10px;flex-wrap:wrap"><button class="btn btn-a" type="button" data-g="new">' + t('New shipment', 'Kiriman baru') + '</button><button class="btn btn-o" type="button" data-g="rates">' + t('Check rates', 'Cek tarif') + '</button><a class="btn btn-o" href="track.html">' + t('Track a shipment', 'Lacak kiriman') + '</a></div>' +
        '<h3>' + t('Recent shipments', 'Kiriman terbaru') + '</h3>' + shipTable(ITEMS.slice(0, 5));
      $$('[data-g]', root).forEach(function (b) { b.onclick = function () { window._go(b.getAttribute('data-g')); }; });
    }
    function shipTable(items) {
      if (!items.length) return '<p>' + t('No shipments yet.', 'Belum ada kiriman.') + '</p>';
      return table([t('Ref', 'Ref'), t('Date', 'Tanggal'), t('Service', 'Layanan'), t('Destination', 'Tujuan'), 'Kg', t('Receiver', 'Penerima'), 'Status', ''],
        items.map(function (i) { return tr([esc(i.ref), esc(i.date), esc(i.product), esc(i.dest), esc(i.kg), esc(i.to), esc(i.status), '<a href="' + BASE + 'track.html?ref=' + encodeURIComponent(i.ref) + '">' + t('Track', 'Lacak') + '</a>']); }));
    }
    function renderShip() {
      var p = $('[data-pane=ship]', root); if (!p) return;
      var q = ($('#sq', p) || {}).value || '';
      if (!$('#sq', p)) { p.innerHTML = '<h3>' + t('Your shipments', 'Kiriman Anda') + '</h3><input id="sq" placeholder="' + t('Filter by reference, country or receiver', 'Filter ref, negara, atau penerima') + '" style="max-width:420px"><div id="sl" style="margin-top:12px"></div>'; $('#sq', p).oninput = renderShip; }
      var qq = $('#sq', p).value.toLowerCase();
      $('#sl', p).innerHTML = shipTable(ITEMS.filter(function (i) { return !qq || (i.ref + ' ' + i.dest + ' ' + i.to + ' ' + i.status).toLowerCase().indexOf(qq) > -1; }));
    }
    function buildRates() {
      var p = $('[data-pane=rates]', root);
      p.innerHTML = '<form id="rf" class="box"><h3 style="margin-top:0">' + t('Check rates', 'Cek tarif') + '</h3><div class="row r3"><div><label class="req">' + t('Destination', 'Tujuan') + '</label><select name="country" required>' + opts(COUNTRIES) + '</select></div>' +
        '<div><label>' + t('Type', 'Jenis') + '</label><select name="type"><option value="Parcel">' + t('Parcel', 'Paket') + '</option><option value="Document">' + t('Document', 'Dokumen') + '</option></select></div>' +
        fld('pieces', t('Pieces', 'Koli'), 'number', true, 'min="1" max="50" value="1"') + '</div><div class="row r4" style="margin-top:14px">' + fld('kg', t('Weight (kg)', 'Berat (kg)'), 'number', true, 'min="0.1" step="0.1"') +
        fld('l', t('L (cm)', 'P (cm)'), 'number', false, 'min="0" step="0.1"') + fld('w', t('W (cm)', 'L (cm)'), 'number', false, 'min="0" step="0.1"') + fld('h', t('H (cm)', 'T (cm)'), 'number', false, 'min="0" step="0.1"') + '</div>' +
        '<button class="btn btn-a" type="submit" style="margin-top:14px">' + t('Get rate', 'Lihat tarif') + '</button><p class="hint">' + t('Chargeable weight is the higher of actual and volumetric weight (L × W × H ÷ 5000). Remote area, duties and taxes are extra where applicable.', 'Berat tagih adalah yang lebih besar antara berat aktual dan volumetrik (P × L × T ÷ 5000). Remote area, bea, dan pajak dikenakan terpisah bila berlaku.') + '</p></form><div id="ro" style="margin-top:14px"></div>';
      $('#rf').addEventListener('submit', function (ev) {
        ev.preventDefault(); var f = ev.target, btn = $('[type=submit]', f), o = $('#ro'); busy(btn, true);
        var b = { action: 'rate_m', token: store('pt') }; ['country', 'type', 'pieces', 'kg', 'l', 'w', 'h'].forEach(function (k) { b[k] = f.elements[k].value; });
        post(b).then(function (r) {
          busy(btn, false);
          if (!r.ok) { if (r.error === 'session') return expired(); o.innerHTML = notice('err', err(r)); return; }
          o.innerHTML = '<div class="box"><div class="hint">' + esc(r.country) + ' · ' + r.pieces + ' ' + t('pc', 'koli') + ' · ' + t('actual', 'aktual') + ' ' + r.actual_kg + ' kg' + (r.volumetric_kg ? ' · ' + t('volumetric', 'volumetrik') + ' ' + r.volumetric_kg + ' kg' : '') + '</div>' +
            table([t('Service', 'Layanan'), t('Chargeable', 'Berat tagih'), t('Base', 'Dasar'), t('Fuel', 'Fuel'), t('Total', 'Total'), ''], r.options.map(function (op) {
              var nm = 'PCW ' + op.product + ' Express';
              if (op.quote) return tr([nm, op.chargeable_kg + ' kg', { colspan: 0 } && '', '', '<em>' + t('Quote needed', 'Perlu penawaran') + '</em>', '<a class="btn btn-o btn-sm" href="' + wl('Hello PCW, I would like a quote: ' + r.country + ', ' + op.chargeable_kg + ' kg, ' + nm) + '">WhatsApp</a>']);
              return tr([nm, op.chargeable_kg + ' kg', idr(op.base), idr(op.fuel), '<strong>' + idr(op.total) + '</strong>', '<button class="btn btn-a btn-sm" type="button" data-bk="' + op.product + '">' + t('Book', 'Booking') + '</button>']);
            })) + '<p class="hint">' + (r.plan === 'member' ? t('Your member rate. ', 'Tarif member Anda. ') : t('Published rate. ', 'Published rate. ')) + t('Final price is confirmed after weighing.', 'Harga final dikonfirmasi setelah penimbangan.') + '</p></div>';
          $$('[data-bk]', o).forEach(function (bt) { bt.onclick = function () { PREFILL = { product: bt.getAttribute('data-bk'), country: r.country, type: r.type, pieces: r.pieces, kg: r.actual_kg, l: f.elements.l.value, w: f.elements.w.value, h: f.elements.h.value }; fillNew(); window._go('new'); }; });
        }).catch(function () { busy(btn, false); o.innerHTML = notice('err', err()); });
      });
    }
    function buildNew() {
      var p = $('[data-pane=new]', root);
      p.innerHTML = '<form id="nf" class="box" novalidate><input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true"><h3 style="margin-top:0">' + t('New shipment', 'Kiriman baru') + '</h3>' +
        '<div class="row r2"><div><label class="req">' + t('Service', 'Layanan') + '</label><select name="product"><option value="Priority">PCW Priority Express</option><option value="Economy">PCW Economy Express</option></select></div><div><label class="req">' + t('Destination country', 'Negara tujuan') + '</label><select name="dest_country" required><option value="">…</option>' + opts(COUNTRIES) + '</select></div></div>' +
        '<div class="row r3" style="margin-top:14px"><div><label>' + t('Type', 'Jenis') + '</label><select name="shipment_type"><option value="Parcel">' + t('Parcel', 'Paket') + '</option><option value="Document">' + t('Document', 'Dokumen') + '</option></select></div>' + fld('pieces', t('Pieces', 'Jumlah koli'), 'number', true, 'min="1" max="50" value="1"') + fld('actual_kg', t('Total weight (kg)', 'Total berat (kg)'), 'number', true, 'min="0.1" step="0.1"') + '</div>' +
        '<div class="row r3" style="margin-top:14px">' + fld('l', t('Length (cm)', 'Panjang (cm)'), 'number', false, 'min="0" step="0.1"') + fld('w', t('Width (cm)', 'Lebar (cm)'), 'number', false, 'min="0" step="0.1"') + fld('h', t('Height (cm)', 'Tinggi (cm)'), 'number', false, 'min="0" step="0.1"') + '</div>' +
        '<h3 style="margin:22px 0 10px">' + t('Shipper and handover', 'Pengirim dan serah terima') + '</h3><div class="row r2">' + fld('shipper_name', t('Contact name', 'Nama kontak')) + fld('shipper_whatsapp', t('WhatsApp number', 'Nomor WhatsApp'), 'tel', true, 'placeholder="0811…"') + '</div>' +
        '<div class="row r2" style="margin-top:14px"><div><label>' + t('Handover', 'Serah terima') + '</label><select name="pickup_or_dropoff"><option value="Pickup">Pickup</option><option value="Drop-off">Drop-off</option></select></div>' + fld('pickup_date', t('Preferred pickup date', 'Tanggal pickup'), 'date', false) + '</div>' +
        '<div style="margin-top:14px"><label>' + t('Pickup address (if Pickup)', 'Alamat pickup (jika Pickup)') + '</label><textarea name="pickup_address"></textarea></div>' +
        '<div class="row r2" style="margin-top:14px">' + fld('pickup_city', t('Pickup city', 'Kota pickup'), 'text', false) + fld('pickup_postcode', t('Postcode', 'Kode pos'), 'text', false) + '</div>' +
        '<h3 style="margin:22px 0 10px">' + t('Receiver', 'Penerima') + '</h3><div class="row r2">' + fld('consignee_name', t('Receiver name', 'Nama penerima')) + fld('consignee_company', t('Company', 'Perusahaan'), 'text', false) + '</div>' +
        '<div style="margin-top:14px"><label class="req">' + t('Receiver address (no PO Box)', 'Alamat penerima (bukan PO Box)') + '</label><textarea name="consignee_address" required></textarea></div>' +
        '<div class="row r3" style="margin-top:14px">' + fld('consignee_city', t('City', 'Kota')) + fld('consignee_postcode', t('Postcode', 'Kode pos'), 'text', false) + fld('consignee_phone', t('Receiver phone', 'Telepon penerima'), 'tel') + '</div>' +
        '<div style="margin-top:14px">' + fld('consignee_email', 'Receiver email', 'email') + '</div>' +
        '<h3 style="margin:22px 0 10px">' + t('Contents', 'Isi kiriman') + '</h3><div><label class="req">' + t('Contents description (in English)', 'Deskripsi isi (bahasa Inggris)') + '</label><textarea name="contents" required maxlength="200"></textarea></div>' +
        '<div style="margin-top:14px">' + fld('declared_value', t('Total declared value (IDR)', 'Total nilai barang (IDR)'), 'text', true, 'inputmode="numeric"') + '</div>' +
        '<label class="check" style="margin-top:14px"><input type="checkbox" name="opt_insurance"><span>' + t('Insurance', 'Asuransi') + '</span></label><label class="check"><input type="checkbox" name="opt_signature"><span>' + t('Signature on delivery', 'Tanda tangan saat pengantaran') + '</span></label><label class="check"><input type="checkbox" name="opt_ddp"><span>DDP</span></label>' +
        '<div style="margin-top:14px"><label class="check"><input type="checkbox" name="no_prohibited"><span>' + t('No <a href="prohibited-items.html" target="_blank">prohibited or restricted items</a>; description and value are true.', 'Tidak ada <a href="prohibited-items.html" target="_blank">barang terlarang atau terbatas</a>; deskripsi dan nilai benar.') + '</span></label>' +
        '<label class="check"><input type="checkbox" name="terms_accepted"><span>' + t('I accept the <a href="terms.html" target="_blank">Terms &amp; Conditions</a>.', 'Saya menyetujui <a href="terms.html" target="_blank">Syarat &amp; Ketentuan</a>.') + '</span></label>' +
        '<label class="check"><input type="checkbox" name="privacy_consent"><span>' + t('I agree to the <a href="privacy.html" target="_blank">Privacy Policy</a>.', 'Saya setuju dengan <a href="privacy.html" target="_blank">Kebijakan Privasi</a>.') + '</span></label></div>' +
        '<button class="btn btn-a" type="submit" style="margin-top:18px;padding:15px">' + t('Send booking request', 'Kirim permintaan booking') + '</button><p class="hint">' + t('Our team confirms weight and price, then issues the AWB.', 'Tim kami mengonfirmasi berat dan harga, lalu menerbitkan AWB.') + '</p></form><div id="no" style="margin-top:14px"></div>';
      var f = $('#nf'); try { var w = localStorage.getItem('pcw_wa'); if (w) f.elements.shipper_whatsapp.value = w; } catch (e) {}
      f.addEventListener('submit', function (ev) {
        ev.preventDefault(); var fd = new FormData(f), out = $('#no'), b = { action: 'book_m', token: store('pt') };
        fd.forEach(function (v, k) { b[k] = typeof v === 'string' ? v.trim() : v; });
        var ex = []; { var map = { opt_insurance: 'Insurance', opt_signature: 'Signature', opt_ddp: 'DDP' }; Object.keys(map).forEach(function (k) { if (f.elements[k].checked) ex.push(map[k]); delete b[k]; }); }
        if (ex.length) b.contents = (b.contents + ' | Options: ' + ex.join(', ')).slice(0, 295);
        b.terms_accepted = f.elements.terms_accepted.checked; b.privacy_consent = f.elements.privacy_consent.checked; b.no_prohibited = f.elements.no_prohibited.checked;
        if (!b.terms_accepted || !b.privacy_consent || !b.no_prohibited) { out.innerHTML = notice('err', t('Please tick all three confirmations.', 'Mohon centang ketiga persetujuan.')); return; }
        var btn = $('[type=submit]', f); busy(btn, true, t('Sending…', 'Mengirim…')); try { localStorage.setItem('pcw_wa', b.shipper_whatsapp); } catch (e) {}
        post(b).then(function (r) {
          busy(btn, false);
          if (!r.ok) { if (r.error === 'session') return expired(); out.innerHTML = notice('err', r.error === 'missing_fields' ? t('Please complete: ', 'Lengkapi: ') + esc((r.fields || []).join(', ')) : err(r)); return; }
          var pr = r.est_total ? '<br>' + t('Estimate (excl. situational surcharges): ', 'Estimasi (belum termasuk surcharge situasional): ') + idr(r.est_total) + ' · ' + t('chargeable ', 'berat tagih ') + r.chargeable_kg + ' kg' : '';
          out.innerHTML = notice('ok', '<strong>' + t('Booking received. Reference: ', 'Booking diterima. Nomor referensi: ') + esc(r.ref) + '</strong>' + pr + '<br>' + t('Our team confirms the final price after weighing, then issues the AWB.', 'Harga final dikonfirmasi tim kami setelah penimbangan; AWB diterbitkan oleh PCW.'));
          f.reset(); loadList();
        }).catch(function () { busy(btn, false); out.innerHTML = notice('err', err()); });
      });
    }
    function fillNew() {
      var f = $('#nf'), p = PREFILL; if (!f) return;
      if (p) { f.elements.product.value = p.product; f.elements.dest_country.value = p.country; f.elements.shipment_type.value = p.type; f.elements.pieces.value = p.pieces; f.elements.actual_kg.value = p.kg; f.elements.l.value = p.l; f.elements.w.value = p.w; f.elements.h.value = p.h; }
      if (ME) { if (!f.elements.shipper_name.value) f.elements.shipper_name.value = ME.name; if (!f.elements.shipper_whatsapp.value && ME.phone) f.elements.shipper_whatsapp.value = ME.phone; }
    }
    function buildProfile() {
      var p = $('[data-pane=prof]', root);
      p.innerHTML = '<div class="row r2"><form id="pf" class="box"><h3 style="margin-top:0">' + t('Profile', 'Profil') + '</h3><div id="pm"></div>' + fld('name', t('Contact name', 'Nama kontak'), 'text', true, 'value="' + esc(ME.name) + '"') + '<div style="margin-top:14px">' + fld('phone', t('WhatsApp number', 'Nomor WhatsApp'), 'tel', true, 'value="' + esc(ME.phone) + '"') + '</div>' +
        '<p class="hint">' + t('Company and email can be changed through our team.', 'Perusahaan dan email dapat diubah melalui tim kami.') + '</p><button class="btn btn-a" type="submit">' + t('Save', 'Simpan') + '</button></form>' +
        '<form id="cf" class="box"><h3 style="margin-top:0">' + t('Change password', 'Ganti password') + '</h3><div id="cm"></div>' + fld('current', t('Current password', 'Password saat ini'), 'password', true, 'autocomplete="current-password"') + '<div style="margin-top:14px">' + fld('password', t('New password (min 10)', 'Password baru (min 10)'), 'password', true, 'minlength="10" autocomplete="new-password"') + '</div><button class="btn btn-a" type="submit" style="margin-top:14px">' + t('Update password', 'Perbarui password') + '</button></form></div>';
      $('#pf').addEventListener('submit', function (ev) { ev.preventDefault(); var f = ev.target; post({ action: 'profile', token: store('pt'), name: f.elements.name.value, phone: f.elements.phone.value }).then(function (r) { if (r.error === 'session') return expired(); $('#pm').innerHTML = r.ok ? notice('ok', t('Saved.', 'Tersimpan.')) : notice('err', err(r)); if (r.ok) { ME.name = f.elements.name.value; ME.phone = f.elements.phone.value; } }); });
      $('#cf').addEventListener('submit', function (ev) { ev.preventDefault(); var f = ev.target; post({ action: 'chpw', token: store('pt'), current: f.elements.current.value, password: f.elements.password.value }).then(function (r) { if (r.error === 'session') return expired(); $('#cm').innerHTML = r.ok ? notice('ok', t('Password updated.', 'Password diperbarui.')) : notice('err', err(r)); if (r.ok) f.reset(); }); });
    }
    if (store('pt')) { post({ action: 'me', token: store('pt') }).then(function (r) { if (r.ok) { ME = r.user; if (ME.role === 'SuperAdmin') { store('pt', null); renderLogin(); } else renderApp(); } else { store('pt', null); renderLogin(); } }).catch(function () { renderLogin(); }); } else renderLogin();
    var q = new URLSearchParams(location.search); if (q.get('reset')) { }
  }

  /* ---------- ADMIN ---------- */
  var ad = $('#adRoot');
  if (ad) {
    var AU = null, STAT = [], USERS = [], BK = [], INV = [];
    function aTok() { return store('at'); }
    function aPost(b) { b.token = aTok(); return post(b).then(function (r) { if (r && r.error === 'session') { aExpired(); throw new Error('session'); } return r; }); }
    function aMsg(id, ok, text) { var e = $(id); if (e) e.innerHTML = notice(ok ? 'ok' : 'err', esc(text)); }
    function aErr(r) { return ({ not_found: 'Not found.', invalid: 'Invalid value.', exists: 'Already exists.', nothing_to_change: 'Nothing to change.', missing_fields: 'Please complete the required fields.' })[r && r.error] || (r && r.error) || 'Failed.'; }
    function csv(name, head, rows) {
      var q = function (v) { v = String(v == null ? '' : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
      var txt = [head].concat(rows).map(function (r) { return r.map(q).join(','); }).join('\n');
      var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + txt], { type: 'text/csv' })); a.download = name; document.body.appendChild(a); a.click(); a.remove();
    }
    function aLogin(msg) {
      ad.innerHTML = (msg || '') + '<form id="af" class="box" style="max-width:460px"><h2 style="margin-top:0">PCW Admin</h2><div id="am"></div>' + fld('email', 'Email', 'email', true, 'autocomplete="username"') + '<div style="margin-top:14px">' + fld('password', 'Password', 'password', true, 'autocomplete="current-password"') + '</div>' +
        '<button class="btn btn-a" type="submit" style="margin-top:14px;width:100%;padding:14px">Sign in</button><p class="hint"><a href="#" id="afg">Set or reset password</a></p></form>';
      $('#afg').onclick = function (e) { e.preventDefault(); aReset(); };
      $('#af').addEventListener('submit', function (ev) {
        ev.preventDefault(); var f = ev.target, btn = $('[type=submit]', f), em = f.elements.email.value.trim().toLowerCase(); busy(btn, true);
        post({ action: 'login', email: em, password: f.elements.password.value }).then(function (r) {
          busy(btn, false);
          if (!r.ok) { $('#am').innerHTML = notice('err', err(r)); return; }
          if (r.otp) return aOtp(em);
          post({ action: 'logout', token: r.token }); $('#am').innerHTML = notice('err', 'Not an admin account.');
        }).catch(function () { busy(btn, false); $('#am').innerHTML = notice('err', err()); });
      });
    }
    function aOtp(em) {
      ad.innerHTML = '<form id="ao" class="box" style="max-width:460px"><h2 style="margin-top:0">Verification code</h2><div id="am"></div><p>A 6-digit code was emailed to ' + esc(em) + '.</p>' + fld('code', 'Code', 'text', true, 'inputmode="numeric" maxlength="6" autocomplete="one-time-code"') + '<button class="btn btn-a" type="submit" style="margin-top:14px">Verify</button></form>';
      $('#ao').addEventListener('submit', function (ev) { ev.preventDefault(); post({ action: 'login_otp', email: em, code: ev.target.elements.code.value.trim() }).then(function (r) { if (!r.ok) { $('#am').innerHTML = notice('err', err(r)); return; } store('at', r.token); AU = r.user; aApp(); }); });
    }
    function aReset() {
      ad.innerHTML = '<form id="aq" class="box" style="max-width:460px"><h2 style="margin-top:0">Set or reset password</h2><div id="am"></div>' + fld('email', 'Admin email', 'email', true) + '<button class="btn btn-a" type="submit" style="margin-top:14px">Send code</button> <a href="#" id="ab">Back</a></form>' +
        '<form id="ar" class="box hidden" style="max-width:460px"><div id="am2"></div>' + fld('code', '6-digit code', 'text', true, 'inputmode="numeric" maxlength="6"') + '<div style="margin-top:14px">' + fld('password', 'New password (min 10)', 'password', true, 'minlength="10" autocomplete="new-password"') + '</div><button class="btn btn-a" type="submit" style="margin-top:14px">Set password</button></form>';
      $('#ab').onclick = function (e) { e.preventDefault(); aLogin(); }; var em = '';
      $('#aq').addEventListener('submit', function (ev) { ev.preventDefault(); em = ev.target.elements.email.value.trim().toLowerCase(); post({ action: 'reset_req', email: em }).then(function () { $('#aq').classList.add('hidden'); $('#ar').classList.remove('hidden'); $('#am2').innerHTML = notice('info', 'If the email is registered, a code is on its way.'); }); });
      $('#ar').addEventListener('submit', function (ev) { ev.preventDefault(); var f = ev.target; post({ action: 'reset_do', email: em, code: f.elements.code.value.trim(), password: f.elements.password.value }).then(function (r) { if (!r.ok) { $('#am2').innerHTML = notice('err', err(r)); return; } aLogin(notice('ok', 'Password set. Sign in.')); }); });
    }
    function aExpired() { store('at', null); aLogin(notice('warn', 'Session expired. Sign in again.')); }
    function stat(v, l) { return '<div class="box" style="text-align:center"><div style="font-size:1.7rem;font-weight:800;color:var(--blue)">' + v + '</div><div class="hint">' + l + '</div></div>'; }
    function bars(obj, max) {
      var ks = Object.keys(obj).sort(function (a, b) { return obj[b] - obj[a]; }).slice(0, max || 8), top = ks.length ? obj[ks[0]] : 1;
      return ks.map(function (k) { return '<div style="display:flex;align-items:center;gap:8px;margin:4px 0;font-size:.9rem"><span style="width:150px;flex:none">' + esc(k) + '</span><span style="background:var(--blue);height:12px;border-radius:6px;width:' + Math.max(4, Math.round(obj[k] / top * 100)) + '%;max-width:55%"></span><span>' + obj[k] + '</span></div>'; }).join('') || '<p class="hint">No data.</p>';
    }
    function aApp() {
      ad.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px"><div><h2 style="margin:0">PCW Admin</h2><span class="hint">' + esc(AU.email) + '</span></div><button id="aso" class="btn btn-o" type="button">Sign out</button></div>' +
        ['ov', 'bk', 'us', 'iv', 'au', 'st'].map(function (k) { return '<div data-pane="' + k + '"></div>'; }).join('');
      $('#aso').onclick = function () { post({ action: 'logout', token: aTok() }); store('at', null); aLogin(); };
      var go = tabs(ad, [['ov', 'Overview'], ['bk', 'Bookings'], ['us', 'Customers'], ['iv', 'Invoices'], ['au', 'Audit log'], ['st', 'Settings']], function (k) { ({ ov: loadOv, bk: loadBk, us: loadUsers, iv: loadInv, au: loadAudit, st: loadSettings })[k](); });
      ad.insertBefore(ad.lastChild, ad.children[1]); window._ago = go;
      post({ action: 'adm_statuses', token: aTok() }).then(function (r) { if (r.ok) STAT = r.statuses; go('ov'); }).catch(function () { go('ov'); });
    }
    function pane(k) { return $('[data-pane=' + k + ']', ad); }
    /* Overview */
    function loadOv() {
      aPost({ action: 'adm_stats' }).then(function (r) {
        if (!r.ok) return; var u = r.users || {};
        pane('ov').innerHTML = '<div class="row r4">' + stat(r.total, 'Total bookings') + stat(r.count_30d, 'Bookings last 30 days') + stat(idr(r.est_30d), 'Est. value last 30 days') + stat(idr(r.outstanding), 'Outstanding invoices (' + r.open_invoices + ')') + '</div>' +
          '<div class="row r4" style="margin-top:14px">' + stat(u.Active || 0, 'Active customers') + stat(u.Pending || 0, 'Pending verification') + stat(u.Disabled || 0, 'Disabled') + stat(idr(r.est_total), 'Est. value all bookings') + '</div>' +
          '<div class="row r3" style="margin-top:14px"><div class="box"><h3 style="margin-top:0">By status</h3>' + bars(r.by_status) + '</div><div class="box"><h3 style="margin-top:0">Top destinations</h3>' + bars(r.by_dest) + '</div><div class="box"><h3 style="margin-top:0">By service</h3>' + bars(r.by_product) + '</div></div>' +
          '<p class="hint">Values are estimates from published or member rates, or the final price if you set one. Cancelled bookings are excluded from values.</p>';
      }).catch(function () {});
    }
    /* Bookings */
    function loadBk() {
      aPost({ action: 'adm_bookings_all' }).then(function (r) { if (!r.ok) return; BK = r.items; renderBk(); }).catch(function () {});
    }
    function renderBk() {
      var p = pane('bk');
      if (!$('#bq', p)) {
        p.innerHTML = '<div id="bm"></div><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:end"><input id="bq" placeholder="Search ref, customer, email, destination, receiver" style="min-width:260px;flex:1"><select id="bs"><option value="">All statuses</option>' + ['Booking request'].concat(STAT).filter(function (v, i, a) { return a.indexOf(v) === i; }).map(function (s) { return '<option>' + esc(s) + '</option>'; }).join('') + '</select><select id="bp"><option value="">All services</option><option>Priority</option><option>Economy</option></select><button id="bx" class="btn btn-o btn-sm" type="button">Export CSV</button></div><div id="bl" style="margin-top:12px"></div><div id="bd"></div>';
        ['bq', 'bs', 'bp'].forEach(function (id) { $('#' + id, p).oninput = renderBk; $('#' + id, p).onchange = renderBk; });
        $('#bx', p).onclick = function () { var f = filtered(); csv('pcw-bookings.csv', ['Ref', 'Date', 'Customer', 'Email', 'Service', 'Destination', 'Pieces', 'Actual kg', 'Chargeable kg', 'Receiver', 'Contents', 'Est IDR', 'Final IDR', 'Status'], f.map(function (b) { return [b.ref, b.date, b.company, b.email, b.product, b.dest, b.pieces, b.kg, b.chg, b.to, b.contents, b.est, b.final, b.status]; })); };
      }
      function filtered() { var q = $('#bq', p).value.toLowerCase(), s = $('#bs', p).value, pr = $('#bp', p).value; return BK.filter(function (b) { return (!s || b.status === s) && (!pr || b.product === pr) && (!q || (b.ref + ' ' + b.company + ' ' + b.shipper + ' ' + b.email + ' ' + b.dest + ' ' + b.to).toLowerCase().indexOf(q) > -1); }); }
      var f = filtered();
      $('#bl', p).innerHTML = '<p class="hint">' + f.length + ' of ' + BK.length + ' bookings</p>' + table(['Ref', 'Date', 'Customer', 'Service / Dest', 'Kg', 'Receiver', 'Price (IDR)', 'Status', ''], f.map(function (b) {
        return tr([esc(b.ref), esc(b.date), esc(b.company || b.shipper) + '<br><span class="hint">' + esc(b.email) + '</span>', esc(b.product) + '<br>' + esc(b.dest), esc(b.chg || b.kg), esc(b.to), b.final ? '<strong>' + Number(b.final).toLocaleString('id-ID') + '</strong> <span class="hint">final</span>' : (b.est ? Number(b.est).toLocaleString('id-ID') + ' <span class="hint">est</span>' : '-'), '<strong>' + esc(b.status) + '</strong>', '<button class="btn btn-a btn-sm" type="button" data-open="' + esc(b.ref) + '">Open</button>']);
      }));
      $$('[data-open]', p).forEach(function (b) { b.onclick = function () { openBk(b.getAttribute('data-open')); }; });
    }
    function openBk(ref) {
      aPost({ action: 'adm_booking_get', ref: ref }).then(function (r) {
        if (!r.ok) { aMsg('#bm', false, aErr(r)); return; }
        var f = r.fields, d = $('#bd', pane('bk')), so = STAT.map(function (s) { return '<option>' + esc(s) + '</option>'; }).join('');
        var row = function (k) { return '<div><label>' + k.replace(/_/g, ' ') + '</label><div>' + esc(f[k] == null || f[k] === '' ? '-' : f[k]) + '</div></div>'; };
        var inp = function (n, label, val, typ) { return '<div><label>' + label + '</label><input name="' + n + '" type="' + (typ || 'text') + '" value="' + esc(val == null ? '' : val) + '"></div>'; };
        d.innerHTML = '<div class="box" style="margin-top:16px"><div style="display:flex;justify-content:space-between;align-items:center"><h3 style="margin:0">' + esc(ref) + ' - ' + esc(f.Product) + ' to ' + esc(f.Dest_Country) + '</h3><button id="bc" class="btn btn-o btn-sm" type="button">Close</button></div><div id="bdm"></div>' +
          '<div class="row r3" style="margin-top:12px">' + ['Submitted_At', 'Shipper_Name', 'Shipper_Company', 'Shipper_Email', 'Shipper_WhatsApp', 'Pickup_or_Dropoff', 'Pickup_Address', 'Pickup_City', 'Pickup_Date', 'Est_Total_IDR'].map(row).join('') + '</div>' +
          '<h4 style="margin:16px 0 6px">Edit shipment</h4><form id="be"><div class="row r4">' + inp('actual_kg', 'Actual kg', f.Actual_Kg) + inp('chargeable_kg', 'Chargeable kg', f.Chargeable_Kg) + inp('pieces', 'Pieces', f.Pieces) + inp('dims', 'Dims cm', f.Dims_cm) + '</div>' +
          '<div class="row r4" style="margin-top:10px">' + inp('final_price', 'Final price (IDR)', f.Final_Price_IDR) + inp('declared_value', 'Declared value', f.Declared_Value) + inp('contents', 'Contents', f.Contents) + inp('consignee_name', 'Receiver name', f.Consignee_Name) + '</div>' +
          '<div class="row r4" style="margin-top:10px">' + inp('consignee_company', 'Receiver company', f.Consignee_Company) + inp('consignee_address', 'Receiver address', f.Consignee_Address) + inp('consignee_city', 'City', f.Consignee_City) + inp('consignee_postcode', 'Postcode', f.Consignee_Postcode) + '</div>' +
          '<div class="row r3" style="margin-top:10px">' + inp('consignee_phone', 'Receiver phone', f.Consignee_Phone) + inp('consignee_email', 'Receiver email', f.Consignee_Email) + inp('notes_add', 'Add internal note', '') + '</div>' +
          '<p class="hint">Notes so far: ' + esc(f.Notes || '-') + '</p><button class="btn btn-a" type="submit">Save changes</button></form>' +
          '<h4 style="margin:16px 0 6px">Tracking</h4>' + (r.events.length ? table(['Time', 'Status', 'Location', 'Note', 'By', ''], r.events.map(function (e) { return tr([esc(e.time), '<strong>' + esc(e.status) + '</strong>', esc(e.location), esc(e.note), esc(e.by), '<button class="btn btn-o btn-sm" type="button" data-del="' + e.row + '">Remove</button>']); })) : '<p class="hint">No tracking events yet.</p>') +
          '<form id="bt" style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;align-items:end"><div><label>New status</label><select name="status">' + so + '</select></div><div><label>Location</label><input name="location"></div><div><label>Public note</label><input name="note"></div><button class="btn btn-a btn-sm" type="submit">Add status</button></form></div>';
        d.scrollIntoView({ behavior: 'smooth' });
        $('#bc').onclick = function () { d.innerHTML = ''; };
        $('#be').addEventListener('submit', function (ev) { ev.preventDefault(); var b = { action: 'adm_booking_edit', ref: ref }; new FormData(ev.target).forEach(function (v, k) { b[k] = v; }); aPost(b).then(function (x) { aMsg('#bdm', x.ok, x.ok ? 'Saved.' : aErr(x)); if (x.ok) { loadBkQuiet(); openBk(ref); } }); });
        $('#bt').addEventListener('submit', function (ev) { ev.preventDefault(); var fe = ev.target.elements; aPost({ action: 'adm_status', ref: ref, status: fe.status.value, location: fe.location.value, note: fe.note.value }).then(function (x) { aMsg('#bdm', x.ok, x.ok ? 'Status added.' : aErr(x)); if (x.ok) { loadBkQuiet(); openBk(ref); } }); });
        $$('[data-del]', d).forEach(function (b) { b.onclick = function () { if (!confirm('Remove this tracking event? This cannot be undone.')) return; aPost({ action: 'adm_track_del', ref: ref, row: b.getAttribute('data-del') }).then(function (x) { aMsg('#bdm', x.ok, x.ok ? 'Event removed.' : aErr(x)); if (x.ok) { loadBkQuiet(); openBk(ref); } }); }; });
      }).catch(function () {});
    }
    function loadBkQuiet() { aPost({ action: 'adm_bookings_all' }).then(function (r) { if (r.ok) { BK = r.items; var p = pane('bk'); if ($('#bq', p)) { var keep = $('#bd', p).innerHTML; renderBk(); } } }); }
    /* Customers */
    function loadUsers() { aPost({ action: 'adm_users' }).then(function (r) { if (r.ok) { USERS = r.users; renderUsers(); } }).catch(function () {}); }
    function renderUsers() {
      var p = pane('us');
      if (!$('#uq', p)) {
        p.innerHTML = '<div id="um"></div><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:end"><input id="uq" placeholder="Search company, name, email" style="min-width:240px;flex:1"><select id="us"><option value="">All statuses</option><option>Active</option><option>Pending</option><option>Disabled</option><option>Invite</option></select><button id="ux" class="btn btn-o btn-sm" type="button">Export CSV</button><button id="un" class="btn btn-a btn-sm" type="button">New customer</button></div>' +
          '<form id="uc" class="box hidden" style="margin-top:12px"><h3 style="margin-top:0">New customer</h3><div class="row r3">' + fld('company', 'Company') + fld('name', 'Contact name') + fld('email', 'Email', 'email') + '</div><div class="row r3" style="margin-top:10px">' + fld('phone', 'WhatsApp', 'tel', false) + fld('rate', 'Rate profile (blank, DISC10, ...)', 'text', false) + '</div><p class="hint">The customer gets an email with a code to set their own password.</p><button class="btn btn-a" type="submit">Create and email</button></form>' +
          '<p class="hint">Rate profile: blank or PUBLISHED = published price; DISC10 / DISC20 = % off published; any other code (e.g. ALBINDO) = no price shown, quote needed.</p><div id="ul"></div><div id="ud"></div>';
        $('#uq', p).oninput = renderUsers; $('#us', p).onchange = renderUsers;
        $('#un', p).onclick = function () { $('#uc', p).classList.toggle('hidden'); };
        $('#ux', p).onclick = function () { csv('pcw-customers.csv', ['Company', 'Name', 'Email', 'Phone', 'Status', 'Rate profile', 'Created', 'Last login'], USERS.map(function (u) { return [u.company, u.name, u.email, u.phone, u.status, u.rate, u.created, u.last]; })); };
        $('#uc', p).addEventListener('submit', function (ev) { ev.preventDefault(); var b = { action: 'adm_user_create' }; new FormData(ev.target).forEach(function (v, k) { b[k] = v.trim(); }); aPost(b).then(function (x) { aMsg('#um', x.ok, x.ok ? 'Customer created and emailed.' : aErr(x)); if (x.ok) { ev.target.reset(); ev.target.classList.add('hidden'); loadUsers(); } }); });
      }
      var q = $('#uq', p).value.toLowerCase(), s = $('#us', p).value;
      var list = USERS.map(function (u, i) { u._i = i; return u; }).filter(function (u) { return (!s || u.status === s) && (!q || (u.company + ' ' + u.name + ' ' + u.email).toLowerCase().indexOf(q) > -1); });
      $('#ul', p).innerHTML = '<p class="hint">' + list.length + ' of ' + USERS.length + ' customers</p>' + table(['Customer', 'Contact', 'Status', 'Rate profile', 'Last login', ''], list.map(function (u) {
        var st = ['Pending', 'Active', 'Disabled', 'Invite'].map(function (x) { return '<option' + (x === u.status ? ' selected' : '') + '>' + x + '</option>'; }).join('');
        return tr(['<strong>' + esc(u.company) + '</strong><br>' + esc(u.email) + (u.role === 'SuperAdmin' ? ' · <em>SuperAdmin</em>' : ''), esc(u.name) + '<br>' + esc(u.phone), '<select data-i="' + u._i + '" data-f="st">' + st + '</select>', '<input data-i="' + u._i + '" data-f="rate" value="' + esc(u.rate) + '" style="width:110px">', esc(u.last),
          '<button class="btn btn-a btn-sm" type="button" data-save="' + u._i + '">Save</button> <button class="btn btn-o btn-sm" type="button" data-more="' + u._i + '">Details</button>']);
      }));
      $$('[data-save]', p).forEach(function (b) { b.onclick = function () { var i = b.getAttribute('data-save'), u = USERS[i]; aPost({ action: 'adm_user_set', email: u.email, status: $('[data-f=st][data-i="' + i + '"]', p).value, rate: $('[data-f=rate][data-i="' + i + '"]', p).value }).then(function (x) { aMsg('#um', x.ok, x.ok ? 'Saved ' + u.email : aErr(x)); if (x.ok) loadUsers(); }); }; });
      $$('[data-more]', p).forEach(function (b) { b.onclick = function () { userDetail(USERS[b.getAttribute('data-more')]); }; });
    }
    function userDetail(u) {
      var d = $('#ud', pane('us'));
      aPost({ action: 'adm_user_bookings', email: u.email }).then(function (r) {
        d.innerHTML = '<div class="box" style="margin-top:16px"><div style="display:flex;justify-content:space-between"><h3 style="margin:0">' + esc(u.company) + '</h3><button id="uclose" class="btn btn-o btn-sm" type="button">Close</button></div><div id="udm"></div>' +
          '<form id="ue" class="row r3" style="margin-top:12px">' + fld('company', 'Company', 'text', true, 'value="' + esc(u.company) + '"') + fld('name', 'Contact name', 'text', true, 'value="' + esc(u.name) + '"') + fld('phone', 'WhatsApp', 'tel', false, 'value="' + esc(u.phone) + '"') + '<div style="grid-column:1/-1"><label>Internal notes</label><input name="notes" value=""></div><div><button class="btn btn-a btn-sm" type="submit">Save details</button> <button id="urs" class="btn btn-o btn-sm" type="button">Send password reset code</button></div></form>' +
          '<h4 style="margin:16px 0 6px">Shipments (' + r.items.length + ')</h4>' + (r.items.length ? table(['Ref', 'Date', 'Service', 'Destination', 'Kg', 'Price', 'Status'], r.items.map(function (b) { return tr([esc(b.ref), esc(b.date), esc(b.product), esc(b.dest), esc(b.kg), b.final ? Number(b.final).toLocaleString('id-ID') : esc(b.est), esc(b.status)]); })) : '<p class="hint">No shipments yet.</p>') + '</div>';
        d.scrollIntoView({ behavior: 'smooth' });
        $('#uclose').onclick = function () { d.innerHTML = ''; };
        $('#ue').addEventListener('submit', function (ev) { ev.preventDefault(); var b = { action: 'adm_user_edit', email: u.email }; new FormData(ev.target).forEach(function (v, k) { b[k] = v; }); if (!b.notes) delete b.notes; aPost(b).then(function (x) { aMsg('#udm', x.ok, x.ok ? 'Saved.' : aErr(x)); if (x.ok) loadUsers(); }); });
        $('#urs').onclick = function () { aPost({ action: 'adm_user_reset', email: u.email }).then(function (x) { aMsg('#udm', x.ok, x.ok ? 'Reset code emailed to ' + u.email + ' (valid 24 hours).' : aErr(x)); }); };
      }).catch(function () {});
    }
    /* Invoices */
    function loadInv() { aPost({ action: 'adm_inv_list' }).then(function (r) { if (r.ok) { INV = r.items; renderInv(); } }).catch(function () {}); }
    function renderInv() {
      var p = pane('iv'), tot = INV.filter(function (i) { return i.status !== 'Paid'; }).reduce(function (a, i) { return a + (Number(i.amount) || 0); }, 0);
      p.innerHTML = '<div id="im"></div><form id="if" class="box"><h3 style="margin-top:0">New invoice record</h3><div class="row r4">' + fld('customer', 'Customer') + fld('ref', 'PCW ref (optional)', 'text', false) + fld('amount', 'Amount (IDR)', 'text', true, 'inputmode="numeric"') + fld('terms_days', 'Payment terms (days)', 'number', false, 'min="0" value="0"') + '</div><div style="margin-top:10px">' + fld('notes', 'Notes', 'text', false) + '</div><button class="btn btn-a" type="submit" style="margin-top:12px">Add invoice</button><p class="hint">This records the receivable in the sheet. It does not send anything to the customer.</p></form>' +
        '<p style="margin-top:14px"><strong>Outstanding: ' + idr(tot) + '</strong> <button id="ix" class="btn btn-o btn-sm" type="button">Export CSV</button></p>' + table(['Invoice', 'Ref', 'Customer', 'Date', 'Amount', 'Due', 'Paid', 'Status', ''], INV.map(function (i) { return tr([esc(i.no), esc(i.ref), esc(i.customer), esc(i.date), Number(i.amount).toLocaleString('id-ID'), esc(i.due), esc(i.paid), '<strong>' + esc(i.status) + '</strong>', i.status === 'Paid' ? '' : '<button class="btn btn-a btn-sm" type="button" data-pay="' + esc(i.no) + '">Mark paid</button>']); }));
      $('#ix', p).onclick = function () { csv('pcw-invoices.csv', ['Invoice', 'Ref', 'Customer', 'Date', 'Amount', 'Due', 'Paid', 'Status', 'Notes'], INV.map(function (i) { return [i.no, i.ref, i.customer, i.date, i.amount, i.due, i.paid, i.status, i.notes]; })); };
      $('#if', p).addEventListener('submit', function (ev) { ev.preventDefault(); var b = { action: 'adm_inv_add' }; new FormData(ev.target).forEach(function (v, k) { b[k] = v.trim(); }); aPost(b).then(function (x) { if (x.ok) loadInv(); setTimeout(function () { aMsg('#im', x.ok, x.ok ? 'Added ' + x.no : aErr(x)); }, 400); }); });
      $$('[data-pay]', p).forEach(function (b) { b.onclick = function () { if (!confirm('Mark ' + b.getAttribute('data-pay') + ' as paid today?')) return; aPost({ action: 'adm_inv_pay', no: b.getAttribute('data-pay') }).then(function (x) { if (x.ok) loadInv(); }); }; });
    }
    /* Audit + settings */
    function loadAudit() { aPost({ action: 'adm_audit' }).then(function (r) { if (r.ok) pane('au').innerHTML = '<p class="hint">Last 200 admin actions.</p>' + table(['Time', 'Admin', 'Action', 'Detail'], r.items.map(function (i) { return tr([esc(i.time), esc(i.who), esc(i.action), esc(i.detail)]); })); }).catch(function () {}); }
    function loadSettings() { aPost({ action: 'adm_settings' }).then(function (r) { if (r.ok) pane('st').innerHTML = '<p class="hint">Read-only. Rates, fuel and rules are changed in the Google Sheet by the team.</p>' + table(['Setting', 'Value', 'Note'], r.items.map(function (i) { return tr(['<strong>' + esc(i.key) + '</strong>', esc(i.value), esc(i.note)]); })); }).catch(function () {}); }
    if (store('at')) post({ action: 'me', token: store('at') }).then(function (r) { if (r.ok && r.user.role === 'SuperAdmin') { AU = r.user; aApp(); } else { store('at', null); aLogin(); } }).catch(aLogin); else aLogin();
  }
})();
