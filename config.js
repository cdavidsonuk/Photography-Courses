
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const images=window.SCENE_IMAGES;
const sceneInfo={
 landscape:{name:"Mountain Lake",desc:"Sharp landscape",motion:.1,subjectDepth:.62,contrast:.8},
 portrait:{name:"Portrait",desc:"Shallow depth of field",motion:.05,subjectDepth:.42,contrast:.55},
 waterfall:{name:"Waterfall",desc:"Long exposure",motion:1,subjectDepth:.58,contrast:.72},
 cyclist:{name:"Cyclist",desc:"Fast action",motion:1,subjectDepth:.46,contrast:.78},
 night:{name:"Night City",desc:"Low-light photography",motion:.35,subjectDepth:.7,contrast:1},
 wildlife:{name:"Wildlife",desc:"Telephoto action",motion:.85,subjectDepth:.38,contrast:.82}
};
const modes=["M","A","S","AUTO"],shutters=["1/4000","1/2000","1/1000","1/500","1/250","1/125","1/60","1/30","1/15","1/8","1/4","1/2","1s"],apertures=[1.4,2,2.8,4,5.6,8,11,16],isos=[100,200,400,800,1600,3200,6400],lenses=[24,35,50,85,135,200];
const $=id=>document.getElementById(id);
let currentScene="landscape",modeIndex=0,shutterIndex=5,apertureIndex=4,isoIndex=1,lensIndex=2,shots=0;
let renderer,world,camera,orbit,rig,lcdCanvas,lcdCtx,lcdTexture,lcdScreen;
let shutterButton,frontWheel,rearWheel,modeDial,isoButton,menuButton,infoButton,playButton,deleteButton,afButton,joystick,zoomRing,focusRing;
const clickable=[],raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),audio={ctx:null};
let sourceImage=new Image(),sourceReady=false;

function material(color,rough=.75,metal=.08){return new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal})}
function roundedBox(w,h,d,r,mat){
 const s=new THREE.Shape(),x=-w/2,y=-h/2;
 s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);
 const g=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:true,bevelSegments:4,steps:1,bevelSize:.045,bevelThickness:.045});g.center();return new THREE.Mesh(g,mat)
}
function cyl(r,d,mat,axis="z",segments=48){const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,d,segments),mat);if(axis==="z")m.rotation.x=Math.PI/2;if(axis==="x")m.rotation.z=Math.PI/2;return m}
function add(parent,obj,pos,rot){obj.position.set(...pos);if(rot)obj.rotation.set(...rot);parent.add(obj);return obj}
function canvasTexture(text,bg="#15181a",fg="#f1f2f3",w=512,h=128){
 const c=document.createElement("canvas");c.width=w;c.height=h;const x=c.getContext("2d");x.fillStyle=bg;x.fillRect(0,0,w,h);x.fillStyle=fg;x.font=`700 ${Math.floor(h*.46)}px Arial`;x.textAlign="center";x.textBaseline="middle";x.fillText(text,w/2,h/2);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t
}
function button(parent,name,pos,size=[.34,.34,.13]){const m=roundedBox(size[0],size[1],size[2],.07,material(0x17191c,.95,.02));m.name=name;add(parent,m,pos);clickable.push(m);return m}
function addText(parent,text,pos,size=[.7,.18],rot=[0,Math.PI,0]){const plane=new THREE.Mesh(new THREE.PlaneGeometry(...size),new THREE.MeshBasicMaterial({map:canvasTexture(text,"#202327","#dfe2e5",512,128),transparent:true,toneMapped:false}));add(parent,plane,pos,rot);return plane}
function ribbedRing(r,d,matl){const g=new THREE.Group();g.add(cyl(r,d,matl));for(let n=0;n<30;n++){const a=n/30*Math.PI*2,rib=new THREE.Mesh(new THREE.BoxGeometry(.075,.16,d+.025),material(0x202326,.95,.03));rib.position.set(Math.cos(a)*r,Math.sin(a)*r,0);rib.rotation.z=a;g.add(rib)}return g}
function buildCamera(){
 rig=new THREE.Group();world.add(rig);const body=material(0x222529,.88,.05),rubber=material(0x101214,1,.01),metal=material(0x555a60,.28,.76),dark=material(0x070809,.75,.16);
 add(rig,roundedBox(6.8,4.1,1.95,.42,body),[0,0,0]);add(rig,roundedBox(1.8,3.85,2.34,.36,rubber),[2.65,-.03,.13]);add(rig,roundedBox(2.45,1.3,2.1,.27,body),[0,2.36,.03]);add(rig,roundedBox(1.8,.72,1.85,.2,body),[-2.22,2.08,.03]);add(rig,roundedBox(1.75,.72,1.95,.2,body),[2.2,2.08,.05]);
 add(rig,roundedBox(.52,2.5,.18,.18,material(0x090a0b,1,0)),[3.3,-.25,1.26],[0,.16,0]);add(rig,roundedBox(.7,.85,.16,.2,material(0x0b0c0d,1,0)),[2.45,1.25,1.27],[0,0,.12]);
 add(rig,cyl(1.72,.22,metal),[0,.05,1.08]);add(rig,cyl(1.58,.52,dark),[0,.05,1.38]);zoomRing=add(rig,ribbedRing(1.52,.7,rubber),[0,.05,1.95]);zoomRing.name="Zoom ring";clickable.push(zoomRing);add(rig,cyl(1.42,.55,metal),[0,.05,2.55]);focusRing=add(rig,ribbedRing(1.36,.58,rubber),[0,.05,3.05]);focusRing.name="Focus ring";clickable.push(focusRing);add(rig,cyl(1.22,.42,dark),[0,.05,3.53]);
 const glass=new THREE.MeshPhysicalMaterial({color:0x15243c,roughness:.05,metalness:.05,transmission:.28,thickness:.8,clearcoat:1,clearcoatRoughness:.05});add(rig,cyl(1.09,.08,glass),[0,.05,3.78]);
 addText(rig,"24—70mm",[-.72,.45,3.35],[1.0,.16],[0,0,0]);addText(rig,"f/2.8",[-.55,-.65,2.62],[.68,.15],[0,0,0]);add(rig,roundedBox(1.2,.18,.72,.03,metal),[0,2.95,.08]);add(rig,roundedBox(1.55,.72,.47,.17,rubber),[0,1.55,-1.18]);add(rig,roundedBox(.88,.4,.12,.08,material(0x2c203e,.22,.12)),[0,1.55,-1.45]);
 add(rig,roundedBox(4.25,2.75,.18,.16,dark),[-.58,-.18,-.96]);lcdCanvas=document.createElement("canvas");lcdCanvas.width=1024;lcdCanvas.height=640;lcdCtx=lcdCanvas.getContext("2d");lcdTexture=new THREE.CanvasTexture(lcdCanvas);lcdTexture.colorSpace=THREE.SRGBColorSpace;lcdScreen=new THREE.Mesh(new THREE.PlaneGeometry(3.88,2.42),new THREE.MeshBasicMaterial({map:lcdTexture,toneMapped:false}));add(rig,lcdScreen,[-.58,-.18,-1.08],[0,Math.PI,0]);
 rearWheel=add(rig,ribbedRing(.73,.2,metal),[2.22,-.28,-1.18]);rearWheel.rotation.x=Math.PI/2;rearWheel.name="Rear command wheel";clickable.push(rearWheel);add(rig,cyl(.38,.23,dark),[2.22,-.28,-1.31]);joystick=add(rig,cyl(.18,.22,metal),[2.22,.82,-1.2]);joystick.rotation.x=Math.PI/2;joystick.name="Focus joystick";clickable.push(joystick);afButton=button(rig,"AF-ON",[2.35,1.45,-1.15],[.58,.28,.14]);menuButton=button(rig,"MENU",[-2.85,1.08,-1.16],[.54,.26,.13]);infoButton=button(rig,"INFO",[-2.85,.55,-1.16],[.54,.26,.13]);playButton=button(rig,"PLAY",[-2.85,-.05,-1.16],[.54,.26,.13]);deleteButton=button(rig,"DELETE",[-2.85,-.62,-1.16],[.54,.26,.13]);button(rig,"Magnify",[2.72,.38,-1.17],[.34,.28,.13]);button(rig,"Quick menu",[2.72,-.93,-1.17],[.34,.28,.13]);
 addText(rig,"MENU",[-2.85,1.08,-1.245],[.45,.12]);addText(rig,"INFO",[-2.85,.55,-1.245],[.45,.12]);addText(rig,"▶",[-2.85,-.05,-1.245],[.28,.14]);addText(rig,"⌫",[-2.85,-.62,-1.245],[.28,.14]);addText(rig,"AF-ON",[2.35,1.45,-1.245],[.48,.11]);
 modeDial=add(rig,ribbedRing(.62,.3,metal),[-2.24,2.58,.13]);modeDial.name="Mode dial";clickable.push(modeDial);frontWheel=add(rig,ribbedRing(.49,.33,metal),[2.15,2.5,.22]);frontWheel.name="Front command wheel";clickable.push(frontWheel);shutterButton=add(rig,cyl(.36,.24,material(0x858b91,.18,.86)),[2.78,2.42,.57]);shutterButton.name="Shutter button";clickable.push(shutterButton);isoButton=button(rig,"ISO",[1.86,2.48,.78],[.42,.28,.13]);isoButton.rotation.x=-Math.PI/2;button(rig,"Record",[1.32,2.48,.78],[.34,.28,.13]).rotation.x=-Math.PI/2;
 const topLCD=new THREE.Mesh(new THREE.PlaneGeometry(1.42,.58),new THREE.MeshBasicMaterial({map:canvasTexture("M 125 F5.6","#17251c","#c9ffd8",700,260),toneMapped:false}));add(rig,topLCD,[.55,2.79,.58],[-Math.PI/2,0,0]);
 addText(rig,"PHOTOGRAPHYCOURSES",[-1.75,.97,1.04],[1.7,.23],[0,0,0]);addText(rig,"PRO 3D",[-1.95,.58,1.04],[.85,.18],[0,0,0]);addText(rig,"35mm FULL FRAME",[1.55,-1.43,1.04],[1.18,.16],[0,0,0]);add(rig,roundedBox(1.08,2.0,.08,.13,material(0x141619,.95,.02)),[-3.42,-.35,.05],[0,Math.PI/2,0]);add(rig,roundedBox(2.05,.92,.08,.12,material(0x141619,.95,.02)),[1.35,-2.08,.0],[Math.PI/2,0,0]);
 rig.rotation.set(-.07,-.24,0);rig.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});updateLCD("live")
}
function log(message){const item=document.createElement("div");item.className="log-entry";item.textContent=message;$("eventLog").prepend(item);while($("eventLog").children.length>6)$("eventLog").lastChild.remove();$("selectedControl").textContent=message}
function tone(type){if(!$("soundToggle").checked)return;audio.ctx ??= new (window.AudioContext||window.webkitAudioContext)();const ctx=audio.ctx,now=ctx.currentTime,osc=ctx.createOscillator(),gain=ctx.createGain();osc.connect(gain);gain.connect(ctx.destination);if(type==="dial"){osc.type="square";osc.frequency.setValueAtTime(780,now);gain.gain.setValueAtTime(.035,now);gain.gain.exponentialRampToValueAtTime(.001,now+.035);osc.start(now);osc.stop(now+.04)}if(type==="beep"){osc.type="sine";osc.frequency.setValueAtTime(1500,now);gain.gain.setValueAtTime(.06,now);gain.gain.exponentialRampToValueAtTime(.001,now+.12);osc.start(now);osc.stop(now+.13)}if(type==="button"){osc.type="triangle";osc.frequency.setValueAtTime(260,now);gain.gain.setValueAtTime(.035,now);gain.gain.exponentialRampToValueAtTime(.001,now+.055);osc.start(now);osc.stop(now+.06)}if(type==="shutter"){const noise=ctx.createBuffer(1,ctx.sampleRate*.18,ctx.sampleRate),data=noise.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.exp(-i/(ctx.sampleRate*.045));const src=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),g=ctx.createGain();src.buffer=noise;filter.type="bandpass";filter.frequency.value=900;filter.Q.value=.7;g.gain.value=.55;src.connect(filter);filter.connect(g);g.connect(ctx.destination);src.start(now);osc.type="square";osc.frequency.setValueAtTime(95,now);gain.gain.setValueAtTime(.14,now);gain.gain.exponentialRampToValueAtTime(.001,now+.09);osc.start(now);osc.stop(now+.1)}}
function exposureEV(){return (4.5-apertureIndex)*.42+(6-shutterIndex)*.38+(isoIndex-2)*.55}
function focusError(){const target=sceneInfo[currentScene].subjectDepth*100;return Math.abs(+$("focusDistance").value-target)/100}
function simulation(){
 const e=exposureEV(),scene=sceneInfo[currentScene],fstop=apertures[apertureIndex],focal=lenses[lensIndex],slow=Math.max(0,shutterIndex-5)/7,fast=Math.max(0,5-shutterIndex)/5;
 const dof=Math.max(.05,Math.min(1,(fstop/16)*(.72-(focal-24)/260)+.12));
 const blur=Math.max(0,(1-dof)*7);
 const motion=scene.motion*Math.pow(slow,1.25)*13;
 const noise=Math.max(0,(isoIndex-1)*.085);
 const focus=focusError();
 const clipping=Math.max(0,Math.abs(e)-1.1);
 return {e,dof,blur,motion,noise,focus,clipping,focal,fast}
}
function wbFilter(){
 const v=$("whiteBalance").value;
 return {auto:"",daylight:"saturate(1.04)",cloudy:"sepia(.14) saturate(1.08)",shade:"sepia(.22) saturate(1.12)",tungsten:"sepia(.08) hue-rotate(178deg) saturate(.9)",fluorescent:"hue-rotate(340deg) saturate(.92)"}[v]
}
function profileFilter(){
 const v=$("pictureProfile").value;
 return {standard:"",vivid:"saturate(1.32) contrast(1.12)",neutral:"saturate(.82) contrast(.92)",portrait:"saturate(.96) contrast(.95) brightness(1.04)",landscape:"saturate(1.22) contrast(1.08)",mono:"grayscale(1) contrast(1.12)"}[v]
}
function renderPhoto(targetImg,targetCanvas,isCapture=false){
 const sim=simulation(),stage=targetImg.parentElement,w=stage.clientWidth,h=stage.clientHeight;
 targetCanvas.width=Math.max(1,Math.round(w*devicePixelRatio));targetCanvas.height=Math.max(1,Math.round(h*devicePixelRatio));
 targetCanvas.style.width=w+"px";targetCanvas.style.height=h+"px";
 const ctx=targetCanvas.getContext("2d"),dpr=devicePixelRatio;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
 targetImg.src=images[currentScene];
 targetImg.style.filter=`brightness(${Math.max(.18,1+sim.e*.23)}) ${wbFilter()} ${profileFilter()}`;
 targetImg.style.transform=`scale(${1+(sim.focal-24)/420})`;
 ctx.save();
 if(sim.blur>0.2){
   ctx.filter=`blur(${sim.blur.toFixed(1)}px)`;ctx.globalAlpha=.72;
   const maskX=w*(.35+sceneInfo[currentScene].subjectDepth*.3),maskY=h*.50;
   ctx.drawImage(targetImg,0,0,w,h);
   ctx.globalCompositeOperation="destination-out";
   const g=ctx.createRadialGradient(maskX,maskY,15,maskX,maskY,Math.min(w,h)*.28);
   g.addColorStop(0,"rgba(0,0,0,1)");g.addColorStop(.55,"rgba(0,0,0,.85)");g.addColorStop(1,"rgba(0,0,0,0)");
   ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
   ctx.globalCompositeOperation="source-over";
 }
 if(sim.motion>.3){
   ctx.globalAlpha=.14;ctx.filter="none";
   const passes=Math.min(12,Math.ceil(sim.motion));
   for(let n=1;n<=passes;n++)ctx.drawImage(targetImg,n*sim.motion*.45,0,w,h);
 }
 if(sim.focus>.06){
   ctx.globalAlpha=Math.min(.65,sim.focus*1.5);ctx.filter=`blur(${sim.focus*12}px)`;ctx.drawImage(targetImg,0,0,w,h);
 }
 ctx.restore();
 if(sim.noise>0){
   const count=Math.round(w*h*.018*sim.noise);
   const img=ctx.getImageData(0,0,w,h),data=img.data;
   for(let n=0;n<count;n++){const p=(Math.random()*w*h|0)*4,val=(Math.random()*110-55)*sim.noise;data[p]+=val;data[p+1]+=val;data[p+2]+=val}
   ctx.putImageData(img,0,0);
 }
 if(sim.e>1.3){ctx.fillStyle=`rgba(255,255,255,${Math.min(.42,(sim.e-1.3)*.15)})`;ctx.fillRect(0,0,w,h)}
 if(sim.e<-1.5){ctx.fillStyle=`rgba(0,0,0,${Math.min(.48,(-sim.e-1.5)*.18)})`;ctx.fillRect(0,0,w,h)}
 if(!isCapture)updateDiagnostics(sim);
}
function updateDiagnostics(sim){
 const exposureText=sim.e>1?"Overexposed":sim.e<-.9?"Underexposed":"Balanced";
 const dofText=sim.dof>.65?"Deep":sim.dof>.36?"Moderate":"Shallow";
 const motionText=sim.motion>7?"Strong blur":sim.motion>2?"Visible blur":"Frozen";
 const noiseText=sim.noise>.3?"Heavy":sim.noise>.12?"Moderate":"Very low";
 const focusText=sim.focus>.28?"Missed":sim.focus>.11?"Slightly soft":"Accurate";
 const rangeText=sim.clipping>.7?"Clipped":sim.clipping>.15?"At risk":"Protected";
 $("diagExposure").textContent=exposureText;$("diagDof").textContent=dofText;$("diagMotion").textContent=motionText;$("diagNoise").textContent=noiseText;$("diagFocus").textContent=focusText;$("diagRange").textContent=rangeText;
 $("exposureReadout").textContent=(sim.e>=0?"+":"")+sim.e.toFixed(1)+" EV";
 $("simulationSummary").textContent=`${exposureText} exposure, ${dofText.toLowerCase()} depth of field, ${motionText.toLowerCase()}, ${noiseText.toLowerCase()} noise.`;
 $("liveHudLeft").textContent=`${shutters[shutterIndex]} · F${apertures[apertureIndex]}`;$("liveHudRight").textContent=`ISO ${isos[isoIndex]} · ${lenses[lensIndex]}mm`;
 const focusX=32+sceneInfo[currentScene].subjectDepth*38;$("focusMarker").style.left=focusX+"%";
 const hist=$("histogram");hist.innerHTML="";for(let n=0;n<28;n++){const bar=document.createElement("i");const centre=Math.exp(-Math.pow((n/27-(.5+sim.e*.07))*3.2,2));bar.style.height=`${8+Math.min(88,centre*80+Math.random()*16)}%`;hist.appendChild(bar)}
}
function updateLCD(mode="live"){
 const w=lcdCanvas.width,h=lcdCanvas.height;lcdCtx.fillStyle="#050607";lcdCtx.fillRect(0,0,w,h);
 const img=new Image();img.onload=()=>{lcdCtx.drawImage(img,0,0,w,h);lcdCtx.fillStyle="rgba(0,0,0,.60)";lcdCtx.fillRect(0,0,w,58);lcdCtx.fillRect(0,h-74,w,74);lcdCtx.font="700 27px monospace";lcdCtx.fillStyle="#fff";lcdCtx.fillText(modes[modeIndex],24,39);lcdCtx.fillText("RAW",105,39);lcdCtx.fillText("AF-S",190,39);lcdCtx.fillText("▰▰▰ 95%",820,39);lcdCtx.fillText(shutters[shutterIndex],24,h-28);lcdCtx.fillText("F"+apertures[apertureIndex],210,h-28);lcdCtx.fillText("ISO "+isos[isoIndex],390,h-28);lcdCtx.fillText("WB "+$("whiteBalance").value.toUpperCase(),650,h-28);lcdCtx.strokeStyle="#6dff7c";lcdCtx.lineWidth=4;lcdCtx.strokeRect(w*.44,h*.40,112,82);lcdTexture.needsUpdate=true};img.src=images[currentScene]
}
function updateReadouts(){
 $("modeOut").textContent=$("modeBadge").textContent=modes[modeIndex];$("shutterOut").textContent=shutters[shutterIndex];$("apertureOut").textContent="F"+apertures[apertureIndex];$("isoOut").textContent=isos[isoIndex];
 updateLCD();requestAnimationFrame(()=>renderPhoto($("liveImage"),$("liveCanvas")))
}
function rotateWheel(direction,which="front"){
 const fn=$("wheelFunction").value;if(fn==="shutter")shutterIndex=Math.max(0,Math.min(shutters.length-1,shutterIndex+direction));if(fn==="aperture")apertureIndex=Math.max(0,Math.min(apertures.length-1,apertureIndex+direction));if(fn==="iso")isoIndex=Math.max(0,Math.min(isos.length-1,isoIndex+direction));(which==="front"?frontWheel:rearWheel).rotation.y+=direction*.24;tone("dial");log(`${which==="front"?"Front":"Rear"} wheel: ${fn}`);updateReadouts()
}
function pressObject(obj,axis="y"){const old=obj.position[axis];obj.position[axis]=old-.07;setTimeout(()=>obj.position[axis]=old,110)}
function autofocus(){tone("beep");pressObject(shutterButton);$("feedbackTitle").textContent="Autofocus locked";$("feedbackText").textContent=focusError()<.1?"Focus is accurately placed on the subject.":"Focus locked, but the selected distance is not ideal for the subject.";log("Autofocus locked")}
function capture(){
 shots++;tone("shutter");pressObject(shutterButton);$("threeContainer").classList.remove("flash");void $("threeContainer").offsetWidth;$("threeContainer").classList.add("flash");$("captureFrame").classList.remove("empty");$("shotNumber").textContent=String(shots).padStart(4,"0");$("captureMeta").textContent=`${sceneInfo[currentScene].name} • ${shutters[shutterIndex]} • F${apertures[apertureIndex]} • ISO ${isos[isoIndex]} • ${lenses[lensIndex]}mm • RAW`;
 requestAnimationFrame(()=>renderPhoto($("captureImage"),$("captureCanvas"),true));
 const sim=simulation();let issues=[];if(Math.abs(sim.e)>.9)issues.push("exposure");if(sim.motion>4)issues.push("motion blur");if(sim.noise>.25)issues.push("noise");if(sim.focus>.15)issues.push("focus");
 if(!issues.length){$("feedbackTitle").textContent="Strong technical capture";$("feedbackText").textContent="Exposure, focus, motion and noise are all well controlled."}else{$("feedbackTitle").textContent="Review this photograph";$("feedbackText").textContent="The main areas to improve are "+issues.join(", ")+"."}
 log(`Captured frame ${String(shots).padStart(4,"0")}`)
}
function handleControl(obj){
 if(obj===shutterButton){capture();return}if(obj===frontWheel){rotateWheel(-1,"front");return}if(obj===rearWheel){rotateWheel(1,"rear");return}if(obj===modeDial){modeIndex=(modeIndex+1)%modes.length;modeDial.rotation.y+=Math.PI/4;tone("dial");log(`Mode dial: ${modes[modeIndex]}`);updateReadouts();return}if(obj===isoButton){$("wheelFunction").value="iso";tone("button");log("ISO button selected");return}if(obj===menuButton||obj===infoButton){pressObject(obj);tone("button");log(obj.name+" opened");return}if(obj===playButton){pressObject(obj);tone("button");log("Playback opened");return}if(obj===deleteButton){pressObject(obj);tone("button");log("Delete button pressed");return}if(obj===afButton){pressObject(obj);autofocus();return}if(obj===joystick){joystick.rotation.z+=.45;tone("button");log("Focus point moved");return}if(obj===zoomRing){zoomRing.rotation.z+=.25;lensIndex=(lensIndex+1)%lenses.length;tone("dial");log(`Lens zoom: ${lenses[lensIndex]}mm`);updateReadouts();return}if(obj===focusRing){focusRing.rotation.z+=.25;$("focusDistance").value=Math.min(100,+$("focusDistance").value+10);tone("dial");log("Manual focus distance changed");updateReadouts();return}tone("button");log(obj.name)
}
function onPointer(e){const r=renderer.domElement.getBoundingClientRect();pointer.x=((e.clientX-r.left)/r.width)*2-1;pointer.y=-((e.clientY-r.top)/r.height)*2+1;raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(clickable,true)[0];if(!hit)return;let obj=hit.object;while(obj.parent&&obj.parent!==rig&&!clickable.includes(obj))obj=obj.parent;const target=clickable.includes(obj)?obj:clickable.find(x=>x===hit.object||x.children.includes(hit.object));if(target)handleControl(target)}
function setView(pos,target=[0,.25,0]){camera.position.set(...pos);orbit.target.set(...target);orbit.update()}
function buildSceneButtons(){const host=$("sceneButtons");Object.entries(sceneInfo).forEach(([key,d])=>{const b=document.createElement("button");b.className="scene-button"+(key===currentScene?" active":"");b.innerHTML=`<img src="${images[key]}" alt=""><span><strong>${d.name}</strong><small>${d.desc}</small></span>`;b.onclick=()=>{currentScene=key;document.querySelectorAll(".scene-button").forEach(x=>x.classList.toggle("active",x===b));sourceReady=false;updateReadouts();log(`Scene selected: ${d.name}`)};host.appendChild(b)})}
function init(){
 try{
  const host=$("threeContainer");world=new THREE.Scene();world.background=new THREE.Color(0x101215);camera=new THREE.PerspectiveCamera(37,host.clientWidth/host.clientHeight,.1,100);camera.position.set(9.6,5.1,12);renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(host.clientWidth,host.clientHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;host.appendChild(renderer.domElement);orbit=new OrbitControls(camera,renderer.domElement);orbit.enableDamping=true;orbit.target.set(0,.25,0);orbit.minDistance=7;orbit.maxDistance=19;orbit.maxPolarAngle=Math.PI*.74;world.add(new THREE.HemisphereLight(0xd7e1ff,0x18130e,2.6));const key=new THREE.DirectionalLight(0xffffff,4.8);key.position.set(7,9,8);key.castShadow=true;key.shadow.mapSize.set(2048,2048);world.add(key);const fill=new THREE.DirectionalLight(0x88a3ff,2.0);fill.position.set(-8,4,-7);world.add(fill);const warm=new THREE.PointLight(0xffb46a,1.8,20);warm.position.set(4,-1,7);world.add(warm);const floor=new THREE.Mesh(new THREE.CircleGeometry(12,90),new THREE.MeshStandardMaterial({color:0x141619,roughness:.95}));floor.rotation.x=-Math.PI/2;floor.position.y=-2.25;floor.receiveShadow=true;world.add(floor);buildCamera();renderer.domElement.addEventListener("pointerdown",onPointer);addEventListener("resize",()=>{camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();renderer.setSize(host.clientWidth,host.clientHeight);renderPhoto($("liveImage"),$("liveCanvas"))});renderer.setAnimationLoop(()=>{orbit.update();renderer.render(world,camera)});$("engineStatus").textContent="3D engine ready";log("Phase 2 simulation engine loaded");setTimeout(updateReadouts,150)
 }catch(err){console.error(err);$("fallback").hidden=false;$("engineStatus").textContent="3D unavailable"}
}
$("frontView").onclick=()=>setView([9,4.2,12]);$("rearView").onclick=()=>setView([0,1,-12]);$("topView").onclick=()=>setView([.1,13,.1],[0,0,0]);$("resetView").onclick=()=>setView([9.6,5.1,12]);$("afButton").onclick=autofocus;$("shutterUi").onclick=capture;$("menuUi").onclick=()=>{tone("button");log("MENU opened")};$("playUi").onclick=()=>{tone("button");log("Playback opened")};
["focusDistance","whiteBalance","pictureProfile","meteringMode"].forEach(id=>$(id).addEventListener("input",updateReadouts));
buildSceneButtons();init();
