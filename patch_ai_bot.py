import re

with open('src/components/CallCenterChat.tsx', 'r') as f:
    content = f.read()

old_bot_code = """    // Simulate smart AI bot (Fidya) auto-reply
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      let replyText = '';"""

new_bot_code = """    // Check if an agent has ever replied in this thread
    const hasAgentReplied = updatedMsgs.some(m => m.sender === 'agent');
    
    // Simulate smart AI bot (Fidya) auto-reply ONLY if agent hasn't replied yet
    if (!hasAgentReplied) {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        let replyText = '';"""

content = content.replace(old_bot_code, new_bot_code)

old_bot_end = """        osc.connect(gain);
        gain.connect(ctx.destination);
        gain.gain.setValueAtTime(0.03, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      } catch (ex) {}
    }, 1500);"""

new_bot_end = """        osc.connect(gain);
        gain.connect(ctx.destination);
        gain.gain.setValueAtTime(0.03, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      } catch (ex) {}
      }, 1500);
    }"""

content = content.replace(old_bot_end, new_bot_end)

with open('src/components/CallCenterChat.tsx', 'w') as f:
    f.write(content)

