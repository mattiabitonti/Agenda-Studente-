const loginDiv = document.getElementById("login");
const agendaDiv = document.getElementById("agenda");
const savedUser = localStorage.getItem("utente");

if (savedUser) mostraAgenda();

document.getElementById("loginBtn").onclick = () => {
  const user = document.getElementById("username").value.trim();
  const pass = document.getElementById("password").value.trim();
  if (!user || !pass) return alert("Inserisci utente e password!");
  localStorage.setItem("utente", user);
  mostraAgenda();
};

document.getElementById("logout").onclick = () => {
  localStorage.removeItem("utente");
  location.reload();
};

function mostraAgenda() {
  loginDiv.style.display = "none";
  agendaDiv.style.display = "block";
}

document.querySelectorAll(".tab-buttons button[data-tab]").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".tab-buttons button").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(sec => sec.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
  };
});

const tbody = document.querySelector("#tabellaOrario tbody");
for (let ora = 1; ora <= 6; ora++) {
  const riga = document.createElement("tr");
  riga.innerHTML =
    `<th>${ora}ª ora</th>` +
    Array(5).fill(0)
      .map((_, i) => `<td><input type="text" id="cell-${ora}-${i+1}" placeholder="Materia..."></td>`)
      .join("");
  tbody.appendChild(riga);
}

function salvaOrario() {
  const orario = {};
  document.querySelectorAll("#tabellaOrario input").forEach(c => orario[c.id] = c.value);
  localStorage.setItem("orario", JSON.stringify(orario));
  alert("✅ Orario salvato!");
}

function caricaOrario() {
  const dati = JSON.parse(localStorage.getItem("orario") || "{}");
  Object.entries(dati).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.value = val;
  });
}

function gestisciLista(formId, textId, listaId, storageKey, materiaId) {

  const form = document.getElementById(formId);
  const input = document.getElementById(textId);
  const materiaSel = document.getElementById(materiaId);
  const lista = document.getElementById(listaId);

  let items = JSON.parse(localStorage.getItem(storageKey) || "[]");

  const aggiornaLista = () => {
    lista.innerHTML = items.map((obj, i) => `
      <li>
        <span class="materia-tag">${obj.materia}</span>
        <span class="descrizione">${obj.testo}</span>
        <button class="delete-btn" onclick="rimuoviItem(${i}, '${storageKey}', '${listaId}')">🗑️</button>
      </li>
    `).join("");
  };

  const salva = () => localStorage.setItem(storageKey, JSON.stringify(items));

  form.onsubmit = e => {
    e.preventDefault();

    const mat = materiaSel.value.trim();
    const txt = input.value.trim();

    if (!mat || !txt) return alert("Inserisci materia e testo!");

    items.push({ materia: mat, testo: txt });
    salva();
    aggiornaLista();
    form.reset();
  };

  aggiornaLista();
}

window.rimuoviItem = (i, storageKey, listaId) => {
  if (!confirm("Eliminare questo elemento?")) return;

  let items = JSON.parse(localStorage.getItem(storageKey) || "[]");
  items.splice(i, 1);

  localStorage.setItem(storageKey, JSON.stringify(items));

  const lista = document.getElementById(listaId);
  lista.innerHTML = items.map((obj, j) => `
    <li>
      <span class="materia-tag">${obj.materia}</span>
      <span class="descrizione">${obj.testo}</span>
      <button class="delete-btn" onclick="rimuoviItem(${j}, '${storageKey}', '${listaId}')">🗑️</button>
    </li>
  `).join("");
};

window.onload = () => {
  caricaOrario();
  gestisciLista("formCompiti","compito","listaCompiti","compiti","materiaCompiti");
  gestisciLista("formAppunti","appunto","listaAppunti","appunti","materiaAppunti");
};
