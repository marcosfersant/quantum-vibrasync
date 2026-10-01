from pathlib import Path
src=Path("quantum_vibrasync_v7_90893.html")
out=Path("quantum_vibrasync_v10_teste_v7_90893.html")
s=src.read_text(encoding="utf-8")
s=s.replace("<title>Quantum VibraSync</title>","<title>Quantum VibraSync V10 Teste Base V7</title>",1)
out.write_text(s,encoding="utf-8")
print("OK",out.stat().st_size)
