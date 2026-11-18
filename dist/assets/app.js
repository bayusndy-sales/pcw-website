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
      product: 'Service', base: 'Base rate', fuel: 'Fuel surcharge (51%)', total: 'Total', allin: 'All-in price',
      chargeable: 'Chargeable weight', actual: 'Actual weight', vol: 'Volumetric weight', kg: 'kg',
      book: 'Book this', quote: 'Request a quote', quoteNote: 'Above our published table: we quote this personally.',
      Priority: 'PCW Priority Express', Economy: 'PCW Economy Express',
      notFound: 'We could not find this reference. Check the number or chat with us.', badRef: 'Please enter a valid PCW reference.',
      est: 'Estimated delivery', sending: 'Sending…', missing: 'Please complete the required fields: ',
      consent: 'Please tick the three confirmations before sending.', ecoOut: 'Economy pickup outside Jakarta is arranged by request. Please contact us by WhatsApp or email, or choose drop-off or Priority Express.',
      waMsg: 'Hello PCW, I just sent a booking request on the website.', tooMany: 'Too many requests. Please wait a while or chat with us.',
      invEmail: 'Please enter a valid email address.', invWa: 'Please enter a valid WhatsApp number.'
    },
    id: {
      loading: 'Memuat…', calc: 'Menghitung…', err: 'Maaf, terjadi kendala. Silakan coba lagi atau hubungi kami lewat WhatsApp.',
      invalid: 'Mohon isi negara tujuan dan berat.', notListed: 'Negara ini belum ada di tabel publikasi kami. Silakan minta penawaran.',
      product: 'Layanan', base: 'Tarif dasar', fuel: 'Fuel surcharge (51%)', total: 'Total', allin: 'Harga all-in',
      chargeable: 'Berat tagih (chargeable)', actual: 'Berat aktual', vol: 'Berat volumetrik', kg: 'kg',
      book: 'Booking', quote: 'Minta penawaran', quoteNote: 'Di atas tabel publikasi: kami hitungkan langsung.',
      Priority: 'PCW Priority Express', Economy: 'PCW Economy Express',
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
  var COUNTRIES = ["Australia", "Canada", "China", "France", "Germany", "Hong Kong", "India", "Italy", "Japan", "Malaysia (West)", "Netherlands", "New Zealand", "Philippines", "Saudi Arabia", "Singapore", "South Korea", "Spain", "Taiwan", "Thailand", "United Arab Emirates", "United Kingdom", "United States", "Vietnam"]; /* from published rate table; rebuild when the table changes */
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

  /* rate calculator (quick form on home + full form on rates page) */
  function rateForm(form) {
    var out = $('[data-out]', form.parentNode) || $('[data-out]');
    fillCountries($('[name=country]', form), qs().country);
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var f = new FormData(form);
      var p = { action: 'rate', country: f.get('country') || '', type: f.get('type') || 'Parcel', kg: f.get('kg') || '', pieces: f.get('pieces') || 1, l: f.get('l') || '', w: f.get('w') || '', h: f.get('h') || '' };
      if (form.hasAttribute('data-quick')) {
        location.href = ROOT + (LANG === 'id' ? 'id/' : '') + 'rates.html?' + Object.keys(p).filter(function (k) { return k !== 'action'; }).map(function (k) { return k + '=' + encodeURIComponent(p[k]); }).join('&') + '#go';
        return;
      }
      if (!p.country || !(parseFloat(p.kg) > 0)) { out.innerHTML = '<div class="notice err">' + T.invalid + '</div>'; return; }
      out.innerHTML = '<div class="notice info">' + T.calc + '</div>';
      apiGet(p).then(function (r) {
        if (!r.ok) { out.innerHTML = '<div class="notice err">' + (r.error === 'country_not_listed' ? T.notListed : T.err) + '</div>'; return; }
        out.innerHTML = renderRates(r, p);
      }).catch(function () { out.innerHTML = '<div class="notice err">' + T.err + '</div>'; });
    });
    var q = qs();
    if (!form.hasAttribute('data-quick') && q.kg) {
      ['type', 'kg', 'pieces', 'l', 'w', 'h'].forEach(function (k) {
        if (!q[k]) return; var el = form.elements[k];
        if (el && el.length && el[0] && el[0].type === 'radio') { $all('[name=' + k + ']', form).forEach(function (r) { r.checked = r.value === q[k]; }); }
        else if (el) el.value = q[k];
      });
      countries().then(function () { setTimeout(function () { form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event('submit')); }, 50); });
    }
  }

  function renderRates(r, p) {
    var rows = r.options.map(function (o) {
      var bookUrl = ROOT + (LANG === 'id' ? 'id/' : '') + 'book.html?' + ['product=' + o.product, 'country=' + encodeURIComponent(r.country), 'type=' + r.type, 'kg=' + p.kg, 'pieces=' + p.pieces, 'l=' + p.l, 'w=' + p.w, 'h=' + p.h].join('&');
      if (o.quote) {
        return '<tr><td><strong>' + T[o.product] + '</strong><div class="hint">' + T.chargeable + ': ' + o.chargeable_kg + ' ' + T.kg + '</div></td><td colspan="3">' + T.quoteNote + '</td><td><a class="btn btn-wa btn-sm" href="' + waLink((LANG === 'id' ? 'Halo PCW, mohon penawaran ' : 'Hello PCW, please quote ') + T[o.product] + ' ' + r.country + ' ' + o.chargeable_kg + ' kg') + '">' + T.quote + '</a></td></tr>';
      }
      var isP = o.product === 'Priority';
      return '<tr><td><strong>' + T[o.product] + '</strong><div class="hint">' + T.chargeable + ': ' + o.chargeable_kg + ' ' + T.kg + '</div></td>' +
        '<td class="n">' + (isP ? idr(o.base) : '—') + '</td><td class="n">' + (isP ? idr(o.fuel) : '—') + '</td>' +
        '<td class="n"><span class="price">' + idr(o.total) + '</span>' + (isP ? '' : '<div class="hint">' + T.allin + '</div>') + '</td>' +
        '<td><a class="btn btn-p btn-sm" href="' + bookUrl + '">' + T.book + '</a></td></tr>';
    }).join('');
    var head = '<div class="pub">' + (LANG === 'id' ? 'Published rate' : 'Published rate') + ' · ' + esc(r.country) + ' · ' + (r.type === 'Document' ? (LANG === 'id' ? 'Dokumen' : 'Document') : (LANG === 'id' ? 'Paket' : 'Parcel')) + '</div>' +
      '<div class="hint">' + T.actual + ': ' + r.actual_kg + ' ' + T.kg + (r.volumetric_kg ? ' · ' + T.vol + ': ' + r.volumetric_kg + ' ' + T.kg : '') + '</div>';
    var table = '<table class="rates"><thead><tr><th>' + T.product + '</th><th class="n">' + T.base + '</th><th class="n">' + T.fuel + '</th><th class="n">' + T.total + '</th><th></th></tr></thead><tbody>' + rows + '</tbody></table>';
    var biz = '<div class="notice info"><strong>' + (LANG === 'id' ? 'Akun bisnis mendapat tarif lebih rendah.' : 'Business accounts get lower rates.') + '</strong> ' +
      '<a class="btn btn-a btn-sm" style="margin-left:8px" href="' + waLink(LANG === 'id' ? 'Halo PCW, saya ingin tarif bisnis untuk pengiriman ke ' + r.country + '.' : 'Hello PCW, I would like a business rate for shipments to ' + r.country + '.') + '">' + (LANG === 'id' ? 'Dapatkan tarif bisnis' : 'Get your business rate') + '</a></div>';
    return '<div class="box" id="go">' + head + table + biz + '</div>';
  }

  /* booking form */
  function bookForm(form) {
    var q = qs(), out = $('[data-out]');
    fillCountries($('[name=dest_country]', form), q.country);
    ['product', 'type', 'kg', 'pieces', 'l', 'w', 'h'].forEach(function (k) {
      if (!q[k] || q[k] === 'undefined') return;
      var name = { type: 'shipment_type', kg: 'actual_kg' }[k] || k, el = form.elements[name];
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

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var f = new FormData(form), b = { action: 'book', lang: LANG };
      f.forEach(function (v, k) { b[k] = typeof v === 'string' ? v.trim() : v; });
      b.terms_accepted = form.elements.terms_accepted.checked;
      b.privacy_consent = form.elements.privacy_consent.checked;
      b.no_prohibited = form.elements.no_prohibited.checked;
      var missing = $all('[required]', form).filter(function (el) { return !el.closest('.hidden') && el.type !== 'checkbox' && !String(el.value).trim(); })
        .map(function (el) { return (form.querySelector('label[for=' + el.id + ']') || {}).textContent || el.name; });
      if (missing.length) { out.innerHTML = '<div class="notice err">' + T.missing + esc(missing.join(', ')) + '</div>'; return; }
      if (!b.terms_accepted || !b.privacy_consent || !b.no_prohibited) { out.innerHTML = '<div class="notice err">' + T.consent + '</div>'; return; }
      submit.disabled = true; var label = submit.innerHTML; submit.innerHTML = '<span class="spin"></span> ' + T.sending;
      apiPost(b).then(function (r) {
        submit.disabled = false; submit.innerHTML = label;
        if (!r.ok) {
          var m = { missing_fields: T.missing + (r.fields || []).join(', '), consent_required: T.consent, economy_pickup_outside_jakarta: T.ecoOut, too_many_requests: T.tooMany, invalid_email: T.invEmail, invalid_whatsapp: T.invWa, country_not_listed: T.notListed }[r.error] || T.err;
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
          '<a class="btn btn-o" href="' + trackUrl + '">' + (LANG === 'id' ? 'Lacak kiriman ini' : 'Track this shipment') + '</a></p></div>';
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
