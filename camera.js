const state={mode:"M",iso:1,aperture:3,shutter:4,lens:50,scene:"portrait",sound:true,history:[]};
const isoValues=[100,200,400,800,1600,3200,6400];
const apertureValues=[1.4,2,2.8,5.6,8,11,16,22];
const shutterValues=[
{label:"1/4000",s:1/4000},{label:"1/2000",s:1/2000},{label:"1/1000",s:1/1000},{label:"1/500",s:1/500},
{label:"1/250",s:1/250},{label:"1/125",s:1/125},{label:"1/60",s:1/60},{label:"1/30",s:1/30},
{label:"1/15",s:1/15},{label:"1/8",s:1/8},{label:"1/4",s:1/4},{label:"1/2",s:1/2},{label:"1s",s:1},{label:"2s",s:2}
];
const $=id=>document.getElementById(id);
const els={
lcdMode:$("lcdMode"),lcdShutter:$("lcdShutter"),lcdAperture:$("lcdAperture"),lcdIso:$("lcdIso"),lcdLens:$("lcdLens"),
hudMode:$("hudMode"),hudShutter:$("hudShutter"),hudAperture:$("hudAperture"),hudIso:$("hudIso"),hudLens:$("hudLens"),hudScene:$("hudScene"),
isoValue:$("isoValue"),apertureValue:$("apertureValue"),shutterValue:$("shutterValue"),isoDial:$("isoDial"),apertureDial:$("apertureDial"),shutterDial:$("shutterDial"),
scene:$("scene"),noise:document.querySelector(".noise"),motion:document.querySelector(".motion"),meterNeedle:$("meterNeedle"),exposureStatus:$("exposureStatus"),effectStatus:$("effectStatus"),
feedbackTitle:$("feedbackTitle"),feedbackText:$("feedbackText"),scoreValue:$("scoreValue"),missionTitle:$("missionTitle"),historyGrid:$("historyGrid")
};
const missions={
portrait:"Portrait: blur the background and keep the exposure balanced.",
cyclist:"Action: freeze the cyclist while keeping the exposure balanced.",
night:"Night street: make a usable image without excessive noise."
};
function clamp(v,min,max){return Math.min(Math.max(v,min),max)}
function sceneReference(){
if(state.scene==="night")return 4;
if(state.scene==="cyclist")return 0;
return 1;
}
function exposure(){
const iso=isoValues[state.iso],a=apertureValues[state.aperture],s=shutterValues[state.shutter].s;
const ref=Math.log2((5.6**2)/(1/60))-Math.log2(200/100)+sceneReference();
const cur=Math.log2((a**2)/s)-Math.log2(iso/100);
return ref-cur;
}
function autoAdjust(){
if(state.mode==="AUTO"){state.iso=state.scene==="night"?4:1;state.aperture=3;state.shutter=state.scene==="cyclist"?2:6}
if(state.mode==="A"){
const e=exposure();state.shutter=clamp(state.shutter+Math.round(e),0,shutterValues.length-1)
}
if(state.mode==="S"){
const e=exposure();state.aperture=clamp(state.aperture-Math.round(e),0,apertureValues.length-1)
}
}
function render(){
autoAdjust();
const iso=isoValues[state.iso],a=apertureValues[state.aperture],sh=shutterValues[state.shutter],aText=`f/${a}`,lens=`${state.lens}mm`;
[els.lcdMode,els.hudMode].forEach(x=>x.textContent=state.mode);
[els.lcdShutter,els.hudShutter,els.shutterValue].forEach(x=>x.textContent=sh.label);
[els.lcdAperture,els.hudAperture,els.apertureValue].forEach(x=>x.textContent=aText);
[els.lcdIso,els.hudIso,els.isoValue].forEach(x=>x.textContent=iso);
[els.lcdLens,els.hudLens].forEach(x=>x.textContent=lens);
els.hudScene.textContent=state.scene.toUpperCase();
els.missionTitle.textContent=missions[state.scene];
els.isoDial.style.transform=`rotate(${state.iso*18-45}deg)`;
els.apertureDial.style.transform=`rotate(${state.aperture*16-50}deg)`;
els.shutterDial.style.transform=`rotate(${state.shutter*11-55}deg)`;
els.scene.className=`scene ${state.scene}`;
updateEffects();
document.querySelectorAll('[data-control="iso"]').forEach(b=>b.disabled=state.mode==="AUTO");
document.querySelectorAll('[data-control="aperture"]').forEach(b=>b.disabled=state.mode==="S"||state.mode==="AUTO");
document.querySelectorAll('[data-control="shutter"]').forEach(b=>b.disabled=state.mode==="A"||state.mode==="AUTO");
}
function updateEffects(){
const iso=isoValues[state.iso],a=apertureValues[state.aperture],s=shutterValues[state.shutter].s,e=exposure();
els.scene.style.filter=`brightness(${clamp(1+e*.22,.25,2.2)})`;
els.noise.style.opacity=clamp((Math.log2(iso/100)-1)*.06,0,.36);
const motion=clamp((s-1/125)*10,0,10);els.motion.style.opacity=motion>0?1:0;els.motion.style.backdropFilter=`blur(${motion}px)`;
const focalFactor=state.lens/50;
const blur=clamp((5.6/a-.25)*4*focalFactor,0,16);
document.querySelectorAll(".hills,.ground,.street-lamps").forEach(x=>x.style.filter=`blur(${blur}px)`);
els.meterNeedle.style.left=`${clamp(50+e*16.66,0,100)}%`;
if(Math.abs(e)<=.45){els.exposureStatus.textContent="Exposure balanced";els.meterNeedle.style.background="var(--green)"}
else if(e<0){els.exposureStatus.textContent="Too dark";els.meterNeedle.style.background="var(--red)"}
else{els.exposureStatus.textContent="Too bright";els.meterNeedle.style.background="var(--yellow)"}
if(iso>=3200)els.effectStatus.textContent="Visible digital noise";
else if(s>1/60)els.effectStatus.textContent="Motion blur risk";
else if(a<=2.8)els.effectStatus.textContent="Soft background";
else els.effectStatus.textContent="Clean image";
}
function change(control,dir){
if(control==="iso")state.iso=clamp(state.iso+dir,0,isoValues.length-1);
if(control==="aperture")state.aperture=clamp(state.aperture+dir,0,apertureValues.length-1);
if(control==="shutter")state.shutter=clamp(state.shutter+dir,0,shutterValues.length-1);
render();
}
function score(){
const e=Math.abs(exposure()),iso=isoValues[state.iso],a=apertureValues[state.aperture],s=shutterValues[state.shutter].s;
let n=Math.max(0,55-e*24);
if(state.scene==="portrait"){n+=a<=2.8?30:a<=5.6?18:5;n+=s<=1/60?15:5}
if(state.scene==="cyclist"){n+=s<=1/500?35:s<=1/250?22:s<=1/125?8:0;n+=a<=8?10:4}
if(state.scene==="night"){n+=iso<=1600?20:iso<=3200?12:3;n+=s<=1/30?15:8}
if(iso>=6400)n-=18;else if(iso>=3200)n-=10;
return clamp(Math.round(n),0,100)
}
function beep(){
if(!state.sound)return;
const ctx=new (window.AudioContext||window.webkitAudioContext)(),o=ctx.createOscillator(),g=ctx.createGain();
o.type="square";o.frequency.value=90;g.gain.setValueAtTime(.12,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.12);
o.connect(g);g.connect(ctx.destination);o.start();o.stop(ctx.currentTime+.12);
}
function takePhoto(){
const sc=score(),e=exposure(),iso=isoValues[state.iso],a=apertureValues[state.aperture],sh=shutterValues[state.shutter];
beep();els.scene.classList.remove("flash");void els.scene.offsetWidth;els.scene.classList.add("flash");els.scoreValue.textContent=sc;
if(sc>=90){els.feedbackTitle.textContent="Excellent result.";els.feedbackText.textContent="You balanced exposure and met the scene objective very well."}
else if(sc>=75){els.feedbackTitle.textContent="Very good result.";els.feedbackText.textContent="A small adjustment could improve the photograph further."}
else if(Math.abs(e)>.8){els.feedbackTitle.textContent=e<0?"The image is underexposed.":"The image is overexposed.";els.feedbackText.textContent="Bring the exposure meter closer to zero by balancing ISO, aperture and shutter speed."}
else if(state.scene==="portrait"&&a>5.6){els.feedbackTitle.textContent="The background is too sharp.";els.feedbackText.textContent="Use a wider aperture such as f/2.8, then rebalance exposure."}
else if(state.scene==="cyclist"&&sh.s>1/250){els.feedbackTitle.textContent="The cyclist may be blurred.";els.feedbackText.textContent="Choose a faster shutter speed such as 1/500 or faster."}
else if(state.scene==="night"&&iso>=3200){els.feedbackTitle.textContent="The image has too much noise.";els.feedbackText.textContent="Lower ISO and compensate using aperture or shutter speed."}
else{els.feedbackTitle.textContent="Good attempt.";els.feedbackText.textContent="Keep refining the settings to better match the mission."}
state.history.unshift({scene:state.scene,score:sc,settings:`${sh.label} · f/${a} · ISO ${iso} · ${state.lens}mm`});
state.history=state.history.slice(0,6);renderHistory();
}
function renderHistory(){
if(!state.history.length){els.historyGrid.innerHTML='<p class="empty">No photos taken yet.</p>';return}
els.historyGrid.innerHTML=state.history.map(x=>`<article class="history-card"><strong>${x.scene.toUpperCase()} — ${x.score}/100</strong><span>${x.settings}</span></article>`).join("");
}
document.querySelectorAll(".step").forEach(b=>b.addEventListener("click",()=>{if(!b.disabled)change(b.dataset.control,Number(b.dataset.dir))}));
document.querySelectorAll(".mode").forEach(b=>b.addEventListener("click",()=>{state.mode=b.dataset.mode;document.querySelectorAll(".mode").forEach(x=>x.classList.toggle("active",x===b));render()}));
$("sceneSelect").addEventListener("change",e=>{state.scene=e.target.value;render()});
$("lensSelect").addEventListener("change",e=>{state.lens=Number(e.target.value);render()});
$("takePhoto").addEventListener("click",takePhoto);$("physicalShutter").addEventListener("click",takePhoto);
$("soundToggle").addEventListener("click",e=>{state.sound=!state.sound;e.target.textContent=`Sound: ${state.sound?"On":"Off"}`});
$("helpBtn").addEventListener("click",()=>$("helpDialog").showModal());$("closeHelp").addEventListener("click",()=>$("helpDialog").close());
$("clearHistory").addEventListener("click",()=>{state.history=[];renderHistory()});
window.addEventListener("keydown",e=>{
if(e.code==="Space"){e.preventDefault();takePhoto()}
if(e.key.toLowerCase()==="i")change("iso",1);
if(e.key.toLowerCase()==="a")change("aperture",-1);
if(e.key.toLowerCase()==="s")change("shutter",-1);
});
render();renderHistory();
