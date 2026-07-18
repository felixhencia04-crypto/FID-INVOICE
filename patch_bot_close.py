import re

with open('src/components/CallCenterChat.tsx', 'r') as f:
    content = f.read()

old_end = """        osc.stop(ctx.currentTime + 0.25);
      } catch (e) {}
    }, 1200);
  };"""

new_end = """        osc.stop(ctx.currentTime + 0.25);
      } catch (e) {}
      }, 1200);
    }
  };"""

content = content.replace(old_end, new_end)

with open('src/components/CallCenterChat.tsx', 'w') as f:
    f.write(content)
