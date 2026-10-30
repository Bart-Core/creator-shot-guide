import Event from "SpectaclesInteractionKit.lspkg/Utils/Event";
import {Frame} from "SpectaclesUIKit.lspkg/Scripts/Components/Frame/Frame";
import {BackPlate} from "SpectaclesUIKit.lspkg/Scripts/BackPlate";
import {Button} from "SpectaclesUIKit.lspkg/Scripts/Components/Button/Button";
import {FlexLayout} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexLayout";
import {FlexItem} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexItem";
import {FlexAlign,FlexDirection,FlexJustify} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexTypes";
import {Projection,clamp} from "./ShotGuideFilmMath";
import {RoundedRectangle,RoundedRectBlendMode} from "SpectaclesUIKit.lspkg/Scripts/Visuals/RoundedRectangle/RoundedRectangle";

// Passive UIKit view. Main owns timing, geometry and completed/cancelled state.
// Typography is centralized; text-only controls are deliberate, no missing assets.
const TYPE_SCALE={Title2:{size:93,weight:700},Headline2:{size:62,weight:700},Body:{size:54,weight:500},Button:{size:54,weight:700},Caption:{size:48,weight:500}};
type Role=keyof typeof TYPE_SCALE;
function applyTextRole(t:Text,role:Role){t.size=TYPE_SCALE[role].size;(t as Text & {weight?:number}).weight=TYPE_SCALE[role].weight;}

@component
export class ShotGuidePanelUI extends BaseScriptComponent {
  @ui.label("BART-CORE / Shot Guide control surface")
  @ui.separator
  @input @hint("Panel width in centimeters") @widget(new SliderWidget(38,48,1)) widthCm:number=42;
  @input @hint("Panel heading") title:string="SHOT GUIDE";
  @input('vec4','{0.35,0.95,1,1}') @hint("Detail accent color") @widget(new ColorWidget()) detailColor:vec4;
  @input('vec4','{1,0.78,0.28,1}') @hint("Reveal accent color") @widget(new ColorWidget()) revealColor:vec4;
  public onAction=new Event<void>();
  public onDuration=new Event<number>();
  public onHoldA=new Event<void>();public onHoldB=new Event<void>();
  public onZoom=new Event<void>();public onEase=new Event<void>();public onView=new Event<void>();
  public onSaveReference=new Event<void>();public onReplayReference=new Event<void>();
  private editPage:SceneObject;private comparePage:SceneObject;private framePage:SceneObject;private currentPage=0;private wasLocked=false;
  private differenceText:Text;private referenceText:Text;private referenceButton:Text;
  private compareState={saved:false,differences:[] as string[],kind:"CURRENT"};
  private lastButtonRelease=-1;
  private holdAText:Text;private holdBText:Text;private zoomText:Text;private easeText:Text;private viewText:Text;
  private clockText:Text;private projected:{object:SceneObject,plate:BackPlate,label:Text}[]=[];
  private simulationFrame:SceneObject;
  private options={a:1,b:1.5,zoom:"CONSTANT",smooth:true,end:false};
  private statusText:Text;
  private bodyText:Text;
  private actionText:Text;
  private durationLabels:Text[]=[];
  private pendingItems:{layout:FlexLayout,item:FlexItem}[]=[];
  private message={status:"SET YOUR STORY",body:"Place cyan DETAIL and gold REVEAL",action:"REHEARSE",seconds:5,locked:false};

  onAwake(){this.createEvent("OnStartEvent").bind(()=>this.build());}
  private build(){
    this.sceneObject.createComponent("Component.Canvas");
    // A real UIKit Frame lets the wearer move controls away from busy scenery.
    // Additive AR cannot promise an opaque panel over the physical world.
    const window=this.sceneObject.createComponent(Frame.getTypeName()) as Frame;
    window.autoShowHide=false;window.autoScaleContent=false;window.allowScaling=false;
    window.onInitialized.add(()=>{
      window.innerSize=new vec2(this.widthCm,36);window.padding=new vec2(1,1);
      window.showCloseButton=false;window.showFollowButton=false;
      this.buildContent(window);
    });
  }
  private buildContent(window:Frame){
    const content=this.obj(window.contentTransform.getSceneObject(),"Content",new vec3(0,0,.6));
    const col=this.flex(content,FlexDirection.Column,this.widthCm,36,.5,1.5);
    const f=col.getComponent(FlexLayout.getTypeName()) as FlexLayout;
    f.onLayoutComplete.add(r=>window.innerSize=new vec2(r.containerWidth,r.containerHeight));
    this.rowText(col,this.title,"Title2",this.widthCm-3,3);
    this.statusText=this.rowText(col,"SET YOUR STORY","Headline2",this.widthCm-3,2);
    this.bodyText=this.rowText(col,this.message.body,"Body",this.widthCm-3,2);
    this.item(col,this.widthCm-3,4,row=>{
      const line=this.flex(row,FlexDirection.Row,this.widthCm-3,4,1,0);
      this.button(line,"GuideEditTab","EDIT",11,4,()=>this.page(0));
      this.button(line,"GuideFrameTab","FRAME",11,4,()=>this.page(1));
      this.button(line,"GuideCompareTab","COMPARE",11,4,()=>this.page(2));
    });
    this.item(col,this.widthCm-3,16,host=>{
    this.editPage=this.flex(host,FlexDirection.Column,this.widthCm-3,14,.5,0);
    this.comparePage=this.flex(host,FlexDirection.Column,this.widthCm-3,14,.5,0);
    this.framePage=this.flex(host,FlexDirection.Column,this.widthCm-3,16,.3,0);
    const edit=this.editPage;
    this.item(edit,this.widthCm-3,4,row=>{
      const line=this.flex(row,FlexDirection.Row,this.widthCm-3,4,1,0);
      [3,5,8].forEach(n=>{
        const label=this.button(line,"GuideDuration"+n,n+"s MOVE",10,4,()=>this.onDuration.invoke(n));
        this.durationLabels.push(label);
      });
    });
    this.item(edit,this.widthCm-3,4,row=>{
      const line=this.flex(row,FlexDirection.Row,this.widthCm-3,4,1,0);
      this.holdAText=this.button(line,"GuideHoldA","HOLD A 1s",17,4,()=>this.onHoldA.invoke());
      this.holdBText=this.button(line,"GuideHoldB","HOLD B 1.5s",17,4,()=>this.onHoldB.invoke());
    });
    this.item(edit,this.widthCm-3,4,row=>{
      const line=this.flex(row,FlexDirection.Row,this.widthCm-3,4,1,0);
      this.zoomText=this.button(line,"GuideZoom","ZOOM CONSTANT",20,4,()=>this.onZoom.invoke());
      this.easeText=this.button(line,"GuideEase","EASE",14,4,()=>this.onEase.invoke());
    });
    this.referenceText=this.rowText(this.comparePage,"Save a reference, then edit one decision.","Body",this.widthCm-3,2);
    this.differenceText=this.rowText(this.comparePage,"No reference saved","Body",this.widthCm-3,6);
    this.item(this.comparePage,this.widthCm-3,4,row=>{
      const line=this.flex(row,FlexDirection.Row,this.widthCm-3,4,1,0);
      this.button(line,"GuideSaveReference","SAVE REFERENCE",17,4,()=>this.onSaveReference.invoke());
      this.referenceButton=this.button(line,"GuideReplayReference","PLAY REFERENCE",17,4,()=>this.onReplayReference.invoke());
    });
    this.rowText(this.framePage,"SIMULATION / not your phone","Caption",this.widthCm-3,1.5);
    this.item(this.framePage,25,10,row=>{
      row.name="GuideSyntheticFrame";
      this.simulationFrame=row;
      const border=row.createComponent(BackPlate.getTypeName()) as BackPlate;border.size=new vec2(16,9);
      ["GuideSimBackground","GuideSimForeground"].forEach((name,i)=>{
        const object=this.obj(row,name,new vec3(0,0,.6+i*.6));
        const plate=object.createComponent(BackPlate.getTypeName()) as BackPlate;
        const label=this.text(this.obj(object,"Label",new vec3(0,0,.6)),i?"NEAR":"FAR","Caption",4,2,new vec4(.02,.02,.02,1));
        this.projected.push({object,plate,label});
      });
    });
    this.clockText=this.rowText(this.framePage,"FRAME A / illustrative optics","Caption",this.widthCm-3,1.5);this.clockText.getSceneObject().name="GuideSimulationReadout";
    this.viewText=this.button(this.framePage,"GuideView","COMPARE FRAME A / B",this.widthCm-3,3,()=>this.onView.invoke());
    });
    this.actionText=this.button(col,"GuideAction","REHEARSE",this.widthCm-3,4,()=>this.onAction.invoke());
    this.rowText(col,"Drag the frame to a clear background / stay still","Caption",this.widthCm-3,1.5);
    this.render();
    const register=this.createEvent("DelayedCallbackEvent");
    register.bind(()=>{
      this.pendingItems.forEach(p=>p.layout.addItems([p.item]));
      // Decorative plates are not controls: their broad near-field colliders
      // must not compete with the actual UIKit buttons inside the panel.
      [this.simulationFrame.getComponent(BackPlate.getTypeName()) as BackPlate,...this.projected.map(p=>p.plate)].forEach(p=>{p.interactable.enabled=false;p.interactionPlane.enabled=false;});
      this.projected.forEach((o,i)=>{const rr=o.object.getComponent(RoundedRectangle.getTypeName()) as RoundedRectangle;if(rr){rr.gradient=false;rr.backgroundColor=i?this.detailColor:this.revealColor;}});
      const frame=this.simulationFrame.getComponent(RoundedRectangle.getTypeName()) as RoundedRectangle;
      if(frame){frame.gradient=false;frame.backgroundColor=new vec4(.06,.08,.11,1);frame.borderColor=new vec4(.65,.75,.8,1);}
      const backing=window.roundedRectangle;
      if(backing){backing.gradient=false;backing.opacity=1;backing.blendMode=RoundedRectBlendMode.Normal;backing.backgroundColor=new vec4(.22,.48,.68,1);backing.borderColor=new vec4(.35,.95,1,1);}
      this.page(0);this.render();
      console.info("[ShotGuideUI] built "+this.pendingItems.length+" layout items");
    });
    register.reset(.1);
  }
  present(status:string,body:string,action:string,seconds:number,locked:boolean){
    this.message={status,body,action,seconds,locked}; this.render();
  }
  settings(a:number,b:number,zoom:string,smooth:boolean,end:boolean){this.options={a,b,zoom,smooth,end};this.render();}
  comparison(saved:boolean,differences:string[],kind:string){this.compareState={saved,differences,kind};this.render();}
  private page(page:number){this.currentPage=page;if(this.editPage){this.editPage.enabled=page===0;this.framePage.enabled=page===1;this.comparePage.enabled=page===2;}this.render();}
  framing(fg:Projection,bg:Projection,elapsed:number,stage:string,zoom:number){
    if(!this.clockText)return;
    [bg,fg].forEach((p,i)=>{
      const o=this.projected[i];const left=clamp(p.x-p.size/2,-8,8),right=clamp(p.x+p.size/2,-8,8);
      const low=clamp(p.y-p.size/2,-4.5,4.5),high=clamp(p.y+p.size/2,-4.5,4.5);
      o.object.enabled=p.visible&&right-left>.1&&high-low>.1;
      if(o.object.enabled){o.object.getTransform().setLocalPosition(new vec3((left+right)/2,(low+high)/2,.6+i*.6));o.plate.size=new vec2(right-left,high-low);}
    });
    this.clockText.text=stage+" / "+elapsed.toFixed(1)+"s / lens "+zoom.toFixed(2)+" sim";
    this.clockText.getSceneObject().name="GuideSim_"+stage.replace(/ /g,"_")+"_Z"+zoom.toFixed(2)+"_FG"+fg.size.toFixed(2)+"_BG"+bg.size.toFixed(2);
  }
  private render(){
    if(!this.statusText)return;
    if(this.message.locked!==this.wasLocked){this.wasLocked=this.message.locked;this.page(this.message.locked?1:0);}
    this.statusText.text=this.message.status;this.bodyText.text=this.message.body;this.actionText.text=this.message.action;
    if(this.referenceText){
      this.referenceText.text=this.compareState.saved?"REFERENCE SAVED / editing keeps it unchanged":"Save a reference, then edit one decision.";
      const d=this.compareState.differences;
      this.differenceText.text=!this.compareState.saved?"No reference yet":d.length?d.slice(0,4).join("\n")+(d.length>4?"\n+ "+(d.length-4)+" more changes":""):"Same plan / no parameters changed";
      this.differenceText.getSceneObject().name="GuideComparison_"+this.compareState.kind+"_"+d.length;
      this.referenceButton.text=this.message.locked?"REPLAY LOCKED":this.compareState.saved?"PLAY REFERENCE":"SAVE FIRST";
      if(this.message.action==="REHEARSE")this.actionText.text="PLAY CURRENT PLAN";
    }
    this.durationLabels.forEach((t,i)=>{t.text=[3,5,8][i]+"s"+(this.message.locked?" LOCKED":" MOVE");t.textFill.color=([3,5,8][i]===this.message.seconds?this.detailColor:new vec4(1,1,1,this.message.locked?.45:1));});
    if(this.holdAText){const suffix=this.message.locked?" LOCK":"";this.holdAText.text="HOLD A "+this.options.a+"s"+suffix;this.holdBText.text="HOLD B "+this.options.b+"s"+suffix;this.zoomText.text="ZOOM "+this.options.zoom;this.easeText.text=this.options.smooth?"EASE":"LINEAR";this.viewText.text=this.message.locked?"PARAMETERS LOCKED":"PREVIEW "+(this.options.end?"B":"A")+" / SWITCH";}
  }
  private obj(parent:SceneObject,name:string,position?:vec3){
    const o=global.scene.createSceneObject(name);o.setParent(parent);
    if(position)o.getTransform().setLocalPosition(position);return o;
  }
  private flex(parent:SceneObject,direction:FlexDirection,w:number,h:number,gap:number,pad:number){
    const o=this.obj(parent,"Flex");o.getTransform().setLocalPosition(new vec3(0,0,.02));
    const f=o.createComponent(FlexLayout.getTypeName()) as FlexLayout;
    f.onInitialized.add(()=>{f.width=w;f.height=h;f.direction=direction;f.rowGap=gap;f.columnGap=gap;f.paddingTop=pad;f.paddingBottom=pad;f.paddingLeft=pad;f.paddingRight=pad;f.justifyContent=FlexJustify.Center;f.alignItems=FlexAlign.Center;});
    return o;
  }
  private item(parent:SceneObject,w:number,h:number,build:(o:SceneObject)=>void){
    const o=this.obj(parent,"Item");const i=o.createComponent(FlexItem.getTypeName()) as FlexItem;
    i.overrideWidth=w;i.overrideHeight=h;i.flexShrink=0;build(o);
    this.pendingItems.push({layout:parent.getComponent(FlexLayout.getTypeName()) as FlexLayout,item:i});return o;
  }
  private text(parent:SceneObject,value:string,role:Role,w:number,h:number,color?:vec4){
    const t=parent.createComponent("Component.Text") as Text;t.text=value;t.depthTest=true;
    applyTextRole(t,role);t.horizontalAlignment=HorizontalAlignment.Center;t.verticalAlignment=VerticalAlignment.Center;
    t.horizontalOverflow=HorizontalOverflow.Overflow;t.verticalOverflow=VerticalOverflow.Overflow;
    t.layoutRect=Rect.create(-w/2,w/2,-h/2,h/2);t.textFill.color=color||new vec4(1,1,1,1);return t;
  }
  private rowText(parent:SceneObject,value:string,role:Role,w:number,h:number,color?:vec4){
    let t:Text;this.item(parent,w,h,o=>{t=this.text(o,value,role,w,h,color);});return t;
  }
  private button(parent:SceneObject,name:string,value:string,w:number,h:number,press:()=>void){
    let t:Text;
    this.item(parent,w,h,o=>{
      o.name=name;
      const b=o.createComponent(Button.getTypeName()) as Button;
      b.onInitialized.add(()=>{b.size=new vec3(w,h,1);}); // Preserve UIKit's standard direct/indirect/poke input modes.
      const label=this.obj(o,"Label",new vec3(0,0,.08));t=this.text(label,value,"Button",w-.5,h);
      // One gesture can release repeatedly across controls or after a label
      // changes (REFINE -> PLAY). Accept at most one panel action per second.
      b.onTriggerUp.add(()=>{const now=getTime(),dt=now-this.lastButtonRelease;
        if(dt<1){console.info("SHOTGUIDE5_INPUT_SUPPRESSED="+name+" "+Math.round(dt*1000)+"ms");return;}
        this.lastButtonRelease=now;console.info("SHOTGUIDE5_INPUT="+name);press();});
    });return t;
  }
}
