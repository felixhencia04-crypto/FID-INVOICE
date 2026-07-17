import re
with open('src/components/AuthPage.tsx', 'r') as f:
    content = f.read()

verify_jsx = """
          {/* VIEW: VERIFY */}
          {view === 'verify' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                  <Mail className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-display font-extrabold text-brand-dark">
                  {isCreatingPassword ? 'Buat Kata Sandi' : 'Verifikasi Email'}
                </h3>
                <p className="text-sm text-gray-500 mt-2">
                  {isCreatingPassword 
                    ? `Silakan buat kata sandi untuk akun ${email}`
                    : `Kami telah mengirimkan tautan verifikasi ke email ${email}. Silakan cek kotak masuk atau folder spam Anda.`}
                </p>
              </div>

              {isCreatingPassword && (
                <div className="space-y-4 text-left">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Kata Sandi Baru</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"} 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Minimal 6 karakter" 
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 outline-none transition-all"
                      />
                      <Lock className="absolute left-3.5 top-3 w-4.5 h-4.5 text-gray-400" />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3 text-gray-400 hover:text-brand-primary transition-colors cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Konfirmasi Kata Sandi</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"} 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Ulangi kata sandi" 
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 outline-none transition-all"
                      />
                      <Lock className="absolute left-3.5 top-3 w-4.5 h-4.5 text-gray-400" />
                    </div>
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-150 rounded-xl text-xs text-red-600 font-semibold flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {isCreatingPassword ? (
                <button 
                  onClick={handleVerificationComplete}
                  disabled={isLoading}
                  className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white font-bold py-3.5 px-4 rounded-xl text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer mt-6"
                >
                  {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Selesaikan Pendaftaran'}
                </button>
              ) : (
                <div className="pt-4 border-t border-gray-100 flex flex-col items-center gap-3">
                  <p className="text-xs text-gray-400 text-center">Menunggu Anda melakukan verifikasi via email...</p>
                  <button 
                    onClick={() => { setIsCreatingPassword(true); setPassword(''); setConfirmPassword(''); }}
                    className="text-xs text-brand-primary font-bold hover:underline"
                  >
                    Bypass verifikasi (Mode Sandbox)
                  </button>
                </div>
              )}
            </div>
          )}

"""

content = content.replace("{/* VIEW: FORGOT PASSWORD */}", verify_jsx + "          {/* VIEW: FORGOT PASSWORD */}")

with open('src/components/AuthPage.tsx', 'w') as f:
    f.write(content)
