/** Value-only rehearsal reference. No scene objects, scores or camera claims. */
export type Position={x:number,y:number,z:number};
export type Plan={start:Position,end:Position,target:Position,holdA:number,move:number,holdB:number,zoom:number,smooth:boolean};
export function snapshot(p:Plan):Plan{
 const point=(v:Position):Position=>({x:v.x,y:v.y,z:v.z});
 return {start:point(p.start),end:point(p.end),target:point(p.target),holdA:p.holdA,move:p.move,holdB:p.holdB,zoom:p.zoom,smooth:p.smooth};
}
export function changes(reference:Plan,current:Plan):string[]{
 const finite=(p:Plan)=>[p.start.x,p.start.y,p.start.z,p.end.x,p.end.y,p.end.z,p.target.x,p.target.y,p.target.z,p.holdA,p.move,p.holdB,p.zoom].every(Number.isFinite);
 if(!finite(reference)||!finite(current))return ['Invalid plan / comparison unavailable'];
 const out:string[]=[];
 const moved=(a:Position,b:Position)=>Math.sqrt((a.x-b.x)**2+(a.y-b.y)**2+(a.z-b.z)**2);
 for(const key of ['start','end','target'] as const){const d=moved(reference[key],current[key]);if(d>.01)out.push(({start:'Camera A',end:'Camera B',target:'Target'})[key]+' moved '+d.toFixed(1)+' cm');}
 for(const key of ['holdA','move','holdB'] as const)if(reference[key]!==current[key])out.push(({holdA:'Hold A',move:'Move',holdB:'Hold B'})[key]+': '+reference[key]+' > '+current[key]+'s');
 const zoom=['CONSTANT','TIGHTER','WIDER'];
 if(reference.zoom!==current.zoom)out.push('Zoom: '+zoom[reference.zoom]+' > '+zoom[current.zoom]);
 if(reference.smooth!==current.smooth)out.push('Pace: '+(reference.smooth?'EASE':'LINEAR')+' > '+(current.smooth?'EASE':'LINEAR'));
 return out;
}
