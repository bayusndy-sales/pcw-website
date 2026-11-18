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
    return '<svg viewBox="0 0 ' + (bits.length + 20) + ' 1" preserveAspectRatio="none" shape-rendering="crispEdges" style="display:block;width:100%;height:22mm"><g fill="#000">' + out + '</g></svg>';
  }
  function qr(url) { try { var q = window.qrcode(0, 'M'); q.addData(url); q.make(); return q.createSvgTag({ cellSize: 2, margin: 0, scalable: true }); } catch (e) { return ''; } }
  var CSS = '#awbOv{position:fixed;inset:0;z-index:9999;background:rgba(10,20,40,.72);overflow:auto;padding:0 0 30px}' +
    '.awb-bar{position:sticky;top:0;z-index:2;display:flex;gap:10px;align-items:center;justify-content:center;padding:12px;background:#0b1f44;color:#fff;font:600 14px system-ui,sans-serif}' +
    '.awb-bar button{border:0;border-radius:8px;padding:9px 16px;font:700 14px system-ui,sans-serif;cursor:pointer}' +
    '.awb-bar .p{background:#f5a623;color:#16202f}.awb-bar .c{background:#fff;color:#16202f}' +
    '.awb-page{width:210mm;min-height:297mm;margin:16px auto;background:#fff;color:#000;padding:12mm;box-shadow:0 8px 40px rgba(0,0,0,.4);font:13px/1.35 "Carlito",Calibri,Arial,sans-serif;position:relative;box-sizing:border-box}' +
    '.awb-page *{box-sizing:border-box}.awb-h{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #004aad;padding-bottom:8px}' +
    '.awb-h img{height:16mm;width:auto}.awb-co{font-size:11px;color:#333;margin-top:3px}.awb-ttl{text-align:right;font-weight:800;color:#004aad;font-size:17px;letter-spacing:.4px}' +
    '.awb-band{background:#004aad;color:#fff;display:flex;justify-content:space-between;padding:7px 12px;font-weight:800;letter-spacing:.6px;margin-top:8px;font-size:14px}' +
    '.awb-route{display:flex;justify-content:space-between;align-items:center;margin-top:10px}.awb-r{font-size:26px;font-weight:800;color:#00347a}.awb-r small{display:block;font-size:11px;color:#555;font-weight:600}' +
    '.awb-pc{background:#e6eefb;border:1px solid #b9cdf0;border-radius:6px;padding:7px 14px;text-align:center;font-weight:800;color:#00347a}.awb-pc small{display:block;font-weight:600;color:#445}' +
    '.awb-bc{margin-top:10px;text-align:center}.awb-no{font:700 25px "DejaVu Sans Mono",Consolas,monospace;letter-spacing:1px;margin-top:4px}' +
    '.awb-ft{display:flex;gap:10px;margin-top:10px}.awb-from{width:40%;border:1px solid #b9cdf0;border-radius:6px;padding:9px 11px}.awb-to{flex:1;background:#e6eefb;border:1px solid #b9cdf0;border-radius:6px;padding:9px 12px}' +
    '.awb-lb{font-size:10px;font-weight:800;color:#004aad;letter-spacing:.8px;margin-bottom:3px}.awb-big{font-size:20px;font-weight:800;line-height:1.2}.awb-addr{margin-top:2px}' +
    '.awb-grid{display:grid;grid-template-columns:repeat(4,1fr);margin-top:10px;border:1px solid #b9cdf0;border-radius:6px;overflow:hidden}.awb-grid>div{padding:7px 9px;border-right:1px solid #d5e0f4;border-bottom:1px solid #d5e0f4;min-height:46px}.awb-grid b{display:block;font-size:15px}' +
    '.awb-bt{display:flex;gap:10px;margin-top:10px}.awb-box{flex:1;border:1px solid #b9cdf0;border-radius:6px;padding:9px 11px;display:flex;gap:12px;align-items:center}.awb-box .q{width:30mm;height:30mm;flex:none}.awb-box .q svg{width:100%;height:100%;display:block}' +
    '.awb-pod{min-height:34mm;align-items:flex-start;flex-direction:column;gap:6px}.awb-line{border-bottom:1px solid #777;height:15px;width:100%}' +
    '.awb-foot{position:absolute;left:12mm;right:12mm;bottom:10mm;font-size:10.5px;color:#444;border-top:1px solid #ccc;padding-top:6px}' +
    '@media print{body>*:not(#awbOv){display:none!important}#awbOv{position:static;background:none;overflow:visible;padding:0}.awb-bar{display:none!important}.awb-page{margin:0;box-shadow:none;page-break-after:always;break-after:page}@page{size:A4;margin:0}}';
  function load(src) { return new Promise(function (res, rej) { if (window.qrcode) return res(); var s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); }
  function page(f, o, n, tot) {
    var ref = f.PCW_Ref, prio = /priority/i.test(f.Product || ''), pcs = tot, chg = parseFloat(f.Chargeable_Kg) || parseFloat(f.Actual_Kg) || 0, per = pcs ? (chg / pcs) : chg;
    var url = o.origin + o.base + 'track.html?ref=' + encodeURIComponent(ref);
    var dest = String(f.Dest_Country || '').toUpperCase();
    var pickup = [f.Pickup_or_Dropoff, f.Pickup_Date].filter(function (x) { return x && x !== '-'; }).join(' · ');
    var est = prio ? '3-5 working days after pickup' : '7-14 working days after pickup';
    var svc = prio ? 'PCW PRIORITY EXPRESS' : 'PCW ECONOMY EXPRESS';
    var toName = esc(f.Consignee_Name) + (f.Consignee_Company ? '<br><span style="font-size:14px">' + esc(f.Consignee_Company) + '</span>' : '');
    var g = function (l, v) { return '<div>' + l + '<b>' + esc(v == null || v === '' ? '-' : v) + '</b></div>'; };
    return '<div class="awb-page">' +
      '<div class="awb-h"><div><img src="' + esc(o.logo) + '" alt="PCW Freight"><div class="awb-co"><b>PT Prabaswara Catur Widantara</b> (PCW Freight)<br>Jl. Bukit Golf Hijau Raya No. 18, Sentul City, Kab. Bogor 16810, Indonesia<br>+62 811 9989 6752 · info@pcwfreight.com</div></div><div class="awb-ttl">INTERNATIONAL EXPRESS<br>AIR WAYBILL</div></div>' +
      '<div class="awb-band"><span>' + svc + ' · DOOR TO DOOR</span><span>HANDLE WITH CARE</span></div>' +
      '<div class="awb-route"><div class="awb-r">INDONESIA <span style="color:#f5a623">&rarr;</span> ' + esc(dest) + '<small>Origin: Jakarta area, ID · Destination: ' + esc(f.Consignee_City || dest) + '</small></div><div class="awb-pc"><small>PIECE</small><span style="font-size:22px">' + n + ' OF ' + tot + '</span><small>' + esc((f.Submitted_At || '').slice(0, 10)) + '</small></div></div>' +
      '<div class="awb-bc">' + c128(ref) + '<div class="awb-no">' + esc(ref) + '</div></div>' +
      '<div class="awb-ft"><div class="awb-from"><div class="awb-lb">FROM (SHIPPER)</div><b>' + esc(f.Shipper_Company || f.Shipper_Name) + '</b><div class="awb-addr">' + esc(f.Shipper_Name) + '<br>Tel: ' + esc(f.Shipper_WhatsApp || '-') + (pickup ? '<br>' + esc(pickup) : '') + '</div></div>' +
      '<div class="awb-to"><div class="awb-lb">TO (CONSIGNEE)</div><div class="awb-big">' + toName + '</div><div class="awb-addr">' + esc(f.Consignee_Address) + '<br>' + esc([f.Consignee_City, f.Consignee_Postcode, f.Dest_Country].filter(Boolean).join(', ')) + '<br>Tel: ' + esc(f.Consignee_Phone || '-') + '</div></div></div>' +
      '<div class="awb-grid">' + g('SERVICE', prio ? 'Priority Express' : 'Economy Express') + g('TOTAL PIECES', tot) + g('TOTAL WEIGHT (chargeable)', chg ? chg + ' kg' : '-') + g('THIS PIECE (approx.)', per ? per.toFixed(1) + ' kg' : '-') + g('DIMENSIONS (cm)', f.Dims_cm) + g('CONTENTS', f.Contents) + g('DECLARED VALUE', f.Declared_Value ? 'IDR ' + Number(f.Declared_Value).toLocaleString('id-ID') : 'Not stated') + g('EST. DELIVERY', est) + '</div>' +
      '<div class="awb-bt"><div class="awb-box"><div class="q">' + qr(url) + '</div><div><div class="awb-lb">TRACK YOUR SHIPMENT</div>pcwfreight.com/track.html<br>Enter AWB number:<br><b style="font:700 14px \'DejaVu Sans Mono\',Consolas,monospace">' + esc(ref) + '</b></div></div>' +
      '<div class="awb-box awb-pod"><div class="awb-lb">PROOF OF DELIVERY</div>Received by:<div class="awb-line"></div>Date / time:<div class="awb-line"></div>Signature:<div class="awb-line"></div></div></div>' +
      '<div class="awb-foot">Attach on top of the box and do not cover the barcode. Delivery date is an estimate and starts from pickup; customs clearance may add time. Questions: WhatsApp +62 811 9989 6752 · info@pcwfreight.com · pcwfreight.com</div></div>';
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
