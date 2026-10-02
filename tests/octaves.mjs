import assert from 'node:assert/strict';
import fs from 'node:fs';
import {compile,parseCommand,Player} from '../engine.mjs';
import {convertTarget} from '../conversions.mjs';
import {OCTAVE_AUDIO_PRESET,reduceOctaves} from '../presets.mjs';
const row=c=>[0,'test','',[],c,0,1,1];
assert.deepEqual(reduceOctaves(7500000,20000),{hz:14648.4375,octaves:9,divisor:512});
assert.equal(reduceOctaves(20000,20000).octaves,0);
assert.throws(()=>reduceOctaves(100,0));
assert.throws(()=>reduceOctaves(Infinity,20000));
assert.equal(convertTarget(parseCommand('B29900',1)).hz,convertTarget(parseCommand('BC29900',1)).hz);
const commands=['B29900','BL29901','BC29900','BLR9756','BCR9755','BLm9756','BCm9755','M1','L470','[C47H72O14]'];
for(const command of commands){
 const plan=compile(row(command),OCTAVE_AUDIO_PRESET),step=plan.steps[0];
 assert.equal(plan.code,'audio');assert.equal(step.comandoOriginal,command);
 assert(step.hz>=20&&step.hz<=20000);assert.equal(step.hz,step.referenceHz/step.harmonic.divisor);
 assert(step.hz*2>20000);assert.equal(step.seconds,1);
}
assert.equal(compile(row('440,25000'),OCTAVE_AUDIO_PRESET).code,'mixed'); // Direct Hz never folded.
assert.equal(compile(row('BL1'),OCTAVE_AUDIO_PRESET).code,'pending');
assert.equal(compile(row('L470 A20'),OCTAVE_AUDIO_PRESET).code,'external');
assert.equal(compile([0,'laser','',[],'L470',0,1,1],OCTAVE_AUDIO_PRESET).code,'external');
assert.equal(compile([0,'test','RRMD',[],'440,880',0,1,1],OCTAVE_AUDIO_PRESET).code,'external');
assert.equal(compile(row('M1 Q20'),OCTAVE_AUDIO_PRESET).code,'pending');
const tones=[];const param=()=>({value:0,setTargetAtTime(){},setValueAtTime(){},linearRampToValueAtTime(){}});
const node=()=>({connect(){},disconnect(){},start(){},stop(){},gain:param(),frequency:param()});
const player=new Player(()=>{},()=>({currentTime:0,sampleRate:48000,destination:{},createGain:node,createBuffer:()=>({getChannelData:()=>new Float32Array(1)}),createBufferSource:node,createOscillator:()=>{const n=node();n.frequency.setValueAtTime=f=>tones.push(f);return n},resume:async()=>{},close:async()=>{}}));
const plan=compile(row('M1,BL29901,L470'),OCTAVE_AUDIO_PRESET);player.load(plan);await player.play();assert.equal(player.state,'playing');assert.deepEqual(tones,plan.steps.map(s=>s.hz));player.stop();
const counts={audio:0,mixed:0,external:0,pending:0};let newAudio=0,converted=0;
for(const f of fs.readdirSync('data').filter(f=>/^parte-.*\.json$/.test(f)))for(const r of JSON.parse(fs.readFileSync('data/'+f))){
 const normal=compile(r),adapted=compile(r,OCTAVE_AUDIO_PRESET);counts[adapted.code]++;
 if(normal.code!=='audio'&&adapted.code==='audio')newAudio++;
 for(const s of adapted.steps)if(s.harmonic){converted++;assert.equal(s.hz,s.referenceHz/s.harmonic.divisor);}
 assert.equal(normal.raw,adapted.raw);assert.equal(normal.steps.length,adapted.steps.length);
}
assert.equal(Object.values(counts).reduce((a,b)=>a+b,0),90893);assert(newAudio>0);
console.log('PASS: explicit octave profile, real oscillator frequencies, original commands, direct Hz unchanged, external delivery retained');
console.log(JSON.stringify({counts,newAudio,converted}));
