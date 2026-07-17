import fs from 'fs';
let css = fs.readFileSync('src/index.css', 'utf8');
css = css.replace('@import "tailwindcss";', '@import "tailwindcss";\n@custom-variant dark (&:where(.dark, .dark *));');
fs.writeFileSync('src/index.css', css);
