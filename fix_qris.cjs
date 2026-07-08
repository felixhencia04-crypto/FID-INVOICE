const fs = require('fs');

let content = fs.readFileSync('src/components/QrisPaymentBox.tsx', 'utf8');

// Replace the handlePay logic
content = content.replace(
  /const data = await response\.json\(\);\s*const token = data\.token;[\s\S]*?\} catch \(err: any\) \{/m,
  `const data = await response.json();
      const paymentUrl = data.paymentUrl;
      const sOrderId = data.orderId;

      if (!paymentUrl) {
        throw new Error('Gagal mendapatkan link pembayaran Checkout Doku. Harap periksa Client ID dan Secret Key.');
      }

      // Record pending payment in localStorage so we can track it when returning
      const activeSessionStr = localStorage.getItem('fid_invoice_active_session');
      const activeUser = activeSessionStr ? JSON.parse(activeSessionStr) : null;
      const paymentId = sOrderId || 'pay_' + Date.now();
      
      const pendingPayment = {
        id: paymentId,
        userId: activeUser?.id || 'guest',
        userEmail: activeUser?.email || 'guest@example.com',
        fullName: activeUser?.fullName || 'Tamu / Tamu Penilai',
        businessName: activeUser?.businessName || 'Bisnis Tamu',
        plan: planName.toLowerCase(),
        amount: amount,
        timestamp: new Date().toISOString(),
        status: 'pending',
        transferMethod: 'Doku Checkout'
      };

      const existingPayments = JSON.parse(localStorage.getItem('fid_invoice_pending_payments') || '[]');
      existingPayments.push(pendingPayment);
      localStorage.setItem('fid_invoice_pending_payments', JSON.stringify(existingPayments));

      // Redirect to Doku Checkout
      window.location.href = paymentUrl;

    } catch (err: any) {`
);

fs.writeFileSync('src/components/QrisPaymentBox.tsx', content);
console.log('Fixed QrisPaymentBox');
