const fs = require('fs');

let serverContent = fs.readFileSync('server.ts', 'utf8');

// I also need to update the status API to use SECRET_KEY
// The status API currently looks like this in server.ts:
serverContent = serverContent.replace(
  /const SERVER_KEY = process\.env\.DOKU_SERVER_KEY \|\| '.*?';/g,
  "const SECRET_KEY = process.env.DOKU_SECRET_KEY || 'SK-c1pC2u9lDrwLpYdVz05v';"
);
// I already replaced SERVER_KEY with SECRET_KEY in the previous script. Let's make sure.

fs.writeFileSync('server.ts', serverContent);
