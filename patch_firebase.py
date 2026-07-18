import re
import json

with open('firebase-applet-config.json', 'r') as f:
    config = json.load(f)

with open('src/lib/firebase.ts', 'r') as f:
    content = f.read()

# Replace the hardcoded firebaseConfig with the one from the json file.
# Note that we need to add the databaseId to getFirestore call.

new_config_str = f"""const firebaseConfig = {{
  apiKey: "{config['apiKey']}",
  authDomain: "{config['authDomain']}",
  projectId: "{config['projectId']}",
  storageBucket: "{config['storageBucket']}",
  messagingSenderId: "{config['messagingSenderId']}",
  appId: "{config['appId']}",
  measurementId: "{config['measurementId']}"
}};
"""

# Replace config
content = re.sub(r'const firebaseConfig = \{.*?\};', new_config_str, content, flags=re.DOTALL)

# Replace getFirestore
content = content.replace('export const db = getFirestore(app);', f'export const db = getFirestore(app, "{config["firestoreDatabaseId"]}");')

with open('src/lib/firebase.ts', 'w') as f:
    f.write(content)
