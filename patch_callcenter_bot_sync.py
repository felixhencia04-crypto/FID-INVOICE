import re
with open('src/components/CallCenterChat.tsx', 'r') as f:
    content = f.read()

# Fix the condition to update messages when polling
poll_old = """            setMessages(prev => {
              if (parsed.length > prev.length) {
                // New message arrived
                const lastMsg = parsed[parsed.length - 1];"""
poll_new = """            setMessages(prev => {
              // Instead of just length, check if the last message IDs are different or length is different
              if (parsed.length !== prev.length || (parsed.length > 0 && prev.length > 0 && parsed[parsed.length - 1].id !== prev[prev.length - 1].id)) {
                // New message arrived
                const lastMsg = parsed[parsed.length - 1];"""
content = content.replace(poll_old, poll_new)

# Fix bot reply sync
bot_old = """      // Play soft incoming notification sound
      try {"""
bot_new = """      // Sync bot message to server
      fetch(`/api/chats/${userId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: finalMsgs, threadMeta: { ...threadInfo, unreadForOwner: false } })
      }).catch(e => console.error(e));

      // Play soft incoming notification sound
      try {"""
content = content.replace(bot_old, bot_new)

with open('src/components/CallCenterChat.tsx', 'w') as f:
    f.write(content)
