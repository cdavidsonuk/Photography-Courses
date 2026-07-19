
(() => {
const $=id=>document.getElementById(id);
function metrics(){
 const text=id=>($(id)?.textContent||"").trim();
 return {
  exposure:text("diagExposure"),dof:text("diagDof"),motion:text("diagMotion"),
  noise:text("diagNoise"),focus:text("diagFocus"),range:text("diagRange"),
  ev:text("exposureReadout"),settings:`${text("shutterOut")}, ${text("apertureOut")}, ISO ${text("isoOut")}`,
  scene:(document.querySelector(".scene-button.active strong")?.textContent||"current scene")
 };
}
function severity(v){v=v.toLowerCase();if(["balanced","deep","moderate","frozen","very low","accurate","protected"].includes(v))return"good";if(["overexposed","underexposed","strong blur","heavy","missed","clipped"].includes(v))return"bad";return"warn"}
function refresh(){
 const m=metrics(),rows=[["Exposure",m.exposure],["Depth of field",m.dof],["Motion",m.motion],["Noise",m.noise],["Focus",m.focus],["Dynamic range",m.range]];
 $("coachAnalysis").innerHTML=rows.map(([a,b])=>`<div class="analysis-card"><span>${a}</span><strong class="${severity(b)}">${b}</strong></div>`).join("");
}
function advice(prompt){
 const m=metrics(),p=prompt.toLowerCase(),issues=[];
 if(/overexposed/i.test(m.exposure))issues.push("reduce exposure by choosing a faster shutter speed, narrower aperture or lower ISO");
 if(/underexposed/i.test(m.exposure))issues.push("increase exposure with a slower shutter, wider aperture or higher ISO");
 if(/blur/i.test(m.motion))issues.push("use a faster shutter speed to control subject movement");
 if(/heavy|moderate/i.test(m.noise))issues.push("lower ISO and recover brightness through aperture or shutter speed");
 if(/missed|soft/i.test(m.focus))issues.push("move the focus distance towards the subject and confirm autofocus before shooting");
 if(/clipped|risk/i.test(m.range))issues.push("protect the highlights with slight underexposure");
 if(!issues.length)issues.push("keep these settings and concentrate on composition, timing and subject placement");
 if(p.includes("challenge"))return `Try this: photograph the ${m.scene} using manual mode. Keep exposure balanced, achieve accurate focus and avoid heavy noise. Then change one setting and explain the visual difference.`;
 if(p.includes("focus"))return /accurate/i.test(m.focus)?`Focus is currently accurate. To develop further, try changing focal length and aperture while keeping the same subject sharp.`:`Your focus result is ${m.focus.toLowerCase()}. Adjust the focus-distance control towards the subject, use AF-ON, and check sharpness before capturing.`;
 if(p.includes("exposure"))return `Your meter shows ${m.ev} and the photograph is ${m.exposure.toLowerCase()}. With settings ${m.settings}, I would ${issues[0]}. Change one control at a time so you can see its effect.`;
 if(p.includes("critique")||p.includes("photograph"))return `Technical critique for the ${m.scene}: exposure is ${m.exposure.toLowerCase()}, motion is ${m.motion.toLowerCase()}, noise is ${m.noise.toLowerCase()}, and focus is ${m.focus.toLowerCase()}. My priority is to ${issues[0]}.`;
 return `Based on the current ${m.scene}, I recommend you ${issues.join("; then ")}. Your current settings are ${m.settings}.`;
}
function add(role,text){
 const d=document.createElement("div");d.className=`coach-message ${role}`;d.innerHTML=`<strong>${role==="assistant"?"Photography Coach":"You"}</strong><p></p>`;d.querySelector("p").textContent=text;$("coachMessages").appendChild(d);$("coachMessages").scrollTop=$("coachMessages").scrollHeight
}
function ask(text){if(!text.trim())return;add("user",text);setTimeout(()=>add("assistant",advice(text)),250)}
$("coachForm").onsubmit=e=>{e.preventDefault();const v=$("coachInput").value;$("coachInput").value="";ask(v)};
document.querySelectorAll(".coach-prompts button").forEach(b=>b.onclick=()=>ask(b.dataset.prompt));
$("generatePlan").onclick=()=>{
 const m=metrics(),items=[];
 if(!/Balanced/i.test(m.exposure))items.push(["1. Correct exposure",`Work from ${m.ev} towards ±0.0 EV using one setting at a time.`]);
 if(!/Accurate/i.test(m.focus))items.push(["2. Refine focus","Use AF-ON and move focus distance until the subject is sharp."]);
 if(/blur/i.test(m.motion))items.push(["3. Control movement","Practise at 1/500 second or faster on action scenes."]);
 if(/Heavy|Moderate/i.test(m.noise))items.push(["4. Reduce noise","Repeat the scene using the lowest practical ISO."]);
 if(!items.length)items.push(["1. Composition practice","Technical quality is strong. Now vary viewpoint, timing and framing."],["2. Creative variation","Shoot the same scene with shallow and deep depth of field."]);
 $("practicePlan").innerHTML=items.map(([a,b])=>`<div class="plan-item"><b>${a}</b><span>${b}</span></div>`).join("");
 add("assistant","I created a personalised improvement plan from your current technical results.");
};
$("speakAdvice").onclick=()=>{
 const msg=[...document.querySelectorAll(".coach-message.assistant p")].at(-1)?.textContent||advice("critique");
 if("speechSynthesis" in window){speechSynthesis.cancel();speechSynthesis.speak(new SpeechSynthesisUtterance(msg))}
};
["shutterOut","apertureOut","isoOut","diagExposure","diagFocus","diagMotion"].forEach(id=>{const el=$(id);if(el)new MutationObserver(refresh).observe(el,{childList:true,subtree:true})});
refresh();$("generatePlan").click();
})();
