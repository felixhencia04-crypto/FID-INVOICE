const fs = require('fs');
const path = require('path');

function replaceDarkClasses(content) {
  // We want to find strings like "class1 dark:class2 class3" 
  // But wait, the easiest way is to just replace the specific strings.
  
  const replacements = [
    ['bg-blue-50/50 dark:bg-blue-950/20', '${isDarkMode ? "bg-blue-950/20" : "bg-blue-50/50"}'],
    ['text-gray-400 dark:text-slate-500', '${isDarkMode ? "text-slate-500" : "text-gray-400"}'],
    ['text-blue-600 dark:text-blue-400', '${isDarkMode ? "text-blue-400" : "text-blue-600"}'],
    ['bg-white dark:bg-slate-800', '${isDarkMode ? "bg-slate-800" : "bg-white"}'],
    ['hover:bg-gray-100 dark:hover:bg-slate-700', '${isDarkMode ? "hover:bg-slate-700" : "hover:bg-gray-100"}'],
    ['border-gray-200/50 dark:border-slate-700', '${isDarkMode ? "border-slate-700" : "border-gray-200/50"}'],
    ['border-gray-200/60 dark:border-slate-800', '${isDarkMode ? "border-slate-800" : "border-gray-200/60"}'],
    ['bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700/50 dark:text-blue-300', '${isDarkMode ? "bg-blue-900/30 border-blue-700/50 text-blue-300" : "bg-blue-50 border-blue-200 text-blue-700"}'],
    ['bg-white border-gray-200 text-gray-500 hover:bg-gray-50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800', '${isDarkMode ? "bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800" : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"}'],
    ['dark:text-white', '${isDarkMode ? "text-white" : "text-slate-900"}'],
    ['bg-white dark:bg-slate-900', '${isDarkMode ? "bg-slate-900" : "bg-white"}'],
    ['border-gray-200 dark:border-slate-800', '${isDarkMode ? "border-slate-800" : "border-gray-200"}'],
    ['hover:bg-gray-100 dark:hover:bg-slate-800', '${isDarkMode ? "hover:bg-slate-800" : "hover:bg-gray-100"}'],
    ['bg-blue-50/50 dark:bg-blue-900/20', '${isDarkMode ? "bg-blue-900/20" : "bg-blue-50/50"}'],
    ['border-blue-100/50 dark:border-blue-800/30', '${isDarkMode ? "border-blue-800/30" : "border-blue-100/50"}'],
    ['text-blue-800 dark:text-blue-200', '${isDarkMode ? "text-blue-200" : "text-blue-800"}'],
    ['bg-green-50 dark:bg-green-950/20', '${isDarkMode ? "bg-green-950/20" : "bg-green-50"}'],
    ['border-green-200 dark:border-green-900/30', '${isDarkMode ? "border-green-900/30" : "border-green-200"}'],
    ['text-green-600 dark:text-green-400', '${isDarkMode ? "text-green-400" : "text-green-600"}'],
    ['text-green-700 dark:text-green-300', '${isDarkMode ? "text-green-300" : "text-green-700"}'],
  ];

  for (const [oldStr, newStr] of replacements) {
    // Look for this string inside a className="... " and change to className={`... ${newStr} ...`}
    // Actually, it's easier to just find the exact occurrences.
    // Let's manually replace them in the file content.
    // If it's in a normal string `className="text-gray-400 dark:text-slate-500 uppercase"`
    // We change it to `className={\`${isDarkMode ? "text-slate-500" : "text-gray-400"} uppercase\`}`
    
    // Regular expression to find className="..."
    content = content.replace(/className="([^"]*)"/g, (match, p1) => {
      let hasDark = false;
      let newClasses = p1;
      
      // Remove all dark: classes, store them.
      const classes = p1.split(' ');
      const darkClasses = [];
      const lightClasses = [];
      
      for (const cls of classes) {
        if (cls.startsWith('dark:')) {
          darkClasses.push(cls.replace('dark:', ''));
        } else {
          lightClasses.push(cls);
        }
      }
      
      if (darkClasses.length > 0 || lightClasses.some(c => ['bg-white', 'text-gray-400'].includes(c))) {
          // It's too complex to parse perfectly this way, let's use the explicit replacements but wrap appropriately.
      }
      return match;
    });
  }
  return content;
}
