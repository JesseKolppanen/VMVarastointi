document.addEventListener("DOMContentLoaded", () => {
  const cal = document.getElementById("calendar");
  const monthName = document.getElementById("monthName");
  const today = new Date();
  let currentMonth = today.getMonth();
  let currentYear = today.getFullYear();
  let state = { items: [], people: [] };

  // Modal
  const modal = document.getElementById("dayModal");
  const modalDate = document.getElementById("modalDate");
  const modalReservations = document.getElementById("modalReservations");
  const closeModal = document.getElementById("closeModal");
  const modalItemSelect = document.getElementById("modalItemSelect");
  const modalPersonSelect = document.getElementById("modalPersonSelect");
  const addReservationBtn = document.getElementById("addReservationBtn");

  closeModal.addEventListener("click", () => { modal.style.display = "none"; });

  // Lataa data palvelimelta
  fetch("/api/data")
    .then(res => res.json())
    .then(data => {
      state = data;
      renderCalendar();
    });

  function saveData(callback) {
    fetch("/api/data", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify(state)
    }).then(() => { if(callback) callback(); });
  }

  function renderCalendar() {
    cal.innerHTML = "";
    const months = ["Tammikuu","Helmikuu","Maaliskuu","Huhtikuu","Toukokuu","Kesäkuu","Heinäkuu","Elokuu","Syyskuu","Lokakuu","Marraskuu","Joulukuu"];
    monthName.textContent = `${months[currentMonth]} ${currentYear}`;

    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDay = firstDay.getDay() === 0 ? 7 : firstDay.getDay();

    for(let i=1;i<startDay;i++) cal.appendChild(document.createElement("div"));

    for(let d=1; d<=lastDay.getDate(); d++){
      const date = new Date(currentYear,currentMonth,d);
      const dateStr = date.toISOString().split("T")[0];
      const dayDiv = document.createElement("div");
      dayDiv.className = "day";
      if(d===today.getDate() && currentMonth===today.getMonth() && currentYear===today.getFullYear()) dayDiv.classList.add("today");
      dayDiv.innerHTML = `<strong>${d}.${currentMonth+1}</strong>`;

      // pienen preview varaukset
      state.items.forEach(it=>{
        if(!it.reservations) return;
        it.reservations.filter(r=>r.date===dateStr).forEach(r=>{
          const owner = state.people.find(p=>p.id===r.userId);
          const div = document.createElement("div");
          div.className = "reservation-preview";
          div.textContent = `${it.name} - ${owner?owner.name:"?"}`;
          dayDiv.appendChild(div);
        });
      });

      // Klikkaa päivää → modal
      dayDiv.addEventListener("click",()=>{
        modal.style.display = "flex";
        modalDate.textContent = `Varaukset: ${d}.${currentMonth+1}.${currentYear}`;
        modalReservations.innerHTML = "";

        // Täytä dropdownit modalissa
        modalItemSelect.innerHTML = '<option value="">Valitse tavara</option>';
        modalPersonSelect.innerHTML = '<option value="">Valitse henkilö</option>';
        state.items.forEach(it=>{
          const o=document.createElement("option");
          o.value=it.id;
          o.textContent=it.name;
          modalItemSelect.appendChild(o);
        });
        state.people.forEach(p=>{
          const o=document.createElement("option");
          o.value=p.id;
          o.textContent=p.name;
          modalPersonSelect.appendChild(o);
        });

        // Näytä varaukset modalissa
        state.items.forEach(it=>{
          if(!it.reservations) return;
          it.reservations.filter(r=>r.date===dateStr).forEach((r,i)=>{
            const owner = state.people.find(p=>p.id===r.userId);
            const li = document.createElement("li");
            li.textContent = `${it.name} - ${owner?owner.name:"?"}`;

            const delBtn = document.createElement("button");
            delBtn.textContent = "Poista";
            delBtn.addEventListener("click",()=>{
              it.reservations.splice(i,1);
              saveData(()=>renderCalendar());
              li.remove();
            });
            li.appendChild(delBtn);
            modalReservations.appendChild(li);
          });
        });

        // Lisää varaus modalista
        addReservationBtn.onclick = ()=>{
          const itemId = modalItemSelect.value;
          const personId = modalPersonSelect.value;
          if(!itemId || !personId){ alert("Valitse tavara ja henkilö!"); return; }
          const item = state.items.find(i=>i.id==itemId);
          if(!item.reservations) item.reservations=[];
          const isoDate = dateStr;
          const exists = item.reservations.find(r=>r.date===isoDate);
          if(exists){ alert("Tämä tavara on jo varattu tälle päivälle!"); return; }
          item.reservations.push({date:isoDate,userId:personId});
          saveData(()=>renderCalendar());

          // Päivitä modalin lista heti
          const owner = state.people.find(p=>p.id===personId);
          const li = document.createElement("li");
          li.textContent = `${item.name} - ${owner ? owner.name : "?"}`;
          const delBtn = document.createElement("button");
          delBtn.textContent = "Poista";
          delBtn.addEventListener("click",()=>{
            item.reservations = item.reservations.filter(r=>!(r.date===isoDate && r.userId===personId));
            saveData(()=>renderCalendar());
            li.remove();
          });
          li.appendChild(delBtn);
          modalReservations.appendChild(li);
        };
      });

      cal.appendChild(dayDiv);
    }
  }

  document.getElementById("prevMonth").addEventListener("click",()=>{
    currentMonth--;
    if(currentMonth<0){currentMonth=11; currentYear--;}
    renderCalendar();
  });

  document.getElementById("nextMonth").addEventListener("click",()=>{
    currentMonth++;
    if(currentMonth>11){currentMonth=0; currentYear++;}
    renderCalendar();
  });

  document.getElementById("backBtn").addEventListener("click",()=>{ window.location.href="index.html"; });
});
