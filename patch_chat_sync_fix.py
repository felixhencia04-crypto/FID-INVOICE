import re

with open('src/components/CallCenterChat.tsx', 'r') as f:
    content = f.read()

old_set_msgs = """            if (lastMsg.sender === 'agent' && !isOpen) {
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
          }
          return msgs;
        });"""

new_set_msgs = """            if (lastMsg.sender === 'agent' && !isOpen) {
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
        });"""

content = content.replace(old_set_msgs, new_set_msgs)

with open('src/components/CallCenterChat.tsx', 'w') as f:
    f.write(content)
