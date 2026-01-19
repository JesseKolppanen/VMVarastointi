document.getElementById("loginBtn").addEventListener("click", async () => {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const err = document.getElementById("err");
  err.textContent = "";

  if (!username || !password) {
    err.textContent = "Täytä käyttäjätunnus ja salasana.";
    return;
  }

  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      err.textContent = j.error || "Kirjautuminen epäonnistui.";
      return;
    }

    window.location.href = "index.html";
  } catch (e) {
    err.textContent = "Verkkovirhe.";
  }
});
