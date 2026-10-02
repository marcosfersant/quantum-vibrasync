import {convertTarget,CONVERSION_PROFILE} from './conversions.mjs';
// Syntax reference: official Spooky2 User's Guide 2025-01-24, pp.73–74,142.
// Operational output policy, not a universal hearing threshold. Zero is a programmed rest.
export function requiresBox(hz,endHz=hz){return !(hz===0&&endHz===0)&&(Math.min(hz,endHz)<20||Math.max(hz,endHz)>=20000)}
export const BOX_MESSAGE='Requer Box gerador de frequências — não conectado. Programa fora da faixa de áudio adotada: abaixo de 20 Hz ou a partir de 20.000 Hz. Sequência original preservada.';
export const waveMap={1:'sine',2:'square',3:'sawtooth',5:'triangle'};
const NUMBER='(?:\\d+(?:\\.\\d*)?|\\.\\d+)';
const TARGET=new RegExp(`^(\\[[^\\]]+\\]|(?:BLR|BCR|BLm|BCm|BL|BC|B|M|L)?${NUMBER})(?:-(${NUMBER}))?`);
export function parseCommand(raw,defaultSeconds){
 const match=raw.trim().match(TARGET);if(!match)throw Error('Comando não reconhecido: '+raw);
 const target=match[1],prefix=target.startsWith('[')?'formula':(target.match(/^[A-Za-z]+/)?.[0]||'Hz');
 const value=prefix==='formula'?target.slice(1,-1):Number(target.replace(/^[A-Za-z]+/,''));
 if(prefix!=='formula'&&!Number.isFinite(value))throw Error('Valor inválido');
 if(prefix!=='Hz'&&match[2])throw Error('Varredura de conversão não suportada');
 let rest=raw.trim().slice(match[0].length),seconds=Number(defaultSeconds),dwell=false;const directives=[];
 while(rest.trim()){
  rest=rest.trim();const m=rest.match(new RegExp(`^(=|[WwGgAaOoPpFfCc])([+-]?${NUMBER})`));
  if(!m)throw Error('Diretiva não reconhecida: '+rest);
  if(m[1]==='='){if(dwell)throw Error('Tempo duplicado');seconds=Number(m[2]);dwell=true}else directives.push({command:m[1],value:Number(m[2])});rest=rest.slice(m[0].length);
 }
 if(!Number.isFinite(seconds)||seconds<=0)throw Error('Tempo ausente ou inválido');
 return {raw,prefix,value,end:match[2]===undefined?value:Number(match[2]),seconds,directives};
}
export function compile(row){
 const raw=String(row[4]||'').trim(),tokens=raw.split(',').map(s=>s.trim());if(tokens.at(-1)==='')tokens.pop();
 let parsed;try{if(!tokens.length||tokens.some(s=>!s))throw Error('Sequência vazia ou incompleta');parsed=tokens.map(s=>parseCommand(s,row[6]));}catch(e){return {error:e.message,code:'syntax',steps:[],parsed:[]}}
 let wave=waveMap[row[7]],settings={waveform:Number(row[7]),gate:false,amplitudeVpp:null},reasons=[];const steps=[];
 const simultaneous=row[2]==='RRMD'; // All 10,679 RRMD rows verified against DatabaseText.txt.
 if(/infrared|infravermelh|\blaser\b|red light|luz vermelha|light mat|placa luminosa|beam ray|feixe de luz|\bpemf\b|pulsed e(?:lectric|lectromagnetic)? field|campo eletromagnetico pulsado/i.test(row[1]))reasons.push({code:'external',text:BOX_MESSAGE});
 if(!wave)reasons.push({code:'wave',text:'Forma de onda original ainda não suportada.'});
 for(const p of parsed){
  for(const d of p.directives){
   if(d.command==='W'&&waveMap[d.value]){wave=waveMap[d.value];settings.waveform=d.value;}
   else if(d.command==='G'&&d.value===0)settings.gate=false;
   else if(d.command==='A'&&d.value>=0&&d.value<=20){settings.amplitudeVpp=d.value;reasons.push({code:'external',text:'Requer Box gerador de frequências: tensão de saída em volts especificada no programa.'});}
   else reasons.push({code:'hardware',text:`Diretiva ${d.command}${d.value} ainda não foi implementada e validada.`});
  }
  let converted;try{converted=convertTarget(p)}catch(e){reasons.push({code:'conversion',text:e.message});continue;}
  if(requiresBox(converted.hz,converted.endHz))reasons.push({code:'external',text:BOX_MESSAGE});
  steps.push({...converted,seconds:p.seconds,wave,rest:converted.hz===0&&converted.endHz===0,output:{...settings}});
 }
 if(simultaneous)reasons.push({code:'external',text:'Requer Box gerador de frequências com saídas simultâneas compatíveis com o programa.'});
 reasons=reasons.filter((v,i,a)=>a.findIndex(x=>x.text===v.text)===i);
 const totalSeconds=simultaneous?Math.max(...parsed.map(p=>p.seconds)):parsed.reduce((a,p)=>a+p.seconds,0);
 let offset=0;const events=steps.map((s,i)=>{const event={step:i,startSeconds:simultaneous?0:offset,durationSeconds:s.seconds};offset+=s.seconds;return event;});
 const execution={mode:simultaneous?'simultaneous':'sequential',events,outputConnected:false};
 return {steps,parsed,wave:waveMap[row[7]],totalSeconds,reasons,execution,conversionProfile:CONVERSION_PROFILE.id,code:reasons[0]?.code||'audio',error:reasons.length?reasons.map(r=>r.text).join(' '):undefined};
}
export class Player{
 constructor(onStatus,contextFactory=()=>new (window.AudioContext||window.webkitAudioContext)()){this.onStatus=onStatus;this.contextFactory=contextFactory;this.token=0;this.state='stopped';this.tone=.1;this.noise=0;this.scale=1;this.repeat=false;this.waveOverride='original';this.index=0;this.elapsed=0;this.position=0;this.nodes=[]}
 load(plan){this.stop();this.plan=plan;this.report()}
 duration(){return this.plan.steps.reduce((a,s)=>a+s.seconds*this.scale,0)}
 async play(){if(!this.plan||this.plan.error||this.state==='playing'||this.state==='starting')return;const token=++this.token;this.state='starting';this.report();try{
 if(this.plan.execution?.mode==='simultaneous'||this.plan.steps.some(s=>requiresBox(s.hz,s.endHz??s.hz)||s.output?.amplitudeVpp!=null))throw Error(BOX_MESSAGE);
 const ctx=this.contextFactory();this.ctx=ctx;await ctx.resume();if(token!==this.token)return;
 if(this.plan.steps.some(s=>Math.max(s.hz,s.endHz??s.hz)>=ctx.sampleRate/2))throw Error('Frequência fora da capacidade desta saída de áudio.');
 this.gain=ctx.createGain();this.noiseGain=ctx.createGain();this.noiseGate=ctx.createGain();this.gain.connect(ctx.destination);this.noiseGain.connect(this.noiseGate);this.noiseGate.connect(ctx.destination);this.gain.gain.value=0;this.noiseGain.gain.value=0;this.noiseGate.gain.value=0;
 const buffer=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate);const data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
 this.source=ctx.createBufferSource();this.source.buffer=buffer;this.source.loop=true;this.source.connect(this.noiseGain);this.source.start();this.nodes=[this.source];
 this.started=ctx.currentTime+.03-this.position;this.state='playing';this.scheduledCycle=0;this.schedule(0);if(this.repeat){this.schedule(1);this.scheduledCycle=1}this.volumes();this.timer=setInterval(()=>this.tick(),50);this.report();
 }catch(e){if(token!==this.token)return;this.stop();this.onStatus({state:'error',message:e.message})}}
 schedule(cycle){const ctx=this.ctx,total=this.duration();let offset=cycle*total;for(const step of this.plan.steps){const duration=step.seconds*this.scale,start=this.started+offset,end=start+duration;offset+=duration;if(end<=ctx.currentTime)continue;
 const begin=Math.max(start,ctx.currentTime);this.noiseGate.gain.setValueAtTime(step.rest?0:1,begin);
 if(step.rest)continue;const osc=ctx.createOscillator();osc.type=this.waveOverride==='original'?(step.wave||this.plan.wave):this.waveOverride;
 const endHz=step.endHz??step.hz,initial=step.hz+(endHz-step.hz)*Math.max(0,(begin-start)/duration);osc.frequency.setValueAtTime(initial,begin);if(endHz!==step.hz)osc.frequency.linearRampToValueAtTime(endHz,end);
 const envelope=ctx.createGain();envelope.gain.setValueAtTime(0,begin);envelope.gain.linearRampToValueAtTime(1,Math.min(begin+.005,end));envelope.gain.setValueAtTime(1,Math.max(begin,end-.005));envelope.gain.linearRampToValueAtTime(0,end);osc.connect(envelope);envelope.connect(this.gain);osc.start(begin);osc.stop(end);this.nodes.push(osc);osc.onended=()=>{osc.disconnect();envelope.disconnect();this.nodes=this.nodes.filter(n=>n!==osc)};
 }this.noiseGate.gain.setValueAtTime(0,this.started+(cycle+1)*total)}
 volumes(){if(!this.ctx||!this.gain)return;this.gain.gain.setTargetAtTime(this.state==='playing'?this.tone*.25:0,this.ctx.currentTime,.015);this.noiseGain.gain.setTargetAtTime(this.state==='playing'?this.noise*.15:0,this.ctx.currentTime,.015)}
 updatePosition(){if(this.state==='playing')this.position=Math.max(0,this.ctx.currentTime-this.started);const total=this.duration();if(this.repeat)this.position%=total;let remaining=Math.min(this.position,total);this.index=0;while(this.index<this.plan.steps.length-1&&remaining>=this.plan.steps[this.index].seconds*this.scale){remaining-=this.plan.steps[this.index].seconds*this.scale;this.index++}this.elapsed=remaining}
 tick(){if(this.state!=='playing')return;const absolute=Math.max(0,this.ctx.currentTime-this.started),total=this.duration();if(!this.repeat&&absolute>=total){this.stop();this.onStatus({state:'finished',message:'Programa concluído'});return}if(this.repeat){const cycle=Math.floor(absolute/total);if(cycle+1>this.scheduledCycle){this.schedule(cycle+1);this.scheduledCycle=cycle+1}}this.updatePosition();this.report()}
 teardown(){clearInterval(this.timer);for(const node of this.nodes){try{node.stop()}catch{}}this.nodes=[];if(this.ctx){this.ctx.close().catch(()=>{});this.ctx=null}this.gain=null}
 pause(){if(this.state!=='playing')return;this.updatePosition();this.token++;this.teardown();this.state='paused';this.report()}
 stop(){this.token++;this.teardown();this.state='stopped';this.index=0;this.elapsed=0;this.position=0;this.report()}
 report(){const step=this.plan?.steps[this.index];this.onStatus({state:this.state,index:this.index,elapsed:this.elapsed,step,count:this.plan?.steps.length||0,scale:this.scale,position:this.position,total:this.plan?this.duration():0})}
}
