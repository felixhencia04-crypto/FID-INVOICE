with open('src/components/AuthPage.tsx', 'r') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if '{/* GOOGLE EMAIL PROMPT MODAL */}' in line:
        break
    new_lines.append(line)

new_lines.extend([
    "            </div>\n",
    "          )}\n",
    "        </div>\n",
    "      </div>\n",
    "    </div>\n",
    "  );\n",
    "}\n"
])

with open('src/components/AuthPage.tsx', 'w') as f:
    f.writelines(new_lines)
