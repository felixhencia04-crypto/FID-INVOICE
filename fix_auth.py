import re
with open('src/components/AuthPage.tsx', 'r') as f:
    content = f.read()

# Fix imports
content = content.replace(
    "import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';",
    "import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail as sendFirebasePasswordResetEmail } from 'firebase/auth';"
)

# Fix handleForgotSubmit
forgot_logic = """  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Email wajib diisi.');
      setErrorType('other');
      return;
    }
    setErrorMsg('');
    setErrorType('none');
    setIsLoading(true);

    try {
      await sendFirebasePasswordResetEmail(auth, email);
      setIsLoading(false);
      setSuccessMsg('Email pemulihan kata sandi berhasil dikirim! Silakan periksa kotak masuk (inbox) atau folder spam Anda.');
      setShowForgotSimulator(false);
    } catch (error: any) {
      console.error("Firebase Password Reset Error:", error);
      setIsLoading(false);
      setErrorMsg('Gagal mengirim email pemulihan. Pastikan email terdaftar atau coba beberapa saat lagi.');
      setErrorType('other');
    }
  };"""

content = re.sub(r'  const handleForgotSubmit = async \(e: React\.FormEvent\) => \{.*?\n  \};\n', forgot_logic + '\n\n', content, flags=re.DOTALL)

with open('src/components/AuthPage.tsx', 'w') as f:
    f.write(content)
