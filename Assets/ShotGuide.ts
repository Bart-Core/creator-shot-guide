import {Interactable} from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable";

/** Local rehearsal guide. No recording, network, analytics or persistent anchors. */
@component
export class ShotGuide extends BaseScriptComponent {
  @input buttonObject: SceneObject;
  @input instruction: Text3D;
  @input buttonLabel: Text;
  @input startMarker: SceneObject;
  @input endMarker: SceneObject;
  private phase: number = 0;
  private lastInput: number = -1;
  private takeStart: number = 0;
  private startPosition: vec3;
  private endPosition: vec3;
  private cue: SceneObject;
  private trail: SceneObject[] = [];
  private pointLabels: SceneObject[] = [];

  onAwake() {
    this.createEvent("OnStartEvent").bind(() => {
      this.startPosition = this.startMarker.getTransform().getWorldPosition();
      this.endPosition = this.endMarker.getTransform().getWorldPosition();
      // Clone only the visual before adding interaction components.
      this.cue = this.sceneObject.copyWholeHierarchy(this.startMarker);
      this.cue.name = "GuideCue";
      this.cue.getTransform().setWorldScale(new vec3(1.6,1.6,1.6));
      this.cue.enabled = false;
      for (let i=0;i<9;i++) {
        const dot=this.sceneObject.copyWholeHierarchy(this.endMarker);
        dot.name="GuidePath_"+i;
        dot.getTransform().setWorldScale(new vec3(.35,.35,.35));
        this.trail.push(dot);
      }
      this.enablePlacement(this.startMarker);
      this.enablePlacement(this.endMarker);
      ["01  DETAIL","02  REVEAL"].forEach((caption)=>{
        const label=this.sceneObject.copyWholeHierarchy(this.instruction.sceneObject);
        label.name="GuideLabel_"+this.pointLabels.length;
        const text=label.getComponent("Text3D");
        text.text=caption; text.size=26;
        label.getTransform().setWorldScale(new vec3(1,1,1));
        this.pointLabels.push(label);
      });
      const collider = this.buttonObject.createComponent("ColliderComponent");
      collider.fitVisual = false;
      const shape = Shape.createBoxShape();
      shape.size = new vec3(16, 7, 2);
      collider.shape = shape;
      const button = this.buttonObject.createComponent(Interactable.getTypeName()) as Interactable;
      button.colliders = [collider];
      button.onTriggerEnd.add(() => this.advance());
      this.showPhase();
    });
    this.createEvent("UpdateEvent").bind(() => {
      if (this.phase === 0) this.updatePath();
      this.pointLabels.forEach((label,i)=>label.getTransform().setWorldPosition(
        (i===0?this.startPosition:this.endPosition).add(new vec3(0,-4,0))));
      if (this.phase !== 1) return;
      const t = Math.min(1, (getTime() - this.takeStart) / 4);
      const smooth = t * t * (3 - 2 * t);
      this.cue.getTransform().setWorldPosition(vec3.lerp(this.startPosition, this.endPosition, smooth));
      if (t >= 1) this.instruction.text = "HOLD THE REVEAL\nKeep the ending deliberate";
    });
  }
  private enablePlacement(marker:SceneObject) {
    const collider=marker.createComponent("ColliderComponent");
    collider.fitVisual=false;
    const shape=Shape.createSphereShape(); shape.radius=1.4; collider.shape=shape;
    const handle=marker.createComponent(Interactable.getTypeName()) as Interactable;
    handle.colliders=[collider];
    const move=(event:{dragVector:vec3})=>{
      if(this.phase!==0)return;
      const d=event.dragVector;
      if(!isFinite(d.x)||!isFinite(d.y)||!isFinite(d.z))return;
      marker.getTransform().setWorldPosition(marker.getTransform().getWorldPosition().add(d));
    };
    handle.onDragStart.add(move); handle.onDragUpdate.add(move);
    handle.onDragEnd.add(()=>print("SHOTGUIDE_PLACED="+marker.name));
  }
  private updatePath() {
    this.startPosition=this.startMarker.getTransform().getWorldPosition();
    this.endPosition=this.endMarker.getTransform().getWorldPosition();
    this.trail.forEach((dot,i)=>dot.getTransform().setWorldPosition(vec3.lerp(this.startPosition,this.endPosition,(i+1)/10)));
  }
  private advance() {
    const now = getTime();
    if (now - this.lastInput < 0.35) return;
    this.lastInput = now;
    if(this.phase===0){
      this.updatePath();
      if(this.startPosition.distance(this.endPosition)<10){
        this.instruction.text="GIVE THE STORY ROOM\nSeparate DETAIL and REVEAL";
        print("SHOTGUIDE_REJECTED=POINTS_TOO_CLOSE");return;
      }
    }
    this.phase = (this.phase + 1) % 3;
    if (this.phase === 1) this.takeStart = now;
    this.showPhase();
  }
  private showPhase() {
    const states = ["READY", "TAKE", "DONE"];
    this.sceneObject.name = "GuideController_" + states[this.phase];
    this.instruction.text = [
      "DETAIL  >  REVEAL\nDrag both points. Check your path.",
      "LET THE STORY OPEN\nFollow the cue. Ease into the ending.",
      "MAKE THE NEXT TAKE BETTER\nChange the distance, not the story."
    ][this.phase];
    this.buttonLabel.text = ["REHEARSE", "FINISH", "REFINE"][this.phase];
    this.cue.enabled=this.phase===1;
    print("SHOTGUIDE_STATE=" + states[this.phase]);
  }
}
