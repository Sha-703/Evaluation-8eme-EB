"use client";

import { useState, type FormEvent } from "react";

type Role = "eleve" | "enseignant";
type Mode = "login" | "signup";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [school, setSchool] = useState("");
  const [role, setRole] = useState<Role>("eleve");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleMode = () => {
    setMode(mode === "login" ? "signup" : "login");
    setError("");
    setSuccess("");
    setName("");
    setSchool("");
    setPassword("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim() || !password) {
      setError("Le nom et le mot de passe sont requis.");
      return;
    }

    if (mode === "signup") {
      if (!name.trim()) {
        setError("Le nom complet est requis pour créer un compte.");
        return;
      }
      if (!school.trim()) {
        setError("Le nom de l'école est requis pour créer un compte.");
        return;
      }
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mode,
          name: name.trim(),
          password,
          school: school.trim(),
          role,
        }),
      });

      const result = await response.json();
      if (!response.ok || result.error) {
        setError(result.error || "Impossible de se connecter. Réessaie plus tard.");
        return;
      }

      if (mode === "login") {
        localStorage.setItem("didacticiel-user", JSON.stringify(result.user));
        window.location.href = "/dashboard";
        return;
      }

      setSuccess("Compte créé avec succès. Tu peux maintenant te connecter.");
      setMode("login");
      setPassword("");
      setSchool("");
    } catch (err) {
      setError("Erreur réseau. Vérifie ta connexion.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="page-shell">
      <section className="card auth-card auth-card-transparent">
        <h1>{mode === "login" ? "Connexion" : "Créer un compte"}</h1>
        <p>
          {mode === "login"
            ? "Connecte-toi avec ton nom et ton mot de passe."
            : "Crée un compte pour accéder aux révisions et suivre ta progression."}
        </p>
        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Nom complet
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Entrez votre nom"
              autoComplete="name"
            />
          </label>

          <label>
            Mot de passe
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Ton mot de passe"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </label>

          {mode === "signup" && (
            <label>
              École
              <input
                value={school}
                onChange={(event) => setSchool(event.target.value)}
                placeholder="Nom de ton école"
                autoComplete="organization"
              />
            </label>
          )}

          {mode === "signup" && (
            <div className="role-choice">
              <label>
                <input
                  type="radio"
                  name="role"
                  value="eleve"
                  checked={role === "eleve"}
                  onChange={() => setRole("eleve")}
                />
                Élève
              </label>
              <label>
                <input
                  type="radio"
                  name="role"
                  value="enseignant"
                  checked={role === "enseignant"}
                  onChange={() => setRole("enseignant")}
                />
                Enseignant
              </label>
            </div>
          )}

          {error && <p className="form-error">{error}</p>}
          {success && <p className="form-success">{success}</p>}
          <button type="submit" className="button" disabled={isLoading}>
            {isLoading
              ? mode === "login"
                ? "Connexion..."
                : "Création..."
              : mode === "login"
              ? "Se connecter"
              : "Créer un compte"}
          </button>
          <button type="button" className="button secondary" onClick={handleToggleMode}>
            {mode === "login" ? "Créer un compte" : "J'ai déjà un compte"}
          </button>
        </form>
      </section>
    </main>
  );
}
