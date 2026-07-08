const fs = require('fs');
let content = fs.readFileSync('src/components/QrisPaymentBox.tsx', 'utf8');

// Add state
content = content.replace(
  /const \[isSuccess, setIsSuccess\] = useState\(false\);/,
  "const [isSuccess, setIsSuccess] = useState(false);\n  const [generatedWaUrl, setGeneratedWaUrl] = useState('');"
);

// Replace confirmPaymentViaWhatsApp logic for success
const oldLogic = /const waUrl = `https:\/\/api\.whatsapp\.com\/send\?phone=\$\{ADMIN_WHATSAPP\}&text=\$\{encodeURIComponent\(message\)\}`;[\s\S]*?\}, 3000\);/g;

const newLogic = `const waUrl = \`https://api.whatsapp.com/send?phone=\${ADMIN_WHATSAPP}&text=\${encodeURIComponent(message)}\`;
      setGeneratedWaUrl(waUrl);
      setIsSuccess(true);
      
      // Try to open it programmatically, but it might get blocked by popup blockers
      try {
        window.open(waUrl, '_blank');
      } catch (e) {
        console.warn('Popup blocked, user needs to click manual link');
      }`;

content = content.replace(oldLogic, newLogic);

// Replace UI for isSuccess
const oldUi = /\{isSuccess \? \([\s\S]*?\) : \(/g;

const newUi = `{isSuccess ? (
              <div className="space-y-3">
                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 text-green-600 dark:text-green-400">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-6 h-6 shrink-0" />
                    <span className="text-sm font-black">Pesanan dibuat!</span>
                  </div>
                  <p className="text-[10px] text-center font-medium text-green-700 dark:text-green-300">
                    Sistem mendeteksi pesanan Anda. Klik tombol di bawah untuk mengirim bukti transfer agar admin dapat segera memprosesnya.
                  </p>
                </div>
                <a
                  href={generatedWaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-green-500/20 cursor-pointer transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 uppercase tracking-wider block text-center"
                >
                  <Smartphone className="w-5 h-5" />
                  Kirim Bukti via WhatsApp
                </a>
                <button
                  onClick={() => {
                    if (onClose) onClose();
                    else onPaymentSuccess();
                  }}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Tutup Jendela Ini
                </button>
              </div>
            ) : (`;

content = content.replace(oldUi, newUi);

fs.writeFileSync('src/components/QrisPaymentBox.tsx', content);
console.log('Fixed WhatsApp popup blocker issue');
