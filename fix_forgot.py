import re
with open('src/components/AuthPage.tsx', 'r') as f:
    content = f.read()

# Remove the reset simulator from the UI entirely
content = re.sub(r'\{showForgotSimulator &&.*?(?=\{/\* GOOGLE EMAIL PROMPT MODAL \*/\})', '', content, flags=re.DOTALL)

with open('src/components/AuthPage.tsx', 'w') as f:
    f.write(content)
