const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const oldLogic = `  // Client DB handlers
  const handleAddClient = (newClient: Client) => {
    if (!currentUser) return;
    if (isSubscriptionExpired()) {
      setBlockedFeatureMessage('Penambahan Klien Baru');
      return;
    }
    const nextClients = [newClient, ...clients];`;

const newLogic = `  // Client DB handlers
  const handleAddClient = (newClient: Client) => {
    if (!currentUser) return;
    if (isSubscriptionExpired()) {
      setBlockedFeatureMessage('Penambahan Klien Baru');
      return;
    }
    
    if (currentUser.subscription.plan === 'starter' && clients.length >= 1) {
      setBlockedFeatureMessage('Batas Klien (Starter: Max 1)');
      return;
    }
    if (currentUser.subscription.plan === 'professional' && clients.length >= 50) {
      setBlockedFeatureMessage('Batas Klien (Pro: Max 50)');
      return;
    }

    const nextClients = [newClient, ...clients];`;

content = content.replace(oldLogic, newLogic);
fs.writeFileSync('src/App.tsx', content);
console.log('Fixed client limit logic');
