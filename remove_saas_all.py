import re
import os

files_to_check = [
    'src/components/LandingPage.tsx',
    'src/components/PaymentHistorySection.tsx',
    'src/components/SubscriptionPage.tsx',
    'src/components/AdminPanel.tsx',
    'src/utils/emailService.ts',
    'src/App.tsx'
]

for filepath in files_to_check:
    if not os.path.exists(filepath): continue
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Replace cases
    content = content.replace("SaaS Bisnis Lancar", "Bisnis Lancar")
    content = content.replace("SaaS Invoice", "Invoice")
    content = content.replace("FID INVOICE SaaS PLATFORM", "FID INVOICE PLATFORM")
    content = content.replace("FID INVOICE SaaS", "FID INVOICE")
    content = content.replace("SaaS Gateway", "Gateway")
    content = content.replace("SaaS SECURE GATEWAY", "SECURE GATEWAY")
    content = content.replace("SaaS ", "")
    content = content.replace("SaaS", "")

    with open(filepath, 'w') as f:
        f.write(content)
