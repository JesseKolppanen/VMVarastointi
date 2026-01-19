let state = { people: [], items: [] };
let currentCategoryFilter = ""; // 🔹 mikä kategoria on valittu suodattimessa

const $ = (id) => document.getElementById(id);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,8);

// --- Palvelin-tallennus ---
async function loadData() {
  const res = await fetch("/api/data");
  state = await res.json();
  renderPeople();
  renderItems();
}

async function saveData() {
  await fetch("/api/data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(state),
  });
}

// --- Renderöinti ---
function renderPeople() {
  const list = $("peopleList"); 
  list.innerHTML="";
  state.people.forEach(p => {
    const el = document.createElement("div"); 
    el.className="card"; 
    el.textContent=p.name;
    list.appendChild(el);
  });
  populateAssignPerson();
}

function renderItems() {
  const list = $("itemList"); 
  list.innerHTML="";
  state.items.forEach(it => {
    const el = document.createElement("div"); 
    el.className="card"; 
    el.innerHTML = `<b>${it.name}</b> (${it.category}) 
      <span class="pill">${it.addedAt}</span>
      <button style="float:right;" onclick="removeItem('${it.id}')">Poista</button>`;
    list.appendChild(el);
  });
  populateAssignItem();
  populateFilterCategory();   // 🔹 päivitä kategoriafiltterin vaihtoehdot
  renderRightItems();
}

function renderRightItems() {
  const list = $("rightItemList"); 
  list.innerHTML="";
  state.items.forEach(it => {
    // 🔹 jos filtteri päällä ja ei täsmää kategoriaan, ohita
    if (currentCategoryFilter && it.category !== currentCategoryFilter) return;

    const owner = state.people.find(p=>p.id===it.ownerId);
    const el = document.createElement("div"); 
    el.className="card";
    el.innerHTML = `${it.name} (${it.category}) - Omistaja: ${owner ? owner.name : "Ei omistajaa"} 
      <span class="pill">${it.assignedAt || ""}</span>
      ${it.ownerId ? `<button style="float:right;" onclick="removeOwner('${it.id}')">Poista omistajuus</button>` : ""}`;
    list.appendChild(el);
  });
}

function populateAssignPerson() {
  const sel = $("assignPerson"); 
  sel.innerHTML='<option value="">Valitse henkilö...</option>';
  state.people.forEach(p => {
    const o = document.createElement("option"); 
    o.value=p.id; 
    o.textContent=p.name;
    sel.appendChild(o);
  });
}

function populateAssignItem() {
  const sel = $("assignItem"); 
  sel.innerHTML='<option value="">Valitse tavara...</option>';
  state.items.forEach(it => {
    const o = document.createElement("option"); 
    o.value=it.id; 
    o.textContent=it.name;
    sel.appendChild(o);
  });
}

// 🔹 Täytetään kategoriasuodattimen vaihtoehdot
function populateFilterCategory() {
  const sel = $("filterCategory");
  if (!sel) return;

  const previous = sel.value; // yritetään säilyttää valinta
  const categories = [...new Set(state.items.map(it => it.category))]  // uniikit
    .filter(Boolean)
    .sort((a,b)=>a.localeCompare(b,"fi"));

  sel.innerHTML = '<option value="">Kaikki</option>';
  categories.forEach(cat => {
    const o = document.createElement("option");
    o.value = cat;
    o.textContent = cat;
    sel.appendChild(o);
  });

  // jos entinen valinta vielä olemassa, pidetään se
  if (categories.includes(previous)) {
    sel.value = previous;
    currentCategoryFilter = previous;
  } else {
    sel.value = "";
    currentCategoryFilter = "";
  }
}

// --- Toiminnot ---
function addPerson(name) {
  if(!name.trim()) return;
  state.people.push({id:uid(), name:name.trim()});
  renderPeople(); 
  renderItems(); 
  saveData();
}

function addItem(name,cat) {
  if(!name.trim()) return;
  const now = new Date().toLocaleString();
  state.items.push({id:uid(), name:name.trim(), category:cat, ownerId:null, addedAt:now, assignedAt:null});
  renderItems(); 
  saveData();
}

function assign() {
  const itemId=$("assignItem").value;
  const personId=$("assignPerson").value;
  if(!itemId) return;
  const it = state.items.find(x=>x.id===itemId); 
  it.ownerId = personId || null;
  it.assignedAt = personId ? new Date().toLocaleString() : null;
  renderItems(); 
  saveData();
}

function removeItem(id) {
  state.items = state.items.filter(it=>it.id!==id);
  renderItems(); 
  saveData();
}

function removeOwner(id) {
  const it = state.items.find(it=>it.id===id);
  if(it) { 
    it.ownerId = null; 
    it.assignedAt = null; 
  }
  renderItems(); 
  saveData();
}

function resetAll() {
  state = { people: [], items: [] };
  renderPeople(); 
  renderItems(); 
  saveData();
}

// --- Käynnistys ---
document.addEventListener("DOMContentLoaded",()=>{
  loadData();

  $("addPersonBtn").addEventListener("click",()=>{ 
    addPerson($("personName").value); 
    $("personName").value=""; 
  });

  $("addItemBtn").addEventListener("click",()=>{ 
    addItem($("itemName").value,$("itemCategory").value); 
    $("itemName").value=""; 
  });

  $("assignBtn").addEventListener("click", assign);

  $("resetBtn").addEventListener("click", ()=>{
    if(confirm("Haluatko varmasti poistaa kaikki tiedot?")){
      resetAll();
    }
  });

  const calBtn = $("calendarBtn");
  if (calBtn) {
    calBtn.addEventListener("click", () => {
      window.location.href = "calendar.html";
    });
  }

  const filterSel = $("filterCategory");
  if (filterSel) {
    filterSel.addEventListener("change", () => {
      currentCategoryFilter = filterSel.value;
      renderRightItems();
    });
  }
});
