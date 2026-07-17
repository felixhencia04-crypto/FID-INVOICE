import re
with open('src/components/SubscriptionPage.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    '<span className="text-gray-500">Penerbitan Invoice Keseluruhan</span>',
    '<span className="text-gray-500">{user.subscription.plan === \'starter\' ? \'Penerbitan Invoice (Bulan Ini)\' : \'Penerbitan Invoice Keseluruhan\'}</span>'
)

with open('src/components/SubscriptionPage.tsx', 'w') as f:
    f.write(content)
