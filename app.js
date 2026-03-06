/* Classroom Visual Schedule - static app (GitHub Pages friendly)
   - Central Time clock (America/Chicago)
   - Split schedule rows (top 8, bottom remainder)
   - Active/upcoming/completed states
   - Current activity box with time remaining + mask filling bottom->top
   - Edit mode: reorder drag/drop, edit time, delete, rename, change symbol via search
   - localStorage persistence + reset
   - Videos: modal + draggable floating YouTube frames
   - Meetings: modal with weekday logic
*/

const STORAGE_KEY = "sched:v1";
const POS_KEY = "sched:currentBoxPos:v1";

const DEFAULT_ACTIVITIES = [
  { id: uid(), name:"Breakfast", time:"7:15", icon:"https://globalsymbols.com/uploads/production/image/imagefile/6256/14_6256_4ab7e0f6-4376-4c6d-8664-55cb0d0c2c2d.svg" },
  { id: uid(), name:"Writing", time:"8:00", icon:"https://d18vdu4p71yql0.cloudfront.net/libraries/arasaac/writing.png.varianted-skin.png" },
  { id: uid(), name:"Morning Meeting", time:"8:05", icon:"https://globalsymbols.com/uploads/production/image/imagefile/21487/17_21488_2252fa6e-4757-45be-b905-4760804fa3d5.png" },
  { id: uid(), name:"English", time:"8:30", icon:"https://d18vdu4p71yql0.cloudfront.net/libraries/mulberry/english.svg" },
  { id: uid(), name:"Attendance", time:"8:50", icon:"https://globalsymbols.com/uploads/production/image/imagefile/3120/13_3120_590a8d73-a9f5-49f6-9f26-9e1befbb2898.svg" },
  { id: uid(), name:"Recess", time:"8:55", icon:"https://globalsymbols.com/uploads/production/image/imagefile/15894/17_15895_8fbcb320-e261-4ebc-8834-8aeb58e5b03c.png" },
  { id: uid(), name:"Break", time:"9:30", icon:"https://globalsymbols.com/uploads/production/image/imagefile/3260/13_3260_8cd0ea5c-3d75-49bd-836a-526966edf6e6.svg" },
  { id: uid(), name:"Snack", time:"9:50", icon:"https://globalsymbols.com/uploads/production/image/imagefile/21820/17_21821_f58239d7-c408-4494-b7e7-d2808ddf08fa.png" },
  { id: uid(), name:"Math", time:"10:05", icon:"https://globalsymbols.com/uploads/production/image/imagefile/55337/120_55338_d6018f6e-ea20-43e6-9f4b-68e33fc67fc9.png" },
  { id: uid(), name:"PE", time:"10:40", icon:"https://d18vdu4p71yql0.cloudfront.net/libraries/mulberry/PE.svg.varianted-skin.svg" },
  { id: uid(), name:"Music", time:"11:00", icon:"https://d18vdu4p71yql0.cloudfront.net/libraries/noun-project/Music-24b69f41d0.svg" },
  { id: uid(), name:"Lunch", time:"11:30", icon:"https://d18vdu4p71yql0.cloudfront.net/libraries/mulberry/lunch 2.svg" },
  { id: uid(), name:"Swing", time:"12:00", icon:"https://globalsymbols.com/uploads/production/image/imagefile/46310/17_46311_4d68b6dc-e99c-462a-875f-c76297d2e2a8.png" },
  { id: uid(), name:"Rest", time:"12:30", icon:"https://globalsymbols.com/uploads/production/image/imagefile/3260/13_3260_8cd0ea5c-3d75-49bd-836a-526966edf6e6.svg" },
  { id: uid(), name:"Desk Work", time:"1:10", icon:"https://globalsymbols.com/uploads/production/image/imagefile/15657/17_15658_197b592f-bf8e-4879-b9b4-960bdaa27018.png" },
  { id: uid(), name:"Afternoon Meeting", time:"1:15", icon:"https://globalsymbols.com/uploads/production/image/imagefile/21487/17_21488_2252fa6e-4757-45be-b905-4760804fa3d5.png" },
  { id: uid(), name:"Television", time:"1:45", icon:"https://globalsymbols.com/uploads/production/image/imagefile/6268/14_6268_8b0276ac-2f63-4972-81bc-601383681b04.svg" },
  { id: uid(), name:"Bus", time:"2:10", icon:"https://globalsymbols.com/uploads/production/image/imagefile/3426/13_3426_bf2a3b9e-4973-466b-9c31-46e35e0b1d17.svg" },
];

const VIDEOS = [
  { title:"Morning", id:"KuMdgPu4HEI" },
  { title:"Roller Coaster", id:"-5ajUAyLUOg" },
  { title:"Snack", id:"i_JQwhPKzdI" },
  { title:"Lunch", id:"JegZYWlaq8w" },
  { title:"Break", id:"o_YV7lSEbO0" },
  { title:"Afternoon", id:"eji41cH7R54" },
];

const MEETING_URLS = {
  morning: "https://docs.google.com/presentation/d/1ehGBSHcag-uoCxJVIuGAsHY7kQ3AVrHTxWZ3AJjC_W8/edit?slide=id.ge9e5be468d_2_0#slide=id.ge9e5be468d_2_0",
  afternoonMW: "https://docs.google.com/presentation/d/1Ky8pVzQlebqWIBbcfNAMni8VbtqwMehrAO5tnsCzsis/edit?slide=id.p1#slide=id.p1",
  afternoonTTh: "https://docs.google.com/presentation/d/1lpEoEn4zEsGPOeRcUa9bM8ZMIf38VMEwt0lImswLBSA/edit?slide=id.p1#slide=id.p1",
  powerschool: "https://saisd.powerschool.com/teachers/home.html",
};

// DOM
const rowTop = document.getElementById("rowTop");
const rowBottom = document.getElementById("rowBottom");
const currentTimeEl = document.getElementById("currentTime");

const currentBox = document.getElementById("currentBox");
const currentMask = document.getElementById("currentMask");
const currentIcon = document.getElementById("currentIcon");
const currentName = document.getElementById("currentName");
const currentRemaining = document.getElementById("currentRemaining");

const btnVideos = document.getElementById("btnVideos");
const btnMeetings = document.getElementById("btnMeetings");
const btnSettings = document.getElementById("btnSettings");
const btnReset = document.getElementById("btnReset");

const videosOverlay = document.getElementById("videosOverlay");
const closeVideos = document.getElementById("closeVideos");
const videoButtons = document.getElementById("videoButtons");

const meetingsOverlay = document.getElementById("meetingsOverlay");
const closeMeetings = document.getElementById("closeMeetings");
const openMorningSlides = document.getElementById("openMorningSlides");
const openAfternoonSlides = document.getElementById("openAfternoonSlides");
const openPowerSchool = document.getElementById("openPowerSchool");
const afternoonHint = document.getElementById("afternoonHint");

const editOverlay = document.getElementById("editOverlay");
const closeEdit = document.getElementById("closeEdit");
const editTitle = document.getElementById("editTitle");
const symbolQuery = document.getElementById("symbolQuery");
const btnSearchCurrent = document.getElementById("btnSearchCurrent");
const btnChangeName = document.getElementById("btnChangeName");
const btnSearchSymbols = document.getElementById("btnSearchSymbols");
const symbolSpinner = document.getElementById("symbolSpinner");
const symbolError = document.getElementById("symbolError");
const symbolResults = document.getElementById("symbolResults");

const floatLayer = document.getElementById("floatLayer");

// State
let state = loadState();
let editMode = false;
let editingId = null;

// Init
render();
setupClock();
setupCurrentBoxDrag();
setupVideos();
setupMeetings();
setupEditModal();

btnSettings.addEventListener("click", () => {
  editMode = !editMode;
  btnReset.classList.toggle("hidden", !editMode);
  render();
});

btnReset.addEventListener("click", () => {
  if (!editMode) return;
  if (!confirm("Reset schedule to defaults?")) return;
  state = { activities: structuredClone(DEFAULT_ACTIVITIES) };
  saveState();
  render();
});

btnVideos.addEventListener("click", () => openOverlay(videosOverlay));
closeVideos.addEventListener("click", () => closeOverlay(videosOverlay));
videosOverlay.addEventListener("click", (e) => { if (e.target === videosOverlay) closeOverlay(videosOverlay); });

btnMeetings.addEventListener("click", () => {
  updateAfternoonMeetingButton();
  openOverlay(meetingsOverlay);
});
closeMeetings.addEventListener("click", () => closeOverlay(meetingsOverlay));
meetingsOverlay.addEventListener("click", (e) => { if (e.target === meetingsOverlay) closeOverlay(meetingsOverlay); });

/* ------------------ Rendering ------------------ */

function render(){
  rowTop.innerHTML = "";
  rowBottom.innerHTML = "";

   const top = activities.slice(0, 9);
   const bottom = activities.slice(9);

  top.forEach(a => rowTop.appendChild(renderCard(a)));
  bottom.forEach(a => rowBottom.appendChild(renderCard(a)));

  tickSchedule();
}

function renderCard(a){
  const card = document.createElement("div");
  card.className = "card" + (editMode ? " editable edit-mode" : "");
  card.dataset.id = a.id;
  card.draggable = !!editMode;

  const img = document.createElement("img");
  img.className = "card-icon";
  img.src = a.icon;
  img.alt = "";

  const meta = document.createElement("div");
  meta.className = "card-meta";

  const name = document.createElement("div");
  name.className = "card-name";
  name.textContent = a.name;

  const timeWrap = document.createElement("div");
  timeWrap.className = "card-time";

  if (editMode){
    const input = document.createElement("input");
    input.className = "time-input";
    input.value = a.time;
    input.inputMode = "numeric";
    input.addEventListener("change", () => {
      a.time = normalizeTime(input.value);
      input.value = a.time;
      saveState();
      tickSchedule();
    });
    timeWrap.appendChild(input);
  } else {
    timeWrap.textContent = a.time;
  }

  meta.appendChild(name);
  meta.appendChild(timeWrap);

  const del = document.createElement("button");
  del.className = "delbtn";
  del.textContent = "✕";
  del.title = "Delete";
  del.addEventListener("click", (e) => {
    e.stopPropagation();
    state.activities = state.activities.filter(x => x.id !== a.id);
    saveState();
    render();
  });

  card.appendChild(img);
  card.appendChild(meta);
  card.appendChild(del);

  card.addEventListener("click", () => {
    if (!editMode) return;
    openEditFor(a.id);
  });

  // Drag reorder
  if (editMode){
    card.addEventListener("dragstart", (e) => {
      card.classList.add("dragging");
      e.dataTransfer.setData("text/plain", a.id);
      e.dataTransfer.effectAllowed = "move";
    });
    card.addEventListener("dragend", () => card.classList.remove("dragging"));
  }

  // Allow drops into rows
  rowTop.ondragover = rowBottom.ondragover = (e) => { if (editMode) e.preventDefault(); };
  rowTop.ondrop = rowBottom.ondrop = (e) => {
    if (!editMode) return;
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    const targetRow = (e.currentTarget === rowTop) ? "top" : "bottom";
    reorderByDrop(id, targetRow, e.clientX, e.clientY);
  };

  return card;
}

function reorderByDrop(id, targetRow, clientX, clientY){
  const all = [...state.activities];
  const dragged = all.find(a => a.id === id);
  if (!dragged) return;

  const without = all.filter(a => a.id !== id);

  const rowEl = targetRow === "top" ? rowTop : rowBottom;
  const cards = [...rowEl.querySelectorAll(".card")].filter(c => c.dataset.id !== id);

  let insertBeforeId = null;
  for (const c of cards){
    const r = c.getBoundingClientRect();
    const midX = r.left + r.width/2;
    const midY = r.top + r.height/2;
    // crude: compare by x then y; good enough for grid
    if (clientY < midY || (Math.abs(clientY-midY) < r.height/2 && clientX < midX)){
      insertBeforeId = c.dataset.id;
      break;
    }
  }

   const topIds = without.slice(0, 9).map(x => x.id);
   const bottomIds = without.slice(9).map(x => x.id);


  const rowListIds = (targetRow === "top" ? topIds : bottomIds).slice();

  let idxInRow = rowListIds.length;
  if (insertBeforeId){
    idxInRow = rowListIds.indexOf(insertBeforeId);
    if (idxInRow < 0) idxInRow = rowListIds.length;
  }
  rowListIds.splice(idxInRow, 0, id);

  const otherRowIds = targetRow === "top" ? bottomIds : topIds;
  const mergedIds = targetRow === "top"
    ? rowListIds.concat(otherRowIds)
    : otherRowIds.concat(rowListIds);

  const dict = new Map(all.map(x => [x.id, x]));
  dict.set(id, dragged);

  state.activities = mergedIds.map(xid => dict.get(xid)).filter(Boolean);
  saveState();
  render();
}

/* ------------------ Time + schedule logic (Central Time) ------------------ */

function setupClock(){
  setInterval(() => {
    const now = new Date();
    currentTimeEl.textContent = formatCentralTime(now, true);
    tickSchedule();
  }, 1000);
}

function tickSchedule(){
  const now = new Date();
  const nowCT = getCentralParts(now);

  const ordered = [...state.activities].slice().sort((a,b)=> timeToMinutes(a.time) - timeToMinutes(b.time));
  const startMin = timeToMinutes(ordered[0]?.time ?? "7:15");
  const endMin = timeToMinutes(ordered[ordered.length-1]?.time ?? "14:10");

  const nowMin = nowCT.hour*60 + nowCT.minute;

  // Before start
  if (nowMin < startMin){
    setCurrentDisplay(null, null);
    markCards({ activeId:null, completedBeforeMin: -1, ordered });
    return;
  }

  // After last
  if (nowMin >= endMin){
    setCurrentDisplay(null, null);
    markCards({ activeId:null, completedBeforeMin: endMin, ordered });
    return;
  }

  // Find active: last activity whose start <= now < nextStart
  let active = null;
  let nextStartMin = endMin;

  for (let i=0;i<ordered.length;i++){
    const a = ordered[i];
    const aMin = timeToMinutes(a.time);
    const bMin = timeToMinutes(ordered[i+1]?.time ?? minutesToTime(endMin));
    if (nowMin >= aMin && nowMin < bMin){
      active = a;
      nextStartMin = bMin;
      break;
    }
  }

  if (!active){
    setCurrentDisplay(null, null);
    markCards({ activeId:null, completedBeforeMin: -1, ordered });
    return;
  }

  const activeStart = timeToMinutes(active.time);
  const remaining = Math.max(0, nextStartMin - nowMin);
  const total = Math.max(1, nextStartMin - activeStart);
  const elapsed = Math.min(total, nowMin - activeStart);
  const progress = elapsed / total; // 0..1

  setCurrentDisplay(active, remaining);
  // Mask fills bottom->top as time progresses
  currentMask.style.height = `${Math.round(progress*100)}%`;

  markCards({ activeId: active.id, completedBeforeMin: activeStart, ordered });
}

function markCards({ activeId, completedBeforeMin, ordered }){
  const completedIds = new Set(
    ordered.filter(a => timeToMinutes(a.time) < completedBeforeMin).map(a => a.id)
  );

  document.querySelectorAll(".card").forEach(card => {
    const id = card.dataset.id;
    card.classList.toggle("active", id === activeId);
    card.classList.toggle("completed", completedIds.has(id));
  });
}

function setCurrentDisplay(activity, remainingMinutes){
  if (!activity){
    currentIcon.src = "";
    currentIcon.style.visibility = "hidden";
    currentName.textContent = "-";
    currentRemaining.textContent = "-";
    currentMask.style.height = "0%";
    return;
  }
  currentIcon.style.visibility = "visible";
  currentIcon.src = activity.icon;
  currentName.textContent = activity.name;
  currentRemaining.textContent = formatRemaining(remainingMinutes);
}

/* ------------------ Draggable current activity box ------------------ */

function setupCurrentBoxDrag(){
  // Restore pos
  const saved = safeParse(localStorage.getItem(POS_KEY));
  if (saved && typeof saved.x === "number" && typeof saved.y === "number"){
    moveWithinBoard(currentBox, saved.x, saved.y);
  }

  let dragging = false;
  let startX = 0, startY = 0;
  let boxStartLeft = 0, boxStartTop = 0;

  currentBox.addEventListener("mousedown", (e) => {
    dragging = true;
    startX = e.clientX;
    startY = e.clientY;
    const r = currentBox.getBoundingClientRect();
    boxStartLeft = r.left;
    boxStartTop = r.top;
  });

  window.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    moveWithinBoard(currentBox, boxStartLeft + dx, boxStartTop + dy);
  });

  window.addEventListener("mouseup", () => {
    if (!dragging) return;
    dragging = false;
    const r = currentBox.getBoundingClientRect();
    localStorage.setItem(POS_KEY, JSON.stringify({ x: r.left, y: r.top }));
  });
}

function moveWithinBoard(el, left, top){
  const pad = 8;
  const maxLeft = window.innerWidth - el.offsetWidth - pad;
  const maxTop = window.innerHeight - el.offsetHeight - pad;
  const clampedLeft = clamp(left, pad, maxLeft);
  const clampedTop = clamp(top, pad, maxTop);
  el.style.left = `${clampedLeft}px`;
  el.style.top = `${clampedTop}px`;
}

/* ------------------ Videos ------------------ */

function setupVideos(){
  videoButtons.innerHTML = "";
  VIDEOS.forEach(v => {
    const b = document.createElement("button");
    b.className = "btn btn-yellow";
    b.textContent = v.title;
    b.addEventListener("click", () => openVideoFloat(v.title, v.id));
    videoButtons.appendChild(b);
  });
}

function openVideoFloat(title, youtubeId){
  const frame = document.createElement("div");
  frame.className = "float";
  frame.style.left = "40px";
  frame.style.top = "120px";

  const header = document.createElement("div");
  header.className = "float-header";

  const t = document.createElement("div");
  t.className = "float-title";
  t.textContent = title;

  const close = document.createElement("button");
  close.className = "float-close";
  close.textContent = "✕";
  close.addEventListener("click", () => frame.remove());

  header.appendChild(t);
  header.appendChild(close);

  const body = document.createElement("div");
  body.className = "float-body";

  const iframe = document.createElement("iframe");
  iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
  iframe.allowFullscreen = true;
  iframe.src = `https://www.youtube.com/embed/${encodeURIComponent(youtubeId)}?rel=0`;
  body.appendChild(iframe);

  frame.appendChild(header);
  frame.appendChild(body);
  floatLayer.appendChild(frame);

  // drag
  dragWithinBoard(frame, header);
}

function dragWithinBoard(frame, handle){
  let dragging = false;
  let startX = 0, startY = 0;
  let startL = 0, startT = 0;

  handle.addEventListener("mousedown", (e) => {
    dragging = true;
    startX = e.clientX;
    startY = e.clientY;
    const r = frame.getBoundingClientRect();
    startL = r.left;
    startT = r.top;
    frame.style.zIndex = String(900 + Math.floor(Math.random()*50));
  });

  window.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    const pad = 8;
    const maxLeft = window.innerWidth - frame.offsetWidth - pad;
    const maxTop = window.innerHeight - frame.offsetHeight - pad;
    frame.style.left = `${clamp(startL + dx, pad, maxLeft)}px`;
    frame.style.top = `${clamp(startT + dy, pad, maxTop)}px`;
  });

  window.addEventListener("mouseup", () => dragging = false);
}

/* ------------------ Meetings ------------------ */

function setupMeetings(){
  openMorningSlides.addEventListener("click", () => openNewTab(MEETING_URLS.morning));
  openPowerSchool.addEventListener("click", () => openNewTab(MEETING_URLS.powerschool));
  openAfternoonSlides.addEventListener("click", () => {
    const url = afternoonMeetingUrl();
    if (!url) return;
    openNewTab(url);
  });
}

function updateAfternoonMeetingButton(){
  const url = afternoonMeetingUrl();
  const disabled = !url;

  openAfternoonSlides.disabled = disabled;
  openAfternoonSlides.style.opacity = disabled ? "0.45" : "1";
  openAfternoonSlides.style.cursor = disabled ? "not-allowed" : "pointer";

  if (disabled){
    afternoonHint.textContent = "Afternoon Meeting is disabled on Saturdays and Sundays.";
  } else {
    afternoonHint.textContent = "";
  }
}

function afternoonMeetingUrl(){
  const now = new Date();
  // Use Central Time weekday
  const ct = getCentralParts(now);
  const day = ct.weekday; // 0 Sun..6 Sat
  if (day === 0 || day === 6) return null;
  // Mon/Wed/Fri => MW deck; Tue/Thu => TTh deck
  if (day === 2 || day === 4) return MEETING_URLS.afternoonTTh;
  return MEETING_URLS.afternoonMW;
}

/* ------------------ Edit modal (rename/symbol search) ------------------ */

function setupEditModal(){
  closeEdit.addEventListener("click", () => closeOverlay(editOverlay));
  editOverlay.addEventListener("click", (e) => { if (e.target === editOverlay) closeOverlay(editOverlay); });

  btnSearchCurrent.addEventListener("click", () => {
    const a = state.activities.find(x => x.id === editingId);
    if (!a) return;
    symbolQuery.value = a.name;
    runSymbolSearch(a.name);
  });

  btnChangeName.addEventListener("click", () => {
    const a = state.activities.find(x => x.id === editingId);
    if (!a) return;
    const next = prompt("New activity name:", a.name);
    if (!next) return;
    a.name = next.trim();
    saveState();
    render();
    openEditFor(a.id);
  });

  btnSearchSymbols.addEventListener("click", () => {
    const q = symbolQuery.value.trim();
    runSymbolSearch(q);
  });
}

function openEditFor(id){
  editingId = id;
  const a = state.activities.find(x => x.id === id);
  if (!a) return;
  editTitle.textContent = `Edit: ${a.name}`;
  symbolResults.innerHTML = "";
  symbolError.classList.add("hidden");
  symbolSpinner.classList.add("hidden");
  openOverlay(editOverlay);
}

async function runSymbolSearch(q){
  q = (q || "").trim();
  if (!q){
    symbolError.textContent = "Type something to search.";
    symbolError.classList.remove("hidden");
    return;
  }
  symbolError.classList.add("hidden");
  symbolSpinner.classList.remove("hidden");
  symbolResults.innerHTML = "";

  try{
    const [openSymbols, globalSymbols] = await Promise.allSettled([
      searchOpenSymbols(q),
      searchGlobalSymbols(q),
    ]);

    const candidates = []
      .concat(openSymbols.status === "fulfilled" ? openSymbols.value : [])
      .concat(globalSymbols.status === "fulfilled" ? globalSymbols.value : []);

    const unique = dedupeByUrl(candidates);

    if (unique.length === 0){
      symbolError.textContent = "No symbols found (or blocked by CORS).";
      symbolError.classList.remove("hidden");
      return;
    }

    unique.slice(0, 64).forEach(item => {
      const tile = document.createElement("div");
      tile.className = "symbol";
      const img = document.createElement("img");
      img.src = item.url;
      img.alt = item.label || "";
      tile.appendChild(img);

      tile.addEventListener("click", () => {
        const a = state.activities.find(x => x.id === editingId);
        if (!a) return;
        a.icon = item.url;
        saveState();
        render();
      });

      symbolResults.appendChild(tile);
    });

  } catch (e){
    symbolError.textContent = "Error searching symbols (possibly blocked by CORS).";
    symbolError.classList.remove("hidden");
  } finally{
    symbolSpinner.classList.add("hidden");
  }
}

// Best-effort API calls (may be blocked by CORS or require auth)
async function searchOpenSymbols(q){
  const url = `https://www.opensymbols.org/api/v2/symbols/search?q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { mode: "cors" });
  if (!res.ok) return [];
  const data = await res.json();
  return (Array.isArray(data) ? data : [])
    .map(x => ({ url: x.image_url || x.image || x.url || "", label: x.name || x.label || "OpenSymbols" }))
    .filter(x => !!x.url);
}

async function searchGlobalSymbols(q){
  const url = `https://globalsymbols.com/api/v1/symbols/search?query=${encodeURIComponent(q)}`;
  const res = await fetch(url, { mode: "cors" });
  if (!res.ok) return [];
  const data = await res.json();
  const items = data?.results || data?.symbols || data || [];
  return (Array.isArray(items) ? items : [])
    .map(x => ({ url: x.image_url || x.png || x.url || x.image || "", label: x.name || x.label || "GlobalSymbols" }))
    .filter(x => !!x.url);
}

function dedupeByUrl(items){
  const seen = new Set();
  const out = [];
  for (const it of items){
    const key = String(it.url || "").trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(it);
  }
  return out;
}

/* ------------------ Persistence ------------------ */

function loadState(){
  const saved = safeParse(localStorage.getItem(STORAGE_KEY));
  if (saved?.activities?.length) return saved;
  return { activities: structuredClone(DEFAULT_ACTIVITIES) };
}

function saveState(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/* ------------------ Helpers ------------------ */

function openOverlay(el){ el.classList.remove("hidden"); }
function closeOverlay(el){ el.classList.add("hidden"); }

function openNewTab(url){
  window.open(url, "_blank", "noopener,noreferrer");
}

function uid(){
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }

function safeParse(s){
  try{ return JSON.parse(s); } catch{ return null; }
}

function normalizeTime(v){
  // Accept "7:15", "07:15", "715", "7 15", etc.
  const raw = String(v || "").trim();
  const m = raw.match(/^(\d{1,2})\s*[: ]\s*(\d{2})$/) || raw.match(/^(\d{1,2})(\d{2})$/);
  if (!m) return raw;
  let hh = parseInt(m[1], 10);
  let mm = parseInt(m[2], 10);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return raw;
  hh = clamp(hh, 0, 23);
  mm = clamp(mm, 0, 59);
  // Keep classroom-style (no leading zero)
  return `${hh}:${String(mm).padStart(2,"0")}`;
}

function timeToMinutes(t){
  const [hStr,mStr] = String(t).split(":");
  const h = parseInt(hStr,10);
  const m = parseInt(mStr,10);
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h*60 + m;
}

function minutesToTime(min){
  const h = Math.floor(min/60);
  const m = min%60;
  return `${h}:${String(m).padStart(2,"0")}`;
}

function formatRemaining(mins){
  if (mins == null) return "-";
  if (mins < 60) return `${mins} min remaining`;
  const h = Math.floor(mins/60);
  const m = mins%60;
  if (m === 0) return `${h} hr remaining`;
  return `${h} hr ${m} min remaining`;
}

function formatCentralTime(date, twelveHour){
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: !!twelveHour,
  });
  return fmt.format(date);
}

function getCentralParts(date){
  // Pull parts in America/Chicago, including weekday.
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "short",
  });
  const parts = fmt.formatToParts(date);
  const hour = parseInt(parts.find(p=>p.type==="hour")?.value || "0", 10);
  const minute = parseInt(parts.find(p=>p.type==="minute")?.value || "0", 10);
  const wd = parts.find(p=>p.type==="weekday")?.value || "Sun";
  const weekdayMap = { Sun:0, Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6 };
  const weekday = weekdayMap[wd] ?? 0;
  return { hour, minute, weekday };
}
