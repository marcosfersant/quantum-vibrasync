from pathlib import Path
import json

src=Path("quantum_vibrasync_v8_90893.html")
out=Path("data/vibrasync_db_90893.json")
text=src.read_text(encoding="utf-8")
marker="var VIBRASYNC_DB="
pos=text.find(marker)
if pos<0:
    raise SystemExit("VIBRASYNC_DB não encontrado")
pos+=len(marker)
while pos<len(text) and text[pos].isspace(): pos+=1
decoder=json.JSONDecoder()
db,end=decoder.raw_decode(text[pos:])
if not isinstance(db,list):
    raise SystemExit("Banco não é lista")
if len(db)!=90893:
    raise SystemExit(f"Quantidade inesperada: {len(db)}")
out.parent.mkdir(parents=True,exist_ok=True)
out.write_text(json.dumps(db,ensure_ascii=False,separators=(",",":")),encoding="utf-8")
print("OK",len(db),out.stat().st_size)
