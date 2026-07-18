import re

with open('src/components/CallCenterChat.tsx', 'r') as f:
    content = f.read()

# Replace loadChatHistory
load_old = """  const loadChatHistory = () => {
    const chatKey = 'fid_invoice_chat_' + userId;
    const stored = localStorage.getItem(chatKey);
    if (stored) {
      const parsed = JSON.parse(stored);
      setMessages(parsed);
      
      // Calculate unread messages from agent
      if (!isOpen) {
        // Find if last message is from agent and user hasn't seen it
        const threadStr = localStorage.getItem('fid_invoice_support_chats') || '[]';
        const threads = JSON.parse(threadStr);
        const myThread = threads.find((t: any) => t.userId === userId);
        if (myThread && myThread.unreadForUser) {
          setUnreadCount(1);
        }
      }
    } else {
      // Default welcome messages
      const welcomeMsgs: ChatMessage[] = [
        {
          id: 'welcome_1',
          sender: 'bot',
          senderName: 'Fidya - AI Support',
          text: currentUser 
            ? `Halo Kak ${currentUser.fullName}! Selamat datang di Pusat Layanan & Chat Support FID INVOICE. Saya Fidya, asisten pintar Anda. Bagaimana saya bisa membantu operasional bisnis Anda hari ini?`
            : 'Halo! Selamat datang di Pusat Layanan & Chat Support FID INVOICE. Saya Fidya, asisten digital Anda. Apakah Kakak mengalami kendala pendaftaran, login, atau ingin bertanya mengenai fitur aplikasi?',
          timestamp: new Date().toTimeString().split(' ')[0].substring(0, 5)
        }
      ];
      localStorage.setItem(chatKey, JSON.stringify(welcomeMsgs));
      setMessages(welcomeMsgs);
    }
  };"""

load_new = """  const loadChatHistory = async () => {
    const chatKey = 'fid_invoice_chat_' + userId;
    
    // Default welcome msgs
    const welcomeMsgs: ChatMessage[] = [
      {
        id: 'welcome_1',
        sender: 'bot',
        senderName: 'Fidya - AI Support',
        text: currentUser 
          ? `Halo Kak ${currentUser.fullName}! Selamat datang di Pusat Layanan & Chat Support FID INVOICE. Saya Fidya, asisten pintar Anda. Bagaimana saya bisa membantu operasional bisnis Anda hari ini?`
          : 'Halo! Selamat datang di Pusat Layanan & Chat Support FID INVOICE. Saya Fidya, asisten digital Anda. Apakah Kakak mengalami kendala pendaftaran, login, atau ingin bertanya mengenai fitur aplikasi?',
        timestamp: new Date().toTimeString().split(' ')[0].substring(0, 5)
      }
    ];

    try {
      const res = await fetch(`/api/chats/${userId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.messages.length > 0) {
          localStorage.setItem(chatKey, JSON.stringify(data.messages));
          setMessages(data.messages);
          return;
        }
      }
    } catch (e) {
      console.error(e);
    }

    const stored = localStorage.getItem(chatKey);
    if (stored) {
      const parsed = JSON.parse(stored);
      setMessages(parsed);
      
      if (!isOpen) {
        const threadStr = localStorage.getItem('fid_invoice_support_chats') || '[]';
        const threads = JSON.parse(threadStr);
        const myThread = threads.find((t: any) => t.userId === userId);
        if (myThread && myThread.unreadForUser) {
          setUnreadCount(1);
        }
      }
    } else {
      localStorage.setItem(chatKey, JSON.stringify(welcomeMsgs));
      setMessages(welcomeMsgs);
    }
  };"""

content = content.replace(load_old, load_new)

# Replace the poll interval logic
poll_old = """    // Start polling localStorage for real-time customer support chat replies
    pollIntervalRef.current = setInterval(() => {
      const chatKey = 'fid_invoice_chat_' + userId;
      const stored = localStorage.getItem(chatKey);
      if (stored) {
        const parsed: ChatMessage[] = JSON.parse(stored);
        
        setMessages(prev => {
          if (parsed.length > prev.length) {
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
    }, 1500);"""

poll_new = """    // Start polling server for real-time customer support chat replies
    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/chats/${userId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.messages.length > 0) {
            const parsed = data.messages;
            setMessages(prev => {
              if (parsed.length > prev.length) {
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
    }, 2000);"""

content = content.replace(poll_old, poll_new)

# Replace handleSendMessage localstorage logic
send_old = """    localStorage.setItem('fid_invoice_support_chats', JSON.stringify(threads));

    // Play a crisp keyboard click send chime"""

send_new = """    localStorage.setItem('fid_invoice_support_chats', JSON.stringify(threads));

    fetch(`/api/chats/${userId}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: newMsg, threadMeta: threadInfo })
    }).catch(e => console.error(e));

    // Play a crisp keyboard click send chime"""

content = content.replace(send_old, send_new)

with open('src/components/CallCenterChat.tsx', 'w') as f:
    f.write(content)
