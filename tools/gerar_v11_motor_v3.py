from pathlib import Path
p=Path("quantum_vibrasync_v9_90893.html")
s=p.read_text(encoding="utf-8")
# Desliga a classificação global contínua após o catálogo básico ficar disponível.
old="_qvCategoriaAtual='todos';qvAtualizarContagens();qvMostrarAreas();_qvPreparacaoIndice=0;setTimeout(qvPrepararBancoEmSegundoPlano,30);"
new="_qvCategoriaAtual='todos';qvAtualizarContagens();qvMostrarAreas();_qvPreparacaoIndice=_tpDados.length;/* V11: classificação detalhada somente sob demanda */"
if old not in s: raise SystemExit("trecho preparação global não encontrado")
s=s.replace(old,new,1)

# Substitui a pesquisa pesada por busca leve inspirada na V3.
start=s.find("function qvPesquisarProblema(valor){")
end=s.find("\nfunction qvAbrirCategoria(id)",start)
if start<0 or end<0: raise SystemExit("função de pesquisa não encontrada")
fn=r'''function qvPesquisarProblema(valor){
  var q=normalizarNomeBanco(valor||'');
  if(q.length<2){qvMostrarAreas();return;}
  var palavras=q.split(' ').filter(function(t){return t.length>1;});
  var res=[],limite=250;
  for(var i=0;i<_tpDados.length&&res.length<limite;i++){
    var p=_tpDados[i];
    var texto=p._qvBuscaLeve;
    if(!texto){
      texto=normalizarNomeBanco([p.n||'',p.pt||'',p.base||'',p.c||'',p.src||''].join(' '));
      p._qvBuscaLeve=texto;
    }
    var ok=true;
    for(var j=0;j<palavras.length;j++){if(texto.indexOf(palavras[j])<0){ok=false;break;}}
    if(ok)res.push(p);
  }
  _qvNavNivel='busca';_qvAreaAtual='';qvFecharSelecao();
  document.getElementById('qvNavBack').style.display='inline-block';
  document.getElementById('qvNavBack').textContent='← TODAS AS ÁREAS';
  document.getElementById('qvAreaGrid').style.display='none';
  document.getElementById('tpList').style.display='grid';
  document.getElementById('qvBrowserTitle').textContent='Resultados para “'+String(valor).trim()+'”';
  document.getElementById('qvBrowserSub').textContent='Busca rápida no catálogo. Abra um resultado para carregar os detalhes.';
  document.getElementById('qvPathNote').textContent=res.length===limite?'Mostrando os primeiros '+limite+' resultados. Continue digitando para refinar.':'Resultados encontrados: '+res.length+'.';
  tpRenderizarRapido(res);
}
function tpRenderizarRapido(lista){
  var el=document.getElementById('tpList'),ct=document.getElementById('tpCount');
  if(!el)return;
  _qvGruposAtuais=lista.map(function(p){return {nome:p.base||p.pt||p.n||'Programa',programas:[p]};});
  _qvGruposVisiveis=_qvGruposAtuais;el._lista=_qvGruposAtuais;
  if(ct)ct.textContent=lista.length.toLocaleString('pt-BR')+' resultados rápidos';
  if(!lista.length){el.innerHTML='<div class="qv-path-note" style="grid-column:1/-1;">Nenhum programa localizado.</div>';return;}
  el.innerHTML=_qvGruposAtuais.map(function(g,i){
    return '<div class="tp-item" onclick="qvAbrirGrupo('+i+',this)"><div class="tp-nome">'+escHTML(g.nome)+'</div><div class="qv-program-total">Abrir detalhes</div></div>';
  }).join('');
}'''
s=s[:start]+fn+s[end:]
s=s.replace("<title>Quantum VibraSync V9</title>","<title>Quantum VibraSync V11 Teste Motor V3</title>",1)
Path("quantum_vibrasync_v11_teste_motor_v3.html").write_text(s,encoding="utf-8")
print("V11",len(s))
