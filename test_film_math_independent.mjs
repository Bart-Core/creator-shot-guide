import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import * as m from './Assets/Scripts/ShotGuideFilmMath.ts';
const source=new URL('./Assets/Scripts/ShotGuideFilmMath.ts',import.meta.url);
const checks=[];
function test(name,f){try{f();checks.push({name,pass:true});}catch(e){checks.push({name,pass:false,error:e.message});}}
const a={x:0,y:0,z:0},b={x:30,y:0,z:0},t={x:0,y:0,z:-100};
test('ordinary spatial plan accepted',()=>assert.equal(m.validPlan(a,b,t,1,5,1.5),true));
test('zero camera path rejected',()=>assert.equal(m.validPlan(a,a,t,1,5,1),false));
test('target on camera path rejected',()=>assert.equal(m.validPlan(a,b,{x:15,y:0,z:0},1,5,1),false));
for(const bad of [NaN,Infinity,-Infinity]){
 test('nonfinite geometry '+String(bad),()=>assert.equal(m.validPlan({...a,x:bad},b,t,1,5,1),false));
 test('nonfinite timing '+String(bad),()=>assert.equal(m.validPlan(a,b,t,1,bad,1),false));
 test('nonfinite projection '+String(bad),()=>assert.equal(m.project(a,t,t,24,bad).visible,false));
}
for(const args of [[-1,5,1],[1,0,1],[1,-1,1],[1,61,1],[11,5,1],[1,5,11]])
 test('invalid timing '+args.join('/'),()=>assert.equal(m.validPlan(a,b,t,...args),false));
test('hold start',()=>assert.deepEqual(m.beat(0,1,5,1.5,false),{t:0,stage:'HOLD A'}));
test('move boundary',()=>assert.deepEqual(m.beat(1,1,5,1.5,false),{t:0,stage:'MOVE'}));
test('end hold boundary',()=>assert.deepEqual(m.beat(6,1,5,1.5,false),{t:1,stage:'HOLD B'}));
test('done boundary',()=>assert.deepEqual(m.beat(7.5,1,5,1.5,false),{t:1,stage:'DONE'}));
test('invalid beat is not done',()=>assert.equal(m.beat(1,0,0,0,true).stage,'INVALID'));
test('zero zoom hidden',()=>assert.equal(m.project(a,t,t,24,0).visible,false));
test('behind camera hidden',()=>assert.equal(m.project(a,t,{x:0,y:0,z:10},24,1).visible,false));
test('coincident target hidden',()=>assert.equal(m.project(a,a,t,24,1).visible,false));
test('zoom scales framing not depth ratio',()=>{
 const f={x:0,y:0,z:-50};const p=m.project(a,t,t,24,1),q=m.project(a,t,t,24,1.5);
 assert.ok(Math.abs(q.size/p.size-1.5)<1e-10);
 assert.ok(Math.abs(m.project(a,t,f,12,1).size/p.size-m.project(a,t,f,12,1.5).size/q.size)<1e-10);
});
test('camera movement changes relative size',()=>{
 const f={x:0,y:0,z:-50},c={x:0,y:0,z:-10};
 assert.notEqual(m.project(a,t,f,12,1).size/m.project(a,t,t,24,1).size,m.project(c,t,f,12,1).size/m.project(c,t,t,24,1).size);
});
const result={schema:1,source_sha256:crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex'),checks,passed:checks.filter(x=>x.pass).length,failed:checks.filter(x=>!x.pass).length,scope:'Actual pure TypeScript module under Node type stripping; not Lens runtime or usability evidence'};
const output=new URL('./guide5-independent-math.json',import.meta.url);

console.log(JSON.stringify(result));process.exitCode=result.failed?1:0;
