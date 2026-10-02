import assert from 'node:assert/strict';
import {compile,Player,STEP_STATUS} from '../engine.mjs';
const row=c=>[0,'test','',[],c,0,1,1];
const draft=compile(row('0.15,432.00,528.00'));
assert.equal(draft.code,'mixed');assert.deepEqual(draft.steps.map(s=>s.statusExecucao),[STEP_STATUS.external,STEP_STATUS.audio,STEP_STATUS.audio]);
assert.deepEqual(draft.steps.map(s=>s.comandoOriginal),['0.15','432.00','528.00']);
const uncertain=compile(row('440,M1,880'));
assert.equal(uncertain.code,'mixed');assert.equal(uncertain.steps[1].hz,null);assert(uncertain.steps[1].referenceHz>20000);
assert.equal(uncertain.summary.external,0);assert.equal(uncertain.summary.pending,1);
const specific={id:'explicit-test',confirmed:true,source:'Synthetic regression preset, not V7',harmonicDivisor:1e22};
const mapped=compile(row('M1'),specific);assert.equal(mapped.code,'audio');assert(Math.abs(mapped.steps[0].hz-22.523430883)<1e-10);
assert.equal(mapped.steps[0].comandoOriginal,'M1');assert.equal(mapped.steps[0].conversion.fundamentalHz,2.2523430883e23);
assert.equal(compile(row('M1'),{id:'unverified'}).code,'pending');
assert.equal(compile(row('100-25000')).code,'external');
assert.equal(compile(row('20000')).code,'audio');
assert.equal(compile(row('440 G1,880,100 G0')).steps[1].statusExecucao,STEP_STATUS.pending);
assert.equal(compile(row('440 G1,880,100 G0')).steps[2].statusExecucao,STEP_STATUS.audio);
assert.equal(compile(row('440 W10,880 W1')).steps[1].statusExecucao,STEP_STATUS.audio);
assert.equal(compile(row('invalid,440')).steps.length,2);
let ctx,opened=0,state;const frequencies=[];
const param=()=>({value:0,setTargetAtTime(){},setValueAtTime(){},linearRampToValueAtTime(){}});
const node=()=>({connect(){},disconnect(){},start(){},stop(){},gain:param(),frequency:param()});
const factory=()=>{opened++;return ctx={currentTime:0,sampleRate:48000,destination:{},createGain:node,createBuffer:()=>({getChannelData:()=>new Float32Array(10)}),createBufferSource:node,createOscillator:()=>{const n=node();n.frequency.setValueAtTime=f=>frequencies.push(f);return n;},resume:async()=>{},close:async()=>{}}};
const p=new Player(s=>state=s,factory);
p.load(compile(row('440,25000,880')));await p.play();
assert.deepEqual(frequencies,[440]);ctx.currentTime=1.031;p.tick();assert.equal(p.state,'blocked');assert.equal(p.index,1);assert.equal(p.ctx,null);assert.deepEqual(p.skipped,[]);
await p.play();assert.deepEqual(frequencies,[440]); // Iniciar cannot bypass restriction.
await p.skipRestricted();assert.deepEqual(frequencies,[440,880]);assert.deepEqual(p.skipped,[2]);
ctx.currentTime=1.031;p.tick();assert.equal(p.state,'finished');assert.match(state.message,/parcial/);
assert.match(state.message,/não foi executado/);
p.load(draft);const before=opened;await p.play();assert.equal(opened,before);assert.equal(p.state,'blocked');
await p.skipRestricted();assert.equal(p.state,'playing');assert.deepEqual(frequencies.slice(-2),[432,528]);p.stop();
p.load(uncertain);await p.play();ctx.currentTime=1.031;p.tick();assert.equal(p.state,'blocked');assert.equal(state.step.statusExecucao,STEP_STATUS.pending);p.stop();
// Device capability is checked per step, even inside the nominal 20–20k range.
const lowRate=new Player(()=>{},()=>{const c=factory();c.sampleRate=32000;return c;});
lowRate.load(compile(row('440,19000,880')));await lowRate.play();assert.equal(frequencies.at(-1),440);ctx.currentTime=1.031;lowRate.tick();assert.equal(lowRate.state,'blocked');lowRate.stop();
console.log('PASS: preset separation, mixed and unknown steps, 20k boundary, original commands, no global block, no automatic skip, explicit partial continuation, device limits');

const both=compile([0,'test','RRMD',[],'M1',0,180,1]);assert.equal(both.code,'pending');assert.equal(both.summary.hardware,1);assert.match(both.steps[0].observacao,/Também requer saída externa/);
