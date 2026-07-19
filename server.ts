import crypto from 'crypto';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import fs from 'fs';
import { Resend } from 'resend';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Payments persistent storage setup
const PAYMENTS_FILE = path.join(process.cwd(), 'payments-db.json');

// Users & credentials persistent storage setup
const USERS_FILE = path.join(process.cwd(), 'users-db.json');
const CREDENTIALS_FILE = path.join(process.cwd(), 'credentials-db.json');

// Config persistent storage setup
const CONFIG_FILE = path.join(process.cwd(), 'config-db.json');

function loadConfig(): any {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    }
  } catch (err) {}
  return { resendApiKey: '', resendSender: 'admin@fidinvoice.id' };
}

function saveConfig(config: any) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

function loadUsers(): any[] {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('[DB Error] Failed to read users file:', err);
  }
  return [];
}

function saveUsers(users: any[]) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
  } catch (err) {
    console.error('[DB Error] Failed to write users file:', err);
  }
}

function loadCredentials(): Record<string, string> {
  try {
    if (fs.existsSync(CREDENTIALS_FILE)) {
      const data = fs.readFileSync(CREDENTIALS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('[DB Error] Failed to read credentials file:', err);
  }
  return {
    'felix.hencia04@gmail.com': 'admin123',
    'admin@fidinvoice.com': 'admin123',
    'demo@fidinvoice.com': 'demo123'
  };
}

function saveCredentials(credentials: Record<string, string>) {
  try {
    fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(credentials, null, 2), 'utf8');
  } catch (err) {
    console.error('[DB Error] Failed to write credentials file:', err);
  }
}

interface TransactionRecord {
  orderId: string;
  userId: string;
  userEmail: string;
  fullName: string;
  planName: string;
  amount: number;
  isYearly: boolean;
  status: 'pending' | 'confirmed' | 'applied' | 'rejected';
  paymentType?: string;
  timestamp: string;
  senderBank?: string;
}

function loadPayments(): Record<string, TransactionRecord> {
  try {
    if (fs.existsSync(PAYMENTS_FILE)) {
      const data = fs.readFileSync(PAYMENTS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('[DB Error] Failed to read payments file:', err);
  }
  return {};
}

function savePayments(payments: Record<string, TransactionRecord>) {
  try {
    fs.writeFileSync(PAYMENTS_FILE, JSON.stringify(payments, null, 2), 'utf8');
  } catch (err) {
    console.error('[DB Error] Failed to write payments file:', err);
  }
}

// Doku configuration
const CLIENT_ID = process.env.DOKU_CLIENT_ID || 'BRN-0229-1783394866076';
const CLIENT_KEY = process.env.DOKU_CLIENT_KEY || 'Mid-client-pN4rpM9vXVwAT8JP';
const SECRET_KEY = process.env.DOKU_SECRET_KEY || 'SK-c1pC2u9lDrwLpYdVz05v';

// Reusable helper function to fetch latest transaction status from Doku and sync server state
async function syncTransactionWithDoku(orderId: string, customPayload?: { userId?: string; userEmail?: string; fullName?: string }): Promise<TransactionRecord | null> {
  const payments = loadPayments();
  let tx = payments[orderId];
  if (!tx) return null;
  return tx;
}

// Auto-apply subscription server-side (mutates tx object in-place)
function applySubscriptionOnServer(tx: TransactionRecord) {
  try {
    if (tx.status !== 'confirmed') return;

    // Skip applying for guests
    if (!tx.userId || tx.userId === 'guest') {
      console.log(`[Server Subscription Auto-Apply] Skipping guest transaction: ${tx.orderId}`);
      return;
    }

    const users = loadUsers();
    const userIdx = users.findIndex(u => u.id === tx.userId);

    if (userIdx > -1) {
      const isYearly = !!tx.isYearly;
      const extendDaysVal = isYearly ? 365 : 30;
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + extendDaysVal);

      let cleanPlan: 'starter' | 'professional' | 'enterprise' = 'professional';
      if (tx.planName?.toLowerCase().includes('enterprise')) {
        cleanPlan = 'enterprise';
      } else if (tx.planName?.toLowerCase().includes('starter')) {
        cleanPlan = 'starter';
      }

      users[userIdx] = {
        ...users[userIdx],
        subscription: {
          ...users[userIdx].subscription,
          status: 'active',
          plan: cleanPlan,
          expiryDate: futureDate.toISOString().split('T')[0],
          trialDaysRemaining: 0,
          billingCycle: isYearly ? 'yearly' : 'monthly'
        }
      };

      saveUsers(users);
      console.log(`[Server Subscription Auto-Apply] Successfully upgraded user ${users[userIdx].email} to ${cleanPlan.toUpperCase()} (${isYearly ? 'Yearly' : 'Monthly'})`);

      // We do NOT mutate the status to 'applied' here anymore. 
      // Instead, we keep it as 'confirmed' so the user client-side verifier can detect it,
      // show the toast/notification, and then call /api/doku/mark-applied to set it to 'applied'.
    } else {
      console.log(`[Server Subscription Auto-Apply Error] User ID ${tx.userId} not found for transaction: ${tx.orderId}`);
    }
  } catch (err) {
    console.error('[Server Subscription Auto-Apply Error] Failed to apply subscription:', err);
  }
}

// API health endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    doku: { status: 'removed' }
  });
});


app.post('/api/payment/manual', async (req, res) => {
  try {
    const { amount, planName, userId, userEmail, fullName, isYearly, selectedBank } = req.body;

    if (!amount || !planName) {
      return res.status(400).json({ error: 'Amount and Plan Name are required' });
    }

    const orderId = `FID-${planName.toUpperCase().substring(0, 3)}-${Date.now()}`;

    console.log(`[Manual Payment] Creating pending manual order: ${orderId}, Amount: ${amount}`);

    // Persist pending transaction on server
    const payments = loadPayments();
    payments[orderId] = {
      orderId,
      userId: userId || 'guest',
      userEmail: userEmail || 'customer@example.com',
      fullName: fullName || 'Pelanggan',
      planName: planName,
      amount: Number(amount),
      isYearly: !!isYearly || planName.toLowerCase().includes('yearly'),
      status: 'pending',
      timestamp: new Date().toISOString(),
      paymentType: `Transfer ${selectedBank || 'Manual'}`, senderBank: selectedBank || 'BCA'
    };
    savePayments(payments);

    res.json({ orderId });
  } catch (err) {
    console.error('[Server Error] Manual payment generation failed:', err);
    res.status(500).json({ error: 'Failed to generate manual payment order', details: err.message });
  }
});


// Endpoint for client to check if they have confirmed payments
app.get('/api/doku/check-pending/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const payments = loadPayments();
    
    // Auto-sync any pending payments for this user
    const pendingUserOrderIds = Object.keys(payments).filter(orderId => {
      const tx = payments[orderId];
      return tx.userId === userId && tx.status === 'pending';
    });

    if (pendingUserOrderIds.length > 0) {
      console.log(`[Auto Sync Client] Checking ${pendingUserOrderIds.length} pending payments for userId: ${userId}`);
      await Promise.all(pendingUserOrderIds.map(orderId => syncTransactionWithDoku(orderId).catch(err => {
        console.error(`[Auto Sync Client Error] Failed to sync ${orderId}:`, err);
      })));
    }

    const updatedPayments = loadPayments();
    const confirmedList = Object.values(updatedPayments).filter(
      (tx) => tx.userId === userId && tx.status === 'confirmed'
    );

    return res.json({ confirmed: confirmedList });
  } catch (error: any) {
    console.error('[Server Error] Check pending failed:', error);
    return res.status(500).json({ error: 'Failed to retrieve transactions' });
  }
});

// Endpoint to mark a confirmed payment as applied
app.post('/api/doku/mark-applied', (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ error: 'orderId is required' });
    }

    const payments = loadPayments();
    if (payments[orderId]) {
      payments[orderId].status = 'applied';
      savePayments(payments);
      console.log(`[Server DB] Transaction ${orderId} successfully marked as applied.`);
      return res.json({ success: true });
    }

    return res.status(404).json({ error: 'Transaction not found' });
  } catch (error: any) {
    console.error('[Server Error] Mark applied failed:', error);
    return res.status(500).json({ error: 'Failed to update transaction status' });
  }
});




// --- NOTIFICATIONS ENDPOINTS ---
const NOTIFICATIONS_FILE = path.join(process.cwd(), 'notifications-db.json');

function loadNotifications() {
  try {
    if (fs.existsSync(NOTIFICATIONS_FILE)) {
      return JSON.parse(fs.readFileSync(NOTIFICATIONS_FILE, 'utf8'));
    }
  } catch (err) {
    console.error('[Server Error] Failed to read notifications:', err);
  }
  return [];
}

function saveNotifications(data) {
  try {
    fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('[Server Error] Failed to write notifications:', err);
  }
}

app.get('/api/notifications', (req, res) => {
  const data = loadNotifications();
  return res.json({ success: true, notifications: data });
});

app.post('/api/notifications', (req, res) => {
  const { notifications } = req.body;
  
  if (Array.isArray(notifications)) {
    const serverNotifs = loadNotifications();
    const existingIds = new Set(serverNotifs.map(n => n.id));
    
    let updated = false;
    notifications.forEach(n => {
      const idx = serverNotifs.findIndex(sn => sn.id === n.id);
      if (idx > -1) {
        // Merge dismissedBy array
        const mergedDismissedBy = Array.from(new Set([...(serverNotifs[idx].dismissedBy || []), ...(n.dismissedBy || [])]));
        if (serverNotifs[idx].dismissedBy?.length !== mergedDismissedBy.length) {
          serverNotifs[idx].dismissedBy = mergedDismissedBy;
          updated = true;
        }
      } else {
        serverNotifs.push(n);
        updated = true;
      }
    });

    if (updated) {
      serverNotifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      saveNotifications(serverNotifs);
    }
    return res.json({ success: true, notifications: serverNotifs });
  }
  
  return res.status(400).json({ error: 'Invalid notifications data' });
});

// --- CHAT ENDPOINTS ---
const CHATS_FILE = path.join(process.cwd(), 'chats-db.json');

function loadChats() {
  try {
    if (fs.existsSync(CHATS_FILE)) {
      return JSON.parse(fs.readFileSync(CHATS_FILE, 'utf8'));
    }
  } catch (err) {
    console.error('[Server Error] Failed to read chats:', err);
  }
  return { threads: [], messages: {} };
}

function saveChats(data) {
  try {
    fs.writeFileSync(CHATS_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('[Server Error] Failed to write chats:', err);
  }
}

app.get('/api/chats', (req, res) => {
  const data = loadChats();
  return res.json({ success: true, threads: data.threads });
});

app.get('/api/chats/:id', (req, res) => {
  const data = loadChats();
  const threadId = req.params.id;
  return res.json({ success: true, messages: data.messages[threadId] || [] });
});

app.post('/api/chats/sync', (req, res) => {
  const { threads, messages } = req.body;
  const data = loadChats();
  
  // Merge threads
  if (threads && Array.isArray(threads)) {
    threads.forEach(t => {
      const threadId = t.userId || t.id;
      const idx = data.threads.findIndex(dt => (dt.userId === threadId) || (dt.id === threadId));
      if (idx > -1) {
        if (new Date(t.lastUpdated).getTime() > new Date(data.threads[idx].lastUpdated).getTime()) {
          data.threads[idx] = t;
        }
      } else {
        data.threads.push(t);
      }
    });
  }

  // Merge messages
  if (messages && typeof messages === 'object') {
    Object.keys(messages).forEach(threadId => {
      if (!data.messages[threadId]) {
        data.messages[threadId] = messages[threadId];
      } else {
        // Append new messages
        const existingIds = new Set(data.messages[threadId].map(m => m.id));
        messages[threadId].forEach(m => {
          if (!existingIds.has(m.id)) {
            data.messages[threadId].push(m);
          }
        });
        // Sort by timestamp
        data.messages[threadId].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      }
    });
  }

  saveChats(data);
  return res.json({ success: true, threads: data.threads, messages: data.messages });
});

// Post a single message
app.post('/api/chats/:id/message', (req, res) => {
  const threadId = req.params.id;
  const { message, messages, threadMeta } = req.body;
  const data = loadChats();
  
  if (!data.messages[threadId]) {
    data.messages[threadId] = [];
  }
  
  if (messages && Array.isArray(messages)) {
    messages.forEach(msg => {
      if (!data.messages[threadId].some(m => m.id === msg.id)) {
        data.messages[threadId].push(msg);
      }
    });
  }
  
  if (message && !data.messages[threadId].some(m => m.id === message.id)) {
    data.messages[threadId].push(message);
  }
  
  // Sort messages
  data.messages[threadId].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime() || 0);

  if (threadMeta) {
    const tIdx = data.threads.findIndex(t => (t.userId === threadId) || (t.id === threadId));
    if (tIdx > -1) {
      data.threads[tIdx] = { ...data.threads[tIdx], ...threadMeta, lastUpdated: new Date().toISOString() };
    } else {
      data.threads.push({ ...threadMeta, userId: threadId, lastUpdated: new Date().toISOString() });
    }
  }

  saveChats(data);
  return res.json({ success: true, messages: data.messages[threadId] });
});
// --- ADMIN CONFIG ENDPOINTS ---
app.get('/api/admin/config', (req, res) => {
  try {
    let config = {};
    if (fs.existsSync(CONFIG_FILE)) {
      config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    }
    return res.json({ success: true, config });
  } catch (err) {
    console.error('[Server Error] Failed to read config:', err);
    return res.status(500).json({ error: 'Failed to read config' });
  }
});

app.post('/api/admin/config', (req, res) => {
  try {
    let config = {};
    if (fs.existsSync(CONFIG_FILE)) {
      config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    }
    const newConfig = { ...config, ...req.body };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(newConfig, null, 2));
    return res.json({ success: true });
  } catch (err) {
    console.error('[Server Error] Failed to save config:', err);
    return res.status(500).json({ error: 'Failed to save config' });
  }
});

// --- USER DATABASE ENDPOINTS ---

// Get all users from users-db.json
app.get('/api/users', (req, res) => {
  try {
    const users = loadUsers();
    return res.json({ success: true, users });
  } catch (err) {
    console.error('[Server Error] Failed to load users:', err);
    return res.status(500).json({ error: 'Failed to load users' });
  }
});

// Sync a single user profile
app.post('/api/users/sync', (req, res) => {
  try {
    const { user } = req.body;
    if (!user || !user.id) {
      return res.status(400).json({ error: 'user with id is required' });
    }
    const users = loadUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx > -1) {
      users[idx] = { ...users[idx], ...user };
    } else {
      users.push(user);
    }
    saveUsers(users);
    console.log(`[Server DB Sync] User ${user.email} (${user.id}) synchronized.`);
    return res.json({ success: true, user });
  } catch (err) {
    console.error('[Server Error] Failed to sync user:', err);
    return res.status(500).json({ error: 'Failed to sync user' });
  }
});

// Sync/Merge multiple users (from Admin Panel or App startup)
app.post('/api/users/sync-all', (req, res) => {
  try {
    const { users, overwrite } = req.body;
    if (!Array.isArray(users)) {
      return res.status(400).json({ error: 'users array is required' });
    }
    
    if (overwrite === true) {
      saveUsers(users);
      console.log(`[Server DB Sync] Bulk-overwritten database with ${users.length} users.`);
      return res.json({ success: true, count: users.length });
    }

    const currentUsers = loadUsers();
    const mergedUsers = [...currentUsers];
    users.forEach((u: any) => {
      const idx = mergedUsers.findIndex((item: any) => item.id === u.id);
      if (idx > -1) {
        mergedUsers[idx] = { ...mergedUsers[idx], ...u };
      } else {
        mergedUsers.push(u);
      }
    });
    saveUsers(mergedUsers);
    console.log(`[Server DB Sync] Bulk-synchronized ${users.length} users. Total in database: ${mergedUsers.length}`);
    return res.json({ success: true, count: mergedUsers.length });
  } catch (err) {
    console.error('[Server Error] Failed to sync all users:', err);
    return res.status(500).json({ error: 'Failed to sync all users' });
  }
});

// Delete a user from users-db.json
app.delete('/api/users/delete/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    const users = loadUsers();
    const targetUser = users.find(u => u.id === userId);
    
    // Also delete user credentials to prevent orphan/re-authenticating
    if (targetUser && targetUser.email) {
      const lowerEmail = targetUser.email.toLowerCase().trim();
      const credentials = loadCredentials();
      if (lowerEmail in credentials) {
        delete credentials[lowerEmail];
        saveCredentials(credentials);
        console.log(`[Server DB Delete] Credentials for ${lowerEmail} deleted.`);
      }
    }

    const filtered = users.filter(u => u.id !== userId);
    saveUsers(filtered);
    console.log(`[Server DB Delete] User ID ${userId} deleted.`);
    return res.json({ success: true });
  } catch (err) {
    console.error('[Server Error] Failed to delete user:', err);
    return res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get credentials mapping
app.get('/api/credentials', (req, res) => {
  try {
    return res.json({ success: true, credentials: loadCredentials() });
  } catch (err) {
    console.error('[Server Error] Failed to load credentials:', err);
    return res.status(500).json({ error: 'Failed to load credentials' });
  }
});

// Sync credentials mapping
app.post('/api/credentials/sync', (req, res) => {
  try {
    const { credentials } = req.body;
    if (!credentials) {
      return res.status(400).json({ error: 'credentials object is required' });
    }
    const current = loadCredentials();
    const updated = { ...current, ...credentials };
    saveCredentials(updated);
    console.log(`[Server Credentials Sync] Credentials database updated.`);
    return res.json({ success: true, credentials: updated });
  } catch (err) {
    console.error('[Server Error] Failed to sync credentials:', err);
    return res.status(500).json({ error: 'Failed to sync credentials' });
  }
});

// Endpoint for admin to manually approve a payment on the server
app.post('/api/doku/admin-approve', (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ error: 'orderId is required' });
    }

    const payments = loadPayments();
    const tx = payments[orderId];
    if (tx) {
      tx.status = 'confirmed';
      applySubscriptionOnServer(tx);
      savePayments(payments);
      console.log(`[Admin Server ACC] Transaction ${orderId} manually approved and applied by Admin.`);
      return res.json({ success: true, transaction: tx });
    }

    return res.status(404).json({ error: 'Transaction not found' });
  } catch (error: any) {
    console.error('[Server Error] Admin approve failed:', error);
    return res.status(500).json({ error: 'Failed to approve transaction' });
  }
});

// Endpoint for admin to manually reject a payment on the server
app.post('/api/doku/admin-reject', (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ error: 'orderId is required' });
    }

    const payments = loadPayments();
    if (payments[orderId]) {
      payments[orderId].status = 'rejected';
      savePayments(payments);
      console.log(`[Admin Server Reject] Transaction ${orderId} manually rejected by Admin.`);
      return res.json({ success: true, transaction: payments[orderId] });
    }

    return res.status(404).json({ error: 'Transaction not found' });
  } catch (error: any) {
    console.error('[Server Error] Admin reject failed:', error);
    return res.status(500).json({ error: 'Failed to reject transaction' });
  }
});

// Endpoint for admin to delete any payment on the server permanently
app.delete('/api/doku/delete/:orderId', (req, res) => {
  try {
    const { orderId } = req.params;
    if (!orderId) {
      return res.status(400).json({ error: 'orderId is required' });
    }

    const payments = loadPayments();
    if (payments[orderId]) {
      delete payments[orderId];
      savePayments(payments);
      console.log(`[Admin Server Delete] Transaction ${orderId} permanently deleted by Admin.`);
      return res.json({ success: true });
    }

    return res.status(404).json({ error: 'Transaction not found' });
  } catch (error: any) {
    console.error('[Server Error] Admin delete failed:', error);
    return res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

// Endpoint to fetch full payment history for a user
app.get('/api/payments/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    const payments = loadPayments();
    const history = Object.values(payments)
      .filter((tx) => tx.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return res.json({ history });
  } catch (error) {
    console.error('[Server Error] Fetch history failed:', error);
    return res.status(500).json({ error: 'Failed to fetch transaction history' });
  }
});

app.get('/api/doku/history/:userId', async (req, res) => {
  // Compatibility alias
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    const payments = loadPayments();
    const history = Object.values(payments)
      .filter((tx) => tx.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return res.json({ history });
  } catch (error) {
    return res.status(500).json({ error: 'Failed' });
  }
});

// Endpoint to retrieve all transactions for application owner (admin panel)
// API endpoints for global config
app.get('/api/config/email', (req, res) => {
  res.json(loadConfig());
});

app.post('/api/config/email', (req, res) => {
  const { resendApiKey, resendSender } = req.body;
  const config = loadConfig();
  if (resendApiKey !== undefined) config.resendApiKey = resendApiKey;
  if (resendSender !== undefined) config.resendSender = resendSender;
  saveConfig(config);
  res.json({ success: true });
});

app.post('/api/send-email', async (req, res) => {
  try {
    let { apiKey, from, to, subject, html } = req.body;
    
    // Auto fallback to server config if not provided
    const config = loadConfig();
    if (!apiKey && config.resendApiKey) apiKey = config.resendApiKey;
    if (!apiKey && process.env.RESEND_API_KEY) apiKey = process.env.RESEND_API_KEY;
    if (!from && config.resendSender) from = config.resendSender;
    if (!from && process.env.RESEND_SENDER_EMAIL) from = process.env.RESEND_SENDER_EMAIL;
    if (from && !from.includes('<')) {
      from = `FID INVOICE <${from}>`;
    }

    const maskedKey = apiKey ? `${apiKey.substring(0, 7)}...${apiKey.substring(apiKey.length - 4)}` : 'MISSING';
    console.log(`[Server] /api/send-email called with from: ${from}, to: ${to}, apiKey: ${maskedKey}`);
    if (!apiKey || !from || !to || !subject || !html) {
      console.log('[Server] /api/send-email missing params');
      return res.status(400).json({ message: 'Sistem belum dikonfigurasi sepenuhnya. Pemilik aplikasi harus menambahkan RESEND_API_KEY di pengaturan Environment Variables AI Studio agar email dapat dikirim.' });
    }

    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      reply_to: req.body.replyTo || from,
    });

    if (error) {
      console.error('[Server] Resend SDK Error:', error);
      if (error.message === 'API key is invalid') {
        return res.status(400).json({ message: 'API Key Resend tidak valid atau salah. Pastikan Anda menyalin key yang benar dari dashboard Resend (dimulai dengan re_).' });
      }
      return res.status(400).json(error);
    }

    console.log('[Server] Resend SDK responded successfully:', data);
    return res.status(200).json(data);
  } catch (error: any) {
    console.error('[Server Error] Resend proxy failed:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

app.get('/api/doku/all-payments', async (req, res) => {
  try {
    const payments = loadPayments();
    const allList = Object.values(payments).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    return res.json({ success: true, payments: allList });
  } catch (error) {
    console.error('[Server Error] Fetch all payments failed:', error);
    return res.status(500).json({ error: 'Failed to retrieve all payments' });
  }
});

// Start the server (mounting Vite middleware in development)
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }



app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] running on http://localhost:${PORT}`);
  });
}

startServer();
