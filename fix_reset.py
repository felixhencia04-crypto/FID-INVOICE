import re
with open('src/components/AuthPage.tsx', 'r') as f:
    content = f.read()

# Remove "?action=reset" view
content = re.sub(r'    \} else if \(action === '\''reset'\''\) \{.*?setSimulatedEmailOpen\(false\);\n    \}', r'    }', content, flags=re.DOTALL)

with open('src/components/AuthPage.tsx', 'w') as f:
    f.write(content)
