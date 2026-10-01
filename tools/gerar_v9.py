from pathlib import Path
import re

src = Path("quantum_vibrasync_v8_90893.html")
out = Path("quantum_vibrasync_v9_90893.html")
jsout = Path("assets/vibrasync-v9-app.js")

html = src.read_text(encoding="utf-8")
pat = re.compile(r"<script(?P<attrs>[^>]*)>(?P<body>[\\s\\S]*?)</script>", re.I)
matches = list(pat.finditer(html))
inline = [m for m in matches if "src=" not in m.group("attrs").lower()]
if not inline:
    raise SystemExit("Nenhum script inline encontrado")

target = max(inline, key=lambda m: len(m.group("body")))
body = target.group("body")
attrs = target.group("attrs")

jsout.parent.mkdir(parents=True, exist_ok=True)
jsout.write_text(body, encoding="utf-8")

replacement = '<script src="assets/vibrasync-v9-app.js" defer></script>'
html2 = html[:target.start()] + replacement + html[target.end():]
html2 = html2.replace("<title>Quantum VibraSync</title>", "<title>Quantum VibraSync V9</title>", 1)
out.write_text(html2, encoding="utf-8")

print("V8 bytes:", src.stat().st_size)
print("Bloco externalizado:", len(body.encode("utf-8")), "bytes")
print("V9 HTML bytes:", out.stat().st_size)
print("JS externo bytes:", jsout.stat().st_size)
