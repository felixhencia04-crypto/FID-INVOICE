const fs = require('fs');
if (fs.existsSync('payments-db.json')) {
  let content = fs.readFileSync('payments-db.json', 'utf8');
  content = content.replace(/Simulasi Transfer /g, 'Transfer ');
  content = content.replace(/Simulated Payment/ig, 'Manual Payment');
  fs.writeFileSync('payments-db.json', content);
  console.log('Fixed payments-db.json');
} else {
  console.log('payments-db.json not found');
}
