import re
with open('src/App.tsx', 'r') as f:
    content = f.read()

old_load = """    if (parsed) {
      
      // Healer/Deduplication check for historical duplicates
      const rawInvoices = parsed.invoices || [];"""

new_load = """    if (parsed) {
      let isDemoAndEmpty = false;
      if (userId === 'user-demo' && parsed.clients.length === 0 && parsed.products.length === 0 && parsed.invoices.length === 0 && parsed.quotations.length === 0) {
        isDemoAndEmpty = true;
      }

      if (isDemoAndEmpty) {
        // Seed default demo databases ONLY for the demo account
        const defaultQuotations: Quotation[] = [
          {
            id: 'q-demo-1',
            quotationNumber: 'QT-2026-0001',
            userId: userId,
            clientId: SEED_CLIENTS[0]?.id || 'cli-1',
            clientName: SEED_CLIENTS[0]?.name || 'Felix Hencia',
            date: new Date().toISOString().split('T')[0],
            validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            items: [
              {
                id: 'qitem-1',
                description: 'Jasa Pembuatan Website Custom',
                qty: 1,
                unit: 'Paket',
                price: 8500000,
                discountPercent: 0,
                subtotal: 8500000
              }
            ],
            globalDiscountPercent: 5,
            hasTax: true,
            hasTax2: false,
            subtotal: 8500000,
            discountAmount: 425000,
            taxAmount: 888250,
            tax2Amount: 0,
            total: 8963250,
            spelledOut: 'Delapan Juta Sembilan Ratus Enam Puluh Tiga Ribu Dua Ratus Lima Puluh Rupiah',
            status: 'Draft',
            notes: 'Penawaran ini mencakup analisis sistem penuh dan implementasi awal.',
            terms: '1. Penawaran harga ini berlaku selama 30 hari sejak tanggal diterbitkan.\\n2. Pembayaran uang muka sebesar 50% dilakukan saat penandatanganan persetujuan.\\n3. Sisa pelunasan 50% dilakukan setelah pekerjaan selesai dideploy.',
            templateId: 'corporate',
            currency: 'IDR',
            createdAt: new Date().toISOString()
          }
        ];
        const defaultData = {
          clients: SEED_CLIENTS,
          products: SEED_PRODUCTS,
          invoices: SEED_INVOICES,
          quotations: defaultQuotations
        };
        localStorage.setItem(`fid_invoice_user_${userId}_data`, JSON.stringify(defaultData));
        setClients(SEED_CLIENTS);
        setProducts(SEED_PRODUCTS);
        setInvoices(SEED_INVOICES);
        setQuotations(defaultQuotations);
        syncToFirebaseSubcollections(userId, null, defaultData);
        return;
      }
      
      // Healer/Deduplication check for historical duplicates
      const rawInvoices = parsed.invoices || [];"""

content = content.replace(old_load, new_load)

# I also want to remove the old `else` block since it's now handled or redundant.
# Wait, replacing the `else` block safely:
content = re.sub(r'    } else \{\n      // Seed default demo databases ONLY for the demo account(.*?)\n    \}', r'', content, flags=re.DOTALL)

with open('src/App.tsx', 'w') as f:
    f.write(content)

