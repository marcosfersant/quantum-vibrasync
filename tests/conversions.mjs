import assert from 'node:assert/strict';
import fs from 'node:fs';
import {compile,parseCommand,Player} from '../engine.mjs';
import {convertTarget,formulaMass} from '../conversions.mjs';
const row=(s,bank='TEST')=>[0,'test',bank,[],s,0,180,1,'test'];
const target=s=>convertTarget(parseCommand(s,180));
const confirmed={id:'test-documented-fundamental',source:'Teste explícito das fórmulas, não preset recuperado da V7',confirmed:true};
const compileConfirmed=r=>compile(r,confirmed);
const close=(actual,expected,tolerance=1e-12)=>assert(Math.abs(actual-expected)/expected<tolerance,`${actual} != ${expected}`);
// Independent worked values in John White's Rev.2 table, p.4.
close(target('BL29901').hz,5201278470964.83);
close(target('BC29900').hz,5201278470964.83);
close(target('B29901').hz,5201278470964.83);
close(target('BLR9756').hz,16591860664408.60);
close(target('BCR9755').hz,16591860664408.60);
close(target('BLm9756').hz,15446181672704.60);
close(target('BCm9755').hz,15446181672704.60);
// Published MW unit factor and c / wavelength; never fold to speaker range.
close(target('M1').hz,2.2523430883e23);
close(target('M2').hz,4.5046861766e23);
close(target('L470').hz,637856293617021.276595744680851);
close(formulaMass('C47H72O14'),860.49220699454);
close(target('[C47H72O14]').hz,1.938123674960165084837882e26);
for(const bad of ['BL1','BL0','BC0','BL1.5','M0','L0','[C0]','[Xx2]','[CH4junk]','[C2(H)4]'])assert.throws(()=>target(bad));
const controlled=compileConfirmed(row('185385.792-186614.208 W1 G0 A20,190000'));
assert.equal(controlled.code,'external');assert.equal(controlled.steps[1].output.amplitudeVpp,20);
assert.equal(controlled.steps[0].output.gate,false);assert.equal(controlled.steps[0].output.waveform,1);
assert.equal(controlled.steps[0].endHz,186614.208);
// Unimplemented future directives remain explicit; parsing a voltage is not audio output.
assert.equal(compileConfirmed(row('440 G1')).code,'pending');
assert.equal(compileConfirmed(row('440 W10')).code,'pending');
assert.equal(compileConfirmed(row('440 A9')).code,'external');
const simultaneous=compileConfirmed(row('440,880,1320','RRMD'));
assert.equal(simultaneous.execution.mode,'simultaneous');
assert.deepEqual(simultaneous.execution.events.map(e=>e.startSeconds),[0,0,0]);
assert.equal(simultaneous.totalSeconds,180);
const sequential=compileConfirmed(row('440=5,880=10,440'));
assert.deepEqual(sequential.execution.events.map(e=>e.startSeconds),[0,5,15]);
assert.equal(sequential.totalSeconds,195);
let opened=0;const player=new Player(()=>{},()=>{opened++;throw Error('External output must not open browser audio')});
for(const command of ['BL29901','BC29900','BLR9756','BCR9755','BLm9756','BCm9755','M1','L470','[C47H72O14]','440 A20']){player.load(compileConfirmed(row(command)));await player.play();}
// Independent guard still blocks an unsafe plan if a caller removes its UI error.
player.load({...simultaneous,error:undefined});await player.play();assert.equal(opened,0);
const totals={programas:0,audio:0,external:0,convertedPrograms:0,convertedCommands:0,simultaneous:0,pending:0};
for(const f of fs.readdirSync('data').filter(f=>/^parte-/.test(f)))for(const r of JSON.parse(fs.readFileSync('data/'+f))){
 const p=compileConfirmed(r);totals.programas++;totals[p.code]=(totals[p.code]||0)+1;
 assert.equal(p.steps.length,p.parsed.length,`Lost step: ${r[0]}`);
 assert(p.steps.every(s=>Number.isFinite(s.hz)&&Number.isFinite(s.endHz)&&s.hz>=0&&s.seconds>0));
 const converted=p.steps.filter(s=>s.conversion);totals.convertedCommands+=converted.length;if(converted.length)totals.convertedPrograms++;
 if(p.execution.mode==='simultaneous')totals.simultaneous++;
 if(p.summary.pending)totals.pending++;
 for(const s of converted){assert.equal(s.hz,s.conversion.fundamentalHz);assert.equal(s.conversion.harmonicDivisor,1);}
}
assert.equal(totals.programas,90893);assert.equal(totals.audio,4542);assert(totals.external>0);assert(totals.mixed>0);assert.equal(totals.pending,0);assert.equal(totals.simultaneous,10679);
console.log('PASS: fórmulas publicadas, valores finitos, nenhuma etapa perdida, saídas simultâneas, diretivas presentes e bloqueio físico');
console.log('Contagens com preset sintético confirmado apenas para testar as fórmulas (não representam o catálogo publicado):',JSON.stringify(totals,null,2));
