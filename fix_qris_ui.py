import re

with open('src/components/QrisPaymentBox.tsx', 'r') as f:
    content = f.read()

# Instead of blindly replacing, I will use a simple rule: remove 'dark:xxx' from all classes. 
# And rely solely on the background provided. Since isDarkMode=false is passed, we want it to look good on light.
# If isDarkMode=true, then we want it to look good on dark.
# Wait, this is difficult if I remove `dark:` classes, it will ALWAYS look light.
# If I use `${isDarkMode ? 'class1' : 'class2'}`, I need to carefully rewrite the class strings.

# Let's do a targeted replace for QrisPaymentBox:
# find `className="... dark:... "` and replace with template literals.
