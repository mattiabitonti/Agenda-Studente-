const loginDiv = document.getElementById("login");
const agendaDiv = document.getElementById("agenda");

if (localStorage.getItem("utente")) mostraAgenda();

document.getElementById("loginBtn").onclick = () => {
  const u = username.value.trim();
  const p = password.value.trim();
  if (!u || !p) return alert("Inserisci dati");
  localStorage.setItem("utente", u);
  mostraAgenda();
};

document.getElementById("logout").onclick = () => {
  localStorage.clear();
  location.reload();
};

function mostraAgenda() {
  loginDiv.style.display = "none";
  agendaDiv.style.display = "block";
}

document.querySelectorAll("[data-tab]").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));
    document.getElementById(btn.dataset.tab).classList.add("active");
  };
});

const tbody = document.querySelector("#tabellaOrario tbody");
for (let i = 1; i <= 6; i++) {
  const tr = document.createElement("tr");
  tr.innerHTML = `<th>${i}ª</th>` +
    Array(5).fill(0).map((_,j) =>
      `<td><input id="c-${i}-${j}"></td>`).join("");
  tbody.appendChild(tr);
}

function salvaOrario() {
  const data = {};
  document.querySelectorAll("input[id^='c-']").forEach(i => data[i.id] = i.value);
  localStorage.setItem("orario", JSON.stringify(data));
  alert("Salvato!");
}

function caricaOrario() {
  const d = JSON.parse(localStorage.getItem("orario") || "{}");
  Object.entries(d).forEach(([k,v]) => {
    const el = document.getElementById(k);
    if (el) el.value = v;
  });
}

function lista(form, input, lista, key, materia) {
  let items = JSON.parse(localStorage.getItem(key) || "[]");

  const render = () => {
    lista.innerHTML = items.map((o,i)=>`
      <li>
        <b>${o.m}</b> - ${o.t}
        <button class="delete-btn" onclick="del(${i},'${key}')">🗑</button>
      </li>`).join("");
  };

  form.onsubmit = e => {
    e.preventDefault();
    if (!materia.value || !input.value) return;
    items.push({m:materia.value,t:input.value});
    localStorage.setItem(key, JSON.stringify(items));
    render();
    form.reset();
  };

  render();
}

window.del = (i,key)=>{
  const items = JSON.parse(localStorage.getItem(key));
  items.splice(i,1);
  localStorage.setItem(key,JSON.stringify(items));
  location.reload();
};

window.onload = () => {
  caricaOrario();
  lista(formCompiti, compito, listaCompiti, "compiti", materiaCompiti);
  lista(formAppunti, appunto, listaAppunti, "appunti", materiaAppunti);
};
