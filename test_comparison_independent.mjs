import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {snapshot,changes} from './Assets/Scripts/ShotGuideComparison.ts';
const source=new URL('./Assets/Scripts/ShotGuideComparison.ts',import.meta.url);
const base=()=>({start:{x:0,y:0,z:0},end:{x:30,y:0,z:0},target:{x:0,y:0,z:-100},holdA:1,move:5,holdB:1.5,zoom:0,smooth:true});
const checks=[];
function test(name,f){try{f();checks.push({name,pass:true});}catch(e){checks.push({name,pass:false,error:e.message});}}
test('snapshot equal values',()=>assert.deepEqual(snapshot(base()),base()));
for(const key of ['start','end','target'])test('snapshot has no '+key+' alias',()=>{const p=base(),s=snapshot(p);p[key].x=999;assert.notEqual(s[key].x,999);});
test('snapshot scalar independent',()=>{const p=base(),s=snapshot(p);p.move=8;assert.equal(s.move,5);});
test('no false changes',()=>assert.deepEqual(changes(base(),snapshot(base())),[]));
for(const key of ['start','end','target'])test('correct geometry diff '+key,()=>{const p=base(),s=snapshot(p);p[key].x+=3;p[key].y+=4;const d=changes(s,p);assert.equal(d.length,1);assert.ok(d[0].endsWith('moved 5.0 cm'));assert.ok(d[0].startsWith({start:'Camera A',end:'Camera B',target:'Target'}[key]));});
for(const key of ['holdA','move','holdB'])test('only timing diff '+key,()=>{const p=base(),s=snapshot(p);p[key]+=1;assert.equal(changes(s,p).length,1);assert.deepEqual(p.start,s.start);assert.deepEqual(p.end,s.end);assert.deepEqual(p.target,s.target);});
test('zoom names explicit',()=>{const p=base(),s=snapshot(p);p.zoom=1;assert.deepEqual(changes(s,p),['Zoom: CONSTANT > TIGHTER']);});
test('pace names explicit',()=>{const p=base(),s=snapshot(p);p.smooth=false;assert.deepEqual(changes(s,p),['Pace: EASE > LINEAR']);});
test('diff does not mutate inputs',()=>{const a=base(),b=base();b.zoom=2;const before=JSON.stringify([a,b]);changes(a,b);assert.equal(JSON.stringify([a,b]),before);});
test('replay copy cannot overwrite reference or current',()=>{const current=base(),ref=snapshot(current),replay=snapshot(ref);replay.target.z=-1;replay.move=8;assert.deepEqual(ref,base());assert.deepEqual(current,base());});
const result={schema:1,source_sha256:crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex'),checks,passed:checks.filter(x=>x.pass).length,failed:checks.filter(x=>!x.pass).length,scope:'Pure snapshot/diff implementation under Node. Does not prove Lens event wiring or UI usability.'};

console.log(JSON.stringify(result));process.exitCode=result.failed?1:0;
