import re
with open('src/components/SubscriptionPage.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    '<h4 className="font-bold text-sm text-brand-dark mt-1">Professional <br/><span className="text-[10px] text-gray-500 font-normal">SaaS Bisnis Lancar</span></h4>',
    '<h4 className="font-bold text-sm text-brand-dark mt-1">Professional <br/><span className="text-[10px] text-gray-500 font-normal">Bisnis Lancar</span></h4>'
)

with open('src/components/SubscriptionPage.tsx', 'w') as f:
    f.write(content)
