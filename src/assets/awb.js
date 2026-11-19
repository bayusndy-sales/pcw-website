/* PCW Freight - printable AWB (Code 128 barcode + QR). Loaded on demand by portal.js */
(function () {
  var PAT = ['11011001100','11001101100','11001100110','10010011000','10010001100','10001001100','10011001000','10011000100','10001100100','11001001000','11001000100','11000100100','10110011100','10011011100','10011001110','10111001100','10011101100','10011100110','11001110010','11001011100','11001001110','11011100100','11001110100','11101101110','11101001100','11100101100','11100100110','11101100100','11100110100','11100110010','11011011000','11011000110','11000110110','10100011000','10001011000','10001000110','10110001000','10001101000','10001100010','11010001000','11000101000','11000100010','10110111000','10110001110','10001101110','10111011000','10111000110','10001110110','11101110110','11010001110','11000101110','11011101000','11011100010','11011101110','11101011000','11101000110','11100010110','11101101000','11101100010','11100011010','11101111010','11001000010','11110001010','10100110000','10100001100','10010110000','10010000110','10000101100','10000100110','10110010000','10110000100','10011010000','10011000010','10000110100','10000110010','11000010010','11001010000','11110111010','11000010100','10001111010','10100111100','10010111100','10010011110','10111100100','10011110100','10011110010','11110100100','11110010100','11110010010','11011011110','11011110110','11110110110','10101111000','10100011110','10001011110','10111101000','10111100010','11110101000','11110100010','10111011110','10111101110','11101011110','11110101110','11010000100','11010010000','11010011100','1100011101011'];
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function c128(text) {
    var codes = [104], sum = 104, i, c;
    for (i = 0; i < text.length; i++) { c = text.charCodeAt(i) - 32; if (c < 0 || c > 95) c = 0; codes.push(c); sum += c * (i + 1); }
    codes.push(sum % 103); codes.push(106);
    var bits = codes.map(function (k) { return PAT[k]; }).join(''), out = '', j;
    i = 0; while (i < bits.length) { if (bits.charAt(i) === '1') { j = i; while (bits.charAt(j) === '1') j++; out += '<rect x="' + (i + 10) + '" y="0" width="' + (j - i) + '" height="1"/>'; i = j; } else i++; }
    return '<svg viewBox="0 0 ' + (bits.length + 20) + ' 1" preserveAspectRatio="none" shape-rendering="crispEdges" style="display:block;width:100%;height:100%"><g fill="#000">' + out + '</g></svg>';
  }
  function qr(url) { try { var q = window.qrcode(0, 'M'); q.addData(url); q.make(); return q.createSvgTag({ cellSize: 2, margin: 0, scalable: true }); } catch (e) { return ''; } }
  var ISO = {"Albania":"AL","Algeria":"DZ","American Samoa":"AS","Andorra":"AD","Angola":"AO","Anguilla":"AI","Antigua & Barbuda":"AG","Argentina":"AR","Armenia":"AM","Aruba":"AW","Australia":"AU","Austria":"AT","Azerbaijan":"AZ","Bahamas":"BS","Bahrain":"BH","Bangladesh":"BD","Barbados":"BB","Belarus":"BY","Belgium":"BE","Belize":"BZ","Benin":"BJ","Bermuda":"BM","Bhutan":"BT","Bolivia":"BO","Bonaire":"XB","Bosnia & Herzegovina":"BA","Botswana":"BW","Brazil":"BR","British Virgin Islands":"VG","Brunei":"BN","Bulgaria":"BG","Burkina Faso":"BF","Burundi":"BI","Cabo Verde":"CV","Cambodia":"KH","Cameroon":"CM","Canada":"CA","Canary Islands":"IC","Cayman Islands":"KY","Central African Republic":"CF","Chad":"TD","Chile":"CL","China":"CN","Colombia":"CO","Comoros":"KM","Congo":"CG","Congo (Dem. Rep.)":"CD","Cook Islands":"CK","Costa Rica":"CR","Cote d'Ivoire":"CI","Croatia":"HR","Curacao":"XC","Cyprus":"CY","Czech Republic":"CZ","Denmark":"DK","Djibouti":"DJ","Dominica":"DM","Dominican Republic":"DO","Ecuador":"EC","Egypt":"EG","El Salvador":"SV","Equatorial Guinea":"GQ","Eritrea":"ER","Estonia":"EE","Eswatini":"SZ","Ethiopia":"ET","Falkland Islands":"FK","Faroe Islands":"FO","Fiji":"FJ","Finland":"FI","France":"FR","French Guiana":"GF","Gabon":"GA","Gambia":"GM","Georgia":"GE","Germany":"DE","Ghana":"GH","Gibraltar":"GI","Greece":"GR","Greenland":"GL","Grenada":"GD","Guadeloupe":"GP","Guam":"GU","Guatemala":"GT","Guernsey":"GG","Guinea":"GN","Guinea-Bissau":"GW","Guyana":"GY","Haiti":"HT","Honduras":"HN","Hong Kong":"HK","Hungary":"HU","Iceland":"IS","India":"IN","Iraq":"IQ","Ireland":"IE","Italy":"IT","Jamaica":"JM","Japan":"JP","Jersey":"JE","Jordan":"JO","Kazakhstan":"KZ","Kenya":"KE","Kiribati":"KI","Kosovo":"KV","Kuwait":"KW","Kyrgyzstan":"KG","Laos":"LA","Latvia":"LV","Lebanon":"LB","Lesotho":"LS","Liberia":"LR","Libya":"LY","Liechtenstein":"LI","Lithuania":"LT","Luxembourg":"LU","Macau":"MO","Madagascar":"MG","Malawi":"MW","Malaysia (West)":"MY","Maldives":"MV","Mali":"ML","Malta":"MT","Marshall Islands":"MH","Martinique":"MQ","Mauritania":"MR","Mauritius":"MU","Mayotte":"YT","Mexico":"MX","Micronesia":"FM","Moldova":"MD","Monaco":"MC","Mongolia":"MN","Montenegro":"ME","Montserrat":"MS","Morocco":"MA","Mozambique":"MZ","Myanmar":"MM","Namibia":"NA","Nauru":"NR","Nepal":"NP","Netherlands":"NL","Nevis":"XN","New Caledonia":"NC","New Zealand":"NZ","Nicaragua":"NI","Niger":"NE","Nigeria":"NG","Niue":"NU","North Macedonia":"MK","Northern Mariana Islands":"MP","Norway":"NO","Oman":"OM","Pakistan":"PK","Palau":"PW","Panama":"PA","Papua New Guinea":"PG","Paraguay":"PY","Peru":"PE","Philippines":"PH","Poland":"PL","Portugal":"PT","Puerto Rico":"PR","Qatar":"QA","Reunion":"RE","Romania":"RO","Russia":"RU","Rwanda":"RW","Samoa":"WS","San Marino":"SM","Sao Tome & Principe":"ST","Saudi Arabia":"SA","Senegal":"SN","Serbia":"RS","Seychelles":"SC","Sierra Leone":"SL","Singapore":"SG","Slovakia":"SK","Slovenia":"SI","Solomon Islands":"SB","Somalia":"SO","Somaliland":"XS","South Africa":"ZA","South Korea":"KR","South Sudan":"SS","Spain":"ES","Sri Lanka":"LK","St. Barthelemy":"XY","St. Eustatius":"XE","St. Helena":"SH","St. Kitts":"KN","St. Lucia":"LC","St. Maarten":"XM","St. Vincent":"VC","Sudan":"SD","Suriname":"SR","Sweden":"SE","Switzerland":"CH","Tahiti (French Polynesia)":"PF","Taiwan":"TW","Tajikistan":"TJ","Tanzania":"TZ","Thailand":"TH","Timor-Leste":"TL","Togo":"TG","Tonga":"TO","Trinidad & Tobago":"TT","Tunisia":"TN","Turkey":"TR","Turkmenistan":"TM","Turks & Caicos":"TC","Tuvalu":"TV","US Virgin Islands":"VI","Uganda":"UG","Ukraine":"UA","United Arab Emirates":"AE","United Kingdom":"GB","United States":"US","Uruguay":"UY","Uzbekistan":"UZ","Vanuatu":"VU","Vatican City":"VA","Venezuela":"VE","Vietnam":"VN","Yemen":"YE","Zambia":"ZM","Zimbabwe":"ZW"};
  var ORIGINS = [['JKT', ['jakarta', 'tangerang', 'bekasi', 'depok', 'bogor', 'sentul', 'cikarang', 'bsd', 'serpong', 'karawang']], ['SUB', ['surabaya', 'sidoarjo', 'gresik']], ['BDO', ['bandung', 'cimahi']], ['KNO', ['medan', 'deli serdang']], ['SRG', ['semarang']], ['JOG', ['yogyakarta', 'jogja', 'sleman', 'bantul']], ['DPS', ['denpasar', 'bali', 'badung', 'gianyar']], ['UPG', ['makassar']], ['BPN', ['balikpapan']], ['PLM', ['palembang']], ['BTH', ['batam']], ['MLG', ['malang']], ['SOC', ['solo', 'surakarta']], ['PNK', ['pontianak']], ['BDJ', ['banjarmasin']], ['MDC', ['manado']], ['PKU', ['pekanbaru']], ['PDG', ['padang']], ['TKG', ['bandar lampung', 'lampung']]];
  function originCode(f) {
    var t = ((f.Pickup_City || '') + ' ' + (f.Pickup_Address || '')).toLowerCase();
    for (var i = 0; i < ORIGINS.length; i++) for (var j = 0; j < ORIGINS[i][1].length; j++) if (t.indexOf(ORIGINS[i][1][j]) > -1) return ORIGINS[i][0];
    return t.trim() ? 'IDN' : 'JKT';
  }
  var MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  function dmy(s) { var m = String(s || '').match(/(\d{4})-(\d{2})-(\d{2})/); return m ? (parseInt(m[3], 10) + ' ' + MON[parseInt(m[2], 10) - 1] + ' ' + m[1]) : '-'; }
  function c128len(text) { return (text.length + 2) * 11 + 13; }
  /* Label 100 x 150 mm, black on white only (prints on any printer, no colour needed). Printed on A4 with a dashed cut line. */
  var CSS = '#awbOv{position:fixed;inset:0;z-index:9999;background:rgba(10,20,40,.72);overflow:auto;padding:0 0 30px}' +
    '.awb-bar{position:sticky;top:0;z-index:2;display:flex;gap:10px;align-items:center;justify-content:center;padding:12px;background:#0b1f44;color:#fff;font:600 14px system-ui,sans-serif}' +
    '.awb-bar button{border:0;border-radius:8px;padding:9px 16px;font:700 14px system-ui,sans-serif;cursor:pointer}.awb-bar .p{background:#f5a623;color:#16202f}.awb-bar .c{background:#fff;color:#16202f}' +
    '.awb-page{width:210mm;height:297mm;margin:16px auto;background:#fff;color:#000;position:relative;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,.4);font-family:"Liberation Sans",Arial,Helvetica,sans-serif}' +
    '.awb-cut{position:absolute;left:7mm;top:7mm;width:106mm;height:156mm;border:.3mm dashed #000}' +
    '.awb-ins{position:absolute;left:120mm;top:10mm;width:80mm;font-size:9pt;line-height:1.5}.awb-ins b{display:block;font-size:10pt;margin-bottom:2mm}' +
    '.lab{position:absolute;left:10mm;top:10mm;width:100mm;height:150mm;border:.4mm solid #000;box-sizing:border-box;overflow:hidden}' +
    '.lab *{box-sizing:border-box}.lab .a{position:absolute;white-space:nowrap;line-height:1}.lab .ln{position:absolute;left:0;right:0;border-top:.3mm solid #000}.lab .ln2{position:absolute;left:4mm;border-top:.3mm solid #000}' +
    '.lab .b{font-weight:700}.lab .wrap{position:absolute;white-space:normal;overflow:hidden}' +
    '.lab .svc{position:absolute;left:64mm;top:2mm;width:32mm;height:12mm;border:.5mm solid #000;text-align:center}.lab .svc .t{font-weight:700;font-size:16pt;margin-top:1.8mm;line-height:1}.lab .svc .s{font-size:5.8pt;margin-top:1.6mm}' +
    '.lab .br{position:absolute;width:5mm;height:5mm;border:0 solid #000}' +
    '.lab .band{position:absolute;left:0;right:0;top:87mm;height:8mm;background:#000;-webkit-print-color-adjust:exact;print-color-adjust:exact}' +
    '.lab .bc{position:absolute;left:50%;transform:translateX(-50%);top:123mm;height:19mm}.lab .qr{position:absolute;left:76mm;top:97mm;width:20mm;height:20mm}.lab .qr svg{width:100%;height:100%;display:block}' +
    '@media print{body>*:not(#awbOv){display:none!important}#awbOv{position:static;background:none;overflow:visible;padding:0}.awb-bar{display:none!important}.awb-page{margin:0;box-shadow:none;page-break-after:always;break-after:page}@page{size:A4;margin:0}}';
  function load(src) { return new Promise(function (res, rej) { if (window.qrcode) return res(); var s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); }
  function page(f, o, n, tot) {
    var base = f.PCW_Ref, ref = base + (tot > 1 ? '-' + n : ''), prio = /priority/i.test(f.Product || '');
    var chg = parseFloat(f.Chargeable_Kg) || parseFloat(f.Actual_Kg) || 0, per = tot ? chg / tot : chg;
    var url = o.origin + o.base + 'track.html?ref=' + encodeURIComponent(ref);
    var ctry = String(f.Dest_Country || ''), iso = (ISO[ctry] || ctry.slice(0, 2)).toUpperCase();
    var svc = prio ? 'PRIORITY' : 'ECONOMY', code = prio ? 'PX' : 'EC', est = prio ? '3-5 WORKING DAYS' : '7-14 WORKING DAYS';
    var pick = [f.Pickup_Date].filter(function (x) { return x && x !== '-'; })[0] || f.Submitted_At;
    var at = function (css, cls, html) { return '<div class="a ' + (cls || '') + '" style="' + css + '">' + html + '</div>'; };
    var y = 45.4, co = '';
    if (f.Consignee_Company) { co = at('left:7mm;top:' + y + 'mm;font-size:9.5pt', 'b', esc(String(f.Consignee_Company).slice(0, 46))); y += 4.2; }

    var adr = '<div class="wrap" style="left:7mm;top:' + y + 'mm;width:86mm;height:7.8mm;font-size:8.5pt;line-height:1.25">' + esc(f.Consignee_Address) + '</div>';
    var cityY = y + 8.4;
    var shipper = [f.Shipper_Name && f.Shipper_Company ? f.Shipper_Name : '', f.Pickup_Address || '', f.Shipper_WhatsApp ? 'Tel: ' + f.Shipper_WhatsApp : ''].filter(Boolean);
    var from = at('left:4mm;top:18.6mm;font-size:5.5pt', '', 'FROM') + at('left:4mm;top:21.2mm;font-size:7pt', 'b', esc(String(f.Shipper_Company || f.Shipper_Name || '').slice(0, 44))) +
      '<div class="wrap" style="left:4mm;top:24.4mm;width:62mm;height:10mm;font-size:6.3pt;line-height:1.35">' + shipper.map(esc).join('<br>') + '</div>';
    return '<div class="awb-page"><div class="awb-cut"></div>' +
      '<div class="awb-ins"><b>After printing this label</b>1. Print at 100% (do not scale to fit).<br>2. Cut along the dashed line.<br>3. Stick the label flat on top of the parcel, with the barcode fully visible.<br><br>Questions: WhatsApp +62 811 9989 6752<br>info@pcwfreight.com</div>' +
      '<div class="lab">' +
      '<img src="' + esc(o.logo) + '" alt="PCW" style="position:absolute;left:4mm;top:4mm;width:12mm;height:12mm">' +
      at('left:18mm;top:4.4mm;font-size:13pt', 'b', 'PCW Freight') + at('left:18mm;top:9.6mm;font-size:6.3pt', '', 'International Express') + at('left:18mm;top:12.4mm;font-size:6.3pt', '', 'PT Prabaswara Catur Widantara') +
      '<div class="svc"><div class="t">' + svc + '</div><div class="s">EXPRESS &nbsp;&middot;&nbsp; DOOR TO DOOR</div></div>' +
      '<div class="ln" style="top:18mm"></div>' + from +
      at('right:4mm;top:19.4mm;font-size:5.5pt', '', 'ORIGIN') + at('right:4mm;top:22.6mm;font-size:24pt', 'b', originCode(f)) +
      '<div class="ln" style="top:35mm"></div>' +
      '<div class="br" style="left:4mm;top:36.5mm;border-top-width:.6mm;border-left-width:.6mm"></div><div class="br" style="right:4mm;top:36.5mm;border-top-width:.6mm;border-right-width:.6mm"></div>' +
      '<div class="br" style="left:4mm;top:60mm;border-bottom-width:.6mm;border-left-width:.6mm"></div><div class="br" style="right:4mm;top:60mm;border-bottom-width:.6mm;border-right-width:.6mm"></div>' +
      at('left:7mm;top:37.2mm;font-size:5.5pt', '', 'TO') + at('left:7mm;top:39.6mm;font-size:13pt', 'b', esc(String(f.Consignee_Name || '').slice(0, 36))) + co + adr +
      at('left:7mm;top:' + cityY + 'mm;font-size:9.5pt', 'b', esc(((f.Consignee_Postcode || '') + ' ' + (f.Consignee_City || '')).trim().toUpperCase().slice(0, 46))) +
      at('left:7mm;top:' + (cityY + 4.2) + 'mm;font-size:9.5pt', 'b', esc(ctry.toUpperCase())) +
      (f.Consignee_Phone ? at('right:10mm;top:' + (cityY + 4.4) + 'mm;font-size:8pt', '', 'Tel: ' + esc(f.Consignee_Phone)) : '') +
      '<div class="ln" style="top:67mm"></div>' +
      at('left:5mm;top:68mm;font-size:58pt', 'b', esc(iso)) + at('left:52mm;top:69mm;font-size:5.5pt', '', 'DESTINATION POSTCODE') + at('left:52mm;top:74mm;font-size:25pt', 'b', esc(String(f.Consignee_Postcode || '-').slice(0, 12))) + at('left:52mm;top:82mm;font-size:8.5pt', 'b', esc(ctry.toUpperCase().slice(0, 26))) +
      '<div class="band"></div>' + at('left:5mm;top:89.6mm;font-size:11pt;color:#fff', 'b', code + '-' + esc(iso)) + at('right:5mm;top:90.4mm;font-size:7.5pt;color:#fff', 'b', 'TRANSIT ' + est) +
      at('left:4mm;top:97.4mm;font-size:5.5pt', '', 'PIECE') + at('left:4mm;top:100.6mm;font-size:14pt', 'b', n + ' / ' + tot) +
      at('left:27mm;top:97.4mm;font-size:5.5pt', '', 'WEIGHT') + at('left:27mm;top:100.6mm;font-size:14pt', 'b', per ? per.toFixed(1) + ' kg' : '-') +
      at('left:50mm;top:97.4mm;font-size:5.5pt', '', 'DATE') + at('left:50mm;top:101.2mm;font-size:10pt', 'b', dmy(pick)) +
      '<div class="ln2" style="top:108mm;width:68mm"></div>' +
      '<div class="wrap" style="left:4mm;top:109.6mm;width:68mm;height:6mm;font-size:6.3pt;line-height:1.3">Contents: ' + esc(f.Contents || '-') + '</div>' +
      at('left:4mm;top:115.6mm;font-size:6.3pt', '', 'Shipment: ' + tot + ' piece(s)' + (chg ? ', ' + chg + ' kg chargeable' : '')) +
      '<div class="qr">' + qr(url) + '</div>' + at('left:76mm;top:118mm;width:20mm;text-align:center;font-size:5pt', '', 'SCAN TO TRACK') +
      '<div class="ln" style="top:120.5mm"></div>' +
      '<div class="bc" style="width:' + Math.min(88, 0.4 * (c128len(ref) + 20)) + 'mm">' + c128(ref) + '</div>' +
      at('left:0;right:0;top:142.6mm;text-align:center;font:700 9.5pt \'Liberation Mono\',\'DejaVu Sans Mono\',Consolas,monospace', '', 'WAYBILL &nbsp;' + esc(ref)) +
      at('left:0;right:0;top:146.6mm;text-align:center;font-size:5pt', '', 'Carried under PCW Terms &amp; Conditions: pcwfreight.com/terms. Attach flat on top of the parcel; do not cover the barcode.') +
      '</div></div>';
  }
  window.PCWAWB = {
    open: function (f, o) {
      o = o || {}; o.base = o.base || ''; o.origin = o.origin || location.origin;
      return load(o.qrSrc).catch(function () {}).then(function () {
        var old = document.getElementById('awbOv'); if (old) old.remove();
        if (!document.getElementById('awbCss')) { var st = document.createElement('style'); st.id = 'awbCss'; st.textContent = CSS; document.head.appendChild(st); }
        var tot = Math.max(1, Math.min(50, parseInt(f.Pieces, 10) || 1)), html = '';
        for (var i = 1; i <= tot; i++) html += page(f, o, i, tot);
        var ov = document.createElement('div'); ov.id = 'awbOv';
        ov.innerHTML = '<div class="awb-bar"><span>AWB ' + esc(f.PCW_Ref) + ' - ' + tot + (tot > 1 ? ' pages' : ' page') + '</span><button class="p" type="button">Print / Save as PDF</button><button class="c" type="button">Close</button></div>' + html;
        document.body.appendChild(ov);
        ov.querySelector('.p').onclick = function () { window.print(); };
        ov.querySelector('.c').onclick = function () { ov.remove(); };
      });
    }
  };
})();
