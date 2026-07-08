const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const regex = /interface TransactionRecord \{\s*orderId: string;\s*userId: string;\s*userEmail: string;\s*fullName: string;\s*planName: string;\s*amount: number;\s*isYearly: boolean;\s*status: 'pending' \| 'confirmed' \| 'applied' \| 'rejected';\s*paymentType\?: string;\s*timestamp: string;\s*\}/s;

const newInterface = `interface TransactionRecord {
  orderId: string;
  userId: string;
  userEmail: string;
  fullName: string;
  planName: string;
  amount: number;
  isYearly: boolean;
  status: 'pending' | 'confirmed' | 'applied' | 'rejected';
  paymentType?: string;
  timestamp: string;
  senderBank?: string;
}`;

content = content.replace(regex, newInterface);

fs.writeFileSync('server.ts', content);
console.log('Fixed server.ts types properly this time');
