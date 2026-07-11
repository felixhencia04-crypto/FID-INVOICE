const { JSDOM } = require('jsdom');
const dom = new JSDOM(`<body><img id="test" src="data:image/png;base64,iVBORw0K" /></body>`);
const img = dom.window.document.getElementById('test');
console.log(img.src);
