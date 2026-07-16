const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const oldNav = `    { id: 'reports', label: 'Laporan Keuangan', icon: BarChart3 },
    { id: 'subscription', label: 'Paket Saya', icon: CreditCard },
    { id: 'settings', label: 'Setelan Profil', icon: Settings },
  ];`;

const newNav = `    { id: 'reports', label: 'Laporan Keuangan', icon: BarChart3 },
    { id: 'promo-flyer', label: 'Brosur Promo', icon: Sparkles },
    { id: 'subscription', label: 'Paket Saya', icon: CreditCard },
    { id: 'settings', label: 'Setelan Profil', icon: Settings },
  ];`;

content = content.replace(oldNav, newNav);

fs.writeFileSync('src/App.tsx', content);
