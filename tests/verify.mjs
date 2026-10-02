import crypto from 'node:crypto';
import assert from 'node:assert/strict';import fs from 'node:fs';import {compile,Player,STEP_STATUS} from '../engine.mjs';
const rows=fs.readdirSync('data').filter(x=>x.startsWith('parte-')).sort().flatMap(f=>JSON.parse(fs.readFileSync('data/'+f)));
assert.equal(rows.length,90893);assert.equal(new Set(rows.map(r=>r[0])).size,90893);
const manifest=JSON.parse(fs.readFileSync('manifesto-reconstrucao.json'));
assert.equal(crypto.createHash('sha256').update(JSON.stringify(rows)).digest('hex'),manifest.sha256_registros_json);
const counts={};for(const r of rows){
 const p=compile(r);counts[p.code]=(counts[p.code]||0)+1;
 const tokens=r[4].split(',');if(!tokens.at(-1).trim())tokens.pop();
 assert.equal(p.steps.length,tokens.length);assert.deepEqual(p.steps.map(s=>s.comandoOriginal),tokens);
 assert(p.steps.every(s=>s.seconds>0));assert(Number.isFinite(p.totalSeconds));
 for(const s of p.steps){if(s.statusExecucao===STEP_STATUS.pending)assert.equal(s.hz,null);else assert(Number.isFinite(s.hz)&&Number.isFinite(s.endHz));}
 if(p.code==='audio')assert(p.steps.every(s=>[STEP_STATUS.audio,STEP_STATUS.rest].includes(s.statusExecucao)));
}
const row=c=>[0,'teste','',[],c,0,180,1];
assert.deepEqual(compile(row('440,440,880,')).steps.map(s=>s.hz),[440,440,880]);
assert.equal(compile(row('100=60,200,300=600,')).totalSeconds,840);
assert.deepEqual(compile(row('100-200=60,200-100=30,')).steps.map(s=>[s.hz,s.endHz,s.seconds]),[[100,200,60],[200,100,30]]);
assert.deepEqual(compile(row('100 W2,200,300 W1,')).steps.map(s=>s.wave),['square','square','sine']);
assert.equal(compile(row('0=20,100,')).steps[0].rest,true);
for(const c of ['1,,2','x','100=0','NaN','100=2=3'])assert(compile(row(c)).summary.pending>0);
const events=[];const param=()=>({value:0,setTargetAtTime(){},setValueAtTime(...a){events.push(['set',...a])},linearRampToValueAtTime(...a){events.push(['ramp',...a])}});
const node=()=>({connect(){},disconnect(){},start(){},stop(){},gain:param(),frequency:param()});let ctx;
const factory=()=>ctx={currentTime:0,sampleRate:48000,destination:{},createOscillator:node,createGain:node,createBuffer:()=>({getChannelData:()=>new Float32Array(10)}),createBufferSource:node,resume:async()=>{},close:async()=>{}};
let state;const p=new Player(s=>state=s,factory);p.load(compile(row('100-200=2,440=3,')));await p.play();assert(events.some(e=>e[0]==='ramp'&&e[1]===200));ctx.currentTime=1.03;p.pause();assert(Math.abs(p.position-1)<1e-6);await p.play();ctx.currentTime=1.14;p.tick();assert.equal(p.index,1);ctx.currentTime=4.04;p.tick();assert.equal(state.state,'finished');
p.load(compile(row('440=1,')));p.repeat=true;await p.play();ctx.currentTime=2.23;p.tick();assert.equal(p.state,'playing');p.stop();
let resolve;const race=new Player(()=>{},()=>({...factory(),resume:()=>new Promise(r=>resolve=r)}));race.load(compile(row('440')));const pending=race.play();race.stop();resolve();await pending;assert.equal(race.state,'stopped');assert.equal(race.ctx,null);
console.log(JSON.stringify({programas:rows.length,classificacao:counts,integridade:'SHA-256 original preservado',testes_motor:'passou'},null,2));
