MIGRATION TO FIREBASE (IN PROGRESS):
1. Created src/lib/firebase.ts with correct project credentials.
2. Deployed Firestore rules to ensure data privacy (SaaS architecture).
3. Created src/lib/dataService.ts to read/write from Firestore.
4. Patched src/App.tsx loadUserData and saveUserDataToStorage to use Firestore.
5. (PENDING) AuthPage.tsx to use Firebase Authentication.
