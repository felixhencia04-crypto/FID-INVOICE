import re
with open('src/components/SubscriptionPage.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    '<p className="text-[10px] text-gray-400 mt-1">Max 5 Invoice / bulan, 1 Klien Aktif.</p>',
    '<ul className="text-[10px] text-gray-500 mt-2 space-y-1 list-disc list-inside"><li>Max 5 Invoice / bulan</li><li>Max 1 Klien Aktif</li><li>Template Invoice Dasar</li><li>Ekspor PDF Instan</li></ul>'
)

content = content.replace(
    '<p className="text-[10px] text-gray-400 mt-1">Unlimited Invoice, 50 Klien, 10 Template Premium, Ekspor PDF + Excel, Auto WA.</p>',
    '<ul className="text-[10px] text-gray-500 mt-2 space-y-1 list-disc list-inside"><li>Unlimited Invoice</li><li>Maksimal 50 Klien</li><li>10 Template Premium</li><li>Ekspor PDF + Excel</li><li>Pengingat WhatsApp Otomatis</li><li>Laporan Grafik Keuangan Dasar</li></ul>'
)

content = content.replace(
    '<p className="text-[10px] text-gray-400 mt-1">Unlimited Invoice & Klien, Custom Template, White-label, API, Prioritas CS.</p>',
    '<ul className="text-[10px] text-gray-500 mt-2 space-y-1 list-disc list-inside"><li>Unlimited Invoice & Klien</li><li>Custom Template & Branding Anda</li><li>White-Label (Hapus Brand FID)</li><li>Akses API khusus</li><li>Dedicated Support CS Prioritas</li></ul>'
)

with open('src/components/SubscriptionPage.tsx', 'w') as f:
    f.write(content)
