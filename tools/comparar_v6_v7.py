from pathlib import Path
import difflib,re,json
a=Path("quantum_vibrasync_v6_revisado_90893.html").read_text(encoding="utf-8")
b=Path("quantum_vibrasync_v7_90893.html").read_text(encoding="utf-8")
# Remove o banco gigante para comparar apenas a lógica/interface.
pat=re.compile(r"var VIBRASYNC_DB=.*?;\n",re.S)
aa=pat.sub("var VIBRASYNC_DB=[BANCO_REMOVIDO_PARA_COMPARACAO];\n",a,count=1)
bb=pat.sub("var VIBRASYNC_DB=[BANCO_REMOVIDO_PARA_COMPARACAO];\n",b,count=1)
diff=list(difflib.unified_diff(aa.splitlines(),bb.splitlines(),fromfile="V6",tofile="V7",n=4))
Path("docs/diff_v6_v7_sem_banco.txt").write_text("\n".join(diff),encoding="utf-8")
# resumo de palavras-chave
keys=["voz","voice","MediaRecorder","getUserMedia","tpInicializar","qvPesquisarProblema","qvPrepararBancoEmSegundoPlano","qvCarregarBancoRapidoEmBlocos","VIBRASYNC_DB","indexedDB"]
summary={k:{"v6":aa.lower().count(k.lower()),"v7":bb.lower().count(k.lower())} for k in keys}
Path("docs/resumo_v6_v7.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding="utf-8")
print(json.dumps(summary,ensure_ascii=False))
print("diff lines",len(diff))
