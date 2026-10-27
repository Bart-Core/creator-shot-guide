/** Pure shot geometry/timing. Abstract simulation, never phone calibration. */
export type Point={x:number,y:number,z:number};
export type Projection={x:number,y:number,size:number,visible:boolean};
export const sub=(a:Point,b:Point):Point=>({x:a.x-b.x,y:a.y-b.y,z:a.z-b.z});
export const dot=(a:Point,b:Point)=>a.x*b.x+a.y*b.y+a.z*b.z;
export const length=(a:Point)=>Math.sqrt(dot(a,a));
export const mix=(a:Point,b:Point,t:number):Point=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t});
export const clamp=(x:number,a:number,b:number)=>Math.max(a,Math.min(b,x));
export function validPlan(a:Point,b:Point,target:Point,holdA:number,move:number,holdB:number):boolean{
 const values=[a.x,a.y,a.z,b.x,b.y,b.z,target.x,target.y,target.z,holdA,move,holdB];
 if(!values.every(v=>isFinite(v))||holdA<0||holdB<0||move<=0||holdA>10||holdB>10||move>60)return false;
 const path=sub(b,a),den=dot(path,path);if(den<100)return false;
 const closest=mix(a,b,clamp(dot(sub(target,a),path)/den,0,1));
 return length(sub(target,closest))>=5;
}
export function beat(elapsed:number,holdA:number,move:number,holdB:number,smooth:boolean){
 if(![elapsed,holdA,move,holdB].every(isFinite)||move<=0||holdA<0||holdB<0)return {t:0,stage:'INVALID'};
 const t=clamp((elapsed-holdA)/move,0,1);
 return {t:smooth?t*t*(3-2*t):t,stage:elapsed<holdA?'HOLD A':elapsed<holdA+move?'MOVE':elapsed<holdA+move+holdB?'HOLD B':'DONE'};
}
export function project(camera:Point,target:Point,point:Point,sizeCm:number,zoom:number):Projection{
 if(![camera.x,camera.y,camera.z,target.x,target.y,target.z,point.x,point.y,point.z,sizeCm,zoom].every(isFinite)||sizeCm<=0||zoom<=0)return {x:0,y:0,size:0,visible:false};
 const d=sub(target,camera),n=length(d);if(n<.001||!isFinite(n))return {x:0,y:0,size:0,visible:false};
 const f={x:d.x/n,y:d.y/n,z:d.z/n},h=Math.sqrt(f.x*f.x+f.z*f.z);
 const r=h>.001?{x:-f.z/h,y:0,z:f.x/h}:{x:1,y:0,z:0};
 const u={x:r.y*f.z-r.z*f.y,y:r.z*f.x-r.x*f.z,z:r.x*f.y-r.y*f.x};
 const q=sub(point,camera),depth=dot(q,f);if(depth<1)return {x:0,y:0,size:0,visible:false};
 const focal=4.5/Math.tan(25*Math.PI/180)*zoom;
 const x=dot(q,r)/depth*focal,y=dot(q,u)/depth*focal,size=sizeCm/depth*focal;
 return {x,y,size,visible:isFinite(x+y+size)&&Math.abs(x)<8+size/2&&Math.abs(y)<4.5+size/2};
}
