import {resolvePreset,applyPreset} from './presets.mjs';
// Syntax reference: official Spooky2 User's Guide 2025-01-24, pp.73–74,142.
// Operational output policy, not a universal hearing threshold. Zero is a programmed rest.
export function requiresBox(hz,endHz=hz){return !(hz===0&&endHz===0)&&(Math.min(hz,endHz)<20||Math.max(hz,endHz)>20000)}
export const BOX_MESSAGE='Requer Box gerador de frequências — não conectado. Etapa fora da faixa de áudio adotada: abaixo de 20 Hz ou acima de 20.000 Hz. Sequência original preservada.';
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
export const STEP_STATUS=Object.freeze({audio:'AUDIO_DISPONIVEL',rest:'PAUSA_PROGRAMADA',external:'REQUER_HARDWARE_EXTERNO',pending:'CONFIGURACAO_PENDENTE'});
export function stepRestriction(step,sampleRate=Infinity){
 if(!step)return 'Etapa não disponível';
 if(step.statusExecucao===STEP_STATUS.pending)return step.observacao||'Configuração pendente';
 if(step.statusExecucao===STEP_STATUS.external)return step.observacao||BOX_MESSAGE;
 if(!Number.isFinite(step.hz)||!Number.isFinite(step.endHz??step.hz))return 'Frequência de saída não confirmada';
 if(requiresBox(step.hz,step.endHz??step.hz)||step.output?.amplitudeVpp!=null)return BOX_MESSAGE;
 if(Math.max(step.hz,step.endHz??step.hz)>=sampleRate/2)return 'Etapa fora da capacidade desta saída de áudio';
 return null;
}
export function compile(row,presetConfig){
 const raw=String(row[4]??''),tokens=raw.split(',');if(tokens.at(-1)?.trim()==='')tokens.pop();if(!tokens.length)tokens.push('');
 let preset,presetError;try{preset=resolvePreset(row,presetConfig)}catch(e){preset=resolvePreset(row);presetError=e.message;}
 let wave=waveMap[row[7]],settings={waveform:Number(row[7]),gate:false,amplitudeVpp:null};
 const unknown=new Map(),parsed=[],steps=[];
 const simultaneous=row[2]==='RRMD';
 // Known delivery requirements are independent of frequency and preset uncertainty.
 const specialOutput=/infrared|infravermelh|\blaser\b|red light|luz vermelha|light mat|placa luminosa|beam ray|feixe de luz|\bpemf\b|pulsed e(?:lectric|lectromagnetic)? field|campo eletromagnetico pulsado/i.test(row[1]);
 for(const [i,token] of tokens.entries()){
  let p,result,problem=presetError;
  try{
   p=parseCommand(token,row[6]);parsed.push(p);
   for(const d of p.directives){
    if(d.command==='W'&&waveMap[d.value]){wave=waveMap[d.value];settings.waveform=d.value;unknown.delete('W');}
    else if(d.command==='G'&&d.value===0){settings.gate=false;unknown.delete('G');}
    else if(d.command==='A'&&d.value>=0&&d.value<=20){settings.amplitudeVpp=d.value;unknown.delete('A');}
    else unknown.set(d.command,`Diretiva ${d.command}${d.value} não confirmada`);
   }
   result=applyPreset(p,preset);
  }catch(e){problem=e.message;if(!p)parsed.push({raw:token,error:e.message,seconds:Number(row[6])||0});}
  const output={...settings};
  const pending=!!problem||!result||!wave||unknown.size>0;
  const external=specialOutput||output.amplitudeVpp!=null||simultaneous||(!pending&&requiresBox(result.hz,result.endHz));
  const statusExecucao=pending?STEP_STATUS.pending:external?STEP_STATUS.external:result.rest?STEP_STATUS.rest:STEP_STATUS.audio;
  let observacao=pending?(problem||[...unknown.values()].join('; ')||'Forma de onda não suportada.'):
   external?(simultaneous?'Requer saída simultânea compatível com o programa.':output.amplitudeVpp!=null?'Requer Box com tensão de saída especificada.':specialOutput?'Requer modalidade de saída externa compatível.':BOX_MESSAGE):result.rest?'Pausa original, sem som':'Etapa disponível para áudio; audibilidade depende do equipamento e da pessoa.';
  if(pending&&(specialOutput||output.amplitudeVpp!=null||simultaneous))observacao+=' Também requer saída externa compatível; há também um comando ainda não executável.';
  steps.push({...result,hz:pending?null:result.hz,endHz:pending?null:result.endHz,
   etapa:i+1,comandoOriginal:token,frequenciaGerada:pending?null:result.hz,
   seconds:p?.seconds??(Number(row[6])||0),wave,output,statusExecucao,observacao,
   knownExternalRequirement:specialOutput||output.amplitudeVpp!=null||simultaneous});
 }
 const summary={audio:0,rest:0,external:0,pending:0};
 for(const step of steps){const key=Object.keys(STEP_STATUS).find(k=>STEP_STATUS[k]===step.statusExecucao);summary[key]++;}
 summary.hardware=steps.filter(s=>s.statusExecucao===STEP_STATUS.external||s.knownExternalRequirement).length;
 const available=summary.audio+summary.rest;
 const code=available===steps.length?'audio':available>0?'mixed':summary.pending?'pending':'external';
 let offset=0;const events=steps.map((s,i)=>{const event={step:i,startSeconds:simultaneous?0:offset,durationSeconds:s.seconds};offset+=s.seconds;return event;});
 const totalSeconds=simultaneous?Math.max(...steps.map(s=>s.seconds)):offset;
 return {raw,steps,parsed,wave:waveMap[row[7]],totalSeconds,summary,code,preset,
  execution:{mode:simultaneous?'simultaneous':'sequential',events,outputConnected:false},
  reasons:steps.filter(s=>[STEP_STATUS.pending,STEP_STATUS.external].includes(s.statusExecucao)).map(s=>({step:s.etapa,code:s.statusExecucao===STEP_STATUS.pending?'pending':'external',text:s.observacao}))};
}
export class Player{
 constructor(onStatus,contextFactory=()=>new (window.AudioContext||window.webkitAudioContext)()){
  this.onStatus=onStatus;this.contextFactory=contextFactory;this.token=0;this.state='stopped';this.tone=.1;this.noise=0;this.scale=1;this.repeat=false;this.waveOverride='original';this.index=0;this.elapsed=0;this.position=0;this.nodes=[];this.skipped=[];
 }
 load(plan){this.stop();this.plan=plan;this.audioRate=Infinity;if(plan.code&&plan.code!=='audio')this.repeat=false;this.report()}
 timeline(rate=this.audioRate??Infinity){
  if(this.plan?.execution?.mode==='simultaneous')return [];
  let offset=0;return (this.plan?.steps||[]).flatMap((step,index)=>{
   if(stepRestriction(step,rate))return [];
   const event={step,index,start:offset,duration:step.seconds*this.scale};offset+=event.duration;return [event];
  });
 }
 duration(){return this.timeline().reduce((sum,e)=>sum+e.duration,0)}
 inactive(){const active=new Set(this.timeline().map(e=>e.index));return (this.plan?.steps||[]).flatMap((_,i)=>active.has(i)?[]:[i+1]);}
 block(){this.token++;this.teardown();this.state='blocked';this.message='Nenhuma etapa disponível para esta saída de áudio. Etapas originais preservadas e inativas.';this.report()}
 finish(){this.token++;this.teardown();this.state='finished';this.position=this.duration();const last=this.timeline().at(-1);this.index=last?.index??0;this.elapsed=last?.duration??0;this.message=this.inactive().length?'Reprodução parcial concluída. Somente as etapas compatíveis foram executadas; o programa completo não foi executado.':'Programa concluído';this.report()}
 async play(){
  if(!this.plan||this.plan.error||this.state==='playing'||this.state==='starting'||this.state==='blocked')return;
  if(this.state==='finished'){this.position=0;this.index=0;this.elapsed=0;this.skipped=[];}
  if(this.plan.code!=='audio')this.repeat=false;
  this.message='';if(!this.timeline().length){this.block();return;}
  const token=++this.token;this.state='starting';this.report();
  try{
   const ctx=this.contextFactory();this.ctx=ctx;await ctx.resume();if(token!==this.token)return;
   this.audioRate=ctx.sampleRate;if(!this.timeline().length){this.block();return;}this.updatePosition();
   this.gain=ctx.createGain();this.noiseGain=ctx.createGain();this.noiseGate=ctx.createGain();this.gain.connect(ctx.destination);this.noiseGain.connect(this.noiseGate);this.noiseGate.connect(ctx.destination);this.gain.gain.value=0;this.noiseGain.gain.value=0;this.noiseGate.gain.value=0;
   const buffer=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate);const data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
   this.source=ctx.createBufferSource();this.source.buffer=buffer;this.source.loop=true;this.source.connect(this.noiseGain);this.source.start();this.nodes=[this.source];
   this.started=ctx.currentTime+.03-this.position;this.state='playing';this.scheduledCycle=0;this.schedule(0);
   if(this.repeat){this.schedule(1);this.scheduledCycle=1;}
   this.volumes();this.timer=setInterval(()=>this.tick(),50);this.report();
  }catch(e){if(token!==this.token)return;this.token++;this.teardown();this.state='error';this.message=e.message;this.report();}
 }
 schedule(cycle){
  const ctx=this.ctx,total=this.duration();
  for(const {index:i,step,start:offset,duration} of this.timeline(ctx.sampleRate)){
   const start=this.started+cycle*total+offset,end=start+duration;
   if(end<=ctx.currentTime||(cycle===0&&i<this.index))continue;
   const begin=Math.max(start,ctx.currentTime);this.noiseGate.gain.setValueAtTime(step.rest?0:1,begin);
   if(step.rest)continue;
   const osc=ctx.createOscillator();osc.type=this.waveOverride==='original'?(step.wave||this.plan.wave):this.waveOverride;
   const endHz=step.endHz??step.hz,initial=step.hz+(endHz-step.hz)*Math.max(0,(begin-start)/duration);osc.frequency.setValueAtTime(initial,begin);if(endHz!==step.hz)osc.frequency.linearRampToValueAtTime(endHz,end);
   const envelope=ctx.createGain();envelope.gain.setValueAtTime(0,begin);envelope.gain.linearRampToValueAtTime(1,Math.min(begin+.005,end));envelope.gain.setValueAtTime(1,Math.max(begin,end-.005));envelope.gain.linearRampToValueAtTime(0,end);
   osc.connect(envelope);envelope.connect(this.gain);osc.start(begin);osc.stop(end);this.nodes.push(osc);osc.onended=()=>{osc.disconnect();envelope.disconnect();this.nodes=this.nodes.filter(n=>n!==osc)};
  }
  this.noiseGate.gain.setValueAtTime(0,this.started+(cycle+1)*total);
 }
 volumes(){if(!this.ctx||!this.gain)return;this.gain.gain.setTargetAtTime(this.state==='playing'?this.tone*.25:0,this.ctx.currentTime,.015);this.noiseGain.gain.setTargetAtTime(this.state==='playing'?this.noise*.15:0,this.ctx.currentTime,.015)}
 updatePosition(){
  if(this.state==='playing')this.position=Math.max(0,this.ctx.currentTime-this.started);
  const total=this.duration();if(this.repeat&&total)this.position%=total;
  const events=this.timeline(),event=events.find(e=>this.position<e.start+e.duration)||events.at(-1);
  this.index=event?.index??0;this.elapsed=event?Math.max(0,Math.min(event.duration,this.position-event.start)):0;
 }
 tick(){
  if(this.state!=='playing')return;const absolute=Math.max(0,this.ctx.currentTime-this.started),total=this.duration();
  if(!this.repeat&&absolute>=total){this.finish();return;}
  if(this.repeat){const cycle=Math.floor(absolute/total);if(cycle+1>this.scheduledCycle){this.schedule(cycle+1);this.scheduledCycle=cycle+1;}}
  this.updatePosition();this.report();
 }
 teardown(){clearInterval(this.timer);for(const node of this.nodes){try{node.stop()}catch{}}this.nodes=[];if(this.ctx){this.ctx.close().catch(()=>{});this.ctx=null}this.gain=null;}
 pause(){if(this.state!=='playing')return;this.tick();if(this.state!=='playing')return;this.updatePosition();this.token++;this.teardown();this.state='paused';this.report()}
 stop(){this.token++;this.teardown();this.state='stopped';this.index=0;this.elapsed=0;this.position=0;this.skipped=[];this.message='';this.report()}
 report(){const step=this.plan?.steps[this.index];this.onStatus({state:this.state,message:this.message,index:this.index,elapsed:this.elapsed,step,count:this.plan?.steps.length||0,scale:this.scale,position:this.position,total:this.plan?this.duration():0,skipped:this.inactive(),canSkip:false})}
}
