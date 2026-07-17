import re
with open('src/components/AuthPage.tsx', 'r') as f:
    content = f.read()

content = re.sub(r'(id: user\.uid,\s*fullName: userData\.name \|\| userData\.fullName \|\| '\''User'\'',\s*businessName: userData\.businessName \|\| '\''Bisnis Anda'\'',\s*email: user\.email \|\| '\'''\'',\s*phone: userData\.phone \|\| '\'''\'',)', r'\1\n          subscription: { plan: selectedPlan, status: "active", expiryDate: "2099-12-31", trialDaysRemaining: 0 },', content)

content = re.sub(r'(id: user\.uid,\s*fullName: '\''Migrated User'\'',\s*businessName: '\''Bisnis Anda'\'',\s*email: user\.email \|\| '\'''\'',\s*phone: '\'''\'',)', r'\1\n          subscription: { plan: selectedPlan, status: "active", expiryDate: "2099-12-31", trialDaysRemaining: 0 },', content)

with open('src/components/AuthPage.tsx', 'w') as f:
    f.write(content)
