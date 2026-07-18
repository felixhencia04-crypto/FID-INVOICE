import re
with open('src/components/AdminPanel.tsx', 'r') as f:
    content = f.read()

# Add a state for remote admin pass
state_patch = """  const [loginError, setLoginError] = useState('');
  const [remoteAdminPass, setRemoteAdminPass] = useState<string | null>(null);

  // Fetch admin config from server on mount
  useEffect(() => {
    fetch('/api/admin/config')
      .then(res => res.json())
      .then(data => {
        if (data && data.success && data.config && data.config.adminPassObfuscated) {
          setRemoteAdminPass(data.config.adminPassObfuscated);
        }
      })
      .catch(err => console.error("Failed to load admin config:", err));
  }, []);"""

content = content.replace("  const [loginError, setLoginError] = useState('');", state_patch)

# Change onSubmit logic to check remote password instead of local
submit_patch_old = """              // Read custom password from localStorage if set, otherwise fallback to decrypted default
              const customPassObfuscated = localStorage.getItem('fid_invoice_admin_pass');
              const correctPass = customPassObfuscated ? atob(customPassObfuscated) : atob('RmlkSW52b2ljZUFkbWluOTkh'); // "FidInvoiceAdmin99!"

              if (passwordInput === correctPass) {"""

submit_patch_new = """              // Read custom password from server config if set, otherwise check local fallback, else default
              const localCustomPass = localStorage.getItem('fid_invoice_admin_pass');
              const activeObfuscated = remoteAdminPass || localCustomPass;
              const correctPass = activeObfuscated ? atob(activeObfuscated) : atob('RmlkSW52b2ljZUFkbWluOTkh'); // "FidInvoiceAdmin99!"

              if (passwordInput === correctPass) {"""

content = content.replace(submit_patch_old, submit_patch_new)

# Change password update logic
update_patch_old = """                  // Save encrypted Base64 custom pass to localStorage
                  localStorage.setItem('fid_invoice_admin_pass', btoa(newAdminPass));
                  setNotif('Kunci akses pemilik (sandi admin) berhasil diperbarui dan diamankan!');"""

update_patch_new = """                  // Save encrypted Base64 custom pass to localStorage as fallback
                  const obfuscated = btoa(newAdminPass);
                  localStorage.setItem('fid_invoice_admin_pass', obfuscated);
                  setRemoteAdminPass(obfuscated);
                  
                  // Sync to server
                  fetch('/api/admin/config', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ adminPassObfuscated: obfuscated })
                  }).catch(err => console.error('Failed to sync admin pass to server', err));
                  
                  setNotif('Kunci akses pemilik (sandi admin) berhasil diperbarui dan disinkronisasi ke Cloud!');"""

content = content.replace(update_patch_old, update_patch_new)

with open('src/components/AdminPanel.tsx', 'w') as f:
    f.write(content)
