from pathlib import Path
p=Path("quantum_vibrasync_v9_90893.html")
s=p.read_text(encoding="utf-8")
old="""async function qvCarregarBancoBaseV9(){
  try{
    await carregarBancoGrande();
    if(Array.isArray(VIBRASYNC_DB)&&VIBRASYNC_DB.length>=90000)return true;
  }catch(e){}
  var r=await fetch('quantum_vibrasync_v8_90893.html',{cache:'force-cache'});
  if(!r.ok)throw new Error('Falha ao carregar banco base');
  var t=await r.text();
  var a=t.indexOf('var VIBRASYNC_DB=');
  if(a<0)throw new Error('Banco base não encontrado');
  a+='var VIBRASYNC_DB='.length;
  var z=t.indexOf('];',a);
  while(z>0){try{VIBRASYNC_DB=JSON.parse(t.slice(a,z+1));break;}catch(e){z=t.indexOf('];',z+2);}}
  t=null;
  if(!Array.isArray(VIBRASYNC_DB)||VIBRASYNC_DB.length<90000)throw new Error('Banco base incompleto');
  try{await salvarBancoGrande(VIBRASYNC_DB);}catch(e){}
  return true;
}"""
new="""async function qvCarregarBancoBaseV9(){
  if(Array.isArray(VIBRASYNC_DB)&&VIBRASYNC_DB.length===90893)return true;
  var r=await fetch('data/vibrasync_db_90893.json',{cache:'force-cache'});
  if(!r.ok)throw new Error('Falha ao carregar banco VibraSync');
  VIBRASYNC_DB=await r.json();
  if(!Array.isArray(VIBRASYNC_DB)||VIBRASYNC_DB.length!==90893)throw new Error('Banco VibraSync incompleto');
  return true;
}"""
if old not in s: raise SystemExit("rotina antiga não encontrada")
s=s.replace(old,new,1)
p.write_text(s,encoding="utf-8")
print("OK",p.stat().st_size)
