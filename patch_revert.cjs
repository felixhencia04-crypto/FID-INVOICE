const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Remove import
content = content.replace(/import PromoFlyer from '\.\/components\/PromoFlyer';\n?/, '');

// Remove nav item
const navRevert = `    { id: 'reports', label: 'Laporan Keuangan', icon: BarChart3 },
    { id: 'promo-flyer', label: 'Brosur Promo', icon: Sparkles },
    { id: 'subscription', label: 'Paket Saya', icon: CreditCard },`;
const navOrig = `    { id: 'reports', label: 'Laporan Keuangan', icon: BarChart3 },
    { id: 'subscription', label: 'Paket Saya', icon: CreditCard },`;
content = content.replace(navRevert, navOrig);

// Remove case
const caseRevert = `      case 'promo-flyer':
        return <PromoFlyer />;

      default:`;
const caseOrig = `      default:`;
content = content.replace(caseRevert, caseOrig);

fs.writeFileSync('src/App.tsx', content);
