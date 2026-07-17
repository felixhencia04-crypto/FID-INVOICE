import re
with open('src/components/AuthPage.tsx', 'r') as f:
    content = f.read()

content = content.replace("email.toLowerCase().trim() === 'felix.hencia04@gmail.com' || email.toLowerCase().trim() === 'admin@fidinvoice.com'", "email.toLowerCase().trim() === 'admin@fidinvoice.com'")

with open('src/components/AuthPage.tsx', 'w') as f:
    f.write(content)
