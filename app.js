const HABITS_KEY="habitTrackerNoPin.habits.v1",LOG_KEY="habitTrackerNoPin.log.v1";
function uid(){return"h_"+Date.now().toString(36)+"_"+Math.random().toString(36).slice(2,9)}
function todayISO(){const d=new Date(),y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,"0"),dd=String(d.getDate()).padStart(2,"0");return`${y}-${m}-${dd}`}
function parseISO(i){const[a,b,c]=i.split("-").map(Number);return new Date(a,b-1,c,12,0,0,0)}
function isoFromDate(d){const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,"0"),dd=String(d.getDate()).padStart(2,"0");return`${y}-${m}-${dd}`}
function dowIndex(d=new Date()){return d.getDay()}
function escapeHtml(s){const d=document.createElement("div");d.textContent=String(s??"");return d.innerHTML}
function loadJSON(k,f){try{const r=localStorage.getItem(k);return r?JSON.parse(r):f}catch{return f}}
function saveJSON(k,v){localStorage.setItem(k,JSON.stringify(v))}
function defaultHabits(){return[{id:uid(),name:"Вода",emoji:"💧",type:"count",goal:8,days:[1,2,3,4,5,6,0]},{id:uid(),name:"Прогулка",emoji:"🚶‍♀️",type:"check",goal:1,days:[1,2,3,4,5,6,0]}]}
let state={tab:"today",habits:loadJSON(HABITS_KEY,null),log:loadJSON(LOG_KEY,{})};
// Try migrate from legacy keys (older builds)
if(!Array.isArray(state.habits)){  for(const k of ["habitTracker.habits.v1","habits.v1","habits"]) {
    const v=loadJSON(k,null);
    if(Array.isArray(v)){ state.habits=v; break; }
  }
}
if(!state.log || typeof state.log!=="object"){
  for(const k of ["habitTracker.log.v1","log.v1","log"]) {
    const v=loadJSON(k,null);
    if(v && typeof v==="object"){ state.log=v; break; }
  }
}
if(!Array.isArray(state.habits)){state.habits=defaultHabits()}
saveJSON(HABITS_KEY,state.habits)
if(!state.log||typeof state.log!=="object"){state.log={}}
saveJSON(LOG_KEY,state.log)
const viewEl=document.getElementById("view"),subtitleEl=document.getElementById("subtitle"),tabs=[...document.querySelectorAll(".tab")];
const habitModal=document.getElementById("habitModal"),habitModalTitle=document.getElementById("habitModalTitle"),habitCloseBtn=document.getElementById("habitCloseBtn"),habitCancelBtn=document.getElementById("habitCancelBtn"),habitDeleteBtn=document.getElementById("habitDeleteBtn"),habitForm=document.getElementById("habitForm"),habitEditingId=document.getElementById("habitEditingId"),habitName=document.getElementById("habitName"),habitEmoji=document.getElementById("habitEmoji"),habitType=document.getElementById("habitType"),goalField=document.getElementById("goalField"),habitGoal=document.getElementById("habitGoal"),dowChks=[...document.querySelectorAll(".dowChk")];
document.getElementById("addHabitBtn").addEventListener("click",()=>openHabitModal(null));
const settingsBtn=document.getElementById("settingsBtn");
function registerSW(){if("serviceWorker"in navigator)navigator.serviceWorker.register("./sw.js").catch(console.error)}
function isHabitActiveToday(h){const d=dowIndex(new Date());return Array.isArray(h.days)&&h.days.includes(d)}
function getLogValue(dateISO,id){return state.log?.[dateISO]?.[id]}
function setLogValue(dateISO,id,val){state.log[dateISO]=state.log[dateISO]||{};state.log[dateISO][id]=val;saveJSON(LOG_KEY,state.log)}
function normalizeHabit(h){return{id:h.id??uid(),name:String(h.name??"Привычка"),emoji:String(h.emoji??""),type:h.type==="count"?"count":"check",goal:Math.max(1,Number(h.goal??1)||1),days:Array.isArray(h.days)?h.days:[1,2,3,4,5,6,0]}}
function syncGoalField(){habitType.value==="count"?goalField.classList.remove("hidden"):goalField.classList.add("hidden")}
habitType.addEventListener("change",syncGoalField);
function openHabitModal(edit){habitModal.classList.remove("hidden");if(edit){habitModalTitle.textContent="Редактировать привычку";habitEditingId.value=edit.id;habitName.value=edit.name;habitEmoji.value=edit.emoji||"";habitType.value=edit.type;habitGoal.value=edit.goal||1;dowChks.forEach(ch=>ch.checked=edit.days.includes(Number(ch.value)));habitDeleteBtn.classList.remove("hidden")}else{habitModalTitle.textContent="Добавить привычку";habitEditingId.value="";habitName.value="";habitEmoji.value="";habitType.value="check";habitGoal.value=8;dowChks.forEach(ch=>ch.checked=!0);habitDeleteBtn.classList.add("hidden")}syncGoalField()}
function closeHabitModal(){habitModal.classList.add("hidden")}
habitCloseBtn.addEventListener("click",closeHabitModal);
habitCancelBtn.addEventListener("click",closeHabitModal);
habitModal.addEventListener("click",e=>{if(e.target===habitModal)closeHabitModal()});
habitForm.addEventListener("submit",e=>{e.preventDefault();const id=habitEditingId.value.trim(),days=dowChks.filter(ch=>ch.checked).map(ch=>Number(ch.value));if(!days.length)return alert("Выбери хотя бы один активный день.");const h=normalizeHabit({id:id||uid(),name:habitName.value.trim(),emoji:habitEmoji.value.trim(),type:habitType.value,goal:habitGoal.value,days});if(!h.name)return alert("Укажи название.");const idx=state.habits.findIndex(x=>x.id===h.id);idx>=0?state.habits[idx]=h:state.habits.push(h);saveJSON(HABITS_KEY,state.habits);closeHabitModal();render()});
habitDeleteBtn.addEventListener("click",()=>{const id=habitEditingId.value.trim();if(!id)return;if(!confirm("Удалить привычку?"))return;state.habits=state.habits.filter(h=>h.id!==id);saveJSON(HABITS_KEY,state.habits);for(const d of Object.keys(state.log))state.log[d]&&id in state.log[d]&&delete state.log[d][id];saveJSON(LOG_KEY,state.log);closeHabitModal();render()});
tabs.forEach(b=>b.addEventListener("click",()=>{tabs.forEach(x=>x.classList.remove("active"));b.classList.add("active");state.tab=b.dataset.tab;render()}));
function daysLabel(days){const map={1:"Пн",2:"Вт",3:"Ср",4:"Чт",5:"Пт",6:"Сб",0:"Вс"};const s=days.slice().sort((a,b)=>(a===0?7:a)-(b===0?7:b));return s.map(d=>map[d]).join(" ")}
function completedToday(h){const t=todayISO(),v=getLogValue(t,h.id);return h.type==="count"?Number(v||0)>=h.goal:!!v}
function toggleCheck(id){const t=todayISO(),cur=!!getLogValue(t,id);setLogValue(t,id,!cur);renderToday()}
function incCount(id,delta){const t=todayISO(),h=state.habits.find(x=>x.id===id);if(!h)return;const cur=Number(getLogValue(t,id)||0);const next=Math.max(0,Math.min(h.goal,cur+delta));setLogValue(t,id,next);renderToday()}
function renderToday(){subtitleEl.textContent=`Сегодня • ${new Date().toLocaleDateString("ru-RU",{day:"2-digit",month:"long"})}`;viewEl.innerHTML="";if(!state.habits.length){viewEl.innerHTML=`<div class="card"><div class="cardTitle">Нет привычек</div><div class="cardMeta">Нажми “+ Привычка”, чтобы добавить.</div></div>`;return}state.habits.forEach(h=>{const active=isHabitActiveToday(h),done=completedToday(h),pill=done?`<span class="pill ok">Сделано</span>`:active?`<span class="pill warn">В процессе</span>`:`<span class="pill">Не сегодня</span>`;const title=`${h.emoji?h.emoji+" ":""}${h.name}`;const card=document.createElement("div");card.className="card"+(active?"":" itemDisabled");const meta=`<div>${h.type==="count"?`Цель: ${h.goal}`:"Чекбокс"}</div><div>Дни: ${daysLabel(h.days)}</div>`;let controls="";if(h.type==="check"){const checked=!!getLogValue(todayISO(),h.id);controls=`<div class="btnRow"><button class="btn primary" data-action="check" data-id="${h.id}" ${active?"":"disabled"}>${checked?"Снять":"Отметить"}</button><button class="btn" data-action="edit" data-id="${h.id}">Редактировать</button></div>`}else{const val=Number(getLogValue(todayISO(),h.id)||0);controls=`<div class="btnRow"><div class="counter"><button class="btn" data-action="dec" data-id="${h.id}" ${(active&&val>0)?"":"disabled"}>−</button><div class="counterVal">${val} / ${h.goal}</div><button class="btn primary" data-action="inc" data-id="${h.id}" ${(active&&val<h.goal)?"":"disabled"}>+</button></div><button class="btn" data-action="edit" data-id="${h.id}">Редактировать</button></div>`}card.innerHTML=`<div class="row1"><div><div class="cardTitle">${escapeHtml(title)}</div><div class="cardMeta">${meta}</div></div>${pill}</div>${controls}`;viewEl.appendChild(card)});viewEl.onclick=e=>{const b=e.target.closest("button[data-action]");if(!b)return;const id=b.dataset.id,act=b.dataset.action;if(act==="check")return toggleCheck(id);if(act==="inc")return incCount(id,1);if(act==="dec")return incCount(id,-1);if(act==="edit"){const h=state.habits.find(x=>x.id===id);if(h)openHabitModal(h)}}}
function renderHabits(){subtitleEl.textContent="Список привычек";viewEl.innerHTML="";if(!state.habits.length){viewEl.innerHTML=`<div class="card"><div class="cardTitle">Пока нет привычек</div><div class="cardMeta">Нажми “+ Привычка”, чтобы добавить.</div></div>`;return}state.habits.forEach(h=>{const title=`${h.emoji?h.emoji+" ":""}${h.name}`;const card=document.createElement("div");card.className="card";card.innerHTML=`<div class="row1"><div><div class="cardTitle">${escapeHtml(title)}</div><div class="cardMeta"><div>${h.type==="count"?`Счётчик • цель ${h.goal}`:"Чекбокс"}</div><div>Дни: ${daysLabel(h.days)}</div></div></div><button class="btn" data-action="edit" data-id="${h.id}">Редактировать</button></div>`;viewEl.appendChild(card)});viewEl.onclick=e=>{const b=e.target.closest("button[data-action='edit']");if(!b)return;const h=state.habits.find(x=>x.id===b.dataset.id);if(h)openHabitModal(h)}}
function lastNDates(n){const out=[],d=parseISO(todayISO());for(let i=0;i<n;i++){const cur=new Date(d);cur.setDate(cur.getDate()-i);out.push(isoFromDate(cur))}return out.reverse()}
function isCompletedOnDate(h,iso){const v=getLogValue(iso,h.id);return h.type==="count"?Number(v||0)>=h.goal:!!v}
function completionRate(h,n){const dates=lastNDates(n);let eligible=0,done=0;for(const iso of dates){const dow=parseISO(iso).getDay();if(!h.days.includes(dow))continue;eligible++;if(isCompletedOnDate(h,iso))done++}return{eligible,done,pct:eligible?Math.round(done*100/eligible):0}}
function streak(h){let count=0;const d=parseISO(todayISO());for(let i=0;i<3650;i++){const cur=new Date(d);cur.setDate(cur.getDate()-i);const iso=isoFromDate(cur);const dow=cur.getDay();if(!h.days.includes(dow))continue;if(isCompletedOnDate(h,iso))count++;else break}return count}
function renderStats(){subtitleEl.textContent="Статистика";viewEl.innerHTML="";if(!state.habits.length){viewEl.innerHTML=`<div class="card"><div class="cardTitle">Нет привычек</div></div>`;return}const active=state.habits.filter(isHabitActiveToday),done=active.filter(completedToday).length,pct=active.length?Math.round(done*100/active.length):0;const head=document.createElement("div");head.className="card";head.innerHTML=`<div class="cardTitle">Сегодня: ${done} / ${active.length} (${pct}%)</div><div class="cardMeta">Ниже — % за 7/30 дней и серия по каждой привычке.</div>`;viewEl.appendChild(head);state.habits.forEach(h=>{const r7=completionRate(h,7),r30=completionRate(h,30),st=streak(h),title=`${h.emoji?h.emoji+" ":""}${h.name}`;const card=document.createElement("div");card.className="card";card.innerHTML=`<div class="row1"><div><div class="cardTitle">${escapeHtml(title)}</div><div class="cardMeta"><div>Серия: <b>${st}</b></div><div>7 дней: ${r7.done}/${r7.eligible} (${r7.pct}%)</div><div>30 дней: ${r30.done}/${r30.eligible} (${r30.pct}%)</div></div></div><button class="btn" data-action="edit" data-id="${h.id}">Редактировать</button></div>`;viewEl.appendChild(card)});viewEl.onclick=e=>{const b=e.target.closest("button[data-action='edit']");if(!b)return;const h=state.habits.find(x=>x.id===b.dataset.id);if(h)openHabitModal(h)}}
function render(){
  // Toggle "+ Привычка" button only when it makes sense
  const addBtn=document.getElementById("addHabitBtn");
  if(addBtn) addBtn.style.display = (state.tab==="settings") ? "none" : "";
  subtitleEl.textContent = state.tab==="today" ? "Сегодня" : state.tab==="habits" ? "Привычки" : state.tab==="stats" ? "Статистика" : "Настройки";
  if(state.tab==="today") return renderToday();
  if(state.tab==="habits") return renderHabits();
  if(state.tab==="stats") return renderStats();
  return renderSettings();
}

function renderSettings(){
  viewEl.innerHTML = `
    <div class="settingsPage">
      <div class="card settingsCard">
        <h3 class="cardTitle">Настройки</h3>
        <div class="settingsRow">
          <div>
            <div class="rowTitle">Экспорт данных</div>
            <div class="rowSub">Скачать резервную копию (JSON).</div>
          </div>
          <button id="exportBtn" class="btn">Экспорт</button>
        </div>
        <div class="settingsRow">
          <div>
            <div class="rowTitle">Импорт данных</div>
            <div class="rowSub">Восстановить из JSON (перезапишет текущие данные).</div>
          </div>
          <button id="importBtn" class="btn">Импорт</button>
          <input id="importFile" type="file" accept="application/json" style="display:none" />
        </div>
        <div class="settingsRow">
          <div>
            <div class="rowTitle">Сброс</div>
            <div class="rowSub">Удалить все привычки и отметки на этом устройстве.</div>
          </div>
          <button id="resetBtn" class="btn danger">Сбросить</button>
        </div>
      </div>
      <div class="note" style="margin-top:16px;">Данные хранятся только на этом устройстве (без синхронизации).</div>
    </div>
  `;
  const exportBtn=document.getElementById("exportBtn");
  const importBtn=document.getElementById("importBtn");
  const importFile=document.getElementById("importFile");
  const resetBtn=document.getElementById("resetBtn");

  exportBtn.addEventListener("click",()=>{
    const data={habits:state.habits||[],log:state.log||{}};
    const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;
    const stamp=new Date().toISOString().slice(0,10);
    a.download=`habit-tracker-backup-${stamp}.json`;
    document.body.appendChild(a);a.click();a.remove();
    URL.revokeObjectURL(url);
  });

  importBtn.addEventListener("click",()=>importFile.click());
  importFile.addEventListener("change",async()=>{
    const file=importFile.files && importFile.files[0];
    if(!file) return;
    try{
      const text=await file.text();
      const data=JSON.parse(text);
      if(Array.isArray(data.habits)) state.habits=data.habits;
      if(data.log && typeof data.log==="object") state.log=data.log;
      saveJSON(HABITS_KEY,state.habits);
      saveJSON(LOG_KEY,state.log);
      alert("Импорт выполнен ✅");
      render();
    }catch(err){
      console.error(err);
      alert("Не удалось импортировать файл.");
    }finally{
      importFile.value="";
    }
  });

  resetBtn.addEventListener("click",()=>{
    if(!confirm("Точно сбросить все данные?")) return;
    state.habits=[];
    state.log={};
    saveJSON(HABITS_KEY,state.habits);
    saveJSON(LOG_KEY,state.log);
    alert("Готово. Данные очищены.");
    render();
  });
}

// Escape closes only the habit editor modal (settings is a separate screen now)
document.addEventListener("keydown",(e)=>{
  if(e.key!=="Escape") return;
  closeHabitModal();
});

// Settings button opens Settings tab
settingsBtn.addEventListener("click",()=>{
  const t=document.querySelector('.tab[data-tab="settings"]');
  if(t) t.click();
});

function init(){registerSW();render()}
init();
