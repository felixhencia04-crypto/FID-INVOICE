import re
with open('src/App.tsx', 'r') as f:
    content = f.read()

old_auth_success = """  const handleAuthSuccess = async (user: UserProfile) => {
    // Heal incorrectly given lifetime plans
    if (user.subscription.expiryDate === '2099-12-31' && user.email.toLowerCase().trim() !== 'admin@fidinvoice.com') {"""

new_auth_success = """  const handleAuthSuccess = async (user: UserProfile) => {
    // Heal incorrectly given lifetime plans
    const expiryYear = parseInt(user.subscription.expiryDate?.split('-')[0] || '2000');
    if (expiryYear > 2030) {"""

content = content.replace(old_auth_success, new_auth_success)

with open('src/App.tsx', 'w') as f:
    f.write(content)
