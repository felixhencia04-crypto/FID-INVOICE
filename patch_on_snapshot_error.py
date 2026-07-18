import re

def patch_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Replace onSnapshot(q, (snapshot) => { ... }); with error handler
    # We will use regex to find the closing }); of onSnapshot and add the error handler before it.
    # Actually, simpler: replace `});` at the end of the snapshot with `}, (error) => { console.warn("Snapshot error:", error); });`
    
    # In AdminPanel.tsx:
    content = content.replace(
        "      setChatThreads(threads);\n    });",
        "      setChatThreads(threads);\n    }, (error) => {\n      console.warn('Chat threads snapshot error:', error);\n    });"
    )
    
    content = content.replace(
        "      setChatMessages(msgs);\n    });",
        "      setChatMessages(msgs);\n    }, (error) => {\n      console.warn('Chat msgs snapshot error:', error);\n    });"
    )
    
    # In CallCenterChat.tsx:
    content = content.replace(
        "          return prev;\n        });\n      }\n    });",
        "          return prev;\n        });\n      }\n    }, (error) => {\n      console.warn('Call center snapshot error:', error);\n    });"
    )

    with open(filepath, 'w') as f:
        f.write(content)

patch_file('src/components/AdminPanel.tsx')
patch_file('src/components/CallCenterChat.tsx')

print("Patched onSnapshot errors")
