/**
 * FID INVOICE - Resend Transactional Email Service
 * Enables sending real HTML emails to users' inboxes if Resend API Key is set in Owner Panel.
 */

export interface ResendEmailPayload {
  from: string;
  to: string;
  subject: string;
  html: string;
  apiKey?: string;
  replyTo?: string;
}

export const getResendConfig = () => {
  let apiKey = localStorage.getItem('fid_invoice_resend_api_key') || '';
  if (apiKey === 're_A4USDQuQ_Pd19U6MeRHMa82F9ws3oZMUV' || apiKey === 're_dwdDmrFu_JhnanLyHXXxmymXzZYbTG5ne') {
    apiKey = '';
    localStorage.removeItem('fid_invoice_resend_api_key');
  }
  let sender = localStorage.getItem('fid_invoice_resend_sender') || '';
  

  if (!sender || sender === 'onboarding@resend.dev') {
    sender = 'noreply@fidinvoice.id';
    localStorage.setItem('fid_invoice_resend_sender', sender);
  }
  
  return { apiKey: apiKey.trim(), sender: sender.trim() };
};

export const hasResendConfigured = (): boolean => {
  return true; // We now let the server check config and decide.
};

async function dispatchEmail(payload: ResendEmailPayload): Promise<boolean> {
  const { apiKey } = getResendConfig();
  console.log('Dispatching email with API key prefix:', apiKey ? apiKey.substring(0, 6) + '...' : 'EMPTY');
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        ...payload,
        replyTo: payload.replyTo || 'support@fidinvoice.id'
      }), 
    });

    if (response.ok) {
      console.log(`Email successfully dispatched via Resend to ${payload.to}`);
      return true;
    } else {
      const errResponse = await response.json().catch(() => ({}));
      console.error('Resend API Error response:', errResponse);
      const errMsg = errResponse.message || errResponse.error?.message || 'Terjadi kesalahan sistem pada API Resend.';
      throw new Error(errMsg);
    }
  } catch (error: any) {
    console.error('Failed to dispatch email via Resend API:', error);
    throw error;
  }
}

/**
 * Sends a real-world activation verification email using Resend API.
 */
export async function sendVerificationEmail(
  toEmail: string,
  fullName: string,
  selectedPlan: string,
  verifyCode: string
): Promise<boolean> {
  const { sender } = getResendConfig();
  const verifyLink = `${window.location.origin}?action=verify&email=${encodeURIComponent(toEmail)}&code=${verifyCode}`;
  
  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #334155;">
      <div style="text-align: center; margin-bottom: 32px; border-bottom: 1px solid #f1f5f9; padding-bottom: 24px;">
        <h1 style="color: #0f172a; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.025em;">FID <span style="color: #1a4fbf;">INVOICE</span></h1>
        <p style="color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin: 6px 0 0 0;">Solusi Invoice & Billing Cerdas UMKM</p>
      </div>
      
      <div style="font-size: 15px; line-height: 1.6; color: #334155;">
        <p style="font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 0;">Halo ${fullName || 'Rekan Bisnis'},</p>
        <p>Terima kasih telah bergabung di <strong>FID INVOICE</strong>! Akun Anda telah berhasil didaftarkan untuk paket uji coba gratis 3 hari <strong>${selectedPlan.toUpperCase()} Plan</strong>.</p>
        <p>Silakan klik tombol aman di bawah ini untuk <strong>memverifikasi email Anda</strong> dan mengaktifkan seluruh fitur premium dashboard Anda secara instan:</p>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${verifyLink}" style="display: inline-block; background-color: #1a4fbf; color: #ffffff; font-weight: 700; font-size: 14px; padding: 14px 28px; text-decoration: none; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(26, 79, 191, 0.2), 0 2px 4px -1px rgba(26, 79, 191, 0.1); transition: all 0.2s ease;">
            Verifikasi Alamat Email Anda &rarr;
          </a>
        </div>
        
        <p style="font-size: 13px; color: #64748b; background-color: #f8fafc; padding: 12px 16px; border-radius: 8px; border-left: 4px solid #1a4fbf;">
          💡 <strong>Mengapa verifikasi ini wajib?</strong><br/>
          Demi mematuhi regulasi anti-spam dan melindungi kerahasiaan invoice bisnis Anda, semua akun baru wajib memverifikasi kepemilikan email sebelum membuat transaksi keuangan pertama.
        </p>

        <p style="margin-top: 24px;">Jika tombol di atas tidak berfungsi, silakan salin dan tempel link berikut ke browser Anda:</p>
        <p style="word-break: break-all; font-size: 12px; color: #1a4fbf; background-color: #f1f5f9; padding: 10px; border-radius: 6px; font-family: monospace;">${verifyLink}</p>
      </div>

      <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #f1f5f9; text-align: center; font-size: 12px; color: #94a3b8; line-height: 1.5;">
        <p style="margin: 0;">Ini adalah email transaksi otomatis dari sistem FID INVOICE Gateway.</p>
        <p style="margin: 4px 0 0 0;">&copy; 2026 FID INVOICE, PT Sinergi Kreatif Indonesia.</p>
      </div>
    </div>
  `;

  return dispatchEmail({
    from: sender,
    to: toEmail.trim(),
    subject: '📧 Verifikasi Akun Bisnis FID INVOICE Anda',
    html: htmlContent,
  });
}

/**
 * Sends a real-world password recovery email using Resend API.
 */
export async function sendPasswordResetEmail(
  toEmail: string,
  fullName: string,
  resetCode: string
): Promise<boolean> {
  const { sender } = getResendConfig();
  const resetLink = `${window.location.origin}?action=reset&email=${encodeURIComponent(toEmail)}&code=${resetCode}`;
  
  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #334155;">
      <div style="text-align: center; margin-bottom: 32px; border-bottom: 1px solid #f1f5f9; padding-bottom: 24px;">
        <h1 style="color: #0f172a; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.025em;">FID <span style="color: #1a4fbf;">INVOICE</span></h1>
        <p style="color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin: 6px 0 0 0;">Invoice & Billing Cerdas UMKM</p>
      </div>
      
      <div style="font-size: 15px; line-height: 1.6; color: #334155;">
        <p style="font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 0;">Halo ${fullName || 'Rekan Bisnis'},</p>
        <p>Kami menerima permintaan untuk mengatur ulang kata sandi (password) akun Anda di platform <strong>FID INVOICE</strong>.</p>
        <p>Silakan klik tombol aman di bawah ini untuk <strong>mereset kata sandi Anda</strong> dan membuat kata sandi yang baru:</p>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetLink}" style="display: inline-block; background-color: #dc2626; color: #ffffff; font-weight: 700; font-size: 14px; padding: 14px 28px; text-decoration: none; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(220, 38, 38, 0.2), 0 2px 4px -1px rgba(220, 38, 38, 0.1); transition: all 0.2s ease;">
            Atur Ulang Kata Sandi &rarr;
          </a>
        </div>
        
        <p style="font-size: 13px; color: #64748b; background-color: #f8fafc; padding: 12px 16px; border-radius: 8px; border-left: 4px solid #dc2626;">
          ⚠️ <strong>Penting:</strong><br/>
          Link pemulihan ini hanya berlaku selama 1 jam demi alasan keamanan akun Anda. Jika Anda tidak merasa meminta reset kata sandi ini, silakan abaikan email ini dengan aman.
        </p>

        <p style="margin-top: 24px;">Jika tombol di atas tidak berfungsi, silakan salin dan tempel link berikut ke browser Anda:</p>
        <p style="word-break: break-all; font-size: 12px; color: #dc2626; background-color: #f1f5f9; padding: 10px; border-radius: 6px; font-family: monospace;">${resetLink}</p>
      </div>

      <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #f1f5f9; text-align: center; font-size: 12px; color: #94a3b8; line-height: 1.5;">
        <p style="margin: 0;">Pesan pemulihan kata sandi otomatis dari sistem FID INVOICE.</p>
        <p style="margin: 4px 0 0 0;">&copy; 2026 FID INVOICE, PT Sinergi Kreatif Indonesia.</p>
      </div>
    </div>
  `;

  return dispatchEmail({
    from: sender,
    to: toEmail.trim(),
    subject: '🔑 Atur Ulang Kata Sandi Akun FID INVOICE',
    html: htmlContent,
  });
}

export async function sendCustomEmail(payload: ResendEmailPayload): Promise<boolean> {
  return dispatchEmail(payload);
}
