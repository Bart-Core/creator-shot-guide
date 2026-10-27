from pathlib import Path
import hashlib,json,sys,shutil
root=Path(__file__).resolve().parent
source=Path(sys.argv[1]).resolve()
rows=json.loads((root/'dependencies.json').read_text())['packages']
for row in rows:
 p=source/row['name']
 if p.is_symlink() or not p.is_file() or hashlib.sha256(p.read_bytes()).hexdigest()!=row['sha256']:raise SystemExit('Missing or different dependency: '+row['name'])
for row in rows:
 p=root/'Packages'/row['name']
 if p.exists() and hashlib.sha256(p.read_bytes()).hexdigest()!=row['sha256']:raise SystemExit('Refuse to overwrite changed file: '+row['name'])
for row in rows:shutil.copy2(source/row['name'],root/'Packages'/row['name'])
print('Exact dependency bytes restored; no Lens import/runtime claim.')
