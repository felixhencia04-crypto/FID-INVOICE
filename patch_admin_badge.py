import re

with open('src/components/AdminPanel.tsx', 'r') as f:
    content = f.read()

old_badge = """          {chatThreads.filter(c => c.unreadForOwner).length > 0 && (
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse absolute right-3 top-3" />
          )}
        </button>"""

new_badge = """          {chatThreads.filter(c => c.unreadForOwner).length > 0 && (
            <span className="w-5 h-5 flex items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ml-auto animate-pulse">
              {chatThreads.filter(c => c.unreadForOwner).length}
            </span>
          )}
        </button>"""

content = content.replace(old_badge, new_badge)

with open('src/components/AdminPanel.tsx', 'w') as f:
    f.write(content)

