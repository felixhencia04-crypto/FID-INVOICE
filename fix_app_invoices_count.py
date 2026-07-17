import re
with open('src/App.tsx', 'r') as f:
    content = f.read()

# Replace currentInvoiceCount
old_count = "currentInvoiceCount={invoices.length}"
new_count = """currentInvoiceCount={currentUser?.subscription.plan === 'starter' ? invoices.filter(inv => inv.date.startsWith(new Date().toISOString().substring(0, 7)) && !inv.invoiceNumber.startsWith('KW-')).length : invoices.length}"""

content = content.replace(old_count, new_count)

with open('src/App.tsx', 'w') as f:
    f.write(content)
