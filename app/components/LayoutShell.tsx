"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type User = { name: string; role: "eleve" | "enseignant" };

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const showHeader = !pathname?.startsWith("/login");

  useEffect(() => {
    const saved = localStorage.getItem("didacticiel-user");
    if (saved) {
      setUser(JSON.parse(saved) as User);
    }
  }, []);

  const logout = () => {
    localStorage.removeItem("didacticiel-user");
    window.location.href = "/login";
  };

  return (
    <div className="app-shell">
      {showHeader && (
        <header className="app-header">
          <div className="header-inner">
            <Link href="/dashboard" className="brand">
              Didacticiel 8ème
            </Link>
            <nav className="nav-links">
              <Link href="/dashboard">Accueil</Link>
              {user ? (
                <button type="button" className="button secondary" onClick={logout}>
                  Déconnexion
                </button>
              ) : (
                <Link href="/login">Connexion</Link>
              )}
              {user?.role === "enseignant" && <Link href="/teacher">Enseignant</Link>}
            </nav>
          </div>
        </header>
      )}
      {children}
      <footer className="app-footer">
        <p>Didacticiel 8ème — révision MTIC pour les élèves. Tous droits réservés.</p>
      </footer>
    </div>
  );
}
