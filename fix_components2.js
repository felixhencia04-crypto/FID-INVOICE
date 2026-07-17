import fs from 'fs';

let qris = fs.readFileSync('src/components/QrisPaymentBox.tsx', 'utf8');
// Add 'dark' class if isDarkMode is true
qris = qris.replace('className={`w-full max-w-lg mx-auto rounded-3xl border shadow-xl overflow-hidden transition-all duration-300 ${containerBg}`}', 
                    'className={`w-full max-w-lg mx-auto rounded-3xl border shadow-xl overflow-hidden transition-all duration-300 ${containerBg} ${isDarkMode ? "dark" : ""}`}');
fs.writeFileSync('src/components/QrisPaymentBox.tsx', qris);

let hist = fs.readFileSync('src/components/PaymentHistorySection.tsx', 'utf8');
hist = hist.replace('<div className={`p-6 rounded-2xl border ${isDarkMode ? \'bg-slate-900/60 border-slate-800\' : \'bg-white border-gray-100 shadow-sm\'} space-y-5 text-left`}>',
                    '<div className={`p-6 rounded-2xl border ${isDarkMode ? \'bg-slate-900/60 border-slate-800 dark\' : \'bg-white border-gray-100 shadow-sm\'} space-y-5 text-left`}>');
fs.writeFileSync('src/components/PaymentHistorySection.tsx', hist);

