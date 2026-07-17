import re

with open('src/components/AuthPage.tsx', 'r') as f:
    content = f.read()

content = re.sub(r'status: isOwnerEmail \? '\''active'\'' : '\''trial'\'',', r"plan: selectedPlan,\n          status: isOwnerEmail ? 'active' : 'trial',", content)
content = re.sub(r'status: isOwnerEmail \? "active" : "trial",', r"plan: selectedPlan,\n          status: isOwnerEmail ? 'active' : 'trial',", content)

with open('src/components/AuthPage.tsx', 'w') as f:
    f.write(content)

