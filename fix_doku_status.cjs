const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const regex = /const component = `Client-Id:\$\{CLIENT_ID\}\\nRequest-Id:\$\{requestId\}\\nRequest-Timestamp:\$\{timestamp\}\\nRequest-Target:\$\{targetPath\}\\nDigest:`;/;
const newComponent = "const component = `Client-Id:${CLIENT_ID}\\nRequest-Id:${requestId}\\nRequest-Timestamp:${timestamp}\\nRequest-Target:${targetPath}`;";

if (content.match(regex)) {
  content = content.replace(regex, newComponent);
  fs.writeFileSync('server.ts', content);
  console.log('Fixed GET signature in server.ts');
} else {
  console.log('Regex did not match');
}
