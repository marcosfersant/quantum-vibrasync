import {compile} from '../engine.mjs';
import fs from 'node:fs';
fs.mkdirSync('dist',{recursive:true});
for(const name of ['index.html','app.js','engine.mjs','search-worker.js','data'])fs.cpSync(name,'dist/'+name,{recursive:true});
console.log('Arquivos estáticos preparados em dist/');

// Reclassify only the published index; original bank and translations remain intact.
const codes=new Map();
for(const f of fs.readdirSync('data').filter(f=>/^parte-.*\.json$/.test(f)))for(const row of JSON.parse(fs.readFileSync('data/'+f)))codes.set(row[0],compile(row).code);
const index=JSON.parse(fs.readFileSync('data/indice.json'));
for(const row of index)row[4]=codes.get(row[0]);
fs.writeFileSync('dist/data/indice.json',JSON.stringify(index));
console.log('Classificação de saída:',index.reduce((a,r)=>(a[r[4]]=(a[r[4]]||0)+1,a),{}));
