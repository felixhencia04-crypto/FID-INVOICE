import re
with open('src/components/AuthPage.tsx', 'r') as f:
    content = f.read()

old_catch = """    } catch (error: any) {
      setIsLoading(false);
      console.error("Firebase Auth Error:", error);
      setErrorMsg('Gagal membuat akun: ' + error.message);
      setErrorType('other');
    }"""

new_catch = """    } catch (error: any) {
      setIsLoading(false);
      console.error("Firebase Auth Error:", error);
      if (error.code === 'auth/email-already-in-use') {
        setErrorMsg('Email ini sudah terdaftar sebelumnya (mungkin melalui Google Login). Silakan kembali ke halaman utama dan pilih Masuk (Login).');
      } else {
        setErrorMsg('Gagal membuat akun: ' + error.message);
      }
      setErrorType('other');
    }"""

content = content.replace(old_catch, new_catch)

with open('src/components/AuthPage.tsx', 'w') as f:
    f.write(content)
