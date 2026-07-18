import re
with open('src/components/CallCenterChat.tsx', 'r') as f:
    content = f.read()

import_str = "import { UserProfile } from '../types';"
import_new = "import { UserProfile } from '../types';\nimport { db } from '../lib/firebase';\nimport { collection, doc, getDocs, setDoc, onSnapshot, query, orderBy } from 'firebase/firestore';"
content = content.replace(import_str, import_new)

# Replace polling with onSnapshot
poll_old = """  // Check for admin replies regularly
  useEffect(() => {
    loadChatHistory();

    // Start polling server for real-time customer support chat replies
    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/chats/${userId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.messages.length > 0) {
            const parsed = data.messages;
            setMessages(prev => {
              // Instead of just length, check if the last message IDs are different or length is different
              if (parsed.length !== prev.length || (parsed.length > 0 && prev.length > 0 && parsed[parsed.length - 1].id !== prev[prev.length - 1].id)) {
                // New message arrived
                const lastMsg = parsed[parsed.length - 1];
                if (lastMsg.sender === 'agent' && !isOpen) {
                  setUnreadCount(prevUnread => prevUnread + 1);
                  // Play dynamic notification chime
                  try {
                    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
                    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    gain.gain.setValueAtTime(0.04, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
                    osc.start();
                    osc.stop(ctx.currentTime + 0.35);
                  } catch (e) {}
                }
                return parsed;
              }
              return prev;
            });
          }
        }
      } catch (e) {}
    }, 2000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [userId, isOpen]);"""

poll_new = """  // Use Firestore onSnapshot for real-time customer support chat replies
  useEffect(() => {
    loadChatHistory();

    const q = query(collection(db, 'supportChats', userId, 'messages'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(d => d.data() as ChatMessage);
      msgs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime() || 0); // basic sort
      
      if (msgs.length > 0) {
        setMessages(prev => {
          if (msgs.length !== prev.length || (msgs.length > 0 && prev.length > 0 && msgs[msgs.length - 1].id !== prev[prev.length - 1].id)) {
            const lastMsg = msgs[msgs.length - 1];
            if (lastMsg.sender === 'agent' && !isOpen) {
              setUnreadCount(prevUnread => prevUnread + 1);
              try {
                const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(587.33, ctx.currentTime);
                osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
                osc.connect(gain);
                gain.connect(ctx.destination);
                gain.gain.setValueAtTime(0.04, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
                osc.start();
                osc.stop(ctx.currentTime + 0.35);
              } catch (e) {}
            }
            return msgs;
          }
          return prev;
        });
      }
    });

    return () => unsubscribe();
  }, [userId, isOpen]);"""
content = content.replace(poll_old, poll_new)

# Fix handleSendMessage
send_old = """    // Sync to server
    fetch(`/api/chats/${userId}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: updatedMsgs, threadMeta: threadInfo })
    }).catch(e => console.error(e));

    // Simulate smart AI bot (Fidya) auto-reply"""
send_new = """    // Sync to Firestore
    setDoc(doc(db, 'supportChats', userId), threadInfo).catch(() => {});
    setDoc(doc(db, 'supportChats', userId, 'messages', newMsg.id), newMsg).catch(() => {});

    // Simulate smart AI bot (Fidya) auto-reply"""
content = content.replace(send_old, send_new)

bot_old = """      // Sync bot message to server
      fetch(`/api/chats/${userId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: finalMsgs, threadMeta: { ...threadInfo, unreadForOwner: false } })
      }).catch(e => console.error(e));"""
bot_new = """      // Sync bot message to Firestore
      setDoc(doc(db, 'supportChats', userId), { ...threadInfo, unreadForOwner: false }).catch(() => {});
      setDoc(doc(db, 'supportChats', userId, 'messages', botMsg.id), botMsg).catch(() => {});"""
content = content.replace(bot_old, bot_new)

# Fix loadChatHistory
load_old = """    try {
      const res = await fetch(`/api/chats/${userId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.messages.length > 0) {
          localStorage.setItem(chatKey, JSON.stringify(data.messages));
          setMessages(data.messages);
          return;
        }
      }
    } catch (e) {}"""
load_new = """    try {
      const querySnapshot = await getDocs(collection(db, 'supportChats', userId, 'messages'));
      const msgs = querySnapshot.docs.map(d => d.data() as ChatMessage);
      if (msgs.length > 0) {
        msgs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime() || 0);
        localStorage.setItem(chatKey, JSON.stringify(msgs));
        setMessages(msgs);
        return;
      }
    } catch(e) {}"""
content = content.replace(load_old, load_new)

with open('src/components/CallCenterChat.tsx', 'w') as f:
    f.write(content)
