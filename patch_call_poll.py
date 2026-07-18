import re

with open('src/components/CallCenterChat.tsx', 'r') as f:
    content = f.read()

old_onSnapshot = """  // Use Firestore onSnapshot for real-time customer support chat replies
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
                gain.gain.setValueAtTime(0.02, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
                osc.start();
                osc.stop(ctx.currentTime + 0.3);
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

new_poll = """  useEffect(() => {
    loadChatHistory();
    
    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/chats/${userId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.messages && data.messages.length > 0) {
            setMessages(prev => {
              if (data.messages.length !== prev.length || (data.messages.length > 0 && prev.length > 0 && data.messages[data.messages.length - 1].id !== prev[prev.length - 1].id)) {
                const lastMsg = data.messages[data.messages.length - 1];
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
                    gain.gain.setValueAtTime(0.02, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
                    osc.start();
                    osc.stop(ctx.currentTime + 0.3);
                  } catch (e) {}
                }
                return data.messages;
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

content = content.replace(old_onSnapshot, new_poll)

with open('src/components/CallCenterChat.tsx', 'w') as f:
    f.write(content)
