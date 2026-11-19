#!/usr/bin/env python3
"""PCW International Express AWB label v2 (sorting-label design, 100 x 150 mm = about 4 x 6 in).
Usage: python3 awb_label.py booking.json out.pdf [--a4]
JSON: ref, ship_date, product (Priority|Economy), dest_country, dest_iso2 (optional),
 shipper_name, shipper_company, shipper_phone, pickup_address, pickup_date,
 consignee_name, consignee_company, consignee_address, consignee_city, consignee_postcode, consignee_phone,
 pieces, chargeable_kg, contents.   One label per piece (ref-k when pieces > 1).
Design rules (learned from DHL and FedEx labels): black on white only, no colour dependence; one 'sort' zone that is read
first (country code + postcode); big barcode with quiet zones; fixed zones in fixed places; small shipper, big consignee."""
import sys, json, os, io
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.graphics.barcode import code128
from reportlab.lib.utils import ImageReader, simpleSplit
import qrcode

HERE = os.path.dirname(os.path.abspath(__file__))
pdfmetrics.registerFont(TTFont('S', '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf'))
pdfmetrics.registerFont(TTFont('SB', '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf'))
pdfmetrics.registerFont(TTFont('MB', '/usr/share/fonts/truetype/liberation/LiberationMono-Bold.ttf'))
LOGO = os.path.join(HERE, 'logo_black.png')   # full-black logo for thermal printing
ISO = json.load(open(os.path.join(HERE, 'country_iso2.json')))
# Origin codes (airport/city codes) for big Indonesian cities, matched on the pickup city or address; Jabodetabek = JKT. [VERIFY codes with ops]
ORIGINS = [('JKT', ['jakarta', 'tangerang', 'bekasi', 'depok', 'bogor', 'sentul', 'cikarang', 'bsd', 'serpong', 'karawang']),
           ('SUB', ['surabaya', 'sidoarjo', 'gresik']), ('BDO', ['bandung', 'cimahi']), ('KNO', ['medan', 'deli serdang']),
           ('SRG', ['semarang']), ('JOG', ['yogyakarta', 'jogja', 'sleman', 'bantul']), ('DPS', ['denpasar', 'bali', 'badung', 'gianyar']),
           ('UPG', ['makassar']), ('BPN', ['balikpapan']), ('PLM', ['palembang']), ('BTH', ['batam']), ('MLG', ['malang']),
           ('SOC', ['solo', 'surakarta']), ('PNK', ['pontianak']), ('BDJ', ['banjarmasin']), ('MDC', ['manado']),
           ('PKU', ['pekanbaru']), ('PDG', ['padang']), ('TKG', ['bandar lampung', 'lampung'])]
def origin_code(d):
    if d.get('origin_code'): return d['origin_code'].upper()[:3]
    t = ' '.join(str(d.get(k, '')) for k in ('pickup_city', 'pickup_address')).lower()
    for code, keys in ORIGINS:
        if any(k in t for k in keys): return code
    return 'JKT' if not t.strip() else 'IDN'

W, H, M = 100 * mm, 150 * mm, 4 * mm

def draw_label(c, d, k, n, ox=0, oy=0):
    """ox, oy = bottom-left of the label on the page. All y are measured from the top of the label."""
    Y = lambda t: oy + H - t * mm
    X = lambda x: ox + x * mm
    ref = d['ref'] + ('-%d' % k if n > 1 else '')
    prio = d.get('product', 'Priority').lower().startswith('p')
    svc, code = ('PRIORITY', 'PX') if prio else ('ECONOMY', 'EC')
    est = '3-5 WORKING DAYS' if prio else '7-14 WORKING DAYS'
    iso2 = (d.get('dest_iso2') or ISO.get(d.get('dest_country', ''), '') or d.get('dest_country', '')[:2]).upper()
    c.setStrokeColorRGB(0, 0, 0); c.setFillColorRGB(0, 0, 0)
    c.setLineWidth(0.5)
    c.rect(ox, oy, W, H)                                   # label outline (cut guide)
    # 1 header
    c.drawImage(LOGO, X(4), Y(16), 12 * mm, 12 * mm, mask='auto')
    c.setFont('SB', 13); c.drawString(X(18), Y(8.3), 'PCW Freight')
    c.setFont('S', 6.3); c.drawString(X(18), Y(11.6), 'International Express')
    c.drawString(X(18), Y(14.4), 'PT Prabaswara Catur Widantara')
    c.setLineWidth(1.4); c.rect(X(64), Y(16), 32 * mm, 12 * mm)       # service box
    c.setFont('SB', 16); c.drawCentredString(X(80), Y(11.2), svc)
    c.setFont('S', 5.8); c.drawCentredString(X(80), Y(14.6), 'EXPRESS  ·  DOOR TO DOOR')
    c.setLineWidth(0.8); c.line(X(4), Y(18), X(96), Y(18))
    # 2 from (small) + origin
    c.setFont('S', 5.5); c.drawString(X(4), Y(21), 'FROM')
    c.setFont('SB', 7); c.drawString(X(4), Y(24.3), (d.get('shipper_company') or d.get('shipper_name', ''))[:44])
    c.setFont('S', 6.3)
    fl = [d.get('shipper_name', '') if d.get('shipper_company') else '']
    fl += simpleSplit(d.get('pickup_address', ''), 'S', 6.3, 60 * mm)[:2]
    fl += ['Tel: ' + d['shipper_phone']] if d.get('shipper_phone') else []
    y = 27.4
    for t in [x for x in fl if x][:4]:
        c.drawString(X(4), Y(y), t); y += 2.9
    c.setFont('S', 5.5); c.drawRightString(X(96), Y(21), 'ORIGIN')
    c.setFont('SB', 24); c.drawRightString(X(96), Y(29), origin_code(d))
    c.setLineWidth(0.8); c.line(X(4), Y(35), X(96), Y(35))
    # 3 to (large) with corner brackets
    c.setLineWidth(1.6)
    for (bx, by, sx, sy) in ((4, 36.5, 1, 1), (96, 36.5, -1, 1), (4, 65, 1, -1), (96, 65, -1, -1)):
        c.line(X(bx), Y(by), X(bx + 5 * sx), Y(by)); c.line(X(bx), Y(by), X(bx), Y(by + 5 * sy))
    c.setFont('S', 5.5); c.drawString(X(7), Y(39.5), 'TO')
    c.setFont('SB', 13.5); c.drawString(X(7), Y(44.3), (d.get('consignee_name', ''))[:36])
    y = 48.6
    if d.get('consignee_company'):
        c.setFont('SB', 9.5); c.drawString(X(7), Y(y), d['consignee_company'][:46]); y += 4.2
    c.setFont('S', 9)
    for t in simpleSplit(d.get('consignee_address', ''), 'S', 9, 84 * mm)[:3]:
        c.drawString(X(7), Y(y), t); y += 3.7
    c.setFont('SB', 9.5)
    c.drawString(X(7), Y(y), ('%s %s' % (d.get('consignee_postcode', ''), d.get('consignee_city', ''))).strip().upper()[:46]); y += 4.0
    c.setFont('SB', 9.5); c.drawString(X(7), Y(y), d.get('dest_country', '').upper())
    if d.get('consignee_phone'):
        c.setFont('S', 8); c.drawRightString(X(93), Y(62.5), 'Tel: ' + d['consignee_phone'])
    c.setLineWidth(0.8); c.line(X(0), Y(67), X(100), Y(67))
    # 4 sort zone: country code (huge) + postcode
    c.setFont('SB', 58); c.drawString(X(5), Y(83), iso2)
    c.setFont('S', 5.5); c.drawString(X(52), Y(71), 'DESTINATION POSTCODE')
    c.setFont('SB', 25); c.drawString(X(52), Y(80.5), (d.get('consignee_postcode') or '-')[:12])
    c.setFont('SB', 8.5); c.drawString(X(52), Y(85), d.get('dest_country', '').upper()[:26])
    # 5 black band (service / transit)
    c.setFillColorRGB(0, 0, 0); c.rect(X(0), Y(95), W, 8 * mm, fill=1, stroke=0)
    c.setFillColorRGB(1, 1, 1)
    c.setFont('SB', 11); c.drawString(X(5), Y(92.6), '%s-%s' % (code, iso2))
    c.setFont('SB', 7.5); c.drawRightString(X(95), Y(92.6), 'TRANSIT ' + est)
    c.setFillColorRGB(0, 0, 0)
    # 6 data cells (piece / weight / ship date) + QR
    cells = [('PIECE', '%d / %d' % (k, n)), ('WEIGHT', ('%.1f kg' % (float(d.get('chargeable_kg', 0)) / n)) if d.get('chargeable_kg') else '-'), ('SHIP DATE', d.get('ship_date', '-'))]
    cx = 4
    for lab, val in cells:
        c.setFont('S', 5.5); c.drawString(X(cx), Y(98.5), lab)
        c.setFont('SB', 14 if lab != 'SHIP DATE' else 10.5); c.drawString(X(cx), Y(105.2), val)
        cx += 23
    c.setLineWidth(0.5); c.line(X(4), Y(107.5), X(72), Y(107.5))
    c.setFont('S', 6.3)
    info = 'Contents: %s' % d.get('contents', '-')
    tot = 'Shipment: %d piece(s)%s' % (n, (', %.1f kg chargeable' % float(d['chargeable_kg'])) if d.get('chargeable_kg') else '')
    y = 110.6
    for t in simpleSplit(info, 'S', 6.3, 66 * mm)[:2] + [tot]:
        c.drawString(X(4), Y(y), t); y += 2.8
    q = qrcode.QRCode(box_size=4, border=0, error_correction=qrcode.constants.ERROR_CORRECT_M); q.add_data('https://pcwfreight.com/track?ref=' + ref); q.make()
    buf = io.BytesIO(); q.make_image(fill_color='black', back_color='white').save(buf, format='PNG'); buf.seek(0)
    c.drawImage(ImageReader(buf), X(76), Y(116.5), 20 * mm, 20 * mm)
    c.setFont('S', 5); c.drawCentredString(X(86), Y(119), 'SCAN TO TRACK')
    c.setLineWidth(0.8); c.line(X(0), Y(120.5), X(100), Y(120.5))
    # 7 barcode (module 0.40 mm, quiet zone >= 6 mm each side)
    mods = code128.Code128(ref, barWidth=1, quiet=False).width
    bwid = min(0.40 * mm, 88 * mm / mods)                      # module width: 0.40 mm, shrunk only if the number is long
    bc = code128.Code128(ref, barHeight=19 * mm, barWidth=bwid, quiet=False)
    bw = bc.width
    bc.drawOn(c, X(50) - bw / 2, Y(142))
    c.setFont('MB', 9.5); c.drawCentredString(X(50), Y(145.5), 'WAYBILL  ' + ref)
    c.setFont('S', 5); c.drawCentredString(X(50), Y(148.4), 'Attach flat on top of the parcel. Do not cover the barcode or fold over an edge.')
    return bw / mm

def build(d, out, a4=False):
    n = max(1, int(d.get('pieces', 1)))
    if a4:
        c = canvas.Canvas(out, pagesize=A4); PW, PH = A4
        for k in range(1, n + 1):
            ox, oy = 10 * mm, PH - H - 10 * mm
            draw_label(c, d, k, n, ox, oy)
            c.setDash(2, 2); c.setLineWidth(0.4); c.rect(ox - 3 * mm, oy - 3 * mm, W + 6 * mm, H + 6 * mm); c.setDash()
            c.setFont('SB', 8); c.drawString(ox + W + 12 * mm, PH - 22 * mm, 'After printing this label')
            c.setFont('S', 8)
            for i, t in enumerate(['1. Print at 100% (do not scale to fit).', '2. Cut along the dashed line.', '3. Stick the label flat on top of the parcel,', '    with the barcode fully visible.']):
                c.drawString(ox + W + 12 * mm, PH - (28 + 5 * i) * mm, t)
            c.showPage()
    else:
        c = canvas.Canvas(out, pagesize=(W, H))
        for k in range(1, n + 1):
            draw_label(c, d, k, n); c.showPage()
    c.save()

if __name__ == '__main__':
    d = json.load(open(sys.argv[1])); build(d, sys.argv[2], '--a4' in sys.argv)
