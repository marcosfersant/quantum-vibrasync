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

let rows=[],keys=[],areas=[],groups=new Map(),lastSearch=null,lastList=[],lastPrograms=0;
const normalize=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
onmessage=async({data})=>{try{
 if(data.type==='load'){
 const responses=await Promise.all([fetch('data/indice.json'),fetch('data/areas.json')]);if(responses.some(r=>!r.ok))throw Error('Não foi possível carregar o catálogo');
 [rows,areas]=await Promise.all(responses.map(r=>r.json()));
 const labels=new Map(areas.map(a=>[a.id,a.nome]));keys=rows.map(r=>normalize([r[1],r[5]||'',r[0],...(r[6]||[]).map(a=>labels.get(a)||a)].join(' ')));
 postMessage({type:'ready',count:rows.length,banks:[...new Set(rows.map(r=>r[2]))].sort(),areas});
 }else if(data.type==='group'){
 const g=groups.get(data.key);if(!g)return;
 postMessage({type:'packages',request:data.request,key:data.key,name:g.name,count:g.rows.length,page:data.page,rows:g.rows.slice(data.page*50,(data.page+1)*50)});
 }else{
 const searchKey=JSON.stringify([data.q,data.bank,data.area]);
 if(searchKey===lastSearch){postMessage({type:'results',request:data.request,count:lastList.length,programs:lastPrograms,page:data.page,groups:lastList.slice(data.page*50,(data.page+1)*50)});return;}
 const q=normalize(data.q).trim().split(/\s+/).filter(Boolean);groups=new Map();let programs=0;
 rows.forEach((r,i)=>{if((data.area==='indice'||r[7]!==false)&&(!data.bank||r[2]===data.bank)&&(!data.area||data.area==='indice'||(r[6]||[]).includes(data.area))&&q.every(t=>keys[i].includes(t))){
 const name=qvNomeBase(r[1]),key=normalize(name);if(!groups.has(key))groups.set(key,{key,name,rows:[]});groups.get(key).rows.push(r);programs++;
 }});
 const list=[...groups.values()].sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
 lastSearch=searchKey;lastPrograms=programs;lastList=list.map(g=>({key:g.key,name:g.name,count:g.rows.length,box:g.rows.filter(r=>r[8]||r[4]==='external').length,pending:g.rows.filter(r=>r[9]||!['audio','external'].includes(r[4])).length}));
 postMessage({type:'results',request:data.request,count:list.length,programs,page:data.page,groups:lastList.slice(data.page*50,(data.page+1)*50)});
 }
}catch(e){postMessage({type:'error',message:e.message})}};
