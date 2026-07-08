const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const interfaceRegex = /interface TransactionRecord \{\s*orderId: string;\s*userId: string;\s*userEmail: string;\s*fullName: string;\s*planName: string;\s*amount: number;\s*isYearly: boolean;\s*status: 'pending' \| 'confirmed' \| 'rejected' \| 'applied';\s*timestamp: string;\s*paymentType\?: string;\s*senderBank\?: string;\s*\}/s;

const oldInterface = `interface TransactionRecord {
  orderId: string;
  userId: string;
  userEmail: string;
  fullName: string;
  planName: string;
  amount: number;
  isYearly: boolean;
  status: 'pending' | 'confirmed' | 'rejected' | 'applied';
  timestamp: string;
  paymentType?: string;
  senderBank?: string;
}`;

if (!content.includes('senderBank?: string;')) {
    const oldInt = `interface TransactionRecord {
  orderId: string;
  userId: string;
  userEmail: string;
  fullName: string;
  planName: string;
  amount: number;
  isYearly: boolean;
  status: 'pending' | 'confirmed' | 'rejected' | 'applied';
  timestamp: string;
  paymentType?: string;
}`;
    content = content.replace(oldInt, oldInterface);
}

fs.writeFileSync('server.ts', content);
console.log('Fixed server.ts types again');
