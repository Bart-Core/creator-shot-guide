import {Interactable} from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable";
import {ShotGuidePanelUI} from "./ShotGuidePanelUI";

/** Owns the finite rehearsal and placed endpoints. No recording, AI rating, network or persistent anchors.
 * Inputs: authored unit-scale handles, leaf sphere visuals, passive UIKit panel.
 */
@component
export class ShotGuideMain extends BaseScriptComponent {
  @ui.label("BART-CORE / story before motion")
  @ui.separator
  @input @hint("Passive UIKit panel") panel:ShotGuidePanelUI;
  @input @hint("Unit-scale detail placement handle") startHandle:SceneObject;
  @input @hint("Unit-scale reveal placement handle") endHandle:SceneObject;
  @input @hint("Existing cyan sphere visual, cloned for cue") startVisual:SceneObject;
  @input @hint("Existing gold sphere visual, cloned for trail") endVisual:SceneObject;
  @input @hint("Opening hold duration") @widget(new SliderWidget(.5,3,.5)) openingHold:number=1;
  @input @hint("Closing hold duration") @widget(new SliderWidget(.5,4,.5)) closingHold:number=1.5;
  @input @hint("Default move duration; UI offers 3, 5 and 8 seconds") @widget(new SliderWidget(3,8,1)) moveSeconds:number=5;
  @input @hint("Minimum separation, not a safety-distance assessment") @widget(new SliderWidget(5,30,1)) minDistanceCm:number=10;
  @input @hint("Draw collider outlines after preview restart") debugColliders:boolean=false;
  private phase="READY";
  private takeStart=0;
  private frozenSeconds=5;
  private from:vec3;
  private to:vec3;
  private cue:SceneObject;
  private trail:SceneObject[]=[];
  private lastInput=-1;
  private ready=false;
  private completed=0;
  private lastStage="";
  onAwake(){
    this.createEvent("OnStartEvent").bind(()=>this.start());
    this.createEvent("UpdateEvent").bind(()=>this.update());
  }
  private start(){
    if(!this.panel||!this.startHandle||!this.endHandle||!this.startVisual||!this.endVisual){console.error("SHOTGUIDE3 missing authored reference");return;}
    this.cue=this.sceneObject.copyWholeHierarchy(this.startVisual);this.cue.name="GuideCue";
    this.cue.getTransform().setWorldScale(new vec3(1.6,1.6,1.6));this.cue.enabled=false;
    for(let i=0;i<9;i++){const dot=this.sceneObject.copyWholeHierarchy(this.endVisual);dot.name="GuidePath_"+i;dot.getTransform().setWorldScale(new vec3(.35,.35,.35));this.trail.push(dot);}
    this.placement(this.startHandle);this.placement(this.endHandle);
    this.panel.onAction.add(()=>this.action());
    this.panel.onDuration.add(n=>{if(this.phase!=="READY"||[3,5,8].indexOf(n)<0)return;this.moveSeconds=n;this.showReady();console.info("SHOTGUIDE3_DURATION="+n);});
    this.ready=true;this.path();this.showReady();
  }
  private placement(o:SceneObject){
    const c=o.createComponent("ColliderComponent");c.fitVisual=false;c.debugDrawEnabled=this.debugColliders;
    const shape=Shape.createSphereShape();shape.radius=3;c.shape=shape;
    const h=o.createComponent(Interactable.getTypeName()) as Interactable;h.colliders=[c];
    const move=(e:{dragVector:vec3})=>{if(this.phase!=="READY")return;const d=e.dragVector;if(!isFinite(d.x)||!isFinite(d.y)||!isFinite(d.z))return;o.getTransform().setWorldPosition(o.getTransform().getWorldPosition().add(d));};
    h.onDragStart.add(move);h.onDragUpdate.add(move);
    h.onDragEnd.add(()=>{if(this.phase==="READY")this.showReady();});
  }
  private path(){
    this.from=this.startHandle.getTransform().getWorldPosition();this.to=this.endHandle.getTransform().getWorldPosition();
    this.trail.forEach((d,i)=>d.getTransform().setWorldPosition(vec3.lerp(this.from,this.to,(i+1)/10)));
  }
  private showReady(){
    this.phase="READY";this.sceneObject.name="GuideController_READY";this.cue.enabled=false;
    this.panel.present("SET YOUR STORY","Cyan: detail. Gold: reveal. Drag to place.","REHEARSE",this.moveSeconds,false);
  }
  private action(){
    const now=getTime();if(now-this.lastInput<.35)return;this.lastInput=now;
    if(this.phase==="TAKE"){this.phase="DONE";this.sceneObject.name="GuideController_CANCELLED";this.cue.enabled=false;this.panel.present("REHEARSAL CANCELLED","Placement kept. Refine, then try again.","REFINE",this.moveSeconds,true);return;}
    if(this.phase==="DONE"){this.showReady();return;}
    this.path();
    if(this.from.distance(this.to)<this.minDistanceCm){this.panel.present("GIVE THE STORY ROOM","Separate DETAIL and REVEAL before rehearsal.","REHEARSE",this.moveSeconds,false);console.info("SHOTGUIDE3_REJECTED=POINTS_TOO_CLOSE");return;}
    this.phase="TAKE";this.sceneObject.name="GuideController_TAKE";this.takeStart=now;this.frozenSeconds=this.moveSeconds;this.lastStage="";this.cue.enabled=true;
    console.info("SHOTGUIDE3_START="+this.frozenSeconds);
  }
  private update(){
    if(!this.ready)return;
    if(this.phase==="READY"){this.path();return;}
    if(this.phase!=="TAKE")return;
    const elapsed=getTime()-this.takeStart;
    const t=Math.max(0,Math.min(1,(elapsed-this.openingHold)/this.frozenSeconds));
    this.cue.getTransform().setWorldPosition(vec3.lerp(this.from,this.to,t*t*(3-2*t)));
    const stage=elapsed<this.openingHold?"HOLD DETAIL":t<1?"OPEN THE STORY":"HOLD REVEAL";
    if(stage!==this.lastStage){this.lastStage=stage;this.panel.present(stage,stage==="OPEN THE STORY"?"Let the cue travel. Keep your endpoints.":"Give the viewer a moment to see.","CANCEL",this.frozenSeconds,true);console.info("SHOTGUIDE3_BEAT="+stage);}
    if(elapsed>=this.openingHold+this.frozenSeconds+this.closingHold){
      this.phase="DONE";this.completed++;this.sceneObject.name="GuideController_DONE";
      this.panel.present("REHEARSAL COMPLETE","Detail -> "+this.frozenSeconds+"s move -> reveal. Refine deliberately.","REFINE",this.frozenSeconds,true);
      console.info("SHOTGUIDE3_COMPLETE="+this.completed);
    }
  }
}
