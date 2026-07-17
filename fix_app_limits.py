import re
with open('src/App.tsx', 'r') as f:
    content = f.read()

# Replace Starter invoice limit
old_limit = """    // Enforce Starter invoice limits
    if (!isEditExisting && !isReceiptUpdate && currentUser.subscription.plan === 'starter' && invoices.length >= 5) {
      setBlockedFeatureMessage('Batas Pembuatan Invoice (Starter: Max 5)');
      return;
    }"""

new_limit = """    // Enforce Starter invoice limits
    if (!isEditExisting && !isReceiptUpdate && currentUser.subscription.plan === 'starter') {
      const currentMonth = new Date().toISOString().substring(0, 7);
      const monthlyInvoices = invoices.filter(inv => inv.date.startsWith(currentMonth) && !inv.invoiceNumber.startsWith('KW-'));
      if (monthlyInvoices.length >= 5) {
        setBlockedFeatureMessage('Batas Pembuatan Invoice (Starter: Max 5 per bulan)');
        return;
      }
    }"""

content = content.replace(old_limit, new_limit)

with open('src/App.tsx', 'w') as f:
    f.write(content)
