import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {snapshot,changes} from './Assets/Scripts/ShotGuideComparison.ts';
const base=()=>({start:{x:0,y:0,z:0},end:{x:30,y:0,z:0},target:{x:0,y:0,z:-100},holdA:1,move:5,holdB:1.5,zoom:0,smooth:true});
const checks=[];
for(const side of [0,1]) for(const bad of [NaN,Infinity,-Infinity]) for(const field of ['start','target','move']) {
 const pair=[base(),base()];if(field==='move')pair[side].move=bad;else pair[side][field].x=bad;
 const name=`invalid side ${side} ${field} ${bad}`;
 try{assert.deepEqual(changes(...pair),['Invalid plan / comparison unavailable']);checks.push({name,pass:true});}catch(e){checks.push({name,pass:false,error:e.message});}
}
const source=new URL('./Assets/Scripts/ShotGuideComparison.ts',import.meta.url);
const result={source_sha256:crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex'),checks,passed:checks.filter(c=>c.pass).length,failed:checks.filter(c=>!c.pass).length};

console.log(JSON.stringify({passed:result.passed,failed:result.failed}));process.exitCode=result.failed?1:0;
