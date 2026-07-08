const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

const regex = /<p className="text-\[9px\] font-mono text-slate-500 font-bold">8080507772<\/p>/g;
const replacement = `<p className="text-[9px] font-mono text-slate-500 font-bold">
                                      {(pay.senderBank || 'BCA').toUpperCase() === 'MANDIRI' ? '1090024887135' : 
                                       (pay.senderBank || 'BCA').toUpperCase() === 'BRI' ? '2090320006' : 
                                       '8080507772'}
                                    </p>`;

content = content.replace(regex, replacement);

fs.writeFileSync('src/components/AdminPanel.tsx', content);
console.log('Fixed Rekening display in AdminPanel');
