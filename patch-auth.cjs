const fs = require('fs');

let code = fs.readFileSync('src/components/AuthPage.tsx', 'utf8');

// Inject imports
const importFirebase = `import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';`;

code = code.replace(`import { UserProfile } from '../types';`, `${importFirebase}\nimport { UserProfile } from '../types';`);

// Replace handleGooglePromptSubmit
const googleAuthFn = `
  const handleGoogleAuth = async () => {
    try {
      setIsLoading(true);
      setErrorMsg('');
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Auto-generate user profile based on Google account
      const fullName = user.displayName || 'Google User';
      const email = user.email || '';
      const photoUrl = user.photoURL || '';
      
      // Check if user exists or register them
      // In this local state based app, we just simulate successful login and pass the profile back
      // Since it's a real Google login, we'll format a UserProfile and return it
      
      const userProfile: UserProfile = {
        id: user.uid,
        email: email,
        fullName: fullName,
        businessName: \`Bisnis \${fullName}\`,
        phone: user.phoneNumber || '',
        avatar: photoUrl,
        plan: selectedPlan,
        isAdmin: false
      };
      
      // Call standard auth success
      onAuthSuccess(userProfile);
    } catch (error: any) {
      console.error("Google Auth Error:", error);
      setErrorMsg('Gagal masuk dengan Google: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };
`;

code = code.replace(/const handleGooglePromptSubmit = \(e: React\.FormEvent\) => \{[\s\S]*?\};\n/m, googleAuthFn);

// Replace button onClick handlers
code = code.replace(/onClick=\{\(\) => \{\s*setGoogleEmail\(''\);\s*setGooglePromptError\(''\);\s*setShowGooglePrompt\(true\);\s*\}\}/g, `onClick={handleGoogleAuth}`);

// Remove the AnimatePresence modal
const modalStart = `<AnimatePresence>
            {showGooglePrompt && (`;
const modalEnd = `          </AnimatePresence>`;
const modalRegex = new RegExp(`<AnimatePresence>\\s*\\{showGooglePrompt && \\([\\s\\S]*?<\\/AnimatePresence>`, 'g');
code = code.replace(modalRegex, '');

fs.writeFileSync('src/components/AuthPage.tsx', code);
console.log('Patched AuthPage.tsx successfully.');
