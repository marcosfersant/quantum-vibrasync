from pathlib import Path
import difflib,re,json
a=Path("quantum_vibrasync_v7_90893.html").read_text(encoding="utf-8")
b=Path("quantum_vibrasync_v8_90893.html").read_text(encoding="utf-8")
pat=re.compile(r"var VIBRASYNC_DB=.*?;\n",re.S)
aa=pat.sub("var VIBRASYNC_DB=[BANCO_REMOVIDO_PARA_COMPARACAO];\n",a,count=1)
bb=pat.sub("var VIBRASYNC_DB=[BANCO_REMOVIDO_PARA_COMPARACAO];\n",b,count=1)
diff=list(difflib.unified_diff(aa.splitlines(),bb.splitlines(),fromfile="V7",tofile="V8",n=5))
Path("docs/diff_v7_v8_sem_banco.txt").write_text("\n".join(diff),encoding="utf-8")
keys=["voz","voice","getUserMedia","tpInicializar","qvPesquisarProblema","qvPrepararBancoEmSegundoPlano","qvCarregarBancoRapidoEmBlocos","indexedDB","qvIniciar","cmd","wave"]
summary={k:{"v7":aa.lower().count(k.lower()),"v8":bb.lower().count(k.lower())} for k in keys}
Path("docs/resumo_v7_v8.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding="utf-8")
print(json.dumps(summary,ensure_ascii=False))
print("diff lines",len(diff))
