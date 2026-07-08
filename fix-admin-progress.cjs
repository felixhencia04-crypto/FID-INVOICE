const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

const regex = /<div className="flex items-center gap-2 h-2\.5 bg-slate-900 rounded-full overflow-hidden">.*?<div className="flex justify-between text-\[10px\] text-slate-400 font-medium">.*?<\/div>/s;

const newCode = `<div className="flex items-center gap-2 h-2.5 bg-slate-900 rounded-full overflow-hidden">
                          {(() => {
                            const totalVal = paymentMethodDataToRender.reduce((s, curr) => s + curr.value, 0);
                            if (totalVal === 0) {
                              return <div className="h-full w-full bg-slate-800" title="Belum ada omzet" />;
                            }
                            return paymentMethodDataToRender.map((p, i) => {
                              const pct = (p.value / totalVal) * 100;
                              if (pct === 0) return null;
                              return (
                                <div key={i} className="h-full" style={{ width: \`\${pct}%\`, backgroundColor: p.color }} title={\`\${p.name}: \${pct.toFixed(1)}%\`} />
                              );
                            });
                          })()}
                        </div>
                        <div className="flex flex-wrap gap-3 justify-between text-[10px] text-slate-400 font-medium mt-3">
                          {paymentMethodDataToRender.map((p, i) => {
                            if (p.value === 0) return null;
                            return (
                              <span key={i} className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} /> {p.name}
                              </span>
                            );
                          })}
                        </div>`;

content = content.replace(regex, newCode);

fs.writeFileSync('src/components/AdminPanel.tsx', content);
console.log('Fixed AdminPanel progress bar');
