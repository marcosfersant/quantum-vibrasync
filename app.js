import {compile,Player,requiresBox,BOX_MESSAGE,STEP_STATUS} from './engine.mjs';
const $=id=>document.getElementById(id);let worker,ready=false,page=0,request=0,selection=0,current=null,view='home',total=0;const cache=new Map();const areaNames=new Map();let activeGroup=null,packagePage=0;
function resetDetails(){selection++;player.stop();current=null;$('player').hidden=true;$('name').textContent='Selecione um pacote';for(const id of ['meta','areasDetail','originalName','sequence','commands','compatibility'])$(id).textContent='';$('export').disabled=true;$('packages').replaceChildren()}
function openGroup(key,p=0){resetDetails();activeGroup=key;packagePage=p;worker.postMessage({type:'group',key,page:p,request:++request})}

const normalizarNomeBanco=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function qvNomeBase(nome){
  var s=String(nome||'').replace(/\s*\((?:conjunto alternativo|alternate set)\)\s*$/i,'').trim();
  if(!/\b(?:tipo|type)\s+\d+$/i.test(s)&&!/\bH\d+N\d+$/i.test(s))s=s.replace(/(?:\s+|[-_])(?:programa\s*)?#?\d+(?:[-.]\d+)?$/i,'').trim();
  if(/\bAbscessos?\b/i.test(s))return 'Abscesso';
  if(/^Cólicas? abdominais\b/i.test(s))return 'Cólicas abdominais';
  if(/\bAterosclerose\b/i.test(s))return 'Aterosclerose';
  if(/\b(?:Aorta|aórtic[ao])\b/i.test(s))return 'Aorta';
  if(/\bCircula(?:ção|tório|tória)\b/i.test(s))return 'Circulação';
  if(/^Tosse\b/i.test(s))return 'Tosse';
  if(/^(?:H1N1\s*[-–]?\s*)?Gripe suína\b|^Gripe suína\b/i.test(s))return 'Gripe suína';
  if(/^(?:H5N1\s*[-–]?\s*)?Gripe aviária\b|^Gripe aviária\b|^Vírus da gripe aviária\b/i.test(s))return 'Gripe aviária';
  if(/^Candida Albicans\b/i.test(s))return 'Candida Albicans';
  return s||String(nome||'Programa sem nome');
}
function qvNomePacote(base,indice,total,p){
  base=String(base||p&&p.pt||p&&p.n||'Programa').trim();
  if(total<=1)return base;
  var original=String(p&&p.pt||p&&p.n||'').trim();
  // Se o próprio registro traz uma variante clínica descritiva, preserve-a.
  var limpa=qvNomeBase(original);
  if(limpa&&normalizarNomeBanco(limpa)!==normalizarNomeBanco(base)&&!/^(programa|sequencia|pacote)\b/i.test(limpa))return base+' — '+limpa;
  var rotulos=['Programa Principal','Programa Complementar','Sequência Complementar','Programa de Apoio','Sequência de Apoio','Programa Associado','Sequência Associada','Programa Adicional'];
  return base+' — '+(rotulos[indice]||('Programa Complementar '+(indice)));
}

function message(text){$('message').textContent=text;clearTimeout(message.timer);message.timer=setTimeout(()=>$('message').textContent='',6500)}
const player=new Player(s=>{
 const labels={stopped:'Parado',starting:'Preparando áudio',playing:'Reproduzindo',paused:'Pausado',blocked:'Etapa restrita',finished:'Concluído',error:'Erro'};
 const value=s.step?(s.step.rest?'Pausa programada':s.step.hz==null?'Saída não confirmada':(s.step.endHz!==undefined&&s.step.endHz!==s.step.hz?s.step.hz+' → '+s.step.endHz:s.step.hz)+' Hz'):'';
 $('playStatus').textContent=s.message||((labels[s.state]||s.state)+(s.step?` · ${value} · Etapa ${s.index+1} de ${s.count} · ${Math.max(0,Math.ceil(s.step.seconds*s.scale-s.elapsed))} s`:''));
 if(s.skipped.length&&s.state!=='finished')$('playStatus').textContent+=' · Reprodução parcial; etapas puladas: '+s.skipped.join(', ');
 $('progress').value=s.total?s.position/s.total:0;
 $('play').textContent=s.state==='paused'?'Continuar':s.state==='finished'?'Reiniciar':'Iniciar';
 $('pause').disabled=s.state!=='playing';
 $('wave').disabled=$('speed').disabled=s.state!=='stopped';
 $('repeat').disabled=s.state!=='stopped'||player.plan?.code==='mixed'||['pending','external'].includes(player.plan?.code);
 $('play').disabled=['starting','playing','blocked'].includes(s.state)||['pending','external'].includes(player.plan?.code);
 $('skipStep').hidden=!s.canSkip;
 document.querySelectorAll('#sequence [data-step]').forEach(e=>e.classList.toggle('current-step',Number(e.dataset.step)===s.index));
});
function programStatus(code,counts){
 const [audio=0,rest=0,external=0,pending=0,hardware=external]=counts||[];
 if(code==='audio')return 'Totalmente compatível com a faixa de áudio';
 if(code==='mixed')return `Misto / parcial · ${audio+rest} etapa(s) compatível(is)`+(hardware?` · ${hardware} etapa(s) requer(em) Box`:'')+(pending?` · ${pending} com configuração pendente`:'');
 if(code==='pending')return 'Configuração do preset pendente'+(hardware?' · também contém etapas que requerem Box':'');
 return 'Requer Box gerador de frequências';
}
function showSteps(plan){
 $('sequence').replaceChildren();
 for(const [i,step] of plan.steps.entries()){
  const item=document.createElement('div');item.className='step-card';item.dataset.step=i;item.dataset.status=step.statusExecucao;
  const title=document.createElement('strong');title.textContent=`Etapa ${i+1} · `+({AUDIO_DISPONIVEL:'Áudio disponível',PAUSA_PROGRAMADA:'Pausa programada',REQUER_HARDWARE_EXTERNO:'Requer Box',CONFIGURACAO_PENDENTE:'Configuração pendente'}[step.statusExecucao]);
  const text=document.createElement('p');text.textContent=step.observacao;
  const detail=document.createElement('small');detail.textContent=`Comando original: ${step.comandoOriginal} · ${step.seconds} s`;
  item.append(title,text,detail);$('sequence').append(item);
 }
}
function navigate(next){$('message').textContent='';if(next!==view){player.stop();selection++;}view=next;document.querySelectorAll('.view').forEach(e=>e.classList.remove('active'));document.querySelectorAll('.nb').forEach(e=>e.classList.toggle('active',e.dataset.view===next));if(['home','programas','livre'].includes(next)){$('view-'+next).classList.add('active');if(next==='programas'){init();if(current)mount('programPlayer',compile(current));}if(next==='livre'){$('player').hidden=true}}else{$('view-modulo').classList.add('active');$('moduleName').textContent=({voz:'Voz',video:'Vídeo',foto:'Foto',bio:'Bioimpedância',arquivos:'Arquivos'})[next];$('moduleText').textContent=next==='bio'?'Módulo reservado para integração com aparelho de medição. Nenhuma leitura de bioimpedância é simulada.':next==='arquivos'?'Os programas podem ser exportados individualmente no catálogo. Importação e histórico ainda não foram reconstruídos.':'Módulo reservado para uma etapa posterior. Análise ainda não implementada nesta reconstrução.'}}
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.view)));
function init(){if(worker)return;worker=new Worker('search-worker.js');worker.onmessage=({data})=>{if(data.type==='ready'){ready=true;$('loadStatus').textContent=data.count.toLocaleString('pt-BR')+' programas disponíveis';for(const area of data.areas){areaNames.set(area.id,area.nome);const option=document.createElement('option');option.value=area.id;option.textContent=area.nome;$('area').append(option);const card=document.createElement('button');card.className='item';card.textContent=area.nome;const desc=document.createElement('small');desc.textContent=area.desc;card.append(desc);card.onclick=()=>{$('area').value=area.id;page=0;search()};$('areaCards').append(card)}for(const bank of data.banks){const o=document.createElement('option');o.value=o.textContent=bank;$('bank').append(o)}$('count').textContent='Escolha uma área ou pesquise um tratamento.';if($('search').value.trim()||$('area').value||$('bank').value)search();}else if(data.type==='results'&&data.request===request){total=data.count;page=data.page;$('count').textContent=data.count.toLocaleString('pt-BR')+' grupos · '+data.programs.toLocaleString('pt-BR')+' pacotes';$('page').textContent=`${page+1} / ${Math.max(1,Math.ceil(total/50))}`;$('previous').disabled=page===0;$('next').disabled=(page+1)*50>=total;$('list').replaceChildren();for(const g of data.groups){const b=document.createElement('button');b.className='item';b.textContent=g.name;const small=document.createElement('small');small.textContent=g.count+' pacote'+(g.count===1?'':'s')+(g.box?(g.box===g.count?' · Requer Box gerador de frequências':' · '+g.box+' pacote(s) requerem Box gerador de frequências'):'')+(g.mixed?' · '+g.mixed+' pacote(s) mistos / parciais':'')+(g.pending?' · '+g.pending+' pacote(s) com configuração pendente':'');b.append(small);b.onclick=()=>openGroup(g.key);$('list').append(b)}
}else if(data.type==='packages'&&data.request===request){$('groupTitle').textContent=data.name;$('packages').replaceChildren();for(const [i,r] of data.rows.entries()){const b=document.createElement('button');b.className='item';const display=qvNomePacote(data.name,data.page*50+i,data.count,{pt:r[1]});b.textContent=display;const small=document.createElement('small');small.textContent='Pacote · '+r[2]+' · '+programStatus(r[4],r[10]);b.append(small);b.onclick=()=>select([r[0],display,...r.slice(2)],b);$('packages').append(b)}if(data.count>50){for(const [text,delta,disabled] of [['Pacotes anteriores',-1,data.page===0],['Próximos pacotes',1,(data.page+1)*50>=data.count]]){const b=document.createElement('button');b.className='btn-s';b.textContent=text;b.disabled=disabled;b.onclick=()=>openGroup(data.key,data.page+delta);$('packages').append(b)}}$('groupTitle').scrollIntoView({block:'nearest'});
}else if(data.type==='error'){$('count').textContent=data.message;worker.terminate();worker=null;ready=false}};worker.onerror=()=>{$('count').textContent='Falha ao carregar o banco. Reabra Tratamentos para tentar novamente.';worker.terminate();worker=null;ready=false};worker.postMessage({type:'load'})}
function search(){if(!ready)return;resetDetails();$('groupTitle').textContent='Pacotes do tratamento';$('areaCards').hidden=true;worker.postMessage({type:'search',q:$('search').value,bank:$('bank').value,execution:'',area:$('area').value,page,request:++request})}
$('backAreas').onclick=()=>{clearTimeout(searchTimer);page=0;resetDetails();request++;$('search').value='';$('area').value='';$('bank').value='';$('list').replaceChildren();$('areaCards').hidden=false;$('count').textContent='Escolha uma área ou pesquise um tratamento.';$('groupTitle').textContent='Pacotes do tratamento';$('previous').disabled=$('next').disabled=true;$('page').textContent='';};
let searchTimer;$('search').oninput=()=>{clearTimeout(searchTimer);request++;searchTimer=setTimeout(()=>{page=0;search()},180)};$('bank').onchange=$('area').onchange=()=>{clearTimeout(searchTimer);page=0;search()};$('previous').onclick=()=>{page=Math.max(0,page-1);search()};$('next').onclick=()=>{if((page+1)*50<total){page++;search()}};
async function select(r,button){const token=++selection;player.stop();current=null;$('player').hidden=true;$('name').textContent='Carregando programa…';$('export').disabled=true;try{let rows=cache.get(r[3]);if(!rows){const res=await fetch(`data/parte-${String(r[3]).padStart(3,'0')}.json`);if(!res.ok)throw Error('Falha ao carregar o programa');rows=await res.json();cache.set(r[3],rows);if(cache.size>4)cache.delete(cache.keys().next().value)}if(token!==selection)return;current=rows.find(x=>x[0]===r[0]);if(!current)throw Error('Programa não encontrado');document.querySelectorAll('.item').forEach(e=>e.classList.remove('selected'));button.classList.add('selected');$('name').textContent=r[1];$('originalName').textContent=current[1];$('originalNameDetails').hidden=r[1]===current[1];$('areasDetail').textContent=(r[6]||[]).map(id=>areaNames.get(id)||id).join(' · ');$('meta').textContent=`ID ${current[0]} · Banco ${current[2]} · ${current[5]} minutos na fonte · ${current[6]} s por passo · ${current[8]}`;$('commands').textContent=current[4];const plan=compile(current);showSteps(plan);$('compatibility').textContent=programStatus(plan.code,[plan.summary.audio,plan.summary.rest,plan.summary.external,plan.summary.pending,plan.summary.hardware])+' · '+plan.steps.length+' etapas na ordem original.';$('export').disabled=false;mount('programPlayer',plan);if(innerWidth<760)$('name').scrollIntoView({block:'start'})}catch(e){if(token===selection){$('name').textContent='Não foi possível abrir';message(e.message)}}}
function mount(container,plan){
 player.stop();$(container).append($('player'));$('player').hidden=false;$('wave').value='original';$('speed').value='1';$('repeat').checked=false;player.repeat=false;player.scale=1;player.waveOverride='original';player.load(plan);
 if(['pending','external'].includes(plan.code))$('playStatus').textContent=programStatus(plan.code,[plan.summary.audio,plan.summary.rest,plan.summary.external,plan.summary.pending,plan.summary.hardware]);
}
$('prepareFree').onclick=()=>{const hz=Number($('freeHz').value),seconds=Number($('freeSeconds').value);player.stop();if(!Number.isFinite(hz)||hz<=0||requiresBox(hz)){$('player').hidden=true;message(Number.isFinite(hz)&&hz>0?BOX_MESSAGE:'Informe uma frequência positiva.');return}if(!Number.isFinite(seconds)||seconds<1||seconds>86400){$('player').hidden=true;message('Informe duração entre 1 e 86.400 segundos.');return}mount('freePlayer',compile([0,'Frequência livre','',[],String(hz)+'='+seconds,0,seconds,1]))};
$('play').onclick=()=>{player.tone=Number($('tone').value)/100;player.noise=Number($('noise').value)/100;if(player.plan?.steps.some(s=>s.statusExecucao===STEP_STATUS.audio&&Math.max(s.hz,s.endHz??s.hz)>=18000)&&!confirm('Esta sequência contém frequências entre 18.000 e 20.000 Hz. Elas podem não ser audíveis e o equipamento pode não reproduzi-las. A frequência original será preservada. Continuar?'))return;player.play()};$('skipStep').onclick=()=>{if(confirm('Pular esta etapa significa executar apenas parte do programa. A sequência completa não será reproduzida. Continuar?'))player.skipRestricted()};$('pause').onclick=()=>player.pause();$('stop').onclick=()=>player.stop();$('wave').onchange=e=>player.waveOverride=e.target.value;$('speed').onchange=e=>{player.scale=Number(e.target.value);player.report()};$('repeat').onchange=e=>player.repeat=e.target.checked;
for(const type of ['tone','noise'])$(type).oninput=e=>{player[type]=Number(e.target.value)/100;$(type+'Label').textContent=e.target.value+'%';player.volumes()};
$('export').onclick=()=>{if(!current)return;const blob=new Blob([JSON.stringify({schema:['id','nome','banco','frequencias_numericas_diretas','comandos_spooky_preservados','duracao_minutos','tamanho_passo_segundos','forma_onda','arquivo_origem'],programa:current},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`Quantum_VibraSync_Programa_${current[0]}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};
window.addEventListener('pagehide',()=>player.stop());navigate('home');
