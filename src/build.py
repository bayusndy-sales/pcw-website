#!/usr/bin/env python3
"""Build the static PCW Freight site (EN at root, ID under /id/). Output: dist/"""
import os, re, shutil, html, sys
SRC = os.path.dirname(os.path.abspath(__file__))
DIST = os.path.join(SRC, 'dist')
TERMS_MD = sys.argv[1] if len(sys.argv) > 1 else ''
WA = '6281199896752'
SITE = 'https://pcwfreight.com/'

def wa(text):
    from urllib.parse import quote
    return f'https://wa.me/{WA}?text={quote(text)}'

NAV = {
 'en': [('international-express.html','Express'),('rates.html','Rates'),('book.html','Book'),('track.html','Track'),('other-services.html','Services'),('about.html','About'),('contact.html','Contact')],
 'id': [('international-express.html','Express'),('rates.html','Tarif'),('book.html','Booking'),('track.html','Lacak'),('other-services.html','Layanan'),('about.html','Tentang'),('contact.html','Kontak')],
}
L = {
 'en': dict(getrate='Get a rate', hours='Mon–Fri 08:30–17:30 · Sat 08:30–12:30 WIB', chat='Chat on WhatsApp', wa_txt='Hello PCW, I would like a shipping quotation.',
            f_services='Services', f_help='Help', f_contact='Contact', novat='Prices are not subject to VAT (PPN).', legal='PCW Freight is a brand of PT Prabaswara Catur Widantara.',
            home='Home', menu='Menu', skip='Skip to content'),
 'id': dict(getrate='Cek tarif', hours='Senin–Jumat 08.30–17.30 · Sabtu 08.30–12.30 WIB', chat='Chat WhatsApp', wa_txt='Halo PCW, saya ingin minta penawaran pengiriman internasional.',
            f_services='Layanan', f_help='Bantuan', f_contact='Kontak', novat='Harga tidak dikenakan PPN.', legal='PCW Freight adalah merek dari PT Prabaswara Catur Widantara.',
            home='Beranda', menu='Menu', skip='Langsung ke konten'),
}
ADDR = 'Jl. Bukit Golf Hijau Raya No. 18, Sentul City, Kab. Bogor 16810, Indonesia'
WA_SVG = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .3-3.4-.7-2.9-1.2-4.7-4.1-4.8-4.3-.1-.2-1.2-1.6-1.2-3s.7-2.1 1-2.4c.3-.3.6-.3.8-.3h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .6l-.4.6-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.7-.1l2 1c.3.1.5.2.5.3.1.2.1.7-.1 1.3z"/></svg>'

def page(lang, slug, title, desc, body, head_extra=''):
    root = '../' if lang == 'id' else ''
    other = (f'../{slug}' if lang == 'id' else f'id/{slug}')
    t = L[lang]
    nav = ''.join(f'<a href="{root}{"id/" if lang=="id" else ""}{h}"{" aria-current=page" if h==slug else ""}>{n}</a>' for h, n in NAV[lang])
    base = root + ('id/' if lang == 'id' else '')
    canon = SITE + ('id/' if lang == 'id' else '') + ('' if slug == 'index.html' else slug)
    alt_en = SITE + ('' if slug == 'index.html' else slug); alt_id = SITE + 'id/' + ('' if slug == 'index.html' else slug)
    fs = [('international-express.html','PCW International Express'),('priority-express.html','PCW Priority Express'),('economy-express.html','PCW Economy Express'),('other-services.html', 'Other services' if lang=='en' else 'Layanan lain')]
    fh = [('rates.html', 'Rates' if lang=='en' else 'Tarif'),('track.html','Track' if lang=='en' else 'Lacak kiriman'),('faq.html','FAQ'),('surcharges-customs.html','Surcharges & customs' if lang=='en' else 'Surcharge & kepabeanan'),('prohibited-items.html','Prohibited items' if lang=='en' else 'Barang terlarang'),('terms.html','Terms & Conditions' if lang=='en' else 'Syarat & Ketentuan'),('privacy.html','Privacy Policy' if lang=='en' else 'Kebijakan Privasi')]
    flinks = lambda items: ''.join(f'<a href="{base}{h}">{n}</a>' for h, n in items)
    return f'''<!DOCTYPE html>
<html lang="{lang}">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{html.escape(title)}</title>
<meta name="description" content="{html.escape(desc)}">
<link rel="canonical" href="{canon}"><link rel="alternate" hreflang="en" href="{alt_en}"><link rel="alternate" hreflang="id" href="{alt_id}">
<meta property="og:title" content="{html.escape(title)}"><meta property="og:description" content="{html.escape(desc)}"><meta property="og:type" content="website">
<link rel="icon" type="image/png" sizes="32x32" href="{root}assets/favicon-32.png"><link rel="icon" type="image/png" sizes="192x192" href="{root}assets/icon-192.png"><link rel="apple-touch-icon" href="{root}assets/apple-touch-icon.png">
<meta property="og:image" content="{SITE}assets/og-image.png"><meta name="theme-color" content="#004aad">
<link rel="stylesheet" href="{root}assets/style.css">{head_extra}
</head>
<body data-root="{root}">
<a class="skip" href="#main">{t['skip']}</a>
<div class="top"><div class="wrap"><span>{t['hours']}</span><a href="mailto:info@pcwfreight.com">info@pcwfreight.com</a><a href="{wa(t['wa_txt'])}">+62 811 9989 6752</a></div></div>
<header class="nav"><div class="wrap">
<a class="brand" href="{base}index.html"><picture><source srcset="{root}assets/logo.webp" type="image/webp"><img src="{root}assets/logo.png" alt="PCW - Prabaswara Catur Widantara" width="44" height="47"></picture><span>PCW Freight<small>International Express</small></span></a>
<button class="burger" aria-label="{t['menu']}">☰</button>
<nav class="menu">{nav}</nav>
<a class="lang" href="{other}" hreflang="{'en' if lang=='id' else 'id'}">{'EN' if lang=='id' else 'ID'}</a>
<a class="btn btn-p btn-sm hide-m" href="{base}rates.html">{t['getrate']}</a>
</div></header>
<main id="main">
{body}
</main>
<footer><div class="wrap">
<div class="grid">
<div><a class="brand foot" href="{base}index.html"><span class="logo-tile"><img src="{root}assets/logo.png" alt="PCW - Prabaswara Catur Widantara" width="40" height="43" loading="lazy"></span><span>PCW Freight</span></a><p style="margin-top:12px">{t['legal']}</p><p>{t['novat']}</p></div>
<div><h4>{t['f_services']}</h4>{flinks(fs)}</div>
<div><h4>{t['f_help']}</h4>{flinks(fh)}</div>
<div><h4>{t['f_contact']}</h4><p style="margin:5px 0">{ADDR}</p><a href="mailto:info@pcwfreight.com">info@pcwfreight.com</a><a href="{wa(t['wa_txt'])}">WhatsApp +62 811 9989 6752</a><p style="margin:5px 0">{t['hours']}</p></div>
</div>
<div class="legal"><span>© 2026 PT Prabaswara Catur Widantara</span><span><a style="display:inline" href="{base}terms.html">{'Terms' if lang=='en' else 'Syarat'}</a> · <a style="display:inline" href="{base}privacy.html">{'Privacy' if lang=='en' else 'Privasi'}</a></span></div>
</div></footer>
<a class="wa-float" href="{wa(t['wa_txt'])}" aria-label="WhatsApp">{WA_SVG}<span>{t['chat']}</span></a>
<script src="{root}assets/app.js" defer></script>
</body></html>'''

def head(lang, title, sub, crumb):
    root = '../' if lang == 'id' else ''
    base = root + ('id/' if lang == 'id' else '')
    return f'<div class="page-head"><div class="wrap"><div class="crumb"><a href="{base}index.html">{L[lang]["home"]}</a> / {crumb}</div><h1>{title}</h1><p>{sub}</p></div></div>'

# ---------- shared form pieces ----------
def rate_form(lang, quick=False):
    E = lang == 'en'
    dims = '' if quick else f'''
<div class="row" style="margin-top:14px">
<div><label for="r_pcs">{"Pieces" if E else "Jumlah koli"}</label><input id="r_pcs" name="pieces" type="number" min="1" max="50" value="1"></div>
<div><label for="r_l">{"Length (cm)" if E else "Panjang (cm)"}</label><input id="r_l" name="l" type="number" min="0" step="0.1" placeholder="{"optional" if E else "opsional"}"></div>
<div><label for="r_w">{"Width (cm)" if E else "Lebar (cm)"}</label><input id="r_w" name="w" type="number" min="0" step="0.1"></div>
<div><label for="r_h">{"Height (cm)" if E else "Tinggi (cm)"}</label><input id="r_h" name="h" type="number" min="0" step="0.1"></div>
</div><p class="hint">{"Dimensions are per piece. Chargeable weight is the higher of actual weight and L × W × H / 5000." if E else "Ukuran per koli. Berat tagih adalah yang lebih besar antara berat aktual dan P × L × T / 5000."}</p>'''
    return f'''<form class="box" data-rate{" data-quick" if quick else ""}>
<div class="row">
<div><label for="r_c" class="req">{"Destination country" if E else "Negara tujuan"}</label><select id="r_c" name="country" required><option value="">{"Loading…" if E else "Memuat…"}</option></select></div>
<div><label class="req">{"Shipment type" if E else "Jenis kiriman"}</label><div class="seg"><label><input type="radio" name="type" value="Parcel" checked><span>{"Parcel" if E else "Paket"}</span></label><label><input type="radio" name="type" value="Document"><span>{"Document" if E else "Dokumen"}</span></label></div></div>
<div><label for="r_kg" class="req">{"Total actual weight (kg)" if E else "Total berat aktual (kg)"}</label><input id="r_kg" name="kg" type="number" min="0.1" step="0.1" required></div>
<div style="display:flex;align-items:flex-end"><button class="btn btn-a" type="submit" style="width:100%">{"Get rate" if E else "Cek tarif"}</button></div>
</div>{dims}
</form>'''

def track_form(lang, quick=False):
    E = lang == 'en'
    return f'''<form class="box" data-track{" data-quick" if quick else ""} style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end">
<div style="flex:1;min-width:220px"><label for="t_ref">{"PCW reference number" if E else "Nomor referensi PCW"}</label><input id="t_ref" name="ref" placeholder="PCW-PX-2611-0001" autocomplete="off"></div>
<button class="btn btn-p" type="submit">{"Track" if E else "Lacak"}</button></form>'''

# ---------- page bodies ----------
def home(lang):
    E = lang == 'en'; b = '../id/' if False else ''
    return f'''
<section class="hero"><div class="wrap">
<h1>{"International express from Indonesia, door to door." if E else "Pengiriman ekspres internasional dari Indonesia, door to door."}</h1>
<p class="lead">{"Documents and parcels to 23 destination countries in our published table, with two speeds. You see the full price before you book, and a real person answers on WhatsApp." if E else "Dokumen dan paket ke 23 negara tujuan dalam tabel publikasi kami, dengan dua pilihan kecepatan. Total harga terlihat sebelum Anda booking, dan tim kami membalas langsung di WhatsApp."}</p>
<div class="hubtabs" data-hub>
<div class="hubbar" role="tablist">
<button type="button" role="tab" class="on" data-tab="rate">{"Get rate" if E else "Cek tarif"}</button>
<button type="button" role="tab" data-tab="track">{"Track" if E else "Lacak"}</button>
<button type="button" role="tab" data-tab="book">{"Book" if E else "Booking"}</button>
</div>
<div class="hubpane" data-pane="rate">{rate_form(lang, quick=True)}</div>
<div class="hubpane hidden" data-pane="track">{track_form(lang, quick=True)}</div>
<div class="hubpane hidden" data-pane="book"><div class="box"><p style="margin:0 0 12px">{"Send your shipment details in one short form. You get a PCW reference number at once, and our team confirms price and pickup." if E else "Kirim detail kiriman lewat satu formulir singkat. Anda langsung mendapat nomor referensi PCW, dan tim kami mengonfirmasi harga serta pickup."}</p><a class="btn btn-a" href="book.html">{"Start booking" if E else "Mulai booking"}</a></div></div>
<div class="who"><span>{"I am a:" if E else "Saya:"}</span><a class="on" href="book.html">{"Guest / one-off shipper" if E else "Pengirim sekali-kali"}</a><a href="{wa(L[lang]['wa_txt'])}">{"Business shipper: ask for business rates" if E else "Pengirim bisnis: minta tarif bisnis"}</a></div>
</div>
</div></section>

<section class="s"><div class="wrap">
<h2>{"What are you looking for today?" if E else "Apa yang Anda cari hari ini?"}</h2>
<div class="grid g4 tiles">
<a class="card tile" href="international-express.html"><h3>{"Shipping services" if E else "Layanan pengiriman"}</h3><p>{"Compare Priority and Economy Express." if E else "Bandingkan Priority dan Economy Express."}</p></a>
<a class="card tile" href="surcharges-customs.html"><h3>{"Surcharges & customs" if E else "Surcharge & kepabeanan"}</h3><p>{"Chargeable weight, fuel, duties and DDP/DDU explained." if E else "Berat tagih, fuel, bea masuk, dan DDP/DDU dijelaskan."}</p></a>
<a class="card tile" href="prohibited-items.html"><h3>{"Prohibited items" if E else "Barang terlarang"}</h3><p>{"Check what we cannot accept before you pack." if E else "Cek barang yang tidak dapat kami terima sebelum mengemas."}</p></a>
<a class="card tile" href="faq.html"><h3>{"Duties, payment & FAQ" if E else "Bea masuk, pembayaran & FAQ"}</h3><p>{"Answers on duties, payment, pickup and claims." if E else "Jawaban soal bea masuk, pembayaran, pickup, dan klaim."}</p></a>
</div></div></section>

<section class="s"><div class="wrap">
<h2>{"Two services. One clear price." if E else "Dua layanan. Satu harga yang jelas."}</h2>
<p class="sub">{"Choose speed or budget. Both are door to door, from pickup in Indonesia to the receiver's address." if E else "Pilih cepat atau hemat. Keduanya door to door, dari pickup di Indonesia sampai alamat penerima."}</p>
<div class="grid g2">
<div class="card prod"><span class="tag">{"Fastest" if E else "Tercepat"}</span><h3>PCW Priority Express</h3>
<ul class="ticks"><li>{"For documents, samples and urgent goods" if E else "Untuk dokumen, sampel, dan barang mendesak"}</li><li>{"Pickup anywhere in Indonesia" if E else "Pickup di seluruh Indonesia"}</li><li>{"Price = base rate + fuel surcharge" if E else "Harga = tarif dasar + fuel surcharge"}</li></ul>
<a class="btn btn-o" href="priority-express.html">{"See details" if E else "Lihat detail"}</a></div>
<div class="card prod eco"><span class="tag eco">{"Best value" if E else "Paling hemat"}</span><h3>PCW Economy Express</h3>
<ul class="ticks"><li>{"For parcels that are not urgent" if E else "Untuk paket yang tidak mendesak"}</li><li>{"All-in price, fuel included" if E else "Harga all-in, sudah termasuk fuel"}</li><li>{"Pickup in Jakarta; other cities by request" if E else "Pickup di Jakarta; kota lain melalui permintaan"}</li></ul>
<a class="btn btn-o" href="economy-express.html">{"See details" if E else "Lihat detail"}</a></div>
</div></div></section>

<section class="s alt"><div class="wrap">
<h2>{"How it works" if E else "Cara kerjanya"}</h2>
<div class="grid g4 steps">
<div class="card"><h3>{"Get a rate" if E else "Cek tarif"}</h3><p>{"Enter destination and weight. See both services side by side." if E else "Isi tujuan dan berat. Lihat kedua layanan berdampingan."}</p></div>
<div class="card"><h3>{"Book online" if E else "Booking online"}</h3><p>{"Send shipment details. You get a PCW reference number at once." if E else "Kirim detail kiriman. Anda langsung mendapat nomor referensi PCW."}</p></div>
<div class="card"><h3>{"We confirm" if E else "Kami konfirmasi"}</h3><p>{"Our team checks weight, price and documents, then arranges pickup or drop-off." if E else "Tim kami memeriksa berat, harga, dan dokumen, lalu mengatur pickup atau drop-off."}</p></div>
<div class="card"><h3>{"Track" if E else "Lacak"}</h3><p>{"Follow every status update with your PCW reference, or ask us on WhatsApp." if E else "Ikuti setiap update status dengan nomor referensi PCW, atau tanya kami di WhatsApp."}</p></div>
</div></div></section>

<section class="s"><div class="wrap">
<h2>{"Why shippers choose PCW Freight" if E else "Mengapa pengirim memilih PCW Freight"}</h2>
<div class="grid g4">
<div class="card"><h3>{"A real person" if E else "Dilayani langsung"}</h3><p>{"WhatsApp answered by our team during working hours." if E else "WhatsApp dijawab langsung oleh tim kami pada jam kerja."}</p></div>
<div class="card"><h3>{"Full price first" if E else "Total harga di awal"}</h3><p>{"Chargeable weight and every charge shown before you agree." if E else "Berat tagih dan seluruh biaya ditunjukkan sebelum Anda setuju."}</p></div>
<div class="card"><h3>{"Document help" if E else "Bantuan dokumen"}</h3><p>{"Commercial invoice and packing list prepared with you." if E else "Commercial invoice dan packing list kami bantu siapkan."}</p></div>
<div class="card"><h3>{"Business rates" if E else "Tarif bisnis"}</h3><p>{"Regular shippers get their own discounted rates." if E else "Pengirim rutin mendapat tarif khusus."}</p></div>
</div></div></section>

<section class="band"><div class="wrap"><h2>{"Ready to ship?" if E else "Siap mengirim?"}</h2>
<div style="display:flex;gap:10px;flex-wrap:wrap"><a class="btn btn-a" href="book.html">{"Book now" if E else "Booking sekarang"}</a><a class="btn btn-wa" href="{wa(L[lang]['wa_txt'])}">{L[lang]['chat']}</a></div></div></section>'''

def express(lang):
    E = lang == 'en'
    rows = [("Best for","Cocok untuk","Documents, samples, urgent goods","Dokumen, sampel, barang mendesak","Non-urgent parcels","Paket tidak mendesak"),
            ("Price","Harga","Base rate + fuel surcharge (51%)","Tarif dasar + fuel surcharge (51%)","All-in (fuel included)","All-in (sudah termasuk fuel)"),
            ("Pickup","Pickup","Anywhere in Indonesia","Seluruh Indonesia","Jakarta online; other cities by request","Jakarta online; kota lain melalui permintaan"),
            ("Weight rounding","Pembulatan berat","Up to the next 0.5 kg","Ke 0,5 kg berikutnya","Up to the next 1 kg","Ke 1 kg berikutnya"),
            ("Documents rate","Tarif dokumen","Yes, up to 2 kg","Ya, sampai 2 kg","Parcel rate","Tarif paket"),
            ("Transit time","Waktu transit","Given in your quote","Disampaikan di penawaran","Given in your quote","Disampaikan di penawaran")]
    tr = ''.join(f'<tr><td><strong>{r[0] if E else r[1]}</strong></td><td>{r[2] if E else r[3]}</td><td>{r[4] if E else r[5]}</td></tr>' for r in rows)
    return head(lang, 'PCW International Express', "Door-to-door international express from Indonesia, in two speeds." if E else "Pengiriman ekspres internasional door to door dari Indonesia, dalam dua pilihan kecepatan.", 'Express') + f'''
<section class="s"><div class="wrap"><div class="box" style="overflow-x:auto"><table class="rates"><thead><tr><th></th><th>PCW Priority Express</th><th>PCW Economy Express</th></tr></thead><tbody>{tr}</tbody></table></div>
<p class="hint">{"Chargeable weight is the higher of actual weight and L × W × H (cm) / 5000. Destination duties and taxes are paid by the receiver unless agreed otherwise." if E else "Berat tagih adalah yang lebih besar antara berat aktual dan P × L × T (cm) / 5000. Bea masuk dan pajak di negara tujuan dibayar penerima kecuali disepakati lain."}</p>
<p style="display:flex;gap:10px;flex-wrap:wrap"><a class="btn btn-a" href="rates.html">{L[lang]['getrate']}</a><a class="btn btn-o" href="priority-express.html">PCW Priority Express</a><a class="btn btn-o" href="economy-express.html">PCW Economy Express</a></p></div></section>'''

def product(lang, which):
    E = lang == 'en'
    if which == 'p':
        t = 'PCW Priority Express'; sub = "Our fastest international service for documents, samples and urgent goods." if E else "Layanan internasional tercepat kami untuk dokumen, sampel, dan barang mendesak."
        pts = [("Pickup anywhere in Indonesia","Pickup di seluruh Indonesia"),("Separate, lower rates for documents up to 2 kg","Tarif dokumen tersendiri yang lebih rendah sampai 2 kg"),("Price shown as base rate + fuel surcharge (51% this month)","Harga ditampilkan sebagai tarif dasar + fuel surcharge (51% bulan ini)"),("Weight rounded up to the next 0.5 kg","Berat dibulatkan ke 0,5 kg berikutnya"),("Transit time confirmed in your quote","Waktu transit dikonfirmasi di penawaran"),("Business accounts get their own rates","Akun bisnis mendapat tarif sendiri")]
    else:
        t = 'PCW Economy Express'; sub = "Lower-cost international delivery for parcels that are not urgent." if E else "Pengiriman internasional lebih hemat untuk paket yang tidak mendesak."
        pts = [("All-in price: fuel already included","Harga all-in: fuel sudah termasuk"),("Online pickup inside Jakarta","Pickup online di dalam Jakarta"),("Outside Jakarta: request pickup by WhatsApp or email; cost confirmed separately","Di luar Jakarta: minta pickup lewat WhatsApp atau email; biaya dikonfirmasi terpisah"),("Weight rounded up to the next 1 kg","Berat dibulatkan ke 1 kg berikutnya"),("Transit time confirmed in your quote","Waktu transit dikonfirmasi di penawaran"),("Lower liability limit than Priority: see Terms","Batas tanggung jawab lebih rendah dari Priority: lihat Syarat & Ketentuan")]
    li = ''.join(f'<li>{a if E else b}</li>' for a, b in pts)
    return head(lang, t, sub, t) + f'''
<section class="s"><div class="wrap grid g2">
<div><h2>{"What you get" if E else "Yang Anda dapatkan"}</h2><ul class="ticks">{li}</ul>
<p style="display:flex;gap:10px;flex-wrap:wrap"><a class="btn btn-a" href="rates.html">{L[lang]['getrate']}</a><a class="btn btn-p" href="book.html?product={'Priority' if which=='p' else 'Economy'}">{"Book" if E else "Booking"}</a></p></div>
<div class="card"><h3>{"Good to know" if E else "Perlu diketahui"}</h3>
<p>{"Prices on this website are published rates. Regular shippers receive their own business rates." if E else "Harga di website ini adalah published rate. Pengirim rutin mendapat tarif bisnis sendiri."}</p>
<p>{"Situational surcharges (for example remote areas or special goods) are told to you before you agree. Destination duties and taxes are paid by the receiver unless agreed otherwise." if E else "Biaya situasional (misalnya area terpencil atau barang khusus) kami informasikan sebelum Anda setuju. Bea masuk dan pajak di negara tujuan dibayar penerima kecuali disepakati lain."}</p>
<a class="btn btn-wa btn-sm" href="{wa(L[lang]['wa_txt'])}">{L[lang]['chat']}</a></div>
</div></section>'''

def rates(lang):
    E = lang == 'en'
    return head(lang, "Shipping rates" if E else "Tarif pengiriman", "Published rates for PCW Priority Express and PCW Economy Express. Business accounts get lower rates." if E else "Published rate untuk PCW Priority Express dan PCW Economy Express. Akun bisnis mendapat tarif lebih rendah.", "Rates" if E else "Tarif") + f'''
<section class="s"><div class="wrap">{rate_form(lang)}<div data-out style="margin-top:20px"></div>
<div class="notice info" style="margin-top:20px">{"Estimate only: the final price follows weighing and measuring. Economy pickup outside Jakarta is arranged by request. Situational surcharges are told to you before booking. Destination duties and taxes are not included. No VAT (PPN) is charged." if E else "Estimasi: harga final mengikuti hasil timbang dan ukur. Pickup Economy di luar Jakarta diatur melalui permintaan. Biaya situasional diinformasikan sebelum booking. Bea masuk dan pajak di negara tujuan tidak termasuk. Tidak dikenakan PPN."}</div>
</div></section>'''

def book(lang):
    E = lang == 'en'
    def f(id_, name, label, typ='text', req=True, extra=''):
        return f'<div><label for="{id_}"{" class=req" if req else ""}>{label}</label><input id="{id_}" name="{name}" type="{typ}"{" required" if req else ""} {extra}></div>'
    return head(lang, "Book a shipment" if E else "Booking pengiriman", "Send your shipment details. You receive a PCW reference at once; our team confirms weight, price and pickup before shipping." if E else "Kirim detail kiriman Anda. Nomor referensi PCW langsung terbit; tim kami mengonfirmasi berat, harga, dan pickup sebelum pengiriman.", "Book" if E else "Booking") + f'''
<section class="s"><div class="wrap" style="max-width:900px">
<form class="box" data-book novalidate>
<input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
<fieldset><legend>1. {"Shipment" if E else "Kiriman"}</legend>
<div class="row r2">
<div><label for="b_prod" class="req">{"Service" if E else "Layanan"}</label><select id="b_prod" name="product" required><option value="Priority">PCW Priority Express</option><option value="Economy">PCW Economy Express</option></select></div>
<div><label for="b_c" class="req">{"Destination country" if E else "Negara tujuan"}</label><select id="b_c" name="dest_country" required><option value="">…</option></select></div>
</div>
<div class="row" style="margin-top:14px">
<div><label class="req">{"Type" if E else "Jenis"}</label><div class="seg"><label><input type="radio" name="shipment_type" value="Parcel" checked><span>{"Parcel" if E else "Paket"}</span></label><label><input type="radio" name="shipment_type" value="Document"><span>{"Document" if E else "Dokumen"}</span></label></div></div>
{f("b_pcs","pieces","Pieces" if E else "Jumlah koli","number",True,'min="1" max="50" value="1"')}
{f("b_kg","actual_kg","Total weight (kg)" if E else "Total berat (kg)","number",True,'min="0.1" step="0.1"')}
{f("b_val","declared_value","Declared value (IDR)" if E else "Nilai barang (IDR)","text",False,'inputmode="numeric"')}
</div>
<div class="row r3" style="margin-top:14px">
{f("b_l","l","Length per piece (cm)" if E else "Panjang per koli (cm)","number",False,'min="0" step="0.1"')}
{f("b_w","w","Width (cm)" if E else "Lebar (cm)","number",False,'min="0" step="0.1"')}
{f("b_h","h","Height (cm)" if E else "Tinggi (cm)","number",False,'min="0" step="0.1"')}
</div>
<div style="margin-top:14px"><label for="b_cont" class="req">{"Contents description" if E else "Deskripsi isi kiriman"}</label><textarea id="b_cont" name="contents" required placeholder="{"e.g. cotton T-shirts, 20 pcs" if E else "contoh: kaos katun, 20 pcs"}"></textarea></div>
</fieldset>

<fieldset><legend>2. {"Shipper (you)" if E else "Pengirim (Anda)"}</legend>
<div class="row r2">{f("b_sn","shipper_name","Your full name" if E else "Nama lengkap Anda")}{f("b_sc","shipper_company","Company" if E else "Perusahaan","text",False)}</div>
<div class="row r2" style="margin-top:14px">{f("b_se","shipper_email","Email","email")}{f("b_sw","shipper_whatsapp","WhatsApp number" if E else "Nomor WhatsApp","tel",True,'placeholder="0811…"')}</div>
<div style="margin-top:14px"><label class="req">{"Pickup or drop-off" if E else "Pickup atau drop-off"}</label><div class="seg"><label><input type="radio" name="pickup_or_dropoff" value="Pickup" checked><span>Pickup</span></label><label><input type="radio" name="pickup_or_dropoff" value="Drop-off"><span>Drop-off</span></label></div></div>
<div data-pickup style="margin-top:14px">
<div><label for="b_pa" class="req">{"Pickup address" if E else "Alamat pickup"}</label><textarea id="b_pa" name="pickup_address" required></textarea></div>
<div class="row r3" style="margin-top:14px">{f("b_pc","pickup_city","City" if E else "Kota")}{f("b_pp","pickup_postcode","Postcode" if E else "Kode pos","text",False)}{f("b_pd","pickup_date","Preferred date" if E else "Tanggal diinginkan","date",False)}</div>
</div>
<div data-eco-warn class="notice warn hidden">{"Economy pickup outside Jakarta is arranged by request." if E else "Pickup Economy di luar Jakarta diatur melalui permintaan."}
<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:10px"><a class="btn btn-wa btn-sm" href="{wa("Hello PCW, I would like to request an Economy pickup outside Jakarta." if E else "Halo PCW, saya ingin meminta pickup Economy di luar Jakarta.")}">WhatsApp</a><a class="btn btn-o btn-sm" href="mailto:info@pcwfreight.com?subject={"Economy pickup request" if E else "Permintaan pickup Economy"}">Email</a></div>
<div class="hint">{"Or choose Drop-off, or PCW Priority Express (pickup anywhere)." if E else "Atau pilih Drop-off, atau PCW Priority Express (pickup di mana saja)."}</div></div>
</fieldset>

<fieldset><legend>3. {"Receiver" if E else "Penerima"}</legend>
<div class="row r2">{f("b_cn","consignee_name","Receiver name" if E else "Nama penerima")}{f("b_cc","consignee_company","Company" if E else "Perusahaan","text",False)}</div>
<div style="margin-top:14px"><label for="b_ca" class="req">{"Receiver address" if E else "Alamat penerima"}</label><textarea id="b_ca" name="consignee_address" required></textarea></div>
<div class="row" style="margin-top:14px">{f("b_cy","consignee_city","Receiver city" if E else "Kota penerima")}{f("b_cp","consignee_postcode","Postcode" if E else "Kode pos","text",False)}{f("b_ct","consignee_phone","Receiver phone" if E else "Telepon penerima","tel")}{f("b_ce","consignee_email","Email","email",False)}</div>
</fieldset>

<fieldset><legend>4. {"Confirm" if E else "Konfirmasi"}</legend>
<label class="check"><input type="checkbox" name="no_prohibited"><span>{'My shipment contains no <a href="prohibited-items.html" target="_blank">prohibited or restricted items</a>, and the description and value are true.' if E else 'Kiriman saya tidak berisi <a href="prohibited-items.html" target="_blank">barang terlarang atau dibatasi</a>, dan deskripsi serta nilainya benar.'}</span></label>
<label class="check"><input type="checkbox" name="terms_accepted"><span>{'I accept the <a href="terms.html" target="_blank">Terms &amp; Conditions</a>.' if E else 'Saya menyetujui <a href="terms.html" target="_blank">Syarat &amp; Ketentuan</a>.'}</span></label>
<label class="check"><input type="checkbox" name="privacy_consent"><span>{'I agree that PCW uses my data and the receiver’s data to handle this shipment, as described in the <a href="privacy.html" target="_blank">Privacy Policy</a>.' if E else 'Saya setuju PCW menggunakan data saya dan data penerima untuk menangani kiriman ini, sesuai <a href="privacy.html" target="_blank">Kebijakan Privasi</a>.'}</span></label>
</fieldset>
<button class="btn btn-a" type="submit" style="width:100%;padding:15px">{"Send booking request" if E else "Kirim permintaan booking"}</button>
<p class="hint" style="text-align:center">{"The price is recalculated from our published rates; our team confirms the final price before shipping." if E else "Harga dihitung ulang dari published rate kami; tim kami mengonfirmasi harga final sebelum pengiriman."}</p>
</form>
<div data-out style="margin-top:20px"></div>
</div></section>'''

def track(lang):
    E = lang == 'en'
    return head(lang, "Track a shipment" if E else "Lacak kiriman", "Enter the PCW reference number from your booking confirmation." if E else "Masukkan nomor referensi PCW dari konfirmasi booking Anda.", "Track" if E else "Lacak") + f'''
<section class="s"><div class="wrap" style="max-width:820px">{track_form(lang)}<div data-out style="margin-top:20px"></div></div></section>'''

def other(lang):
    E = lang == 'en'
    items = [("Air Freight","Air Freight","Larger shipments by air cargo.","Kiriman lebih besar melalui kargo udara."),("Sea Freight","Sea Freight","FCL and LCL shipments by sea.","Kiriman FCL dan LCL melalui laut."),("Land Freight","Land Freight","Road transport within Indonesia and cross-border.","Angkutan darat di Indonesia dan lintas negara."),("Warehouse","Gudang","Storage and inventory handling.","Penyimpanan dan pengelolaan stok.")]
    cards = ''.join(f'<div class="card"><h3>{a if E else b}</h3><p>{c if E else d}</p><a class="btn btn-wa btn-sm" href="{wa(("Hello PCW, I would like a quote for " if E else "Halo PCW, saya ingin penawaran untuk ") + a)}">{"Request a quote" if E else "Minta penawaran"}</a></div>' for a, b, c, d in items)
    return head(lang, "Other services" if E else "Layanan lain", "Beyond international express, PCW Freight handles freight forwarding by request." if E else "Selain ekspres internasional, PCW Freight menangani freight forwarding melalui permintaan.", "Services" if E else "Layanan") + f'<section class="s"><div class="wrap"><div class="grid g4">{cards}</div></div></section>'

def about(lang):
    E = lang == 'en'
    logos = ''.join(f'<span>{n}</span>' for n in ['J&amp;T','SPX','Samsung','Hypermart','SMS','Hiswara','Daesang','Supratama'])
    return head(lang, "About PCW Freight" if E else "Tentang PCW Freight", "PCW Freight is the brand of PT Prabaswara Catur Widantara, an Indonesian freight forwarder based in Sentul City, Bogor." if E else "PCW Freight adalah merek PT Prabaswara Catur Widantara, perusahaan freight forwarding Indonesia yang berbasis di Sentul City, Bogor.", "About" if E else "Tentang") + f'''
<section class="s"><div class="wrap prose">
<p>{"We provide freight forwarding for domestic and international markets, and handle many commodity types, from industrial equipment to high-value goods. PCW International Express is our door-to-door express service for documents and parcels leaving Indonesia." if E else "Kami melayani freight forwarding untuk pasar domestik dan internasional, dan menangani berbagai jenis komoditas, dari peralatan industri hingga barang bernilai tinggi. PCW International Express adalah layanan ekspres door to door kami untuk dokumen dan paket dari Indonesia."}</p>
<p>{"Our team has long experience in express and freight operations. Every shipment is handled by people you can reach on WhatsApp." if E else "Tim kami berpengalaman panjang di operasional ekspres dan freight. Setiap kiriman ditangani orang yang bisa Anda hubungi di WhatsApp."}</p>
<!-- OWNER REVIEW: counters (no values on current site) and testimonials (names to be confirmed as real customers) are NOT published until confirmed. -->
<h2>{"Companies that have worked with us" if E else "Perusahaan yang pernah bekerja sama dengan kami"}</h2>
<div class="logos">{logos}</div>
</div></section>'''

def contact(lang):
    E = lang == 'en'
    return head(lang, "Contact" if E else "Kontak", "Talk to our team about a shipment, a quote or a business rate." if E else "Hubungi tim kami untuk kiriman, penawaran, atau tarif bisnis.", "Contact" if E else "Kontak") + f'''
<section class="s"><div class="wrap grid g3">
<div class="card"><h3>WhatsApp</h3><p>+62 811 9989 6752</p><a class="btn btn-wa btn-sm" href="{wa(L[lang]['wa_txt'])}">{L[lang]['chat']}</a></div>
<div class="card"><h3>Email</h3><p>info@pcwfreight.com</p><a class="btn btn-o btn-sm" href="mailto:info@pcwfreight.com">{"Send email" if E else "Kirim email"}</a></div>
<div class="card"><h3>{"Office" if E else "Kantor"}</h3><p>{ADDR}</p><p class="hint">{L[lang]['hours']}</p><a class="btn btn-o btn-sm" href="https://www.google.com/maps/search/?api=1&amp;query=Jl.+Bukit+Golf+Hijau+Raya+No.18+Sentul+City+Bogor">{"Open map" if E else "Buka peta"}</a></div>
</div></section>'''

FAQ = [
 ("How is the price calculated?","Bagaimana harga dihitung?","We charge on chargeable weight: the higher of the actual weight and the volumetric weight (L × W × H in cm / 5000). Priority Express is shown as base rate plus fuel surcharge; Economy Express is all-in.","Kami menagih berdasarkan berat tagih: yang lebih besar antara berat aktual dan berat volumetrik (P × L × T dalam cm / 5000). Priority Express ditampilkan sebagai tarif dasar plus fuel surcharge; Economy Express all-in."),
 ("Is the website price final?","Apakah harga di website sudah final?","It is our published rate and an estimate. The final price follows weighing and measuring. Situational surcharges are told to you before you agree. Business accounts receive their own lower rates.","Itu adalah published rate kami dan berupa estimasi. Harga final mengikuti hasil timbang dan ukur. Biaya situasional diinformasikan sebelum Anda setuju. Akun bisnis mendapat tarif sendiri yang lebih rendah."),
 ("Who pays duties and taxes abroad?","Siapa yang membayar bea masuk dan pajak di negara tujuan?","The receiver, unless we agree otherwise in writing.","Penerima, kecuali disepakati lain secara tertulis."),
 ("How long does delivery take?","Berapa lama pengirimannya?","Transit time depends on destination and service. We state it in your quote.","Waktu transit tergantung tujuan dan layanan. Kami cantumkan di penawaran."),
 ("How do I pay?","Bagaimana cara membayar?","New customers pay in full by bank transfer before pickup. Payment details are sent with the booking confirmation. Prices are not subject to VAT (PPN).","Pelanggan baru membayar penuh melalui transfer bank sebelum pickup. Detail pembayaran dikirim bersama konfirmasi booking. Harga tidak dikenakan PPN."),
 ("Can you pick up outside Jakarta?","Apakah bisa pickup di luar Jakarta?","Priority Express: yes, anywhere in Indonesia. Economy Express: by request through WhatsApp or email; the pickup cost is confirmed separately.","Priority Express: ya, di seluruh Indonesia. Economy Express: melalui permintaan lewat WhatsApp atau email; biaya pickup dikonfirmasi terpisah."),
 ("What documents do I need?","Dokumen apa yang dibutuhkan?","For goods: a commercial invoice and packing list. We help you prepare them.","Untuk barang: commercial invoice dan packing list. Kami bantu menyiapkannya."),
 ("What if my shipment is damaged or lost?","Bagaimana jika kiriman rusak atau hilang?","Report it within the time limits in our Terms & Conditions, with photos and, for Economy, an unboxing video. Liability limits differ by service.","Laporkan dalam batas waktu di Syarat & Ketentuan kami, dengan foto dan, untuk Economy, video unboxing. Batas tanggung jawab berbeda per layanan."),
]
def faq(lang):
    E = lang == 'en'
    items = ''.join(f'<details class="faq"><summary>{q if E else qi}</summary><p>{a if E else ai}</p></details>' for q, qi, a, ai in FAQ)
    return head(lang, "Frequently asked questions" if E else "Pertanyaan yang sering diajukan", "", "FAQ") + f'<section class="s"><div class="wrap prose">{items}</div></section>'

def surcharges(lang):
    E = lang == 'en'
    t = lambda en, idn: en if E else idn
    def tbl(rows):
        return '<div style="overflow-x:auto"><table class="rates"><thead><tr><th>%s</th><th>%s</th><th>%s</th></tr></thead><tbody>%s</tbody></table></div>' % (t("Charge","Biaya"), t("When it applies","Kapan berlaku"), t("Indicative price (IDR)","Perkiraan harga (IDR)"), ''.join('<tr><td><b>%s</b></td><td>%s</td><td>%s</td></tr>' % r for r in rows))
    per_piece = t("per piece","per koli"); per_ship = t("per shipment","per pengiriman"); per_kg = t("per kg","per kg")
    prio = [
     (t("Fuel surcharge","Fuel surcharge"), t("Added to the base rate; updated every month. Currently 51%.","Ditambahkan ke tarif dasar; diperbarui setiap bulan. Saat ini 51%."), t("Included in your quote","Tercantum di penawaran")),
     (t("Remote area","Remote area"), t("Pickup or delivery in a remote area.","Pickup atau pengiriman ke area terpencil."), t("12,000 per kg, minimum 488,000 per shipment","12.000 per kg, minimum 488.000 per pengiriman")),
     (t("Oversize piece","Koli oversize"), t("Longest side over 100 cm.","Sisi terpanjang lebih dari 100 cm."), t("From 625,000 per piece","Mulai 625.000 per koli")),
     (t("Additional handling","Additional handling"), t("Piece of 24-69 kg actual weight, or not fully enclosed in an outer carton.","Koli berat aktual 24-69 kg, atau tidak sepenuhnya tertutup karton luar."), t("From 625,000 per piece","Mulai 625.000 per koli")),
     (t("Overweight piece","Koli overweight"), t("Piece over 70 kg.","Koli di atas 70 kg."), t("From 2,500,000 per piece","Mulai 2.500.000 per koli")),
     (t("Address correction","Koreksi alamat"), t("Address is incomplete or wrong and must be corrected.","Alamat tidak lengkap atau salah sehingga harus dikoreksi."), t("From 438,000 per shipment","Mulai 438.000 per pengiriman")),
     (t("Dangerous goods","Dangerous goods"), t("Only with our written approval.","Hanya dengan persetujuan tertulis kami."), t("From 2,375,000 per shipment","Mulai 2.375.000 per pengiriman")),
     (t("Paying duties & taxes for you (DDP)","Membayarkan bea masuk & pajak (DDP)"), t("Only if agreed in writing.","Hanya jika disepakati tertulis."), t("2.5% of duties & taxes, minimum 500,000","2,5% dari bea masuk & pajak, minimum 500.000")),
     (t("Peak / demand surcharge","Surcharge peak / demand"), t("Applies in certain high-demand periods.","Berlaku pada periode permintaan tinggi tertentu."), t("Told to you before booking","Diinformasikan sebelum booking")),
    ]
    eco = [
     (t("Fuel surcharge","Fuel surcharge"), t("Already included in the Economy price (all-in).","Sudah termasuk dalam harga Economy (all-in)."), t("Included","Sudah termasuk")),
     (t("Remote area","Remote area"), t("Delivery to a remote area.","Pengiriman ke area terpencil."), t("32,000 per kg, minimum 1,482,000 per shipment","32.000 per kg, minimum 1.482.000 per pengiriman")),
     (t("Oversize piece","Koli oversize"), t("Length over 120 cm, or width or height over 80 cm.","Panjang lebih dari 120 cm, atau lebar atau tinggi lebih dari 80 cm."), t("From 3,932,000 per piece","Mulai 3.932.000 per koli")),
     (t("Additional handling","Additional handling"), t("Non-standard packing.","Kemasan tidak standar."), t("From 1,157,000 per piece","Mulai 1.157.000 per koli")),
     (t("Address correction","Koreksi alamat"), t("Address is incomplete or wrong and must be corrected.","Alamat tidak lengkap atau salah sehingga harus dikoreksi."), t("From 557,000 per shipment","Mulai 557.000 per pengiriman")),
     (t("Lithium battery","Baterai lithium"), t("Only with our written approval.","Hanya dengan persetujuan tertulis kami."), t("From 500,000 per shipment","Mulai 500.000 per pengiriman")),
     (t("Dangerous goods","Dangerous goods"), t("Only with our written approval.","Hanya dengan persetujuan tertulis kami."), t("From 4,350,000 per shipment","Mulai 4.350.000 per pengiriman")),
     (t("Paying duties & taxes for you (DDP)","Membayarkan bea masuk & pajak (DDP)"), t("Only if agreed in writing.","Hanya jika disepakati tertulis."), t("7% of duties & taxes, minimum 500,000","7% dari bea masuk & pajak, minimum 500.000")),
    ]
    tr = ('<h3>PCW Priority Express</h3>' + tbl(prio) + '<h3 style="margin-top:22px">PCW Economy Express</h3>' + tbl(eco))
    return head(lang, t("Surcharges & customs","Surcharge & kepabeanan"), t("What can change the price, and who pays what. We tell you before you agree.","Apa saja yang dapat mengubah harga, dan siapa yang membayar. Kami informasikan sebelum Anda setuju."), t("Surcharges & customs","Surcharge & kepabeanan")) + f'''
<section class="s"><div class="wrap prose">
<h2>{t("1. Chargeable weight","1. Berat tagih (chargeable weight)")}</h2>
<p>{t("We charge on the higher of the actual weight and the volumetric weight. Volumetric weight = length × width × height (cm) ÷ 5000.","Kami menagih berdasarkan yang lebih besar antara berat aktual dan berat volumetrik. Berat volumetrik = panjang × lebar × tinggi (cm) ÷ 5000.")}</p>
<p><b>{t("Example:","Contoh:")}</b> {t("a box of 40 × 30 × 30 cm weighing 5 kg. Volumetric weight = 36,000 ÷ 5000 = 7.2 kg. You are charged for 7.2 kg, not 5 kg.","kotak 40 × 30 × 30 cm dengan berat 5 kg. Berat volumetrik = 36.000 ÷ 5000 = 7,2 kg. Anda ditagih untuk 7,2 kg, bukan 5 kg.")}</p>
<h2>{t("2. Charges that can apply","2. Biaya yang dapat berlaku")}</h2>
{tr}
<p class="hint">{t("Prices are indicative and in IDR; the exact amount depends on destination and is confirmed in your quote. If a charge is only found after shipment (for example a wrong address or a remote area), it is billed to the sender and is due within 7 days of the invoice. Duties and taxes at the destination are separate: the receiver pays them unless agreed otherwise in writing.","Harga bersifat perkiraan dalam IDR; jumlah pastinya tergantung tujuan dan dikonfirmasi di penawaran. Jika suatu biaya baru diketahui setelah pengiriman (misalnya alamat salah atau area terpencil), biaya ditagihkan kepada Pengirim dan jatuh tempo paling lambat 7 hari setelah tagihan diterbitkan. Bea masuk dan pajak di negara tujuan terpisah: Penerima yang membayar kecuali disepakati lain secara tertulis.")}</p>
<h2>{t("3. Duties & taxes at the destination","3. Bea masuk & pajak di negara tujuan")}</h2>
<p>{t("Import duties and taxes are set by the destination country. By default the receiver pays them. If the receiver refuses to pay, the duties, taxes and the cost of returning or destroying the goods are billed to the sender.","Bea masuk dan pajak ditetapkan oleh negara tujuan. Secara standar Penerima yang membayar. Jika Penerima menolak membayar, bea masuk, pajak, serta biaya pengembalian atau pemusnahan barang ditagihkan kepada Pengirim.")}</p>
<div class="notice info"><b>DDU</b> (Delivered Duty Unpaid) = {t("the receiver pays duties and taxes. This is our default.","Penerima membayar bea masuk dan pajak. Ini ketentuan standar kami.")}<br><b>DDP</b> (Delivered Duty Paid) = {t("the sender pays them in advance. Only available if we agree in writing first. Ask us on WhatsApp.","Pengirim membayar di muka. Hanya tersedia jika kita sepakati tertulis terlebih dahulu. Tanyakan lewat WhatsApp.")}</div>
<h2>{t("4. Documents and customs","4. Dokumen dan kepabeanan")}</h2>
<ul class="ticks"><li>{t("For goods: a commercial invoice and a packing list. We help you prepare them.","Untuk barang: commercial invoice dan packing list. Kami bantu menyiapkannya.")}</li><li>{t("Declare contents and value truthfully. Costs and fines from a wrong declaration are the sender's responsibility.","Nyatakan isi dan nilai dengan benar. Biaya dan denda akibat pernyataan yang tidak benar menjadi tanggung jawab Pengirim.")}</li><li>{t("Customs delays are outside our control and are not grounds for a claim.","Keterlambatan akibat proses kepabeanan di luar kendali kami dan bukan dasar pengajuan klaim.")}</li><li>{t("Lithium batteries and dangerous goods are only accepted after our written approval.","Baterai lithium dan barang berbahaya hanya diterima setelah persetujuan tertulis dari kami.")} <a href="prohibited-items.html">{t("See prohibited and restricted items","Lihat barang terlarang dan dibatasi")}</a>.</li></ul>
<h2>{t("5. Tax on our price","5. Pajak atas harga kami")}</h2>
<p>{t("Our prices carry no VAT (PPN) at present.","Saat ini harga kami tidak dikenakan PPN.")}</p>
<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:22px"><a class="btn btn-a" href="rates.html">{t("Get a rate","Cek tarif")}</a><a class="btn btn-wa" href="{wa(L[lang]['wa_txt'])}">{L[lang]['chat']}</a></div>
</div></section>'''

PROHIB = [
 ("Explosives, fireworks, ammunition and weapons","Bahan peledak, kembang api, amunisi, dan senjata"),
 ("Flammable liquids and gases, aerosols, lighters","Cairan dan gas mudah terbakar, aerosol, korek api"),
 ("Narcotics and illegal drugs","Narkotika dan obat terlarang"),
 ("Cash, cheques, gold bars and precious stones","Uang tunai, cek, emas batangan, dan batu mulia"),
 ("Live animals, and protected plants and animal products","Hewan hidup, serta tumbuhan dan produk hewan yang dilindungi"),
 ("Counterfeit goods and items that infringe trademarks","Barang palsu dan barang yang melanggar merek"),
 ("Pornographic material","Materi pornografi"),
 ("Corrosive, toxic, radioactive or infectious substances","Bahan korosif, beracun, radioaktif, atau infeksius"),
]
RESTR = [
 ("Lithium batteries and devices containing them","Baterai lithium dan perangkat yang berisi baterai"),
 ("Food, supplements and perishable goods","Makanan, suplemen, dan barang yang mudah rusak"),
 ("Medicines and cosmetics","Obat-obatan dan kosmetik"),
 ("Liquids, perfumes and powders","Cairan, parfum, dan bubuk"),
 ("Magnets and electronics","Magnet dan barang elektronik"),
 ("High-value goods","Barang bernilai tinggi"),
]
def prohibited(lang):
    E = lang == 'en'
    p = ''.join(f'<li>{a if E else b}</li>' for a, b in PROHIB); r = ''.join(f'<li>{a if E else b}</li>' for a, b in RESTR)
    return head(lang, "Prohibited and restricted items" if E else "Barang terlarang dan dibatasi", "Check before you book. Rules also depend on the destination country." if E else "Periksa sebelum booking. Aturan juga tergantung negara tujuan.", "Prohibited items" if E else "Barang terlarang") + f'''
<section class="s"><div class="wrap prose">
<h2>{"We do not accept" if E else "Tidak kami terima"}</h2><ul>{p}</ul>
<h2>{"Accepted only after we check" if E else "Diterima setelah kami periksa"}</h2><p>{"These need special packing, documents or approval. Tell us before booking." if E else "Barang ini memerlukan kemasan, dokumen, atau persetujuan khusus. Beritahu kami sebelum booking."}</p><ul>{r}</ul>
<p>{"This list is not complete. When in doubt, ask us on WhatsApp before you book." if E else "Daftar ini tidak lengkap. Jika ragu, tanyakan lewat WhatsApp sebelum booking."}</p>
<a class="btn btn-wa" href="{wa("Hello PCW, can I ship this item: " if E else "Halo PCW, apakah barang ini bisa dikirim: ")}">{"Ask about an item" if E else "Tanya tentang barang"}</a>
</div></section>'''

def md_to_html(md):
    out = []
    for line in md.splitlines():
        s = line.strip()
        if not s: continue
        if s.startswith('# '): continue
        if s.startswith('## '): out.append(f'<h2>{html.escape(s[3:])}</h2>')
        elif s.startswith('DRAFT'): continue
        else:
            s2 = html.escape(s); s2 = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', s2)
            out.append(f'<p>{s2}</p>')
    return '\n'.join(out)

def terms(lang):
    E = lang == 'en'
    body = md_to_html(open(TERMS_MD, encoding='utf-8').read()) if TERMS_MD and os.path.exists(TERMS_MD) else '<p>[Terms text missing]</p>'
    note = '<div class="notice info">These Terms are written in Bahasa Indonesia, which is the binding version under Indonesian law. An English translation will be added; ask us if you need help understanding any clause.</div>' if E else ''
    return head(lang, "Terms & Conditions" if E else "Syarat & Ketentuan", "PCW International Express" , "Terms" if E else "Syarat") + f'<section class="s"><div class="wrap prose">{note}{body}</div></section>'

def privacy(lang):
    E = lang == 'en'
    if E:
        body = '''<h2>1. Who we are</h2><p>PT Prabaswara Catur Widantara ("PCW"), brand PCW Freight, Jl. Bukit Golf Hijau Raya No. 18, Sentul City, Kab. Bogor 16810. Contact: info@pcwfreight.com.</p>
<h2>2. Data we collect</h2><p>Names, company, addresses, phone or WhatsApp numbers and email of the shipper and receiver; shipment contents, value, weight and size; and messages you send us.</p>
<h2>3. Why we use it</h2><p>To quote, book, carry, clear through customs and deliver your shipment; to send you status updates and invoices; and to answer your questions.</p>
<h2>4. Who receives it</h2><p>Only the transport, customs and delivery partners needed to complete the shipment, and authorities where the law requires it. We do not sell personal data.</p>
<h2>5. How long we keep it</h2><p>For as long as needed for the shipment, claims, accounting and legal obligations.</p>
<h2>6. Your rights</h2><p>You may ask to see, correct or delete your data, or withdraw consent, by emailing info@pcwfreight.com. Some data must be kept to meet legal obligations.</p>
<h2>7. Security</h2><p>Access to booking data is limited to PCW staff who handle shipments.</p>
<h2>8. Changes</h2><p>We may update this policy; the date of the latest version is shown here. Version: November 2026.</p>'''
    else:
        body = '''<h2>1. Siapa kami</h2><p>PT Prabaswara Catur Widantara ("PCW"), merek PCW Freight, Jl. Bukit Golf Hijau Raya No. 18, Sentul City, Kab. Bogor 16810. Kontak: info@pcwfreight.com.</p>
<h2>2. Data yang kami kumpulkan</h2><p>Nama, perusahaan, alamat, nomor telepon atau WhatsApp, dan email pengirim serta penerima; isi, nilai, berat, dan ukuran kiriman; serta pesan yang Anda kirim kepada kami.</p>
<h2>3. Tujuan penggunaan</h2><p>Untuk penawaran, booking, pengangkutan, kepabeanan, dan pengantaran kiriman Anda; untuk mengirim update status dan tagihan; serta untuk menjawab pertanyaan Anda.</p>
<h2>4. Pihak yang menerima</h2><p>Hanya mitra pengangkutan, kepabeanan, dan pengantaran yang diperlukan untuk menyelesaikan kiriman, serta instansi berwenang bila diwajibkan hukum. Kami tidak menjual data pribadi.</p>
<h2>5. Lama penyimpanan</h2><p>Selama diperlukan untuk kiriman, klaim, pembukuan, dan kewajiban hukum.</p>
<h2>6. Hak Anda</h2><p>Anda dapat meminta untuk melihat, memperbaiki, atau menghapus data Anda, atau menarik persetujuan, dengan email ke info@pcwfreight.com. Sebagian data wajib disimpan untuk memenuhi kewajiban hukum.</p>
<h2>7. Keamanan</h2><p>Akses ke data booking dibatasi untuk staf PCW yang menangani kiriman.</p>
<h2>8. Perubahan</h2><p>Kebijakan ini dapat diperbarui; tanggal versi terakhir tercantum di sini. Versi: November 2026.</p>'''
    return head(lang, "Privacy Policy" if E else "Kebijakan Privasi", "How PCW Freight uses personal data, in line with Indonesia's Personal Data Protection Law (UU PDP)." if E else "Cara PCW Freight menggunakan data pribadi, sesuai UU Pelindungan Data Pribadi (UU PDP).", "Privacy" if E else "Privasi") + f'<section class="s"><div class="wrap prose">{body}</div></section>'

def notfound(lang):
    E = lang == 'en'
    return head(lang, "Page not found" if E else "Halaman tidak ditemukan", "The page you looked for does not exist." if E else "Halaman yang Anda cari tidak ada.", "404") + f'<section class="s"><div class="wrap" style="display:flex;gap:10px;flex-wrap:wrap"><a class="btn btn-a" href="rates.html">{L[lang]["getrate"]}</a><a class="btn btn-o" href="track.html">{"Track" if E else "Lacak"}</a><a class="btn btn-wa" href="{wa(L[lang]["wa_txt"])}">{L[lang]["chat"]}</a></div></section>'

PAGES = [
 ('index.html', home, ('PCW Freight | International Express from Indonesia','PCW Freight | Ekspres Internasional dari Indonesia'), ('Door-to-door international express for documents and parcels from Indonesia. Instant published rates, online booking and tracking.','Pengiriman ekspres internasional door to door untuk dokumen dan paket dari Indonesia. Cek tarif, booking online, dan lacak kiriman.')),
 ('international-express.html', express, ('PCW International Express | PCW Freight',)*2, ('Compare PCW Priority Express and PCW Economy Express.','Bandingkan PCW Priority Express dan PCW Economy Express.')),
 ('priority-express.html', lambda l: product(l,'p'), ('PCW Priority Express | PCW Freight',)*2, ('Fast international express for documents, samples and urgent goods, with pickup anywhere in Indonesia.','Ekspres internasional cepat untuk dokumen, sampel, dan barang mendesak, dengan pickup di seluruh Indonesia.')),
 ('economy-express.html', lambda l: product(l,'e'), ('PCW Economy Express | PCW Freight',)*2, ('Lower-cost international delivery for non-urgent parcels, all-in price.','Pengiriman internasional hemat untuk paket tidak mendesak, harga all-in.')),
 ('rates.html', rates, ('Shipping Rates | PCW Freight','Tarif Pengiriman | PCW Freight'), ('Check published international express rates by destination and weight.','Cek published rate ekspres internasional berdasarkan tujuan dan berat.')),
 ('book.html', book, ('Book a Shipment | PCW Freight','Booking Pengiriman | PCW Freight'), ('Book an international express shipment online and get a PCW reference number.','Booking pengiriman ekspres internasional secara online dan dapatkan nomor referensi PCW.')),
 ('track.html', track, ('Track a Shipment | PCW Freight','Lacak Kiriman | PCW Freight'), ('Track your PCW Freight shipment with your PCW reference number.','Lacak kiriman PCW Freight dengan nomor referensi PCW.')),
 ('other-services.html', other, ('Other Services | PCW Freight','Layanan Lain | PCW Freight'), ('Air, sea and land freight and warehousing by request.','Air, sea, land freight, dan gudang melalui permintaan.')),
 ('about.html', about, ('About | PCW Freight','Tentang | PCW Freight'), ('About PCW Freight, a brand of PT Prabaswara Catur Widantara.','Tentang PCW Freight, merek PT Prabaswara Catur Widantara.')),
 ('contact.html', contact, ('Contact | PCW Freight','Kontak | PCW Freight'), ('Contact PCW Freight by WhatsApp, email or at our Sentul City office.','Hubungi PCW Freight lewat WhatsApp, email, atau di kantor Sentul City.')),
 ('faq.html', faq, ('FAQ | PCW Freight',)*2, ('Answers about pricing, duties, payment, pickup and claims.','Jawaban seputar harga, bea masuk, pembayaran, pickup, dan klaim.')),
 ('surcharges-customs.html', surcharges, ('Surcharges & Customs | PCW Freight','Surcharge & Kepabeanan | PCW Freight'), ('Fuel surcharge, chargeable weight, duties and taxes explained for PCW International Express.','Fuel surcharge, berat tagih, bea masuk dan pajak untuk PCW International Express dijelaskan.')),
 ('prohibited-items.html', prohibited, ('Prohibited Items | PCW Freight','Barang Terlarang | PCW Freight'), ('Items we do not accept and items that need checking before shipping.','Barang yang tidak kami terima dan barang yang perlu diperiksa sebelum dikirim.')),
 ('terms.html', terms, ('Terms & Conditions | PCW Freight','Syarat & Ketentuan | PCW Freight'), ('Terms and conditions of PCW International Express.','Syarat dan ketentuan layanan PCW International Express.')),
 ('privacy.html', privacy, ('Privacy Policy | PCW Freight','Kebijakan Privasi | PCW Freight'), ('How PCW Freight handles personal data.','Cara PCW Freight mengelola data pribadi.')),
 ('404.html', notfound, ('Page not found | PCW Freight','Halaman tidak ditemukan | PCW Freight'), ('Page not found.','Halaman tidak ditemukan.')),
]

def build():
    if os.path.exists(DIST): shutil.rmtree(DIST)
    os.makedirs(os.path.join(DIST, 'id')); shutil.copytree(os.path.join(SRC, 'assets'), os.path.join(DIST, 'assets'))
    for slug, fn, titles, descs in PAGES:
        for i, lang in enumerate(['en', 'id']):
            path = os.path.join(DIST, 'id' if lang == 'id' else '', slug)
            open(path, 'w', encoding='utf-8').write(page(lang, slug, titles[i], descs[i], fn(lang)))
    open(os.path.join(DIST, 'robots.txt'), 'w').write(f'User-agent: *\nAllow: /\nSitemap: {SITE}sitemap.xml\n')
    urls = ''.join(f'<url><loc>{SITE}{p}{"" if s=="index.html" else s}</loc></url>' for s, *_ in PAGES if s != '404.html' for p in ['', 'id/'])
    open(os.path.join(DIST, 'sitemap.xml'), 'w').write(f'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{urls}</urlset>')
    HT = """ErrorDocument 404 /404.html
DirectoryIndex index.html
Options -Indexes
<IfModule mod_rewrite.c>
RewriteEngine On
# force https (keep certificate renewal path open)
RewriteCond %{HTTPS} !=on
RewriteCond %{REQUEST_URI} !^/\\.well-known/
RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [R=301,L]
# www -> bare domain
RewriteCond %{HTTP_HOST} ^www\\.(.+)$ [NC]
RewriteRule ^ https://%1%{REQUEST_URI} [R=301,L]
# old WordPress addresses -> new pages
RewriteRule ^about-us/?$ /about.html [R=301,L]
RewriteRule ^contact-us(-2)?/?$ /contact.html [R=301,L]
RewriteRule ^services/?$ /international-express.html [R=301,L]
RewriteRule ^track-shipment/?$ /track.html [R=301,L]
RewriteRule ^check-shipping-rates/?$ /rates.html [R=301,L]
RewriteRule ^privacy-policy/?$ /privacy.html [R=301,L]
RewriteRule ^terms-and-conditions/?$ /terms.html [R=301,L]
RewriteRule ^(blogs|blog|news)(/.*)?$ / [R=301,L]
# clean addresses: /track -> track.html (query string kept)
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{DOCUMENT_ROOT}/$1.html -f
RewriteRule ^(.+?)/?$ /$1.html [L]
</IfModule>
<IfModule mod_headers.c>
Header set X-Content-Type-Options "nosniff"
Header set Referrer-Policy "strict-origin-when-cross-origin"
Header set X-Frame-Options "SAMEORIGIN"
</IfModule>
"""
    open(os.path.join(DIST, '.htaccess'), 'w').write(HT)
    st = os.path.join(SRC, 'static')
    if os.path.isdir(st):
        for f in os.listdir(st): shutil.copy(os.path.join(st, f), DIST)
    print('built', len(PAGES) * 2, 'pages')

if __name__ == '__main__': build()
