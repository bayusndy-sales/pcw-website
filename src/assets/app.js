/* PCW Freight website logic. Back end: Google Apps Script web app. */
(function () {
  'use strict';
  var API = 'https://script.google.com/macros/s/AKfycbx3QvkVLyrTEZWld-RjGroQJ181qxhoGKQ7XODdqD-5IXV2bLLTdDn_Q7AxbUR4oWn3Sw/exec';
  var WA = '6281199896752';
  var EMAIL = 'info@pcwfreight.com';
  var LANG = document.documentElement.lang === 'id' ? 'id' : 'en';
  var ROOT = document.body.getAttribute('data-root') || '';

  var T = {
    en: {
      loading: 'Loading…', calc: 'Calculating…', err: 'Sorry, something went wrong. Please try again or chat with us on WhatsApp.',
      invalid: 'Please fill in destination and weight.', notListed: 'This country is not in our published table yet. Ask us for a quote.',
      product: 'Service', base: 'Transportation', demand: 'Demand surcharge', fuel: 'Fuel surcharge', demandNote: 'Demand surcharge: IDR {r} per chargeable kg, valid until {d}.', pcsWord: 'piece(s)', total: 'Total', allin: 'All-in price',
      chargeable: 'Chargeable weight', actual: 'Actual weight', vol: 'Volumetric weight', kg: 'kg',
      book: 'Book this', quote: 'Request a quote', quoteNote: 'Above our published table: we quote this personally.', notCheaper: 'For this shipment, Priority is cheaper and faster.',
      Priority: 'PCW Priority Express', Economy: 'PCW Economy Express',
      promoUp: 'Up to {n}% off*', promoLow: 'as low as', promoPub: 'Published rate', promoCta: 'Like this rate? Open an account with us today to enjoy these shipping rates.*', promoBtn: 'Open an account', promoNote: '* Promotional offer. "Up to" is the maximum discount; the real discount depends on the destination and service, and is as agreed between you and our sales team. Prices shown are indicative.',
      notFound: 'We could not find this reference. Check the number or chat with us.', badRef: 'Please enter a valid PCW reference.',
      est: 'Estimated delivery', sending: 'Sending…', missing: 'Please complete the required fields: ',
      consent: 'Please tick the three confirmations before sending.', ecoOut: 'Economy pickup outside Jakarta is arranged by request. Please contact us by WhatsApp or email, or choose drop-off or Priority Express.',
      waMsg: 'Hello PCW, I just sent a booking request on the website.', tooMany: 'Too many requests. Please wait a while or chat with us.',
      invEmail: 'Please enter a valid email address.', invWa: 'Please enter a valid WhatsApp number.'
    },
    id: {
      loading: 'Memuat…', calc: 'Menghitung…', err: 'Maaf, terjadi kendala. Silakan coba lagi atau hubungi kami lewat WhatsApp.',
      invalid: 'Mohon isi negara tujuan dan berat.', notListed: 'Negara ini belum ada di tabel publikasi kami. Silakan minta penawaran.',
      product: 'Layanan', base: 'Transportasi', demand: 'Demand surcharge', fuel: 'Fuel surcharge', demandNote: 'Demand surcharge: IDR {r} per kg berat tagih, berlaku sampai {d}.', pcsWord: 'koli', total: 'Total', allin: 'Harga all-in',
      chargeable: 'Berat tagih (chargeable)', actual: 'Berat aktual', vol: 'Berat volumetrik', kg: 'kg',
      book: 'Booking', quote: 'Minta penawaran', quoteNote: 'Di atas tabel publikasi: kami hitungkan langsung.', notCheaper: 'Untuk kiriman ini, Priority lebih murah dan lebih cepat.',
      Priority: 'PCW Priority Express', Economy: 'PCW Economy Express',
      promoUp: 'Diskon hingga {n}%*', promoLow: 'mulai dari', promoPub: 'Published rate', promoCta: 'Suka tarif ini? Buka akun bersama kami hari ini dan nikmati tarif pengiriman seperti ini.*', promoBtn: 'Buka akun', promoNote: '* Penawaran promosi. "Hingga" adalah diskon maksimum; diskon sebenarnya bergantung pada tujuan dan layanan, dan sesuai kesepakatan antara Anda dan tim sales kami. Harga yang ditampilkan bersifat indikatif.',
      notFound: 'Nomor referensi tidak ditemukan. Periksa kembali atau hubungi kami.', badRef: 'Mohon masukkan nomor referensi PCW yang valid.',
      est: 'Estimasi tiba', sending: 'Mengirim…', missing: 'Mohon lengkapi kolom wajib: ',
      consent: 'Mohon centang tiga pernyataan sebelum mengirim.', ecoOut: 'Pickup Economy di luar Jakarta diatur melalui permintaan. Silakan hubungi kami lewat WhatsApp atau email, atau pilih drop-off atau Priority Express.',
      waMsg: 'Halo PCW, saya baru mengirim permintaan booking di website.', tooMany: 'Terlalu banyak permintaan. Mohon tunggu sebentar atau hubungi kami.',
      invEmail: 'Mohon isi alamat email yang valid.', invWa: 'Mohon isi nomor WhatsApp yang valid.'
    }
  }[LANG];

  function $(s, el) { return (el || document).querySelector(s); }
  function $all(s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); }
  function idr(n) { return 'Rp ' + Number(n).toLocaleString('id-ID'); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function waLink(text) { return 'https://wa.me/' + WA + '?text=' + encodeURIComponent(text); }
  function qs() { var o = {}; location.search.replace(/^\?/, '').split('&').forEach(function (p) { if (!p) return; var kv = p.split('='); o[decodeURIComponent(kv[0])] = decodeURIComponent((kv[1] || '').replace(/\+/g, ' ')); }); return o; }

  function apiGet(params) {
    var u = API + '?' + Object.keys(params).map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]); }).join('&');
    return fetch(u).then(function (r) { return r.json(); });
  }
  function apiPost(body) {
    return fetch(API, { method: 'POST', body: JSON.stringify(body) }).then(function (r) { return r.json(); });
  }

  /* menu */
  var burger = $('.burger');
  if (burger) burger.addEventListener('click', function () { $('nav.menu').classList.toggle('open'); });

  /* countries (shared, cached in session) */
  var COUNTRIES = ["Albania", "Algeria", "American Samoa", "Andorra", "Angola", "Anguilla", "Antigua & Barbuda", "Argentina", "Armenia", "Aruba", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bermuda", "Bhutan", "Bolivia", "Bonaire", "Bosnia & Herzegovina", "Botswana", "Brazil", "British Virgin Islands", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Canary Islands", "Cayman Islands", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Congo (Dem. Rep.)", "Cook Islands", "Costa Rica", "Cote d'Ivoire", "Croatia", "Curacao", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Falkland Islands", "Faroe Islands", "Fiji", "Finland", "France", "French Guiana", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Gibraltar", "Greece", "Greenland", "Grenada", "Guadeloupe", "Guam", "Guatemala", "Guernsey", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hong Kong", "Hungary", "Iceland", "India", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jersey", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kosovo", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Macau", "Madagascar", "Malawi", "Malaysia (West)", "Maldives", "Mali", "Malta", "Marshall Islands", "Martinique", "Mauritania", "Mauritius", "Mayotte", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Montserrat", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "Nevis", "New Caledonia", "New Zealand", "Nicaragua", "Niger", "Nigeria", "Niue", "North Macedonia", "Northern Mariana Islands", "Norway", "Oman", "Pakistan", "Palau", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Puerto Rico", "Qatar", "Reunion", "Romania", "Russia", "Rwanda", "Samoa", "San Marino", "Sao Tome & Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "Somaliland", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "St. Barthelemy", "St. Eustatius", "St. Helena", "St. Kitts", "St. Lucia", "St. Maarten", "St. Vincent", "Sudan", "Suriname", "Sweden", "Switzerland", "Tahiti (French Polynesia)", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad & Tobago", "Tunisia", "Turkey", "Turkmenistan", "Turks & Caicos", "Tuvalu", "US Virgin Islands", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"]; /* from published rate table; rebuild when the table changes */
  var countriesP = null;
  function countries() {
    if (COUNTRIES.length) return Promise.resolve(COUNTRIES);
    if (countriesP) return countriesP;
    var hit = null; try { hit = sessionStorage.getItem('pcw_c'); } catch (e) {}
    if (hit) { countriesP = Promise.resolve(JSON.parse(hit)); return countriesP; }
    countriesP = apiGet({ action: 'countries' }).then(function (r) {
      var list = (r && r.countries) || [];
      try { sessionStorage.setItem('pcw_c', JSON.stringify(list)); } catch (e) {}
      return list;
    });
    return countriesP;
  }
  function fillCountries(sel, chosen) {
    if (!sel) return;
    countries().then(function (list) {
      sel.innerHTML = '<option value="">—</option>' + list.map(function (c) { return '<option' + (c === chosen ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('');
    }).catch(function () { sel.innerHTML = '<option value="">' + esc(T.err) + '</option>'; });
  }


  /* package lines (DHL-style: one line per package size, each with its own quantity, weight and dimensions) */
  var PK = (function () {
    var ID = LANG === 'id';
    var L = { qty: ID ? 'Jumlah' : 'Quantity', kg: ID ? 'Berat per koli (kg)' : 'Weight per piece (kg)', l: ID ? 'P (cm)' : 'Length (cm)', w: ID ? 'L (cm)' : 'Width (cm)', h: ID ? 'T (cm)' : 'Height (cm)', add: ID ? '+ Tambah paket lain' : '+ Add another package', rm: ID ? 'Hapus baris' : 'Remove line', line: ID ? 'Paket' : 'Package' };
    function lineHtml(it, i) {
      return '<div class="pk" data-pk>' +
        '<div><label>' + L.qty + '</label><input type="number" min="1" max="50" step="1" data-f="q" value="' + (it.q || 1) + '"></div>' +
        '<div><label>' + L.kg + '</label><input type="number" min="0.1" step="0.1" data-f="kg" value="' + (it.kg || '') + '" placeholder="0.5"></div>' +
        '<div><label>' + L.l + '</label><input type="number" min="0" step="0.1" data-f="l" value="' + (it.l || '') + '"></div>' +
        '<div><label>' + L.w + '</label><input type="number" min="0" step="0.1" data-f="w" value="' + (it.w || '') + '"></div>' +
        '<div><label>' + L.h + '</label><input type="number" min="0" step="0.1" data-f="h" value="' + (it.h || '') + '"></div>' +
        '<button type="button" class="rm" data-rm title="' + L.rm + '" aria-label="' + L.rm + '">×</button></div>';
    }
    function mount(box, items, onChange) {
      var list = (items && items.length ? items : [{ q: 1 }]).slice(0, 20);
      box.innerHTML = '<div data-lines></div><button type="button" class="btn btn-o btn-sm pkadd" data-add>' + L.add + '</button><div class="pksum" data-sum></div>';
      var wrap = $('[data-lines]', box);
      function sync() {
        var lines = $all('[data-pk]', wrap);
        lines.forEach(function (ln) { $('[data-rm]', ln).disabled = lines.length === 1; });
        $('[data-add]', box).classList.toggle('hidden', lines.length >= 20);
        var s = get(box), pcs = 0, kg = 0;
        s.items.forEach(function (x) { pcs += x.q; kg += x.q * x.kg; });
        $('[data-sum]', box).textContent = s.items.length ? (ID ? 'Total: ' : 'Total: ') + pcs + (ID ? ' koli · ' : ' piece(s) · ') + (Math.round(kg * 100) / 100) + ' kg' : '';
        if (onChange) onChange(s);
      }
      list.forEach(function (it) { wrap.insertAdjacentHTML('beforeend', lineHtml(it)); });
      box.oninput = sync;
      box.onclick = function (e) {
        if (e.target.closest('[data-add]')) { wrap.insertAdjacentHTML('beforeend', lineHtml({ q: 1 })); sync(); var ins = $all('[data-f=kg]', wrap); ins[ins.length - 1].focus(); }
        var rm = e.target.closest('[data-rm]');
        if (rm && $all('[data-pk]', wrap).length > 1) { rm.closest('[data-pk]').remove(); sync(); }
      };
      sync();
    }
    function get(box) {
      var items = [], bad = null;
      $all('[data-pk]', box).forEach(function (ln, i) {
        var v = function (k) { return $('[data-f=' + k + ']', ln).value; };
        var q = parseInt(v('q'), 10), kg = parseFloat(v('kg'));
        if (!(kg > 0) || !(q >= 1)) { if (!bad) bad = $('[data-f=kg]', ln); return; }
        items.push({ q: q, kg: kg, l: parseFloat(v('l')) || 0, w: parseFloat(v('w')) || 0, h: parseFloat(v('h')) || 0 });
      });
      return { items: items, bad: bad };
    }
    function legacy(q) {
      if (q.items) { try { var a = JSON.parse(q.items); if (a && a.length) return a; } catch (e) {} }
      var kg = parseFloat(q.kg), pcs = parseInt(q.pieces, 10) || 1;
      if (!(kg > 0)) return null;
      return [{ q: pcs, kg: Math.round(kg / pcs * 100) / 100, l: q.l, w: q.w, h: q.h }];
    }
    return { mount: mount, get: get, legacy: legacy };
  })();
  window.PCWPkg = PK;

  /* rate calculator (quick form on home + full form on rates page) */
  function rateForm(form) {
    var out = $('[data-out]', form.parentNode) || $('[data-out]');
    var quick = form.hasAttribute('data-quick'), pkBox = $('[data-pkgs]', form), q = qs();
    fillCountries($('[name=country]', form), q.country);
    if (pkBox) PK.mount(pkBox, PK.legacy(q));
    ['o_zip', 'o_city', 'd_zip', 'd_city'].forEach(function (k) { if (q[k] && form.elements[k]) form.elements[k].value = q[k]; });
    if (q.type && !quick) $all('[name=type]', form).forEach(function (r) { r.checked = r.value === q.type; });
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var f = new FormData(form), p;
      if (quick) {
        p = { country: f.get('country') || '', type: f.get('type') || 'Parcel', kg: f.get('kg') || '' };
        location.href = ROOT + (LANG === 'id' ? 'id/' : '') + 'rates.html?' + Object.keys(p).map(function (k) { return k + '=' + encodeURIComponent(p[k]); }).join('&') + '#go';
        return;
      }
      var g = PK.get(pkBox);
      if (!f.get('country') || g.bad || !g.items.length) { out.innerHTML = '<div class="notice err">' + T.invalid + '</div>'; if (g.bad) g.bad.focus(); return; }
      p = { action: 'rate', country: f.get('country'), type: f.get('type') || 'Parcel', items: JSON.stringify(g.items) };
      var extra = { d_zip: f.get('d_zip') || '', d_city: f.get('d_city') || '' };
      out.innerHTML = '<div class="notice info">' + T.calc + '</div>';
      apiGet(p).then(function (r) {
        if (!r.ok) { out.innerHTML = '<div class="notice err">' + (r.error === 'country_not_listed' ? T.notListed : T.err) + '</div>'; return; }
        out.innerHTML = renderRates(r, p, extra);
        var qb = $('[data-quote-pdf]', out); if (qb) qb.addEventListener('click', function () { quotePdf(r); });
      }).catch(function () { out.innerHTML = '<div class="notice err">' + T.err + '</div>'; });
    });
    if (!quick && q.country && PK.legacy(q)) {
      countries().then(function () { setTimeout(function () { form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event('submit')); }, 50); });
    }
  }

  function renderRates(r, p, extra) {
    extra = extra || {};
    var hasDem = r.demand_per_kg > 0;
    var cols = hasDem ? 3 : 2;
    var promoOn = r.options.some(function (o) { return !o.quote && !o.not_cheaper && o.max_disc >= 5; });
    function priceCell(o, isP) {
      var allin = isP ? '' : '<div class="hint">' + T.allin + '</div>';
      if (!(o.max_disc >= 5)) return '<span class="price">' + idr(o.total) + '</span>' + allin;
      var low = Math.ceil(o.total * (100 - o.max_disc) / 100 / 1000) * 1000;
      return '<div class="pslash" title="' + T.promoPub + '"><s>' + idr(o.total) + '</s></div>' +
        '<span class="offtag">' + T.promoUp.replace('{n}', o.max_disc) + '</span>' +
        '<div class="price">' + T.promoLow + ' ' + idr(low) + '*</div>' +
        '<div class="pbar" role="img" aria-label="' + T.promoUp.replace('{n}', o.max_disc) + '"><i class="pay" style="width:' + (100 - o.max_disc) + '%"></i><i class="off" style="width:' + o.max_disc + '%"></i></div>' + allin;
    }
    var rows = r.options.map(function (o) {
      var bookUrl = ROOT + (LANG === 'id' ? 'id/' : '') + 'book.html?' + ['product=' + o.product, 'country=' + encodeURIComponent(r.country), 'type=' + r.type, 'items=' + encodeURIComponent(p.items || JSON.stringify(r.items)), 'cz=' + encodeURIComponent(extra.d_zip || ''), 'cc=' + encodeURIComponent(extra.d_city || '')].join('&');
      if (o.quote) {
        return '<tr><td><strong>' + T[o.product] + '</strong><div class="hint">' + T.chargeable + ': ' + o.chargeable_kg + ' ' + T.kg + '</div></td><td colspan="' + (cols + 1) + '">' + T.quoteNote + '</td><td><a class="btn btn-wa btn-sm" href="' + waLink((LANG === 'id' ? 'Halo PCW, mohon penawaran ' : 'Hello PCW, please quote ') + T[o.product] + ' ' + r.country + ' ' + o.chargeable_kg + ' kg') + '">' + T.quote + '</a></td></tr>';
      }
      if (o.not_cheaper) return '<tr><td><strong>' + T[o.product] + '</strong><div class="hint">' + T.chargeable + ': ' + o.chargeable_kg + ' ' + T.kg + '</div></td><td colspan="' + (cols + 2) + '" class="hint">' + T.notCheaper + '</td></tr>';
      var isP = o.product === 'Priority';
      return '<tr><td><strong>' + T[o.product] + '</strong><div class="hint">' + T.chargeable + ': ' + o.chargeable_kg + ' ' + T.kg + '</div></td>' +
        '<td class="n">' + (isP ? idr(o.base) : '—') + '</td>' + (hasDem ? '<td class="n">' + (isP ? idr(o.demand || 0) : '—') + '</td>' : '') + '<td class="n">' + (isP ? idr(o.fuel) : '—') + '</td>' +
        '<td class="n">' + priceCell(o, isP) + '</td>' +
        '<td><a class="btn btn-p btn-sm" href="' + bookUrl + '">' + T.book + '</a></td></tr>';
    }).join('');
    var lines = (r.items || []).map(function (it) { return it.q + ' × ' + it.kg + ' ' + T.kg + ((it.l > 0 && it.w > 0 && it.h > 0) ? ' (' + it.l + '×' + it.w + '×' + it.h + ' cm)' : ''); }).join(' · ');
    var head = '<div class="pub">' + 'Published rate' + ' · ' + (LANG === 'id' ? 'Indonesia → ' : 'Indonesia → ') + esc(r.country) + ' · ' + (r.type === 'Document' ? (LANG === 'id' ? 'Dokumen' : 'Document') : (LANG === 'id' ? 'Paket' : 'Parcel')) + '</div>' +
      '<div class="hint">' + esc(lines) + '</div>' +
      '<div class="hint">' + T.actual + ': ' + r.actual_kg + ' ' + T.kg + (r.volumetric_kg ? ' · ' + T.vol + ': ' + r.volumetric_kg + ' ' + T.kg : '') + '</div>';
    var table = '<table class="rates"><thead><tr><th>' + T.product + '</th><th class="n">' + T.base + '</th>' + (hasDem ? '<th class="n">' + T.demand + '</th>' : '') + '<th class="n">' + T.fuel + '</th><th class="n">' + T.total + '</th><th></th></tr></thead><tbody>' + rows + '</tbody></table>';
    var note = hasDem ? '<p class="hint">' + T.demandNote.replace('{r}', Number(r.demand_per_kg).toLocaleString('id-ID')).replace('{d}', esc(r.demand_until)) + '</p>' : '';
    var biz = '<div class="notice info"><strong>' + (LANG === 'id' ? 'Akun bisnis mendapat tarif lebih rendah.' : 'Business accounts get lower rates.') + '</strong> ' +
      '<a class="btn btn-a btn-sm" style="margin-left:8px" href="' + waLink(LANG === 'id' ? 'Halo PCW, saya ingin tarif bisnis untuk pengiriman ke ' + r.country + '.' : 'Hello PCW, I would like a business rate for shipments to ' + r.country + '.') + '">' + (LANG === 'id' ? 'Dapatkan tarif bisnis' : 'Get your business rate') + '</a></div>';
    var dl = r.options.some(function (o) { return !o.quote; }) ? '<p style="margin:10px 0 0"><button type="button" class="btn btn-o btn-sm" data-quote-pdf>' + (LANG === 'id' ? 'Unduh penawaran (PDF)' : 'Download quote (PDF)') + '</button></p>' : '';
    var regUrl = ROOT + (LANG === 'id' ? 'id/' : '') + 'register.html';
    var promo = promoOn ? '<div class="promo-cta"><strong>' + T.promoCta + '</strong> <a class="btn btn-a btn-sm" href="' + regUrl + '">' + T.promoBtn + '</a><p class="hint" style="margin:8px 0 0">' + T.promoNote + '</p></div>' : '';
    return '<div class="box" id="go">' + head + table + note + dl + promo + (promoOn ? '' : biz) + '</div>';
  }

  /* printable quote: opens the print dialog so the customer can save it as PDF (no data is sent anywhere) */
  function quotePdf(r) {
    var ID = LANG === 'id', now = new Date();
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var ymd = function (d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
    var eom = new Date(now.getFullYear(), now.getMonth() + 1, 0), until = ymd(eom);
    if (r.demand_per_kg > 0 && r.demand_until && r.demand_until < until) until = r.demand_until;
    var hasDem = r.demand_per_kg > 0;
    var L = ID ? { t: 'Penawaran Harga Pengiriman', sub: 'Tarif publikasi · ekspres internasional door to door', date: 'Tanggal', valid: 'Berlaku sampai', route: 'Rute', type: 'Jenis', pk: 'Paket', act: 'Berat aktual', vol: 'Berat volume', svc: 'Layanan', chg: 'Berat tagih', base: 'Transportasi', dem: 'Demand surcharge', fuel: 'Fuel surcharge', tot: 'Total', allin: 'Harga all-in', q: 'Di atas tabel publikasi: hubungi kami untuk penawaran.', doc: 'Dokumen', par: 'Paket',
      notes: ['Harga dalam Rupiah (IDR), berdasarkan data yang Anda masukkan. Harga final mengikuti berat dan ukuran hasil timbang kami.', 'Berat tagih = yang lebih besar antara berat aktual dan berat volume (P x L x T / 5000), dibulatkan ke 0,5 kg.', 'Bea masuk dan pajak di negara tujuan dibayar penerima, kecuali disepakati lain.', 'Harga tidak dikenakan PPN.', 'Booking online: pcwfreight.com/book · WhatsApp +62 811 9989 6752'] }
      : { t: 'Shipping Quotation', sub: 'Published rate · door-to-door international express', date: 'Date', valid: 'Valid until', route: 'Route', type: 'Type', pk: 'Packages', act: 'Actual weight', vol: 'Volumetric weight', svc: 'Service', chg: 'Chargeable weight', base: 'Transportation', dem: 'Demand surcharge', fuel: 'Fuel surcharge', tot: 'Total', allin: 'All-in price', q: 'Above our published table: contact us for a quote.', doc: 'Document', par: 'Parcel',
      notes: ['Prices in Indonesian Rupiah (IDR), based on the details you entered. The final price follows the weight and size we measure.', 'Chargeable weight = the higher of actual weight and volumetric weight (L x W x H / 5000), rounded up to 0.5 kg.', 'Destination duties and taxes are paid by the receiver unless agreed otherwise.', 'Prices are not subject to VAT (PPN).', 'Book online: pcwfreight.com/book · WhatsApp +62 811 9989 6752'] };
    var B = '#004aad';
    var lines = (r.items || []).map(function (it) { return it.q + ' x ' + it.kg + ' kg' + ((it.l > 0 && it.w > 0 && it.h > 0) ? ' (' + it.l + 'x' + it.w + 'x' + it.h + ' cm)' : ''); }).join('<br>');
    var th = 'style="text-align:left;border-bottom:2px solid ' + B + ';padding:6px;font-size:11px;color:' + B + '"', thn = th.replace('text-align:left', 'text-align:right');
    var td = 'style="padding:6px;border-bottom:1px solid #dde3ee;font-size:12px"', tdn = td.replace('padding:6px', 'padding:6px;text-align:right');
    var rows = r.options.map(function (o) {
      var name = 'PCW ' + o.product + ' Express', isP = o.product === 'Priority';
      if (o.quote) return '<tr><td ' + td + '><b>' + name + '</b></td><td ' + td + '>' + o.chargeable_kg + ' kg</td><td ' + td + ' colspan="' + (hasDem ? 4 : 3) + '">' + L.q + '</td></tr>';
      if (o.not_cheaper) return '<tr><td ' + td + '><b>' + name + '</b></td><td ' + td + '>' + o.chargeable_kg + ' kg</td><td ' + td + ' colspan="' + (hasDem ? 4 : 3) + '">' + T.notCheaper + '</td></tr>';
      return '<tr><td ' + td + '><b>' + name + '</b></td><td ' + td + '>' + o.chargeable_kg + ' kg</td><td ' + tdn + '>' + (isP ? idr(o.base) : '-') + '</td>' + (hasDem ? '<td ' + tdn + '>' + (isP ? idr(o.demand || 0) : '-') + '</td>' : '') + '<td ' + tdn + '>' + (isP ? idr(o.fuel) : '-') + '</td><td ' + tdn + '><b>' + idr(o.total) + '</b>' + (isP ? '' : '<div style="font-size:10px">' + L.allin + '</div>') + '</td></tr>';
    }).join('');
    var kv = function (k, v) { return '<tr><td style="padding:3px 10px 3px 0;color:#555;font-size:12px">' + k + '</td><td style="padding:3px 0;font-size:12px"><b>' + v + '</b></td></tr>'; };
    var html = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>PCW Freight quote ' + esc(r.country) + ' ' + ymd(now) + '</title><style>@page{size:A4;margin:16mm}body{font-family:Arial,sans-serif;color:#111;margin:0}</style></head><body>' +
      '<table style="width:100%;border-collapse:collapse"><tr><td><img src="' + location.origin + '/assets/logo.png" style="height:46px;vertical-align:middle"> <span style="font-size:22px;font-weight:bold;color:' + B + ';vertical-align:middle">PCW Freight</span><div style="font-size:11px">PT Prabaswara Catur Widantara</div><div style="font-size:10px;color:#444">Jl. Bukit Golf Hijau Raya No. 18, Sentul City, Kab. Bogor 16810, Indonesia<br>+62 811 9989 6752 · info@pcwfreight.com · pcwfreight.com</div></td>' +
      '<td style="text-align:right;vertical-align:top"><div style="font-size:18px;font-weight:bold;color:' + B + '">' + L.t + '</div><div style="font-size:11px">' + L.sub + '</div></td></tr></table>' +
      '<div style="border-top:3px solid ' + B + ';margin:10px 0 14px"></div>' +
      '<table style="border-collapse:collapse;margin-bottom:14px">' + kv(L.date, ymd(now)) + kv(L.valid, until) + kv(L.route, 'Indonesia → ' + esc(r.country)) + kv(L.type, r.type === 'Document' ? L.doc : L.par) + kv(L.pk, lines) + kv(L.act, r.actual_kg + ' kg') + (r.volumetric_kg ? kv(L.vol, r.volumetric_kg + ' kg') : '') + '</table>' +
      '<table style="width:100%;border-collapse:collapse"><thead><tr><th ' + th + '>' + L.svc + '</th><th ' + th + '>' + L.chg + '</th><th ' + thn + '>' + L.base + '</th>' + (hasDem ? '<th ' + thn + '>' + L.dem + '</th>' : '') + '<th ' + thn + '>' + L.fuel + '</th><th ' + thn + '>' + L.tot + '</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      (hasDem ? '<p style="font-size:11px">' + T.demandNote.replace('{r}', Number(r.demand_per_kg).toLocaleString('id-ID')).replace('{d}', esc(r.demand_until)) + '</p>' : '') +
      '<ul style="font-size:11px;color:#333;margin-top:18px;padding-left:16px">' + L.notes.map(function (n) { return '<li style="margin:3px 0">' + n + '</li>'; }).join('') + '</ul></body></html>';
    var f = document.createElement('iframe'); f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0'; document.body.appendChild(f);
    var d = f.contentWindow.document; d.open(); d.write(html); d.close();
    var go = function () { try { f.contentWindow.focus(); f.contentWindow.print(); } catch (e) { var w = window.open('', '_blank'); if (w) { w.document.write(html); w.document.close(); w.print(); } } setTimeout(function () { f.remove(); }, 60000); };
    var img = d.querySelector('img'); if (img && !img.complete) { img.onload = img.onerror = go; } else go();
  }

  /* booking form */
  function bookForm(form) {
    var q = qs(), out = $('[data-out]');
    fillCountries($('[name=dest_country]', form), q.country);
    var pkBox = $('[data-pkgs]', form);
    function syncPk(s) { form.elements.pieces.value = s.items.reduce(function (a, x) { return a + x.q; }, 0) || 1; form.elements.actual_kg.value = Math.round(s.items.reduce(function (a, x) { return a + x.q * x.kg; }, 0) * 100) / 100 || ''; }
    PK.mount(pkBox, PK.legacy(q), syncPk);
    if (q.cc && form.elements.consignee_city) form.elements.consignee_city.value = q.cc;
    if (q.cz && form.elements.consignee_postcode) form.elements.consignee_postcode.value = q.cz;
    ['product', 'type'].forEach(function (k) {
      if (!q[k] || q[k] === 'undefined') return;
      var name = { type: 'shipment_type' }[k] || k, el = form.elements[name];
      if (!el) return;
      if (el.length && el[0] && el[0].type === 'radio') $all('[name=' + name + ']', form).forEach(function (r) { r.checked = r.value === q[k]; });
      else el.value = q[k];
    });
    var pickupBox = $('[data-pickup]', form), ecoWarn = $('[data-eco-warn]', form), submit = $('[type=submit]', form);
    function outside() { var c = (form.elements.pickup_city.value || '').toLowerCase(); return c && c.indexOf('jakarta') === -1; }
    function refresh() {
      var pick = form.elements.pickup_or_dropoff.value === 'Pickup';
      pickupBox.classList.toggle('hidden', !pick);
      var block = pick && form.elements.product.value === 'Economy' && outside();
      ecoWarn.classList.toggle('hidden', !block);
      submit.disabled = !!block;
    }
    form.addEventListener('change', refresh); form.addEventListener('input', function (e) { if (e.target.name === 'pickup_city') refresh(); });
    refresh();

    /* four-step flow: Shipment > Addresses > Contents > Review */
    var bsteps = $all('.bstp', form), bdots = $all('.stepper li', form), cur = 1, ID = LANG === 'id';
    function go(n) {
      cur = n;
      bsteps.forEach(function (p) { p.classList.toggle('hidden', p.getAttribute('data-bstep') !== String(n)); });
      bdots.forEach(function (d) { var k = +d.getAttribute('data-s'); d.classList.toggle('on', k === n); d.classList.toggle('done', k < n); });
      if (n === 4) review();
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    function stepOk(n) {
      var pane = bsteps[n - 1], els = $all('input,select,textarea', pane).filter(function (el) { return el.required && !el.closest('.hidden'); });
      for (var i = 0; i < els.length; i++) { if (!String(els[i].value).trim() || !els[i].checkValidity()) { els[i].reportValidity(); return false; } }
      if (n === 1) { var g1 = PK.get(pkBox); if (g1.bad || !g1.items.length) { if (g1.bad) g1.bad.focus(); return false; } }
      if (n === 2 && submit.disabled) return false;
      return true;
    }
    function opts() {
      var o = [];
      if (form.elements.opt_insurance.checked) o.push('Insurance');
      if (form.elements.opt_signature.checked) o.push('Signature');
      if (form.elements.opt_ddp.checked) o.push('DDP');
      return o;
    }
    function review() {
      var e = form.elements, v = function (k) { return esc(String(e[k].value || '').trim() || '-'); }, rows = [
        [ID ? 'Layanan' : 'Service', 'PCW ' + v('product') + ' Express'],
        [ID ? 'Tujuan' : 'To', v('dest_country') + ' · ' + esc(e.shipment_type.value)],
        [ID ? 'Berat / koli' : 'Weight / pieces', v('actual_kg') + ' kg · ' + v('pieces') + ' pcs (' + PK.get(pkBox).items.length + (ID ? ' baris' : ' line(s)') + ')'],
        [ID ? 'Pengirim' : 'Shipper', v('shipper_name') + ' · ' + v('shipper_email') + ' · ' + v('shipper_whatsapp')],
        [ID ? 'Serah terima' : 'Handover', esc(e.pickup_or_dropoff.value) + (e.pickup_or_dropoff.value === 'Pickup' ? ' · ' + v('pickup_city') : '')],
        [ID ? 'Penerima' : 'Receiver', v('consignee_name') + ' · ' + v('consignee_city') + ' · ' + v('consignee_email')],
        [ID ? 'Isi kiriman' : 'Contents', v('contents') + ' · IDR ' + v('declared_value')],
        [ID ? 'Layanan tambahan' : 'Extras', esc(opts().join(', ') || '-')]
      ];
      $('[data-review]', form).innerHTML = '<strong>' + (ID ? 'Periksa sebelum mengirim' : 'Check before you send') + '</strong><table style="width:100%;margin-top:8px">' +
        rows.map(function (r) { return '<tr><td style="padding:4px 10px 4px 0;color:var(--muted);white-space:nowrap;vertical-align:top">' + r[0] + '</td><td style="padding:4px 0">' + r[1] + '</td></tr>'; }).join('') + '</table>';
    }
    $all('[data-bnext]', form).forEach(function (b) { b.addEventListener('click', function () { if (stepOk(cur)) go(cur + 1); }); });
    $all('[data-bback]', form).forEach(function (b) { b.addEventListener('click', function () { go(cur - 1); }); });
    if (q.country && PK.legacy(q)) go(2);

    var BT = ''; function getBt() { apiGet({ action: 'bt' }).then(function (r) { if (r && r.bt) BT = r.bt; }).catch(function () {}); } getBt(); setInterval(getBt, 3600000);
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (cur < 4) { if (stepOk(cur)) go(cur + 1); return; }
      var f = new FormData(form), b = { action: 'book', lang: LANG };
      f.forEach(function (v, k) { b[k] = typeof v === 'string' ? v.trim() : v; });
      var gp = PK.get(pkBox); if (gp.bad || !gp.items.length) { out.innerHTML = '<div class="notice err">' + T.invalid + '</div>'; return; } b.items = gp.items;
      if (opts().length) b.contents = (b.contents + ' | Options: ' + opts().join(', ')).slice(0, 295);
      ['opt_insurance', 'opt_signature', 'opt_ddp'].forEach(function (k) { delete b[k]; });
      b.terms_accepted = form.elements.terms_accepted.checked;
      b.privacy_consent = form.elements.privacy_consent.checked;
      b.no_prohibited = form.elements.no_prohibited.checked;
      var missing = $all('[required]', form).filter(function (el) { return !el.closest('.hidden') && el.type !== 'checkbox' && !String(el.value).trim(); })
        .map(function (el) { return (form.querySelector('label[for=' + el.id + ']') || {}).textContent || el.name; });
      if (missing.length) { out.innerHTML = '<div class="notice err">' + T.missing + esc(missing.join(', ')) + '</div>'; return; }
      if (!b.terms_accepted || !b.privacy_consent || !b.no_prohibited) { out.innerHTML = '<div class="notice err">' + T.consent + '</div>'; return; }
      b.bt = BT;
      b.turnstile = b['cf-turnstile-response'] || ''; delete b['cf-turnstile-response'];
      submit.disabled = true; var label = submit.innerHTML; submit.innerHTML = '<span class="spin"></span> ' + T.sending;
      apiPost(b).then(function (r) {
        submit.disabled = false; submit.innerHTML = label;
        if (window.turnstile) { try { window.turnstile.reset(); } catch (e) {} }
        if (!r.ok) {
          var m = { missing_fields: T.missing + (r.fields || []).join(', '), consent_required: T.consent, economy_pickup_outside_jakarta: T.ecoOut, too_many_requests: T.tooMany, invalid_email: T.invEmail, invalid_whatsapp: T.invWa, country_not_listed: T.notListed, po_box_not_accepted: (LANG === 'id' ? 'Alamat PO Box tidak dapat dikirimi. Mohon isi alamat jalan lengkap.' : 'PO Box addresses cannot be delivered. Please enter a full street address.') }[r.error] || T.err;
          out.innerHTML = '<div class="notice err">' + esc(m) + '</div>'; out.scrollIntoView({ behavior: 'smooth' }); return;
        }
        form.classList.add('hidden');
        var trackUrl = ROOT + (LANG === 'id' ? 'id/' : '') + 'track.html?ref=' + encodeURIComponent(r.ref);
        var waText = T.waMsg + '\nRef: ' + r.ref + '\n' + T[r.product] + ' → ' + b.dest_country + '\n' + (b.actual_kg || '') + ' kg, ' + (b.pieces || 1) + ' pcs\n' + (b.shipper_company || b.shipper_name);
        out.innerHTML = '<div class="box"><div class="notice ok"><strong>' + (LANG === 'id' ? 'Permintaan booking diterima' : 'Booking request received') + '</strong></div>' +
          '<p>' + (LANG === 'id' ? 'Nomor referensi Anda:' : 'Your reference number:') + '</p><div class="ref">' + esc(r.ref) + '</div>' +
          (r.est_total ? '<p>' + (LANG === 'id' ? 'Estimasi (published rate): ' : 'Estimate (published rate): ') + '<strong>' + idr(r.est_total) + '</strong> · ' + T.chargeable + ' ' + r.chargeable_kg + ' kg</p>' : '<p>' + T.quoteNote + '</p>') +
          (r.pickup_outside_jakarta ? '<div class="notice warn">' + (LANG === 'id' ? 'Biaya pickup dari kota Anda akan kami konfirmasi sebelum pengiriman.' : 'We will confirm the pickup cost from your city before shipping.') + '</div>' : '') +
          '<p>' + (LANG === 'id' ? 'Status: menunggu konfirmasi tim kami. Konfirmasi juga dikirim ke email Anda.' : 'Status: awaiting confirmation by our team. A confirmation was also sent to your email.') + '</p>' +
          '<p style="display:flex;gap:10px;flex-wrap:wrap"><a class="btn btn-wa" href="' + waLink(waText) + '">' + (LANG === 'id' ? 'Kirim detail lewat WhatsApp' : 'Send details on WhatsApp') + '</a>' +
          '<a class="btn btn-o" href="' + trackUrl + '">' + (LANG === 'id' ? 'Lacak kiriman ini' : 'Track this shipment') + '</a>' +
          '<button class="btn btn-o" type="button" onclick="window.print()">' + (LANG === 'id' ? 'Cetak ringkasan booking' : 'Print booking summary') + '</button></p>' +
          '<p class="hint">' + (LANG === 'id' ? 'Langkah berikutnya: tim kami menimbang dan mengonfirmasi harga final, lalu menerbitkan AWB untuk ditempel pada kiriman.' : 'Next: our team weighs and confirms the final price, then issues the AWB to attach to your parcel.') + '</p></div>';
        out.scrollIntoView({ behavior: 'smooth' });
      }).catch(function () { submit.disabled = false; submit.innerHTML = label; out.innerHTML = '<div class="notice err">' + T.err + '</div>'; });
    });
  }

  /* tracking */
  function trackForm(form) {
    var out = $('[data-out]');
    function run(ref) {
      ref = String(ref || '').trim().toUpperCase();
      if (!/^[A-Z0-9-]{6,40}$/.test(ref)) { out.innerHTML = '<div class="notice err">' + T.badRef + '</div>'; return; }
      out.innerHTML = '<div class="notice info">' + T.loading + '</div>';
      apiGet({ action: 'track', ref: ref, lang: LANG }).then(function (r) {
        if (!r.ok) { out.innerHTML = '<div class="notice err">' + (r.error === 'not_found' || r.error === 'invalid_ref' ? T.notFound : r.error === 'too_many_requests' ? T.tooMany : T.err) + '</div>'; return; }
        var items = r.events.map(function (e) {
          return '<li><div class="t">' + esc(e.time) + (e.location ? ' · ' + esc(e.location) : '') + '</div><div class="st">' + esc(e.status) + '</div>' + (e.note ? '<div class="hint">' + esc(e.note) + '</div>' : '') + '</li>';
        }).join('');
        out.innerHTML = '<div class="box"><div class="ref">' + esc(r.ref) + '</div><p>' + esc(r.product ? 'PCW ' + r.product : '') + (r.destination ? ' · ' + (LANG === 'id' ? 'tujuan ' : 'to ') + esc(r.destination) : '') + '</p>' +
          (r.est_delivery ? '<p><strong>' + T.est + ':</strong> ' + esc(r.est_delivery) + '</p>' : '') +
          '<ul class="timeline">' + items + '</ul>' +
          '<p><a class="btn btn-wa btn-sm" href="' + waLink((LANG === 'id' ? 'Halo PCW, saya ingin menanyakan kiriman ' : 'Hello PCW, I have a question about shipment ') + r.ref) + '">' + (LANG === 'id' ? 'Tanya lewat WhatsApp' : 'Ask on WhatsApp') + '</a></p></div>';
      }).catch(function () { out.innerHTML = '<div class="notice err">' + T.err + '</div>'; });
    }
    form.addEventListener('submit', function (ev) { ev.preventDefault(); var ref = form.elements.ref.value; if (!form.hasAttribute('data-quick')) { history.replaceState(null, '', '?ref=' + encodeURIComponent(ref.trim().toUpperCase())); run(ref); } else { location.href = ROOT + (LANG === 'id' ? 'id/' : '') + 'track.html?ref=' + encodeURIComponent(ref.trim().toUpperCase()); } });
    var q = qs(); if (q.ref && !form.hasAttribute('data-quick')) { form.elements.ref.value = q.ref; run(q.ref); }
  }

  $all('form[data-rate]').forEach(rateForm);
  $all('form[data-book]').forEach(bookForm);
  $all('form[data-track]').forEach(trackForm);
})();
/* home hub tabs */
(function () {
  var hub = document.querySelector('[data-hub]'); if (!hub) return;
  var btns = hub.querySelectorAll('.hubbar button'), panes = hub.querySelectorAll('.hubpane');
  Array.prototype.forEach.call(btns, function (b) {
    b.addEventListener('click', function () {
      Array.prototype.forEach.call(btns, function (x) { x.classList.toggle('on', x === b); });
      Array.prototype.forEach.call(panes, function (p) { p.classList.toggle('hidden', p.getAttribute('data-pane') !== b.getAttribute('data-tab')); });
    });
  });
  if (location.hash === '#track') btns[1].click();
})();
/* stepwise rate form */
(function () {
  var form = document.querySelector('form[data-steps]'); if (!form) return;
  var steps = form.querySelectorAll('.stp'), dots = form.querySelectorAll('.stepper li');
  function go(n) {
    Array.prototype.forEach.call(steps, function (p) { p.classList.toggle('hidden', p.getAttribute('data-step') !== String(Math.min(n, 2))); });
    Array.prototype.forEach.call(dots, function (d) { var k = +d.getAttribute('data-s'); d.classList.toggle('on', k === n); d.classList.toggle('done', k < n); });
  }
  form.querySelector('[data-next]').addEventListener('click', function () {
    var c = form.elements.country; if (!c.value) { c.reportValidity(); return; } go(2);
    var kg = form.elements.kg; if (kg) kg.focus();
  });
  form.querySelector('[data-back]').addEventListener('click', function () { go(1); });
  form.addEventListener('submit', function () { go(3); }, true);
  form.addEventListener('input', function (e) { if (e.target.name === 'kg' || e.target.name === 'country') go(e.target.name === 'country' ? 1 : 2); });
  if (/[?&]kg=/.test(location.search)) go(3);
})();
