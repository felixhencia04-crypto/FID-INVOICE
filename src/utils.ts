export function formatCurrency(value: number, currency: string = 'IDR'): string {
  if (currency === 'IDR') {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  } else {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }
}

export function formatDateIndonesian(dateString: string): string {
  if (!dateString) return '-';
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return dateString;
  }
}

export function terbilang(nominal: number, currency: string = 'IDR'): string {
  if (nominal === 0) return currency === 'IDR' ? 'Nol Rupiah' : 'Zero';
  
  const num = Math.floor(Math.abs(nominal));
  
  if (currency !== 'IDR') {
    // English spelling for other currencies
    const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    
    function toEnglish(n: number): string {
      if (n < 20) return ones[n];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 > 0 ? " " + ones[n % 10] : "");
      if (n < 1000) return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 > 0 ? " " + toEnglish(n % 100) : "");
      if (n < 1000000) return toEnglish(Math.floor(n / 1000)) + " Thousand" + (n % 1000 > 0 ? " " + toEnglish(n % 1000) : "");
      if (n < 1000000000) return toEnglish(Math.floor(n / 1000000)) + " Million" + (n % 1000000 > 0 ? " " + toEnglish(n % 1000000) : "");
      return "Amount Too Large";
    }
    
    let englishSpelling = toEnglish(num);
    englishSpelling = englishSpelling.replace(/\s+/g, ' ').trim();
    return englishSpelling + " " + currency;
  }

  const units = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
  
  function konversi(n: number): string {
    if (n < 12) {
      return units[n];
    } else if (n < 20) {
      return konversi(n - 10) + " Belas";
    } else if (n < 100) {
      const puluh = Math.floor(n / 10);
      const sisa = n % 10;
      return (puluh === 1 ? "Sepuluh" : units[puluh] + " Puluh") + (sisa > 0 ? " " + konversi(sisa) : "");
    } else if (n < 200) {
      return "Seratus" + (n % 100 > 0 ? " " + konversi(n % 100) : "");
    } else if (n < 1000) {
      const ratus = Math.floor(n / 100);
      const sisa = n % 100;
      return (ratus === 1 ? "Seratus" : units[ratus] + " Ratus") + (sisa > 0 ? " " + konversi(sisa) : "");
    } else if (n < 2000) {
      return "Seribu" + (n % 1000 > 0 ? " " + konversi(n % 1000) : "");
    } else if (n < 1000000) {
      const ribu = Math.floor(n / 1000);
      const sisa = n % 1000;
      return konversi(ribu) + " Ribu" + (sisa > 0 ? " " + konversi(sisa) : "");
    } else if (n < 1000000000) {
      const juta = Math.floor(n / 1000000);
      const sisa = n % 1000000;
      return konversi(juta) + " Juta" + (sisa > 0 ? " " + konversi(sisa) : "");
    } else if (n < 1000000000000) {
      const milyar = Math.floor(n / 1000000000);
      const sisa = n % 1000000000;
      return konversi(milyar) + " Milyar" + (sisa > 0 ? " " + konversi(sisa) : "");
    } else {
      return "Jumlah Sangat Besar";
    }
  }
  
  let hasil = konversi(num);
  hasil = hasil.replace(/\s+/g, ' ').trim();
  // Capitalize first letter of each word
  hasil = hasil.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  
  return hasil + " Rupiah";
}

export function calculateDueDate(dateString: string, netDays: number): string {
  const date = new Date(dateString);
  date.setDate(date.getDate() + netDays);
  return date.toISOString().split('T')[0];
}

export function generateRandomId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function resizeAndCompressImage(base64Str: string, maxWidth: number = 400, maxHeight: number = 400, quality: number = 0.7): Promise<string> {
  return new Promise((resolve) => {
    if (!base64Str || !base64Str.startsWith('data:image/')) {
      resolve(base64Str);
      return;
    }

    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Keep aspect ratio
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64Str);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      
      // Use JPEG for general photo compression, or PNG if specified
      const isPng = base64Str.includes('image/png') && base64Str.length < 500000; // Only use PNG for smaller images
      const mimeType = isPng ? 'image/png' : 'image/jpeg';
      
      const resultBase64 = canvas.toDataURL(mimeType, isPng ? undefined : quality);
      resolve(resultBase64);
    };

    img.onerror = () => {
      resolve(base64Str);
    };
  });
}
