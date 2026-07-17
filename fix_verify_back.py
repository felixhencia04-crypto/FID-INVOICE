import re
with open('src/components/AuthPage.tsx', 'r') as f:
    content = f.read()

old_block = """                <button 
                  onClick={handleVerificationComplete}
                  disabled={isLoading}
                  className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white font-bold py-3.5 px-4 rounded-xl text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer mt-6"
                >
                  {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Selesaikan Pendaftaran'}
                </button>
              ) : ("""

new_block = """                <div className="flex flex-col gap-3 mt-6">
                  <button 
                    onClick={handleVerificationComplete}
                    disabled={isLoading}
                    className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white font-bold py-3.5 px-4 rounded-xl text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Selesaikan Pendaftaran'}
                  </button>
                  <button 
                    onClick={() => setView('login')}
                    className="text-xs text-brand-primary font-bold hover:underline py-2"
                  >
                    Kembali ke halaman Login
                  </button>
                </div>
              ) : ("""

content = content.replace(old_block, new_block)

with open('src/components/AuthPage.tsx', 'w') as f:
    f.write(content)
