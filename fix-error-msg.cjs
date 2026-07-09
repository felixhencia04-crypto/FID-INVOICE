const fs = require('fs');

let adminCode = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');
adminCode = adminCode.replace(`const errData = await response.json().catch(() => ({}));
        setTestEmailError(errData.message || 'Gagal mengirim email. Periksa kembali API Key atau domain pengirim Anda.');`, `const errData = await response.json().catch(() => ({}));
        setTestEmailError(errData.message || errData.error || 'Gagal mengirim email. Periksa kembali API Key atau domain pengirim Anda.');`);
fs.writeFileSync('src/components/AdminPanel.tsx', adminCode);
