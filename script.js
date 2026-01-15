// ===========================
// SUPABASE CONFIG
// ===========================
const SUPABASE_URL = "https://rmjozuznrqtcoeehtlnj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtam96dXpucnF0Y29lZWh0bG5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwOTk4NTEsImV4cCI6MjA3OTY3NTg1MX0.E7Wmvweiua24yXb2NCy6XoQjjElDTpis3n_Somp9_Ek";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===========================
// UI ELEMENTS
// ===========================
const authSection = document.getElementById("auth");
const agendaSection = document.getElementById("agenda");

const authStatus = document.getElementById("authStatus");
const userEmailSpan = document.getElementById("userEmail");

const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const signupEmail = document.getElementById("signupEmail");
const signupPassword = document.getElementById("signupPassword");

const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");
const logoutBtn = document.getElementById("logoutBtn");
const logoutBtn2 = document.getElementById("logoutBtn2");
const forgotPasswordLink = document.getElementById("forgotPasswordLink");

const saveTimetableBtn = document.getElementById("saveTimetableBtn");

const listaCompiti = document.getElementById("listaCompiti");
const listaAppunti = document.getElementById("listaAppunti");

// ===========================
// HELPERS
// ===========================
function setStatus(msg, isError = false) {
  authStatus.textContent = msg || "";
  authStatus.style.color = isError ? "#b52b27" : "#1b6b2a";
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function requireUser(session) {
  const user = session?.user;
  if (!user) throw new Error("Non autenticato");
  return user;
}

// ===========================
// TABS
// ===========================
document.querySelectorAll(".tab-buttons button[data-tab]").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".tab-buttons button").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(sec => sec.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
  };
});

// ===========================
// TIMETABLE GRID: 6 hours x 5 days
// ===========================
const tbody = document.querySelector("#tabellaOrario tbody");
const DAYS = [
  { label: "Lunedì", value: 1 },
  { label: "Martedì", value: 2 },
  { label: "Mercoledì", value: 3 },
  { label: "Giovedì", value: 4 },
  { label: "Venerdì", value: 5 },
];

function buildTimetableGrid(hours = 6) {
  tbody.innerHTML = "";
  for (let hour = 1; hour <= hours; hour++) {
    const tr = document.createElement("tr");
    tr.innerHTML =
      `<th>${hour}ª ora</th>` +
      DAYS.map(d => `<td><input type="text" data-day="${d.value}" data-hour="${hour}" placeholder="Materia..."></td>`).join("");
    tbody.appendChild(tr);
  }
}
buildTimetableGrid(6);

// ===========================
// DATA: TIMETABLE
// ===========================
async function loadTimetable() {
  const { data: sessionData } = await supabaseClient.auth.getSession();
  const user = requireUser(sessionData.session);

  const { data, error } = await supabaseClient
    .from("timetable")
    .select("day_of_week, hour, subject")
    .eq("user_id", user.id);

  if (error) throw error;

  // reset inputs
  document.querySelectorAll('#tabellaOrario input[type="text"]').forEach(inp => (inp.value = ""));

  (data || []).forEach(row => {
    const input = document.querySelector(
      `#tabellaOrario input[data-day="${row.day_of_week}"][data-hour="${row.hour}"]`
    );
    if (input) input.value = row.subject || "";
  });
}

async function saveTimetable() {
  const { data: sessionData } = await supabaseClient.auth.getSession();
  const user = requireUser(sessionData.session);

  const inputs = Array.from(document.querySelectorAll('#tabellaOrario input[type="text"]'));

  const rows = inputs.map(inp => ({
    user_id: user.id,
    day_of_week: Number(inp.dataset.day),
    hour: Number(inp.dataset.hour),
    subject: (inp.value || "").trim(),
  }));

  const { error } = await supabaseClient
    .from("timetable")
    .upsert(rows, { onConflict: "user_id,day_of_week,hour" });

  if (error) throw error;
}

saveTimetableBtn.onclick = async () => {
  try {
    await saveTimetable();
    alert("Orario salvato!");
  } catch (err) {
    alert("Errore salvataggio orario: " + err.message);
  }
};

// ===========================
// DATA: TASKS
// ===========================
async function loadTasks() {
  const { data: sessionData } = await supabaseClient.auth.getSession();
  const user = requireUser(sessionData.session);

  const { data, error } = await supabaseClient
    .from("tasks")
    .select("id, subject, text, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  listaCompiti.innerHTML = (data || [])
    .map(item => `
      <li>
        <span class="materia-tag">${escapeHtml(item.subject)}</span>
        <span class="descrizione">${escapeHtml(item.text)}</span>
        <button class="delete-btn" data-id="${item.id}" title="Elimina">🗑️</button>
      </li>
    `)
    .join("");

  listaCompiti.querySelectorAll("button.delete-btn").forEach(btn => {
    btn.onclick = async () => {
      if (!confirm("Eliminare questo compito?")) return;
      const id = btn.dataset.id;

      const { error: delErr } = await supabaseClient
        .from("tasks")
        .delete()
        .eq("id", id);

      if (delErr) return alert("Errore eliminazione: " + delErr.message);
      await loadTasks();
    };
  });
}

async function addTask(subject, text) {
  const { data: sessionData } = await supabaseClient.auth.getSession();
  const user = requireUser(sessionData.session);

  const { error } = await supabaseClient.from("tasks").insert({
    user_id: user.id,
    subject,
    text,
  });

  if (error) throw error;
}

document.getElementById("formCompiti").onsubmit = async (e) => {
  e.preventDefault();
  const subject = document.getElementById("materiaCompiti").value.trim();
  const text = document.getElementById("compito").value.trim();
  if (!subject || !text) return alert("Inserisci materia e descrizione!");

  try {
    await addTask(subject, text);
    e.target.reset();
    await loadTasks();
  } catch (err) {
    alert("Errore: " + err.message);
  }
};

// ===========================
// DATA: NOTES
// ===========================
async function loadNotes() {
  const { data: sessionData } = await supabaseClient.auth.getSession();
  const user = requireUser(sessionData.session);

  const { data, error } = await supabaseClient
    .from("notes")
    .select("id, subject, text, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  listaAppunti.innerHTML = (data || [])
    .map(item => `
      <li>
        <span class="materia-tag">${escapeHtml(item.subject)}</span>
        <span class="descrizione">${escapeHtml(item.text)}</span>
        <button class="delete-btn" data-id="${item.id}" title="Elimina">🗑️</button>
      </li>
    `)
    .join("");

  listaAppunti.querySelectorAll("button.delete-btn").forEach(btn => {
    btn.onclick = async () => {
      if (!confirm("Eliminare questo appunto?")) return;
      const id = btn.dataset.id;

      const { error: delErr } = await supabaseClient
        .from("notes")
        .delete()
        .eq("id", id);

      if (delErr) return alert("Errore eliminazione: " + delErr.message);
      await loadNotes();
    };
  });
}

async function addNote(subject, text) {
  const { data: sessionData } = await supabaseClient.auth.getSession();
  const user = requireUser(sessionData.session);

  const { error } = await supabaseClient.from("notes").insert({
    user_id: user.id,
    subject,
    text,
  });

  if (error) throw error;
}

document.getElementById("formAppunti").onsubmit = async (e) => {
  e.preventDefault();
  const subject = document.getElementById("materiaAppunti").value.trim();
  const text = document.getElementById("appunto").value.trim();
  if (!subject || !text) return alert("Inserisci materia e testo!");

  try {
    await addNote(subject, text);
    e.target.reset();
    await loadNotes();
  } catch (err) {
    alert("Errore: " + err.message);
  }
};

// ===========================
// AUTH: sign up / login / logout / reset password
// ===========================
signupBtn.onclick = async () => {
  setStatus("");
  const email = signupEmail.value.trim();
  const password = signupPassword.value.trim();

  if (!email || !password) return setStatus("Inserisci email e password.", true);
  if (password.length < 6) return setStatus("Password troppo corta (min 6).", true);

  // Supabase userà questo come redirect dopo conferma email / reset password
  const emailRedirectTo = window.location.origin;

  const { error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: { emailRedirectTo },
  });

  if (error) return setStatus("Errore registrazione: " + error.message, true);

  setStatus("Registrazione OK. Controlla la mail per verificare l’account.");
};

loginBtn.onclick = async () => {
  setStatus("");
  const email = loginEmail.value.trim();
  const password = loginPassword.value.trim();

  if (!email || !password) return setStatus("Inserisci email e password.", true);

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) return setStatus("Errore login: " + error.message, true);

  setStatus("");
};

async function doLogout() {
  await supabaseClient.auth.signOut();
}

logoutBtn.onclick = doLogout;
logoutBtn2.onclick = doLogout;

forgotPasswordLink.onclick = async (e) => {
  e.preventDefault();
  setStatus("");

  const email = loginEmail.value.trim();
  if (!email) return setStatus("Inserisci la tua email nel campo login per resettare la password.", true);

  const redirectTo = window.location.origin;
  const { error } = await supabaseClient.auth.resetPasswordForEmail(email, { redirectTo });

  if (error) return setStatus("Errore reset password: " + error.message, true);
  setStatus("Mail di reset inviata. Controlla la posta.");
};

// ===========================
// SESSION -> UI + LOAD DATA
// ===========================
async function refreshUIBySession() {
  const { data } = await supabaseClient.auth.getSession();
  const session = data.session;

  if (!session) {
    authSection.style.display = "block";
    agendaSection.style.display = "none";
    logoutBtn.style.display = "none";
    return;
  }

  authSection.style.display = "none";
  agendaSection.style.display = "block";
  logoutBtn.style.display = "inline-block";

  userEmailSpan.textContent = session.user.email;

  // carica dati utente
  await loadTimetable();
  await loadTasks();
  await loadNotes();
}

supabaseClient.auth.onAuthStateChange(async () => {
  try {
    await refreshUIBySession();
  } catch (err) {
    setStatus("Errore sessione: " + err.message, true);
  }
});

window.onload = async () => {
  try {
    await refreshUIBySession();
  } catch (err) {
    setStatus("Errore inizializzazione: " + err.message, true);
  }
};
