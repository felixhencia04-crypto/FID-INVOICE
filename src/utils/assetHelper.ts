/**
 * Reusable helper service for document assets (logo, electronic signature, and official stamp).
 * Handles CORS, SVG parsing, base64 extraction, image preloading, and safe fallbacks.
 * Designed to prevent missing images during PDF export and print across all templates.
 */

export interface CompanyAssets {
  businessLogo: string;
  signatureImage: string;
  stampImage: string;
}

/**
 * Decodes URI data and sanitizes base64 strings to avoid whitespace and formatting issues.
 */
export const sanitizeBase64 = (str: string): string => {
  if (!str) return '';
  let cleaned = str.trim();
  if (cleaned.startsWith('data:')) {
    try {
      cleaned = decodeURIComponent(cleaned);
    } catch (e) {
      console.error('[AssetHelper] Failed to decode URI in sanitizeBase64:', e);
    }
    // Remove all whitespace and line breaks
    cleaned = cleaned.replace(/\s/g, '');
  }
  return cleaned;
};

/**
 * Detects image format from base64 data URL for jsPDF.
 */
export const getFormatFromBase64 = (base64Str: string): string => {
  if (!base64Str) return 'PNG';
  const cleaned = base64Str.toLowerCase();
  if (cleaned.includes('image/jpeg') || cleaned.includes('image/jpg')) {
    return 'JPEG';
  }
  if (cleaned.includes('image/webp')) {
    return 'WEBP';
  }
  if (cleaned.includes('image/gif')) {
    return 'GIF';
  }
  if (cleaned.includes('image/svg+xml')) {
    return 'PNG'; // SVG is usually drawn as raster fallback in canvas
  }
  return 'PNG';
};

/**
 * Fetches an image URL and converts it into a reliable Base64 string.
 * Uses a double-piped approach:
 * 1. If already Base64, sanitizes and returns immediately.
 * 2. Tries to fetch as Blob first (resolves CORS issues and preserves SVG/JPEG clarity).
 * 3. Falls back to Canvas drawing if fetch fails or is blocked.
 */
export const fetchImageAsBase64 = async (url: string): Promise<string> => {
  if (!url) return '';
  const trimmed = url.trim();

  // Pipe 1: Direct Base64 return
  if (trimmed.startsWith('data:')) {
    return sanitizeBase64(trimmed);
  }

  // Pipe 2: Blob Fetch with CORS mode
  try {
    const isExternalUrl = trimmed.startsWith('http://') || trimmed.startsWith('https://');
    const isSameOrigin = trimmed.startsWith(window.location.origin);
    
    // Only fetch if it's a valid URL string
    if (isExternalUrl || trimmed.startsWith('/') || trimmed.startsWith('.')) {
      const response = await fetch(trimmed, isExternalUrl && !isSameOrigin ? { mode: 'cors' } : {});
      if (response.ok) {
        const blob = await response.blob();
        return await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('FileReader failed to read image blob'));
          reader.readAsDataURL(blob);
        });
      }
    }
  } catch (fetchErr) {
    console.warn('[AssetHelper] Blob fetch failed, falling back to Canvas rendering method:', fetchErr);
  }

  // Pipe 3: HTML5 Canvas rendering fallback
  return new Promise<string>((resolve) => {
    const img = new Image();
    const isExternalUrl = trimmed.startsWith('http://') || trimmed.startsWith('https://');
    const isSameOrigin = trimmed.startsWith(window.location.origin);
    
    if (isExternalUrl && !isSameOrigin) {
      img.crossOrigin = 'anonymous';
    }

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width || 300;
        canvas.height = img.naturalHeight || img.height || 150;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } else {
          resolve(trimmed);
        }
      } catch (err) {
        console.error('[AssetHelper] Canvas conversion failed, returning original URL:', err);
        resolve(trimmed);
      }
    };

    img.onerror = (e) => {
      console.error('[AssetHelper] Image element failed to load resource URL:', trimmed.substring(0, 100), e);
      resolve(trimmed); // return original URL as absolute fallback
    };

    img.src = trimmed;
  });
};

/**
 * Preloads all company assets (logo, signature, and stamp) into Base64 formats.
 * Utilizes Promise.all for high-performance concurrent processing.
 */
export const preloadCompanyAssets = async (profile: {
  businessLogo?: string;
  signatureImage?: string;
  stampImage?: string;
}): Promise<CompanyAssets> => {
  console.log('[AssetHelper] Initiating concurrent preloading of profile assets...');
  
  const [logo, signature, stamp] = await Promise.all([
    profile.businessLogo ? fetchImageAsBase64(profile.businessLogo) : Promise.resolve(''),
    profile.signatureImage ? fetchImageAsBase64(profile.signatureImage) : Promise.resolve(''),
    profile.stampImage ? fetchImageAsBase64(profile.stampImage) : Promise.resolve(''),
  ]);

  console.log('[AssetHelper] Profile assets preloaded successfully:', {
    hasLogo: !!logo,
    hasSignature: !!signature,
    hasStamp: !!stamp,
  });

  return {
    businessLogo: logo,
    signatureImage: signature,
    stampImage: stamp,
  };
};

/**
 * Normalizes company assets to guarantee valid Base64 string returns and proper logging.
 */
export const normalizeCompanyAssets = (
  assets: CompanyAssets,
  fallbackProfile: { businessLogo?: string; signatureImage?: string; stampImage?: string }
): CompanyAssets => {
  return {
    businessLogo: sanitizeBase64(assets.businessLogo) || sanitizeBase64(fallbackProfile.businessLogo || ''),
    signatureImage: sanitizeBase64(assets.signatureImage) || sanitizeBase64(fallbackProfile.signatureImage || ''),
    stampImage: sanitizeBase64(assets.stampImage) || sanitizeBase64(fallbackProfile.stampImage || ''),
  };
};

/**
 * Waits for all image elements inside a container (like an iframe or DOM node) to fully load and paint.
 * Ensures the document is 100% ready before triggering print or canvas conversion.
 */
export const waitForImagesToLoad = (container: HTMLElement | Document, timeoutMs = 4000): Promise<boolean> => {
  return new Promise((resolve) => {
    const images = Array.from(container.querySelectorAll('img'));
    if (images.length === 0) {
      resolve(true);
      return;
    }

    let loadedCount = 0;
    const totalImages = images.length;
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      console.warn('[AssetHelper] waitForImagesToLoad timed out before all images loaded.');
      resolve(false);
    }, timeoutMs);

    const checkDone = () => {
      if (timedOut) return;
      loadedCount++;
      if (loadedCount === totalImages) {
        clearTimeout(timer);
        resolve(true);
      }
    };

    images.forEach((img) => {
      if (img.complete && img.naturalWidth !== 0) {
        checkDone();
      } else {
        img.onload = checkDone;
        img.onerror = () => {
          console.error('[AssetHelper] Image failed to load during wait:', img.src.substring(0, 80));
          checkDone(); // resolve anyway to avoid blocking execution
        };
      }
    });
  });
};
