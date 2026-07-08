const fs = require('fs');
let content = fs.readFileSync('src/components/PaymentHistorySection.tsx', 'utf8');

// Remove Doku check status button and simulate button
content = content.replace(
  `                        <button
                          onClick={() => handleCheckStatus(tx.orderId)}
                          disabled={checkingOrderId === tx.orderId}
                          className={\`px-3 py-1.5 rounded-lg font-bold text-[10px] transition-all cursor-pointer flex items-center justify-center gap-1 shrink-0 \${
                            isDarkMode
                              ? 'bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white'
                              : 'bg-gray-100 hover:bg-gray-200 border border-gray-200 text-slate-700'
                          }\`}
                        >
                          <RefreshCw className={\`w-3 h-3 \${checkingOrderId === tx.orderId ? 'animate-spin' : ''}\`} />
                          Cek Status Doku
                        </button>
                        <button
                          onClick={() => handleSimulateSettle(tx.orderId)}
                          disabled={simulatingOrderId === tx.orderId}
                          className="px-3 py-1.5 rounded-lg font-bold text-[10px] transition-all cursor-pointer bg-blue-600 hover:bg-blue-700 text-white shrink-0"
                          title="Gunakan ini untuk testing jika webhook Doku tidak sampai ke localhost"
                        >
                          {simulatingOrderId === tx.orderId ? 'Memproses...' : 'Simulasi Lunas'}
                        </button>`,
  `                        <span className="text-[10px] font-bold text-yellow-500 animate-pulse uppercase tracking-wider">Menunggu Konfirmasi Admin</span>`
);

// Remove Guide Card helper or update it
content = content.replace(
  `      {/* Guide Card helper */}
      <div className={\`p-4 rounded-xl text-xs flex items-start gap-3 leading-relaxed \${
        isDarkMode ? 'bg-slate-950/40 text-slate-300' : 'bg-gray-50 text-gray-500'
      }\`}>
        <HelpCircle className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">Panduan Pembayaran Terputus / Tertutup:</p>
          <p>
            Jika Anda sudah mengunduh QRIS atau menyalin Virtual Account namun halaman pembayaran tidak sengaja tertutup atau ter-logout:
          </p>
          <ol className="list-decimal list-inside ml-1 mt-1 space-y-1">
            <li>Lakukan transfer pembayaran seperti biasa menggunakan kode/QR yang sudah disimpan.</li>
            <li>Kembali ke halaman ini dan temukan riwayat tagihan Anda di atas.</li>
            <li>
              Klik <strong>"Cek Status Doku"</strong> untuk memaksa sistem membaca transaksi terupdate dari gerbang Doku.
            </li>
          </ol>
        </div>
      </div>`,
  `      {/* Guide Card helper */}
      <div className={\`p-4 rounded-xl text-xs flex items-start gap-3 leading-relaxed \${
        isDarkMode ? 'bg-slate-950/40 text-slate-300' : 'bg-gray-50 text-gray-500'
      }\`}>
        <HelpCircle className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">Panduan Pembayaran:</p>
          <p>
            Harap tunggu admin memverifikasi pembayaran Anda setelah Anda melakukan transfer dan konfirmasi via WhatsApp. Status akan otomatis berubah menjadi "Sudah Aktif" jika disetujui.
          </p>
        </div>
      </div>`
);

fs.writeFileSync('src/components/PaymentHistorySection.tsx', content);
console.log('Fixed PaymentHistorySection.tsx');
