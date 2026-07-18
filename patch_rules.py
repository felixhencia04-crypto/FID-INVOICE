import re
with open('firestore.rules', 'r') as f:
    content = f.read()

rule_add = """    match /supportChats/{chatId} {
"""

rule_new = """    match /notifications/{notifId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }
    
    match /supportChats/{chatId} {
"""

content = content.replace(rule_add, rule_new)

with open('firestore.rules', 'w') as f:
    f.write(content)
