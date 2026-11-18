(function () {
  var API = 'https://script.google.com/macros/s/AKfycbx3QvkVLyrTEZWld-RjGroQJ181qxhoGKQ7XODdqD-5IXV2bLLTdDn_Q7AxbUR4oWn3Sw/exec';
  var ID = document.documentElement.lang === 'id', ROOT = document.body.getAttribute('data-root') || '';
  var COUNTRIES = ["Australia","Canada","China","France","Germany","Hong Kong","India","Italy","Japan","Malaysia (West)","Netherlands","New Zealand","Philippines","Saudi Arabia","Singapore","South Korea","Spain","Taiwan","Thailand","United Arab Emirates","United Kingdom","United States","Vietnam"];
  var $ = function (s, e) { return (e || document).querySelector(s); };
  var T = ID ? {
    bad: 'Email atau kode akses salah.', sess: 'Sesi berakhir. Silakan masuk lagi.', err: 'Terjadi kendala. Coba lagi atau hubungi kami lewat WhatsApp.',
    none: 'Belum ada kiriman.', ok: 'Booking diterima. Nomor referensi: ', consent: 'Mohon centang ketiga persetujuan.', miss: 'Lengkapi: ', sending: 'Mengirim…',
    eco: 'Pickup Economy di luar Jakarta diatur melalui permintaan.', cols: ['Ref', 'Tanggal', 'Layanan', 'Tujuan', 'Koli', 'Kg', 'Penerima', 'Status', '']
  } : {
    bad: 'Email or access code is incorrect.', sess: 'Session expired. Please sign in again.', err: 'Something went wrong. Try again or contact us on WhatsApp.',
    none: 'No shipments yet.', ok: 'Booking received. Reference: ', consent: 'Please tick all three confirmations.', miss: 'Please complete: ', sending: 'Sending…',
    eco: 'Economy pickup outside Jakarta is arranged by request.', cols: ['Ref', 'Date', 'Service', 'Destination', 'Pcs', 'Kg', 'Receiver', 'Status', '']
  };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function post(b) { return fetch(API, { method: 'POST', body: JSON.stringify(b) }).then(function (r) { return r.json(); }); }
  function store(k, v) { try { if (v === null) sessionStorage.removeItem(k); else if (v !== undefined) sessionStorage.setItem(k, v); return sessionStorage.getItem(k); } catch (e) { return null; } }
  var login = $('#pLogin'), app = $('#pApp'), form = $('#pForm'), out = $('#pOut');
  if (!login) return;
  var sel = form.elements.dest_country;
  COUNTRIES.forEach(function (c) { var o = document.createElement('option'); o.value = c; o.textContent = c; sel.appendChild(o); });
  try { var w = localStorage.getItem('pcw_wa'); if (w) form.elements.shipper_whatsapp.value = w; } catch (e) {}

  function show(on) { login.classList.toggle('hidden', on); app.classList.toggle('hidden', !on); }
  function loadList() {
    var box = $('#pList'); box.innerHTML = '<span class="spin"></span>';
    post({ action: 'portal_list', token: store('pt'), lang: ID ? 'id' : 'en' }).then(function (r) {
      if (!r.ok) { if (r.error === 'session') { store('pt', null); show(false); $('#pMsg').innerHTML = '<div class="notice warn">' + T.sess + '</div>'; return; } box.innerHTML = '<div class="notice err">' + T.err + '</div>'; return; }
      $('#pCo').textContent = r.company;
      if (!r.items.length) { box.innerHTML = '<p>' + T.none + '</p>'; return; }
      box.innerHTML = '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:.92rem"><thead><tr>' + T.cols.map(function (c) { return '<th style="text-align:left;padding:8px;border-bottom:2px solid #ccd">' + c + '</th>'; }).join('') + '</tr></thead><tbody>' +
        r.items.map(function (i) {
          var td = function (v) { return '<td style="padding:8px;border-bottom:1px solid #e3e6ee">' + esc(v) + '</td>'; };
          return '<tr>' + td(i.ref) + td(i.date) + td(i.product) + td(i.dest) + td(i.pieces) + td(i.kg) + td(i.to) + td(i.status) +
            '<td style="padding:8px;border-bottom:1px solid #e3e6ee"><a href="' + ROOT + (ID ? 'id/' : '') + 'track.html?ref=' + encodeURIComponent(i.ref) + '">' + (ID ? 'Lacak' : 'Track') + '</a></td></tr>';
        }).join('') + '</tbody></table></div>';
    }).catch(function () { box.innerHTML = '<div class="notice err">' + T.err + '</div>'; });
  }
  login.addEventListener('submit', function (ev) {
    ev.preventDefault(); var b = $('button', login), m = $('#pMsg'); b.disabled = true; m.innerHTML = '';
    post({ action: 'portal_login', email: login.elements.email.value, code: login.elements.code.value }).then(function (r) {
      b.disabled = false;
      if (!r.ok) { m.innerHTML = '<div class="notice err">' + T.bad + '</div>'; return; }
      store('pt', r.token); login.elements.code.value = ''; show(true); $('#pCo').textContent = r.company; loadList();
    }).catch(function () { b.disabled = false; m.innerHTML = '<div class="notice err">' + T.err + '</div>'; });
  });
  $('#pOff').addEventListener('click', function () { store('pt', null); show(false); });
  $('#pNew').addEventListener('click', function () { form.classList.toggle('hidden'); out.innerHTML = ''; });
  form.addEventListener('submit', function (ev) {
    ev.preventDefault(); var f = new FormData(form), b = { action: 'portal_book', token: store('pt'), lang: ID ? 'id' : 'en' };
    f.forEach(function (v, k) { b[k] = typeof v === 'string' ? v.trim() : v; });
    var ex = []; ['opt_insurance', 'opt_signature', 'opt_ddp'].forEach(function (k) { if (form.elements[k].checked) ex.push({ opt_insurance: 'Insurance', opt_signature: 'Signature', opt_ddp: 'DDP' }[k]); delete b[k]; });
    if (ex.length) b.contents = (b.contents + ' | Options: ' + ex.join(', ')).slice(0, 295);
    b.terms_accepted = form.elements.terms_accepted.checked; b.privacy_consent = form.elements.privacy_consent.checked; b.no_prohibited = form.elements.no_prohibited.checked;
    if (!b.terms_accepted || !b.privacy_consent || !b.no_prohibited) { out.innerHTML = '<div class="notice err">' + T.consent + '</div>'; return; }
    var btn = $('[type=submit]', form), lab = btn.innerHTML; btn.disabled = true; btn.innerHTML = '<span class="spin"></span> ' + T.sending;
    try { localStorage.setItem('pcw_wa', b.shipper_whatsapp); } catch (e) {}
    post(b).then(function (r) {
      btn.disabled = false; btn.innerHTML = lab;
      if (!r.ok) {
        if (r.error === 'session') { store('pt', null); show(false); $('#pMsg').innerHTML = '<div class="notice warn">' + T.sess + '</div>'; return; }
        var m = r.error === 'missing_fields' ? T.miss + (r.fields || []).join(', ') : r.error === 'economy_pickup_outside_jakarta' ? T.eco : r.error === 'po_box_not_accepted' ? (ID ? 'Alamat PO Box tidak dapat dikirimi.' : 'PO Box addresses cannot be delivered.') : T.err;
        out.innerHTML = '<div class="notice err">' + esc(m) + '</div>'; return;
      }
      out.innerHTML = '<div class="notice ok"><strong>' + T.ok + esc(r.ref) + '</strong><br>' + (ID ? 'Harga sesuai kesepakatan member; tim kami mengonfirmasi dan menerbitkan AWB.' : 'Price follows your member agreement; our team confirms and issues the AWB.') + '</div>';
      form.reset(); form.classList.add('hidden'); loadList();
    }).catch(function () { btn.disabled = false; btn.innerHTML = lab; out.innerHTML = '<div class="notice err">' + T.err + '</div>'; });
  });
  if (store('pt')) { show(true); loadList(); }
})();
