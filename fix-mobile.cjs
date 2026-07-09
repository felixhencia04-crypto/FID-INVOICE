const fs = require('fs');
let code = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

// Fix browser container padding
code = code.replace(/<div className="lg:col-span-7 bg-slate-50 p-6 sm:p-10 flex flex-col justify-center border-t lg:border-t-0 border-gray-100">/, 
'<div className="lg:col-span-7 bg-slate-50 p-4 sm:p-10 flex flex-col justify-center border-t lg:border-t-0 border-gray-100 overflow-hidden">');

// Fix browser header
code = code.replace(/<div className="bg-gray-100\/80 px-4 py-3 border-b border-gray-150 flex items-center justify-between sticky top-0 z-20">/,
'<div className="bg-gray-100/80 px-3 sm:px-4 py-3 border-b border-gray-150 flex items-center justify-between sticky top-0 z-20 gap-2">');

// Fix URL bar
code = code.replace(/<div className="bg-white\/90 border border-gray-200 px-8 py-0\.5 rounded-lg text-\[9px\] text-gray-400 font-mono select-none">/,
'<div className="bg-white/90 border border-gray-200 px-2 sm:px-8 py-0.5 rounded-lg text-[9px] text-gray-400 font-mono select-none truncate flex-1 text-center mx-2 max-w-[160px] sm:max-w-none">');

// Fix "Demo Live" badge hiding on very small screens
code = code.replace(/<span className="px-2 py-0\.5 bg-brand-primary-light text-\[9px\] font-bold text-brand-primary rounded font-mono uppercase tracking-wider">Demo Live<\/span>/,
'<span className="hidden sm:inline-block px-2 py-0.5 bg-brand-primary-light text-[9px] font-bold text-brand-primary rounded font-mono uppercase tracking-wider">Demo Live</span>');

// Fix Demo inner padding
code = code.replace(/<div className="p-6 space-y-4">/, '<div className="p-4 sm:p-6 space-y-4">');

// Fix Title area
code = code.replace(/<div className="flex justify-between items-center pb-2 border-b border-gray-100">/g,
'<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 pb-2 border-b border-gray-100">');

// Fix Grid to be responsive
code = code.replace(/<div className="grid grid-cols-2 gap-4 text-\[10px\] bg-slate-50 p-2\.5 rounded-xl border border-slate-100">/g,
'<div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-[10px] bg-slate-50 p-2.5 rounded-xl border border-slate-100">');

// Fix Table wrapper
code = code.replace(/<div className="border border-gray-100 rounded-xl overflow-hidden text-\[10px\]">/g,
'<div className="border border-gray-100 rounded-xl overflow-x-auto text-[10px]">');

code = code.replace(/<table className="w-full text-left my-0 border-collapse">/g,
'<table className="w-full text-left my-0 border-collapse min-w-[280px]">');

fs.writeFileSync('src/components/LandingPage.tsx', code);
