const state={mode:"M",iso:1,aperture:3,shutter:4,lens:50,scene:"portrait",sound:true};
const isoValues=[100,200,400,800,1600,3200,6400];
const apertureValues=[1.4,2,2.8,5.6,8,11,16,22];
const shutterValues=[
{label:"1/4000",s:1/4000},{label:"1/2000",s:1/2000},{label:"1/1000",s:1/1000},{label:"1/500",s:1/500},
{label:"1/250",s:1/250},{label:"1/125",s:1/125},{label:"1/60",s:1/60},{label:"1/30",s:1/30},
{label:"1/15",s:1/15},{label:"1/8",s:1/8},{label:"1/4",s:1/4},{label:"1/2",s:1/2},{label:"1s",s:1},{label:"2s",s:2}
];
const scenes={
portrait:{file:"portrait.jpg",title:"Portrait — create a softly blurred background.",ref:1},
waterfall:{file:"waterfall.jpg",title:"Waterfall — create smooth water while protecting highlights.",ref:1},
cyclist:{file:"cyclist.jpg",title:"Cyclist — freeze the action with a fast shutter speed.",ref:0},
night:{file:"night-street.jpg",title:"Night street — make a bright image without excessive noise.",ref:4}
};
const $=id=>document.getElementById(id);
const el={
sceneImage:$("sceneImage"),missionTitle:$("missionTitle"),sceneLabel:$("sceneLabel"),topMode:$("topMode"),topShutter:$("topShutter"),topAperture:$("topAperture"),topIso:$("topIso"),
hudMode:$("hudMode"),hudShutter:$("hudShutter"),hudAperture:$("hudAperture"),hudIso:$("hudIso"),hudLens:$("hudLens"),
isoValue:$("isoValue"),apertureValue:$("apertureValue"),shutterValue:$("shutterValue"),isoDial:$("isoDial"),
blurLayer:$("blurLayer"),motionLayer:$("motionLayer"),noiseLayer:$("noiseLayer"),meterNeedle:$("meterNeedle"),exposureText:$("exposureText"),effectText:$("effectText"),
feedbackTitle:$("feedbackTitle"),feedbackText:$("feedbackText"),score:$("score"),capturePreview:$("capturePreview"),captureImage:$("captureImage"),captureSettings:$("captureSettings")
};
function clamp(v,min,max){return Math.min(Math.max(v,min),max)}
function exposure(){
const iso=isoValues[state.iso],a=apertureValues[state.aperture],s=shutterValues[state.shutter].s;
const ref=Math.log2((5.6**2)/(1/60))-Math.log2(200/100)+scenes[state.scene].ref;
const cur=Math.log2((a**2)/s)-Math.log2(iso/100);
return ref-cur;
}
function autoAdjust(){
if(state.mode==="AUTO"){state.iso=state.scene==="night"?4:1;state.aperture=3;state.shutter=state.scene==="cyclist"?2:6}
if(state.mode==="A")state.shutter=clamp(state.shutter+Math.round(exposure()),0,shutterValues.length-1);
if(state.mode==="S")state.aperture=clamp(state.aperture-Math.round(exposure()),0,apertureValues.length-1);
}
function render(){
autoAdjust();
const iso=isoValues[state.iso],a=apertureValues[state.aperture],sh=shutterValues[state.shutter],aText=`F${a}`;
el.sceneImage.src=scenes[state.scene].file;el.missionTitle.textContent=scenes[state.scene].title;el.sceneLabel.textContent=state.scene.toUpperCase();
[el.topMode,el.hudMode].forEach(x=>x.textContent=state.mode);
[el.topShutter,el.hudShutter,el.shutterValue].forEach(x=>x.textContent=sh.label);
[el.topAperture,el.hudAperture,el.apertureValue].forEach(x=>x.textContent=aText);
[el.topIso,el.hudIso,el.isoValue].forEach(x=>x.textContent=iso);
el.hudLens.textContent=`${state.lens}mm`;
el.isoDial.style.transform=`rotate(${state.iso*18-45}deg)`;
updateEffects();
document.querySelectorAll('[data-control="iso"]').forEach(b=>b.disabled=state.mode==="AUTO");
document.querySelectorAll('[data-control="aperture"]').forEach(b=>b.disabled=state.mode==="S"||state.mode==="AUTO");
document.querySelectorAll('[data-control="shutter"]').forEach(b=>b.disabled=state.mode==="A"||state.mode==="AUTO");
}
function updateEffects(){
const iso=isoValues[state.iso],a=apertureValues[state.aperture],s=shutterValues[state.shutter].s,e=exposure();
el.sceneImage.style.filter=`brightness(${clamp(1+e*.23,.22,2.3)}) saturate(${clamp(1+e*.04,.8,1.18)})`;
el.sceneImage.style.transform=`scale(${1+state.lens/1200})`;
el.noiseLayer.style.opacity=clamp((Math.log2(iso/100)-1)*.065,0,.38);
const motion=state.scene==="waterfall"?clamp((s-1/125)*18,0,14):clamp((s-1/125)*10,0,10);
el.motionLayer.style.opacity=motion>0?1:0;el.motionLayer.style.backdropFilter=`blur(${motion}px)`;
const depth=clamp((5.6/a-.25)*2.5*(state.lens/50),0,9);el.blurLayer.style.backdropFilter=`blur(${depth*.25}px)`;
el.meterNeedle.style.left=`${clamp(50+e*16.66,0,100)}%`;
if(Math.abs(e)<=.45){el.exposureText.textContent="Exposure balanced";el.meterNeedle.style.background="var(--green)"}
else if(e<0){el.exposureText.textContent="Underexposed";el.meterNeedle.style.background="var(--red)"}
else{el.exposureText.textContent="Overexposed";el.meterNeedle.style.background="var(--yellow)"}
if(iso>=3200)el.effectText.textContent="Visible digital noise";
else if(state.scene==="cyclist"&&s>1/250)el.effectText.textContent="Action blur";
else if(state.scene==="waterfall"&&s>=1/15)el.effectText.textContent="Smooth water";
else if(s>1/60)el.effectText.textContent="Camera shake risk";
else if(a<=2.8)el.effectText.textContent="Shallow depth of field";
else el.effectText.textContent="Clean image";
}
function change(c,d){
if(c==="iso")state.iso=clamp(state.iso+d,0,isoValues.length-1);
if(c==="aperture")state.aperture=clamp(state.aperture+d,0,apertureValues.length-1);
if(c==="shutter")state.shutter=clamp(state.shutter+d,0,shutterValues.length-1);
render();
}
function scorePhoto(){
const e=Math.abs(exposure()),iso=isoValues[state.iso],a=apertureValues[state.aperture],s=shutterValues[state.shutter].s;
let n=Math.max(0,55-e*24);
if(state.scene==="portrait"){n+=a<=2.8?30:a<=5.6?18:5;n+=s<=1/60?15:5}
if(state.scene==="waterfall"){n+=s>=1/15?30:s>=1/60?18:6;n+=a>=8?15:7}
if(state.scene==="cyclist"){n+=s<=1/500?35:s<=1/250?22:5;n+=a<=8?10:4}
if(state.scene==="night"){n+=iso<=1600?20:iso<=3200?12:3;n+=s<=1/30?15:8}
if(iso>=6400)n-=18;else if(iso>=3200)n-=10;
return clamp(Math.round(n),0,100)
}
function shutterSound(){
if(!state.sound)return;
const ctx=new (window.AudioContext||window.webkitAudioContext)(),o=ctx.createOscillator(),g=ctx.createGain();
o.type="square";o.frequency.setValueAtTime(100,ctx.currentTime);o.frequency.exponentialRampToValueAtTime(45,ctx.currentTime+.12);
g.gain.setValueAtTime(.13,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.13);o.connect(g);g.connect(ctx.destination);o.start();o.stop(ctx.currentTime+.13);
}
function takePhoto(){
const sc=scorePhoto(),e=exposure(),iso=isoValues[state.iso],a=apertureValues[state.aperture],sh=shutterValues[state.shutter];
shutterSound();$("liveView").classList.remove("flash");void $("liveView").offsetWidth;$("liveView").classList.add("flash");el.score.textContent=sc;
if(sc>=90){el.feedbackTitle.textContent="Excellent photograph.";el.feedbackText.textContent="Your settings matched the scene and produced a strong exposure."}
else if(sc>=75){el.feedbackTitle.textContent="Very good result.";el.feedbackText.textContent="The image works well. A small adjustment would make it even stronger."}
else if(Math.abs(e)>.8){el.feedbackTitle.textContent=e<0?"The image is too dark.":"The image is too bright.";el.feedbackText.textContent="Bring the exposure meter closer to zero."}
else if(state.scene==="portrait"&&a>5.6){el.feedbackTitle.textContent="The background is too sharp.";el.feedbackText.textContent="Use f/2.8 or wider and rebalance the exposure."}
else if(state.scene==="waterfall"&&sh.s<1/15){el.feedbackTitle.textContent="The water is frozen.";el.feedbackText.textContent="Use a slower shutter speed to create smooth water."}
else if(state.scene==="cyclist"&&sh.s>1/250){el.feedbackTitle.textContent="The cyclist may be blurred.";el.feedbackText.textContent="Use 1/500 or faster to freeze the movement."}
else if(state.scene==="night"&&iso>=3200){el.feedbackTitle.textContent="The image has too much noise.";el.feedbackText.textContent="Lower ISO and compensate with aperture or shutter speed."}
else{el.feedbackTitle.textContent="Good attempt.";el.feedbackText.textContent="Keep refining the settings to better match the scene objective."}
el.capturePreview.classList.remove("empty");el.captureImage.src=scenes[state.scene].file;
el.captureImage.style.filter=el.sceneImage.style.filter;el.captureImage.style.transform=el.sceneImage.style.transform;
el.captureSettings.innerHTML=`<strong>${state.scene.toUpperCase()}</strong><br>${sh.label}<br>F${a}<br>ISO ${iso}<br>${state.lens}mm<br>Score: ${sc}/100`;
}
document.querySelectorAll(".adjust,.wheel-btn").forEach(b=>b.addEventListener("click",()=>{if(!b.disabled)change(b.dataset.control,Number(b.dataset.dir))}));
document.querySelectorAll(".mode-button").forEach(b=>b.addEventListener("click",()=>{state.mode=b.dataset.mode;document.querySelectorAll(".mode-button").forEach(x=>x.classList.toggle("active",x===b));render()}));
$("sceneSelect").addEventListener("change",e=>{state.scene=e.target.value;render()});
$("lensSelect").addEventListener("change",e=>{state.lens=Number(e.target.value);render()});
$("takePhotoBtn").addEventListener("click",takePhoto);$("shutterBtn").addEventListener("click",takePhoto);
$("soundBtn").addEventListener("click",e=>{state.sound=!state.sound;e.target.textContent=`Sound ${state.sound?"on":"off"}`});
$("guideBtn").addEventListener("click",()=>$("guideDialog").showModal());$("closeGuide").addEventListener("click",()=>$("guideDialog").close());
$("resetBtn").addEventListener("click",()=>{el.capturePreview.classList.add("empty");el.score.textContent="—";el.captureSettings.textContent="—";el.feedbackTitle.textContent="Adjust the settings and take a photo.";el.feedbackText.textContent="Use the meter and the scene objective to choose your settings."});
render();
