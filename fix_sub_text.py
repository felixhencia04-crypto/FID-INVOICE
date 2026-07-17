import re
with open('src/components/SubscriptionPage.tsx', 'r') as f:
    content = f.read()

content = content.replace("Max 5 Invoice, 1 Klien Aktif.", "Max 5 Invoice / bulan, 1 Klien Aktif.")
content = content.replace("Unlimited Invoice, 50 Klien, Auto Reminder.", "Unlimited Invoice, 50 Klien, 10 Template Premium, Ekspor PDF + Excel, Auto WA.")
content = content.replace("Unlimited Klien, Custom Branding, API Akses.", "Unlimited Invoice & Klien, Custom Template, White-label, API, Prioritas CS.")

with open('src/components/SubscriptionPage.tsx', 'w') as f:
    f.write(content)
