import re
with open('index.html', 'r') as f:
    content = f.read()

new_head = """  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="FID INVOICE - Aplikasi Pembuat Invoice dan Kuitansi Digital untuk UMKM dan Bisnis. Kelola dan cetak laporan keuangan dengan mudah." />
    <meta name="keywords" content="aplikasi invoice, buat tagihan, kuitansi digital, laporan keuangan, software invoice Indonesia" />
    <meta property="og:title" content="FID INVOICE - Aplikasi Invoice Pintar" />
    <meta property="og:description" content="Kelola tagihan, laporan keuangan, dan buat invoice profesional dengan cepat bersama FID INVOICE." />
    <meta property="og:type" content="website" />
    <meta name="robots" content="index, follow" />
    <title>FID INVOICE | Aplikasi Invoice Pintar</title>
  </head>"""

content = re.sub(r'<head>.*?</head>', new_head, content, flags=re.DOTALL)

with open('index.html', 'w') as f:
    f.write(content)
