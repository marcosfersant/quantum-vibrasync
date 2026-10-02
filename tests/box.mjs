import assert from 'node:assert/strict';
import fs from 'node:fs';
import {compile,Player} from '../engine.mjs';
const row=c=>[0,'test','',[],c,0,180,1];
for(const f of [0.1,9.6,19,19.999,20001,25000])assert.equal(compile(row(`440,${f},537`)).code,'mixed');
for(const f of [20,20.1,440,537,17999,18000,19000,19999,20000])assert.equal(compile(row(String(f))).code,'audio');
assert.equal(compile(row('0=5,440')).code,'audio');
for(const c of ['440-20001','20001-440','9.6-440','440-9.6','0-440'])assert.equal(compile(row(c)).code,'external');
const player=new Player(()=>{},()=>{throw Error('Output must not open')});
player.load(compile(row('20001')));await player.play();assert.equal(player.state,'blocked');
const index=JSON.parse(fs.readFileSync('dist/data/indice.json'));
const codes=new Map(index.map(r=>[r[0],r[4]]));
for(const f of fs.readdirSync('data').filter(f=>/^parte-.*\.json$/.test(f)))for(const r of JSON.parse(fs.readFileSync('data/'+f)))assert.equal(codes.get(r[0]),compile(r).code);
assert.equal(codes.get(89136),'audio');
console.log('PASS: limites, varreduras, pausas, bloqueio e 90.893 classificações publicadas');

assert.equal(codes.get(51210),'pending');
assert.equal(index.find(r=>r[0]===51210)[7],false);
assert.equal(index.find(r=>r[0]===89136)[7],true);
assert.equal(compile(row('M421.133729421')).steps.length,1);
assert.equal(compile(row('M421.133729421')).steps[0].hz,null);
assert(compile(row('M421.133729421')).steps[0].referenceHz>20000);

for(const id of [71263,74623,77130,78518,78610,61255,61335,64047,84762,89157]){
 const item=index.find(r=>r[0]===id);assert(item[6].includes('tireoide'),`Tireoide ausente: ${id}`);assert.equal(item[7],true);
}
for(const id of [48618,87962,87963])assert(!index.find(r=>r[0]===id)[6].includes('tireoide'));
for(const id of [69496,72718,72747])assert(index.find(r=>r[0]===id)[6].includes('cancer'));
console.log('PASS: tireoide recuperada, pastas originais mantidas, homônimos excluídos');

const recovered=JSON.parse(fs.readFileSync('recuperacao-traducoes/v5-organizacao.json'));
for(const [id,areas,name,visible] of recovered.additions){
 const row=index.find(r=>r[0]===id);
 for(const area of areas)assert(row[6].includes(area),`V5 ${id}: ${area} ausente`);
 if(visible)assert.equal(row[7],true);
}
for(const id of recovered.thyroidV5)assert(index.find(r=>r[0]===id)[6].includes('tireoide'));
console.log('PASS: todos os vínculos recuperados da V5 presentes no catálogo publicado');

assert.equal(index.find(r=>r[0]===71160)[1],index.find(r=>r[0]===71161)[1]);
const balantidium=JSON.parse(fs.readFileSync('data/parte-071.json'));
assert.equal(compile(balantidium.find(r=>r[0]===71160)).steps.length,6);
assert.equal(compile(balantidium.find(r=>r[0]===71161)).steps.length,2);

assert.equal(codes.get(70582),'external');
player.load(compile(row('9.6')));await player.play();assert.equal(player.state,'blocked');

// Mixed sequences preserve independent external and pending requirements.
for(const id of [87768,87769]){const item=index.find(r=>r[0]===id);assert.equal(item[4],'mixed');assert.equal(item[8],true);assert.equal(item[9],true);}
assert.equal(index.find(r=>r[0]===82693)[4],'external');
for(const item of index){if(item[4]==='audio'){assert.equal(item[8],false);assert.equal(item[9],false);}}
console.log('PASS: avaliação por etapa e presets não confirmados sem falso rótulo Box');
