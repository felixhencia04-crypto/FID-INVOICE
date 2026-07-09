const fs = require('fs');
let code = fs.readFileSync('src/components/AuthPage.tsx', 'utf8');

const verifySandboxPattern = /              \{\/\* Interactive Sandbox Email Inbox Simulator \*\/\}[\s\S]*?              <\/div>\n            <\/div>\n          \)\}/;

const verifySandboxReplacement = `              {/* Interactive Sandbox Email Inbox Simulator */}
              {!hasResendConfigured() && (
                <div className="mt-8 pt-6 border-t border-gray-150 text-left">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">📬 Kotak Masuk Simulasi Email ({email || 'budi@perusahaan.com'})</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-blue-100 text-blue-800 animate-pulse font-mono">1 Baru</span>
                  </div>
                  
                  <div className="mb-3 p-3 bg-amber-50 border border-amber-150 text-amber-700 rounded-xl text-[10px] leading-relaxed flex flex-col gap-1">
                    <span className="font-bold flex items-center gap-1 text-[11px]">🔌 MODE TESTING (SANDBOX)</span>
                    <span>Email simulasi di bawah ini aktif untuk pengujian cepat. Untuk mengaktifkan pengiriman email asli ke inbox user secara otomatis, atur API Key Resend Anda di <strong>Panel Pemilik &gt; Integrasi Email</strong>.</span>
                  </div>
                  
                  <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4 hover:border-brand-primary/30 transition-all cursor-pointer shadow-xs" 
                       onClick={handleVerificationComplete}>
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-black text-brand-dark">FID INVOICE</span>
                      <span className="text-[10px] text-gray-400 font-mono">Baru saja</span>
                    </div>
                    <h4 className="text-xs font-bold text-brand-primary mt-1">📧 Verifikasi Akun Bisnis FID INVOICE Anda</h4>
                    <p className="text-[10px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                      Halo {fullName || 'Pengguna'}, Klik kotak ini untuk langsung memverifikasi email Anda dan mengaktifkan trial 3 hari gratis paket {selectedPlan.toUpperCase()} secara instan!
                    </p>
                    <div className="mt-3 flex items-center gap-1 text-[11px] text-brand-primary font-black">
                      <span>Buka email & verifikasi instan ↗</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}`;

code = code.replace(verifySandboxPattern, verifySandboxReplacement);

fs.writeFileSync('src/components/AuthPage.tsx', code);
