// server.js
const express = require("express");
const fs = require("fs");
const path = require("path");
const session = require("express-session");

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, "data.json");

app.use(express.json());

// Session (vaihda salaisuus omaan arvoon tuotannossa!)
app.use(
  session({
    secret: "VAIHDA_TAMA_SALAISUUS",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 7 * 24 * 3600 * 1000 }, // 7 päivää
  })
);

// Alusta data.json tarvittaessa
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(
    DATA_FILE,
    JSON.stringify(
      {
        people: [],
        items: [],
        users: [
          { username: "admin", password: "admin123", role: "admin" },
          { username: "kayttaja", password: "testi", role: "user" }
        ]
      },
      null,
      2
    )
  );
}

// Apurit
function readData() {
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}
function writeData(d) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2));
}

// 🔐 Suojaa kaikki sivut paitsi kirjautuminen ja API-login-reitit
app.use((req, res, next) => {
  const publicPaths = [
    "/login.html",
    "/login.js",
    "/favicon.ico",
  ];
  const isPublic =
    publicPaths.includes(req.path) ||
    req.path.startsWith("/api/login") ||
    req.path.startsWith("/api/me") ||
    req.path.startsWith("/api/logout");

  const isAsset =
    req.path.endsWith(".css") ||
    req.path.endsWith(".js") ||
    req.path.endsWith(".png") ||
    req.path.endsWith(".jpg") ||
    req.path.endsWith(".svg");

  // Staattiset assetit sallitaan kirjautuneille tai login-sivulle
  if (isPublic) return next();
  if (req.session.user) return next();
  if (isAsset) return res.redirect("/login.html");

  // Muut pyynnöt ohjataan kirjautumiseen
  return res.redirect("/login.html");
});

// Palvele staattiset tiedostot
app.use(express.static(__dirname));

// --- Auth API ---
app.post("/api/login", (req, res) => {
  const { username, password } = req.body || {};
  const data = readData();
  const user = (data.users || []).find(
    (u) => u.username === username && u.password === password
  );
  if (!user) return res.status(401).json({ error: "Väärä käyttäjätunnus tai salasana" });

  req.session.user = { username: user.username, role: user.role };
  res.json({ ok: true, user: req.session.user });
});

app.get("/api/me", (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: "Ei kirjautunut" });
  res.json(req.session.user);
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

// --- Data API ---
// Kaikki kirjautuneet saavat lukea
app.get("/api/data", (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: "Ei kirjautunut" });
  const data = readData();
  res.json(data);
});

// Vain admin saa kirjoittaa (muokata)
app.post("/api/data", (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: "Ei kirjautunut" });
  if (req.session.user.role !== "admin")
    return res.status(403).json({ error: "Ei oikeuksia" });

  const incoming = req.body || {};
  // Säilytetään users-lista, ellei sitä lähetetä tarkoituksella mukana
  const data = readData();
  const merged = {
    users: data.users || [],
    people: incoming.people || [],
    items: incoming.items || [],
  };
  writeData(merged);
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`✅ Serveri käynnissä: http://localhost:${PORT}`);
});
