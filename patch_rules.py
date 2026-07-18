import re
with open('firestore.rules', 'r') as f:
    content = f.read()

# Replace notifications and supportChats rules
old_rules = """    match /notifications/{notifId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }
    
    match /supportChats/{chatId} {
      allow read: if isAuthenticated() && (resource.data.userId == request.auth.uid || isAdmin());
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() && (resource.data.userId == request.auth.uid || isAdmin());
      
      match /messages/{messageId} {
        allow read: if isAuthenticated() && (get(/databases/$(database)/documents/supportChats/$(chatId)).data.userId == request.auth.uid || isAdmin());
        allow create: if isAuthenticated() && (get(/databases/$(database)/documents/supportChats/$(chatId)).data.userId == request.auth.uid || isAdmin());
      }
    }"""

new_rules = """    match /notifications/{document=**} {
      allow read, write: if true;
    }
    
    match /supportChats/{document=**} {
      allow read, write: if true;
    }"""

content = content.replace(old_rules, new_rules)
with open('firestore.rules', 'w') as f:
    f.write(content)
