const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const promoFlyerCase = `
      case 'promo-flyer':
        return <PromoFlyer />;

      default:`;

content = content.replace('      default:', promoFlyerCase);

fs.writeFileSync('src/App.tsx', content);
