import re
with open('src/components/SubscriptionPage.tsx', 'r') as f:
    content = f.read()

content = content.replace(r"\'Seumur Hidup (Lifetime)\'", "'Seumur Hidup (Lifetime)'")

with open('src/components/SubscriptionPage.tsx', 'w') as f:
    f.write(content)
