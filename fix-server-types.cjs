const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

// Add senderBank to TransactionRecord interface
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
}`;

const newInterface = `interface TransactionRecord {
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

content = content.replace(oldInterface, newInterface);

fs.writeFileSync('server.ts', content);
console.log('Fixed server.ts types');
