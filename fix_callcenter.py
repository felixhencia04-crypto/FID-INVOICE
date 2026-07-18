import sys

with open("src/components/CallCenterChat.tsx", "r") as f:
    content = f.read()

target = """import { UserProfile } from '../types';"""
replacement = """import { UserProfile } from '../types';
import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';"""

content = content.replace(target, replacement)

with open("src/components/CallCenterChat.tsx", "w") as f:
    f.write(content)
print("done")
