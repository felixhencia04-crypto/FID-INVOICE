const fs = require('fs');
let content = fs.readFileSync('src/components/CreateInvoice.tsx', 'utf8');

const stateBlock = `  const [isSubmitting, setIsSubmitting] = useState(false);

  // Preload Assets State
  const [preloadedLogoBase64, setPreloadedLogoBase64] = useState<string>('');
  const [preloadedSignatureBase64, setPreloadedSignatureBase64] = useState<string>('');
  const [preloadedStampBase64, setPreloadedStampBase64] = useState<string>('');
  const [isPreloadingAssets, setIsPreloadingAssets] = useState(true);

  useEffect(() => {
    let active = true;
    const loadImages = async () => {
      console.log('[CreateInvoice] Preloading company assets...');
      try {
        const assets = await preloadCompanyAssets(user);
        if (active) {
          setPreloadedLogoBase64(assets.businessLogo);
          setPreloadedSignatureBase64(assets.signatureImage);
          setPreloadedStampBase64(assets.stampImage);
        }
      } catch (e) {
        console.error('[CreateInvoice] Error preloading profile assets:', e);
      } finally {
        if (active) {
          setIsPreloadingAssets(false);
        }
      }
    };
    loadImages();
    return () => {
      active = false;
    };
  }, [user.businessLogo, user.signatureImage, user.stampImage]);
`;

content = content.replace('  const [isSubmitting, setIsSubmitting] = useState(false);', stateBlock);
content = content.replace(/<img src=\{user\.businessLogo\}/g, '<img src={preloadedLogoBase64 || user.businessLogo}');
content = content.replace(/<img src=\{user\.signatureImage\}/g, '<img src={preloadedSignatureBase64 || user.signatureImage}');
content = content.replace(/<img src=\{user\.stampImage\}/g, '<img src={preloadedStampBase64 || user.stampImage}');

fs.writeFileSync('src/components/CreateInvoice.tsx', content);
