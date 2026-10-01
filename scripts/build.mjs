import fs from 'node:fs';
fs.mkdirSync('dist',{recursive:true});
for(const name of ['index.html','app.js','engine.mjs','search-worker.js','data'])fs.cpSync(name,'dist/'+name,{recursive:true});
console.log('Arquivos estáticos preparados em dist/');
