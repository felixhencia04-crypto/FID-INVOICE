const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.json') || file.endsWith('.example')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./src').concat(['./server.ts', './.env.example', './index.html']);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const initial = content;
  
  content = content.replace(/midtrans/g, 'doku');
  content = content.replace(/Midtrans/g, 'Doku');
  content = content.replace(/MIDTRANS/g, 'DOKU');
  content = content.replace(/snap/g, 'jokul');
  content = content.replace(/Snap/g, 'Jokul');
  content = content.replace(/SNAP/g, 'JOKUL');
  
  if (initial !== content) {
    fs.writeFileSync(file, content);
    console.log('Updated ' + file);
  }
});
