import {Interactable} from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable";
import {ShotGuidePanelUI} from "./ShotGuidePanelUI";
import {beat,validPlan,project,Point,mix} from "./ShotGuideFilmMath";
import {Plan,snapshot,changes} from "./ShotGuideComparison";
/** Finite virtual-camera rehearsal. Authored A/B/TARGET and passive UI. No phone tracking. */
@component
export class ShotGuideRevealMain extends BaseScriptComponent {
 @ui.label("BART-CORE / Reveal rehearsal") @ui.separator
 @input @hint("Passive UIKit view") panel:ShotGuidePanelUI;
 @input @hint("Camera A unit-scale handle") startHandle:SceneObject;
 @input @hint("Camera B unit-scale handle") endHandle:SceneObject;
 @input @hint("Independent subject target") targetHandle:SceneObject;
 @input @hint("Cyan visual template") startVisual:SceneObject;
 @input @hint("Gold visual template") endVisual:SceneObject;
 @input @hint("Start hold seconds") @widget(new SliderWidget(0,3,.5)) openingHold:number=1;
 @input @hint("End hold seconds") @widget(new SliderWidget(0,3,.5)) closingHold:number=1.5;
 @input @hint("Move seconds") @widget(new SliderWidget(3,8,1)) moveSeconds:number=5;
 @input @hint("Ease movement rather than constant speed") smooth:boolean=true;
 @input @hint("Draw collider outlines after restart") debugColliders:boolean=false;
 private phase="PLAN";private takeStart=0;private ready=false;private lastInput=-1;
 private a:vec3;private b:vec3;private target:vec3;private cue:SceneObject;
 private pathDots:SceneObject[]=[];private sightDots:SceneObject[]=[];
 private zoom=0;private sampleEnd=false;private lastStage="";private before="First rehearsal";
 private frozen={a:1,m:5,b:1.5,z:0,s:true};
 private reference:Plan=null;private replayPlan:Plan=null;private replayKind="CURRENT";
 onAwake(){this.createEvent("OnStartEvent").bind(()=>this.start());this.createEvent("UpdateEvent").bind(()=>this.update());}
 private start(){
  if(!this.panel||!this.startHandle||!this.endHandle||!this.targetHandle||!this.startVisual||!this.endVisual){console.error("SHOTGUIDE4 missing reference");return;}
  this.cue=this.sceneObject.copyWholeHierarchy(this.startVisual);this.cue.name="GuideCameraCue";this.cue.getTransform().setWorldScale(new vec3(1.7,1.7,1.7));
  for(let i=0;i<9;i++){const d=this.sceneObject.copyWholeHierarchy(this.endVisual);d.name="GuidePath_"+i;d.getTransform().setWorldScale(new vec3(.35,.35,.35));this.pathDots.push(d);}
  for(let i=0;i<6;i++){const d=this.sceneObject.copyWholeHierarchy(this.startVisual);d.name="GuideSight_"+i;d.getTransform().setWorldScale(new vec3(.22,.22,.22));this.sightDots.push(d);}
  [this.startHandle,this.endHandle,this.targetHandle].forEach(o=>this.placement(o));
  this.panel.onAction.add(()=>this.action());
  this.panel.onDuration.add(n=>this.change(()=>{this.moveSeconds=n;}));
  this.panel.onHoldA.add(()=>this.change(()=>{this.openingHold=this.openingHold>=2?0:this.openingHold+.5;}));
  this.panel.onHoldB.add(()=>this.change(()=>{this.closingHold=this.closingHold>=2?0:this.closingHold+.5;}));
  this.panel.onZoom.add(()=>this.change(()=>{this.zoom=(this.zoom+1)%3;}));
  this.panel.onEase.add(()=>this.change(()=>{this.smooth=!this.smooth;}));
  this.panel.onView.add(()=>this.change(()=>{this.sampleEnd=!this.sampleEnd;}));
  this.panel.onSaveReference.add(()=>this.saveReference());
  this.panel.onReplayReference.add(()=>{if(this.phase==="PLAN"&&this.reference)this.begin(this.reference,"REFERENCE");});
  this.ready=true;this.plan();
 }
 private change(f:()=>void){if(this.phase!=="PLAN")return;f();this.present();console.info("SHOTGUIDE4_PLAN="+this.settings());}
 private settings(){return this.openingHold+" / "+this.moveSeconds+" / "+this.closingHold+"s | "+["CONSTANT","TIGHTER","WIDER"][this.zoom]+" | "+(this.smooth?"EASE":"LINEAR");}
 private current():Plan{return snapshot({start:this.startHandle.getTransform().getWorldPosition(),end:this.endHandle.getTransform().getWorldPosition(),target:this.targetHandle.getTransform().getWorldPosition(),holdA:this.openingHold,move:this.moveSeconds,holdB:this.closingHold,zoom:this.zoom,smooth:this.smooth});}
 private saveReference(){
  if(this.phase!=="PLAN")return;const p=this.current();
  if(!validPlan(p.start,p.end,p.target,p.holdA,p.move,p.holdB)){this.present("INVALID PATH OR TIMING");return;}
  this.reference=snapshot(p);this.before="Reference saved. Change one decision.";
  this.present();console.info("SHOTGUIDE5_REFERENCE="+JSON.stringify(this.reference));
 }
 private begin(p:Plan,kind:string){
  if(!validPlan(p.start,p.end,p.target,p.holdA,p.move,p.holdB)){this.present("INVALID PATH OR TIMING");return;}
  this.replayPlan=snapshot(p);this.replayKind=kind;
  [this.startHandle,this.endHandle,this.targetHandle].forEach(o=>o.enabled=false);
  this.a=new vec3(p.start.x,p.start.y,p.start.z);this.b=new vec3(p.end.x,p.end.y,p.end.z);this.target=new vec3(p.target.x,p.target.y,p.target.z);
  this.pathDots.forEach((d,i)=>d.getTransform().setWorldPosition(vec3.lerp(this.a,this.b,(i+1)/10)));
  this.frozen={a:p.holdA,m:p.move,b:p.holdB,z:p.zoom,s:p.smooth};this.phase="TAKE";this.sceneObject.name="GuideController_TAKE_"+kind;this.takeStart=getTime();this.lastStage="";
  this.present("HOLD A");console.info("SHOTGUIDE5_START="+kind+" "+JSON.stringify(this.replayPlan));
 }
 private placement(o:SceneObject){
  const c=o.createComponent("ColliderComponent");c.fitVisual=false;c.debugDrawEnabled=this.debugColliders;const shape=Shape.createSphereShape();shape.radius=3;c.shape=shape;
  const h=o.createComponent(Interactable.getTypeName()) as Interactable;h.colliders=[c];
  const move=(e:{dragVector:vec3})=>{if(this.phase!=="PLAN")return;const d=e.dragVector;if(!isFinite(d.x+d.y+d.z))return;o.getTransform().setWorldPosition(o.getTransform().getWorldPosition().add(d));};
  h.onDragStart.add(move);h.onDragUpdate.add(move);h.onDragEnd.add(()=>{if(this.phase==="PLAN")this.present();});
 }
 private geometry(){this.a=this.startHandle.getTransform().getWorldPosition();this.b=this.endHandle.getTransform().getWorldPosition();this.target=this.targetHandle.getTransform().getWorldPosition();this.pathDots.forEach((d,i)=>d.getTransform().setWorldPosition(vec3.lerp(this.a,this.b,(i+1)/10)));}
 private plan(){this.phase="PLAN";this.sceneObject.name="GuideController_PLAN";[this.startHandle,this.endHandle,this.targetHandle].forEach(o=>o.enabled=true);this.geometry();this.present();}
 private present(stage="PLAN YOUR REVEAL"){
  this.panel.present(stage,this.before,this.phase==="TAKE"?"CANCEL":this.phase==="PLAN"?"REHEARSE":"REFINE",this.moveSeconds,this.phase!=="PLAN");
  const p=this.phase==="PLAN"?this.current():this.replayPlan||this.current();
  this.panel.settings(p.holdA,p.holdB,["CONSTANT","TIGHTER","WIDER"][p.zoom],p.smooth,this.sampleEnd);
  this.panel.comparison(!!this.reference,this.reference?changes(this.reference,this.current()):[],this.phase==="PLAN"?"CURRENT":this.replayKind);
 }
 private action(){
  const now=getTime();if(now-this.lastInput<.35)return;this.lastInput=now;
  if(this.phase==="TAKE"){this.phase="CANCELLED";this.sceneObject.name="GuideController_CANCELLED";this.present("CANCELLED / NOT A TAKE");return;}
  if(this.phase!=="PLAN"){this.plan();return;}
  this.geometry();if(!validPlan(this.a,this.b,this.target,this.openingHold,this.moveSeconds,this.closingHold)){this.present("INVALID PATH OR TIMING");console.info("SHOTGUIDE4_REJECTED=GEOMETRY_OR_TIME");return;}
  this.begin(this.current(),"CURRENT");
 }
 private draw(t:number,elapsed:number,stage:string){
  const q=mix(this.a,this.b,t),camera=new vec3(q.x,q.y,q.z);this.cue.getTransform().setWorldPosition(camera);
  this.sightDots.forEach((d,i)=>d.getTransform().setWorldPosition(vec3.lerp(camera,this.target,(i+1)/7)));
  const z=this.phase==="TAKE"?this.frozen.z:this.zoom,factor=z===1?1+.5*t:z===2?1-.3*t:1;
  const foreground:Point={x:this.target.x-8,y:this.target.y-3,z:this.target.z+18};
  this.panel.framing(project(camera,this.target,foreground,14,factor),project(camera,this.target,this.target,24,factor),elapsed,(this.phase==="TAKE"?this.replayKind+" / ":"")+stage,factor);
 }
 private update(){
  if(!this.ready)return;if(this.phase==="PLAN"){this.geometry();this.draw(this.sampleEnd?1:0,0,this.sampleEnd?"FRAME B":"FRAME A");return;}if(this.phase!=="TAKE")return;
  const e=getTime()-this.takeStart,f=this.frozen,step=beat(e,f.a,f.m,f.b,f.s);this.draw(step.t,e,step.stage);
  if(step.stage!==this.lastStage){this.lastStage=step.stage;this.present(step.stage);console.info("SHOTGUIDE4_BEAT="+step.stage);}
  if(step.stage==="DONE"){this.before=this.replayKind+" rehearsal complete. Compare or refine.";this.phase="DONE";this.sceneObject.name="GuideController_DONE_"+this.replayKind;this.present("REHEARSED / NOT RECORDED");console.info("SHOTGUIDE5_COMPLETE="+this.replayKind+" "+e.toFixed(3));}
 }
}
