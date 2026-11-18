#!/usr/bin/env python3
"""PCW International Express AWB generator.
Usage: python3 awb.py booking.json out.pdf
JSON keys: ref, ship_date, product (Priority|Economy), origin_code, dest_code, dest_country,
 shipper_name, shipper_company, shipper_phone, pickup_address, pickup_date,
 consignee_name, consignee_company, consignee_address, consignee_city, consignee_postcode, consignee_phone,
 pieces, gross_kg, chargeable_kg, dims, contents, declared_value, extras, est_delivery
One page per piece. Tracking is always https://pcwfreight.com/track?ref=<ref>."""
import sys, json, os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.graphics.barcode import code128
import qrcode, io
from reportlab.lib.utils import ImageReader

pdfmetrics.registerFont(TTFont('Carlito', '/usr/share/fonts/truetype/crosextra/Carlito-Regular.ttf'))
pdfmetrics.registerFont(TTFont('Carlito-B', '/usr/share/fonts/truetype/crosextra/Carlito-Bold.ttf'))
pdfmetrics.registerFont(TTFont('Mono-B', '/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf'))
BLUE = (0/255, 74/255, 173/255); LIGHT = (230/255, 238/255, 251/255)
LOGO = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src', 'assets', 'logo.png')
CO = ('PCW Freight', 'PT Prabaswara Catur Widantara', 'Jl. Bukit Golf Hijau Raya No. 18, Sentul City, Kab. Bogor 16810, Indonesia', '+62 811 9989 6752', 'info@pcwfreight.com')

def wrap(c, text, font, size, width):
    words, lines, cur = str(text or '').split(), [], ''
    for w in words:
        t = (cur + ' ' + w).strip()
        if c.stringWidth(t, font, size) <= width: cur = t
        else: lines.append(cur); cur = w
    if cur: lines.append(cur)
    return lines

def put(c, x, y, text, font='Carlito', size=10, color=(0, 0, 0)):
    c.setFont(font, size); c.setFillColorRGB(*color); c.drawString(x, y, str(text))

def para(c, x, y, text, width, font='Carlito', size=10, lead=None, maxl=6):
    lead = lead or size * 1.25
    for ln in wrap(c, text, font, size, width)[:maxl]:
        put(c, x, y, ln, font, size); y -= lead
    return y

def page(c, b, k, n):
    W, H = A4; m = 12 * mm; x0, x1 = m, W - m; y = H - m
    # 1 header
    if os.path.exists(LOGO): c.drawImage(LOGO, x0, y - 16 * mm, height=16 * mm, width=16 * mm, preserveAspectRatio=True, mask='auto')
    put(c, x0 + 19 * mm, y - 5 * mm, CO[0], 'Carlito-B', 15, BLUE)
    put(c, x0 + 19 * mm, y - 10 * mm, CO[1], 'Carlito', 9)
    put(c, x0 + 19 * mm, y - 14 * mm, CO[2], 'Carlito', 7.5)
    put(c, x0 + 19 * mm, y - 18 * mm, CO[3] + '  ·  ' + CO[4], 'Carlito', 7.5)
    c.setFont('Carlito-B', 13); c.setFillColorRGB(*BLUE); c.drawRightString(x1, y - 8 * mm, 'INTERNATIONAL EXPRESS AIR WAYBILL')
    y -= 21 * mm; c.setStrokeColorRGB(*BLUE); c.setLineWidth(1.4); c.line(x0, y, x1, y)
    # 2 service band
    prod = b.get('product', 'Priority'); y -= 9 * mm
    c.setFillColorRGB(*BLUE); c.rect(x0, y, x1 - x0, 8 * mm, fill=1, stroke=0)
    put(c, x0 + 3 * mm, y + 2.4 * mm, 'PCW %s EXPRESS · DOOR TO DOOR' % prod.upper(), 'Carlito-B', 12, (1, 1, 1))
    c.setFont('Carlito-B', 9); c.setFillColorRGB(1, 1, 1)
    c.drawRightString(x1 - 3 * mm, y + 2.6 * mm, 'PRIORITY HANDLING' if prod == 'Priority' else 'ECONOMY SERVICE')
    # 3 route strip
    y -= 22 * mm
    put(c, x0, y + 5 * mm, b.get('origin_code', 'CGK'), 'Carlito-B', 40)
    put(c, x0 + 38 * mm, y + 7 * mm, '→', 'Carlito-B', 28, BLUE)
    put(c, x0 + 56 * mm, y + 5 * mm, b.get('dest_code', '---'), 'Carlito-B', 40)
    put(c, x0, y - 1 * mm, 'Indonesia', 'Carlito', 10); put(c, x0 + 56 * mm, y - 1 * mm, b.get('dest_country', ''), 'Carlito', 10)
    c.setFillColorRGB(*LIGHT); c.roundRect(x1 - 52 * mm, y - 2 * mm, 52 * mm, 20 * mm, 2 * mm, fill=1, stroke=0)
    put(c, x1 - 48 * mm, y + 11 * mm, 'PIECE %d OF %d' % (k, n), 'Carlito-B', 15, BLUE)
    put(c, x1 - 48 * mm, y + 4 * mm, 'Ship date: ' + str(b.get('ship_date', '')), 'Carlito', 10)
    # 4 barcode
    ref = b['ref'] + ('' if n == 1 else '-%d' % k)
    y -= 33 * mm
    bc = code128.Code128(ref, barWidth=0.52 * mm, barHeight=22 * mm, quiet=False)
    bc.drawOn(c, x0 + (x1 - x0 - bc.width) / 2, y)
    c.setFont('Mono-B', 20); c.setFillColorRGB(0, 0, 0); c.drawCentredString((x0 + x1) / 2, y - 8 * mm, ref)
    # 5 from / to
    y -= 16 * mm; top = y
    fw = (x1 - x0) * 0.40
    put(c, x0, y, 'FROM', 'Carlito-B', 9, BLUE)
    yy = para(c, x0, y - 5 * mm, b.get('shipper_company') or b.get('shipper_name'), fw - 4 * mm, 'Carlito-B', 11, maxl=2)
    if b.get('shipper_company'): yy = para(c, x0, yy, 'Attn: ' + str(b.get('shipper_name', '')), fw - 4 * mm, size=9.5, maxl=1)
    yy = para(c, x0, yy, b.get('pickup_address', ''), fw - 4 * mm, size=9.5, maxl=3)
    yy = para(c, x0, yy, 'Tel: ' + str(b.get('shipper_phone', '')), fw - 4 * mm, size=9.5, maxl=1)
    if b.get('pickup_date'): yy = para(c, x0, yy, 'Pickup: ' + str(b['pickup_date']), fw - 4 * mm, size=9.5, maxl=1)
    c.setFillColorRGB(*LIGHT); c.roundRect(x0 + fw, y - 36 * mm, (x1 - x0) - fw, 40 * mm, 2 * mm, fill=1, stroke=0)
    tx = x0 + fw + 4 * mm; tw = (x1 - x0) - fw - 8 * mm
    put(c, tx, y, 'TO', 'Carlito-B', 9, BLUE)
    yy = para(c, tx, y - 7 * mm, b.get('consignee_name'), tw, 'Carlito-B', 16, maxl=2, lead=19)
    if b.get('consignee_company'): yy = para(c, tx, yy, b['consignee_company'], tw, 'Carlito-B', 10.5, maxl=1)
    addr = ', '.join(x for x in [b.get('consignee_address'), b.get('consignee_city'), b.get('consignee_postcode'), b.get('dest_country')] if x)
    yy = para(c, tx, yy, addr, tw, size=10.5, maxl=4)
    para(c, tx, yy, 'Tel: ' + str(b.get('consignee_phone', '')), tw, size=10.5, maxl=1)
    # 6 details grid 4x2
    y = top - 44 * mm
    cells = [('SERVICE', 'PCW %s Express' % prod), ('TOTAL PIECES', n), ('GROSS WEIGHT', '%s kg' % b.get('gross_kg', '')), ('CHARGEABLE WEIGHT', '%s kg' % b.get('chargeable_kg', '')),
             ('DIMENSIONS', b.get('dims', '-') or '-'), ('CONTENTS', b.get('contents', '')), ('DECLARED VALUE', ('IDR ' + str(b['declared_value'])) if b.get('declared_value') else 'Not stated'), ('EST. DELIVERY', b.get('est_delivery', 'To be confirmed'))]
    cw = (x1 - x0) / 4; rh = 15 * mm
    c.setStrokeColorRGB(0.8, 0.84, 0.9); c.setLineWidth(.6)
    for i, (lab, val) in enumerate(cells):
        cx = x0 + (i % 4) * cw; cy = y - (i // 4) * rh
        c.rect(cx, cy - rh, cw, rh, fill=0, stroke=1)
        put(c, cx + 2 * mm, cy - 4.5 * mm, lab, 'Carlito-B', 7.5, BLUE)
        para(c, cx + 2 * mm, cy - 9.5 * mm, val, cw - 4 * mm, 'Carlito-B', 10, maxl=2, lead=11)
    y -= 2 * rh + 5 * mm
    if b.get('extras'):
        put(c, x0, y, 'EXTRAS REQUESTED: ' + str(b['extras']), 'Carlito-B', 9, BLUE); y -= 5 * mm
    if n > 1:
        sib = '   '.join(b['ref'] + '-%d' % j for j in range(1, n + 1))
        put(c, x0, y, 'Pieces in this shipment: ' + sib, 'Carlito', 8.5); y -= 5 * mm
    # 8 tracking + POD
    y -= 36 * mm
    url = 'https://pcwfreight.com/track?ref=' + b['ref']
    img = qrcode.make(url); buf = io.BytesIO(); img.save(buf, 'PNG'); buf.seek(0)
    c.setStrokeColorRGB(*BLUE); c.setLineWidth(.8); c.rect(x0, y, 80 * mm, 34 * mm, fill=0, stroke=1)
    c.drawImage(ImageReader(buf), x0 + 2 * mm, y + 2 * mm, 30 * mm, 30 * mm)
    put(c, x0 + 35 * mm, y + 27 * mm, 'TRACK THIS SHIPMENT', 'Carlito-B', 9, BLUE)
    para(c, x0 + 35 * mm, y + 22 * mm, 'pcwfreight.com/track', 43 * mm, 'Carlito-B', 10.5, maxl=1)
    para(c, x0 + 35 * mm, y + 17 * mm, 'Scan the QR code, or enter this number:', 43 * mm, size=8.5, maxl=2)
    para(c, x0 + 35 * mm, y + 8 * mm, b['ref'], 43 * mm, 'Mono-B', 9, maxl=1)
    px = x0 + 84 * mm; pw = x1 - px
    c.rect(px, y, pw, 34 * mm, fill=0, stroke=1)
    put(c, px + 3 * mm, y + 28 * mm, 'PROOF OF DELIVERY', 'Carlito-B', 9, BLUE)
    put(c, px + 3 * mm, y + 20 * mm, 'Received by: ____________________________', 'Carlito', 9.5)
    put(c, px + 3 * mm, y + 12 * mm, 'Date / time: ____________________________', 'Carlito', 9.5)
    put(c, px + 3 * mm, y + 4 * mm, 'Signature:  ____________________________', 'Carlito', 9.5)
    # 9 footer
    fy = m + 4 * mm
    c.setStrokeColorRGB(*BLUE); c.setLineWidth(1); c.line(x0, fy + 8 * mm, x1, fy + 8 * mm)
    put(c, x0, fy + 3 * mm, 'Attach this label on top of the box. Do not cover the barcode. The delivery date is an estimate.', 'Carlito', 8.5)
    put(c, x0, fy - 1.5 * mm, 'PCW Freight · WhatsApp +62 811 9989 6752 · info@pcwfreight.com · pcwfreight.com', 'Carlito', 8.5, BLUE)

def build(b, out):
    n = int(b.get('pieces', 1) or 1)
    c = canvas.Canvas(out, pagesize=A4); c.setTitle('AWB ' + b['ref']); c.setAuthor('PCW Freight')
    for k in range(1, n + 1):
        page(c, b, k, n); c.showPage()
    c.save()

if __name__ == '__main__':
    build(json.load(open(sys.argv[1])), sys.argv[2])
