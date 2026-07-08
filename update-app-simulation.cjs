const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const simulateQuotaLogic = `  const handleSimulateQuota = (type: 'clients' | 'invoices', max: number) => {
    if (!currentUser) return;
    
    if (type === 'clients') {
      const generatedClients = [];
      for (let i = 0; i < max; i++) {
        generatedClients.push({
          id: 'sim_client_' + i + '_' + Date.now(),
          name: 'Simulasi Klien ' + (i + 1),
          email: 'sim' + i + '@example.com',
          phone: '0800000000',
          address: 'Alamat Simulasi ' + i,
          createdAt: new Date().toISOString()
        });
      }
      setClients(generatedClients);
      saveUserDataToStorage(currentUser.id, generatedClients, products, invoices);
      showToast(\`Berhasil mengisi \${max} klien untuk simulasi kuota\`, 'info');
    } else if (type === 'invoices') {
      const generatedInvoices = [];
      for (let i = 0; i < max; i++) {
        generatedInvoices.push({
          id: 'sim_inv_' + i + '_' + Date.now(),
          invoiceNumber: 'INV-SIM-' + (i + 1),
          userId: currentUser.id,
          clientId: 'sim_client_0',
          clientName: 'Klien Simulasi',
          date: new Date().toISOString().split('T')[0],
          dueDate: new Date().toISOString().split('T')[0],
          type: 'Commercial Invoice',
          items: [],
          globalDiscountPercent: 0,
          hasTax: false,
          hasTax2: false,
          subtotal: 100000,
          discountAmount: 0,
          taxAmount: 0,
          tax2Amount: 0,
          total: 100000,
          spelledOut: 'Seratus Ribu Rupiah',
          status: 'Draft',
          templateId: 'corporate',
          currency: 'IDR',
          createdAt: new Date().toISOString()
        });
      }
      setInvoices(generatedInvoices);
      saveUserDataToStorage(currentUser.id, clients, products, generatedInvoices);
      showToast(\`Berhasil mengisi \${max} invoice untuk simulasi kuota\`, 'info');
    }
  };`;

// Insert the logic before handleNavigate
content = content.replace('  // Centrally handle navigation with subscription guards', simulateQuotaLogic + '\\n\\n  // Centrally handle navigation with subscription guards');

const oldAppSub = `onUpgradePlan={(plan, isYearly) => {`;

const newAppSub = `onSimulateQuota={handleSimulateQuota}
            onUpgradePlan={(plan, isYearly) => {`;

content = content.replace(oldAppSub, newAppSub);

fs.writeFileSync('src/App.tsx', content);

console.log('Fixed App.tsx simulation handler');
