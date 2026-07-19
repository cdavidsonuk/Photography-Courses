
(() => {
const lessons = [
 {id:"b1",level:"beginner",title:"Exposure Triangle Foundations",description:"Learn how aperture, shutter speed and ISO work together.",scene:"landscape",objective:"Create a balanced landscape exposure between −0.5 EV and +0.5 EV.",target:70,time:0,hint:"Use a medium aperture, a safe handheld shutter speed and low ISO.",rules:{ev:.5,noise:.18,motion:3,focus:.2}},
 {id:"b2",level:"beginner",title:"Portrait Background Blur",description:"Use aperture and focal length to separate a subject from the background.",scene:"portrait",objective:"Create shallow depth of field while keeping the portrait sharp.",target:72,time:0,hint:"Choose a wide aperture and a longer focal length, then focus near the portrait subject.",rules:{ev:.8,dofMax:.4,focus:.14,noise:.25}},
 {id:"b3",level:"beginner",title:"Freeze the Cyclist",description:"Learn to stop fast movement with shutter speed.",scene:"cyclist",objective:"Freeze the cyclist with minimal motion blur.",target:75,time:90,hint:"Use a fast shutter speed. Raise ISO only as much as needed.",rules:{ev:1,motion:2.4,noise:.35}},
 {id:"i1",level:"intermediate",title:"Silky Waterfall",description:"Balance a long exposure against brightness and sharp surroundings.",scene:"waterfall",objective:"Create visible water movement without severely overexposing the scene.",target:78,time:120,hint:"Use a slow shutter, lower ISO and a narrower aperture.",rules:{ev:.8,motionMin:5,noise:.22,dofMin:.48}},
 {id:"i2",level:"intermediate",title:"Low-Light City",description:"Control noise and exposure in a night scene.",scene:"night",objective:"Expose the city clearly while keeping noise under control.",target:80,time:120,hint:"Use a slower shutter if possible before pushing ISO too high.",rules:{ev:.65,noise:.32,focus:.18}},
 {id:"i3",level:"intermediate",title:"Wildlife Action",description:"Combine telephoto framing, focus and shutter speed.",scene:"wildlife",objective:"Capture sharp wildlife action at 135mm or longer.",target:82,time:90,hint:"Rotate the zoom ring, use fast shutter speed and place focus near the subject.",rules:{ev:.9,motion:2.8,focalMin:135,focus:.16}},
 {id:"a1",level:"advanced",title:"Manual Exposure Sprint",description:"Solve a technical exposure problem under time pressure.",scene:"portrait",objective:"Create a sharp, balanced portrait in 45 seconds.",target:86,time:45,hint:"Work quickly: exposure first, then depth of field and focus.",rules:{ev:.4,dofMax:.42,focus:.1,noise:.2}},
 {id:"a2",level:"advanced",title:"Dynamic Range Rescue",description:"Protect highlights while maintaining a useful exposure.",scene:"landscape",objective:"Keep clipping low and retain deep focus.",target:88,time:75,hint:"Slight underexposure is safer than clipped highlights.",rules:{ev:.45,clip:.18,dofMin:.62,noise:.2}},
 {id:"a3",level:"advanced",title:"Technical Final Exam",description:"A complete test of exposure, focus, movement and image quality.",scene:"cyclist",objective:"Produce a technically strong action photograph with no major faults.",target:90,time:60,hint:"Prioritise shutter speed, compensate with ISO, and confirm focus.",rules:{ev:.45,motion:1.8,noise:.28,focus:.1}}
];
const achievements=[
 {id:"first",icon:"📷",name:"First Capture",desc:"Complete one lesson"},
 {id:"beginner",icon:"🌱",name:"Beginner Graduate",desc:"Complete all beginner lessons"},
 {id:"stars10",icon:"⭐",name:"Ten Stars",desc:"Earn 10 stars"},
 {id:"perfect",icon:"🏆",name:"Perfect Score",desc:"Score 95 or more"},
 {id:"academy",icon:"🎓",name:"Academy Complete",desc:"Complete every lesson"}
];
const state=JSON.parse(localStorage.getItem("pcAcademyV31")||'{"results":{},"level":"beginner"}');
let active=lessons.find(x=>x.level===state.level)||lessons[0],running=false,remaining=0,timer=null;
const $=id=>document.getElementById(id);

function getSim(){
 const text=$("exposureReadout")?.textContent||"0";
 const e=parseFloat(text)||0;
 const read=id=>($(id)?.textContent||"").toLowerCase();
 const motion={"frozen":1,"visible blur":4,"strong blur":9}[read("diagMotion")]||4;
 const noise={"very low":.08,"moderate":.22,"heavy":.45}[read("diagNoise")]||.22;
 const focus={"accurate":.05,"slightly soft":.17,"missed":.4}[read("diagFocus")]||.2;
 const dof={"deep":.8,"moderate":.5,"shallow":.25}[read("diagDof")]||.5;
 const range={"protected":.05,"at risk":.3,"clipped":.8}[read("diagRange")]||.3;
 const focal=parseInt(($("liveHudRight")?.textContent.match(/(\d+)mm/)||[])[1]||50);
 return {e,motion,noise,focus,dof,clip:range,focal};
}
function scoreLesson(){
 const s=getSim(),r=active.rules;let score=100,notes=[];
 const penal=(ok,amount,msg)=>{if(!ok){score-=amount;notes.push(msg)}};
 if(r.ev!=null)penal(Math.abs(s.e)<=r.ev,24,"exposure");
 if(r.motion!=null)penal(s.motion<=r.motion,22,"motion blur");
 if(r.motionMin!=null)penal(s.motion>=r.motionMin,18,"long-exposure effect");
 if(r.noise!=null)penal(s.noise<=r.noise,16,"noise");
 if(r.focus!=null)penal(s.focus<=r.focus,20,"focus");
 if(r.dofMax!=null)penal(s.dof<=r.dofMax,18,"shallow depth of field");
 if(r.dofMin!=null)penal(s.dof>=r.dofMin,18,"deep depth of field");
 if(r.clip!=null)penal(s.clip<=r.clip,18,"dynamic range");
 if(r.focalMin!=null)penal(s.focal>=r.focalMin,18,"focal length");
 if(active.time&&remaining<=0)penal(false,15,"time limit");
 return {score:Math.max(0,score),notes};
}
function stars(score){return score>=90?3:score>=80?2:score>=active.target?1:0}
function save(){localStorage.setItem("pcAcademyV31",JSON.stringify(state))}
function selectScene(key){
 const cards=[...document.querySelectorAll(".scene-button")];
 const card=cards.find(x=>(x.textContent||"").toLowerCase().includes(({landscape:"mountain",portrait:"portrait",waterfall:"waterfall",cyclist:"cyclist",night:"night",wildlife:"wildlife"})[key]));
 if(card)card.click();
}
function renderList(){
 const host=$("lessonList");host.innerHTML="";
 lessons.filter(x=>x.level===state.level).forEach(l=>{
  const result=state.results[l.id],b=document.createElement("button");
  b.className="lesson-card"+(l.id===active.id?" active":"");
  b.innerHTML=`<strong>${l.title}</strong><span>${l.description}</span><em>${result?`${"★".repeat(result.stars)}${"☆".repeat(3-result.stars)} · ${result.score}%`:"Not completed"}</em>`;
  b.onclick=()=>{active=l;renderAll()};
  host.appendChild(b);
 });
}
function renderSteps(done=false){
 const steps=["Choose the correct scene","Set aperture, shutter speed and ISO","Adjust focus and focal length where needed","Take a photograph","Check the result against the objective"];
 $("lessonSteps").innerHTML=steps.map((x,i)=>`<div class="lesson-step ${done||i===0&&running?"done":""}"><b>${done?"✓":i+1}</b><span>${x}</span></div>`).join("");
}
function renderAchievements(){
 const results=Object.values(state.results),completed=results.length,totalStars=results.reduce((a,b)=>a+b.stars,0),best=Math.max(0,...results.map(x=>x.score));
 const unlocked={first:completed>=1,beginner:lessons.filter(x=>x.level==="beginner").every(x=>state.results[x.id]),stars10:totalStars>=10,perfect:best>=95,academy:completed===lessons.length};
 $("achievementGrid").innerHTML=achievements.map(a=>`<div class="achievement ${unlocked[a.id]?"unlocked":""}"><i>${a.icon}</i><div><strong>${a.name}</strong><span>${a.desc}</span></div></div>`).join("");
 $("completedCount").textContent=completed;$("totalStars").textContent=totalStars;$("bestScore").textContent=best;
 $("academyPercent").textContent=Math.round(completed/lessons.length*100)+"%";
}
function renderAll(){
 document.querySelectorAll(".level-tabs button").forEach(b=>b.classList.toggle("active",b.dataset.level===state.level));
 $("lessonLevel").textContent=active.level[0].toUpperCase()+active.level.slice(1);
 $("lessonTitle").textContent=active.title;$("lessonDescription").textContent=active.description;$("lessonObjective").textContent=active.objective;$("targetScore").textContent=active.target;
 const result=state.results[active.id];$("lessonScore").textContent=result?.score||0;$("lessonStars").textContent=result?"★".repeat(result.stars)+"☆".repeat(3-result.stars):"☆☆☆";
 $("timerDisplay").textContent=active.time?active.time+" sec":"Untimed";renderList();renderSteps(!!result);renderAchievements();
}
function start(){
 clearInterval(timer);running=true;remaining=active.time;selectScene(active.scene);$("lessonMessage").textContent="Lesson started. Configure the camera, take a photograph, then check it.";
 if(active.time){$("timerDisplay").textContent=remaining+" sec";timer=setInterval(()=>{remaining--;$("timerDisplay").textContent=Math.max(0,remaining)+" sec";if(remaining<=0){clearInterval(timer);$("lessonMessage").textContent="Time is up. Check your photograph to see your score."}},1000)}
 renderSteps(false);
}
function check(){
 if(!running){$("lessonMessage").textContent="Start the lesson before checking the result.";return}
 const result=scoreLesson(),st=stars(result.score);state.results[active.id]={score:result.score,stars:st,date:Date.now()};save();clearInterval(timer);running=false;
 $("lessonScore").textContent=result.score;$("lessonStars").textContent="★".repeat(st)+"☆".repeat(3-st);
 $("lessonMessage").textContent=result.score>=active.target?`Passed with ${result.score}%. ${st} star${st===1?"":"s"} earned.`:`Score ${result.score}%. Improve ${result.notes.join(", ")||"the technical settings"} and retry.`;
 renderSteps(result.score>=active.target);renderList();renderAchievements();
}
document.querySelectorAll(".level-tabs button").forEach(b=>b.onclick=()=>{state.level=b.dataset.level;active=lessons.find(x=>x.level===state.level);save();renderAll()});
$("startLesson").onclick=start;$("checkLesson").onclick=check;$("lessonHint").onclick=()=>{$("lessonMessage").textContent="Hint: "+active.hint};$("retryLesson").onclick=start;
$("resetProgress").onclick=()=>{if(confirm("Reset all saved lesson progress?")){state.results={};save();renderAll()}};
renderAll();
})();
