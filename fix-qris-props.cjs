const fs = require('fs');
let content = fs.readFileSync('src/components/QrisPaymentBox.tsx', 'utf8');

const oldProps = `interface QrisPaymentBoxProps {
  amount: number;
  planName: string;
  onPaymentSuccess: () => void;
  onClose?: () => void;
  isDarkMode?: boolean;
}`;

const newProps = `interface QrisPaymentBoxProps {
  amount: number;
  planName: string;
  onPaymentSuccess: () => void;
  onClose?: () => void;
  isDarkMode?: boolean;
  userName?: string;
  userEmail?: string;
  userId?: string;
}`;

content = content.replace(oldProps, newProps);

const oldComponent = `export default function QrisPaymentBox({ 
  amount, 
  planName, 
  onPaymentSuccess,
  onClose,
  isDarkMode = false
}: QrisPaymentBoxProps) {`;

const newComponent = `export default function QrisPaymentBox({ 
  amount, 
  planName, 
  onPaymentSuccess,
  onClose,
  isDarkMode = false,
  userName,
  userEmail,
  userId
}: QrisPaymentBoxProps) {`;

content = content.replace(oldComponent, newComponent);

const oldUserLogic = `const activeSessionStr = localStorage.getItem('fid_invoice_active_session');
      const activeUser = activeSessionStr ? JSON.parse(activeSessionStr) : null;`;

const newUserLogic = `const activeSessionStr = localStorage.getItem('fid_invoice_active_session');
      const activeUser = activeSessionStr ? JSON.parse(activeSessionStr) : null;
      const finalUserName = userName || activeUser?.fullName || 'Tamu';
      const finalUserId = userId || activeUser?.id || 'guest';
      const finalUserEmail = userEmail || activeUser?.email || 'guest@example.com';
      const finalBusinessName = activeUser?.businessName || 'Bisnis Tamu';`;

content = content.replace(oldUserLogic, newUserLogic);

// Replace activeUser properties in the body of confirmPaymentViaWhatsApp
content = content.replace(/userId: activeUser\?\.id \|\| 'guest'/g, 'userId: finalUserId');
content = content.replace(/userEmail: activeUser\?\.email \|\| 'customer@example.com'/g, 'userEmail: finalUserEmail');
content = content.replace(/fullName: activeUser\?\.fullName \|\| 'Pelanggan'/g, 'fullName: finalUserName');
content = content.replace(/userId: activeUser\?\.id \|\| 'guest'/g, 'userId: finalUserId');
content = content.replace(/userEmail: activeUser\?\.email \|\| 'guest@example.com'/g, 'userEmail: finalUserEmail');
content = content.replace(/fullName: activeUser\?\.fullName \|\| 'Tamu \/ Tamu Penilai'/g, 'fullName: finalUserName');
content = content.replace(/businessName: activeUser\?\.businessName \|\| 'Bisnis Tamu'/g, 'businessName: finalBusinessName');
content = content.replace(/Nama\*: \$\{activeUser\?\.fullName \|\| 'Tamu'\}/g, 'Nama*: ${finalUserName}');

fs.writeFileSync('src/components/QrisPaymentBox.tsx', content);
console.log('Fixed QrisPaymentBox props');
