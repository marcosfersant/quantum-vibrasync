import assert from 'node:assert/strict';
import fs from 'node:fs';
import {compile,Player} from '../engine.mjs';
const row=c=>[0,'test','',[],c,0,180,1];
for(const f of [20000,25000])assert.equal(compile(row(`440,${f},537`)).code,'external');
for(const f of [0.1,19,20,20.1,440,537,17999,18000,19000])assert.equal(compile(row(String(f))).code,'audio');
assert.equal(compile(row('0=5,440')).code,'audio');
for(const c of ['440-20000','20000-440'])assert.equal(compile(row(c)).code,'external');
const player=new Player(()=>{},()=>{throw Error('Output must not open')});
player.load(compile(row('20000,537')));await player.play();assert.equal(player.state,'stopped');
const index=JSON.parse(fs.readFileSync('dist/data/indice.json'));
const codes=new Map(index.map(r=>[r[0],r[4]]));
for(const f of fs.readdirSync('data').filter(f=>/^parte-.*\.json$/.test(f)))for(const r of JSON.parse(fs.readFileSync('data/'+f)))assert.equal(codes.get(r[0]),compile(r).code);
assert.equal(codes.get(89136),'audio');
console.log('PASS: limites, varreduras, pausas, bloqueio e 90.893 classificações publicadas');

assert.equal(codes.get(51210),'external');
assert.equal(index.find(r=>r[0]===51210)[7],false);
assert.equal(index.find(r=>r[0]===89136)[7],true);
assert.equal(compile(row('M421.133729421')).steps.length,0);

for(const id of [71263,74623,77130,78518,78610,61255,61335,64047,84762,89157]){
 const item=index.find(r=>r[0]===id);assert(item[6].includes('tireoide'),`Tireoide ausente: ${id}`);assert.equal(item[7],true);
}
for(const id of [48618,87962,87963])assert(!index.find(r=>r[0]===id)[6].includes('tireoide'));
for(const id of [69496,72718,72747])assert(index.find(r=>r[0]===id)[6].includes('cancer'));
console.log('PASS: tireoide recuperada, pastas originais mantidas, homônimos excluídos');
